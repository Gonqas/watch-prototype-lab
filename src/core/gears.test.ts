import { describe, expect, it } from 'vitest'
import {
  analyzeGearPair,
  bs978Factors,
  buildCycloidalPinionOutline,
  buildCycloidalWheelOutline,
  buildInvoluteOutline,
  calculateCycloidalPair,
  calculateInvoluteGear,
} from './gears'

describe('involute gear kernel', () => {
  const gear = {
    teeth: 60,
    module: 0.12,
    pressureAngleDeg: 20,
    profileShift: 0,
    addendumCoefficient: 1,
    dedendumCoefficient: 1.25,
    backlash: 0.012,
  }

  it('calculates canonical radii and a closed repeating outline', () => {
    const result = calculateInvoluteGear(gear)
    const outline = buildInvoluteOutline(gear)

    expect(result.pitchRadius).toBeCloseTo(3.6, 8)
    expect(result.baseRadius).toBeLessThan(result.pitchRadius)
    expect(result.tipRadius).toBeGreaterThan(result.pitchRadius)
    expect(outline.length).toBeGreaterThan(gear.teeth * 10)
  })

  it('reports contact ratio and undercut risk independently', () => {
    const pair = analyzeGearPair(gear, { ...gear, teeth: 12 })

    expect(pair.transverseContactRatio).toBeGreaterThan(1)
    expect(pair.driver.undercutRisk).toBe(false)
    expect(pair.driven.undercutRisk).toBe(true)
    expect(pair.interferenceRisk).toBe(true)
  })

  it('detects a pair moved beyond tooth contact', () => {
    const pair = analyzeGearPair(gear, { ...gear, teeth: 12 }, 20)
    expect(pair.contactValid).toBe(false)
  })

  it('uses BS 978 factors and generates finite cycloidal wheel and pinion outlines', () => {
    const factors = bs978Factors(12, 8)
    const pair = calculateCycloidalPair(96, 12, 0.15)
    const wheel = buildCycloidalWheelOutline(96, 12, 0.15)
    const pinion = buildCycloidalPinionOutline(96, 12, 0.15)

    expect(factors.addendum).toBeCloseTo(1.721, 3)
    expect(factors.radius).toBeCloseTo(2.536, 3)
    expect(pair.leadState).toBe('smooth')
    expect(wheel.length).toBeGreaterThan(1000)
    expect(pinion.length).toBe(84)
    expect([...wheel, ...pinion].every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
  })
})
