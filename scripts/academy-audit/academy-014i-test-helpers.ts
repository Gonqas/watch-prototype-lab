import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { buildAcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderCurationPhase, AcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../../src/learning/product/demoPackage'
import { loadAcademyCorpus } from './corpus'

export const ACADEMY_014I_TEST_ROOT = resolve(process.cwd())
export const academy014ITestSha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')

const environmentPromise = loadAcademyCorpus(ACADEMY_014I_TEST_ROOT).then((corpus) => {
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  return { corpus, product, packByLesson }
})

export function academy014ITestEnvironment() {
  return environmentPromise
}

function materialFor(pack: LearningPack, lessonId: string, product: Awaited<typeof environmentPromise>['product']): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!lesson || !descriptor) throw new Error(`Lección no encontrada: ${lessonId}`)
  const blocks = pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
  const sourceIds = new Set([...(lesson.authoring?.sourceIds ?? []), ...blocks.flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id)))])
  return {
    packageId: pack.manifest.id,
    packageVersion: pack.manifest.packageVersion,
    pack,
    lesson,
    blocks,
    activities: descriptor.activityIds.flatMap((id) => product.activities.filter((activity) => activity.id === id)),
    sources: pack.sources.filter(({ id }) => sourceIds.has(id)),
    glossary: [],
  }
}

const documentCache = new Map<string, AcademyReaderDocument>()

export async function academy014IBuildDocument(lessonId: string, phase: AcademyReaderCurationPhase): Promise<AcademyReaderDocument> {
  const key = `${phase}:${lessonId}`
  const cached = documentCache.get(key)
  if (cached) return cached
  const { product, packByLesson } = await environmentPromise
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  const pack = packByLesson.get(lessonId)
  if (!descriptor || !pack) throw new Error(`Lección no cargable: ${lessonId}`)
  const document = buildAcademyReaderDocument({
    material: materialFor(pack, lessonId, product),
    title: descriptor.title.es,
    purpose: descriptor.purpose.es,
    locale: 'es-ES',
    requiredActivityIds: descriptor.studyContract?.labActivityIds,
  }, { curationPhase: phase })
  documentCache.set(key, document)
  return document
}

export async function academy014IWalk(path: string): Promise<string[]> {
  const result: string[] = []
  for (const name of (await readdir(path)).sort()) {
    const item = join(path, name)
    if ((await stat(item)).isDirectory()) result.push(...await academy014IWalk(item))
    else result.push(item)
  }
  return result
}

export async function academy014ITreeSnapshot(path: string) {
  const files = await academy014IWalk(path)
  const rows = await Promise.all(files.map(async (file) => `${relative(path, file).replaceAll('\\', '/')}:${academy014ITestSha256(await readFile(file))}`))
  return { count: files.length, digest: academy014ITestSha256(rows.join('\n')) }
}

export const academy014IDocumentText = (document: AcademyReaderDocument) => document.sections.map(({ title, markdown }) => `${title}\n${markdown}`).join('\n')
export const academy014IDocumentSignature = (document: AcademyReaderDocument) => academy014ITestSha256(JSON.stringify({ sections: document.sections, aliases: document.legacyAliases, hash: document.contentHash }))
