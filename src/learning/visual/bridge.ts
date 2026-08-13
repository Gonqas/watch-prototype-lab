import type {
  ViewportEntitySupport,
  ViewportLearningBridge,
  ViewportPresentationSnapshot,
} from '../runtime/bridge'
import {
  cloneLearningOverlay,
  EMPTY_LEARNING_OVERLAY,
  normalizeLearningOverlay,
  type LearningOverlayVisual,
  type LearningSpatialAnchor,
  type LearningOverlayState,
} from '../runtime/overlay'
import { isCanonicalId } from '../identity'
import type { EducationalVisualSnapshot, VisualEntityId } from './model'
import { EducationalViewportComposition } from './composition'
import { projectCanonicalInstanceIds } from './projection'

export interface EducationalViewportPresentationSnapshot extends ViewportPresentationSnapshot {
  visualSnapshot: EducationalVisualSnapshot
}

function hasVisualSnapshot(
  snapshot: ViewportPresentationSnapshot,
): snapshot is EducationalViewportPresentationSnapshot {
  return 'visualSnapshot' in snapshot
}

function anchorEntityIds(anchor: LearningSpatialAnchor | undefined): string[] {
  return anchor?.kind === 'entity' ? anchor.entityIds : []
}

function referencedEntityIds(overlay: LearningOverlayState): string[] {
  return [
    ...overlay.selectedEntityIds,
    ...overlay.visibleEntityIds,
    ...overlay.hiddenEntityIds,
    ...overlay.isolatedEntityIds,
    ...overlay.highlightedEntityIds,
    ...Object.keys(overlay.transparency),
    ...overlay.overlays.flatMap((visual) => [
      ...visual.entityIds,
      ...(visual.entityGroups?.flat() ?? []),
      ...anchorEntityIds(visual.start),
      ...anchorEntityIds(visual.end),
    ]),
  ]
}

function translateAnchor(
  anchor: LearningSpatialAnchor | undefined,
  translate: (id: string) => VisualEntityId,
): LearningSpatialAnchor | undefined {
  if (!anchor || anchor.kind !== 'entity') return structuredClone(anchor)
  return {
    ...structuredClone(anchor),
    entityIds: anchor.entityIds.map(translate),
  }
}

function translateVisual(
  visual: LearningOverlayVisual,
  translate: (id: string) => VisualEntityId,
): LearningOverlayVisual {
  return {
    ...structuredClone(visual),
    entityIds: visual.entityIds.map(translate),
    entityGroups: visual.entityGroups?.map((group) => group.map(translate)),
    start: translateAnchor(visual.start, translate),
    end: translateAnchor(visual.end, translate),
  }
}

export class EducationalCompositionBridge implements ViewportLearningBridge {
  readonly bridgeId: string
  private readonly composition: EducationalViewportComposition
  private overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
  private disposed = false

  constructor(composition: EducationalViewportComposition) {
    this.composition = composition
    this.bridgeId = `educational-composition:${composition.spec.id}@${composition.spec.version}`
  }

  capabilities() {
    return this.composition.operations.capabilities()
  }

  entitySupport(entityIds: readonly string[]): ViewportEntitySupport {
    const unique = [...new Set(entityIds)].sort()
    const canonicalIds = unique.filter((id) => isCanonicalId(id, 'part-instance'))
    const projection = projectCanonicalInstanceIds(this.composition.mounted(), canonicalIds)
    const isSupported = (id: string) =>
      this.composition.stateStore.hasEntity(id as VisualEntityId)
      || Boolean(projection.mapped[id])
    return {
      supportedEntityIds: unique.filter(isSupported),
      unsupportedEntityIds: unique.filter((id) => !isSupported(id)),
    }
  }

  async capturePresentation(): Promise<EducationalViewportPresentationSnapshot> {
    this.assertReady()
    const capturedAt = new Date().toISOString()
    return {
      snapshotVersion: 1,
      overlay: cloneLearningOverlay(this.overlay),
      capturedAt,
      visualSnapshot: this.composition.captureSnapshot(capturedAt),
    }
  }

  async applyOverlay(overlay: LearningOverlayState): Promise<void> {
    this.assertReady()
    const normalized = normalizeLearningOverlay(overlay)
    const referenced = referencedEntityIds(normalized)
    const unsupported = this.entitySupport(referenced).unsupportedEntityIds
    if (unsupported.length > 0) {
      throw new Error(`El overlay referencia entidades visuales no montadas: ${unsupported.join(', ')}`)
    }
    const canonicalIds = referenced.filter((id) => isCanonicalId(id, 'part-instance'))
    const projection = projectCanonicalInstanceIds(this.composition.mounted(), canonicalIds)
    const ambiguous = Object.keys(projection.ambiguousCanonicalEntityIds)
    if (ambiguous.length > 0) {
      throw new Error(
        `El overlay canónico es ambiguo porque un fixture está montado más de una vez: ${ambiguous.join(', ')}`,
      )
    }
    const translate = (id: string): VisualEntityId => {
      if (this.composition.stateStore.hasEntity(id as VisualEntityId)) return id as VisualEntityId
      const visualId = projection.mapped[id]
      if (!visualId) throw new Error(`No existe proyección visual para ${id}.`)
      return visualId
    }
    const translated: LearningOverlayState = {
      ...structuredClone(normalized),
      selectedEntityIds: normalized.selectedEntityIds.map(translate),
      visibleEntityIds: normalized.visibleEntityIds.map(translate),
      hiddenEntityIds: normalized.hiddenEntityIds.map(translate),
      isolatedEntityIds: normalized.isolatedEntityIds.map(translate),
      highlightedEntityIds: normalized.highlightedEntityIds.map(translate),
      transparency: Object.fromEntries(
        Object.entries(normalized.transparency).map(([id, opacity]) => [translate(id), opacity]),
      ),
      overlays: normalized.overlays.map((visual) => translateVisual(visual, translate)),
    }
    this.overlay = normalized
    this.composition.stateStore.applyRuntimeOverlay(translated)
  }

  currentOverlay(): LearningOverlayState {
    return cloneLearningOverlay(this.overlay)
  }

  async restorePresentation(snapshot: ViewportPresentationSnapshot): Promise<void> {
    this.assertReady()
    if (snapshot.snapshotVersion !== 1) throw new Error(`Snapshot no soportado: ${snapshot.snapshotVersion}`)
    if (hasVisualSnapshot(snapshot)) {
      await this.composition.restoreSnapshot(snapshot.visualSnapshot)
      this.overlay = normalizeLearningOverlay(snapshot.overlay)
    } else {
      await this.applyOverlay(snapshot.overlay)
    }
  }

  async clearOverlay(): Promise<void> {
    this.assertReady()
    this.overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
    this.composition.stateStore.clearPresentation()
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
    this.composition.stateStore.clearPresentation()
    this.disposed = true
  }

  private assertReady(): void {
    if (this.disposed) throw new Error('El bridge de composición está disposed.')
  }
}
