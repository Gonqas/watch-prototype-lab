import { ACADEMY_PERSONAL_PILOT_REVIEWS } from '../phase014e'
import { ACADEMY_STAGE_0_LESSON_CURATIONS } from './stage0Lessons'

export interface AcademyPersonalReviewQueueEntry {
  lessonId: string
  technicalStatus: 'source-reviewed' | 'source-limited' | 'source-needed' | 'technical-conflict'
  originPhase: '0.14E' | '0.14F'
  personalStatus: 'not-reviewed'
}

export const ACADEMY_PERSONAL_REVIEW_QUEUE: readonly AcademyPersonalReviewQueueEntry[] = [
  ...ACADEMY_PERSONAL_PILOT_REVIEWS.map(({ lessonId, technicalStatus }) => ({
    lessonId,
    technicalStatus,
    originPhase: '0.14E' as const,
    personalStatus: 'not-reviewed' as const,
  })),
  ...ACADEMY_STAGE_0_LESSON_CURATIONS.map(({ lessonId, technicalStatus }) => ({
    lessonId,
    technicalStatus,
    originPhase: '0.14F' as const,
    personalStatus: 'not-reviewed' as const,
  })),
] as const

export function academyPersonalReviewQueueEntry(lessonId: string): AcademyPersonalReviewQueueEntry | undefined {
  return ACADEMY_PERSONAL_REVIEW_QUEUE.find((item) => item.lessonId === lessonId)
}
