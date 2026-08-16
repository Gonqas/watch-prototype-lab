import type { AcademyReaderSection } from '../../academyReaderModel'
import type { AcademySourceSectionDisposition } from '../types'
import { academyStage2SourceSectionDispositions } from './readerCorrections'
import { ACADEMY_STAGE_2_LEGACY_SUMMARY_SECTIONS } from './stage2Sections'
import { academyContentPreservation } from '../sourcePreservingComposition'

export { academySourceSectionIsBoilerplate } from '../sourcePreservingComposition'

const countWords = (value: string) => value.replace(/\{\{term:([^}]+)\}\}/g, '$1').replace(/[`#*_|>~-]/g, ' ').trim().split(/\s+/).filter(Boolean).length

export interface AcademyStage2ContentPreservationRow {
  lessonId: string
  sourceSectionCount: number
  sourceTotalWords: number
  sourceSubstantiveWords: number
  sourceBoilerplateWords: number
  visible014HBeforeWords: number
  visible014HAfterWords: number
  retainedSourceWords: number
  rewrittenEquivalentWords: number
  removedWords: number
  retentionRatio: number
  substantiveCoverage: number
  reductionJustifications: readonly string[]
  glossaryTermIdsPreserved: readonly string[]
}

export function academyStage2ContentPreservation(
  lessonId: string,
  sourceSections: readonly AcademyReaderSection[],
  visibleSections: readonly AcademyReaderSection[],
): { row: AcademyStage2ContentPreservationRow; dispositions: readonly AcademySourceSectionDisposition[] } {
  const dispositions = academyStage2SourceSectionDispositions(lessonId, sourceSections)
  const generic = academyContentPreservation(lessonId, sourceSections, visibleSections, dispositions)
  const sourceBoilerplateWords = generic.sourceTotalWords - generic.sourceSubstantiveWords
  return {
    row: {
      lessonId,
      sourceSectionCount: sourceSections.length,
      sourceTotalWords: generic.sourceTotalWords,
      sourceSubstantiveWords: generic.sourceSubstantiveWords,
      sourceBoilerplateWords,
      visible014HBeforeWords: (ACADEMY_STAGE_2_LEGACY_SUMMARY_SECTIONS[lessonId] ?? []).reduce((sum, markdown) => sum + countWords(markdown), 0),
      visible014HAfterWords: visibleSections.reduce((sum, { wordCount }) => sum + wordCount, 0),
      retainedSourceWords: generic.retainedSourceWords,
      rewrittenEquivalentWords: generic.rewrittenEquivalentWords,
      removedWords: generic.removedWords,
      retentionRatio: generic.sourceSubstantiveWords ? generic.retainedSourceWords / generic.sourceSubstantiveWords : 1,
      substantiveCoverage: generic.substantiveCoverage,
      reductionJustifications: generic.removedWords ? ['Las reducciones se detallan por disposición.'] : ['No se reduce teoría fuente: todas las secciones authored se conservan íntegramente.'],
      glossaryTermIdsPreserved: generic.glossaryTermIdsPreserved,
    },
    dispositions,
  }
}
