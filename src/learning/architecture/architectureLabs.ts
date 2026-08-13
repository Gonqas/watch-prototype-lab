import { z } from 'zod'
import { COMPARATIVE_MOVEMENT_CASES } from '../atlas/comparativeAtlas'
import { SERVICE_PROCEDURES } from '../service/serviceProcedures'

const id = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,159}$/)

export const AdvancedLabDefinitionSchema = z.object({
  activityId: id,
  route: z.enum(['comparative-atlas', 'service-method', 'architectures-complications']),
  title: z.string().min(1),
  theoryQuestion: z.string().min(1),
  caseIds: z.array(id).default([]),
  procedureId: id.optional(),
  representation: z.enum(['document-table', 'causal-diagram', 'existing-fixture', 'service-planner']),
  expectedProducts: z.array(z.string().min(1)).min(1),
  requiresHumanReview: z.boolean(),
  physicalClaimAllowed: z.literal(false),
}).strict()

export type AdvancedLabDefinition = z.infer<typeof AdvancedLabDefinitionSchema>

export const ADVANCED_LABS: AdvancedLabDefinition[] = z.array(AdvancedLabDefinitionSchema).parse([
  { activityId: 'activity.advanced.atlas-authority', route: 'comparative-atlas', title: 'Separar hecho, inferencia y desconocido', theoryQuestion: '¿Qué puede afirmarse de un calibre cuando solo existe una ficha secundaria o una fotografía?', caseIds: ['case.eta.6497-2', 'case.archive.service-reading', 'case.archive.pocket-watch-identity'], representation: 'document-table', expectedProducts: ['Matriz de afirmaciones con fuente, autoridad y nivel de confianza.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.seconds-layout', route: 'comparative-atlas', title: 'Comparar arquitecturas de segundos', theoryQuestion: '¿Qué relaciones cambian entre pequeño segundero, central directo e indirecto?', caseIds: ['case.eta.6497-2', 'case.eta.2824-2', 'case.pattern.indirect-centre-seconds'], representation: 'causal-diagram', expectedProducts: ['Grafo de transmisión y lista de consecuencias de diseño.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.winding-systems', route: 'comparative-atlas', title: 'Comparar sistemas automáticos', theoryQuestion: '¿Cómo rectifica cada arquitectura el movimiento del rotor?', caseIds: ['case.eta.2824-2', 'case.eta.7750', 'case.seiko.42-family', 'case.miyota.8215'], representation: 'causal-diagram', expectedProducts: ['Tabla rotor–rectificación–barrilete y diagnósticos discriminantes.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.construction-trade-study', route: 'comparative-atlas', title: 'Estudiar puentes y presupuesto de altura', theoryQuestion: '¿Qué se gana y qué se arriesga al repartir apoyos o reducir altura?', caseIds: ['case.eta.6497-2', 'case.pattern.ultra-thin', 'case.miyota.8215'], representation: 'document-table', expectedProducts: ['Trade study de rigidez, altura, montaje y servicio.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.service-baseline', route: 'service-method', title: 'Preparar dossier y autoridad', theoryQuestion: '¿Qué debe conocerse antes de liberar energía o retirar una pieza?', procedureId: 'procedure.service.baseline-and-authority', representation: 'service-planner', expectedProducts: ['Dossier inicial', 'matriz de autoridad', 'condiciones de parada'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.service-disassembly', route: 'service-method', title: 'Planificar desmontaje por dependencias', theoryQuestion: '¿Qué debe liberarse antes y cómo se demuestra?', procedureId: 'procedure.service.dependency-led-disassembly', representation: 'service-planner', expectedProducts: ['Grafo remove-before', 'mapa de piezas', 'registro de desviaciones'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.service-clean-lube', route: 'service-method', title: 'Planificar limpieza y lubricación', theoryQuestion: '¿Por qué una receta universal es técnicamente insegura?', procedureId: 'procedure.service.cleaning-lubrication-plan', representation: 'service-planner', expectedProducts: ['Matriz material–proceso', 'mapa punto–producto–fuente'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.service-assembly', route: 'service-method', title: 'Montar y verificar incrementalmente', theoryQuestion: '¿Por qué verificar por capas localiza mejor un fallo que probar solo al final?', procedureId: 'procedure.service.assembly-and-verification', representation: 'service-planner', expectedProducts: ['Secuencia de montaje', 'puntos de inspección', 'matriz funcional'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.service-diagnosis', route: 'service-method', title: 'Cerrar un diagnóstico trazable', theoryQuestion: '¿Qué prueba separa dos causas plausibles sin desmontar de más?', procedureId: 'procedure.service.diagnosis-and-report', representation: 'service-planner', expectedProducts: ['Árbol de hipótesis', 'prueba discriminante', 'informe con desconocidos'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.escapement-compare', route: 'architectures-complications', title: 'Comparar familias de escape', theoryQuestion: '¿Qué relaciones deben mantenerse para hablar de retención, desbloqueo e impulso?', caseIds: ['case.eta.6497-2', 'case.miyota.8215'], representation: 'existing-fixture', expectedProducts: ['Secuencia causal', 'tabla de afirmaciones que requieren geometría real.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.ultra-thin', route: 'architectures-complications', title: 'Resolver un presupuesto de altura', theoryQuestion: '¿Qué funciones compiten por el mismo espacio axial?', caseIds: ['case.pattern.ultra-thin', 'case.eta.2824-2'], representation: 'causal-diagram', expectedProducts: ['Presupuesto de altura cualitativo', 'registro de riesgos y desconocidos.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.calendars', route: 'architectures-complications', title: 'Diseñar la lógica de calendario', theoryQuestion: '¿Cómo se acumula, libera, retiene y corrige el avance?', caseIds: ['case.eta.2824-2', 'case.eta.7750', 'case.miyota.8215'], representation: 'causal-diagram', expectedProducts: ['Máquina de estados de fecha', 'zona de cambio y condiciones de corrección.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.chronograph-control', route: 'architectures-complications', title: 'Comparar levas y rueda de pilares', theoryQuestion: '¿Qué componente memoriza el estado del cronógrafo y qué palancas gobierna?', caseIds: ['case.eta.7750', 'case.seiko.6138a'], representation: 'causal-diagram', expectedProducts: ['Tabla de estados inicio–parada–cero', 'grafo de control.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.chronograph-coupling', route: 'architectures-complications', title: 'Comparar acoplamiento horizontal y vertical', theoryQuestion: '¿Cómo llega el movimiento al contador y qué síntomas diferencian los sistemas?', caseIds: ['case.eta.7750', 'case.seiko.6138a'], representation: 'causal-diagram', expectedProducts: ['Matriz de contacto, salto, arrastre, servicio y evidencia.'], requiresHumanReview: true, physicalClaimAllowed: false },
  { activityId: 'activity.advanced.architecture-capstone', route: 'architectures-complications', title: 'Defender una arquitectura completa', theoryQuestion: '¿Qué combinación satisface un pliego sin ocultar compromisos o inventar datos?', caseIds: ['case.eta.6497-2', 'case.eta.2824-2', 'case.eta.7750', 'case.seiko.6138a', 'case.miyota.8215'], representation: 'document-table', expectedProducts: ['Pliego', 'matriz de alternativas', 'decisión', 'riesgos', 'plan de validación.'], requiresHumanReview: true, physicalClaimAllowed: false },
])

export function advancedLab(activityId: string): AdvancedLabDefinition | undefined {
  return ADVANCED_LABS.find((lab) => lab.activityId === activityId)
}

export function validateAdvancedLabReferences(): string[] {
  const cases = new Set(COMPARATIVE_MOVEMENT_CASES.map(({ id }) => id))
  const procedures = new Set(SERVICE_PROCEDURES.map(({ id }) => id))
  return ADVANCED_LABS.flatMap((lab) => [
    ...lab.caseIds.filter((caseId) => !cases.has(caseId)).map((caseId) => `${lab.activityId}: caso desconocido ${caseId}`),
    ...(lab.procedureId && !procedures.has(lab.procedureId) ? [`${lab.activityId}: procedimiento desconocido ${lab.procedureId}`] : []),
  ])
}
