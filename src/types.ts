export type DataQuality =
  | 'official_complete'
  | 'official_partial'
  | 'supplier_partial'
  | 'measured_by_user'
  | 'estimated'
  | 'unknown'
  | 'visual_only'

export type Reliability = 'Alta' | 'Media' | 'Baja' | 'Pendiente de medir'

export type GeneralStatus = 'OK' | 'JUSTO' | 'EXPERIMENTAL' | 'MAL'

export type RenderMode = 'beauty' | 'technical'

export type ExperienceMode = 'dashboard' | 'technical_workshop' | 'visual_studio' | 'library'

export type StudioViewMode = 'design' | 'technical' | 'presentation'

export type VisualReflectionLevel = 'high' | 'medium' | 'low' | 'off'

export type MaterialId =
  | 'polished_steel'
  | 'brushed_steel'
  | 'pvd_black'
  | 'visual_titanium'
  | 'black_ceramic'
  | 'gold_tone'
  | 'dial_matte'
  | 'dial_satin'
  | 'dial_gloss'
  | 'dial_metallic'
  | 'dial_enamel'
  | 'dial_sunburst'
  | 'dial_grain'
  | 'dial_radial_brushed'
  | 'resin'
  | 'ceramic'
  | 'transparent_crystal'
  | 'tinted_crystal'
  | 'soft_reflection_crystal'
  | 'domed_visual_crystal'
  | 'box_visual_crystal'
  | 'polished_hands'
  | 'brushed_hands'
  | 'black_hands'
  | 'gold_hands'
  | 'lacquered_hands'
  | 'lume_hands'

export interface MaterialPreset {
  id: MaterialId
  label: string
  family: 'metal' | 'dial' | 'polymer' | 'ceramic' | 'glass' | 'hands'
  color: string
  metalness: number
  roughness: number
  opacity?: number
  clearcoat?: number
  transmission?: number
}

export interface WatchMaterials {
  caseMaterial: MaterialId
  dialMaterial: MaterialId
  handsMaterial: MaterialId
  crystalMaterial: MaterialId
}

export type TechnicalSourceKind =
  | 'official_drawing'
  | 'official_sheet'
  | 'official_manual'
  | 'supplier_listing'
  | 'imported_stl'
  | 'academic_reference'
  | 'user_measurement'

export interface TechnicalSource {
  id: string
  label: string
  kind: TechnicalSourceKind
  fileName: string
  dataQuality: DataQuality
  notes: string
}

export interface CoordinateSpec {
  id: string
  label: string
  x: number
  y: number
  radius?: number
  sourceId: string
  dataQuality: DataQuality
}

export interface ToleranceSpec {
  nominal: number
  plus: number
  minus: number
  sourceId: string
  dataQuality: DataQuality
}

export type WorkbenchMode = 'assemble' | 'stack_lab' | 'dial_lab' | 'hands_lab' | 'xray' | 'risk_lab' | 'measure'

export type FocusMode = 'assembly' | 'ghost' | 'isolate' | 'workshop'

export type EditorTool = 'move' | 'size' | 'height' | 'depth' | 'radius' | 'curve'

export type SelectablePart =
  | 'movement'
  | 'case'
  | 'dial'
  | 'crystal'
  | 'stem'
  | 'crown'
  | 'hourHand'
  | 'minuteHand'
  | 'secondHand'
  | `relief:${string}`

export type LabPreset = 'baseline' | 'sunken_dial' | 'two_hand_clearance' | 'relief_stress' | 'box_crystal'

export type ProjectTemplateId =
  | 'blank_2035'
  | 'wp24_supplier_assembly'
  | 'dial_sunken_experiment'
  | 'two_hand_clearance'
  | 'relief_stress'
  | 'printable_dial_candidate'

export interface ProjectTemplate {
  id: ProjectTemplateId
  label: string
  detail: string
  workbench: WorkbenchMode
  focus: FocusMode
  selectedPart: SelectablePart
}

export type SmartAction =
  | 'lower_selected_relief'
  | 'raise_minute_hand'
  | 'disable_seconds'
  | 'box_crystal'
  | 'add_sunken_center'
  | 'flatten_dial'

export interface ExperimentSlot {
  id: 'A' | 'B' | 'C'
  label: string
  design: WatchDesign | null
  savedAt: string | null
}

export type ViewMode =
  | 'free'
  | 'front'
  | 'side'
  | 'section'
  | 'transparent'
  | 'exploded'
  | 'layers'
  | 'sweep'
  | 'heatmap'

export type PanelTab =
  | 'movement'
  | 'case'
  | 'dial'
  | 'hands'
  | 'crystal'
  | 'stem'
  | 'validation'
  | 'opportunities'
  | 'presets'
  | 'measurements'

export type CaseShape = 'round' | 'square' | 'cushion' | 'tonneau' | 'rectangular'

export type CrystalType = 'flat' | 'domed' | 'box'

export type DialTransition = 'soft_bowl' | 'hard_step' | 'ramp' | 'raised_outer_ring' | 'hybrid'

export type ReliefType = 'circle' | 'line' | 'rect' | 'marker'

export type DialVisualTexture =
  | 'none'
  | 'sunburst'
  | 'fine_grain'
  | 'radial_brush'
  | 'horizontal_brush'
  | 'sector'
  | 'sandwich'

export type HandVisualStyle =
  | 'dauphine'
  | 'baton'
  | 'sword'
  | 'leaf'
  | 'syringe'
  | 'skeleton'
  | 'pencil'
  | 'alpha'
  | 'second_needle'
  | 'second_lollipop'
  | 'second_baton'
  | 'custom'

export type ReliefVisualRole =
  | 'index'
  | 'minute'
  | 'numeral'
  | 'logo'
  | 'texture'
  | 'chapter'
  | 'sector'
  | 'relief'

export interface GeometryEnvelope {
  width: number
  height: number
  basis: string
}

export interface MovementSpec {
  id: string
  calibre: string
  type: string
  function: string
  sizeLabel: string
  height: number
  accuracy: string
  battery: string
  batteryLifeYears: number
  standardStem: string
  stemPosition: '3H'
  crownPositions: string[]
  balanceWeight: {
    minute: number
    second: number
    unit: string
  }
  handFitting: {
    hour: number
    minute: number
    second: number
  }
  handFittingTolerance: {
    hour: ToleranceSpec
    minute: ToleranceSpec
    second: ToleranceSpec
  }
  handStackProfile: {
    label: string
    hourHeightOverDial: number
    minuteHeightOverDial: number
    secondHeightOverDial: number
    sourceId: string
    dataQuality: DataQuality
    notes: string
  }
  stemAxisHeight: number
  clearances: {
    handToCaseOfficialMin: number
    handToCaseOfficialMax: number
    movementToCaseMin: number
  }
  commercialSpecSilhouette: GeometryEnvelope
  casingFrameEnvelope: GeometryEnvelope
  casingCoordinateTable: CoordinateSpec[]
  sourceIds: string[]
  pendingFields: string[]
  dataQuality: DataQuality
}

export interface DialPreset {
  id: string
  label: string
  supplier: string
  compatibleMovementIds: string[]
  commercialDiameter: number
  thickness?: number
  centerHole?: number
  color: string
  sourceId: string
  missingData: string[]
  dataQuality: DataQuality
}

export interface TechnicalDialPreset {
  id: string
  label: string
  movementId: string
  standardThickness: number
  thicknessTolerance: number
  centerHole: number
  centerHoleTolerance: number
  dialFeet: string[]
  dialFootDiameter: number
  dialFootTolerance: number
  dialFeetCoordinates: CoordinateSpec[]
  minimumCommercialDiameterForFeet: number
  stemReference: '3H'
  sourceIds: string[]
  dataQuality: DataQuality
}

export interface ReferenceGeometry {
  id: string
  label: string
  kind: 'movement_holder' | 'case' | 'dial' | 'bezel' | 'back' | 'crown' | 'adapter'
  sourceId: string
  sourceFile: string
  dimensions: {
    x: number
    y: number
    z: number
  }
  compatibleMovementIds: string[]
  usableForCollision: boolean
  notes: string[]
  dataQuality: DataQuality
}

export interface AssemblyStep {
  id: string
  order: number
  label: string
  partIds: SelectablePart[]
  validationFocus: string
  dataQuality: DataQuality
}

export interface CasePreset {
  id: string
  label: string
  supplier: string
  compatibleDeclared?: string
  shape: CaseShape
  outerDiameter: number
  totalHeight: number
  lugWidth: number
  crownDiameter: number
  crownTubeDiameter: number
  crownThread: string
  innerDiameter: number
  screwCrown?: boolean
  includes: string[]
  missingData: string[]
  dataQuality: DataQuality
}

export interface CrystalPreset {
  id: string
  label: string
  associatedCaseIds: string[]
  type: CrystalType
  profile: string
  thickness: number
  usableInteriorHeight: number
  diameter: number
  dataQuality: DataQuality
}

export interface StemSpec {
  id: string
  label: string
  thread: string
  pitch: number
  sectionDiameter: number
  squareSection?: number
  shoulderDiameter: number
  threadLength?: number
  shoulderLength?: number
  drawnLength: number
  sourceIds?: string[]
  dataQuality: DataQuality
}

export interface HandsPreset {
  id: string
  label: string
  supplier?: string
  familyId: string
  type: string
  material: string
  priceSeen?: string
  hour?: Partial<HandConfig> & { holeSize: number; length: number }
  minute?: Partial<HandConfig> & { holeSize: number; length: number }
  second?: Partial<HandConfig> & { holeSize: number; length: number }
  compatibility: string
  missingData: string[]
  dataQuality: DataQuality
}

export interface HandCurvature {
  baseHeight: number
  midHeight: number
  tipHeight: number
  startRatio: number
  endRatio: number
  transition: 'linear' | 'soft' | 'stepped'
  bridge: boolean
  stepHeight: number
}

export interface HandConfig {
  holeSize: number
  length: number
  width: number
  thickness: number
  heightOverDial: number
  color: string
  material: string
  tubeHeight: number
  outerTubeDiameter: number
  curvature: HandCurvature
  visualStyle?: HandVisualStyle
  tipWidth?: number
  tailLength?: number
  counterweight?: boolean
  lume?: boolean
  skeletonized?: boolean
  dataQuality: DataQuality
}

export interface ReliefFeature {
  id: string
  label: string
  type: ReliefType
  x: number
  y: number
  radius: number
  width: number
  length: number
  height: number
  color: string
  material: string
  rotationDeg?: number
  text?: string
  visualRole?: ReliefVisualRole
  visualStyle?: string
  opacity?: number
  generatedByPreset?: string
  dataQuality: DataQuality
}

export interface CaseConfig {
  presetId: string
  shape: CaseShape
  outerDiameter: number
  totalHeight: number
  interiorHeightAvailable: number
  bezelThickness: number
  wallThickness: number
  backThickness: number
  backShape: 'flat' | 'stepped' | 'snap' | 'screw'
  innerDiameter: number
  dialSeatDiameter: number
  crownPositionDeg: number
  crownTubeDiameter: number
  crownThread: string
  crownDiameter: number
  crownDistanceFromCenter: number
  lugWidth: number
  screwCrown: boolean
  transparent: boolean
  visible: boolean
  holderHeight: number
  dataQuality: DataQuality
}

export interface CrystalConfig {
  presetId: string
  type: CrystalType
  thickness: number
  usableInteriorHeight: number
  diameter: number
  profile: string
  transparency: number
  visible: boolean
  dataQuality: DataQuality
}

export interface DialConfig {
  technicalPresetId: string
  commercialDiameter: number
  thickness: number
  centerHole: number
  outerShape: CaseShape
  sunkenCenter: boolean
  sunkenDepth: number
  sunkenRadius: number
  transition: DialTransition
  outerRingHeight: number
  showDialFeet: boolean
  showSweepZone: boolean
  visualColor?: string
  visualAccentColor?: string
  visualTexture?: DialVisualTexture
  reliefs: ReliefFeature[]
  dataQuality: DataQuality
}

export interface HandsConfig {
  presetId: string
  familyId: string
  count: 2 | 3
  secondsEnabled: boolean
  sweepColor: string
  hour: HandConfig
  minute: HandConfig
  second: HandConfig
  dataQuality: DataQuality
}

export interface StemConfig {
  selectedStemId: string
  customLength: number
  visible: boolean
  crownInstalled: boolean
  dataQuality: DataQuality
}

export interface Measurements {
  case: Record<string, string | number>
  hands: Record<string, string | number>
  dial: Record<string, string | number>
}

export interface WatchDesign {
  schemaVersion: 1
  id: string
  name: string
  createdAt: string
  updatedAt: string
  notes: string
  movementId: string
  movementRotationDeg: number
  renderMode: RenderMode
  viewMode: ViewMode
  materials: WatchMaterials
  case: CaseConfig
  crystal: CrystalConfig
  dial: DialConfig
  hands: HandsConfig
  stem: StemConfig
  measurements: Measurements
}

export type WorkshopPartKind = 'movement' | 'case' | 'dial' | 'hands' | 'crystal' | 'stem' | 'relief'

export interface WorkshopSavedPart {
  id: string
  label: string
  kind: WorkshopPartKind
  createdAt: string
  dataQuality: DataQuality
  payload: unknown
}

export type FindingSeverity = 'ok' | 'warning' | 'experimental' | 'bad' | 'opportunity'

export interface ValidationFinding {
  id: string
  severity: FindingSeverity
  title: string
  message: string
  pieceIds: string[]
  reliability: Reliability
  dataQuality: DataQuality
  recoverable?: boolean
}

export interface Opportunity {
  id: string
  title: string
  zone: string
  limiter: string
  margin: number | null
  suggestion: string
  basis: DataQuality
  reliability: Reliability
}

export interface ClearanceZone {
  id: string
  label: string
  radiusStart: number
  radiusEnd: number
  angleStartDeg?: number
  angleEndDeg?: number
  status: 'safe' | 'tight' | 'opportunity' | 'collision'
  value: number
}

export type VariantKind = 'current' | 'two_hand' | 'box_crystal' | 'relief_recover' | 'miyota_2036'

export interface VariantSummary {
  id: VariantKind
  label: string
  detail: string
  design: WatchDesign
  status: GeneralStatus
  crystalClearance: number
  minimumClearance: number
  conflicts: number
  opportunities: number
  tradeoff: string
}

export interface ValidationMetrics {
  totalHeight: number
  crystalClearance: number
  dialCenterDepth: number
  minimumClearance: number
  activeConflicts: number
  opportunitiesDetected: number
  movementCaseClearance: number
  dialCaseClearance: number
  handCaseClearance: number
  crystalRadialClearance: number
  dialFootCoverageClearance: number
  dialStructuralFloor: number
  dialOuterSupportWidth: number
  maxHandTop: number
  crystalInnerTop: number
}

export interface ValidationResult {
  status: GeneralStatus
  metrics: ValidationMetrics
  findings: ValidationFinding[]
  opportunities: Opportunity[]
  zones: ClearanceZone[]
  conflictIds: Set<string>
}

export const DATA_QUALITY_LABELS: Record<DataQuality, string> = {
  official_complete: 'Oficial completo',
  official_partial: 'Oficial parcial',
  supplier_partial: 'Proveedor parcial',
  measured_by_user: 'Medido por usuario',
  estimated: 'Estimado',
  unknown: 'Desconocido',
  visual_only: 'Solo visual',
}

export const VIEW_LABELS: Record<ViewMode, string> = {
  free: 'Libre',
  front: 'Frontal',
  side: 'Lateral',
  section: 'Seccion',
  transparent: 'Transparente',
  exploded: 'Explotada',
  layers: 'Capas',
  sweep: 'Barrido',
  heatmap: 'Zonas',
}

export const TAB_LABELS: Record<PanelTab, string> = {
  movement: 'Movimiento',
  case: 'Caja',
  dial: 'Dial',
  hands: 'Agujas',
  crystal: 'Cristal',
  stem: 'Corona/tija',
  validation: 'Validación',
  opportunities: 'Zonas grises',
  presets: 'Presets',
  measurements: 'Mediciones propias',
}

export const WORKBENCH_LABELS: Record<WorkbenchMode, string> = {
  assemble: 'Montaje',
  stack_lab: 'Stack Lab',
  dial_lab: 'Dial Lab',
  hands_lab: 'Agujas',
  xray: 'Rayos X',
  risk_lab: 'Riesgo',
  measure: 'Medir',
}

export const FOCUS_LABELS: Record<FocusMode, string> = {
  assembly: 'Montado',
  ghost: 'Fantasma',
  isolate: 'Solo',
  workshop: 'Taller',
}

export const PART_LABELS: Record<Exclude<SelectablePart, `relief:${string}`>, string> = {
  movement: 'Movimiento',
  case: 'Caja',
  dial: 'Dial',
  crystal: 'Cristal',
  stem: 'Tija',
  crown: 'Corona',
  hourHand: 'Aguja horaria',
  minuteHand: 'Minutera',
  secondHand: 'Segundero',
}
