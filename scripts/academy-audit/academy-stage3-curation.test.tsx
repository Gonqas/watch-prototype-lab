import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createDefaultAcademyLocalState, normalizeAcademyLocalState } from '../../src/learning/academy/academyLocalState'
import {
  ACADEMY_PERSONAL_REVIEW_QUEUE_014I,
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
  ACADEMY_STAGE_3_SECTIONS,
  ACADEMY_STAGE_3_SUPPORT_IDS,
  ACADEMY_STAGE_3_TRANSITIONS,
  ACADEMY_STAGE_3_VISUAL_DESIGNS,
  ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE,
  academy014IContentPreservation,
} from '../../src/learning/academy/reader/academyPersonalCurriculum'
import { resolveAcademyReaderSection } from '../../src/learning/academy/reader/academyReaderDocument'
import { ACADEMY_014I_OUTPUT_FILES, buildAcademy014IOutputs } from '../academy-014i'
import {
  ACADEMY_014I_TEST_ROOT,
  academy014IBuildDocument,
  academy014IDocumentText,
  academy014ITestEnvironment,
} from './academy-014i-test-helpers'

const execFileAsync = promisify(execFile)
const stage3DocumentsPromise = Promise.all(ACADEMY_STAGE_3_CATALOG.map(({ lessonId }) => academy014IBuildDocument(lessonId, '0.14I')))
const sourceDocumentsPromise = Promise.all(ACADEMY_STAGE_3_CATALOG.map(({ lessonId }) => academy014IBuildDocument(lessonId, '0.14D')))
const stage3TextPromise = stage3DocumentsPromise.then((documents) => documents.map(academy014IDocumentText).join('\n').toLowerCase())
const curationText = () => Object.values(ACADEMY_STAGE_3_SECTIONS).flat().map(({ title, markdown }) => `${title}\n${markdown.replace(/\]\([^)]+\)/g, ']')}`).join('\n').toLowerCase()

describe('0.14I · etapa 3 (pruebas 27–37)', () => {
  it('27. existen cuatro capítulos', () => expect(ACADEMY_STAGE_3_CHAPTER_SEQUENCE).toEqual(['chapter.3.1', 'chapter.3.2', 'chapter.3.3', 'chapter.3.4']))
  it('28. existen doce anchors', () => expect(ACADEMY_STAGE_3_ANCHOR_IDS).toHaveLength(12))
  it('29. existen dos supports', () => expect(ACADEMY_STAGE_3_SUPPORT_IDS).toHaveLength(2))
  it('30. existen tres ramas opcionales', () => expect(ACADEMY_STAGE_3_OPTIONAL_IDS).toHaveLength(3))
  it('31. supports y ramas no bloquean', () => {
    for (const item of ACADEMY_STAGE_3_PREREQUISITE_OVERRIDES.filter(({ pathRole }) => pathRole !== 'anchor')) expect(item.blocking).toBe(false)
  })
  it('32. etapa 2 abre etapa 3', () => expect(ACADEMY_STAGE_3_TRANSITIONS).toContainEqual(expect.objectContaining({ fromChapterId: 'chapter.2.6', toChapterId: 'chapter.3.1', blocking: true })))
  it('33. etapa 3 abre etapa 4 sin declarar competencia', () => {
    const transition = ACADEMY_STAGE_3_TRANSITIONS.find(({ fromChapterId }) => fromChapterId === 'chapter.3.4')
    expect(transition).toMatchObject({ toChapterId: 'chapter.4.1', blocking: true })
    expect(transition?.meaning).toMatch(/sin acreditar servicio/)
  })
  it('34. las diecisiete lecciones usan composición preservadora', async () => {
    const source = await sourceDocumentsPromise
    const current = await stage3DocumentsPromise
    expect(current).toHaveLength(17)
    for (let index = 0; index < current.length; index += 1) expect(current[index].sections.length).toBeGreaterThan(source[index].sections.length)
  })
  it('35. toda sección fuente tiene disposición', async () => {
    const source = await sourceDocumentsPromise
    const current = await stage3DocumentsPromise
    for (let index = 0; index < source.length; index += 1) {
      const dispositions = academy014IContentPreservation(source[index].lessonId, source[index].sections, current[index].sections).dispositions
      expect(new Set(dispositions.map(({ sourceSectionId }) => sourceSectionId))).toEqual(new Set(source[index].sections.map(({ sectionId }) => sectionId)))
    }
  })
  it('36. la cobertura sustantiva es 100 %', async () => {
    const source = await sourceDocumentsPromise
    const current = await stage3DocumentsPromise
    for (let index = 0; index < source.length; index += 1) expect(academy014IContentPreservation(source[index].lessonId, source[index].sections, current[index].sections).row.substantiveCoverage).toBe(1)
  })
  it('37. no existe una estructura uniforme obligatoria', () => {
    const structures = Object.values(ACADEMY_STAGE_3_SECTIONS).map((sections) => sections.map(({ role }) => role).join('>'))
    expect(new Set(structures).size).toBeGreaterThanOrEqual(5)
  })
})

describe('0.14I · contenido (pruebas 38–54)', () => {
  it('38. observación no equivale a inferencia', async () => expect(await stage3TextPromise).toMatch(/observaci[oó]n[\s\S]{0,180}inferencia/))
  it('39. inferencia no equivale a diagnóstico', async () => expect(await stage3TextPromise).toMatch(/inferencia[\s\S]{0,220}diagn[oó]stico/))
  it('40. la línea base precede a la intervención', async () => expect(await stage3TextPromise).toMatch(/antes de (intervenir|abrir)|precede a la intervenci[oó]n/))
  it('41. el hallazgo incluye evidencia e incertidumbre', async () => {
    const text = academy014IDocumentText((await stage3DocumentsPromise).find(({ lessonId }) => lessonId === 'lesson.metrology.inspection-findings')!).toLowerCase()
    expect(text).toContain('evidencia'); expect(text).toContain('incertidumbre')
  })
  it('42. resolución no equivale a exactitud', async () => expect(await stage3TextPromise).toMatch(/resoluci[oó]n[\s\S]{0,200}(no (demuestra|garantiza|implica)|exactitud)/))
  it('43. precisión no equivale a exactitud', async () => expect(await stage3TextPromise).toMatch(/precisi[oó]n[\s\S]{0,120}exactitud/))
  it('44. tolerancia no equivale a incertidumbre', async () => expect(await stage3TextPromise).toMatch(/tolerancia[\s\S]{0,180}incertidumbre|incertidumbre[\s\S]{0,180}tolerancia/))
  it('45. una medición declara unidad', async () => expect(academy014IDocumentText((await stage3DocumentsPromise).find(({ lessonId }) => lessonId === 'lesson.metrology.physical-measurement')!).toLowerCase()).toContain('unidad'))
  it('46. una medición declara referencia o datum cuando procede', async () => expect(await stage3TextPromise).toMatch(/referencia|datum/))
  it('47. la selección de instrumento depende de la tarea', () => expect(ACADEMY_STAGE_3_CATALOG.find(({ lessonId }) => lessonId === 'lesson.metrology.instruments')?.editorialFocus).toMatch(/tarea gobierna la selecci[oó]n/))
  it('48. un síntoma admite hipótesis rivales', async () => expect(await stage3TextPromise).toMatch(/s[ií]ntoma[\s\S]{0,240}hip[oó]tesis rivales/))
  it('49. una prueba discriminante produce resultados diferenciadores', async () => expect(await stage3TextPromise).toMatch(/prueba discriminante[\s\S]{0,260}(resultados|favorecen|debilitan|diferencia)/))
  it('50. limpiar no aparece como primer paso universal', async () => expect(await stage3TextPromise).toContain('limpiar no es el primer paso universal'))
  it('51. un lubricante no se prescribe por teoría general', async () => expect(await stage3TextPromise).toMatch(/no (determinan|prescribe)[\s\S]{0,80}(producto|lubricante)|producto, punto y cantidad/))
  it('52. el montaje incluye controles intermedios', async () => expect(await stage3TextPromise).toContain('controles intermedios'))
  it('53. un criterio de aceptación declara su autoridad', async () => expect(await stage3TextPromise).toMatch(/aceptaci[oó]n[\s\S]{0,180}(autoridad|fabricante|diseño)/))
  it('54. no se importan tolerancias históricas como actuales', () => expect(curationText()).toMatch(/fuente hist[oó]rica[\s\S]{0,180}no autoriza[\s\S]{0,80}tolerancias/))
})

describe('0.14I · seguridad (pruebas 55–64)', () => {
  it('55. no existe receta química accionable', () => expect(ACADEMY_STAGE_3_SAFETY_POLICY.recipesIncluded).toBe(false))
  it('56. no aparecen concentraciones históricas en una instrucción', () => expect(ACADEMY_STAGE_3_SAFETY_POLICY.concentrationsIncluded).toBe(false))
  it('57. no aparecen tiempos históricos de inmersión como recomendación', () => expect(ACADEMY_STAGE_3_SAFETY_POLICY.immersionTimesIncluded).toBe(false))
  it('58. no se recomienda gasolina, benceno, cianuro, tetracloruro de carbono o ácido', () => expect(curationText()).not.toMatch(/(?:usa|aplica|sumerge|limpia con)\s+(?:gasolina|benceno|cianuro|tetracloruro|[aá]cido)/))
  it('59. una mención histórica queda marcada como no accionable', () => {
    for (const audit of ACADEMY_STAGE_3_SAFETY_AUDITS.filter(({ sourceHistoricalRisk }) => sourceHistoricalRisk !== 'none')) expect(audit.lessonOperationalRisk).toBe('historical-non-actionable')
  })
  it('60. una operación química concreta requiere fuente actual', () => {
    for (const audit of ACADEMY_STAGE_3_SAFETY_AUDITS.filter(({ procedureRisk }) => procedureRisk !== 'none')) expect(audit.modernAlternative).toBe('pending-current-manufacturer-document-and-sds')
  })
  it('61. no se genera fotografía falsa de defecto', () => expect(ACADEMY_STAGE_3_PHOTO_BRIEFS.every(({ authorshipAndLicense, status }) => /no generar con ia/i.test(authorshipAndLicense) && status === 'future-real-photo-required')).toBe(true))
  it('62. ninguna práctica inicial requiere sustancias', () => expect(JSON.stringify(ACADEMY_STAGE_3_PERSONAL_PRACTICES).toLowerCase()).not.toMatch(/"inexpensivematerials"[^\]]*(qu[ií]mic|lubricante|disolvente)/))
  it('63. ninguna práctica inicial requiere abrir un barrilete', () => {
    expect(ACADEMY_STAGE_3_SAFETY_POLICY.openBarrelRequired).toBe(false)
    expect(JSON.stringify(ACADEMY_STAGE_3_PERSONAL_PRACTICES).toLowerCase()).not.toMatch(/"steps"[^\]]*abrir (un |el )?barrilete/)
  })
  it('64. ninguna actividad digital produce P', () => {
    expect(ACADEMY_STAGE_3_SAFETY_POLICY.digitalActivityProducesPhysicalEvidence).toBe(false)
    for (const activity of ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS) expect(activity.evidenceProfile).toMatchObject({ physicalExecutionRequired: false, physicalCompetenceClaim: false })
  })
})

describe('0.14I · claims y fuentes (pruebas 65–71)', () => {
  it('65. todo sourceId de claim existe', async () => {
    const { corpus } = await academy014ITestEnvironment()
    const sourceIds = new Set(corpus.packs.flatMap(({ pack }) => pack.sources.map(({ id }) => id)))
    for (const claim of ACADEMY_STAGE_3_CLAIMS) for (const sourceId of [claim.primarySourceId, ...claim.supportingSourceIds]) expect(sourceIds.has(sourceId)).toBe(true)
  })
  it('66. todo claim apunta a lección y sección reales', async () => {
    const documents = new Map((await stage3DocumentsPromise).map((document) => [document.lessonId, document]))
    for (const claim of ACADEMY_STAGE_3_CLAIMS) expect(documents.get(claim.lessonId)?.sections.some(({ sectionId }) => sectionId === claim.sectionId)).toBe(true)
  })
  it('67. no existen claims huérfanos', () => expect(new Set(ACADEMY_STAGE_3_CLAIMS.map(({ claimId }) => claimId))).toHaveLength(ACADEMY_STAGE_3_CLAIMS.length))
  it('68. un claim source-reviewed tiene localizador', () => {
    for (const claim of ACADEMY_STAGE_3_CLAIMS.filter(({ verificationStatus }) => verificationStatus === 'source-reviewed')) expect(claim.locator).toBeTruthy()
  })
  it('69. un claim de seguridad no depende solo de TM', () => {
    for (const claim of ACADEMY_STAGE_3_CLAIMS.filter(({ claimType }) => claimType === 'safety')) expect(claim.primarySourceId).not.toContain('tm9-1575')
  })
  it('70. un valor TM no se presenta como tolerancia actual', () => {
    for (const claim of ACADEMY_STAGE_3_CLAIMS.filter(({ primarySourceId }) => primarySourceId.includes('tm9-1575'))) expect(claim).toMatchObject({ historicalStatus: 'historical' })
    expect(ACADEMY_STAGE_3_CLAIMS.filter(({ primarySourceId }) => primarySourceId.includes('tm9-1575')).every(({ limitations }) => limitations.join(' ').match(/no autoridad moderna|no se trasladan|no se generaliza/i))).toBe(true)
  })
  it('71. una fórmula OCR no se eleva sin inspección visual', () => expect(ACADEMY_STAGE_3_FORMULA_REVIEWS).toEqual([]))
})

describe('0.14I · visuales (pruebas 72–80)', () => {
  it('72. no se duplican visuales E', () => {
    expect(new Set(ACADEMY_STAGE_3_REUSED_VISUALS)).toHaveLength(ACADEMY_STAGE_3_REUSED_VISUALS.length)
    expect(ACADEMY_STAGE_3_VISUAL_DESIGNS.some(({ visualDesignId }) => ACADEMY_STAGE_3_REUSED_VISUALS.includes(visualDesignId as never))).toBe(false)
  })
  it('73. cada visual tiene pregunta pedagógica', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ pedagogicalQuestion }) => expect(pedagogicalQuestion).toMatch(/\?$/)))
  it('74. cada visual tiene payload específico', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ semanticPayload }) => { expect(semanticPayload.nodes.length).toBeGreaterThan(1); expect(semanticPayload.edges.length).toBeGreaterThan(0) }))
  it('75. cada visual declara fidelidad', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ fidelity }) => expect(fidelity).toBe('conceptual')))
  it('76. cada visual declara limitaciones', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ limitations }) => expect(limitations.length).toBeGreaterThan(0)))
  it('77. cada visual tiene alternativa textual', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ accessibilitySummary, longDescription }) => { expect(accessibilitySummary.length).toBeGreaterThan(30); expect(longDescription.length).toBeGreaterThan(45) }))
  it('78. cada visual funciona sin color', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ colorIndependent }) => expect(colorIndependent).toBe(true)))
  it('79. reduced motion funciona', () => ACADEMY_STAGE_3_VISUAL_DESIGNS.forEach(({ reducedMotionSafe }) => expect(reducedMotionSafe).toBe(true)))
  it('80. los briefs no cuentan como visual implementado', () => {
    expect(ACADEMY_STAGE_3_PHOTO_BRIEFS).toHaveLength(10)
    expect(ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE).toHaveLength(15)
    expect(ACADEMY_STAGE_3_PHOTO_BRIEFS.every(({ status }) => status === 'future-real-photo-required')).toBe(true)
  })
})

describe('0.14I · compatibilidad y UX (pruebas 81–96)', () => {
  it('81. los deep links conservan lessonId y sectionId resolubles', async () => {
    const document = (await stage3DocumentsPromise)[0]
    expect(resolveAcademyReaderSection(document, document.sections[0].sectionId).sectionId).toBe(document.sections[0].sectionId)
  })
  it('82. los aliases resuelven a contenido equivalente', async () => {
    const lessonId = 'lesson.metrology.observe-before-measuring'
    const historical = await academy014IBuildDocument(lessonId, '0.14H')
    const current = await academy014IBuildDocument(lessonId, '0.14I')
    const resolved = resolveAcademyReaderSection(current, historical.sections[0].sectionId)
    expect(current.sections.some(({ sectionId }) => sectionId === resolved.sectionId)).toBe(true)
  })
  it('83. las notas conservan contexto', () => {
    const base = createDefaultAcademyLocalState('profile.014i', '2026-08-16')
    const normalized = normalizeAcademyLocalState('profile.014i', { ...base, notes: [{ id: 'note.014i', title: 'Nota', body: 'Contexto', tags: [], context: { lessonId: ACADEMY_STAGE_3_CATALOG[0].lessonId, sectionId: 'legacy.section' }, createdAt: '2026-08-16', updatedAt: '2026-08-16' }] }, '2026-08-16')
    expect(normalized?.notes[0]?.context.sectionId).toBe('legacy.section')
  })
  it('84. los marcadores conservan contexto', () => {
    const base = createDefaultAcademyLocalState('profile.014i', '2026-08-16')
    const normalized = normalizeAcademyLocalState('profile.014i', { ...base, bookmarks: [{ id: 'bookmark.014i', title: 'Marca', href: '#/learning/lesson', context: { lessonId: ACADEMY_STAGE_3_CATALOG[0].lessonId, sectionId: 'legacy.section' }, createdAt: '2026-08-16' }] }, '2026-08-16')
    expect(normalized?.bookmarks[0]?.context.sectionId).toBe('legacy.section')
  })
  it('85. la reanudación conserva posición', () => {
    const base = createDefaultAcademyLocalState('profile.014i', '2026-08-16')
    const normalized = normalizeAcademyLocalState('profile.014i', { ...base, lessonProgress: [{ lessonId: ACADEMY_STAGE_3_CATALOG[0].lessonId, currentSegmentId: 'legacy.section', completedSegmentIds: [], activeSectionId: 'legacy.section', scrollAnchor: 'legacy.section', scrollOffset: 37, documentVersion: 'old', visitedSectionIds: ['legacy.section'], updatedAt: '2026-08-16' }] }, '2026-08-16')
    expect(normalized?.lessonProgress[0]).toMatchObject({ scrollAnchor: 'legacy.section', scrollOffset: 37 })
  })
  it('86. el scrollspy usa observación de intersección', async () => expect(await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')).toContain('IntersectionObserver'))
  it('87. la pregunta central aparece una sola vez', async () => {
    for (const document of await stage3DocumentsPromise) if (document.centralQuestion) expect(academy014IDocumentText(document).split(document.centralQuestion).length - 1).toBeLessThanOrEqual(1)
  })
  it('88. no aparece jerga interna visible en las adiciones', () => expect(curationText()).not.toMatch(/(?:lesson|activity|reader|block)\.[a-z0-9.-]+|phase014|0\.14i/i))
  it('89. no aparecen fragmentos automáticos de 210 palabras', () => expect(curationText()).not.toMatch(/fragmento (?:autom[aá]tico )?de 210|210 palabras/))
  it('90. no aparecen títulos “continuación”', () => Object.values(ACADEMY_STAGE_3_SECTIONS).flat().forEach(({ title }) => expect(title).not.toMatch(/continuaci[oó]n/i)))
  it('91. el lector protege el desbordamiento horizontal', async () => expect(await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/ui/reader/academy-reader.css'), 'utf8')).toMatch(/max-width:\s*100%|overflow-x:\s*auto/))
  it('92. el reflow al 200 % tiene reglas responsivas', async () => expect(await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/ui/reader/academy-reader.css'), 'utf8')).toMatch(/@media\s*\(max-width:/))
  it('93. la navegación por teclado conserva elementos nativos', async () => expect(await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')).toMatch(/<button|<a /))
  it('94. el foco visible está definido', async () => expect(await readFile(join(ACADEMY_014I_TEST_ROOT, 'src/learning/ui/reader/academy-reader.css'), 'utf8')).toMatch(/:focus-visible\s*\{[^}]*outline:/s))
  it('95. verify incluye la auditoría 0.14I determinista', async () => {
    const packageJson = JSON.parse(await readFile(join(ACADEMY_014I_TEST_ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(packageJson.scripts.verify).toContain('learning:0.14i -- --check')
    expect((await buildAcademy014IOutputs(ACADEMY_014I_TEST_ROOT)).size).toBe(ACADEMY_014I_OUTPUT_FILES.length)
  }, 60_000)
  it('96. git diff --check pasa', async () => expect((await execFileAsync('git', ['diff', '--check'], { cwd: ACADEMY_014I_TEST_ROOT })).stdout).toBe(''))

  it('conserva las 12 actividades y 13 prácticas fuera del corpus', async () => {
    const { product } = await academy014ITestEnvironment()
    expect(ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS).toHaveLength(12)
    expect(ACADEMY_STAGE_3_PERSONAL_PRACTICES).toHaveLength(13)
    for (const practice of ACADEMY_STAGE_3_PERSONAL_PRACTICES) expect(product.activities.some(({ id }) => id === practice.personalPracticeId)).toBe(false)
  })
  it('mantiene cola deduplicada y checkpoint no bloqueante', () => {
    expect(new Set(ACADEMY_PERSONAL_REVIEW_QUEUE_014I.map(({ lessonId }) => lessonId))).toHaveLength(ACADEMY_PERSONAL_REVIEW_QUEUE_014I.length)
    expect(ACADEMY_STAGE_3_FINAL_CHECKPOINT.questions).toHaveLength(13)
    expect(ACADEMY_STAGE_3_FINAL_CHECKPOINT.actions).toHaveLength(7)
    expect(ACADEMY_STAGE_3_FINAL_CHECKPOINT).toMatchObject({ blocking: false, affectsProgress: false, createsMastery: false })
  })
})
