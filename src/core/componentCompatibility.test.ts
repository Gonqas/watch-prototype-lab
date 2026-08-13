import { describe, expect, it } from 'vitest'
import {
  analyzeComponentCompatibility,
  applyMovementComponent,
  movementComponentPresetFromProject,
} from './componentCompatibility'
import { createMechanicalProject, createScratchMechanicalProject } from '../vnext/presets'

function component(project: ReturnType<typeof createMechanicalProject>, part: 'plate' | 'center') {
  const preset = movementComponentPresetFromProject(project, part)
  if (!preset) throw new Error('No se pudo crear el componente donante')
  return preset
}

describe('constructor de movimientos multicalibre', () => {
  it('crea un proyecto desde cero sin conjuntos preasignados', () => {
    const project = createScratchMechanicalProject()
    expect(project.schemaVersion).toBe(5)
    expect(project.movement.kind).toBe('mechanical')
    if (project.movement.kind !== 'mechanical') return
    expect(project.movement.buildMode).toBe('scratch')
    expect(project.movement.componentOrigins).toEqual({})
  })

  it('conserva procedencia e interfaces al guardar una pieza donante', () => {
    const donor = createMechanicalProject()
    const preset = component(donor, 'plate')
    expect(preset.kind).toBe('movement-component')
    expect(preset.origin.kind).toBe('designed')
    expect(preset.origin.sourceProjectId).toBe(donor.id)
    expect(preset.interfaces.map((item) => item.label)).toContain('Diametro')
  })

  it('bloquea una platina que no entra en la caja objetivo', () => {
    const donor = createMechanicalProject()
    if (donor.movement.kind !== 'mechanical') return
    donor.movement.plateDiameter.value = 48
    const target = createScratchMechanicalProject()
    target.case.innerDiameter.value = 36
    const report = analyzeComponentCompatibility(target, component(donor, 'plate'))
    expect(report.state).toBe('incompatible')
    expect(report.issues.some((issue) => issue.id === 'plate-case' && issue.severity === 'blocker')).toBe(true)
  })

  it('aplica una pieza compatible y marca el movimiento como hibrido con su origen', () => {
    const donor = createMechanicalProject()
    if (donor.movement.kind !== 'mechanical') return
    donor.movement.plateThickness.value = 1.27
    const target = createScratchMechanicalProject()
    const preset = component(donor, 'plate')
    applyMovementComponent(target, preset)
    if (target.movement.kind !== 'mechanical') return
    expect(target.movement.plateThickness.value).toBe(1.27)
    expect(target.movement.componentOrigins.plate?.sourceProjectId).toBe(donor.id)
    expect(target.movement.buildMode).toBe('scratch')
  })

  it('detecta interferencia entre pivote y rubi al trasplantar una rueda', () => {
    const donor = createMechanicalProject()
    if (donor.movement.kind !== 'mechanical') return
    const center = donor.movement.arbors.find((arbor) => arbor.id === 'center')
    if (!center || !center.jewelHoleDiameter) throw new Error('Centro sin rubi')
    center.pivotDiameter.value = 0.22
    center.jewelHoleDiameter.value = 0.18
    const report = analyzeComponentCompatibility(createScratchMechanicalProject(), component(donor, 'center'))
    expect(report.state).toBe('incompatible')
    expect(report.issues.some((issue) => issue.id === 'pivot-jewel-interference')).toBe(true)
  })
})
