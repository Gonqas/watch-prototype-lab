export type Stage5CurriculumStatus = 'unimplemented' | 'implemented-method' | 'implemented-source-limited' | 'implemented-project-input-required' | 'complete-method'
export type IntegrationProjectStatus = 'draft' | 'source-needed' | 'measurement-needed' | 'conflict-found' | 'documentally-compatible' | 'physical-validation-pending' | 'rejected'
export type ProjectDataStatus = 'not-evaluated' | 'source-needed' | 'measurement-needed' | 'conflict-found' | 'documentally-compatible' | 'physical-validation-pending'
export type DataAuthority =
  | 'official-manufacturer'
  | 'official-component-supplier'
  | 'manufacturer-drawing'
  | 'supplier-technical-sheet'
  | 'measured-own-component'
  | 'derived-from-verified-inputs'
  | 'secondary-reference'
  | 'estimated'
  | 'visual-match-only'
  | 'unknown'

export type DimensionUnit = 'mm' | 'deg' | 'count' | 'unknown'
export type DimensionVerificationStatus = 'verified-primary' | 'visually-verified' | 'measured' | 'derived' | 'estimated' | 'unknown'
export type IntegrationComponentCategory =
  | 'movement' | 'case' | 'movement-holder' | 'stem' | 'crown' | 'tube' | 'dial'
  | 'hand-hour' | 'hand-minute' | 'hand-second' | 'crystal' | 'bezel' | 'rehaut'
  | 'caseback' | 'gasket' | 'donor-part' | 'other'
export type ComponentModificationStatus = 'unmodified' | 'modification-planned' | 'modified-externally' | 'unknown'
export type CompatibilityResult = 'not-evaluated' | 'source-needed' | 'measurement-needed' | 'compatible-on-paper' | 'incompatible' | 'conditional' | 'physical-validation-pending'

export interface TraceableDimension {
  dimensionId: string
  componentId: string
  name: string
  value?: number
  unit: DimensionUnit
  nominal?: number
  minimum?: number
  maximum?: number
  tolerance?: { minus: number; plus: number }
  datum?: string
  measurementDirection?: string
  measurementMethod?: string
  instrument?: string
  instrumentResolution?: number
  uncertainty?: number
  sourceId?: string
  sourceLocator?: string
  applicability: string
  verificationStatus: DimensionVerificationStatus
  originalValue?: number
  originalUnit?: DimensionUnit
  normalizedValue?: number
  conversionRule?: string
  derivedFromDimensionIds?: readonly string[]
  staleBecauseInputChanged?: boolean
  notes: string
}

export interface IntegrationComponent {
  componentId: string
  category: IntegrationComponentCategory
  manufacturer: string
  supplier: string
  reference: string
  variant: string
  condition: string
  sourceType: DataAuthority
  donorOrigin?: string
  documentIds: string[]
  dimensionIds: string[]
  material: string
  modificationStatus: ComponentModificationStatus
  reversibility: 'reversible' | 'conditional' | 'irreversible' | 'unknown'
  notes: string
}

export interface IntegrationDocument {
  documentId: string
  componentIds: string[]
  title: string
  authority: DataAuthority
  sourceId?: string
  locator: string
  editionOrDate?: string
  applicableReference?: string
  verificationStatus: 'verified' | 'source-limited' | 'unverified'
  notes: string
}

export interface IntegrationMeasurement {
  measurementId: string
  dimensionId: string
  measuredAt?: string
  instrument: string
  instrumentResolution?: number
  repeats: number[]
  unit: DimensionUnit
  environmentalNotes: string
  operatorNotes: string
}

export interface WatchRequirement {
  requirementId: string
  category: 'use' | 'size' | 'indication' | 'movement' | 'environment' | 'cost' | 'maintenance' | 'aesthetic' | 'reversibility' | 'donor-policy'
  statement: string
  metric?: string
  priority: 'must' | 'should' | 'could'
  verificationMethod: string
  status: 'draft' | 'verifiable' | 'unknown'
}

export interface CompatibilityInterface {
  interfaceId: string
  componentA: string
  componentB: string
  question: string
  requiredData: string[]
  availableData: string[]
  checkMethod: 'fit' | 'clearance' | 'alignment' | 'document-comparison' | 'dynamic-envelope'
  result: CompatibilityResult
  confidence: 'high' | 'medium' | 'low'
  unknowns: string[]
  sourceIds: string[]
  decision: string
}

export interface DimensionalChainMember {
  memberId: string
  dimensionId: string
  sign: 1 | -1
  role: string
}

export interface DimensionalChain {
  chainId: string
  name: string
  datum: string
  direction: 'radial' | 'axial' | 'angular'
  members: DimensionalChainMember[]
  operations: string[]
  result?: number
  margin?: number
  unit: DimensionUnit
  uncertainty?: number
  status: 'not-evaluated' | 'unknown' | 'calculated' | 'conflict-found' | 'datum-conflict'
  unknowns: string[]
}

export interface InterferenceCheck {
  checkId: string
  kind: 'static' | 'dynamic'
  componentIds: string[]
  statesEvaluated: string[]
  statesOmitted: string[]
  requiredDimensionIds: string[]
  result: 'input-incomplete' | 'conflict-detected' | 'no-conflict-in-represented-model' | 'physical-validation-pending'
  clearance?: number
  unknowns: string[]
  limitations: string[]
}

export interface DonorComponentAudit {
  donorAuditId: string
  donorComponentId: string
  receiverComponentId: string
  identityEvidence: string[]
  interfaceIds: string[]
  provenance: string
  reversibility: 'reversible' | 'conditional' | 'irreversible' | 'unknown'
  plannedModification: boolean
  result: 'source-needed' | 'measurement-needed' | 'conditional' | 'incompatible' | 'physical-validation-pending'
  notes: string
}

export interface AssemblyPlanStep {
  stepId: string
  order: number
  title: string
  dependencyStepIds: string[]
  requiredInterfaceIds: string[]
  checkpoint: string
  stopCondition: string
  rollback: string
  executionStatus: 'planned-only' | 'physical-validation-pending'
}

export interface IntegrationClaim {
  claimId: string
  claim: string
  kind: 'requirement' | 'dimension' | 'compatibility' | 'calculation' | 'limitation' | 'decision'
  authority: DataAuthority
  sourceIds: string[]
  dimensionIds: string[]
  interfaceIds: string[]
  verificationStatus: 'verified' | 'source-limited' | 'unknown'
  limitations: string[]
}

export interface IntegrationDecision {
  decisionId: string
  question: string
  outcome: string
  evidenceIds: string[]
  alternatives: string[]
  reversible: boolean
  status: 'draft' | 'accepted' | 'rejected' | 'needs-data'
}

export interface WatchIntegrationProject {
  projectId: string
  schemaVersion: 1
  revision: number
  profileId: string
  linkedWatchProjectId?: string
  title: string
  createdAt: string
  updatedAt: string
  movement?: string
  case?: string
  movementHolder?: string
  stem?: string
  crown?: string
  tube?: string
  dial?: string
  hands: string[]
  crystal?: string
  bezelOrRehaut?: string
  caseback?: string
  gaskets: string[]
  donorComponents: DonorComponentAudit[]
  components: IntegrationComponent[]
  documents: IntegrationDocument[]
  dimensions: TraceableDimension[]
  measurements: IntegrationMeasurement[]
  requirements: WatchRequirement[]
  interfaces: CompatibilityInterface[]
  compatibilityChecks: CompatibilityInterface[]
  dimensionalChains: DimensionalChain[]
  interferenceChecks: InterferenceCheck[]
  assemblyPlan: AssemblyPlanStep[]
  verificationPlan: string[]
  claims: IntegrationClaim[]
  unknowns: string[]
  conflicts: string[]
  decisions: IntegrationDecision[]
  waterResistanceStatus: 'not-verified' | 'test-pending' | 'documented-test-result'
  status: IntegrationProjectStatus
}

const emptyComponent = (componentId: string, category: IntegrationComponentCategory): IntegrationComponent => ({
  componentId, category, manufacturer: '', supplier: '', reference: '', variant: '', condition: 'desconocido',
  sourceType: 'unknown', documentIds: [], dimensionIds: [], material: '', modificationStatus: 'unknown',
  reversibility: 'unknown', notes: '',
})

export function createEmptyIntegrationProject(profileId: string, now = new Date().toISOString(), projectId = `integration.${crypto.randomUUID()}`): WatchIntegrationProject {
  const categories: IntegrationComponentCategory[] = ['movement','case','movement-holder','stem','crown','tube','dial','hand-hour','hand-minute','hand-second','crystal','bezel','rehaut','caseback','gasket']
  const components = categories.map((category) => emptyComponent(`component.${category}`, category))
  return {
    projectId, schemaVersion: 1, revision: 1, profileId, title: 'Proyecto de integración sin datos', createdAt: now, updatedAt: now,
    movement: 'component.movement', case: 'component.case', movementHolder: 'component.movement-holder', stem: 'component.stem',
    crown: 'component.crown', tube: 'component.tube', dial: 'component.dial', hands: ['component.hand-hour','component.hand-minute','component.hand-second'],
    crystal: 'component.crystal', bezelOrRehaut: 'component.rehaut', caseback: 'component.caseback', gaskets: ['component.gasket'],
    donorComponents: [], components, documents: [], dimensions: [], measurements: [], requirements: [],
    interfaces: [], compatibilityChecks: [], dimensionalChains: [], interferenceChecks: [], assemblyPlan: [], verificationPlan: [], claims: [],
    unknowns: ['documentación del movimiento', 'dimensiones de las interfaces críticas'], conflicts: [], decisions: [],
    waterResistanceStatus: 'not-verified', status: 'source-needed',
  }
}

export function integrationProjectCanBeDocumentallyCompatible(project: WatchIntegrationProject): boolean {
  const critical = project.compatibilityChecks.filter(({ interfaceId }) => !interfaceId.includes('donor'))
  return critical.length >= 18
    && critical.every(({ result, unknowns }) => ['compatible-on-paper','conditional','physical-validation-pending'].includes(result) && unknowns.length === 0)
    && project.conflicts.length === 0
}

export function deriveIntegrationProjectStatus(project: WatchIntegrationProject): IntegrationProjectStatus {
  if (project.conflicts.length || project.compatibilityChecks.some(({ result }) => result === 'incompatible')) return 'conflict-found'
  if (project.compatibilityChecks.some(({ result }) => result === 'source-needed')) return 'source-needed'
  if (project.compatibilityChecks.some(({ result }) => result === 'measurement-needed')) return 'measurement-needed'
  if (integrationProjectCanBeDocumentallyCompatible(project)) return 'documentally-compatible'
  return project.compatibilityChecks.length ? 'physical-validation-pending' : 'draft'
}

export function convertTraceableDimension(dimension: TraceableDimension, normalizedValue: number, normalizedUnit: DimensionUnit, conversionRule: string): TraceableDimension {
  if (dimension.value === undefined) throw new Error('No se puede convertir una dimensión desconocida.')
  return { ...dimension, originalValue: dimension.value, originalUnit: dimension.unit, normalizedValue, conversionRule, value: normalizedValue, unit: normalizedUnit }
}

export function replaceTraceableDimension(project: WatchIntegrationProject, replacement: TraceableDimension): WatchIntegrationProject {
  const changed = project.dimensions.find(({dimensionId}) => dimensionId === replacement.dimensionId)
  const inputChanged = changed?.value !== replacement.value || changed?.unit !== replacement.unit || changed?.datum !== replacement.datum
  return {
    ...structuredClone(project),
    dimensions: project.dimensions.map((dimension) => dimension.dimensionId === replacement.dimensionId
      ? structuredClone(replacement)
      : inputChanged && dimension.derivedFromDimensionIds?.includes(replacement.dimensionId)
        ? { ...structuredClone(dimension), staleBecauseInputChanged: true, verificationStatus: 'unknown' as const }
        : structuredClone(dimension)),
  }
}
