import { z } from 'zod'

const localized = z.object({ es: z.string().min(1), en: z.string().min(1).optional() }).strict()
const identifiedText = z.object({ id: z.string().min(3), title: z.string().min(1), detail: z.string().min(1) }).strict()

export const PersonalWatchDesignLevelSchema = z.object({
  id: z.enum(['acquired-movement-watch', 'controlled-architecture-modification', 'own-movement']),
  order: z.number().int().positive(),
  title: localized,
  outcome: z.string().min(1),
  allowedClaims: z.array(z.string().min(1)).min(1),
  forbiddenClaims: z.array(z.string().min(1)).min(1),
}).strict()

export const PersonalWatchDesignStageSchema = z.object({
  id: z.string().min(3),
  title: localized,
  routeLevel: z.enum(['acquired-movement-watch', 'controlled-architecture-modification', 'own-movement']),
  gate: z.enum(['requirements', 'concept', 'architecture', 'detail', 'prototype-plan', 'release']),
  purpose: z.string().min(1),
  inputs: z.array(identifiedText).min(1),
  interfaces: z.array(identifiedText).min(1),
  constraints: z.array(identifiedText).min(1),
  deliverables: z.array(identifiedText).min(1),
  verificationPlans: z.array(identifiedText).min(1),
  alternativesMinimum: z.number().int().min(2).max(12),
  gateQuestions: z.array(z.string().min(1)).min(3),
  exitCriteria: z.array(z.string().min(1)).min(2),
  stopConditions: z.array(z.string().min(1)).min(1),
  sourceIds: z.array(z.string().min(3)).min(1),
}).strict()

export type PersonalWatchDesignLevel = z.infer<typeof PersonalWatchDesignLevelSchema>
export type PersonalWatchDesignStage = z.infer<typeof PersonalWatchDesignStageSchema>

export const PERSONAL_WATCH_DESIGN_LEVELS: PersonalWatchDesignLevel[] = PersonalWatchDesignLevelSchema.array().parse([
  {
    id: 'acquired-movement-watch', order: 1, title: { es: 'Primer reloj con movimiento adquirido' },
    outcome: 'Definir y validar caja, esfera, agujas, sujeción, corona, tija y experiencia de uso alrededor de un movimiento documentado.',
    allowedClaims: ['Integración diseñada contra documentación declarada.', 'Interfaces y riesgos identificados.', 'Prototipo planificado con criterios de aceptación.'],
    forbiddenClaims: ['Movimiento propio.', 'Estanqueidad, fiabilidad o fabricación acreditadas sin ensayo.', 'Compatibilidad universal con la familia.'],
  },
  {
    id: 'controlled-architecture-modification', order: 2, title: { es: 'Modificación arquitectónica controlada' },
    outcome: 'Cambiar una función o interfaz manteniendo una línea base, hipótesis, reversibilidad y plan de verificación explícitos.',
    allowedClaims: ['Propuesta de modificación trazable.', 'Impactos y dependencias analizados.', 'Criterios de retorno y comparación definidos.'],
    forbiddenClaims: ['Mejora garantizada.', 'Intercambiabilidad sin medición.', 'Validación física por simulación.'],
  },
  {
    id: 'own-movement', order: 3, title: { es: 'Arquitectura de movimiento propio' },
    outcome: 'Construir un pliego, una arquitectura causal, presupuestos y un dossier de diseño preparado para revisiones y prototipos.',
    allowedClaims: ['Arquitectura conceptual coherente.', 'Presupuestos y supuestos declarados.', 'Plan de fabricación y validación preparado.'],
    forbiddenClaims: ['Movimiento fabricable o fiable sin revisión detallada.', 'Escape, espiral, tolerancias o lubricación validados por analogía.', 'Competencia relojera acreditada automáticamente.'],
  },
])

const item = (id: string, title: string, detail: string) => ({ id, title, detail })

export const PERSONAL_WATCH_DESIGN_STAGES: PersonalWatchDesignStage[] = PersonalWatchDesignStageSchema.array().parse([
  {
    id: 'design-stage.personal-watch.requirements', title: { es: 'Pliego, usuario y arquitectura del producto' }, routeLevel: 'acquired-movement-watch', gate: 'requirements',
    purpose: 'Traducir intención, usuario, contexto y límites en requisitos verificables antes de dibujar una caja.',
    inputs: [item('design-input.personal.intent', 'Intención del reloj', 'Uso, carácter, usuario y razón de existir.'), item('design-input.personal.baseline', 'Línea base técnica', 'Movimiento, documentación, capacidades y límites conocidos.')],
    interfaces: [item('design-interface.personal.user-watch', 'Persona–reloj', 'Lectura, ajuste, colocación, comodidad y error.'), item('design-interface.personal.watch-environment', 'Reloj–entorno', 'Agua, golpes, magnetismo, temperatura y mantenimiento previstos.')],
    constraints: [item('design-constraint.personal.claims', 'Declaraciones permitidas', 'No prometer resistencia, precisión ni vida sin programa de validación.'), item('design-constraint.personal.scope', 'Alcance controlado', 'Separar deseo, requisito, objetivo y no objetivo.')],
    deliverables: [item('design-deliverable.personal.requirements', 'Pliego verificable', 'Requisitos con identificador, prioridad, fuente y método de prueba.'), item('design-deliverable.personal.risk-register', 'Registro inicial de riesgos', 'Riesgo, causa, efecto, control y evidencia pendiente.')],
    verificationPlans: [item('design-verification.personal.requirements-review', 'Revisión de requisitos', 'Comprobar claridad, conflictos, verificabilidad y trazabilidad.')], alternativesMinimum: 3,
    gateQuestions: ['¿Quién usará el reloj y en qué contexto?', '¿Qué se medirá para aceptar cada requisito?', '¿Qué promesas quedan explícitamente fuera?'],
    exitCriteria: ['Cada requisito tiene método de verificación.', 'Contradicciones y desconocidos están registrados.'],
    stopConditions: ['Requisito crítico no verificable.', 'Movimiento o contexto de uso sin identificar.'],
    sourceIds: ['source.iso.9241-11', 'source.iso.9241-210', 'source.w3c.wcag22'],
  },
  {
    id: 'design-stage.personal-watch.acquired-movement', title: { es: 'Integración de un movimiento adquirido' }, routeLevel: 'acquired-movement-watch', gate: 'concept',
    purpose: 'Diseñar el reloj alrededor de la documentación y la unidad real del movimiento elegido sin generalizar a su familia.',
    inputs: [item('design-input.personal.movement-docs', 'Documentación del movimiento', 'Plano, altura, tija, agujas, esfera, fijación y revisión aplicable.'), item('design-input.personal.movement-unit', 'Unidad física o muestra', 'Estado, medidas permitidas y contradicciones con la documentación.')],
    interfaces: [item('design-interface.personal.movement-case', 'Movimiento–caja', 'Alojamiento, anillo, fijación, tija y acceso.'), item('design-interface.personal.movement-display', 'Movimiento–indicación', 'Esfera, pies, fecha, tubos y alturas de agujas.')],
    constraints: [item('design-constraint.personal.no-family-transfer', 'No transferir por familia', 'Toda cifra conserva referencia y revisión.'), item('design-constraint.personal.axial-stack', 'Pila axial', 'Movimiento, esfera, agujas, cristal, fondo y holguras deben cerrar juntas.')],
    deliverables: [item('design-deliverable.personal.interface-control', 'Documento de control de interfaces', 'Cada interfaz con dato, procedencia, tolerancia y responsable.'), item('design-deliverable.personal.packaging-study', 'Estudio de empaquetado', 'Secciones radial y axial con peores casos.')],
    verificationPlans: [item('design-verification.personal.fit-prototype', 'Prototipo de integración', 'Comprobar sujeción, tija, corona, esfera, agujas y servicio sin dañar la unidad.')], alternativesMinimum: 3,
    gateQuestions: ['¿Qué datos son oficiales y cuáles medidos?', '¿Qué interfaz domina el diámetro y cuál la altura?', '¿Cómo se desmontará sin cargar esfera, tija o movimiento?'],
    exitCriteria: ['Interfaces críticas tienen dato y regla de decisión.', 'Existe una alternativa de integración y una razón para descartarla.'],
    stopConditions: ['Cifra crítica inferida de una imagen.', 'Pila axial sin margen o método de verificación.'],
    sourceIds: ['source.miyota.8215.official', 'source.eta.6497-2.communication', 'source.iso.1101'],
  },
  {
    id: 'design-stage.personal-watch.external-components', title: { es: 'Caja, esfera, agujas y experiencia de uso' }, routeLevel: 'acquired-movement-watch', gate: 'detail',
    purpose: 'Cerrar la arquitectura exterior como un sistema funcional, fabricable, legible, mantenible y validable.',
    inputs: [item('design-input.personal.interface-control', 'Control de interfaces aprobado', 'Límites radiales, axiales y funcionales.'), item('design-input.personal.visual-language', 'Lenguaje visual', 'Jerarquía, proporción, material, contraste y acabado.')],
    interfaces: [item('design-interface.personal.case-stack', 'Conjunto de caja', 'Carrura, bisel, cristal, fondo, corona, tubo, asas y juntas.'), item('design-interface.personal.readability', 'Sistema de lectura', 'Esfera, índices, agujas, fecha, luminiscencia y contraste.')],
    constraints: [item('design-constraint.personal.manufacturing-route', 'Ruta de fabricación', 'Cada forma debe tener proceso, datum, inspección y acabado plausibles.'), item('design-constraint.personal.accessibility', 'Accesibilidad', 'No depender solo de color, tamaño mínimo o destreza extrema sin alternativa.')],
    deliverables: [item('design-deliverable.personal.external-set', 'Dossier de componentes exteriores', 'Planos, materiales, acabados, interfaces y revisión.'), item('design-deliverable.personal.usability-script', 'Guion de prueba principiante', 'Tareas, observaciones, errores y consentimiento.')],
    verificationPlans: [item('design-verification.personal.external-prototype', 'Maqueta o prototipo exterior', 'Evaluar volumen, lectura, corona, correa y servicio.'), item('design-verification.personal.accessibility', 'Comprobación de accesibilidad', 'Texto, contraste, movimiento reducido y tareas alternativas.')], alternativesMinimum: 3,
    gateQuestions: ['¿Puede leerse y ajustarse sin explicación del diseñador?', '¿Qué superficie es funcional y cuál decorativa?', '¿Cómo se inspeccionará cada interfaz después del acabado?'],
    exitCriteria: ['El conjunto exterior tiene rutas de fabricación e inspección.', 'La prueba con principiantes y accesibilidad está preparada.'],
    stopConditions: ['Interferencia no resuelta.', 'Declaración de estanqueidad sin programa aplicable.'],
    sourceIds: ['source.iso.22810', 'source.iso.21920-1', 'source.iso.9241-11', 'source.w3c.wcag22'],
  },
  {
    id: 'design-stage.personal-watch.controlled-modification', title: { es: 'Modificación arquitectónica controlada' }, routeLevel: 'controlled-architecture-modification', gate: 'architecture',
    purpose: 'Modificar una función o relación manteniendo línea base, hipótesis, impactos, reversibilidad y comparación verificable.',
    inputs: [item('design-input.personal.baseline-assembly', 'Ensamblaje de referencia', 'Identidad, revisión, estado y evidencia inicial.'), item('design-input.personal.change-proposal', 'Necesidad de cambio', 'Problema observado, resultado buscado y límites.')],
    interfaces: [item('design-interface.personal.change-boundary', 'Frontera del cambio', 'Piezas, relaciones y estados que pueden variar.'), item('design-interface.personal.dependencies', 'Dependencias afectadas', 'Apoyos, engranes, alturas, energía, montaje y servicio.')],
    constraints: [item('design-constraint.personal.reversible', 'Reversibilidad técnica', 'Conservar línea base y forma de retorno cuando sea físicamente posible.'), item('design-constraint.personal.no-silent-mutation', 'Sin mutación silenciosa', 'La propuesta no cambia fixture, CAD ni proyecto hasta aprobación explícita.')],
    deliverables: [item('design-deliverable.personal.change-set', 'Expediente de modificación', 'Motivo, alternativa, piezas, relaciones, tolerancias y riesgos.'), item('design-deliverable.personal.baseline-comparison', 'Comparación antes/después', 'Mismas condiciones, métricas y desconocidos.')],
    verificationPlans: [item('design-verification.personal.modification-test', 'Prueba discriminante', 'Resultado esperado en línea base, modificación y fallo alternativo.'), item('design-verification.personal.rollback', 'Plan de retorno', 'Criterios para detener, restaurar y conservar evidencia.')], alternativesMinimum: 3,
    gateQuestions: ['¿Qué observación demuestra la necesidad del cambio?', '¿Qué dependencias podrían producir el mismo efecto?', '¿Qué evidencia obligaría a volver a la línea base?'],
    exitCriteria: ['Línea base y propuesta pueden compararse sin ambigüedad.', 'Riesgos, interfaces y retorno están revisados.'],
    stopConditions: ['Unidad o revisión no identificadas.', 'Cambio irreversible sin revisión experta y justificación.'],
    sourceIds: ['source.iso.14253-1', 'source.eta.6497-2.communication', 'source.miyota.8215.official'],
  },
  {
    id: 'design-stage.personal-watch.own-movement', title: { es: 'Arquitectura de un movimiento propio' }, routeLevel: 'own-movement', gate: 'architecture',
    purpose: 'Pasar del pliego a una arquitectura causal con presupuestos de energía, frecuencia, espacio, tolerancias, fabricación y servicio.',
    inputs: [item('design-input.personal.movement-requirements', 'Pliego del movimiento', 'Funciones, reserva, frecuencia, tamaño, indicación, servicio y entorno.'), item('design-input.personal.architecture-library', 'Biblioteca comparativa', 'Soluciones y compromisos sin copiar geometría ni cifras no transferibles.')],
    interfaces: [item('design-interface.personal.energy-regulation', 'Energía–regulación', 'Muelle, tren, escape, oscilador y pérdidas presupuestadas.'), item('design-interface.personal.structure-kinematics', 'Estructura–cinemática', 'Centros, apoyos, puentes, alturas, montaje y acceso.')],
    constraints: [item('design-constraint.personal.budget-consistency', 'Presupuestos coherentes', 'Energía, relaciones, reserva, altura, diámetro y fabricación deben cerrar juntos.'), item('design-constraint.personal.no-unvalidated-physics', 'Física no validada', 'Cálculos preliminares conservan supuestos, incertidumbre y revisión pendiente.')],
    deliverables: [item('design-deliverable.personal.movement-architecture', 'Dossier de arquitectura', 'Diagrama causal, layout, presupuestos y decisiones.'), item('design-deliverable.personal.prototype-roadmap', 'Hoja de ruta de prototipos', 'Pruebas parciales, utillaje, muestras y puertas de revisión.')],
    verificationPlans: [item('design-verification.personal.subsystem-prototypes', 'Prototipos por subsistema', 'Validar interfaces de mayor riesgo antes del conjunto.'), item('design-verification.personal.architecture-review', 'Revisión multidisciplinar', 'Relojería, cálculo, fabricación, metrología y servicio.')], alternativesMinimum: 3,
    gateQuestions: ['¿Qué cadena causal satisface cada función?', '¿Dónde están los presupuestos con menor margen?', '¿Qué prueba parcial reduce primero el mayor riesgo?'],
    exitCriteria: ['Los presupuestos principales son coherentes y trazables.', 'Existe una estrategia de prototipos y revisión por riesgo.'],
    stopConditions: ['Escape o oscilador adoptados solo por apariencia.', 'Presupuesto de energía, altura o fabricación sin cerrar.'],
    sourceIds: ['source.private.horologia-book', 'source.iso.1101', 'source.iso.286-1', 'source.eta.6497-2.communication'],
  },
  {
    id: 'design-stage.personal-watch.capstone', title: { es: 'Dossier integral y puerta de prototipo' }, routeLevel: 'own-movement', gate: 'prototype-plan',
    purpose: 'Defender un reloj completo y decidir con evidencia si puede entrar en prototipo, qué queda bloqueado y cómo se validará.',
    inputs: [item('design-input.personal.all-decisions', 'Decisiones vigentes', 'Pliego, interfaces, cálculos, materiales, procesos, riesgos y pruebas.'), item('design-input.personal.review-findings', 'Hallazgos de revisión', 'Objeciones, no conformidades, desconocidos y cambios pendientes.')],
    interfaces: [item('design-interface.personal.full-watch', 'Arquitectura completa', 'Movimiento, exterior, usuario, fabricación, montaje y servicio.'), item('design-interface.personal.release-evidence', 'Decisión–evidencia', 'Cada aceptación o bloqueo enlaza requisito y prueba.')],
    constraints: [item('design-constraint.personal.release-honesty', 'Liberación honesta', 'Un riesgo crítico abierto bloquea la puerta; el calendario no lo rebaja.'), item('design-constraint.personal.revision-freeze', 'Configuración fijada', 'Versión de todos los artefactos y cambios posteriores controlados.')],
    deliverables: [item('design-deliverable.personal.design-history', 'Expediente de diseño', 'Requisitos, alternativas, decisiones, revisiones, pruebas y configuración.'), item('design-deliverable.personal.prototype-gate', 'Acta de puerta', 'Aprobado, aprobado con condiciones o bloqueado, con responsables.')],
    verificationPlans: [item('design-verification.personal.validation-master-plan', 'Plan maestro de validación', 'Revisión relojera, principiantes, transferencia, accesibilidad y retención.'), item('design-verification.personal.prototype-control', 'Control del prototipo', 'Identidad, configuración, desviaciones y comparación con el diseño.')], alternativesMinimum: 3,
    gateQuestions: ['¿Qué versión exacta se propone prototipar?', '¿Qué riesgos críticos siguen abiertos?', '¿Qué resultado detendría o rediseñaría el prototipo?'],
    exitCriteria: ['Todos los requisitos y riesgos tienen estado.', 'La puerta tiene revisión humana y plan de validación independiente.'],
    stopConditions: ['Riesgo crítico sin control.', 'Configuración o responsable de la decisión no identificados.'],
    sourceIds: ['source.iso.9241-210', 'source.iso.14253-1', 'source.w3c.wcag22', 'source.roediger-karpicke.2006'],
  },
])

export function personalWatchDesignStage(id: string): PersonalWatchDesignStage | undefined {
  return PERSONAL_WATCH_DESIGN_STAGES.find((stage) => stage.id === id)
}

export function validatePersonalWatchDesignCatalog(): string[] {
  const orders = PERSONAL_WATCH_DESIGN_LEVELS.map(({ order }) => order)
  const levelIds = new Set(PERSONAL_WATCH_DESIGN_LEVELS.map(({ id }) => id))
  return [
    ...(new Set(orders).size === orders.length ? [] : ['Los niveles de diseño comparten orden.']),
    ...PERSONAL_WATCH_DESIGN_STAGES.filter(({ routeLevel }) => !levelIds.has(routeLevel)).map(({ id }) => `${id}: nivel desconocido`),
    ...PERSONAL_WATCH_DESIGN_STAGES.filter(({ alternativesMinimum }) => alternativesMinimum < 2).map(({ id }) => `${id}: no compara alternativas`),
  ]
}
