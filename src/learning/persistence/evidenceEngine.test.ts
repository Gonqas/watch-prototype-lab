import { describe, expect, it } from 'vitest'
import { EvidenceProjectionEngine, type EvidenceExtractionRule } from './evidenceEngine'
import { MemoryLearningRepository } from './memoryRepository'
import { FIXED_NOW, eventFixture, profileFixture, sessionFixture } from './testFixtures'

async function repository() {
  const repository = new MemoryLearningRepository()
  await repository.initialize()
  await repository.putProfile(profileFixture())
  return repository
}

const CORRECT_ANSWER_RULE: EvidenceExtractionRule = {
  id: 'rule.test.correct-answer',
  version: '1.0.0',
  triggerEventType: 'answer-submitted',
  evidenceType: 'written-response',
  competencyId: 'competency.test',
  confidence: 1,
  contentFields: ['data'],
}

describe('EvidenceProjectionEngine', () => {
  it('conserva la respuesta correcta con pista, pero con menor confianza que la independiente', async () => {
    const repo = await repository()
    const independentSessionId = 'session.independent'
    const assistedSessionId = 'session.assisted'
    await repo.putSession({ ...sessionFixture(independentSessionId), state: 'active' })
    await repo.putSession({ ...sessionFixture(assistedSessionId), state: 'active' })
    await repo.appendEvents([{
      ...eventFixture(0, independentSessionId),
      id: 'event.independent.answer',
      type: 'answer-submitted',
      payload: { data: { correct: true, complete: true } },
    }])
    await repo.appendEvents([
      {
        ...eventFixture(0, assistedSessionId),
        id: 'event.assisted.hint',
        type: 'hint-requested',
        payload: { data: { hintId: 'hint.test.1' } },
      },
      {
        ...eventFixture(1, assistedSessionId),
        id: 'event.assisted.answer',
        type: 'answer-submitted',
        payload: { data: { correct: true, complete: true } },
      },
    ])

    const engine = new EvidenceProjectionEngine(repo, [CORRECT_ANSWER_RULE], () => FIXED_NOW)
    const [independent] = await engine.projectSession(independentSessionId)
    const [assisted] = await engine.projectSession(assistedSessionId)

    expect(independent.confidence).toBe(1)
    expect(independent.uncertainty).toBeUndefined()
    expect(assisted.confidence).toBe(0.7)
    expect(assisted.confidence).toBeLessThan(independent.confidence)
    expect(assisted.uncertainty).toBe(0.3)
    expect(assisted.content).toMatchObject({
      hintIds: ['hint.test.1'],
      evaluation: { correct: true, complete: true },
    })
  })
})
