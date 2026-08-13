import type { VersionedMetrologyEntity } from './identity'

export type ObjectStoreKind =
  | 'package'
  | 'photo-original'
  | 'thumbnail'
  | 'derivative'
  | 'raster-annotation'
  | 'document'
  | 'export'
  | 'evidence'
  | 'capture'

export interface ContentAddressedObject extends VersionedMetrologyEntity {
  profileId: string
  specimenId?: string
  sha256: string
  bytes: number
  mediaType: string
  originalName: string
  importedAt: string
  ownerProfileId: string
  privacy: 'private' | 'profile' | 'exportable'
  state: 'staged' | 'pending' | 'ready' | 'corrupt' | 'orphaned' | 'deleted'
  kind: ObjectStoreKind
  storagePath: string
  immutable: boolean
}

export interface ObjectStoreReference extends VersionedMetrologyEntity {
  profileId: string
  specimenId?: string
  objectId: string
  ownerType: 'specimen' | 'component' | 'inspection' | 'observation' | 'finding' | 'measurement' | 'report' | 'package'
  ownerId: string
  role: string
}

export interface ObjectStoreImportJob extends VersionedMetrologyEntity {
  profileId: string
  specimenId?: string
  sourcePathName: string
  state: 'created' | 'hashing' | 'validating' | 'thumbnailing' | 'committing' | 'complete' | 'cancelled' | 'failed'
  bytesProcessed: number
  totalBytes?: number
  objectId?: string
  imageAssetId?: string
  error?: string
}

export interface ImageDerivative extends VersionedMetrologyEntity {
  profileId: string
  imageAssetId: string
  objectId: string
  operations: Array<{
    kind: 'rotate' | 'invert' | 'contrast' | 'brightness' | 'crop' | 'resize' | 'annotation-raster'
    parameters: Record<string, number | string | boolean>
  }>
  sourceObjectId: string
  nonDestructive: true
}

export interface ImageAsset extends VersionedMetrologyEntity {
  profileId: string
  specimenId?: string
  componentId?: string
  inspectionSessionId?: string
  originalObjectId: string
  thumbnailObjectId?: string
  derivativeObjectIds: string[]
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'
  pixelWidth: number
  pixelHeight: number
  orientationDegrees: 0 | 90 | 180 | 270
  capturedAt?: string
  importedAt: string
  cameraInstrumentId?: string
  lightingNotes?: string
  privacy: 'private' | 'profile' | 'exportable'
  originalImmutable: true
}

export interface ImageCalibration extends VersionedMetrologyEntity {
  profileId: string
  specimenId?: string
  imageAssetId: string
  method: 'known-distance' | 'scale-bar' | 'calibration-target'
  sourceAnnotationId?: string
  pixelDistance: number
  physicalDistance: number
  physicalUnit: 'mm' | 'um'
  pixelsPerUnit: number
  declaredUncertainty?: number
  uncertaintyUnit?: 'mm' | 'um'
  validRegion?: { x: number; y: number; width: number; height: number }
  referencePlane?: string
  perspective?: 'orthogonal-assumed' | 'perspective-visible' | 'corrected' | 'unknown'
  confidence?: 'high' | 'medium' | 'low' | 'unknown'
  effectiveResolution?: number
  assumptions: string[]
  limitations: string[]
  calibratedAt: string
  operator: string
}

export type ImageAnnotationKind = 'distance' | 'diameter-circle' | 'diameter-three-point' | 'radius' | 'angle' | 'center' | 'area' | 'tooth-count' | 'marker' | 'label' | 'region'

export interface ImagePoint { x: number; y: number }

export interface ImageAnnotation extends VersionedMetrologyEntity {
  profileId: string
  specimenId?: string
  imageAssetId: string
  calibrationId?: string
  kind: ImageAnnotationKind
  points: ImagePoint[]
  label: string
  value?: number
  unit?: 'px' | 'px2' | 'mm' | 'um' | 'deg' | 'mm2' | 'um2' | 'count'
  declaredUncertainty?: number
  method: string
  operator: string
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  source: 'manual' | 'derived'
  createdFromDerivativeObjectId?: string
}

export function calibrateImage(input: Omit<ImageCalibration, 'pixelsPerUnit'>): ImageCalibration {
  if (input.pixelDistance <= 0 || input.physicalDistance <= 0) {
    throw new Error('La calibración requiere distancias de píxel y física positivas.')
  }
  return { ...structuredClone(input), pixelsPerUnit: input.pixelDistance / input.physicalDistance }
}

export function calibratedDistance(calibration: ImageCalibration, points: readonly [ImagePoint, ImagePoint]): number {
  const [first, second] = points
  return Math.hypot(second.x - first.x, second.y - first.y) / calibration.pixelsPerUnit
}

export function circleThroughThreePoints(points: readonly [ImagePoint, ImagePoint, ImagePoint]): { center: ImagePoint; radius: number } | undefined {
  const [a, b, c] = points
  const divisor = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(divisor) < 1e-9) return undefined
  const aa = a.x ** 2 + a.y ** 2
  const bb = b.x ** 2 + b.y ** 2
  const cc = c.x ** 2 + c.y ** 2
  const center = {
    x: (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / divisor,
    y: (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / divisor,
  }
  return { center, radius: Math.hypot(center.x - a.x, center.y - a.y) }
}

export function polygonArea(points: readonly ImagePoint[]): number {
  if (points.length < 3) return 0
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]
    return sum + point.x * next.y - next.x * point.y
  }, 0)) / 2
}

export function measureImageAnnotation(
  kind: ImageAnnotationKind,
  points: readonly ImagePoint[],
  calibration?: ImageCalibration,
): { value?: number; unit?: ImageAnnotation['unit']; valid: boolean; limitation?: string } {
  const scaleLength = (pixels: number) => calibration ? pixels / calibration.pixelsPerUnit : pixels
  const lengthUnit: ImageAnnotation['unit'] = calibration?.physicalUnit ?? 'px'
  if (kind === 'tooth-count') return { value: points.length, unit: 'count', valid: points.length > 0 }
  if (kind === 'marker' || kind === 'label' || kind === 'region') return { valid: points.length > 0 }
  if (kind === 'angle' && points.length >= 3) {
    const [first, vertex, second] = points
    const left = Math.atan2(first.y - vertex.y, first.x - vertex.x)
    const right = Math.atan2(second.y - vertex.y, second.x - vertex.x)
    return { value: Math.abs(((right - left) * 180 / Math.PI + 540) % 360 - 180), unit: 'deg', valid: true }
  }
  if (kind === 'diameter-three-point' && points.length >= 3) {
    const circle = circleThroughThreePoints([points[0], points[1], points[2]])
    return circle
      ? { value: scaleLength(circle.radius * 2), unit: lengthUnit, valid: true }
      : { valid: false, limitation: 'Los tres puntos son colineales y no definen un círculo.' }
  }
  if (kind === 'area' && points.length >= 3) {
    const area = polygonArea(points)
    return calibration
      ? { value: area / calibration.pixelsPerUnit ** 2, unit: calibration.physicalUnit === 'um' ? 'um2' : 'mm2', valid: true }
      : { value: area, unit: 'px2', valid: true, limitation: 'Área expresada en píxeles cuadrados sin escala física.' }
  }
  if (points.length >= 2) {
    const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    return {
      value: scaleLength(kind === 'diameter-circle' ? distance * 2 : distance),
      unit: lengthUnit,
      valid: true,
    }
  }
  return { valid: false, limitation: 'Faltan puntos para resolver la anotación.' }
}
