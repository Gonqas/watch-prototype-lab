import { ACADEMY_COMPATIBILITY_PHASES, ACADEMY_CURATION_LAYER_REGISTRY, ACADEMY_PERSONAL_CURATION_PHASES, ACADEMY_READER_CURATION_PHASES, CURRENT_ACADEMY_CURATION_PHASE } from '../registry'

export const ACADEMY_014H_PHASE_REGISTRY_SNAPSHOT = {
  schema: 'wplab-academy-curation-phase-registry-v1',
  currentPhase: CURRENT_ACADEMY_CURATION_PHASE,
  compatibilityPhases: ACADEMY_COMPATIBILITY_PHASES,
  readerPhases: ACADEMY_READER_CURATION_PHASES,
  personalPhases: ACADEMY_PERSONAL_CURATION_PHASES,
  layers: ACADEMY_CURATION_LAYER_REGISTRY,
  historicalBuildPolicy: 'Cada fase explícita compone únicamente sus capas acumuladas; la fase desconocida o vacía produce error.',
} as const
