import { describe, expect, it } from 'vitest'
import { MemoryLearningRepository } from './memoryRepository'
import { LearningRepositoryError } from './repository'
import { evidenceFixture, eventFixture, profileFixture, sessionFixture } from './testFixtures'

async function repository() {
  const value = new MemoryLearningRepository()
  await value.initialize()
  return value
}

describe('MemoryLearningRepository contract', () => {
  it('supports profiles, sessions, pagination and isolated local profiles', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putProfile(profileFixture('profile.second'))
    await repo.putSession(sessionFixture())
    await repo.putSession(sessionFixture('session.second', 'profile.second'))
    expect((await repo.listProfiles({ limit: 1 })).total).toBe(2)
    expect((await repo.listSessions('profile.local-default')).items.map(({ id }) => id)).toEqual(['session.test'])
    expect((await repo.listSessions('profile.second')).items.map(({ id }) => id)).toEqual(['session.second'])
  })

  it('rolls back a transaction completely', async () => {
    const repo = await repository()
    await expect(repo.transaction(async (transaction) => {
      await transaction.putProfile(profileFixture())
      await transaction.putSession(sessionFixture())
      throw new Error('fallo simulado')
    })).rejects.toThrow('fallo simulado')
    expect((await repo.listProfiles()).total).toBe(0)
    expect((await repo.snapshot()).revision).toBe(0)
  })

  it('enforces event sequence and idempotency while accepting exact retries', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    const first = await repo.appendEvents([eventFixture(0)])
    const retry = await repo.appendEvents([eventFixture(0)])
    expect(first.inserted).toEqual(['event.0'])
    expect(retry.duplicates).toEqual(['event.0'])
    await expect(repo.appendEvents([{ ...eventFixture(1), sequence: 0 }])).rejects.toBeInstanceOf(LearningRepositoryError)
  })

  it('keeps evidence and assessments immutable', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    await repo.appendEvents([eventFixture(0), eventFixture(1)])
    await repo.addEvidence(evidenceFixture())
    await expect(repo.addEvidence({ ...evidenceFixture(), confidence: 0.5 })).rejects.toMatchObject({ code: 'conflict' })
  })

  it('prevents implicit destructive cascades', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    await expect(repo.hardDeleteProfile('profile.local-default')).rejects.toMatchObject({ code: 'constraint' })
  })

  it('serializes concurrent transactions without losing updates', async () => {
    const repo = await repository()
    await Promise.all([
      repo.transaction(async (transaction) => transaction.putProfile(profileFixture('profile.a'))),
      repo.transaction(async (transaction) => transaction.putProfile(profileFixture('profile.b'))),
    ])
    expect((await repo.listProfiles()).total).toBe(2)
    expect((await repo.snapshot()).revision).toBe(2)
  })
})
