import { describe, expect, it } from 'vitest'
import {
  ARCHITECTURE_FAMILIES,
  COMPARATIVE_MOVEMENT_CASES,
  COMPARATIVE_SOURCES,
  comparativeCasesForFamily,
} from './comparativeAtlas'

describe('Atlas comparativo de arquitectura', () => {
  it('conserva familias, casos y fuentes sin fingir geometría', () => {
    expect(ARCHITECTURE_FAMILIES).toHaveLength(14)
    expect(COMPARATIVE_MOVEMENT_CASES).toHaveLength(11)
    expect(COMPARATIVE_SOURCES).toHaveLength(13)
    expect(COMPARATIVE_MOVEMENT_CASES.filter(({ modelAvailability }) => modelAvailability === 'structural')
      .map(({ id }) => id)).toEqual(['case.miyota.8215', 'case.miyota.2035'])
    expect(COMPARATIVE_MOVEMENT_CASES.filter(({ modelAvailability }) => modelAvailability === 'none')
      .every(({ geometryClaim }) => geometryClaim === 'none')).toBe(true)
  })

  it('permite comparar cada familia con sus casos documentados', () => {
    expect(ARCHITECTURE_FAMILIES.every(({ id }) => comparativeCasesForFamily(id).length > 0)).toBe(true)
    expect(COMPARATIVE_MOVEMENT_CASES.every(({ sourceIds, unknowns }) => sourceIds.length > 0 && unknowns.length > 0)).toBe(true)
  })
})
