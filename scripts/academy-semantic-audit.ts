import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { MacroStage, SourceAlias } from '../src/learning/governance/editorialGovernance'
import { loadAcademyCorpus, type AcademyCorpus } from './academy-audit/corpus'
import { analyzeSemanticAudit, type SemanticActivityRow, type SemanticAnalysis, type SemanticLessonRow } from './academy-audit/semanticAnalysis'
import { SEMANTIC_ACTIVITY_GOLDSET, SEMANTIC_LESSON_GOLDSET } from './academy-audit/semanticGoldSet'
import { buildInventorySnapshots, buildSourceAliases } from './academy-audit/semanticSources'
import { buildSourceRegistry, type SourceRegistryResult } from './academy-audit/sources'

export const SEMANTIC_OUTPUT_FILES = [
  'ACADEMY-CONTENT-AUDIT-0.14A1.md',
  'ACADEMY-DETECTOR-CALIBRATION-0.14A1.md',
  'ACADEMY-SEMANTIC-GOLDSET-0.14A1.md',
  'ACADEMY-SEMANTIC-GOLDSET-0.14A1.json',
  'ACADEMY-SOURCE-LESSON-MATRIX-0.14A1.csv',
  'ACADEMY-SOURCE-LESSON-MATRIX-0.14A1.json',
  'ACADEMY-ACTIVITY-EVIDENCE-MATRIX-0.14A1.csv',
  'ACADEMY-ACTIVITY-EVIDENCE-MATRIX-0.14A1.json',
  'ACADEMY-CURRICULUM-STAGE-MAP-0.14A1.md',
  'ACADEMY-CURRICULUM-STAGE-MAP-0.14A1.json',
  'ACADEMY-STAGE-5-GAP-ANALYSIS-0.14A1.md',
  'ACADEMY-SOURCE-ALIASES-0.14A1.md',
  'ACADEMY-SOURCE-ALIASES-0.14A1.json',
  'ACADEMY-GLOBAL-MIGRATIONS-0.14A1.md',
  'ACADEMY-EDITORIAL-PRIORITIES-0.14A1.md',
] as const

type SemanticOutputFile = (typeof SEMANTIC_OUTPUT_FILES)[number]

export const BASELINE_DIGESTS: Record<string, string> = {
  'ACADEMY-SOURCE-REGISTRY.md': '4a38d5de98536b8c50ef7f6d7bce455d25c66f07f9dff56efb6ae12f7cc1b20d',
  'ACADEMY-SOURCE-REGISTRY.json': '33975375d3a783a146cd947e2dde2dc9946aa2a81faaeee3af2b8e1287be6cb4',
  'CHICAGO-SOURCE-INVENTORY.md': '703dc545c2f08594d041892b28ca5f86a30e54c07900be01058dc9c4ac2b34a0',
  'DANIELS-SOURCE-INVENTORY.md': '8aa3860dd44be558f59ee08bdce5554ad7cb96ffb1729e04af9fdb60ac52717a',
  'ACADEMY-SOURCE-LESSON-MATRIX.csv': '4c8657f19c3bd10d8d0050362dd3aa3edd94fcb1070cf66e092ea699506883a8',
  'ACADEMY-SOURCE-LESSON-MATRIX.json': '47fc7b16404dafc360930cccfd34f59df242a0e68cb762cf6c8d5bdfdbfa6914',
  'ACADEMY-ACTIVITY-EVIDENCE-MATRIX.csv': '229c57ba3481aa805e624ce60174e459c2f3cb757afde1205b9044f2877d5ad6',
  'ACADEMY-CONTENT-AUDIT-0.14A.md': 'd981eaf219667d8273a95b4c78f931bc794a0c48eed129039b75bcdf54483c70',
  'ACADEMY-CURRICULUM-MACRO-STAGES.md': '0c21643b1929bc4adb42d3fff485bf9bfaff7ffdb9e20b01a05389283ccb6b24',
  'ACADEMY-EDITORIAL-PRIORITIES.md': '83fdb8a666ffc50a146752601bf976546329f973951da2bcefadb688439262d5',
}

interface BaselineMatrix {
  detectorSummary: Array<{ detectorId: number; category: string; count: number }>
  issues: Array<{ detectorId: number; category: string; entityId: string }>
  rows: SemanticLessonRow[]
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const md = (value: string) => `${value.trim()}\n`
const code = (value: string) => `\`${value.replaceAll('`', '\\`')}\``
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
const percent = (value: number) => `${(value * 100).toFixed(1)}%`

function csvValue(value: unknown): string {
  const normalized = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value ?? '')
  return `"${normalized.replaceAll('"', '""')}"`
}

function csv<T extends object>(rows: T[], columns: Array<keyof T>): string {
  return `${columns.map((column) => csvValue(String(column))).join(',')}\n${rows.map((row) => columns.map((column) => csvValue(row[column])).join(',')).join('\n')}\n`
}

async function assertAndReadBaseline(repositoryRoot: string): Promise<BaselineMatrix> {
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  for (const [fileName, expected] of Object.entries(BASELINE_DIGESTS)) {
    const content = await readFile(join(generatedRoot, fileName))
    const actual = createHash('sha256').update(content).digest('hex')
    if (actual !== expected) throw new Error(`El baseline 0.14A cambió: ${fileName} (${actual} != ${expected}).`)
  }
  return JSON.parse(await readFile(join(generatedRoot, 'ACADEMY-SOURCE-LESSON-MATRIX.json'), 'utf8')) as BaselineMatrix
}

function distribution<T>(values: T[]): Record<string, number> {
  return Object.fromEntries([...new Set(values.map(String))].sort().map((value) => [value, values.filter((item) => String(item) === value).length]))
}

function issueBreakdown(analysis: SemanticAnalysis) {
  return {
    total: analysis.issues.length,
    global: analysis.issues.filter(({ scope }) => scope === 'global').length,
    confirmed: analysis.issues.filter(({ reviewStatus }) => reviewStatus === 'confirmed').length,
    likely: analysis.issues.filter(({ reviewStatus }) => reviewStatus === 'likely').length,
    lowConfidence: analysis.issues.filter(({ confidence }) => confidence === 'low').length,
    derived: analysis.issues.filter(({ detectionMethod }) => detectionMethod === 'derived-from-another-issue').length,
    source: analysis.issues.filter(({ scope, reviewStatus }) => scope === 'source' || scope === 'claim' || reviewStatus === 'needs-source-check').length,
    operationalSafety: analysis.issues.filter(({ detectorId, actionable }) => [15, 16, 24].includes(detectorId) && actionable).length,
    historicalNonOperational: analysis.lessons.filter(({ sourceHistoricalRiskIds, operationalRisk }) => sourceHistoricalRiskIds.length > 0 && operationalRisk.procedureRiskCount === 0).length,
    prerequisite: analysis.issues.filter(({ detectorId }) => detectorId === 8).length,
  }
}

function contentAuditMarkdown(
  corpus: AcademyCorpus,
  registry: SourceRegistryResult,
  analysis: SemanticAnalysis,
  baseline: BaselineMatrix,
  snapshots: ReturnType<typeof buildInventorySnapshots>,
): string {
  const counts = issueBreakdown(analysis)
  const previousTotal = baseline.detectorSummary.reduce((sum, detector) => sum + detector.count, 0)
  const priorities = [...analysis.lessons].sort((left, right) => right.semanticPriority.score - left.semanticPriority.score || left.currentOrder - right.currentOrder).slice(0, 30)
  const improper = analysis.lessons.filter(({ prerequisiteAudit }) => prerequisiteAudit.some(({ classification }) => classification === 'improper'))
  const operational = analysis.lessons.filter(({ operationalRisk }) => operationalRisk.procedureRiskCount > 0)
  const snapshotRows = snapshots.map((snapshot) => `| ${code(snapshot.sourceId)} | ${snapshot.inventoryMethod} | ${code(snapshot.verifiedAgainstSha256)} | ${snapshot.verificationValid ? 'válido' : 'INVALIDADO — revisar inventario'} | ${snapshot.sourceSnapshotVersion} |`).join('\n')
  return md(`# Auditoría semántica integral de la Academia — 0.14A.1

Huella del corpus: ${code(corpus.digest)}  
Baseline preservado: **0.14A (${previousTotal} instancias sin calibrar)**  
Paquetes/rutas/módulos/lecciones/actividades visibles: **${corpus.counts.packages}/${corpus.counts.routes}/${corpus.counts.modules}/${corpus.counts.lessons}/${corpus.counts.activities}**

## Resultado calibrado

| Grupo | Conteo |
|---|---:|
| Incidencias registradas 0.14A.1 | ${counts.total} |
| Migraciones globales (raíces) | ${counts.global} |
| Incidencias confirmadas | ${counts.confirmed} |
| Incidencias probables | ${counts.likely} |
| Heurísticas de baja confianza | ${counts.lowConfidence} |
| Incidencias derivadas | ${counts.derived} |
| Problemas de claim/fuente | ${counts.source} |
| Seguridad operativa accionable | ${counts.operationalSafety} |
| Riesgo histórico no operativo | ${counts.historicalNonOperational} lecciones |
| Prerrequisitos impropios | ${counts.prerequisite} incidencias / ${improper.length} lecciones |
| Falsos positivos eliminados por detectores recalibrados | ${analysis.falsePositivesEliminated} |
| Falsos negativos descubiertos y confirmados | ${analysis.falseNegativesDiscovered} enlaces en ${improper.length} lecciones |

Las ${analysis.globalMigrations.reduce((sum, migration) => sum + migration.affectedEntities, 0)} apariciones estructurales de idioma, módulo unitario y nombre redundante se explican mediante **${analysis.globalMigrations.length} causas globales** y no incrementan prioridades individuales.

## Fuentes e inventarios

Registros de fuente: **${registry.records.length}**; originales accesibles: **${registry.localOriginals.filter(({ available }) => available).length}/${registry.localOriginals.length}**.

| Snapshot | Método | SHA-256 verificado | Estado | Versión |
|---|---|---|---|---|
${snapshotRows}

Los inventarios Chicago y Daniels son snapshots curados/híbridos. Esta ejecución compara hash; no afirma volver a extraer por completo el ISO o PDF. Un hash diferente invalida la verificación.

## Prerrequisitos semánticos reales

${improper.length ? improper.map((row) => `- ${code(row.lessonId)}: ${row.prerequisiteAudit.filter(({ classification }) => classification === 'improper').map(({ conceptId, reason }) => `${code(conceptId)} — ${reason}`).join('; ')}`).join('\n') : '- Ninguno detectado.'}

## Seguridad y vigencia

- Riesgo de obra, riesgo de claim, riesgo de procedimiento y riesgo operativo de lección se contabilizan por separado.
- Una referencia histórica con químicos, radio, ácido, llama o maquinaria no bloquea una lección conceptual por herencia.
- Solo se bloquea una combinación verificable de operación accionable, verbo, peligro, secuencia y contexto de ejecución.
- Lecciones con procedimiento operativo bloqueado: **${operational.length}**.${operational.length ? ` ${operational.map(({ lessonId }) => code(lessonId)).join(', ')}` : ''}

## Gold set

Fixtures: **${analysis.goldEvaluation.lessonFixtures} lecciones + ${analysis.goldEvaluation.activityFixtures} actividades**; aserciones: **${analysis.goldEvaluation.passed}/${analysis.goldEvaluation.assertions} correctas**; fallos: **${analysis.goldEvaluation.failed}**.

## Top 30 de prioridad editorial

| Pos. | Score | Nivel | Confianza | Lección | Raíces | Acción |
|---:|---:|---|---|---|---:|---|
${priorities.map((row, index) => `| ${index + 1} | ${row.semanticPriority.score} | ${row.semanticPriority.level} | ${row.semanticPriority.confidence} | ${code(row.lessonId)} | ${row.semanticPriority.rootCauses.length} | ${row.semanticPriority.recommendedNextAction} |`).join('\n')}

## Decisiones que requieren revisión humana

- Resolver los prerrequisitos impropios mediante edición curada; esta auditoría solo propone.
- Confirmar locadores de claims numéricos y fórmulas en la página/figura/tabla aplicable.
- Decidir si los pasaportes psicomotores obtendrán una vía física P separada de las actividades virtuales actuales.
- Revisar clasificaciones de confianza baja y las alternativas registradas antes de mover contenido.
- Revisar los vacíos de integración de etapa 5 sin convertir fabricación aislada en construcción de reloj.

## Limitaciones

- La clasificación evita usar el cuerpo completo como señal dominante, pero el texto visible sigue siendo necesario para auditar claims y procedimientos concretos.
- Los campos de autoría no declaran hoy una fuente primaria explícita; la fuente derivada se marca como regla semántica, nunca por posición incidental.
- El gold set fija casos curados, no una distribución numérica objetivo.
- No se modificó contenido visible, navegación, segmentación, IDs, progreso, sesiones ni bases locales.`)
}

const detectorMethods: Record<number, { definition: string; old: string; next: string; falsePositives: string; falseNegatives: string }> = {
  3: { definition: 'Detecta locale en idéntico a es.', old: 'Una incidencia por lección.', next: 'Una migración global exacta con localeStatus.', falsePositives: 'No era falso que estuvieran duplicados; era falsa la prioridad individual.', falseNegatives: 'Traducciones parciales no equivalentes requieren otra política.' },
  8: { definition: 'Detecta prerrequisitos semánticamente impropios.', old: 'Solo comparaba orden de rutas.', next: 'Origen exacto, orden de lección, rol y overrides curados.', falsePositives: 'Referencias laterales justificadas.', falseNegatives: 'Aplicaciones concretas no marcadas en metadatos.' },
  13: { definition: 'Detecta dato numérico sin localizador aplicable.', old: 'Buscaba números en todo el cuerpo y cualquier página en la lección.', next: 'Evalúa cada claim y su fuente primaria derivada.', falsePositives: 'Números editoriales o históricos fuera de claims.', falseNegatives: 'Datos numéricos no formalizados como claim.' },
  14: { definition: 'Detecta fórmula OCR no verificada.', old: 'Patrón de fórmula en cuerpo + cualquier fuente OCR.', next: 'Fórmula concreta en claim vinculada a fuente OCR.', falsePositives: 'Palabras como fórmula o símbolos en contexto.', falseNegatives: 'Fórmulas aún no formalizadas como claim.' },
  15: { definition: 'Detecta procedimiento histórico peligroso accionable.', old: 'Heredaba peligros de toda fuente.', next: 'Exige verbo, peligro, secuencia, contexto y fragmento exacto.', falsePositives: 'Menciones, advertencias y referencias históricas.', falseNegatives: 'Paráfrasis peligrosas sin vocabulario reconocido.' },
  16: { definition: 'Exige seguridad moderna para operación real.', old: 'Se derivaba de peligro de fuente.', next: 'Solo deriva de procedimiento accionable con exposición.', falsePositives: 'Lecciones conceptuales con fuente histórica.', falseNegatives: 'Operaciones no estructuradas como procedimiento.' },
  17: { definition: 'Separa claim de competencia física y evidencia P.', old: 'Infería destreza física y recomendaba un escalar.', next: 'Perfil combinable; P solo con ejecución real solicitada.', falsePositives: 'Simulaciones de desmontaje y diseño.', falseNegatives: 'Competencias físicas no declaradas.' },
  18: { definition: 'Comprueba apoyo visual contra arquetipo calibrado.', old: 'Dependía del arquetipo inferido del cuerpo.', next: 'Usa jerarquía curada/metadatos/contrato y enlaza derivaciones.', falsePositives: 'Conceptuales mal etiquetadas como psicomotoras.', falseNegatives: 'Visual externo no declarado en metadatos.' },
  23: { definition: 'Detecta base secundaria como autoridad técnica.', old: 'Usaba sourceIds[0].', next: 'Evalúa el claim y roles de fuente por autoridad.', falsePositives: 'Orden incidental.', falseNegatives: 'Claims no formalizados.' },
}

function goldMetric(detectorId: number, analysis: SemanticAnalysis): { cases: string[]; precision: string; recall: string } {
  if (![8, 15, 16, 17, 23].includes(detectorId)) return { cases: [], precision: 'no calculable', recall: 'no calculable' }
  if ([15, 16].includes(detectorId)) {
    const negativeCases = [
      'lesson.horology.functional-equivalence',
      'lesson.encyclopedia.history-language.medir-el-tiempo',
      'lesson.encyclopedia.history-language.toh-tiempo-escalas',
      'lesson.encyclopedia.service-tribology.tm-inspeccion-previa',
    ]
    const falsePositives = analysis.issues.filter((issue) => issue.detectorId === detectorId && negativeCases.includes(issue.entityId)).length
    return { cases: negativeCases, precision: `no calculable; especificidad ${(negativeCases.length - falsePositives)}/${negativeCases.length}`, recall: 'no calculable (sin positivo peligroso curado)' }
  }
  if (detectorId === 23) {
    const lesson = analysis.lessons.find(({ lessonId }) => lessonId === 'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b')
    const claimIds = new Set(lesson?.claimAudits.map(({ claimId }) => claimId) ?? [])
    const falsePositive = analysis.issues.some((issue) => issue.detectorId === 23 && claimIds.has(issue.entityId))
    return { cases: [lesson?.lessonId ?? 'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b'], precision: `no calculable; especificidad ${falsePositive ? '0/1' : '1/1'}`, recall: 'no calculable (sin base secundaria etiquetada como autoridad)' }
  }
  const fixtures = SEMANTIC_LESSON_GOLDSET.filter((fixture) => detectorId === 8 ? fixture.prerequisiteIssuesExpected.length > 0
    : detectorId === 17 ? fixture.physicalSkillClaimExpected
      : fixture.safetyExpected === 'prohibited-in-academy')
  const actual = new Set(analysis.issues.filter((issue) => issue.detectorId === detectorId).map(({ entityId }) => entityId))
  const positives = fixtures.filter(({ lessonId }) => actual.has(lessonId)).length
  const precision = actual.size ? `${positives}/${actual.size}` : fixtures.length ? '0/0 (sin predicciones)' : 'no calculable'
  const recall = fixtures.length ? `${positives}/${fixtures.length}` : 'no calculable (sin positivos etiquetados)'
  return { cases: fixtures.map(({ lessonId }) => lessonId), precision, recall }
}

function calibrationMarkdown(analysis: SemanticAnalysis): string {
  const rows = analysis.detectorSummary.map((detector) => {
    const methods = detectorMethods[detector.detectorId] ?? {
      definition: detector.title,
      old: 'Regla 0.14A conservada.',
      next: 'Misma señal con detectionMethod, confidence, scope y reviewStatus.',
      falsePositives: 'Requiere revisión humana.',
      falseNegatives: 'No calculable con el gold set actual.',
    }
    const metric = goldMetric(detector.detectorId, analysis)
    return `## ${detector.detectorId}. ${detector.title}\n\n- **Definición:** ${methods.definition}\n- **Método anterior:** ${methods.old}\n- **Método nuevo:** ${methods.next}\n- **Falsos positivos conocidos:** ${methods.falsePositives}\n- **Falsos negativos conocidos:** ${methods.falseNegatives}\n- **Casos gold:** ${metric.cases.length ? metric.cases.map(code).join(', ') : 'sin etiqueta específica'}\n- **Precisión gold:** ${metric.precision}\n- **Recall gold:** ${metric.recall}\n- **Confianza:** ${detector.confirmed ? 'alta en incidencias confirmadas' : detector.likely ? 'media' : 'baja/no calculable'}\n- **Antes → después:** ${detector.countBefore} → ${detector.countAfter}${detector.globalAffectedEntities ? ` (+ ${detector.globalAffectedEntities} entidades en migración global)` : ''}\n- **Variación:** ${detector.variationReason}`
  }).join('\n\n')
  return md(`# Calibración de detectores — 0.14A.1

La unidad de conteo 0.14A.1 es una incidencia revisable o una causa global. Una incidencia derivada conserva \`rootCauseId\` y no suma como defecto independiente en prioridad.

${rows}`)
}

function goldsetMarkdown(): string {
  const lessonRows = SEMANTIC_LESSON_GOLDSET.map((fixture) => `| ${code(fixture.lessonId)} | ${fixture.macroStageExpected} | ${fixture.trackRoleExpected} | ${fixture.archetypeExpected} | ${fixture.evidenceProfileExpected.modalities.join('+')} | ${fixture.executionTierExpected} | ${fixture.safetyExpected} | ${fixture.prerequisiteIssuesExpected.join(', ') || '—'} |`).join('\n')
  const activityRows = SEMANTIC_ACTIVITY_GOLDSET.map((fixture) => `| ${code(fixture.activityId)} | ${code(fixture.lessonId)} | ${fixture.archetypeExpected} | ${fixture.evidenceProfileExpected.modalities.join('+')} | ${fixture.evidenceProfileExpected.physicalExecutionRequired ? 'sí' : 'no'} | ${fixture.executionTierExpected} | ${fixture.safetyExpected} |`).join('\n')
  return md(`# Gold set semántico — 0.14A.1

Conjunto curado: **${SEMANTIC_LESSON_GOLDSET.length} lecciones** y **${SEMANTIC_ACTIVITY_GOLDSET.length} actividades**. Los fixtures son overrides explícitos y no una distribución artificial.

## Lecciones

| lessonId | Etapa | Track | Arquetipo | Evidencia | Ejecución | Seguridad | Prerrequisitos esperados |
|---|---|---|---|---|---|---|---|
${lessonRows}

## Actividades

| activityId | lessonId | Arquetipo | Evidencia | P real | Ejecución | Seguridad |
|---|---|---|---|---|---|---|
${activityRows}`)
}

const stageNames: Record<MacroStage, string> = {
  '0-prepare-bench-and-control': '0. Preparar el banco y adquirir control',
  '1-understand-watch-as-system': '1. Entender el reloj como sistema',
  '2-understand-mechanical-systems': '2. Comprender los sistemas mecánicos',
  '3-observe-measure-diagnose': '3. Observar, medir y diagnosticar',
  '4-work-on-real-calibre': '4. Trabajar sobre un calibre real',
  '5-build-complete-watch': '5. Construir un reloj completo',
  '6-repair-adapt-manufacture-components': '6. Reparar, adaptar y fabricar componentes',
  '7-design-validate-own-watch-or-movement': '7. Diseñar y validar un reloj o movimiento propio',
}

function stageMapMarkdown(analysis: SemanticAnalysis, before: BaselineMatrix): string {
  const stageRows = Object.entries(stageNames).map(([stage, name]) => {
    const rows = analysis.lessons.filter(({ macroStage }) => macroStage === stage)
    return `| ${name} | ${rows.length} | ${rows.filter(({ trackRole }) => trackRole === 'core').length} | ${rows.filter(({ trackRole }) => trackRole === 'specialization').length} | ${rows.filter(({ trackRole }) => trackRole === 'historical-case').length} |`
  }).join('\n')
  const lessonRows = analysis.lessons.map((row) => `| ${row.currentOrder} | ${code(row.lessonId)} | ${row.macroStage} | ${row.trackRole} | ${row.recommendedLearningArchetype} | ${row.archetypeClassification.classificationMethod} | ${row.archetypeClassification.classificationConfidence} |`).join('\n')
  const beforeDistribution = distribution(before.rows.map(({ recommendedLearningArchetype }) => recommendedLearningArchetype))
  const afterDistribution = distribution(analysis.lessons.map(({ recommendedLearningArchetype }) => recommendedLearningArchetype))
  return md(`# Mapa curricular curado — 0.14A.1

Macroetapa y track son ejes separados. La ruta MIYOTA 2035 permanece como especialización no bloqueante; MIYOTA 8215 permanece en etapa 4. No se modifica el orden visible.

## Distribución por etapa

| Etapa | Lecciones | Core | Especialización | Caso histórico |
|---|---:|---:|---:|---:|
${stageRows}

## Distribución de arquetipos antes/después

- 0.14A: ${Object.entries(beforeDistribution).map(([key, value]) => `${key}=${value}`).join(', ')}
- 0.14A.1: ${Object.entries(afterDistribution).map(([key, value]) => `${key}=${value}`).join(', ')}

## Mapa por lección

| Orden | lessonId | Macroetapa | Track | Arquetipo | Método | Confianza |
|---:|---|---|---|---|---|---|
${lessonRows}`)
}

interface Stage5Topic {
  topic: string
  pattern: RegExp
  expectedContext: 'build-integrate' | 'repair' | 'manufacture' | 'design-from-zero'
}

const stage5TopicRows: Array<[string, RegExp, Stage5Topic['expectedContext']]> = [
  ['selección de movimiento', /selecci[oó]n.*movimiento|movimiento adquirido/, 'build-integrate'],
  ['dimensiones exteriores', /dimension.*exterior|arquitectura exterior/, 'build-integrate'],
  ['compatibilidad movimiento/caja', /compatibilidad.*caja|encaje del movimiento|movimiento.*caja/, 'build-integrate'],
  ['aro o movement holder', /aro|holder|anillo de movimiento/, 'build-integrate'],
  ['tija', /tija/, 'build-integrate'],
  ['corona', /corona/, 'build-integrate'],
  ['tubo', /tubo/, 'build-integrate'],
  ['esfera', /esfera/, 'build-integrate'],
  ['pies de esfera', /pies? de esfera/, 'build-integrate'],
  ['diámetro de esfera', /diametro de esfera/, 'build-integrate'],
  ['agujeros de agujas', /agujero.*agujas?/, 'build-integrate'],
  ['alturas de agujas', /altura.*agujas?/, 'build-integrate'],
  ['cañón de minutos', /canon de minutos/, 'build-integrate'],
  ['rueda de horas', /rueda de horas/, 'build-integrate'],
  ['apilamiento', /apilamiento|presupuesto axial|holguras/, 'build-integrate'],
  ['cristal', /cristal/, 'build-integrate'],
  ['fondo', /fondo/, 'build-integrate'],
  ['juntas', /juntas?/, 'build-integrate'],
  ['hermeticidad', /hermetic|estanqueidad|rutas? de fuga/, 'build-integrate'],
  ['caja', /caja/, 'build-integrate'],
  ['interferencias', /interferencia/, 'build-integrate'],
  ['ergonomía', /ergonomia|experiencia de uso/, 'build-integrate'],
  ['montaje final', /montaje final|integracion final/, 'build-integrate'],
  ['validación del prototipo', /validacion.*prototipo|puerta de prototipo/, 'build-integrate'],
  ['dossier de compatibilidad', /dossier.*compatibilidad|dossier integral/, 'build-integrate'],
  ['piezas donantes en reloj completo', /donante/, 'build-integrate'],
]

const stage5Topics: Stage5Topic[] = stage5TopicRows.map(([topic, pattern, expectedContext]) => ({ topic, pattern, expectedContext }))

function stage5Analysis(analysis: SemanticAnalysis): Array<Stage5Topic & { status: 'covered' | 'partial' | 'gap'; lessonIds: string[]; notes: string }> {
  return stage5Topics.map((topic) => {
    const candidates = analysis.lessons.filter((row) => {
      const searchable = normalizeForSearch([row.visibleTitle, row.currentObservableObjective, ...row.claimAudits.flatMap(({ numericValues }) => numericValues)].join(' '))
      return topic.pattern.test(searchable)
    })
    const integrated = candidates.filter(({ macroStage }) => macroStage === '5-build-complete-watch')
    return {
      ...topic,
      status: integrated.length ? 'covered' : candidates.length ? 'partial' : 'gap',
      lessonIds: (integrated.length ? integrated : candidates).map(({ lessonId }) => lessonId),
      notes: integrated.length ? 'Cubierto en una lección curada de construir/integrar.' : candidates.length ? 'Existe contenido relacionado, pero está clasificado como reparar, fabricar, especialización o diseño; no se fuerza a etapa 5.' : 'No se localizó cobertura verificable en título, objetivo o claim estructurado.',
    }
  })
}

function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es')
}

function stage5Markdown(analysis: SemanticAnalysis): string {
  const rows = stage5Analysis(analysis)
  const stage5Lessons = analysis.lessons.filter(({ macroStage }) => macroStage === '5-build-complete-watch')
  return md(`# Análisis de vacíos reales de etapa 5 — 0.14A.1

Lecciones curadas en etapa 5: **${stage5Lessons.length}**. Se distingue construir/integrar de reparar, fabricar un componente o diseñar desde cero.

| Tema | Estado | Lecciones aplicables | Nota |
|---|---|---|---|
${rows.map((row) => `| ${row.topic} | ${row.status} | ${row.lessonIds.map(code).join(', ') || '—'} | ${row.notes} |`).join('\n')}

## Resumen

- Cubiertos: **${rows.filter(({ status }) => status === 'covered').length}**
- Parciales: **${rows.filter(({ status }) => status === 'partial').length}**
- Vacíos: **${rows.filter(({ status }) => status === 'gap').length}**

Una lección de fabricación aislada no se promueve a etapa 5. Los vacíos son propuestas de revisión para 0.14B, no autorización para crear laboratorios o mover contenido.`)
}

function aliasesMarkdown(aliases: SourceAlias[]): string {
  const changed = aliases.filter(({ deprecationStatus }) => deprecationStatus !== 'canonical')
  return md(`# Alias canónicos de fuentes — 0.14A.1

IDs preservados: **${aliases.length}/${aliases.length}**. Alias o localizadores actualizados: **${changed.length}**. Ninguna lección se migra automáticamente.

| sourceId existente | canonicalSourceId | Estado | Mismo documento | Localizador actual | Localizador anterior | Notas |
|---|---|---|---|---|---|---|
${changed.map((alias) => `| ${code(alias.sourceId)} | ${code(alias.canonicalSourceId)} | ${alias.deprecationStatus} | ${alias.sameDocument ? 'sí' : 'no/por verificar'} | ${pipe(alias.currentLocator)} | ${pipe(alias.previousLocator)} | ${pipe(alias.migrationNotes.join('; '))} |`).join('\n')}

Los PDF específicos de MIYOTA (drawing, specification, instruction manual, parts list) no se fusionan con la página de producto. Solo se agrupan variantes confirmadas del mismo recurso.`)
}

function globalMigrationsMarkdown(analysis: SemanticAnalysis): string {
  return md(`# Migraciones globales de la Academia — 0.14A.1

Estas causas se excluyen de la puntuación individual. No se cambia interfaz, navegación, campos ni módulos en esta fase.

| ID | Categoría | Entidades | Prevalencia | Método | Confianza | Recomendación |
|---|---|---:|---:|---|---|---|
${analysis.globalMigrations.map((migration) => `| ${code(migration.migrationId)} | ${migration.category} | ${migration.affectedEntities} | ${percent(migration.prevalence)} | ${migration.detectionMethod} | ${migration.confidence} | ${migration.recommendation} |`).join('\n')}

## Política de locale

- \`localeStatus: placeholder-duplicated\`
- \`supportedLocaleActual: es\`
- \`recommendation: hide-or-disable-en-until-real-translation\`

La recomendación se registra; no se oculta ni elimina todavía ningún campo.`)
}

function prioritiesMarkdown(analysis: SemanticAnalysis): string {
  const rows = [...analysis.lessons].sort((left, right) => right.semanticPriority.score - left.semanticPriority.score || left.currentOrder - right.currentOrder || left.lessonId.localeCompare(right.lessonId))
  const levels = distribution(rows.map(({ semanticPriority }) => semanticPriority.level))
  const saturation = Math.max(...Object.values(levels)) / rows.length
  return md(`# Prioridades editoriales calibradas — 0.14A.1

## Modelo de puntuación

Se agrupan incidencias por causa raíz. Solo una raíz aporta puntos; sus derivaciones explican consecuencias. Se combinan exposición, posición core, daño pedagógico, riesgo técnico, importancia aguas abajo, incertidumbre de fuente, visual imprescindible, certeza del detector y coste aproximado. Idioma duplicado, módulo unitario y nombre redundante quedan fuera.

Distribución: ${Object.entries(levels).map(([level, count]) => `${level}=${count}`).join(', ')}. ${saturation >= 0.7 ? '**Advertencia:** la distribución sigue saturada y requiere revisión del modelo.' : 'La distribución no está saturada en una sola categoría.'}

| Pos. | Score | Nivel | Conf. | Lección | Confirmado | Heurístico | Global excluido | Raíces | Coste | Próxima acción | Razón |
|---:|---:|---|---|---|---:|---:|---:|---:|---|---|---|
${rows.map((row, index) => `| ${index + 1} | ${row.semanticPriority.score} | ${row.semanticPriority.level} | ${row.semanticPriority.confidence} | ${code(row.lessonId)} | ${row.semanticPriority.confirmedIssuePoints} | ${row.semanticPriority.heuristicIssuePoints} | ${row.semanticPriority.globalIssuesExcluded.length} | ${row.semanticPriority.rootCauses.length} | ${row.semanticPriority.estimatedCorrectionCost} | ${row.semanticPriority.recommendedNextAction} | ${pipe(row.semanticPriority.rationale.join('; '))} |`).join('\n')}`)
}

const lessonColumns: Array<keyof SemanticLessonRow> = [
  'packageId', 'packageVersion', 'routeId', 'moduleId', 'lessonId', 'visibleTitle', 'currentOrder', 'routeOrder', 'moduleOrder', 'lessonOrder',
  'currentType', 'macroStage', 'trackRole', 'currentObservableObjective', 'objectiveQuality', 'currentLearningArchetype', 'recommendedLearningArchetype',
  'archetypeClassification', 'declaredPrimarySource', 'secondarySources', 'sourceRoles', 'currentCitations', 'citationPrecision', 'claimAudits',
  'requiredConcepts', 'prerequisiteAudit', 'prerequisiteProblems', 'improperHigherDependencies', 'visualCoverage', 'requiredVisuals',
  'currentEvidenceLevel', 'recommendedEvidenceLevel', 'evidenceProfile', 'executionTier', 'safetyStatus', 'operationalRisk', 'sourceHistoricalRiskIds',
  'historicalStatus', 'localeStatus', 'supportedLocaleActual', 'localeRecommendation', 'editorialProblems', 'editorialStatus', 'recommendedAction',
  'semanticPriority', 'issueIds', 'globalIssueIds', 'rootCauseIds', 'manualReviewRequired',
]

const activityColumns: Array<keyof SemanticActivityRow> = [
  'packageId', 'routeId', 'moduleId', 'lessonId', 'activityId', 'activityOrder', 'visibleTitle', 'practiceType', 'macroStage', 'trackRole', 'archetype',
  'helpAvailable', 'independentDemonstration', 'transfer', 'retention', 'requestedEvidence', 'physicalCompetenceClaim', 'physicalExecutionDeclared',
  'currentEvidenceLevel', 'recommendedEvidenceLevel', 'evidenceProfile', 'executionTier', 'risk', 'operationalRisk', 'objectiveAlignment', 'recommendedAction', 'issueIds', 'rootCauseIds', 'manualReviewRequired',
]

export async function buildSemanticAuditArtifacts(repositoryRoot: string): Promise<Map<SemanticOutputFile, string>> {
  const baseline = await assertAndReadBaseline(repositoryRoot)
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const registry = await buildSourceRegistry(repositoryRoot, corpus)
  const analysis = await analyzeSemanticAudit(repositoryRoot, corpus, registry.records)
  const aliases = buildSourceAliases(registry.records)
  const snapshots = buildInventorySnapshots(registry)
  if (analysis.lessons.length !== corpus.counts.lessons || analysis.activities.length !== corpus.counts.activities) throw new Error('La matriz semántica no cubre todo el contenido visible.')
  if (analysis.goldEvaluation.failed) throw new Error(`El gold set tiene ${analysis.goldEvaluation.failed} fallos: ${JSON.stringify(analysis.goldEvaluation.failures.slice(0, 5))}`)
  if (aliases.length !== registry.records.length) throw new Error('El mapa de alias no preserva todos los sourceId.')
  if (snapshots.some(({ verificationValid }) => !verificationValid)) throw new Error('Un inventario curado cambió de hash y requiere revalidación manual.')

  const beforeArchetypes = distribution(baseline.rows.map(({ recommendedLearningArchetype }) => recommendedLearningArchetype))
  const afterArchetypes = distribution(analysis.lessons.map(({ recommendedLearningArchetype }) => recommendedLearningArchetype))
  const beforeEvidence = distribution(baseline.rows.map(({ recommendedEvidenceLevel }) => recommendedEvidenceLevel))
  const afterEvidence = distribution(analysis.lessons.map(({ evidenceProfile }) => evidenceProfile.modalities.join('+')))
  const matrixJson = {
    schema: 'wplab-academy-semantic-lesson-matrix-v1', phase: '0.14A.1', baselinePhase: '0.14A', corpusDigest: corpus.digest, counts: corpus.counts,
    distributions: { archetypesBefore: beforeArchetypes, archetypesAfter: afterArchetypes, evidenceBefore: beforeEvidence, evidenceAfter: afterEvidence },
    detectorSummary: analysis.detectorSummary, globalMigrations: analysis.globalMigrations, issues: analysis.issues, inventorySnapshots: snapshots, rows: analysis.lessons,
  }
  const activityJson = {
    schema: 'wplab-academy-semantic-activity-evidence-matrix-v1', phase: '0.14A.1', corpusDigest: corpus.digest,
    counts: { activities: analysis.activities.length }, evidenceDistribution: distribution(analysis.activities.map(({ evidenceProfile }) => evidenceProfile.modalities.join('+'))), rows: analysis.activities,
  }
  const goldJson = {
    schema: 'wplab-academy-semantic-goldset-v1', phase: '0.14A.1', corpusDigest: corpus.digest,
    coverage: {
      macroStages: distribution(SEMANTIC_LESSON_GOLDSET.map(({ macroStageExpected }) => macroStageExpected)),
      archetypes: distribution(SEMANTIC_LESSON_GOLDSET.map(({ archetypeExpected }) => archetypeExpected)),
      trackRoles: distribution(SEMANTIC_LESSON_GOLDSET.map(({ trackRoleExpected }) => trackRoleExpected)),
    },
    evaluation: analysis.goldEvaluation, lessons: SEMANTIC_LESSON_GOLDSET, activities: SEMANTIC_ACTIVITY_GOLDSET,
  }
  const stageJson = {
    schema: 'wplab-academy-curriculum-stage-map-v1', phase: '0.14A.1', corpusDigest: corpus.digest,
    stageNames, distributions: { macroStage: distribution(analysis.lessons.map(({ macroStage }) => macroStage)), trackRole: distribution(analysis.lessons.map(({ trackRole }) => trackRole)), archetypeBefore: beforeArchetypes, archetypeAfter: afterArchetypes },
    rows: analysis.lessons.map(({ lessonId, routeId, moduleId, currentOrder, macroStage, trackRole, recommendedLearningArchetype, archetypeClassification }) => ({ lessonId, routeId, moduleId, currentOrder, macroStage, trackRole, archetype: recommendedLearningArchetype, classification: archetypeClassification })),
  }
  const aliasesJson = { schema: 'wplab-academy-source-aliases-v1', phase: '0.14A.1', corpusDigest: corpus.digest, counts: { sourceIdsPreserved: aliases.length, aliases: aliases.filter(({ aliasOf }) => aliasOf !== null).length, locatorUpdates: aliases.filter(({ deprecationStatus }) => deprecationStatus === 'locator-updated').length }, aliases }
  return new Map<SemanticOutputFile, string>([
    ['ACADEMY-CONTENT-AUDIT-0.14A1.md', contentAuditMarkdown(corpus, registry, analysis, baseline, snapshots)],
    ['ACADEMY-DETECTOR-CALIBRATION-0.14A1.md', calibrationMarkdown(analysis)],
    ['ACADEMY-SEMANTIC-GOLDSET-0.14A1.md', goldsetMarkdown()],
    ['ACADEMY-SEMANTIC-GOLDSET-0.14A1.json', json(goldJson)],
    ['ACADEMY-SOURCE-LESSON-MATRIX-0.14A1.csv', csv(analysis.lessons, lessonColumns)],
    ['ACADEMY-SOURCE-LESSON-MATRIX-0.14A1.json', json(matrixJson)],
    ['ACADEMY-ACTIVITY-EVIDENCE-MATRIX-0.14A1.csv', csv(analysis.activities, activityColumns)],
    ['ACADEMY-ACTIVITY-EVIDENCE-MATRIX-0.14A1.json', json(activityJson)],
    ['ACADEMY-CURRICULUM-STAGE-MAP-0.14A1.md', stageMapMarkdown(analysis, baseline)],
    ['ACADEMY-CURRICULUM-STAGE-MAP-0.14A1.json', json(stageJson)],
    ['ACADEMY-STAGE-5-GAP-ANALYSIS-0.14A1.md', stage5Markdown(analysis)],
    ['ACADEMY-SOURCE-ALIASES-0.14A1.md', aliasesMarkdown(aliases)],
    ['ACADEMY-SOURCE-ALIASES-0.14A1.json', json(aliasesJson)],
    ['ACADEMY-GLOBAL-MIGRATIONS-0.14A1.md', globalMigrationsMarkdown(analysis)],
    ['ACADEMY-EDITORIAL-PRIORITIES-0.14A1.md', prioritiesMarkdown(analysis)],
  ])
}

export async function writeOrCheckSemanticAuditArtifacts(repositoryRoot: string, check: boolean): Promise<void> {
  const artifacts = await buildSemanticAuditArtifacts(repositoryRoot)
  const outputRoot = join(repositoryRoot, 'docs', 'generated')
  await mkdir(outputRoot, { recursive: true })
  const drift: string[] = []
  for (const [fileName, content] of artifacts) {
    const path = join(outputRoot, fileName)
    if (check) {
      try {
        if (await readFile(path, 'utf8') !== content) drift.push(fileName)
      } catch {
        drift.push(fileName)
      }
    } else await writeFile(path, content, 'utf8')
  }
  if (drift.length) throw new Error(`Salidas semánticas ausentes o no deterministas: ${drift.join(', ')}`)
  console.log(`${check ? 'Verificación' : 'Generación'} semántica 0.14A.1: ${artifacts.size} salidas correctas.`)
}

async function main(): Promise<void> {
  await writeOrCheckSemanticAuditArtifacts(process.cwd(), process.argv.includes('--check'))
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entry) await main()
