import { create } from 'zustand'
import type { SolverLayer } from '../core/engineering'
import {
  analyzeComponentCompatibility,
  applyMovementComponent,
  movementComponentPresetFromProject,
  type ComponentCompatibilityReport,
  type MovementComponentPreset,
} from '../core/componentCompatibility'
import { analyzeManufacturing, MANUFACTURING_PROFILES } from '../core/manufacturing'
import {
  decodeWatchPackage,
  cancelCadRequest,
  deleteNativePart,
  deleteNativeProject,
  exportCadProject,
  getNativeInfo,
  inspectStepFile,
  isNativeApp,
  listNativeParts,
  listNativeProjects,
  loadNativeProject,
  openWatchPackage,
  runCadRequest,
  saveNativePart,
  saveNativeProject,
  saveWatchPackage,
  type CadAnalysis,
  type CadArtifact,
  type CadEngineInfo,
  type CadStepInspection,
  type NativeInfo,
  type NativeProjectSummary,
} from '../platform/native'
import { createMechanicalMovement, createMechanicalProject, createQuartzProject, projectFromTemplate } from './presets'
import {
  cloneProject,
  defaultExteriorSpec,
  defaultEngineeringSettings,
  defaultPresentationSpec,
  dimension,
  valueOf,
  withDesignedValue,
  type CaseSpec,
  type ComponentOrigin,
  type CrystalSpec,
  type DialRelief,
  type DialSpec,
  type Dimension,
  type ExteriorSpec,
  type HandSpec,
  type MechanicalArbor,
  type MechanicalArborId,
  type MechanicalComponentId,
  type GearToothProfile,
  type MechanicalMovementSpec,
  type RenderMode,
  type SavedPartPreset,
  type SurfaceAppearance,
  type ViewMode,
  type WatchPartId,
  type WatchProject,
  type Workspace,
} from './model'

const AUTOSAVE_KEY = 'watch-prototype-lab-v2-autosave'
const LIBRARY_KEY = 'watch-prototype-lab-v2-library'
const PART_LIBRARY_KEY = 'watch-prototype-lab-v4-parts'
let nativeInitializationStarted = false
let cadRunSequence = 0

type CaseDimensionKey = Exclude<keyof CaseSpec, 'shape' | 'material'>
type CrystalDimensionKey = Exclude<keyof CrystalSpec, 'type'>
type DialDimensionKey = Exclude<keyof DialSpec, 'color' | 'finish' | 'recess' | 'reliefs'>
type HandDimensionKey = Exclude<keyof HandSpec, 'enabled' | 'curve' | 'color'>
type AssemblyDimensionKey = Exclude<keyof WatchProject['assembly'], 'mates'>
type MechanicalDimensionKey = Exclude<
  keyof MechanicalMovementSpec,
  'kind' | 'presetId' | 'name' | 'referenceCalibre' | 'referenceSources' | 'buildMode' | 'componentOrigins' | 'architecture' | 'automatic' | 'mainspring' | 'escapement' | 'balance' | 'motionWorks' | 'arbors'
>
type EscapementDimensionKey = Exclude<keyof MechanicalMovementSpec['escapement'], 'type'>
type MainspringDimensionKey = keyof NonNullable<MechanicalMovementSpec['mainspring']>
type AutomaticDimensionKey = Exclude<keyof NonNullable<MechanicalMovementSpec['automatic']>, 'reverserType'>

interface ImportResult {
  ok: boolean
  error?: string
}

export type CadStatus = 'unavailable' | 'warming' | 'idle' | 'stale' | 'running' | 'ready' | 'error'

interface StudioState {
  project: WatchProject
  workspace: Workspace
  viewMode: ViewMode
  renderMode: RenderMode
  selectedPart: WatchPartId
  simulate: boolean
  showDimensions: boolean
  past: WatchProject[]
  future: WatchProject[]
  lastEditKey: string | null
  lastEditAt: number
  savedProjects: WatchProject[]
  savedParts: SavedPartPreset[]
  analysisLayer: SolverLayer
  nativeInfo: NativeInfo | null
  nativeProjects: NativeProjectSummary[]
  nativeError: string | null
  cadStatus: CadStatus
  cadEngine: CadEngineInfo | null
  cadReport: CadAnalysis | null
  cadError: string | null
  cadAnalyzedProjectModifiedAt: string | null
  cadArtifacts: CadArtifact[]
  cadStartedAt: number | null
  lastCompatibilityReport: ComponentCompatibilityReport | null
  setWorkspace: (workspace: Workspace) => void
  setViewMode: (mode: ViewMode) => void
  setRenderMode: (mode: RenderMode) => void
  setSelectedPart: (part: WatchPartId) => void
  setSimulate: (simulate: boolean) => void
  setShowDimensions: (show: boolean) => void
  initializeNative: () => Promise<void>
  refreshNativeLibrary: () => Promise<void>
  runExactAnalysis: () => Promise<void>
  cancelCad: () => Promise<void>
  exportCad: (formats: Array<'step' | 'stl' | '3mf' | 'glb'>) => Promise<CadArtifact[]>
  saveProjectPackage: () => Promise<string | null>
  openProjectPackage: () => Promise<ImportResult>
  importProjectPackage: (bytes: Uint8Array) => ImportResult
  loadNativeSavedProject: (id: string) => Promise<void>
  deleteNativeSavedProject: (id: string) => Promise<void>
  setSolverMode: (mode: WatchProject['engineering']['solverMode']) => void
  setToleranceMode: (mode: WatchProject['engineering']['toleranceMode']) => void
  setMonteCarloSamples: (samples: number) => void
  setManufacturingProcess: (process: WatchProject['engineering']['manufacturingProcess']) => void
  setPrinterProfile: (profileId: string | null) => void
  setAnalysisLayer: (layer: SolverLayer) => void
  renameProject: (name: string) => void
  updateNotes: (notes: string) => void
  updateAssembly: (field: AssemblyDimensionKey, value: number) => void
  updateCase: (field: CaseDimensionKey, value: number) => void
  setCaseShape: (shape: CaseSpec['shape']) => void
  setCaseMaterial: (material: CaseSpec['material']) => void
  updateExteriorDimension: (section: keyof ExteriorSpec, field: string, value: number) => void
  setExteriorValue: (section: keyof ExteriorSpec, field: string, value: string | number | boolean) => void
  updatePresentation: (field: 'quality' | 'environment' | 'background' | 'exposure' | 'depthOfField' | 'showTechnicalOverlays' | 'lumeColor' | 'lumeIntensity', value: string | number | boolean) => void
  updateSurface: (surface: 'caseSurface' | 'bezelSurface' | 'dialSurface' | 'handsSurface' | 'strapSurface', field: keyof SurfaceAppearance, value: string | number) => void
  updateCrystal: (field: CrystalDimensionKey, value: number) => void
  setCrystalType: (type: CrystalSpec['type']) => void
  updateDial: (field: DialDimensionKey, value: number) => void
  setDialColor: (color: string) => void
  setDialFinish: (finish: DialSpec['finish']) => void
  setDialRecess: (enabled: boolean) => void
  updateDialRecess: (field: 'depth' | 'radius', value: number) => void
  setDialTransition: (transition: DialSpec['recess']['transition']) => void
  addRelief: (shape: DialRelief['shape']) => void
  updateRelief: (id: string, field: 'x' | 'y' | 'width' | 'length' | 'height', value: number) => void
  removeRelief: (id: string) => void
  updateHand: (hand: 'hour' | 'minute' | 'second', field: HandDimensionKey, value: number) => void
  updateHandCurve: (
    hand: 'hour' | 'minute' | 'second',
    field: 'base' | 'middle' | 'tip' | 'startRatio' | 'endRatio',
    value: number,
  ) => void
  setHandEnabled: (hand: 'hour' | 'minute' | 'second', enabled: boolean) => void
  setHandColor: (hand: 'hour' | 'minute' | 'second', color: string) => void
  updateQuartz: (
    field: 'width' | 'length' | 'thickness' | 'casingWidth' | 'casingLength' | 'stemAxisZ',
    value: number,
  ) => void
  updateQuartzFit: (field: 'hour' | 'minute' | 'second', value: number) => void
  updateMechanical: (field: MechanicalDimensionKey, value: number) => void
  setMechanicalArchitecture: (architecture: MechanicalMovementSpec['architecture']) => void
  setEscapementType: (type: MechanicalMovementSpec['escapement']['type']) => void
  updateEscapement: (field: EscapementDimensionKey, value: number) => void
  updateMainspring: (field: MainspringDimensionKey, value: number) => void
  updateAutomatic: (field: AutomaticDimensionKey, value: number) => void
  setReverserType: (type: NonNullable<MechanicalMovementSpec['automatic']>['reverserType']) => void
  updateBalance: (field: keyof MechanicalMovementSpec['balance'], value: number) => void
  moveBalance: (x: number, y: number) => void
  updateMotionWorks: (field: keyof MechanicalMovementSpec['motionWorks'], value: number) => void
  updateComponentOrigin: (component: MechanicalComponentId, patch: Partial<ComponentOrigin>) => void
  importStepForComponent: (component: MechanicalComponentId) => Promise<CadStepInspection | null>
  updateArbor: (
    id: MechanicalArborId,
    field: Exclude<keyof MechanicalArbor, 'id' | 'name' | 'profileToNext'>,
    value: number,
  ) => void
  setArborProfile: (id: MechanicalArborId, profile: GearToothProfile) => void
  moveArbor: (id: MechanicalArborId, x: number, y: number) => void
  autoPlaceTrain: () => void
  replaceWithMechanical: () => void
  loadTemplate: (id: 'scratch-mechanical' | 'mechanical-34' | 'mechanical-automatic-34' | 'miyota-2035' | 'miyota-2036' | 'miyota-8215-study' | 'miyota-9015-study') => void
  undo: () => void
  redo: () => void
  saveToLibrary: () => void
  saveSelectedPartToLibrary: () => void
  analyzeSavedComponent: (id: string) => ComponentCompatibilityReport | null
  applySavedPart: (id: string, force?: boolean) => ComponentCompatibilityReport | null
  clearCompatibilityReport: () => void
  deleteSavedPart: (id: string) => void
  loadSavedProject: (id: string) => void
  deleteSavedProject: (id: string) => void
  importProject: (input: unknown) => ImportResult
}

type LoadableProject = Omit<WatchProject, 'schemaVersion' | 'engineering' | 'assembly' | 'exterior' | 'presentation'> & {
  schemaVersion: 2 | 3 | 4 | 5
  engineering?: Partial<WatchProject['engineering']>
  exterior?: Partial<WatchProject['exterior']>
  presentation?: Partial<WatchProject['presentation']>
  assembly: Omit<WatchProject['assembly'], 'mates'> & {
    mates?: WatchProject['assembly']['mates']
  }
}

function validProject(input: unknown): input is LoadableProject {
  if (!input || typeof input !== 'object') return false
  const candidate = input as {
    schemaVersion?: number
    id?: unknown
    name?: unknown
    case?: unknown
    dial?: unknown
    crystal?: unknown
    hands?: unknown
    movement?: { kind?: unknown }
  }
  return (
    (candidate.schemaVersion === 2 || candidate.schemaVersion === 3 || candidate.schemaVersion === 4 || candidate.schemaVersion === 5) &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    Boolean(candidate.case) &&
    Boolean(candidate.dial) &&
    Boolean(candidate.crystal) &&
    Boolean(candidate.hands) &&
    (candidate.movement?.kind === 'quartz' || candidate.movement?.kind === 'mechanical')
  )
}

function normalizeProject(project: LoadableProject): WatchProject {
  const fallback =
    project.movement.kind === 'quartz'
      ? createQuartzProject(project.movement.presetId)
      : createMechanicalProject()
  const next = cloneProject(project as WatchProject)
  next.schemaVersion = 5
  next.engineering = {
    ...defaultEngineeringSettings(),
    ...(project.engineering ?? {}),
  }
  next.assembly = {
    ...fallback.assembly,
    ...project.assembly,
    mates: project.assembly.mates?.length ? project.assembly.mates : fallback.assembly.mates,
  }
  next.exterior = {
    ...defaultExteriorSpec(valueOf(project.case.outerDiameter, 40)),
    ...(project.exterior ?? {}),
    bezel: { ...defaultExteriorSpec().bezel, ...project.exterior?.bezel },
    rehaut: { ...defaultExteriorSpec().rehaut, ...project.exterior?.rehaut },
    strap: { ...defaultExteriorSpec().strap, ...project.exterior?.strap },
    springBars: { ...defaultExteriorSpec().springBars, ...project.exterior?.springBars },
    dialGraphics: { ...defaultExteriorSpec().dialGraphics, ...project.exterior?.dialGraphics },
  }
  const presentationFallback = defaultPresentationSpec()
  next.presentation = {
    ...presentationFallback,
    ...(project.presentation ?? {}),
    caseSurface: { ...presentationFallback.caseSurface, ...project.presentation?.caseSurface },
    bezelSurface: { ...presentationFallback.bezelSurface, ...project.presentation?.bezelSurface },
    dialSurface: { ...presentationFallback.dialSurface, ...project.presentation?.dialSurface },
    handsSurface: { ...presentationFallback.handsSurface, ...project.presentation?.handsSurface },
    strapSurface: { ...presentationFallback.strapSurface, ...project.presentation?.strapSurface },
  }
  next.case = { ...fallback.case, ...project.case }
  next.crystal = { ...fallback.crystal, ...project.crystal }
  next.dial = {
    ...fallback.dial,
    ...project.dial,
    recess: { ...fallback.dial.recess, ...project.dial.recess },
    reliefs: project.dial.reliefs ?? [],
  }
  next.hands = {
    hour: { ...fallback.hands.hour, ...project.hands.hour, curve: { ...fallback.hands.hour.curve, ...project.hands.hour.curve } },
    minute: { ...fallback.hands.minute, ...project.hands.minute, curve: { ...fallback.hands.minute.curve, ...project.hands.minute.curve } },
    second: { ...fallback.hands.second, ...project.hands.second, curve: { ...fallback.hands.second.curve, ...project.hands.second.curve } },
  }
  if (next.movement.kind === 'mechanical' && fallback.movement.kind === 'mechanical') {
    const loaded = next.movement
    next.movement = {
      ...fallback.movement,
      ...loaded,
      buildMode: loaded.buildMode ?? 'template',
      componentOrigins: loaded.componentOrigins ?? fallback.movement.componentOrigins,
      automatic: { ...fallback.movement.automatic!, ...loaded.automatic },
      mainspring: { ...fallback.movement.mainspring!, ...loaded.mainspring },
      escapement: { ...fallback.movement.escapement, ...loaded.escapement },
      balance: { ...fallback.movement.balance, ...loaded.balance },
      motionWorks: { ...fallback.movement.motionWorks, ...loaded.motionWorks },
      arbors: fallback.movement.arbors.map((baseArbor) => ({
        ...baseArbor,
        ...loaded.arbors.find((arbor) => arbor.id === baseArbor.id),
      })),
    }
  }
  return next
}

function loadAutosave(): WatchProject {
  if (typeof window === 'undefined') return createMechanicalProject()
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(AUTOSAVE_KEY) ?? 'null')
    return validProject(parsed) ? normalizeProject(parsed) : createMechanicalProject()
  } catch {
    return createMechanicalProject()
  }
}

function loadLibrary(): WatchProject[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LIBRARY_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(validProject).map(normalizeProject) : []
  } catch {
    return []
  }
}

function persist(project: WatchProject): void {
  window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project))
}

function persistLibrary(projects: WatchProject[]): void {
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(projects))
}

function loadPartLibrary(): SavedPartPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(PART_LIBRARY_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SavedPartPreset => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<SavedPartPreset>
      return typeof candidate.id === 'string'
        && typeof candidate.name === 'string'
        && ['case', 'dial', 'crystal', 'hands', 'movement', 'movement-component'].includes(candidate.kind ?? '')
        && Boolean(candidate.payload)
    })
  } catch {
    return []
  }
}

function persistPartLibrary(parts: SavedPartPreset[]): void {
  window.localStorage.setItem(PART_LIBRARY_KEY, JSON.stringify(parts))
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function partPresetFromSelection(project: WatchProject, selectedPart: WatchPartId): SavedPartPreset {
  const movementComponent = movementComponentPresetFromProject(project, selectedPart)
  if (movementComponent) return movementComponent
  const now = new Date().toISOString()
  const common = {
    id: crypto.randomUUID(),
    createdAt: now,
    modifiedAt: now,
    sourceProjectId: project.id,
    sourceProjectName: project.name,
  }
  if (selectedPart === 'dial') {
    return { ...common, kind: 'dial', name: `Dial ${valueOf(project.dial.diameter).toFixed(1)} mm`, payload: cloneValue(project.dial) }
  }
  if (selectedPart === 'crystal') {
    return { ...common, kind: 'crystal', name: `Cristal ${project.crystal.type} ${valueOf(project.crystal.diameter).toFixed(1)} mm`, payload: cloneValue(project.crystal) }
  }
  if (selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand') {
    return { ...common, kind: 'hands', name: `Familia de agujas ${project.name}`, payload: cloneValue(project.hands) }
  }
  if (['case', 'back', 'stem', 'crown', 'holder', 'gasket'].includes(selectedPart)) {
    return { ...common, kind: 'case', name: `Caja ${valueOf(project.case.outerDiameter).toFixed(1)} mm`, payload: cloneValue(project.case) }
  }
  return { ...common, kind: 'movement', name: project.movement.name, payload: cloneValue(project.movement) }
}

export const useStudioStore = create<StudioState>((set, get) => {
  const staleCadState = (): Pick<StudioState, 'cadStatus' | 'cadError'> => ({
    cadStatus: get().cadReport ? 'stale' : get().nativeInfo ? 'idle' : 'unavailable',
    cadError: null,
  })

  const change = (key: string, producer: (draft: WatchProject) => void): void => {
    const state = get()
    const now = Date.now()
    const draft = cloneProject(state.project)
    producer(draft)
    draft.modifiedAt = new Date().toISOString()
    const coalesced = state.lastEditKey === key && now - state.lastEditAt < 550
    const past = coalesced ? state.past : [...state.past, state.project].slice(-80)
    persist(draft)
    set({
      project: draft,
      past,
      future: [],
      lastEditKey: key,
      lastEditAt: now,
      ...staleCadState(),
    })
  }

  const replaceProject = (project: LoadableProject, selectedPart: WatchPartId = 'movement'): void => {
    const current = get().project
    const next = cloneProject(normalizeProject(project))
    persist(next)
    set({
      project: next,
      selectedPart,
      past: [...get().past, current].slice(-80),
      future: [],
      lastEditKey: null,
      lastEditAt: 0,
      cadReport: null,
      cadAnalyzedProjectModifiedAt: null,
      cadArtifacts: [],
      cadStatus: get().nativeInfo ? 'idle' : 'unavailable',
      cadError: null,
    })
  }

  return {
    project: loadAutosave(),
    workspace: 'assembly',
    viewMode: 'assembled',
    renderMode: 'technical',
    selectedPart: 'movement',
    simulate: false,
    showDimensions: true,
    past: [],
    future: [],
    lastEditKey: null,
    lastEditAt: 0,
    savedProjects: loadLibrary(),
    savedParts: loadPartLibrary(),
    analysisLayer: 'geometry',
    nativeInfo: null,
    nativeProjects: [],
    nativeError: null,
    cadStatus: isNativeApp() ? 'warming' : 'unavailable',
    cadEngine: null,
    cadReport: null,
    cadError: null,
    cadAnalyzedProjectModifiedAt: null,
    cadArtifacts: [],
    cadStartedAt: null,
    lastCompatibilityReport: null,
    setWorkspace: (workspace) => {
      const selectedPart = workspace === 'movement' ? 'movement' : get().selectedPart
      const viewMode = workspace === 'parts' ? 'isolate' : get().viewMode
      set({ workspace, selectedPart, viewMode })
    },
    setViewMode: (viewMode) => set({ viewMode }),
    setRenderMode: (renderMode) => set({
      renderMode,
      ...(renderMode === 'presentation' ? { viewMode: 'assembled' as const, simulate: false } : {}),
    }),
    setSelectedPart: (selectedPart) => set({ selectedPart }),
    setSimulate: (simulate) => set({ simulate }),
    setShowDimensions: (showDimensions) => set({ showDimensions }),
    initializeNative: async () => {
      if (!isNativeApp()) {
        set({ cadStatus: 'unavailable', nativeInfo: null })
        return
      }
      if (nativeInitializationStarted) return
      nativeInitializationStarted = true
      set({ cadStatus: 'warming', nativeError: null, cadError: null })
      try {
        const [nativeInfo, health, nativeProjects, savedParts] = await Promise.all([
          getNativeInfo(),
          runCadRequest({ command: 'health' }),
          listNativeProjects(),
          listNativeParts(),
        ])
        set({
          nativeInfo,
          nativeProjects,
          savedParts,
          cadEngine: health.engine,
          cadStatus: 'idle',
          nativeError: null,
        })
      } catch (error) {
        nativeInitializationStarted = false
        const message = error instanceof Error ? error.message : String(error)
        set({ nativeError: message, cadError: message, cadStatus: 'error' })
      }
    },
    refreshNativeLibrary: async () => {
      if (!isNativeApp()) return
      try {
        const [nativeProjects, savedParts] = await Promise.all([listNativeProjects(), listNativeParts()])
        set({ nativeProjects, savedParts, nativeError: null })
      } catch (error) {
        set({ nativeError: error instanceof Error ? error.message : String(error) })
      }
    },
    runExactAnalysis: async () => {
      if (!isNativeApp()) {
        set({
          cadStatus: 'unavailable',
          cadError: 'El kernel OpenCascade esta disponible en Watch Prototype Lab Desktop.',
        })
        return
      }
      const project = cloneProject(get().project)
      const analyzedModifiedAt = project.modifiedAt
      const runId = ++cadRunSequence
      set({ cadStatus: 'running', cadError: null, cadStartedAt: Date.now() })
      try {
        const response = await runCadRequest({
          command: 'analyze',
          project,
          contactToleranceMm: Math.max(0.001, valueOf(project.assembly.runningClearance, 0.03) / 6),
        })
        if (runId !== cadRunSequence) return
        if (!response.analysis) throw new Error('OpenCascade no devolvio un informe de geometria.')
        const currentMatches = get().project.modifiedAt === analyzedModifiedAt
        set({
          cadEngine: response.engine,
          cadReport: response.analysis,
          cadAnalyzedProjectModifiedAt: analyzedModifiedAt,
          cadStatus: currentMatches ? 'ready' : 'stale',
          cadError: null,
          cadStartedAt: null,
        })
      } catch (error) {
        if (runId !== cadRunSequence) return
        set({ cadStatus: 'error', cadError: error instanceof Error ? error.message : String(error), cadStartedAt: null })
      }
    },
    cancelCad: async () => {
      if (get().cadStatus !== 'running') return
      cadRunSequence += 1
      set({
        cadStatus: get().cadReport ? 'stale' : 'idle',
        cadError: null,
        cadStartedAt: null,
      })
      try {
        await cancelCadRequest()
      } catch (error) {
        set({ cadError: error instanceof Error ? error.message : String(error) })
      }
    },
    exportCad: async (formats) => {
      if (!isNativeApp()) {
        set({ cadStatus: 'unavailable', cadError: 'La exportacion CAD requiere la aplicacion de escritorio.' })
        return []
      }
      const project = cloneProject(get().project)
      const manufacturing = analyzeManufacturing(project)
      if (!manufacturing.processDefined) {
        set({ cadError: 'Selecciona un proceso de fabricacion antes de exportar.', cadStatus: get().cadReport ? 'stale' : 'idle' })
        return []
      }
      if (!manufacturing.readyForExport) {
        set({ cadError: `La exportacion esta bloqueada por ${manufacturing.blockedParts.length} piezas fuera de proceso.`, cadStatus: get().cadReport ? 'stale' : 'idle' })
        return []
      }
      const analyzedModifiedAt = project.modifiedAt
      const runId = ++cadRunSequence
      set({ cadStatus: 'running', cadError: null, cadStartedAt: Date.now() })
      try {
        const response = await exportCadProject(project, formats)
        if (runId !== cadRunSequence) return []
        if (!response) {
          set({ cadStatus: get().cadReport ? 'stale' : 'idle', cadStartedAt: null })
          return []
        }
        const artifacts = response.artifacts ?? []
        set({
          cadEngine: response.engine,
          cadReport: response.analysis ?? get().cadReport,
          cadAnalyzedProjectModifiedAt: response.analysis ? analyzedModifiedAt : get().cadAnalyzedProjectModifiedAt,
          cadArtifacts: artifacts,
          cadStatus: get().project.modifiedAt === analyzedModifiedAt ? 'ready' : 'stale',
          cadError: null,
          cadStartedAt: null,
        })
        return artifacts
      } catch (error) {
        if (runId !== cadRunSequence) return []
        set({ cadStatus: 'error', cadError: error instanceof Error ? error.message : String(error), cadStartedAt: null })
        return []
      }
    },
    saveProjectPackage: async () => saveWatchPackage(get().project, get().cadReport ?? undefined),
    openProjectPackage: async () => {
      try {
        const loaded = await openWatchPackage()
        if (!loaded) return { ok: false, error: isNativeApp() ? 'Apertura cancelada.' : 'Usa el selector de archivo.' }
        replaceProject(loaded.project)
        set({
          cadReport: loaded.cadAnalysis ?? null,
          cadAnalyzedProjectModifiedAt: loaded.cadAnalysis ? loaded.project.modifiedAt : null,
          cadStatus: loaded.cadAnalysis ? 'ready' : get().nativeInfo ? 'idle' : 'unavailable',
        })
        return { ok: true }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    },
    importProjectPackage: (bytes) => {
      try {
        const loaded = decodeWatchPackage(bytes)
        replaceProject(loaded.project)
        set({
          cadReport: loaded.cadAnalysis ?? null,
          cadAnalyzedProjectModifiedAt: loaded.cadAnalysis ? loaded.project.modifiedAt : null,
          cadStatus: loaded.cadAnalysis ? 'ready' : get().nativeInfo ? 'idle' : 'unavailable',
        })
        return { ok: true }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    },
    loadNativeSavedProject: async (id) => {
      const project = await loadNativeProject(id)
      if (project && validProject(project)) {
        replaceProject(project)
        set({ workspace: 'assembly', viewMode: 'assembled' })
      }
    },
    deleteNativeSavedProject: async (id) => {
      await deleteNativeProject(id)
      set({ nativeProjects: get().nativeProjects.filter((project) => project.id !== id) })
    },
    setSolverMode: (solverMode) => change('engineering-solver', (draft) => void (draft.engineering.solverMode = solverMode)),
    setToleranceMode: (toleranceMode) => change('engineering-tolerance', (draft) => void (draft.engineering.toleranceMode = toleranceMode)),
    setMonteCarloSamples: (monteCarloSamples) => change('engineering-samples', (draft) => void (draft.engineering.monteCarloSamples = Math.max(100, Math.round(monteCarloSamples)))),
    setManufacturingProcess: (manufacturingProcess) => change('engineering-process', (draft) => {
      draft.engineering.manufacturingProcess = manufacturingProcess
      draft.engineering.printerProfileId = manufacturingProcess === 'none'
        ? null
        : MANUFACTURING_PROFILES.find((profile) => profile.process === manufacturingProcess)?.id ?? null
    }),
    setPrinterProfile: (printerProfileId) => change('engineering-printer', (draft) => {
      draft.engineering.printerProfileId = printerProfileId
      const profile = MANUFACTURING_PROFILES.find((candidate) => candidate.id === printerProfileId)
      if (profile) draft.engineering.manufacturingProcess = profile.process
    }),
    setAnalysisLayer: (analysisLayer) => set({ analysisLayer }),
    renameProject: (name) => change('project-name', (draft) => void (draft.name = name)),
    updateNotes: (notes) => change('project-notes', (draft) => void (draft.notes = notes)),
    updateAssembly: (field, value) =>
      change(`assembly-${field}`, (draft) => {
        draft.assembly[field] = withDesignedValue(draft.assembly[field], value)
      }),
    updateCase: (field, value) =>
      change(`case-${field}`, (draft) => {
        draft.case[field] = withDesignedValue(draft.case[field], value)
      }),
    setCaseShape: (shape) => change('case-shape', (draft) => void (draft.case.shape = shape)),
    setCaseMaterial: (material) => change('case-material', (draft) => void (draft.case.material = material)),
    updateExteriorDimension: (section, field, value) => change(`exterior-${section}-${field}`, (draft) => {
      const target = draft.exterior[section] as unknown as Record<string, unknown>
      const current = target[field]
      if (current && typeof current === 'object' && 'value' in current) {
        target[field] = withDesignedValue(current as Dimension, value)
      }
    }),
    setExteriorValue: (section, field, value) => change(`exterior-${section}-${field}`, (draft) => {
      const target = draft.exterior[section] as unknown as Record<string, unknown>
      target[field] = value
    }),
    updatePresentation: (field, value) => change(`presentation-${field}`, (draft) => {
      ;(draft.presentation as unknown as Record<string, unknown>)[field] = value
    }),
    updateSurface: (surface, field, value) => change(`presentation-${surface}-${field}`, (draft) => {
      ;(draft.presentation[surface] as unknown as Record<string, unknown>)[field] = value
    }),
    updateCrystal: (field, value) =>
      change(`crystal-${field}`, (draft) => {
        draft.crystal[field] = withDesignedValue(draft.crystal[field], value)
      }),
    setCrystalType: (type) => change('crystal-type', (draft) => void (draft.crystal.type = type)),
    updateDial: (field, value) =>
      change(`dial-${field}`, (draft) => {
        draft.dial[field] = withDesignedValue(draft.dial[field], value)
      }),
    setDialColor: (color) => change('dial-color', (draft) => void (draft.dial.color = color)),
    setDialFinish: (finish) => change('dial-finish', (draft) => void (draft.dial.finish = finish)),
    setDialRecess: (enabled) =>
      change('dial-recess-enabled', (draft) => {
        draft.dial.recess.enabled = enabled
        if (enabled && valueOf(draft.dial.recess.depth) === 0) draft.dial.recess.depth.value = 0.18
      }),
    updateDialRecess: (field, value) =>
      change(`dial-recess-${field}`, (draft) => {
        draft.dial.recess[field] = withDesignedValue(draft.dial.recess[field], value)
      }),
    setDialTransition: (transition) =>
      change('dial-recess-transition', (draft) => void (draft.dial.recess.transition = transition)),
    addRelief: (shape) =>
      change(`dial-relief-add-${shape}`, (draft) => {
        const count = draft.dial.reliefs.length + 1
        draft.dial.reliefs.push({
          id: `relief-${Date.now().toString(36)}`,
          name: shape === 'circle' ? `Aplique ${count}` : shape === 'index' ? `Indice ${count}` : `Bloque ${count}`,
          shape,
          x: dimension(shape === 'index' ? 0 : 6, 'mm', 'designed', 'Creado por el usuario', 0.02),
          y: dimension(shape === 'index' ? 12 : 4, 'mm', 'designed', 'Creado por el usuario', 0.02),
          width: dimension(shape === 'index' ? 0.8 : 2.5, 'mm', 'designed', 'Creado por el usuario', 0.02),
          length: dimension(shape === 'index' ? 3 : 2.5, 'mm', 'designed', 'Creado por el usuario', 0.02),
          height: dimension(0.35, 'mm', 'designed', 'Creado por el usuario', 0.03),
          color: '#48b986',
        })
      }),
    updateRelief: (id, field, value) =>
      change(`dial-relief-${id}-${field}`, (draft) => {
        const relief = draft.dial.reliefs.find((item) => item.id === id)
        if (relief) relief[field] = withDesignedValue(relief[field], value)
      }),
    removeRelief: (id) =>
      change(`dial-relief-remove-${id}`, (draft) => {
        draft.dial.reliefs = draft.dial.reliefs.filter((item) => item.id !== id)
      }),
    updateHand: (hand, field, value) =>
      change(`hand-${hand}-${field}`, (draft) => {
        draft.hands[hand][field] = withDesignedValue(draft.hands[hand][field], value)
      }),
    updateHandCurve: (hand, field, value) =>
      change(`hand-${hand}-curve-${field}`, (draft) => {
        if (field === 'startRatio' || field === 'endRatio') draft.hands[hand].curve[field] = value
        else {
          draft.hands[hand].curve[field] = withDesignedValue(draft.hands[hand].curve[field], value)
        }
      }),
    setHandEnabled: (hand, enabled) =>
      change(`hand-${hand}-enabled`, (draft) => void (draft.hands[hand].enabled = enabled)),
    setHandColor: (hand, color) =>
      change(`hand-${hand}-color`, (draft) => void (draft.hands[hand].color = color)),
    updateQuartz: (field, value) =>
      change(`quartz-${field}`, (draft) => {
        if (draft.movement.kind === 'quartz') {
          draft.movement[field] = withDesignedValue(draft.movement[field], value)
        }
      }),
    updateQuartzFit: (field, value) =>
      change(`quartz-fit-${field}`, (draft) => {
        if (draft.movement.kind === 'quartz') {
          draft.movement.handFit[field] = withDesignedValue(draft.movement.handFit[field], value)
        }
      }),
    updateMechanical: (field, value) =>
      change(`mechanical-${field}`, (draft) => {
        if (draft.movement.kind === 'mechanical') {
          draft.movement[field] = withDesignedValue(draft.movement[field], value)
        }
      }),
    setMechanicalArchitecture: (architecture) =>
      change('mechanical-architecture', (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        const movement = draft.movement
        draft.movement.architecture = architecture
        if (!movement.automatic) movement.automatic = createMechanicalMovement().automatic
        if (architecture === 'automatic' && valueOf(movement.trainBaseZ) < 0.1 && movement.trainBaseZ.quality !== 'measured_by_user') {
          const shift = 0.9
          movement.trainBaseZ = withDesignedValue(movement.trainBaseZ, shift)
          movement.bridgeTopZ = withDesignedValue(movement.bridgeTopZ, valueOf(movement.bridgeTopZ) + shift)
          movement.stemAxisZ = withDesignedValue(movement.stemAxisZ, valueOf(movement.stemAxisZ) + shift)
          movement.totalHeight = withDesignedValue(movement.totalHeight, Math.max(5.8, valueOf(movement.bridgeTopZ) + 0.15))
          draft.dial.seatZ = withDesignedValue(draft.dial.seatZ, valueOf(draft.dial.seatZ) + shift)
          draft.case.stemAxisZ = withDesignedValue(draft.case.stemAxisZ, valueOf(draft.case.stemAxisZ) + shift)
        }
      }),
    setEscapementType: (type) =>
      change('escapement-type', (draft) => {
        if (draft.movement.kind === 'mechanical') draft.movement.escapement.type = type
      }),
    updateEscapement: (field, value) =>
      change(`escapement-${field}`, (draft) => {
        if (draft.movement.kind === 'mechanical') {
          const current = draft.movement.escapement[field]
          const unit = field === 'targetVph' ? 'vph' : field === 'efficiency' ? 'count' : 'deg'
          draft.movement.escapement[field] = current
            ? withDesignedValue(current, value)
            : dimension(value, unit, 'designed', 'Editado en Watch Prototype Lab')
        }
      }),
    updateMainspring: (field, value) =>
      change(`mainspring-${field}`, (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        if (!draft.movement.mainspring) {
          draft.movement.mainspring = {
            thickness: dimension(0.1, 'mm', 'designed'),
            height: dimension(1.2, 'mm', 'designed'),
            length: dimension(300, 'mm', 'designed'),
            elasticModulus: dimension(190000, 'count', 'estimated', 'Acero de muelle generico'),
            turnsWorking: dimension(6.5, 'count', 'designed'),
          }
        }
        draft.movement.mainspring[field] = withDesignedValue(draft.movement.mainspring[field], value)
      }),
    updateAutomatic: (field, value) =>
      change(`automatic-${field}`, (draft) => {
        if (draft.movement.kind !== 'mechanical' || !draft.movement.automatic) return
        draft.movement.automatic[field] = withDesignedValue(draft.movement.automatic[field], value)
      }),
    setReverserType: (reverserType) =>
      change('automatic-reverser', (draft) => {
        if (draft.movement.kind === 'mechanical' && draft.movement.automatic) draft.movement.automatic.reverserType = reverserType
      }),
    updateBalance: (field, value) =>
      change(`balance-${field}`, (draft) => {
        if (draft.movement.kind === 'mechanical') {
          const current = draft.movement.balance[field]
          const unit = field === 'targetAmplitude'
            ? 'deg'
            : field === 'mass' || field === 'inertia' || field === 'hairspringStiffness' || field === 'dampingRatio'
              ? 'count'
              : 'mm'
          draft.movement.balance[field] = current
            ? withDesignedValue(current, value)
            : dimension(value, unit, 'designed', 'Editado en Watch Prototype Lab')
        }
      }),
    moveBalance: (x, y) =>
      change('balance-drag', (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        draft.movement.balance.x = withDesignedValue(draft.movement.balance.x, Number(x.toFixed(3)))
        draft.movement.balance.y = withDesignedValue(draft.movement.balance.y, Number(y.toFixed(3)))
      }),
    updateMotionWorks: (field, value) =>
      change(`motion-works-${field}`, (draft) => {
        if (draft.movement.kind === 'mechanical') {
          draft.movement.motionWorks[field] = withDesignedValue(draft.movement.motionWorks[field], value)
        }
      }),
    updateComponentOrigin: (component, patch) => change(`component-origin-${component}`, (draft) => {
      if (draft.movement.kind !== 'mechanical') return
      const current = draft.movement.componentOrigins[component]
      draft.movement.componentOrigins[component] = {
        kind: 'measured',
        capturedAt: new Date().toISOString(),
        notes: '',
        reliability: 'medium',
        ...current,
        ...patch,
      }
      if (draft.movement.buildMode === 'template') draft.movement.buildMode = 'hybrid'
    }),
    importStepForComponent: async (component) => {
      const inspection = await inspectStepFile()
      if (!inspection) return null
      const sorted = [...inspection.size].sort((a, b) => a - b)
      const thickness = sorted[0]
      const envelope = sorted[2]
      change(`component-step-${component}`, (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        const measured = (current: Dimension, next: number): Dimension => ({
          ...withDesignedValue(current, next),
          quality: 'measured_by_user',
          source: `Envolvente OpenCascade de ${inspection.fileName}`,
        })
        if (component === 'plate') {
          draft.movement.plateDiameter = measured(draft.movement.plateDiameter, envelope)
          draft.movement.plateThickness = measured(draft.movement.plateThickness, thickness)
        } else if (component === 'bridge') {
          draft.movement.bridgeThickness = measured(draft.movement.bridgeThickness, thickness)
        } else if (component === 'balance') {
          draft.movement.balance.diameter = measured(draft.movement.balance.diameter, envelope)
          draft.movement.balance.thickness = measured(draft.movement.balance.thickness, thickness)
        } else if (component === 'rotor' && draft.movement.automatic) {
          draft.movement.automatic.rotorDiameter = measured(draft.movement.automatic.rotorDiameter, envelope)
          draft.movement.automatic.rotorThickness = measured(draft.movement.automatic.rotorThickness, thickness)
        } else if (['barrel', 'center', 'third', 'fourth', 'escape'].includes(component)) {
          const arbor = draft.movement.arbors.find((item) => item.id === component)
          if (arbor) {
            arbor.wheelThickness = measured(arbor.wheelThickness, thickness)
            const teeth = Math.max(1, valueOf(arbor.wheelTeeth))
            arbor.moduleToNext = measured(arbor.moduleToNext, envelope / teeth)
          }
        }
        draft.movement.componentOrigins[component] = {
          kind: 'imported-step',
          sourceMovement: draft.movement.name,
          importedFileName: inspection.fileName,
          capturedAt: new Date().toISOString(),
          notes: `STEP validado: ${inspection.valid ? 'solido valido' : 'geometria a reparar'} · envolvente ${inspection.size.map((value) => value.toFixed(3)).join(' × ')} mm · volumen ${inspection.volumeMm3.toFixed(2)} mm³. La orientacion y las interfaces funcionales deben confirmarse con metrologia.`,
          reliability: inspection.valid ? 'medium' : 'low',
        }
        draft.movement.buildMode = draft.movement.buildMode === 'scratch' ? 'scratch' : 'hybrid'
      })
      return inspection
    },
    updateArbor: (id, field, value) =>
      change(`arbor-${id}-${field}`, (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        const arbor = draft.movement.arbors.find((item) => item.id === id)
        if (arbor) {
          const current = arbor[field]
          const unit = field === 'pressureAngle'
            ? 'deg'
            : field === 'wheelTeeth' || field === 'pinionTeeth' || field === 'profileShift' || field === 'addendumCoefficient' || field === 'dedendumCoefficient'
              ? 'count'
              : 'mm'
          arbor[field] = current
            ? withDesignedValue(current, value)
            : dimension(value, unit, 'designed', 'Editado en Watch Prototype Lab')
        }
      }),
    setArborProfile: (id, profile) =>
      change(`arbor-${id}-profile`, (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        const arbor = draft.movement.arbors.find((item) => item.id === id)
        if (arbor) arbor.profileToNext = profile
      }),
    moveArbor: (id, x, y) =>
      change(`arbor-drag-${id}`, (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        const arbor = draft.movement.arbors.find((item) => item.id === id)
        if (!arbor) return
        arbor.x = withDesignedValue(arbor.x, Number(x.toFixed(3)))
        arbor.y = withDesignedValue(arbor.y, Number(y.toFixed(3)))
      }),
    autoPlaceTrain: () =>
      change('mechanical-auto-place', (draft) => {
        if (draft.movement.kind !== 'mechanical') return
        const arbors = draft.movement.arbors
        const center = arbors.find((item) => item.id === 'center')
        if (!center) return
        center.x.value = 0
        center.y.value = 0
        const angles = [Math.PI * 0.89, Math.PI * 0.19, -Math.PI * 0.44, -Math.PI * 0.89]
        const ordered: MechanicalArborId[] = ['barrel', 'center', 'third', 'fourth', 'escape']
        for (let index = 0; index < ordered.length - 1; index += 1) {
          const driver = arbors.find((item) => item.id === ordered[index])
          const driven = arbors.find((item) => item.id === ordered[index + 1])
          if (!driver || !driven) continue
          const target =
            (valueOf(driver.moduleToNext) * (valueOf(driver.wheelTeeth) + valueOf(driven.pinionTeeth))) / 2
          if (driver.id === 'barrel') {
            driver.x.value = valueOf(driven.x) + Math.cos(angles[index]) * target
            driver.y.value = valueOf(driven.y) + Math.sin(angles[index]) * target
          } else {
            driven.x.value = valueOf(driver.x) + Math.cos(angles[index]) * target
            driven.y.value = valueOf(driver.y) + Math.sin(angles[index]) * target
          }
        }
      }),
    replaceWithMechanical: () =>
      change('replace-mechanical', (draft) => {
        draft.movement = createMechanicalMovement()
        draft.case.outerDiameter.value = Math.max(valueOf(draft.case.outerDiameter), 42)
        draft.case.innerDiameter.value = Math.max(valueOf(draft.case.innerDiameter), 36)
        draft.case.totalHeight.value = Math.max(valueOf(draft.case.totalHeight), 11.5)
        draft.case.usableInteriorHeight.value = Math.max(valueOf(draft.case.usableInteriorHeight), 9.1)
        draft.case.stemAxisZ.value = 3.05
        draft.dial.seatZ.value = 6.15
        draft.dial.diameter.value = 34
        draft.hands.hour.holeDiameter.value = 1.5
        draft.hands.minute.holeDiameter.value = 0.9
        draft.hands.second.holeDiameter.value = 0.25
      }),
    loadTemplate: (id) => {
      replaceProject(projectFromTemplate(id), 'movement')
      set({ viewMode: 'assembled' })
    },
    undo: () => {
      const state = get()
      const previous = state.past.at(-1)
      if (!previous) return
      persist(previous)
      set({
        project: previous,
        past: state.past.slice(0, -1),
        future: [state.project, ...state.future].slice(0, 80),
        lastEditKey: null,
        lastEditAt: 0,
        ...staleCadState(),
      })
    },
    redo: () => {
      const state = get()
      const next = state.future[0]
      if (!next) return
      persist(next)
      set({
        project: next,
        past: [...state.past, state.project].slice(-80),
        future: state.future.slice(1),
        lastEditKey: null,
        lastEditAt: 0,
        ...staleCadState(),
      })
    },
    saveToLibrary: () => {
      const copy = cloneProject(get().project)
      const withoutCurrent = get().savedProjects.filter((item) => item.id !== copy.id)
      const savedProjects = [copy, ...withoutCurrent].slice(0, 40)
      persistLibrary(savedProjects)
      set({ savedProjects })
      if (isNativeApp()) {
        void saveNativeProject(copy)
          .then(() => listNativeProjects())
          .then((nativeProjects) => set({ nativeProjects, nativeError: null }))
          .catch((error) => set({ nativeError: error instanceof Error ? error.message : String(error) }))
      }
    },
    saveSelectedPartToLibrary: () => {
      const preset = partPresetFromSelection(get().project, get().selectedPart)
      const savedParts = [preset, ...get().savedParts].slice(0, 120)
      persistPartLibrary(savedParts)
      set({ savedParts })
      if (isNativeApp()) {
        void saveNativePart(preset)
          .then(() => listNativeParts())
          .then((nativeParts) => set({ savedParts: nativeParts, nativeError: null }))
          .catch((error) => set({ nativeError: error instanceof Error ? error.message : String(error) }))
      }
    },
    analyzeSavedComponent: (id) => {
      const preset = get().savedParts.find((item) => item.id === id)
      if (!preset || preset.kind !== 'movement-component') return null
      const report = analyzeComponentCompatibility(get().project, preset)
      set({ lastCompatibilityReport: report })
      return report
    },
    applySavedPart: (id, force = false) => {
      const preset = get().savedParts.find((item) => item.id === id)
      if (!preset) return null
      let compatibility: ComponentCompatibilityReport | null = null
      if (preset.kind === 'movement-component') {
        compatibility = analyzeComponentCompatibility(get().project, preset)
        set({ lastCompatibilityReport: compatibility })
        if (compatibility.state === 'incompatible' && !force) return compatibility
      }
      change(`apply-part-${id}`, (draft) => {
        if (preset.kind === 'case') draft.case = cloneValue(preset.payload)
        else if (preset.kind === 'dial') draft.dial = cloneValue(preset.payload)
        else if (preset.kind === 'crystal') draft.crystal = cloneValue(preset.payload)
        else if (preset.kind === 'hands') draft.hands = cloneValue(preset.payload)
        else if (preset.kind === 'movement') draft.movement = cloneValue(preset.payload)
        else applyMovementComponent(draft, preset as MovementComponentPreset)
      })
      const selectedPart: WatchPartId = preset.kind === 'case'
        ? 'case'
        : preset.kind === 'hands'
          ? 'minuteHand'
          : preset.kind === 'movement-component'
            ? preset.componentType === 'jewel-set' ? 'jewel' : preset.componentType
            : preset.kind
      set({
        selectedPart,
        workspace: preset.kind === 'movement' || preset.kind === 'movement-component' ? 'movement' : 'parts',
        viewMode: 'isolate',
      })
      return compatibility
    },
    clearCompatibilityReport: () => set({ lastCompatibilityReport: null }),
    deleteSavedPart: (id) => {
      const savedParts = get().savedParts.filter((item) => item.id !== id)
      persistPartLibrary(savedParts)
      set({ savedParts })
      if (isNativeApp()) {
        void deleteNativePart(id)
          .catch((error) => set({ nativeError: error instanceof Error ? error.message : String(error) }))
      }
    },
    loadSavedProject: (id) => {
      const project = get().savedProjects.find((item) => item.id === id)
      if (project) {
        replaceProject(project)
        set({ viewMode: 'assembled' })
      }
    },
    deleteSavedProject: (id) => {
      const savedProjects = get().savedProjects.filter((item) => item.id !== id)
      persistLibrary(savedProjects)
      set({ savedProjects })
      if (isNativeApp()) {
        void deleteNativeProject(id)
          .then(() => set({ nativeProjects: get().nativeProjects.filter((item) => item.id !== id) }))
          .catch((error) => set({ nativeError: error instanceof Error ? error.message : String(error) }))
      }
    },
    importProject: (input) => {
      if (!validProject(input)) return { ok: false, error: 'El archivo no es un proyecto Watch Lab compatible.' }
      replaceProject(input)
      return { ok: true }
    },
  }
})
