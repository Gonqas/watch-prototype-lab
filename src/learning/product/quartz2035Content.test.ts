import { describe, expect, it } from 'vitest'
import { validateAuthoringPack } from '../content/authoringValidation'
import { createIntegratedQuartz2035LearningPack } from './quartz2035Content'

describe('Sistema 4D · paquete Del ISA 8172 al MIYOTA 2035', () => {
  it('integra diez módulos, veinte actividades y el contrato de banco', () => {
    const pack = createIntegratedQuartz2035LearningPack()
    expect(pack.manifest.id).toBe('wplab.horology.quartz-miyota2035')
    expect(pack.manifest.languages).toEqual(['es-ES'])
    expect(pack.manifest.editorialStatus).toBe('in-review')
    expect(pack.modules).toHaveLength(10)
    expect(pack.lessons).toHaveLength(10)
    expect(pack.activities).toHaveLength(20)
    expect(pack.routes.map(({ id }) => id)).toEqual([
      'route.horology.bench-foundations',
      'route.quartz2035.isa-to-2035',
    ])
    expect(pack.activities.every(({ authoring }) => authoring?.workbenchContract?.fixtureId === 'fixture.miyota.2035.structural')).toBe(true)
    expect(new Set(pack.activities.flatMap(({ authoring }) => authoring?.workbenchContract?.modes ?? [])))
      .toEqual(new Set(['guided', 'assisted', 'free']))
  })

  it('declara competencias, evidencias, rúbricas y retención posterior', () => {
    const pack = createIntegratedQuartz2035LearningPack()
    expect(pack.competencies).toHaveLength(13)
    expect(pack.evidenceTemplates).toHaveLength(18)
    expect(pack.rubrics).toHaveLength(13)
    expect(pack.recommendations).toHaveLength(13)
    expect(pack.recommendations.every(({ kind, rule }) =>
      kind === 'retention' && rule.includes('different-session') && rule.includes('7-days'))).toBe(true)
    expect(pack.rubrics.every(({ rules }) => rules.every(({ targetState }) => targetState !== 'retained'))).toBe(true)
  })

  it('reserva el contenido del 2035 a fuentes MIYOTA oficiales y material editorial propio', () => {
    const pack = createIntegratedQuartz2035LearningPack()
    const privateBookSources = pack.sources.filter(({ id }) => id.startsWith('source.horology.private-book.'))
    expect(privateBookSources).toEqual([])
    expect(pack.sources.filter(({ privateUse }) => privateUse).every(({ authority }) =>
      authority === 'original-educational')).toBe(true)
    expect(pack.sources.filter(({ authority }) => authority === 'official-miyota')).toHaveLength(5)
    expect(JSON.stringify(pack)).not.toContain('source.horology.private-book.')
    expect(pack.manifest.assets).toEqual([])
  })

  it('valida sin diagnóstico editorial', () => {
    const report = validateAuthoringPack(createIntegratedQuartz2035LearningPack())
    expect(report.diagnostics).toEqual([])
  })
})
