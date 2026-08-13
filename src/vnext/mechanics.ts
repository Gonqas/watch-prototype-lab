import {
  qualityReliability,
  valueOf,
  type Dimension,
  type Finding,
  type MechanicalArbor,
  type MechanicalArborId,
  type MechanicalMovementSpec,
  type Reliability,
  type WatchPartId,
} from './model'
import { analyzeGearPair, calculateCycloidalPair, calculateInvoluteGear, gearInputFromArbor } from '../core/gears'

const DANIELS_TRAIN = 'Horologia, cap. 5 Wheels and Pinions, pp. 113-121'
const DANIELS_LAYOUT = 'Horologia, cap. 10 Movement Design, pp. 280-282'

export interface GearPairMetrics {
  id: string
  driver: MechanicalArborId
  driven: MechanicalArborId
  ratio: number
  targetDistance: number
  actualDistance: number
  distanceError: number
  tolerance: number
  axialOverlap: number
  profile: 'cycloidal' | 'involute'
  contactRatio: number | null
  operatingPressureAngle: number | null
  approachBeforeCenterDeg: number
  backlash: number
  undercutRisk: boolean
}

export interface TrainMetrics {
  pairs: GearPairMetrics[]
  speedsRph: Record<MechanicalArborId, number>
  centerToFourthRatio: number
  centerToEscapeRatio: number
  calculatedVph: number
  targetVph: number
  powerReserveHours: number
  targetPowerReserveHours: number
  minimumEdgeClearance: number
  verticalHeadroom: number
  findings: Finding[]
}

interface DiscEnvelope {
  id: string
  owner: MechanicalArborId | 'balance'
  kind: 'wheel' | 'pinion' | 'balance'
  x: number
  y: number
  radius: number
  zMin: number
  zMax: number
}

const reliabilityOrder: Reliability[] = ['pending', 'low', 'medium', 'high']

function combinedReliability(inputs: Dimension[]): Reliability {
  return inputs.reduce<Reliability>((lowest, input) => {
    const current = qualityReliability(input.quality)
    return reliabilityOrder.indexOf(current) < reliabilityOrder.indexOf(lowest) ? current : lowest
  }, 'high')
}

function distance(a: MechanicalArbor, b: MechanicalArbor): number {
  return Math.hypot(valueOf(a.x) - valueOf(b.x), valueOf(a.y) - valueOf(b.y))
}

function axialOverlap(aMin: number, aMax: number, bMin: number, bMax: number): number {
  return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin))
}

function previousModule(arbors: MechanicalArbor[], index: number): number {
  if (index <= 0) return valueOf(arbors[0]?.moduleToNext, 0.15)
  return valueOf(arbors[index - 1]?.moduleToNext, 0.1)
}

export function wheelPitchRadius(arbor: MechanicalArbor): number {
  return calculateInvoluteGear(gearInputFromArbor(arbor)).pitchRadius
}

export function wheelTipRadius(arbor: MechanicalArbor, driven?: MechanicalArbor): number {
  if ((arbor.profileToNext ?? 'cycloidal') === 'cycloidal' && driven) {
    const pair = calculateCycloidalPair(
      valueOf(arbor.wheelTeeth),
      valueOf(driven.pinionTeeth),
      valueOf(arbor.moduleToNext),
    )
    return pair.wheelPitchRadius + pair.wheelAddendum
  }
  return calculateInvoluteGear(gearInputFromArbor(arbor)).tipRadius
}

export function pinionTipRadius(arbors: MechanicalArbor[], index: number): number {
  if (index === 0) return valueOf(arbors[0]?.pivotDiameter, 0.8) / 2
  const module = previousModule(arbors, index)
  const arbor = arbors[index]
  if (!arbor) return module
  return calculateInvoluteGear({ ...gearInputFromArbor(arbor, true), module }).tipRadius
}

function discEnvelopes(movement: MechanicalMovementSpec): DiscEnvelope[] {
  const discs: DiscEnvelope[] = []
  const trainBase = valueOf(movement.trainBaseZ)
  movement.arbors.forEach((arbor, index) => {
    const wheelHalf = valueOf(arbor.wheelThickness) / 2
    discs.push({
      id: `${arbor.id}-wheel`,
      owner: arbor.id,
      kind: 'wheel',
      x: valueOf(arbor.x),
      y: valueOf(arbor.y),
      radius: wheelTipRadius(arbor, movement.arbors[index + 1]),
      zMin: trainBase + valueOf(arbor.wheelZ) - wheelHalf,
      zMax: trainBase + valueOf(arbor.wheelZ) + wheelHalf,
    })
    if (index > 0) {
      const pinionHalf = valueOf(arbor.pinionThickness) / 2
      discs.push({
        id: `${arbor.id}-pinion`,
        owner: arbor.id,
        kind: 'pinion',
        x: valueOf(arbor.x),
        y: valueOf(arbor.y),
        radius: pinionTipRadius(movement.arbors, index),
        zMin: trainBase + valueOf(arbor.pinionZ) - pinionHalf,
        zMax: trainBase + valueOf(arbor.pinionZ) + pinionHalf,
      })
    }
  })
  const balanceHalf = valueOf(movement.balance.thickness) / 2
  discs.push({
    id: 'balance-wheel',
    owner: 'balance',
    kind: 'balance',
    x: valueOf(movement.balance.x),
    y: valueOf(movement.balance.y),
    radius: valueOf(movement.balance.diameter) / 2,
    zMin: trainBase + valueOf(movement.balance.z) - balanceHalf,
    zMax: trainBase + valueOf(movement.balance.z) + balanceHalf,
  })
  return discs
}

function finding(
  id: string,
  severity: Finding['severity'],
  title: string,
  detail: string,
  parts: WatchPartId[],
  reliability: Reliability,
  source: string,
  clearance?: number,
  culprit?: WatchPartId,
): Finding {
  return { id, severity, title, detail, parts, reliability, source, clearance, culprit }
}

export function calculateTrain(movement: MechanicalMovementSpec): TrainMetrics {
  const findings: Finding[] = []
  const arbors = movement.arbors
  const pairs: GearPairMetrics[] = []

  for (let index = 0; index < arbors.length - 1; index += 1) {
    const driver = arbors[index]
    const driven = arbors[index + 1]
    const module = valueOf(driver.moduleToNext)
    const targetDistance = (module * (valueOf(driver.wheelTeeth) + valueOf(driven.pinionTeeth))) / 2
    const actualDistance = distance(driver, driven)
    const profile = driver.profileToNext ?? 'cycloidal'
    const involute = profile === 'involute'
      ? analyzeGearPair(
        gearInputFromArbor(driver),
        { ...gearInputFromArbor(driven, true), module },
        actualDistance,
      )
      : null
    const cycloidal = profile === 'cycloidal'
      ? calculateCycloidalPair(valueOf(driver.wheelTeeth), valueOf(driven.pinionTeeth), module)
      : null
    const distanceError = actualDistance - targetDistance
    const tolerance = Math.max(0.015, module * 0.08)
    const driverHalf = valueOf(driver.wheelThickness) / 2
    const drivenHalf = valueOf(driven.pinionThickness) / 2
    const overlap = axialOverlap(
      valueOf(driver.wheelZ) - driverHalf,
      valueOf(driver.wheelZ) + driverHalf,
      valueOf(driven.pinionZ) - drivenHalf,
      valueOf(driven.pinionZ) + drivenHalf,
    )
    const pair: GearPairMetrics = {
      id: `${driver.id}-${driven.id}`,
      driver: driver.id,
      driven: driven.id,
      ratio: valueOf(driver.wheelTeeth) / Math.max(1, valueOf(driven.pinionTeeth)),
      targetDistance,
      actualDistance,
      distanceError,
      tolerance,
      axialOverlap: overlap,
      profile,
      contactRatio: involute?.transverseContactRatio ?? null,
      operatingPressureAngle: involute?.operatingPressureAngleDeg ?? null,
      approachBeforeCenterDeg: cycloidal?.approachBeforeCenterDeg ?? 0,
      backlash: involute?.backlash ?? valueOf(driver.backlash ?? { value: 0, minus: 0, plus: 0, unit: 'mm', quality: 'designed', source: '' }),
      undercutRisk: Boolean(involute && (involute.driver.undercutRisk || involute.driven.undercutRisk)),
    }
    pairs.push(pair)

    const pairReliability = combinedReliability([
      driver.x,
      driver.y,
      driver.moduleToNext,
      driver.wheelTeeth,
      driven.x,
      driven.y,
      driven.pinionTeeth,
    ])
    if (distanceError < -tolerance) {
      findings.push(
        finding(
          `mesh-interference-${pair.id}`,
          'error',
          `Interferencia ${driver.name} / ${driven.name}`,
          `Los centros estan ${Math.abs(distanceError).toFixed(3)} mm mas cerca que la distancia de paso nominal. El dentado puede trabarse.`,
          [driver.id, driven.id],
          pairReliability,
          DANIELS_TRAIN,
          distanceError,
          driven.id,
        ),
      )
    } else if (distanceError > tolerance) {
      findings.push(
        finding(
          `mesh-disengaged-${pair.id}`,
          'error',
          `Engrane insuficiente ${driver.name} / ${driven.name}`,
          `Los centros estan ${distanceError.toFixed(3)} mm mas separados que el nominal. Hay riesgo de salto o perdida de contacto.`,
          [driver.id, driven.id],
          pairReliability,
          DANIELS_TRAIN,
          -distanceError,
          driven.id,
        ),
      )
    } else if (Math.abs(distanceError) > tolerance * 0.65) {
      findings.push(
        finding(
          `mesh-tight-${pair.id}`,
          'warning',
          `Profundidad de engrane justa: ${driver.name}`,
          `Desviacion de centro ${distanceError.toFixed(3)} mm. Conviene confirmar la profundidad con geometria real del diente y prueba fisica.`,
          [driver.id, driven.id],
          pairReliability,
          DANIELS_TRAIN,
          tolerance - Math.abs(distanceError),
          driven.id,
        ),
      )
    }
    if (overlap < Math.min(valueOf(driver.wheelThickness), valueOf(driven.pinionThickness)) * 0.55) {
      findings.push(
        finding(
          `mesh-z-${pair.id}`,
          'error',
          `Engrane fuera de plano: ${driver.name}`,
          `El solape axial es ${overlap.toFixed(3)} mm. Rueda y pinon no comparten suficiente altura util.`,
          [driver.id, driven.id],
          combinedReliability([driver.wheelZ, driven.pinionZ]),
          DANIELS_LAYOUT,
          overlap,
          driven.id,
        ),
      )
    }
    if (involute && involute.transverseContactRatio < 1) {
      findings.push(
        finding(
          `contact-ratio-${pair.id}`,
          'error',
          `Contacto discontinuo: ${driver.name}`,
          `La relacion de contacto involuta es ${involute.transverseContactRatio.toFixed(2)}. El siguiente diente puede perder contacto antes de entrar el anterior.`,
          [driver.id, driven.id],
          pairReliability,
          'Calculo involuta ISO, perfil parametrico del proyecto',
          involute.transverseContactRatio - 1,
          driven.id,
        ),
      )
    } else if (involute && involute.transverseContactRatio < 1.2) {
      findings.push(
        finding(
          `contact-ratio-tight-${pair.id}`,
          'warning',
          `Contacto justo: ${driver.name}`,
          `La relacion de contacto es ${involute.transverseContactRatio.toFixed(2)}; pequenas desviaciones de centros o perfil pueden interrumpir el engrane.`,
          [driver.id, driven.id],
          pairReliability,
          'Calculo involuta ISO, perfil parametrico del proyecto',
          involute.transverseContactRatio - 1,
          driven.id,
        ),
      )
    }
    if (involute && (involute.driver.undercutRisk || involute.driven.undercutRisk)) {
      findings.push(
        finding(
          `undercut-${pair.id}`,
          'warning',
          `Riesgo de socavado: ${driven.name}`,
          `El pinon de ${involute.driven.teeth} hojas queda por debajo del minimo teorico ${involute.driven.minimumTeethWithoutUndercut.toFixed(1)} para ${involute.driven.pressureAngleDeg.toFixed(0)} grados sin correccion de perfil.`,
          [driver.id, driven.id],
          'medium',
          'Geometria involuta, criterio teorico de socavado',
          undefined,
          driven.id,
        ),
      )
    }
    if (involute && pair.ratio >= 4) {
      findings.push(
        finding(
          `involute-high-ratio-${pair.id}`,
          'warning',
          `Involuta poco adecuada: ${driver.name}`,
          `La relacion ${pair.ratio.toFixed(2)}:1 eleva el angulo de empuje y la carga de pivote. Para el tren de marcha conviene dentado cicloidal; conserva involuta para remontuar o esfuerzos altos.`,
          [driver.id, driven.id],
          'high',
          'Horologia, Wheels and Pinions, pp. 104-111',
          undefined,
          driver.id,
        ),
      )
    }
    if (cycloidal && cycloidal.leadState !== 'smooth') {
      findings.push(
        finding(
          `cycloidal-lead-${pair.id}`,
          cycloidal.leadState === 'critical' ? 'warning' : 'info',
          `Entrada antes de centros: ${driven.name}`,
          `El pinon de ${cycloidal.pinionLeaves} hojas necesita aproximadamente ${cycloidal.approachBeforeCenterDeg.toFixed(1)} grados de accion antes de la linea de centros. Mantener hojas altas, pulir el pinon y verificar profundidad con prueba de rodadura.`,
          [driver.id, driven.id],
          'medium',
          'Horologia, Wheels and Pinions, pp. 104-111; envolvente BS 978 Part 2',
          undefined,
          driven.id,
        ),
      )
    }
  }

  const barrelRatio = pairs[0]?.ratio ?? 0
  const centerThird = pairs[1]?.ratio ?? 0
  const thirdFourth = pairs[2]?.ratio ?? 0
  const fourthEscape = pairs[3]?.ratio ?? 0
  const centerToFourthRatio = centerThird * thirdFourth
  const centerToEscapeRatio = centerToFourthRatio * fourthEscape
  const escape = arbors.find((arbor) => arbor.id === 'escape')
  const calculatedVph = centerToEscapeRatio * valueOf(escape?.wheelTeeth ?? movement.escapement.targetVph) * 2
  const targetVph = valueOf(movement.escapement.targetVph)
  const powerReserveHours = valueOf(movement.barrelTurns) * barrelRatio
  const targetPowerReserveHours = valueOf(movement.targetPowerReserve)
  const speedsRph: Record<MechanicalArborId, number> = {
    barrel: barrelRatio > 0 ? 1 / barrelRatio : 0,
    center: 1,
    third: centerThird,
    fourth: centerToFourthRatio,
    escape: centerToEscapeRatio,
  }

  if (Math.abs(centerToFourthRatio - 60) > 0.01) {
    findings.push(
      finding(
        'fourth-wheel-rate',
        'error',
        'La cuarta rueda no entrega segundos',
        `La relacion centro-cuarta es ${centerToFourthRatio.toFixed(3)}:1; debe ser 60:1 para una vuelta por minuto.`,
        ['center', 'third', 'fourth'],
        combinedReliability(arbors.slice(1, 4).flatMap((arbor) => [arbor.wheelTeeth, arbor.pinionTeeth])),
        DANIELS_TRAIN,
        undefined,
        'fourth',
      ),
    )
  }

  const vphError = calculatedVph - targetVph
  if (Math.abs(vphError) > 1) {
    findings.push(
      finding(
        'train-vph',
        'error',
        'Tren y oscilador no coinciden',
        `El tren produce ${Math.round(calculatedVph).toLocaleString('es-ES')} vph y el objetivo es ${Math.round(targetVph).toLocaleString('es-ES')} vph.`,
        ['center', 'third', 'fourth', 'escape', 'balance'],
        'medium',
        DANIELS_TRAIN,
        undefined,
        'escape',
      ),
    )
  }

  if (powerReserveHours + 0.1 < targetPowerReserveHours) {
    findings.push(
      finding(
        'power-reserve',
        'warning',
        'Reserva de marcha por debajo del objetivo',
        `La relacion barrilete-centro y ${valueOf(movement.barrelTurns).toFixed(1)} vueltas dan unas ${powerReserveHours.toFixed(1)} h frente a ${targetPowerReserveHours.toFixed(0)} h.`,
        ['barrel', 'center'],
        combinedReliability([movement.barrelTurns, movement.targetPowerReserve]),
        'Horologia, cap. 9 Mainsprings and Accessories',
        undefined,
        'barrel',
      ),
    )
  }

  const plateRadius = valueOf(movement.plateDiameter) / 2
  const requiredEdge = valueOf(movement.edgeClearance)
  const discs = discEnvelopes(movement)
  let minimumEdgeClearance = Number.POSITIVE_INFINITY
  discs.forEach((disc) => {
    const clearance = plateRadius - (Math.hypot(disc.x, disc.y) + disc.radius)
    minimumEdgeClearance = Math.min(minimumEdgeClearance, clearance)
    if (clearance < 0) {
      findings.push(
        finding(
          `plate-boundary-${disc.id}`,
          'error',
          `${disc.owner === 'balance' ? 'Volante' : 'Rueda'} fuera de la platina`,
          `La envolvente excede el borde ${Math.abs(clearance).toFixed(2)} mm.`,
          [disc.owner],
          'medium',
          DANIELS_LAYOUT,
          clearance,
          disc.owner,
        ),
      )
    } else if (clearance < requiredEdge) {
      findings.push(
        finding(
          `plate-edge-${disc.id}`,
          'warning',
          `Margen de platina justo en ${disc.owner}`,
          `Quedan ${clearance.toFixed(2)} mm hasta el borde; el objetivo actual es ${requiredEdge.toFixed(2)} mm.`,
          [disc.owner, 'plate'],
          'low',
          DANIELS_LAYOUT,
          clearance,
          disc.owner,
        ),
      )
    }
  })

  const intendedMeshes = new Set(pairs.map((pair) => `${pair.driver}-wheel:${pair.driven}-pinion`))
  for (let a = 0; a < discs.length; a += 1) {
    for (let b = a + 1; b < discs.length; b += 1) {
      const first = discs[a]
      const second = discs[b]
      if (first.owner === second.owner) continue
      if (intendedMeshes.has(`${first.owner}-${first.kind}:${second.owner}-${second.kind}`)) continue
      if (intendedMeshes.has(`${second.owner}-${second.kind}:${first.owner}-${first.kind}`)) continue
      if (axialOverlap(first.zMin, first.zMax, second.zMin, second.zMax) <= 0.01) continue
      const radialClearance = Math.hypot(first.x - second.x, first.y - second.y) - first.radius - second.radius
      if (radialClearance < -0.02) {
        findings.push(
          finding(
            `component-collision-${first.id}-${second.id}`,
            'error',
            `Colision interna: ${first.owner} / ${second.owner}`,
            `Las envolventes se penetran ${Math.abs(radialClearance).toFixed(2)} mm en el mismo nivel.`,
            [first.owner, second.owner],
            'medium',
            DANIELS_LAYOUT,
            radialClearance,
            second.owner,
          ),
        )
      }
    }
  }

  const maximumTop = Math.max(...discs.map((disc) => disc.zMax))
  const bridgeBottom = valueOf(movement.bridgeTopZ) - valueOf(movement.bridgeThickness)
  const verticalHeadroom = bridgeBottom - maximumTop
  if (verticalHeadroom < 0.08) {
    findings.push(
      finding(
        'bridge-headroom',
        'error',
        'Componentes contra el puente',
        `La holgura vertical disponible es ${verticalHeadroom.toFixed(2)} mm.`,
        ['bridge', 'movement'],
        combinedReliability([movement.totalHeight, movement.bridgeThickness]),
        DANIELS_LAYOUT,
        verticalHeadroom,
        'bridge',
      ),
    )
  } else if (verticalHeadroom < 0.18) {
    findings.push(
      finding(
        'bridge-headroom-tight',
        'warning',
        'Holgura vertical de puente muy justa',
        `Quedan ${verticalHeadroom.toFixed(2)} mm antes del puente. Falta definir endshake real de cada pivote.`,
        ['bridge', 'movement'],
        'low',
        DANIELS_LAYOUT,
        verticalHeadroom,
        'bridge',
      ),
    )
  }

  if (movement.architecture === 'automatic' && movement.automatic) {
    const automatic = movement.automatic
    const rotorRadius = valueOf(automatic.rotorDiameter) / 2
    const rotorBottom = valueOf(automatic.rotorZ)
    const rotorTop = rotorBottom + valueOf(automatic.rotorThickness)
    const trainClearance = valueOf(movement.trainBaseZ) - rotorTop
    const backClearance = rotorBottom
    const topClearance = valueOf(movement.totalHeight) - valueOf(movement.bridgeTopZ)
    const edgeClearance = plateRadius - rotorRadius
    const source = 'Modulo automatico parametrico; pendiente de plano de fabricante'
    if (trainClearance < 0) {
      findings.push(finding(
        'rotor-train-collision',
        'error',
        'El rotor atraviesa la base del tren',
        `La envolvente barrida penetra ${Math.abs(trainClearance).toFixed(2)} mm en la platina o el mecanismo inferior.`,
        ['rotor', 'plate'],
        combinedReliability([automatic.rotorZ, automatic.rotorThickness, movement.trainBaseZ]),
        source,
        trainClearance,
        'rotor',
      ))
    } else if (trainClearance < 0.12) {
      findings.push(finding(
        'rotor-train-clearance',
        'warning',
        'Holgura rotor-tren muy justa',
        `La envolvente de giro deja ${trainClearance.toFixed(2)} mm antes de endshake, deformacion y tornilleria.`,
        ['rotor', 'plate'],
        'low',
        source,
        trainClearance,
        'rotor',
      ))
    }
    if (backClearance < 0) {
      findings.push(finding(
        'rotor-back-envelope-collision',
        'error',
        'El rotor sale por el lado del fondo',
        `El rotor sobresale ${Math.abs(backClearance).toFixed(2)} mm de la envolvente inferior del movimiento.`,
        ['rotor', 'movement'],
        combinedReliability([automatic.rotorZ]),
        source,
        backClearance,
        'rotor',
      ))
    } else if (backClearance < 0.08) {
      findings.push(finding(
        'rotor-back-envelope-clearance',
        'warning',
        'Rotor al limite del fondo',
        `Quedan ${backClearance.toFixed(2)} mm hasta el datum inferior del movimiento.`,
        ['rotor', 'movement'],
        'low',
        source,
        backClearance,
        'rotor',
      ))
    }
    if (topClearance < 0) {
      findings.push(finding(
        'movement-top-envelope-collision',
        'error',
        'Los puentes superan la envolvente del movimiento',
        `El plano superior rebasa ${Math.abs(topClearance).toFixed(2)} mm la altura total declarada.`,
        ['bridge', 'movement'],
        combinedReliability([movement.bridgeTopZ, movement.totalHeight]),
        source,
        topClearance,
        'bridge',
      ))
    }
    if (edgeClearance < 0) {
      findings.push(finding(
        'rotor-edge-collision',
        'error',
        'Rotor fuera de la platina',
        `El barrido radial excede la platina ${Math.abs(edgeClearance).toFixed(2)} mm.`,
        ['rotor', 'plate'],
        combinedReliability([automatic.rotorDiameter, movement.plateDiameter]),
        source,
        edgeClearance,
        'rotor',
      ))
    } else if (edgeClearance < 0.35) {
      findings.push(finding(
        'rotor-edge-clearance',
        'warning',
        'Margen radial del rotor muy justo',
        `El barrido deja ${edgeClearance.toFixed(2)} mm hasta el borde de la platina.`,
        ['rotor', 'plate'],
        'low',
        source,
        edgeClearance,
        'rotor',
      ))
    }
  }

  arbors.slice(1).forEach((arbor) => {
    const leaves = valueOf(arbor.pinionTeeth)
    if (leaves < 6) {
      findings.push(
        finding(
          `pinion-leaves-${arbor.id}`,
          'error',
          `Pinon inviable en ${arbor.name}`,
          `${leaves} hojas dejan una geometria demasiado fragil para esta plantilla.`,
          [arbor.id],
          'medium',
          DANIELS_TRAIN,
          undefined,
          arbor.id,
        ),
      )
    } else if (arbor.id === 'center' && leaves < 10) {
      findings.push(
        finding(
          'center-pinion-strength',
          'warning',
          'Pinon de centro con pocas hojas',
          'Es el pinon con mayor carga. La referencia recomienda hacerlo tan grande como sea practicable.',
          ['center', 'barrel'],
          'medium',
          DANIELS_TRAIN,
          undefined,
          'center',
        ),
      )
    }
  })

  if (movement.escapement.type !== 'swiss-lever') {
    findings.push(
      finding(
        'escapement-partial',
        'info',
        'Validacion parcial del escape',
        'La frecuencia y envolvente se calculan, pero faltan caras de impulso, bloqueo, caida y seguridad especificas de este escape.',
        ['escape', 'balance'],
        'pending',
        'Horologia, cap. 8 Escapements',
        undefined,
        'escape',
      ),
    )
  }

  findings.push(
    finding(
      'depthing-physical-check',
      'info',
      'Profundidades calculadas como nominales',
      'La propia referencia indica que la profundidad final debe confirmarse con el perfil real del diente y una prueba de rodadura sin caida ni agarrotamiento.',
      ['barrel', 'center', 'third', 'fourth', 'escape'],
      'medium',
      DANIELS_TRAIN,
    ),
  )

  return {
    pairs,
    speedsRph,
    centerToFourthRatio,
    centerToEscapeRatio,
    calculatedVph,
    targetVph,
    powerReserveHours,
    targetPowerReserveHours,
    minimumEdgeClearance,
    verticalHeadroom,
    findings,
  }
}
