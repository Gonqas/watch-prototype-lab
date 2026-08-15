import { academyStage0ActivityPresentation } from '../phase014f/stage0Activities'
import { academyStage0PersonalPracticesForLesson } from '../phase014f/stage0Practices'
import { academyStage1ActivityPresentation } from '../phase014g/stage1Activities'
import { academyStage1PersonalPracticesForLesson } from '../phase014g/stage1Practices'
import { academyStage2ActivityPresentation } from './stage2Activities'
import { academyStage2PersonalPracticesForLesson } from './stage2Practices'

export function academyPersonalActivityPresentation014H(activityId: string) {
  return academyStage2ActivityPresentation(activityId) ?? academyStage1ActivityPresentation(activityId) ?? academyStage0ActivityPresentation(activityId)
}

export function academyPersonalPracticesForLesson014H(lessonId: string) {
  return [
    ...academyStage0PersonalPracticesForLesson(lessonId),
    ...academyStage1PersonalPracticesForLesson(lessonId),
    ...academyStage2PersonalPracticesForLesson(lessonId),
  ]
}
