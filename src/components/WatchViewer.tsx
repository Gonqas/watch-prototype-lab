import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment, Html, OrbitControls, Text, useTexture } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MATERIAL_PRESETS, MOVEMENTS } from '../data/catalog'
import { handCurveHeightAt, localDialSurface } from '../logic/geometryKernel'
import { calculateWatchStack } from '../logic/watchStack'
import {
  editorToolDefinitions,
  roundLiveMm,
  selectedPartLimitTone,
  toneColor,
} from '../logic/editorTools'
import type {
  CaseShape,
  CaseConfig,
  ClearanceZone,
  CrystalConfig,
  DialConfig,
  EditorTool,
  FocusMode,
  HandConfig,
  ReliefFeature,
  SelectablePart,
  ValidationResult,
  ViewMode,
  VisualReflectionLevel,
  WatchDesign,
} from '../types'

interface WatchViewerProps {
  design: WatchDesign
  result: ValidationResult
  selectedPart: SelectablePart
  focusMode: FocusMode
  onSelectPart: (part: SelectablePart) => void
  sceneSelectionLocked: boolean
  activeTool: EditorTool
  snapEnabled: boolean
  snapStep: number
  beginLiveEdit: () => void
  endLiveEdit: () => void
  patchCaseLive: (patch: Partial<CaseConfig>) => void
  patchCrystalLive: (patch: Partial<CrystalConfig>) => void
  patchReliefLive: (id: string, patch: Partial<ReliefFeature>) => void
  patchDialLive: (patch: Partial<Omit<DialConfig, 'reliefs'>>) => void
  patchHandLive: (handName: 'hour' | 'minute' | 'second', patch: Partial<HandConfig>) => void
  presentationMode?: boolean
  visualCrystalVisible?: boolean
  visualReflectionLevel?: VisualReflectionLevel
}

type SelectableSceneProps = WatchViewerProps
type SelectHandler = (part: SelectablePart) => (event: ThreeEvent<MouseEvent>) => void

type Palette = {
  case: string
  caseConflict: string
  crystal: string
  dial: string
  movement: string
  battery: string
  coil: string
  stem: string
  hands: string
  relief: string
  back: string
}

const presetFor = (id: WatchDesign['materials'][keyof WatchDesign['materials']]) => MATERIAL_PRESETS[id]

const reflectionIntensityByLevel: Record<VisualReflectionLevel, number> = {
  high: 1.25,
  medium: 0.82,
  low: 0.38,
  off: 0.06,
}

const REALISM_ASSETS = {
  hdri: {
    design: '/assets/realism/hdri/design_neutral.exr',
    presentation: '/assets/realism/hdri/presentation_light.exr',
  },
  dialTextures: {
    granular: {
      albedo: '/assets/realism/textures/dial_granular_concrete/albedo_preview.jpg',
    },
    greyPlaster: {
      albedo: '/assets/realism/textures/dial_plaster_grey_04/albedo_preview.jpg',
      roughness: '/assets/realism/textures/dial_plaster_grey_04/roughness_preview.jpg',
    },
    whiteRoughPlaster: {
      albedo: '/assets/realism/textures/dial_white_rough_plaster/albedo_preview.jpg',
      roughness: '/assets/realism/textures/dial_white_rough_plaster/roughness_preview.jpg',
    },
    whitePlaster: {
      albedo: '/assets/realism/textures/dial_white_plaster_02/albedo_preview.jpg',
      roughness: '/assets/realism/textures/dial_white_plaster_02/roughness_preview.jpg',
    },
  },
  presentationSurface: {
    marble: {
      albedo: '/assets/realism/textures/presentation_marble_01/albedo_preview.jpg',
      roughness: '/assets/realism/textures/presentation_marble_01/roughness_preview.jpg',
    },
    concrete: {
      albedo: '/assets/realism/textures/presentation_smooth_concrete/albedo_preview.jpg',
    },
  },
} as const

type DialTextureKey = keyof typeof REALISM_ASSETS.dialTextures

const dialTextureKeyForDesign = (design: WatchDesign): DialTextureKey | null => {
  const texture = design.dial.visualTexture
  const material = design.materials.dialMaterial

  if (material === 'dial_grain' || texture === 'fine_grain' || texture === 'sandwich') return 'granular'
  if (material === 'dial_radial_brushed' || material === 'dial_metallic' || texture === 'radial_brush') return 'greyPlaster'
  if (material === 'dial_enamel') return 'whitePlaster'
  if (texture === 'horizontal_brush') return 'whiteRoughPlaster'
  return null
}

const prepareTexture = (texture: THREE.Texture, repeat = 1, colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace) => {
  texture.colorSpace = colorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 8
  texture.needsUpdate = true
}

const technicalPalette: Palette = {
  case: '#2563eb',
  caseConflict: '#ef4444',
  crystal: '#06b6d4',
  dial: '#22c55e',
  movement: '#a855f7',
  battery: '#f4d35e',
  coil: '#fb7185',
  stem: '#f8fafc',
  hands: '#facc15',
  relief: '#f97316',
  back: '#64748b',
}

const beautyPalette: Palette = {
  case: '#b8c1cc',
  caseConflict: '#ef4444',
  crystal: '#b9efff',
  dial: '#171a22',
  movement: '#4c566a',
  battery: '#d7c277',
  coil: '#bb6b45',
  stem: '#cfd8dc',
  hands: '#f7f7f2',
  relief: '#d1b95c',
  back: '#747f8d',
}

const materialPaletteFromDesign = (design: WatchDesign): Palette => {
  const caseMaterial = MATERIAL_PRESETS[design.materials.caseMaterial]
  const dialMaterial = MATERIAL_PRESETS[design.materials.dialMaterial]
  const handsMaterial = MATERIAL_PRESETS[design.materials.handsMaterial]
  const crystalMaterial = MATERIAL_PRESETS[design.materials.crystalMaterial]

  return {
    ...beautyPalette,
    case: caseMaterial.color,
    crystal: crystalMaterial.color,
    dial: design.dial.visualColor ?? dialMaterial.color,
    hands: handsMaterial.color,
    stem: caseMaterial.color,
    back: caseMaterial.color,
  }
}

const degToRad = (value: number) => (value * Math.PI) / 180

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const makeSelectHandler = (onSelectPart: (part: SelectablePart) => void): SelectHandler => (part) => (event) => {
  event.stopPropagation()
  onSelectPart(part)
}

const isReliefPart = (part: SelectablePart) => part.startsWith('relief:')

const exactPartSelected = (part: SelectablePart, selectedPart: SelectablePart) => part === selectedPart

const partVisibility = (part: SelectablePart, selectedPart: SelectablePart, focusMode: FocusMode) => {
  if (focusMode === 'assembly') return { visible: true, opacity: 1 }
  if (exactPartSelected(part, selectedPart)) return { visible: true, opacity: focusMode === 'ghost' ? 0.82 : 1 }
  if (focusMode === 'isolate') return { visible: false, opacity: 0 }

  const selectedIsHand = selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand'
  const selectedIsRelief = isReliefPart(selectedPart)
  const selectedNeedsDialReference = selectedIsHand || selectedIsRelief
  const isReference =
    (part === 'dial' && selectedNeedsDialReference) ||
    (part === 'crystal' && selectedIsHand) ||
    (part === 'movement' && selectedPart === 'dial') ||
    (part === 'case' && selectedPart === 'crystal')

  if (focusMode === 'workshop') {
    if (part === 'movement' && (selectedPart === 'dial' || selectedPart.startsWith('relief:'))) {
      return { visible: false, opacity: 0 }
    }
    return { visible: isReference, opacity: isReference ? 0.1 : 0 }
  }

  return { visible: true, opacity: isReference ? 0.28 : 0.15 }
}

const makeRoundedRect = (width: number, height: number, radius: number) => {
  const x = -width / 2
  const y = -height / 2
  const shape = new THREE.Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + height - radius)
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  shape.lineTo(x + radius, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}

const makeTonneau = (width: number, height: number) => {
  const shape = new THREE.Shape()
  shape.moveTo(-width * 0.32, -height / 2)
  shape.bezierCurveTo(width * 0.1, -height * 0.5, width * 0.45, -height * 0.28, width * 0.45, 0)
  shape.bezierCurveTo(width * 0.45, height * 0.28, width * 0.1, height * 0.5, -width * 0.32, height / 2)
  shape.bezierCurveTo(-width * 0.52, height * 0.3, -width * 0.52, -height * 0.3, -width * 0.32, -height / 2)
  return shape
}

const makeMiyotaFrameShape = (width: number, height: number) => {
  const points = [
    [-8.68, -7.05],
    [-6.95, -8.55],
    [-3.35, -8.82],
    [0.1, -8.55],
    [3.55, -8.65],
    [6.7, -7.35],
    [8.8, -3.15],
    [9.02, -0.55],
    [8.64, 0.55],
    [8.1, 3.05],
    [5.95, 6.55],
    [2.1, 8.45],
    [-2.6, 8.85],
    [-5.55, 7.65],
    [-7.08, 4.45],
    [-7.75, 0.9],
    [-8.45, -2.55],
  ] as const
  const scaleX = width / 18.2
  const scaleY = height / 17.8
  const shape = new THREE.Shape()

  points.forEach(([x, y], index) => {
    const px = x * scaleX
    const py = y * scaleY
    if (index === 0) shape.moveTo(px, py)
    else shape.lineTo(px, py)
  })
  shape.closePath()
  return shape
}

const makeOuterShape = (shapeType: CaseShape, diameter: number) => {
  if (shapeType === 'round') {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, diameter / 2, 0, Math.PI * 2, false)
    return shape
  }

  if (shapeType === 'rectangular') return makeRoundedRect(diameter * 0.78, diameter * 1.08, diameter * 0.08)
  if (shapeType === 'tonneau') return makeTonneau(diameter * 0.88, diameter * 1.05)
  if (shapeType === 'cushion') return makeRoundedRect(diameter, diameter, diameter * 0.18)
  return makeRoundedRect(diameter, diameter, diameter * 0.06)
}

const makeRingGeometry = (
  shapeType: CaseShape,
  outerDiameter: number,
  innerDiameter: number,
  depth: number,
  bevel = 0.08,
) => {
  const shape = makeOuterShape(shapeType, outerDiameter)
  const hole = new THREE.Path()
  hole.absarc(0, 0, innerDiameter / 2, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 96,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
  })
}

const makeDiscGeometry = (shapeType: CaseShape, diameter: number, depth: number, bevel = 0.02) => {
  const shape = makeOuterShape(shapeType, diameter)
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 96,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
  })
}

const makeAnnulusGeometry = (outerRadius: number, innerRadius: number, depth: number) => {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 128,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 2,
  })
}

const makeAnnularSectorGeometry = (
  outerRadius: number,
  innerRadius: number,
  angleStartDeg: number,
  angleEndDeg: number,
  depth: number,
) => {
  const start = degToRad(angleStartDeg)
  const end = degToRad(angleEndDeg)
  const shape = new THREE.Shape()

  shape.absarc(0, 0, outerRadius, start, end, false)
  shape.lineTo(Math.cos(end) * innerRadius, Math.sin(end) * innerRadius)
  shape.absarc(0, 0, innerRadius, end, start, true)
  shape.closePath()

  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  })
}

const makeTriangleMarkerGeometry = (width: number, length: number, depth: number) => {
  const shape = new THREE.Shape()
  shape.moveTo(0, length / 2)
  shape.lineTo(width / 2, -length / 2)
  shape.lineTo(-width / 2, -length / 2)
  shape.closePath()
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: Math.min(depth * 0.35, 0.035),
    bevelThickness: Math.min(depth * 0.35, 0.035),
    bevelSegments: 1,
  })
}

const makeHandBladeGeometry = (
  style: HandConfig['visualStyle'],
  length: number,
  width: number,
  tipWidth: number,
  thickness: number,
) => {
  const w = width / 2
  const tip = Math.max(tipWidth, 0.035) / 2
  const shape = new THREE.Shape()

  if (style === 'baton' || style === 'second_baton') {
    shape.moveTo(-w, 0)
    shape.lineTo(w, 0)
    shape.lineTo(w * 0.78, length)
    shape.lineTo(-w * 0.78, length)
    shape.closePath()
  } else if (style === 'pencil' || style === 'second_needle') {
    shape.moveTo(-w * 0.55, 0)
    shape.lineTo(w * 0.55, 0)
    shape.lineTo(tip, length * 0.86)
    shape.lineTo(0, length)
    shape.lineTo(-tip, length * 0.86)
    shape.closePath()
  } else if (style === 'leaf') {
    shape.moveTo(0, 0)
    shape.bezierCurveTo(w * 1.15, length * 0.22, w * 1.2, length * 0.62, tip, length)
    shape.bezierCurveTo(-w * 1.2, length * 0.62, -w * 1.15, length * 0.22, 0, 0)
    shape.closePath()
  } else if (style === 'syringe') {
    shape.moveTo(-w * 0.5, 0)
    shape.lineTo(w * 0.5, 0)
    shape.lineTo(w * 0.38, length * 0.68)
    shape.lineTo(w * 0.12, length * 0.68)
    shape.lineTo(tip, length)
    shape.lineTo(-tip, length)
    shape.lineTo(-w * 0.12, length * 0.68)
    shape.lineTo(-w * 0.38, length * 0.68)
    shape.closePath()
  } else if (style === 'skeleton') {
    shape.moveTo(-w * 0.75, 0)
    shape.lineTo(w * 0.75, 0)
    shape.lineTo(w, length * 0.48)
    shape.lineTo(tip, length)
    shape.lineTo(-tip, length)
    shape.lineTo(-w, length * 0.48)
    shape.closePath()
  } else if (style === 'alpha') {
    shape.moveTo(-w * 0.3, 0)
    shape.lineTo(w * 0.3, 0)
    shape.lineTo(w, length * 0.34)
    shape.lineTo(tip, length)
    shape.lineTo(-tip, length)
    shape.lineTo(-w, length * 0.34)
    shape.closePath()
  } else if (style === 'second_lollipop') {
    shape.moveTo(-w * 0.45, 0)
    shape.lineTo(w * 0.45, 0)
    shape.lineTo(tip, length)
    shape.lineTo(-tip, length)
    shape.closePath()
  } else {
    shape.moveTo(0, 0)
    shape.lineTo(w, length * 0.42)
    shape.lineTo(tip, length)
    shape.lineTo(-w, length * 0.42)
    shape.closePath()
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize: Math.min(thickness * 0.24, 0.025),
    bevelThickness: Math.min(thickness * 0.24, 0.025),
    bevelSegments: 1,
  })
  geometry.translate(0, 0, -thickness / 2)
  return geometry
}

const cameraPose = (viewMode: ViewMode, selectedPart: SelectablePart, focusMode: FocusMode) => {
  const close = focusMode === 'isolate' || focusMode === 'workshop'
  const frontDistance = close ? 54 : 76
  const target: [number, number, number] = [0, 0, selectedPart === 'crystal' ? 7.2 : 4.8]
  const front: [number, number, number] = [0, 0, frontDistance]

  if ((selectedPart === 'dial' || selectedPart.startsWith('relief:')) && close) {
    return viewMode === 'section'
      ? { position: [0, -86, 68] as [number, number, number], target: [0, 0, 4.8] as [number, number, number], fov: 50 }
      : { position: front, target: [0, 0, 5.2] as [number, number, number], fov: 44 }
  }

  if ((selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand') && close) {
    return { position: [0, 0, close ? 48 : 68] as [number, number, number], target: [0, 0, 6] as [number, number, number], fov: 34 }
  }

  if ((selectedPart === 'case' || selectedPart === 'crystal' || selectedPart === 'stem' || selectedPart === 'crown') && focusMode !== 'assembly') {
    return { position: [72, -52, 36] as [number, number, number], target, fov: 44 }
  }

  const positions: Partial<Record<ViewMode, [number, number, number]>> = {
    free: [76, -62, 48],
    front: [0, 0, 92],
    side: [78, -4, 18],
    section: [64, -50, 30],
    transparent: [78, -62, 48],
    exploded: [70, -64, 52],
    layers: [66, -66, 56],
    sweep: [0, 0, 92],
    heatmap: [0, 0, 124],
  }

  return {
    position: positions[viewMode] ?? [76, -62, 48],
    target,
    fov: viewMode === 'heatmap' ? 58 : viewMode === 'free' || viewMode === 'transparent' ? 46 : 42,
  }
}

function CameraRig({
  viewMode,
  selectedPart,
  focusMode,
}: {
  viewMode: ViewMode
  selectedPart: SelectablePart
  focusMode: FocusMode
}) {
  const { camera } = useThree()

  useEffect(() => {
    const pose = cameraPose(viewMode, selectedPart, focusMode)

    camera.position.set(...pose.position)
    camera.up.set(0, 1, 0)
    camera.lookAt(...pose.target)
    camera.updateProjectionMatrix()
  }, [camera, focusMode, selectedPart, viewMode])

  return null
}

function OrbitTarget({
  viewMode,
  selectedPart,
  focusMode,
}: {
  viewMode: ViewMode
  selectedPart: SelectablePart
  focusMode: FocusMode
}) {
  const controls = useThree((state) => state.controls as { target?: THREE.Vector3; update?: () => void } | undefined)

  useEffect(() => {
    if (!controls?.target) return
    const pose = cameraPose(viewMode, selectedPart, focusMode)
    controls.target.set(...pose.target)
    controls.update?.()
  }, [controls, focusMode, selectedPart, viewMode])

  return null
}

function CanvasViewportSync() {
  const { gl, camera, setSize } = useThree()

  useEffect(() => {
    const sync = () => {
      const canvas = gl.domElement
      const target = canvas.parentElement ?? canvas
      const rect = target.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return

      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      gl.setPixelRatio(pixelRatio)
      gl.setSize(width, height, false)
      setSize(width, height)
      canvas.dataset.viewportSize = `${width}x${height}`
      canvas.dataset.pixelRatio = String(pixelRatio)

      if ('aspect' in camera) {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
    }

    const animationFrame = window.requestAnimationFrame(sync)
    const resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(gl.domElement.parentElement ?? gl.domElement)
    window.addEventListener('resize', sync)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [camera, gl, setSize])

  return null
}

function RingMesh({
  shape,
  outer,
  inner,
  depth,
  z,
  color,
  opacity = 1,
  bevel = 0.08,
  metalness = 0.62,
  roughness = 0.32,
  clearcoat = 0.12,
}: {
  shape: CaseShape
  outer: number
  inner: number
  depth: number
  z: number
  color: string
  opacity?: number
  bevel?: number
  metalness?: number
  roughness?: number
  clearcoat?: number
}) {
  const geometry = useMemo(() => makeRingGeometry(shape, outer, inner, depth, bevel), [shape, outer, inner, depth, bevel])

  return (
    <mesh position={[0, 0, z]} castShadow receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={clearcoat}
        clearcoatRoughness={Math.min(roughness + 0.08, 1)}
        envMapIntensity={1.34}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 0.98}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function DiscMesh({
  shape,
  diameter,
  depth,
  z,
  color,
  opacity = 1,
  metalness = 0.25,
  roughness = 0.5,
  clearcoat = 0,
}: {
  shape: CaseShape
  diameter: number
  depth: number
  z: number
  color: string
  opacity?: number
  metalness?: number
  roughness?: number
  clearcoat?: number
}) {
  const geometry = useMemo(() => makeDiscGeometry(shape, diameter, depth), [shape, diameter, depth])

  return (
    <mesh position={[0, 0, z]} receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={clearcoat}
        clearcoatRoughness={Math.min(roughness + 0.08, 1)}
        envMapIntensity={1.08}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 0.98}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function AnnulusMesh({
  outerRadius,
  innerRadius,
  depth,
  z,
  color,
  opacity = 1,
  metalness = 0.25,
  roughness = 0.42,
  clearcoat = 0,
}: {
  outerRadius: number
  innerRadius: number
  depth: number
  z: number
  color: string
  opacity?: number
  metalness?: number
  roughness?: number
  clearcoat?: number
}) {
  const geometry = useMemo(
    () => makeAnnulusGeometry(outerRadius, innerRadius, depth),
    [outerRadius, innerRadius, depth],
  )

  return (
    <mesh position={[0, 0, z]} receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={clearcoat}
        clearcoatRoughness={Math.min(roughness + 0.08, 1)}
        envMapIntensity={1.05}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 0.98}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function AnnularSectorMesh({
  outerRadius,
  innerRadius,
  angleStartDeg,
  angleEndDeg,
  depth,
  z,
  color,
  opacity = 1,
}: {
  outerRadius: number
  innerRadius: number
  angleStartDeg: number
  angleEndDeg: number
  depth: number
  z: number
  color: string
  opacity?: number
}) {
  const geometry = useMemo(
    () => makeAnnularSectorGeometry(outerRadius, innerRadius, angleStartDeg, angleEndDeg, depth),
    [angleEndDeg, angleStartDeg, depth, innerRadius, outerRadius],
  )

  return (
    <mesh position={[0, 0, z]} receiveShadow>
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial
        color={color}
        metalness={0}
        roughness={0.72}
        transparent
        opacity={opacity}
        depthWrite={opacity >= 0.98}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ZCylinder({
  radius,
  depth,
  z,
  color,
  opacity = 1,
  segments = 96,
  metalness = 0.2,
  roughness = 0.55,
}: {
  radius: number
  depth: number
  z: number
  color: string
  opacity?: number
  segments?: number
  metalness?: number
  roughness?: number
}) {
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, depth, segments]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 0.98}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function SelectionHalo({
  active,
  radius,
  z,
  color = '#36c5f0',
  tube = 0.055,
}: {
  active: boolean
  radius: number
  z: number
  color?: string
  tube?: number
}) {
  if (!active) return null

  return (
    <mesh position={[0, 0, z]}>
      <torusGeometry args={[radius, tube, 10, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} depthTest={false} />
    </mesh>
  )
}

type DragState =
  | {
      kind: 'moveRelief'
      reliefId: string
      startLocal: THREE.Vector3
      startX: number
      startY: number
    }
  | {
      kind: 'heightRelief' | 'sizeRelief'
      reliefId: string
      startClientX: number
      startClientY: number
      startHeight: number
      startRadius: number
      startWidth: number
      startLength: number
      reliefType: ReliefFeature['type']
    }
  | {
      kind: 'dialDepth'
      startClientY: number
      startDepth: number
    }
  | {
      kind: 'dialRadius'
      startRadius: number
    }
  | {
      kind: 'dialOuterRingHeight'
      startClientY: number
      startHeight: number
    }
  | {
      kind: 'handLength'
      handName: 'hour' | 'minute' | 'second'
    }
  | {
      kind: 'handHeight'
      handName: 'hour' | 'minute' | 'second'
      startClientY: number
      startHeight: number
    }
  | {
      kind: 'handCurve'
      handName: 'hour' | 'minute' | 'second'
      startClientY: number
      startTipHeight: number
    }
  | {
      kind: 'caseSize'
      startClientX: number
      startInnerDiameter: number
      startDialSeatDiameter: number
    }
  | {
      kind: 'caseHeight'
      startClientY: number
      startTotalHeight: number
      startInteriorHeight: number
    }
  | {
      kind: 'crystalSize'
      startClientX: number
      startDiameter: number
    }
  | {
      kind: 'crystalHeight'
      startClientY: number
      startUsableInteriorHeight: number
      startThickness: number
    }

const clientPoint = (event: ThreeEvent<PointerEvent>) => ({
  x: event.nativeEvent.clientX,
  y: event.nativeEvent.clientY,
})

const capturePointer = (event: ThreeEvent<PointerEvent>) => {
  const target = event.target as Element
  target.setPointerCapture?.(event.pointerId)
}

const releasePointer = (event: ThreeEvent<PointerEvent>) => {
  const target = event.target as Element
  target.releasePointerCapture?.(event.pointerId)
}

function EditorSphere({
  position,
  color,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  scale = 1,
}: {
  position: [number, number, number]
  color: string
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  scale?: number
}) {
  return (
    <group
      position={position}
      scale={scale}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <mesh>
        <sphereGeometry args={[2.25, 24, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.015} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.88, 24, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.96} depthTest={false} />
      </mesh>
    </group>
  )
}

function EditorLine({
  from,
  to,
  color,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
}) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2])
  const midpoint: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
  const direction = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.045, 0.045, length, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.82} depthTest={false} />
    </mesh>
  )
}

function EditorLabel({
  position,
  color,
  children,
}: {
  position: [number, number, number]
  color: string
  children: string
}) {
  return (
    <Html position={position} center distanceFactor={42} style={{ pointerEvents: 'none' }}>
      <span
        style={{
          display: 'block',
          minWidth: 72,
          padding: '5px 7px',
          border: `1px solid ${color}`,
          borderRadius: 7,
          color: '#f8fafc',
          background: 'rgba(7, 10, 15, 0.86)',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
          fontSize: 11,
          fontWeight: 750,
          lineHeight: 1.1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </span>
    </Html>
  )
}

function DirectEditorGizmos({
  design,
  selectedPart,
  result,
  activeTool,
  snapEnabled,
  snapStep,
  beginLiveEdit,
  endLiveEdit,
  patchCaseLive,
  patchCrystalLive,
  patchReliefLive,
  patchDialLive,
  patchHandLive,
}: {
  design: WatchDesign
  selectedPart: SelectablePart
  result: ValidationResult
  activeTool: EditorTool
  snapEnabled: boolean
  snapStep: number
  beginLiveEdit: () => void
  endLiveEdit: () => void
  patchCaseLive: (patch: Partial<CaseConfig>) => void
  patchCrystalLive: (patch: Partial<CrystalConfig>) => void
  patchReliefLive: (id: string, patch: Partial<ReliefFeature>) => void
  patchDialLive: (patch: Partial<Omit<DialConfig, 'reliefs'>>) => void
  patchHandLive: (handName: 'hour' | 'minute' | 'second', patch: Partial<HandConfig>) => void
}) {
  const rootRef = useRef<THREE.Group>(null)
  const dragRef = useRef<DragState | null>(null)
  const stack = calculateWatchStack(design)
  const selectedRelief = selectedPart.startsWith('relief:')
    ? design.dial.reliefs.find((relief) => `relief:${relief.id}` === selectedPart)
    : null
  const limitTone = selectedPartLimitTone(design, selectedPart, result)
  const activeToolColor = limitTone === 'ok' ? editorToolDefinitions[activeTool].color : toneColor(limitTone)
  const labelMm = (label: string, value: number) =>
    `${label} ${value.toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} mm`

  const applyClientDrag = useCallback((drag: DragState, client: { x: number; y: number }) => {
    if (drag.kind === 'heightRelief') {
      patchReliefLive(drag.reliefId, {
        height: roundLiveMm(clamp(drag.startHeight + (drag.startClientY - client.y) * 0.012, 0, 2.2), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'sizeRelief') {
      const delta = (client.x - drag.startClientX) * 0.02
      if (drag.reliefType === 'circle') {
        patchReliefLive(drag.reliefId, {
          radius: roundLiveMm(clamp(drag.startRadius + delta, 0.05, 18), snapEnabled, snapStep),
        })
      } else {
        patchReliefLive(drag.reliefId, {
          width: roundLiveMm(clamp(drag.startWidth + delta, 0.05, 8), snapEnabled, snapStep),
          length: roundLiveMm(clamp(drag.startLength + delta * 1.7, 0.05, 14), snapEnabled, snapStep),
        })
      }
      return true
    }

    if (drag.kind === 'dialDepth') {
      patchDialLive({
        sunkenCenter: true,
        sunkenDepth: roundLiveMm(clamp(drag.startDepth + (drag.startClientY - client.y) * 0.012, 0, 2.2), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'dialOuterRingHeight') {
      patchDialLive({
        outerRingHeight: roundLiveMm(clamp(drag.startHeight + (drag.startClientY - client.y) * 0.012, 0, 1.5), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'handHeight') {
      patchHandLive(drag.handName, {
        heightOverDial: roundLiveMm(clamp(drag.startHeight + (drag.startClientY - client.y) * 0.012, -0.3, 2.8), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'handCurve') {
      patchHandLive(drag.handName, {
        curvature: {
          ...design.hands[drag.handName].curvature,
          tipHeight: roundLiveMm(clamp(drag.startTipHeight + (drag.startClientY - client.y) * 0.01, -0.3, 1.8), snapEnabled, snapStep),
        },
      })
      return true
    }

    if (drag.kind === 'caseSize') {
      const delta = (client.x - drag.startClientX) * 0.035
      const innerDiameter = roundLiveMm(clamp(drag.startInnerDiameter + delta, 12, Math.max(12, design.case.outerDiameter - 1.2)), snapEnabled, snapStep)
      patchCaseLive({
        innerDiameter,
        dialSeatDiameter: roundLiveMm(Math.max(10, innerDiameter - 0.9), snapEnabled, snapStep),
        wallThickness: roundLiveMm(Math.max(0.35, (design.case.outerDiameter - innerDiameter) / 2), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'caseHeight') {
      const delta = (drag.startClientY - client.y) * 0.018
      const totalHeight = roundLiveMm(clamp(drag.startTotalHeight + delta, 5, 18), snapEnabled, snapStep)
      patchCaseLive({
        totalHeight,
        interiorHeightAvailable: roundLiveMm(clamp(drag.startInteriorHeight + delta, 3, Math.max(3, totalHeight - 1.2)), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'crystalSize') {
      const delta = (client.x - drag.startClientX) * 0.035
      patchCrystalLive({
        diameter: roundLiveMm(clamp(drag.startDiameter + delta, 12, 45), snapEnabled, snapStep),
      })
      return true
    }

    if (drag.kind === 'crystalHeight') {
      const delta = (drag.startClientY - client.y) * 0.018
      patchCrystalLive({
        usableInteriorHeight: roundLiveMm(clamp(drag.startUsableInteriorHeight + delta, 2, 14), snapEnabled, snapStep),
        thickness: roundLiveMm(clamp(drag.startThickness + delta * 0.16, 0.2, 4), snapEnabled, snapStep),
      })
      return true
    }

    return false
  }, [design, patchCaseLive, patchCrystalLive, patchDialLive, patchHandLive, patchReliefLive, snapEnabled, snapStep])

  const localPoint = (event: ThreeEvent<PointerEvent>) => {
    const point = event.point.clone()
    return rootRef.current ? rootRef.current.worldToLocal(point) : point
  }

  const endDrag = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (dragRef.current) endLiveEdit()
    dragRef.current = null
    releasePointer(event)
  }

  const moveDrag = (event: ThreeEvent<PointerEvent>) => {
    const drag = dragRef.current
    if (!drag) return
    event.stopPropagation()
    const point = localPoint(event)
    const client = clientPoint(event)
    if (applyClientDrag(drag, client)) return

    if (drag.kind === 'moveRelief') {
      patchReliefLive(drag.reliefId, {
        x: roundLiveMm(clamp(drag.startX + point.x - drag.startLocal.x, -18, 18), snapEnabled, snapStep),
        y: roundLiveMm(clamp(drag.startY + point.y - drag.startLocal.y, -18, 18), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'heightRelief') {
      patchReliefLive(drag.reliefId, {
        height: roundLiveMm(clamp(drag.startHeight + (drag.startClientY - client.y) * 0.012, 0, 2.2), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'sizeRelief') {
      const delta = (client.x - drag.startClientX) * 0.02
      if (drag.reliefType === 'circle') {
        patchReliefLive(drag.reliefId, {
          radius: roundLiveMm(clamp(drag.startRadius + delta, 0.05, 18), snapEnabled, snapStep),
        })
      } else {
        patchReliefLive(drag.reliefId, {
          width: roundLiveMm(clamp(drag.startWidth + delta, 0.05, 8), snapEnabled, snapStep),
          length: roundLiveMm(clamp(drag.startLength + delta * 1.7, 0.05, 14), snapEnabled, snapStep),
        })
      }
    }

    if (drag.kind === 'dialDepth') {
      patchDialLive({
        sunkenCenter: true,
        sunkenDepth: roundLiveMm(clamp(drag.startDepth + (drag.startClientY - client.y) * 0.012, 0, 2.2), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'dialRadius') {
      const maxRadius = design.dial.commercialDiameter / 2 - 0.6
      patchDialLive({
        sunkenCenter: true,
        sunkenDepth: design.dial.sunkenDepth === 0 ? 0.35 : design.dial.sunkenDepth,
        sunkenRadius: roundLiveMm(clamp(Math.hypot(point.x, point.y), 1, maxRadius), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'dialOuterRingHeight') {
      patchDialLive({
        outerRingHeight: roundLiveMm(clamp(drag.startHeight + (drag.startClientY - client.y) * 0.012, 0, 1.5), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'handLength') {
      patchHandLive(drag.handName, {
        length: roundLiveMm(clamp(Math.hypot(point.x, point.y), 2, 20), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'handHeight') {
      patchHandLive(drag.handName, {
        heightOverDial: roundLiveMm(clamp(drag.startHeight + (drag.startClientY - client.y) * 0.012, -0.3, 2.8), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'handCurve') {
      patchHandLive(drag.handName, {
        curvature: {
          ...design.hands[drag.handName].curvature,
          tipHeight: roundLiveMm(clamp(drag.startTipHeight + (drag.startClientY - client.y) * 0.01, -0.3, 1.8), snapEnabled, snapStep),
        },
      })
    }

    if (drag.kind === 'caseSize') {
      const delta = (client.x - drag.startClientX) * 0.035
      const innerDiameter = roundLiveMm(clamp(drag.startInnerDiameter + delta, 12, Math.max(12, design.case.outerDiameter - 1.2)), snapEnabled, snapStep)
      patchCaseLive({
        innerDiameter,
        dialSeatDiameter: roundLiveMm(Math.max(10, innerDiameter - 0.9), snapEnabled, snapStep),
        wallThickness: roundLiveMm(Math.max(0.35, (design.case.outerDiameter - innerDiameter) / 2), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'caseHeight') {
      const delta = (drag.startClientY - client.y) * 0.018
      const totalHeight = roundLiveMm(clamp(drag.startTotalHeight + delta, 5, 18), snapEnabled, snapStep)
      patchCaseLive({
        totalHeight,
        interiorHeightAvailable: roundLiveMm(clamp(drag.startInteriorHeight + delta, 3, Math.max(3, totalHeight - 1.2)), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'crystalSize') {
      const delta = (client.x - drag.startClientX) * 0.035
      patchCrystalLive({
        diameter: roundLiveMm(clamp(drag.startDiameter + delta, 12, 45), snapEnabled, snapStep),
      })
    }

    if (drag.kind === 'crystalHeight') {
      const delta = (drag.startClientY - client.y) * 0.018
      patchCrystalLive({
        usableInteriorHeight: roundLiveMm(clamp(drag.startUsableInteriorHeight + delta, 2, 14), snapEnabled, snapStep),
        thickness: roundLiveMm(clamp(drag.startThickness + delta * 0.16, 0.2, 4), snapEnabled, snapStep),
      })
    }
  }

  const start = (drag: DragState) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    capturePointer(event)
    beginLiveEdit()
    dragRef.current = drag
  }

  useEffect(() => {
    const handleWindowMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      applyClientDrag(drag, { x: event.clientX, y: event.clientY })
    }
    const handleWindowUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      endLiveEdit()
    }

    window.addEventListener('pointermove', handleWindowMove)
    window.addEventListener('pointerup', handleWindowUp)
    window.addEventListener('pointercancel', handleWindowUp)
    return () => {
      window.removeEventListener('pointermove', handleWindowMove)
      window.removeEventListener('pointerup', handleWindowUp)
      window.removeEventListener('pointercancel', handleWindowUp)
    }
  }, [applyClientDrag, endLiveEdit])

  const reliefSurface = selectedRelief
    ? localDialSurface(design, stack.baseDialTop, Math.hypot(selectedRelief.x, selectedRelief.y))
    : stack.outerDialSurface

  const handMeta =
    selectedPart === 'hourHand'
      ? { name: 'hour' as const, hand: design.hands.hour, angle: degToRad(-50), color: '#f59e0b' }
      : selectedPart === 'minuteHand'
        ? { name: 'minute' as const, hand: design.hands.minute, angle: degToRad(50), color: '#facc15' }
        : selectedPart === 'secondHand'
          ? { name: 'second' as const, hand: design.hands.second, angle: degToRad(184), color: '#ef4444' }
          : null

  return (
    <group ref={rootRef}>
      {selectedRelief ? (
        <group>
          <EditorLine
            from={[selectedRelief.x, selectedRelief.y, reliefSurface + selectedRelief.height + 0.08]}
            to={[selectedRelief.x, selectedRelief.y, reliefSurface + selectedRelief.height + 2.2]}
            color={activeTool === 'height' ? activeToolColor : '#38bdf8'}
          />
          {activeTool === 'move' ? (
            <EditorSphere
              position={[selectedRelief.x, selectedRelief.y, reliefSurface + selectedRelief.height + 0.78]}
              color={activeToolColor}
              onPointerDown={(event) =>
                start({
                  kind: 'moveRelief',
                  reliefId: selectedRelief.id,
                  startLocal: localPoint(event),
                  startX: selectedRelief.x,
                  startY: selectedRelief.y,
                })(event)
              }
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          {activeTool === 'height' ? (
            <EditorSphere
              position={[selectedRelief.x, selectedRelief.y, reliefSurface + selectedRelief.height + 2.35]}
              color={activeToolColor}
              scale={0.9}
              onPointerDown={(event) => {
                const client = clientPoint(event)
                start({
                  kind: 'heightRelief',
                  reliefId: selectedRelief.id,
                  startClientX: client.x,
                  startClientY: client.y,
                  startHeight: selectedRelief.height,
                  startRadius: selectedRelief.radius,
                  startWidth: selectedRelief.width,
                  startLength: selectedRelief.length,
                  reliefType: selectedRelief.type,
                })(event)
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          {activeTool === 'size' ? (
            <EditorSphere
              position={[
                selectedRelief.x + Math.max(selectedRelief.radius, selectedRelief.width / 2, 0.35) + 0.55,
                selectedRelief.y,
                reliefSurface + selectedRelief.height + 0.34,
              ]}
              color={activeToolColor}
              scale={0.85}
              onPointerDown={(event) => {
                const client = clientPoint(event)
                start({
                  kind: 'sizeRelief',
                  reliefId: selectedRelief.id,
                  startClientX: client.x,
                  startClientY: client.y,
                  startHeight: selectedRelief.height,
                  startRadius: selectedRelief.radius,
                  startWidth: selectedRelief.width,
                  startLength: selectedRelief.length,
                  reliefType: selectedRelief.type,
                })(event)
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          <EditorLabel
            position={[selectedRelief.x, selectedRelief.y, reliefSurface + selectedRelief.height + 3.05]}
            color={activeToolColor}
          >
            {activeTool === 'move'
              ? `X ${selectedRelief.x.toLocaleString('es-ES')} / Y ${selectedRelief.y.toLocaleString('es-ES')}`
              : activeTool === 'size'
                ? labelMm('Tamano', selectedRelief.type === 'circle' ? selectedRelief.radius : selectedRelief.length)
                : labelMm('Altura', selectedRelief.height)}
          </EditorLabel>
        </group>
      ) : null}

      {selectedPart === 'dial' ? (
        <group>
          <mesh position={[0, 0, stack.centerDialSurface + 0.25]}>
            <torusGeometry args={[design.dial.sunkenRadius, 0.045, 8, 128]} />
            <meshBasicMaterial color={activeTool === 'radius' ? activeToolColor : '#22c55e'} transparent opacity={0.72} depthTest={false} />
          </mesh>
          {activeTool === 'radius' ? (
            <EditorSphere
              position={[design.dial.sunkenRadius, 0, stack.centerDialSurface + 0.42]}
              color={activeToolColor}
              onPointerDown={(event) => start({ kind: 'dialRadius', startRadius: design.dial.sunkenRadius })(event)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          {(activeTool === 'depth' || activeTool === 'height') ? (
            <EditorLine
              from={[0, 0, activeTool === 'height' ? stack.outerDialSurface : stack.centerDialSurface]}
              to={[0, 0, (activeTool === 'height' ? stack.outerDialSurface : stack.centerDialSurface) + 2.25]}
              color={activeToolColor}
            />
          ) : null}
          {activeTool === 'depth' ? (
            <EditorSphere
              position={[0, 0, stack.centerDialSurface + 2.36]}
              color={activeToolColor}
              onPointerDown={(event) => {
                const client = clientPoint(event)
                start({ kind: 'dialDepth', startClientY: client.y, startDepth: design.dial.sunkenDepth })(event)
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          {activeTool === 'height' ? (
            <EditorSphere
              position={[0, -design.dial.commercialDiameter / 2 + 2.2, stack.outerDialSurface + 2.36]}
              color={activeToolColor}
              onPointerDown={(event) => {
                const client = clientPoint(event)
                start({ kind: 'dialOuterRingHeight', startClientY: client.y, startHeight: design.dial.outerRingHeight })
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          <EditorLabel
            position={[
              activeTool === 'height' ? 0 : design.dial.sunkenRadius,
              activeTool === 'height' ? -design.dial.commercialDiameter / 2 + 2.2 : 0,
              (activeTool === 'height' ? stack.outerDialSurface : stack.centerDialSurface) + 3.05,
            ]}
            color={activeToolColor}
          >
            {activeTool === 'radius'
              ? labelMm('Radio', design.dial.sunkenRadius)
              : activeTool === 'height'
                ? labelMm('Anillo', design.dial.outerRingHeight)
                : labelMm('Hundido', design.dial.sunkenCenter ? design.dial.sunkenDepth : 0)}
          </EditorLabel>
        </group>
      ) : null}

      {handMeta ? (
        <group>
          {(() => {
            const tipX = -Math.sin(handMeta.angle) * handMeta.hand.length
            const tipY = Math.cos(handMeta.angle) * handMeta.hand.length
            const z = stack.handReferenceSurface + handMeta.hand.heightOverDial + handCurveHeightAt(handMeta.hand, handMeta.hand.length) + 0.45
            return (
              <>
                <EditorLine from={[0, 0, z]} to={[tipX, tipY, z]} color={handMeta.color} />
                {activeTool === 'size' ? (
                  <EditorSphere
                    position={[tipX, tipY, z]}
                    color={activeToolColor}
                    onPointerDown={(event) => start({ kind: 'handLength', handName: handMeta.name })(event)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                  />
                ) : null}
                {(activeTool === 'height' || activeTool === 'curve') ? (
                  <EditorLine from={[tipX, tipY, z]} to={[tipX, tipY, z + 1.9]} color={activeToolColor} />
                ) : null}
                {activeTool === 'height' ? (
                  <EditorSphere
                    position={[tipX, tipY, z + 2.05]}
                    color={activeToolColor}
                    scale={0.86}
                    onPointerDown={(event) => {
                      const client = clientPoint(event)
                      start({
                        kind: 'handHeight',
                        handName: handMeta.name,
                        startClientY: client.y,
                        startHeight: handMeta.hand.heightOverDial,
                      })(event)
                    }}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                  />
                ) : null}
                {activeTool === 'curve' ? (
                  <EditorSphere
                    position={[tipX * 0.72, tipY * 0.72, z + 1.65]}
                    color={activeToolColor}
                    scale={0.82}
                    onPointerDown={(event) => {
                      const client = clientPoint(event)
                      start({
                        kind: 'handCurve',
                        handName: handMeta.name,
                        startClientY: client.y,
                        startTipHeight: handMeta.hand.curvature.tipHeight,
                      })(event)
                    }}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                  />
                ) : null}
                <EditorLabel
                  position={[tipX * 0.82, tipY * 0.82, z + 2.45]}
                  color={activeToolColor}
                >
                  {activeTool === 'size'
                    ? labelMm('Longitud', handMeta.hand.length)
                    : activeTool === 'curve'
                      ? labelMm('Curva', handMeta.hand.curvature.tipHeight)
                      : labelMm('Altura', handMeta.hand.heightOverDial)}
                </EditorLabel>
              </>
            )
          })()}
        </group>
      ) : null}

      {selectedPart === 'case' ? (
        <group>
          <EditorLine from={[design.case.innerDiameter / 2, 0, stack.movementTop + 0.6]} to={[design.case.innerDiameter / 2 + 3, 0, stack.movementTop + 0.6]} color={activeToolColor} />
          {activeTool === 'size' ? (
            <EditorSphere
              position={[design.case.innerDiameter / 2 + 3.25, 0, stack.movementTop + 0.6]}
              color={activeToolColor}
              onPointerDown={(event) => {
                const client = clientPoint(event)
                start({
                  kind: 'caseSize',
                  startClientX: client.x,
                  startInnerDiameter: design.case.innerDiameter,
                  startDialSeatDiameter: design.case.dialSeatDiameter,
                })(event)
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
          ) : null}
          {activeTool === 'height' ? (
            <>
              <EditorLine from={[-design.case.outerDiameter / 2 - 1.2, 0, 0]} to={[-design.case.outerDiameter / 2 - 1.2, 0, design.case.totalHeight]} color={activeToolColor} />
              <EditorSphere
                position={[-design.case.outerDiameter / 2 - 1.2, 0, design.case.totalHeight + 0.55]}
                color={activeToolColor}
                onPointerDown={(event) => {
                  const client = clientPoint(event)
                  start({
                    kind: 'caseHeight',
                    startClientY: client.y,
                    startTotalHeight: design.case.totalHeight,
                    startInteriorHeight: design.case.interiorHeightAvailable,
                  })(event)
                }}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
              />
            </>
          ) : null}
          <EditorLabel
            position={[
              activeTool === 'size' ? design.case.innerDiameter / 2 + 3.35 : -design.case.outerDiameter / 2 - 1.2,
              0,
              activeTool === 'size' ? stack.movementTop + 1.4 : design.case.totalHeight + 1.25,
            ]}
            color={activeToolColor}
          >
            {activeTool === 'size' ? labelMm('Interior', design.case.innerDiameter) : labelMm('Altura', design.case.totalHeight)}
          </EditorLabel>
        </group>
      ) : null}

      {selectedPart === 'crystal' ? (
        <group>
          {activeTool === 'size' ? (
            <>
              <EditorLine from={[0, 0, design.case.totalHeight + 0.35]} to={[design.crystal.diameter / 2 + 1.8, 0, design.case.totalHeight + 0.35]} color={activeToolColor} />
              <EditorSphere
                position={[design.crystal.diameter / 2 + 2.05, 0, design.case.totalHeight + 0.35]}
                color={activeToolColor}
                onPointerDown={(event) => {
                  const client = clientPoint(event)
                  start({ kind: 'crystalSize', startClientX: client.x, startDiameter: design.crystal.diameter })(event)
                }}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
              />
            </>
          ) : null}
          {activeTool === 'height' ? (
            <>
              <EditorLine from={[0, design.crystal.diameter / 2 + 1.2, stack.crystalInnerTop]} to={[0, design.crystal.diameter / 2 + 1.2, stack.crystalInnerTop + 2.2]} color={activeToolColor} />
              <EditorSphere
                position={[0, design.crystal.diameter / 2 + 1.2, stack.crystalInnerTop + 2.45]}
                color={activeToolColor}
                onPointerDown={(event) => {
                  const client = clientPoint(event)
                  start({
                    kind: 'crystalHeight',
                    startClientY: client.y,
                    startUsableInteriorHeight: design.crystal.usableInteriorHeight,
                    startThickness: design.crystal.thickness,
                  })(event)
                }}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
              />
            </>
          ) : null}
          <EditorLabel
            position={[
              activeTool === 'size' ? design.crystal.diameter / 2 + 2.15 : 0,
              activeTool === 'size' ? 0 : design.crystal.diameter / 2 + 1.2,
              activeTool === 'size' ? design.case.totalHeight + 1.1 : stack.crystalInnerTop + 3,
            ]}
            color={activeToolColor}
          >
            {activeTool === 'size'
              ? labelMm('Diámetro', design.crystal.diameter)
              : labelMm('Altura útil', design.crystal.usableInteriorHeight)}
          </EditorLabel>
        </group>
      ) : null}
    </group>
  )
}

function MovementModel({
  design,
  palette,
  conflict,
  selectedPart,
  onSelectPart,
  focusOpacity,
}: {
  design: WatchDesign
  palette: Palette
  conflict: boolean
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusOpacity: number
}) {
  const movement = MOVEMENTS[design.movementId]
  const stack = calculateWatchStack(design)
  const movementColor = conflict ? palette.caseConflict : palette.movement
  const select = makeSelectHandler(onSelectPart)
  const bodyGeometry = useMemo(() => {
    const shape = makeMiyotaFrameShape(movement.casingFrameEnvelope.width, movement.casingFrameEnvelope.height)
    return new THREE.ExtrudeGeometry(shape, { depth: movement.height, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 })
  }, [movement.casingFrameEnvelope.height, movement.casingFrameEnvelope.width, movement.height])
  const framePoints = movement.casingCoordinateTable.filter((point) => point.id !== 'gm')

  return (
    <group rotation={[0, 0, degToRad(design.movementRotationDeg)]} onClick={select('movement')}>
      <SelectionHalo active={selectedPart === 'movement'} radius={10.2} z={stack.movementTop + 0.55} color="#b48cf2" />
      <mesh position={[0, 0, stack.movementBottom]} castShadow receiveShadow>
        <primitive attach="geometry" object={bodyGeometry} />
        <meshStandardMaterial color={movementColor} metalness={0.35} roughness={0.46} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      <mesh position={[-3.7, 3.2, stack.movementTop + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.05, 3.05, 0.25, 72]} />
        <meshStandardMaterial color={palette.battery} metalness={0.7} roughness={0.28} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      <mesh position={[3.9, 2.8, stack.movementTop + 0.2]}>
        <torusGeometry args={[1.55, 0.18, 16, 48]} />
        <meshStandardMaterial color={palette.coil} metalness={0.2} roughness={0.38} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      <mesh position={[0, 0, stack.movementTop + 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.46, 32]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.75} roughness={0.2} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      <mesh position={[0, 0, stack.movementTop + 0.32]}>
        <torusGeometry args={[0.86, 0.035, 8, 40]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={Math.min(0.9, focusOpacity)} depthTest={false} />
      </mesh>
      {framePoints.map((point) => (
        <mesh key={point.id} position={[point.x, point.y, stack.movementTop + 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[point.radius ?? 0.18, point.radius ?? 0.18, 0.06, 24]} />
          <meshBasicMaterial color="#d8b4fe" transparent opacity={Math.min(0.86, focusOpacity)} depthTest={false} />
        </mesh>
      ))}
      <mesh position={[3.25, -4.4, stack.movementTop + 0.15]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[4.8, 1.05, 0.18]} />
        <meshStandardMaterial color="#c4b5fd" metalness={0.28} roughness={0.34} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      <mesh position={[8.7, 0, stack.movementBottom + 1.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.33, 0.33, 7.4, 24]} />
        <meshStandardMaterial color={palette.stem} metalness={0.72} roughness={0.24} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      <mesh position={[7.7, 0, stack.movementBottom + 1.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.72, 0.72, 1.2, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
    </group>
  )
}

function DialTextureOverlay({
  design,
  dialRadius,
  z,
  accentColor,
  opacity,
}: {
  design: WatchDesign
  dialRadius: number
  z: number
  accentColor: string
  opacity: number
}) {
  if (design.renderMode === 'technical') return null

  const texture = design.dial.visualTexture
  const materialId = design.materials.dialMaterial
  const showSunburst = texture === 'sunburst' || texture === 'radial_brush' || materialId === 'dial_sunburst' || materialId === 'dial_radial_brushed'
  const showGrain = texture === 'fine_grain' || materialId === 'dial_grain'
  const showHorizontal = texture === 'horizontal_brush'

  if (!showSunburst && !showGrain && !showHorizontal) return null

  return (
    <group>
      {showSunburst ? Array.from({ length: 56 }, (_, index) => {
        const angle = (index * Math.PI * 2) / 56
        return (
          <mesh key={`sun-${index}`} position={[0, 0, z]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.018, dialRadius * 1.75, 0.012]} />
            <meshBasicMaterial color={index % 2 === 0 ? '#ffffff' : accentColor} transparent opacity={0.09 * opacity} depthWrite={false} />
          </mesh>
        )
      }) : null}
      {showHorizontal ? Array.from({ length: 15 }, (_, index) => {
        const y = -dialRadius * 0.78 + index * ((dialRadius * 1.56) / 14)
        const width = Math.sqrt(Math.max(0, dialRadius * dialRadius - y * y)) * 1.82
        return (
          <mesh key={`brush-${index}`} position={[0, y, z + index * 0.0004]}>
            <boxGeometry args={[width, 0.035, 0.012]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.14 * opacity} depthWrite={false} />
          </mesh>
        )
      }) : null}
      {showGrain ? Array.from({ length: 72 }, (_, index) => {
        const radius = ((index * 7) % 100) / 100 * dialRadius * 0.92
        const angle = (index * 2.399963229728653) % (Math.PI * 2)
        return (
          <mesh key={`grain-${index}`} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, z + 0.006]}>
            <circleGeometry args={[index % 5 === 0 ? 0.045 : 0.025, 10]} />
            <meshBasicMaterial color={index % 3 === 0 ? accentColor : '#ffffff'} transparent opacity={0.11 * opacity} depthWrite={false} />
          </mesh>
        )
      }) : null}
    </group>
  )
}

function DialPbrMicrotexture({
  textureKey,
  dialRadius,
  z,
  opacity,
}: {
  textureKey: DialTextureKey
  dialRadius: number
  z: number
  opacity: number
}) {
  const textureSet = REALISM_ASSETS.dialTextures[textureKey]
  const [albedoMap, roughnessMap] = useTexture([
    textureSet.albedo,
    'roughness' in textureSet ? textureSet.roughness : textureSet.albedo,
  ]) as THREE.Texture[]

  useEffect(() => {
    prepareTexture(albedoMap, textureKey === 'granular' ? 2.4 : 1.8)
    prepareTexture(roughnessMap, textureKey === 'granular' ? 2.4 : 1.8, THREE.NoColorSpace)
  }, [albedoMap, roughnessMap, textureKey])

  const microOpacity = textureKey === 'whitePlaster' ? 0.055 : textureKey === 'granular' ? 0.09 : 0.075

  return (
    <mesh position={[0, 0, z + 0.012]} receiveShadow>
      <circleGeometry args={[dialRadius * 0.965, 160]} />
      <meshPhysicalMaterial
        map={albedoMap}
        roughnessMap={'roughness' in textureSet ? roughnessMap : undefined}
        color="#ffffff"
        metalness={0}
        roughness={0.82}
        clearcoat={0.06}
        transparent
        opacity={microOpacity * opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function PresentationSurface() {
  return null
}

function DialModel({
  design,
  result,
  palette,
  selectedPart,
  onSelectPart,
  focusMode,
  focusOpacity,
}: {
  design: WatchDesign
  result: ValidationResult
  palette: Palette
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusMode: FocusMode
  focusOpacity: number
}) {
  const stack = calculateWatchStack(design)
  const dialMaterial = presetFor(design.materials.dialMaterial)
  const dialColor = result.conflictIds.has('dial') ? palette.caseConflict : palette.dial
  const dialRadius = design.dial.commercialDiameter / 2
  const sunkenRadius = clamp(design.dial.sunkenRadius, 0.6, Math.max(0.8, dialRadius - 0.35))
  const renderCutCenter = design.dial.sunkenCenter && design.dial.outerShape === 'round'
  const centerColor = design.renderMode === 'technical' ? '#9bf6b0' : '#111827'
  const select = makeSelectHandler(onSelectPart)
  const dialBodyOpacity = selectedPart.startsWith('relief:') && focusMode !== 'assembly' ? Math.min(focusOpacity, 0.18) : focusOpacity
  const selectedTechnicalDial = design.renderMode === 'technical' && selectedPart === 'dial'
  const technicalDialOpacity = selectedTechnicalDial && (focusMode === 'workshop' || focusMode === 'isolate')
    ? 0.96
    : selectedTechnicalDial
      ? Math.min(dialBodyOpacity, 0.38)
      : dialBodyOpacity
  const dialBaseOpacity = selectedTechnicalDial ? technicalDialOpacity : (design.viewMode === 'section' ? 0.72 : 1) * technicalDialOpacity
  const guideZ = stack.outerDialSurface + 0.16
  const sunkenConflict = result.findings.some((finding) => finding.pieceIds.includes('dial') && finding.severity === 'bad')
  const sunkenColor = sunkenConflict ? '#ef4444' : design.renderMode === 'technical' ? '#4ade80' : '#0f172a'
  const accentColor = design.dial.visualAccentColor ?? '#8bd3dd'
  const dialPbrTexture = dialTextureKeyForDesign(design)

  return (
    <group onClick={select('dial')}>
      <SelectionHalo active={selectedPart === 'dial'} radius={dialRadius + 0.45} z={stack.outerDialSurface + 0.18} color="#75dd9a" />
      {renderCutCenter ? (
        <AnnulusMesh
          outerRadius={dialRadius}
          innerRadius={sunkenRadius}
          depth={design.dial.thickness}
          z={stack.dialBottom}
          color={dialColor}
          opacity={dialBaseOpacity}
        />
      ) : (
        <DiscMesh
          shape={design.dial.outerShape}
          diameter={design.dial.commercialDiameter}
          depth={design.dial.thickness}
          z={stack.dialBottom}
          color={dialColor}
          opacity={dialBaseOpacity}
          metalness={dialMaterial.metalness}
          roughness={dialMaterial.roughness}
          clearcoat={dialMaterial.clearcoat ?? 0}
        />
      )}
      <DialTextureOverlay
        design={design}
        dialRadius={dialRadius}
        z={stack.outerDialSurface + 0.035}
        accentColor={accentColor}
        opacity={dialBodyOpacity}
      />
      {design.renderMode !== 'technical' && dialPbrTexture ? (
        <DialPbrMicrotexture
          textureKey={dialPbrTexture}
          dialRadius={dialRadius}
          z={stack.outerDialSurface + 0.05}
          opacity={dialBodyOpacity}
        />
      ) : null}
      {design.renderMode === 'technical' ? (
        <group>
          <mesh position={[0, 0, guideZ]}>
            <torusGeometry args={[dialRadius, 0.035, 8, 128]} />
            <meshBasicMaterial color="#d7fbe8" transparent opacity={0.9} depthTest={false} />
          </mesh>
          <mesh position={[0, 0, guideZ + 0.02]}>
            <torusGeometry args={[0.85, 0.035, 8, 48]} />
            <meshBasicMaterial color="#f8fafc" transparent opacity={0.92} depthTest={false} />
          </mesh>
          <mesh position={[0, 0, guideZ + 0.035]}>
            <torusGeometry args={[sunkenRadius, 0.026, 8, 96]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.76} depthTest={false} />
          </mesh>
          <EditorLine from={[-dialRadius + 0.55, 0, guideZ + 0.04]} to={[dialRadius - 0.55, 0, guideZ + 0.04]} color="#cbd5e1" />
          <EditorLine from={[0, -dialRadius + 0.55, guideZ + 0.04]} to={[0, dialRadius - 0.55, guideZ + 0.04]} color="#cbd5e1" />
        </group>
      ) : null}
      {design.dial.sunkenCenter ? (
        <>
          <AnnulusMesh
            outerRadius={sunkenRadius + 0.18}
            innerRadius={Math.max(0.1, sunkenRadius - 0.18)}
            depth={Math.max(design.dial.sunkenDepth, 0.05)}
            z={stack.centerDialSurface}
            color={sunkenColor}
            opacity={Math.max(0.28, dialBodyOpacity * 0.88)}
          />
          <ZCylinder
            radius={sunkenRadius}
            depth={0.045}
            z={stack.centerDialSurface + 0.025}
            color={sunkenConflict ? '#7f1d1d' : (design.renderMode === 'technical' ? centerColor : dialMaterial.color)}
            opacity={Math.max(0.58, dialBodyOpacity)}
            segments={96}
            metalness={dialMaterial.metalness}
            roughness={Math.min(dialMaterial.roughness + 0.08, 1)}
          />
          <mesh position={[0, 0, stack.centerDialSurface + 0.08]}>
            <torusGeometry args={[sunkenRadius, 0.045, 8, 96]} />
            <meshStandardMaterial color={sunkenConflict ? '#ef4444' : '#4b5563'} metalness={0.25} roughness={0.5} transparent={dialBodyOpacity < 1} opacity={Math.max(0.5, dialBodyOpacity)} />
          </mesh>
          <group>
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
              <mesh
                key={angle}
                position={[
                  Math.cos(angle) * (sunkenRadius + 0.42),
                  Math.sin(angle) * (sunkenRadius + 0.42),
                  stack.centerDialSurface + design.dial.sunkenDepth / 2,
                ]}
              >
                <boxGeometry args={[0.08, 0.08, Math.max(design.dial.sunkenDepth, 0.08)]} />
                <meshBasicMaterial color={sunkenConflict ? '#ef4444' : '#38bdf8'} transparent opacity={Math.max(0.42, dialBodyOpacity)} />
              </mesh>
            ))}
          </group>
        </>
      ) : null}
      {design.dial.outerRingHeight > 0.01 ? (
        <AnnulusMesh
          outerRadius={dialRadius}
          innerRadius={Math.min(sunkenRadius, dialRadius - 0.4)}
          depth={design.dial.outerRingHeight}
          z={stack.baseDialTop}
          color={design.renderMode === 'technical' ? '#3ddc84' : '#20242e'}
          opacity={dialBodyOpacity}
          metalness={dialMaterial.metalness}
          roughness={dialMaterial.roughness}
          clearcoat={dialMaterial.clearcoat ?? 0}
        />
      ) : null}
      {design.dial.showDialFeet ? (
        <>
          <ZCylinder radius={0.35} depth={0.58} z={stack.dialBottom - 0.3} color="#94a3b8" segments={24} />
          <group rotation={[0, 0, Math.PI]}>
            <mesh position={[5.6, -7.2, stack.dialBottom - 0.3]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.58, 24]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.55} roughness={0.3} />
            </mesh>
          </group>
        </>
      ) : null}
      {design.dial.reliefs.map((relief) => (
        <ReliefMesh
          key={relief.id}
          design={design}
          relief={relief}
          conflict={result.conflictIds.has(`relief:${relief.id}`)}
          selected={selectedPart === `relief:${relief.id}`}
          onSelectPart={onSelectPart}
          focusMode={focusMode}
          selectedPart={selectedPart}
          focusOpacity={focusOpacity}
        />
      ))}
    </group>
  )
}

function ReliefMesh({
  design,
  relief,
  conflict,
  selected,
  onSelectPart,
  focusMode,
  selectedPart,
  focusOpacity,
}: {
  design: WatchDesign
  relief: ReliefFeature
  conflict: boolean
  selected: boolean
  onSelectPart: (part: SelectablePart) => void
  focusMode: FocusMode
  selectedPart: SelectablePart
  focusOpacity: number
}) {
  const stack = calculateWatchStack(design)
  const radius = Math.hypot(relief.x, relief.y)
  const surface = localDialSurface(design, stack.baseDialTop, radius)
  const color = conflict ? '#ef4444' : relief.color
  const select = makeSelectHandler(onSelectPart)
  const selectionRadius = Math.max(relief.radius, relief.width, relief.length) + 0.18
  const thisPart = `relief:${relief.id}` as SelectablePart
  const isActiveRelief = selectedPart === thisPart || selectedPart === 'dial'
  const visible = focusMode !== 'isolate' || isActiveRelief
  const opacity = selected ? 1 : focusMode === 'assembly' || selectedPart === 'dial' ? focusOpacity : Math.min(focusOpacity, 0.18)
  const reliefOpacity = Math.min(opacity, relief.opacity ?? 1)
  const rotationZ = degToRad(relief.rotationDeg ?? 0)
  const triangleGeometry = useMemo(
    () => makeTriangleMarkerGeometry(Math.max(relief.width, 0.1), Math.max(relief.length, 0.1), Math.max(relief.height, 0.025)),
    [relief.height, relief.length, relief.width],
  )
  const textValue = relief.text?.trim() ?? ''
  const isRomanNumeral = /^[IVXL]+$/i.test(textValue)
  const textFontSize = isRomanNumeral
    ? textValue.length >= 5
      ? 0.9
      : textValue.length >= 4
        ? 1
        : 1.16
    : textValue.length >= 3
      ? 1.08
      : 1.36
  const textColor = conflict ? '#ef4444' : color

  if (!visible) return null

  if (relief.text) {
    return (
      <group onClick={select(`relief:${relief.id}`)}>
        <SelectionHalo active={selected} radius={Math.max(0.8, relief.text.length * 0.38)} z={surface + relief.height + 0.08} color="#7c3aed" />
        <Text
          position={[relief.x + 0.025, relief.y - 0.035, surface + relief.height + 0.045]}
          rotation={[0, 0, rotationZ]}
          fontSize={textFontSize}
          letterSpacing={0}
          anchorX="center"
          anchorY="middle"
          color="#05070a"
          outlineWidth={0.012}
          outlineColor="#05070a"
        >
          {relief.text}
        </Text>
        <Text
          position={[relief.x, relief.y, surface + relief.height + 0.06]}
          rotation={[0, 0, rotationZ]}
          fontSize={textFontSize}
          letterSpacing={0}
          anchorX="center"
          anchorY="middle"
          color={textColor}
          outlineWidth={0.012}
          outlineColor={design.renderMode === 'technical' ? '#0b0f16' : '#15100a'}
        >
          {relief.text}
        </Text>
      </group>
    )
  }

  if (relief.type === 'marker' && relief.visualStyle === 'triangle') {
    return (
      <group onClick={select(`relief:${relief.id}`)}>
        <SelectionHalo active={selected} radius={selectionRadius} z={surface + relief.height + 0.08} color="#7c3aed" />
        <mesh position={[relief.x, relief.y, surface]} rotation={[0, 0, rotationZ]} castShadow>
          <primitive attach="geometry" object={triangleGeometry} />
          <meshPhysicalMaterial color={color} metalness={0.26} roughness={0.34} clearcoat={0.2} transparent={reliefOpacity < 1} opacity={reliefOpacity} />
        </mesh>
      </group>
    )
  }

  if (relief.type === 'circle' && relief.radius > 4 && Math.abs(relief.x) < 0.01 && Math.abs(relief.y) < 0.01) {
    return (
      <group onClick={select(`relief:${relief.id}`)}>
        <SelectionHalo active={selected} radius={relief.radius + relief.width / 2 + 0.25} z={surface + relief.height + 0.12} color="#7c3aed" />
        <AnnulusMesh
          outerRadius={relief.radius + relief.width / 2}
          innerRadius={Math.max(0.1, relief.radius - relief.width / 2)}
          depth={relief.height}
          z={surface}
          color={color}
          opacity={0.95 * reliefOpacity}
        />
      </group>
    )
  }

  if (relief.type === 'circle') {
    return (
      <group onClick={select(`relief:${relief.id}`)}>
        <SelectionHalo active={selected} radius={selectionRadius} z={surface + relief.height + 0.08} color="#7c3aed" />
        <mesh position={[relief.x, relief.y, surface + relief.height / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[relief.radius, relief.radius, relief.height, 36]} />
          <meshStandardMaterial color={color} metalness={0.25} roughness={0.45} transparent={reliefOpacity < 1} opacity={reliefOpacity} />
        </mesh>
      </group>
    )
  }

  return (
    <group onClick={select(`relief:${relief.id}`)}>
      <SelectionHalo active={selected} radius={selectionRadius} z={surface + relief.height + 0.08} color="#7c3aed" />
      <mesh position={[relief.x, relief.y, surface + relief.height / 2]} rotation={[0, 0, rotationZ]} castShadow>
        <boxGeometry args={[relief.width, relief.length, relief.height]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.48} transparent={reliefOpacity < 1} opacity={reliefOpacity} />
      </mesh>
    </group>
  )
}

function HandMesh({
  id,
  hand,
  design,
  palette,
  conflict,
  baseAngle,
  selectedPart,
  onSelectPart,
  focusMode,
}: {
  id: 'hour' | 'minute' | 'second'
  hand: HandConfig
  design: WatchDesign
  palette: Palette
  conflict: boolean
  baseAngle: number
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusMode: FocusMode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const stack = calculateWatchStack(design)
  const handMaterial = presetFor(design.materials.handsMaterial)
  const color = conflict ? palette.caseConflict : (hand.color || palette.hands)
  const visualStyle = hand.visualStyle ?? (id === 'second' ? 'second_needle' : 'dauphine')
  const tipWidth = hand.tipWidth ?? (id === 'second' ? 0.04 : Math.max(0.08, hand.width * 0.16))
  const tailLength = hand.tailLength ?? (id === 'second' ? 3.2 : 1.1)
  const partId: SelectablePart = id === 'hour' ? 'hourHand' : id === 'minute' ? 'minuteHand' : 'secondHand'
  const select = makeSelectHandler(onSelectPart)
  const selectedNeedsHandReference = selectedPart === 'dial' || selectedPart.startsWith('relief:')
  const isActive = selectedPart === partId || (focusMode === 'assembly' && selectedPart !== 'hourHand' && selectedPart !== 'minuteHand' && selectedPart !== 'secondHand')
  const selectedIsHand = selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand'
  const hiddenByIsolation = focusMode === 'isolate' && selectedIsHand && selectedPart !== partId
  const focusOpacity =
    selectedIsHand && selectedPart !== partId
      ? 0.16
      : selectedNeedsHandReference && focusMode === 'workshop'
        ? 0.22
      : 1
  const handBaseZ = stack.handReferenceSurface
  const bladeGeometry = useMemo(
    () => makeHandBladeGeometry(visualStyle, hand.length, hand.width, tipWidth, hand.thickness),
    [hand.length, hand.thickness, hand.width, tipWidth, visualStyle],
  )
  const bladeZ = handBaseZ + hand.heightOverDial + handCurveHeightAt(hand, hand.length * 0.52) + hand.thickness / 2
  const materialOpacity = isActive ? 1 : focusOpacity

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const speed = id === 'hour' ? 0.08 : id === 'minute' ? 0.72 : 5.2
    const animated = design.viewMode === 'sweep' ? clock.elapsedTime * speed : 0
    groupRef.current.rotation.z = degToRad(baseAngle) + animated
  })

  if (hiddenByIsolation) return null

  return (
    <group ref={groupRef} rotation={[0, 0, degToRad(baseAngle)]} onClick={select(partId)}>
      <SelectionHalo
        active={selectedPart === partId}
        radius={Math.max(hand.length, 1)}
        z={handBaseZ + hand.heightOverDial + hand.thickness + 0.1}
        color={id === 'second' ? '#ef4444' : '#f7c948'}
        tube={0.035}
      />
      <mesh position={[0, 0, bladeZ]} castShadow>
        <primitive attach="geometry" object={bladeGeometry} />
        <meshPhysicalMaterial
          color={color}
          metalness={handMaterial.metalness}
          roughness={handMaterial.roughness}
          clearcoat={handMaterial.clearcoat ?? 0.28}
          clearcoatRoughness={Math.min(handMaterial.roughness + 0.05, 1)}
          envMapIntensity={1.28}
          transparent={materialOpacity < 1}
          opacity={materialOpacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hand.lume || visualStyle === 'syringe' ? (
        <mesh position={[0, hand.length * 0.48, bladeZ + hand.thickness * 0.58]} castShadow>
          <boxGeometry args={[Math.max(hand.width * 0.32, 0.08), hand.length * 0.58, Math.max(hand.thickness * 0.24, 0.018)]} />
          <meshStandardMaterial color="#d9f99d" emissive="#6ee7b7" emissiveIntensity={0.18} transparent={materialOpacity < 1} opacity={Math.min(materialOpacity, 0.9)} />
        </mesh>
      ) : null}
      {hand.skeletonized || visualStyle === 'skeleton' ? (
        <mesh position={[0, hand.length * 0.52, bladeZ + hand.thickness * 0.62]} castShadow>
          <boxGeometry args={[Math.max(hand.width * 0.42, 0.16), hand.length * 0.52, Math.max(hand.thickness * 0.28, 0.02)]} />
          <meshStandardMaterial color="#070a0f" metalness={0.05} roughness={0.7} transparent opacity={Math.min(materialOpacity, 0.82)} />
        </mesh>
      ) : null}
      {visualStyle === 'second_lollipop' ? (
        <mesh position={[0, hand.length * 0.82, bladeZ + hand.thickness * 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, Math.max(hand.thickness * 0.55, 0.035), 28]} />
          <meshPhysicalMaterial color={color} metalness={handMaterial.metalness} roughness={handMaterial.roughness} clearcoat={0.22} transparent={materialOpacity < 1} opacity={materialOpacity} />
        </mesh>
      ) : null}
      {hand.counterweight ? (
        <>
          <mesh position={[0, -tailLength / 2, bladeZ]} castShadow>
            <boxGeometry args={[Math.max(hand.width * 0.5, 0.08), tailLength, hand.thickness]} />
            <meshPhysicalMaterial color={color} metalness={handMaterial.metalness} roughness={handMaterial.roughness} clearcoat={0.22} transparent={materialOpacity < 1} opacity={materialOpacity} />
          </mesh>
          {id === 'second' ? (
            <mesh position={[0, -tailLength - 0.12, bladeZ + hand.thickness * 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, Math.max(hand.thickness * 0.5, 0.03), 24]} />
              <meshPhysicalMaterial color={color} metalness={handMaterial.metalness} roughness={handMaterial.roughness} clearcoat={0.22} transparent={materialOpacity < 1} opacity={materialOpacity} />
            </mesh>
          ) : null}
        </>
      ) : null}
      <mesh position={[0, 0, handBaseZ + hand.heightOverDial + hand.tubeHeight / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[Math.max(hand.outerTubeDiameter / 2, hand.holeSize / 2 + 0.08), Math.max(hand.outerTubeDiameter / 2, hand.holeSize / 2 + 0.08), hand.tubeHeight, 36]} />
        <meshPhysicalMaterial color={color} metalness={handMaterial.metalness} roughness={Math.max(handMaterial.roughness - 0.06, 0.08)} clearcoat={handMaterial.clearcoat ?? 0.24} transparent={materialOpacity < 1} opacity={materialOpacity} />
      </mesh>
    </group>
  )
}

function HandStackCap({
  design,
  palette,
  selectedPart,
  focusMode,
}: {
  design: WatchDesign
  palette: Palette
  selectedPart: SelectablePart
  focusMode: FocusMode
}) {
  const stack = calculateWatchStack(design)
  const handMaterial = presetFor(design.materials.handsMaterial)
  const selectedIsHand = selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand'
  const hiddenByIsolation = focusMode === 'isolate' && !selectedIsHand
  const activeHands = [
    design.hands.hour,
    design.hands.minute,
    ...(design.hands.count === 3 && design.hands.secondsEnabled ? [design.hands.second] : []),
  ]
  const topOfStack = activeHands.reduce(
    (top, hand) => Math.max(top, hand.heightOverDial + Math.max(hand.tubeHeight, hand.thickness)),
    0.35,
  )
  const capZ = stack.handReferenceSurface + topOfStack + 0.05
  const capColor = design.renderMode === 'technical' ? palette.hands : handMaterial.color

  if (hiddenByIsolation) return null

  return (
    <group>
      <mesh position={[0, 0, capZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.16, 48]} />
        <meshPhysicalMaterial color={capColor} metalness={handMaterial.metalness} roughness={Math.max(handMaterial.roughness - 0.06, 0.08)} clearcoat={handMaterial.clearcoat ?? 0.34} envMapIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0, capZ + 0.09]}>
        <torusGeometry args={[0.5, 0.035, 8, 48]} />
        <meshPhysicalMaterial color="#ffffff" metalness={0.4} roughness={0.18} clearcoat={0.4} transparent opacity={0.38} envMapIntensity={1.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

function HandsAssembly({
  design,
  result,
  palette,
  selectedPart,
  onSelectPart,
  focusMode,
}: {
  design: WatchDesign
  result: ValidationResult
  palette: Palette
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusMode: FocusMode
}) {
  return (
    <group>
      <HandMesh
        id="hour"
        hand={design.hands.hour}
        design={design}
        palette={palette}
        conflict={result.conflictIds.has('hourHand')}
        baseAngle={-50}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        focusMode={focusMode}
      />
      <HandMesh
        id="minute"
        hand={design.hands.minute}
        design={design}
        palette={palette}
        conflict={result.conflictIds.has('minuteHand')}
        baseAngle={50}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        focusMode={focusMode}
      />
      {design.hands.count === 3 && design.hands.secondsEnabled ? (
        <HandMesh
          id="second"
          hand={design.hands.second}
          design={design}
          palette={palette}
          conflict={result.conflictIds.has('secondHand')}
          baseAngle={184}
          selectedPart={selectedPart}
          onSelectPart={onSelectPart}
          focusMode={focusMode}
        />
      ) : null}
      <HandStackCap design={design} palette={palette} selectedPart={selectedPart} focusMode={focusMode} />
    </group>
  )
}

function CrystalModel({
  design,
  result,
  palette,
  selectedPart,
  onSelectPart,
  focusOpacity,
  visualCrystalVisible,
  visualReflectionLevel,
}: {
  design: WatchDesign
  result: ValidationResult
  palette: Palette
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusOpacity: number
  visualCrystalVisible: boolean
  visualReflectionLevel: VisualReflectionLevel
}) {
  if (!design.crystal.visible || !visualCrystalVisible) return null

  const conflict = result.conflictIds.has('crystal')
  const crystalMaterial = presetFor(design.materials.crystalMaterial)
  const color = conflict ? palette.caseConflict : design.renderMode === 'technical' ? crystalMaterial.color : '#ffffff'
  const inspectionOpacity = selectedPart === 'crystal' ? 0.3 : 0.13
  const baseOpacity = crystalMaterial.opacity ?? design.crystal.transparency
  const visualBaseOpacity = design.renderMode === 'technical' ? baseOpacity : Math.min(baseOpacity, 0.105)
  const opacity = (design.viewMode === 'transparent' || design.viewMode === 'section' ? inspectionOpacity : visualBaseOpacity) * focusOpacity
  const radius = design.crystal.diameter / 2
  const topZ = design.case.totalHeight - design.crystal.thickness / 2
  const select = makeSelectHandler(onSelectPart)
  const reflectionIntensity = reflectionIntensityByLevel[visualReflectionLevel]
  const edgeOpacity = Math.min(0.28, Math.max(0.065, opacity * 1.65 * Math.max(0.35, reflectionIntensity)))
  const reflectionOpacity = visualReflectionLevel === 'off' ? 0 : Math.min(0.16, Math.max(0.02, opacity * 1.15 * reflectionIntensity))
  const crystalEnvIntensity = 0.55 + reflectionIntensity * 0.9

  return (
    <group onClick={select('crystal')}>
      <SelectionHalo active={selectedPart === 'crystal'} radius={radius + 0.36} z={design.case.totalHeight + 0.18} color="#38bdf8" />
      <mesh position={[0, 0, topZ]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, design.crystal.thickness, 192]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          transmission={Math.max(crystalMaterial.transmission ?? 0.78, 0.86)}
          ior={1.45}
          roughness={crystalMaterial.roughness}
          metalness={0}
          clearcoat={crystalMaterial.clearcoat ?? 1}
          clearcoatRoughness={0.03}
          thickness={Math.max(design.crystal.thickness, 0.3)}
          envMapIntensity={crystalEnvIntensity}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, design.case.totalHeight + 0.035]}>
        <torusGeometry args={[radius - 0.08, 0.045, 10, 192]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={edgeOpacity} roughness={0.02} metalness={0} clearcoat={1} envMapIntensity={crystalEnvIntensity} depthWrite={false} />
      </mesh>
      <mesh position={[-radius * 0.22, radius * 0.24, design.case.totalHeight + 0.08]} rotation={[0, 0, -0.72]}>
        <boxGeometry args={[radius * 1.1, 0.05, 0.012]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={reflectionOpacity} depthWrite={false} />
      </mesh>
      {design.crystal.type === 'domed' ? (
        <mesh position={[0, 0, design.case.totalHeight - 0.1]} scale={[1, 1, 0.12]}>
          <sphereGeometry args={[radius, 96, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color={color} transparent opacity={opacity * 0.38} transmission={Math.max(crystalMaterial.transmission ?? 0.78, 0.88)} ior={1.45} roughness={crystalMaterial.roughness} clearcoat={1} envMapIntensity={crystalEnvIntensity} depthWrite={false} />
        </mesh>
      ) : null}
      {design.crystal.type === 'box' ? (
        <RingMesh shape="round" outer={design.crystal.diameter} inner={design.crystal.diameter - 1.3} depth={1.05} z={design.case.totalHeight - 1.05} color={color} opacity={opacity * 0.48} bevel={0.02} metalness={0} roughness={crystalMaterial.roughness} clearcoat={0.65} />
      ) : null}
    </group>
  )
}

function CaseModel({
  design,
  result,
  palette,
  selectedPart,
  onSelectPart,
  focusOpacity,
}: {
  design: WatchDesign
  result: ValidationResult
  palette: Palette
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusOpacity: number
}) {
  if (!design.case.visible) return null

  const conflict = result.conflictIds.has('case')
  const caseMaterial = presetFor(design.materials.caseMaterial)
  const selectedTechnicalCase = design.renderMode === 'technical' && selectedPart === 'case'
  const inspectionOpacity = selectedPart === 'case' ? 0.055 : 0.12
  const opacity =
    design.case.transparent || design.viewMode === 'transparent' || design.viewMode === 'section' || design.viewMode === 'heatmap'
      ? inspectionOpacity * focusOpacity
      : selectedTechnicalCase
        ? 0.045 * focusOpacity
        : focusOpacity
  const backOpacity = selectedTechnicalCase ? 0.025 * focusOpacity : opacity
  const bezelOpacity = selectedTechnicalCase ? 0.14 * focusOpacity : Math.min(1, opacity + 0.18)
  const color = conflict ? palette.caseConflict : palette.case
  const select = makeSelectHandler(onSelectPart)
  const darkCase = design.materials.caseMaterial === 'pvd_black' || design.materials.caseMaterial === 'black_ceramic'
  const caseEdgeLight = darkCase ? '#3b4350' : '#edf2f7'
  const caseEdgeShadow = darkCase ? '#05070a' : '#7d8794'
  const showRoundMetalEdges = design.case.shape === 'round' && opacity > 0.35 && design.renderMode !== 'technical'

  return (
    <group onClick={select('case')}>
      <SelectionHalo active={selectedPart === 'case'} radius={design.case.outerDiameter / 2 + 0.5} z={design.case.totalHeight + 0.25} color="#7aa7c7" />
      <RingMesh
        shape={design.case.shape}
        outer={design.case.outerDiameter}
        inner={design.case.innerDiameter}
        depth={design.case.totalHeight}
        z={0}
        color={color}
        opacity={opacity}
        bevel={0.18}
        metalness={caseMaterial.metalness}
        roughness={caseMaterial.roughness}
        clearcoat={caseMaterial.clearcoat ?? 0.16}
      />
      {showRoundMetalEdges ? (
        <>
          <mesh position={[0, 0, design.case.totalHeight - 0.1]}>
            <torusGeometry args={[design.case.outerDiameter / 2 - 0.18, 0.04, 10, 192]} />
            <meshPhysicalMaterial color={caseEdgeLight} metalness={0.9} roughness={0.2} clearcoat={0.38} transparent opacity={0.34 * focusOpacity} envMapIntensity={1.55} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, Math.max(0.18, design.case.totalHeight - design.crystal.thickness - 0.2)]}>
            <torusGeometry args={[Math.max(0.8, design.case.innerDiameter / 2 - design.case.bezelThickness + 0.18), 0.035, 10, 192]} />
            <meshPhysicalMaterial color={caseEdgeShadow} metalness={0.72} roughness={0.28} clearcoat={0.18} transparent opacity={0.28 * focusOpacity} envMapIntensity={1.1} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, design.case.backThickness + 0.08]}>
            <torusGeometry args={[design.case.outerDiameter / 2 - 0.34, 0.028, 8, 160]} />
            <meshPhysicalMaterial color={caseEdgeShadow} metalness={0.72} roughness={0.34} clearcoat={0.12} transparent opacity={0.16 * focusOpacity} envMapIntensity={1} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      <AnnulusMesh
        outerRadius={design.case.innerDiameter / 2}
        innerRadius={Math.max(0.1, design.case.innerDiameter / 2 - design.case.bezelThickness)}
        depth={0.42}
        z={design.case.totalHeight - design.crystal.thickness - 0.08}
        color={color}
        opacity={bezelOpacity}
        metalness={caseMaterial.metalness}
        roughness={Math.max(caseMaterial.roughness - 0.08, 0.08)}
        clearcoat={caseMaterial.clearcoat ?? 0.18}
      />
      <DiscMesh
        shape={design.case.shape}
        diameter={design.case.outerDiameter - 1.2}
        depth={design.case.backThickness}
        z={0}
        color={palette.back}
        opacity={backOpacity}
        metalness={caseMaterial.metalness}
        roughness={Math.min(caseMaterial.roughness + 0.08, 1)}
        clearcoat={caseMaterial.clearcoat ?? 0.08}
      />
      {selectedTechnicalCase ? (
        <group>
          <mesh position={[0, 0, design.case.totalHeight + 0.08]}>
            <torusGeometry args={[design.case.outerDiameter / 2, 0.045, 8, 144]} />
            <meshBasicMaterial color="#9ad7ff" transparent opacity={0.96} depthTest={false} />
          </mesh>
          <mesh position={[0, 0, design.case.totalHeight + 0.12]}>
            <torusGeometry args={[design.case.innerDiameter / 2, 0.045, 8, 144]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.94} depthTest={false} />
          </mesh>
          <mesh position={[0, 0, design.case.totalHeight - design.crystal.thickness - 0.02]}>
            <torusGeometry args={[Math.max(0.5, design.case.innerDiameter / 2 - design.case.bezelThickness), 0.035, 8, 120]} />
            <meshBasicMaterial color="#f4d35e" transparent opacity={0.82} depthTest={false} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}

function StemAndCrown({
  design,
  result,
  palette,
  selectedPart,
  onSelectPart,
  focusMode,
  focusOpacity,
}: {
  design: WatchDesign
  result: ValidationResult
  palette: Palette
  selectedPart: SelectablePart
  onSelectPart: (part: SelectablePart) => void
  focusMode: FocusMode
  focusOpacity: number
}) {
  if (!design.stem.visible) return null

  const hardConflict = result.findings.some((finding) =>
    finding.severity === 'bad' && (finding.pieceIds.includes('stem') || finding.pieceIds.includes('crown')),
  )
  const color = hardConflict ? palette.caseConflict : palette.stem
  const stack = calculateWatchStack(design)
  const stemLength = design.stem.customLength
  const stemCenterX = design.case.innerDiameter / 2 + stemLength / 2 - 6
  const select = makeSelectHandler(onSelectPart)
  const showStem = focusMode === 'assembly' || focusMode === 'ghost' || selectedPart === 'stem' || selectedPart === 'crown'

  if (!showStem) return null

  return (
    <group rotation={[0, 0, degToRad(design.case.crownPositionDeg)]}>
      <mesh position={[stemCenterX, 0, stack.movementBottom + 1.55]} rotation={[0, 0, Math.PI / 2]} onClick={select('stem')}>
        <cylinderGeometry args={[0.3, 0.3, stemLength, 24]} />
        <meshStandardMaterial color={color} metalness={0.68} roughness={0.22} transparent={focusOpacity < 1} opacity={focusOpacity} />
      </mesh>
      {design.stem.crownInstalled ? (
        <group position={[design.case.outerDiameter / 2 + design.case.crownDiameter / 2, 0, stack.movementBottom + 1.55]} onClick={select('crown')}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[design.case.crownDiameter / 2, design.case.crownDiameter / 2, 2.2, 64]} />
            <meshPhysicalMaterial color={color} metalness={0.78} roughness={0.22} clearcoat={0.2} transparent={focusOpacity < 1} opacity={focusOpacity} />
          </mesh>
          {Array.from({ length: 18 }, (_, index) => {
            const angle = (index * Math.PI * 2) / 18
            return (
              <mesh
                key={`crown-ridge-${index}`}
                position={[0, Math.cos(angle) * (design.case.crownDiameter / 2 + 0.025), Math.sin(angle) * (design.case.crownDiameter / 2 + 0.025)]}
                rotation={[Math.PI / 2, angle, 0]}
              >
                <boxGeometry args={[2.35, 0.045, 0.11]} />
                <meshStandardMaterial color={color} metalness={0.68} roughness={0.28} transparent={focusOpacity < 1} opacity={focusOpacity} />
              </mesh>
            )
          })}
        </group>
      ) : null}
      <SelectionHalo active={selectedPart === 'stem'} radius={0.82} z={stack.movementBottom + 1.55} color="#e5e7eb" />
    </group>
  )
}

function SweepVolumes({ design }: { design: WatchDesign }) {
  if (!design.dial.showSweepZone && design.viewMode !== 'sweep') return null
  const stack = calculateWatchStack(design)
  const opacity = design.viewMode === 'sweep' ? 0.22 : 0.1
  const hands = [
    design.hands.hour,
    design.hands.minute,
    ...(design.hands.count === 3 && design.hands.secondsEnabled ? [design.hands.second] : []),
  ]

  return (
    <group>
      {hands.map((hand, index) => (
        <ZCylinder
          key={`${hand.length}-${index}`}
          radius={hand.length}
          depth={0.02}
          z={stack.handReferenceSurface + hand.heightOverDial + 0.02 + index * 0.03}
          color={design.hands.sweepColor}
          opacity={opacity / (index + 1)}
          segments={128}
          metalness={0}
          roughness={0.7}
        />
      ))}
    </group>
  )
}

const zoneColor = (status: ClearanceZone['status']) => {
  if (status === 'safe') return '#2dd36f'
  if (status === 'tight') return '#f4d35e'
  if (status === 'collision') return '#ef4444'
  return '#7c3aed'
}

function OpportunityHeatmap({ design, result, focusMode }: { design: WatchDesign; result: ValidationResult; focusMode: FocusMode }) {
  if (design.viewMode !== 'heatmap') return null
  if (focusMode === 'isolate' || focusMode === 'workshop') return null

  return (
    <group>
      {result.zones.map((zone, index) => {
        const z = design.case.totalHeight + 0.08 + index * 0.04
        const color = zoneColor(zone.status)
        const opacity = zone.status === 'collision' ? 0.18 : zone.status === 'opportunity' ? 0.13 : 0.1
        if (zone.angleStartDeg !== undefined && zone.angleEndDeg !== undefined) {
          return (
            <AnnularSectorMesh
              key={zone.id}
              outerRadius={zone.radiusEnd}
              innerRadius={Math.max(0.05, zone.radiusStart)}
              angleStartDeg={zone.angleStartDeg}
              angleEndDeg={zone.angleEndDeg}
              depth={0.025}
              z={z}
              color={color}
              opacity={opacity}
            />
          )
        }

        if (zone.id === 'outer') return null

        if (zone.radiusStart <= 0.01) {
          return (
            <ZCylinder
              key={zone.id}
              radius={zone.radiusEnd}
              depth={0.025}
              z={z}
              color={color}
              opacity={opacity}
              segments={128}
              metalness={0}
              roughness={0.72}
            />
          )
        }

        return (
          <AnnulusMesh
            key={zone.id}
            outerRadius={zone.radiusEnd}
            innerRadius={zone.radiusStart}
            depth={0.025}
            z={z}
            color={color}
            opacity={opacity}
          />
        )
      })}
    </group>
  )
}

function LayerReference({ design }: { design: WatchDesign }) {
  if (design.viewMode !== 'layers' && design.viewMode !== 'section') return null
  const stack = calculateWatchStack(design)
  const positions = [
    { z: stack.movementBottom, radius: 9.1, color: '#b48cf2' },
    { z: stack.outerDialSurface, radius: design.dial.commercialDiameter / 2, color: '#75dd9a' },
    { z: stack.crystalInnerTop, radius: design.crystal.diameter / 2, color: '#38bdf8' },
  ]

  return (
    <group>
      {positions.map((item) => (
        <mesh key={`${item.color}-${item.z}`} position={[0, 0, item.z]}>
          <torusGeometry args={[item.radius, 0.035, 8, 96]} />
          <meshBasicMaterial color={item.color} transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  )
}

function WatchScene({
  design,
  result,
  selectedPart,
  focusMode,
  onSelectPart,
  activeTool,
  snapEnabled,
  snapStep,
  beginLiveEdit,
  endLiveEdit,
  patchCaseLive,
  patchCrystalLive,
  patchReliefLive,
  patchDialLive,
  patchHandLive,
  presentationMode = false,
  visualCrystalVisible = true,
  visualReflectionLevel = 'medium',
}: SelectableSceneProps) {
  const palette = design.renderMode === 'technical' || design.viewMode === 'layers' ? technicalPalette : materialPaletteFromDesign(design)
  const isTechnicalRender = design.renderMode === 'technical'
  const layerOffset = design.viewMode === 'exploded' ? 1.15 : design.viewMode === 'layers' ? 0.6 : 0
  const caseFocus = partVisibility('case', selectedPart, focusMode)
  const movementFocus = partVisibility('movement', selectedPart, focusMode)
  const dialFocus = partVisibility('dial', selectedPart, focusMode)
  const crystalFocus = partVisibility('crystal', selectedPart, focusMode)
  const stemFocus =
    selectedPart === 'crown'
      ? partVisibility('crown', selectedPart, focusMode)
      : partVisibility('stem', selectedPart, focusMode)
  const selectedIsHand = selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand'
  const handsVisible =
    focusMode === 'isolate'
      ? selectedIsHand
      : focusMode !== 'workshop' || selectedIsHand || selectedPart === 'dial' || selectedPart.startsWith('relief:')
  const productRotation: [number, number, number] = presentationMode
    ? design.viewMode === 'free'
      ? [-0.08, 0.16, 0]
      : [0, 0, 0]
    : [-0.12, 0.18, 0]

  return (
    <>
      <color attach="background" args={[presentationMode ? '#eee8dd' : isTechnicalRender ? '#111827' : '#0d1117']} />
      <ambientLight intensity={presentationMode ? 0.72 : isTechnicalRender ? 0.72 : 0.88} />
      <hemisphereLight args={[presentationMode ? '#f9f5ec' : '#dbeafe', '#1f2937', presentationMode ? 0.66 : 0.48]} />
      <directionalLight position={[18, -24, 32]} intensity={presentationMode ? 1.55 : 2.18} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-22, 26, 20]} intensity={presentationMode ? 0.42 : 0.66} />
      <CameraRig viewMode={design.viewMode} selectedPart={selectedPart} focusMode={focusMode} />
      <group rotation={productRotation}>
        {caseFocus.visible ? (
          <CaseModel
            design={design}
            result={result}
            palette={palette}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            focusOpacity={caseFocus.opacity}
          />
        ) : null}
        <group position={[0, 0, layerOffset * -1.2]} visible={movementFocus.visible}>
          <MovementModel
            design={design}
            palette={palette}
            conflict={result.conflictIds.has('movement')}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            focusOpacity={movementFocus.opacity}
          />
        </group>
        <group position={[0, 0, layerOffset * 0.7]} visible={dialFocus.visible}>
          <DialModel
            design={design}
            result={result}
            palette={palette}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            focusMode={focusMode}
            focusOpacity={dialFocus.opacity}
          />
          <SweepVolumes design={design} />
        </group>
        <group position={[0, 0, layerOffset * 1.6]} visible={handsVisible}>
          <HandsAssembly
            design={design}
            result={result}
            palette={palette}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            focusMode={focusMode}
          />
        </group>
        <group position={[0, 0, layerOffset * 2.35]} visible={crystalFocus.visible}>
          <CrystalModel
            design={design}
            result={result}
            palette={palette}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            focusOpacity={crystalFocus.opacity}
            visualCrystalVisible={visualCrystalVisible}
            visualReflectionLevel={visualReflectionLevel}
          />
        </group>
        <StemAndCrown
          design={design}
          result={result}
          palette={palette}
          selectedPart={selectedPart}
          onSelectPart={onSelectPart}
          focusMode={focusMode}
          focusOpacity={stemFocus.opacity}
        />
        {isTechnicalRender ? <OpportunityHeatmap design={design} result={result} focusMode={focusMode} /> : null}
        {isTechnicalRender ? <LayerReference design={design} /> : null}
        {!presentationMode ? (
          <DirectEditorGizmos
            design={design}
            selectedPart={selectedPart}
            result={result}
            activeTool={activeTool}
            snapEnabled={snapEnabled}
            snapStep={snapStep}
            beginLiveEdit={beginLiveEdit}
            endLiveEdit={endLiveEdit}
            patchCaseLive={patchCaseLive}
            patchCrystalLive={patchCrystalLive}
            patchReliefLive={patchReliefLive}
            patchDialLive={patchDialLive}
            patchHandLive={patchHandLive}
          />
        ) : null}
      </group>
      {presentationMode ? (
        <PresentationSurface />
      ) : null}
      {isTechnicalRender ? <gridHelper args={[54, 27, '#334155', '#1f2937']} position={[0, 0, -0.02]} /> : null}
      {isTechnicalRender ? (
        <Environment preset="warehouse" />
      ) : (
        <Environment files={presentationMode ? REALISM_ASSETS.hdri.presentation : REALISM_ASSETS.hdri.design} />
      )}
    </>
  )
}

export function WatchViewer({
  design,
  result,
  selectedPart,
  focusMode,
  onSelectPart,
  sceneSelectionLocked,
  activeTool,
  snapEnabled,
  snapStep,
  beginLiveEdit,
  endLiveEdit,
  patchCaseLive,
  patchCrystalLive,
  patchReliefLive,
  patchDialLive,
  patchHandLive,
  presentationMode = false,
  visualCrystalVisible = true,
  visualReflectionLevel = 'medium',
}: WatchViewerProps) {
  const sceneSelect = sceneSelectionLocked ? () => undefined : onSelectPart

  return (
    <div className={`viewer-shell mode-${design.renderMode} ${presentationMode ? 'presentation-viewer' : ''} ${sceneSelectionLocked ? 'selection-locked' : ''}`}>
      <Canvas
        key={`${presentationMode ? 'presentation' : 'studio'}-${design.renderMode}`}
        shadows
        camera={{ position: [35, -42, 32], fov: 34, near: 0.1, far: 200 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = presentationMode ? 0.68 : design.renderMode === 'technical' ? 0.92 : 0.82
        }}
        dpr={[1, 2]}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <CanvasViewportSync />
          <WatchScene
            design={design}
            result={result}
            selectedPart={selectedPart}
            focusMode={focusMode}
            onSelectPart={sceneSelect}
            sceneSelectionLocked={sceneSelectionLocked}
            activeTool={activeTool}
            snapEnabled={snapEnabled}
            snapStep={snapStep}
            beginLiveEdit={beginLiveEdit}
            endLiveEdit={endLiveEdit}
            patchCaseLive={patchCaseLive}
            patchCrystalLive={patchCrystalLive}
            patchReliefLive={patchReliefLive}
            patchDialLive={patchDialLive}
            patchHandLive={patchHandLive}
            presentationMode={presentationMode}
            visualCrystalVisible={visualCrystalVisible}
            visualReflectionLevel={visualReflectionLevel}
          />
        </Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={[0, 0, 4]} />
        <OrbitTarget viewMode={design.viewMode} selectedPart={selectedPart} focusMode={focusMode} />
      </Canvas>
      {!presentationMode ? <div className="viewer-badge">
        <span>{design.renderMode === 'technical' ? 'Modo técnico' : 'Modo bonito'}</span>
        <strong>{design.viewMode} · {focusMode}</strong>
      </div> : null}
    </div>
  )
}
