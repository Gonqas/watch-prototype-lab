import { describe, expect, it } from 'vitest'
import type {
  MechanismMotionGraph,
  MechanismMotionNode,
  MechanismMotionRelation,
} from './mechanismMotionGraph'
import {
  mechanismMotionTransform,
  restoreMechanismMotionGraph,
  serializeMechanismMotionGraph,
  serializeMechanismMotionSolution,
  solveMechanismMotionGraph,
  validateMechanismMotionGraph,
} from './mechanismMotionGraph'

const conceptual = (value: number) => ({
  value,
  dataClass: 'conceptual' as const,
  sourceIds: ['source.educational.conceptual'],
  limitation: 'Valor exclusivo del modelo educativo; no corresponde a MIYOTA 8215.',
})

const node = (
  id: string,
  motion: MechanismMotionNode['motion'] = 'rotation',
  teeth?: number,
): MechanismMotionNode => ({
  id,
  motion,
  axis: [0, 1, 0],
  ...(teeth ? { teeth: conceptual(teeth) } : {}),
  ...(motion === 'oscillation' ? {
    amplitudeRadians: conceptual(Math.PI / 3),
    frequencyHz: conceptual(2),
  } : {}),
  limitations: ['Nodo del demostrador conceptual; no representa un calibre real.'],
})

const relation = (
  id: string,
  type: MechanismMotionRelation['type'],
  fromId: string,
  toId: string,
  extras: Partial<MechanismMotionRelation> = {},
): MechanismMotionRelation => ({
  id,
  type,
  fromId,
  toId,
  dataClass: 'conceptual',
  state: 'engaged',
  contact: type === 'same-arbor' ? 'not-applicable' : 'confirmed',
  sourceIds: ['source.educational.conceptual'],
  limitations: ['Relación del demostrador conceptual.'],
  ...extras,
})

function conceptualTrain(): MechanismMotionGraph {
  return {
    schemaVersion: 1,
    id: 'graph.test.conceptual-train',
    version: '1.0.0',
    dataClass: 'conceptual',
    fidelity: {
      geometry: 'G1',
      kinematics: 'K2',
      physics: 'P0',
      limitations: ['Geometría simbólica.', 'Cinemática educativa.', 'Sin física validada.'],
    },
    nodes: [
      node('barrel', 'rotation', 80),
      node('center-pinion', 'rotation', 10),
      node('center-wheel', 'rotation', 64),
      node('third-pinion', 'rotation', 8),
      node('third-wheel', 'rotation', 60),
      node('escape-pinion', 'rotation', 10),
      node('escape-wheel', 'rotation', 15),
      node('pallet', 'pallet'),
      node('balance', 'oscillation'),
      node('hairspring', 'oscillation'),
      node('crown', 'rotation'),
      node('arbor', 'rotation'),
    ],
    relations: [
      relation('r1', 'meshes-with', 'barrel', 'center-pinion', {
        mesh: 'external',
        ratio: conceptual(999),
      }),
      relation('r2', 'same-arbor', 'center-pinion', 'center-wheel'),
      relation('r3', 'meshes-with', 'center-wheel', 'third-pinion', { mesh: 'external' }),
      relation('r4', 'same-arbor', 'third-pinion', 'third-wheel'),
      relation('r5', 'meshes-with', 'third-wheel', 'escape-pinion', { mesh: 'external' }),
      relation('r6', 'same-arbor', 'escape-pinion', 'escape-wheel'),
      relation('r7-lock', 'locks', 'pallet', 'escape-wheel'),
      relation('r8-release', 'releases', 'pallet', 'escape-wheel'),
      relation('r9-impulse', 'impulses', 'escape-wheel', 'pallet', { ratio: conceptual(1) }),
      relation('r10-impulse', 'impulses', 'pallet', 'balance', { ratio: conceptual(1) }),
      relation('r11-drive', 'drives', 'balance', 'hairspring', { ratio: conceptual(1) }),
      relation('r12-wind', 'winds', 'crown', 'arbor', { ratio: conceptual(1) }),
    ],
    escapement: {
      escapeWheelId: 'escape-wheel',
      palletForkId: 'pallet',
      oscillatorId: 'balance',
      hairspringId: 'hairspring',
      escapeStepRadians: conceptual(Math.PI / 15),
      frequencyHz: conceptual(2),
      oscillatorAmplitudeRadians: conceptual(Math.PI / 3),
      palletAmplitudeRadians: conceptual(Math.PI / 18),
      sourceIds: ['source.educational.conceptual'],
      limitations: ['Secuencia discreta educativa; no simula contacto, impulso ni pérdidas físicas.'],
    },
    sourceIds: ['source.educational.conceptual'],
    limitations: [
      'Conteos y parámetros exclusivos del modelo conceptual.',
      'No atribuye geometría, dientes ni cinemática a MIYOTA 8215.',
    ],
  }
}

function state(graph: ReturnType<typeof solveMechanismMotionGraph>, nodeId: string) {
  return graph.nodes.find((candidate) => candidate.nodeId === nodeId)!
}

describe('grafo mecánico relacional', () => {
  it('usa dientes, invierte el sentido en engranes externos y conserva velocidad en el mismo árbol', () => {
    const solution = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      escapementPhase: 'unlock-left',
    })

    expect(state(solution, 'center-pinion')).toMatchObject({
      direction: -1,
      angularVelocityRadiansPerSecond: -8,
      drivenByNodeId: 'barrel',
    })
    expect(state(solution, 'center-wheel')).toMatchObject({
      direction: -1,
      angularVelocityRadiansPerSecond: -8,
      drivenByNodeId: 'center-pinion',
    })
    expect(state(solution, 'third-pinion').angularVelocityRadiansPerSecond).toBe(64)
    expect(state(solution, 'third-wheel').angularVelocityRadiansPerSecond).toBe(64)
    expect(state(solution, 'escape-pinion').angularVelocityRadiansPerSecond).toBe(-384)
    expect(solution.relations.find(({ relationId }) => relationId === 'r1')).toMatchObject({
      ratio: 8,
      direction: -1,
      dataClass: 'conceptual',
      transmitting: true,
    })
    const escapeProfile = state(solution, 'escape-wheel').motion
    expect(mechanismMotionTransform(escapeProfile, 0.0001))
      .toEqual(mechanismMotionTransform(escapeProfile, 0.0002))
    expect(mechanismMotionTransform(escapeProfile, 0))
      .not.toEqual(mechanismMotionTransform(escapeProfile, 0.001))
  })

  it('respeta separación, desacople, bloqueo y corta toda la cadena aguas abajo', () => {
    const separated = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      relationOverrides: { r3: { contact: 'separated' } },
    })
    expect(state(separated, 'third-pinion').status).toBe('disengaged')
    expect(state(separated, 'escape-wheel').angularVelocityRadiansPerSecond).toBe(0)

    const blocked = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      blockedNodeIds: ['third-pinion'],
    })
    expect(state(blocked, 'third-pinion').status).toBe('blocked')
    expect(state(blocked, 'third-wheel').status).toBe('stopped')
    expect(state(blocked, 'escape-wheel').status).toBe('stopped')
  })

  it('no inventa movimiento cuando faltan contacto o relación y emite diagnóstico explícito', () => {
    const graph = conceptualTrain()
    graph.relations = [
      relation('unknown-drive', 'drives', 'barrel', 'center-pinion', {
        contact: 'unknown',
        ratio: undefined,
      }),
    ]
    const solution = solveMechanismMotionGraph(graph, {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
    })
    expect(state(solution, 'center-pinion')).toMatchObject({
      status: 'unknown',
      angularVelocityRadiansPerSecond: 0,
    })
    expect(solution.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MMG-RATIO-UNKNOWN' }),
    ]))
  })

  it('modela bloqueo, liberación e impulso del escape por fase', () => {
    const locked = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      escapementPhase: 'locked-left',
    })
    expect(state(locked, 'escape-wheel').status).toBe('locked')
    expect(locked.relations.find(({ relationId }) => relationId === 'r7-lock')?.transmitting).toBe(true)
    expect(locked.relations.find(({ relationId }) => relationId === 'r8-release')?.transmitting).toBe(false)

    const impulse = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      escapementPhase: 'impulse-left',
    })
    expect(state(impulse, 'escape-wheel').status).toBe('active')
    expect(state(impulse, 'pallet').motion.kind).toBe('pallet')
    expect(state(impulse, 'balance').motion.kind).toBe('oscillation')
    expect(impulse.relations.find(({ relationId }) => relationId === 'r9-impulse')?.transmitting).toBe(true)
    expect(impulse.relations.find(({ relationId }) => relationId === 'r8-release')?.transmitting).toBe(true)
  })

  it('propaga drives y winds únicamente con una relación cuantificada', () => {
    const graph = conceptualTrain()
    const winding = solveMechanismMotionGraph(graph, {
      sources: [{ nodeId: 'crown', angularVelocityRadiansPerSecond: 2 }],
    })
    expect(state(winding, 'arbor')).toMatchObject({
      status: 'active',
      angularVelocityRadiansPerSecond: 2,
      drivenByNodeId: 'crown',
    })
  })

  it('es determinista aunque cambie el orden de nodos, relaciones y fuentes', () => {
    const graph = conceptualTrain()
    const request = {
      sources: [
        { nodeId: 'crown', angularVelocityRadiansPerSecond: 2 },
        { nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 },
      ],
      escapementPhase: 'unlock-right' as const,
    }
    const first = solveMechanismMotionGraph(graph, request)
    const reordered = {
      ...graph,
      nodes: [...graph.nodes].reverse(),
      relations: [...graph.relations].reverse(),
    }
    const second = solveMechanismMotionGraph(reordered, {
      ...request,
      sources: [...request.sources].reverse(),
    })
    expect(serializeMechanismMotionSolution(second)).toBe(serializeMechanismMotionSolution(first))
  })

  it('serializa, restaura y normaliza el grafo sin perder procedencia ni limitaciones', () => {
    const original = conceptualTrain()
    const serialized = serializeMechanismMotionGraph({
      ...original,
      nodes: [...original.nodes].reverse(),
      relations: [...original.relations].reverse(),
    })
    const restored = restoreMechanismMotionGraph(serialized)
    expect(restored).toEqual(restoreMechanismMotionGraph(serializeMechanismMotionGraph(original)))
    expect(restored.dataClass).toBe('conceptual')
    expect(restored.limitations).toContain('No atribuye geometría, dientes ni cinemática a MIYOTA 8215.')
    expect(validateMechanismMotionGraph(restored)).toEqual([])
  })

  it('conserva resultados cinemáticos en reduced motion y entrega transformaciones discretas estáticas', () => {
    const continuous = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      escapementPhase: 'impulse-right',
    })
    const reduced = solveMechanismMotionGraph(conceptualTrain(), {
      sources: [{ nodeId: 'barrel', angularVelocityRadiansPerSecond: 1 }],
      escapementPhase: 'impulse-right',
      reducedMotion: true,
      discreteStep: 3,
    })
    expect(state(reduced, 'third-wheel').angularVelocityRadiansPerSecond)
      .toBe(state(continuous, 'third-wheel').angularVelocityRadiansPerSecond)
    expect(state(reduced, 'third-wheel').motion.animation).toBe('discrete')
    expect(
      mechanismMotionTransform(state(reduced, 'third-wheel').motion, 0),
    ).toEqual(
      mechanismMotionTransform(state(reduced, 'third-wheel').motion, 10),
    )
    expect(
      mechanismMotionTransform(state(continuous, 'third-wheel').motion, 0),
    ).not.toEqual(
      mechanismMotionTransform(state(continuous, 'third-wheel').motion, 1),
    )
  })
})
