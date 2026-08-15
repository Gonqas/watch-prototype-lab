import type { AcademyLegacySectionAlias, AcademyReaderCurationPhase, AcademyReaderSection, AcademySectionVisualCuration } from '../academyReaderModel'
import { academyPersonalPilotReview, academyPersonalSectionVisualCuration, applyAcademyPersonalSectionPatches } from './phase014e'
import { academyStage0LegacyAliases, academyStage0LessonCuration, academyStage0SectionVisualCuration, applyAcademyStage0LessonCuration } from './phase014f'
import { academyStage1LegacyAliases, academyStage1LessonCuration, academyStage1SectionVisualCuration, applyAcademyStage1LessonCuration } from './phase014g'
import { academyStage2LegacyAliases, academyStage2LessonCuration, academyStage2SectionVisualCuration, applyAcademyStage2LessonCuration } from './phase014h'
import { academyPhaseIncludes } from './registry'

type PersonalMetadata = ReturnType<typeof academyPersonalPilotReview> | ReturnType<typeof academyStage0LessonCuration> | ReturnType<typeof academyStage1LessonCuration> | ReturnType<typeof academyStage2LessonCuration>
type VisualInput = { lessonId: string; section: AcademyReaderSection; contentHash: string; sectionHash: string; sourceIds: string[] }

interface AcademyCurationLayer {
  phase: AcademyReaderCurationPhase
  layerId: string
  applySections?: (lessonId: string, sections: readonly AcademyReaderSection[]) => AcademyReaderSection[]
  legacyAliases?: (lessonId: string, previous: readonly AcademyReaderSection[], current: readonly AcademyReaderSection[]) => AcademyLegacySectionAlias[]
  metadata?: (lessonId: string) => PersonalMetadata
  visual?: (input: VisualInput) => AcademySectionVisualCuration | undefined
}

export const ACADEMY_DECLARATIVE_CURATION_LAYERS: readonly AcademyCurationLayer[] = [
  { phase: '0.14D', layerId: 'editorial-base' },
  { phase: '0.14E', layerId: 'personal-pilots', applySections: applyAcademyPersonalSectionPatches, metadata: academyPersonalPilotReview, visual: academyPersonalSectionVisualCuration },
  { phase: '0.14F', layerId: 'stage-0', applySections: applyAcademyStage0LessonCuration, legacyAliases: academyStage0LegacyAliases, metadata: academyStage0LessonCuration, visual: academyStage0SectionVisualCuration },
  { phase: '0.14G', layerId: 'stage-1', applySections: applyAcademyStage1LessonCuration, legacyAliases: academyStage1LegacyAliases, metadata: academyStage1LessonCuration, visual: academyStage1SectionVisualCuration },
  { phase: '0.14H', layerId: 'stage-2', applySections: applyAcademyStage2LessonCuration, legacyAliases: academyStage2LegacyAliases, metadata: academyStage2LessonCuration, visual: academyStage2SectionVisualCuration },
] as const

export function academyCurationLayersForPhase(phase: AcademyReaderCurationPhase) {
  return ACADEMY_DECLARATIVE_CURATION_LAYERS.filter((layer) => academyPhaseIncludes(phase, layer.phase))
}

export function applyAcademyCurationLayers(phase: AcademyReaderCurationPhase, lessonId: string, sourceSections: readonly AcademyReaderSection[]) {
  let sections = [...sourceSections]
  const aliases: AcademyLegacySectionAlias[] = []
  let transformed = false
  for (const layer of academyCurationLayersForPhase(phase)) {
    if (!layer.applySections) continue
    transformed = true
    const previous = sections.map((section) => ({ ...section }))
    sections = layer.applySections(lessonId, sections)
    if (layer.legacyAliases) aliases.push(...layer.legacyAliases(lessonId, previous, sections))
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
