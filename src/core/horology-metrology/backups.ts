import { stableSerialize } from './identity'
import type { HorologyMetrologyRepository, MetrologyRecordMap, MetrologyRecordType } from './persistence'

export const METROLOGY_RECORD_TYPES = [
  'physical_specimens', 'physical_components', 'instrument_profiles', 'instrument_verifications',
  'inspection_plans', 'inspection_sessions', 'inspection_observations', 'inspection_findings',
  'image_assets', 'image_derivatives', 'image_calibrations', 'image_annotations',
  'measurement_definitions', 'measurement_series', 'measurement_readings',
  'nominal_measured_comparisons', 'geometry_correction_proposals', 'object_store_objects',
  'object_store_references', 'object_store_import_jobs', 'metrology_reports',
] as const satisfies readonly MetrologyRecordType[]

export interface MetrologyMetadataBackup {
  format: 'wplab-metrology-metadata-backup'
  formatVersion: 1
  createdAt: string
  profileId: string
  records: Partial<{ [K in MetrologyRecordType]: MetrologyRecordMap[K][] }>
  objects: Array<{ id: string; sha256: string; bytes: number; included: false; reason: string }>
  limitations: string[]
}

export async function createMetrologyMetadataBackup(repository: HorologyMetrologyRepository, profileId: string): Promise<MetrologyMetadataBackup> {
  const records: MetrologyMetadataBackup['records'] = {}
  for (const type of METROLOGY_RECORD_TYPES) {
    const values: unknown[] = []
    let offset = 0
    while (true) {
      const page = await repository.list(type, { profileId, offset, limit: 250 })
      values.push(...page.items)
      offset += page.items.length
      if (offset >= page.total || page.items.length === 0) break
    }
    Object.assign(records, { [type]: values })
  }
  const objects = (records.object_store_objects ?? []).map(({ id, sha256, bytes }) => ({
    id, sha256, bytes, included: false as const,
    reason: 'El backup de metadatos declara el objeto y su hash, pero no incluye sus bytes.',
  }))
  return {
    format: 'wplab-metrology-metadata-backup', formatVersion: 1, createdAt: new Date().toISOString(), profileId,
    records, objects,
    limitations: ['No contiene fotografías ni derivados binarios.', 'La restauración debe previsualizarse y confirmarse.'],
  }
}

export function serializeMetrologyMetadataBackup(backup: MetrologyMetadataBackup): string {
  return stableSerialize(backup)
}

export function previewMetrologyMetadataRestore(backup: MetrologyMetadataBackup): { recordCount: number; omittedObjectCount: number; requiresConfirmation: true } {
  if (backup.format !== 'wplab-metrology-metadata-backup' || backup.formatVersion !== 1) throw new Error('Formato de backup metrológico no compatible.')
  return {
    recordCount: Object.values(backup.records).reduce((sum, records) => sum + (records?.length ?? 0), 0),
    omittedObjectCount: backup.objects.length,
    requiresConfirmation: true,
  }
}

export async function restoreMetrologyMetadataBackup(repository: HorologyMetrologyRepository, backup: MetrologyMetadataBackup, confirmed: boolean): Promise<void> {
  previewMetrologyMetadataRestore(backup)
  if (!confirmed) throw new Error('La restauración exige confirmación tras previsualizar sus consecuencias.')
  for (const type of METROLOGY_RECORD_TYPES) {
    for (const record of backup.records[type] ?? []) await repository.put(type, record as never)
  }
}
