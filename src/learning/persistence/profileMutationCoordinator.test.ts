import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it, vi } from 'vitest'
import { IndexedDbLearningRepository } from './indexedDbRepository'
import { MemoryLearningRepository } from './memoryRepository'
import { LearningRepositorySnapshotSchema, emptyLearningRepositorySnapshot, type LearningRepositorySnapshot } from './models'
import { LearningProfileService } from './profileService'
import { ProfileMutationCoordinator } from './profileMutationCoordinator'
import { LearningRepositoryError, type LearningRepository } from './repository'
import { SqliteLearningRepository, type LearningNativeGateway } from './sqliteRepository'
import { profileFixture } from './testFixtures'

class FakeSqliteGateway implements LearningNativeGateway {
  snapshotValue: LearningRepositorySnapshot = emptyLearningRepositorySnapshot()
  async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (command === 'learning_database_info_native') return { path: 'test/learning.sqlite3', schemaVersion: 1, currentSchemaVersion: 1, integrity: 'ok', foreignKeys: true } as T
    if (command === 'learning_snapshot_native') return structuredClone(this.snapshotValue) as T
    if (command === 'learning_replace_snapshot_native') {
      this.snapshotValue = LearningRepositorySnapshotSchema.parse(args?.value)
      return undefined as T
    }
    throw new Error(`Comando inesperado: ${command}`)
  }
}

async function initialized(repository: LearningRepository) {
  await repository.initialize()
  await repository.putProfile(profileFixture())
  return repository
}

async function stress(repository: LearningRepository) {
  const coordinator = new ProfileMutationCoordinator(repository, { createId: (() => { let id = 0; return () => String(++id) })(), now: () => '2026-08-15T10:00:00.000Z' })
  const service = new LearningProfileService(repository, () => '2026-08-15T10:00:00.000Z', coordinator)
  const transitions = Array.from({ length: 100 }, (_, index) => service.updateEducationalPreferences('profile.local-default', (current) => ({
    ...current,
    [`transition${index}`]: true,
    academyStateV1: { revision: index, updatedAt: `2026-08-15T10:00:${String(index % 60).padStart(2, '0')}.000Z` },
  }), 'academy-state'))
  const accessibility = service.update('profile.local-default', { accessibility: { ...profileFixture().accessibility, reducedMotion: true } })
  expect(service.pending('profile.local-default')).toBe(101)
  await Promise.all([...transitions, accessibility])
  await service.flush('profile.local-default')
  const profile = await repository.getProfile('profile.local-default')
  return { profile, diagnostics: service.diagnostics() }
}

describe('ProfileMutationCoordinator 0.14G', () => {
  it('serializa cien transiciones sin perder preferencias en memoria, IndexedDB y el adaptador SQLite', async () => {
    const repositories: LearningRepository[] = [
      await initialized(new MemoryLearningRepository()),
      await initialized(new IndexedDbLearningRepository({ databaseName: `profile-014g-${crypto.randomUUID()}`, indexedDB: new IDBFactory() })),
      await initialized(new SqliteLearningRepository(new FakeSqliteGateway())),
    ]
    for (const repository of repositories) {
      const { profile, diagnostics } = await stress(repository)
      expect(profile?.recordVersion).toBe(102)
      expect(profile?.accessibility.reducedMotion).toBe(true)
      expect(profile?.educationalPreferences.transition0).toBe(true)
      expect(profile?.educationalPreferences.transition99).toBe(true)
      expect(diagnostics).toHaveLength(101)
      expect(diagnostics.every(({ result }) => result === 'succeeded')).toBe(true)
      await repository.close()
    }
  })

  it('reaplica una mutación funcional tras un conflicto y registra procedencia sin PII', async () => {
    const repository = await initialized(new MemoryLearningRepository())
    const original = repository.transaction.bind(repository)
    let calls = 0
    vi.spyOn(repository, 'transaction').mockImplementation(async (work) => {
      calls += 1
      if (calls === 1) throw new LearningRepositoryError('conflict', 'conflicto inyectado', true)
      return original(work)
    })
    const coordinator = new ProfileMutationCoordinator(repository, { maxAttempts: 3, createId: () => 'retry', now: () => '2026-08-15T10:00:00.000Z' })
    const service = new LearningProfileService(repository, () => '2026-08-15T10:00:00.000Z', coordinator)
    await service.updateEducationalPreferences('profile.local-default', (current) => ({ ...current, academyStateV1: { revision: 1 } }), 'academy-state')
    expect(service.diagnostics()[0]).toMatchObject({ attempts: 2, conflictCount: 1, result: 'succeeded', profileHash: expect.stringMatching(/^local-/) })
    expect(service.exportDiagnostics()).not.toContain('profile.local-default')
  })

  it('agota exactamente tres intentos, informa un error recuperable y permite limpiar diagnósticos', async () => {
    const repository = await initialized(new MemoryLearningRepository())
    vi.spyOn(repository, 'transaction').mockRejectedValue(new LearningRepositoryError('conflict', 'conflicto persistente', true))
    const coordinator = new ProfileMutationCoordinator(repository, { maxAttempts: 3, createId: () => 'exhausted', now: () => '2026-08-15T10:00:00.000Z' })
    const service = new LearningProfileService(repository, () => '2026-08-15T10:00:00.000Z', coordinator)
    await expect(service.update('profile.local-default', { displayName: 'Conservado' })).rejects.toMatchObject({ code: 'conflict', retryable: true })
    expect(service.diagnostics()).toEqual([expect.objectContaining({ attempts: 3, conflictCount: 3, result: 'conflict-exhausted' })])
    service.clearDiagnostics()
    expect(service.diagnostics()).toEqual([])
  })

  it('aísla las colas por perfil y flushAll espera las dos', async () => {
    const repository = await initialized(new MemoryLearningRepository())
    await repository.putProfile(profileFixture('profile.second'))
    const coordinator = new ProfileMutationCoordinator(repository)
    const service = new LearningProfileService(repository, undefined, coordinator)
    const first = service.update('profile.local-default', { displayName: 'Primero' })
    const second = service.update('profile.second', { displayName: 'Segundo' })
    expect(service.pending('profile.local-default')).toBe(1)
    expect(service.pending('profile.second')).toBe(1)
    await service.flushAll()
    await Promise.all([first, second])
    expect((await repository.getProfile('profile.local-default'))?.displayName).toBe('Primero')
    expect((await repository.getProfile('profile.second'))?.displayName).toBe('Segundo')
  })
})
