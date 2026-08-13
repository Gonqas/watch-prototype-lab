import { describe, expect, it } from 'vitest'
import { createIntegratedMiyota8215Pack, MIYOTA_8215_PRODUCT_INDEX } from './miyota8215Content'

describe('Sistema 4F · paquete MIYOTA 8215', () => {
  it('materializa la ruta completa y sus contratos de calibre', () => {
    const pack = createIntegratedMiyota8215Pack()
    expect(pack.manifest.id).toBe('wplab.horology.miyota8215')
    expect(pack.manifest.packageVersion).toBe('0.5.0')
    expect(pack.manifest.distribution).toBe('local-unsigned')
    expect(pack.manifest.editorialStatus).toBe('in-review')
    expect(pack.manifest.languages).toEqual(['es-ES'])
    expect(pack.modules).toHaveLength(15)
    expect(pack.lessons).toHaveLength(15)
    expect(pack.activities.length).toBeGreaterThanOrEqual(32)
    expect(pack.competencies).toHaveLength(20)
    expect(pack.evidenceTemplates).toHaveLength(20)
    expect(pack.rubrics).toHaveLength(20)
    expect(pack.glossary).toHaveLength(56)
    expect(pack.activities.every(({ authoring }) => authoring?.calibreLabContract?.fixtureId === 'fixture.miyota.8215.structural')).toBe(true)
  })

  it('declara prerrequisitos, autoridad, accesibilidad y retención posterior', () => {
    const pack = createIntegratedMiyota8215Pack()
    expect(pack.manifest.dependencies).toEqual(expect.arrayContaining([
      { packageId: 'wplab.horology.functional-map', versionRange: '^0.5.0' },
      { packageId: 'wplab.horology.mechanical-foundations', versionRange: '^0.5.0' },
    ]))
    expect(pack.lessons[0].authoring?.externalPrerequisites).toHaveLength(2)
    expect(pack.activities.every(({ authoring }) => authoring?.calibreLabContract?.authorityVisible)).toBe(true)
    expect(pack.activities.every(({ authoring }) => authoring?.calibreLabContract?.instanceIdentityRequired)).toBe(true)
    expect(pack.activities.every(({ authoring }) => authoring?.calibreLabContract?.reducedMotion)).toBe(true)
    expect(pack.activities.every(({ authoring }) => authoring?.calibreLabContract?.textualAlternative)).toBe(true)
    expect(pack.recommendations.every(({ rule }) => rule.includes('minimum-7-days'))).toBe(true)
    expect(pack.rubrics.every(({ rules }) => rules.every(({ targetState }) => targetState === 'demonstrated'))).toBe(true)
  })

  it('conserva fuentes oficiales y no introduce otros calibres', () => {
    const pack = createIntegratedMiyota8215Pack()
    expect(pack.sources.filter(({ id }) => id.startsWith('source.miyota.8215.'))).toHaveLength(5)
    expect(JSON.stringify(pack)).not.toContain('source.horology.private-book.')
    expect(JSON.stringify(pack)).not.toMatch(/82S0|8N24|9015|9039|9100|9120/)
    expect(pack.visualResources.every(({ fidelity }) => fidelity.physics === 'P0')).toBe(true)
    expect(MIYOTA_8215_PRODUCT_INDEX.routes[0].title.es).toBe('MIYOTA 8215: comprender, desmontar, montar y diagnosticar')
  })
})
