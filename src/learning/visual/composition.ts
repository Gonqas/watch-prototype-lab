import { stableFingerprint } from '../identity'
import { buildEducationalSceneGraph, LogicalVisualObjectRegistry } from './sceneGraph'
import {
  CompositionEntityProjection,
  compositionCanonicalAssembly,
  compositionCanonicalIndex,
} from './projection'
import type { CanonicalAssembly, ProjectEntityIndex } from '../canonical'
import { collectVisualPerformance } from './performance'
import { EducationalFixtureRegistry } from './registry'
import { EducationalVisualStateStore, VisualOperationExecutor } from './state'
import type {
  CompositionSelector,
  CompositionSelectorResolution,
  EducationalFixtureMountSpec,
  EducationalViewportCompositionSpec,
  EducationalVisualSnapshot,
  LoadedEducationalFixtureMount,
  VisualDiagnostic,
  VisualOperation,
  VisualOperationResult,
  VisualPerformanceBudget,
  VisualPerformanceReport,
} from './model'

function validateMount(mount: EducationalFixtureMountSpec): VisualDiagnostic[] {
  const diagnostics: VisualDiagnostic[] = []
  if (!mount.id.trim() || mount.id.includes('::')) diagnostics.push({
    code: 'EV-MOUNT-ID-INVALID',
    severity: 'error',
    message: `ID de montura inválido: ${mount.id}`,
    accessibleMessage: 'Una vista del modelo tiene una identidad inválida.',
  })
  const values = [...mount.transform.position, ...mount.transform.rotation, mount.transform.scale]
  if (values.some((value) => !Number.isFinite(value)) || mount.transform.scale <= 0) diagnostics.push({
    code: 'EV-MOUNT-TRANSFORM-INVALID',
    severity: 'error',
    message: `Transformación inválida para ${mount.id}.`,
    accessibleMessage: `No se puede colocar ${mount.label} porque su transformación no es válida.`,
  })
  return diagnostics
}

export function validateEducationalComposition(
  spec: EducationalViewportCompositionSpec,
): VisualDiagnostic[] {
  const diagnostics = spec.mounts.flatMap(validateMount)
  if (![1, 2, 4].includes(spec.mounts.length)) diagnostics.push({
    code: 'EV-COMPOSITION-MOUNT-COUNT',
    severity: 'error',
    message: `La composición necesita una, dos o cuatro monturas; recibió ${spec.mounts.length}.`,
    accessibleMessage: 'La comparación visual necesita una, dos o cuatro vistas.',
  })
  if (new Set(spec.mounts.map(({ id }) => id)).size !== spec.mounts.length) diagnostics.push({
    code: 'EV-COMPOSITION-DUPLICATE-MOUNT',
    severity: 'error',
    message: 'La composición contiene IDs de montura duplicados.',
    accessibleMessage: 'Dos vistas del modelo tienen la misma identidad.',
  })
  if (spec.mounts.length === 1 && spec.layout !== 'single') diagnostics.push({
    code: 'EV-COMPOSITION-LAYOUT',
    severity: 'error',
    message: 'Una montura necesita layout single.',
    accessibleMessage: 'La vista única no puede usar un diseño de comparación.',
  })
  if (spec.mounts.length === 2 && !['split-horizontal', 'split-vertical', 'overlay'].includes(spec.layout)) diagnostics.push({
    code: 'EV-COMPOSITION-LAYOUT',
    severity: 'error',
    message: 'Dos monturas necesitan layout dividido u overlay.',
    accessibleMessage: 'La comparación de dos modelos necesita una vista dividida o superpuesta.',
  })
  if (spec.mounts.length === 4 && !['quad', 'overlay'].includes(spec.layout)) diagnostics.push({
    code: 'EV-COMPOSITION-LAYOUT',
    severity: 'error',
    message: 'Cuatro monturas necesitan layout quad u overlay.',
    accessibleMessage: 'La comparación de cuatro modelos necesita cuadrícula o superposición.',
  })
  return diagnostics
}

export class EducationalViewportComposition {
  readonly spec: EducationalViewportCompositionSpec
  readonly registry: EducationalFixtureRegistry
  readonly objects = new LogicalVisualObjectRegistry()
  readonly stateStore: EducationalVisualStateStore
  readonly operations: VisualOperationExecutor
  readonly projection: CompositionEntityProjection
  private readonly mountedById = new Map<string, LoadedEducationalFixtureMount>()
  private readonly now: () => number
  private readonly wallClock: () => string
  private disposed = false

  constructor(
    spec: EducationalViewportCompositionSpec,
    registry: EducationalFixtureRegistry,
    options: {
      now?: () => number
      wallClock?: () => string
      reducedMotion?: boolean
      capabilities?: ConstructorParameters<typeof VisualOperationExecutor>[1]
    } = {},
  ) {
    const diagnostics = validateEducationalComposition(spec)
    if (diagnostics.some(({ severity }) => severity === 'error')) {
      throw new Error(diagnostics.map(({ message }) => message).join(' '))
    }
    this.spec = structuredClone(spec)
    this.registry = registry
    this.now = options.now ?? (() => performance.now())
    this.wallClock = options.wallClock ?? (() => new Date().toISOString())
    this.stateStore = new EducationalVisualStateStore(
      spec.id,
      spec.layout,
      spec.mounts.map(({ id }) => id),
      options.reducedMotion ?? false,
    )
    this.operations = new VisualOperationExecutor(this.stateStore, options.capabilities)
    this.projection = new CompositionEntityProjection(() => this.mounted())
  }

  async loadMount(mountId: string): Promise<LoadedEducationalFixtureMount> {
    this.assertReady()
    const current = this.mountedById.get(mountId)
    if (current) return structuredClone(current)
    const spec = this.spec.mounts.find(({ id }) => id === mountId)
    if (!spec) throw new Error(`Montura inexistente: ${mountId}`)
    if (!spec.enabled) throw new Error(`Montura deshabilitada: ${mountId}`)
    const started = this.now()
    const fixture = await this.registry.acquire(spec.fixtureId, spec.fixtureVersion)
    const sceneGraph = buildEducationalSceneGraph(this.spec.id, spec, fixture)
    if (sceneGraph.diagnostics.some(({ severity }) => severity === 'error')) {
      this.registry.release(spec.fixtureId, spec.fixtureVersion)
      throw new Error(sceneGraph.diagnostics.map(({ message }) => message).join(' '))
    }
    const mounted: LoadedEducationalFixtureMount = {
      spec: structuredClone(spec),
      fixture,
      sceneGraph,
      loadedAt: this.wallClock(),
      loadDurationMs: Math.max(0, this.now() - started),
    }
    this.mountedById.set(mountId, mounted)
    this.objects.registerGraph(sceneGraph)
    this.stateStore.registerGraph(sceneGraph)
    return structuredClone(mounted)
  }

  async loadMounts(mountIds: string[]): Promise<LoadedEducationalFixtureMount[]> {
    return Promise.all([...new Set(mountIds)].map((mountId) => this.loadMount(mountId)))
  }

  async loadEnabledMounts(): Promise<LoadedEducationalFixtureMount[]> {
    return this.loadMounts(this.spec.mounts.filter(({ enabled }) => enabled).map(({ id }) => id))
  }

  unloadMount(mountId: string, evictWhenUnused = false): boolean {
    this.assertReady()
    const mounted = this.mountedById.get(mountId)
    if (!mounted) return false
    this.mountedById.delete(mountId)
    this.objects.unregisterMount(mountId)
    this.stateStore.unregisterMount(mountId)
    this.registry.release(mounted.fixture.id, mounted.fixture.version, evictWhenUnused)
    return true
  }

  mounted(): LoadedEducationalFixtureMount[] {
    return [...this.mountedById.values()]
      .sort((left, right) => left.spec.id.localeCompare(right.spec.id))
      .map((mounted) => structuredClone(mounted))
  }

  resolve(selector: CompositionSelector): CompositionSelectorResolution {
    return this.projection.resolve(selector)
  }

  canonicalAssembly(): CanonicalAssembly {
    return compositionCanonicalAssembly(this.spec.id, this.mounted())
  }

  canonicalIndex(): ProjectEntityIndex {
    return compositionCanonicalIndex(this.spec.id, this.mounted())
  }

  execute(operation: VisualOperation): VisualOperationResult {
    return this.operations.execute(operation)
  }

  captureSnapshot(capturedAt = this.wallClock()): EducationalVisualSnapshot {
    const mounted = this.mounted()
    return {
      snapshotVersion: 1,
      compositionId: this.spec.id,
      loadedMountIds: mounted.map(({ spec }) => spec.id),
      state: this.stateStore.state(),
      fixtureFingerprints: Object.fromEntries(mounted.map(({ spec, fixture }) => [spec.id, stableFingerprint(fixture)])),
      capturedAt,
    }
  }

  async restoreSnapshot(snapshot: EducationalVisualSnapshot): Promise<void> {
    this.assertReady()
    if (snapshot.compositionId !== this.spec.id) throw new Error(`Snapshot de otra composición: ${snapshot.compositionId}`)
    const expected = new Set(snapshot.loadedMountIds)
    for (const mountId of [...this.mountedById.keys()]) {
      if (!expected.has(mountId)) this.unloadMount(mountId)
    }
    await this.loadMounts(snapshot.loadedMountIds)
    for (const mounted of this.mounted()) {
      const expectedFingerprint = snapshot.fixtureFingerprints[mounted.spec.id]
      if (expectedFingerprint && stableFingerprint(mounted.fixture) !== expectedFingerprint) {
        throw new Error(`El fixture ${mounted.spec.id} cambió desde el snapshot.`)
      }
    }
    this.stateStore.replace(snapshot.state)
  }

  performance(
    budget?: VisualPerformanceBudget,
    measuredAt = this.wallClock(),
  ): VisualPerformanceReport {
    return collectVisualPerformance(
      this.mounted(),
      this.stateStore.state(),
      this.registry.records(),
      budget,
      measuredAt,
    )
  }

  async dispose(evictWhenUnused = false): Promise<void> {
    if (this.disposed) return
    for (const mountId of [...this.mountedById.keys()]) this.unloadMount(mountId, evictWhenUnused)
    this.disposed = true
  }

  private assertReady(): void {
    if (this.disposed) throw new Error('La composición visual está disposed.')
  }
}
