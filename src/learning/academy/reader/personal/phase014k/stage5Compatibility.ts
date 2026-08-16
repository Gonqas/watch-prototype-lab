import type { CompatibilityInterface, TraceableDimension, WatchIntegrationProject } from './stage5ComponentModel'

interface InterfaceSeed {
  interfaceId: string
  componentA: string
  componentB: string
  question: string
  requiredData: string[]
  checkMethod: CompatibilityInterface['checkMethod']
}

export const ACADEMY_STAGE_5_INTERFACE_SEEDS: readonly InterfaceSeed[] = [
  ['movement-case','component.movement','component.case','¿La envolvente y los apoyos del movimiento caben en la caja?',['movement-envelope','case-cavity','axial-support'],'clearance'],
  ['movement-holder','component.movement','component.movement-holder','¿El aro centra y retiene el movimiento?',['movement-diameter','holder-inner-diameter','axial-support'],'fit'],
  ['holder-case','component.movement-holder','component.case','¿El aro se referencia en la caja sin giro ni pinzamiento?',['holder-outer-diameter','case-seat-diameter','anti-rotation'],'fit'],
  ['stem-movement','component.stem','component.movement','¿La tija corresponde al sistema de puesta en hora?',['stem-reference','movement-stem-interface'],'document-comparison'],
  ['stem-crown','component.stem','component.crown','¿Rosca, longitud y acoplamiento son aplicables?',['stem-thread','crown-thread','functional-length'],'fit'],
  ['crown-tube','component.crown','component.tube','¿La corona trabaja con el tubo en todos sus estados?',['crown-interface','tube-interface','travel-states'],'dynamic-envelope'],
  ['tube-case','component.tube','component.case','¿El tubo se asienta y alinea con la caja?',['tube-seat','case-tube-seat','axis-height'],'alignment'],
  ['dial-movement','component.dial','component.movement','¿La esfera se referencia al lado de esfera del movimiento?',['dial-thickness','movement-dial-support','date-aperture'],'clearance'],
  ['dial-seat','component.dial','component.case','¿Diámetro total, asiento y apertura visible son compatibles?',['dial-total-diameter','case-dial-seat','visible-opening'],'fit'],
  ['dial-feet','component.dial','component.movement','¿Número, radio y ángulo de los pies coinciden?',['foot-count','foot-radius','foot-angles','movement-foot-holes'],'document-comparison'],
  ['hands-posts','component.hand-hour','component.movement','¿Los agujeros y tubos de agujas corresponden a los postes?',['post-diameters','hand-hole-diameters','tube-lengths'],'fit'],
  ['hour-wheel-dial','component.movement','component.dial','¿La rueda de horas conserva engrane y apoyo con la esfera instalada?',['hour-wheel-height','dial-thickness','dial-gap'],'clearance'],
  ['hands-dial','component.hand-hour','component.dial','¿La aguja de horas libra esfera e índices?',['hour-hand-height','dial-surface-height','index-height'],'clearance'],
  ['hands-hands','component.hand-hour','component.hand-minute','¿Las agujas se libran durante el barrido?',['hour-hand-envelope','minute-hand-envelope','second-hand-envelope'],'dynamic-envelope'],
  ['hands-crystal','component.hand-minute','component.crystal','¿El stack libra cristal y rehaut?',['hand-stack-top','crystal-inner-height','rehaut-envelope'],'dynamic-envelope'],
  ['rotor-caseback','component.movement','component.caseback','¿Rotor, fijación, junta y fondo conservan margen posterior?',['rotor-envelope','caseback-inner-height','gasket-stack'],'dynamic-envelope'],
  ['crystal-bezel','component.crystal','component.bezel','¿Cristal, asiento, retención y junta están documentados como conjunto?',['crystal-seat','bezel-seat','retention-method'],'fit'],
  ['gasket-housing','component.gasket','component.case','¿Cada junta corresponde a su alojamiento documentado?',['gasket-section','housing-section','supplier-fit'],'fit'],
  ['donor-receiver','component.donor-part','component.other','¿La referencia y las interfaces del donante coinciden con el receptor?',['donor-identity','receiver-identity','applicable-interfaces'],'document-comparison'],
].map(([interfaceId,componentA,componentB,question,requiredData,checkMethod]) => ({ interfaceId,componentA,componentB,question,requiredData,checkMethod })) as InterfaceSeed[]

export function buildEmptyCompatibilityMatrix(): CompatibilityInterface[] {
  return ACADEMY_STAGE_5_INTERFACE_SEEDS.map((seed) => ({
    ...seed, availableData: [], result: 'source-needed', confidence: 'low', unknowns: [...seed.requiredData], sourceIds: [],
    decision: 'Método disponible; falta documentación o medición del proyecto.',
  }))
}

function dimensionUsable(dimension: TraceableDimension | undefined): boolean {
  return Boolean(dimension && dimension.value !== undefined && Number.isFinite(dimension.value)
    && (!/height|altura|axis|stack|axial|gap/i.test(dimension.name) || dimension.datum))
}

export function evaluateCompatibilityInterface(
  seed: InterfaceSeed,
  dimensions: readonly TraceableDimension[],
): CompatibilityInterface {
  const availableData = seed.requiredData.filter((required) => dimensionUsable(dimensions.find(({ dimensionId }) => dimensionId === required)))
  const missing = seed.requiredData.filter((required) => !availableData.includes(required))
  if (missing.length) return {
    ...seed, availableData, result: dimensions.some(({ dimensionId }) => seed.requiredData.includes(dimensionId)) ? 'measurement-needed' : 'source-needed',
    confidence: 'low', unknowns: missing, sourceIds: [...new Set(dimensions.filter(({ dimensionId }) => availableData.includes(dimensionId)).flatMap(({ sourceId }) => sourceId ? [sourceId] : []))],
    decision: 'La interfaz permanece abierta; ninguna ausencia se representa como cero.',
  }
  return {
    ...seed, availableData, result: 'physical-validation-pending', confidence: 'medium', unknowns: [],
    sourceIds: [...new Set(dimensions.filter(({ dimensionId }) => availableData.includes(dimensionId)).flatMap(({ sourceId }) => sourceId ? [sourceId] : []))],
    decision: 'Datos presentes; requiere regla de ajuste aplicable y validación física. La igualdad nominal no basta.',
  }
}

export function calculateCompatibilityMatrix(project: WatchIntegrationProject): CompatibilityInterface[] {
  return ACADEMY_STAGE_5_INTERFACE_SEEDS.map((seed) => evaluateCompatibilityInterface(seed, project.dimensions))
}

