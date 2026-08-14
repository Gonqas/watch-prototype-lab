import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import type { LearningApplicationSnapshot } from '../../src/learning/application/service'
import type { LearningMasteryProjection } from '../../src/learning/persistence/models'
import { profileFixture } from '../../src/learning/persistence/testFixtures'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import {
  ACADEMY_LEARNER_PATH,
  ACADEMY_PLANNED_CONTENT,
  serializeAcademyLearnerPathLegacy014B,
  type AcademyLearnerPathDefinition,
} from '../../src/learning/academy/path/academyLearnerPath'
import { ACADEMY_PROGRESS_COMPATIBILITY_POLICY } from '../../src/learning/academy/path/academyPathCompatibility'
import { academyLessonCompletionTransition } from '../../src/learning/academy/path/academyPathLinks'
import { academyNextAction } from '../../src/learning/academy/path/academyNextAction'
import { deriveAcademyPathProgress } from '../../src/learning/academy/path/academyPathProgress'
import {
  AcademyLocalStore,
  createDefaultAcademyLocalState,
  type AcademyStorage,
} from '../../src/learning/academy/academyLocalState'
import {
  academyLegacyModeForReader,
  academyReaderModeFromLegacy,
} from '../../src/learning/academy/reader/academyReaderCompatibility'
import {
  buildAcademyReaderDocument,
  resolveAcademyReaderSection,
  validateAcademyReaderDocument,
} from '../../src/learning/academy/reader/academyReaderDocument'
import { ACADEMY_READER_PILOT } from '../../src/learning/academy/reader/academyReaderPilot'
import { AcademySafeMarkdown } from '../../src/learning/ui/reader/AcademySafeMarkdown'
import { ACADEMY_READER_OUTPUT_FILES, buildAcademyReaderOutputs } from '../academy-reader-audit'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const now = '2026-08-15T10:00:00.000Z'

function page<T>(items: T[]) { return { items, offset: 0, limit: 500, total: items.length } }

function snapshot(): LearningApplicationSnapshot {
  const profile = profileFixture()
  return {
    status: 'ready', backend: 'memory', location: { surface: 'home', query: {} }, profile, profiles: [profile],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX, sessions: page([]), evidence: page([]), assessments: page([]),
    mastery: page([]), packages: page([]), backups: [], recovery: {}, notifications: [], recommendations: [],
    filters: { search: '', difficulty: '', type: '', movement: '', family: '', subsystem: '', competency: '', mastery: '', capability: '', language: '', offline: '', installed: '', compatible: '' },
    selectedSessionEvents: page([]), performance: [], online: false,
  }
}

class MemoryStorage implements AcademyStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function readerDocument(lessonId = 'lesson.horology.mechanical-chain') {
  const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
  const descriptor = INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.find(({ id }) => id === lessonId)!
  const requiredActivityIds = ACADEMY_LEARNER_PATH.chapters
    .flatMap(({ steps }) => steps)
    .find((step) => step.lessonId === lessonId)?.requiredActivityIds ?? []
  return buildAcademyReaderDocument({ material, title: descriptor.title.es, locale: 'es-ES', requiredActivityIds })
}

function dueProjection(competencyId: string): LearningMasteryProjection {
  return {
    schemaVersion: 1, profileId: 'profile.local-default', competencyId, state: 'demonstrated', strength: 1,
    primaryEvidenceIds: ['evidence.old'], retentionEvidenceIds: [], nextReviewAt: '2026-08-14T09:00:00.000Z',
    reasons: ['Retención vencida.'], projectorVersion: '1.1.0', calculatedAt: now,
  }
}

let outputs: Awaited<ReturnType<typeof buildAcademyReaderOutputs>>
let readerJson: {
  counts: { lessons: number; sections: number; total: number; scene3d: number; diagrams: number; unnecessary: number; gaps: number }
  lessons: Array<{
    lessonId: string
    packageId: string
    documentVersion: string
    sectionCount: number
    aliasCount: number
    contentHash: string
    sections: Array<{ sectionId: string; title: string; role: string; visualCue: { kind: string; order: number; purpose: string; sourceType: string; selectorIds: string[]; isolation: string[]; labels: string[]; caption: string; altText: string; fidelity: string; limitations: string[]; implementationStatus: string; sourceRole: string; curationStatus: string } }>
  }>
}

beforeAll(async () => {
  outputs = await buildAcademyReaderOutputs(repositoryRoot)
  readerJson = JSON.parse(outputs.get('ACADEMY-CONTINUOUS-READER-0.14C.json')!) as typeof readerJson
}, 30_000)

describe('0.14C · dominio y retoques B.1', () => {
  it('01 · steps es enumerable', () => {
    expect(Object.keys(ACADEMY_LEARNER_PATH.chapters[0])).toContain('steps')
    expect(JSON.parse(JSON.stringify(ACADEMY_LEARNER_PATH)).chapters[0].steps).toBeDefined()
  })

  it('02 · el serializador 0.14B reproduce la forma histórica', async () => {
    const historical = JSON.parse(await readFile(join(repositoryRoot, 'docs/generated/ACADEMY-LEARNER-PATH-0.14B.json'), 'utf8')) as { path: unknown }
    expect(serializeAcademyLearnerPathLegacy014B()).toEqual(historical.path)
  })

  it('03 · los informes históricos permanecen byte por byte', async () => {
    const names = ['ACADEMY-CONTENT-AUDIT-0.14A.md', 'ACADEMY-CONTENT-AUDIT-0.14A1.md', 'ACADEMY-LEARNER-PATH-0.14B.md', 'ACADEMY-PATH-SEMANTICS-0.14B1.md']
    for (const name of names) expect(createHash('sha256').update(await readFile(join(repositoryRoot, 'docs/generated', name))).digest('hex')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('04 · cada plannedContentRef coincide con su chapterId exacto', () => {
    expect(Object.fromEntries(ACADEMY_PLANNED_CONTENT.map(({ ref, chapterId }) => [ref, chapterId]))).toEqual({
      'stage5-gap.movement-holder': 'chapter.5.2',
      'stage5-gap.dial-feet': 'chapter.5.3',
      'stage5-gap.dial-diameter': 'chapter.5.3',
      'stage5-gap.hand-holes-fit': 'chapter.5.3',
      'stage5-gap.hour-wheel-stack': 'chapter.5.3',
      'stage5-gap.caseback-clearance': 'chapter.5.2',
      'stage5-gap.dynamic-interferences': 'chapter.5.4',
      'stage5-gap.final-assembly-verification': 'chapter.5.5',
    })
  })

  it('05 · no existen refs planificados huérfanos', () => {
    const owners = new Map(ACADEMY_PLANNED_CONTENT.map((item) => [item.ref, item.chapterId]))
    for (const chapter of ACADEMY_LEARNER_PATH.chapters) for (const ref of chapter.plannedContentRefs) expect(owners.get(ref)).toBe(chapter.chapterId)
    expect(new Set(ACADEMY_LEARNER_PATH.chapters.flatMap(({ plannedContentRefs }) => plannedContentRefs))).toEqual(new Set(owners.keys()))
  })

  it('06–07 · una actividad sin contrato retention no abre mode=retention y declara contenido ausente', () => {
    const base = snapshot()
    const coreSteps = ACADEMY_LEARNER_PATH.chapters.flatMap(({ steps }) => steps)
    const retentionActivityCompetencies = new Set(base.product.activities
      .filter(({ pedagogicalContract }) => pedagogicalContract?.purpose === 'retention' || pedagogicalContract?.assessmentIntent === 'retention')
      .flatMap(({ competencyIds }) => competencyIds))
    const owner = coreSteps.flatMap((step) => step.requiredActivityIds.map((activityId) => ({ step, activity: base.product.activities.find(({ id }) => id === activityId)! })))
      .find(({ activity }) => activity.competencyIds.some((id) => !retentionActivityCompetencies.has(id)))!
    const competencyId = owner.activity.competencyIds.find((id) => !retentionActivityCompetencies.has(id))!
    base.mastery = page([dueProjection(competencyId)])
    const action = academyNextAction(base, undefined, now)
    expect(action).toMatchObject({ type: 'retention-content-missing', competencyId })
    expect(action.href).not.toContain('mode=retention')
    expect(action.activityId).toBeUndefined()
  })

  it('08 · un único paso retenido no convierte un capítulo parcialmente evaluado en retenido global', () => {
    const base = snapshot()
    const chapter = ACADEMY_LEARNER_PATH.chapters.find((candidate) => candidate.steps.some((step) => step.requiredActivityIds.some((id) => {
      const contract = base.product.activities.find((activity) => activity.id === id)?.pedagogicalContract
      return contract?.purpose === 'mastery-check' || contract?.assessmentIntent === 'demonstration'
    })))!
    const assessed = chapter.steps.find((step) => step.requiredActivityIds.some((id) => base.product.activities.find((activity) => activity.id === id)?.pedagogicalContract?.purpose === 'mastery-check'))!
    const unassessed = { ...chapter.steps[0], stepId: `${chapter.steps[0].stepId}.unassessed`, requiredActivityIds: [], optionalActivityIds: [] }
    const fixtureChapter = {
      ...chapter,
      steps: [assessed, unassessed],
      anchorLessonIds: [assessed.lessonId, unassessed.lessonId],
      requiredActivityIds: [...assessed.requiredActivityIds],
    }
    const competencyIds = assessed.requiredActivityIds.flatMap((id) => base.product.activities.find((activity) => activity.id === id)?.competencyIds ?? [])
    base.mastery = page(competencyIds.map((id) => ({ ...dueProjection(id), state: 'retained' as const, nextReviewAt: undefined, retentionEvidenceIds: ['evidence.retained'] })))
    const progress = deriveAcademyPathProgress(base, undefined, { ...ACADEMY_LEARNER_PATH, stages: ACADEMY_LEARNER_PATH.stages.filter(({ stageId }) => stageId === chapter.stageId).map((stage) => ({ ...stage, chapterIds: [chapter.chapterId], prerequisiteStageIds: [] })), stageIds: [chapter.stageId], chapters: [{ ...fixtureChapter, prerequisiteChapterIds: [] }], optionalBranches: [] }, now).chapters[0]
    expect(progress.masteryCoverageStatus).toBe('partial')
    expect(progress.masteryStatus).not.toBe('retained')
  })

  it('09 · chapter-capstone solo representa el capítulo cuando está declarado', () => {
    const base = snapshot()
    const source = ACADEMY_LEARNER_PATH.chapters.find((chapter) => chapter.steps.some((step) => step.requiredActivityIds.some((id) => base.product.activities.find((activity) => activity.id === id)?.pedagogicalContract?.purpose === 'mastery-check')))!
    const capstone = source.steps.find((step) => step.requiredActivityIds.some((id) => base.product.activities.find((activity) => activity.id === id)?.pedagogicalContract?.purpose === 'mastery-check'))!
    const path = (chapter: typeof source): AcademyLearnerPathDefinition => ({ ...ACADEMY_LEARNER_PATH, stageIds: [source.stageId], stages: [{ ...ACADEMY_LEARNER_PATH.stages.find(({ stageId }) => stageId === source.stageId)!, chapterIds: [source.chapterId], prerequisiteStageIds: [] }], chapters: [{ ...chapter, prerequisiteChapterIds: [] }], optionalBranches: [] })
    expect(deriveAcademyPathProgress(base, undefined, path({ ...source, masteryCoveragePolicy: 'chapter-capstone', masteryCapstoneStepId: undefined }), now).chapters[0].chapterMasteryClaimAllowed).toBe(false)
    expect(deriveAcademyPathProgress(base, undefined, path({ ...source, masteryCoveragePolicy: 'chapter-capstone', masteryCapstoneStepId: capstone.stepId }), now).chapters[0].chapterMasteryClaimAllowed).toBe(true)
  })

  it('10–11 · el corte histórico conserva su valor y la política queda versionada', () => {
    expect(ACADEMY_PROGRESS_COMPATIBILITY_POLICY).toMatchObject({ policyVersion: '1.0.0', legacyCutoff: '2026-08-14T12:45:00.000Z', recognitionMethod: 'additive-legacy-inference' })
  })

  it('12–13 · el piloto contiene hashes reales y no afirma revisión humana inexistente', () => {
    const pilot = JSON.parse(outputs.get('ACADEMY-PILOT-CURATION-0.14C.json')!) as { records: Array<{ contentHash: string; ownerReviewed: boolean; ownerReviewPending: boolean; curationMethod: string }> }
    expect(pilot.records).toHaveLength(21)
    expect(pilot.records.every(({ contentHash }) => /^[a-f0-9]{64}$/.test(contentHash))).toBe(true)
    expect(pilot.records.every(({ ownerReviewed, ownerReviewPending, curationMethod }) => !ownerReviewed && ownerReviewPending && ['codex-assisted', 'automated'].includes(curationMethod))).toBe(true)
  })
})

describe('0.14C · documento y secciones', () => {
  it('14 · las 222 lecciones visibles producen documento', () => expect(readerJson.counts.lessons).toBe(222))
  it('15 · el lector no depende del límite de 210 palabras', async () => {
    for (const file of ['src/learning/academy/reader/academyReaderDocument.ts', 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx']) {
      expect(await readFile(join(repositoryRoot, file), 'utf8')).not.toMatch(/MAXIMUM_SEGMENT_WORDS|210 palabras|wordCount\s*>/)
    }
  })
  it('16 · no se generan títulos continuación', () => expect(readerJson.lessons.flatMap(({ sections }) => sections).some(({ title }) => /continuaci[oó]n/i.test(title))).toBe(false))
  it('17 · los IDs son deterministas', () => expect(buildAcademyReaderDocument({ ...(() => { const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, 'lesson.horology.system')!; return { material, title: 'Sistema' } })() }).sections.map(({ sectionId }) => sectionId)).toEqual(readerDocument('lesson.horology.system').sections.map(({ sectionId }) => sectionId)))
  it('18 · los IDs no cambian entre modos', () => {
    const ids = readerDocument().sections.map(({ sectionId }) => sectionId)
    expect(academyReaderModeFromLegacy('split')).toBe('learn'); expect(academyReaderModeFromLegacy('reading')).toBe('read'); expect(ids).toEqual(readerDocument().sections.map(({ sectionId }) => sectionId))
  })
  it('19 · referencias y fuentes quedan separadas por rol', () => expect(readerJson.lessons.flatMap(({ sections }) => sections).filter(({ role }) => role === 'reference').length).toBeGreaterThan(0))
  it('20 · un encabezado vacío no produce sección vacía', () => {
    const material = structuredClone(academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, 'lesson.horology.system')!)
    material.blocks = [{ ...material.blocks[0], bodyMarkdown: '##\n\nTexto conservado.' }]
    expect(validateAcademyReaderDocument(buildAcademyReaderDocument({ material, title: 'Fixture' }))).not.toContainEqual(expect.objectContaining({ code: 'empty-section' }))
  })
  it('21 · una lección sin encabezados sigue legible', () => {
    const material = structuredClone(academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, 'lesson.horology.system')!)
    material.blocks = [{ ...material.blocks[0], bodyMarkdown: 'Un párrafo completo sin encabezados.' }]
    expect(buildAcademyReaderDocument({ material, title: 'Fixture' }).sections).toHaveLength(1)
  })
  it('22–23 · tablas y listas anidadas se renderizan con AST', () => {
    const html = renderToStaticMarkup(<AcademySafeMarkdown markdown={'| A | B |\n|---|---|\n| 1 | 2 |\n\n- Uno\n  - Dos'} />)
    expect(html).toContain('<table>'); expect(html.match(/<ul>/g)?.length).toBeGreaterThanOrEqual(2)
  })
  it('24 · Markdown no ejecuta HTML ni scripts', () => {
    const html = renderToStaticMarkup(<AcademySafeMarkdown markdown={'<script>alert(1)</script>\n[x](javascript:alert(1))\n![externa](https://example.test/private.png)'} />)
    expect(html).not.toContain('<script>'); expect(html).not.toContain('javascript:'); expect(html).not.toContain('src="https://')
  })
  it('25 · una fórmula OCR pendiente se conserva como texto y no se reinterpreta', () => {
    const formula = '$R = N_{conducida} / N_{conductora}$'
    expect(renderToStaticMarkup(<AcademySafeMarkdown markdown={formula} />)).toContain('R = N_{conducida} / N_{conductora}')
  })
})

describe('0.14C · progreso, aliases y modos', () => {
  it('26–28 · scroll, tiempo y secciones visitadas no completan', () => {
    const store = new AcademyLocalStore(new MemoryStorage(), () => now)
    const doc = readerDocument()
    store.recordReaderPosition('profile.a', doc.lessonId, { activeSectionId: doc.sections.at(-1)!.sectionId, scrollAnchor: doc.sections.at(-1)!.sectionId, scrollOffset: 400, documentVersion: doc.documentVersion, visitedSectionIds: doc.sections.map(({ sectionId }) => sectionId) })
    expect(store.load('profile.a').lessonProgress[0].completedAt).toBeUndefined()
  })
  it('29 · solo la confirmación final crea completedAt', () => {
    const store = new AcademyLocalStore(new MemoryStorage(), () => now); const doc = readerDocument()
    store.recordReaderPosition('profile.a', doc.lessonId, { activeSectionId: doc.sections[0].sectionId, scrollAnchor: doc.sections[0].sectionId, scrollOffset: 0, documentVersion: doc.documentVersion, visitedSectionIds: [] })
    store.completeLesson('profile.a', doc.lessonId, doc.sections[0].sectionId, doc.documentVersion)
    expect(store.load('profile.a').lessonProgress[0].completedAt).toBe(now)
  })
  it('30 · una lección ya completada sigue completada', () => {
    const storage = new MemoryStorage(); let clock = now; const store = new AcademyLocalStore(storage, () => clock); const doc = readerDocument()
    store.completeLesson('profile.a', doc.lessonId, doc.sections[0].sectionId, doc.documentVersion); clock = '2026-08-16T10:00:00.000Z'
    store.recordReaderPosition('profile.a', doc.lessonId, { activeSectionId: doc.sections.at(-1)!.sectionId, scrollAnchor: doc.sections.at(-1)!.sectionId, scrollOffset: 1, documentVersion: doc.documentVersion, visitedSectionIds: [] })
    expect(store.load('profile.a').lessonProgress[0].completedAt).toBe(now)
  })
  it('31 · legacy-inferred sigue reconocido por la política histórica', () => expect(ACADEMY_PROGRESS_COMPATIBILITY_POLICY.legacyCutoff).toBe('2026-08-14T12:45:00.000Z'))
  it('32–33 · progreso parcial y ?segment= resuelven una sección equivalente', () => {
    const doc = readerDocument(); const alias = doc.legacyAliases[0]
    expect(alias).toMatchObject({ lessonId: doc.lessonId, newSectionId: alias.sectionId, matchMethod: alias.method, fallbackSectionId: doc.sections[0].sectionId })
    expect(resolveAcademyReaderSection(doc, alias.legacySegmentId)).toEqual({ sectionId: alias.sectionId, restoredFromLegacyAlias: true })
  })
  it('34 · alias inexistente cae al comienzo', () => {
    const doc = readerDocument(); expect(resolveAcademyReaderSection(doc, 'segment.no-existe').sectionId).toBe(doc.sections[0].sectionId)
  })
  it('35 · los IDs antiguos siguen almacenados', () => {
    const store = new AcademyLocalStore(new MemoryStorage(), () => now); store.recordLessonSegment('profile.a', 'lesson.horology.system', 'legacy.segment', ['legacy.segment'], false)
    expect(store.load('profile.a').lessonProgress[0]).toMatchObject({ currentSegmentId: 'legacy.segment', completedSegmentIds: ['legacy.segment'] })
  })
  it('36–37 · cambiar de modo no afecta la posición y normaliza preferencias antiguas', () => {
    expect(['visual', 'split'].map((mode) => academyReaderModeFromLegacy(mode as 'visual' | 'split'))).toEqual(['learn', 'learn'])
    expect(['reading', 'focus', 'textual'].map((mode) => academyReaderModeFromLegacy(mode as 'reading' | 'focus' | 'textual'))).toEqual(['read', 'read', 'read'])
    expect(academyLegacyModeForReader('learn')).toBe('split'); expect(academyLegacyModeForReader('read')).toBe('reading')
  })
})

describe('0.14C · continuación y visual', () => {
  it('38–40 · finalizar abre la práctica requerida curada, no material.activities[0] ni una opcional', () => {
    const base = snapshot(); const lessonId = 'lesson.miyota8215.guided-disassembly'; const material = academyLessonMaterial(base.product, lessonId)!; const step = ACADEMY_LEARNER_PATH.chapters.flatMap(({ steps }) => steps).find((item) => item.lessonId === lessonId)!
    const sourceChapter = ACADEMY_LEARNER_PATH.chapters.find(({ steps }) => steps.some(({ stepId }) => stepId === step.stepId))!
    const chapter = { ...sourceChapter, steps: [step], anchorLessonIds: [lessonId], requiredActivityIds: [...step.requiredActivityIds], prerequisiteChapterIds: [] }
    const path: AcademyLearnerPathDefinition = { ...ACADEMY_LEARNER_PATH, stageIds: [sourceChapter.stageId], stages: [{ ...ACADEMY_LEARNER_PATH.stages.find(({ stageId }) => stageId === sourceChapter.stageId)!, chapterIds: [sourceChapter.chapterId], prerequisiteStageIds: [] }], chapters: [chapter], optionalBranches: [] }
    expect(material.activities[0].id).not.toBe(step.requiredActivityIds[0])
    expect(academyLessonCompletionTransition(base, undefined, lessonId, now, path)).toMatchObject({ activityId: step.requiredActivityIds[0], metric: 'lesson-complete-to-required-activity' })
  })
  it('41 · sin práctica pendiente consulta academyNextAction', () => {
    const base = snapshot(); const lessonId = ACADEMY_LEARNER_PATH.chapters[0].steps[0].lessonId; const state = createDefaultAcademyLocalState('profile.local-default', now); state.lessonProgress = [{ lessonId, currentSegmentId: '', completedSegmentIds: [], completedAt: now, updatedAt: now }]
    expect(academyLessonCompletionTransition(base, state, lessonId, now).metric).toMatch(/lesson-complete-to-/)
  })
  it('42–44 · el motor único mantiene requisito, posición y entradas', async () => {
    const source = await readFile(join(repositoryRoot, 'src/learning/ui/AcademySurfaces.tsx'), 'utf8')
    expect(source).toContain('<AcademyContinuousLessonSurface />'); expect(source).not.toContain('if (surface === \'lesson\') return <LegacyLessonSurface014B')
    expect(await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')).toContain('actions.completeLesson')
  })
  it('45 · cada sección selecciona su cue por sectionId', () => {
    const doc = readerDocument(); expect(new Set(doc.sections.map(({ visualCue }) => visualCue.sectionId))).toEqual(new Set(doc.sections.map(({ sectionId }) => sectionId)))
  })
  it('46 · un cue no contiene operaciones de estado evaluativo', () => {
    const cues = readerJson.lessons.flatMap(({ sections }) => sections.map(({ visualCue }) => visualCue)); expect(JSON.stringify(cues)).not.toMatch(/mastery|sessionId|assessmentResult/)
  })
  it('47 · un cue sin modelo no presenta placeholder vacío', async () => {
    const source = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyReaderVisual.tsx'), 'utf8'); expect(source).toContain("implementationStatus !== 'implemented'"); expect(source).toContain('return null')
  })
  it('48–50 · reduced motion, flujo móvil y fallo controlado están implementados', async () => {
    const visual = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyReaderVisual.tsx'), 'utf8'); const scene = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyReaderScene.tsx'), 'utf8'); const css = await readFile(join(repositoryRoot, 'src/learning/ui/reader/academy-reader.css'), 'utf8')
    expect(visual).toContain('reducedMotion'); expect(scene).toContain('La vista no está disponible'); expect(css).toContain('grid-template-areas: "document"'); expect(css).toContain('prefers-reduced-motion')
  })
  it('51–52 · cues implementados declaran caption, alt, fidelidad y límites', () => {
    const implemented = readerJson.lessons.flatMap(({ sections }) => sections.map(({ visualCue }) => visualCue)).filter(({ implementationStatus }) => implementationStatus === 'implemented')
    expect(implemented.length).toBeGreaterThan(0)
    expect(implemented.every(({ order, purpose, sourceType, selectorIds, isolation, labels, caption, altText, fidelity, limitations, sourceRole, curationStatus }) => order > 0 && purpose && sourceType && Array.isArray(selectorIds) && Array.isArray(isolation) && Array.isArray(labels) && caption && altText && fidelity && limitations.length > 0 && sourceRole && curationStatus === 'implemented')).toBe(true)
  })
  it('53 · no se incluyen activos procedentes de originales privados', async () => {
    const tracked = (await readFile(join(repositoryRoot, 'docs/generated/ACADEMY-CONTINUOUS-READER-0.14C.json'), 'utf8')).toLowerCase(); expect(tracked).not.toMatch(/reference-library[\\/]originals|\.iso"|\.pdf"|\.zip"/)
  })
})

describe('0.14C · integridad y determinismo', () => {
  it('54 · siguen cargando ocho paquetes visibles', () => expect(new Set(readerJson.lessons.map(({ packageId }) => packageId)).size).toBe(8))
  it('55–57 · IDs y deep links permanecen y los informes no mutan progreso, sesiones o evidencias', () => {
    const base = snapshot(); const before = structuredClone({ sessions: base.sessions, evidence: base.evidence, mastery: base.mastery }); readerDocument(); expect({ sessions: base.sessions, evidence: base.evidence, mastery: base.mastery }).toEqual(before)
    expect(readerJson.lessons.every(({ lessonId }) => INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.some(({ id }) => id === lessonId))).toBe(true)
    expect(readerDocument().legacyAliases.length).toBeGreaterThan(0)
  })
  it('los once informes son deterministas y coinciden con disco', async () => {
    const second = await buildAcademyReaderOutputs(repositoryRoot); expect([...second.entries()]).toEqual([...outputs.entries()]); expect([...outputs.keys()]).toEqual([...ACADEMY_READER_OUTPUT_FILES])
    for (const [name, content] of outputs) expect(await readFile(join(repositoryRoot, 'docs/generated', name), 'utf8'), name).toBe(content)
  }, 30_000)
  it('el piloto obligatorio contiene exactamente las 21 lecciones curadas', () => expect(new Set(ACADEMY_READER_PILOT.map(({ lessonId }) => lessonId))).toEqual(new Set(readerJson.lessons.filter((item) => ACADEMY_READER_PILOT.some(({ lessonId }) => lessonId === item.lessonId)).map(({ lessonId }) => lessonId))))
})
