import type { AcademyReaderSection } from '../../academyReaderModel'
import { academyContentPreservation, academyRetainedSourceSectionDispositions } from '../sourcePreservingComposition'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'

export function academy014KSourceSectionDispositions(lessonId:string,sourceSections:readonly AcademyReaderSection[]){
  if(!ACADEMY_STAGE_5_CATALOG.some((item)=>item.lessonId===lessonId))return[]
  return academyRetainedSourceSectionDispositions(lessonId,sourceSections,'La teoría authored permanece íntegra y visible; 0.14K añade método de integración, trazabilidad, visuales y límites físicos.')
}
export function academy014KContentPreservation(lessonId:string,sourceSections:readonly AcademyReaderSection[],visibleSections:readonly AcademyReaderSection[]){const dispositions=academy014KSourceSectionDispositions(lessonId,sourceSections);return{row:academyContentPreservation(lessonId,sourceSections,visibleSections,dispositions),dispositions}}

