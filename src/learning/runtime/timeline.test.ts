import { describe, expect, it } from 'vitest'
import { ProjectEntityIndex } from '../canonical'
import { createMinimalV6Fixture } from '../fixtures/canonicalFixtures'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { memoryBridgeCapabilities } from './bridge'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES } from './capabilities'
import { SceneCompiler, type SceneExecutionPlan } from './compiler'
import { encodeLearningPackage, LearningPackageLoader } from './packageLoader'
import { evaluateTimelineAt, LearningTimelineController, type RuntimeScheduler } from './timeline'

class FakeScheduler implements RuntimeScheduler {
  private time = 0
  private sequence = 0
  private readonly timers = new Map<number, { at: number; callback: () => void }>()
  now() { return this.time }
  setTimer(callback: () => void, delayMs: number) { const id = this.sequence++; this.timers.set(id, { at: this.time + delayMs, callback }); return id }
  clearTimer(handle: unknown) { this.timers.delete(handle as number) }
  advance(ms: number) {
    this.time += ms
    const due = [...this.timers.entries()].filter(([, timer]) => timer.at <= this.time).sort((a, b) => a[1].at - b[1].at)
    due.forEach(([id, timer]) => { if (this.timers.delete(id)) timer.callback() })
  }
}

async function plan(): Promise<SceneExecutionPlan> {
  const bytes = encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
  const loaded = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(bytes)
  if (!loaded.success) throw new Error('fixture load failed')
  const result = new SceneCompiler().compile(
    loaded.value,
    'scene.v6-repeated',
    new ProjectEntityIndex(createMinimalV6Fixture()),
    new CapabilityResolver([...HEADLESS_RUNTIME_CAPABILITIES, ...memoryBridgeCapabilities()]),
  )
  if (!result.success) throw new Error('fixture compile failed')
  return result.plan
}

describe('LearningTimelineController', () => {
  it('makes direct scrubbing equivalent to evaluation through earlier keyframes', async () => {
    const compiled = await plan()
    const direct = evaluateTimelineAt(compiled, 2_000)
    evaluateTimelineAt(compiled, 1_000)
    const afterEarlierEvaluation = evaluateTimelineAt(compiled, 2_000)
    expect(direct.state).toEqual(afterEarlierEvaluation.state)
    expect(direct.state.explode).toBe(1)
    expect(evaluateTimelineAt(compiled, 1_500).state.explode).toBe(0.5)
  })

  it('supports play, pause, resume, speed, stop, restart and disposal with a fake clock', async () => {
    const scheduler = new FakeScheduler()
    const evaluations: number[] = []
    const controller = new LearningTimelineController(await plan(), (evaluation) => evaluations.push(evaluation.evaluatedMs), scheduler)
    controller.start()
    scheduler.advance(500)
    controller.pause()
    expect(controller.state()).toBe('paused')
    controller.setPlaybackSpeed(2)
    controller.resume()
    scheduler.advance(250)
    expect(controller.currentTimeMs()).toBe(1_000)
    controller.stop()
    expect(controller.currentTimeMs()).toBe(0)
    controller.restart()
    expect(controller.state()).toBe('running')
    controller.dispose()
    expect(controller.state()).toBe('disposed')
    expect(() => controller.pause()).toThrow()
    expect(evaluations.length).toBeGreaterThan(2)
  })

  it('blocks seeking past unresolved mandatory interaction and resumes after resolution', async () => {
    const compiled = await plan()
    const withBarrier = structuredClone(compiled)
    withBarrier.timeline[1].waitFor = 'interaction'
    const blocked = evaluateTimelineAt(withBarrier, 2_500)
    expect(blocked.evaluatedMs).toBe(withBarrier.timeline[1].atMs)
    expect(blocked.blockedByActionId).toBe(withBarrier.timeline[1].id)
    const resolved = evaluateTimelineAt(withBarrier, 2_500, new Set([withBarrier.timeline[1].id]))
    expect(resolved.evaluatedMs).toBe(2_500)
  })

  it('rejects invalid transitions clearly', async () => {
    const controller = new LearningTimelineController(await plan(), () => undefined, new FakeScheduler())
    expect(() => controller.pause()).toThrow(/pausar/)
    controller.start()
    expect(() => controller.start()).toThrow(/iniciar/)
  })
})
