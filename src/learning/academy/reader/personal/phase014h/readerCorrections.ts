import type { AcademyLegacySectionAlias, AcademyReaderSection, AcademyVisualCue } from '../../academyReaderModel'
import type { AcademySourceSectionDisposition, AcademyStage2ReplacementContract, AcademyStage2SectionSpec } from '../types'
import { academyStage2LessonCuration } from './stage2Lessons'
import { academyStage2PrimaryVisualSectionId, academyStage2SectionId } from './stage2Sections'

const countWords = (value: string) => value.replace(/\{\{term:([^}]+)\}\}/g, '$1').replace(/[`#*_|>~-]/g, ' ').trim().split(/\s+/).filter(Boolean).length
const glossaryTerms = (value: string) => [...new Set([...value.matchAll(/\{\{term:([^}]+)\}\}/g)].map((match) => match[1]))]

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

function curatedSection(
  lessonId: string,
  item: AcademyStage2SectionSpec,
  sourceSections: readonly AcademyReaderSection[],
): AcademyReaderSection {
  const source = sourceSections[0]
  if (!source) throw new Error(`La lección ${lessonId} no contiene teoría fuente.`)
  const sourceBlockIds = [...new Set(sourceSections.flatMap(({ sourceBlockIds, sourceBlockId }) => sourceBlockIds.length ? sourceBlockIds : [sourceBlockId]))]
  const conceptIds = [...new Set(sourceSections.flatMap(({ conceptIds = [] }) => conceptIds))]
  const curation = academyStage2LessonCuration(lessonId)!
  return {
    sectionId: item.sectionId,
    lessonId,
    blockId: curation.sourceBlockId,
    sourceBlockId: curation.sourceBlockId,
    sourceBlockIds,
    sourceBlockVersion: source.sourceBlockVersion,
    order: 0,
    ordinal: 0,
    heading: item.title,
    headingLevel: 2,
    title: item.title,
    role: item.role,
    markdown: item.markdown,
    wordCount: countWords(item.markdown),
    visualCueIds: [`reader.cue.${item.sectionId}`],
    glossaryTermIds: glossaryTerms(item.markdown),
    conceptIds,
    claimIds: [...curation.sourceClaimIds],
    sourceLocators: [...new Set(sourceSections.flatMap(({ sourceLocators = [] }) => sourceLocators))],
    requiredForStudy: item.requiredForStudy ?? !['reference', 'sources', 'limitations'].includes(item.role),
    collapsible: item.collapsible ?? ['reference', 'sources', 'limitations'].includes(item.role),
    defaultExpanded: !(item.collapsible ?? ['reference', 'sources', 'limitations'].includes(item.role)),
    curationMethod: 'pilot-override',
    curationConfidence: 'high',
    visualCue: pendingCue(lessonId, item.sectionId, 0, item.title),
  }
}

function reorder(sections: readonly AcademyReaderSection[]): AcademyReaderSection[] {
  return sections.map((section, index) => ({
    ...section,
    order: index + 1,
    ordinal: index + 1,
    visualCue: { ...section.visualCue, order: index + 1 },
  }))
}

export function academyStage2SourceSectionDispositions(
  lessonId: string,
  sourceSections: readonly AcademyReaderSection[],
): AcademySourceSectionDisposition[] {
  if (!academyStage2LessonCuration(lessonId)) return []
  return sourceSections.map((section) => ({
    lessonId,
    sourceSectionId: section.sectionId,
    sourceBlockId: section.sourceBlockId,
    sourceRole: section.role,
    sourceHeading: section.title,
    sourceWordCount: section.wordCount,
    action: 'retained',
    targetSectionIds: [section.sectionId],
    reason: 'La sección fuente permanece íntegra y visible en el flujo normal; la curación añade apoyo alrededor de ella.',
    conceptIds: [...(section.conceptIds ?? [])],
    claimIds: [...(section.claimIds ?? [])],
    glossaryTermIds: [...section.glossaryTermIds],
  }))
}

export const ACADEMY_STAGE_2_REPLACEMENT_CONTRACTS: readonly AcademyStage2ReplacementContract[] = []

export function composeAcademyStage2Lesson(
  sourceSections: readonly AcademyReaderSection[],
  curation: NonNullable<ReturnType<typeof academyStage2LessonCuration>>,
  dispositionMap: readonly AcademySourceSectionDisposition[],
): AcademyReaderSection[] {
  if (curation.compositionMode === 'replace' && ACADEMY_STAGE_2_REPLACEMENT_CONTRACTS.every(({ lessonId }) => lessonId !== curation.lessonId)) {
    throw new Error(`La sustitución de ${curation.lessonId} no tiene contrato trazable.`)
  }
  const decided = new Set(dispositionMap.map(({ sourceSectionId }) => sourceSectionId))
  const undecided = sourceSections.filter(({ sectionId }) => !decided.has(sectionId))
  if (undecided.length) throw new Error(`Secciones fuente sin disposición en ${curation.lessonId}: ${undecided.map(({ sectionId }) => sectionId).join(', ')}`)
  const nonRetained = dispositionMap.filter(({ action }) => action !== 'retained')
  if (nonRetained.length) throw new Error(`El modo augment de ${curation.lessonId} solo admite secciones fuente retenidas.`)

  const additions = curation.sections.map((item) => ({ item, section: curatedSection(curation.lessonId, item, sourceSections) }))
  const before = additions.filter(({ item }) => item.placement === 'before-source').map(({ section }) => section)
  const adjacent = additions.filter(({ item }) => item.placement === 'after-first-substantive-source').map(({ section }) => section)
  const after = additions.filter(({ item }) => item.placement === 'after-source').map(({ section }) => section)
  const tail = additions.filter(({ item }) => item.placement === 'reference-tail').map(({ section }) => section)
  const substantiveSource = sourceSections.filter(({ role, markdown }) => !['reference', 'sources', 'limitations'].includes(role) && markdown.trim())
  const referenceSource = sourceSections.filter((section) => !substantiveSource.includes(section))
  const [first, ...rest] = substantiveSource
  return reorder([
    ...before,
    ...(first ? [first] : []),
    ...adjacent,
    ...rest,
    ...after,
    ...referenceSource,
    ...tail,
  ])
}

export function applyAcademyStage2LessonCuration(
  lessonId: string,
  previousSections: readonly AcademyReaderSection[],
  authoredSourceSections: readonly AcademyReaderSection[] = previousSections,
): AcademyReaderSection[] {
  const curation = academyStage2LessonCuration(lessonId)
  if (!curation) return [...previousSections]
  if (authoredSourceSections.length === 0) throw new Error(`La lección ${lessonId} no contiene su bloque fuente.`)
  const dispositions = academyStage2SourceSectionDispositions(lessonId, authoredSourceSections)
  return composeAcademyStage2Lesson(authoredSourceSections, curation, dispositions)
}

const oldHSectionId = (lessonId: string, suffix: string) => `reader.section.${lessonId.replace('lesson.', 'block.')}.014h-${suffix}`

function oldHTargets(lessonId: string) {
  return [
    [oldHSectionId(lessonId, 'orientacion'), academyStage2SectionId.orientation(lessonId), 'La orientación breve se conserva en la nueva orientación específica.'],
    [oldHSectionId(lessonId, 'vocabulario'), academyStage2SectionId.vocabulary(lessonId), 'El vocabulario conserva su finalidad y ahora precede a la teoría.'],
    [oldHSectionId(lessonId, 'modelo-causal'), academyStage2PrimaryVisualSectionId(lessonId), 'La explicación causal se integra en el apartado sustantivo que porta el visual.'],
    [oldHSectionId(lessonId, 'visual'), academyStage2PrimaryVisualSectionId(lessonId), 'La instrucción visual genérica se sustituye por una lectura específica del mismo concepto.'],
    [oldHSectionId(lessonId, 'ejemplo'), academyStage2SectionId.example(lessonId), 'El ejemplo permanece como caso razonado de la misma lección.'],
    [oldHSectionId(lessonId, 'errores'), academyStage2SectionId.errors(lessonId), 'Los errores se conservan en el apartado de límites de interpretación.'],
    [oldHSectionId(lessonId, 'comprobacion'), academyStage2SectionId.checkpoint(lessonId), 'La comprobación genérica se reemplaza por una pregunta específica.'],
    [oldHSectionId(lessonId, 'conexion'), academyStage2SectionId.connection(lessonId), 'La conexión conserva el mismo puente curricular.'],
    [oldHSectionId(lessonId, 'fuentes-limites'), academyStage2SectionId.sources(lessonId), 'Fuentes y límites permanecen en la capa secundaria.'],
  ] as const
}

export function academyStage2LegacyAliases(
  lessonId: string,
  historicalSections: readonly AcademyReaderSection[],
  currentSections: readonly AcademyReaderSection[],
): AcademyLegacySectionAlias[] {
  if (!academyStage2LessonCuration(lessonId) || currentSections.length === 0) return []
  const first = currentSections[0].sectionId
  const exact = historicalSections.flatMap((historical) => {
    const target = currentSections.find(({ sectionId }) => sectionId === historical.sectionId)
    return target ? [{
      lessonId, legacySegmentId: historical.sectionId, sectionId: target.sectionId, newSectionId: target.sectionId,
      method: 'explicit-alias' as const, matchMethod: 'explicit-alias' as const, confidence: 'high' as const,
      fallbackSectionId: first, reason: 'Mismo apartado fuente, conservado con su ID estable y su teoría authored.',
    }] : []
  })
  const previousH = oldHTargets(lessonId).map(([legacySegmentId, targetId, reason]) => {
    const suffix = legacySegmentId.split('.014h-')[1] ?? ''
    const semanticFallback = suffix === 'vocabulario'
      ? currentSections.find(({ role }) => role === 'vocabulary' || role === 'explanation')
      : suffix === 'errores'
        ? currentSections.find(({ role }) => role === 'common-errors' || role === 'limitations' || role === 'sources')
        : suffix === 'conexion'
          ? currentSections.find(({ role }) => role === 'next-connection' || role === 'checkpoint')
          : undefined
    const resolvedTargetId = currentSections.find(({ sectionId }) => sectionId === targetId)?.sectionId ?? semanticFallback?.sectionId ?? first
    return {
    lessonId, legacySegmentId, sectionId: resolvedTargetId, newSectionId: resolvedTargetId,
    method: 'explicit-alias' as const, matchMethod: 'explicit-alias' as const, confidence: 'high' as const,
    fallbackSectionId: first, reason,
  } })
  return [...exact, ...previousH]
}
