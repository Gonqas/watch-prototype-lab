import { ACADEMY_PERSONAL_REVIEW_QUEUE_014G } from '../phase014g/reviewQueue'
import { ACADEMY_STAGE_2_LESSON_CURATIONS } from './stage2Lessons'

export interface AcademyPersonalReviewQueue014HEntry {
  lessonId: string
  technicalStatus: 'source-reviewed' | 'source-limited' | 'source-needed' | 'technical-conflict'
  originPhase: '0.14E' | '0.14F' | '0.14G' | '0.14H'
  personalStatus: 'not-reviewed'
}

const candidates: AcademyPersonalReviewQueue014HEntry[] = [
  ...ACADEMY_PERSONAL_REVIEW_QUEUE_014G,
  ...ACADEMY_STAGE_2_LESSON_CURATIONS.map(({ lessonId, technicalStatus }) => ({ lessonId, technicalStatus, originPhase: '0.14H' as const, personalStatus: 'not-reviewed' as const })),
]

export const ACADEMY_PERSONAL_REVIEW_QUEUE_014H: readonly AcademyPersonalReviewQueue014HEntry[] = [...new Map(candidates.map((item) => [item.lessonId, item])).values()]
export function academyPersonalReviewQueue014HEntry(lessonId: string) { return ACADEMY_PERSONAL_REVIEW_QUEUE_014H.find((item) => item.lessonId === lessonId) }
