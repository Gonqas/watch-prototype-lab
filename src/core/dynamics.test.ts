import { describe, expect, it } from 'vitest'
import { createMechanicalMovement } from '../vnext/presets'
import { calculateTrain } from '../vnext/mechanics'
import { calculateMechanicalDynamics } from './dynamics'

describe('mechanical dynamics budget', () => {
  it('derives oscillator frequency, torque curve and end-state energy', () => {
    const movement = createMechanicalMovement()
    const train = calculateTrain(movement)
    const result = calculateMechanicalDynamics(movement, train)

    expect(result.torqueCurve).toHaveLength(41)
    expect(result.torqueCurve.at(-1)?.barrelTorqueNmm).toBeGreaterThan(result.torqueCurve[0].barrelTorqueNmm)
    expect(result.naturalVph).toBeGreaterThan(20_000)
    expect(result.naturalVph).toBeLessThan(23_000)
    expect(result.powerReserveHours).toBeCloseTo(52, 4)
    expect(result.minimumEnergyMargin).toBeGreaterThan(1)
  })

  it('detects an oscillator with insufficient hairspring stiffness', () => {
    const movement = createMechanicalMovement()
    if (!movement.balance.hairspringStiffness) throw new Error('Missing hairspring stiffness')
    movement.balance.hairspringStiffness.value = 1e-8
    const result = calculateMechanicalDynamics(movement, calculateTrain(movement))

    expect(result.issues.some((issue) => issue.id === 'oscillator-frequency')).toBe(true)
  })
})
