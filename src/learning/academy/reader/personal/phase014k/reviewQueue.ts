import { ACADEMY_PERSONAL_REVIEW_QUEUE_014J } from '../phase014j/reviewQueue'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'

export interface AcademyPersonalReviewQueue014KEntry {
  lessonId:string
  technicalStatus:'source-reviewed'|'source-limited'|'source-needed'|'technical-conflict'
  personalStatus:'not-reviewed'|'clear'|'needs-rework'
  originPhase:'0.14E'|'0.14F'|'0.14G'|'0.14H'|'0.14I'|'0.14J'|'0.14K'
}
const queue=new Map<string,AcademyPersonalReviewQueue014KEntry>(ACADEMY_PERSONAL_REVIEW_QUEUE_014J.map((item)=>[item.lessonId,{...item}]))
for(const item of ACADEMY_STAGE_5_CATALOG)if(!queue.has(item.lessonId))queue.set(item.lessonId,{lessonId:item.lessonId,technicalStatus:'source-limited',personalStatus:'not-reviewed',originPhase:'0.14K'})
export const ACADEMY_PERSONAL_REVIEW_QUEUE_014K=[...queue.values()]
export const ACADEMY_STAGE_5_METHOD_SELF_REVIEW=['entiendo-la-matriz','entiendo-los-datums','entiendo-la-cadena-radial','entiendo-la-cadena-axial','entiendo-los-unknowns','entiendo-la-validacion-pendiente'] as const
export function academyPersonalReviewQueue014KEntry(lessonId:string){return ACADEMY_PERSONAL_REVIEW_QUEUE_014K.find((item)=>item.lessonId===lessonId)}
