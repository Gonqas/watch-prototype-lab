import { describe, expect, it } from 'vitest'
import { evaluateProject } from './engine'
import { dimension } from './model'
import { createAutomaticMechanicalProject, createMechanicalProject, createQuartzProject } from './presets'

describe('canonical collision engine', () => {
  it('places an automatic rotor on the caseback side without silently moving the train', () => {
    const project = createAutomaticMechanicalProject()
    const valid = evaluateProject(project)
    expect(valid.findings.some((item) => item.id === 'movement-dial-collision')).toBe(false)
    expect(valid.findings.some((item) => item.id === 'rotor-train-collision')).toBe(false)

    if (project.movement.kind !== 'mechanical') throw new Error('Expected mechanical movement')
    project.movement.automatic!.rotorZ.value = 0.4
    const colliding = evaluateProject(project)
    expect(colliding.findings.some((item) => item.id === 'rotor-train-collision' && item.severity === 'error')).toBe(true)
  })

  it('uses the same mechanical train result inside the complete watch evaluation', () => {
    const result = evaluateProject(createMechanicalProject())

    expect(result.train?.centerToFourthRatio).toBeCloseTo(60, 6)
    expect(result.train?.calculatedVph).toBeCloseTo(21_600, 6)
    expect(result.findings.some((item) => item.id === 'train-vph')).toBe(false)
  })

  it('rejects a recess that cuts through the dial floor', () => {
    const project = createQuartzProject('miyota_2035')
    project.dial.recess.enabled = true
    project.dial.recess.depth.value = 0.6

    const result = evaluateProject(project)

    expect(result.findings.some((item) => item.id === 'dial-recess-through')).toBe(true)
  })

  it('detects hands crossing the actual crystal inner profile', () => {
    const project = createQuartzProject('miyota_2035')
    project.case.usableInteriorHeight.value = 3.4
    project.crystal.innerRise.value = 0

    const result = evaluateProject(project)

    expect(result.findings.some((item) => item.id.startsWith('hand-crystal-'))).toBe(true)
  })

  it('checks a decorative relief against the full 360 degree hand sweep', () => {
    const project = createQuartzProject('miyota_2035')
    project.dial.reliefs.push({
      id: 'test-relief',
      name: 'Relieve de prueba',
      shape: 'block',
      x: dimension(6),
      y: dimension(0),
      width: dimension(2),
      length: dimension(2),
      height: dimension(1),
      color: '#d9b45b',
    })

    const result = evaluateProject(project)

    expect(result.findings.some((item) => item.id.startsWith('relief-sweep-test-relief-'))).toBe(true)
  })

  it('validates lug attachment and crown tube envelope as case geometry', () => {
    const project = createQuartzProject('miyota_2035')
    project.case.lugSpacing.value = 38
    project.case.crownTubeDiameter.value = 7

    const result = evaluateProject(project)

    expect(result.findings.some((item) => item.id === 'case-lug-attachment')).toBe(true)
    expect(result.findings.some((item) => item.id === 'crown-tube-diameter')).toBe(true)
  })
})
