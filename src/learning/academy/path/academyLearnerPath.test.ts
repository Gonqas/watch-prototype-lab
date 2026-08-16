import { describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../../application/service'
import { normalizeLearningLocale } from '../../application/i18n'
import { parseLearningLocation } from '../../application/navigation'
import type { LearningMasteryProjection } from '../../persistence/models'
import { evidenceFixture, profileFixture, sessionFixture } from '../../persistence/testFixtures'
import { INTEGRATED_LEARNING_CONTENT, INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../product/integratedContent'
import { createDefaultAcademyLocalState } from '../academyLocalState'
import { ACADEMY_LIBRARY_ROUTE_GROUPS } from './academyLibrary'
import {
  ACADEMY_LEARNER_PATH,
  ACADEMY_STAGE_5_PLANNED_REFS,
  academyPathLocationForLesson,
  type AcademyLearnerPathDefinition,
} from './academyLearnerPath'
import { academyModuleEntryHref, academyChapterHref } from './academyPathLinks'
import { academyNextAction } from './academyNextAction'
import {
  ACADEMY_PREREQUISITE_RESOLUTIONS,
  academyPrerequisiteDebtForLesson,
  effectiveLessonPrerequisiteConceptIds,
} from './academyPathPrerequisites'
import { deriveAcademyPathProgress } from './academyPathProgress'
import { validateAcademyLearnerPath } from './academyPathValidation'
import { ACADEMY_STAGE_5_BLUEPRINT } from './academyStage5Blueprint'

const now = '2026-08-14T10:00:00.000Z'

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

function studiedState(lessonIds: readonly string[]) {
  const state = createDefaultAcademyLocalState('profile.local-default', now)
  state.lessonProgress = lessonIds.map((lessonId, index) => ({
    lessonId,
    currentSegmentId: `segment.${index}`,
    completedSegmentIds: [`segment.${index}`],
    completedAt: now,
    updatedAt: now,
  }))
  return state
}

function compactPath(chapterCount: 1 | 2): AcademyLearnerPathDefinition {
  const sourceChapters = ACADEMY_LEARNER_PATH.chapters.slice(0, chapterCount)
  const chapters = sourceChapters.map((chapter, index) => ({
    ...chapter,
    stageId: 'stage.test',
    order: index + 1,
    steps: chapter.steps.map((step) => ({ ...step, chapterId: chapter.chapterId, requiredActivityIds: [], optionalActivityIds: [] })),
    requiredActivityIds: [],
    optionalActivityIds: [],
    prerequisiteChapterIds: index === 0 ? [] : [sourceChapters[index - 1].chapterId],
  }))
  return {
    ...ACADEMY_LEARNER_PATH,
    pathId: 'academy.path.test',
    stageIds: ['stage.test'],
    stages: [{
      ...ACADEMY_LEARNER_PATH.stages[0],
      stageId: 'stage.test',
      order: 0,
      chapterIds: chapters.map(({ chapterId }) => chapterId),
      prerequisiteStageIds: [],
    }],
    chapters,
  }
}

describe('manifiesto curado 0.14B', () => {
  it('resuelve todos los IDs, no tiene huérfanos, ciclos ni anchors duplicados', () => {
    expect(validateAcademyLearnerPath(INTEGRATED_LEARNING_PRODUCT_INDEX)).toEqual([])
    expect(ACADEMY_LEARNER_PATH.stages).toHaveLength(8)
    expect(ACADEMY_LEARNER_PATH.chapters).toHaveLength(32)
    expect(ACADEMY_LEARNER_PATH.chapters.every(({ anchorLessonIds }) => anchorLessonIds.length >= 1 && anchorLessonIds.length <= 5)).toBe(true)
    const anchors = ACADEMY_LEARNER_PATH.chapters.flatMap(({ anchorLessonIds }) => anchorLessonIds)
    expect(new Set(anchors).size).toBe(anchors.length)
    expect(ACADEMY_LEARNER_PATH.chapters.every(({ anchorReviews }) =>
      anchorReviews.every((review) => review.titleReviewed && review.objectiveReviewed && review.activitiesReviewed
        && review.prerequisitesReviewed && review.sourceRolesReviewed && review.curationConfidence === 'high'))).toBe(true)
  })

  it('mantiene las especializaciones opcionales fuera del grafo bloqueante', () => {
    expect(ACADEMY_LEARNER_PATH.optionalBranches).toHaveLength(8)
    expect(ACADEMY_LEARNER_PATH.optionalBranches.every(({ blocking }) => blocking === false)).toBe(true)
    const quartz = ACADEMY_LEARNER_PATH.optionalBranches.find(({ routeIds }) => routeIds.includes('route.quartz2035.isa-to-2035'))
    expect(quartz).toMatchObject({ blocking: false })
    const prerequisiteIds = [
      ...ACADEMY_LEARNER_PATH.stages.flatMap(({ prerequisiteStageIds }) => prerequisiteStageIds),
      ...ACADEMY_LEARNER_PATH.chapters.flatMap(({ prerequisiteChapterIds }) => prerequisiteChapterIds),
    ]
    expect(prerequisiteIds.some((id) => quartz?.routeIds.includes(id))).toBe(false)
  })

  it('sitúa MIYOTA 8215, integración de reloj y movimiento propio en sus etapas curadas', () => {
    const miyotaLocations = ACADEMY_LEARNER_PATH.chapters
      .filter(({ anchorLessonIds, supportingLessonIds }) => [...anchorLessonIds, ...supportingLessonIds].some((id) => id.startsWith('lesson.miyota8215.')))
    expect(miyotaLocations).toHaveLength(5)
    expect(miyotaLocations.every(({ stageId }) => stageId === 'stage.4')).toBe(true)
    expect(new Set(miyotaLocations.flatMap(({ anchorLessonIds, supportingLessonIds }) => [...anchorLessonIds, ...supportingLessonIds].filter((id) => id.startsWith('lesson.miyota8215.')))).size).toBe(15)
    expect(ACADEMY_LEARNER_PATH.stages.find(({ stageId }) => stageId === 'stage.5')).toMatchObject({ coverageStatus: 'complete' })
    expect(academyPathLocationForLesson('lesson.capstone.design.own-movement')?.stage.stageId).toBe('stage.7')
  })

  it('representa los ocho vacíos de etapa 5 solo como blueprint, nunca como lecciones', () => {
    expect(ACADEMY_STAGE_5_PLANNED_REFS).toHaveLength(8)
    expect(ACADEMY_STAGE_5_BLUEPRINT.filter(({ status }) => status === 'gap')).toHaveLength(8)
    expect(ACADEMY_STAGE_5_BLUEPRINT.filter(({ status }) => status === 'partial')).toHaveLength(5)
    expect(ACADEMY_STAGE_5_BLUEPRINT.every(({ productionLessonId }) => productionLessonId === null)).toBe(true)
    const lessonIds = new Set(INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.map(({ id }) => id))
    expect(ACADEMY_STAGE_5_PLANNED_REFS.every((id) => !lessonIds.has(id))).toBe(true)
  })

  it('conserva las 24 rutas en Biblioteca sin tratarlas como equivalentes', () => {
    const grouped = ACADEMY_LIBRARY_ROUTE_GROUPS.flatMap(({ routeIds }) => routeIds)
    expect(grouped).toHaveLength(24)
    expect(new Set(grouped).size).toBe(24)
    expect(ACADEMY_LIBRARY_ROUTE_GROUPS.find(({ groupId }) => groupId === 'specializations')?.routeIds).toContain('route.quartz2035.isa-to-2035')
  })

  it('mantiene cargables los ocho paquetes editoriales', () => {
    const ids = new Set(INTEGRATED_LEARNING_CONTENT.map(({ pack }) => pack.manifest.id))
    expect([
      'wplab.horology.functional-map',
      'wplab.horology.quartz-miyota2035',
      'wplab.horology.mechanical-foundations',
      'wplab.horology.miyota8215',
      'wplab.horology.inspection-metrology',
      'wplab.horology.advanced-architecture-service',
      'wplab.horology.manufacturing-design-validation',
      'wplab.horology.watchmaking-encyclopedia',
    ].every((id) => ids.has(id))).toBe(true)
  })
})

describe('progreso compatible y siguiente acción', () => {
  it('excluye supports y opcionales del denominador core', () => {
    const base = snapshot()
    const before = deriveAcademyPathProgress(base)
    const supportId = ACADEMY_LEARNER_PATH.chapters.flatMap(({ supportingLessonIds }) => supportingLessonIds)[0]
    const after = deriveAcademyPathProgress(base, studiedState([supportId]))
    expect(after.anchorLessonsTotal).toBe(before.anchorLessonsTotal)
    expect(after.requiredActivitiesTotal).toBe(before.requiredActivitiesTotal)
    expect(after.anchorLessonsCompleted).toBe(0)
  })

  it('reconoce progreso local y sesiones anteriores sin mutarlos', () => {
    const base = snapshot()
    const firstAnchor = ACADEMY_LEARNER_PATH.chapters[0].anchorLessonIds[0]
    const activity = base.product.activities.find(({ id }) => id === ACADEMY_LEARNER_PATH.chapters[0].requiredActivityIds[0])!
    const existing = { ...sessionFixture('session.existing'), ...activity, id: 'session.existing', state: 'completed' as const, completedAt: now, updatedAt: now }
    base.sessions = page([existing])
    const sessionsBefore = structuredClone(base.sessions)
    const progress = deriveAcademyPathProgress(base, studiedState([firstAnchor]))
    expect(progress.anchorLessonsCompleted).toBeGreaterThan(0)
    expect(base.sessions).toEqual(sessionsBefore)
  })

  it('no declara competencia física sin evidencia P explícita', () => {
    const base = snapshot()
    const chapter = ACADEMY_LEARNER_PATH.chapters.find(({ physicalEvidencePolicy }) => physicalEvidencePolicy.physicalCompetenceClaim)!
    expect(deriveAcademyPathProgress(base).chapters.find(({ chapterId }) => chapterId === chapter.chapterId)?.benchEvidenceStatus.status).toBe('pending')
    const activityId = chapter.requiredActivityIds[0]
    base.evidence = page([{
      ...evidenceFixture('evidence.physical', 'session.physical'),
      activityId,
      content: { evidenceModality: 'P', physicalExecutionDocumented: true },
    }])
    expect(deriveAcademyPathProgress(base).chapters.find(({ chapterId }) => chapterId === chapter.chapterId)?.benchEvidenceStatus.status).toBe('documented')
  })

  it('aplica recuperación > retención > práctica > lección > capítulo > opcional', () => {
    const base = snapshot()
    expect(academyNextAction(base, undefined, now).precedence).toBe(4)

    const firstChapter = ACADEMY_LEARNER_PATH.chapters[0]
    const studied = studiedState([firstChapter.anchorLessonIds[0]])
    expect(academyNextAction(base, studied, now).precedence).toBe(3)

    const competencyId = base.product.activities.find(({ id }) => id === firstChapter.requiredActivityIds[0])!.competencyIds[0]
    const due: LearningMasteryProjection = {
      schemaVersion: 1, profileId: 'profile.local-default', competencyId, state: 'demonstrated', strength: 1,
      primaryEvidenceIds: ['evidence.old'], retentionEvidenceIds: [], nextReviewAt: '2026-08-13T10:00:00.000Z',
      reasons: ['Revisión vencida.'], projectorVersion: '1.1.0', calculatedAt: now,
    }
    base.mastery = page([due])
    expect(academyNextAction(base, studied, now).precedence).toBe(2)

    const firstActivity = base.product.activities.find(({ id }) => id === firstChapter.requiredActivityIds[0])!
    base.sessions = page([{
      ...sessionFixture('session.recoverable'), packageId: firstActivity.packageId, packageVersion: firstActivity.packageVersion,
      lessonId: firstActivity.lessonId, activityId: firstActivity.id, rubricId: firstActivity.rubricId,
      state: 'interrupted', updatedAt: now,
    }])
    expect(academyNextAction(base, studied, now).precedence).toBe(1)

    const twoChapterPath = compactPath(2)
    const firstDone = studiedState(twoChapterPath.chapters[0].anchorLessonIds)
    base.sessions = page([]); base.mastery = page([])
    expect(academyNextAction(base, firstDone, now, twoChapterPath).precedence).toBe(5)
    const complete = studiedState(twoChapterPath.chapters.flatMap(({ anchorLessonIds }) => anchorLessonIds))
    expect(academyNextAction(base, complete, now, twoChapterPath)).toMatchObject({ precedence: 6, type: 'available-path-complete' })
  })

  it('nunca deja que una actividad opcional desplace una tarea core', () => {
    const base = snapshot()
    const optionalId = ACADEMY_LEARNER_PATH.chapters.flatMap(({ optionalActivityIds }) => optionalActivityIds)[0]
    if (optionalId) base.sessions = page([{ ...sessionFixture('session.optional'), activityId: optionalId, state: 'active', updatedAt: now }])
    const action = academyNextAction(base, undefined, now)
    expect(action.precedence).not.toBe(6)
  })
})

describe('compatibilidad de prerrequisitos, enlaces y locales', () => {
  it('hace efectivos los nueve overrides y conserva la deuda fuente', () => {
    expect(ACADEMY_PREREQUISITE_RESOLUTIONS).toHaveLength(9)
    for (const resolution of ACADEMY_PREREQUISITE_RESOLUTIONS) {
      expect(effectiveLessonPrerequisiteConceptIds(resolution.lessonId, [resolution.conceptId]))
        .not.toContain(resolution.conceptId)
      expect(resolution.sourceMigrationPending).toBe(true)
      expect(academyPrerequisiteDebtForLesson(resolution.lessonId)).toContainEqual(resolution)
    }
  })

  it('abre directamente unidades de una lección y conserva deep links de módulo', () => {
    const unitary = INTEGRATED_LEARNING_PRODUCT_INDEX.modules.find(({ lessonIds }) => lessonIds.length === 1)!
    const multi = INTEGRATED_LEARNING_PRODUCT_INDEX.modules.find(({ lessonIds }) => lessonIds.length > 1)!
    expect(academyModuleEntryHref(unitary.id, unitary.lessonIds)).toBe(`#/learning/lesson/${encodeURIComponent(unitary.lessonIds[0])}`)
    expect(academyModuleEntryHref(multi.id, multi.lessonIds)).toBe(`#/learning/module/${encodeURIComponent(multi.id)}`)
    expect(parseLearningLocation(new URL(`https://local.test/#/learning/module/${encodeURIComponent(unitary.id)}`))).toMatchObject({ surface: 'module', id: unitary.id })
  })

  it('conserva todas las superficies antiguas y enlaza bloqueos al capítulo exacto', () => {
    const surfaces = ['home', 'my-learning', 'explore', 'map', 'workshop', 'engineering', 'metrology', 'atlas', 'review', 'search', 'notebook', 'glossary', 'sources', 'sessions', 'progress', 'history', 'content', 'profile', 'preferences']
    for (const surface of surfaces) expect(parseLearningLocation(new URL(`https://local.test/#/learning/${surface}`)).surface).toBe(surface)
    expect(academyChapterHref('chapter.2.3')).toBe('#/learning/my-learning?chapter=chapter.2.3')
  })

  it('aplica fallback español sin borrar la preferencia inglesa almacenada', () => {
    const profile = profileFixture()
    profile.locale = 'en-US'
    expect(profile.locale).toBe('en-US')
    expect(normalizeLearningLocale(profile.locale)).toBe('es-ES')
  })
})
