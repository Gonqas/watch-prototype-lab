import { cloneDefaultReliefs, createDefaultDesign } from './catalog'
import type { ProjectTemplate, ProjectTemplateId, ReliefFeature, WatchDesign } from '../types'

const stressRelief = (): ReliefFeature => ({
  id: `relief-stress-${Date.now()}`,
  label: 'Relieve limite',
  type: 'circle',
  x: 0,
  y: 8.8,
  radius: 1.15,
  width: 1.15,
  length: 1.15,
  height: 0.65,
  color: '#7c3aed',
  material: 'prueba de limite',
  dataQuality: 'estimated',
})

const lowPrintableReliefs = (): ReliefFeature[] => [
  {
    id: 'print_outer_index_ring',
    label: 'Anillo de índices imprimible',
    type: 'circle',
    x: 0,
    y: 0,
    radius: 13.2,
    width: 0.55,
    length: 0.55,
    height: 0.16,
    color: '#2dd4bf',
    material: 'resina baja',
    dataQuality: 'estimated',
  },
  {
    id: 'print_marker_12',
    label: 'Índice 12 imprimible',
    type: 'line',
    x: 0,
    y: 12.1,
    radius: 0.25,
    width: 0.42,
    length: 1.8,
    height: 0.18,
    color: '#f8fafc',
    material: 'resina baja',
    dataQuality: 'estimated',
  },
]

const base = (name: string, notes: string) => createDefaultDesign({ name, notes })

const builders: Record<ProjectTemplateId, () => WatchDesign> = {
  blank_2035: () =>
    base(
      'Miyota 2035 - proyecto limpio',
      'Reloj completo limpio: movimiento, caja, dial plano, agujas y cristal sin decoracion experimental.',
    ),
  wp24_supplier_assembly: () =>
    base(
      'WP24 39 mm - montaje técnico',
      'Montaje base con datos parciales de proveedor. Usar como maqueta tecnica hasta medir caja, cristal y holder.',
    ),
  dial_sunken_experiment: () => {
    const design = base(
      'Experimento dial hundido',
      'Exploración manual de dial hundido. No es estándar: es una prueba editable sobre Miyota 2035.',
    )
    design.viewMode = 'section'
    design.dial.sunkenCenter = true
    design.dial.sunkenDepth = 0.55
    design.dial.sunkenRadius = 8.6
    design.dial.outerRingHeight = 0.08
    design.dial.transition = 'soft_bowl'
    return design
  },
  two_hand_clearance: () => {
    const design = base('Experimento 2 agujas', 'Variante manual para estudiar margen vertical sin segundero.')
    design.viewMode = 'sweep'
    design.hands.count = 2
    design.hands.secondsEnabled = false
    design.hands.hour.heightOverDial = 0.42
    design.hands.minute.heightOverDial = 0.84
    return design
  },
  relief_stress: () => {
    const design = createDefaultDesign({
      name: 'Prueba de relieve limite',
      notes: 'Plantilla para forzar colisiones recuperables entre relieve y barrido de agujas.',
      reliefs: [...cloneDefaultReliefs(), stressRelief()],
    })
    design.viewMode = 'heatmap'
    design.dial.showSweepZone = true
    return design
  },
  printable_dial_candidate: () => {
    const design = createDefaultDesign({
      name: 'Dial candidato impresion 3D',
      notes: 'Dial plano con relieves bajos pensados como primera pieza imprimible para validar tolerancias.',
      reliefs: lowPrintableReliefs(),
    })
    design.viewMode = 'section'
    design.dial.dataQuality = 'estimated'
    return design
  },
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank_2035',
    label: 'Desde cero 2035',
    detail: 'Reloj completo limpio, sin relieves ni dial hundido.',
    workbench: 'stack_lab',
    focus: 'ghost',
    selectedPart: 'dial',
  },
  {
    id: 'wp24_supplier_assembly',
    label: 'Montaje WP24',
    detail: 'Caja 39 mm con datos parciales de proveedor.',
    workbench: 'stack_lab',
    focus: 'ghost',
    selectedPart: 'case',
  },
  {
    id: 'dial_sunken_experiment',
    label: 'Dial hundido',
    detail: 'Experimento editable, no estándar.',
    workbench: 'dial_lab',
    focus: 'workshop',
    selectedPart: 'dial',
  },
  {
    id: 'two_hand_clearance',
    label: '2 agujas',
    detail: 'Escenario manual para liberar margen vertical.',
    workbench: 'hands_lab',
    focus: 'ghost',
    selectedPart: 'minuteHand',
  },
  {
    id: 'relief_stress',
    label: 'Relieve limite',
    detail: 'Fuerza colisiones para probar el motor.',
    workbench: 'risk_lab',
    focus: 'ghost',
    selectedPart: 'dial',
  },
  {
    id: 'printable_dial_candidate',
    label: 'Dial imprimible',
    detail: 'Base temprana para impresion 3D de dial.',
    workbench: 'stack_lab',
    focus: 'ghost',
    selectedPart: 'dial',
  },
]

export const getProjectTemplate = (id: ProjectTemplateId) => PROJECT_TEMPLATES.find((template) => template.id === id)

export const createDesignFromTemplate = (id: ProjectTemplateId) => builders[id]()
