import { describe, expect, it } from 'vitest'
import { ACADEMY_STAGE_5_INTERFACE_SEEDS, ACADEMY_STAGE_5_METHOD_SELF_REVIEW } from '../academy/reader/personal/phase014k'
import surfaceSource from './AcademyIntegrationLabSurface.tsx?raw'
import academySurfacesSource from './AcademySurfaces.tsx?raw'
import {
  ACADEMY_STAGE_5_UI_LABEL_SETS,
  academyStage5RequiredDataLabel,
  academyStage5SelfReviewLabel,
} from './academyStage5UiLanguage'

const INTERNAL_TOKEN = /\b(?:unknowns?|source-needed|source-limited|planned-only|rollback|checkpoints?|stop conditions?|drawing|documentally-compatible|manufacturer-drawing|visual-match-only|input-incomplete|datum-conflict)\b/iu

describe('lenguaje visible del laboratorio de integración', () => {
  it('ofrece etiquetas en español para todos los valores canónicos persistidos', () => {
    const labels = Object.values(ACADEMY_STAGE_5_UI_LABEL_SETS).flatMap((group) => Object.values(group))
    expect(labels.length).toBeGreaterThan(80)
    expect(labels.filter((label) => INTERNAL_TOKEN.test(label))).toEqual([])
  })

  it('cubre cada dato requerido y cada punto de autorrevisión sin mostrar su identificador', () => {
    const requiredData = [...new Set(ACADEMY_STAGE_5_INTERFACE_SEEDS.flatMap(({ requiredData: values }) => values))]
    expect(requiredData.every((value) => academyStage5RequiredDataLabel(value) !== 'Dato requerido por documentar')).toBe(true)
    expect(requiredData.every((value) => !academyStage5RequiredDataLabel(value).includes(value))).toBe(true)
    expect(ACADEMY_STAGE_5_METHOD_SELF_REVIEW.every((value) => academyStage5SelfReviewLabel(value) !== 'Revisar este punto del método')).toBe(true)
  })

  it('no vuelve a interpolar estados canónicos directamente en la superficie', () => {
    expect(surfaceSource).not.toMatch(/>\{(?:row\.result|chain\.status|check\.result|component\.sourceType|component\.modificationStatus|doc\.authority|doc\.verificationStatus)\}</u)
    expect(surfaceSource).not.toMatch(/(?:>|['"`])(?:Unknowns?|drawing|documentally-compatible|Checkpoint:|Rollback:|planned-only)(?:<|\s)/u)
    expect(academySurfacesSource).not.toContain('sin mastery')
  })
})
