import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const PATH_FILE = join('docs', 'generated', 'ACADEMY-LEARNER-PATH-0.14B.json')
const RECORD_TYPES = [
  'routes', 'modules', 'concepts', 'misconceptions', 'blocks', 'lessons',
  'activities', 'scenes', 'competencies', 'glossary', 'sources', 'recommendations',
]

const idsWithPrefix = (value, prefix, result = new Set()) => {
  if (typeof value === 'string') {
    if (value.startsWith(prefix)) result.add(value)
    return result
  }
  if (Array.isArray(value)) value.forEach((item) => idsWithPrefix(item, prefix, result))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => idsWithPrefix(item, prefix, result))
  return result
}

const add = (set, values = []) => values.forEach((value) => set.add(value))

export async function resolveStage05Scope(repositoryRoot = process.cwd()) {
  const contentRoot = join(repositoryRoot, 'learning-content')
  const packageNames = (await readdir(contentRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== 'example')
    .map((entry) => entry.name)
    .sort()
  const packages = []
  const owners = new Map()

  for (const packageName of packageNames) {
    const packageRoot = join(contentRoot, packageName)
    let manifest
    try { manifest = JSON.parse(await readFile(join(packageRoot, 'manifest.json'), 'utf8')) } catch { continue }
    const records = new Map()
    for (const type of RECORD_TYPES) {
      const byId = new Map()
      for (const entry of manifest.entries?.[type] ?? []) {
        const value = JSON.parse(await readFile(join(packageRoot, entry.path), 'utf8'))
        const record = { entry, value, type, packageName, packageRoot }
        byId.set(entry.id, record)
        owners.set(entry.id, record)
      }
      records.set(type, byId)
    }
    packages.push({ packageName, packageRoot, manifest, records })
  }

  const document = JSON.parse(await readFile(join(repositoryRoot, PATH_FILE), 'utf8')).path
  const targetLessons = new Set()
  const protectedLessons = new Set()
  for (const chapter of document.chapters ?? []) {
    const stage = Number(chapter.stageId?.split('.').at(-1))
    const destination = stage <= 5 ? targetLessons : protectedLessons
    add(destination, chapter.anchorLessonIds)
    add(destination, chapter.supportingLessonIds)
  }

  const routeLessonIds = (routeId) => {
    const route = owners.get(routeId)?.value
    if (!route) return []
    return (route.moduleIds ?? []).flatMap((moduleId) => owners.get(moduleId)?.value?.lessonIds ?? [])
  }
  const targetBranchRoutes = new Set()
  const protectedBranchRoutes = new Set()
  for (const branch of document.optionalBranches ?? []) {
    const stage = Number(branch.stageId?.split('.').at(-1))
    const routeSet = stage <= 5 ? targetBranchRoutes : protectedBranchRoutes
    const lessonSet = stage <= 5 ? targetLessons : protectedLessons
    add(routeSet, branch.routeIds)
    for (const routeId of branch.routeIds ?? []) add(lessonSet, routeLessonIds(routeId))
  }

  const derive = (lessonIds) => {
    const result = Object.fromEntries(RECORD_TYPES.map((type) => [type, new Set()]))
    add(result.lessons, lessonIds)
    for (const lessonId of lessonIds) {
      const lesson = owners.get(lessonId)?.value
      if (!lesson) continue
      add(result.blocks, lesson.blockIds)
      add(result.activities, lesson.activityIds)
      add(result.concepts, lesson.authoring?.conceptIds)
      add(result.concepts, lesson.authoring?.prerequisiteConceptIds)
      add(result.concepts, lesson.authoring?.recommendedPrerequisiteConceptIds)
    }
    for (const record of owners.values()) {
      if (record.type === 'modules' && (record.value.lessonIds ?? []).some((id) => lessonIds.has(id))) result.modules.add(record.value.id)
    }
    for (const moduleId of result.modules) {
      for (const record of owners.values()) {
        if (record.type === 'routes' && (record.value.moduleIds ?? []).includes(moduleId)) result.routes.add(record.value.id)
      }
    }
    for (const activityId of result.activities) {
      const activity = owners.get(activityId)?.value
      if (!activity) continue
      add(result.scenes, activity.sceneIds)
      add(result.competencies, activity.competencyIds)
      add(result.concepts, idsWithPrefix(activity, 'concept.'))
    }
    for (const conceptId of result.concepts) {
      const concept = owners.get(conceptId)?.value
      if (concept) add(result.misconceptions, concept.misconceptionIds)
    }
    for (const blockId of result.blocks) {
      const markdown = owners.get(blockId)?.value?.bodyMarkdown ?? ''
      for (const match of markdown.matchAll(/\{\{term:([^}|]+)(?:\|[^}]+)?\}\}/gu)) result.glossary.add(match[1])
    }
    for (const type of ['lessons', 'blocks', 'activities', 'scenes', 'concepts', 'misconceptions']) {
      for (const id of result[type]) {
        const value = owners.get(id)?.value
        if (value) add(result.sources, idsWithPrefix(value, 'source.'))
      }
    }
    for (const record of owners.values()) {
      if (record.type === 'recommendations' && result.competencies.has(record.value.target?.id)) result.recommendations.add(record.value.id)
    }
    return result
  }

  const target = derive(targetLessons)
  const protectedRecords = derive(protectedLessons)
  add(target.routes, targetBranchRoutes)
  add(protectedRecords.routes, protectedBranchRoutes)

  // Una entidad compartida con las etapas 6–7 queda fuera de esta pasada.
  for (const type of RECORD_TYPES) {
    for (const id of protectedRecords[type]) target[type].delete(id)
  }
  // Rutas y módulos mixtos no se reescriben, aunque contengan una lección objetivo.
  for (const routeId of [...target.routes]) {
    if (routeLessonIds(routeId).some((id) => protectedLessons.has(id))) target.routes.delete(routeId)
  }
  for (const moduleId of [...target.modules]) {
    if ((owners.get(moduleId)?.value?.lessonIds ?? []).some((id) => protectedLessons.has(id))) target.modules.delete(moduleId)
  }

  const scopedPackages = packages.map((pkg) => {
    const targets = new Map()
    for (const type of RECORD_TYPES) {
      targets.set(type, [...target[type]].flatMap((id) => {
        const record = pkg.records.get(type)?.get(id)
        return record ? [record] : []
      }))
    }
    return { ...pkg, targets }
  })

  return { document, packages: scopedPackages, targetLessons, protectedLessons, target, protectedRecords, recordTypes: RECORD_TYPES }
}
