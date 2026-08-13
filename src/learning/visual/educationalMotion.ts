import type { EducationalSceneGraph, EducationalVisualEntity, Vec3 } from './model'

export type EducationalMotionKind =
  | 'none'
  | 'continuous-rotation'
  | 'stepped-rotation'
  | 'oscillation'
  | 'pallet'
  | 'automatic-rotor'
  | 'pulse'

export interface EducationalMotionProfile {
  kind: EducationalMotionKind
  axis: Vec3
  speed: number
  amplitude: number
  phase: number
  scalePulse: number
}

function stableNumber(value: string): number {
  let output = 0
  for (let index = 0; index < value.length; index += 1) {
    output = (output * 31 + value.charCodeAt(index)) >>> 0
  }
  return output
}

export function educationalMotionProfile(entity: EducationalVisualEntity): EducationalMotionProfile {
  const text = [
    entity.instanceId,
    entity.definitionId,
    entity.name,
    entity.category,
    entity.role,
    entity.subsystem,
  ].filter(Boolean).join(' ').toLowerCase()
  const seed = stableNumber(entity.id)
  const direction = seed % 2 === 0 ? 1 : -1
  const ratio = 0.65 + (seed % 5) * 0.22
  const base = {
    axis: [0, 1, 0] as Vec3,
    phase: (seed % 12) * Math.PI / 6,
    scalePulse: 0,
  }

  if (/hairspring|espiral|balance|volante|oscillat/.test(text)) {
    return { ...base, kind: 'oscillation', speed: 4, amplitude: Math.PI * 0.72, scalePulse: /hairspring|espiral/.test(text) ? 0.025 : 0 }
  }
  if (/pallet|fork|anchor|áncora|escape lever/.test(text)) {
    return { ...base, kind: 'pallet', speed: 4, amplitude: Math.PI / 18 }
  }
  if (/automatic.*rotor|rotor.*automatic|oscillating weight|masa oscilante/.test(text)) {
    return { ...base, kind: 'automatic-rotor', speed: 0.7, amplitude: Math.PI * 0.85 }
  }
  if (/stepper|paso a paso/.test(text)) {
    return { ...base, kind: 'stepped-rotation', speed: direction * 2.4, amplitude: Math.PI / 3 }
  }
  if (/escape.?wheel|rueda de escape/.test(text)) {
    return { ...base, kind: 'stepped-rotation', speed: direction * 4, amplitude: Math.PI / 15 }
  }
  if (/wheel|gear|train|rueda|engran|barrel|barrilete|rotor|hand|aguja|motion.?works|minuter[ií]a/.test(text)) {
    return { ...base, kind: 'continuous-rotation', speed: direction * ratio, amplitude: 0 }
  }
  if (/coil|bobina|quartz|cuarzo|circuit|control|mainspring|muelle real/.test(text)) {
    return { ...base, kind: 'pulse', speed: 2.2, amplitude: 0, scalePulse: 0.045 }
  }
  return { ...base, kind: 'none', speed: 0, amplitude: 0 }
}

export function educationalMotionTransform(
  profile: EducationalMotionProfile,
  elapsedSeconds: number,
  playbackSpeed: number,
): { rotation: Vec3; scale: number } {
  const time = elapsedSeconds * Math.max(0.05, playbackSpeed)
  let angle = 0
  if (profile.kind === 'continuous-rotation') angle = (time * profile.speed) % (Math.PI * 2)
  if (profile.kind === 'stepped-rotation') {
    const steps = Math.floor(time * Math.abs(profile.speed))
    angle = (steps * profile.amplitude * Math.sign(profile.speed)) % (Math.PI * 2)
  }
  if (profile.kind === 'oscillation' || profile.kind === 'pallet' || profile.kind === 'automatic-rotor') {
    angle = Math.sin(time * profile.speed * Math.PI * 2 + profile.phase) * profile.amplitude
  }
  const pulse = profile.scalePulse
    ? 1 + Math.sin(time * profile.speed * Math.PI * 2 + profile.phase) * profile.scalePulse
    : 1
  return {
    rotation: [
      profile.axis[0] * angle,
      profile.axis[1] * angle,
      profile.axis[2] * angle,
    ],
    scale: pulse,
  }
}

export function hasEducationalMotion(entities: EducationalVisualEntity[]): boolean {
  return entities.some((entity) => educationalMotionProfile(entity).kind !== 'none')
}

export function isEducationalMotionCover(
  entity: EducationalVisualEntity,
  graph: EducationalSceneGraph,
): boolean {
  if (!entity.bounds || !graph.bounds || entity.bounds.radius < graph.bounds.radius * 0.32) return false
  const identity = [
    entity.instanceId,
    entity.definitionId,
    entity.name,
    entity.category,
    entity.role,
  ].filter(Boolean).join(' ').toLowerCase()
  return /(^|[\s._-])(case|caja|dial|esfera|movement-envelope|official-envelope)([\s._-]|$)/.test(identity)
}
