import { describe, expect, it } from 'vitest'
import {
  ACADEMY_PERSONAL_CURATION_PHASES,
  ACADEMY_READER_CURATION_PHASES,
  CURRENT_ACADEMY_CURATION_PHASE,
  academyPhaseIncludes,
  academyPhaseIsAfter,
  academyPhaseIsBefore,
  academyPhaseLayers,
  academyPhaseRank,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import type { AcademyReaderCurationPhase } from '../../src/learning/academy/reader/academyReaderModel'

describe('registro acumulativo de curación hasta 0.14K', () => {
  it('define el orden canónico completo y la fase activa', () => {
    expect(ACADEMY_READER_CURATION_PHASES).toEqual(['0.14D', '0.14E', '0.14F', '0.14G', '0.14H', '0.14I', '0.14J', '0.14K'])
    expect(ACADEMY_PERSONAL_CURATION_PHASES).toEqual(['0.14E', '0.14F', '0.14G', '0.14H', '0.14I', '0.14J', '0.14K'])
    expect(CURRENT_ACADEMY_CURATION_PHASE).toBe('0.14K')
  })

  it.each(ACADEMY_READER_CURATION_PHASES.flatMap((phase, phaseRank) =>
    ACADEMY_READER_CURATION_PHASES.map((candidate, candidateRank) => ({ phase, candidate, expected: candidateRank <= phaseRank })),
  ))('$phase incluye $candidate = $expected', ({ phase, candidate, expected }) => {
    expect(academyPhaseIncludes(phase, candidate)).toBe(expected)
    expect(academyPhaseIsBefore(phase, candidate)).toBe(academyPhaseRank(phase) < academyPhaseRank(candidate))
    expect(academyPhaseIsAfter(phase, candidate)).toBe(academyPhaseRank(phase) > academyPhaseRank(candidate))
  })

  it('compone C como compatibilidad y solo las capas acumuladas de lector', () => {
    expect(academyPhaseLayers('0.14F').map(({ phase }) => phase)).toEqual(['0.14C', '0.14D', '0.14E', '0.14F'])
    expect(academyPhaseLayers('0.14G').map(({ phase }) => phase)).toEqual(['0.14C', '0.14D', '0.14E', '0.14F', '0.14G'])
    expect(academyPhaseLayers('0.14I').map(({ phase }) => phase)).toEqual(['0.14C', '0.14D', '0.14E', '0.14F', '0.14G', '0.14H', '0.14I'])
  })

  it('rechaza valores vacíos y desconocidos sin convertir -1 en rango válido', () => {
    expect(() => academyPhaseRank('' as AcademyReaderCurationPhase)).toThrow(/vacía/)
    expect(() => academyPhaseRank('0.14Z' as AcademyReaderCurationPhase)).toThrow(/desconocida/)
    expect(() => academyPhaseIncludes('0.14I', '0.14Z' as AcademyReaderCurationPhase)).toThrow(/desconocida/)
  })
})
