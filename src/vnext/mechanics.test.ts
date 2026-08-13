import { describe, expect, it } from 'vitest'
import { calculateTrain } from './mechanics'
import { createMechanicalMovement } from './presets'

describe('mechanical train solver', () => {
  it('starts from a coherent one-minute fourth wheel and 21,600 vph train', () => {
    const train = calculateTrain(createMechanicalMovement())

    expect(train.centerToFourthRatio).toBeCloseTo(60, 6)
    expect(train.calculatedVph).toBeCloseTo(21_600, 6)
    expect(train.powerReserveHours).toBeCloseTo(52, 6)
    expect(train.pairs.every((pair) => Math.abs(pair.distanceError) <= pair.tolerance)).toBe(true)
    expect(train.findings.some((item) => item.id.startsWith('mesh-interference'))).toBe(false)
    expect(train.findings.some((item) => item.id.startsWith('mesh-disengaged'))).toBe(false)
  })

  it('detects a wheel moved away from its nominal depthing', () => {
    const movement = createMechanicalMovement()
    const third = movement.arbors.find((arbor) => arbor.id === 'third')
    if (!third) throw new Error('Missing third wheel')
    third.x.value = (third.x.value ?? 0) + 1

    const train = calculateTrain(movement)

    expect(
      train.findings.some(
        (item) => item.id === 'mesh-disengaged-center-third' || item.id === 'mesh-interference-third-fourth',
      ),
    ).toBe(true)
  })
})
