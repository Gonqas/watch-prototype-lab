import type {
  AcademyLegacySectionAlias,
  AcademyReaderCurationPhase,
  AcademyReaderSection,
  AcademyDiagramData,
  AcademyPersonalReviewStatus,
  AcademyPersonalTechnicalStatus,
  AcademyReaderSectionRole,
} from '../academyReaderModel'

export type AcademyPersonalCurationPhase = '0.14E' | '0.14F' | '0.14G' | '0.14H' | '0.14I' | '0.14J' | '0.14K'
export type AcademyEvidenceModality = 'K' | 'V' | 'P' | 'R'
export type AcademyCurriculumPathRole = 'anchor' | 'support' | 'optional-branch' | 'reference'

export interface AcademyEvidenceProfile {
  modalities: readonly AcademyEvidenceModality[]
  primaryModality: AcademyEvidenceModality
  knowledgeExplanationRequired: boolean
  virtualDemonstrationRequired: boolean
  physicalExecutionRequired: boolean
  measuredOrReviewedResultRequired: boolean
  physicalCompetenceClaim: boolean
  reviewerRequired: boolean
  measurableAcceptanceCriteria: readonly string[]
  evidenceArtifacts: readonly string[]
}

export interface AcademyStage0SectionSpec {
  sectionId: string
  title: string
  role: AcademyReaderSectionRole
  markdown: string
  requiredForStudy?: boolean
  collapsible?: boolean
  legacySectionAliases: readonly string[]
}

export interface AcademyStage0ActivityPresentation {
  activityId: string
  lessonId: string
  visibleTitle: string
  purpose: string
  instructions: readonly string[]
  availableHelp: readonly string[]
  successCriteria: readonly string[]
  feedback: string
  limitations: readonly string[]
  evidenceProfile: AcademyEvidenceProfile
}

export interface AcademyStage0LessonCuration {
  lessonId: string
  sourceBlockId: string
  centralQuestion: string
  whyNow: string
  observableOutcome: string
  recommendedPrerequisiteLessonIds: readonly string[]
  effectivePrerequisiteConceptIds: readonly string[]
  sections: readonly AcademyStage0SectionSpec[]
  visualDesignIds: readonly string[]
  activityPresentations: readonly AcademyStage0ActivityPresentation[]
  sourceClaimIds: readonly string[]
  limitations: readonly string[]
  personalReviewStatus: AcademyPersonalReviewStatus
  technicalStatus: AcademyPersonalTechnicalStatus
}

export interface AcademySourceLocator {
  sourceId: string
  documentLocator: string
  page?: string
  figure?: string
  table?: string
  section?: string
  verificationMethod: 'visual-pdf-inspection' | 'official-document' | 'curated-inventory' | 'source-limited'
  verifiedAt?: string
}

export interface AcademyStage0ClaimReview {
  claimId: string
  lessonId: string
  sectionId: string
  claim: string
  technicalStatus: AcademyPersonalTechnicalStatus
  sourceIds: readonly string[]
  locators: readonly AcademySourceLocator[]
  limitations: readonly string[]
}

export interface AcademyStage0VisualDesign {
  visualDesignId: string
  lessonIds: readonly string[]
  sectionIds: readonly string[]
  pedagogicalQuestion: string
  semanticPayload: AcademyDiagramData
  sourceIds: readonly string[]
  sourceLocators: readonly AcademySourceLocator[]
  fidelity: 'conceptual' | 'calibre-specific'
  limitations: readonly string[]
  accessibilitySummary: string
  longDescription: string
  implementationStatus: 'implemented' | 'reused-and-versioned'
  contentHash: string
  visualHash: string
  colorIndependent: true
  reducedMotionSafe: true
}

export interface AcademyStage0PhotoBrief {
  photoBriefId: string
  subject: string
  scale: string
  angle: string
  lighting: string
  background: string
  requiredDetail: string
  comparison: string
  metadata: readonly string[]
  avoidConfusionWith: readonly string[]
  authorshipAndLicense: string
  status: 'future-real-photo-required'
}

export interface AcademyStage0PersonalPractice {
  personalPracticeId: string
  lessonIds: readonly string[]
  title: string
  objective: string
  inexpensiveMaterials: readonly string[]
  preparation: readonly string[]
  steps: readonly string[]
  help: readonly string[]
  stopSignal: string
  possibleDamage: readonly string[]
  observe: readonly string[]
  record: readonly string[]
  personalCriterion: readonly string[]
  suggestedRepetition: string
  certificationStatus: 'optional-local-not-certified'
  affectsProgress: false
  createsMastery: false
  completesLesson: false
}

export interface AcademyStage0PrerequisiteOverride {
  lessonId: string
  rawConceptIds: readonly string[]
  effectiveRequiredConceptIds: readonly string[]
  recommendedLessonIds: readonly string[]
  pathRole: 'anchor' | 'support'
  blocking: boolean
  rationale: string
  phase: '0.14F'
}

export interface AcademyStage1LessonCuration extends Omit<AcademyStage0LessonCuration, 'personalReviewStatus'> {
  macroStage: 1
  pathRole: AcademyCurriculumPathRole
  personalReviewStatus: 'not-reviewed'
}

export interface AcademyStage1ClaimReview extends AcademyStage0ClaimReview {
  claimType: 'system-model' | 'mechanism' | 'source-authority' | 'historical-context' | 'calibre-specific'
  verificationStatus: 'visually-verified' | 'verified-primary' | 'verified-secondary' | 'source-limited'
  applicability: string
  unresolvedReason?: string
}

export interface AcademyStage1PrerequisiteOverride {
  lessonId: string
  rawConceptIds: readonly string[]
  effectiveRequiredConceptIds: readonly string[]
  recommendedLessonIds: readonly string[]
  pathRole: AcademyCurriculumPathRole
  blocking: boolean
  rationale: string
  phase: '0.14G'
}

export type AcademyStage1SectionSpec = AcademyStage0SectionSpec
export type AcademyStage1ActivityPresentation = AcademyStage0ActivityPresentation
export type AcademyStage1VisualDesign = AcademyStage0VisualDesign
export type AcademyStage1PersonalPractice = AcademyStage0PersonalPractice

export interface AcademyStage2LessonCuration extends Omit<AcademyStage1LessonCuration, 'macroStage' | 'sections'> {
  macroStage: 2
  chapterId: 'stage-2.1' | 'stage-2.2' | 'stage-2.3' | 'stage-2.4' | 'stage-2.5' | 'stage-2.6'
  compositionMode: AcademyLessonCurationMode
  editorialArchetype: AcademyStage2EditorialArchetype
  checkpointPrompt: string
  checkpointExpectedElements: readonly string[]
  checkpointCommonFailure: string
  sections: readonly AcademyStage2SectionSpec[]
}

export type AcademyLessonCurationMode = 'augment' | 'merge' | 'replace'

/** Contexto inmutable que impide que una capa confunda autoría con el resultado de overlays previos. */
export interface AcademySourcePreservingLessonContext {
  lessonId: string
  phase: AcademyReaderCurationPhase
  authoredSections: readonly AcademyReaderSection[]
  previousPhaseSections: readonly AcademyReaderSection[]
  currentSections: readonly AcademyReaderSection[]
  historicalAliases: readonly AcademyLegacySectionAlias[]
  sourceBlockIds: readonly string[]
}

export interface AcademyContentPreservationRow {
  lessonId: string
  sourceSectionCount: number
  sourceTotalWords: number
  sourceSubstantiveWords: number
  visibleWords: number
  retainedSourceWords: number
  rewrittenEquivalentWords: number
  removedWords: number
  substantiveCoverage: number
  reductionJustifications: readonly string[]
  glossaryTermIdsPreserved: readonly string[]
}

export type AcademyStage2EditorialArchetype =
  | 'mechanism'
  | 'visual-anatomy'
  | 'calculation'
  | 'comparison'
  | 'state-system'
  | 'advanced-reference'

export type AcademySourceSectionDispositionAction =
  | 'retained'
  | 'merged'
  | 'replaced-equivalent'
  | 'removed-empty'
  | 'removed-duplicate'
  | 'removed-template'
  | 'removed-internal-metadata'
  | 'removed-unsafe-actionable'
  | 'manual-review'

export interface AcademySourceSectionDisposition {
  lessonId: string
  sourceSectionId: string
  sourceBlockId: string
  sourceRole: AcademyReaderSectionRole
  sourceHeading: string
  sourceWordCount: number
  action: AcademySourceSectionDispositionAction
  targetSectionIds: readonly string[]
  reason: string
  conceptIds: readonly string[]
  claimIds: readonly string[]
  glossaryTermIds: readonly string[]
}

export interface AcademyStage2ReplacementContract {
  lessonId: string
  sourceSectionIds: readonly string[]
  targetSectionIds: readonly string[]
  reason: string
  sourceWordCount: number
  replacementWordCount: number
  conceptsPreserved: readonly string[]
  claimsPreserved: readonly string[]
  sourceLocatorsPreserved: readonly string[]
}

export interface AcademyStage2ClaimReview extends AcademyStage1ClaimReview {
  claimHash: string
  sourceAuthority: 'conceptual-primary' | 'historical-secondary' | 'official-example' | 'source-limited'
}

export interface AcademyStage2PrerequisiteOverride extends Omit<AcademyStage1PrerequisiteOverride, 'phase'> {
  phase: '0.14H'
}

export interface AcademyStage2FormulaReview {
  formulaId: string
  lessonId: string
  expression: string
  decision: 'reused-verified' | 'not-used' | 'ocr-unverified'
  sourceId: string
  locator?: AcademySourceLocator
  reason: string
}

export interface AcademyStage2SectionSpec extends AcademyStage0SectionSpec {
  placement: 'before-source' | 'after-first-substantive-source' | 'after-source' | 'reference-tail'
  visualDesignId?: string
}
export type AcademyStage2ActivityPresentation = AcademyStage0ActivityPresentation
export type AcademyStage2VisualDesign = AcademyStage0VisualDesign
export type AcademyStage2PersonalPractice = AcademyStage0PersonalPractice

export type AcademyStage3EditorialArchetype =
  | 'observation-inspection'
  | 'measurement'
  | 'diagnosis'
  | 'reasoned-service'
  | 'historical-case'
  | 'data-comparison'

export type AcademyStage3SectionSpec = AcademyStage2SectionSpec

export interface AcademyStage3LessonCuration {
  lessonId: string
  sourceBlockId: string
  macroStage: 3
  chapterId: 'chapter.3.1' | 'chapter.3.2' | 'chapter.3.3' | 'chapter.3.4'
  pathRole: AcademyCurriculumPathRole
  compositionMode: AcademyLessonCurationMode
  editorialArchetype: AcademyStage3EditorialArchetype
  centralQuestion: string
  whyNow: string
  observableOutcome: string
  sections: readonly AcademyStage3SectionSpec[]
  visualDesignIds: readonly string[]
  activityPresentations: readonly AcademyStage0ActivityPresentation[]
  sourceClaimIds: readonly string[]
  limitations: readonly string[]
  personalReviewStatus: 'not-reviewed'
  technicalStatus: AcademyPersonalTechnicalStatus
}

export interface AcademyStage3PrerequisiteOverride extends Omit<AcademyStage1PrerequisiteOverride, 'phase'> {
  phase: '0.14I'
}

export type AcademyStage3ActivityPresentation = AcademyStage0ActivityPresentation
export type AcademyStage3VisualDesign = AcademyStage0VisualDesign
export type AcademyStage3PersonalPractice = AcademyStage0PersonalPractice

export type AcademyStage4EditorialArchetype =
  | 'calibre-identification'
  | 'document-reading'
  | 'calibre-architecture'
  | 'subsystem'
  | 'structural-dependency'
  | 'virtual-sequence'
  | 'symbolic-inspection'
  | 'virtual-assembly'
  | 'scenario-diagnosis'
  | 'traceable-dossier'

export type AcademyStage4SectionSpec = AcademyStage2SectionSpec

export interface AcademyStage4LessonCuration {
  lessonId: string
  sourceBlockId: string
  macroStage: 4
  chapterId: 'chapter.4.1' | 'chapter.4.2' | 'chapter.4.3' | 'chapter.4.4' | 'chapter.4.5'
  pathRole: AcademyCurriculumPathRole
  compositionMode: AcademyLessonCurationMode
  editorialArchetype: AcademyStage4EditorialArchetype
  centralQuestion: string
  whyNow: string
  observableOutcome: string
  sections: readonly AcademyStage4SectionSpec[]
  visualDesignIds: readonly string[]
  activityPresentations: readonly AcademyStage0ActivityPresentation[]
  sourceClaimIds: readonly string[]
  limitations: readonly string[]
  personalReviewStatus: 'not-reviewed'
  technicalStatus: AcademyPersonalTechnicalStatus
}

export interface AcademyStage4PrerequisiteOverride extends Omit<AcademyStage1PrerequisiteOverride, 'phase'> {
  phase: '0.14J'
}

export type AcademyStage4ActivityPresentation = AcademyStage0ActivityPresentation
export type AcademyStage4VisualDesign = AcademyStage0VisualDesign
export type AcademyStage4PersonalPractice = AcademyStage0PersonalPractice

export interface AcademyStage4ClaimReview {
  claimId: string
  lessonId: string
  sectionId: string
  claim: string
  claimType: 'identity' | 'official-specification' | 'official-part' | 'user-operation' | 'structural-relation' | 'simulation-boundary' | 'diagnosis-boundary'
  technicalStatus: AcademyPersonalTechnicalStatus
  central: boolean
  sourceIds: readonly string[]
  snapshotIds: readonly string[]
  locators: readonly AcademySourceLocator[]
  numericValues: readonly string[]
  partReference?: string
  verificationStatus: 'visually-verified' | 'verified-primary' | 'source-limited' | 'source-needed'
  limitations: readonly string[]
}

export type AcademyStage5EditorialArchetype =
  | 'requirements-definition'
  | 'documented-selection'
  | 'interface-analysis'
  | 'dimensional-chain'
  | 'dynamic-clearance'
  | 'donor-audit'
  | 'integration-dossier'

export type AcademyStage5SectionSpec = AcademyStage2SectionSpec

export interface AcademyStage5LessonCuration {
  lessonId: string
  sourceBlockId: string
  macroStage: 5
  chapterId: 'chapter.5.1' | 'chapter.5.2' | 'chapter.5.3' | 'chapter.5.4' | 'chapter.5.5'
  pathRole: 'anchor' | 'support'
  compositionMode: 'augment'
  editorialArchetype: AcademyStage5EditorialArchetype
  centralQuestion: string
  whyNow: string
  observableOutcome: string
  sections: readonly AcademyStage5SectionSpec[]
  visualDesignIds: readonly string[]
  activityPresentations: readonly AcademyStage0ActivityPresentation[]
  sourceClaimIds: readonly string[]
  limitations: readonly string[]
  personalReviewStatus: 'not-reviewed'
  technicalStatus: AcademyPersonalTechnicalStatus
  curriculumStatus: 'complete-method'
}

export interface AcademyStage5PrerequisiteOverride extends Omit<AcademyStage1PrerequisiteOverride, 'phase'> {
  phase: '0.14K'
}

export type AcademyStage5ActivityPresentation = AcademyStage0ActivityPresentation
export type AcademyStage5VisualDesign = AcademyStage0VisualDesign
export type AcademyStage5PersonalPractice = AcademyStage0PersonalPractice
