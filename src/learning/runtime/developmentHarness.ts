import type { WatchProject } from '../../vnext/model'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { ProjectEntityIndex } from '../canonical'
import { createMinimalV6Fixture, createMiyota8215SemanticFixture } from '../fixtures/canonicalFixtures'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { createStudioEntityPartMap, StudioViewportLearningBridge } from '../integrations/studioViewportBridge'
import { MemoryViewportLearningBridge, type ViewportLearningBridge } from './bridge'
import type { LearningCommand } from './commands'
import { encodeLearningPackage, LearningPackageLoader } from './packageLoader'
import { LearningRuntime } from './runtime'

export type DevelopmentFixtureId = 'active-v5' | 'minimal-v6' | 'miyota-8215'
export type DevelopmentBridgeMode = 'studio' | 'headless'
export type DevelopmentPackageId = 'integrated-contract' | 'local-unsigned-contract'

export interface LearningHarnessSnapshot {
  fixtureId: DevelopmentFixtureId
  packageId: DevelopmentPackageId
  sceneId: string
  bridgeMode: DevelopmentBridgeMode
  state: string
  plan?: unknown
  diagnostics: unknown[]
  events: unknown[]
  capabilities: unknown[]
  overlay: unknown
}

export class LearningDevelopmentHarness {
  private runtime = this.createRuntime()
  private bridge?: ViewportLearningBridge
  private index?: ProjectEntityIndex
  private technicalProject: unknown
  private plan: unknown
  private fixtureId: DevelopmentFixtureId = 'active-v5'
  private packageId: DevelopmentPackageId = 'integrated-contract'
  private sceneId = 'scene.v5-reversible'
  private bridgeMode: DevelopmentBridgeMode = 'studio'
  private readonly activeProject: WatchProject
  private readonly packageBytes: Record<DevelopmentPackageId, Uint8Array>

  constructor(activeProject: WatchProject) {
    this.activeProject = activeProject
    this.technicalProject = activeProject
    const integrated = createRuntimeLearningPackFixture()
    const localUnsigned = createRuntimeLearningPackFixture()
    localUnsigned.manifest.distribution = 'local-unsigned'
    this.packageBytes = {
      'integrated-contract': encodeLearningPackage(integrated, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]),
      'local-unsigned-contract': encodeLearningPackage(localUnsigned, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]),
    }
  }

  async configure(
    fixtureId: DevelopmentFixtureId,
    sceneId: string,
    bridgeMode: DevelopmentBridgeMode,
    packageId: DevelopmentPackageId = this.packageId,
  ): Promise<void> {
    await this.runtime.dispose()
    this.fixtureId = fixtureId
    this.packageId = packageId
    this.sceneId = sceneId
    this.bridgeMode = bridgeMode
    this.runtime = this.createRuntime()
    if (fixtureId === 'active-v5') {
      this.technicalProject = this.activeProject
      this.index = new ProjectEntityIndex(projectV5ToCanonical(this.activeProject))
    } else if (fixtureId === 'minimal-v6') {
      const assembly = createMinimalV6Fixture()
      this.technicalProject = assembly
      this.index = new ProjectEntityIndex(assembly)
    } else {
      const assembly = createMiyota8215SemanticFixture()
      this.technicalProject = assembly
      this.index = new ProjectEntityIndex(assembly)
    }
    this.bridge = bridgeMode === 'studio'
      ? new StudioViewportLearningBridge(createStudioEntityPartMap(this.index))
      : new MemoryViewportLearningBridge()
  }

  async loadAndCompile(reducedMotion = false): Promise<void> {
    if (!this.index || !this.bridge) await this.configure(this.fixtureId, this.sceneId, this.bridgeMode)
    const origin = this.packageId === 'integrated-contract' ? 'integrated' : 'local-unsigned'
    const loaded = await this.runtime.loadPackage(this.packageBytes[this.packageId], origin)
    if (!loaded.success) return
    const compilation = this.runtime.prepareScene('test.contract-pack', '1.0.0', this.sceneId, this.index!, this.bridge!, this.technicalProject, reducedMotion)
    this.plan = compilation.success ? compilation.plan : undefined
  }

  async command(command: LearningCommand): Promise<void> {
    const session = this.runtime.activeSession()
    if (!session) throw new Error('No existe una sesión preparada.')
    await session.commands.dispatch(command)
    await session.flush()
  }

  async provokeFailure(): Promise<void> {
    const session = this.runtime.activeSession()
    if (!session) throw new Error('No existe una sesión preparada.')
    await session.fail(new Error('Fallo manual provocado por el arnés.'))
  }

  snapshot(): LearningHarnessSnapshot {
    const session = this.runtime.activeSession()
    return {
      fixtureId: this.fixtureId,
      packageId: this.packageId,
      sceneId: this.sceneId,
      bridgeMode: this.bridgeMode,
      state: this.runtime.state(),
      plan: this.plan,
      diagnostics: this.runtime.diagnostics(),
      events: this.runtime.events(),
      capabilities: this.bridge?.capabilities() ?? [],
      overlay: session?.currentOverlay() ?? null,
    }
  }

  async dispose(): Promise<void> {
    await this.runtime.dispose()
    await this.bridge?.dispose()
  }

  private createRuntime(): LearningRuntime {
    return new LearningRuntime({ loader: new LearningPackageLoader({ applicationVersion: '0.4.1' }) })
  }
}
