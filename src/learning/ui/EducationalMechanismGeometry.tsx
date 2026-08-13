import { useMemo } from 'react'
import {
  CatmullRomCurve3,
  Path,
  Shape,
  Vector3,
} from 'three'
import type { EducationalVisualPrimitive } from '../visual/model'

function annularSectorShape(
  outerRadius: number,
  innerRadius: number,
  missingRadians: number,
): Shape {
  const shape = new Shape()
  const start = missingRadians / 2
  const end = Math.PI * 2 - missingRadians / 2
  shape.absarc(0, 0, outerRadius, start, end, false)
  shape.lineTo(Math.cos(end) * innerRadius, Math.sin(end) * innerRadius)
  shape.absarc(0, 0, innerRadius, end, start, true)
  shape.closePath()
  return shape
}

function toothedShape(
  pitchRadius: number,
  toothCount: number,
  boreRatio: number,
  escapeProfile: boolean,
): Shape {
  const shape = new Shape()
  const rootRadius = pitchRadius * (escapeProfile ? 0.7 : 0.88)
  const tipRadius = pitchRadius * (escapeProfile ? 1.14 : 1.07)
  const flankRadius = pitchRadius * (escapeProfile ? 0.82 : 0.97)
  const pointCount = toothCount * 4
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const angle = pointIndex / pointCount * Math.PI * 2
    const phase = pointIndex % 4
    const radius = phase === 0
      ? rootRadius
      : phase === 1
        ? flankRadius
        : phase === 2
          ? tipRadius
          : flankRadius
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (pointIndex === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const bore = new Path()
  bore.absarc(0, 0, Math.max(0.018, pitchRadius * boreRatio), 0, Math.PI * 2, true)
  shape.holes.push(bore)
  return shape
}

function palletForkShape(length: number, width: number): Shape {
  const halfLength = length / 2
  const halfWidth = width / 2
  const shape = new Shape()
  shape.moveTo(-halfLength, -halfWidth * 0.34)
  shape.lineTo(halfLength * 0.12, -halfWidth * 0.34)
  shape.lineTo(halfLength * 0.78, -halfWidth)
  shape.lineTo(halfLength, -halfWidth * 0.72)
  shape.lineTo(halfLength * 0.38, 0)
  shape.lineTo(halfLength, halfWidth * 0.72)
  shape.lineTo(halfLength * 0.78, halfWidth)
  shape.lineTo(halfLength * 0.12, halfWidth * 0.34)
  shape.lineTo(-halfLength, halfWidth * 0.34)
  shape.closePath()
  const pivot = new Path()
  pivot.absarc(-halfLength * 0.67, 0, Math.max(0.025, halfWidth * 0.22), 0, Math.PI * 2, true)
  shape.holes.push(pivot)
  return shape
}

export function ProceduralMechanismGeometry({
  primitive,
}: {
  primitive: EducationalVisualPrimitive
}) {
  const radius = Math.max(0.03, Math.abs(primitive.size[0]) / 2)
  const depth = Math.max(0.025, Math.abs(primitive.size[1]))
  const secondary = Math.max(0.025, Math.abs(primitive.size[2]))
  const toothCount = primitive.toothCount ?? Math.max(12, Math.round(radius * 18))
  const boreRatio = primitive.boreRatio ?? (primitive.visualProfile === 'pinion' ? 0.22 : 0.12)
  const gearShape = useMemo(
    () => toothedShape(radius, toothCount, boreRatio, primitive.visualProfile === 'escape-wheel'),
    [boreRatio, primitive.visualProfile, radius, toothCount],
  )
  const coverShape = useMemo(
    () => annularSectorShape(radius, Math.max(0.025, radius * boreRatio), primitive.cutaway ? Math.PI * 0.42 : 0.001),
    [boreRatio, primitive.cutaway, radius],
  )
  const forkShape = useMemo(
    () => palletForkShape(Math.max(0.08, Math.abs(primitive.size[0])), Math.max(0.06, Math.abs(primitive.size[2]))),
    [primitive.size],
  )
  const extrusion = useMemo(() => ({
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: Math.min(0.018, depth * 0.12),
    bevelThickness: Math.min(0.012, depth * 0.1),
    curveSegments: 2,
    steps: 1,
  }), [depth])

  if (primitive.shape === 'wheel') {
    return <extrudeGeometry args={[gearShape, extrusion]} />
  }
  if (primitive.visualProfile === 'barrel-cover') {
    return <extrudeGeometry args={[coverShape, extrusion]} />
  }
  if (primitive.visualProfile === 'pallet-fork') {
    return <extrudeGeometry args={[forkShape, extrusion]} />
  }
  if (primitive.shape === 'ring' || primitive.shape === 'coil') {
    return <torusGeometry args={[radius, Math.max(0.018, Math.min(radius * 0.16, depth / 2)), 12, 64]} />
  }
  if (primitive.shape === 'rod') {
    return <cylinderGeometry args={[Math.max(0.025, secondary / 2), Math.max(0.025, secondary / 2), Math.max(depth, radius * 2), 24]} />
  }
  if (primitive.shape === 'box' || primitive.shape === 'bridge') {
    return <boxGeometry args={[
      Math.max(0.04, Math.abs(primitive.size[0])),
      depth,
      Math.max(0.04, Math.abs(primitive.size[2])),
    ]} />
  }
  if (primitive.shape === 'symbolic-marker') {
    return <octahedronGeometry args={[Math.max(0.08, radius), 0]} />
  }
  return <cylinderGeometry args={[radius, radius * (primitive.shape === 'screw' ? 0.82 : 1), depth, 48]} />
}

function spiralCurve(primitive: EducationalVisualPrimitive): CatmullRomCurve3 {
  const isMainspring = primitive.visualProfile === 'mainspring'
  const turns = isMainspring ? 5.2 : 4.4
  const radius = Math.max(0.08, Math.abs(primitive.size[0]) / 2)
  const points = Array.from({ length: 180 }, (_, index) => {
    const progress = index / 179
    const angle = progress * Math.PI * 2 * turns
    const currentRadius = radius * (isMainspring
      ? 0.18 + progress * 0.78
      : 0.12 + progress * 0.88)
    return new Vector3(
      primitive.position[0] + Math.cos(angle) * currentRadius,
      primitive.position[1],
      primitive.position[2] + Math.sin(angle) * currentRadius,
    )
  })
  return new CatmullRomCurve3(points, false, 'centripetal')
}

export function SpringPrimitive({
  primitive,
  color,
  opacity,
  emissive,
  emissiveIntensity,
}: {
  primitive: EducationalVisualPrimitive
  color: string
  opacity: number
  emissive: string
  emissiveIntensity: number
}) {
  const curve = useMemo(() => spiralCurve(primitive), [primitive])
  const radius = primitive.visualProfile === 'mainspring'
    ? Math.max(0.018, Math.abs(primitive.size[1]) * 0.32)
    : Math.max(0.012, Math.abs(primitive.size[1]) * 0.25)
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 220, radius, primitive.visualProfile === 'mainspring' ? 4 : 7, false]} />
      <meshStandardMaterial
        color={color}
        roughness={0.32}
        metalness={0.78}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity < 0.999}
        opacity={opacity}
        depthWrite={opacity > 0.45}
      />
    </mesh>
  )
}
