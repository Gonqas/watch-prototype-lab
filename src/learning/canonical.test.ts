import { describe, expect, it } from 'vitest'
import {
  ProjectEntityIndex,
  createPartInstance,
  deactivatePartInstance,
  deletePartInstance,
  deserializeCanonicalAssembly,
  detectV6PersistenceReasons,
  duplicatePartInstance,
  importCanonicalAssembly,
  replacePartInstance,
  serializeCanonicalAssembly,
  transplantPartInstance,
  updatePartInstance,
  validateCanonicalAssembly,
} from './canonical'
import { createMinimalV6Fixture, createScratchMultibrandFixture } from './fixtures/canonicalFixtures'
import { deterministicCanonicalId } from './identity'

describe('canonical v6 assembly', () => {
  it('validates repeated physical instances and detects every v6 persistence trigger in the fixture', () => {
    const fixture = createMinimalV6Fixture()
    expect(validateCanonicalAssembly(fixture)).toEqual({ valid: true, issues: [] })
    expect(fixture.instances[1].definitionId).toBe(fixture.instances[2].definitionId)
    expect(fixture.instances[1].id).not.toBe(fixture.instances[2].id)
    expect(detectV6PersistenceReasons(fixture)).toEqual(expect.arrayContaining([
      'multiple-instances',
      'explicit-fastener-or-jewel',
      'persisted-interface',
      'assembly-dependency',
      'arbitrary-topology',
    ]))
  })

  it('rejects orphan references, invalid cardinality and dependency cycles', () => {
    const orphan = createMinimalV6Fixture()
    orphan.instances[0].definitionId = deterministicCanonicalId('part-definition', 'canonical-test-1', 'missing')
    expect(validateCanonicalAssembly(orphan).issues.some(({ code }) => code === 'orphan-reference')).toBe(true)

    const cardinality = createMinimalV6Fixture()
    cardinality.interfaces[0].participants.pop()
    expect(validateCanonicalAssembly(cardinality).valid).toBe(false)

    const cyclic = createMinimalV6Fixture()
    cyclic.dependencies.push({
      ...cyclic.dependencies[0],
      id: deterministicCanonicalId('assembly-dependency', 'canonical-test-1', 'reverse'),
      predecessorId: cyclic.dependencies[0].successorId,
      successorId: cyclic.dependencies[0].predecessorId,
    })
    expect(validateCanonicalAssembly(cyclic).issues.some(({ code }) => code === 'dependency-cycle')).toBe(true)
  })

  it('supports the documented lifecycle without silent orphans', () => {
    const at = '2026-07-22T10:00:00.000Z'
    let assembly = createScratchMultibrandFixture()
    const base = assembly.instances[0]
    const createdId = deterministicCanonicalId('part-instance', 'canonical-test-1', 'created')
    assembly = createPartInstance(assembly, { ...base, id: createdId, revision: 1, createdAt: at, modifiedAt: at })
    assembly = updatePartInstance(assembly, createdId, { tags: ['updated'] }, at)
    expect(assembly.instances.find(({ id }) => id === createdId)?.revision).toBe(2)
    assembly = deactivatePartInstance(assembly, createdId, at)
    expect(assembly.instances.find(({ id }) => id === createdId)?.state).toBe('inactive')

    const duplicateId = deterministicCanonicalId('part-instance', 'canonical-test-1', 'duplicate')
    assembly = duplicatePartInstance(assembly, base.id, duplicateId, at)
    expect(assembly.instances.find(({ id }) => id === duplicateId)?.derivedFrom).toBe(base.id)

    const replacementId = deterministicCanonicalId('part-instance', 'canonical-test-1', 'replacement')
    assembly = replacePartInstance(assembly, createdId, { ...base, id: replacementId, revision: 1, createdAt: at, modifiedAt: at }, at)
    expect(assembly.instances.find(({ id }) => id === createdId)?.replacedBy).toBe(replacementId)

    const transplantId = deterministicCanonicalId('part-instance', 'canonical-test-1', 'transplant')
    assembly = transplantPartInstance(assembly, { ...base, id: transplantId, revision: 1, createdAt: at, modifiedAt: at }, { projectId: 'donor', instanceId: 'donor-part' })
    expect(assembly.instances.find(({ id }) => id === transplantId)?.transplantedFrom?.projectId).toBe('donor')

    assembly = deletePartInstance(assembly, createdId, at, 'cascade')
    expect(assembly.instances.find(({ id }) => id === createdId)?.state).toBe('deleted')
    expect(validateCanonicalAssembly(assembly).valid).toBe(true)
  })

  it('rejects destructive deletion by default and resolves semantic selectors explicitly', () => {
    const fixture = createMinimalV6Fixture()
    expect(() => deletePartInstance(fixture, fixture.instances[1].id, '2026-07-22T10:00:00.000Z')).toThrow(/referencias/)
    const cascaded = deletePartInstance(fixture, fixture.instances[1].id, '2026-07-22T10:00:00.000Z', 'cascade')
    expect(cascaded.interfaces).toHaveLength(0)
    expect(cascaded.dependencies).toHaveLength(0)

    const index = new ProjectEntityIndex(fixture)
    expect(index.resolve({ by: 'role', value: 'bridge-screw' }).status).toBe('ambiguous')
    expect(index.resolve({ by: 'tag', value: 'absent' }).status).toBe('missing')
    expect(index.resolve({ by: 'query', all: [{ field: 'category', equals: 'plate' }] }).instanceIds).toEqual([fixture.instances[0].id])
  })

  it('imports, serializes and deserializes without changing IDs', () => {
    const fixture = createMinimalV6Fixture()
    const imported = importCanonicalAssembly(structuredClone(fixture))
    const restored = deserializeCanonicalAssembly(serializeCanonicalAssembly(imported))
    expect(restored).toEqual(fixture)
    expect(restored.instances.map(({ id }) => id)).toEqual(fixture.instances.map(({ id }) => id))
  })
})
