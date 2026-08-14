import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { LearningPack } from '../../src/learning/content/learningPack'
import { LearningPackSchema, LearningPackManifestSchema } from '../../src/learning/content/learningPack'
import { ACADEMY_CURRICULUM } from '../../src/learning/academy/academyCurriculum'
import { ACADEMY_PACKAGE_NAMES } from './sourceInventory'

const COLLECTION_NAMES = [
  'curricula',
  'routes',
  'modules',
  'concepts',
  'misconceptions',
  'blocks',
  'lessons',
  'activities',
  'scenes',
  'competencies',
  'evidenceTemplates',
  'rubrics',
  'glossary',
  'sources',
  'recommendations',
  'visualResources',
] as const

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

async function loadPack(repositoryRoot: string, packageName: string): Promise<LearningPack> {
  const packageRoot = join(repositoryRoot, 'learning-content', packageName)
  const manifestInput = await readJson(join(packageRoot, 'manifest.json'))
  const manifest = LearningPackManifestSchema.parse(manifestInput)
  const collections = Object.fromEntries(await Promise.all(COLLECTION_NAMES.map(async (name) => [
    name,
    await Promise.all(manifest.entries[name].map(({ path }) => readJson(join(packageRoot, path)))),
  ])))
  return LearningPackSchema.parse({ manifest: manifestInput, ...collections })
}

export interface CorpusPack {
  packageName: string
  pack: LearningPack
}

export interface CorpusLessonContext {
  packageName: string
  packageId: string
  packageVersion: string
  route: LearningPack['routes'][number]
  module: LearningPack['modules'][number]
  lesson: LearningPack['lessons'][number]
  routeOrder: number
  moduleOrder: number
  lessonOrder: number
  globalOrder: number
  pack: LearningPack
}

export interface CorpusActivityContext extends CorpusLessonContext {
  activity: LearningPack['activities'][number]
  activityOrder: number
}

export interface AcademyCorpus {
  packs: CorpusPack[]
  lessons: CorpusLessonContext[]
  activities: CorpusActivityContext[]
  counts: {
    packages: number
    routes: number
    modules: number
    lessons: number
    activities: number
    concepts: number
    misconceptions: number
    sources: number
  }
  digest: string
}

const canonicalRouteOrder = new Map(ACADEMY_CURRICULUM.map(({ routeId, order }) => [routeId, order]))

export async function loadAcademyCorpus(repositoryRoot: string): Promise<AcademyCorpus> {
  const packs = await Promise.all(ACADEMY_PACKAGE_NAMES.map(async (packageName) => ({
    packageName,
    pack: await loadPack(repositoryRoot, packageName),
  })))
  const routeRecords = packs.flatMap(({ packageName, pack }) => pack.routes
    .filter(({ demo }) => !demo)
    .map((route) => ({ packageName, pack, route })))
    .sort((left, right) => (canonicalRouteOrder.get(left.route.id) ?? Number.MAX_SAFE_INTEGER)
      - (canonicalRouteOrder.get(right.route.id) ?? Number.MAX_SAFE_INTEGER)
      || left.route.id.localeCompare(right.route.id))

  const lessons: CorpusLessonContext[] = []
  const activities: CorpusActivityContext[] = []
  let globalOrder = 0
  routeRecords.forEach(({ packageName, pack, route }, routeIndex) => {
    route.moduleIds.forEach((moduleId, moduleIndex) => {
      const module = pack.modules.find(({ id }) => id === moduleId)
      if (!module) throw new Error(`Módulo visible ausente: ${moduleId}`)
      module.lessonIds.forEach((lessonId, lessonIndex) => {
        const lesson = pack.lessons.find(({ id }) => id === lessonId)
        if (!lesson) throw new Error(`Lección visible ausente: ${lessonId}`)
        globalOrder += 1
        const context: CorpusLessonContext = {
          packageName,
          packageId: pack.manifest.id,
          packageVersion: pack.manifest.packageVersion,
          route,
          module,
          lesson,
          routeOrder: routeIndex + 1,
          moduleOrder: moduleIndex + 1,
          lessonOrder: lessonIndex + 1,
          globalOrder,
          pack,
        }
        lessons.push(context)
        lesson.activityIds.forEach((activityId, activityIndex) => {
          const activity = pack.activities.find(({ id }) => id === activityId)
          if (!activity) throw new Error(`Actividad visible ausente: ${activityId}`)
          activities.push({ ...context, activity, activityOrder: activityIndex + 1 })
        })
      })
    })
  })

  const unique = <T>(values: T[]) => new Set(values).size
  const digestInput = packs.map(({ packageName, pack }) => ({
    packageName,
    manifest: { id: pack.manifest.id, packageVersion: pack.manifest.packageVersion },
    ids: Object.fromEntries(COLLECTION_NAMES.map((name) => [name, pack[name].map(({ id }) => id).sort()])),
    visibleHierarchy: pack.routes.filter(({ demo }) => !demo).map(({ id, moduleIds }) => ({ id, moduleIds })),
    lessonBodies: pack.lessons.map(({ id, blockIds, activityIds }) => ({ id, blockIds, activityIds })),
    blocks: pack.blocks.map(({ id, bodyMarkdown }) => ({ id, bodyMarkdown })),
  }))
  const digest = createHash('sha256').update(JSON.stringify(digestInput)).digest('hex')
  return {
    packs,
    lessons,
    activities,
    counts: {
      packages: packs.length,
      routes: unique(lessons.map(({ route }) => route.id)),
      modules: unique(lessons.map(({ module }) => module.id)),
      lessons: unique(lessons.map(({ lesson }) => lesson.id)),
      activities: unique(activities.map(({ activity }) => activity.id)),
      concepts: unique(packs.flatMap(({ pack }) => pack.concepts.map(({ id }) => id))),
      misconceptions: unique(packs.flatMap(({ pack }) => pack.misconceptions.map(({ id }) => id))),
      sources: unique(packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id))),
    },
    digest,
  }
}

export function allCorpusIds(corpus: AcademyCorpus): Record<string, string[]> {
  const ids: Record<string, string[]> = {}
  for (const name of COLLECTION_NAMES) {
    ids[name] = [...new Set(corpus.packs.flatMap(({ pack }) => pack[name].map(({ id }) => id)))].sort()
  }
  return ids
}
