import type { AcademyReaderSection } from '../../academyReaderModel'
import { academyContentPreservation, academyRetainedSourceSectionDispositions } from '../sourcePreservingComposition'
import { ACADEMY_STAGE_0_1_REMEDIATIONS } from './remediationStage01'
import { ACADEMY_STAGE_3_CATALOG } from './stage3Catalog'

export function academy014ISourceSectionDispositions(lessonId: string, sourceSections: readonly AcademyReaderSection[]) {
  if (!ACADEMY_STAGE_0_1_REMEDIATIONS.some((item) => item.lessonId === lessonId) && !ACADEMY_STAGE_3_CATALOG.some((item) => item.lessonId === lessonId)) return []
  return academyRetainedSourceSectionDispositions(lessonId, sourceSections)
}

export function academy014IContentPreservation(lessonId: string, sourceSections: readonly AcademyReaderSection[], visibleSections: readonly AcademyReaderSection[]) {
  const dispositions = academy014ISourceSectionDispositions(lessonId, sourceSections)
  return { row: academyContentPreservation(lessonId, sourceSections, visibleSections, dispositions), dispositions }
}
