import { describe, expect, it } from 'vitest'
import { createInvalidLearningPackFixture, minimalLearningPackFixture } from '../fixtures/learningPackFixtures'
import { isRestrictedMarkdown, isSafePackPath, sha256Hex, validateLearningPack } from './learningPack'

describe('.wplab-learning-pack validation', () => {
  it('accepts the complete minimal contract fixture', () => {
    const result = validateLearningPack(minimalLearningPackFixture)
    expect(result.success).toBe(true)
  })

  it('reports traversal and executable markup without executing content', () => {
    const result = validateLearningPack(createInvalidLearningPackFixture())
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.map(({ code }) => code)).toEqual(expect.arrayContaining(['unsafe-path', 'unsafe-markdown']))
    expect(isSafePackPath('C:/escape.json')).toBe(false)
    expect(isSafePackPath('content\\lesson.json')).toBe(false)
    expect(isRestrictedMarkdown('[x](javascript:alert(1))')).toBe(false)
  })

  it('enforces configurable size and depth limits', () => {
    const size = validateLearningPack(minimalLearningPackFixture, { maximumJsonBytes: 10, maximumDepth: 32 })
    expect(size.success).toBe(false)
    if (!size.success) expect(size.errors.some(({ code }) => code === 'size-limit')).toBe(true)
    const depth = validateLearningPack(minimalLearningPackFixture, { maximumJsonBytes: 10_000_000, maximumDepth: 2 })
    expect(depth.success).toBe(false)
    if (!depth.success) expect(depth.errors.some(({ code }) => code === 'depth-limit')).toBe(true)
  })

  it('computes stable SHA-256 hashes with the platform crypto implementation', async () => {
    await expect(sha256Hex(new TextEncoder().encode('test')))
      .resolves.toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')
  })
})
