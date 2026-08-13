import { MOVEMENTS } from '../data/catalog'
import type { DataQuality, SelectablePart, ValidationResult, WatchDesign } from '../types'
import { buildFabricationReadiness, type ManufacturingCheck } from './fabrication'
import { calculateWatchStack } from './watchStack'

export type StackTone = 'safe' | 'tight' | 'experimental' | 'bad'

export interface StackLayer {
  id: string
  label: string
  part: SelectablePart
  from: number
  to: number
  thickness: number
  color: string
  dataQuality: DataQuality
}

export interface ClearanceCheck {
  id: string
  label: string
  value: number
  tone: StackTone
  limiter: SelectablePart
  detail: string
}

export interface StackLabSummary {
  totalHeight: number
  stackTop: number
  activeLayer: StackLayer
  layers: StackLayer[]
  clearances: ClearanceCheck[]
  limitingClearance: ClearanceCheck
  manufacturing: ManufacturingCheck[]
  missingCriticalData: string[]
}

const roundMm = (value: number) => Number(value.toFixed(2))

const toneFromClearance = (value: number, bad: number, tight: number, comfortable: number): StackTone => {
  if (value < bad) return 'bad'
  if (value < tight) return 'tight'
  if (value < comfortable) return 'experimental'
  return 'safe'
}

const layer = (
  id: string,
  label: string,
  part: SelectablePart,
  from: number,
  to: number,
  color: string,
  dataQuality: DataQuality,
): StackLayer => ({
  id,
  label,
  part,
  from: roundMm(from),
  to: roundMm(to),
  thickness: roundMm(Math.max(0, to - from)),
  color,
  dataQuality,
})

const selectedActiveLayer = (layers: StackLayer[], result: ValidationResult) => {
  const conflictLayer = layers.find((item) => result.conflictIds.has(item.part))
  if (conflictLayer) return conflictLayer

  const byTop = [...layers].sort((a, b) => b.to - a.to)
  return byTop[0]
}

export const buildStackLabSummary = (design: WatchDesign, result: ValidationResult): StackLabSummary => {
  const movement = MOVEMENTS[design.movementId]
  const stack = calculateWatchStack(design)
  const activeHands = [
    design.hands.hour,
    design.hands.minute,
    ...(design.hands.count === 3 && design.hands.secondsEnabled ? [design.hands.second] : []),
  ]
  const handBottom = Math.min(...activeHands.map((hand) => stack.handReferenceSurface + hand.heightOverDial))
  const handTop = result.metrics.maxHandTop
  const crystalInnerTop = result.metrics.crystalInnerTop
  const crystalBottom = Math.max(crystalInnerTop, design.case.totalHeight - design.crystal.thickness)

  const layers: StackLayer[] = [
    layer('back', 'Fondo', 'case', 0, design.case.backThickness, '#64748b', design.case.dataQuality),
    layer('holder', 'Holder/junta', 'case', design.case.backThickness, stack.movementBottom, '#94a3b8', design.case.dataQuality),
    layer('movement', movement.calibre, 'movement', stack.movementBottom, stack.movementTop, '#a855f7', movement.dataQuality),
    layer('dial', 'Dial base', 'dial', stack.dialBottom, stack.baseDialTop, '#22c55e', design.dial.dataQuality),
    layer(
      'dial-profile',
      design.dial.sunkenCenter ? 'Centro hundido/anillo' : 'Superficie dial',
      'dial',
      Math.min(stack.centerDialSurface, stack.outerDialSurface),
      Math.max(stack.centerDialSurface, stack.outerDialSurface),
      '#4ade80',
      design.dial.dataQuality,
    ),
    layer('hands', 'Volumen agujas', 'minuteHand', handBottom, handTop, '#facc15', design.hands.dataQuality),
    layer(
      'air',
      result.metrics.crystalClearance < 0 ? 'Solape con cristal' : 'Aire bajo cristal',
      'crystal',
      Math.min(handTop, crystalInnerTop),
      Math.max(handTop, crystalInnerTop),
      result.metrics.crystalClearance < 0 ? '#ef4444' : '#38bdf8',
      design.crystal.dataQuality,
    ),
    layer('crystal', 'Cristal', 'crystal', crystalBottom, design.case.totalHeight, '#06b6d4', design.crystal.dataQuality),
  ].filter((item) => item.thickness > 0.001)

  const clearances: ClearanceCheck[] = [
    {
      id: 'hand-crystal',
      label: 'Agujas/cristal',
      value: result.metrics.crystalClearance,
      tone: toneFromClearance(result.metrics.crystalClearance, 0.3, 0.45, 0.7),
      limiter: 'crystal',
      detail: 'Margen vertical entre la aguja más alta y cara interior del cristal.',
    },
    {
      id: 'movement-case',
      label: 'Movimiento/caja',
      value: result.metrics.movementCaseClearance,
      tone: toneFromClearance(result.metrics.movementCaseClearance, 0.15, 0.3, 0.45),
      limiter: 'case',
      detail: 'Holgura radial usando casing_frame_envelope del Miyota 2035.',
    },
    {
      id: 'dial-seat',
      label: 'Dial/asiento',
      value: result.metrics.dialCaseClearance,
      tone: toneFromClearance(result.metrics.dialCaseClearance, 0, 0.35, 0.6),
      limiter: 'dial',
      detail: 'Diferencia radial entre diámetro comercial del dial y asiento de caja.',
    },
    {
      id: 'hand-case-radial',
      label: 'Barrido/caja',
      value: result.metrics.handCaseClearance,
      tone: toneFromClearance(result.metrics.handCaseClearance, 0, 0.2, 0.45),
      limiter: 'minuteHand',
      detail: 'Holgura radial entre la aguja más larga y la caja, reservando clearance oficial mínimo.',
    },
    {
      id: 'dial-feet',
      label: 'Dial/DH1-DH2',
      value: result.metrics.dialFootCoverageClearance,
      tone: toneFromClearance(result.metrics.dialFootCoverageClearance, 0, 0.45, 0.9),
      limiter: 'dial',
      detail: 'Margen del diámetro comercial para cubrir pies de dial oficiales.',
    },
    {
      id: 'dial-floor',
      label: 'Suelo hundido',
      value: result.metrics.dialStructuralFloor,
      tone: toneFromClearance(result.metrics.dialStructuralFloor, 0, 0.12, 0.25),
      limiter: 'dial',
      detail: 'Material restante bajo centro hundido antes de atravesar el dial base.',
    },
    {
      id: 'minimum',
      label: 'Margen mínimo',
      value: result.metrics.minimumClearance,
      tone: toneFromClearance(result.metrics.minimumClearance, 0, 0.3, 0.7),
      limiter: 'movement',
      detail: 'Menor margen detectado por motor de validación.',
    },
  ]

  const limitingClearance = [...clearances].sort((a, b) => a.value - b.value)[0]
  const fabrication = buildFabricationReadiness(design, result)

  return {
    totalHeight: result.metrics.totalHeight,
    stackTop: roundMm(Math.max(design.case.totalHeight, handTop, crystalInnerTop)),
    activeLayer: selectedActiveLayer(layers, result),
    layers,
    clearances,
    limitingClearance,
    manufacturing: fabrication.checks,
    missingCriticalData: fabrication.missingCriticalData,
  }
}
