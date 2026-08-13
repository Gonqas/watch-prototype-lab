import type {
  CameraPose,
  CameraTransition,
  EducationalCameraBookmark,
  EducationalCameraIntent,
  EducationalCameraSnapshot,
  EducationalSceneGraph,
  Vec3,
  VisualBounds,
  VisualDiagnostic,
} from './model'
import { mergeVisualBounds } from './sceneGraph'

const DEFAULT_CAMERA: CameraPose = {
  position: [10, 8, 10],
  target: [0, 0, 0],
  up: [0, 1, 0],
  projection: 'perspective',
  fieldOfView: 32,
  orthographicScale: 10,
}

function add(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]
}

function scale(value: Vec3, amount: number): Vec3 {
  return [value[0] * amount, value[1] * amount, value[2] * amount]
}

function normalize(value: Vec3): Vec3 {
  const magnitude = Math.hypot(value[0], value[1], value[2])
  return magnitude <= Number.EPSILON
    ? [0, 0, 1]
    : [value[0] / magnitude, value[1] / magnitude, value[2] / magnitude]
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

function interpolateVec3(from: Vec3, to: Vec3, progress: number): Vec3 {
  return [
    interpolate(from[0], to[0], progress),
    interpolate(from[1], to[1], progress),
    interpolate(from[2], to[2], progress),
  ]
}

function boundsForIntent(
  graphs: EducationalSceneGraph[],
  intent: EducationalCameraIntent,
): VisualBounds | undefined {
  const allowedMounts = intent.mountIds ? new Set(intent.mountIds) : undefined
  const allowedEntities = intent.entityIds ? new Set(intent.entityIds) : undefined
  const values = graphs
    .filter(({ mountId }) => !allowedMounts || allowedMounts.has(mountId))
    .flatMap((graph) => allowedEntities
      ? graph.entities.filter(({ id }) => allowedEntities.has(id)).flatMap(({ bounds }) => bounds ? [bounds] : [])
      : graph.bounds ? [graph.bounds] : [])
  return mergeVisualBounds(values)
}

function directionForIntent(kind: EducationalCameraIntent['kind']): Vec3 {
  if (kind === 'dial' || kind === 'axial') return [0.001, 1, 0]
  if (kind === 'bridges') return [0.001, -1, 0]
  if (kind === 'side') return [1, 0.08, 0]
  if (kind === 'comparison' || kind === 'split') return [0, 0.4, 1]
  if (kind === 'close-up') return [0.62, 0.48, 0.66]
  return [0.72, 0.52, 0.72]
}

export function resolveEducationalCameraIntent(
  graphs: EducationalSceneGraph[],
  intent: EducationalCameraIntent,
): { pose?: CameraPose; diagnostics: VisualDiagnostic[] } {
  const bounds = boundsForIntent(graphs, intent)
  if (!bounds) {
    return {
      diagnostics: [{
        code: 'EV-CAMERA-NO-BOUNDS',
        severity: 'error',
        message: `La intención de cámara ${intent.kind} no encontró geometría encuadrable.`,
        accessibleMessage: 'La cámara no puede encuadrar la selección porque su geometría es desconocida.',
        entityIds: intent.entityIds,
      }],
    }
  }
  const padding = Math.max(1, intent.padding ?? 1.35)
  const distanceMultiplier = intent.kind === 'close-up' ? 1.8 : intent.kind === 'comparison' || intent.kind === 'split' ? 3.2 : 2.5
  const distance = Math.max(1, bounds.radius * padding * distanceMultiplier)
  const direction = normalize(directionForIntent(intent.kind))
  return {
    pose: {
      position: add(bounds.center, scale(direction, distance)),
      target: [...bounds.center],
      up: intent.kind === 'side' ? [0, 1, 0] : [0, 0, -1],
      projection: intent.projection ?? 'perspective',
      fieldOfView: intent.kind === 'close-up' ? 26 : 32,
      orthographicScale: Math.max(1, bounds.radius * padding * 2),
    },
    diagnostics: [],
  }
}

export class EducationalCameraController {
  private poseValue: CameraPose
  private readonly bookmarksValue = new Map<string, EducationalCameraBookmark>()
  private transitionValue?: CameraTransition

  constructor(initial: CameraPose = DEFAULT_CAMERA) {
    this.poseValue = structuredClone(initial)
  }

  pose(): CameraPose {
    return structuredClone(this.poseValue)
  }

  applyIntent(
    graphs: EducationalSceneGraph[],
    intent: EducationalCameraIntent,
    options: { reducedMotion: boolean; transition: 'instant' | 'smooth'; durationMs?: number },
  ): VisualDiagnostic[] {
    const resolution = resolveEducationalCameraIntent(graphs, intent)
    if (!resolution.pose) return resolution.diagnostics
    const durationMs = options.reducedMotion || options.transition === 'instant'
      ? 0
      : Math.max(0, options.durationMs ?? 600)
    this.transitionValue = {
      kind: durationMs === 0 ? 'instant' : 'smooth',
      durationMs,
      state: durationMs === 0 ? 'completed' : 'running',
      from: this.pose(),
      to: structuredClone(resolution.pose),
    }
    if (durationMs === 0) this.poseValue = structuredClone(resolution.pose)
    return []
  }

  evaluateTransition(elapsedMs: number): CameraPose {
    const transition = this.transitionValue
    if (!transition || transition.state !== 'running') return this.pose()
    const progress = transition.durationMs === 0 ? 1 : Math.min(1, Math.max(0, elapsedMs / transition.durationMs))
    this.poseValue = {
      position: interpolateVec3(transition.from.position, transition.to.position, progress),
      target: interpolateVec3(transition.from.target, transition.to.target, progress),
      up: interpolateVec3(transition.from.up, transition.to.up, progress),
      projection: transition.to.projection,
      fieldOfView: interpolate(transition.from.fieldOfView, transition.to.fieldOfView, progress),
      orthographicScale: interpolate(transition.from.orthographicScale, transition.to.orthographicScale, progress),
    }
    if (progress >= 1) transition.state = 'completed'
    return this.pose()
  }

  pause(): void {
    if (this.transitionValue?.state === 'running') this.transitionValue.state = 'paused'
  }

  resume(): void {
    if (this.transitionValue?.state === 'paused') this.transitionValue.state = 'running'
  }

  skip(): void {
    if (!this.transitionValue) return
    this.poseValue = structuredClone(this.transitionValue.to)
    this.transitionValue.state = 'skipped'
  }

  addBookmark(id: string, label: string, intent: EducationalCameraIntent): EducationalCameraBookmark {
    const bookmark = { id, label, intent: structuredClone(intent), pose: this.pose() }
    this.bookmarksValue.set(id, bookmark)
    return structuredClone(bookmark)
  }

  restoreBookmark(id: string): boolean {
    const bookmark = this.bookmarksValue.get(id)
    if (!bookmark) return false
    this.poseValue = structuredClone(bookmark.pose)
    this.transitionValue = undefined
    return true
  }

  snapshot(): EducationalCameraSnapshot {
    return {
      pose: this.pose(),
      bookmarks: [...this.bookmarksValue.values()].map((bookmark) => structuredClone(bookmark)),
      transition: this.transitionValue ? structuredClone(this.transitionValue) : undefined,
    }
  }

  restore(snapshot: EducationalCameraSnapshot): void {
    this.poseValue = structuredClone(snapshot.pose)
    this.bookmarksValue.clear()
    snapshot.bookmarks.forEach((bookmark) => this.bookmarksValue.set(bookmark.id, structuredClone(bookmark)))
    this.transitionValue = snapshot.transition ? structuredClone(snapshot.transition) : undefined
  }
}
