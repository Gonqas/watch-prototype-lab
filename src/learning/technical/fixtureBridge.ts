import type { RuntimeCapability } from '../runtime/capabilities'
import {
  MemoryViewportLearningBridge,
  type ViewportEntitySupport,
} from '../runtime/bridge'
import type { TechnicalMovementFixture } from './reconstruction'

export function technicalFixtureBridgeCapabilities(): RuntimeCapability[] {
  return [
    {
      id: 'viewport.selection',
      version: '1.0.0',
      status: 'available',
      explanation: 'Selección reversible por instancia canónica del fixture técnico.',
      limitations: ['La integración visual con Three.js queda pendiente; esta capacidad gobierna el estado técnico.'],
    },
    {
      id: 'viewport.visibility',
      version: '1.0.0',
      status: 'available',
      explanation: 'Visibilidad reversible por instancia canónica.',
      limitations: ['Solo se renderizan como geometría las primitivas declaradas en el fixture.'],
    },
    {
      id: 'viewport.isolation',
      version: '1.0.0',
      status: 'available',
      explanation: 'Aislamiento reversible por instancia canónica.',
      limitations: [],
    },
    {
      id: 'viewport.explode',
      version: '1.0.0',
      status: 'available',
      explanation: 'Estado continuo de explosionado normalizado.',
      limitations: ['No define aún trayectorias de desmontaje por pieza en el renderer.'],
    },
    {
      id: 'viewport.highlight',
      version: '1.0.0',
      status: 'available',
      explanation: 'Resaltado reversible por instancia canónica.',
      limitations: [],
    },
    {
      id: 'viewport.transparency',
      version: '1.0.0',
      status: 'available',
      explanation: 'Opacidad reversible por instancia canónica.',
      limitations: ['La aplicación material en Three.js queda pendiente.'],
    },
    {
      id: 'viewport.overlay.labels',
      version: '1.0.0',
      status: 'limited',
      explanation: 'El contrato acepta etiquetas accesibles asociadas a entidades.',
      limitations: ['Falta anclaje espacial en el viewport de producción.'],
    },
    {
      id: 'viewport.overlay.arrows',
      version: '1.0.0',
      status: 'unavailable',
      explanation: 'No existe todavía un renderer de flechas ancladas a interfaces canónicas.',
      limitations: ['Necesita anclajes geométricos y una capa de overlays espaciales.'],
    },
    {
      id: 'viewport.rotation-directions',
      version: '1.0.0',
      status: 'unavailable',
      explanation: 'No existe todavía una visualización anclada de sentidos de giro.',
      limitations: ['Necesita ejes por instancia y flechas espaciales.'],
    },
    {
      id: 'viewport.multi-fixture',
      version: '1.0.0',
      status: 'unavailable',
      explanation: 'StudioViewport solo presenta un proyecto visual cada vez.',
      limitations: ['La comparación coordinada de cuatro fixtures necesita composición de viewports o escenas.'],
    },
  ]
}

export class TechnicalFixtureViewportBridge extends MemoryViewportLearningBridge {
  private readonly supportedIds: ReadonlySet<string>

  constructor(
    fixture: TechnicalMovementFixture,
    now: () => string = () => new Date().toISOString(),
  ) {
    super(
      `technical-fixture-bridge:${fixture.id}@${fixture.version}`,
      technicalFixtureBridgeCapabilities(),
      now,
    )
    this.supportedIds = new Set(fixture.assembly.instances
      .filter(({ state }) => state !== 'deleted')
      .map(({ id }) => id))
  }

  override entitySupport(entityIds: readonly string[]): ViewportEntitySupport {
    const unique = [...new Set(entityIds)].sort()
    return {
      supportedEntityIds: unique.filter((id) => this.supportedIds.has(id)),
      unsupportedEntityIds: unique.filter((id) => !this.supportedIds.has(id)),
    }
  }
}
