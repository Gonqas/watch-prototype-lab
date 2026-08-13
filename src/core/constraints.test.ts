import { describe, expect, it } from 'vitest'
import { createQuartzProject } from '../vnext/presets'
import { solveAssemblyConstraints } from './constraints'

describe('assembly constraint solver', () => {
  it('tracks residuals and remaining degrees of freedom separately', () => {
    const project = createQuartzProject('miyota_2035')
    const result = solveAssemblyConstraints(project)

    expect(result.constraints.length).toBeGreaterThan(2)
    expect(result.failedConstraints).toHaveLength(0)
    expect(result.freedoms.some((freedom) => freedom.part === 'movement')).toBe(true)
  })

  it('detects a violated dial stack mate', () => {
    const project = createQuartzProject('miyota_2035')
    project.assembly.mates.push({
      id: 'mate-dial-movement-z',
      name: 'Dial sobre movimiento',
      type: 'distance',
      sourcePart: 'dial',
      targetPart: 'movement',
      enabled: true,
      axis: 'z',
      offset: { value: 4, minus: 0.01, plus: 0.01, unit: 'mm', quality: 'designed', source: 'Prueba' },
    })
    const result = solveAssemblyConstraints(project)

    expect(result.failedConstraints.some((constraint) => constraint.id === 'mate-dial-movement-z')).toBe(true)
  })
})
