import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const packageRoot = join(root, 'learning-content', 'watchmaking-encyclopedia')
const registryPath = join(root, 'learning-content', 'source-registry', 'horology-student-resources.v1.json')
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const words = (value) => value.replace(/[#*`>|]/g, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0
const normalize = (value) => value.normalize('NFKC').replace(/\s+/g, ' ').trim()
const manifest = await readJson(join(packageRoot, 'manifest.json'))
const registry = await readJson(registryPath)
const load = async (kind) => Promise.all(manifest.entries[kind].map(({ path }) => readJson(join(packageRoot, path))))

const [routes, modules, lessons, blocks, activities, concepts, misconceptions, glossary, sources, visualResources] = await Promise.all([
  load('routes'), load('modules'), load('lessons'), load('blocks'), load('activities'), load('concepts'),
  load('misconceptions'), load('glossary'), load('sources'), load('visualResources'),
])
const blockById = new Map(blocks.map((block) => [block.id, block]))
const moduleById = new Map(modules.map((module) => [module.id, module]))
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]))
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]))
const sourceIds = new Set(sources.map(({ id }) => id))
const registryIds = registry.entries.map(({ id }) => id)
const editorialArchetypes = {
  history: ['## Problema y contexto histórico', '## Vocabulario para leer el cambio', '## Cambio, continuidad y consecuencia', '## Escalas y evidencia comparables', '## Comparación histórica guiada', '## Anacronismos y atajos que conviene evitar'],
  mechanism: ['## Pregunta de funcionamiento', '## Piezas e ideas clave', '## Cadena de funcionamiento', '## Magnitudes que cambian el resultado', '## Mecanismo aplicado a un caso', '## Confusiones mecánicas que debes detectar'],
  procedure: ['## Resultado buscado y condición segura', '## Vocabulario de banco', '## Secuencia, controles y puntos de parada', '## Condiciones y criterios de aceptación', '## Ejemplo de trabajo razonado', '## Errores de proceso y señales de parada'],
  diagnosis: ['## Síntoma, observación y pregunta diagnóstica', '## Vocabulario para formular hipótesis', '## De la observación a la prueba discriminante', '## Medidas, referencias y umbrales', '## Caso diagnóstico razonado', '## Sesgos y conclusiones prematuras'],
  manufacturing: ['## Característica que se quiere fabricar', '## Vocabulario de forma, material y acabado', '## Proceso de fabricación y verificaciones', '## Dimensiones, tolerancias y estado superficial', '## Decisión de fabricación razonada', '## Defectos, causas probables y prevención'],
  design: ['## Decisión de diseño y necesidad', '## Vocabulario para comparar alternativas', '## De requisitos a una arquitectura comprobable', '## Presupuestos, restricciones y márgenes', '## Comparación de alternativas', '## Decisiones frágiles y supuestos ocultos'],
}
const stableSections = ['## Fuentes y alcance', '## Práctica deliberada y transferencia', '## Comprueba antes de continuar']
const requiredSections = [...new Set([...Object.values(editorialArchetypes).flat(), ...stableSections])]
const forbiddenStudentLanguage = /\b(?:runtime|fixture|WatchProject|snapshot|claims?|retained|viewport|checkpoints?|ledger|remove-before|part-of|fastened-by)\b|(?<![\p{L}\p{N}_])IDs?(?![\p{L}\p{N}_])|dominio retenido|\bG\s*\/\s*K\s*\/\s*P\b|\b(?:R|G|K|P)\d\b|\bwplab\.[a-z0-9.-]+|\bsource\.[a-z0-9.-]+/giu
const forbiddenGenericTailMarkers = [
  '## Modelo mental paso a paso',
  '## Antes de practicar',
  '## Transferencia hacia un reloj propio',
  '## Frontera de fuentes',
]
const brokenQuestionPatterns = [
  /permite comprobar\s+\p{L}+(?:ar|er|ir)\b/giu,
  /relaciona(?:do|r) una observaci[oó]n(?: verificable)? con\s+\p{L}+(?:ar|er|ir)\b/giu,
  /evidencia,\s*\p{L}+(?:ar|er|ir)\s+y l[ií]mites/giu,
]
const untranslatedSubsystemPattern = /(?:a[ií]sla|dentro de|b[uú]squeda a|subsistema)\s+(?:train|keyless|motion-works|power-source|mainspring|gear-pair|workstation|isa-memory|final-project)\b/giu
const visibleTaxonomySlugPattern = /\b(?:conceptual[- ]causal|horology foundations|motion[- ]works|power[- ]source|electronic[- ]control|quartz[- ]resonator|stepper[- ]rotor|automatic[- ]winding|system[- ]overview|final[- ]project)\b/giu

function archetypeForBody(body) {
  return Object.entries(editorialArchetypes).find(([, headings]) => headings.every((heading) => body.includes(heading)))?.[0]
}

function collectStrings(value, owner, output = []) {
  if (typeof value === 'string') output.push({ owner, value })
  else if (Array.isArray(value)) value.forEach((item, index) => collectStrings(item, `${owner}[${index}]`, output))
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => collectStrings(item, `${owner}.${key}`, output))
  return output
}

const learnerFacingKeys = new Set([
  'accessibleLabel', 'causalQuestion', 'colorIndependentCues', 'content', 'correctExplanation',
  'description', 'errorSignals', 'evidence', 'feedback', 'forbiddenClaims', 'incorrectDiagnosis',
  'instruction', 'instructionMarkdown', 'keyboardActions', 'label', 'labels', 'markdown', 'narrative',
  'nextObservation', 'notePrompt', 'observableResult', 'outcome', 'physicalBoundary', 'prompt',
  'promptMarkdown', 'promptStarters', 'purpose', 'readinessCriteria', 'reason', 'restoration',
  'successCriteria', 'successCriterion', 'textualAlternative', 'title', 'transferPrompt',
  'userInteraction', 'reducedMotionAlternative',
])

function collectLearnerFacingStrings(value, owner, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectLearnerFacingStrings(item, `${owner}[${index}]`, output))
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      const childOwner = `${owner}.${key}`
      if (learnerFacingKeys.has(key)) collectStrings(item, childOwner, output)
      else collectLearnerFacingStrings(item, childOwner, output)
    }
  }
  return output
}

const lessonRows = lessons.map((lesson) => {
  const body = lesson.blockIds.map((id) => blockById.get(id)?.bodyMarkdown ?? '').join('\n')
  const claims = lesson.blockIds.flatMap((id) => blockById.get(id)?.claims ?? [])
  const centralClaim = claims[0]?.claim?.trim()
  const archetype = archetypeForBody(body)
  const conceptSections = body.match(/^### \d+\. .+$/gmu) ?? []
  const contextualDefinitions = body.match(/^\*\*(?:En esta unidad|Aplicación en esta lección):\*\*/gmu) ?? []
  const conceptContexts = body.match(/^\*\*(?:En esta unidad|Aplicación en esta lección):\*\*.*$/gmu) ?? []
  const conceptTerms = (lesson.authoring?.conceptIds ?? []).map((conceptId) => conceptById.get(conceptId)?.title?.es).filter(Boolean)
  const conceptContextSkeletons = conceptContexts.map((paragraph) => conceptTerms.reduce(
    (result, term) => result.replaceAll(`**${term}**`, '**{término}**').replaceAll(term, '{término}'),
    paragraph.replaceAll(`«${lesson.title.es ?? lesson.title}»`, '«{lección}»'),
  ))
  return {
    id: lesson.id,
    words: words(body),
    archetype,
    sections: {
      archetype: Boolean(archetype),
      stable: stableSections.every((section) => body.includes(section)),
    },
    claimCount: claims.length,
    sourceCount: lesson.authoring?.sourceIds?.length ?? 0,
    conceptCount: lesson.authoring?.conceptIds?.length ?? 0,
    contextualVocabulary: conceptSections.length === 3 && contextualDefinitions.length === 3,
    repeatedConceptContext: conceptContextSkeletons.length !== new Set(conceptContextSkeletons).size,
    unsafeIndexedRelation: /se comprueba su relaci[oó]n con \*\*/iu.test(body),
    automaticRegistryTransition: /Registra el estado anterior y el posterior|indica qué elemento entrega la acción, cuál la recibe/iu.test(body),
    awkwardCausalTransition: /produce el estado que .* necesita|ayuda a seguir una causa hasta su efecto/iu.test(body),
    genericMechanismFallbacks: body.match(/Examina la interfaz:/gu)?.length ?? 0,
    centralClaimRepetitions: centralClaim ? body.split(centralClaim).length - 1 : 0,
    internalLanguage: [...body.matchAll(forbiddenStudentLanguage)].map(([match]) => match),
    theoryFirst: lesson.authoring?.studyContract?.sequence === 'theory-first'
      && lesson.authoring?.studyContract?.practiceUnlock === 'after-required-reading',
  }
})

const longParagraphOwners = new Map()
for (const block of blocks) {
  for (const paragraph of block.bodyMarkdown.split(/\n\s*\n/).map(normalize).filter((value) => words(value) >= 40)) {
    const owners = longParagraphOwners.get(paragraph) ?? []
    owners.push(block.id)
    longParagraphOwners.set(paragraph, owners)
  }
}
const repeatedLongParagraphs = [...longParagraphOwners.entries()]
  .filter(([, owners]) => owners.length > 1)
  .map(([paragraph, owners]) => ({ words: words(paragraph), owners, sample: paragraph.slice(0, 180) }))

const templateParagraphOwners = new Map()
for (const block of blocks) {
  for (const paragraph of block.bodyMarkdown.split(/\n\s*\n/).map(normalize).filter((value) => words(value) >= 45)) {
    const skeleton = paragraph
      .replace(/\*\*[^*]+\*\*/g, '**{contexto}**')
      .replace(/«[^»]+»/g, '«{contexto}»')
      .replace(/\b\d+(?:[.,]\d+)?\b/g, '{número}')
    const owners = templateParagraphOwners.get(skeleton) ?? []
    owners.push(block.id)
    templateParagraphOwners.set(skeleton, owners)
  }
}
const excessivelyRepeatedTemplates = [...templateParagraphOwners.entries()]
  .filter(([, owners]) => owners.length > 60)
  .map(([paragraph, owners]) => ({ owners, sample: paragraph.slice(0, 180) }))
const genericMechanismFallbackCount = lessonRows.reduce((sum, row) => sum + row.genericMechanismFallbacks, 0)

const coreStudentPackageNames = ['horology-foundations', 'quartz-miyota2035', 'mechanical-foundations', 'miyota8215']
const studentPackageNames = [
  ...coreStudentPackageNames,
  'inspection-metrology',
  'advanced-watchmaking',
  'watchmaking-capstone',
  'watchmaking-encyclopedia',
]
const studentBodies = []
const coreQuestionStrings = []
const foundationActivities = []
const foundationScenes = []
const auditedContentLessonKeys = new Set()
const auditedContentActivityKeys = new Set()
const auditedSceneKeys = new Set()
const auditedScenes = []
const auditedKnowledgeStrings = []
for (const packageName of studentPackageNames) {
  const coreRoot = join(root, 'learning-content', packageName)
  const coreManifest = await readJson(join(coreRoot, 'manifest.json'))
  const packageModules = new Map(await Promise.all((coreManifest.entries.modules ?? []).map(async (entry) => [
    entry.id,
    await readJson(join(coreRoot, entry.path)),
  ])))
  const packageLessons = new Map(await Promise.all((coreManifest.entries.lessons ?? []).map(async (entry) => [
    entry.id,
    await readJson(join(coreRoot, entry.path)),
  ])))
  const packageBlocks = new Map(await Promise.all((coreManifest.entries.blocks ?? []).map(async (entry) => [
    entry.id,
    await readJson(join(coreRoot, entry.path)),
  ])))
  const packageActivities = new Map(await Promise.all((coreManifest.entries.activities ?? []).map(async (entry) => [
    entry.id,
    await readJson(join(coreRoot, entry.path)),
  ])))
  const packageScenes = new Map(await Promise.all((coreManifest.entries.scenes ?? []).map(async (entry) => [
    entry.id,
    await readJson(join(coreRoot, entry.path)),
  ])))
  const packageConcepts = await Promise.all((coreManifest.entries.concepts ?? []).map(async (entry) => ({
    id: entry.id,
    value: await readJson(join(coreRoot, entry.path)),
  })))
  const packageMisconceptions = await Promise.all((coreManifest.entries.misconceptions ?? []).map(async (entry) => ({
    id: entry.id,
    value: await readJson(join(coreRoot, entry.path)),
  })))
  const packageGlossary = await Promise.all((coreManifest.entries.glossary ?? []).map(async (entry) => ({
    id: entry.id,
    value: await readJson(join(coreRoot, entry.path)),
  })))
  for (const { id, value } of packageConcepts) {
    for (const field of ['title', 'summary', 'plainLanguage', 'technicalLanguage', 'whyItMatters', 'observableActions']) {
      collectStrings(value[field], `${packageName}/${id}.${field}`, auditedKnowledgeStrings)
    }
  }
  for (const { id, value } of packageMisconceptions) {
    for (const field of ['title', 'learnerExpression', 'diagnosis', 'correction', 'observableSignals']) {
      collectStrings(value[field], `${packageName}/${id}.${field}`, auditedKnowledgeStrings)
    }
  }
  for (const { id, value } of packageGlossary) {
    collectStrings(value.term, `${packageName}/${id}.term`, auditedKnowledgeStrings)
    collectStrings(value.definitionMarkdown, `${packageName}/${id}.definitionMarkdown`, auditedKnowledgeStrings)
    for (const field of ['simpleDefinition', 'technicalDefinition', 'context']) {
      collectStrings(value.authoring?.[field], `${packageName}/${id}.authoring.${field}`, auditedKnowledgeStrings)
    }
  }
  const auditedLessonIds = new Set()
  for (const routeEntry of coreManifest.entries.routes ?? []) {
    const route = await readJson(join(coreRoot, routeEntry.path))
    for (const moduleId of route.moduleIds ?? []) {
      for (const lessonId of packageModules.get(moduleId)?.lessonIds ?? []) auditedLessonIds.add(lessonId)
    }
  }
  const auditedActivityIds = new Set()
  for (const lessonId of auditedLessonIds) {
    const lesson = packageLessons.get(lessonId)
    if (!lesson) continue
    auditedContentLessonKeys.add(`${packageName}/${lessonId}`)
    for (const blockId of lesson.blockIds ?? []) {
      const block = packageBlocks.get(blockId)
      if (block) studentBodies.push({ owner: `${packageName}/${block.id}`, value: block.bodyMarkdown ?? '' })
    }
    for (const activityId of lesson.activityIds ?? []) auditedActivityIds.add(activityId)
  }
  for (const activityId of auditedActivityIds) {
    const activity = packageActivities.get(activityId)
    if (!activity) continue
    auditedContentActivityKeys.add(`${packageName}/${activityId}`)
    if (packageName === 'horology-foundations') foundationActivities.push(activity)
    coreQuestionStrings.push(...collectLearnerFacingStrings(activity, `${packageName}/${activityId}`))
    for (const sceneId of activity.sceneIds ?? []) {
      const scene = packageScenes.get(sceneId)
      const sceneKey = `${packageName}/${sceneId}`
      if (!scene || auditedSceneKeys.has(sceneKey)) continue
      auditedSceneKeys.add(sceneKey)
      auditedScenes.push({ packageName, scene })
      if (packageName === 'horology-foundations') foundationScenes.push(scene)
      coreQuestionStrings.push(...collectLearnerFacingStrings(scene, sceneKey))
    }
  }
}
const internalLanguageFindings = [...studentBodies, ...coreQuestionStrings, ...auditedKnowledgeStrings]
  .flatMap(({ owner, value }) => [...value.matchAll(forbiddenStudentLanguage)].map(([match]) => ({ owner, match })))
const visibleTaxonomySlugFindings = auditedKnowledgeStrings.flatMap(({ owner, value }) =>
  [...value.matchAll(visibleTaxonomySlugPattern)].map(([match]) => ({ owner, match, value })))
const genericTailFindings = studentBodies.flatMap(({ owner, value }) => forbiddenGenericTailMarkers
  .filter((marker) => value.includes(marker))
  .map((marker) => ({ owner, marker })))
const brokenQuestionFindings = coreQuestionStrings.flatMap(({ owner, value }) => brokenQuestionPatterns
  .flatMap((pattern) => [...value.matchAll(pattern)].map(([match]) => ({ owner, match, value }))))
const untranslatedSubsystemFindings = coreQuestionStrings.flatMap(({ owner, value }) =>
  [...value.matchAll(untranslatedSubsystemPattern)].map(([match]) => ({ owner, match, value })))
const studentParagraphOwners = new Map()
for (const { owner, value } of studentBodies) {
  const packageName = owner.split('/')[0]
  for (const section of value.split(/(?=^##\s+)/gmu)) {
    const paragraphs = section.split(/\n\s*\n/gu)
    const heading = paragraphs[0]?.trim() ?? ''
    const protectedEditorialNotice = /^##\s+(?:Fuentes?|Fiabilidad|Procedencia|Seguridad|L[ií]mite|Alcance)/iu.test(heading)
    for (const paragraph of paragraphs) {
      const normalized = normalize(paragraph)
      if (protectedEditorialNotice || words(normalized) < 14 || normalized.length <= 80 || /^#{1,6}\s/u.test(normalized)) continue
      const key = `${packageName}\u0000${normalized}`
      const owners = studentParagraphOwners.get(key) ?? []
      owners.push(owner)
      studentParagraphOwners.set(key, owners)
    }
  }
}
const repeatedStudentParagraphs = [...studentParagraphOwners.entries()]
  .map(([key, owners]) => ({ packageName: key.split('\u0000')[0], paragraph: key.split('\u0000').slice(1).join('\u0000'), owners: [...new Set(owners)] }))
  .filter(({ owners }) => owners.length >= 3)
const recognitionResponseKinds = new Set(['single-choice', 'multiple-choice', 'entity-selection', 'ordered-list'])
const choiceReasoningFindings = auditedScenes.flatMap(({ packageName, scene }) => (scene.steps ?? []).flatMap((step) => {
  const hasChoice = (step.questions ?? []).some(({ responseKind }) => recognitionResponseKinds.has(responseKind))
  const hasReasoning = (step.questions ?? []).some(({ responseKind }) => responseKind === 'structured-response')
  return hasChoice && !hasReasoning ? [`${packageName}/${scene.id}/${step.id}: la elección no exige explicar la relación observada`] : []
}))

const foundationPromptPatterns = new Map([
  ['activity.horology.classify-subsystems', /clasifica.*tren de ruedas|tren de ruedas.*transmisi[oó]n/iu],
  ['activity.horology.order-quartz-chain', /ordena.*cadena de cuarzo/iu],
  ['activity.horology.identify-time-reference', /resonador de cuarzo.*referencia temporal/iu],
  ['activity.horology.isa-confidence-map', /mapa de confianza.*ISA 8172/iu],
  ['activity.horology.order-mechanical-chain', /ordena.*cadena mec[aá]nica/iu],
  ['activity.horology.identify-escapement-oscillator', /volante.*espiral.*[aá]ncora.*rueda de escape/iu],
  ['activity.horology.match-functional-equivalents', /equivalencias funcionales.*referencia temporal/iu],
  ['activity.horology.predict-interruption', /tren.*bloqueado.*fuente conserva energ[ií]a/iu],
  ['activity.horology.select-affected-subsystem', /fuente.*referencia temporal.*dos subsistemas/iu],
  ['activity.horology.justify-hypothesis', /justifica una hip[oó]tesis.*indicaci[oó]n detenida/iu],
])
const foundationSceneById = new Map(foundationScenes.map((scene) => [scene.id, scene]))
const foundationQuestionRows = foundationActivities.map((activity) => {
  const sceneId = activity.sceneIds?.[0]
  const scene = foundationSceneById.get(sceneId)
  const prompts = scene?.steps.flatMap((step) => step.questions.map(({ promptMarkdown }) => promptMarkdown)) ?? []
  const expected = foundationPromptPatterns.get(activity.id)
  return {
    activityId: activity.id,
    sceneId,
    prompts,
    specific: Boolean(expected && prompts.some((prompt) => expected.test(prompt))),
  }
})
const foundationQuestionFindings = [
  ...foundationQuestionRows.filter(({ specific }) => !specific).map(({ activityId, sceneId, prompts }) => `${activityId}: la escena ${sceneId ?? 'ausente'} no contiene una pregunta que corresponda a la actividad (${prompts.join(' | ')})`),
  ...(foundationQuestionRows.length === 10 ? [] : [`Fundamentos: se esperaban 10 actividades con comprobación específica y hay ${foundationQuestionRows.length}`]),
  ...(new Set(foundationQuestionRows.map(({ sceneId }) => sceneId)).size === foundationQuestionRows.length ? [] : ['Fundamentos: dos actividades siguen compartiendo la misma escena de evaluación']),
]

const intraLessonPrerequisiteFindings = lessons.flatMap((lesson) => {
  const conceptIds = new Set(lesson.authoring?.conceptIds ?? [])
  return [...conceptIds].flatMap((conceptId) => (conceptById.get(conceptId)?.prerequisiteIds ?? [])
    .filter((prerequisiteId) => conceptIds.has(prerequisiteId))
    .map((prerequisiteId) => ({ lessonId: lesson.id, conceptId, prerequisiteId })))
})

const quartzRoute = routes.find(({ id }) => id === 'route.encyclopedia.quartz-electronics')
const quartzLessonIds = quartzRoute?.moduleIds.flatMap((moduleId) => moduleById.get(moduleId)?.lessonIds ?? []) ?? []
const technicalQuartzSourceIds = new Set([
  'source.private.toh.ch15',
  'source.official.miyota.2035',
  'source.institutional.awci.standards',
])
const quartzSourceFindings = quartzLessonIds.flatMap((lessonId) => {
  const lesson = lessonById.get(lessonId)
  const sourceIdsForLesson = lesson?.authoring?.sourceIds ?? []
  const body = (lesson?.blockIds ?? []).map((blockId) => blockById.get(blockId)?.bodyMarkdown ?? '').join('\n')
  const findings = []
  if (sourceIdsForLesson.includes('source.external.animagraffs-mechanical-watch')) {
    findings.push(`${lessonId}: usa Animagraffs Mechanical Watch como soporte de electrónica de cuarzo`)
  }
  if (!sourceIdsForLesson.some((sourceId) => technicalQuartzSourceIds.has(sourceId))) {
    findings.push(`${lessonId}: no declara ToH ch15, MIYOTA 2035 o AWCI como fuente técnica de cuarzo`)
  }
  if (sourceIdsForLesson.some((sourceId) => ['source.external.watchbase', 'source.external.caliber-corner'].includes(sourceId))
    && !/descubrir y comparar|descubrir.*no como prueba primaria/iu.test(body)) {
    findings.push(`${lessonId}: no distingue las bases de datos de descubrimiento de las fuentes técnicas primarias`)
  }
  return findings
})

const routeRows = routes.map((route) => {
  const routeLessonIds = route.moduleIds.flatMap((id) => moduleById.get(id)?.lessonIds ?? [])
  return {
    id: route.id, modules: route.moduleIds.length, lessons: routeLessonIds.length,
    milestones: route.learningDesign?.milestones?.length ?? 0, sourceCount: route.sourceIds?.length ?? 0,
    unresolvedLessons: routeLessonIds.filter((id) => !lessonById.has(id)),
  }
})

const failures = [
  ...lessonRows.filter((row) => row.words < 760).map((row) => `${row.id}: ${row.words} palabras (<760)`),
  ...lessonRows.filter((row) => Object.values(row.sections).some((present) => !present)).map((row) => `${row.id}: falta un arquetipo editorial completo o una sección común`),
  ...lessonRows.filter((row) => row.claimCount < 1 || row.sourceCount < 2 || row.conceptCount !== 3 || !row.theoryFirst).map((row) => `${row.id}: contrato editorial incompleto`),
  ...lessonRows.filter((row) => !row.contextualVocabulary).map((row) => `${row.id}: los tres términos no tienen definición y contexto dentro de la unidad`),
  ...lessonRows.filter((row) => row.repeatedConceptContext).map((row) => `${row.id}: repite el mismo contexto editorial para varios términos`),
  ...lessonRows.filter((row) => row.unsafeIndexedRelation).map((row) => `${row.id}: conserva una relación automática por índice`),
  ...lessonRows.filter((row) => row.automaticRegistryTransition).map((row) => `${row.id}: conserva la transición genérica de registro`),
  ...lessonRows.filter((row) => row.awkwardCausalTransition).map((row) => `${row.id}: conserva una transición causal artificial o gramaticalmente torpe`),
  ...(genericMechanismFallbackCount <= 12 ? [] : [`Enciclopedia: ${genericMechanismFallbackCount} transiciones mecánicas usan todavía el fallback genérico (>12)`]),
  ...lessonRows.filter((row) => row.centralClaimRepetitions > 1).map((row) => `${row.id}: repite ${row.centralClaimRepetitions} veces la afirmación central dentro de la misma lección`),
  ...lessonRows.filter((row) => row.internalLanguage.length).map((row) => `${row.id}: lenguaje interno en el cuerpo (${row.internalLanguage.join(', ')})`),
  ...routeRows.filter((row) => row.lessons < 6 || row.milestones !== row.lessons || row.unresolvedLessons.length).map((row) => `${row.id}: jerarquía o hitos incompletos`),
  ...registryIds.filter((id) => !sourceIds.has(id)).map((id) => `Recurso de Horology Student no registrado: ${id}`),
  ...concepts.flatMap((concept) => (concept.prerequisiteIds ?? []).filter((id) => !concepts.some((candidate) => candidate.id === id)).map((id) => `${concept.id}: prerrequisito inexistente ${id}`)),
  ...misconceptions.filter(({ remediationLessonId }) => !lessonById.has(remediationLessonId)).map(({ id }) => `${id}: refuerzo inexistente`),
  ...repeatedLongParagraphs.map(({ owners, sample }) => `Párrafo largo repetido en ${owners.join(', ')}: ${sample}`),
  ...excessivelyRepeatedTemplates.map(({ owners, sample }) => `Plantilla sustancial repetida ${owners.length} veces: ${sample}`),
  ...repeatedStudentParagraphs.map(({ packageName, paragraph, owners }) => `${packageName}: párrafo pedagógico repetido en ${owners.length} lecciones (${paragraph.slice(0, 180)})`),
  ...internalLanguageFindings.map(({ owner, match }) => `${owner}: lenguaje interno visible (${match})`),
  ...genericTailFindings.map(({ owner, marker }) => `${owner}: conserva la cola editorial genérica (${marker})`),
  ...brokenQuestionFindings.map(({ owner, match }) => `${owner}: pregunta o feedback agramatical (${match})`),
  ...untranslatedSubsystemFindings.map(({ owner, match }) => `${owner}: subsistema interno sin traducir (${match})`),
  ...visibleTaxonomySlugFindings.map(({ owner, match }) => `${owner}: taxonomía interna sin traducir (${match})`),
  ...choiceReasoningFindings,
  ...intraLessonPrerequisiteFindings.map(({ lessonId, conceptId, prerequisiteId }) => `${lessonId}: relación por posición dentro de la unidad (${conceptId} depende de ${prerequisiteId})`),
  ...foundationQuestionFindings,
  ...quartzSourceFindings,
  ...sources
    .filter(({ id, currency, historicalSafety }) => /source\.(private\.(toh|bulova|chicago)|official\.tm9-1575)/.test(id) && (!currency || !historicalSafety))
    .map(({ id }) => `${id}: falta vigencia o revisión de seguridad histórica`),
  ...sources
    .filter(({ historicalSafety }) => ['modern-substitute-required', 'prohibited-instruction'].includes(historicalSafety?.status) && historicalSafety?.operationalUse !== 'blocked')
    .map(({ id }) => `${id}: procedimiento peligroso no bloqueado`),
]

const report = {
  schema: 'wplab-academy-content-quality-v1', generatedAt: new Date().toISOString(),
  result: failures.length ? 'fail' : 'pass',
  scope: {
    routes: routes.length, lessons: lessons.length, activities: activities.length, concepts: concepts.length,
    misconceptions: misconceptions.length, glossary: glossary.length, sources: sources.length, visualResources: visualResources.length,
    auditedPackages: studentPackageNames.length,
    auditedContentLessons: auditedContentLessonKeys.size,
    auditedContentActivities: auditedContentActivityKeys.size,
    auditedContentScenes: auditedSceneKeys.size,
    theoryWords: lessonRows.reduce((sum, row) => sum + row.words, 0),
  },
  thresholds: {
    theoryWordsPerLesson: 760, conceptsPerLesson: 3, minimumLessonsPerRoute: 6,
    editorialArchetypes: Object.keys(editorialArchetypes), stableSections, requiredSections,
    maximumRepeatedLongParagraphs: 0, maximumOwnersPerTemplateSkeleton: 60,
    maximumRepeatedStudentParagraphs: 0,
    maximumLessonsWithRepeatedCentralClaim: 0,
    maximumLessonsWithRepeatedConceptContext: 0, maximumAwkwardCausalTransitions: 0,
    maximumGenericMechanismFallbacks: 12,
    maximumInternalLanguageFindings: 0, maximumGenericTailFindings: 0, maximumBrokenQuestionFindings: 0, maximumUntranslatedSubsystemFindings: 0,
    maximumVisibleTaxonomySlugFindings: 0,
    maximumChoiceReasoningFindings: 0,
    maximumIntraLessonPrerequisiteFindings: 0, maximumQuartzSourceFindings: 0,
    requiredSpecificFoundationChecks: 10,
    requiredHorologyStudentResources: registryIds.length,
  },
  editorialQuality: {
    archetypes: Object.fromEntries(Object.keys(editorialArchetypes).map((archetype) => [archetype, lessonRows.filter((row) => row.archetype === archetype).length])),
    contextualVocabularyLessons: lessonRows.filter(({ contextualVocabulary }) => contextualVocabulary).length,
    unsafeIndexedRelations: lessonRows.filter(({ unsafeIndexedRelation }) => unsafeIndexedRelation).length,
    automaticRegistryTransitions: lessonRows.filter(({ automaticRegistryTransition }) => automaticRegistryTransition).length,
    awkwardCausalTransitions: lessonRows.filter(({ awkwardCausalTransition }) => awkwardCausalTransition).length,
    lessonsWithRepeatedConceptContext: lessonRows.filter(({ repeatedConceptContext }) => repeatedConceptContext).length,
    genericMechanismFallbacks: genericMechanismFallbackCount,
    lessonsWithRepeatedCentralClaim: lessonRows.filter(({ centralClaimRepetitions }) => centralClaimRepetitions > 1).length,
    repeatedLongParagraphs: repeatedLongParagraphs.length,
    excessivelyRepeatedTemplates: excessivelyRepeatedTemplates.length,
    repeatedStudentParagraphs: repeatedStudentParagraphs.length,
    internalLanguageFindings: internalLanguageFindings.length,
    genericTailFindings: genericTailFindings.length,
    brokenQuestionFindings: brokenQuestionFindings.length,
    untranslatedSubsystemFindings: untranslatedSubsystemFindings.length,
    visibleTaxonomySlugFindings: visibleTaxonomySlugFindings.length,
    choiceReasoningFindings: choiceReasoningFindings.length,
    intraLessonPrerequisiteFindings: intraLessonPrerequisiteFindings.length,
    quartzSourceFindings: quartzSourceFindings.length,
    specificFoundationChecks: foundationQuestionRows.filter(({ specific }) => specific).length,
  },
  sourceCoverage: {
    registeredResources: registryIds.length, presentResources: registryIds.filter((id) => sourceIds.has(id)).length,
    danielsChapters: sources.filter(({ id }) => id.startsWith('source.private.daniels.')).length,
    theoryOfHorologyChapters: sources.filter(({ id }) => id.startsWith('source.private.toh.')).length,
    bulovaSkillUnits: sources.filter(({ id }) => id.startsWith('source.private.bulova.')).length,
    chicagoArchiveFiles: sources.filter(({ id }) => id.startsWith('source.private.chicago.')).length,
    tmHistoricalSections: sources.filter(({ id }) => id.startsWith('source.official.tm9-1575.')).length,
    safetyReviewedHistoricalSources: sources.filter(({ historicalSafety }) => historicalSafety).length,
    blockedHistoricalProcedures: sources.filter(({ historicalSafety }) => historicalSafety?.operationalUse === 'blocked').length,
    hashedLocalSources: sources.filter(({ resource }) => resource?.sha256).map(({ id }) => id),
  },
  failures, routes: routeRows, lessons: lessonRows,
}

const outputRoot = join(root, 'docs', 'generated')
await mkdir(outputRoot, { recursive: true })
await writeFile(join(outputRoot, 'APRENDER-CONTENIDO-0.13-AUDITORIA.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
const markdown = `# Auditoría reproducible del contenido 0.13\n\nGenerada: ${report.generatedAt}  \nResultado: **${report.result === 'pass' ? 'CORRECTO' : 'FALLIDO'}**\n\n## Alcance enciclopédico nuevo\n\n- ${report.scope.routes} rutas y ${report.scope.lessons} lecciones de la enciclopedia;\n- ${report.scope.auditedPackages} paquetes auditados de extremo a extremo: ${report.scope.auditedContentLessons} lecciones, ${report.scope.auditedContentActivities} actividades y ${report.scope.auditedContentScenes} escenas de contenido, incluidos los protocolos internos de calidad;\n- el catálogo visible del estudiante excluye esos tres protocolos internos y conserva 222 lecciones y 289 actividades;\n- ${report.scope.theoryWords.toLocaleString('es-ES')} palabras de teoría enciclopédica;\n- ${report.scope.concepts} conceptos y ${report.scope.misconceptions} errores conceptuales;\n- ${report.scope.glossary} entradas de glosario;\n- ${report.scope.sources} fuentes registradas, incluidos ${report.sourceCoverage.presentResources}/${report.sourceCoverage.registeredResources} recursos del directorio Horology Student, ${report.sourceCoverage.danielsChapters} capítulos del libro local, ${report.sourceCoverage.theoryOfHorologyChapters} capítulos de Theory of Horology, ${report.sourceCoverage.bulovaSkillUnits} unidades Bulova, ${report.sourceCoverage.chicagoArchiveFiles} documentos Chicago y ${report.sourceCoverage.tmHistoricalSections} secciones TM 9-1575;\n- ${report.scope.visualResources} laboratorios visuales y ${report.sourceCoverage.safetyReviewedHistoricalSources} fuentes históricas con estado de seguridad explícito; ${report.sourceCoverage.blockedHistoricalProcedures} procedimientos permanecen bloqueados.\n\n## Controles editoriales\n\nCada unidad enciclopédica supera 760 palabras, aplica uno de seis arquetipos, contextualiza tres términos, conserva procedencia y presenta teoría antes de práctica. En los ocho paquetes, la auditoría rechaza relaciones por índice, transiciones automáticas, preguntas agramaticales, elecciones sin explicación, etiquetas internas sin traducir, lenguaje de implementación en el cuerpo y plantillas sustanciales repetidas en más de 60 unidades. Cada ruta conserva un hito por unidad y las fuentes históricas declaran vigencia, riesgos y uso operativo.\n\n- Arquetipos: ${Object.entries(report.editorialQuality.archetypes).map(([key, count]) => `${key} ${count}`).join(', ')}.\n- Vocabulario contextual: ${report.editorialQuality.contextualVocabularyLessons}/${report.scope.lessons} lecciones enciclopédicas.\n- Relaciones por índice: ${report.editorialQuality.unsafeIndexedRelations}; transiciones de registro: ${report.editorialQuality.automaticRegistryTransitions}.\n- Lenguaje interno: ${report.editorialQuality.internalLanguageFindings}; preguntas rotas: ${report.editorialQuality.brokenQuestionFindings}; subsistemas sin traducir: ${report.editorialQuality.untranslatedSubsystemFindings}; elecciones sin explicación: ${report.editorialQuality.choiceReasoningFindings}.\n\n## Fallos\n\n${failures.length ? failures.map((failure) => `- ${failure}`).join('\n') : 'Ninguno.'}\n\n## Límite\n\nEl informe verifica amplitud, estructura y trazabilidad declarativa. No acredita por sí solo exactitud de todo procedimiento físico, destreza manual, seguridad de una sustancia, compatibilidad de repuesto ni validación de ingeniería.\n`
await writeFile(join(outputRoot, 'APRENDER-CONTENIDO-0.13-AUDITORIA.md'), markdown.replace(/[ \t]+$/gmu, ''), 'utf8')

if (routes.length !== 12 || lessons.length !== 135 || activities.length !== 135 || concepts.length !== 405 || misconceptions.length !== 135 || glossary.length !== 405 || sources.length !== 129 || visualResources.length !== 25) {
  throw new Error(`Alcance enciclopédico inesperado: ${JSON.stringify(report.scope)}`)
}
if (report.scope.auditedPackages !== 8 || report.scope.auditedContentLessons !== 225 || report.scope.auditedContentActivities !== 292) {
  throw new Error(`Alcance global de Academia inesperado: ${JSON.stringify(report.scope)}`)
}
if (report.sourceCoverage.theoryOfHorologyChapters !== 15 || report.sourceCoverage.bulovaSkillUnits !== 20 || report.sourceCoverage.chicagoArchiveFiles !== 37 || report.sourceCoverage.tmHistoricalSections !== 8 || report.sourceCoverage.safetyReviewedHistoricalSources !== 80) {
  throw new Error(`Cobertura del corpus clásico inesperada: ${JSON.stringify(report.sourceCoverage)}`)
}
if (failures.length) throw new Error(`Auditoría de contenido fallida: ${failures.length} problemas.`)
console.log(`Auditoría de contenido 0.13: ${report.scope.routes} rutas, ${report.scope.lessons} lecciones, ${report.scope.theoryWords} palabras, ${report.scope.sources} fuentes y ${report.scope.visualResources} laboratorios · CORRECTA.`)
