import type { InterferenceCheck, TraceableDimension, WatchIntegrationProject } from './stage5ComponentModel'

export const ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES: readonly InterferenceCheck[] = [
  {checkId:'interference.hands-dial',kind:'dynamic',componentIds:['component.hand-hour','component.hand-minute','component.dial'],statesEvaluated:['00:00','03:15','06:30','09:45'],statesOmitted:['flexión real','choque de instalación'],requiredDimensionIds:['hour-hand-envelope','minute-hand-envelope','dial-surface-height'],result:'input-incomplete',unknowns:[],limitations:['El barrido usa envolventes, no deformación física.']},
  {checkId:'interference.hands-crystal',kind:'dynamic',componentIds:['component.hand-minute','component.hand-second','component.crystal','component.rehaut'],statesEvaluated:['barrido 360°'],statesOmitted:['golpe','flexión','desalineación física'],requiredDimensionIds:['hand-stack-top','crystal-inner-height','rehaut-envelope'],result:'input-incomplete',unknowns:[],limitations:['La ausencia de colisión en el modelo no acredita compatibilidad física.']},
  {checkId:'interference.rotor-caseback',kind:'dynamic',componentIds:['component.movement','component.caseback','component.gasket'],statesEvaluated:['rotor 0°','rotor 90°','rotor 180°','rotor 270°'],statesOmitted:['juego de cojinete','deformación del fondo'],requiredDimensionIds:['rotor-rear-envelope','caseback-inner-height','caseback-gasket-stack'],result:'input-incomplete',unknowns:[],limitations:['Requiere envolvente posterior aplicable al calibre.']},
  {checkId:'interference.stem-control',kind:'dynamic',componentIds:['component.stem','component.crown','component.tube'],statesEvaluated:['corona cerrada','posición de cuerda','posición de puesta en hora'],statesOmitted:['carga real de junta','elasticidad'],requiredDimensionIds:['stem-functional-length','crown-engagement-depth','tube-travel'],result:'input-incomplete',unknowns:[],limitations:['No prescribe corte ni roscado de tija.']},
  {checkId:'interference.static-envelope',kind:'static',componentIds:['component.movement','component.movement-holder','component.case'],statesEvaluated:['ensamble nominal representado'],statesOmitted:['tolerancias ausentes','deformación'],requiredDimensionIds:['movement-radius','holder-inner-radius','holder-outer-radius','case-seat-radius'],result:'input-incomplete',unknowns:[],limitations:['Solo evalúa el modelo representado.']},
] as const

export function evaluateInterference(template: InterferenceCheck, dimensions: readonly TraceableDimension[]): InterferenceCheck {
  const missing = template.requiredDimensionIds.filter((id) => dimensions.find(({dimensionId,value}) => dimensionId === id && value !== undefined) === undefined)
  if (missing.length) return {...template,result:'input-incomplete',unknowns:missing}
  return {...template,result:'no-conflict-in-represented-model',unknowns:[]}
}

export function calculateInterferences(project: WatchIntegrationProject): InterferenceCheck[] {
  return ACADEMY_STAGE_5_INTERFERENCE_TEMPLATES.map((template) => evaluateInterference(template,project.dimensions))
}

