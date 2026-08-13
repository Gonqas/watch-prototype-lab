import { describe, expect, it } from 'vitest'
import { validateAuthoringPack } from '../content/authoringValidation'
import { createIntegratedWatchmakingCapstonePack } from './watchmakingCapstoneContent'

describe('fabricación, diseño propio y validación', () => {
  const pack = createIntegratedWatchmakingCapstonePack()

  it('separa tres rutas del estudiante de la ruta interna de calidad', () => {
    expect(pack.manifest.id).toBe('wplab.horology.manufacturing-design-validation')
    expect(pack.manifest.minimumAppVersion).toBe('0.10.0')
    expect(pack.routes.map(({ id }) => id)).toEqual([
      'route.capstone.manufacturing-finishing',
      'route.capstone.personal-watch-design',
      'route.capstone.validation',
      'route.capstone.watch-validation',
    ])
    expect(pack.routes.find(({ id }) => id === 'route.capstone.validation')?.demo).toBe(true)
    expect(pack.routes.find(({ id }) => id === 'route.capstone.watch-validation')?.demo).toBe(false)
    expect(pack.routes.find(({ id }) => id === 'route.capstone.validation')?.moduleIds).toEqual([
      'module.capstone.validation.beginner-usability',
      'module.capstone.validation.accessibility',
      'module.capstone.validation.deferred-retention',
    ])
    expect(pack.routes.find(({ id }) => id === 'route.capstone.watch-validation')?.moduleIds).toEqual([
      'module.capstone.validation.watchmaker-review',
      'module.capstone.validation.calibre-transfer',
    ])
    expect(pack.concepts.find(({ id }) => id === 'concept.capstone.validation.watchmaker-review')?.routeIds)
      .toEqual(['route.capstone.watch-validation'])
    expect(pack.concepts.find(({ id }) => id === 'concept.capstone.validation.calibre-transfer')?.routeIds)
      .toEqual(['route.capstone.watch-validation'])
    expect(pack.concepts.find(({ id }) => id === 'concept.capstone.validation.beginner-usability')?.routeIds)
      .toEqual(['route.capstone.validation'])
    expect(pack.modules).toHaveLength(18)
    expect(pack.lessons).toHaveLength(18)
    expect(pack.activities).toHaveLength(18)
    expect(pack.lessons.every(({ authoring }) => authoring?.studyContract?.sequence === 'theory-first')).toBe(true)
  })

  it('contains a dense theory corpus and no editorial diagnostics', () => {
    const wordCount = pack.blocks.reduce((sum, block) =>
      sum + block.bodyMarkdown.split(/\s+/).filter(Boolean).length, 0)
    expect(wordCount).toBeGreaterThan(15_000)
    expect(validateAuthoringPack(pack).diagnostics).toEqual([])
  })

  it('keeps the three execution contracts separated and conservative', () => {
    const manufacturing = pack.activities.filter(({ authoring }) => authoring?.manufacturingContract)
    const design = pack.activities.filter(({ authoring }) => authoring?.personalWatchDesignContract)
    const validation = pack.activities.filter(({ authoring }) => authoring?.validationContract)
    expect(manufacturing).toHaveLength(7)
    expect(design).toHaveLength(6)
    expect(validation).toHaveLength(5)
    expect(manufacturing.every(({ authoring }) =>
      authoring?.manufacturingContract?.physicalCompletionClaim === false
      && authoring.manufacturingContract.supervisedWorkshopRequired)).toBe(true)
    expect(design.every(({ authoring }) =>
      authoring?.personalWatchDesignContract?.mutatesTechnicalProject === false
      && authoring.personalWatchDesignContract.manufacturingReadinessClaim === false)).toBe(true)
    expect(validation.every(({ authoring }) =>
      authoring?.validationContract?.automaticCompetenceClaim === false
      && authoring.validationContract.adverseFindingBlocksRelease)).toBe(true)
  })

  it('uses only human review to demonstrate the new competencies', () => {
    expect(pack.rubrics.every(({ rules }) => rules.every((rule) =>
      rule.acceptedEvidenceKinds.length === 1 && rule.acceptedEvidenceKinds[0] === 'human-review'))).toBe(true)
    expect(pack.evidenceTemplates.filter(({ kind }) => kind === 'human-review')).toHaveLength(18)
  })
})
