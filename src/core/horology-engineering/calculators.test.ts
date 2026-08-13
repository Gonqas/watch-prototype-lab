import { describe, expect, it } from 'vitest'
import {
  calculateMainspringLinearModel,
  calculateIdealGearTrain,
  calculateOscillatorFromInertia,
  calculateProcessCapability,
  calculateRequiredHairspringStiffness,
  calculateToleranceStack,
  calculateWeibullReliability,
} from './calculators'
import { convertQuantity, quantity } from './units'

describe('engineering quantities', () => {
  it('converts watchmaking inertia without the factor-of-ten defect from the VBA source', () => {
    expect(convertQuantity(quantity(1, 'mg*cm2'), 'kg*m2').value).toBeCloseTo(1e-10, 15)
    expect(convertQuantity(quantity(1e-10, 'kg*m2'), 'mg*cm2').value).toBeCloseTo(1, 12)
  })

  it('converts vph to oscillator cycles per second', () => {
    expect(convertQuantity(quantity(21_600, 'vph'), 'Hz').value).toBe(3)
  })
})

describe('watch engineering calculators', () => {
  it('keeps oscillator forward and inverse calculations coherent', () => {
    const inverse = calculateRequiredHairspringStiffness({
      inertia: quantity(8.5, 'mg*cm2', 'designed'),
      targetAlternations: quantity(21_600, 'vph', 'designed'),
    })
    const forward = calculateOscillatorFromInertia({
      inertia: quantity(8.5, 'mg*cm2', 'designed'),
      stiffness: inverse.outputs.stiffness,
    })
    expect(forward.outputs.alternationsPerHour.value).toBeCloseTo(21_600, 8)
  })

  it('calculates a compound ideal train and nominal centers without assuming a calibre', () => {
    const run = calculateIdealGearTrain({
      inputSpeed: quantity(0.25, 'rpm', 'designed'),
      stages: [
        { driverTeeth: 80, drivenTeeth: 10, module: quantity(0.12, 'mm', 'designed'), mesh: 'external' },
        { driverTeeth: 75, drivenTeeth: 10, module: quantity(0.10, 'mm', 'designed'), mesh: 'external' },
      ],
    })
    expect(run.outputs.totalRatio.value).toBe(60)
    expect(run.outputs.outputSpeed.value).toBe(15)
    expect(run.outputs.direction.value).toBe(1)
    expect(convertQuantity(run.outputs.stage1CenterDistance, 'mm').value).toBeCloseTo(5.4, 12)
  })

  it('implements Weibull reliability as a bounded probability', () => {
    const run = calculateWeibullReliability({
      time: quantity(1000, 'h'),
      scale: quantity(5000, 'h'),
      shape: quantity(2, 'ratio'),
    })
    expect(run.outputs.failureProbability.value).toBeCloseTo(3.921056, 5)
    expect(run.outputs.reliability.value).toBeCloseTo(96.078943, 5)
    expect(run.outputs.failureProbability.value).toBeLessThanOrEqual(100)
    expect(run.verification).toBe('source-reviewed')
  })

  it('calculates worst-case and RSS stacks separately', () => {
    const run = calculateToleranceStack({
      contributors: [
        quantity(0.01, 'mm'),
        quantity(20, 'um'),
        quantity(0.03, 'mm'),
      ],
    })
    expect(run.outputs.worstCase.value).toBeCloseTo(0.06, 12)
    expect(run.outputs.rootSumSquare.value).toBeCloseTo(Math.sqrt(0.0014), 12)
  })

  it('warns when Cp/Cpk is estimated from fewer than 50 observations', () => {
    const run = calculateProcessCapability({
      lowerSpecification: quantity(9.9, 'mm'),
      upperSpecification: quantity(10.1, 'mm'),
      mean: quantity(10.02, 'mm'),
      standardDeviation: quantity(0.02, 'mm'),
      sampleSize: quantity(30, 'count'),
    })
    expect(run.outputs.cp.value).toBeCloseTo(1.666666, 5)
    expect(run.outputs.cpk.value).toBeCloseTo(1.333333, 5)
    expect(run.validity).toBe('caution')
  })

  it('returns a traceable preliminary mainspring result', () => {
    const run = calculateMainspringLinearModel({
      thickness: quantity(0.1, 'mm', 'designed'),
      height: quantity(1.2, 'mm', 'designed'),
      length: quantity(300, 'mm', 'designed'),
      elasticModulus: quantity(190_000, 'N/mm2', 'estimated'),
      turns: quantity(6, 'count', 'designed'),
    })
    expect(run.outputs.torque.value).toBeGreaterThan(0)
    expect(run.level).toBe('engineering-preview')
    expect(run.limitations.join(' ')).toContain('fabricación')
  })
})
