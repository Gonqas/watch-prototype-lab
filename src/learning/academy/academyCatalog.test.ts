import { describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../application/service'
import { evidenceFixture, sessionFixture } from '../persistence/testFixtures'
import {
  INTEGRATED_LEARNING_CONTENT,
  INTEGRATED_LEARNING_PRODUCT_INDEX,
} from '../product/integratedContent'
import {
  academyFixtureSummaries,
  academyGlossaryEntries,
  academyLessonMaterial,
  academyNextLearningUnit,
  academyRequiredActivityIds,
  academyRouteProgress,
  academyRouteTree,
  buildAcademySearchIndex,
  realAcademyRoutes,
} from './academyCatalog'

const SHARED_GLOSSARY_SOURCE_IDS = [
  'source.horology.private-book.functional-systems',
  'source.horology.original-functional-map',
  'source.horology.original-quartz-practical-route',
]

function emptySnapshot(): LearningApplicationSnapshot {
  return {
    status: 'ready',
    backend: 'pending',
    location: { surface: 'home', query: {} },
    profiles: [],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX,
    sessions: { items: [], offset: 0, limit: 50, total: 0 },
    evidence: { items: [], offset: 0, limit: 50, total: 0 },
    assessments: { items: [], offset: 0, limit: 50, total: 0 },
    mastery: { items: [], offset: 0, limit: 50, total: 0 },
    packages: { items: [], offset: 0, limit: 50, total: 0 },
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
    selectedSessionEvents: { items: [], offset: 0, limit: 50, total: 0 },
    performance: [],
    online: false,
  }
}

function completeActivities(
  snapshot: LearningApplicationSnapshot,
  activityIds: string[],
): void {
  const activities = activityIds.map((activityId) =>
    snapshot.product.activities.find(({ id }) => id === activityId)!)
  snapshot.sessions.items = activities.map((activity, index) => ({
    ...sessionFixture(`session.required.${index}`),
    packageId: activity.packageId,
    packageVersion: activity.packageVersion,
    lessonId: activity.lessonId,
    activityId: activity.id,
    rubricId: activity.rubricId,
    state: 'completed' as const,
    completedAt: '2026-07-23T09:05:00.000Z',
  }))
  snapshot.sessions.total = snapshot.sessions.items.length
  snapshot.evidence.items = activities.map((activity, index) => ({
    ...evidenceFixture(`evidence.required.${index}`, `session.required.${index}`),
    activityId: activity.id,
    competencyId: activity.competencyIds[0],
  }))
  snapshot.evidence.total = snapshot.evidence.items.length
  snapshot.assessments.items = activities.map((activity, index) => ({
    schemaVersion: 1 as const,
    id: `assessment.required.${index}`,
    profileId: 'profile.local-default',
    evidenceIds: [`evidence.required.${index}`],
    competencyId: activity.competencyIds[0],
    ruleId: `rule.required.${index}.transfer`,
    ruleVersion: '1.0.0',
    algorithm: 'test',
    algorithmVersion: '1.0.0',
    result: { passed: true, resultingState: 'demonstrated' as const, score: 1 },
    explanation: { satisfiedRuleIds: ['rule.test'], unsatisfiedRuleIds: [], ignoredEvidence: [], summary: 'Superada.' },
    recommendations: [],
    evaluatedAt: '2026-07-23T09:05:00.000Z',
    projection: 'historical' as const,
    inputHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
  }))
  snapshot.assessments.total = snapshot.assessments.items.length
}

describe('catálogo real de Watchmaking Academy', () => {
  it('fusiona toda la procedencia de los términos compartidos sin duplicar definiciones', () => {
    const sharedTermIds = [
      'term.horology.main-plate',
      'term.horology.bridge',
      'term.horology.coil',
      'term.horology.stepper-rotor',
      'term.horology.gear-train',
      'term.horology.provenance',
      'term.horology.inference',
    ]
    const entries = academyGlossaryEntries()

    for (const termId of sharedTermIds) {
      const matches = entries.filter(({ id }) => id === termId)
      expect(matches).toHaveLength(1)
      expect(matches[0]?.authoring?.sourceIds).toHaveLength(SHARED_GLOSSARY_SOURCE_IDS.length)
      expect(matches[0]?.authoring?.sourceIds).toEqual(expect.arrayContaining(SHARED_GLOSSARY_SOURCE_IDS))
    }
  })

  it('distingue el inventario instalado del catálogo del estudiante y sus protocolos internos', () => {
    const installedAcademyPacks = INTEGRATED_LEARNING_CONTENT.filter(({ pack }) =>
      pack.manifest.id.startsWith('wplab.horology.'))
    expect(installedAcademyPacks).toHaveLength(8)
    expect(installedAcademyPacks.reduce((total, { pack }) => total + pack.modules.length, 0)).toBe(220)
    expect(installedAcademyPacks.reduce((total, { pack }) => total + pack.lessons.length, 0)).toBe(225)
    expect(installedAcademyPacks.reduce((total, { pack }) => total + pack.activities.length, 0)).toBe(292)

    const routes = realAcademyRoutes(INTEGRATED_LEARNING_PRODUCT_INDEX)
    expect(routes).toHaveLength(24)
    const trees = routes.map(({ id }) => academyRouteTree(INTEGRATED_LEARNING_PRODUCT_INDEX, id)!)
    expect(trees.reduce((total, tree) => total + tree.modules.length, 0)).toBe(217)
    expect(new Set(trees.flatMap(({ modules }) => modules.flatMap(({ lessons }) =>
      lessons.map(({ id }) => id)))).size).toBe(222)
    expect(new Set(trees.flatMap(({ activityIds }) => activityIds)).size).toBe(289)
    expect(routes.map(({ id }) => id)).not.toContain('route.capstone.validation')
    expect(routes.at(-1)?.id).toBe('route.capstone.watch-validation')
    expect(trees.find(({ route }) => route.id === 'route.miyota8215.complete')).toMatchObject({
      modules: expect.arrayContaining([expect.objectContaining({
        module: expect.objectContaining({ id: 'module.miyota8215.identify' }),
      })]),
    })
    expect(trees.find(({ route }) => route.id === 'route.capstone.manufacturing-finishing')?.modules)
      .toHaveLength(7)
    expect(trees.find(({ route }) => route.id === 'route.capstone.personal-watch-design')?.modules)
      .toHaveLength(6)
    expect(trees.find(({ route }) => route.id === 'route.capstone.watch-validation')?.modules)
      .toHaveLength(2)
    expect(academyRouteTree(INTEGRATED_LEARNING_PRODUCT_INDEX, 'route.capstone.validation')?.modules)
      .toHaveLength(3)
  })

  it('resuelve bloques, fuentes y estrategia visual de una lección editorial existente', () => {
    const material = academyLessonMaterial(
      INTEGRATED_LEARNING_PRODUCT_INDEX,
      'lesson.miyota8215.identify',
    )
    expect(material?.blocks.length).toBeGreaterThan(0)
    expect(material?.activities).toHaveLength(2)
    expect(material?.sources.length).toBeGreaterThan(0)
    expect(material?.lesson.authoring?.visualStrategy?.fidelity).toMatchObject({
      geometry: 'G2',
      kinematics: 'K2',
      physics: 'P0',
    })
  })

  it('abre la explicación antes de recomendar la primera actividad de una ruta', () => {
    const snapshot = emptySnapshot()
    const next = academyNextLearningUnit(snapshot, 'route.horology.orientation')

    expect(next).toMatchObject({
      kind: 'block',
      lessonId: 'lesson.horology.system',
      blockId: 'block.horology.system',
      reason: 'introduction',
    })
    expect(next?.href).toContain('#/learning/lesson/lesson.horology.system')
    expect(academyRouteProgress(snapshot, 'route.horology.orientation')).toMatchObject({
      nextLearningUnit: next,
      nextActivityId: undefined,
    })
  })

  it('reanuda una práctica solo después de que exista una sesión iniciada explícitamente', () => {
    const snapshot = emptySnapshot()
    snapshot.sessions.items = [{
      ...sessionFixture('session.horology.classify'),
      packageId: 'wplab.horology.functional-map',
      packageVersion: '0.2.0',
      lessonId: 'lesson.horology.system',
      activityId: 'activity.horology.classify-subsystems',
      activityVersion: '0.1.0',
      rubricId: 'rubric.horology.functional-subsystems',
      rubricVersion: '0.1.0',
      state: 'active',
    }]
    snapshot.sessions.total = 1

    expect(academyNextLearningUnit(snapshot, 'route.horology.orientation')).toMatchObject({
      kind: 'activity',
      lessonId: 'lesson.horology.system',
      activityId: 'activity.horology.classify-subsystems',
      href: '#/learning/recovery/session.horology.classify',
      reason: 'resume',
    })
  })

  it('pasa al bloque de la siguiente lección al completar todas las prácticas de la actual', () => {
    const snapshot = emptySnapshot()
    const firstLesson = academyRouteTree(snapshot.product, 'route.horology.orientation')!
      .modules[0].lessons[0]
    snapshot.sessions.items = firstLesson.activities.map((activity, index) => ({
      ...sessionFixture(`session.horology.completed.${index}`),
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      lessonId: firstLesson.id,
      activityId: activity.id,
      activityVersion: '0.1.0',
      rubricId: activity.rubricId,
      rubricVersion: '0.1.0',
      state: 'completed' as const,
      completedAt: '2026-07-23T09:05:00.000Z',
    }))
    snapshot.sessions.total = snapshot.sessions.items.length
    snapshot.evidence.items = firstLesson.activities.map((activity, index) => ({
      ...evidenceFixture(`evidence.horology.completed.${index}`, `session.horology.completed.${index}`),
      activityId: activity.id,
      competencyId: activity.competencyIds[0],
    }))
    snapshot.evidence.total = snapshot.evidence.items.length
    snapshot.assessments.items = firstLesson.activities.map((activity, index) => ({
      schemaVersion: 1 as const,
      id: `assessment.horology.completed.${index}`,
      profileId: 'profile.local-default',
      evidenceIds: [`evidence.horology.completed.${index}`],
      competencyId: activity.competencyIds[0],
      ruleId: `rule.horology.completed.${index}.transfer`,
      ruleVersion: '1.0.0',
      algorithm: 'test',
      algorithmVersion: '1.0.0',
      result: { passed: true, resultingState: 'demonstrated' as const, score: 1 },
      explanation: { satisfiedRuleIds: ['rule.test'], unsatisfiedRuleIds: [], ignoredEvidence: [], summary: 'Superada.' },
      recommendations: [],
      evaluatedAt: '2026-07-23T09:05:00.000Z',
      projection: 'historical' as const,
      inputHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
    }))
    snapshot.assessments.total = snapshot.assessments.items.length

    expect(academyNextLearningUnit(snapshot, 'route.horology.orientation')).toMatchObject({
      kind: 'block',
      lessonId: 'lesson.horology.mechanical-chain',
      reason: 'introduction',
    })
  })

  it('mantiene los hitos opcionales accesibles sin exigirlos para completar ni continuar', () => {
    const snapshot = emptySnapshot()
    const tree = academyRouteTree(snapshot.product, 'route.horology.orientation')!
    const requiredIds = academyRequiredActivityIds(snapshot.product, tree.route.id)
    const isaMilestone = tree.route.learningDesign?.milestones.find(({ id }) =>
      id === 'milestone.horology.gold.04')

    expect(isaMilestone).toMatchObject({
      id: 'milestone.horology.gold.04',
      lessonId: 'lesson.horology.isa8172-confidence',
      activityId: 'activity.horology.isa-confidence-map',
      optional: true,
    })
    expect(tree.activityIds).toContain('activity.horology.isa-confidence-map')
    expect(requiredIds).not.toContain('activity.horology.isa-confidence-map')
    expect(requiredIds).toHaveLength(tree.activityIds.length - 1)

    completeActivities(snapshot, requiredIds)
    expect(snapshot.sessions.items.some(({ activityId }) =>
      activityId === 'activity.horology.isa-confidence-map')).toBe(false)
    expect(academyRouteProgress(snapshot, tree.route.id)).toMatchObject({
      completedActivities: requiredIds.length,
      totalActivities: requiredIds.length,
      routeComplete: true,
      nextLearningUnit: undefined,
    })
  })

  it('construye el Atlas desde los cuatro fixtures y mantiene conceptual separado de calibre real', () => {
    const fixtures = academyFixtureSummaries()
    expect(fixtures).toHaveLength(4)
    expect(fixtures.find(({ fixture }) => fixture.id === 'fixture.miyota.8215.structural')?.fixture.ledger).toHaveLength(56)
    expect(fixtures.find(({ fixture }) => fixture.id === 'fixture.miyota.2035.structural')?.fixture.kind).toBe('official-calibre-quartz')
    expect(fixtures.find(({ fixture }) => fixture.id === 'fixture.conceptual.mechanical-chain')?.fixture.kind).toBe('conceptual-mechanical')
  })

  it('indexa piezas, términos, fuentes y notas privadas sin exponer rutas del sistema', () => {
    const entries = buildAcademySearchIndex(emptySnapshot(), [{
      id: 'academy-note.1',
      title: 'Repasar áncora',
      body: 'Relacionar bloqueo e impulso.',
      tags: ['escape'],
      context: { lessonId: 'lesson.miyota8215.escapement-oscillator' },
      createdAt: '2026-07-27T10:00:00.000Z',
      updatedAt: '2026-07-27T10:00:00.000Z',
    }])
    expect(entries.some(({ kind, title }) => kind === 'part' && title.toLowerCase().includes('áncora'))).toBe(true)
    expect(entries.some(({ kind }) => kind === 'term')).toBe(true)
    expect(entries.some(({ kind }) => kind === 'source')).toBe(true)
    expect(entries.some(({ kind, title }) => kind === 'note' && title === 'Repasar áncora')).toBe(true)
    expect(entries.map(({ href }) => href).join('\n')).not.toMatch(/[A-Z]:\\|file:\/\//)
  })
})
