import { describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../application/service'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../product/integratedContent'
import { createDefaultAcademyLocalState } from './academyLocalState'
import {
  academyMilestoneJourney,
  contextualTutorGuidance,
  contextualTutorResponse,
  personalizedStartingPoint,
  projectConceptKnowledge,
} from './academyPedagogy'

const now = '2026-07-29T08:00:00.000Z'

function snapshot(
  patch: Partial<Pick<LearningApplicationSnapshot, 'sessions' | 'mastery'>> = {},
): LearningApplicationSnapshot {
  return {
    status: 'ready',
    backend: 'memory',
    location: { surface: 'home', query: {} },
    profiles: [],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX,
    sessions: patch.sessions ?? { items: [], offset: 0, limit: 40, total: 0 },
    evidence: { items: [], offset: 0, limit: 40, total: 0 },
    assessments: { items: [], offset: 0, limit: 40, total: 0 },
    mastery: patch.mastery ?? { items: [], offset: 0, limit: 40, total: 0 },
    packages: { items: [], offset: 0, limit: 40, total: 0 },
    backups: [],
    recovery: {},
    notifications: [],
    recommendations: [],
    filters: {
      search: '',
      difficulty: '',
      type: '',
      movement: '',
      family: '',
      subsystem: '',
      competency: '',
      mastery: '',
      capability: '',
      language: '',
      offline: '',
      installed: '',
      compatible: '',
    },
    selectedSessionEvents: { items: [], offset: 0, limit: 40, total: 0 },
    performance: [],
    online: false,
  }
}

describe('Academy gold-standard pedagogy', () => {
  it('keeps self-reported familiarity separate from evidence-backed mastery', () => {
    const base = snapshot()
    const quartz = base.product.knowledgeNodes.find(({ id }) => id === 'concept.horology.quartz-chain')!
    const onboarding = createDefaultAcademyLocalState('profile.local', now).onboarding
    onboarding.completed = true
    onboarding.quartzKnowledge = 'practical'

    expect(projectConceptKnowledge(base, quartz, onboarding)).toMatchObject({
      status: 'self-declared',
      basis: 'self-report',
      evidenceIds: [],
    })

    const competencyId = quartz.competencyIds[0]
    const withEvidence = snapshot({
      mastery: {
        items: [{
          schemaVersion: 1,
          profileId: 'profile.local',
          competencyId,
          state: 'demonstrated',
          strength: 1,
          primaryEvidenceIds: ['evidence.one'],
          retentionEvidenceIds: [],
          reasons: ['Demostración independiente.'],
          projectorVersion: '1.1.0',
          calculatedAt: now,
        }],
        offset: 0,
        limit: 40,
        total: 1,
      },
    })
    expect(projectConceptKnowledge(withEvidence, quartz, onboarding)).toMatchObject({
      status: 'demonstrated',
      basis: 'evidence',
      evidenceIds: ['evidence.one'],
    })
  })

  it('uses onboarding to adapt the plan without skipping prerequisite teaching', () => {
    const state = createDefaultAcademyLocalState('profile.local', now)
    state.onboarding.completed = true
    state.onboarding.experience = 'quartz-practice'
    state.onboarding.quartzKnowledge = 'practical'

    const result = personalizedStartingPoint(snapshot(), state)
    expect(result.href).toContain('/learning/lesson/')
    expect(result.basis).toBe('self-report')
    expect(result.actionLabel).toBe('Aprender antes de responder')
    expect(result.caution).toContain('no acreditan dominio')
  })

  it('orders the foundation route as ten evidence-bearing milestones', () => {
    const base = snapshot()
    const route = base.product.routes.find(({ id }) => id === 'route.horology.orientation')!
    const journey = academyMilestoneJourney(base, route)

    expect(journey).toHaveLength(10)
    expect(journey[0]).toMatchObject({ order: 1, status: 'current' })
    expect(journey[1].status).toBe('locked')
    expect(new Set(journey.map(({ activityId }) => activityId)).size).toBe(10)
  })

  it('exposes bounded guidance and only reveals misconception repair after an incorrect attempt', () => {
    const base = snapshot()
    const activity = base.product.activities.find(({ id }) => id === 'activity.horology.classify-subsystems')!
    const tutor = contextualTutorGuidance(base, activity)
    const repair = contextualTutorGuidance(base, activity, { attempts: 1, hasIncorrectAnswer: true })

    expect(tutor?.boundary).toContain('No evalúa')
    expect(tutor?.prompts.length).toBeGreaterThan(2)
    expect(tutor?.misconception).toBeUndefined()
    expect(repair?.phase).toBe('repair')
    expect(repair?.misconception?.remediationHref).toContain('/learning/lesson/')
  })

  it('answers every contextual action deterministically and preserves declared boundaries', () => {
    const base = snapshot()
    const activity = base.product.activities.find(({ id }) => id === 'activity.horology.classify-subsystems')!
    const actions = [
      'explain-selection',
      'compare',
      'ask-question',
      'give-hint',
      'request-check',
      'identify-missing-data',
    ] as const
    const responses = actions.map((action) => contextualTutorResponse(base, activity, action, {
      attempts: 1,
      selectedEntityLabel: 'tren de ruedas',
      sourceLabels: ['manual declarado'],
      unknownData: ['No consta una dimensión oficial para esta representación.'],
    }))

    expect(responses).toHaveLength(6)
    expect(responses.every(({ answer, followUp, boundary }) => answer.length > 20 && followUp.length > 10 && boundary.length > 20)).toBe(true)
    expect(responses.every(({ boundary }) => /no (eval|ampl)/i.test(boundary))).toBe(true)
    expect(responses.find(({ action }) => action === 'identify-missing-data')?.evidenceChips.some(({ kind }) => kind === 'unknown')).toBe(true)
    expect(contextualTutorResponse(base, activity, 'give-hint', { attempts: 0 }).title).toBe('Primero deja una predicción')
    expect(contextualTutorResponse(base, activity, 'give-hint', { attempts: 1 }).title).toBe('Pista acotada')
  })
})
