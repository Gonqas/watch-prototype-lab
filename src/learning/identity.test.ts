import { describe, expect, it } from 'vitest'
import { assertCanonicalId, deterministicCanonicalId, isCanonicalId, stableFingerprint } from './identity'

describe('canonical identity', () => {
  it('validates every branded ID family and rejects the wrong family', () => {
    const kinds = ['part-definition', 'part-instance', 'assembly-interface', 'assembly-dependency', 'movement-reference', 'assembly'] as const
    for (const kind of kinds) {
      const id = deterministicCanonicalId(kind, 'identity-test-1', 'same-semantic-key')
      expect(isCanonicalId(id, kind)).toBe(true)
      expect(assertCanonicalId(id, kind)).toBe(id)
    }
    expect(isCanonicalId('part-1')).toBe(false)
    expect(() => assertCanonicalId('pi_identity_123456', 'part-definition')).toThrow(/inválido/)
  })

  it('is deterministic and canonicalizes object key order for fingerprints', () => {
    expect(deterministicCanonicalId('part-instance', 'v5-projection-1', 'project:case'))
      .toBe(deterministicCanonicalId('part-instance', 'v5-projection-1', 'project:case'))
    expect(stableFingerprint({ b: 2, a: 1 })).toBe(stableFingerprint({ a: 1, b: 2 }))
  })
})
