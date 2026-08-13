import { describe, expect, it } from 'vitest'
import { ProjectEntityIndex } from '../canonical'
import { createMinimalV6Fixture } from '../fixtures/canonicalFixtures'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { createStudioEntityPartMap, StudioViewportLearningBridge } from '../integrations/studioViewportBridge'
import { MemoryViewportLearningBridge } from './bridge'
import { encodeLearningPackage, LearningPackageLoader } from './packageLoader'
import { EMPTY_LEARNING_OVERLAY } from './overlay'
import { LearningRuntime } from './runtime'
import type { RuntimeScheduler } from './timeline'

const idleScheduler: RuntimeScheduler = {
  now: () => 0,
  setTimer: () => 1,
  clearTimer: () => undefined,
}

function packageBytes() {
  return encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
}

async function prepared() {
  const runtime = new LearningRuntime({ loader: new LearningPackageLoader({ applicationVersion: '0.4.1' }), scheduler: idleScheduler })
  const loaded = await runtime.loadPackage(packageBytes(), 'integrated')
  if (!loaded.success) throw new Error('load failed')
  const assembly = createMinimalV6Fixture()
  const bridge = new MemoryViewportLearningBridge()
  const compilation = runtime.prepareScene('test.contract-pack', '1.0.0', 'scene.v6-repeated', new ProjectEntityIndex(assembly), bridge, assembly)
  if (!compilation.success) throw new Error(compilation.diagnostics.map(({ message }) => message).join(' '))
  return { runtime, session: runtime.activeSession()!, bridge, assembly, plan: compilation.plan }
}

describe('LearningRuntime reversible execution', () => {
  it('runs headless, pauses, resumes and scrubs through semantic commands', async () => {
    const { session, bridge } = await prepared()
    expect((await session.commands.dispatch({ type: 'pause' })).accepted).toBe(false)
    expect((await session.commands.dispatch({ type: 'start-scene' })).accepted).toBe(true)
    expect(session.state()).toBe('running')
    await session.commands.dispatch({ type: 'pause' })
    expect(session.state()).toBe('paused')
    await session.commands.dispatch({ type: 'scrub', timeMs: 1_500 })
    expect(bridge.currentOverlay().explode).toBe(0.5)
    await session.commands.dispatch({ type: 'resume' })
    expect(session.state()).toBe('running')
    await session.commands.dispatch({ type: 'set-speed', speed: 0.5 })
    expect(session.events.history().some(({ type }) => type === 'command-rejected')).toBe(true)
  })

  it('restores the exact prior overlay after cancel without mutating the technical project', async () => {
    const { session, bridge, assembly } = await prepared()
    const previous = { ...structuredClone(EMPTY_LEARNING_OVERLAY), annotations: ['pre-existing-viewport-state'] }
    await bridge.applyOverlay(previous)
    const projectBefore = JSON.stringify(assembly)
    await session.start()
    expect(bridge.currentOverlay().selectedEntityIds).toHaveLength(2)
    await session.cancel('test-cancel')
    expect(bridge.currentOverlay()).toEqual(previous)
    expect(JSON.stringify(assembly)).toBe(projectBefore)
    expect(session.state()).toBe('disposed')
    await session.cancel('idempotent-second-cancel')
    expect(bridge.currentOverlay()).toEqual(previous)
  })

  it('restores after completion and preserves logical step order', async () => {
    const { session, bridge, plan } = await prepared()
    await session.start()
    await session.nextStep()
    await session.nextStep()
    expect(bridge.currentOverlay().activeStepId).toBe(plan.steps[1].id)
    await session.nextStep()
    expect(session.state()).toBe('completed')
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
    expect(session.events.history().map(({ type }) => type)).toEqual(expect.arrayContaining(['step-shown', 'restoration-completed', 'scene-completed']))
  })

  it('restores after a runtime/animation bridge error and supports a safe retry', async () => {
    const { session, bridge } = await prepared()
    bridge.injectFailure('apply')
    await expect(session.start()).rejects.toThrow(/inyectado/)
    expect(session.state()).toBe('failed')
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
    expect(session.diagnostics().map(({ code }) => code)).toContain('LR-RUNTIME-FAILED')
    const retry = await session.commands.dispatch({ type: 'restart' })
    expect(retry.accepted).toBe(true)
    expect(session.state()).toBe('running')
  })

  it('restores on component-style disposal and never leaks an overlay', async () => {
    const { session, bridge } = await prepared()
    await session.start()
    await session.dispose()
    await session.dispose()
    expect(session.state()).toBe('disposed')
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
  })

  it('cancels the active session before loading another package', async () => {
    const { runtime, session, bridge } = await prepared()
    await session.start()
    const result = await runtime.loadPackage(packageBytes(), 'integrated')
    expect(result.success).toBe(true)
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
    expect(runtime.activeSession()).toBeUndefined()
  })

  it('does not expose the complete project in serializable events', async () => {
    const { session } = await prepared()
    await session.start()
    await session.selectEntity(session.plan.initialOverlay.selectedEntityIds[0])
    const serialized = JSON.stringify(session.events.history())
    expect(() => JSON.parse(serialized)).not.toThrow()
    expect(serialized).not.toContain('movementReferences')
    expect(session.events.history().every(({ sessionId }) => sessionId === session.id)).toBe(true)
    expect(session.events.history().map(({ sequence }) => sequence)).toEqual(session.events.history().map((_, index) => index))
  })

  it('blocks before mutation when Studio cannot represent resolved v6 entities', async () => {
    const runtime = new LearningRuntime({ loader: new LearningPackageLoader({ applicationVersion: '0.4.1' }), scheduler: idleScheduler })
    const loaded = await runtime.loadPackage(packageBytes(), 'integrated')
    expect(loaded.success).toBe(true)
    const assembly = createMinimalV6Fixture()
    const bridge = new StudioViewportLearningBridge(createStudioEntityPartMap(new ProjectEntityIndex(assembly)))
    const result = runtime.prepareScene('test.contract-pack', '1.0.0', 'scene.v6-repeated', new ProjectEntityIndex(assembly), bridge, assembly)
    expect(result.success).toBe(false)
    expect(result.diagnostics.map(({ code }) => code)).toContain('LR-BRIDGE-ENTITY-UNSUPPORTED')
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
  })
})
