import { academyStage0ActivityPresentation } from '../phase014f/stage0Activities'
import { academyStage0PersonalPracticesForLesson } from '../phase014f/stage0Practices'
import { academyStage1ActivityPresentation } from './stage1Activities'
import { academyStage1PersonalPracticesForLesson } from './stage1Practices'

export function academyPersonalActivityPresentation(activityId: string) {
  return academyStage1ActivityPresentation(activityId) ?? academyStage0ActivityPresentation(activityId)
}

export function academyPersonalPracticesForLesson(lessonId: string) {
  return [...academyStage0PersonalPracticesForLesson(lessonId), ...academyStage1PersonalPracticesForLesson(lessonId)]
}
