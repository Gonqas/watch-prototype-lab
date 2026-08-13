import { MOVEMENTS, TECHNICAL_DIALS } from '../data/catalog'
import type { WatchDesign } from '../types'
import { calculateWatchStack } from './watchStack'
import {
  activeHands,
  dialOuterLandWidth,
  dialOuterRadius,
  handMaxTop,
  handUnderAt,
  localDialSurface,
  reliefRadialSize,
  reliefRadius,
  roundMm,
  type ActiveHand,
} from './geometryKernel'

export interface ReliefSweepCollision {
  reliefId: string
  reliefLabel: string
  touchingHand: ActiveHand
  radius: number
  radialSize: number
  reliefTop: number
  handUnder: number
  clearance: number
}

export interface HandGapCheck {
  lower: ActiveHand
  upper: ActiveHand
  gap: number
}

export interface HandDialClearanceCheck {
  hand: ActiveHand
  radius: number
  dialSurface: number
  handUnder: number
  clearance: number
}

export interface CollisionModel {
  stack: ReturnType<typeof calculateWatchStack>
  activeHands: ActiveHand[]
  handReferenceSurface: number
  maxHandTop: number
  crystalClearance: number
  movementCaseClearance: number
  dialCaseClearance: number
  handSweepRadius: number
  handCaseClearance: number
  crystalRadialClearance: number
  dialFootCoverageClearance: number
  dialStructuralFloor: number
  dialOuterSupportWidth: number
  reliefBoundaryClearance: number
  handDialMinGap: number
  handDialCritical: HandDialClearanceCheck
  handDialChecks: HandDialClearanceCheck[]
  dialFloorClearance: number
  dialOuterLandClearance: number
  outerReliefRoom: number
  extraSink: number
  reliefSweepCollisions: ReliefSweepCollision[]
  handGapChecks: HandGapCheck[]
  minimumClearance: number
}

const sampledRadiiForHand = (design: WatchDesign, handLength: number) => {
  const dialRadius = dialOuterRadius(design)
  const sampleEnd = Math.min(handLength, dialRadius)
  const sampleStart = Math.min(sampleEnd, Math.max(0.85, design.dial.centerHole / 2 + 0.18))
  const baseSamples = Array.from({ length: 33 }, (_, index) => sampleStart + (sampleEnd - sampleStart) * (index / 32))
  const focusSamples = [
    design.dial.centerHole / 2 + 0.18,
    design.dial.sunkenRadius * 0.25,
    design.dial.sunkenRadius * 0.5,
    design.dial.sunkenRadius * 0.75,
    design.dial.sunkenRadius - 0.08,
    design.dial.sunkenRadius,
    design.dial.sunkenRadius + 0.08,
    handLength,
    dialRadius,
  ]

  return [...baseSamples, ...focusSamples]
    .filter((radius) => Number.isFinite(radius) && radius >= sampleStart && radius <= sampleEnd)
    .sort((a, b) => a - b)
}

export const buildCollisionModel = (design: WatchDesign): CollisionModel => {
  const movement = MOVEMENTS[design.movementId]
  const technicalDial = TECHNICAL_DIALS[design.dial.technicalPresetId]
  const stack = calculateWatchStack(design)
  const hands = activeHands(design)
  const handReferenceSurface = stack.handReferenceSurface
  const maxHandTop = Math.max(...hands.map(({ hand }) => handMaxTop(handReferenceSurface, hand)))
  const crystalClearance = stack.crystalInnerTop - maxHandTop
  const movementEnvelopeMax = Math.max(movement.casingFrameEnvelope.width, movement.casingFrameEnvelope.height)
  const movementCaseClearance = (design.case.innerDiameter - movementEnvelopeMax) / 2
  const dialCaseClearance = (design.case.dialSeatDiameter - design.dial.commercialDiameter) / 2
  const handSweepRadius = Math.max(...hands.map(({ hand }) => hand.length))
  const radialSafety = movement.clearances.handToCaseOfficialMin
  const handCaseClearance = design.case.innerDiameter / 2 - handSweepRadius - radialSafety
  const crystalRadialClearance = design.crystal.diameter / 2 - handSweepRadius - radialSafety
  const dialFootCoverageClearance = dialOuterRadius(design) - technicalDial.minimumCommercialDiameterForFeet / 2
  const dialStructuralFloor = design.dial.thickness - (design.dial.sunkenCenter ? design.dial.sunkenDepth : 0)
  const dialOuterSupportWidth = design.dial.sunkenCenter ? dialOuterLandWidth(design) : dialOuterRadius(design)
  const reliefBoundaryClearance =
    design.dial.reliefs.length === 0
      ? 9
      : Math.min(
          ...design.dial.reliefs.map((relief) => dialOuterRadius(design) - reliefRadius(relief) - reliefRadialSize(relief)),
        )
  const handDialChecks = hands.flatMap((hand) =>
    sampledRadiiForHand(design, hand.hand.length).map((radius) => {
      const dialSurface = localDialSurface(design, stack.baseDialTop, radius)
      const handUnder = handUnderAt(handReferenceSurface, hand.hand, radius)
      return {
        hand,
        radius: roundMm(radius),
        dialSurface: roundMm(dialSurface),
        handUnder: roundMm(handUnder),
        clearance: roundMm(handUnder - dialSurface),
      }
    }),
  )
  const handDialCritical = [...handDialChecks].sort((a, b) => a.clearance - b.clearance)[0] ?? {
    hand: hands[0],
    radius: 0,
    dialSurface: stack.baseDialTop,
    handUnder: stack.baseDialTop,
    clearance: 9,
  }
  const handDialMinGap = handDialCritical.clearance
  const dialFloorClearance = design.dial.sunkenCenter ? design.dial.thickness - design.dial.sunkenDepth - 0.12 : 9
  const dialOuterLandClearance = design.dial.sunkenCenter ? dialOuterLandWidth(design) - 0.8 : 9

  const reliefSweepCollisions = design.dial.reliefs.flatMap((relief) => {
    const radius = reliefRadius(relief)
    const radialSize = reliefRadialSize(relief)
    const surface = localDialSurface(design, stack.baseDialTop, radius)
    const reliefTop = surface + relief.height
    const touchingHand = hands.find(({ hand }) => {
      const radialOverlap = radius - radialSize <= hand.length && radius + radialSize >= 0.7
      const verticalOverlap = reliefTop > handUnderAt(handReferenceSurface, hand, radius) - 0.03
      return radialOverlap && verticalOverlap
    })

    if (!touchingHand) return []

    const handUnder = handUnderAt(handReferenceSurface, touchingHand.hand, radius)

    return [
      {
        reliefId: relief.id,
        reliefLabel: relief.label,
        touchingHand,
        radius: roundMm(radius),
        radialSize: roundMm(radialSize),
        reliefTop: roundMm(reliefTop),
        handUnder: roundMm(handUnder),
        clearance: roundMm(handUnder - reliefTop),
      },
    ]
  })

  const handGapChecks: HandGapCheck[] = hands.slice(1).map((upper, index) => {
    const lower = hands[index]
    const lowerTop = handMaxTop(handReferenceSurface, lower.hand)
    const upperUnder = handUnderAt(handReferenceSurface, upper.hand, upper.hand.length * 0.35)
    return {
      lower,
      upper,
      gap: roundMm(upperUnder - lowerTop),
    }
  })

  const outerReliefRoom = stack.crystalInnerTop - (stack.outerDialSurface + 0.18)
  const centerRadius = Math.max(0.85, design.dial.centerHole / 2 + 0.18)
  const centerHandGap = Math.min(
    ...hands.map(({ hand }) => handUnderAt(handReferenceSurface, hand, centerRadius) - localDialSurface(design, stack.baseDialTop, centerRadius)),
  )
  const structuralSinkRemaining = design.dial.thickness - 0.12 - (design.dial.sunkenCenter ? design.dial.sunkenDepth : 0)
  const extraSink = Math.max(0, Math.min(centerHandGap - 0.18, structuralSinkRemaining))
  const reliefClearances = design.dial.reliefs.map((relief) => {
    const radius = reliefRadius(relief)
    const surface = localDialSurface(design, stack.baseDialTop, radius)
    const top = surface + relief.height
    const nearbyHands = hands.filter(({ hand }) => radius <= hand.length + reliefRadialSize(relief))
    if (nearbyHands.length === 0) return 9
    return Math.min(...nearbyHands.map(({ hand }) => handUnderAt(handReferenceSurface, hand, radius) - top))
  })
  const minimumClearance = Math.min(
    crystalClearance,
    movementCaseClearance,
    dialCaseClearance,
    handCaseClearance,
    crystalRadialClearance,
    dialFootCoverageClearance,
    handDialMinGap,
    dialFloorClearance,
    dialOuterLandClearance,
    reliefBoundaryClearance,
    ...reliefClearances,
  )

  return {
    stack,
    activeHands: hands,
    handReferenceSurface,
    maxHandTop: roundMm(maxHandTop),
    crystalClearance: roundMm(crystalClearance),
    movementCaseClearance: roundMm(movementCaseClearance),
    dialCaseClearance: roundMm(dialCaseClearance),
    handSweepRadius: roundMm(handSweepRadius),
    handCaseClearance: roundMm(handCaseClearance),
    crystalRadialClearance: roundMm(crystalRadialClearance),
    dialFootCoverageClearance: roundMm(dialFootCoverageClearance),
    dialStructuralFloor: roundMm(dialStructuralFloor),
    dialOuterSupportWidth: roundMm(dialOuterSupportWidth),
    reliefBoundaryClearance: roundMm(reliefBoundaryClearance),
    handDialMinGap: roundMm(handDialMinGap),
    handDialCritical,
    handDialChecks,
    dialFloorClearance: roundMm(dialFloorClearance),
    dialOuterLandClearance: roundMm(dialOuterLandClearance),
    outerReliefRoom: roundMm(outerReliefRoom),
    extraSink: roundMm(extraSink),
    reliefSweepCollisions,
    handGapChecks,
    minimumClearance: roundMm(minimumClearance),
  }
}
