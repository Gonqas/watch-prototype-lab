/**
 * Deterministic release boundary for additive recognition of pre-0.14B.1
 * activity completions. Keep this value shared by runtime and reports.
 */
export const ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF = '2026-08-14T12:45:00.000Z'

export interface AcademyProgressCompatibilityPolicy {
  policyId: string
  policyVersion: string
  legacyCutoff: string
  appliesTo: readonly ['completed-activity-session-without-explicit-lesson-completion']
  recognitionMethod: 'additive-legacy-inference'
  introducedByRelease: '0.14B.1'
  supersededBy: string | null
  notes: string
}

export const ACADEMY_PROGRESS_COMPATIBILITY_POLICY: AcademyProgressCompatibilityPolicy = {
  policyId: 'academy.progress-compatibility.pre-0.14B1-study-recognition',
  policyVersion: '1.0.0',
  legacyCutoff: ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF,
  appliesTo: ['completed-activity-session-without-explicit-lesson-completion'],
  recognitionMethod: 'additive-legacy-inference',
  introducedByRelease: '0.14B.1',
  supersededBy: null,
  notes: 'Reconoce estudio previamente inferido sin reescribir sesiones ni convertirlo en finalización explícita.',
}
