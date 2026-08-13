import { describe, expect, it } from 'vitest'
import { createMechanicalMovement } from '../vnext/presets'
import { calculateTrain } from '../vnext/mechanics'
import { calculateMechanicalDynamics } from './dynamics'
import { calculateAutomaticWinding } from './automatic'

describe('automatic winding model', () => {
  it('is inactive for a manual movement', () => {
    const movement = createMechanicalMovement()
    const train = calculateTrain(movement)
    const dynamics = calculateMechanicalDynamics(movement, train)
    expect(calculateAutomaticWinding(movement, train, dynamics)).toBeNull()
  })

  it('calculates torque, charge rate and daily balance for an automatic movement', () => {
    const movement = createMechanicalMovement()
    movement.architecture = 'automatic'
    const train = calculateTrain(movement)
    const dynamics = calculateMechanicalDynamics(movement, train)
    const result = calculateAutomaticWinding(movement, train, dynamics)
    expect(result).not.toBeNull()
    expect(result!.rotorInertiaKgM2).toBeGreaterThan(0)
    expect(result!.barrelTurnsPerActiveHour).toBeGreaterThan(0)
    expect(Number.isFinite(result!.torqueMargin)).toBe(true)
    expect(result!.confidence).toBe('low')
  })

  it('reports a physically impossible centre of mass', () => {
    const movement = createMechanicalMovement()
    movement.architecture = 'automatic'
    movement.automatic!.centerOfMassRadius.value = 30
    const train = calculateTrain(movement)
    const dynamics = calculateMechanicalDynamics(movement, train)
    const result = calculateAutomaticWinding(movement, train, dynamics)!
    expect(result.issues.some((issue) => issue.id === 'automatic-center-of-mass' && issue.severity === 'error')).toBe(true)
  })
})
