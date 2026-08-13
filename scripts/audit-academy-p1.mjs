import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const packageNames = [
  'horology-foundations',
  'quartz-miyota2035',
  'mechanical-foundations',
  'miyota8215',
  'inspection-metrology',
  'advanced-watchmaking',
  'watchmaking-capstone',
  'watchmaking-encyclopedia',
]

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const wordCount = (value) => value.replace(/\{\{[^}]+\}\}/g, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0
const genericPrompt = /Qué criterio permite justificar correctamente|Relacionar una observación verificable con/i

const rows = []
const lessonRows = []
const lessonIds = new Set()
const routeIds = new Set()

for (const packageName of packageNames) {
  const packageRoot = join(root, 'learning-content', packageName)
  const manifest = await readJson(join(packageRoot, 'manifest.json'))
  const entries = manifest.entries
  const loadMap = async (kind) => new Map(await Promise.all((entries[kind] ?? []).map(async (entry) => [
    entry.id,
    await readJson(join(packageRoot, entry.path)),
  ])))
  const routes = await loadMap('routes')
  const modules = await loadMap('modules')
  const lessons = await loadMap('lessons')
  const blocks = await loadMap('blocks')
  const activities = await loadMap('activities')
  const scenes = await loadMap('scenes')

  const activityRoutes = new Map()
  const learnerLessonIds = new Set()
  for (const route of routes.values()) {
    if (route.demo) continue
    routeIds.add(route.id)
    for (const moduleId of route.moduleIds) {
      for (const lessonId of modules.get(moduleId)?.lessonIds ?? []) {
        learnerLessonIds.add(lessonId)
        for (const activityId of lessons.get(lessonId)?.activityIds ?? []) {
          const targets = activityRoutes.get(activityId) ?? []
          targets.push(route.id)
          activityRoutes.set(activityId, targets)
        }
      }
    }
  }

  for (const lessonId of learnerLessonIds) {
    lessonIds.add(lessonId)
    const lesson = lessons.get(lessonId)
    const theory = lesson.blockIds.map((blockId) => blocks.get(blockId)?.bodyMarkdown ?? '').join('\n')
    const theoryWords = wordCount(theory)
    lessonRows.push({ packageId: manifest.id, lessonId, theoryWords })
    for (const activityId of lesson.activityIds) {
      const activity = activities.get(activityId)
      const authoring = activity.authoring
      const activityScenes = activity.sceneIds.map((sceneId) => scenes.get(sceneId)).filter(Boolean)
      const questions = activityScenes.flatMap((scene) => scene.steps.flatMap(({ questions: stepQuestions }) => stepQuestions))
      const prompts = questions.map((question) => question.authoring?.prompt.es ?? question.promptMarkdown)
      const deliberate = authoring.deliberatePractice
      const phases = new Set(deliberate?.attempts.map(({ phase }) => phase) ?? [])
      const checks = {
        theoryDepth: theoryWords >= 600,
        theoryFirst: lesson.authoring?.studyContract?.sequence === 'theory-first'
          && lesson.authoring.studyContract.practiceUnlock === 'after-required-reading',
        workedExample: Boolean(deliberate?.workedExample.steps.length >= 3),
        deliberateContract: Boolean(deliberate),
        guidanceFades: phases.has('guided') && phases.has('faded') && phases.has('independent') && phases.has('transfer'),
        specificQuestion: prompts.length > 0 && prompts.every((prompt) => !genericPrompt.test(prompt)),
        activeResponse: questions.some(({ responseKind }) => responseKind !== 'single-choice'),
        sourceAndLimit: authoring.sourceIds.length > 0 && authoring.fidelity.limitations.length > 0,
        causalFeedback: Boolean(authoring.feedbackContract?.causalQuestion.es && authoring.feedbackContract.nextObservation.es),
        accessibleRestore: activityScenes.length > 0 && activityScenes.every((scene) =>
          scene.restorePreviousState && Boolean(scene.accessibility?.textualAlternative || scene.storyboard?.accessibility)),
      }
      const passed = Object.values(checks).filter(Boolean).length
      rows.push({
        packageId: manifest.id,
        packageVersion: manifest.packageVersion,
        routeIds: activityRoutes.get(activityId) ?? [],
        lessonId,
        activityId,
        title: authoring.title.es,
        theoryWords,
        assessmentIntent: authoring.pedagogicalContract?.assessmentIntent ?? 'undeclared',
        evidenceLevel: authoring.pedagogicalContract?.evidenceLevel ?? 'undeclared',
        responseKinds: [...new Set(questions.map(({ responseKind }) => responseKind))],
        score: passed,
        maximumScore: Object.keys(checks).length,
        checks,
      })
    }
  }
}

rows.sort((left, right) => left.routeIds.join().localeCompare(right.routeIds.join())
  || left.lessonId.localeCompare(right.lessonId)
  || left.activityId.localeCompare(right.activityId))

const failures = rows.filter(({ score, maximumScore }) => score !== maximumScore)
const byPackage = Object.values(rows.reduce((groups, row) => {
  const group = groups[row.packageId] ?? {
    packageId: row.packageId,
    activities: 0,
    lessons: 0,
    minimumTheoryWords: Number.POSITIVE_INFINITY,
    averageTheoryWords: 0,
    totalTheoryWords: 0,
    passed: 0,
  }
  group.activities += 1
  if (row.score === row.maximumScore) group.passed += 1
  groups[row.packageId] = group
  return groups
}, {}))
for (const lesson of lessonRows) {
  const group = byPackage.find(({ packageId }) => packageId === lesson.packageId)
  group.lessons += 1
  group.minimumTheoryWords = Math.min(group.minimumTheoryWords, lesson.theoryWords)
  group.totalTheoryWords += lesson.theoryWords
}
const packageSummaries = byPackage.map((group) => ({
  ...group,
  averageTheoryWords: Math.round(group.totalTheoryWords / group.lessons),
})).sort((left, right) => left.packageId.localeCompare(right.packageId))

const report = {
  schema: 'wplab-academy-depth-audit-v1',
  generatedAt: new Date().toISOString(),
  scope: {
    routes: routeIds.size,
    lessons: lessonIds.size,
    activities: rows.length,
    excludesDemoRoutes: true,
  },
  thresholds: {
    minimumTheoryWordsPerLesson: 600,
    requiredPracticePhases: ['guided', 'faded', 'independent', 'transfer'],
    requiredActivityChecks: 10,
  },
  result: failures.length === 0 ? 'pass' : 'fail',
  failures: failures.map(({ activityId, checks }) => ({
    activityId,
    failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name),
  })),
  packages: packageSummaries,
  activities: rows,
}

const outputRoot = join(root, 'docs', 'generated')
await mkdir(outputRoot, { recursive: true })
await writeFile(join(outputRoot, 'APRENDER-ACADEMIA-P1-AUDITORIA.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const packageTable = packageSummaries.map((group) =>
  `| ${group.packageId} | ${group.lessons} | ${group.activities} | ${group.minimumTheoryWords} | ${group.averageTheoryWords} | ${group.passed}/${group.activities} |`).join('\n')
const failureLines = failures.length === 0
  ? `Ninguna. Las ${rows.length} actividades cumplen los diez controles.`
  : failures.map(({ activityId, checks }) =>
      `- \`${activityId}\`: ${Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name).join(', ')}`).join('\n')
const markdown = `# Auditoría reproducible de profundidad P1

Generada: ${report.generatedAt}  
Resultado: **${report.result === 'pass' ? 'CORRECTO' : 'FALLIDO'}**

## Alcance real

- ${routeIds.size} rutas visibles para el estudiante;
- ${lessonIds.size} lecciones;
- ${rows.length} actividades;
- rutas internas de QA excluidas del cómputo.

## Controles por actividad

Cada actividad debe obtener 10/10: teoría de al menos 600 palabras en su lección; puerta theory-first; ejemplo resuelto; contrato de práctica deliberada; retirada guided → faded → independent → transfer; pregunta específica; respuesta activa —orden, comparación, selección múltiple o explicación—; fuentes y límites; feedback causal; alternativa accesible y restauración.

| Paquete | Lecciones | Actividades | Mínimo de palabras | Media por lección | 10/10 |
|---|---:|---:|---:|---:|---:|
${packageTable}

## Fallos

${failureLines}

## Interpretación

Este informe comprueba cobertura declarativa y evita regresiones editoriales. No demuestra por sí mismo exactitud relojera, eficacia con alumnado real, retención, transferencia ni destreza física; esas validaciones requieren revisión y evidencia independientes.
`
await writeFile(join(outputRoot, 'APRENDER-ACADEMIA-P1-AUDITORIA.md'), markdown, 'utf8')

if (rows.length !== 289 || lessonIds.size !== 222 || routeIds.size !== 24) {
  throw new Error(`Alcance inesperado: ${routeIds.size} rutas, ${lessonIds.size} lecciones y ${rows.length} actividades.`)
}
if (failures.length > 0) throw new Error(`${failures.length} actividades no superan la auditoría P1.`)

console.log(`Auditoría Academia P1: ${routeIds.size} rutas, ${lessonIds.size} lecciones y ${rows.length} actividades · ${rows.length * 10}/${rows.length * 10} controles correctos.`)
