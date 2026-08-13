import { describe, expect, it } from 'vitest'
import { createMechanicalProject, createQuartzProject } from '../vnext/presets'
import { evaluateEngineeringProject } from './engineering'

describe('engineering report', () => {
  it('keeps solver layers independent for a quartz calibre', () => {
    const report = evaluateEngineeringProject(createQuartzProject('miyota_2035'))

    expect(report.layers.find((layer) => layer.layer === 'kinematics')?.state).toBe('not_applicable')
    expect(report.layers.find((layer) => layer.layer === 'dynamics')?.state).toBe('not_applicable')
    expect(report.dynamics).toBeNull()
  })

  it('includes dynamics and cycloidal watch-train kinematics for a mechanical movement', () => {
    const report = evaluateEngineeringProject(createMechanicalProject())

    expect(report.dynamics).not.toBeNull()
    expect(report.geometry.train?.pairs[0].profile).toBe('cycloidal')
    expect(report.geometry.train?.pairs[0].contactRatio).toBeNull()
    expect(report.layers.map((layer) => layer.layer)).toContain('manufacturing')
  })
})
