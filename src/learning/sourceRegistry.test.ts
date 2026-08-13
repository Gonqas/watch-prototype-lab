import { describe, expect, it } from 'vitest'
import {
  CURATED_HOROLOGY_SOURCE_REGISTRY,
  queryCuratedSources,
  sourceRegistrySummary,
} from './sourceRegistry'

describe('curated horology source registry', () => {
  it('curates every resource linked from the audited index', () => {
    expect(CURATED_HOROLOGY_SOURCE_REGISTRY.entries).toHaveLength(24)
    expect(new Set(CURATED_HOROLOGY_SOURCE_REGISTRY.entries.map(({ id }) => id)).size).toBe(24)
    expect(CURATED_HOROLOGY_SOURCE_REGISTRY.policy.runtimeNetworkDependency).toBe(false)
  })

  it('keeps official documentation apart from educational and discovery resources', () => {
    const summary = sourceRegistrySummary()
    expect(summary.byTier.A).toBeGreaterThanOrEqual(1)
    expect(summary.byTier.E).toBeGreaterThanOrEqual(1)
    expect(queryCuratedSources({ authorityTier: 'A' }).every(({ sourceClass }) => sourceClass === 'official-primary')).toBe(true)
    expect(queryCuratedSources({ pedagogicalUse: 'theory' }).length).toBeGreaterThanOrEqual(4)
  })

  it('does not claim offline availability without a hashed local copy', () => {
    expect(CURATED_HOROLOGY_SOURCE_REGISTRY.entries.every(({ offlineReady }) => !offlineReady)).toBe(true)
    expect(CURATED_HOROLOGY_SOURCE_REGISTRY.entries.every(({ checkedAt }) => checkedAt === '2026-08-02')).toBe(true)
  })
})
