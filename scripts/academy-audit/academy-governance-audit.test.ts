import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { LearningPackSchema } from '../../src/learning/content/learningPack'
import { buildAuditArtifacts } from '../academy-governance-audit'
import { allCorpusIds, loadAcademyCorpus } from './corpus'
import { ACADEMY_PACKAGE_NAMES, ORIGINAL_SOURCE_FILES } from './sourceInventory'

const execFileAsync = promisify(execFile)
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

const EXPECTED_ID_DIGESTS: Record<string, [number, string]> = {
  curricula: [8, '1cf9403c3c5ca42abb05ad79970d045f9d0bf096de87c7d334ac1f483d4f551d'],
  routes: [25, 'e9ed12d860786dfaef64b8bee0079c1bed8aedfcf5b9f884b9726d6410df3f18'],
  modules: [220, 'c05db27b05b214c067dc0c970e6e89fc3468baf95e6fc2e46450ebeeb0bcd5ce'],
  concepts: [509, '005baf96f5cb6fd9f33e3c151d8c3c75354bbe3161cb2ffacf4d8a960f546baf'],
  misconceptions: [149, '1c3c8873d90184b7f5ebdd76f5a4e9a5a8e603187912c69531bab01b45eb237e'],
  blocks: [231, '7d37beaaa9399bbfbe7d72ef2bbdb596b5158cad1e940f8eb5b2b0ac47652100'],
  lessons: [225, 'c81fc7e3763df5ac6db1a163efab6c1166ee07f75439365c5065b1ed99a5d660'],
  activities: [292, '1cdedb66181ceec09e242b937ddb5bd27b7b0c0be1ebd44efeac87cd782104aa'],
  scenes: [335, 'a70ad146dd80babcd3ebbdb7dba61431859b70e7ea04908f02dc5984da694ca5'],
  competencies: [241, '44053d96daaabd0c73e80696354d089ed049fb962b8fc7177c137cc06047f389'],
  evidenceTemplates: [294, '2282121a2873663339b58fd636155c648393c5e750d4a2e56d6b486665feb6d9'],
  rubrics: [251, '247d9406073dc5a58dcfffca6b86c7e05ccd8cf72974dbcf98d21cf8307c4e5e'],
  glossary: [577, '92f507f094d505e47a89a33937e6a843552bb677f1af9d3c30ef88e36cbcc26d'],
  sources: [182, '5a6a7dc8809018103dea37e443011ec3c928d4be8ca65431d87dba4094b02d9a'],
  recommendations: [208, '9c8730af117593f453c817e26e13e72b24438dbb8dc432850379f2b016991aed'],
  visualResources: [71, '45db1e0f0960c573073c6db50636277bf49fc29e984976cf093952c4ce73e384'],
}

class MemoryStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

describe('Academy governance audit 0.14A', () => {
  it('preserves every existing content ID in the eight packages', async () => {
    const ids = allCorpusIds(await loadAcademyCorpus(repositoryRoot))
    expect(Object.keys(ids).sort()).toEqual(Object.keys(EXPECTED_ID_DIGESTS).sort())
    for (const [collection, values] of Object.entries(ids)) {
      const digest = createHash('sha256').update(JSON.stringify(values)).digest('hex')
      expect([values.length, digest], collection).toEqual(EXPECTED_ID_DIGESTS[collection])
    }
  })

  it('covers every visible lesson and activity and registers every used sourceId', async () => {
    const corpus = await loadAcademyCorpus(repositoryRoot)
    const matrix = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-SOURCE-LESSON-MATRIX.json'), 'utf8')) as {
      rows: Array<{ lessonId: string; declaredPrimarySource: string | null; secondarySources: string[] }>
    }
    const activityCsv = await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-ACTIVITY-EVIDENCE-MATRIX.csv'), 'utf8')
    const registry = JSON.parse(await readFile(join(repositoryRoot, 'docs', 'generated', 'ACADEMY-SOURCE-REGISTRY.json'), 'utf8')) as {
      records: Array<{ sourceId: string }>
    }
    expect(new Set(matrix.rows.map(({ lessonId }) => lessonId))).toEqual(new Set(corpus.lessons.map(({ lesson }) => lesson.id)))
    expect(activityCsv.trim().split(/\r?\n/)).toHaveLength(corpus.counts.activities + 1)
    corpus.activities.forEach(({ activity }) => expect(activityCsv).toContain(`"${activity.id}"`))
    const registered = new Set(registry.records.map(({ sourceId }) => sourceId))
    const used = new Set([
      ...matrix.rows.flatMap(({ declaredPrimarySource, secondarySources }) => [...(declaredPrimarySource ? [declaredPrimarySource] : []), ...secondarySources]),
      ...corpus.activities.flatMap(({ activity }) => activity.authoring?.sourceIds ?? []),
    ])
    expect([...used].filter((sourceId) => !registered.has(sourceId))).toEqual([])
  })

  it('is deterministic, read-only for originals, and leaves progress/session IDs untouched', async () => {
    const originalPaths = ORIGINAL_SOURCE_FILES.map(({ fileName }) => join(repositoryRoot, 'reference-library', 'originals', fileName))
    const before = await Promise.all(originalPaths.map(async (path) => ({ path, ...(await stat(path)) })))
    const storage = new MemoryStorage()
    storage.setItem('learning-sessions', JSON.stringify({ id: 'session.existing', activityId: 'activity.miyota8215.identify-calibre' }))
    storage.setItem('watchlab.academy.local.v3.profile.existing', JSON.stringify({
      profileId: 'profile.existing',
      lessonProgress: [{
        lessonId: 'lesson.miyota8215.identify',
        currentSegmentId: 'segment.existing',
        completedSegmentIds: ['segment.existing'],
        completedAt: '2026-08-14T10:00:00.000Z',
      }],
    }))
    const persistedBefore = new Map(storage.values)

    const first = await buildAuditArtifacts(repositoryRoot)
    const second = await buildAuditArtifacts(repositoryRoot)
    expect([...first.entries()]).toEqual([...second.entries()])
    for (const [fileName, content] of first) {
      expect(await readFile(join(repositoryRoot, 'docs', 'generated', fileName), 'utf8'), fileName).toBe(content)
    }
    expect(storage.values).toEqual(persistedBefore)
    expect(storage.getItem('watchlab.academy.local.v3.profile.existing')).toContain('lesson.miyota8215.identify')
    expect(storage.getItem('learning-sessions')).toContain('session.existing')
    const after = await Promise.all(originalPaths.map(async (path) => ({ path, ...(await stat(path)) })))
    expect(after.map(({ path, size, mtimeMs }) => ({ path, size, mtimeMs }))).toEqual(before.map(({ path, size, mtimeMs }) => ({ path, size, mtimeMs })))
  }, 30_000)

  it('keeps temporary extraction untracked, originals out of runtime, and all packs loadable', async () => {
    const { stdout } = await execFileAsync('git', ['ls-files'], { cwd: repositoryRoot, maxBuffer: 10 * 1024 * 1024 })
    const tracked = stdout.split(/\r?\n/).filter(Boolean)
    expect(tracked.filter((path) => path.startsWith('.cache/reference-audit/'))).toEqual([])
    expect(tracked.filter((path) => /^(?:public|learning-content)\/.+\.(?:pdf|iso|docx?|tiff?|zip)$/i.test(path))).toEqual([])
    for (const packageName of ACADEMY_PACKAGE_NAMES) {
      const input = JSON.parse(await readFile(join(repositoryRoot, 'learning-content', packageName, 'dist', 'pack.json'), 'utf8')) as unknown
      expect(() => LearningPackSchema.parse(input), packageName).not.toThrow()
    }
  })
})
