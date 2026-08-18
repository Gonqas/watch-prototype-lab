/// <reference lib="dom" />

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import { ACADEMY_LEARNER_PATH } from '../../src/learning/academy/path/academyLearnerPath'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderDocument'
import { auditAcademySourceFigureAsset } from '../../src/learning/academy/reader/academySourceFigureAsset'
import { ACADEMY_SOURCE_FIGURE_PLACEMENTS } from '../../src/learning/academy/reader/personal/sourceFigureCuration'
import { ACADEMY_SOURCE_FIGURES } from '../../src/learning/academy/reader/personal/sourceFigures.generated'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'

interface ManifestRecord {
  assetId: string
  src: string
  width: number
  height: number
  sha256: string
  sourceSha256: string
  sourceId: string
  privateUse: boolean
  distributionReviewRequired: boolean
}

interface Manifest {
  schemaVersion: string
  assetCount: number
  distributionReviewRequired: boolean
  assets: ManifestRecord[]
}

const ROOT = resolve(process.cwd())
const MANIFEST_PATH = resolve(ROOT, 'public/learning-media/source-figures/manifest.json')
const SHA256 = /^[a-f0-9]{64}$/i

function sha256(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

describe('integración de medios fuente de las etapas 0–5', () => {
  it('conserva un manifiesto reproducible y cada binario coincide con su hash', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest
    expect(manifest).toMatchObject({
      schemaVersion: 'academy-source-figures.v1',
      assetCount: 57,
      distributionReviewRequired: true,
    })
    expect(manifest.assets).toHaveLength(ACADEMY_SOURCE_FIGURES.length)
    const records = new Map(manifest.assets.map((asset) => [asset.assetId, asset]))
    for (const asset of ACADEMY_SOURCE_FIGURES) {
      expect(auditAcademySourceFigureAsset(asset), asset.assetId).toEqual([])
      const record = records.get(asset.assetId)
      expect(record, asset.assetId).toMatchObject({
        src: asset.src,
        width: asset.width,
        height: asset.height,
        sha256: asset.contentHash,
        sourceSha256: asset.sourceSha256,
        privateUse: true,
        distributionReviewRequired: true,
      })
      expect(asset.contentHash, `${asset.assetId}: derivado`).toMatch(SHA256)
      expect(asset.sourceSha256, `${asset.assetId}: fuente`).toMatch(SHA256)
      const file = resolve(ROOT, 'public', asset.src.replace(/^\//, '').replace(/^learning-media\//, 'learning-media/'))
      expect(existsSync(file), file).toBe(true)
      expect(sha256(file), asset.assetId).toBe(asset.contentHash)
    }
  })

  it('no aplica la capa a las etapas inacabadas 6 y 7', () => {
    const forbiddenLessons = new Set(ACADEMY_LEARNER_PATH.chapters
      .filter(({ stageId }) => ['stage.6', 'stage.7'].includes(stageId))
      .flatMap(({ steps }) => steps.map(({ lessonId }) => lessonId)))
    expect(ACADEMY_SOURCE_FIGURE_PLACEMENTS.some(({ lessonId }) => forbiddenLessons.has(lessonId))).toBe(false)
  })

  it('mantiene correspondencia total entre registro y colocaciones, sin assets huérfanos', () => {
    const registered = [...new Set(ACADEMY_SOURCE_FIGURES.map(({ assetId }) => assetId))].sort()
    const placed = [...new Set(ACADEMY_SOURCE_FIGURE_PLACEMENTS.map(({ assetId }) => assetId))].sort()
    expect(placed).toEqual(registered)
  })

  it('materializa las 119 colocaciones como imágenes implementadas en sus 67 lecciones', () => {
    const expectedByLesson = new Map<string, Set<string>>()
    for (const { lessonId, assetId } of ACADEMY_SOURCE_FIGURE_PLACEMENTS) {
      const assets = expectedByLesson.get(lessonId) ?? new Set<string>()
      assets.add(assetId)
      expectedByLesson.set(lessonId, assets)
    }
    expect(ACADEMY_SOURCE_FIGURE_PLACEMENTS).toHaveLength(119)
    expect(expectedByLesson.size).toBe(67)
    const missingLessons = [...expectedByLesson.keys()].filter((lessonId) =>
      !academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId))
    expect(missingLessons).toEqual([])
    for (const [lessonId, expectedAssets] of expectedByLesson) {
      const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)
      if (!material) continue
      const document = buildAcademyReaderDocument(
        { material, title: material.lesson.title, locale: 'es-ES' },
        { curationPhase: '0.14K' },
      )
      const implementedAssets = new Set(document.visualCues.flatMap(({ kind, imageAsset, implementationStatus }) =>
        kind === 'image' && implementationStatus === 'implemented' && imageAsset ? [imageAsset.assetId] : []))
      for (const assetId of expectedAssets) {
        expect(implementedAssets.has(assetId), `${lessonId}: ${assetId}`).toBe(true)
      }
    }
  })

  it('mantiene un único SHA-256 de origen coherente por sourceId', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest
    const sourceHashes = new Map<string, string>()
    for (const asset of manifest.assets) {
      expect(asset.sourceSha256, `${asset.sourceId}: fuente`).toMatch(SHA256)
      const previous = sourceHashes.get(asset.sourceId)
      if (previous) expect(asset.sourceSha256, asset.sourceId).toBe(previous)
      sourceHashes.set(asset.sourceId, asset.sourceSha256)
    }
    expect(sourceHashes.size).toBe(19)
  })

  it('cubre con figura fuente 60 de las 63 anclas y deja metrología en sus diagramas originales', () => {
    const anchors = ACADEMY_LEARNER_PATH.chapters
      .filter(({ stageId }) => Number(stageId.split('.')[1]) <= 5)
      .flatMap(({ anchorLessonIds }) => anchorLessonIds)
    const covered = new Set(ACADEMY_SOURCE_FIGURE_PLACEMENTS.map(({ lessonId }) => lessonId))
    expect(anchors).toHaveLength(63)
    expect(anchors.filter((lessonId) => covered.has(lessonId))).toHaveLength(60)
    expect(anchors.filter((lessonId) => !covered.has(lessonId))).toEqual([
      'lesson.metrology.units-scale-resolution',
      'lesson.metrology.instruments',
      'lesson.metrology.physical-measurement',
    ])
  })

  it.each([
    ['lesson.quartz2035.tools', 3],
    ['lesson.mechanical.escapement', 1],
    ['lesson.miyota8215.documentation', 4],
    ['lesson.encyclopedia.cases-water.arquitectura-de-caja', 3],
  ])('convierte las figuras de %s en cues locales implementados', (lessonId, minimumImages) => {
    const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)
    expect(material, lessonId).toBeDefined()
    const document = buildAcademyReaderDocument({ material: material!, title: material!.lesson.title, locale: 'es-ES' }, { curationPhase: '0.14K' })
    const imageCues = document.visualCues.filter(({ kind }) => kind === 'image')
    expect(imageCues.length, lessonId).toBeGreaterThanOrEqual(minimumImages)
    expect(imageCues.every(({ implementationStatus, sourceType, imageAsset }) =>
      implementationStatus === 'implemented'
      && sourceType === 'existing-runtime-asset'
      && Boolean(imageAsset))).toBe(true)
    expect(validateAcademyReaderDocument(document).filter(({ code }) => code.includes('image'))).toEqual([])
  })
})
