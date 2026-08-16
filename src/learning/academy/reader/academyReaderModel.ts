import type { LearningPack } from '../../content/learningPack'
import type { LearningActivityDescriptor } from '../../product/demoPackage'

export type AcademyReaderMode = 'learn' | 'read'
export type AcademyReaderCurationPhase = '0.14D' | '0.14E' | '0.14F' | '0.14G' | '0.14H'

export type AcademyPersonalTechnicalStatus = 'source-reviewed' | 'source-limited' | 'source-needed' | 'technical-conflict'
export type AcademyPersonalReviewStatus = 'not-reviewed' | 'clear' | 'needs-rework'
export type AcademyPersonalReviewFlag =
  | 'se-entiende'
  | 'no-se-entiende'
  | 'demasiado-tecnico'
  | 'falta-explicacion'
  | 'falta-ejemplo'
  | 'falta-visual'
  | 'visual-no-ayuda'
  | 'demasiado-repetitivo'
  | 'practica-confusa'
  | 'fuente-dudosa'
  | 'revisar-mas-adelante'

export type AcademyPilotResultStatus =
  | 'ready-for-personal-use'
  | 'ready-but-user-review-pending'
  | 'needs-source'
  | 'needs-visual'
  | 'needs-editorial-rework'
  | 'blocked'

export type AcademyPilotReviewDecision =
  | 'keep'
  | 'edit'
  | 'reorder'
  | 'merge-sections'
  | 'split-section'
  | 'replace-example'
  | 'correct-claim'
  | 'qualify-claim'
  | 'remove-repetition'
  | 'improve-visual'
  | 'block-by-source'

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

export type AcademySemanticSpecificity = 'generic-scaffold' | 'topic-specific' | 'lesson-specific' | 'section-specific'
export type AcademyVisualReviewStatus = 'unreviewed' | 'codex-assisted' | 'owner-reviewed' | 'technical-review-pending'
export type AcademyReadingModePolicy = 'omit' | 'inline-essential' | 'inline-static-summary' | 'textual-alternative-only'
export type AcademyVisualDecision =
  | 'content-specific-diagram'
  | 'content-specific-3d'
  | 'content-specific-comparison'
  | 'content-specific-sequence'
  | 'essential-inline-image'
  | 'text-sufficient'
  | 'visual-gap'
  | 'source-review-required'

export type AcademyEditorialReviewStatus =
  | 'automated-structural-migration'
  | 'codex-assisted-curation'
  | 'owner-review-pending'
  | 'owner-reviewed'
  | 'technical-expert-review-pending'
  | 'technical-expert-reviewed'
  | 'stale-after-content-change'

export interface AcademyDiagramNode {
  id: string
  label: string
  detail?: string
  lane?: string
  emphasis?: 'normal' | 'primary' | 'warning'
}

export interface AcademyDiagramEdge {
  from: string
  to: string
  label?: string
  direction?: 'forward' | 'reverse' | 'bidirectional'
  kind?: 'energy' | 'timing' | 'mechanical' | 'decision' | 'comparison'
}

export interface AcademyDiagramData {
  title: string
  nodes: AcademyDiagramNode[]
  edges: AcademyDiagramEdge[]
  phases?: Array<{ id: string; label: string; detail?: string }>
  annotations?: string[]
  formula?: string
  acceptanceCriteria?: string[]
}

export interface AcademyVisualLabelDefinition {
  id: string
  label: string
  targetId?: string
  description?: string
}

export interface AcademySectionVisualCuration {
  curationId: string
  lessonId: string
  sectionId: string
  contentHash: string
  sectionHash: string
  pedagogicalPurpose: string
  pedagogicalQuestion: string
  essentialConcepts: string[]
  visualDecision: AcademyVisualDecision
  visualDesignId?: string
  visualKind: AcademyVisualCueKind
  diagramSchemaId?: string
  diagramData?: AcademyDiagramData
  fixtureBinding?: NonNullable<LearningActivityDescriptor['fixtureBinding']>
  activityId?: string
  visualStateId?: string
  cameraPreset?: string
  selectorIds: string[]
  isolationIds: string[]
  transparencyById: Record<string, number>
  explodedState?: string
  animationState?: string
  labelDefinitions: AcademyVisualLabelDefinition[]
  expectedObservation: string
  misconceptionAddressed?: string
  readingModePolicy: AcademyReadingModePolicy
  fidelity: 'conceptual' | 'calibre-specific' | 'not-applicable'
  limitations: string[]
  sourceBasis: string[]
  curationMethod: 'codex-assisted-section-curation' | 'codex-assisted-personal-curation' | 'automated-structural-decision'
  ownerReviewStatus: 'owner-review-pending' | 'owner-reviewed' | 'stale-after-content-change'
  technicalReviewStatus: 'not-required' | 'technical-expert-review-pending' | 'technical-expert-reviewed'
  technicalStatus?: AcademyPersonalTechnicalStatus
  gapReason?: string
  notes: string[]
}

export interface Academy3dVisualState {
  visualStateId: string
  fixtureId: string
  camera: {
    presetId: string
    position: [number, number, number]
    target: [number, number, number]
    fieldOfView: number
  }
  selectedIds: string[]
  isolatedIds: string[]
  transparency: Record<string, number>
  explosion: Record<string, number>
  animation: 'paused' | 'play-on-explicit-request' | 'static-phase'
  labels: AcademyVisualLabelDefinition[]
  expectedObservation: string
  fidelity: 'conceptual' | 'calibre-specific'
  limitations: string[]
}

export interface AcademyVisualCue {
  cueId: string
  lessonId: string
  sectionId: string
  order: number
  purpose: AcademyVisualCuePurpose
  kind: AcademyVisualCueKind
  sourceType: AcademyVisualCueSourceType
  diagramKind?: 'system-map' | 'causal-chain' | 'annotated-anatomy' | 'comparison' | 'inspection-path'
  visualDecision?: AcademyVisualDecision
  visualDesignId?: string
  diagramSchemaId?: string
  diagramData?: AcademyDiagramData
  diagramPayloadHash?: string
  compositionId?: string
  visualStateId?: string
  semanticSpecificity?: AcademySemanticSpecificity
  evidenceOfSpecificity?: string[]
  reviewStatus?: AcademyVisualReviewStatus
  activityId?: string
  fixtureBinding?: NonNullable<LearningActivityDescriptor['fixtureBinding']>
  modelReference?: string
  selectorIds: string[]
  cameraPreset?: string
  isolation: string[]
  isolationIds?: string[]
  transparencyById?: Record<string, number>
  transparency?: number
  explodedState?: string
  animationState?: string
  labels: string[]
  labelDefinitions?: AcademyVisualLabelDefinition[]
  pedagogicalQuestion: string
  caption: string
  altText: string
  fidelity: 'conceptual' | 'calibre-specific' | 'not-applicable'
  limitations: string[]
  expectedObservation?: string
  misconceptionAddressed?: string
  readingModePolicy?: AcademyReadingModePolicy
  implementationStatus: 'implemented' | 'not-required' | 'gap-recorded' | 'unavailable'
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
  /** Conceptos y claims heredados del bloque fuente. La curación puede añadir, pero no borrar, estos enlaces. */
  conceptIds?: string[]
  claimIds?: string[]
  sourceLocators?: string[]
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
  reason?: string
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
  readerSchemaVersion: '0.14C' | '0.14D' | '0.14E' | '0.14F' | '0.14G' | '0.14H'
  documentId: string
  documentVersion: string
  version: string
  packageId: string
  packageVersion: string
  lessonId: string
  lessonVersion: string
  locale: string
  contentHash: string
  identity?: AcademyReaderDocumentIdentity
  title: string
  purpose?: string
  whyNow?: string
  outcome?: string
  estimatedDurationMinutes?: number
  stageId?: string
  chapterId?: string
  stepId?: string
  sections: AcademyReaderSection[]
  sectionCurations?: AcademySectionVisualCuration[]
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
    method: 'automated-structural-migration' | 'codex-assisted-editorial-curation' | 'codex-assisted-personal-curation'
    confidence: 'high' | 'medium'
    ownerReviewPending: boolean
    editorialStatus?: AcademyEditorialReviewStatus
    ownerReviewStatus?: 'owner-review-pending' | 'owner-reviewed' | 'stale-after-content-change'
    technicalReviewStatus?: 'not-required' | 'technical-expert-review-pending' | 'technical-expert-reviewed'
    technicalStatus?: AcademyPersonalTechnicalStatus
  }
}

export interface AcademyReaderDocumentIdentity {
  schemaVersion: 1
  contentHash: string
  structureHash: string
  compatibilityVersion: string
  diagnosticSignature: string
  legacyDocumentVersion: string
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
    | 'missing-3d-activity'
    | 'missing-3d-state'
    | 'generic-diagram-misclassified'
  lessonId: string
  sectionId?: string
  message: string
}

export type AcademyReaderEventType =
  | 'session-start'
  | 'session-end'
  | 'lesson-open'
  | 'lesson-resume'
  | 'section-enter'
  | 'outline-open'
  | 'outline-jump'
  | 'cue-view'
  | 'visual-expand'
  | 'source-open'
  | 'glossary-open'
  | 'mode-change'
  | 'note-created'
  | 'bookmark-created'
  | 'explicit-completion'
  | 'practice-transition'
  | 'route-leave-incomplete'
  | 'pagehide-incomplete'
  | 'return-after-incomplete'

export interface AcademyReaderEvent {
  eventId: string
  sessionId: string
  eventType: AcademyReaderEventType
  timestamp: string
  lessonId?: string
  sectionId?: string
  cueId?: string
  mode?: AcademyReaderMode
  viewportClass?: 'desktop' | 'tablet' | 'mobile' | 'reflow'
  fromSectionId?: string
  toSectionId?: string
  transitionTarget?: string
  durationBucket?: 'under-30s' | '30s-2m' | '2m-10m' | 'over-10m'
  completed?: boolean
  source: 'academy-reader' | 'editorial-review' | 'usability-harness'
  metadata: Record<string, string | number | boolean>
}

export type AcademyUsabilityParticipantType = 'owner' | 'beginner' | 'enthusiast' | 'watchmaker'

export interface AcademyUsabilityTaskResult {
  taskId: string
  success: 'pending' | 'yes' | 'partial' | 'no'
  difficulty: 1 | 2 | 3 | 4 | 5
  confidence: 1 | 2 | 3 | 4 | 5
  comment: string
  approximateSeconds: number
  backtrackCount: number
}

export interface AcademyUsabilitySession {
  sessionId: string
  startedAt: string
  finishedAt?: string
  participantType: AcademyUsabilityParticipantType
  taskIds: string[]
  eventIds: string[]
  observations: string
  status: 'draft' | 'active' | 'completed' | 'abandoned'
  taskResults: AcademyUsabilityTaskResult[]
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
