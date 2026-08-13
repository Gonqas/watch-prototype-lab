import { describe, expect, it } from 'vitest'
import { createMechanicalProject, createQuartzProject } from '../vnext/presets'
import { analyzeManufacturing } from './manufacturing'

describe('manufacturing analysis', () => {
  it('blocks a recessed dial that leaves less floor than the process can print', () => {
    const project = createQuartzProject('miyota_2035')
    project.engineering.manufacturingProcess = 'resin'
    project.dial.recess.enabled = true
    project.dial.recess.depth.value = 0.36
    const result = analyzeManufacturing(project)

    expect(result.blockedParts).toContain('dial')
    expect(result.readyForExport).toBe(false)
  })

  it('evaluates train features for a mechanical project', () => {
    const result = analyzeManufacturing(createMechanicalProject())
    expect(result.printableParts).toContain('plate')
    expect(result.checks.some((check) => check.id.startsWith('gear-feature-'))).toBe(true)
  })
})
