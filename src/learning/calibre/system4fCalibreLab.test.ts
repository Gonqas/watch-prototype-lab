import { describe, expect, it } from 'vitest'
import { stableFingerprint } from '../identity'
import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../technical/fixtures'
import {
  CalibreLearningLab,
  create8215Audit,
  create8215Dependencies,
  create8215Operations,
  create8215Subsystems,
  restoreCalibreLearningLab,
} from '.'

function deterministicLab(mode: 'guided' | 'assisted' | 'free' = 'guided', reducedMotion = false) {
  return new CalibreLearningLab(mode, reducedMotion, () => '2026-07-27T17:00:00.000Z')
}

describe('Sistema 4F · auditoría y arquitectura MIYOTA 8215', () => {
  it('audita 56 registros y conserva las 63 identidades individuales', () => {
    const audit = create8215Audit()
    expect(MIYOTA_8215_TECHNICAL_FIXTURE.ledger).toHaveLength(56)
    expect(audit).toHaveLength(63)
    expect(new Set(audit.map(({ instanceId }) => instanceId)).size).toBe(63)
    expect(audit.filter(({ reconstructionLevel }) => reconstructionLevel === 'R2')).toHaveLength(30)
    expect(audit.filter(({ readiness }) => readiness === 'documentary-only')).toHaveLength(29)
    expect(audit.filter(({ readiness }) => readiness === 'blocked')).toHaveLength(0)
    expect(audit.every(({ sourceIds, fidelity }) => sourceIds.length > 0 && fidelity.physics === 'P0')).toBe(true)
    expect(audit.filter(({ reconstructionLevel }) => reconstructionLevel === 'R0').every(({ aptitudes }) => !aptitudes.remove && !aptitudes.install)).toBe(true)
  })

  it('distingue cada tornillo repetido por identidad y contexto accesible', () => {
    const lab = deterministicLab()
    const repeated = lab.audits.filter(({ officialReference }) => officialReference === '924-460')
    expect(repeated.length).toBeGreaterThan(1)
    expect(new Set(repeated.map(({ instanceId }) => instanceId)).size).toBe(repeated.length)
    const accessible = lab.accessibilityModel().fastenerRows
    expect(accessible.every(({ label, instanceId }) => label.includes(instanceId))).toBe(true)
  })

  it('separa subsistemas y los cuatro grafos sin ciclos bloqueantes', () => {
    const lab = deterministicLab()
    expect(create8215Subsystems()).toHaveLength(12)
    expect(lab.subsystems.some(({ id }) => id === 'subsystem.8215.automatic')).toBe(true)
    expect(lab.subsystems.some(({ id }) => id === 'subsystem.8215.calendar')).toBe(true)
    expect(lab.subsystems.some(({ id }) => id === 'subsystem.8215.external')).toBe(true)
    expect(lab.disassembly.edges().every(({ graph }) => graph === 'disassembly')).toBe(true)
    expect(lab.assembly.edges().every(({ graph }) => graph === 'assembly')).toBe(true)
    expect(lab.structure.edges().every(({ graph }) => graph === 'structure')).toBe(true)
    expect(lab.function.edges().every(({ graph }) => graph === 'function')).toBe(true)
    expect([
      ...lab.disassembly.diagnoseCycles(),
      ...lab.assembly.diagnoseCycles(),
      ...lab.structure.diagnoseCycles(),
      ...lab.function.diagnoseCycles(),
    ]).toEqual([])
  })

  it('clasifica operaciones sin fingir un procedimiento oficial', () => {
    const operations = create8215Operations()
    const dependencies = create8215Dependencies()
    expect(operations.length).toBeGreaterThan(300)
    expect(operations.every(({ publishedAsOfficial }) => !publishedAsOfficial)).toBe(true)
    expect(operations.some(({ authority }) => authority === 'educational-sequence')).toBe(true)
    expect(dependencies.some(({ authority }) => authority === 'structural-dependency')).toBe(true)
    expect(dependencies.some(({ authority }) => authority === 'inferred-sequence')).toBe(true)
    expect(dependencies.some(({ authority }) => authority === 'simulation-only')).toBe(true)
  })
})

describe('Sistema 4F · manipulación, inspección, montaje y recuperación', () => {
  it('desmonta un tornillo individual, conserva bandeja/orientación y recupera sin duplicar eventos', async () => {
    const lab = deterministicLab('free', true)
    const screw = lab.workbench.parts().find(({ officialReference }) => officialReference === '925-490')!
    await lab.dispatch({ id: 'identify', type: 'identify-calibre' })
    await lab.dispatch({ id: 'docs', type: 'review-documentation', sourceIds: [...MIYOTA_8215_TECHNICAL_FIXTURE.sourceIds] })
    await lab.workbenchCommand({ id: 'prepare', type: 'prepare-workbench' })
    await lab.workbenchCommand({ id: 'energy', type: 'isolate-energy' })
    expect((await lab.workbenchCommand({
      id: 'loosen',
      type: 'loosen-fastener',
      instanceId: screw.instanceId,
      toolId: 'tool.screwdriver',
      fitConfirmed: true,
    })).accepted).toBe(true)
    expect((await lab.workbenchCommand({
      id: 'remove',
      type: 'remove-part',
      instanceId: screw.instanceId,
      toolId: 'tool.screwdriver',
    })).accepted).toBe(true)
    await lab.workbenchCommand({
      id: 'tray',
      type: 'place-in-tray',
      instanceId: screw.instanceId,
      toolId: 'tool.tweezers',
      trayZoneId: 'tray.zone.1',
      note: 'Tornillo de masa oscilante',
    })
    await lab.dispatch({ id: 'inspect', type: 'inspect', instanceId: screw.instanceId, defect: 'dirt' })
    const before = lab.snapshot()
    const recovered = restoreCalibreLearningLab(lab.serialize(), () => '2026-07-27T18:00:00.000Z')
    expect(recovered.snapshot().workbench.parts.find(({ instanceId }) => instanceId === screw.instanceId)).toMatchObject({
      state: 'placed-in-tray',
      trayZoneId: 'tray.zone.1',
      orientation: 'as-installed',
    })
    expect(recovered.snapshot().inspectionFindings).toHaveLength(1)
    expect(recovered.events()).toHaveLength(before.events.length)
    expect(recovered.snapshot().reducedMotion).toBe(true)
  })

  it('valida documentación y bloquea planes con operaciones desconocidas', async () => {
    const lab = deterministicLab()
    const invalidSource = await lab.dispatch({ id: 'docs-bad', type: 'review-documentation', sourceIds: ['source.invalid'] })
    expect(invalidSource.accepted).toBe(false)
    const planWithoutDocs = await lab.dispatch({ id: 'plan-early', type: 'create-disassembly-plan', operationIds: [] })
    expect(planWithoutDocs.accepted).toBe(false)
    await lab.dispatch({ id: 'docs', type: 'review-documentation', sourceIds: [...MIYOTA_8215_TECHNICAL_FIXTURE.sourceIds] })
    const operationId = lab.operations.find(({ phase, action }) => phase === 'disassembly' && action === 'remove')!.id
    expect((await lab.dispatch({ id: 'plan', type: 'create-disassembly-plan', operationIds: [operationId] })).accepted).toBe(true)
  })

  it('abre el laboratorio conceptual sin atribuir su física al calibre y conserva el regreso', async () => {
    const lab = deterministicLab('assisted')
    await lab.dispatch({ id: 'subsystem', type: 'select-subsystem', subsystemId: 'subsystem.8215.escapement' })
    await lab.dispatch({ id: 'context', type: 'open-contextual-lab', lab: 'escapement' })
    await lab.mechanicalLab.dispatch({ id: 'phase', type: 'scrub-escapement', phaseIndex: 6 })
    const snapshot = lab.snapshot()
    expect(snapshot.activeContextualLab).toBe('escapement')
    expect(snapshot.mechanicalLab.escapementPhase).toBe('impulse-right')
    expect(lab.mechanicalLab.entities.every(({ fidelity }) => fidelity.physics === 'P0')).toBe(true)
    await lab.dispatch({ id: 'close', type: 'close-contextual-lab' })
    expect(lab.snapshot().selectedSubsystemId).toBe('subsystem.8215.escapement')
  })

  it('inspecciona, introduce fallos, verifica y limita la conclusión diagnóstica', async () => {
    const lab = deterministicLab()
    const wheel = lab.audits.find(({ nameEn }) => nameEn.startsWith('Third wheel'))!
    await lab.dispatch({ id: 'fault', type: 'introduce-fault', fault: 'train-interrupted' })
    await lab.dispatch({ id: 'inspect', type: 'inspect', instanceId: wheel.instanceId, defect: 'damaged-tooth-symbolic' })
    await lab.dispatch({ id: 'verify', type: 'verify', kind: 'functional-continuity' })
    await lab.dispatch({
      id: 'hypothesis',
      type: 'form-hypothesis',
      hypothesis: {
        symptom: 'No transmite',
        subsystemId: 'subsystem.8215.train',
        hypothesis: 'Existe una interrupción en el tren.',
        requiredDatum: 'Continuidad visual entre etapas.',
        verificationKind: 'functional-continuity',
      },
    })
    const hypothesisId = lab.snapshot().hypotheses[0].id
    await lab.dispatch({
      id: 'evaluate',
      type: 'evaluate-hypothesis',
      hypothesisId,
      result: 'supports',
      permittedConclusion: 'La simulación refuerza la hipótesis de interrupción en el estado educativo.',
    })
    const state = lab.snapshot()
    expect(state.verifications[0].status).toBe('failed')
    expect(state.hypotheses[0].prohibitedConclusion).toContain('avería física confirmada')
    expect(state.project.pendingChecks).toContain('revisión humana')
  })

  it('mantiene inmutables fixture y WatchProject-equivalent input', async () => {
    const fixtureBefore = stableFingerprint(MIYOTA_8215_TECHNICAL_FIXTURE)
    const watchProject = { id: 'watch.8215.test', movement: { calibre: '8215' }, metadata: { untouched: true } }
    const projectBefore = stableFingerprint(watchProject)
    const lab = deterministicLab()
    await lab.dispatch({ id: 'identify', type: 'identify-calibre' })
    await lab.dispatch({ id: 'fault', type: 'introduce-fault', fault: 'rotor-blocked' })
    expect(stableFingerprint(MIYOTA_8215_TECHNICAL_FIXTURE)).toBe(fixtureBefore)
    expect(stableFingerprint(watchProject)).toBe(projectBefore)
  })
})
