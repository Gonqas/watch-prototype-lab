import { describe, expect, it } from 'vitest'
import {
  createIntegratedMechanicalFoundationsPack,
  MECHANICAL_FOUNDATIONS_PRODUCT_INDEX,
} from './mechanicalFoundationsContent'

describe('Sistema 4E · contenido integrado', () => {
  it('materializa la ruta completa con laboratorios, evidencia y retención posterior', () => {
    const pack = createIntegratedMechanicalFoundationsPack()
    expect(pack.manifest).toMatchObject({
      id: 'wplab.horology.mechanical-foundations',
      packageVersion: '0.5.0',
      distribution: 'local-unsigned',
      editorialStatus: 'in-review',
      languages: ['es-ES'],
    })
    expect(pack.routes[0].title.es).toBe('Fundamentos del reloj mecánico')
    expect(pack.modules).toHaveLength(12)
    expect(pack.routes[0].prerequisiteConceptIds).toEqual([])
    expect(pack.manifest.dependencies).toContainEqual({
      packageId: 'wplab.horology.functional-map',
      versionRange: '^0.5.0',
    })
    expect(pack.lessons[0].authoring?.externalPrerequisites).toEqual([{
      packageId: 'wplab.horology.functional-map',
      versionRange: '^0.5.0',
      moduleIds: ['module.horology.functional-map'],
      competencyIds: [
        'competency.horology.identify-functional-subsystems',
        'competency.horology.explain-mechanical-energy-chain',
        'competency.horology.predict-system-interruption',
      ],
      recommendedButOptionalRouteIds: ['route.quartz2035.isa-to-2035'],
    }])
    expect(pack.lessons).toHaveLength(12)
    expect(pack.blocks.filter(({ id }) => id.startsWith('block.mechanical.theory.'))).toHaveLength(6)
    expect(pack.lessons.filter(({ authoring }) => authoring?.studyContract?.sequence === 'theory-first')).toHaveLength(12)
    expect(pack.lessons.filter(({ authoring }) => authoring?.studyContract)
      .every(({ authoring }) => (authoring?.studyContract?.minimumTheoryMinutes ?? 0) >= 20)).toBe(true)
    expect(pack.activities).toHaveLength(29)
    expect(pack.competencies).toHaveLength(16)
    expect(pack.evidenceTemplates).toHaveLength(16)
    expect(pack.rubrics).toHaveLength(16)
    expect(pack.recommendations).toHaveLength(16)
    expect(pack.glossary.length).toBeGreaterThanOrEqual(48)
    expect(pack.activities.every(({ authoring }) => authoring?.mechanicalLabContract?.normalizedPhysicsOnly)).toBe(true)
    expect(pack.activities.every(({ authoring }) => authoring?.mechanicalLabContract?.reducedMotion)).toBe(true)
    expect(pack.activities.every(({ authoring }) => authoring?.mechanicalLabContract?.comparisonFixtureId === 'fixture.miyota.8215.structural')).toBe(true)
    expect(pack.evidenceTemplates.every(({ extraction }) => extraction?.triggerEventType === 'mechanical-lab-command')).toBe(true)
    expect(pack.rubrics.every(({ rules }) => rules.every(({ targetState }) => targetState !== 'retained'))).toBe(true)
    expect(pack.recommendations.every(({ rule }) => rule.includes('minimum-7-days'))).toBe(true)
    expect(MECHANICAL_FOUNDATIONS_PRODUCT_INDEX.routes[0]).toMatchObject({
      prerequisiteNodeIds: [
        'module.horology.functional-map',
        'competency.horology.identify-functional-subsystems',
        'competency.horology.explain-mechanical-energy-chain',
        'competency.horology.predict-system-interruption',
      ],
      fidelity: { geometry: 'G1', kinematics: 'K2', physics: 'P0' },
    })
  })

  it('conserva libro privado y 8215 como autoridades separadas', () => {
    const pack = createIntegratedMechanicalFoundationsPack()
    const books = pack.sources.filter(({ sourceType }) => sourceType === 'private-book')
    expect(books).toHaveLength(6)
    expect(books.every(({ privateUse, resource }) => privateUse && resource.locator?.includes('PDF pp.'))).toBe(true)
    expect(pack.sources.some(({ id, authority }) => id.startsWith('source.miyota.8215.') && authority === 'official-miyota')).toBe(true)
    expect(pack.sources.filter(({ id }) => id.startsWith('source.external.'))).toHaveLength(24)
    expect(JSON.stringify(pack).toLowerCase()).not.toContain('gemelo exacto')
    const theoryBlocks = pack.blocks.filter(({ id }) => id.startsWith('block.mechanical.theory.'))
    expect(theoryBlocks.every(({ claims }) => claims.every(({ fidelity }) =>
      fidelity?.geometry === 'G1'
      && fidelity.kinematics === 'K2'
      && fidelity.physics === 'P0'))).toBe(true)
  })
})
