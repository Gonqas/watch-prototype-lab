import { describe, expect, it } from 'vitest'
import {
  MANUFACTURING_HAZARDS,
  MANUFACTURING_INSPECTIONS,
  MANUFACTURING_PROCESS_PLANS,
  ManufacturingHazardSchema,
  ManufacturingInspectionSchema,
  ManufacturingProcessPlanSchema,
  validateManufacturingCatalog,
} from './manufacturing'

describe('manufacturing catalog', () => {
  it('keeps every process, hazard and inspection valid and linked', () => {
    expect(ManufacturingHazardSchema.array().parse(MANUFACTURING_HAZARDS)).toHaveLength(6)
    expect(ManufacturingInspectionSchema.array().parse(MANUFACTURING_INSPECTIONS)).toHaveLength(7)
    expect(ManufacturingProcessPlanSchema.array().parse(MANUFACTURING_PROCESS_PLANS)).toHaveLength(7)
    expect(validateManufacturingCatalog()).toEqual([])
  })

  it('covers the complete watch exterior, movement structure, micromechanics and decoration', () => {
    const artifacts = new Set(MANUFACTURING_PROCESS_PLANS.flatMap(({ artifactKinds }) => artifactKinds))
    expect(artifacts).toEqual(new Set([
      'case', 'dial', 'hands', 'mainplate', 'bridge', 'micromechanical-part', 'decorated-surface',
    ]))
  })

  it('never turns a digital process plan into a physical completion claim', () => {
    expect(MANUFACTURING_PROCESS_PLANS.every(({ physicalBoundary }) =>
      /taller|físic|real|ensayo|seguridad|medici|entrenamiento/i.test(physicalBoundary))).toBe(true)
    expect(MANUFACTURING_PROCESS_PLANS.every(({ toleranceDecisions, acceptanceCriteria }) =>
      toleranceDecisions.length > 0 && acceptanceCriteria.length > 0)).toBe(true)
  })
})
