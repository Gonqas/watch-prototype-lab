import { describe, expect, it } from 'vitest'
import { createDefaultDesign } from '../data/catalog'
import { evaluateDesign } from './validation'
import { buildFabricationReadiness } from './fabrication'

describe('fabrication readiness', () => {
  it('marks a clean dial as the first printable candidate', () => {
    const design = createDefaultDesign()
    const readiness = buildFabricationReadiness(design, evaluateDesign(design))

    expect(readiness.checks.find((check) => check.id === 'dial-print')?.status).toBe('candidate')
    expect(readiness.checks.find((check) => check.id === 'movement')?.status).toBe('external')
  })

  it('requires real print data for risky relief geometry', () => {
    const design = createDefaultDesign()
    design.dial.reliefs.push({
      id: 'risky',
      label: 'Relieve alto',
      type: 'line',
      x: 0,
      y: 12,
      radius: 0.2,
      width: 0.2,
      length: 2,
      height: 0.6,
      color: '#f97316',
      material: 'test',
      dataQuality: 'estimated',
    })

    const readiness = buildFabricationReadiness(design, evaluateDesign(design))

    expect(readiness.checks.find((check) => check.id === 'dial-print')?.status).toBe('needs_data')
    expect(readiness.missingCriticalData).toContain('tolerancia de impresion para relieves altos o muy finos')
  })
})
