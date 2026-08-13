import { assemblyStack } from '../vnext/geometry'
import { qualityReliability, valueOf, type MateConstraint, type Reliability, type WatchPartId, type WatchProject } from '../vnext/model'

export interface PartPose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
}

export interface ConstraintResult {
  id: string
  name: string
  type: MateConstraint['type']
  satisfied: boolean
  residual: number
  tolerance: number
  reliability: Reliability
  sourcePart: WatchPartId
  targetPart: WatchPartId
}

export interface PartFreedom {
  part: WatchPartId
  remaining: number
  constrained: boolean
  overconstrained: boolean
}

export interface AssemblyConstraintSolution {
  constraints: ConstraintResult[]
  freedoms: PartFreedom[]
  unresolvedParts: WatchPartId[]
  failedConstraints: ConstraintResult[]
  stemAxisError: number
  fullyConstrained: boolean
}

const ZERO_POSE: PartPose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }

function pose(z = 0, x = 0, y = 0): PartPose {
  return { ...ZERO_POSE, x, y, z }
}

export function canonicalPartPoses(project: WatchProject): Partial<Record<WatchPartId, PartPose>> {
  const stack = assemblyStack(project)
  const movementHeight = project.movement.kind === 'mechanical'
    ? valueOf(project.movement.totalHeight)
    : valueOf(project.movement.thickness)
  const handZ = (key: 'hour' | 'minute' | 'second') =>
    stack.dialTop + valueOf(project.hands[key].mountingHeight) + valueOf(project.hands[key].curve.base)

  return {
    case: pose(valueOf(project.case.totalHeight) / 2),
    back: pose(valueOf(project.case.backThickness) / 2),
    movement: pose(stack.movementBottom + movementHeight / 2),
    plate: pose(stack.movementBottom + (project.movement.kind === 'mechanical' ? valueOf(project.movement.trainBaseZ) + valueOf(project.movement.plateThickness) / 2 : movementHeight / 2)),
    bridge: project.movement.kind === 'mechanical'
      ? pose(stack.movementBottom + valueOf(project.movement.bridgeTopZ) - valueOf(project.movement.bridgeThickness) / 2)
      : undefined,
    rotor: project.movement.kind === 'mechanical' && project.movement.architecture === 'automatic' && project.movement.automatic
      ? pose(stack.movementBottom + valueOf(project.movement.automatic.rotorZ) + valueOf(project.movement.automatic.rotorThickness) / 2)
      : undefined,
    dial: pose(stack.dialBottom + valueOf(project.dial.thickness) / 2),
    hourHand: pose(handZ('hour')),
    minuteHand: pose(handZ('minute')),
    secondHand: pose(handZ('second')),
    crystal: pose((stack.crystalEdgeInner + stack.crystalTop) / 2),
    stem: pose(stack.stemAxisAbsolute, valueOf(project.case.crownDistance) / 2),
    crown: pose(stack.stemAxisAbsolute, valueOf(project.case.crownDistance)),
  }
}

function axisValue(input: PartPose, axis: 'x' | 'y' | 'z'): number {
  return input[axis]
}

function angularValue(input: PartPose, axis: 'x' | 'y' | 'z'): number {
  if (axis === 'x') return input.rx
  if (axis === 'y') return input.ry
  return input.rz
}

function mateResidual(project: WatchProject, mate: MateConstraint, source: PartPose, target: PartPose): number {
  const axis = mate.axis ?? 'z'
  const offset = valueOf(mate.offset ?? { value: 0, minus: 0, plus: 0, unit: 'mm', quality: 'designed', source: '' })
  if (mate.id === 'mate-dial-movement-z') {
    const stack = assemblyStack(project)
    return Math.abs(stack.dialBottom - stack.movementTop - offset)
  }
  if (mate.id === 'mate-movement-back-z') {
    return Math.abs(valueOf(project.assembly.movementBackClearance) - offset)
  }
  if (mate.type === 'fixed' || mate.type === 'coincident') {
    return Math.hypot(source.x - target.x, source.y - target.y, source.z - target.z)
  }
  if (mate.type === 'concentric') {
    if (axis === 'x') return Math.hypot(source.y - target.y, source.z - target.z)
    if (axis === 'y') return Math.hypot(source.x - target.x, source.z - target.z)
    return Math.hypot(source.x - target.x, source.y - target.y)
  }
  if (mate.type === 'distance') {
    return Math.abs(axisValue(source, axis) - axisValue(target, axis) - offset)
  }
  if (mate.type === 'angle') {
    const targetAngle = valueOf(mate.angle ?? { value: 0, minus: 0, plus: 0, unit: 'deg', quality: 'designed', source: '' })
    return Math.abs(angularValue(source, axis) - angularValue(target, axis) - (targetAngle * Math.PI) / 180)
  }
  return 0
}

function removedDegrees(type: MateConstraint['type']): number {
  if (type === 'fixed') return 6
  if (type === 'coincident') return 3
  if (type === 'concentric') return 4
  return 1
}

export function solveAssemblyConstraints(project: WatchProject): AssemblyConstraintSolution {
  const poses = canonicalPartPoses(project)
  const used = new Map<WatchPartId, number>()
  const constraints: ConstraintResult[] = []

  project.assembly.mates.filter((mate) => mate.enabled).forEach((mate) => {
    const source = poses[mate.sourcePart] ?? ZERO_POSE
    const target = poses[mate.targetPart] ?? ZERO_POSE
    const residual = mateResidual(project, mate, source, target)
    const toleranceDimension = mate.offset ?? mate.angle
    const tolerance = toleranceDimension
      ? Math.max(0.005, toleranceDimension.minus, toleranceDimension.plus)
      : mate.type === 'angle' ? 0.002 : 0.01
    constraints.push({
      id: mate.id,
      name: mate.name,
      type: mate.type,
      satisfied: residual <= tolerance,
      residual,
      tolerance,
      reliability: toleranceDimension ? qualityReliability(toleranceDimension.quality) : 'medium',
      sourcePart: mate.sourcePart,
      targetPart: mate.targetPart,
    })
    used.set(mate.sourcePart, (used.get(mate.sourcePart) ?? 0) + removedDegrees(mate.type))
  })

  const freedoms: PartFreedom[] = [...used.entries()].map(([part, removed]) => ({
    part,
    remaining: Math.max(0, 6 - removed),
    constrained: removed >= 6,
    overconstrained: removed > 6,
  }))
  const unresolvedParts = freedoms.filter((item) => item.remaining > 0).map((item) => item.part)
  const failedConstraints = constraints.filter((item) => !item.satisfied)
  const stack = assemblyStack(project)
  const stemAxisError = stack.stemAxisAbsolute - valueOf(project.case.stemAxisZ)

  return {
    constraints,
    freedoms,
    unresolvedParts,
    failedConstraints,
    stemAxisError,
    fullyConstrained: failedConstraints.length === 0 && unresolvedParts.length === 0,
  }
}
