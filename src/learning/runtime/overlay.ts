export interface LearningCameraState {
  position: [number, number, number]
  target: [number, number, number]
  projection: 'perspective' | 'orthographic'
  fieldOfView?: number
}

export interface LearningSectionState {
  enabled: boolean
  normal: [number, number, number]
  offset: number
}

export type LearningOverlayStateCue =
  | 'hidden'
  | 'available'
  | 'active'
  | 'dimmed'
  | 'blocked'
  | 'incomplete'
  | 'unknown'

export type LearningSpatialAnchor =
  | { kind: 'point'; point: [number, number, number] }
  | { kind: 'entity'; entityIds: string[]; offset: [number, number, number] }
  | { kind: 'interface'; interfaceId: string; participant: 'source' | 'target' | 'midpoint' }

export interface LearningOverlayVisual {
  id: string
  kind: 'arrow' | 'rotation' | 'energy-path' | 'label' | 'highlight' | 'text'
  entityIds: string[]
  entityGroups?: string[][]
  text: string
  color?: string
  state?: LearningOverlayStateCue
  pattern?: string
  start?: LearningSpatialAnchor
  end?: LearningSpatialAnchor
  axis?: [number, number, number]
  direction?: 'clockwise' | 'counter-clockwise' | 'alternating' | 'unknown'
  conceptualSpeed?: 'stopped' | 'slow' | 'medium' | 'fast' | 'unknown'
  activeSegment?: number
  comparisonGroup?: string
  fidelity?: FidelityProfile
  numberedAlternative?: string[]
  accessibleLabel: string
}

export interface LearningOverlayState {
  selectedEntityIds: string[]
  visibleEntityIds: string[]
  hiddenEntityIds: string[]
  isolatedEntityIds: string[]
  transparency: Record<string, number>
  highlightedEntityIds: string[]
  explode: number
  section?: LearningSectionState
  camera?: LearningCameraState
  overlays: LearningOverlayVisual[]
  annotations: string[]
  activeStepId?: string
  activeQuestionId?: string
  provisionalAnswers: Record<string, unknown>
  simulatedErrors: string[]
  visualFilters: string[]
  playbackSpeed: number
  temporalState: Record<string, unknown>
}

export const EMPTY_LEARNING_OVERLAY: LearningOverlayState = {
  selectedEntityIds: [],
  visibleEntityIds: [],
  hiddenEntityIds: [],
  isolatedEntityIds: [],
  transparency: {},
  highlightedEntityIds: [],
  explode: 0,
  overlays: [],
  annotations: [],
  provisionalAnswers: {},
  simulatedErrors: [],
  visualFilters: [],
  playbackSpeed: 1,
  temporalState: {},
}

export type PresentationLayer = 'technical-project' | 'viewport-preferences' | 'learning-overlay' | 'temporary-user-interaction'

export const PRESENTATION_PRECEDENCE: PresentationLayer[] = [
  'technical-project',
  'viewport-preferences',
  'learning-overlay',
  'temporary-user-interaction',
]

export function cloneLearningOverlay(overlay: LearningOverlayState): LearningOverlayState {
  return structuredClone(overlay)
}

export function normalizeLearningOverlay(overlay: LearningOverlayState): LearningOverlayState {
  const unique = (values: string[]) => [...new Set(values)].sort()
  return {
    ...cloneLearningOverlay(overlay),
    selectedEntityIds: unique(overlay.selectedEntityIds),
    visibleEntityIds: unique(overlay.visibleEntityIds),
    hiddenEntityIds: unique(overlay.hiddenEntityIds),
    isolatedEntityIds: unique(overlay.isolatedEntityIds),
    highlightedEntityIds: unique(overlay.highlightedEntityIds),
    explode: Math.min(1, Math.max(0, overlay.explode)),
    playbackSpeed: Math.min(20, Math.max(0.05, overlay.playbackSpeed)),
    overlays: [...overlay.overlays]
      .map((visual) => ({
        ...structuredClone(visual),
        entityIds: unique(visual.entityIds),
        entityGroups: visual.entityGroups?.map(unique),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  }
}
import type { FidelityProfile } from '../fidelity'
