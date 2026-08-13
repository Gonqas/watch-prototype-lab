import type { VersionedMetrologyEntity } from './identity'

export type FindingCategory = 'contamination' | 'surface' | 'geometry' | 'supports' | 'flexible' | 'mounting'
export type FindingSeverity = 'note' | 'minor' | 'significant' | 'critical-unknown'
export type FindingType =
  | 'dust' | 'fiber' | 'residue' | 'visible-oil' | 'visible-grease' | 'stain' | 'metal-particle'
  | 'scratch' | 'mark' | 'burr' | 'dent' | 'discoloration' | 'oxidation' | 'corrosion' | 'finish-loss'
  | 'deformation' | 'bent-part' | 'apparent-eccentricity' | 'apparent-flatness' | 'missing-tooth' | 'damaged-tooth' | 'deformed-hole'
  | 'damaged-pivot' | 'bent-pivot' | 'fractured-jewel' | 'missing-jewel' | 'damaged-seat' | 'misaligned-support'
  | 'deformed-spring' | 'off-center-hairspring' | 'displaced-contact' | 'missing-spring' | 'incorrect-hooking'
  | 'incorrect-screw' | 'missing-screw' | 'inverted-part' | 'unseated-part' | 'unseated-bridge' | 'unknown-orientation'

export const FINDING_TYPES_BY_CATEGORY: Readonly<Record<FindingCategory, readonly FindingType[]>> = {
  contamination: ['dust', 'fiber', 'residue', 'visible-oil', 'visible-grease', 'stain', 'metal-particle'],
  surface: ['scratch', 'mark', 'burr', 'dent', 'discoloration', 'oxidation', 'corrosion', 'finish-loss'],
  geometry: ['deformation', 'bent-part', 'apparent-eccentricity', 'apparent-flatness', 'missing-tooth', 'damaged-tooth', 'deformed-hole'],
  supports: ['damaged-pivot', 'bent-pivot', 'fractured-jewel', 'missing-jewel', 'damaged-seat', 'misaligned-support'],
  flexible: ['deformed-spring', 'off-center-hairspring', 'displaced-contact', 'missing-spring', 'incorrect-hooking'],
  mounting: ['incorrect-screw', 'missing-screw', 'inverted-part', 'unseated-part', 'unseated-bridge', 'unknown-orientation'],
}

export interface InspectionPlan extends VersionedMetrologyEntity {
  profileId: string
  displayName: string
  purpose: string
  specimenKind: string
  requiredInstrumentTypes: string[]
  requiredViews: string[]
  observationPrompts: string[]
  measurementDefinitionIds: string[]
  safetyLimits: string[]
  completionCriteria: string[]
}

export interface InspectionAccessibilityModel {
  keyboardOnly: boolean
  pointerOptional: boolean
  coordinateEntry: boolean
  fineAdjustment: boolean
  textualAnnotationList: boolean
  zoomIndependentText: boolean
  screenReaderSummary: boolean
  nonColorEncoding: boolean
  reducedMotion: boolean
  chartTableAlternative: boolean
}

export interface InspectionSession extends VersionedMetrologyEntity {
  profileId: string
  specimenId: string
  planId?: string
  state: 'draft' | 'active' | 'paused' | 'complete' | 'cancelled' | 'invalidated'
  startedAt: string
  pausedAt?: string
  completedAt?: string
  operator: string
  instrumentIds: string[]
  imageAssetIds: string[]
  observationIds: string[]
  findingIds: string[]
  measurementSeriesIds: string[]
  accessibility: InspectionAccessibilityModel
  restorationCheckpoint: Record<string, unknown>
  notes: string
}

export interface InspectionObservation extends VersionedMetrologyEntity {
  profileId: string
  sessionId: string
  specimenId: string
  componentId?: string
  imageAssetId?: string
  regionAnnotationId?: string
  observedAt: string
  operator: string
  description: string
  method: string
  lighting?: string
  magnification?: string
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  evidenceObjectIds: string[]
}

export interface InspectionFinding extends VersionedMetrologyEntity {
  profileId: string
  sessionId: string
  observationId: string
  specimenId: string
  componentId?: string
  category: FindingCategory
  type: FindingType
  severity: FindingSeverity
  finding: string
  region?: string
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  hypothesis?: string
  hypothesisConfidence?: 'high' | 'medium' | 'low' | 'unknown'
  nonPrescriptiveAction?: string
  measurementSeriesIds: string[]
  evidenceObjectIds: string[]
  status: 'open' | 'reviewed' | 'superseded' | 'invalidated'
}

export function validateFinding(input: InspectionFinding): InspectionFinding {
  if (!input.finding.trim()) throw new Error('Un hallazgo necesita una observación descriptiva.')
  if (!FINDING_TYPES_BY_CATEGORY[input.category].includes(input.type)) {
    throw new Error('El tipo de hallazgo no pertenece a la categoría declarada.')
  }
  if (input.hypothesis && !input.hypothesisConfidence) {
    throw new Error('Una hipótesis debe declarar su confianza y permanecer separada del hallazgo.')
  }
  if (input.nonPrescriptiveAction && /\b(reparar|sustituir|lubricar|descartar)\b/iu.test(input.nonPrescriptiveAction)) {
    throw new Error('5A no puede convertir un hallazgo en una prescripción automática.')
  }
  return structuredClone(input)
}
