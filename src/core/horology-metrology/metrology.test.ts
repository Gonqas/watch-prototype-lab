import { describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { quantity } from '../horology-engineering'
import {
  calibrateImage,
  circleThroughThreePoints,
  calculateMeasurementStatistics,
  compareNominalAndMeasured,
  createCandidatePatch,
  createMetrologyMetadataBackup,
  createMetrologyId,
  declareMeasurementUncertainty,
  resolveSeriesResult,
  stableSerialize,
  previewMetrologyMetadataRestore,
  restoreMetrologyMetadataBackup,
  transitionGeometryProposal,
  evaluateReconstructionGate,
  highestReconstructionGate,
  measureImageAnnotation,
  polygonArea,
  executeCadCandidatePlan,
  prepareCadCandidatePlan,
  rollbackCadCandidatePlan,
  validateFinding,
  validateInstrument,
  validateSpecimen,
  SYNTHETIC_EDUCATIONAL_SPECIMEN,
  type GeometryCorrectionProposal,
  type MeasurementReading,
  type MeasurementSeries,
  type PhysicalSpecimen,
  IndexedDbHorologyMetrologyRepository,
} from '.'

const timestamp = '2026-08-02T10:00:00.000Z'

function reading(sequence: number, value: number, discarded = false, discardReason?: string): MeasurementReading {
  return {
    schemaVersion: 1,
    id: `metrology.measurement-reading.r${sequence}`,
    profileId: 'profile.local',
    specimenId: 'specimen.one',
    seriesId: 'metrology.measurement-series.series',
    sequence,
    value: quantity(value, 'mm', 'measured'),
    capturedAt: timestamp,
    operator: 'Perfil local',
    orientation: 'plano A',
    conditions: { temperature: '20 °C no verificados' },
    discarded,
    ...(discardReason ? { discardReason } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
    recordVersion: 1,
  }
}

describe('horology metrology domain', () => {
  it('creates stable untranslated ids and deterministic JSON', () => {
    expect(createMetrologyId('specimen', ['Perfil local', 'Unidad 1']))
      .toBe(createMetrologyId('specimen', ['Perfil local', 'Unidad 1']))
    expect(stableSerialize({ z: 1, a: { y: 2, b: 3 } })).toBe('{"a":{"b":3,"y":2},"z":1}')
    expect(SYNTHETIC_EDUCATIONAL_SPECIMEN.reality).toBe('simulation-only')
    expect(SYNTHETIC_EDUCATIONAL_SPECIMEN.calibreOrReference).toBeUndefined()
  })

  it('backs up metadata with explicit binary omissions and requires restore confirmation', async () => {
    const repository = new IndexedDbHorologyMetrologyRepository('metrology-backup-test', new IDBFactory())
    await repository.initialize()
    const specimen: PhysicalSpecimen = {
      schemaVersion: 1, id: 'metrology.specimen.backup', profileId: 'profile.local', stableIdentifier: 'backup-unit',
      displayName: 'Unidad backup', kind: 'movement', ownership: 'owned', condition: 'as-received', notes: '', tags: [],
      linkedProjectIds: [], linkedFixtureIds: [], privacy: 'private', createdAt: timestamp, updatedAt: timestamp, recordVersion: 1,
    }
    await repository.put('physical_specimens', specimen)
    const backup = await createMetrologyMetadataBackup(repository, 'profile.local')
    expect(previewMetrologyMetadataRestore(backup)).toMatchObject({ recordCount: 1, requiresConfirmation: true })
    await expect(restoreMetrologyMetadataBackup(repository, backup, false)).rejects.toThrow(/confirmación/)
    await restoreMetrologyMetadataBackup(repository, backup, true)
    expect(await repository.get('physical_specimens', specimen.id)).toEqual(specimen)
  })

  it('keeps discarded readings but excludes them only with a reason', () => {
    const readings = [reading(1, 10), reading(2, 10.02), reading(3, 99, true, 'Error de transcripción observado')]
    const statistics = calculateMeasurementStatistics(readings)
    expect(statistics.count).toBe(3)
    expect(statistics.adoptedCount).toBe(2)
    expect(statistics.mean?.value).toBeCloseTo(10.01)
    expect(() => calculateMeasurementStatistics([reading(1, 10, true)])).toThrow(/sin motivo/)
  })

  it('does not infer accuracy from resolution and labels declared uncertainty honestly', () => {
    const uncertainty = declareMeasurementUncertainty({
      unit: 'mm',
      resolution: quantity(0.01, 'mm', 'official'),
      repeatability: quantity(0.004, 'mm', 'measured'),
      coverageFactor: 2,
    })
    expect(uncertainty.gumCompliant).toBe(false)
    expect(uncertainty.components.map(({ source }) => source)).toEqual(['resolution', 'repeatability'])
    expect(uncertainty.expandedUncertainty.value).toBeGreaterThan(0)
    expect(() => validateInstrument({
      schemaVersion: 1,
      id: 'metrology.instrument.caliper',
      profileId: 'profile.local',
      displayName: 'Calibre',
      type: 'caliper',
      resolution: quantity(0.01, 'mm', 'official'),
      statedAccuracy: quantity(0.01, 'mm', 'estimated'),
      measurementDimensions: ['length'],
      lastKnownCondition: 'unknown',
      privacy: 'private',
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    })).toThrow(/no puede inferirse/)
  })

  it('calibrates only a 2D scale and never invents depth', () => {
    const calibration = calibrateImage({
      schemaVersion: 1,
      id: 'metrology.image-calibration.scale',
      profileId: 'profile.local',
      specimenId: 'specimen.one',
      imageAssetId: 'metrology.image.photo',
      method: 'known-distance',
      pixelDistance: 500,
      physicalDistance: 10,
      physicalUnit: 'mm',
      assumptions: ['La referencia está en el mismo plano.'],
      limitations: ['No permite medir profundidad.'],
      calibratedAt: timestamp,
      operator: 'Perfil local',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    })
    expect(calibration.pixelsPerUnit).toBe(50)
    expect(calibration.limitations).toContain('No permite medir profundidad.')
    expect(measureImageAnnotation('distance', [{ x: 0, y: 0 }, { x: 300, y: 400 }], calibration)).toMatchObject({ value: 10, unit: 'mm', valid: true })
    expect(measureImageAnnotation('diameter-circle', [{ x: 0, y: 0 }, { x: 50, y: 0 }], calibration)).toMatchObject({ value: 2, unit: 'mm', valid: true })
    expect(measureImageAnnotation('angle', [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }])).toMatchObject({ value: 90, unit: 'deg', valid: true })
    expect(measureImageAnnotation('area', [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], calibration)).toMatchObject({ value: 2, unit: 'mm2', valid: true })
    expect(measureImageAnnotation('tooth-count', [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toMatchObject({ value: 2, unit: 'count' })
    expect(polygonArea([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }])).toBe(4)
    expect(circleThroughThreePoints([{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }])).toMatchObject({ center: { x: 0, y: 0 }, radius: 1 })
    expect(measureImageAnnotation('diameter-three-point', [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }])).toMatchObject({ valid: false })
  })

  it('uses neutral comparison states instead of declaring a defect', () => {
    const readings = [reading(1, 10.05), reading(2, 10.06)]
    const uncertainty = declareMeasurementUncertainty({ unit: 'mm', resolution: quantity(0.01, 'mm', 'official') })
    const result = resolveSeriesResult(readings, uncertainty, 'Media de dos lecturas conservadas')
    const series: MeasurementSeries = {
      schemaVersion: 1,
      id: 'metrology.measurement-series.series',
      profileId: 'profile.local',
      definitionId: 'definition.diameter',
      specimenId: 'specimen.one',
      instrumentId: 'instrument.caliper',
      operator: 'Perfil local',
      startedAt: timestamp,
      completedAt: timestamp,
      orientation: 'plano A',
      conditions: {},
      readingIds: readings.map(({ id }) => id),
      result,
      status: 'complete',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    }
    const comparison = compareNominalAndMeasured({
      base: {
        schemaVersion: 1,
        id: 'metrology.comparison.one',
        profileId: 'profile.local',
        specimenId: 'specimen.one',
        measurementSeriesId: series.id,
        limitations: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        recordVersion: 1,
      },
      series,
      nominal: {
        value: quantity(10, 'mm', 'official'),
        sourceId: 'official.drawing',
        sourceKind: 'official',
        tolerance: { lower: quantity(9.99, 'mm', 'official'), upper: quantity(10.01, 'mm', 'official') },
        referenceFrame: 'plano A',
        scope: 'diámetro exterior',
      },
    })
    expect(comparison.interpretation).toBe('apparent-discrepancy')
    expect(comparison.percentageDelta).toBeCloseTo(0.55)
    expect(comparison.reasons.join(' ')).toMatch(/no demuestra por sí sola un defecto/iu)
  })

  it('enforces independent R2, R3 and R4 gates without changing fidelity', () => {
    const evidence = {
      documentedIdentity: true,
      documentedStructure: true,
      documentedRelationships: true,
      approximateEducationalGeometry: true,
      photographicSourceIds: ['photo.one'],
      reviewedVisualReconstruction: true,
      plausibleContours: true,
      verifiedRelationshipIds: ['relationship.one'],
      declaredUncertaintyIds: ['uncertainty.one'],
      physicalSpecimenIds: [],
      controlledImageIds: [],
      repeatedMeasurementSeriesIds: [],
      registeredInstrumentIds: [],
      instrumentVerificationIds: [],
      versionedCorrectionProposalIds: [],
      fitCheckEvidenceIds: [],
      humanReviewer: 'Revisión humana local',
    }
    expect(evaluateReconstructionGate('R2', evidence)).toMatchObject({ passed: true, fidelityUnaffected: true })
    expect(highestReconstructionGate(evidence)).toMatchObject({ level: 'R3', passed: true })
    expect(evaluateReconstructionGate('R4', evidence)).toMatchObject({ passed: false })
    expect(evaluateReconstructionGate('R4', evidence).missing).toContain('mediciones repetidas')
  })

  it('keeps approved geometry proposals separate from canonical fixtures', () => {
    const proposal: GeometryCorrectionProposal = {
      schemaVersion: 1,
      id: 'metrology.geometry-proposal.one',
      profileId: 'profile.local',
      specimenId: 'specimen.one',
      fixtureId: 'fixture.mechanical',
      fixtureVersion: '1.0.0',
      fixtureEntityId: 'wheel.center',
      targetParameter: 'diameter',
      currentValue: quantity(10, 'mm', 'designed'),
      proposedValue: quantity(10.02, 'mm', 'measured'),
      measurementSeriesIds: ['series.one'],
      comparisonIds: ['comparison.one'],
      imageAnnotationIds: [],
      rationale: 'Resultado repetido en una unidad concreta.',
      assumptions: [],
      limitations: ['No se generaliza al calibre.'],
      status: 'ready-for-review',
      validationEvidenceIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    }
    const approved = transitionGeometryProposal(proposal, 'approved', 'Revisor local', 'Evidencia suficiente para parche candidato', timestamp)
    expect(createCandidatePatch(approved)).toMatchObject({ automaticApplication: false, changesFidelityAutomatically: false })
    expect(proposal.status).toBe('ready-for-review')
  })

  it('runs a CAD candidate on a copy and keeps rollback data', async () => {
    const proposal: GeometryCorrectionProposal = {
      schemaVersion: 1,
      id: 'metrology.geometry-proposal.copy',
      profileId: 'profile.local',
      specimenId: 'specimen.one',
      fixtureId: 'fixture.one',
      fixtureVersion: '1.0.0',
      fixtureEntityId: 'wheel.one',
      targetParameter: 'diameter',
      proposedValue: quantity(10.02, 'mm', 'measured'),
      measurementSeriesIds: ['series.one'],
      comparisonIds: ['comparison.one'],
      imageAnnotationIds: [],
      rationale: 'Prueba de copia',
      assumptions: [],
      limitations: [],
      status: 'approved',
      reviewer: 'Revisión local',
      validationEvidenceIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 2,
    }
    const canonical = { id: 'project.one', movement: { diameter: 10 } }
    const plan = prepareCadCandidatePlan(proposal, canonical, (copy, patch) => {
      copy.movement.diameter = (patch.proposedValue as { value: number }).value
      return copy
    })
    const execution = await executeCadCandidatePlan(plan, async (copy) => ({ analyzedDiameter: copy.movement.diameter }))
    expect(execution).toMatchObject({ sourceUnchanged: true, rollbackSnapshotAvailable: true })
    expect(canonical.movement.diameter).toBe(10)
    expect(rollbackCadCandidatePlan(plan)).toEqual(canonical)
  })

  it('separates observation from hypothesis and preserves private specimen fields', () => {
    expect(() => validateFinding({
      schemaVersion: 1,
      id: 'metrology.finding.one',
      profileId: 'profile.local',
      sessionId: 'session.one',
      observationId: 'observation.one',
      specimenId: 'specimen.one',
      category: 'surface',
      type: 'mark',
      severity: 'minor',
      finding: 'Marca visible con luz rasante.',
      confidence: 'medium',
      hypothesis: 'Posible roce.',
      measurementSeriesIds: [],
      evidenceObjectIds: [],
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    })).toThrow(/confianza/)

    const specimen: PhysicalSpecimen = {
      schemaVersion: 1,
      id: 'metrology.specimen.one',
      profileId: 'profile.local',
      stableIdentifier: 'unit-001',
      displayName: 'Movimiento de práctica',
      kind: 'movement',
      serialNumber: 'PRIVATE-1',
      ownership: 'owned',
      condition: 'as-received',
      notes: '',
      tags: [],
      linkedProjectIds: [],
      linkedFixtureIds: [],
      privacy: 'private',
      createdAt: timestamp,
      updatedAt: timestamp,
      recordVersion: 1,
    }
    expect(validateSpecimen(specimen).serialNumber).toBe('PRIVATE-1')
  })
})
