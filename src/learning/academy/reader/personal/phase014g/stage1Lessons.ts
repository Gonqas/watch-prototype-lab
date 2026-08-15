import type { AcademyStage1LessonCuration } from '../types'
import { ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS } from './stage1Activities'
import { ACADEMY_STAGE_1_SECTIONS } from './stage1Sections'

const activitiesFor = (lessonId: string) => ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS.filter((item) => item.lessonId === lessonId)

export const ACADEMY_STAGE_1_LESSON_IDS = [
  'lesson.horology.system',
  'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple',
  'lesson.horology.mechanical-chain',
  'lesson.horology.quartz-chain',
  'lesson.horology.functional-equivalence',
  'lesson.encyclopedia.history-language.leer-documentacion',
  'lesson.encyclopedia.history-language.medir-el-tiempo',
  'lesson.advanced.atlas-authority',
] as const

export const ACADEMY_STAGE_1_LESSON_CURATIONS: readonly AcademyStage1LessonCuration[] = [
  {
    lessonId: 'lesson.horology.system', sourceBlockId: 'block.horology.system', macroStage: 1, pathRole: 'anchor',
    centralQuestion: '¿Qué convierte movimiento, indicación, interfaz y estructura en un reloj completo?',
    whyNow: 'Tras adquirir control básico del banco, necesitas un mapa del objeto completo antes de memorizar órganos.',
    observableOutcome: 'Clasificar elementos por función y distinguir reloj completo, movimiento, indicación, interfaz y protección.',
    recommendedPrerequisiteLessonIds: ['lesson.quartz2035.workstation', 'lesson.quartz2035.tools'],
    effectivePrerequisiteConceptIds: [], sections: ACADEMY_STAGE_1_SECTIONS['lesson.horology.system'],
    visualDesignIds: ['visual.stage1.watch-system.v1'], activityPresentations: activitiesFor('lesson.horology.system'),
    sourceClaimIds: ['claim.014g.stage1.complete-watch-system'],
    limitations: ['Mapa conceptual sin escala ni identidades de un calibre.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-reviewed',
  },
  {
    lessonId: 'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', sourceBlockId: 'block.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', macroStage: 1, pathRole: 'support',
    centralQuestion: '¿Cómo cooperan acumulador, tren, escape, regulador e indicación sin formar una cadena puramente lineal?',
    whyNow: 'Amplía la visión del reloj con el modelo general que la cadena mecánica desarrollará después.',
    observableOutcome: 'Dibujar ruta de energía, bucle de temporización y rama de indicación sin exigir detalles posteriores.',
    recommendedPrerequisiteLessonIds: ['lesson.horology.system'], effectivePrerequisiteConceptIds: ['concept.horology.functional-chain'],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple'], visualDesignIds: ['visual.stage1.mechanical-feedback.v1'],
    activityPresentations: activitiesFor('lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple'), sourceClaimIds: ['claim.014g.stage1.simple-mechanical-system'],
    limitations: ['No incluye minutería, puesta en hora, fuerzas ni tolerancias.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-reviewed',
  },
  {
    lessonId: 'lesson.horology.mechanical-chain', sourceBlockId: 'block.horology.mechanical-chain', macroStage: 1, pathRole: 'anchor',
    centralQuestion: '¿Cómo se relacionan la ruta energética, el bucle escape–oscilador y la rama de indicación?',
    whyNow: 'Con el sistema general situado, ya puedes seguir la arquitectura mecánica sin confundir tren, regulación e indicación.',
    observableOutcome: 'Ordenar la ruta energética y explicar el retorno de temporización entre escape y oscilador.',
    recommendedPrerequisiteLessonIds: ['lesson.horology.system'], effectivePrerequisiteConceptIds: ['concept.horology.functional-chain', 'concept.horology.part-language'],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.horology.mechanical-chain'], visualDesignIds: ['visual.stage1.mechanical-feedback.v1'],
    activityPresentations: activitiesFor('lesson.horology.mechanical-chain'), sourceClaimIds: ['claim.014g.stage1.escapement-regulator-loop'],
    limitations: ['El 8215 es ejemplo estructural y no una simulación física validada.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-reviewed',
  },
  {
    lessonId: 'lesson.horology.quartz-chain', sourceBlockId: 'block.horology.quartz-chain', macroStage: 1, pathRole: 'support',
    centralQuestion: '¿Cómo pasan energía y referencia temporal a movimiento e indicación en un cuarzo analógico?',
    whyNow: 'Ofrece un contraste temprano y una especialización de apoyo sin bloquear la progresión mecánica.',
    observableOutcome: 'Ordenar energía, referencia/división, conversión, transmisión e indicación y declarar el alcance del 2035.',
    recommendedPrerequisiteLessonIds: ['lesson.horology.system'], effectivePrerequisiteConceptIds: ['concept.horology.functional-chain'],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.horology.quartz-chain'], visualDesignIds: ['visual.stage1.quartz-functional.v1'],
    activityPresentations: activitiesFor('lesson.horology.quartz-chain'), sourceClaimIds: ['claim.014g.stage1.quartz-analogue-chain'],
    limitations: ['El MIYOTA 2035 no representa todas las arquitecturas de cuarzo.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-reviewed',
  },
  {
    lessonId: 'lesson.horology.functional-equivalence', sourceBlockId: 'block.horology.functional-equivalence', macroStage: 1, pathRole: 'anchor',
    centralQuestion: '¿Qué funciones son comparables entre cuarzo y mecánico y dónde termina cada analogía?',
    whyNow: 'Con el mapa mecánico disponible puedes transferir funciones sin convertir parecidos en igualdad física.',
    observableOutcome: 'Clasificar equivalencias como parciales, distribuidas o sin equivalente directo y justificar sus límites.',
    recommendedPrerequisiteLessonIds: ['lesson.horology.mechanical-chain', 'lesson.horology.quartz-chain'], effectivePrerequisiteConceptIds: ['concept.horology.mechanical-chain'],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.horology.functional-equivalence'], visualDesignIds: ['visual.stage1.functional-equivalence.v1'],
    activityPresentations: activitiesFor('lesson.horology.functional-equivalence'), sourceClaimIds: ['claim.014g.stage1.functional-equivalence-limits'],
    limitations: ['La rama de cuarzo es ayuda recomendada, no prerrequisito bloqueante.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-limited',
  },
  {
    lessonId: 'lesson.encyclopedia.history-language.leer-documentacion', sourceBlockId: 'block.encyclopedia.history-language.leer-documentacion', macroStage: 1, pathRole: 'anchor',
    centralQuestion: '¿Qué puede demostrar cada tipo de documento y qué queda fuera de su alcance?',
    whyNow: 'Antes de avanzar a mecanismos concretos necesitas vincular cada afirmación con una autoridad aplicable.',
    observableOutcome: 'Auditar afirmaciones por tipo de documento, localizador, aplicabilidad y estado de verificación.',
    recommendedPrerequisiteLessonIds: ['lesson.horology.functional-equivalence'], effectivePrerequisiteConceptIds: ['concept.horology.functional-chain'],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.encyclopedia.history-language.leer-documentacion'], visualDesignIds: ['visual.stage1.document-authority.v1'],
    activityPresentations: activitiesFor('lesson.encyclopedia.history-language.leer-documentacion'), sourceClaimIds: ['claim.014g.stage1.exploded-view-scope'],
    limitations: ['No abre recursos externos ni convierte bases en documentación de servicio.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-reviewed',
  },
  {
    lessonId: 'lesson.encyclopedia.history-language.medir-el-tiempo', sourceBlockId: 'block.encyclopedia.history-language.medir-el-tiempo', macroStage: 1, pathRole: 'optional-branch',
    centralQuestion: '¿Cómo convierte un reloj una referencia repetible en conteo, escala e indicación?',
    whyNow: 'Amplía el lenguaje común para comparar tecnologías sin bloquear el recorrido principal.',
    observableOutcome: 'Aplicar referencia, conteo, escala e indicación a cuatro arquitecturas y separar estabilidad, resolución y error.',
    recommendedPrerequisiteLessonIds: ['lesson.horology.system'], effectivePrerequisiteConceptIds: [],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.encyclopedia.history-language.medir-el-tiempo'], visualDesignIds: [],
    activityPresentations: activitiesFor('lesson.encyclopedia.history-language.medir-el-tiempo'), sourceClaimIds: ['claim.014g.stage1.measurement-functional-map'],
    limitations: ['Enriquecimiento source-limited sin cifras, fórmulas ni cronología detallada.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-limited',
  },
  {
    lessonId: 'lesson.advanced.atlas-authority', sourceBlockId: 'block.advanced.atlas-authority', macroStage: 1, pathRole: 'reference',
    centralQuestion: '¿Qué fuente puede responder mi pregunta y cómo separo lo confirmado, inferido y desconocido?',
    whyNow: 'La guía de autoridad queda disponible desde el inicio como referencia, sin exigir el recorrido avanzado.',
    observableOutcome: 'Construir una ficha de procedencia que relacione pregunta, autoridad, aplicabilidad y estado de conocimiento.',
    recommendedPrerequisiteLessonIds: ['lesson.encyclopedia.history-language.leer-documentacion'], effectivePrerequisiteConceptIds: [],
    sections: ACADEMY_STAGE_1_SECTIONS['lesson.advanced.atlas-authority'], visualDesignIds: ['visual.stage1.claim-trace.v1'],
    activityPresentations: activitiesFor('lesson.advanced.atlas-authority'), sourceClaimIds: ['claim.014g.stage1.authority-by-subject'],
    limitations: ['Referencia temprana; no afirma identificación física ni datos de una variante sin localizador.'], personalReviewStatus: 'not-reviewed', technicalStatus: 'source-limited',
  },
] as const

const byLessonId = new Map(ACADEMY_STAGE_1_LESSON_CURATIONS.map((item) => [item.lessonId, item]))

export function academyStage1LessonCuration(lessonId: string): AcademyStage1LessonCuration | undefined {
  return byLessonId.get(lessonId)
}
