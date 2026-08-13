import { describe, expect, it } from 'vitest'
import { ProjectEntityIndex } from '../canonical'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { createV5ProjectFixture } from '../fixtures/canonicalFixtures'
import { memoryBridgeCapabilities } from '../runtime/bridge'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES } from '../runtime/capabilities'
import { SceneCompiler } from '../runtime/compiler'
import type { LoadedLearningPackage } from '../runtime/packageLoader'
import { sceneFixtureIndex } from '../visual/sceneFixtures'
import { createIntegratedHorologyLearningPack } from './horologyContent'

describe('paquete relojero real del Sistema 4C', () => {
  it('materializa la identidad, idioma y una secuencia inicial pensada para principiantes', () => {
    const pack = createIntegratedHorologyLearningPack()
    expect(pack.manifest).toMatchObject({
      id: 'wplab.horology.functional-map',
      packageVersion: '0.5.0',
      distribution: 'local-unsigned',
      editorialStatus: 'in-review',
      languages: ['es-ES'],
    })
    const module = pack.modules.find(({ id }) => id === 'module.horology.functional-map')
    const lessonById = new Map(pack.lessons.map((lesson) => [lesson.id, lesson]))
    expect(module?.lessonIds.map((id) => lessonById.get(id)?.title)).toEqual([
      'Un reloj no es una colección de ruedas',
      'La cadena mecánica',
      'La cadena del cuarzo',
      'Cuarzo y mecánico: equivalencias funcionales',
      'Predicción de fallos',
      'Lo que ya conoces por el ISA 8172',
    ])

    const route = pack.routes.find(({ id }) => id === 'route.horology.orientation')
    const milestones = [...(route?.learningDesign?.milestones ?? [])]
      .sort((left, right) => left.order - right.order)
    expect(milestones.at(-1)).toMatchObject({
      id: 'milestone.horology.gold.04',
      lessonId: 'lesson.horology.isa8172-confidence',
      optional: true,
    })
    expect(milestones.slice(0, -1).every(({ optional }) => !optional)).toBe(true)
  })

  it('incluye el contrato editorial mínimo completo', () => {
    const pack = createIntegratedHorologyLearningPack()
    const activitySceneIds = pack.activities.flatMap(({ sceneIds }) => sceneIds)
    const activitySceneIdSet = new Set(activitySceneIds)
    const auxiliaryScenes = pack.scenes.filter(({ id }) => !activitySceneIdSet.has(id))
    expect(pack.activities).toHaveLength(10)
    expect(activitySceneIds).toHaveLength(10)
    expect(activitySceneIdSet).toHaveProperty('size', 10)
    expect(auxiliaryScenes.map(({ id }) => id)).toEqual(expect.arrayContaining([
      'scene.horology.functional-layers',
      'scene.horology.mechanical-chain',
      'scene.horology.quartz-chain',
      'scene.horology.functional-comparison',
      'scene.horology.interruptions',
      'scene.horology.isa-confidence',
    ]))
    expect(auxiliaryScenes).toHaveLength(6)
    expect(pack.competencies).toHaveLength(6)
    expect(pack.evidenceTemplates.length).toBeGreaterThanOrEqual(11)
    expect(pack.rubrics).toHaveLength(6)
    expect(pack.glossary.length).toBeGreaterThanOrEqual(36)
    expect(pack.sources.filter(({ authority }) => authority === 'official-miyota')).toHaveLength(10)
    expect(pack.recommendations).toHaveLength(6)
  })

  it('no concede retained en el módulo inicial', () => {
    const pack = createIntegratedHorologyLearningPack()
    expect(pack.rubrics.flatMap(({ rules }) => rules).some(({ targetState }) => targetState === 'retained')).toBe(false)
    expect(pack.rubrics.some(({ assessmentRule }) => assessmentRule?.targetState === 'retained')).toBe(false)
    expect(pack.recommendations.every(({ kind }) => kind === 'retention')).toBe(true)
  })

  it('compila todas las escenas visuales y evaluativas también en reduced motion', () => {
    const pack = createIntegratedHorologyLearningPack()
    const loaded: LoadedLearningPackage = {
      pack,
      origin: 'local-unsigned',
      packageFingerprint: 'test:horology',
      assets: new Map(),
      diagnostics: [],
      zip: { entries: [], totalCompressedBytes: 0, totalUncompressedBytes: 0 },
    }
    const fallback = () => new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture()))
    const capabilities = new CapabilityResolver([
      ...HEADLESS_RUNTIME_CAPABILITIES,
      ...memoryBridgeCapabilities(),
    ])
    for (const reducedMotion of [false, true]) {
      for (const scene of pack.scenes) {
        const result = new SceneCompiler().compile(
          loaded,
          scene.id,
          sceneFixtureIndex(scene.fixtureBinding, fallback),
          capabilities,
          { reducedMotion },
        )
        expect(result.success, `${scene.id} reducedMotion=${reducedMotion}`).toBe(true)
      }
    }
  })

  it('conserva alternativas accesibles, restauración y procedencia en cada escena', () => {
    const pack = createIntegratedHorologyLearningPack()
    for (const scene of pack.scenes) {
      expect(scene.restorePreviousState).toBe(true)
      expect(scene.accessibility?.textualAlternative.length).toBeGreaterThan(120)
      expect(scene.accessibility?.reducedMotionAlternative.length).toBeGreaterThan(80)
      expect(scene.accessibility?.colorIndependentCues.length).toBeGreaterThan(1)
      expect(scene.overlays.every((overlay) => Boolean(overlay.accessibleLabel))).toBe(true)
    }
  })
})
