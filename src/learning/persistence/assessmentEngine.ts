import { z } from 'zod'
import type { MasteryState } from '../assessment'
import { fingerprintAssessmentInputs } from './fingerprints'
import type { PersistentAssessment, PersistentEvidenceRecord } from './models'
import type { LearningRepository } from './repository'

const comparison = z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte'])
const filter = z.object({
  evidenceType: z.string().optional(),
  status: z.enum(['active', 'superseded', 'invalidated']).optional(),
  minimumConfidence: z.number().min(0).max(1).optional(),
}).strict()

export type AssessmentCondition =
  | { op: 'all'; conditions: AssessmentCondition[] }
  | { op: 'any'; conditions: AssessmentCondition[] }
  | { op: 'not'; condition: AssessmentCondition }
  | { op: 'in-session'; sessionId: string; condition: AssessmentCondition }
  | { op: 'exists'; filter: z.infer<typeof filter> }
  | { op: 'count'; filter: z.infer<typeof filter>; compare: z.infer<typeof comparison>; value: number }
  | { op: 'compare'; metric: 'average-confidence' | 'distinct-sessions' | 'hint-count'; compare: z.infer<typeof comparison>; value: number }
  | { op: 'within'; days: number }
  | { op: 'sequence'; evidenceTypes: string[] }
  | { op: 'weighted'; threshold: number; components: Array<{ weight: number; condition: AssessmentCondition }> }
  | { op: 'minimum-evidence'; count: number }
  | { op: 'independent-later-evidence'; minimumDays: number; differentSession: boolean }
  | { op: 'evidence-from-session'; sessionId: string; minimumCount: number }
  | { op: 'session-without-hints'; sessionId: string }

export const AssessmentConditionSchema: z.ZodType<AssessmentCondition> = z.lazy(() => z.discriminatedUnion('op', [
  z.object({ op: z.literal('all'), conditions: z.array(AssessmentConditionSchema).min(1).max(50) }).strict(),
  z.object({ op: z.literal('any'), conditions: z.array(AssessmentConditionSchema).min(1).max(50) }).strict(),
  z.object({ op: z.literal('not'), condition: AssessmentConditionSchema }).strict(),
  z.object({ op: z.literal('in-session'), sessionId: z.string().min(1).max(200), condition: AssessmentConditionSchema }).strict(),
  z.object({ op: z.literal('exists'), filter }).strict(),
  z.object({ op: z.literal('count'), filter, compare: comparison, value: z.number().nonnegative() }).strict(),
  z.object({ op: z.literal('compare'), metric: z.enum(['average-confidence', 'distinct-sessions', 'hint-count']), compare: comparison, value: z.number().nonnegative() }).strict(),
  z.object({ op: z.literal('within'), days: z.number().nonnegative() }).strict(),
  z.object({ op: z.literal('sequence'), evidenceTypes: z.array(z.string().min(1)).min(2).max(20) }).strict(),
  z.object({ op: z.literal('weighted'), threshold: z.number().min(0).max(1), components: z.array(z.object({ weight: z.number().positive(), condition: AssessmentConditionSchema }).strict()).min(1).max(20) }).strict(),
  z.object({ op: z.literal('minimum-evidence'), count: z.number().int().positive() }).strict(),
  z.object({ op: z.literal('independent-later-evidence'), minimumDays: z.number().nonnegative(), differentSession: z.boolean() }).strict(),
  z.object({ op: z.literal('evidence-from-session'), sessionId: z.string().min(1).max(200), minimumCount: z.number().int().positive() }).strict(),
  z.object({ op: z.literal('session-without-hints'), sessionId: z.string().min(1).max(200) }).strict(),
]))

/**
 * Conserva la parte de una rúbrica que puede resolverse dentro de un único
 * intento. Las ventanas temporales y el número de sesiones pertenecen a la
 * progresión histórica; volver a exigirlas dentro de `in-session` haría
 * imposible una demostración independiente legítima.
 */
export function assessmentConditionForSingleAttempt(
  condition: AssessmentCondition,
): AssessmentCondition | undefined {
  if (condition.op === 'compare' && condition.metric === 'distinct-sessions') return undefined
  if (
    condition.op === 'within'
    || condition.op === 'independent-later-evidence'
    || condition.op === 'evidence-from-session'
    || condition.op === 'session-without-hints'
    || condition.op === 'in-session'
  ) return undefined
  if (condition.op === 'not') {
    const child = assessmentConditionForSingleAttempt(condition.condition)
    return child ? { ...condition, condition: child } : undefined
  }
  if (condition.op === 'all' || condition.op === 'any') {
    const conditions = condition.conditions.flatMap((child) => {
      const scoped = assessmentConditionForSingleAttempt(child)
      return scoped ? [scoped] : []
    })
    if (conditions.length === 0) return undefined
    if (conditions.length === 1) return conditions[0]
    return { ...condition, conditions }
  }
  if (condition.op === 'weighted') {
    const components = condition.components.flatMap(({ weight, condition: child }) => {
      const scoped = assessmentConditionForSingleAttempt(child)
      return scoped ? [{ weight, condition: scoped }] : []
    })
    return components.length > 0 ? { ...condition, components } : undefined
  }
  // A demonstration is already gated by a previous practising projection. A
  // repeated-evidence threshold in the authored rubric therefore describes
  // the learning history, not several copies of the same answer inside the
  // independent attempt. Keep the evidence filter (and thus correctness and
  // confidence requirements), but require one valid observation now. Authors
  // that genuinely need several actions in one attempt can still express that
  // explicitly with `sequence`.
  if (condition.op === 'count' && condition.value > 1) {
    if (condition.compare === 'gte') return { ...condition, value: 1 }
    if (condition.compare === 'gt') return { ...condition, value: 0 }
    if (condition.compare === 'eq') return { ...condition, value: 1 }
  }
  if (condition.op === 'minimum-evidence' && condition.count > 1) {
    return { ...condition, count: 1 }
  }
  return structuredClone(condition)
}

export interface CompositeAssessmentRule {
  id: string
  version: string
  competencyId: string
  targetState: Exclude<MasteryState, 'not_started'>
  condition: AssessmentCondition
}

export const CompositeAssessmentRuleSchema: z.ZodType<CompositeAssessmentRule> = z.object({
  id: z.string().min(1).max(160),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  competencyId: z.string().min(1).max(160),
  targetState: z.enum(['introduced', 'practising', 'demonstrated', 'retained']),
  condition: AssessmentConditionSchema,
}).strict()

export interface ConditionTrace {
  id: string
  passed: boolean
  detail: string
}

interface EvaluationContext {
  evidence: PersistentEvidenceRecord[]
}

function compare(left: number, operator: z.infer<typeof comparison>, right: number): boolean {
  if (operator === 'eq') return left === right
  if (operator === 'ne') return left !== right
  if (operator === 'gt') return left > right
  if (operator === 'gte') return left >= right
  if (operator === 'lt') return left < right
  return left <= right
}

function filterEvidence(values: PersistentEvidenceRecord[], constraint: z.infer<typeof filter>): PersistentEvidenceRecord[] {
  return values.filter((record) =>
    (!constraint.evidenceType || record.evidenceType === constraint.evidenceType)
    && (!constraint.status || record.status === constraint.status)
    && (constraint.minimumConfidence === undefined || record.confidence >= constraint.minimumConfidence))
}

function educationalEvaluation(record: PersistentEvidenceRecord): Record<string, unknown> | undefined {
  const value = record.content.evaluation
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function educationalExclusionReason(record: PersistentEvidenceRecord): string | undefined {
  const evaluation = educationalEvaluation(record)
  if (!evaluation) return undefined
  if (evaluation.pendingReview === true) return 'Respuesta pendiente de una revisión explícita; no se usa para acreditar dominio automáticamente.'
  if (evaluation.complete === false) return 'Respuesta incompleta.'
  if (evaluation.correct === false) return 'Respuesta incorrecta conservada como evidencia parcial.'
  return undefined
}

function positiveRetentionConditions(condition: AssessmentCondition): AssessmentCondition[] {
  if (condition.op === 'independent-later-evidence') {
    return condition.minimumDays > 0 && condition.differentSession ? [condition] : []
  }
  if (condition.op === 'all' || condition.op === 'any') {
    return condition.conditions.flatMap(positiveRetentionConditions)
  }
  if (condition.op === 'weighted') {
    return condition.components.flatMap(({ condition: child }) => positiveRetentionConditions(child))
  }
  return []
}

function evaluateCondition(condition: AssessmentCondition, context: EvaluationContext, path = 'root'): { passed: boolean; traces: ConditionTrace[]; score: number } {
  if (condition.op === 'all' || condition.op === 'any') {
    const children = condition.conditions.map((child, index) => evaluateCondition(child, context, `${path}.${index}`))
    const passed = condition.op === 'all' ? children.every(({ passed: value }) => value) : children.some(({ passed: value }) => value)
    return { passed, score: children.reduce((sum, child) => sum + child.score, 0) / children.length, traces: [{ id: path, passed, detail: condition.op }, ...children.flatMap(({ traces }) => traces)] }
  }
  if (condition.op === 'not') {
    const child = evaluateCondition(condition.condition, context, `${path}.not`)
    return { passed: !child.passed, score: 1 - child.score, traces: [{ id: path, passed: !child.passed, detail: 'not' }, ...child.traces] }
  }
  if (condition.op === 'in-session') {
    const evidence = context.evidence.filter(({ sessionId }) => sessionId === condition.sessionId)
    const child = evaluateCondition(condition.condition, { evidence }, `${path}.session`)
    return {
      passed: child.passed,
      score: child.score,
      traces: [{
        id: path,
        passed: child.passed,
        detail: `session ${condition.sessionId} scoped evidence ${evidence.length}`,
      }, ...child.traces],
    }
  }
  if (condition.op === 'weighted') {
    const children = condition.components.map(({ condition: child, weight }, index) => ({ weight, result: evaluateCondition(child, context, `${path}.${index}`) }))
    const total = children.reduce((sum, child) => sum + child.weight, 0)
    const score = children.reduce((sum, child) => sum + child.result.score * child.weight, 0) / total
    const passed = score >= condition.threshold
    return { passed, score, traces: [{ id: path, passed, detail: `weighted ${score}/${condition.threshold}` }, ...children.flatMap(({ result }) => result.traces)] }
  }
  let passed = false
  let detail: string = condition.op
  if (condition.op === 'exists') passed = filterEvidence(context.evidence, condition.filter).length > 0
  else if (condition.op === 'count') {
    const count = filterEvidence(context.evidence, condition.filter).length
    passed = compare(count, condition.compare, condition.value)
    detail = `count ${count} ${condition.compare} ${condition.value}`
  } else if (condition.op === 'compare') {
    const value = condition.metric === 'average-confidence'
      ? context.evidence.reduce((sum, record) => sum + record.confidence, 0) / Math.max(1, context.evidence.length)
      : condition.metric === 'distinct-sessions'
        ? new Set(context.evidence.map(({ sessionId }) => sessionId)).size
        : context.evidence.reduce((sum, record) => sum + (Array.isArray(record.content.hintEventIds) ? record.content.hintEventIds.length : 0), 0)
    passed = compare(value, condition.compare, condition.value)
    detail = `${condition.metric} ${value} ${condition.compare} ${condition.value}`
  } else if (condition.op === 'within') {
    const times = context.evidence.map(({ observedAt }) => Date.parse(observedAt)).sort((a, b) => a - b)
    const span = times.length < 2 ? 0 : (times.at(-1)! - times[0]) / 86_400_000
    passed = times.length > 0 && span <= condition.days
    detail = `span ${span} <= ${condition.days}`
  } else if (condition.op === 'sequence') {
    let cursor = 0
    for (const record of context.evidence) if (record.evidenceType === condition.evidenceTypes[cursor]) cursor += 1
    passed = cursor === condition.evidenceTypes.length
    detail = `sequence ${cursor}/${condition.evidenceTypes.length}`
  } else if (condition.op === 'minimum-evidence') {
    passed = context.evidence.length >= condition.count
    detail = `minimum ${context.evidence.length}/${condition.count}`
  } else if (condition.op === 'independent-later-evidence') {
    const ordered = [...context.evidence].sort((left, right) => left.observedAt.localeCompare(right.observedAt))
    const first = ordered[0]
    const later = ordered.find((record) => {
      if (!first || record.id === first.id) return false
      const days = (Date.parse(record.observedAt) - Date.parse(first.observedAt)) / 86_400_000
      return days >= condition.minimumDays && (!condition.differentSession || record.sessionId !== first.sessionId)
    })
    passed = Boolean(later)
    detail = `independent later evidence ${passed}`
  } else if (condition.op === 'evidence-from-session') {
    const count = context.evidence.filter(({ sessionId }) => sessionId === condition.sessionId).length
    passed = count >= condition.minimumCount
    detail = `session ${condition.sessionId} evidence ${count}/${condition.minimumCount}`
  } else if (condition.op === 'session-without-hints') {
    const fromSession = context.evidence.filter(({ sessionId }) => sessionId === condition.sessionId)
    const hintCount = fromSession.reduce((sum, record) =>
      sum + (Array.isArray(record.content.hintEventIds) ? record.content.hintEventIds.length : 0), 0)
    passed = fromSession.length > 0 && hintCount === 0
    detail = `session ${condition.sessionId} independent evidence ${fromSession.length}; hints ${hintCount}`
  }
  return { passed, score: passed ? 1 : 0, traces: [{ id: path, passed, detail }] }
}

export class AssessmentEngine {
  private readonly repository: LearningRepository
  private readonly now: () => string

  constructor(repository: LearningRepository, now: () => string = () => new Date().toISOString()) {
    this.repository = repository
    this.now = now
  }

  async evaluate(profileId: string, ruleInput: CompositeAssessmentRule, projection: 'historical' | 'current' = 'historical'): Promise<PersistentAssessment> {
    const rule = { ...ruleInput, condition: AssessmentConditionSchema.parse(ruleInput.condition) }
    const all = (await this.repository.listEvidence(profileId, rule.competencyId, { limit: 500 })).items
    const markerTargets = new Set(all.filter(({ status }) => status !== 'active').map(({ relatedEvidenceId }) => relatedEvidenceId).filter(Boolean))
    const activeCandidates = all.filter((record) => record.status === 'active' && !markerTargets.has(record.id))
    const accepted = activeCandidates.filter((record) => !educationalExclusionReason(record))
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt) || left.id.localeCompare(right.id))
    const ignored = all.filter((record) => !accepted.some(({ id }) => id === record.id))
    const evaluated = evaluateCondition(rule.condition, { evidence: accepted })
    const retentionConditions = rule.targetState === 'retained'
      ? positiveRetentionConditions(rule.condition)
      : []
    const retentionPassed = rule.targetState !== 'retained'
      || (
        retentionConditions.length > 0
        && retentionConditions.some((condition) => evaluateCondition(condition, { evidence: accepted }).passed)
      )
    const retentionTrace: ConditionTrace[] = rule.targetState === 'retained'
      ? [{
        id: 'retention.guard',
        passed: retentionPassed,
        detail: retentionPassed
          ? 'retention requires independent evidence from a later session and a positive time interval'
          : 'retention blocked: no valid independent later-session evidence with a positive interval',
      }]
      : []
    const traces = [...evaluated.traces, ...retentionTrace]
    const passed = evaluated.passed && retentionPassed
    const inputHash = await fingerprintAssessmentInputs({ rule, evidence: accepted.map(({ id, hash }) => ({ id, hash })) })
    const evaluatedAt = this.now()
    const assessmentIdHash = await fingerprintAssessmentInputs({ inputHash, projection, evaluatedAt })
    const result: PersistentAssessment = {
      schemaVersion: 1,
      id: `assessment.${assessmentIdHash.slice(7, 31)}`,
      profileId,
      evidenceIds: accepted.map(({ id }) => id),
      competencyId: rule.competencyId,
      ruleId: rule.id,
      ruleVersion: rule.version,
      algorithm: 'composite-rubric-dsl',
      algorithmVersion: '1.1.0',
      result: {
        passed,
        resultingState: passed ? rule.targetState : accepted.length > 0 ? 'practising' : 'not_started',
        score: passed ? evaluated.score : Math.min(evaluated.score, 0.5),
      },
      explanation: {
        satisfiedRuleIds: traces.filter(({ passed: value }) => value).map(({ id }) => id),
        unsatisfiedRuleIds: traces.filter(({ passed: value }) => !value).map(({ id }) => id),
        ignoredEvidence: ignored.map((record) => ({
          evidenceId: record.id,
          reason: educationalExclusionReason(record) ?? `Estado ${record.status} o revision posterior.`,
        })),
        summary: traces.map(({ detail }) => detail).join('; '),
      },
      recommendations: passed ? [] : ['Reunir evidencia adicional que satisfaga las reglas no cumplidas.'],
      evaluatedAt,
      projection,
      inputHash,
    }
    await this.repository.addAssessment(result)
    return result
  }
}
