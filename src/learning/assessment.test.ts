import { describe, expect, it } from 'vitest'
import {
  LearningEventSchema,
  LearningSessionSchema,
  evaluateAssessment,
  type AssessmentRuleVersion,
  type EvidenceRecord,
} from './assessment'

const rule: AssessmentRuleVersion = {
  id: 'retention-rule',
  version: '1.0.0',
  targetState: 'retained',
  acceptedEvidenceKinds: ['procedure', 'human-review'],
  minimumEvidence: 2,
  minimumScore: 0.8,
  minimumDistinctSessions: 2,
  minimumSpanDays: 7,
  explanationTemplate: 'Retención reproducible.',
}

const evidence: EvidenceRecord[] = [
  {
    id: 'evidence-b', competencyIds: ['competency-1'], sessionId: 'session-2', kind: 'human-review', score: 0.9,
    occurredAt: '2026-07-10T09:00:00.000Z', payloadFingerprint: 'payload-b', sourceEventIds: [], claimIds: [], voided: false,
  },
  {
    id: 'evidence-a', competencyIds: ['competency-1'], sessionId: 'session-1', kind: 'procedure', score: 1,
    occurredAt: '2026-07-01T09:00:00.000Z', payloadFingerprint: 'payload-a', sourceEventIds: [], claimIds: [], voided: false,
  },
]

describe('evidence-based assessment', () => {
  it('is deterministic, ordered and explainable', () => {
    const first = evaluateAssessment('competency-1', 'demonstrated', evidence, rule, '2026-07-22T09:00:00.000Z')
    const second = evaluateAssessment('competency-1', 'demonstrated', [...evidence].reverse(), rule, '2026-07-22T09:00:00.000Z')
    expect(first).toEqual(second)
    expect(first.resultingState).toBe('retained')
    expect(first.evidenceIds).toEqual(['evidence-a', 'evidence-b'])
    expect(first.explanation).toContain('2/2')
  })

  it('does not turn activity completion into mastery', () => {
    expect(LearningEventSchema.safeParse({
      id: 'event-1', sessionId: 'session-1', at: '2026-07-22T09:00:00.000Z', eventType: 'activity-completed',
    }).success).toBe(true)
    const result = evaluateAssessment('competency-1', 'introduced', [], rule, '2026-07-22T09:00:00.000Z')
    expect(result.passed).toBe(false)
    expect(result.resultingState).toBe('introduced')
  })

  it('pins every reproducibility input in a session', () => {
    const parsed = LearningSessionSchema.parse({
      id: 'session-1',
      package: { id: 'pack-1', version: '1.2.3' },
      activity: { id: 'activity-1', version: '2.0.0' },
      rubric: { id: 'rubric-1', version: '3.0.0' },
      reference: { kind: 'project', projectId: 'project-1' },
      initialFingerprint: 'fnv1a64:abc',
      availableCapabilities: ['canonical-selectors-v1'],
      reversibleState: {},
      startedAt: '2026-07-22T09:00:00.000Z',
    })
    expect(parsed.package.version).toBe('1.2.3')
    expect(parsed.activity.version).toBe('2.0.0')
    expect(parsed.rubric.version).toBe('3.0.0')
    expect(parsed.initialFingerprint).toBe('fnv1a64:abc')
  })
})
