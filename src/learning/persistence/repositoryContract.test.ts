import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { IndexedDbLearningRepository } from './indexedDbRepository'
import { MemoryLearningRepository } from './memoryRepository'
import {
  LearningRepositorySnapshotSchema,
  emptyLearningRepositorySnapshot,
  type LearningRepositorySnapshot,
} from './models'
import type { LearningRepository } from './repository'
import { SqliteLearningRepository, type LearningNativeGateway } from './sqliteRepository'
import { evidenceFixture, eventFixture, profileFixture, sessionFixture } from './testFixtures'

class FakeSqliteGateway implements LearningNativeGateway {
  snapshotValue: LearningRepositorySnapshot = emptyLearningRepositorySnapshot()
  failNextReplace = false

  async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (command === 'learning_database_info_native') {
      return {
        path: 'test/learning.sqlite3',
        schemaVersion: 1,
        currentSchemaVersion: 1,
        integrity: 'ok',
        foreignKeys: true,
      } as T
    }
    if (command === 'learning_snapshot_native') {
      return structuredClone(this.snapshotValue) as T
    }
    if (command === 'learning_replace_snapshot_native') {
      if (this.failNextReplace) {
        this.failNextReplace = false
        throw new Error('fallo SQLite simulado')
      }
      this.snapshotValue = LearningRepositorySnapshotSchema.parse(args?.value)
      return undefined as T
    }
    throw new Error(`Comando inesperado: ${command}`)
  }
}

async function exercise(repository: LearningRepository): Promise<Record<string, unknown>> {
  await repository.initialize()
  await repository.putProfile(profileFixture())
  await repository.putSession(sessionFixture())
  await repository.appendEvents([eventFixture(0), eventFixture(1)])
  const retry = await repository.appendEvents([eventFixture(1)])
  await repository.addEvidence(evidenceFixture())
  await expect(repository.addEvidence({ ...evidenceFixture(), confidence: 0.2 })).rejects.toMatchObject({ code: 'conflict' })
  await expect(repository.transaction(async (transaction) => {
    await transaction.putProfile(profileFixture('profile.rollback'))
    throw new Error('rollback contractual')
  })).rejects.toThrow('rollback contractual')
  const snapshot = await repository.snapshot()
  const result = {
    profiles: snapshot.profiles.map(({ id }) => id),
    sessions: snapshot.sessions.map(({ id }) => id),
    events: snapshot.events.map(({ id, sequence }) => ({ id, sequence })),
    evidence: snapshot.evidence.map(({ id }) => id),
    duplicates: retry.duplicates,
    rollbackAbsent: !snapshot.profiles.some(({ id }) => id === 'profile.rollback'),
  }
  await repository.close()
  return result
}

describe('LearningRepository semantic equivalence', () => {
  it('runs the same observable contract in memory, IndexedDB and SQLite adapter', async () => {
    const memory = new MemoryLearningRepository()
    const indexeddb = new IndexedDbLearningRepository({
      databaseName: `contract-${crypto.randomUUID()}`,
      indexedDB: new IDBFactory(),
    })
    const sqlite = new SqliteLearningRepository(new FakeSqliteGateway())
    const results = await Promise.all([exercise(memory), exercise(indexeddb), exercise(sqlite)])
    expect(results[1]).toEqual(results[0])
    expect(results[2]).toEqual(results[0])
  })

  it('does not publish a failed native snapshot replacement', async () => {
    const gateway = new FakeSqliteGateway()
    const repository = new SqliteLearningRepository(gateway)
    await repository.initialize()
    await repository.putProfile(profileFixture())
    gateway.failNextReplace = true
    await expect(repository.putProfile(profileFixture('profile.not-committed'))).rejects.toThrow('fallo SQLite simulado')
    expect((await repository.listProfiles()).items.map(({ id }) => id)).toEqual(['profile.local-default'])
  })
})

