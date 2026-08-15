import type { AcademyEvidenceProfile, AcademyStage0ActivityPresentation } from '../types'

const digitalProfile = (
  modalities: AcademyEvidenceProfile['modalities'],
  artifacts: string[],
): AcademyEvidenceProfile => ({
  modalities,
  primaryModality: modalities.includes('V') ? 'V' : 'K',
  knowledgeExplanationRequired: modalities.includes('K'),
  virtualDemonstrationRequired: modalities.includes('V'),
  physicalExecutionRequired: false,
  measuredOrReviewedResultRequired: modalities.includes('R'),
  physicalCompetenceClaim: false,
  reviewerRequired: false,
  measurableAcceptanceCriteria: ['La decisión se explica con el estado visible y una limitación explícita.'],
  evidenceArtifacts: artifacts,
})

const activity = (
  activityId: string,
  lessonId: string,
  visibleTitle: string,
  purpose: string,
  instructions: string[],
  successCriteria: string[],
  modalities: AcademyEvidenceProfile['modalities'] = ['K', 'V', 'R'],
): AcademyStage0ActivityPresentation => ({
  activityId,
  lessonId,
  visibleTitle,
  purpose,
  instructions,
  availableHelp: ['Vuelve al apartado visual de la lección.', 'Reduce la decisión a una observación y una razón.'],
  successCriteria,
  feedback: 'Compara tu decisión con la función, el riesgo que evita y lo que todavía no puede saberse.',
  limitations: ['La interacción digital no acredita preparación física del banco ni control manual.'],
  evidenceProfile: digitalProfile(modalities, ['explicación guardada', 'resultado de la práctica virtual']),
})

export const ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS: readonly AcademyStage0ActivityPresentation[] = [
  activity(
    'activity.quartz2035.prepare-workbench',
    'lesson.quartz2035.workstation',
    'Organizar un banco recuperable',
    'Asignar zonas y dejar una sesión que pueda reanudarse sin confiar en la memoria.',
    ['Distribuye zona activa, herramientas, piezas y residuos.', 'Registra el estado inicial.', 'Simula una pausa y reconstruye el estado.'],
    ['Cada elemento tiene una zona.', 'La pausa conserva orientación y recuento.', 'Se explica qué información falta en una simulación.'],
  ),
  activity(
    'activity.quartz2035.detect-unsafe-conditions',
    'lesson.quartz2035.workstation',
    'Reconocer cuándo no empezar',
    'Detectar condiciones que impiden trabajar con control.',
    ['Observa luz, contención, postura y distracciones.', 'Marca una condición de parada.', 'Propón una corrección reversible.'],
    ['La parada se relaciona con un riesgo concreto.', 'La corrección no exige equipo no declarado.'],
  ),
  activity(
    'activity.quartz2035.select-tools',
    'lesson.quartz2035.tools',
    'Elegir la herramienta por su contacto',
    'Relacionar operación, herramienta y superficie protegida.',
    ['Identifica la operación.', 'Compara el contacto de las opciones.', 'Elige o rechaza y explica la razón.'],
    ['La herramienta elegida cumple la función.', 'La explicación incluye la superficie que no debe dañarse.'],
  ),
  activity(
    'activity.quartz2035.reject-wrong-tool',
    'lesson.quartz2035.tools',
    'Rechazar una herramienta inadecuada',
    'Practicar una parada antes de aplicar fuerza.',
    ['Localiza falta de ajuste, daño o mala alineación.', 'Rechaza la opción.', 'Describe qué comprobarías antes de sustituirla.'],
    ['No se gira ni se fuerza una herramienta inestable.', 'El motivo es observable.'],
  ),
  activity(
    'activity.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    'Explicar un entorno de trabajo controlado',
    'Relacionar luz, postura, orden y pausa con la calidad del resultado.',
    ['Describe el entorno.', 'Señala una cadena de error posible.', 'Propón un punto de parada.'],
    ['Se distingue condición del entorno y consecuencia.', 'La propuesta mantiene el trabajo reversible.'],
  ),
  activity(
    'activity.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    'Separar observación e interpretación',
    'Registrar lo visible antes de proponer una causa.',
    ['Escribe una observación neutral.', 'Formula dos interpretaciones.', 'Elige un cambio de luz, ángulo o aumento que pueda distinguirlas.'],
    ['La observación no contiene una causa.', 'La comprobación cambia una sola condición.'],
  ),
  activity(
    'activity.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    'Interrumpir una ruta de contaminación',
    'Reconocer fuente, puente, pieza y punto de control sin usar química.',
    ['Traza la ruta visible.', 'Elige dónde separar, cubrir o detener.', 'Registra qué dato de compatibilidad falta.'],
    ['El control interrumpe la ruta.', 'No se recomienda un producto ni se afirma limpieza demostrada.'],
  ),
  activity(
    'activity.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    'Explicar una práctica manual segura',
    'Reconocer apoyo, alineación, presión mínima y parada antes de practicar físicamente.',
    ['Ordena la secuencia.', 'Identifica una señal de parada.', 'Explica qué evidencia sería necesaria para afirmar que la práctica se realizó.'],
    ['La respuesta digital no se presenta como destreza física.', 'La práctica real queda opcional y autodocumentada.'],
    ['K', 'V', 'R'],
  ),
] as const

export function academyStage0ActivityPresentation(activityId: string): AcademyStage0ActivityPresentation | undefined {
  return ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS.find((item) => item.activityId === activityId)
}
