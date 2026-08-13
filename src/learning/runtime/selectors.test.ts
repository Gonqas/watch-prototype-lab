import { describe, expect, it } from 'vitest'
import { ProjectEntityIndex } from '../canonical'
import { createMinimalV6Fixture, createMiyota8215SemanticFixture } from '../fixtures/canonicalFixtures'
import { SemanticSelectorResolver } from './selectors'

describe('SemanticSelectorResolver', () => {
  const assembly = createMinimalV6Fixture()
  const resolver = new SemanticSelectorResolver(new ProjectEntityIndex(assembly))

  it('resolves instance, definition, role, subsystem, tag, part type and interface', () => {
    expect(resolver.resolve({ by: 'instance', id: assembly.instances[0].id }, 'exactly-one').entities[0].id).toBe(assembly.instances[0].id)
    expect(resolver.resolve({ by: 'definition', id: assembly.definitions[1].id }, { exact: 2 }).entities).toHaveLength(2)
    expect(resolver.resolve({ by: 'role', value: 'bridge-screw' }, { exact: 2 }).cardinalitySatisfied).toBe(true)
    expect(resolver.resolve({ by: 'subsystem', value: 'movement-structure' }, 'one-or-more').entities).toHaveLength(3)
    expect(resolver.resolve({ by: 'tag', value: 'fixture' }).entities).toHaveLength(3)
    expect(resolver.resolve({ by: 'part-type', value: 'screw' }).entities).toHaveLength(2)
    expect(resolver.resolve({ by: 'interface', id: assembly.interfaces[0].id }, 'exactly-one').entities[0].relatedInstanceIds).toHaveLength(2)
  })

  it('supports bounded all, any, not and declarative predicates', () => {
    const all = resolver.resolve({ by: 'all', selectors: [{ by: 'role', value: 'bridge-screw' }, { by: 'tag', value: 'fixture' }] })
    expect(all.entities).toHaveLength(2)
    const any = resolver.resolve({ by: 'any', selectors: [{ by: 'part-type', value: 'plate' }, { by: 'part-type', value: 'screw' }] })
    expect(any.entities).toHaveLength(3)
    const not = resolver.resolve({ by: 'not', selector: { by: 'part-type', value: 'screw' } })
    expect(not.entities.some(({ id }) => id === assembly.instances[0].id)).toBe(true)
    const query = resolver.resolve({
      by: 'query',
      where: [
        { field: 'category', operator: 'in', values: ['screw'] },
        { field: 'role', operator: 'exists', exists: true },
        { field: 'tags', operator: 'equals', value: 'fixture' },
      ],
    })
    expect(query.entities).toHaveLength(2)
  })

  it('reports zero results and ambiguity/cardinality without unstable ordering', () => {
    const empty = resolver.resolve({ by: 'role', value: 'missing' }, 'exactly-one')
    expect(empty.diagnostics[0].code).toBe('LR-SELECTOR-NO-RESULT')
    const ambiguous = resolver.resolve({ by: 'role', value: 'bridge-screw' }, 'exactly-one')
    expect(ambiguous.diagnostics[0].code).toBe('LR-SELECTOR-CARDINALITY')
    const first = resolver.resolve({ by: 'tag', value: 'fixture' }).entities.map(({ id }) => id)
    const second = resolver.resolve({ by: 'tag', value: 'fixture' }).entities.map(({ id }) => id)
    expect(first).toEqual([...first].sort())
    expect(second).toEqual(first)
  })

  it('resolves assembly, calibre, family and variant as semantic references', () => {
    expect(resolver.resolve({ by: 'assembly', id: assembly.id }, 'exactly-one').entities[0].kind).toBe('assembly')
    const miyota = createMiyota8215SemanticFixture()
    const miyotaResolver = new SemanticSelectorResolver(new ProjectEntityIndex(miyota))
    expect(miyotaResolver.resolve({ by: 'calibre', value: '8215' }, 'exactly-one').entities[0].provenance).not.toHaveLength(0)
    expect(miyotaResolver.resolve({ by: 'family', value: 'Standard Automatic' }, 'exactly-one').cardinalitySatisfied).toBe(true)
    expect(miyotaResolver.resolve({ by: 'variant', value: '8215' }, 'exactly-one').cardinalitySatisfied).toBe(true)
  })
})
