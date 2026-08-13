import type { VersionedMetrologyEntity } from './identity'

export type SpecimenKind = 'movement' | 'watch' | 'component' | 'tool' | 'material-sample' | 'other'
export type SpecimenCondition = 'as-received' | 'disassembled' | 'partially-assembled' | 'assembled' | 'unknown'
export type SpecimenOwnership = 'owned' | 'borrowed' | 'reference-only' | 'unknown'
export type PrivacyLevel = 'private' | 'profile' | 'exportable'

export interface PhysicalSpecimen extends VersionedMetrologyEntity {
  profileId: string
  reality?: 'physical' | 'simulation-only'
  stableIdentifier: string
  displayName: string
  kind: SpecimenKind
  manufacturer?: string
  calibreOrReference?: string
  family?: string
  variant?: string
  completeness?: 'complete' | 'incomplete' | 'unknown'
  declaredProvenance?: { kind: 'owned' | 'borrowed' | 'purchased' | 'gifted' | 'found' | 'synthetic' | 'unknown'; description: string }
  identificationConfidence?: 'confirmed' | 'probable' | 'possible' | 'unknown'
  serialNumber?: string
  lotOrBatch?: string
  acquisitionDate?: string
  acquisitionSource?: string
  acquisitionPrice?: { value: number; currency: string; private: true }
  ownership: SpecimenOwnership
  condition: SpecimenCondition
  storageLocation?: string
  notes: string
  tags: string[]
  linkedProjectIds: string[]
  linkedFixtureIds: string[]
  linkedFixtureVersions?: Record<string, string>
  humanReview?: { state: 'pending' | 'reviewed' | 'rejected'; reviewer?: string; reviewedAt?: string; note?: string }
  privacy: PrivacyLevel
  archivedAt?: string
}

export type ComponentCorrespondence = 'confirmed' | 'probable' | 'possible' | 'unknown' | 'not-mappable'

export interface PhysicalComponent extends VersionedMetrologyEntity {
  profileId: string
  specimenId: string
  parentComponentId?: string
  stableIdentifier: string
  displayName: string
  componentKind: string
  subsystem?: string
  officialPartReference?: string
  linkedFixtureEntityId?: string
  correspondence: ComponentCorrespondence
  correspondenceReason: string
  removalOrder?: number
  assemblyOrder?: number
  orientation?: string
  tray?: string
  location?: string
  imageAssetIds?: string[]
  observationIds?: string[]
  measurementSeriesIds?: string[]
  condition: SpecimenCondition
  notes: string
  tags: string[]
}

export function validateSpecimen(input: PhysicalSpecimen): PhysicalSpecimen {
  if (!input.profileId.trim() || !input.stableIdentifier.trim() || !input.displayName.trim()) {
    throw new Error('La unidad física necesita perfil, identificador estable y nombre.')
  }
  if (input.recordVersion < 1) throw new Error('La versión del registro debe ser positiva.')
  if (input.serialNumber !== undefined && input.privacy === 'exportable') {
    throw new Error('Un número de serie no puede marcarse como exportable sin una decisión explícita de privacidad.')
  }
  if (input.reality === 'simulation-only' && input.declaredProvenance?.kind !== 'synthetic') {
    throw new Error('Un espécimen de simulación debe declarar procedencia sintética.')
  }
  return structuredClone(input)
}

export const SYNTHETIC_EDUCATIONAL_SPECIMEN: Readonly<PhysicalSpecimen> = Object.freeze({
  schemaVersion: 1,
  id: 'metrology.specimen.synthetic-educational-v1',
  profileId: 'profile.synthetic',
  reality: 'simulation-only',
  stableIdentifier: 'synthetic-educational-v1',
  displayName: 'Espécimen sintético de metrología',
  kind: 'movement',
  completeness: 'complete',
  declaredProvenance: { kind: 'synthetic', description: 'Construcción educativa original; no representa un calibre real.' },
  identificationConfidence: 'confirmed',
  ownership: 'reference-only',
  condition: 'assembled',
  notes: 'simulation-only; no oficial; no físico; no medido; no pertenece a un calibre real.',
  tags: ['simulation-only', 'non-official', 'non-physical', 'unmeasured'],
  linkedProjectIds: [],
  linkedFixtureIds: [],
  privacy: 'exportable',
  humanReview: { state: 'reviewed', reviewer: 'Sistema 5A', reviewedAt: '2026-08-02T10:00:00.000Z' },
  createdAt: '2026-08-02T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
  recordVersion: 1,
} satisfies PhysicalSpecimen)

export function validateComponent(input: PhysicalComponent): PhysicalComponent {
  if (!input.specimenId.trim() || !input.displayName.trim()) throw new Error('El componente necesita unidad y nombre.')
  if (input.correspondence !== 'not-mappable' && input.linkedFixtureEntityId && !input.correspondenceReason.trim()) {
    throw new Error('La correspondencia con un modelo exige una justificación.')
  }
  return structuredClone(input)
}
