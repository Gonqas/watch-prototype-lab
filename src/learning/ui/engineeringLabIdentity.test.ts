import { describe, expect, it } from 'vitest'
import { normalizeEngineeringLabId } from './engineeringLabIdentity'

describe('engineering lab identity migration', () => {
  it('reserves metrology for the physical station while preserving old links', () => {
    expect(normalizeEngineeringLabId('metrology')).toBe('capability')
    expect(normalizeEngineeringLabId('cp-cpk')).toBe('capability')
    expect(normalizeEngineeringLabId('capability')).toBe('capability')
  })

  it('falls back deterministically for unknown station ids', () => {
    expect(normalizeEngineeringLabId('unknown')).toBe('gear-train')
  })
})
