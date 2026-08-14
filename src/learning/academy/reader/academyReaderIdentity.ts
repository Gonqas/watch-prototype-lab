import type { AcademyReaderDocument, AcademyReaderDocumentIdentity } from './academyReaderModel'

export function academyReaderStableHash(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (const character of new TextEncoder().encode(value.replaceAll('\r\n', '\n'))) {
    hash ^= BigInt(character)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return `fnv1a64:${hash.toString(16).padStart(16, '0')}`
}

export function academyReaderShortDocumentVersion(identity: Omit<AcademyReaderDocumentIdentity, 'schemaVersion'>): string {
  return `reader-v1:${academyReaderStableHash([
    identity.contentHash,
    identity.structureHash,
    identity.compatibilityVersion,
  ].join('|')).slice('fnv1a64:'.length)}`
}

export function academyReaderDocumentVersionMatches(
  document: AcademyReaderDocument,
  savedVersion: string | undefined,
): boolean {
  if (!savedVersion) return false
  return savedVersion === document.documentVersion
    || savedVersion === document.identity?.legacyDocumentVersion
    || savedVersion === document.identity?.diagnosticSignature
}

export function academyReaderPayloadHash(value: unknown): string {
  return academyReaderStableHash(JSON.stringify(value))
}
