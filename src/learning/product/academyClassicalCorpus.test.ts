import { describe, expect, it } from 'vitest'
import { INTEGRATED_LEARNING_CONTENT } from './integratedContent'

const pack = INTEGRATED_LEARNING_CONTENT
  .map(({ pack }) => pack)
  .find(({ manifest }) => manifest.id === 'wplab.horology.watchmaking-encyclopedia')

if (!pack) throw new Error('No se ha integrado el paquete enciclopédico.')

const classicalSources = pack.sources.filter(({ id }) =>
  /^source\.(private\.(toh|bulova|chicago)|official\.tm9-1575)/.test(id))

describe('Academia 0.13 · corpus clásico trazable y seguro', () => {
  it('registra el corpus completo con localizadores y huellas criptográficas', () => {
    expect(pack.sources.filter(({ id }) => id.startsWith('source.private.toh.'))).toHaveLength(15)
    expect(pack.sources.filter(({ id }) => id.startsWith('source.private.bulova.'))).toHaveLength(20)
    expect(pack.sources.filter(({ id }) => id.startsWith('source.private.chicago.'))).toHaveLength(37)
    expect(pack.sources.filter(({ id }) => id.startsWith('source.official.tm9-1575.'))).toHaveLength(8)
    expect(classicalSources).toHaveLength(80)
    expect(classicalSources.every(({ resource, chapter, page }) =>
      /^[a-f0-9]{64}$/.test(resource.sha256 ?? '') && Boolean(chapter || page))).toBe(true)
  })

  it('separa el valor histórico del permiso para ejecutar un procedimiento', () => {
    expect(classicalSources.every(({ currency, historicalSafety }) => currency && historicalSafety)).toBe(true)
    const dangerous = classicalSources.filter(({ historicalSafety }) =>
      ['modern-substitute-required', 'prohibited-instruction'].includes(historicalSafety?.status ?? ''))
    expect(dangerous.length).toBeGreaterThan(0)
    expect(dangerous.every(({ historicalSafety }) =>
      historicalSafety?.operationalUse === 'blocked'
      && historicalSafety.note.length > 24)).toBe(true)
    expect(dangerous.some(({ historicalSafety }) => historicalSafety?.hazardTopics.includes('cyanide'))).toBe(true)
    expect(dangerous.some(({ historicalSafety }) => historicalSafety?.hazardTopics.includes('radioactive-luminous-material'))).toBe(true)
  })

  it('materializa veinticinco laboratorios causales sin fingir física ni destreza manual', () => {
    expect(pack.visualResources).toHaveLength(25)
    const visualIds = new Set(pack.visualResources.map(({ id }) => id))
    const labActivities = pack.activities.filter(({ authoring }) =>
      authoring?.visualResourceIds.some((id) => visualIds.has(id)))
    expect(labActivities).toHaveLength(25)
    expect(labActivities.every(({ projectReference, authoring }) =>
      projectReference.kind === 'fixture-readonly'
      && authoring?.fidelity.geometry === 'G1'
      && authoring.fidelity.kinematics === 'K2'
      && authoring.fidelity.physics === 'P0'
      && authoring.mechanicalLabContract?.fixtureId === 'fixture.conceptual.mechanical-chain'
      && authoring.mechanicalLabContract.normalizedPhysicsOnly
      && authoring.mechanicalLabContract.reducedMotion
      && authoring.mechanicalLabContract.textualAlternative)).toBe(true)
    expect(pack.visualResources.every(({ status, fidelity, requiredCapabilities }) =>
      status === 'ready'
      && fidelity.geometry === 'G1'
      && fidelity.kinematics === 'K2'
      && fidelity.physics === 'P0'
      && requiredCapabilities.includes('viewport.camera@^1.0.0'))).toBe(true)
  })

  it('mantiene teoría antes de práctica y repaso diferido en todas las unidades nuevas', () => {
    const classicalLessons = pack.lessons.filter(({ id }) =>
      id.includes('.toh-') || id.includes('.bulova-') || id.includes('.chicago-') || id.includes('.tm-'))
    expect(classicalLessons.length).toBeGreaterThanOrEqual(63)
    expect(classicalLessons.every(({ authoring }) =>
      authoring?.studyContract?.sequence === 'theory-first'
      && authoring.studyContract.practiceUnlock === 'after-required-reading'
      && authoring.studyContract.sourceReviewRequired)).toBe(true)
    expect(classicalLessons.every(({ id }) => {
      const competencyId = id.replace(/^lesson\./, 'competency.')
      return pack.recommendations.some(({ kind, rule, target }) =>
        kind === 'retention'
        && target.kind === 'competency'
        && target.id === competencyId
        && rule.includes('1d,7d,21d'))
    })).toBe(true)
  })
})
