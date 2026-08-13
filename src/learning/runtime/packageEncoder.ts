import { strToU8, zipSync } from 'fflate'
import type { LearningPack, LearningPackManifest } from '../content/learningPack'

export interface LearningPackAssetInput {
  assetId: string
  bytes: Uint8Array
}

/** Deterministic pack encoder shared by production, tests and the external authoring CLI. */
export function encodeLearningPackage(pack: LearningPack, assets: LearningPackAssetInput[] = []): Uint8Array {
  const entries: Record<string, Uint8Array> = { 'manifest.json': strToU8(JSON.stringify(pack.manifest)) }
  const collections = {
    curricula: pack.curricula,
    routes: pack.routes,
    modules: pack.modules,
    concepts: pack.concepts,
    misconceptions: pack.misconceptions,
    blocks: pack.blocks,
    lessons: pack.lessons,
    activities: pack.activities,
    scenes: pack.scenes,
    competencies: pack.competencies,
    evidenceTemplates: pack.evidenceTemplates,
    rubrics: pack.rubrics,
    glossary: pack.glossary,
    sources: pack.sources,
    recommendations: pack.recommendations,
    visualResources: pack.visualResources,
  }
  for (const [kind, values] of Object.entries(collections)) {
    const refs = pack.manifest.entries[kind as keyof LearningPackManifest['entries']]
    for (const value of values) {
      const ref = refs.find(({ id }) => id === value.id)
      if (!ref) throw new Error(`No existe ruta de manifiesto para ${value.id}.`)
      entries[ref.path] = strToU8(JSON.stringify(value))
    }
  }
  for (const asset of assets) {
    const declaration = pack.manifest.assets.find(({ id }) => id === asset.assetId)
    if (!declaration) throw new Error(`Activo no declarado: ${asset.assetId}`)
    entries[declaration.path] = asset.bytes
  }
  return zipSync(entries, { level: 6, mtime: new Date('1980-01-01T00:00:00.000Z') })
}
