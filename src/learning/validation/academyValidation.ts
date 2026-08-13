import { z } from 'zod'

const localized = z.object({ es: z.string().min(1), en: z.string().min(1).optional() }).strict()
const identifiedText = z.object({ id: z.string().min(3), title: z.string().min(1), detail: z.string().min(1) }).strict()

export const ValidationParticipantProfileSchema = z.object({
  id: z.string().min(3),
  title: localized,
  inclusion: z.array(z.string().min(1)).min(1),
  exclusion: z.array(z.string().min(1)).default([]),
  roleBoundary: z.string().min(1),
}).strict()

export const AccessibilityCheckSchema = z.object({
  id: z.string().min(3),
  title: localized,
  observable: z.string().min(1),
  passWhen: z.array(z.string().min(1)).min(1),
  standardReference: z.string().min(1),
}).strict()

export const ValidationProtocolSchema = z.object({
  id: z.string().min(3),
  title: localized,
  dimensions: z.array(z.enum([
    'watchmaker-review',
    'beginner-usability',
    'calibre-transfer',
    'accessibility',
    'deferred-retention',
  ])).min(1),
  purpose: z.string().min(1),
  participantProfileIds: z.array(z.string().min(3)).min(1),
  tasks: z.array(identifiedText).min(1),
  transferCases: z.array(identifiedText).default([]),
  accessibilityCheckIds: z.array(z.string().min(3)).default([]),
  retentionIntervalsDays: z.array(z.number().int().positive()).default([]),
  evidenceRequirements: z.array(identifiedText).min(1),
  acceptanceCriteria: z.array(identifiedText).min(1),
  adverseFindings: z.array(z.string().min(1)).min(1),
  independenceRules: z.array(z.string().min(1)).min(1),
  sourceIds: z.array(z.string().min(3)).min(1),
}).strict().superRefine((protocol, context) => {
  if (protocol.dimensions.includes('calibre-transfer') && protocol.transferCases.length < 2) {
    context.addIssue({ code: 'custom', path: ['transferCases'], message: 'La transferencia exige al menos dos casos.' })
  }
  if (protocol.dimensions.includes('deferred-retention') && protocol.retentionIntervalsDays.length < 2) {
    context.addIssue({ code: 'custom', path: ['retentionIntervalsDays'], message: 'La retención exige más de una demora.' })
  }
})

export type ValidationParticipantProfile = z.infer<typeof ValidationParticipantProfileSchema>
export type AccessibilityCheck = z.infer<typeof AccessibilityCheckSchema>
export type ValidationProtocol = z.infer<typeof ValidationProtocolSchema>

export const VALIDATION_PARTICIPANT_PROFILES: ValidationParticipantProfile[] = ValidationParticipantProfileSchema.array().parse([
  { id: 'participant.validation.watchmaker-reviewer', title: { es: 'Profesional relojero revisor' }, inclusion: ['Experiencia demostrable en el tipo de movimiento o intervención revisados.', 'Independencia respecto a la decisión evaluada cuando sea posible.'], exclusion: ['Revisión exclusivamente del propio autor sin contrapeso.'], roleBoundary: 'Revisa evidencia y ejecución observada; no transfiere automáticamente su competencia al alumno.' },
  { id: 'participant.validation.beginner', title: { es: 'Persona principiante representativa' }, inclusion: ['No ha recibido formación específica sobre el flujo que se prueba.', 'Representa el contexto y capacidades previstos.'], exclusion: ['Participó en el diseño o conoce la respuesta esperada.'], roleBoundary: 'Prueba comprensibilidad y uso inicial; no valida exactitud relojera.' },
  { id: 'participant.validation.learner', title: { es: 'Alumno en evaluación independiente' }, inclusion: ['Completó la preparación declarada.', 'Realiza el intento sin ayuda no autorizada.'], exclusion: ['Repite exactamente el ejemplo resuelto.'], roleBoundary: 'Produce evidencia de aprendizaje; una respuesta digital no acredita destreza física.' },
  { id: 'participant.validation.accessibility-reviewer', title: { es: 'Revisión de accesibilidad' }, inclusion: ['Comprueba teclado, texto, contraste, alternativas y movimiento reducido.', 'Incluye evaluación humana además de automatización.'], exclusion: [], roleBoundary: 'Evalúa la experiencia y barreras observables; no representa todas las necesidades posibles.' },
])

export const ACCESSIBILITY_CHECKS: AccessibilityCheck[] = AccessibilityCheckSchema.array().parse([
  { id: 'accessibility.validation.keyboard', title: { es: 'Operación completa con teclado' }, observable: 'Todas las acciones, estados y salidas son alcanzables, visibles y ordenadas sin puntero.', passWhen: ['Sin trampa de foco.', 'Nombre y estado accesibles.', 'Orden de foco coherente.'], standardReference: 'WCAG 2.2 · operable' },
  { id: 'accessibility.validation.text-scale', title: { es: 'Texto ampliado y redistribución' }, observable: 'El contenido sigue siendo legible y operable con ampliación y ventanas estrechas.', passWhen: ['Sin solapamiento.', 'Sin pérdida de controles o texto.', 'Lectura en una columna útil cuando sea necesario.'], standardReference: 'WCAG 2.2 · perceptible' },
  { id: 'accessibility.validation.contrast-color', title: { es: 'Contraste y señales no basadas solo en color' }, observable: 'Estado, autoridad, riesgo y resultado conservan texto o forma además del color.', passWhen: ['Contraste suficiente.', 'Color no es la única señal.', 'Foco visible.'], standardReference: 'WCAG 2.2 · distinguible' },
  { id: 'accessibility.validation.reduced-motion', title: { es: 'Movimiento reducido y estados discretos' }, observable: 'Toda animación esencial tiene pausa o alternativa de estados y no bloquea la actividad.', passWhen: ['Preferencia respetada.', 'Significado equivalente.', 'Sin movimiento automático imprescindible.'], standardReference: 'WCAG 2.2 · interacción y movimiento' },
  { id: 'accessibility.validation.textual-alternative', title: { es: 'Alternativa textual equivalente' }, observable: 'Modelos, diagramas, casos y procedimientos pueden recorrerse con nombres, relaciones y estados.', passWhen: ['Misma decisión posible.', 'Entidades y relaciones identificables.', 'Resultado anunciado.'], standardReference: 'WCAG 2.2 · alternativas y estructura' },
])

const item = (id: string, title: string, detail: string) => ({ id, title, detail })

export const VALIDATION_PROTOCOLS: ValidationProtocol[] = ValidationProtocolSchema.array().parse([
  {
    id: 'validation.protocol.watchmaker-review', title: { es: 'Revisión relojera independiente' }, dimensions: ['watchmaker-review'],
    purpose: 'Someter decisiones, secuencias, montajes y hallazgos a una revisión profesional con alcance y configuración fijados.',
    participantProfileIds: ['participant.validation.watchmaker-reviewer', 'participant.validation.learner'],
    tasks: [item('validation-task.watchmaker.design-review', 'Revisar el dossier', 'Comprobar requisitos, fuentes, interfaces, riesgos y pruebas.'), item('validation-task.watchmaker.observed-execution', 'Observar una ejecución autorizada', 'Registrar secuencia, manejo, inspecciones, errores y recuperación sin intervenir salvo por seguridad.')],
    evidenceRequirements: [item('validation-evidence.watchmaker.configuration', 'Configuración fijada', 'Unidad, revisión, herramientas, fuentes y estado inicial.'), item('validation-evidence.watchmaker.findings', 'Hallazgos firmados', 'Criterio, evidencia, severidad, responsable y resolución.')],
    acceptanceCriteria: [item('validation-acceptance.watchmaker.no-critical-open', 'Sin hallazgos críticos abiertos', 'Todo riesgo crítico está resuelto o bloquea la liberación.'), item('validation-acceptance.watchmaker.traceable', 'Trazabilidad completa', 'Conclusiones enlazan observación, fuente, criterio y configuración.')],
    adverseFindings: ['Intervención insegura.', 'Identidad o revisión inciertas.', 'Ajuste o conclusión sin evidencia.', 'Diferencia entre dossier y unidad no gestionada.'],
    independenceRules: ['El revisor no sustituye la respuesta del alumno.', 'La ayuda sustantiva se registra y obliga a repetir la demostración independientemente.'],
    sourceIds: ['source.eta.6497-2.communication', 'source.miyota.8215.official', 'source.iso.14253-1'],
  },
  {
    id: 'validation.protocol.beginner-usability', title: { es: 'Pruebas con principiantes' }, dimensions: ['beginner-usability'],
    purpose: 'Detectar si una persona sin conocimiento previo puede orientarse, comprender el siguiente paso, corregir errores y explicar el resultado.',
    participantProfileIds: ['participant.validation.beginner'],
    tasks: [item('validation-task.beginner.find-start', 'Encontrar por dónde empezar', 'Entrar en Academia y localizar la explicación adecuada sin instrucciones externas.'), item('validation-task.beginner.complete-loop', 'Completar una unidad de aprendizaje', 'Leer teoría, abrir práctica, responder, interpretar feedback y guardar.'), item('validation-task.beginner.recover', 'Recuperar una sesión', 'Reconocer una sesión pendiente y elegir conscientemente cómo continuar.')],
    evidenceRequirements: [item('validation-evidence.beginner.observation', 'Registro de observación', 'Tiempo, ruta, dudas, errores, comentarios y ayudas.'), item('validation-evidence.beginner.comprehension', 'Explicación posterior', 'La persona describe qué aprendió y qué haría después.')],
    acceptanceCriteria: [item('validation-acceptance.beginner.task-success', 'Tareas principales completables', 'La persona completa sin rescate las acciones críticas.'), item('validation-acceptance.beginner.no-hidden-prerequisite', 'Sin conocimiento oculto', 'Toda pregunta evaluada tiene teoría o diagnóstico anterior accesible.')],
    adverseFindings: ['La persona debe adivinar una respuesta no enseñada.', 'Un control parece funcionar pero no cambia estado.', 'El lenguaje interno impide decidir.', 'La recuperación no es comprensible.'],
    independenceRules: ['El moderador no enseña la interfaz durante la tarea.', 'Las ayudas se dan con un guion y se registran.', 'No se convierte un ensayo con una persona en validez universal.'],
    sourceIds: ['source.iso.9241-11', 'source.iso.9241-210', 'source.nist.human-centered-design'],
  },
  {
    id: 'validation.protocol.calibre-transfer', title: { es: 'Transferencia entre calibres y arquitecturas' }, dimensions: ['calibre-transfer'],
    purpose: 'Comprobar que el alumno aplica relaciones y método a casos distintos de los ejemplos sin transferir cifras, geometría o procedimientos.',
    participantProfileIds: ['participant.validation.learner', 'participant.validation.watchmaker-reviewer'],
    tasks: [item('validation-task.transfer.identify-function', 'Reconstruir una cadena funcional nueva', 'Identificar entrada, relaciones, salida y desconocidos.'), item('validation-task.transfer.plan-evidence', 'Proponer verificación', 'Elegir fuentes, observaciones o mediciones que discriminen hipótesis.')],
    transferCases: [item('validation-case.transfer.eta6497', 'ETA 6497-2', 'Caso de pequeño segundero, cuerda manual y puentes documentados.'), item('validation-case.transfer.miyota8215', 'MIYOTA 8215', 'Caso automático con fecha y ensamblaje estructural instalado.'), item('validation-case.transfer.seiko6138a', 'Seiko 6138A', 'Caso documental de cronógrafo automático y rueda de pilares.')],
    evidenceRequirements: [item('validation-evidence.transfer.case-matrix', 'Matriz de casos', 'Hechos, relaciones, diferencias, fuentes y desconocidos por caso.'), item('validation-evidence.transfer.novel-explanation', 'Explicación sin plantilla', 'Respuesta producida sobre un caso reservado.')],
    acceptanceCriteria: [item('validation-acceptance.transfer.no-false-transfer', 'Sin transferencia indebida', 'No copia dimensiones, lubricación, secuencia ni ajuste entre referencias.'), item('validation-acceptance.transfer.causal', 'Causalidad defendible', 'La explicación conserva entrada, interfaces, estados y resultado.')],
    adverseFindings: ['Identificación por parecido.', 'Cifra o procedimiento copiados entre calibres.', 'Confianza alta sin fuente primaria.', 'Desconocidos ocultos.'],
    independenceRules: ['El caso final no aparece en el ejemplo resuelto.', 'No se muestran soluciones durante el intento.', 'Una pista obliga a un nuevo caso independiente.'],
    sourceIds: ['source.eta.6497-2.communication', 'source.miyota.8215.official', 'source.seiko.6138a.technical-guide'],
  },
  {
    id: 'validation.protocol.accessibility', title: { es: 'Accesibilidad y equivalencia de interacción' }, dimensions: ['accessibility'],
    purpose: 'Comprobar que leer, practicar, responder, recuperar y revisar evidencia siguen siendo posibles con distintas formas de acceso.',
    participantProfileIds: ['participant.validation.accessibility-reviewer', 'participant.validation.beginner'],
    tasks: [item('validation-task.accessibility.route', 'Recorrer una ruta', 'Usar navegación, teoría y práctica con teclado y texto ampliado.'), item('validation-task.accessibility.workspace', 'Completar un workspace', 'Resolver con alternativa textual y movimiento reducido.'), item('validation-task.accessibility.feedback', 'Interpretar estado y feedback', 'Distinguir correcto, pendiente, límite y siguiente acción sin depender del color.')],
    accessibilityCheckIds: ACCESSIBILITY_CHECKS.map(({ id }) => id),
    evidenceRequirements: [item('validation-evidence.accessibility.matrix', 'Matriz de comprobaciones', 'Viewport, modo, control, criterio, resultado y captura.'), item('validation-evidence.accessibility.human-findings', 'Hallazgos humanos', 'Barreras, impacto, reproducción y recomendación.')],
    acceptanceCriteria: [item('validation-acceptance.accessibility.critical-path', 'Caminos críticos equivalentes', 'Aprender, responder, guardar y recuperar son posibles.'), item('validation-acceptance.accessibility.no-critical', 'Sin barrera crítica abierta', 'Cualquier barrera que impida completar una tarea bloquea liberación.')],
    adverseFindings: ['Control sin nombre.', 'Solapamiento o pérdida de contenido.', 'Movimiento imprescindible.', 'Color como única señal.', 'Foco invisible o atrapado.'],
    independenceRules: ['Automatización complementa, no sustituye, la evaluación humana.', 'Se prueba más de un tamaño y modo de interacción.', 'Las adaptaciones no penalizan la evaluación.'],
    sourceIds: ['source.w3c.wcag22', 'source.iso.9241-11', 'source.nist.human-centered-design'],
  },
  {
    id: 'validation.protocol.deferred-retention', title: { es: 'Retención diferida y puerta de liberación' }, dimensions: ['deferred-retention', 'calibre-transfer', 'accessibility'],
    purpose: 'Verificar que el aprendizaje puede recuperarse después de una demora, transferirse a otro caso y mantenerse accesible antes de declarar una ruta consolidada.',
    participantProfileIds: ['participant.validation.learner', 'participant.validation.watchmaker-reviewer', 'participant.validation.accessibility-reviewer'],
    tasks: [item('validation-task.retention.free-recall', 'Recuperación libre', 'Reconstruir el método sin releer inmediatamente.'), item('validation-task.retention.transfer-case', 'Caso de transferencia diferida', 'Aplicar el criterio a una arquitectura reservada.'), item('validation-task.retention.release-review', 'Revisión de liberación', 'Integrar evidencia, hallazgos, accesibilidad y riesgos.')],
    transferCases: [item('validation-case.retention.eta2824', 'ETA 2824-2 reservado', 'Automático bidireccional con fecha.'), item('validation-case.retention.seiko42', 'Seiko 42 reservado', 'Carga por palanca de uñas.')],
    accessibilityCheckIds: ACCESSIBILITY_CHECKS.map(({ id }) => id),
    retentionIntervalsDays: [1, 7, 21],
    evidenceRequirements: [item('validation-evidence.retention.attempts', 'Intentos separados', 'Fecha, demora, caso, ayudas, respuesta y confianza.'), item('validation-evidence.retention.release-record', 'Acta de liberación', 'Criterios, hallazgos, excepciones y decisión humana.')],
    acceptanceCriteria: [item('validation-acceptance.retention.independent', 'Recuperación independiente', 'Al menos un intento diferido sin ayudas sustantivas.'), item('validation-acceptance.retention.transfer', 'Transferencia diferida', 'El criterio se aplica sin copiar el ejemplo.'), item('validation-acceptance.retention.release', 'Liberación conservadora', 'No quedan hallazgos críticos de exactitud, seguridad o accesibilidad.')],
    adverseFindings: ['Solo reconoce la respuesta al verla.', 'Falla el caso de transferencia.', 'Una adaptación rompe el acceso.', 'Un hallazgo crítico se acepta por calendario.'],
    independenceRules: ['Los intentos usan sesiones y casos separados.', 'Releer reinicia la condición de recuperación independiente.', 'La decisión final es humana y conserva objeciones.'],
    sourceIds: ['source.roediger-karpicke.2006', 'source.cepeda.2008', 'source.w3c.wcag22', 'source.iso.9241-11'],
  },
])

export function validationProtocol(id: string): ValidationProtocol | undefined {
  return VALIDATION_PROTOCOLS.find((protocol) => protocol.id === id)
}

export function validateValidationCatalog(): string[] {
  const participants = new Set(VALIDATION_PARTICIPANT_PROFILES.map(({ id }) => id))
  const checks = new Set(ACCESSIBILITY_CHECKS.map(({ id }) => id))
  return VALIDATION_PROTOCOLS.flatMap((protocol) => [
    ...protocol.participantProfileIds.filter((id) => !participants.has(id)).map((id) => `${protocol.id}: participante desconocido ${id}`),
    ...protocol.accessibilityCheckIds.filter((id) => !checks.has(id)).map((id) => `${protocol.id}: comprobación desconocida ${id}`),
  ])
}
