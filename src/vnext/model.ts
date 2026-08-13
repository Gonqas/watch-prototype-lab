export type DataQuality =
  | 'official_complete'
  | 'official_partial'
  | 'supplier_partial'
  | 'designed'
  | 'measured_by_user'
  | 'estimated'
  | 'unknown'
  | 'visual_only'

export type Reliability = 'high' | 'medium' | 'low' | 'pending'

export type UncertaintyDistribution = 'fixed' | 'uniform' | 'normal' | 'worst_case'

export interface SourceReference {
  id: string
  title: string
  locator?: string
  retrievedAt?: string
}

export interface Dimension {
  value: number | null
  minus: number
  plus: number
  unit: 'mm' | 'deg' | 'h' | 'vph' | 'count'
  quality: DataQuality
  source: string
  distribution?: UncertaintyDistribution
  sourceRef?: SourceReference
  critical?: boolean
  locked?: boolean
}

export type Workspace = 'assembly' | 'parts' | 'movement' | 'analysis' | 'manufacturing' | 'library' | 'learning'
export type ViewMode = 'assembled' | 'isolate' | 'exploded' | 'section'
export type RenderMode = 'technical' | 'beauty' | 'presentation'
export type PresentationQuality = 'draft' | 'studio' | 'ultra'
export type WatchPartId =
  | 'case'
  | 'back'
  | 'bezel'
  | 'rehaut'
  | 'strap'
  | 'clasp'
  | 'springBar'
  | 'dialGraphics'
  | 'movement'
  | 'plate'
  | 'bridge'
  | 'barrel'
  | 'center'
  | 'third'
  | 'fourth'
  | 'escape'
  | 'balance'
  | 'pallet'
  | 'hairspring'
  | 'mainspring'
  | 'jewel'
  | 'keyless'
  | 'rotor'
  | 'dial'
  | 'hourHand'
  | 'minuteHand'
  | 'secondHand'
  | 'crystal'
  | 'stem'
  | 'crown'
  | 'holder'
  | 'gasket'

export type SurfaceMaterial =
  | 'stainless-steel'
  | 'titanium'
  | 'black-pvd'
  | 'yellow-gold'
  | 'rose-gold'
  | 'brass'
  | 'ceramic'
  | 'sapphire'
  | 'leather'
  | 'rubber'
  | 'fabric'

export type SurfaceFinish =
  | 'polished'
  | 'brushed-horizontal'
  | 'brushed-vertical'
  | 'brushed-radial'
  | 'bead-blasted'
  | 'matte'
  | 'sunburst'
  | 'stone'

export interface SurfaceAppearance {
  material: SurfaceMaterial
  finish: SurfaceFinish
  color: string
  metalness: number
  roughness: number
  clearcoat: number
  textureScale: number
  microScratches: number
}

export interface PresentationSpec {
  quality: PresentationQuality
  environment: 'design-neutral' | 'presentation-light' | 'softbox-dark' | 'showroom'
  background: 'studio-dark' | 'studio-light' | 'transparent' | 'marble' | 'concrete' | 'granite'
  exposure: number
  depthOfField: boolean
  showTechnicalOverlays: boolean
  caseSurface: SurfaceAppearance
  bezelSurface: SurfaceAppearance
  dialSurface: SurfaceAppearance
  handsSurface: SurfaceAppearance
  strapSurface: SurfaceAppearance
  lumeColor: string
  lumeIntensity: number
}

export interface ExteriorSpec {
  bezel: {
    enabled: boolean
    outerDiameter: Dimension
    innerDiameter: Dimension
    height: Dimension
    overhang: Dimension
    insertColor: string
  }
  rehaut: {
    enabled: boolean
    innerDiameter: Dimension
    outerDiameter: Dimension
    height: Dimension
    angle: Dimension
    color: string
  }
  strap: {
    kind: 'none' | 'leather' | 'rubber' | 'fabric' | 'bracelet'
    width: Dimension
    taperWidth: Dimension
    thickness: Dimension
    upperLength: Dimension
    lowerLength: Dimension
    color: string
    stitchColor: string
    linkLength: Dimension
    linkGap: Dimension
  }
  springBars: {
    diameter: Dimension
    length: Dimension
  }
  dialGraphics: {
    indicesEnabled: boolean
    indexCount: number
    indexShape: 'baton' | 'dot' | 'arabic' | 'roman'
    indexColor: string
    indexRadius: Dimension
    indexLength: Dimension
    indexWidth: Dimension
    indexHeight: Dimension
    minuteTrack: boolean
    brandText: string
    modelText: string
    dateWindow: boolean
    dateWindowX: Dimension
    dateWindowY: Dimension
    lumeEnabled: boolean
  }
}

export interface CaseSpec {
  shape: 'round' | 'cushion' | 'tonneau' | 'rectangular'
  material: 'steel' | 'titanium' | 'black-pvd' | 'brass'
  outerDiameter: Dimension
  innerDiameter: Dimension
  totalHeight: Dimension
  usableInteriorHeight: Dimension
  backThickness: Dimension
  wallThickness: Dimension
  dialSeatDiameter: Dimension
  crystalSeatDiameter: Dimension
  stemAxisZ: Dimension
  crownDistance: Dimension
  crownDiameter: Dimension
  crownTubeDiameter: Dimension
  lugSpacing: Dimension
  lugWidth: Dimension
  lugLength: Dimension
}

export interface CrystalSpec {
  type: 'flat' | 'domed' | 'box'
  diameter: Dimension
  thickness: Dimension
  innerRise: Dimension
}

export interface DialSpec {
  color: string
  finish: 'matte' | 'sunburst' | 'stone'
  diameter: Dimension
  thickness: Dimension
  centerHole: Dimension
  seatZ: Dimension
  recess: {
    enabled: boolean
    depth: Dimension
    radius: Dimension
    transition: 'step' | 'ramp' | 'soft-bowl'
  }
  reliefs: DialRelief[]
}

export interface DialRelief {
  id: string
  name: string
  shape: 'circle' | 'index' | 'block'
  x: Dimension
  y: Dimension
  width: Dimension
  length: Dimension
  height: Dimension
  color: string
}

export interface HandSpec {
  enabled: boolean
  length: Dimension
  width: Dimension
  thickness: Dimension
  mountingHeight: Dimension
  tubeHeight: Dimension
  holeDiameter: Dimension
  curve: {
    base: Dimension
    middle: Dimension
    tip: Dimension
    startRatio: number
    endRatio: number
  }
  color: string
}

export interface QuartzMovementSpec {
  kind: 'quartz'
  presetId: 'miyota_2035' | 'miyota_2036'
  name: string
  width: Dimension
  length: Dimension
  thickness: Dimension
  casingWidth: Dimension
  casingLength: Dimension
  stemAxisZ: Dimension
  handFit: {
    hour: Dimension
    minute: Dimension
    second: Dimension
  }
  handBaseLevels: {
    hour: Dimension
    minute: Dimension
    second: Dimension
  }
}

export type MechanicalArborId = 'barrel' | 'center' | 'third' | 'fourth' | 'escape'
export type GearToothProfile = 'cycloidal' | 'involute'
export type MechanicalComponentId =
  | 'plate'
  | 'bridge'
  | MechanicalArborId
  | 'balance'
  | 'pallet'
  | 'hairspring'
  | 'mainspring'
  | 'keyless'
  | 'rotor'
  | 'jewel-set'

export type ComponentOriginKind = 'designed' | 'donor' | 'measured' | 'imported-step'

export interface ComponentOrigin {
  kind: ComponentOriginKind
  sourceProjectId?: string
  sourceProjectName?: string
  sourceMovement?: string
  manufacturer?: string
  reference?: string
  importedFileName?: string
  capturedAt: string
  notes: string
  reliability: Reliability
}

export interface MechanicalArbor {
  id: MechanicalArborId
  name: string
  x: Dimension
  y: Dimension
  wheelTeeth: Dimension
  pinionTeeth: Dimension
  moduleToNext: Dimension
  profileToNext?: GearToothProfile
  wheelThickness: Dimension
  pinionThickness: Dimension
  wheelZ: Dimension
  pinionZ: Dimension
  pivotDiameter: Dimension
  pivotLength?: Dimension
  pressureAngle?: Dimension
  profileShift?: Dimension
  backlash?: Dimension
  addendumCoefficient?: Dimension
  dedendumCoefficient?: Dimension
  endshake?: Dimension
  sideshake?: Dimension
  jewelHoleDiameter?: Dimension
  jewelOuterDiameter?: Dimension
}

export interface MechanicalMovementSpec {
  kind: 'mechanical'
  presetId: 'daniels_manual_34' | 'custom_mechanical' | 'scratch_mechanical'
  name: string
  referenceCalibre?: string
  referenceSources?: SourceReference[]
  buildMode: 'template' | 'scratch' | 'hybrid'
  componentOrigins: Partial<Record<MechanicalComponentId, ComponentOrigin>>
  architecture: 'manual' | 'automatic'
  plateDiameter: Dimension
  plateThickness: Dimension
  trainBaseZ: Dimension
  totalHeight: Dimension
  bridgeThickness: Dimension
  bridgeTopZ: Dimension
  edgeClearance: Dimension
  barrelTurns: Dimension
  targetPowerReserve: Dimension
  stemAxisZ: Dimension
  automatic?: {
    rotorDiameter: Dimension
    rotorThickness: Dimension
    rotorZ: Dimension
    bearingDiameter: Dimension
    rotorMass: Dimension
    centerOfMassRadius: Dimension
    bearingFrictionTorque: Dimension
    rotorToBarrelRatio: Dimension
    motionFrequency: Dimension
    motionSweep: Dimension
    activeHoursPerDay: Dimension
    windingEfficiency: Dimension
    reverserType: 'unidirectional' | 'bidirectional'
  }
  mainspring?: {
    thickness: Dimension
    height: Dimension
    length: Dimension
    elasticModulus: Dimension
    turnsWorking: Dimension
  }
  escapement: {
    type: 'swiss-lever' | 'co-axial' | 'detent'
    targetVph: Dimension
    liftAngle: Dimension
    lock?: Dimension
    drop?: Dimension
    draw?: Dimension
    impulseAngle?: Dimension
    efficiency?: Dimension
  }
  balance: {
    x: Dimension
    y: Dimension
    diameter: Dimension
    thickness: Dimension
    z: Dimension
    targetAmplitude: Dimension
    mass?: Dimension
    inertia?: Dimension
    hairspringStiffness?: Dimension
    dampingRatio?: Dimension
  }
  motionWorks: {
    hourFit: Dimension
    minuteFit: Dimension
    secondFit: Dimension
  }
  arbors: MechanicalArbor[]
}

export type MovementSpec = QuartzMovementSpec | MechanicalMovementSpec

export type MateType = 'fixed' | 'coincident' | 'concentric' | 'distance' | 'angle' | 'gear'

export interface MateConstraint {
  id: string
  name: string
  type: MateType
  sourcePart: WatchPartId
  targetPart: WatchPartId
  enabled: boolean
  offset?: Dimension
  angle?: Dimension
  ratio?: number
  axis?: 'x' | 'y' | 'z'
}

export interface EngineeringSettings {
  solverMode: 'preview' | 'exact'
  toleranceMode: 'nominal' | 'worst_case' | 'monte_carlo'
  monteCarloSamples: number
  manufacturingProcess: 'none' | 'resin' | 'fdm' | 'cnc' | 'laser'
  printerProfileId: string | null
  materialProfileId: string | null
  seed: number
}

export interface WatchProject {
  schemaVersion: 5
  id: string
  name: string
  createdAt: string
  modifiedAt: string
  notes: string
  assembly: {
    movementBackClearance: Dimension
    dialMovementGap: Dimension
    runningClearance: Dimension
    mates: MateConstraint[]
  }
  engineering: EngineeringSettings
  case: CaseSpec
  exterior: ExteriorSpec
  presentation: PresentationSpec
  crystal: CrystalSpec
  dial: DialSpec
  hands: {
    hour: HandSpec
    minute: HandSpec
    second: HandSpec
  }
  movement: MovementSpec
}

interface SavedPartPresetBase {
  id: string
  name: string
  createdAt: string
  modifiedAt: string
  sourceProjectId: string
  sourceProjectName: string
}

export type MovementComponentPayload =
  | { componentType: 'plate'; value: Pick<MechanicalMovementSpec, 'plateDiameter' | 'plateThickness' | 'trainBaseZ' | 'edgeClearance'> }
  | { componentType: 'bridge'; value: Pick<MechanicalMovementSpec, 'bridgeThickness' | 'bridgeTopZ' | 'totalHeight'> }
  | { componentType: MechanicalArborId; value: MechanicalArbor }
  | { componentType: 'balance'; value: MechanicalMovementSpec['balance'] }
  | { componentType: 'pallet'; value: MechanicalMovementSpec['escapement'] }
  | { componentType: 'hairspring'; value: Pick<MechanicalMovementSpec['balance'], 'hairspringStiffness' | 'dampingRatio' | 'targetAmplitude'> & { targetVph: Dimension } }
  | { componentType: 'mainspring'; value: { mainspring: NonNullable<MechanicalMovementSpec['mainspring']>; barrelTurns: Dimension; targetPowerReserve: Dimension } }
  | { componentType: 'keyless'; value: { stemAxisZ: Dimension; motionWorks: MechanicalMovementSpec['motionWorks'] } }
  | { componentType: 'rotor'; value: { automatic: NonNullable<MechanicalMovementSpec['automatic']> } }
  | { componentType: 'jewel-set'; value: Array<Pick<MechanicalArbor, 'id' | 'pivotDiameter' | 'jewelHoleDiameter' | 'jewelOuterDiameter'>> }

export interface ComponentInterfaceSummary {
  label: string
  value: number
  unit: Dimension['unit']
  tolerance: number
}

export type SavedPartPreset =
  | (SavedPartPresetBase & { kind: 'case'; payload: CaseSpec })
  | (SavedPartPresetBase & { kind: 'dial'; payload: DialSpec })
  | (SavedPartPresetBase & { kind: 'crystal'; payload: CrystalSpec })
  | (SavedPartPresetBase & { kind: 'hands'; payload: WatchProject['hands'] })
  | (SavedPartPresetBase & { kind: 'movement'; payload: MovementSpec })
  | (SavedPartPresetBase & {
      kind: 'movement-component'
      componentType: MechanicalComponentId
      payload: MovementComponentPayload
      origin: ComponentOrigin
      interfaces: ComponentInterfaceSummary[]
    })

export type FindingSeverity = 'error' | 'warning' | 'opportunity' | 'info'

export interface Finding {
  id: string
  severity: FindingSeverity
  title: string
  detail: string
  parts: WatchPartId[]
  culprit?: WatchPartId
  clearance?: number
  reliability: Reliability
  source: string
}

export function dimension(
  value: number | null,
  unit: Dimension['unit'] = 'mm',
  quality: DataQuality = 'estimated',
  source = 'Modelo parametrico',
  tolerance = 0,
): Dimension {
  return {
    value,
    minus: tolerance,
    plus: tolerance,
    unit,
    quality,
    source,
    distribution: tolerance > 0 ? 'uniform' : 'fixed',
  }
}

export function designedDimension(
  value: number | null,
  unit: Dimension['unit'] = 'mm',
  tolerance = 0,
  source = 'Geometria nominal del proyecto',
): Dimension {
  return dimension(value, unit, 'designed', source, tolerance)
}

export function withDesignedValue(input: Dimension, value: number): Dimension {
  return {
    ...input,
    value,
    quality: 'designed',
    source: 'Editado en Watch Prototype Lab',
    distribution: Math.max(input.minus, input.plus) > 0 ? input.distribution ?? 'uniform' : 'fixed',
  }
}

export function valueOf(input: Dimension, fallback = 0): number {
  return input.value ?? fallback
}

export function lowerBound(input: Dimension, fallback = 0): number {
  return valueOf(input, fallback) - input.minus
}

export function upperBound(input: Dimension, fallback = 0): number {
  return valueOf(input, fallback) + input.plus
}

export function qualityReliability(quality: DataQuality): Reliability {
  if (quality === 'official_complete' || quality === 'measured_by_user') return 'high'
  if (quality === 'official_partial' || quality === 'supplier_partial' || quality === 'designed') return 'medium'
  if (quality === 'estimated') return 'low'
  return 'pending'
}

export function defaultEngineeringSettings(): EngineeringSettings {
  return {
    solverMode: 'preview',
    toleranceMode: 'worst_case',
    monteCarloSamples: 2500,
    manufacturingProcess: 'none',
    printerProfileId: null,
    materialProfileId: null,
    seed: 2035,
  }
}

function surface(
  material: SurfaceMaterial,
  finish: SurfaceFinish,
  color: string,
  metalness: number,
  roughness: number,
): SurfaceAppearance {
  return {
    material,
    finish,
    color,
    metalness,
    roughness,
    clearcoat: finish === 'polished' ? 0.42 : 0.16,
    textureScale: 1,
    microScratches: finish === 'polished' ? 0.16 : 0.38,
  }
}

export function defaultPresentationSpec(): PresentationSpec {
  return {
    quality: 'studio',
    environment: 'presentation-light',
    background: 'studio-dark',
    exposure: 1,
    depthOfField: false,
    showTechnicalOverlays: false,
    caseSurface: surface('stainless-steel', 'polished', '#c7cccf', 0.92, 0.16),
    bezelSurface: surface('stainless-steel', 'brushed-radial', '#c7cccf', 0.9, 0.24),
    dialSurface: surface('brass', 'sunburst', '#173c35', 0.18, 0.34),
    handsSurface: surface('stainless-steel', 'polished', '#e1e5e7', 0.86, 0.13),
    strapSurface: surface('leather', 'matte', '#3b2418', 0.02, 0.72),
    lumeColor: '#b8ffd2',
    lumeIntensity: 0.8,
  }
}

export function defaultExteriorSpec(caseDiameter = 40, lugSpacing = 20): ExteriorSpec {
  return {
    bezel: {
      enabled: true,
      outerDiameter: designedDimension(caseDiameter + 0.7, 'mm', 0.04, 'Bisel parametrico'),
      innerDiameter: designedDimension(caseDiameter - 5.2, 'mm', 0.04, 'Apertura de bisel'),
      height: designedDimension(0.8, 'mm', 0.03, 'Altura de bisel'),
      overhang: designedDimension(0.35, 'mm', 0.03, 'Vuelo del bisel'),
      insertColor: '#15191a',
    },
    rehaut: {
      enabled: true,
      innerDiameter: designedDimension(caseDiameter - 6.2, 'mm', 0.05, 'Apertura de rehaut'),
      outerDiameter: designedDimension(caseDiameter - 4.8, 'mm', 0.05, 'Diametro exterior de rehaut'),
      height: designedDimension(1.15, 'mm', 0.04, 'Altura de rehaut'),
      angle: designedDimension(74, 'deg', 1, 'Inclinacion de rehaut'),
      color: '#202426',
    },
    strap: {
      kind: 'leather',
      width: designedDimension(lugSpacing, 'mm', 0.05, 'Ancho entre asas'),
      taperWidth: designedDimension(Math.max(14, lugSpacing - 4), 'mm', 0.1, 'Estrechamiento de correa'),
      thickness: designedDimension(2.6, 'mm', 0.15, 'Espesor de correa'),
      upperLength: designedDimension(75, 'mm', 0.5, 'Tramo de hebilla'),
      lowerLength: designedDimension(120, 'mm', 0.5, 'Tramo perforado'),
      color: '#3b2418',
      stitchColor: '#c3a47c',
      linkLength: designedDimension(4.6, 'mm', 0.08, 'Paso de eslabon'),
      linkGap: designedDimension(0.18, 'mm', 0.03, 'Juego entre eslabones'),
    },
    springBars: {
      diameter: designedDimension(1.5, 'mm', 0.03, 'Pasador de correa'),
      length: designedDimension(lugSpacing, 'mm', 0.05, 'Pasador entre asas'),
    },
    dialGraphics: {
      indicesEnabled: true,
      indexCount: 12,
      indexShape: 'baton',
      indexColor: '#d7d2c2',
      indexRadius: designedDimension(Math.max(8, caseDiameter * 0.35), 'mm', 0.05, 'Radio de indices'),
      indexLength: designedDimension(2.3, 'mm', 0.04, 'Longitud de indice'),
      indexWidth: designedDimension(0.55, 'mm', 0.03, 'Ancho de indice'),
      indexHeight: designedDimension(0.22, 'mm', 0.02, 'Altura de indice aplicado'),
      minuteTrack: true,
      brandText: 'WATCH LAB',
      modelText: 'PROTOTYPE',
      dateWindow: false,
      dateWindowX: designedDimension(8.4, 'mm', 0.05, 'Posicion de fecha X'),
      dateWindowY: designedDimension(0, 'mm', 0.05, 'Posicion de fecha Y'),
      lumeEnabled: true,
    },
  }
}

export function cloneProject(project: WatchProject): WatchProject {
  return structuredClone(project)
}

export function newProjectId(): string {
  return `watch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
