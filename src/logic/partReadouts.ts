import type { HandConfig, SelectablePart, ValidationResult, WatchDesign } from '../types'
import { PART_LABELS } from '../types'
import { roundMm } from './validation'

export interface PartMetric {
  label: string
  value: string
  tone?: 'ok' | 'warn' | 'bad' | 'opportunity'
}

export const formatMm = (value: number) => `${roundMm(value).toLocaleString('es-ES')} mm`

export const getPartLabel = (part: SelectablePart, design: WatchDesign) => {
  if (part.startsWith('relief:')) {
    const relief = design.dial.reliefs.find((item) => `relief:${item.id}` === part)
    return relief?.label ?? 'Relieve'
  }

  return PART_LABELS[part as Exclude<SelectablePart, `relief:${string}`>]
}

export const getPartFindingCount = (part: SelectablePart, result: ValidationResult) =>
  result.findings.filter((finding) => finding.pieceIds.includes(part)).length

export const isPartInHardConflict = (part: SelectablePart, result: ValidationResult) =>
  result.findings.some((finding) => finding.severity === 'bad' && finding.pieceIds.includes(part))

const handMetrics = (hand: HandConfig, result: ValidationResult): PartMetric[] => [
  { label: 'Longitud', value: formatMm(hand.length) },
  { label: 'Altura', value: formatMm(hand.heightOverDial) },
  { label: 'Grosor', value: formatMm(hand.thickness) },
  {
    label: 'Barrido/caja',
    value: formatMm(result.metrics.handCaseClearance),
    tone: result.metrics.handCaseClearance < 0 ? 'bad' : result.metrics.handCaseClearance < 0.2 ? 'warn' : 'ok',
  },
  {
    label: 'Cristal',
    value: formatMm(result.metrics.crystalClearance),
    tone: result.metrics.crystalClearance < 0.3 ? 'bad' : result.metrics.crystalClearance < 0.7 ? 'warn' : 'ok',
  },
]

export const getSelectedPartMetrics = (
  design: WatchDesign,
  selectedPart: SelectablePart,
  result: ValidationResult,
): PartMetric[] => {
  if (selectedPart === 'case') {
    return [
      { label: 'Exterior', value: formatMm(design.case.outerDiameter) },
      { label: 'Interior', value: formatMm(design.case.innerDiameter) },
      { label: 'Altura', value: formatMm(design.case.totalHeight) },
      {
        label: 'Mov/caja',
        value: formatMm(result.metrics.movementCaseClearance),
        tone: result.metrics.movementCaseClearance < 0.15 ? 'bad' : result.metrics.movementCaseClearance < 0.3 ? 'warn' : 'ok',
      },
    ]
  }

  if (selectedPart === 'dial') {
    return [
      { label: 'Diámetro', value: formatMm(design.dial.commercialDiameter) },
      { label: 'Grosor', value: formatMm(design.dial.thickness) },
      { label: 'Hundimiento', value: formatMm(design.dial.sunkenCenter ? design.dial.sunkenDepth : 0), tone: 'opportunity' },
      { label: 'Radio', value: formatMm(design.dial.sunkenRadius) },
      {
        label: 'Suelo',
        value: formatMm(result.metrics.dialStructuralFloor),
        tone: result.metrics.dialStructuralFloor < 0 ? 'bad' : result.metrics.dialStructuralFloor < 0.12 ? 'warn' : 'ok',
      },
      {
        label: 'DH1/DH2',
        value: formatMm(result.metrics.dialFootCoverageClearance),
        tone: result.metrics.dialFootCoverageClearance < 0 ? 'bad' : result.metrics.dialFootCoverageClearance < 0.45 ? 'warn' : 'ok',
      },
    ]
  }

  if (selectedPart === 'crystal') {
    return [
      { label: 'Tipo', value: design.crystal.type },
      { label: 'Grosor', value: formatMm(design.crystal.thickness) },
      { label: 'Altura útil', value: formatMm(design.crystal.usableInteriorHeight) },
      {
        label: 'Margen',
        value: formatMm(result.metrics.crystalClearance),
        tone: result.metrics.crystalClearance < 0.3 ? 'bad' : result.metrics.crystalClearance < 0.7 ? 'warn' : 'ok',
      },
      {
        label: 'Radio útil',
        value: formatMm(result.metrics.crystalRadialClearance),
        tone: result.metrics.crystalRadialClearance < 0 ? 'bad' : result.metrics.crystalRadialClearance < 0.2 ? 'warn' : 'ok',
      },
    ]
  }

  if (selectedPart === 'hourHand') return handMetrics(design.hands.hour, result)
  if (selectedPart === 'minuteHand') return handMetrics(design.hands.minute, result)
  if (selectedPart === 'secondHand') return handMetrics(design.hands.second, result)

  if (selectedPart === 'stem' || selectedPart === 'crown') {
    return [
      { label: 'Tija', value: formatMm(design.stem.customLength) },
      { label: 'Corona', value: formatMm(design.case.crownDiameter) },
      { label: 'Centro-corona', value: formatMm(design.case.crownDistanceFromCenter) },
      { label: 'Rosca', value: design.case.crownThread },
    ]
  }

  if (selectedPart.startsWith('relief:')) {
    const relief = design.dial.reliefs.find((item) => `relief:${item.id}` === selectedPart)
    if (!relief) return []

    return [
      { label: 'X', value: formatMm(relief.x) },
      { label: 'Y', value: formatMm(relief.y) },
      { label: 'Altura', value: formatMm(relief.height), tone: relief.height > 0.45 ? 'warn' : 'ok' },
      { label: 'Tamaño', value: relief.type === 'circle' ? formatMm(relief.radius) : `${formatMm(relief.width)} x ${formatMm(relief.length)}` },
    ]
  }

  return [
    { label: 'Calibre', value: design.movementId.replaceAll('_', ' ') },
    { label: 'Rotación', value: `${roundMm(design.movementRotationDeg, 0)} deg` },
    { label: 'Mov/caja', value: formatMm(result.metrics.movementCaseClearance) },
  ]
}
