import { describe, expect, it } from 'vitest'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { ProjectEntityIndex } from '../canonical'
import { createV5ProjectFixture } from '../fixtures/canonicalFixtures'
import { createStudioEntityPartMap, StudioViewportLearningBridge } from '../integrations/studioViewportBridge'
import { MemoryViewportLearningBridge } from './bridge'
import { CapabilityResolver } from './capabilities'
import { EMPTY_LEARNING_OVERLAY } from './overlay'

describe('ViewportLearningBridge boundary', () => {
  it('captures, applies and restores presentation idempotently', async () => {
    const bridge = new MemoryViewportLearningBridge()
    const snapshot = await bridge.capturePresentation()
    await bridge.applyOverlay({ ...structuredClone(EMPTY_LEARNING_OVERLAY), hiddenEntityIds: ['pi_example_123456'] })
    expect(bridge.currentOverlay().hiddenEntityIds).toEqual(['pi_example_123456'])
    await bridge.restorePresentation(snapshot)
    await bridge.restorePresentation(snapshot)
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
    expect(bridge.operationLog().map(({ operation }) => operation)).toEqual(['capture', 'apply', 'restore', 'restore'])
  })

  it('reports unsupported and limited Studio capabilities before execution', () => {
    const index = new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture()))
    const bridge = new StudioViewportLearningBridge(createStudioEntityPartMap(index))
    const resolver = new CapabilityResolver(bridge.capabilities())
    expect(resolver.resolve('viewport.selection@^1.0.0').satisfied).toBe(true)
    expect(resolver.resolve('viewport.overlay.arrows@^1.0.0').satisfied).toBe(false)
    expect(resolver.resolve('viewport.transparency@^1.0.0').diagnostic?.message).toContain('limited')
  })

  it('exposes only presentational operations and no pedagogical/package APIs', () => {
    const bridge = new MemoryViewportLearningBridge()
    const keys = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(bridge)))
    expect(keys.has('applyOverlay')).toBe(true)
    expect(keys.has('capturePresentation')).toBe(true)
    expect(keys.has('entitySupport')).toBe(true)
    expect(keys.has('loadPackage')).toBe(false)
    expect(keys.has('evaluateAssessment')).toBe(false)
    expect(keys.has('resolveSelector')).toBe(false)
  })

  it('reports canonical entities that the current Studio geometry cannot represent', () => {
    const index = new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture()))
    const bridge = new StudioViewportLearningBridge(createStudioEntityPartMap(index))
    expect(bridge.entitySupport(['unknown-entity']).unsupportedEntityIds).toEqual(['unknown-entity'])
  })

  it('surfaces viewport errors instead of pretending an operation succeeded', async () => {
    const bridge = new MemoryViewportLearningBridge()
    bridge.injectFailure('apply')
    await expect(bridge.applyOverlay(EMPTY_LEARNING_OVERLAY)).rejects.toThrow(/inyectado/)
  })
})
