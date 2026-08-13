import {
  assemblyStack,
  buildHandSegments,
  crystalInnerZAtRadius,
  dialSurfaceZ,
  type HandSegmentGeometry,
} from './geometry'
import { calculateTrain, type TrainMetrics } from './mechanics'
import {
  lowerBound,
  qualityReliability,
  upperBound,
  valueOf,
  type Dimension,
  type Finding,
  type HandSpec,
  type Reliability,
  type WatchPartId,
  type WatchProject,
} from './model'

export type ProjectStatus = 'OK' | 'JUSTO' | 'PARCIAL' | 'MAL'

export interface ProjectEvaluation {
  status: ProjectStatus
  findings: Finding[]
  minimumClearance: number | null
  totalHeight: number
  crystalClearance: number | null
  movementCaseClearance: number | null
  stackGap: number
  train: TrainMetrics | null
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

function roundedRectangleEnvelope(width: number, length: number, cornerRadius = 2.2): number {
  const halfWidth = width / 2
  const halfLength = length / 2
  const radius = Math.min(cornerRadius, halfWidth, halfLength)
  return Math.hypot(halfWidth - radius, halfLength - radius) + radius
}

function handTop(segment: HandSegmentGeometry): number {
  return Math.max(segment.start.z, segment.end.z) + segment.thickness / 2
}

function handBottom(segment: HandSegmentGeometry): number {
  return Math.min(segment.start.z, segment.end.z) - segment.thickness / 2
}

function minimumHandToDial(project: WatchProject, segments: HandSegmentGeometry[]): number {
  let minimum = Number.POSITIVE_INFINITY
  segments.forEach((segment) => {
    const radius = (segment.radialStart + segment.radialEnd) / 2
    minimum = Math.min(minimum, handBottom(segment) - dialSurfaceZ(project.dial, radius))
  })
  return minimum
}

function minimumHandToCrystal(project: WatchProject, segments: HandSegmentGeometry[], hand: HandSpec): number {
  let minimum = Number.POSITIVE_INFINITY
  segments.forEach((segment) => {
    const radius = (segment.radialStart + segment.radialEnd) / 2
    minimum = Math.min(minimum, crystalInnerZAtRadius(project, radius) - handTop(segment))
  })
  const centerCapTop =
    assemblyStack(project).dialTop +
    valueOf(hand.mountingHeight) +
    valueOf(hand.curve.base) +
    valueOf(hand.tubeHeight) +
    valueOf(hand.thickness) / 2
  minimum = Math.min(minimum, crystalInnerZAtRadius(project, 0) - centerCapTop)
  return minimum
}

function radialOverlap(a: HandSegmentGeometry, b: HandSegmentGeometry): boolean {
  return Math.min(a.radialEnd, b.radialEnd) > Math.max(a.radialStart, b.radialStart)
}

function minimumHandGap(lower: HandSegmentGeometry[], upper: HandSegmentGeometry[]): number {
  let minimum = Number.POSITIVE_INFINITY
  lower.forEach((lowerSegment) => {
    upper.forEach((upperSegment) => {
      if (!radialOverlap(lowerSegment, upperSegment)) return
      minimum = Math.min(minimum, handBottom(upperSegment) - handTop(lowerSegment))
    })
  })
  return minimum
}

function fitFinding(
  id: string,
  label: string,
  hand: HandSpec,
  required: Dimension,
  part: WatchPartId,
): Finding | null {
  const actual = valueOf(hand.holeDiameter)
  const nominal = valueOf(required)
  const tolerance = Math.max(hand.holeDiameter.plus, hand.holeDiameter.minus) + Math.max(required.plus, required.minus)
  const error = Math.abs(actual - nominal)
  if (error <= tolerance) return null
  return finding(
    `fit-${id}`,
    'error',
    `Fitting incompatible: ${label}`,
    `La aguja tiene Ø${actual.toFixed(3)} mm y el canon requiere Ø${nominal.toFixed(3)} mm.`,
    [part, 'movement'],
    required.quality === 'estimated' ? 'low' : qualityReliability(required.quality),
    required.source,
    tolerance - error,
    part,
  )
}

function statusFromFindings(findings: Finding[]): ProjectStatus {
  if (findings.some((item) => item.severity === 'error')) return 'MAL'
  if (findings.some((item) => item.severity === 'warning')) return 'JUSTO'
  if (findings.some((item) => item.reliability === 'pending' || item.reliability === 'low')) return 'PARCIAL'
  return 'OK'
}

export function evaluateProject(project: WatchProject): ProjectEvaluation {
  const findings: Finding[] = []
  const stack = assemblyStack(project)
  const runningClearance = valueOf(project.assembly.runningClearance)

  const movementRadius =
    project.movement.kind === 'mechanical'
      ? upperBound(project.movement.plateDiameter) / 2
      : roundedRectangleEnvelope(
          upperBound(project.movement.casingWidth),
          upperBound(project.movement.casingLength),
        )
  const movementCaseClearance = lowerBound(project.case.innerDiameter) / 2 - movementRadius
  if (movementCaseClearance < 0) {
    findings.push(
      finding(
        'movement-case-collision',
        'error',
        'El movimiento no cabe en la caja',
        `La envolvente supera el interior en ${Math.abs(movementCaseClearance).toFixed(2)} mm en el peor caso tolerado.`,
        ['movement', 'case'],
        project.movement.kind === 'mechanical' ? 'medium' : 'medium',
        'Envolvente canonica del movimiento y diametro interior',
        movementCaseClearance,
        'movement',
      ),
    )
  } else if (movementCaseClearance < 0.15) {
    findings.push(
      finding(
        'movement-case-tight',
        'warning',
        'Movimiento/caja muy justo',
        `Quedan ${movementCaseClearance.toFixed(2)} mm radiales en el peor caso.`,
        ['movement', 'case'],
        'medium',
        'Criterio de montaje del proyecto',
        movementCaseClearance,
        'movement',
      ),
    )
  }

  const backGap = valueOf(project.assembly.movementBackClearance)
  if (backGap < 0) {
    findings.push(
      finding(
        'movement-back-collision',
        'error',
        'Movimiento contra el fondo',
        `La penetracion calculada es ${Math.abs(backGap).toFixed(2)} mm.`,
        ['movement', 'back'],
        qualityReliability(project.assembly.movementBackClearance.quality),
        project.assembly.movementBackClearance.source,
        backGap,
        'movement',
      ),
    )
  } else if (backGap < 0.04) {
    findings.push(
      finding(
        'movement-back-tight',
        'warning',
        'Holgura al fondo muy justa',
        `Solo quedan ${backGap.toFixed(2)} mm antes del fondo.`,
        ['movement', 'back'],
        'low',
        project.assembly.movementBackClearance.source,
        backGap,
        'movement',
      ),
    )
  }

  const stackGap = stack.dialBottom - stack.movementTop
  if (stackGap < 0) {
    findings.push(
      finding(
        'movement-dial-collision',
        'error',
        'Dial dentro del movimiento',
        `El plano inferior del dial penetra ${Math.abs(stackGap).toFixed(2)} mm en el movimiento.`,
        ['dial', 'movement'],
        'medium',
        'Stack geometrico canonico',
        stackGap,
        'dial',
      ),
    )
  } else if (stackGap < valueOf(project.assembly.dialMovementGap) - 0.01) {
    findings.push(
      finding(
        'movement-dial-gap',
        'warning',
        'Separacion dial/movimiento menor que el objetivo',
        `Hay ${stackGap.toFixed(2)} mm y el objetivo editable es ${valueOf(project.assembly.dialMovementGap).toFixed(2)} mm.`,
        ['dial', 'movement'],
        'low',
        project.assembly.dialMovementGap.source,
        stackGap,
        'dial',
      ),
    )
  }

  const dialSeatClearance = lowerBound(project.case.dialSeatDiameter) / 2 - upperBound(project.dial.diameter) / 2
  if (dialSeatClearance < 0) {
    findings.push(
      finding(
        'dial-seat-collision',
        'error',
        'El dial no entra en su asiento',
        `Faltan ${Math.abs(dialSeatClearance).toFixed(2)} mm radiales.`,
        ['dial', 'case'],
        'medium',
        'Asiento de dial y diametro comercial',
        dialSeatClearance,
        'dial',
      ),
    )
  } else if (dialSeatClearance < 0.08) {
    findings.push(
      finding(
        'dial-seat-tight',
        'warning',
        'Ajuste de dial muy justo',
        `El peor caso deja ${dialSeatClearance.toFixed(2)} mm radiales.`,
        ['dial', 'case'],
        'medium',
        'Stack de tolerancias del asiento',
        dialSeatClearance,
        'dial',
      ),
    )
  }

  const crystalSeatClearance =
    lowerBound(project.case.crystalSeatDiameter) / 2 - upperBound(project.crystal.diameter) / 2
  if (crystalSeatClearance < 0) {
    findings.push(
      finding(
        'crystal-seat-collision',
        'error',
        'Cristal incompatible con el asiento',
        `El cristal excede el asiento ${Math.abs(crystalSeatClearance).toFixed(2)} mm por lado.`,
        ['crystal', 'case'],
        'medium',
        'Asiento de cristal y diametro exterior',
        crystalSeatClearance,
        'crystal',
      ),
    )
  } else if (crystalSeatClearance < 0.05) {
    findings.push(
      finding(
        'crystal-seat-tight',
        'warning',
        'Ajuste de cristal sin margen suficiente',
        `Quedan ${crystalSeatClearance.toFixed(2)} mm por lado antes de considerar junta o interferencia de prensado.`,
        ['crystal', 'case'],
        'low',
        'Asiento parametrico; falta especificacion de junta',
        crystalSeatClearance,
        'crystal',
      ),
    )
  }

  const shellRadius = (lowerBound(project.case.outerDiameter) - upperBound(project.case.innerDiameter)) / 2
  const minimumWall = upperBound(project.case.wallThickness)
  if (shellRadius < minimumWall) {
    findings.push(
      finding(
        'case-wall',
        'error',
        'Pared de caja menor que la definida',
        `La geometria deja ${shellRadius.toFixed(2)} mm y el minimo solicitado es ${minimumWall.toFixed(2)} mm.`,
        ['case'],
        'medium',
        project.case.wallThickness.source,
        shellRadius - minimumWall,
        'case',
      ),
    )
  }

  const lugAttachmentMargin =
    lowerBound(project.case.outerDiameter) / 2 -
    (upperBound(project.case.lugSpacing) / 2 + upperBound(project.case.lugWidth))
  if (lugAttachmentMargin < 0) {
    findings.push(
      finding(
        'case-lug-attachment',
        'error',
        'Las asas pierden apoyo sobre la carrura',
        `La separacion y el ancho de asas exceden la caja ${Math.abs(lugAttachmentMargin).toFixed(2)} mm por lado.`,
        ['case'],
        'medium',
        'Envolvente parametrica de caja y asas',
        lugAttachmentMargin,
        'case',
      ),
    )
  }

  const tubeCrownMargin = lowerBound(project.case.crownDiameter) - upperBound(project.case.crownTubeDiameter)
  if (tubeCrownMargin <= 0) {
    findings.push(
      finding(
        'crown-tube-diameter',
        'error',
        'La corona no cubre el tubo',
        `El tubo supera el diametro de corona en ${Math.abs(tubeCrownMargin).toFixed(2)} mm.`,
        ['crown', 'case'],
        'medium',
        'Envolvente corona/tubo',
        tubeCrownMargin,
        'crown',
      ),
    )
  }

  const stemOffset = stack.stemAxisAbsolute - valueOf(project.case.stemAxisZ)
  const stemTolerance = project.case.stemAxisZ.plus + project.movement.stemAxisZ.plus
  if (Math.abs(stemOffset) > Math.max(0.08, stemTolerance)) {
    findings.push(
      finding(
        'stem-axis',
        'error',
        'Eje de tija desalineado',
        `Movimiento y tubo difieren ${Math.abs(stemOffset).toFixed(2)} mm en altura.`,
        ['stem', 'movement', 'case', 'crown'],
        'medium',
        'Cadena de cotas fondo-movimiento-tija-tubo',
        -Math.abs(stemOffset),
        'movement',
      ),
    )
  }

  if (project.dial.recess.enabled) {
    const minimumFloor = lowerBound(project.dial.thickness) - upperBound(project.dial.recess.depth)
    const radialLimit = lowerBound(project.dial.diameter) / 2 - upperBound(project.dial.centerHole) / 2
    if (minimumFloor <= 0) {
      findings.push(
        finding(
          'dial-recess-through',
          'error',
          'El hundimiento atraviesa el dial',
          `El peor caso deja ${minimumFloor.toFixed(2)} mm de material.`,
          ['dial'],
          'high',
          'Geometria sustractiva del dial',
          minimumFloor,
          'dial',
        ),
      )
    } else if (minimumFloor < 0.12) {
      findings.push(
        finding(
          'dial-recess-floor',
          'warning',
          'Suelo del hundimiento muy fino',
          `Quedan ${minimumFloor.toFixed(2)} mm antes de considerar proceso, material y deformacion.`,
          ['dial'],
          'medium',
          'Regla de fabricacion editable; validar segun proceso',
          minimumFloor,
          'dial',
        ),
      )
    }
    if (upperBound(project.dial.recess.radius) > radialLimit) {
      findings.push(
        finding(
          'dial-recess-radius',
          'error',
          'El hundimiento invade el borde funcional',
          `El radio supera la zona util en ${(upperBound(project.dial.recess.radius) - radialLimit).toFixed(2)} mm.`,
          ['dial'],
          'high',
          'Perfil canonico del dial',
          radialLimit - upperBound(project.dial.recess.radius),
          'dial',
        ),
      )
    }
  }

  const segments = {
    hour: buildHandSegments(project, 'hour'),
    minute: buildHandSegments(project, 'minute'),
    second: buildHandSegments(project, 'second'),
  }
  let crystalClearance = Number.POSITIVE_INFINITY
  ;(['hour', 'minute', 'second'] as const).forEach((key) => {
    const hand = project.hands[key]
    if (!hand.enabled) return
    const part = `${key}Hand` as WatchPartId
    const dialGap = minimumHandToDial(project, segments[key])
    if (dialGap < 0) {
      findings.push(
        finding(
          `hand-dial-${key}`,
          'error',
          `${key === 'hour' ? 'Horaria' : key === 'minute' ? 'Minutera' : 'Segundero'} contra el dial`,
          `La pala penetra ${Math.abs(dialGap).toFixed(2)} mm en el perfil real del dial.`,
          [part, 'dial'],
          'medium',
          'Barrido segmentado contra perfil de dial',
          dialGap,
          part,
        ),
      )
    } else if (dialGap < runningClearance) {
      findings.push(
        finding(
          `hand-dial-tight-${key}`,
          'warning',
          `Margen al dial justo en ${key}`,
          `Quedan ${dialGap.toFixed(2)} mm y el margen dinamico es ${runningClearance.toFixed(2)} mm.`,
          [part, 'dial'],
          'low',
          'Barrido segmentado contra perfil de dial',
          dialGap,
          part,
        ),
      )
    }
    const clearance = minimumHandToCrystal(project, segments[key], hand)
    crystalClearance = Math.min(crystalClearance, clearance)
    if (clearance < 0) {
      findings.push(
        finding(
          `hand-crystal-${key}`,
          'error',
          `${key === 'hour' ? 'Horaria' : key === 'minute' ? 'Minutera' : 'Segundero'} contra el cristal`,
          `Pala, tubo o capuchon penetran ${Math.abs(clearance).toFixed(2)} mm en el perfil interior.`,
          [part, 'crystal'],
          'medium',
          'Perfil radial de cristal y geometria completa de aguja',
          clearance,
          part,
        ),
      )
    } else if (clearance < 0.3) {
      findings.push(
        finding(
          `hand-crystal-tight-${key}`,
          'warning',
          `Margen al cristal muy justo en ${key}`,
          `El minimo es ${clearance.toFixed(2)} mm incluyendo tubo y curvatura.`,
          [part, 'crystal'],
          'medium',
          'Perfil radial de cristal y geometria completa de aguja',
          clearance,
          part,
        ),
      )
    }
  })

  const handPairs: Array<{
    lower: 'hour' | 'minute'
    upper: 'minute' | 'second'
    lowerPart: WatchPartId
    upperPart: WatchPartId
  }> = [
    { lower: 'hour', upper: 'minute', lowerPart: 'hourHand', upperPart: 'minuteHand' },
    { lower: 'minute', upper: 'second', lowerPart: 'minuteHand', upperPart: 'secondHand' },
  ]
  handPairs.forEach((pair) => {
    if (!project.hands[pair.lower].enabled || !project.hands[pair.upper].enabled) return
    const gap = minimumHandGap(segments[pair.lower], segments[pair.upper])
    if (gap < 0) {
      findings.push(
        finding(
          `hand-hand-${pair.lower}-${pair.upper}`,
          'error',
          'Las agujas comparten volumen de barrido',
          `La penetracion vertical maxima es ${Math.abs(gap).toFixed(2)} mm.`,
          [pair.lowerPart, pair.upperPart],
          'medium',
          'Volumen barrido segmentado de 360 grados',
          gap,
          pair.upperPart,
        ),
      )
    } else if (gap < runningClearance) {
      findings.push(
        finding(
          `hand-hand-tight-${pair.lower}-${pair.upper}`,
          'warning',
          'Separacion dinamica entre agujas muy justa',
          `El margen minimo es ${gap.toFixed(2)} mm.`,
          [pair.lowerPart, pair.upperPart],
          'low',
          'Volumen barrido segmentado de 360 grados',
          gap,
          pair.upperPart,
        ),
      )
    }
  })

  project.dial.reliefs.forEach((relief) => {
    const reliefRadius = Math.hypot(valueOf(relief.x), valueOf(relief.y))
    const halfSpan = Math.hypot(valueOf(relief.width), valueOf(relief.length)) / 2
    const reliefTop = dialSurfaceZ(project.dial, reliefRadius) + valueOf(relief.height)
    ;(['hour', 'minute', 'second'] as const).forEach((key) => {
      if (!project.hands[key].enabled) return
      const collision = segments[key].find((segment) => {
        const radialHit =
          segment.radialEnd >= reliefRadius - halfSpan && segment.radialStart <= reliefRadius + halfSpan
        return radialHit && handBottom(segment) < reliefTop + runningClearance
      })
      if (!collision) return
      const part = `${key}Hand` as WatchPartId
      const clearance = handBottom(collision) - reliefTop
      findings.push(
        finding(
          `relief-sweep-${relief.id}-${key}`,
          clearance < 0 ? 'error' : 'warning',
          `${relief.name} invade el barrido de ${key}`,
          `El margen vertical durante una vuelta completa es ${clearance.toFixed(2)} mm.`,
          ['dial', part],
          'medium',
          'Volumen barrido de aguja contra relieve',
          clearance,
          'dial',
        ),
      )
    })
  })

  if (project.movement.kind === 'quartz') {
    ;[
      fitFinding('hour', 'horaria', project.hands.hour, project.movement.handFit.hour, 'hourHand'),
      fitFinding('minute', 'minutera', project.hands.minute, project.movement.handFit.minute, 'minuteHand'),
      project.hands.second.enabled
        ? fitFinding('second', 'segundero', project.hands.second, project.movement.handFit.second, 'secondHand')
        : null,
    ].forEach((item) => {
      if (item) findings.push(item)
    })
  } else {
    ;[
      fitFinding('hour', 'horaria', project.hands.hour, project.movement.motionWorks.hourFit, 'hourHand'),
      fitFinding('minute', 'minutera', project.hands.minute, project.movement.motionWorks.minuteFit, 'minuteHand'),
      project.hands.second.enabled
        ? fitFinding('second', 'segundero', project.hands.second, project.movement.motionWorks.secondFit, 'secondHand')
        : null,
    ].forEach((item) => {
      if (item) findings.push(item)
    })
  }

  const criticalEstimated = [
    project.case.usableInteriorHeight,
    project.case.dialSeatDiameter,
    project.case.crystalSeatDiameter,
    project.crystal.thickness,
  ].filter((item) => item.quality === 'estimated' || item.quality === 'unknown')
  if (criticalEstimated.length > 0) {
    findings.push(
      finding(
        'partial-critical-data',
        'info',
        'Validacion parcial de caja y cristal',
        `${criticalEstimated.length} cotas criticas siguen estimadas o desconocidas. Los margenes se muestran como hipotesis, no como garantia de fabricacion.`,
        ['case', 'crystal'],
        'pending',
        'Trazabilidad dimensional del proyecto',
      ),
    )
  }

  const train = project.movement.kind === 'mechanical' ? calculateTrain(project.movement) : null
  if (train) findings.push(...train.findings)
  const clearances = findings
    .map((item) => item.clearance)
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
  const minimumClearance = clearances.length > 0 ? Math.min(...clearances) : null
  return {
    status: statusFromFindings(findings),
    findings,
    minimumClearance,
    totalHeight: Math.max(stack.caseTop, stack.crystalTop),
    crystalClearance: Number.isFinite(crystalClearance) ? crystalClearance : null,
    movementCaseClearance,
    stackGap,
    train,
  }
}
