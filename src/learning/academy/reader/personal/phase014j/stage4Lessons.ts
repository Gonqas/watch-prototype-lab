import type { AcademyStage4LessonCuration } from '../types'
import { deriveAcademyTechnicalStatus } from './activeTechnicalStatus'
import { ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS } from './stage4Activities'
import { ACADEMY_STAGE_4_CATALOG } from './stage4Catalog'
import { academyStage4ClaimsForLesson } from './stage4Claims'
import { ACADEMY_STAGE_4_SECTIONS } from './stage4Sections'

export const ACADEMY_STAGE_4_LESSON_CURATIONS: readonly AcademyStage4LessonCuration[] = ACADEMY_STAGE_4_CATALOG.map((item) => {
  const claims = academyStage4ClaimsForLesson(item.lessonId)
  const technicalStatus = deriveAcademyTechnicalStatus({ claims: claims.map(({ claimId, technicalStatus: status, central, claim }) => ({ evidenceId: claimId, kind: 'claim', status, central, explanation: claim })) }).technicalStatus
  return {
    lessonId: item.lessonId, sourceBlockId: item.lessonId.replace('lesson.', 'block.'), macroStage: 4, chapterId: item.chapterId, pathRole: item.pathRole,
    compositionMode: 'augment', editorialArchetype: item.editorialArchetype, centralQuestion: item.centralQuestion, whyNow: item.whyNow, observableOutcome: item.observableOutcome,
    sections: ACADEMY_STAGE_4_SECTIONS[item.lessonId] ?? [], visualDesignIds: item.visualDesignIds,
    activityPresentations: ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS.filter(({ lessonId }) => lessonId === item.lessonId),
    sourceClaimIds: claims.map(({ claimId }) => claimId), limitations: [item.sourceScope, 'La etapa documenta y simula; no acredita ejecución física ni servicio profesional.'],
    personalReviewStatus: 'not-reviewed', technicalStatus,
  }
})

const byId = new Map(ACADEMY_STAGE_4_LESSON_CURATIONS.map((item) => [item.lessonId, item]))
export function academyStage4LessonCuration(lessonId: string) { return byId.get(lessonId) }
