import { valueOf, type MechanicalArbor } from '../vnext/model'

const EPSILON = 1e-9

export interface InvoluteGearInput {
  teeth: number
  module: number
  pressureAngleDeg: number
  profileShift: number
  addendumCoefficient: number
  dedendumCoefficient: number
  backlash: number
}

export interface InvoluteGearGeometry extends InvoluteGearInput {
  pitchRadius: number
  baseRadius: number
  tipRadius: number
  rootRadius: number
  circularPitch: number
  basePitch: number
  toothThicknessAtPitch: number
  minimumTeethWithoutUndercut: number
  undercutRisk: boolean
}

export interface GearPairAnalysis {
  driver: InvoluteGearGeometry
  driven: InvoluteGearGeometry
  nominalCenterDistance: number
  actualCenterDistance: number
  centerDistanceError: number
  operatingPressureAngleDeg: number
  transverseContactRatio: number
  backlash: number
  interferenceRisk: boolean
  contactValid: boolean
}

export interface GearPoint {
  x: number
  y: number
}

export interface CycloidalPairGeometry {
  wheelTeeth: number
  pinionLeaves: number
  module: number
  ratio: number
  wheelPitchRadius: number
  pinionPitchRadius: number
  generatingRadius: number
  wheelAddendum: number
  wheelDedendum: number
  pinionAddendum: number
  pinionDedendum: number
  ogiveRadius: number
  addendumFactor: number
  radiusFactor: number
  approachBeforeCenterDeg: number
  leadState: 'smooth' | 'mixed' | 'critical'
}

const BS978_RATIOS = [3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12]
const BS978_FACTORS: Record<number, { addendum: number[]; radius: number[] }> = {
  6: { addendum: [1.259, 1.280, 1.293, 1.303, 1.307, 1.310, 1.313, 1.315, 1.318, 1.320, 1.321, 1.323, 1.326, 1.328], radius: [1.855, 1.886, 1.906, 1.920, 1.926, 1.930, 1.934, 1.938, 1.942, 1.944, 1.947, 1.949, 1.954, 1.957] },
  7: { addendum: [1.335, 1.359, 1.374, 1.385, 1.389, 1.393, 1.396, 1.399, 1.402, 1.404, 1.406, 1.408, 1.411, 1.414], radius: [1.968, 2.003, 2.025, 2.041, 2.048, 2.053, 2.058, 2.062, 2.066, 2.069, 2.072, 2.075, 2.080, 2.084] },
  8: { addendum: [1.403, 1.430, 1.447, 1.459, 1.464, 1.468, 1.471, 1.475, 1.478, 1.480, 1.482, 1.484, 1.488, 1.491], radius: [2.068, 2.107, 2.132, 2.150, 2.157, 2.163, 2.169, 2.173, 2.177, 2.181, 2.184, 2.187, 2.193, 2.197] },
  9: { addendum: [1.465, 1.494, 1.513, 1.526, 1.531, 1.536, 1.540, 1.543, 1.547, 1.549, 1.552, 1.554, 1.558, 1.561], radius: [2.160, 2.202, 2.230, 2.249, 2.257, 2.263, 2.269, 2.274, 2.279, 2.283, 2.287, 2.290, 2.296, 2.301] },
  10: { addendum: [1.523, 1.554, 1.574, 1.588, 1.594, 1.599, 1.603, 1.607, 1.610, 1.613, 1.616, 1.618, 1.623, 1.626], radius: [2.244, 2.290, 2.320, 2.341, 2.349, 2.356, 2.363, 2.368, 2.373, 2.377, 2.381, 2.385, 2.391, 2.397] },
  12: { addendum: [1.626, 1.661, 1.684, 1.700, 1.707, 1.712, 1.717, 1.721, 1.725, 1.728, 1.731, 1.734, 1.739, 1.743], radius: [2.396, 2.448, 2.482, 2.505, 2.516, 2.523, 2.530, 2.536, 2.542, 2.547, 2.552, 2.556, 2.563, 2.569] },
  14: { addendum: [1.718, 1.756, 1.782, 1.799, 1.807, 1.812, 1.818, 1.822, 1.827, 1.830, 1.834, 1.837, 1.842, 1.847], radius: [2.532, 2.589, 2.626, 2.652, 2.662, 2.671, 2.679, 2.686, 2.692, 2.697, 2.703, 2.707, 2.715, 2.722] },
  15: { addendum: [1.760, 1.801, 1.827, 1.845, 1.853, 1.859, 1.864, 1.869, 1.874, 1.878, 1.881, 1.884, 1.890, 1.895], radius: [2.594, 2.654, 2.692, 2.719, 2.730, 2.739, 2.748, 2.755, 2.761, 2.767, 2.773, 2.777, 2.785, 2.792] },
  16: { addendum: [1.801, 1.843, 1.870, 1.889, 1.897, 1.903, 1.909, 1.914, 1.919, 1.923, 1.926, 1.929, 1.935, 1.940], radius: [2.654, 2.715, 2.756, 2.784, 2.795, 2.804, 2.813, 2.820, 2.827, 2.833, 2.839, 2.844, 2.852, 2.859] },
}

function interpolate(xs: number[], ys: number[], x: number): number {
  if (x <= xs[0]) return ys[0]
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1]
  const upper = xs.findIndex((value) => value >= x)
  const lower = Math.max(0, upper - 1)
  const ratio = (x - xs[lower]) / Math.max(EPSILON, xs[upper] - xs[lower])
  return ys[lower] + (ys[upper] - ys[lower]) * ratio
}

export function bs978Factors(pinionLeaves: number, ratio: number): { addendum: number; radius: number } {
  const rows = Object.keys(BS978_FACTORS).map(Number).sort((a, b) => a - b)
  const leaves = Math.max(rows[0], Math.min(rows[rows.length - 1], pinionLeaves))
  const upperIndex = rows.findIndex((value) => value >= leaves)
  const lowerLeaves = rows[Math.max(0, upperIndex - 1)]
  const upperLeaves = rows[Math.max(0, upperIndex)]
  const lower = BS978_FACTORS[lowerLeaves]
  const upper = BS978_FACTORS[upperLeaves]
  const leafRatio = upperLeaves === lowerLeaves ? 0 : (leaves - lowerLeaves) / (upperLeaves - lowerLeaves)
  const lowAddendum = interpolate(BS978_RATIOS, lower.addendum, ratio)
  const highAddendum = interpolate(BS978_RATIOS, upper.addendum, ratio)
  const lowRadius = interpolate(BS978_RATIOS, lower.radius, ratio)
  const highRadius = interpolate(BS978_RATIOS, upper.radius, ratio)
  return {
    addendum: lowAddendum + (highAddendum - lowAddendum) * leafRatio,
    radius: lowRadius + (highRadius - lowRadius) * leafRatio,
  }
}

export function calculateCycloidalPair(wheelTeeth: number, pinionLeaves: number, module: number): CycloidalPairGeometry {
  const wheel = Math.max(6, Math.round(wheelTeeth))
  const pinion = Math.max(4, Math.round(pinionLeaves))
  const normalizedModule = positive(module, 0.1)
  const ratio = wheel / pinion
  const factors = bs978Factors(pinion, ratio)
  return {
    wheelTeeth: wheel,
    pinionLeaves: pinion,
    module: normalizedModule,
    ratio,
    wheelPitchRadius: normalizedModule * wheel / 2,
    pinionPitchRadius: normalizedModule * pinion / 2,
    generatingRadius: normalizedModule * pinion / 4,
    wheelAddendum: normalizedModule * factors.addendum,
    wheelDedendum: normalizedModule * factors.addendum,
    pinionAddendum: normalizedModule * 0.4,
    pinionDedendum: normalizedModule * (factors.addendum + 0.4),
    ogiveRadius: normalizedModule * factors.radius,
    addendumFactor: factors.addendum,
    radiusFactor: factors.radius,
    approachBeforeCenterDeg: pinion >= 10 ? 0 : (10 - pinion) * 2.5,
    leadState: pinion >= 10 ? 'smooth' : pinion >= 8 ? 'mixed' : 'critical',
  }
}

function polarPoint(radius: number, angle: number): GearPoint {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

export function buildCycloidalWheelOutline(
  wheelTeeth: number,
  pinionLeaves: number,
  module: number,
  backlash = 0,
  flankSamples = 7,
): GearPoint[] {
  const pair = calculateCycloidalPair(wheelTeeth, pinionLeaves, module)
  const pitch = pair.wheelPitchRadius
  const root = Math.max(pair.module * 0.2, pitch - pair.wheelDedendum)
  const tip = pitch + pair.wheelAddendum
  const generator = pair.generatingRadius
  const toothThickness = Math.max(pair.module * 0.08, Math.PI * pair.module / 2 - backlash / 2)
  const halfTooth = toothThickness / (2 * pitch)
  const samples = Math.max(4, Math.round(flankSamples))
  const epicycloid = (parameter: number): GearPoint => ({
    x: (pitch + generator) * Math.cos(parameter) - generator * Math.cos(((pitch + generator) / generator) * parameter),
    y: (pitch + generator) * Math.sin(parameter) - generator * Math.sin(((pitch + generator) / generator) * parameter),
  })
  let low = 0
  let high = Math.PI / pair.pinionLeaves
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const middle = (low + high) / 2
    const point = epicycloid(middle)
    if (Math.hypot(point.x, point.y) < tip) low = middle
    else high = middle
  }
  const flank = Array.from({ length: samples + 1 }, (_, index) => {
    const point = epicycloid((high * index) / samples)
    return { radius: Math.hypot(point.x, point.y), polar: Math.abs(Math.atan2(point.y, point.x)) }
  })
  const polarScale = Math.min(1, (halfTooth * 0.85) / Math.max(EPSILON, flank.at(-1)?.polar ?? 0))
  const points: GearPoint[] = []
  for (let tooth = 0; tooth < pair.wheelTeeth; tooth += 1) {
    const center = tooth * Math.PI * 2 / pair.wheelTeeth
    points.push(polarPoint(root, center - halfTooth * 1.35))
    flank.forEach((point) => points.push(polarPoint(point.radius, center - halfTooth + point.polar * polarScale)))
    flank.slice().reverse().forEach((point) => points.push(polarPoint(point.radius, center + halfTooth - point.polar * polarScale)))
    points.push(polarPoint(root, center + halfTooth * 1.35))
  }
  return points
}

export function buildCycloidalPinionOutline(
  wheelTeeth: number,
  pinionLeaves: number,
  module: number,
  backlash = 0,
): GearPoint[] {
  const pair = calculateCycloidalPair(wheelTeeth, pinionLeaves, module)
  const pitch = pair.pinionPitchRadius
  const root = Math.max(pair.module * 0.22, pitch - pair.pinionDedendum)
  const tip = pitch + pair.pinionAddendum
  const thickness = Math.max(pair.module * 0.08, Math.PI * pair.module / 2 - backlash / 2)
  const half = thickness / (2 * pitch)
  const points: GearPoint[] = []
  for (let leaf = 0; leaf < pair.pinionLeaves; leaf += 1) {
    const center = leaf * Math.PI * 2 / pair.pinionLeaves
    points.push(
      polarPoint(root, center - half),
      polarPoint(pitch, center - half),
      polarPoint(tip, center - half * 0.62),
      polarPoint(tip + pair.module * 0.04, center),
      polarPoint(tip, center + half * 0.62),
      polarPoint(pitch, center + half),
      polarPoint(root, center + half),
    )
  }
  return points
}

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function degrees(radiansValue: number): number {
  return (radiansValue * 180) / Math.PI
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function gearInputFromArbor(arbor: MechanicalArbor, usePinion = false): InvoluteGearInput {
  return {
    teeth: Math.max(4, Math.round(valueOf(usePinion ? arbor.pinionTeeth : arbor.wheelTeeth, 12))),
    module: positive(valueOf(arbor.moduleToNext, 0.1), 0.1),
    pressureAngleDeg: valueOf(arbor.pressureAngle ?? { value: 20, minus: 0, plus: 0, unit: 'deg', quality: 'designed', source: '' }),
    profileShift: valueOf(arbor.profileShift ?? { value: 0, minus: 0, plus: 0, unit: 'count', quality: 'designed', source: '' }),
    addendumCoefficient: positive(valueOf(arbor.addendumCoefficient ?? { value: 1, minus: 0, plus: 0, unit: 'count', quality: 'designed', source: '' }), 1),
    dedendumCoefficient: positive(valueOf(arbor.dedendumCoefficient ?? { value: 1.25, minus: 0, plus: 0, unit: 'count', quality: 'designed', source: '' }), 1.25),
    backlash: Math.max(0, valueOf(arbor.backlash ?? { value: 0.02, minus: 0, plus: 0, unit: 'mm', quality: 'designed', source: '' })),
  }
}

export function calculateInvoluteGear(input: InvoluteGearInput): InvoluteGearGeometry {
  const teeth = Math.max(4, Math.round(input.teeth))
  const module = positive(input.module, 0.1)
  const pressureAngleDeg = Math.max(10, Math.min(35, input.pressureAngleDeg))
  const pressureAngle = radians(pressureAngleDeg)
  const profileShift = Number.isFinite(input.profileShift) ? input.profileShift : 0
  const addendumCoefficient = positive(input.addendumCoefficient, 1)
  const dedendumCoefficient = positive(input.dedendumCoefficient, 1.25)
  const backlash = Math.max(0, input.backlash)
  const pitchRadius = (module * teeth) / 2
  const baseRadius = pitchRadius * Math.cos(pressureAngle)
  const tipRadius = pitchRadius + module * (addendumCoefficient + profileShift)
  const rootRadius = Math.max(module * 0.25, pitchRadius - module * (dedendumCoefficient - profileShift))
  const circularPitch = Math.PI * module
  const basePitch = circularPitch * Math.cos(pressureAngle)
  const toothThicknessAtPitch = Math.max(module * 0.08, circularPitch / 2 + 2 * profileShift * module * Math.tan(pressureAngle) - backlash)
  const minimumTeethWithoutUndercut = (2 * addendumCoefficient) / Math.max(EPSILON, Math.sin(pressureAngle) ** 2)

  return {
    ...input,
    teeth,
    module,
    pressureAngleDeg,
    profileShift,
    addendumCoefficient,
    dedendumCoefficient,
    backlash,
    pitchRadius,
    baseRadius,
    tipRadius,
    rootRadius,
    circularPitch,
    basePitch,
    toothThicknessAtPitch,
    minimumTeethWithoutUndercut,
    undercutRisk: teeth + 2 * profileShift < minimumTeethWithoutUndercut,
  }
}

export function analyzeGearPair(
  driverInput: InvoluteGearInput,
  drivenInput: InvoluteGearInput,
  actualCenterDistance?: number,
): GearPairAnalysis {
  const driver = calculateInvoluteGear(driverInput)
  const driven = calculateInvoluteGear({ ...drivenInput, module: driver.module, pressureAngleDeg: driver.pressureAngleDeg })
  const nominalCenterDistance =
    driver.pitchRadius + driven.pitchRadius + driver.module * (driver.profileShift + driven.profileShift)
  const centerDistance = actualCenterDistance ?? nominalCenterDistance
  const baseSum = driver.baseRadius + driven.baseRadius
  const operatingCos = Math.max(-1, Math.min(1, baseSum / Math.max(baseSum, centerDistance)))
  const operatingPressureAngle = Math.acos(operatingCos)
  const approach = Math.sqrt(Math.max(0, driven.tipRadius ** 2 - driven.baseRadius ** 2))
  const recess = Math.sqrt(Math.max(0, driver.tipRadius ** 2 - driver.baseRadius ** 2))
  const pathOfContact = approach + recess - centerDistance * Math.sin(operatingPressureAngle)
  const transverseContactRatio = pathOfContact / Math.max(EPSILON, driver.basePitch)
  const centerDistanceError = centerDistance - nominalCenterDistance
  const radialInterference = centerDistance < driver.rootRadius + driven.tipRadius - driver.module * 0.15
  const lostContact = centerDistance > driver.tipRadius + driven.tipRadius

  return {
    driver,
    driven,
    nominalCenterDistance,
    actualCenterDistance: centerDistance,
    centerDistanceError,
    operatingPressureAngleDeg: degrees(operatingPressureAngle),
    transverseContactRatio,
    backlash: driver.backlash + driven.backlash,
    interferenceRisk: radialInterference || driver.undercutRisk || driven.undercutRisk,
    contactValid: !lostContact && !radialInterference && transverseContactRatio >= 1,
  }
}

function involuteAngle(baseRadius: number, radius: number): number {
  const ratio = Math.max(1, radius / Math.max(EPSILON, baseRadius))
  const t = Math.sqrt(ratio * ratio - 1)
  return t - Math.atan(t)
}

function rotate(point: GearPoint, angle: number): GearPoint {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return { x: point.x * cosine - point.y * sine, y: point.x * sine + point.y * cosine }
}

export function buildInvoluteOutline(input: InvoluteGearInput, flankSamples = 7): GearPoint[] {
  const gear = calculateInvoluteGear(input)
  const samples = Math.max(3, Math.round(flankSamples))
  const startRadius = Math.max(gear.baseRadius, gear.rootRadius)
  const pitchInvolute = involuteAngle(gear.baseRadius, gear.pitchRadius)
  const halfToothAngle = gear.toothThicknessAtPitch / (2 * gear.pitchRadius)
  const points: GearPoint[] = []

  for (let tooth = 0; tooth < gear.teeth; tooth += 1) {
    const centerAngle = (tooth * Math.PI * 2) / gear.teeth
    const leftFlank: GearPoint[] = []
    const rightFlank: GearPoint[] = []
    for (let index = 0; index <= samples; index += 1) {
      const radius = startRadius + ((gear.tipRadius - startRadius) * index) / samples
      const involute = involuteAngle(gear.baseRadius, radius)
      const flankAngle = halfToothAngle + pitchInvolute - involute
      leftFlank.push({ x: Math.cos(centerAngle - flankAngle) * radius, y: Math.sin(centerAngle - flankAngle) * radius })
      rightFlank.unshift({ x: Math.cos(centerAngle + flankAngle) * radius, y: Math.sin(centerAngle + flankAngle) * radius })
    }
    const rootTransition = halfToothAngle * 1.45
    const leftRoot = rotate({ x: gear.rootRadius, y: 0 }, centerAngle - rootTransition)
    const rightRoot = rotate({ x: gear.rootRadius, y: 0 }, centerAngle + rootTransition)
    points.push(leftRoot, ...leftFlank, ...rightFlank, rightRoot)
  }
  return points
}
