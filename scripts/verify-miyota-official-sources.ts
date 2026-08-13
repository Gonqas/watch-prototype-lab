import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  MIYOTA_OFFICIAL_SOURCE_REGISTRY,
  compareOfficialDocumentObservation,
  type OfficialDocumentRecord,
  type OfficialRemoteObservation,
} from '../src/learning/technical/officialSources'

const DEFAULT_CACHE_DIR = path.join(process.cwd(), 'tmp', 'miyota-official-sources')
const MAX_RESPONSE_BYTES = 30 * 1024 * 1024
const ALLOWED_CALIBRES = new Set(['2035', '8215'])
const OFFICIAL_HOST = 'miyotamovement.com'

type CliOptions = {
  cacheDir: string
  calibre?: string
  documentType?: OfficialDocumentRecord['documentType']
  offline: boolean
  json: boolean
}

type VerificationResult = {
  id: string
  url: string
  status: 'verified' | 'drift' | 'unbaselined' | 'error'
  observation?: OfficialRemoteObservation
  cachePath?: string
  differences: string[]
  error?: string
}

function parseOptions(arguments_: string[]): CliOptions {
  const options: CliOptions = {
    cacheDir: DEFAULT_CACHE_DIR,
    offline: false,
    json: false,
  }

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    if (argument === '--offline') options.offline = true
    else if (argument === '--json') options.json = true
    else if (argument === '--cache-dir') options.cacheDir = path.resolve(arguments_[++index] ?? '')
    else if (argument === '--calibre') options.calibre = arguments_[++index]
    else if (argument === '--document') {
      options.documentType = arguments_[++index] as OfficialDocumentRecord['documentType']
    } else if (argument === '--help') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Argumento desconocido: ${argument}`)
    }
  }

  if (options.calibre && !ALLOWED_CALIBRES.has(options.calibre)) {
    throw new Error(`Calibre fuera del alcance curado: ${options.calibre}. Solo se permiten 2035 y 8215.`)
  }
  return options
}

function printHelp(): void {
  process.stdout.write(`Verifica exclusivamente las fuentes oficiales curadas de MIYOTA 2035 y 8215.

Uso:
  npm run learning:miyota-sources:verify
  npm run learning:miyota-sources:verify -- --calibre 2035
  npm run learning:miyota-sources:verify -- --calibre 8215 --document drawing
  npm run learning:miyota-sources:verify -- --offline
  npm run learning:miyota-sources:verify -- --json

Opciones:
  --calibre <2035|8215>       Restringe la verificación a un calibre.
  --document <tipo>           Restringe a un tipo documental registrado.
  --cache-dir <ruta>          Caché privada; por defecto tmp/miyota-official-sources.
  --offline                   Verifica únicamente los bytes ya presentes en la caché.
  --json                      Emite el informe como JSON.

El comando nunca modifica el registro ni acepta automáticamente una huella nueva.
`)
}

function documentsFor(options: CliOptions): OfficialDocumentRecord[] {
  return MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries
    .filter((entry) => entry.status === 'curated')
    .filter((entry) => !options.calibre || entry.calibre === options.calibre)
    .flatMap((entry) => entry.documents)
    .filter((document) => !options.documentType || document.documentType === options.documentType)
}

function extensionFor(document: OfficialDocumentRecord): string {
  return document.documentType === 'product-page' ? 'html' : 'pdf'
}

function metadataPath(cacheDir: string, document: OfficialDocumentRecord): string {
  return path.join(cacheDir, `${document.id}.json`)
}

async function readCached(
  cacheDir: string,
  document: OfficialDocumentRecord,
): Promise<{ bytes: Uint8Array, metadata: OfficialRemoteObservation, cachePath: string }> {
  const metadata = JSON.parse(await readFile(metadataPath(cacheDir, document), 'utf8')) as OfficialRemoteObservation
  const cachePath = path.join(cacheDir, `${document.id}.${metadata.sha256}.${extensionFor(document)}`)
  return {
    bytes: await readFile(cachePath),
    metadata,
    cachePath,
  }
}

async function fetchOfficial(document: OfficialDocumentRecord): Promise<{
  bytes: Uint8Array
  finalUrl: string
  mediaType: string
  etag?: string
  lastModified?: string
}> {
  const response = await fetch(document.url, {
    redirect: 'follow',
    headers: {
      'Accept': document.documentType === 'product-page' ? 'text/html' : 'application/pdf',
      'User-Agent': 'WatchPrototypeLab-OfficialSourceVerifier/1.0',
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

  const finalUrl = new URL(response.url)
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== OFFICIAL_HOST) {
    throw new Error(`Redirección fuera del origen oficial permitido: ${response.url}`)
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Respuesta de ${contentLength} bytes; supera el límite de ${MAX_RESPONSE_BYTES}.`)
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Respuesta de ${bytes.byteLength} bytes; supera el límite de ${MAX_RESPONSE_BYTES}.`)
  }

  return {
    bytes,
    finalUrl: response.url,
    mediaType: response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || 'application/octet-stream',
    ...(response.headers.get('etag') ? { etag: response.headers.get('etag')! } : {}),
    ...(response.headers.get('last-modified') ? { lastModified: response.headers.get('last-modified')! } : {}),
  }
}

function observationFor(
  document: OfficialDocumentRecord,
  bytes: Uint8Array,
  response: { finalUrl: string, mediaType: string, etag?: string, lastModified?: string },
): OfficialRemoteObservation {
  const hashMode = document.remoteIntegrity?.hashMode
    ?? (document.documentType === 'product-page' ? 'html-csrf-normalized' : 'raw-response-body')
  const hashBytes = hashMode === 'html-csrf-normalized'
    ? new TextEncoder().encode(
        new TextDecoder().decode(bytes)
          .replace(/('csrfToken'\s*:\s*')[a-f0-9]+(')/giu, '$1<normalized>$2'),
      )
    : bytes
  return {
    hashMode,
    verifiedAt: new Date().toISOString(),
    requestedUrl: document.url,
    finalUrl: response.finalUrl,
    mediaType: response.mediaType,
    sizeBytes: bytes.byteLength,
    sha256: createHash('sha256').update(hashBytes).digest('hex'),
    ...(response.etag ? { etag: response.etag } : {}),
    ...(response.lastModified ? { lastModified: response.lastModified } : {}),
  }
}

async function cacheObservation(
  cacheDir: string,
  document: OfficialDocumentRecord,
  bytes: Uint8Array,
  observation: OfficialRemoteObservation,
): Promise<string> {
  await mkdir(cacheDir, { recursive: true })
  const cachePath = path.join(cacheDir, `${document.id}.${observation.sha256}.${extensionFor(document)}`)
  await writeFile(cachePath, bytes, { flag: 'wx' }).catch(async (error: unknown) => {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  })
  await writeFile(metadataPath(cacheDir, document), `${JSON.stringify(observation, null, 2)}\n`, 'utf8')
  return cachePath
}

async function verifyDocument(document: OfficialDocumentRecord, options: CliOptions): Promise<VerificationResult> {
  try {
    let bytes: Uint8Array
    let observation: OfficialRemoteObservation
    let cachePath: string
    if (options.offline) {
      const cached = await readCached(options.cacheDir, document)
      bytes = cached.bytes
      observation = {
        ...observationFor(document, bytes, {
          finalUrl: cached.metadata.finalUrl,
          mediaType: cached.metadata.mediaType,
          ...(cached.metadata.etag ? { etag: cached.metadata.etag } : {}),
          ...(cached.metadata.lastModified ? { lastModified: cached.metadata.lastModified } : {}),
        }),
        verifiedAt: cached.metadata.verifiedAt,
      }
      cachePath = cached.cachePath
    } else {
      const fetched = await fetchOfficial(document)
      bytes = fetched.bytes
      observation = observationFor(document, bytes, fetched)
      cachePath = await cacheObservation(options.cacheDir, document, bytes, observation)
    }

    const comparison = compareOfficialDocumentObservation(document, observation)
    return {
      id: document.id,
      url: document.url,
      status: comparison.status,
      observation,
      cachePath,
      differences: comparison.differences,
    }
  } catch (error) {
    return {
      id: document.id,
      url: document.url,
      status: 'error',
      differences: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function printResults(results: VerificationResult[], json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`)
    return
  }
  for (const result of results) {
    const marker = result.status === 'verified' ? 'OK' : result.status.toUpperCase()
    process.stdout.write(`${marker.padEnd(10)} ${result.id}\n`)
    result.differences.forEach((difference) => process.stdout.write(`           - ${difference}\n`))
    if (result.error) process.stdout.write(`           - ${result.error}\n`)
    if (result.observation) {
      process.stdout.write(`           ${result.observation.sizeBytes} bytes · sha256 ${result.observation.sha256}\n`)
    }
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  const documents = documentsFor(options)
  if (documents.length === 0) throw new Error('Ninguna fuente coincide con los filtros.')
  const results: VerificationResult[] = []
  for (const document of documents) results.push(await verifyDocument(document, options))
  printResults(results, options.json)
  if (results.some(({ status }) => status !== 'verified')) process.exitCode = 1
}

await main()
