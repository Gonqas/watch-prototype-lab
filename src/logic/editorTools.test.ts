import { describe, expect, it } from 'vitest'
import { getLiveLimitReadout, getToolsForPart, normalizeToolForPart, roundLiveMm } from './editorTools'
import { createDefaultDesign } from '../data/catalog'
import { evaluateDesign } from './validation'

describe('editor tools', () => {
  it('exposes part-specific tools and normalizes invalid choices', () => {
    expect(getToolsForPart('dial')).toEqual(['depth', 'radius', 'height'])
    expect(getToolsForPart('minuteHand')).toEqual(['size', 'height', 'curve'])
    expect(normalizeToolForPart('minuteHand', 'depth')).toBe('size')
  })

  it('snaps live millimeter values to the selected step', () => {
    expect(roundLiveMm(12.34, true, 0.1)).toBe(12.3)
    expect(roundLiveMm(12.36, true, 0.1)).toBe(12.4)
    expect(roundLiveMm(12.36, false, 0.1)).toBe(12.36)
  })

  it('explains the active limit for the selected part', () => {
    const design = createDefaultDesign()
    const readout = getLiveLimitReadout(design, 'crystal', evaluateDesign(design))

    expect(readout.label).toBe('Margen al cristal')
    expect(readout.value).toContain('mm')
    expect(['ok', 'warn', 'bad', 'opportunity']).toContain(readout.tone)
  })
})
