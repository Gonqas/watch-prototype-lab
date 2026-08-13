import { describe, expect, it } from 'vitest'
import { canonicalJson, fingerprintTechnicalProject, sha256Fingerprint } from './fingerprints'

describe('canonical SHA-256 fingerprints', () => {
  it('is stable across property order and Unicode normalization', async () => {
    const left = { z: 'reloj', a: { label: 'cafe\u0301', value: 1.25 } }
    const right = { a: { value: 1.25, label: 'café' }, z: 'reloj' }
    expect(canonicalJson(left)).toBe(canonicalJson(right))
    expect(await sha256Fingerprint(left)).toBe(await sha256Fingerprint(right))
  })

  it('documents number handling and rejects non-JSON numbers', () => {
    expect(canonicalJson({ negativeZero: -0, integer: 1, fraction: 1.5 })).toBe('{"fraction":1.5,"integer":1,"negativeZero":0}')
    expect(() => canonicalJson({ invalid: Number.NaN })).toThrow(/NaN/)
  })

  it('has a golden SHA-256 vector', async () => {
    expect(await sha256Fingerprint({ a: 1, b: ['x', true, null] }))
      .toBe('sha256:19fb8ce7a758416c9e53d8c73205499a05e0dbd8ecf36912bda14c7699a5afe1')
  })

  it('excludes documented volatile project fields but detects technical changes', async () => {
    const first = { id: 'project', modifiedAt: 'a', case: { diameter: 40 }, presentation: { transientCamera: [1, 2, 3] } }
    const same = { ...first, modifiedAt: 'b', presentation: { transientCamera: [9, 9, 9] } }
    const changed = { ...same, case: { diameter: 41 } }
    expect(await fingerprintTechnicalProject(first)).toBe(await fingerprintTechnicalProject(same))
    expect(await fingerprintTechnicalProject(first)).not.toBe(await fingerprintTechnicalProject(changed))
  })
})
