export interface CanonicalSerializationOptions {
  excludedPaths?: Iterable<string>
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error('La serialización canónica no admite NaN ni infinito.')
  if (Object.is(value, -0)) return '0'
  return JSON.stringify(value)
}

function serialize(value: unknown, path: string, excluded: ReadonlySet<string>): string | undefined {
  if (excluded.has(path)) return undefined
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return canonicalNumber(value)
  if (typeof value === 'string') return JSON.stringify(value.normalize('NFC'))
  if (Array.isArray(value)) {
    return `[${value.map((entry, index) => serialize(entry, `${path}[${index}]`, excluded) ?? 'null').join(',')}]`
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const entries = Object.keys(record).sort().flatMap((key) => {
      const childPath = path ? `${path}.${key}` : key
      const child = serialize(record[key], childPath, excluded)
      return child === undefined ? [] : [`${JSON.stringify(key.normalize('NFC'))}:${child}`]
    })
    return `{${entries.join(',')}}`
  }
  if (value === undefined) return undefined
  throw new Error(`Tipo no serializable canónicamente: ${typeof value}.`)
}

export function canonicalJson(value: unknown, options: CanonicalSerializationOptions = {}): string {
  const serialized = serialize(value, '', new Set(options.excludedPaths ?? []))
  if (serialized === undefined) throw new Error('El valor raíz fue excluido o es undefined.')
  return serialized
}

export async function sha256Fingerprint(value: unknown, options: CanonicalSerializationOptions = {}): Promise<`sha256:${string}`> {
  const bytes = new TextEncoder().encode(canonicalJson(value, options))
  return sha256BytesFingerprint(bytes)
}

export async function sha256BytesFingerprint(bytes: Uint8Array): Promise<`sha256:${string}`> {
  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const digest = await crypto.subtle.digest('SHA-256', source)
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `sha256:${hex}`
}

export const TECHNICAL_PROJECT_FINGERPRINT_EXCLUSIONS = [
  'modifiedAt',
  'presentation.transientCamera',
  'presentation.lastViewport',
] as const

export function fingerprintTechnicalProject(project: unknown): Promise<`sha256:${string}`> {
  return sha256Fingerprint(project, { excludedPaths: TECHNICAL_PROJECT_FINGERPRINT_EXCLUSIONS })
}

export function fingerprintCanonicalProjection(projection: unknown): Promise<`sha256:${string}`> {
  return sha256Fingerprint(projection, { excludedPaths: ['generatedAt'] })
}

export function fingerprintPackage(bytes: Uint8Array): Promise<`sha256:${string}`> {
  return sha256BytesFingerprint(bytes)
}

export function fingerprintActivity(activity: unknown): Promise<`sha256:${string}`> {
  return sha256Fingerprint(activity)
}

export function fingerprintRubric(rubric: unknown): Promise<`sha256:${string}`> {
  return sha256Fingerprint(rubric)
}

export function fingerprintAssessmentInputs(inputs: unknown): Promise<`sha256:${string}`> {
  return sha256Fingerprint(inputs)
}
