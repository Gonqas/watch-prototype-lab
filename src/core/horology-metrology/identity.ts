export type MetrologyEntityKind =
  | 'specimen'
  | 'component'
  | 'instrument'
  | 'verification'
  | 'inspection-plan'
  | 'inspection-session'
  | 'observation'
  | 'finding'
  | 'image'
  | 'image-calibration'
  | 'image-annotation'
  | 'measurement-definition'
  | 'measurement-series'
  | 'measurement-reading'
  | 'comparison'
  | 'geometry-proposal'
  | 'object'
  | 'object-reference'
  | 'report'

export interface VersionedMetrologyEntity {
  schemaVersion: 1
  id: string
  createdAt: string
  updatedAt: string
  recordVersion: number
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function canonicalPart(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '').slice(0, 48) || 'record'
}

export function createMetrologyId(kind: MetrologyEntityKind, stableParts: readonly string[]): string {
  if (stableParts.length === 0 || stableParts.some((part) => part.trim().length === 0)) {
    throw new Error('Un ID de metrología requiere partes estables no vacías.')
  }
  const canonical = stableParts.map(canonicalPart).join('.')
  return `metrology.${kind}.${canonical}.${fnv1a(`${kind}|${stableParts.join('|')}`)}`
}

export function assertStableMetrologyId(id: string, kind?: MetrologyEntityKind): void {
  const prefix = kind ? `metrology.${kind}.` : 'metrology.'
  if (!id.startsWith(prefix) || id.length > 240 || /\s/u.test(id)) {
    throw new Error(`ID de metrología inválido: ${id}`)
  }
}

export function stableSerialize(value: unknown): string {
  const normalize = (current: unknown): unknown => {
    if (Array.isArray(current)) return current.map(normalize)
    if (current && typeof current === 'object') {
      return Object.fromEntries(Object.entries(current as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)]))
    }
    return current
  }
  return JSON.stringify(normalize(value))
}
