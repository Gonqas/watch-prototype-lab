import { z } from 'zod'
import { SourceCitationSchema } from './sources'

export const geometryFidelityValues = ['G0', 'G1', 'G2', 'G3', 'G4'] as const
export const kinematicFidelityValues = ['K0', 'K1', 'K2', 'K3', 'K4'] as const
export const physicsFidelityValues = ['P0', 'P1', 'P2', 'P3', 'P4'] as const

export const GeometryFidelitySchema = z.enum(geometryFidelityValues)
export const KinematicFidelitySchema = z.enum(kinematicFidelityValues)
export const PhysicsFidelitySchema = z.enum(physicsFidelityValues)

export type GeometryFidelity = z.infer<typeof GeometryFidelitySchema>
export type KinematicFidelity = z.infer<typeof KinematicFidelitySchema>
export type PhysicsFidelity = z.infer<typeof PhysicsFidelitySchema>

export const FidelityProfileSchema = z.object({
  geometry: GeometryFidelitySchema,
  kinematics: KinematicFidelitySchema,
  physics: PhysicsFidelitySchema,
  limitations: z.array(z.string().min(1).max(500)).default([]),
}).strict()
export type FidelityProfile = z.infer<typeof FidelityProfileSchema>

const uncertaintySchema = z.object({
  value: z.number(),
  plusMinus: z.number().nonnegative(),
  unit: z.string().min(1).max(32),
  confidence: z.number().min(0).max(1).optional(),
}).strict()

const evidenceBase = {
  id: z.string().min(1).max(160),
  claim: z.string().min(1).max(4000),
  classification: z.enum([
    'official',
    'observed',
    'measured',
    'original-explanation',
    'calculated',
    'inferred',
    'hypothesis',
  ]).default('original-explanation'),
  method: z.string().min(1).max(500),
  fidelity: FidelityProfileSchema,
  reliability: z.enum(['high', 'medium', 'low', 'pending']),
  uncertainty: uncertaintySchema.optional(),
  inputFingerprint: z.string().min(1).max(160),
  recordedAt: z.string().min(10),
  methodVersion: z.string().min(1).max(80),
  sources: z.array(SourceCitationSchema).default([]),
}

export const EvidenceClaimSchema = z.discriminatedUnion('claimType', [
  z.object({ ...evidenceBase, claimType: z.literal('observation'), observedUnitId: z.string().min(1) }).strict(),
  z.object({ ...evidenceBase, claimType: z.literal('source'), sourceStatement: z.string().min(1) }).strict(),
  z.object({ ...evidenceBase, claimType: z.literal('calculation'), expression: z.string().min(1) }).strict(),
  z.object({ ...evidenceBase, claimType: z.literal('inference'), premises: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ ...evidenceBase, claimType: z.literal('hypothesis'), falsificationCondition: z.string().min(1) }).strict(),
])
export type EvidenceClaim = z.infer<typeof EvidenceClaimSchema>

export const EducationalSimulationResultSchema = z.object({
  resultKind: z.literal('educational-simulation'),
  id: z.string().min(1),
  objective: z.string().min(1),
  explanation: z.string().min(1),
  claims: z.array(EvidenceClaimSchema),
  fidelity: FidelityProfileSchema,
  inputFingerprint: z.string().min(1),
  producedAt: z.string().min(10),
  simulatorVersion: z.string().min(1),
  engineeringAuthority: z.literal(false),
}).strict()
export type EducationalSimulationResult = z.infer<typeof EducationalSimulationResultSchema>

export const EngineeringValidationResultSchema = z.object({
  resultKind: z.literal('engineering-validation'),
  id: z.string().min(1),
  status: z.enum(['pass', 'fail', 'indeterminate']),
  method: z.string().min(1),
  claims: z.array(EvidenceClaimSchema),
  fidelity: FidelityProfileSchema,
  inputFingerprint: z.string().min(1),
  producedAt: z.string().min(10),
  validatorVersion: z.string().min(1),
  tolerances: z.record(z.string(), z.number()),
}).strict()
export type EngineeringValidationResult = z.infer<typeof EngineeringValidationResultSchema>

export const ProjectChangeProposalSchema = z.object({
  resultKind: z.literal('project-change-proposal'),
  id: z.string().min(1),
  projectId: z.string().min(1),
  rationale: z.string().min(1),
  basedOnClaimIds: z.array(z.string().min(1)),
  operations: z.array(z.object({
    operation: z.enum(['create', 'update', 'replace', 'transplant', 'deactivate', 'delete']),
    entityId: z.string().min(1).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  }).strict()).min(1),
  status: z.enum(['proposed', 'accepted', 'rejected']),
  createdAt: z.string().min(10),
}).strict()
export type ProjectChangeProposal = z.infer<typeof ProjectChangeProposalSchema>
