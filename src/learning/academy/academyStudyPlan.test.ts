import { describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../application/service'
import type { LearningMasteryProjection } from '../persistence/models'
import { evidenceFixture, profileFixture, sessionFixture } from '../persistence/testFixtures'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../product/integratedContent'
import { academyRequiredActivityIds } from './academyCatalog'
import { createDefaultAcademyLocalState } from './academyLocalState'
import {
  academyOnboardingTargetRouteIds,
  academyStudyPlan,
} from './academyStudyPlan'

const now = '2026-08-11T10:00:00.000Z'

function page<T>(items: T[]) {
  return { items, offset: 0, limit: 500, total: items.length }
}

function snapshot(): LearningApplicationSnapshot {
  const profile = profileFixture()
  return {
    status: 'ready',
    backend: 'memory',
    location: { surface: 'home', query: {} },
    profile,
    profiles: [profile],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX,
    sessions: page([]),
    evidence: page([]),
    assessments: page([]),
    mastery: page([]),
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

function completeOrientation(value: LearningApplicationSnapshot): void {
  const ids = academyRequiredActivityIds(value.product, 'route.horology.orientation')
  const activities = ids.map((activityId) => value.product.activities.find(({ id }) => id === activityId)!)
  value.sessions = page(activities.map((activity, index) => ({
    ...sessionFixture(`session.orientation.${index}`),
    packageId: activity.packageId,
    packageVersion: activity.packageVersion,
    lessonId: activity.lessonId,
    activityId: activity.id,
    rubricId: activity.rubricId,
    state: 'completed' as const,
    completedAt: now,
    updatedAt: now,
  })))
  value.evidence = page(activities.map((activity, index) => ({
    ...evidenceFixture(`evidence.orientation.${index}`, `session.orientation.${index}`),
    activityId: activity.id,
    competencyId: activity.competencyIds[0],
    observedAt: now,
    createdAt: now,
  })))
  value.assessments = page(activities.map((activity, index) => ({
    schemaVersion: 1 as const,
    id: `assessment.orientation.${index}`,
    profileId: 'profile.local-default',
    evidenceIds: [`evidence.orientation.${index}`],
    competencyId: activity.competencyIds[0],
    ruleId: `rule.orientation.${index}.transfer`,
    ruleVersion: '1.0.0',
    algorithm: 'test',
    algorithmVersion: '1.0.0',
    result: { passed: true, resultingState: 'demonstrated' as const, score: 1 },
    explanation: { satisfiedRuleIds: ['rule.test'], unsatisfiedRuleIds: [], ignoredEvidence: [], summary: 'Superada.' },
    recommendations: [],
    evaluatedAt: now,
    projection: 'historical' as const,
    inputHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
  })))
}

describe('plan de estudio canónico y personalizado', () => {
  it('mantiene orientación como entrada absoluta incluso con experiencia avanzada', () => {
    const state = createDefaultAcademyLocalState('profile.local-default', now)
    state.onboarding.completed = true
    state.onboarding.experience = 'advanced'
    state.onboarding.mechanicalKnowledge = 'practical'
    state.onboarding.tools = ['Lupa', 'Pinzas', 'Destornilladores', 'Portamovimiento']
    state.onboarding.goals = ['Diseñar mi propio reloj']

    const primary = academyStudyPlan(snapshot(), state, now)[0]
    expect(primary).toMatchObject({ routeId: 'route.horology.orientation', basis: 'self-report' })
    expect(primary.reason).toContain('no salta los prerrequisitos')
  })

  it('convierte objetivos y experiencia en destinos sin convertirlos en dominio', () => {
    const state = createDefaultAcademyLocalState('profile.local-default', now)
    state.onboarding.completed = true
    state.onboarding.experience = 'quartz-practice'
    state.onboarding.quartzKnowledge = 'practical'
    state.onboarding.goals = ['Comparar calibres documentados']

    expect(academyOnboardingTargetRouteIds(state.onboarding)).toEqual([
      'route.advanced.comparative-atlas',
      'route.quartz2035.isa-to-2035',
    ])
    const primary = academyStudyPlan(snapshot(), state, now)[0]
    expect(primary.routeId).toBe('route.horology.orientation')
  })

  it('adapta la recomendación al equipo disponible sin saltar la base de banco', () => {
    const withoutTools = createDefaultAcademyLocalState('profile.local-default', now)
    withoutTools.onboarding.completed = true
    const noToolsSnapshot = snapshot()
    completeOrientation(noToolsSnapshot)

    const withTools = createDefaultAcademyLocalState('profile.local-default', now)
    withTools.onboarding.completed = true
    withTools.onboarding.tools = ['Lupa', 'Pinzas', 'Destornilladores', 'Portamovimiento']
    const toolsSnapshot = snapshot()
    completeOrientation(toolsSnapshot)

    const withoutToolsPlan = academyStudyPlan(noToolsSnapshot, withoutTools, now)[0]
    const withToolsPlan = academyStudyPlan(toolsSnapshot, withTools, now)[0]

    expect(withoutToolsPlan.routeId).toBe('route.horology.bench-foundations')
    expect(withToolsPlan.routeId).toBe('route.horology.bench-foundations')
    expect(withoutToolsPlan.reason).toContain('No has declarado herramientas')
    expect(withToolsPlan.reason).toContain('Tienes 4 herramienta(s)')
  })

  it('ofrece una ampliación solo cuando el objetivo personal la pide', () => {
    const base = snapshot()
    completeOrientation(base)
    const defaultState = createDefaultAcademyLocalState('profile.local-default', now)
    defaultState.onboarding.completed = true
    defaultState.onboarding.tools = ['Lupa']
    expect(academyStudyPlan(base, defaultState, now)[0].routeId).not.toBe('route.encyclopedia.history-language')

    const historyState = structuredClone(defaultState)
    historyState.onboarding.goals = ['Reconocer piezas y relaciones']
    expect(academyStudyPlan(base, historyState, now)[0].routeId).toBe('route.encyclopedia.history-language')
  })

  it('hace visible el presupuesto de tiempo sin saltar la unidad requerida', () => {
    const value = snapshot()
    const short = createDefaultAcademyLocalState('profile.local-default', now)
    short.onboarding.completed = true
    short.onboarding.sessionMinutes = 15
    const long = structuredClone(short)
    long.onboarding.sessionMinutes = 60

    const shortPlan = academyStudyPlan(value, short, now)[0]
    const longPlan = academyStudyPlan(value, long, now)[0]
    expect(shortPlan.routeId).toBe('route.horology.orientation')
    expect(longPlan.routeId).toBe('route.horology.orientation')
    expect(shortPlan.reason).toContain('15 minutos')
    expect(longPlan.reason).toContain('60 minutos')
  })

  it('sale de practising con una demostración independiente en vez de repetir la misma práctica formativa', () => {
    const value = snapshot()
    const activity = value.product.activities.find(({ id }) =>
      id === 'activity.encyclopedia.history-language.medir-el-tiempo')!
    const mastery: LearningMasteryProjection = {
      schemaVersion: 1,
      profileId: 'profile.local-default',
      competencyId: activity.competencyIds[0],
      state: 'practising',
      strength: 0.6,
      primaryEvidenceIds: ['evidence.formative'],
      latestValidEvidenceAt: now,
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reasons: ['Práctica formativa.'],
      projectorVersion: '1.1.0',
      calculatedAt: now,
    }
    value.mastery = page([mastery])

    const recommendation = academyStudyPlan(value, undefined, now)
      .find(({ basis }) => basis === 'demonstration')
    expect(recommendation).toMatchObject({
      kind: 'practice-competency',
      activityId: activity.id,
      priority: 82,
    })
    expect(recommendation?.href).toBe(`#/learning/activity/${activity.id}?mode=demonstration`)
    expect(recommendation?.reason).toContain('sí puede producir una demostración')
  })

  it('abre también las demostraciones ya autoradas en el modo independiente persistente', () => {
    const value = snapshot()
    const authored = value.product.activities.find(({ demo, pedagogicalContract }) =>
      !demo && pedagogicalContract?.assessmentIntent === 'demonstration')!
    value.mastery = page([{
      schemaVersion: 1,
      profileId: 'profile.local-default',
      competencyId: authored.competencyIds[0],
      state: 'practising',
      strength: 0.7,
      primaryEvidenceIds: ['evidence.guided-practice'],
      latestValidEvidenceAt: now,
      transferEvidenceIds: [],
      retentionEvidenceIds: [],
      reasons: ['Práctica guiada completada.'],
      projectorVersion: '1.1.0',
      calculatedAt: now,
    }])

    const recommendation = academyStudyPlan(value, undefined, now)
      .find(({ basis }) => basis === 'demonstration')

    expect(recommendation?.activityId).toBe(authored.id)
    expect(recommendation?.href).toBe(
      `#/learning/activity/${encodeURIComponent(authored.id)}?mode=demonstration`,
    )
  })

  it('programa la recuperación independiente que permite llegar a retained', () => {
    const value = snapshot()
    const activity = value.product.activities.find(({ demo }) => !demo)!
    value.mastery = page([{
      schemaVersion: 1,
      profileId: 'profile.local-default',
      competencyId: activity.competencyIds[0],
      state: 'demonstrated',
      strength: 1,
      primaryEvidenceIds: ['evidence.demonstrated'],
      latestDemonstratedAt: '2026-08-01T10:00:00.000Z',
      transferEvidenceIds: ['evidence.transfer'],
      retentionEvidenceIds: [],
      reviewStage: 1,
      nextReviewAt: '2026-08-10T10:00:00.000Z',
      reasons: ['Demostrada.'],
      projectorVersion: '1.1.0',
      calculatedAt: now,
    }])

    const primary = academyStudyPlan(value, undefined, now)[0]
    expect(primary).toMatchObject({ kind: 'retention', basis: 'review-due', priority: 90 })
    expect(primary.href).toContain('mode=retention')
  })
})
