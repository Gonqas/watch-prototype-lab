import { stableSerialize } from './identity'
import { createCandidatePatch, type GeometryCorrectionProposal } from './proposals'

export interface CadCandidatePlan<Project extends object> {
  proposalId: string
  sourceFingerprint: string
  candidateFingerprint: string
  sourceProject: Project
  candidateProject: Project
  patch: Record<string, unknown>
  automaticApplication: false
  canonicalMutationAllowed: false
  rollbackSnapshot: Project
}

export interface CadCandidateExecutionResult<Result> {
  result: Result
  sourceUnchanged: boolean
  candidateFingerprint: string
  rollbackSnapshotAvailable: true
}

export function prepareCadCandidatePlan<Project extends object>(
  proposal: GeometryCorrectionProposal,
  canonicalProject: Project,
  applyPatchToCopy: (copy: Project, patch: Record<string, unknown>) => Project,
): CadCandidatePlan<Project> {
  const patch = createCandidatePatch(proposal)
  const sourceProject = structuredClone(canonicalProject)
  const sourceFingerprint = stableSerialize(sourceProject)
  const candidateProject = applyPatchToCopy(structuredClone(sourceProject), structuredClone(patch))
  if (candidateProject === canonicalProject) throw new Error('El adaptador CAD debe trabajar sobre una copia independiente.')
  if (stableSerialize(canonicalProject) !== sourceFingerprint) {
    throw new Error('El adaptador intentó modificar el proyecto canónico.')
  }
  return {
    proposalId: proposal.id,
    sourceFingerprint,
    candidateFingerprint: stableSerialize(candidateProject),
    sourceProject,
    candidateProject: structuredClone(candidateProject),
    patch,
    automaticApplication: false,
    canonicalMutationAllowed: false,
    rollbackSnapshot: structuredClone(sourceProject),
  }
}

export async function executeCadCandidatePlan<Project extends object, Result>(
  plan: CadCandidatePlan<Project>,
  runCadOnCopy: (candidateProject: Project) => Promise<Result>,
): Promise<CadCandidateExecutionResult<Result>> {
  const before = stableSerialize(plan.sourceProject)
  const result = await runCadOnCopy(structuredClone(plan.candidateProject))
  return {
    result,
    sourceUnchanged: before === stableSerialize(plan.sourceProject) && before === plan.sourceFingerprint,
    candidateFingerprint: plan.candidateFingerprint,
    rollbackSnapshotAvailable: true,
  }
}

export function rollbackCadCandidatePlan<Project extends object>(plan: CadCandidatePlan<Project>): Project {
  return structuredClone(plan.rollbackSnapshot)
}
