import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'
import { LearningPackSchema } from '../../src/learning/content/learningPack'
import { EvidenceProfileSchema, learningArchetypeValues, macroStageValues, trackRoleValues } from '../../src/learning/governance/editorialGovernance'
import { BASELINE_DIGESTS, buildSemanticAuditArtifacts, SEMANTIC_OUTPUT_FILES } from '../academy-semantic-audit'
import { allCorpusIds, loadAcademyCorpus, type AcademyCorpus } from './corpus'
import type { SemanticActivityRow, SemanticLessonRow } from './semanticAnalysis'
import { SEMANTIC_ACTIVITY_GOLDSET, SEMANTIC_LESSON_GOLDSET } from './semanticGoldSet'
import { buildInventorySnapshots, buildSourceAliases, invalidateSnapshotForHash } from './semanticSources'
import { ACADEMY_PACKAGE_NAMES, ORIGINAL_SOURCE_FILES } from './sourceInventory'
import { buildSourceRegistry, type SourceRegistryResult } from './sources'

const execFileAsync = promisify(execFile)
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

interface SemanticMatrixFile {
  rows: SemanticLessonRow[]
  issues: Array<{ detectorId: number; entityId: string; scope: string; rootCauseId: string | null }>
  globalMigrations: Array<{ migrationId: string; affectedEntities: number }>
}

interface ActivityMatrixFile { rows: SemanticActivityRow[] }

let corpus: AcademyCorpus
let registry: SourceRegistryResult
let lessonMatrix: SemanticMatrixFile
let activityMatrix: ActivityMatrixFile

beforeAll(async () => {
  corpus = await loadAcademyCorpus(repositoryRoot)
  registry = await buildSourceRegistry(repositoryRoot, corpus)
  lessonMatrix = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-SOURCE-LESSON-MATRIX-0.14A1.json'), 'utf8')) as SemanticMatrixFile
  activityMatrix = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-ACTIVITY-EVIDENCE-MATRIX-0.14A1.json'), 'utf8')) as ActivityMatrixFile
})

describe('Academy semantic audit 0.14A.1', () => {
  it('preserves every ID, covers all visible records, and leaves all eight packages loadable', async () => {
    const idsBefore = allCorpusIds(corpus)
    const secondLoad = await loadAcademyCorpus(repositoryRoot)
    expect(allCorpusIds(secondLoad)).toEqual(idsBefore)
    expect(new Set(lessonMatrix.rows.map(({ lessonId }) => lessonId))).toEqual(new Set(corpus.lessons.map(({ lesson }) => lesson.id)))
    expect(new Set(activityMatrix.rows.map(({ activityId }) => activityId))).toEqual(new Set(corpus.activities.map(({ activity }) => activity.id)))
    expect(corpus.counts).toMatchObject({ packages: 8, routes: 24, modules: 217, lessons: 222, activities: 289 })
    for (const packageName of ACADEMY_PACKAGE_NAMES) {
      const input = JSON.parse(await readFile(join(repositoryRoot, 'learning-content', packageName, 'dist', 'pack.json'), 'utf8')) as unknown
      expect(() => LearningPackSchema.parse(input), packageName).not.toThrow()
    }
  })

  it('is deterministic, read-only for originals, and does not mutate progress/session data', async () => {
    const originals = ORIGINAL_SOURCE_FILES.map(({ fileName }) => join(repositoryRoot, 'reference-library', 'originals', fileName))
    const before = await Promise.all(originals.map(async (path) => ({ path, ...(await stat(path)) })))
    const localState = new Map<string, string>([
      ['learning-sessions', JSON.stringify({ id: 'session.existing', activityId: 'activity.miyota8215.guided-disassembly' })],
      ['watchlab.academy.local.v3.profile.existing', JSON.stringify({ lessonId: 'lesson.miyota8215.guided-disassembly', completed: true })],
    ])
    const stateBefore = new Map(localState)
    const first = await buildSemanticAuditArtifacts(repositoryRoot)
    const second = await buildSemanticAuditArtifacts(repositoryRoot)
    expect([...first.entries()]).toEqual([...second.entries()])
    expect([...first.keys()]).toEqual([...SEMANTIC_OUTPUT_FILES])
    expect(localState).toEqual(stateBefore)
    const after = await Promise.all(originals.map(async (path) => ({ path, ...(await stat(path)) })))
    expect(after.map(({ path, size, mtimeMs }) => ({ path, size, mtimeMs }))).toEqual(before.map(({ path, size, mtimeMs }) => ({ path, size, mtimeMs })))
  }, 30_000)

  it('preserves every 0.14A baseline report byte-for-byte', async () => {
    for (const [fileName, expected] of Object.entries(BASELINE_DIGESTS)) {
      const actual = createHash('sha256').update(await readFile(join(repositoryRoot, 'docs', 'generated', fileName))).digest('hex')
      expect(actual, fileName).toBe(expected)
    }
  })

  it('covers every macro-stage, track role, and required archetype in the curated gold set', () => {
    expect(SEMANTIC_LESSON_GOLDSET.length).toBeGreaterThanOrEqual(40)
    expect(SEMANTIC_ACTIVITY_GOLDSET.length).toBeGreaterThanOrEqual(30)
    expect(new Set(SEMANTIC_LESSON_GOLDSET.map(({ macroStageExpected }) => macroStageExpected))).toEqual(new Set(macroStageValues))
    expect(new Set(SEMANTIC_LESSON_GOLDSET.map(({ trackRoleExpected }) => trackRoleExpected))).toEqual(new Set(trackRoleValues))
    expect(new Set(SEMANTIC_LESSON_GOLDSET.map(({ archetypeExpected }) => archetypeExpected))).toEqual(new Set(learningArchetypeValues))
  })

  it('locks the mandatory conceptual, historical, calibre, manufacturing, and design fixtures', () => {
    const rows = new Map(lessonMatrix.rows.map((row) => [row.lessonId, row]))
    const mechanical = rows.get('lesson.horology.mechanical-chain')!
    expect([mechanical.recommendedLearningArchetype, mechanical.macroStage, mechanical.executionTier, mechanical.evidenceProfile.modalities, mechanical.evidenceProfile.physicalCompetenceClaim, mechanical.safetyStatus]).toEqual([
      'mechanism-explanation', '1-understand-watch-as-system', 'simulation', ['K', 'V'], false, 'normal',
    ])
    expect(mechanical.requiredVisuals).not.toContain('multi-angle-physical-demonstration')

    for (const id of [
      'lesson.horology.functional-equivalence',
      'lesson.encyclopedia.history-language.medir-el-tiempo',
      'lesson.encyclopedia.history-language.toh-tiempo-escalas',
    ]) {
      const row = rows.get(id)!
      expect(row.recommendedLearningArchetype).not.toBe('psychomotor-skill')
      expect(row.safetyStatus).not.toBe('prohibited-in-academy')
      expect(row.operationalRisk.procedureRiskCount).toBe(0)
    }

    const overview = rows.get('lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple')!
    expect(overview.recommendedLearningArchetype).toBe('system-overview')
    expect(overview.prerequisiteAudit.filter(({ classification }) => classification === 'improper')).toHaveLength(3)

    const bulova = rows.get('lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante')!
    expect(bulova.recommendedLearningArchetype).toBe('psychomotor-skill')
    expect(bulova.evidenceProfile.modalities).toEqual(['K', 'P', 'R'])
    expect(bulova.prerequisiteAudit.filter(({ classification }) => classification === 'improper')).toHaveLength(3)
    expect(bulova.safetyStatus).not.toBe('prohibited-in-academy')

    const hamilton = rows.get('lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b')!
    expect(hamilton.recommendedLearningArchetype).toBe('diagnosis-case')
    expect(hamilton.prerequisiteAudit.filter(({ classification }) => classification === 'improper')).toHaveLength(3)
    expect(hamilton.sourceRoles.identificationDatabaseSourceIds).toContain('source.external.pocket-watch-database')
    expect(hamilton.sourceRoles.derivedPrimarySourceId).toBe('source.official.tm9-1575.hamilton-992b')

    const inspection = rows.get('lesson.encyclopedia.service-tribology.tm-inspeccion-previa')!
    expect([inspection.recommendedLearningArchetype, inspection.safetyStatus]).toEqual(['inspection', 'normal'])

    const external = rows.get('lesson.capstone.design.external-components')!
    expect([external.recommendedLearningArchetype, external.macroStage, external.evidenceProfile.modalities]).toEqual(['design', '5-build-complete-watch', ['K', 'R']])
    expect(external.evidenceProfile.modalities).not.toContain('P')

    expect(rows.get('lesson.advanced.calendars')!.recommendedLearningArchetype).not.toBe('psychomotor-skill')
    expect(rows.get('lesson.advanced.chronograph-control')!.recommendedLearningArchetype).not.toBe('psychomotor-skill')

    const manufacturing = rows.get('lesson.capstone.manufacturing.micromechanics')!
    expect(manufacturing.recommendedLearningArchetype).toBe('manufacturing')
    expect(manufacturing.executionTier).toBe('specialist-workshop')
  })

  it('does not add P to virtual activities and never treats R as a substitute for P', () => {
    const activities = new Map(activityMatrix.rows.map((row) => [row.activityId, row]))
    const disassembly = activities.get('activity.miyota8215.guided-disassembly')!
    expect(disassembly.evidenceProfile.modalities).toEqual(['K', 'V'])
    expect(disassembly.evidenceProfile.physicalExecutionRequired).toBe(false)

    const reviewedOnly = EvidenceProfileSchema.parse({
      modalities: ['K', 'R'], primaryModality: 'R', knowledgeExplanationRequired: true, virtualDemonstrationRequired: false,
      physicalExecutionRequired: false, measuredOrReviewedResultRequired: true, physicalCompetenceClaim: false, reviewerRequired: true,
      measurableAcceptanceCriteria: [], evidenceArtifacts: ['review.pdf'], classificationMethod: 'explicit-metadata', confidence: 'high',
    })
    expect(reviewedOnly.modalities).not.toContain('P')
    expect(() => EvidenceProfileSchema.parse({ ...reviewedOnly, physicalExecutionRequired: true })).toThrow()
  })

  it('finds all three known prerequisite incoherences and later concepts in the same route', () => {
    const rows = new Map(lessonMatrix.rows.map((row) => [row.lessonId, row]))
    const expected = [
      ['lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', 'later-detail-before-overview'],
      ['lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante', 'advanced-complication-before-basic-skill'],
      ['lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b', 'modern-design-framework-before-historical-case'],
    ] as const
    for (const [lessonId, code] of expected) {
      const improper = rows.get(lessonId)!.prerequisiteAudit.filter(({ classification }) => classification === 'improper')
      expect(improper.length).toBeGreaterThan(0)
      expect(improper.every(({ reason }) => reason.startsWith(code))).toBe(true)
    }
    expect(rows.get(expected[0][0])!.prerequisiteAudit.some(({ origin, classification }) => classification === 'improper' && origin.globalOrder !== null)).toBe(true)
  })

  it('preserves source IDs through aliases and invalidates curated snapshots on hash change', () => {
    const aliases = buildSourceAliases(registry.records)
    expect(new Set(aliases.map(({ sourceId }) => sourceId))).toEqual(new Set(registry.records.map(({ sourceId }) => sourceId)))
    expect(aliases.find(({ sourceId }) => sourceId === 'source.external.pocketwatchdatabase')?.canonicalSourceId).toBe('source.external.pocket-watch-database')
    expect(aliases.find(({ sourceId }) => sourceId === 'source.official.miyota.8215')?.canonicalSourceId).toBe('source.miyota.8215.product-page')
    expect(aliases.find(({ sourceId }) => sourceId === 'source.external.ashton-tracy')?.currentLocator).toBe('https://www.precisionhorology.ca/about')
    const snapshot = buildInventorySnapshots(registry)[0]
    expect(snapshot.verificationValid).toBe(true)
    const changed = invalidateSnapshotForHash(snapshot, '0'.repeat(64))
    expect(changed.verificationValid).toBe(false)
    expect(changed.requiresRevalidationOnHashChange).toBe(true)
  })

  it('excludes global migrations from every individual priority root', () => {
    const globalIds = new Set(lessonMatrix.globalMigrations.map(({ migrationId }) => migrationId))
    expect(lessonMatrix.globalMigrations.reduce((sum, migration) => sum + migration.affectedEntities, 0)).toBe(654)
    for (const row of lessonMatrix.rows) {
      expect(row.semanticPriority.rootCauses.filter((id) => globalIds.has(id))).toEqual([])
      expect(row.semanticPriority.globalIssuesExcluded).toEqual(expect.arrayContaining([...globalIds]))
    }
  })

  it('tracks neither temporary extraction nor copied original assets', async () => {
    const { stdout } = await execFileAsync('git', ['ls-files'], { cwd: repositoryRoot, maxBuffer: 10 * 1024 * 1024 })
    const tracked = stdout.split(/\r?\n/).filter(Boolean)
    expect(tracked.filter((path) => path.startsWith('.cache/reference-audit/'))).toEqual([])
    expect(tracked.filter((path) => /^(?:public|learning-content)\/.+\.(?:pdf|iso|docx?|tiff?|zip)$/i.test(path))).toEqual([])
  })
})
