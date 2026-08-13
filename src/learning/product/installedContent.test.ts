import { describe, expect, it } from 'vitest'
import { createIntegratedDemoLearningPackageBytes } from './demoPackage'
import { MemoryLearningBinaryStorage } from '../persistence/binaryStorage'
import { MemoryLearningRepository } from '../persistence/memoryRepository'
import { LearningPackageInstallationService } from '../persistence/packageInstallation'
import { LearningPackageLoader } from '../runtime/packageLoader'
import {
  buildInstalledContentCatalog,
  findInstalledContent,
  installedAssessmentRuleForActivity,
  installedEvidenceRules,
} from './installedContent'

async function installedCatalog() {
  const repository = new MemoryLearningRepository()
  const storage = new MemoryLearningBinaryStorage()
  await repository.initialize()
  const loader = new LearningPackageLoader({ applicationVersion: '0.4.1' })
  const installer = new LearningPackageInstallationService(repository, storage, loader)
  await installer.install(createIntegratedDemoLearningPackageBytes(), 'integrated')
  return {
    repository,
    storage,
    catalog: await buildInstalledContentCatalog(repository, storage, '0.4.1'),
  }
}

describe('catálogo de contenido instalado', () => {
  it('reconstruye producto, reglas y rúbrica desde los bytes comprometidos', async () => {
    const { catalog } = await installedCatalog()
    const content = findInstalledContent(catalog, 'wplab.demo.learning-foundations', '1.0.0')

    expect(content?.origin).toBe('integrated')
    expect(catalog.product.activities.map(({ id }) => id)).toContain('activity.demo.identify-case')
    expect(installedEvidenceRules(catalog).length).toBeGreaterThanOrEqual(2)
    expect(installedAssessmentRuleForActivity(
      catalog,
      'wplab.demo.learning-foundations',
      '1.0.0',
      'activity.demo.identify-case',
    ).id).toContain('rubric')
  })

  it('detecta un registro activo cuyo binario ya no está disponible', async () => {
    const { repository, storage } = await installedCatalog()
    const record = await repository.getPackage('wplab.demo.learning-foundations', '1.0.0')
    expect(record).toBeDefined()
    await storage.remove(record!.packageHash)

    await expect(buildInstalledContentCatalog(repository, storage, '0.4.1')).rejects.toThrow(
      /No se encontró el binario/,
    )
  })
})
