export interface EducationalCalculation {
  value: number
  unit: string
  formula: string
  inputs: Record<string, number | string>
  rounding: string
  classification: 'educational-calculation'
  limitation: string
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} debe ser un entero positivo.`)
}

export function calculateGearPair(
  driverTeeth: number,
  drivenTeeth: number,
  relation: 'external-mesh' | 'internal-mesh' = 'external-mesh',
): { ratio: EducationalCalculation; direction: 1 | -1 } {
  positiveInteger(driverTeeth, 'Los dientes de la conductora')
  positiveInteger(drivenTeeth, 'Los dientes de la conducida')
  return {
    ratio: {
      value: driverTeeth / drivenTeeth,
      unit: 'vueltas conducida / vuelta conductora',
      formula: 'n_conducida / n_conductora = Z_conductora / Z_conducida',
      inputs: { driverTeeth, drivenTeeth, relation },
      rounding: 'sin redondeo interno; presentación configurable',
      classification: 'educational-calculation',
      limitation: 'Relación ideal por dientes; no modela perfil, depthing, pérdidas ni un calibre real.',
    },
    direction: relation === 'external-mesh' ? -1 : 1,
  }
}

export function calculateGearTrain(stages: Array<{
  driverTeeth: number
  drivenTeeth: number
  relation: 'external-mesh' | 'internal-mesh'
  engaged?: boolean
}>): { totalRatio: EducationalCalculation; finalDirection: 1 | -1 | 0 } {
  if (stages.length === 0) throw new Error('El tren necesita al menos una etapa.')
  let ratio = 1
  let direction: 1 | -1 = 1
  for (const stage of stages) {
    if (stage.engaged === false) {
      return {
        totalRatio: {
          value: 0,
          unit: 'vueltas salida / vuelta entrada',
          formula: 'tren interrumpido = 0',
          inputs: { stages: stages.length },
          rounding: 'exacto',
          classification: 'educational-calculation',
          limitation: 'Cero significa cadena cinemática interrumpida, no par físico nulo medido.',
        },
        finalDirection: 0,
      }
    }
    const pair = calculateGearPair(stage.driverTeeth, stage.drivenTeeth, stage.relation)
    ratio *= pair.ratio.value
    direction = (direction * pair.direction) as 1 | -1
  }
  return {
    totalRatio: {
      value: ratio,
      unit: 'vueltas salida / vuelta entrada',
      formula: 'R_total = Π(Z_conductora_i / Z_conducida_i)',
      inputs: { stages: stages.length },
      rounding: 'sin redondeo interno; 6 decimales en informes',
      classification: 'educational-calculation',
      limitation: 'Modelo cinemático ideal; no afirma dientes, velocidad o par de MIYOTA 8215.',
    },
    finalDirection: direction,
  }
}

export function calculateOscillator(frequencyHz: number): {
  period: EducationalCalculation
  alternationsPerHour: EducationalCalculation
} {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 || frequencyHz > 20) {
    throw new Error('La frecuencia conceptual debe estar entre 0 y 20 Hz.')
  }
  return {
    period: {
      value: 1 / frequencyHz,
      unit: 's/ciclo',
      formula: 'T = 1 / f',
      inputs: { frequencyHz },
      rounding: 'sin redondeo interno',
      classification: 'educational-calculation',
      limitation: 'Periodo ideal didáctico; no simula espiral, inercia, amplitud ni isocronismo.',
    },
    alternationsPerHour: {
      value: frequencyHz * 2 * 3600,
      unit: 'alternancias/hora',
      formula: 'A/h = f × 2 × 3600',
      inputs: { frequencyHz },
      rounding: 'entero cuando la entrada lo permite',
      classification: 'educational-calculation',
      limitation: 'Conversión de unidades; no es una medición de marcha.',
    },
  }
}

export function calculateMotionWorks(minuteWheelTurns: number): {
  hourHandTurns: EducationalCalculation
  minuteHandTurns: EducationalCalculation
} {
  if (!Number.isFinite(minuteWheelTurns)) throw new Error('Las vueltas deben ser finitas.')
  return {
    minuteHandTurns: {
      value: minuteWheelTurns,
      unit: 'vueltas',
      formula: 'n_minutera = n_entrada',
      inputs: { minuteWheelTurns },
      rounding: 'sin redondeo',
      classification: 'educational-calculation',
      limitation: 'Minutería conceptual normalizada.',
    },
    hourHandTurns: {
      value: minuteWheelTurns / 12,
      unit: 'vueltas',
      formula: 'n_horaria = n_minutera / 12',
      inputs: { minuteWheelTurns },
      rounding: 'sin redondeo',
      classification: 'educational-calculation',
      limitation: 'Relación de indicación de 12 horas; no describe un conteo de dientes real.',
    },
  }
}

export function calculateConceptualReserve(normalizedEnergy: number, normalizedConsumptionPerHour: number): EducationalCalculation {
  if (normalizedEnergy < 0 || normalizedEnergy > 1) throw new Error('La energía normalizada debe estar entre 0 y 1.')
  if (normalizedConsumptionPerHour <= 0) throw new Error('El consumo conceptual debe ser positivo.')
  return {
    value: normalizedEnergy / normalizedConsumptionPerHour,
    unit: 'horas conceptuales',
    formula: 'reserva = energía normalizada / consumo normalizado por hora',
    inputs: { normalizedEnergy, normalizedConsumptionPerHour },
    rounding: 'sin redondeo interno',
    classification: 'educational-calculation',
    limitation: 'No modela curva de par, pérdidas, amplitud ni reserva de un calibre real.',
  }
}
