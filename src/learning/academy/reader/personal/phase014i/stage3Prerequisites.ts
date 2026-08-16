import type { AcademyStage3PrerequisiteOverride } from '../types'
import { ACADEMY_STAGE_3_CATALOG } from './stage3Catalog'

export const ACADEMY_STAGE_3_CHAPTER_SEQUENCE = ['chapter.3.1', 'chapter.3.2', 'chapter.3.3', 'chapter.3.4'] as const
export const ACADEMY_STAGE_3_TRANSITIONS = [
  { fromChapterId: 'chapter.2.6', toChapterId: 'chapter.3.1', blocking: true, meaning: 'La etapa 2 disponible abre observación e inspección.' },
  { fromChapterId: 'chapter.3.1', toChapterId: 'chapter.3.2', blocking: true, meaning: 'La línea base precede a la medición.' },
  { fromChapterId: 'chapter.3.2', toChapterId: 'chapter.3.3', blocking: true, meaning: 'La evidencia comparable precede al diagnóstico.' },
  { fromChapterId: 'chapter.3.3', toChapterId: 'chapter.3.4', blocking: true, meaning: 'El diagnóstico precede a una decisión de servicio.' },
  { fromChapterId: 'chapter.3.4', toChapterId: 'chapter.4.1', blocking: true, meaning: 'El cierre conceptual abre el calibre real sin acreditar servicio.' },
] as const

const chapterFoundation: Record<string, readonly string[]> = {
  'chapter.3.1': ['concept.horology.mechanical-chain'],
  'chapter.3.2': ['concept.metrology.observe-before-measuring'],
  'chapter.3.3': ['concept.metrology.compare-data'],
  'chapter.3.4': ['concept.horology.system-interruption'],
}

export const ACADEMY_STAGE_3_PREREQUISITE_OVERRIDES: readonly AcademyStage3PrerequisiteOverride[] = ACADEMY_STAGE_3_CATALOG.map((item) => ({
  lessonId: item.lessonId,
  rawConceptIds: [],
  effectiveRequiredConceptIds: item.pathRole === 'anchor' ? [...(chapterFoundation[item.chapterId] ?? [])] : [],
  recommendedLessonIds: item.pathRole === 'anchor' ? [] : ACADEMY_STAGE_3_CATALOG.filter(({ chapterId, pathRole }) => chapterId === item.chapterId && pathRole === 'anchor').slice(0, 1).map(({ lessonId }) => lessonId),
  pathRole: item.pathRole,
  blocking: item.pathRole === 'anchor',
  rationale: item.pathRole === 'anchor' ? 'Conserva solo el fundamento del capítulo anterior.' : 'Apoyo o caso opcional accesible sin bloquear la secuencia.',
  phase: '0.14I',
}))
