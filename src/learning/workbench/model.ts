import type { FidelityProfile } from '../fidelity'
import type { ReconstructionLevel, ReconstructionState } from '../technical/reconstruction'

export const workbenchPartStateValues = [
  'installed',
  'exposed',
  'selected',
  'loosened',
  'removed',
  'inspected',
  'placed-in-tray',
  'ready-to-install',
  'aligned',
  'installed-unverified',
  'installed-verified',
  'blocked',
  'unknown',
] as const

export type WorkbenchPartState = (typeof workbenchPartStateValues)[number]
export type PracticeMode = 'guided' | 'assisted' | 'free'

export type ToolCapability =
  | 'hold-movement'
  | 'engage-fastener'
  | 'loosen-fastener'
  | 'tighten-fastener'
  | 'pick-part'
  | 'place-part'
  | 'rotate-part'
  | 'remove-hands'
  | 'install-hands'
  | 'inspect'
  | 'remove-loose-dust'
  | 'measure-dimension'
  | 'check-electrical-conceptually'

export interface WorkbenchTool {
  id: string
  label: string
  capabilities: ToolCapability[]
  limitations: string[]
  accessibleOperation: string
}

export interface WorkbenchZone {
  id: string
  label: string
  kind: 'movement' | 'tool' | 'tray' | 'inspection' | 'documentation'
  safe: boolean
  warning?: string
}

export interface TrayZone {
  id: string
  label: string
  order: number
  subsystem?: string
  instanceIds: string[]
  warning?: string
}

export interface WorkbenchPart {
  instanceId: string
  definitionId: string
  label: string
  accessibleLabel: string
  officialReference?: string
  subsystem: string
  sourceIds: string[]
  fastener: boolean
  interfacePlaceholder: boolean
  reconstructionLevel: ReconstructionLevel
  reconstructionState: ReconstructionState
  fidelity: FidelityProfile
  limitations: string[]
  state: WorkbenchPartState
  orientation: 'as-installed' | 'top-up' | 'bottom-up' | 'rotated' | 'unknown'
  trayZoneId?: string
  removalSequence?: number
  note?: string
}

export type WorkbenchDependencyKind =
  | 'remove-before'
  | 'remove-after'
  | 'requires-removed'
  | 'requires-present'
  | 'supports'
  | 'covers'
  | 'retains'
  | 'fastened-by'
  | 'align-before-install'
  | 'inspect-before-close'
  | 'verify-after-install'

export type DependencyAuthority =
  | 'officially-documented'
  | 'structural'
  | 'educational'
  | 'inferred'
  | 'unverified'

export interface WorkbenchDependency {
  id: string
  phase: 'disassembly' | 'assembly'
  kind: WorkbenchDependencyKind
  beforeInstanceId: string
  afterInstanceId: string
  authority: DependencyAuthority
  sourceIds: string[]
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  blocking: boolean
  limitations: string[]
}

export interface WorkbenchObservation {
  id: string
  instanceId?: string
  classification: 'memory' | 'observation' | 'photograph' | 'inference' | 'official-source' | 'unknown'
  text: string
  sourceIds: string[]
  createdAt: string
}

export interface WorkbenchEvent {
  sequence: number
  timestamp: string
  type:
    | 'workbench-prepared'
    | 'tool-selected'
    | 'energy-isolated'
    | 'part-selected'
    | 'part-loosened'
    | 'part-removed'
    | 'part-rotated'
    | 'part-placed-in-tray'
    | 'part-aligned'
    | 'part-installed'
    | 'part-verified'
    | 'part-inspected'
    | 'observation-recorded'
    | 'checkpoint-created'
    | 'snapshot-restored'
    | 'operation-cancelled'
    | 'workbench-command-rejected'
  commandId: string
  instanceId?: string
  toolId?: string
  mode: PracticeMode
  diagnosticCodes: string[]
  evidence: Record<string, string | number | boolean | string[] | null>
}

export interface WorkbenchSnapshot {
  schemaVersion: 1
  fixtureId: string
  fixtureVersion: string
  mode: PracticeMode
  prepared: boolean
  energyIsolated: boolean
  selectedToolId?: string
  selectedInstanceId?: string
  activeStepId?: string
  parts: WorkbenchPart[]
  trayZones: TrayZone[]
  observations: WorkbenchObservation[]
  warnings: string[]
  events: WorkbenchEvent[]
  nextSequence: number
  createdAt: string
}

export interface WorkbenchAccessibilityModel {
  orderedZoneIds: string[]
  orderedToolIds: string[]
  orderedPartIds: string[]
  actionMenu: Array<{
    id: string
    label: string
    keyboardShortcut: string
    requiresDrag: false
  }>
  trayRows: Array<{
    zoneId: string
    label: string
    partLabels: string[]
  }>
  reducedMotion: {
    automaticMotion: false
    discreteStateChanges: true
    sameEvaluation: true
  }
}

export interface WorkbenchDiagnostic {
  code: string
  message: string
  blocking: boolean
  instanceId?: string
  dependencyId?: string
}

export interface WorkbenchCommandResult {
  accepted: boolean
  event: WorkbenchEvent
  diagnostics: WorkbenchDiagnostic[]
}

export type HandlingCommand =
  | { id: string; type: 'prepare-workbench' }
  | { id: string; type: 'select-tool'; toolId: string }
  | { id: string; type: 'isolate-energy' }
  | { id: string; type: 'select-part'; instanceId: string }
  | { id: string; type: 'loosen-fastener'; instanceId: string; toolId: string; fitConfirmed: boolean }
  | { id: string; type: 'remove-part'; instanceId: string; toolId: string }
  | { id: string; type: 'rotate-part'; instanceId: string; toolId: string; orientation: WorkbenchPart['orientation'] }
  | { id: string; type: 'place-in-tray'; instanceId: string; toolId: string; trayZoneId: string; note?: string }
  | { id: string; type: 'align-part'; instanceId: string; toolId: string; orientation: WorkbenchPart['orientation'] }
  | { id: string; type: 'install-part'; instanceId: string; toolId: string }
  | { id: string; type: 'tighten-fastener'; instanceId: string; toolId: string; fitConfirmed: boolean }
  | { id: string; type: 'verify-part'; instanceId: string }
  | { id: string; type: 'inspect-part'; instanceId: string; toolId: string }
  | { id: string; type: 'record-observation'; observation: Omit<WorkbenchObservation, 'id' | 'createdAt'> }
  | { id: string; type: 'create-checkpoint'; stepId?: string }
  | { id: string; type: 'restore-snapshot'; snapshot: WorkbenchSnapshot }
  | { id: string; type: 'cancel-operation'; reason: string }
