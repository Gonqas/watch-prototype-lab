import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMechanicalProject } from '../../vnext/presets'
import { MemoryLearningBinaryStorage } from '../persistence/binaryStorage'
import { MemoryLearningRepository } from '../persistence/memoryRepository'
import { evidenceFixture, eventFixture, sessionFixture } from '../persistence/testFixtures'
import type { LearningLocation } from './navigation'
import {
  LearningApplicationService,
  type LearningNavigationPort,
} from './service'

class MemoryNavigation implements LearningNavigationPort {
  private value: LearningLocation
  private readonly listeners = new Set<() => void>()

  constructor(value: LearningLocation = { surface: 'home', query: {} }) {
    this.value = structuredClone(value)
  }

  current(): LearningLocation {
    return structuredClone(this.value)
  }

  navigate(location: LearningLocation): void {
    this.value = structuredClone(location)
    this.listeners.forEach((listener) => listener())
  }

  updateQuery(patch: Record<string, string | undefined>): void {
    const query = { ...this.value.query }
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) delete query[key]
      else query[key] = value
    })
    this.navigate({ ...this.value, query })
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    this.listeners.clear()
  }
}

function application(curriculumPolicy: 'enforced' | 'authoring-preview' = 'authoring-preview') {
  const repository = new MemoryLearningRepository()
  const storage = new MemoryLearningBinaryStorage()
  const navigation = new MemoryNavigation()
  const project = createMechanicalProject()
  const service = new LearningApplicationService(project, navigation, async () => {
    await repository.initialize()
    return { repository, storage, closeStorage: async () => undefined }
  }, { curriculumPolicy })
  return { service, repository, navigation, project }
}

async function answerCausalExplanation(service: LearningApplicationService): Promise<void> {
  const workspace = service.snapshot().workspace
  const step = workspace?.steps.find(({ id }) => id === workspace.activeStepId)
  const question = step?.questions.find(({ responseKind }) => responseKind === 'structured-response')
  if (!question) return
  await service.command({
    type: 'answer',
    questionId: question.id,
    answer: Object.fromEntries((question.structuredFields ?? []).map((field) => [
      field.id,
      field.kind === 'confidence'
        ? 0.8
        : field.id.includes('observation')
          ? 'El elemento receptor cambia después de la acción observada.'
          : 'La relación declarada transmite el efecto desde el origen hasta el receptor.',
    ])),
  })
}

async function answerCurrentChoice(
  service: LearningApplicationService,
  preferredOptionId?: string,
): Promise<void> {
  const workspace = service.snapshot().workspace
  const step = workspace?.steps.find(({ id }) => id === workspace.activeStepId)
  const question = step?.questions.find(({ responseKind }) => responseKind === 'single-choice')
  const options = question?.options ?? []
  const option = options.find(({ id }) => id === preferredOptionId)
    ?? options.find(({ id }) => id.endsWith('.evidence'))
    ?? options[0]
  if (!question || !option) return
  await service.command({ type: 'answer', questionId: question.id, answer: option.id })
}

describe('capa de aplicación de Aprender', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 1) as unknown as number)
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('inicializa perfil y paquete reales, y conserva filtros en el estado de navegación', async () => {
    const { service, repository, navigation } = application()
    await Promise.all([service.initialize(), service.initialize()])
    expect(service.snapshot().status).toBe('ready')
    expect(service.snapshot().profile?.displayName).toBe('Perfil local')
    expect(service.snapshot().packages.items[0]?.origin).toBe('integrated')

    service.navigate({ surface: 'explore', query: { difficulty: 'introductory', offline: 'yes' } })
    expect(service.snapshot().filters.difficulty).toBe('introductory')
    expect(navigation.current().query.offline).toBe('yes')
    expect((await repository.listSessions(service.snapshot().profile!.id)).total).toBe(0)
  })

  it('bloquea una práctica cuando faltan rutas o competencias previas', async () => {
    const { service, repository } = application('enforced')
    await service.initialize()
    const preflight = await service.preflightActivity('activity.quartz2035.prepare-workbench')

    expect(preflight.status).toBe('blocked')
    expect(preflight.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'curriculum-route', status: 'failed', actions: expect.any(Array) }),
      expect.objectContaining({ id: 'prerequisites', status: 'failed', actions: expect.any(Array) }),
    ]))
    expect(preflight.checks.flatMap(({ actions }) => actions ?? [])).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: expect.any(String), href: expect.stringMatching(/^#\/learning\//) }),
    ]))
    expect((await repository.listSessions(service.snapshot().profile!.id)).total).toBe(0)
  })

  it('abre retención solo cuando existe demostración y ha llegado la fecha programada', async () => {
    const { service, repository } = application()
    await service.initialize()
    expect(service.snapshot().status, JSON.stringify(service.snapshot().error)).toBe('ready')
    const activityId = 'activity.horology.classify-subsystems'
    const competencyId = service.snapshot().product.activities.find(({ id }) => id === activityId)!.competencyIds[0]
    service.navigate({ surface: 'activity', id: activityId, query: { mode: 'retention' } })

    expect(await service.preflightActivity(activityId)).toMatchObject({
      status: 'blocked',
      checks: expect.arrayContaining([expect.objectContaining({ id: 'retention-window', status: 'failed' })]),
    })

    await repository.putMastery({
      schemaVersion: 1 as const,
      profileId: service.snapshot().profile!.id,
      competencyId,
      state: 'demonstrated',
      strength: 1,
      primaryEvidenceIds: ['evidence.demonstration'],
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reviewStage: 1,
      nextReviewAt: '2026-07-22T09:00:00.000Z',
      retentionCandidateAt: '2026-07-22T09:00:00.000Z',
      reasons: ['Repaso programado.'],
      projectorVersion: '1.1.0',
      calculatedAt: '2026-07-23T09:00:00.000Z',
    })
    await service.refresh()
    const due = await service.preflightActivity(activityId)
    expect(due.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'retention-window', status: 'passed' }),
    ]))
    expect(due.status).toBe('ready')
  })

  it('convierte la práctica en una demostración independiente sin confundirla con transferencia', async () => {
    const { service, repository } = application()
    await service.initialize()
    expect(service.snapshot().status, JSON.stringify(service.snapshot().error)).toBe('ready')
    const activityId = 'activity.horology.classify-subsystems'
    const activity = service.snapshot().product.activities.find(({ id }) => id === activityId)!
    const competencyId = activity.competencyIds[0]
    service.navigate({ surface: 'activity', id: activityId, query: { mode: 'demonstration' } })

    expect(await service.preflightActivity(activityId)).toMatchObject({
      status: 'blocked',
      checks: expect.arrayContaining([
        expect.objectContaining({ id: 'demonstration-ready', status: 'failed' }),
      ]),
    })

    const learningProjection = {
      schemaVersion: 1 as const,
      profileId: service.snapshot().profile!.id,
      competencyId,
      strength: 0.6,
      primaryEvidenceIds: ['evidence.formative'],
      latestValidEvidenceAt: '2026-07-23T09:00:00.000Z',
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reasons: ['Práctica formativa completada.'],
      projectorVersion: '1.1.0',
      calculatedAt: '2026-07-23T09:00:00.000Z',
    }
    await repository.putMastery({ ...learningProjection, state: 'introduced' })
    await service.refresh()
    expect((await service.preflightActivity(activityId)).checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demonstration-ready', status: 'failed' }),
    ]))

    await repository.putMastery({ ...learningProjection, state: 'practising' })
    await service.refresh()

    expect(await service.preflightActivity(activityId)).toMatchObject({
      status: 'ready',
      checks: expect.arrayContaining([
        expect.objectContaining({ id: 'demonstration-ready', status: 'passed' }),
      ]),
    })
    await service.launchActivity(activityId)
    expect(service.snapshot().workspace?.learningMode).toBe('demonstration')
    expect((await repository.listSessions(service.snapshot().profile!.id)).items[0]?.learningMode)
      .toBe('demonstration')

    const hint = await service.command({ type: 'show-hint' })
    expect(hint).toMatchObject({
      accepted: false,
      diagnostics: [expect.objectContaining({ code: 'LR-INDEPENDENT-MODE-NO-HINTS' })],
    })
    expect(service.snapshot().workspace?.requestedHints).toEqual([])

    const demonstrationSessionId = service.snapshot().workspace!.persistentSessionId
    await service.saveAndExit('demonstration-recovery-test')
    await service.performRecovery(demonstrationSessionId, 'resume')
    expect(service.snapshot().workspace?.learningMode).toBe('demonstration')

    await answerCurrentChoice(service, 'option.transmission')
    await answerCausalExplanation(service)
    await service.command({ type: 'next-step' })
    await service.command({ type: 'next-step' })

    expect(service.snapshot().result?.assessment).toMatchObject({
      ruleId: expect.stringMatching(/\.adaptive\.demonstration$/),
      result: { passed: true, resultingState: 'demonstrated' },
    })
    expect(service.snapshot().result?.mastery).toMatchObject({
      state: 'demonstrated',
      transferEvidenceIds: [],
    })
  })

  it('permite demostrar desde introduced solo cuando el contrato lo declara', async () => {
    const { service, repository } = application()
    await service.initialize()
    expect(service.snapshot().status, JSON.stringify(service.snapshot().error)).toBe('ready')
    const explicit = service.snapshot().product.activities.find(({ pedagogicalContract }) =>
      pedagogicalContract?.assessmentIntent === 'demonstration')!
    const competencyId = explicit.competencyIds[0]
    await repository.putMastery({
      schemaVersion: 1,
      profileId: service.snapshot().profile!.id,
      competencyId,
      state: 'introduced',
      strength: 0.4,
      primaryEvidenceIds: ['evidence.introduction'],
      latestValidEvidenceAt: '2026-07-23T09:00:00.000Z',
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reasons: ['Explicación estudiada.'],
      projectorVersion: '1.1.0',
      calculatedAt: '2026-07-23T09:00:00.000Z',
    })
    await service.refresh()
    service.navigate({ surface: 'activity', id: explicit.id, query: { mode: 'demonstration' } })

    expect((await service.preflightActivity(explicit.id)).checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'demonstration-ready', status: 'passed' }),
    ]))
  })

  it('mantiene la transferencia cerrada hasta que exista una demostración', async () => {
    const { service, repository } = application()
    await service.initialize()
    expect(service.snapshot().status, JSON.stringify(service.snapshot().error)).toBe('ready')
    const activityId = 'activity.horology.classify-subsystems'
    const competencyId = service.snapshot().product.activities.find(({ id }) => id === activityId)!
      .competencyIds[0]
    const projection = {
      schemaVersion: 1 as const,
      profileId: service.snapshot().profile!.id,
      competencyId,
      strength: 0.8,
      primaryEvidenceIds: ['evidence.learning'],
      latestValidEvidenceAt: '2026-07-23T09:00:00.000Z',
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reasons: ['Trayectoria de prueba.'],
      projectorVersion: '1.1.0',
      calculatedAt: '2026-07-23T09:00:00.000Z',
    }
    service.navigate({ surface: 'activity', id: activityId, query: { mode: 'transfer' } })

    await repository.putMastery({ ...projection, state: 'practising' })
    await service.refresh()
    expect((await service.preflightActivity(activityId)).checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'transfer-ready', status: 'failed' }),
    ]))

    await repository.putMastery({ ...projection, state: 'demonstrated' })
    await service.refresh()
    expect((await service.preflightActivity(activityId)).checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'transfer-ready', status: 'passed' }),
    ]))
  })

  it('convierte una respuesta abierta pendiente en revisión humana trazable y reevalúa el dominio', async () => {
    const { service, repository } = application()
    await service.initialize()
    await repository.putSession({
      ...sessionFixture(),
      packageId: 'wplab.horology.manufacturing-design-validation',
      packageVersion: '1.1.0',
      lessonId: 'lesson.capstone.validation.watchmaker-review',
      activityId: 'activity.capstone.validation.watchmaker-review',
      activityVersion: '1.1.0',
      rubricId: 'rubric.capstone.validation.watchmaker-review',
      state: 'completed',
      completedAt: '2026-07-23T09:05:00.000Z',
    })
    await repository.appendEvents([eventFixture(0), eventFixture(1)])
    const pending = {
      ...evidenceFixture('evidence.pending.capstone'),
      competencyId: 'competency.capstone.validation.watchmaker-review',
      packageId: 'wplab.horology.manufacturing-design-validation',
      packageVersion: '1.1.0',
      activityId: 'activity.capstone.validation.watchmaker-review',
      extractionRuleId: 'rule.extract.capstone.validation.watchmaker-review',
      content: {
        answer: 'Dossier con requisitos, alternativas, riesgos y límites.',
        evaluation: { complete: true, correct: null, pendingReview: true },
      },
      confidence: 0.35,
      uncertainty: 0.65,
    }
    await repository.addEvidence(pending)
    await service.refresh()

    const result = await service.submitHumanReview({
      sourceEvidenceId: pending.id,
      decision: 'approved',
      reviewerName: 'Revisora relojera',
      notes: 'El dossier cubre los criterios declarados y separa hechos, riesgos y límites.',
      criterionIds: ['requirements', 'risks', 'limits'],
    })

    expect(result.reviewEvidence).toMatchObject({ evidenceType: 'human-review', confidence: 1 })
    expect(result.reviewedEvidence.content.evaluation).toMatchObject({ pendingReview: false, correct: true })
    expect(result.assessment.result).toMatchObject({ passed: true, resultingState: 'demonstrated' })
    expect(result.mastery?.state).toBe('demonstrated')
    await expect(service.submitHumanReview({
      sourceEvidenceId: pending.id,
      decision: 'rejected',
      reviewerName: 'Otra revisora',
      notes: 'No debe poder revisarse dos veces la misma evidencia original.',
    })).rejects.toThrow('ya fue revisada')
  })

  it('no crea sesión durante preflight y completa runtime → eventos → evidencia → evaluación → dominio', async () => {
    const { service, repository, project } = application()
    const projectBefore = structuredClone(project)
    await service.initialize()
    const profileId = service.snapshot().profile!.id

    const preflight = await service.preflightActivity('activity.demo.identify-case')
    expect(preflight.status).toBe('ready')
    expect((await repository.listSessions(profileId)).total).toBe(0)

    await service.launchActivity('activity.demo.identify-case')
    const workspace = service.snapshot().workspace
    expect(workspace?.runtimeState).toMatch(/running|awaiting-interaction/)
    expect((await repository.listSessions(profileId)).items[0]?.state).toBe('active')

    const entityId = workspace!.accessibleEntities[0]!.id
    await service.command({ type: 'select-entity', entityId })
    await service.command({ type: 'confirm-selection' })
    await service.command({ type: 'next-step' })
    await service.command({ type: 'next-step' })

    const snapshot = service.snapshot()
    expect(snapshot.location.surface).toBe('results')
    expect(snapshot.result?.session.state).toBe('completed')
    expect(snapshot.result?.evidence.some(({ evidenceType }) => evidenceType === 'selection')).toBe(true)
    expect(snapshot.result?.evidence.some(({ evidenceType }) => evidenceType === 'sequence')).toBe(true)
    expect(snapshot.result?.assessment.result.passed).toBe(true)
    expect(snapshot.result?.mastery?.state).toBe('demonstrated')
    expect((await repository.listEvents(snapshot.result!.session.id)).total).toBeGreaterThan(0)
    expect(project).toEqual(projectBefore)
  })

  it('ejecuta el paquete externo de ejemplo de autoría sin sustituir el demo contractual', async () => {
    const { service, repository } = application()
    await service.initialize()
    const profileId = service.snapshot().profile!.id

    expect(service.snapshot().packages.total).toBe(10)
    expect(service.snapshot().product.routes.some(({ id }) => id === 'route.authoring-first-package')).toBe(true)
    expect(service.snapshot().product.routes.some(({ id }) => id === 'route.horology.orientation')).toBe(true)
    expect(await service.preflightActivity('activity.authoring.selector-walkthrough')).toMatchObject({ status: 'ready' })

    await service.launchActivity('activity.authoring.selector-walkthrough')
    await service.command({ type: 'jump-step', stepId: 'step.authoring.predict' })
    await service.command({ type: 'answer', questionId: 'question.authoring.predict-selector', answer: 'option.role' })
    await service.command({ type: 'next-step' })
    const entityId = service.snapshot().workspace!.accessibleEntities[0]!.id
    await service.command({ type: 'select-entity', entityId })
    await service.command({ type: 'confirm-selection' })
    await service.command({ type: 'next-step' })
    await service.command({ type: 'next-step' })

    const result = service.snapshot().result
    expect(result?.session.packageId).toBe('wplab.example.authoring-course')
    expect(result?.evidence.some(({ extractionRuleId }) =>
      extractionRuleId === 'evidence.authoring.selection-confirmed')).toBe(true)
    expect(result?.assessment.ruleId).toBe('rule.authoring.traceable.demonstrated.formative')
    expect(result?.mastery?.state).toBe('practising')
    expect(result?.nextRecommendation.href).toBe('#/learning/lesson/lesson.horology.system?block=block.horology.system')
    expect((await repository.listSessions(profileId)).total).toBe(1)
  })

  it('ejecuta una escena relojera sobre fixtures v6 y conserva intacto el WatchProject', async () => {
    const { service, project } = application()
    const projectBefore = structuredClone(project)
    await service.initialize()

    const activityId = 'activity.horology.classify-subsystems'
    expect(await service.preflightActivity(activityId)).toMatchObject({ status: 'ready' })
    await service.launchActivity(activityId)

    const workspace = service.snapshot().workspace
    expect(workspace?.educationalVisual?.graphs.length).toBe(1)
    expect(workspace?.educationalVisual?.graphs[0]?.entities.length).toBeGreaterThan(5)
    expect(workspace?.activity.fixtureBinding?.kind).toBe('fixture')

    const prematureHint = await service.command({ type: 'show-hint' })
    expect(prematureHint.accepted).toBe(false)
    expect(service.snapshot().workspace?.requestedHints).toEqual([])

    await answerCurrentChoice(service, 'option.energy')
    const firstHint = await service.command({ type: 'show-hint' })
    expect(firstHint.accepted).toBe(true)
    expect(service.snapshot().workspace?.requestedHints).toMatchObject([{
      hintId: 'hint.horology.activity.classify-subsystems.1',
      level: 1,
    }])
    await answerCurrentChoice(service, 'option.transmission')
    await answerCausalExplanation(service)
    await service.command({ type: 'next-step' })
    await service.command({ type: 'next-step' })

    const result = service.snapshot().result
    expect(result?.session.reference.kind).toBe('fixture')
    expect(result?.evidence.some(({ evidenceType }) => evidenceType === 'classification')).toBe(true)
    expect(result?.assessment.result.passed).toBe(false)
    expect(result?.mastery?.state).toBe('practising')
    expect(result?.mastery?.state).not.toBe('retained')
    expect(result?.nextRecommendation.href)
      .toBe('#/learning/activity/activity.horology.select-affected-subsystem?mode=demonstration')
    expect(result?.evidence.some(({ content }) =>
      Array.isArray(content.hintEventIds) && content.hintEventIds.length > 0)).toBe(true)
    expect(result?.evidence.some(({ content }) =>
      Array.isArray(content.hintIds)
      && content.hintIds.includes('hint.horology.activity.classify-subsystems.1'))).toBe(true)
    expect(project).toEqual(projectBefore)
  })

  it('bloquea antes de crear una sesión cuando falta la versión exacta', async () => {
    const { service, repository } = application()
    await service.initialize()
    const profileId = service.snapshot().profile!.id
    const installed = service.snapshot().packages.items[0]!
    await repository.removePackage(installed.packageId, installed.version)

    const preflight = await service.preflightActivity('activity.demo.identify-case')
    await service.launchActivity('activity.demo.identify-case')

    expect(preflight.status).toBe('blocked')
    expect(preflight.diagnostics[0]?.id).toBe('LA-PREFLIGHT-BLOCKED')
    expect((await repository.listSessions(profileId)).total).toBe(0)
    expect(service.snapshot().workspace).toBeUndefined()
  })

  it('suspende explícitamente, informa recuperación y reanuda solo tras una decisión', async () => {
    const { service, repository } = application()
    await service.initialize()
    await service.launchActivity('activity.demo.identify-case')
    const sessionId = service.snapshot().workspace!.persistentSessionId

    await service.saveAndExit('test-interruption')
    expect((await repository.getSession(sessionId))?.state).toBe('suspended')
    expect(service.snapshot().recovery[sessionId]?.allowedActions).toContain('resume')
    expect(service.snapshot().workspace).toBeUndefined()

    await service.performRecovery(sessionId, 'resume')
    expect(service.snapshot().workspace?.persistentSessionId).toBe(sessionId)
    expect((await repository.getSession(sessionId))?.state).toBe('active')
    await service.cancelActivity()
  })

  it('no reanuda silenciosamente una versión histórica ausente y permite reiniciar sobre el contenido actual', async () => {
    const { service, repository } = application()
    await service.initialize()
    await service.launchActivity('activity.horology.classify-subsystems')
    const legacySessionId = service.snapshot().workspace!.persistentSessionId

    await service.saveAndExit('legacy-package-test')
    const current = (await repository.getSession(legacySessionId))!
    await repository.putSession({
      ...current,
      packageVersion: '0.3.0',
      activityVersion: '0.3.0',
      rubricVersion: '0.3.0',
      checkpoint: current.checkpoint
        ? { ...current.checkpoint, packageVersion: '0.3.0' }
        : undefined,
    })
    await service.refresh()

    expect(service.snapshot().recovery[legacySessionId]?.allowedActions).not.toContain('resume')
    expect(service.snapshot().recovery[legacySessionId]?.allowedActions).toContain('restart-new-attempt')
    expect(service.snapshot().recovery[legacySessionId]?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'RECOVERY-PACKAGE-MISSING', severity: 'error' }),
    ]))

    await service.performRecovery(legacySessionId, 'restart-new-attempt')
    const restarted = await repository.getSession(service.snapshot().workspace!.persistentSessionId)
    expect(restarted).toMatchObject({
      packageId: 'wplab.horology.functional-map',
      packageVersion: '0.5.0',
      originSessionId: legacySessionId,
      state: 'active',
    })
    await service.cancelActivity()
  })

  it('guarda y recupera el banco 2035 con la pieza en bandeja y eventos no duplicados', async () => {
    const { service, repository, project } = application()
    const projectBefore = structuredClone(project)
    await service.initialize()
    const activityId = 'activity.quartz2035.prepare-workbench'
    expect(await service.preflightActivity(activityId)).toMatchObject({ status: 'ready' })
    await service.launchActivity(activityId)

    expect(service.snapshot().workspace?.workbench?.parts).toHaveLength(33)
    const fastener = service.snapshot().workspace!.workbench!.parts.find(({ fastener, manipulable }) => fastener && manipulable)!
    await service.workbenchCommand({ id: 'wb-prepare', type: 'prepare-workbench' })
    await service.workbenchCommand({ id: 'wb-energy', type: 'isolate-energy' })
    await service.workbenchCommand({
      id: 'wb-loosen',
      type: 'loosen-fastener',
      instanceId: fastener.instanceId,
      toolId: 'tool.screwdriver',
      fitConfirmed: true,
    })
    await service.workbenchCommand({
      id: 'wb-remove',
      type: 'remove-part',
      instanceId: fastener.instanceId,
      toolId: 'tool.screwdriver',
    })
    await service.workbenchCommand({
      id: 'wb-tray',
      type: 'place-in-tray',
      instanceId: fastener.instanceId,
      toolId: 'tool.tweezers',
      trayZoneId: 'tray.zone.1',
    })
    const sessionId = service.snapshot().workspace!.persistentSessionId
    const workbenchEventCount = (await repository.listEvents(sessionId, { limit: 500 }))
      .items.filter(({ type }) => type === 'workbench-command').length
    expect(service.snapshot().workspace?.workbench?.parts.find(({ instanceId }) => instanceId === fastener.instanceId))
      .toMatchObject({ state: 'placed-in-tray', trayZoneId: 'tray.zone.1' })

    await service.saveAndExit('workbench-recovery-test')
    await service.performRecovery(sessionId, 'resume')
    expect(service.snapshot().workspace?.workbench?.parts.find(({ instanceId }) => instanceId === fastener.instanceId))
      .toMatchObject({ state: 'placed-in-tray', trayZoneId: 'tray.zone.1' })
    expect((await repository.listEvents(sessionId, { limit: 500 }))
      .items.filter(({ type }) => type === 'workbench-command')).toHaveLength(workbenchEventCount)
    expect(project).toEqual(projectBefore)
    await service.command({ type: 'jump-step', stepId: 'step.quartz2035.workstation.execute' })
    await answerCurrentChoice(service)
    await answerCausalExplanation(service)
    await service.command({ type: 'next-step' })
    expect(service.snapshot().result?.evidence.some(({ evidenceType }) => evidenceType === 'simulation-result')).toBe(true)
    expect(service.snapshot().result?.assessment.result.passed).toBe(true)
    expect(service.snapshot().result?.mastery?.state).not.toBe('retained')
  })

  it('guarda y recupera el laboratorio mecánico con tren, escape, corona, fallo y proyecto', async () => {
    const { service, repository, project } = application()
    const projectBefore = structuredClone(project)
    await service.initialize()
    const activityId = 'activity.mechanical.classify-energy-functions'
    expect(await service.preflightActivity(activityId)).toMatchObject({ status: 'ready' })
    await service.launchActivity(activityId)
    expect(service.snapshot().workspace?.mechanicalLab?.entities).toHaveLength(30)

    await service.mechanicalLabCommand({ id: 'ml-wind', type: 'wind', amount: 0.8 })
    await service.mechanicalLabCommand({
      id: 'ml-ratio',
      type: 'change-ratio',
      stageId: 'stage.barrel-center',
      driverTeeth: 72,
      drivenTeeth: 12,
    })
    await service.mechanicalLabCommand({ id: 'ml-escape', type: 'step-escapement' })
    await service.mechanicalLabCommand({ id: 'ml-scrub', type: 'scrub-escapement', phaseIndex: 6 })
    await service.mechanicalLabCommand({ id: 'ml-speed', type: 'set-escapement-speed', multiplier: 0.25 })
    await service.mechanicalLabCommand({ id: 'ml-osc', type: 'set-oscillator', frequencyHz: 4, amplitudeDegrees: 220 })
    await service.mechanicalLabCommand({ id: 'ml-length', type: 'set-hairspring-active-length', normalizedLength: 0.75 })
    await service.mechanicalLabCommand({ id: 'ml-crown', type: 'change-crown-position', position: 'time-setting' })
    await service.mechanicalLabCommand({ id: 'ml-fault', type: 'introduce-fault', fault: 'missing-mesh' })
    await service.mechanicalLabCommand({ id: 'ml-project', type: 'project-record-decision', decision: '8215 separado y R2.' })

    const beforeRecovery = service.snapshot().workspace!.mechanicalLab!
    const sessionId = service.snapshot().workspace!.persistentSessionId
    const eventCount = (await repository.listEvents(sessionId, { limit: 500 }))
      .items.filter(({ type }) => type === 'mechanical-lab-command').length
    expect(beforeRecovery).toMatchObject({
      energyLevel: 0.8,
      escapementPhase: 'impulse-right',
      escapementSpeed: 0.25,
      oscillatorFrequencyHz: 4,
      oscillatorAmplitudeDegrees: 220,
      hairspringActiveLength: 0.75,
      crownPosition: 'time-setting',
    })
    expect(beforeRecovery.activeFaults.map(({ kind }) => kind)).toContain('missing-mesh')

    await service.saveAndExit('mechanical-lab-recovery-test')
    await service.performRecovery(sessionId, 'resume')
    expect(service.snapshot().workspace?.mechanicalLab).toMatchObject({
      energyLevel: 0.8,
      escapementPhase: 'impulse-right',
      escapementSpeed: 0.25,
      hairspringActiveLength: 0.75,
      crownPosition: 'time-setting',
    })
    expect((await repository.listEvents(sessionId, { limit: 500 }))
      .items.filter(({ type }) => type === 'mechanical-lab-command')).toHaveLength(eventCount)
    expect(project).toEqual(projectBefore)

    await service.command({ type: 'jump-step', stepId: 'step.mechanical.energy.observe' })
    await answerCurrentChoice(service)
    await answerCausalExplanation(service)
    await service.command({ type: 'next-step' })
    await service.command({ type: 'next-step' })
    expect(service.snapshot().result?.evidence.some(({ evidenceType }) => evidenceType === 'simulation-result')).toBe(true)
    expect(service.snapshot().result?.assessment.result.passed).toBe(true)
    expect(service.snapshot().result?.mastery?.state).not.toBe('retained')
  })

  it('guarda y recupera el laboratorio 8215 con identidad, autoridad, verificación y estado de banco único', async () => {
    const { service, repository, project } = application()
    const projectBefore = structuredClone(project)
    await service.initialize()
    const activityId = 'activity.miyota8215.prepare-workbench'
    expect(await service.preflightActivity(activityId)).toMatchObject({ status: 'ready' })
    await service.launchActivity(activityId)

    const initial = service.snapshot().workspace!
    expect(initial.calibreLab?.auditCounts).toMatchObject({
      definitions: 56,
      instances: 63,
      ready: 30,
      usableWithLimitations: 4,
      documentaryOnly: 29,
    })
    expect(initial.workbench?.parts).toHaveLength(63)
    await service.calibreLabCommand({ id: 'cl-identify', type: 'identify-calibre' })
    await service.calibreLabCommand({
      id: 'cl-docs',
      type: 'review-documentation',
      sourceIds: service.snapshot().workspace!.calibreLab!.officialSourceIds,
    })
    await service.calibreLabCommand({
      id: 'cl-subsystem',
      type: 'select-subsystem',
      subsystemId: 'subsystem.8215.automatic',
    })
    await service.calibreLabCommand({ id: 'cl-fault', type: 'introduce-fault', fault: 'rotor-blocked' })
    await service.calibreLabCommand({ id: 'cl-verify', type: 'verify', kind: 'rotor-presence' })
    await service.workbenchCommand({ id: 'cl-wb-prepare', type: 'prepare-workbench' })

    const sessionId = service.snapshot().workspace!.persistentSessionId
    const before = service.snapshot().workspace!.calibreLab!
    expect(before.project.passedChecks).toEqual(expect.arrayContaining(['identidad', 'documentación']))
    expect(before.faults.find(({ kind }) => kind === 'rotor-blocked')?.active).toBe(true)
    expect(before.verifications.at(-1)?.status).toBe('failed')
    expect((await repository.listEvents(sessionId, { limit: 500 })).items
      .some(({ type }) => type === 'calibre-lab-command')).toBe(true)

    await service.saveAndExit('calibre-8215-recovery-test')
    await service.performRecovery(sessionId, 'resume')
    const recovered = service.snapshot().workspace!
    expect(recovered.calibreLab).toMatchObject({
      selectedSubsystemId: 'subsystem.8215.automatic',
      documentationReviewed: true,
    })
    expect(recovered.calibreLab?.faults.find(({ kind }) => kind === 'rotor-blocked')?.active).toBe(true)
    expect(recovered.calibreLab?.verifications.at(-1)?.status).toBe('failed')
    expect(recovered.workbench?.prepared).toBe(true)
    expect(project).toEqual(projectBefore)
    await service.cancelActivity()
  })

  it('aísla perfiles y pagina sesiones sin cargar el histórico completo', async () => {
    const { service, repository } = application()
    await service.initialize()
    const firstProfile = service.snapshot().profile!.id
    await service.createProfile('Segundo perfil')
    const secondProfile = service.snapshot().profile!.id

    expect(secondProfile).not.toBe(firstProfile)
    expect(service.snapshot().sessions.total).toBe(0)
    expect((await repository.listSessions(firstProfile)).total).toBe(0)
    expect(service.snapshot().sessions.limit).toBe(40)
  })
})
