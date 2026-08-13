import { qualityReliability, valueOf, type MechanicalMovementSpec, type Reliability } from '../vnext/model'
import type { DynamicsMetrics } from './dynamics'
import type { TrainMetrics } from '../vnext/mechanics'

export interface AutomaticWindingIssue {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  detail: string
}

export interface AutomaticWindingAnalysis {
  rotorInertiaKgM2: number
  peakGravityTorqueNmm: number
  inertialTorqueNmm: number
  availableRotorTorqueNmm: number
  barrelWindingTorqueNmm: number
  requiredBarrelTorqueNmm: number
  torqueMargin: number
  barrelTurnsPerActiveHour: number
  activeHoursToFullWind: number
  dailyBarrelTurns: number
  dailyConsumptionTurns: number
  dailyBalanceTurns: number
  selfSustaining: boolean
  confidence: Reliability
  issues: AutomaticWindingIssue[]
}

const G = 9.80665

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

export function calculateAutomaticWinding(
  movement: MechanicalMovementSpec,
  train: TrainMetrics,
  dynamics: DynamicsMetrics,
): AutomaticWindingAnalysis | null {
  if (movement.architecture !== 'automatic' || !movement.automatic) return null
  const automatic = movement.automatic
  const massKg = Math.max(1e-6, valueOf(automatic.rotorMass) / 1000)
  const outerRadiusM = Math.max(1e-6, valueOf(automatic.rotorDiameter) / 2000)
  const eccentricityM = Math.max(1e-6, valueOf(automatic.centerOfMassRadius) / 1000)
  const frictionNmm = Math.max(0, valueOf(automatic.bearingFrictionTorque))
  const reduction = Math.max(1, valueOf(automatic.rotorToBarrelRatio))
  const efficiency = Math.max(0.01, Math.min(0.99, valueOf(automatic.windingEfficiency)))
  const frequencyHz = Math.max(0, valueOf(automatic.motionFrequency))
  const sweepRad = Math.max(0, Math.min(Math.PI * 2, valueOf(automatic.motionSweep) * Math.PI / 180))
  const activeHours = Math.max(0, Math.min(24, valueOf(automatic.activeHoursPerDay)))
  const capture = automatic.reverserType === 'bidirectional' ? 0.88 : 0.5

  // Semicircular oscillating weight with an explicit measured/designed centre-of-mass offset.
  const rotorInertiaKgM2 = massKg * (0.5 * outerRadiusM ** 2 + eccentricityM ** 2)
  const peakGravityTorqueNmm = massKg * G * eccentricityM * 1000
  const angularFrequency = Math.PI * 2 * frequencyHz
  const angularAmplitude = sweepRad / 2
  const inertialTorqueNmm = rotorInertiaKgM2 * angularAmplitude * angularFrequency ** 2 * 1000
  // RMS orientation factor avoids presenting the ideal vertical peak as continuous available torque.
  const availableRotorTorqueNmm = Math.max(0, Math.hypot(peakGravityTorqueNmm / Math.sqrt(2), inertialTorqueNmm / Math.sqrt(2)) - frictionNmm)
  const barrelWindingTorqueNmm = availableRotorTorqueNmm * reduction * efficiency
  const requiredBarrelTorqueNmm = Math.max(...dynamics.torqueCurve.map((point) => point.barrelTorqueNmm), 1e-9)
  const torqueMargin = barrelWindingTorqueNmm / requiredBarrelTorqueNmm

  const cyclesPerHour = frequencyHz * 3600
  const capturedRotorTurnsPerHour = cyclesPerHour * (sweepRad / (Math.PI * 2)) * capture
  const barrelTurnsPerActiveHour = capturedRotorTurnsPerHour * efficiency / reduction
  const workingTurns = valueOf(movement.mainspring?.turnsWorking ?? movement.barrelTurns, valueOf(movement.barrelTurns))
  const activeHoursToFullWind = workingTurns / Math.max(1e-9, barrelTurnsPerActiveHour)
  const dailyBarrelTurns = barrelTurnsPerActiveHour * activeHours
  const dailyConsumptionTurns = Math.max(0, train.speedsRph.barrel * 24)
  const dailyBalanceTurns = dailyBarrelTurns - dailyConsumptionTurns
  const selfSustaining = torqueMargin >= 1 && dailyBalanceTurns >= 0
  const issues: AutomaticWindingIssue[] = []

  if (torqueMargin < 1) {
    issues.push({
      id: 'automatic-stall',
      severity: 'error',
      title: 'El modulo automatico no vence el par del barrilete',
      detail: `El margen de par calculado es ${torqueMargin.toFixed(2)}x en el escenario actual.`,
    })
  } else if (torqueMargin < 1.35) {
    issues.push({
      id: 'automatic-torque-margin',
      severity: 'warning',
      title: 'Margen de remontuar automatico muy justo',
      detail: `El margen es ${torqueMargin.toFixed(2)}x antes de suciedad, impactos y perdidas no modeladas.`,
    })
  }
  if (dailyBalanceTurns < 0) {
    issues.push({
      id: 'automatic-daily-deficit',
      severity: 'warning',
      title: 'El uso diario no mantiene la reserva',
      detail: `Faltan ${Math.abs(dailyBalanceTurns).toFixed(2)} vueltas de barrilete por dia con este escenario de actividad.`,
    })
  }
  if (eccentricityM >= outerRadiusM) {
    issues.push({
      id: 'automatic-center-of-mass',
      severity: 'error',
      title: 'Centro de masa fuera del rotor',
      detail: 'La excentricidad declarada supera el radio exterior de la masa oscilante.',
    })
  }

  const dimensions = Object.values(automatic).filter((item): item is Exclude<typeof item, string> => typeof item === 'object')
  const reliabilityRank: Reliability[] = ['pending', 'low', 'medium', 'high']
  const confidence = dimensions.reduce<Reliability>((current, dimension) => {
    const reliability = qualityReliability(dimension.quality)
    return reliabilityRank.indexOf(reliability) < reliabilityRank.indexOf(current) ? reliability : current
  }, 'high')
  if (confidence !== 'high') {
    issues.push({
      id: 'automatic-confidence',
      severity: 'info',
      title: 'Escenario de carga pendiente de calibracion',
      detail: 'Masa, excentricidad, friccion, reduccion y patron de uso deben medirse para convertir esta estimacion en una prediccion de marcha.',
    })
  }

  return {
    rotorInertiaKgM2: finite(rotorInertiaKgM2),
    peakGravityTorqueNmm: finite(peakGravityTorqueNmm),
    inertialTorqueNmm: finite(inertialTorqueNmm),
    availableRotorTorqueNmm: finite(availableRotorTorqueNmm),
    barrelWindingTorqueNmm: finite(barrelWindingTorqueNmm),
    requiredBarrelTorqueNmm: finite(requiredBarrelTorqueNmm),
    torqueMargin: finite(torqueMargin),
    barrelTurnsPerActiveHour: finite(barrelTurnsPerActiveHour),
    activeHoursToFullWind: finite(activeHoursToFullWind),
    dailyBarrelTurns: finite(dailyBarrelTurns),
    dailyConsumptionTurns: finite(dailyConsumptionTurns),
    dailyBalanceTurns: finite(dailyBalanceTurns),
    selfSustaining,
    confidence,
    issues,
  }
}
