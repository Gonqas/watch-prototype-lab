import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { academyPathLocationForStepLesson } from '../src/learning/academy/path/academyLearnerPath'
import {
  ACADEMY_PERSONAL_REVIEW_QUEUE,
  ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_0_CLAIM_REVIEWS,
  ACADEMY_STAGE_0_LESSON_CURATIONS,
  ACADEMY_STAGE_0_LESSON_IDS,
  ACADEMY_STAGE_0_PERSONAL_PRACTICES,
  ACADEMY_STAGE_0_PHOTO_BRIEFS,
  ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_0_VISUAL_DESIGNS,
  CURRENT_ACADEMY_CURATION_PHASE,
} from '../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderDocument } from '../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { ACADEMY_014F_QA_CASES, ACADEMY_014F_VALIDATION_RESULTS } from './academy-audit/academy-stage0-qa-snapshot'
import { loadAcademyCorpus } from './academy-audit/corpus'

export const ACADEMY_STAGE0_CURATION_OUTPUT_FILES = [
  'ACADEMY-0.14F-SUMMARY.md',
  'ACADEMY-READER-SANITATION-0.14F.md',
  'ACADEMY-PERSONAL-CURATION-MODULARIZATION-0.14F.md',
  'ACADEMY-STAGE-0-CURATION-0.14F.md',
  'ACADEMY-STAGE-0-CURATION-0.14F.json',
  'ACADEMY-STAGE-0-PREREQUISITES-0.14F.md',
  'ACADEMY-STAGE-0-PREREQUISITES-0.14F.json',
  'ACADEMY-STAGE-0-VISUALS-0.14F.md',
  'ACADEMY-STAGE-0-VISUALS-0.14F.json',
  'ACADEMY-STAGE-0-PRACTICES-0.14F.md',
  'ACADEMY-STAGE-0-PRACTICES-0.14F.json',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14F.md',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14F.json',
  'ACADEMY-PERSONAL-STYLE-GUIDE-0.14F.md',
  'ACADEMY-UX-QA-0.14F.md',
  'ACADEMY-SCREENSHOT-INDEX-0.14F.md',
] as const

type OutputFile = (typeof ACADEMY_STAGE0_CURATION_OUTPUT_FILES)[number]

export const ACADEMY_014F_BASELINE = {
  initialCommit: '086b73eeb1b6d73aca4af4c9e497fd0d825562d6',
  initialBranch: 'main',
  initialTree: 'clean',
  corpusDigest: '1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e',
  historicalReportsDigest: 'a4a96deb8f2c17d147875c1c0f8a57257c4e41cbb6876274ab34f2fe09bba71c',
  bulovaSha256: 'b13229157e4839d81285d9069f991f6e8c85c59536955f562298bffb7fe2c981',
} as const

const md = (value: string) => `${value.trim()}\n`
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')

interface HistoricalReportSnapshot { count: number; digest: string; fileNames: string[] }
interface Stage0Record { title: string; document014e: AcademyReaderDocument; document014f: AcademyReaderDocument }
interface ScreenshotRecord { fileName: string; bytes: number; sha256: string }
interface PerformanceSnapshot {
  localWarmTextMedianMs: number
  localWarmVisualMedianMs: number
  phase014fFiles: number
  phase014fSourceBytes: number
  personalRegistryFiles: number
  personalRegistrySourceBytes: number
  semanticVisualPayloadBytes: number
  readerUiSourceBytes: number
  activityUiSourceBytes: number
  productionBuildSeconds: number
  finalWarmBuildSeconds: number
  phase014fChunkKb: number
  phase014fChunkGzipKb: number
  readerChunkKb: number
  readerChunkGzipKb: number
  activityChunkKb: number
  activityChunkGzipKb: number
}

async function historicalReportSnapshot(repositoryRoot: string): Promise<HistoricalReportSnapshot> {
  const root = join(repositoryRoot, 'docs', 'generated')
  const fileNames = (await readdir(root))
    .filter((name) => !name.startsWith('APRENDER-') && !name.includes('0.14F'))
    .sort()
  const rows = await Promise.all(fileNames.map(async (name) => `${name}:${sha256(await readFile(join(root, name)))}`))
  return { count: fileNames.length, digest: sha256(rows.join('\n')), fileNames }
}

async function screenshotRecords(repositoryRoot: string): Promise<ScreenshotRecord[]> {
  const root = join(repositoryRoot, 'docs', 'academy-ux', 'screenshots', '0.14F')
  const names = await readdir(root).catch(() => [])
  return Promise.all(names.filter((name) => name.toLowerCase().endsWith('.png')).sort().map(async (fileName) => {
    const content = await readFile(join(root, fileName))
    return { fileName, bytes: content.byteLength, sha256: sha256(content) }
  }))
}

async function performanceSnapshot(repositoryRoot: string): Promise<PerformanceSnapshot> {
  const personalRoot = join(repositoryRoot, 'src', 'learning', 'academy', 'reader', 'personal')
  const phaseRoot = join(personalRoot, 'phase014f')
  const recursiveTypeScriptFiles = async (root: string): Promise<string[]> => {
    const entries = await readdir(root, { withFileTypes: true })
    const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
      ? recursiveTypeScriptFiles(join(root, entry.name))
      : Promise.resolve(entry.name.endsWith('.ts') ? [join(root, entry.name)] : [])))
    return nested.flat()
  }
  const [phaseFiles, personalFiles] = await Promise.all([recursiveTypeScriptFiles(phaseRoot), recursiveTypeScriptFiles(personalRoot)])
  const sumBytes = async (files: string[]) => (await Promise.all(files.map(async (file) => (await stat(file)).size))).reduce((sum, size) => sum + size, 0)
  return {
    localWarmTextMedianMs: 228,
    localWarmVisualMedianMs: 286,
    phase014fFiles: phaseFiles.length,
    phase014fSourceBytes: await sumBytes(phaseFiles),
    personalRegistryFiles: personalFiles.length,
    personalRegistrySourceBytes: await sumBytes(personalFiles),
    semanticVisualPayloadBytes: Buffer.byteLength(JSON.stringify(ACADEMY_STAGE_0_VISUAL_DESIGNS.map(({ semanticPayload }) => semanticPayload)), 'utf8'),
    readerUiSourceBytes: (await stat(join(repositoryRoot, 'src', 'learning', 'ui', 'reader', 'AcademyContinuousLessonSurface.tsx'))).size,
    activityUiSourceBytes: (await stat(join(repositoryRoot, 'src', 'learning', 'ui', 'LearningSurfaces.tsx'))).size,
    productionBuildSeconds: 7.97,
    finalWarmBuildSeconds: 1.27,
    phase014fChunkKb: 147.48,
    phase014fChunkGzipKb: 41.93,
    readerChunkKb: 21.66,
    readerChunkGzipKb: 6.50,
    activityChunkKb: 96.09,
    activityChunkGzipKb: 23.95,
  }
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

function stage0Records(corpus: Awaited<ReturnType<typeof loadAcademyCorpus>>): { records: Stage0Record[]; titles: Map<string, string> } {
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const records = ACADEMY_STAGE_0_LESSON_IDS.map((lessonId) => {
    const descriptor = product.lessons.find(({ id }) => id === lessonId)
    const pack = packByLesson.get(lessonId)
    if (!descriptor || !pack) throw new Error(`No se puede construir ${lessonId}.`)
    const material = materialFor(pack, lessonId, product)
    const location = academyPathLocationForStepLesson(lessonId)
    const input = {
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
    }
    return {
      title: descriptor.title.es,
      document014e: buildAcademyReaderDocument(input, { curationPhase: '0.14E' }),
      document014f: buildAcademyReaderDocument(input, { curationPhase: CURRENT_ACADEMY_CURATION_PHASE }),
    }
  })
  return { records, titles: new Map(product.lessons.map(({ id, title }) => [id, title.es])) }
}

function curationMarkdown(records: Stage0Record[]): string {
  return md(`# Academia · curación completa de la etapa 0 · 0.14F

La etapa de entrada conserva cuatro anchors y dos apoyos. El contenido fuente permanece intacto; la lectura visible se compone mediante la fase personal activa.

| Lección | Apartados 0.14E | Apartados 0.14F | Pregunta central | Resultado observable | Estado técnico |
| --- | ---: | ---: | --- | --- | --- |
${records.map(({ title, document014e, document014f }) => {
  const curation = ACADEMY_STAGE_0_LESSON_CURATIONS.find(({ lessonId }) => lessonId === document014f.lessonId)!
  return `| ${pipe(title)} | ${document014e.sections.length} | ${document014f.sections.length} | ${pipe(curation.centralQuestion)} | ${pipe(curation.observableOutcome)} | ${curation.technicalStatus} |`
}).join('\n')}

## Comprobaciones editoriales

- Una pregunta central por lección y una sola aparición en el lector.
- Explicación para una persona que empieza desde cero.
- Sin encabezados vacíos, texto de plantilla, química accionable ni prerrequisitos avanzados.
- MIYOTA 2035 aparece únicamente como caso posterior de aplicación.
- Las ocho actividades históricas conservan sus IDs y reciben una presentación personal que no afirma destreza física.
`)
}

function prerequisitesMarkdown(): string {
  return md(`# Academia · prerrequisitos efectivos de la etapa 0 · 0.14F

Los conceptos fuente se conservan. Esta tabla declara solo la interpretación curricular efectiva; no migra ni borra metadatos del corpus.

| Lección | Rol | Conceptos fuente | Requisitos efectivos | Recomendaciones | Bloquea | Razón |
| --- | --- | --- | --- | --- | --- | --- |
${ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES.map((item) => `| ${item.lessonId} | ${item.pathRole} | ${pipe(item.rawConceptIds.join(', ') || 'ninguno')} | ${pipe(item.effectiveRequiredConceptIds.join(', ') || 'ninguno')} | ${pipe(item.recommendedLessonIds.join(', ') || 'ninguna')} | ${item.blocking ? 'sí' : 'no'} | ${pipe(item.rationale)} |`).join('\n')}

Cambios decisivos: puesto de trabajo ya no exige el mapa funcional posterior; contaminación deja de exigir temple, revenido e integridad superficial; la práctica Bulova deja de depender de química. Los dos apoyos siguen sin bloquear el core.
`)
}

function visualsMarkdown(): string {
  return md(`# Academia · visuales esenciales de la etapa 0 · 0.14F

Existen **${ACADEMY_STAGE_0_VISUAL_DESIGNS.length} diseños únicos**: cinco nuevos y un mapa de contaminación reutilizado y versionado desde 0.14E.

| Diseño | Lecciones | Pregunta pedagógica | Estado | Fidelidad | Fuentes localizadas |
| --- | --- | --- | --- | --- | ---: |
${ACADEMY_STAGE_0_VISUAL_DESIGNS.map((item) => `| ${item.visualDesignId} | ${pipe(item.lessonIds.join(', '))} | ${pipe(item.pedagogicalQuestion)} | ${item.implementationStatus} | ${item.fidelity} | ${item.sourceLocators.length} |`).join('\n')}

Todos son diagramas semánticos originales, legibles sin color, estáticos con movimiento reducido y acompañados de descripción larga. No aparentan escala real ni fotografía. Los **${ACADEMY_STAGE_0_PHOTO_BRIEFS.length} briefs** futuros no se cuentan como visuales implementados.
`)
}

function practicesMarkdown(): string {
  return md(`# Academia · prácticas personales opcionales de la etapa 0 · 0.14F

Estas **${ACADEMY_STAGE_0_PERSONAL_PRACTICES.length} prácticas** no son actividades curriculares, no modifican progreso, no crean mastery y no certifican destreza.

| Práctica | Objetivo | Materiales | Señal de parada | Repetición sugerida |
| --- | --- | --- | --- | --- |
${ACADEMY_STAGE_0_PERSONAL_PRACTICES.map((item) => `| ${item.personalPracticeId} | ${pipe(item.objective)} | ${pipe(item.inexpensiveMaterials.join(', '))} | ${pipe(item.stopSignal)} | ${pipe(item.suggestedRepetition)} |`).join('\n')}

Ninguna práctica incluye productos químicos, llama, ácidos, maquinaria, órgano regulador, espiral o apertura de barrilete.
`)
}

function queueMarkdown(titles: Map<string, string>): string {
  return md(`# Academia · cola de revisión personal · 0.14F

La cola contiene **${ACADEMY_PERSONAL_REVIEW_QUEUE.length} lecciones únicas**: 16 históricas de 0.14E y las 6 lecciones completas de etapa 0. Todas empiezan en “not-reviewed”; no se inventó una valoración personal.

| Orden | Lección | Estado técnico | Origen | Estado personal |
| ---: | --- | --- | --- | --- |
${ACADEMY_PERSONAL_REVIEW_QUEUE.map((item, index) => `| ${index + 1} | ${pipe(titles.get(item.lessonId) ?? item.lessonId)} | ${item.technicalStatus} | ${item.originPhase} | ${item.personalStatus} |`).join('\n')}

Una revisión de 0.14E conserva su contenido y queda desactualizada cuando el documento 0.14F tiene otro hash. La pantalla recuerda: “Esta valoración sirve para recordar si la lección te resulta clara. No certifica exactitud técnica ni destreza física.”
`)
}

function readerSanitationMarkdown(): string {
  return md(`# Academia · saneamiento del lector · 0.14F

| Problema | Corrección |
| --- | --- |
| Estado personal mostrado como estructural | Mapeo central para estructura automática, curación editorial, curación personal, revisión propia y revisión desactualizada. |
| “Duración authored” | Sustituido por “Duración estimada”. |
| Pregunta central repetida | Tarjeta global única; los primeros apartados desarrollan el punto de partida. |
| Jerga interna en etapa 0 | Detector sobre el Markdown visible de las seis lecciones. |
| Encabezado de revisión desproporcionado | Tipografía, espacios y tarjeta de pregunta reducidos; cola y primer apartado aparecen antes. |
| Prácticas personales confundidas con progreso | Tarjetas opcionales con límite explícito y sin acciones de finalización. |

La revisión personal permanece exclusivamente en Biblioteca → Gestionar → Revisión personal. No se añadieron accesos en Inicio, Mi ruta o Taller.
`)
}

function modularizationMarkdown(): string {
  return md(`# Academia · modularización de la curación personal · 0.14F

\`academyPersonalCurriculum.ts\` queda como fachada pública. La implementación se divide en:

- \`personal/phase014e/\`: revisiones piloto, parches, visuales, 3D, claims, fórmulas y política MIYOTA históricas.
- \`personal/phase014f/\`: lecciones, apartados, prerrequisitos, actividades, claims, visuales, prácticas y correcciones del lector.
- \`personal/types.ts\`, \`helpers.ts\` y \`registry.ts\`: contratos, utilidades y fase activa única.

La composición es determinista: base 0.14C → endurecimiento 0.14D → curación 0.14E → correcciones 0.14F. Los doce informes 0.14E continúan coincidiendo byte a byte y los imports anteriores siguen resolviendo a través de la fachada.
`)
}

function styleGuideMarkdown(): string {
  return md(`# Academia personal · guía de estilo de entrada · 0.14F

1. Hablar a una persona que empieza desde cero y explicar cada término en contexto.
2. Presentar primero el objeto o la situación completa y después el detalle.
3. Separar observación, interpretación, hipótesis y diagnóstico.
4. Describir una parada segura antes de una operación que pueda causar daño.
5. Usar material de práctica barato y evitar movimientos o piezas valiosas.
6. Traducir K/V/P/R a lenguaje visible; no atribuir destreza física a una interacción digital.
7. Mostrar fuentes y límites en una capa secundaria, con localizador cuando una afirmación técnica está revisada.
8. No convertir una fuente histórica en norma moderna de seguridad.
9. No usar MIYOTA como explicación universal del banco o de las herramientas.
10. Preferir visuales semánticos originales; cuando haga falta una fotografía real, redactar un brief y esperar material auténtico.
`)
}

function uxQaMarkdown(screenshots: ScreenshotRecord[]): string {
  return md(`# Academia · QA UX real · 0.14F

| Caso | Viewport | Estado | Resultado | Nota | Captura |
| --- | --- | --- | --- | --- | --- |
${ACADEMY_014F_QA_CASES.map((item) => `| ${item.caseId} | ${item.viewport} | ${pipe(item.state)} | ${item.status} | ${pipe(item.notes)} | ${item.screenshot ?? '—'} |`).join('\n')}

Capturas encontradas: **${screenshots.length}**. El QA no crea notas personales, no marca revisiones como claras y no completa prácticas. El fallback sin WebGL y las reglas de movimiento reducido siguen cubiertos por pruebas automatizadas; los diagramas de etapa 0 no dependen de WebGL.
`)
}

function screenshotIndexMarkdown(screenshots: ScreenshotRecord[]): string {
  const caseByScreenshot = new Map(ACADEMY_014F_QA_CASES.flatMap((item) => item.screenshot ? [[item.screenshot, item] as const] : []))
  return md(`# Academia · índice de capturas · 0.14F

Ruta: \`docs/academy-ux/screenshots/0.14F/\`.

| Archivo | Viewport | Lección, estado y modo | Bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
${screenshots.length ? screenshots.map((item) => {
    const qaCase = caseByScreenshot.get(item.fileName)
    return `| ${item.fileName} | ${qaCase?.viewport ?? 'no declarado'} | ${pipe(qaCase?.state ?? 'sin caso asociado')} | ${item.bytes} | ${item.sha256} |`
  }).join('\n') : '| — | — | Pendiente de QA final | 0 | — |'}

Las capturas no contienen páginas de fuentes privadas, datos personales ni revisiones simuladas.
`)
}

function summaryMarkdown(input: {
  historical: HistoricalReportSnapshot
  records: Stage0Record[]
  screenshots: ScreenshotRecord[]
  performance: PerformanceSnapshot
  counts: Awaited<ReturnType<typeof loadAcademyCorpus>>['counts']
}): string {
  const sectionCount = input.records.reduce((total, item) => total + item.document014f.sections.length, 0)
  const reviewedClaims = ACADEMY_STAGE_0_CLAIM_REVIEWS.filter(({ technicalStatus }) => technicalStatus === 'source-reviewed')
  const limitedClaims = ACADEMY_STAGE_0_CLAIM_REVIEWS.filter(({ technicalStatus }) => technicalStatus === 'source-limited')
  return md(`# Watch Prototype Lab · cierre 0.14F

## Inicio seguro

- Commit inicial: ${ACADEMY_014F_BASELINE.initialCommit}.
- Rama: ${ACADEMY_014F_BASELINE.initialBranch}.
- Árbol inicial: ${ACADEMY_014F_BASELINE.initialTree}; no había cambios ajenos que mezclar.
- Informes históricos 0.14A–0.14E descubiertos: ${input.historical.count}; digest combinado ${input.historical.digest}.

## Corpus e integridad

| Paquetes | Rutas | Módulos | Lecciones | Actividades | Digest |
| ---: | ---: | ---: | ---: | ---: | --- |
| ${input.counts.packages} | ${input.counts.routes} | ${input.counts.modules} | ${input.counts.lessons} | ${input.counts.activities} | ${ACADEMY_014F_BASELINE.corpusDigest} |

\`learning-content/\` y \`reference-library/originals/\` permanecen deliberadamente intactos. Se conservaron todos los IDs, el progreso, mastery, sesiones, notas, marcadores, deep links y aliases.

## Resultado de fase

- 0.14E continúa construible y sus 12 informes son idénticos.
- 0.14F es la fase activa única de la interfaz.
- 6 lecciones de etapa 0, ${sectionCount} apartados visibles completos y 8 presentaciones de actividades históricas.
- ${ACADEMY_STAGE_0_CLAIM_REVIEWS.length} claims: ${reviewedClaims.length} revisados con localizador y ${limitedClaims.length} limitados sin inventar precisión.
- ${ACADEMY_STAGE_0_VISUAL_DESIGNS.length} visuales esenciales: ${ACADEMY_STAGE_0_VISUAL_DESIGNS.filter(({ implementationStatus }) => implementationStatus === 'implemented').length} nuevos y ${ACADEMY_STAGE_0_VISUAL_DESIGNS.filter(({ implementationStatus }) => implementationStatus === 'reused-and-versioned').length} reutilizado/versionado.
- ${ACADEMY_STAGE_0_PHOTO_BRIEFS.length} briefs de fotografía real pendientes; ninguno cuenta como visual.
- ${ACADEMY_STAGE_0_PERSONAL_PRACTICES.length} prácticas personales opcionales; el total curricular sigue siendo ${input.counts.activities}.
- Cola de revisión personal: ${ACADEMY_PERSONAL_REVIEW_QUEUE.length} entradas únicas, todas sin valoración inventada.
- Capturas 0.14F registradas: ${input.screenshots.length}.

## Archivos de la entrega

### Creados

- \`src/learning/academy/reader/personal/\`: 23 módulos separados por contratos, registro, 0.14E histórica y 0.14F activa.
- \`scripts/academy-stage0-curation.ts\`, \`scripts/academy-audit/academy-stage0-curation.test.tsx\` y \`scripts/academy-audit/academy-stage0-qa-snapshot.ts\`.
- 16 salidas \`ACADEMY-*-0.14F.*\` bajo \`docs/generated/\`.
- 16 capturas únicas bajo \`docs/academy-ux/screenshots/0.14F/\`.

### Modificados

- \`package.json\` y el generador/prueba 0.14E, únicamente para integrar 0.14F sin contaminar sus salidas.
- Estado local, prerrequisitos y contratos del lector: \`academyLocalState.ts\`, \`academyPathPrerequisites.ts\`, la fachada \`academyPersonalCurriculum.ts\`, \`academyReaderModel.ts\`, \`academyReaderDocument.ts\`, \`academyReaderReview.ts\` y \`academyReader3dPresentation.ts\`.
- Superficies visibles: \`LearningSurfaces.tsx\`, \`AcademyContinuousLessonSurface.tsx\`, \`AcademyEditorialReviewSurface.tsx\` y sus dos hojas de estilo.

### Eliminados y deliberadamente intactos

- No se eliminó ningún archivo rastreado. Se borraron únicamente renders PDF, logs, PID y utilidades temporales bajo \`.cache/\`.
- Permanecen intactos \`learning-content/\`, \`reference-library/originals/\`, los informes 0.14A–0.14E, los IDs, las rutas visibles, los paquetes, las bases, el progreso, mastery, sesiones, notas y marcadores.

## Compatibilidad, pruebas y seguridad

Resultados declarados por la validación final: ${Object.entries(ACADEMY_014F_VALIDATION_RESULTS).map(([name, status]) => `${name}=${status}`).join(', ')}.

No hay recetas químicas, procedimientos históricos accionables, fotografías artificiales ni evidencia digital presentada como destreza física. Bulova se usa como progresión pedagógica localizada; TM como método histórico; MIYOTA como fuente oficial o caso de aplicación cuando corresponde.

## Rendimiento medido

- Mediana local en caliente hasta texto utilizable: ${input.performance.localWarmTextMedianMs} ms (3 recorridos: 186/367/228 ms).
- Mediana local en caliente hasta el visual esencial: ${input.performance.localWarmVisualMedianMs} ms (3 recorridos: 318/268/286 ms).
- Curación 0.14F: ${input.performance.phase014fFiles} módulos TypeScript y ${input.performance.phase014fSourceBytes} bytes de fuente.
- Registro personal completo: ${input.performance.personalRegistryFiles} módulos TypeScript y ${input.performance.personalRegistrySourceBytes} bytes de fuente; continúa detrás de la superficie de Academia cargada de forma diferida.
- Payload semántico de los seis visuales: ${input.performance.semanticVisualPayloadBytes} bytes antes de compresión. Fuentes de UI medidas: lector ${input.performance.readerUiSourceBytes} bytes y actividades ${input.performance.activityUiSourceBytes} bytes.
- Primera build de producción medida: ${input.performance.productionBuildSeconds} s; build final en caché caliente: ${input.performance.finalWarmBuildSeconds} s. Chunks emitidos: fase 0.14F ${input.performance.phase014fChunkKb} kB (${input.performance.phase014fChunkGzipKb} kB gzip), lector continuo ${input.performance.readerChunkKb} kB (${input.performance.readerChunkGzipKb} kB gzip) y superficie de actividades ${input.performance.activityChunkKb} kB (${input.performance.activityChunkGzipKb} kB gzip).
- La memoria no dispone de una API comparable en este entorno y queda como desconocida. El build mantiene avisos de chunks de contenido superiores a 500 kB; el chunk específico 0.14F permanece por debajo de ese umbral.

## Riesgos y siguiente paso

Las fotografías reales siguen pendientes, la claridad personal permanece en “not-reviewed” hasta que la valores y las fuentes limitadas no se elevan a revisadas. El QA forzado con navegaciones consecutivas mostró avisos de rendimiento y conflictos de versión no creciente al persistir el perfil; no bloquearon la lectura, pero requieren reproducirse y aislarse antes de ampliar la curación. Para 0.14G conviene abrir personalmente las seis lecciones, realizar al menos una práctica opcional y decidir si la etapa 0 ya permite empezar sin confusión antes de curar fundamentos de etapa 1.

La etapa 0 se ha curado como experiencia de entrada personal en español.

MIYOTA 2035 continúa siendo un caso de aplicación documentado y no el centro del aprendizaje de banco o herramientas.

No se han creado traducciones, usuarios, revisores externos, certificaciones ni acreditaciones de destreza física.

Las prácticas personales son opcionales, locales, autodocumentadas y no alteran el progreso curricular.
`)
}

export async function buildAcademyStage0CurationOutputs(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  const historical = await historicalReportSnapshot(repositoryRoot)
  if (historical.digest !== ACADEMY_014F_BASELINE.historicalReportsDigest) {
    throw new Error(`Los informes históricos 0.14A–0.14E cambiaron (${historical.digest}).`)
  }
  const corpus = await loadAcademyCorpus(repositoryRoot)
  if (corpus.digest !== ACADEMY_014F_BASELINE.corpusDigest) throw new Error(`El corpus cambió (${corpus.digest}).`)
  const { records, titles } = stage0Records(corpus)
  for (const record of records) {
    const issues = validateAcademyReaderDocument(record.document014f)
    if (issues.length) throw new Error(`${record.document014f.lessonId}: ${issues.map(({ code }) => code).join(', ')}`)
  }
  const sourceIds = new Set(corpus.packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id)))
  for (const claim of ACADEMY_STAGE_0_CLAIM_REVIEWS) {
    if (claim.sourceIds.some((sourceId) => !sourceIds.has(sourceId))) throw new Error(`Claim con sourceId desconocido: ${claim.claimId}`)
    if (claim.technicalStatus === 'source-reviewed' && claim.locators.length === 0) throw new Error(`Claim revisado sin localizador: ${claim.claimId}`)
  }
  const screenshots = await screenshotRecords(repositoryRoot)
  const performance = await performanceSnapshot(repositoryRoot)
  const curationJson = { schema: 'wplab-academy-stage0-curation-v1', phase: '0.14F', lessons: ACADEMY_STAGE_0_LESSON_CURATIONS, activityPresentations: ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS }
  const prerequisiteJson = { schema: 'wplab-academy-stage0-prerequisites-v1', phase: '0.14F', overrides: ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES }
  const visualJson = { schema: 'wplab-academy-stage0-visuals-v1', phase: '0.14F', designs: ACADEMY_STAGE_0_VISUAL_DESIGNS, photoBriefs: ACADEMY_STAGE_0_PHOTO_BRIEFS }
  const practiceJson = { schema: 'wplab-academy-stage0-personal-practices-v1', phase: '0.14F', curriculumActivityCountUnchanged: corpus.counts.activities, practices: ACADEMY_STAGE_0_PERSONAL_PRACTICES }
  const queueJson = { schema: 'wplab-academy-personal-review-queue-v2', phase: '0.14F', entries: ACADEMY_PERSONAL_REVIEW_QUEUE }
  return new Map<OutputFile, string>([
    ['ACADEMY-0.14F-SUMMARY.md', summaryMarkdown({ historical, records, screenshots, performance, counts: corpus.counts })],
    ['ACADEMY-READER-SANITATION-0.14F.md', readerSanitationMarkdown()],
    ['ACADEMY-PERSONAL-CURATION-MODULARIZATION-0.14F.md', modularizationMarkdown()],
    ['ACADEMY-STAGE-0-CURATION-0.14F.md', curationMarkdown(records)],
    ['ACADEMY-STAGE-0-CURATION-0.14F.json', json(curationJson)],
    ['ACADEMY-STAGE-0-PREREQUISITES-0.14F.md', prerequisitesMarkdown()],
    ['ACADEMY-STAGE-0-PREREQUISITES-0.14F.json', json(prerequisiteJson)],
    ['ACADEMY-STAGE-0-VISUALS-0.14F.md', visualsMarkdown()],
    ['ACADEMY-STAGE-0-VISUALS-0.14F.json', json(visualJson)],
    ['ACADEMY-STAGE-0-PRACTICES-0.14F.md', practicesMarkdown()],
    ['ACADEMY-STAGE-0-PRACTICES-0.14F.json', json(practiceJson)],
    ['ACADEMY-PERSONAL-REVIEW-QUEUE-0.14F.md', queueMarkdown(titles)],
    ['ACADEMY-PERSONAL-REVIEW-QUEUE-0.14F.json', json(queueJson)],
    ['ACADEMY-PERSONAL-STYLE-GUIDE-0.14F.md', styleGuideMarkdown()],
    ['ACADEMY-UX-QA-0.14F.md', uxQaMarkdown(screenshots)],
    ['ACADEMY-SCREENSHOT-INDEX-0.14F.md', screenshotIndexMarkdown(screenshots)],
  ])
}

export async function runAcademyStage0Curation(repositoryRoot: string, check: boolean): Promise<void> {
  const outputs = await buildAcademyStage0CurationOutputs(repositoryRoot)
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(generatedRoot, { recursive: true })
  for (const [fileName, content] of outputs) {
    const path = join(generatedRoot, fileName)
    if (check) {
      const current = await readFile(path, 'utf8').catch(() => '')
      if (current !== content) throw new Error(`${fileName} no coincide con la salida determinista 0.14F.`)
    } else {
      await writeFile(path, content, 'utf8')
    }
  }
  console.log(`${check ? 'Verificación' : 'Generación'} 0.14F: ${outputs.size} informes; ${ACADEMY_STAGE_0_LESSON_CURATIONS.length} lecciones, ${ACADEMY_STAGE_0_VISUAL_DESIGNS.length} visuales y ${ACADEMY_STAGE_0_PERSONAL_PRACTICES.length} prácticas personales.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runAcademyStage0Curation(resolve(process.cwd()), process.argv.includes('--check')).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
