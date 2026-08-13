import { create } from 'zustand'
import {
  CASE_PRESETS,
  CRYSTAL_PRESETS,
  HANDS_PRESETS,
  MOVEMENTS,
  STEMS,
  TECHNICAL_DIALS,
  createDefaultDesign,
} from '../data/catalog'
import { normalizeDesign } from '../data/designMigration'
import { createDesignFromTemplate, getProjectTemplate } from '../data/projectTemplates'
import { normalizeToolForPart } from '../logic/editorTools'
import { applyVariantToDesign } from '../logic/variants'
import type {
  CaseConfig,
  CrystalConfig,
  DataQuality,
  DialConfig,
  EditorTool,
  ExperienceMode,
  FocusMode,
  HandConfig,
  HandsConfig,
  LabPreset,
  Opportunity,
  PanelTab,
  ProjectTemplateId,
  ReliefFeature,
  RenderMode,
  SelectablePart,
  SmartAction,
  StemConfig,
  StudioViewMode,
  VariantKind,
  ViewMode,
  VisualReflectionLevel,
  WatchMaterials,
  WatchDesign,
  WorkshopPartKind,
  WorkshopSavedPart,
  WorkbenchMode,
  ExperimentSlot,
} from '../types'

const LIBRARY_KEY = 'watch-prototype-lab-designs'
const PART_LIBRARY_KEY = 'watch-prototype-lab-parts'

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const loadLibrary = (): WatchDesign[] => {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.map(normalizeDesign) : []
  } catch {
    return []
  }
}

const persistLibrary = (library: WatchDesign[]) => {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
}

const loadPartLibrary = (): WorkshopSavedPart[] => {
  try {
    const raw = localStorage.getItem(PART_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as WorkshopSavedPart[]) : []
  } catch {
    return []
  }
}

const persistPartLibrary = (partLibrary: WorkshopSavedPart[]) => {
  localStorage.setItem(PART_LIBRARY_KEY, JSON.stringify(partLibrary))
}

const touch = (design: WatchDesign): WatchDesign => ({
  ...design,
  updatedAt: new Date().toISOString(),
})

const dataQualityFromMeasurements = (value: string | number | undefined): DataQuality =>
  value === undefined || value === '' ? 'supplier_partial' : 'measured_by_user'

const HISTORY_LIMIT = 80

interface VisualDesignPatch {
  materials?: Partial<WatchMaterials>
  case?: Partial<CaseConfig>
  crystal?: Partial<CrystalConfig>
  dial?: Partial<Omit<DialConfig, 'reliefs'>>
  reliefs?: ReliefFeature[]
  hands?: Partial<Omit<HandsConfig, 'hour' | 'minute' | 'second'>>
  handPatches?: Partial<Record<'hour' | 'minute' | 'second', Partial<HandConfig>>>
}

const isHandPart = (part: SelectablePart) => part === 'hourHand' || part === 'minuteHand' || part === 'secondHand'

const technicalDialForMovement = (movementId: string, fallbackId: string) =>
  Object.values(TECHNICAL_DIALS).find((dial) => dial.movementId === movementId)?.id ?? fallbackId

const withMovementProfile = (design: WatchDesign, movementId: string): WatchDesign => {
  const movement = MOVEMENTS[movementId]
  if (!movement) return design

  return {
    ...design,
    movementId,
    dial: {
      ...design.dial,
      technicalPresetId: technicalDialForMovement(movementId, design.dial.technicalPresetId),
    },
    hands: {
      ...design.hands,
      hour: {
        ...design.hands.hour,
        heightOverDial: movement.handStackProfile.hourHeightOverDial,
      },
      minute: {
        ...design.hands.minute,
        heightOverDial: movement.handStackProfile.minuteHeightOverDial,
      },
      second: {
        ...design.hands.second,
        heightOverDial: movement.handStackProfile.secondHeightOverDial,
      },
    },
  }
}

const partKindForSelection = (part: SelectablePart): WorkshopPartKind => {
  if (part.startsWith('relief:')) return 'relief'
  if (isHandPart(part)) return 'hands'
  if (part === 'stem' || part === 'crown') return 'stem'
  if (part === 'movement') return 'movement'
  if (part === 'case') return 'case'
  if (part === 'dial') return 'dial'
  return 'crystal'
}

const viewModeForFocus = (focusMode: FocusMode, selectedPart: SelectablePart, workbenchMode: WorkbenchMode): ViewMode => {
  if (focusMode === 'assembly') return 'free'
  if (focusMode === 'ghost') {
    if (workbenchMode === 'risk_lab') return 'heatmap'
    if (workbenchMode === 'xray') return 'layers'
    return 'free'
  }
  if (isHandPart(selectedPart)) return 'sweep'
  if (selectedPart === 'movement' || selectedPart === 'stem' || selectedPart === 'crown') return 'layers'
  return 'section'
}

const withHistory = (state: LabState, design: WatchDesign) => ({
  design: touch(design),
  undoStack: [...state.undoStack, clone(state.design)].slice(-HISTORY_LIMIT),
  redoStack: [],
  liveEditActive: false,
})

interface LabState {
  design: WatchDesign
  undoStack: WatchDesign[]
  redoStack: WatchDesign[]
  liveEditActive: boolean
  experienceMode: ExperienceMode
  studioViewMode: StudioViewMode
  activeTab: PanelTab
  workbenchMode: WorkbenchMode
  focusMode: FocusMode
  activeTool: EditorTool
  snapEnabled: boolean
  snapStep: number
  selectedPart: SelectablePart
  selectionLocked: boolean
  visualCrystalVisible: boolean
  visualReflectionLevel: VisualReflectionLevel
  experimentSlots: ExperimentSlot[]
  library: WatchDesign[]
  partLibrary: WorkshopSavedPart[]
  lastOpportunityScan: Opportunity[]
  setExperienceMode: (mode: ExperienceMode) => void
  setStudioViewMode: (mode: StudioViewMode) => void
  setActiveTab: (tab: PanelTab) => void
  undo: () => void
  redo: () => void
  setWorkbenchMode: (mode: WorkbenchMode) => void
  setFocusMode: (mode: FocusMode) => void
  setActiveTool: (tool: EditorTool) => void
  setSnapEnabled: (enabled: boolean) => void
  setSnapStep: (step: number) => void
  setSelectedPart: (part: SelectablePart) => void
  setSelectionLocked: (locked: boolean) => void
  setVisualCrystalVisible: (visible: boolean) => void
  setVisualReflectionLevel: (level: VisualReflectionLevel) => void
  setViewMode: (viewMode: ViewMode) => void
  setRenderMode: (renderMode: RenderMode) => void
  patchMaterials: (patch: Partial<WatchMaterials>) => void
  applyVisualDesignPatch: (patch: VisualDesignPatch) => void
  patchMeta: (patch: Partial<Pick<WatchDesign, 'name' | 'notes'>>) => void
  selectMovement: (movementId: string) => void
  setMovementRotation: (rotation: number) => void
  patchCase: (patch: Partial<CaseConfig>) => void
  patchCaseLive: (patch: Partial<CaseConfig>) => void
  applyCasePreset: (presetId: string) => void
  patchCrystal: (patch: Partial<CrystalConfig>) => void
  patchCrystalLive: (patch: Partial<CrystalConfig>) => void
  applyCrystalPreset: (presetId: string) => void
  patchDial: (patch: Partial<Omit<DialConfig, 'reliefs'>>) => void
  patchDialLive: (patch: Partial<Omit<DialConfig, 'reliefs'>>) => void
  addRelief: (type: ReliefFeature['type']) => void
  patchRelief: (id: string, patch: Partial<ReliefFeature>) => void
  patchReliefLive: (id: string, patch: Partial<ReliefFeature>) => void
  removeRelief: (id: string) => void
  patchHands: (patch: Partial<Omit<HandsConfig, 'hour' | 'minute' | 'second'>>) => void
  patchHand: (handName: 'hour' | 'minute' | 'second', patch: Partial<HandConfig>) => void
  patchHandLive: (handName: 'hour' | 'minute' | 'second', patch: Partial<HandConfig>) => void
  patchHandCurvature: (
    handName: 'hour' | 'minute' | 'second',
    patch: Partial<HandConfig['curvature']>,
  ) => void
  applyHandsPreset: (presetId: string) => void
  patchStem: (patch: Partial<StemConfig>) => void
  selectStem: (stemId: string) => void
  updateMeasurement: (section: 'case' | 'hands' | 'dial', field: string, value: string | number) => void
  applyMeasurements: (section: 'case' | 'hands' | 'dial') => void
  applyProjectTemplate: (templateId: ProjectTemplateId) => void
  applyLabPreset: (preset: LabPreset) => void
  applySmartAction: (action: SmartAction) => void
  applyVariant: (variant: VariantKind) => void
  saveExperimentSlot: (slotId: ExperimentSlot['id']) => void
  loadExperimentSlot: (slotId: ExperimentSlot['id']) => void
  loadDesign: (design: WatchDesign) => void
  duplicateDesign: () => void
  saveToLibrary: () => void
  deleteFromLibrary: (id: string) => void
  saveSelectedPartToLibrary: (label?: string) => void
  applySavedPart: (id: string) => void
  deleteSavedPart: (id: string) => void
  setLastOpportunityScan: (opportunities: Opportunity[]) => void
  beginLiveEdit: () => void
  endLiveEdit: () => void
  resetDesign: () => void
}

export const useLabStore = create<LabState>((set, get) => ({
  design: createDefaultDesign(),
  undoStack: [],
  redoStack: [],
  liveEditActive: false,
  experienceMode: 'dashboard',
  studioViewMode: 'technical',
  activeTab: 'validation',
  workbenchMode: 'stack_lab',
  focusMode: 'assembly',
  activeTool: 'size',
  snapEnabled: true,
  snapStep: 0.05,
  selectedPart: 'case',
  selectionLocked: true,
  visualCrystalVisible: true,
  visualReflectionLevel: 'medium',
  experimentSlots: [
    { id: 'A', label: 'A', design: null, savedAt: null },
    { id: 'B', label: 'B', design: null, savedAt: null },
    { id: 'C', label: 'C', design: null, savedAt: null },
  ],
  library: loadLibrary(),
  partLibrary: loadPartLibrary(),
  lastOpportunityScan: [],

  setExperienceMode: (experienceMode) =>
    set((state) => {
      if (experienceMode === 'technical_workshop') {
        return {
          experienceMode,
          studioViewMode: 'technical',
          workbenchMode: 'stack_lab',
          focusMode: 'assembly',
          activeTab: 'validation',
          design: touch({ ...state.design, renderMode: 'technical', viewMode: 'free' }),
        }
      }

      if (experienceMode === 'visual_studio') {
        return {
          experienceMode,
          studioViewMode: 'design',
          workbenchMode: 'dial_lab',
          focusMode: 'workshop',
          activeTab: 'dial',
          selectedPart: state.selectedPart === 'movement' ? 'dial' : state.selectedPart,
          activeTool: normalizeToolForPart(state.selectedPart === 'movement' ? 'dial' : state.selectedPart, state.activeTool),
          design: touch({ ...state.design, renderMode: 'beauty', viewMode: 'free' }),
        }
      }

      if (experienceMode === 'library') {
        return {
          experienceMode,
          studioViewMode: state.studioViewMode === 'presentation' ? 'design' : state.studioViewMode,
        }
      }

      return {
        experienceMode,
        studioViewMode: state.studioViewMode === 'presentation' ? 'design' : state.studioViewMode,
      }
    }),

  setStudioViewMode: (studioViewMode) =>
    set((state) => {
      if (studioViewMode === 'design') {
        return {
          studioViewMode,
          design: touch({ ...state.design, renderMode: 'beauty', viewMode: 'free' }),
        }
      }

      if (studioViewMode === 'technical') {
        return {
          studioViewMode,
          design: touch({ ...state.design, renderMode: 'technical', viewMode: state.design.viewMode === 'heatmap' ? 'heatmap' : 'section' }),
        }
      }

      return {
        studioViewMode,
        focusMode: 'assembly',
        design: touch({ ...state.design, renderMode: 'beauty', viewMode: 'free' }),
      }
    }),

  setActiveTab: (activeTab) => set({ activeTab }),

  undo: () =>
    set((state) => {
      const previous = state.undoStack.at(-1)
      if (!previous) return state

      return {
        design: touch(clone(previous)),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [clone(state.design), ...state.redoStack].slice(0, HISTORY_LIMIT),
        liveEditActive: false,
      }
    }),

  redo: () =>
    set((state) => {
      const next = state.redoStack[0]
      if (!next) return state

      return {
        design: touch(clone(next)),
        undoStack: [...state.undoStack, clone(state.design)].slice(-HISTORY_LIMIT),
        redoStack: state.redoStack.slice(1),
        liveEditActive: false,
      }
    }),

  setFocusMode: (focusMode) =>
    set((state) => ({
      focusMode,
      design: touch({
        ...state.design,
        viewMode: viewModeForFocus(focusMode, state.selectedPart, state.workbenchMode),
      }),
    })),

  setActiveTool: (activeTool) =>
    set((state) => ({
      activeTool: normalizeToolForPart(state.selectedPart, activeTool),
    })),

  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),

  setSnapStep: (snapStep) => set({ snapStep: Math.max(0.005, Math.min(1, snapStep)) }),

  setSelectionLocked: (selectionLocked) => set({ selectionLocked }),

  setVisualCrystalVisible: (visualCrystalVisible) => set({ visualCrystalVisible }),

  setVisualReflectionLevel: (visualReflectionLevel) => set({ visualReflectionLevel }),

  setWorkbenchMode: (workbenchMode) => {
    const viewByMode: Record<WorkbenchMode, ViewMode> = {
      assemble: 'free',
      stack_lab: 'free',
      dial_lab: 'section',
      hands_lab: 'sweep',
      xray: 'layers',
      risk_lab: 'heatmap',
      measure: 'section',
    }
    const tabByMode: Record<WorkbenchMode, PanelTab> = {
      assemble: 'presets',
      stack_lab: 'validation',
      dial_lab: 'dial',
      hands_lab: 'hands',
      xray: 'validation',
      risk_lab: 'opportunities',
      measure: 'measurements',
    }
    const selectedByMode: Partial<Record<WorkbenchMode, SelectablePart>> = {
      assemble: 'case',
      stack_lab: 'case',
      dial_lab: 'dial',
      hands_lab: 'minuteHand',
      xray: 'movement',
      risk_lab: 'dial',
      measure: 'case',
    }
    const toolByMode: Partial<Record<WorkbenchMode, EditorTool>> = {
      dial_lab: 'depth',
      hands_lab: 'height',
      risk_lab: 'height',
      stack_lab: 'size',
    }
    const focusByMode: Record<WorkbenchMode, FocusMode> = {
      assemble: 'assembly',
      stack_lab: 'assembly',
      dial_lab: 'workshop',
      hands_lab: 'workshop',
      xray: 'ghost',
      risk_lab: 'ghost',
      measure: 'ghost',
    }

    set((state) => ({
      workbenchMode,
      focusMode: focusByMode[workbenchMode],
      selectedPart: selectedByMode[workbenchMode] ?? state.selectedPart,
      activeTool: normalizeToolForPart(selectedByMode[workbenchMode] ?? state.selectedPart, toolByMode[workbenchMode] ?? state.activeTool),
      activeTab: tabByMode[workbenchMode],
      design: touch({ ...state.design, viewMode: viewByMode[workbenchMode], renderMode: 'technical' }),
    }))
  },

  setSelectedPart: (selectedPart) => {
    const tabByPart: Partial<Record<SelectablePart, PanelTab>> = {
      movement: 'movement',
      case: 'case',
      dial: 'dial',
      crystal: 'crystal',
      stem: 'stem',
      crown: 'stem',
      hourHand: 'hands',
      minuteHand: 'hands',
      secondHand: 'hands',
    }
    const tab = selectedPart.startsWith('relief:') ? 'dial' : tabByPart[selectedPart]

    set((state) => ({
      selectedPart,
      activeTool: normalizeToolForPart(selectedPart, state.activeTool),
      activeTab: tab ?? state.activeTab,
    }))
  },

  setViewMode: (viewMode) =>
    set((state) => ({
      design: touch({ ...state.design, viewMode }),
    })),

  setRenderMode: (renderMode) =>
    set((state) => ({
      design: touch({ ...state.design, renderMode }),
    })),

  patchMaterials: (patch) =>
    set((state) => withHistory(state, {
      ...state.design,
      materials: {
        ...state.design.materials,
        ...patch,
      },
    })),

  applyVisualDesignPatch: (patch) =>
    set((state) => {
      let hands = state.design.hands
      if (patch.hands || patch.handPatches) {
        hands = {
          ...state.design.hands,
          ...patch.hands,
          hour: {
            ...state.design.hands.hour,
            ...patch.handPatches?.hour,
          },
          minute: {
            ...state.design.hands.minute,
            ...patch.handPatches?.minute,
          },
          second: {
            ...state.design.hands.second,
            ...patch.handPatches?.second,
          },
        }
      }

      return withHistory(state, {
        ...state.design,
        materials: {
          ...state.design.materials,
          ...patch.materials,
        },
        case: {
          ...state.design.case,
          ...patch.case,
        },
        crystal: {
          ...state.design.crystal,
          ...patch.crystal,
        },
        dial: {
          ...state.design.dial,
          ...patch.dial,
          reliefs: patch.reliefs ? patch.reliefs.map((relief) => ({ ...relief })) : state.design.dial.reliefs,
        },
        hands,
      })
    }),

  patchMeta: (patch) =>
    set((state) => withHistory(state, { ...state.design, ...patch })),

  selectMovement: (movementId) => {
    if (!MOVEMENTS[movementId]) return

    set((state) =>
      withHistory(state, {
        ...withMovementProfile(state.design, movementId),
        stem: {
          ...state.design.stem,
          selectedStemId: MOVEMENTS[movementId].standardStem,
        },
      }),
    )
  },

  setMovementRotation: (movementRotationDeg) =>
    set((state) => withHistory(state, { ...state.design, movementRotationDeg })),

  patchCase: (patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        case: {
          ...state.design.case,
          ...patch,
          dataQuality: patch.dataQuality ?? state.design.case.dataQuality,
        },
      }),
    ),

  patchCaseLive: (patch) =>
    set((state) => ({
      design: touch({
        ...state.design,
        case: {
          ...state.design.case,
          ...patch,
          dataQuality: patch.dataQuality ?? state.design.case.dataQuality,
        },
      }),
    })),

  applyCasePreset: (presetId) => {
    const preset = CASE_PRESETS[presetId]
    if (!preset) return

    set((state) =>
      withHistory(state, {
        ...state.design,
        case: {
          ...state.design.case,
          presetId,
          shape: preset.shape,
          outerDiameter: preset.outerDiameter,
          totalHeight: preset.totalHeight,
          interiorHeightAvailable: Math.max(preset.totalHeight - 2.3, 5.8),
          wallThickness: Math.max((preset.outerDiameter - preset.innerDiameter) / 2, 0.4),
          innerDiameter: preset.innerDiameter,
          dialSeatDiameter: preset.innerDiameter - 0.9,
          crownTubeDiameter: preset.crownTubeDiameter,
          crownThread: preset.crownThread,
          crownDiameter: preset.crownDiameter,
          crownDistanceFromCenter: preset.outerDiameter / 2 + preset.crownTubeDiameter / 2,
          lugWidth: preset.lugWidth,
          screwCrown: Boolean(preset.screwCrown),
          dataQuality: preset.dataQuality,
        },
        crystal: {
          ...state.design.crystal,
          diameter: preset.innerDiameter,
          usableInteriorHeight: Math.max(preset.totalHeight - 2.3, 5.8),
          dataQuality: 'supplier_partial',
        },
      }),
    )
  },

  patchCrystal: (patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        crystal: {
          ...state.design.crystal,
          ...patch,
        },
      }),
    ),

  patchCrystalLive: (patch) =>
    set((state) => ({
      design: touch({
        ...state.design,
        crystal: {
          ...state.design.crystal,
          ...patch,
        },
      }),
    })),

  applyCrystalPreset: (presetId) => {
    const preset = CRYSTAL_PRESETS[presetId]
    if (!preset) return

    set((state) =>
      withHistory(state, {
        ...state.design,
        crystal: {
          ...state.design.crystal,
          presetId,
          type: preset.type,
          profile: preset.profile,
          thickness: preset.thickness,
          usableInteriorHeight: preset.usableInteriorHeight,
          diameter: preset.diameter,
          dataQuality: preset.dataQuality,
        },
      }),
    )
  },

  patchDial: (patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        dial: {
          ...state.design.dial,
          ...patch,
        },
      }),
    ),

  patchDialLive: (patch) =>
    set((state) => ({
      design: touch({
        ...state.design,
        dial: {
          ...state.design.dial,
          ...patch,
        },
      }),
    })),

  addRelief: (type) =>
    set((state) => {
      const relief: ReliefFeature = {
        id: `relief-${Date.now()}`,
        label: type === 'line' ? 'Índice editable' : type === 'rect' ? 'Bloque editable' : 'Relieve editable',
        type,
        x: type === 'line' ? 0 : 6,
        y: type === 'line' ? 11.5 : 6,
        radius: type === 'circle' ? 1.2 : 0.3,
        width: type === 'line' ? 0.45 : 1.4,
        length: type === 'line' ? 2.2 : 1.4,
        height: 0.25,
        color: type === 'marker' ? '#fb7185' : '#f97316',
        material: 'paramétrico',
        dataQuality: 'estimated',
      }

      return {
        selectedPart: `relief:${relief.id}`,
        activeTool: 'move',
        activeTab: 'dial',
        workbenchMode: 'dial_lab',
        focusMode: 'workshop',
        ...withHistory(state, {
          ...state.design,
          viewMode: 'section',
          dial: {
            ...state.design.dial,
            reliefs: [...state.design.dial.reliefs, relief],
          },
        }),
      }
    }),

  patchRelief: (id, patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        dial: {
          ...state.design.dial,
          reliefs: state.design.dial.reliefs.map((relief) =>
            relief.id === id ? { ...relief, ...patch } : relief,
          ),
        },
      }),
    ),

  patchReliefLive: (id, patch) =>
    set((state) => ({
      design: touch({
        ...state.design,
        dial: {
          ...state.design.dial,
          reliefs: state.design.dial.reliefs.map((relief) =>
            relief.id === id ? { ...relief, ...patch } : relief,
          ),
        },
      }),
    })),

  removeRelief: (id) =>
    set((state) => ({
        selectedPart: state.selectedPart === `relief:${id}` ? 'dial' : state.selectedPart,
        activeTool: state.selectedPart === `relief:${id}` ? 'depth' : state.activeTool,
        ...withHistory(state, {
        ...state.design,
        dial: {
          ...state.design.dial,
          reliefs: state.design.dial.reliefs.filter((relief) => relief.id !== id),
        },
      }),
    })),

  patchHands: (patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        hands: {
          ...state.design.hands,
          ...patch,
        },
      }),
    ),

  patchHand: (handName, patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        hands: {
          ...state.design.hands,
          [handName]: {
            ...state.design.hands[handName],
            ...patch,
          },
        },
      }),
    ),

  patchHandLive: (handName, patch) =>
    set((state) => ({
      design: touch({
        ...state.design,
        hands: {
          ...state.design.hands,
          [handName]: {
            ...state.design.hands[handName],
            ...patch,
          },
        },
      }),
    })),

  patchHandCurvature: (handName, patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        hands: {
          ...state.design.hands,
          [handName]: {
            ...state.design.hands[handName],
            curvature: {
              ...state.design.hands[handName].curvature,
              ...patch,
            },
          },
        },
      }),
    ),

  applyHandsPreset: (presetId) => {
    const preset = HANDS_PRESETS[presetId]
    if (!preset) return

    set((state) =>
      withHistory(state, {
        ...state.design,
        hands: {
          ...state.design.hands,
          presetId,
          familyId: preset.familyId,
          hour: preset.hour
            ? {
                ...state.design.hands.hour,
                ...preset.hour,
                material: preset.hour.material ?? preset.material,
                dataQuality: preset.dataQuality,
              }
            : state.design.hands.hour,
          minute: preset.minute
            ? {
                ...state.design.hands.minute,
                ...preset.minute,
                material: preset.minute.material ?? preset.material,
                dataQuality: preset.dataQuality,
              }
            : state.design.hands.minute,
          second: preset.second
            ? {
                ...state.design.hands.second,
                ...preset.second,
                material: preset.second.material ?? preset.material,
                dataQuality: preset.dataQuality,
              }
            : state.design.hands.second,
          dataQuality: preset.dataQuality,
        },
      }),
    )
  },

  patchStem: (patch) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        stem: {
          ...state.design.stem,
          ...patch,
        },
      }),
    ),

  selectStem: (selectedStemId) => {
    const stem = STEMS[selectedStemId]
    if (!stem) return

    set((state) =>
      withHistory(state, {
        ...state.design,
        stem: {
          ...state.design.stem,
          selectedStemId,
          customLength: stem.drawnLength,
          dataQuality: stem.dataQuality,
        },
      }),
    )
  },

  updateMeasurement: (section, field, value) =>
    set((state) =>
      withHistory(state, {
        ...state.design,
        measurements: {
          ...state.design.measurements,
          [section]: {
            ...state.design.measurements[section],
            [field]: value,
          },
        },
      }),
    ),

  applyMeasurements: (section) => {
    const measurements = get().design.measurements[section]
    const numeric = (field: string) => {
      const value = measurements[field]
      const numberValue = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(numberValue) ? numberValue : undefined
    }

    if (section === 'case') {
      get().patchCase({
        outerDiameter: numeric('outerDiameter') ?? get().design.case.outerDiameter,
        totalHeight: numeric('totalHeight') ?? get().design.case.totalHeight,
        innerDiameter: numeric('innerDiameter') ?? get().design.case.innerDiameter,
        dialSeatDiameter: numeric('dialSeatDiameter') ?? get().design.case.dialSeatDiameter,
        interiorHeightAvailable: numeric('interiorHeightAvailable') ?? get().design.case.interiorHeightAvailable,
        crownDistanceFromCenter: numeric('crownDistanceFromCenter') ?? get().design.case.crownDistanceFromCenter,
        crownTubeDiameter: numeric('crownTubeDiameter') ?? get().design.case.crownTubeDiameter,
        holderHeight: numeric('holderHeight') ?? get().design.case.holderHeight,
        dataQuality: dataQualityFromMeasurements(measurements.outerDiameter),
      })
    }

    if (section === 'hands') {
      get().patchHand('hour', {
        holeSize: numeric('hourHoleSize') ?? get().design.hands.hour.holeSize,
        length: numeric('hourLength') ?? get().design.hands.hour.length,
        width: numeric('hourWidth') ?? get().design.hands.hour.width,
        thickness: numeric('hourThickness') ?? get().design.hands.hour.thickness,
        tubeHeight: numeric('hourTubeHeight') ?? get().design.hands.hour.tubeHeight,
        dataQuality: dataQualityFromMeasurements(measurements.hourLength),
      })
      get().patchHand('minute', {
        holeSize: numeric('minuteHoleSize') ?? get().design.hands.minute.holeSize,
        length: numeric('minuteLength') ?? get().design.hands.minute.length,
        width: numeric('minuteWidth') ?? get().design.hands.minute.width,
        thickness: numeric('minuteThickness') ?? get().design.hands.minute.thickness,
        tubeHeight: numeric('minuteTubeHeight') ?? get().design.hands.minute.tubeHeight,
        dataQuality: dataQualityFromMeasurements(measurements.minuteLength),
      })
      get().patchHands({ dataQuality: 'measured_by_user' })
    }

    if (section === 'dial') {
      get().patchDial({
        commercialDiameter: numeric('diameter') ?? get().design.dial.commercialDiameter,
        thickness: numeric('thickness') ?? get().design.dial.thickness,
        centerHole: numeric('centerHole') ?? get().design.dial.centerHole,
        dataQuality: dataQualityFromMeasurements(measurements.diameter),
      })
    }
  },

  applyProjectTemplate: (templateId) => {
    const template = getProjectTemplate(templateId)
    const design = createDesignFromTemplate(templateId)

    set({
      design,
      activeTab:
        template?.workbench === 'dial_lab'
          ? 'dial'
          : template?.workbench === 'hands_lab'
            ? 'hands'
            : template?.workbench === 'risk_lab'
              ? 'opportunities'
              : 'validation',
      selectedPart: template?.selectedPart ?? 'dial',
      activeTool: normalizeToolForPart(template?.selectedPart ?? 'dial', 'depth'),
      workbenchMode: template?.workbench ?? 'stack_lab',
      focusMode: template?.focus ?? 'ghost',
      lastOpportunityScan: [],
      undoStack: [],
      redoStack: [],
      liveEditActive: false,
    })
  },

  applyLabPreset: (preset) => {
    if (preset === 'baseline') {
      set((state) => ({
        selectedPart: 'dial',
        activeTool: 'depth',
        workbenchMode: 'stack_lab',
        focusMode: 'ghost',
        activeTab: 'dial',
        ...withHistory(state, {
          ...state.design,
          renderMode: 'technical',
          viewMode: 'section',
          dial: {
            ...state.design.dial,
            sunkenCenter: false,
            sunkenDepth: 0,
            outerRingHeight: 0,
            reliefs: [],
          },
          hands: {
            ...state.design.hands,
            count: 3,
            secondsEnabled: true,
            hour: { ...state.design.hands.hour, heightOverDial: 0.35, curvature: { ...state.design.hands.hour.curvature, bridge: false, stepHeight: 0 } },
            minute: { ...state.design.hands.minute, heightOverDial: 0.72, curvature: { ...state.design.hands.minute.curvature, bridge: false, stepHeight: 0 } },
            second: { ...state.design.hands.second, heightOverDial: 1.18 },
          },
        }),
      }))
    }

    if (preset === 'sunken_dial') {
      set((state) => ({
        selectedPart: 'dial',
        activeTool: 'depth',
        workbenchMode: 'dial_lab',
        focusMode: 'ghost',
        activeTab: 'dial',
        ...withHistory(state, {
          ...state.design,
          renderMode: 'technical',
          viewMode: 'section',
          dial: {
            ...state.design.dial,
            sunkenCenter: true,
            sunkenDepth: 0.55,
            sunkenRadius: 8.6,
            transition: 'soft_bowl',
            outerRingHeight: 0.08,
          },
        }),
      }))
    }

    if (preset === 'two_hand_clearance') {
      set((state) => ({
        selectedPart: 'minuteHand',
        activeTool: 'height',
        workbenchMode: 'hands_lab',
        focusMode: 'ghost',
        activeTab: 'hands',
        ...withHistory(state, {
          ...state.design,
          renderMode: 'technical',
          viewMode: 'sweep',
          hands: {
            ...state.design.hands,
            count: 2,
            secondsEnabled: false,
            hour: { ...state.design.hands.hour, heightOverDial: 0.42 },
            minute: { ...state.design.hands.minute, heightOverDial: 0.84 },
          },
        }),
      }))
    }

    if (preset === 'relief_stress') {
      set((state) => ({
        selectedPart: 'dial',
        activeTool: 'depth',
        workbenchMode: 'risk_lab',
        focusMode: 'ghost',
        activeTab: 'opportunities',
        ...withHistory(state, {
          ...state.design,
          renderMode: 'technical',
          viewMode: 'heatmap',
          dial: {
            ...state.design.dial,
            showSweepZone: true,
            reliefs: [
              ...state.design.dial.reliefs,
              {
                id: `relief-stress-${Date.now()}`,
                label: 'Relieve limite',
                type: 'circle',
                x: 0,
                y: 8.8,
                radius: 1.15,
                width: 1.15,
                length: 1.15,
                height: 0.65,
                color: '#7c3aed',
                material: 'prueba de limite',
                dataQuality: 'estimated',
              },
            ],
          },
        }),
      }))
    }

    if (preset === 'box_crystal') {
      set((state) => ({
        selectedPart: 'crystal',
        activeTool: 'height',
        workbenchMode: 'risk_lab',
        focusMode: 'ghost',
        activeTab: 'crystal',
        ...withHistory(state, {
          ...state.design,
          renderMode: 'technical',
          viewMode: 'transparent',
          crystal: {
            ...state.design.crystal,
            type: 'box',
            usableInteriorHeight: Math.max(state.design.crystal.usableInteriorHeight, 8.4),
            transparency: 0.28,
          },
        }),
      }))
    }
  },

  applySmartAction: (action) => {
    const state = get()
    const now = new Date().toISOString()

    if (action === 'lower_selected_relief') {
      const selectedReliefId = state.selectedPart.startsWith('relief:') ? state.selectedPart.replace('relief:', '') : null
      const fallbackRelief = state.design.dial.reliefs.find((relief) => relief.height > 0.18)
      const reliefId = selectedReliefId ?? fallbackRelief?.id
      if (!reliefId) return

      set((current) => ({
        selectedPart: `relief:${reliefId}`,
        activeTool: 'height',
        activeTab: 'dial',
        ...withHistory(current, {
          ...current.design,
          updatedAt: now,
          dial: {
            ...current.design.dial,
            reliefs: current.design.dial.reliefs.map((relief) =>
              relief.id === reliefId ? { ...relief, height: Math.max(0, Number((relief.height - 0.25).toFixed(2))) } : relief,
            ),
          },
        }),
      }))
    }

    if (action === 'raise_minute_hand') {
      get().patchHand('minute', {
        heightOverDial: Number((state.design.hands.minute.heightOverDial + 0.3).toFixed(2)),
      })
      set({ selectedPart: 'minuteHand', activeTool: 'height', activeTab: 'hands', workbenchMode: 'hands_lab', focusMode: 'ghost' })
    }

    if (action === 'disable_seconds') {
      get().patchHands({ count: 2, secondsEnabled: false })
      set({ selectedPart: 'minuteHand', activeTool: 'height', activeTab: 'hands', workbenchMode: 'hands_lab', focusMode: 'ghost' })
    }

    if (action === 'box_crystal') {
      get().patchCrystal({
        type: 'box',
        usableInteriorHeight: Math.max(state.design.crystal.usableInteriorHeight + 0.6, 8.4),
        transparency: 0.24,
      })
      set({ selectedPart: 'crystal', activeTool: 'height', activeTab: 'crystal', workbenchMode: 'risk_lab', focusMode: 'ghost' })
    }

    if (action === 'add_sunken_center') {
      get().patchDial({
        sunkenCenter: true,
        sunkenDepth: state.design.dial.sunkenDepth === 0 ? 0.35 : state.design.dial.sunkenDepth,
        sunkenRadius: state.design.dial.sunkenRadius,
      })
      set({ selectedPart: 'dial', activeTool: 'depth', activeTab: 'dial', workbenchMode: 'dial_lab', focusMode: 'workshop' })
    }

    if (action === 'flatten_dial') {
      get().patchDial({ sunkenCenter: false, sunkenDepth: 0, outerRingHeight: 0 })
      set((current) => ({
        selectedPart: 'dial',
        activeTool: 'depth',
        activeTab: 'dial',
        workbenchMode: 'dial_lab',
        focusMode: 'workshop',
        design: touch({ ...current.design, viewMode: 'section' }),
      }))
    }
  },

  applyVariant: (variant) => {
    if (variant === 'current') return

    const selectedByVariant: Record<Exclude<VariantKind, 'current'>, SelectablePart> = {
      two_hand: 'minuteHand',
      box_crystal: 'crystal',
      relief_recover: 'dial',
      miyota_2036: 'movement',
    }
    const toolByVariant: Record<Exclude<VariantKind, 'current'>, EditorTool> = {
      two_hand: 'height',
      box_crystal: 'height',
      relief_recover: 'height',
      miyota_2036: 'move',
    }
    const tabByVariant: Record<Exclude<VariantKind, 'current'>, PanelTab> = {
      two_hand: 'hands',
      box_crystal: 'crystal',
      relief_recover: 'dial',
      miyota_2036: 'movement',
    }
    const modeByVariant: Record<Exclude<VariantKind, 'current'>, WorkbenchMode> = {
      two_hand: 'hands_lab',
      box_crystal: 'risk_lab',
      relief_recover: 'risk_lab',
      miyota_2036: 'stack_lab',
    }

    set((state) => ({
      selectedPart: selectedByVariant[variant],
      activeTool: toolByVariant[variant],
      activeTab: tabByVariant[variant],
      workbenchMode: modeByVariant[variant],
      focusMode: 'workshop',
      ...withHistory(state, applyVariantToDesign(state.design, variant)),
    }))
  },

  saveExperimentSlot: (slotId) =>
    set((state) => ({
      experimentSlots: state.experimentSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              design: clone(state.design),
              savedAt: new Date().toISOString(),
            }
          : slot,
      ),
    })),

  loadExperimentSlot: (slotId) => {
    const slot = get().experimentSlots.find((item) => item.id === slotId)
    if (!slot?.design) return
    set({
      design: touch(clone(slot.design)),
      selectedPart: 'dial',
      activeTool: 'depth',
      activeTab: 'validation',
      workbenchMode: 'stack_lab',
      focusMode: 'ghost',
      undoStack: [],
      redoStack: [],
      liveEditActive: false,
    })
  },

  loadDesign: (design) =>
    set({
      design: touch(normalizeDesign(clone(design))),
      activeTab: 'validation',
      selectedPart: 'dial',
      activeTool: 'depth',
      workbenchMode: 'stack_lab',
      focusMode: 'ghost',
      undoStack: [],
      redoStack: [],
      liveEditActive: false,
    }),

  duplicateDesign: () =>
    set((state) => ({
      design: touch({
        ...clone(state.design),
        id: `watch-${Date.now()}`,
        name: `${state.design.name} copia`,
        createdAt: new Date().toISOString(),
      }),
      undoStack: [],
      redoStack: [],
      liveEditActive: false,
    })),

  saveToLibrary: () => {
    const design = touch(clone(get().design))
    const library = [design, ...get().library.filter((item) => item.id !== design.id)].slice(0, 24)
    persistLibrary(library)
    set({ design, library, liveEditActive: false })
  },

  deleteFromLibrary: (id) => {
    const library = get().library.filter((item) => item.id !== id)
    persistLibrary(library)
    set({ library })
  },

  saveSelectedPartToLibrary: (label) => {
    const state = get()
    const { design, selectedPart } = state
    const kind = partKindForSelection(selectedPart)
    const reliefId = selectedPart.startsWith('relief:') ? selectedPart.replace('relief:', '') : null
    const relief = reliefId ? design.dial.reliefs.find((item) => item.id === reliefId) : null

    const payloadByKind: Record<WorkshopPartKind, unknown> = {
      movement: { movementId: design.movementId },
      case: clone(design.case),
      dial: clone(design.dial),
      hands: clone(design.hands),
      crystal: clone(design.crystal),
      stem: {
        stem: clone(design.stem),
        casePatch: {
          crownDistanceFromCenter: design.case.crownDistanceFromCenter,
          crownTubeDiameter: design.case.crownTubeDiameter,
          crownThread: design.case.crownThread,
          crownDiameter: design.case.crownDiameter,
          crownPositionDeg: design.case.crownPositionDeg,
        },
      },
      relief: relief ? clone(relief) : null,
    }

    const qualityByKind: Record<WorkshopPartKind, DataQuality> = {
      movement: MOVEMENTS[design.movementId]?.dataQuality ?? 'unknown',
      case: design.case.dataQuality,
      dial: design.dial.dataQuality,
      hands: design.hands.dataQuality,
      crystal: design.crystal.dataQuality,
      stem: design.stem.dataQuality,
      relief: relief?.dataQuality ?? 'unknown',
    }

    const payload = payloadByKind[kind]
    if (!payload) return

    const savedPart: WorkshopSavedPart = {
      id: `part-${Date.now()}`,
      label: label?.trim() || `${kind} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      kind,
      createdAt: new Date().toISOString(),
      dataQuality: qualityByKind[kind],
      payload,
    }
    const partLibrary = [savedPart, ...state.partLibrary].slice(0, 48)
    persistPartLibrary(partLibrary)
    set({ partLibrary })
  },

  applySavedPart: (id) => {
    const savedPart = get().partLibrary.find((item) => item.id === id)
    if (!savedPart) return

    set((state) => {
      let next = state.design
      let selectedPart: SelectablePart = state.selectedPart
      let activeTab: PanelTab = state.activeTab
      let activeTool: EditorTool = state.activeTool

      if (savedPart.kind === 'movement') {
        const payload = savedPart.payload as { movementId?: string }
        if (!payload.movementId || !MOVEMENTS[payload.movementId]) return state
        next = withMovementProfile(state.design, payload.movementId)
        selectedPart = 'movement'
        activeTab = 'movement'
        activeTool = 'move'
      }

      if (savedPart.kind === 'case') {
        next = { ...state.design, case: clone(savedPart.payload as CaseConfig) }
        selectedPart = 'case'
        activeTab = 'case'
        activeTool = 'size'
      }

      if (savedPart.kind === 'dial') {
        next = { ...state.design, dial: clone(savedPart.payload as DialConfig) }
        selectedPart = 'dial'
        activeTab = 'dial'
        activeTool = 'depth'
      }

      if (savedPart.kind === 'hands') {
        next = { ...state.design, hands: clone(savedPart.payload as HandsConfig) }
        selectedPart = 'minuteHand'
        activeTab = 'hands'
        activeTool = 'height'
      }

      if (savedPart.kind === 'crystal') {
        next = { ...state.design, crystal: clone(savedPart.payload as CrystalConfig) }
        selectedPart = 'crystal'
        activeTab = 'crystal'
        activeTool = 'height'
      }

      if (savedPart.kind === 'stem') {
        const payload = savedPart.payload as { stem?: StemConfig; casePatch?: Partial<CaseConfig> }
        next = {
          ...state.design,
          stem: payload.stem ? clone(payload.stem) : state.design.stem,
          case: {
            ...state.design.case,
            ...(payload.casePatch ?? {}),
          },
        }
        selectedPart = 'stem'
        activeTab = 'stem'
        activeTool = 'size'
      }

      if (savedPart.kind === 'relief') {
        const relief = clone(savedPart.payload as ReliefFeature)
        relief.id = `relief-${Date.now()}`
        next = {
          ...state.design,
          dial: {
            ...state.design.dial,
            reliefs: [...state.design.dial.reliefs, relief],
          },
        }
        selectedPart = `relief:${relief.id}`
        activeTab = 'dial'
        activeTool = 'move'
      }

      return {
        selectedPart,
        activeTab,
        activeTool,
        workbenchMode: 'assemble',
        focusMode: 'workshop',
        ...withHistory(state, next),
      }
    })
  },

  deleteSavedPart: (id) => {
    const partLibrary = get().partLibrary.filter((item) => item.id !== id)
    persistPartLibrary(partLibrary)
    set({ partLibrary })
  },

  setLastOpportunityScan: (lastOpportunityScan) => set({ lastOpportunityScan }),

  beginLiveEdit: () =>
    set((state) => {
      if (state.liveEditActive) return {}

      return {
        liveEditActive: true,
        undoStack: [...state.undoStack, clone(state.design)].slice(-HISTORY_LIMIT),
        redoStack: [],
      }
    }),

  endLiveEdit: () => set({ liveEditActive: false }),

  resetDesign: () =>
    set({
      design: createDesignFromTemplate('blank_2035'),
      activeTab: 'dial',
      selectedPart: 'dial',
      activeTool: 'depth',
      workbenchMode: 'stack_lab',
      focusMode: 'ghost',
      lastOpportunityScan: [],
      undoStack: [],
      redoStack: [],
      liveEditActive: false,
    }),
}))
