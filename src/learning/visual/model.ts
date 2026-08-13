import type { FidelityProfile } from '../fidelity'
import type { SemanticSelector, SelectorCardinality } from '../runtime/selectors'
import type {
  TechnicalDataLayer,
  TechnicalGeometryPrimitive,
  TechnicalMovementFixture,
} from '../technical/reconstruction'
import type { FixtureMechanismBinding } from './fixtureMechanismMotion'

export type Vec3 = [number, number, number]

export interface VisualTransform {
  position: Vec3
  rotation: Vec3
  scale: number
}

export const IDENTITY_VISUAL_TRANSFORM: VisualTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
}

export type EducationalViewportLayout =
  | 'single'
  | 'split-horizontal'
  | 'split-vertical'
  | 'quad'
  | 'overlay'

export interface EducationalFixtureMountSpec {
  id: string
  fixtureId: string
  fixtureVersion: string
  transform: VisualTransform
  enabled: boolean
  label: string
}

export interface EducationalViewportCompositionSpec {
  id: string
  version: string
  layout: EducationalViewportLayout
  mounts: EducationalFixtureMountSpec[]
}

export type VisualEntityId = string & { readonly __brand: 'VisualEntityId' }

export function visualEntityId(
  mountId: string,
  fixtureId: string,
  instanceId: string,
): VisualEntityId {
  return `visual:${mountId}::${fixtureId}::${instanceId}` as VisualEntityId
}

export function parseVisualEntityId(id: string): {
  mountId: string
  fixtureId: string
  instanceId: string
} | undefined {
  if (!id.startsWith('visual:')) return undefined
  const [mountId, fixtureId, instanceId, ...rest] = id.slice('visual:'.length).split('::')
  if (!mountId || !fixtureId || !instanceId || rest.length > 0) return undefined
  return { mountId, fixtureId, instanceId }
}

export type VisualProvenanceClass =
  | 'official'
  | 'measured'
  | 'reconstructed'
  | 'estimated'
  | 'conceptual'
  | 'unknown'

export interface VisualBounds {
  min: Vec3
  max: Vec3
  center: Vec3
  radius: number
}

export interface EducationalVisualPrimitive {
  id: string
  entityId: VisualEntityId
  sourcePrimitiveId: string
  shape: TechnicalGeometryPrimitive['shape']
  visualProfile?: TechnicalGeometryPrimitive['visualProfile']
  toothCount?: number
  boreRatio?: number
  cutaway?: boolean
  position: Vec3
  size: Vec3
  coordinateSpace: TechnicalGeometryPrimitive['coordinateSpace']
  dataLayer: TechnicalDataLayer
  provenanceClass: VisualProvenanceClass
  sourceIds: string[]
  limitations: string[]
  colorHint: string
  opacityHint: number
}

export interface EducationalVisualEntity {
  id: VisualEntityId
  objectKey: string
  mountId: string
  fixtureId: string
  fixtureVersion: string
  instanceId: string
  definitionId: string
  name: string
  category: string
  role?: string
  subsystem?: string
  instanceState: 'active' | 'inactive' | 'replaced' | 'deleted'
  renderable: boolean
  placeholder: boolean
  primitives: EducationalVisualPrimitive[]
  bounds?: VisualBounds
  sourceIds: string[]
  provenanceClass: VisualProvenanceClass
  fidelity?: FidelityProfile
  limitations: string[]
}

export interface EducationalSceneGraph {
  compositionId: string
  mountId: string
  fixtureId: string
  fixtureVersion: string
  assemblyId: string
  transform: VisualTransform
  entities: EducationalVisualEntity[]
  entityIds: VisualEntityId[]
  diagnostics: VisualDiagnostic[]
  bounds?: VisualBounds
  mechanism?: FixtureMechanismBinding
}

export interface LoadedEducationalFixtureMount {
  spec: EducationalFixtureMountSpec
  fixture: TechnicalMovementFixture
  sceneGraph: EducationalSceneGraph
  loadedAt: string
  loadDurationMs: number
}

export type VisualOverlayState =
  | 'hidden'
  | 'available'
  | 'active'
  | 'dimmed'
  | 'blocked'
  | 'incomplete'
  | 'unknown'

export interface VisualOverlayStyle {
  color: string
  pattern: 'solid' | 'dashed' | 'dotted' | 'hatched' | 'crosshatched'
  thickness: number
  icon: string
  stateLabel: string
}

export interface SpatialArrowOverlay {
  kind: 'arrow'
  id: string
  state: VisualOverlayState
  start: Vec3
  end: Vec3
  entityIds: VisualEntityId[]
  label?: string
  direction: 'forward' | 'reverse' | 'bidirectional' | 'unknown'
  linePoints: Vec3[]
  arrowHead: Vec3[]
  adaptiveScale: boolean
  occlusion: 'none' | 'fade-when-occluded'
  style: VisualOverlayStyle
  accessibleAlternative: string
  fidelity: FidelityProfile
  dataLayer: TechnicalDataLayer
}

export interface RotationArcOverlay {
  kind: 'rotation-arc'
  id: string
  state: VisualOverlayState
  center: Vec3
  axis: Vec3
  radius: number
  direction: 'clockwise' | 'counterclockwise' | 'unknown'
  conceptualSpeed: 'stopped' | 'slow' | 'medium' | 'fast' | 'unknown'
  points: Vec3[]
  entityIds: VisualEntityId[]
  animated: boolean
  style: VisualOverlayStyle
  accessibleAlternative: string
  fidelity: FidelityProfile
  dataLayer: TechnicalDataLayer
}

export interface EnergyPathNode {
  id: string
  entityId: VisualEntityId
  label: string
  point: Vec3
  state: 'active' | 'blocked' | 'unknown' | 'available'
}

export interface EnergyPathSegment {
  id: string
  fromNodeId: string
  toNodeId: string
  state: 'active' | 'blocked' | 'unknown' | 'available'
  direction: 'forward' | 'unknown'
  points: Vec3[]
}

export interface EnergyPathOverlay {
  kind: 'energy-path'
  id: string
  state: VisualOverlayState
  nodes: EnergyPathNode[]
  segments: EnergyPathSegment[]
  activeIndex: number
  numbered: boolean
  animated: boolean
  style: VisualOverlayStyle
  accessibleAlternative: string
  fidelity: FidelityProfile
  dataLayer: TechnicalDataLayer
}

export interface SpatialLabelOverlay {
  kind: 'label'
  id: string
  state: VisualOverlayState
  point: Vec3
  entityId?: VisualEntityId
  text: string
  namespaceLabel: string
  style: VisualOverlayStyle
  accessibleAlternative: string
  fidelity: FidelityProfile
  dataLayer: TechnicalDataLayer
}

export type EducationalSpatialOverlay =
  | SpatialArrowOverlay
  | RotationArcOverlay
  | EnergyPathOverlay
  | SpatialLabelOverlay

export interface CameraPose {
  position: Vec3
  target: Vec3
  up: Vec3
  projection: 'perspective' | 'orthographic'
  fieldOfView: number
  orthographicScale: number
}

export type EducationalCameraIntentKind =
  | 'overview'
  | 'dial'
  | 'bridges'
  | 'side'
  | 'axial'
  | 'close-up'
  | 'comparison'
  | 'split'
  | 'frame-entities'

export interface EducationalCameraIntent {
  kind: EducationalCameraIntentKind
  entityIds?: VisualEntityId[]
  mountIds?: string[]
  padding?: number
  projection?: 'perspective' | 'orthographic'
}

export interface EducationalCameraBookmark {
  id: string
  label: string
  intent: EducationalCameraIntent
  pose: CameraPose
}

export interface CameraTransition {
  kind: 'instant' | 'smooth'
  durationMs: number
  state: 'idle' | 'running' | 'paused' | 'completed' | 'skipped'
  from: CameraPose
  to: CameraPose
}

export interface EducationalCameraSnapshot {
  pose: CameraPose
  bookmarks: EducationalCameraBookmark[]
  transition?: CameraTransition
}

export interface MountPresentationState {
  selectedEntityIds: VisualEntityId[]
  hiddenEntityIds: VisualEntityId[]
  isolatedEntityIds: VisualEntityId[]
  highlightedEntityIds: VisualEntityId[]
  dimmedEntityIds: VisualEntityId[]
  transparency: Record<string, number>
  explode: Record<string, number>
}

export interface EducationalVisualState {
  schemaVersion: 1
  compositionId: string
  layout: EducationalViewportLayout
  reducedMotion: boolean
  mounts: Record<string, MountPresentationState>
  overlays: EducationalSpatialOverlay[]
  cameras: Record<string, EducationalCameraSnapshot>
}

export interface EducationalVisualSnapshot {
  snapshotVersion: 1
  compositionId: string
  loadedMountIds: string[]
  state: EducationalVisualState
  fixtureFingerprints: Record<string, string>
  capturedAt: string
}

export interface CompositionSelector {
  mountId?: string
  fixtureId?: string
  selector: SemanticSelector
  cardinality: SelectorCardinality
}

export interface CompositionSelectorResolution {
  selector: CompositionSelector
  entityIds: VisualEntityId[]
  semanticEntityCount: number
  cardinalitySatisfied: boolean
  diagnostics: VisualDiagnostic[]
}

export interface VisualDiagnostic {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  accessibleMessage: string
  capabilityId?: string
  entityIds?: VisualEntityId[]
}

export type VisualOperation =
  | { type: 'select'; entityIds: VisualEntityId[]; additive?: boolean }
  | { type: 'show'; entityIds: VisualEntityId[] }
  | { type: 'hide'; entityIds: VisualEntityId[] }
  | { type: 'isolate'; mountId: string; entityIds: VisualEntityId[] }
  | { type: 'clear-isolation'; mountId: string }
  | { type: 'transparency'; entityIds: VisualEntityId[]; opacity: number }
  | { type: 'highlight'; entityIds: VisualEntityId[]; active: boolean }
  | { type: 'dim'; entityIds: VisualEntityId[]; active: boolean }
  | { type: 'explode'; entityIds: VisualEntityId[]; amount: number }
  | { type: 'overlay-upsert'; overlay: EducationalSpatialOverlay }
  | { type: 'overlay-remove'; overlayId: string }
  | { type: 'camera'; viewportId: string; snapshot: EducationalCameraSnapshot }
  | { type: 'layout'; layout: EducationalViewportLayout }
  | { type: 'set-reduced-motion'; active: boolean }
  | { type: 'reset-presentation' }

export interface VisualOperationResult {
  accepted: boolean
  diagnostics: VisualDiagnostic[]
  state: EducationalVisualState
  undoAvailable: boolean
}

export interface VisualMaterialDescriptor {
  subsystem: string
  provenance: VisualProvenanceClass
  color: string
  pattern: VisualOverlayStyle['pattern']
  brightness: number
  roughness: number
  metalness: number
  outline: 'none' | 'thin' | 'thick' | 'double' | 'dashed'
  icon: string
  accessibleLabel: string
}

export interface VisualPerformanceBudget {
  maxMountedFixtures: number
  maxLogicalEntities: number
  maxRenderablePrimitives: number
  maxEstimatedDrawCalls: number
  maxMaterialVariants: number
  maxActiveOverlays: number
  maxVisibleLabels: number
  maxEstimatedGeometryBytes: number
  maxMountLoadMs: number
}

export interface VisualPerformanceMetrics {
  mountedFixtures: number
  logicalEntities: number
  renderablePrimitives: number
  geometryReuseGroups: number
  safeInstanceGroups: number
  estimatedDrawCalls: number
  materialVariants: number
  activeOverlays: number
  visibleLabels: number
  estimatedGeometryBytes: number
  mountLoadMs: Record<string, number>
}

export interface VisualPerformanceReport {
  metrics: VisualPerformanceMetrics
  budget: VisualPerformanceBudget
  diagnostics: VisualDiagnostic[]
  withinBudget: boolean
  measuredAt: string
  measurementKind: 'logical-estimate'
}

export interface FixtureLoadRecord {
  fixtureId: string
  fixtureVersion: string
  durationMs: number
  loadedAt: string
  fromCache: boolean
}

export interface RegisteredFixtureLoader {
  fixtureId: string
  fixtureVersion: string
  load: () => Promise<TechnicalMovementFixture>
}
