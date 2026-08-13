import { describe, expect, it } from 'vitest'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { encodeLearningPackage, LearningPackageLoader, type LoadedLearningPackage } from './packageLoader'
import { LearningPackageRegistry } from './packageRegistry'

async function loaded(id: string, version: string, dependencies: Array<{ packageId: string; versionRange: string }> = [], title?: string): Promise<LoadedLearningPackage> {
  const pack = createRuntimeLearningPackFixture()
  pack.manifest.id = id
  pack.manifest.packageVersion = version
  pack.manifest.dependencies = dependencies
  if (title) pack.manifest.title = title
  const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(
    encodeLearningPackage(pack, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]),
  )
  if (!result.success) throw new Error(result.diagnostics.map(({ message }) => message).join(' '))
  return result.value
}

describe('LearningPackageRegistry', () => {
  it('keeps multiple versions and selects the highest compatible one deterministically', async () => {
    const registry = new LearningPackageRegistry()
    registry.register(await loaded('pack.core', '1.0.0'))
    registry.register(await loaded('pack.core', '1.4.0'))
    registry.register(await loaded('pack.core', '2.0.0'))
    expect(registry.select('pack.core', '^1.0.0')?.pack.manifest.packageVersion).toBe('1.4.0')
    expect(registry.select('pack.core', '~1.0.0')?.pack.manifest.packageVersion).toBe('1.0.0')
  })

  it('rejects a silent collision for the same ID and version', async () => {
    const registry = new LearningPackageRegistry()
    registry.register(await loaded('pack.core', '1.0.0', [], 'First'))
    const collision = registry.register(await loaded('pack.core', '1.0.0', [], 'Different bytes'))
    expect(collision.registered).toBe(false)
    expect(collision.diagnostics[0].code).toBe('LR-REGISTRY-VERSION-COLLISION')
  })

  it('reports missing dependencies and cycles with stable diagnostics', async () => {
    const missingRegistry = new LearningPackageRegistry()
    missingRegistry.register(await loaded('pack.root', '1.0.0', [{ packageId: 'pack.missing', versionRange: '^1.0.0' }]))
    expect(missingRegistry.resolveForSession('pack.root')?.diagnostics.map(({ code }) => code)).toContain('LR-REGISTRY-DEPENDENCY-MISSING')

    const cyclic = new LearningPackageRegistry()
    cyclic.register(await loaded('pack.a', '1.0.0', [{ packageId: 'pack.b', versionRange: '1.0.0' }]))
    cyclic.register(await loaded('pack.b', '1.0.0', [{ packageId: 'pack.a', versionRange: '1.0.0' }]))
    expect(cyclic.resolveForSession('pack.a')?.diagnostics.map(({ code }) => code)).toContain('LR-REGISTRY-DEPENDENCY-CYCLE')
  })

  it('pins resolved object versions so a later update cannot change an active graph', async () => {
    const registry = new LearningPackageRegistry()
    registry.register(await loaded('pack.dep', '1.0.0'))
    registry.register(await loaded('pack.root', '1.0.0', [{ packageId: 'pack.dep', versionRange: '^1.0.0' }]))
    const graph = registry.resolveForSession('pack.root')!
    registry.register(await loaded('pack.dep', '1.1.0'))
    expect(graph.pinned.get('pack.dep')?.pack.manifest.packageVersion).toBe('1.0.0')
    expect(registry.resolveForSession('pack.root')?.pinned.get('pack.dep')?.pack.manifest.packageVersion).toBe('1.1.0')
  })
})
