import { describe, expect, it } from 'vitest'
import {
  CONCEPTUAL_MECHANICAL_FIXTURE,
  MIYOTA_2035_TECHNICAL_FIXTURE,
  MIYOTA_8215_TECHNICAL_FIXTURE,
} from '../technical/fixtures'
import { solveMechanismMotionGraph } from './mechanismMotionGraph'
import { buildEducationalSceneGraph } from './sceneGraph'

function conceptualGraph() {
  return buildEducationalSceneGraph(
    'composition.test.mechanism',
    {
      id: 'mount.test.mechanism',
      fixtureId: CONCEPTUAL_MECHANICAL_FIXTURE.id,
      fixtureVersion: CONCEPTUAL_MECHANICAL_FIXTURE.version,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
      enabled: true,
      label: 'Mecánico conceptual',
    },
    CONCEPTUAL_MECHANICAL_FIXTURE,
  )
}

describe('adaptación del fixture al grafo mecánico visual', () => {
  it('conserva dientes conceptuales, contactos y cadena completa sin diagnósticos', () => {
    const graph = conceptualGraph()
    const binding = graph.mechanism
    expect(binding?.defaultSource).toBeDefined()
    expect(binding?.graph.fidelity).toMatchObject({ geometry: 'G1', kinematics: 'K2', physics: 'P0' })
    const meshes = binding?.graph.relations.filter(({ type }) => type === 'meshes-with') ?? []
    expect(meshes).toHaveLength(4)
    expect(meshes.every(({ contact }) => contact === 'confirmed')).toBe(true)
    expect(binding?.graph.nodes.filter(({ teeth }) => teeth).map(({ teeth }) => teeth?.dataClass))
      .toEqual(expect.arrayContaining(['conceptual']))

    const solution = solveMechanismMotionGraph(binding!.graph, {
      sources: [binding!.defaultSource!],
      escapementPhase: 'impulse-left',
    })
    expect(solution.diagnostics).toEqual([])
    const activeRotations = solution.nodes.filter(({ status, motion }) =>
      status === 'active' && (
        motion.kind === 'continuous-rotation'
        || motion.kind === 'stepped-rotation'
      ))
    expect(activeRotations.length).toBeGreaterThanOrEqual(10)
    expect(solution.nodes.some(({ motion }) => motion.kind === 'pallet')).toBe(true)
    expect(solution.nodes.filter(({ motion }) => motion.kind === 'oscillation')).toHaveLength(2)
  })

  it('sitúa el muelle dentro del barrilete y mantiene tapa y tambor como entidades distintas', () => {
    const graph = conceptualGraph()
    const byRole = new Map(graph.entities.map((entity) => [entity.role, entity]))
    const mainspring = byRole.get('mainspring')!
    const barrel = byRole.get('barrel')!
    const cover = byRole.get('barrel-cover')!
    expect(mainspring.bounds?.center[0]).toBe(barrel.bounds?.center[0])
    expect(mainspring.bounds?.center[2]).toBe(barrel.bounds?.center[2])
    expect(mainspring.bounds!.radius).toBeLessThan(barrel.bounds!.radius)
    expect(cover.primitives[0]).toMatchObject({
      visualProfile: 'barrel-cover',
      cutaway: true,
    })
    expect(barrel.primitives[0]).toMatchObject({
      visualProfile: 'barrel-drum',
      toothCount: 80,
    })
  })

  it.each([MIYOTA_2035_TECHNICAL_FIXTURE, MIYOTA_8215_TECHNICAL_FIXTURE])(
    'mantiene el movimiento estructural %s coordinado sin convertir estimaciones en datos oficiales',
    (fixture) => {
      const graph = buildEducationalSceneGraph(
        `composition.test.${fixture.calibre}`,
        {
          id: `mount.test.${fixture.calibre}`,
          fixtureId: fixture.id,
          fixtureVersion: fixture.version,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
          enabled: true,
          label: fixture.calibre ?? fixture.id,
        },
        fixture,
      )
      const binding = graph.mechanism!
      const solution = solveMechanismMotionGraph(binding.graph, {
        sources: binding.defaultSource ? [binding.defaultSource] : [],
        escapementPhase: 'impulse-left',
      })
      expect(solution.diagnostics).toEqual([])
      expect(solution.nodes.filter(({ status }) => status === 'active').length).toBeGreaterThan(1)
      expect(solution.relations.filter(({ contact }) => contact === 'separated')).toEqual([])
      expect(binding.graph.relations.some(({ ratio }) => ratio?.dataClass === 'estimated')).toBe(true)
      expect(binding.graph.dataClass).toBe('estimated')
      expect(graph.diagnostics.filter(({ code }) => code === 'EV-GEAR-CONTACT-ALIGNED').length)
        .toBeGreaterThan(0)
    },
  )
})
