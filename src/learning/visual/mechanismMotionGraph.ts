import type { FidelityProfile } from '../fidelity'
import type { Vec3 } from './model'

export type MechanismRelationType =
  | 'meshes-with'
  | 'drives'
  | 'same-arbor'
  | 'locks'
  | 'releases'
  | 'impulses'
  | 'winds'

export type MechanismRelationState = 'engaged' | 'disengaged' | 'blocked' | 'unknown'
export type MechanismContactState = 'confirmed' | 'estimated' | 'separated' | 'unknown' | 'not-applicable'
export type MechanismDataClass = 'official' | 'measured' | 'estimated' | 'conceptual' | 'unknown'
export type MechanismMotionKind = 'static' | 'rotation' | 'oscillation' | 'pallet'
export type MechanismNodeStatus = 'active' | 'stopped' | 'blocked' | 'disengaged' | 'unknown' | 'locked'
export type EscapementMotionPhase =
  | 'locked-left'
  | 'unlock-left'
  | 'impulse-left'
  | 'drop-left'
  | 'locked-right'
  | 'unlock-right'
  | 'impulse-right'
  | 'drop-right'

export interface MechanismValue {
  value: number
  dataClass: MechanismDataClass
  sourceIds: string[]
  limitation?: string
}

export interface MechanismMotionNode {
  id: string
  motion: MechanismMotionKind
  axis: Vec3
  teeth?: MechanismValue
  amplitudeRadians?: MechanismValue
  frequencyHz?: MechanismValue
  phaseOffsetRadians?: number
  limitations: string[]
}

export interface MechanismMotionRelation {
  id: string
  type: MechanismRelationType
  fromId: string
  toId: string
  dataClass: MechanismDataClass
  state: MechanismRelationState
  contact: MechanismContactState
  mesh?: 'external' | 'internal'
  ratio?: MechanismValue
  driverTeeth?: MechanismValue
  drivenTeeth?: MechanismValue
  sourceIds: string[]
  limitations: string[]
}

export interface MechanismEscapement {
  escapeWheelId: string
  palletForkId: string
  oscillatorId: string
  hairspringId?: string
  escapeStepRadians: MechanismValue
  frequencyHz: MechanismValue
  oscillatorAmplitudeRadians: MechanismValue
  palletAmplitudeRadians: MechanismValue
  sourceIds: string[]
  limitations: string[]
}

export interface MechanismMotionGraph {
  schemaVersion: 1
  id: string
  version: string
  dataClass: MechanismDataClass
  fidelity: FidelityProfile
  nodes: MechanismMotionNode[]
  relations: MechanismMotionRelation[]
  escapement?: MechanismEscapement
  sourceIds: string[]
  limitations: string[]
}

export interface MechanismMotionSource {
  nodeId: string
  angularVelocityRadiansPerSecond: number
  phaseRadians?: number
}

export interface MechanismRelationOverride {
  state?: MechanismRelationState
  contact?: MechanismContactState
}

export interface MechanismMotionRequest {
  sources: MechanismMotionSource[]
  blockedNodeIds?: string[]
  relationOverrides?: Record<string, MechanismRelationOverride>
  escapementPhase?: EscapementMotionPhase
  reducedMotion?: boolean
  discreteStep?: number
}

export interface MechanismMotionDiagnostic {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  nodeIds?: string[]
  relationIds?: string[]
}

export interface MechanismRelationEvaluation {
  relationId: string
  state: MechanismRelationState
  contact: MechanismContactState
  transmitting: boolean
  ratio?: number
  direction: -1 | 0 | 1
  dataClass: MechanismDataClass
}

export interface MechanismMotionProfile {
  kind: 'none' | 'continuous-rotation' | 'stepped-rotation' | 'oscillation' | 'pallet'
  axis: Vec3
  animation: 'continuous' | 'discrete' | 'none'
  angularVelocityRadiansPerSecond: number
  frequencyHz: number
  amplitudeRadians: number
  phaseRadians: number
  stepRadians: number
}

export interface MechanismNodeMotionState {
  nodeId: string
  status: MechanismNodeStatus
  angularVelocityRadiansPerSecond: number
  direction: -1 | 0 | 1
  drivenByNodeId?: string
  pathRelationIds: string[]
  motion: MechanismMotionProfile
}

export interface MechanismMotionSolution {
  schemaVersion: 1
  graphId: string
  graphVersion: string
  reducedMotion: boolean
  escapementPhase?: EscapementMotionPhase
  discreteStep: number
  nodes: MechanismNodeMotionState[]
  relations: MechanismRelationEvaluation[]
  diagnostics: MechanismMotionDiagnostic[]
}

interface MutableNodeState {
  nodeId: string
  status: MechanismNodeStatus
  angularVelocityRadiansPerSecond: number
  drivenByNodeId?: string
  pathRelationIds: string[]
  sourcePhaseRadians: number
}

const PROPAGATING_RELATIONS = new Set<MechanismRelationType>([
  'meshes-with',
  'drives',
  'same-arbor',
  'impulses',
  'winds',
])

const ESCAPEMENT_PHASES: EscapementMotionPhase[] = [
  'locked-left',
  'unlock-left',
  'impulse-left',
  'drop-left',
  'locked-right',
  'unlock-right',
  'impulse-right',
  'drop-right',
]

function compareIds(left: { id: string }, right: { id: string }): number {
  return left.id.localeCompare(right.id)
}

function directionOf(value: number): -1 | 0 | 1 {
  if (value > 0) return 1
  if (value < 0) return -1
  return 0
}

function finite(value: number): boolean {
  return Number.isFinite(value)
}

function positiveInteger(value: MechanismValue | undefined): value is MechanismValue {
  return Boolean(value && Number.isInteger(value.value) && value.value > 0)
}

function weakestDataClass(values: MechanismDataClass[]): MechanismDataClass {
  const rank: MechanismDataClass[] = ['official', 'measured', 'estimated', 'conceptual', 'unknown']
  return rank[Math.max(...values.map((value) => rank.indexOf(value)))] ?? 'unknown'
}

function normalizedValue(value: MechanismValue | undefined): MechanismValue | undefined {
  return value ? { ...value, sourceIds: [...value.sourceIds].sort() } : undefined
}

function normalizedGraph(graph: MechanismMotionGraph): MechanismMotionGraph {
  return {
    ...structuredClone(graph),
    nodes: structuredClone(graph.nodes)
      .map((node) => ({
        ...node,
        ...(node.teeth ? { teeth: normalizedValue(node.teeth)! } : {}),
        ...(node.amplitudeRadians ? { amplitudeRadians: normalizedValue(node.amplitudeRadians)! } : {}),
        ...(node.frequencyHz ? { frequencyHz: normalizedValue(node.frequencyHz)! } : {}),
        limitations: [...node.limitations],
      }))
      .sort(compareIds),
    relations: structuredClone(graph.relations)
      .map((relation) => ({
        ...relation,
        ...(relation.ratio ? { ratio: normalizedValue(relation.ratio)! } : {}),
        ...(relation.driverTeeth ? { driverTeeth: normalizedValue(relation.driverTeeth)! } : {}),
        ...(relation.drivenTeeth ? { drivenTeeth: normalizedValue(relation.drivenTeeth)! } : {}),
        sourceIds: [...relation.sourceIds].sort(),
        limitations: [...relation.limitations],
      }))
      .sort(compareIds),
    ...(graph.escapement ? {
      escapement: {
        ...structuredClone(graph.escapement),
        escapeStepRadians: normalizedValue(graph.escapement.escapeStepRadians)!,
        frequencyHz: normalizedValue(graph.escapement.frequencyHz)!,
        oscillatorAmplitudeRadians: normalizedValue(graph.escapement.oscillatorAmplitudeRadians)!,
        palletAmplitudeRadians: normalizedValue(graph.escapement.palletAmplitudeRadians)!,
        sourceIds: [...graph.escapement.sourceIds].sort(),
        limitations: [...graph.escapement.limitations],
      },
    } : {}),
    sourceIds: [...graph.sourceIds].sort(),
    limitations: [...graph.limitations],
  }
}

function relationState(
  relation: MechanismMotionRelation,
  overrides: Record<string, MechanismRelationOverride>,
): { state: MechanismRelationState; contact: MechanismContactState } {
  const override = overrides[relation.id]
  return {
    state: override?.state ?? relation.state,
    contact: override?.contact ?? relation.contact,
  }
}

function contactAllowsTransmission(
  relationType: MechanismRelationType,
  contact: MechanismContactState,
): boolean {
  if (contact === 'confirmed' || contact === 'estimated') return true
  return contact === 'not-applicable' && (
    relationType === 'same-arbor'
    || relationType === 'drives'
    || relationType === 'winds'
  )
}

function relationRatio(
  relation: MechanismMotionRelation,
  fromNode: MechanismMotionNode,
  toNode: MechanismMotionNode,
): { ratio?: number; direction: -1 | 0 | 1; dataClass: MechanismDataClass } {
  if (relation.type === 'same-arbor') {
    return { ratio: 1, direction: 1, dataClass: relation.dataClass }
  }

  const driverTeeth = positiveInteger(relation.driverTeeth)
    ? relation.driverTeeth
    : positiveInteger(fromNode.teeth) ? fromNode.teeth : undefined
  const drivenTeeth = positiveInteger(relation.drivenTeeth)
    ? relation.drivenTeeth
    : positiveInteger(toNode.teeth) ? toNode.teeth : undefined

  if (relation.type === 'meshes-with' && driverTeeth && drivenTeeth) {
    return {
      ratio: driverTeeth.value / drivenTeeth.value,
      direction: relation.mesh === 'internal' ? 1 : -1,
      dataClass: weakestDataClass([driverTeeth.dataClass, drivenTeeth.dataClass]),
    }
  }

  if (relation.ratio && finite(relation.ratio.value) && relation.ratio.value > 0) {
    return {
      ratio: relation.ratio.value,
      direction: relation.type === 'meshes-with' && relation.mesh !== 'internal' ? -1 : 1,
      dataClass: relation.ratio.dataClass,
    }
  }

  return {
    ratio: undefined,
    direction: 0,
    dataClass: 'unknown',
  }
}

function phaseIndex(phase: EscapementMotionPhase | undefined): number {
  return phase ? ESCAPEMENT_PHASES.indexOf(phase) : 0
}

function isLockedPhase(phase: EscapementMotionPhase | undefined): boolean {
  return phase === 'locked-left' || phase === 'locked-right'
}

function isImpulsePhase(phase: EscapementMotionPhase | undefined): boolean {
  return phase === 'impulse-left' || phase === 'impulse-right'
}

function isReleasePhase(phase: EscapementMotionPhase | undefined): boolean {
  return Boolean(phase && !isLockedPhase(phase))
}

function escapementAdvanceSteps(phase: EscapementMotionPhase | undefined): number {
  const index = phaseIndex(phase)
  return Math.floor((index + 2) / 4)
}

function validateGraph(graph: MechanismMotionGraph): MechanismMotionDiagnostic[] {
  const diagnostics: MechanismMotionDiagnostic[] = []
  const nodeIds = new Set<string>()
  const relationIds = new Set<string>()

  if (graph.schemaVersion !== 1) diagnostics.push({
    code: 'MMG-SCHEMA',
    severity: 'error',
    message: `Versión de esquema no soportada: ${String(graph.schemaVersion)}.`,
  })

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) diagnostics.push({
      code: 'MMG-DUPLICATE-NODE',
      severity: 'error',
      message: `Nodo duplicado: ${node.id}.`,
      nodeIds: [node.id],
    })
    nodeIds.add(node.id)
    if (node.teeth && !positiveInteger(node.teeth)) diagnostics.push({
      code: 'MMG-INVALID-TEETH',
      severity: 'error',
      message: `El conteo de dientes de ${node.id} debe ser un entero positivo.`,
      nodeIds: [node.id],
    })
  }

  for (const relation of graph.relations) {
    if (relationIds.has(relation.id)) diagnostics.push({
      code: 'MMG-DUPLICATE-RELATION',
      severity: 'error',
      message: `Relación duplicada: ${relation.id}.`,
      relationIds: [relation.id],
    })
    relationIds.add(relation.id)
    if (!nodeIds.has(relation.fromId) || !nodeIds.has(relation.toId)) diagnostics.push({
      code: 'MMG-MISSING-NODE',
      severity: 'error',
      message: `La relación ${relation.id} referencia un nodo inexistente.`,
      nodeIds: [relation.fromId, relation.toId],
      relationIds: [relation.id],
    })
    for (const teeth of [relation.driverTeeth, relation.drivenTeeth]) {
      if (teeth && !positiveInteger(teeth)) diagnostics.push({
        code: 'MMG-INVALID-TEETH',
        severity: 'error',
        message: `La relación ${relation.id} contiene un conteo de dientes no válido.`,
        relationIds: [relation.id],
      })
    }
  }

  if (graph.escapement) {
    const requiredIds = [
      graph.escapement.escapeWheelId,
      graph.escapement.palletForkId,
      graph.escapement.oscillatorId,
      ...(graph.escapement.hairspringId ? [graph.escapement.hairspringId] : []),
    ]
    if (requiredIds.some((id) => !nodeIds.has(id))) diagnostics.push({
      code: 'MMG-ESCAPEMENT-NODE',
      severity: 'error',
      message: 'La configuración de escape referencia nodos inexistentes.',
      nodeIds: requiredIds,
    })
  }

  return diagnostics
}

export function validateMechanismMotionGraph(graph: MechanismMotionGraph): MechanismMotionDiagnostic[] {
  return validateGraph(normalizedGraph(graph))
}

function relationEvaluation(
  relation: MechanismMotionRelation,
  graphNodes: Map<string, MechanismMotionNode>,
  state: MechanismRelationState,
  contact: MechanismContactState,
): MechanismRelationEvaluation {
  const fromNode = graphNodes.get(relation.fromId)
  const toNode = graphNodes.get(relation.toId)
  const ratio = fromNode && toNode ? relationRatio(relation, fromNode, toNode) : undefined
  return {
    relationId: relation.id,
    state,
    contact,
    transmitting: state === 'engaged'
      && contactAllowsTransmission(relation.type, contact)
      && PROPAGATING_RELATIONS.has(relation.type)
      && ratio?.ratio !== undefined,
    ratio: ratio?.ratio,
    direction: ratio?.direction ?? 0,
    dataClass: ratio?.dataClass ?? 'unknown',
  }
}

function setBlocked(
  states: Map<string, MutableNodeState>,
  nodeId: string,
  status: 'blocked' | 'locked',
): void {
  const state = states.get(nodeId)
  if (!state) return
  state.status = status
  state.angularVelocityRadiansPerSecond = 0
}

function buildMotionProfile(
  node: MechanismMotionNode,
  state: MutableNodeState,
  request: Required<Pick<MechanismMotionRequest, 'reducedMotion' | 'discreteStep'>> & Pick<MechanismMotionRequest, 'escapementPhase'>,
  escapement: MechanismEscapement | undefined,
): MechanismMotionProfile {
  const active = state.status === 'active' || state.status === 'locked'
  const animation = !active ? 'none' : request.reducedMotion ? 'discrete' : 'continuous'
  const phase = node.phaseOffsetRadians ?? 0
  let phaseRadians = phase + state.sourcePhaseRadians
  let kind: MechanismMotionProfile['kind'] = 'none'
  let frequencyHz = 0
  let amplitudeRadians = 0
  let stepRadians = 0

  if (node.motion === 'rotation' && active) {
    kind = escapement?.escapeWheelId === node.id ? 'stepped-rotation' : 'continuous-rotation'
    if (escapement?.escapeWheelId === node.id) {
      stepRadians = escapement.escapeStepRadians.value
      phaseRadians += escapementAdvanceSteps(request.escapementPhase)
        * stepRadians
        * directionOf(state.angularVelocityRadiansPerSecond || 1)
    }
    if (request.reducedMotion) {
      const stepAngle = escapement?.escapeWheelId === node.id
        ? escapement.escapeStepRadians.value
        : positiveInteger(node.teeth) ? (Math.PI * 2) / node.teeth.value : 0
      phaseRadians += request.discreteStep * stepAngle * directionOf(state.angularVelocityRadiansPerSecond || 1)
    }
  }

  if ((node.motion === 'oscillation' || node.motion === 'pallet') && active) {
    kind = node.motion === 'pallet' ? 'pallet' : 'oscillation'
    const configuredFrequency = escapement && (
      escapement.oscillatorId === node.id
      || escapement.hairspringId === node.id
      || escapement.palletForkId === node.id
    ) ? escapement.frequencyHz : node.frequencyHz
    const configuredAmplitude = escapement && escapement.palletForkId === node.id
      ? escapement.palletAmplitudeRadians
      : escapement && (escapement.oscillatorId === node.id || escapement.hairspringId === node.id)
        ? escapement.oscillatorAmplitudeRadians
        : node.amplitudeRadians
    frequencyHz = configuredFrequency?.value ?? 0
    amplitudeRadians = configuredAmplitude?.value ?? 0
    if (request.reducedMotion && request.escapementPhase) {
      phaseRadians -= Math.cos(phaseIndex(request.escapementPhase) * Math.PI / 4) * amplitudeRadians
    }
  }

  return {
    kind,
    axis: [...node.axis],
    animation,
    angularVelocityRadiansPerSecond: state.angularVelocityRadiansPerSecond,
    frequencyHz,
    amplitudeRadians,
    phaseRadians,
    stepRadians,
  }
}

export function solveMechanismMotionGraph(
  inputGraph: MechanismMotionGraph,
  request: MechanismMotionRequest,
): MechanismMotionSolution {
  const graph = normalizedGraph(inputGraph)
  const diagnostics = validateGraph(graph)
  const graphNodes = new Map(graph.nodes.map((node) => [node.id, node]))
  const overrides = request.relationOverrides ?? {}
  const blockedNodes = new Set(request.blockedNodeIds ?? [])
  const reducedMotion = request.reducedMotion ?? false
  const discreteStep = Math.trunc(request.discreteStep ?? 0)
  const states = new Map<string, MutableNodeState>()

  for (const node of graph.nodes) {
    states.set(node.id, {
      nodeId: node.id,
      status: blockedNodes.has(node.id) ? 'blocked' : 'stopped',
      angularVelocityRadiansPerSecond: 0,
      pathRelationIds: [],
      sourcePhaseRadians: 0,
    })
  }

  const relationEvaluations = new Map<string, MechanismRelationEvaluation>()
  for (const relation of graph.relations) {
    const evaluatedState = relationState(relation, overrides)
    relationEvaluations.set(relation.id, relationEvaluation(
      relation,
      graphNodes,
      evaluatedState.state,
      evaluatedState.contact,
    ))
    if (evaluatedState.state === 'blocked') setBlocked(states, relation.toId, 'blocked')
    if (evaluatedState.state === 'unknown' || evaluatedState.contact === 'unknown') {
      const target = states.get(relation.toId)
      if (target && target.status === 'stopped') target.status = 'unknown'
    }
  }

  const lockedPhase = isLockedPhase(request.escapementPhase)
  for (const relation of graph.relations) {
    const evaluation = relationEvaluations.get(relation.id)!
    if (relation.type === 'locks'
      && evaluation.state === 'engaged'
      && contactAllowsTransmission(relation.type, evaluation.contact)) {
      if (!graph.escapement || lockedPhase) setBlocked(states, relation.toId, 'locked')
    }
  }

  const queue: string[] = []
  for (const source of [...request.sources].sort((left, right) => left.nodeId.localeCompare(right.nodeId))) {
    const state = states.get(source.nodeId)
    if (!state) {
      diagnostics.push({
        code: 'MMG-SOURCE-NODE',
        severity: 'error',
        message: `La fuente ${source.nodeId} no existe en el grafo.`,
        nodeIds: [source.nodeId],
      })
      continue
    }
    if (!finite(source.angularVelocityRadiansPerSecond)) {
      diagnostics.push({
        code: 'MMG-SOURCE-SPEED',
        severity: 'error',
        message: `La velocidad de ${source.nodeId} no es finita.`,
        nodeIds: [source.nodeId],
      })
      continue
    }
    if (state.status === 'blocked' || state.status === 'locked') continue
    state.angularVelocityRadiansPerSecond = source.angularVelocityRadiansPerSecond
    state.sourcePhaseRadians = source.phaseRadians ?? 0
    state.status = source.angularVelocityRadiansPerSecond === 0 ? 'stopped' : 'active'
    queue.push(source.nodeId)
  }

  const outgoing = new Map<string, MechanismMotionRelation[]>()
  for (const relation of graph.relations) {
    const list = outgoing.get(relation.fromId) ?? []
    list.push(relation)
    outgoing.set(relation.fromId, list)
  }
  for (const list of outgoing.values()) list.sort(compareIds)

  const visitCount = new Map<string, number>()
  while (queue.length > 0) {
    const fromId = queue.shift()!
    const fromState = states.get(fromId)!
    const count = (visitCount.get(fromId) ?? 0) + 1
    visitCount.set(fromId, count)
    if (count > graph.nodes.length + graph.relations.length) {
      diagnostics.push({
        code: 'MMG-CYCLE',
        severity: 'warning',
        message: `Se detuvo una propagación cíclica en ${fromId}.`,
        nodeIds: [fromId],
      })
      continue
    }

    for (const relation of outgoing.get(fromId) ?? []) {
      const evaluation = relationEvaluations.get(relation.id)!
      const target = states.get(relation.toId)
      if (!target || !PROPAGATING_RELATIONS.has(relation.type)) continue

      if (evaluation.state === 'disengaged' || evaluation.contact === 'separated') {
        if (target.status === 'stopped') target.status = 'disengaged'
        continue
      }
      if (evaluation.state === 'unknown' || evaluation.contact === 'unknown' || evaluation.ratio === undefined) {
        if (target.status === 'stopped') target.status = 'unknown'
        diagnostics.push({
          code: evaluation.ratio === undefined ? 'MMG-RATIO-UNKNOWN' : 'MMG-RELATION-UNKNOWN',
          severity: 'warning',
          message: `La relación ${relation.id} no puede transmitir sin datos suficientes.`,
          nodeIds: [relation.fromId, relation.toId],
          relationIds: [relation.id],
        })
        continue
      }
      if (evaluation.transmitting && target.status === 'locked' && fromState.status === 'active') {
        target.drivenByNodeId = fromId
        target.pathRelationIds = [...fromState.pathRelationIds, relation.id]
        continue
      }
      if (!evaluation.transmitting || target.status === 'blocked' || target.status === 'locked') continue
      if (fromState.status !== 'active') continue

      const velocity = fromState.angularVelocityRadiansPerSecond * evaluation.ratio * evaluation.direction
      if (target.status === 'active' && Math.abs(target.angularVelocityRadiansPerSecond - velocity) > 1e-9) {
        diagnostics.push({
          code: 'MMG-CONFLICTING-INPUT',
          severity: 'warning',
          message: `El nodo ${target.nodeId} recibe velocidades incompatibles; se conserva la primera ruta determinista.`,
          nodeIds: [target.nodeId],
          relationIds: [relation.id],
        })
        continue
      }
      if (target.status === 'active') continue
      target.angularVelocityRadiansPerSecond = velocity
      target.sourcePhaseRadians = fromState.sourcePhaseRadians
      target.status = directionOf(velocity) === 0 ? 'stopped' : 'active'
      target.drivenByNodeId = fromId
      target.pathRelationIds = [...fromState.pathRelationIds, relation.id]
      if (target.status === 'active') queue.push(target.nodeId)
    }
  }

  if (graph.escapement) {
    const escapeState = states.get(graph.escapement.escapeWheelId)
    const palletState = states.get(graph.escapement.palletForkId)
    const oscillatorState = states.get(graph.escapement.oscillatorId)
    const hairspringState = graph.escapement.hairspringId
      ? states.get(graph.escapement.hairspringId)
      : undefined
    const escapeReached = escapeState && (
      escapeState.status === 'active'
      || escapeState.status === 'locked'
      || escapeState.drivenByNodeId !== undefined
    )

    if (escapeReached && request.escapementPhase) {
      if (lockedPhase && escapeState) setBlocked(states, escapeState.nodeId, 'locked')
      if (isReleasePhase(request.escapementPhase) && escapeState?.status === 'locked') {
        escapeState.status = 'active'
      }
      if (palletState) {
        palletState.status = 'active'
        palletState.angularVelocityRadiansPerSecond = 0
      }
      for (const oscillatingState of [oscillatorState, hairspringState]) {
        if (!oscillatingState || oscillatingState.status === 'blocked') continue
        oscillatingState.status = 'active'
        oscillatingState.angularVelocityRadiansPerSecond = 0
      }
    }

    for (const relation of graph.relations) {
      const evaluation = relationEvaluations.get(relation.id)!
      if (relation.type === 'locks') evaluation.transmitting = lockedPhase && evaluation.state === 'engaged'
      if (relation.type === 'releases') evaluation.transmitting = isReleasePhase(request.escapementPhase)
        && evaluation.state === 'engaged'
        && contactAllowsTransmission(relation.type, evaluation.contact)
      if (relation.type === 'impulses' && graph.escapement && !isImpulsePhase(request.escapementPhase)) {
        evaluation.transmitting = false
      }
    }
  }

  for (const nodeId of blockedNodes) setBlocked(states, nodeId, 'blocked')

  const nodes = graph.nodes.map((node): MechanismNodeMotionState => {
    const state = states.get(node.id)!
    return {
      nodeId: node.id,
      status: state.status,
      angularVelocityRadiansPerSecond: state.angularVelocityRadiansPerSecond,
      direction: directionOf(state.angularVelocityRadiansPerSecond),
      ...(state.drivenByNodeId ? { drivenByNodeId: state.drivenByNodeId } : {}),
      pathRelationIds: [...state.pathRelationIds],
      motion: buildMotionProfile(node, state, {
        reducedMotion,
        discreteStep,
        escapementPhase: request.escapementPhase,
      }, graph.escapement),
    }
  })

  return {
    schemaVersion: 1,
    graphId: graph.id,
    graphVersion: graph.version,
    reducedMotion,
    ...(request.escapementPhase ? { escapementPhase: request.escapementPhase } : {}),
    discreteStep,
    nodes,
    relations: [...relationEvaluations.values()].sort((left, right) =>
      left.relationId.localeCompare(right.relationId)),
    diagnostics: diagnostics.sort((left, right) =>
      `${left.code}:${left.message}`.localeCompare(`${right.code}:${right.message}`)),
  }
}

export function mechanismMotionTransform(
  profile: MechanismMotionProfile,
  elapsedSeconds: number,
  playbackSpeed = 1,
): { rotation: Vec3; scale: number } {
  const safeElapsed = finite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0
  const safePlaybackSpeed = finite(playbackSpeed) ? Math.max(0, playbackSpeed) : 1
  let angle = profile.phaseRadians

  if (profile.animation === 'continuous') {
    if (profile.kind === 'continuous-rotation') {
      angle += safeElapsed * safePlaybackSpeed * profile.angularVelocityRadiansPerSecond
    } else if (profile.kind === 'stepped-rotation') {
      const step = profile.stepRadians
      if (step > 0) {
        const steps = Math.floor(
          safeElapsed
          * safePlaybackSpeed
          * Math.abs(profile.angularVelocityRadiansPerSecond)
          / step,
        )
        angle += steps * step * directionOf(profile.angularVelocityRadiansPerSecond)
      }
    } else if (profile.kind === 'oscillation' || profile.kind === 'pallet') {
      angle += Math.sin(safeElapsed * safePlaybackSpeed * profile.frequencyHz * Math.PI * 2) * profile.amplitudeRadians
    }
  }

  return {
    rotation: [
      profile.axis[0] * angle,
      profile.axis[1] * angle,
      profile.axis[2] * angle,
    ],
    scale: 1,
  }
}

export function serializeMechanismMotionGraph(graph: MechanismMotionGraph): string {
  const normalized = normalizedGraph(graph)
  const diagnostics = validateGraph(normalized)
  if (diagnostics.some(({ severity }) => severity === 'error')) {
    throw new Error(`No se puede serializar un grafo mecánico inválido: ${diagnostics.map(({ code }) => code).join(', ')}.`)
  }
  return JSON.stringify(normalized)
}

export function restoreMechanismMotionGraph(serialized: string): MechanismMotionGraph {
  const parsed: unknown = JSON.parse(serialized)
  if (!parsed || typeof parsed !== 'object') throw new Error('El grafo mecánico serializado no es un objeto.')
  const graph = parsed as MechanismMotionGraph
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.relations)) {
    throw new Error('El grafo mecánico serializado no contiene nodos y relaciones.')
  }
  const normalized = normalizedGraph(graph)
  const diagnostics = validateGraph(normalized)
  if (diagnostics.some(({ severity }) => severity === 'error')) {
    throw new Error(`El grafo mecánico serializado no es válido: ${diagnostics.map(({ code }) => code).join(', ')}.`)
  }
  return normalized
}

export function serializeMechanismMotionSolution(solution: MechanismMotionSolution): string {
  return JSON.stringify(structuredClone(solution))
}
