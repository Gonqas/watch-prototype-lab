import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ACADEMY_014H_PHASE_REGISTRY_SNAPSHOT,
  ACADEMY_COMPATIBILITY_PHASES,
  ACADEMY_CURATION_LAYER_REGISTRY,
  ACADEMY_PERSONAL_REVIEW_QUEUE_014H,
  ACADEMY_READER_CURATION_PHASES,
  ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_2_CATALOG,
  ACADEMY_STAGE_2_CHAPTER_SEQUENCE,
  ACADEMY_STAGE_2_CLAIM_REVIEWS,
  ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT,
  ACADEMY_STAGE_2_FORMULA_REVIEWS,
  ACADEMY_STAGE_2_LESSON_CURATIONS,
  ACADEMY_STAGE_2_PERSONAL_PRACTICES,
  ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_2_VISUAL_DESIGNS,
  ACADEMY_STAGE_2_FINAL_CHECKPOINT,
  CURRENT_ACADEMY_CURATION_PHASE,
  academyPhaseIncludes,
  academyPhaseLayers,
  academyPhaseRank,
} from '../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderCurationPhase, AcademyReaderDocument } from '../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { ACADEMY_014H_QA_CASES } from './academy-audit/academy-014h-qa-snapshot'
import { loadAcademyCorpus } from './academy-audit/corpus'

export const ACADEMY_014H_OUTPUT_FILES = [
  'ACADEMY-0.14H-SUMMARY.md',
  'ACADEMY-CURATION-PHASE-REGISTRY-0.14H.md', 'ACADEMY-CURATION-PHASE-REGISTRY-0.14H.json',
  'ACADEMY-STAGE-2-CURATION-0.14H.md', 'ACADEMY-STAGE-2-CURATION-0.14H.json',
  'ACADEMY-STAGE-2-PREREQUISITES-0.14H.md', 'ACADEMY-STAGE-2-PREREQUISITES-0.14H.json',
  'ACADEMY-STAGE-2-VISUALS-0.14H.md', 'ACADEMY-STAGE-2-VISUALS-0.14H.json',
  'ACADEMY-STAGE-2-ACTIVITIES-0.14H.md', 'ACADEMY-STAGE-2-ACTIVITIES-0.14H.json',
  'ACADEMY-STAGE-2-PRACTICES-0.14H.md', 'ACADEMY-STAGE-2-PRACTICES-0.14H.json',
  'ACADEMY-STAGE-2-CLAIMS-0.14H.md', 'ACADEMY-STAGE-2-CLAIMS-0.14H.json',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14H.md', 'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14H.json',
  'ACADEMY-UX-QA-0.14H.md', 'ACADEMY-SCREENSHOT-INDEX-0.14H.md',
] as const

export const ACADEMY_014H_BASELINE = {
  head: '1a61c5d887ff6a2a5bd96b02dc026487b8725dde', initialWorktree: 'clean', previousPhase: '0.14G',
  corpusCounts: { packages: 8, routes: 24, modules: 217, lessons: 222, activities: 289 },
  corpusDigest: '1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e',
  historicalReports: { count: 113, digest: '14403455966733919f964b2c3cb7dd2307be068246aa3f735f8d1858660843df' },
  protected: {
    learningContent: { count: 4012, digest: '16291f86a7cb082d47fa65016d838b72e19cf3701afe33bc27ad226cf41af1d4' },
    originals: { count: 7, digest: '633edd7f7027a61587b1b944b0b3bf8562819697144b449e4dc9aed1db4ab6b7' },
  },
} as const

const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const md = (value: string) => `${value.trim()}\n`
const pipe = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', '<br>')

async function walk(root: string): Promise<string[]> {
  const names = await readdir(root)
  const result: string[] = []
  for (const name of names.sort()) {
    const path = join(root, name)
    const info = await stat(path)
    if (info.isDirectory()) result.push(...await walk(path))
    else result.push(path)
  }
  return result
}

async function treeSnapshot(root: string) {
  const files = await walk(root)
  const rows = await Promise.all(files.map(async (file) => `${relative(root, file).replaceAll('\\', '/')}:${sha256(await readFile(file))}`))
  return { count: files.length, digest: sha256(rows.join('\n')) }
}

async function historicalReportSnapshot(repositoryRoot: string) {
  const root = join(repositoryRoot, 'docs', 'generated')
  const fileNames = (await readdir(root)).filter((name) => !name.startsWith('APRENDER-') && !name.includes('0.14H')).sort()
  const rows = await Promise.all(fileNames.map(async (name) => `${name}:${sha256(await readFile(join(root, name)))}`))
  return { count: fileNames.length, digest: sha256(rows.join('\n')), fileNames }
}

async function screenshotRows(repositoryRoot: string) {
  const root = join(repositoryRoot, 'docs', 'academy-ux', 'screenshots', '0.14H')
  const names = await readdir(root).catch(() => [])
  return Promise.all(names.filter((name) => name.toLowerCase().endsWith('.png')).sort().map(async (fileName) => {
    const content = await readFile(join(root, fileName))
    return { fileName, bytes: content.byteLength, sha256: sha256(content) }
  }))
}

function materialFor(pack: LearningPack, lessonId: string, product: ReturnType<typeof mergeLearningProductIndexes>): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!lesson || !descriptor) throw new Error(`Lección ausente: ${lessonId}`)
  const blocks = pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
  const lessonMarkdown = blocks.map(({ bodyMarkdown }) => bodyMarkdown).join('\n')
  const sourceIds = new Set([...(lesson.authoring?.sourceIds ?? []), ...blocks.flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id)))])
  return {
    packageId: pack.manifest.id, packageVersion: pack.manifest.packageVersion, pack, lesson, blocks,
    activities: descriptor.activityIds.flatMap((activityId) => product.activities.filter(({ id }) => id === activityId)),
    sources: pack.sources.filter(({ id }) => sourceIds.has(id)), glossary: pack.glossary.filter(({ id }) => lessonMarkdown.includes(`{{term:${id}}}`)),
  }
}

function documentFor(product: ReturnType<typeof mergeLearningProductIndexes>, pack: LearningPack, lessonId: string, phase: AcademyReaderCurationPhase): AcademyReaderDocument {
  const descriptor = product.lessons.find(({ id }) => id === lessonId)!
  return buildAcademyReaderDocument({ material: materialFor(pack, lessonId, product), title: descriptor.title.es, purpose: descriptor.purpose.es, locale: 'es-ES', requiredActivityIds: descriptor.studyContract?.labActivityIds }, { curationPhase: phase })
}

export async function buildAcademy014HOutputs(repositoryRoot: string): Promise<Map<string, string>> {
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const historical = await historicalReportSnapshot(repositoryRoot)
  const learningContent = await treeSnapshot(join(repositoryRoot, 'learning-content'))
  const originals = await treeSnapshot(join(repositoryRoot, 'reference-library', 'originals'))
  const screenshots = await screenshotRows(repositoryRoot)
  const documents = ACADEMY_STAGE_2_LESSON_CURATIONS.map(({ lessonId }) => {
    const pack = packByLesson.get(lessonId)
    if (!pack) throw new Error(`Paquete ausente: ${lessonId}`)
    const byPhase = Object.fromEntries(['0.14E','0.14F','0.14G','0.14H'].map((phase) => [phase, documentFor(product, pack, lessonId, phase as AcademyReaderCurationPhase)])) as Record<'0.14E'|'0.14F'|'0.14G'|'0.14H', AcademyReaderDocument>
    return { lessonId, byPhase }
  })
  const validationIssues = documents.flatMap(({ byPhase }) => validateAcademyReaderDocument(byPhase['0.14H']))
  const documentRows = documents.map(({ lessonId, byPhase }) => ({
    lessonId, sections: byPhase['0.14H'].sections.length, documentVersion: byPhase['0.14H'].documentVersion,
    contentHash: byPhase['0.14H'].contentHash,
    historical: Object.fromEntries(Object.entries(byPhase).filter(([phase]) => phase !== '0.14H').map(([phase, document]) => [phase, { documentVersion: document.documentVersion, contentHash: document.contentHash }])),
  }))
  const anchorCount = ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'anchor').length
  const supportCount = ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'support').length
  const optionalCount = ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'optional-branch').length
  const sectionCount = documentRows.reduce((sum, item) => sum + item.sections, 0)
  const outputs = new Map<string, string>()

  const registryJson = { ...ACADEMY_014H_PHASE_REGISTRY_SNAPSHOT, helpers: ['academyPhaseRank','academyPhaseIncludes','academyPhaseIsBefore','academyPhaseIsAfter','academyPhaseLayers'], matrix: ACADEMY_READER_CURATION_PHASES.map((phase) => ({ phase, rank: academyPhaseRank(phase), includes: ACADEMY_READER_CURATION_PHASES.filter((candidate) => academyPhaseIncludes(phase, candidate)), layers: academyPhaseLayers(phase).map(({ layerId }) => layerId) })) }
  outputs.set('ACADEMY-CURATION-PHASE-REGISTRY-0.14H.json', json(registryJson))
  outputs.set('ACADEMY-CURATION-PHASE-REGISTRY-0.14H.md', md(`# Registro acumulativo de fases · 0.14H

## Antes y después

| Propiedad | Baseline 0.14G | 0.14H |
|---|---|---|
| Fase activa | 0.14G | ${CURRENT_ACADEMY_CURATION_PHASE} |
| Orden personal | 0.14E, 0.14G | 0.14E, 0.14F, 0.14G, 0.14H |
| Comparación | indexOf sin validar; -1 podía parecer válido | rango explícito; vacío y desconocido producen error |
| Composición | condicionales repetidos en el constructor | capas declarativas C→D→E→F→G→H |

Compatibilidad: ${ACADEMY_COMPATIBILITY_PHASES.join(', ')}. Fases de lector: ${ACADEMY_READER_CURATION_PHASES.join(' → ')}.

| Rango | Fase | Capa | Función |
|---:|---|---|---|
${ACADEMY_CURATION_LAYER_REGISTRY.map((layer, index) => `| ${index} | ${layer.phase} | ${layer.layerId} | ${pipe(layer.purpose)} |`).join('\n')}

Las construcciones explícitas 0.14E, 0.14F y 0.14G siguen componiendo exactamente hasta su capa; activar 0.14H no las redirige a la fase actual.`))

  const curationJson = { schema: 'wplab-academy-stage2-curation-v1', phase: '0.14H', sequence: ACADEMY_STAGE_2_CHAPTER_SEQUENCE, counts: { lessons: ACADEMY_STAGE_2_CATALOG.length, anchors: anchorCount, supports: supportCount, optionalBranches: optionalCount, sections: sectionCount }, lessons: ACADEMY_STAGE_2_LESSON_CURATIONS, checkpoint: ACADEMY_STAGE_2_FINAL_CHECKPOINT, documents: documentRows, validationIssues }
  outputs.set('ACADEMY-STAGE-2-CURATION-0.14H.json', json(curationJson))
  outputs.set('ACADEMY-STAGE-2-CURATION-0.14H.md', md(`# Curación completa de etapa 2 · 0.14H

- Secuencia: 2.1 energía → 2.2 engranajes → 2.3 escape → 2.4 oscilador → 2.5 minutería y mando → 2.6 automático y calendario.
- Cobertura: ${anchorCount} anclas, ${supportCount} apoyos y ${optionalCount} ramas opcionales; ${sectionCount} apartados curados.
- Las seis lecciones piloto de 0.14E se refinan con procedencia explícita, no se duplican ni pierden sus IDs.

| Capítulo | Rol | Lección | Apartados | Resultado observable |
|---|---|---|---:|---|
${ACADEMY_STAGE_2_LESSON_CURATIONS.map((item) => `| ${item.chapterId} | ${item.pathRole} | \`${item.lessonId}\` | ${item.sections.length} | ${pipe(item.observableOutcome)} |`).join('\n')}

Las ramas de apoyo y opcionales son no bloqueantes. La etapa 3 conserva su contenido previo: 0.14H solo ofrece la transición desde el cierre de etapa 2.`))

  outputs.set('ACADEMY-STAGE-2-PREREQUISITES-0.14H.json', json({ schema: 'wplab-academy-stage2-prerequisites-v1', phase: '0.14H', chapterSequence: ACADEMY_STAGE_2_CHAPTER_SEQUENCE, overrides: ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES }))
  outputs.set('ACADEMY-STAGE-2-PREREQUISITES-0.14H.md', md(`# Prerrequisitos de etapa 2 · 0.14H

| Lección | Capítulo | Rol | Bloqueante | Conceptos efectivos | Razón |
|---|---|---|---:|---|---|
${ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES.map((item) => `| \`${item.lessonId}\` | ${ACADEMY_STAGE_2_CATALOG.find(({ lessonId }) => lessonId === item.lessonId)?.chapterId} | ${item.pathRole} | ${item.blocking ? 'sí' : 'no'} | ${item.effectiveRequiredConceptIds.join('<br>') || 'ninguno'} | ${pipe(item.rationale)} |`).join('\n')}

No se exige un detalle posterior para introducir una visión general. Apoyos y ramas pueden consultarse sin afectar la finalización.`))

  outputs.set('ACADEMY-STAGE-2-VISUALS-0.14H.json', json({ schema: 'wplab-academy-stage2-visuals-v1', phase: '0.14H', essentialQuestionCount: ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT, designs: ACADEMY_STAGE_2_VISUAL_DESIGNS, threeDimensionalPolicy: { reusedState: 'visual.train.3d-overview', fidelity: 'conceptual', newCalibreFixture: false } }))
  outputs.set('ACADEMY-STAGE-2-VISUALS-0.14H.md', md(`# Visuales de etapa 2 · 0.14H

- Preguntas visuales esenciales: ${ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT}.
- Diseños versionados: ${ACADEMY_STAGE_2_VISUAL_DESIGNS.length}; reutilizados: ${ACADEMY_STAGE_2_VISUAL_DESIGNS.filter(({ implementationStatus }) => implementationStatus === 'reused-and-versioned').length}; nuevos: ${ACADEMY_STAGE_2_VISUAL_DESIGNS.filter(({ implementationStatus }) => implementationStatus === 'implemented').length}.
- El único 3D reutilizado es la vista conceptual del tren de 0.14E; no se crea un calibre ficticio.

| Pregunta | Diseño | Lecciones | Estado | Fuente verificada | Límite |
|---|---|---:|---|---|---|
${ACADEMY_STAGE_2_VISUAL_DESIGNS.map((item) => `| ${item.questionGroupId} | \`${item.visualDesignId}\` | ${item.lessonIds.length} | ${item.implementationStatus} | ${item.sourceLocators.map(({ sourceId, page, figure }) => `${sourceId} · ${page ?? ''}${figure ? ` · ${figure}` : ''}`).join('<br>')} | ${pipe(item.limitations.join(' '))} |`).join('\n')}

Todos los gráficos son SVG semántico generado desde datos, tienen descripción larga, etiquetas independientes del color, reflujo móvil y estado estático seguro con movimiento reducido.`))

  outputs.set('ACADEMY-STAGE-2-ACTIVITIES-0.14H.json', json({ schema: 'wplab-academy-stage2-activities-v1', phase: '0.14H', presentations: ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS }))
  outputs.set('ACADEMY-STAGE-2-ACTIVITIES-0.14H.md', md(`# Actividades de etapa 2 · 0.14H

Se conservan ${ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS.length} activityId requeridos. Los overlays aclaran propósito, ayuda, éxito, feedback, límites y evidencia K/V/R. Ninguno añade P.

| ActivityId | Lección | Modalidades | Física | Propósito |
|---|---|---|---:|---|
${ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS.map((item) => `| \`${item.activityId}\` | \`${item.lessonId}\` | ${item.evidenceProfile.modalities.join('+')} | ${item.evidenceProfile.physicalExecutionRequired ? 'sí' : 'no'} | ${pipe(item.purpose)} |`).join('\n')}`))

  outputs.set('ACADEMY-STAGE-2-PRACTICES-0.14H.json', json({ schema: 'wplab-academy-stage2-personal-practices-v1', phase: '0.14H', practices: ACADEMY_STAGE_2_PERSONAL_PRACTICES }))
  outputs.set('ACADEMY-STAGE-2-PRACTICES-0.14H.md', md(`# Prácticas personales opcionales · etapa 2 · 0.14H

| Práctica | Lecciones | Objetivo | Señal de parada |
|---|---:|---|---|
${ACADEMY_STAGE_2_PERSONAL_PRACTICES.map((item) => `| \`${item.personalPracticeId}\` | ${item.lessonIds.length} | ${pipe(item.objective)} | ${pipe(item.stopSignal)} |`).join('\n')}

Las ${ACADEMY_STAGE_2_PERSONAL_PRACTICES.length} prácticas son opcionales, locales y no certificadas. No modifican progreso, mastery, finalización ni evidencia física; excluyen abrir barriletes y tocar escape o espiral.`))

  outputs.set('ACADEMY-STAGE-2-CLAIMS-0.14H.json', json({ schema: 'wplab-academy-stage2-claims-v1', phase: '0.14H', claims: ACADEMY_STAGE_2_CLAIM_REVIEWS, formulas: ACADEMY_STAGE_2_FORMULA_REVIEWS }))
  outputs.set('ACADEMY-STAGE-2-CLAIMS-0.14H.md', md(`# Claims y fórmulas de etapa 2 · 0.14H

| Claim | Lección | Verificación | Localizador | Aplicabilidad | Límite |
|---|---|---|---|---|---|
${ACADEMY_STAGE_2_CLAIM_REVIEWS.map((item) => `| \`${item.claimId}\` | \`${item.lessonId}\` | ${item.verificationStatus} | ${item.locators.map(({ sourceId, page, figure }) => `${sourceId} · ${page ?? ''}${figure ? ` · ${figure}` : ''}`).join('<br>')} | ${pipe(item.applicability)} | ${pipe(item.limitations.join(' '))} |`).join('\n')}

## Fórmulas

| Fórmula | Decisión | Fuente | Razón |
|---|---|---|---|
${ACADEMY_STAGE_2_FORMULA_REVIEWS.map((item) => `| \`${item.formulaId}\` | ${item.decision} | ${item.sourceId} | ${pipe(item.reason)} |`).join('\n')}

Las cuatro revisiones no OCR de 0.14E se conservan. Cuatro candidatos de Daniels quedan ` + '`not-used`' + `: no se ha verificado visualmente una fórmula concreta y aplicable. No se cierran artificialmente los 17 gaps OCR históricos.`))

  outputs.set('ACADEMY-PERSONAL-REVIEW-QUEUE-0.14H.json', json({ schema: 'wplab-academy-personal-review-queue-v1', phase: '0.14H', queue: ACADEMY_PERSONAL_REVIEW_QUEUE_014H }))
  outputs.set('ACADEMY-PERSONAL-REVIEW-QUEUE-0.14H.md', md(`# Cola de revisión personal · 0.14H

- Entradas únicas: ${ACADEMY_PERSONAL_REVIEW_QUEUE_014H.length}.
- Lecciones con origen activo 0.14H: ${ACADEMY_PERSONAL_REVIEW_QUEUE_014H.filter(({ originPhase }) => originPhase === '0.14H').length}.
- Las seis pilotos mecánicas de 0.14E se actualizan por lessonId y no se duplican.
- Todos los estados personales siguen ` + '`not-reviewed`' + `; Codex no inventa validación humana.

| Lección | Origen | Estado técnico | Estado personal |
|---|---|---|---|
${ACADEMY_PERSONAL_REVIEW_QUEUE_014H.map((item) => `| \`${item.lessonId}\` | ${item.originPhase} | ${item.technicalStatus} | ${item.personalStatus} |`).join('\n')}`))

  outputs.set('ACADEMY-UX-QA-0.14H.md', md(`# QA de experiencia · 0.14H

| Caso | Captura | Viewport | Tema | Movimiento reducido | Estado | Observación |
|---|---|---|---|---:|---|---|
${ACADEMY_014H_QA_CASES.map((item) => `| ${item.caseId} | \`${item.fileName}\` | ${item.viewport} | ${item.theme} | ${item.reducedMotion ? 'sí' : 'no'} | ${item.status} | ${pipe(item.notes)} |`).join('\n')}

Los estados se actualizan únicamente después de inspeccionar el navegador real. Accesibilidad cubierta: teclado, foco, reflujo al 200 %, tema oscuro, movimiento reducido, descripción textual y fallback sin visual.`))

  outputs.set('ACADEMY-SCREENSHOT-INDEX-0.14H.md', md(`# Índice de capturas · 0.14H

Directorio: ` + '`docs/academy-ux/screenshots/0.14H/`' + `

| Archivo | Bytes | SHA-256 |
|---|---:|---|
${screenshots.length ? screenshots.map((item) => `| \`${item.fileName}\` | ${item.bytes} | \`${item.sha256}\` |`).join('\n') : '| — | 0 | QA pendiente |'}

Las capturas de fases anteriores permanecen intactas. Ninguna captura contiene fuentes originales ni datos personales reales.`))

  outputs.set('ACADEMY-0.14H-SUMMARY.md', md(`# Watch Prototype Lab 0.14H · resumen

## Resultado

- Estado inicial: commit \`${ACADEMY_014H_BASELINE.head}\`, rama main, worktree ${ACADEMY_014H_BASELINE.initialWorktree}; baseline funcional 0.14G.
- Corpus: ${corpus.counts.packages} paquetes, ${corpus.counts.routes} rutas, ${corpus.counts.modules} módulos, ${corpus.counts.lessons} lecciones y ${corpus.counts.activities} actividades; digest \`${corpus.digest}\`.
- Informes históricos 0.14A–0.14G: ${historical.count} archivos, digest \`${historical.digest}\`.
- Protección: learning-content ${learningContent.count} archivos / \`${learningContent.digest}\`; originales ${originals.count} / \`${originals.digest}\`.
- Etapa 2: ${anchorCount} anclas, ${supportCount} apoyos, ${optionalCount} ramas, ${sectionCount} apartados, ${ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS.length} overlays, ${ACADEMY_STAGE_2_PERSONAL_PRACTICES.length} prácticas personales, ${ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT} preguntas visuales y ${ACADEMY_STAGE_2_CLAIM_REVIEWS.length} claims.
- Validación estructural del lector H: ${validationIssues.length} incidencias.
- Capturas registradas: ${screenshots.length}.

## Declaraciones explícitas

0.14H corrige el versionado acumulativo y cierra la etapa 2 completa sin iniciar la etapa 3.

La Academia continúa siendo personal, local y en español.

La etapa 2 explica la cadena mecánica completa desde la energía almacenada hasta la indicación, incluyendo escape, oscilador, mando, automático y calendario.

MIYOTA permanece como ejemplo documentado y laboratorio de aplicación, no como centro curricular.

No se han creado traducciones, usuarios, revisores externos, certificaciones ni validaciones ficticias.

Las prácticas personales siguen siendo opcionales y no modifican progreso, mastery ni evidencia física.`))

  return new Map(ACADEMY_014H_OUTPUT_FILES.map((name) => [name, outputs.get(name)!]))
}

async function run() {
  const root = resolve(process.cwd())
  const outputs = await buildAcademy014HOutputs(root)
  if ([...outputs.keys()].some((name) => !ACADEMY_014H_OUTPUT_FILES.includes(name as typeof ACADEMY_014H_OUTPUT_FILES[number])) || outputs.size !== ACADEMY_014H_OUTPUT_FILES.length) throw new Error('El conjunto de salidas 0.14H no coincide con el contrato.')
  const check = process.argv.includes('--check')
  const generatedRoot = join(root, 'docs', 'generated')
  await mkdir(generatedRoot, { recursive: true })
  const mismatches: string[] = []
  for (const name of ACADEMY_014H_OUTPUT_FILES) {
    const expected = outputs.get(name)!
    if (check) {
      const actual = await readFile(join(generatedRoot, name), 'utf8').catch(() => '')
      if (actual !== expected) mismatches.push(name)
    } else await writeFile(join(generatedRoot, name), expected, 'utf8')
  }
  if (mismatches.length) throw new Error(`Salidas 0.14H desactualizadas: ${mismatches.join(', ')}`)
  console.log(`Academia 0.14H: ${outputs.size} informes ${check ? 'verificados' : 'generados'}.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) run().catch((error) => { console.error(error); process.exitCode = 1 })
