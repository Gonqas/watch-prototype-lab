import type { MetrologyRecordMap, MetrologyRecordType } from './persistence'

export type PutMetrologyRecordCommand = {
  [K in MetrologyRecordType]: {
    schemaVersion: 1
    type: 'metrology.put-record'
    recordType: K
    value: MetrologyRecordMap[K]
    expectedRecordVersion?: number
    idempotencyKey: string
  }
}[MetrologyRecordType]

export interface RemoveObjectReferenceCommand {
  schemaVersion: 1
  type: 'metrology.remove-object-reference'
  referenceId: string
  idempotencyKey: string
}

export type HorologyMetrologyCommand = PutMetrologyRecordCommand | RemoveObjectReferenceCommand
