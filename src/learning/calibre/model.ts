import type { FidelityProfile } from '../fidelity'
import type { MechanicalLabSnapshot } from '../mechanical'
import type { WorkbenchSnapshot } from '../workbench'

export const calibreInstanceStateValues = [
  'installed',
  'exposed',
  'selected',
  'fastener-loosened',
  'retained',
  'removed',
  'placed-in-tray',
  'inspected',
  'fault-observed',
  'ready-to-install',
  'aligned',
  'installed-unverified',
  'installed-verified',
  'blocked',
  'documentary-only',
  'unknown',
] as const

export type CalibreInstanceState = (typeof calibreInstanceStateValues)[number]

export const calibreOperationAuthorityValues = [
  'official-procedure',
  'official-documented-relation',
  'structural-dependency',
  'educational-sequence',
  'own-observation',
  'inferred-sequence',
  'simulation-only',
  'unknown',
] as const

export type CalibreOperationAuthority = (typeof calibreOperationAuthorityValues)[number]

export type CalibreOperationPhase = 'documentation' | 'disassembly' | 'assembly' | 'inspection' | 'verification' | 'diagnosis'

export type CalibreDependencyGraphKind = 'disassembly' | 'assembly' | 'structure' | 'function'

export type CalibreDependencyKind =
  | 'remove-before'
  | 'requires-exposed'
  | 'requires-fastener-removed'
  | 'requires-energy-isolated'
  | 'requires-tool'
  | 'requires-documentation-reviewed'
  | 'install-before'
  | 'requires-support'
  | 'requires-alignment'
  | 'requires-orientation'
  | 'requires-fastener'
  | 'verify-after-install'
  | 'inspect-before-close'
  | 'supports'
  | 'pivots-in'
  | 'covers'
  | 'retains'
  | 'fastened-by'
  | 'meshes-with'
  | 'drives'
  | 'winds'
  | 'sets'
  | 'locks'
  | 'releases'
  | 'impulses'

export interface CalibreDependency {
  id: string
  graph: CalibreDependencyGraphKind
  kind: CalibreDependencyKind
  fromInstanceId: string
  toInstanceId: string
  authority: CalibreOperationAuthority
  sourceIds: string[]
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  blocking: boolean
  limitations: string[]
}

export type CalibreOperationAction =
  | 'identify'
  | 'select'
  | 'isolate'
  | 'explode'
  | 'review-documentation'
  | 'plan-removal'
  | 'loosen-fastener'
  | 'remove'
  | 'place-in-tray'
  | 'inspect'
  | 'align'
  | 'install'
  | 'tighten-fastener'
  | 'verify'
  | 'introduce-fault'
  | 'diagnose'

export interface CalibreOperation {
  id: string
  phase: CalibreOperationPhase
  action: CalibreOperationAction
  instanceId?: string
  subsystem?: string
  authority: CalibreOperationAuthority
  sourceIds: string[]
  requiredToolIds: string[]
  incompatibleToolIds: string[]
  educationalRisk: string
  accessibleAlternative: string
  dependencyIds: string[]
  limitations: string[]
  publishedAsOfficial: boolean
}

export type CalibreReadiness = 'ready' | 'usable-with-limitations' | 'documentary-only' | 'blocked' | 'unknown'

export interface CalibreInstanceAudit {
  canonicalId: string
  instanceId: string
  officialReference?: string
  nameEs: string
  nameEn: string
  subsystem: string
  sourceIds: string[]
  reconstructionLevel: 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
  geometryAvailable: boolean
  geometryShape?: string
  officialDimensions: string[]
  estimatedDimensions: string[]
  unknownDimensions: string[]
  selectorIds: string[]
  cardinality: string[]
  relationshipIds: string[]
  associatedFastenerIds: string[]
  coveredInstanceIds: string[]
  supportInstanceIds: string[]
  interfaceIds: string[]
  removalDependencyIds: string[]
  installationDependencyIds: string[]
  orientation: string
  visualState: string
  fidelity: FidelityProfile
  limitations: string[]
  readiness: CalibreReadiness
  aptitudes: Record<'identify' | 'select' | 'isolate' | 'explode' | 'remove' | 'placeInTray' | 'inspect' | 'install' | 'verify' | 'evaluate', boolean>
}

export interface CalibreSubsystem {
  id: string
  label: string
  instanceIds: string[]
  relationIds: string[]
  sourceIds: string[]
  function: string
  input: string
  output: string
  prerequisiteIds: string[]
  operationIds: string[]
  fidelity: FidelityProfile
  limitations: string[]
}

export type CalibreInspectionDefect =
  | 'dirt'
  | 'damaged-tooth-symbolic'
  | 'pivot-outside-support'
  | 'wheel-without-freedom'
  | 'wrong-fastener'
  | 'inverted-part'
  | 'rubbing'
  | 'displaced-spring'
  | 'missing-jewel-support-symbolic'
  | 'deformation-symbolic'
  | 'corrosion-symbolic'

export interface CalibreInspectionFinding {
  id: string
  instanceId: string
  defect: CalibreInspectionDefect | 'none' | 'unknown'
  classification: 'symbolic' | 'documentary' | 'unknown'
  observation: string
  sourceIds: string[]
  reversible: true
  limitations: string[]
}

export type CalibreVerificationKind =
  | 'train-visual-freedom'
  | 'functional-continuity'
  | 'alignment'
  | 'supports-present'
  | 'part-identity'
  | 'fastener-identity'
  | 'orientation'
  | 'energy-route'
  | 'calendar-state'
  | 'stem-state'
  | 'rotor-presence'
  | 'assembly-restored'

export interface CalibreVerificationResult {
  id: string
  kind: CalibreVerificationKind
  status: 'passed' | 'failed' | 'not-supported' | 'unknown'
  verifies: string[]
  doesNotVerify: string[]
  fidelity: FidelityProfile
  limitation: string
  affectedInstanceIds: string[]
}

export type CalibreFaultKind =
  | 'does-not-start'
  | 'does-not-transmit'
  | 'rotor-blocked'
  | 'automatic-disconnected'
  | 'barrel-empty'
  | 'train-interrupted'
  | 'escapement-blocked'
  | 'balance-stopped'
  | 'incorrect-stem-state'
  | 'calendar-blocked'
  | 'missing-part'
  | 'wrong-fastener'
  | 'bridge-not-seated'
  | 'pivot-outside-support'
  | 'hands-blocked'

export interface CalibreFault {
  kind: CalibreFaultKind
  active: boolean
  symptom: string
  affectedSubsystemIds: string[]
  affectedInstanceIds: string[]
  classification: 'educational-simulation'
  reversible: true
  limitations: string[]
}

export interface CalibreHypothesis {
  id: string
  symptom: string
  subsystemId: string
  hypothesis: string
  requiredDatum: string
  verificationKind: CalibreVerificationKind
  result?: 'supports' | 'rejects' | 'inconclusive'
  permittedConclusion?: string
  prohibitedConclusion: string
}

export interface CalibreProjectDossier {
  identified: boolean
  documentationReviewed: boolean
  subsystemIds: string[]
  plannedOperationIds: string[]
  removedInstanceIds: string[]
  trayInstanceIds: string[]
  inspectedInstanceIds: string[]
  installedInstanceIds: string[]
  verificationIds: string[]
  diagnosisIds: string[]
  recognizedLimitations: string[]
  passedChecks: string[]
  pendingChecks: string[]
}

export interface CalibreLabEvent {
  sequence: number
  timestamp: string
  type: string
  commandId: string
  accepted: boolean
  instanceId?: string
  authority?: CalibreOperationAuthority
  diagnosticCodes: string[]
  evidence: Record<string, string | number | boolean | string[] | null>
}

export interface CalibreSessionSnapshot {
  schemaVersion: 1
  fixtureId: 'fixture.miyota.8215.structural'
  fixtureVersion: string
  mode: 'guided' | 'assisted' | 'free'
  reducedMotion: boolean
  selectedSubsystemId: string
  selectedInstanceId?: string
  viewMode: 'complete' | 'automatic' | 'dial-side' | 'side' | 'exploded' | 'provenance' | 'energy-route' | 'textual'
  documentationReviewed: boolean
  disassemblyPlan: string[]
  activeContextualLab?: 'barrel' | 'train' | 'escapement' | 'oscillator' | 'motion-works' | 'automatic'
  cameraBookmark: string
  workbench: WorkbenchSnapshot
  mechanicalLab: MechanicalLabSnapshot
  inspectionFindings: CalibreInspectionFinding[]
  verifications: CalibreVerificationResult[]
  faults: CalibreFault[]
  hypotheses: CalibreHypothesis[]
  project: CalibreProjectDossier
  events: CalibreLabEvent[]
  nextSequence: number
}

export type CalibreLabCommand =
  | { id: string; type: 'identify-calibre' }
  | { id: string; type: 'review-documentation'; sourceIds: string[] }
  | { id: string; type: 'select-subsystem'; subsystemId: string }
  | { id: string; type: 'select-instance'; instanceId: string }
  | { id: string; type: 'change-view'; viewMode: CalibreSessionSnapshot['viewMode'] }
  | { id: string; type: 'create-disassembly-plan'; operationIds: string[] }
  | { id: string; type: 'open-contextual-lab'; lab: NonNullable<CalibreSessionSnapshot['activeContextualLab']> }
  | { id: string; type: 'close-contextual-lab' }
  | { id: string; type: 'inspect'; instanceId: string; defect?: CalibreInspectionDefect }
  | { id: string; type: 'verify'; kind: CalibreVerificationKind }
  | { id: string; type: 'introduce-fault'; fault: CalibreFaultKind }
  | { id: string; type: 'clear-fault'; fault: CalibreFaultKind }
  | { id: string; type: 'form-hypothesis'; hypothesis: Omit<CalibreHypothesis, 'id' | 'prohibitedConclusion'> }
  | { id: string; type: 'evaluate-hypothesis'; hypothesisId: string; result: 'supports' | 'rejects' | 'inconclusive'; permittedConclusion: string }
  | { id: string; type: 'recognize-limit'; limitation: string }
  | { id: string; type: 'restore'; snapshot: CalibreSessionSnapshot }

export interface CalibreCommandResult {
  accepted: boolean
  event: CalibreLabEvent
  diagnostics: Array<{ code: string; message: string; blocking: boolean }>
}
