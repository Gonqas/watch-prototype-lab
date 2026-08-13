import { valueOf, type MechanicalMovementSpec, type Reliability } from '../vnext/model'
import type { TrainMetrics } from '../vnext/mechanics'

export interface TorquePoint {
  barrelTurnsRemaining: number
  barrelTorqueNmm: number
  escapeTorqueNmm: number
  impulseEnergyMicroJ: number
}

export interface DynamicsIssue {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  detail: string
}

export interface DynamicsMetrics {
  naturalFrequencyHz: number
  naturalVph: number
  targetVph: number
  frequencyErrorPercent: number
  balanceEnergyMicroJ: number
  energyLossPerBeatMicroJ: number
  minimumImpulseEnergyMicroJ: number
  maximumImpulseEnergyMicroJ: number
  minimumEnergyMargin: number
  predictedEndAmplitudeDeg: number
  trainEfficiency: number
  powerReserveHours: number
  torqueCurve: TorquePoint[]
  confidence: Reliability
  issues: DynamicsIssue[]
}

function dimensionValue(value: { value: number | null } | undefined, fallback: number): number {
  return value?.value ?? fallback
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

export function calculateMechanicalDynamics(
  movement: MechanicalMovementSpec,
  train: TrainMetrics,
  samples = 41,
): DynamicsMetrics {
  const issues: DynamicsIssue[] = []
  const spring = movement.mainspring
  const springThickness = dimensionValue(spring?.thickness, 0.1)
  const springHeight = dimensionValue(spring?.height, 1.2)
  const springLength = dimensionValue(spring?.length, 300)
  const elasticModulusNmm2 = dimensionValue(spring?.elasticModulus, 190_000)
  const workingTurns = dimensionValue(spring?.turnsWorking, valueOf(movement.barrelTurns, 6))
  const secondMoment = (springHeight * springThickness ** 3) / 12
  const springRateNmmPerRad = (elasticModulusNmm2 * secondMoment) / Math.max(1, springLength)

  const inertiaKgM2 = dimensionValue(movement.balance.inertia, 8.5e-10)
  const hairspringStiffnessNm = dimensionValue(movement.balance.hairspringStiffness, 3.05e-7)
  const dampingRatio = clamp(dimensionValue(movement.balance.dampingRatio, 0.012), 0.001, 0.2)
  const targetAmplitudeRad = (valueOf(movement.balance.targetAmplitude, 270) * Math.PI) / 180
  const naturalAngularFrequency = Math.sqrt(Math.max(0, hairspringStiffnessNm / Math.max(1e-15, inertiaKgM2)))
  const naturalFrequencyHz = naturalAngularFrequency / (Math.PI * 2)
  const naturalVph = naturalFrequencyHz * 7200
  const targetVph = valueOf(movement.escapement.targetVph, 21_600)
  const frequencyErrorPercent = ((naturalVph - targetVph) / Math.max(1, targetVph)) * 100
  const balanceEnergyJ = 0.5 * hairspringStiffnessNm * targetAmplitudeRad ** 2
  const energyLossPerBeatJ = Math.PI * dampingRatio * balanceEnergyJ

  const pairEfficiency = 0.94
  const trainEfficiency = pairEfficiency ** Math.max(1, train.pairs.length)
  const barrelSpeed = Math.max(1e-9, train.speedsRph.barrel)
  const escapeSpeed = Math.max(1e-9, train.speedsRph.escape)
  const speedRatio = escapeSpeed / barrelSpeed
  const escapementEfficiency = clamp(dimensionValue(movement.escapement.efficiency, 0.3), 0.05, 0.8)
  const impulseAngleRad = (dimensionValue(movement.escapement.impulseAngle, valueOf(movement.escapement.liftAngle, 50)) * Math.PI) / 180
  const curve: TorquePoint[] = []

  for (let index = 0; index < Math.max(3, samples); index += 1) {
    // The usable barrel window excludes the weakest final quarter-turns normally removed by stop-work.
    const fraction = 0.25 + (0.75 * index) / Math.max(1, samples - 1)
    const turns = workingTurns * fraction
    const angleRad = turns * Math.PI * 2
    const barrelTorqueNmm = springRateNmmPerRad * angleRad
    const escapeTorqueNmm = (barrelTorqueNmm * trainEfficiency) / Math.max(1, speedRatio)
    const impulseEnergyJ = escapeTorqueNmm * 1e-3 * impulseAngleRad * escapementEfficiency
    curve.push({
      barrelTurnsRemaining: turns,
      barrelTorqueNmm,
      escapeTorqueNmm,
      impulseEnergyMicroJ: impulseEnergyJ * 1e6,
    })
  }

  const minimumImpulseEnergyJ = Math.min(...curve.map((point) => point.impulseEnergyMicroJ)) / 1e6
  const maximumImpulseEnergyJ = Math.max(...curve.map((point) => point.impulseEnergyMicroJ)) / 1e6
  const minimumEnergyMargin = minimumImpulseEnergyJ / Math.max(1e-15, energyLossPerBeatJ)
  const endStateEnergy = minimumImpulseEnergyJ / Math.max(1e-9, Math.PI * dampingRatio)
  const predictedEndAmplitudeRad = Math.sqrt((2 * endStateEnergy) / Math.max(1e-15, hairspringStiffnessNm))
  const predictedEndAmplitudeDeg = clamp((predictedEndAmplitudeRad * 180) / Math.PI, 0, 720)
  const powerReserveHours = workingTurns / barrelSpeed

  if (Math.abs(frequencyErrorPercent) > 2) {
    issues.push({
      id: 'oscillator-frequency',
      severity: 'error',
      title: 'Volante y espiral no coinciden con la frecuencia objetivo',
      detail: `El modelo elastico calcula ${Math.round(naturalVph).toLocaleString('es-ES')} vph, una desviacion de ${frequencyErrorPercent.toFixed(1)}%.`,
    })
  } else if (Math.abs(frequencyErrorPercent) > 0.25) {
    issues.push({
      id: 'oscillator-frequency-trim',
      severity: 'warning',
      title: 'El oscilador necesita ajuste fino',
      detail: `La desviacion teorica es ${frequencyErrorPercent.toFixed(2)}%. La longitud activa del espiral o la inercia deben regularse.`,
    })
  }

  if (minimumEnergyMargin < 1) {
    issues.push({
      id: 'energy-deficit',
      severity: 'error',
      title: 'El escape se queda sin energia al final de la reserva',
      detail: `El impulso minimo cubre ${(minimumEnergyMargin * 100).toFixed(0)}% de la perdida estimada por beat.`,
    })
  } else if (minimumEnergyMargin < 1.35) {
    issues.push({
      id: 'energy-margin',
      severity: 'warning',
      title: 'Margen energetico muy justo',
      detail: `El margen al final de la reserva es ${minimumEnergyMargin.toFixed(2)}x antes de suciedad, lubricacion y variacion de amplitud.`,
    })
  }

  if (predictedEndAmplitudeDeg < 180) {
    issues.push({
      id: 'amplitude-low',
      severity: 'warning',
      title: 'Amplitud final baja',
      detail: `La amplitud estimada al final de la reserva es ${predictedEndAmplitudeDeg.toFixed(0)} grados.`,
    })
  }

  const requiredInputs = [
    spring?.thickness,
    spring?.height,
    spring?.length,
    spring?.elasticModulus,
    movement.balance.inertia,
    movement.balance.hairspringStiffness,
    movement.balance.dampingRatio,
    movement.escapement.efficiency,
  ]
  const missing = requiredInputs.filter((input) => !input || input.value === null).length
  const estimated = requiredInputs.filter((input) => input?.quality === 'estimated' || input?.quality === 'unknown').length
  const confidence: Reliability = missing > 0 ? 'pending' : estimated > 2 ? 'low' : estimated > 0 ? 'medium' : 'high'
  if (confidence !== 'high') {
    issues.push({
      id: 'dynamics-confidence',
      severity: 'info',
      title: 'Simulacion dinamica pendiente de calibracion',
      detail: 'El resultado usa propiedades estimadas del muelle, espiral, lubricacion y escape. Debe calibrarse con piezas o ensayos reales.',
    })
  }

  return {
    naturalFrequencyHz: finite(naturalFrequencyHz),
    naturalVph: finite(naturalVph),
    targetVph,
    frequencyErrorPercent: finite(frequencyErrorPercent),
    balanceEnergyMicroJ: balanceEnergyJ * 1e6,
    energyLossPerBeatMicroJ: energyLossPerBeatJ * 1e6,
    minimumImpulseEnergyMicroJ: minimumImpulseEnergyJ * 1e6,
    maximumImpulseEnergyMicroJ: maximumImpulseEnergyJ * 1e6,
    minimumEnergyMargin: finite(minimumEnergyMargin),
    predictedEndAmplitudeDeg: finite(predictedEndAmplitudeDeg),
    trainEfficiency,
    powerReserveHours: finite(powerReserveHours),
    torqueCurve: curve,
    confidence,
    issues,
  }
}
