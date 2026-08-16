import type { AcademyLegacySectionAlias, AcademyReaderCurationPhase, AcademyReaderSection, AcademySectionVisualCuration } from '../academyReaderModel'
import { academyPersonalPilotReview, academyPersonalSectionVisualCuration, applyAcademyPersonalSectionPatches } from './phase014e'
import { academyStage0LegacyAliases, academyStage0LessonCuration, academyStage0SectionVisualCuration, applyAcademyStage0LessonCuration } from './phase014f'
import { academyStage1LegacyAliases, academyStage1LessonCuration, academyStage1SectionVisualCuration, applyAcademyStage1LessonCuration } from './phase014g'
import { academyStage2LegacyAliases, academyStage2LessonCuration, academyStage2SectionVisualCuration, applyAcademyStage2LessonCuration } from './phase014h'
import { academy014ILegacyAliases, academyStage3LessonCuration, academyStage3SectionVisualCuration, applyAcademy014ILessonCuration } from './phase014i'
import { academyPhaseIncludes } from './registry'
import type { AcademySourcePreservingLessonContext } from './types'

type PersonalMetadata = ReturnType<typeof academyPersonalPilotReview> | ReturnType<typeof academyStage0LessonCuration> | ReturnType<typeof academyStage1LessonCuration> | ReturnType<typeof academyStage2LessonCuration> | ReturnType<typeof academyStage3LessonCuration>
type VisualInput = { lessonId: string; section: AcademyReaderSection; contentHash: string; sectionHash: string; sourceIds: string[] }

interface AcademyCurationLayer {
  phase: AcademyReaderCurationPhase
  layerId: string
  applySections?: (context: AcademySourcePreservingLessonContext) => AcademyReaderSection[]
  legacyAliases?: (lessonId: string, previous: readonly AcademyReaderSection[], current: readonly AcademyReaderSection[]) => AcademyLegacySectionAlias[]
  sourcePreservingAliases?: (context: AcademySourcePreservingLessonContext, current: readonly AcademyReaderSection[]) => AcademyLegacySectionAlias[]
  metadata?: (lessonId: string) => PersonalMetadata
  visual?: (input: VisualInput) => AcademySectionVisualCuration | undefined
}

export const ACADEMY_DECLARATIVE_CURATION_LAYERS: readonly AcademyCurationLayer[] = [
  { phase: '0.14D', layerId: 'editorial-base' },
  { phase: '0.14E', layerId: 'personal-pilots', applySections: ({ lessonId, currentSections }) => applyAcademyPersonalSectionPatches(lessonId, currentSections), metadata: academyPersonalPilotReview, visual: academyPersonalSectionVisualCuration },
  { phase: '0.14F', layerId: 'stage-0', applySections: ({ lessonId, currentSections }) => applyAcademyStage0LessonCuration(lessonId, currentSections), legacyAliases: academyStage0LegacyAliases, metadata: academyStage0LessonCuration, visual: academyStage0SectionVisualCuration },
  { phase: '0.14G', layerId: 'stage-1', applySections: ({ lessonId, currentSections }) => applyAcademyStage1LessonCuration(lessonId, currentSections), legacyAliases: academyStage1LegacyAliases, metadata: academyStage1LessonCuration, visual: academyStage1SectionVisualCuration },
  { phase: '0.14H', layerId: 'stage-2', applySections: ({ lessonId, currentSections, authoredSections }) => applyAcademyStage2LessonCuration(lessonId, currentSections, authoredSections), legacyAliases: academyStage2LegacyAliases, metadata: academyStage2LessonCuration, visual: academyStage2SectionVisualCuration },
  { phase: '0.14I', layerId: 'stage-0-1-remediation-and-stage-3', applySections: applyAcademy014ILessonCuration, sourcePreservingAliases: academy014ILegacyAliases, metadata: academyStage3LessonCuration, visual: academyStage3SectionVisualCuration },
] as const

export function academyCurationLayersForPhase(phase: AcademyReaderCurationPhase) {
  return ACADEMY_DECLARATIVE_CURATION_LAYERS.filter((layer) => academyPhaseIncludes(phase, layer.phase))
}

export function applyAcademyCurationLayers(phase: AcademyReaderCurationPhase, lessonId: string, sourceSections: readonly AcademyReaderSection[]) {
  const authoredSourceSections = sourceSections.map((section) => ({ ...section }))
  let sections = [...sourceSections]
  const aliases: AcademyLegacySectionAlias[] = []
  let transformed = false
  for (const layer of academyCurationLayersForPhase(phase)) {
    if (!layer.applySections) continue
    transformed = true
    const previous = sections.map((section) => ({ ...section }))
    const context: AcademySourcePreservingLessonContext = {
      lessonId, phase: layer.phase, authoredSections: authoredSourceSections, previousPhaseSections: previous,
      currentSections: previous, historicalAliases: [...aliases],
      sourceBlockIds: [...new Set(authoredSourceSections.flatMap(({ sourceBlockIds, sourceBlockId }) => sourceBlockIds.length ? sourceBlockIds : [sourceBlockId]))],
    }
    sections = layer.applySections(context)
    if (layer.legacyAliases) aliases.push(...layer.legacyAliases(lessonId, previous, sections))
    if (layer.sourcePreservingAliases) aliases.push(...layer.sourcePreservingAliases(context, sections))
  }
  return { sections, aliases, transformed }
}

export function academyCurationMetadataForLesson(phase: AcademyReaderCurationPhase, lessonId: string): PersonalMetadata {
  const matches = academyCurationLayersForPhase(phase).flatMap((layer) => layer.metadata?.(lessonId) ?? [])
  return matches.at(-1)
}

export function academyCurationVisualForSection(phase: AcademyReaderCurationPhase, input: VisualInput) {
  const matches = academyCurationLayersForPhase(phase).flatMap((layer) => layer.visual?.(input) ?? [])
  return matches.at(-1)
}
