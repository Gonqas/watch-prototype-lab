import { describe, expect, it, vi } from 'vitest'
import { LearningMigrationManager, type LearningMigration } from './migrationManager'
import { MemoryLearningRepository } from './memoryRepository'
import { profileFixture } from './testFixtures'

async function repository() {
  const value = new MemoryLearningRepository()
  await value.initialize()
  return value
}

describe('LearningMigrationManager', () => {
  it('migrates an empty repository incrementally and is idempotent', async () => {
    const repo = await repository()
    const manager = new LearningMigrationManager(repo, {
      now: () => '2026-07-23T09:00:00.000Z',
      monotonicNow: () => 10,
    })
    expect(await manager.migrate()).toEqual([1])
    expect(await manager.migrate()).toEqual([])
    expect((await repo.listMigrations()).map(({ version }) => version)).toEqual([1])
  })

  it('creates a protected backup before migrating existing user data', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    const create = vi.fn(async () => undefined)
    const manager = new LearningMigrationManager(repo, {
      backup: { create },
      now: () => '2026-07-23T09:00:00.000Z',
    })
    await manager.migrate()
    expect(create).toHaveBeenCalledWith('pre-migration', true)
  })

  it('rolls back the failed incremental migration without losing prior versions', async () => {
    const repo = await repository()
    const migrations: LearningMigration[] = [
      { version: 1, name: 'one', source: 'one', apply: async () => undefined },
      {
        version: 2,
        name: 'broken',
        source: 'broken',
        apply: async (transaction) => {
          await transaction.putProfile(profileFixture('profile.temporary'))
          throw new Error('fallo intermedio')
        },
      },
    ]
    const manager = new LearningMigrationManager(repo, { migrations })
    await expect(manager.migrate()).rejects.toThrow('fallo intermedio')
    expect((await repo.listMigrations()).map(({ version }) => version)).toEqual([1])
    expect(await repo.getProfile('profile.temporary')).toBeUndefined()
  })

  it('rejects data written by a future migration version', async () => {
    const repo = await repository()
    await repo.addMigration({
      version: 2,
      name: 'future',
      checksum: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      appliedAt: '2026-07-23T09:00:00.000Z',
      durationMs: 1,
    })
    await expect(new LearningMigrationManager(repo).migrate()).rejects.toThrow('versión futura 2')
  })
})

