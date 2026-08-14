import type { EducationalViewportComposition } from '../../visual/composition'
import type { EducationalVisualState, VisualDiagnostic, VisualEntityId } from '../../visual/model'
import { parseVisualEntityId } from '../../visual/model'
import { createSpatialLabel } from '../../visual/overlays'
import { academy3dVisualState } from './academyReader3dStates'
import type { AcademyVisualCue } from './academyReaderModel'

type WebGlCanvas = Pick<HTMLCanvasElement, 'getContext'>

export function academyReaderWebGlAvailable(canvas?: WebGlCanvas): boolean {
  if (typeof document === 'undefined' && !canvas) return true
  const probe = canvas ?? document.createElement('canvas')
  try {
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

function idsForToken(composition: EducationalViewportComposition, token: string): VisualEntityId[] {
  const mounted = composition.mounted()
  if (token.startsWith('visual:')) {
    return mounted.some(({ sceneGraph }) => sceneGraph.entityIds.includes(token as VisualEntityId)) ? [token as VisualEntityId] : []
  }
  if (token.startsWith('instance:')) {
    const instanceId = token.slice('instance:'.length)
    return mounted.flatMap(({ sceneGraph }) => sceneGraph.entities.filter((entity) =>
      entity.instanceId === instanceId
      || entity.role === instanceId
      || entity.primitives.some(({ sourcePrimitiveId }) => sourcePrimitiveId.includes(`.${instanceId}.`)),
    ).map(({ id }) => id))
  }
  return mounted.flatMap(({ spec, fixture }) => {
    const selector = fixture.selectors.find(({ id }) => id === token)
    if (!selector) return []
    return composition.resolve({ mountId: spec.id, fixtureId: fixture.id, selector: selector.selector, cardinality: selector.cardinality }).entityIds
  })
}

function uniqueIds(values: VisualEntityId[]): VisualEntityId[] {
  return [...new Set(values)] as VisualEntityId[]
}

export function applyAcademy3dCueState(
  composition: EducationalViewportComposition,
  cue: AcademyVisualCue,
  reducedMotion: boolean,
): { state?: EducationalVisualState; diagnostics: VisualDiagnostic[] } {
  const visualState = academy3dVisualState(cue.visualStateId)
  if (!visualState) return { diagnostics: [{ code: 'AR-3D-STATE-MISSING', severity: 'error', message: `Estado inexistente: ${cue.visualStateId ?? 'sin ID'}.`, accessibleMessage: 'La vista solicitada no tiene un estado visual registrado.' }] }
  const tokens = [...new Set([
    ...visualState.selectedIds,
    ...visualState.isolatedIds,
    ...Object.keys(visualState.transparency),
    ...Object.keys(visualState.explosion),
    ...visualState.labels.flatMap(({ targetId }) => targetId ? [targetId] : []),
  ])]
  const resolved = new Map(tokens.map((token) => [token, uniqueIds(idsForToken(composition, token))]))
  const missing = tokens.filter((token) => (resolved.get(token)?.length ?? 0) === 0)
  if (missing.length > 0) return {
    diagnostics: missing.map((token) => ({
      code: 'AR-3D-SELECTOR-MISSING', severity: 'error', message: `Selector o entidad inexistente: ${token}.`,
      accessibleMessage: `La vista no puede localizar ${token}; se conserva la explicación textual.`,
    })),
  }
  const diagnostics: VisualDiagnostic[] = []
  diagnostics.push(...composition.execute({ type: 'reset-presentation' }).diagnostics)
  diagnostics.push(...composition.execute({ type: 'set-reduced-motion', active: reducedMotion }).diagnostics)
  const selected = uniqueIds(visualState.selectedIds.flatMap((token) => resolved.get(token) ?? []))
  if (selected.length) diagnostics.push(...composition.execute({ type: 'select', entityIds: selected }).diagnostics)
  const isolated = uniqueIds(visualState.isolatedIds.flatMap((token) => resolved.get(token) ?? []))
  const isolationByMount = new Map<string, VisualEntityId[]>()
  for (const id of isolated) {
    const mountId = parseVisualEntityId(id)?.mountId
    if (mountId) isolationByMount.set(mountId, [...(isolationByMount.get(mountId) ?? []), id])
  }
  for (const [mountId, entityIds] of isolationByMount) diagnostics.push(...composition.execute({ type: 'isolate', mountId, entityIds }).diagnostics)
  for (const [token, opacity] of Object.entries(visualState.transparency)) {
    diagnostics.push(...composition.execute({ type: 'transparency', entityIds: resolved.get(token) ?? [], opacity }).diagnostics)
  }
  for (const [token, amount] of Object.entries(visualState.explosion)) {
    diagnostics.push(...composition.execute({ type: 'explode', entityIds: resolved.get(token) ?? [], amount }).diagnostics)
  }
  const currentCamera = composition.captureSnapshot().state.cameras.common
  diagnostics.push(...composition.execute({
    type: 'camera',
    viewportId: 'common',
    snapshot: {
      pose: {
        position: visualState.camera.position,
        target: visualState.camera.target,
        up: [0, 1, 0],
        projection: 'perspective',
        fieldOfView: visualState.camera.fieldOfView,
        orthographicScale: 12,
      },
      bookmarks: currentCamera?.bookmarks ?? [],
      transition: currentCamera?.transition,
    },
  }).diagnostics)
  const entities = composition.mounted().flatMap(({ sceneGraph }) => sceneGraph.entities)
  for (const label of visualState.labels) {
    const entityId = label.targetId ? resolved.get(label.targetId)?.[0] : undefined
    const entity = entityId ? entities.find(({ id }) => id === entityId) : undefined
    diagnostics.push(...composition.execute({
      type: 'overlay-upsert',
      overlay: createSpatialLabel({
        id: `reader.overlay.${visualState.visualStateId}.${label.id}`,
        point: entity?.bounds?.center ?? [0, 0, 0],
        entityId,
        text: label.label,
        namespaceLabel: cue.caption,
        accessibleAlternative: label.description ?? `${label.label}. ${visualState.expectedObservation}`,
      }),
    }).diagnostics)
  }
  return { state: composition.captureSnapshot().state, diagnostics }
}
