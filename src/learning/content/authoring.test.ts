import { describe, expect, it } from 'vitest'
import { LearningMilestoneSchema } from './authoring'

describe('contrato editorial de hitos', () => {
  it('admite una demostración independiente como modo distinto de transferencia', () => {
    const milestone = LearningMilestoneSchema.parse({
      id: 'milestone.test.demonstration',
      order: 1,
      title: { es: 'Demostrar lo aprendido' },
      outcome: { es: 'Resolver un caso sin pistas ni ayuda.' },
      lessonId: 'lesson.test.demonstration',
      activityId: 'activity.test.demonstration',
      mode: 'demonstration',
      evidenceLevel: 'independent-simulation',
      optional: false,
      transferTargetIds: [],
    })

    expect(milestone.mode).toBe('demonstration')
    expect(milestone.mode).not.toBe('transfer')
  })
})
