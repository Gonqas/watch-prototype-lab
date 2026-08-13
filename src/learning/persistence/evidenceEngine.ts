import { z } from 'zod'
import { sha256Fingerprint } from './fingerprints'
import {
  PersistentEvidenceTypeSchema,
  PersistentLearningSessionStateSchema,
} from './models'
import type {
  LearningProfile,
  PersistedLearningEvent,
  PersistentEvidenceRecord,
  PersistentEvidenceType,
  PersistentLearningSession,
} from './models'
import type { LearningRepository } from './repository'

export interface EvidenceExtractionRule {
  id: string
  version: string
  triggerEventType: string
  evidenceType: PersistentEvidenceType
  competencyId: string
  packageId?: string
  activityIds?: string[]
  evidenceTemplateId?: string
  minimumSessionState?: PersistentLearningSession['state'][]
  confidence: number
  contentFields: string[]
}

export interface EvidenceProjectionScope {
  packageId: string
  packageVersion: string
  activityId: string
  evidenceTemplateIds: string[]
  extractionRuleIds: string[]
}

export const EvidenceProjectionScopeSchema: z.ZodType<EvidenceProjectionScope> = z.object({
  packageId: z.string().min(1).max(200),
  packageVersion: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/),
  activityId: z.string().min(1).max(200),
  evidenceTemplateIds: z.array(z.string().min(1).max(200)).min(1),
  extractionRuleIds: z.array(z.string().min(1).max(200)).min(1),
}).strict()

export const EvidenceExtractionRuleSchema: z.ZodType<EvidenceExtractionRule> = z.object({
  id: z.string().min(1).max(160),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  triggerEventType: z.string().min(1).max(120),
  evidenceType: PersistentEvidenceTypeSchema,
  competencyId: z.string().min(1).max(160),
  packageId: z.string().min(1).max(200).optional(),
  activityIds: z.array(z.string().min(1).max(200)).min(1).optional(),
  evidenceTemplateId: z.string().min(1).max(200).optional(),
  minimumSessionState: z.array(PersistentLearningSessionStateSchema).min(1).optional(),
  confidence: z.number().min(0).max(1),
  contentFields: z.array(z.string().min(1).max(120)).max(50),
}).strict()

export const EXAMPLE_EVIDENCE_RULES: EvidenceExtractionRule[] = [
  {
    id: 'evidence.selection-confirmed',
    version: '1.0.0',
    triggerEventType: 'selection-confirmed',
    evidenceType: 'selection',
    competencyId: 'competency.identify-components',
    confidence: 1,
    contentFields: ['sceneId', 'entityIds'],
  },
  {
    id: 'evidence.written-answer',
    version: '1.0.0',
    triggerEventType: 'answer-submitted',
    evidenceType: 'written-response',
    competencyId: 'competency.explain-mechanism',
    confidence: 0.85,
    contentFields: ['sceneId', 'data'],
  },
  {
    id: 'evidence.sequence-completed',
    version: '1.0.0',
    triggerEventType: 'scene-completed',
    evidenceType: 'sequence',
    competencyId: 'competency.follow-procedure',
    minimumSessionState: ['active', 'paused', 'completed'],
    confidence: 1,
    contentFields: ['sceneId'],
  },
]

export class EvidenceProjectionEngine {
  private readonly repository: LearningRepository
  private readonly rules: EvidenceExtractionRule[]
  private readonly now: () => string

  constructor(
    repository: LearningRepository,
    rules: EvidenceExtractionRule[] = EXAMPLE_EVIDENCE_RULES,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.repository = repository
    this.rules = structuredClone(rules)
    this.now = now
  }

  async projectSession(
    sessionId: string,
    scopeInput?: EvidenceProjectionScope,
  ): Promise<PersistentEvidenceRecord[]> {
    return this.repository.transaction(async (transaction) => {
      const session = await transaction.getSession(sessionId)
      if (!session) throw new Error(`Sesión inexistente: ${sessionId}.`)
      const profile = await transaction.getProfile(session.profileId)
      if (!profile) throw new Error(`Perfil inexistente: ${session.profileId}.`)
      const scope = scopeInput ? EvidenceProjectionScopeSchema.parse(scopeInput) : undefined
      if (
        scope
        && (
          scope.packageId !== session.packageId
          || scope.packageVersion !== session.packageVersion
          || scope.activityId !== session.activityId
        )
      ) {
        throw new Error('El ambito de evidencia no coincide con el paquete y actividad de la sesion.')
      }
      const scopedRuleIds = scope ? new Set(scope.extractionRuleIds) : undefined
      const scopedTemplateIds = scope ? new Set(scope.evidenceTemplateIds) : undefined
      const eligibleRules = this.rules.filter((rule) =>
        (!scopedRuleIds || scopedRuleIds.has(rule.id))
        && (!rule.packageId || rule.packageId === session.packageId)
        && (!rule.activityIds || rule.activityIds.includes(session.activityId))
        && (!rule.evidenceTemplateId || scopedTemplateIds?.has(rule.evidenceTemplateId) !== false))
      const events = (await transaction.listEvents(sessionId, { limit: 500 })).items
      const created: PersistentEvidenceRecord[] = []
      for (const event of events) {
        if (event.compatibility !== 'supported') continue
        for (const rule of eligibleRules.filter(({ triggerEventType }) => triggerEventType === event.type)) {
          if (rule.minimumSessionState && !rule.minimumSessionState.includes(session.state)) continue
          const record = await this.derive(rule, event, session, profile, events, scope)
          await transaction.addEvidence(record)
          created.push(record)
        }
      }
      return created
    })
  }

  async invalidate(evidenceId: string, reason: string): Promise<PersistentEvidenceRecord> {
    const source = await this.repository.getEvidence(evidenceId)
    if (!source) throw new Error(`Evidencia inexistente: ${evidenceId}.`)
    const timestamp = this.now()
    const base = {
      ...source,
      id: `${source.id}.invalidation.${timestamp}`,
      sourceEventIds: [...source.sourceEventIds],
      content: { operation: 'invalidation' },
      confidence: 1,
      uncertainty: undefined,
      createdAt: timestamp,
      status: 'invalidated' as const,
      relatedEvidenceId: source.id,
      reason,
      provenance: [...source.provenance],
    }
    const record = { ...base, hash: await sha256Fingerprint(base) }
    await this.repository.addEvidence(record)
    return record
  }

  async supersede(
    evidenceId: string,
    replacementEvidenceId: string,
    reason: string,
  ): Promise<PersistentEvidenceRecord> {
    const source = await this.repository.getEvidence(evidenceId)
    const replacement = await this.repository.getEvidence(replacementEvidenceId)
    if (!source || !replacement) throw new Error('La sustitución requiere evidencia de origen y reemplazo existentes.')
    if (source.profileId !== replacement.profileId || source.competencyId !== replacement.competencyId) {
      throw new Error('La evidencia de reemplazo debe pertenecer al mismo perfil y competencia.')
    }
    const timestamp = this.now()
    const base = {
      ...source,
      id: `${source.id}.supersession.${timestamp}`,
      sourceEventIds: [...source.sourceEventIds],
      content: { operation: 'supersession', replacementEvidenceId },
      confidence: 1,
      uncertainty: undefined,
      createdAt: timestamp,
      status: 'superseded' as const,
      relatedEvidenceId: source.id,
      reason,
      provenance: [...source.provenance],
    }
    const record = { ...base, hash: await sha256Fingerprint(base) }
    await this.repository.addEvidence(record)
    return record
  }

  private async derive(
    rule: EvidenceExtractionRule,
    event: PersistedLearningEvent,
    session: PersistentLearningSession,
    profile: LearningProfile,
    allEvents: PersistedLearningEvent[],
    scope?: EvidenceProjectionScope,
  ): Promise<PersistentEvidenceRecord> {
    const content = Object.fromEntries(rule.contentFields
      .filter((field) => event.payload[field] !== undefined)
      .map((field) => [field, structuredClone(event.payload[field])]))
    const hintEvents = allEvents
      .filter((candidate) => candidate.sequence <= event.sequence && candidate.type === 'hint-requested')
    const hintEventIds = hintEvents.map(({ id }) => id)
    const hintIds = hintEvents.map(({ id, payload }) => {
      const data = payload.data && typeof payload.data === 'object'
        ? payload.data as Record<string, unknown>
        : {}
      return typeof data.hintId === 'string' ? data.hintId : id
    })
    const eventData = event.payload.data && typeof event.payload.data === 'object'
      ? event.payload.data as Record<string, unknown>
      : {}
    const pendingReview = eventData.pendingReview === true
    const incorrect = eventData.correct === false
    const incomplete = eventData.complete === false
    const assisted = hintEvents.length > 0
    const confidence = pendingReview
      ? Math.min(rule.confidence, 0.35)
      : incorrect || incomplete
        ? Math.min(rule.confidence, 0.25)
        : assisted
          ? Math.min(rule.confidence, 0.7)
          : rule.confidence
    const uncertainty = pendingReview
      ? 0.65
      : incorrect || incomplete
        ? 0.75
        : assisted
          ? 0.3
          : undefined
    const base = {
      schemaVersion: 1 as const,
      profileId: session.profileId,
      sessionId: session.id,
      competencyId: rule.competencyId,
      evidenceType: rule.evidenceType,
      sourceEventIds: [event.id],
      packageId: session.packageId,
      packageVersion: session.packageVersion,
      activityId: session.activityId,
      activityVersion: session.activityVersion,
      extractionRuleId: rule.id,
      extractionRuleVersion: rule.version,
      content: {
        ...content,
        hintEventIds,
        hintIds,
        evaluation: {
          complete: eventData.complete ?? null,
          correct: eventData.correct ?? null,
          pendingReview,
          satisfiedComponentIds: eventData.satisfiedComponentIds ?? [],
          unsatisfiedComponentIds: eventData.unsatisfiedComponentIds ?? [],
        },
        projectionScope: scope
          ? {
            packageId: scope.packageId,
            packageVersion: scope.packageVersion,
            activityId: scope.activityId,
            evidenceTemplateIds: [...scope.evidenceTemplateIds],
          }
          : null,
      },
      confidence,
      uncertainty,
      accessibilityAccommodations: [...profile.accessibility.adaptations],
      observedAt: event.timestamp,
      createdAt: event.persistedAt,
      status: 'active' as const,
      provenance: [
        { kind: 'runtime-event' as const, reference: event.id },
        { kind: 'package' as const, reference: `${session.packageId}@${session.packageVersion}` },
        { kind: 'project-fingerprint' as const, reference: session.currentProjectFingerprint },
      ],
    }
    const hash = await sha256Fingerprint(base)
    return { ...base, id: `evidence.${hash.slice(7, 31)}`, hash }
  }
}
