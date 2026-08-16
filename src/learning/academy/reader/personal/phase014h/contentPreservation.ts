import type { AcademyReaderSection } from '../../academyReaderModel'
import type { AcademySourceSectionDisposition } from '../types'
import { academyStage2SourceSectionDispositions } from './readerCorrections'
import { ACADEMY_STAGE_2_LEGACY_SUMMARY_SECTIONS } from './stage2Sections'

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

export function academySourceSectionIsBoilerplate(section: AcademyReaderSection): boolean {
  if (!section.markdown.trim() || section.wordCount === 0) return true
  return /^(contenido|continuaci[oó]n|pendiente|todo)$/i.test(section.markdown.trim())
    || /metainformaci[oó]n interna|texto de plantilla/i.test(section.title)
}

export function academyStage2ContentPreservation(
  lessonId: string,
  sourceSections: readonly AcademyReaderSection[],
  visibleSections: readonly AcademyReaderSection[],
): { row: AcademyStage2ContentPreservationRow; dispositions: readonly AcademySourceSectionDisposition[] } {
  const dispositions = academyStage2SourceSectionDispositions(lessonId, sourceSections)
  const sourceTotalWords = sourceSections.reduce((sum, { wordCount }) => sum + wordCount, 0)
  const boilerplate = sourceSections.filter(academySourceSectionIsBoilerplate)
  const sourceBoilerplateWords = boilerplate.reduce((sum, { wordCount }) => sum + wordCount, 0)
  const sourceSubstantiveWords = sourceTotalWords - sourceBoilerplateWords
  const retainedIds = new Set(dispositions.filter(({ action }) => action === 'retained').map(({ sourceSectionId }) => sourceSectionId))
  const retainedSourceWords = sourceSections.filter((section) => retainedIds.has(section.sectionId) && !academySourceSectionIsBoilerplate(section)).reduce((sum, { wordCount }) => sum + wordCount, 0)
  const rewrittenEquivalentWords = dispositions.filter(({ action }) => action === 'merged' || action === 'replaced-equivalent').reduce((sum, { sourceWordCount }) => sum + sourceWordCount, 0)
  const removedWords = dispositions.filter(({ action }) => action.startsWith('removed-')).reduce((sum, { sourceWordCount }) => sum + sourceWordCount, 0)
  const covered = retainedSourceWords + rewrittenEquivalentWords
  const glossarySource = [...new Set(sourceSections.flatMap(({ glossaryTermIds }) => glossaryTermIds))]
  const glossaryVisible = new Set(visibleSections.flatMap(({ glossaryTermIds }) => glossaryTermIds))
  return {
    row: {
      lessonId,
      sourceSectionCount: sourceSections.length,
      sourceTotalWords,
      sourceSubstantiveWords,
      sourceBoilerplateWords,
      visible014HBeforeWords: (ACADEMY_STAGE_2_LEGACY_SUMMARY_SECTIONS[lessonId] ?? []).reduce((sum, markdown) => sum + countWords(markdown), 0),
      visible014HAfterWords: visibleSections.reduce((sum, { wordCount }) => sum + wordCount, 0),
      retainedSourceWords,
      rewrittenEquivalentWords,
      removedWords,
      retentionRatio: sourceSubstantiveWords ? retainedSourceWords / sourceSubstantiveWords : 1,
      substantiveCoverage: sourceSubstantiveWords ? covered / sourceSubstantiveWords : 1,
      reductionJustifications: removedWords ? ['Las reducciones se detallan por disposición.'] : ['No se reduce teoría fuente: todas las secciones authored se conservan íntegramente.'],
      glossaryTermIdsPreserved: glossarySource.filter((termId) => glossaryVisible.has(termId)),
    },
    dispositions,
  }
}
