import type { LearningPack } from '../../content/learningPack'
import type { LearningActivityDescriptor } from '../../product/demoPackage'

export type AcademyReaderMode = 'learn' | 'read'

export type AcademyReaderSectionRole =
  | 'orientation'
  | 'preparation'
  | 'vocabulary'
  | 'explanation'
  | 'visual-anatomy'
  | 'observation'
  | 'worked-example'
  | 'comparison'
  | 'procedure'
  | 'diagnosis'
  | 'checkpoint'
  | 'common-errors'
  | 'safety'
  | 'summary'
  | 'next-connection'
  | 'reference'
  | 'sources'
  | 'limitations'

export type AcademyVisualCuePurpose = 'locate' | 'follow' | 'compare' | 'sequence' | 'measure' | 'diagnose' | 'predict' | 'summarize'
export type AcademyVisualCueKind = 'scene-3d' | 'diagram' | 'comparison' | 'sequence' | 'table' | 'image' | 'none'
export type AcademyVisualCueSourceType = 'existing-fixture' | 'existing-runtime-asset' | 'original-diagram' | 'licensed-asset' | 'none'

export interface AcademyVisualCue {
  cueId: string
  lessonId: string
  sectionId: string
  order: number
  purpose: AcademyVisualCuePurpose
  kind: AcademyVisualCueKind
  sourceType: AcademyVisualCueSourceType
  diagramKind?: 'system-map' | 'causal-chain' | 'annotated-anatomy' | 'comparison' | 'inspection-path'
  activityId?: string
  fixtureBinding?: NonNullable<LearningActivityDescriptor['fixtureBinding']>
  modelReference?: string
  selectorIds: string[]
  cameraPreset?: string
  isolation: string[]
  transparency?: number
  explodedState?: string
  animationState?: string
  labels: string[]
  pedagogicalQuestion: string
  caption: string
  altText: string
  fidelity: 'conceptual' | 'calibre-specific' | 'not-applicable'
  limitations: string[]
  implementationStatus: 'implemented' | 'not-required' | 'gap-recorded'
  provenance: 'existing-fixture' | 'original-data-driven-svg' | 'editorial-decision'
  sourceRole: 'supporting' | 'visual-inspiration' | 'none'
  curationStatus: 'implemented' | 'available-pending' | 'unnecessary' | 'gap'
}

export interface AcademyReaderSection {
  sectionId: string
  lessonId: string
  blockId: string
  sourceBlockId: string
  sourceBlockIds: string[]
  sourceBlockVersion: string
  order: number
  ordinal: number
  heading: string
  headingLevel: number
  title: string
  role: AcademyReaderSectionRole
  markdown: string
  wordCount: number
  estimatedMinutes?: number
  visualCueIds: string[]
  glossaryTermIds: string[]
  requiredForStudy: boolean
  collapsible: boolean
  defaultExpanded: boolean
  curationMethod: 'authored-structure' | 'pilot-override'
  curationConfidence: 'high' | 'medium'
  visualCue: AcademyVisualCue
}

export interface AcademyReaderOutlineItem {
  sectionId: string
  title: string
  level: number
  role: AcademyReaderSectionRole
}

export type AcademyLegacyAliasMethod =
  | 'explicit-alias'
  | 'same-block-and-heading'
  | 'same-block'
  | 'nearest-order'
  | 'fallback-start'

export interface AcademyLegacySectionAlias {
  lessonId: string
  legacySegmentId: string
  sectionId: string
  newSectionId: string
  method: AcademyLegacyAliasMethod
  matchMethod: AcademyLegacyAliasMethod
  confidence: 'high' | 'medium' | 'low'
  fallbackSectionId: string
}

export interface AcademyReaderCompletionContract {
  explicitActionRequired: true
  scrollNeverCompletes: true
  elapsedTimeNeverCompletes: true
  visitedSectionsNeverComplete: true
  completionActivityId?: string
  requiredActivityIds: string[]
  optionalActivityIds: string[]
}

export interface AcademyReaderDocument {
  readerSchemaVersion: '0.14C'
  documentId: string
  documentVersion: string
  version: string
  packageId: string
  packageVersion: string
  lessonId: string
  lessonVersion: string
  locale: string
  contentHash: string
  title: string
  purpose?: string
  whyNow?: string
  outcome?: string
  estimatedDurationMinutes?: number
  stageId?: string
  chapterId?: string
  stepId?: string
  sections: AcademyReaderSection[]
  referenceSections: AcademyReaderSection[]
  visualCues: AcademyVisualCue[]
  outline: AcademyReaderOutlineItem[]
  glossaryTermIds: string[]
  sourceIds: string[]
  legacyAliases: AcademyLegacySectionAlias[]
  compatibility: {
    legacyAliases: AcademyLegacySectionAlias[]
    legacyModePolicy: 'map-to-learn-or-read'
  }
  completion: AcademyReaderCompletionContract
  completionPolicy: AcademyReaderCompletionContract
  pilot: boolean
  centralQuestion?: string
  curation: {
    method: 'automated-structural-migration' | 'codex-assisted-editorial-curation'
    confidence: 'high' | 'medium'
    ownerReviewPending: boolean
  }
}

export interface AcademyReaderResumePoint {
  activeSectionId: string
  scrollAnchor: string
  scrollOffset: number
  documentVersion: string
}

export interface AcademyReaderProgress extends AcademyReaderResumePoint {
  lessonId: string
  visitedSectionIds: string[]
  legacySegmentIds: string[]
  completedAt?: string
  updatedAt: string
}

export interface AcademyReaderValidationIssue {
  code:
    | 'empty-document'
    | 'empty-section'
    | 'duplicate-section-id'
    | 'missing-alias-target'
    | 'missing-visual-decision'
    | 'unsafe-markdown-url'
    | 'completion-contract-invalid'
  lessonId: string
  sectionId?: string
  message: string
}

export interface AcademyReaderBuildInput {
  material: {
    packageId: string
    packageVersion: string
    pack: LearningPack
    lesson: LearningPack['lessons'][number]
    blocks: LearningPack['blocks']
    activities: LearningActivityDescriptor[]
    sources: LearningPack['sources']
    glossary: LearningPack['glossary']
  }
  title: string
  purpose?: string
  whyNow?: string
  outcome?: string
  stageId?: string
  chapterId?: string
  stepId?: string
  requiredActivityIds?: readonly string[]
  locale?: string
}

export interface AcademyReaderLocalMetricDefinition {
  metricId: string
  description: string
  trigger: 'reader-open' | 'mode-change' | 'outline-open' | 'outline-jump' | 'resume' | 'return' | 'alias-fallback' | 'section-enter' | 'cue-change' | 'source-open' | 'glossary-open' | 'active-minute' | 'click' | 'exit-incomplete' | 'explicit-completion' | 'practice-transition'
  remote: false
}

export const ACADEMY_READER_METRICS: readonly AcademyReaderLocalMetricDefinition[] = [
  { metricId: 'reader.open', description: 'Aperturas del lector continuo.', trigger: 'reader-open', remote: false },
  { metricId: 'reader.mode.learn', description: 'Cambios explícitos al modo Aprender.', trigger: 'mode-change', remote: false },
  { metricId: 'reader.mode.read', description: 'Cambios explícitos al modo Leer.', trigger: 'mode-change', remote: false },
  { metricId: 'reader.outline.open', description: 'Aperturas del índice semántico.', trigger: 'outline-open', remote: false },
  { metricId: 'reader.outline.jump', description: 'Saltos explícitos desde el índice semántico.', trigger: 'outline-jump', remote: false },
  { metricId: 'reader.resume', description: 'Reanudaciones desde una posición guardada.', trigger: 'resume', remote: false },
  { metricId: 'reader.return', description: 'Retornos posteriores a una lección con posición guardada.', trigger: 'return', remote: false },
  { metricId: 'reader.alias.fallback', description: 'Deep links legados sin alias exacto que abren el inicio seguro.', trigger: 'alias-fallback', remote: false },
  { metricId: 'reader.section.enter', description: 'Entradas en una sección semántica.', trigger: 'section-enter', remote: false },
  { metricId: 'reader.cue.change', description: 'Cambios de apoyo visual sincronizado.', trigger: 'cue-change', remote: false },
  { metricId: 'reader.source.open', description: 'Aperturas de una referencia o fuente.', trigger: 'source-open', remote: false },
  { metricId: 'reader.glossary.open', description: 'Aperturas del glosario desde el lector.', trigger: 'glossary-open', remote: false },
  { metricId: 'reader.active-minute', description: 'Minutos activos aproximados en primer plano.', trigger: 'active-minute', remote: false },
  { metricId: 'reader.click', description: 'Interacciones de enlace o botón dentro del lector.', trigger: 'click', remote: false },
  { metricId: 'reader.exit-incomplete', description: 'Salidas del lector sin finalización explícita.', trigger: 'exit-incomplete', remote: false },
  { metricId: 'reader.explicit-completion', description: 'Finalizaciones mediante la acción final explícita.', trigger: 'explicit-completion', remote: false },
  { metricId: 'reader.practice.transition', description: 'Transiciones desde la lección a su práctica curada.', trigger: 'practice-transition', remote: false },
] as const
