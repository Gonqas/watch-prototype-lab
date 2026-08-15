import { academyStage0ActivityPresentation } from '../phase014f/stage0Activities'
import { academyStage0PersonalPracticesForLesson } from '../phase014f/stage0Practices'
import { academyStage1ActivityPresentation } from './stage1Activities'
import { academyStage1PersonalPracticesForLesson } from './stage1Practices'

/** @deprecated Use academyPersonalActivityPresentation014H through the public facade. */
export function academyPersonalActivityPresentation014G(activityId: string) {
  return academyStage1ActivityPresentation(activityId) ?? academyStage0ActivityPresentation(activityId)
}

/** @deprecated Use academyPersonalPracticesForLesson014H through the public facade. */
export function academyPersonalPracticesForLesson014G(lessonId: string) {
  return [...academyStage0PersonalPracticesForLesson(lessonId), ...academyStage1PersonalPracticesForLesson(lessonId)]
}
