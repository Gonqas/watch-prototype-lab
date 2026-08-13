import { strFromU8, unzipSync } from 'fflate'
import type { LearningPack, LearningPackManifest } from '../content/learningPack'
import { LearningPackManifestSchema, sha256Hex, validateLearningPack } from '../content/learningPack'
import jsonSchemaValidator from '../content/schemas/learning-pack-v1.validator.js'
import { diagnostic, type RuntimeDiagnostic } from './diagnostics'
import { compareSemVer, parseSemVer } from './semver'
export { encodeLearningPackage, type LearningPackAssetInput } from './packageEncoder'

export interface LearningPackageZipLimits {
  maximumCompressedBytes: number
  maximumEntryCount: number
  maximumEntryUncompressedBytes: number
  maximumTotalUncompressedBytes: number
  maximumCompressionRatio: number
  maximumPathDepth: number
  maximumJsonDepth: number
}

export const DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS: LearningPackageZipLimits = {
  maximumCompressedBytes: 25 * 1024 * 1024,
  // La enciclopedia mantiene un archivo declarativo por entidad para que cada
  // afirmación, término y evidencia sea auditable. El límite total de bytes y
  // el límite por entrada siguen conteniendo ZIP bombs; 2 000 deja margen al
  // corpus completo sin aceptar archivos de cardinalidad ilimitada. La edición
  // clásica añade fuentes, glosario, laboratorios y evidencias individualizadas.
  maximumEntryCount: 5_000,
  maximumEntryUncompressedBytes: 8 * 1024 * 1024,
  maximumTotalUncompressedBytes: 64 * 1024 * 1024,
  maximumCompressionRatio: 100,
  maximumPathDepth: 16,
  maximumJsonDepth: 32,
}

export interface ZipEntryMetadata {
  name: string
  compressedBytes: number
  uncompressedBytes: number
  compressionMethod: number
  unixMode: number
}

export interface ZipPreflight {
  entries: ZipEntryMetadata[]
  totalCompressedBytes: number
  totalUncompressedBytes: number
}

export type LearningPackageOrigin = 'integrated' | 'local-unsigned'

export interface LoadedLearningPackage {
  pack: LearningPack
  origin: LearningPackageOrigin
  packageFingerprint: string
  assets: ReadonlyMap<string, Uint8Array>
  diagnostics: RuntimeDiagnostic[]
  zip: ZipPreflight
}

export type LearningPackageLoadResult =
  | { success: true; value: LoadedLearningPackage }
  | { success: false; diagnostics: RuntimeDiagnostic[] }

interface LearningPackageLoaderOptions {
  applicationVersion: string
  limits?: Partial<LearningPackageZipLimits>
}

function loaderError(code: string, message: string, detail?: string): RuntimeDiagnostic {
  return diagnostic({
    code,
    category: code.includes('VERSION') ? 'version-incompatible' : 'package-error',
    message,
    technicalDetail: detail,
    source: 'loader',
    suggestedRecovery: 'Revisar o volver a exportar el paquete con una versión compatible.',
    severity: 'error',
    blocking: true,
    retrySafe: true,
  })
}

function readU16(view: DataView, offset: number): number {
  if (offset < 0 || offset + 2 > view.byteLength) throw new Error('ZIP truncado.')
  return view.getUint16(offset, true)
}

function readU32(view: DataView, offset: number): number {
  if (offset < 0 || offset + 4 > view.byteLength) throw new Error('ZIP truncado.')
  return view.getUint32(offset, true)
}

function safeArchivePath(path: string): boolean {
  if (path.length === 0 || path.length > 240 || path.includes('\\') || path.includes('\0')) return false
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) return false
  return path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

export function inspectLearningPackageZip(bytes: Uint8Array, limits: LearningPackageZipLimits): ZipPreflight {
  if (bytes.byteLength > limits.maximumCompressedBytes) throw new Error(`El contenedor supera ${limits.maximumCompressedBytes} bytes comprimidos.`)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const minimum = Math.max(0, bytes.byteLength - 65_557)
  let eocd = -1
  for (let offset = bytes.byteLength - 22; offset >= minimum; offset -= 1) {
    if (readU32(view, offset) === 0x06054b50) { eocd = offset; break }
  }
  if (eocd < 0) throw new Error('No se encontró el directorio central ZIP.')
  const diskNumber = readU16(view, eocd + 4)
  const directoryDisk = readU16(view, eocd + 6)
  if (diskNumber !== 0 || directoryDisk !== 0) throw new Error('No se admiten archivos ZIP multidisco.')
  const entryCount = readU16(view, eocd + 10)
  if (entryCount > limits.maximumEntryCount) throw new Error(`El ZIP contiene ${entryCount} entradas; el máximo es ${limits.maximumEntryCount}.`)
  const directorySize = readU32(view, eocd + 12)
  const directoryOffset = readU32(view, eocd + 16)
  if (directoryOffset + directorySize > bytes.byteLength) throw new Error('Directorio central ZIP truncado.')
  const entries: ZipEntryMetadata[] = []
  const names = new Set<string>()
  let offset = directoryOffset
  let totalCompressedBytes = 0
  let totalUncompressedBytes = 0
  for (let index = 0; index < entryCount; index += 1) {
    if (readU32(view, offset) !== 0x02014b50) throw new Error('Entrada inválida en el directorio central ZIP.')
    const flags = readU16(view, offset + 8)
    const compressionMethod = readU16(view, offset + 10)
    const compressedBytes = readU32(view, offset + 20)
    const uncompressedBytes = readU32(view, offset + 24)
    const nameLength = readU16(view, offset + 28)
    const extraLength = readU16(view, offset + 30)
    const commentLength = readU16(view, offset + 32)
    const externalAttributes = readU32(view, offset + 38)
    const nameStart = offset + 46
    const nameEnd = nameStart + nameLength
    if (nameEnd > bytes.byteLength) throw new Error('Nombre ZIP truncado.')
    const name = new TextDecoder((flags & 0x800) !== 0 ? 'utf-8' : 'utf-8', { fatal: true }).decode(bytes.subarray(nameStart, nameEnd))
    if ((flags & 0x1) !== 0) throw new Error(`La entrada ${name} está cifrada.`)
    if (!safeArchivePath(name.replace(/\/$/, ''))) throw new Error(`Ruta ZIP no segura: ${name}`)
    if (name.split('/').filter(Boolean).length > limits.maximumPathDepth) throw new Error(`La ruta ${name} supera la profundidad permitida.`)
    const normalizedName = name.toLowerCase()
    if (names.has(normalizedName)) throw new Error(`Entrada ZIP duplicada o ambigua: ${name}`)
    names.add(normalizedName)
    const unixMode = externalAttributes >>> 16
    if ((unixMode & 0xf000) === 0xa000) throw new Error(`No se permiten enlaces simbólicos: ${name}`)
    if (uncompressedBytes > limits.maximumEntryUncompressedBytes) throw new Error(`La entrada ${name} supera el tamaño individual permitido.`)
    const ratio = uncompressedBytes / Math.max(1, compressedBytes)
    if (uncompressedBytes > 1_024 && ratio > limits.maximumCompressionRatio) throw new Error(`Relación de compresión sospechosa en ${name}: ${ratio.toFixed(1)}.`)
    totalCompressedBytes += compressedBytes
    totalUncompressedBytes += uncompressedBytes
    if (totalUncompressedBytes > limits.maximumTotalUncompressedBytes) throw new Error('El tamaño total descomprimido supera el límite.')
    entries.push({ name, compressedBytes, uncompressedBytes, compressionMethod, unixMode })
    offset = nameEnd + extraLength + commentLength
  }
  const aggregateRatio = totalUncompressedBytes / Math.max(1, totalCompressedBytes)
  if (totalUncompressedBytes > 1_024 && aggregateRatio > limits.maximumCompressionRatio) throw new Error(`Relación de compresión total sospechosa: ${aggregateRatio.toFixed(1)}.`)
  const manifests = entries.filter(({ name }) => name.toLowerCase() === 'manifest.json')
  if (manifests.length !== 1) throw new Error(manifests.length === 0 ? 'Falta manifest.json.' : 'Existen múltiples manifest.json ambiguos.')
  return { entries, totalCompressedBytes, totalUncompressedBytes }
}

function parseJson(bytes: Uint8Array, path: string): unknown {
  try {
    return JSON.parse(strFromU8(bytes)) as unknown
  } catch (error) {
    throw new Error(`${path} no contiene JSON válido: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}

function materializePack(files: Record<string, Uint8Array>, manifest: LearningPackManifest): unknown {
  const loadCollection = (entries: Array<{ id: string; path: string }>) => entries.map(({ path }) => {
    const bytes = files[path]
    if (!bytes) throw new Error(`Referencia interna ausente: ${path}`)
    return parseJson(bytes, path)
  })
  return {
    manifest,
    curricula: loadCollection(manifest.entries.curricula),
    routes: loadCollection(manifest.entries.routes),
    modules: loadCollection(manifest.entries.modules),
    concepts: loadCollection(manifest.entries.concepts),
    misconceptions: loadCollection(manifest.entries.misconceptions),
    blocks: loadCollection(manifest.entries.blocks),
    lessons: loadCollection(manifest.entries.lessons),
    activities: loadCollection(manifest.entries.activities),
    scenes: loadCollection(manifest.entries.scenes),
    competencies: loadCollection(manifest.entries.competencies),
    evidenceTemplates: loadCollection(manifest.entries.evidenceTemplates),
    rubrics: loadCollection(manifest.entries.rubrics),
    glossary: loadCollection(manifest.entries.glossary),
    sources: loadCollection(manifest.entries.sources),
    recommendations: loadCollection(manifest.entries.recommendations),
    visualResources: loadCollection(manifest.entries.visualResources),
  }
}

export class LearningPackageLoader {
  readonly applicationVersion: string
  readonly limits: LearningPackageZipLimits

  constructor(options: LearningPackageLoaderOptions) {
    if (!parseSemVer(options.applicationVersion)) throw new Error(`Versión de aplicación inválida: ${options.applicationVersion}`)
    this.applicationVersion = options.applicationVersion
    this.limits = { ...DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS, ...options.limits }
  }

  loadIntegrated(bytes: Uint8Array): Promise<LearningPackageLoadResult> {
    return this.loadFromBytes(bytes, 'integrated')
  }

  loadLocalUnsigned(bytes: Uint8Array): Promise<LearningPackageLoadResult> {
    return this.loadFromBytes(bytes, 'local-unsigned')
  }

  async loadFromBytes(bytes: Uint8Array, origin: LearningPackageOrigin): Promise<LearningPackageLoadResult> {
    const diagnostics: RuntimeDiagnostic[] = []
    try {
      const zip = inspectLearningPackageZip(bytes, this.limits)
      const files = unzipSync(bytes)
      const manifestInput = parseJson(files['manifest.json'], 'manifest.json')
      const manifest = LearningPackManifestSchema.parse(manifestInput)
      if (manifest.distribution !== origin) throw new Error(`El manifiesto declara ${manifest.distribution}, pero se cargó como ${origin}.`)
      if (manifest.schemaId !== 'learning-pack-v1') throw new Error(`JSON Schema no soportado: ${manifest.schemaId}`)
      if (compareSemVer(this.applicationVersion, manifest.minimumAppVersion) < 0) {
        diagnostics.push(loaderError('LR-PACKAGE-VERSION-MINIMUM', `El paquete requiere la aplicación ${manifest.minimumAppVersion} o posterior.`))
      }
      if (manifest.maximumAppVersion && compareSemVer(this.applicationVersion, manifest.maximumAppVersion) > 0) {
        diagnostics.push(loaderError('LR-PACKAGE-VERSION-MAXIMUM', `El paquete admite como máximo la aplicación ${manifest.maximumAppVersion}.`))
      }
      if (diagnostics.length > 0) return { success: false, diagnostics }
      const materialized = { ...(materializePack(files, manifest) as Record<string, unknown>), manifest: manifestInput }
      if (!jsonSchemaValidator(materialized)) {
        return {
          success: false,
          diagnostics: (jsonSchemaValidator.errors ?? []).map((error) => loaderError(
            'LR-PACKAGE-JSON-SCHEMA',
            `JSON Schema v1 rechazó ${error.instancePath || '/'}: ${error.message ?? 'error desconocido'}.`,
            `${error.keyword}:${JSON.stringify(error.params)}`,
          )),
        }
      }
      const validated = validateLearningPack(materialized, {
        maximumJsonBytes: this.limits.maximumTotalUncompressedBytes,
        maximumDepth: this.limits.maximumJsonDepth,
      })
      if (!validated.success) {
        return {
          success: false,
          diagnostics: validated.errors.map((error) => loaderError('LR-PACKAGE-VALIDATION', error.message, `${error.code}:${error.path}`)),
        }
      }
      const assets = new Map<string, Uint8Array>()
      for (const asset of manifest.assets) {
        const assetBytes = files[asset.path]
        if (!assetBytes) {
          if (asset.required) diagnostics.push(loaderError('LR-PACKAGE-ASSET-MISSING', `Falta el activo obligatorio ${asset.path}.`))
          continue
        }
        if (assetBytes.byteLength !== asset.bytes) diagnostics.push(loaderError('LR-PACKAGE-ASSET-SIZE', `Tamaño incorrecto para ${asset.path}.`))
        const hash = await sha256Hex(assetBytes)
        if (hash !== asset.sha256) diagnostics.push(loaderError('LR-PACKAGE-ASSET-HASH', `SHA-256 incorrecto para ${asset.path}.`))
        assets.set(asset.id, assetBytes.slice())
      }
      if (diagnostics.length > 0) return { success: false, diagnostics }
      const packageFingerprint = `sha256:${await sha256Hex(bytes)}`
      return {
        success: true,
        value: { pack: validated.pack, origin, packageFingerprint, assets, diagnostics: [], zip },
      }
    } catch (error) {
      return { success: false, diagnostics: [loaderError('LR-PACKAGE-ZIP-REJECTED', error instanceof Error ? error.message : String(error))] }
    }
  }
}
