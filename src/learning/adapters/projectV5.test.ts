import { describe, expect, it } from 'vitest'
import { createV5ProjectFixture } from '../fixtures/canonicalFixtures'
import { deterministicCanonicalId } from '../identity'
import { detectV6PersistenceReasons } from '../canonical'
import { projectV5ToCanonical, roundTripV5Projection } from './projectV5'

describe('v5 read adapter', () => {
  it('projects without mutation and gives stable semantic IDs', () => {
    const source = createV5ProjectFixture()
    const snapshot = structuredClone(source)
    const first = projectV5ToCanonical(source)
    const renamed = projectV5ToCanonical({ ...source, name: 'Nombre traducido distinto' })
    expect(source).toEqual(snapshot)
    expect(first.id).toBe(renamed.id)
    expect(first.instances.map(({ id }) => id)).toEqual(renamed.instances.map(({ id }) => id))
    expect(first.instances.every(({ persistence }) => persistence === 'synthetic-v5')).toBe(true)
    expect(detectV6PersistenceReasons(first)).toEqual([])
  })

  it('round-trips losslessly while the source remains representable as v5', () => {
    const source = createV5ProjectFixture()
    expect(roundTripV5Projection(source, projectV5ToCanonical(source))).toEqual(source)
  })

  it('detects a persisted v6 interface without upgrading on read', () => {
    const projection = projectV5ToCanonical(createV5ProjectFixture())
    const enhanced = structuredClone(projection)
    enhanced.interfaces.push({
      id: deterministicCanonicalId('assembly-interface', 'adapter-test-1', 'canonical-interface'),
      assemblyId: enhanced.id,
      domain: 'assembly',
      kind: 'explicit-contact',
      participants: [
        { instanceId: enhanced.instances[0].id, interfaceRole: 'first' },
        { instanceId: enhanced.instances[1].id, interfaceRole: 'second' },
      ],
      parameters: {},
      state: 'active',
      persistence: 'canonical',
      provenance: [],
    })
    expect(detectV6PersistenceReasons(enhanced)).toEqual(expect.arrayContaining(['persisted-interface', 'arbitrary-topology']))
  })
})
