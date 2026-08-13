import { useSyncExternalStore } from 'react'
import type { ProjectEntityIndex } from '../canonical'
import type { WatchPartId } from '../../vnext/model'
import type { RuntimeCapability } from '../runtime/capabilities'
import type { ViewportEntitySupport, ViewportLearningBridge, ViewportPresentationSnapshot } from '../runtime/bridge'
import { cloneLearningOverlay, EMPTY_LEARNING_OVERLAY, normalizeLearningOverlay, type LearningOverlayState } from '../runtime/overlay'

export interface StudioLearningViewportOverlay {
  active: boolean
  selectedParts: WatchPartId[]
  visibleParts: WatchPartId[]
  hiddenParts: WatchPartId[]
  isolatedParts: WatchPartId[]
  highlightedParts: WatchPartId[]
  transparency: Partial<Record<WatchPartId, number>>
  explode: number
  section?: LearningOverlayState['section']
  camera?: LearningOverlayState['camera']
  overlays: LearningOverlayState['overlays']
}

const EMPTY_STUDIO_OVERLAY: StudioLearningViewportOverlay = {
  active: false,
  selectedParts: [], visibleParts: [], hiddenParts: [], isolatedParts: [], highlightedParts: [],
  transparency: {}, explode: 0, overlays: [],
}

let studioOverlay = structuredClone(EMPTY_STUDIO_OVERLAY)
const listeners = new Set<() => void>()

function publish(next: StudioLearningViewportOverlay): void {
  studioOverlay = structuredClone(next)
  listeners.forEach((listener) => listener())
}

export function useStudioLearningViewportOverlay(): StudioLearningViewportOverlay {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    () => studioOverlay,
    () => EMPTY_STUDIO_OVERLAY,
  )
}

const PARTS = new Set<WatchPartId>([
  'case', 'back', 'bezel', 'rehaut', 'strap', 'clasp', 'springBar', 'dialGraphics', 'movement', 'plate', 'bridge',
  'barrel', 'center', 'third', 'fourth', 'escape', 'balance', 'pallet', 'hairspring', 'mainspring', 'jewel', 'keyless',
  'rotor', 'dial', 'hourHand', 'minuteHand', 'secondHand', 'crystal', 'stem', 'crown', 'holder', 'gasket',
])

const TOKEN_TO_PART: Record<string, WatchPartId> = {
  'spring-bar': 'springBar', 'dial-graphics': 'dialGraphics', 'center-wheel': 'center', 'third-wheel': 'third',
  'fourth-wheel': 'fourth', 'escape-wheel': 'escape', 'jewel-set': 'jewel', 'hour-hand': 'hourHand',
  'minute-hand': 'minuteHand', 'second-hand': 'secondHand',
}

function partFromToken(token: string | undefined): WatchPartId | undefined {
  if (!token) return undefined
  if (PARTS.has(token as WatchPartId)) return token as WatchPartId
  return TOKEN_TO_PART[token]
}

export function createStudioEntityPartMap(index: ProjectEntityIndex): ReadonlyMap<string, WatchPartId> {
  const mapping = new Map<string, WatchPartId>()
  for (const instance of index.assembly.instances) {
    const definition = index.assembly.definitions.find(({ id }) => id === instance.definitionId)
    const part = partFromToken(instance.role) ?? partFromToken(definition?.category) ?? definition?.roles.map(partFromToken).find(Boolean)
    if (part) mapping.set(instance.id, part)
  }
  return mapping
}

export class StudioViewportLearningBridge implements ViewportLearningBridge {
  readonly bridgeId = 'studio-viewport-learning-bridge-v1'
  private overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
  private disposed = false
  private readonly partByEntityId: ReadonlyMap<string, WatchPartId>

  constructor(partByEntityId: ReadonlyMap<string, WatchPartId>) { this.partByEntityId = partByEntityId }

  capabilities(): RuntimeCapability[] {
    const completeMapping = this.partByEntityId.size > 0
    const mappedStatus = completeMapping ? 'available' as const : 'limited' as const
    return [
      { id: 'viewport.selection', version: '1.0.0', status: mappedStatus, explanation: 'Selección por piezas renderizadas de v5.', limitations: completeMapping ? [] : ['El ensamblaje no expone piezas renderizables.'] },
      { id: 'viewport.visibility', version: '1.0.0', status: mappedStatus, explanation: 'Visibilidad por tipo visual actual.', limitations: ['Instancias repetidas de una misma pieza visual no se distinguen todavía.'] },
      { id: 'viewport.isolation', version: '1.0.0', status: mappedStatus, explanation: 'Aislamiento mediante overlay.', limitations: ['Granularidad visual v5.'] },
      { id: 'viewport.explode', version: '1.0.0', status: 'available', explanation: 'Explosionado continuo del viewport.', limitations: [] },
      { id: 'viewport.section', version: '1.0.0', status: 'available', explanation: 'Plano de sección configurable.', limitations: ['Un plano simultáneo.'] },
      { id: 'viewport.camera', version: '1.0.0', status: 'available', explanation: 'Cámara y objetivo mediante overlay.', limitations: ['Solo proyección perspectiva en el viewport actual.'] },
      { id: 'viewport.camera.orthographic', version: '1.0.0', status: 'unavailable', explanation: 'El viewport actual crea PerspectiveCamera.', limitations: ['Requiere una cámara ortográfica explícita.'] },
      { id: 'viewport.highlight', version: '1.0.0', status: mappedStatus, explanation: 'Resaltado no destructivo.', limitations: [] },
      { id: 'viewport.transparency', version: '1.0.0', status: 'limited', explanation: 'Transparencia disponible en primitivas principales.', limitations: ['No todos los submeshes mecánicos admiten opacidad independiente.'] },
      { id: 'viewport.overlay.labels', version: '1.0.0', status: 'available', explanation: 'Etiquetas accesibles en overlay 2D.', limitations: ['Sin anclaje espacial por instancia.'] },
      { id: 'viewport.overlay.arrows', version: '1.0.0', status: 'unavailable', explanation: 'No existe anclaje geométrico canónico para flechas.', limitations: ['Requiere posiciones de entidades.'] },
      { id: 'viewport.entity-transform', version: '1.0.0', status: 'unavailable', explanation: 'El viewport no expone transformaciones temporales por entidad canónica.', limitations: ['Requiere una capa de transformaciones visuales por instancia.'] },
    ]
  }

  entitySupport(entityIds: readonly string[]): ViewportEntitySupport {
    const unique = [...new Set(entityIds)].sort()
    return {
      supportedEntityIds: unique.filter((id) => this.partByEntityId.has(id)),
      unsupportedEntityIds: unique.filter((id) => !this.partByEntityId.has(id)),
    }
  }

  async capturePresentation(): Promise<ViewportPresentationSnapshot> {
    this.assertReady()
    return { snapshotVersion: 1, overlay: cloneLearningOverlay(this.overlay), capturedAt: new Date().toISOString() }
  }

  async applyOverlay(overlay: LearningOverlayState): Promise<void> {
    this.assertReady()
    this.overlay = normalizeLearningOverlay(overlay)
    const parts = (ids: string[]) => [...new Set(ids.map((id) => this.partByEntityId.get(id)).filter((part): part is WatchPartId => part !== undefined))].sort()
    const transparency: Partial<Record<WatchPartId, number>> = {}
    Object.entries(this.overlay.transparency).forEach(([id, opacity]) => {
      const part = this.partByEntityId.get(id)
      if (part) transparency[part] = Math.min(transparency[part] ?? 1, opacity)
    })
    publish({
      active: true,
      selectedParts: parts(this.overlay.selectedEntityIds),
      visibleParts: parts(this.overlay.visibleEntityIds),
      hiddenParts: parts(this.overlay.hiddenEntityIds),
      isolatedParts: parts(this.overlay.isolatedEntityIds),
      highlightedParts: parts(this.overlay.highlightedEntityIds),
      transparency,
      explode: this.overlay.explode,
      section: this.overlay.section,
      camera: this.overlay.camera,
      overlays: structuredClone(this.overlay.overlays),
    })
  }

  currentOverlay(): LearningOverlayState { return cloneLearningOverlay(this.overlay) }

  async restorePresentation(snapshot: ViewportPresentationSnapshot): Promise<void> {
    this.assertReady()
    this.overlay = normalizeLearningOverlay(snapshot.overlay)
    if (this.overlay === EMPTY_LEARNING_OVERLAY || isEmptyOverlay(this.overlay)) publish(structuredClone(EMPTY_STUDIO_OVERLAY))
    else await this.applyOverlay(this.overlay)
  }

  async clearOverlay(): Promise<void> {
    this.assertReady()
    this.overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
    publish(structuredClone(EMPTY_STUDIO_OVERLAY))
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
    publish(structuredClone(EMPTY_STUDIO_OVERLAY))
    this.disposed = true
  }

  private assertReady(): void {
    if (this.disposed) throw new Error('El bridge de StudioViewport está disposed.')
  }
}

function isEmptyOverlay(overlay: LearningOverlayState): boolean {
  return overlay.selectedEntityIds.length === 0 && overlay.visibleEntityIds.length === 0 && overlay.hiddenEntityIds.length === 0
    && overlay.isolatedEntityIds.length === 0 && overlay.highlightedEntityIds.length === 0 && overlay.explode === 0
    && overlay.section === undefined && overlay.camera === undefined && overlay.overlays.length === 0
    && Object.keys(overlay.transparency).length === 0
}
