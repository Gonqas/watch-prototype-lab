import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ACADEMY_LEARNER_PATH } from '../../src/learning/academy/path/academyLearnerPath'
import { createDefaultAcademyLocalState, normalizeAcademyLocalState } from '../../src/learning/academy/academyLocalState'
import {
  ACADEMY_PERSONAL_REVIEW_QUEUE_014H,
  ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_2_CATALOG,
  ACADEMY_STAGE_2_CLAIM_REVIEWS,
  ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT,
  ACADEMY_STAGE_2_FINAL_CHECKPOINT,
  ACADEMY_STAGE_2_FORMULA_REVIEWS,
  ACADEMY_STAGE_2_LESSON_CURATIONS,
  ACADEMY_STAGE_2_PERSONAL_PRACTICES,
  ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_2_VISUAL_DESIGNS,
  academyStage2ContentPreservation,
  academyStage2SectionId,
  academyStage2SourceSectionDispositions,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, resolveAcademyReaderSection, validateAcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderDocument'
import { academyEditorialReviewStatus, createAcademyEditorialReviewDraft } from '../../src/learning/academy/reader/academyReaderReview'
import type { AcademyReaderBuildInput } from '../../src/learning/academy/reader/academyReaderModel'
import type { LearningPack } from '../../src/learning/content/learningPack'
import { createLearningProductIndex, mergeLearningProductIndexes } from '../../src/learning/product/demoPackage'
import { AcademyReaderVisual } from '../../src/learning/ui/reader/AcademyReaderVisual'
import { ACADEMY_014H_BASELINE, ACADEMY_014H_OUTPUT_FILES, buildAcademy014HOutputs } from '../academy-014h'
import { loadAcademyCorpus } from './corpus'

const root = resolve(process.cwd())
const corpusPromise = loadAcademyCorpus(root)
const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')

const productAndPacksPromise = corpusPromise.then((corpus) => {
  const product = mergeLearningProductIndexes(corpus.packs.map(({ pack }) => createLearningProductIndex(pack)))
  return { corpus, product, packByLesson: new Map(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => [id, pack] as const))) }
})

function productAndPacks() {
  return productAndPacksPromise
}

async function buildDocuments(phase: '0.14D' | '0.14E' | '0.14F' | '0.14G' | '0.14H') {
  const { product, packByLesson } = await productAndPacks()
  return ACADEMY_STAGE_2_CATALOG.map(({ lessonId }) => {
    const descriptor = product.lessons.find(({ id }) => id === lessonId)!
    return buildAcademyReaderDocument({ material: materialFor(packByLesson.get(lessonId)!, lessonId, product), title: descriptor.title.es, purpose: descriptor.purpose.es, locale: 'es-ES', requiredActivityIds: descriptor.studyContract?.labActivityIds }, { curationPhase: phase })
  })
}

function materialFor(pack: LearningPack, lessonId: string, product: Awaited<typeof productAndPacksPromise>['product']): AcademyReaderBuildInput['material'] {
  const lesson = pack.lessons.find(({ id }) => id === lessonId)!
  const descriptor = product.lessons.find(({ id }) => id === lessonId)!
  const blocks = pack.blocks.filter(({ id }) => lesson.blockIds.includes(id))
  const sourceIds = new Set([...(lesson.authoring?.sourceIds ?? []), ...blocks.flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id)))])
  return { packageId: pack.manifest.id, packageVersion: pack.manifest.packageVersion, pack, lesson, blocks, activities: descriptor.activityIds.flatMap((id) => product.activities.filter((activity) => activity.id === id)), sources: pack.sources.filter(({ id }) => sourceIds.has(id)), glossary: [] }
}

const documentsByPhase = new Map<'0.14D' | '0.14E' | '0.14F' | '0.14G' | '0.14H', ReturnType<typeof buildDocuments>>()

function documents(phase: '0.14D' | '0.14E' | '0.14F' | '0.14G' | '0.14H' = '0.14H') {
  const cached = documentsByPhase.get(phase) ?? buildDocuments(phase)
  documentsByPhase.set(phase, cached)
  return cached
}

async function walk(path: string): Promise<string[]> {
  const result: string[] = []
  for (const name of (await readdir(path)).sort()) {
    const item = join(path, name)
    if ((await stat(item)).isDirectory()) result.push(...await walk(item))
    else result.push(item)
  }
  return result
}

async function snapshot(path: string) {
  const files = await walk(path)
  const rows = await Promise.all(files.map(async (file) => `${relative(path, file).replaceAll('\\', '/')}:${sha256(await readFile(file))}`))
  return { count: files.length, digest: sha256(rows.join('\n')) }
}

describe('0.14H · integridad (pruebas 1–10)', () => {
  it('conserva paquetes, rutas, módulos, lecciones, actividades y digest', async () => {
    const { corpus } = await productAndPacks()
    expect(corpus.counts).toMatchObject(ACADEMY_014H_BASELINE.corpusCounts)
    expect(corpus.digest).toBe(ACADEMY_014H_BASELINE.corpusDigest)
  })

  it('conserva learning-content y originales byte por byte', async () => {
    expect(await snapshot(join(root, 'learning-content'))).toEqual(ACADEMY_014H_BASELINE.protected.learningContent)
    expect(await snapshot(join(root, 'reference-library', 'originals'))).toEqual(ACADEMY_014H_BASELINE.protected.originals)
  }, 30_000)

  it('conserva todos los informes A–G byte por byte', async () => {
    const generated = join(root, 'docs', 'generated')
    const names = (await readdir(generated)).filter((name) => !name.startsWith('APRENDER-') && !/0\.14[H-Z]/i.test(name)).sort()
    const rows = await Promise.all(names.map(async (name) => `${name}:${sha256(await readFile(join(generated, name)))}`))
    expect({ count: names.length, digest: sha256(rows.join('\n')) }).toEqual(ACADEMY_014H_BASELINE.historicalReports)
  })

  it('no copia binarios originales al runtime', async () => {
    const originals = await walk(join(root, 'reference-library', 'originals'))
    const originalHashes = new Set(await Promise.all(originals.map(async (file) => sha256(await readFile(file)))))
    const runtimeFiles = [...await walk(join(root, 'src')), ...await walk(join(root, 'public'))]
    const duplicates = []
    for (const file of runtimeFiles) if (originalHashes.has(sha256(await readFile(file)))) duplicates.push(file)
    expect(duplicates).toEqual([])
  }, 30_000)
})

describe('0.14H · versionado y compatibilidad (pruebas 11–23)', () => {
  it.each(['0.14E', '0.14F', '0.14G', '0.14H'] as const)('construye explícitamente %s', async (phase) => {
    const built = await documents(phase)
    expect(built).toHaveLength(25)
    expect(built.every(({ readerSchemaVersion }) => readerSchemaVersion === phase)).toBe(true)
  })

  it('la UI usa la fase activa y el constructor no contiene comparaciones manuales de fase', async () => {
    const surface = await readFile(join(root, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    const builder = await readFile(join(root, 'src/learning/academy/reader/academyReaderDocument.ts'), 'utf8')
    expect(surface).toContain('CURRENT_ACADEMY_CURATION_PHASE')
    expect(builder).not.toMatch(/curationPhase\s*===\s*['"]0\.14[EFGH]/)
  })

  it('preserva aliases históricos y hace stale una revisión anterior por hash', async () => {
    const [oldDocument] = await documents('0.14G')
    const [currentDocument] = await documents('0.14H')
    const legacyId = oldDocument.sections[0].sectionId
    expect(resolveAcademyReaderSection(currentDocument, legacyId)).toEqual({ sectionId: legacyId, restoredFromLegacyAlias: false })
    const oldHOrientation = 'reader.section.block.mechanical.energy.014h-orientacion'
    expect(resolveAcademyReaderSection(currentDocument, oldHOrientation).sectionId).toBe(academyStage2SectionId.orientation('lesson.mechanical.energy'))
    const oldReview = createAcademyEditorialReviewDraft(oldDocument, '2026-08-14T00:00:00.000Z', '0.14G')
    expect(academyEditorialReviewStatus(currentDocument, oldReview)).toBe('stale-after-content-change')
  })

  it('normaliza estados históricos sin borrar notas, marcadores o posición', () => {
    const base = createDefaultAcademyLocalState('profile.test', '2026-08-14')
    const value = normalizeAcademyLocalState('profile.test', { ...base, notes: [{ id: 'note.old', title: 'Nota', body: 'Contexto', tags: [], context: { lessonId: 'lesson.mechanical.energy', sectionId: 'legacy.section' }, createdAt: '2026-08-14', updatedAt: '2026-08-14' }], bookmarks: [{ id: 'bookmark.old', title: 'Marca', href: '#/learning/lesson?lesson=lesson.mechanical.energy', context: { lessonId: 'lesson.mechanical.energy', sectionId: 'legacy.section' }, createdAt: '2026-08-14' }], lessonProgress: [{ lessonId: 'lesson.mechanical.energy', currentSegmentId: 'legacy.section', completedSegmentIds: [], activeSectionId: 'legacy.section', scrollAnchor: 'legacy.section', scrollOffset: 9, documentVersion: 'old', visitedSectionIds: ['legacy.section'], updatedAt: '2026-08-14' }] }, '2026-08-14')
    expect(value?.notes[0]?.body).toBe('Contexto')
    expect(value?.bookmarks[0]?.context.sectionId).toBe('legacy.section')
    expect(value.lessonProgress[0]?.scrollOffset).toBe(9)
  })
})

describe('0.14H · mapa de etapa 2 (pruebas 24–34)', () => {
  it('define seis capítulos, 17 anclas, cinco apoyos y tres ramas', () => {
    expect(new Set(ACADEMY_STAGE_2_CATALOG.map(({ chapterId }) => chapterId))).toHaveLength(6)
    expect(ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'anchor')).toHaveLength(17)
    expect(ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'support')).toHaveLength(5)
    expect(ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'optional-branch')).toHaveLength(3)
  })

  it('cada ancla conserva exactamente su práctica requerida real', async () => {
    const { product } = await productAndPacks()
    for (const item of ACADEMY_STAGE_2_CATALOG.filter(({ pathRole }) => pathRole === 'anchor')) {
      expect(item.requiredActivityId).toBeTruthy()
      expect(product.lessons.find(({ id }) => id === item.lessonId)?.activityIds).toContain(item.requiredActivityId)
    }
  })

  it('apoyos, calendarios avanzados, cronógrafo y comparación de escapes no bloquean', () => {
    const optional = ['lesson.advanced.calendars', 'lesson.advanced.chronograph-control', 'lesson.advanced.escapement-compare']
    for (const item of ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES.filter(({ pathRole }) => pathRole !== 'anchor')) expect(item.blocking).toBe(false)
    for (const id of optional) expect(ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES.find(({ lessonId }) => lessonId === id)?.blocking).toBe(false)
  })

  it('encadena etapa 1→2→3, introduce matemáticas justo a tiempo y no exige MIYOTA', () => {
    const first2 = ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === 'chapter.2.1')!
    const first3 = ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === 'chapter.3.1')!
    expect(first2.prerequisiteChapterIds).toContain('chapter.1.3')
    expect(first3.prerequisiteChapterIds).toContain('chapter.2.6')
    expect(ACADEMY_STAGE_2_CATALOG.find(({ lessonId }) => lessonId.includes('fuerza-par-energia'))?.chapterId).toBe('stage-2.1')
    expect(ACADEMY_STAGE_2_CATALOG.find(({ lessonId }) => lessonId.includes('toh-contar-tren'))?.chapterId).toBe('stage-2.2')
    expect(JSON.stringify(ACADEMY_STAGE_2_PREREQUISITE_OVERRIDES)).not.toContain('miyota')
  })
})

describe('0.14H · contenido mecánico (pruebas 35–50)', () => {
  it('mantiene las distinciones mecánicas esenciales', async () => {
    const text = (await documents()).flatMap(({ sections }) => sections.map(({ markdown }) => markdown)).join('\n').toLowerCase()
    for (const word of ['energía', 'par', 'potencia', 'velocidad', 'rueda', 'piñón', 'árbol', 'eje', 'pivote', 'móvil', 'solidario', 'barrilete', 'escape', 'oscilador', 'periodo', 'frecuencia', 'amplitud', 'minutería', 'tija', 'calendario', 'reserva']) expect(text).toContain(word)
    expect(text).toContain('invierten el sentido')
    expect(text).toContain('relación total')
    expect(text).toContain('bloqueo, desbloqueo, impulso y caída')
    expect(text).toContain('frecuencia y amplitud')
    expect(text).toContain('cuerda o puesta en hora')
    expect(text).toContain('no universalizar sentidos de carga')
    expect(text).not.toContain('zona de corrección universal')
  })

  it('representa el escape como interfaz y el oscilador como bucle, no como final lineal', async () => {
    const byId = new Map((await documents()).map((document) => [document.lessonId, document]))
    const escape = byId.get('lesson.mechanical.escapement')!.sections.map(({ markdown }) => markdown).join(' ')
    const loop = byId.get('lesson.mechanical.escape-oscillator')!.sections.map(({ markdown }) => markdown).join(' ')
    expect(escape).toMatch(/entrega|transfiere/)
    expect(escape).not.toMatch(/solo (un )?freno/i)
    expect(loop).toMatch(/dos direcciones|bucle|liberación/)
  })

  it('no eleva fórmulas OCR sin verificación visual', () => {
    expect(ACADEMY_STAGE_2_FORMULA_REVIEWS.filter(({ sourceId }) => sourceId.includes('daniels')).every(({ decision, expression }) => decision === 'not-used' && expression === 'no publicada')).toBe(true)
    expect(ACADEMY_STAGE_2_CLAIM_REVIEWS.every(({ locators }) => locators.every(({ verificationMethod }) => verificationMethod === 'visual-pdf-inspection'))).toBe(true)
  })
})

describe('0.14H · visuales (pruebas 51–62)', () => {
  it('cubre quince preguntas esenciales sin duplicar IDs', () => {
    expect(ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT).toBe(15)
    expect(new Set(ACADEMY_STAGE_2_VISUAL_DESIGNS.map(({ visualDesignId }) => visualDesignId)).size).toBe(ACADEMY_STAGE_2_VISUAL_DESIGNS.length)
  })

  it('cada visual tiene pregunta, payload específico, límites, alternativa, color y movimiento seguro', () => {
    for (const visual of ACADEMY_STAGE_2_VISUAL_DESIGNS) {
      expect(visual.pedagogicalQuestion).toMatch(/\?$/)
      expect(visual.semanticPayload.nodes.length).toBeGreaterThanOrEqual(2)
      expect(visual.semanticPayload.edges.length).toBeGreaterThanOrEqual(1)
      expect(visual.limitations.length).toBeGreaterThan(0)
      expect(visual.longDescription.length).toBeGreaterThan(40)
      expect(visual.colorIndependent).toBe(true)
      expect(visual.reducedMotionSafe).toBe(true)
      expect(visual.fidelity).toBe('conceptual')
      expect(visual.limitations.join(' ')).not.toMatch(/escala real|calibre específico/i)
    }
  })

  it('el modo de lectura conserva visuales esenciales como SVG semántico', async () => {
    const current = (await documents()).flatMap(({ sectionCurations = [] }) => sectionCurations).find(({ visualKind }) => visualKind === 'diagram')!
    expect(current.readingModePolicy).toBe('inline-essential')
    const markup = renderToStaticMarkup(<AcademyReaderVisual cue={{ ...((await documents())[0].sections.find(({ visualCue }) => visualCue.kind === 'diagram')?.visualCue ?? (await documents())[1].sections.find(({ visualCue }) => visualCue.kind === 'diagram')!.visualCue) }} mode="read" />)
    expect(markup).toContain('<svg')
  })
})

describe('0.14H · actividades y prácticas (pruebas 63–71)', () => {
  it('conserva los 17 activityId y su significado corpus', async () => {
    const { product } = await productAndPacks()
    expect(ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS).toHaveLength(17)
    for (const overlay of ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS) {
      expect(product.activities.some(({ id }) => id === overlay.activityId)).toBe(true)
      expect(overlay.evidenceProfile.modalities).toEqual(['K', 'V', 'R'])
      expect(overlay.evidenceProfile.physicalExecutionRequired).toBe(false)
      expect(overlay.evidenceProfile.physicalCompetenceClaim).toBe(false)
    }
  })

  it('mantiene las prácticas personales fuera del corpus y sin efectos curriculares', async () => {
    const { product } = await productAndPacks()
    expect(ACADEMY_STAGE_2_PERSONAL_PRACTICES).toHaveLength(13)
    for (const practice of ACADEMY_STAGE_2_PERSONAL_PRACTICES) {
      expect(product.activities.some(({ id }) => id === practice.personalPracticeId)).toBe(false)
      expect(practice.affectsProgress).toBe(false)
      expect(practice.createsMastery).toBe(false)
      expect(practice.completesLesson).toBe(false)
      expect(practice.inexpensiveMaterials.join(' ')).not.toMatch(/movimiento|reloj valioso/i)
    }
    const all = JSON.stringify(ACADEMY_STAGE_2_PERSONAL_PRACTICES).toLowerCase()
    expect(all).toContain('no abras')
    expect(all).toContain('no toques escape, áncora, volante ni espiral')
  })
})

describe('0.14H · addendum de preservación y trazabilidad (pruebas 72–95)', () => {
  it('representa las 25 lecciones y decide el destino de toda sección authored', async () => {
    const source = await documents('0.14D')
    const current = await documents('0.14H')
    expect(source).toHaveLength(25)
    expect(current).toHaveLength(25)
    for (const sourceDocument of source) {
      const dispositions = academyStage2SourceSectionDispositions(sourceDocument.lessonId, sourceDocument.sections)
      expect(dispositions).toHaveLength(sourceDocument.sections.length)
      expect(new Set(dispositions.map(({ sourceSectionId }) => sourceSectionId))).toEqual(new Set(sourceDocument.sections.map(({ sectionId }) => sectionId)))
      expect(dispositions.every(({ action, targetSectionIds }) => action === 'retained' && targetSectionIds.length === 1)).toBe(true)
    }
  })

  it('conserva el 100 % de teoría sustantiva sin límite artificial de palabras', async () => {
    const sourceById = new Map((await documents('0.14D')).map((document) => [document.lessonId, document]))
    const current = await documents('0.14H')
    for (const document of current) {
      const source = sourceById.get(document.lessonId)!
      const { row } = academyStage2ContentPreservation(document.lessonId, source.sections, document.sections)
      expect(row.substantiveCoverage).toBe(1)
      expect(row.retainedSourceWords).toBe(row.sourceSubstantiveWords)
      expect(row.removedWords).toBe(0)
      expect(new Set(document.sections.filter(({ sectionId }) => source.sections.some((item) => item.sectionId === sectionId)).map(({ sectionId }) => sectionId))).toEqual(new Set(source.sections.map(({ sectionId }) => sectionId)))
    }
    expect(Math.max(...current.flatMap(({ sections }) => sections.map(({ wordCount }) => wordCount)))).toBeGreaterThan(210)
  })

  it('usa estructuras variables y orientación humana explícita', () => {
    const structures = ACADEMY_STAGE_2_LESSON_CURATIONS.map(({ sections }) => sections.map(({ role }) => role).join('>'))
    expect(new Set(structures).size).toBeGreaterThanOrEqual(6)
    for (const curation of ACADEMY_STAGE_2_LESSON_CURATIONS) {
      expect(curation.compositionMode).toBe('augment')
      expect(curation.whyNow).not.toMatch(/stage-|phase|block\.|lesson\.|activity\.|reader\.|014h/i)
      expect(curation.whyNow.length).toBeGreaterThan(70)
    }
  })

  it('elimina la instrucción visual y el checkpoint universales', () => {
    const markdown = ACADEMY_STAGE_2_LESSON_CURATIONS.flatMap(({ sections }) => sections.map(({ markdown }) => markdown))
    expect(markdown).not.toContain('Sigue las flechas, identifica las interfaces y explica qué cambia entre estados.')
    expect(markdown).not.toContain('Explica con tus palabras la relación central, cambia una condición del modelo y predice el resultado.')
    expect(new Set(ACADEMY_STAGE_2_LESSON_CURATIONS.map(({ checkpointPrompt }) => checkpointPrompt))).toHaveLength(25)
  })

  it('no filtra identificadores internos al texto visible añadido', () => {
    const forbidden = /(?:stage-|\bphase\b|\bblock\.|\blesson\.|\bactivity\.|\breader\.|014h)/i
    for (const curation of ACADEMY_STAGE_2_LESSON_CURATIONS) {
      expect([curation.whyNow, ...curation.sections.map(({ title, markdown }) => `${title}\n${markdown}`)].join('\n')).not.toMatch(forbidden)
    }
  })

  it('preserva glosario, conceptos, claims authored y sourceBlockIds', async () => {
    const sourceById = new Map((await documents('0.14D')).map((document) => [document.lessonId, document]))
    for (const document of await documents('0.14H')) {
      const source = sourceById.get(document.lessonId)!
      for (const original of source.sections) {
        const retained = document.sections.find(({ sectionId }) => sectionId === original.sectionId)!
        expect(retained.glossaryTermIds).toEqual(original.glossaryTermIds)
        expect(retained.conceptIds).toEqual(original.conceptIds)
        expect(retained.claimIds).toEqual(original.claimIds)
        expect(retained.sourceBlockIds).toEqual(original.sourceBlockIds)
      }
    }
  })

  it('resuelve todos los enlaces de claims reales y deja vacías las lecciones pendientes', async () => {
    const current = new Map((await documents('0.14H')).map((document) => [document.lessonId, document]))
    const registered = new Map(ACADEMY_STAGE_2_CLAIM_REVIEWS.map((claim) => [claim.claimId, claim]))
    expect(registered).toHaveLength(15)
    for (const curation of ACADEMY_STAGE_2_LESSON_CURATIONS) {
      for (const claimId of curation.sourceClaimIds) {
        const claim = registered.get(claimId)
        expect(claim?.lessonId).toBe(curation.lessonId)
        expect(current.get(curation.lessonId)?.sections.some(({ sectionId }) => sectionId === claim?.sectionId)).toBe(true)
      }
      if (curation.sourceClaimIds.length === 0) expect(['source-reviewed', 'source-limited', 'source-needed']).toContain(curation.technicalStatus)
    }
    expect(new Set(ACADEMY_STAGE_2_LESSON_CURATIONS.flatMap(({ sourceClaimIds }) => sourceClaimIds))).toEqual(new Set(ACADEMY_STAGE_2_CLAIM_REVIEWS.map(({ claimId }) => claimId)))
  })

  it('une los 22 visuales a apartados sustantivos sin cambiar sus hashes', async () => {
    const current = new Map((await documents('0.14H')).map((document) => [document.lessonId, document]))
    expect(ACADEMY_STAGE_2_VISUAL_DESIGNS).toHaveLength(22)
    for (const visual of ACADEMY_STAGE_2_VISUAL_DESIGNS) {
      for (const sectionId of visual.sectionIds) {
        const lessonId = visual.lessonIds.find((id) => current.get(id)?.sections.some((section) => section.sectionId === sectionId))
        const section = lessonId ? current.get(lessonId)?.sections.find((item) => item.sectionId === sectionId) : undefined
        expect(section?.wordCount).toBeGreaterThan(10)
        expect(section?.visualCue.visualDesignId).toBe(visual.visualDesignId)
      }
      expect(visual.contentHash).toMatch(/^fnv1a64:[a-f0-9]{16}$/)
      expect(visual.visualHash).toMatch(/^fnv1a64:[a-f0-9]{16}$/)
    }
    expect(new Set(ACADEMY_STAGE_2_VISUAL_DESIGNS.map(({ visualDesignId }) => visualDesignId))).toHaveLength(22)
  })

  it('mapea explícitamente los nueve anchors de la presentación H anterior', async () => {
    const suffixes = ['orientacion', 'vocabulario', 'modelo-causal', 'visual', 'ejemplo', 'errores', 'comprobacion', 'conexion', 'fuentes-limites']
    for (const document of await documents('0.14H')) {
      const block = document.lessonId.replace('lesson.', 'block.')
      for (const suffix of suffixes) {
        const resolved = resolveAcademyReaderSection(document, `reader.section.${block}.014h-${suffix}`)
        expect(document.sections.some(({ sectionId }) => sectionId === resolved.sectionId)).toBe(true)
        if (!document.sections.some(({ sectionId }) => sectionId === `reader.section.${block}.014h-${suffix}`)) {
          expect(resolved.restoredFromLegacyAlias).toBe(true)
          expect(document.legacyAliases.find(({ legacySegmentId }) => legacySegmentId === `reader.section.${block}.014h-${suffix}`)?.reason).toBeTruthy()
        }
      }
    }
  })
})

describe('0.14H · UX, determinismo y cierre (pruebas 72–87)', () => {
  it('preserva deep links, aliases y documentos sin incidencias', async () => {
    for (const document of await documents()) {
      expect(validateAcademyReaderDocument(document)).toEqual([])
      const alias = document.legacyAliases[0]
      if (alias) expect(resolveAcademyReaderSection(document, alias.legacySegmentId).sectionId).toBeTruthy()
    }
  })

  it('mantiene scrollspy, foco visible, reflujo y control de overflow', async () => {
    const surface = await readFile(join(root, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    const css = await readFile(join(root, 'src/learning/ui/reader/academy-reader.css'), 'utf8')
    expect(surface).toContain('IntersectionObserver')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('@media (max-width: 480px)')
    expect(css).toContain('overflow-wrap: anywhere')
    expect(css).toContain('max-width: 100%')
  })

  it('muestra cada pregunta central una sola vez y evita jerga, fragmentos de 210 palabras y continuación', async () => {
    for (const document of await documents()) {
      const sectionText = document.sections.map(({ markdown }) => markdown).join('\n')
      expect(sectionText.split(document.centralQuestion ?? 'impossible').length - 1).toBe(0)
      expect(sectionText).not.toMatch(/source-limited|payload|fixture|contentHash|0\.14H/i)
      expect(document.sections.every(({ wordCount }) => wordCount !== 210)).toBe(true)
      const addedTitles = ACADEMY_STAGE_2_LESSON_CURATIONS.find(({ lessonId }) => lessonId === document.lessonId)!.sections.map(({ title }) => title)
      expect(addedTitles.every((title) => !/continuaci[oó]n/i.test(title))).toBe(true)
    }
  })

  it('cierra con once preguntas, siete acciones y una cola deduplicada sin revisión ficticia', () => {
    expect(ACADEMY_STAGE_2_FINAL_CHECKPOINT.questions).toHaveLength(11)
    expect(ACADEMY_STAGE_2_FINAL_CHECKPOINT.actions).toHaveLength(7)
    expect(ACADEMY_STAGE_2_FINAL_CHECKPOINT.blocking).toBe(false)
    expect(new Set(ACADEMY_PERSONAL_REVIEW_QUEUE_014H.map(({ lessonId }) => lessonId)).size).toBe(ACADEMY_PERSONAL_REVIEW_QUEUE_014H.length)
    expect(ACADEMY_PERSONAL_REVIEW_QUEUE_014H.every(({ personalStatus }) => personalStatus === 'not-reviewed')).toBe(true)
  })

  it('genera exactamente 26 informes deterministas', async () => {
    const first = await buildAcademy014HOutputs(root)
    const second = await buildAcademy014HOutputs(root)
    expect([...first.keys()]).toEqual([...ACADEMY_014H_OUTPUT_FILES])
    expect(first).toEqual(second)
  }, 30_000)
})
