import { describe, expect, it } from 'vitest'
import {
  EducationalSimulationResultSchema,
  EngineeringValidationResultSchema,
  EvidenceClaimSchema,
  FidelityProfileSchema,
  ProjectChangeProposalSchema,
} from './fidelity'

const fidelity = { geometry: 'G1', kinematics: 'K2', physics: 'P0', limitations: ['Sin fuerzas.'] } as const
const claim = {
  id: 'claim-1',
  claimType: 'hypothesis',
  claim: 'Una pieza podría bloquear el tren.',
  method: 'Hipótesis educativa',
  fidelity,
  reliability: 'pending',
  inputFingerprint: 'input-1',
  recordedAt: '2026-07-22T09:00:00.000Z',
  methodVersion: '1.0.0',
  sources: [],
  falsificationCondition: 'El tren gira sin contacto.',
} as const

describe('G/K/P fidelity contracts', () => {
  it('validates independent axes and rejects out-of-range levels', () => {
    expect(FidelityProfileSchema.parse(fidelity)).toEqual(fidelity)
    expect(FidelityProfileSchema.safeParse({ ...fidelity, physics: 'P5' }).success).toBe(false)
    expect(EvidenceClaimSchema.parse(claim).claimType).toBe('hypothesis')
  })

  it('keeps educational, engineering and proposal results structurally distinct', () => {
    const educational = {
      resultKind: 'educational-simulation', id: 'edu-1', objective: 'Comprender', explanation: 'Abstracción',
      claims: [claim], fidelity, inputFingerprint: 'input-1', producedAt: '2026-07-22T09:00:00.000Z',
      simulatorVersion: '1.0.0', engineeringAuthority: false,
    }
    expect(EducationalSimulationResultSchema.safeParse(educational).success).toBe(true)
    expect(EngineeringValidationResultSchema.safeParse(educational).success).toBe(false)
    expect(ProjectChangeProposalSchema.safeParse(educational).success).toBe(false)
  })
})
