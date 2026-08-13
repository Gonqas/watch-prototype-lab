import { Suspense, createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Line,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  TransformControls,
  useTexture,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  buildCycloidalPinionOutline,
  buildCycloidalWheelOutline,
  buildInvoluteOutline,
  gearInputFromArbor,
  type InvoluteGearInput,
} from '../core/gears'
import { buildAssemblyPrimitives, crystalRadialProfile, dialRadialProfile, assemblyStack } from './geometry'
import { evaluateProject } from './engine'
import { calculateTrain, wheelTipRadius } from './mechanics'
import { valueOf, type CaseSpec, type GearToothProfile, type MechanicalArbor, type RenderMode, type SurfaceAppearance, type WatchPartId, type WatchProject } from './model'
import { useStudioStore } from './store'
import { useStudioLearningViewportOverlay, type StudioLearningViewportOverlay } from '../learning/integrations/studioViewportBridge'

export type CameraPreset = 'iso' | 'top' | 'front' | 'side'

interface ViewportProps {
  cameraPreset: CameraPreset
}

function useViewportTimer(): THREE.Timer {
  const timer = useMemo(() => new THREE.Timer(), [])
  useEffect(() => {
    timer.connect(document)
    return () => { timer.dispose() }
  }, [timer])
  return timer
}

const TECHNICAL_COLORS: Record<WatchPartId, string> = {
  case: '#4a88e8',
  back: '#6c7b91',
  bezel: '#7b9ee8',
  rehaut: '#55728a',
  strap: '#8b6246',
  clasp: '#aeb7c2',
  springBar: '#c9ced4',
  dialGraphics: '#e6d8b2',
  movement: '#b46ce8',
  plate: '#a778d2',
  bridge: '#d6a95c',
  barrel: '#d99738',
  center: '#e2c15a',
  third: '#54b986',
  fourth: '#42a7cc',
  escape: '#d77085',
  balance: '#de7d4b',
  pallet: '#e7877f',
  hairspring: '#68a7cc',
  mainspring: '#d3a856',
  jewel: '#d44969',
  keyless: '#7b9aa5',
  rotor: '#b6a06f',
  dial: '#32b86b',
  hourHand: '#f1a11a',
  minuteHand: '#f0cf35',
  secondHand: '#ef4f58',
  crystal: '#36b6d6',
  stem: '#b8bec8',
  crown: '#d6dae0',
  holder: '#7f8c91',
  gasket: '#446f68',
}

const BEAUTY_COLORS: Partial<Record<WatchPartId, string>> = {
  case: '#bfc4c9',
  back: '#9ea5aa',
  movement: '#d2b36c',
  plate: '#c8ad73',
  bridge: '#d4b36e',
  barrel: '#d0a344',
  center: '#d7b54f',
  third: '#c7a94e',
  fourth: '#d1b356',
  escape: '#bfc4c9',
  balance: '#d3a94b',
  dial: '#244b3d',
  hourHand: '#e2e5e7',
  minuteHand: '#e2e5e7',
  secondHand: '#d9484e',
  crown: '#bfc4c9',
  stem: '#9ea5aa',
}

function richRender(renderMode: RenderMode): boolean {
  return renderMode !== 'technical'
}

function projectSurface(project: WatchProject, part: WatchPartId): SurfaceAppearance {
  if (part === 'dial' || part === 'dialGraphics' || part === 'rehaut') return project.presentation.dialSurface
  if (part === 'hourHand' || part === 'minuteHand' || part === 'secondHand') return project.presentation.handsSurface
  if (part === 'strap') return project.presentation.strapSurface
  if (part === 'bezel') return project.presentation.bezelSurface
  return project.presentation.caseSurface
}

function projectColor(project: WatchProject, part: WatchPartId, fallback: string, beauty: boolean): string {
  if (!beauty) return fallback
  const surface = projectSurface(project, part)
  if (['case', 'back', 'bezel', 'rehaut', 'strap', 'clasp', 'springBar', 'dialGraphics', 'dial', 'hourHand', 'minuteHand', 'secondHand'].includes(part)) return surface.color
  if (part === 'case' || part === 'back' || part === 'crown') {
    if (project.case.material === 'black-pvd') return '#24282a'
    if (project.case.material === 'titanium') return '#929a9d'
    if (project.case.material === 'brass') return '#c99b4a'
  }
  if (part === 'dial') return project.dial.color
  if (part === 'hourHand') return project.hands.hour.color
  if (part === 'minuteHand') return project.hands.minute.color
  if (part === 'secondHand') return project.hands.second.color
  return fallback
}

function partAppearance(
  part: WatchPartId,
  selected: boolean,
  hasError: boolean,
  hasWarning: boolean,
  beauty: boolean,
): { color: string; emissive: string; emissiveIntensity: number } {
  const color = beauty ? (BEAUTY_COLORS[part] ?? TECHNICAL_COLORS[part]) : TECHNICAL_COLORS[part]
  if (hasError) return { color: '#e5484d', emissive: '#6c1016', emissiveIntensity: 0.7 }
  if (selected) return { color, emissive: '#1c7f8c', emissiveIntensity: 0.65 }
  if (hasWarning) return { color, emissive: '#744707', emissiveIntensity: 0.24 }
  return { color, emissive: '#000000', emissiveIntensity: 0 }
}

interface PartStateContextValue {
  selectedPart: WatchPartId
  errorParts: Set<WatchPartId>
  warningParts: Set<WatchPartId>
  learning: StudioLearningViewportOverlay
}

const PartStateContext = createContext<PartStateContextValue>({
  selectedPart: 'movement',
  errorParts: new Set(),
  warningParts: new Set(),
  learning: {
    active: false, selectedParts: [], visibleParts: [], hiddenParts: [], isolatedParts: [], highlightedParts: [],
    transparency: {}, explode: 0, overlays: [],
  },
})

function usePartState(part: WatchPartId) {
  const context = useContext(PartStateContext)
  const forcedVisible = context.learning.visibleParts.includes(part)
  const hidden = !forcedVisible && (context.learning.hiddenParts.includes(part)
    || (context.learning.isolatedParts.length > 0 && !context.learning.isolatedParts.includes(part)))
  return {
    selected: context.selectedPart === part || context.learning.selectedParts.includes(part),
    hasError: context.errorParts.has(part),
    hasWarning: context.warningParts.has(part) || context.learning.highlightedParts.includes(part),
    hidden,
    forcedVisible,
    opacity: context.learning.transparency[part] ?? 1,
  }
}

function shouldRenderPart(normal: boolean, part: WatchPartId, learning: StudioLearningViewportOverlay): boolean {
  if (learning.visibleParts.includes(part)) return true
  if (learning.hiddenParts.includes(part)) return false
  if (learning.isolatedParts.length > 0) return learning.isolatedParts.includes(part)
  return normal
}

function annulusGeometry(outerRadius: number, innerRadius: number, height: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, Math.max(0.01, innerRadius), 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 96,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -height / 2, 0)
  geometry.computeVertexNormals()
  return geometry
}

function roundedRectanglePath(shape: THREE.Shape, width: number, length: number, radius: number): void {
  const halfWidth = width / 2
  const halfLength = length / 2
  const corner = Math.min(radius, halfWidth, halfLength)
  shape.moveTo(-halfWidth + corner, -halfLength)
  shape.lineTo(halfWidth - corner, -halfLength)
  shape.quadraticCurveTo(halfWidth, -halfLength, halfWidth, -halfLength + corner)
  shape.lineTo(halfWidth, halfLength - corner)
  shape.quadraticCurveTo(halfWidth, halfLength, halfWidth - corner, halfLength)
  shape.lineTo(-halfWidth + corner, halfLength)
  shape.quadraticCurveTo(-halfWidth, halfLength, -halfWidth, halfLength - corner)
  shape.lineTo(-halfWidth, -halfLength + corner)
  shape.quadraticCurveTo(-halfWidth, -halfLength, -halfWidth + corner, -halfLength)
}

function caseShellGeometry(
  shapeType: CaseSpec['shape'],
  outerRadius: number,
  innerRadius: number,
  height: number,
): THREE.ExtrudeGeometry {
  if (shapeType === 'round') return annulusGeometry(outerRadius, innerRadius, height)
  const diameter = outerRadius * 2
  const shape = new THREE.Shape()
  if (shapeType === 'cushion') {
    roundedRectanglePath(shape, diameter, diameter * 0.96, diameter * 0.22)
  } else if (shapeType === 'rectangular') {
    roundedRectanglePath(shape, diameter * 0.82, diameter * 1.06, diameter * 0.08)
  } else {
    const width = diameter * 0.9
    const length = diameter * 1.06
    shape.moveTo(-width * 0.3, -length / 2)
    shape.lineTo(width * 0.3, -length / 2)
    shape.bezierCurveTo(width * 0.46, -length / 2, width / 2, -length * 0.25, width / 2, 0)
    shape.bezierCurveTo(width / 2, length * 0.25, width * 0.46, length / 2, width * 0.3, length / 2)
    shape.lineTo(-width * 0.3, length / 2)
    shape.bezierCurveTo(-width * 0.46, length / 2, -width / 2, length * 0.25, -width / 2, 0)
    shape.bezierCurveTo(-width / 2, -length * 0.25, -width * 0.46, -length / 2, -width * 0.3, -length / 2)
  }
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, Math.max(0.01, innerRadius), 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 96,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -height / 2, 0)
  geometry.computeVertexNormals()
  return geometry
}

function AnnulusMesh({
  outerRadius,
  innerRadius,
  height,
  position,
  part,
  opacity,
  shape,
  clippingPlanes,
}: {
  outerRadius: number
  innerRadius: number
  height: number
  position: [number, number, number]
  part: WatchPartId
  opacity: number
  shape?: CaseSpec['shape']
  clippingPlanes: THREE.Plane[]
}) {
  const geometry = useMemo(
    () => (shape ? caseShellGeometry(shape, outerRadius, innerRadius, height) : annulusGeometry(outerRadius, innerRadius, height)),
    [outerRadius, innerRadius, height, shape],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  const renderMode = useStudioStore((state) => state.renderMode)
  const project = useStudioStore((state) => state.project)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const state = usePartState(part)
  const appearance = partAppearance(part, state.selected, state.hasError, state.hasWarning, richRender(renderMode))
  appearance.color = projectColor(project, part, appearance.color, richRender(renderMode))
  const surface = projectSurface(project, part)
  if (state.hidden) return null
  const resolvedOpacity = opacity * state.opacity
  return (
    <mesh
      geometry={geometry}
      position={position}
      castShadow
      receiveShadow
      onPointerDown={(event) => {
        event.stopPropagation()
        setSelectedPart(part)
      }}
    >
      <meshPhysicalMaterial
        {...appearance}
        metalness={richRender(renderMode) ? surface.metalness : 0.35}
        roughness={richRender(renderMode) ? surface.roughness : 0.48}
        clearcoat={richRender(renderMode) ? surface.clearcoat : 0}
        clearcoatRoughness={Math.min(1, surface.roughness * 0.7)}
        transparent={resolvedOpacity < 1}
        opacity={resolvedOpacity}
        clippingPlanes={clippingPlanes}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ProfileMesh({
  part,
  points,
  explode,
  clippingPlanes,
  editable = false,
}: {
  part: 'dial' | 'crystal'
  points: Array<{ radius: number; z: number }>
  explode: number
  clippingPlanes: THREE.Plane[]
  editable?: boolean
}) {
  const geometry = useMemo(
    () => new THREE.LatheGeometry(points.map((point) => new THREE.Vector2(point.radius, point.z)), 128),
    [points],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  const renderMode = useStudioStore((state) => state.renderMode)
  const project = useStudioStore((state) => state.project)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const updateDial = useStudioStore((state) => state.updateDial)
  const meshRef = useRef<THREE.Mesh>(null)
  const state = usePartState(part)
  const appearance = partAppearance(part, state.selected, state.hasError, state.hasWarning, richRender(renderMode))
  appearance.color = projectColor(project, part, appearance.color, richRender(renderMode))
  if (state.hidden) return null
  if (part === 'crystal') {
    return (
      <mesh
        geometry={geometry}
        position={[0, explode, 0]}
        castShadow
        onPointerDown={(event) => {
          event.stopPropagation()
          setSelectedPart(part)
        }}
      >
        <meshPhysicalMaterial
          color={appearance.color}
          emissive={appearance.emissive}
          emissiveIntensity={appearance.emissiveIntensity}
          metalness={0}
          roughness={richRender(renderMode) ? 0.035 : 0.16}
          transmission={richRender(renderMode) ? 0.97 : 0.45}
          thickness={1}
          transparent
          opacity={(richRender(renderMode) ? 0.42 : 0.24) * state.opacity}
          depthWrite={false}
          clippingPlanes={clippingPlanes}
          side={THREE.DoubleSide}
        />
      </mesh>
    )
  }
  const dialMesh = (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, explode, 0]}
      castShadow
      receiveShadow
      onPointerDown={(event) => {
        event.stopPropagation()
        setSelectedPart(part)
      }}
    >
      <meshPhysicalMaterial
        {...appearance}
        metalness={richRender(renderMode) ? project.presentation.dialSurface.metalness : 0.15}
        roughness={richRender(renderMode) ? project.presentation.dialSurface.roughness : 0.6}
        clearcoat={richRender(renderMode) ? project.presentation.dialSurface.clearcoat : 0}
        transparent={state.opacity < 1}
        opacity={state.opacity}
        clippingPlanes={clippingPlanes}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
  if (editable && state.selected) {
    return (
      <TransformControls
        mode="translate"
        showX={false}
        showY
        showZ={false}
        size={0.78}
        onMouseUp={() => {
          if (!meshRef.current) return
          const delta = meshRef.current.position.y - explode
          meshRef.current.position.y = explode
          if (Math.abs(delta) > 0.0001) updateDial('seatZ', valueOf(project.dial.seatZ) + delta)
        }}
      >
        {dialMesh}
      </TransformControls>
    )
  }
  return dialMesh
}

function RodMesh({
  part,
  start,
  end,
  width,
  thickness,
  explode,
  clippingPlanes,
}: {
  part: WatchPartId
  start: { x: number; y: number; z: number }
  end: { x: number; y: number; z: number }
  width: number
  thickness: number
  explode: number
  clippingPlanes: THREE.Plane[]
}) {
  const renderMode = useStudioStore((state) => state.renderMode)
  const project = useStudioStore((state) => state.project)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const state = usePartState(part)
  const appearance = partAppearance(part, state.selected, state.hasError, state.hasWarning, richRender(renderMode))
  appearance.color = projectColor(project, part, appearance.color, richRender(renderMode))
  const surface = projectSurface(project, part)
  const startWorld = useMemo(() => new THREE.Vector3(start.x, start.z + explode, start.y), [start, explode])
  const endWorld = useMemo(() => new THREE.Vector3(end.x, end.z + explode, end.y), [end, explode])
  const direction = useMemo(() => endWorld.clone().sub(startWorld), [endWorld, startWorld])
  const length = direction.length()
  const center = useMemo(() => startWorld.clone().add(endWorld).multiplyScalar(0.5), [startWorld, endWorld])
  const isStem = part === 'stem'
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        isStem ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0),
        direction.clone().normalize(),
      ),
    [direction, isStem],
  )
  if (state.hidden) return null
  return (
    <mesh
      position={center}
      quaternion={quaternion}
      castShadow
      onPointerDown={(event) => {
        event.stopPropagation()
        setSelectedPart(part)
      }}
    >
      {isStem ? (
        <cylinderGeometry args={[width / 2, width / 2, length, 18]} />
      ) : (
        <boxGeometry args={[Math.max(0.001, length), Math.max(0.02, thickness), Math.max(0.04, width)]} />
      )}
      <meshPhysicalMaterial
        {...appearance}
        metalness={richRender(renderMode) ? surface.metalness : 0.75}
        roughness={richRender(renderMode) ? surface.roughness : 0.24}
        clearcoat={richRender(renderMode) ? surface.clearcoat : 0}
        transparent={state.opacity < 1}
        opacity={state.opacity}
        clippingPlanes={clippingPlanes}
      />
    </mesh>
  )
}

function quartzOutlineGeometry(width: number, length: number, height: number): THREE.ExtrudeGeometry {
  const halfWidth = width / 2
  const halfLength = length / 2
  const shape = new THREE.Shape()
  shape.moveTo(-halfWidth * 0.35, -halfLength)
  shape.lineTo(halfWidth * 0.42, -halfLength)
  shape.quadraticCurveTo(halfWidth, -halfLength, halfWidth, -halfLength * 0.42)
  shape.lineTo(halfWidth, -halfLength * 0.14)
  shape.lineTo(halfWidth * 0.82, -halfLength * 0.05)
  shape.lineTo(halfWidth, halfLength * 0.08)
  shape.lineTo(halfWidth, halfLength * 0.48)
  shape.quadraticCurveTo(halfWidth, halfLength, halfWidth * 0.35, halfLength)
  shape.lineTo(-halfWidth * 0.3, halfLength)
  shape.quadraticCurveTo(-halfWidth, halfLength, -halfWidth, halfLength * 0.35)
  shape.lineTo(-halfWidth, -halfLength * 0.38)
  shape.quadraticCurveTo(-halfWidth, -halfLength, -halfWidth * 0.35, -halfLength)
  shape.closePath()
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(0.12, height * 0.08),
    bevelThickness: Math.min(0.08, height * 0.06),
    curveSegments: 32,
  })
  geometry.center()
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

function QuartzOutlineMesh({
  width,
  length,
  height,
  position,
  appearance,
  clippingPlanes,
  onSelect,
}: {
  width: number
  length: number
  height: number
  position: [number, number, number]
  appearance: { color: string; emissive: string; emissiveIntensity: number }
  clippingPlanes: THREE.Plane[]
  onSelect: () => void
}) {
  const geometry = useMemo(() => quartzOutlineGeometry(width, length, height), [width, length, height])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh
      geometry={geometry}
      position={position}
      castShadow
      receiveShadow
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <meshStandardMaterial {...appearance} metalness={0.32} roughness={0.5} clippingPlanes={clippingPlanes} />
    </mesh>
  )
}

function PrimitiveMesh({
  primitive,
  explode,
  clippingPlanes,
}: {
  primitive: ReturnType<typeof buildAssemblyPrimitives>[number]
  explode: number
  clippingPlanes: THREE.Plane[]
}) {
  const renderMode = useStudioStore((state) => state.renderMode)
  const project = useStudioStore((state) => state.project)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const state = usePartState(primitive.part)
  const appearance = partAppearance(
    primitive.part,
    state.selected,
    state.hasError,
    state.hasWarning,
    richRender(renderMode),
  )
  appearance.color = projectColor(project, primitive.part, appearance.color, richRender(renderMode))
  const surface = projectSurface(project, primitive.part)
  if (state.hidden) return null
  if (primitive.kind === 'annulus') {
    return (
      <AnnulusMesh
        outerRadius={primitive.radius ?? 1}
        innerRadius={primitive.innerRadius ?? 0.5}
        height={primitive.height ?? 0.2}
        position={[primitive.x, primitive.z + explode, primitive.y]}
        part={primitive.part}
        opacity={primitive.part === 'bridge' ? 0.78 : 1}
        shape={primitive.part === 'case' ? project.case.shape : undefined}
        clippingPlanes={clippingPlanes}
      />
    )
  }
  if (primitive.kind === 'rod' && primitive.start && primitive.end) {
    return (
      <RodMesh
        part={primitive.part}
        start={primitive.start}
        end={primitive.end}
        width={primitive.width ?? 0.2}
        thickness={primitive.height ?? 0.1}
        explode={explode}
        clippingPlanes={clippingPlanes}
      />
    )
  }
  const position: [number, number, number] = [primitive.x, primitive.z + explode, primitive.y]
  const common = {
    position,
    castShadow: true,
    receiveShadow: true,
    onPointerDown: (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      setSelectedPart(primitive.part)
    },
  }
  const material = (
    <meshPhysicalMaterial
      {...appearance}
      metalness={richRender(renderMode) ? surface.metalness : primitive.part === 'dial' ? 0.18 : 0.72}
      roughness={richRender(renderMode) ? surface.roughness : primitive.part === 'dial' ? 0.55 : 0.28}
      clearcoat={richRender(renderMode) ? surface.clearcoat : 0}
      clearcoatRoughness={Math.min(1, surface.roughness * 0.7)}
      transparent={state.opacity < 1}
      opacity={state.opacity}
      clippingPlanes={clippingPlanes}
    />
  )
  if (primitive.kind === 'rounded-box') {
    return (
      <RoundedBox
        args={[primitive.width ?? 1, primitive.height ?? 1, primitive.length ?? 1]}
        radius={1.6}
        smoothness={5}
        rotation={[0, primitive.rotation ?? 0, 0]}
        {...common}
      >
        {material}
      </RoundedBox>
    )
  }
  if (primitive.kind === 'quartz-outline') {
    return (
      <QuartzOutlineMesh
        width={primitive.width ?? 1}
        length={primitive.length ?? 1}
        height={primitive.height ?? 0.2}
        position={position}
        appearance={appearance}
        clippingPlanes={clippingPlanes}
        onSelect={() => setSelectedPart(primitive.part)}
      />
    )
  }
  if (primitive.kind === 'box') {
    return (
      <mesh {...common} rotation={[0, primitive.rotation ?? 0, 0]}>
        <boxGeometry args={[primitive.width ?? 1, primitive.height ?? 0.2, primitive.length ?? 1]} />
        {material}
      </mesh>
    )
  }
  return (
    <mesh {...common} rotation={[0, 0, primitive.rotation ?? 0]}>
      <cylinderGeometry args={[primitive.radius ?? 1, primitive.radius ?? 1, primitive.height ?? 0.2, 96]} />
      {material}
    </mesh>
  )
}

const HAND_PARTS = ['hourHand', 'minuteHand', 'secondHand'] as const
type HandPart = (typeof HAND_PARTS)[number]

const handKeyByPart: Record<HandPart, 'hour' | 'minute' | 'second'> = {
  hourHand: 'hour',
  minuteHand: 'minute',
  secondHand: 'second',
}

function HandPrimitiveGroup({
  part,
  primitives,
  explode,
  editable,
  clippingPlanes,
}: {
  part: HandPart
  primitives: ReturnType<typeof buildAssemblyPrimitives>
  explode: number
  editable: boolean
  clippingPlanes: THREE.Plane[]
}) {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const updateHand = useStudioStore((state) => state.updateHand)
  const groupRef = useRef<THREE.Group>(null)
  const handKey = handKeyByPart[part]
  const content = (
    <group ref={groupRef} position={[0, explode, 0]}>
      {primitives.map((primitive) => (
        <PrimitiveMesh key={primitive.id} primitive={primitive} explode={0} clippingPlanes={clippingPlanes} />
      ))}
    </group>
  )
  if (editable && selectedPart === part) {
    return (
      <TransformControls
        mode="translate"
        showX={false}
        showY
        showZ={false}
        size={0.72}
        onMouseUp={() => {
          if (!groupRef.current) return
          const delta = groupRef.current.position.y - explode
          groupRef.current.position.y = explode
          if (Math.abs(delta) > 0.0001) {
            updateHand(handKey, 'mountingHeight', valueOf(project.hands[handKey].mountingHeight) + delta)
          }
        }}
      >
        {content}
      </TransformControls>
    )
  }
  return content
}

function gearGeometry(
  input: InvoluteGearInput,
  thickness: number,
  pivotRadius: number,
  cutouts: boolean,
  profile: GearToothProfile,
  mateTeeth: number,
  usePinion: boolean,
): THREE.ExtrudeGeometry {
  const outline = profile === 'cycloidal'
    ? usePinion
      ? buildCycloidalPinionOutline(mateTeeth, input.teeth, input.module, input.backlash)
      : buildCycloidalWheelOutline(input.teeth, mateTeeth, input.module, input.backlash, input.teeth > 60 ? 5 : 7)
    : buildInvoluteOutline(input, input.teeth > 60 ? 4 : 7)
  const teeth = Math.max(6, Math.round(input.teeth))
  const pitch = (teeth * input.module) / 2
  const shape = new THREE.Shape()
  outline.forEach((point, index) => index === 0 ? shape.moveTo(point.x, point.y) : shape.lineTo(point.x, point.y))
  shape.closePath()
  const centerHole = new THREE.Path()
  centerHole.absarc(0, 0, Math.max(0.04, pivotRadius), 0, Math.PI * 2, true)
  shape.holes.push(centerHole)
  if (cutouts && pitch > 2.4) {
    const count = pitch > 5 ? 5 : 4
    const orbit = pitch * 0.55
    const holeRadius = Math.min(1.25, pitch * 0.16)
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2
      const hole = new THREE.Path()
      hole.absarc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, holeRadius, 0, Math.PI * 2, true)
      shape.holes.push(hole)
    }
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 24,
  })
  geometry.center()
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

function GearMesh({
  arbor,
  usePinion = false,
  module,
  thickness,
  pivotRadius,
  y,
  part,
  cutouts,
  profile,
  mateTeeth,
  clippingPlanes,
}: {
  arbor: MechanicalArbor
  usePinion?: boolean
  module: number
  thickness: number
  pivotRadius: number
  y: number
  part: WatchPartId
  cutouts: boolean
  profile: GearToothProfile
  mateTeeth: number
  clippingPlanes: THREE.Plane[]
}) {
  const geometry = useMemo(
    () => gearGeometry({ ...gearInputFromArbor(arbor, usePinion), module }, thickness, pivotRadius, cutouts, profile, mateTeeth, usePinion),
    [arbor, usePinion, module, thickness, pivotRadius, cutouts, profile, mateTeeth],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  const renderMode = useStudioStore((state) => state.renderMode)
  const state = usePartState(part)
  const appearance = partAppearance(part, state.selected, state.hasError, state.hasWarning, richRender(renderMode))
  return (
    <mesh geometry={geometry} position={[0, y, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        {...appearance}
        metalness={0.8}
        roughness={richRender(renderMode) ? 0.21 : 0.36}
        clippingPlanes={clippingPlanes}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ArborGroup({
  arbor,
  index,
  previousModule,
  speedRph,
  zOffset,
  editable,
  clippingPlanes,
}: {
  arbor: MechanicalArbor
  index: number
  previousModule: number
  speedRph: number
  zOffset: number
  editable: boolean
  clippingPlanes: THREE.Plane[]
}) {
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const project = useStudioStore((state) => state.project)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const moveArbor = useStudioStore((state) => state.moveArbor)
  const simulate = useStudioStore((state) => state.simulate)
  const showDimensions = useStudioStore((state) => state.showDimensions)
  const outerRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Group>(null)
  const animationTimer = useViewportTimer()
  const selected = selectedPart === arbor.id
  const direction = index % 2 === 0 ? 1 : -1
  const jewelOuterRadius = valueOf(arbor.jewelOuterDiameter ?? arbor.pivotDiameter) / 2
  const jewelInnerRadius = valueOf(arbor.jewelHoleDiameter ?? arbor.pivotDiameter) / 2
  const previousArbor = project.movement.kind === 'mechanical' ? project.movement.arbors[index - 1] : undefined
  const nextArbor = project.movement.kind === 'mechanical' ? project.movement.arbors[index + 1] : undefined
  const trainBase = project.movement.kind === 'mechanical' ? valueOf(project.movement.trainBaseZ) : 0
  const bridgeTop = project.movement.kind === 'mechanical' ? valueOf(project.movement.bridgeTopZ) : 3
  const pivotSpan = Math.max(0.1, bridgeTop - trainBase - 0.28)
  const wheelProfile = nextArbor ? arbor.profileToNext ?? 'cycloidal' : 'involute'
  const pinionProfile = previousArbor?.profileToNext ?? 'cycloidal'
  const springPoints = useMemo((): [number, number, number][] => {
    if (arbor.id !== 'barrel' || project.movement.kind !== 'mechanical') return []
    const turns = valueOf(project.movement.mainspring?.turnsWorking ?? project.movement.barrelTurns, 6.5)
    const outerRadius = Math.max(0.6, wheelTipRadius(arbor, nextArbor) - 0.65)
    return Array.from({ length: 220 }, (_, pointIndex) => {
      const ratio = pointIndex / 219
      const angle = ratio * turns * Math.PI * 2
      const radius = 0.22 + ratio * (outerRadius - 0.22)
      return [Math.cos(angle) * radius, valueOf(arbor.wheelZ) - 0.01, Math.sin(angle) * radius]
    })
  }, [arbor, nextArbor, project.movement])
  useFrame((_state, delta) => {
    animationTimer.update()
    if (!simulate || !spinRef.current) return
    const visualScale = 2
    spinRef.current.rotation.y += (direction * speedRph * visualScale * Math.PI * 2 * delta) / 3600
    if (speedRph > 100) spinRef.current.rotation.y = animationTimer.getElapsed() * direction * 1.8
  })
  const content = (
    <group
      ref={outerRef}
      position={[valueOf(arbor.x), zOffset, valueOf(arbor.y)]}
      onPointerDown={(event) => {
        event.stopPropagation()
        setSelectedPart(arbor.id)
      }}
    >
      <group ref={spinRef}>
        {arbor.id === 'barrel' && (
          <>
            <mesh position={[0, valueOf(arbor.wheelZ) - 0.42, 0]} castShadow>
              <cylinderGeometry
                args={[
                  Math.max(1, (valueOf(arbor.wheelTeeth) * valueOf(arbor.moduleToNext)) / 2 - 0.55),
                  Math.max(1, (valueOf(arbor.wheelTeeth) * valueOf(arbor.moduleToNext)) / 2 - 0.55),
                  0.8,
                  96,
                ]}
              />
              <meshStandardMaterial color="#b88a3f" metalness={0.72} roughness={0.32} clippingPlanes={clippingPlanes} />
            </mesh>
            <Line points={springPoints} color="#e0b868" lineWidth={1.25} />
          </>
        )}
        <GearMesh
          arbor={arbor}
          module={valueOf(arbor.moduleToNext)}
          thickness={valueOf(arbor.wheelThickness)}
          pivotRadius={valueOf(arbor.pivotDiameter) / 2}
          y={valueOf(arbor.wheelZ)}
          part={arbor.id}
          cutouts={arbor.id !== 'barrel' && arbor.id !== 'escape'}
          profile={wheelProfile}
          mateTeeth={valueOf(nextArbor?.pinionTeeth ?? arbor.pinionTeeth)}
          clippingPlanes={clippingPlanes}
        />
        {index > 0 && (
          <GearMesh
            arbor={arbor}
            usePinion
            module={previousModule}
            thickness={valueOf(arbor.pinionThickness)}
            pivotRadius={valueOf(arbor.pivotDiameter) / 2}
            y={valueOf(arbor.pinionZ)}
            part={arbor.id}
            cutouts={false}
            profile={pinionProfile}
            mateTeeth={valueOf(previousArbor?.wheelTeeth ?? arbor.wheelTeeth)}
            clippingPlanes={clippingPlanes}
          />
        )}
        <mesh position={[0, 0.14 + pivotSpan / 2, 0]} castShadow>
          <cylinderGeometry args={[valueOf(arbor.pivotDiameter) / 2, valueOf(arbor.pivotDiameter) / 2, pivotSpan, 20]} />
          <meshStandardMaterial color="#d9dde0" metalness={0.9} roughness={0.18} clippingPlanes={clippingPlanes} />
        </mesh>
        {arbor.jewelOuterDiameter && arbor.jewelHoleDiameter && (
          <>
            {[0.13, Math.max(0.16, bridgeTop - trainBase - 0.16)].map((height) => {
              const outer = jewelOuterRadius
              const inner = jewelInnerRadius
              return (
                <mesh key={height} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[(outer + inner) / 2, Math.max(0.025, (outer - inner) / 2), 12, 48]} />
                  <meshPhysicalMaterial color="#b30d3e" transmission={0.22} roughness={0.2} metalness={0.05} clippingPlanes={clippingPlanes} />
                </mesh>
              )
            })}
          </>
        )}
      </group>
      {selected && showDimensions && (
        <Html position={[0, Math.max(valueOf(arbor.wheelZ), valueOf(arbor.pinionZ)) + 1.1, 0]} center distanceFactor={18}>
          <div className="scene-label">
            <strong>{arbor.name}</strong>
            <span>{Math.round(valueOf(arbor.wheelTeeth))}T · {valueOf(arbor.moduleToNext).toFixed(3)}M · {wheelProfile === 'cycloidal' ? 'CIC' : 'INV'}</span>
          </div>
        </Html>
      )}
    </group>
  )
  if (editable && selected) {
    return (
      <TransformControls
        mode="translate"
        showX
        showY={false}
        showZ
        size={0.72}
        onMouseUp={() => {
          if (outerRef.current) moveArbor(arbor.id, outerRef.current.position.x, outerRef.current.position.z)
        }}
      >
        {content}
      </TransformControls>
    )
  }
  return content
}

function BalanceAssembly({
  zOffset,
  editable,
  clippingPlanes,
}: {
  zOffset: number
  editable: boolean
  clippingPlanes: THREE.Plane[]
}) {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const moveBalance = useStudioStore((state) => state.moveBalance)
  const simulate = useStudioStore((state) => state.simulate)
  const outerRef = useRef<THREE.Group>(null)
  const oscillatorRef = useRef<THREE.Group>(null)
  const animationTimer = useViewportTimer()
  const selected = selectedPart === 'balance'
  const state = usePartState('balance')
  const balanceDiameter = project.movement.kind === 'mechanical' ? valueOf(project.movement.balance.diameter) : 0
  const spiral = useMemo(() => {
    const points: [number, number, number][] = []
    for (let index = 0; index <= 150; index += 1) {
      const angle = (index / 150) * Math.PI * 10
      const radius = 0.18 + (balanceDiameter * 0.32 * index) / 150
      points.push([Math.cos(angle) * radius, 0.16, Math.sin(angle) * radius])
    }
    return points
  }, [balanceDiameter])
  useFrame(() => {
    animationTimer.update()
    if (!oscillatorRef.current) return
    oscillatorRef.current.rotation.y = simulate ? Math.sin(animationTimer.getElapsed() * 9) * 0.55 : 0
  })
  if (project.movement.kind !== 'mechanical') return null
  const balance = project.movement.balance
  const appearance = partAppearance('balance', selected, state.hasError, state.hasWarning, false)
  const content = (
    <group
      ref={outerRef}
      position={[valueOf(balance.x), zOffset, valueOf(balance.y)]}
      onPointerDown={(event) => {
        event.stopPropagation()
        setSelectedPart('balance')
      }}
    >
      <group ref={oscillatorRef} position={[0, valueOf(balance.z), 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[valueOf(balance.diameter) / 2 - 0.28, 0.22, 16, 96]} />
          <meshStandardMaterial {...appearance} metalness={0.78} roughness={0.25} clippingPlanes={clippingPlanes} />
        </mesh>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.18, valueOf(balance.thickness), 24]} />
          <meshStandardMaterial color="#d8dce0" metalness={0.88} roughness={0.18} clippingPlanes={clippingPlanes} />
        </mesh>
        <Line points={spiral} color="#84b8ba" lineWidth={1.15} />
      </group>
    </group>
  )
  if (editable && selected) {
    return (
      <TransformControls
        mode="translate"
        showX
        showY={false}
        showZ
        size={0.72}
        onMouseUp={() => {
          if (outerRef.current) moveBalance(outerRef.current.position.x, outerRef.current.position.z)
        }}
      >
        {content}
      </TransformControls>
    )
  }
  return content
}

function PalletAssembly({ zOffset, clippingPlanes }: { zOffset: number; clippingPlanes: THREE.Plane[] }) {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const simulate = useStudioStore((state) => state.simulate)
  const palletRef = useRef<THREE.Group>(null)
  const animationTimer = useViewportTimer()
  const palletState = usePartState('pallet')
  useFrame(() => {
    animationTimer.update()
    if (palletRef.current) palletRef.current.rotation.y = simulate ? Math.sin(animationTimer.getElapsed() * 9) * 0.16 : 0
  })
  if (project.movement.kind !== 'mechanical') return null
  const escape = project.movement.arbors.find((arbor) => arbor.id === 'escape')
  if (!escape) return null
  const x = valueOf(escape.x) * 0.62 + valueOf(project.movement.balance.x) * 0.38
  const y = valueOf(escape.y) * 0.62 + valueOf(project.movement.balance.y) * 0.38
  const plane = zOffset + Math.max(valueOf(escape.wheelZ), valueOf(project.movement.balance.z)) + 0.24
  const appearance = partAppearance('pallet', selectedPart === 'pallet', palletState.hasError, palletState.hasWarning, false)
  const escapementType = project.movement.escapement.type
  return (
    <group
      ref={palletRef}
      position={[x, plane, y]}
      onPointerDown={(event) => { event.stopPropagation(); setSelectedPart('pallet') }}
    >
      {escapementType === 'swiss-lever' && (
        <>
          <mesh rotation={[0, 0.42, 0]} castShadow><boxGeometry args={[3.2, 0.18, 0.42]} /><meshStandardMaterial {...appearance} metalness={0.76} roughness={0.28} clippingPlanes={clippingPlanes} /></mesh>
          <mesh rotation={[0, -0.58, 0]} castShadow><boxGeometry args={[2.4, 0.18, 0.34]} /><meshStandardMaterial {...appearance} metalness={0.76} roughness={0.28} clippingPlanes={clippingPlanes} /></mesh>
          <mesh position={[1.18, 0.02, 0.84]} rotation={[0, 0.42, 0]}><boxGeometry args={[0.46, 0.24, 0.3]} /><meshPhysicalMaterial color="#c92055" roughness={0.2} transmission={0.18} clippingPlanes={clippingPlanes} /></mesh>
          <mesh position={[-0.94, 0.02, 0.74]} rotation={[0, -0.58, 0]}><boxGeometry args={[0.46, 0.24, 0.3]} /><meshPhysicalMaterial color="#c92055" roughness={0.2} transmission={0.18} clippingPlanes={clippingPlanes} /></mesh>
        </>
      )}
      {escapementType === 'co-axial' && (
        <>
          <mesh position={[-0.65, -0.12, 0]}><cylinderGeometry args={[1.42, 1.42, 0.12, 18]} /><meshStandardMaterial {...appearance} metalness={0.8} roughness={0.25} clippingPlanes={clippingPlanes} /></mesh>
          <mesh position={[0.65, 0.1, 0]}><cylinderGeometry args={[1.05, 1.05, 0.12, 12]} /><meshStandardMaterial color="#c59f4f" metalness={0.82} roughness={0.24} clippingPlanes={clippingPlanes} /></mesh>
          <mesh position={[0, 0.2, 1.25]} rotation={[0, 0.2, 0]}><boxGeometry args={[3.5, 0.16, 0.32]} /><meshStandardMaterial {...appearance} metalness={0.74} roughness={0.3} clippingPlanes={clippingPlanes} /></mesh>
        </>
      )}
      {escapementType === 'detent' && (
        <>
          <mesh position={[0, 0, 0.75]} rotation={[0, -0.2, 0]}><boxGeometry args={[5.4, 0.12, 0.2]} /><meshStandardMaterial {...appearance} metalness={0.78} roughness={0.22} clippingPlanes={clippingPlanes} /></mesh>
          <mesh position={[1.55, 0.1, 0.2]}><boxGeometry args={[0.3, 0.22, 1.2]} /><meshPhysicalMaterial color="#c92055" roughness={0.2} transmission={0.18} clippingPlanes={clippingPlanes} /></mesh>
          <mesh position={[-2.1, 0, 0.7]}><cylinderGeometry args={[0.16, 0.16, 0.46, 18]} /><meshStandardMaterial color="#d8dce0" metalness={0.9} roughness={0.16} clippingPlanes={clippingPlanes} /></mesh>
        </>
      )}
      <mesh><cylinderGeometry args={[0.2, 0.2, 0.48, 24]} /><meshStandardMaterial color="#d8dce0" metalness={0.88} roughness={0.16} clippingPlanes={clippingPlanes} /></mesh>
    </group>
  )
}

function KeylessAssembly({ zOffset, clippingPlanes }: { zOffset: number; clippingPlanes: THREE.Plane[] }) {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const keylessState = usePartState('keyless')
  if (project.movement.kind !== 'mechanical') return null
  const radius = valueOf(project.movement.plateDiameter) / 2
  const appearance = partAppearance('keyless', selectedPart === 'keyless', keylessState.hasError, keylessState.hasWarning, false)
  return (
    <group
      position={[radius * 0.55, zOffset + valueOf(project.movement.stemAxisZ), 0]}
      onPointerDown={(event) => { event.stopPropagation(); setSelectedPart('keyless') }}
    >
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.78, 0.78, 0.22, 20]} /><meshStandardMaterial {...appearance} metalness={0.78} roughness={0.3} clippingPlanes={clippingPlanes} /></mesh>
      <mesh position={[-1.28, 0.04, 0.72]}><cylinderGeometry args={[1.12, 1.12, 0.2, 28]} /><meshStandardMaterial {...appearance} metalness={0.78} roughness={0.3} clippingPlanes={clippingPlanes} /></mesh>
      <mesh position={[-2.1, 0.02, -0.15]} rotation={[0, -0.34, 0]}><boxGeometry args={[2.6, 0.16, 0.34]} /><meshStandardMaterial {...appearance} metalness={0.72} roughness={0.34} clippingPlanes={clippingPlanes} /></mesh>
      <mesh position={[-3.1, 0.04, -0.82]}><cylinderGeometry args={[0.22, 0.22, 0.42, 18]} /><meshPhysicalMaterial color="#b30d3e" roughness={0.2} transmission={0.2} clippingPlanes={clippingPlanes} /></mesh>
    </group>
  )
}

function automaticRotorGeometry(outerRadius: number, bearingRadius: number, thickness: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(outerRadius, 0)
  shape.absarc(0, 0, outerRadius, 0, Math.PI, false)
  shape.closePath()
  const bearing = new THREE.Path()
  bearing.absarc(0, 0, bearingRadius, 0, Math.PI * 2, true)
  shape.holes.push(bearing)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(0.08, thickness * 0.12),
    bevelThickness: Math.min(0.06, thickness * 0.1),
    curveSegments: 128,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, -thickness / 2, 0)
  geometry.computeVertexNormals()
  return geometry
}

function AutomaticRotor({ zOffset, editable, clippingPlanes }: { zOffset: number; editable: boolean; clippingPlanes: THREE.Plane[] }) {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const updateAutomatic = useStudioStore((state) => state.updateAutomatic)
  const renderMode = useStudioStore((state) => state.renderMode)
  const simulate = useStudioStore((state) => state.simulate)
  const rotorState = usePartState('rotor')
  const outerRef = useRef<THREE.Group>(null)
  const rotorRef = useRef<THREE.Group>(null)
  const animationTimer = useViewportTimer()
  const automatic = project.movement.kind === 'mechanical' ? project.movement.automatic : undefined
  const outerRadius = automatic ? valueOf(automatic.rotorDiameter) / 2 : 1
  const bearingRadius = automatic ? valueOf(automatic.bearingDiameter) / 2 : 0.2
  const thickness = automatic ? valueOf(automatic.rotorThickness) : 0.2
  const geometry = useMemo(
    () => automaticRotorGeometry(outerRadius, bearingRadius, thickness),
    [outerRadius, bearingRadius, thickness],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  const appearance = partAppearance(
    'rotor',
    selectedPart === 'rotor',
    rotorState.hasError,
    rotorState.hasWarning,
    richRender(renderMode),
  )
  useFrame(() => {
    animationTimer.update()
    if (!rotorRef.current) return
    rotorRef.current.rotation.y = simulate
      ? Math.sin(animationTimer.getElapsed() * 1.35) * 1.65 + Math.sin(animationTimer.getElapsed() * 0.37) * 0.45
      : 0
  })
  if (project.movement.kind !== 'mechanical' || project.movement.architecture !== 'automatic' || !automatic) return null
  const content = (
    <group
      ref={outerRef}
      position={[0, zOffset + valueOf(automatic.rotorZ) + thickness / 2, 0]}
      onPointerDown={(event) => {
        event.stopPropagation()
        setSelectedPart('rotor')
      }}
    >
      <group ref={rotorRef}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            {...appearance}
            metalness={0.84}
            roughness={richRender(renderMode) ? 0.2 : 0.34}
            clippingPlanes={clippingPlanes}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <cylinderGeometry args={[bearingRadius * 1.55, bearingRadius * 1.55, thickness * 0.82, 64]} />
          <meshStandardMaterial color="#aab0b2" metalness={0.9} roughness={0.18} clippingPlanes={clippingPlanes} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[bearingRadius, Math.max(0.08, bearingRadius * 0.14), 18, 64]} />
          <meshStandardMaterial color="#1e2528" metalness={0.82} roughness={0.25} clippingPlanes={clippingPlanes} />
        </mesh>
        {[0.38, Math.PI - 0.38].map((angle) => (
          <mesh
            key={angle}
            position={[Math.cos(angle) * outerRadius * 0.38, 0, Math.sin(angle) * outerRadius * 0.38]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[outerRadius * 0.76, thickness * 0.72, Math.max(0.32, bearingRadius * 0.36)]} />
            <meshStandardMaterial {...appearance} metalness={0.84} roughness={0.28} clippingPlanes={clippingPlanes} />
          </mesh>
        ))}
      </group>
    </group>
  )
  if (editable && selectedPart === 'rotor') {
    return (
      <TransformControls
        mode="translate"
        showX={false}
        showY
        showZ={false}
        size={0.72}
        onMouseUp={() => {
          if (!outerRef.current) return
          const baseY = zOffset + valueOf(automatic.rotorZ) + thickness / 2
          const delta = outerRef.current.position.y - baseY
          outerRef.current.position.y = baseY
          if (Math.abs(delta) > 0.0001) updateAutomatic('rotorZ', valueOf(automatic.rotorZ) + delta)
        }}
      >
        {content}
      </TransformControls>
    )
  }
  return content
}

function MechanicalScene({
  zOffset,
  editable,
  clippingPlanes,
}: {
  zOffset: number
  editable: boolean
  clippingPlanes: THREE.Plane[]
}) {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const renderMode = useStudioStore((state) => state.renderMode)
  const viewMode = useStudioStore((state) => state.viewMode)
  const learning = useContext(PartStateContext).learning
  const plateState = usePartState('plate')
  const bridgeState = usePartState('bridge')
  if (project.movement.kind !== 'mechanical') return null
  const movement = project.movement
  const train = calculateTrain(movement)
  const plateAppearance = partAppearance(
    'plate',
    selectedPart === 'plate',
    plateState.hasError,
    plateState.hasWarning,
    richRender(renderMode),
  )
  const bridgeAppearance = partAppearance(
    'bridge',
    selectedPart === 'bridge',
    bridgeState.hasError,
    bridgeState.hasWarning,
    richRender(renderMode),
  )
  const escape = movement.arbors.find((arbor) => arbor.id === 'escape')
  const showPart = (part: WatchPartId) => shouldRenderPart(
    viewMode !== 'isolate' || selectedPart === 'movement' || selectedPart === part,
    part,
    learning,
  )
  const explodedStep = (learning.active ? learning.explode : viewMode === 'exploded' ? 1 : 0) * 0.82
  const bridgeOffset = explodedStep * 7
  const bridgeTop = valueOf(movement.bridgeTopZ)
  const trainBase = valueOf(movement.trainBaseZ)
  return (
    <group>
      {showPart('plate') && (
        <mesh
          position={[0, zOffset + trainBase + valueOf(movement.plateThickness) / 2, 0]}
          receiveShadow
          castShadow
          onPointerDown={(event) => {
            event.stopPropagation()
            setSelectedPart('plate')
          }}
        >
          <cylinderGeometry
            args={[
              valueOf(movement.plateDiameter) / 2,
              valueOf(movement.plateDiameter) / 2,
              valueOf(movement.plateThickness),
              128,
            ]}
          />
          <meshStandardMaterial
            {...plateAppearance}
            metalness={0.65}
            roughness={0.38}
            transparent={plateState.opacity < 1}
            opacity={plateState.opacity}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
      )}
      {viewMode !== 'isolate' && explodedStep === 0 && train.pairs.map((pair) => {
        const driver = movement.arbors.find((arbor) => arbor.id === pair.driver)
        const driven = movement.arbors.find((arbor) => arbor.id === pair.driven)
        if (!driver || !driven) return null
        const error = train.findings.some(
          (item) => item.severity === 'error' && item.parts.includes(driver.id) && item.parts.includes(driven.id),
        )
        return (
          <Line
            key={pair.id}
            points={[
              [valueOf(driver.x), zOffset + trainBase + valueOf(driver.wheelZ) + 0.04, valueOf(driver.y)],
              [valueOf(driven.x), zOffset + trainBase + valueOf(driver.wheelZ) + 0.04, valueOf(driven.y)],
            ]}
            color={error ? '#ef4f58' : '#547178'}
            lineWidth={error ? 1.7 : 0.7}
            dashed={!error}
            dashSize={0.18}
            gapSize={0.12}
          />
        )
      })}
      {movement.arbors.map((arbor, index) =>
        (showPart(arbor.id) || (viewMode === 'isolate' && selectedPart === 'mainspring' && arbor.id === 'barrel') || (viewMode === 'isolate' && selectedPart === 'jewel')) ? (
          <ArborGroup
            key={arbor.id}
            arbor={arbor}
            index={index}
            previousModule={index === 0 ? valueOf(arbor.moduleToNext) : valueOf(movement.arbors[index - 1].moduleToNext)}
            speedRph={train.speedsRph[arbor.id]}
            zOffset={zOffset + trainBase + explodedStep * (index + 1)}
            editable={editable}
            clippingPlanes={clippingPlanes}
          />
        ) : null,
      )}
      {(showPart('balance') || (viewMode === 'isolate' && selectedPart === 'hairspring')) && (
        <BalanceAssembly zOffset={zOffset + trainBase + explodedStep * 6} editable={editable} clippingPlanes={clippingPlanes} />
      )}
      {showPart('pallet') && <PalletAssembly zOffset={zOffset + trainBase + explodedStep * 5.5} clippingPlanes={clippingPlanes} />}
      {showPart('keyless') && <KeylessAssembly zOffset={zOffset + explodedStep * 2.4} clippingPlanes={clippingPlanes} />}
      {showPart('rotor') && (
        <AutomaticRotor zOffset={zOffset + explodedStep * 8.2} editable={editable} clippingPlanes={clippingPlanes} />
      )}
      {escape && viewMode !== 'isolate' && explodedStep === 0 && (
        <Line
          points={[
            [valueOf(escape.x), zOffset + trainBase + valueOf(escape.wheelZ) + 0.18, valueOf(escape.y)],
            [valueOf(movement.balance.x), zOffset + trainBase + valueOf(movement.balance.z), valueOf(movement.balance.y)],
          ]}
          color="#d06f78"
          lineWidth={1.1}
        />
      )}
      {showPart('bridge') && (
        <>
          <AnnulusMesh
            outerRadius={valueOf(movement.plateDiameter) / 2 - 0.45}
            innerRadius={valueOf(movement.plateDiameter) * 0.37}
            height={valueOf(movement.bridgeThickness)}
            position={[
              0,
              zOffset + bridgeOffset + bridgeTop - valueOf(movement.bridgeThickness) / 2,
              0,
            ]}
            part="bridge"
            opacity={renderMode === 'technical' ? 0.32 : 0.86}
            clippingPlanes={clippingPlanes}
          />
          {[0, Math.PI / 2, Math.PI].map((angle) => (
            <mesh
              key={angle}
              position={[
                Math.cos(angle) * valueOf(movement.plateDiameter) * 0.18,
                zOffset + bridgeOffset + bridgeTop - valueOf(movement.bridgeThickness) / 2,
                Math.sin(angle) * valueOf(movement.plateDiameter) * 0.18,
              ]}
              rotation={[0, -angle, 0]}
              castShadow
              onPointerDown={(event) => {
                event.stopPropagation()
                setSelectedPart('bridge')
              }}
            >
              <boxGeometry args={[valueOf(movement.plateDiameter) * 0.38, valueOf(movement.bridgeThickness), 1.05]} />
              <meshStandardMaterial
                {...bridgeAppearance}
                metalness={0.72}
                roughness={0.32}
                transparent={renderMode === 'technical' || bridgeState.opacity < 1}
                opacity={(renderMode === 'technical' ? 0.42 : 1) * bridgeState.opacity}
                clippingPlanes={clippingPlanes}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

function QuartzDetails({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const project = useStudioStore((state) => state.project)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  if (project.movement.kind !== 'quartz') return null
  const stack = assemblyStack(project)
  const detailPlane = stack.movementTop + 0.08
  return (
    <group onPointerDown={(event) => { event.stopPropagation(); setSelectedPart('movement') }}>
      <mesh position={[-3.6, detailPlane + 0.28, 2.4]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[3.05, 3.05, 0.55, 64]} />
        <meshStandardMaterial color="#c8c9c6" metalness={0.65} roughness={0.32} clippingPlanes={clippingPlanes} />
      </mesh>
      <mesh position={[3.9, detailPlane + 0.36, -2.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.36, 18, 64]} />
        <meshStandardMaterial color="#c46b45" metalness={0.55} roughness={0.45} clippingPlanes={clippingPlanes} />
      </mesh>
      <mesh position={[0, detailPlane + 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.2, 24]} />
        <meshStandardMaterial color="#d9dde0" metalness={0.9} roughness={0.16} clippingPlanes={clippingPlanes} />
      </mesh>
    </group>
  )
}

function AssemblyScene({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const project = useStudioStore((state) => state.project)
  const workspace = useStudioStore((state) => state.workspace)
  const viewMode = useStudioStore((state) => state.viewMode)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const learning = useContext(PartStateContext).learning
  const primitives = useMemo(() => buildAssemblyPrimitives(project), [project])
  const dialProfile = useMemo(() => dialRadialProfile(project.dial), [project.dial])
  const crystalProfile = useMemo(() => crystalRadialProfile(project), [project])
  const stack = assemblyStack(project)
  const explodeAmount = learning.active ? learning.explode : viewMode === 'exploded' ? 1 : 0
  const handPrimitives = useMemo(
    () => Object.fromEntries(HAND_PARTS.map((part) => [part, primitives.filter((primitive) => primitive.part === part)])) as Record<HandPart, ReturnType<typeof buildAssemblyPrimitives>>,
    [primitives],
  )
  return (
    <group>
      {primitives.map((primitive) => {
        if (project.movement.kind === 'mechanical' && (primitive.part === 'plate' || primitive.part === 'bridge')) return null
        if (primitive.kind === 'dial-profile' || primitive.kind === 'crystal-profile') return null
        if (HAND_PARTS.includes(primitive.part as HandPart)) return null
        if (!shouldRenderPart(viewMode !== 'isolate' || primitive.part === selectedPart, primitive.part, learning)) return null
        const explode = explodeAmount * primitive.layer * 0.62
        return <PrimitiveMesh key={primitive.id} primitive={primitive} explode={explode} clippingPlanes={clippingPlanes} />
      })}
      {shouldRenderPart(viewMode !== 'isolate' || selectedPart === 'dial', 'dial', learning) && (
        <ProfileMesh
          part="dial"
          points={dialProfile}
          explode={explodeAmount * 4 * 0.62}
          clippingPlanes={clippingPlanes}
          editable={workspace === 'parts'}
        />
      )}
      {shouldRenderPart(viewMode !== 'isolate' || selectedPart === 'crystal', 'crystal', learning) && (
        <ProfileMesh
          part="crystal"
          points={crystalProfile}
          explode={explodeAmount * 10 * 0.62}
          clippingPlanes={clippingPlanes}
        />
      )}
      {HAND_PARTS.map((part, index) => (
        shouldRenderPart(viewMode !== 'isolate' || selectedPart === part, part, learning) && handPrimitives[part].length > 0 ? (
          <HandPrimitiveGroup
            key={part}
            part={part}
            primitives={handPrimitives[part]}
            explode={explodeAmount * (6 + index) * 0.62}
            editable={workspace === 'parts'}
            clippingPlanes={clippingPlanes}
          />
        ) : null
      ))}
      {project.movement.kind === 'mechanical' && shouldRenderPart(viewMode !== 'isolate' || ['movement', 'plate', 'bridge', 'barrel', 'center', 'third', 'fourth', 'escape', 'balance', 'pallet', 'hairspring', 'mainspring', 'jewel', 'keyless', 'rotor'].includes(selectedPart), 'movement', learning) && (
        <MechanicalScene
          zOffset={stack.movementBottom + explodeAmount * 2 * 0.62}
          editable={false}
          clippingPlanes={clippingPlanes}
        />
      )}
      {project.movement.kind === 'quartz' && shouldRenderPart(viewMode !== 'isolate' || selectedPart === 'movement', 'movement', learning) && (
        <QuartzDetails clippingPlanes={clippingPlanes} />
      )}
    </group>
  )
}

function PresentationGround() {
  const presentation = useStudioStore((state) => state.project.presentation)
  const texturePath = presentation.background === 'marble'
    ? '/assets/realism/textures/presentation_marble_01/albedo_preview.jpg'
    : presentation.background === 'granite'
      ? '/assets/realism/textures/presentation_granite_tile/albedo_preview.jpg'
      : '/assets/realism/textures/presentation_smooth_concrete/albedo_preview.jpg'
  const texture = useTexture(texturePath)
  if (presentation.background === 'transparent') return null
  const textured = ['marble', 'granite', 'concrete'].includes(presentation.background)
  const color = presentation.background === 'studio-light' ? '#bcb8b0' : '#070808'
  return (
    <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[420, 420]} />
      <meshStandardMaterial
        color={textured ? '#ffffff' : color}
        map={textured ? texture : null}
        roughness={presentation.background === 'marble' ? 0.28 : presentation.background === 'studio-light' ? 0.62 : 0.76}
        metalness={0}
      />
    </mesh>
  )
}

function presentationBackground(project: WatchProject): string {
  if (project.presentation.background === 'studio-light') return '#d6d2ca'
  if (project.presentation.background === 'marble') return '#b8b3aa'
  if (project.presentation.background === 'concrete') return '#6f716f'
  if (project.presentation.background === 'granite') return '#343536'
  return '#111212'
}

function Scene({ cameraPreset }: ViewportProps) {
  const viewportSize = useThree((state) => state.size)
  const workspace = useStudioStore((state) => state.workspace)
  const viewMode = useStudioStore((state) => state.viewMode)
  const renderMode = useStudioStore((state) => state.renderMode)
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const showDimensions = useStudioStore((state) => state.showDimensions)
  const learningOverlay = useStudioLearningViewportOverlay()
  const evaluation = useMemo(() => evaluateProject(project), [project])
  const partState = useMemo<PartStateContextValue>(() => {
    const errorParts = new Set<WatchPartId>()
    const warningParts = new Set<WatchPartId>()
    evaluation.findings.forEach((item) => {
      item.parts.forEach((part) => {
        if (item.severity === 'error') errorParts.add(part)
        else if (item.severity === 'warning') warningParts.add(part)
      })
    })
    return { selectedPart, errorParts, warningParts, learning: learningOverlay }
  }, [evaluation.findings, learningOverlay, selectedPart])
  const clippingPlanes = useMemo(
    () => {
      if (learningOverlay.active && learningOverlay.section) {
        return learningOverlay.section.enabled
          ? [new THREE.Plane(new THREE.Vector3(...learningOverlay.section.normal).normalize(), learningOverlay.section.offset)]
          : []
      }
      return viewMode === 'section' ? [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.05)] : []
    },
    [learningOverlay, viewMode],
  )
  const stack = assemblyStack(project)
  const isPresentation = renderMode === 'presentation'
  const isolatedTargetY =
    selectedPart === 'movement'
      ? (stack.movementBottom + stack.movementTop) / 2
      : selectedPart === 'dial'
        ? stack.dialTop
        : selectedPart === 'crystal'
          ? stack.crystalCenterInner
          : selectedPart === 'back'
            ? stack.backTop / 2
            : selectedPart === 'case'
              ? stack.caseTop / 2
              : stack.dialTop + 0.8
  const selectedArbor =
    project.movement.kind === 'mechanical'
      ? project.movement.arbors.find((arbor) => arbor.id === selectedPart)
      : undefined
  let target: [number, number, number] =
    workspace === 'movement'
      ? [0, 2, 0]
      : viewMode === 'isolate'
        ? [0, isolatedTargetY, 0]
        : [0, 5.2, 0]
  if (workspace === 'movement' && viewMode === 'isolate' && project.movement.kind === 'mechanical') {
    if (selectedArbor) {
      target = [
        valueOf(selectedArbor.x),
        valueOf(project.movement.trainBaseZ) + (valueOf(selectedArbor.wheelZ) + valueOf(selectedArbor.pinionZ)) / 2,
        valueOf(selectedArbor.y),
      ]
    } else if (selectedPart === 'balance') {
      target = [
        valueOf(project.movement.balance.x),
        valueOf(project.movement.trainBaseZ) + valueOf(project.movement.balance.z),
        valueOf(project.movement.balance.y),
      ]
    } else if (selectedPart === 'plate') target = [0, valueOf(project.movement.trainBaseZ) + valueOf(project.movement.plateThickness) / 2, 0]
    else if (selectedPart === 'bridge') target = [0, valueOf(project.movement.bridgeTopZ), 0]
    else if (selectedPart === 'rotor' && project.movement.automatic) {
      target = [0, valueOf(project.movement.automatic.rotorZ), 0]
    }
  }
  const aspect = viewportSize.width / Math.max(1, viewportSize.height)
  let baseDistance = workspace === 'movement' ? 54 : isPresentation ? 92 : 78
  let fitAspect = workspace === 'movement' ? 1.05 : 1.25
  if (workspace === 'movement' && viewMode === 'isolate' && project.movement.kind === 'mechanical') {
    if (selectedArbor) {
      const selectedIndex = project.movement.arbors.indexOf(selectedArbor)
      baseDistance = Math.max(24, wheelTipRadius(selectedArbor, project.movement.arbors[selectedIndex + 1]) * 4.6)
    }
    else if (selectedPart === 'balance') baseDistance = 27
    else if (selectedPart === 'rotor' && project.movement.automatic) {
      baseDistance = Math.max(28, valueOf(project.movement.automatic.rotorDiameter) * 1.45)
    }
  }
  if (workspace !== 'movement' && viewMode === 'isolate') {
    fitAspect = 1.08
    if (selectedPart === 'movement') baseDistance = project.movement.kind === 'quartz' ? 32 : 54
    else if (selectedPart === 'dial' || selectedPart === 'crystal') baseDistance = 54
    else if (selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand') baseDistance = 38
    else if (selectedPart === 'stem' || selectedPart === 'crown') baseDistance = 44
  }
  const cameraDistance = baseDistance * Math.max(1, fitAspect / aspect)
  let cameraPosition: [number, number, number] =
    cameraPreset === 'top'
      ? [0, target[1] + cameraDistance, 0.01]
      : cameraPreset === 'front'
        ? [0, target[1] + 1, cameraDistance]
        : cameraPreset === 'side'
          ? [cameraDistance, target[1] + 1, 0]
          : [cameraDistance * 0.72, target[1] + cameraDistance * 0.46, cameraDistance * 0.72]
  if (learningOverlay.active && learningOverlay.camera) {
    target = learningOverlay.camera.target
    cameraPosition = learningOverlay.camera.position
  }
  const cameraKey = `${workspace}-${viewMode}-${selectedPart}-${cameraPreset}-${Math.round(aspect * 100)}-${learningOverlay.active ? JSON.stringify(learningOverlay.camera) : 'normal'}`
  const isMechanicalWorkspace = workspace === 'movement' && project.movement.kind === 'mechanical'
  return (
    <PartStateContext.Provider value={partState}>
      <PerspectiveCamera key={`camera-${cameraKey}`} makeDefault position={cameraPosition} fov={learningOverlay.camera?.fieldOfView ?? 32} near={0.05} far={300} />
      {!(isPresentation && project.presentation.background === 'transparent') && <color attach="background" args={[isPresentation ? presentationBackground(project) : renderMode === 'beauty' ? '#171817' : '#101417']} />}
      <ambientLight intensity={isPresentation ? 0.18 : renderMode === 'beauty' ? 0.55 : 0.42} />
      <directionalLight position={[18, 28, 16]} intensity={isPresentation ? 1.8 : renderMode === 'beauty' ? 4.2 : 1.7} castShadow shadow-mapSize-width={project.presentation.quality === 'ultra' ? 4096 : 2048} shadow-mapSize-height={project.presentation.quality === 'ultra' ? 4096 : 2048} />
      <directionalLight position={[-18, 16, -8]} intensity={isPresentation ? 0.72 : renderMode === 'beauty' ? 1.3 : 0.65} color="#b9d8d6" />
      <pointLight position={[0, 16, -18]} intensity={isPresentation ? 3 : renderMode === 'beauty' ? 25 : 4} color="#f1d7b2" distance={70} />
      {isPresentation && <spotLight position={[-24, 34, 25]} intensity={2.2} angle={0.48} penumbra={0.8} color="#fff1dd" castShadow />}
      <Suspense fallback={null}>
        <Environment files="/assets/realism/hdri/design_neutral.exr" environmentIntensity={isPresentation ? 0.95 : renderMode === 'beauty' ? 1.05 : 0.55} />
      </Suspense>
      {workspace === 'movement' && project.movement.kind === 'quartz' ? (
        <group>
          <AssemblyScene clippingPlanes={clippingPlanes} />
        </group>
      ) : isMechanicalWorkspace ? (
        <MechanicalScene zOffset={0} editable clippingPlanes={clippingPlanes} />
      ) : workspace === 'library' ? null : (
        <AssemblyScene clippingPlanes={clippingPlanes} />
      )}
      {workspace !== 'library' && !isPresentation && (
        <>
          <Grid
            position={[0, -0.04, 0]}
            args={[60, 60]}
            cellSize={1}
            cellThickness={0.45}
            cellColor={renderMode === 'beauty' ? '#5f5b50' : '#294148'}
            sectionSize={5}
            sectionThickness={0.85}
            sectionColor={renderMode === 'beauty' ? '#8a806b' : '#3a6970'}
            fadeDistance={55}
            fadeStrength={1.4}
            infiniteGrid
          />
          <ContactShadows position={[0, -0.02, 0]} opacity={0.5} scale={48} blur={2.5} far={35} />
        </>
      )}
      {workspace !== 'library' && isPresentation && <><Suspense fallback={null}><PresentationGround /></Suspense><ContactShadows position={[0, -0.1, 0]} opacity={0.72} scale={110} blur={3.4} far={55} /></>}
      <OrbitControls
        key={`controls-${cameraKey}`}
        makeDefault
        target={target}
        minDistance={8}
        maxDistance={130}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.92}
      />
      {learningOverlay.active && learningOverlay.overlays.length > 0 && (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <div className="learning-viewport-overlays" role="status" aria-live="polite">
            {learningOverlay.overlays.map((overlay) => (
              <div key={overlay.id} data-kind={overlay.kind} aria-label={overlay.accessibleLabel}>
                {overlay.text}
              </div>
            ))}
          </div>
        </Html>
      )}
      {showDimensions && workspace !== 'library' && (!isPresentation || project.presentation.showTechnicalOverlays) && (
        <Html position={workspace === 'movement' ? [-15, 5.5, -12] : [-18, 11.5, -14]} distanceFactor={24}>
          <div className="scene-corner-label">
            <span>{workspace === 'movement' ? 'PLANTILLA DE MOVIMIENTO' : 'STACK COMPLETO'}</span>
            <strong>{selectedPart === 'movement' ? project.movement.name : selectedPart}</strong>
          </div>
        </Html>
      )}
    </PartStateContext.Provider>
  )
}

export function StudioViewport({ cameraPreset }: ViewportProps) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [25, 20, 25], fov: 32, near: 0.05, far: 300 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
        gl.domElement.id = 'watch-lab-canvas'
      }}
      onPointerMissed={() => useStudioStore.getState().setSelectedPart('movement')}
    >
      <Scene cameraPreset={cameraPreset} />
    </Canvas>
  )
}
