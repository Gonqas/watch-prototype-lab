import { describe, expect, it } from 'vitest'
import { FUNDAMENTAL_MECHANICAL_LABS, fundamentalLabForActivity } from './fundamentalLabs'

describe('gold-standard fundamental mechanical labs', () => {
  it('defines the six theory-first causal laboratories', () => {
    expect(FUNDAMENTAL_MECHANICAL_LABS.map(({ id }) => id)).toEqual([
      'energy',
      'train',
      'escapement',
      'oscillator',
      'setting',
      'automatic',
    ])
    expect(FUNDAMENTAL_MECHANICAL_LABS.every(({ minimumTheoryMinutes }) => minimumTheoryMinutes >= 20)).toBe(true)
  })

  it('requires an observable causal chain, interruption and honest fidelity', () => {
    for (const lab of FUNDAMENTAL_MECHANICAL_LABS) {
      expect(lab.causalStages.length).toBeGreaterThanOrEqual(3)
      expect(lab.interruption.expectedEffect.length).toBeGreaterThan(20)
      expect(lab.fidelity).toMatchObject({ geometry: 'G1', kinematics: 'K2', physics: 'P0' })
      expect(lab.offline).toBe(true)
    }
  })

  it('resolves activities without creating alternate lab identities', () => {
    expect(fundamentalLabForActivity('activity.mechanical.order-escapement-phases')?.id).toBe('escapement')
    expect(fundamentalLabForActivity('activity.unknown')).toBeUndefined()
  })
})
