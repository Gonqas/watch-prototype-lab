import { ACADEMY_PERSONAL_REVIEW_QUEUE_014I, type AcademyPersonalReviewQueue014IEntry } from '../phase014i/reviewQueue'
import { ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J } from './activeTechnicalStatus'
import { ACADEMY_STAGE_4_LESSON_CURATIONS } from './stage4Lessons'

export interface AcademyPersonalReviewQueue014JEntry {
  lessonId: string
  technicalStatus: AcademyPersonalReviewQueue014IEntry['technicalStatus']
  originPhase: AcademyPersonalReviewQueue014IEntry['originPhase'] | '0.14J'
  personalStatus: AcademyPersonalReviewQueue014IEntry['personalStatus']
}

const queue = new Map<string, AcademyPersonalReviewQueue014JEntry>()
for (const item of ACADEMY_PERSONAL_REVIEW_QUEUE_014I) queue.set(item.lessonId, item)
for (const { lessonId, technicalStatus } of ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J) {
  const previous = queue.get(lessonId)
  if (previous) queue.set(lessonId, { ...previous, technicalStatus })
}
for (const { lessonId, technicalStatus } of ACADEMY_STAGE_4_LESSON_CURATIONS) {
  const previous = queue.get(lessonId)
  queue.set(lessonId, previous ? { ...previous, technicalStatus } : { lessonId, technicalStatus, originPhase: '0.14J', personalStatus: 'not-reviewed' })
}

export const ACADEMY_PERSONAL_REVIEW_QUEUE_014J: readonly AcademyPersonalReviewQueue014JEntry[] = [...queue.values()]
export function academyPersonalReviewQueue014JEntry(lessonId: string) { return ACADEMY_PERSONAL_REVIEW_QUEUE_014J.find((item) => item.lessonId === lessonId) }
