import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import { effectiveLessonPrerequisiteConceptIds } from '../../src/learning/academy/path/academyPathPrerequisites'
import {
  ACADEMY_PERSONAL_REVIEW_QUEUE_014G,
  ACADEMY_STAGE_0_TO_1_CHECKPOINT,
  ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS,
  ACADEMY_STAGE_1_CLAIM_REVIEWS,
  ACADEMY_STAGE_1_LESSON_CURATIONS,
  ACADEMY_STAGE_1_LESSON_IDS,
  ACADEMY_STAGE_1_PERSONAL_PRACTICES,
  ACADEMY_STAGE_1_PREREQUISITE_OVERRIDES,
  ACADEMY_STAGE_1_VISUAL_DESIGNS,
  CURRENT_ACADEMY_CURATION_PHASE,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument, resolveAcademyReaderSection, validateAcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderDocument'
import type { AcademyReaderCurationPhase } from '../../src/learning/academy/reader/academyReaderModel'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'
import { AcademySafeMarkdown } from '../../src/learning/ui/reader/AcademySafeMarkdown'
import { AcademySpecificDiagram } from '../../src/learning/ui/reader/AcademySpecificDiagram'
import { ACADEMY_014G_BASELINE, ACADEMY_014G_OUTPUT_FILES, buildAcademy014GOutputs } from '../academy-014g'
import { loadAcademyCorpus, type AcademyCorpus } from './corpus'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const sha256 = (value: Buffer | string) => createHash('sha256').update(value).digest('hex')

function readerDocument(lessonId: string, phase: AcademyReaderCurationPhase) {
  const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
  const descriptor = INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.find(({ id }) => id === lessonId)!
  return buildAcademyReaderDocument({ material, title: descriptor.title.es, purpose: descriptor.purpose.es, locale: 'es-ES', requiredActivityIds: descriptor.studyContract?.labActivityIds }, { curationPhase: phase })
}

let corpus: AcademyCorpus
let outputs: Awaited<ReturnType<typeof buildAcademy014GOutputs>>

beforeAll(async () => {
  corpus = await loadAcademyCorpus(repositoryRoot)
  outputs = await buildAcademy014GOutputs(repositoryRoot)
}, 60_000)

describe('0.14G · corpus, historial y versionado', () => {
  it('conserva los ocho paquetes y todos los IDs del corpus', () => {
    expect(corpus.counts).toMatchObject({ packages: 8, routes: 24, modules: 217, lessons: 222, activities: 289 })
    expect(corpus.digest).toBe(ACADEMY_014G_BASELINE.corpusDigest)
    const lessonIds = new Set(corpus.packs.flatMap(({ pack }) => pack.lessons.map(({ id }) => id)))
    const activityIds = new Set(corpus.packs.flatMap(({ pack }) => pack.activities.map(({ id }) => id)))
    expect(ACADEMY_STAGE_1_LESSON_IDS.every((id) => lessonIds.has(id))).toBe(true)
    expect(ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS.every(({ activityId }) => activityIds.has(activityId))).toBe(true)
  })

  it('mantiene 0.14F reproducible y añade aliases explícitos a 0.14G', () => {
    expect(CURRENT_ACADEMY_CURATION_PHASE).toBe('0.14G')
    for (const lessonId of ACADEMY_STAGE_1_LESSON_IDS) {
      const previous = readerDocument(lessonId, '0.14F')
      const current = readerDocument(lessonId, '0.14G')
      expect(previous.readerSchemaVersion).toBe('0.14F')
      expect(current.readerSchemaVersion).toBe('0.14G')
      expect(current.contentHash).not.toBe(previous.contentHash)
      expect(validateAcademyReaderDocument(current)).toEqual([])
      const restored = resolveAcademyReaderSection(current, previous.sections[0].sectionId)
      expect(restored.restoredFromLegacyAlias).toBe(true)
      expect(current.sections.some(({ sectionId }) => sectionId === restored.sectionId)).toBe(true)
    }
  })

  it('conserva byte a byte los 95 informes 0.14A–0.14F', async () => {
    const root = join(repositoryRoot, 'docs', 'generated')
    const names = (await readdir(root)).filter((name) => !name.startsWith('APRENDER-') && !name.includes('0.14G')).sort()
    const rows = await Promise.all(names.map(async (name) => `${name}:${sha256(await readFile(join(root, name)))}`))
    expect(names).toHaveLength(ACADEMY_014G_BASELINE.historicalReportsCount)
    expect(sha256(rows.join('\n'))).toBe(ACADEMY_014G_BASELINE.historicalReportsDigest)
  })
})

describe('0.14G · etapa 1 curada', () => {
  it('representa exactamente ocho lecciones con roles curriculares explícitos', () => {
    expect(ACADEMY_STAGE_1_LESSON_CURATIONS).toHaveLength(8)
    expect(ACADEMY_STAGE_1_LESSON_CURATIONS.filter(({ pathRole }) => pathRole === 'anchor')).toHaveLength(4)
    expect(ACADEMY_STAGE_1_LESSON_CURATIONS.filter(({ pathRole }) => pathRole === 'support')).toHaveLength(2)
    expect(ACADEMY_STAGE_1_LESSON_CURATIONS.filter(({ pathRole }) => pathRole === 'optional-branch')).toHaveLength(1)
    expect(ACADEMY_STAGE_1_LESSON_CURATIONS.filter(({ pathRole }) => pathRole === 'reference')).toHaveLength(1)
    expect(ACADEMY_STAGE_1_LESSON_CURATIONS.every(({ sections }) => sections.length === 8)).toBe(true)
  })

  it('no muestra jerga interna, apartados vacíos ni preguntas centrales duplicadas', () => {
    const prohibited = /\b(?:sourceId|blockId|payload|fixture|runtime|curation|scaffold)\b|G\/K\/P/i
    for (const lessonId of ACADEMY_STAGE_1_LESSON_IDS) {
      const document = readerDocument(lessonId, '0.14G')
      const markup = renderToStaticMarkup(<main><h1>{document.centralQuestion}</h1>{document.sections.map((section) => <AcademySafeMarkdown key={section.sectionId} markdown={section.markdown} />)}</main>)
      expect(markup.split(document.centralQuestion!).length - 1, lessonId).toBe(1)
      expect(document.sections.every(({ title, markdown }) => title.trim() && markdown.trim() && !/continuación/i.test(title))).toBe(true)
      expect(document.sections.map(({ markdown }) => markdown).join('\n')).not.toMatch(prohibited)
    }
  })

  it('hace cuarzo no bloqueante y corrige los prerrequisitos semánticos conocidos', () => {
    const quartz = ACADEMY_STAGE_1_PREREQUISITE_OVERRIDES.find(({ lessonId }) => lessonId === 'lesson.horology.quartz-chain')!
    expect(quartz).toMatchObject({ pathRole: 'support', blocking: false })
    expect(effectiveLessonPrerequisiteConceptIds('lesson.horology.functional-equivalence', ['concept.horology.quartz-chain', 'concept.horology.mechanical-chain'])).toEqual(['concept.horology.mechanical-chain'])
    expect(effectiveLessonPrerequisiteConceptIds('lesson.encyclopedia.history-language.leer-documentacion', ['advanced.quartz.1', 'advanced.quartz.2'])).toEqual(['concept.horology.functional-chain'])
    expect(effectiveLessonPrerequisiteConceptIds('lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', ['later.1'])).toEqual(['concept.horology.functional-chain'])
  })

  it('mantiene el checkpoint recomendado fuera del progreso', () => {
    expect(ACADEMY_STAGE_0_TO_1_CHECKPOINT).toMatchObject({ blocking: false, affectsProgress: false, status: 'recommended-non-blocking' })
    expect(ACADEMY_STAGE_0_TO_1_CHECKPOINT.questions).toHaveLength(3)
    expect(ACADEMY_STAGE_0_TO_1_CHECKPOINT.actions.map(({ actionId }) => actionId)).toEqual(['review-stage0', 'continue-stage1', 'record-question'])
  })
})

describe('0.14G · visuales, actividades, prácticas y claims', () => {
  it('implementa exactamente seis visuales únicos y accesibles', () => {
    expect(ACADEMY_STAGE_1_VISUAL_DESIGNS).toHaveLength(6)
    expect(new Set(ACADEMY_STAGE_1_VISUAL_DESIGNS.map(({ visualDesignId }) => visualDesignId)).size).toBe(6)
    expect(ACADEMY_STAGE_1_VISUAL_DESIGNS.map(({ visualDesignId }) => visualDesignId)).toEqual([
      'visual.stage1.watch-system.v1',
      'visual.stage1.mechanical-feedback.v1',
      'visual.stage1.quartz-functional.v1',
      'visual.stage1.functional-equivalence.v1',
      'visual.stage1.document-authority.v1',
      'visual.stage1.claim-trace.v1',
    ])
    expect(ACADEMY_STAGE_1_VISUAL_DESIGNS.every(({ semanticPayload, longDescription, colorIndependent, reducedMotionSafe }) => semanticPayload.nodes.length >= 5 && semanticPayload.edges.length >= 4 && longDescription && colorIndependent && reducedMotionSafe)).toBe(true)
    const feedback = ACADEMY_STAGE_1_VISUAL_DESIGNS.find(({ visualDesignId }) => visualDesignId === 'visual.stage1.mechanical-feedback.v1')!
    expect(feedback.semanticPayload.edges.some(({ from, to, kind }) => from === 'oscillator' && to === 'escapement' && kind === 'timing')).toBe(true)
    const equivalence = ACADEMY_STAGE_1_VISUAL_DESIGNS.find(({ visualDesignId }) => visualDesignId === 'visual.stage1.functional-equivalence.v1')!
    expect(equivalence.semanticPayload.nodes.some(({ label }) => label === 'Sin equivalente directo')).toBe(true)
    expect(new Set(equivalence.semanticPayload.nodes.map(({ lane }) => lane))).toEqual(new Set(['energía', 'referencia', 'control']))
    const documents = ACADEMY_STAGE_1_VISUAL_DESIGNS.find(({ visualDesignId }) => visualDesignId === 'visual.stage1.document-authority.v1')!
    expect(documents.semanticPayload.nodes.map(({ label }) => label)).toEqual(expect.arrayContaining(['Sí: dato declarado', 'No: orden de servicio', 'No: criterio de servicio']))
    const trace = ACADEMY_STAGE_1_VISUAL_DESIGNS.find(({ visualDesignId }) => visualDesignId === 'visual.stage1.claim-trace.v1')!
    expect(trace.semanticPayload.nodes.map(({ label }) => label)).toEqual(expect.arrayContaining(['Afirmación', 'Fuente', 'Localizador', 'Revisión aplicable', 'Alcance', 'Limitación']))
  })

  it('renderiza diagramas con nodos en carriles y nodos sin carril sin perder coordenadas', () => {
    const document = readerDocument('lesson.horology.functional-equivalence', '0.14G')
    const cue = document.visualCues.find(({ visualDesignId }) => visualDesignId === 'visual.stage1.functional-equivalence.v1')!
    expect(() => renderToStaticMarkup(<AcademySpecificDiagram cue={cue} />)).not.toThrow()
    const markup = renderToStaticMarkup(<AcademySpecificDiagram cue={cue} />)
    expect(markup).toContain('Sin equivalente')
    expect(markup).toContain('directo')
  })

  it('conserva actividades y nunca recomienda P para interacción virtual', () => {
    expect(ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS).toHaveLength(10)
    expect(ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS.every(({ evidenceProfile }) => !evidenceProfile.modalities.includes('P') && !evidenceProfile.physicalExecutionRequired && !evidenceProfile.physicalCompetenceClaim)).toBe(true)
    expect(ACADEMY_STAGE_1_ACTIVITY_PRESENTATIONS.map(({ activityId }) => activityId)).toEqual(expect.arrayContaining([
      'activity.horology.classify-subsystems', 'activity.horology.order-mechanical-chain', 'activity.horology.match-functional-equivalents', 'activity.encyclopedia.history-language.leer-documentacion',
    ]))
  })

  it('añade cinco prácticas personales sin tocar las 289 actividades ni mastery', () => {
    expect(ACADEMY_STAGE_1_PERSONAL_PRACTICES).toHaveLength(5)
    expect(ACADEMY_STAGE_1_PERSONAL_PRACTICES.every(({ affectsProgress, createsMastery, completesLesson, certificationStatus }) => !affectsProgress && !createsMastery && !completesLesson && certificationStatus === 'optional-local-not-certified')).toBe(true)
    expect(corpus.counts.activities).toBe(289)
  })

  it('vincula ocho claims a sourceIds existentes y no verifica fórmulas OCR', () => {
    const sourceIds = new Set(corpus.packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id)))
    expect(ACADEMY_STAGE_1_CLAIM_REVIEWS).toHaveLength(8)
    for (const claim of ACADEMY_STAGE_1_CLAIM_REVIEWS) {
      expect(claim.sourceIds.every((sourceId) => sourceIds.has(sourceId)), claim.claimId).toBe(true)
      expect(claim.locators.length).toBeGreaterThan(0)
      expect(JSON.stringify(claim)).not.toContain('ocr-unverified')
    }
  })

  it('deduplica la cola personal por lección y conserva not-reviewed', () => {
    expect(new Set(ACADEMY_PERSONAL_REVIEW_QUEUE_014G.map(({ lessonId }) => lessonId)).size).toBe(ACADEMY_PERSONAL_REVIEW_QUEUE_014G.length)
    expect(ACADEMY_PERSONAL_REVIEW_QUEUE_014G.filter(({ originPhase }) => originPhase === '0.14G')).toHaveLength(8)
    expect(ACADEMY_PERSONAL_REVIEW_QUEUE_014G.every(({ personalStatus }) => personalStatus === 'not-reviewed')).toBe(true)
  })
})

describe('0.14G · informes deterministas', () => {
  it('genera las dieciocho salidas obligatorias de forma determinista', async () => {
    const second = await buildAcademy014GOutputs(repositoryRoot)
    expect([...second.entries()]).toEqual([...outputs.entries()])
    expect([...outputs.keys()]).toEqual([...ACADEMY_014G_OUTPUT_FILES])
    for (const [name, content] of outputs) expect(await readFile(join(repositoryRoot, 'docs', 'generated', name), 'utf8'), name).toBe(content)
  })
})
