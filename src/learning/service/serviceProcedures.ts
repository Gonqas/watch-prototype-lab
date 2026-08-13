import { z } from 'zod'

const id = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,159}$/)
const localized = z.object({ es: z.string().min(1), en: z.string().min(1) }).strict()

export const ServiceToolCapabilitySchema = z.object({
  id,
  title: localized,
  purpose: localized,
  selectionCriteria: z.array(z.string().min(1)).min(1),
  forbiddenSubstitutions: z.array(z.string().min(1)).default([]),
}).strict()

export const ServiceHazardSchema = z.object({
  id,
  title: localized,
  severity: z.enum(['minor', 'moderate', 'serious', 'critical']),
  likelihood: z.enum(['unlikely', 'possible', 'likely']),
  triggers: z.array(z.string().min(1)).min(1),
  controls: z.array(z.string().min(1)).min(1),
  stopConditions: z.array(z.string().min(1)).min(1),
}).strict()

export const ServiceProcedureStepSchema = z.object({
  id,
  order: z.number().int().positive(),
  title: localized,
  entryConditions: z.array(z.string().min(1)).min(1),
  actions: z.array(z.string().min(1)).min(1),
  expectedObservations: z.array(z.string().min(1)).min(1),
  prohibitedActions: z.array(z.string().min(1)).min(1),
  toolCapabilityIds: z.array(id).min(1),
  hazardIds: z.array(id).min(1),
  inspectionPointIds: z.array(id).min(1),
  evidenceRequirementIds: z.array(id).min(1),
  sourceIds: z.array(id).min(1),
  digitalReversibility: z.enum(['restorable', 'not-applicable']),
  physicalReversibility: z.literal('not-guaranteed'),
}).strict()

export const ServiceInspectionPointSchema = z.object({
  id,
  title: localized,
  method: localized,
  record: z.array(z.string().min(1)).min(1),
  noGoConditions: z.array(z.string().min(1)).min(1),
}).strict()

export const ServiceAcceptanceCriterionSchema = z.object({
  id,
  title: localized,
  kind: z.enum(['documentation', 'sequence', 'visual', 'functional', 'measurement', 'traceability']),
  passWhen: z.array(z.string().min(1)).min(1),
  failWhen: z.array(z.string().min(1)).min(1),
  requiresManufacturerLimit: z.boolean(),
}).strict()

export const ServiceEvidenceRequirementSchema = z.object({
  id,
  title: localized,
  medium: z.enum(['note', 'photograph', 'measurement', 'part-map', 'event-log', 'human-review']),
  requiredFields: z.array(z.string().min(1)).min(1),
  proves: localized,
  doesNotProve: localized,
}).strict()

export const ServiceProcedureSchema = z.object({
  id,
  title: localized,
  purpose: localized,
  scope: z.enum(['generic-mechanical', 'documented-calibre', 'physical-work-preparation']),
  prerequisiteProcedureIds: z.array(id).default([]),
  sourceIds: z.array(id).min(1),
  steps: z.array(ServiceProcedureStepSchema).min(1),
  acceptanceCriterionIds: z.array(id).min(1),
  physicalBoundary: localized,
  finalHumanReviewRequired: z.literal(true),
}).strict().superRefine((procedure, context) => {
  const orders = procedure.steps.map(({ order }) => order)
  const expected = procedure.steps.map((_, index) => index + 1)
  if (orders.some((order, index) => order !== expected[index])) {
    context.addIssue({ code: 'custom', path: ['steps'], message: 'Los pasos deben estar ordenados de forma contigua desde 1.' })
  }
})

export type ServiceToolCapability = z.infer<typeof ServiceToolCapabilitySchema>
export type ServiceHazard = z.infer<typeof ServiceHazardSchema>
export type ServiceInspectionPoint = z.infer<typeof ServiceInspectionPointSchema>
export type ServiceAcceptanceCriterion = z.infer<typeof ServiceAcceptanceCriterionSchema>
export type ServiceEvidenceRequirement = z.infer<typeof ServiceEvidenceRequirementSchema>
export type ServiceProcedure = z.infer<typeof ServiceProcedureSchema>

const L = (es: string, en = es) => ({ es, en })

export const SERVICE_TOOL_CAPABILITIES: ServiceToolCapability[] = z.array(ServiceToolCapabilitySchema).parse([
  { id: 'tool.capability.document', title: L('Documentar sin alterar'), purpose: L('Registrar identidad, estado y orientación antes de intervenir.'), selectionCriteria: ['Cámara o sistema de notas con escala y referencias.', 'Identificador de unidad y sesión.'], forbiddenSubstitutions: ['Confiar en memoria o en una foto sin contexto.'] },
  { id: 'tool.capability.hold', title: L('Sujetar sin deformar'), purpose: L('Mantener movimiento y piezas estables sin cargar pivotes, esfera ni superficies funcionales.'), selectionCriteria: ['Tamaño compatible.', 'Apoyo limpio y estable.', 'Ausencia de contacto con elementos frágiles.'], forbiddenSubstitutions: ['Apretar un movimiento en una mordaza no concebida para relojería.'] },
  { id: 'tool.capability.drive-screw', title: L('Accionar tornillos con ajuste'), purpose: L('Transmitir par mediante una hoja que asiente en anchura y espesor.'), selectionCriteria: ['Hoja rectificada.', 'Ajuste a la ranura.', 'Mango controlable.'], forbiddenSubstitutions: ['Usar una hoja demasiado estrecha, gruesa o redondeada.'] },
  { id: 'tool.capability.handle-parts', title: L('Manipular piezas delicadas'), purpose: L('Sujetar sin marcar, lanzar ni contaminar.'), selectionCriteria: ['Pinza limpia y alineada.', 'Punta compatible con masa y geometría.', 'Bandeja de contención.'], forbiddenSubstitutions: ['Coger espirales, pivotes o superficies terminadas con herramienta inadecuada.'] },
  { id: 'tool.capability.inspect', title: L('Inspeccionar con aumento e iluminación'), purpose: L('Separar observación de hipótesis mediante una vista reproducible.'), selectionCriteria: ['Aumento suficiente, no excesivo.', 'Luz que revele la característica.', 'Escala cuando se mida.'], forbiddenSubstitutions: ['Declarar una medida desde píxeles sin calibración.'] },
  { id: 'tool.capability.measure', title: L('Medir con trazabilidad'), purpose: L('Obtener una lectura con unidad, instrumento, resolución, repetición e incertidumbre.'), selectionCriteria: ['Rango y resolución apropiados.', 'Cero verificado.', 'Método de contacto seguro.'], forbiddenSubstitutions: ['Medir una pieza deformable con fuerza no controlada.'] },
  { id: 'tool.capability.clean-plan', title: L('Planificar limpieza compatible'), purpose: L('Asignar cada material y subconjunto a un proceso compatible antes de exponerlo a productos o ultrasonidos.'), selectionCriteria: ['Material identificado.', 'Proceso autorizado.', 'Piezas sensibles separadas.'], forbiddenSubstitutions: ['Aplicar un proceso genérico a espiral, paletas, rubíes pegados, esfera o componentes electrónicos.'] },
  { id: 'tool.capability.lubricate-plan', title: L('Planificar lubricación documentada'), purpose: L('Vincular punto, producto, cantidad, método y fuente sin improvisar.'), selectionCriteria: ['Tabla del fabricante o procedimiento autorizado.', 'Aplicador adecuado.', 'Superficie limpia e inspeccionada.'], forbiddenSubstitutions: ['Usar un lubricante universal o copiar cantidades de otro calibre.'] },
])

export const SERVICE_HAZARDS: ServiceHazard[] = z.array(ServiceHazardSchema).parse([
  { id: 'hazard.stored-energy', title: L('Energía almacenada'), severity: 'serious', likelihood: 'possible', triggers: ['Muelle real cargado.', 'Automático o tren retenido.', 'Apertura de barrilete.'], controls: ['Comprobar y descargar con procedimiento documentado.', 'Contener piezas y usar protección cuando la documentación lo exija.'], stopConditions: ['No se puede verificar el estado de carga.', 'No existe procedimiento para la referencia.'] },
  { id: 'hazard.part-launch', title: L('Expulsión o pérdida de pieza'), severity: 'moderate', likelihood: 'likely', triggers: ['Muelles, clips, trinquetes o piezas precargadas.', 'Pinzas desalineadas.'], controls: ['Trabajar dentro de contención.', 'Documentar orientación.', 'Cubrir el conjunto cuando corresponda.'], stopConditions: ['No se conoce la dirección de liberación.', 'No existe repuesto ni contención.'] },
  { id: 'hazard.pivot-damage', title: L('Daño de pivote o rubí'), severity: 'serious', likelihood: 'possible', triggers: ['Levantar un puente con ruedas tensadas.', 'Forzar un eje fuera de su apoyo.'], controls: ['Verificar libertad y dependencias.', 'Elevar paralelo sin palanca destructiva.'], stopConditions: ['El puente no libera con tornillos retirados.', 'Se observa flexión o carga residual.'] },
  { id: 'hazard.mixed-parts', title: L('Mezcla o pérdida de identidad'), severity: 'serious', likelihood: 'possible', triggers: ['Varias unidades abiertas.', 'Piezas simétricas o variantes mezcladas.'], controls: ['Bandejas e identificadores por unidad y fase.', 'Mapa de piezas y fotografía.'], stopConditions: ['No puede reconstruirse la procedencia de una pieza.'] },
  { id: 'hazard.chemical-material', title: L('Incompatibilidad química o material'), severity: 'serious', likelihood: 'possible', triggers: ['Proceso de limpieza no validado.', 'Adhesivos, lacas, espiral, esfera o electrónica.'], controls: ['Identificar material y exclusiones.', 'Usar ficha de seguridad y procedimiento autorizado.'], stopConditions: ['Material desconocido.', 'No existe compatibilidad documentada.'] },
  { id: 'hazard.false-acceptance', title: L('Aceptar sin evidencia suficiente'), severity: 'serious', likelihood: 'likely', triggers: ['Gira en pantalla o durante unos segundos.', 'Una sola medida.', 'Ausencia de límites oficiales.'], controls: ['Definir criterios antes de actuar.', 'Registrar fallos y desconocidos.', 'Revisión humana para competencia física.'], stopConditions: ['No hay criterio de aceptación aplicable.', 'La medición no es trazable.'] },
])

export const SERVICE_INSPECTION_POINTS: ServiceInspectionPoint[] = z.array(ServiceInspectionPointSchema).parse([
  { id: 'inspection.identity-baseline', title: L('Identidad y estado inicial'), method: L('Fotografiar anverso, reverso, marcas, posición de tija y defectos visibles antes de manipular.'), record: ['Unidad', 'fecha', 'orientación', 'marcas', 'estado funcional declarado', 'desconocidos'], noGoConditions: ['Identidad contradictoria.', 'Falta autorización o documentación esencial.'] },
  { id: 'inspection.energy-state', title: L('Estado de energía'), method: L('Determinar por procedimiento documentado si existe energía almacenada antes de liberar tren, automático o barrilete.'), record: ['Método', 'observación', 'resultado', 'fuente'], noGoConditions: ['No puede determinarse con seguridad.', 'Procedimiento no aplicable a la referencia.'] },
  { id: 'inspection.dependency-release', title: L('Dependencias liberadas'), method: L('Confirmar tornillos, muelles, palancas, ruedas y precargas asociados antes de levantar un subconjunto.'), record: ['Pieza', 'retenedores', 'interfaces', 'secuencia prevista'], noGoConditions: ['Resistencia no explicada.', 'Pivotes o dientes siguen bajo carga.'] },
  { id: 'inspection.part-condition', title: L('Estado de pieza'), method: L('Observar limpieza, desgaste, corrosión, deformación, pivotes, dientes y superficies funcionales con aumento adecuado.'), record: ['Observación', 'localización', 'imagen', 'hipótesis separada', 'confianza'], noGoConditions: ['Daño que exige reparación fuera del alcance.', 'No puede inspeccionarse sin riesgo adicional.'] },
  { id: 'inspection.cleanliness', title: L('Limpieza y compatibilidad'), method: L('Verificar que el proceso asignado es compatible y que no quedan contaminantes visibles antes de lubricar o montar.'), record: ['Proceso', 'exclusiones', 'resultado visual', 'desviaciones'], noGoConditions: ['Residuo visible.', 'Proceso o material desconocido.'] },
  { id: 'inspection.freedom-endshake', title: L('Libertad y apoyo'), method: L('Verificar libertad y apoyo con el método y límites del fabricante, sin convertir sensación subjetiva en medida.'), record: ['Conjunto', 'método', 'resultado', 'límite', 'instrumento si aplica'], noGoConditions: ['Bloqueo, roce o juego fuera de límite.', 'Límite no disponible cuando es imprescindible.'] },
  { id: 'inspection.final-function', title: L('Verificación funcional final'), method: L('Comprobar funciones en orden controlado y comparar con criterios documentados.'), record: ['Configuración', 'función', 'resultado', 'criterio', 'desviación'], noGoConditions: ['Fallo no explicado.', 'Función omitida.', 'Resultado no repetible.'] },
])

export const SERVICE_EVIDENCE_REQUIREMENTS: ServiceEvidenceRequirement[] = z.array(ServiceEvidenceRequirementSchema).parse([
  { id: 'evidence.service.baseline', title: L('Dossier de estado inicial'), medium: 'photograph', requiredFields: ['unidad', 'orientación', 'fecha', 'estado', 'escala cuando aplica'], proves: L('Qué unidad y estado visible se documentaron antes de intervenir.'), doesNotProve: L('Que el movimiento estuviera sano internamente ni que la identidad propuesta sea correcta.') },
  { id: 'evidence.service.part-map', title: L('Mapa de piezas y dependencias'), medium: 'part-map', requiredFields: ['pieza', 'contenedor', 'orientación', 'paso', 'dependencia'], proves: L('Trazabilidad de piezas y orden registrado.'), doesNotProve: L('Ausencia de daño ni corrección del procedimiento físico.') },
  { id: 'evidence.service.observation', title: L('Registro observación–hipótesis'), medium: 'note', requiredFields: ['observación', 'hipótesis separada', 'fuente', 'confianza', 'desconocidos'], proves: L('Que el razonamiento conserva la diferencia entre hecho observado e inferencia.'), doesNotProve: L('La causa final sin pruebas adicionales.') },
  { id: 'evidence.service.measurement', title: L('Registro de medición'), medium: 'measurement', requiredFields: ['magnitud', 'unidad', 'instrumento', 'resolución', 'repeticiones', 'incertidumbre', 'condiciones'], proves: L('Una lectura trazable bajo las condiciones declaradas.'), doesNotProve: L('Conformidad si no existe un límite autorizado aplicable.') },
  { id: 'evidence.service.sequence', title: L('Registro de secuencia'), medium: 'event-log', requiredFields: ['paso', 'entrada', 'acción', 'resultado', 'desviación'], proves: L('Que la simulación o plan siguió una secuencia declarada.'), doesNotProve: L('Destreza manual sobre un reloj real.') },
  { id: 'evidence.service.human-review', title: L('Revisión de competencia física'), medium: 'human-review', requiredFields: ['evaluador', 'unidad', 'procedimiento', 'criterios', 'resultado', 'fecha'], proves: L('Que una persona competente revisó la ejecución física declarada.'), doesNotProve: L('Competencia universal fuera del procedimiento y condiciones observados.') },
])

export const SERVICE_ACCEPTANCE_CRITERIA: ServiceAcceptanceCriterion[] = z.array(ServiceAcceptanceCriterionSchema).parse([
  { id: 'acceptance.service.traceable', title: L('Trazabilidad completa'), kind: 'traceability', passWhen: ['Unidad, sesión, fuentes, pasos, piezas y desviaciones quedan vinculados.'], failWhen: ['Existe una pieza, medida o decisión sin procedencia.'], requiresManufacturerLimit: false },
  { id: 'acceptance.service.safe-sequence', title: L('Secuencia segura y justificada'), kind: 'sequence', passWhen: ['Cada paso cumple condiciones de entrada y controla sus riesgos.'], failWhen: ['Se fuerza una pieza, se omite descarga o se actúa sin liberar dependencias.'], requiresManufacturerLimit: false },
  { id: 'acceptance.service.visual-condition', title: L('Condición visual documentada'), kind: 'visual', passWhen: ['Observaciones reproducibles están separadas de hipótesis.'], failWhen: ['Se declara causa o conformidad solo por apariencia.'], requiresManufacturerLimit: false },
  { id: 'acceptance.service.measured-with-limit', title: L('Medición frente a límite aplicable'), kind: 'measurement', passWhen: ['Lectura trazable e incertidumbre se comparan con un límite autorizado de la misma referencia.'], failWhen: ['Se importa un límite de otro calibre o se omite incertidumbre relevante.'], requiresManufacturerLimit: true },
  { id: 'acceptance.service.function-verified', title: L('Funciones verificadas'), kind: 'functional', passWhen: ['Todas las funciones de alcance se prueban, repiten y documentan contra criterios aplicables.'], failWhen: ['Funciona durante un instante se usa como aceptación global.'], requiresManufacturerLimit: true },
  { id: 'acceptance.service.report-complete', title: L('Informe con deuda y desconocidos'), kind: 'documentation', passWhen: ['Incluye trabajo, resultados, fallos, límites, desconocidos y próxima decisión.'], failWhen: ['Oculta una desviación o presenta una inferencia como hecho.'], requiresManufacturerLimit: false },
])

const step = (
  idValue: string,
  order: number,
  title: string,
  actions: string[],
  inspectionPointIds: string[],
  toolCapabilityIds: string[],
  hazardIds: string[],
  evidenceRequirementIds: string[],
  sourceIds: string[],
  digitalReversibility: 'restorable' | 'not-applicable' = 'restorable',
) => ({
  id: idValue,
  order,
  title: L(title),
  entryConditions: ['La unidad, el alcance y la fuente aplicable están identificados.', 'Los riesgos del paso han sido revisados.'],
  actions,
  expectedObservations: ['El resultado se documenta sin ocultar desviaciones ni desconocidos.'],
  prohibitedActions: ['Forzar para continuar.', 'Sustituir un dato ausente por una estimación no etiquetada.', 'Declarar destreza física desde una simulación.'],
  toolCapabilityIds,
  hazardIds,
  inspectionPointIds,
  evidenceRequirementIds,
  sourceIds,
  digitalReversibility,
  physicalReversibility: 'not-guaranteed' as const,
})

const etaSourceIds = ['source.eta.6497-2.communication']

export const SERVICE_PROCEDURES: ServiceProcedure[] = z.array(ServiceProcedureSchema).parse([
  {
    id: 'procedure.service.baseline-and-authority',
    title: L('Identificar, documentar y decidir autoridad'),
    purpose: L('Crear un estado inicial reproducible y elegir la documentación aplicable antes de tocar el mecanismo.'),
    scope: 'physical-work-preparation', prerequisiteProcedureIds: [], sourceIds: etaSourceIds,
    steps: [
      step('step.service.baseline.identify', 1, 'Asignar identidad provisional', ['Registrar unidad, marcas, calibre propuesto, variante y contradicciones.'], ['inspection.identity-baseline'], ['tool.capability.document', 'tool.capability.inspect'], ['hazard.mixed-parts', 'hazard.false-acceptance'], ['evidence.service.baseline', 'evidence.service.observation'], etaSourceIds),
      step('step.service.baseline.scope', 2, 'Definir alcance y no objetivos', ['Enumerar funciones incluidas, exclusiones, criterios disponibles y decisiones que requieren documentación adicional.'], ['inspection.identity-baseline'], ['tool.capability.document'], ['hazard.false-acceptance'], ['evidence.service.observation'], etaSourceIds),
      step('step.service.baseline.energy', 3, 'Determinar el estado de energía', ['Aplicar solo el procedimiento documentado para comprobar o descargar la energía antes de desmontar.'], ['inspection.energy-state'], ['tool.capability.hold', 'tool.capability.drive-screw'], ['hazard.stored-energy', 'hazard.part-launch'], ['evidence.service.sequence'], etaSourceIds),
    ],
    acceptanceCriterionIds: ['acceptance.service.traceable', 'acceptance.service.safe-sequence'],
    physicalBoundary: L('La actividad digital prepara y evalúa el plan. Una descarga o apertura física requiere supervisión y procedimiento de la referencia.'), finalHumanReviewRequired: true,
  },
  {
    id: 'procedure.service.dependency-led-disassembly',
    title: L('Desmontaje guiado por dependencias'),
    purpose: L('Retirar subconjuntos conservando identidad, orientación, seguridad y relaciones de montaje.'),
    scope: 'documented-calibre', prerequisiteProcedureIds: ['procedure.service.baseline-and-authority'], sourceIds: etaSourceIds,
    steps: [
      step('step.service.disassembly.map', 1, 'Construir el mapa de dependencias', ['Relacionar cada puente, retenedor, muelle, rueda y tornillo con lo que debe liberarse antes.'], ['inspection.dependency-release'], ['tool.capability.document', 'tool.capability.inspect'], ['hazard.pivot-damage', 'hazard.part-launch'], ['evidence.service.part-map'], etaSourceIds),
      step('step.service.disassembly.release', 2, 'Liberar y levantar sin carga', ['Retirar retenedores en el orden documentado, comprobar libertad y elevar el subconjunto paralelo.'], ['inspection.dependency-release', 'inspection.part-condition'], ['tool.capability.hold', 'tool.capability.drive-screw', 'tool.capability.handle-parts'], ['hazard.pivot-damage', 'hazard.part-launch'], ['evidence.service.sequence', 'evidence.service.part-map'], etaSourceIds),
      step('step.service.disassembly.store', 3, 'Conservar identidad y orientación', ['Asignar cada pieza a su contenedor, paso, cara y unidad antes de continuar.'], ['inspection.part-condition'], ['tool.capability.document', 'tool.capability.handle-parts'], ['hazard.mixed-parts'], ['evidence.service.part-map', 'evidence.service.observation'], etaSourceIds),
    ],
    acceptanceCriterionIds: ['acceptance.service.traceable', 'acceptance.service.safe-sequence', 'acceptance.service.visual-condition'],
    physicalBoundary: L('El orden digital es reversible; una pieza doblada, marcada o perdida no lo es. El laboratorio no certifica manipulación física.'), finalHumanReviewRequired: true,
  },
  {
    id: 'procedure.service.cleaning-lubrication-plan',
    title: L('Plan de limpieza y lubricación'),
    purpose: L('Decidir procesos por material y puntos de lubricación por fuente sin ejecutar una receta universal.'),
    scope: 'physical-work-preparation', prerequisiteProcedureIds: ['procedure.service.dependency-led-disassembly'], sourceIds: etaSourceIds,
    steps: [
      step('step.service.cleaning.classify', 1, 'Clasificar material, contaminante y exclusiones', ['Separar componentes sensibles, identificar material y asignar solo procesos compatibles.'], ['inspection.part-condition'], ['tool.capability.inspect', 'tool.capability.clean-plan'], ['hazard.chemical-material'], ['evidence.service.observation', 'evidence.service.part-map'], etaSourceIds),
      step('step.service.cleaning.verify', 2, 'Verificar limpieza antes de lubricar', ['Inspeccionar residuos, superficies y daños; registrar desviaciones antes de cualquier lubricación.'], ['inspection.cleanliness'], ['tool.capability.inspect', 'tool.capability.clean-plan'], ['hazard.chemical-material', 'hazard.false-acceptance'], ['evidence.service.observation'], etaSourceIds),
      step('step.service.lubrication.map', 3, 'Crear mapa punto–producto–cantidad', ['Vincular cada punto a producto, cantidad cualitativa o especificada, método, acceso y fuente de la referencia.'], ['inspection.cleanliness'], ['tool.capability.lubricate-plan', 'tool.capability.document'], ['hazard.false-acceptance'], ['evidence.service.part-map'], etaSourceIds),
    ],
    acceptanceCriterionIds: ['acceptance.service.traceable', 'acceptance.service.visual-condition', 'acceptance.service.report-complete'],
    physicalBoundary: L('La Academia enseña a construir el plan; no prescribe productos o cantidades universales ni declara limpieza o lubricación física completadas.'), finalHumanReviewRequired: true,
  },
  {
    id: 'procedure.service.assembly-and-verification',
    title: L('Montaje, verificación y aceptación'),
    purpose: L('Montar por dependencias, comprobar libertad por etapas y cerrar con criterios verificables.'),
    scope: 'documented-calibre', prerequisiteProcedureIds: ['procedure.service.cleaning-lubrication-plan'], sourceIds: etaSourceIds,
    steps: [
      step('step.service.assembly.supports', 1, 'Montar apoyos sin forzar', ['Colocar móviles y puente, verificar entrada de pivotes y asentar sin usar el tornillo como prensa.'], ['inspection.dependency-release', 'inspection.freedom-endshake'], ['tool.capability.hold', 'tool.capability.handle-parts', 'tool.capability.drive-screw'], ['hazard.pivot-damage'], ['evidence.service.sequence', 'evidence.service.observation'], etaSourceIds),
      step('step.service.assembly.incremental', 2, 'Verificar por etapas', ['Comprobar libertad y función tras cada subconjunto antes de ocultarlo con el siguiente.'], ['inspection.freedom-endshake'], ['tool.capability.inspect', 'tool.capability.measure'], ['hazard.pivot-damage', 'hazard.false-acceptance'], ['evidence.service.measurement', 'evidence.service.sequence'], etaSourceIds),
      step('step.service.assembly.final', 3, 'Ejecutar matriz funcional final', ['Probar cuerda, puesta en hora, indicación, calendario, automático y complicaciones solo si están en alcance.'], ['inspection.final-function'], ['tool.capability.document', 'tool.capability.inspect', 'tool.capability.measure'], ['hazard.false-acceptance'], ['evidence.service.measurement', 'evidence.service.human-review'], etaSourceIds),
    ],
    acceptanceCriterionIds: ['acceptance.service.safe-sequence', 'acceptance.service.measured-with-limit', 'acceptance.service.function-verified'],
    physicalBoundary: L('Una simulación puede demostrar el orden y la decisión. Solo una ejecución física revisada puede aportar evidencia de destreza manual.'), finalHumanReviewRequired: true,
  },
  {
    id: 'procedure.service.diagnosis-and-report',
    title: L('Diagnóstico causal e informe de servicio'),
    purpose: L('Localizar una interrupción mediante pruebas que discriminan hipótesis y conservar resultados, deuda y desconocidos.'),
    scope: 'generic-mechanical', prerequisiteProcedureIds: ['procedure.service.baseline-and-authority'], sourceIds: etaSourceIds,
    steps: [
      step('step.service.diagnosis.symptom', 1, 'Definir síntoma y condiciones', ['Registrar estado, entrada, resultado, repetibilidad y configuración sin nombrar una causa todavía.'], ['inspection.identity-baseline', 'inspection.final-function'], ['tool.capability.document', 'tool.capability.inspect'], ['hazard.false-acceptance'], ['evidence.service.observation'], etaSourceIds),
      step('step.service.diagnosis.discriminate', 2, 'Diseñar prueba discriminante', ['Enumerar hipótesis y elegir la observación menos invasiva que produciría resultados diferentes entre ellas.'], ['inspection.part-condition', 'inspection.freedom-endshake'], ['tool.capability.inspect', 'tool.capability.measure'], ['hazard.pivot-damage', 'hazard.false-acceptance'], ['evidence.service.measurement', 'evidence.service.observation'], etaSourceIds),
      step('step.service.diagnosis.report', 3, 'Cerrar informe sin certeza artificial', ['Documentar evidencia, hipótesis apoyadas o refutadas, intervención, resultados, deuda y siguiente decisión.'], ['inspection.final-function'], ['tool.capability.document'], ['hazard.false-acceptance'], ['evidence.service.human-review', 'evidence.service.observation'], etaSourceIds, 'not-applicable'),
    ],
    acceptanceCriterionIds: ['acceptance.service.visual-condition', 'acceptance.service.function-verified', 'acceptance.service.report-complete'],
    physicalBoundary: L('La inferencia causal queda limitada por las pruebas realizadas; el informe no convierte una simulación ni una observación aislada en diagnóstico físico completo.'), finalHumanReviewRequired: true,
  },
])

export function serviceProcedure(idValue: string): ServiceProcedure | undefined {
  return SERVICE_PROCEDURES.find(({ id }) => id === idValue)
}

export function validateServiceProcedureReferences(procedure: ServiceProcedure): string[] {
  const knownTools = new Set(SERVICE_TOOL_CAPABILITIES.map(({ id }) => id))
  const knownHazards = new Set(SERVICE_HAZARDS.map(({ id }) => id))
  const knownInspections = new Set(SERVICE_INSPECTION_POINTS.map(({ id }) => id))
  const knownEvidence = new Set(SERVICE_EVIDENCE_REQUIREMENTS.map(({ id }) => id))
  const knownCriteria = new Set(SERVICE_ACCEPTANCE_CRITERIA.map(({ id }) => id))
  const errors: string[] = []
  for (const stepValue of procedure.steps) {
    for (const value of stepValue.toolCapabilityIds) if (!knownTools.has(value)) errors.push(`${stepValue.id}: herramienta desconocida ${value}`)
    for (const value of stepValue.hazardIds) if (!knownHazards.has(value)) errors.push(`${stepValue.id}: riesgo desconocido ${value}`)
    for (const value of stepValue.inspectionPointIds) if (!knownInspections.has(value)) errors.push(`${stepValue.id}: inspección desconocida ${value}`)
    for (const value of stepValue.evidenceRequirementIds) if (!knownEvidence.has(value)) errors.push(`${stepValue.id}: evidencia desconocida ${value}`)
  }
  for (const value of procedure.acceptanceCriterionIds) if (!knownCriteria.has(value)) errors.push(`${procedure.id}: criterio desconocido ${value}`)
  return errors
}
