import { lazy, Suspense } from 'react'
import type { LearningActivityDescriptor } from '../../product/demoPackage'
import type { AcademyVisualCue } from '../../academy/reader/academyReaderModel'

const AcademyReaderScene = lazy(() => import('./AcademyReaderScene'))

function AcademyReaderDiagram({ cue }: { cue: AcademyVisualCue }) {
  const focus = cue.caption.length > 30 ? `${cue.caption.slice(0, 29)}…` : cue.caption
  return (
    <svg className="academy-reader-diagram" viewBox="0 0 640 320" role="img" aria-labelledby={`${cue.cueId}-title ${cue.cueId}-desc`}>
      <title id={`${cue.cueId}-title`}>{cue.caption}</title>
      <desc id={`${cue.cueId}-desc`}>{cue.altText}</desc>
      {cue.diagramKind === 'annotated-anatomy' ? (
        <>
          <path d="M210 86 292 132 M210 234 292 188 M430 86 348 132 M430 234 348 188" className="academy-reader-diagram__link" />
          <g className="academy-reader-diagram__node is-focus"><circle cx="320" cy="160" r="70" /><text x="320" y="155">{focus}</text><text x="320" y="180">interfaz central</text></g>
          <g className="academy-reader-diagram__label"><rect x="90" y="55" width="120" height="52" rx="12" /><text x="150" y="87">Función</text></g>
          <g className="academy-reader-diagram__label"><rect x="90" y="213" width="120" height="52" rx="12" /><text x="150" y="245">Relación</text></g>
          <g className="academy-reader-diagram__label"><rect x="430" y="55" width="120" height="52" rx="12" /><text x="490" y="87">Límite</text></g>
          <g className="academy-reader-diagram__label"><rect x="430" y="213" width="120" height="52" rx="12" /><text x="490" y="245">Criterio</text></g>
        </>
      ) : cue.diagramKind === 'comparison' ? (
        <>
          <path d="M320 62 V260" className="academy-reader-diagram__link" />
          <g className="academy-reader-diagram__panel"><rect x="55" y="70" width="220" height="180" rx="20" /><text x="165" y="115">Caso A</text><text x="165" y="158">{focus}</text><text x="165" y="205">Mismo criterio</text></g>
          <g className="academy-reader-diagram__panel"><rect x="365" y="70" width="220" height="180" rx="20" /><text x="475" y="115">Caso B</text><text x="475" y="158">{focus}</text><text x="475" y="205">Diferencia visible</text></g>
        </>
      ) : cue.diagramKind === 'inspection-path' ? (
        <>
          <path d="M125 160 H515" className="academy-reader-diagram__link" />
          {['Estado', 'Observar', 'Distinguir', 'Registrar'].map((label, index) => <g className={`academy-reader-diagram__node ${index === 1 ? 'is-focus' : ''}`} key={label}><circle cx={125 + index * 130} cy="160" r={index === 1 ? 55 : 45} /><text x={125 + index * 130} y="166">{label}</text></g>)}
        </>
      ) : cue.diagramKind === 'causal-chain' ? (
        <>
          <path d="M105 160 H535" className="academy-reader-diagram__link" />
          {['Entrada', 'Cambio', 'Control', 'Resultado'].map((label, index) => <g className={`academy-reader-diagram__node ${index === 1 || index === 2 ? 'is-focus' : ''}`} key={label}><circle cx={105 + index * 143} cy="160" r="44" /><text x={105 + index * 143} y="166">{label}</text></g>)}
        </>
      ) : (
        <>
          <path d="M320 70 V250 M170 160 H470 M214 96 426 224 M426 96 214 224" className="academy-reader-diagram__link" />
          <g className="academy-reader-diagram__node is-focus"><circle cx="320" cy="160" r="68" /><text x="320" y="155">{focus}</text><text x="320" y="180">en el sistema</text></g>
          <g className="academy-reader-diagram__node"><circle cx="150" cy="80" r="38" /><text x="150" y="86">Entrada</text></g>
          <g className="academy-reader-diagram__node"><circle cx="490" cy="80" r="38" /><text x="490" y="86">Función</text></g>
          <g className="academy-reader-diagram__node"><circle cx="150" cy="240" r="38" /><text x="150" y="246">Límite</text></g>
          <g className="academy-reader-diagram__node"><circle cx="490" cy="240" r="38" /><text x="490" y="246">Salida</text></g>
        </>
      )}
    </svg>
  )
}

export function AcademyReaderVisual({
  cue,
  activities,
  reducedMotion,
}: {
  cue: AcademyVisualCue | undefined
  activities: readonly LearningActivityDescriptor[]
  reducedMotion: boolean
}) {
  if (!cue || cue.implementationStatus !== 'implemented') return null
  const activity = cue.activityId ? activities.find(({ id }) => id === cue.activityId) : undefined
  return (
    <figure className="academy-reader-visual" aria-live="polite">
      {cue.kind === 'scene-3d' && activity
        ? <Suspense fallback={<p role="status">Preparando el recurso visual…</p>}><AcademyReaderScene activity={activity} cue={cue} reducedMotion={reducedMotion} /></Suspense>
        : <AcademyReaderDiagram cue={cue} />}
      <figcaption>
        <strong>{cue.caption}</strong>
        <span>{cue.pedagogicalQuestion}</span>
        <span>{cue.altText}</span>
        <details><summary>Fidelidad y límites</summary><ul>{cue.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
      </figcaption>
    </figure>
  )
}
