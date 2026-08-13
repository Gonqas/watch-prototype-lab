import { describe, expect, it } from 'vitest'
import { normalizeDesign } from './designMigration'

describe('design migration', () => {
  it('fills missing fields from the current clean Miyota 2035 schema', () => {
    const design = normalizeDesign({
      id: 'legacy',
      name: 'Legacy',
      dial: {
        sunkenCenter: true,
      },
    })

    expect(design.schemaVersion).toBe(1)
    expect(design.id).toBe('legacy')
    expect(design.name).toBe('Legacy')
    expect(design.dial.sunkenCenter).toBe(true)
    expect(design.dial.reliefs).toEqual([])
    expect(design.case.outerDiameter).toBeGreaterThan(0)
    expect(design.measurements.case.notes).toBe('')
  })
})
