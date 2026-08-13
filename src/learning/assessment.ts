import { z } from 'zod'
import { stableFingerprint } from './identity'

export const masteryStateValues = ['not_started', 'introduced', 'practising', 'demonstrated', 'retained'] as const
export const MasteryStateSchema = z.enum(masteryStateValues)
export type MasteryState = z.infer<typeof MasteryStateSchema>

const semver = z.string().regex(/^\d+\.\d+\.\d+$/)
const evidenceKindValues = ['answer', 'procedure', 'observation', 'artifact', 'human-review'] as const
export const EvidenceKindSchema = z.enum(evidenceKindValues)

export const CompetencyDefinitionSchema = z.object({
  id: z.string().min(1).max(160),
  version: semver,
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(2000),
  prerequisites: z.array(z.string().min(1)).default([]),
}).strict()
export type CompetencyDefinition = z.infer<typeof CompetencyDefinitionSchema>

export const EvidenceRecordSchema = z.object({
  id: z.string().min(1).max(160),
  competencyIds: z.array(z.string().min(1)).min(1),
  sessionId: z.string().min(1),
  kind: EvidenceKindSchema,
  score: z.number().min(0).max(1),
  occurredAt: z.string().min(10),
  payloadFingerprint: z.string().min(1),
  sourceEventIds: z.array(z.string().min(1)).default([]),
  claimIds: z.array(z.string().min(1)).default([]),
  voided: z.boolean().default(false),
}).strict()
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>

export const AssessmentRuleVersionSchema = z.object({
  id: z.string().min(1).max(160),
  version: semver,
  targetState: z.enum(['introduced', 'practising', 'demonstrated', 'retained']),
  acceptedEvidenceKinds: z.array(EvidenceKindSchema).min(1),
  minimumEvidence: z.number().int().positive(),
  minimumScore: z.number().min(0).max(1),
  minimumDistinctSessions: z.number().int().positive().default(1),
  minimumSpanDays: z.number().nonnegative().default(0),
  explanationTemplate: z.string().min(1).max(1000),
}).strict()
export type AssessmentRuleVersion = z.infer<typeof AssessmentRuleVersionSchema>

export const AssessmentResultSchema = z.object({
  id: z.string().min(1),
  competencyId: z.string().min(1),
  ruleId: z.string().min(1),
  ruleVersion: semver,
  previousState: MasteryStateSchema,
  resultingState: MasteryStateSchema,
  passed: z.boolean(),
  evidenceIds: z.array(z.string().min(1)),
  evaluatedAt: z.string().min(10),
  explanation: z.string().min(1),
  inputFingerprint: z.string().min(1),
}).strict()
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>

export const LearningProgressSchema = z.object({
  competencyId: z.string().min(1),
  state: MasteryStateSchema,
  updatedAt: z.string().min(10),
  assessmentResultIds: z.array(z.string().min(1)),
}).strict()
export type LearningProgress = z.infer<typeof LearningProgressSchema>

export const ReversibleEducationalStateSchema = z.object({
  selectedEntityIds: z.array(z.string()).default([]),
  hiddenEntityIds: z.array(z.string()).default([]),
  isolatedEntityIds: z.array(z.string()).default([]),
  explode: z.number().min(0).max(1).default(0),
  simulatedErrors: z.array(z.string()).default([]),
  annotations: z.array(z.string()).default([]),
  answers: z.record(z.string(), z.unknown()).default({}),
  hypotheses: z.array(z.string()).default([]),
}).strict()

export const LearningSessionSchema = z.object({
  id: z.string().min(1),
  package: z.object({ id: z.string().min(1), version: semver }).strict(),
  activity: z.object({ id: z.string().min(1), version: semver }).strict(),
  rubric: z.object({ id: z.string().min(1), version: semver }).strict(),
  reference: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('project'), projectId: z.string().min(1) }).strict(),
    z.object({ kind: z.literal('template'), templateId: z.string().min(1) }).strict(),
  ]),
  initialFingerprint: z.string().min(1),
  availableCapabilities: z.array(z.string().min(1)),
  reversibleState: ReversibleEducationalStateSchema,
  startedAt: z.string().min(10),
  endedAt: z.string().min(10).optional(),
}).strict()
export type LearningSession = z.infer<typeof LearningSessionSchema>

export const LearningEventSchema = z.discriminatedUnion('eventType', [
  z.object({ id: z.string().min(1), sessionId: z.string().min(1), at: z.string().min(10), eventType: z.literal('activity-started') }).strict(),
  z.object({ id: z.string().min(1), sessionId: z.string().min(1), at: z.string().min(10), eventType: z.literal('answer-submitted'), questionId: z.string().min(1), answerFingerprint: z.string().min(1) }).strict(),
  z.object({ id: z.string().min(1), sessionId: z.string().min(1), at: z.string().min(10), eventType: z.literal('entity-selected'), entityId: z.string().min(1) }).strict(),
  z.object({ id: z.string().min(1), sessionId: z.string().min(1), at: z.string().min(10), eventType: z.literal('activity-completed') }).strict(),
  z.object({ id: z.string().min(1), sessionId: z.string().min(1), at: z.string().min(10), eventType: z.literal('evidence-recorded'), evidenceId: z.string().min(1) }).strict(),
])
export type LearningEvent = z.infer<typeof LearningEventSchema>

const STATE_RANK: Record<MasteryState, number> = {
  not_started: 0,
  introduced: 1,
  practising: 2,
  demonstrated: 3,
  retained: 4,
}

export function evaluateAssessment(
  competencyId: string,
  previousState: MasteryState,
  records: EvidenceRecord[],
  rule: AssessmentRuleVersion,
  evaluatedAt: string,
): AssessmentResult {
  const accepted = records
    .filter((record) => !record.voided
      && record.competencyIds.includes(competencyId)
      && rule.acceptedEvidenceKinds.includes(record.kind)
      && record.score >= rule.minimumScore)
    .sort((left, right) => left.id.localeCompare(right.id))
  const sessions = new Set(accepted.map(({ sessionId }) => sessionId))
  const times = accepted.map(({ occurredAt }) => Date.parse(occurredAt)).filter(Number.isFinite).sort((a, b) => a - b)
  const spanDays = times.length > 1 ? (times[times.length - 1] - times[0]) / 86_400_000 : 0
  const passed = accepted.length >= rule.minimumEvidence
    && sessions.size >= rule.minimumDistinctSessions
    && spanDays >= rule.minimumSpanDays
  const resultingState = passed && STATE_RANK[rule.targetState] > STATE_RANK[previousState]
    ? rule.targetState
    : previousState
  const inputFingerprint = stableFingerprint({
    competencyId,
    previousState,
    rule,
    evidence: accepted.map(({ id, payloadFingerprint, score, sessionId, occurredAt }) => ({ id, payloadFingerprint, score, sessionId, occurredAt })),
  })
  return {
    id: `assessment:${inputFingerprint.slice('fnv1a64:'.length)}`,
    competencyId,
    ruleId: rule.id,
    ruleVersion: rule.version,
    previousState,
    resultingState,
    passed,
    evidenceIds: accepted.map(({ id }) => id),
    evaluatedAt,
    explanation: `${rule.explanationTemplate} Evidencias válidas: ${accepted.length}/${rule.minimumEvidence}; sesiones: ${sessions.size}/${rule.minimumDistinctSessions}; intervalo: ${spanDays}/${rule.minimumSpanDays} días.`,
    inputFingerprint,
  }
}
