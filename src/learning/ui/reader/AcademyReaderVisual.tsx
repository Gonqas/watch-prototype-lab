import { lazy, Suspense, useState } from 'react'
import type { LearningActivityDescriptor } from '../../product/demoPackage'
import type { AcademyVisualCue } from '../../academy/reader/academyReaderModel'
import { AcademySpecificDiagram } from './AcademySpecificDiagram'

const AcademyReaderScene = lazy(() => import('./AcademyReaderScene'))

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
  const hasRenderableVisual = cue.kind === 'scene-3d' || Boolean(cue.diagramData)
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
      {cue.kind === 'scene-3d'
        ? staticOnly
          ? <AcademyReaderStaticSceneSummary cue={cue} />
          : activity
            ? <Suspense fallback={<p role="status">Preparando el recurso visual…</p>}><AcademyReaderScene activity={activity} cue={cue} reducedMotion={reducedMotion} /></Suspense>
            : <p className="academy-reader-visual__unavailable" role="status">Vista no disponible. La explicación completa permanece en el texto.</p>
        : <AcademySpecificDiagram cue={cue} />}
      <figcaption>
        <strong>{cue.caption}</strong>
        <span>{cue.pedagogicalQuestion}</span>
        <span>{cue.altText}</span>
        <button type="button" className="academy-reader-announce-visual" onClick={announce}>Anunciar este cambio visual</button>
        <details><summary>Fidelidad y límites</summary><ul>{cue.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
      </figcaption>
      {announcement && <p className="sr-only" role="status">{announcement}</p>}
    </figure>
  )
}
