import type { AcademyLegacySectionAlias, AcademyReaderSection, AcademyVisualCue } from '../../academyReaderModel'
import { academyStage2LessonCuration } from './stage2Lessons'

const countWords = (value: string) => value.replace(/[`#*_|>~-]/g, ' ').trim().split(/\s+/).filter(Boolean).length

function pendingCue(lessonId: string, sectionId: string, order: number, title: string): AcademyVisualCue {
  return {
    cueId: `reader.cue.${sectionId}`, lessonId, sectionId, order, purpose: 'follow', kind: 'none', sourceType: 'none',
    visualDecision: 'text-sufficient', selectorIds: [], isolation: [], isolationIds: [], transparencyById: {}, labels: [], labelDefinitions: [],
    pedagogicalQuestion: `¿Qué relación esencial explica «${title}»?`, caption: title,
    altText: `El apartado «${title}» conserva una explicación textual completa.`, fidelity: 'not-applicable',
    limitations: ['No se añade una imagen decorativa.'], expectedObservation: 'La explicación puede seguirse sin depender de un visual.',
    readingModePolicy: 'omit', semanticSpecificity: 'section-specific', evidenceOfSpecificity: [], reviewStatus: 'unreviewed',
    implementationStatus: 'not-required', provenance: 'editorial-decision', sourceRole: 'none', curationStatus: 'unnecessary',
  }
}

export function applyAcademyStage2LessonCuration(lessonId: string, sourceSections: readonly AcademyReaderSection[]): AcademyReaderSection[] {
  const curation = academyStage2LessonCuration(lessonId)
  if (!curation) return [...sourceSections]
  const source = sourceSections.find(({ sourceBlockId }) => sourceBlockId === curation.sourceBlockId) ?? sourceSections[0]
  if (!source) throw new Error(`La lección ${lessonId} no contiene su bloque fuente.`)
  return curation.sections.map((item, index) => ({
    sectionId: item.sectionId, lessonId, blockId: curation.sourceBlockId, sourceBlockId: curation.sourceBlockId,
    sourceBlockIds: [curation.sourceBlockId], sourceBlockVersion: source.sourceBlockVersion,
    order: index + 1, ordinal: index + 1, heading: item.title, headingLevel: 2, title: item.title, role: item.role,
    markdown: item.markdown, wordCount: countWords(item.markdown), visualCueIds: [`reader.cue.${item.sectionId}`], glossaryTermIds: [],
    requiredForStudy: item.requiredForStudy ?? !['reference', 'sources', 'limitations'].includes(item.role),
    collapsible: item.collapsible ?? ['reference', 'sources', 'limitations'].includes(item.role),
    defaultExpanded: !(item.collapsible ?? ['reference', 'sources', 'limitations'].includes(item.role)),
    curationMethod: 'pilot-override', curationConfidence: 'high', visualCue: pendingCue(lessonId, item.sectionId, index + 1, item.title),
  }))
}

export function academyStage2LegacyAliases(lessonId: string, historicalSections: readonly AcademyReaderSection[], currentSections: readonly AcademyReaderSection[]): AcademyLegacySectionAlias[] {
  if (!academyStage2LessonCuration(lessonId) || currentSections.length === 0) return []
  return historicalSections.map((historical, index) => {
    const target = currentSections.find(({ role }) => role === historical.role) ?? currentSections[Math.min(index, currentSections.length - 1)] ?? currentSections[0]
    return { lessonId, legacySegmentId: historical.sectionId, sectionId: target.sectionId, newSectionId: target.sectionId, method: 'explicit-alias', matchMethod: 'explicit-alias', confidence: 'high', fallbackSectionId: currentSections[0].sectionId }
  })
}
