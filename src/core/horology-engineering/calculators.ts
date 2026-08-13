import {
  canonicalValue,
  convertQuantity,
  quantity,
  type EngineeringQuantity,
} from './units'
import {
  createCalculationRun,
  type CalculationNotice,
  type EngineeringCalculationRun,
  type EngineeringFormula,
} from './model'

const oscillatorFormula: EngineeringFormula = {
  id: 'horology.oscillator.torsional',
  version: '1.0.0',
  title: 'Oscilador volante–espiral ideal',
  expression: 'f = (1 / 2π) · √(κ / I); A/h = 7200 · f',
  level: 'engineering-preview',
  verification: 'dimensionally-checked',
  domain: ['I > 0', 'κ > 0', 'modelo lineal de un grado de libertad'],
  assumptions: [
    'Oscilación torsional lineal de un solo grado de libertad.',
    'Rigidez e inercia constantes; amplitud, temperatura y gravedad no alteran el periodo.',
  ],
  limitations: [
    'No modela isocronismo, curva terminal, punto de fijación, magnetismo, choque ni escape.',
    'Una coincidencia de frecuencia teórica no valida la marcha de un movimiento real.',
  ],
  sourceIds: ['source.watchmaking.vba'],
}

const reliabilityFormula: EngineeringFormula = {
  id: 'statistics.weibull.two-parameter',
  version: '1.0.0',
  title: 'Fiabilidad Weibull de dos parámetros',
  expression: 'R(t)=exp(-(t/η)^β); F(t)=1-R(t); h(t)=(β/η)(t/η)^(β-1)',
  level: 'engineering-preview',
  verification: 'source-reviewed',
  domain: ['t ≥ 0', 'η > 0', 'β > 0'],
  assumptions: [
    'La vida sigue una Weibull de dos parámetros y t ≥ 0, η > 0, β > 0.',
    'El modo de fallo estudiado y la población son comparables.',
  ],
  limitations: [
    'No estima β ni η: deben proceder de datos suficientes y trazables.',
    'No combina modos de fallo, censura, mantenimiento o cambios de uso.',
  ],
  sourceIds: ['source.nist.weibull'],
}

const capabilityFormula: EngineeringFormula = {
  id: 'metrology.process-capability.normal',
  version: '1.0.0',
  title: 'Capacidad de proceso Cp y Cpk',
  expression: 'Cp=(USL-LSL)/(6s); Cpk=min((USL-μ)/(3s),(μ-LSL)/(3s))',
  level: 'engineering-preview',
  verification: 'source-reviewed',
  domain: ['USL > LSL', 's > 0', 'n > 1', 'proceso estable y aproximadamente normal'],
  assumptions: [
    'Proceso estable, observaciones independientes y distribución aproximadamente normal.',
    'Los límites de especificación son bilaterales y la desviación estándar representa el proceso.',
  ],
  limitations: [
    'Con pocas mediciones los índices tienen gran incertidumbre.',
    'Cp y Cpk no sustituyen un estudio de estabilidad, sistema de medición ni forma de distribución.',
  ],
  sourceIds: ['source.nist.capability'],
}

const toleranceFormula: EngineeringFormula = {
  id: 'metrology.stack.linear',
  version: '1.0.0',
  title: 'Cadena lineal de tolerancias',
  expression: 'T_wc=Σ|Tᵢ|; T_rss=√ΣTᵢ²',
  level: 'engineering-preview',
  verification: 'dimensionally-checked',
  domain: ['al menos una contribución', 'magnitud y dirección compatibles'],
  assumptions: [
    'Las contribuciones son lineales y están expresadas en la misma dirección.',
    'RSS presupone contribuciones independientes, aproximadamente centradas y aleatorias.',
  ],
  limitations: [
    'No modela correlaciones, sesgos, no linealidad, geometría GD&T ni deformación en montaje.',
  ],
  sourceIds: ['source.watchmaking.vba'],
}

const springFormula: EngineeringFormula = {
  id: 'horology.mainspring.rectangular-strip',
  version: '1.0.0',
  title: 'Rigidez inicial de un muelle real rectangular',
  expression: 'I = h·e³/12; κ = E·I/L; M = κ·θ',
  level: 'engineering-preview',
  verification: 'dimensionally-checked',
  domain: ['e > 0', 'h > 0', 'L > 0', 'E > 0', 'n > 0', 'lámina elástica lineal'],
  assumptions: [
    'Lámina rectangular, elástica y lineal, con sección constante.',
    'El espesor e es la dimensión de flexión; θ es el giro total impuesto.',
  ],
  limitations: [
    'No modela precurvado, brida deslizante, espiras en contacto, histéresis, fatiga ni curva real de par.',
    'Sirve para comparación preliminar, no para liberar un muelle a fabricación.',
  ],
  sourceIds: ['source.watchmaking.vba'],
}

const gearTrainFormula: EngineeringFormula = {
  id: 'horology.gear-train.compound-ideal',
  version: '1.0.0',
  title: 'Tren de engranajes compuesto ideal',
  expression: 'i = Π(Z_conductora/Z_conducida); n_salida = n_entrada·i; a = m(Z₁+Z₂)/2',
  level: 'engineering-preview',
  verification: 'dimensionally-checked',
  domain: ['dientes enteros positivos', 'módulo > 0', 'velocidad de entrada finita'],
  assumptions: [
    'Engranes ideales de módulo común en cada pareja y sin deslizamiento.',
    'Cada etapa declarada está realmente engranada; los ejes compuestos comparten velocidad.',
  ],
  limitations: [
    'No comprueba perfil, número mínimo de dientes, interferencia, depthing, contacto, cargas, pérdidas ni fabricabilidad.',
    'La distancia de centros es geométrica nominal y no incluye correcciones de perfil ni juego.',
  ],
  sourceIds: ['source.watchmaking.vba'],
}

function finitePositive(input: EngineeringQuantity, name: string): number {
  const value = canonicalValue(input)
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} debe ser mayor que cero.`)
  return value
}

export function calculateOscillatorFromInertia({
  inertia,
  stiffness,
}: {
  inertia: EngineeringQuantity
  stiffness: EngineeringQuantity
}): EngineeringCalculationRun {
  if (inertia.dimension !== 'inertia') throw new Error('La inercia debe tener dimensión de momento de inercia.')
  if (stiffness.dimension !== 'torque') throw new Error('La rigidez torsional debe expresarse como par por radián.')
  const inertiaSi = finitePositive(inertia, 'La inercia')
  const stiffnessSi = finitePositive(stiffness, 'La rigidez')
  const angularFrequency = Math.sqrt(stiffnessSi / inertiaSi)
  const frequency = angularFrequency / (2 * Math.PI)
  return createCalculationRun({
    formula: oscillatorFormula,
    inputs: { inertia, stiffness },
    outputs: {
      frequency: quantity(frequency, 'Hz', 'derived'),
      alternationsPerHour: quantity(frequency * 7200, 'vph', 'derived'),
      period: quantity(1 / frequency, 's', 'derived'),
    },
  })
}

export interface IdealGearStage {
  driverTeeth: number
  drivenTeeth: number
  module: EngineeringQuantity
  mesh: 'external' | 'internal'
}

export function calculateIdealGearTrain({
  inputSpeed,
  stages,
}: {
  inputSpeed: EngineeringQuantity
  stages: IdealGearStage[]
}): EngineeringCalculationRun {
  if (inputSpeed.dimension !== 'rotational-speed') throw new Error('La velocidad de entrada debe ser una velocidad de rotación.')
  if (stages.length === 0) throw new Error('El tren necesita al menos una etapa.')
  let ratio = 1
  let direction = 1
  const inputs: Record<string, EngineeringQuantity> = { inputSpeed }
  const outputs: Record<string, EngineeringQuantity> = {}
  stages.forEach((stage, index) => {
    if (!Number.isInteger(stage.driverTeeth) || stage.driverTeeth <= 0) throw new Error(`La conductora de la etapa ${index + 1} necesita dientes enteros positivos.`)
    if (!Number.isInteger(stage.drivenTeeth) || stage.drivenTeeth <= 0) throw new Error(`La conducida de la etapa ${index + 1} necesita dientes enteros positivos.`)
    if (stage.module.dimension !== 'length') throw new Error(`El módulo de la etapa ${index + 1} debe ser una longitud.`)
    finitePositive(stage.module, `El módulo de la etapa ${index + 1}`)
    ratio *= stage.driverTeeth / stage.drivenTeeth
    if (stage.mesh === 'external') direction *= -1
    inputs[`stage${index + 1}DriverTeeth`] = quantity(stage.driverTeeth, 'count', 'designed')
    inputs[`stage${index + 1}DrivenTeeth`] = quantity(stage.drivenTeeth, 'count', 'designed')
    inputs[`stage${index + 1}Module`] = stage.module
    outputs[`stage${index + 1}CenterDistance`] = quantity(
      stage.module.value * (stage.driverTeeth + stage.drivenTeeth) / 2,
      stage.module.unit,
      'derived',
    )
  })
  const inputRpm = convertQuantity(inputSpeed, 'rpm').value
  outputs.totalRatio = quantity(ratio, 'ratio', 'derived')
  outputs.outputSpeed = quantity(inputRpm * ratio, 'rpm', 'derived')
  outputs.direction = quantity(direction, 'ratio', 'derived')
  return createCalculationRun({
    formula: gearTrainFormula,
    inputs,
    outputs,
  })
}

export function calculateRequiredHairspringStiffness({
  inertia,
  targetAlternations,
}: {
  inertia: EngineeringQuantity
  targetAlternations: EngineeringQuantity
}): EngineeringCalculationRun {
  if (inertia.dimension !== 'inertia') throw new Error('La inercia debe tener dimensión de momento de inercia.')
  if (targetAlternations.unit !== 'vph') throw new Error('La cadencia objetivo debe expresarse en alternancias por hora.')
  const inertiaSi = finitePositive(inertia, 'La inercia')
  const frequency = finitePositive(targetAlternations, 'La cadencia')
  const stiffness = inertiaSi * (2 * Math.PI * frequency) ** 2
  return createCalculationRun({
    formula: oscillatorFormula,
    inputs: { inertia, targetAlternations },
    outputs: {
      stiffness: quantity(stiffness, 'N*m', 'derived'),
      frequency: quantity(frequency, 'Hz', 'derived'),
      period: quantity(1 / frequency, 's', 'derived'),
    },
  })
}

export function calculateWeibullReliability({
  time,
  scale,
  shape,
}: {
  time: EngineeringQuantity
  scale: EngineeringQuantity
  shape: EngineeringQuantity
}): EngineeringCalculationRun {
  if (time.dimension !== 'time' || scale.dimension !== 'time') throw new Error('Tiempo y vida característica deben ser magnitudes de tiempo.')
  if (shape.dimension !== 'dimensionless') throw new Error('La forma β debe ser adimensional.')
  const timeSi = canonicalValue(time)
  const scaleSi = finitePositive(scale, 'La vida característica')
  const beta = finitePositive(shape, 'El parámetro de forma')
  if (timeSi < 0) throw new Error('El tiempo no puede ser negativo.')
  const cumulativeHazard = (timeSi / scaleSi) ** beta
  const reliability = Math.exp(-cumulativeHazard)
  const failureProbability = 1 - reliability
  const hazardSi = timeSi === 0 && beta < 1
    ? Number.POSITIVE_INFINITY
    : (beta / scaleSi) * (timeSi / scaleSi) ** (beta - 1)
  const notices: CalculationNotice[] = []
  if (!Number.isFinite(hazardSi)) notices.push({
    severity: 'warning',
    code: 'weibull.hazard-at-zero',
    message: 'Con β < 1 la tasa de riesgo teórica diverge en t = 0; no se presenta como valor finito.',
  })
  return createCalculationRun({
    formula: reliabilityFormula,
    inputs: { time, scale, shape },
    outputs: {
      reliability: quantity(reliability * 100, 'percent', 'derived'),
      failureProbability: quantity(failureProbability * 100, 'percent', 'derived'),
      cumulativeHazard: quantity(cumulativeHazard, 'ratio', 'derived'),
      ...(Number.isFinite(hazardSi) ? { hazard: quantity(hazardSi, '1/s', 'derived') } : {}),
    },
    validity: notices.length ? 'caution' : 'within-domain',
    notices,
  })
}

export function calculateProcessCapability({
  lowerSpecification,
  upperSpecification,
  mean,
  standardDeviation,
  sampleSize,
}: {
  lowerSpecification: EngineeringQuantity
  upperSpecification: EngineeringQuantity
  mean: EngineeringQuantity
  standardDeviation: EngineeringQuantity
  sampleSize: EngineeringQuantity
}): EngineeringCalculationRun {
  const dimensions = [lowerSpecification, upperSpecification, mean, standardDeviation].map(({ dimension }) => dimension)
  if (dimensions.some((dimension) => dimension !== dimensions[0])) {
    throw new Error('Límites, media y desviación deben compartir magnitud.')
  }
  const targetUnit = lowerSpecification.unit
  const lsl = lowerSpecification.value
  const usl = convertQuantity(upperSpecification, targetUnit).value
  const processMean = convertQuantity(mean, targetUnit).value
  const sigma = convertQuantity(standardDeviation, targetUnit).value
  const samples = sampleSize.value
  if (usl <= lsl) throw new Error('El límite superior debe ser mayor que el inferior.')
  if (sigma <= 0) throw new Error('La desviación estándar debe ser mayor que cero.')
  if (!Number.isInteger(samples) || samples < 2) throw new Error('El tamaño muestral debe ser un entero mayor que uno.')
  const cp = (usl - lsl) / (6 * sigma)
  const cpu = (usl - processMean) / (3 * sigma)
  const cpl = (processMean - lsl) / (3 * sigma)
  const cpk = Math.min(cpu, cpl)
  const notices: CalculationNotice[] = []
  if (samples < 50) notices.push({
    severity: 'warning',
    code: 'capability.small-sample',
    message: 'NIST considera que los estimadores de capacidad suelen requerir unas 50 observaciones independientes; interpreta este resultado con cautela.',
  })
  if (processMean < lsl || processMean > usl) notices.push({
    severity: 'error',
    code: 'capability.mean-outside-specification',
    message: 'La media del proceso está fuera de los límites de especificación.',
  })
  return createCalculationRun({
    formula: capabilityFormula,
    inputs: { lowerSpecification, upperSpecification, mean, standardDeviation, sampleSize },
    outputs: {
      cp: quantity(cp, 'ratio', 'derived'),
      cpk: quantity(cpk, 'ratio', 'derived'),
      cpu: quantity(cpu, 'ratio', 'derived'),
      cpl: quantity(cpl, 'ratio', 'derived'),
    },
    validity: notices.some(({ severity }) => severity === 'error')
      ? 'outside-domain'
      : notices.length ? 'caution' : 'within-domain',
    notices,
  })
}

export function calculateToleranceStack({
  contributors,
}: {
  contributors: EngineeringQuantity[]
}): EngineeringCalculationRun {
  if (contributors.length === 0) throw new Error('La cadena necesita al menos una contribución.')
  const targetUnit = contributors[0].unit
  if (contributors.some(({ dimension }) => dimension !== contributors[0].dimension)) {
    throw new Error('Todas las contribuciones deben compartir magnitud.')
  }
  const values = contributors.map((item) => Math.abs(convertQuantity(item, targetUnit).value))
  const worstCase = values.reduce((total, value) => total + value, 0)
  const rss = Math.sqrt(values.reduce((total, value) => total + value ** 2, 0))
  return createCalculationRun({
    formula: toleranceFormula,
    inputs: Object.fromEntries(contributors.map((value, index) => [`contributor${index + 1}`, value])),
    outputs: {
      worstCase: quantity(worstCase, targetUnit, 'derived'),
      rootSumSquare: quantity(rss, targetUnit, 'derived'),
    },
  })
}

export function calculateMainspringLinearModel({
  thickness,
  height,
  length,
  elasticModulus,
  turns,
}: {
  thickness: EngineeringQuantity
  height: EngineeringQuantity
  length: EngineeringQuantity
  elasticModulus: EngineeringQuantity
  turns: EngineeringQuantity
}): EngineeringCalculationRun {
  if ([thickness, height, length].some(({ dimension }) => dimension !== 'length')) {
    throw new Error('Espesor, altura y longitud deben ser magnitudes de longitud.')
  }
  if (elasticModulus.dimension !== 'pressure') throw new Error('El módulo elástico debe tener dimensión de presión.')
  if (turns.dimension !== 'count') throw new Error('Las vueltas deben expresarse como conteo.')
  const e = finitePositive(thickness, 'El espesor')
  const h = finitePositive(height, 'La altura')
  const lengthSi = finitePositive(length, 'La longitud')
  const modulus = finitePositive(elasticModulus, 'El módulo elástico')
  const turnCount = finitePositive(turns, 'Las vueltas')
  const secondMoment = h * e ** 3 / 12
  const stiffness = modulus * secondMoment / lengthSi
  const totalAngle = turnCount * 2 * Math.PI
  const torque = stiffness * totalAngle
  const storedEnergy = 0.5 * stiffness * totalAngle ** 2
  const notices: CalculationNotice[] = []
  if (e / lengthSi > 0.01) notices.push({
    severity: 'warning',
    code: 'mainspring.slenderness',
    message: 'La relación espesor/longitud es alta para este modelo elemental de lámina.',
  })
  return createCalculationRun({
    formula: springFormula,
    inputs: { thickness, height, length, elasticModulus, turns },
    outputs: {
      secondMoment: quantity(secondMoment, 'm4', 'derived'),
      torsionalStiffness: quantity(stiffness, 'N*m', 'derived'),
      torque: quantity(torque, 'N*m', 'derived'),
      storedEnergy: quantity(storedEnergy, 'J', 'derived'),
    },
    validity: notices.length ? 'caution' : 'within-domain',
    notices,
  })
}

export const ENGINEERING_FORMULAS = [
  gearTrainFormula,
  oscillatorFormula,
  springFormula,
  toleranceFormula,
  capabilityFormula,
  reliabilityFormula,
] as const
