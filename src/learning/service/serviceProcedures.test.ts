import { describe, expect, it } from 'vitest'
import {
  SERVICE_ACCEPTANCE_CRITERIA,
  SERVICE_EVIDENCE_REQUIREMENTS,
  SERVICE_HAZARDS,
  SERVICE_PROCEDURES,
  SERVICE_TOOL_CAPABILITIES,
  validateServiceProcedureReferences,
} from './serviceProcedures'

describe('Contratos de procedimiento de servicio', () => {
  it('resuelve herramientas, riesgos, inspecciones, evidencia y aceptación', () => {
    expect(SERVICE_TOOL_CAPABILITIES).toHaveLength(8)
    expect(SERVICE_HAZARDS).toHaveLength(6)
    expect(SERVICE_EVIDENCE_REQUIREMENTS).toHaveLength(6)
    expect(SERVICE_ACCEPTANCE_CRITERIA).toHaveLength(6)
    expect(SERVICE_PROCEDURES).toHaveLength(5)
    expect(SERVICE_PROCEDURES.flatMap(validateServiceProcedureReferences)).toEqual([])
  })

  it('no convierte reversibilidad digital en competencia física', () => {
    expect(SERVICE_PROCEDURES.every(({ finalHumanReviewRequired, steps }) =>
      finalHumanReviewRequired && steps.every(({ physicalReversibility }) => physicalReversibility === 'not-guaranteed'))).toBe(true)
  })
})
