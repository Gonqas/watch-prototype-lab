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
  entityType: z.enum(['corpus', 'route', 'module', 'lesson', 'activity', 'concept', 'source', 'asset']),
  entityId: nonEmpty.max(240),
  message: nonEmpty.max(2_000),
  evidence: z.array(nonEmpty.max(1_000)),
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
export type SourceClaim = z.infer<typeof SourceClaimSchema>
export type SourceRecord = z.infer<typeof SourceRecordSchema>
export type AuditIssue = z.infer<typeof AuditIssueSchema>

export { SourceCitationSchema }
export type { SourceCitation } from '../sources'
