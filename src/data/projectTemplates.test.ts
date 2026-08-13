import { describe, expect, it } from 'vitest'
import { createDefaultDesign } from './catalog'
import { createDesignFromTemplate, PROJECT_TEMPLATES } from './projectTemplates'

describe('project templates', () => {
  it('keeps the default Miyota 2035 project clean and non experimental', () => {
    const design = createDefaultDesign()

    expect(design.dial.sunkenCenter).toBe(false)
    expect(design.dial.reliefs).toHaveLength(0)
    expect(design.hands.count).toBe(3)
  })

  it('separates sunken dial and relief stress as explicit templates', () => {
    const sunken = createDesignFromTemplate('dial_sunken_experiment')
    const stress = createDesignFromTemplate('relief_stress')

    expect(sunken.dial.sunkenCenter).toBe(true)
    expect(sunken.dial.reliefs).toHaveLength(0)
    expect(stress.dial.reliefs.length).toBeGreaterThan(0)
  })

  it('exposes project templates as selectable professional starting points', () => {
    expect(PROJECT_TEMPLATES.map((template) => template.id)).toEqual([
      'blank_2035',
      'wp24_supplier_assembly',
      'dial_sunken_experiment',
      'two_hand_clearance',
      'relief_stress',
      'printable_dial_candidate',
    ])
  })
})
