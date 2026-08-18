import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { academyLessonMaterial } from '../../src/learning/academy/academyCatalog'
import {
  academyVisualCueFromCuration,
  buildAcademyReaderDocument,
  validateAcademyReaderDocument,
} from '../../src/learning/academy/reader/academyReaderDocument'
import type {
  AcademySourceFigureAsset,
  AcademySectionVisualCuration,
} from '../../src/learning/academy/reader/academyReaderModel'
import {
  academySourceFigureAssetIsValid,
  academySourceFigureSrcIsLocal,
  auditAcademySourceFigureAsset,
} from '../../src/learning/academy/reader/academySourceFigureAsset'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../../src/learning/product/integratedContent'
import { AcademyReaderVisual } from '../../src/learning/ui/reader/AcademyReaderVisual'
import {
  closeAcademySourceFigureDialog,
  openAcademySourceFigureDialog,
  restoreAcademySourceFigureFocus,
} from '../../src/learning/ui/reader/academySourceFigureDialog'

const validAsset: AcademySourceFigureAsset = {
  assetId: 'figure.test.barrel.v1',
  src: '/learning-media/source-figures/barrel-cutaway.webp',
  width: 1440,
  height: 960,
  alt: 'Corte del barrilete con tambor, árbol y muelle real identificables.',
  caption: 'Barrilete: relación entre tambor, árbol y muelle real',
  source: {
    sourceId: 'source.test.watchmaking-manual',
    title: 'Manual relojero de prueba',
    locator: 'reference-library/manual.pdf',
    page: 42,
    figure: 'Fig. 4-4',
  },
  crop: { unit: 'normalized', x: 0.45, y: 0.1, width: 0.5, height: 0.7 },
  contentHash: `sha256:${'a'.repeat(64)}`,
  sourceSha256: `sha256:${'b'.repeat(64)}`,
  rights: {
    status: 'personal-study-only',
    distribution: 'restricted',
    attribution: 'Reproducción local para estudio personal.',
  },
  whatToLookFor: 'Sigue el contacto del extremo interior del muelle con el árbol y del exterior con el tambor.',
  evidence: 'La figura permite distinguir qué elemento recibe el par y cuál lo entrega al tren.',
  limitation: 'Es un esquema de arquitectura; no aporta cotas ni prescribe una secuencia de servicio.',
}

function fixture() {
  const lessonId = 'lesson.mechanical.train'
  const material = academyLessonMaterial(INTEGRATED_LEARNING_PRODUCT_INDEX, lessonId)!
  const document = buildAcademyReaderDocument({ material, title: 'Tren de rodaje', locale: 'es-ES' }, { curationPhase: '0.14D' })
  const section = document.sections[0]
  const sourceCuration = document.sectionCurations?.find(({ sectionId }) => sectionId === section.sectionId)
  if (!sourceCuration) throw new Error('La fixture necesita una curación base.')
  const curation: AcademySectionVisualCuration = {
    ...sourceCuration,
    visualDecision: 'essential-inline-image',
    visualKind: 'image',
    diagramData: undefined,
    diagramSchemaId: undefined,
    imageAsset: validAsset,
    limitations: ['La imagen apoya el texto, no lo sustituye.'],
    expectedObservation: 'Texto anterior que debe sustituir la evidencia del asset.',
    readingModePolicy: 'inline-essential',
  }
  return { material, document, section, curation }
}

describe('contrato de figuras fuente de la Academia', () => {
  it('acepta solo rutas locales y metadatos completos y coherentes', () => {
    expect(academySourceFigureSrcIsLocal(validAsset.src)).toBe(true)
    expect(academySourceFigureSrcIsLocal('https://example.test/figure.webp')).toBe(false)
    expect(academySourceFigureSrcIsLocal('/learning-media/../secret.png')).toBe(false)
    expect(academySourceFigureSrcIsLocal('/learning-media/%2e%2e/secret.png')).toBe(false)
    expect(auditAcademySourceFigureAsset(validAsset)).toEqual([])
    expect(academySourceFigureAssetIsValid(validAsset)).toBe(true)
  })

  it('audita de forma explícita ruta, recorte, hash, derechos y propósito didáctico', () => {
    const invalid = {
      ...validAsset,
      src: 'https://example.test/figure.webp',
      crop: { unit: 'normalized', x: 0.8, y: 0, width: 0.4, height: 1 },
      contentHash: 'no-es-un-hash',
      sourceSha256: 'tampoco-es-un-hash',
      rights: { ...validAsset.rights, distribution: 'allowed' },
      evidence: '',
    }
    expect(auditAcademySourceFigureAsset(invalid).map(({ code }) => code)).toEqual(expect.arrayContaining([
      'src-not-local', 'crop', 'content-hash', 'source-content-hash', 'rights', 'didactic-contract',
    ]))
    expect(academySourceFigureAssetIsValid(invalid)).toBe(false)
  })

  it('transfiere un asset válido a un cue image implementado sin perder trazabilidad', () => {
    const { material, document, section, curation } = fixture()
    const cue = academyVisualCueFromCuration(section, curation, material.activities, '0.14K')
    expect(cue).toMatchObject({
      kind: 'image',
      sourceType: 'existing-runtime-asset',
      implementationStatus: 'implemented',
      provenance: 'source-figure-asset',
      curationStatus: 'implemented',
      imageAsset: validAsset,
      caption: validAsset.caption,
      altText: validAsset.alt,
      expectedObservation: validAsset.evidence,
      readingModePolicy: 'inline-essential',
    })
    expect(cue.limitations).toEqual(['La imagen apoya el texto, no lo sustituye.', validAsset.limitation])
    expect(cue.evidenceOfSpecificity).toContain(validAsset.source.sourceId)
    document.sectionCurations = (document.sectionCurations ?? []).map((item) => item.sectionId === section.sectionId ? curation : item)
    section.visualCue = cue
    expect(validateAcademyReaderDocument(document).filter(({ code }) => code.includes('image'))).toEqual([])
  })

  it('no clasifica como implementada una imagen sin asset válido y la validación lo denuncia', () => {
    const { material, document, section, curation } = fixture()
    const invalidCuration = { ...curation, imageAsset: { ...validAsset, src: 'data:image/png;base64,AA==' } }
    const cue = academyVisualCueFromCuration(section, invalidCuration, material.activities, '0.14K')
    expect(cue).toMatchObject({ kind: 'none', implementationStatus: 'unavailable', curationStatus: 'available-pending' })
    document.sectionCurations = (document.sectionCurations ?? []).map((item) => item.sectionId === section.sectionId ? invalidCuration : item)
    section.visualCue = cue
    expect(validateAcademyReaderDocument(document)).toContainEqual(expect.objectContaining({ code: 'invalid-image-asset', sectionId: section.sectionId }))
    document.sectionCurations = document.sectionCurations.map((item) => item.sectionId === section.sectionId ? { ...curation, imageAsset: undefined } : item)
    expect(validateAcademyReaderDocument(document)).toContainEqual(expect.objectContaining({ code: 'missing-image-asset', sectionId: section.sectionId }))
  })

  it('renderiza la imagen local con dimensiones, carga diferida, zoom y pie didáctico', () => {
    const { material, section, curation } = fixture()
    const cue = academyVisualCueFromCuration(section, curation, material.activities, '0.14K')
    const html = renderToStaticMarkup(<AcademyReaderVisual cue={cue} activities={[]} reducedMotion={false} />)
    expect(html).toContain(`src="${validAsset.src}"`)
    expect(html).toContain('width="1440"')
    expect(html).toContain('height="960"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain(`aria-controls="${cue.cueId}-image-dialog"`)
    expect(html).toContain('autofocus=""')
    expect(html).toContain('<dialog')
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/)
    expect(html).toContain('Qué mirar')
    expect(html).toContain('Qué demuestra')
    expect(html).toContain('Fuente y derechos')
    expect(html).not.toContain('<dt>Licencia</dt>')
    expect(html).not.toContain('<dt>Notas de derechos</dt>')
    expect(html).not.toContain('href=')
  })

  it('abre solo con showModal, lleva el foco a Cerrar y no activa el callback sin soporte nativo', () => {
    const dialog = {
      open: false,
      showModal: vi.fn(() => { dialog.open = true }),
      close: vi.fn(() => { dialog.open = false }),
    } satisfies Pick<HTMLDialogElement, 'open' | 'showModal' | 'close'>
    const closeButton = { focus: vi.fn() } satisfies Pick<HTMLButtonElement, 'focus'>
    const onOpen = vi.fn()

    expect(openAcademySourceFigureDialog(dialog, closeButton, onOpen)).toBe(true)
    expect(dialog.showModal).toHaveBeenCalledOnce()
    expect(closeButton.focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(onOpen).toHaveBeenCalledOnce()
    expect(openAcademySourceFigureDialog(dialog, closeButton, onOpen)).toBe(false)

    const unsupported = { open: false, showModal: undefined, close: dialog.close } as unknown as Pick<HTMLDialogElement, 'open' | 'showModal' | 'close'>
    expect(openAcademySourceFigureDialog(unsupported, closeButton, onOpen)).toBe(false)
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('cierra desde el control y restaura el foco tras el cierre nativo que también produce Escape', () => {
    const dialog = {
      open: true,
      showModal: vi.fn(() => { dialog.open = true }),
      close: vi.fn(() => { dialog.open = false }),
    } satisfies Pick<HTMLDialogElement, 'open' | 'showModal' | 'close'>
    const trigger = { focus: vi.fn() } satisfies Pick<HTMLButtonElement, 'focus'>

    expect(closeAcademySourceFigureDialog(dialog)).toBe(true)
    expect(dialog.close).toHaveBeenCalledOnce()
    restoreAcademySourceFigureFocus(trigger)
    expect(trigger.focus).toHaveBeenCalledWith({ preventScroll: true })

    // Escape cierra un <dialog> modal de forma nativa y React entrega después onClose.
    dialog.open = true
    dialog.close()
    restoreAcademySourceFigureFocus(trigger)
    expect(trigger.focus).toHaveBeenCalledTimes(2)
  })

  it('muestra la licencia y todas las notas de derechos cuando están declaradas', () => {
    const { material, section, curation } = fixture()
    const licensedAsset: AcademySourceFigureAsset = {
      ...validAsset,
      rights: {
        status: 'licensed',
        distribution: 'allowed',
        attribution: 'Manual relojero de prueba · autoría declarada.',
        license: 'CC BY 4.0',
        notes: ['Conservar esta atribución.', 'Indicar si el recorte se modifica.'],
      },
    }
    const cue = academyVisualCueFromCuration(section, { ...curation, imageAsset: licensedAsset }, material.activities, '0.14K')
    const html = renderToStaticMarkup(<AcademyReaderVisual cue={cue} activities={[]} reducedMotion={false} />)

    expect(html).toContain('<dt>Licencia</dt><dd>CC BY 4.0</dd>')
    expect(html).toContain('<dt>Notas de derechos</dt>')
    expect(html).toContain('<li>Conservar esta atribución.</li>')
    expect(html).toContain('<li>Indicar si el recorte se modifica.</li>')
  })
})
