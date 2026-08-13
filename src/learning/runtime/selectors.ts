import { z } from 'zod'
import {
  AssemblyIdSchema,
  AssemblyInterfaceIdSchema,
  PartDefinitionIdSchema,
  PartInstanceIdSchema,
  ProjectEntityIndex,
} from '../canonical'
import type { SourceCitation } from '../sources'
import { diagnostic, type RuntimeDiagnostic } from './diagnostics'

export type SelectorField =
  | 'category'
  | 'classification'
  | 'manufacturer'
  | 'reference'
  | 'role'
  | 'subsystem'
  | 'tags'
  | 'calibre'
  | 'family'
  | 'variant'
  | 'geometryRef'

export type SelectorPredicate =
  | { field: SelectorField; operator: 'equals'; value: string }
  | { field: SelectorField; operator: 'in'; values: string[] }
  | { field: SelectorField; operator: 'exists'; exists: boolean }

export type SemanticSelector =
  | { by: 'instance'; id: import('../identity').PartInstanceId }
  | { by: 'definition'; id: import('../identity').PartDefinitionId }
  | { by: 'role'; value: string }
  | { by: 'subsystem'; value: string }
  | { by: 'calibre'; value: string }
  | { by: 'family'; value: string }
  | { by: 'variant'; value: string }
  | { by: 'interface'; id: import('../identity').AssemblyInterfaceId }
  | { by: 'tag'; value: string }
  | { by: 'part-type'; value: string }
  | { by: 'assembly'; id?: import('../identity').AssemblyId }
  | { by: 'query'; where: SelectorPredicate[] }
  | { by: 'query'; all: Array<{ field: 'category' | 'classification' | 'manufacturer' | 'reference'; equals: string }> }
  | { by: 'all'; selectors: SemanticSelector[] }
  | { by: 'any'; selectors: SemanticSelector[] }
  | { by: 'not'; selector: SemanticSelector }

const token = z.string().min(1).max(160)
const predicateSchema = z.discriminatedUnion('operator', [
  z.object({ field: z.enum(['category', 'classification', 'manufacturer', 'reference', 'role', 'subsystem', 'tags', 'calibre', 'family', 'variant', 'geometryRef']), operator: z.literal('equals'), value: token }).strict(),
  z.object({ field: z.enum(['category', 'classification', 'manufacturer', 'reference', 'role', 'subsystem', 'tags', 'calibre', 'family', 'variant', 'geometryRef']), operator: z.literal('in'), values: z.array(token).min(1).max(50) }).strict(),
  z.object({ field: z.enum(['category', 'classification', 'manufacturer', 'reference', 'role', 'subsystem', 'tags', 'calibre', 'family', 'variant', 'geometryRef']), operator: z.literal('exists'), exists: z.boolean() }).strict(),
])

export const SemanticSelectorSchema: z.ZodType<SemanticSelector> = z.lazy(() => z.union([
  z.object({ by: z.literal('instance'), id: PartInstanceIdSchema }).strict(),
  z.object({ by: z.literal('definition'), id: PartDefinitionIdSchema }).strict(),
  z.object({ by: z.literal('role'), value: token }).strict(),
  z.object({ by: z.literal('subsystem'), value: token }).strict(),
  z.object({ by: z.literal('calibre'), value: token }).strict(),
  z.object({ by: z.literal('family'), value: token }).strict(),
  z.object({ by: z.literal('variant'), value: token }).strict(),
  z.object({ by: z.literal('interface'), id: AssemblyInterfaceIdSchema }).strict(),
  z.object({ by: z.literal('tag'), value: token }).strict(),
  z.object({ by: z.literal('part-type'), value: token }).strict(),
  z.object({ by: z.literal('assembly'), id: AssemblyIdSchema.optional() }).strict(),
  z.object({ by: z.literal('query'), where: z.array(predicateSchema).min(1).max(12) }).strict(),
  z.object({
    by: z.literal('query'),
    all: z.array(z.object({ field: z.enum(['category', 'classification', 'manufacturer', 'reference']), equals: token }).strict()).min(1).max(8),
  }).strict(),
  z.object({ by: z.literal('all'), selectors: z.array(SemanticSelectorSchema).min(1).max(12) }).strict(),
  z.object({ by: z.literal('any'), selectors: z.array(SemanticSelectorSchema).min(1).max(12) }).strict(),
  z.object({ by: z.literal('not'), selector: SemanticSelectorSchema }).strict(),
]))

export type SelectorCardinality = 'exactly-one' | 'one-or-more' | 'zero-or-more' | { exact: number }

export interface SelectorReference {
  selector: SemanticSelector
  cardinality: SelectorCardinality
}

export const SelectorCardinalitySchema = z.union([
  z.enum(['exactly-one', 'one-or-more', 'zero-or-more']),
  z.object({ exact: z.number().int().nonnegative().max(1000) }).strict(),
])

export const SelectorReferenceSchema = z.object({
  selector: SemanticSelectorSchema,
  cardinality: SelectorCardinalitySchema.default('zero-or-more'),
}).strict()

export type ResolvedEntityKind = 'part-instance' | 'part-definition' | 'assembly-interface' | 'movement-reference' | 'assembly'

export interface ResolvedSemanticEntity {
  kind: ResolvedEntityKind
  id: string
  label: string
  relatedInstanceIds: string[]
  provenance: SourceCitation[]
  confidence: 'high' | 'medium' | 'low'
}

export interface SemanticSelectorResolution {
  selector: SemanticSelector
  entities: ResolvedSemanticEntity[]
  omittedEntityIds: string[]
  ambiguities: string[]
  confidence: 'high' | 'medium' | 'low' | 'none'
  diagnostics: RuntimeDiagnostic[]
  cardinality: SelectorCardinality
  cardinalitySatisfied: boolean
}

function entityKey(entity: ResolvedSemanticEntity): string {
  return `${entity.kind}:${entity.id}`
}

function stableEntities(entities: ResolvedSemanticEntity[]): ResolvedSemanticEntity[] {
  return [...new Map(entities.map((entity) => [entityKey(entity), entity])).values()]
    .sort((left, right) => entityKey(left).localeCompare(entityKey(right)))
}

function fieldValues(index: ProjectEntityIndex, instanceId: string, field: SelectorField): string[] {
  const instance = index.assembly.instances.find(({ id }) => id === instanceId)
  if (!instance) return []
  const definition = index.assembly.definitions.find(({ id }) => id === instance.definitionId)
  const movement = index.assembly.movementReferences[0]
  if (field === 'role') return instance.role ? [instance.role] : []
  if (field === 'subsystem') return instance.subsystem ? [instance.subsystem] : []
  if (field === 'tags') return [...instance.tags, ...(definition?.tags ?? [])]
  if (field === 'geometryRef') return instance.geometryRef ? [instance.geometryRef] : []
  if (field === 'category') return definition ? [definition.category] : []
  if (field === 'classification') return definition ? [definition.classification] : []
  if (field === 'manufacturer') return definition?.manufacturer ? [definition.manufacturer] : []
  if (field === 'reference') return definition?.reference ? [definition.reference] : []
  if (field === 'calibre') return movement ? [movement.calibre] : []
  const fact = movement?.facts[field]
  return typeof fact === 'string' ? [fact] : []
}

function predicateMatches(index: ProjectEntityIndex, instanceId: string, predicate: SelectorPredicate): boolean {
  const values = fieldValues(index, instanceId, predicate.field)
  if (predicate.operator === 'exists') return predicate.exists ? values.length > 0 : values.length === 0
  if (predicate.operator === 'equals') return values.includes(predicate.value)
  return values.some((value) => predicate.values.includes(value))
}

export class SemanticSelectorResolver {
  private readonly index: ProjectEntityIndex

  constructor(index: ProjectEntityIndex) { this.index = index }

  resolve(selector: SemanticSelector, cardinality: SelectorCardinality = 'zero-or-more'): SemanticSelectorResolution {
    const omitted = this.index.assembly.instances.filter(({ state }) => state === 'deleted').map(({ id }) => id).sort()
    const entities = stableEntities(this.resolveEntities(selector))
    const cardinalitySatisfied = cardinalityMatches(entities.length, cardinality)
    const diagnostics: RuntimeDiagnostic[] = []
    if (entities.length === 0 && cardinality !== 'zero-or-more' && !(typeof cardinality === 'object' && cardinality.exact === 0)) {
      diagnostics.push(diagnostic({
        code: 'LR-SELECTOR-NO-RESULT', category: 'selector-empty', message: 'El selector no encontró entidades.', source: 'selector',
        selector, suggestedRecovery: 'Revisar el proyecto, la variante o declarar una cardinalidad que admita cero resultados.', blocking: true, retrySafe: true,
      }))
    } else if (!cardinalitySatisfied) {
      diagnostics.push(diagnostic({
        code: 'LR-SELECTOR-CARDINALITY', category: 'selector-ambiguous',
        message: `El selector encontró ${entities.length} entidades y no cumple ${cardinalityLabel(cardinality)}.`, source: 'selector', selector,
        suggestedRecovery: 'Hacer el selector más específico o corregir su cardinalidad.', blocking: true, retrySafe: true,
      }))
    }
    const confidence = entities.length === 0 ? 'none' : entities.some(({ confidence }) => confidence === 'low') ? 'low' : entities.some(({ confidence }) => confidence === 'medium') ? 'medium' : 'high'
    return {
      selector,
      entities,
      omittedEntityIds: omitted,
      ambiguities: cardinalitySatisfied ? [] : entities.map(({ id }) => id),
      confidence,
      diagnostics,
      cardinality,
      cardinalitySatisfied,
    }
  }

  private resolveEntities(selector: SemanticSelector): ResolvedSemanticEntity[] {
    if (selector.by === 'all' || selector.by === 'any') {
      const groups = selector.selectors.map((item) => this.resolveEntities(item))
      if (selector.by === 'any') return groups.flat()
      const [first = [], ...rest] = groups
      const allowed = rest.map((group) => new Set(group.map(entityKey)))
      return first.filter((entity) => allowed.every((keys) => keys.has(entityKey(entity))))
    }
    if (selector.by === 'not') {
      const excluded = new Set(this.resolveEntities(selector.selector).map(entityKey))
      return this.allEntities().filter((entity) => !excluded.has(entityKey(entity)))
    }
    if (selector.by === 'assembly') {
      const assembly = this.index.assembly
      if (selector.id && selector.id !== assembly.id) return []
      return [{ kind: 'assembly', id: assembly.id, label: assembly.name, relatedInstanceIds: assembly.instances.filter(({ state }) => state !== 'deleted').map(({ id }) => id), provenance: [], confidence: 'high' }]
    }
    if (selector.by === 'interface') {
      const connection = this.index.assembly.interfaces.find(({ id }) => id === selector.id)
      return connection ? [{ kind: 'assembly-interface', id: connection.id, label: connection.kind, relatedInstanceIds: connection.participants.map(({ instanceId }) => instanceId), provenance: connection.provenance, confidence: 'high' }] : []
    }
    if (selector.by === 'calibre' || selector.by === 'family' || selector.by === 'variant') {
      return this.index.assembly.movementReferences.filter((movement) => {
        if (selector.by === 'calibre') return movement.calibre === selector.value
        return movement.facts[selector.by] === selector.value
      }).map((movement) => ({
        kind: 'movement-reference' as const,
        id: movement.id,
        label: `${movement.manufacturer} ${movement.calibre}`,
        relatedInstanceIds: this.index.assembly.instances.filter(({ state }) => state !== 'deleted').map(({ id }) => id),
        provenance: movement.provenance,
        confidence: movement.classification === 'known' ? 'high' as const : 'low' as const,
      }))
    }
    const instances = this.index.assembly.instances.filter(({ state }) => state !== 'deleted').filter((instance) => {
      const definition = this.index.assembly.definitions.find(({ id }) => id === instance.definitionId)
      if (selector.by === 'instance') return instance.id === selector.id
      if (selector.by === 'definition') return instance.definitionId === selector.id
      if (selector.by === 'role') return instance.role === selector.value || definition?.roles.includes(selector.value)
      if (selector.by === 'subsystem') return instance.subsystem === selector.value || definition?.subsystems.includes(selector.value)
      if (selector.by === 'tag') return instance.tags.includes(selector.value) || definition?.tags.includes(selector.value)
      if (selector.by === 'part-type') return definition?.category === selector.value
      if (selector.by === 'query') {
        const predicates: SelectorPredicate[] = 'where' in selector
          ? selector.where
          : selector.all.map(({ field, equals }) => ({ field, operator: 'equals' as const, value: equals }))
        return predicates.every((predicate) => predicateMatches(this.index, instance.id, predicate))
      }
      return false
    })
    return instances.map((instance) => {
      const definition = this.index.assembly.definitions.find(({ id }) => id === instance.definitionId)
      return {
        kind: 'part-instance' as const,
        id: instance.id,
        label: definition?.name ?? instance.id,
        relatedInstanceIds: [instance.id],
        provenance: definition?.provenance ?? [],
        confidence: definition?.classification === 'known' ? 'high' as const : 'low' as const,
      }
    })
  }

  private allEntities(): ResolvedSemanticEntity[] {
    const assembly = this.index.assembly
    return [
      ...assembly.instances.filter(({ state }) => state !== 'deleted').map((instance) => {
        const definition = assembly.definitions.find(({ id }) => id === instance.definitionId)
        return { kind: 'part-instance' as const, id: instance.id, label: definition?.name ?? instance.id, relatedInstanceIds: [instance.id], provenance: definition?.provenance ?? [], confidence: definition?.classification === 'known' ? 'high' as const : 'low' as const }
      }),
      ...assembly.interfaces.map((connection) => ({ kind: 'assembly-interface' as const, id: connection.id, label: connection.kind, relatedInstanceIds: connection.participants.map(({ instanceId }) => instanceId), provenance: connection.provenance, confidence: 'high' as const })),
      ...assembly.movementReferences.map((movement) => ({ kind: 'movement-reference' as const, id: movement.id, label: `${movement.manufacturer} ${movement.calibre}`, relatedInstanceIds: assembly.instances.map(({ id }) => id), provenance: movement.provenance, confidence: movement.classification === 'known' ? 'high' as const : 'low' as const })),
      { kind: 'assembly' as const, id: assembly.id, label: assembly.name, relatedInstanceIds: assembly.instances.map(({ id }) => id), provenance: [], confidence: 'high' as const },
    ]
  }
}

function cardinalityMatches(count: number, cardinality: SelectorCardinality): boolean {
  if (cardinality === 'zero-or-more') return true
  if (cardinality === 'one-or-more') return count >= 1
  if (cardinality === 'exactly-one') return count === 1
  return count === cardinality.exact
}

function cardinalityLabel(cardinality: SelectorCardinality): string {
  if (typeof cardinality === 'object') return `exactamente ${cardinality.exact}`
  return cardinality
}
