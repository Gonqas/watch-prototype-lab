import { IndexedDbLearningBinaryStorage } from '../../learning/persistence/binaryStorage'
import { createMetrologyId } from './identity'
import type { ContentAddressedObject, ImageAsset, ObjectStoreImportJob, ObjectStoreReference } from './images'
import type { HorologyMetrologyRepository } from './persistence'

export type SupportedImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

export function detectSupportedImageMediaType(bytes: Uint8Array): SupportedImageMediaType {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  throw new Error('La imagen no es un JPEG, PNG o WebP válido.')
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function thumbnailBytes(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  if (typeof createImageBitmap !== 'function') throw new Error('Este navegador no permite generar miniaturas de forma segura.')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('No se pudo preparar el lienzo de miniatura.')
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('No se pudo codificar la miniatura.')), 'image/webp', 0.82))
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: bitmap.width, height: bitmap.height }
  } finally {
    bitmap.close()
  }
}

export interface WebImageImportResult {
  job: ObjectStoreImportJob
  imageAsset: ImageAsset
  originalObject: ContentAddressedObject
  thumbnailObject: ContentAddressedObject
  deduplicated: boolean
}

export async function importWebMetrologyImage({
  file,
  profileId,
  specimenId,
  repository,
  storage = new IndexedDbLearningBinaryStorage(),
  privacy = 'private',
  now = new Date().toISOString(),
}: {
  file: File
  profileId: string
  specimenId?: string
  repository: HorologyMetrologyRepository
  storage?: IndexedDbLearningBinaryStorage
  privacy?: 'private' | 'profile' | 'exportable'
  now?: string
}): Promise<WebImageImportResult> {
  if (file.size <= 0 || file.size > 250 * 1024 * 1024) throw new Error('La imagen está vacía o supera 250 MB.')
  const jobId = createMetrologyId('object', [profileId, specimenId ?? 'unassigned', file.name, now])
  const baseJob: ObjectStoreImportJob = {
    schemaVersion: 1,
    id: jobId,
    profileId,
    ...(specimenId ? { specimenId } : {}),
    sourcePathName: file.name,
    state: 'hashing',
    bytesProcessed: 0,
    totalBytes: file.size,
    createdAt: now,
    updatedAt: now,
    recordVersion: 1,
  }
  await repository.put('object_store_import_jobs', baseJob)
  await storage.initialize()
  const stagedHashes: string[] = []
  try {
    const originalBytes = new Uint8Array(await file.arrayBuffer())
    const mediaType = detectSupportedImageMediaType(originalBytes)
    const originalHash = await sha256(originalBytes)
    const originalStorageHash = `sha256:${originalHash}`
    const existing = (await repository.list('object_store_objects', { limit: 250 })).items
      .find((object) => object.sha256 === originalHash)
    const thumbnail = await thumbnailBytes(file)
    const thumbnailHash = await sha256(thumbnail.bytes)
    const thumbnailStorageHash = `sha256:${thumbnailHash}`
    const originalReference = existing?.storagePath ?? await storage.stage(originalStorageHash, originalBytes)
    if (!existing) stagedHashes.push(originalStorageHash)
    await storage.stage(thumbnailStorageHash, thumbnail.bytes)
    stagedHashes.push(thumbnailStorageHash)
    const committedOriginal = existing?.storagePath ?? await storage.commit(originalStorageHash)
    const committedThumbnail = await storage.commit(thumbnailStorageHash)
    const objectId = existing?.id ?? createMetrologyId('object', [originalHash])
    const thumbnailObjectId = createMetrologyId('object', [thumbnailHash])
    const imageId = createMetrologyId('image', [profileId, specimenId ?? 'unassigned', originalHash])
    const originalObject: ContentAddressedObject = existing ?? {
      schemaVersion: 1,
      id: objectId,
      sha256: originalHash,
      bytes: originalBytes.byteLength,
      mediaType,
      originalName: file.name,
      importedAt: now,
      ownerProfileId: profileId,
      profileId,
      ...(specimenId ? { specimenId } : {}),
      privacy,
      state: 'ready',
      kind: 'photo-original',
      storagePath: committedOriginal,
      immutable: true,
      createdAt: now,
      updatedAt: now,
      recordVersion: 1,
    }
    const thumbnailObject: ContentAddressedObject = {
      schemaVersion: 1,
      id: thumbnailObjectId,
      sha256: thumbnailHash,
      bytes: thumbnail.bytes.byteLength,
      mediaType: 'image/webp',
      originalName: `${file.name}.thumbnail.webp`,
      importedAt: now,
      ownerProfileId: profileId,
      profileId,
      ...(specimenId ? { specimenId } : {}),
      privacy,
      state: 'ready',
      kind: 'thumbnail',
      storagePath: committedThumbnail,
      immutable: true,
      createdAt: now,
      updatedAt: now,
      recordVersion: 1,
    }
    const imageAsset: ImageAsset = {
      schemaVersion: 1,
      id: imageId,
      profileId,
      ...(specimenId ? { specimenId } : {}),
      originalObjectId: objectId,
      thumbnailObjectId,
      derivativeObjectIds: [],
      mediaType,
      pixelWidth: thumbnail.width,
      pixelHeight: thumbnail.height,
      orientationDegrees: 0,
      importedAt: now,
      privacy,
      originalImmutable: true,
      createdAt: now,
      updatedAt: now,
      recordVersion: 1,
    }
    const reference: ObjectStoreReference = {
      schemaVersion: 1,
      id: createMetrologyId('object-reference', [imageId, objectId]),
      profileId,
      ...(specimenId ? { specimenId } : {}),
      objectId,
      ownerType: 'specimen',
      ownerId: specimenId ?? imageId,
      role: 'photo-original',
      createdAt: now,
      updatedAt: now,
      recordVersion: 1,
    }
    await repository.put('object_store_objects', originalObject)
    await repository.put('object_store_objects', thumbnailObject)
    await repository.put('image_assets', imageAsset)
    await repository.put('object_store_references', reference)
    await repository.put('object_store_references', {
      ...reference,
      id: createMetrologyId('object-reference', [imageId, thumbnailObjectId]),
      objectId: thumbnailObjectId,
      role: 'thumbnail',
    })
    const job: ObjectStoreImportJob = { ...baseJob, state: 'complete', bytesProcessed: file.size, objectId, imageAssetId: imageId, updatedAt: new Date().toISOString(), recordVersion: 2 }
    await repository.put('object_store_import_jobs', job)
    return { job, imageAsset, originalObject, thumbnailObject, deduplicated: Boolean(existing) || originalReference === committedOriginal && Boolean(existing) }
  } catch (error) {
    await Promise.all(stagedHashes.map((hash) => storage.rollback(hash)))
    await repository.put('object_store_import_jobs', {
      ...baseJob,
      state: 'failed',
      error: error instanceof Error ? error.message : 'Importación fallida.',
      updatedAt: new Date().toISOString(),
      recordVersion: 2,
    })
    throw error
  }
}

export async function readWebMetrologyObjectUrl(object: ContentAddressedObject, storage = new IndexedDbLearningBinaryStorage()): Promise<string> {
  await storage.initialize()
  const bytes = await storage.read(`sha256:${object.sha256}`)
  if (!bytes) throw new Error('El objeto binario no está disponible en este navegador.')
  return URL.createObjectURL(new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: object.mediaType }))
}
