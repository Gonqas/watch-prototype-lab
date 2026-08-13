import type { VariantKind, VariantSummary, WatchDesign } from '../types'
import { MOVEMENTS, TECHNICAL_DIALS } from '../data/catalog'
import { evaluateDesign } from './validation'

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const mm = (value: number) => Number(value.toFixed(2))

const variantMeta: Record<VariantKind, Pick<VariantSummary, 'label' | 'detail' | 'tradeoff'>> = {
  current: {
    label: 'Actual',
    detail: 'Estado presente',
    tradeoff: 'Sin cambios',
  },
  two_hand: {
    label: '2 agujas',
    detail: 'Libera segundero',
    tradeoff: 'Pierdes segundero, ganas pila vertical y menos carga.',
  },
  box_crystal: {
    label: 'Cristal box',
    detail: 'Más altura útil',
    tradeoff: 'Depende de medir cristal/caja real; buena via para prototipos altos.',
  },
  relief_recover: {
    label: 'Recuperar relieve',
    detail: 'Baja volumen critico',
    tradeoff: 'Conserva la idea visual, pero reduce presencia de apliques altos.',
  },
  miyota_2036: {
    label: 'Miyota 2036',
    detail: 'Stack alto',
    tradeoff: 'Mismo fitting base, más juego vertical; pendiente de hand-sheet real y medición bajo cristal.',
  },
}

export const applyVariantToDesign = (design: WatchDesign, variant: VariantKind): WatchDesign => {
  const next = clone(design)

  if (variant === 'current') return next

  next.renderMode = 'technical'

  if (variant === 'two_hand') {
    next.viewMode = 'sweep'
    next.hands.count = 2
    next.hands.secondsEnabled = false
    next.hands.hour.heightOverDial = Math.max(next.hands.hour.heightOverDial, 0.42)
    next.hands.minute.heightOverDial = Math.max(next.hands.minute.heightOverDial, 0.84)
    next.dial.showSweepZone = true
  }

  if (variant === 'box_crystal') {
    next.viewMode = 'transparent'
    next.crystal.type = 'box'
    next.crystal.usableInteriorHeight = mm(Math.max(next.crystal.usableInteriorHeight + 0.7, 8.4))
    next.case.totalHeight = mm(Math.max(next.case.totalHeight + 0.7, next.case.backThickness + next.crystal.usableInteriorHeight + next.crystal.thickness))
    next.case.interiorHeightAvailable = mm(Math.max(next.case.interiorHeightAvailable, next.crystal.usableInteriorHeight))
    next.crystal.transparency = 0.24
    next.crystal.dataQuality = next.crystal.dataQuality === 'measured_by_user' ? 'measured_by_user' : 'estimated'
  }

  if (variant === 'relief_recover') {
    next.viewMode = 'section'
    next.dial.showSweepZone = true
    next.dial.reliefs = next.dial.reliefs.map((relief) => ({
      ...relief,
      height: relief.height > 0.18 ? mm(Math.max(0.04, relief.height - 0.25)) : relief.height,
    }))
    next.hands.minute.heightOverDial = mm(Math.min(2.8, next.hands.minute.heightOverDial + 0.18))
    next.hands.minute.curvature = {
      ...next.hands.minute.curvature,
      bridge: true,
      stepHeight: mm(Math.max(next.hands.minute.curvature.stepHeight, 0.18)),
    }
  }

  if (variant === 'miyota_2036') {
    const movement = MOVEMENTS.miyota_2036
    const technicalDial = Object.values(TECHNICAL_DIALS).find((dial) => dial.movementId === movement.id)
    next.viewMode = 'section'
    next.movementId = movement.id
    next.dial.technicalPresetId = technicalDial?.id ?? next.dial.technicalPresetId
    next.hands.hour.heightOverDial = movement.handStackProfile.hourHeightOverDial
    next.hands.minute.heightOverDial = movement.handStackProfile.minuteHeightOverDial
    next.hands.second.heightOverDial = movement.handStackProfile.secondHeightOverDial
  }

  return next
}

const summarize = (id: VariantKind, design: WatchDesign): VariantSummary => {
  const result = evaluateDesign(design)
  const meta = variantMeta[id]

  return {
    id,
    label: meta.label,
    detail: meta.detail,
    design,
    status: result.status,
    crystalClearance: result.metrics.crystalClearance,
    minimumClearance: result.metrics.minimumClearance,
    conflicts: result.metrics.activeConflicts,
    opportunities: result.metrics.opportunitiesDetected,
    tradeoff: meta.tradeoff,
  }
}

export const buildVariantSummaries = (design: WatchDesign): VariantSummary[] =>
  (['current', 'two_hand', 'box_crystal', 'relief_recover', 'miyota_2036'] as VariantKind[]).map((variant) =>
    summarize(variant, applyVariantToDesign(design, variant)),
  )
