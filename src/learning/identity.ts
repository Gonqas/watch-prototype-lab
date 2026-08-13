export type BrandedId<Name extends string> = string & { readonly __brand: Name }

export type PartDefinitionId = BrandedId<'PartDefinitionId'>
export type PartInstanceId = BrandedId<'PartInstanceId'>
export type AssemblyInterfaceId = BrandedId<'AssemblyInterfaceId'>
export type AssemblyDependencyId = BrandedId<'AssemblyDependencyId'>
export type MovementReferenceId = BrandedId<'MovementReferenceId'>
export type AssemblyId = BrandedId<'AssemblyId'>

export type CanonicalId =
  | PartDefinitionId
  | PartInstanceId
  | AssemblyInterfaceId
  | AssemblyDependencyId
  | MovementReferenceId
  | AssemblyId

export type CanonicalIdKind =
  | 'part-definition'
  | 'part-instance'
  | 'assembly-interface'
  | 'assembly-dependency'
  | 'movement-reference'
  | 'assembly'

const PREFIXES = {
  'part-definition': 'pd',
  'part-instance': 'pi',
  'assembly-interface': 'ai',
  'assembly-dependency': 'ad',
  'movement-reference': 'mr',
  assembly: 'ay',
} as const satisfies Record<CanonicalIdKind, string>

const ID_PATTERN = /^(pd|pi|ai|ad|mr|ay)_[a-z0-9][a-z0-9_-]{5,95}$/

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index))
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(36).padStart(13, '0')
}

export function isCanonicalId(value: string, kind?: CanonicalIdKind): value is CanonicalId {
  if (!ID_PATTERN.test(value)) return false
  return kind === undefined || value.startsWith(`${PREFIXES[kind]}_`)
}

export function assertCanonicalId<Kind extends CanonicalIdKind>(value: string, kind: Kind): IdForKind<Kind> {
  if (!isCanonicalId(value, kind)) throw new Error(`ID canónico inválido para ${kind}: ${value}`)
  return value as IdForKind<Kind>
}

export type IdForKind<Kind extends CanonicalIdKind> =
  Kind extends 'part-definition' ? PartDefinitionId
    : Kind extends 'part-instance' ? PartInstanceId
      : Kind extends 'assembly-interface' ? AssemblyInterfaceId
        : Kind extends 'assembly-dependency' ? AssemblyDependencyId
          : Kind extends 'movement-reference' ? MovementReferenceId
            : AssemblyId

/** Deterministic IDs are for imports/adapters. `namespace` versions their identity algorithm. */
export function deterministicCanonicalId<Kind extends CanonicalIdKind>(
  kind: Kind,
  namespace: string,
  semanticKey: string,
): IdForKind<Kind> {
  const safeNamespace = namespace.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'default'
  return `${PREFIXES[kind]}_${safeNamespace}_${fnv1a64(`${namespace}\u0000${semanticKey}`)}` as IdForKind<Kind>
}

export function stableFingerprint(value: unknown): string {
  return `fnv1a64:${fnv1a64(stableJson(value))}`
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`
}
