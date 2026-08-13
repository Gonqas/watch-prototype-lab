import type { FidelityProfile } from '../fidelity'

export type MechanicalRelationType =
  | 'external-mesh'
  | 'internal-mesh'
  | 'same-arbor'
  | 'escapement-release'
  | 'oscillatory-coupling'
  | 'friction-drive'
  | 'manual-setting'
  | 'automatic-winding'

export type MechanicalSubsystem =
  | 'energy'
  | 'barrel'
  | 'gear-pair'
  | 'train'
  | 'supports'
  | 'escapement'
  | 'oscillator'
  | 'motion-works'
  | 'keyless'
  | 'automatic'
  | 'calendar'
  | 'integration'

export type MechanicalViewMode =
  | 'normal'
  | 'schematic'
  | 'section'
  | 'exploded'
  | 'isolated'
  | 'slow-motion'
  | 'step-by-step'
  | 'energy-flow'
  | 'kinematics'
  | 'provenance'
  | 'uncertainty'
  | 'compare-8215'
  | 'textual'

export interface MechanicalEntity {
  id: string
  label: string
  labelEn: string
  subsystem: MechanicalSubsystem
  roles: string[]
  sourceIds: string[]
  fidelity: FidelityProfile
  limitations: string[]
}

export interface KinematicRelation {
  id: string
  driverId: string
  drivenId: string
  type: MechanicalRelationType
  driverTeeth?: number
  drivenTeeth?: number
  ratio: number
  direction: 1 | -1 | 0
  relativeSpeed: number
  state: 'engaged' | 'disengaged' | 'blocked' | 'unknown'
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  sourceIds: string[]
  limitations: string[]
}

export interface EnergySegment {
  id: string
  fromId: string
  toId: string
  function: 'source' | 'storage' | 'transmission' | 'control' | 'release' | 'oscillation' | 'indication' | 'loss'
  branch: 'going-train' | 'motion-works' | 'calendar' | 'automatic' | 'setting'
  direction: 'forward' | 'reverse' | 'bidirectional'
  state: 'active' | 'inactive' | 'blocked' | 'interrupted'
  sourceIds: string[]
  fidelity: FidelityProfile
  limitations: string[]
}

export interface GearStage {
  id: string
  driverTeeth: number
  drivenTeeth: number
  relation: 'external-mesh' | 'internal-mesh'
  engaged: boolean
  centerDistanceState: 'valid-conceptual' | 'too-far' | 'overlapping'
}

export type EscapementPhase =
  | 'locked-left'
  | 'unlock-left'
  | 'impulse-left'
  | 'drop-left'
  | 'locked-right'
  | 'unlock-right'
  | 'impulse-right'
  | 'drop-right'

export type SupportState = 'supported' | 'pivot-outside-jewel' | 'excess-axial' | 'no-freedom' | 'rubbing'
export type CrownPosition = 'winding' | 'neutral' | 'time-setting'

export interface MechanicalFault {
  id: string
  kind:
    | 'mainspring-discharged'
    | 'barrel-blocked'
    | 'missing-mesh'
    | 'incorrect-ratio'
    | 'pivot-outside-jewel'
    | 'wheel-no-freedom'
    | 'escapement-blocked'
    | 'pallet-no-alternation'
    | 'balance-blocked'
    | 'low-amplitude-conceptual'
    | 'hairspring-rubbing'
    | 'motion-works-disconnected'
    | 'wrong-crown-position'
    | 'automatic-disconnected'
    | 'calendar-blocked'
    | 'hands-rubbing'
  symptom: string
  visualState: string
  hypothesis: string
  test: string
  allowedConclusion: string
  forbiddenConclusion: string
  active: boolean
}

export interface MechanicalLabEvent {
  sequence: number
  timestamp: string
  commandId: string
  commandType: MechanicalLabCommand['type']
  accepted: boolean
  diagnosticCodes: string[]
  evidence: Record<string, string | number | boolean | string[] | null>
}

export interface MechanicalLabSnapshot {
  schemaVersion: 1
  fixtureId: 'fixture.conceptual.mechanical-chain'
  comparisonFixtureId: 'fixture.miyota.8215.structural'
  selectedSubsystem: MechanicalSubsystem
  viewMode: MechanicalViewMode
  energyLevel: number
  energyReleased: boolean
  blockedEntityIds: string[]
  gearStages: GearStage[]
  supportState: SupportState
  escapementPhase: EscapementPhase
  escapementPaused: boolean
  escapementSpeed: number
  oscillatorFrequencyHz: number
  oscillatorAmplitudeDegrees: number
  oscillatorPaused: boolean
  hairspringActiveLength: number
  motionWorksEngaged: boolean
  indicatedMinutes: number
  crownPosition: CrownPosition
  automaticEnabled: boolean
  automaticReversal: 'unidirectional' | 'bidirectional'
  calendarDay: number
  calendarBlocked: boolean
  faults: MechanicalFault[]
  events: MechanicalLabEvent[]
  nextSequence: number
  reducedMotion: boolean
  projectDraft: {
    enabledSubsystems: MechanicalSubsystem[]
    decisions: string[]
    passedChecks: string[]
    pendingChecks: string[]
  }
  createdAt: string
}

export interface MechanicalDiagnostic {
  code: string
  message: string
  blocking: boolean
}

export interface MechanicalCommandResult {
  accepted: boolean
  event: MechanicalLabEvent
  diagnostics: MechanicalDiagnostic[]
}

export type MechanicalLabCommand =
  | { id: string; type: 'select-subsystem'; subsystem: MechanicalSubsystem }
  | { id: string; type: 'change-view'; view: MechanicalViewMode }
  | { id: string; type: 'wind'; amount: number }
  | { id: string; type: 'release'; amount: number }
  | { id: string; type: 'block'; entityId: string }
  | { id: string; type: 'unblock'; entityId: string }
  | { id: string; type: 'engage'; target: 'motion-works' | 'gear-stage'; stageId?: string }
  | { id: string; type: 'disengage'; target: 'motion-works' | 'gear-stage'; stageId?: string }
  | { id: string; type: 'rotate'; entityId: string; turns: number }
  | { id: string; type: 'oscillate'; cycles: number }
  | { id: string; type: 'change-ratio'; stageId: string; driverTeeth: number; drivenTeeth: number }
  | { id: string; type: 'add-stage'; stage: GearStage }
  | { id: string; type: 'remove-stage'; stageId: string }
  | { id: string; type: 'align'; state: SupportState }
  | { id: string; type: 'misalign'; state: Exclude<SupportState, 'supported'> }
  | { id: string; type: 'set-time'; minutes: number }
  | { id: string; type: 'change-crown-position'; position: CrownPosition }
  | { id: string; type: 'set-oscillator'; frequencyHz: number; amplitudeDegrees: number }
  | { id: string; type: 'step-escapement'; direction?: 1 | -1 }
  | { id: string; type: 'scrub-escapement'; phaseIndex: number }
  | { id: string; type: 'set-escapement-speed'; multiplier: number }
  | { id: string; type: 'pause-escapement'; paused: boolean }
  | { id: string; type: 'pause-oscillator'; paused: boolean }
  | { id: string; type: 'set-hairspring-active-length'; normalizedLength: number }
  | { id: string; type: 'enable-automatic'; reversal: 'unidirectional' | 'bidirectional' }
  | { id: string; type: 'disable-automatic' }
  | { id: string; type: 'advance-calendar'; days: number }
  | { id: string; type: 'introduce-fault'; fault: MechanicalFault['kind'] }
  | { id: string; type: 'inspect'; entityId: string }
  | { id: string; type: 'project-enable-subsystem'; subsystem: MechanicalSubsystem }
  | { id: string; type: 'project-record-decision'; decision: string }
  | { id: string; type: 'restore'; snapshot: MechanicalLabSnapshot }
  | { id: string; type: 'undo' }

export interface MechanicalLabAccessibilityModel {
  orderedSubsystems: MechanicalSubsystem[]
  commands: Array<{ type: MechanicalLabCommand['type']; label: string; keyboardShortcut: string; requiresDrag: false }>
  textualRelations: string[]
  textualEnergyGraph: string[]
  staticEscapementPhases: Array<{ index: number; phase: EscapementPhase; description: string }>
  reducedMotion: { discreteStates: true; sameResults: true; automaticMotion: false }
}
