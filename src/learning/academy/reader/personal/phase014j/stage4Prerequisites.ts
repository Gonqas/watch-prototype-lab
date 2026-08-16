import type { AcademyStage4PrerequisiteOverride } from '../types'
import { ACADEMY_STAGE_4_CATALOG } from './stage4Catalog'

export const ACADEMY_STAGE_4_CHAPTER_SEQUENCE = ['chapter.4.1', 'chapter.4.2', 'chapter.4.3', 'chapter.4.4', 'chapter.4.5'] as const
export const ACADEMY_STAGE_4_TRANSITIONS = [
  { fromChapterId: 'chapter.3.4', toChapterId: 'chapter.4.1', blocking: true, meaning: 'El cierre conceptual de etapa 3 abre identificación documental del calibre.' },
  { fromChapterId: 'chapter.4.1', toChapterId: 'chapter.4.2', blocking: true, meaning: 'Identidad y autoridad documental preceden a los subsistemas.' },
  { fromChapterId: 'chapter.4.2', toChapterId: 'chapter.4.3', blocking: true, meaning: 'El mapa de subsistemas precede a las dependencias virtuales.' },
  { fromChapterId: 'chapter.4.3', toChapterId: 'chapter.4.4', blocking: true, meaning: 'La secuencia del laboratorio precede a inspección y montaje simbólicos.' },
  { fromChapterId: 'chapter.4.4', toChapterId: 'chapter.4.5', blocking: true, meaning: 'Las verificaciones del modelo preceden al diagnóstico y dossier.' },
  { fromChapterId: 'chapter.4.5', toChapterId: 'chapter.5.1', blocking: true, meaning: 'El dossier trazable abre etapa 5 sin afirmar competencia de servicio.' },
] as const

const foundation: Record<string, readonly string[]> = {
  'chapter.4.1': ['concept.horology.system'],
  'chapter.4.2': ['concept.miyota8215.document-authority'],
  'chapter.4.3': ['concept.miyota8215.structural-dependency'],
  'chapter.4.4': ['concept.miyota8215.simulation-boundary'],
  'chapter.4.5': ['concept.horology.rival-hypotheses'],
}

export const ACADEMY_STAGE_4_PREREQUISITE_OVERRIDES: readonly AcademyStage4PrerequisiteOverride[] = ACADEMY_STAGE_4_CATALOG.map((item) => ({
  lessonId: item.lessonId, rawConceptIds: [], effectiveRequiredConceptIds: item.pathRole === 'anchor' ? [...(foundation[item.chapterId] ?? [])] : [],
  recommendedLessonIds: item.pathRole === 'anchor' ? [] : ACADEMY_STAGE_4_CATALOG.filter(({ chapterId, pathRole }) => chapterId === item.chapterId && pathRole === 'anchor').slice(0, 1).map(({ lessonId }) => lessonId),
  pathRole: item.pathRole, blocking: item.pathRole === 'anchor', rationale: item.pathRole === 'anchor' ? 'Solo conserva el fundamento conceptual anterior; no exige calibre, herramientas, servicio físico, lubricación ni etapa 5.' : 'Support o rama opcional accesible sin bloquear la ruta.', phase: '0.14J',
}))
