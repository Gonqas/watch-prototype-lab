import type { AcademySourceFigureAsset, AcademySourceFigureCrop } from './academyReaderModel'

export type AcademySourceFigureAssetIssueCode =
  | 'asset-id'
  | 'src-not-local'
  | 'dimensions'
  | 'alternative-text'
  | 'caption'
  | 'source'
  | 'crop'
  | 'content-hash'
  | 'source-content-hash'
  | 'rights'
  | 'didactic-contract'

export interface AcademySourceFigureAssetIssue {
  code: AcademySourceFigureAssetIssueCode
  message: string
}

const SHA256 = /^(?:sha256:)?[a-f0-9]{64}$/i
const LOCAL_IMAGE_EXTENSION = /\.(?:avif|jpe?g|png|svg|webp)$/i
const LOCAL_IMAGE_PATH = /^\/[a-z0-9._/-]+$/i
const ASSET_ID = /^[a-z0-9][a-z0-9._-]*$/i

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function academySourceFigureSrcIsLocal(src: unknown): src is string {
  if (!nonEmpty(src) || !src.startsWith('/learning-media/') || src.startsWith('//')) return false
  if (src.includes('\\') || src.includes('?') || src.includes('#')) return false
  if (src.split('/').some((part) => part === '.' || part === '..')) return false
  return LOCAL_IMAGE_PATH.test(src) && LOCAL_IMAGE_EXTENSION.test(src)
}

function validCrop(crop: unknown): crop is AcademySourceFigureCrop {
  if (!record(crop) || !['normalized', 'pixels'].includes(String(crop.unit))) return false
  if (![crop.x, crop.y].every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)) return false
  if (![crop.width, crop.height].every(finitePositive)) return false
  if (crop.unit === 'normalized') {
    return Number(crop.x) <= 1
      && Number(crop.y) <= 1
      && Number(crop.width) <= 1
      && Number(crop.height) <= 1
      && Number(crop.x) + Number(crop.width) <= 1.000001
      && Number(crop.y) + Number(crop.height) <= 1.000001
  }
  if (crop.unit !== 'pixels' || !finitePositive(crop.sourceWidth) || !finitePositive(crop.sourceHeight)) return false
  return Number(crop.x) + Number(crop.width) <= crop.sourceWidth
    && Number(crop.y) + Number(crop.height) <= crop.sourceHeight
}

/** Devuelve todas las causas que impiden usar el asset como visual implementado. */
export function auditAcademySourceFigureAsset(asset: unknown): AcademySourceFigureAssetIssue[] {
  if (!record(asset)) return [{ code: 'asset-id', message: 'No se ha declarado una entidad de figura.' }]
  const issues: AcademySourceFigureAssetIssue[] = []
  if (!nonEmpty(asset.assetId) || !ASSET_ID.test(asset.assetId)) issues.push({ code: 'asset-id', message: 'La figura no declara un assetId estable y seguro.' })
  if (!academySourceFigureSrcIsLocal(asset.src)) issues.push({ code: 'src-not-local', message: 'src debe ser una ruta local absoluta, sin query, fragmento ni segmentos relativos.' })
  if (!Number.isInteger(asset.width) || !Number.isInteger(asset.height) || !finitePositive(asset.width) || !finitePositive(asset.height)) {
    issues.push({ code: 'dimensions', message: 'width y height deben ser enteros positivos.' })
  }
  if (!nonEmpty(asset.alt)) issues.push({ code: 'alternative-text', message: 'La figura necesita un texto alternativo específico.' })
  if (!nonEmpty(asset.caption)) issues.push({ code: 'caption', message: 'La figura necesita un pie identificable.' })
  if (!record(asset.source)
    || !nonEmpty(asset.source.sourceId)
    || !nonEmpty(asset.source.title)
    || !nonEmpty(asset.source.locator)) {
    issues.push({ code: 'source', message: 'La figura debe conservar sourceId, título y localizador de la fuente.' })
  } else if ((asset.source.page !== undefined && !nonEmpty(String(asset.source.page)))
    || (asset.source.figure !== undefined && !nonEmpty(String(asset.source.figure)))) {
    issues.push({ code: 'source', message: 'La página y la figura, cuando se declaran, no pueden estar vacías.' })
  }
  if (!validCrop(asset.crop)) issues.push({ code: 'crop', message: 'Las coordenadas del recorte quedan fuera del original o están incompletas.' })
  if (!nonEmpty(asset.contentHash) || !SHA256.test(asset.contentHash)) {
    issues.push({ code: 'content-hash', message: 'El asset debe declarar un hash SHA-256 hexadecimal válido.' })
  }
  if (!nonEmpty(asset.sourceSha256) || !SHA256.test(asset.sourceSha256)) {
    issues.push({ code: 'source-content-hash', message: 'La figura debe declarar el hash SHA-256 del binario fuente original.' })
  }
  if (!record(asset.rights)
    || !['public-domain', 'licensed', 'permission-granted', 'personal-study-only', 'rights-review-required'].includes(String(asset.rights.status))
    || !['allowed', 'restricted', 'review-required'].includes(String(asset.rights.distribution))
    || !nonEmpty(asset.rights.attribution)
    || (asset.rights.status === 'licensed' && !nonEmpty(asset.rights.license))
    || (asset.rights.status === 'personal-study-only' && asset.rights.distribution === 'allowed')
    || (asset.rights.status === 'rights-review-required' && asset.rights.distribution === 'allowed')) {
    issues.push({ code: 'rights', message: 'El estado de derechos, la distribución y la atribución deben ser coherentes.' })
  }
  if (!nonEmpty(asset.whatToLookFor) || !nonEmpty(asset.evidence) || !nonEmpty(asset.limitation)) {
    issues.push({ code: 'didactic-contract', message: 'La figura debe explicar qué mirar, qué evidencia aporta y cuál es su límite.' })
  }
  return issues
}

export function academySourceFigureAssetIsValid(asset: unknown): asset is AcademySourceFigureAsset {
  return auditAcademySourceFigureAsset(asset).length === 0
}
