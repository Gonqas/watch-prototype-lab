import { describe, expect, it } from 'vitest'
import { ProjectEntityIndex } from '../canonical'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { createMechanicalProject } from '../../vnext/presets'
import { LearningPackageLoader } from '../runtime/packageLoader'
import { SceneCompiler } from '../runtime/compiler'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES } from '../runtime/capabilities'
import { memoryBridgeCapabilities } from '../runtime/bridge'
import {
  createIntegratedDemoLearningPackageBytes,
  createIntegratedDemoLearningPack,
  DEMO_LEARNING_PRODUCT_INDEX,
} from './demoPackage'

describe('paquete integrado de demostración de Sistema 3', () => {
  it('es un paquete contractual real, bilingüe y sin despiece MIYOTA inventado', async () => {
    const pack = createIntegratedDemoLearningPack()
    const loaded = await new LearningPackageLoader({ applicationVersion: '0.4.1' })
      .loadIntegrated(createIntegratedDemoLearningPackageBytes())

    expect(loaded.success).toBe(true)
    expect(pack.manifest.id).toBe(DEMO_LEARNING_PRODUCT_INDEX.packageId)
    expect(pack.manifest.languages).toEqual(['es-ES', 'en-US'])
    expect(pack.manifest.movements).toEqual([])
    expect(DEMO_LEARNING_PRODUCT_INDEX.activities[0].warnings.es.join(' ')).toContain('no es un curso definitivo')
    expect(JSON.stringify(pack).toLowerCase()).not.toContain('miyota 8215')
    expect(JSON.stringify(pack).toLowerCase()).not.toContain('miyota 9015')
  })

  it('compila su escena contra la proyección real v5 y conserva alternativa semántica', async () => {
    const loaded = await new LearningPackageLoader({ applicationVersion: '0.4.1' })
      .loadIntegrated(createIntegratedDemoLearningPackageBytes())
    expect(loaded.success).toBe(true)
    if (!loaded.success) return
    const scene = loaded.value.pack.scenes[0]
    const index = new ProjectEntityIndex(projectV5ToCanonical(createMechanicalProject()))
    const result = new SceneCompiler().compile(
      loaded.value,
      scene.id,
      index,
      new CapabilityResolver([...HEADLESS_RUNTIME_CAPABILITIES, ...memoryBridgeCapabilities()]),
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.plan.selectorResolutions.flatMap(({ entities }) => entities).some(({ label }) => label.length > 0)).toBe(true)
    expect(result.plan.steps).toHaveLength(2)
    expect(result.plan.requiresPresentationSnapshot).toBe(true)
  })

  it('mantiene equivalencia navegable entre grafo, ruta y actividad', () => {
    const activityIds = new Set(DEMO_LEARNING_PRODUCT_INDEX.activities.map(({ id }) => id))
    const routeIds = new Set(DEMO_LEARNING_PRODUCT_INDEX.routes.map(({ id }) => id))

    expect(DEMO_LEARNING_PRODUCT_INDEX.knowledgeNodes).not.toHaveLength(0)
    expect(DEMO_LEARNING_PRODUCT_INDEX.knowledgeNodes.every(({ routeIds: ids }) => ids.every((id) => routeIds.has(id)))).toBe(true)
    expect(DEMO_LEARNING_PRODUCT_INDEX.knowledgeNodes.every(({ activityIds: ids }) => ids.every((id) => activityIds.has(id)))).toBe(true)
  })
})
