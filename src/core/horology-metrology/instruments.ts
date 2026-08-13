import type { EngineeringQuantity } from '../horology-engineering'
import type { VersionedMetrologyEntity } from './identity'

export type InstrumentType =
  | 'caliper'
  | 'micrometer'
  | 'indicator'
  | 'comparator'
  | 'scale'
  | 'optical-microscope'
  | 'camera'
  | 'timing-machine'
  | 'custom'

export type InstrumentVerificationKind = 'zero-check' | 'reference-check' | 'calibration-certificate' | 'comparison' | 'functional-check'
export type InstrumentVerificationStatus = 'valid' | 'expired' | 'failed' | 'limited' | 'unknown'

export interface InstrumentProfile extends VersionedMetrologyEntity {
  profileId: string
  displayName: string
  type: InstrumentType
  manufacturer?: string
  model?: string
  serialNumber?: string
  assetNumber?: string
  resolution: EngineeringQuantity
  statedAccuracy?: EngineeringQuantity
  rangeMinimum?: EngineeringQuantity
  rangeMaximum?: EngineeringQuantity
  measurementDimensions: string[]
  lastKnownCondition: 'serviceable' | 'limited' | 'out-of-service' | 'unknown'
  privacy: 'private' | 'profile' | 'exportable'
  notes: string
}

export interface InstrumentVerification extends VersionedMetrologyEntity {
  profileId: string
  instrumentId: string
  kind: InstrumentVerificationKind
  status: InstrumentVerificationStatus
  performedAt: string
  validUntil?: string
  referenceDescription: string
  referenceId?: string
  observedError?: EngineeringQuantity
  declaredUncertainty?: EngineeringQuantity
  conditions?: string
  operator: string
  evidenceObjectIds: string[]
  limitations: string[]
}

export function validateInstrument(input: InstrumentProfile): InstrumentProfile {
  if (!input.displayName.trim()) throw new Error('El instrumento necesita un nombre.')
  if (input.resolution.value <= 0) throw new Error('La resolución debe ser positiva.')
  if (input.statedAccuracy && input.statedAccuracy.provenance === 'estimated') {
    throw new Error('La exactitud declarada no puede inferirse ni estimarse a partir de la resolución.')
  }
  return structuredClone(input)
}

export function validateInstrumentVerification(input: InstrumentVerification): InstrumentVerification {
  if (!input.instrumentId.trim() || !input.operator.trim()) throw new Error('La verificación necesita instrumento y operador.')
  if (input.kind === 'zero-check' && input.status === 'valid' && input.referenceDescription.toLowerCase().includes('calibrad')) {
    throw new Error('Un ajuste a cero no demuestra que el instrumento esté calibrado.')
  }
  return structuredClone(input)
}
