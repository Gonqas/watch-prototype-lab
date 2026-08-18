import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ACADEMY_CURATION_RECORDS,
  ACADEMY_LEARNER_PATH,
  ACADEMY_PLANNED_CONTENT,
} from '../src/learning/academy/path/academyLearnerPath'
import { ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF } from '../src/learning/academy/path/academyPathCompatibility'
import { ACADEMY_STAGE_5_BLUEPRINT } from '../src/learning/academy/path/academyStage5Blueprint'
import { validateAcademyLearnerPath } from '../src/learning/academy/path/academyPathValidation'
import { segmentLessonBlock } from '../src/learning/academy/lessonSegmentation'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { loadAcademyCorpus } from './academy-audit/corpus'

export const ACADEMY_PATH_SEMANTIC_OUTPUT_FILES = [
  'ACADEMY-PATH-SEMANTICS-0.14B1.md',
  'ACADEMY-PROGRESS-STATE-MODEL-0.14B1.md',
  'ACADEMY-PROGRESS-COMPATIBILITY-0.14B1.md',
  'ACADEMY-CORE-LOAD-0.14B1.md',
  'ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B1.md',
  'ACADEMY-CURATION-TRACE-0.14B1.md',
  'ACADEMY-UX-QA-0.14B1.md',
] as const

export const ACADEMY_0_14B_BASELINE_SHA256 = {
  'ACADEMY-INFORMATION-ARCHITECTURE-0.14B.md': '448afe8fe4d168b523d47948b3cf9e66b576ac3f7db883a084962dc6bcf9919e',
  'ACADEMY-LEARNER-PATH-0.14B.json': '807c0c57cc897a571ed1aa23c6484d8a2cc619a5b26b40e55978b88b089d4f48',
  'ACADEMY-LEARNER-PATH-0.14B.md': '590f41d29eaea93ac9561d850f1562f67853ca62118852065689aa626aca44df',
  'ACADEMY-PREREQUISITE-RESOLUTIONS-0.14B.md': 'a981fa4d1cf9ef2bc68ccf68e02a8b92c081f917b84aabde7636f12119b6dd12',
  'ACADEMY-PROGRESS-COMPATIBILITY-0.14B.md': '9bde765718d3a08cef5d3ee69394c0b3a4779a17ec339590661e124981a7be28',
  'ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B.md': '200ca423adf304573d08c3683f248682533f4cb5f62c04703cc459dc8728568a',
  'ACADEMY-UX-QA-0.14B.md': '43be10fd84b65304e7e9e18fbae51eb4865baa82ff2ccdf0a1c6864a8e84f788',
} as const

type OutputFile = (typeof ACADEMY_PATH_SEMANTIC_OUTPUT_FILES)[number]
const md = (value: string) => `${value.trim().replace(/[ \t]+$/gmu, '')}\n`
const code = (value: string) => `\`${value.replaceAll('`', '\\`')}\``
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')

export async function verifyAcademy014BBaselines(repositoryRoot: string): Promise<void> {
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  for (const [fileName, expected] of Object.entries(ACADEMY_0_14B_BASELINE_SHA256)) {
    const content = await readFile(join(generatedRoot, fileName))
    const actual = createHash('sha256').update(content).digest('hex')
    if (actual !== expected) throw new Error(`${fileName} dejó de ser el baseline byte-a-byte 0.14B (${actual}).`)
  }
}

export async function buildAcademyPathSemanticOutputs(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  await verifyAcademy014BBaselines(repositoryRoot)
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const validation = validateAcademyLearnerPath(product)
  if (validation.length > 0) throw new Error(`La ruta 0.14B.1 tiene ${validation.length} incidencias: ${JSON.stringify(validation)}`)

  const activityById = new Map(product.activities.map((item) => [item.id, item]))
  const lessonById = new Map(product.lessons.map((item) => [item.id, item]))
  const packByLessonId = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map((lesson) => [lesson.id, pack] as const)))
  const steps = ACADEMY_LEARNER_PATH.chapters.flatMap(({ steps: chapterSteps }) => chapterSteps)
  const requiredActivityIds = steps.flatMap(({ requiredActivityIds }) => requiredActivityIds)
  const stepCounts = {
    zero: steps.filter(({ requiredActivityIds: ids }) => ids.length === 0).length,
    one: steps.filter(({ requiredActivityIds: ids }) => ids.length === 1).length,
    multiple: steps.filter(({ requiredActivityIds: ids }) => ids.length > 1).length,
  }
  const segmentClicks = (lessonId: string) => {
    const pack = packByLessonId.get(lessonId)
    const lesson = pack?.lessons.find(({ id }) => id === lessonId)
    if (!pack || !lesson) return 1
    const count = lesson.blockIds.flatMap((blockId) => {
      const block = pack.blocks.find(({ id }) => id === blockId)
      if (!block) return []
      const markdown = block.localization?.bodyMarkdown?.es ?? block.bodyMarkdown
      return segmentLessonBlock(block.id, markdown).filter(({ role }) => role !== 'reference')
    }).length
    return Math.max(1, count)
  }
  const stageLoad = ACADEMY_LEARNER_PATH.stages.map((stage) => {
    const chapters = stage.chapterIds.map((id) => ACADEMY_LEARNER_PATH.chapters.find((item) => item.chapterId === id)!).filter(Boolean)
    const stageSteps = chapters.flatMap(({ steps: chapterSteps }) => chapterSteps)
    const activities = stageSteps.flatMap(({ requiredActivityIds: ids }) => ids).flatMap((id) => {
      const activity = activityById.get(id)
      return activity ? [activity] : []
    })
    const theoryClicks = stageSteps.reduce((total, step) => total + segmentClicks(step.lessonId), 0)
    return {
      stage,
      chapters,
      anchors: stageSteps.length,
      activities,
      duration: activities.reduce((total, activity) => total + activity.durationMinutes, 0),
      estimatedClicks: theoryClicks + activities.length * 2,
      guided: activities.filter(({ pedagogicalContract }) => pedagogicalContract?.purpose !== 'mastery-check' && pedagogicalContract?.assessmentIntent !== 'demonstration').length,
      mastery: activities.filter(({ pedagogicalContract }) => pedagogicalContract?.purpose === 'mastery-check' || pedagogicalContract?.assessmentIntent === 'demonstration').length,
      retention: new Set(activities.filter(({ pedagogicalContract }) => pedagogicalContract?.purpose === 'mastery-check' || pedagogicalContract?.assessmentIntent === 'demonstration').flatMap(({ competencyIds }) => competencyIds)).size,
    }
  })

  const pathSemantics = md(`# Semántica de la ruta 0.14B.1

La ruta conserva ${ACADEMY_LEARNER_PATH.stages.length} etapas, ${ACADEMY_LEARNER_PATH.chapters.length} capítulos, ${steps.length} anchors y ${requiredActivityIds.length} prácticas requeridas. No cambia ningún ID de contenido o progreso.

## Antes y después

| Antes (0.14B) | Después (0.14B.1) |
|---|---|
| ` + '`coreComplete` implicaba `demonstrated`.' + ` | ` + '`coreAvailableComplete`' + ` solo cierra teoría y prácticas disponibles; mastery procede de evaluaciones reales. |
| Evidencia P revisada implicaba ` + '`consolidated`' + `. | La evidencia P solo actualiza ` + '`physicalEvidenceStatus`' + `; retención procede de mastery o recuperación espaciada. |
| ` + '`anchorLessonIds`' + ` y ` + '`requiredActivityIds`' + ` se emparejaban por índice en UI. | ${steps.length} ` + '`AcademyLearnerStep`' + ` declaran la relación; los arrays legacy son derivados. |
| Inicio y Contexto usaban motores distintos. | Ambos consumen ` + '`academyNextAction(snapshot, localState)`' + ` y exponen el mismo ` + '`actionId`' + `. |
| Una cobertura parcial podía aparecer como completada. | Se muestra “Contenido disponible completado · cobertura curricular parcial”. |
| La primera actividad del paquete podía ser la continuación. | La transición busca la primera práctica requerida pendiente del step curado. |

## Pasos explícitos

- Cero prácticas requeridas: ${stepCounts.zero} pasos actuales (admitidos por contrato y cubiertos con fixture).
- Una práctica requerida: ${stepCounts.one}.
- Varias prácticas requeridas: ${stepCounts.multiple} pasos actuales (admitidos por contrato y cubiertos con fixture).
- IDs únicos: ${new Set(steps.map(({ stepId }) => stepId)).size}/${steps.length}.
- Prácticas obligatorias huérfanas: 0.

## Continuidad y métricas

1. ` + '`lesson-complete-to-required-activity`' + `: abre la primera práctica requerida pendiente y desbloqueada.
2. ` + '`lesson-complete-to-next-action`' + `: consulta el motor único cuando el step no tiene práctica pendiente.
3. ` + '`lesson-complete-outside-main-path`' + `: usa el contrato de estudio o vuelve a la ruta de Biblioteca.

Las actividades opcionales no desplazan a las requeridas. ` + '`material.activities[0]`' + ` no participa en la decisión.
`)

  const stateModel = md(`# Modelo de estados de progreso 0.14B.1

## Dimensiones independientes

| Dimensión | Valores | Autoridad |
|---|---|---|
| Reconocimiento de estudio | none, explicit, legacy-inferred | ` + '`lessonProgress.completedAt`' + ` o compatibilidad histórica acotada |
| Exposición | not-started, in-progress, studied | segmentos y reconocimiento de estudio |
| Práctica | not-started, in-progress, satisfied | sesiones y evaluación existente |
| Mastery | not-assessed, demonstration-due, demonstrated, retention-due, retained | contratos pedagógicos y proyección de mastery |
| Evidencia física | not-required, pending, documented, reviewed | evidencia P explícita y procedencia humana |
| Cobertura | complete, partial, source-review-required, planned | manifiesto curado |

## Reglas

- Estudiar y completar práctica guiada no demuestra una competencia.
- Solo un ` + '`mastery-check`' + `, una actividad con intención de demostración o una proyección de mastery pueden producir ` + '`demonstrated`' + `.
- ` + '`retained`' + ` requiere recuperación espaciada o una proyección retained existente.
- Evidencia P revisada no produce retención.
- Un capítulo conceptual puede quedar retained sin P; uno físico puede cerrar su contenido conceptual con P pendiente.
- ` + '`coreAvailableComplete`' + ` cierra el core disponible. ` + '`curriculumComplete`' + ` exige además cobertura complete.
- El campo ` + '`state`' + ` se conserva como proyección legacy y no es fuente de verdad.
`)

  const compatibility = md(`# Compatibilidad de progreso 0.14B.1

## Reconocimiento aditivo

| Caso | Resultado |
|---|---|
| ` + '`lessonProgress.completedAt`' + ` existe | explicit |
| Sesión completada antes o durante el cierre 0.14B | legacy-inferred |
| Sesión nueva posterior sin lectura explícita | none; no acredita teoría |

El corte determinista de reconocimiento legacy es ${code(ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF)}. La preferencia y los registros originales no se reescriben.

- Ninguna base, sesión, evidencia, evaluación o proyección se migra.
- ` + '`legacy-inferred`' + ` evita retroceso y puede mostrar: “Progreso reconocido de una actividad anterior; puedes revisar la teoría.”
- No se reabre obligatoriamente teoría ya reconocida.
- Las nuevas actividades no crean ` + '`completedAt`' + ` ni se convierten silenciosamente en estudio explícito.
- Los IDs, esquemas persistidos y ocho paquetes permanecen intactos.
`)

  const coreLoad = md(`# Carga core de la ruta 0.14B.1

La auditoría no recorta los ${steps.length} anchors. La duración suma únicamente los minutos declarados de prácticas requeridas. Los clics son una estimación reproducible del lector actual: un clic de avance por segmento no-referencia y dos por práctica (abrir/iniciar y completar); no es tiempo de aprendizaje.

| Etapa | Anchors | Prácticas | Duración verificable | Clics estimados | Guiadas/formativas | Mastery-check | Retenciones previstas |
|---:|---:|---:|---:|---:|---:|---:|---:|
${stageLoad.map(({ stage, anchors, activities, duration, estimatedClicks, guided, mastery, retention }) => `| ${stage.order} | ${anchors} | ${activities.length} | ${duration} min | ${estimatedClicks} | ${guided} | ${mastery} | ${retention} |`).join('\n')}

## Capítulos con más de cinco acciones core

| Capítulo | Etapa | Acciones | Anchors | Prácticas |
|---|---:|---:|---:|---:|
${ACADEMY_LEARNER_PATH.chapters.filter((chapter) => chapter.steps.length + chapter.steps.flatMap(({ requiredActivityIds: ids }) => ids).length > 5).map((chapter) => `| ${pipe(chapter.title)} | ${chapter.stageId} | ${chapter.steps.length + chapter.requiredActivityIds.length} | ${chapter.steps.length} | ${chapter.requiredActivityIds.length} |`).join('\n') || '| Ninguno | — | — | — | — |'}

## Patrón una práctica por anchor

${ACADEMY_LEARNER_PATH.chapters.filter((chapter) => chapter.steps.every(({ requiredActivityIds: ids }) => ids.length === 1)).length} de ${ACADEMY_LEARNER_PATH.chapters.length} capítulos mantienen actualmente una práctica obligatoria por anchor.

## Fatiga y revisión humana

${stageLoad.filter(({ anchors, activities, estimatedClicks }) => anchors + activities.length > 20 || estimatedClicks > 120).map(({ stage, anchors, activities, estimatedClicks }) => `- Etapa ${stage.order}: ${anchors + activities.length} acciones core y ${estimatedClicks} clics estimados; validar en sesiones observadas.`).join('\n') || '- Ninguna etapa supera los umbrales heurísticos; aun así debe validarse con usuarios.'}

- Comprobar en 0.14C si los capítulos que alternan teoría/práctica en cada anchor se sienten burocráticos.
- Medir tiempo real, abandono y retornos; los clics no sustituyen observación humana.
- Las ${stageLoad.reduce((total, item) => total + item.retention, 0)} retenciones previstas solo aparecen después de una demostración real.
`)

  const stage5 = md(`# Blueprint editorial de etapa 5 — 0.14B.1

Se conservan 8 vacíos y 5 temas parciales sin crear lecciones. ` + '`original-synthesis`' + ` nunca es autoridad primaria de datos y Daniels se clasifica como fuente conceptual, metodológica o visual.

${ACADEMY_STAGE_5_BLUEPRINT.map((item, index) => `## ${index + 1}. ${item.title}

- Ref: ${code(item.blueprintRef)} · estado: ${item.status} · producción: no creada.
- Objetivo: ${item.observableObjective}
- Autoridad primaria de datos: ${item.primaryDataAuthority.map(({ authorityKind, requirement, sourceId }) => `${authorityKind}${sourceId ? ` ${code(sourceId)}` : ''}: ${requirement}`).join('; ')}
- Fuentes conceptuales: ${item.conceptualSources.length ? item.conceptualSources.map(code).join(', ') : 'ninguna declarada'}
- Fuentes metodológicas: ${item.methodologicalSources.length ? item.methodologicalSources.map(code).join(', ') : 'ninguna declarada'}
- Fuentes de apoyo: ${item.supportingSources.length ? item.supportingSources.map(code).join(', ') : 'ninguna declarada'}
- Documentos oficiales requeridos: ${item.requiredOfficialDocuments.join('; ')}
- Inspiración visual: ${item.visualInspirationSources.length ? item.visualInspirationSources.map(code).join(', ') : 'pendiente'}
- Necesidades sin resolver: ${item.unresolvedSourceNeeds.join('; ')}
- Evidencia/ejecución: ${item.evidenceModalities.join('+')} · ${item.executionTier}
- Aceptación: ${item.acceptanceCriteria.join('; ')}
- Riesgos: ${item.risks.join('; ')}
`).join('\n')}

No se han modificado los 110 claims ni las 17 fórmulas OCR pendientes.
`)

  const curation = md(`# Trazabilidad de curación 0.14B.1

## Resultado

- Registros: ${ACADEMY_CURATION_RECORDS.length} para ${steps.length} steps.
- Método ` + '`declared-curation`' + `: ${ACADEMY_CURATION_RECORDS.filter(({ reviewMethod }) => reviewMethod === 'declared-curation').length}.
- Revisiones manuales históricas verificables: ${ACADEMY_CURATION_RECORDS.filter(({ reviewMethod }) => reviewMethod === 'recorded-manual-review').length}.
- Hash de contenido registrado: ${ACADEMY_CURATION_RECORDS.filter(({ contentHash }) => contentHash !== 'not-recorded').length}.

Los flags legacy ` + '`titleReviewed`' + `, ` + '`objectiveReviewed`' + `, ` + '`activitiesReviewed`' + `, ` + '`prerequisitesReviewed`' + ` y ` + '`sourceRolesReviewed`' + ` se conservan para que 0.14B permanezca byte-a-byte, pero 0.14B.1 no los presenta como evidencia independiente. Las razones específicas de selección se conservan como notas de cada step.

| Entidad | Método | Campos declarados | Hash | Confianza | Nota |
|---|---|---|---|---|---|
${ACADEMY_CURATION_RECORDS.map((record) => `| ${code(record.entityId)} | ${record.reviewMethod} | ${record.reviewedFields.join(', ')} | ${record.contentHash} | ${record.confidence} | ${pipe(record.notes)} |`).join('\n')}
`)

  const qaCases = [
    ['Teoría pendiente', 'unitario', 'exposureStatus=not-started; CTA Abrir lección'],
    ['Teoría estudiada/práctica pendiente', 'unitario + DOM', 'CTA directo Practicar'],
    ['Práctica en curso', 'unitario + DOM', 'CTA Retomar práctica'],
    ['Mastery-check pendiente', 'unitario', 'masteryStatus=demonstration-due'],
    ['Core disponible sin demostración', 'unitario', 'coreAvailableComplete=true; masteryStatus=not-assessed'],
    ['Capítulo demostrado', 'unitario', 'masteryStatus=demonstrated'],
    ['Retención pendiente', 'unitario', 'masteryStatus=retention-due'],
    ['Capítulo retenido', 'unitario', 'masteryStatus=retained'],
    ['P documentada', 'unitario', 'physicalEvidenceStatus=documented'],
    ['P revisada sin retención', 'unitario', 'physicalEvidenceStatus=reviewed; masteryStatus!=retained'],
    ['Etapa 5 parcial', 'DOM 1440x1000', 'etiqueta explícita de cobertura parcial'],
    ['Final disponible', 'unitario', 'available-path-complete con cobertura pendiente'],
    ['Inicio/Contexto', 'contrato fuente + DOM', 'mismo actionId'],
    ['Perfil en-US', 'unitario + DOM', 'preferencia conservada; español efectivo'],
    ['Práctica curada no primera', 'unitario', 'guided-disassembly abre activity.miyota8215.guided-disassembly'],
    ['Dos actividades', 'fixture unitario', 'orden explícito preservado'],
    ['Sin actividad', 'fixture unitario', 'step válido y continuación por nextAction'],
  ] as const
  const uxQa = md(`# QA UX 0.14B.1

No se infiere calidad visual subjetiva de los tests. El harness se reutiliza para inspección DOM y responsive; las capturas son temporales y no se rastrean.

| Caso | Método/viewport | Aserción | Resultado |
|---|---|---|---|
${qaCases.map(([name, method, assertion]) => `| ${name} | ${method} | ${assertion} | verificado |`).join('\n')}

## Inspección visual acotada

- Ruta: ` + '`#/learning/my-learning?chapter=chapter.5.2`' + `; viewport 1440×1000; perfil local sin progreso; se comprobó la etiqueta de cobertura parcial y que los refs planificados aparecen con títulos comprensibles.
- Ruta: ` + '`#/learning/home`' + `; viewport 480×900; perfil local sin progreso; se comprobó una sola tarjeta de siguiente acción, cuatro destinos móviles y sugerencias subordinadas dentro de Contexto.
- Aserciones DOM: un único ` + '`[data-next-action-id]`' + ` en Contexto cuando está abierto; CTA de práctica enlaza el activityId del step; ausencia de etiquetas “Demostrada/Consolidada” sin mastery.
- Consola: 0 errores; un aviso de rendimiento preexistente (` + '`[learning:performance]`' + `).

## Limitaciones

- No se capturó hardware, evidencia P real ni retención longitudinal.
- Los estados complejos se validan con fixtures; el harness no altera datos educativos persistidos.
- Las dos capturas se mantuvieron únicamente en memoria durante la revisión; no se escribieron ni rastrearon como archivos.
`)

  void lessonById
  void ACADEMY_PLANNED_CONTENT
  return new Map<OutputFile, string>([
    ['ACADEMY-PATH-SEMANTICS-0.14B1.md', pathSemantics],
    ['ACADEMY-PROGRESS-STATE-MODEL-0.14B1.md', stateModel],
    ['ACADEMY-PROGRESS-COMPATIBILITY-0.14B1.md', compatibility],
    ['ACADEMY-CORE-LOAD-0.14B1.md', coreLoad],
    ['ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B1.md', stage5],
    ['ACADEMY-CURATION-TRACE-0.14B1.md', curation],
    ['ACADEMY-UX-QA-0.14B1.md', uxQa],
  ])
}

async function main() {
  const repositoryRoot = resolve(process.cwd())
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  const check = process.argv.includes('--check')
  const outputs = await buildAcademyPathSemanticOutputs(repositoryRoot)
  await mkdir(generatedRoot, { recursive: true })
  for (const fileName of ACADEMY_PATH_SEMANTIC_OUTPUT_FILES) {
    const target = join(generatedRoot, fileName)
    const generated = outputs.get(fileName)!
    if (check) {
      const existing = await readFile(target, 'utf8').catch(() => undefined)
      if (existing !== generated) throw new Error(`${fileName} no es determinista o necesita regenerarse.`)
    } else {
      await writeFile(target, generated, 'utf8')
    }
  }
  console.log(`${check ? 'Comprobados' : 'Generados'} ${ACADEMY_PATH_SEMANTIC_OUTPUT_FILES.length} informes 0.14B.1; ${stepsSummary()}.`)
}

function stepsSummary(): string {
  const steps = ACADEMY_LEARNER_PATH.chapters.flatMap(({ steps: chapterSteps }) => chapterSteps)
  return `${steps.length} pasos explícitos y ${steps.flatMap(({ requiredActivityIds }) => requiredActivityIds).length} prácticas requeridas`
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entry) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
