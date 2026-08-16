import { academyPersonalActivityPresentation014J, academyPersonalPracticesForLesson014J, academyActiveMetadata014J } from '../phase014j/stage4Registry'
import { ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS, academyStage5ActivityPresentation } from './stage5Activities'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'
import { ACADEMY_STAGE_5_CLAIMS } from './stage5Claims'
import { ACADEMY_STAGE_5_LESSON_CURATIONS, academyStage5LessonCuration } from './stage5Lessons'
import { ACADEMY_STAGE_5_PERSONAL_PRACTICES, academyStage5PersonalPracticesForLesson } from './stage5Practices'
import { ACADEMY_STAGE_5_PREREQUISITE_OVERRIDES } from './stage5Prerequisites'
import { ACADEMY_STAGE_5_3D_STATES } from './stage5ThreeDStates'
import { ACADEMY_STAGE_5_PHOTO_BRIEFS, ACADEMY_STAGE_5_REUSED_VISUALS, ACADEMY_STAGE_5_VISUAL_DESIGNS } from './stage5Visuals'
import { ACADEMY_STAGE_5_INTEGRATION_REFS, ACADEMY_STAGE_5_PARTIAL_RESOLUTIONS } from './stage5IntegrationRefs'

export const ACADEMY_STAGE_5_REGISTRY_014K={phase:'0.14K',curriculumStatus:'complete-method',chapters:['chapter.5.1','chapter.5.2','chapter.5.3','chapter.5.4','chapter.5.5'],catalog:ACADEMY_STAGE_5_CATALOG,lessons:ACADEMY_STAGE_5_LESSON_CURATIONS,activities:ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS,claims:ACADEMY_STAGE_5_CLAIMS,prerequisites:ACADEMY_STAGE_5_PREREQUISITE_OVERRIDES,practices:ACADEMY_STAGE_5_PERSONAL_PRACTICES,visuals:ACADEMY_STAGE_5_VISUAL_DESIGNS,reusedVisualIds:ACADEMY_STAGE_5_REUSED_VISUALS,photoBriefs:ACADEMY_STAGE_5_PHOTO_BRIEFS,threeD:ACADEMY_STAGE_5_3D_STATES,integrationRefs:ACADEMY_STAGE_5_INTEGRATION_REFS,partialResolutions:ACADEMY_STAGE_5_PARTIAL_RESOLUTIONS} as const
export function academyPersonalActivityPresentation014K(activityId:string){return academyStage5ActivityPresentation(activityId)??academyPersonalActivityPresentation014J(activityId)}
export function academyPersonalPracticesForLesson014K(lessonId:string){return[...academyPersonalPracticesForLesson014J(lessonId),...academyStage5PersonalPracticesForLesson(lessonId)]}
export function academyActiveMetadata014K(lessonId:string){return academyStage5LessonCuration(lessonId)??academyActiveMetadata014J(lessonId)}

