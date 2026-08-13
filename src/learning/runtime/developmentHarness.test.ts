import { describe, expect, it } from 'vitest'
import { createV5ProjectFixture } from '../fixtures/canonicalFixtures'
import { LearningDevelopmentHarness } from './developmentHarness'

describe('LearningDevelopmentHarness', () => {
  it('compiles its default Studio scenario with the real viewport capability matrix', async () => {
    const harness = new LearningDevelopmentHarness(createV5ProjectFixture())
    await harness.configure('active-v5', 'scene.v5-reversible', 'studio', 'integrated-contract')
    await harness.loadAndCompile()
    expect(harness.snapshot().plan).toBeDefined()
    expect(harness.snapshot().state).toBe('ready')
    await harness.dispose()
  })

  it('uses the real runtime for fixture selection, compilation, commands and inspection', async () => {
    const harness = new LearningDevelopmentHarness(createV5ProjectFixture())
    await harness.configure('minimal-v6', 'scene.v6-repeated', 'headless')
    await harness.loadAndCompile(true)
    expect(harness.snapshot().plan).toBeDefined()
    expect(harness.snapshot().state).toBe('ready')
    await harness.command({ type: 'start-scene' })
    await harness.command({ type: 'scrub', timeMs: 2_000 })
    expect(harness.snapshot().state).toBe('running')
    expect(harness.snapshot().events.length).toBeGreaterThan(0)
    await harness.command({ type: 'cancel', reason: 'harness-test' })
    expect(harness.snapshot().state).toBe('disposed')
    await harness.dispose()
  })

  it('shows compilation diagnostics for the invalid contractual scene', async () => {
    const harness = new LearningDevelopmentHarness(createV5ProjectFixture())
    await harness.configure('active-v5', 'scene.invalid-runtime', 'headless')
    await harness.loadAndCompile()
    expect(harness.snapshot().plan).toBeUndefined()
    expect(harness.snapshot().diagnostics.length).toBeGreaterThan(0)
    await harness.dispose()
  })

  it('loads the explicitly selected local-unsigned package without persisting it', async () => {
    const harness = new LearningDevelopmentHarness(createV5ProjectFixture())
    await harness.configure('minimal-v6', 'scene.v6-repeated', 'headless', 'local-unsigned-contract')
    await harness.loadAndCompile()
    expect(harness.snapshot().packageId).toBe('local-unsigned-contract')
    expect(harness.snapshot().plan).toBeDefined()
    await harness.dispose()
  })
})
