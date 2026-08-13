import type { FidelityProfile } from '../fidelity'
import type { TechnicalDataLayer } from '../technical/reconstruction'
import type {
  EducationalSceneGraph,
  EducationalSpatialOverlay,
  EnergyPathNode,
  EnergyPathOverlay,
  RotationArcOverlay,
  SpatialArrowOverlay,
  SpatialLabelOverlay,
  Vec3,
  VisualDiagnostic,
  VisualEntityId,
  VisualOverlayState,
  VisualOverlayStyle,
} from './model'

const DEFAULT_OVERLAY_FIDELITY: FidelityProfile = {
  geometry: 'G1',
  kinematics: 'K1',
  physics: 'P0',
  limitations: ['Overlay funcional; no representa una simulación física validada.'],
}

function add(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]
}

function subtract(left: Vec3, right: Vec3): Vec3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]]
}

function scale(value: Vec3, amount: number): Vec3 {
  return [value[0] * amount, value[1] * amount, value[2] * amount]
}

function length(value: Vec3): number {
  return Math.hypot(value[0], value[1], value[2])
}

function normalize(value: Vec3): Vec3 {
  const magnitude = length(value)
  return magnitude <= Number.EPSILON ? [0, 0, 0] : scale(value, 1 / magnitude)
}

function cross(left: Vec3, right: Vec3): Vec3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ]
}

function styleForState(state: VisualOverlayState): VisualOverlayStyle {
  const values: Record<VisualOverlayState, VisualOverlayStyle> = {
    hidden: { color: '#6d7478', pattern: 'dotted', thickness: 1, icon: 'eye-off', stateLabel: 'oculto' },
    available: { color: '#7cbbc2', pattern: 'dashed', thickness: 1.5, icon: 'circle', stateLabel: 'disponible' },
    active: { color: '#f0b84b', pattern: 'solid', thickness: 2.5, icon: 'play', stateLabel: 'activo' },
    dimmed: { color: '#788085', pattern: 'dotted', thickness: 1, icon: 'minus', stateLabel: 'atenuado' },
    blocked: { color: '#dc6666', pattern: 'crosshatched', thickness: 3, icon: 'octagon-x', stateLabel: 'bloqueado' },
    incomplete: { color: '#c99b52', pattern: 'dashed', thickness: 2, icon: 'triangle-alert', stateLabel: 'incompleto' },
    unknown: { color: '#8b82a8', pattern: 'hatched', thickness: 2, icon: 'circle-help', stateLabel: 'desconocido' },
  }
  return values[state]
}

function headForArrow(start: Vec3, end: Vec3): Vec3[] {
  const direction = normalize(subtract(end, start))
  const fallback: Vec3 = Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const side = normalize(cross(direction, fallback))
  const size = Math.max(0.08, Math.min(0.4, length(subtract(end, start)) * 0.12))
  const base = add(end, scale(direction, -size))
  return [add(base, scale(side, size * 0.45)), end, add(base, scale(side, -size * 0.45))]
}

export function createSpatialArrow(input: {
  id: string
  start: Vec3
  end: Vec3
  entityIds?: VisualEntityId[]
  state?: VisualOverlayState
  label?: string
  direction?: SpatialArrowOverlay['direction']
  accessibleAlternative: string
  fidelity?: FidelityProfile
  dataLayer?: TechnicalDataLayer
}): { overlay?: SpatialArrowOverlay; diagnostics: VisualDiagnostic[] } {
  if (length(subtract(input.end, input.start)) <= Number.EPSILON) {
    return {
      overlay: undefined,
      diagnostics: [{
        code: 'EV-ARROW-ZERO-LENGTH',
        severity: 'error',
        message: `La flecha ${input.id} no tiene longitud.`,
        accessibleMessage: `No se puede mostrar ${input.accessibleAlternative}: el punto inicial y final coinciden.`,
        entityIds: input.entityIds,
      }],
    }
  }
  const state = input.state ?? 'available'
  return {
    overlay: {
      kind: 'arrow',
      id: input.id,
      state,
      start: [...input.start],
      end: [...input.end],
      entityIds: [...(input.entityIds ?? [])],
      label: input.label,
      direction: input.direction ?? 'forward',
      linePoints: [[...input.start], [...input.end]],
      arrowHead: headForArrow(input.start, input.end),
      adaptiveScale: true,
      occlusion: 'fade-when-occluded',
      style: styleForState(state),
      accessibleAlternative: input.accessibleAlternative,
      fidelity: structuredClone(input.fidelity ?? DEFAULT_OVERLAY_FIDELITY),
      dataLayer: input.dataLayer ?? 'educational-simulation',
    },
    diagnostics: [],
  }
}

function orthogonalBasis(axis: Vec3): [Vec3, Vec3] {
  const normalizedAxis = normalize(axis)
  const fallback: Vec3 = Math.abs(normalizedAxis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const first = normalize(cross(normalizedAxis, fallback))
  return [first, normalize(cross(normalizedAxis, first))]
}

export function createRotationArc(input: {
  id: string
  center: Vec3
  axis: Vec3
  radius: number
  direction: RotationArcOverlay['direction']
  conceptualSpeed?: RotationArcOverlay['conceptualSpeed']
  entityIds?: VisualEntityId[]
  state?: VisualOverlayState
  accessibleAlternative: string
  reducedMotion?: boolean
  fidelity?: FidelityProfile
  dataLayer?: TechnicalDataLayer
}): { overlay?: RotationArcOverlay; diagnostics: VisualDiagnostic[] } {
  if (length(input.axis) <= Number.EPSILON || !Number.isFinite(input.radius) || input.radius <= 0) {
    return {
      diagnostics: [{
        code: 'EV-ROTATION-INVALID-AXIS',
        severity: 'error',
        message: `El arco ${input.id} necesita eje y radio válidos.`,
        accessibleMessage: `${input.accessibleAlternative}. No se puede dibujar porque falta un eje o radio válido.`,
        entityIds: input.entityIds,
      }],
    }
  }
  const [first, second] = orthogonalBasis(input.axis)
  const sign = input.direction === 'clockwise' ? -1 : 1
  const points = Array.from({ length: 33 }, (_, index): Vec3 => {
    const angle = sign * (index / 32) * Math.PI * 1.6
    return add(input.center, add(scale(first, Math.cos(angle) * input.radius), scale(second, Math.sin(angle) * input.radius)))
  })
  const state = input.state ?? 'available'
  return {
    overlay: {
      kind: 'rotation-arc',
      id: input.id,
      state,
      center: [...input.center],
      axis: normalize(input.axis),
      radius: input.radius,
      direction: input.direction,
      conceptualSpeed: input.conceptualSpeed ?? 'unknown',
      points,
      entityIds: [...(input.entityIds ?? [])],
      animated: !input.reducedMotion && input.direction !== 'unknown',
      style: styleForState(state),
      accessibleAlternative: input.accessibleAlternative,
      fidelity: structuredClone(input.fidelity ?? DEFAULT_OVERLAY_FIDELITY),
      dataLayer: input.dataLayer ?? 'educational-simulation',
    },
    diagnostics: [],
  }
}

export function createEnergyPath(input: {
  id: string
  nodes: EnergyPathNode[]
  state?: VisualOverlayState
  activeIndex?: number
  accessibleAlternative?: string
  reducedMotion?: boolean
  fidelity?: FidelityProfile
  dataLayer?: TechnicalDataLayer
}): { overlay?: EnergyPathOverlay; diagnostics: VisualDiagnostic[] } {
  if (input.nodes.length < 2) {
    return {
      diagnostics: [{
        code: 'EV-PATH-TOO-SHORT',
        severity: 'error',
        message: `La ruta ${input.id} necesita al menos dos nodos.`,
        accessibleMessage: 'La ruta funcional está incompleta y no puede mostrarse.',
        entityIds: input.nodes.map(({ entityId }) => entityId),
      }],
    }
  }
  if (new Set(input.nodes.map(({ id }) => id)).size !== input.nodes.length) {
    return {
      diagnostics: [{
        code: 'EV-PATH-DUPLICATE-NODE',
        severity: 'error',
        message: `La ruta ${input.id} contiene nodos duplicados.`,
        accessibleMessage: 'La ruta funcional contiene pasos duplicados y debe corregirse.',
      }],
    }
  }
  const activeIndex = Math.max(-1, Math.min(input.nodes.length - 1, input.activeIndex ?? -1))
  const segments = input.nodes.slice(0, -1).map((node, index) => {
    const next = input.nodes[index + 1]
    const state = node.state === 'blocked' || next.state === 'blocked'
      ? 'blocked' as const
      : node.state === 'unknown' || next.state === 'unknown'
        ? 'unknown' as const
        : index < activeIndex ? 'active' as const : 'available' as const
    return {
      id: `${input.id}:segment:${index}`,
      fromNodeId: node.id,
      toNodeId: next.id,
      state,
      direction: state === 'unknown' ? 'unknown' as const : 'forward' as const,
      points: [[...node.point] as Vec3, [...next.point] as Vec3],
    }
  })
  const state = input.state ?? 'available'
  const accessibleAlternative = input.accessibleAlternative
    ?? input.nodes.map((node, index) => `${index + 1}. ${node.label}: ${node.state}`).join(' ')
  return {
    overlay: {
      kind: 'energy-path',
      id: input.id,
      state,
      nodes: structuredClone(input.nodes),
      segments,
      activeIndex,
      numbered: Boolean(input.reducedMotion),
      animated: !input.reducedMotion,
      style: styleForState(state),
      accessibleAlternative,
      fidelity: structuredClone(input.fidelity ?? DEFAULT_OVERLAY_FIDELITY),
      dataLayer: input.dataLayer ?? 'educational-simulation',
    },
    diagnostics: [],
  }
}

export function createSpatialLabel(input: {
  id: string
  point: Vec3
  text: string
  namespaceLabel: string
  entityId?: VisualEntityId
  state?: VisualOverlayState
  accessibleAlternative?: string
  fidelity?: FidelityProfile
  dataLayer?: TechnicalDataLayer
}): SpatialLabelOverlay {
  const state = input.state ?? 'available'
  return {
    kind: 'label',
    id: input.id,
    state,
    point: [...input.point],
    entityId: input.entityId,
    text: input.text,
    namespaceLabel: input.namespaceLabel,
    style: styleForState(state),
    accessibleAlternative: input.accessibleAlternative ?? `${input.namespaceLabel}: ${input.text}`,
    fidelity: structuredClone(input.fidelity ?? DEFAULT_OVERLAY_FIDELITY),
    dataLayer: input.dataLayer ?? 'educational-simulation',
  }
}

export function anchorForEntity(
  graphs: EducationalSceneGraph[],
  entityId: VisualEntityId,
): { point?: Vec3; diagnostics: VisualDiagnostic[] } {
  const entity = graphs.flatMap(({ entities }) => entities).find(({ id }) => id === entityId)
  if (!entity) {
    return {
      diagnostics: [{
        code: 'EV-ANCHOR-ENTITY-MISSING',
        severity: 'error',
        message: `No existe la entidad ${entityId}.`,
        accessibleMessage: 'No se puede anclar el indicador porque la pieza no está cargada.',
        entityIds: [entityId],
      }],
    }
  }
  if (!entity.bounds) {
    return {
      diagnostics: [{
        code: 'EV-ANCHOR-GEOMETRY-UNKNOWN',
        severity: 'warning',
        message: `${entity.name} no tiene un anclaje geométrico conocido.`,
        accessibleMessage: `${entity.name} se conserva en la alternativa textual, pero no se dibuja un anclaje espacial inventado.`,
        entityIds: [entityId],
      }],
    }
  }
  return { point: [...entity.bounds.center], diagnostics: [] }
}

export function applyReducedMotionToOverlay(
  overlay: EducationalSpatialOverlay,
  reducedMotion: boolean,
): EducationalSpatialOverlay {
  const clone = structuredClone(overlay)
  if (!reducedMotion) return clone
  if (clone.kind === 'rotation-arc') clone.animated = false
  if (clone.kind === 'energy-path') {
    clone.animated = false
    clone.numbered = true
  }
  return clone
}
