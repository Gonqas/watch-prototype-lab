import { valueOf, type Dimension, type HandSpec, type WatchProject } from '../vnext/model'

export interface ToleranceMetricStats {
  id: keyof MetricValues
  label: string
  unit: 'mm'
  nominal: number
  minimum: number
  p01: number
  p05: number
  p50: number
  p95: number
  p99: number
  maximum: number
  failureProbability: number
}

export interface SensitivityContributor {
  id: string
  label: string
  correlation: number
  influence: number
}

export interface ToleranceAnalysis {
  mode: WatchProject['engineering']['toleranceMode']
  samples: number
  seed: number
  yieldProbability: number
  nominalMinimum: number
  worstCaseMinimum: number
  nominalPass: boolean
  worstCasePass: boolean
  metrics: ToleranceMetricStats[]
  contributors: SensitivityContributor[]
}

interface VariableDefinition {
  id: string
  label: string
  dimension: Dimension
  adverse: 'low' | 'high'
}

interface MetricValues {
  movementCase: number
  movementBack: number
  movementDial: number
  crystal: number
  dialFloor: number
  dialSeat: number
  handDial: number
  handHand: number
  stemAxis: number
  rotorTrain: number
  rotorBack: number
  movementTop: number
  minimum: number
}

function metricFails(id: keyof MetricValues, value: number): boolean {
  if (id === 'movementCase') return value < 0.15
  if (id === 'crystal') return value < 0.3
  if (id === 'stemAxis') return Math.abs(value) > 0.15
  return value < 0
}

function samplePasses(sample: MetricValues): boolean {
  return (Object.keys(sample) as Array<keyof MetricValues>)
    .filter((id) => id !== 'minimum')
    .every((id) => !metricFails(id, sample[id]))
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function normalRandom(random: () => number): number {
  const u = Math.max(1e-12, random())
  const v = Math.max(1e-12, random())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v)
}

function sampleDimension(dimension: Dimension, random: () => number): number {
  const nominal = valueOf(dimension)
  if (dimension.distribution === 'fixed' || (dimension.minus === 0 && dimension.plus === 0)) return nominal
  if (dimension.distribution === 'normal') {
    const sigma = Math.max(dimension.minus, dimension.plus) / 3
    return Math.max(nominal - dimension.minus, Math.min(nominal + dimension.plus, nominal + normalRandom(random) * sigma))
  }
  const low = nominal - dimension.minus
  const high = nominal + dimension.plus
  return low + (high - low) * random()
}

function variables(project: WatchProject): VariableDefinition[] {
  const common: VariableDefinition[] = [
    { id: 'case.innerDiameter', label: 'Interior de caja', dimension: project.case.innerDiameter, adverse: 'low' },
    { id: 'case.usableInteriorHeight', label: 'Altura interior util', dimension: project.case.usableInteriorHeight, adverse: 'low' },
    { id: 'case.backThickness', label: 'Grosor del fondo', dimension: project.case.backThickness, adverse: 'low' },
    { id: 'case.dialSeatDiameter', label: 'Asiento de dial', dimension: project.case.dialSeatDiameter, adverse: 'low' },
    { id: 'case.stemAxisZ', label: 'Eje de tija de caja', dimension: project.case.stemAxisZ, adverse: 'high' },
    { id: 'assembly.backClearance', label: 'Apoyo movimiento/fondo', dimension: project.assembly.movementBackClearance, adverse: 'high' },
    { id: 'dial.diameter', label: 'Diametro del dial', dimension: project.dial.diameter, adverse: 'high' },
    { id: 'dial.seatZ', label: 'Altura del asiento de dial', dimension: project.dial.seatZ, adverse: 'high' },
    { id: 'dial.thickness', label: 'Grosor del dial', dimension: project.dial.thickness, adverse: 'high' },
    { id: 'dial.recessDepth', label: 'Profundidad del dial', dimension: project.dial.recess.depth, adverse: 'high' },
    { id: 'crystal.innerRise', label: 'Altura interior del cristal', dimension: project.crystal.innerRise, adverse: 'low' },
  ]
  if (project.movement.kind === 'quartz') {
    common.push(
      { id: 'movement.casingWidth', label: 'Ancho de encajado', dimension: project.movement.casingWidth, adverse: 'high' },
      { id: 'movement.casingLength', label: 'Largo de encajado', dimension: project.movement.casingLength, adverse: 'high' },
      { id: 'movement.thickness', label: 'Altura del movimiento', dimension: project.movement.thickness, adverse: 'high' },
      { id: 'movement.stemAxisZ', label: 'Eje de tija del movimiento', dimension: project.movement.stemAxisZ, adverse: 'low' },
    )
  } else {
    common.push(
      { id: 'movement.plateDiameter', label: 'Diametro de platina', dimension: project.movement.plateDiameter, adverse: 'high' },
      { id: 'movement.trainBaseZ', label: 'Datum inferior del tren', dimension: project.movement.trainBaseZ, adverse: 'high' },
      { id: 'movement.totalHeight', label: 'Altura del movimiento', dimension: project.movement.totalHeight, adverse: 'high' },
      { id: 'movement.bridgeTopZ', label: 'Plano superior de puentes', dimension: project.movement.bridgeTopZ, adverse: 'high' },
      { id: 'movement.stemAxisZ', label: 'Eje de tija del movimiento', dimension: project.movement.stemAxisZ, adverse: 'low' },
    )
    if (project.movement.architecture === 'automatic' && project.movement.automatic) {
      common.push(
        { id: 'movement.rotorZ', label: 'Plano inferior del rotor', dimension: project.movement.automatic.rotorZ, adverse: 'high' },
        { id: 'movement.rotorThickness', label: 'Grosor del rotor', dimension: project.movement.automatic.rotorThickness, adverse: 'high' },
      )
    }
  }
  ;(['hour', 'minute', 'second'] as const).forEach((key) => {
    const hand = project.hands[key]
    if (!hand.enabled) return
    common.push(
      { id: `hands.${key}.mountingHeight`, label: `Altura ${key}`, dimension: hand.mountingHeight, adverse: 'high' },
      { id: `hands.${key}.thickness`, label: `Grosor ${key}`, dimension: hand.thickness, adverse: 'high' },
      { id: `hands.${key}.tubeHeight`, label: `Tubo ${key}`, dimension: hand.tubeHeight, adverse: 'high' },
      { id: `hands.${key}.curve.base`, label: `Curva base ${key}`, dimension: hand.curve.base, adverse: 'high' },
      { id: `hands.${key}.curve.middle`, label: `Curva media ${key}`, dimension: hand.curve.middle, adverse: 'high' },
      { id: `hands.${key}.curve.tip`, label: `Curva punta ${key}`, dimension: hand.curve.tip, adverse: 'high' },
    )
  })
  return common
}

function sampleMap(definitions: VariableDefinition[], random?: () => number): Map<string, number> {
  return new Map(definitions.map((definition) => [
    definition.id,
    random ? sampleDimension(definition.dimension, random) : valueOf(definition.dimension),
  ]))
}

function at(values: Map<string, number>, id: string, fallback: number): number {
  return values.get(id) ?? fallback
}

function handCurve(hand: HandSpec, key: 'hour' | 'minute' | 'second', ratio: number, values: Map<string, number>): number {
  const start = Math.max(0, Math.min(0.95, hand.curve.startRatio))
  const end = Math.max(start + 0.01, Math.min(1, hand.curve.endRatio))
  const base = at(values, `hands.${key}.curve.base`, valueOf(hand.curve.base))
  const middle = at(values, `hands.${key}.curve.middle`, valueOf(hand.curve.middle))
  const tip = at(values, `hands.${key}.curve.tip`, valueOf(hand.curve.tip))
  if (ratio <= start) return base
  if (ratio >= end) return tip
  const local = (ratio - start) / (end - start)
  return local <= 0.5 ? base + (middle - base) * local * 2 : middle + (tip - middle) * (local - 0.5) * 2
}

function evaluateSample(project: WatchProject, values: Map<string, number>): MetricValues {
  const backThickness = at(values, 'case.backThickness', valueOf(project.case.backThickness))
  const usableHeight = at(values, 'case.usableInteriorHeight', valueOf(project.case.usableInteriorHeight))
  const crystalEdge = backThickness + usableHeight
  const crystalRise = at(values, 'crystal.innerRise', valueOf(project.crystal.innerRise))
  const dialSeatZ = at(values, 'dial.seatZ', valueOf(project.dial.seatZ))
  const dialThickness = at(values, 'dial.thickness', valueOf(project.dial.thickness))
  const dialTop = dialSeatZ + dialThickness
  const recessDepth = project.dial.recess.enabled ? at(values, 'dial.recessDepth', valueOf(project.dial.recess.depth)) : 0
  const dialFloor = dialThickness - recessDepth
  const dialSeat = at(values, 'case.dialSeatDiameter', valueOf(project.case.dialSeatDiameter)) / 2 - at(values, 'dial.diameter', valueOf(project.dial.diameter)) / 2

  let movementRadius: number
  if (project.movement.kind === 'quartz') {
    const width = at(values, 'movement.casingWidth', valueOf(project.movement.casingWidth))
    const length = at(values, 'movement.casingLength', valueOf(project.movement.casingLength))
    const radius = Math.min(2.2, width / 2, length / 2)
    movementRadius = Math.hypot(width / 2 - radius, length / 2 - radius) + radius
  } else {
    movementRadius = at(values, 'movement.plateDiameter', valueOf(project.movement.plateDiameter)) / 2
  }
  const movementCase = at(values, 'case.innerDiameter', valueOf(project.case.innerDiameter)) / 2 - movementRadius
  const movementBottom = backThickness + at(values, 'assembly.backClearance', valueOf(project.assembly.movementBackClearance))
  const movementHeight = project.movement.kind === 'quartz'
    ? at(values, 'movement.thickness', valueOf(project.movement.thickness))
    : at(values, 'movement.totalHeight', valueOf(project.movement.totalHeight))
  const movementBack = movementBottom - backThickness
  const movementDial = dialSeatZ - (movementBottom + movementHeight)
  const movementStem = movementBottom + at(values, 'movement.stemAxisZ', valueOf(project.movement.stemAxisZ))
  const stemAxis = movementStem - at(values, 'case.stemAxisZ', valueOf(project.case.stemAxisZ))

  let crystal = Number.POSITIVE_INFINITY
  let handDial = Number.POSITIVE_INFINITY
  let handHand = Number.POSITIVE_INFINITY
  ;(['hour', 'minute', 'second'] as const).forEach((key) => {
    const hand = project.hands[key]
    if (!hand.enabled) return
    const length = valueOf(hand.length)
    const thickness = at(values, `hands.${key}.thickness`, valueOf(hand.thickness))
    const mounting = at(values, `hands.${key}.mountingHeight`, valueOf(hand.mountingHeight))
    for (let index = 0; index <= 48; index += 1) {
      const ratio = index / 48
      const radius = length * ratio
      const curve = handCurve(hand, key, ratio, values)
      const handBottom = dialTop + mounting + curve - thickness / 2
      const handTop = dialTop + mounting + curve + thickness / 2
      const crystalRadius = Math.max(0.001, valueOf(project.crystal.diameter) / 2)
      const radialRatio = Math.min(1, radius / crystalRadius)
      const profile = project.crystal.type === 'flat'
        ? 0
        : project.crystal.type === 'domed'
          ? crystalRise * (1 - radialRatio ** 2)
          : crystalRise * (radialRatio <= 0.68 ? 1 : 1 - ((radialRatio - 0.68) / 0.32) ** 2)
      const dialSurface = project.dial.recess.enabled && radius < valueOf(project.dial.recess.radius)
        ? dialTop - recessDepth * (1 - radius / Math.max(0.001, valueOf(project.dial.recess.radius)))
        : dialTop
      crystal = Math.min(crystal, crystalEdge + profile - handTop)
      handDial = Math.min(handDial, handBottom - dialSurface)
    }
    const capTop = dialTop + mounting + valueOf(hand.curve.base) + at(values, `hands.${key}.tubeHeight`, valueOf(hand.tubeHeight)) + thickness / 2
    crystal = Math.min(crystal, crystalEdge + crystalRise - capTop)
  })

  ;([['hour', 'minute'], ['minute', 'second'], ['hour', 'second']] as const).forEach(([lowerKey, upperKey]) => {
    const lower = project.hands[lowerKey]
    const upper = project.hands[upperKey]
    if (!lower.enabled || !upper.enabled) return
    const sharedRadius = Math.min(valueOf(lower.length), valueOf(upper.length))
    for (let index = 0; index <= 48; index += 1) {
      const radius = sharedRadius * index / 48
      const lowerRatio = radius / Math.max(0.001, valueOf(lower.length))
      const upperRatio = radius / Math.max(0.001, valueOf(upper.length))
      const lowerTop = dialTop
        + at(values, `hands.${lowerKey}.mountingHeight`, valueOf(lower.mountingHeight))
        + handCurve(lower, lowerKey, lowerRatio, values)
        + at(values, `hands.${lowerKey}.thickness`, valueOf(lower.thickness)) / 2
      const upperBottom = dialTop
        + at(values, `hands.${upperKey}.mountingHeight`, valueOf(upper.mountingHeight))
        + handCurve(upper, upperKey, upperRatio, values)
        - at(values, `hands.${upperKey}.thickness`, valueOf(upper.thickness)) / 2
      handHand = Math.min(handHand, upperBottom - lowerTop)
    }
    const lowerTubeTop = dialTop
      + at(values, `hands.${lowerKey}.mountingHeight`, valueOf(lower.mountingHeight))
      + at(values, `hands.${lowerKey}.curve.base`, valueOf(lower.curve.base))
      + at(values, `hands.${lowerKey}.tubeHeight`, valueOf(lower.tubeHeight))
      + at(values, `hands.${lowerKey}.thickness`, valueOf(lower.thickness)) / 2
    const upperTubeBottom = dialTop
      + at(values, `hands.${upperKey}.mountingHeight`, valueOf(upper.mountingHeight))
      + at(values, `hands.${upperKey}.curve.base`, valueOf(upper.curve.base))
      - at(values, `hands.${upperKey}.thickness`, valueOf(upper.thickness)) / 2
    handHand = Math.min(handHand, upperTubeBottom - lowerTubeTop)
  })

  let rotorTrain = Number.POSITIVE_INFINITY
  let rotorBack = Number.POSITIVE_INFINITY
  let movementTop = Number.POSITIVE_INFINITY
  if (project.movement.kind === 'mechanical' && project.movement.architecture === 'automatic' && project.movement.automatic) {
    const rotorZ = at(values, 'movement.rotorZ', valueOf(project.movement.automatic.rotorZ))
    const rotorThickness = at(values, 'movement.rotorThickness', valueOf(project.movement.automatic.rotorThickness))
    const trainBase = at(values, 'movement.trainBaseZ', valueOf(project.movement.trainBaseZ))
    const bridgeTop = at(values, 'movement.bridgeTopZ', valueOf(project.movement.bridgeTopZ))
    rotorTrain = trainBase - rotorZ - rotorThickness
    rotorBack = rotorZ
    movementTop = movementHeight - bridgeTop
  }

  const minimum = Math.min(
    movementCase - 0.15,
    movementBack,
    movementDial,
    crystal - 0.3,
    dialFloor,
    dialSeat,
    handDial,
    handHand,
    0.15 - Math.abs(stemAxis),
    rotorTrain,
    rotorBack,
    movementTop,
  )
  return { movementCase, movementBack, movementDial, crystal, dialFloor, dialSeat, handDial, handHand, stemAxis, rotorTrain, rotorBack, movementTop, minimum }
}

function worseMetric(id: keyof MetricValues, candidate: number, current: number): boolean {
  if (id === 'stemAxis') return Math.abs(candidate) > Math.abs(current)
  return candidate < current
}

function worstCaseValues(project: WatchProject, definitions: VariableDefinition[]): MetricValues {
  const nominalMap = sampleMap(definitions)
  const nominal = evaluateSample(project, nominalMap)
  const result = { ...nominal }
  const keys = (Object.keys(nominal) as Array<keyof MetricValues>).filter((id) => id !== 'minimum')
  keys.forEach((metric) => {
    let values = new Map(nominalMap)
    let current = evaluateSample(project, values)[metric]
    for (let pass = 0; pass < 1; pass += 1) {
      definitions.forEach((definition) => {
        const lowValues = new Map(values)
        const highValues = new Map(values)
        lowValues.set(definition.id, valueOf(definition.dimension) - definition.dimension.minus)
        highValues.set(definition.id, valueOf(definition.dimension) + definition.dimension.plus)
        const low = evaluateSample(project, lowValues)[metric]
        const high = evaluateSample(project, highValues)[metric]
        if (worseMetric(metric, low, current) || worseMetric(metric, high, current)) {
          if (worseMetric(metric, low, high)) {
            values = lowValues
            current = low
          } else {
            values = highValues
            current = high
          }
        }
      })
    }
    result[metric] = current
  })
  result.minimum = Math.min(
    result.movementCase - 0.15,
    result.movementBack,
    result.movementDial,
    result.crystal - 0.3,
    result.dialFloor,
    result.dialSeat,
    result.handDial,
    result.handHand,
    0.15 - Math.abs(result.stemAxis),
    result.rotorTrain,
    result.rotorBack,
    result.movementTop,
  )
  return result
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)))
  return sorted[index]
}

function correlation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0
  const xMean = xs.reduce((sum, value) => sum + value, 0) / xs.length
  const yMean = ys.reduce((sum, value) => sum + value, 0) / ys.length
  let numerator = 0
  let xSquare = 0
  let ySquare = 0
  for (let index = 0; index < xs.length; index += 1) {
    const x = xs[index] - xMean
    const y = ys[index] - yMean
    numerator += x * y
    xSquare += x * x
    ySquare += y * y
  }
  return numerator / Math.max(1e-15, Math.sqrt(xSquare * ySquare))
}

export function runToleranceAnalysis(project: WatchProject, requestedSamples?: number): ToleranceAnalysis {
  const definitions = variables(project)
  const mode = project.engineering.toleranceMode
  const sampleCount = mode === 'nominal' ? 1 : mode === 'worst_case' ? 2 : Math.max(200, Math.min(20_000, requestedSamples ?? project.engineering.monteCarloSamples))
  const random = mulberry32(project.engineering.seed)
  const nominal = evaluateSample(project, sampleMap(definitions))
  const worst = worstCaseValues(project, definitions)
  const sampleValues: MetricValues[] = []
  const inputSeries = new Map(definitions.map((definition) => [definition.id, [] as number[]]))
  for (let index = 0; index < sampleCount; index += 1) {
    if (mode === 'worst_case' && index === 1) {
      definitions.forEach((definition) => inputSeries.get(definition.id)?.push(valueOf(definition.dimension)))
      sampleValues.push(worst)
      continue
    }
    const map = mode === 'monte_carlo'
      ? sampleMap(definitions, random)
      : sampleMap(definitions)
    definitions.forEach((definition) => inputSeries.get(definition.id)?.push(at(map, definition.id, valueOf(definition.dimension))))
    sampleValues.push(evaluateSample(project, map))
  }

  const labels: Record<keyof MetricValues, string> = {
    movementCase: 'Movimiento / caja',
    movementBack: 'Movimiento / fondo',
    movementDial: 'Movimiento / dial',
    crystal: 'Agujas / cristal',
    dialFloor: 'Suelo del dial',
    dialSeat: 'Dial / asiento',
    handDial: 'Agujas / dial',
    handHand: 'Entre agujas',
    stemAxis: 'Alineacion de tija',
    rotorTrain: 'Rotor / base del tren',
    rotorBack: 'Rotor / lado fondo',
    movementTop: 'Puentes / envolvente',
    minimum: 'Margen minimo',
  }
  const keys = (Object.keys(labels) as Array<keyof MetricValues>)
    .filter((id) => Number.isFinite(nominal[id]))
  const metrics = keys.map((id): ToleranceMetricStats => {
    const sorted = sampleValues.map((sample) => sample[id]).sort((a, b) => a - b)
    return {
      id,
      label: labels[id],
      unit: 'mm',
      nominal: nominal[id],
      minimum: sorted[0],
      p01: percentile(sorted, 0.01),
      p05: percentile(sorted, 0.05),
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      maximum: sorted.at(-1) ?? sorted[0],
      failureProbability: sorted.filter((value) => metricFails(id, value)).length / sorted.length,
    }
  })
  const minimumSeries = sampleValues.map((sample) => sample.minimum)
  const contributors = definitions
    .map((definition): SensitivityContributor => {
      const value = correlation(inputSeries.get(definition.id) ?? [], minimumSeries)
      return { id: definition.id, label: definition.label, correlation: value, influence: Math.abs(value) }
    })
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 8)
  const validSamples = sampleValues.filter(samplePasses).length

  return {
    mode,
    samples: sampleCount,
    seed: project.engineering.seed,
    yieldProbability: validSamples / sampleValues.length,
    nominalMinimum: nominal.minimum,
    worstCaseMinimum: worst.minimum,
    nominalPass: samplePasses(nominal),
    worstCasePass: samplePasses(worst),
    metrics,
    contributors,
  }
}
