import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { LearningActivityDescriptor } from '../../product/demoPackage'
import type { EducationalVisualState } from '../../visual/model'
import { createSceneComposition } from '../../visual/sceneFixtures'
import type { EducationalViewportComposition } from '../../visual/composition'
import type { AcademyVisualCue } from '../../academy/reader/academyReaderModel'
import { academy3dVisualState } from '../../academy/reader/academyReader3dStates'
import { academyReaderWebGlAvailable, applyAcademy3dCueState } from '../../academy/reader/academyReader3dPresentation'

const EducationalViewport = lazy(() => import('../EducationalViewport'))

export default function AcademyReaderScene({ activity, cue, reducedMotion }: {
  activity: LearningActivityDescriptor
  cue: AcademyVisualCue
  reducedMotion: boolean
}) {
  const webGlAvailable = useMemo(() => academyReaderWebGlAvailable(), [])
  const compositionRef = useRef<EducationalViewportComposition | undefined>(undefined)
  const [preview, setPreview] = useState<{ graphs: ReturnType<EducationalViewportComposition['mounted']>[number]['sceneGraph'][]; state: EducationalVisualState }>()
  const [failed, setFailed] = useState<string>()
  const bindingKey = useMemo(() => JSON.stringify(activity.fixtureBinding ?? null), [activity.fixtureBinding])

  useEffect(() => {
    let active = true
    if (!activity.fixtureBinding) return () => undefined
    void createSceneComposition(activity.fixtureBinding, reducedMotion)
      .then((composition) => {
        if (!active) return composition.dispose()
        compositionRef.current = composition
        const applied = applyAcademy3dCueState(composition, cue, reducedMotion)
        if (!applied.state || applied.diagnostics.some(({ severity }) => severity === 'error')) {
          setFailed(applied.diagnostics.map(({ accessibleMessage }) => accessibleMessage).join(' '))
          return
        }
        setPreview({ graphs: composition.mounted().map(({ sceneGraph }) => sceneGraph), state: applied.state })
      })
      .catch(() => { if (active) setFailed('El modelo didáctico no pudo cargarse.') })
    return () => {
      active = false
      const composition = compositionRef.current
      compositionRef.current = undefined
      if (composition) void composition.dispose()
    }
    // bindingKey is the stable composition identity; cue changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindingKey])

  useEffect(() => {
    const composition = compositionRef.current
    if (!composition) return
    let active = true
    queueMicrotask(() => {
      if (!active) return
      const applied = applyAcademy3dCueState(composition, cue, reducedMotion)
      if (!applied.state || applied.diagnostics.some(({ severity }) => severity === 'error')) {
        setFailed(applied.diagnostics.map(({ accessibleMessage }) => accessibleMessage).join(' '))
        return
      }
      setFailed(undefined)
      setPreview({ graphs: composition.mounted().map(({ sceneGraph }) => sceneGraph), state: applied.state })
    })
    return () => { active = false }
  }, [cue, reducedMotion])

  if (!webGlAvailable) return <p className="academy-reader-visual__unavailable" role="status">Vista no disponible. Este navegador no admite la vista 3D. La explicación completa permanece en el texto.</p>
  if (!activity.fixtureBinding) return <p className="academy-reader-visual__unavailable" role="status">Vista no disponible. Esta actividad no tiene asociado un modelo didáctico. La explicación completa permanece en el texto.</p>
  if (failed) return <p className="academy-reader-visual__unavailable" role="status">Vista no disponible. La vista no está disponible en este estado. {failed} La explicación completa permanece en el texto.</p>
  if (!preview) return <p role="status">Preparando la vista de estudio…</p>
  return (
    <Suspense fallback={<p role="status">Preparando el visor…</p>}>
      <EducationalViewport
        graphs={preview.graphs}
        state={preview.state}
        ariaLabel={cue.altText}
        disabled
        motionActive={!reducedMotion && academy3dVisualState(cue.visualStateId)?.animation === 'play-on-explicit-request'}
      />
    </Suspense>
  )
}
