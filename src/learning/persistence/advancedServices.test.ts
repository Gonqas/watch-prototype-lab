import { strFromU8, unzipSync } from 'fflate'
import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { RuntimeEventEmitter } from '../runtime/events'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { encodeLearningPackage, LearningPackageLoader } from '../runtime/packageLoader'
import { AssessmentEngine, type CompositeAssessmentRule } from './assessmentEngine'
import { LearningBackupScheduler, type ScheduledBackupOperations } from './backupScheduler'
import {
  IndexedDbLearningBinaryStorage,
  MemoryLearningBinaryStorage,
  type LearningBinaryStorage,
} from './binaryStorage'
import { LearningPersistenceCoordinator } from './coordinator'
import { EvidenceProjectionEngine } from './evidenceEngine'
import { LearningExportService } from './exportService'
import { RuntimeEventIngestionService } from './ingestion'
import { MasteryProjectionEngine } from './masteryEngine'
import { MemoryLearningRepository } from './memoryRepository'
import type { LearningBackupRecord } from './models'
import { LearningPackageInstallationService } from './packageInstallation'
import { LearningProfileService } from './profileService'
import { LearningRecoveryService } from './recoveryService'
import { LearningSessionService } from './sessionService'
import { FIXED_NOW, evidenceFixture, eventFixture, profileFixture, sessionFixture } from './testFixtures'

async function repository() {
  const value = new MemoryLearningRepository()
  await value.initialize()
  return value
}

function packageBytes(version = '1.0.0') {
  const pack = createRuntimeLearningPackFixture()
  pack.manifest.packageVersion = version
  return encodeLearningPackage(pack, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
}

describe('advanced persistent learning behaviour', () => {
  it('coordinates real System 1 emitter events without System 1 knowing persistence', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    const coordinator = new LearningPersistenceCoordinator(
      new RuntimeEventIngestionService(repo, () => FIXED_NOW),
      new EvidenceProjectionEngine(repo, undefined, () => FIXED_NOW),
      new LearningSessionService(repo, () => FIXED_NOW),
    )
    const emitter = new RuntimeEventEmitter('runtime.real', () => FIXED_NOW)
    const binding = coordinator.bind('session.test', emitter)
    emitter.emit({ type: 'selector-resolved', sceneId: 'scene.test' })
    emitter.emit({ type: 'scene-started', sceneId: 'scene.test' })
    emitter.emit({ type: 'answer-submitted', sceneId: 'scene.test', data: { questionId: 'q1' } })
    const receipts = await binding.flush()
    expect(receipts.flatMap(({ ephemeralSequences }) => ephemeralSequences)).toEqual([0])
    expect((await repo.listEvents('session.test')).total).toBe(2)
    expect(await binding.projectEvidence()).toHaveLength(1)
    await binding.dispose()
  })

  it('reports all recovery blockers before offering a resume', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'interrupted' })
    const report = await new LearningRecoveryService(repo).inspect('session.test', {
      packageAvailable: false,
      exactPackageVersionAvailable: false,
      projectAvailable: false,
      currentCapabilities: [],
      currentRuntimeVersion: '2.0.0',
      migrationsPending: true,
      selectorsReproducible: false,
    })
    expect(report.resumable).toBe(false)
    expect(report.issues.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'RECOVERY-PACKAGE-MISSING',
      'RECOVERY-CHECKPOINT-INCOMPLETE',
      'RECOVERY-MIGRATION-PENDING',
      'RECOVERY-CAPABILITIES-DIFFERENT',
      'RECOVERY-RUNTIME-MAJOR',
      'RECOVERY-PROJECT-MISSING',
    ]))
    expect(report.allowedActions).not.toContain('resume')
  })

  it('preserves future runtime events read-only and rejects events in a terminal session', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    const ingestion = new RuntimeEventIngestionService(repo, () => FIXED_NOW)
    await ingestion.ingest('session.test', [{
      eventVersion: 2,
      sequence: 0,
      type: 'scene-started',
      timestamp: FIXED_NOW,
      sessionId: 'runtime.future',
      sceneId: 'scene.test',
    } as never])
    expect((await repo.listEvents('session.test')).items[0].compatibility).toBe('future-preserved')
    await repo.putSession({ ...sessionFixture(), state: 'completed', completedAt: FIXED_NOW })
    await expect(ingestion.ingest('session.test', [{
      eventVersion: 1,
      sequence: 1,
      type: 'answer-submitted',
      timestamp: FIXED_NOW,
      sessionId: 'runtime.future',
    }])).rejects.toMatchObject({ code: 'invalid-transition' })
  })

  it('derives evidence reproducibly and tracks invalidation and supersession immutably', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'active' })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    const engine = new EvidenceProjectionEngine(repo, undefined, () => '2099-01-01T00:00:00.000Z')
    const first = await engine.projectSession('session.test')
    const second = await engine.projectSession('session.test')
    expect(second[0]).toEqual(first[0])
    const replacement = {
      ...first[0],
      id: 'evidence.replacement',
      content: { corrected: true },
      hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    }
    await repo.addEvidence(replacement)
    await engine.supersede(first[0].id, replacement.id, 'Corrección revisada')
    await engine.invalidate(replacement.id, 'Fuente revocada')
    const records = (await repo.listEvidence('profile.local-default')).items
    expect(records.map(({ status }) => status)).toEqual(expect.arrayContaining(['active', 'superseded', 'invalidated']))
    expect(first[0].hash).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('evaluates any, ordered sequence and explainable weighted components', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'completed', completedAt: FIXED_NOW })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    await repo.addEvidence(evidenceFixture())
    await repo.addEvidence({
      ...evidenceFixture('evidence.selection'),
      evidenceType: 'selection',
      observedAt: '2026-07-24T09:00:00.000Z',
      createdAt: '2026-07-24T09:00:00.000Z',
      hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    })
    const rule: CompositeAssessmentRule = {
      id: 'rubric.operators',
      version: '1.0.0',
      competencyId: 'competency.test',
      targetState: 'demonstrated',
      condition: {
        op: 'all',
        conditions: [
          { op: 'any', conditions: [{ op: 'exists', filter: { evidenceType: 'diagnosis' } }, { op: 'exists', filter: { evidenceType: 'written-response' } }] },
          { op: 'sequence', evidenceTypes: ['written-response', 'selection'] },
          {
            op: 'weighted',
            threshold: 0.6,
            components: [
              { weight: 2, condition: { op: 'exists', filter: { evidenceType: 'selection' } } },
              { weight: 1, condition: { op: 'count', filter: {}, compare: 'gte', value: 3 } },
            ],
          },
        ],
      },
    }
    const result = await new AssessmentEngine(repo, () => FIXED_NOW).evaluate('profile.local-default', rule)
    expect(result.result.passed).toBe(true)
    expect(result.explanation.satisfiedRuleIds).toContain('root.2')
    expect(result.explanation.summary).toContain('weighted')
  })

  it('projects introduced and practising separately, then removes invalidated evidence', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession({ ...sessionFixture(), state: 'completed', completedAt: FIXED_NOW })
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    const selection = { ...evidenceFixture(), evidenceType: 'selection' as const }
    await repo.addEvidence(selection)
    let projection = (await new MasteryProjectionEngine(repo, () => FIXED_NOW).rebuild('profile.local-default'))[0]
    expect(projection.state).toBe('introduced')
    await repo.addEvidence({
      ...evidenceFixture('evidence.practice'),
      hash: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    })
    projection = (await new MasteryProjectionEngine(repo, () => FIXED_NOW).rebuild('profile.local-default'))[0]
    expect(projection.state).toBe('practising')
    const evidence = new EvidenceProjectionEngine(repo, [], () => '2026-07-25T09:00:00.000Z')
    await evidence.invalidate(selection.id, 'Inválida')
    await evidence.invalidate('evidence.practice', 'Inválida')
    projection = (await new MasteryProjectionEngine(repo, () => FIXED_NOW).rebuild('profile.local-default'))[0]
    expect(projection.state).toBe('not_started')
  })

  it('cleans repository staging when binary commit fails', async () => {
    const repo = await repository()
    const memory = new MemoryLearningBinaryStorage()
    const failing: LearningBinaryStorage = {
      stage: (hash, bytes) => memory.stage(hash, bytes),
      commit: async () => { throw new Error('commit fallido') },
      rollback: (hash) => memory.rollback(hash),
      read: (hash) => memory.read(hash),
      remove: (hash) => memory.remove(hash),
    }
    const installer = new LearningPackageInstallationService(
      repo,
      failing,
      new LearningPackageLoader({ applicationVersion: '0.4.1' }),
    )
    await expect(installer.install(packageBytes(), 'integrated')).rejects.toThrow('commit fallido')
    expect((await repo.listPackages()).total).toBe(0)
  })

  it('persists content-addressed package bytes across IndexedDB reopen', async () => {
    const factory = new IDBFactory()
    const name = `binary-${crypto.randomUUID()}`
    const bytes = new TextEncoder().encode('paquete local no recuperable')
    const hash = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const first = new IndexedDbLearningBinaryStorage(name, factory)
    await first.initialize()
    await first.stage(hash, bytes)
    await first.commit(hash)
    await first.close()
    const reopened = new IndexedDbLearningBinaryStorage(name, factory)
    await reopened.initialize()
    expect(await reopened.read(hash)).toEqual(bytes)
    await reopened.close()
  })

  it('merges the same export without duplicating sessions or events and exposes privacy warnings', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    await repo.appendEvents([eventFixture(0)])
    const service = new LearningExportService(repo, () => FIXED_NOW, () => 'import')
    const bytes = await service.exportProfile({
      profileId: 'profile.local-default',
      includeEvents: true,
      includeOwnedAssets: true,
    })
    const manifest = JSON.parse(strFromU8(unzipSync(bytes)['manifest.json'])) as { warnings: string[] }
    expect(manifest.warnings.join(' ')).toContain('privacidad')
    const result = await service.importProfile(bytes, 'merge')
    expect(result.duplicates).toBeGreaterThanOrEqual(3)
    expect((await repo.listSessions('profile.local-default')).total).toBe(1)
    expect((await repo.listEvents('session.test')).total).toBe(1)
    expect((await repo.listRecoveryLog()).at(-1)?.action).toBe('import-profile')
  })

  it('archives and soft-deletes profiles without erasing their history', async () => {
    const repo = await repository()
    const profiles = new LearningProfileService(repo, () => FIXED_NOW)
    await profiles.ensureDefaultProfile()
    await repo.putSession(sessionFixture())
    await profiles.archive('profile.local-default')
    await profiles.softDelete('profile.local-default')
    expect((await repo.listProfiles()).total).toBe(0)
    expect((await repo.listProfiles(undefined, true)).items[0]).toMatchObject({ archived: true, deletedAt: FIXED_NOW })
    expect((await repo.listSessions('profile.local-default')).total).toBe(1)
  })
})

describe('backup scheduling policy', () => {
  it('retains 7 daily and 4 weekly buckets while preserving protected records', async () => {
    const record = (id: string, kind: LearningBackupRecord['kind'], createdAt: string, protectedBackup = false): LearningBackupRecord => ({
      schemaVersion: 1,
      id,
      kind,
      createdAt,
      storageReference: `memory:${id}`,
      manifestHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      databaseHash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      verified: true,
      protected: protectedBackup,
      bytes: 1,
    })
    const values = [
      ...Array.from({ length: 9 }, (_, index) => record(`daily.${index}`, 'scheduled-daily', `2026-07-${(23 - index).toString().padStart(2, '0')}T09:00:00.000Z`)),
      ...Array.from({ length: 6 }, (_, index) => record(`weekly.${index}`, 'scheduled-weekly', `2026-0${7 - index}-01T09:00:00.000Z`)),
      record('daily.protected', 'scheduled-daily', '2025-01-01T09:00:00.000Z', true),
    ]
    const operations: ScheduledBackupOperations = {
      create: async (kind) => {
        const created = record(`created.${kind}`, kind, '2026-07-23T09:00:00.000Z')
        values.push(created)
        return created
      },
      list: async () => structuredClone(values),
      remove: async (id) => {
        const index = values.findIndex((candidate) => candidate.id === id)
        if (index >= 0) values.splice(index, 1)
      },
    }
    const result = await new LearningBackupScheduler(operations, () => '2026-07-23T12:00:00.000Z').runStartup()
    expect(result.created).toEqual(['created.scheduled-weekly'])
    expect(values.filter(({ kind, protected: keep }) => kind === 'scheduled-daily' && !keep)).toHaveLength(7)
    expect(values.filter(({ kind, protected: keep }) => kind === 'scheduled-weekly' && !keep)).toHaveLength(4)
    expect(values.some(({ id }) => id === 'daily.protected')).toBe(true)
  })
})
