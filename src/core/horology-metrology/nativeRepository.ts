import { convertFileSrc } from '@tauri-apps/api/core'
import { invokeLearningNative, isNativeApp } from '../../platform/native'
import type { ImageAsset, ContentAddressedObject } from './images'
import type {
  HorologyMetrologyRepository,
  MetrologyPage,
  MetrologyQuery,
  MetrologyRecordMap,
  MetrologyRecordType,
} from './persistence'

export class NativeHorologyMetrologyRepository implements HorologyMetrologyRepository {
  async initialize(): Promise<void> {
    if (!isNativeApp()) throw new Error('El repositorio nativo de metrología requiere Desktop.')
  }

  async close(): Promise<void> {}

  async put<K extends MetrologyRecordType>(type: K, value: MetrologyRecordMap[K]): Promise<void> {
    await invokeLearningNative<void>('learning_metrology_put_native', { recordType: type, value })
  }

  async get<K extends MetrologyRecordType>(type: K, id: string): Promise<MetrologyRecordMap[K] | undefined> {
    const value = await invokeLearningNative<MetrologyRecordMap[K] | null>('learning_metrology_get_native', { recordType: type, id })
    return value ?? undefined
  }

  async list<K extends MetrologyRecordType>(type: K, query: MetrologyQuery = {}): Promise<MetrologyPage<MetrologyRecordMap[K]>> {
    return invokeLearningNative<MetrologyPage<MetrologyRecordMap[K]>>('learning_metrology_list_native', {
      recordType: type,
      profileId: query.profileId,
      specimenId: query.specimenId,
      ownerId: query.ownerId,
      offset: query.offset,
      limit: query.limit,
    })
  }

  async removeReference(referenceId: string): Promise<void> {
    await invokeLearningNative<void>('learning_remove_object_reference_native', { referenceId })
  }
}

export interface NativeImageImportResult {
  jobId: string
  deduplicated: boolean
  imageAsset: ImageAsset
  originalObject: ContentAddressedObject
  thumbnailObject: ContentAddressedObject
}

export async function selectMetrologyImagePath(): Promise<string | null> {
  if (!isNativeApp()) return null
  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({
    title: 'Importar fotografía de inspección',
    multiple: false,
    directory: false,
    filters: [{ name: 'Imágenes compatibles', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
  })
  return typeof selected === 'string' ? selected : null
}

export async function importNativeMetrologyImage({
  path,
  jobId,
  profileId,
  specimenId,
  privacy = 'private',
}: {
  path: string
  jobId: string
  profileId: string
  specimenId?: string
  privacy?: 'private' | 'profile' | 'exportable'
}): Promise<NativeImageImportResult> {
  return invokeLearningNative<NativeImageImportResult>('learning_import_image_native', {
    path,
    jobId,
    profileId,
    specimenId,
    privacy,
  })
}

export async function cancelNativeMetrologyImageImport(jobId: string): Promise<boolean> {
  return invokeLearningNative<boolean>('learning_cancel_image_import_native', { jobId })
}

export async function nativeObjectStoreGcPreview(): Promise<{
  previewOnly: true
  orphaned: ContentAddressedObject[]
  brokenReferences: ContentAddressedObject[]
  automaticDeletion: false
}> {
  return invokeLearningNative('learning_object_store_gc_preview_native')
}

export function collectNativeObjectStoreOrphans(objectIds: string[], confirmed: boolean): Promise<{ removedObjectIds: string[]; verifiedMissingAfterRemoval: true }> {
  return invokeLearningNative('learning_object_store_collect_native', { objectIds, confirmed })
}

export function nativeMetrologyObjectUrl(object: ContentAddressedObject): string {
  if (object.state !== 'ready') throw new Error('El objeto todavía no está disponible.')
  return convertFileSrc(object.storagePath)
}

export interface NativeMetrologyBackupSummary {
  backup: { id: string; kind: 'metrology-metadata' | 'metrology-full'; createdAt: string; bytes: number }
  manifestPath: string
  manifestHash: string
  objectsIncluded: boolean
  objectCount: number
  includedObjectBytes: number
  omittedObjectCount: number
}

export interface NativeMetrologyRestorePreview {
  backupId: string
  manifestHash: string
  restorableObjectIds: string[]
  missingOrCorruptObjectIds: string[]
  conflictingObjectIds: string[]
  requiresConfirmation: true
  willOverwrite: false
}

export function createNativeMetrologyBackup(includeObjects: boolean): Promise<NativeMetrologyBackupSummary> {
  return invokeLearningNative('learning_create_metrology_backup_native', { includeObjects })
}

export function previewNativeMetrologyRestore(id: string): Promise<NativeMetrologyRestorePreview> {
  return invokeLearningNative('learning_preview_metrology_restore_native', { id })
}

export function restoreNativeMetrologyBackup(id: string, confirmedManifestHash: string): Promise<{ restored: true; backupId: string; objectCount: number }> {
  return invokeLearningNative('learning_restore_metrology_backup_native', { id, confirmedManifestHash })
}
