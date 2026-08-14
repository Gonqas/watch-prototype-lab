import { describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../../application/service'
import type { LearningMasteryProjection, PersistentAssessment } from '../../persistence/models'
import { evidenceFixture, profileFixture, sessionFixture } from '../../persistence/testFixtures'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../product/integratedContent'
import { academyFixtureSummaries, buildAcademySearchIndex } from '../academyCatalog'
import { createDefaultAcademyLocalState, type AcademyLocalState } from '../academyLocalState'
import {
  ACADEMY_LEARNER_PATH,
  type AcademyLearnerChapter,
  type AcademyLearnerPathDefinition,
  type AcademyLearnerStep,
} from './academyLearnerPath'
import { academyLessonCompletionTransition } from './academyPathLinks'
import { academyNextAction } from './academyNextAction'
import {
  ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF,
  academyStudyRecognitionForLesson,
  deriveAcademyPathProgress,
} from './academyPathProgress'
import { validateAcademyLearnerPath } from './academyPathValidation'

const now = '2026-08-15T10:00:00.000Z'

function page<T>(items: T[]) {
  return { items, offset: 0, limit: 500, total: items.length }
}

function snapshot(): LearningApplicationSnapshot {
  const profile = profileFixture()
  return {
    status: 'ready', backend: 'memory', location: { surface: 'home', query: {} }, profile, profiles: [profile],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX, sessions: page([]), evidence: page([]), assessments: page([]),
    mastery: page([]), packages: page([]), backups: [], recovery: {}, notifications: [], recommendations: [],
    filters: { search: '', difficulty: '', type: '', movement: '', family: '', subsystem: '', competency: '', mastery: '', capability: '', language: '', offline: '', installed: '', compatible: '' },
    selectedSessionEvents: page([]), performance: [], online: false,
  }
}

function explicitState(lessonIds: string[]): AcademyLocalState {
  const state = createDefaultAcademyLocalState('profile.local-default', now)
  state.lessonProgress = lessonIds.map((lessonId, index) => ({
    lessonId, currentSegmentId: `segment.${index}`, completedSegmentIds: [`segment.${index}`], completedAt: now, updatedAt: now,
  }))
  return state
}

function mastery(competencyId: string, state: 'demonstrated' | 'retained', nextReviewAt?: string): LearningMasteryProjection {
  return {
    schemaVersion: 1, profileId: 'profile.local-default', competencyId, state, strength: 1,
    primaryEvidenceIds: ['evidence.passed'], retentionEvidenceIds: state === 'retained' ? ['evidence.retained'] : [],
    firstDemonstratedAt: now, latestDemonstratedAt: now, nextReviewAt,
    reasons: ['Fixture semántico.'], projectorVersion: '1.1.0', calculatedAt: now,
  }
}

function satisfyActivity(base: LearningApplicationSnapshot, activityId: string, resultingState: 'practising' | 'demonstrated' = 'practising') {
  const activity = base.product.activities.find(({ id }) => id === activityId)!
  const competencyId = activity.competencyIds[0]
  const sessionId = `session.${activityId}`
  const evidenceId = `evidence.${activityId}`
  base.sessions = page([
    ...base.sessions.items,
    { ...sessionFixture(sessionId), packageId: activity.packageId, packageVersion: activity.packageVersion, lessonId: activity.lessonId, activityId, activityVersion: activity.packageVersion, rubricId: activity.rubricId, state: 'completed' as const, completedAt: now, updatedAt: now },
  ])
  base.evidence = page([
    ...base.evidence.items,
    { ...evidenceFixture(evidenceId, sessionId), competencyId, activityId, packageId: activity.packageId, packageVersion: activity.packageVersion, activityVersion: activity.packageVersion },
  ])
  const assessment: PersistentAssessment = {
    schemaVersion: 1, id: `assessment.${activityId}`, profileId: 'profile.local-default', evidenceIds: [evidenceId], competencyId,
    ruleId: activity.pedagogicalContract?.purpose === 'transfer' ? `rule.${activityId}.transfer` : `rule.${activityId}`,
    ruleVersion: '1.0.0', algorithm: 'fixture', algorithmVersion: '1.0.0',
    result: { passed: true, resultingState },
    explanation: { satisfiedRuleIds: ['fixture'], unsatisfiedRuleIds: [], ignoredEvidence: [], summary: 'Fixture superado.' },
    recommendations: [], evaluatedAt: now, projection: 'historical',
    inputHash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  }
  base.assessments = page([...base.assessments.items, assessment])
}

function singleStepPath(chapter: AcademyLearnerChapter, step: AcademyLearnerStep): AcademyLearnerPathDefinition {
  const fixtureChapter: AcademyLearnerChapter = {
    ...chapter,
    stageId: 'stage.fixture',
    steps: [step],
    anchorLessonIds: [step.lessonId],
    anchorReviews: chapter.anchorReviews.filter(({ lessonId }) => lessonId === step.lessonId),
    requiredActivityIds: [...step.requiredActivityIds],
    optionalActivityIds: [...step.optionalActivityIds],
    supportingLessonIds: [],
    supportingLessons: [],
    prerequisiteChapterIds: [],
    plannedContentRefs: [],
    coverageStatus: 'complete',
  }
  return {
    ...ACADEMY_LEARNER_PATH,
    pathId: 'academy.path.fixture',
    stageIds: ['stage.fixture'],
    stages: [{ ...ACADEMY_LEARNER_PATH.stages[0], stageId: 'stage.fixture', chapterIds: [fixtureChapter.chapterId], prerequisiteStageIds: [], coverageStatus: 'complete' }],
    chapters: [fixtureChapter],
    optionalBranches: [],
  }
}

describe('modelo semántico 0.14B.1', () => {
  it('separa teoría, práctica guiada, demostración y retención', () => {
    const base = snapshot()
    const guidedChapter = ACADEMY_LEARNER_PATH.chapters[0]
    const guidedStep = guidedChapter.steps[0]
    const inProgressBase = snapshot()
    inProgressBase.sessions = page([{ ...sessionFixture('session.in-progress'), lessonId: guidedStep.lessonId, activityId: guidedStep.requiredActivityIds[0], state: 'active', updatedAt: now }])
    expect(deriveAcademyPathProgress(inProgressBase, explicitState([guidedStep.lessonId]), singleStepPath(guidedChapter, guidedStep), now).chapters[0].practiceStatus).toBe('in-progress')
    satisfyActivity(base, guidedStep.requiredActivityIds[0])
    const guided = deriveAcademyPathProgress(base, explicitState([guidedStep.lessonId]), singleStepPath(guidedChapter, guidedStep), now).chapters[0]
    expect(guided).toMatchObject({ exposureStatus: 'studied', practiceStatus: 'satisfied', masteryStatus: 'not-assessed', coreAvailableComplete: true })

    const demonstrationLocation = ACADEMY_LEARNER_PATH.chapters.flatMap((chapter) => chapter.steps.map((step) => ({ chapter, step })))
      .find(({ step }) => base.product.activities.find(({ id }) => id === step.requiredActivityIds[0])?.pedagogicalContract?.purpose === 'mastery-check')!
    const activity = base.product.activities.find(({ id }) => id === demonstrationLocation.step.requiredActivityIds[0])!
    const dueBase = snapshot()
    const demonstrationDue = deriveAcademyPathProgress(dueBase, explicitState([demonstrationLocation.step.lessonId]), singleStepPath(demonstrationLocation.chapter, demonstrationLocation.step), now).chapters[0]
    expect(demonstrationDue).toMatchObject({ practiceStatus: 'satisfied', masteryStatus: 'demonstration-due', coreAvailableComplete: false })
    const demonstratedBase = snapshot()
    satisfyActivity(demonstratedBase, activity.id, 'demonstrated')
    demonstratedBase.mastery = page([mastery(activity.competencyIds[0], 'demonstrated')])
    const demonstrated = deriveAcademyPathProgress(demonstratedBase, explicitState([demonstrationLocation.step.lessonId]), singleStepPath(demonstrationLocation.chapter, demonstrationLocation.step), now).chapters[0]
    expect(demonstrated.masteryStatus).toBe('demonstrated')

    demonstratedBase.mastery = page([mastery(activity.competencyIds[0], 'demonstrated', '2026-08-15T09:00:00.000Z')])
    const retentionDue = deriveAcademyPathProgress(demonstratedBase, explicitState([demonstrationLocation.step.lessonId]), singleStepPath(demonstrationLocation.chapter, demonstrationLocation.step), now).chapters[0]
    expect(retentionDue.masteryStatus).toBe('retention-due')

    demonstratedBase.mastery = page([mastery(activity.competencyIds[0], 'retained')])
    const retained = deriveAcademyPathProgress(demonstratedBase, explicitState([demonstrationLocation.step.lessonId]), singleStepPath(demonstrationLocation.chapter, demonstrationLocation.step), now).chapters[0]
    expect(retained.masteryStatus).toBe('retained')
    expect(retained.physicalEvidenceStatus).toBe('not-required')
  })

  it('no convierte evidencia P revisada en retención y permite progreso conceptual con P pendiente', () => {
    const base = snapshot()
    const physicalChapter = ACADEMY_LEARNER_PATH.chapters.find(({ physicalEvidencePolicy }) => physicalEvidencePolicy.physicalCompetenceClaim)!
    const step = { ...physicalChapter.steps[0], requiredActivityIds: [], completionPolicy: 'study-only' as const }
    const path = singleStepPath(physicalChapter, step)
    const progress = deriveAcademyPathProgress(base, explicitState([step.lessonId]), path, now).chapters[0]
    expect(progress).toMatchObject({ coreAvailableComplete: true, masteryStatus: 'not-assessed', physicalEvidenceStatus: 'pending' })

    const activityId = physicalChapter.steps[0].requiredActivityIds[0]
    base.evidence = page([{ ...evidenceFixture('evidence.physical'), activityId, content: { evidenceModality: 'P', physicalExecutionDocumented: true } }])
    const reviewedPath = singleStepPath(physicalChapter, physicalChapter.steps[0])
    expect(deriveAcademyPathProgress(base, undefined, reviewedPath, now).chapters[0].physicalEvidenceStatus).toBe('documented')
    base.evidence = page([{ ...evidenceFixture('evidence.physical-review'), activityId, evidenceType: 'human-review', content: { evidenceModality: 'P', physicalExecutionDocumented: true }, provenance: [{ kind: 'human-review', reference: 'review.fixture' }] }])
    const reviewed = deriveAcademyPathProgress(base, undefined, reviewedPath, now).chapters[0]
    expect(reviewed.physicalEvidenceStatus).toBe('reviewed')
    expect(reviewed.masteryStatus).not.toBe('retained')
  })

  it('distingue explicit de legacy-inferred sin reconocer sesiones nuevas como teoría', () => {
    const base = snapshot()
    const step = ACADEMY_LEARNER_PATH.chapters[0].steps[0]
    expect(academyStudyRecognitionForLesson(base, explicitState([step.lessonId]), step.lessonId)).toBe('explicit')
    const activity = base.product.activities.find(({ id }) => id === step.requiredActivityIds[0])!
    base.sessions = page([{ ...sessionFixture('session.legacy'), lessonId: step.lessonId, activityId: activity.id, state: 'completed', completedAt: '2026-08-13T10:00:00.000Z', updatedAt: '2026-08-13T10:00:00.000Z' }])
    expect(academyStudyRecognitionForLesson(base, undefined, step.lessonId)).toBe('legacy-inferred')
    base.sessions = page([{ ...base.sessions.items[0], id: 'session.new', completedAt: now, updatedAt: now }])
    expect(now > ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF).toBe(true)
    expect(academyStudyRecognitionForLesson(base, undefined, step.lessonId)).toBe('none')
  })

  it('admite fixtures con cero, una y varias prácticas sin emparejar arrays por posición', () => {
    const chapter = ACADEMY_LEARNER_PATH.chapters[0]
    const one = chapter.steps[0]
    const lesson = INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.find(({ id }) => id === one.lessonId)!
    const secondActivity = lesson.activityIds.find((id) => !one.requiredActivityIds.includes(id))!
    expect(one.requiredActivityIds).toHaveLength(1)
    expect({ ...one, requiredActivityIds: [], completionPolicy: 'study-only' }).toMatchObject({ requiredActivityIds: [] })
    expect({ ...one, requiredActivityIds: [...one.requiredActivityIds, secondActivity] }.requiredActivityIds).toHaveLength(2)

    const path: AcademyLearnerPathDefinition = {
      ...ACADEMY_LEARNER_PATH,
      chapters: ACADEMY_LEARNER_PATH.chapters.map((item) => ({ ...item, steps: item.steps.map((step) => ({ ...step })) })),
    }
    const target = path.chapters[0]
    target.steps[0] = { ...target.steps[0], requiredActivityIds: [target.steps[0].requiredActivityIds[0], secondActivity] }
    target.requiredActivityIds = target.steps.flatMap(({ requiredActivityIds }) => requiredActivityIds)
    expect(validateAcademyLearnerPath(INTEGRATED_LEARNING_PRODUCT_INDEX, path)).toEqual([])
  })

  it('abre la práctica curada aunque no sea la primera actividad material', () => {
    const base = snapshot()
    const lessonId = 'lesson.miyota8215.guided-disassembly'
    const descriptor = base.product.lessons.find(({ id }) => id === lessonId)!
    const chapter = ACADEMY_LEARNER_PATH.chapters.find(({ steps }) => steps.some((step) => step.lessonId === lessonId))!
    const location = chapter.steps.find((step) => step.lessonId === lessonId)!
    expect(descriptor.activityIds[0]).not.toBe(location.requiredActivityIds[0])
    const transition = academyLessonCompletionTransition(base, undefined, lessonId, now, singleStepPath(chapter, location))
    expect(transition).toMatchObject({ metric: 'lesson-complete-to-required-activity', activityId: location.requiredActivityIds[0] })
    expect(transition.href).not.toContain(descriptor.activityIds[0])
  })

  it('mantiene una única acción core y distingue el final disponible del currículo completo', () => {
    const base = snapshot()
    const action = academyNextAction(base, undefined, now)
    expect(action.type).toBe('read')
    base.recommendations = [{ id: 'recommendation.optional', kind: 'continue-route', rule: 'optional', required: false, title: 'Rama', reason: 'Opcional', href: '#/learning/explore', priority: 1, evidenceIds: [] }]
    expect(academyNextAction(base, undefined, now).actionId).toBe(action.actionId)

    const noActivityPath = singleStepPath(ACADEMY_LEARNER_PATH.chapters[0], { ...ACADEMY_LEARNER_PATH.chapters[0].steps[0], requiredActivityIds: [], completionPolicy: 'study-only' })
    noActivityPath.stages[0].coverageStatus = 'partial'
    noActivityPath.chapters[0].coverageStatus = 'partial'
    noActivityPath.chapters[0].plannedContentRefs = ['stage5-gap.movement-holder']
    const complete = academyNextAction(base, explicitState([noActivityPath.chapters[0].steps[0].lessonId]), now, noActivityPath)
    expect(complete).toMatchObject({ type: 'available-path-complete', title: 'Recorrido disponible completado', remainingCoreItems: 0, plannedCurriculumItems: 1 })
    expect(complete.coveragePendingStageIds).toEqual(['stage.fixture'])
  })

  it('aplica español efectivo al Atlas sin borrar la preferencia histórica', () => {
    const base = snapshot()
    base.profile!.locale = 'en-US'
    const atlasPart = buildAcademySearchIndex(base, []).find(({ kind }) => kind === 'part')!
    const firstLedgerRecord = academyFixtureSummaries()[0].fixture.ledger[0]
    expect(atlasPart.title).toBe(firstLedgerRecord.nameEs)
    expect(base.profile?.locale).toBe('en-US')

  })
})
