import { ACADEMY_PERSONAL_REVIEW_QUEUE } from '../phase014f/reviewQueue'
import { ACADEMY_STAGE_1_LESSON_CURATIONS } from './stage1Lessons'

export interface AcademyPersonalReviewQueue014GEntry {
  lessonId: string
  technicalStatus: 'source-reviewed' | 'source-limited' | 'source-needed' | 'technical-conflict'
  originPhase: '0.14E' | '0.14F' | '0.14G'
  personalStatus: 'not-reviewed'
}

const candidates: AcademyPersonalReviewQueue014GEntry[] = [
  ...ACADEMY_PERSONAL_REVIEW_QUEUE,
  ...ACADEMY_STAGE_1_LESSON_CURATIONS.map(({ lessonId, technicalStatus }) => ({ lessonId, technicalStatus, originPhase: '0.14G' as const, personalStatus: 'not-reviewed' as const })),
]

export const ACADEMY_PERSONAL_REVIEW_QUEUE_014G: readonly AcademyPersonalReviewQueue014GEntry[] = [...new Map(candidates.map((item) => [item.lessonId, item])).values()]

export function academyPersonalReviewQueue014GEntry(lessonId: string): AcademyPersonalReviewQueue014GEntry | undefined {
  return ACADEMY_PERSONAL_REVIEW_QUEUE_014G.find((item) => item.lessonId === lessonId)
}
