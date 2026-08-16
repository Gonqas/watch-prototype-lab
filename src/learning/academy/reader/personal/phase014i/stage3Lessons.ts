import type { AcademyStage3LessonCuration } from '../types'
import { ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS } from './stage3Activities'
import { ACADEMY_STAGE_3_CATALOG } from './stage3Catalog'
import { ACADEMY_STAGE_3_CLAIMS } from './stage3Claims'
import { ACADEMY_STAGE_3_SECTIONS } from './stage3Sections'

export const ACADEMY_STAGE_3_LESSON_CURATIONS: readonly AcademyStage3LessonCuration[] = ACADEMY_STAGE_3_CATALOG.map((item) => ({
  lessonId: item.lessonId,
  sourceBlockId: item.lessonId.replace('lesson.', 'block.'),
  macroStage: 3,
  chapterId: item.chapterId,
  pathRole: item.pathRole,
  compositionMode: 'augment',
  editorialArchetype: item.editorialArchetype,
  centralQuestion: item.centralQuestion,
  whyNow: item.whyNow,
  observableOutcome: item.observableOutcome,
  sections: ACADEMY_STAGE_3_SECTIONS[item.lessonId] ?? [],
  visualDesignIds: item.visualDesignIds,
  activityPresentations: ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.filter(({ lessonId }) => lessonId === item.lessonId),
  sourceClaimIds: ACADEMY_STAGE_3_CLAIMS.filter(({ lessonId }) => lessonId === item.lessonId).map(({ claimId }) => claimId),
  limitations: [item.sourceScope, 'La lectura no acredita ejecución física, servicio ni aceptación profesional.'],
  personalReviewStatus: 'not-reviewed',
  technicalStatus: item.sourceScope.includes('fuente necesaria') || item.pathRole === 'optional-branch' ? 'source-limited' : 'source-reviewed',
}))

const byId = new Map(ACADEMY_STAGE_3_LESSON_CURATIONS.map((item) => [item.lessonId, item]))
export function academyStage3LessonCuration(lessonId: string) { return byId.get(lessonId) }
