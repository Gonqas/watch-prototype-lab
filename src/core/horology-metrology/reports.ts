import type { NominalMeasuredComparison } from './comparisons'
import type { InspectionFinding, InspectionObservation, InspectionSession } from './inspection'
import type { InstrumentProfile, InstrumentVerification } from './instruments'
import type { MeasurementSeries } from './measurements'
import type { GeometryCorrectionProposal } from './proposals'
import type { PhysicalSpecimen } from './specimens'
import type { VersionedMetrologyEntity } from './identity'

export interface MetrologyReport extends VersionedMetrologyEntity {
  profileId: string
  specimenId: string
  title: string
  generatedAt: string
  formatVersion: 1
  specimen: PhysicalSpecimen
  sessions: InspectionSession[]
  observations: InspectionObservation[]
  findings: InspectionFinding[]
  instruments: InstrumentProfile[]
  verifications: InstrumentVerification[]
  measurementSeries: MeasurementSeries[]
  comparisons: NominalMeasuredComparison[]
  proposals: GeometryCorrectionProposal[]
  includedObjectIds: string[]
  excludedPrivateFields: string[]
  limitations: string[]
}

export function privateSafeSpecimen(specimen: PhysicalSpecimen): PhysicalSpecimen {
  const copy = structuredClone(specimen)
  delete copy.serialNumber
  delete copy.acquisitionSource
  delete copy.storageLocation
  copy.privacy = 'exportable'
  return copy
}
