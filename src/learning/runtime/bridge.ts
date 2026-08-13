import type { RuntimeCapability } from './capabilities'
import { cloneLearningOverlay, EMPTY_LEARNING_OVERLAY, normalizeLearningOverlay, type LearningOverlayState } from './overlay'

export interface ViewportPresentationSnapshot {
  snapshotVersion: 1
  overlay: LearningOverlayState
  capturedAt: string
}

export interface ViewportEntitySupport {
  supportedEntityIds: string[]
  unsupportedEntityIds: string[]
}

export interface ViewportLearningBridge {
  readonly bridgeId: string
  capabilities(): RuntimeCapability[]
  entitySupport(entityIds: readonly string[]): ViewportEntitySupport
  capturePresentation(): Promise<ViewportPresentationSnapshot>
  applyOverlay(overlay: LearningOverlayState): Promise<void>
  currentOverlay(): LearningOverlayState
  restorePresentation(snapshot: ViewportPresentationSnapshot): Promise<void>
  clearOverlay(): Promise<void>
  dispose(): Promise<void>
}

export class MemoryViewportLearningBridge implements ViewportLearningBridge {
  readonly bridgeId: string
  private overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
  private disposed = false
  private failNextOperation: string | null = null
  private readonly log: Array<{ operation: string; overlay?: LearningOverlayState }> = []
  private readonly availableCapabilities: RuntimeCapability[]
  private readonly now: () => string

  constructor(
    bridgeId = 'memory-learning-bridge',
    availableCapabilities: RuntimeCapability[] = memoryBridgeCapabilities(),
    now: () => string = () => new Date().toISOString(),
  ) {
    this.bridgeId = bridgeId
    this.availableCapabilities = availableCapabilities
    this.now = now
  }

  capabilities(): RuntimeCapability[] {
    return structuredClone(this.availableCapabilities)
  }

  entitySupport(entityIds: readonly string[]): ViewportEntitySupport {
    return { supportedEntityIds: [...new Set(entityIds)].sort(), unsupportedEntityIds: [] }
  }

  async capturePresentation(): Promise<ViewportPresentationSnapshot> {
    this.assertReady('capture')
    this.log.push({ operation: 'capture' })
    return { snapshotVersion: 1, overlay: cloneLearningOverlay(this.overlay), capturedAt: this.now() }
  }

  async applyOverlay(overlay: LearningOverlayState): Promise<void> {
    this.assertReady('apply')
    this.overlay = normalizeLearningOverlay(overlay)
    this.log.push({ operation: 'apply', overlay: cloneLearningOverlay(this.overlay) })
  }

  currentOverlay(): LearningOverlayState {
    return cloneLearningOverlay(this.overlay)
  }

  async restorePresentation(snapshot: ViewportPresentationSnapshot): Promise<void> {
    this.assertReady('restore')
    if (snapshot.snapshotVersion !== 1) throw new Error(`Snapshot no soportado: ${snapshot.snapshotVersion}`)
    this.overlay = normalizeLearningOverlay(snapshot.overlay)
    this.log.push({ operation: 'restore', overlay: cloneLearningOverlay(this.overlay) })
  }

  async clearOverlay(): Promise<void> {
    this.assertReady('clear')
    this.overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
    this.log.push({ operation: 'clear', overlay: cloneLearningOverlay(this.overlay) })
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.overlay = cloneLearningOverlay(EMPTY_LEARNING_OVERLAY)
    this.disposed = true
    this.log.push({ operation: 'dispose' })
  }

  injectFailure(operation: 'capture' | 'apply' | 'restore' | 'clear'): void {
    this.failNextOperation = operation
  }

  operationLog(): Array<{ operation: string; overlay?: LearningOverlayState }> {
    return structuredClone(this.log)
  }

  private assertReady(operation: string): void {
    if (this.disposed) throw new Error('El bridge está disposed.')
    if (this.failNextOperation === operation) {
      this.failNextOperation = null
      throw new Error(`Fallo inyectado del bridge durante ${operation}.`)
    }
  }
}

export function memoryBridgeCapabilities(): RuntimeCapability[] {
  return [
    'selection', 'visibility', 'isolation', 'explode', 'section', 'camera', 'highlight', 'transparency', 'entity-transform',
  ].map((name) => ({ id: `viewport.${name}`, version: '1.0.0', status: 'available' as const, explanation: `Bridge headless: ${name}.`, limitations: [] })).concat([
    { id: 'viewport.camera.orthographic', version: '1.0.0', status: 'available', explanation: 'Cámara ortográfica headless.', limitations: [] },
    { id: 'viewport.overlay.labels', version: '1.0.0', status: 'available', explanation: 'Overlays de texto headless.', limitations: [] },
    { id: 'viewport.overlay.arrows', version: '1.0.0', status: 'available', explanation: 'Overlays de flecha headless.', limitations: [] },
    { id: 'viewport.energy-route', version: '1.0.0', status: 'available', explanation: 'Rutas funcionales declarativas headless.', limitations: [] },
    { id: 'viewport.rotation-directions', version: '1.0.0', status: 'available', explanation: 'Sentidos de giro declarativos headless.', limitations: [] },
    { id: 'viewport.multi-fixture', version: '1.0.0', status: 'available', explanation: 'Composicion efimera de fixtures.', limitations: [] },
    { id: 'viewport.restore', version: '1.0.0', status: 'available', explanation: 'Restauracion de snapshot educativo.', limitations: [] },
  ])
}
