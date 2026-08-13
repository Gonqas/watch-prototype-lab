import type { SelectablePart, ValidationResult, WatchDesign } from '../types'

export type ManufacturingStatus = 'candidate' | 'needs_data' | 'blocked' | 'external'

export interface ManufacturingCheck {
  id: string
  label: string
  status: ManufacturingStatus
  part: SelectablePart
  detail: string
}

export interface FabricationReadiness {
  checks: ManufacturingCheck[]
  missingCriticalData: string[]
}

export const buildFabricationReadiness = (design: WatchDesign, result: ValidationResult): FabricationReadiness => {
  const dialBlocked = result.conflictIds.has('dial') || result.findings.some((finding) => finding.id === 'dial-center-hole')
  const dialHasRiskyRelief = design.dial.reliefs.some((relief) => relief.height > 0.5 || relief.width < 0.25)
  const caseMeasured = design.case.dataQuality === 'measured_by_user'
  const crystalKnown = design.crystal.dataQuality === 'measured_by_user' || design.crystal.dataQuality === 'official_complete'
  const handsMeasured = design.hands.dataQuality === 'measured_by_user'

  const missingCriticalData = [
    ...(design.case.dataQuality === 'supplier_partial'
      ? ['altura interior real de caja', 'asiento de dial', 'holder/fondo', 'posición vertical de tija']
      : []),
    ...(!crystalKnown ? ['perfil y grosor real de cristal', 'altura útil real bajo cristal'] : []),
    ...(!handsMeasured ? ['altura de tubos y grosor real de agujas'] : []),
    ...(dialHasRiskyRelief ? ['tolerancia de impresion para relieves altos o muy finos'] : []),
  ]

  const checks: ManufacturingCheck[] = [
    {
      id: 'dial-print',
      label: 'Dial imprimible',
      status: dialBlocked ? 'blocked' : dialHasRiskyRelief ? 'needs_data' : 'candidate',
      part: 'dial',
      detail: dialBlocked
        ? 'El dial tiene conflicto técnico activo; se puede editar, pero no debería pasar a STL candidato todavía.'
        : dialHasRiskyRelief
          ? 'Dial posible, pero relieves finos/altos piden tolerancias reales de impresion.'
          : 'Primer candidato para STL: disco, centro, hundimiento y relieves parametricos.',
    },
    {
      id: 'case-print',
      label: 'Caja imprimible',
      status: caseMeasured ? 'candidate' : 'needs_data',
      part: 'case',
      detail: caseMeasured
        ? 'Caja con datos medidos: lista para una maqueta imprimible temprana.'
        : 'Para imprimir caja falta fijar tubo, asiento, fondo, rosca/corona y tolerancias reales.',
    },
    {
      id: 'hands-print',
      label: 'Agujas',
      status: handsMeasured ? 'candidate' : 'needs_data',
      part: 'minuteHand',
      detail: handsMeasured
        ? 'Agujas medidas: sirve para maqueta o estudio de fotograbado/mecanizado.'
        : 'En 3D sirve como maqueta; para pieza funcional conviene metal/fotograbado o proveedor.',
    },
    {
      id: 'movement',
      label: 'Movimiento',
      status: 'external',
      part: 'movement',
      detail: 'Miyota 2035 es pieza comprada: solo envelope, fitting y clearances.',
    },
    {
      id: 'crystal',
      label: 'Cristal',
      status: 'external',
      part: 'crystal',
      detail: crystalKnown
        ? 'Cristal conocido como restriccion de montaje; no asumir imprimible.'
        : 'Cristal comprado o mecanizado aparte; falta medir perfil interior real.',
    },
  ]

  return {
    checks,
    missingCriticalData: Array.from(new Set(missingCriticalData)),
  }
}
