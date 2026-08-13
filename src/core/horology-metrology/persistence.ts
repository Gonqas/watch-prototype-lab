import type { NominalMeasuredComparison } from './comparisons'
import type { ContentAddressedObject, ImageAnnotation, ImageAsset, ImageCalibration, ImageDerivative, ObjectStoreImportJob, ObjectStoreReference } from './images'
import type { InspectionFinding, InspectionObservation, InspectionPlan, InspectionSession } from './inspection'
import type { InstrumentProfile, InstrumentVerification } from './instruments'
import type { MeasurementDefinition, MeasurementReading, MeasurementSeries } from './measurements'
import type { GeometryCorrectionProposal } from './proposals'
import type { PhysicalComponent, PhysicalSpecimen } from './specimens'
import type { MetrologyReport } from './reports'

export interface MetrologyRecordMap {
  physical_specimens: PhysicalSpecimen
  physical_components: PhysicalComponent
  instrument_profiles: InstrumentProfile
  instrument_verifications: InstrumentVerification
  inspection_plans: InspectionPlan
  inspection_sessions: InspectionSession
  inspection_observations: InspectionObservation
  inspection_findings: InspectionFinding
  image_assets: ImageAsset
  image_derivatives: ImageDerivative
  image_calibrations: ImageCalibration
  image_annotations: ImageAnnotation
  measurement_definitions: MeasurementDefinition
  measurement_series: MeasurementSeries
  measurement_readings: MeasurementReading
  nominal_measured_comparisons: NominalMeasuredComparison
  geometry_correction_proposals: GeometryCorrectionProposal
  object_store_objects: ContentAddressedObject
  object_store_references: ObjectStoreReference
  object_store_import_jobs: ObjectStoreImportJob
  metrology_reports: MetrologyReport
}

export type MetrologyRecordType = keyof MetrologyRecordMap

export interface MetrologyQuery {
  profileId?: string
  specimenId?: string
  ownerId?: string
  offset?: number
  limit?: number
}

export interface MetrologyPage<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

export interface HorologyMetrologyRepository {
  initialize(): Promise<void>
  close(): Promise<void>
  put<K extends MetrologyRecordType>(type: K, value: MetrologyRecordMap[K]): Promise<void>
  get<K extends MetrologyRecordType>(type: K, id: string): Promise<MetrologyRecordMap[K] | undefined>
  list<K extends MetrologyRecordType>(type: K, query?: MetrologyQuery): Promise<MetrologyPage<MetrologyRecordMap[K]>>
  removeReference(referenceId: string): Promise<void>
}
