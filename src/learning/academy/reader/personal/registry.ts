import type { AcademyPersonalCurationPhase } from './types'
import type { AcademyReaderCurationPhase } from '../academyReaderModel'

export const CURRENT_ACADEMY_CURATION_PHASE = '0.14I' as const

export const ACADEMY_READER_CURATION_PHASES: readonly AcademyReaderCurationPhase[] = [
  '0.14D',
  '0.14E',
  '0.14F',
  '0.14G',
  '0.14H',
  '0.14I',
] as const

export const ACADEMY_PERSONAL_CURATION_PHASES: readonly AcademyPersonalCurationPhase[] = [
  '0.14E',
  '0.14F',
  '0.14G',
  '0.14H',
  '0.14I',
] as const

export const ACADEMY_COMPATIBILITY_PHASES = ['0.14C'] as const

export const ACADEMY_CURATION_LAYER_REGISTRY = [
  { phase: '0.14C', layerId: 'compatibility', purpose: 'compatibilidad de segmentos y progreso históricos' },
  { phase: '0.14D', layerId: 'editorial-base', purpose: 'lector continuo y decisiones visuales editoriales' },
  { phase: '0.14E', layerId: 'personal-pilots', purpose: 'pilotos personales y visuales revisados' },
  { phase: '0.14F', layerId: 'stage-0', purpose: 'etapa 0 completa' },
  { phase: '0.14G', layerId: 'stage-1', purpose: 'etapa 1 completa' },
  { phase: '0.14H', layerId: 'stage-2', purpose: 'etapa 2 completa' },
  { phase: '0.14I', layerId: 'stage-0-1-remediation-and-stage-3', purpose: 'preservación activa de etapas 0–1 y etapa 3 completa' },
] as const

function phaseRank(phase: string): number {
  if (!phase) throw new Error('La fase de curación no puede estar vacía.')
  const rank = ACADEMY_READER_CURATION_PHASES.findIndex((candidate) => candidate === phase)
  if (rank < 0) throw new Error(`Fase de curación desconocida: ${phase}`)
  return rank
}

export function academyPhaseRank(phase: AcademyReaderCurationPhase): number {
  return phaseRank(phase)
}

export function academyPhaseIncludes(phase: AcademyReaderCurationPhase, candidate: AcademyReaderCurationPhase): boolean {
  return phaseRank(candidate) <= phaseRank(phase)
}

export function academyPhaseIsBefore(phase: AcademyReaderCurationPhase, candidate: AcademyReaderCurationPhase): boolean {
  return phaseRank(phase) < phaseRank(candidate)
}

export function academyPhaseIsAfter(phase: AcademyReaderCurationPhase, candidate: AcademyReaderCurationPhase): boolean {
  return phaseRank(phase) > phaseRank(candidate)
}

export function academyPhaseLayers(phase: AcademyReaderCurationPhase) {
  const activeReaderLayers = ACADEMY_READER_CURATION_PHASES.filter((candidate) => academyPhaseIncludes(phase, candidate))
  return ACADEMY_CURATION_LAYER_REGISTRY.filter((layer) => layer.phase === '0.14C' || activeReaderLayers.some((candidate) => candidate === layer.phase))
}

export function academyPersonalPhaseIncludes(
  phase: AcademyPersonalCurationPhase,
  candidate: AcademyPersonalCurationPhase,
): boolean {
  return academyPhaseIncludes(phase, candidate)
}
