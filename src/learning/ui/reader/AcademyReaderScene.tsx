import { lazy, Suspense, useEffect, useState } from 'react'
import type { LearningActivityDescriptor } from '../../product/demoPackage'
import type { EducationalSceneGraph, EducationalVisualState } from '../../visual/model'
import { createSceneComposition } from '../../visual/sceneFixtures'
import type { AcademyVisualCue } from '../../academy/reader/academyReaderModel'

const EducationalViewport = lazy(() => import('../EducationalViewport'))

export default function AcademyReaderScene({ activity, cue, reducedMotion }: {
  activity: LearningActivityDescriptor
  cue: AcademyVisualCue
  reducedMotion: boolean
}) {
  const [preview, setPreview] = useState<{ graphs: EducationalSceneGraph[]; state: EducationalVisualState }>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let dispose: (() => Promise<void>) | undefined
    if (!activity.fixtureBinding) return () => undefined
    void createSceneComposition(activity.fixtureBinding, reducedMotion)
      .then((composition) => {
        dispose = () => composition.dispose()
        if (!active) return composition.dispose()
        setPreview({
          graphs: composition.mounted().map(({ sceneGraph }) => sceneGraph),
          state: composition.captureSnapshot().state,
        })
      })
      .catch(() => { if (active) setFailed(true) })
    return () => {
      active = false
      if (dispose) void dispose()
    }
  }, [activity.fixtureBinding, reducedMotion])

  if (failed) return <p role="status">La vista no está disponible. La explicación completa permanece en el texto.</p>
  if (!preview) return <p role="status">Preparando la vista de estudio…</p>
  return (
    <Suspense fallback={<p role="status">Preparando el visor…</p>}>
      <EducationalViewport graphs={preview.graphs} state={preview.state} ariaLabel={cue.altText} disabled />
    </Suspense>
  )
}
