import { describe, expect, it } from 'vitest'
import { LearningPackSchema } from '../content/learningPack'
import { createIntegratedInspectionMetrologyPack } from './inspectionMetrologyContent'

describe('integrated inspection and metrology course', () => {
  const pack = createIntegratedInspectionMetrologyPack()

  it('is a complete, schema-valid, offline package', () => {
    expect(() => LearningPackSchema.parse(pack)).not.toThrow()
    expect(pack.manifest.id).toBe('wplab.horology.inspection-metrology')
    expect(pack.manifest.packageVersion).toBe('0.2.0')
    expect(pack.modules).toHaveLength(14)
    expect(pack.lessons).toHaveLength(14)
    expect(pack.activities).toHaveLength(28)
    expect(pack.scenes).toHaveLength(28)
    expect(pack.competencies).toHaveLength(18)
    expect(pack.activities.every(({ authoring }) => authoring?.offline)).toBe(true)
  })

  it('assesses traceability and method rather than only a numeric answer', () => {
    const serializedEvidence = JSON.stringify(pack.evidenceTemplates)
    for (const field of ['specimenId', 'instrumentId', 'instrumentVerificationId', 'uncertainty', 'confidence', 'comparisonId', 'proposalId']) {
      expect(serializedEvidence).toContain(field)
    }
    const simpleChoiceCount = pack.activities.filter(({ authoring }) =>
      authoring?.interactionContract?.responseModel === 'single-choice').length
    expect(simpleChoiceCount).toBeLessThan(pack.activities.length / 2)
  })

  it('keeps retention outside the learning session and separates source authority', () => {
    const serializedRecommendations = JSON.stringify(pack.recommendations)
    for (const day of [1, 7, 21]) expect(serializedRecommendations).toContain(String(day))
    expect(serializedRecommendations).not.toMatch(/same-session|misma sesión/iu)
    expect(pack.sources.map(({ id }) => id)).toEqual(expect.arrayContaining([
      'source.metrology.bipm.vim',
      'source.metrology.bipm.gum',
      'source.metrology.nist.handbook',
      'source.metrology.original-course',
    ]))
  })
})
