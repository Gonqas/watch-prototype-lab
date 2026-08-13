import { qualityReliability, valueOf, type MechanicalMovementSpec, type Reliability } from '../vnext/model'
import type { TrainMetrics } from '../vnext/mechanics'

export interface EscapementIssue {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  detail: string
}

export interface EscapementPhase {
  id: 'locked' | 'unlock' | 'impulse' | 'drop'
  label: string
  share: number
}

export interface EscapementAnalysis {
  type: MechanicalMovementSpec['escapement']['type']
  geometrySupport: 'parametric' | 'partial'
  beatsPerSecond: number
  escapeWheelRpm: number
  escapeToothAdvanceDeg: number
  liftAngleDeg: number
  impulseAngleDeg: number
  safetyArcDeg: number
  lockDeg: number
  dropDeg: number
  drawDeg: number
  efficiency: number
  confidence: Reliability
  phases: EscapementPhase[]
  issues: EscapementIssue[]
}

const reliabilityOrder: Reliability[] = ['pending', 'low', 'medium', 'high']

export function calculateEscapement(
  movement: MechanicalMovementSpec,
  train: TrainMetrics,
): EscapementAnalysis {
  const escape = movement.arbors.find((arbor) => arbor.id === 'escape')
  const type = movement.escapement.type
  const targetVph = valueOf(movement.escapement.targetVph)
  const escapeTeeth = Math.max(1, valueOf(escape?.wheelTeeth ?? movement.escapement.targetVph))
  const lift = valueOf(movement.escapement.liftAngle)
  const impulse = valueOf(movement.escapement.impulseAngle ?? movement.escapement.liftAngle)
  const lock = valueOf(movement.escapement.lock ?? movement.escapement.liftAngle, 0)
  const drop = valueOf(movement.escapement.drop ?? movement.escapement.liftAngle, 0)
  const draw = valueOf(movement.escapement.draw ?? movement.escapement.liftAngle, 0)
  const efficiency = valueOf(movement.escapement.efficiency ?? movement.escapement.liftAngle, 0)
  const safetyArc = lift - impulse
  const issues: EscapementIssue[] = []
  const geometrySupport = type === 'swiss-lever' ? 'parametric' : 'partial'

  if (lift <= 0 || impulse <= 0 || lock <= 0 || drop <= 0) {
    issues.push({
      id: 'escapement-positive-angles',
      severity: 'error',
      title: 'El ciclo del escape no tiene angulos funcionales',
      detail: 'Alzamiento, impulso, bloqueo y caida deben ser positivos para construir una secuencia de eventos.',
    })
  }
  if (safetyArc < 0) {
    issues.push({
      id: 'escapement-negative-safety',
      severity: 'error',
      title: 'El impulso supera el alzamiento',
      detail: `El impulso ocupa ${impulse.toFixed(1)} grados y el alzamiento solo ${lift.toFixed(1)} grados. No queda arco de seguridad.`,
    })
  } else if (safetyArc < 2) {
    issues.push({
      id: 'escapement-tight-safety',
      severity: 'warning',
      title: 'Arco de seguridad muy justo',
      detail: `Quedan ${safetyArc.toFixed(1)} grados fuera del impulso. La guarda y el dardo necesitan verificarse en geometria exacta.`,
    })
  }
  if (draw <= 0) {
    issues.push({
      id: 'escapement-no-draw',
      severity: 'error',
      title: 'Sin accion de draw',
      detail: 'El ancora no tiene tendencia declarada a permanecer apoyada en la cara de bloqueo.',
    })
  }
  if (efficiency <= 0 || efficiency > 1) {
    issues.push({
      id: 'escapement-efficiency-range',
      severity: 'error',
      title: 'Eficiencia de escape fuera de rango',
      detail: 'La eficiencia energetica debe quedar entre 0 y 1.',
    })
  }
  const calculatedVphError = Math.abs(train.calculatedVph - targetVph)
  if (calculatedVphError > 1) {
    issues.push({
      id: 'escapement-rate-mismatch',
      severity: 'error',
      title: 'El avance del escape no coincide con el oscilador',
      detail: `El tren entrega ${Math.round(train.calculatedVph).toLocaleString('es-ES')} vph frente a ${Math.round(targetVph).toLocaleString('es-ES')} vph.`,
    })
  }
  if (geometrySupport === 'partial') {
    issues.push({
      id: 'escapement-partial-geometry',
      severity: 'info',
      title: `${type === 'co-axial' ? 'Co-axial' : 'Detent'} en modo de arquitectura parcial`,
      detail: 'Se simulan frecuencia y presupuesto energetico, pero faltan planos especificos para validar superficies de impulso, seguridad y libertad.',
    })
  }

  const phaseValues = [Math.max(0.01, lock), Math.max(0.01, safetyArc), Math.max(0.01, impulse), Math.max(0.01, drop)]
  const phaseTotal = phaseValues.reduce((sum, value) => sum + value, 0)
  const phaseLabels: Array<[EscapementPhase['id'], string]> = [
    ['locked', 'Bloqueo'],
    ['unlock', 'Desbloqueo'],
    ['impulse', 'Impulso'],
    ['drop', 'Caida'],
  ]
  const phaseDimensions = [movement.escapement.lock, movement.escapement.liftAngle, movement.escapement.impulseAngle, movement.escapement.drop]
    .filter((dimension): dimension is NonNullable<typeof dimension> => Boolean(dimension))
  const confidence = geometrySupport === 'partial'
    ? 'pending'
    : phaseDimensions.reduce<Reliability>((lowest, dimension) => {
      const current = qualityReliability(dimension.quality)
      return reliabilityOrder.indexOf(current) < reliabilityOrder.indexOf(lowest) ? current : lowest
    }, 'high')

  return {
    type,
    geometrySupport,
    beatsPerSecond: targetVph / 3600,
    escapeWheelRpm: train.speedsRph.escape / 60,
    escapeToothAdvanceDeg: 180 / escapeTeeth,
    liftAngleDeg: lift,
    impulseAngleDeg: impulse,
    safetyArcDeg: safetyArc,
    lockDeg: lock,
    dropDeg: drop,
    drawDeg: draw,
    efficiency,
    confidence,
    phases: phaseLabels.map(([id, label], index) => ({ id, label, share: phaseValues[index] / phaseTotal })),
    issues,
  }
}
