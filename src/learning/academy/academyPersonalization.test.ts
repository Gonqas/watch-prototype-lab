import { describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../application/service'
import type { LearningMasteryProjection, PersistentEvidenceRecord } from '../persistence/models'
import { evidenceFixture, profileFixture, sessionFixture } from '../persistence/testFixtures'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../product/integratedContent'
import { buildAcademyLearnerModel } from './academyPersonalization'
import { academyStudyPlan } from './academyStudyPlan'

const now = '2026-08-09T10:00:00.000Z'

function page<T>(items: T[]) {
  return { items, offset: 0, limit: 500, total: items.length }
}

function snapshot(input: {
  evidence?: PersistentEvidenceRecord[]
  mastery?: LearningMasteryProjection[]
  sessions?: LearningApplicationSnapshot['sessions']['items']
} = {}): LearningApplicationSnapshot {
  const profile = profileFixture()
  return {
    status: 'ready',
    backend: 'memory',
    location: { surface: 'home', query: {} },
    profile,
    profiles: [profile],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX,
    sessions: page(input.sessions ?? []),
    evidence: page(input.evidence ?? []),
    assessments: page([]),
    mastery: page(input.mastery ?? []),
    packages: page([]),
    backups: [],
    recovery: {},
    notifications: [],
    recommendations: [],
    filters: {
      search: '', difficulty: '', type: '', movement: '', family: '', subsystem: '',
      competency: '', mastery: '', capability: '', language: '', offline: '', installed: '', compatible: '',
    },
    selectedSessionEvents: page([]),
    performance: [],
    online: false,
  }
}

function misconceptionEvidence(correct: boolean, observedAt: string, id: string): PersistentEvidenceRecord {
  const activity = INTEGRATED_LEARNING_PRODUCT_INDEX.activities.find(({ feedbackContract }) =>
    (feedbackContract?.misconceptionIds.length ?? 0) > 0)!
  return {
    ...evidenceFixture(id, `session.${id}`),
    competencyId: activity.competencyIds[0],
    activityId: activity.id,
    content: {
      evaluation: { correct, complete: true, pendingReview: false },
      hintEventIds: correct ? [] : ['event.hint'],
    },
    observedAt,
    createdAt: observedAt,
    hash: `sha256:${(correct ? 'c' : 'd').repeat(64)}`,
  }
}

describe('Academy P2 personalization', () => {
  it('keeps an incorrect conception active until later correct evidence repairs it', () => {
    const incorrect = misconceptionEvidence(false, '2026-08-01T10:00:00.000Z', 'evidence.incorrect')
    const active = buildAcademyLearnerModel(snapshot({ evidence: [incorrect] }), now)
    expect(active.activeMisconceptions.length).toBeGreaterThan(0)
    expect(active.summary.activeMisconceptions).toBe(active.activeMisconceptions.length)
    expect(active.concepts.some(({ activeMisconceptionIds }) => activeMisconceptionIds.length > 0)).toBe(true)

    const corrected = misconceptionEvidence(true, '2026-08-02T10:00:00.000Z', 'evidence.corrected')
    const repaired = buildAcademyLearnerModel(snapshot({ evidence: [incorrect, corrected] }), now)
    expect(repaired.activeMisconceptions).toHaveLength(0)
  })

  it('prioritizes remediation over ordinary curriculum progression', () => {
    const incorrect = misconceptionEvidence(false, '2026-08-01T10:00:00.000Z', 'evidence.incorrect')
    const plan = academyStudyPlan(snapshot({ evidence: [incorrect] }), undefined, now)
    expect(plan[0]).toMatchObject({ kind: 'remediate-misconception', basis: 'misconception', priority: 95 })
    expect(plan[0].href).toContain('/learning/lesson/')
  })

  it('prescribes transfer after demonstration without claiming it from the first context', () => {
    const activity = INTEGRATED_LEARNING_PRODUCT_INDEX.activities.find(({ demo, competencyIds }) =>
      !demo && competencyIds.length > 0)!
    const mastery: LearningMasteryProjection = {
      schemaVersion: 1,
      profileId: 'profile.local-default',
      competencyId: activity.competencyIds[0],
      state: 'demonstrated',
      strength: 1,
      primaryEvidenceIds: ['evidence.demonstration'],
      latestValidEvidenceAt: '2026-08-01T10:00:00.000Z',
      latestDemonstratedAt: '2026-08-01T10:00:00.000Z',
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reasons: ['Demostración inicial.'],
      projectorVersion: '1.1.0',
      calculatedAt: now,
    }
    const plan = academyStudyPlan(snapshot({ mastery: [mastery] }), undefined, now)
    const transfer = plan.find(({ kind }) => kind === 'transfer-competency')
    expect(transfer).toBeDefined()
    expect(transfer?.href).toContain('mode=transfer')
    expect(transfer?.reason).toContain('otro contexto')
  })

  it('reports attempts, independent evidence and review debt without a global grade', () => {
    const activity = INTEGRATED_LEARNING_PRODUCT_INDEX.activities.find(({ demo }) => !demo)!
    const evidence = {
      ...evidenceFixture('evidence.independent'),
      competencyId: activity.competencyIds[0],
      activityId: activity.id,
      content: { evaluation: { correct: true }, hintEventIds: [] },
    }
    const session = {
      ...sessionFixture('session.completed'),
      activityId: activity.id,
      state: 'completed' as const,
      completedAt: '2026-08-01T11:00:00.000Z',
    }
    const model = buildAcademyLearnerModel(snapshot({ evidence: [evidence], sessions: [session] }), now)
    expect(model.summary).toMatchObject({ completedSessions: 1, activeDays: 1, independentEvidence: 1 })
    expect(model.concepts.some(({ completedAttempts }) => completedAttempts === 1)).toBe(true)
  })
})
