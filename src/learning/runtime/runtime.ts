import type { ProjectEntityIndex } from '../canonical'
import { stableFingerprint } from '../identity'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES, type RuntimeCapability } from './capabilities'
import { LearningCommandBus, type LearningCommand, type LearningCommandTarget } from './commands'
import {
  SceneCompiler,
  type CompiledSceneStep,
  type SceneCompilationResult,
  type SceneExecutionPlan,
} from './compiler'
import { diagnostic, hasBlockingDiagnostics, type RuntimeDiagnostic } from './diagnostics'
import { RuntimeEventEmitter, type RuntimeEvent } from './events'
import {
  normalizeAndEvaluateAnswer,
  type NormalizedAnswerEvaluation,
} from './interactions'
import type { LearningPackageOrigin, LearningPackageLoadResult, LearningPackageLoader } from './packageLoader'
import { LearningPackageRegistry } from './packageRegistry'
import type { LearningOverlayState } from './overlay'
import { LearningTimelineController, type RuntimeScheduler, type TimelineEvaluation, browserRuntimeScheduler } from './timeline'
import type { ViewportLearningBridge, ViewportPresentationSnapshot } from './bridge'

export type LearningRuntimeState =
  | 'idle'
  | 'loading'
  | 'validating'
  | 'compiling'
  | 'ready'
  | 'running'
  | 'paused'
  | 'awaiting-interaction'
  | 'completed'
  | 'cancelling'
  | 'restoring'
  | 'failed'
  | 'disposed'

export interface LearningRuntimeProgressSnapshot {
  snapshotVersion: 1
  planId: string
  packageId: string
  packageVersion: string
  sceneId: string
  stepIndex: number
  completedStepIds: string[]
  answerAttempts: Record<string, number>
  stepAttempts: Record<string, number>
  hintLevels: Record<string, number>
  answerEvaluations: Record<string, NormalizedAnswerEvaluation>
  timelinePositionMs: number
  playbackSpeed: number
  resolvedBarrierIds: string[]
  overlay: LearningOverlayState
}

interface StepCriterionEvaluation {
  criterionId: string
  satisfied: boolean
  detail: string
}

const TRANSITIONS: Record<LearningRuntimeState, LearningRuntimeState[]> = {
  idle: ['loading', 'compiling', 'disposed'],
  loading: ['validating', 'failed', 'cancelling'],
  validating: ['idle', 'failed', 'cancelling'],
  compiling: ['ready', 'failed', 'cancelling'],
  ready: ['running', 'cancelling', 'failed', 'disposed'],
  running: ['paused', 'awaiting-interaction', 'completed', 'cancelling', 'restoring', 'failed'],
  paused: ['running', 'awaiting-interaction', 'cancelling', 'restoring', 'failed'],
  'awaiting-interaction': ['paused', 'running', 'cancelling', 'restoring', 'failed'],
  completed: ['running', 'restoring', 'disposed'],
  cancelling: ['restoring', 'disposed', 'failed'],
  restoring: ['completed', 'failed', 'disposed', 'ready'],
  failed: ['idle', 'loading', 'compiling', 'restoring', 'ready', 'disposed'],
  disposed: [],
}

function newSessionId(): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  return `learning-session-${random}`
}

export class LearningSceneSession implements LearningCommandTarget {
  readonly id: string
  readonly events: RuntimeEventEmitter
  readonly commands: LearningCommandBus
  readonly plan: SceneExecutionPlan
  private stateValue: LearningRuntimeState = 'ready'
  private snapshot?: ViewportPresentationSnapshot
  private restored = false
  private timeline?: LearningTimelineController
  private lastEvaluation?: TimelineEvaluation
  private pendingBridge = Promise.resolve()
  private stepIndex = -1
  private readonly completedStepIds = new Set<string>()
  private readonly answerAttempts = new Map<string, number>()
  private readonly stepAttempts = new Map<string, number>()
  private readonly hintLevels = new Map<string, number>()
  private readonly answerEvaluations = new Map<string, NormalizedAnswerEvaluation>()
  private userSelectedEntityIds?: string[]
  private readonly projectFingerprint: string
  private readonly diagnosticsValue: RuntimeDiagnostic[] = []
  private readonly bridge: ViewportLearningBridge
  private readonly technicalProject: unknown
  private readonly scheduler: RuntimeScheduler

  constructor(
    plan: SceneExecutionPlan,
    bridge: ViewportLearningBridge,
    technicalProject: unknown,
    scheduler: RuntimeScheduler = browserRuntimeScheduler,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.id = newSessionId()
    this.plan = plan
    this.bridge = bridge
    this.technicalProject = technicalProject
    this.scheduler = scheduler
    this.events = new RuntimeEventEmitter(this.id, now)
    this.commands = new LearningCommandBus(this, this.events)
    this.projectFingerprint = stableFingerprint(technicalProject)
    for (const resolution of plan.selectorResolutions) {
      this.events.emit({
        type: 'selector-resolved', sceneId: plan.sceneId,
        entityIds: resolution.entities.map(({ id }) => id),
        diagnosticCodes: resolution.diagnostics.map(({ code }) => code),
      })
    }
  }

  state(): LearningRuntimeState { return this.stateValue }
  diagnostics(): RuntimeDiagnostic[] { return structuredClone(this.diagnosticsValue) }
  currentOverlay(): LearningOverlayState { return this.bridge.currentOverlay() }
  timelineTimeMs(): number { return this.timeline?.currentTimeMs() ?? 0 }
  progressSnapshot(): LearningRuntimeProgressSnapshot {
    const timeline = this.requireTimeline().progressSnapshot()
    return {
      snapshotVersion: 1,
      planId: this.plan.id,
      packageId: this.plan.packageId,
      packageVersion: this.plan.packageVersion,
      sceneId: this.plan.sceneId,
      stepIndex: this.stepIndex,
      completedStepIds: [...this.completedStepIds].sort(),
      answerAttempts: Object.fromEntries(this.answerAttempts),
      stepAttempts: Object.fromEntries(this.stepAttempts),
      hintLevels: Object.fromEntries(this.hintLevels),
      answerEvaluations: Object.fromEntries(
        [...this.answerEvaluations].map(([id, evaluation]) => [id, structuredClone(evaluation)]),
      ),
      ...timeline,
      overlay: this.bridge.currentOverlay(),
    }
  }

  async executeCommand(command: LearningCommand): Promise<void> {
    if (command.type === 'start-scene') return this.start()
    if (command.type === 'pause') return this.pause()
    if (command.type === 'resume') return this.resume()
    if (command.type === 'stop') return this.stop()
    if (command.type === 'restart') return this.restart()
    if (command.type === 'select-entity') return this.selectEntity(command.entityId)
    if (command.type === 'confirm-selection') return this.confirmSelection()
    if (command.type === 'show-hint') return this.showHint(command.hintId)
    if (command.type === 'next-step') return this.nextStep()
    if (command.type === 'previous-step') return this.previousStep()
    if (command.type === 'jump-step') return this.jumpStep(command.stepId)
    if (command.type === 'scrub') return this.scrub(command.timeMs)
    if (command.type === 'set-speed') { this.requireTimeline().setPlaybackSpeed(command.speed); return }
    if (command.type === 'answer') return this.answer(command.questionId, command.answer)
    if (command.type === 'isolate-subsystem') return this.isolateSubsystem(command.subsystem)
    if (command.type === 'restore-view') return this.restoreViewOnly()
    if (command.type === 'cancel' || command.type === 'abort') return this.cancel(command.reason)
  }

  async start(): Promise<void> {
    if (this.stateValue !== 'ready') throw new Error(`No se puede iniciar desde ${this.stateValue}.`)
    try {
      this.snapshot = await this.bridge.capturePresentation()
      this.restored = false
      await this.bridge.applyOverlay(this.plan.initialOverlay)
      this.transition('running')
      this.timeline = new LearningTimelineController(this.plan, (evaluation) => this.onTimelineEvaluation(evaluation), this.scheduler)
      this.timeline.start()
      this.events.emit({ type: 'scene-started', packageId: this.plan.packageId, packageVersion: this.plan.packageVersion, sceneId: this.plan.sceneId })
      await this.flush()
    } catch (error) {
      await this.fail(error)
      throw error
    }
  }

  async pause(): Promise<void> {
    this.requireTimeline().pause()
    this.transition('paused')
  }

  async resume(): Promise<void> {
    this.requireTimeline().resume()
    this.transition('running')
  }

  async stop(): Promise<void> {
    this.requireTimeline().stop()
    this.transition('paused')
    await this.flush()
  }

  async restart(): Promise<void> {
    this.resetEducationalProgress()
    if (this.stateValue === 'failed') {
      this.transition('ready')
      await this.start()
    } else if (this.stateValue === 'completed') {
      this.commands.resetCancellation()
      this.snapshot = await this.bridge.capturePresentation()
      this.restored = false
      await this.bridge.applyOverlay(this.plan.initialOverlay)
      this.transition('running')
      this.timeline = new LearningTimelineController(this.plan, (evaluation) => this.onTimelineEvaluation(evaluation), this.scheduler)
      this.timeline.start()
      this.events.emit({
        type: 'scene-started',
        packageId: this.plan.packageId,
        packageVersion: this.plan.packageVersion,
        sceneId: this.plan.sceneId,
        data: { restarted: true },
      })
    } else {
      this.requireTimeline().restart()
      if (this.stateValue !== 'running') this.transition('running')
    }
    await this.flush()
  }

  async scrub(timeMs: number): Promise<void> {
    this.requireTimeline().seek(timeMs)
    await this.flush()
  }

  async nextStep(): Promise<void> {
    if (this.plan.steps.length === 0) return
    if (this.stepIndex < 0) {
      this.stepIndex = 0
      await this.showStep()
      return
    }
    const current = this.plan.steps[this.stepIndex]
    if (!this.completeStepIfSatisfied(current, true)) return
    if (this.stepIndex === this.plan.steps.length - 1) {
      await this.complete()
      return
    }
    this.stepIndex += 1
    await this.showStep()
  }

  async previousStep(): Promise<void> {
    if (this.plan.steps.length === 0) return
    this.stepIndex = Math.max(0, this.stepIndex - 1)
    await this.showStep()
  }

  async jumpStep(stepId: string): Promise<void> {
    const index = this.plan.steps.findIndex(({ id }) => id === stepId)
    if (index < 0) throw new Error(`Paso inexistente: ${stepId}`)
    if (index > this.stepIndex) {
      if (index !== this.stepIndex + 1) {
        throw new Error('No se pueden omitir pasos educativos pendientes.')
      }
      if (this.stepIndex >= 0 && !this.completeStepIfSatisfied(this.plan.steps[this.stepIndex], true)) return
    }
    this.stepIndex = index
    await this.showStep()
  }

  async selectEntity(entityId: string): Promise<void> {
    this.userSelectedEntityIds = [entityId]
    await this.pendingBridge
    const overlay = this.bridge.currentOverlay()
    overlay.selectedEntityIds = [entityId]
    await this.bridge.applyOverlay(overlay)
    this.events.emit({ type: 'entity-selected', sceneId: this.plan.sceneId, entityIds: [entityId] })
  }

  async confirmSelection(): Promise<void> {
    const step = this.currentStep()
    if (step) this.stepAttempts.set(step.id, (this.stepAttempts.get(step.id) ?? 0) + 1)
    this.events.emit({
      type: 'selection-confirmed',
      sceneId: this.plan.sceneId,
      stepId: step?.id,
      entityIds: this.bridge.currentOverlay().selectedEntityIds,
      data: { attempt: step ? this.stepAttempts.get(step.id)! : 1 },
    })
    const barrier = this.lastEvaluation?.blockedByActionId
    if (barrier) {
      this.requireTimeline().resolveBarrier(barrier)
      this.events.emit({ type: 'barrier-resolved', sceneId: this.plan.sceneId, data: { barrierId: barrier } })
      if (this.stateValue === 'awaiting-interaction') this.transition('paused')
    }
  }

  async answer(questionId: string, answer: unknown): Promise<void> {
    const step = this.currentStep()
    const questionStep = step?.questions.some(({ id }) => id === questionId)
      ? step
      : this.plan.steps.find(({ questions }) => questions.some(({ id }) => id === questionId))
    if (!questionStep) throw new Error(`Pregunta inexistente: ${questionId}.`)
    if (step && questionStep.id !== step.id) {
      throw new Error(`La pregunta ${questionId} no pertenece al paso activo ${step.id}.`)
    }
    const question = questionStep.questions.find(({ id }) => id === questionId)!
    const answerExpectations = questionStep.successCriteria.flatMap((criterion) =>
      criterion.condition === 'answer' && criterion.questionId === questionId
        ? [{
          criterionId: criterion.id,
          expectedOptionIds: [...criterion.expectedOptionIds],
        }]
        : [])
    const structuredExpectations = questionStep.successCriteria.flatMap((criterion) =>
      criterion.condition === 'structured-answer' && criterion.questionId === questionId
        ? [{
          criterionId: criterion.id,
          requiredFieldIds: [...criterion.requiredFieldIds],
          pendingHumanReview: criterion.pendingHumanReview,
        }]
        : [])
    const evaluation = normalizeAndEvaluateAnswer(
      question,
      answer,
      answerExpectations,
      structuredExpectations,
    )
    const attempt = (this.answerAttempts.get(questionId) ?? 0) + 1
    this.answerAttempts.set(questionId, attempt)
    this.stepAttempts.set(questionStep.id, (this.stepAttempts.get(questionStep.id) ?? 0) + 1)
    this.answerEvaluations.set(questionId, evaluation)
    const overlay = this.bridge.currentOverlay()
    overlay.activeQuestionId = questionId
    overlay.provisionalAnswers[questionId] = structuredClone(answer)
    const storedEvaluations = overlay.temporalState.answerEvaluations
      && typeof overlay.temporalState.answerEvaluations === 'object'
      ? overlay.temporalState.answerEvaluations as Record<string, unknown>
      : {}
    overlay.temporalState.answerEvaluations = {
      ...storedEvaluations,
      [questionId]: structuredClone(evaluation),
    }
    await this.bridge.applyOverlay(overlay)
    this.events.emit({
      type: 'answer-submitted',
      sceneId: this.plan.sceneId,
      stepId: questionStep.id,
      data: {
        questionId,
        responseKind: evaluation.responseKind,
        attempt,
        normalizedAnswer: {
          ids: [...evaluation.normalizedAnswerIds],
          text: evaluation.normalizedText,
          fields: structuredClone(evaluation.normalizedStructuredFields),
        },
        complete: evaluation.complete,
        correct: evaluation.correct,
        pendingReview: evaluation.pendingReview,
        satisfiedComponentIds: [...evaluation.satisfiedComponentIds],
        unsatisfiedComponentIds: [...evaluation.unsatisfiedComponentIds],
        unexpectedAnswerIds: [...evaluation.unexpectedAnswerIds],
        unexpectedFieldIds: [...evaluation.unexpectedFieldIds],
      },
    })
  }

  async showHint(requestedHintId?: string): Promise<void> {
    const step = this.currentStep()
    if (!step) throw new Error('Debe mostrarse un paso antes de solicitar una pista.')
    const attemptCount = this.stepAttempts.get(step.id) ?? 0
    const activeQuestion = step.questions.find(({ id }) => id === this.bridge.currentOverlay().activeQuestionId)
      ?? step.questions[0]
    const progressKey = activeQuestion?.id ?? step.id
    const nextLevel = (this.hintLevels.get(progressKey) ?? 0) + 1
    if (nextLevel > 6) throw new Error('Ya se han mostrado los seis niveles de pista.')
    const authoredHint = activeQuestion?.hints.find(({ level }) => level === nextLevel)
    const fallbackHintId = step.hintIds[nextLevel - 1]
    const hintId = authoredHint?.id ?? fallbackHintId
    if (!hintId) throw new Error(`El paso ${step.id} no declara una pista de nivel ${nextLevel}.`)
    if (requestedHintId && requestedHintId !== hintId) {
      throw new Error(`La siguiente pista graduada es ${hintId}; no se puede omitir el nivel ${nextLevel}.`)
    }
    if (!authoredHint && attemptCount < 1) {
      throw new Error('La primera pista heredada requiere un intento previo.')
    }
    if (authoredHint && attemptCount < authoredHint.availableAfterAttempts) {
      throw new Error(`La pista ${hintId} requiere ${authoredHint.availableAfterAttempts} intentos.`)
    }
    this.hintLevels.set(progressKey, nextLevel)
    const overlay = this.bridge.currentOverlay()
    const priorHints = Array.isArray(overlay.temporalState.requestedHints)
      ? overlay.temporalState.requestedHints
      : []
    overlay.temporalState.requestedHints = [
      ...priorHints,
      {
        hintId,
        level: nextLevel,
        questionId: activeQuestion?.id ?? null,
        content: authoredHint?.content ?? null,
      },
    ]
    await this.bridge.applyOverlay(overlay)
    this.events.emit({
      type: 'hint-requested',
      sceneId: this.plan.sceneId,
      stepId: step.id,
      data: {
        hintId,
        hintLevel: nextLevel,
        hintKind: authoredHint?.kind ?? 'legacy-storyboard',
        questionId: activeQuestion?.id ?? null,
        attemptCount,
        countsAsHint: authoredHint?.countsAsHint ?? true,
      },
    })
  }

  async restoreProgress(snapshot: LearningRuntimeProgressSnapshot): Promise<void> {
    if (!['running', 'paused', 'awaiting-interaction'].includes(this.stateValue)) {
      throw new Error(`No se puede restaurar progreso desde ${this.stateValue}.`)
    }
    if (snapshot.snapshotVersion !== 1) throw new Error(`Snapshot no compatible: ${snapshot.snapshotVersion}.`)
    if (
      snapshot.planId !== this.plan.id
      || snapshot.packageId !== this.plan.packageId
      || snapshot.packageVersion !== this.plan.packageVersion
      || snapshot.sceneId !== this.plan.sceneId
    ) {
      throw new Error('El snapshot no pertenece al plan activo exacto.')
    }
    if (snapshot.stepIndex < -1 || snapshot.stepIndex >= this.plan.steps.length) {
      throw new Error(`Índice de paso inválido en snapshot: ${snapshot.stepIndex}.`)
    }
    const knownStepIds = new Set(this.plan.steps.map(({ id }) => id))
    const unknownCompleted = snapshot.completedStepIds.filter((id) => !knownStepIds.has(id))
    if (unknownCompleted.length > 0) {
      throw new Error(`El snapshot contiene pasos inexistentes: ${unknownCompleted.join(', ')}.`)
    }
    this.stepIndex = snapshot.stepIndex
    this.replaceSet(this.completedStepIds, snapshot.completedStepIds)
    this.replaceNumberMap(this.answerAttempts, snapshot.answerAttempts)
    this.replaceNumberMap(this.stepAttempts, snapshot.stepAttempts)
    this.replaceNumberMap(this.hintLevels, snapshot.hintLevels)
    this.answerEvaluations.clear()
    Object.entries(snapshot.answerEvaluations).forEach(([id, evaluation]) => {
      this.answerEvaluations.set(id, structuredClone(evaluation))
    })
    this.requireTimeline().restoreProgress({
      timelinePositionMs: snapshot.timelinePositionMs,
      playbackSpeed: snapshot.playbackSpeed,
      resolvedBarrierIds: [...snapshot.resolvedBarrierIds],
    })
    await this.flush()
    await this.bridge.applyOverlay(snapshot.overlay)
    this.userSelectedEntityIds = [...snapshot.overlay.selectedEntityIds]
    if (this.stateValue !== 'paused') this.transition('paused')
  }

  async isolateSubsystem(subsystem: string): Promise<void> {
    const ids = this.plan.selectorResolutions
      .filter(({ selector }) => selector.by === 'subsystem' && selector.value === subsystem)
      .flatMap(({ entities }) => entities.flatMap(({ relatedInstanceIds }) => relatedInstanceIds))
    if (ids.length === 0) throw new Error(`El plan no contiene el subsistema ${subsystem}.`)
    const overlay = this.bridge.currentOverlay()
    overlay.isolatedEntityIds = [...new Set(ids)].sort()
    await this.bridge.applyOverlay(overlay)
  }

  async cancel(reason: string): Promise<void> {
    if (this.stateValue === 'disposed') return
    this.timeline?.dispose()
    if (this.stateValue !== 'cancelling') this.transition('cancelling')
    this.events.emit({ type: 'scene-cancelled', sceneId: this.plan.sceneId, data: { reason } })
    await this.restore('disposed')
  }

  async fail(error: unknown): Promise<void> {
    if (this.stateValue === 'disposed') return
    this.timeline?.dispose()
    const issue = diagnostic({
      code: 'LR-RUNTIME-FAILED', category: 'internal-error', severity: 'error',
      message: error instanceof Error ? error.message : String(error), source: 'runtime', sceneId: this.plan.sceneId,
      suggestedRecovery: 'Restaurar la vista y reintentar la escena.', blocking: true, retrySafe: true,
    })
    this.diagnosticsValue.push(issue)
    this.events.emit({ type: 'runtime-error', sceneId: this.plan.sceneId, diagnosticCodes: [issue.code] })
    if (this.stateValue !== 'failed') this.transition('failed')
    await this.restore('failed')
  }

  async complete(): Promise<void> {
    if (this.stateValue === 'completed' || this.stateValue === 'disposed') return
    const lastStep = this.plan.steps.at(-1)
    if (lastStep && !this.completedStepIds.has(lastStep.id)) {
      if (this.currentStep()?.id !== lastStep.id || !this.completeStepIfSatisfied(lastStep, false)) return
    }
    this.timeline?.dispose()
    await this.restore('completed')
    this.events.emit({ type: 'scene-completed', sceneId: this.plan.sceneId })
  }

  async dispose(): Promise<void> {
    if (this.stateValue === 'disposed') return
    if (this.stateValue === 'completed') {
      this.transition('disposed')
      return
    }
    await this.cancel('dispose')
  }

  async flush(): Promise<void> {
    await this.pendingBridge
  }

  private currentStep(): CompiledSceneStep | undefined {
    return this.stepIndex >= 0 ? this.plan.steps[this.stepIndex] : undefined
  }

  private completeStepIfSatisfied(step: CompiledSceneStep, confirming: boolean): boolean {
    const evaluations = this.evaluateStepCriteria(step, confirming)
    const unsatisfied = evaluations.filter(({ satisfied }) => !satisfied)
    if (unsatisfied.length > 0) {
      const issue = diagnostic({
        code: 'LR-STEP-CRITERIA-UNMET',
        category: 'invalid-state',
        message: `El paso ${step.id} aún no cumple sus criterios de éxito.`,
        technicalDetail: unsatisfied.map(({ criterionId, detail }) => `${criterionId}: ${detail}`).join('; '),
        source: 'runtime',
        packageId: this.plan.packageId,
        packageVersion: this.plan.packageVersion,
        sceneId: this.plan.sceneId,
        stepId: step.id,
        suggestedRecovery: 'Completar los componentes indicados antes de avanzar.',
        blocking: true,
        retrySafe: true,
      })
      this.diagnosticsValue.push(issue)
      this.events.emit({
        type: 'step-blocked',
        sceneId: this.plan.sceneId,
        stepId: step.id,
        diagnosticCodes: [issue.code],
        data: {
          unsatisfiedCriterionIds: unsatisfied.map(({ criterionId }) => criterionId),
          reasons: unsatisfied.map(({ detail }) => detail),
        },
      })
      if (this.stateValue !== 'awaiting-interaction') this.transition('awaiting-interaction')
      return false
    }
    if (!this.completedStepIds.has(step.id)) {
      this.completedStepIds.add(step.id)
      this.events.emit({
        type: 'step-completed',
        sceneId: this.plan.sceneId,
        stepId: step.id,
        data: { satisfiedCriterionIds: evaluations.map(({ criterionId }) => criterionId) },
      })
    }
    if (this.stateValue === 'awaiting-interaction') this.transition('paused')
    return true
  }

  private evaluateStepCriteria(step: CompiledSceneStep, confirming: boolean): StepCriterionEvaluation[] {
    const selected = [...this.bridge.currentOverlay().selectedEntityIds].sort()
    return step.successCriteria.map((criterion) => {
      if (criterion.condition === 'selected') {
        const expected = [...criterion.entityIds].sort()
        const satisfied = selected.length === expected.length
          && selected.every((id, index) => id === expected[index])
        return {
          criterionId: criterion.id,
          satisfied,
          detail: satisfied
            ? 'selección exacta confirmada'
            : `selección requerida: ${expected.join(', ') || 'ninguna'}`,
        }
      }
      if (criterion.condition === 'answer') {
        const evaluation = this.answerEvaluations.get(criterion.questionId)
        return {
          criterionId: criterion.id,
          satisfied: evaluation?.correct === true,
          detail: !evaluation
            ? `falta responder ${criterion.questionId}`
            : evaluation.pendingReview
              ? `${criterion.questionId} está pendiente de revisión`
              : evaluation.correct
                ? 'respuesta correcta'
                : `componentes pendientes: ${evaluation.unsatisfiedComponentIds.join(', ')}`,
        }
      }
      if (criterion.condition === 'structured-answer') {
        const evaluation = this.answerEvaluations.get(criterion.questionId)
        const satisfied = Boolean(
          evaluation?.complete
          && (
            criterion.pendingHumanReview
              ? evaluation.pendingReview
              : evaluation.correct === true
          ),
        )
        return {
          criterionId: criterion.id,
          satisfied,
          detail: !evaluation
            ? `falta la respuesta estructurada ${criterion.questionId}`
            : !evaluation.complete
              ? `campos pendientes: ${evaluation.unsatisfiedComponentIds.join(', ')}`
              : criterion.pendingHumanReview && evaluation.pendingReview
                ? 'respuesta completa registrada; requiere una revisión explícita'
                : evaluation.correct
                  ? 'respuesta estructurada completa'
                  : 'la respuesta requiere revisión no declarada por el criterio',
        }
      }
      return {
        criterionId: criterion.id,
        satisfied: confirming,
        detail: confirming ? 'paso confirmado' : 'falta confirmar el paso',
      }
    })
  }

  private resetEducationalProgress(): void {
    this.stepIndex = -1
    this.completedStepIds.clear()
    this.answerAttempts.clear()
    this.stepAttempts.clear()
    this.hintLevels.clear()
    this.answerEvaluations.clear()
    this.userSelectedEntityIds = undefined
  }

  private replaceSet(target: Set<string>, values: string[]): void {
    target.clear()
    values.forEach((value) => target.add(value))
  }

  private replaceNumberMap(target: Map<string, number>, values: Record<string, number>): void {
    target.clear()
    for (const [id, value] of Object.entries(values)) {
      if (!Number.isInteger(value) || value < 0) throw new Error(`Contador inválido para ${id}.`)
      target.set(id, value)
    }
  }

  private onTimelineEvaluation(evaluation: TimelineEvaluation): void {
    this.lastEvaluation = evaluation
    const interaction = this.bridge.currentOverlay()
    const state = {
      ...evaluation.state,
      selectedEntityIds: this.userSelectedEntityIds
        ? [...this.userSelectedEntityIds]
        : [...evaluation.state.selectedEntityIds],
      activeStepId: interaction.activeStepId,
      activeQuestionId: interaction.activeQuestionId,
      provisionalAnswers: structuredClone(interaction.provisionalAnswers),
      simulatedErrors: [...interaction.simulatedErrors],
      visualFilters: [...interaction.visualFilters],
      temporalState: structuredClone(interaction.temporalState),
    }
    this.pendingBridge = this.pendingBridge.then(() => this.bridge.applyOverlay(state)).catch((error) => this.fail(error))
    if (evaluation.blockedByActionId && this.stateValue === 'running') this.transition('awaiting-interaction')
    if (evaluation.completed && this.stateValue === 'running' && this.plan.steps.length === 0) void this.complete()
  }

  private async showStep(): Promise<void> {
    const step = this.plan.steps[this.stepIndex]
    const overlay = this.bridge.currentOverlay()
    overlay.activeStepId = step.id
    overlay.activeQuestionId = step.questionIds[0]
    await this.bridge.applyOverlay(overlay)
    this.events.emit({ type: 'step-shown', sceneId: this.plan.sceneId, stepId: step.id })
  }

  private async restoreViewOnly(): Promise<void> {
    if (!this.snapshot) throw new Error('No existe snapshot de presentación.')
    await this.bridge.restorePresentation(this.snapshot)
  }

  private async restore(finalState: 'completed' | 'failed' | 'disposed'): Promise<void> {
    if (this.restored) {
      if (this.stateValue !== finalState) this.transition(finalState)
      return
    }
    if (this.stateValue !== 'restoring') this.transition('restoring')
    try {
      if (this.snapshot) await this.bridge.restorePresentation(this.snapshot)
      else await this.bridge.clearOverlay()
      this.restored = true
      if (stableFingerprint(this.technicalProject) !== this.projectFingerprint) {
        throw new Error('El proyecto técnico cambió durante la sesión educativa.')
      }
      this.events.emit({ type: 'restoration-completed', sceneId: this.plan.sceneId })
      this.transition(finalState)
    } catch (error) {
      const issue = diagnostic({
        code: 'LR-RESTORATION-INCOMPLETE', category: 'restoration-incomplete', severity: 'fatal',
        message: error instanceof Error ? error.message : String(error), source: 'bridge', sceneId: this.plan.sceneId,
        suggestedRecovery: 'Reiniciar el viewport; el proyecto técnico permanece separado.', blocking: true, retrySafe: true,
      })
      this.diagnosticsValue.push(issue)
      if (this.stateValue !== 'failed') this.transition('failed')
      throw error
    }
  }

  private requireTimeline(): LearningTimelineController {
    if (!this.timeline) throw new Error('El timeline no está inicializado.')
    return this.timeline
  }

  private transition(next: LearningRuntimeState): void {
    if (this.stateValue === next) return
    if (!TRANSITIONS[this.stateValue].includes(next)) throw new Error(`Transición inválida: ${this.stateValue} → ${next}.`)
    this.stateValue = next
  }
}

export interface LearningRuntimeOptions {
  loader: LearningPackageLoader
  registry?: LearningPackageRegistry
  compiler?: SceneCompiler
  capabilities?: RuntimeCapability[]
  scheduler?: RuntimeScheduler
  now?: () => string
}

export class LearningRuntime {
  private stateValue: LearningRuntimeState = 'idle'
  private readonly registry: LearningPackageRegistry
  private readonly compiler: SceneCompiler
  private readonly capabilities: RuntimeCapability[]
  private readonly scheduler: RuntimeScheduler
  private readonly now: () => string
  private readonly runtimeEvents: RuntimeEventEmitter
  private readonly diagnosticsValue: RuntimeDiagnostic[] = []
  private active?: LearningSceneSession
  private readonly options: LearningRuntimeOptions

  constructor(options: LearningRuntimeOptions) {
    this.options = options
    this.registry = options.registry ?? new LearningPackageRegistry()
    this.compiler = options.compiler ?? new SceneCompiler()
    this.capabilities = options.capabilities ?? []
    this.scheduler = options.scheduler ?? browserRuntimeScheduler
    this.now = options.now ?? (() => new Date().toISOString())
    this.runtimeEvents = new RuntimeEventEmitter(`learning-runtime-${newSessionId()}`, this.now)
  }

  state(): LearningRuntimeState { return this.active?.state() ?? this.stateValue }
  diagnostics(): RuntimeDiagnostic[] { return [...structuredClone(this.diagnosticsValue), ...(this.active?.diagnostics() ?? [])] }
  events(): RuntimeEvent[] { return [...this.runtimeEvents.history(), ...(this.active?.events.history() ?? [])] }
  activeSession(): LearningSceneSession | undefined { return this.active }
  packageRegistry(): LearningPackageRegistry { return this.registry }

  async loadPackage(bytes: Uint8Array, origin: LearningPackageOrigin): Promise<LearningPackageLoadResult> {
    await this.cancelActive('load-another-package')
    if (this.stateValue === 'failed') this.transition('idle')
    this.transition('loading')
    this.transition('validating')
    const result = await this.options.loader.loadFromBytes(bytes, origin)
    if (!result.success) {
      this.diagnosticsValue.push(...result.diagnostics)
      this.runtimeEvents.emit({ type: 'package-rejected', diagnosticCodes: result.diagnostics.map(({ code }) => code) })
      this.transition('failed')
      return result
    }
    const registration = this.registry.register(result.value)
    this.diagnosticsValue.push(...registration.diagnostics)
    if (hasBlockingDiagnostics(registration.diagnostics)) {
      this.transition('failed')
      return { success: false, diagnostics: registration.diagnostics }
    }
    this.runtimeEvents.emit({
      type: 'package-loaded', packageId: result.value.pack.manifest.id,
      packageVersion: result.value.pack.manifest.packageVersion,
    })
    this.transition('idle')
    return result
  }

  prepareScene(
    packageId: string,
    versionRange: string,
    sceneId: string,
    index: ProjectEntityIndex,
    bridge: ViewportLearningBridge,
    technicalProject: unknown,
    reducedMotion = false,
  ): SceneCompilationResult {
    if (this.stateValue === 'failed') this.stateValue = 'idle'
    if (this.stateValue !== 'idle') throw new Error(`No se puede compilar desde ${this.stateValue}.`)
    this.transition('compiling')
    const graph = this.registry.resolveForSession(packageId, versionRange)
    if (!graph) {
      const issue = diagnostic({
        code: 'LR-RUNTIME-PACKAGE-NOT-FOUND', category: 'package-error', message: `No existe ${packageId}@${versionRange}.`,
        source: 'runtime', packageId, suggestedRecovery: 'Cargar el paquete antes de compilar.', blocking: true, retrySafe: true,
      })
      this.diagnosticsValue.push(issue)
      this.transition('failed')
      return { success: false, diagnostics: [issue] }
    }
    if (hasBlockingDiagnostics(graph.diagnostics)) {
      this.diagnosticsValue.push(...graph.diagnostics)
      this.transition('failed')
      return { success: false, diagnostics: graph.diagnostics }
    }
    const resolver = new CapabilityResolver([...HEADLESS_RUNTIME_CAPABILITIES, ...bridge.capabilities(), ...this.capabilities])
    const compilation = this.compiler.compile(graph.root, sceneId, index, resolver, {
      reducedMotion,
      entitySupport: (entityIds) => bridge.entitySupport(entityIds),
    })
    this.diagnosticsValue.push(...compilation.diagnostics)
    if (!compilation.success) {
      this.transition('failed')
      return compilation
    }
    this.active = new LearningSceneSession(compilation.plan, bridge, technicalProject, this.scheduler, this.now)
    this.transition('ready')
    this.runtimeEvents.emit({
      type: 'scene-compiled', packageId: compilation.plan.packageId, packageVersion: compilation.plan.packageVersion,
      sceneId: compilation.plan.sceneId, diagnosticCodes: compilation.diagnostics.map(({ code }) => code),
    })
    return compilation
  }

  async cancelActive(reason: string): Promise<void> {
    if (!this.active || this.active.state() === 'disposed') { this.active = undefined; return }
    if (this.active.state() === 'completed') await this.active.dispose()
    else await this.active.cancel(reason)
    this.active = undefined
    this.stateValue = 'idle'
  }

  async dispose(): Promise<void> {
    await this.cancelActive('runtime-dispose')
    if (this.stateValue !== 'disposed') this.transition('disposed')
  }

  private transition(next: LearningRuntimeState): void {
    if (this.stateValue === next) return
    if (!TRANSITIONS[this.stateValue].includes(next)) throw new Error(`Transición inválida del runtime: ${this.stateValue} → ${next}.`)
    this.stateValue = next
  }
}
