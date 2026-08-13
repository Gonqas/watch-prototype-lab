import { describe, expect, it } from 'vitest'
import { createDefaultDesign } from '../data/catalog'
import { buildCollisionModel } from './collisionEngine'

describe('collision engine', () => {
  it('builds clearances from the shared technical stack', () => {
    const design = createDefaultDesign()
    const model = buildCollisionModel(design)

    expect(model.stack.planes.map((plane) => plane.id)).toContain('crystal-inner')
    expect(model.activeHands.map((item) => item.id)).toEqual(['hour', 'minute', 'second'])
    expect(model.crystalClearance).toBeGreaterThan(0.7)
    expect(model.minimumClearance).toBeLessThanOrEqual(model.crystalClearance)
  })

  it('detects relief sweep collisions without blocking the design object', () => {
    const design = createDefaultDesign()
    design.dial.reliefs.push({
      id: 'collision-relief',
      label: 'Relieve alto',
      type: 'circle',
      x: 0,
      y: 8.8,
      radius: 1.2,
      width: 1.2,
      length: 1.2,
      height: 0.95,
      color: '#7c3aed',
      material: 'test',
      dataQuality: 'estimated',
    })

    const model = buildCollisionModel(design)

    expect(model.reliefSweepCollisions.map((item) => item.reliefId)).toContain('collision-relief')
    expect(design.dial.reliefs).toHaveLength(1)
  })

  it('does not lift hands automatically when the dial surface is raised', () => {
    const design = createDefaultDesign()
    const baseline = buildCollisionModel(design)

    design.dial.outerRingHeight = 0.7
    const raisedDial = buildCollisionModel(design)

    expect(raisedDial.handReferenceSurface).toBe(baseline.handReferenceSurface)
    expect(raisedDial.handDialMinGap).toBeLessThan(baseline.handDialMinGap)
    expect(raisedDial.handDialMinGap).toBeLessThan(0)
  })

  it('tracks radial sweep and technical dial-foot margins', () => {
    const design = createDefaultDesign()
    const baseline = buildCollisionModel(design)

    expect(baseline.handCaseClearance).toBeGreaterThan(0)
    expect(baseline.crystalRadialClearance).toBeGreaterThan(0)
    expect(baseline.dialFootCoverageClearance).toBeGreaterThan(0)

    design.hands.minute.length = 17.2
    design.dial.commercialDiameter = 16.5
    const stressed = buildCollisionModel(design)

    expect(stressed.handCaseClearance).toBeLessThan(0)
    expect(stressed.crystalRadialClearance).toBeLessThan(0)
    expect(stressed.dialFootCoverageClearance).toBeLessThan(0)
  })
})
