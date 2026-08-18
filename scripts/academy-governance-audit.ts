import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadAcademyCorpus } from './academy-audit/corpus'
import { analyzeMatrices, type ActivityMatrixRow, type LessonMatrixRow, type MatrixAnalysis } from './academy-audit/matrices'
import { buildSourceRegistry, type SourceRegistryResult } from './academy-audit/sources'
import { CHICAGO_INVENTORY, CHICAGO_SUPPORTING_DOCUMENTS, DANIELS_CHAPTERS } from './academy-audit/sourceInventory'

const OUTPUT_FILES = [
  'ACADEMY-SOURCE-REGISTRY.md',
  'ACADEMY-SOURCE-REGISTRY.json',
  'CHICAGO-SOURCE-INVENTORY.md',
  'DANIELS-SOURCE-INVENTORY.md',
  'ACADEMY-SOURCE-LESSON-MATRIX.csv',
  'ACADEMY-SOURCE-LESSON-MATRIX.json',
  'ACADEMY-ACTIVITY-EVIDENCE-MATRIX.csv',
  'ACADEMY-CONTENT-AUDIT-0.14A.md',
  'ACADEMY-CURRICULUM-MACRO-STAGES.md',
  'ACADEMY-EDITORIAL-PRIORITIES.md',
] as const

type OutputFile = (typeof OUTPUT_FILES)[number]
type Scope = 'source' | 'curriculum' | 'all'

const SOURCE_FILES = new Set<OutputFile>([
  'ACADEMY-SOURCE-REGISTRY.md',
  'ACADEMY-SOURCE-REGISTRY.json',
  'CHICAGO-SOURCE-INVENTORY.md',
  'DANIELS-SOURCE-INVENTORY.md',
])
const CURRICULUM_FILES = new Set<OutputFile>([
  'ACADEMY-SOURCE-LESSON-MATRIX.csv',
  'ACADEMY-SOURCE-LESSON-MATRIX.json',
  'ACADEMY-ACTIVITY-EVIDENCE-MATRIX.csv',
  'ACADEMY-CURRICULUM-MACRO-STAGES.md',
])

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const md = (value: string) => `${value.trim().replace(/[ \t]+$/gmu, '')}\n`
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const code = (value: string) => `\`${value.replaceAll('`', '\\`')}\``

function csvValue(value: unknown): string {
  const normalized = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value ?? '')
  return `"${normalized.replaceAll('"', '""')}"`
}

function csv<T extends object>(rows: T[], columns: Array<keyof T>): string {
  return `${columns.map((column) => csvValue(String(column))).join(',')}\n${rows.map((row) => columns.map((column) => csvValue(row[column])).join(',')).join('\n')}\n`
}

const EDITORIAL_FUNCTIONS = [
  ['A', 'Documentación oficial de fabricante', 'Autoridad prioritaria para el calibre concreto: dimensiones, referencias, piezas, secuencias, lubricación, tolerancias y datos de servicio.', 'No funciona como teoría relojera general.'],
  ['B', 'Theory of Horology', 'Fuente conceptual principal para funcionamiento general, física, arquitectura, engranajes, energía, escape, regulación y complicaciones.', 'No funciona como manual específico de servicio de un calibre.'],
  ['C', 'Horologia completa / George Daniels - Watchmaking', 'Fuente principal para fabricación, geometría, torno, ruedas, piñones, pequeños componentes, rubíes, escapes, diseño, cajas y esferas.', 'OCR de fórmulas, tablas y símbolos exige verificación visual; riesgos históricos requieren corroboración moderna.'],
  ['D', 'Bulova School of Watch Making', 'Fuente principal para progresión psicomotriz, herramientas, repetición, micromecánica y pasaportes de habilidad.', 'No es autoridad moderna de productos químicos o seguridad.'],
  ['E', 'Chicago School of Watchmaking', 'Fuente principal para hojas de trabajo, procedimientos, secuencias, ejercicios y preguntas de repaso.', 'Procedimientos químicos/térmicos históricos no son accionables; respuestas no se importan automáticamente.'],
  ['F', 'TM 9-1575', 'Fuente principal para inspección, diagnóstico, observación antes de desmontar, hipótesis y comprobación.', 'Tolerancias, sustancias, intervalos y procedimientos específicos son históricos salvo corroboración.'],
  ['G', 'Webs de relojeros y recursos visuales', 'Casos reales, defectos, fotografías, restauraciones y transferencia entre calibres.', 'Un caso particular no se generaliza.'],
  ['H', 'Bases de datos', 'Identificación, familias, equivalencias, fechas y descubrimiento.', 'No son fuente final de lubricación, tolerancias, compatibilidad o servicio.'],
] as const

function sourceRegistryMarkdown(registry: SourceRegistryResult, corpusDigest: string): string {
  const rows = registry.records.map((record) => `| ${code(record.sourceId)} | ${pipe(record.title)} | ${record.editorialFunction} | ${record.verificationStatus} | ${record.citationPrecision} | ${record.usedByLessonIds.length} | ${record.requiresModernCorroboration ? 'sí' : 'no'} | ${pipe(record.location.locator)} |`).join('\n')
  const originalRows = registry.localOriginals.map((item) => `| ${pipe(item.fileName)} | ${item.available ? 'accesible' : 'no accesible'} | ${item.bytes ?? '—'} | ${item.pages ?? '—'} | ${item.sha256 ? code(item.sha256) : '—'} |`).join('\n')
  return md(`# Registro canónico de fuentes de la Academia

Versión del esquema: \`wplab-academy-source-registry-v1\`  
Fase: **0.14A**  
Huella del corpus: ${code(corpusDigest)}
Registros: **${registry.records.length}**

Este registro conserva metadatos, autoridad, alcance, riesgos, localizadores y política de reutilización. No incorpora páginas, escaneos, imágenes ni fragmentos extensos de los originales.

## Funciones editoriales

| Código | Familia | Uso autorizado | Límite |
|---|---|---|---|
${EDITORIAL_FUNCTIONS.map(([id, title, use, limit]) => `| ${id} | ${title} | ${use} | ${limit} |`).join('\n')}

## Integridad de originales locales

| Archivo | Estado | Bytes | Páginas verificadas | SHA-256 |
|---|---|---:|---:|---|
${originalRows}

Los originales permanecen bajo \`reference-library/originals/\` y Git LFS. Cualquier extracción de auditoría se limita a \`.cache/reference-audit/\`, ignorada por Git.

## Registros

| sourceId | Título | Función | Verificación | Precisión | Lecciones | Corroboración moderna | Localizador |
|---|---|---|---|---|---:|---|---|
${rows}

## Fuentes no accesibles

${registry.missingLocalOriginals.length ? registry.missingLocalOriginals.map((value) => `- ${code(value)}`).join('\n') : 'Ninguna de las siete fuentes locales esperadas está ausente.'}

## Política de uso

- Una fuente nunca adquiere más autoridad que su documento, edición, calibre, página o caso.
- OCR no verifica fórmulas, tablas, medidas ni símbolos.
- Simulación digital no demuestra destreza física.
- Procedimientos históricos peligrosos permanecen no accionables.
- El JSON asociado contiene los campos completos, variantes de cita, alcance, exclusiones, riesgos y dependencias de uso.`)
}

function chicagoMarkdown(registry: SourceRegistryResult): string {
  const iso = registry.localOriginals.find(({ fileName }) => fileName === 'Chicago CD.iso')
  const rows = CHICAGO_INVENTORY.map((entry) => `| ${entry.lessonNumber} | ${pipe(entry.title)} | ${entry.pages} | ${entry.textExtractionQuality} | ${entry.imagePresence} | ${pipe(entry.subjects.join(', '))} | ${entry.probableArchetype} | ${pipe(entry.historicalRisks.join(', '))} | ${entry.recommendedStage} | ${pipe(entry.recommendedUse)} | sí |`).join('\n')
  return md(`# Inventario verificable de Chicago School of Watchmaking

Fuente: \`reference-library/originals/Chicago CD.iso\`  
Formato verificado: **ISO 9660/Joliet**  
SHA-256: ${iso?.sha256 ? code(iso.sha256) : '**desconocido; fuente no accesible**'}

El volumen se abrió en solo lectura. La extracción técnica temporal se mantuvo bajo \`.cache/reference-audit/\`; no forma parte de Git ni del runtime.

## Topología del volumen

- \`Chicago School Lesson Index.doc\`
- \`Chicago School of Watchmaking Read Me First.doc\`
- carpeta \`Chicago School Watchmaking\`
- 35 lecciones numeradas; la lección 32 está dividida en Part 1 y Part 2
- \`Tools & Materials of the Trade.PDF\`

## Documentos de apoyo

| Archivo | Título | Páginas | Extracción | Uso verificado |
|---|---|---:|---|---|
${CHICAGO_SUPPORTING_DOCUMENTS.map((entry) => `| ${code(entry.fileName)} | ${pipe(entry.title)} | ${entry.pages} | ${entry.textExtractionQuality} | ${pipe(entry.verifiedUse)} |`).join('\n')}

## Lecciones

| N.º | Título verificado por el índice | Páginas PDF | Texto | Imágenes/facsímil | Materias | Arquetipo probable | Riesgos históricos | Etapa | Uso recomendado | Revisión manual |
|---|---|---:|---|---|---|---|---|---|---|---|
${rows}

## Método y límites

- Los conteos de páginas proceden de los 36 PDF de lección reales (32a y 32b por separado).
- La calidad de texto se clasificó por cobertura y densidad de extracción; 32a es pobre y requiere lectura visual.
- El muestreo visual confirma páginas facsímil y diagramas. La presencia de imagen no implica permiso de reutilización.
- Toda la colección es histórica. Las entradas con químicos, calor, materiales luminosos, plomo, solventes o maquinaria permanecen como casos no accionables.
- Las preguntas pueden inspirar revisión o práctica, pero las respuestas requieren verificación técnica independiente.`)
}

function danielsMarkdown(registry: SourceRegistryResult): string {
  const original = registry.localOriginals.find(({ fileName }) => fileName === 'Horologia_completa_OCR_ligera_100MB.pdf')
  const rows = DANIELS_CHAPTERS.map((chapter) => `| ${chapter.chapter} | ${chapter.title} | ${chapter.approximatePdfPages} | ${pipe(chapter.subjects.join(', '))} | ${pipe(chapter.applicableStages.join(', '))} | ${chapter.formulaPages} / ${chapter.tablePages} | ${pipe(chapter.relevantFigures)} | ${pipe(chapter.workshopOperations.join(', '))} | ${chapter.executionTier} | ${pipe(chapter.risks.join(', '))} | ${pipe(chapter.corroboration)} | ${pipe(chapter.visualInspiration.join(', '))} |`).join('\n')
  return md(`# Inventario verificable de Horologia completa / George Daniels - Watchmaking

Fuente: \`reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf\`  
Páginas PDF verificadas: **${original?.pages ?? 425}**  
SHA-256: ${original?.sha256 ? code(original.sha256) : '**desconocido; fuente no accesible**'}

Los rangos son índices aproximados del PDF combinado, no la paginación impresa del libro. Las páginas 1-25 contienen láminas preliminares; la 420 está vacía en la copia; los apéndices comienzan en la 421.

| Cap. | Bloque | Páginas PDF aprox. | Materias | Etapas | Páginas con patrones de fórmula / tabla | Figuras relevantes | Operaciones | Ejecución | Riesgos | Corroboración | Visuales que puede inspirar |
|---|---|---|---|---|---:|---|---|---|---|---|---|
${rows}

## Regla de verificación

- Los conteos de páginas con patrones de fórmula o tabla son detectores de revisión, no validación matemática.
- Ninguna fórmula, tabla, medida, ángulo o símbolo OCR queda marcado como verificado por este inventario.
- El muestreo visual confirmó construcciones geométricas, diagramas de ruedas/escapes y procedimientos históricos con ácidos, calor, mercurio y electrodeposición.
- Los procedimientos de riesgo se clasifican y bloquean como instrucciones accionables hasta contar con autoridad moderna y entorno profesional apropiado.
- Las figuras solo pueden inspirar visuales originales; no se copian escaneos ni diagramas del libro al runtime.`)
}

const lessonColumns: Array<keyof LessonMatrixRow> = [
  'packageId', 'packageVersion', 'routeId', 'moduleId', 'lessonId', 'visibleTitle', 'currentOrder', 'routeOrder', 'moduleOrder', 'lessonOrder',
  'currentType', 'proposedCurriculumStage', 'curriculumCategory', 'currentObservableObjective', 'objectiveQuality', 'currentLearningArchetype',
  'recommendedLearningArchetype', 'declaredPrimarySource', 'secondarySources', 'currentCitations', 'citationPrecision', 'requiredConcepts',
  'prerequisiteProblems', 'improperHigherDependencies', 'visualCoverage', 'requiredVisuals', 'currentEvidenceLevel', 'recommendedEvidenceLevel',
  'executionTier', 'safetyStatus', 'historicalStatus', 'languageProblems', 'editorialProblems', 'editorialStatus', 'recommendedAction', 'priority',
  'priorityScore', 'priorityBreakdown', 'reason', 'manualReviewRequired',
]

const activityColumns: Array<keyof ActivityMatrixRow> = [
  'packageId', 'routeId', 'moduleId', 'lessonId', 'activityId', 'activityOrder', 'visibleTitle', 'practiceType', 'helpAvailable',
  'independentDemonstration', 'transfer', 'retention', 'requestedEvidence', 'impliesPhysicalSkill', 'currentEvidenceLevel',
  'recommendedEvidenceLevel', 'executionTier', 'risk', 'objectiveAlignment', 'recommendedAction', 'manualReviewRequired',
]

function stageRecommendations(analysis: MatrixAnalysis): string {
  const stageOrder = [
    '0-prepare-bench-and-control', '1-understand-watch-as-system', '2-understand-mechanical-systems', '3-observe-measure-diagnose',
    '4-work-on-real-calibre', '5-build-complete-watch', '6-repair-adapt-manufacture-components', '7-design-validate-own-watch-or-movement',
  ]
  return stageOrder.map((stage) => {
    const rows = analysis.lessons.filter(({ proposedCurriculumStage }) => proposedCurriculumStage === stage)
    const topProblems = [...new Set(rows.flatMap(({ editorialProblems }) => editorialProblems))].slice(0, 4)
    return `- **${stage}**: ${rows.length} lecciones. Priorizar ${topProblems.length ? topProblems.join(', ') : 'verificación humana ordinaria y conservación de IDs'}.`
  }).join('\n')
}

function auditMarkdown(corpus: Awaited<ReturnType<typeof loadAcademyCorpus>>, registry: SourceRegistryResult, analysis: MatrixAnalysis): string {
  const count = (detectorId: number) => analysis.issuesByDetector.find((entry) => entry.detectorId === detectorId)?.count ?? 0
  const citations = {
    exact: analysis.lessons.filter(({ citationPrecision }) => citationPrecision === 'page-or-figure').length,
    chapter: analysis.lessons.filter(({ citationPrecision }) => citationPrecision === 'chapter-or-section').length,
    document: analysis.lessons.filter(({ citationPrecision }) => citationPrecision === 'document').length,
    missing: analysis.lessons.filter(({ citationPrecision }) => citationPrecision === 'missing').length,
  }
  const top = [...analysis.lessons].sort((left, right) => right.priorityScore - left.priorityScore || left.currentOrder - right.currentOrder).slice(0, 30)
  const issueRows = analysis.issuesByDetector.map((entry) => `| ${entry.detectorId} | ${entry.title} | ${entry.count} | ${entry.critical} | ${entry.high} | ${entry.medium} | ${entry.low} | ${entry.info} |`).join('\n')
  return md(`# Auditoría integral de contenido de la Academia - 0.14A

Resultado: **mapa editorial completo generado; ninguna corrección ambigua aplicada**  
Huella del corpus: ${code(corpus.digest)}

## Conteos reales visibles

| Paquetes | Rutas | Módulos | Lecciones | Actividades | Conceptos | Errores/misconcepciones |
|---:|---:|---:|---:|---:|---:|---:|
| ${corpus.counts.packages} | ${corpus.counts.routes} | ${corpus.counts.modules} | ${corpus.counts.lessons} | ${corpus.counts.activities} | ${corpus.counts.concepts} | ${corpus.counts.misconceptions} |

La ruta \`route.capstone.validation\` y sus 3 módulos/lecciones/actividades están marcados como \`demo\` y no forman parte del contenido visible. No se fuerza ningún conteo esperado: la matriz se deriva de las rutas reales no-demo.

## Fuentes encontradas y no accesibles

- ${registry.records.length} registros canónicos, incluidos ${registry.records.filter(({ usedByLessonIds }) => usedByLessonIds.length > 0).length} usados directamente por lecciones visibles.
- ${registry.localOriginals.filter(({ available }) => available).length}/${registry.localOriginals.length} originales locales esperados accesibles y con checksum calculado.
- No accesibles: ${registry.missingLocalOriginals.length ? registry.missingLocalOriginals.join(', ') : 'ninguno'}.

## Cobertura de citas

| Página/figura | Capítulo/sección | Documento | Ausente |
|---:|---:|---:|---:|
| ${citations.exact} | ${citations.chapter} | ${citations.document} | ${citations.missing} |

La precisión indica el mejor localizador encontrado por lección; no convierte OCR en verificación visual ni una cita secundaria en autoridad primaria.

## Incidencias por detector

| # | Categoría | Total | Crítica | Alta | Media | Baja | Info |
|---:|---|---:|---:|---:|---:|---:|---:|
${issueRows}

## Lecturas obligatorias de la auditoría

- Problemas de prerrequisitos: ${count(7) + count(8) + count(9)}.
- Problemas de idioma: ${count(3)}.
- Encabezados vacíos: ${count(1)}.
- Contenido duplicado: ${count(6)}.
- Objetivos genéricos: ${count(5)}.
- Lecciones sin visuales adecuados: ${count(18)}.
- Habilidades físicas sin evidencia física: ${count(17)}.
- Procedimientos históricos peligrosos: ${count(15)}.
- Fórmulas OCR sin verificar: ${count(14)}.
- Módulos de una sola lección: ${count(10)}.

## Top 30 de prioridades editoriales

| Pos. | Puntos | Prioridad | Lección | Ruta | Acción | Motivo resumido |
|---:|---:|---|---|---|---|---|
${top.map((row, index) => `| ${index + 1} | ${row.priorityScore} | ${row.priority} | ${code(row.lessonId)} | ${code(row.routeId)} | ${row.recommendedAction} | ${pipe(row.reason)} |`).join('\n')}

## Recomendaciones por etapa

${stageRecommendations(analysis)}

## Limitaciones de la auditoría

- Es un análisis declarativo y heurístico. Una incidencia señala revisión; no prueba por sí sola que el contenido sea incorrecto.
- No se evaluó destreza física, transferencia real, retención longitudinal ni seguridad de un taller concreto.
- OCR se usó para localizar y clasificar, nunca como prueba suficiente de fórmulas, símbolos, tablas o medidas.
- La presencia de una fuente no demuestra que cada frase esté respaldada al nivel correcto.
- Las fotografías y casos externos siguen sujetos a derechos, contexto y verificación del ejemplar.
- No se modificaron navegación, lector, segmentación, progreso, rutas ni contenido visible.

## Elementos que exigen revisión humana

- Todas las incidencias críticas o altas de seguridad, OCR, autoridad de calibre y datos numéricos.
- Toda habilidad física cuyo nivel recomendado sea P o R.
- Chicago completo como corpus histórico; en especial lecciones 10, 27, 32b y 35.
- Todos los capítulos de Daniels con fórmulas/tablas; especialmente ruedas/piñones, escapes, diseño, volante/espiral y apéndices.
- Conflictos de metadatos entre variantes de un mismo \`sourceId\`.
- Las ${analysis.lessons.filter(({ manualReviewRequired }) => manualReviewRequired).length} lecciones marcadas con revisión manual en la matriz.`)
}

function macroStagesMarkdown(analysis: MatrixAnalysis): string {
  const groups = new Map<string, LessonMatrixRow[]>()
  for (const row of analysis.lessons) groups.set(row.proposedCurriculumStage, [...(groups.get(row.proposedCurriculumStage) ?? []), row])
  const stages = [
    ['0-prepare-bench-and-control', '0. Preparar el banco y adquirir control'],
    ['1-understand-watch-as-system', '1. Entender el reloj como sistema'],
    ['2-understand-mechanical-systems', '2. Comprender los sistemas mecánicos'],
    ['3-observe-measure-diagnose', '3. Observar, medir y diagnosticar'],
    ['4-work-on-real-calibre', '4. Trabajar sobre un calibre real'],
    ['5-build-complete-watch', '5. Construir un reloj completo'],
    ['6-repair-adapt-manufacture-components', '6. Reparar, adaptar y fabricar componentes'],
    ['7-design-validate-own-watch-or-movement', '7. Diseñar y validar un reloj o movimiento propio'],
  ] as const
  const sections = stages.map(([stage, title]) => {
    const rows = groups.get(stage) ?? []
    const routeCounts = new Map<string, number>()
    rows.forEach(({ routeId }) => routeCounts.set(routeId, (routeCounts.get(routeId) ?? 0) + 1))
    return `## ${title}\n\n${rows.length} lecciones propuestas, sin cambiar sus rutas visibles actuales.\n\n${[...routeCounts.entries()].sort().map(([routeId, count]) => `- ${code(routeId)}: ${count}`).join('\n') || '- Sin lecciones asignadas automáticamente; revisión humana necesaria antes de poblarla.'}`
  }).join('\n\n')
  const categories = ['specialization', 'enrichment', 'reference-only', 'historical-case'].map((category) => {
    const rows = analysis.lessons.filter(({ curriculumCategory }) => curriculumCategory === category)
    return `- **${category}**: ${rows.length} lecciones.`
  }).join('\n')
  return md(`# Macroetapas propuestas de la Academia - mapa 0.14A

Este documento es una clasificación editorial. No cambia navegación, rutas, prerrequisitos, lector ni progreso.

${sections}

## Categorías transversales

${categories}

## Reglas de compatibilidad

- \`route.quartz2035.isa-to-2035\` se clasifica como **especialización de iniciación en cuarzo**. Su papel opcional ya está declarado y no debe bloquear la columna mecánica.
- \`route.miyota8215.complete\` queda asociada íntegramente a **4. Trabajar sobre un calibre real**.
- Los IDs y el orden visible actual permanecen intactos.
- Una clasificación automática es propuesta, no autorización para mover contenido en 0.14A.`)
}

function prioritiesMarkdown(analysis: MatrixAnalysis): string {
  const ranked = [...analysis.lessons].sort((left, right) => right.priorityScore - left.priorityScore || left.currentOrder - right.currentOrder || left.lessonId.localeCompare(right.lessonId))
  return md(`# Prioridades editoriales de la Academia - 0.14A

## Puntuación explicada

La puntuación suma componentes trazables:

- incidencias: crítica 25, alta 12, media 6, baja 3 e informativa 1, con tope agregado de 60;
- primeras 12 lecciones visibles: +20;
- banco y herramientas: +18;
- fundamentos mecánicos: +16;
- MIYOTA 8215: +18;
- inspección: +16; diagnóstico: +15;
- montaje completo: +14; piezas donantes: +10;
- fabricación: +15; diseño propio: +15.

La puntuación no autoriza una corrección automática. Solo ordena la revisión humana de forma reproducible.

| Pos. | Puntos | Nivel | Lección | Título | Etapa | Acción | Desglose |
|---:|---:|---|---|---|---|---|---|
${ranked.map((row, index) => `| ${index + 1} | ${row.priorityScore} | ${row.priority} | ${code(row.lessonId)} | ${pipe(row.visibleTitle)} | ${row.proposedCurriculumStage} | ${row.recommendedAction} | ${pipe(row.priorityBreakdown.map(({ reason, points }) => `${reason} +${points}`).join('; '))} |`).join('\n')}`)
}

export async function buildAuditArtifacts(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const registry = await buildSourceRegistry(repositoryRoot, corpus)
  const analysis = await analyzeMatrices(repositoryRoot, corpus, registry.records)

  if (analysis.lessons.length !== corpus.counts.lessons) throw new Error(`La matriz contiene ${analysis.lessons.length}/${corpus.counts.lessons} lecciones visibles.`)
  if (analysis.activities.length !== corpus.counts.activities) throw new Error(`La matriz contiene ${analysis.activities.length}/${corpus.counts.activities} actividades visibles.`)
  const sourceIds = new Set(registry.records.map(({ sourceId }) => sourceId))
  const missingSourceIds = [...new Set([
    ...analysis.lessons.flatMap(({ declaredPrimarySource, secondarySources }) => [...(declaredPrimarySource ? [declaredPrimarySource] : []), ...secondarySources]),
    ...corpus.activities.flatMap(({ activity }) => activity.authoring?.sourceIds ?? []),
  ].filter((sourceId) => !sourceIds.has(sourceId)))]
  if (missingSourceIds.length) throw new Error(`sourceId sin registrar: ${missingSourceIds.join(', ')}`)

  const registryJson = {
    schema: 'wplab-academy-source-registry-v1',
    phase: '0.14A',
    corpusDigest: corpus.digest,
    counts: { records: registry.records.length, localOriginals: registry.localOriginals.length, missingLocalOriginals: registry.missingLocalOriginals.length },
    editorialFunctions: EDITORIAL_FUNCTIONS.map(([code, title, authorizedUse, limit]) => ({ code, title, authorizedUse, limit })),
    localOriginals: registry.localOriginals,
    records: registry.records,
  }
  const matrixJson = {
    schema: 'wplab-academy-source-lesson-matrix-v1',
    phase: '0.14A',
    corpusDigest: corpus.digest,
    counts: corpus.counts,
    detectorSummary: analysis.issuesByDetector,
    issues: analysis.issues,
    rows: analysis.lessons,
  }
  return new Map<OutputFile, string>([
    ['ACADEMY-SOURCE-REGISTRY.md', sourceRegistryMarkdown(registry, corpus.digest)],
    ['ACADEMY-SOURCE-REGISTRY.json', json(registryJson)],
    ['CHICAGO-SOURCE-INVENTORY.md', chicagoMarkdown(registry)],
    ['DANIELS-SOURCE-INVENTORY.md', danielsMarkdown(registry)],
    ['ACADEMY-SOURCE-LESSON-MATRIX.csv', csv(analysis.lessons, lessonColumns)],
    ['ACADEMY-SOURCE-LESSON-MATRIX.json', json(matrixJson)],
    ['ACADEMY-ACTIVITY-EVIDENCE-MATRIX.csv', csv(analysis.activities, activityColumns)],
    ['ACADEMY-CONTENT-AUDIT-0.14A.md', auditMarkdown(corpus, registry, analysis)],
    ['ACADEMY-CURRICULUM-MACRO-STAGES.md', macroStagesMarkdown(analysis)],
    ['ACADEMY-EDITORIAL-PRIORITIES.md', prioritiesMarkdown(analysis)],
  ])
}

function filesForScope(scope: Scope): Set<OutputFile> {
  if (scope === 'source') return SOURCE_FILES
  if (scope === 'curriculum') return CURRICULUM_FILES
  return new Set(OUTPUT_FILES)
}

export async function writeOrCheckAuditArtifacts(repositoryRoot: string, scope: Scope, check: boolean): Promise<void> {
  const artifacts = await buildAuditArtifacts(repositoryRoot)
  const outputRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(outputRoot, { recursive: true })
  const selected = filesForScope(scope)
  const drift: string[] = []
  for (const [fileName, content] of artifacts) {
    if (!selected.has(fileName)) continue
    const path = join(outputRoot, fileName)
    if (check) {
      try {
        if (await readFile(path, 'utf8') !== content) drift.push(fileName)
      } catch {
        drift.push(fileName)
      }
    } else {
      await writeFile(path, content, 'utf8')
    }
  }
  if (drift.length) throw new Error(`Salidas de auditoría ausentes o no deterministas: ${drift.join(', ')}`)
  console.log(`${check ? 'Verificación' : 'Generación'} editorial 0.14A (${scope}): ${selected.size} salidas correctas.`)
}

async function main(): Promise<void> {
  const repositoryRoot = process.cwd()
  const scopeArg = process.argv.find((value) => value.startsWith('--scope='))?.split('=')[1] ?? 'all'
  if (!['source', 'curriculum', 'all'].includes(scopeArg)) throw new Error(`Scope desconocido: ${scopeArg}`)
  await writeOrCheckAuditArtifacts(repositoryRoot, scopeArg as Scope, process.argv.includes('--check'))
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entry) await main()
