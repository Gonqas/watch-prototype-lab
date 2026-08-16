import type { AcademyStage2LessonCuration } from '../types'
import { ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS } from './stage2Activities'
import { ACADEMY_STAGE_2_CATALOG } from './stage2Catalog'
import { ACADEMY_STAGE_2_CLAIM_REVIEWS } from './stage2Claims'
import { ACADEMY_STAGE_2_SECTIONS } from './stage2Sections'

export const ACADEMY_STAGE_2_LESSON_CURATIONS: readonly AcademyStage2LessonCuration[] = ACADEMY_STAGE_2_CATALOG.map((item) => ({
  lessonId: item.lessonId,
  sourceBlockId: item.lessonId.replace('lesson.', 'block.'),
  macroStage: 2,
  chapterId: item.chapterId,
  pathRole: item.pathRole,
  compositionMode: 'augment',
  editorialArchetype: item.editorialArchetype,
  centralQuestion: item.centralQuestion,
  whyNow: item.whyNow,
  observableOutcome: item.observableOutcome,
  checkpointPrompt: item.checkpointPrompt,
  checkpointExpectedElements: item.checkpointExpectedElements,
  checkpointCommonFailure: item.checkpointCommonFailure,
  recommendedPrerequisiteLessonIds: [],
  effectivePrerequisiteConceptIds: [],
  sections: ACADEMY_STAGE_2_SECTIONS[item.lessonId] ?? [],
  visualDesignIds: item.visualDesignIds,
  activityPresentations: ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS.filter(({ lessonId }) => lessonId === item.lessonId),
  sourceClaimIds: ACADEMY_STAGE_2_CLAIM_REVIEWS.filter(({ lessonId }) => lessonId === item.lessonId).map(({ claimId }) => claimId),
  limitations: [item.sourceScope, 'No acredita ejecución física ni servicio de un calibre.'],
  personalReviewStatus: 'not-reviewed',
  technicalStatus: item.sourceScope.includes('source-limited') || item.pathRole === 'optional-branch' ? 'source-limited' : 'source-reviewed',
}))

const byId = new Map(ACADEMY_STAGE_2_LESSON_CURATIONS.map((item) => [item.lessonId, item]))
export function academyStage2LessonCuration(lessonId: string) { return byId.get(lessonId) }
