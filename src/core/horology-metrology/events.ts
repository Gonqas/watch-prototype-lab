import type { MetrologyRecordMap, MetrologyRecordType } from './persistence'

export type MetrologyEvent = {
  [K in MetrologyRecordType]: {
    schemaVersion: 1
    id: string
    sequence: number
    occurredAt: string
    type: 'metrology.record-created' | 'metrology.record-updated'
    recordType: K
    recordId: string
    recordVersion: number
    payload: Readonly<MetrologyRecordMap[K]>
    actor: 'learner' | 'reviewer' | 'system'
    idempotencyKey: string
  }
}[MetrologyRecordType]

export interface MetrologyRecordRemovedEvent {
  schemaVersion: 1
  id: string
  sequence: number
  occurredAt: string
  type: 'metrology.reference-removed'
  recordType: 'object_store_references'
  recordId: string
  actor: 'learner' | 'reviewer' | 'system'
  idempotencyKey: string
}

export type HorologyMetrologyEvent = MetrologyEvent | MetrologyRecordRemovedEvent
