import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { academyPathLocationForStepLesson } from '../src/learning/academy/path/academyLearnerPath'
import { ACADEMY_3D_VISUAL_STATES } from '../src/learning/academy/reader/academyReader3dStates'
import {
  ACADEMY_DEEP_VISUAL_PILOT_IDS,
  ACADEMY_SUPPORTING_VISUAL_PILOT_IDS,
  academyDiagramIsContentSpecific,
} from '../src/learning/academy/reader/academyReaderCuration'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderDocument, AcademyVisualCue } from '../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { loadAcademyCorpus } from './academy-audit/corpus'
import { ACADEMY_014D_QA_CASES, ACADEMY_014D_SCREENSHOTS } from './academy-audit/academy-reader-hardening-qa-snapshot'

export const ACADEMY_READER_HARDENING_OUTPUT_FILES = [
  'ACADEMY-VISUAL-INVENTORY-0.14D.md',
  'ACADEMY-VISUAL-INVENTORY-0.14D.json',
  'ACADEMY-VISUAL-SPECIFICITY-0.14D.md',
  'ACADEMY-SECTION-CURATION-0.14D.md',
  'ACADEMY-SECTION-CURATION-0.14D.json',
  'ACADEMY-3D-CUE-STATES-0.14D.md',
  'ACADEMY-3D-CUE-STATES-0.14D.json',
  'ACADEMY-OWNER-REVIEW-0.14D.md',
  'ACADEMY-USABILITY-HARNESS-0.14D.md',
  'ACADEMY-READER-METRICS-0.14D.md',
  'ACADEMY-READER-RESUME-0.14D.md',
  'ACADEMY-VISUAL-GAP-PRIORITIES-0.14D.md',
  'ACADEMY-ACCESSIBILITY-QA-0.14D.md',
  'ACADEMY-SECURITY-AUDIT-0.14D.md',
  'ACADEMY-UX-QA-0.14D.md',
  'ACADEMY-SCREENSHOT-INDEX-0.14D.md',
  'ACADEMY-0.14D-SUMMARY.md',
] as const

type OutputFile = (typeof ACADEMY_READER_HARDENING_OUTPUT_FILES)[number]

export const ACADEMY_014C_BASELINE_SHA256: Readonly<Record<string, string>> = {
  'ACADEMY-B1-RETOUCHES-0.14C.md': '882ebd358deebb66d4edc129ee77f6fe1f8bad6b738854867f33377a5e23e71e',
  'ACADEMY-CONTINUOUS-READER-0.14C.json': 'a1b90cfcc9c90b6784b5163cd6a540c9fb22047fedd86d33b501858428dc2606',
  'ACADEMY-CONTINUOUS-READER-0.14C.md': '3f3c0efeeec1b362efb8834e5e6c8819b8611d1204c3f5f5d68ea2cc3c89bb3a',
  'ACADEMY-PILOT-CURATION-0.14C.json': '867fc4aebdd02bcf3d7ebadfb86eeaa758a4bd4b7575d87a32109169324a5078',
  'ACADEMY-PILOT-CURATION-0.14C.md': 'fbd6c0d7b7ed814ec1c57c85d5eaa3b0f46b6cd9240bd8a90851d7180a87052d',
  'ACADEMY-READER-COMPATIBILITY-0.14C.md': '1b72bd6632bf6016a557eeae2442c817536c2224a6c35bdd106978701fc6f0d3',
  'ACADEMY-READER-COVERAGE-0.14C.md': '12e494ca5bb76ff5e743ae3358cb2388b81217740e0b1e01017c96135c47fe0d',
  'ACADEMY-READER-FATIGUE-0.14C.md': 'c2e5d03df7a0c39286b9e4d33829f0dfacd64d3b163a9160db61f3df76d27b97',
  'ACADEMY-READER-QA-0.14C.md': 'eefca3b9600185e1d71134206168177e5fbf104f33a98a04c0af27a8d6dda5e3',
  'ACADEMY-VISUAL-NARRATIVE-PILOT-0.14C.json': '5b1dcc2a721fe597fcd9ec3d5a3d0659c73687234a03900113eb978576114cfb',
  'ACADEMY-VISUAL-NARRATIVE-PILOT-0.14C.md': '4f859aaca0a0172d5f57aaa6b5085f07538f0c49d4d0b51ca3a6e4cec0157cbb',
}

const md = (value: string) => `${value.trim()}\n`
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

async function assertHistorical014c(repositoryRoot: string) {
  for (const [fileName, expected] of Object.entries(ACADEMY_014C_BASELINE_SHA256)) {
    const actual = sha256(await readFile(join(repositoryRoot, 'docs', 'generated', fileName)))
    if (actual !== expected) throw new Error(`El informe histórico 0.14C cambió: ${fileName} (${actual}).`)
  }
}

function materialFor(pack: LearningPack, lessonId: string, product: ReturnType<typeof createLearningProductIndex>): AcademyReaderBuildInput['material'] {
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

interface DocumentRecord {
  document: AcademyReaderDocument
  material: AcademyReaderBuildInput['material']
  title: string
}

interface VisualInventoryRecord {
  cueId: string
  lessonId: string
  sectionId: string
  implementationStatus: AcademyVisualCue['implementationStatus']
  visualDecision: AcademyVisualCue['visualDecision']
  visualDesignId?: string
  diagramSchemaId?: string
  diagramPayloadHash?: string
  fixtureIds: string[]
  compositionId?: string
  visualStateId?: string
  semanticSpecificity: AcademyVisualCue['semanticSpecificity']
  evidenceOfSpecificity: string[]
  reviewStatus: AcademyVisualCue['reviewStatus']
}

function fixtureIds(cue: AcademyVisualCue): string[] {
  if (cue.fixtureBinding?.kind === 'fixture') return [cue.fixtureBinding.fixtureId]
  if (cue.fixtureBinding?.kind === 'composition') return cue.fixtureBinding.fixtureIds
  return []
}

function inventoryRecord(cue: AcademyVisualCue): VisualInventoryRecord {
  return {
    cueId: cue.cueId, lessonId: cue.lessonId, sectionId: cue.sectionId,
    implementationStatus: cue.implementationStatus, visualDecision: cue.visualDecision,
    visualDesignId: cue.visualDesignId, diagramSchemaId: cue.diagramSchemaId,
    diagramPayloadHash: cue.diagramPayloadHash, fixtureIds: fixtureIds(cue),
    compositionId: cue.compositionId, visualStateId: cue.visualStateId,
    semanticSpecificity: cue.semanticSpecificity,
    evidenceOfSpecificity: cue.evidenceOfSpecificity ?? [], reviewStatus: cue.reviewStatus,
  }
}

function unique(records: VisualInventoryRecord[], value: (record: VisualInventoryRecord) => string | undefined): number {
  return new Set(records.flatMap((record) => {
    const item = value(record)
    return item ? [item] : []
  })).size
}

function visualCounts(records: VisualInventoryRecord[]) {
  return {
    cueInstanceCount: records.length,
    implementedCueInstanceCount: records.filter(({ implementationStatus }) => implementationStatus === 'implemented').length,
    uniqueVisualDesignCount: unique(records.filter(({ implementationStatus }) => implementationStatus === 'implemented'), ({ visualDesignId }) => visualDesignId),
    uniqueDiagramSchemaCount: unique(records, ({ diagramSchemaId }) => diagramSchemaId),
    uniqueDiagramPayloadCount: unique(records, ({ diagramPayloadHash }) => diagramPayloadHash),
    uniqueFixtureCount: new Set(records.flatMap(({ fixtureIds: ids }) => ids)).size,
    uniqueCompositionCount: unique(records, ({ compositionId }) => compositionId),
    unique3dStateCount: unique(records, ({ visualStateId }) => visualStateId),
    genericScaffoldCount: records.filter(({ semanticSpecificity, implementationStatus }) => semanticSpecificity === 'generic-scaffold' && implementationStatus === 'implemented').length,
    contentSpecificDiagramCount: records.filter(({ diagramPayloadHash, implementationStatus }) => Boolean(diagramPayloadHash) && implementationStatus === 'implemented').length,
    contentSpecific3dCueCount: records.filter(({ visualStateId, implementationStatus }) => Boolean(visualStateId) && implementationStatus === 'implemented').length,
    notRequiredCount: records.filter(({ implementationStatus }) => implementationStatus === 'not-required').length,
    gapCount: records.filter(({ implementationStatus }) => implementationStatus === 'gap-recorded').length,
    unavailableCount: records.filter(({ implementationStatus }) => implementationStatus === 'unavailable').length,
  }
}

function visualInventoryMarkdown(counts: ReturnType<typeof visualCounts>, baseline: { lessons: number; sections: number; total: number; scene3d: number; diagrams: number; unnecessary: number; gaps: number }) {
  return md(`# Academia · inventario visual 0.14D

## Antes: baseline 0.14C intacto

| Medida | Valor |
| --- | ---: |
| Lecciones | ${baseline.lessons} |
| Instancias de cue | ${baseline.total} |
| Instancias de diagrama | ${baseline.diagrams} |
| Cues 3D | ${baseline.scene3d} |
| Gaps | ${baseline.gaps} |
| Diseños únicos | No diferenciados por el modelo 0.14C |

## Después: contabilidad 0.14D

| Medida | Valor |
| --- | ---: |
${Object.entries(counts).map(([key, value]) => `| ${key} | ${value} |`).join('\n')}

Una instancia es una aparición editorial. Un diseño se identifica por \`visualDesignId\`; un payload por su hash; un fixture no equivale a un estado de cámara o aislamiento. Los cinco scaffolds repetidos de 0.14C no se presentan ni se cuentan como visuales educativos terminados.`)
}

function specificityMarkdown(records: VisualInventoryRecord[]) {
  const implemented = records.filter(({ implementationStatus }) => implementationStatus === 'implemented')
  const distribution = ['generic-scaffold', 'topic-specific', 'lesson-specific', 'section-specific'].map((specificity) => ({
    specificity,
    cues: records.filter(({ semanticSpecificity }) => semanticSpecificity === specificity).length,
    implemented: implemented.filter(({ semanticSpecificity }) => semanticSpecificity === specificity).length,
  }))
  const designs = [...new Map(implemented.flatMap((record) => record.visualDesignId ? [[record.visualDesignId, record] as const] : [])).values()]
  return md(`# Especificidad visual 0.14D

| Especificidad | Cues | Implementados |
| --- | ---: | ---: |
${distribution.map(({ specificity, cues, implemented: count }) => `| ${specificity} | ${cues} | ${count} |`).join('\n')}

## Diseños educativos únicos

| visualDesignId | Tipo | Evidencia semántica | Revisión |
| --- | --- | --- | --- |
${designs.map((record) => `| ${pipe(record.visualDesignId)} | ${record.visualStateId ? '3D' : 'diagrama'} | ${pipe(record.evidenceOfSpecificity.join('; '))} | ${record.reviewStatus} |`).join('\n')}

Un cambio de caption no crea un diseño. Los scaffolds sin componentes, relaciones, fases, magnitudes o criterios reales quedan retirados como resultado final.`)
}

function sectionCurationMarkdown(documents: DocumentRecord[]) {
  const pilots = documents.filter(({ document }) => (document.sectionCurations?.length ?? 0) > 0)
  return md(`# Curación por apartado 0.14D

Lecciones con decisión por apartado: **${pilots.length}**. Toda curación permanece \`owner-review-pending\`.

${pilots.map(({ document }) => `## ${document.title}\n\n| Apartado | Decisión | Objetivo | Visual / datos | Fixture | Estado | Fidelidad | Limitaciones | Revisión |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${document.sections.map((section) => {
    const curation = document.sectionCurations?.find(({ sectionId }) => sectionId === section.sectionId)
    if (!curation) return ''
    const data = curation.diagramData ? curation.diagramData.nodes.map(({ label }) => label).join('; ') : curation.expectedObservation
    const fixture = curation.fixtureBinding?.kind === 'fixture' ? curation.fixtureBinding.fixtureId : curation.fixtureBinding?.kind === 'composition' ? curation.fixtureBinding.fixtureIds.join('; ') : '—'
    return `| ${pipe(section.title)} | ${curation.visualDecision} | ${pipe(curation.pedagogicalPurpose)} | ${pipe(curation.visualDesignId ?? data)} | ${pipe(fixture)} | ${curation.visualStateId ?? '—'} | ${curation.fidelity} | ${pipe(curation.limitations.join('; '))} | ${curation.ownerReviewStatus} |`
  }).filter(Boolean).join('\n')}`).join('\n\n')}

El supporting pilot de agujas conserva gaps de fuente explícitos cuando faltan dimensiones fiables; no se inventan alturas ni diámetros.`)
}

function statesMarkdown() {
  return md(`# Estados 3D específicos 0.14D

Estados registrados: **${ACADEMY_3D_VISUAL_STATES.length}**.

| visualStateId | Fixture | Cámara | Selección | Aislamiento | Explosión | Animación | Observación esperada |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ACADEMY_3D_VISUAL_STATES.map((state) => `| ${state.visualStateId} | ${state.fixtureId} | ${state.camera.presetId} | ${pipe(state.selectedIds.join('; '))} | ${pipe(state.isolatedIds.join('; '))} | ${Object.keys(state.explosion).length} | ${state.animation} | ${pipe(state.expectedObservation)} |`).join('\n')}

Cada cue 3D enlaza una actividad exacta y un estado. El runtime valida selectores y muestra “Vista no disponible” ante un fallo; no cae a un SVG genérico. Todos los estados parten pausados y respetan movimiento reducido.`)
}

function ownerReviewMarkdown(documents: DocumentRecord[]) {
  const pilots = documents.filter(({ document }) => document.pilot)
  return md(`# Revisión propietaria 0.14D

- Superficie secundaria: \`#/learning/editorial-review\`, accesible desde **Biblioteca → Gestionar**, no desde la navegación principal.
- Lecciones disponibles: **${pilots.length}** pilotos 0.14C.
- Estado inicial y entregado: **${pilots.length} pendientes**, **0 aprobadas por Codex**.
- Una aprobación explícita guarda contentHash, readerDocumentHash, fecha, versión, campos y revisiones por apartado.
- Un cambio de hash produce \`stale-after-content-change\`.
- El patch exportado contiene flags y comentarios; no modifica automáticamente la teoría.

Estados honestos: “Estructura generada automáticamente · pendiente de revisión”, “Curación asistida · pendiente de revisión” y, solo tras acción humana, “Revisada por el propietario”.`)
}

function usabilityMarkdown() {
  return md(`# Prueba de uso guiada 0.14D

## Inicio

Abrir **Biblioteca → Gestionar → Prueba de uso guiada** (\`#/learning/usability\`), elegir propietario, principiante, aficionado o relojero e iniciar la sesión.

## Tareas

${ACADEMY_014D_SCREENSHOTS.slice(0, 0).map(() => '').join('')}${[
    'Encontrar qué estudiar primero.', 'Abrir El reloj como sistema.', 'Explicar la cadena mecánica.', 'Cambiar a Lectura.',
    'Volver a Aprender.', 'Interpretar una pareja de engranajes.', 'Reanudar una lección interrumpida.',
    'Abrir arquitectura del 8215.', 'Localizar un subsistema.', 'Terminar una lección y llegar a su práctica.',
    'Volver mediante un marcador de apartado.', 'Consultar una fuente sin perder la posición.',
  ].map((task, index) => `${index + 1}. ${task}`).join('\n')}

Tras cada tarea se registran éxito, dificultad, confianza, comentario, tiempo aproximado y retrocesos. Se puede guardar y exportar JSON. Las respuestas permanecen locales y **no** cambian progreso, mastery ni evaluación.

## Interpretación

El harness organiza observación humana; no demuestra por sí solo claridad, aprendizaje, calidad estética ni destreza física.`)
}

function metricsMarkdown() {
  return md(`# Métricas locales del lector 0.14D

El registro aditivo guarda un máximo de **2.500 eventos** por perfil, con rotación FIFO. Campos: eventId, sessionId, tipo, fecha, lessonId, sectionId, cueId, modo, viewport, origen/destino, transición, bucket de duración, completado, fuente y metadatos escalares tipados.

Eventos implementados: session-start/end, lesson-open/resume, section-enter, outline-open/jump, cue-view, visual-expand, source/glossary-open, mode-change, note/bookmark-created, explicit-completion, practice-transition, route-leave-incomplete, pagehide-incomplete y return-after-incomplete.

No guarda texto de notas, contenido, nombres personales ni URLs externas. No realiza peticiones de red. Preferencias permite exportar JSON, exportar CSV agregado y eliminar solo estos eventos. Los contadores agregados antiguos se conservan.`)
}

function resumeMarkdown(documents: DocumentRecord[]) {
  const maximumVersion = Math.max(...documents.map(({ document }) => document.documentVersion.length))
  const maximumSignature = Math.max(...documents.map(({ document }) => document.identity?.diagnosticSignature.length ?? 0))
  return md(`# Reanudación del lector 0.14D

| Propiedad | Resultado |
| --- | --- |
| documentVersion persistida | \`reader-v1:<16 hex>\` |
| Longitud máxima observada | ${maximumVersion} caracteres |
| diagnosticSignature máxima | ${maximumSignature} caracteres; solo diagnóstico |
| visitedSectionIds | normalizador dedicado, hasta 1.000 IDs de 512 caracteres |
| Estado previo | se conserva; el legacy documentVersion queda en identity |
| Hash cambiado | se conserva el apartado resoluble, pero no se reutiliza offset incompatible |
| Alias / sección eliminada | resolución explícita por aliases y fallback inicial |

La clave persistida ya no concatena versiones de todos los bloques ni compara una cadena truncada. Los IDs anteriores no se borran.`)
}

interface GapPriority {
  lessonId: string
  sectionId: string
  title: string
  score: number
  classification: 'critical' | 'high' | 'medium' | 'low' | 'text-sufficient' | 'source-blocked'
  rationale: string
}

interface Reader014cBaselineCounts {
  lessons: number
  sections: number
  total: number
  scene3d: number
  diagrams: number
  unnecessary: number
  gaps: number
}

interface Reader014cBaselineCue {
  lessonId: string
  sectionId: string
  curationStatus: string
}

interface Reader014cBaseline {
  counts: Reader014cBaselineCounts
  lessons: Array<{ sections: Array<{ title: string; visualCue: Reader014cBaselineCue }> }>
}

function gapPriorities(baseline: Reader014cBaseline, documents: DocumentRecord[]): GapPriority[] {
  const byLesson = new Map(documents.map((item) => [item.document.lessonId, item]))
  const baselineCues = baseline.lessons.flatMap((lesson) => lesson.sections.map((section) => ({ ...section.visualCue, title: section.title })))
    .filter(({ curationStatus }) => curationStatus === 'gap')
  return baselineCues.map((cue) => {
    const item = byLesson.get(cue.lessonId)
    const location = academyPathLocationForStepLesson(cue.lessonId)
    const core = Boolean(location)
    const early = location ? Number(location.stage.stageId.replace(/\D/g, '')) <= 3 : false
    const essentialRole = ['explanation', 'visual-anatomy', 'observation', 'procedure', 'diagnosis'].includes(String(item?.document.sections.find(({ sectionId }) => sectionId === cue.sectionId)?.role))
    const technical = /miyota|escape|tren|engran|barrilete|medici|inspecci|desmont|montaje|caja/i.test(`${cue.lessonId} ${cue.title}`)
    const reusableFixture = Boolean(item?.material.activities.some(({ fixtureBinding }) => fixtureBinding))
    const reliableSource = (item?.document.sourceIds.length ?? 0) > 0
    const narrative = /historia|idioma|contexto|fuentes|resumen|propósito/i.test(String(cue.title))
    let score = (core ? 24 : 0) + (early ? 18 : 0) + (essentialRole ? 18 : 0) + (technical ? 18 : 0) + (reusableFixture ? 10 : 0) + (reliableSource ? 7 : 0) + 5
    if (narrative) score -= 32
    const sourceBlocked = technical && !reliableSource
    const classification: GapPriority['classification'] = narrative ? 'text-sufficient' : sourceBlocked ? 'source-blocked' : score >= 75 ? 'critical' : score >= 58 ? 'high' : score >= 38 ? 'medium' : 'low'
    return {
      lessonId: cue.lessonId, sectionId: cue.sectionId, title: cue.title, score, classification,
      rationale: [core ? 'anchor core' : 'fuera del anchor core', early ? 'etapa temprana' : 'etapa posterior/lateral', essentialRole ? 'rol visualmente exigente' : 'rol textual posible', technical ? 'riesgo de interpretación técnica' : 'riesgo técnico bajo', reusableFixture ? 'fixture reutilizable' : 'sin fixture directo', reliableSource ? 'fuente declarada' : 'fuente pendiente'].join('; '),
    }
  }).sort((left, right) => right.score - left.score || left.lessonId.localeCompare(right.lessonId) || left.sectionId.localeCompare(right.sectionId))
}

function gapsMarkdown(gaps: GapPriority[]) {
  const distribution = [...new Set(gaps.map(({ classification }) => classification))].sort().map((classification) => [classification, gaps.filter((gap) => gap.classification === classification).length] as const)
  return md(`# Prioridad de gaps visuales 0.14D

Se conservan como universo de priorización los **${gaps.length} gaps** registrados en 0.14C; no se rellenan automáticamente.

| Clase | Gaps |
| --- | ---: |
${distribution.map(([classification, count]) => `| ${classification} | ${count} |`).join('\n')}

## Top 30

| # | Lección | Apartado | Score | Clase | Razón concreta |
| ---: | --- | --- | ---: | --- | --- |
${gaps.slice(0, 30).map((gap, index) => `| ${index + 1} | ${gap.lessonId} | ${pipe(gap.title)} | ${gap.score} | ${gap.classification} | ${pipe(gap.rationale)} |`).join('\n')}

Puntuación: anchor core 24, etapa temprana 18, rol que exige apoyo 18, riesgo técnico 18, fixture reutilizable 10, fuente declarada 7 y revisión pendiente 5; narrativa potencialmente textual resta 32. \`text-sufficient\` no es un defecto y \`source-blocked\` exige fuente antes de producción.`)
}

function accessibilityMarkdown() {
  return md(`# Accesibilidad visual 0.14D

| Control | Estado |
| --- | --- |
| Un solo h1 y headingLevel h2/h3/h4 | Implementado y cubierto por tests |
| Índice y documento | Comparten outline y niveles |
| aria-live sobre figure | Retirado |
| Anuncio de cue | Solo mediante botón explícito |
| Alt, caption, límites | Conservados |
| Movimiento reducido | Estados 3D pausados y sin autoplay |
| Texto sin canvas/WebGL | Conservado; fallback textual estable |
| Layout sin visual | Clase \`no-visual\`, sin columna reservada |
| Fallo 3D | “Vista no disponible”, sin SVG genérico |
| Lectura | Visuales esenciales inline; no hay rail sticky |

El árbol de encabezados y la ausencia de anuncios repetitivos se validan automáticamente. La calidad de la experiencia con lectores de pantalla reales sigue requiriendo revisión humana.`)
}

function securityMarkdown(versions: Record<string, string>) {
  const rows = [
    ['brace-expansion', 'eslint → minimatch → brace-expansion', 'expansión de patrones', '5.0.9', versions['brace-expansion']],
    ['fast-uri', 'eslint → ajv → fast-uri', 'validación de URI en esquemas', '3.1.5', versions['fast-uri']],
    ['nanoid', 'vite → postcss → nanoid', 'generación de identificadores durante tooling', '3.3.18', versions.nanoid],
    ['postcss', 'vite → postcss', 'procesamiento CSS de build/dev', '8.5.23', versions.postcss],
  ]
  return md(`# Auditoría de dependencias 0.14D

El baseline de instalación mostró cuatro vulnerabilidades transitivas altas. Se aplicó \`npm update brace-expansion fast-uri nanoid postcss\`, sin \`--force\` ni cambios de major declarados. \`npm audit --json\` posterior informa 0 vulnerabilidades; la desaparición se corroboró con las versiones lock concretas y verify.

| Paquete | Cadena | Función afectada | Dev | Build | Runtime desktop | Versión corregida | Lock actual | Cambio / regresión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.map(([name, chain, purpose, fixed, current]) => `| ${name} | ${chain} | ${purpose} | Explotabilidad limitada a entradas de tooling no confiables | Potencial al procesar patrones/CSS manipulados | No se empaqueta como ruta de negocio remota | ${fixed} | ${current ?? 'no resuelta'} | Actualización transitiva compatible; lint, Vite, React, Tauri y Markdown se verifican |`).join('\n')}

No se usó \`npm audit fix --force\`. Riesgo residual: futuras resoluciones del lockfile pueden reintroducir versiones y deben volver a auditarse.`)
}

function uxQaMarkdown() {
  return md(`# QA de experiencia 0.14D

| Caso | Estado |
| --- | --- |
${ACADEMY_014D_QA_CASES.map(([name, status]) => `| ${name} | ${status} |`).join('\n')}

Los tests DOM prueban contratos; no se usan como sustituto de claridad humana ni calidad estética. Las capturas documentan estados concretos, no originales privados ni evidencia de destreza física.`)
}

function screenshotIndexMarkdown() {
  return md(`# Índice de capturas 0.14D

Ruta estable: \`docs/academy-ux/screenshots/0.14D/\`.

| Archivo | Ruta | Lección | Sección | Viewport | Estado | Debe observarse | Limitaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ACADEMY_014D_SCREENSHOTS.map((shot) => `| [${shot.fileName}](../academy-ux/screenshots/0.14D/${shot.fileName}) | ${pipe(shot.route)} | ${shot.lessonId} | ${pipe(shot.section)} | ${shot.viewport} | ${pipe(shot.state)} | ${pipe(shot.expected)} | ${pipe(shot.limitations)} |`).join('\n')}

Las capturas son PNG optimizadas, deterministas en nombre, sin datos personales ni fuentes privadas visibles.`)
}

function summaryMarkdown(input: {
  counts: ReturnType<typeof visualCounts>
  documents: DocumentRecord[]
  curations: number
  readingEssential: number
  gaps: number
  baseline: Reader014cBaseline
}) {
  const { counts, documents, curations, readingEssential, gaps, baseline } = input
  return md(`# Watch Prototype Lab 0.14D · resumen

0.14D conserva **${documents.length} lecciones**, sus IDs, progreso, sesiones, notas, marcadores, evidencias y los ocho paquetes. Los **${baseline.counts.total} cues** del baseline siguen siendo comparables; el modelo 0.14D cuenta por separado instancias y diseños.

| Resultado | Conteo |
| --- | ---: |
| Instancias de cue 0.14D | ${counts.cueInstanceCount} |
| Cues implementados | ${counts.implementedCueInstanceCount} |
| Diseños visuales únicos | ${counts.uniqueVisualDesignCount} |
| Instancias de diagrama específico | ${counts.contentSpecificDiagramCount} |
| Fixtures únicos | ${counts.uniqueFixtureCount} |
| Estados 3D únicos | ${counts.unique3dStateCount} |
| Scaffolds genéricos mostrados como terminados | ${counts.genericScaffoldCount} |
| Lecciones con curación por apartado | ${documents.filter(({ document }) => (document.sectionCurations?.length ?? 0) > 0).length} |
| Apartados curados automáticamente/asistidos | ${curations} |
| Apartados pendientes de propietario | ${curations} |
| Visuales esenciales en Lectura | ${readingEssential} |
| Gaps 0.14C priorizados, no rellenados | ${gaps} |

Los visuales de los 15 pilotos profundos son datos editoriales originales o estados de fixtures existentes; el caso de agujas queda parcialmente bloqueado por fuente. Ninguna lección queda aprobada por el propietario al generar esta fase.

## Límites y siguiente fase

No se reescribieron 222 lecciones, no se expandieron visuales al corpus completo, no se tocaron 17 fórmulas OCR ni 110 claims, no se crearon ocho contenidos de etapa 5 y no se acreditó destreza física. Para 0.14E: ejecutar revisión propietaria y relojera sobre los 16 pilotos curados, incorporar los hallazgos del test humano y producir solo los gaps critical/high confirmados con fuente suficiente.`)
}

export async function buildAcademyReaderHardeningOutputs(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  await assertHistorical014c(repositoryRoot)
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const documents: DocumentRecord[] = [...new Set(corpus.lessons.map(({ lesson }) => lesson.id))].map((lessonId) => {
    const descriptor = product.lessons.find(({ id }) => id === lessonId)
    const pack = packByLesson.get(lessonId)
    if (!descriptor || !pack) throw new Error(`Descriptor o paquete ausente para ${lessonId}.`)
    const material = materialFor(pack, lessonId, product)
    const location = academyPathLocationForStepLesson(lessonId)
    const document = buildAcademyReaderDocument({
      material, title: descriptor.title.es, purpose: descriptor.purpose.es,
      whyNow: location?.chapter.whyNow, outcome: location?.chapter.outcome,
      stageId: location?.stage.stageId, chapterId: location?.chapter.chapterId, stepId: location?.step.stepId,
      requiredActivityIds: location?.step.requiredActivityIds ?? descriptor.studyContract?.labActivityIds ?? [], locale: 'es-ES',
    })
    const issues = validateAcademyReaderDocument(document)
    if (issues.length) throw new Error(`${lessonId} produjo incidencias del lector: ${issues.map(({ code }) => code).join(', ')}`)
    return { document, material, title: descriptor.title.es }
  })
  if (documents.length !== corpus.counts.lessons) throw new Error(`Cobertura incompleta: ${documents.length}/${corpus.counts.lessons}.`)
  const cues = documents.flatMap(({ document }) => document.visualCues)
  const records = cues.map(inventoryRecord)
  const counts = visualCounts(records)
  const baseline = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-CONTINUOUS-READER-0.14C.json'), 'utf8')) as Reader014cBaseline
  const gaps = gapPriorities(baseline, documents)
  const curations = documents.flatMap(({ document }) => document.sectionCurations ?? [])
  const deepResolved = documents.filter(({ document }) => ACADEMY_DEEP_VISUAL_PILOT_IDS.has(document.lessonId) && document.sectionCurations?.length === document.sections.length)
  const supportingResolved = documents.filter(({ document }) => ACADEMY_SUPPORTING_VISUAL_PILOT_IDS.has(document.lessonId) && document.sectionCurations?.length === document.sections.length)
  if (deepResolved.length !== 15 || supportingResolved.length !== 1) throw new Error(`Piloto profundo/supporting incompleto: ${deepResolved.length}/15 y ${supportingResolved.length}/1.`)
  if (curations.some(({ ownerReviewStatus }) => ownerReviewStatus !== 'owner-review-pending')) throw new Error('Una curación fue marcada como revisada sin acción propietaria.')
  if (records.some((record) => record.implementationStatus === 'implemented' && record.semanticSpecificity === 'generic-scaffold')) throw new Error('Un scaffold genérico sigue implementado como visual final.')
  for (const cue of cues.filter(({ diagramData, implementationStatus }) => Boolean(diagramData) && implementationStatus === 'implemented')) {
    if (!academyDiagramIsContentSpecific(cue.diagramData)) throw new Error(`Diagrama genérico mal clasificado: ${cue.cueId}.`)
  }
  const packageLock = JSON.parse(await readFile(join(repositoryRoot, 'package-lock.json'), 'utf8')) as { packages?: Record<string, { version?: string }> }
  const dependencyVersions = Object.fromEntries(['brace-expansion', 'fast-uri', 'nanoid', 'postcss'].map((name) => [name, packageLock.packages?.[`node_modules/${name}`]?.version ?? 'ausente']))
  const curationJson = { schema: 'wplab-academy-section-curation-v1', phase: '0.14D', lessonCount: deepResolved.length + supportingResolved.length, sectionCount: curations.length, curations }
  const inventoryJson = { schema: 'wplab-academy-visual-inventory-v1', phase: '0.14D', baseline014c: baseline.counts, counts, cues: records }
  const stateJson = { schema: 'wplab-academy-3d-visual-states-v1', phase: '0.14D', count: ACADEMY_3D_VISUAL_STATES.length, states: ACADEMY_3D_VISUAL_STATES }
  const readingEssential = cues.filter(({ implementationStatus, readingModePolicy }) => implementationStatus === 'implemented' && ['inline-essential', 'inline-static-summary'].includes(readingModePolicy ?? '')).length
  return new Map<OutputFile, string>([
    ['ACADEMY-VISUAL-INVENTORY-0.14D.md', visualInventoryMarkdown(counts, baseline.counts)],
    ['ACADEMY-VISUAL-INVENTORY-0.14D.json', json(inventoryJson)],
    ['ACADEMY-VISUAL-SPECIFICITY-0.14D.md', specificityMarkdown(records)],
    ['ACADEMY-SECTION-CURATION-0.14D.md', sectionCurationMarkdown(documents)],
    ['ACADEMY-SECTION-CURATION-0.14D.json', json(curationJson)],
    ['ACADEMY-3D-CUE-STATES-0.14D.md', statesMarkdown()],
    ['ACADEMY-3D-CUE-STATES-0.14D.json', json(stateJson)],
    ['ACADEMY-OWNER-REVIEW-0.14D.md', ownerReviewMarkdown(documents)],
    ['ACADEMY-USABILITY-HARNESS-0.14D.md', usabilityMarkdown()],
    ['ACADEMY-READER-METRICS-0.14D.md', metricsMarkdown()],
    ['ACADEMY-READER-RESUME-0.14D.md', resumeMarkdown(documents)],
    ['ACADEMY-VISUAL-GAP-PRIORITIES-0.14D.md', gapsMarkdown(gaps)],
    ['ACADEMY-ACCESSIBILITY-QA-0.14D.md', accessibilityMarkdown()],
    ['ACADEMY-SECURITY-AUDIT-0.14D.md', securityMarkdown(dependencyVersions)],
    ['ACADEMY-UX-QA-0.14D.md', uxQaMarkdown()],
    ['ACADEMY-SCREENSHOT-INDEX-0.14D.md', screenshotIndexMarkdown()],
    ['ACADEMY-0.14D-SUMMARY.md', summaryMarkdown({ counts, documents, curations: curations.length, readingEssential, gaps: gaps.length, baseline })],
  ])
}

export async function runAcademyReaderHardening(repositoryRoot: string, check: boolean): Promise<void> {
  const outputs = await buildAcademyReaderHardeningOutputs(repositoryRoot)
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(generatedRoot, { recursive: true })
  for (const [fileName, content] of outputs) {
    const path = join(generatedRoot, fileName)
    if (check) {
      const current = await readFile(path, 'utf8').catch(() => '')
      if (current !== content) throw new Error(`${fileName} no coincide con la salida determinista 0.14D.`)
    } else await writeFile(path, content, 'utf8')
  }
  console.log(`${check ? 'Verificación' : 'Generación'} 0.14D: ${outputs.size} informes deterministas; ${ACADEMY_014C_BASELINE_SHA256 ? 'baseline 0.14C intacto' : ''}.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runAcademyReaderHardening(resolve(process.cwd()), process.argv.includes('--check')).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
