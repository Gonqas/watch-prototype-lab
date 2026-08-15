import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import {
  AcademyLocalStore,
  createDefaultAcademyLocalState,
  type AcademyStorage,
} from '../../src/learning/academy/academyLocalState'
import { academy3dVisualStateForPhase } from '../../src/learning/academy/reader/academyReader3dStates'
import {
  ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS,
  ACADEMY_MIYOTA_FORBIDDEN_ROLES,
  ACADEMY_MIYOTA_REFERENCE_ROLES,
  ACADEMY_PERSONAL_3D_REVIEWS,
  ACADEMY_PERSONAL_CLAIM_REVIEWS,
  ACADEMY_PERSONAL_PILOT_REVIEWS,
  ACADEMY_PILOT_FORMULA_REVIEWS,
  academyPersonalPatchedSectionIds,
  academyPersonalVisualReviews,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, resolveAcademyReaderSection } from '../../src/learning/academy/reader/academyReaderDocument'
import { academyReaderDocumentVersionMatches } from '../../src/learning/academy/reader/academyReaderIdentity'
import {
  academyPersonalReviewStatus,
  createAcademyEditorialReviewDraft,
} from '../../src/learning/academy/reader/academyReaderReview'
import type { AcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderModel'
import { academyReaderWebGlAvailable } from '../../src/learning/academy/reader/academyReader3dPresentation'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'
import {
  ACADEMY_014E_BASELINE,
  ACADEMY_PERSONAL_CURATION_OUTPUT_FILES,
  buildAcademyPersonalCurationOutputs,
} from '../academy-personal-curation'
import { allCorpusIds, loadAcademyCorpus, type AcademyCorpus } from './corpus'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const now = '2026-08-15T10:00:00.000Z'

class MemoryStorage implements AcademyStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function readerDocument(lessonId: string): AcademyReaderDocument {
  const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
  const descriptor = INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.find(({ id }) => id === lessonId)!
  return buildAcademyReaderDocument({
    material,
    title: descriptor.title.es,
    purpose: descriptor.purpose.es,
    locale: 'es-ES',
    requiredActivityIds: descriptor.studyContract?.labActivityIds,
  }, { curationPhase: '0.14E' })
}

let corpus: AcademyCorpus
let outputs: Awaited<ReturnType<typeof buildAcademyPersonalCurationOutputs>>

beforeAll(async () => {
  corpus = await loadAcademyCorpus(repositoryRoot)
  outputs = await buildAcademyPersonalCurationOutputs(repositoryRoot)
}, 60_000)

describe('0.14E · integridad y compatibilidad', () => {
  it('01–05 · conserva ocho paquetes y todos los IDs visibles', () => {
    expect(corpus.counts).toMatchObject({ packages: 8, routes: 24, modules: 217, lessons: 222, activities: 289 })
    expect(corpus.digest).toBe(ACADEMY_014E_BASELINE.corpusDigest)
    const ids = allCorpusIds(corpus)
    expect(new Set(corpus.lessons.map(({ route }) => route.id))).toHaveLength(24)
    expect(new Set(corpus.lessons.map(({ module }) => module.id))).toHaveLength(217)
    expect(new Set(corpus.lessons.map(({ lesson }) => lesson.id))).toHaveLength(222)
    expect(new Set(corpus.activities.map(({ activity }) => activity.id))).toHaveLength(289)
    expect(ids.routes).toHaveLength(25)
  })

  it('06–08 · progreso, notas, marcadores y revisiones 0.14D siguen siendo interpretables', () => {
    const storage = new MemoryStorage()
    const state = createDefaultAcademyLocalState('profile.personal', now)
    state.lessonProgress = [{
      lessonId: 'lesson.horology.system', currentSegmentId: 'legacy.segment', completedSegmentIds: ['legacy.segment'],
      activeSectionId: 'legacy.segment', scrollAnchor: 'legacy.segment', scrollOffset: 320,
      documentVersion: 'legacy-reader-version', visitedSectionIds: ['legacy.segment'], updatedAt: now,
    }]
    state.notes = [{ id: 'academy-note.old', title: 'Nota conservada', body: 'Texto local', tags: [], context: { lessonId: 'lesson.horology.system', sectionId: 'legacy.segment' }, createdAt: now, updatedAt: now }]
    state.bookmarks = [{ id: 'academy-bookmark.old', title: 'Volver', href: '#/learning/lesson/lesson.horology.system?segment=legacy.segment', context: { lessonId: 'lesson.horology.system', sectionId: 'legacy.segment' }, createdAt: now }]
    const document = readerDocument('lesson.horology.system')
    state.editorialReviews = [{
      ...createAcademyEditorialReviewDraft(document, now, '0.14D'),
      status: 'owner-reviewed', ownerReviewedAt: now, updatedAt: now,
    }]
    storage.setItem('wplab.academy.local.v1.profile.personal', JSON.stringify(state))
    const loaded = new AcademyLocalStore(storage, () => now, () => 'fixed').load('profile.personal')
    expect(loaded.lessonProgress[0]).toMatchObject({ scrollOffset: 320, completedSegmentIds: ['legacy.segment'] })
    expect(loaded.notes[0].context.sectionId).toBe('legacy.segment')
    expect(loaded.bookmarks[0].href).toContain('?segment=legacy.segment')
    expect(loaded.editorialReviews[0].version).toBe('0.14D')
  })

  it('09–10 · el lector continuo resuelve aliases y versiones anteriores', () => {
    const document = readerDocument('lesson.horology.system')
    expect(document.readerSchemaVersion).toBe('0.14E')
    expect(document.sections.length).toBeGreaterThan(1)
    const alias = document.legacyAliases[0]
    expect(resolveAcademyReaderSection(document, alias.legacySegmentId)).toEqual({ sectionId: alias.sectionId, restoredFromLegacyAlias: true })
    expect(academyReaderDocumentVersionMatches(document, document.identity!.legacyDocumentVersion)).toBe(true)
  })
})

describe('0.14E · pilotos, claims y evidencia honesta', () => {
  it('11–14 · representa 16 pilotos y modifica exactamente sus apartados declarados', () => {
    expect(ACADEMY_PERSONAL_PILOT_REVIEWS).toHaveLength(16)
    expect(ACADEMY_PERSONAL_PILOT_REVIEWS.reduce((total, review) => total + academyPersonalPatchedSectionIds(review.lessonId).length, 0)).toBe(50)
    for (const review of ACADEMY_PERSONAL_PILOT_REVIEWS) {
      const document = readerDocument(review.lessonId)
      expect(document.centralQuestion).toBe(review.centralQuestion)
      for (const sectionId of academyPersonalPatchedSectionIds(review.lessonId)) {
        expect(document.sections.find((section) => section.sectionId === sectionId)?.curationMethod, sectionId).toBe('pilot-override')
      }
    }
  })

  it('15–17 · todos los sourceId de claims existen y los localizadores desconocidos no se inventan', () => {
    const sourceIds = new Set(corpus.packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id)))
    for (const review of ACADEMY_PERSONAL_CLAIM_REVIEWS) {
      expect(sourceIds.has(review.primarySourceId), review.primarySourceId).toBe(true)
      expect(review.supportingSourceIds.every((sourceId) => sourceIds.has(sourceId))).toBe(true)
      if (!['verified-primary', 'visually-verified'].includes(review.verificationStatus)) {
        expect([review.page, review.figure, review.table]).toEqual([null, null, null])
      }
    }
    expect(ACADEMY_PERSONAL_CLAIM_REVIEWS).toHaveLength(24)
  })

  it('18 · solo revisa cuatro fórmulas no OCR y deja las 17 OCR fuera de alcance', () => {
    expect(ACADEMY_PILOT_FORMULA_REVIEWS).toHaveLength(4)
    expect(ACADEMY_PILOT_FORMULA_REVIEWS.every(({ ocrDerived }) => !ocrDerived)).toBe(true)
    expect(ACADEMY_014E_BASELINE.ocrFormulaGaps014d).toBe(17)
  })

  it('19–21 · desmontaje 8215 es virtual, limitado y nunca produce P', () => {
    const document = readerDocument('lesson.miyota8215.guided-disassembly')
    const content = document.sections.map(({ markdown }) => markdown).join('\n')
    const activities = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, document.lessonId)!.activities
    expect(content).toContain('no se presenta como una secuencia oficial completa de desmontaje')
    expect(content).toMatch(/\*\*V\*\*.*nunca produce \*\*P\*\*/)
    expect(activities.every((activity) => activity.fixtureBinding?.kind === 'fixture')).toBe(true)
    expect(activities.every((activity) => activity.pedagogicalContract?.physicalBoundary.es.includes('No certifica destreza'))).toBe(true)
  })

  it('22–23 · la revisión personal no se inventa y queda obsoleta por hash', () => {
    const document = readerDocument('lesson.horology.system')
    const draft = createAcademyEditorialReviewDraft(document, now, '0.14E')
    expect(academyPersonalReviewStatus(document, draft)).toBe('not-reviewed')
    expect(academyPersonalReviewStatus({ ...document, contentHash: 'changed' }, draft)).toBe('stale-after-content-change')
  })
})

describe('0.14E · visuales, 3D y MIYOTA', () => {
  it('24–27 · cubre solo 2 critical y 7 high con diagramas específicos', () => {
    expect(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS).toHaveLength(9)
    expect(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.filter(({ priority }) => priority === 'critical')).toHaveLength(2)
    expect(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.filter(({ priority }) => priority === 'high')).toHaveLength(7)
    expect(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.every(({ result, data }) => result === 'implemented' && data.nodes.length > 3 && data.edges.length > 2)).toBe(true)
    expect(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.some((target) => !['critical', 'high'].includes(target.priority))).toBe(false)
  })

  it('28–29 · los 32 visuales y 9 estados 3D tienen una decisión', () => {
    expect(academyPersonalVisualReviews()).toHaveLength(32)
    expect(academyPersonalVisualReviews().filter(({ decision }) => decision === 'correct')).toHaveLength(3)
    expect(academyPersonalVisualReviews().filter(({ decision }) => decision === 'source-needed')).toHaveLength(1)
    expect(ACADEMY_PERSONAL_3D_REVIEWS).toHaveLength(9)
    expect(ACADEMY_PERSONAL_3D_REVIEWS.every(({ decision }) => Boolean(decision))).toBe(true)
  })

  it('30–32 · conceptual no es calibre y el despiece pierde explosiones procedurales', () => {
    const conceptual = academy3dVisualStateForPhase('reader.3d.mechanical-train.overview', '0.14E')!
    const rotor = academy3dVisualStateForPhase('reader.3d.miyota8215.rotor-checkpoint', '0.14E')!
    const bridge = academy3dVisualStateForPhase('reader.3d.miyota8215.barrel-bridge-checkpoint', '0.14E')!
    expect(conceptual.fidelity).toBe('conceptual')
    expect(conceptual.limitations.join(' ')).toContain('no representan medidas fabricables')
    expect(rotor.explosion).toEqual({})
    expect(bridge.explosion).toEqual({})
    expect(bridge.expectedObservation).toContain('no establece una secuencia oficial')
  })

  it('33–34 · MIYOTA tiene cinco roles permitidos y nunca es centro curricular', () => {
    expect(ACADEMY_MIYOTA_REFERENCE_ROLES).toEqual(['reference-caliber', 'worked-example', 'practical-laboratory', 'transfer-case', 'official-documentation-example'])
    expect(ACADEMY_MIYOTA_FORBIDDEN_ROLES).toContain('curriculum-center')
    expect(ACADEMY_PERSONAL_PILOT_REVIEWS.filter(({ lessonId }) => lessonId.includes('miyota'))).toHaveLength(3)
  })
})

describe('0.14E · salidas, UI y accesibilidad', () => {
  it('35 · las doce salidas son deterministas y coinciden con disco', async () => {
    const second = await buildAcademyPersonalCurationOutputs(repositoryRoot)
    expect([...second.entries()]).toEqual([...outputs.entries()])
    expect([...outputs.keys()]).toEqual([...ACADEMY_PERSONAL_CURATION_OUTPUT_FILES])
    for (const [fileName, content] of outputs) {
      expect(await readFile(join(repositoryRoot, 'docs/generated', fileName), 'utf8'), fileName).toBe(content)
    }
  }, 60_000)

  it('36–39 · UI personal sin IDs, roles externos, traducción nueva ni evidencia falsa', async () => {
    const reviewSurface = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyEditorialReviewSurface.tsx'), 'utf8')
    const usabilitySurface = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyUsabilityHarnessSurface.tsx'), 'utf8')
    const personalSource = await readFile(join(repositoryRoot, 'src/learning/academy/reader/academyPersonalCurriculum.ts'), 'utf8')
    expect(reviewSurface).not.toContain('<code>')
    expect(reviewSurface).not.toMatch(/Aprobar lección|relojero|especialista técnico|contentHash|Hash del apartado/i)
    expect(usabilitySurface).not.toMatch(/beginner|enthusiast|watchmaker|Tipo de participante|Principiante|Relojero/)
    expect(`${reviewSurface}\n${usabilitySurface}`).not.toMatch(/certificateId|emitCertificate|crear certificación|otorgar certificación/i)
    expect(personalSource).not.toMatch(/nameEn|titleEn|descriptionEn/)
  })

  it('40–43 · lector continuo sin 210 palabras ni continuaciones, con fallback y reduced motion', async () => {
    const surface = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    const reader = await readFile(join(repositoryRoot, 'src/learning/academy/reader/academyReaderDocument.ts'), 'utf8')
    const visual = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyReaderVisual.tsx'), 'utf8')
    expect(`${surface}\n${reader}`).not.toMatch(/210\s*(?:palabras|words)|continuación\s+\d/i)
    expect(surface).toContain("{ curationPhase: '0.14E' }")
    expect(academyReaderWebGlAvailable({ getContext: () => null } as unknown as Pick<HTMLCanvasElement, 'getContext'>)).toBe(false)
    expect(visual).toContain('reducedMotion')
    expect(visual).toContain('AcademyReaderStaticSceneSummary')
  })

  it('44–46 · teclado, foco y overflow conservan protecciones responsive', async () => {
    const library = await readFile(join(repositoryRoot, 'src/learning/ui/library/AcademyLibraryMenu.tsx'), 'utf8')
    const readerCss = await readFile(join(repositoryRoot, 'src/learning/ui/reader/academy-reader.css'), 'utf8')
    const reviewCss = await readFile(join(repositoryRoot, 'src/learning/ui/reader/academy-editorial-review.css'), 'utf8')
    expect(library).toContain("event.key === 'Escape'")
    expect(library).toContain("event.key !== 'Tab'")
    expect(`${readerCss}\n${reviewCss}`).toMatch(/minmax\(0|overflow-wrap|overflow-x/)
  })

  it('47–48 · no copia originales al runtime ni toca temporales', async () => {
    const personalSource = await readFile(join(repositoryRoot, 'src/learning/academy/reader/academyPersonalCurriculum.ts'), 'utf8')
    const generator = await readFile(join(repositoryRoot, 'scripts/academy-personal-curation.ts'), 'utf8')
    expect(`${personalSource}\n${generator}`).not.toMatch(/reference-library[\\/]originals|\.cache[\\/]reference-audit|(?:\.iso|\.pdf|\.zip)["']/i)
    expect(ACADEMY_014E_BASELINE.historicalReportCount).toBe(67)
  })
})
