import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ACADEMY_PERSONAL_CURATION_PHASES,
  ACADEMY_READER_CURATION_PHASES,
  ACADEMY_STAGE_0_1_AUDITED_UNCHANGED,
  ACADEMY_STAGE_0_1_REMEDIATIONS,
  CURRENT_ACADEMY_CURATION_PHASE,
  academy014IContentPreservation,
  academyPhaseIncludes,
  academyPhaseLayers,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import type { AcademyReaderCurationPhase } from '../../src/learning/academy/reader/academyReaderModel'
import { academyEditorialReviewStatus, createAcademyEditorialReviewDraft } from '../../src/learning/academy/reader/academyReaderReview'
import { ACADEMY_014I_BASELINE } from '../academy-014i'
import {
  ACADEMY_014I_TEST_ROOT,
  academy014IBuildDocument,
  academy014IDocumentText,
  academy014ITestEnvironment,
  academy014ITestSha256,
  academy014ITreeSnapshot,
  academy014IWalk,
} from './academy-014i-test-helpers'

const generatedRoot = join(ACADEMY_014I_TEST_ROOT, 'docs', 'generated')

async function historicalSnapshot() {
  const names = (await readdir(generatedRoot)).filter((name) => !name.startsWith('APRENDER-') && !/0\.14[I-Z]/i.test(name)).sort()
  const rows = await Promise.all(names.map(async (name) => `${name}:${academy014ITestSha256(await readFile(join(generatedRoot, name)))}`))
  return { count: names.length, digest: academy014ITestSha256(rows.join('\n')) }
}

describe('0.14I · integridad (pruebas 1–10)', () => {
  it('1. cargan los ocho paquetes', async () => expect((await academy014ITestEnvironment()).corpus.counts.packages).toBe(8))
  it('2. permanecen 24 rutas', async () => expect((await academy014ITestEnvironment()).corpus.counts.routes).toBe(24))
  it('3. permanecen 217 módulos', async () => expect((await academy014ITestEnvironment()).corpus.counts.modules).toBe(217))
  it('4. permanecen 222 lecciones', async () => expect((await academy014ITestEnvironment()).corpus.counts.lessons).toBe(222))
  it('5. permanecen 289 actividades', async () => expect((await academy014ITestEnvironment()).corpus.counts.activities).toBe(289))
  it('6. el digest del corpus permanece', async () => expect((await academy014ITestEnvironment()).corpus.digest).toBe(ACADEMY_014I_BASELINE.corpusDigest))
  it('7. learning-content no cambia', async () => expect(await academy014ITreeSnapshot(join(ACADEMY_014I_TEST_ROOT, 'learning-content'))).toEqual(ACADEMY_014I_BASELINE.protected.learningContent), 30_000)
  it('8. reference-library/originals no cambia', async () => expect(await academy014ITreeSnapshot(join(ACADEMY_014I_TEST_ROOT, 'reference-library', 'originals'))).toEqual(ACADEMY_014I_BASELINE.protected.originals), 30_000)
  it('9. los informes 0.14A–0.14H permanecen byte por byte', async () => expect(await historicalSnapshot()).toEqual(ACADEMY_014I_BASELINE.historicalReports))
  it('10. no se copian originales al runtime', async () => {
    const originals = await academy014IWalk(join(ACADEMY_014I_TEST_ROOT, 'reference-library', 'originals'))
    const hashes = new Set(await Promise.all(originals.map(async (file) => academy014ITestSha256(await readFile(file)))))
    const runtime = [...await academy014IWalk(join(ACADEMY_014I_TEST_ROOT, 'src')), ...await academy014IWalk(join(ACADEMY_014I_TEST_ROOT, 'public'))]
    expect((await Promise.all(runtime.map(async (file) => hashes.has(academy014ITestSha256(await readFile(file))) ? file : null))).filter(Boolean)).toEqual([])
  }, 30_000)
})

describe('0.14I · fases y composición (pruebas 11–18)', () => {
  it('11. E–J permanecen registradas y K se añade de forma acumulativa', () => {
    expect(ACADEMY_READER_CURATION_PHASES).toEqual(['0.14D', '0.14E', '0.14F', '0.14G', '0.14H', '0.14I', '0.14J', '0.14K'])
    expect(ACADEMY_PERSONAL_CURATION_PHASES).toEqual(['0.14E', '0.14F', '0.14G', '0.14H', '0.14I', '0.14J', '0.14K'])
  })
  it('12. una fase desconocida se rechaza', () => expect(() => academyPhaseIncludes('0.14I', '0.14Z' as AcademyReaderCurationPhase)).toThrow(/desconocida/))
  it('13. los builds E/F/G/H siguen construyéndose explícitamente', async () => {
    for (const phase of ['0.14E', '0.14F', '0.14G', '0.14H'] as const) expect((await academy014IBuildDocument('lesson.horology.mechanical-chain', phase)).readerSchemaVersion).toBe(phase)
  })
  it('14. I compone E/F/G/H/I', () => expect(academyPhaseLayers('0.14I').map(({ phase }) => phase)).toEqual(['0.14C', '0.14D', '0.14E', '0.14F', '0.14G', '0.14H', '0.14I']))
  it('15. la UI utiliza la fase activa canónica', async () => {
    expect(CURRENT_ACADEMY_CURATION_PHASE).toBe('0.14K')
    expect(await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')).toContain('CURRENT_ACADEMY_CURATION_PHASE')
  })
  it('16. la capa recibe contexto fuente completo', async () => {
    const source = await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/academy/reader/personal/curationLayers.ts'), 'utf8')
    for (const field of ['lessonId', 'phase', 'authoredSections', 'previousPhaseSections', 'currentSections', 'historicalAliases', 'sourceBlockIds']) expect(source).toContain(field)
  })
  it('17. authoredSections sobrevive aunque una fase anterior sustituyera el documento', async () => {
    const authored = await academy014IBuildDocument('lesson.horology.mechanical-chain', '0.14D')
    const current = await academy014IBuildDocument('lesson.horology.mechanical-chain', '0.14I')
    for (const section of authored.sections) expect(current.sections.some(({ sectionId }) => sectionId === section.sectionId)).toBe(true)
  })
  it('18. la infraestructura genérica conserva los exports H', async () => {
    const source = await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/academy/reader/personal/phase014h/contentPreservation.ts'), 'utf8')
    expect(source).toContain("../sourcePreservingComposition")
    expect(source).toContain('academyStage2ContentPreservation')
  })
})

describe('0.14I · remediación 0–1 (pruebas 19–26)', () => {
  it('19. las doce lecciones de riesgo están representadas', () => expect(new Set(ACADEMY_STAGE_0_1_REMEDIATIONS.map(({ lessonId }) => lessonId))).toHaveLength(12))
  it('20. cada sección fuente tiene disposición', async () => {
    for (const { lessonId } of ACADEMY_STAGE_0_1_REMEDIATIONS) {
      const authored = await academy014IBuildDocument(lessonId, '0.14D')
      const current = await academy014IBuildDocument(lessonId, '0.14I')
      const { dispositions } = academy014IContentPreservation(lessonId, authored.sections, current.sections)
      expect(new Set(dispositions.map(({ sourceSectionId }) => sourceSectionId))).toEqual(new Set(authored.sections.map(({ sectionId }) => sectionId)))
    }
  })
  it('21. la cobertura sustantiva es 100 %', async () => {
    for (const { lessonId } of ACADEMY_STAGE_0_1_REMEDIATIONS) {
      const authored = await academy014IBuildDocument(lessonId, '0.14D')
      const current = await academy014IBuildDocument(lessonId, '0.14I')
      expect(academy014IContentPreservation(lessonId, authored.sections, current.sections).row.substantiveCoverage).toBe(1)
    }
  })
  it('22. la pregunta central se expone una sola vez', async () => {
    for (const { lessonId } of ACADEMY_STAGE_0_1_REMEDIATIONS) {
      const current = await academy014IBuildDocument(lessonId, '0.14I')
      if (current.centralQuestion) expect(academy014IDocumentText(current).split(current.centralQuestion).length - 1).toBeLessThanOrEqual(1)
    }
  })
  it('23. no duplica un bloque curado de vocabulario', async () => {
    for (const { lessonId } of ACADEMY_STAGE_0_1_REMEDIATIONS) {
      const current = await academy014IBuildDocument(lessonId, '0.14I')
      const titles = current.sections.map(({ title }) => title.toLowerCase()).filter((title) => /vocabulario|palabras clave/.test(title))
      expect(new Set(titles).size).toBe(titles.length)
    }
  })
  it('24. las dos lecciones quartz2035 auditadas no cambian', async () => {
    expect(ACADEMY_STAGE_0_1_AUDITED_UNCHANGED).toHaveLength(2)
    for (const { lessonId } of ACADEMY_STAGE_0_1_AUDITED_UNCHANGED) {
      const h = await academy014IBuildDocument(lessonId, '0.14H')
      const i = await academy014IBuildDocument(lessonId, '0.14I')
      expect({ sections: i.sections, hash: i.contentHash }).toEqual({ sections: h.sections, hash: h.contentHash })
    }
  })
  it('25. una revisión histórica pasa a stale por hash sin desaparecer', async () => {
    const lessonId = 'lesson.horology.mechanical-chain'
    const historical = await academy014IBuildDocument(lessonId, '0.14G')
    const current = await academy014IBuildDocument(lessonId, '0.14I')
    const review = createAcademyEditorialReviewDraft(historical, '2026-08-16T00:00:00.000Z', '0.14G')
    expect(academyEditorialReviewStatus(current, review)).toBe('stale-after-content-change')
    expect(review.lessonId).toBe(lessonId)
  })
  it('26. los snapshots F/G permanecen construibles e independientes de I', async () => {
    const stage0 = await academy014IBuildDocument(ACADEMY_STAGE_0_1_REMEDIATIONS[0].lessonId, '0.14F')
    const stage1 = await academy014IBuildDocument(ACADEMY_STAGE_0_1_REMEDIATIONS[4].lessonId, '0.14G')
    expect(stage0.readerSchemaVersion).toBe('0.14F')
    expect(stage1.readerSchemaVersion).toBe('0.14G')
    expect(stage0.contentHash).not.toBe((await academy014IBuildDocument(stage0.lessonId, '0.14I')).contentHash)
    expect(stage1.contentHash).not.toBe((await academy014IBuildDocument(stage1.lessonId, '0.14I')).contentHash)
  })
})
