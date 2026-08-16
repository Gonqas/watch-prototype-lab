import type { AcademyLegacySectionAlias, AcademyReaderSection, AcademyVisualCue } from '../../academyReaderModel'
import type { AcademySourcePreservingLessonContext, AcademyStage4SectionSpec } from '../types'
import { academySourceSectionWordCount } from '../sourcePreservingComposition'
import { academy014JSourceSectionDispositions } from './contentPreservation'
import { academyStage4LessonCuration } from './stage4Lessons'
import { academyStage4SectionId } from './stage4Sections'

const PILOT_IDS = new Set(['lesson.miyota8215.architecture', 'lesson.miyota8215.guided-disassembly', 'lesson.miyota8215.inspection'])
const PILOT_EXCLUDED_ROLES = new Set(['orientation', 'purpose', 'sources', 'reference', 'limitations'])
const glossaryTerms = (value: string) => [...new Set([...value.matchAll(/\{\{term:([^}]+)\}\}/g)].map((match) => match[1]))]

function pendingCue(lessonId: string, sectionId: string, title: string): AcademyVisualCue {
  return {
    cueId: `reader.cue.${sectionId}`, lessonId, sectionId, order: 0, purpose: 'follow', kind: 'none', sourceType: 'none', visualDecision: 'text-sufficient',
    selectorIds: [], isolation: [], isolationIds: [], transparencyById: {}, labels: [], labelDefinitions: [], pedagogicalQuestion: `¿Qué evidencia limita «${title}»?`, caption: title,
    altText: `El apartado «${title}» conserva una alternativa textual completa.`, fidelity: 'not-applicable', limitations: ['No se añade una imagen decorativa.'], expectedObservation: 'La decisión se comprende mediante evidencia, alcance y desconocidos.',
    readingModePolicy: 'omit', semanticSpecificity: 'section-specific', evidenceOfSpecificity: [], reviewStatus: 'unreviewed', implementationStatus: 'not-required', provenance: 'editorial-decision', sourceRole: 'none', curationStatus: 'unnecessary',
  }
}

function curatedSection(lessonId: string, spec: AcademyStage4SectionSpec, sourceSections: readonly AcademyReaderSection[]): AcademyReaderSection {
  const source = sourceSections[0]
  const curation = academyStage4LessonCuration(lessonId)
  if (!source || !curation) throw new Error(`Falta fuente o curación de etapa 4 para ${lessonId}.`)
  const authoredText = sourceSections.map(({ markdown }) => markdown).join('\n')
  const markdown = spec.sectionId === academyStage4SectionId.orientation(lessonId) && authoredText.includes(curation.centralQuestion)
    ? spec.markdown.replace(`**Pregunta central:** ${curation.centralQuestion}\n\n`, '')
    : spec.markdown
  return {
    sectionId: spec.sectionId, lessonId, blockId: curation.sourceBlockId, sourceBlockId: curation.sourceBlockId,
    sourceBlockIds: [...new Set(sourceSections.flatMap(({ sourceBlockIds, sourceBlockId }) => sourceBlockIds.length ? sourceBlockIds : [sourceBlockId]))],
    sourceBlockVersion: source.sourceBlockVersion, order: 0, ordinal: 0, heading: spec.title, headingLevel: 2, title: spec.title, role: spec.role, markdown,
    wordCount: academySourceSectionWordCount(markdown), visualCueIds: [`reader.cue.${spec.sectionId}`], glossaryTermIds: glossaryTerms(markdown),
    conceptIds: [...new Set(sourceSections.flatMap(({ conceptIds = [] }) => conceptIds))], claimIds: [...curation.sourceClaimIds], sourceLocators: [...new Set(sourceSections.flatMap(({ sourceLocators = [] }) => sourceLocators))],
    requiredForStudy: spec.requiredForStudy ?? !['reference', 'sources', 'limitations'].includes(spec.role), collapsible: spec.collapsible ?? ['reference', 'sources', 'limitations'].includes(spec.role), defaultExpanded: !(spec.collapsible ?? ['reference', 'sources', 'limitations'].includes(spec.role)),
    curationMethod: 'pilot-override', curationConfidence: 'high', visualCue: pendingCue(lessonId, spec.sectionId, spec.title),
  }
}

function pilotAdditions(context: AcademySourcePreservingLessonContext): AcademyReaderSection[] {
  if (!PILOT_IDS.has(context.lessonId)) return []
  const authoredById = new Map(context.authoredSections.map((section) => [section.sectionId, section]))
  return context.previousPhaseSections
    .filter((section) => authoredById.has(section.sectionId) && authoredById.get(section.sectionId)?.markdown !== section.markdown && !PILOT_EXCLUDED_ROLES.has(section.role))
    .map((section, index) => ({
      ...section,
      sectionId: `${section.sectionId}.014j-pilot-${index + 1}`,
      visualCueIds: [`reader.cue.${section.sectionId}.014j-pilot-${index + 1}`],
      visualCue: { ...section.visualCue, cueId: `reader.cue.${section.sectionId}.014j-pilot-${index + 1}` },
      title: `Aporte curado del piloto · ${section.title}`,
      heading: `Aporte curado del piloto · ${section.title}`,
      curationMethod: 'pilot-override' as const,
    }))
}

const reorder = (sections: readonly AcademyReaderSection[]) => sections.map((section, index) => ({ ...section, order: index + 1, ordinal: index + 1, visualCue: { ...section.visualCue, order: index + 1 } }))

export function applyAcademy014JLessonCuration(context: AcademySourcePreservingLessonContext): AcademyReaderSection[] {
  const curation = academyStage4LessonCuration(context.lessonId)
  if (!curation) return [...context.currentSections]
  const dispositions = academy014JSourceSectionDispositions(context.lessonId, context.authoredSections)
  if (dispositions.length !== context.authoredSections.length || dispositions.some(({ action }) => action !== 'retained')) throw new Error(`Etapa 4 debe conservar toda la teoría de ${context.lessonId}.`)
  const additions = curation.sections.map((spec) => ({ spec, section: curatedSection(context.lessonId, spec, context.authoredSections) }))
  const before = additions.filter(({ spec }) => spec.placement === 'before-source').map(({ section }) => section)
  const adjacent = additions.filter(({ spec }) => spec.placement === 'after-first-substantive-source').map(({ section }) => section)
  const after = additions.filter(({ spec }) => spec.placement === 'after-source').map(({ section }) => section)
  const tail = additions.filter(({ spec }) => spec.placement === 'reference-tail').map(({ section }) => section)
  const substantive = context.authoredSections.filter(({ role, markdown }) => !['reference', 'sources', 'limitations'].includes(role) && markdown.trim())
  const references = context.authoredSections.filter((section) => !substantive.includes(section))
  const [first, ...rest] = substantive
  return reorder([...before, ...(first ? [first] : []), ...adjacent, ...pilotAdditions(context), ...rest, ...after, ...references, ...tail])
}

export function academy014JLegacyAliases(context: AcademySourcePreservingLessonContext, currentSections: readonly AcademyReaderSection[]): AcademyLegacySectionAlias[] {
  if (!academyStage4LessonCuration(context.lessonId)) return []
  const first = currentSections[0]?.sectionId
  if (!first) return []
  return context.previousPhaseSections.map((historical) => {
    const target = currentSections.find(({ sectionId }) => sectionId === historical.sectionId) ?? currentSections.find(({ role }) => role === historical.role) ?? currentSections[0]
    return { lessonId: context.lessonId, legacySegmentId: historical.sectionId, sectionId: target.sectionId, newSectionId: target.sectionId, method: 'explicit-alias', matchMethod: 'explicit-alias', confidence: target.sectionId === historical.sectionId ? 'high' : 'medium', fallbackSectionId: first, reason: target.sectionId === historical.sectionId ? 'El apartado conserva su ID.' : 'El apartado anterior resuelve a un equivalente visible de 0.14J.' }
  })
}
