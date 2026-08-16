import type { AcademyStage3PersonalPractice } from '../types'

function practice(personalPracticeId: string, lessonIds: readonly string[], title: string, objective: string, steps: readonly string[], materials: readonly string[] = ['papel', 'lápiz', 'fotografía propia o datos ficticios etiquetados']): AcademyStage3PersonalPractice {
  return {
    personalPracticeId, lessonIds, title, objective,
    inexpensiveMaterials: materials,
    preparation: ['Trabaja con un objeto cerrado, una pieza descartada o datos ficticios.', 'No uses sustancias, lubricantes, calor ni un reloj valioso.', 'Define qué dato quieres conservar.'],
    steps,
    help: ['Separa observación, inferencia y desconocido.', 'Declara unidad, referencia o fuente cuando proceda.', 'Detente antes de una acción física no necesaria.'],
    stopSignal: 'Detente si la práctica exige abrir un movimiento, forzar una pieza, aplicar una sustancia o afirmar una competencia física.',
    possibleDamage: ['Pérdida de una pieza o daño por manipulación; utiliza solo objetos baratos, cerrados o descartados.'],
    observe: ['estado inicial', 'condición modificada', 'evidencia', 'incertidumbre'],
    record: ['nota local', 'tabla o fotografía propia opcional', 'dato que sigue abierto'],
    personalCriterion: ['La decisión es trazable.', 'No se inventan tolerancias ni productos.', 'P solo se declara si hubo ejecución física explícita.'],
    suggestedRepetition: 'Repite una vez cambiando una sola condición y compara los registros.',
    certificationStatus: 'optional-local-not-certified', affectsProgress: false, createsMastery: false, completesLesson: false,
  }
}

export const ACADEMY_STAGE_3_PERSONAL_PRACTICES: readonly AcademyStage3PersonalPractice[] = [
  practice('personal-practice.stage3.capture-baseline', ['lesson.encyclopedia.service-tribology.recepcion-y-linea-base'], 'Capturar una línea base', 'Conservar el estado de un objeto barato y cerrado antes de probarlo.', ['Registra identidad e historia conocida.', 'Fotografía exterior y controles sin accionarlos.', 'Anota qué prueba podría alterar el estado.']),
  practice('personal-practice.stage3.observation-vs-inference', ['lesson.metrology.observe-before-measuring'], 'Observación frente a inferencia', 'Redactar cinco descripciones neutrales antes de proponer causas.', ['Mira una pieza descartada o foto propia.', 'Escribe cinco observaciones.', 'Añade dos interpretaciones en otra columna.']),
  practice('personal-practice.stage3.record-finding', ['lesson.metrology.inspection-findings'], 'Registrar un hallazgo', 'Crear un registro con evidencia y confianza.', ['Nombra objeto y zona.', 'Describe condición y medio.', 'Añade hipótesis rivales y siguiente comprobación.']),
  practice('personal-practice.stage3.choose-instrument', ['lesson.metrology.instruments'], 'Elegir instrumento', 'Justificar una selección por tarea y riesgo.', ['Define la magnitud.', 'Compara regla y calibre disponible sin medir.', 'Elige y declara el límite.'], ['papel', 'lápiz', 'regla', 'calibre digital solo si ya dispones de él']),
  practice('personal-practice.stage3.repeat-measurement', ['lesson.metrology.physical-measurement'], 'Repetir una medición segura', 'Registrar una serie sobre una arandela o tornillo barato.', ['Declara instrumento, cero y unidad.', 'Mide tres veces sin forzar.', 'Registra dispersión e incertidumbre.'], ['papel', 'lápiz', 'arandela o tornillo', 'regla o calibre digital disponible']),
  practice('personal-practice.stage3.detect-parallax', ['lesson.metrology.instruments'], 'Detectar paralaje', 'Comparar lecturas visuales desde dos posiciones.', ['Coloca una regla junto a una marca de papel.', 'Lee perpendicular y oblicuamente.', 'Explica qué condición cambia.'], ['papel', 'lápiz', 'regla']),
  practice('personal-practice.stage3.compare-records', ['lesson.metrology.compare-data'], 'Comparar registros', 'Decidir si dos resultados ficticios son comparables.', ['Anota magnitud, unidad, datum y método.', 'Cambia una condición en el segundo registro.', 'Decide qué comparación sigue permitida.']),
  practice('personal-practice.stage3.build-rival-hypotheses', ['lesson.horology.failure-prediction'], 'Construir hipótesis rivales', 'Evitar saltar de síntoma a causa única.', ['Elige un síntoma ficticio.', 'Escribe tres causas compatibles.', 'Predice una observación diferente por causa.']),
  practice('personal-practice.stage3.choose-discriminating-test', ['lesson.horology.failure-prediction', 'lesson.encyclopedia.service-tribology.diagnostico-y-control-final'], 'Elegir una prueba discriminante', 'Seleccionar una comprobación no destructiva que separe hipótesis.', ['Parte de dos hipótesis.', 'Define dos resultados posibles.', 'Actualiza la decisión para cada resultado.']),
  practice('personal-practice.stage3.audit-cleaning-source', ['lesson.encyclopedia.service-tribology.limpieza-e-inspeccion'], 'Auditar una fuente de limpieza', 'Identificar qué documentación actual faltaría sin ejecutar la operación.', ['Registra material y contaminante como desconocidos si procede.', 'Clasifica la autoridad de la fuente.', 'Marca la operación como bloqueada hasta disponer de documentación actual.']),
  practice('personal-practice.stage3.map-contact-lubrication', ['lesson.encyclopedia.service-tribology.tribologia-y-lubricantes'], 'Mapear contacto y lubricación', 'Relacionar función y contacto sin elegir producto.', ['Dibuja dos superficies y su movimiento relativo.', 'Añade carga, contaminación y desgaste cualitativos.', 'Lista los datos oficiales que faltarían.']),
  practice('personal-practice.stage3.plan-assembly-checkpoints', ['lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control'], 'Planificar puntos de control', 'Situar controles en una secuencia ficticia en papel.', ['Escribe tres estados.', 'Añade control y parada entre estados.', 'Explica qué error localiza cada control.']),
  practice('personal-practice.stage3.define-acceptance-source', ['lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'lesson.advanced.service-clean-lube'], 'Definir la autoridad de aceptación', 'Separar fabricante, diseño, medición, criterio educativo e histórico.', ['Clasifica cinco criterios ficticios.', 'Marca los que no tienen autoridad aplicable.', 'Registra incertidumbre residual.']),
]

export function academyStage3PersonalPracticesForLesson(lessonId: string) { return ACADEMY_STAGE_3_PERSONAL_PRACTICES.filter(({ lessonIds }) => lessonIds.includes(lessonId)) }
