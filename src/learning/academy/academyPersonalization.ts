import type { LearningApplicationSnapshot } from '../application/service'
import { localize } from '../application/i18n'

export type LearningTrend = 'insufficient-data' | 'improving' | 'stable' | 'declining'

export interface ActiveMisconceptionProjection {
  id: string
  title: string
  diagnosis: string
  correction: string
  remediationLessonId: string
  activityId: string
  competencyIds: string[]
  evidenceId: string
  observedAt: string
}

export interface ConceptLearningProfile {
  conceptId: string
  title: string
  status: 'not-started' | 'introduced' | 'practising' | 'demonstrated' | 'retained'
  strength: number
  evidenceIds: string[]
  latestEvidenceAt?: string
  completedAttempts: number
  incorrectAttempts: number
  hintsUsed: number
  successfulAssessments: number
  failedAssessments: number
  transferEvidenceCount: number
  reviewStage?: number
  nextReviewAt?: string
  trend: LearningTrend
  activeMisconceptionIds: string[]
  recommendation: string
}

export interface AcademyLongitudinalSummary {
  completedSessions: number
  activeDays: number
  successfulAssessments: number
  failedAssessments: number
  successRate: number
  independentEvidence: number
  transferredCompetencies: number
  retainedCompetencies: number
  dueReviews: number
  activeMisconceptions: number
  trend: LearningTrend
}

export interface AcademyLearnerModel {
  calculatedAt: string
  concepts: ConceptLearningProfile[]
  activeMisconceptions: ActiveMisconceptionProjection[]
  summary: AcademyLongitudinalSummary
}

function evaluationOf(content: Record<string, unknown>): Record<string, unknown> | undefined {
  const evaluation = content.evaluation
  return evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation)
    ? evaluation as Record<string, unknown>
    : undefined
}

function trendFrom(values: number[]): LearningTrend {
  if (values.length < 2) return 'insufficient-data'
  const recent = values.slice(-4)
  const delta = recent.at(-1)! - recent[0]
  if (delta >= 0.15) return 'improving'
  if (delta <= -0.15) return 'declining'
  return 'stable'
}

function recommendationFor(profile: Omit<ConceptLearningProfile, 'recommendation'>): string {
  if (profile.activeMisconceptionIds.length > 0) return 'Corrige primero el error conceptual y repite con una variante independiente.'
  if (profile.trend === 'declining') return 'Recupera el principio sin consultar la solución y vuelve al primer salto causal que falle.'
  if (profile.nextReviewAt) return `Conserva la recuperación programada para ${profile.nextReviewAt}; no releas la solución justo antes.`
  if (profile.status === 'practising' || profile.status === 'introduced') return 'Realiza otra práctica con menos ayuda antes de intentar demostrarlo.'
  if (profile.status === 'demonstrated' && profile.transferEvidenceCount === 0) return 'Transfiere el criterio a otro movimiento, representación o tipo de problema.'
  if (profile.status === 'retained') return 'Competencia consolidada con tres recuperaciones; úsala en proyectos y comprueba fallos posteriores.'
  return 'Estudia primero la explicación y el ejemplo resuelto antes de responder.'
}

export function buildAcademyLearnerModel(
  snapshot: LearningApplicationSnapshot,
  now = new Date().toISOString(),
): AcademyLearnerModel {
  const markerTargets = new Set(snapshot.evidence.items
    .filter(({ status }) => status !== 'active')
    .flatMap(({ relatedEvidenceId }) => relatedEvidenceId ? [relatedEvidenceId] : []))
  const activeEvidence = snapshot.evidence.items
    .filter(({ id, status }) => status === 'active' && !markerTargets.has(id))
  const completedSessions = snapshot.sessions.items.filter(({ state }) => state === 'completed')
  const activeDays = new Set(completedSessions.map(({ completedAt, startedAt }) =>
    (completedAt ?? startedAt).slice(0, 10))).size

  const activeMisconceptions = snapshot.product.misconceptions.flatMap((misconception) => {
    const activities = snapshot.product.activities.filter(({ feedbackContract }) =>
      feedbackContract?.misconceptionIds.includes(misconception.id))
    const activityIds = new Set(activities.map(({ id }) => id))
    const evidence = activeEvidence
      .filter(({ activityId }) => activityIds.has(activityId))
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
    const latestIncorrect = evidence.filter(({ content }) => evaluationOf(content)?.correct === false).at(-1)
    if (!latestIncorrect) return []
    const latestRecovery = evidence.filter(({ content }) => evaluationOf(content)?.correct === true).at(-1)
    if (latestRecovery && latestRecovery.observedAt >= latestIncorrect.observedAt) return []
    const activity = activities.find(({ id }) => id === latestIncorrect.activityId) ?? activities[0]
    return [{
      id: misconception.id,
      title: localize(snapshot.profile?.locale, misconception.title),
      diagnosis: localize(snapshot.profile?.locale, misconception.diagnosis),
      correction: localize(snapshot.profile?.locale, misconception.correction),
      remediationLessonId: misconception.remediationLessonId,
      activityId: latestIncorrect.activityId,
      competencyIds: activity?.competencyIds ?? [latestIncorrect.competencyId],
      evidenceId: latestIncorrect.id,
      observedAt: latestIncorrect.observedAt,
    }]
  }).sort((left, right) => right.observedAt.localeCompare(left.observedAt))

  const concepts = snapshot.product.knowledgeNodes.map((node): ConceptLearningProfile => {
    const competencyIds = new Set(node.competencyIds)
    const evidence = activeEvidence.filter(({ competencyId }) => competencyIds.has(competencyId))
    const assessments = snapshot.assessments.items
      .filter(({ competencyId }) => competencyIds.has(competencyId))
      .sort((left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt))
    const mastery = snapshot.mastery.items
      .filter(({ competencyId }) => competencyIds.has(competencyId))
      .sort((left, right) => right.strength - left.strength)[0]
    const activityIds = new Set(node.activityIds)
    const sessions = completedSessions.filter(({ activityId }) => activityIds.has(activityId))
    const misconceptionIds = activeMisconceptions
      .filter(({ competencyIds: values }) => values.some((id) => competencyIds.has(id)))
      .map(({ id }) => id)
    const status: ConceptLearningProfile['status'] = mastery?.state === 'retained'
      ? 'retained'
      : mastery?.state === 'demonstrated'
        ? 'demonstrated'
        : mastery?.state === 'practising'
          ? 'practising'
          : mastery?.state === 'introduced' || evidence.length > 0
            ? 'introduced'
            : 'not-started'
    const base = {
      conceptId: node.id,
      title: localize(snapshot.profile?.locale, node.title),
      status,
      strength: mastery?.strength ?? 0,
      evidenceIds: evidence.map(({ id }) => id),
      latestEvidenceAt: evidence.sort((left, right) => left.observedAt.localeCompare(right.observedAt)).at(-1)?.observedAt,
      completedAttempts: sessions.length,
      incorrectAttempts: evidence.filter(({ content }) => evaluationOf(content)?.correct === false).length,
      hintsUsed: evidence.reduce((total, { content }) =>
        total + (Array.isArray(content.hintEventIds) ? content.hintEventIds.length : 0), 0),
      successfulAssessments: assessments.filter(({ result }) => result.passed).length,
      failedAssessments: assessments.filter(({ result }) => !result.passed).length,
      transferEvidenceCount: mastery?.transferEvidenceIds?.length ?? 0,
      reviewStage: mastery?.reviewStage,
      nextReviewAt: mastery?.nextReviewAt,
      trend: trendFrom(assessments.map(({ result }) => result.score ?? (result.passed ? 1 : 0))),
      activeMisconceptionIds: [...new Set(misconceptionIds)],
    }
    return { ...base, recommendation: recommendationFor(base) }
  })

  const successfulAssessments = snapshot.assessments.items.filter(({ result }) => result.passed).length
  const failedAssessments = snapshot.assessments.items.length - successfulAssessments
  const assessmentScores = [...snapshot.assessments.items]
    .sort((left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt))
    .map(({ result }) => result.score ?? (result.passed ? 1 : 0))
  return {
    calculatedAt: now,
    concepts,
    activeMisconceptions,
    summary: {
      completedSessions: completedSessions.length,
      activeDays,
      successfulAssessments,
      failedAssessments,
      successRate: snapshot.assessments.items.length > 0
        ? successfulAssessments / snapshot.assessments.items.length
        : 0,
      independentEvidence: activeEvidence.filter(({ content }) =>
        !Array.isArray(content.hintEventIds) || content.hintEventIds.length === 0).length,
      transferredCompetencies: snapshot.mastery.items.filter(({ transferEvidenceIds }) =>
        (transferEvidenceIds?.length ?? 0) > 0).length,
      retainedCompetencies: snapshot.mastery.items.filter(({ state }) => state === 'retained').length,
      dueReviews: snapshot.mastery.items.filter(({ nextReviewAt }) => Boolean(nextReviewAt && nextReviewAt <= now)).length,
      activeMisconceptions: activeMisconceptions.length,
      trend: trendFrom(assessmentScores),
    },
  }
}
