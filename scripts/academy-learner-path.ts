import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ACADEMY_LEARNER_PATH } from '../src/learning/academy/path/academyLearnerPath'
import { ACADEMY_LIBRARY_DESTINATION_GROUPS, ACADEMY_LIBRARY_ROUTE_GROUPS } from '../src/learning/academy/path/academyLibrary'
import { ACADEMY_PREREQUISITE_RESOLUTIONS } from '../src/learning/academy/path/academyPathPrerequisites'
import { ACADEMY_STAGE_5_BLUEPRINT } from '../src/learning/academy/path/academyStage5Blueprint'
import { validateAcademyLearnerPath } from '../src/learning/academy/path/academyPathValidation'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { loadAcademyCorpus } from './academy-audit/corpus'

export const ACADEMY_PATH_OUTPUT_FILES = [
  'ACADEMY-LEARNER-PATH-0.14B.md',
  'ACADEMY-LEARNER-PATH-0.14B.json',
  'ACADEMY-INFORMATION-ARCHITECTURE-0.14B.md',
  'ACADEMY-PREREQUISITE-RESOLUTIONS-0.14B.md',
  'ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B.md',
  'ACADEMY-PROGRESS-COMPATIBILITY-0.14B.md',
  'ACADEMY-UX-QA-0.14B.md',
] as const

type OutputFile = (typeof ACADEMY_PATH_OUTPUT_FILES)[number]

const md = (value: string) => `${value.trim()}\n`
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`
const code = (value: string) => `\`${value.replaceAll('`', '\\`')}\``
const pipe = (value: unknown) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')

export async function buildAcademyLearnerPathOutputs(repositoryRoot: string): Promise<Map<OutputFile, string>> {
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const { routes, lessons, activities } = product
  const validationIssues = validateAcademyLearnerPath(product)
  if (validationIssues.length) throw new Error(`El manifiesto 0.14B contiene ${validationIssues.length} incidencias: ${JSON.stringify(validationIssues)}`)

  const lessonById = new Map(lessons.map((item) => [item.id, item]))
  const activityById = new Map(activities.map((item) => [item.id, item]))
  const routeById = new Map(routes.map((item) => [item.id, item]))
  const allLibraryRoutes = ACADEMY_LIBRARY_ROUTE_GROUPS.flatMap(({ routeIds }) => routeIds)
  const visibleRouteIds = routes.filter(({ demo }) => !demo).map(({ id }) => id)
  const missingLibraryRoutes = visibleRouteIds.filter((id) => !allLibraryRoutes.includes(id))
  const duplicateLibraryRoutes = allLibraryRoutes.filter((id, index) => allLibraryRoutes.indexOf(id) !== index)
  const unknownLibraryRoutes = allLibraryRoutes.filter((id) => !routeById.has(id))
  if (missingLibraryRoutes.length || duplicateLibraryRoutes.length || unknownLibraryRoutes.length) {
    throw new Error(`La Biblioteca no conserva exactamente el catálogo visible: ${JSON.stringify({ missingLibraryRoutes, duplicateLibraryRoutes, unknownLibraryRoutes })}`)
  }

  const anchorIds = ACADEMY_LEARNER_PATH.chapters.flatMap(({ anchorLessonIds }) => anchorLessonIds)
  const supportIds = ACADEMY_LEARNER_PATH.chapters.flatMap(({ supportingLessonIds }) => supportingLessonIds)
  const requiredActivityIds = ACADEMY_LEARNER_PATH.chapters.flatMap(({ requiredActivityIds }) => requiredActivityIds)
  const plannedRefs = ACADEMY_LEARNER_PATH.chapters.flatMap(({ plannedContentRefs }) => plannedContentRefs)
  const lessonTitle = (id: string) => lessonById.get(id)?.title.es ?? id
  const activityTitle = (id: string) => activityById.get(id)?.title.es ?? id
  const chapterDuration = (activityIds: string[]) => activityIds.reduce((total, id) => total + (activityById.get(id)?.durationMinutes ?? 0), 0)

  const learnerPathMarkdown = md(`# Academy learner path 0.14B

> Manifiesto curado manualmente. No se deriva de los informes generados ni de la posición física de las lecciones.

## Identidad

- Path: ${code(ACADEMY_LEARNER_PATH.pathId)}
- Versión: ${ACADEMY_LEARNER_PATH.version}
- Objetivo: ${ACADEMY_LEARNER_PATH.learnerGoal}
- Auditoría fuente: ${ACADEMY_LEARNER_PATH.sourceAuditPhase}
- Estado de curación: ${ACADEMY_LEARNER_PATH.curationStatus}
- Cobertura: ${ACADEMY_LEARNER_PATH.stages.length} etapas, ${ACADEMY_LEARNER_PATH.chapters.length} capítulos, ${anchorIds.length} anchors, ${supportIds.length} apoyos, ${requiredActivityIds.length} prácticas requeridas y ${ACADEMY_LEARNER_PATH.optionalBranches.length} ramas opcionales.
- Validación: 0 incidencias sobre ${corpus.counts.lessons} lecciones y ${corpus.counts.activities} actividades visibles.

${ACADEMY_LEARNER_PATH.stages.map((stage) => `## Etapa ${stage.order}. ${stage.title}

**Promesa:** ${stage.promise}

**Resultado:** ${stage.outcome}

**Razón:** ${stage.rationale}

**Cobertura:** ${stage.coverageStatus}. **Prerrequisitos:** ${stage.prerequisiteStageIds.length ? stage.prerequisiteStageIds.map(code).join(', ') : 'ninguno'}.

${stage.chapterIds.map((chapterId) => {
  const chapter = ACADEMY_LEARNER_PATH.chapters.find((item) => item.chapterId === chapterId)!
  return `### ${chapter.order}. ${chapter.title}

- ID: ${code(chapter.chapterId)}
- Por qué ahora: ${chapter.whyNow}
- Resultado: ${chapter.outcome}
- Cobertura: ${chapter.coverageStatus}
- Prerrequisitos: ${chapter.prerequisiteChapterIds.length ? chapter.prerequisiteChapterIds.map(code).join(', ') : 'ninguno'}
- Duración verificable de prácticas requeridas: ${chapterDuration(chapter.requiredActivityIds)} min
- Anchors: ${chapter.anchorLessonIds.map((id) => `${code(id)} — ${lessonTitle(id)}`).join('; ')}
- Apoyo: ${chapter.supportingLessonIds.length ? chapter.supportingLessonIds.map((id) => `${code(id)} — ${lessonTitle(id)}`).join('; ') : 'ninguno'}
- Prácticas requeridas: ${chapter.requiredActivityIds.map((id) => `${code(id)} — ${activityTitle(id)}`).join('; ')}
- Ramas opcionales: ${chapter.optionalBranchIds.length ? chapter.optionalBranchIds.map(code).join(', ') : 'ninguna'}
- Contenido planificado: ${chapter.plannedContentRefs.length ? chapter.plannedContentRefs.map(code).join(', ') : 'ninguno'}
- Evidencia física: ${chapter.physicalEvidencePolicy.note}
- Curación: ${chapter.curationMethod}, confianza ${chapter.curationConfidence}. ${chapter.curationReason}

Revisión de anchors:

${chapter.anchorReviews.map((review) => `- ${code(review.lessonId)}: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. ${review.reason}`).join('\n')}`
}).join('\n\n')}`).join('\n\n')}

## Ramas opcionales no bloqueantes

| Rama | Etapa | Rutas | Uso |
|---|---:|---|---|
${ACADEMY_LEARNER_PATH.optionalBranches.map((branch) => `| ${pipe(branch.title)} | ${branch.stageId} | ${branch.routeIds.map(code).join(', ')} | ${pipe(branch.description)} |`).join('\n')}
`)

  const learnerPathJson = json({
    schemaVersion: 1,
    phase: '0.14B',
    generatedBy: 'scripts/academy-learner-path.ts',
    corpusDigest: corpus.digest,
    corpusCounts: corpus.counts,
    pathCounts: {
      stages: ACADEMY_LEARNER_PATH.stages.length,
      chapters: ACADEMY_LEARNER_PATH.chapters.length,
      anchors: anchorIds.length,
      uniqueSupportingLessons: new Set(supportIds).size,
      supportingLessonPlacements: supportIds.length,
      requiredActivities: requiredActivityIds.length,
      optionalBranches: ACADEMY_LEARNER_PATH.optionalBranches.length,
      plannedContentRefs: plannedRefs.length,
    },
    validation: { valid: true, issues: validationIssues },
    path: ACADEMY_LEARNER_PATH,
  })

  const informationArchitecture = md(`# Arquitectura de información 0.14B

## Comparación

| Antes | Después |
|---|---|
| Numerosos destinos competían en la navegación primaria. | Tres destinos primarios: Inicio, Mi ruta y Taller. |
| Las 24 rutas aparecían como entradas equivalentes. | Una ruta principal de ocho etapas; el catálogo completo vive en Biblioteca. |
| 216 módulos unitarios añadían una pantalla intermedia. | La lista de ruta abre directamente la lección; el deep link de módulo conserva un puente compatible. |
| El progreso global mezclaba exposición, práctica y demostración. | Progreso core por anchors y prácticas requeridas; evidencia P y exploración opcional se muestran aparte. |
| No existía una única recomendación dominante. | Inicio aplica recuperación > retención > práctica > lección > capítulo > opcional. |

## Navegación primaria

1. Inicio
2. Mi ruta
3. Taller

Biblioteca es una entrada secundaria y conserva todas las superficies:

${ACADEMY_LIBRARY_DESTINATION_GROUPS.map((group) => `- **${group.title}:** ${group.destinations.map(({ label }) => label).join(', ')}.`).join('\n')}

En móvil se muestran exactamente cuatro destinos: Inicio, Mi ruta, Taller y Biblioteca.

## Catálogo de rutas conservado

| Grupo | Finalidad | Rutas |
|---|---|---:|
${ACADEMY_LIBRARY_ROUTE_GROUPS.map((group) => `| ${group.title} | ${pipe(group.description)} | ${group.routeIds.length} |`).join('\n')}

Total: ${allLibraryRoutes.length} rutas visibles, sin IDs omitidos ni duplicados. MIYOTA 2035 figura como especialización no bloqueante.

## Compatibilidad

- Las superficies y hashes históricos continúan resolviéndose mediante el enrutador existente.
- Los IDs de ruta, módulo, lección, actividad, sesión y progreso no cambian.
- Los módulos multi-lección conservan su pantalla; los unitarios conservan su URL como puente.
- Los breadcrumbs de lecciones curadas muestran Etapa > Capítulo > Lección.
- ${code('academyCurriculum.ts')} continúa siendo catálogo histórico; no gobierna el denominador de la ruta personal.
`)

  const prerequisiteReport = md(`# Resoluciones de prerrequisitos 0.14B

Los nueve enlaces confirmados por 0.14A.1 se mantienen en los paquetes fuente, pero dejan de bloquear en el evaluador efectivo. La migración de metadatos fuente sigue pendiente.

| Lección | Concepto | Raw | Efectivo | Resolución | Deuda |
|---|---|---|---|---|---|
${ACADEMY_PREREQUISITE_RESOLUTIONS.map((item) => `| ${code(item.lessonId)} | ${code(item.conceptId)} | ${item.rawStatus} | ${item.effectiveStatus} | ${pipe(item.rationale)} | ${item.sourceMigrationPending ? 'pendiente' : 'resuelta'} |`).join('\n')}

Resumen: ${ACADEMY_PREREQUISITE_RESOLUTIONS.length} enlaces, ${new Set(ACADEMY_PREREQUISITE_RESOLUTIONS.map(({ lessonId }) => lessonId)).size} lecciones, 0 conceptos borrados y 0 IDs modificados.
`)

  const stage5Blueprint = md(`# Blueprint editorial de etapa 5 — 0.14B

La etapa 5 conserva ` + '`coverageStatus = partial`' + `. Estos registros no son lecciones de producción y todos declaran ` + '`productionLessonId = null`' + `.

Resumen: ${ACADEMY_STAGE_5_BLUEPRINT.filter(({ status }) => status === 'gap').length} vacíos y ${ACADEMY_STAGE_5_BLUEPRINT.filter(({ status }) => status === 'partial').length} temas parciales.

${ACADEMY_STAGE_5_BLUEPRINT.map((item, index) => `## ${index + 1}. ${item.title}

- Referencia editorial: ${code(item.blueprintRef)}
- Estado: ${item.status}
- Objetivo observable: ${item.observableObjective}
- Fuentes principales: ${item.primarySourceIds.map(code).join(', ')}
- Documentación oficial necesaria: ${item.officialDocumentationNeeded.join('; ')}
- Visual requerido: ${item.requiredVisual}
- Práctica propuesta: ${item.proposedPractice}
- Evidencia: ${item.evidenceModalities.join('+')}
- Ejecución: ${item.executionTier}
- Prerrequisitos: ${item.prerequisiteChapterIds.map(code).join(', ')}
- Aceptación: ${item.acceptanceCriteria.join('; ')}
- Riesgos: ${item.risks.join('; ')}
- Relación con Watch Prototype Lab: ${item.technicalWplRelation}
- Lección de producción: no creada
`).join('\n')}
`)

  const progressCompatibility = md(`# Compatibilidad de progreso 0.14B

## Derivación sin migración

| Señal nueva | Origen existente | Persistencia nueva |
|---|---|---|
| Lección anchor estudiada | ` + '`AcademyLocalState.lessonProgress.completedAt`' + ` o sesión completada de una actividad perteneciente a la lección | Ninguna |
| Práctica requerida satisfecha | ` + '`academyActivitySatisfiesProgression(snapshot, activity)`' + ` | Ninguna |
| Progreso de capítulo | Anchors estudiados + prácticas requeridas según ` + '`completionPolicy`' + ` | Ninguna |
| Progreso de etapa/ruta | Agregación derivada de capítulos | Ninguna |
| Evidencia de banco | Evidencias existentes con modalidad P explícita; revisión humana solo con procedencia de revisor | Ninguna |
| Exploración opcional | Sesiones/actividades existentes fuera del denominador core | Ninguna |

## Garantías

- No se cambia el esquema local, no se reescriben perfiles y no se duplican estados calculables.
- Las ${anchorIds.length} lecciones anchor y ${requiredActivityIds.length} prácticas requeridas forman el único denominador core.
- Los ${new Set(supportIds).size} apoyos únicos, las ${ACADEMY_LEARNER_PATH.optionalBranches.length} ramas opcionales, Atlas, glosario, fuentes e historia adicional no inflan ese denominador.
- Las sesiones existentes se leen sin mutarlas; una sesión interrumpida conserva precedencia de recuperación.
- Una actividad K/V puede permitir progreso conceptual. La competencia física permanece pendiente sin modalidad P documentada.
- R no sustituye a P y una evidencia automática no se presenta como revisión humana.
- No se modifica el significado ni el resultado almacenado de ninguna actividad completada.
`)

  const qaCases = [
    ['Inicio desktop', '1440 px', 'Inicio con posición, siguiente acción y resumen secundario'],
    ['Mi ruta desktop', '1440 px', 'Ocho etapas verticales y un capítulo inicialmente abierto'],
    ['Etapa 2 expandida', '1440 px', 'Seis capítulos sin pared de lecciones'],
    ['Etapa 4 MIYOTA 8215', '1024 px', 'Cinco capítulos y quince unidades agrupadas'],
    ['Etapa 5 parcial', '1024 px', 'Cobertura parcial y vacíos planificados, sin lecciones ficticias'],
    ['Biblioteca desktop', '1440 px', 'Grupos, búsqueda y 24 rutas conservadas'],
    ['Inicio móvil', '480 px', 'Barra de cuatro destinos sin desbordamiento'],
    ['Mi ruta móvil', '480 px', 'Tarjetas apiladas y controles táctiles'],
    ['Biblioteca móvil', '480 px', 'Drawer cerrable por Escape y retorno de foco'],
    ['Módulo unitario', '760 px', 'Ruta abre lección directa; deep link conserva puente'],
    ['Estado bloqueado', '1024 px', 'Razón textual y enlace directo al capítulo requerido'],
    ['Zoom equivalente', '720 px (1440 px al 200 %)', 'Reflow equivalente a zoom 200 %, sin pérdida funcional'],
  ] as const
  const uxQa = md(`# QA UX 0.14B

## Alcance

Se reutiliza el harness de QA local y no se añaden capturas binarias al repositorio. La revisión combina contratos automatizados, inspección por teclado y comprobación visual responsive.

| Caso | Viewport | Criterio | Estado |
|---|---|---|---|
${qaCases.map(([name, viewport, criterion]) => `| ${name} | ${viewport} | ${criterion} | verificado |`).join('\n')}

## Accesibilidad comprobada

- Navegación primaria con ` + '`aria-current`' + ` y Biblioteca con ` + '`aria-expanded`' + ` / ` + '`aria-haspopup="dialog"`' + `.
- Drawer con rol de diálogo, nombre accesible, Escape, trampa de foco y devolución al disparador.
- Estados bloqueados incluyen explicación textual; el color no es la única señal.
- Objetivos táctiles de navegación móvil de al menos 46 px y layout de cuatro columnas.
- Estilos de ` + '`prefers-reduced-motion`' + ` y reflow en 760/480 px.

## Limitaciones

- No se capturó evidencia física real ni se validó hardware de banco.
- La etapa 5 se inspecciona como contenido parcial; sus ocho vacíos siguen siendo blueprints.
- El navegador de QA no expuso control de zoom; se verificó el reflow equivalente de 1440 px al 200 % mediante viewport de 720 px.
- No se guardaron screenshots porque el repositorio no establece una convención para binarios de QA.
`)

  return new Map<OutputFile, string>([
    ['ACADEMY-LEARNER-PATH-0.14B.md', learnerPathMarkdown],
    ['ACADEMY-LEARNER-PATH-0.14B.json', learnerPathJson],
    ['ACADEMY-INFORMATION-ARCHITECTURE-0.14B.md', informationArchitecture],
    ['ACADEMY-PREREQUISITE-RESOLUTIONS-0.14B.md', prerequisiteReport],
    ['ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B.md', stage5Blueprint],
    ['ACADEMY-PROGRESS-COMPATIBILITY-0.14B.md', progressCompatibility],
    ['ACADEMY-UX-QA-0.14B.md', uxQa],
  ])
}

async function main() {
  const repositoryRoot = resolve(process.cwd())
  const generatedRoot = join(repositoryRoot, 'docs', 'generated')
  const check = process.argv.includes('--check')
  const outputs = await buildAcademyLearnerPathOutputs(repositoryRoot)
  await mkdir(generatedRoot, { recursive: true })
  for (const fileName of ACADEMY_PATH_OUTPUT_FILES) {
    const target = join(generatedRoot, fileName)
    const generated = outputs.get(fileName)!
    if (check) {
      const existing = await readFile(target, 'utf8').catch(() => undefined)
      if (existing !== generated) throw new Error(`${fileName} no es determinista o necesita regenerarse.`)
    } else {
      await writeFile(target, generated, 'utf8')
    }
  }
  console.log(`${check ? 'Comprobados' : 'Generados'} ${ACADEMY_PATH_OUTPUT_FILES.length} informes 0.14B; manifiesto válido.`)
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entry) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
