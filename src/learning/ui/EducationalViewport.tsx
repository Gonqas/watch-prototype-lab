import { memo, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PCFShadowMap, type Group } from 'three'
import {
  ContactShadows,
  Edges,
  Grid,
  Html,
  Line,
  OrbitControls,
} from '@react-three/drei'
import {
  ProceduralMechanismGeometry,
  SpringPrimitive,
} from './EducationalMechanismGeometry'
import { mechanismPrimitiveRotation } from './mechanismGeometryModel'
import type {
  CameraPose,
  EducationalSceneGraph,
  EducationalSpatialOverlay,
  EducationalVisualEntity,
  EducationalVisualPrimitive,
  EducationalVisualState,
  EnergyPathOverlay,
  RotationArcOverlay,
  SpatialArrowOverlay,
  SpatialLabelOverlay,
  Vec3,
  VisualEntityId,
} from '../visual/model'
import { visualMaterialFor } from '../visual/visualLanguage'
import {
  educationalMotionProfile,
  educationalMotionTransform,
  isEducationalMotionCover,
} from '../visual/educationalMotion'
import {
  mechanismMotionTransform,
  solveMechanismMotionGraph,
  type EscapementMotionPhase,
  type MechanismMotionSolution,
  type MechanismNodeMotionState,
} from '../visual/mechanismMotionGraph'
import { friendlyLearningTerm } from './learningUiLanguage'

export interface EducationalViewportProps {
  graphs: EducationalSceneGraph[]
  state: EducationalVisualState
  onSelectEntity?: (entityId: VisualEntityId) => void
  ariaLabel?: string
  showProvenance?: boolean
  showTechnicalIds?: boolean
  disabled?: boolean
  motionActive?: boolean
  motionFocus?: boolean
  playbackSpeed?: number
  timelineMs?: number
}

const DEFAULT_CAMERA: CameraPose = {
  position: [11, 8, 11],
  target: [0, 0, 0],
  up: [0, 1, 0],
  projection: 'perspective',
  fieldOfView: 32,
  orthographicScale: 12,
}

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

function explodeOffset(entity: EducationalVisualEntity, graph: EducationalSceneGraph, amount: number): Vec3 {
  if (!entity.bounds || !graph.bounds || amount <= 0) return [0, 0, 0]
  const delta: Vec3 = [
    entity.bounds.center[0] - graph.bounds.center[0],
    entity.bounds.center[1] - graph.bounds.center[1],
    entity.bounds.center[2] - graph.bounds.center[2],
  ]
  const length = Math.hypot(...delta)
  const direction: Vec3 = length > 0.001
    ? [delta[0] / length, delta[1] / length, delta[2] / length]
    : [0, 1, 0]
  const distance = amount * Math.max(0.5, graph.bounds.radius * 0.55)
  return [direction[0] * distance, direction[1] * distance, direction[2] * distance]
}

function primitiveGeometry(primitive: EducationalVisualPrimitive) {
  return <ProceduralMechanismGeometry primitive={primitive} />
}

function EntityPrimitive({
  primitive,
  entity,
  selected,
  highlighted,
  dimmed,
  opacity,
  showProvenance,
}: {
  primitive: EducationalVisualPrimitive
  entity: EducationalVisualEntity
  selected: boolean
  highlighted: boolean
  dimmed: boolean
  opacity: number
  showProvenance: boolean
}) {
  const material = visualMaterialFor(entity.subsystem, entity.provenanceClass)
  const effectiveOpacity = Math.max(0.04, Math.min(1, opacity * primitive.opacityHint * (dimmed ? 0.28 : 1)))
  const emissive = selected ? '#31aeb8' : highlighted ? '#be8b32' : '#000000'
  const emissiveIntensity = selected ? 0.8 : highlighted ? 0.45 : 0
  if (primitive.shape === 'spiral') {
    return (
      <SpringPrimitive
        primitive={primitive}
        color={selected ? '#64e5eb' : material.color}
        opacity={effectiveOpacity}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    )
  }
  return (
    <mesh
      position={primitive.position}
      rotation={mechanismPrimitiveRotation(primitive)}
      castShadow
      receiveShadow
    >
      {primitiveGeometry(primitive)}
      <meshStandardMaterial
        color={material.color}
        roughness={material.roughness}
        metalness={material.metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={effectiveOpacity < 0.999}
        opacity={effectiveOpacity}
        wireframe={showProvenance && entity.provenanceClass === 'unknown'}
        depthWrite={effectiveOpacity > 0.45}
      />
      {(selected || highlighted || (showProvenance && material.outline !== 'none')) && (
        <Edges
          color={selected ? '#80f4f7' : highlighted ? '#f2c36c' : '#34464a'}
          threshold={12}
          scale={material.outline === 'thick' || material.outline === 'double' ? 1.025 : 1.01}
        />
      )}
    </mesh>
  )
}

const RenderEntity = memo(function RenderEntity({
  entity,
  graph,
  state,
  onSelect,
  showProvenance,
  disabled,
  motionActive,
  motionFocus,
  playbackSpeed,
  timelineMs,
  mechanismMotion,
}: {
  entity: EducationalVisualEntity
  graph: EducationalSceneGraph
  state: EducationalVisualState
  onSelect?: (entityId: VisualEntityId) => void
  showProvenance: boolean
  disabled: boolean
  motionActive: boolean
  motionFocus: boolean
  playbackSpeed: number
  timelineMs: number
  mechanismMotion?: MechanismNodeMotionState
}) {
  const group = useRef<Group>(null)
  const profile = useMemo(() => educationalMotionProfile(entity), [entity])
  const center = useMemo<Vec3>(() => entity.bounds?.center ?? [0, 0, 0], [entity.bounds])
  const mountState = state.mounts[entity.mountId]
  const isolated = mountState?.isolatedEntityIds ?? []
  const hidden = !mountState
    || !entity.renderable
    || entity.instanceState === 'deleted'
    || mountState.hiddenEntityIds.includes(entity.id)
    || (isolated.length > 0 && !isolated.includes(entity.id))
  const selected = mountState?.selectedEntityIds.includes(entity.id) ?? false
  const highlighted = mountState?.highlightedEntityIds.includes(entity.id) ?? false
  const dimmed = mountState?.dimmedEntityIds.includes(entity.id) ?? false
  const opacity = mountState?.transparency[entity.id] ?? 1
  const offset = explodeOffset(entity, graph, mountState?.explode[entity.id] ?? 0)
  const reducedMotion = state.reducedMotion
  useEffect(() => {
    if (!group.current || !reducedMotion) return
    group.current.position.set(
      center[0] + offset[0],
      center[1] + offset[1],
      center[2] + offset[2],
    )
    group.current.rotation.set(0, 0, 0)
    group.current.scale.setScalar(1)
  }, [center, offset, reducedMotion])
  useFrame(({ clock }, delta) => {
    const current = group.current
    if (!current) return
    const targetX = center[0] + offset[0]
    const targetY = center[1] + offset[1]
    const targetZ = center[2] + offset[2]
    const interpolation = reducedMotion ? 1 : 1 - Math.exp(-Math.max(0, delta) * 10)
    current.position.x += (targetX - current.position.x) * interpolation
    current.position.y += (targetY - current.position.y) * interpolation
    current.position.z += (targetZ - current.position.z) * interpolation
    if (!motionActive || reducedMotion) {
      current.rotation.set(0, 0, 0)
      current.scale.setScalar(1)
      return
    }
    const transform = mechanismMotion
      ? mechanismMotionTransform(
          mechanismMotion.motion,
          clock.elapsedTime + timelineMs / 1_000,
          playbackSpeed,
        )
      : educationalMotionTransform(
          profile,
          clock.elapsedTime + timelineMs / 1_000,
          playbackSpeed,
        )
    current.rotation.set(...transform.rotation)
    current.scale.setScalar(transform.scale)
  })
  const coversMechanism = motionFocus && isEducationalMotionCover(entity, graph)
  if (hidden || coversMechanism) return null
  return (
    <group
      ref={group}
      name={entity.id}
      userData={{ visualEntityId: entity.id, instanceId: entity.instanceId }}
      position={[
        center[0] + offset[0],
        center[1] + offset[1],
        center[2] + offset[2],
      ]}
      onClick={(event) => {
        event.stopPropagation()
        if (!disabled) onSelect?.(entity.id)
      }}
    >
      <group position={[-center[0], -center[1], -center[2]]}>
        {entity.primitives.map((primitive) => (
          <EntityPrimitive
            key={primitive.id}
            primitive={primitive}
            entity={entity}
            selected={selected}
            highlighted={highlighted}
            dimmed={dimmed}
            opacity={opacity}
            showProvenance={showProvenance}
          />
        ))}
      </group>
    </group>
  )
})

function PulsingLine({
  points,
  color,
  width,
  dashed,
  animated,
  opacity = 1,
}: {
  points: Vec3[]
  color: string
  width: number
  dashed?: boolean
  animated: boolean
  opacity?: number
}) {
  const group = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const pulse = animated ? 1 + Math.sin(clock.elapsedTime * Math.PI * 3) * 0.012 : 1
    group.current.scale.setScalar(pulse)
  })
  return (
    <group ref={group}>
      <Line
        points={points}
        color={color}
        lineWidth={width}
        dashed={dashed}
        transparent
        opacity={animated ? opacity : opacity * 0.82}
      />
    </group>
  )
}

function ArrowOverlayView({ overlay, reducedMotion }: { overlay: SpatialArrowOverlay; reducedMotion: boolean }) {
  const opacity = overlay.state === 'dimmed' ? 0.35 : overlay.state === 'blocked' ? 0.7 : 1
  return (
    <group visible={overlay.state !== 'hidden'}>
      <PulsingLine
        points={overlay.linePoints}
        color={overlay.style.color}
        width={overlay.style.thickness}
        dashed={overlay.style.pattern !== 'solid'}
        animated={!reducedMotion && overlay.state === 'active'}
        opacity={opacity}
      />
      {overlay.arrowHead.length > 1 && (
        <Line points={overlay.arrowHead} color={overlay.style.color} lineWidth={overlay.style.thickness} opacity={opacity} />
      )}
    </group>
  )
}

function RotationOverlayView({ overlay, reducedMotion }: { overlay: RotationArcOverlay; reducedMotion: boolean }) {
  return (
    <group visible={overlay.state !== 'hidden'}>
      <PulsingLine
        points={overlay.points}
        color={overlay.style.color}
        width={overlay.style.thickness}
        dashed={overlay.style.pattern !== 'solid'}
        animated={!reducedMotion && overlay.animated}
        opacity={overlay.state === 'dimmed' ? 0.35 : 1}
      />
      <Html position={overlay.points.at(-1) ?? overlay.center} center distanceFactor={8}>
        <span className="educational-overlay-symbol" aria-hidden="true">
          {overlay.direction === 'clockwise' ? '↻' : overlay.direction === 'counterclockwise' ? '↺' : '?'}
        </span>
      </Html>
    </group>
  )
}

function EnergyPathOverlayView({ overlay, reducedMotion }: { overlay: EnergyPathOverlay; reducedMotion: boolean }) {
  return (
    <group visible={overlay.state !== 'hidden'}>
      {overlay.segments.map((segment, index) => (
        <PulsingLine
          key={segment.id}
          points={segment.points}
          color={segment.state === 'blocked' ? '#d06962' : segment.state === 'unknown' ? '#8d9595' : overlay.style.color}
          width={index === overlay.activeIndex ? overlay.style.thickness + 1.5 : overlay.style.thickness}
          dashed={segment.state === 'unknown' || overlay.style.pattern !== 'solid'}
          animated={!reducedMotion && overlay.animated && index === overlay.activeIndex}
          opacity={segment.state === 'available' ? 0.55 : 1}
        />
      ))}
      {overlay.nodes.slice(0, 40).map((node, index) => (
        <Html key={node.id} position={node.point} center distanceFactor={9}>
          <span className={`educational-path-node educational-path-node--${node.state}`} title={node.label}>
            {overlay.numbered ? index + 1 : '•'}
          </span>
        </Html>
      ))}
    </group>
  )
}

function LabelOverlayView({ overlay }: { overlay: SpatialLabelOverlay }) {
  if (overlay.state === 'hidden') return null
  return (
    <Html position={overlay.point} center distanceFactor={10}>
      <span className={`educational-spatial-label educational-spatial-label--${overlay.state}`}>
        <small>{overlay.namespaceLabel}</small>
        {overlay.text}
      </span>
    </Html>
  )
}

function OverlayView({ overlay, reducedMotion }: { overlay: EducationalSpatialOverlay; reducedMotion: boolean }) {
  if (overlay.kind === 'arrow') return <ArrowOverlayView overlay={overlay} reducedMotion={reducedMotion} />
  if (overlay.kind === 'rotation-arc') return <RotationOverlayView overlay={overlay} reducedMotion={reducedMotion} />
  if (overlay.kind === 'energy-path') return <EnergyPathOverlayView overlay={overlay} reducedMotion={reducedMotion} />
  return <LabelOverlayView overlay={overlay} />
}

function MechanismRelationView({
  graph,
  solution,
  motionFocus,
}: {
  graph: EducationalSceneGraph
  solution?: MechanismMotionSolution
  motionFocus: boolean
}) {
  if (!graph.mechanism || !solution) return null
  const entityById = new Map<string, EducationalVisualEntity>(
    graph.entities.map((entity) => [entity.id, entity]),
  )
  const evaluationById = new Map(solution.relations.map((relation) => [relation.relationId, relation]))
  const visibleRelations = graph.mechanism.graph.relations.filter(({ type }) =>
    motionFocus
    || type === 'meshes-with'
    || type === 'locks'
    || type === 'releases'
    || type === 'impulses')
  return (
    <group name={`mechanism-relations:${graph.mountId}`}>
      {visibleRelations.map((relation) => {
        const from = entityById.get(relation.fromId)?.bounds?.center
        const to = entityById.get(relation.toId)?.bounds?.center
        const evaluation = evaluationById.get(relation.id)
        if (!from || !to || !evaluation) return null
        const color = evaluation.contact === 'separated'
          ? '#dc6f65'
          : evaluation.contact === 'unknown'
            ? '#8d9595'
            : evaluation.transmitting
              ? '#72e0d3'
              : '#5f7778'
        const midpoint: Vec3 = [
          (from[0] + to[0]) / 2,
          (from[1] + to[1]) / 2,
          (from[2] + to[2]) / 2,
        ]
        return (
          <group key={relation.id}>
            <Line
              points={[from, to]}
              color={color}
              lineWidth={motionFocus ? 1.8 : 0.75}
              dashed={!evaluation.transmitting}
              transparent
              opacity={motionFocus ? 0.82 : 0.28}
            />
            {relation.type === 'meshes-with' && (
              <mesh position={midpoint}>
                <sphereGeometry args={[motionFocus ? 0.045 : 0.025, 12, 8]} />
                <meshBasicMaterial color={color} transparent opacity={motionFocus ? 0.95 : 0.45} />
              </mesh>
            )}
          </group>
        )
      })}
      {motionFocus && graph.mechanism.defaultSource && (() => {
        const source = entityById.get(
          graph.mechanism.energySourceNodeId ?? graph.mechanism.defaultSource.nodeId,
        )
        if (!source?.bounds) return null
        return (
          <Html position={source.bounds.center} center distanceFactor={9}>
            <span className="educational-mechanism-source">Inicio de la energía</span>
          </Html>
        )
      })()}
    </group>
  )
}

function ApplyCamera({ pose }: { pose: CameraPose }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(...pose.position)
    camera.up.set(...pose.up)
    camera.lookAt(...pose.target)
  }, [camera, pose])
  return null
}

function ViewportCanvas({
  graphs,
  state,
  viewportId,
  onSelect,
  showProvenance,
  disabled,
  motionActive,
  motionFocus,
  playbackSpeed,
  timelineMs,
}: {
  graphs: EducationalSceneGraph[]
  state: EducationalVisualState
  viewportId: string
  onSelect?: (entityId: VisualEntityId) => void
  showProvenance: boolean
  disabled: boolean
  motionActive: boolean
  motionFocus: boolean
  playbackSpeed: number
  timelineMs: number
}) {
  const pose = state.cameras[viewportId]?.pose ?? state.cameras.common?.pose ?? DEFAULT_CAMERA
  const overlays = state.overlays.filter((overlay) =>
    overlay.kind === 'label'
      ? !overlay.entityId || graphs.some(({ entityIds }) => entityIds.includes(overlay.entityId!))
      : overlay.kind === 'energy-path'
        ? overlay.nodes.some(({ entityId }) => graphs.some(({ entityIds }) => entityIds.includes(entityId)))
        : overlay.entityIds.some((entityId) => graphs.some(({ entityIds }) => entityIds.includes(entityId))))
  const mechanismSolutions = useMemo(() => {
    const solutionByMount = new Map<string, MechanismMotionSolution>()
    for (const graph of graphs) {
      const binding = graph.mechanism
      if (!binding) continue
      const phaseOffset = motionActive ? 2 : 0
      const phase = ESCAPEMENT_PHASES[
        (Math.floor(Math.max(0, timelineMs) / 260) + phaseOffset) % ESCAPEMENT_PHASES.length
      ]
      solutionByMount.set(graph.mountId, solveMechanismMotionGraph(binding.graph, {
        sources: binding.defaultSource ? [binding.defaultSource] : [],
        escapementPhase: phase,
        reducedMotion: state.reducedMotion,
        discreteStep: Math.floor(Math.max(0, timelineMs) / 260),
      }))
    }
    return solutionByMount
  }, [graphs, motionActive, state.reducedMotion, timelineMs])
  const mechanismNodeMotion = useMemo(() => new Map(
    [...mechanismSolutions.values()].flatMap((solution) =>
      solution.nodes.map((node) => [node.nodeId, node] as const)),
  ), [mechanismSolutions])
  return (
    <Canvas
      className="educational-viewport-canvas"
      shadows={{ type: PCFShadowMap }}
      dpr={[1, 1.75]}
      frameloop={state.reducedMotion ? 'demand' : 'always'}
      camera={{ position: pose.position, fov: pose.fieldOfView, near: 0.05, far: 500 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#101617']} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#d9ece7', '#2c2620', 1.15]} />
      <directionalLight position={[7, 11, 5]} intensity={2.4} castShadow />
      <directionalLight position={[-6, 3, -4]} intensity={0.75} color="#94b8c5" />
      <ApplyCamera pose={pose} />
      {graphs.map((graph) => (
        <group key={graph.mountId} name={`mount:${graph.mountId}`}>
          {graph.entities.map((entity) => (
            <RenderEntity
              key={entity.objectKey}
              entity={entity}
              graph={graph}
              state={state}
              onSelect={onSelect}
              showProvenance={showProvenance}
              disabled={disabled}
              motionActive={motionActive}
              motionFocus={motionFocus}
              playbackSpeed={playbackSpeed}
              timelineMs={timelineMs}
              mechanismMotion={mechanismNodeMotion.get(entity.id)}
            />
          ))}
          <MechanismRelationView
            graph={graph}
            solution={mechanismSolutions.get(graph.mountId)}
            motionFocus={motionFocus}
          />
        </group>
      ))}
      {overlays.slice(0, 80).map((overlay) => (
        <OverlayView key={overlay.id} overlay={overlay} reducedMotion={state.reducedMotion} />
      ))}
      <Grid
        position={[0, -0.45, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.35}
        cellColor="#283638"
        sectionSize={5}
        sectionThickness={0.65}
        sectionColor="#3b5052"
        fadeDistance={35}
        infiniteGrid
      />
      <ContactShadows position={[0, -0.42, 0]} opacity={0.38} scale={30} blur={2.5} far={25} />
      <OrbitControls
        makeDefault
        target={pose.target}
        enableDamping={!state.reducedMotion}
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={80}
      />
    </Canvas>
  )
}

function fixtureDisplayName(fixtureId: string): string {
  if (fixtureId.includes('miyota.2035')) return 'MIYOTA 2035'
  if (fixtureId.includes('miyota.8215')) return 'MIYOTA 8215'
  if (fixtureId.includes('conceptual.quartz')) return 'Cadena conceptual de cuarzo'
  if (fixtureId.includes('conceptual.mechanical')) return 'Movimiento mecánico conceptual'
  return fixtureId
    .replace(/^fixture\./, '')
    .replaceAll(/[._-]+/g, ' ')
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
}

function viewportGroups(graphs: EducationalSceneGraph[], state: EducationalVisualState, showTechnicalIds: boolean): Array<{
  id: string
  graphs: EducationalSceneGraph[]
  label: string
}> {
  if (state.layout === 'single' || state.layout === 'overlay') {
    return [{
      id: 'common',
      graphs,
      label: graphs.map((graph) => showTechnicalIds ? graph.mountId : fixtureDisplayName(graph.fixtureId)).join(' + '),
    }]
  }
  return graphs.map((graph) => ({
    id: graph.mountId,
    graphs: [graph],
    label: showTechnicalIds ? graph.mountId : fixtureDisplayName(graph.fixtureId),
  }))
}

export function EducationalViewport({
  graphs,
  state,
  onSelectEntity,
  ariaLabel = 'Composición visual educativa',
  showProvenance = false,
  showTechnicalIds = false,
  disabled = false,
  motionActive = false,
  motionFocus = false,
  playbackSpeed = 1,
  timelineMs = 0,
}: EducationalViewportProps) {
  const groups = viewportGroups(graphs, state, showTechnicalIds)
  const layoutClass = state.layout === 'quad'
    ? 'is-quad'
    : state.layout === 'split-vertical'
      ? 'is-split-vertical'
      : state.layout === 'split-horizontal'
        ? 'is-split-horizontal'
        : 'is-single'
  const entities = graphs.flatMap(({ entities: values }) => values)
  return (
    <div className={`educational-viewport ${layoutClass}`} role="group" aria-label={ariaLabel}>
      <div className="educational-viewport-grid" aria-hidden="true">
        {groups.map((group) => (
          <section className="educational-viewport-cell" key={group.id}>
            <span className="educational-viewport-mount-label">{group.label}</span>
            <ViewportCanvas
              graphs={group.graphs}
              state={state}
              viewportId={group.id}
              onSelect={onSelectEntity}
              showProvenance={showProvenance}
              disabled={disabled}
              motionActive={motionActive}
              motionFocus={motionFocus}
              playbackSpeed={playbackSpeed}
              timelineMs={timelineMs}
            />
          </section>
        ))}
      </div>
      <div className="educational-viewport-text-alternative">
        <p>{entities.length} piezas presentes en {graphs.length} {graphs.length === 1 ? 'modelo' : 'modelos'}.</p>
        <ol>
          {entities.map((entity) => {
            const mount = state.mounts[entity.mountId]
            const selected = mount?.selectedEntityIds.includes(entity.id) ?? false
            const hidden = mount?.hiddenEntityIds.includes(entity.id) ?? false
            return (
              <li key={entity.id}>
                {entity.name}; {showTechnicalIds ? `montura ${entity.mountId}` : `modelo ${fixtureDisplayName(graphs.find(({ mountId }) => mountId === entity.mountId)?.fixtureId ?? entity.mountId)}`};
                {' '}parte {friendlyLearningTerm(entity.subsystem ?? 'desconocida')};
                origen {friendlyLearningTerm(entity.provenanceClass)}; {hidden ? 'oculta' : 'visible'}; {selected ? 'seleccionada' : 'no seleccionada'}.
              </li>
            )
          })}
        </ol>
        <h2>Indicaciones visuales y secuencias</h2>
        <ol>
          {state.overlays.map((overlay) => <li key={overlay.id}>{overlay.accessibleAlternative}</li>)}
        </ol>
      </div>
    </div>
  )
}

export default EducationalViewport
