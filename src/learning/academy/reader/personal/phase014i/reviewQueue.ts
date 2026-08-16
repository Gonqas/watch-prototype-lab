import { ACADEMY_PERSONAL_REVIEW_QUEUE_014H, type AcademyPersonalReviewQueue014HEntry } from '../phase014h/reviewQueue'
import { ACADEMY_STAGE_3_LESSON_CURATIONS } from './stage3Lessons'

export interface AcademyPersonalReviewQueue014IEntry {
  lessonId: string
  technicalStatus: AcademyPersonalReviewQueue014HEntry['technicalStatus']
  originPhase: AcademyPersonalReviewQueue014HEntry['originPhase'] | '0.14I'
  personalStatus: 'not-reviewed'
}

const queue = new Map<string, AcademyPersonalReviewQueue014IEntry>()
for (const item of ACADEMY_PERSONAL_REVIEW_QUEUE_014H) queue.set(item.lessonId, item)
for (const { lessonId, technicalStatus } of ACADEMY_STAGE_3_LESSON_CURATIONS) {
  if (!queue.has(lessonId)) queue.set(lessonId, { lessonId, technicalStatus, originPhase: '0.14I', personalStatus: 'not-reviewed' })
}
export const ACADEMY_PERSONAL_REVIEW_QUEUE_014I: readonly AcademyPersonalReviewQueue014IEntry[] = [...queue.values()]
export function academyPersonalReviewQueue014IEntry(lessonId: string) { return ACADEMY_PERSONAL_REVIEW_QUEUE_014I.find((item) => item.lessonId === lessonId) }
