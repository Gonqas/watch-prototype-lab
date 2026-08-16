import { academyStage0ActivityPresentation } from '../phase014f/stage0Activities'
import { academyStage0PersonalPracticesForLesson } from '../phase014f/stage0Practices'
import { academyStage1ActivityPresentation } from '../phase014g/stage1Activities'
import { academyStage1PersonalPracticesForLesson } from '../phase014g/stage1Practices'
import { academyStage2ActivityPresentation } from '../phase014h/stage2Activities'
import { academyStage2PersonalPracticesForLesson } from '../phase014h/stage2Practices'
import { academyStage3ActivityPresentation } from './stage3Activities'
import { academyStage3PersonalPracticesForLesson } from './stage3Practices'

export function academyPersonalActivityPresentation014I(activityId: string) {
  return academyStage3ActivityPresentation(activityId) ?? academyStage2ActivityPresentation(activityId) ?? academyStage1ActivityPresentation(activityId) ?? academyStage0ActivityPresentation(activityId)
}

export function academyPersonalPracticesForLesson014I(lessonId: string) {
  return [...academyStage0PersonalPracticesForLesson(lessonId), ...academyStage1PersonalPracticesForLesson(lessonId), ...academyStage2PersonalPracticesForLesson(lessonId), ...academyStage3PersonalPracticesForLesson(lessonId)]
}
