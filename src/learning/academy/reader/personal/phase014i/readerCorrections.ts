import type { AcademyLegacySectionAlias, AcademyReaderSection, AcademyVisualCue } from '../../academyReaderModel'
import type { AcademySourcePreservingLessonContext, AcademyStage3SectionSpec } from '../types'
import { academySourceSectionWordCount } from '../sourcePreservingComposition'
import { academy014ISourceSectionDispositions } from './contentPreservation'
import { academyStage01Remediation, academyStage01RemediationAdditions } from './remediationStage01'
import { academyStage3LessonCuration } from './stage3Lessons'

const glossaryTerms = (value: string) => [...new Set([...value.matchAll(/\{\{term:([^}]+)\}\}/g)].map((match) => match[1]))]

function pendingCue(lessonId: string, sectionId: string, title: string): AcademyVisualCue {
  return {
    cueId: `reader.cue.${sectionId}`, lessonId, sectionId, order: 0, purpose: 'follow', kind: 'none', sourceType: 'none',
    visualDecision: 'text-sufficient', selectorIds: [], isolation: [], isolationIds: [], transparencyById: {}, labels: [], labelDefinitions: [],
    pedagogicalQuestion: `¿Qué decisión organiza «${title}»?`, caption: title, altText: `El apartado «${title}» conserva una explicación textual completa.`,
    fidelity: 'not-applicable', limitations: ['No se añade una imagen decorativa.'], expectedObservation: 'La explicación puede seguirse sin depender de un visual.',
    readingModePolicy: 'omit', semanticSpecificity: 'section-specific', evidenceOfSpecificity: [], reviewStatus: 'unreviewed', implementationStatus: 'not-required',
    provenance: 'editorial-decision', sourceRole: 'none', curationStatus: 'unnecessary',
  }
}

function curatedSection(lessonId: string, spec: AcademyStage3SectionSpec, sourceSections: readonly AcademyReaderSection[]): AcademyReaderSection {
  const source = sourceSections[0]
  if (!source) throw new Error(`La lección ${lessonId} no contiene teoría authored.`)
  const curation = academyStage3LessonCuration(lessonId)
  if (!curation) throw new Error(`Falta curación de etapa 3 para ${lessonId}.`)
  return {
    sectionId: spec.sectionId, lessonId, blockId: curation.sourceBlockId, sourceBlockId: curation.sourceBlockId,
    sourceBlockIds: [...new Set(sourceSections.flatMap(({ sourceBlockIds, sourceBlockId }) => sourceBlockIds.length ? sourceBlockIds : [sourceBlockId]))],
    sourceBlockVersion: source.sourceBlockVersion, order: 0, ordinal: 0, heading: spec.title, headingLevel: 2, title: spec.title, role: spec.role,
    markdown: spec.markdown, wordCount: academySourceSectionWordCount(spec.markdown), visualCueIds: [`reader.cue.${spec.sectionId}`], glossaryTermIds: glossaryTerms(spec.markdown),
    conceptIds: [...new Set(sourceSections.flatMap(({ conceptIds = [] }) => conceptIds))], claimIds: [...curation.sourceClaimIds],
    sourceLocators: [...new Set(sourceSections.flatMap(({ sourceLocators = [] }) => sourceLocators))],
    requiredForStudy: spec.requiredForStudy ?? !['reference', 'sources', 'limitations'].includes(spec.role),
    collapsible: spec.collapsible ?? ['reference', 'sources', 'limitations'].includes(spec.role),
    defaultExpanded: !(spec.collapsible ?? ['reference', 'sources', 'limitations'].includes(spec.role)),
    curationMethod: 'pilot-override', curationConfidence: 'high', visualCue: pendingCue(lessonId, spec.sectionId, spec.title),
  }
}

function reorder(sections: readonly AcademyReaderSection[]): AcademyReaderSection[] {
  return sections.map((section, index) => ({ ...section, order: index + 1, ordinal: index + 1, visualCue: { ...section.visualCue, order: index + 1 } }))
}

function composeStage3(context: AcademySourcePreservingLessonContext): AcademyReaderSection[] {
  const curation = academyStage3LessonCuration(context.lessonId)
  if (!curation) return [...context.currentSections]
  const dispositions = academy014ISourceSectionDispositions(context.lessonId, context.authoredSections)
  if (dispositions.length !== context.authoredSections.length || dispositions.some(({ action }) => action !== 'retained')) throw new Error(`La composición inicial de etapa 3 debe conservar toda la teoría de ${context.lessonId}.`)
  const additions = curation.sections.map((spec) => ({ spec, section: curatedSection(context.lessonId, spec, context.authoredSections) }))
  const before = additions.filter(({ spec }) => spec.placement === 'before-source').map(({ section }) => section)
  const adjacent = additions.filter(({ spec }) => spec.placement === 'after-first-substantive-source').map(({ section }) => section)
  const after = additions.filter(({ spec }) => spec.placement === 'after-source').map(({ section }) => section)
  const tail = additions.filter(({ spec }) => spec.placement === 'reference-tail').map(({ section }) => section)
  const substantive = context.authoredSections.filter(({ role, markdown }) => !['reference', 'sources', 'limitations'].includes(role) && markdown.trim())
  const references = context.authoredSections.filter((section) => !substantive.includes(section))
  const [first, ...rest] = substantive
  return reorder([...before, ...(first ? [first] : []), ...adjacent, ...rest, ...after, ...references, ...tail])
}

function composeRemediation(context: AcademySourcePreservingLessonContext): AcademyReaderSection[] {
  if (!academyStage01Remediation(context.lessonId)) return [...context.currentSections]
  const additions = academyStage01RemediationAdditions(context)
  const references = context.authoredSections.filter(({ role }) => ['reference', 'sources', 'limitations'].includes(role))
  const substantive = context.authoredSections.filter((section) => !references.includes(section))
  return reorder([...substantive, ...additions, ...references])
}

export function applyAcademy014ILessonCuration(context: AcademySourcePreservingLessonContext): AcademyReaderSection[] {
  return academyStage3LessonCuration(context.lessonId) ? composeStage3(context) : composeRemediation(context)
}

export function academy014ILegacyAliases(context: AcademySourcePreservingLessonContext, currentSections: readonly AcademyReaderSection[]): AcademyLegacySectionAlias[] {
  if (!academyStage3LessonCuration(context.lessonId) && !academyStage01Remediation(context.lessonId)) return []
  const first = currentSections[0]?.sectionId
  if (!first) return []
  return context.previousPhaseSections.map((historical) => {
    const target = currentSections.find(({ sectionId }) => sectionId === historical.sectionId)
      ?? currentSections.find(({ role }) => role === historical.role)
      ?? currentSections[0]
    return {
      lessonId: context.lessonId, legacySegmentId: historical.sectionId, sectionId: target.sectionId, newSectionId: target.sectionId,
      method: 'explicit-alias', matchMethod: 'explicit-alias', confidence: target.sectionId === historical.sectionId ? 'high' : 'medium', fallbackSectionId: first,
      reason: target.sectionId === historical.sectionId ? 'El apartado conserva su ID.' : 'El apartado histórico se resuelve al equivalente semántico preservado en 0.14I.',
    }
  })
}
