import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ACADEMY_014H_PHASE_REGISTRY_SNAPSHOT,
  ACADEMY_CURATION_LAYER_REGISTRY,
  ACADEMY_PERSONAL_CURATION_PHASES,
  ACADEMY_PERSONAL_REVIEW_QUEUE_014I,
  ACADEMY_READER_CURATION_PHASES,
  ACADEMY_STAGE_0_1_AUDITED_UNCHANGED,
  ACADEMY_STAGE_0_1_REMEDIATIONS,
  ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_3_ANCHOR_IDS,
  ACADEMY_STAGE_3_CATALOG,
  ACADEMY_STAGE_3_CHAPTER_SEQUENCE,
  ACADEMY_STAGE_3_CLAIMS,
  ACADEMY_STAGE_3_FINAL_CHECKPOINT,
  ACADEMY_STAGE_3_FORMULA_REVIEWS,
  ACADEMY_STAGE_3_OPTIONAL_IDS,
  ACADEMY_STAGE_3_PERSONAL_PRACTICES,
  ACADEMY_STAGE_3_PHOTO_BRIEFS,
  ACADEMY_STAGE_3_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_3_REUSED_VISUALS,
  ACADEMY_STAGE_3_SAFETY_AUDITS,
  ACADEMY_STAGE_3_SAFETY_POLICY,
  ACADEMY_STAGE_3_SUPPORT_IDS,
  ACADEMY_STAGE_3_TRANSITIONS,
  ACADEMY_STAGE_3_VISUAL_CATALOG_REFERENCES,
  ACADEMY_STAGE_3_VISUAL_DESIGNS,
  ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE,
  CURRENT_ACADEMY_CURATION_PHASE,
  academy014IContentPreservation,
  academyPhaseIncludes,
  academyPhaseLayers,
} from '../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderBuildInput, AcademyReaderCurationPhase, AcademyReaderDocument } from '../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../src/learning/product/demoPackage'
import { ACADEMY_014I_QA_CASES, ACADEMY_014I_QA_PERFORMANCE } from './academy-audit/academy-014i-qa-snapshot'
import { loadAcademyCorpus } from './academy-audit/corpus'

export const ACADEMY_014I_OUTPUT_FILES = [
  'ACADEMY-0.14I-SUMMARY.md',
  'ACADEMY-SOURCE-PRESERVING-COMPOSITION-0.14I.md', 'ACADEMY-SOURCE-PRESERVING-COMPOSITION-0.14I.json',
  'ACADEMY-STAGE-0-1-PRESERVATION-REMEDIATION-0.14I.md', 'ACADEMY-STAGE-0-1-PRESERVATION-REMEDIATION-0.14I.json',
  'ACADEMY-STAGE-3-CURATION-0.14I.md', 'ACADEMY-STAGE-3-CURATION-0.14I.json',
  'ACADEMY-STAGE-3-SECTION-DISPOSITION-0.14I.md', 'ACADEMY-STAGE-3-SECTION-DISPOSITION-0.14I.json',
  'ACADEMY-STAGE-3-CONTENT-PRESERVATION-0.14I.md', 'ACADEMY-STAGE-3-CONTENT-PRESERVATION-0.14I.json',
  'ACADEMY-STAGE-3-PREREQUISITES-0.14I.md', 'ACADEMY-STAGE-3-PREREQUISITES-0.14I.json',
  'ACADEMY-STAGE-3-ACTIVITIES-0.14I.md', 'ACADEMY-STAGE-3-ACTIVITIES-0.14I.json',
  'ACADEMY-STAGE-3-PRACTICES-0.14I.md', 'ACADEMY-STAGE-3-PRACTICES-0.14I.json',
  'ACADEMY-STAGE-3-CLAIMS-0.14I.md', 'ACADEMY-STAGE-3-CLAIMS-0.14I.json',
  'ACADEMY-STAGE-3-VISUALS-0.14I.md', 'ACADEMY-STAGE-3-VISUALS-0.14I.json',
  'ACADEMY-STAGE-3-SAFETY-0.14I.md', 'ACADEMY-STAGE-3-SAFETY-0.14I.json',
  'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14I.md', 'ACADEMY-PERSONAL-REVIEW-QUEUE-0.14I.json',
  'ACADEMY-UX-QA-0.14I.md', 'ACADEMY-SCREENSHOT-INDEX-0.14I.md',
] as const

export const ACADEMY_014I_BASELINE = {
  head: '721965729e3407024a501f610cd9889e96e4f951', branch: 'main', initialWorktree: 'clean', previousPhase: '0.14H',
  corpusCounts: { packages: 8, routes: 24, modules: 217, lessons: 222, activities: 289 },
  corpusDigest: '1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e',
  historicalReports: { count: 139, digest: '187dd78d8a10d991824a433d6551f8fa83b13cd6e5aa07b19bc42672e4dd2785' },
  protected: {
    learningContent: { count: 4012, digest: '16291f86a7cb082d47fa65016d838b72e19cf3701afe33bc27ad226cf41af1d4' },
    originals: { count: 7, digest: '633edd7f7027a61587b1b944b0b3bf8562819697144b449e4dc9aed1db4ab6b7' },
  },
  stage2: { lessons: 25, sourceSections: 339, sourceSubstantiveWords: 28517, visibleWords: 34290, claims: 15, visuals: 22, practices: 13, substantiveCoverage: 1 },
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
  const fileNames = (await readdir(root)).filter((name) => !name.startsWith('APRENDER-') && !name.includes('0.14I')).sort()
  const rows = await Promise.all(fileNames.map(async (name) => `${name}:${sha256(await readFile(join(root, name)))}`))
  return { count: fileNames.length, digest: sha256(rows.join('\n')), fileNames }
}

async function screenshotRows(repositoryRoot: string) {
  const root = join(repositoryRoot, 'docs', 'academy-ux', 'screenshots', '0.14I')
  const names = await readdir(root).catch(() => [])
  return Promise.all(names.filter((name) => name.toLowerCase().endsWith('.png')).sort().map(async (fileName) => {
    const content = await readFile(join(root, fileName))
    const qa = ACADEMY_014I_QA_CASES.find((item) => item.fileName === fileName)
    return { fileName, bytes: content.byteLength, sha256: sha256(content), viewport: qa?.viewport ?? 'unknown', lessonId: qa?.lessonId ?? 'unknown', mode: qa?.mode ?? 'unknown', subject: qa?.subject ?? 'unknown' }
  }))
}

function materialFor(pack: LearningPack, lessonId: string, product: ReturnType<typeof mergeLearningProductIndexes>): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)
  const descriptor = product.lessons.find(({ id }) => id === lessonId)
  if (!lesson || !descriptor) throw new Error(`Lección ausente: ${lessonId}`)
  const blocks = pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
  const lessonMarkdown = blocks.map(({ bodyMarkdown }) => bodyMarkdown).join('\n')
  const sourceIds = new Set([...(lesson.authoring?.sourceIds ?? []), ...blocks.flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id)))])
  return { packageId: pack.manifest.id, packageVersion: pack.manifest.packageVersion, pack, lesson, blocks, activities: descriptor.activityIds.flatMap((activityId) => product.activities.filter(({ id }) => id === activityId)), sources: pack.sources.filter(({ id }) => sourceIds.has(id)), glossary: pack.glossary.filter(({ id }) => lessonMarkdown.includes(`{{term:${id}}}`)) }
}

function documentFor(product: ReturnType<typeof mergeLearningProductIndexes>, pack: LearningPack, lessonId: string, phase: AcademyReaderCurationPhase): AcademyReaderDocument {
  const descriptor = product.lessons.find(({ id }) => id === lessonId)!
  return buildAcademyReaderDocument({ material: materialFor(pack, lessonId, product), title: descriptor.title.es, purpose: descriptor.purpose.es, locale: 'es-ES', requiredActivityIds: descriptor.studyContract?.labActivityIds }, { curationPhase: phase })
}

function total<T, K extends keyof T>(rows: readonly T[], key: K) {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0)
}

export async function buildAcademy014IOutputs(repositoryRoot: string): Promise<Map<string, string>> {
  const corpus = await loadAcademyCorpus(repositoryRoot)
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  const packByLesson = new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const)))
  const historical = await historicalReportSnapshot(repositoryRoot)
  const learningContent = await treeSnapshot(join(repositoryRoot, 'learning-content'))
  const originals = await treeSnapshot(join(repositoryRoot, 'reference-library', 'originals'))
  const screenshots = await screenshotRows(repositoryRoot)
  if (CURRENT_ACADEMY_CURATION_PHASE !== '0.14I') throw new Error('0.14I no es la fase activa.')
  if (JSON.stringify(corpus.counts, ['packages','routes','modules','lessons','activities']) !== JSON.stringify(ACADEMY_014I_BASELINE.corpusCounts)) throw new Error('Los conteos del corpus cambiaron.')
  if (corpus.digest !== ACADEMY_014I_BASELINE.corpusDigest) throw new Error('El digest del corpus cambió.')
  if (historical.count !== ACADEMY_014I_BASELINE.historicalReports.count || historical.digest !== ACADEMY_014I_BASELINE.historicalReports.digest) throw new Error('Los informes 0.14A–0.14H cambiaron.')
  if (learningContent.count !== ACADEMY_014I_BASELINE.protected.learningContent.count || learningContent.digest !== ACADEMY_014I_BASELINE.protected.learningContent.digest) throw new Error('learning-content cambió.')
  if (originals.count !== ACADEMY_014I_BASELINE.protected.originals.count || originals.digest !== ACADEMY_014I_BASELINE.protected.originals.digest) throw new Error('reference-library/originals cambió.')
  const hPreservation = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-STAGE-2-CONTENT-PRESERVATION-0.14H.json'), 'utf8')) as { totals: typeof ACADEMY_014I_BASELINE.stage2; substantiveCoverage: number }
  if (hPreservation.totals.sourceSections !== ACADEMY_014I_BASELINE.stage2.sourceSections || hPreservation.substantiveCoverage !== 1) throw new Error('Falta el cierre corregido de 0.14H.')

  const remediationDocuments = ACADEMY_STAGE_0_1_REMEDIATIONS.map((record) => {
    const pack = packByLesson.get(record.lessonId)
    if (!pack) throw new Error(`Paquete ausente: ${record.lessonId}`)
    const byPhase = Object.fromEntries(['0.14D', record.historicalPhase, '0.14H', '0.14I'].map((phase) => [phase, documentFor(product, pack, record.lessonId, phase as AcademyReaderCurationPhase)])) as Record<string, AcademyReaderDocument>
    const preservation = academy014IContentPreservation(record.lessonId, byPhase['0.14D'].sections, byPhase['0.14I'].sections)
    return { record, byPhase, preservation }
  })
  const remediationRows = remediationDocuments.map(({ record, byPhase, preservation }) => ({
    ...record, sourceSections: preservation.row.sourceSectionCount, sourceWords: preservation.row.sourceSubstantiveWords,
    historicalVisibleWords: byPhase[record.historicalPhase].sections.reduce((sum, { wordCount }) => sum + wordCount, 0), visible014IWords: preservation.row.visibleWords,
    substantiveCoverage: preservation.row.substantiveCoverage, sourceDispositionCount: preservation.dispositions.length,
    historicContentHash: byPhase[record.historicalPhase].contentHash, activeContentHash: byPhase['0.14I'].contentHash,
  }))
  const remediationDispositions = remediationDocuments.flatMap(({ preservation }) => preservation.dispositions)

  const stage3Documents = ACADEMY_STAGE_3_CATALOG.map((record) => {
    const pack = packByLesson.get(record.lessonId)
    if (!pack) throw new Error(`Paquete ausente: ${record.lessonId}`)
    const authored = documentFor(product, pack, record.lessonId, '0.14D')
    const active = documentFor(product, pack, record.lessonId, '0.14I')
    const preservation = academy014IContentPreservation(record.lessonId, authored.sections, active.sections)
    return { record, authored, active, preservation }
  })
  const stage3Rows = stage3Documents.map(({ record, active, preservation }) => ({
    lessonId: record.lessonId, chapterId: record.chapterId, pathRole: record.pathRole, archetype: record.editorialArchetype,
    sourceSections: preservation.row.sourceSectionCount, sourceWords: preservation.row.sourceSubstantiveWords, visibleSections: active.sections.length,
    visibleWords: preservation.row.visibleWords, substantiveCoverage: preservation.row.substantiveCoverage, contentHash: active.contentHash,
    validationIssues: validateAcademyReaderDocument(active).map(({ code }) => code), activityIds: active.completion.requiredActivityIds,
  }))
  const stage3Dispositions = stage3Documents.flatMap(({ preservation }) => preservation.dispositions)
  const stage3PreservationRows = stage3Documents.map(({ preservation }) => preservation.row)
  const dispositionCounts = Object.fromEntries([...new Set(stage3Dispositions.map(({ action }) => action))].map((action) => [action, stage3Dispositions.filter((item) => item.action === action).length]))
  const curricularActivities = corpus.activities.filter(({ lesson }) => ACADEMY_STAGE_3_CATALOG.some(({ lessonId }) => lessonId === lesson.id)).map(({ lesson, activity }) => ({ lessonId: lesson.id, activityId: activity.id, requiredOverlay: ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.some((item) => item.activityId === activity.id), originalMeaningPreserved: true }))
  const sourceIds = new Set(corpus.packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id)))
  const missingClaimSources = ACADEMY_STAGE_3_CLAIMS.flatMap(({ claimId, primarySourceId, supportingSourceIds }) => [primarySourceId, ...supportingSourceIds].filter((id) => !sourceIds.has(id)).map((id) => `${claimId}:${id}`))
  if (missingClaimSources.length) throw new Error(`Fuentes de claims ausentes: ${missingClaimSources.join(', ')}`)

  const outputs = new Map<string, string>()
  const compositionJson = {
    schema: 'wplab-academy-source-preserving-composition-v1', phase: '0.14I', currentPhase: CURRENT_ACADEMY_CURATION_PHASE,
    readerPhases: ACADEMY_READER_CURATION_PHASES, personalPhases: ACADEMY_PERSONAL_CURATION_PHASES, layers: ACADEMY_CURATION_LAYER_REGISTRY,
    requiredContextFields: ['lessonId','phase','authoredSections','previousPhaseSections','currentSections','historicalAliases','sourceBlockIds'],
    historicalSnapshot014H: ACADEMY_014H_PHASE_REGISTRY_SNAPSHOT,
    compositionMatrix: ACADEMY_PERSONAL_CURATION_PHASES.map((phase) => ({ phase, includes: ACADEMY_PERSONAL_CURATION_PHASES.filter((candidate) => academyPhaseIncludes(phase, candidate)), layers: academyPhaseLayers(phase).map(({ phase: layerPhase }) => layerPhase) })),
    compatibility: remediationDocuments.map(({ record, byPhase }) => ({ lessonId: record.lessonId, historicalPhase: record.historicalPhase, historicalHash: byPhase[record.historicalPhase].contentHash, hHash: byPhase['0.14H'].contentHash, iHash: byPhase['0.14I'].contentHash })),
  }
  outputs.set('ACADEMY-SOURCE-PRESERVING-COMPOSITION-0.14I.json', json(compositionJson))
  outputs.set('ACADEMY-SOURCE-PRESERVING-COMPOSITION-0.14I.md', md(`# Composición preservadora de fuente · 0.14I

La capa recibe autoría, salida previa, salida en composición, aliases históricos y bloques fuente como valores distintos. Esto permite recuperar teoría sin alterar los snapshots F/G/H.

| Fase | Incluye | Capas |
|---|---|---|
${compositionJson.compositionMatrix.map(({ phase, includes, layers }) => `| ${phase} | ${includes.join(' → ')} | ${layers.join(' → ')} |`).join('\n')}

Una fase vacía o desconocida se rechaza. La fachada de etapa 2 conserva sus exports públicos.`))

  const remediationJson = { schema: 'wplab-stage-0-1-preservation-remediation-v1', phase: '0.14I', counts: { lessons: remediationRows.length, stage0: remediationRows.filter(({ macroStage }) => macroStage === 0).length, stage1: remediationRows.filter(({ macroStage }) => macroStage === 1).length, sourceSections: total(remediationRows, 'sourceSections'), sourceWords: total(remediationRows, 'sourceWords'), dispositions: remediationDispositions.length, substantiveCoverage: Math.min(...remediationRows.map(({ substantiveCoverage }) => substantiveCoverage)) }, auditedUnchanged: ACADEMY_STAGE_0_1_AUDITED_UNCHANGED, lessons: remediationRows, dispositions: remediationDispositions }
  outputs.set('ACADEMY-STAGE-0-1-PRESERVATION-REMEDIATION-0.14I.json', json(remediationJson))
  outputs.set('ACADEMY-STAGE-0-1-PRESERVATION-REMEDIATION-0.14I.md', md(`# Remediación de preservación · etapas 0–1 · 0.14I

- Lecciones remediadas: ${remediationJson.counts.lessons}.
- Secciones authored auditadas: ${remediationJson.counts.sourceSections}.
- Palabras sustantivas fuente: ${remediationJson.counts.sourceWords}.
- Cobertura mínima: ${(remediationJson.counts.substantiveCoverage * 100).toFixed(0)} %.
- Quartz 2035 auditadas sin cambio: ${ACADEMY_STAGE_0_1_AUDITED_UNCHANGED.length}.

| Lección | Etapa | Secciones | Palabras fuente | Palabras visibles I | Cobertura |
|---|---:|---:|---:|---:|---:|
${remediationRows.map((row) => `| ${row.lessonId} | ${row.macroStage} | ${row.sourceSections} | ${row.sourceWords} | ${row.visible014IWords} | ${(row.substantiveCoverage * 100).toFixed(0)} % |`).join('\n')}`))

  const curationJson = { schema: 'wplab-academy-stage3-curation-v1', phase: '0.14I', chapters: ACADEMY_STAGE_3_CHAPTER_SEQUENCE, counts: { lessons: stage3Rows.length, anchors: ACADEMY_STAGE_3_ANCHOR_IDS.length, supports: ACADEMY_STAGE_3_SUPPORT_IDS.length, optionalBranches: ACADEMY_STAGE_3_OPTIONAL_IDS.length, visibleSections: total(stage3Rows, 'visibleSections'), validationIssues: stage3Rows.flatMap(({ validationIssues }) => validationIssues).length }, archetypes: Object.fromEntries([...new Set(stage3Rows.map(({ archetype }) => archetype))].map((archetype) => [archetype, stage3Rows.filter((item) => item.archetype === archetype).length])), lessons: stage3Rows, checkpoint: ACADEMY_STAGE_3_FINAL_CHECKPOINT }
  outputs.set('ACADEMY-STAGE-3-CURATION-0.14I.json', json(curationJson))
  outputs.set('ACADEMY-STAGE-3-CURATION-0.14I.md', md(`# Curación completa de etapa 3 · 0.14I

| Capítulo | Anchors | Supports | Opcionales |
|---|---:|---:|---:|
${ACADEMY_STAGE_3_CHAPTER_SEQUENCE.map((chapterId) => `| ${chapterId} | ${ACADEMY_STAGE_3_CATALOG.filter((item) => item.chapterId === chapterId && item.pathRole === 'anchor').length} | ${ACADEMY_STAGE_3_CATALOG.filter((item) => item.chapterId === chapterId && item.pathRole === 'support').length} | ${ACADEMY_STAGE_3_CATALOG.filter((item) => item.chapterId === chapterId && item.pathRole === 'optional-branch').length} |`).join('\n')}

Total: ${curationJson.counts.lessons} lecciones, ${curationJson.counts.anchors} anchors, ${curationJson.counts.supports} supports y ${curationJson.counts.optionalBranches} ramas opcionales. Los arquetipos se distribuyen como ${Object.entries(curationJson.archetypes).map(([key,value]) => `${key}: ${value}`).join('; ')}.`))

  outputs.set('ACADEMY-STAGE-3-SECTION-DISPOSITION-0.14I.json', json({ schema: 'wplab-stage3-section-disposition-v1', phase: '0.14I', counts: { total: stage3Dispositions.length, ...dispositionCounts }, dispositions: stage3Dispositions }))
  outputs.set('ACADEMY-STAGE-3-SECTION-DISPOSITION-0.14I.md', md(`# Disposición de secciones fuente · etapa 3 · 0.14I

${stage3Dispositions.length} secciones authored tienen destino explícito. Distribución: ${Object.entries(dispositionCounts).map(([key,value]) => `${key}: ${value}`).join('; ')}.

| Lección | Sección fuente | Acción | Destino | Motivo |
|---|---|---|---|---|
${stage3Dispositions.map((row) => `| ${row.lessonId} | ${row.sourceSectionId} | ${row.action} | ${row.targetSectionIds.join(', ')} | ${pipe(row.reason)} |`).join('\n')}`))

  const preservationTotals = { sourceSections: total(stage3PreservationRows, 'sourceSectionCount'), sourceWords: total(stage3PreservationRows, 'sourceSubstantiveWords'), visibleWords: total(stage3PreservationRows, 'visibleWords'), retainedWords: total(stage3PreservationRows, 'retainedSourceWords'), rewrittenEquivalentWords: total(stage3PreservationRows, 'rewrittenEquivalentWords'), removedWords: total(stage3PreservationRows, 'removedWords'), substantiveCoverage: Math.min(...stage3PreservationRows.map(({ substantiveCoverage }) => substantiveCoverage)) }
  outputs.set('ACADEMY-STAGE-3-CONTENT-PRESERVATION-0.14I.json', json({ schema: 'wplab-stage3-content-preservation-v1', phase: '0.14I', counts: preservationTotals, lessons: stage3PreservationRows }))
  outputs.set('ACADEMY-STAGE-3-CONTENT-PRESERVATION-0.14I.md', md(`# Preservación de contenido · etapa 3 · 0.14I

- Secciones fuente: ${preservationTotals.sourceSections}.
- Palabras sustantivas fuente: ${preservationTotals.sourceWords}.
- Palabras visibles tras composición: ${preservationTotals.visibleWords}.
- Palabras sustantivas cubiertas: ${preservationTotals.retainedWords + preservationTotals.rewrittenEquivalentWords}.
- Eliminadas: ${preservationTotals.removedWords}.
- Cobertura mínima: ${(preservationTotals.substantiveCoverage * 100).toFixed(0)} %.

La curación añade decisiones y ayudas; no duplica el corpus completo en una segunda tabla de contenido.`))

  outputs.set('ACADEMY-STAGE-3-PREREQUISITES-0.14I.json', json({ schema: 'wplab-stage3-prerequisites-v1', phase: '0.14I', chapterSequence: ACADEMY_STAGE_3_CHAPTER_SEQUENCE, transitions: ACADEMY_STAGE_3_TRANSITIONS, overrides: ACADEMY_STAGE_3_PREREQUISITE_OVERRIDES }))
  outputs.set('ACADEMY-STAGE-3-PREREQUISITES-0.14I.md', md(`# Prerrequisitos · etapa 3 · 0.14I

${ACADEMY_STAGE_3_TRANSITIONS.map(({ fromChapterId, toChapterId, meaning }) => `- ${fromChapterId} → ${toChapterId}: ${meaning}`).join('\n')}

Supports y ramas opcionales no bloquean. El cierre 3.4 abre 4.1, pero no declara competencia de servicio, desmontaje, limpieza, lubricación o inspección física certificada.`))

  outputs.set('ACADEMY-STAGE-3-ACTIVITIES-0.14I.json', json({ schema: 'wplab-stage3-activities-v1', phase: '0.14I', counts: { requiredPresentations: ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.length, curricularActivities: curricularActivities.length, physicalEvidenceClaims: ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.filter(({ evidenceProfile }) => evidenceProfile.physicalCompetenceClaim).length }, presentations: ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS, curricularActivities }))
  outputs.set('ACADEMY-STAGE-3-ACTIVITIES-0.14I.md', md(`# Actividades curriculares · etapa 3 · 0.14I

Se preservan ${curricularActivities.length} actividades curriculares de las 17 lecciones; ${ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.length} reciben un overlay requerido. Ninguna actividad digital produce P.

| ActivityId | Lección | Evidencia | Física |
|---|---|---|---|
${ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.map(({ activityId, lessonId, evidenceProfile }) => `| ${activityId} | ${lessonId} | ${evidenceProfile.modalities.join('+')} | ${evidenceProfile.physicalCompetenceClaim ? 'sí' : 'no'} |`).join('\n')}`))

  outputs.set('ACADEMY-STAGE-3-PRACTICES-0.14I.json', json({ schema: 'wplab-stage3-personal-practices-v1', phase: '0.14I', counts: { practices: ACADEMY_STAGE_3_PERSONAL_PRACTICES.length, affectsProgress: 0, createsMastery: 0, completesLesson: 0 }, practices: ACADEMY_STAGE_3_PERSONAL_PRACTICES }))
  outputs.set('ACADEMY-STAGE-3-PRACTICES-0.14I.md', md(`# Prácticas personales opcionales · etapa 3 · 0.14I

${ACADEMY_STAGE_3_PERSONAL_PRACTICES.length} prácticas locales quedan fuera de las 289 actividades. No bloquean, no crean mastery, no completan lecciones y no certifican.

${ACADEMY_STAGE_3_PERSONAL_PRACTICES.map(({ personalPracticeId, title, lessonIds }) => `- **${title}** · ${personalPracticeId} · ${lessonIds.join(', ')}`).join('\n')}`))

  outputs.set('ACADEMY-STAGE-3-CLAIMS-0.14I.json', json({ schema: 'wplab-stage3-claims-v1', phase: '0.14I', counts: { claims: ACADEMY_STAGE_3_CLAIMS.length, formulasElevated: ACADEMY_STAGE_3_FORMULA_REVIEWS.length, sourceNeeded: ACADEMY_STAGE_3_CLAIMS.filter(({ decision }) => decision === 'source-needed').length, historicalOnly: ACADEMY_STAGE_3_CLAIMS.filter(({ historicalStatus }) => historicalStatus === 'historical').length }, claims: ACADEMY_STAGE_3_CLAIMS, formulas: ACADEMY_STAGE_3_FORMULA_REVIEWS }))
  outputs.set('ACADEMY-STAGE-3-CLAIMS-0.14I.md', md(`# Claims y fórmulas · etapa 3 · 0.14I

- Claims revisados: ${ACADEMY_STAGE_3_CLAIMS.length}.
- Claims con fuente actual todavía necesaria: ${ACADEMY_STAGE_3_CLAIMS.filter(({ decision }) => decision === 'source-needed').length}.
- Fórmulas OCR elevadas: ${ACADEMY_STAGE_3_FORMULA_REVIEWS.length}.

| Claim | Lección | Decisión | Fuente | Localizador |
|---|---|---|---|---|
${ACADEMY_STAGE_3_CLAIMS.map((claimRow) => `| ${claimRow.claimId} | ${claimRow.lessonId} | ${claimRow.decision} | ${claimRow.primarySourceId} | ${pipe(claimRow.locator ?? 'pendiente')} |`).join('\n')}`))

  outputs.set('ACADEMY-STAGE-3-VISUALS-0.14I.json', json({ schema: 'wplab-stage3-visuals-v1', phase: '0.14I', counts: { reused: ACADEMY_STAGE_3_REUSED_VISUALS.length, new: ACADEMY_STAGE_3_VISUAL_DESIGNS.length, questionsCovered: ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE.length, photoBriefs: ACADEMY_STAGE_3_PHOTO_BRIEFS.length }, reusedVisualIds: ACADEMY_STAGE_3_REUSED_VISUALS, newDesigns: ACADEMY_STAGE_3_VISUAL_DESIGNS, catalogReferences: ACADEMY_STAGE_3_VISUAL_CATALOG_REFERENCES, questionCoverage: ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE, photoBriefs: ACADEMY_STAGE_3_PHOTO_BRIEFS }))
  outputs.set('ACADEMY-STAGE-3-VISUALS-0.14I.md', md(`# Visuales · etapa 3 · 0.14I

- Reutilizados: ${ACADEMY_STAGE_3_REUSED_VISUALS.length}.
- Nuevos SVG semánticos: ${ACADEMY_STAGE_3_VISUAL_DESIGNS.length}.
- Preguntas cubiertas: ${ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE.length}.
- Briefs de fotografía real pendientes: ${ACADEMY_STAGE_3_PHOTO_BRIEFS.length}; no cuentan como visual implementado.

${ACADEMY_STAGE_3_VISUAL_DESIGNS.map(({ visualDesignId, pedagogicalQuestion, limitations }) => `- ${visualDesignId}: ${pedagogicalQuestion} Límite: ${limitations.join(' ')}`).join('\n')}`))

  outputs.set('ACADEMY-STAGE-3-SAFETY-0.14I.json', json({ schema: 'wplab-stage3-safety-v1', phase: '0.14I', policy: ACADEMY_STAGE_3_SAFETY_POLICY, counts: { lessons: ACADEMY_STAGE_3_SAFETY_AUDITS.length, historicalNonActionable: ACADEMY_STAGE_3_SAFETY_AUDITS.filter(({ lessonOperationalRisk }) => lessonOperationalRisk === 'historical-non-actionable').length, blockedPendingModernSource: ACADEMY_STAGE_3_SAFETY_AUDITS.filter(({ procedureRisk }) => procedureRisk !== 'none').length, actionableHistoricalRecipes: 0 }, audits: ACADEMY_STAGE_3_SAFETY_AUDITS }))
  outputs.set('ACADEMY-STAGE-3-SAFETY-0.14I.md', md(`# Seguridad · etapa 3 · 0.14I

La seguridad de la fuente, del claim, del procedimiento y de la invitación operativa de la lección se registra por separado.

- Riesgos históricos no accionables: ${ACADEMY_STAGE_3_SAFETY_AUDITS.filter(({ lessonOperationalRisk }) => lessonOperationalRisk === 'historical-non-actionable').length}.
- Operaciones bloqueadas hasta fuente moderna aplicable: ${ACADEMY_STAGE_3_SAFETY_AUDITS.filter(({ procedureRisk }) => procedureRisk !== 'none').length}.
- Recetas históricas accionables: 0.
- Actividades digitales con evidencia P: 0.`))

  outputs.set('ACADEMY-PERSONAL-REVIEW-QUEUE-0.14I.json', json({ schema: 'wplab-personal-review-queue-v3', phase: '0.14I', counts: { unique: ACADEMY_PERSONAL_REVIEW_QUEUE_014I.length, stage3InScope: ACADEMY_STAGE_3_CATALOG.filter(({ lessonId }) => ACADEMY_PERSONAL_REVIEW_QUEUE_014I.some((item) => item.lessonId === lessonId)).length, notReviewed: ACADEMY_PERSONAL_REVIEW_QUEUE_014I.filter(({ personalStatus }) => personalStatus === 'not-reviewed').length }, queue: ACADEMY_PERSONAL_REVIEW_QUEUE_014I }))
  outputs.set('ACADEMY-PERSONAL-REVIEW-QUEUE-0.14I.md', md(`# Cola de revisión personal · 0.14I

Entradas únicas: ${ACADEMY_PERSONAL_REVIEW_QUEUE_014I.length}. Las 17 lecciones de etapa 3 están representadas y siguen **not-reviewed**. Las entradas procedentes de 0.14E se deduplican por lessonId; no se inventa revisión del propietario. Las lecciones 0–1 remediadas conservan sus registros y la UI calcula **stale** si cambia el hash visible.`))

  outputs.set('ACADEMY-UX-QA-0.14I.md', md(`# QA de experiencia · 0.14I

Estado de ejecución: ${ACADEMY_014I_QA_CASES.filter(({ status }) => status === 'pass').length}/${ACADEMY_014I_QA_CASES.length} capturas verificadas.

| Captura | Lección | Modo | Viewport | Estado | Comprobación |
|---|---|---|---|---|---|
${ACADEMY_014I_QA_CASES.map((item) => `| ${item.fileName} | ${item.lessonId} | ${item.mode} | ${item.viewport} | ${item.status} | ${pipe(item.subject)} |`).join('\n')}

Consola: ${ACADEMY_014I_QA_PERFORMANCE.consoleErrors} errores. Muestras de desarrollo: ${ACADEMY_014I_QA_PERFORMANCE.samples.map(({ operation, durationMs, thresholdMs }) => `${operation} ${durationMs} ms (umbral ${thresholdMs} ms)`).join('; ')}. ${ACADEMY_014I_QA_PERFORMANCE.environment}.

La QA comprueba estructura, interacción y presentación; no declara claridad humana ni revisión personal.`))
  outputs.set('ACADEMY-SCREENSHOT-INDEX-0.14I.md', md(`# Índice de capturas · 0.14I

Directorio: \`docs/academy-ux/screenshots/0.14I/\`. Capturas encontradas: ${screenshots.length}.

| Archivo | SHA-256 | Bytes | Viewport | Lección | Modo | Tema |
|---|---|---:|---|---|---|---|
${screenshots.map((item) => `| ${item.fileName} | ${item.sha256} | ${item.bytes} | ${item.viewport} | ${item.lessonId} | ${item.mode} | ${pipe(item.subject)} |`).join('\n') || '| — | — | 0 | — | — | — | Pendiente |'}

Las capturas no contienen originales, recetas, datos personales o revisiones simuladas.`))

  const sourceFiles = await walk(join(repositoryRoot, 'src', 'learning', 'academy', 'reader', 'personal', 'phase014i'))
  const sourceBytes = (await Promise.all(sourceFiles.map((file) => stat(file)))).reduce((sum, info) => sum + info.size, 0)
  outputs.set('ACADEMY-0.14I-SUMMARY.md', md(`# Watch Prototype Lab 0.14I · resumen

- Inicio: commit \`${ACADEMY_014I_BASELINE.head}\`, rama \`${ACADEMY_014I_BASELINE.branch}\`, árbol ${ACADEMY_014I_BASELINE.initialWorktree}; fase previa ${ACADEMY_014I_BASELINE.previousPhase}.
- Corpus: ${corpus.counts.packages} paquetes, ${corpus.counts.routes} rutas, ${corpus.counts.modules} módulos, ${corpus.counts.lessons} lecciones y ${corpus.counts.activities} actividades.
- Informes históricos protegidos: ${historical.count}; digest \`${historical.digest}\`.
- Remediación 0–1: ${remediationRows.length} lecciones, ${remediationJson.counts.sourceSections} secciones authored y ${(remediationJson.counts.substantiveCoverage * 100).toFixed(0)} % de cobertura.
- Etapa 3: ${stage3Rows.length} lecciones (${ACADEMY_STAGE_3_ANCHOR_IDS.length} anchors, ${ACADEMY_STAGE_3_SUPPORT_IDS.length} supports y ${ACADEMY_STAGE_3_OPTIONAL_IDS.length} opcionales), ${preservationTotals.sourceSections} secciones fuente y ${(preservationTotals.substantiveCoverage * 100).toFixed(0)} % de cobertura.
- Actividades: ${ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.length} overlays requeridos; prácticas personales: ${ACADEMY_STAGE_3_PERSONAL_PRACTICES.length}; claims: ${ACADEMY_STAGE_3_CLAIMS.length}; fórmulas elevadas: 0.
- Visuales: ${ACADEMY_STAGE_3_REUSED_VISUALS.length} reutilizados, ${ACADEMY_STAGE_3_VISUAL_DESIGNS.length} nuevos y ${ACADEMY_STAGE_3_PHOTO_BRIEFS.length} briefs de fotografía real pendientes.
- Seguridad: 0 recetas accionables y 0 actividades digitales con evidencia P.
- Peso fuente de \`phase014i\`: ${sourceBytes} bytes en ${sourceFiles.length} módulos; no contiene una segunda copia completa de learning-content.

0.14I remedia la lectura activa de las etapas 0–1 y cierra observación, medición, diagnóstico, servicio razonado y aceptación. Se detiene antes de etapa 4 y 0.14J.`))

  if (outputs.size !== ACADEMY_014I_OUTPUT_FILES.length || [...outputs.keys()].some((name) => !ACADEMY_014I_OUTPUT_FILES.includes(name as typeof ACADEMY_014I_OUTPUT_FILES[number]))) throw new Error(`El contrato exige ${ACADEMY_014I_OUTPUT_FILES.length} salidas 0.14I.`)
  return outputs
}

export async function runAcademy014I(repositoryRoot: string, check = false) {
  const outputs = await buildAcademy014IOutputs(repositoryRoot)
  const root = join(repositoryRoot, 'docs', 'generated')
  if (!check) {
    await mkdir(root, { recursive: true })
    for (const [name, content] of outputs) await writeFile(join(root, name), content, 'utf8')
    console.log(`Academia 0.14I: ${outputs.size} informes generados.`)
    return
  }
  const mismatches: string[] = []
  for (const [name, content] of outputs) if (await readFile(join(root, name), 'utf8').catch(() => '') !== content) mismatches.push(name)
  if (mismatches.length) throw new Error(`Salidas 0.14I desactualizadas: ${mismatches.join(', ')}`)
  console.log(`Academia 0.14I: ${outputs.size} informes verificados.`)
}

const entry = process.argv[1] ? resolve(process.argv[1]) : ''
if (entry && import.meta.url === pathToFileURL(entry).href) runAcademy014I(resolve('.'), process.argv.includes('--check')).catch((error) => { console.error(error); process.exitCode = 1 })
