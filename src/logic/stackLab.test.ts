import { describe, expect, it } from 'vitest'
import { createDefaultDesign } from '../data/catalog'
import { buildStackLabSummary } from './stackLab'
import { evaluateDesign } from './validation'

describe('stack lab summary', () => {
  it('builds an ordered technical stack for the complete watch', () => {
    const design = createDefaultDesign()
    const summary = buildStackLabSummary(design, evaluateDesign(design))

    expect(summary.layers.map((layer) => layer.id)).toContain('movement')
    expect(summary.layers.map((layer) => layer.id)).toContain('dial')
    expect(summary.layers.map((layer) => layer.id)).toContain('hands')
    expect(summary.totalHeight).toBeGreaterThan(0)
    expect(summary.limitingClearance.value).toBeLessThanOrEqual(
      Math.max(...summary.clearances.map((check) => check.value)),
    )
  })

  it('marks the dial as the first printable candidate and the movement as external', () => {
    const design = createDefaultDesign()
    const summary = buildStackLabSummary(design, evaluateDesign(design))

    expect(summary.manufacturing.find((item) => item.id === 'dial-print')?.status).toBe('candidate')
    expect(summary.manufacturing.find((item) => item.id === 'movement')?.status).toBe('external')
    expect(summary.missingCriticalData.length).toBeGreaterThan(0)
  })
})
