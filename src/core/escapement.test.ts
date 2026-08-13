import { describe, expect, it } from 'vitest'
import { createMechanicalMovement } from '../vnext/presets'
import { calculateTrain } from '../vnext/mechanics'
import { calculateEscapement } from './escapement'

describe('escapement event solver', () => {
  it('builds a coherent Swiss lever cycle from the default movement', () => {
    const movement = createMechanicalMovement()
    const report = calculateEscapement(movement, calculateTrain(movement))

    expect(report.geometrySupport).toBe('parametric')
    expect(report.beatsPerSecond).toBeCloseTo(6, 8)
    expect(report.escapeWheelRpm).toBeCloseTo(10, 8)
    expect(report.escapeToothAdvanceDeg).toBeCloseTo(10, 8)
    expect(report.safetyArcDeg).toBeCloseTo(8, 8)
    expect(report.issues.some((issue) => issue.severity === 'error')).toBe(false)
  })

  it('does not claim exact geometry for co-axial without specific drawings', () => {
    const movement = createMechanicalMovement()
    movement.escapement.type = 'co-axial'
    const report = calculateEscapement(movement, calculateTrain(movement))

    expect(report.geometrySupport).toBe('partial')
    expect(report.confidence).toBe('pending')
    expect(report.issues.some((issue) => issue.id === 'escapement-partial-geometry')).toBe(true)
  })
})
