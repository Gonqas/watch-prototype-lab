import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { academyPathLocationForStepLesson } from '../src/learning/academy/path/academyLearnerPath'
import {
  ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS,
  ACADEMY_MIYOTA_FORBIDDEN_ROLES,
  ACADEMY_MIYOTA_REFERENCE_ROLES,
  ACADEMY_PERSONAL_3D_REVIEWS,
  ACADEMY_PERSONAL_CLAIM_REVIEWS,
  ACADEMY_PERSONAL_PILOT_REVIEWS,
  ACADEMY_PILOT_FORMULA_REVIEWS,
  academyPersonalPatchedSectionIds,
  academyPersonalVisualReviews,
} from '../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderDocument } from '../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { loadAcademyCorpus } from './academy-audit/corpus'
import { ACADEMY_014E_QA_CASES, ACADEMY_014E_SCREENSHOTS } from './academy-audit/academy-personal-curation-qa-snapshot'

export const ACADEMY_PERSONAL_CURATION_OUTPUT_FILES = [
  'ACADEMY-0.14E-SUMMARY.md',
  'ACADEMY-PILOT-REVIEW-0.14E.md',
  'ACADEMY-PILOT-REVIEW-0.14E.json',
  'ACADEMY-MIYOTA-REFERENCE-ROLE-0.14E.md',
  'ACADEMY-CRITICAL-HIGH-VISUALS-0.14E.md',
  'ACADEMY-CRITICAL-HIGH-VISUALS-0.14E.json',
  'ACADEMY-VISUAL-3D-REVIEW-0.14E.md',
  'ACADEMY-VISUAL-3D-REVIEW-0.14E.json',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14E.md',
  'ACADEMY-PERSONAL-STYLE-GUIDE-0.14E.md',
  'ACADEMY-UX-QA-0.14E.md',
  'ACADEMY-SCREENSHOT-INDEX-0.14E.md',
] as const

type OutputFile = (typeof ACADEMY_PERSONAL_CURATION_OUTPUT_FILES)[number]

export const ACADEMY_014E_BASELINE = {
  initialCommit: 'f2acf7f351bb8e7f4f9f1a7a6ee5f085792cb501',
  corpusDigest: '1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e',
  historicalReportCount: 67,
  historicalReportsDigest: '8c5ae7d7454c02a13dd49840c59e7f8a2c4cef9ee3041476dbf9ff618b5eddef',
  sections014d: 2_568,
  detailedPilots014d: 16,
  curatedSections014d: 254,
  visualDesigns014d: 32,
  diagrams014d: 23,
  states3d014d: 9,
  visualGaps014d: 138,
  criticalGaps014d: 2,
  highGaps014d: 7,
  ocrFormulaGaps014d: 17,
  broadClaimGaps014d: 110,
  stage5Gaps014d: 8,
} as const

const md = (value: string) => `${value.trim()}\n`
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

interface DocumentRecord {
  document: AcademyReaderDocument
  material: AcademyReaderBuildInput['material']
  title: string
}

function materialFor(
  pack: LearningPack,
  lessonId: string,
  product: ReturnType<typeof createLearningProductIndex>,
): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!lesson || !descriptor) throw new Error(`No se puede construir material para ${lessonId}.`)
  const blocks = pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
  const lessonMarkdown = blocks.map(({ bodyMarkdown }) => bodyMarkdown).join('\n')
  const sourceIds = new Set([
    ...(lesson.authoring?.sourceIds ?? []),
    ...blocks.flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id))),
  ])
  return {
    packageId: pack.manifest.id,
    packageVersion: pack.manifest.packageVersion,
    pack,
    lesson,
    blocks,
    activities: descriptor.activityIds.flatMap((activityId) => {
      const activity = product.activities.find(({ id }) => id === activityId)
      return activity ? [activity] : []
    }),
    sources: pack.sources.filter(({ id }) => sourceIds.has(id)),
    glossary: pack.glossary.filter(({ id }) => lessonMarkdown.includes(`{{term:${id}}}`)),
  }
}

async function assertHistoricalReports(repositoryRoot: string): Promise<void> {
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  const outputNames = new Set<string>(ACADEMY_PERSONAL_CURATION_OUTPUT_FILES)
  const fileNames = (await readdir(generatedRoot))
    .filter((fileName) => !outputNames.has(fileName) && !fileName.startsWith('APRENDER-'))
    .sort()
  if (fileNames.length !== ACADEMY_014E_BASELINE.historicalReportCount) {
    throw new Error(`El conjunto histórico de informes cambió: ${fileNames.length}/${ACADEMY_014E_BASELINE.historicalReportCount}.`)
  }
  const rows = await Promise.all(fileNames.map(async (fileName) => (
    `${fileName}:${sha256(await readFile(join(generatedRoot, fileName)))}`
  )))
  const digest = sha256(rows.join('\n'))
  if (digest !== ACADEMY_014E_BASELINE.historicalReportsDigest) {
    throw new Error(`Los informes 0.14A–0.14D ya no coinciden byte a byte (${digest}).`)
  }
}

function countBy<T>(values: readonly T[], select: (value: T) => string): Record<string, number> {
  return Object.fromEntries([...new Set(values.map(select))].sort().map((key) => [key, values.filter((value) => select(value) === key).length]))
}

function pilotMarkdown(records: DocumentRecord[]): string {
  const byId = new Map(records.map((record) => [record.document.lessonId, record]))
  return md(`# Academia · revisión de pilotos 0.14E

Las **16 lecciones** curadas en 0.14D se revisaron como un patrón personal en español. Se editaron **${ACADEMY_PERSONAL_PILOT_REVIEWS.reduce((total, review) => total + academyPersonalPatchedSectionIds(review.lessonId).length, 0)} apartados visibles** sin cambiar lessonId, blockId, activityId ni el contenido fuente almacenado en los ocho paquetes.

| Lección | Pregunta central | Apartados editados | Estado técnico | Resultado | Decisiones | Práctica |
| --- | --- | ---: | --- | --- | --- | --- |
${ACADEMY_PERSONAL_PILOT_REVIEWS.map((review) => {
    const title = byId.get(review.lessonId)?.title ?? review.lessonId
    return `| ${pipe(title)} | ${pipe(review.centralQuestion)} | ${academyPersonalPatchedSectionIds(review.lessonId).length} | ${review.technicalStatus} | ${review.result} | ${review.decisions.join('; ')} | ${pipe(review.practiceIntent)} |`
  }).join('\n')}

## Claims importantes

Se revisaron **${ACADEMY_PERSONAL_CLAIM_REVIEWS.length} claims** del alcance piloto y critical/high: ${Object.entries(countBy(ACADEMY_PERSONAL_CLAIM_REVIEWS, ({ decision }) => decision)).map(([decision, count]) => `${count} ${decision}`).join(', ')}. Ningún localizador de página, figura o tabla se inventó; los campos no verificados permanecen nulos o limitados.

## Fórmulas

Se revisaron **${ACADEMY_PILOT_FORMULA_REVIEWS.length} relaciones no derivadas de OCR** necesarias para los pilotos. Las **${ACADEMY_014E_BASELINE.ocrFormulaGaps014d} fórmulas OCR pendientes** no se elevaron a datos confirmados ni se resolvieron en masa.

## Resultado honesto

${ACADEMY_PERSONAL_PILOT_REVIEWS.filter(({ result }) => result === 'ready-but-user-review-pending').length} lecciones quedan listas para uso con revisión personal pendiente y ${ACADEMY_PERSONAL_PILOT_REVIEWS.filter(({ result }) => result === 'needs-source').length} conservan un bloqueo de fuente concreto. Codex no inventó ninguna valoración personal.`)
}

function miyotaMarkdown(): string {
  return md(`# MIYOTA como familia de referencia y laboratorio de aplicación · 0.14E

## Papel permitido

${ACADEMY_MIYOTA_REFERENCE_ROLES.map((role) => `- ${role}`).join('\n')}

## Papel excluido

${ACADEMY_MIYOTA_FORBIDDEN_ROLES.map((role) => `- ${role}`).join('\n')}

La teoría general se explica primero sin marca. MIYOTA 2035 permite transferir ese mapa a una arquitectura de cuarzo documentada; MIYOTA 8215 permite leer piezas, agrupaciones y relaciones estructurales de un automático real. Otros movimientos y fuentes existentes se conservan como comparaciones cuando son pedagógicamente útiles.

## Evidencia que aporta la documentación pública

La página oficial, la lista de piezas y la vista explosionada respaldan identidad, denominación, presencia, agrupación y posición relativa aproximada. No demuestran por sí solas orden completo de servicio, lubricación, tolerancias, holguras, desgaste, par de apriete ni criterio de aceptación.

Por ello, el “desmontaje guiado” del 8215 se presenta en 0.14E como lectura virtual de dependencias documentales. Su estado es needs-source; no prescribe una secuencia oficial y no produce evidencia P.

## Regla editorial

1. Principio general.
2. Esquema conceptual.
3. Vocabulario contextual.
4. Caso real cuando aporta transferencia.
5. Dato de calibre solo con documento aplicable.
6. Límite explícito entre lo universal y lo específico.

MIYOTA no bloquea el recorrido mecánico, no ocupa todas las lecciones y no se convierte en una arquitectura universal.`)
}

function targetsMarkdown(): string {
  return md(`# Visuales critical/high 0.14E

Se trataron exactamente los **2 gaps critical** y los **7 high** del informe 0.14D. No se rellenó ningún gap medium/low.

| Prioridad | Lección | Apartado | Diseño | Resultado | Pregunta | Limitaciones |
| --- | --- | --- | --- | --- | --- | --- |
${ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.map((target) => `| ${target.priority} | ${target.lessonId} | ${pipe(target.title)} | ${target.visualDesignId} | ${target.result} | ${pipe(target.pedagogicalQuestion)} | ${pipe(target.limitations.join(' '))} |`).join('\n')}

Los nueve resultados son diagramas causales originales y específicos. No contienen fotografías falsas, cantidades universales, productos químicos, secuencias de calibre ni tolerancias inventadas.`)
}

function visual3dMarkdown(): string {
  const visualReviews = academyPersonalVisualReviews()
  return md(`# Revisión de visuales y estados 3D 0.14E

## 32 diseños visuales existentes

| Decisión | Conteo |
| --- | ---: |
${Object.entries(countBy(visualReviews, ({ decision }) => decision)).map(([decision, count]) => `| ${decision} | ${count} |`).join('\n')}

| Diseño | Decisión | Motivo |
| --- | --- | --- |
${visualReviews.map((review) => `| ${review.visualDesignId} | ${review.decision} | ${pipe(review.reason)} |`).join('\n')}

## 9 estados 3D

| Estado | Decisión | Motivo |
| --- | --- | --- |
${ACADEMY_PERSONAL_3D_REVIEWS.map((review) => `| ${review.visualStateId} | ${review.decision} | ${pipe(review.reason)} |`).join('\n')}

Los dos estados conceptuales permanecen identificados como modelos. Los estados 8215 no afirman dimensiones, depthing, desgaste, holgura, lubricación ni secuencia oficial. El checkpoint del puente de barrilete queda source-needed y pierde la explosión procedural.`)
}

function queueMarkdown(records: DocumentRecord[]): string {
  const titles = new Map(records.map(({ document, title }) => [document.lessonId, title]))
  return md(`# Cola de revisión personal 0.14E

La cola pertenece únicamente al propietario. El estado inicial determinista es **not-reviewed** para las 16 lecciones; no se importan personas, sesiones humanas, aprobaciones ni certificaciones.

| Orden | Lección | Estado técnico | Estado personal | Resultado editorial |
| ---: | --- | --- | --- | --- |
${ACADEMY_PERSONAL_PILOT_REVIEWS.map((review, index) => `| ${index + 1} | ${pipe(titles.get(review.lessonId) ?? review.lessonId)} | ${review.technicalStatus} | not-reviewed | ${review.result} |`).join('\n')}

La pantalla permite marcar claridad, dificultad, carencia de explicación, ejemplo, visual, práctica o fuente y guardar una nota local. Un cambio de hash deja la revisión personal obsoleta. “Me resulta clara” nunca cambia el estado técnico ni acredita una práctica física.`)
}

function styleGuideMarkdown(): string {
  return md(`# Guía de estilo personal para 0.14F · derivada de 0.14E

## Explicar desde cero sin perder profundidad

1. Abrir con una pregunta concreta y explicar por qué aparece ahora.
2. Mostrar el sistema completo antes de acumular nombres.
3. Introducir vocabulario sobre la relación o pieza que el alumno está observando.
4. Explicar entrada, transformación, salida, restricciones y fallo antes de cuantificar.
5. Profundizar solo después con geometría, magnitudes, fórmulas, variantes y excepciones verificadas.
6. Cerrar con entre tres y siete ideas y un puente concreto hacia el siguiente problema.

## Elegir estructura por finalidad

- Mecanismo: problema → sistema → secuencia → causa → predicción.
- Anatomía: vista completa → localización → nombre → función → comparación.
- Banco: preparación → acción → control → parada → resultado.
- Diagnóstico: síntoma → hipótesis rivales → prueba discriminante → decisión.
- Medición: magnitud → referencia → instrumento → lectura → incertidumbre → decisión.
- Diseño: necesidad → restricciones → alternativas → interfaces → prueba.

No recuperar una plantilla universal, el corte de 210 palabras ni títulos “continuación”. La teoría puede ser extensa cuando cada apartado avanza la misma pregunta sin repetirla.

## Casos reales y MIYOTA

El caso real llega después del principio. Usar MIYOTA cuando su documentación permita identificar una arquitectura o dato concreto; usar otra familia cuando produzca una comparación mejor. Declarar siempre qué es universal, qué pertenece al calibre y qué sigue desconocido.

## Visuales

Cada visual responde una pregunta y cambia cuando cambia la idea. Diagrama para causalidad y decisión; 3D para apilamiento y relaciones espaciales; foto real para suciedad, desgaste, postura o acabado; animación solo para cambio de estado. Si falta la fotografía o la fuente, conservar el gap.

## Prácticas y evidencia

Evaluar la idea central. Una práctica digital usa K/V y puede producir R documental, nunca P. Una práctica física es opcional, autodocumentada y no certificada; declara herramientas, riesgo, preparación, parada, registro y señales de daño.

## Fuentes e incertidumbre

Teoría general para principios; documento oficial para datos de calibre; fuentes históricas para progresión, casos y método con sus riesgos declarados. No elevar OCR, despieces o analogías a fórmula, procedimiento o tolerancia confirmados. Corregir o limitar el claim exacto, no contaminar toda la lección.

Este patrón se aplicó a 16 pilotos y debe expandirse con revisión por lotes en 0.14F, no mediante reescritura ciega de las 222 lecciones.`)
}

function uxQaMarkdown(): string {
  return md(`# QA de experiencia 0.14E

| Caso | Estado |
| --- | --- |
${ACADEMY_014E_QA_CASES.map(([name, status]) => `| ${name} | ${status} |`).join('\n')}

Los tests estructurales no sustituyen la comprensión del propietario. Las comprobaciones de nota, marcador y reanudación usan almacenamiento local temporal y se limpian; ninguna captura contiene datos humanos ficticios. El fallback WebGL y reduced motion también se validan de forma determinista.`)
}

function screenshotIndexMarkdown(): string {
  return md(`# Índice de capturas 0.14E

Ruta: docs/academy-ux/screenshots/0.14E/. No se sobrescribe ninguna captura 0.14D.

| Archivo | Ruta | Viewport | Estado | Debe observarse | Limitaciones |
| --- | --- | --- | --- | --- | --- |
${ACADEMY_014E_SCREENSHOTS.map((shot) => `| [${shot.fileName}](../academy-ux/screenshots/0.14E/${shot.fileName}) | ${pipe(shot.route)} | ${shot.viewport} | ${pipe(shot.state)} | ${pipe(shot.expected)} | ${pipe(shot.limitations)} |`).join('\n')}

Las capturas documentan estados del producto, no evidencia de aprendizaje ni destreza física.`)
}

function summaryMarkdown(input: {
  corpus: Awaited<ReturnType<typeof loadAcademyCorpus>>
  records: DocumentRecord[]
}): string {
  const { corpus, records } = input
  const visualReviews = academyPersonalVisualReviews()
  const sectionCount = ACADEMY_PERSONAL_PILOT_REVIEWS.reduce((total, review) => total + academyPersonalPatchedSectionIds(review.lessonId).length, 0)
  return md(`# Watch Prototype Lab 0.14E · resumen

## Baseline e integridad

- Commit inicial: ${ACADEMY_014E_BASELINE.initialCommit}.
- Cambios ajenos al iniciar: ninguno; worktree limpio.
- Corpus: **${corpus.counts.packages} paquetes, ${corpus.counts.routes} rutas, ${corpus.counts.modules} módulos, ${corpus.counts.lessons} lecciones y ${corpus.counts.activities} actividades**.
- Digest del corpus: ${corpus.digest} (coincide con el baseline).
- Informes históricos: **${ACADEMY_014E_BASELINE.historicalReportCount}**, digest combinado intacto.
- Documentos 0.14E construidos y validados: **${records.length}**.

## Curación visible

| Resultado | Conteo |
| --- | ---: |
| Lecciones piloto revisadas | ${ACADEMY_PERSONAL_PILOT_REVIEWS.length} |
| Apartados visibles editados | ${sectionCount} |
| Claims importantes revisados | ${ACADEMY_PERSONAL_CLAIM_REVIEWS.length} |
| Claims corregidos o estrechados | ${ACADEMY_PERSONAL_CLAIM_REVIEWS.filter(({ decision }) => ['correct', 'narrow'].includes(decision)).length} |
| Claims bloqueados por fuente | ${ACADEMY_PERSONAL_CLAIM_REVIEWS.filter(({ decision }) => decision === 'source-needed').length} |
| Fórmulas no OCR revisadas | ${ACADEMY_PILOT_FORMULA_REVIEWS.length} |
| Fórmulas OCR que siguen pendientes | ${ACADEMY_014E_BASELINE.ocrFormulaGaps014d} |
| Visuales existentes mantenidos | ${visualReviews.filter(({ decision }) => decision === 'keep').length} |
| Visuales existentes corregidos | ${visualReviews.filter(({ decision }) => decision === 'correct').length} |
| Visuales existentes pendientes de fuente | ${visualReviews.filter(({ decision }) => decision === 'source-needed').length} |
| Visuales critical/high nuevos | ${ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.filter(({ result }) => result === 'implemented').length} |
| Gaps critical resueltos | ${ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.filter(({ priority, result }) => priority === 'critical' && result === 'implemented').length} |
| Gaps high resueltos | ${ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.filter(({ priority, result }) => priority === 'high' && result === 'implemented').length} |
| Estados 3D mantenidos / corregidos / pendientes | ${ACADEMY_PERSONAL_3D_REVIEWS.filter(({ decision }) => decision === 'keep').length} / ${ACADEMY_PERSONAL_3D_REVIEWS.filter(({ decision }) => decision === 'correct').length} / ${ACADEMY_PERSONAL_3D_REVIEWS.filter(({ decision }) => decision === 'source-needed').length} |

Las correcciones editoriales eliminan aperturas repetitivas, aclaran vocabulario, añaden puentes y alinean la práctica con la pregunta central. La principal corrección técnica convierte inferencias de un despiece 8215 en relaciones estructurales limitadas y bloquea cualquier secuencia no documentada.

## MIYOTA y otras referencias

MIYOTA queda como calibre de referencia, ejemplo trabajado, laboratorio práctico, caso de transferencia y ejemplo de documentación oficial. No se convierte en centro del currículo, marca exclusiva, especialización obligatoria ni arquitectura universal. Los ejemplos y fuentes de ETA, Seiko, calibres históricos y teoría general permanecen intactos en los paquetes.

## Revisión personal, compatibilidad y pruebas

Las 16 lecciones parten not-reviewed: Codex no inventa claridad humana. El estado técnico se muestra por separado y una revisión queda obsoleta si cambia el hash. IDs, progreso, sesiones, notas, marcadores y deep links conservan sus contratos; no se modifica ningún archivo bajo learning-content/ ni reference-library/.

El gate determinista incluye auditoría 0.14E, TypeScript, ESLint, Vitest, build y las auditorías 0.14A–0.14D mediante npm run verify. El resultado ejecutado se registra en la entrega final, no se falsea dentro de un informe generado.

## Riesgos y 0.14F

Siguen pendientes la fuente de secuencia de servicio del 8215, cotas verificadas para agujas, ${ACADEMY_014E_BASELINE.ocrFormulaGaps014d} fórmulas OCR, claims amplios fuera del alcance y gaps medium/low. La recomendación para 0.14F es expandir este patrón por lotes pedagógicos pequeños, empezando por fundamentos y banco, y detener cada claim cuantitativo o procedural que no tenga localizador aplicable.`)
}

export async function buildAcademyPersonalCurationOutputs(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  await assertHistoricalReports(repositoryRoot)
  const corpus = await loadAcademyCorpus(repositoryRoot)
  if (corpus.digest !== ACADEMY_014E_BASELINE.corpusDigest) throw new Error(`El corpus cambió durante 0.14E (${corpus.digest}).`)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const records: DocumentRecord[] = corpus.lessons.map(({ lesson }) => lesson.id).filter((id, index, all) => all.indexOf(id) === index).map((lessonId) => {
    const descriptor = product.lessons.find(({ id }) => id === lessonId)
    const pack = packByLesson.get(lessonId)
    if (!descriptor || !pack) throw new Error(`Descriptor o paquete ausente para ${lessonId}.`)
    const material = materialFor(pack, lessonId, product)
    const location = academyPathLocationForStepLesson(lessonId)
    const document = buildAcademyReaderDocument({
      material,
      title: descriptor.title.es,
      purpose: descriptor.purpose.es,
      whyNow: location?.chapter.whyNow,
      outcome: location?.chapter.outcome,
      stageId: location?.stage.stageId,
      chapterId: location?.chapter.chapterId,
      stepId: location?.step.stepId,
      requiredActivityIds: location?.step.requiredActivityIds ?? descriptor.studyContract?.labActivityIds ?? [],
      locale: 'es-ES',
    }, { curationPhase: '0.14E' })
    const issues = validateAcademyReaderDocument(document)
    if (issues.length) throw new Error(`${lessonId} produjo incidencias 0.14E: ${issues.map(({ code }) => code).join(', ')}.`)
    return { document, material, title: descriptor.title.es }
  })
  if (records.length !== corpus.counts.lessons) throw new Error(`Cobertura incompleta del lector: ${records.length}/${corpus.counts.lessons}.`)
  if (academyPersonalVisualReviews().length !== ACADEMY_014E_BASELINE.visualDesigns014d) throw new Error('La revisión no cubre los 32 visuales 0.14D.')
  if (ACADEMY_PERSONAL_3D_REVIEWS.length !== ACADEMY_014E_BASELINE.states3d014d) throw new Error('La revisión no cubre los 9 estados 3D.')
  if (ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.length !== ACADEMY_014E_BASELINE.criticalGaps014d + ACADEMY_014E_BASELINE.highGaps014d) throw new Error('La revisión no cubre exactamente los gaps critical/high.')
  const pilotIds = new Set(ACADEMY_PERSONAL_PILOT_REVIEWS.map(({ lessonId }) => lessonId))
  if (records.filter(({ document }) => pilotIds.has(document.lessonId)).length !== ACADEMY_PERSONAL_PILOT_REVIEWS.length) throw new Error('Falta una lección piloto en el corpus.')

  const pilotJson = {
    schema: 'wplab-academy-personal-pilot-review-v1', phase: '0.14E',
    baseline: ACADEMY_014E_BASELINE, counts: corpus.counts,
    sectionPatchCount: ACADEMY_PERSONAL_PILOT_REVIEWS.reduce((total, review) => total + academyPersonalPatchedSectionIds(review.lessonId).length, 0),
    reviews: ACADEMY_PERSONAL_PILOT_REVIEWS.map((review) => ({ ...review, patchedSectionIds: academyPersonalPatchedSectionIds(review.lessonId) })),
    claimReviews: ACADEMY_PERSONAL_CLAIM_REVIEWS,
    formulaReviews: ACADEMY_PILOT_FORMULA_REVIEWS,
  }
  const targetsJson = { schema: 'wplab-academy-critical-high-visuals-v1', phase: '0.14E', scope: { critical: 2, high: 7, mediumLowTouched: 0 }, targets: ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS }
  const visual3dJson = { schema: 'wplab-academy-visual-3d-review-v1', phase: '0.14E', visualReviews: academyPersonalVisualReviews(), state3dReviews: ACADEMY_PERSONAL_3D_REVIEWS }
  return new Map<OutputFile, string>([
    ['ACADEMY-0.14E-SUMMARY.md', summaryMarkdown({ corpus, records })],
    ['ACADEMY-PILOT-REVIEW-0.14E.md', pilotMarkdown(records)],
    ['ACADEMY-PILOT-REVIEW-0.14E.json', json(pilotJson)],
    ['ACADEMY-MIYOTA-REFERENCE-ROLE-0.14E.md', miyotaMarkdown()],
    ['ACADEMY-CRITICAL-HIGH-VISUALS-0.14E.md', targetsMarkdown()],
    ['ACADEMY-CRITICAL-HIGH-VISUALS-0.14E.json', json(targetsJson)],
    ['ACADEMY-VISUAL-3D-REVIEW-0.14E.md', visual3dMarkdown()],
    ['ACADEMY-VISUAL-3D-REVIEW-0.14E.json', json(visual3dJson)],
    ['ACADEMY-PERSONAL-REVIEW-QUEUE-0.14E.md', queueMarkdown(records)],
    ['ACADEMY-PERSONAL-STYLE-GUIDE-0.14E.md', styleGuideMarkdown()],
    ['ACADEMY-UX-QA-0.14E.md', uxQaMarkdown()],
    ['ACADEMY-SCREENSHOT-INDEX-0.14E.md', screenshotIndexMarkdown()],
  ])
}

export async function runAcademyPersonalCuration(repositoryRoot: string, check: boolean): Promise<void> {
  const outputs = await buildAcademyPersonalCurationOutputs(repositoryRoot)
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(generatedRoot, { recursive: true })
  for (const [fileName, content] of outputs) {
    const path = join(generatedRoot, fileName)
    if (check) {
      const current = await readFile(path, 'utf8').catch(() => '')
      if (current !== content) throw new Error(`${fileName} no coincide con la salida determinista 0.14E.`)
    } else {
      await writeFile(path, content, 'utf8')
    }
  }
  console.log(`${check ? 'Verificación' : 'Generación'} 0.14E: ${outputs.size} informes; 16 pilotos, 32 visuales, 9 estados 3D y baseline histórico intacto.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runAcademyPersonalCuration(resolve(process.cwd()), process.argv.includes('--check')).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
