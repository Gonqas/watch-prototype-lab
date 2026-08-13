import {
  Boxes,
  Circle,
  Gauge,
  Layers3,
  Rotate3D,
  Ruler,
  ScanSearch,
} from 'lucide-react'
import type {
  CaseShape,
  CrystalType,
  DialTransition,
  FocusMode,
  GeneralStatus,
  LabPreset,
  PanelTab,
  SelectablePart,
  WorkbenchMode,
} from '../types'

export const tabs: PanelTab[] = [
  'movement',
  'case',
  'dial',
  'hands',
  'crystal',
  'stem',
  'validation',
  'opportunities',
  'presets',
  'measurements',
]

export const workbenchModes: Array<{ mode: WorkbenchMode; icon: typeof Rotate3D; detail: string }> = [
  { mode: 'assemble', icon: Boxes, detail: 'piezas y presets' },
  { mode: 'stack_lab', icon: Layers3, detail: 'stack completo' },
  { mode: 'dial_lab', icon: Circle, detail: 'superficie y relieves' },
  { mode: 'hands_lab', icon: Gauge, detail: 'barrido y curvas' },
  { mode: 'xray', icon: Layers3, detail: 'capas y seccion' },
  { mode: 'risk_lab', icon: ScanSearch, detail: 'zonas grises' },
  { mode: 'measure', icon: Ruler, detail: 'datos reales' },
]

export const labPresets: Array<{ id: LabPreset; label: string; detail: string }> = [
  { id: 'baseline', label: 'Base plana', detail: 'dial normal 2035' },
  { id: 'sunken_dial', label: 'Dial hundido', detail: 'prueba experimental' },
  { id: 'two_hand_clearance', label: '2 agujas', detail: 'libera altura' },
  { id: 'relief_stress', label: 'Relieve limite', detail: 'fuerza colisiones' },
  { id: 'box_crystal', label: 'Cristal box', detail: 'abre volumen' },
]

export const focusModes: Array<{ id: FocusMode; detail: string }> = [
  { id: 'assembly', detail: 'ver reloj completo' },
  { id: 'ghost', detail: 'resto transparente' },
  { id: 'isolate', detail: 'editar sin ruido' },
  { id: 'workshop', detail: 'pieza protagonista' },
]

export const baseParts: Array<{ id: SelectablePart; label: string; tab: PanelTab }> = [
  { id: 'movement', label: 'Movimiento', tab: 'movement' },
  { id: 'case', label: 'Caja', tab: 'case' },
  { id: 'dial', label: 'Dial', tab: 'dial' },
  { id: 'hourHand', label: 'Horaria', tab: 'hands' },
  { id: 'minuteHand', label: 'Minutera', tab: 'hands' },
  { id: 'secondHand', label: 'Segundero', tab: 'hands' },
  { id: 'crystal', label: 'Cristal', tab: 'crystal' },
  { id: 'stem', label: 'Tija', tab: 'stem' },
  { id: 'crown', label: 'Corona', tab: 'stem' },
]

export const partColors: Record<string, string> = {
  movement: '#a855f7',
  case: '#2563eb',
  dial: '#22c55e',
  hourHand: '#f59e0b',
  minuteHand: '#facc15',
  secondHand: '#ef4444',
  crystal: '#06b6d4',
  stem: '#e2e8f0',
  crown: '#94a3b8',
  relief: '#f97316',
}

export const caseShapeOptions: Array<{ value: CaseShape; label: string }> = [
  { value: 'round', label: 'Redonda' },
  { value: 'square', label: 'Cuadrada' },
  { value: 'cushion', label: 'Cushion' },
  { value: 'tonneau', label: 'Tonneau' },
  { value: 'rectangular', label: 'Rectangular' },
]

export const crystalOptions: Array<{ value: CrystalType; label: string }> = [
  { value: 'flat', label: 'Plano' },
  { value: 'domed', label: 'Domed' },
  { value: 'box', label: 'Box crystal' },
]

export const transitionOptions: Array<{ value: DialTransition; label: string }> = [
  { value: 'soft_bowl', label: 'Cuenco suave' },
  { value: 'hard_step', label: 'Escalon marcado' },
  { value: 'ramp', label: 'Rampa' },
  { value: 'raised_outer_ring', label: 'Anillo exterior elevado' },
  { value: 'hybrid', label: 'Combinado' },
]

export const statusTone: Record<GeneralStatus, string> = {
  OK: 'ok',
  JUSTO: 'tight',
  EXPERIMENTAL: 'experimental',
  MAL: 'bad',
}
