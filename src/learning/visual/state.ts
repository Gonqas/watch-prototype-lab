import type { RuntimeCapability } from '../runtime/capabilities'
import type { LearningOverlayState } from '../runtime/overlay'
import { applyReducedMotionToOverlay } from './overlays'
import {
  type EducationalSceneGraph,
  type EducationalVisualState,
  type MountPresentationState,
  type VisualDiagnostic,
  type VisualEntityId,
  type VisualOperation,
  type VisualOperationResult,
  parseVisualEntityId,
} from './model'

function emptyMountState(): MountPresentationState {
  return {
    selectedEntityIds: [],
    hiddenEntityIds: [],
    isolatedEntityIds: [],
    highlightedEntityIds: [],
    dimmedEntityIds: [],
    transparency: {},
    explode: {},
  }
}

function unique(values: VisualEntityId[]): VisualEntityId[] {
  return [...new Set(values)].sort() as VisualEntityId[]
}

function add(values: VisualEntityId[], additions: VisualEntityId[]): VisualEntityId[] {
  return unique([...values, ...additions])
}

function remove(values: VisualEntityId[], removals: VisualEntityId[]): VisualEntityId[] {
  const blocked = new Set(removals)
  return values.filter((value) => !blocked.has(value))
}

function overlayEntityIds(overlay: EducationalVisualState['overlays'][number]): VisualEntityId[] {
  if (overlay.kind === 'label') return overlay.entityId ? [overlay.entityId] : []
  if (overlay.kind === 'energy-path') return overlay.nodes.map(({ entityId }) => entityId)
  return overlay.entityIds
}

export function educationalVisualCapabilities(): RuntimeCapability[] {
  return [
    ['viewport.selection', 'Selección por identidad visual namespaced.'],
    ['viewport.visibility', 'Visibilidad por instancia visual.'],
    ['viewport.isolation', 'Aislamiento independiente por montura.'],
    ['viewport.transparency', 'Opacidad por instancia visual.'],
    ['viewport.highlight', 'Resaltado y atenuación por instancia.'],
    ['viewport.explode', 'Explosionado declarativo por instancia.'],
    ['viewport.overlay.labels', 'Etiquetas espaciales con alternativa textual.'],
    ['viewport.overlay.arrows', 'Flechas espaciales con extremos declarados.'],
    ['viewport.rotation-directions', 'Arcos de giro con eje y sentido declarados.'],
    ['viewport.energy-route', 'Rutas energéticas declarativas y numerables.'],
    ['viewport.camera', 'Cámaras por intención y bookmarks.'],
    ['viewport.multi-fixture', 'Composición namespaced de una, dos o cuatro monturas.'],
    ['reduced-motion', 'Estados discretos sin pérdida informativa.'],
    ['viewport.restore', 'Snapshot y restauración conjunta.'],
    ['viewport.undo', 'Deshacer operaciones visuales.'],
  ].map(([id, explanation]) => ({
    id,
    version: '1.0.0',
    status: 'available' as const,
    explanation,
    limitations: ['Motor lógico puro; el adaptador Three.js debe declarar su propia disponibilidad de render.'],
  }))
}

export class EducationalVisualStateStore {
  private stateValue: EducationalVisualState
  private readonly entityIdsByMount = new Map<string, Set<VisualEntityId>>()

  constructor(compositionId: string, layout: EducationalVisualState['layout'], mountIds: string[], reducedMotion = false) {
    this.stateValue = {
      schemaVersion: 1,
      compositionId,
      layout,
      reducedMotion,
      mounts: Object.fromEntries(mountIds.map((mountId) => [mountId, emptyMountState()])),
      overlays: [],
      cameras: {},
    }
  }

  state(): EducationalVisualState {
    return structuredClone(this.stateValue)
  }

  registerGraph(graph: EducationalSceneGraph): void {
    this.entityIdsByMount.set(graph.mountId, new Set(graph.entityIds))
    if (!this.stateValue.mounts[graph.mountId]) this.stateValue.mounts[graph.mountId] = emptyMountState()
  }

  unregisterMount(mountId: string): void {
    const removed = this.entityIdsByMount.get(mountId) ?? new Set<VisualEntityId>()
    this.entityIdsByMount.delete(mountId)
    this.stateValue.mounts[mountId] = emptyMountState()
    this.stateValue.overlays = this.stateValue.overlays
      .filter((overlay) => !overlayEntityIds(overlay).some((id) => removed.has(id)))
  }

  loadedEntityIds(): VisualEntityId[] {
    return [...this.entityIdsByMount.values()].flatMap((values) => [...values]).sort() as VisualEntityId[]
  }

  hasEntity(entityId: VisualEntityId): boolean {
    const parsed = parseVisualEntityId(entityId)
    return parsed ? this.entityIdsByMount.get(parsed.mountId)?.has(entityId) ?? false : false
  }

  hasMount(mountId: string): boolean {
    return mountId in this.stateValue.mounts
  }

  mountCount(): number {
    return Object.keys(this.stateValue.mounts).length
  }

  mountHasEntity(mountId: string, entityId: VisualEntityId): boolean {
    return this.entityIdsByMount.get(mountId)?.has(entityId) ?? false
  }

  replace(next: EducationalVisualState): void {
    if (next.compositionId !== this.stateValue.compositionId) {
      throw new Error(`Snapshot de otra composición: ${next.compositionId}`)
    }
    this.stateValue = structuredClone(next)
  }

  mutate(work: (draft: EducationalVisualState) => void): EducationalVisualState {
    const draft = this.state()
    work(draft)
    this.stateValue = draft
    return this.state()
  }

  clearPresentation(): EducationalVisualState {
    return this.mutate((draft) => {
      Object.keys(draft.mounts).forEach((mountId) => { draft.mounts[mountId] = emptyMountState() })
      draft.overlays = []
      draft.cameras = {}
    })
  }

  effectiveVisibility(entityId: VisualEntityId): boolean {
    const parsed = parseVisualEntityId(entityId)
    if (!parsed || !this.hasEntity(entityId)) return false
    const mount = this.stateValue.mounts[parsed.mountId]
    if (!mount || mount.hiddenEntityIds.includes(entityId)) return false
    return mount.isolatedEntityIds.length === 0 || mount.isolatedEntityIds.includes(entityId)
  }

  applyRuntimeOverlay(overlay: LearningOverlayState): EducationalVisualState {
    const valid = (values: string[]) => values.filter((id): id is VisualEntityId => this.hasEntity(id as VisualEntityId))
    return this.mutate((draft) => {
      Object.keys(draft.mounts).forEach((mountId) => {
        const selected = valid(overlay.selectedEntityIds).filter((id) => parseVisualEntityId(id)?.mountId === mountId)
        const hidden = valid(overlay.hiddenEntityIds).filter((id) => parseVisualEntityId(id)?.mountId === mountId)
        const isolated = valid(overlay.isolatedEntityIds).filter((id) => parseVisualEntityId(id)?.mountId === mountId)
        const highlighted = valid(overlay.highlightedEntityIds).filter((id) => parseVisualEntityId(id)?.mountId === mountId)
        const transparency = Object.fromEntries(Object.entries(overlay.transparency)
          .filter(([id]) => this.mountHasEntity(mountId, id as VisualEntityId)))
        const mount = draft.mounts[mountId] ?? emptyMountState()
        mount.selectedEntityIds = unique(selected)
        mount.hiddenEntityIds = unique(hidden)
        mount.isolatedEntityIds = unique(isolated)
        mount.highlightedEntityIds = unique(highlighted)
        mount.transparency = transparency
        this.entityIdsByMount.get(mountId)?.forEach((id) => { mount.explode[id] = overlay.explode })
        draft.mounts[mountId] = mount
      })
    })
  }
}

function operationCapability(operation: VisualOperation): string {
  if (operation.type === 'select') return 'viewport.selection'
  if (operation.type === 'show' || operation.type === 'hide') return 'viewport.visibility'
  if (operation.type === 'isolate' || operation.type === 'clear-isolation') return 'viewport.isolation'
  if (operation.type === 'transparency') return 'viewport.transparency'
  if (operation.type === 'highlight' || operation.type === 'dim') return 'viewport.highlight'
  if (operation.type === 'explode') return 'viewport.explode'
  if (operation.type === 'camera') return 'viewport.camera'
  if (operation.type === 'layout') return 'viewport.multi-fixture'
  if (operation.type === 'set-reduced-motion') return 'reduced-motion'
  if (operation.type === 'reset-presentation') return 'viewport.restore'
  if (operation.type === 'overlay-remove') return 'viewport.overlay.labels'
  if (operation.overlay.kind === 'arrow') return 'viewport.overlay.arrows'
  if (operation.overlay.kind === 'rotation-arc') return 'viewport.rotation-directions'
  if (operation.overlay.kind === 'energy-path') return 'viewport.energy-route'
  return 'viewport.overlay.labels'
}

function operationEntityIds(operation: VisualOperation): VisualEntityId[] {
  if ('entityIds' in operation) return operation.entityIds
  if (operation.type === 'overlay-upsert') {
    const overlay = operation.overlay
    if (overlay.kind === 'label') return overlay.entityId ? [overlay.entityId] : []
    if (overlay.kind === 'energy-path') return overlay.nodes.map(({ entityId }) => entityId)
    return overlay.entityIds
  }
  return []
}

function diagnostic(
  code: string,
  message: string,
  capabilityId?: string,
  entityIds?: VisualEntityId[],
): VisualDiagnostic {
  return {
    code,
    severity: 'error',
    message,
    accessibleMessage: message,
    capabilityId,
    entityIds,
  }
}

export class VisualOperationExecutor {
  private readonly store: EducationalVisualStateStore
  private readonly capabilitiesValue: RuntimeCapability[]
  private readonly history: EducationalVisualState[] = []

  constructor(
    store: EducationalVisualStateStore,
    capabilities: RuntimeCapability[] = educationalVisualCapabilities(),
  ) {
    this.store = store
    this.capabilitiesValue = structuredClone(capabilities)
  }

  capabilities(): RuntimeCapability[] {
    return structuredClone(this.capabilitiesValue)
  }

  preflight(operation: VisualOperation): VisualDiagnostic[] {
    const capabilityId = operationCapability(operation)
    const capability = this.capabilitiesValue.find(({ id }) => id === capabilityId)
    const entityIds = operationEntityIds(operation)
    const diagnostics: VisualDiagnostic[] = []
    if (!capability || capability.status !== 'available') {
      diagnostics.push(diagnostic(
        'EV-CAPABILITY-UNAVAILABLE',
        capability
          ? `${capabilityId} está ${capability.status}: ${capability.explanation}`
          : `No existe la capacidad ${capabilityId}.`,
        capabilityId,
        entityIds,
      ))
    }
    const missing = unique(entityIds).filter((id) => !this.store.hasEntity(id))
    if (missing.length > 0) {
      diagnostics.push(diagnostic(
        'EV-ENTITY-NOT-MOUNTED',
        `La operación referencia ${missing.length} entidades ausentes o descargadas.`,
        capabilityId,
        missing,
      ))
    }
    if (operation.type === 'isolate') {
      const wrongMount = operation.entityIds.filter((id) => !this.store.mountHasEntity(operation.mountId, id))
      if (wrongMount.length > 0) diagnostics.push(diagnostic(
        'EV-ISOLATION-NAMESPACE-MISMATCH',
        'El aislamiento contiene entidades de otra montura.',
        capabilityId,
        wrongMount,
      ))
    }
    if (
      (operation.type === 'isolate' || operation.type === 'clear-isolation')
      && !this.store.hasMount(operation.mountId)
    ) {
      diagnostics.push(diagnostic(
        'EV-MOUNT-NOT-FOUND',
        `No existe la montura ${operation.mountId}.`,
        capabilityId,
        entityIds,
      ))
    }
    if (operation.type === 'layout') {
      const count = this.store.mountCount()
      const valid = count === 1
        ? operation.layout === 'single'
        : count === 2
          ? ['split-horizontal', 'split-vertical', 'overlay'].includes(operation.layout)
          : ['quad', 'overlay'].includes(operation.layout)
      if (!valid) diagnostics.push(diagnostic(
        'EV-LAYOUT-MOUNT-COUNT',
        `El layout ${operation.layout} no es válido para ${count} monturas.`,
        capabilityId,
      ))
    }
    if (operation.type === 'transparency' && (!Number.isFinite(operation.opacity) || operation.opacity < 0 || operation.opacity > 1)) {
      diagnostics.push(diagnostic('EV-OPACITY-INVALID', 'La opacidad debe estar entre 0 y 1.', capabilityId, entityIds))
    }
    if (operation.type === 'explode' && (!Number.isFinite(operation.amount) || operation.amount < 0 || operation.amount > 1)) {
      diagnostics.push(diagnostic('EV-EXPLODE-INVALID', 'El explosionado debe estar entre 0 y 1.', capabilityId, entityIds))
    }
    return diagnostics
  }

  execute(operation: VisualOperation): VisualOperationResult {
    const diagnostics = this.preflight(operation)
    if (diagnostics.some(({ severity }) => severity === 'error')) {
      return { accepted: false, diagnostics, state: this.store.state(), undoAvailable: this.history.length > 0 }
    }
    this.history.push(this.store.state())
    const state = this.store.mutate((draft) => {
      if (operation.type === 'select') {
        if (!operation.additive) Object.values(draft.mounts).forEach((mount) => { mount.selectedEntityIds = [] })
        operation.entityIds.forEach((id) => {
          const mountId = parseVisualEntityId(id)?.mountId
          if (mountId) draft.mounts[mountId].selectedEntityIds = add(draft.mounts[mountId].selectedEntityIds, [id])
        })
      } else if (operation.type === 'show' || operation.type === 'hide') {
        operation.entityIds.forEach((id) => {
          const mountId = parseVisualEntityId(id)?.mountId
          if (!mountId) return
          const mount = draft.mounts[mountId]
          mount.hiddenEntityIds = operation.type === 'hide'
            ? add(mount.hiddenEntityIds, [id])
            : remove(mount.hiddenEntityIds, [id])
        })
      } else if (operation.type === 'isolate') {
        draft.mounts[operation.mountId].isolatedEntityIds = unique(operation.entityIds)
      } else if (operation.type === 'clear-isolation') {
        draft.mounts[operation.mountId].isolatedEntityIds = []
      } else if (operation.type === 'transparency') {
        operation.entityIds.forEach((id) => {
          const mountId = parseVisualEntityId(id)?.mountId
          if (mountId) draft.mounts[mountId].transparency[id] = operation.opacity
        })
      } else if (operation.type === 'highlight' || operation.type === 'dim') {
        operation.entityIds.forEach((id) => {
          const mountId = parseVisualEntityId(id)?.mountId
          if (!mountId) return
          const mount = draft.mounts[mountId]
          const field = operation.type === 'highlight' ? 'highlightedEntityIds' : 'dimmedEntityIds'
          mount[field] = operation.active ? add(mount[field], [id]) : remove(mount[field], [id])
        })
      } else if (operation.type === 'explode') {
        operation.entityIds.forEach((id) => {
          const mountId = parseVisualEntityId(id)?.mountId
          if (mountId) draft.mounts[mountId].explode[id] = operation.amount
        })
      } else if (operation.type === 'overlay-upsert') {
        const overlay = applyReducedMotionToOverlay(operation.overlay, draft.reducedMotion)
        draft.overlays = [...draft.overlays.filter(({ id }) => id !== overlay.id), overlay]
          .sort((left, right) => left.id.localeCompare(right.id))
      } else if (operation.type === 'overlay-remove') {
        draft.overlays = draft.overlays.filter(({ id }) => id !== operation.overlayId)
      } else if (operation.type === 'camera') {
        const snapshot = structuredClone(operation.snapshot)
        if (draft.reducedMotion && snapshot.transition) {
          snapshot.pose = structuredClone(snapshot.transition.to)
          snapshot.transition.durationMs = 0
          snapshot.transition.kind = 'instant'
          snapshot.transition.state = 'completed'
        }
        draft.cameras[operation.viewportId] = snapshot
      } else if (operation.type === 'layout') {
        draft.layout = operation.layout
      } else if (operation.type === 'set-reduced-motion') {
        draft.reducedMotion = operation.active
        draft.overlays = draft.overlays.map((overlay) => applyReducedMotionToOverlay(overlay, operation.active))
        if (operation.active) Object.values(draft.cameras).forEach((camera) => {
          if (!camera.transition) return
          camera.pose = structuredClone(camera.transition.to)
          camera.transition = { ...camera.transition, durationMs: 0, kind: 'instant', state: 'completed' }
        })
      } else if (operation.type === 'reset-presentation') {
        Object.keys(draft.mounts).forEach((mountId) => { draft.mounts[mountId] = emptyMountState() })
        draft.overlays = []
        draft.cameras = {}
      }
    })
    return { accepted: true, diagnostics, state, undoAvailable: true }
  }

  undo(): VisualOperationResult {
    const previous = this.history.pop()
    if (!previous) {
      const issue = diagnostic('EV-UNDO-EMPTY', 'No existe una operación visual que deshacer.', 'viewport.undo')
      return { accepted: false, diagnostics: [issue], state: this.store.state(), undoAvailable: false }
    }
    this.store.replace(previous)
    return { accepted: true, diagnostics: [], state: this.store.state(), undoAvailable: this.history.length > 0 }
  }

  restore(state: EducationalVisualState): VisualOperationResult {
    this.history.push(this.store.state())
    this.store.replace(state)
    return { accepted: true, diagnostics: [], state: this.store.state(), undoAvailable: true }
  }
}
