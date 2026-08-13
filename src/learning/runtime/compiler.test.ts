import { describe, expect, it } from 'vitest'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { ProjectEntityIndex } from '../canonical'
import { createMinimalV6Fixture, createV5ProjectFixture } from '../fixtures/canonicalFixtures'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { MemoryViewportLearningBridge, memoryBridgeCapabilities } from './bridge'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES } from './capabilities'
import { SceneCompiler } from './compiler'
import { encodeLearningPackage, LearningPackageLoader } from './packageLoader'

async function loadFixture() {
  const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(
    encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]),
  )
  if (!result.success) throw new Error(result.diagnostics.map(({ message }) => message).join(' '))
  return result.value
}

function capabilities(withExplode = true) {
  const bridge = memoryBridgeCapabilities().filter(({ id }) => withExplode || id !== 'viewport.explode')
  return new CapabilityResolver([...HEADLESS_RUNTIME_CAPABILITIES, ...bridge])
}

describe('SceneCompiler', () => {
  it('compiles a v5 scene into a deterministic plan before touching presentation', async () => {
    const loaded = await loadFixture()
    const project = createV5ProjectFixture()
    const bridge = new MemoryViewportLearningBridge()
    const compiler = new SceneCompiler()
    const first = compiler.compile(loaded, 'scene.v5-reversible', new ProjectEntityIndex(projectV5ToCanonical(project)), capabilities())
    const second = compiler.compile(loaded, 'scene.v5-reversible', new ProjectEntityIndex(projectV5ToCanonical(project)), capabilities())
    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    if (!first.success || !second.success) return
    expect(first.plan.id).toBe(second.plan.id)
    expect(first.plan.initialOverlay.selectedEntityIds).toHaveLength(1)
    expect(first.plan.requiresPresentationSnapshot).toBe(true)
    expect(bridge.operationLog()).toEqual([])
  })

  it('rejects missing selectors and capabilities before any state change', async () => {
    const loaded = await loadFixture()
    const result = new SceneCompiler().compile(
      loaded,
      'scene.invalid-runtime',
      new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture())),
      capabilities(),
    )
    expect(result.success).toBe(false)
    expect(result.diagnostics.map(({ code }) => code)).toEqual(expect.arrayContaining(['LR-CAPABILITY-MISSING', 'LR-SELECTOR-NO-RESULT']))
  })

  it('normalizes animation duration for reduced motion without changing semantics', async () => {
    const loaded = await loadFixture()
    const result = new SceneCompiler().compile(loaded, 'scene.v6-repeated', new ProjectEntityIndex(createMinimalV6Fixture()), capabilities(), { reducedMotion: true })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.plan.timeline.every(({ durationMs }) => durationMs === 0)).toBe(true)
    expect(result.plan.initialOverlay.selectedEntityIds).toHaveLength(2)
    expect(result.plan.accessibility.unlimitedTimeByDefault).toBe(true)
  })

  it('rejects an operation whose detectable viewport capability is unavailable', async () => {
    const loaded = await loadFixture()
    const result = new SceneCompiler().compile(loaded, 'scene.v6-repeated', new ProjectEntityIndex(createMinimalV6Fixture()), capabilities(false))
    expect(result.success).toBe(false)
    expect(result.diagnostics.some(({ category }) => category === 'capability-missing')).toBe(true)
  })

  it('detects incompatible initial operations', async () => {
    const loaded = await loadFixture()
    const scene = loaded.pack.scenes.find(({ id }) => id === 'scene.v5-reversible')!
    scene.state.visible = structuredClone(scene.state.hidden)
    const result = new SceneCompiler().compile(loaded, scene.id, new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture())), capabilities())
    expect(result.success).toBe(false)
    expect(result.diagnostics.map(({ code }) => code)).toContain('LR-SCENE-VISIBILITY-CONFLICT')
  })

  it('accepts a limited capability only when the scene declares that choice', async () => {
    const loaded = await loadFixture()
    const scene = loaded.pack.scenes.find(({ id }) => id === 'scene.v5-reversible')!
    scene.requiredCapabilities.push({ id: 'viewport.transparency', versionRange: '^1.0.0', optional: false, allowLimited: true })
    scene.state.transparent.push({ target: { selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }, opacity: 0.5 })
    const available = [...HEADLESS_RUNTIME_CAPABILITIES, ...memoryBridgeCapabilities()].map((capability) =>
      capability.id === 'viewport.transparency' ? { ...capability, status: 'limited' as const } : capability)
    const result = new SceneCompiler().compile(
      loaded,
      scene.id,
      new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture())),
      new CapabilityResolver(available),
    )
    expect(result.success).toBe(true)
  })
})
