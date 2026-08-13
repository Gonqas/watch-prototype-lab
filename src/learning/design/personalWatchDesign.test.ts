import { describe, expect, it } from 'vitest'
import {
  PERSONAL_WATCH_DESIGN_LEVELS,
  PERSONAL_WATCH_DESIGN_STAGES,
  PersonalWatchDesignLevelSchema,
  PersonalWatchDesignStageSchema,
  validatePersonalWatchDesignCatalog,
} from './personalWatchDesign'

describe('personal watch design route', () => {
  it('defines the three progressive design levels and six review gates', () => {
    expect(PersonalWatchDesignLevelSchema.array().parse(PERSONAL_WATCH_DESIGN_LEVELS)).toHaveLength(3)
    expect(PersonalWatchDesignStageSchema.array().parse(PERSONAL_WATCH_DESIGN_STAGES)).toHaveLength(6)
    expect(PERSONAL_WATCH_DESIGN_LEVELS.map(({ id }) => id)).toEqual([
      'acquired-movement-watch',
      'controlled-architecture-modification',
      'own-movement',
    ])
    expect(validatePersonalWatchDesignCatalog()).toEqual([])
  })

  it('requires alternatives, risks, verification and an explicit stopping rule at every gate', () => {
    expect(PERSONAL_WATCH_DESIGN_STAGES.every((stage) =>
      stage.alternativesMinimum >= 2 &&
      stage.verificationPlans.length > 0 &&
      stage.stopConditions.length > 0 &&
      stage.exitCriteria.length > 0)).toBe(true)
  })
})
