import { ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS } from './stage4Activities'
import { ACADEMY_STAGE_4_CATALOG } from './stage4Catalog'
import { ACADEMY_STAGE_4_CLAIMS } from './stage4Claims'
import { ACADEMY_STAGE_4_LESSON_CURATIONS } from './stage4Lessons'
import { ACADEMY_STAGE_4_PERSONAL_PRACTICES } from './stage4Practices'
import { ACADEMY_STAGE_4_PREREQUISITE_OVERRIDES } from './stage4Prerequisites'
import { ACADEMY_STAGE_4_SAFETY_AUDITS } from './stage4Safety'
import { ACADEMY_STAGE_4_3D_AUDIT, ACADEMY_STAGE_4_PART_MAPPINGS, ACADEMY_STAGE_4_SELECTOR_MAPPINGS } from './stage4ThreeD'
import { ACADEMY_STAGE_4_PHOTO_BRIEFS, ACADEMY_STAGE_4_REUSED_VISUALS, ACADEMY_STAGE_4_VISUAL_DESIGNS } from './stage4Visuals'
import { academyPersonalActivityPresentation014I, academyPersonalPracticesForLesson014I } from '../phase014i/stage3Registry'
import { academyStage3LessonCuration } from '../phase014i/stage3Lessons'
import { academyActiveTechnicalStatus014J } from './activeTechnicalStatus'
import { academyStage4ActivityPresentation } from './stage4Activities'
import { academyStage4PersonalPracticesForLesson } from './stage4Practices'

export const ACADEMY_STAGE_4_REGISTRY_014J = {
  phase: '0.14J', chapters: ['chapter.4.1','chapter.4.2','chapter.4.3','chapter.4.4','chapter.4.5'], catalog: ACADEMY_STAGE_4_CATALOG,
  lessons: ACADEMY_STAGE_4_LESSON_CURATIONS, activities: ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS, claims: ACADEMY_STAGE_4_CLAIMS,
  prerequisites: ACADEMY_STAGE_4_PREREQUISITE_OVERRIDES, practices: ACADEMY_STAGE_4_PERSONAL_PRACTICES, safety: ACADEMY_STAGE_4_SAFETY_AUDITS,
  visuals: ACADEMY_STAGE_4_VISUAL_DESIGNS, reusedVisualIds: ACADEMY_STAGE_4_REUSED_VISUALS, photoBriefs: ACADEMY_STAGE_4_PHOTO_BRIEFS,
  threeD: ACADEMY_STAGE_4_3D_AUDIT, partMappings: ACADEMY_STAGE_4_PART_MAPPINGS, selectorMappings: ACADEMY_STAGE_4_SELECTOR_MAPPINGS,
} as const

export function academyPersonalActivityPresentation014J(activityId: string) {
  return academyStage4ActivityPresentation(activityId) ?? academyPersonalActivityPresentation014I(activityId)
}

export function academyPersonalPracticesForLesson014J(lessonId: string) {
  return [...academyPersonalPracticesForLesson014I(lessonId), ...academyStage4PersonalPracticesForLesson(lessonId)]
}

export function academyActiveMetadata014J(lessonId: string) {
  const stage4 = ACADEMY_STAGE_4_LESSON_CURATIONS.find((item) => item.lessonId === lessonId)
  if (stage4) return stage4
  const stage3 = academyStage3LessonCuration(lessonId)
  const active = academyActiveTechnicalStatus014J(lessonId)
  return stage3 && active ? { ...stage3, technicalStatus: active.technicalStatus } : undefined
}
