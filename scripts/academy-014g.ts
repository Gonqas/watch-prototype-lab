import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import {
  ACADEMY_PERSONAL_REVIEW_QUEUE_014G,
  ACADEMY_STAGE_0_TO_1_CHECKPOINT,
  ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_1_CLAIM_REVIEWS,
  ACADEMY_STAGE_1_LESSON_CURATIONS,
  ACADEMY_STAGE_1_PERSONAL_PRACTICES,
  ACADEMY_STAGE_1_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_1_VISUAL_DESIGNS,
} from '../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderDocument } from '../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes, type LearningProductIndex } from '../src/learning/product/demoPackage'
import { ACADEMY_014G_QA_CASES } from './academy-audit/academy-014g-qa-snapshot'
import { loadAcademyCorpus } from './academy-audit/corpus'

export const ACADEMY_014G_OUTPUT_FILES = [
  'ACADEMY-PERSISTENCE-WRITE-MAP-0.14G.md',
  'ACADEMY-PERSISTENCE-CONCURRENCY-0.14G.json',
  'ACADEMY-PERSISTENCE-CONCURRENCY-0.14G.md',
  'ACADEMY-STAGE-1-CURATION-0.14G.json',
  'ACADEMY-STAGE-1-CURATION-0.14G.md',
  'ACADEMY-STAGE-1-PREREQUISITES-0.14G.json',
  'ACADEMY-STAGE-1-PREREQUISITES-0.14G.md',
  'ACADEMY-STAGE-1-VISUALS-0.14G.json',
  'ACADEMY-STAGE-1-VISUALS-0.14G.md',
  'ACADEMY-STAGE-1-PRACTICES-0.14G.json',
  'ACADEMY-STAGE-1-PRACTICES-0.14G.md',
  'ACADEMY-STAGE-1-CLAIMS-0.14G.json',
  'ACADEMY-STAGE-1-CLAIMS-0.14G.md',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14G.json',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14G.md',
  'ACADEMY-UX-QA-0.14G.md',
  'ACADEMY-SCREENSHOT-INDEX-0.14G.md',
  'ACADEMY-0.14G-SUMMARY.md',
] as const

export const ACADEMY_014G_BASELINE = {
  initialCommit: '2f8385c8686fb216c618e1f6de868a3cdbfd61d3',
  initialBranch: 'main',
  initialTree: 'clean',
  corpusDigest: '1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e',
  historicalReportsCount: 95,
  historicalReportsDigest: 'ad771a29ead7925a35d8ac5308767ec69332173b1ed100dc6cea246eb909f166',
  protectedFilesCount: 3994,
  protectedFilesDigest: '19969323dca2f844eec56ed6a34c47fa88e96e4bb8e60bd1e6767afeb7ca43e0',
} as const

const md = (value: string) => `${value.trim()}\n`
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const execFileAsync = promisify(execFile)

export const ACADEMY_014G_WRITE_MAP = [
  { writer: 'LearningProfileService.update', target: 'perfil, accesibilidad y preferencias', before: 'lectura seguida de escritura de snapshot completo', after: 'mutación funcional serializada por profileId', flush: 'cola de perfil' },
  { writer: 'LearningProfileService.updateEducationalPreferences', target: 'preferencias educativas', before: 'no existía como contrato funcional', after: 'merge sobre el valor más reciente', flush: 'cola de perfil' },
  { writer: 'LearningApplicationService.persistAcademyState', target: 'educationalPreferences.academyStateV1', before: 'snapshot capturado por React', after: 'mergeAcademyLocalState dentro de mutación funcional', flush: 'cambio de perfil, pagehide y shutdown' },
  { writer: 'AcademyLocalStore', target: 'localStorage de Academia', before: 'escritura inmediata local', after: 'escritura inmediata con merge por entidad y tombstones', flush: 'sin cola; fuente efectiva combinada' },
  { writer: 'AcademyShell mirror', target: 'perfil persistente', before: 'debounce con preferencias capturadas', after: 'coalescencia de 300 ms y persistAcademyState', flush: 'pagehide y desmontaje' },
  { writer: 'Academy onboarding/preferences', target: 'idioma educativo y preferencias', before: 'update de objeto completo', after: 'actualización funcional independiente', flush: 'cola de perfil' },
  { writer: 'Learning accessibility controls', target: 'accesibilidad', before: 'podía competir con Academia', after: 'merge funcional conservando preferencias', flush: 'cola de perfil' },
  { writer: 'LearningApplicationService.markNotificationRead', target: 'notificación leída', before: 'snapshot potencialmente obsoleto', after: 'mutación funcional', flush: 'cola de perfil' },
  { writer: 'profile switch / shutdown', target: 'mutaciones pendientes', before: 'cierre sin barrera común', after: 'flush del perfil anterior o de todas las colas', flush: 'explícito' },
] as const

export const ACADEMY_014G_CONCURRENCY = {
  schema: 'wplab-academy-persistence-concurrency-v1', phase: '0.14G', maxAttempts: 3,
  reproducedBaseline: [
    { backend: 'memory', concurrentMutations: 2, result: 'one-fulfilled-one-conflict', finalRecordVersion: 2, lostField: 'educationalPreferences.academyStateV1' },
    { backend: 'indexeddb', concurrentMutations: 2, result: 'one-fulfilled-one-conflict', finalRecordVersion: 2, lostField: 'educationalPreferences' },
  ],
  fixedStressContract: { backends: ['memory', 'indexeddb', 'sqlite-adapter'], academyTransitions: 100, competingAccessibilityMutations: 1, expectedRecordVersion: 102, expectedLostMutations: 0, deterministicTest: 'src/learning/persistence/profileMutationCoordinator.test.ts' },
  serialization: 'one functional queue per profileId', merge: 'entity-aware Academy merge plus shallow preference/accessibility merge',
  diagnostics: { pii: false, profileId: 'stable local hash only', boundedRecords: 200, exportable: true, clearable: true },
  conflictPolicy: { retries: 3, reReadOnRetry: true, blindOverwrite: false, finalErrorRetryable: true },
}

export const ACADEMY_014G_PERFORMANCE_SNAPSHOT = {
  measuredAt: '2026-08-15',
  environment: 'Windows local · Node/Vite de este repositorio',
  persistenceBenchmark: {
    backend: 'memory', rounds: 5, mutationsPerRound: 101, meanFlushMs: 19.052,
    meanQueueCostPerMutationMs: 0.1886, maximumPending: 101, finalRecordVersion: 102,
    minimumFlushMs: 17.065, maximumFlushMs: 21.055,
    method: 'cinco perfiles nuevos; cien mutaciones de Academia y una de accesibilidad encoladas antes de flush',
  },
  browserTiming: {
    timeToTextMs: null, timeToVisualMs: null,
    reason: 'El navegador integrado permitió verificar presencia y render, pero no expuso Performance API; no se inventa una duración.',
  },
  stage1VisualPayload: { designs: 6, nodes: 46, edges: 38, jsonUtf8Bytes: 18_754 },
  phase014gSource: { files: 12, bytes: 93_062 },
  productionBuild: {
    viteBuildSeconds: 1.18, fullCommandMs: 45_924.8,
    chunks: [
      { file: 'AcademyContinuousLessonSurface-DpWNEjql.js', bytes: 22_503, gzipBytes: 6_689 },
      { file: 'AcademyContinuousLessonSurface-C3tfdrLQ.css', bytes: 12_573, gzipBytes: 2_804 },
      { file: 'AcademyReaderVisual-aJdr7OVW.js', bytes: 184_467, gzipBytes: 56_045 },
      { file: 'academyPersonalCurriculum-fc4yvSkS.js', bytes: 213_432, gzipBytes: 59_928 },
    ],
  },
} as const

interface LessonRecord { title: string; document014f: AcademyReaderDocument; document014g: AcademyReaderDocument }

function materialFor(pack: LearningPack, lessonId: string, product: LearningProductIndex): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!lesson || !descriptor) throw new Error(`Lección ausente: ${lessonId}`)
  const blocks = pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
  const lessonMarkdown = blocks.map(({ bodyMarkdown }) => bodyMarkdown).join('\n')
  const sourceIds = new Set([...(lesson.authoring?.sourceIds ?? []), ...blocks.flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id)))])
  return {
    packageId: pack.manifest.id, packageVersion: pack.manifest.packageVersion, pack, lesson, blocks,
    activities: descriptor.activityIds.flatMap((activityId) => {
      const activity = product.activities.find(({ id }) => id === activityId)
      return activity ? [activity] : []
    }),
    sources: pack.sources.filter(({ id }) => sourceIds.has(id)),
    glossary: pack.glossary.filter(({ id }) => lessonMarkdown.includes(`{{term:${id}}}`)),
  }
}

function documentFor(product: LearningProductIndex, pack: LearningPack, lessonId: string, phase: '0.14F' | '0.14G'): AcademyReaderDocument {
  const material = materialFor(pack, lessonId, product)
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!descriptor) throw new Error(`Lección ausente: ${lessonId}`)
  return buildAcademyReaderDocument({
    material, title: descriptor.title.es, purpose: descriptor.purpose.es, locale: 'es-ES',
    requiredActivityIds: descriptor.studyContract?.labActivityIds,
  }, { curationPhase: phase })
}

async function historicalReportSnapshot(repositoryRoot: string) {
  const root = join(repositoryRoot, 'docs', 'generated')
  const fileNames = (await readdir(root)).filter((name) => !name.startsWith('APRENDER-') && !name.includes('0.14G')).sort()
  const rows = await Promise.all(fileNames.map(async (name) => `${name}:${sha256(await readFile(join(root, name)))}`))
  return { count: fileNames.length, digest: sha256(rows.join('\n')), fileNames }
}

async function screenshots(repositoryRoot: string) {
  const root = join(repositoryRoot, 'docs', 'academy-ux', 'screenshots', '0.14G')
  const names = await readdir(root).catch(() => [])
  return Promise.all(names.filter((name) => name.toLowerCase().endsWith('.png')).sort().map(async (fileName) => {
    const content = await readFile(join(root, fileName))
    return { fileName, bytes: content.byteLength, sha256: sha256(content) }
  }))
}

export async function buildAcademy014GOutputs(repositoryRoot: string): Promise<Map<string, string>> {
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const historical = await historicalReportSnapshot(repositoryRoot)
  const screenshotRows = await screenshots(repositoryRoot)
  const lessons: LessonRecord[] = ACADEMY_STAGE_1_LESSON_CURATIONS.map(({ lessonId }) => {
    const descriptor = product.lessons.find(({ id }) => id === lessonId)!
    const pack = packByLesson.get(lessonId)
    if (!pack) throw new Error(`Paquete ausente: ${lessonId}`)
    return { title: descriptor.title.es, document014f: documentFor(product, pack, lessonId, '0.14F'), document014g: documentFor(product, pack, lessonId, '0.14G') }
  })
  const validationIssues = lessons.flatMap(({ document014g }) => validateAcademyReaderDocument(document014g))
  const outputs = new Map<string, string>()

  outputs.set('ACADEMY-PERSISTENCE-WRITE-MAP-0.14G.md', md(`# Mapa de escrituras de persistencia · 0.14G

| Escritor | Objetivo | Antes | Contrato 0.14G | Cierre |
|---|---|---|---|---|
${ACADEMY_014G_WRITE_MAP.map((row) => `| ${pipe(row.writer)} | ${pipe(row.target)} | ${pipe(row.before)} | ${pipe(row.after)} | ${pipe(row.flush)} |`).join('\n')}

## Regla de propiedad

Cada perfil tiene una cola funcional. La mutación se reaplica al valor leído dentro de la transacción; no se conserva un snapshot del perfil como autoridad. El estado efectivo de Academia combina el registro inmediato del navegador con el espejo de perfil mediante identidad y fecha por entidad. No se registra contenido de notas en los diagnósticos.`))

  outputs.set('ACADEMY-PERSISTENCE-CONCURRENCY-0.14G.json', json(ACADEMY_014G_CONCURRENCY))
  outputs.set('ACADEMY-PERSISTENCE-CONCURRENCY-0.14G.md', md(`# Concurrencia de persistencia · 0.14G

## Reproducción anterior

| Backend | Mutaciones simultáneas | Resultado | Versión final | Pérdida observada |
|---|---:|---|---:|---|
${ACADEMY_014G_CONCURRENCY.reproducedBaseline.map((row) => `| ${row.backend} | ${row.concurrentMutations} | ${row.result} | ${row.finalRecordVersion} | ${row.lostField} |`).join('\n')}

## Contrato corregido

- Cola funcional independiente por perfil.
- Relectura dentro de la transacción y versión monotónica.
- Máximo de ${ACADEMY_014G_CONCURRENCY.maxAttempts} intentos; conflicto agotado recuperable y visible.
- Estrés determinista: 100 transiciones de Academia más una mutación de accesibilidad en memoria, IndexedDB y adaptador SQLite.
- Resultado esperado y cubierto por prueba: versión 102, cero mutaciones perdidas.
- Diagnósticos acotados, exportables, borrables y sin IDs de perfil en claro.

La prueba de SQLite cubre el adaptador y su gateway contractual, no una base nativa externa real.`))

  outputs.set('ACADEMY-STAGE-1-CURATION-0.14G.json', json({ schema: 'wplab-academy-stage1-curation-v1', phase: '0.14G', lessons: ACADEMY_STAGE_1_LESSON_CURATIONS, activityPresentations: ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS, checkpoint: ACADEMY_STAGE_0_TO_1_CHECKPOINT }))
  outputs.set('ACADEMY-STAGE-1-CURATION-0.14G.md', md(`# Curación de etapa 1 · 0.14G

| Rol | Lección | Apartados | Actividades | Pregunta central |
|---|---|---:|---:|---|
${ACADEMY_STAGE_1_LESSON_CURATIONS.map((item) => `| ${item.pathRole} | \`${item.lessonId}\` | ${item.sections.length} | ${item.activityPresentations.length} | ${pipe(item.centralQuestion)} |`).join('\n')}

## Contrato

Las ocho lecciones conservan IDs, bloques fuente y actividades. La etapa 1 distingue anclas, apoyos, rama opcional y referencia. La rama de cuarzo es no bloqueante. El checkpoint etapa 0 → etapa 1 es recomendado, no afecta progreso y ofrece revisar, continuar o anotar una duda.

## Versionado

Los documentos 0.14F siguen generándose con sus hashes anteriores; 0.14G crea nuevos IDs de apartado y aliases explícitos desde los apartados 0.14F. Incidencias estructurales en documentos 0.14G: ${validationIssues.length}.`))

  outputs.set('ACADEMY-STAGE-1-PREREQUISITES-0.14G.json', json({ schema: 'wplab-academy-stage1-prerequisites-v1', phase: '0.14G', overrides: ACADEMY_STAGE_1_PREREQUISITE_OVERRIDES }))
  outputs.set('ACADEMY-STAGE-1-PREREQUISITES-0.14G.md', md(`# Prerrequisitos efectivos de etapa 1 · 0.14G

| Lección | Rol | Bloqueante | Requisitos efectivos | Razón |
|---|---|---:|---|---|
${ACADEMY_STAGE_1_PREREQUISITE_OVERRIDES.map((item) => `| \`${item.lessonId}\` | ${item.pathRole} | ${item.blocking ? 'sí' : 'no'} | ${item.effectiveRequiredConceptIds.map((id) => `\`${id}\``).join('<br>') || 'ninguno'} | ${pipe(item.rationale)} |`).join('\n')}

No se modifica el contenido bruto. Se neutralizan como bloqueos los detalles posteriores de minutería/puesta en hora, los detalles avanzados de transición electromecánica y el uso temprano de una ruta avanzada como requisito de la guía de autoridad.`))

  outputs.set('ACADEMY-STAGE-1-VISUALS-0.14G.json', json({ schema: 'wplab-academy-stage1-visuals-v1', phase: '0.14G', designs: ACADEMY_STAGE_1_VISUAL_DESIGNS }))
  outputs.set('ACADEMY-STAGE-1-VISUALS-0.14G.md', md(`# Visuales de etapa 1 · 0.14G

| Diseño | Lecciones | Nodos | Relaciones | Fidelidad | Fuente y localizador |
|---|---:|---:|---:|---|---|
${ACADEMY_STAGE_1_VISUAL_DESIGNS.map((item) => `| \`${item.visualDesignId}\` | ${item.lessonIds.length} | ${item.semanticPayload.nodes.length} | ${item.semanticPayload.edges.length} | ${item.fidelity} | ${item.sourceLocators.map(({ sourceId, page, figure }) => `${sourceId}${page ? ` · ${page}` : ''}${figure ? ` · ${figure}` : ''}`).join('<br>')} |`).join('\n')}

Son exactamente seis diseños semánticos únicos. Todos conservan descripción larga, etiquetas, relaciones que no dependen del color y estado seguro con movimiento reducido. No copian imágenes de los originales.`))

  outputs.set('ACADEMY-STAGE-1-PRACTICES-0.14G.json', json({ schema: 'wplab-academy-stage1-personal-practices-v1', phase: '0.14G', practices: ACADEMY_STAGE_1_PERSONAL_PRACTICES }))
  outputs.set('ACADEMY-STAGE-1-PRACTICES-0.14G.md', md(`# Prácticas personales de etapa 1 · 0.14G

| Práctica | Lecciones | Objetivo | Señal de parada | Efecto curricular |
|---|---:|---|---|---|
${ACADEMY_STAGE_1_PERSONAL_PRACTICES.map((item) => `| \`${item.personalPracticeId}\` | ${item.lessonIds.length} | ${pipe(item.objective)} | ${pipe(item.stopSignal)} | ninguno |`).join('\n')}

Las cinco prácticas son opcionales, locales y autodocumentadas. No forman parte de las 289 actividades, no completan lecciones, no crean mastery y no certifican competencia física.`))

  outputs.set('ACADEMY-STAGE-1-CLAIMS-0.14G.json', json({ schema: 'wplab-academy-stage1-claims-v1', phase: '0.14G', claims: ACADEMY_STAGE_1_CLAIM_REVIEWS }))
  outputs.set('ACADEMY-STAGE-1-CLAIMS-0.14G.md', md(`# Afirmaciones revisadas de etapa 1 · 0.14G

| Claim | Lección | Tipo | Verificación | Localizador | Límite |
|---|---|---|---|---|---|
${ACADEMY_STAGE_1_CLAIM_REVIEWS.map((item) => `| \`${item.claimId}\` | \`${item.lessonId}\` | ${item.claimType} | ${item.verificationStatus} | ${item.locators.map(({ sourceId, page, figure }) => `${sourceId}${page ? ` · ${page}` : ''}${figure ? ` · ${figure}` : ''}`).join('<br>')} | ${pipe(item.limitations.join(' '))} |`).join('\n')}

Las fórmulas y cifras no se trasladan desde OCR. Los claims source-limited conservan su razón abierta y no se presentan como autoridad técnica cerrada.`))

  outputs.set('ACADEMY-PERSONAL-REVIEW-QUEUE-0.14G.json', json({ schema: 'wplab-academy-personal-review-queue-v1', phase: '0.14G', queue: ACADEMY_PERSONAL_REVIEW_QUEUE_014G }))
  outputs.set('ACADEMY-PERSONAL-REVIEW-QUEUE-0.14G.md', md(`# Cola de revisión personal · 0.14G

- Entradas únicas: ${ACADEMY_PERSONAL_REVIEW_QUEUE_014G.length}.
- Nuevas de etapa 1: ${ACADEMY_PERSONAL_REVIEW_QUEUE_014G.filter(({ originPhase }) => originPhase === '0.14G').length}.
- Estado inicial: todas \`not-reviewed\`.
- La deduplicación se realiza por \`lessonId\`; una lección curada en varias fases conserva una sola tarea activa con la fase más reciente.

| Lección | Origen | Estado técnico | Estado personal |
|---|---|---|---|
${ACADEMY_PERSONAL_REVIEW_QUEUE_014G.map((item) => `| \`${item.lessonId}\` | ${item.originPhase} | ${item.technicalStatus} | ${item.personalStatus} |`).join('\n')}`))

  outputs.set('ACADEMY-UX-QA-0.14G.md', md(`# QA de experiencia · 0.14G

| Caso | Viewport | Tema | Movimiento reducido | Estado | Observación |
|---|---|---|---:|---|---|
${ACADEMY_014G_QA_CASES.map((item) => `| ${item.caseId} | ${item.viewport} | ${item.theme} | ${item.reducedMotion ? 'sí' : 'no'} | ${item.status} | ${pipe(item.notes)} |`).join('\n')}

## Rendimiento observado

| Medida | Resultado | Método o límite |
|---|---:|---|
| Flush de 101 mutaciones | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.meanFlushMs} ms de media (${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.minimumFlushMs}–${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.maximumFlushMs} ms) | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.method} |
| Coste medio de cola | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.meanQueueCostPerMutationMs} ms/mutación | backend ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.backend}, ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.rounds} rondas |
| Máximo pendiente | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.persistenceBenchmark.maximumPending} | medido inmediatamente después de encolar |
| Payload semántico de visuales | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.stage1VisualPayload.jsonUtf8Bytes} bytes | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.stage1VisualPayload.designs} diseños, ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.stage1VisualPayload.nodes} nodos y ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.stage1VisualPayload.edges} relaciones |
| Código fuente de fase 0.14G | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.phase014gSource.bytes} bytes | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.phase014gSource.files} archivos bajo \`phase014g/\` |
| Build Vite | ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.productionBuild.viteBuildSeconds} s | comando completo: ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.productionBuild.fullCommandMs} ms, incluye schema y TypeScript |

Chunks observados en el build de producción:

| Chunk | Bytes | Gzip |
|---|---:|---:|
${ACADEMY_014G_PERFORMANCE_SNAPSHOT.productionBuild.chunks.map((item) => `| \`${item.file}\` | ${item.bytes} | ${item.gzipBytes} |`).join('\n')}

Tiempo hasta texto y tiempo hasta visual quedan **no medidos**: ${ACADEMY_014G_PERFORMANCE_SNAPSHOT.browserTiming.reason}

## Distinciones

- La prueba automatizada cubre persistencia, contratos de documentos, aliases, evidencia y render estático.
- La inspección visual usa el navegador de la aplicación y se registra solo tras observar la pantalla real.
- El adaptador SQLite se prueba con gateway contractual; no se declara una sesión nativa externa.
- El aviso de conflicto mostrado en la fixture de QA está etiquetado como simulación y no falsifica una pérdida real.`))

  outputs.set('ACADEMY-SCREENSHOT-INDEX-0.14G.md', md(`# Índice de capturas · 0.14G

Directorio: \`docs/academy-ux/screenshots/0.14G/\`

| Archivo | Bytes | SHA-256 |
|---|---:|---|
${screenshotRows.length ? screenshotRows.map((item) => `| \`${item.fileName}\` | ${item.bytes} | \`${item.sha256}\` |`).join('\n') : '| — | 0 | QA pendiente |'}

Las capturas de fases anteriores no se sobrescriben. Ninguna captura contiene documentos originales ni datos personales reales.`))

  outputs.set('ACADEMY-0.14G-SUMMARY.md', md(`# Watch Prototype Lab 0.14G · resumen

## Resultado

- Corpus conservado: ${corpus.counts.packages} paquetes, ${corpus.counts.routes} rutas, ${corpus.counts.modules} módulos, ${corpus.counts.lessons} lecciones y ${corpus.counts.activities} actividades.
- Digest del corpus: \`${corpus.digest}\` (${corpus.digest === ACADEMY_014G_BASELINE.corpusDigest ? 'sin cambios' : 'CAMBIÓ'}).
- Informes históricos 0.14A–0.14F: ${historical.count} archivos, digest \`${historical.digest}\`.
- Persistencia: cola funcional por perfil, merge del estado de Academia, tres reintentos, flush explícito y diagnósticos sin PII.
- Etapa 1: ${ACADEMY_STAGE_1_LESSON_CURATIONS.length} lecciones, ${lessons.reduce((sum, item) => sum + item.document014g.sections.length, 0)} apartados, ${ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS.length} overlays, ${ACADEMY_STAGE_1_VISUAL_DESIGNS.length} visuales, ${ACADEMY_STAGE_1_PERSONAL_PRACTICES.length} prácticas personales y ${ACADEMY_STAGE_1_CLAIM_REVIEWS.length} claims.
- Capturas 0.14G: ${screenshotRows.length}.

## Declaraciones explícitas

No se modificaron IDs del corpus, rutas, paquetes, contenido bruto ni originales. No se copiaron imágenes o páginas privadas al runtime. Las prácticas personales no influyen en progreso ni mastery. La rama de cuarzo no bloquea el recorrido mecánico. 0.14G se detiene antes de 0.14H.

## Revisión humana pendiente

Las ocho lecciones permanecen en la cola personal como \`not-reviewed\`. Los claims source-limited, el alcance de las URLs oficiales registradas y toda ampliación histórica o cuantitativa requieren revisión humana antes de una fase posterior.`))

  return outputs
}

export async function runAcademy014G(repositoryRoot: string, options: { check?: boolean; scope?: 'all' | 'persistence' | 'stage1' } = {}) {
  const outputs = await buildAcademy014GOutputs(repositoryRoot)
  const outputRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(outputRoot, { recursive: true })
  const persistence = new Set(['ACADEMY-PERSISTENCE-WRITE-MAP-0.14G.md', 'ACADEMY-PERSISTENCE-CONCURRENCY-0.14G.md', 'ACADEMY-PERSISTENCE-CONCURRENCY-0.14G.json'])
  const selected = [...outputs].filter(([name]) => options.scope === 'persistence' ? persistence.has(name) : options.scope === 'stage1' ? !persistence.has(name) : true)
  for (const [name, content] of selected) {
    const target = join(outputRoot, name)
    if (options.check) {
      const actual = await readFile(target, 'utf8').catch(() => '')
      if (actual !== content) throw new Error(`Salida 0.14G desactualizada: ${name}`)
    } else await writeFile(target, content, 'utf8')
  }
  return selected.length
}

export async function runAcademy014GTests(repositoryRoot: string, scope: 'all' | 'persistence' | 'stage1' = 'all') {
  const files = scope === 'persistence'
    ? ['src/learning/persistence/profileMutationCoordinator.test.ts', 'src/learning/academy/academyLocalState.test.ts']
    : scope === 'stage1'
      ? ['scripts/academy-audit/academy-stage1-curation.test.tsx']
      : ['src/learning/persistence/profileMutationCoordinator.test.ts', 'src/learning/academy/academyLocalState.test.ts', 'scripts/academy-audit/academy-stage1-curation.test.tsx']
  const vitestEntry = join(repositoryRoot, 'node_modules', 'vitest', 'vitest.mjs')
  const result = await execFileAsync(process.execPath, [vitestEntry, 'run', ...files], {
    cwd: repositoryRoot,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  return files.length
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const check = process.argv.includes('--check')
  const scopeArg = process.argv.find((value) => value.startsWith('--scope='))?.slice('--scope='.length)
  const scope = scopeArg === 'persistence' || scopeArg === 'stage1' ? scopeArg : 'all'
  const count = await runAcademy014G(resolve('.'), { check, scope })
  const testFiles = await runAcademy014GTests(resolve('.'), scope)
  console.log(`${check ? 'Verificación' : 'Generación'} 0.14G: ${count} informes y ${testFiles} archivos de prueba (${scope}).`)
}
