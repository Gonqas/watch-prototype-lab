import type { AcademyStage2PrerequisiteOverride } from '../types'
import { ACADEMY_STAGE_2_CATALOG } from './stage2Catalog'

const chapterFoundation: Record<string, readonly string[]> = {
  'stage-2.1': ['concept.horology.mechanical-chain'],
  'stage-2.2': ['concept.mechanical.energy-flow'],
  'stage-2.3': ['concept.mechanical.train'],
  'stage-2.4': ['concept.mechanical.escapement'],
  'stage-2.5': ['concept.mechanical.train', 'concept.mechanical.oscillator'],
  'stage-2.6': ['concept.mechanical.motion-works', 'concept.mechanical.barrel'],
}

export const ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES: readonly AcademyStage2PrerequisiteOverride[] = ACADEMY_STAGE_2_CATALOG.map((item) => ({
  lessonId: item.lessonId,
  rawConceptIds: [],
  effectiveRequiredConceptIds: item.pathRole === 'anchor' ? [...(chapterFoundation[item.chapterId] ?? [])] : [],
  recommendedLessonIds: item.pathRole === 'anchor' ? [] : ACADEMY_STAGE_2_CATALOG.filter(({ chapterId, pathRole }) => chapterId === item.chapterId && pathRole === 'anchor').slice(0, 1).map(({ lessonId }) => lessonId),
  pathRole: item.pathRole,
  blocking: item.pathRole === 'anchor',
  rationale: item.pathRole === 'anchor'
    ? 'Solo conserva el fundamento del sistema anterior; no exige detalles posteriores, especializaciones ni aplicaciones de calibre.'
    : 'Apoyo o rama accesible bajo demanda; enriquece la etapa sin bloquear su secuencia principal.',
  phase: '0.14H',
}))

export const ACADEMY_STAGE_2_CHAPTER_SEQUENCE = ['stage-2.1', 'stage-2.2', 'stage-2.3', 'stage-2.4', 'stage-2.5', 'stage-2.6'] as const
