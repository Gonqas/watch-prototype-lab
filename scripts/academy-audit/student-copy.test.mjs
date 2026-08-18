import { describe, expect, it } from 'vitest'
import { polishLearnerFacing, polishStudentCopy } from '../academy-editorial/student-copy.mjs'

describe('polishStudentCopy', () => {
  it('conserva intactos los identificadores de los términos del glosario', () => {
    const source = 'Consulta {{term:term.horology.quartz-resonator}}, {{term:term.horology.stepper-rotor}} y {{term:term.horology.motion-works}}.'
    const result = polishStudentCopy(source)

    expect(result).toBe(source)
    expect(result).not.toMatch(/term\.horology\.(?:resonador de cuarzo|rotor paso a paso|minutería)/u)
  })

  it('corrige combinaciones de fidelidad sin producir palabras duplicadas', () => {
    const source = '2035 R2 estructural; el fixture R2 conserva sus límites.'
    const result = polishStudentCopy(source)

    expect(result).toContain('2035 nivel de ensamblaje estructural')
    expect(result).toContain('modelo didáctico con nivel de ensamblaje estructural')
    expect(result).not.toMatch(/estructural\s+estructural/u)
    expect(polishStudentCopy(result)).toBe(result)
  })

  it('no traduce el contenido de la rama inglesa al pulir el español', () => {
    const source = { terms: { es: 'stepper rotor', en: 'stepper rotor' } }

    expect(polishLearnerFacing(source)).toEqual({ terms: { es: 'rotor paso a paso', en: 'stepper rotor' } })
  })
})
