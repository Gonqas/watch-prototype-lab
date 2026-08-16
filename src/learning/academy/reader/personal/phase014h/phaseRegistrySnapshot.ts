/** Snapshot histórico inmutable: no debe seguir la fase activa posterior a 0.14H. */
export const ACADEMY_014H_PHASE_REGISTRY_SNAPSHOT = {
  schema: 'wplab-academy-curation-phase-registry-v1',
  currentPhase: '0.14H',
  compatibilityPhases: ['0.14C'],
  readerPhases: ['0.14D', '0.14E', '0.14F', '0.14G', '0.14H'],
  personalPhases: ['0.14E', '0.14F', '0.14G', '0.14H'],
  layers: [
    { phase: '0.14C', layerId: 'compatibility', purpose: 'compatibilidad de segmentos y progreso históricos' },
    { phase: '0.14D', layerId: 'editorial-base', purpose: 'lector continuo y decisiones visuales editoriales' },
    { phase: '0.14E', layerId: 'personal-pilots', purpose: 'pilotos personales y visuales revisados' },
    { phase: '0.14F', layerId: 'stage-0', purpose: 'etapa 0 completa' },
    { phase: '0.14G', layerId: 'stage-1', purpose: 'etapa 1 completa' },
    { phase: '0.14H', layerId: 'stage-2', purpose: 'etapa 2 completa' },
  ],
  historicalBuildPolicy: 'Cada fase explícita compone únicamente sus capas acumuladas; la fase desconocida o vacía produce error.',
} as const
