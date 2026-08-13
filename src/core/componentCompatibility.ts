import {
  cloneProject,
  newProjectId,
  qualityReliability,
  valueOf,
  type ComponentInterfaceSummary,
  type ComponentOrigin,
  type Dimension,
  type MechanicalArbor,
  type MechanicalArborId,
  type MechanicalComponentId,
  type MovementComponentPayload,
  type Reliability,
  type SavedPartPreset,
  type WatchPartId,
  type WatchProject,
} from '../vnext/model'

export type MovementComponentPreset = Extract<SavedPartPreset, { kind: 'movement-component' }>
export type CompatibilityState = 'compatible' | 'conditional' | 'incompatible'

export interface CompatibilityIssue {
  id: string
  severity: 'blocker' | 'warning' | 'info'
  title: string
  detail: string
  actual?: number
  target?: number
  unit?: string
}

export interface ComponentCompatibilityReport {
  componentType: MechanicalComponentId
  state: CompatibilityState
  score: number
  issues: CompatibilityIssue[]
  checksRun: number
  donor: string
  target: string
}

export const mechanicalComponentLabels: Record<MechanicalComponentId, string> = {
  plate: 'Platina',
  bridge: 'Puentes',
  barrel: 'Barrilete',
  center: 'Rueda de centro',
  third: 'Tercera rueda',
  fourth: 'Cuarta rueda',
  escape: 'Rueda de escape',
  balance: 'Volante',
  pallet: 'Ancora',
  hairspring: 'Espiral',
  mainspring: 'Muelle real',
  keyless: 'Remontuar',
  rotor: 'Rotor automatico',
  'jewel-set': 'Juego de rubies',
}

export const mechanicalComponentOrder: MechanicalComponentId[] = [
  'plate',
  'bridge',
  'barrel',
  'center',
  'third',
  'fourth',
  'escape',
  'pallet',
  'balance',
  'hairspring',
  'mainspring',
  'keyless',
  'jewel-set',
  'rotor',
]

function copy<T>(value: T): T {
  return structuredClone(value)
}

function componentForPart(part: WatchPartId): MechanicalComponentId | null {
  if (part === 'jewel') return 'jewel-set'
  if (mechanicalComponentOrder.includes(part as MechanicalComponentId)) return part as MechanicalComponentId
  return null
}

function interfaceValue(label: string, dimension: Dimension): ComponentInterfaceSummary {
  return {
    label,
    value: valueOf(dimension),
    unit: dimension.unit,
    tolerance: Math.max(dimension.minus, dimension.plus),
  }
}

function weakestReliability(dimensions: Array<Dimension | undefined>): Reliability {
  const rank: Record<Reliability, number> = { pending: 0, low: 1, medium: 2, high: 3 }
  return dimensions.reduce<Reliability>((current, item) => {
    if (!item) return current
    const next = qualityReliability(item.quality)
    return rank[next] < rank[current] ? next : current
  }, 'high')
}

function originForProject(project: WatchProject, component: MechanicalComponentId, dimensions: Array<Dimension | undefined>): ComponentOrigin {
  const documented = project.movement.kind === 'mechanical' ? project.movement.componentOrigins[component] : undefined
  return {
    ...documented,
    kind: documented?.kind ?? 'donor',
    sourceProjectId: project.id,
    sourceProjectName: project.name,
    sourceMovement: documented?.sourceMovement ?? project.movement.name,
    reference: documented?.reference ?? `${mechanicalComponentLabels[component]} extraido de ${project.movement.name}`,
    capturedAt: new Date().toISOString(),
    notes: documented?.notes ?? 'Pieza donante guardada con sus cotas, tolerancias, interfaces y procedencia originales.',
    reliability: documented?.reliability ?? weakestReliability(dimensions),
  }
}

function arborPayload(arbor: MechanicalArbor): MovementComponentPayload {
  return { componentType: arbor.id, value: copy(arbor) }
}

export function movementComponentPresetFromProject(
  project: WatchProject,
  selectedPart: WatchPartId,
): MovementComponentPreset | null {
  if (project.movement.kind !== 'mechanical') return null
  const componentType = componentForPart(selectedPart)
  if (!componentType) return null
  const movement = project.movement
  let payload: MovementComponentPayload
  let interfaces: ComponentInterfaceSummary[]
  let dimensions: Array<Dimension | undefined>

  if (componentType === 'plate') {
    payload = {
      componentType,
      value: copy({
        plateDiameter: movement.plateDiameter,
        plateThickness: movement.plateThickness,
        trainBaseZ: movement.trainBaseZ,
        edgeClearance: movement.edgeClearance,
      }),
    }
    dimensions = [movement.plateDiameter, movement.plateThickness, movement.trainBaseZ, movement.edgeClearance]
    interfaces = [interfaceValue('Diametro', movement.plateDiameter), interfaceValue('Espesor', movement.plateThickness)]
  } else if (componentType === 'bridge') {
    payload = {
      componentType,
      value: copy({
        bridgeThickness: movement.bridgeThickness,
        bridgeTopZ: movement.bridgeTopZ,
        totalHeight: movement.totalHeight,
      }),
    }
    dimensions = [movement.bridgeThickness, movement.bridgeTopZ, movement.totalHeight]
    interfaces = [interfaceValue('Espesor', movement.bridgeThickness), interfaceValue('Plano superior', movement.bridgeTopZ)]
  } else if (['barrel', 'center', 'third', 'fourth', 'escape'].includes(componentType)) {
    const arbor = movement.arbors.find((item) => item.id === componentType)
    if (!arbor) return null
    payload = arborPayload(arbor)
    dimensions = [arbor.x, arbor.y, arbor.wheelTeeth, arbor.pinionTeeth, arbor.moduleToNext, arbor.pivotDiameter, arbor.jewelHoleDiameter]
    interfaces = [
      interfaceValue('Dientes rueda', arbor.wheelTeeth),
      interfaceValue('Hojas pinon', arbor.pinionTeeth),
      interfaceValue('Modulo de salida', arbor.moduleToNext),
      interfaceValue('Pivote', arbor.pivotDiameter),
    ]
  } else if (componentType === 'balance') {
    payload = { componentType, value: copy(movement.balance) }
    dimensions = [movement.balance.diameter, movement.balance.thickness, movement.balance.z, movement.balance.inertia]
    interfaces = [interfaceValue('Diametro', movement.balance.diameter), interfaceValue('Plano Z', movement.balance.z)]
  } else if (componentType === 'pallet') {
    payload = { componentType, value: copy(movement.escapement) }
    dimensions = [movement.escapement.targetVph, movement.escapement.liftAngle, movement.escapement.lock, movement.escapement.drop]
    interfaces = [interfaceValue('Frecuencia', movement.escapement.targetVph), interfaceValue('Alzamiento', movement.escapement.liftAngle)]
  } else if (componentType === 'hairspring') {
    payload = {
      componentType,
      value: copy({
        hairspringStiffness: movement.balance.hairspringStiffness,
        dampingRatio: movement.balance.dampingRatio,
        targetAmplitude: movement.balance.targetAmplitude,
        targetVph: movement.escapement.targetVph,
      }),
    }
    dimensions = [movement.balance.hairspringStiffness, movement.balance.dampingRatio, movement.balance.targetAmplitude, movement.escapement.targetVph]
    interfaces = [interfaceValue('Frecuencia', movement.escapement.targetVph), interfaceValue('Amplitud', movement.balance.targetAmplitude)]
  } else if (componentType === 'mainspring') {
    if (!movement.mainspring) return null
    payload = {
      componentType,
      value: copy({ mainspring: movement.mainspring, barrelTurns: movement.barrelTurns, targetPowerReserve: movement.targetPowerReserve }),
    }
    dimensions = [movement.mainspring.thickness, movement.mainspring.height, movement.mainspring.length, movement.barrelTurns]
    interfaces = [interfaceValue('Espesor', movement.mainspring.thickness), interfaceValue('Altura', movement.mainspring.height)]
  } else if (componentType === 'keyless') {
    payload = { componentType, value: copy({ stemAxisZ: movement.stemAxisZ, motionWorks: movement.motionWorks }) }
    dimensions = [movement.stemAxisZ, movement.motionWorks.hourFit, movement.motionWorks.minuteFit, movement.motionWorks.secondFit]
    interfaces = [interfaceValue('Eje de tija', movement.stemAxisZ), interfaceValue('Canon horario', movement.motionWorks.hourFit)]
  } else if (componentType === 'rotor') {
    if (!movement.automatic) return null
    payload = { componentType, value: copy({ automatic: movement.automatic }) }
    dimensions = [movement.automatic.rotorDiameter, movement.automatic.rotorThickness, movement.automatic.rotorZ, movement.automatic.bearingDiameter]
    interfaces = [interfaceValue('Diametro', movement.automatic.rotorDiameter), interfaceValue('Cojinete', movement.automatic.bearingDiameter)]
  } else {
    payload = {
      componentType: 'jewel-set',
      value: copy(movement.arbors.map((arbor) => ({
        id: arbor.id,
        pivotDiameter: arbor.pivotDiameter,
        jewelHoleDiameter: arbor.jewelHoleDiameter,
        jewelOuterDiameter: arbor.jewelOuterDiameter,
      }))),
    }
    dimensions = movement.arbors.flatMap((arbor) => [arbor.pivotDiameter, arbor.jewelHoleDiameter, arbor.jewelOuterDiameter])
    interfaces = movement.arbors.map((arbor) => interfaceValue(`${arbor.name}: agujero`, arbor.jewelHoleDiameter ?? arbor.pivotDiameter))
  }

  const now = new Date().toISOString()
  return {
    id: `component-${newProjectId()}`,
    name: `${mechanicalComponentLabels[componentType]} · ${movement.name}`,
    kind: 'movement-component',
    componentType,
    payload,
    origin: originForProject(project, componentType, dimensions),
    interfaces,
    createdAt: now,
    modifiedAt: now,
    sourceProjectId: project.id,
    sourceProjectName: project.name,
  }
}

function pushIssue(
  issues: CompatibilityIssue[],
  severity: CompatibilityIssue['severity'],
  id: string,
  title: string,
  detail: string,
  actual?: number,
  target?: number,
  unit = 'mm',
): void {
  issues.push({ id, severity, title, detail, actual, target, unit })
}

function radialEnvelope(arbor: MechanicalArbor): number {
  return (valueOf(arbor.moduleToNext) * valueOf(arbor.wheelTeeth)) / 2
}

function analyzeArbor(project: WatchProject, donor: MechanicalArbor, issues: CompatibilityIssue[]): void {
  if (project.movement.kind !== 'mechanical') return
  const movement = project.movement
  const plateRadius = valueOf(movement.plateDiameter) / 2 - valueOf(movement.edgeClearance)
  const radialReach = Math.hypot(valueOf(donor.x), valueOf(donor.y)) + radialEnvelope(donor)
  if (radialReach > plateRadius) {
    pushIssue(issues, 'blocker', 'arbor-envelope', 'La rueda queda fuera de la platina', `La envolvente radial alcanza ${radialReach.toFixed(2)} mm y la platina admite ${plateRadius.toFixed(2)} mm.`, radialReach, plateRadius)
  } else if (plateRadius - radialReach < 0.35) {
    pushIssue(issues, 'warning', 'arbor-edge-tight', 'Margen al borde muy justo', `Quedan ${(plateRadius - radialReach).toFixed(3)} mm antes del borde util de la platina.`, plateRadius - radialReach, 0.35)
  }

  const jewelHole = valueOf(donor.jewelHoleDiameter ?? donor.pivotDiameter)
  const pivot = valueOf(donor.pivotDiameter)
  const pivotClearance = jewelHole - pivot
  if (pivotClearance <= 0) {
    pushIssue(issues, 'blocker', 'pivot-jewel-interference', 'Pivote incompatible con el rubi', `El pivote de ${pivot.toFixed(3)} mm no entra en un agujero de ${jewelHole.toFixed(3)} mm.`, pivot, jewelHole)
  } else if (pivotClearance > 0.08) {
    pushIssue(issues, 'warning', 'pivot-jewel-loose', 'Juego de pivote excesivo', `La diferencia diametral es ${pivotClearance.toFixed(3)} mm; conviene asignar otro rubi o casquillo.`, pivotClearance, 0.03)
  }

  const order: MechanicalArborId[] = ['barrel', 'center', 'third', 'fourth', 'escape']
  const index = order.indexOf(donor.id)
  const checkPair = (driver: MechanicalArbor, driven: MechanicalArbor, label: string) => {
    const target = (valueOf(driver.moduleToNext) * (valueOf(driver.wheelTeeth) + valueOf(driven.pinionTeeth))) / 2
    const actual = Math.hypot(valueOf(driver.x) - valueOf(driven.x), valueOf(driver.y) - valueOf(driven.y))
    const delta = Math.abs(actual - target)
    if (delta > Math.max(0.3, valueOf(driver.moduleToNext) * 2.5)) {
      pushIssue(issues, 'warning', `depthing-${label}`, 'La profundidad exige recolocar centros', `La distancia actual es ${actual.toFixed(3)} mm y la nominal ${target.toFixed(3)} mm. El constructor puede recolocar la rueda, pero debe confirmarse con prueba de rodadura.`, actual, target)
    } else if (delta > 0.06) {
      pushIssue(issues, 'warning', `depthing-tight-${label}`, 'Profundidad fuera del margen inicial', `La diferencia entre centros es ${delta.toFixed(3)} mm.`, actual, target)
    }
  }
  if (index > 0) {
    const previous = movement.arbors.find((item) => item.id === order[index - 1])
    if (previous) checkPair(previous, donor, `${previous.id}-${donor.id}`)
  }
  if (index >= 0 && index < order.length - 1) {
    const next = movement.arbors.find((item) => item.id === order[index + 1])
    if (next) checkPair(donor, next, `${donor.id}-${next.id}`)
  }
}

export function analyzeComponentCompatibility(project: WatchProject, preset: MovementComponentPreset): ComponentCompatibilityReport {
  const issues: CompatibilityIssue[] = []
  if (project.movement.kind !== 'mechanical') {
    pushIssue(issues, 'blocker', 'target-not-mechanical', 'El proyecto no contiene un movimiento mecanico', 'Crea o convierte el proyecto a movimiento mecanico antes de asignar piezas donantes.')
  } else {
    const movement = project.movement
    const payload = preset.payload
    if (payload.componentType === 'plate') {
      const diameter = valueOf(payload.value.plateDiameter)
      const available = valueOf(project.case.innerDiameter)
      if (diameter > available) pushIssue(issues, 'blocker', 'plate-case', 'La platina no entra en la caja', `La platina mide ${diameter.toFixed(2)} mm y el interior disponible ${available.toFixed(2)} mm.`, diameter, available)
      else if (available - diameter < 0.4) pushIssue(issues, 'warning', 'plate-holder', 'Falta margen para el aro de sujecion', `Solo quedan ${((available - diameter) / 2).toFixed(3)} mm radiales.`, (available - diameter) / 2, 0.2)
    } else if (payload.componentType === 'bridge') {
      const top = valueOf(payload.value.bridgeTopZ)
      const available = valueOf(project.case.usableInteriorHeight) - valueOf(project.assembly.dialMovementGap)
      if (top > available) pushIssue(issues, 'blocker', 'bridge-headroom', 'Los puentes superan la altura interior', `El plano superior queda a ${top.toFixed(2)} mm y el espacio util es ${available.toFixed(2)} mm.`, top, available)
    } else if (['barrel', 'center', 'third', 'fourth', 'escape'].includes(payload.componentType)) {
      analyzeArbor(project, payload.value as MechanicalArbor, issues)
    } else if (payload.componentType === 'balance') {
      const balance = payload.value
      const reach = Math.hypot(valueOf(balance.x), valueOf(balance.y)) + valueOf(balance.diameter) / 2
      const limit = valueOf(movement.plateDiameter) / 2 - valueOf(movement.edgeClearance)
      if (reach > limit) pushIssue(issues, 'blocker', 'balance-envelope', 'El volante sale de la platina', `La envolvente llega a ${reach.toFixed(2)} mm y el limite util es ${limit.toFixed(2)} mm.`, reach, limit)
      if (valueOf(balance.z) + valueOf(balance.thickness) > valueOf(movement.bridgeTopZ)) pushIssue(issues, 'blocker', 'balance-height', 'El volante invade el plano de puentes', 'La altura del volante supera el plano superior disponible.')
    } else if (payload.componentType === 'pallet') {
      const target = valueOf(movement.escapement.targetVph)
      const donor = valueOf(payload.value.targetVph)
      const delta = Math.abs(donor - target)
      if (delta > 3600) pushIssue(issues, 'warning', 'pallet-frequency', 'Escape de otra frecuencia', `La pieza donante esta planteada para ${donor.toFixed(0)} vph y el movimiento para ${target.toFixed(0)} vph.`, donor, target, 'vph')
      if (payload.value.type !== movement.escapement.type) pushIssue(issues, 'warning', 'pallet-architecture', 'Arquitectura de escape diferente', `Se sustituira ${movement.escapement.type} por ${payload.value.type}; hay que reasignar geometria de rueda y volante.`)
    } else if (payload.componentType === 'hairspring') {
      const donor = valueOf(payload.value.targetVph)
      const target = valueOf(movement.escapement.targetVph)
      if (Math.abs(donor - target) > 1800) pushIssue(issues, 'warning', 'hairspring-frequency', 'Espiral fuera de la frecuencia objetivo', `Donante ${donor.toFixed(0)} vph frente a objetivo ${target.toFixed(0)} vph.`, donor, target, 'vph')
    } else if (payload.componentType === 'keyless') {
      const donorAxis = valueOf(payload.value.stemAxisZ)
      const caseAxis = valueOf(project.case.stemAxisZ) - valueOf(project.case.backThickness) - valueOf(project.assembly.movementBackClearance)
      const delta = Math.abs(donorAxis - caseAxis)
      if (delta > 0.5) pushIssue(issues, 'blocker', 'keyless-axis', 'La tija no alinea con el tubo de corona', `La diferencia axial es ${delta.toFixed(3)} mm.`, donorAxis, caseAxis)
      else if (delta > 0.12) pushIssue(issues, 'warning', 'keyless-axis-tight', 'La tija requiere ajustar la altura de caja', `La diferencia axial es ${delta.toFixed(3)} mm.`, donorAxis, caseAxis)
    } else if (payload.componentType === 'rotor') {
      const diameter = valueOf(payload.value.automatic.rotorDiameter)
      const limit = Math.min(valueOf(movement.plateDiameter), valueOf(project.case.innerDiameter)) - 0.4
      if (diameter > limit) pushIssue(issues, 'blocker', 'rotor-diameter', 'El rotor no puede girar libremente', `El rotor mide ${diameter.toFixed(2)} mm y la envolvente admite ${limit.toFixed(2)} mm.`, diameter, limit)
    } else if (payload.componentType === 'jewel-set') {
      payload.value.forEach((jewel) => {
        const clearance = valueOf(jewel.jewelHoleDiameter ?? jewel.pivotDiameter) - valueOf(jewel.pivotDiameter)
        if (clearance <= 0) pushIssue(issues, 'blocker', `jewel-${jewel.id}`, `Rubi incompatible en ${jewel.id}`, `El agujero no supera el diametro del pivote (${clearance.toFixed(3)} mm de diferencia).`, clearance, 0.01)
      })
    }
  }

  if (issues.length === 0) {
    pushIssue(issues, 'info', 'nominal-compatible', 'Compatible en el modelo nominal', 'No se han encontrado incompatibilidades en envolventes, interfaces ni cotas declaradas. Deben verificarse tolerancias y geometria exacta antes de fabricar.')
  }
  const blockers = issues.filter((item) => item.severity === 'blocker').length
  const warnings = issues.filter((item) => item.severity === 'warning').length
  const state: CompatibilityState = blockers > 0 ? 'incompatible' : warnings > 0 ? 'conditional' : 'compatible'
  return {
    componentType: preset.componentType,
    state,
    score: Math.max(0, Math.round(100 - blockers * 35 - warnings * 9)),
    issues,
    checksRun: Math.max(1, issues.length),
    donor: preset.origin.sourceMovement ?? preset.sourceProjectName,
    target: project.movement.name,
  }
}

export function applyMovementComponent(project: WatchProject, preset: MovementComponentPreset): void {
  if (project.movement.kind !== 'mechanical') throw new Error('El proyecto objetivo no contiene un movimiento mecanico.')
  const movement = project.movement
  const payload = copy(preset.payload)
  if (payload.componentType === 'plate') Object.assign(movement, payload.value)
  else if (payload.componentType === 'bridge') Object.assign(movement, payload.value)
  else if (['barrel', 'center', 'third', 'fourth', 'escape'].includes(payload.componentType)) {
    const index = movement.arbors.findIndex((item) => item.id === payload.componentType)
    const arbor = payload.value as MechanicalArbor
    if (index >= 0) movement.arbors[index] = { ...arbor, id: payload.componentType as MechanicalArborId }
    else movement.arbors.push({ ...arbor, id: payload.componentType as MechanicalArborId })
  } else if (payload.componentType === 'balance') movement.balance = payload.value
  else if (payload.componentType === 'pallet') movement.escapement = payload.value
  else if (payload.componentType === 'hairspring') {
    movement.balance.hairspringStiffness = payload.value.hairspringStiffness
    movement.balance.dampingRatio = payload.value.dampingRatio
    movement.balance.targetAmplitude = payload.value.targetAmplitude
    movement.escapement.targetVph = payload.value.targetVph
  } else if (payload.componentType === 'mainspring') {
    movement.mainspring = payload.value.mainspring
    movement.barrelTurns = payload.value.barrelTurns
    movement.targetPowerReserve = payload.value.targetPowerReserve
  } else if (payload.componentType === 'keyless') {
    movement.stemAxisZ = payload.value.stemAxisZ
    movement.motionWorks = payload.value.motionWorks
  } else if (payload.componentType === 'rotor') {
    movement.automatic = payload.value.automatic
    movement.architecture = 'automatic'
  } else if (payload.componentType === 'jewel-set') {
    payload.value.forEach((jewel) => {
      const arbor = movement.arbors.find((item) => item.id === jewel.id)
      if (!arbor) return
      arbor.jewelHoleDiameter = jewel.jewelHoleDiameter
      arbor.jewelOuterDiameter = jewel.jewelOuterDiameter
    })
  }
  movement.componentOrigins[preset.componentType] = {
    ...preset.origin,
    kind: 'donor',
    capturedAt: new Date().toISOString(),
    notes: preset.origin.notes || `Trasplantado desde ${preset.sourceProjectName}.`,
  }
  movement.buildMode = movement.buildMode === 'scratch' && Object.keys(movement.componentOrigins).length === 1 ? 'scratch' : 'hybrid'
}

export function previewComponentApplication(project: WatchProject, preset: MovementComponentPreset): WatchProject {
  const preview = cloneProject(project)
  applyMovementComponent(preview, preset)
  return preview
}
