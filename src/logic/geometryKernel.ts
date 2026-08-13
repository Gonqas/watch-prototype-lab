import type {
  DataQuality,
  HandConfig,
  ReliefFeature,
  SelectablePart,
  WatchDesign,
} from '../types'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const smoothStep = (value: number) => {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

export type HandId = 'hour' | 'minute' | 'second'

export interface ActiveHand {
  id: HandId
  label: string
  partId: Extract<SelectablePart, 'hourHand' | 'minuteHand' | 'secondHand'>
  hand: HandConfig
}

export const roundMm = (value: number, digits = 2) => Number(value.toFixed(digits))

export const combineQuality = (...qualities: DataQuality[]): DataQuality => {
  if (qualities.includes('unknown')) return 'unknown'
  if (qualities.includes('estimated')) return 'estimated'
  if (qualities.includes('visual_only')) return 'visual_only'
  if (qualities.includes('supplier_partial')) return 'supplier_partial'
  if (qualities.includes('official_partial')) return 'official_partial'
  if (qualities.includes('measured_by_user')) return 'measured_by_user'
  return 'official_complete'
}

export const activeHands = (design: WatchDesign): ActiveHand[] => {
  const hands: ActiveHand[] = [
    { id: 'hour', label: 'horaria', partId: 'hourHand', hand: design.hands.hour },
    { id: 'minute', label: 'minutera', partId: 'minuteHand', hand: design.hands.minute },
  ]

  if (design.hands.count === 3 && design.hands.secondsEnabled) {
    hands.push({ id: 'second', label: 'segundero', partId: 'secondHand', hand: design.hands.second })
  }

  return hands
}

export const handCurveHeightAt = (hand: HandConfig, radius: number): number => {
  const progress = clamp(radius / Math.max(hand.length, 0.01), 0, 1)
  const { baseHeight, midHeight, tipHeight, bridge, startRatio, endRatio, stepHeight } = hand.curvature
  const baseCurve =
    progress < 0.5
      ? baseHeight + (midHeight - baseHeight) * (progress / 0.5)
      : midHeight + (tipHeight - midHeight) * ((progress - 0.5) / 0.5)
  const bridgeLift = bridge && progress >= startRatio && progress <= endRatio ? stepHeight : 0

  return baseCurve + bridgeLift
}

export const handUnderAt = (dialSurface: number, hand: HandConfig, radius: number) =>
  dialSurface + hand.heightOverDial + handCurveHeightAt(hand, radius)

export const handTopAt = (dialSurface: number, hand: HandConfig, radius: number) =>
  handUnderAt(dialSurface, hand, radius) + hand.thickness

export const handMaxTop = (dialSurface: number, hand: HandConfig, samples = 17) => {
  const safeSamples = Math.max(3, samples)
  const radii = Array.from({ length: safeSamples }, (_, index) => hand.length * (index / (safeSamples - 1)))
  return Math.max(...radii.map((radius) => handTopAt(dialSurface, hand, radius)))
}

export const reliefRadialSize = (relief: ReliefFeature) => {
  if (relief.type === 'line' || relief.type === 'rect') {
    return Math.max(relief.width, relief.length) / 2
  }

  return Math.max(relief.radius, relief.width / 2, 0.1)
}

export const reliefRadius = (relief: ReliefFeature) => Math.hypot(relief.x, relief.y)

export const reliefAngleDeg = (relief: ReliefFeature) => {
  const raw = (Math.atan2(relief.y, relief.x) * 180) / Math.PI
  return (raw + 360) % 360
}

export const dialOuterRadius = (design: WatchDesign) => design.dial.commercialDiameter / 2

export const dialOuterLandWidth = (design: WatchDesign) => dialOuterRadius(design) - design.dial.sunkenRadius

export const localDialSurface = (design: WatchDesign, baseDialTop: number, radius: number) => {
  const outerSurface = baseDialTop + design.dial.outerRingHeight
  const sunkenRadius = Math.max(0.01, design.dial.sunkenRadius)

  if (!design.dial.sunkenCenter) {
    return design.dial.outerRingHeight > 0 && radius >= sunkenRadius ? outerSurface : baseDialTop
  }

  const centerSurface = baseDialTop - design.dial.sunkenDepth

  if (radius >= sunkenRadius) return outerSurface

  if (design.dial.transition === 'ramp') {
    const progress = clamp(radius / sunkenRadius, 0, 1)
    return centerSurface + (outerSurface - centerSurface) * progress
  }

  if (design.dial.transition === 'soft_bowl') {
    const progress = smoothStep(radius / sunkenRadius)
    return centerSurface + (outerSurface - centerSurface) * progress
  }

  if (design.dial.transition === 'hybrid') {
    const progress = radius / sunkenRadius
    if (progress < 0.45) return centerSurface
    return centerSurface + (outerSurface - centerSurface) * smoothStep((progress - 0.45) / 0.55)
  }

  return centerSurface
}
