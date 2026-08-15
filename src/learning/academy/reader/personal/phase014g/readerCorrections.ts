import type { AcademyLegacySectionAlias, AcademyReaderSection, AcademySectionVisualCuration, AcademyVisualCue } from '../../academyReaderModel'
import { academyReaderStableHash } from '../../academyReaderIdentity'
import { academyStage1LessonCuration } from './stage1Lessons'
import { academyStage1VisualForSection } from './stage1Visuals'

const countWords = (value: string) => value.replace(/[`#*_|>~-]/g, ' ').trim().split(/\s+/).filter(Boolean).length

function pendingCue(lessonId: string, sectionId: string, order: number, title: string): AcademyVisualCue {
  return {
    cueId: `reader.cue.${sectionId}`, lessonId, sectionId, order, purpose: 'follow', kind: 'none', sourceType: 'none',
    visualDecision: 'text-sufficient', selectorIds: [], isolation: [], isolationIds: [], transparencyById: {}, labels: [], labelDefinitions: [],
    pedagogicalQuestion: `¿Qué relación esencial explica «${title}»?`, caption: title,
    altText: `El apartado «${title}» conserva su explicación completa en texto.`, fidelity: 'not-applicable',
    limitations: ['No se añade una imagen decorativa.'], expectedObservation: 'El texto permite seguir la idea sin apoyo adicional.',
    readingModePolicy: 'omit', semanticSpecificity: 'section-specific', evidenceOfSpecificity: [], reviewStatus: 'unreviewed',
    implementationStatus: 'not-required', provenance: 'editorial-decision', sourceRole: 'none', curationStatus: 'unnecessary',
  }
}

export function applyAcademyStage1LessonCuration(lessonId: string, sourceSections: readonly AcademyReaderSection[]): AcademyReaderSection[] {
  const curation = academyStage1LessonCuration(lessonId)
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

export function academyStage1LegacyAliases(lessonId: string, historicalSections: readonly AcademyReaderSection[], currentSections: readonly AcademyReaderSection[]): AcademyLegacySectionAlias[] {
  if (!academyStage1LessonCuration(lessonId) || currentSections.length === 0) return []
  return historicalSections.map((historical, index) => {
    const target = currentSections.find(({ role }) => role === historical.role) ?? currentSections[Math.min(index, currentSections.length - 1)] ?? currentSections[0]
    return {
      lessonId, legacySegmentId: historical.sectionId, sectionId: target.sectionId, newSectionId: target.sectionId,
      method: 'explicit-alias', matchMethod: 'explicit-alias', confidence: 'high', fallbackSectionId: currentSections[0].sectionId,
    }
  })
}

export function academyStage1SectionVisualCuration(input: { lessonId: string; section: AcademyReaderSection; contentHash: string }): AcademySectionVisualCuration | undefined {
  const design = academyStage1VisualForSection(input.section.sectionId)
  const lesson = academyStage1LessonCuration(input.lessonId)
  if (!design || !lesson || !design.lessonIds.includes(input.lessonId)) return undefined
  return {
    curationId: `curation.0.14g.${design.visualDesignId}.${academyReaderStableHash(input.section.sectionId)}`,
    lessonId: input.lessonId, sectionId: input.section.sectionId, contentHash: input.contentHash, sectionHash: academyReaderStableHash(input.section.markdown),
    pedagogicalPurpose: design.semanticPayload.title, pedagogicalQuestion: design.pedagogicalQuestion,
    essentialConcepts: design.semanticPayload.nodes.map(({ label }) => label), visualDecision: 'content-specific-diagram', visualDesignId: design.visualDesignId,
    visualKind: 'diagram', diagramSchemaId: `diagram.${design.visualDesignId}.semantic`, diagramData: design.semanticPayload,
    selectorIds: [], isolationIds: [], transparencyById: {}, labelDefinitions: design.semanticPayload.nodes.map(({ id, label, detail }) => ({ id, label, description: detail })),
    expectedObservation: design.longDescription, readingModePolicy: 'inline-essential', fidelity: design.fidelity, limitations: [...design.limitations],
    sourceBasis: [...design.sourceIds], curationMethod: 'codex-assisted-personal-curation', ownerReviewStatus: 'owner-review-pending',
    technicalReviewStatus: 'not-required', technicalStatus: lesson.technicalStatus, notes: ['Diagrama semántico original para la etapa 1; revisión personal pendiente.'],
  }
}
