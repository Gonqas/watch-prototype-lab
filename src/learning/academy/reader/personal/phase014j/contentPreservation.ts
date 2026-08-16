import type { AcademyReaderSection } from '../../academyReaderModel'
import { academyContentPreservation, academyRetainedSourceSectionDispositions } from '../sourcePreservingComposition'
import { ACADEMY_STAGE_4_CATALOG } from './stage4Catalog'

export function academy014JSourceSectionDispositions(lessonId: string, sourceSections: readonly AcademyReaderSection[]) {
  if (!ACADEMY_STAGE_4_CATALOG.some((item) => item.lessonId === lessonId)) return []
  return academyRetainedSourceSectionDispositions(lessonId, sourceSections, 'La teoría authored permanece íntegra y visible; 0.14J añade autoridad documental, límites de simulación y trazabilidad.')
}

export function academy014JContentPreservation(lessonId: string, sourceSections: readonly AcademyReaderSection[], visibleSections: readonly AcademyReaderSection[]) {
  const dispositions = academy014JSourceSectionDispositions(lessonId, sourceSections)
  return { row: academyContentPreservation(lessonId, sourceSections, visibleSections, dispositions), dispositions }
}
