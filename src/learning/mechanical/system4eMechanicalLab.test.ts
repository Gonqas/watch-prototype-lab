import { describe, expect, it } from 'vitest'
import { CONCEPTUAL_MECHANICAL_FIXTURE, MIYOTA_8215_TECHNICAL_FIXTURE } from '../technical/fixtures'
import {
  calculateConceptualReserve,
  calculateGearPair,
  calculateGearTrain,
  calculateMotionWorks,
  calculateOscillator,
  MECHANICAL_KINEMATIC_RELATIONS,
  MECHANICAL_LAB_ENTITIES,
  MechanicalLearningLab,
  restoreMechanicalLearningLab,
} from '.'

describe('Sistema 4E · cálculos educativos', () => {
  it('calcula pareja, sentido, rueda intermedia, mismo árbol y tren sin hardcodear un calibre', () => {
    expect(calculateGearPair(10, 20)).toMatchObject({ ratio: { value: 0.5 }, direction: -1 })
    expect(calculateGearPair(10, 20, 'internal-mesh').direction).toBe(1)
    const train = calculateGearTrain([
      { driverTeeth: 10, drivenTeeth: 20, relation: 'external-mesh' },
      { driverTeeth: 20, drivenTeeth: 40, relation: 'external-mesh' },
    ])
    expect(train.totalRatio.value).toBe(0.25)
    expect(train.finalDirection).toBe(1)
    expect(calculateGearTrain([{ driverTeeth: 10, drivenTeeth: 20, relation: 'external-mesh', engaged: false }]).finalDirection).toBe(0)
    expect(MECHANICAL_LAB_ENTITIES.some(({ id }) => id === 'mechanical.center-pinion')).toBe(true)
    expect(MECHANICAL_KINEMATIC_RELATIONS).toContainEqual(expect.objectContaining({
      driverId: 'mechanical.center-wheel',
      drivenId: 'mechanical.center-pinion',
      type: 'same-arbor',
      direction: 1,
      ratio: 1,
    }))
  })

  it('calcula frecuencia, periodo, alternancias, minutería y reserva con unidades y límites', () => {
    expect(calculateOscillator(4).period.value).toBe(0.25)
    expect(calculateOscillator(4).alternationsPerHour.value).toBe(28_800)
    expect(calculateMotionWorks(12).hourHandTurns.value).toBe(1)
    expect(calculateConceptualReserve(0.84, 0.02).value).toBe(42)
    expect(() => calculateGearPair(0, 20)).toThrow()
    expect(() => calculateOscillator(-1)).toThrow()
  })
})

describe('Sistema 4E · laboratorio mecánico', () => {
  it('mantiene separado el modelo conceptual del fixture 8215', () => {
    const lab = new MechanicalLearningLab()
    expect(lab.fixtureId).toBe(CONCEPTUAL_MECHANICAL_FIXTURE.id)
    expect(lab.comparisonFixtureId).toBe(MIYOTA_8215_TECHNICAL_FIXTURE.id)
    expect(CONCEPTUAL_MECHANICAL_FIXTURE.fidelity).toMatchObject({ geometry: 'G1', kinematics: 'K2', physics: 'P0' })
    expect(MIYOTA_8215_TECHNICAL_FIXTURE.fidelity).toMatchObject({ geometry: 'G2', physics: 'P0' })
  })

  it('carga, libera, bloquea, deshace y restaura sin física arbitraria', async () => {
    const lab = new MechanicalLearningLab(true, () => '2026-07-27T13:00:00.000Z')
    await lab.dispatch({ id: 'wind', type: 'wind', amount: 0.8 })
    await lab.dispatch({ id: 'release', type: 'release', amount: 0.2 })
    await lab.dispatch({ id: 'block', type: 'block', entityId: 'mechanical.barrel-drum' })
    expect(lab.snapshot()).toMatchObject({ energyLevel: 0.6000000000000001, reducedMotion: true })
    expect(lab.snapshot().blockedEntityIds).toContain('mechanical.barrel-drum')
    expect(lab.currentEnergyGraph().some(({ state }) => state === 'blocked')).toBe(true)
    expect(lab.accessibilityModel().textualEnergyGraph).toEqual(
      lab.currentEnergyGraph().map(({ fromId, toId, function: role, branch, direction, state }) =>
        `${fromId} → ${toId}; función ${role}; rama ${branch}; dirección ${direction}; estado ${state}.`),
    )
    await lab.dispatch({ id: 'undo', type: 'undo' })
    expect(lab.snapshot().blockedEntityIds).not.toContain('mechanical.barrel-drum')
    const reopened = restoreMechanicalLearningLab(lab.serialize(), () => '2026-07-27T14:00:00.000Z')
    expect(reopened.snapshot().gearStages).toEqual(lab.snapshot().gearStages)
    expect(reopened.accessibilityModel().reducedMotion.sameResults).toBe(true)
  })

  it('manipula pareja y tren, diagnostica centros y conserva identidad de etapa', async () => {
    const lab = new MechanicalLearningLab()
    await lab.dispatch({ id: 'ratio', type: 'change-ratio', stageId: 'stage.barrel-center', driverTeeth: 72, drivenTeeth: 12 })
    await lab.dispatch({
      id: 'add',
      type: 'add-stage',
      stage: { id: 'stage.idler', driverTeeth: 24, drivenTeeth: 24, relation: 'external-mesh', engaged: true, centerDistanceState: 'valid-conceptual' },
    })
    expect(lab.snapshot().gearStages.map(({ id }) => id)).toContain('stage.idler')
    expect(lab.totalGearRatio().finalDirection).toBe(-1)
    const invalid = await lab.dispatch({ id: 'bad', type: 'change-ratio', stageId: 'stage.idler', driverTeeth: 0, drivenTeeth: 24 })
    expect(invalid.accepted).toBe(false)
    expect(invalid.diagnostics[0].code).toBe('ML-INVALID-TEETH')
  })

  it('permite escape paso a paso y oscilador con frecuencia independiente de amplitud', async () => {
    const lab = new MechanicalLearningLab()
    await lab.dispatch({ id: 'step', type: 'step-escapement' })
    expect(lab.snapshot().escapementPhase).toBe('unlock-left')
    await lab.dispatch({ id: 'scrub', type: 'scrub-escapement', phaseIndex: 6 })
    await lab.dispatch({ id: 'speed', type: 'set-escapement-speed', multiplier: 0.25 })
    await lab.dispatch({ id: 'pause-escape', type: 'pause-escapement', paused: true })
    expect(lab.snapshot()).toMatchObject({ escapementPhase: 'impulse-right', escapementSpeed: 0.25, escapementPaused: true })
    await lab.dispatch({ id: 'osc', type: 'set-oscillator', frequencyHz: 4, amplitudeDegrees: 220 })
    expect(lab.snapshot()).toMatchObject({ oscillatorFrequencyHz: 4, oscillatorAmplitudeDegrees: 220 })
    await lab.dispatch({ id: 'amp', type: 'set-oscillator', frequencyHz: 4, amplitudeDegrees: 80 })
    await lab.dispatch({ id: 'length', type: 'set-hairspring-active-length', normalizedLength: 0.75 })
    await lab.dispatch({ id: 'pause-osc', type: 'pause-oscillator', paused: true })
    expect(lab.snapshot()).toMatchObject({ oscillatorFrequencyHz: 4, oscillatorAmplitudeDegrees: 80 })
    expect(lab.snapshot()).toMatchObject({ hairspringActiveLength: 0.75, oscillatorPaused: true })
    expect(lab.accessibilityModel().staticEscapementPhases).toHaveLength(8)
    expect((await lab.dispatch({ id: 'bad-scrub', type: 'scrub-escapement', phaseIndex: 8 })).accepted).toBe(false)
  })

  it('modela apoyos, minutería, keyless, automático, calendario y fallos reversibles', async () => {
    const lab = new MechanicalLearningLab()
    await lab.dispatch({ id: 'support', type: 'misalign', state: 'pivot-outside-jewel' })
    await lab.dispatch({ id: 'time', type: 'set-time', minutes: 185 })
    await lab.dispatch({ id: 'crown', type: 'change-crown-position', position: 'time-setting' })
    const invalidCrown = await lab.dispatch({
      id: 'invalid-crown',
      type: 'change-crown-position',
      position: 'quick-date',
    } as never)
    await lab.dispatch({ id: 'auto', type: 'enable-automatic', reversal: 'unidirectional' })
    await lab.dispatch({ id: 'date', type: 'advance-calendar', days: 2 })
    await lab.dispatch({ id: 'fault', type: 'introduce-fault', fault: 'calendar-blocked' })
    expect(lab.snapshot()).toMatchObject({
      supportState: 'pivot-outside-jewel',
      indicatedMinutes: 185,
      crownPosition: 'time-setting',
      automaticEnabled: true,
      calendarDay: 3,
      calendarBlocked: true,
    })
    expect((await lab.dispatch({ id: 'blocked-date', type: 'advance-calendar', days: 1 })).accepted).toBe(false)
    expect(invalidCrown).toMatchObject({
      accepted: false,
      diagnostics: [expect.objectContaining({ code: 'ML-CROWN-POSITION' })],
    })
  })

  it('construye el proyecto final y no muta fixtures ni WatchProject', async () => {
    const conceptualBefore = structuredClone(CONCEPTUAL_MECHANICAL_FIXTURE)
    const realBefore = structuredClone(MIYOTA_8215_TECHNICAL_FIXTURE)
    const watchProject = Object.freeze({ id: 'watch.immutable', name: 'Proyecto técnico', version: 5 })
    const lab = new MechanicalLearningLab()
    for (const subsystem of ['barrel', 'train', 'escapement', 'oscillator', 'motion-works', 'keyless', 'automatic', 'calendar'] as const) {
      await lab.dispatch({ id: `project-${subsystem}`, type: 'project-enable-subsystem', subsystem })
    }
    await lab.dispatch({ id: 'compare', type: 'change-view', view: 'compare-8215' })
    await lab.dispatch({ id: 'decision', type: 'project-record-decision', decision: 'El 8215 se usa solo como comparación R2.' })
    expect(lab.snapshot().projectDraft.enabledSubsystems).toContain('calendar')
    expect(lab.snapshot().projectDraft.passedChecks).toEqual(expect.arrayContaining([
      'arquitectura mínima documentada',
      'comparación visual 8215 R2',
      'decisiones y límites documentados',
    ]))
    expect(lab.snapshot().projectDraft.pendingChecks).toEqual(['revisión humana del dossier'])
    expect(watchProject).toEqual({ id: 'watch.immutable', name: 'Proyecto técnico', version: 5 })
    expect(CONCEPTUAL_MECHANICAL_FIXTURE).toEqual(conceptualBefore)
    expect(MIYOTA_8215_TECHNICAL_FIXTURE).toEqual(realBefore)
  })
})
