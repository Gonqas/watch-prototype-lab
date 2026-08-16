import type { AcademyReaderSection } from '../academyReaderModel'
import type {
  AcademyContentPreservationRow,
  AcademySourceSectionDisposition,
  AcademySourceSectionDispositionAction,
} from './types'

export const academySourceSectionWordCount = (value: string) => value
  .replace(/\{\{term:([^}]+)\}\}/g, '$1')
  .replace(/[`#*_|>~-]/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean).length

export function academySourceSectionIsBoilerplate(section: AcademyReaderSection): boolean {
  if (!section.markdown.trim() || section.wordCount === 0) return true
  return /^(contenido|continuaci[oó]n|pendiente|todo)$/i.test(section.markdown.trim())
    || /metainformaci[oó]n interna|texto de plantilla/i.test(section.title)
}

export function academyRetainedSourceSectionDispositions(
  lessonId: string,
  sourceSections: readonly AcademyReaderSection[],
  reason = 'La sección authored permanece íntegra y visible; la curación solo organiza o complementa su lectura.',
): AcademySourceSectionDisposition[] {
  return sourceSections.map((section) => ({
    lessonId,
    sourceSectionId: section.sectionId,
    sourceBlockId: section.sourceBlockId,
    sourceRole: section.role,
    sourceHeading: section.title,
    sourceWordCount: section.wordCount,
    action: 'retained',
    targetSectionIds: [section.sectionId],
    reason,
    conceptIds: [...(section.conceptIds ?? [])],
    claimIds: [...(section.claimIds ?? [])],
    glossaryTermIds: [...section.glossaryTermIds],
  }))
}

export function academyContentPreservation(
  lessonId: string,
  sourceSections: readonly AcademyReaderSection[],
  visibleSections: readonly AcademyReaderSection[],
  dispositions: readonly AcademySourceSectionDisposition[],
): AcademyContentPreservationRow {
  const sourceTotalWords = sourceSections.reduce((sum, { wordCount }) => sum + wordCount, 0)
  const sourceBoilerplateWords = sourceSections.filter(academySourceSectionIsBoilerplate).reduce((sum, { wordCount }) => sum + wordCount, 0)
  const sourceSubstantiveWords = sourceTotalWords - sourceBoilerplateWords
  const dispositionById = new Map(dispositions.map((item) => [item.sourceSectionId, item]))
  const missing = sourceSections.filter(({ sectionId }) => !dispositionById.has(sectionId))
  if (missing.length) throw new Error(`Secciones fuente sin disposición en ${lessonId}: ${missing.map(({ sectionId }) => sectionId).join(', ')}`)
  const actions = (wanted: readonly AcademySourceSectionDispositionAction[]) => dispositions.filter(({ action }) => wanted.includes(action))
  const retainedIds = new Set(actions(['retained']).map(({ sourceSectionId }) => sourceSectionId))
  const retainedSourceWords = sourceSections
    .filter((section) => retainedIds.has(section.sectionId) && !academySourceSectionIsBoilerplate(section))
    .reduce((sum, { wordCount }) => sum + wordCount, 0)
  const rewrittenEquivalentWords = actions(['merged', 'replaced-equivalent']).reduce((sum, { sourceWordCount }) => sum + sourceWordCount, 0)
  const removedWords = dispositions.filter(({ action }) => action.startsWith('removed-')).reduce((sum, { sourceWordCount }) => sum + sourceWordCount, 0)
  const substantiveRemoved = dispositions.filter(({ action, sourceSectionId }) => action.startsWith('removed-')
    && !academySourceSectionIsBoilerplate(sourceSections.find(({ sectionId }) => sectionId === sourceSectionId)!))
  const covered = retainedSourceWords + rewrittenEquivalentWords
  const glossaryVisible = new Set(visibleSections.flatMap(({ glossaryTermIds }) => glossaryTermIds))
  return {
    lessonId,
    sourceSectionCount: sourceSections.length,
    sourceTotalWords,
    sourceSubstantiveWords,
    visibleWords: visibleSections.reduce((sum, { wordCount }) => sum + wordCount, 0),
    retainedSourceWords,
    rewrittenEquivalentWords,
    removedWords,
    substantiveCoverage: sourceSubstantiveWords ? covered / sourceSubstantiveWords : 1,
    reductionJustifications: substantiveRemoved.length
      ? substantiveRemoved.map(({ sourceSectionId, reason }) => `${sourceSectionId}: ${reason}`)
      : ['No se elimina ninguna idea sustantiva authored.'],
    glossaryTermIdsPreserved: [...new Set(sourceSections.flatMap(({ glossaryTermIds }) => glossaryTermIds))].filter((termId) => glossaryVisible.has(termId)),
  }
}
