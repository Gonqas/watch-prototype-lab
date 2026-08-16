import type { AcademyStage5LessonCuration } from '../types'
import { ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS } from './stage5Activities'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'
import { academyStage5ClaimsForLesson } from './stage5Claims'
import { ACADEMY_STAGE_5_SECTIONS } from './stage5Sections'

export const ACADEMY_STAGE_5_LESSON_CURATIONS: readonly AcademyStage5LessonCuration[] = ACADEMY_STAGE_5_CATALOG.map((item)=>({
  lessonId:item.lessonId,sourceBlockId:item.lessonId.replace('lesson.','block.'),macroStage:5,chapterId:item.chapterId,pathRole:item.pathRole,compositionMode:'augment',editorialArchetype:item.editorialArchetype,centralQuestion:item.centralQuestion,whyNow:item.whyNow,observableOutcome:item.observableOutcome,sections:ACADEMY_STAGE_5_SECTIONS[item.lessonId]??[],visualDesignIds:item.visualDesignIds,activityPresentations:ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS.filter(({lessonId})=>lessonId===item.lessonId),sourceClaimIds:academyStage5ClaimsForLesson(item.lessonId).map(({claimId})=>claimId),limitations:[item.sourceScope,'Cobertura curricular completa por método; los datos y la validación del proyecto siguen separados.'],personalReviewStatus:'not-reviewed',technicalStatus:'source-limited',curriculumStatus:'complete-method',
}))
const byId=new Map(ACADEMY_STAGE_5_LESSON_CURATIONS.map((item)=>[item.lessonId,item]))
export function academyStage5LessonCuration(lessonId:string){return byId.get(lessonId)}

