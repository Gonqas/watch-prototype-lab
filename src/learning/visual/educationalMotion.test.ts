import { describe, expect, it } from 'vitest'
import type { EducationalVisualEntity } from './model'
import {
  educationalMotionProfile,
  educationalMotionTransform,
  hasEducationalMotion,
  isEducationalMotionCover,
} from './educationalMotion'
import { CONCEPTUAL_MECHANICAL_FIXTURE } from '../technical/fixtures'
import { IDENTITY_VISUAL_TRANSFORM } from './model'
import { buildEducationalSceneGraph } from './sceneGraph'

function entity(name: string, role: string, subsystem = 'train'): EducationalVisualEntity {
  return {
    id: `visual:test::fixture.test::${role}` as EducationalVisualEntity['id'],
    objectKey: role,
    mountId: 'test',
    fixtureId: 'fixture.test',
    fixtureVersion: '1',
    instanceId: role,
    definitionId: role,
    name,
    category: 'part',
    role,
    subsystem,
    instanceState: 'active',
    renderable: true,
    placeholder: false,
    primitives: [],
    sourceIds: [],
    provenanceClass: 'conceptual',
    limitations: [],
  }
}

describe('educational kinematics', () => {
  it('assigns stable motion by semantic role across fixtures', () => {
    expect(educationalMotionProfile(entity('Rueda de escape', 'escape-wheel')).kind).toBe('stepped-rotation')
    expect(educationalMotionProfile(entity('Volante', 'balance', 'oscillator')).kind).toBe('oscillation')
    expect(educationalMotionProfile(entity('Bobina', 'coil', 'electronic-control')).kind).toBe('pulse')
  })

  it('produces visible motion while keeping reduced-motion controllable by the caller', () => {
    const profile = educationalMotionProfile(entity('Tren', 'train'))
    const start = educationalMotionTransform(profile, 0, 1)
    const later = educationalMotionTransform(profile, 1, 1)
    expect(later.rotation).not.toEqual(start.rotation)
  })

  it('reports whether a composition has an animatable semantic part', () => {
    expect(hasEducationalMotion([entity('Tren', 'train')])).toBe(true)
    expect(hasEducationalMotion([entity('Platina', 'plate', 'structure')])).toBe(false)
  })

  it('does not infer part motion from a mount or fixture token embedded in the visual id', () => {
    const staticCover = {
      ...entity('Caja conceptual', 'case', 'structure'),
      id: 'visual:mount.going-train::fixture.mechanical-chain::case' as EducationalVisualEntity['id'],
    }
    expect(educationalMotionProfile(staticCover).kind).toBe('none')
  })

  it('keeps the conceptual case and dial static and identifies them as removable viewing covers', () => {
    const fixture = CONCEPTUAL_MECHANICAL_FIXTURE
    const graph = buildEducationalSceneGraph('motion-test', {
      id: 'mount.going-train',
      fixtureId: fixture.id,
      fixtureVersion: fixture.version,
      transform: structuredClone(IDENTITY_VISUAL_TRANSFORM),
      enabled: true,
      label: 'Movimiento conceptual',
    }, fixture)
    const conceptualCase = graph.entities.find(({ name }) => name === 'Caja conceptual')
    const dial = graph.entities.find(({ name }) => name === 'Esfera conceptual')
    expect(conceptualCase).toBeDefined()
    expect(dial).toBeDefined()
    expect(educationalMotionProfile(conceptualCase!).kind).toBe('none')
    expect(educationalMotionProfile(dial!).kind).toBe('none')
    expect(isEducationalMotionCover(conceptualCase!, graph)).toBe(true)
    expect(isEducationalMotionCover(dial!, graph)).toBe(true)
  })
})
