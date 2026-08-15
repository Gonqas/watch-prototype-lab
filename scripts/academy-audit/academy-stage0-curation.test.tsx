import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import { createDefaultAcademyLocalState, AcademyLocalStore, type AcademyStorage } from '../../src/learning/academy/academyLocalState'
import { ACADEMY_LEARNER_PATH } from '../../src/learning/academy/path/academyLearnerPath'
import { effectiveLessonPrerequisiteConceptIds } from '../../src/learning/academy/path/academyPathPrerequisites'
import {
  ACADEMY_PERSONAL_3D_REVIEWS,
  ACADEMY_PERSONAL_CLAIM_REVIEWS,
  ACADEMY_PERSONAL_PILOT_REVIEWS,
  ACADEMY_PERSONAL_REVIEW_QUEUE,
  ACADEMY_PILOT_FORMULA_REVIEWS,
  ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_0_CLAIM_REVIEWS,
  ACADEMY_STAGE_0_LESSON_CURATIONS,
  ACADEMY_STAGE_0_LESSON_IDS,
  ACADEMY_STAGE_0_PERSONAL_PRACTICES,
  ACADEMY_STAGE_0_PHOTO_BRIEFS,
  ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_0_VISUAL_DESIGNS,
  academyPersonalReviewQueueEntry,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, resolveAcademyReaderSection } from '../../src/learning/academy/reader/academyReaderDocument'
import {
  academyPersonalReviewStatus,
  academyVisibleEditorialStatusLabel,
  createAcademyEditorialReviewDraft,
} from '../../src/learning/academy/reader/academyReaderReview'
import type { AcademyReaderCurationPhase, AcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderModel'
import { academyReaderWebGlAvailable } from '../../src/learning/academy/reader/academyReader3dPresentation'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'
import { AcademySafeMarkdown } from '../../src/learning/ui/reader/AcademySafeMarkdown'
import {
  ACADEMY_014F_BASELINE,
  ACADEMY_STAGE0_CURATION_OUTPUT_FILES,
  buildAcademyStage0CurationOutputs,
} from '../academy-stage0-curation'
import { loadAcademyCorpus, type AcademyCorpus } from './corpus'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const execFileAsync = promisify(execFile)
const now = '2026-08-15T12:00:00.000Z'

class MemoryStorage implements AcademyStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function readerDocument(lessonId: string, phase: AcademyReaderCurationPhase): AcademyReaderDocument {
  const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
  const descriptor = INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.find(({ id }) => id === lessonId)!
  return buildAcademyReaderDocument({
    material,
    title: descriptor.title.es,
    purpose: descriptor.purpose.es,
    locale: 'es-ES',
    requiredActivityIds: descriptor.studyContract?.labActivityIds,
  }, { curationPhase: phase })
}

let corpus: AcademyCorpus
let outputs: Awaited<ReturnType<typeof buildAcademyStage0CurationOutputs>>

beforeAll(async () => {
  corpus = await loadAcademyCorpus(repositoryRoot)
  outputs = await buildAcademyStage0CurationOutputs(repositoryRoot)
}, 60_000)

describe('0.14F · integridad, versionado y modularización', () => {
  it('01–10 · conserva corpus, IDs, paquetes y rutas protegidas', async () => {
    expect(corpus.counts).toMatchObject({ packages: 8, routes: 24, modules: 217, lessons: 222, activities: 289 })
    expect(corpus.digest).toBe(ACADEMY_014F_BASELINE.corpusDigest)
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', 'HEAD'], { cwd: repositoryRoot })
    const changed = stdout.split(/\r?\n/).filter(Boolean)
    expect(changed.some((path) => path.startsWith('learning-content/'))).toBe(false)
    expect(changed.some((path) => path.startsWith('reference-library/originals/'))).toBe(false)
    expect(changed.some((path) => /\.(?:pdf|iso|zip)$/i.test(path))).toBe(false)
  })

  it('11–16 · compone 0.14F sin contaminar 0.14E y conserva revisiones antiguas', () => {
    const historical = readerDocument('lesson.quartz2035.workstation', '0.14E')
    const current = readerDocument('lesson.quartz2035.workstation', '0.14F')
    expect(historical.readerSchemaVersion).toBe('0.14E')
    expect(current.readerSchemaVersion).toBe('0.14F')
    expect(current.contentHash).not.toBe(historical.contentHash)
    const review = createAcademyEditorialReviewDraft(historical, now, '0.14E')
    expect(academyPersonalReviewStatus(current, review)).toBe('stale-after-content-change')
  })

  it('17–22 · conserva exactamente los contratos públicos 0.14E', () => {
    expect(ACADEMY_PERSONAL_PILOT_REVIEWS).toHaveLength(16)
    expect(ACADEMY_PERSONAL_CLAIM_REVIEWS).toHaveLength(24)
    expect(ACADEMY_PERSONAL_3D_REVIEWS).toHaveLength(9)
    expect(ACADEMY_PILOT_FORMULA_REVIEWS).toHaveLength(4)
    expect(ACADEMY_PERSONAL_REVIEW_QUEUE.filter(({ originPhase }) => originPhase === '0.14E')).toHaveLength(16)
  })
})

describe('0.14F · saneamiento visible del lector', () => {
  it('23–28 · centraliza las seis etiquetas sin mostrar nombres internos', () => {
    const states = [
      'automated-structural-migration',
      'codex-assisted-editorial-curation',
      'codex-assisted-personal-curation',
      'owner-reviewed',
      'stale-after-content-change',
    ] as const
    const labels = states.map(academyVisibleEditorialStatusLabel)
    expect(labels).toEqual([
      'Estructura generada automáticamente · pendiente de revisión',
      'Curación editorial aplicada · pendiente de tu revisión',
      'Curación personal aplicada · pendiente de tu revisión',
      'Revisada por ti',
      'Tu revisión quedó desactualizada tras cambiar la lección',
    ])
    expect(labels.join(' ')).not.toMatch(/Codex|0\.14|hash|script/i)
  })

  it('29–34 · duración y fase activa quedan saneadas en las dos superficies', async () => {
    const reader = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    const review = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyEditorialReviewSurface.tsx'), 'utf8')
    expect(reader).toContain('Duración estimada')
    expect(reader).not.toContain('Duración authored')
    expect(`${reader}\n${review}`).toContain('CURRENT_ACADEMY_CURATION_PHASE')
    expect(`${reader}\n${review}`).not.toContain("curationPhase: '0.14E'")
    expect(review).toContain('Esta pantalla es solo para ti')
  })

  it('35–39 · renderiza una sola pregunta central y cero jerga interna en etapa 0', () => {
    const prohibited = /\b(?:authored|fixture|runtime|payload|cue|overlay|instancia|sourceId|blockId|curation|scaffold)\b|capacidad semántica|contrato interno|G\/K\/P/i
    for (const lessonId of ACADEMY_STAGE_0_LESSON_IDS) {
      const document = readerDocument(lessonId, '0.14F')
      const markup = renderToStaticMarkup(<main><h1>{document.centralQuestion}</h1>{document.sections.map((section) => <AcademySafeMarkdown key={section.sectionId} markdown={section.markdown} />)}</main>)
      expect(markup.split(document.centralQuestion!).length - 1, lessonId).toBe(1)
      expect(document.sections.map(({ markdown }) => markdown).join('\n'), lessonId).not.toMatch(prohibited)
      expect(document.sections.every(({ markdown, title }) => markdown.trim() && !/continuación/i.test(title))).toBe(true)
    }
  })
})

describe('0.14F · etapa 0, prerrequisitos y compatibilidad', () => {
  it('40–49 · representa seis lecciones, cuatro anchors y dos supports sin bloqueos laterales', () => {
    expect(ACADEMY_STAGE_0_LESSON_CURATIONS).toHaveLength(6)
    const chapter01 = ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === 'chapter.0.1')!
    const chapter02 = ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === 'chapter.0.2')!
    expect([...chapter01.anchorLessonIds, ...chapter02.anchorLessonIds]).toEqual([
      'lesson.quartz2035.workstation',
      'lesson.quartz2035.tools',
      'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
      'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    ])
    expect([...chapter01.supportingLessonIds, ...chapter02.supportingLessonIds]).toEqual([
      'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
      'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    ])
    expect(ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES.filter(({ pathRole }) => pathRole === 'support').every(({ blocking }) => !blocking)).toBe(true)
  })

  it('50–57 · elimina bloqueos avanzados y conserva la fuente como deuda explícita', () => {
    expect(effectiveLessonPrerequisiteConceptIds('lesson.quartz2035.workstation', [])).toEqual([])
    expect(effectiveLessonPrerequisiteConceptIds('lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', [
      'concept.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies.temple',
      'concept.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies.revenido',
      'concept.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies.integridad-superficial',
    ])).toEqual(['concept.quartz2035.prepare-safe-workstation', 'concept.quartz2035.select-basic-tools'])
    expect(effectiveLessonPrerequisiteConceptIds('lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica', [
      'concept.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.contaminante',
      'concept.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.compatibilidad-quimica',
      'concept.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.arrastre-cruzado',
    ])).toEqual([])
  })

  it('58–64 · deep links, notas, marcadores y reanudación conservan contexto', () => {
    const historical = readerDocument('lesson.quartz2035.workstation', '0.14E')
    const current = readerDocument('lesson.quartz2035.workstation', '0.14F')
    const legacySectionId = historical.sections[3].sectionId
    const resolved = resolveAcademyReaderSection(current, legacySectionId)
    expect(resolved.restoredFromLegacyAlias).toBe(true)
    expect(current.sections.some(({ sectionId }) => sectionId === resolved.sectionId)).toBe(true)

    const storage = new MemoryStorage()
    const state = createDefaultAcademyLocalState('profile.personal', now)
    state.lessonProgress = [{ lessonId: current.lessonId, currentSegmentId: legacySectionId, completedSegmentIds: [], activeSectionId: legacySectionId, scrollAnchor: legacySectionId, scrollOffset: 280, documentVersion: historical.documentVersion, visitedSectionIds: [legacySectionId], updatedAt: now }]
    state.notes = [{ id: 'note.legacy', title: 'Nota', body: 'Local', tags: [], context: { lessonId: current.lessonId, sectionId: legacySectionId }, createdAt: now, updatedAt: now }]
    state.bookmarks = [{ id: 'bookmark.legacy', title: 'Volver', href: `#/learning/lesson/${current.lessonId}?section=${legacySectionId}`, context: { lessonId: current.lessonId, sectionId: legacySectionId }, createdAt: now }]
    storage.setItem('wplab.academy.local.v1.profile.personal', JSON.stringify(state))
    const loaded = new AcademyLocalStore(storage, () => now, () => 'fixed').load('profile.personal')
    expect(loaded.lessonProgress[0].scrollOffset).toBe(280)
    expect(loaded.notes[0].context.sectionId).toBe(legacySectionId)
    expect(loaded.bookmarks[0].href).toContain(legacySectionId)
  })
})

describe('0.14F · visuales, prácticas, claims y evidencia honesta', () => {
  it('65–72 · implementa exactamente seis visuales esenciales y cinco briefs futuros', () => {
    expect(ACADEMY_STAGE_0_VISUAL_DESIGNS).toHaveLength(6)
    expect(new Set(ACADEMY_STAGE_0_VISUAL_DESIGNS.map(({ visualDesignId }) => visualDesignId))).toHaveLength(6)
    expect(ACADEMY_STAGE_0_VISUAL_DESIGNS.filter(({ implementationStatus }) => implementationStatus === 'reused-and-versioned').map(({ visualDesignId }) => visualDesignId)).toEqual(['visual.bench.contamination-transfer.v1'])
    expect(ACADEMY_STAGE_0_VISUAL_DESIGNS.every(({ pedagogicalQuestion, semanticPayload, limitations, longDescription, colorIndependent, reducedMotionSafe }) => pedagogicalQuestion && semanticPayload.nodes.length > 3 && semanticPayload.edges.length > 2 && limitations.length && longDescription && colorIndependent && reducedMotionSafe)).toBe(true)
    expect(ACADEMY_STAGE_0_PHOTO_BRIEFS).toHaveLength(5)
    expect(ACADEMY_STAGE_0_PHOTO_BRIEFS.every(({ status }) => status === 'future-real-photo-required')).toBe(true)
  })

  it('73–79 · crea siete prácticas opcionales fuera de las 289 actividades y sin mastery', async () => {
    expect(ACADEMY_STAGE_0_PERSONAL_PRACTICES).toHaveLength(7)
    expect(ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS).toHaveLength(8)
    expect(corpus.counts.activities).toBe(289)
    expect(ACADEMY_STAGE_0_PERSONAL_PRACTICES.every(({ affectsProgress, createsMastery, completesLesson, certificationStatus, stopSignal, inexpensiveMaterials }) => !affectsProgress && !createsMastery && !completesLesson && certificationStatus === 'optional-local-not-certified' && stopSignal && inexpensiveMaterials.length)).toBe(true)
    expect(ACADEMY_STAGE_0_PERSONAL_PRACTICES.map((item) => JSON.stringify(item)).join('\n')).not.toMatch(/ácido sulfúrico|cianuro|llama|abrir barrilete|manipular espiral/i)
    expect(ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS.every(({ evidenceProfile }) => !evidenceProfile.modalities.includes('P') && !evidenceProfile.physicalCompetenceClaim)).toBe(true)
    const activitySurface = await readFile(join(repositoryRoot, 'src/learning/ui/LearningSurfaces.tsx'), 'utf8')
    expect(activitySurface).toContain('academyPersonalActivityPresentation(activity.id)')
    expect(activitySurface).toContain('personalPresentation?.visibleTitle')
    expect(activitySurface).toContain('personalPresentation.limitations')
  })

  it('80–84 · diferencia inspección visual, OCR y claims limitados', () => {
    const sourceIds = new Set(corpus.packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id)))
    expect(ACADEMY_STAGE_0_CLAIM_REVIEWS).toHaveLength(6)
    for (const claim of ACADEMY_STAGE_0_CLAIM_REVIEWS) {
      expect(claim.sourceIds.every((sourceId) => sourceIds.has(sourceId))).toBe(true)
      if (claim.technicalStatus === 'source-reviewed') {
        expect(claim.locators.length).toBeGreaterThan(0)
        expect(claim.locators.every(({ verificationMethod }) => verificationMethod === 'visual-pdf-inspection' || verificationMethod === 'official-document')).toBe(true)
      }
    }
    const bulova = ACADEMY_STAGE_0_CLAIM_REVIEWS.find(({ claimId }) => claimId === 'claim.014f.stage0.bulova-practice-progression')!
    expect(bulova.locators.some(({ page, figure }) => page && figure)).toBe(true)
    expect(JSON.stringify(bulova.locators)).not.toContain('ocr-unverified')
  })

  it('85–87 · fallback, teclado y reflow mantienen protecciones', async () => {
    expect(academyReaderWebGlAvailable({ getContext: () => null } as unknown as Pick<HTMLCanvasElement, 'getContext'>)).toBe(false)
    const css = `${await readFile(join(repositoryRoot, 'src/learning/ui/reader/academy-reader.css'), 'utf8')}\n${await readFile(join(repositoryRoot, 'src/learning/ui/reader/academy-editorial-review.css'), 'utf8')}`
    expect(css).toMatch(/@media \(max-width: 760px\)/)
    expect(css).toMatch(/overflow-wrap|overflow-x|minmax\(0/)
    const reader = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    expect(reader).toContain("event.key !== 'Escape'")
  })
})

describe('0.14F · informes deterministas', () => {
  it('genera y verifica las dieciséis salidas obligatorias', async () => {
    const second = await buildAcademyStage0CurationOutputs(repositoryRoot)
    expect([...second.entries()]).toEqual([...outputs.entries()])
    expect([...outputs.keys()]).toEqual([...ACADEMY_STAGE0_CURATION_OUTPUT_FILES])
    for (const [fileName, content] of outputs) {
      expect(await readFile(join(repositoryRoot, 'docs/generated', fileName), 'utf8'), fileName).toBe(content)
    }
    const screenshotRoot = join(repositoryRoot, 'docs/academy-ux/screenshots/0.14F')
    const screenshotNames = (await readdir(screenshotRoot)).filter((name) => name.endsWith('.png'))
    const screenshotHashes = await Promise.all(screenshotNames.map(async (name) => createHash('sha256').update(await readFile(join(screenshotRoot, name))).digest('hex')))
    expect(screenshotNames).toHaveLength(16)
    expect(new Set(screenshotHashes)).toHaveLength(16)
  }, 60_000)

  it('mantiene 22 entradas únicas y seis estados 0.14F sin revisión inventada', () => {
    expect(ACADEMY_PERSONAL_REVIEW_QUEUE).toHaveLength(22)
    expect(new Set(ACADEMY_PERSONAL_REVIEW_QUEUE.map(({ lessonId }) => lessonId))).toHaveLength(22)
    expect(ACADEMY_STAGE_0_LESSON_IDS.every((lessonId) => academyPersonalReviewQueueEntry(lessonId)?.personalStatus === 'not-reviewed')).toBe(true)
  })
})
