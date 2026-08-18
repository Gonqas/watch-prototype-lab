import { lazy, Suspense, useRef, useState } from 'react'
import type { LearningActivityDescriptor } from '../../product/demoPackage'
import type { AcademyVisualCue } from '../../academy/reader/academyReaderModel'
import { academySourceFigureAssetIsValid } from '../../academy/reader/academySourceFigureAsset'
import { AcademySpecificDiagram } from './AcademySpecificDiagram'
import {
  closeAcademySourceFigureDialog,
  openAcademySourceFigureDialog,
  restoreAcademySourceFigureFocus,
} from './academySourceFigureDialog'

const AcademyReaderScene = lazy(() => import('./AcademyReaderScene'))

const SOURCE_FIGURE_RIGHTS_LABEL = {
  'public-domain': 'dominio público',
  licensed: 'licencia declarada',
  'permission-granted': 'permiso concedido',
  'personal-study-only': 'solo estudio personal',
  'rights-review-required': 'revisión de derechos pendiente',
} as const

const SOURCE_FIGURE_DISTRIBUTION_LABEL = {
  allowed: 'distribución permitida',
  restricted: 'distribución restringida',
  'review-required': 'revisar antes de distribuir',
} as const

function AcademyReaderStaticSceneSummary({ cue }: { cue: AcademyVisualCue }) {
  const labels = cue.labelDefinitions ?? []
  return (
    <svg className="academy-reader-diagram is-static-scene-summary" viewBox="0 0 640 320" role="img" aria-labelledby={`${cue.cueId}-summary-title ${cue.cueId}-summary-desc`}>
      <title id={`${cue.cueId}-summary-title`}>{cue.caption}</title>
      <desc id={`${cue.cueId}-summary-desc`}>{cue.expectedObservation ?? cue.altText}</desc>
      <circle cx="320" cy="145" r="82" />
      <text x="320" y="140">{cue.fidelity === 'calibre-specific' ? 'Vista específica' : 'Vista conceptual'}</text>
      <text x="320" y="164">{cue.cameraPreset ?? 'resumen estático'}</text>
      {labels.slice(0, 8).map((item, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, Math.min(8, labels.length)) - Math.PI / 2
        const x = 320 + Math.cos(angle) * 210
        const y = 145 + Math.sin(angle) * 112
        return <g className="academy-reader-diagram__semantic-node" transform={`translate(${x} ${y})`} key={item.id}><rect x="-62" y="-22" width="124" height="44" rx="12" /><text y="5">{item.label.length > 23 ? `${item.label.slice(0, 22)}…` : item.label}</text></g>
      })}
    </svg>
  )
}

function AcademyReaderSourceFigure({ cue, onExpand }: { cue: AcademyVisualCue; onExpand?: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const asset = cue.imageAsset
  if (!academySourceFigureAssetIsValid(asset)) return null
  const dialogId = `${cue.cueId}-image-dialog`
  const open = () => openAcademySourceFigureDialog(dialogRef.current, closeButtonRef.current, onExpand)
  const close = () => closeAcademySourceFigureDialog(dialogRef.current)
  return (
    <>
      <div className="academy-reader-source-figure__viewport">
        <img
          className="academy-reader-source-figure__image"
          src={asset.src}
          width={asset.width}
          height={asset.height}
          alt={asset.alt}
          loading="lazy"
          decoding="async"
        />
        <button
          ref={triggerRef}
          type="button"
          className="academy-reader-source-figure__zoom"
          aria-haspopup="dialog"
          aria-controls={dialogId}
          onClick={open}
        >
          Ampliar imagen
        </button>
      </div>
      <dialog
        id={dialogId}
        ref={dialogRef}
        className="academy-reader-source-figure__dialog"
        aria-labelledby={`${cue.cueId}-image-dialog-title`}
        onClose={() => restoreAcademySourceFigureFocus(triggerRef.current)}
        onClick={(event) => { if (event.target === event.currentTarget) close() }}
      >
        <div className="academy-reader-source-figure__dialog-content">
          <header>
            <strong id={`${cue.cueId}-image-dialog-title`}>{asset.caption}</strong>
            <button ref={closeButtonRef} type="button" autoFocus onClick={close}>Cerrar</button>
          </header>
          <img src={asset.src} width={asset.width} height={asset.height} alt={asset.alt} loading="lazy" decoding="async" />
        </div>
      </dialog>
    </>
  )
}

export function AcademyReaderVisual({
  cue,
  activities,
  reducedMotion,
  staticOnly = false,
  onExpand,
}: {
  cue: AcademyVisualCue | undefined
  activities: readonly LearningActivityDescriptor[]
  reducedMotion: boolean
  staticOnly?: boolean
  onExpand?: () => void
}) {
  const [announcement, setAnnouncement] = useState('')
  if (!cue || cue.implementationStatus !== 'implemented') return null
  const activity = cue.activityId ? activities.find(({ id }) => id === cue.activityId) : undefined
  const renderableImage = cue.kind === 'image' && academySourceFigureAssetIsValid(cue.imageAsset)
  const hasRenderableVisual = cue.kind === 'scene-3d' || renderableImage || Boolean(cue.diagramData)
  if (!hasRenderableVisual) return null
  const announce = () => {
    const value = `${cue.caption}. ${cue.expectedObservation ?? cue.altText}`
    setAnnouncement(value)
    onExpand?.()
  }
  return (
    <figure
      className={`academy-reader-visual specificity-${cue.semanticSpecificity ?? 'generic-scaffold'}`}
      data-visual-design={cue.visualDesignId}
      data-visual-state={cue.visualStateId}
    >
      {renderableImage
        ? <AcademyReaderSourceFigure cue={cue} onExpand={onExpand} />
        : cue.kind === 'scene-3d'
        ? staticOnly
          ? <AcademyReaderStaticSceneSummary cue={cue} />
          : activity
            ? <Suspense fallback={<p role="status">Preparando el recurso visual…</p>}><AcademyReaderScene activity={activity} cue={cue} reducedMotion={reducedMotion} /></Suspense>
            : <p className="academy-reader-visual__unavailable" role="status">Vista no disponible. La explicación completa permanece en el texto.</p>
        : <AcademySpecificDiagram cue={cue} />}
      <figcaption>
        <strong>{cue.caption}</strong>
        <span>{cue.pedagogicalQuestion}</span>
        {renderableImage && cue.imageAsset
          ? <>
              <dl className="academy-reader-source-figure__didactics">
                <div><dt>Qué mirar</dt><dd>{cue.imageAsset.whatToLookFor}</dd></div>
                <div><dt>Qué demuestra</dt><dd>{cue.imageAsset.evidence}</dd></div>
                <div><dt>Límite</dt><dd>{cue.imageAsset.limitation}</dd></div>
              </dl>
              <details className="academy-reader-source-figure__provenance">
                <summary>Fuente y derechos</summary>
                <dl>
                  <div><dt>Fuente</dt><dd>{cue.imageAsset.source.title}</dd></div>
                  <div><dt>Localizador</dt><dd>{cue.imageAsset.source.locator}</dd></div>
                  {cue.imageAsset.source.page !== undefined && <div><dt>Página</dt><dd>{cue.imageAsset.source.page}</dd></div>}
                  {cue.imageAsset.source.figure && <div><dt>Figura</dt><dd>{cue.imageAsset.source.figure}</dd></div>}
                  <div><dt>Atribución</dt><dd>{cue.imageAsset.rights.attribution}</dd></div>
                  <div><dt>Uso</dt><dd>{SOURCE_FIGURE_RIGHTS_LABEL[cue.imageAsset.rights.status]} · {SOURCE_FIGURE_DISTRIBUTION_LABEL[cue.imageAsset.rights.distribution]}</dd></div>
                  {cue.imageAsset.rights.license && <div><dt>Licencia</dt><dd>{cue.imageAsset.rights.license}</dd></div>}
                  {cue.imageAsset.rights.notes?.length
                    ? <div><dt>Notas de derechos</dt><dd><ul>{cue.imageAsset.rights.notes.map((note) => <li key={note}>{note}</li>)}</ul></dd></div>
                    : null}
                </dl>
              </details>
            </>
          : <span>{cue.altText}</span>}
        <button type="button" className="academy-reader-announce-visual" onClick={announce}>Anunciar este cambio visual</button>
        <details><summary>Fidelidad y límites</summary><ul>{cue.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
      </figcaption>
      {announcement && <p className="sr-only" role="status">{announcement}</p>}
    </figure>
  )
}
