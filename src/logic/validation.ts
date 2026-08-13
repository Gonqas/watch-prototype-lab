import { MOVEMENTS, STEMS, TECHNICAL_DIALS } from '../data/catalog'
import { buildCollisionModel } from './collisionEngine'
import {
  combineQuality,
  reliefAngleDeg,
  reliefRadius,
  roundMm,
} from './geometryKernel'
import type {
  ClearanceZone,
  DataQuality,
  FindingSeverity,
  Opportunity,
  Reliability,
  ValidationFinding,
  ValidationMetrics,
  ValidationResult,
  WatchDesign,
} from '../types'

export { handCurveHeightAt, roundMm } from './geometryKernel'

export const qualityToReliability = (quality: DataQuality): Reliability => {
  if (quality === 'official_complete' || quality === 'measured_by_user') return 'Alta'
  if (quality === 'official_partial' || quality === 'supplier_partial') return 'Media'
  if (quality === 'estimated' || quality === 'visual_only') return 'Baja'
  return 'Pendiente de medir'
}

const finding = (
  severity: FindingSeverity,
  id: string,
  title: string,
  message: string,
  pieceIds: string[],
  dataQuality: DataQuality,
  recoverable = false,
): ValidationFinding => ({
  id,
  severity,
  title,
  message,
  pieceIds,
  dataQuality,
  reliability: qualityToReliability(dataQuality),
  recoverable,
})

const severityFromCrystalClearance = (clearance: number): FindingSeverity => {
  if (clearance < 0.3) return 'bad'
  if (clearance < 0.45) return 'experimental'
  if (clearance < 0.7) return 'warning'
  return 'ok'
}

const statusFromFindings = (findings: ValidationFinding[]) => {
  if (findings.some((item) => item.severity === 'bad')) return 'MAL' as const
  if (findings.some((item) => item.severity === 'experimental')) return 'EXPERIMENTAL' as const
  if (findings.some((item) => item.severity === 'warning')) return 'JUSTO' as const
  return 'OK' as const
}

const addOpportunity = (
  opportunities: Opportunity[],
  id: string,
  title: string,
  zone: string,
  limiter: string,
  margin: number | null,
  suggestion: string,
  basis: DataQuality,
) => {
  opportunities.push({
    id,
    title,
    zone,
    limiter,
    margin: margin === null ? null : roundMm(margin),
    suggestion,
    basis,
    reliability: qualityToReliability(basis),
  })
}

export const evaluateDesign = (design: WatchDesign): ValidationResult => {
  const movement = MOVEMENTS[design.movementId]
  const technicalDial = TECHNICAL_DIALS[design.dial.technicalPresetId]
  const stem = STEMS[design.stem.selectedStemId]
  const findings: ValidationFinding[] = []
  const opportunities: Opportunity[] = []
  const conflictIds = new Set<string>()

  const collision = buildCollisionModel(design)
  const { crystalInnerTop } = collision.stack
  const maxHandTop = collision.maxHandTop
  const crystalClearance = collision.crystalClearance
  const movementCaseClearance = collision.movementCaseClearance
  const dialCaseClearance = collision.dialCaseClearance
  const handCaseClearance = collision.handCaseClearance
  const crystalRadialClearance = collision.crystalRadialClearance
  const dialFootCoverageClearance = collision.dialFootCoverageClearance
  const dialRadius = design.dial.commercialDiameter / 2

  if (movementCaseClearance < 0.15) {
    conflictIds.add('movement')
    conflictIds.add('case')
    findings.push(
      finding(
        'bad',
        'movement-case-clearance',
        'Movimiento contra caja',
        `El margen movimiento/caja es ${roundMm(movementCaseClearance)} mm. El mínimo práctico para ${movement.calibre} es 0,15 mm.`,
        ['movement', 'case'],
        combineQuality(movement.dataQuality, design.case.dataQuality),
      ),
    )
  } else if (movementCaseClearance < 0.3) {
    findings.push(
      finding(
        'warning',
        'movement-case-tight',
        'Movimiento muy justo',
        `El margen movimiento/caja es ${roundMm(movementCaseClearance)} mm. Entra, pero queda dentro de zona muy justa.`,
        ['movement', 'case'],
        combineQuality(movement.dataQuality, design.case.dataQuality),
      ),
    )
  }

  if (dialCaseClearance < 0) {
    conflictIds.add('dial')
    conflictIds.add('case')
    findings.push(
      finding(
        'bad',
        'dial-case-overlap',
        'Dial demasiado grande',
        `El dial supera el asiento por ${roundMm(Math.abs(dialCaseClearance))} mm de radio.`,
        ['dial', 'case'],
        combineQuality(design.dial.dataQuality, design.case.dataQuality),
        true,
      ),
    )
  } else if (dialCaseClearance < 0.35) {
    findings.push(
      finding(
        'warning',
        'dial-case-tight',
        'Dial justo en el asiento',
        `Quedan ${roundMm(dialCaseClearance)} mm por lado entre dial y asiento. Es viable, pero con poco margen.`,
        ['dial', 'case'],
        combineQuality(design.dial.dataQuality, design.case.dataQuality),
      ),
    )
  }

  if (dialFootCoverageClearance < 0) {
    conflictIds.add('dial')
    findings.push(
      finding(
        'bad',
        'dial-foot-coverage',
        'Dial demasiado pequeño para pies técnicos',
        `El diámetro comercial deja ${roundMm(dialFootCoverageClearance)} mm frente al mínimo técnico aproximado ${technicalDial.minimumCommercialDiameterForFeet} mm para cubrir DH1/DH2 con margen. Puede verse en pantalla, pero no funcionaría como dial ${movement.calibre} sin rediseñar pies o soporte.`,
        ['dial', 'movement'],
        combineQuality(design.dial.dataQuality, technicalDial.dataQuality),
        true,
      ),
    )
  } else if (dialFootCoverageClearance < 0.45) {
    findings.push(
      finding(
        'experimental',
        'dial-foot-coverage-tight',
        'Dial mínimo alrededor de DH1/DH2',
        `El dial solo deja ${roundMm(dialFootCoverageClearance)} mm de margen técnico alrededor de los pies DH1/DH2. Zona experimental: valida con plano propio o medición real.`,
        ['dial', 'movement'],
        combineQuality(design.dial.dataQuality, technicalDial.dataQuality),
        true,
      ),
    )
  }

  if (handCaseClearance < 0) {
    conflictIds.add('case')
    collision.activeHands.forEach(({ id }) => conflictIds.add(`${id}Hand`))
    findings.push(
      finding(
        'bad',
        'hand-case-radial-clearance',
        'Barrido de agujas fuera de caja',
        `La aguja más larga barre radio ${roundMm(collision.handSweepRadius)} mm y deja ${roundMm(handCaseClearance)} mm frente al interior de caja usando el margen oficial mínimo ${movement.clearances.handToCaseOfficialMin} mm. Acorta agujas, aumenta caja o reduce margen experimentalmente.`,
        ['case', 'hourHand', 'minuteHand', 'secondHand'],
        combineQuality(design.case.dataQuality, design.hands.dataQuality, movement.dataQuality),
        true,
      ),
    )
  } else if (handCaseClearance < 0.2) {
    findings.push(
      finding(
        'warning',
        'hand-case-radial-tight',
        'Barrido radial muy justo',
        `Quedan ${roundMm(handCaseClearance)} mm de margen radial después de reservar el clearance oficial mínimo. Es viable, pero sensible a longitud real de aguja y caja.`,
        ['case', 'minuteHand'],
        combineQuality(design.case.dataQuality, design.hands.dataQuality, movement.dataQuality),
      ),
    )
  }

  if (crystalRadialClearance < 0) {
    conflictIds.add('crystal')
    collision.activeHands.forEach(({ id }) => conflictIds.add(`${id}Hand`))
    findings.push(
      finding(
        'bad',
        'hand-crystal-radial-clearance',
        'Barrido de agujas fuera del cristal',
        `El cristal deja ${roundMm(crystalRadialClearance)} mm de margen radial frente a la aguja más larga. Aunque la altura sea correcta, el barrido no queda protegido bajo cristal.`,
        ['crystal', 'hourHand', 'minuteHand', 'secondHand'],
        combineQuality(design.crystal.dataQuality, design.hands.dataQuality),
        true,
      ),
    )
  } else if (crystalRadialClearance < 0.2) {
    findings.push(
      finding(
        'warning',
        'hand-crystal-radial-tight',
        'Cristal justo en barrido',
        `El cristal deja ${roundMm(crystalRadialClearance)} mm de margen radial útil. Necesita medir diámetro y junta reales.`,
        ['crystal', 'minuteHand'],
        combineQuality(design.crystal.dataQuality, design.hands.dataQuality),
      ),
    )
  }

  const holeError = Math.abs(design.dial.centerHole - technicalDial.centerHole)
  if (holeError > technicalDial.centerHoleTolerance) {
    conflictIds.add('dial')
    findings.push(
      finding(
        'bad',
        'dial-center-hole',
        'Agujero central incompatible',
        `El agujero central es ${roundMm(design.dial.centerHole)} mm. El preset técnico Miyota 2035 pide ${technicalDial.centerHole} +/- ${technicalDial.centerHoleTolerance} mm.`,
        ['dial', 'movement'],
        combineQuality(design.dial.dataQuality, technicalDial.dataQuality),
        true,
      ),
    )
  }

  const thicknessError = Math.abs(design.dial.thickness - technicalDial.standardThickness)
  if (thicknessError > technicalDial.thicknessTolerance) {
    findings.push(
      finding(
        'warning',
        'dial-thickness',
        'Grosor de dial fuera de estándar',
        `El dial mide ${roundMm(design.dial.thickness)} mm. No bloquea, pero modifica la pila vertical y debe comprobarse con piezas reales.`,
        ['dial'],
        combineQuality(design.dial.dataQuality, technicalDial.dataQuality),
      ),
    )
  }

  if (design.dial.sunkenCenter) {
    const remainingFloor = design.dial.thickness - design.dial.sunkenDepth
    const outerLandWidth = dialRadius - design.dial.sunkenRadius

    if (collision.dialFloorClearance < 0) {
      conflictIds.add('dial')
      findings.push(
        finding(
          'bad',
          'dial-sunken-floor-breakthrough',
          'Hundimiento imposible en dial base',
          `El hundimiento deja ${roundMm(remainingFloor)} mm de fondo útil. Con un dial de ${roundMm(design.dial.thickness)} mm, esta profundidad atraviesa la placa base salvo que diseñes una pieza multicapa o un spacer específico.`,
          ['dial', 'movement'],
          combineQuality(design.dial.dataQuality, movement.dataQuality),
          true,
        ),
      )
    } else if (collision.dialFloorClearance < 0.1) {
      findings.push(
        finding(
          'experimental',
          'dial-sunken-floor-thin',
          'Fondo de hundimiento muy fino',
          `Quedan ${roundMm(remainingFloor)} mm de material bajo el centro hundido. Es una zona experimental y debería validarse con impresión 3D o mecanizado real.`,
          ['dial'],
          design.dial.dataQuality,
          true,
        ),
      )
    }

    if (collision.dialOuterLandClearance < 0) {
      conflictIds.add('dial')
      findings.push(
        finding(
          'bad',
          'dial-sunken-radius-overrun',
          'Hundimiento invade el anillo de apoyo',
          `El radio hundido deja ${roundMm(outerLandWidth)} mm de anillo exterior. Por debajo de 0,80 mm no hay apoyo razonable para asiento, índices o rigidez del dial.`,
          ['dial', 'case'],
          combineQuality(design.dial.dataQuality, design.case.dataQuality),
          true,
        ),
      )
    } else if (outerLandWidth < 1.6) {
      findings.push(
        finding(
          'experimental',
          'dial-sunken-radius-thin-land',
          'Anillo exterior demasiado estrecho',
          `El centro hundido deja solo ${roundMm(outerLandWidth)} mm de anillo exterior. Puede ser interesante visualmente, pero queda en zona gris estructural.`,
          ['dial'],
          design.dial.dataQuality,
          true,
        ),
      )
    }
  }

  collision.activeHands.forEach(({ id, label, hand }) => {
    const required = movement.handFitting[id]
    const tolerance = movement.handFittingTolerance[id]
    const lower = tolerance.nominal - tolerance.minus
    const upper = tolerance.nominal + tolerance.plus
    if (hand.holeSize < lower || hand.holeSize > upper) {
      conflictIds.add(`${id}Hand`)
      findings.push(
        finding(
          id === 'second' && roundMm(hand.holeSize, 2) === 0.2 ? 'experimental' : 'bad',
          `${id}-hand-fitting`,
          `Fitting de ${label} no confirmado`,
          `La ${label} tiene perforacion ${roundMm(hand.holeSize, 3)} mm. El ${movement.calibre} requiere ${required} mm con rango oficial ${roundMm(lower, 3)}-${roundMm(upper, 3)} mm. Se muestra como referencia visual, no como compatible.`,
          [`${id}Hand`, 'movement'],
          combineQuality(hand.dataQuality, tolerance.dataQuality),
          true,
        ),
      )
    }

    const loadScore = hand.length * hand.width * Math.max(hand.thickness, 0.04)
    const loadLimit = id === 'second' ? 0.72 : id === 'minute' ? 1.95 : 1.75
    if (loadScore > loadLimit) {
      findings.push(
        finding(
          'warning',
          `${id}-hand-load`,
          `Carga aproximada alta en ${label}`,
          `La ${label} es larga/ancha/gruesa para el balance weight de ${movement.calibre}. Regla v0.1 aproximada, pendiente de peso real.`,
          [`${id}Hand`],
          combineQuality(hand.dataQuality, movement.dataQuality),
        ),
      )
    }
  })

  collision.handGapChecks.forEach(({ lower, upper, gap }) => {
    if (gap < 0.04) {
      conflictIds.add(`${lower.id}Hand`)
      conflictIds.add(`${upper.id}Hand`)
      findings.push(
        finding(
          gap < 0 ? 'bad' : 'experimental',
          `${lower.id}-${upper.id}-vertical-gap`,
          'Agujas muy próximas',
          `Entre ${lower.label} y ${upper.label} quedan ${roundMm(gap)} mm. La geometría visual puede tocar durante el giro.`,
          [`${lower.id}Hand`, `${upper.id}Hand`],
          combineQuality(lower.hand.dataQuality, upper.hand.dataQuality),
          true,
        ),
      )
    }
  })

  const crystalSeverity = severityFromCrystalClearance(crystalClearance)
  if (crystalSeverity !== 'ok') {
    if (crystalSeverity === 'bad') {
      conflictIds.add('crystal')
      collision.activeHands.forEach(({ id }) => conflictIds.add(`${id}Hand`))
    }

    findings.push(
      finding(
        crystalSeverity,
        'hand-crystal-clearance',
        crystalSeverity === 'bad' ? 'Agujas contra cristal' : 'Margen al cristal justo',
        `El margen al cristal es ${roundMm(crystalClearance)} mm. Rangos: <0,30 mal; 0,30-0,45 muy justo; 0,45-0,70 viable; >0,70 cómodo.`,
        ['crystal', 'hourHand', 'minuteHand', 'secondHand'],
        combineQuality(design.crystal.dataQuality, design.hands.dataQuality),
        true,
      ),
    )
  }

  const handDialMinGap = collision.handDialMinGap
  if (handDialMinGap < 0.05) {
    conflictIds.add('dial')
    collision.activeHands.forEach(({ id }) => conflictIds.add(`${id}Hand`))
    findings.push(
      finding(
        handDialMinGap < 0 ? 'bad' : 'experimental',
        'hands-dial-clearance',
        'Agujas contra dial',
        `La ${collision.handDialCritical.hand.label} queda a ${roundMm(handDialMinGap)} mm del dial en radio ${roundMm(collision.handDialCritical.radius)} mm. La edición queda permitida, pero la geometría no es funcional sin subir agujas o rebajar esa zona.`,
        ['dial', 'hourHand', 'minuteHand', 'secondHand'],
        combineQuality(design.dial.dataQuality, design.hands.dataQuality),
        true,
      ),
    )
  } else if (handDialMinGap < 0.18) {
    findings.push(
      finding(
        'warning',
        'hands-dial-tight-clearance',
        'Agujas muy cerca del dial',
        `La ${collision.handDialCritical.hand.label} queda a ${roundMm(handDialMinGap)} mm del dial en radio ${roundMm(collision.handDialCritical.radius)} mm. No es colisión dura, pero es demasiado justo para darlo por seguro.`,
        ['dial', collision.handDialCritical.hand.partId],
        combineQuality(design.dial.dataQuality, collision.handDialCritical.hand.hand.dataQuality),
        true,
      ),
    )
  }

  collision.reliefSweepCollisions.forEach((item) => {
    const relief = design.dial.reliefs.find((candidate) => candidate.id === item.reliefId)
    if (!relief) return

    conflictIds.add(`relief:${relief.id}`)
    conflictIds.add(item.touchingHand.partId)
    findings.push(
      finding(
        'bad',
        `relief-${relief.id}-sweep`,
        'Relieve dentro del barrido',
        `La ${item.touchingHand.label} invade "${item.reliefLabel}" con margen ${roundMm(item.clearance)} mm. La pieza queda editable para recuperar espacio manualmente.`,
        [`relief:${relief.id}`, item.touchingHand.partId, 'dial'],
        combineQuality(relief.dataQuality, item.touchingHand.hand.dataQuality),
        true,
      ),
    )
  })

  design.dial.reliefs.forEach((relief) => {
    const radialEnd = reliefRadius(relief) + Math.max(0.1, relief.radius, relief.width / 2, relief.length / 2)
    const boundaryClearance = dialRadius - radialEnd
    if (boundaryClearance >= 0) return

    conflictIds.add(`relief:${relief.id}`)
    conflictIds.add('dial')
    findings.push(
      finding(
        'bad',
        `relief-${relief.id}-outside-dial`,
        'Relieve fuera del dial',
        `"${relief.label}" se sale ${roundMm(Math.abs(boundaryClearance))} mm del diámetro comercial del dial. Puede seguir ahí como exploración visual, pero no forma parte de una pieza fabricable.`,
        [`relief:${relief.id}`, 'dial'],
        combineQuality(relief.dataQuality, design.dial.dataQuality),
        true,
      ),
    )
  })

  const stemRequiredLength = design.case.crownDistanceFromCenter + design.case.crownTubeDiameter * 0.35
  const availableStemLength = design.stem.customLength || stem.drawnLength
  if (design.stem.crownInstalled && design.case.crownThread !== stem.thread) {
    conflictIds.add('stem')
    conflictIds.add('crown')
    findings.push(
      finding(
        'bad',
        'stem-thread',
        'Rosca tija/corona incompatible',
        `La corona usa ${design.case.crownThread} y la tija seleccionada usa ${stem.thread}.`,
        ['stem', 'crown'],
        combineQuality(design.case.dataQuality, stem.dataQuality),
        true,
      ),
    )
  }

  if (availableStemLength < stemRequiredLength) {
    conflictIds.add('stem')
    findings.push(
      finding(
        'experimental',
        'stem-length',
        'Longitud de tija justa',
        `La tija dibujada mide ${roundMm(availableStemLength, 3)} mm y la distancia centro-corona estimada pide ${roundMm(stemRequiredLength)} mm. Verificar con medición real.`,
        ['stem', 'crown', 'case'],
        combineQuality(design.case.dataQuality, stem.dataQuality),
        true,
      ),
    )
  }

  if (design.case.dataQuality === 'supplier_partial' || design.crystal.dataQuality === 'supplier_partial') {
    findings.push(
      finding(
        'experimental',
        'partial-case-data',
        'Validación parcial',
        'Preset con datos parciales. Para validación precisa, mide altura interior, cristal, fondo y holder.',
        ['case', 'crystal', 'holder'],
        combineQuality(design.case.dataQuality, design.crystal.dataQuality),
      ),
    )
  }

  const reliefConflict = findings.find((item) => item.id.includes('relief-') && item.severity === 'bad')
  if (reliefConflict) {
    addOpportunity(
      opportunities,
      'recover-relief-conflict',
      'Conflicto recuperable',
      'Barrido de agujas',
      'Relieve decorativo',
      0.25,
      'Escenario manual: reducir altura del relieve, elevar la aguja limitante o probar puente en esa aguja abre margen.',
      combineQuality(design.dial.dataQuality, design.hands.dataQuality),
    )
  }

  const dialStructureConflict = findings.find((item) => item.id === 'dial-sunken-floor-breakthrough' || item.id === 'dial-sunken-radius-overrun')
  if (dialStructureConflict) {
    addOpportunity(
      opportunities,
      'recover-sunken-dial-structure',
      'Dial hundido recuperable',
      'Centro/anillo del dial',
      'Grosor y radio de hundimiento',
      null,
      'Puedes mantener la idea visual si reduces profundidad/radio, aumentas grosor del dial o lo planteas como pieza multicapa impresa en 3D.',
      design.dial.dataQuality,
    )
  }

  if (findings.some((item) => item.id === 'dial-foot-coverage')) {
    addOpportunity(
      opportunities,
      'recover-dial-foot-coverage',
      'Recuperar soporte técnico del dial',
      'Pies DH1/DH2',
      'Diámetro comercial del dial',
      dialFootCoverageClearance,
      'Aumenta diámetro de dial, crea una subpieza/aro técnico oculto o mide una solución de pies alternativa antes de considerarlo funcional.',
      combineQuality(design.dial.dataQuality, technicalDial.dataQuality),
    )
  }

  if (findings.some((item) => item.id === 'hand-case-radial-clearance' || item.id === 'hand-crystal-radial-clearance')) {
    addOpportunity(
      opportunities,
      'recover-hand-radial-sweep',
      'Recuperar barrido radial',
      'Agujas/caja/cristal',
      'Longitud de agujas',
      Math.min(handCaseClearance, crystalRadialClearance),
      'Acortar minutera/segundero, ampliar diámetro interior o cambiar cristal/caja abre margen sin tocar la idea general.',
      combineQuality(design.case.dataQuality, design.crystal.dataQuality, design.hands.dataQuality),
    )
  }

  if (crystalClearance > 0.7) {
    addOpportunity(
      opportunities,
      'free-space-above-dial',
      'Volumen libre sobre el dial',
      'Bajo cristal',
      'Cristal',
      crystalClearance - 0.45,
      `Hay ${roundMm(crystalClearance)} mm al cristal. Zona apta para ensayar relieves bajos, agujas curvas o centro hundido más agresivo.`,
      combineQuality(design.crystal.dataQuality, design.hands.dataQuality),
    )
  } else if (crystalClearance >= 0.45) {
    addOpportunity(
      opportunities,
      'tight-but-creative',
      'Zona viable con poco margen',
      'Bajo cristal',
      'Cristal',
      crystalClearance,
      'Funciona como zona creativa justa. Cualquier relieve o curva debe vigilar margen vertical.',
      combineQuality(design.crystal.dataQuality, design.hands.dataQuality),
    )
  } else {
    addOpportunity(
      opportunities,
      'box-crystal-option',
      'Cristal box podría resolverlo',
      'Bajo cristal',
      'Cristal plano/desconocido',
      crystalClearance,
      'Escenario manual: más altura interior útil o cristal box abriría margen vertical.',
      combineQuality(design.crystal.dataQuality, design.hands.dataQuality),
    )
  }

  if (design.hands.count === 3 && design.hands.secondsEnabled && crystalClearance < 0.7) {
    addOpportunity(
      opportunities,
      'two-hand-variant',
      'Con 2 agujas se libera margen',
      'Centro de agujas',
      'Segundero',
      design.hands.second.thickness + design.hands.second.heightOverDial,
      'Escenario manual: un montaje de 2 agujas libera pila vertical para estudiar dial hundido o relieves.',
      combineQuality(design.hands.second.dataQuality, movement.dataQuality),
    )
  }

  const extraSink = collision.extraSink
  if (extraSink > 0.08) {
    addOpportunity(
      opportunities,
      'sunken-center-extra',
      'Centro hundible adicional',
      'Centro del dial',
      'Horaria',
      extraSink,
      `Podrías hundir el centro ${roundMm(extraSink)} mm más si mantienes el stack actual de agujas.`,
      combineQuality(design.dial.dataQuality, design.hands.dataQuality),
    )
  }

  const outerReliefRoom = collision.outerReliefRoom
  if (outerReliefRoom > 0.45) {
    addOpportunity(
      opportunities,
      'outer-ring-reliefs',
      'Relieves bajos en anillo exterior',
      'Anillo exterior',
      'Cristal',
      outerReliefRoom,
      `Hay ${roundMm(outerReliefRoom)} mm libres sobre el anillo exterior para ensayar índices o textura baja.`,
      combineQuality(design.crystal.dataQuality, design.dial.dataQuality),
    )
  }

  if (design.case.dataQuality !== 'official_complete' || design.crystal.dataQuality !== 'official_complete') {
    addOpportunity(
      opportunities,
      'measurement-risk',
      'Riesgo por dato incompleto',
      'Caja/cristal',
      'Datos internos',
      null,
      'El diseño es visualmente posible, pero faltan datos reales de altura bajo cristal, fondo y holder.',
      combineQuality(design.case.dataQuality, design.crystal.dataQuality),
    )
  }

  if (design.movementId !== 'miyota_2036' && (crystalClearance < 0.45 || handDialMinGap < 0.12)) {
    addOpportunity(
      opportunities,
      'future-miyota-2036',
      'Probar Miyota 2036',
      'Stack de agujas',
      `Altura de cañones ${movement.calibre}`,
      null,
      'El Miyota 2036 aporta un perfil de cañones alto y podría abrir margen para diales con profundidad o relieves.',
      'official_partial',
    )
  }

  const structuralCenterCollision = collision.dialFloorClearance < 0
  const structuralOuterCollision = collision.dialOuterLandClearance < 0
  const zoneSunkenRadius = Math.min(design.dial.sunkenRadius, dialRadius)
  const outerStatus = structuralOuterCollision
    ? 'collision'
    : outerReliefRoom > 0.7
      ? 'safe'
      : outerReliefRoom > 0.4
        ? 'opportunity'
        : 'tight'
  const sectorCount = 12
  const outerSectorZones: ClearanceZone[] = Array.from({ length: sectorCount }).map((_, index) => {
    const angleStartDeg = index * (360 / sectorCount)
    const angleEndDeg = (index + 1) * (360 / sectorCount)
    const reliefInSector = design.dial.reliefs.find((relief) => {
      const angle = reliefAngleDeg(relief)
      const radius = reliefRadius(relief)
      return angle >= angleStartDeg && angle < angleEndDeg && radius >= zoneSunkenRadius
    })
    const reliefFinding = reliefInSector
      ? findings.find((item) => item.id === `relief-${reliefInSector.id}-sweep`)
      : undefined
    const sectorValue = reliefInSector ? outerReliefRoom - reliefInSector.height : outerReliefRoom

    return {
      id: `outer-sector-${index}`,
      label: `Anillo ${index + 1}`,
      radiusStart: zoneSunkenRadius,
      radiusEnd: dialRadius,
      angleStartDeg,
      angleEndDeg,
      status: structuralOuterCollision || reliefFinding ? 'collision' : sectorValue > 0.7 ? 'safe' : sectorValue > 0.4 ? 'opportunity' : outerStatus,
      value: roundMm(sectorValue),
    }
  })

  const zones: ClearanceZone[] = [
    {
      id: 'center',
      label: 'Centro hundido',
      radiusStart: 0,
      radiusEnd: zoneSunkenRadius,
      status: structuralCenterCollision || handDialMinGap < 0.05 ? 'collision' : extraSink > 0.25 ? 'opportunity' : 'tight',
      value: roundMm(Math.min(handDialMinGap, collision.dialFloorClearance)),
    },
    {
      id: 'outer',
      label: 'Anillo exterior',
      radiusStart: zoneSunkenRadius,
      radiusEnd: dialRadius,
      status: outerStatus,
      value: roundMm(Math.min(outerReliefRoom, collision.dialOuterLandClearance)),
    },
    ...outerSectorZones,
    {
      id: 'sweep',
      label: 'Barrido de agujas',
      radiusStart: 0.7,
      radiusEnd: Math.max(...collision.activeHands.map(({ hand }) => hand.length)),
      status: reliefConflict ? 'collision' : 'opportunity',
      value: roundMm(crystalClearance),
    },
  ]

  const minimumClearance = collision.minimumClearance

  const metrics: ValidationMetrics = {
    totalHeight: roundMm(design.case.totalHeight),
    crystalClearance: roundMm(crystalClearance),
    dialCenterDepth: roundMm(design.dial.sunkenCenter ? design.dial.sunkenDepth : 0),
    minimumClearance: roundMm(minimumClearance),
    activeConflicts: findings.filter((item) => item.severity === 'bad').length,
    opportunitiesDetected: opportunities.length,
    movementCaseClearance: roundMm(movementCaseClearance),
    dialCaseClearance: roundMm(dialCaseClearance),
    handCaseClearance: roundMm(handCaseClearance),
    crystalRadialClearance: roundMm(crystalRadialClearance),
    dialFootCoverageClearance: roundMm(dialFootCoverageClearance),
    dialStructuralFloor: roundMm(collision.dialStructuralFloor),
    dialOuterSupportWidth: roundMm(collision.dialOuterSupportWidth),
    maxHandTop: roundMm(maxHandTop),
    crystalInnerTop: roundMm(crystalInnerTop),
  }

  return {
    status: statusFromFindings(findings),
    metrics,
    findings,
    opportunities,
    zones,
    conflictIds,
  }
}
