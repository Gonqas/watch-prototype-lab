import { describe, expect, it } from 'vitest'
import { createAutomaticMechanicalProject, createMechanicalProject, createQuartzProject } from '../vnext/presets'
import { runToleranceAnalysis } from './tolerance'

describe('tolerance propagation', () => {
  it('is deterministic for the project seed', () => {
    const project = createQuartzProject('miyota_2035')
    project.engineering.toleranceMode = 'monte_carlo'
    const first = runToleranceAnalysis(project, 400)
    const second = runToleranceAnalysis(project, 400)

    expect(second.yieldProbability).toBe(first.yieldProbability)
    expect(second.metrics).toEqual(first.metrics)
  }, 15_000)

  it('reports a lower yield when the crystal stack becomes uncertain and tight', () => {
    const project = createQuartzProject('miyota_2035')
    project.engineering.toleranceMode = 'monte_carlo'
    project.case.usableInteriorHeight.value = 4.2
    project.case.usableInteriorHeight.minus = 0.6
    project.case.usableInteriorHeight.plus = 0.2
    const result = runToleranceAnalysis(project, 600)

    expect(result.metrics.find((metric) => metric.id === 'crystal')?.failureProbability).toBeGreaterThan(0)
    expect(result.yieldProbability).toBeLessThan(1)
  })

  it('treats stem alignment as a bilateral tolerance instead of a zero-clearance collision', () => {
    const project = createMechanicalProject()
    project.engineering.toleranceMode = 'worst_case'
    const result = runToleranceAnalysis(project)
    const stem = result.metrics.find((metric) => metric.id === 'stemAxis')

    expect(result.nominalPass).toBe(true)
    expect(stem?.failureProbability).toBeLessThan(1)
    expect(stem?.nominal).toBeGreaterThan(-0.15)
  })

  it('propagates the independent rotor, train and movement-envelope datums', () => {
    const project = createAutomaticMechanicalProject()
    project.engineering.toleranceMode = 'worst_case'
    const result = runToleranceAnalysis(project)
    expect(result.metrics.some((metric) => metric.id === 'rotorTrain')).toBe(true)
    expect(result.metrics.some((metric) => metric.id === 'rotorBack')).toBe(true)
    expect(result.metrics.some((metric) => metric.id === 'movementTop')).toBe(true)
  })
})
