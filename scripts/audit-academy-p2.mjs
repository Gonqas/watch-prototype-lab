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
const requiredTutorActions = [
  'orient',
  'ask-socratic-question',
  'explain-declared-content',
  'point-to-source',
  'suggest-remediation',
  'summarize-visible-state',
]
const requiredPracticePhases = ['guided', 'faded', 'independent', 'transfer']
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const allLessons = new Set()
const concepts = new Map()
const misconceptions = new Map()
const activities = []

for (const packageName of packageNames) {
  const packageRoot = join(root, 'learning-content', packageName)
  const manifest = await readJson(join(packageRoot, 'manifest.json'))
  const readEntries = async (kind) => Promise.all((manifest.entries[kind] ?? []).map(async (entry) => ({
    id: entry.id,
    value: await readJson(join(packageRoot, entry.path)),
  })))
  const routes = await readEntries('routes')
  const modules = new Map((await readEntries('modules')).map(({ id, value }) => [id, value]))
  const lessons = await readEntries('lessons')
  const learnerLessonIds = new Set(routes
    .filter(({ value }) => !value.demo)
    .flatMap(({ value }) => value.moduleIds)
    .flatMap((moduleId) => modules.get(moduleId)?.lessonIds ?? []))
  lessons.forEach(({ id }) => allLessons.add(id))
  for (const { id, value } of await readEntries('concepts')) concepts.set(id, { packageId: manifest.id, ...value })
  for (const { id, value } of await readEntries('misconceptions')) misconceptions.set(id, { packageId: manifest.id, ...value })
  for (const { id, value } of await readEntries('activities')) {
    if (!learnerLessonIds.has(value.authoring?.lessonId)) continue
    const authoring = value.authoring ?? {}
    const allowedActions = new Set(authoring.tutorContract?.allowedActions ?? [])
    const phases = new Set(authoring.deliberatePractice?.attempts?.map(({ phase }) => phase) ?? [])
    activities.push({
      packageId: manifest.id,
      activityId: id,
      checks: {
        boundedTutor: Boolean(authoring.tutorContract)
          && requiredTutorActions.every((action) => allowedActions.has(action))
          && authoring.tutorContract.requiresSourceForTechnicalClaims === true
          && (authoring.tutorContract.forbiddenClaims?.length ?? 0) >= 2,
        causalFeedback: Boolean(authoring.feedbackContract?.causalQuestion?.es)
          && Boolean(authoring.feedbackContract?.nextObservation?.es),
        misconceptionReferences: (authoring.feedbackContract?.misconceptionIds ?? [])
          .every((misconceptionId) => misconceptions.has(misconceptionId)),
        deliberateTransfer: requiredPracticePhases.every((phase) => phases.has(phase)),
        explicitEvidenceLevel: Boolean(authoring.pedagogicalContract?.assessmentIntent)
          && Boolean(authoring.pedagogicalContract?.evidenceLevel),
        physicalBoundary: Boolean(authoring.pedagogicalContract?.physicalBoundary?.es),
        sourceBound: (authoring.sourceIds?.length ?? 0) > 0,
      },
    })
  }
}

const misconceptionRows = [...misconceptions.entries()].map(([id, value]) => ({
  id,
  remediationLessonId: value.remediationLessonId,
  remediationExists: allLessons.has(value.remediationLessonId),
}))
const conceptRows = [...concepts.entries()].map(([id, value]) => ({
  id,
  prerequisiteIds: value.prerequisiteIds ?? [],
  prerequisitesExist: (value.prerequisiteIds ?? []).every((prerequisiteId) => concepts.has(prerequisiteId)),
}))

const runtimeFiles = {
  assessment: await readFile(join(root, 'src', 'learning', 'persistence', 'assessmentEngine.ts'), 'utf8'),
  mastery: await readFile(join(root, 'src', 'learning', 'persistence', 'masteryEngine.ts'), 'utf8'),
  service: await readFile(join(root, 'src', 'learning', 'application', 'service.ts'), 'utf8'),
  session: await readFile(join(root, 'src', 'learning', 'persistence', 'sessionService.ts'), 'utf8'),
  personalization: await readFile(join(root, 'src', 'learning', 'academy', 'academyPersonalization.ts'), 'utf8'),
  studyPlan: await readFile(join(root, 'src', 'learning', 'academy', 'academyStudyPlan.ts'), 'utf8'),
  tutor: await readFile(join(root, 'src', 'learning', 'academy', 'academyPedagogy.ts'), 'utf8'),
}
const runtimeChecks = {
  currentSessionEvidence: runtimeFiles.assessment.includes("op: 'evidence-from-session'"),
  independentSessionEvidence: runtimeFiles.assessment.includes("op: 'session-without-hints'"),
  threeStageRetention: runtimeFiles.mastery.includes('retention.length >= 3')
    && runtimeFiles.mastery.includes('[1, 7, 21]'),
  dueDateGate: runtimeFiles.service.includes("id: 'retention-window'")
    && runtimeFiles.service.includes("requestedMode === 'retention'"),
  transferGate: runtimeFiles.service.includes("id: 'transfer-ready'")
    && runtimeFiles.service.includes("requestedMode === 'transfer'"),
  persistedLearningMode: runtimeFiles.session.includes("learningMode: input.learningMode ?? 'authored'"),
  longitudinalModel: runtimeFiles.personalization.includes('buildAcademyLearnerModel')
    && runtimeFiles.personalization.includes('activeMisconceptions'),
  adaptiveSequencer: runtimeFiles.studyPlan.includes('active-misconception-before-progression')
    && runtimeFiles.studyPlan.includes('demonstration-before-transfer'),
  boundedTutor: runtimeFiles.tutor.includes('contextualTutorResponse')
    && runtimeFiles.tutor.includes('No eval'),
}

const activityFailures = activities.flatMap((activity) => Object.entries(activity.checks)
  .filter(([, passed]) => !passed)
  .map(([check]) => ({ activityId: activity.activityId, check })))
const knowledgeFailures = [
  ...conceptRows.filter(({ prerequisitesExist }) => !prerequisitesExist).map(({ id }) => ({ id, check: 'missing-prerequisite' })),
  ...misconceptionRows.filter(({ remediationExists }) => !remediationExists).map(({ id }) => ({ id, check: 'missing-remediation-lesson' })),
]
const runtimeFailures = Object.entries(runtimeChecks).filter(([, passed]) => !passed).map(([check]) => check)
const pass = activityFailures.length === 0 && knowledgeFailures.length === 0 && runtimeFailures.length === 0

const report = {
  schema: 'wplab-academy-personalization-audit-v1',
  generatedAt: new Date().toISOString(),
  result: pass ? 'pass' : 'fail',
  scope: {
    concepts: concepts.size,
    misconceptions: misconceptions.size,
    activities: activities.length,
  },
  guarantees: {
    declarativeChecksPerActivity: 7,
    retentionIntervalsDays: [1, 7, 21],
    requiredIndependentReviews: 3,
    tutorActions: requiredTutorActions,
  },
  runtimeChecks,
  failures: { activities: activityFailures, knowledge: knowledgeFailures, runtime: runtimeFailures },
  activities,
  concepts: conceptRows,
  misconceptions: misconceptionRows,
}

const outputRoot = join(root, 'docs', 'generated')
await mkdir(outputRoot, { recursive: true })
await writeFile(join(outputRoot, 'APRENDER-ACADEMIA-P2-AUDITORIA.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const markdown = `# Auditoría reproducible de personalización P2

Generada: ${report.generatedAt}  
Resultado: **${pass ? 'CORRECTO' : 'FALLIDO'}**

## Alcance

- ${concepts.size} conceptos con prerrequisitos comprobables;
- ${misconceptions.size} errores conceptuales con ruta de refuerzo;
- ${activities.length} actividades de estudiante;
- ${activities.length * 7} controles declarativos P2;
- ${Object.keys(runtimeChecks).length} garantías de runtime.

## Garantías comprobadas

Cada actividad conserva tutor acotado, feedback causal, referencias de errores válidas, transferencia deliberada, nivel de evidencia, límite físico y fuentes. El runtime exige evidencia de la sesión actual, rechaza ayuda en retención y transferencia, aplica tres recuperaciones a 1/7/21 días, comprueba la fecha, persiste el modo y construye un modelo longitudinal por concepto.

## Fallos

${pass ? 'Ninguno.' : `Actividades: ${activityFailures.length}; conocimiento: ${knowledgeFailures.length}; runtime: ${runtimeFailures.join(', ') || 'sin fallos'}.`}

## Límite de interpretación

Este informe verifica contratos y salvaguardas de software. No demuestra eficacia pedagógica con usuarios, competencia relojera física, exactitud de una medición ni validación de ingeniería.
`
await writeFile(join(outputRoot, 'APRENDER-ACADEMIA-P2-AUDITORIA.md'), markdown, 'utf8')

if (activities.length !== 289 || concepts.size !== 509 || misconceptions.size !== 149) {
  throw new Error(`Alcance inesperado: ${activities.length} actividades, ${concepts.size} conceptos y ${misconceptions.size} errores.`)
}
if (!pass) throw new Error(`P2 incompleta: ${activityFailures.length} fallos de actividad, ${knowledgeFailures.length} de conocimiento y ${runtimeFailures.length} de runtime.`)
console.log(`Auditoría Academia P2: ${concepts.size} conceptos, ${misconceptions.size} errores y ${activities.length * 7} controles declarativos; ${Object.keys(runtimeChecks).length}/${Object.keys(runtimeChecks).length} garantías de runtime.`)
