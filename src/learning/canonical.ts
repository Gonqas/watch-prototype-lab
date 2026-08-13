import { z } from 'zod'
import type { WatchProject } from '../vnext/model'
import { FidelityProfileSchema } from './fidelity'
import {
  isCanonicalId,
  type AssemblyDependencyId,
  type AssemblyId,
  type AssemblyInterfaceId,
  type MovementReferenceId,
  type PartDefinitionId,
  type PartInstanceId,
} from './identity'
import { SourceCitationSchema } from './sources'

const canonicalIdSchema = <Id extends string>(kind: Parameters<typeof isCanonicalId>[1]) =>
  z.custom<Id>((value) => typeof value === 'string' && isCanonicalId(value, kind), `ID ${kind} inválido`)

export const PartDefinitionIdSchema = canonicalIdSchema<PartDefinitionId>('part-definition')
export const PartInstanceIdSchema = canonicalIdSchema<PartInstanceId>('part-instance')
export const AssemblyInterfaceIdSchema = canonicalIdSchema<AssemblyInterfaceId>('assembly-interface')
export const AssemblyDependencyIdSchema = canonicalIdSchema<AssemblyDependencyId>('assembly-dependency')
export const MovementReferenceIdSchema = canonicalIdSchema<MovementReferenceId>('movement-reference')
export const AssemblyIdSchema = canonicalIdSchema<AssemblyId>('assembly')

const openToken = z.string().regex(/^[a-z0-9][a-z0-9._:-]*$/).max(120)

export const PartDefinitionSchema = z.object({
  id: PartDefinitionIdSchema,
  category: openToken,
  classification: z.enum(['known', 'placeholder', 'unknown']),
  name: z.string().min(1).max(240),
  manufacturer: z.string().min(1).max(160).optional(),
  reference: z.string().min(1).max(160).optional(),
  roles: z.array(openToken).default([]),
  subsystems: z.array(openToken).default([]),
  tags: z.array(openToken).default([]),
  provenance: z.array(SourceCitationSchema).default([]),
  fidelity: FidelityProfileSchema.optional(),
}).strict()
export type PartDefinition = z.infer<typeof PartDefinitionSchema>

export const PartInstanceSchema = z.object({
  id: PartInstanceIdSchema,
  definitionId: PartDefinitionIdSchema,
  assemblyId: AssemblyIdSchema,
  state: z.enum(['active', 'inactive', 'replaced', 'deleted']),
  persistence: z.enum(['canonical', 'synthetic-v5']),
  revision: z.number().int().positive(),
  createdAt: z.string().min(10),
  modifiedAt: z.string().min(10),
  replacedBy: PartInstanceIdSchema.optional(),
  derivedFrom: PartInstanceIdSchema.optional(),
  transplantedFrom: z.object({ projectId: z.string().min(1), instanceId: z.string().min(1) }).strict().optional(),
  role: openToken.optional(),
  subsystem: openToken.optional(),
  tags: z.array(openToken).default([]),
  geometryRef: z.string().min(1).max(500).optional(),
}).strict()
export type PartInstance = z.infer<typeof PartInstanceSchema>

export const MovementReferenceSchema = z.object({
  id: MovementReferenceIdSchema,
  manufacturer: z.string().min(1).max(160),
  calibre: z.string().min(1).max(80),
  mechanism: openToken,
  classification: z.enum(['known', 'placeholder', 'unknown']),
  facts: z.record(z.string(), z.unknown()).default({}),
  provenance: z.array(SourceCitationSchema).default([]),
  fidelity: FidelityProfileSchema.optional(),
}).strict()
export type MovementReference = z.infer<typeof MovementReferenceSchema>

export const AssemblyInterfaceSchema = z.object({
  id: AssemblyInterfaceIdSchema,
  assemblyId: AssemblyIdSchema,
  domain: z.enum(['assembly', 'geometry', 'kinematics', 'energy', 'electrical']),
  kind: openToken,
  participants: z.array(z.object({
    instanceId: PartInstanceIdSchema,
    interfaceRole: openToken,
  }).strict()).min(2),
  parameters: z.record(z.string(), z.unknown()).default({}),
  state: z.enum(['active', 'inactive']),
  persistence: z.enum(['canonical', 'synthetic-v5']),
  provenance: z.array(SourceCitationSchema).default([]),
}).strict()
export type AssemblyInterface = z.infer<typeof AssemblyInterfaceSchema>

export const AssemblyDependencySchema = z.object({
  id: AssemblyDependencyIdSchema,
  assemblyId: AssemblyIdSchema,
  predecessorId: PartInstanceIdSchema,
  successorId: PartInstanceIdSchema,
  severity: z.enum(['required', 'recommended', 'contextual']),
  motive: z.string().min(1).max(1000),
  tools: z.array(z.string().min(1).max(160)).default([]),
  preconditions: z.array(z.string().min(1).max(500)).default([]),
  risks: z.array(z.string().min(1).max(500)).default([]),
  persistence: z.enum(['canonical', 'synthetic-v5']),
}).strict().superRefine((dependency, context) => {
  if (dependency.predecessorId === dependency.successorId) {
    context.addIssue({ code: 'custom', path: ['successorId'], message: 'Una dependencia no puede apuntar a sí misma.' })
  }
})
export type AssemblyDependency = z.infer<typeof AssemblyDependencySchema>

export const CanonicalAssemblySchema = z.object({
  schemaVersion: z.literal(6),
  id: AssemblyIdSchema,
  name: z.string().min(1).max(240),
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('native-v6') }).strict(),
    z.object({
      kind: z.literal('v5-projection'),
      adapterVersion: z.literal('v5-projection-1'),
      projectFingerprint: z.string().min(1),
    }).strict(),
  ]),
  definitions: z.array(PartDefinitionSchema),
  instances: z.array(PartInstanceSchema),
  interfaces: z.array(AssemblyInterfaceSchema),
  dependencies: z.array(AssemblyDependencySchema),
  movementReferences: z.array(MovementReferenceSchema),
}).strict()
export type CanonicalAssembly = z.infer<typeof CanonicalAssemblySchema>

export type WatchProjectV6 = Omit<WatchProject, 'schemaVersion'> & {
  schemaVersion: 6
  canonicalAssembly: CanonicalAssembly
}

export interface CanonicalValidationIssue {
  code: 'duplicate-id' | 'orphan-reference' | 'dependency-cycle' | 'assembly-mismatch' | 'invalid-state'
  path: string
  message: string
}

export interface CanonicalValidationResult {
  valid: boolean
  issues: CanonicalValidationIssue[]
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) (seen.has(value) ? repeated : seen).add(value)
  return [...repeated].sort()
}

export function validateCanonicalAssembly(input: unknown): CanonicalValidationResult {
  const parsed = CanonicalAssemblySchema.safeParse(input)
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        code: 'invalid-state',
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }
  }
  const assembly = parsed.data
  const issues: CanonicalValidationIssue[] = []
  const allIds = [
    assembly.id,
    ...assembly.definitions.map(({ id }) => id),
    ...assembly.instances.map(({ id }) => id),
    ...assembly.interfaces.map(({ id }) => id),
    ...assembly.dependencies.map(({ id }) => id),
    ...assembly.movementReferences.map(({ id }) => id),
  ]
  for (const id of duplicates(allIds)) issues.push({ code: 'duplicate-id', path: id, message: `ID duplicado: ${id}` })

  const definitionIds = new Set(assembly.definitions.map(({ id }) => id))
  const instanceIds = new Set(assembly.instances.map(({ id }) => id))
  for (const instance of assembly.instances) {
    if (instance.assemblyId !== assembly.id) issues.push({ code: 'assembly-mismatch', path: instance.id, message: 'La instancia pertenece a otro ensamblaje.' })
    if (!definitionIds.has(instance.definitionId)) issues.push({ code: 'orphan-reference', path: instance.id, message: `Definición ausente: ${instance.definitionId}` })
    if (instance.replacedBy && !instanceIds.has(instance.replacedBy)) issues.push({ code: 'orphan-reference', path: instance.id, message: `Sustitución ausente: ${instance.replacedBy}` })
    if (instance.derivedFrom && !instanceIds.has(instance.derivedFrom)) issues.push({ code: 'orphan-reference', path: instance.id, message: `Origen ausente: ${instance.derivedFrom}` })
  }
  for (const relation of [...assembly.interfaces, ...assembly.dependencies]) {
    if (relation.assemblyId !== assembly.id) issues.push({ code: 'assembly-mismatch', path: relation.id, message: 'La relación pertenece a otro ensamblaje.' })
  }
  for (const connection of assembly.interfaces) {
    for (const participant of connection.participants) {
      if (!instanceIds.has(participant.instanceId)) issues.push({ code: 'orphan-reference', path: connection.id, message: `Participante ausente: ${participant.instanceId}` })
    }
  }
  for (const dependency of assembly.dependencies) {
    for (const instanceId of [dependency.predecessorId, dependency.successorId]) {
      if (!instanceIds.has(instanceId)) issues.push({ code: 'orphan-reference', path: dependency.id, message: `Instancia ausente: ${instanceId}` })
    }
  }
  if (hasDependencyCycle(assembly.dependencies)) issues.push({ code: 'dependency-cycle', path: 'dependencies', message: 'Las dependencias contienen un ciclo.' })
  return { valid: issues.length === 0, issues }
}

function hasDependencyCycle(dependencies: AssemblyDependency[]): boolean {
  const outgoing = new Map<string, string[]>()
  for (const dependency of dependencies) {
    const targets = outgoing.get(dependency.predecessorId) ?? []
    targets.push(dependency.successorId)
    outgoing.set(dependency.predecessorId, targets)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const target of outgoing.get(id) ?? []) if (visit(target)) return true
    visiting.delete(id)
    visited.add(id)
    return false
  }
  return [...outgoing.keys()].some(visit)
}

function assertValid(assembly: CanonicalAssembly): CanonicalAssembly {
  const validation = validateCanonicalAssembly(assembly)
  if (!validation.valid) throw new Error(validation.issues.map(({ message }) => message).join(' '))
  return assembly
}

export function createPartInstance(assembly: CanonicalAssembly, instance: PartInstance): CanonicalAssembly {
  if (assembly.instances.some(({ id }) => id === instance.id)) throw new Error(`La instancia ya existe: ${instance.id}`)
  return assertValid({ ...assembly, instances: [...assembly.instances, instance] })
}

export function updatePartInstance(
  assembly: CanonicalAssembly,
  id: PartInstanceId,
  changes: Partial<Pick<PartInstance, 'role' | 'subsystem' | 'tags' | 'geometryRef'>>,
  modifiedAt: string,
): CanonicalAssembly {
  let found = false
  const instances = assembly.instances.map((instance) => {
    if (instance.id !== id) return instance
    found = true
    return { ...instance, ...changes, revision: instance.revision + 1, modifiedAt }
  })
  if (!found) throw new Error(`Instancia ausente: ${id}`)
  return assertValid({ ...assembly, instances })
}

export function deactivatePartInstance(assembly: CanonicalAssembly, id: PartInstanceId, modifiedAt: string): CanonicalAssembly {
  return changeInstanceState(assembly, id, 'inactive', modifiedAt)
}

export function duplicatePartInstance(
  assembly: CanonicalAssembly,
  sourceId: PartInstanceId,
  newId: PartInstanceId,
  at: string,
): CanonicalAssembly {
  const source = requireInstance(assembly, sourceId)
  return createPartInstance(assembly, {
    ...source,
    id: newId,
    state: 'active',
    persistence: 'canonical',
    revision: 1,
    createdAt: at,
    modifiedAt: at,
    derivedFrom: source.id,
    replacedBy: undefined,
  })
}

export function replacePartInstance(
  assembly: CanonicalAssembly,
  oldId: PartInstanceId,
  replacement: PartInstance,
  at: string,
): CanonicalAssembly {
  requireInstance(assembly, oldId)
  const withReplacement = createPartInstance(assembly, { ...replacement, derivedFrom: oldId })
  const instances = withReplacement.instances.map((instance) => instance.id === oldId
    ? { ...instance, state: 'replaced' as const, replacedBy: replacement.id, revision: instance.revision + 1, modifiedAt: at }
    : instance)
  return assertValid({ ...withReplacement, instances })
}

export function transplantPartInstance(
  assembly: CanonicalAssembly,
  instance: PartInstance,
  source: { projectId: string; instanceId: string },
): CanonicalAssembly {
  return createPartInstance(assembly, { ...instance, persistence: 'canonical', transplantedFrom: source })
}

export function deletePartInstance(
  assembly: CanonicalAssembly,
  id: PartInstanceId,
  modifiedAt: string,
  orphanPolicy: 'reject' | 'cascade' = 'reject',
): CanonicalAssembly {
  requireInstance(assembly, id)
  const hasReferences = assembly.interfaces.some(({ participants }) => participants.some(({ instanceId }) => instanceId === id))
    || assembly.dependencies.some(({ predecessorId, successorId }) => predecessorId === id || successorId === id)
    || assembly.instances.some(({ replacedBy, derivedFrom }) => replacedBy === id || derivedFrom === id)
  if (hasReferences && orphanPolicy === 'reject') throw new Error(`No se puede borrar ${id}: conserva referencias.`)
  const instances = assembly.instances.map((instance) => {
    if (instance.id === id) return { ...instance, state: 'deleted' as const, revision: instance.revision + 1, modifiedAt }
    if (orphanPolicy !== 'cascade') return instance
    return {
      ...instance,
      replacedBy: instance.replacedBy === id ? undefined : instance.replacedBy,
      derivedFrom: instance.derivedFrom === id ? undefined : instance.derivedFrom,
    }
  })
  return assertValid({
    ...assembly,
    instances,
    interfaces: orphanPolicy === 'cascade'
      ? assembly.interfaces.filter(({ participants }) => !participants.some(({ instanceId }) => instanceId === id))
      : assembly.interfaces,
    dependencies: orphanPolicy === 'cascade'
      ? assembly.dependencies.filter(({ predecessorId, successorId }) => predecessorId !== id && successorId !== id)
      : assembly.dependencies,
  })
}

function changeInstanceState(assembly: CanonicalAssembly, id: PartInstanceId, state: PartInstance['state'], modifiedAt: string): CanonicalAssembly {
  let found = false
  const instances = assembly.instances.map((instance) => {
    if (instance.id !== id) return instance
    found = true
    return { ...instance, state, revision: instance.revision + 1, modifiedAt }
  })
  if (!found) throw new Error(`Instancia ausente: ${id}`)
  return assertValid({ ...assembly, instances })
}

function requireInstance(assembly: CanonicalAssembly, id: PartInstanceId): PartInstance {
  const instance = assembly.instances.find((candidate) => candidate.id === id)
  if (!instance) throw new Error(`Instancia ausente: ${id}`)
  return instance
}

export type EntitySelector =
  | { by: 'instance'; id: PartInstanceId }
  | { by: 'definition'; id: PartDefinitionId }
  | { by: 'role'; value: string }
  | { by: 'subsystem'; value: string }
  | { by: 'calibre'; value: string }
  | { by: 'interface'; id: AssemblyInterfaceId }
  | { by: 'tag'; value: string }
  | { by: 'query'; all: Array<{ field: 'category' | 'classification' | 'manufacturer' | 'reference'; equals: string }> }

export interface EntityResolution {
  status: 'resolved' | 'missing' | 'ambiguous' | 'unsupported'
  instanceIds: PartInstanceId[]
  interfaceIds: AssemblyInterfaceId[]
}

export class ProjectEntityIndex {
  readonly assembly: CanonicalAssembly
  private readonly definitions: Map<PartDefinitionId, PartDefinition>

  constructor(assembly: CanonicalAssembly) {
    const validation = validateCanonicalAssembly(assembly)
    if (!validation.valid) throw new Error(validation.issues.map(({ message }) => message).join(' '))
    this.assembly = assembly
    this.definitions = new Map(assembly.definitions.map((definition) => [definition.id, definition]))
  }

  resolve(selector: EntitySelector): EntityResolution {
    if (selector.by === 'interface') {
      const connection = this.assembly.interfaces.find(({ id }) => id === selector.id)
      return result(connection?.participants.map(({ instanceId }) => instanceId) ?? [], connection ? [connection.id] : [])
    }
    let instances: PartInstance[]
    if (selector.by === 'instance') instances = this.assembly.instances.filter(({ id }) => id === selector.id)
    else if (selector.by === 'definition') instances = this.assembly.instances.filter(({ definitionId }) => definitionId === selector.id)
    else if (selector.by === 'role') instances = this.assembly.instances.filter(({ role }) => role === selector.value)
    else if (selector.by === 'subsystem') instances = this.assembly.instances.filter(({ subsystem }) => subsystem === selector.value)
    else if (selector.by === 'tag') instances = this.assembly.instances.filter(({ tags }) => tags.includes(selector.value))
    else if (selector.by === 'calibre') {
      const known = this.assembly.movementReferences.some(({ calibre }) => calibre === selector.value)
      instances = known ? this.assembly.instances : []
    } else if (selector.by === 'query') {
      instances = this.assembly.instances.filter((instance) => {
        const definition = this.definitions.get(instance.definitionId)
        return definition !== undefined && selector.all.every(({ field, equals }) => definition[field] === equals)
      })
    } else return { status: 'unsupported', instanceIds: [], interfaceIds: [] }
    return result(instances.filter(({ state }) => state !== 'deleted').map(({ id }) => id), [])
  }
}

function result(instanceIds: PartInstanceId[], interfaceIds: AssemblyInterfaceId[]): EntityResolution {
  const count = instanceIds.length + interfaceIds.length
  return { status: count === 0 ? 'missing' : count === 1 ? 'resolved' : 'ambiguous', instanceIds, interfaceIds }
}

export type V6PersistenceReason =
  | 'multiple-instances'
  | 'explicit-fastener-or-jewel'
  | 'persisted-interface'
  | 'assembly-dependency'
  | 'arbitrary-topology'
  | 'additional-part'
  | 'external-geometry-reference'

const V5_CATEGORIES = new Set([
  'case', 'back', 'bezel', 'rehaut', 'strap', 'clasp', 'spring-bar', 'dial-graphics', 'movement', 'plate',
  'bridge', 'barrel', 'center-wheel', 'third-wheel', 'fourth-wheel', 'escape-wheel', 'balance', 'pallet',
  'hairspring', 'mainspring', 'jewel-set', 'keyless', 'rotor', 'dial', 'hour-hand', 'minute-hand', 'second-hand',
  'crystal', 'stem', 'crown', 'holder', 'gasket',
])

export function detectV6PersistenceReasons(assembly: CanonicalAssembly): V6PersistenceReason[] {
  const reasons = new Set<V6PersistenceReason>()
  const definitionCounts = new Map<PartDefinitionId, number>()
  const relevantInstances = assembly.source.kind === 'v5-projection'
    ? assembly.instances.filter(({ persistence, state }) => persistence === 'canonical' && state !== 'deleted')
    : assembly.instances.filter(({ state }) => state !== 'deleted')
  for (const instance of relevantInstances) {
    definitionCounts.set(instance.definitionId, (definitionCounts.get(instance.definitionId) ?? 0) + 1)
    if (instance.geometryRef) reasons.add('external-geometry-reference')
  }
  if ([...definitionCounts.values()].some((count) => count > 1)) reasons.add('multiple-instances')
  const relevantDefinitions = assembly.source.kind === 'v5-projection'
    ? assembly.definitions.filter(({ tags }) => !tags.includes('legacy-v5'))
    : assembly.definitions
  if (relevantDefinitions.some(({ category }) => category === 'screw' || category === 'jewel')) reasons.add('explicit-fastener-or-jewel')
  if (assembly.interfaces.some(({ persistence }) => persistence === 'canonical')) reasons.add('persisted-interface')
  if (assembly.dependencies.length > 0) reasons.add('assembly-dependency')
  if (relevantDefinitions.some(({ category }) => !V5_CATEGORIES.has(category))) reasons.add('additional-part')
  const hasCanonicalTopology = relevantInstances.length > relevantDefinitions.length
    || assembly.interfaces.some(({ persistence }) => persistence === 'canonical')
    || assembly.dependencies.some(({ persistence }) => persistence === 'canonical')
  if (hasCanonicalTopology) reasons.add('arbitrary-topology')
  return [...reasons].sort()
}

export function serializeCanonicalAssembly(assembly: CanonicalAssembly): string {
  assertValid(assembly)
  return JSON.stringify(assembly)
}

export function deserializeCanonicalAssembly(serialized: string): CanonicalAssembly {
  const parsed = JSON.parse(serialized) as unknown
  const assembly = CanonicalAssemblySchema.parse(parsed)
  return assertValid(assembly)
}

export function importCanonicalAssembly(input: unknown): CanonicalAssembly {
  const assembly = CanonicalAssemblySchema.parse(input)
  return assertValid(assembly)
}
