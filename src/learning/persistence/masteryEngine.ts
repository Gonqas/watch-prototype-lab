import type { MasteryState } from '../assessment'
import type { LearningMasteryProjection, PersistentAssessment, PersistentEvidenceRecord } from './models'
import type { LearningRepository } from './repository'

const RANK: Record<MasteryState, number> = {
  not_started: 0,
  introduced: 1,
  practising: 2,
  demonstrated: 3,
  retained: 4,
}

function addDays(instant: string, days: number): string {
  return new Date(new Date(instant).getTime() + days * 86_400_000).toISOString()
}

export class MasteryProjectionEngine {
  private readonly repository: LearningRepository
  private readonly now: () => string

  constructor(repository: LearningRepository, now: () => string = () => new Date().toISOString()) {
    this.repository = repository
    this.now = now
  }

  async rebuild(profileId: string): Promise<LearningMasteryProjection[]> {
    return this.repository.transaction(async (transaction) => {
      const evidence = (await transaction.listEvidence(profileId, undefined, { limit: 500 })).items
      const assessments = (await transaction.listAssessments(profileId, undefined, { limit: 500 })).items
      const competencyIds = [...new Set([...evidence.map(({ competencyId }) => competencyId), ...assessments.map(({ competencyId }) => competencyId)])].sort()
      await transaction.clearMastery(profileId)
      const projections = competencyIds.map((competencyId) =>
        this.project(profileId, competencyId, evidence.filter((record) => record.competencyId === competencyId), assessments.filter((record) => record.competencyId === competencyId)))
      for (const projection of projections) await transaction.putMastery(projection)
      return projections
    })
  }

  private project(
    profileId: string,
    competencyId: string,
    evidence: PersistentEvidenceRecord[],
    assessments: PersistentAssessment[],
  ): LearningMasteryProjection {
    const markerTargets = new Set(evidence.filter(({ status }) => status !== 'active').map(({ relatedEvidenceId }) => relatedEvidenceId).filter(Boolean))
    const active = evidence.filter((record) => record.status === 'active' && !markerTargets.has(record.id))
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
    const passed = assessments.filter(({ result }) => result.passed).sort((left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt))
    let state: MasteryState = active.length === 0 ? 'not_started' : 'introduced'
    const practisingTypes = new Set([
      'classification', 'explanation', 'sequence', 'diagnosis', 'measurement', 'assembly',
      'decision', 'written-response', 'simulation-result', 'human-review',
    ])
    if (active.some(({ evidenceType }) => practisingTypes.has(evidenceType))
      || assessments.some(({ result }) => !result.passed)) {
      state = 'practising'
    }
    for (const assessment of passed) {
      if (assessment.result.resultingState === 'retained') continue
      if (RANK[assessment.result.resultingState] > RANK[state]) state = assessment.result.resultingState
    }
    const failedAfterSuccess = assessments.some((assessment) =>
      !assessment.result.passed && passed.some((success) => success.evaluatedAt < assessment.evaluatedAt))
    const demonstration = passed.filter(({ result }) => RANK[result.resultingState] >= RANK.demonstrated)
    const transfer = demonstration.filter(({ ruleId }) => ruleId.endsWith('.transfer'))
    const retention = [...new Map(passed
      .filter(({ result }) => result.resultingState === 'retained')
      .map((assessment) => [assessment.ruleId, assessment])).values()]
    if (retention.length >= 3) state = 'retained'
    const reviewStage = demonstration.length > 0 && retention.length < 3
      ? Math.min(3, retention.length + 1)
      : undefined
    const reviewIntervals = [1, 7, 21] as const
    const latestReviewAnchor = retention.at(-1)?.evaluatedAt ?? demonstration.at(-1)?.evaluatedAt
    const nextReviewAt = reviewStage && latestReviewAnchor
      ? addDays(latestReviewAnchor, reviewIntervals[reviewStage - 1])
      : undefined
    const strengthBase = active.length === 0 ? 0 : Math.min(1, active.reduce((sum, record) => sum + record.confidence, 0) / Math.max(1, active.length))
    const overdueDays = nextReviewAt
      ? Math.max(0, (Date.parse(this.now()) - Date.parse(nextReviewAt)) / 86_400_000)
      : 0
    const temporalPenalty = Math.min(0.25, overdueDays * 0.01)
    const strength = Math.max(0, strengthBase - (failedAfterSuccess ? 0.2 : 0) - temporalPenalty)
    return {
      schemaVersion: 1,
      profileId,
      competencyId,
      state,
      strength,
      primaryEvidenceIds: passed.at(-1)?.evidenceIds ?? active.map(({ id }) => id),
      latestValidEvidenceAt: active.at(-1)?.observedAt,
      firstDemonstratedAt: demonstration[0]?.evaluatedAt,
      latestDemonstratedAt: demonstration.at(-1)?.evaluatedAt,
      firstTransferredAt: transfer[0]?.evaluatedAt,
      latestTransferredAt: transfer.at(-1)?.evaluatedAt,
      transferEvidenceIds: transfer.at(-1)?.evidenceIds ?? [],
      retentionCandidateAt: nextReviewAt,
      reviewStage,
      nextReviewAt,
      retentionEvidenceIds: [...new Set(retention.flatMap(({ evidenceIds }) => evidenceIds))],
      reasons: [
        `${active.length} ${active.length === 1 ? 'resultado guardado' : 'resultados guardados'}.`,
        `${passed.length} ${passed.length === 1 ? 'evaluación superada' : 'evaluaciones superadas'}.`,
        ...(nextReviewAt ? [`Repaso ${reviewStage} de 3 programado para ${nextReviewAt}.`] : []),
        ...(overdueDays > 0 ? [`El repaso lleva ${Math.floor(overdueDays)} día(s) vencido; la confianza baja sin borrar el logro.`] : []),
        ...(failedAfterSuccess ? ['Un fallo posterior reduce la confianza actual sin borrar el logro histórico.'] : []),
      ],
      projectorVersion: '1.1.0',
      calculatedAt: this.now(),
    }
  }
}
