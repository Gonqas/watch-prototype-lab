import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import {
  AcademyLocalStore,
  createDefaultAcademyLocalState,
  type AcademyStorage,
} from '../../src/learning/academy/academyLocalState'
import { ACADEMY_3D_VISUAL_STATES } from '../../src/learning/academy/reader/academyReader3dStates'
import {
  ACADEMY_DEEP_VISUAL_PILOT_IDS,
  ACADEMY_SUPPORTING_VISUAL_PILOT_IDS,
  academyDiagramIsContentSpecific,
} from '../../src/learning/academy/reader/academyReaderCuration'
import { buildAcademyReaderDocument, validateAcademyReaderDocument } from '../../src/learning/academy/reader/academyReaderDocument'
import { academyReaderDocumentVersionMatches } from '../../src/learning/academy/reader/academyReaderIdentity'
import {
  academyEditorialReviewStatus,
  academyReaderDocumentReviewHash,
  createAcademyEditorialReviewDraft,
} from '../../src/learning/academy/reader/academyReaderReview'
import type { AcademyReaderDocument, AcademyVisualCue } from '../../src/learning/academy/reader/academyReaderModel'
import { ACADEMY_READER_PILOT } from '../../src/learning/academy/reader/academyReaderPilot'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'
import { createSceneComposition } from '../../src/learning/visual/sceneFixtures'
import { AcademyReaderVisual } from '../../src/learning/ui/reader/AcademyReaderVisual'
import { academyReaderEventsCsv } from '../../src/learning/academy/reader/academyReaderMetrics'
import { academyReaderWebGlAvailable, applyAcademy3dCueState } from '../../src/learning/academy/reader/academyReader3dPresentation'
import { academyUsabilitySessionJson } from '../../src/learning/academy/reader/academyUsabilityHarness'
import {
  ACADEMY_014C_BASELINE_SHA256,
  ACADEMY_READER_HARDENING_OUTPUT_FILES,
  buildAcademyReaderHardeningOutputs,
} from '../academy-reader-hardening'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const now = '2026-08-14T12:00:00.000Z'

class MemoryStorage implements AcademyStorage {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function readerDocument(lessonId: string): AcademyReaderDocument {
  const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
  const descriptor = INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.find(({ id }) => id === lessonId)!
  return buildAcademyReaderDocument({ material, title: descriptor.title.es, purpose: descriptor.purpose.es, locale: 'es-ES', requiredActivityIds: descriptor.studyContract?.labActivityIds })
}

let outputs: Awaited<ReturnType<typeof buildAcademyReaderHardeningOutputs>>
let inventory: {
  counts: Record<string, number>
  cues: Array<{ cueId: string; lessonId: string; sectionId: string; implementationStatus: string; visualDesignId?: string; diagramPayloadHash?: string; fixtureIds: string[]; visualStateId?: string; semanticSpecificity?: string }>
}
let curation: { lessonCount: number; sectionCount: number; curations: Array<{ lessonId: string; sectionId: string; visualDecision: string; ownerReviewStatus: string }> }

beforeAll(async () => {
  outputs = await buildAcademyReaderHardeningOutputs(repositoryRoot)
  inventory = JSON.parse(outputs.get('ACADEMY-VISUAL-INVENTORY-0.14D.json')!)
  curation = JSON.parse(outputs.get('ACADEMY-SECTION-CURATION-0.14D.json')!)
}, 30_000)

describe('0.14D · contabilidad y preservación', () => {
  it('01–04 · separa instancias, diseños, payloads, fixtures y estados', () => {
    expect(inventory.counts.cueInstanceCount).toBe(2568)
    expect(inventory.counts.uniqueVisualDesignCount).toBeLessThan(inventory.counts.cueInstanceCount)
    expect(inventory.counts.uniqueDiagramPayloadCount).toBeGreaterThan(1)
    expect(inventory.counts.uniqueFixtureCount).toBe(2)
    expect(inventory.counts.unique3dStateCount).toBe(ACADEMY_3D_VISUAL_STATES.length)
  })

  it('05 · cinco scaffolds repetidos no se cuentan como cientos de diseños', () => {
    expect(inventory.counts.genericScaffoldCount).toBe(0)
    expect(inventory.counts.uniqueVisualDesignCount).toBe(inventory.counts.implementedCueInstanceCount)
  })

  it('06 · todos los informes 0.14C conservan su SHA-256', async () => {
    for (const [fileName, expected] of Object.entries(ACADEMY_014C_BASELINE_SHA256)) {
      const value = await readFile(join(repositoryRoot, 'docs/generated', fileName))
      expect(createHash('sha256').update(value).digest('hex'), fileName).toBe(expected)
    }
  })

  it('07 · las 17 salidas son deterministas y coinciden con disco', async () => {
    const second = await buildAcademyReaderHardeningOutputs(repositoryRoot)
    expect([...second.entries()]).toEqual([...outputs.entries()])
    expect([...outputs.keys()]).toEqual([...ACADEMY_READER_HARDENING_OUTPUT_FILES])
    for (const [fileName, content] of outputs) expect(await readFile(join(repositoryRoot, 'docs/generated', fileName), 'utf8'), fileName).toBe(content)
  }, 30_000)

  it('08 · los ocho paquetes y todos los IDs visibles permanecen', async () => {
    const historical = JSON.parse(await readFile(join(repositoryRoot, 'docs/generated/ACADEMY-CONTINUOUS-READER-0.14C.json'), 'utf8')) as { lessons: Array<{ packageId: string; lessonId: string }> }
    expect(new Set(historical.lessons.map(({ packageId }) => packageId)).size).toBe(8)
    expect(new Set(inventory.cues.map(({ lessonId }) => lessonId))).toEqual(new Set(historical.lessons.map(({ lessonId }) => lessonId)))
  })
})

describe('0.14D · curación y revisión honesta', () => {
  it('09–12 · los 15 pilotos profundos y el supporting tienen decisión por apartado', () => {
    expect(curation.lessonCount).toBe(16)
    for (const lessonId of [...ACADEMY_DEEP_VISUAL_PILOT_IDS, ...ACADEMY_SUPPORTING_VISUAL_PILOT_IDS]) {
      const document = readerDocument(lessonId)
      expect(document.sectionCurations).toHaveLength(document.sections.length)
      expect(document.sectionCurations?.every(({ visualDecision }) => Boolean(visualDecision))).toBe(true)
    }
    expect(curation.curations.every(({ ownerReviewStatus }) => ownerReviewStatus === 'owner-review-pending')).toBe(true)
  })

  it('13 · un scaffold genérico no pasa la prueba de especificidad', () => {
    expect(academyDiagramIsContentSpecific({ title: 'Plantilla', nodes: [{ id: 'a', label: 'Entrada' }, { id: 'b', label: 'Resultado' }], edges: [{ from: 'a', to: 'b', label: 'Relación' }] })).toBe(false)
    const specific = readerDocument('lesson.mechanical.gear-pair').visualCues.find(({ diagramData }) => diagramData)
    expect(academyDiagramIsContentSpecific(specific?.diagramData)).toBe(true)
  })

  it('14 · un gap no produce placeholder visual', () => {
    const gap = readerDocument('lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste').visualCues.find(({ implementationStatus }) => implementationStatus === 'gap-recorded')!
    expect(renderToStaticMarkup(<AcademyReaderVisual cue={gap} activities={[]} reducedMotion={false} />)).toBe('')
  })

  it('15–18 · owner-reviewed es explícito y queda stale si cambia el hash', () => {
    const document = readerDocument('lesson.horology.system')
    const draft = createAcademyEditorialReviewDraft(document, now)
    expect(academyEditorialReviewStatus(document, undefined)).toBe('owner-review-pending')
    expect(academyEditorialReviewStatus(document, draft)).toBe('owner-review-pending')
    const explicit = { ...draft, status: 'owner-reviewed' as const, ownerReviewedAt: now, readerDocumentHash: academyReaderDocumentReviewHash(document) }
    expect(academyEditorialReviewStatus(document, explicit)).toBe('owner-reviewed')
    expect(academyEditorialReviewStatus({ ...document, contentHash: 'changed' }, explicit)).toBe('stale-after-content-change')
    expect(ACADEMY_READER_PILOT).toHaveLength(21)
  })
})

describe('0.14D · estado 3D y lectura', () => {
  it('19–21 · cada cue 3D resuelve actividad, fixture y estado exactos', () => {
    for (const lessonId of ['lesson.mechanical.train', 'lesson.miyota8215.architecture', 'lesson.miyota8215.guided-disassembly', 'lesson.miyota8215.inspection']) {
      const document = readerDocument(lessonId)
      const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
      for (const cue of document.visualCues.filter(({ kind }) => kind === 'scene-3d')) {
        expect(material.activities.some(({ id, fixtureBinding }) => id === cue.activityId && Boolean(fixtureBinding))).toBe(true)
        expect(ACADEMY_3D_VISUAL_STATES.some(({ visualStateId }) => visualStateId === cue.visualStateId)).toBe(true)
      }
    }
  })

  it('22–24 · aplica cámara, selección, aislamiento y reduced motion sin recrear la composición', async () => {
    const lessonId = 'lesson.mechanical.train'
    const document = readerDocument(lessonId)
    const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
    const cues = document.visualCues.filter(({ kind }) => kind === 'scene-3d')
    const activity = material.activities.find(({ id }) => id === cues[0].activityId)!
    const composition = await createSceneComposition(activity.fixtureBinding!, true)
    try {
      const first = applyAcademy3dCueState(composition, cues[0], true)
      const second = applyAcademy3dCueState(composition, cues[1], true)
      expect(first.diagnostics.some(({ severity }) => severity === 'error')).toBe(false)
      expect(second.diagnostics.some(({ severity }) => severity === 'error')).toBe(false)
      expect(first.state?.cameras.common?.pose.position).not.toEqual(second.state?.cameras.common?.pose.position)
      expect(second.state?.reducedMotion).toBe(true)
      expect(composition.mounted()).not.toHaveLength(0)
    } finally { await composition.dispose() }
  })

  it('24b · los nueve estados resuelven todos sus selectores en el fixture declarado', async () => {
    const groups = new Map<string, { binding: NonNullable<AcademyVisualCue['fixtureBinding']>; cues: AcademyVisualCue[] }>()
    for (const lessonId of ['lesson.mechanical.train', 'lesson.miyota8215.architecture', 'lesson.miyota8215.guided-disassembly', 'lesson.miyota8215.inspection']) {
      const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
      for (const cue of readerDocument(lessonId).visualCues.filter(({ kind }) => kind === 'scene-3d')) {
        const activity = material.activities.find(({ id }) => id === cue.activityId)!
        const key = JSON.stringify(activity.fixtureBinding)
        const group = groups.get(key) ?? { binding: activity.fixtureBinding!, cues: [] }
        group.cues.push(cue)
        groups.set(key, group)
      }
    }
    const seen = new Set<string>()
    for (const { binding, cues } of groups.values()) {
      const composition = await createSceneComposition(binding, false)
      try {
        for (const cue of cues) {
          seen.add(cue.visualStateId!)
          expect(applyAcademy3dCueState(composition, cue, false).diagnostics.some(({ severity }) => severity === 'error'), cue.visualStateId).toBe(false)
        }
      } finally { await composition.dispose() }
    }
    expect(seen).toEqual(new Set(ACADEMY_3D_VISUAL_STATES.map(({ visualStateId }) => visualStateId)))
  })

  it('25 · un selector inexistente produce incidencia y no cambia de medio', async () => {
    const miyota = readerDocument('lesson.miyota8215.architecture').visualCues.find(({ kind }) => kind === 'scene-3d')!
    const trainMaterial = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, 'lesson.mechanical.train')!
    const composition = await createSceneComposition(trainMaterial.activities.find(({ fixtureBinding }) => fixtureBinding)!.fixtureBinding!, false)
    try { expect(applyAcademy3dCueState(composition, miyota, false).diagnostics).toContainEqual(expect.objectContaining({ code: 'AR-3D-SELECTOR-MISSING', severity: 'error' })) } finally { await composition.dispose() }
  })

  it('26 · falta de actividad 3D es unavailable y nunca diagrama', () => {
    const document = structuredClone(readerDocument('lesson.mechanical.train'))
    const scene = document.sections.find(({ visualCue }) => visualCue.kind === 'scene-3d')!
    scene.visualCue.activityId = undefined
    expect(validateAcademyReaderDocument(document)).toContainEqual(expect.objectContaining({ code: 'missing-3d-activity' }))
  })

  it('26b · ausencia de WebGL conserva la alternativa textual', () => {
    const unavailableCanvas = { getContext: () => null } as unknown as Pick<HTMLCanvasElement, 'getContext'>
    expect(academyReaderWebGlAvailable(unavailableCanvas)).toBe(false)
  })

  it('27–30 · Lectura mantiene esenciales inline, sin WebGL obligatorio ni rail', async () => {
    const surface = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    const visual = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyReaderVisual.tsx'), 'utf8')
    expect(surface).toContain("mode === 'read'")
    expect(surface).toContain("['inline-essential', 'inline-static-summary'].includes")
    expect(surface).toContain('staticOnly')
    expect(visual).toContain('AcademyReaderStaticSceneSummary')
    expect(inventory.cues.filter(({ implementationStatus }) => implementationStatus === 'implemented').length).toBeGreaterThan(0)
  })
})

describe('0.14D · semántica, reanudación, notas y métricas', () => {
  it('31–34 · headingLevel real, un h1, sin aria-live repetitivo y sin rail vacío', async () => {
    const surface = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    const visual = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyReaderVisual.tsx'), 'utf8')
    const css = await readFile(join(repositoryRoot, 'src/learning/ui/reader/academy-reader.css'), 'utf8')
    expect(surface).toMatch(/return <h4>|return <h3>|return <h2>/)
    expect(surface.match(/<h1/g)).toHaveLength(1)
    expect(visual).not.toMatch(/aria-live=/)
    expect(surface).toContain("showVisualRail ? 'has-visual' : 'no-visual'")
    expect(css).toContain('.academy-reader-layout.no-visual')
  })

  it('35–38 · documentVersion corta y aliases/firmas conservan trazabilidad', () => {
    const document = readerDocument('lesson.horology.system')
    expect(document.documentVersion).toMatch(/^reader-v1:[a-f0-9]{16}$/)
    expect(document.identity?.diagnosticSignature.length).toBeGreaterThan(document.documentVersion.length)
    expect(academyReaderDocumentVersionMatches(document, document.documentVersion)).toBe(true)
    expect(academyReaderDocumentVersionMatches(document, document.identity!.legacyDocumentVersion)).toBe(true)
    expect(document.legacyAliases.length).toBeGreaterThan(0)
  })

  it('39–42 · section IDs largos, notas y marcadores conservan contextos distintos', () => {
    const storage = new MemoryStorage(); const store = new AcademyLocalStore(storage, () => now, () => 'fixed')
    const longSectionId = `reader.section.${'x'.repeat(300)}`
    store.recordReaderPosition('profile.a', 'lesson.horology.system', { activeSectionId: longSectionId, scrollAnchor: longSectionId, scrollOffset: 22, documentVersion: 'reader-v1:1234567890abcdef', visitedSectionIds: [longSectionId] })
    const note = store.createNote('profile.a', { title: 'Apartado', body: 'Solo comentario privado', tags: [], context: { lessonId: 'lesson.horology.system', stepId: 'step.system', sectionId: longSectionId, cueId: 'reader.cue.long' } })
    const bookmark = store.createBookmark('profile.a', { title: 'Volver', href: `#/learning/lesson/lesson.horology.system?section=${encodeURIComponent(longSectionId)}`, context: { lessonId: 'lesson.horology.system', sectionId: longSectionId } })
    expect(store.load('profile.a').lessonProgress[0].visitedSectionIds).toEqual([longSectionId])
    expect(note.context).toMatchObject({ stepId: 'step.system', sectionId: longSectionId, cueId: 'reader.cue.long' })
    expect(bookmark.href).toContain('?section=')
    store.createBookmark('profile.a', { title: 'Legacy', href: '#/learning/lesson/lesson.horology.system', context: { lessonId: 'lesson.horology.system' } })
    expect(store.load('profile.a').bookmarks).toHaveLength(2)
  })

  it('43–47 · eventos seguros, acotados, exportables y borrables; métricas antiguas sobreviven', () => {
    const storage = new MemoryStorage(); const base = createDefaultAcademyLocalState('profile.a', now)
    base.metrics = [{ id: 'reader.open', count: 7, lastRecordedAt: now }]
    base.readerEvents = Array.from({ length: 2_500 }, (_, index) => ({ eventId: `event.${index}`, sessionId: 'session.a', eventType: 'section-enter' as const, timestamp: now, lessonId: 'lesson.horology.system', sectionId: `section.${index}`, source: 'academy-reader' as const, metadata: {} }))
    storage.setItem('wplab.academy.local.v1.profile.a', JSON.stringify(base))
    const store = new AcademyLocalStore(storage, () => now, () => 'new')
    store.recordReaderEvent('profile.a', { sessionId: 'session.a', eventType: 'route-leave-incomplete', lessonId: 'lesson.horology.system', completed: false, source: 'academy-reader', metadata: { safe: true, externalUrl: 'https://example.test', noteText: 'no se almacena como contenido largo' } })
    const loaded = store.load('profile.a')
    expect(loaded.readerEvents).toHaveLength(2_500)
    expect(loaded.readerEvents.at(-1)?.metadata).toEqual({ safe: true, noteText: 'no se almacena como contenido largo' })
    expect(loaded.metrics[0].count).toBe(7)
    expect(academyReaderEventsCsv(loaded.readerEvents)).toContain('route-leave-incomplete')
    store.clearReaderEvents('profile.a')
    expect(store.load('profile.a').readerEvents).toHaveLength(0)
  })

  it('47b · una sesión de uso puede eliminarse junto con sus eventos sin tocar progreso', () => {
    const storage = new MemoryStorage(); const store = new AcademyLocalStore(storage, () => now, () => 'fixed')
    const before = store.load('profile.a').lessonProgress
    const event = store.recordReaderEvent('profile.a', { sessionId: 'usability.qa', eventType: 'session-start', source: 'usability-harness', metadata: {} })
    store.saveUsabilitySession('profile.a', { sessionId: 'usability.qa', participantType: 'owner', startedAt: now, taskIds: [], taskResults: [], eventIds: [event.eventId], observations: '', status: 'draft' })
    store.deleteUsabilitySession('profile.a', 'usability.qa')
    expect(store.load('profile.a')).toMatchObject({ lessonProgress: before, usabilitySessions: [], readerEvents: [] })
  })

  it('47c · la exportación de uso es explícita, local y versionada', () => {
    const json = academyUsabilitySessionJson({ sessionId: 'usability.qa', participantType: 'beginner', startedAt: now, taskIds: ['task.a'], taskResults: [], eventIds: [], observations: '', status: 'draft' })
    expect(JSON.parse(json)).toMatchObject({ format: 'wplab-usability-session', version: '0.14D', session: { sessionId: 'usability.qa', participantType: 'beginner' } })
    expect(json).not.toContain('http')
  })

  it('48–50 · salida incompleta, pagehide deduplicado y ausencia de red están implementados', async () => {
    const surface = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    expect(surface).toContain("'route-leave-incomplete' | 'pagehide-incomplete'")
    expect(surface).toContain("recordExit('pagehide-incomplete')")
    expect(surface).toContain("recordExit('route-leave-incomplete')")
    expect(surface).toContain('exitRecorded')
    expect(surface).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon/)
  })
})

describe('0.14D · integridad de alcance', () => {
  it('50b · router intermedio delega gestión y deep links gobiernan modo/apartado', async () => {
    const router = await readFile(join(repositoryRoot, 'src/learning/ui/LearningSurfaces.tsx'), 'utf8')
    const reader = await readFile(join(repositoryRoot, 'src/learning/ui/reader/AcademyContinuousLessonSurface.tsx'), 'utf8')
    expect(router).toContain("'editorial-review'")
    expect(router).toContain("'usability'")
    expect(reader).toContain("snapshot.location.query.mode === 'read'")
    expect(reader).toContain('snapshot.location.query.section ?? snapshot.location.query.segment')
  })

  it('51–54 · no copia fuentes privadas, no acredita banco y no muta progreso al construir', async () => {
    const before = JSON.stringify(INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.map(({ id, activityIds }) => ({ id, activityIds })))
    readerDocument('lesson.miyota8215.guided-disassembly')
    expect(JSON.stringify(INTEGRATED_LEARNING_PRODUCT_INDEX.lessons.map(({ id, activityIds }) => ({ id, activityIds })))).toBe(before)
    const runtimeSource = await readFile(join(repositoryRoot, 'src/learning/academy/reader/academyReaderCuration.ts'), 'utf8')
    expect(runtimeSource).not.toMatch(/reference-library[\\/]originals|["'][^"']+\.(?:iso|pdf|zip)["']/i)
    expect(runtimeSource).toContain("ownerReviewStatus: 'owner-review-pending'")
    expect(runtimeSource).toContain('conceptualLimits')
  })
})
