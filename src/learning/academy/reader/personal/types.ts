import type {
  AcademyDiagramData,
  AcademyPersonalReviewStatus,
  AcademyPersonalTechnicalStatus,
  AcademyReaderSectionRole,
} from '../academyReaderModel'

export type AcademyPersonalCurationPhase = '0.14E' | '0.14F'
export type AcademyEvidenceModality = 'K' | 'V' | 'P' | 'R'

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
