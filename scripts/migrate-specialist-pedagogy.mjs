import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageNames = [
  'quartz-miyota2035',
  'mechanical-foundations',
  'miyota8215',
]

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function jsonEntries(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      path: join(directory, name),
      value: readJson(join(directory, name)),
    }))
}

function unique(values) {
  return [...new Set(values)]
}

function knowledgeTypeFor(concept) {
  const text = `${concept.id} ${concept.subsystem}`.toLowerCase()
  if (/(source|documentation|document|provenance|fidelity|official|observation-inference|data-reconstruction)/.test(text)) {
    return 'epistemic'
  }
  if (/(ratio|frequency|amplitude|calculate|rotation-direction)/.test(text)) return 'quantitative'
  if (/(diagnos|hypothesis|symptom|inspect|verification|check)/.test(text)) return 'diagnostic'
  if (/(assemble|disassemble|workstation|tool|prepare|preserve|build|operate|document-movement|document-calibre)/.test(text)) {
    return 'procedural'
  }
  if (/(identify|recognize|architecture|subsystem|parts|supports|train)/.test(text)) return 'spatial'
  if (/(term|name|vocabulary)/.test(text)) return 'terminology'
  return 'conceptual-causal'
}

function targetEvidenceFor(knowledgeType) {
  if (knowledgeType === 'terminology' || knowledgeType === 'spatial') return 'recognition'
  if (knowledgeType === 'procedural') return 'independent-simulation'
  if (knowledgeType === 'diagnostic') return 'transfer'
  return 'causal-explanation'
}

function lessonRole(lesson, index, total) {
  const id = lesson.id.toLowerCase()
  if (index === 0) return 'orientation'
  if (/(workstation|tools|observe|documentation|anatomy|identify)/.test(id)) return 'pretraining'
  if (/(final-project|diagnosis-project)/.test(id) || index === total - 1) return 'transfer'
  if (/(assembly|disassembly|inspection|plan-disassembly)/.test(id)) return 'guided-practice'
  return 'conceptual-model'
}

function blockRoleFor(lessonRoleValue) {
  if (lessonRoleValue === 'orientation' || lessonRoleValue === 'pretraining') return 'pretrain'
  if (lessonRoleValue === 'worked-example') return 'worked-example'
  return 'explain'
}

function estimatedReadingMinutes(markdown) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(4, Math.min(30, Math.ceil(words / 170)))
}

function activityPurpose(activity) {
  const id = activity.id.toLowerCase()
  if (/(free-|final-project|complete-final-project|review-final-dossier|build-final-project)/.test(id)) {
    return 'independent-practice'
  }
  if (/(assisted|reconstruct|complete-|order-|calculate-total)/.test(id)) return 'completion-problem'
  if (/(follow-|trace-|compare-|guided-|read-drawing|locate-specification)/.test(id)) return 'worked-example'
  if (/(detect-|identify-error|form-hypothesis|choose-check|select-verification)/.test(id)) return 'diagnostic'
  return 'guided-practice'
}

function supportLevelFor(purpose) {
  if (purpose === 'worked-example') return 'full'
  if (purpose === 'completion-problem') return 'faded'
  if (purpose === 'independent-practice') return 'independent'
  return 'guided'
}

function physicalBoundaryFor(packageName) {
  if (packageName === 'mechanical-foundations') {
    return {
      es: 'Esta práctica comprueba comprensión dentro de un modelo mecánico conceptual G1/K2/P0. No demuestra física validada, destreza manual ni capacidad de servicio sobre un calibre real.',
      en: 'This activity checks understanding in a G1/K2/P0 conceptual mechanical model. It does not demonstrate validated physics, manual skill, or the ability to service a real calibre.',
    }
  }
  const calibre = packageName === 'quartz-miyota2035' ? 'MIYOTA 2035' : 'MIYOTA 8215'
  return {
    es: `Esta práctica comprueba reconocimiento o decisiones dentro de una reconstrucción educativa del ${calibre}. No certifica destreza de taller, ajuste, lubricación, tolerancias ni el estado de una unidad física.`,
    en: `This activity checks recognition or decisions in an educational reconstruction of the ${calibre}. It does not certify bench skill, adjustment, lubrication, tolerances, or the condition of a physical unit.`,
  }
}

function orderedLessons(routes, modules, lessons) {
  const moduleById = new Map(modules.map((module) => [module.id, module]))
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const result = []
  for (const route of routes) {
    for (const moduleId of route.moduleIds) {
      const module = moduleById.get(moduleId)
      if (!module) continue
      for (const lessonId of module.lessonIds) {
        const lesson = lessonById.get(lessonId)
        if (lesson && !result.some(({ id }) => id === lesson.id)) result.push(lesson)
      }
    }
  }
  for (const lesson of lessons) {
    if (!result.some(({ id }) => id === lesson.id)) result.push(lesson)
  }
  return result
}

function migratePackage(packageName) {
  const packageRoot = join(repositoryRoot, 'learning-content', packageName)
  const manifestPath = join(packageRoot, 'manifest.json')
  const manifest = readJson(manifestPath)
  const conceptEntries = jsonEntries(join(packageRoot, 'concepts'))
  const lessonEntries = jsonEntries(join(packageRoot, 'lessons'))
  const blockEntries = jsonEntries(join(packageRoot, 'blocks'))
  const activityEntries = jsonEntries(join(packageRoot, 'activities'))
  const routeEntries = jsonEntries(join(packageRoot, 'routes'))
  const moduleEntries = jsonEntries(join(packageRoot, 'modules'))

  const concepts = conceptEntries.map(({ value }) => value)
  const lessons = lessonEntries.map(({ value }) => value)
  const blocks = blockEntries.map(({ value }) => value)
  const activities = activityEntries.map(({ value }) => value)
  const routes = routeEntries.map(({ value }) => value)
  const modules = moduleEntries.map(({ value }) => value)
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const blockById = new Map(blocks.map((block) => [block.id, block]))
  const conceptByCompetency = new Map()

  for (const concept of concepts) {
    for (const competencyId of concept.competencyIds) {
      const current = conceptByCompetency.get(competencyId) ?? []
      conceptByCompetency.set(competencyId, unique([...current, concept.id]))
    }
  }

  const ordered = orderedLessons(routes, modules, lessons)
  if (packageName === 'quartz-miyota2035') {
    const firstLesson = lessons.find(({ id }) => id === 'lesson.quartz2035.workstation')
    if (firstLesson?.authoring) {
      firstLesson.authoring.externalPrerequisites = [{
        packageId: 'wplab.horology.functional-map',
        versionRange: '^0.2.0',
        moduleIds: ['module.horology.functional-map'],
        competencyIds: [
          'competency.horology.identify-functional-subsystems',
          'competency.horology.explain-quartz-energy-chain',
        ],
        recommendedButOptionalRouteIds: ['route.horology.orientation'],
      }]
    }
  }
  for (const lesson of lessons) {
    for (const prerequisite of lesson.authoring?.externalPrerequisites ?? []) {
      if ([
        'wplab.horology.functional-map',
        'wplab.horology.mechanical-foundations',
        'wplab.horology.quartz-miyota2035',
      ].includes(prerequisite.packageId)) {
        prerequisite.versionRange = '^0.2.0'
      }
    }
  }
  const firstTeachingLessonByConcept = new Map()
  ordered.forEach((lesson) => {
    lesson.authoring?.conceptIds.forEach((conceptId) => {
      if (!firstTeachingLessonByConcept.has(conceptId)) firstTeachingLessonByConcept.set(conceptId, lesson.id)
    })
  })

  for (const entry of conceptEntries) {
    const concept = entry.value
    const knowledgeType = knowledgeTypeFor(concept)
    concept.version = '0.2.0'
    concept.knowledgeType = knowledgeType
    concept.recommendedPrerequisiteIds = concept.recommendedPrerequisiteIds ?? []
    concept.misconceptionIds = concept.misconceptionIds ?? []
    concept.bridgeLessonId = concept.bridgeLessonId ?? firstTeachingLessonByConcept.get(concept.id)
    concept.targetEvidenceLevel = targetEvidenceFor(knowledgeType)
    writeJson(entry.path, concept)
  }

  const seenConcepts = new Set()
  ordered.forEach((lesson, index) => {
    if (!lesson.authoring) return
    const role = lessonRole(lesson, index, ordered.length)
    const introduced = lesson.authoring.conceptIds.filter((id) => !seenConcepts.has(id))
    const reinforced = unique([
      ...lesson.authoring.conceptIds.filter((id) => seenConcepts.has(id)),
      ...lesson.authoring.prerequisiteConceptIds,
    ])
    lesson.version = '0.2.0'
    lesson.authoring.recommendedPrerequisiteConceptIds =
      lesson.authoring.recommendedPrerequisiteConceptIds ?? []
    lesson.authoring.pedagogy = {
      role,
      entryCheck: index === 0
        ? 'none'
        : /(diagnosis|final-project)/.test(lesson.id)
          ? 'ungraded-diagnostic'
          : 'self-check',
      userPacedSegments: true,
      introducesConceptIds: introduced,
      reinforcesConceptIds: reinforced,
      bridgeConceptIds: [...lesson.authoring.prerequisiteConceptIds],
    }
    for (const blockId of lesson.blockIds) {
      const block = blockById.get(blockId)
      if (!block) continue
      block.version = '0.2.0'
      block.pedagogy = {
        role: blockRoleFor(role),
        conceptIds: [...lesson.authoring.conceptIds],
        estimatedMinutes: estimatedReadingMinutes(block.bodyMarkdown),
        userPaced: true,
      }
    }
    introduced.forEach((id) => seenConcepts.add(id))
  })

  for (const entry of lessonEntries) writeJson(entry.path, entry.value)
  for (const entry of blockEntries) writeJson(entry.path, entry.value)

  for (const entry of activityEntries) {
    const activity = entry.value
    const lesson = lessonById.get(activity.authoring?.lessonId)
    if (!activity.authoring || !lesson?.authoring) continue
    const targetConceptIds = unique(activity.competencyIds.flatMap((competencyId) =>
      conceptByCompetency.get(competencyId) ?? []))
      .filter((conceptId) => (
        lesson.authoring.conceptIds.includes(conceptId)
        || lesson.authoring.prerequisiteConceptIds.includes(conceptId)
      ))
    const relevantConceptIds = targetConceptIds.length > 0
      ? targetConceptIds
      : [...lesson.authoring.conceptIds]
    const purpose = activityPurpose(activity)
    const supportLevel = supportLevelFor(purpose)
    const responseModel = activity.authoring.interactionContract?.responseModel
    const evidenceLevel = responseModel === 'single-choice' || responseModel === 'multiple-choice'
      ? 'recognition'
      : supportLevel === 'independent'
        ? 'independent-simulation'
        : 'guided-simulation'

    activity.version = '0.2.0'
    activity.authoring.pedagogicalContract = {
      purpose,
      assessmentIntent: 'formative',
      requiresConceptIds: unique([
        ...lesson.authoring.prerequisiteConceptIds,
        ...relevantConceptIds,
      ]),
      introducesConceptIds: [],
      demonstratesConceptIds: purpose === 'worked-example' ? [...relevantConceptIds] : [],
      practicesConceptIds: [...relevantConceptIds],
      assessesConceptIds: [...relevantConceptIds],
      evidenceLevel,
      supportLevel,
      remediation: {
        lessonId: lesson.id,
        blockId: lesson.blockIds[0],
        conceptIds: [...relevantConceptIds],
      },
      physicalBoundary: physicalBoundaryFor(packageName),
    }
    writeJson(entry.path, activity)
  }

  for (const entry of routeEntries) {
    entry.value.version = '0.2.0'
    writeJson(entry.path, entry.value)
  }
  for (const entry of moduleEntries) {
    entry.value.version = '0.2.0'
    writeJson(entry.path, entry.value)
  }

  manifest.packageVersion = '0.2.0'
  manifest.minimumAppVersion = '0.6.0'
  for (const dependency of manifest.dependencies) {
    if ([
      'wplab.horology.functional-map',
      'wplab.horology.mechanical-foundations',
      'wplab.horology.quartz-miyota2035',
    ].includes(dependency.packageId)) {
      dependency.versionRange = '^0.2.0'
    }
  }
  writeJson(manifestPath, manifest)

  return {
    packageName,
    concepts: conceptEntries.length,
    lessons: lessonEntries.length,
    blocks: blockEntries.length,
    activities: activityEntries.length,
  }
}

const results = packageNames.map(migratePackage)
for (const result of results) {
  console.log(
    `${result.packageName}: ${result.concepts} conceptos, ${result.lessons} lecciones, `
    + `${result.blocks} bloques y ${result.activities} actividades migradas.`,
  )
}
