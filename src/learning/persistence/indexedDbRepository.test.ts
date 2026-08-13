import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { IndexedDbLearningRepository, deleteIndexedDbLearningDatabase } from './indexedDbRepository'
import { eventFixture, profileFixture, sessionFixture } from './testFixtures'

const databases: string[] = []
const repositories: IndexedDbLearningRepository[] = []

async function repository() {
  const databaseName = `learning-test-${crypto.randomUUID()}`
  databases.push(databaseName)
  const repo = new IndexedDbLearningRepository({ databaseName })
  await repo.initialize()
  repositories.push(repo)
  return repo
}

afterEach(async () => {
  for (const repository of repositories.splice(0)) await repository.close()
  for (const name of databases.splice(0)) await deleteIndexedDbLearningDatabase(name)
})

describe('IndexedDbLearningRepository', () => {
  it('persists and reopens all core records with memory-equivalent semantics', async () => {
    const databaseName = `learning-reopen-${crypto.randomUUID()}`
    databases.push(databaseName)
    const first = new IndexedDbLearningRepository({ databaseName })
    repositories.push(first)
    await first.initialize()
    await first.putProfile(profileFixture())
    await first.putSession(sessionFixture())
    await first.appendEvents([eventFixture(0)])
    await first.close()
    const reopened = new IndexedDbLearningRepository({ databaseName })
    repositories.push(reopened)
    await reopened.initialize()
    expect((await reopened.listProfiles()).total).toBe(1)
    expect((await reopened.listSessions('profile.local-default')).total).toBe(1)
    expect((await reopened.listEvents('session.test')).items[0].id).toBe('event.0')
    await reopened.close()
  })

  it('commits multiple object stores atomically and rolls back failures', async () => {
    const repo = await repository()
    await expect(repo.transaction(async (transaction) => {
      await transaction.putProfile(profileFixture())
      await transaction.putSession(sessionFixture())
      throw new Error('rollback indexeddb')
    })).rejects.toThrow('rollback indexeddb')
    expect((await repo.listProfiles()).total).toBe(0)
  })

  it('enforces the same uniqueness and idempotency contract as memory', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    await repo.appendEvents([eventFixture(0)])
    expect((await repo.appendEvents([eventFixture(0)])).duplicates).toEqual(['event.0'])
    await expect(repo.appendEvents([{ ...eventFixture(1), sequence: 0 }])).rejects.toMatchObject({ code: 'constraint' })
  })

  it('supports stable pagination after physical IndexedDB persistence', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture('profile.a'))
    await repo.putProfile(profileFixture('profile.b'))
    const page = await repo.listProfiles({ offset: 1, limit: 1 })
    expect(page).toMatchObject({ offset: 1, limit: 1, total: 2 })
    expect(page.items).toHaveLength(1)
  })
})
