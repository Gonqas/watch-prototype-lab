import type { AcademyPersonalCurationPhase } from './types'

export const CURRENT_ACADEMY_CURATION_PHASE = '0.14F' as const

export const ACADEMY_PERSONAL_CURATION_PHASES: readonly AcademyPersonalCurationPhase[] = [
  '0.14E',
  CURRENT_ACADEMY_CURATION_PHASE,
] as const

export function academyPersonalPhaseIncludes(
  phase: AcademyPersonalCurationPhase,
  candidate: AcademyPersonalCurationPhase,
): boolean {
  return ACADEMY_PERSONAL_CURATION_PHASES.indexOf(candidate) <= ACADEMY_PERSONAL_CURATION_PHASES.indexOf(phase)
}
