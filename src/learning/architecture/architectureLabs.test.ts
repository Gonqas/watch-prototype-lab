import { describe, expect, it } from 'vitest'
import { ADVANCED_LABS, validateAdvancedLabReferences } from './architectureLabs'

describe('Laboratorios de Atlas, servicio y complicaciones', () => {
  it('cubre las tres rutas con referencias resolubles', () => {
    expect(ADVANCED_LABS).toHaveLength(15)
    expect(new Set(ADVANCED_LABS.map(({ route }) => route))).toEqual(new Set([
      'comparative-atlas',
      'service-method',
      'architectures-complications',
    ]))
    expect(validateAdvancedLabReferences()).toEqual([])
  })

  it('prohíbe acreditar una intervención física desde el laboratorio', () => {
    expect(ADVANCED_LABS.every(({ physicalClaimAllowed, requiresHumanReview }) =>
      !physicalClaimAllowed && requiresHumanReview)).toBe(true)
  })
})
