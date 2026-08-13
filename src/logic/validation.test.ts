import { describe, expect, it } from 'vitest'
import { createDefaultDesign } from '../data/catalog'
import type { WatchDesign } from '../types'
import { evaluateDesign } from './validation'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const defaultDesign = () => createDefaultDesign()

describe('evaluateDesign', () => {
  it('keeps the default design out of hard collisions', () => {
    const result = evaluateDesign(defaultDesign())

    expect(result.status).not.toBe('MAL')
    expect(result.conflictIds.has('minuteHand')).toBe(false)
    expect(result.conflictIds.has('secondHand')).toBe(false)
    expect(result.findings.some((finding) => finding.id.includes('vertical-gap'))).toBe(false)
    expect(result.metrics.crystalClearance).toBeGreaterThan(0.7)
  })

  it('marks decorative reliefs that invade the hand sweep as recoverable conflicts', () => {
    const design = defaultDesign()
    design.dial.reliefs.push({
      id: 'test-high-relief',
      label: 'Relieve alto de prueba',
      type: 'circle',
      x: 0,
      y: 8.8,
      radius: 1.15,
      width: 1.15,
      length: 1.15,
      height: 0.95,
      color: '#f97316',
      material: 'test',
      dataQuality: 'estimated',
    })

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.conflictIds.has('relief:test-high-relief')).toBe(true)
    expect(result.findings.find((finding) => finding.id === 'relief-test-high-relief-sweep')?.recoverable).toBe(true)
    expect(result.opportunities.some((opportunity) => opportunity.id === 'recover-relief-conflict')).toBe(true)
  })

  it('improves the vertical stack when switching to a two-hand layout', () => {
    const threeHands = defaultDesign()
    const twoHands: WatchDesign = {
      ...clone(threeHands),
      hands: {
        ...clone(threeHands.hands),
        count: 2,
        secondsEnabled: false,
      },
    }

    const threeHandResult = evaluateDesign(threeHands)
    const twoHandResult = evaluateDesign(twoHands)

    expect(twoHandResult.metrics.maxHandTop).toBeLessThan(threeHandResult.metrics.maxHandTop)
    expect(twoHandResult.findings.some((finding) => finding.pieceIds.includes('secondHand'))).toBe(false)
  })

  it('increases crystal clearance when using a taller box-crystal assumption', () => {
    const baseline = defaultDesign()
    const boxCrystal: WatchDesign = {
      ...clone(baseline),
      crystal: {
        ...clone(baseline.crystal),
        type: 'box',
        usableInteriorHeight: baseline.crystal.usableInteriorHeight + 0.8,
      },
    }

    expect(evaluateDesign(boxCrystal).metrics.crystalClearance).toBeGreaterThan(
      evaluateDesign(baseline).metrics.crystalClearance,
    )
  })

  it('marks an over-deep sunken dial as structurally impossible', () => {
    const design = defaultDesign()
    design.dial.sunkenCenter = true
    design.dial.sunkenDepth = 2.2

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.conflictIds.has('dial')).toBe(true)
    expect(result.findings.some((finding) => finding.id === 'dial-sunken-floor-breakthrough')).toBe(true)
    expect(result.opportunities.some((opportunity) => opportunity.id === 'recover-sunken-dial-structure')).toBe(true)
  })

  it('marks a sunken radius that consumes the outer support land', () => {
    const design = defaultDesign()
    design.dial.sunkenCenter = true
    design.dial.sunkenDepth = 0.1
    design.dial.sunkenRadius = design.dial.commercialDiameter / 2 - 0.2

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.findings.some((finding) => finding.id === 'dial-sunken-radius-overrun')).toBe(true)
    expect(result.zones.find((zone) => zone.id === 'outer')?.status).toBe('collision')
  })

  it('marks a commercial dial that no longer covers the official DH1/DH2 footprint', () => {
    const design = defaultDesign()
    design.dial.commercialDiameter = 16.5

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.findings.some((finding) => finding.id === 'dial-foot-coverage')).toBe(true)
    expect(result.opportunities.some((opportunity) => opportunity.id === 'recover-dial-foot-coverage')).toBe(true)
  })

  it('marks hands that exceed the radial case/glass clearance', () => {
    const design = defaultDesign()
    design.hands.minute.length = 17.2

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.findings.some((finding) => finding.id === 'hand-case-radial-clearance')).toBe(true)
    expect(result.findings.some((finding) => finding.id === 'hand-crystal-radial-clearance')).toBe(true)
    expect(result.conflictIds.has('minuteHand')).toBe(true)
  })

  it('marks relief geometry that leaves the dial boundary', () => {
    const design = defaultDesign()
    design.dial.reliefs.push({
      id: 'outside-relief',
      label: 'Relieve fuera',
      type: 'circle',
      x: 16,
      y: 0,
      radius: 1.1,
      width: 1.1,
      length: 1.1,
      height: 0.08,
      color: '#f97316',
      material: 'test',
      dataQuality: 'estimated',
    })

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.findings.some((finding) => finding.id === 'relief-outside-relief-outside-dial')).toBe(true)
    expect(result.conflictIds.has('relief:outside-relief')).toBe(true)
  })

  it('flags raised dial geometry against the hand sweep', () => {
    const design = defaultDesign()
    design.dial.outerRingHeight = 0.7

    const result = evaluateDesign(design)

    expect(result.status).toBe('MAL')
    expect(result.findings.some((finding) => finding.id === 'hands-dial-clearance')).toBe(true)
    expect(result.conflictIds.has('hourHand')).toBe(true)
  })
})
