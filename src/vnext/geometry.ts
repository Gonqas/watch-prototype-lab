import {
  valueOf,
  type DialSpec,
  type HandSpec,
  type WatchPartId,
  type WatchProject,
} from './model'

export interface StackGeometry {
  caseBottom: number
  caseTop: number
  backTop: number
  movementBottom: number
  movementTop: number
  dialBottom: number
  dialTop: number
  crystalEdgeInner: number
  crystalCenterInner: number
  crystalTop: number
  stemAxisAbsolute: number
}

export interface RadialPoint {
  radius: number
  z: number
}

export interface HandSegmentGeometry {
  id: string
  part: 'hourHand' | 'minuteHand' | 'secondHand'
  start: { x: number; y: number; z: number }
  end: { x: number; y: number; z: number }
  width: number
  thickness: number
  radialStart: number
  radialEnd: number
}

export interface ScenePrimitive {
  id: string
  part: WatchPartId
  kind: 'cylinder' | 'annulus' | 'rounded-box' | 'quartz-outline' | 'box' | 'rod' | 'dial-profile' | 'crystal-profile'
  x: number
  y: number
  z: number
  width?: number
  length?: number
  height?: number
  radius?: number
  innerRadius?: number
  rotation?: number
  start?: { x: number; y: number; z: number }
  end?: { x: number; y: number; z: number }
  layer: number
}

export function assemblyStack(project: WatchProject): StackGeometry {
  const backTop = valueOf(project.case.backThickness)
  const movementBottom = backTop + valueOf(project.assembly.movementBackClearance)
  const movementHeight =
    project.movement.kind === 'mechanical'
      ? valueOf(project.movement.totalHeight)
      : valueOf(project.movement.thickness)
  const movementTop = movementBottom + movementHeight
  const dialBottom = valueOf(project.dial.seatZ)
  const dialTop = dialBottom + valueOf(project.dial.thickness)
  const crystalEdgeInner = backTop + valueOf(project.case.usableInteriorHeight)
  const crystalCenterInner = crystalEdgeInner + valueOf(project.crystal.innerRise)
  return {
    caseBottom: 0,
    caseTop: valueOf(project.case.totalHeight),
    backTop,
    movementBottom,
    movementTop,
    dialBottom,
    dialTop,
    crystalEdgeInner,
    crystalCenterInner,
    crystalTop: crystalCenterInner + valueOf(project.crystal.thickness),
    stemAxisAbsolute: movementBottom + valueOf(project.movement.stemAxisZ),
  }
}

function smoothStep(input: number): number {
  const t = Math.max(0, Math.min(1, input))
  return t * t * (3 - 2 * t)
}

export function dialSurfaceZ(dial: DialSpec, radius: number): number {
  const top = valueOf(dial.seatZ) + valueOf(dial.thickness)
  if (!dial.recess.enabled) return top
  const recessRadius = Math.max(0.001, valueOf(dial.recess.radius))
  if (radius >= recessRadius) return top
  const depth = valueOf(dial.recess.depth)
  if (dial.recess.transition === 'step') return top - depth
  const ratio = radius / recessRadius
  if (dial.recess.transition === 'ramp') return top - depth * (1 - ratio)
  return top - depth * (1 - smoothStep(ratio))
}

export function dialRadialProfile(dial: DialSpec, samples = 48): RadialPoint[] {
  const holeRadius = Math.max(0.02, valueOf(dial.centerHole) / 2)
  const outerRadius = Math.max(holeRadius + 0.1, valueOf(dial.diameter) / 2)
  const bottom = valueOf(dial.seatZ)
  const points: RadialPoint[] = []
  if (dial.recess.enabled && dial.recess.transition === 'step') {
    const recessRadius = Math.min(outerRadius, Math.max(holeRadius, valueOf(dial.recess.radius)))
    points.push({ radius: holeRadius, z: dialSurfaceZ(dial, holeRadius) })
    points.push({ radius: recessRadius, z: dialSurfaceZ(dial, Math.max(holeRadius, recessRadius - 0.0001)) })
    points.push({ radius: recessRadius, z: dialSurfaceZ(dial, recessRadius) })
    points.push({ radius: outerRadius, z: dialSurfaceZ(dial, outerRadius) })
  } else {
    for (let index = 0; index <= samples; index += 1) {
      const radius = holeRadius + ((outerRadius - holeRadius) * index) / samples
      points.push({ radius, z: dialSurfaceZ(dial, radius) })
    }
  }
  points.push({ radius: outerRadius, z: bottom })
  points.push({ radius: holeRadius, z: bottom })
  return points
}

export function crystalInnerZAtRadius(project: WatchProject, radius: number): number {
  const stack = assemblyStack(project)
  const outerRadius = Math.max(0.001, valueOf(project.crystal.diameter) / 2)
  const ratio = Math.max(0, Math.min(1, radius / outerRadius))
  const rise = valueOf(project.crystal.innerRise)
  if (project.crystal.type === 'flat') return stack.crystalEdgeInner
  if (project.crystal.type === 'domed') return stack.crystalEdgeInner + rise * (1 - ratio * ratio)
  if (ratio <= 0.68) return stack.crystalEdgeInner + rise
  return stack.crystalEdgeInner + rise * (1 - smoothStep((ratio - 0.68) / 0.32))
}

export function crystalRadialProfile(project: WatchProject, samples = 64): RadialPoint[] {
  const outerRadius = Math.max(0.1, valueOf(project.crystal.diameter) / 2)
  const thickness = valueOf(project.crystal.thickness)
  const points: RadialPoint[] = []
  for (let index = 0; index <= samples; index += 1) {
    const radius = (outerRadius * index) / samples
    points.push({ radius, z: crystalInnerZAtRadius(project, radius) + thickness })
  }
  for (let index = samples; index >= 0; index -= 1) {
    const radius = (outerRadius * index) / samples
    points.push({ radius, z: crystalInnerZAtRadius(project, radius) })
  }
  return points
}

export function handCurveOffset(hand: HandSpec, ratio: number): number {
  const start = Math.max(0, Math.min(0.95, hand.curve.startRatio))
  const end = Math.max(start + 0.01, Math.min(1, hand.curve.endRatio))
  const base = valueOf(hand.curve.base)
  const middle = valueOf(hand.curve.middle)
  const tip = valueOf(hand.curve.tip)
  if (ratio <= start) return base
  if (ratio >= end) return tip
  const local = (ratio - start) / (end - start)
  if (local <= 0.5) return base + (middle - base) * smoothStep(local * 2)
  return middle + (tip - middle) * smoothStep((local - 0.5) * 2)
}

const handAngles: Record<'hour' | 'minute' | 'second', number> = {
  hour: Math.PI * 0.18,
  minute: -Math.PI * 0.27,
  second: Math.PI * 0.82,
}

export function buildHandSegments(
  project: WatchProject,
  key: 'hour' | 'minute' | 'second',
  samples = 18,
): HandSegmentGeometry[] {
  const hand = project.hands[key]
  if (!hand.enabled) return []
  const part = `${key}Hand` as HandSegmentGeometry['part']
  const length = valueOf(hand.length)
  const angle = handAngles[key]
  const baseZ = assemblyStack(project).dialTop + valueOf(hand.mountingHeight)
  const segments: HandSegmentGeometry[] = []
  for (let index = 0; index < samples; index += 1) {
    const r0 = (length * index) / samples
    const r1 = (length * (index + 1)) / samples
    const ratio0 = r0 / Math.max(0.001, length)
    const ratio1 = r1 / Math.max(0.001, length)
    segments.push({
      id: `${part}-${index}`,
      part,
      start: {
        x: Math.cos(angle) * r0,
        y: Math.sin(angle) * r0,
        z: baseZ + handCurveOffset(hand, ratio0),
      },
      end: {
        x: Math.cos(angle) * r1,
        y: Math.sin(angle) * r1,
        z: baseZ + handCurveOffset(hand, ratio1),
      },
      width: valueOf(hand.width),
      thickness: valueOf(hand.thickness),
      radialStart: r0,
      radialEnd: r1,
    })
  }
  return segments
}

export function buildAssemblyPrimitives(project: WatchProject): ScenePrimitive[] {
  const stack = assemblyStack(project)
  const caseRadius = valueOf(project.case.outerDiameter) / 2
  const lugSpacing = valueOf(project.case.lugSpacing)
  const lugWidth = valueOf(project.case.lugWidth)
  const lugLength = valueOf(project.case.lugLength)
  const lugHeight = Math.max(1.2, valueOf(project.case.totalHeight) * 0.46)
  const lugCenterY = caseRadius + lugLength / 2 - 1.1
  const primitives: ScenePrimitive[] = [
    {
      id: 'case-shell',
      part: 'case',
      kind: 'annulus',
      x: 0,
      y: 0,
      z: stack.caseTop / 2,
      radius: valueOf(project.case.outerDiameter) / 2,
      innerRadius: valueOf(project.case.innerDiameter) / 2,
      height: stack.caseTop,
      layer: 0,
    },
    {
      id: 'case-back',
      part: 'back',
      kind: 'cylinder',
      x: 0,
      y: 0,
      z: stack.backTop / 2,
      radius: valueOf(project.case.outerDiameter) / 2 - 0.6,
      height: stack.backTop,
      layer: 1,
    },
    {
      id: 'case-bezel',
      part: 'bezel',
      kind: 'annulus',
      x: 0,
      y: 0,
      z: stack.caseTop - valueOf(project.exterior.bezel.height) / 2,
      radius: valueOf(project.exterior.bezel.outerDiameter) / 2,
      innerRadius: valueOf(project.exterior.bezel.innerDiameter) / 2,
      height: project.exterior.bezel.enabled ? valueOf(project.exterior.bezel.height) : 0.001,
      layer: 0.1,
    },
  ]

  ;[-1, 1].forEach((side) => {
    ;[-1, 1].forEach((end) => {
      primitives.push({
        id: `case-lug-${side}-${end}`,
        part: 'case',
        kind: 'rounded-box',
        x: side * (lugSpacing / 2 + lugWidth / 2),
        y: end * lugCenterY,
        z: stack.backTop + lugHeight / 2,
        width: lugWidth,
        length: lugLength + 2.2,
        height: lugHeight,
        layer: 0,
      })
    })
  })

  if (project.movement.kind === 'quartz') {
    primitives.push({
      id: 'quartz-movement',
      part: 'movement',
      kind: 'quartz-outline',
      x: 0,
      y: 0,
      z: (stack.movementBottom + stack.movementTop) / 2,
      width: valueOf(project.movement.width),
      length: valueOf(project.movement.length),
      height: valueOf(project.movement.thickness),
      layer: 2,
    })
  } else {
    primitives.push(
      {
        id: 'mechanical-plate',
        part: 'plate',
        kind: 'cylinder',
        x: 0,
        y: 0,
        z: stack.movementBottom + valueOf(project.movement.trainBaseZ) + valueOf(project.movement.plateThickness) / 2,
        radius: valueOf(project.movement.plateDiameter) / 2,
        height: valueOf(project.movement.plateThickness),
        layer: 2,
      },
      {
        id: 'mechanical-bridge',
        part: 'bridge',
        kind: 'annulus',
        x: 0,
        y: 0,
        z: stack.movementBottom + valueOf(project.movement.bridgeTopZ) - valueOf(project.movement.bridgeThickness) / 2,
        radius: valueOf(project.movement.plateDiameter) / 2 - 0.4,
        innerRadius: valueOf(project.movement.plateDiameter) * 0.34,
        height: valueOf(project.movement.bridgeThickness),
        layer: 3,
      },
    )
  }

  primitives.push({
    id: 'dial-body',
    part: 'dial',
    kind: 'dial-profile',
    x: 0,
    y: 0,
    z: stack.dialBottom,
    layer: 4,
  })

  project.dial.reliefs.forEach((relief, index) => {
    const radius = Math.hypot(valueOf(relief.x), valueOf(relief.y))
    const base = dialSurfaceZ(project.dial, radius)
    primitives.push({
      id: relief.id,
      part: 'dial',
      kind: relief.shape === 'circle' ? 'cylinder' : 'box',
      x: valueOf(relief.x),
      y: valueOf(relief.y),
      z: base + valueOf(relief.height) / 2,
      radius: relief.shape === 'circle' ? valueOf(relief.width) / 2 : undefined,
      width: valueOf(relief.width),
      length: valueOf(relief.length),
      height: valueOf(relief.height),
      rotation: relief.shape === 'index' ? Math.atan2(valueOf(relief.y), valueOf(relief.x)) : 0,
      layer: 5 + index * 0.01,
    })
  })

  if (project.exterior.rehaut.enabled) {
    primitives.push({
      id: 'rehaut-ring',
      part: 'rehaut',
      kind: 'annulus',
      x: 0,
      y: 0,
      z: stack.dialTop + valueOf(project.exterior.rehaut.height) / 2,
      radius: valueOf(project.exterior.rehaut.outerDiameter) / 2,
      innerRadius: valueOf(project.exterior.rehaut.innerDiameter) / 2,
      height: valueOf(project.exterior.rehaut.height),
      layer: 5.2,
    })
  }

  if (project.exterior.dialGraphics.indicesEnabled) {
    const graphics = project.exterior.dialGraphics
    const count = Math.max(1, Math.round(graphics.indexCount))
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2
      const radius = valueOf(graphics.indexRadius)
      const isDot = graphics.indexShape === 'dot'
      primitives.push({
        id: `dial-index-${index}`,
        part: 'dialGraphics',
        kind: isDot ? 'cylinder' : 'rounded-box',
        x: Math.sin(angle) * radius,
        y: Math.cos(angle) * radius,
        z: stack.dialTop + valueOf(graphics.indexHeight) / 2 + 0.015,
        radius: isDot ? valueOf(graphics.indexWidth) * 0.72 : undefined,
        width: isDot ? undefined : valueOf(graphics.indexWidth),
        length: isDot ? undefined : valueOf(graphics.indexLength),
        height: valueOf(graphics.indexHeight),
        rotation: -angle,
        layer: 5.4,
      })
    }
    if (graphics.minuteTrack) {
      for (let index = 0; index < 60; index += 1) {
        if (index % 5 === 0) continue
        const angle = (index / 60) * Math.PI * 2
        const radius = valueOf(graphics.indexRadius) + valueOf(graphics.indexLength) * 0.56
        primitives.push({
          id: `minute-track-${index}`,
          part: 'dialGraphics',
          kind: 'box',
          x: Math.sin(angle) * radius,
          y: Math.cos(angle) * radius,
          z: stack.dialTop + 0.035,
          width: 0.12,
          length: 0.48,
          height: 0.05,
          rotation: -angle,
          layer: 5.3,
        })
      }
    }
  }

  ;(['hour', 'minute', 'second'] as const).forEach((key, handIndex) => {
    buildHandSegments(project, key).forEach((segment) => {
      primitives.push({
        id: segment.id,
        part: segment.part,
        kind: 'rod',
        x: (segment.start.x + segment.end.x) / 2,
        y: (segment.start.y + segment.end.y) / 2,
        z: (segment.start.z + segment.end.z) / 2,
        width: segment.width,
        height: segment.thickness,
        start: segment.start,
        end: segment.end,
        layer: 6 + handIndex,
      })
    })
  })

  primitives.push(
    {
      id: 'crystal',
      part: 'crystal',
      kind: 'crystal-profile',
      x: 0,
      y: 0,
      z: stack.crystalEdgeInner,
      layer: 10,
    },
    {
      id: 'stem',
      part: 'stem',
      kind: 'rod',
      x: 0,
      y: 0,
      z: stack.stemAxisAbsolute,
      width: 0.6,
      height: 0.6,
      start: { x: 0, y: 0, z: stack.stemAxisAbsolute },
      end: { x: valueOf(project.case.crownDistance), y: 0, z: stack.stemAxisAbsolute },
      layer: 3,
    },
    {
      id: 'crown',
      part: 'crown',
      kind: 'cylinder',
      x: valueOf(project.case.crownDistance),
      y: 0,
      z: valueOf(project.case.stemAxisZ),
      radius: valueOf(project.case.crownDiameter) / 2,
      height: 2.4,
      rotation: Math.PI / 2,
      layer: 3,
    },
  )
  const tubeStart = caseRadius - 0.35
  const tubeEnd = valueOf(project.case.crownDistance) - 1.15
  if (tubeEnd > tubeStart) {
    primitives.push({
      id: 'crown-tube',
      part: 'crown',
      kind: 'cylinder',
      x: (tubeStart + tubeEnd) / 2,
      y: 0,
      z: valueOf(project.case.stemAxisZ),
      radius: valueOf(project.case.crownTubeDiameter) / 2,
      height: tubeEnd - tubeStart,
      rotation: Math.PI / 2,
      layer: 3,
    })
  }

  const strap = project.exterior.strap
  if (strap.kind !== 'none') {
    const strapWidth = valueOf(strap.width)
    const thickness = valueOf(strap.thickness)
    const caseEnd = caseRadius + lugLength + 0.8
    const addStrapSegment = (id: string, sign: -1 | 1, center: number, length: number, width = strapWidth) => {
      primitives.push({
        id,
        part: 'strap',
        kind: 'rounded-box',
        x: 0,
        y: sign * center,
        z: Math.max(0.15, stack.backTop * 0.55),
        width,
        length,
        height: thickness,
        layer: -0.2,
      })
    }
    if (strap.kind === 'bracelet') {
      ;([-1, 1] as const).forEach((sign) => {
        const total = sign === 1 ? valueOf(strap.upperLength) : valueOf(strap.lowerLength)
        const pitch = Math.max(2, valueOf(strap.linkLength) + valueOf(strap.linkGap))
        const count = Math.min(22, Math.max(3, Math.floor(total / pitch)))
        for (let index = 0; index < count; index += 1) {
          const taper = 1 - index / Math.max(1, count - 1)
          const width = valueOf(strap.taperWidth) + (strapWidth - valueOf(strap.taperWidth)) * taper
          addStrapSegment(`bracelet-${sign}-${index}`, sign, caseEnd + pitch * (index + 0.5), valueOf(strap.linkLength), width)
        }
      })
    } else {
      const upper = valueOf(strap.upperLength)
      const lower = valueOf(strap.lowerLength)
      addStrapSegment('strap-upper', 1, caseEnd + upper / 2, upper)
      addStrapSegment('strap-lower', -1, caseEnd + lower / 2, lower)
    }
    ;([-1, 1] as const).forEach((sign) => {
      primitives.push({
        id: `spring-bar-${sign}`,
        part: 'springBar',
        kind: 'rod',
        x: 0,
        y: sign * lugCenterY,
        z: stack.backTop + lugHeight * 0.48,
        width: valueOf(project.exterior.springBars.diameter),
        height: valueOf(project.exterior.springBars.diameter),
        start: { x: -valueOf(project.exterior.springBars.length) / 2, y: sign * lugCenterY, z: stack.backTop + lugHeight * 0.48 },
        end: { x: valueOf(project.exterior.springBars.length) / 2, y: sign * lugCenterY, z: stack.backTop + lugHeight * 0.48 },
        layer: 0,
      })
    })
    primitives.push({
      id: 'strap-clasp',
      part: 'clasp',
      kind: 'rounded-box',
      x: 0,
      y: caseEnd + valueOf(strap.upperLength) * 0.76,
      z: Math.max(0.15, stack.backTop * 0.55) + thickness * 0.12,
      width: valueOf(strap.taperWidth) + 1.2,
      length: 8,
      height: thickness + 0.35,
      layer: -0.1,
    })
  }
  return primitives
}
