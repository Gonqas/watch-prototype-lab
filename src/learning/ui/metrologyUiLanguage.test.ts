import { describe, expect, it } from 'vitest'
import { FINDING_TYPES_BY_CATEGORY } from '../../core/horology-metrology'
import surfaceSource from './MetrologySurface.tsx?raw'
import workbenchSource from './MetrologyImageWorkbench.tsx?raw'
import { METROLOGY_UI_LABEL_SETS, metrologyFindingTypeLabel } from './metrologyUiLanguage'

const INTERNAL_TOKEN = /\b(?:as-received|not-mappable|zero-check|critical-unknown|visible-oil|missing-tooth|needs-more-evidence|ready-for-review|diameter-three-point|apparent-discrepancy|measurement-insufficient)\b/iu

describe('lenguaje visible de metrología', () => {
  it('localiza todos los estados y categorías de los registros', () => {
    const labels = Object.values(METROLOGY_UI_LABEL_SETS).flatMap((group) => Object.values(group))
    expect(labels.length).toBeGreaterThan(80)
    expect(labels.filter((label) => INTERNAL_TOKEN.test(label))).toEqual([])
    expect(Object.values(FINDING_TYPES_BY_CATEGORY).flat().every((value) => metrologyFindingTypeLabel(value) !== value)).toBe(true)
  })

  it('no interpola enums de metrología directamente en las superficies', () => {
    expect(surfaceSource).not.toMatch(/>\{(?:selected\.condition|component\.correspondence|instrument\.type|verification\.kind|verification\.status|finding\.category|finding\.type|finding\.severity|item\.status|comparison\.interpretation|proposal\.status)\}</u)
    expect(workbenchSource).not.toMatch(/>\{(?:annotation\.kind|annotation\.method)\}</u)
  })
})
