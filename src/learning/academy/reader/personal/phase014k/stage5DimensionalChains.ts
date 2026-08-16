import type { DimensionalChain, TraceableDimension } from './stage5ComponentModel'

export const ACADEMY_STAGE_5_CHAIN_TEMPLATES: readonly DimensionalChain[] = [
  { chainId:'chain.radial', name:'Movimiento → aro → caja', datum:'eje del movimiento', direction:'radial', members:[
    {memberId:'radial.movement',dimensionId:'movement-radius',sign:1,role:'envolvente del movimiento'},
    {memberId:'radial.holder-inner',dimensionId:'holder-inner-radius',sign:-1,role:'cara interior del aro'},
    {memberId:'radial.holder-outer',dimensionId:'holder-outer-radius',sign:1,role:'cara exterior del aro'},
    {memberId:'radial.case',dimensionId:'case-seat-radius',sign:-1,role:'asiento de caja'},
  ], operations:['comparar envolvente interior','comparar asiento exterior'], unit:'mm', status:'not-evaluated', unknowns:[] },
  { chainId:'chain.control', name:'Eje de tija → tubo → corona', datum:'eje de tija del movimiento', direction:'axial', members:[
    {memberId:'control.stem-axis',dimensionId:'stem-axis-height',sign:1,role:'eje de mando'},
    {memberId:'control.tube-axis',dimensionId:'tube-axis-height',sign:-1,role:'eje del tubo'},
    {memberId:'control.length',dimensionId:'stem-functional-length',sign:1,role:'longitud funcional'},
    {memberId:'control.crown',dimensionId:'crown-engagement-depth',sign:-1,role:'acoplamiento de corona'},
  ], operations:['comparar ejes','sumar longitud funcional'], unit:'mm', status:'not-evaluated', unknowns:[] },
  { chainId:'chain.dial', name:'Movimiento → apoyo de esfera → asiento → apertura', datum:'plano de apoyo de esfera del movimiento', direction:'axial', members:[
    {memberId:'dial.support',dimensionId:'movement-dial-support-height',sign:1,role:'apoyo'},
    {memberId:'dial.thickness',dimensionId:'dial-thickness',sign:1,role:'espesor'},
    {memberId:'dial.seat',dimensionId:'case-dial-seat-height',sign:-1,role:'asiento'},
  ], operations:['comparar planos de apoyo','comprobar apertura visible'], unit:'mm', status:'not-evaluated', unknowns:[] },
  { chainId:'chain.indication', name:'Movimiento → rueda de horas → esfera → agujas → cristal', datum:'plano de apoyo de esfera del movimiento', direction:'axial', members:[
    {memberId:'indication.hour-wheel',dimensionId:'hour-wheel-top-height',sign:1,role:'rueda de horas'},
    {memberId:'indication.dial',dimensionId:'dial-thickness',sign:1,role:'esfera'},
    {memberId:'indication.hour-hand',dimensionId:'hour-hand-top-height',sign:1,role:'aguja de horas'},
    {memberId:'indication.minute-hand',dimensionId:'minute-hand-top-height',sign:1,role:'aguja de minutos'},
    {memberId:'indication.second-hand',dimensionId:'second-hand-top-height',sign:1,role:'aguja de segundos'},
    {memberId:'indication.crystal',dimensionId:'crystal-inner-height',sign:-1,role:'cara interior del cristal'},
  ], operations:['sumar stack','restar altura interior'], unit:'mm', status:'not-evaluated', unknowns:[] },
  { chainId:'chain.rear', name:'Movimiento → rotor → fijación → junta → fondo', datum:'plano posterior de apoyo de caja', direction:'axial', members:[
    {memberId:'rear.rotor',dimensionId:'rotor-rear-envelope',sign:1,role:'envolvente del rotor'},
    {memberId:'rear.fixing',dimensionId:'caseback-fixing-stack',sign:1,role:'fijación'},
    {memberId:'rear.gasket',dimensionId:'caseback-gasket-stack',sign:1,role:'junta'},
    {memberId:'rear.caseback',dimensionId:'caseback-inner-height',sign:-1,role:'cara interior del fondo'},
  ], operations:['sumar envolvente posterior','restar cavidad disponible'], unit:'mm', status:'not-evaluated', unknowns:[] },
] as const

export function calculateDimensionalChain(template: DimensionalChain, dimensions: readonly TraceableDimension[]): DimensionalChain {
  const values = template.members.map((member) => ({ member, dimension: dimensions.find(({dimensionId}) => dimensionId === member.dimensionId) }))
  const unknowns = values.filter(({dimension}) => dimension?.value === undefined).map(({member}) => member.dimensionId)
  if (unknowns.length) return { ...template, result: undefined, margin: undefined, status:'unknown', unknowns }
  const datumMismatch = values.some(({dimension}) => !dimension?.datum || dimension.datum !== template.datum)
  if (datumMismatch) return { ...template, result: undefined, margin: undefined, status:'datum-conflict', unknowns:['datum incompatible o ausente'] }
  const result = values.reduce((total,{member,dimension}) => total + member.sign * (dimension?.value ?? 0),0)
  const uncertainty = values.reduce((total,{dimension}) => total + (dimension?.uncertainty ?? 0),0)
  return { ...template, result, margin: result, uncertainty, status: result < 0 ? 'conflict-found' : 'calculated', unknowns:[] }
}

