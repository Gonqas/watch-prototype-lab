import { z } from 'zod'
import { SourceCitationSchema } from '../sources'

const contentId = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,159}$/)
const nonEmpty = z.string().min(1)

export const learningArchetypeValues = [
  'system-overview',
  'mechanism-explanation',
  'visual-anatomy',
  'bench-procedure',
  'psychomotor-skill',
  'inspection',
  'diagnosis-case',
  'measurement',
  'calculation',
  'manufacturing',
  'design',
  'historical-comparison',
  'calibre-service',
  'capstone-project',
] as const

export const evidenceLevelValues = ['K', 'V', 'P', 'R'] as const
export const executionTierValues = [
  'simulation',
  'home-bench',
  'specialist-workshop',
  'professional-or-outsourced',
] as const
export const safetyStatusValues = [
  'normal',
  'caution',
  'supervised',
  'historical-non-actionable',
  'prohibited-in-academy',
] as const
export const historicalStatusValues = [
  'current',
  'mixed',
  'historical-context',
  'historical-non-actionable',
  'unknown',
] as const
export const verificationStatusValues = [
  'verified-primary',
  'verified-secondary',
  'visually-verified',
  'ocr-unverified',
  'inferred',
  'unknown',
  'requires-modern-corroboration',
] as const
export const editorialStatusValues = [
  'keep',
  'needs-edit',
  'needs-source-review',
  'needs-safety-review',
  'needs-visual-review',
  'manual-review',
  'blocked',
] as const
export const visualRequirementValues = ['required', 'recommended', 'optional', 'not-applicable', 'unknown'] as const
export const curriculumStageValues = [
  '0-prepare-bench-and-control',
  '1-understand-watch-as-system',
  '2-understand-mechanical-systems',
  '3-observe-measure-diagnose',
  '4-work-on-real-calibre',
  '5-build-complete-watch',
  '6-repair-adapt-manufacture-components',
  '7-design-validate-own-watch-or-movement',
  'specialization',
  'enrichment',
  'reference-only',
  'historical-case',
] as const
export const recommendedActionValues = [
  'keep',
  'edit',
  'move',
  'merge',
  'split',
  'replace',
  'archive',
  'manual-review',
] as const

export const detectionMethodValues = [
  'explicit-metadata',
  'curated-override',
  'structural-rule',
  'exact-match',
  'semantic-rule',
  'heuristic-keyword',
  'inherited-from-source',
  'derived-from-another-issue',
] as const
export const auditConfidenceValues = ['high', 'medium', 'low'] as const
export const auditScopeValues = ['global', 'route', 'module', 'lesson', 'activity', 'claim', 'procedure', 'source'] as const
export const reviewStatusValues = [
  'unreviewed',
  'confirmed',
  'likely',
  'false-positive',
  'needs-source-check',
  'needs-human-judgment',
] as const
export const macroStageValues = [
  '0-prepare-bench-and-control',
  '1-understand-watch-as-system',
  '2-understand-mechanical-systems',
  '3-observe-measure-diagnose',
  '4-work-on-real-calibre',
  '5-build-complete-watch',
  '6-repair-adapt-manufacture-components',
  '7-design-validate-own-watch-or-movement',
] as const
export const trackRoleValues = ['core', 'specialization', 'enrichment', 'reference-only', 'historical-case'] as const
export const prerequisiteClassificationValues = [
  'essential-foundation',
  'helpful-context',
  'application-example',
  'advanced-detail',
  'lateral-reference',
  'improper',
  'unknown',
] as const

export const LearningArchetypeSchema = z.enum(learningArchetypeValues)
export const EvidenceLevelSchema = z.enum(evidenceLevelValues)
export const ExecutionTierSchema = z.enum(executionTierValues)
export const SafetyStatusSchema = z.enum(safetyStatusValues)
export const HistoricalStatusSchema = z.enum(historicalStatusValues)
export const VerificationStatusSchema = z.enum(verificationStatusValues)
export const EditorialStatusSchema = z.enum(editorialStatusValues)
export const VisualRequirementSchema = z.enum(visualRequirementValues)
export const CurriculumStageSchema = z.enum(curriculumStageValues)
export const RecommendedActionSchema = z.enum(recommendedActionValues)
export const DetectionMethodSchema = z.enum(detectionMethodValues)
export const AuditConfidenceSchema = z.enum(auditConfidenceValues)
export const AuditScopeSchema = z.enum(auditScopeValues)
export const ReviewStatusSchema = z.enum(reviewStatusValues)
export const MacroStageSchema = z.enum(macroStageValues)
export const TrackRoleSchema = z.enum(trackRoleValues)
export const PrerequisiteClassificationSchema = z.enum(prerequisiteClassificationValues)

export const EvidenceProfileSchema = z.object({
  modalities: z.array(EvidenceLevelSchema).min(1),
  primaryModality: EvidenceLevelSchema,
  knowledgeExplanationRequired: z.boolean(),
  virtualDemonstrationRequired: z.boolean(),
  physicalExecutionRequired: z.boolean(),
  measuredOrReviewedResultRequired: z.boolean(),
  physicalCompetenceClaim: z.boolean(),
  reviewerRequired: z.boolean(),
  measurableAcceptanceCriteria: z.array(nonEmpty.max(1_000)).default([]),
  evidenceArtifacts: z.array(nonEmpty.max(500)).default([]),
  classificationMethod: DetectionMethodSchema,
  confidence: AuditConfidenceSchema,
}).strict().superRefine((profile, context) => {
  if (!profile.modalities.includes(profile.primaryModality)) {
    context.addIssue({ code: 'custom', path: ['primaryModality'], message: 'La modalidad primaria debe formar parte del perfil.' })
  }
  if (profile.physicalExecutionRequired && !profile.modalities.includes('P')) {
    context.addIssue({ code: 'custom', path: ['modalities'], message: 'La ejecución física requiere modalidad P.' })
  }
  if (profile.measuredOrReviewedResultRequired && !profile.modalities.includes('R')) {
    context.addIssue({ code: 'custom', path: ['modalities'], message: 'Un resultado medido o revisado requiere modalidad R.' })
  }
})

export const SourceHistoricalRiskSchema = z.object({
  sourceId: contentId,
  hazards: z.array(nonEmpty.max(240)),
  operationallyInherited: z.literal(false),
  notes: z.array(nonEmpty.max(1_000)).default([]),
}).strict()

export const ClaimRiskSchema = z.object({
  claimId: contentId,
  hazards: z.array(nonEmpty.max(240)),
  actionable: z.boolean(),
  exactFragment: z.string().max(1_000).nullable(),
}).strict()

export const ProcedureRiskSchema = z.object({
  procedureId: contentId,
  lessonId: contentId,
  blockId: contentId.nullable(),
  claimId: contentId.nullable(),
  sourceId: contentId.nullable(),
  hazard: nonEmpty.max(240),
  exactFragment: nonEmpty.max(1_000),
  actionVerb: nonEmpty.max(120),
  executionContext: nonEmpty.max(500),
  sequencePresent: z.boolean(),
  modernAlternativeStatus: z.enum(['available', 'pending', 'not-applicable']),
  blockedReason: nonEmpty.max(1_000),
  safetyStatus: SafetyStatusSchema,
}).strict()

export const LessonOperationalRiskSchema = z.object({
  lessonId: contentId,
  sourceHistoricalRiskCount: z.number().int().nonnegative(),
  claimRiskCount: z.number().int().nonnegative(),
  procedureRiskCount: z.number().int().nonnegative(),
  operationalSafetyStatus: SafetyStatusSchema,
  invitesExecution: z.boolean(),
  rationale: nonEmpty.max(2_000),
}).strict()

export const ClaimAuditSchema = z.object({
  claimId: contentId,
  lessonId: contentId,
  blockId: contentId,
  claimTextHash: z.string().regex(/^[a-f0-9]{64}$/),
  claimType: nonEmpty.max(120),
  numericValues: z.array(nonEmpty.max(120)),
  formulaPresent: z.boolean(),
  primarySourceId: contentId.nullable(),
  supportingSourceIds: z.array(contentId),
  contextSourceIds: z.array(contentId),
  visualInspirationSourceIds: z.array(contentId),
  safetySourceIds: z.array(contentId),
  identificationDatabaseSourceIds: z.array(contentId),
  sourceLocator: z.string().max(2_048).nullable(),
  page: z.string().max(80).nullable(),
  figure: z.string().max(160).nullable(),
  table: z.string().max(160).nullable(),
  manufacturerApplicability: z.string().max(240).nullable(),
  verificationStatus: VerificationStatusSchema,
  visuallyVerified: z.boolean(),
  modernCorroboration: z.enum(['not-required', 'verified', 'required', 'unknown']),
  unresolvedReason: z.string().max(1_000).nullable(),
}).strict()

export const SourceAliasSchema = z.object({
  sourceId: contentId,
  canonicalSourceId: contentId,
  aliasOf: contentId.nullable(),
  currentLocator: z.string().max(2_048).nullable(),
  previousLocator: z.string().max(2_048).nullable(),
  sameWork: z.boolean(),
  sameEdition: z.boolean(),
  sameDocument: z.boolean(),
  deprecationStatus: z.enum(['canonical', 'active-alias', 'deprecated-alias', 'locator-updated']),
  migrationNotes: z.array(nonEmpty.max(1_000)).default([]),
}).strict()

export const InventorySnapshotSchema = z.object({
  sourceId: contentId,
  inventoryMethod: z.enum(['curated-snapshot', 'dynamically-extracted', 'hybrid']),
  verifiedAgainstSha256: z.string().regex(/^[a-f0-9]{64}$/),
  currentSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  verificationValid: z.boolean(),
  verifiedAt: z.string().min(10),
  verifiedBy: nonEmpty.max(240),
  sourceSnapshotVersion: nonEmpty.max(80),
  extractionTool: nonEmpty.max(500),
  manualVerificationNotes: z.array(nonEmpty.max(1_000)),
  requiresRevalidationOnHashChange: z.literal(true),
}).strict()

export const SourceClaimSchema = z.object({
  claimId: contentId,
  statement: nonEmpty.max(4_000),
  sourceIds: z.array(contentId).min(1),
  citations: z.array(SourceCitationSchema).default([]),
  verificationStatus: VerificationStatusSchema,
  containsNumericData: z.boolean(),
  containsFormula: z.boolean(),
  visualVerificationRequired: z.boolean(),
  modernCorroborationRequired: z.boolean(),
  editorialNotes: z.array(nonEmpty.max(1_000)).default([]),
}).strict()

export const SourceLocationSchema = z.object({
  kind: z.enum(['private-local', 'external', 'project-original', 'unavailable']),
  locator: nonEmpty.max(2_048),
}).strict()

export const SourceRecordSchema = z.object({
  sourceId: contentId,
  title: nonEmpty.max(500),
  authorOrEntity: nonEmpty.max(300),
  editionOrDate: z.string().max(240).nullable(),
  languages: z.array(nonEmpty.max(32)).min(1),
  sourceType: nonEmpty.max(160),
  editorialFunction: z.enum([
    'A-manufacturer-official',
    'B-theory-of-horology',
    'C-daniels-watchmaking',
    'D-bulova-school',
    'E-chicago-school',
    'F-tm-9-1575',
    'G-watchmaker-or-visual-resource',
    'H-reference-database',
    'project-original',
    'other',
  ]),
  subjectAuthority: z.array(nonEmpty.max(240)),
  applicableScopes: z.array(nonEmpty.max(500)),
  nonApplicableScopes: z.array(nonEmpty.max(500)),
  historicalStatus: HistoricalStatusSchema,
  ocrQuality: z.enum(['not-applicable', 'native-text', 'good', 'mixed', 'poor', 'unknown']),
  imageAvailability: z.enum(['yes', 'partial', 'no', 'unknown']),
  knownRisks: z.array(nonEmpty.max(500)),
  requiresModernCorroboration: z.boolean(),
  location: SourceLocationSchema,
  reusePolicy: nonEmpty.max(2_000),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  verificationStatus: VerificationStatusSchema,
  packageIds: z.array(contentId),
  usedByLessonIds: z.array(contentId),
  usedByActivityIds: z.array(contentId),
  citationPrecision: z.enum(['page-or-figure', 'chapter-or-section', 'document', 'missing']),
  citationVariants: z.array(SourceCitationSchema),
  editorialNotes: z.array(nonEmpty.max(1_000)),
}).strict()

export const AuditIssueSchema = z.object({
  detectorId: z.number().int().min(1).max(25),
  category: nonEmpty.max(160),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  entityType: z.enum(['corpus', 'global', 'route', 'module', 'lesson', 'activity', 'concept', 'claim', 'procedure', 'source', 'asset']),
  entityId: nonEmpty.max(240),
  message: nonEmpty.max(2_000),
  evidence: z.array(nonEmpty.max(1_000)),
  detectionMethod: DetectionMethodSchema.default('structural-rule'),
  confidence: AuditConfidenceSchema.default('medium'),
  scope: AuditScopeSchema.default('lesson'),
  rootCauseId: z.string().max(240).nullable().default(null),
  derivedFromIssueIds: z.array(z.string().min(1).max(240)).default([]),
  reviewStatus: ReviewStatusSchema.default('unreviewed'),
  actionable: z.boolean().default(false),
  manualReviewRequired: z.literal(true),
}).strict()

export type LearningArchetype = z.infer<typeof LearningArchetypeSchema>
export type EvidenceLevel = z.infer<typeof EvidenceLevelSchema>
export type ExecutionTier = z.infer<typeof ExecutionTierSchema>
export type SafetyStatus = z.infer<typeof SafetyStatusSchema>
export type HistoricalStatus = z.infer<typeof HistoricalStatusSchema>
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>
export type EditorialStatus = z.infer<typeof EditorialStatusSchema>
export type VisualRequirement = z.infer<typeof VisualRequirementSchema>
export type CurriculumStage = z.infer<typeof CurriculumStageSchema>
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>
export type DetectionMethod = z.infer<typeof DetectionMethodSchema>
export type AuditConfidence = z.infer<typeof AuditConfidenceSchema>
export type AuditScope = z.infer<typeof AuditScopeSchema>
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>
export type MacroStage = z.infer<typeof MacroStageSchema>
export type TrackRole = z.infer<typeof TrackRoleSchema>
export type PrerequisiteClassification = z.infer<typeof PrerequisiteClassificationSchema>
export type EvidenceProfile = z.infer<typeof EvidenceProfileSchema>
export type SourceHistoricalRisk = z.infer<typeof SourceHistoricalRiskSchema>
export type ClaimRisk = z.infer<typeof ClaimRiskSchema>
export type ProcedureRisk = z.infer<typeof ProcedureRiskSchema>
export type LessonOperationalRisk = z.infer<typeof LessonOperationalRiskSchema>
export type ClaimAudit = z.infer<typeof ClaimAuditSchema>
export type SourceAlias = z.infer<typeof SourceAliasSchema>
export type InventorySnapshot = z.infer<typeof InventorySnapshotSchema>
export type SourceClaim = z.infer<typeof SourceClaimSchema>
export type SourceRecord = z.infer<typeof SourceRecordSchema>
export type AuditIssue = z.infer<typeof AuditIssueSchema>

export { SourceCitationSchema }
export type { SourceCitation } from '../sources'
