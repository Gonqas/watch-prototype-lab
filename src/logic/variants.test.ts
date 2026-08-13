import { describe, expect, it } from 'vitest'
import { createDefaultDesign } from '../data/catalog'
import { applyVariantToDesign, buildVariantSummaries } from './variants'
import { evaluateDesign } from './validation'

describe('variant lab', () => {
  it('builds a current route plus actionable alternatives', () => {
    const variants = buildVariantSummaries(createDefaultDesign())

    expect(variants.map((variant) => variant.id)).toEqual([
      'current',
      'two_hand',
      'box_crystal',
      'relief_recover',
      'miyota_2036',
    ])
    expect(variants.every((variant) => variant.design.schemaVersion === 1)).toBe(true)
  })

  it('creates a two-hand route that removes the second hand from validation', () => {
    const design = applyVariantToDesign(createDefaultDesign(), 'two_hand')
    const result = evaluateDesign(design)

    expect(design.hands.count).toBe(2)
    expect(design.hands.secondsEnabled).toBe(false)
    expect(result.findings.some((finding) => finding.pieceIds.includes('secondHand'))).toBe(false)
  })

  it('creates a box-crystal route with more usable vertical space', () => {
    const baseline = createDefaultDesign()
    const variant = applyVariantToDesign(baseline, 'box_crystal')

    expect(variant.crystal.type).toBe('box')
    expect(evaluateDesign(variant).metrics.crystalClearance).toBeGreaterThan(
      evaluateDesign(baseline).metrics.crystalClearance,
    )
  })

  it('creates a Miyota 2036 route with a higher hand stack', () => {
    const baseline = createDefaultDesign()
    const variant = applyVariantToDesign(baseline, 'miyota_2036')

    expect(variant.movementId).toBe('miyota_2036')
    expect(variant.hands.minute.heightOverDial).toBeGreaterThan(baseline.hands.minute.heightOverDial)
    expect(variant.dial.technicalPresetId).toBe('miyota_2036_technical_dial')
  })
})
