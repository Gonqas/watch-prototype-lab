import type { SceneExecutionPlan, CompiledTimelineAction } from './compiler'
import { cloneLearningOverlay, normalizeLearningOverlay, type LearningCameraState, type LearningOverlayState, type LearningSectionState } from './overlay'

export type TimelineState = 'idle' | 'running' | 'paused' | 'awaiting-interaction' | 'completed' | 'stopped' | 'disposed'

export interface TimelineEvaluation {
  requestedMs: number
  evaluatedMs: number
  state: LearningOverlayState
  blockedByActionId?: string
  completed: boolean
}

export interface TimelineProgressSnapshot {
  timelinePositionMs: number
  playbackSpeed: number
  resolvedBarrierIds: string[]
}

export interface RuntimeScheduler {
  now(): number
  setTimer(callback: () => void, delayMs: number): unknown
  clearTimer(handle: unknown): void
}

export const browserRuntimeScheduler: RuntimeScheduler = {
  now: () => performance.now(),
  setTimer: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimer: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
}

function add(values: string[], additions: string[]): string[] {
  return [...new Set([...values, ...additions])].sort()
}

function remove(values: string[], removals: string[]): string[] {
  const blocked = new Set(removals)
  return values.filter((value) => !blocked.has(value))
}

function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

function interpolateTuple(from: [number, number, number], to: [number, number, number], progress: number): [number, number, number] {
  return [interpolateNumber(from[0], to[0], progress), interpolateNumber(from[1], to[1], progress), interpolateNumber(from[2], to[2], progress)]
}

function applyAction(overlay: LearningOverlayState, action: CompiledTimelineAction, progress = 1): LearningOverlayState {
  const next = cloneLearningOverlay(overlay)
  if (action.operation === 'show') {
    next.visibleEntityIds = add(next.visibleEntityIds, action.entityIds)
    next.hiddenEntityIds = remove(next.hiddenEntityIds, action.entityIds)
  } else if (action.operation === 'hide') {
    next.hiddenEntityIds = add(next.hiddenEntityIds, action.entityIds)
    next.visibleEntityIds = remove(next.visibleEntityIds, action.entityIds)
  } else if (action.operation === 'select') next.selectedEntityIds = [...action.entityIds]
  else if (action.operation === 'isolate') next.isolatedEntityIds = [...action.entityIds]
  else if (action.operation === 'highlight') next.highlightedEntityIds = add(next.highlightedEntityIds, action.entityIds)
  else if (action.operation === 'explode' && typeof action.value === 'number') next.explode = interpolateNumber(next.explode, action.value, progress)
  else if (action.operation === 'transparency' && typeof action.value === 'number') {
    action.entityIds.forEach((id) => { next.transparency[id] = interpolateNumber(next.transparency[id] ?? 1, action.value as number, progress) })
  } else if (action.operation === 'camera' && typeof action.value === 'object' && action.value !== null && 'position' in action.value) {
    const target = action.value as LearningCameraState
    next.camera = next.camera && progress < 1 ? {
      ...target,
      position: interpolateTuple(next.camera.position, target.position, progress),
      target: interpolateTuple(next.camera.target, target.target, progress),
      fieldOfView: target.fieldOfView === undefined ? next.camera.fieldOfView : interpolateNumber(next.camera.fieldOfView ?? target.fieldOfView, target.fieldOfView, progress),
    } : structuredClone(target)
  } else if (action.operation === 'section' && typeof action.value === 'object' && action.value !== null && 'enabled' in action.value) {
    next.section = structuredClone(action.value as LearningSectionState)
  } else if (action.operation === 'annotate' && typeof action.value === 'string') next.annotations = add(next.annotations, [action.value])
  else if (action.operation === 'overlay' && typeof action.value === 'string') next.temporalState[action.id] = action.value
  else if (action.operation === 'rotate' || action.operation === 'translate') next.temporalState[action.id] = action.value
  return normalizeLearningOverlay(next)
}

export function evaluateTimelineAt(
  plan: SceneExecutionPlan,
  requestedMs: number,
  resolvedBarriers: ReadonlySet<string> = new Set(),
): TimelineEvaluation {
  const requested = Math.max(0, Math.min(plan.durationMs, requestedMs))
  const barrier = plan.timeline.find((action) => action.waitFor !== 'none' && action.atMs <= requested && !resolvedBarriers.has(action.id))
  const evaluatedMs = barrier ? barrier.atMs : requested
  let overlay = cloneLearningOverlay(plan.initialOverlay)
  for (const action of plan.timeline) {
    if (action.atMs > evaluatedMs) break
    const progress = action.durationMs === 0 ? 1 : Math.min(1, Math.max(0, (evaluatedMs - action.atMs) / action.durationMs))
    overlay = applyAction(overlay, action, progress)
  }
  return {
    requestedMs,
    evaluatedMs,
    state: overlay,
    blockedByActionId: barrier?.id,
    completed: !barrier && evaluatedMs >= plan.durationMs,
  }
}

export class LearningTimelineController {
  private stateValue: TimelineState = 'idle'
  private timeMs = 0
  private speed = 1
  private timer: unknown
  private lastSchedulerTime = 0
  private readonly resolvedBarriers = new Set<string>()
  readonly plan: SceneExecutionPlan
  private readonly onEvaluation: (evaluation: TimelineEvaluation) => void
  private readonly scheduler: RuntimeScheduler

  constructor(
    plan: SceneExecutionPlan,
    onEvaluation: (evaluation: TimelineEvaluation) => void,
    scheduler: RuntimeScheduler = browserRuntimeScheduler,
  ) { this.plan = plan; this.onEvaluation = onEvaluation; this.scheduler = scheduler }

  state(): TimelineState { return this.stateValue }
  currentTimeMs(): number { return this.timeMs }
  playbackSpeed(): number { return this.speed }
  progressSnapshot(): TimelineProgressSnapshot {
    return {
      timelinePositionMs: this.timeMs,
      playbackSpeed: this.speed,
      resolvedBarrierIds: [...this.resolvedBarriers].sort(),
    }
  }

  start(): void {
    this.assertNotDisposed()
    if (!['idle', 'stopped', 'completed'].includes(this.stateValue)) throw new Error(`No se puede iniciar el timeline desde ${this.stateValue}.`)
    this.timeMs = 0
    this.resolvedBarriers.clear()
    this.stateValue = 'running'
    this.lastSchedulerTime = this.scheduler.now()
    this.evaluateAndNotify()
    this.schedule()
  }

  pause(): void {
    if (this.stateValue !== 'running') throw new Error(`No se puede pausar el timeline desde ${this.stateValue}.`)
    this.cancelTimer()
    this.stateValue = 'paused'
  }

  resume(): void {
    if (!['paused', 'awaiting-interaction'].includes(this.stateValue)) throw new Error(`No se puede reanudar el timeline desde ${this.stateValue}.`)
    if (this.stateValue === 'awaiting-interaction') throw new Error('Debe resolverse la interacción antes de reanudar.')
    this.stateValue = 'running'
    this.lastSchedulerTime = this.scheduler.now()
    this.schedule()
  }

  stop(): void {
    this.assertNotDisposed()
    this.cancelTimer()
    this.stateValue = 'stopped'
    this.timeMs = 0
    this.evaluateAndNotify()
  }

  restart(): void { this.stop(); this.start() }

  seek(timeMs: number): TimelineEvaluation {
    this.assertNotDisposed()
    this.timeMs = Math.max(0, Math.min(this.plan.durationMs, timeMs))
    return this.evaluateAndNotify()
  }

  setPlaybackSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0 || speed > 20) throw new Error(`Velocidad inválida: ${speed}`)
    this.speed = speed
  }

  advanceBy(deltaMs: number): TimelineEvaluation {
    this.assertNotDisposed()
    if (deltaMs < 0) throw new Error('advanceBy requiere un delta no negativo.')
    this.timeMs = Math.min(this.plan.durationMs, this.timeMs + deltaMs * this.speed)
    return this.evaluateAndNotify()
  }

  resolveBarrier(actionId: string): void {
    const action: CompiledTimelineAction | undefined = this.plan.timeline.find((candidate) => candidate.id === actionId && candidate.waitFor !== 'none')
    if (!action) throw new Error(`No existe la barrera ${actionId}.`)
    this.resolvedBarriers.add(actionId)
    if (this.stateValue === 'awaiting-interaction') this.stateValue = 'paused'
  }

  restoreProgress(snapshot: TimelineProgressSnapshot): TimelineEvaluation {
    this.assertNotDisposed()
    const validBarrierIds = new Set(this.plan.timeline
      .filter(({ waitFor }) => waitFor !== 'none')
      .map(({ id }) => id))
    const unknownBarrierIds = snapshot.resolvedBarrierIds.filter((id) => !validBarrierIds.has(id))
    if (unknownBarrierIds.length > 0) {
      throw new Error(`El checkpoint referencia barreras inexistentes: ${unknownBarrierIds.join(', ')}.`)
    }
    if (!Number.isFinite(snapshot.playbackSpeed) || snapshot.playbackSpeed <= 0 || snapshot.playbackSpeed > 20) {
      throw new Error(`Velocidad inválida en checkpoint: ${snapshot.playbackSpeed}.`)
    }
    this.cancelTimer()
    this.resolvedBarriers.clear()
    snapshot.resolvedBarrierIds.forEach((id) => this.resolvedBarriers.add(id))
    this.speed = snapshot.playbackSpeed
    this.timeMs = Math.max(0, Math.min(this.plan.durationMs, snapshot.timelinePositionMs))
    this.stateValue = 'paused'
    return this.evaluateAndNotify()
  }

  dispose(): void {
    if (this.stateValue === 'disposed') return
    this.cancelTimer()
    this.stateValue = 'disposed'
  }

  private evaluateAndNotify(): TimelineEvaluation {
    const evaluation = evaluateTimelineAt(this.plan, this.timeMs, this.resolvedBarriers)
    this.timeMs = evaluation.evaluatedMs
    if (evaluation.blockedByActionId) {
      this.cancelTimer()
      this.stateValue = 'awaiting-interaction'
    } else if (evaluation.completed && this.stateValue === 'running') {
      this.cancelTimer()
      this.stateValue = 'completed'
    }
    this.onEvaluation(evaluation)
    return evaluation
  }

  private schedule(): void {
    this.cancelTimer()
    if (this.stateValue !== 'running') return
    this.timer = this.scheduler.setTimer(() => {
      const now = this.scheduler.now()
      const delta = Math.max(0, now - this.lastSchedulerTime)
      this.lastSchedulerTime = now
      this.advanceBy(delta)
      this.schedule()
    }, 16)
  }

  private cancelTimer(): void {
    if (this.timer !== undefined) this.scheduler.clearTimer(this.timer)
    this.timer = undefined
  }

  private assertNotDisposed(): void {
    if (this.stateValue === 'disposed') throw new Error('El timeline está disposed.')
  }
}
