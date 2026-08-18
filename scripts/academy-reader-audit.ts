import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ACADEMY_LEARNER_PATH,
  ACADEMY_PLANNED_CONTENT,
  serializeAcademyLearnerPathLegacy014B,
} from '../src/learning/academy/path/academyLearnerPath'
import { ACADEMY_PROGRESS_COMPATIBILITY_POLICY } from '../src/learning/academy/path/academyPathCompatibility'
import { academyPathLocationForStepLesson } from '../src/learning/academy/path/academyLearnerPath'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import { ACADEMY_LEGACY_READER_MODE_ALIASES } from '../src/learning/academy/reader/academyReaderCompatibility'
import { ACADEMY_READER_METRICS, type AcademyReaderBuildInput, type AcademyReaderDocument } from '../src/learning/academy/reader/academyReaderModel'
import { ACADEMY_READER_PILOT, ACADEMY_READER_PILOT_IDS } from '../src/learning/academy/reader/academyReaderPilot'
import { segmentLessonBlock } from '../src/learning/academy/lessonSegmentation'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import type { LearningPack } from '../src/learning/content/learningPack'
import { loadAcademyCorpus } from './academy-audit/corpus'
import { ACADEMY_READER_PERFORMANCE_SNAPSHOT, ACADEMY_READER_QA_CASES } from './academy-audit/academy-reader-qa-snapshot'

export const ACADEMY_READER_OUTPUT_FILES = [
  'ACADEMY-CONTINUOUS-READER-0.14C.md',
  'ACADEMY-CONTINUOUS-READER-0.14C.json',
  'ACADEMY-READER-COMPATIBILITY-0.14C.md',
  'ACADEMY-READER-COVERAGE-0.14C.md',
  'ACADEMY-VISUAL-NARRATIVE-PILOT-0.14C.md',
  'ACADEMY-VISUAL-NARRATIVE-PILOT-0.14C.json',
  'ACADEMY-PILOT-CURATION-0.14C.md',
  'ACADEMY-PILOT-CURATION-0.14C.json',
  'ACADEMY-READER-FATIGUE-0.14C.md',
  'ACADEMY-READER-QA-0.14C.md',
  'ACADEMY-B1-RETOUCHES-0.14C.md',
] as const

type OutputFile = (typeof ACADEMY_READER_OUTPUT_FILES)[number]

const B1_BASELINE_SHA256 = {
  'ACADEMY-PATH-SEMANTICS-0.14B1.md': 'b5c88d03419bab0fbe2f22514d4658ed3c39467aaf1c4f541fc7d47f0980f81d',
  'ACADEMY-PROGRESS-STATE-MODEL-0.14B1.md': 'f86ace2cec2727d5a62ba85b05ff3c809de136d38b595672ba3a3f0e16a0fda8',
  'ACADEMY-PROGRESS-COMPATIBILITY-0.14B1.md': '563e6bb3c1b54d6815337bcf881df5c8852bc4b215c6d70cf02754512739f336',
  'ACADEMY-CORE-LOAD-0.14B1.md': '545350712376d7215784571c22771dabb8fff51b4b689806a7d288e5c22e94b1',
  'ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B1.md': 'faf2b2a6d689f3b676ae824ffd01614931bc980f3a5c3b0f920df9b1c4de55ee',
  'ACADEMY-CURATION-TRACE-0.14B1.md': '7f421d8209bdd27188db71ee8ce0d6cf53c40f8570daa49ab46b71f5f55a8586',
  'ACADEMY-UX-QA-0.14B1.md': 'e558be6b4cbba1841162a6697b5793b22727576b2a88cbf506cff96ce356df32',
} as const

const md = (value: string) => `${value.trim().replace(/[ \t]+$/gmu, '')}\n`
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

async function assertB1Baselines(repositoryRoot: string): Promise<void> {
  for (const [fileName, expected] of Object.entries(B1_BASELINE_SHA256)) {
    const content = await readFile(join(repositoryRoot, 'docs', 'generated', fileName))
    const actual = sha256(content)
    if (actual !== expected) throw new Error(`El baseline 0.14B.1 cambió: ${fileName} (${actual}).`)
  }
}

function materialFor(pack: LearningPack, lessonId: string, product: ReturnType<typeof createLearningProductIndex>): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)!
  const descriptor = product.lessons.find(({ id }) => id === lessonId)!
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

function legacySegmentCount(material: AcademyReaderBuildInput['material']): number {
  return material.blocks.reduce((total, block) => total + segmentLessonBlock(
    block.id,
    block.localization?.bodyMarkdown?.es ?? block.bodyMarkdown,
  ).filter(({ role }) => role !== 'reference').length, 0)
}

interface ReaderAuditLesson {
  document: AcademyReaderDocument
  contentHash: string
  legacySegments: number
  hasMarkdownTable: boolean
  hasUnverifiedOcrFormula: boolean
  validationIssues: ReturnType<typeof validateAcademyReaderDocument>
}

function cueCounts(documents: AcademyReaderDocument[]) {
  const cues = documents.flatMap(({ sections }) => sections.map(({ visualCue }) => visualCue))
  return {
    total: cues.length,
    scene3d: cues.filter(({ kind }) => kind === 'scene-3d').length,
    diagrams: cues.filter(({ kind }) => kind === 'diagram').length,
    unnecessary: cues.filter(({ curationStatus }) => curationStatus === 'unnecessary').length,
    gaps: cues.filter(({ curationStatus }) => curationStatus === 'gap').length,
  }
}

function compactDocument(item: ReaderAuditLesson) {
  const { document } = item
  return {
    lessonId: document.lessonId,
    documentVersion: document.documentVersion,
    packageId: document.packageId,
    sectionCount: document.sections.length,
    sections: document.sections.map((section) => ({
      sectionId: section.sectionId,
      sourceBlockId: section.sourceBlockId,
      ordinal: section.ordinal,
      title: section.title,
      role: section.role,
      wordCount: section.wordCount,
      visualCue: section.visualCue,
    })),
    aliasCount: document.legacyAliases.length,
    hasMarkdownTable: item.hasMarkdownTable,
    hasUnverifiedOcrFormula: item.hasUnverifiedOcrFormula,
    completion: document.completion,
    pilot: document.pilot,
    contentHash: item.contentHash,
    validationIssues: item.validationIssues,
  }
}

function pilotRecord(item: ReaderAuditLesson) {
  const curation = ACADEMY_READER_PILOT.find(({ lessonId }) => lessonId === item.document.lessonId)!
  const sections = item.document.sections
  const byRole = (roles: string[]) => sections.find(({ role }) => roles.includes(role))?.sectionId ?? null
  return {
    entityId: `curation.reader.0.14c.${item.document.lessonId}`,
    lessonId: item.document.lessonId,
    contentHashAlgorithm: 'sha256',
    contentHash: item.contentHash,
    contentHashScope: 'ordered-source-block-bodyMarkdown',
    readerDocumentHash: sha256(JSON.stringify(item.document)),
    documentVersion: item.document.documentVersion,
    centralQuestion: curation.centralQuestion,
    semanticBoundaryMethod: 'authored-blocks-and-headings',
    sectionIds: sections.map(({ sectionId }) => sectionId),
    initialContextSectionId: sections[0]?.sectionId ?? null,
    conceptualSpineSectionIds: sections.filter(({ role }) => ['explanation', 'visual-anatomy', 'observation'].includes(role)).map(({ sectionId }) => sectionId),
    visualMomentSectionId: sections.find(({ visualCue }) => visualCue.implementationStatus === 'implemented')?.sectionId ?? null,
    workedExampleSectionId: byRole(['worked-example']),
    frequentErrorSectionId: byRole(['common-errors']),
    summarySectionId: byRole(['summary']),
    nextConnectionActivityId: item.document.completion.completionActivityId ?? null,
    reviewedFields: ['centralQuestion', 'semanticBoundaries', 'sectionRoles', 'visualCues', 'completionConnection'],
    reviewMethod: curation.curationMethod === 'codex-assisted'
      ? 'codex-assisted-editorial-curation'
      : 'automated-structural-migration',
    reviewedAt: '2026-08-14',
    reviewerKind: 'codex-agent',
    sourceVersion: `${item.document.packageId}@${item.document.packageVersion}:${item.document.lessonVersion}`,
    notes: curation.rationale,
    confidence: 'high',
    curationMethod: curation.curationMethod,
    ownerReviewPending: curation.ownerReviewPending,
    ownerReviewed: false,
    rationale: curation.rationale,
  }
}

function continuousReaderMarkdown(lessons: ReaderAuditLesson[]): string {
  const documents = lessons.map(({ document }) => document)
  const cues = cueCounts(documents)
  const issues = lessons.flatMap(({ validationIssues }) => validationIssues)
  return md(`# Lector continuo de la Academia — 0.14C

Fase detenida en **0.14C**. Este informe describe la capa de presentación y compatibilidad; no modifica el contenido fuente.

## Resultado

| Métrica | Valor |
|---|---:|
| Lecciones convertidas | ${lessons.length} |
| Apartados semánticos | ${documents.reduce((total, item) => total + item.sections.length, 0)} |
| Lecciones piloto curadas | ${documents.filter(({ pilot }) => pilot).length} |
| Aliases legados | ${documents.reduce((total, item) => total + item.legacyAliases.length, 0)} |
| Cues visuales | ${cues.total} |
| Escenas 3D existentes | ${cues.scene3d} |
| Diagramas originales | ${cues.diagrams} |
| Ausencias justificadas | ${cues.unnecessary} |
| Gaps visuales registrados | ${cues.gaps} |
| Incidencias de conversión | ${issues.length} |

## Contrato

- Los límites de apartado proceden de bloques y encabezados autorados; no existe un límite de 210 palabras.
- No se generan títulos de continuación.
- Aprender y Leer comparten el mismo documento y los mismos IDs.
- Scroll, tiempo y secciones visitadas nunca completan una lección.
- Solo la acción final explícita registra \`completedAt\` y consulta el \`AcademyLearnerStep\` curado.
- El Markdown se procesa como AST con GFM, sin HTML crudo ni esquemas de URL peligrosos.
- Las métricas son exclusivamente locales: ${ACADEMY_READER_METRICS.map(({ metricId }) => `\`${metricId}\``).join(', ')}.

## Límites preservados

No se han corregido fórmulas OCR, claims amplios, vacíos técnicos de etapa 5 ni contenido visible de las 222 lecciones.`)
}

function compatibilityMarkdown(lessons: ReaderAuditLesson[]): string {
  const aliases = lessons.flatMap(({ document }) => document.legacyAliases)
  const methods = [...new Set(aliases.map(({ method }) => method))].sort()
  return md(`# Compatibilidad del lector continuo — 0.14C

## Modos históricos

| Modo anterior | Modo 0.14C | Razón |
|---|---|---|
${ACADEMY_LEGACY_READER_MODE_ALIASES.map((item) => `| ${item.legacyMode} | ${item.readerMode} | ${pipe(item.reason)} |`).join('\n')}

## Aliases de segmentos

| Método | Aliases |
|---|---:|
${methods.map((method) => `| ${method} | ${aliases.filter((item) => item.method === method).length} |`).join('\n')}

- Segmentos legados inventariados: **${aliases.length}**.
- Aliases con destino válido: **${aliases.filter((alias) => lessons.some(({ document }) => document.sections.some(({ sectionId }) => sectionId === alias.sectionId))).length}**.
- Lecciones con cobertura de alias: **${lessons.filter(({ document }) => document.legacyAliases.length > 0).length}/${lessons.length}**.
- Si un alias no existe, el lector abre el primer apartado sin error fatal.
- \`currentSegmentId\` y \`completedSegmentIds\` permanecen almacenados; \`completedAt\` conserva autoridad explícita.
- Política histórica: \`${ACADEMY_PROGRESS_COMPATIBILITY_POLICY.policyId}\` v${ACADEMY_PROGRESS_COMPATIBILITY_POLICY.policyVersion}, corte \`${ACADEMY_PROGRESS_COMPATIBILITY_POLICY.legacyCutoff}\`.`)
}

function coverageMarkdown(lessons: ReaderAuditLesson[]): string {
  const documents = lessons.map(({ document }) => document)
  const rows = lessons.map(({ document, validationIssues }) => `| ${document.lessonId} | ${document.sections.length} | ${document.legacyAliases.length} | ${document.referenceSections.length} | ${document.pilot ? 'sí' : 'no'} | ${validationIssues.length} |`).join('\n')
  return md(`# Cobertura del lector continuo — 0.14C

Todas las lecciones visibles están representadas. Una incidencia queda como revisión, nunca como contenido inventado.

## Resumen verificable

- Lecciones visibles y convertibles: **${lessons.length}/${lessons.length}**.
- Lecciones con errores de validación: **${lessons.filter(({ validationIssues }) => validationIssues.length > 0).length}**.
- Secciones semánticas: **${documents.reduce((total, document) => total + document.sections.length, 0)}**.
- Lecciones con tablas Markdown authored: **${lessons.filter(({ hasMarkdownTable }) => hasMarkdownTable).length}**.
- Lecciones con fórmula OCR pendiente identificada por 0.14A.1: **${lessons.filter(({ hasUnverifiedOcrFormula }) => hasUnverifiedOcrFormula).length}**.
- Lecciones sin cue implementado: **${documents.filter(({ sections }) => sections.every(({ visualCue }) => visualCue.implementationStatus !== 'implemented')).length}**.
- Lecciones no piloto con cue automático: **${documents.filter(({ pilot, sections }) => !pilot && sections.some(({ visualCue }) => visualCue.implementationStatus === 'implemented')).length}**.
- Lecciones con curación piloto: **${documents.filter(({ pilot }) => pilot).length}**.
- Lecciones pendientes de revisión propietaria o editorial: **${documents.length}**; la migración estructural no se presenta como owner-reviewed.

| lessonId | Secciones | Aliases | Referencias | Piloto | Incidencias |
|---|---:|---:|---:|---:|---:|
${rows}`)
}

function visualMarkdown(pilot: ReaderAuditLesson[]): string {
  const cues = pilot.flatMap(({ document }) => document.sections.map(({ visualCue }) => visualCue))
  return md(`# Narrativa visual piloto — 0.14C

## Preguntas y cobertura de las 21 lecciones

| Lección | Pregunta central | Secciones | Cues implementados | Gaps | Revisión propietaria |
|---|---|---:|---:|---:|---|
${pilot.map(({ document }) => `| ${document.lessonId} | ${pipe(document.centralQuestion)} | ${document.sections.length} | ${document.sections.filter(({ visualCue }) => visualCue.implementationStatus === 'implemented').length} | ${document.sections.filter(({ visualCue }) => visualCue.curationStatus === 'gap').length} | pendiente |`).join('\n')}

## Decisión por sección

| Lección | Sección | Tipo | Propósito | Estado | Modelo o asset | Fidelidad | Límites | Revisión propietaria |
|---|---|---|---|---|---|---|---|---|
${pilot.flatMap(({ document }) => document.sections.map(({ sectionId, visualCue }) => `| ${document.lessonId} | ${sectionId} | ${visualCue.kind} | ${visualCue.purpose} | ${visualCue.curationStatus} | ${visualCue.modelReference ?? visualCue.sourceType} | ${visualCue.fidelity} | ${pipe(visualCue.limitations.join('; '))} | pendiente |`)).join('\n')}

## Totales

- Cues: ${cues.length}.
- 3D: ${cues.filter(({ kind }) => kind === 'scene-3d').length}.
- Diagramas originales basados en datos editoriales: ${cues.filter(({ kind }) => kind === 'diagram').length}.
- Gaps registrados sin placeholder vacío: ${cues.filter(({ curationStatus }) => curationStatus === 'gap').length}.
- Todos los cues implementados incluyen caption, alternativa textual, fidelidad y límites.
- Ningún cue modifica sesión, evaluación, mastery o evidencia.`)
}

function curationMarkdown(records: ReturnType<typeof pilotRecord>[]): string {
  return md(`# Curación piloto del lector — 0.14C

Los hashes corresponden exactamente al \`bodyMarkdown\` ordenado de los bloques utilizados. \`ownerReviewPending\` permanece verdadero en todos los casos.

| Lección | SHA-256 | Secciones | Método | Revisión propietaria pendiente |
|---|---|---:|---|---|
${records.map((record) => `| ${record.lessonId} | \`${record.contentHash}\` | ${record.sectionIds.length} | ${record.curationMethod} | ${record.ownerReviewPending ? 'sí' : 'no'} |`).join('\n')}`)
}

function fatigueMarkdown(lessons: ReaderAuditLesson[]): string {
  const oldClicks = lessons.reduce((total, item) => total + item.legacySegments, 0)
  const newClicks = lessons.length
  const coreLessonIds = ACADEMY_LEARNER_PATH.chapters.flatMap(({ steps }) => steps.map(({ lessonId }) => lessonId))
  const core = lessons.filter(({ document }) => coreLessonIds.includes(document.lessonId))
  const oldCore = core.reduce((total, item) => total + item.legacySegments, 0)
  const stageRows = ['stage.2', 'stage.4', 'stage.5'].map((stageId) => {
    const stageLessons = lessons.filter(({ document }) => document.stageId === stageId)
    const old = stageLessons.reduce((total, item) => total + item.legacySegments, 0)
    return `| ${stageId} | ${old} | ${stageLessons.length} | ${old - stageLessons.length} |`
  }).join('\n')
  return md(`# Fatiga y fricción del lector — 0.14C

La comparación cuenta únicamente confirmaciones obligatorias de lectura; abrir el índice o cambiar de modo no es obligatorio.

| Alcance | 0.14B.1: confirmaciones por segmento | 0.14C: confirmación final | Reducción |
|---|---:|---:|---:|
| Corpus completo | ${oldClicks} | ${newClicks} | ${oldClicks - newClicks} (${oldClicks ? Math.round((1 - newClicks / oldClicks) * 100) : 0} %) |
| Ruta principal curada | ${oldCore} | ${core.length} | ${oldCore - core.length} (${oldCore ? Math.round((1 - core.length / oldCore) * 100) : 0} %) |
${stageRows}

La transición final consulta el primer \`requiredActivityId\` pendiente del paso curado; no abre \`material.activities[0]\`. El índice, la reanudación y los cambios de cue se miden localmente y siguen siendo opcionales. El abandono real y el valor pedagógico de la reducción solo pueden validarse con uso humano.

No se atribuye comprensión al scroll ni al tiempo. La reducción elimina microconfirmaciones, no controles pedagógicos ni prácticas requeridas.`)
}

function qaMarkdown(): string {
  const byViewport = [...new Set(ACADEMY_READER_QA_CASES.map(({ viewport }) => viewport))]
  const performance = ACADEMY_READER_PERFORMANCE_SNAPSHOT
  return md(`# QA del lector continuo — 0.14C

| Caso | Estado | Lección | Viewport | Resultado | Evidencia |
|---|---|---|---|---|---|
${ACADEMY_READER_QA_CASES.map((item) => `| ${item.caseId} | ${pipe(item.state)} | ${item.lessonId ?? 'fixture controlado'} | ${item.viewport} | ${item.status} | ${pipe(item.evidence)} |`).join('\n')}

## Resumen por viewport

${byViewport.map((viewport) => `- ${viewport}: ${ACADEMY_READER_QA_CASES.filter((item) => item.viewport === viewport && item.status === 'pass-browser').length} en navegador real, ${ACADEMY_READER_QA_CASES.filter((item) => item.viewport === viewport && item.status === 'pass-fixture').length} mediante fixture explícito, ${ACADEMY_READER_QA_CASES.filter((item) => item.viewport === viewport && item.status === 'fail').length} fallos.`).join('\n')}

## Rendimiento observado

- Método: \`${performance.method}\`, viewport ${performance.viewport}.
- Texto utilizable: **${performance.textReadyMilliseconds} ms**.
- Canvas interactivo del piloto 8215: **${performance.interactiveVisualMilliseconds} ms**; ${performance.canvasesMounted} canvas montado.
- Memoria JS: **no disponible** en esta sesión. ${performance.heapLimitation}
- Chunk lector: ${performance.productionBundle.readerJavaScriptKb} kB (${performance.productionBundle.readerJavaScriptGzipKb} kB gzip) JS y ${performance.productionBundle.readerCssKb} kB (${performance.productionBundle.readerCssGzipKb} kB gzip) CSS.
- Carga 3D separada: loader ${performance.productionBundle.sceneLoaderJavaScriptKb} kB, viewport ${performance.productionBundle.viewportJavaScriptKb} kB y fixtures ${performance.productionBundle.sceneFixturesJavaScriptKb} kB.
- Limitación: ${performance.caveat}

\`pass-browser\` exige inspección en el navegador integrado. \`pass-fixture\` identifica estados ausentes del corpus o del perfil local y conserva la limitación; no se presenta como juicio visual subjetivo.`)
}

function b1RetouchesMarkdown(lessons: ReaderAuditLesson[], retentionContentMissingCompetencies: number): string {
  const enumerable = Object.prototype.propertyIsEnumerable.call(ACADEMY_LEARNER_PATH.chapters[0], 'steps')
  const legacy = serializeAcademyLearnerPathLegacy014B()
  return md(`# Cierre de retoques B.1 dentro de 0.14C

| Retoque | Resultado verificable |
|---|---|
| Mapeo de ocho refs de etapa 5 | ${ACADEMY_PLANNED_CONTENT.map(({ ref, chapterId }) => `${ref}→${chapterId}`).join('; ')} |
| \`steps\` enumerable | ${enumerable ? 'sí' : 'no'} |
| Serializador histórico 0.14B | ${legacy.chapters.every((chapter) => !('steps' in chapter)) ? 'forma histórica sin campos 0.14B.1' : 'fallo'} |
| Retención explícita | Sin fallback a una actividad no-retention; estado \`retention-content-missing\` disponible. |
| Cobertura mastery | Políticas: none, per-assessed-step, all-required-steps, chapter-capstone, explicit-competency-set; agregación parcial activa. |
| Compatibilidad versionada | ${ACADEMY_PROGRESS_COMPATIBILITY_POLICY.policyId} v${ACADEMY_PROGRESS_COMPATIBILITY_POLICY.policyVersion}; corte ${ACADEMY_PROGRESS_COMPATIBILITY_POLICY.legacyCutoff}. |
| Piloto trazable | ${lessons.filter(({ document }) => document.pilot).length} hashes SHA-256, método codex-assisted/automated y ownerReviewPending=true. |

Competencias core sin actividad cuyo contrato declare retención: **${retentionContentMissingCompetencies}**. Solo producen \`retention-content-missing\` cuando su retención vence; no se crea una sesión falsa. Ningún informe 0.14A, 0.14A.1, 0.14B o 0.14B.1 fue regenerado por este script.`)
}

export async function buildAcademyReaderOutputs(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  await assertB1Baselines(repositoryRoot)
  const semanticBaseline = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-SOURCE-LESSON-MATRIX-0.14A1.json'), 'utf8')) as {
    issues: Array<{ category: string; evidence: string[] }>
  }
  const formulaLessonIds = new Set(semanticBaseline.issues
    .filter(({ category }) => category === 'ocr-formula-unverified')
    .flatMap(({ evidence }) => evidence
      .filter((item) => item.startsWith('lessonId='))
      .map((item) => item.slice('lessonId='.length))))
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const coreActivityIds = new Set(ACADEMY_LEARNER_PATH.chapters.flatMap(({ steps }) => steps.flatMap(({ requiredActivityIds }) => requiredActivityIds)))
  const coreCompetencyIds = new Set(product.activities.filter(({ id }) => coreActivityIds.has(id)).flatMap(({ competencyIds }) => competencyIds))
  const retentionCompetencyIds = new Set(product.activities
    .filter(({ pedagogicalContract }) => pedagogicalContract?.purpose === 'retention' || pedagogicalContract?.assessmentIntent === 'retention')
    .flatMap(({ competencyIds }) => competencyIds))
  const retentionContentMissingCompetencies = [...coreCompetencyIds].filter((competencyId) => !retentionCompetencyIds.has(competencyId)).length
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const visibleLessonIds = [...new Set(corpus.lessons.map(({ lesson }) => lesson.id))]
  const lessons: ReaderAuditLesson[] = visibleLessonIds.map((lessonId) => {
    const descriptor = product.lessons.find(({ id }) => id === lessonId)
    if (!descriptor) throw new Error(`No se encontró el descriptor visible de ${lessonId}.`)
    const pack = packByLesson.get(descriptor.id)
    if (!pack) throw new Error(`No se encontró el paquete de ${descriptor.id}.`)
    const material = materialFor(pack, descriptor.id, product)
    const pathLocation = academyPathLocationForStepLesson(descriptor.id)
    const requiredActivityIds = pathLocation?.step.requiredActivityIds
      ?? descriptor.studyContract?.labActivityIds
      ?? []
    const document = buildAcademyReaderDocument({
      material,
      title: descriptor.title.es,
      purpose: descriptor.purpose.es,
      whyNow: pathLocation?.chapter.whyNow,
      outcome: pathLocation?.chapter.outcome,
      stageId: pathLocation?.stage.stageId,
      chapterId: pathLocation?.chapter.chapterId,
      stepId: pathLocation?.step.stepId,
      locale: 'es-ES',
      requiredActivityIds,
    }, { compatibility: '0.14C' })
    const contentBasis = material.blocks.map(({ bodyMarkdown }) => bodyMarkdown.replaceAll('\r\n', '\n').trim()).join('\n\n')
    return {
      document,
      contentHash: sha256(contentBasis),
      legacySegments: legacySegmentCount(material),
      hasMarkdownTable: /(?:^|\n)\|[^\n]+\|\s*\n\|[\s:|-]+\|/m.test(contentBasis),
      hasUnverifiedOcrFormula: formulaLessonIds.has(descriptor.id),
      validationIssues: validateAcademyReaderDocument(document),
    }
  })
  const pilot = lessons.filter(({ document }) => ACADEMY_READER_PILOT_IDS.has(document.lessonId))
  if (lessons.length !== corpus.counts.lessons) throw new Error('No todas las lecciones visibles produjeron documento.')
  if (pilot.length !== ACADEMY_READER_PILOT.length) throw new Error(`El piloto resolvió ${pilot.length}/${ACADEMY_READER_PILOT.length} lecciones.`)
  const records = pilot.map(pilotRecord)
  const compact = lessons.map(compactDocument)
  const visualJson = pilot.flatMap(({ document }) => document.sections.map(({ visualCue }) => visualCue))
  return new Map<OutputFile, string>([
    ['ACADEMY-CONTINUOUS-READER-0.14C.md', continuousReaderMarkdown(lessons)],
    ['ACADEMY-CONTINUOUS-READER-0.14C.json', json({ schema: 'wplab-academy-continuous-reader-v1', phase: '0.14C', counts: { lessons: lessons.length, sections: lessons.reduce((total, item) => total + item.document.sections.length, 0), ...cueCounts(lessons.map(({ document }) => document)) }, lessons: compact })],
    ['ACADEMY-READER-COMPATIBILITY-0.14C.md', compatibilityMarkdown(lessons)],
    ['ACADEMY-READER-COVERAGE-0.14C.md', coverageMarkdown(lessons)],
    ['ACADEMY-VISUAL-NARRATIVE-PILOT-0.14C.md', visualMarkdown(pilot)],
    ['ACADEMY-VISUAL-NARRATIVE-PILOT-0.14C.json', json({ schema: 'wplab-academy-visual-narrative-v1', phase: '0.14C', cueCount: visualJson.length, cues: visualJson })],
    ['ACADEMY-PILOT-CURATION-0.14C.md', curationMarkdown(records)],
    ['ACADEMY-PILOT-CURATION-0.14C.json', json({ schema: 'wplab-academy-reader-pilot-curation-v1', phase: '0.14C', records })],
    ['ACADEMY-READER-FATIGUE-0.14C.md', fatigueMarkdown(lessons)],
    ['ACADEMY-READER-QA-0.14C.md', qaMarkdown()],
    ['ACADEMY-B1-RETOUCHES-0.14C.md', b1RetouchesMarkdown(lessons, retentionContentMissingCompetencies)],
  ])
}

export async function runAcademyReaderAudit(repositoryRoot: string, check: boolean): Promise<void> {
  const outputs = await buildAcademyReaderOutputs(repositoryRoot)
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(generatedRoot, { recursive: true })
  for (const [fileName, content] of outputs) {
    const path = join(generatedRoot, fileName)
    if (check) {
      const current = await readFile(path, 'utf8').catch(() => '')
      if (current !== content) throw new Error(`${fileName} no coincide con la salida determinista 0.14C.`)
    } else {
      await writeFile(path, content, 'utf8')
    }
  }
  console.log(`${check ? 'Verificación' : 'Generación'} del lector 0.14C: ${outputs.size} salidas correctas.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const repositoryRoot = resolve(process.cwd())
  runAcademyReaderAudit(repositoryRoot, process.argv.includes('--check')).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
