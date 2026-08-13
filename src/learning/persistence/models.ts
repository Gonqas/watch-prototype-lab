import { z } from 'zod'
import { MasteryStateSchema } from '../assessment'

const id = z.string().min(1).max(200)
const semver = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/)
const instant = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/)
const jsonObject = z.record(z.string(), z.unknown())

export const LearningAccessibilityPreferencesSchema = z.object({
  reducedMotion: z.boolean().default(false),
  textScale: z.number().min(0.75).max(3).default(1),
  contrast: z.enum(['system', 'normal', 'high']).default('system'),
  interactionMode: z.enum(['pointer', 'keyboard', 'touch', 'adaptive']).default('adaptive'),
  extendedTime: z.boolean().default(false),
  readLabels: z.boolean().default(false),
  adaptations: z.array(z.string().min(1).max(120)).max(50).default([]),
}).strict()
export type LearningAccessibilityPreferences = z.infer<typeof LearningAccessibilityPreferencesSchema>

export const LearningProfileSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  displayName: z.string().min(1).max(120),
  locale: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/),
  accessibility: LearningAccessibilityPreferencesSchema,
  educationalPreferences: jsonObject.default({}),
  createdAt: instant,
  modifiedAt: instant,
  archived: z.boolean(),
  deletedAt: instant.optional(),
  recordVersion: z.number().int().positive(),
}).strict()
export type LearningProfile = z.infer<typeof LearningProfileSchema>

export const learningSessionStates = [
  'created', 'preparing', 'ready', 'active', 'paused', 'awaiting_interaction',
  'suspended', 'interrupted', 'recovering', 'completed', 'cancelled', 'failed', 'archived',
] as const
export const PersistentLearningSessionStateSchema = z.enum(learningSessionStates)
export type PersistentLearningSessionState = z.infer<typeof PersistentLearningSessionStateSchema>

export const LearningCheckpointSchema = z.object({
  schemaVersion: z.literal(1),
  packageId: id,
  packageVersion: semver,
  sceneId: id,
  activeStepId: id.optional(),
  timelinePositionMs: z.number().nonnegative(),
  resolvedBarrierIds: z.array(id),
  provisionalAnswers: jsonObject,
  hintIds: z.array(id),
  educationalState: jsonObject,
  runtimeSnapshot: jsonObject.optional(),
  lastPersistedSequence: z.number().int().min(-1),
  projectFingerprint: sha256,
  capabilities: z.array(z.string().min(1)),
  runtimeVersion: semver,
  createdAt: instant,
  complete: z.boolean(),
}).strict()
export type LearningCheckpoint = z.infer<typeof LearningCheckpointSchema>

export const PersistentLearningSessionSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  profileId: id,
  packageId: id,
  packageVersion: semver,
  lessonId: id,
  activityId: id,
  activityVersion: semver,
  rubricId: id,
  rubricVersion: semver,
  reference: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('project'), projectId: id }).strict(),
    z.object({ kind: z.literal('template'), templateId: id }).strict(),
    z.object({ kind: z.literal('fixture'), fixtureId: id }).strict(),
    z.object({
      kind: z.literal('composition'),
      compositionId: id,
      fixtureIds: z.array(id).min(2).max(8),
    }).strict(),
  ]),
  initialProjectFingerprint: sha256,
  currentProjectFingerprint: sha256,
  initialCapabilities: z.array(z.string().min(1)),
  state: PersistentLearningSessionStateSchema,
  startedAt: instant,
  lastCheckpointAt: instant.optional(),
  completedAt: instant.optional(),
  attempt: z.number().int().positive(),
  learningMode: z.enum(['authored', 'remediation', 'demonstration', 'transfer', 'retention']).optional(),
  originSessionId: id.optional(),
  runtimeVersion: semver,
  checkpoint: LearningCheckpointSchema.optional(),
  reason: z.string().max(1000).optional(),
  updatedAt: instant,
}).strict()
export type PersistentLearningSession = z.infer<typeof PersistentLearningSessionSchema>

export const PersistedLearningEventSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  sessionId: id,
  sequence: z.number().int().nonnegative(),
  timestamp: instant,
  runtimeEventVersion: z.number().int().positive(),
  type: z.string().min(1).max(120),
  origin: z.enum(['runtime', 'session-service', 'recovery', 'import']),
  actor: z.enum(['learner', 'system', 'reviewer']),
  payload: jsonObject,
  idempotencyKey: z.string().min(1).max(300),
  causalEventId: id.optional(),
  correlationId: id.optional(),
  persistedAt: instant,
  compatibility: z.enum(['supported', 'future-preserved', 'read-only']),
}).strict()
export type PersistedLearningEvent = z.infer<typeof PersistedLearningEventSchema>

export const evidenceTypes = [
  'identification', 'classification', 'explanation', 'sequence', 'diagnosis', 'measurement',
  'selection', 'assembly', 'decision', 'written-response', 'simulation-result', 'human-review',
] as const
export const PersistentEvidenceTypeSchema = z.enum(evidenceTypes)
export type PersistentEvidenceType = z.infer<typeof PersistentEvidenceTypeSchema>
export const PersistentEvidenceStatusSchema = z.enum(['active', 'superseded', 'invalidated'])

export const PersistentEvidenceRecordSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  profileId: id,
  sessionId: id,
  competencyId: id,
  evidenceType: PersistentEvidenceTypeSchema,
  sourceEventIds: z.array(id).min(1),
  packageId: id,
  packageVersion: semver,
  activityId: id,
  activityVersion: semver,
  extractionRuleId: id,
  extractionRuleVersion: semver,
  content: jsonObject,
  confidence: z.number().min(0).max(1),
  uncertainty: z.number().min(0).max(1).optional(),
  accessibilityAccommodations: z.array(z.string().min(1)),
  observedAt: instant,
  createdAt: instant,
  status: PersistentEvidenceStatusSchema,
  relatedEvidenceId: id.optional(),
  reason: z.string().max(1000).optional(),
  provenance: z.array(z.object({
    kind: z.enum(['runtime-event', 'package', 'project-fingerprint', 'human-review']),
    reference: z.string().min(1),
  }).strict()),
  hash: sha256,
}).strict()
export type PersistentEvidenceRecord = z.infer<typeof PersistentEvidenceRecordSchema>

export const PersistentAssessmentSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  profileId: id,
  evidenceIds: z.array(id),
  competencyId: id,
  ruleId: id,
  ruleVersion: semver,
  algorithm: z.string().min(1),
  algorithmVersion: semver,
  result: z.object({
    passed: z.boolean(),
    resultingState: MasteryStateSchema,
    score: z.number().min(0).max(1).optional(),
  }).strict(),
  explanation: z.object({
    satisfiedRuleIds: z.array(id),
    unsatisfiedRuleIds: z.array(id),
    ignoredEvidence: z.array(z.object({ evidenceId: id, reason: z.string().min(1) }).strict()),
    summary: z.string().min(1),
  }).strict(),
  uncertainty: z.number().min(0).max(1).optional(),
  recommendations: z.array(z.string().min(1)),
  evaluatedAt: instant,
  projection: z.enum(['historical', 'current']),
  inputHash: sha256,
}).strict()
export type PersistentAssessment = z.infer<typeof PersistentAssessmentSchema>

export const LearningMasteryProjectionSchema = z.object({
  schemaVersion: z.literal(1),
  profileId: id,
  competencyId: id,
  state: MasteryStateSchema,
  strength: z.number().min(0).max(1),
  primaryEvidenceIds: z.array(id),
  latestValidEvidenceAt: instant.optional(),
  firstDemonstratedAt: instant.optional(),
  latestDemonstratedAt: instant.optional(),
  firstTransferredAt: instant.optional(),
  latestTransferredAt: instant.optional(),
  transferEvidenceIds: z.array(id).optional(),
  retentionCandidateAt: instant.optional(),
  reviewStage: z.number().int().min(1).max(3).optional(),
  nextReviewAt: instant.optional(),
  retentionEvidenceIds: z.array(id),
  reasons: z.array(z.string().min(1)),
  projectorVersion: semver,
  calculatedAt: instant,
}).strict()
export type LearningMasteryProjection = z.infer<typeof LearningMasteryProjectionSchema>

export const InstalledLearningPackageSchema = z.object({
  schemaVersion: z.literal(1),
  packageId: id,
  version: semver,
  origin: z.enum(['integrated', 'local-unsigned']),
  packageHash: sha256,
  manifest: jsonObject,
  status: z.enum(['staged', 'active', 'failed', 'retained', 'removed']),
  installedAt: instant,
  verifiedAt: instant,
  storageReference: z.string().min(1),
  resolvedDependencies: z.array(z.object({ packageId: id, version: semver }).strict()),
  pinnedSessionIds: z.array(id),
  removable: z.boolean(),
  retentionReason: z.string().max(1000).optional(),
}).strict()
export type InstalledLearningPackage = z.infer<typeof InstalledLearningPackageSchema>

export const LearningMigrationRecordSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(1),
  checksum: sha256,
  appliedAt: instant,
  durationMs: z.number().nonnegative(),
}).strict()
export type LearningMigrationRecord = z.infer<typeof LearningMigrationRecordSchema>

export const LearningBackupRecordSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  kind: z.enum(['pre-migration', 'pre-restore', 'manual', 'scheduled-daily', 'scheduled-weekly', 'metrology-metadata', 'metrology-full']),
  createdAt: instant,
  storageReference: z.string().min(1),
  manifestHash: sha256,
  databaseHash: sha256,
  verified: z.boolean(),
  protected: z.boolean(),
  bytes: z.number().int().nonnegative(),
}).strict()
export type LearningBackupRecord = z.infer<typeof LearningBackupRecordSchema>

export const LearningRecoveryLogRecordSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  sessionId: id.optional(),
  action: z.string().min(1).max(120),
  outcome: z.enum(['offered', 'accepted', 'rejected', 'completed', 'failed']),
  details: jsonObject,
  createdAt: instant,
}).strict()
export type LearningRecoveryLogRecord = z.infer<typeof LearningRecoveryLogRecordSchema>

export const LearningRepositorySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().nonnegative(),
  profiles: z.array(LearningProfileSchema),
  sessions: z.array(PersistentLearningSessionSchema),
  events: z.array(PersistedLearningEventSchema),
  evidence: z.array(PersistentEvidenceRecordSchema),
  assessments: z.array(PersistentAssessmentSchema),
  mastery: z.array(LearningMasteryProjectionSchema),
  packages: z.array(InstalledLearningPackageSchema),
  migrations: z.array(LearningMigrationRecordSchema),
  backups: z.array(LearningBackupRecordSchema),
  recoveryLog: z.array(LearningRecoveryLogRecordSchema),
}).strict()
export type LearningRepositorySnapshot = z.infer<typeof LearningRepositorySnapshotSchema>

export function emptyLearningRepositorySnapshot(): LearningRepositorySnapshot {
  return {
    schemaVersion: 1,
    revision: 0,
    profiles: [],
    sessions: [],
    events: [],
    evidence: [],
    assessments: [],
    mastery: [],
    packages: [],
    migrations: [],
    backups: [],
    recoveryLog: [],
  }
}
