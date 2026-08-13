import { describe, expect, it } from 'vitest'
import type { RuntimeEvent } from '../runtime/events'
import {
  AssessmentEngine,
  assessmentConditionForSingleAttempt,
  type CompositeAssessmentRule,
} from './assessmentEngine'
import { EvidenceProjectionEngine } from './evidenceEngine'
import { RuntimeEventIngestionService } from './ingestion'
import { MasteryProjectionEngine } from './masteryEngine'
import { MemoryLearningRepository } from './memoryRepository'
import { LearningProfileService } from './profileService'
import { LearningRecoveryService } from './recoveryService'
import { LearningSessionService } from './sessionService'
import { FIXED_NOW, PROJECT_HASH, evidenceFixture, eventFixture, profileFixture, sessionFixture } from './testFixtures'

async function repository() {
  const repo = new MemoryLearningRepository()
  await repo.initialize()
  return repo
}

function runtimeEvent(sequence: number, type: RuntimeEvent['type'], data: Partial<RuntimeEvent> = {}): RuntimeEvent {
  return {
    eventVersion: 1,
    sequence,
    type,
    timestamp: FIXED_NOW,
    sessionId: 'runtime.session',
    sceneId: 'scene.test',
    ...data,
  }
}

describe('persistent learning services', () => {
  it('creates a pseudonymous default profile and additional isolated profiles', async () => {
    const repo = await repository()
    const service = new LearningProfileService(repo, () => FIXED_NOW)
    expect((await service.ensureDefaultProfile()).id).toBe('profile.local-default')
    await service.createProfile('Segundo', 'es-ES', 'profile.second')
    expect((await repo.listProfiles()).total).toBe(2)
  })

  it('enforces the persistent session lifecycle and contractual completion', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    const service = new LearningSessionService(repo, () => FIXED_NOW, () => 'generated')
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    await expect(service.transition('session.test', 'completed')).rejects.toMatchObject({ code: 'constraint' })
    await repo.appendEvents([{ ...eventFixture(0), type: 'scene-completed' }])
    await service.checkpoint('session.test', {
      schemaVersion: 1,
      packageId: 'test.contract-pack',
      packageVersion: '1.0.0',
      sceneId: 'scene.test',
      timelinePositionMs: 1000,
      resolvedBarrierIds: [],
      provisionalAnswers: {},
      hintIds: [],
      educationalState: {},
      lastPersistedSequence: 0,
      projectFingerprint: PROJECT_HASH,
      capabilities: ['learning.scene-runtime@1.0.0'],
      runtimeVersion: '1.0.0',
      createdAt: FIXED_NOW,
      complete: true,
    })
    expect((await service.transition('session.test', 'completed')).state).toBe('completed')
    await expect(service.transition('session.test', 'active')).rejects.toMatchObject({ code: 'invalid-transition' })
  })

  it('marks open sessions interrupted and restarts as a new traceable attempt', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    const service = new LearningSessionService(repo, () => FIXED_NOW, () => 'new-attempt')
    expect(await service.markOpenSessionsInterrupted('crash')).toEqual(['session.test'])
    const restarted = await service.restartAsNewAttempt('session.test')
    expect(restarted).toMatchObject({ id: 'session.new-attempt', attempt: 2, originSessionId: 'session.test', state: 'created' })
  })

  it('ingests runtime events with persistent sequencing, idempotency and ephemeral filtering', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    const ingestion = new RuntimeEventIngestionService(repo, () => FIXED_NOW)
    const batch = [
      runtimeEvent(0, 'selector-resolved'),
      runtimeEvent(1, 'scene-started'),
      runtimeEvent(2, 'answer-submitted', { data: { questionId: 'q1' } }),
    ]
    const first = await ingestion.ingest('session.test', batch)
    const retry = await ingestion.ingest('session.test', batch)
    expect(first.ephemeralSequences).toEqual([0])
    expect(first.persistedEventIds).toHaveLength(2)
    expect(first.checkpointRequested).toBe(true)
    expect(retry.duplicateEventIds).toHaveLength(2)
    expect((await repo.listEvents('session.test')).items.map(({ sequence }) => sequence)).toEqual([0, 1])
  })

  it('derives immutable versioned evidence and records help without penalizing accessibility', async () => {
    const repo = await repository()
    await repo.putProfile({ ...profileFixture(), accessibility: { ...profileFixture().accessibility, adaptations: ['screen-reader'] } })
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    const ingestion = new RuntimeEventIngestionService(repo, () => FIXED_NOW)
    await ingestion.ingest('session.test', [
      runtimeEvent(0, 'hint-requested', { data: { hintId: 'hint.1' } }),
      runtimeEvent(1, 'answer-submitted', { data: { questionId: 'q1' } }),
    ])
    const projected = await new EvidenceProjectionEngine(repo, undefined, () => FIXED_NOW).projectSession('session.test')
    expect(projected).toHaveLength(1)
    expect(projected[0].content.hintEventIds).toHaveLength(1)
    expect(projected[0].accessibilityAccommodations).toEqual(['screen-reader'])
    expect(projected[0].confidence).toBe(0.7)
    await expect(repo.addEvidence({ ...projected[0], confidence: 0 })).rejects.toMatchObject({ code: 'conflict' })
  })

  it('evaluates a bounded composite rubric reproducibly', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'completed' })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    await repo.addEvidence(evidenceFixture())
    const rule: CompositeAssessmentRule = {
      id: 'rubric.composite',
      version: '1.0.0',
      competencyId: 'competency.test',
      targetState: 'demonstrated',
      condition: {
        op: 'all',
        conditions: [
          { op: 'minimum-evidence', count: 1 },
          { op: 'exists', filter: { evidenceType: 'written-response', minimumConfidence: 0.8 } },
          { op: 'not', condition: { op: 'count', filter: { status: 'invalidated' }, compare: 'gt', value: 0 } },
        ],
      },
    }
    const engine = new AssessmentEngine(repo, () => FIXED_NOW)
    const first = await engine.evaluate('profile.local-default', rule)
    const second = await engine.evaluate('profile.local-default', rule, 'current')
    expect(first.result).toMatchObject({ passed: true, resultingState: 'demonstrated' })
    expect(second.inputHash).toBe(first.inputHash)
    expect((await repo.listAssessments('profile.local-default')).total).toBe(2)
  })

  it('scopes an independent demonstration rubric to the current session', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'completed' })
    await repo.putSession({ ...sessionFixture('session.current'), state: 'completed' })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    await repo.appendEvents([
      { ...eventFixture(0, 'session.current'), id: 'event.current.0' },
      { ...eventFixture(1, 'session.current'), id: 'event.current.1' },
    ])
    await repo.addEvidence({
      ...evidenceFixture(),
      evidenceType: 'classification',
    })
    await repo.addEvidence({
      ...evidenceFixture('evidence.current.partial', 'session.current'),
      evidenceType: 'written-response',
      sourceEventIds: ['event.current.1'],
      hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    })
    const rule: CompositeAssessmentRule = {
      id: 'rubric.current-session-demonstration',
      version: '1.0.0',
      competencyId: 'competency.test',
      targetState: 'demonstrated',
      condition: {
        op: 'in-session',
        sessionId: 'session.current',
        condition: { op: 'exists', filter: { evidenceType: 'classification', minimumConfidence: 1 } },
      },
    }
    const engine = new AssessmentEngine(repo, () => FIXED_NOW)
    const historicalOnly = await engine.evaluate('profile.local-default', rule)
    expect(historicalOnly.result).toMatchObject({ passed: false, resultingState: 'practising' })

    await repo.addEvidence({
      ...evidenceFixture('evidence.current.complete', 'session.current'),
      evidenceType: 'classification',
      sourceEventIds: ['event.current.1'],
      hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    })
    const current = await engine.evaluate('profile.local-default', rule, 'current')
    expect(current.result).toMatchObject({ passed: true, resultingState: 'demonstrated' })
    expect(current.explanation.summary).toContain('session session.current scoped evidence 2')
  })

  it('separa la corrección del intento de los requisitos históricos de una demostración', () => {
    const authored: CompositeAssessmentRule['condition'] = {
      op: 'all',
      conditions: [
        {
          op: 'count',
          filter: { evidenceType: 'classification', status: 'active', minimumConfidence: 1 },
          compare: 'gte',
          value: 2,
        },
        { op: 'compare', metric: 'distinct-sessions', compare: 'gte', value: 2 },
        { op: 'independent-later-evidence', minimumDays: 1, differentSession: true },
      ],
    }

    expect(assessmentConditionForSingleAttempt(authored)).toEqual({
      op: 'count',
      filter: { evidenceType: 'classification', status: 'active', minimumConfidence: 1 },
      compare: 'gte',
      value: 1,
    })
  })

  it('reduce solo umbrales histÃ³ricos de repeticiÃ³n y conserva secuencias y lÃ­mites superiores', () => {
    expect(assessmentConditionForSingleAttempt({ op: 'minimum-evidence', count: 3 }))
      .toEqual({ op: 'minimum-evidence', count: 1 })
    expect(assessmentConditionForSingleAttempt({
      op: 'sequence',
      evidenceTypes: ['observation', 'procedure'],
    })).toEqual({
      op: 'sequence',
      evidenceTypes: ['observation', 'procedure'],
    })
    expect(assessmentConditionForSingleAttempt({
      op: 'count',
      filter: { status: 'invalidated' },
      compare: 'lte',
      value: 0,
    })).toEqual({
      op: 'count',
      filter: { status: 'invalidated' },
      compare: 'lte',
      value: 0,
    })
  })

  it('requires later independent evidence for retained and rebuilds mastery from source records', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'completed' })
    await repo.putSession({ ...sessionFixture('session.later'), state: 'completed' })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    await repo.appendEvents([{ ...eventFixture(0, 'session.later'), id: 'event.later.0' }, { ...eventFixture(1, 'session.later'), id: 'event.later.1' }])
    await repo.addEvidence(evidenceFixture())
    await repo.addEvidence({
      ...evidenceFixture('evidence.later', 'session.later'),
      sourceEventIds: ['event.later.1'],
      observedAt: '2026-08-03T09:00:00.000Z',
      createdAt: '2026-08-03T09:00:00.000Z',
      hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    })
    const demonstrationRule: CompositeAssessmentRule = {
      id: 'rubric.demonstration',
      version: '1.0.0',
      competencyId: 'competency.test',
      targetState: 'demonstrated',
      condition: { op: 'minimum-evidence', count: 1 },
    }
    await new AssessmentEngine(repo, () => '2026-07-23T10:00:00.000Z').evaluate('profile.local-default', demonstrationRule)
    const rule: CompositeAssessmentRule = {
      id: 'rubric.retention.1',
      version: '1.0.0',
      competencyId: 'competency.test',
      targetState: 'retained',
      condition: {
        op: 'all',
        conditions: [
          { op: 'independent-later-evidence', minimumDays: 7, differentSession: true },
          { op: 'evidence-from-session', sessionId: 'session.later', minimumCount: 1 },
          { op: 'session-without-hints', sessionId: 'session.later' },
        ],
      },
    }
    const assessment = await new AssessmentEngine(repo, () => '2026-08-03T10:00:00.000Z').evaluate('profile.local-default', rule)
    expect(assessment.result.resultingState).toBe('retained')
    const afterFirstReview = await new MasteryProjectionEngine(repo, () => '2026-08-03T10:00:00.000Z').rebuild('profile.local-default')
    expect(afterFirstReview[0].state).toBe('demonstrated')
    expect(afterFirstReview[0].reviewStage).toBe(2)
    expect(afterFirstReview[0].nextReviewAt).toBe('2026-08-10T10:00:00.000Z')
    await repo.addAssessment({
      ...assessment,
      id: 'assessment.retention.stage-2',
      ruleId: 'rubric.retention.2',
      evaluatedAt: '2026-08-10T10:00:00.000Z',
    })
    await repo.addAssessment({
      ...assessment,
      id: 'assessment.retention.stage-3',
      ruleId: 'rubric.retention.3',
      evaluatedAt: '2026-08-31T10:00:00.000Z',
    })
    const first = await new MasteryProjectionEngine(repo, () => '2026-08-31T10:00:00.000Z').rebuild('profile.local-default')
    await repo.clearMastery('profile.local-default')
    const rebuilt = await new MasteryProjectionEngine(repo, () => '2026-08-31T10:00:00.000Z').rebuild('profile.local-default')
    expect(rebuilt).toEqual(first)
    expect(rebuilt[0].state).toBe('retained')
    expect(rebuilt[0].reviewStage).toBeUndefined()
    expect(rebuilt[0].nextReviewAt).toBeUndefined()
    expect(rebuilt[0].retentionCandidateAt).toBe(rebuilt[0].nextReviewAt)
  })

  it('rejects assisted or historical-only evidence for a new independent attempt', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'completed' })
    await repo.putSession({ ...sessionFixture('session.assisted'), state: 'completed' })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    await repo.appendEvents([{ ...eventFixture(0, 'session.assisted'), id: 'event.assisted.0' }, { ...eventFixture(1, 'session.assisted'), id: 'event.assisted.1' }])
    await repo.addEvidence(evidenceFixture())
    await repo.addEvidence({
      ...evidenceFixture('evidence.assisted', 'session.assisted'),
      sourceEventIds: ['event.assisted.1'],
      content: { accepted: true, hintEventIds: ['event.hint'] },
      observedAt: '2026-08-03T09:00:00.000Z',
      createdAt: '2026-08-03T09:00:00.000Z',
      hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    })
    const result = await new AssessmentEngine(repo, () => '2026-08-03T10:00:00.000Z').evaluate('profile.local-default', {
      id: 'rubric.independent.current-session',
      version: '1.0.0',
      competencyId: 'competency.test',
      targetState: 'demonstrated',
      condition: {
        op: 'all',
        conditions: [
          { op: 'evidence-from-session', sessionId: 'session.assisted', minimumCount: 1 },
          { op: 'session-without-hints', sessionId: 'session.assisted' },
        ],
      },
    })
    expect(result.result.passed).toBe(false)
    expect(result.explanation.summary).toContain('hints 1')
  })

  it('produces a recovery report before resuming a changed project', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({
      ...sessionFixture(),
      state: 'interrupted',
      checkpoint: {
        schemaVersion: 1,
        packageId: 'test.contract-pack',
        packageVersion: '1.0.0',
        sceneId: 'scene.test',
        timelinePositionMs: 100,
        resolvedBarrierIds: [],
        provisionalAnswers: {},
        hintIds: [],
        educationalState: {},
        lastPersistedSequence: -1,
        projectFingerprint: PROJECT_HASH,
        capabilities: ['learning.scene-runtime@1.0.0'],
        runtimeVersion: '1.0.0',
        createdAt: FIXED_NOW,
        complete: true,
      },
    })
    const report = await new LearningRecoveryService(repo).inspect('session.test', {
      packageAvailable: true,
      exactPackageVersionAvailable: true,
      projectAvailable: true,
      currentProjectFingerprint: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      currentCapabilities: ['learning.scene-runtime@1.0.0'],
      currentRuntimeVersion: '1.1.0',
      migrationsPending: false,
      selectorsReproducible: true,
    })
    expect(report.resumable).toBe(true)
    expect(report.projectChange).toBe('changed-reproducible')
    expect(report.allowedActions).toContain('rebase')
  })
})
