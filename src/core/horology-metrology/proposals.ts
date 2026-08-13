import type { EngineeringQuantity } from '../horology-engineering'
import type { VersionedMetrologyEntity } from './identity'

export type GeometryProposalStatus = 'draft' | 'needs-more-evidence' | 'ready-for-review' | 'approved' | 'rejected' | 'superseded' | 'implemented' | 'validated'

export interface GeometryCorrectionProposal extends VersionedMetrologyEntity {
  profileId: string
  specimenId: string
  componentId?: string
  fixtureId: string
  fixtureVersion: string
  fixtureEntityId: string
  targetParameter: string
  currentValue?: EngineeringQuantity
  proposedValue: EngineeringQuantity
  delta?: EngineeringQuantity
  measurementSeriesIds: string[]
  comparisonIds: string[]
  imageAnnotationIds: string[]
  rationale: string
  assumptions: string[]
  limitations: string[]
  status: GeometryProposalStatus
  reviewer?: string
  reviewedAt?: string
  decisionReason?: string
  candidatePatch?: Record<string, unknown>
  implementationTaskId?: string
  resultingFixtureVersion?: string
  validationEvidenceIds: string[]
}

const allowedTransitions: Readonly<Record<GeometryProposalStatus, readonly GeometryProposalStatus[]>> = {
  draft: ['needs-more-evidence', 'ready-for-review', 'rejected'],
  'needs-more-evidence': ['draft', 'ready-for-review', 'rejected'],
  'ready-for-review': ['approved', 'rejected', 'needs-more-evidence'],
  approved: ['implemented', 'superseded'],
  rejected: ['draft', 'superseded'],
  superseded: [],
  implemented: ['validated', 'superseded'],
  validated: ['superseded'],
}

export function transitionGeometryProposal(
  proposal: GeometryCorrectionProposal,
  status: GeometryProposalStatus,
  reviewer: string,
  reason: string,
  reviewedAt = new Date().toISOString(),
): GeometryCorrectionProposal {
  if (!allowedTransitions[proposal.status].includes(status)) {
    throw new Error(`Transición de propuesta no permitida: ${proposal.status} → ${status}.`)
  }
  if (!reviewer.trim() || !reason.trim()) throw new Error('La transición necesita revisor y motivo.')
  if (status === 'approved' && proposal.measurementSeriesIds.length === 0) {
    throw new Error('Una propuesta no puede aprobarse sin al menos una serie de medición.')
  }
  return {
    ...structuredClone(proposal),
    status,
    reviewer,
    reviewedAt,
    decisionReason: reason,
    updatedAt: reviewedAt,
    recordVersion: proposal.recordVersion + 1,
  }
}

export function createCandidatePatch(proposal: GeometryCorrectionProposal): Record<string, unknown> {
  if (proposal.status !== 'approved') throw new Error('Solo una propuesta aprobada puede producir un parche candidato.')
  return {
    schemaVersion: 1,
    kind: 'watchlab-geometry-candidate',
    fixtureId: proposal.fixtureId,
    baseFixtureVersion: proposal.fixtureVersion,
    entityId: proposal.fixtureEntityId,
    parameter: proposal.targetParameter,
    proposedValue: structuredClone(proposal.proposedValue),
    proposalId: proposal.id,
    automaticApplication: false,
    changesFidelityAutomatically: false,
  }
}
