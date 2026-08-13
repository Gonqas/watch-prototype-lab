import { describe, expect, it } from 'vitest'
import { stableFingerprint } from '../identity'
import { EMPTY_LEARNING_OVERLAY } from '../runtime/overlay'
import {
  CONCEPTUAL_MECHANICAL_FIXTURE,
  CONCEPTUAL_QUARTZ_FIXTURE,
  MIYOTA_2035_TECHNICAL_FIXTURE,
  MIYOTA_8215_TECHNICAL_FIXTURE,
  TECHNICAL_MOVEMENT_FIXTURES,
} from '../technical/fixtures'
import type { TechnicalMovementFixture } from '../technical/reconstruction'
import { EducationalCompositionBridge } from './bridge'
import {
  EducationalCameraController,
  resolveEducationalCameraIntent,
} from './cameras'
import {
  EducationalViewportComposition,
  validateEducationalComposition,
} from './composition'
import {
  IDENTITY_VISUAL_TRANSFORM,
  type EducationalFixtureMountSpec,
  type EducationalViewportCompositionSpec,
  type EnergyPathNode,
  visualEntityId,
} from './model'
import {
  applyReducedMotionToOverlay,
  createEnergyPath,
  createRotationArc,
  createSpatialArrow,
  createSpatialLabel,
} from './overlays'
import { DEFAULT_VISUAL_PERFORMANCE_BUDGET } from './performance'
import {
  EducationalFixtureRegistry,
  inMemoryFixtureLoader,
} from './registry'
import {
  buildEducationalSceneGraph,
  LogicalVisualObjectRegistry,
} from './sceneGraph'
import { educationalVisualCapabilities } from './state'
import {
  materialDistinguishesWithoutColor,
  visualMaterialFor,
} from './visualLanguage'

const FIXED_TIME = '2026-07-23T10:00:00.000Z'

function mount(
  id: string,
  fixture: TechnicalMovementFixture,
  position: [number, number, number] = [0, 0, 0],
): EducationalFixtureMountSpec {
  return {
    id,
    fixtureId: fixture.id,
    fixtureVersion: fixture.version,
    transform: {
      ...structuredClone(IDENTITY_VISUAL_TRANSFORM),
      position,
    },
    enabled: true,
    label: `${id}: ${fixture.id}`,
  }
}

function spec(
  id: string,
  layout: EducationalViewportCompositionSpec['layout'],
  mounts: EducationalFixtureMountSpec[],
): EducationalViewportCompositionSpec {
  return { id, version: '1.0.0', layout, mounts }
}

function registryFor(
  fixtures: readonly TechnicalMovementFixture[],
  onLoad: (fixtureId: string) => void = () => undefined,
): EducationalFixtureRegistry {
  return new EducationalFixtureRegistry(
    fixtures.map((fixture) => inMemoryFixtureLoader(fixture, () => onLoad(fixture.id))),
    () => 10,
    () => FIXED_TIME,
  )
}

function graphFor(
  fixture: TechnicalMovementFixture,
  mountId = 'primary',
) {
  return buildEducationalSceneGraph('composition.test', mount(mountId, fixture), fixture)
}

describe('Sistema 4C · núcleo visual educativo', () => {
  it('valida composiciones declarativas de una, dos y cuatro monturas', () => {
    const one = spec('one', 'single', [
      mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE),
    ])
    const two = spec('two', 'split-horizontal', [
      mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE, [-5, 0, 0]),
      mount('mechanical', CONCEPTUAL_MECHANICAL_FIXTURE, [5, 0, 0]),
    ])
    const four = spec('four', 'quad', [
      mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE, [-5, 0, -5]),
      mount('miyota-2035', MIYOTA_2035_TECHNICAL_FIXTURE, [5, 0, -5]),
      mount('mechanical', CONCEPTUAL_MECHANICAL_FIXTURE, [-5, 0, 5]),
      mount('miyota-8215', MIYOTA_8215_TECHNICAL_FIXTURE, [5, 0, 5]),
    ])

    expect(validateEducationalComposition(one)).toEqual([])
    expect(validateEducationalComposition(two)).toEqual([])
    expect(validateEducationalComposition(four)).toEqual([])
    expect(validateEducationalComposition({
      ...two,
      layout: 'single',
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EV-COMPOSITION-LAYOUT' }),
    ]))
    expect(validateEducationalComposition({
      ...two,
      mounts: [...two.mounts, mount('third', MIYOTA_2035_TECHNICAL_FIXTURE)],
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EV-COMPOSITION-MOUNT-COUNT' }),
    ]))
    expect(validateEducationalComposition({
      ...two,
      mounts: [two.mounts[0], { ...two.mounts[1], id: two.mounts[0].id }],
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EV-COMPOSITION-DUPLICATE-MOUNT' }),
    ]))
  })

  it('carga fixtures bajo demanda, deduplica cargas concurrentes y libera los objetos al desmontar', async () => {
    const loads = new Map<string, number>()
    const registry = registryFor(TECHNICAL_MOVEMENT_FIXTURES, (fixtureId) => {
      loads.set(fixtureId, (loads.get(fixtureId) ?? 0) + 1)
    })
    const fixturePair = await Promise.all([
      registry.acquire(CONCEPTUAL_QUARTZ_FIXTURE.id, CONCEPTUAL_QUARTZ_FIXTURE.version),
      registry.acquire(CONCEPTUAL_QUARTZ_FIXTURE.id, CONCEPTUAL_QUARTZ_FIXTURE.version),
    ])
    expect(fixturePair).toEqual([
      CONCEPTUAL_QUARTZ_FIXTURE,
      CONCEPTUAL_QUARTZ_FIXTURE,
    ])
    expect(loads.get(CONCEPTUAL_QUARTZ_FIXTURE.id)).toBe(1)
    expect(registry.records().map(({ fromCache }) => fromCache).sort()).toEqual([false, true])
    registry.release(CONCEPTUAL_QUARTZ_FIXTURE.id, CONCEPTUAL_QUARTZ_FIXTURE.version)
    registry.release(CONCEPTUAL_QUARTZ_FIXTURE.id, CONCEPTUAL_QUARTZ_FIXTURE.version)

    const composition = new EducationalViewportComposition(
      spec('lazy-four', 'quad', [
        mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE),
        mount('miyota-2035', MIYOTA_2035_TECHNICAL_FIXTURE),
        mount('mechanical', CONCEPTUAL_MECHANICAL_FIXTURE),
        mount('miyota-8215', MIYOTA_8215_TECHNICAL_FIXTURE),
      ]),
      registry,
      { wallClock: () => FIXED_TIME },
    )
    expect(composition.mounted()).toEqual([])
    expect(composition.objects.size()).toBe(0)

    await composition.loadMount('miyota-8215')
    expect(composition.objects.size()).toBe(MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.length)
    expect(loads.has(MIYOTA_2035_TECHNICAL_FIXTURE.id)).toBe(false)
    expect(loads.has(CONCEPTUAL_MECHANICAL_FIXTURE.id)).toBe(false)
    expect(composition.unloadMount('miyota-8215')).toBe(true)
    expect(composition.objects.size()).toBe(0)
    expect(composition.stateStore.loadedEntityIds()).toEqual([])

    await composition.loadEnabledMounts()
    const expectedEntities = TECHNICAL_MOVEMENT_FIXTURES
      .reduce((total, fixture) => total + fixture.assembly.instances.length, 0)
    expect(composition.objects.size()).toBe(expectedEntities)
    expect([...loads.values()].every((count) => count === 1)).toBe(true)
    await composition.dispose()
  })

  it('crea una identidad y un objeto lógico por cada PartInstance, incluso piezas repetidas', () => {
    const graph = graphFor(MIYOTA_8215_TECHNICAL_FIXTURE)
    const objects = new LogicalVisualObjectRegistry()
    objects.registerGraph(graph)

    expect(graph.entities).toHaveLength(MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.length)
    expect(objects.size()).toBe(MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.length)
    expect(new Set(graph.entityIds).size).toBe(graph.entityIds.length)

    const definitions = new Map<string, string[]>()
    MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.forEach((instance) => {
      definitions.set(instance.definitionId, [
        ...(definitions.get(instance.definitionId) ?? []),
        instance.id,
      ])
    })
    const repeated = [...definitions.entries()].find(([, instanceIds]) => instanceIds.length === 4)
    expect(repeated).toBeDefined()
    const repeatedVisualIds = repeated![1].map((instanceId) =>
      visualEntityId('primary', MIYOTA_8215_TECHNICAL_FIXTURE.id, instanceId))
    expect(new Set(repeatedVisualIds).size).toBe(4)
    repeatedVisualIds.forEach((entityId) => {
      const objectKey = objects.objectKey(entityId)
      expect(objectKey).toBe(entityId)
      expect(objects.entityForObjectKey(objectKey!)).toMatchObject({
        id: entityId,
        definitionId: repeated![0],
      })
    })
  })

  it('conserva piezas borradas o sin geometría como entidades explícitas sin inventar forma', () => {
    const deletedFixture = structuredClone(CONCEPTUAL_QUARTZ_FIXTURE)
    deletedFixture.assembly.instances[0].state = 'deleted'
    const deletedGraph = graphFor(deletedFixture)
    expect(deletedGraph.entities[0]).toMatchObject({
      instanceState: 'deleted',
      renderable: false,
    })

    const missingFixture = structuredClone(CONCEPTUAL_QUARTZ_FIXTURE)
    const missingInstanceId = missingFixture.assembly.instances[1].id
    missingFixture.geometry = missingFixture.geometry
      .filter(({ entityId }) => entityId !== missingInstanceId)
    const missingGraph = graphFor(missingFixture)
    const missingEntity = missingGraph.entities
      .find(({ instanceId }) => instanceId === missingInstanceId)
    expect(missingEntity).toMatchObject({
      primitives: [],
      placeholder: true,
      renderable: false,
      provenanceClass: 'unknown',
    })
    expect(missingGraph.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'EV-GEOMETRY-MISSING',
        entityIds: [missingEntity!.id],
      }),
    ]))
  })

  it('proyecta selectores canónicos con namespace por montura y cardinalidad semántica', async () => {
    const composition = new EducationalViewportComposition(
      spec('projection', 'split-vertical', [
        mount('left', MIYOTA_8215_TECHNICAL_FIXTURE, [-4, 0, 0]),
        mount('right', MIYOTA_8215_TECHNICAL_FIXTURE, [4, 0, 0]),
      ]),
      registryFor([MIYOTA_8215_TECHNICAL_FIXTURE]),
      { wallClock: () => FIXED_TIME },
    )
    await composition.loadEnabledMounts()

    const repeatedDefinition = MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances
      .map(({ definitionId }) => definitionId)
      .find((definitionId, index, values) =>
        values.filter((value) => value === definitionId).length === 3
        && values.indexOf(definitionId) === index)!
    const leftDefinition = composition.resolve({
      mountId: 'left',
      selector: { by: 'definition', id: repeatedDefinition },
      cardinality: 'exactly-one',
    })
    expect(leftDefinition).toMatchObject({
      semanticEntityCount: 1,
      cardinalitySatisfied: true,
    })
    expect(leftDefinition.entityIds).toHaveLength(3)
    expect(leftDefinition.entityIds.every((id) => id.startsWith('visual:left::'))).toBe(true)

    const bothCalibres = composition.resolve({
      fixtureId: MIYOTA_8215_TECHNICAL_FIXTURE.id,
      selector: { by: 'calibre', value: '8215' },
      cardinality: { exact: 2 },
    })
    expect(bothCalibres.semanticEntityCount).toBe(2)
    expect(bothCalibres.cardinalitySatisfied).toBe(true)
    expect(bothCalibres.entityIds).toHaveLength(
      MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.length * 2,
    )
    expect(new Set(bothCalibres.entityIds).size).toBe(bothCalibres.entityIds.length)

    const wrongCardinality = composition.resolve({
      selector: { by: 'calibre', value: '8215' },
      cardinality: 'exactly-one',
    })
    expect(wrongCardinality.cardinalitySatisfied).toBe(false)
    expect(wrongCardinality.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EV-SELECTOR-CARDINALITY' }),
    ]))
    await composition.dispose()
  })

  it('aplica selección, visibilidad, aislamiento y apariencia por instancia de forma reversible', async () => {
    const composition = new EducationalViewportComposition(
      spec('operations', 'single', [mount('movement', MIYOTA_8215_TECHNICAL_FIXTURE)]),
      registryFor([MIYOTA_8215_TECHNICAL_FIXTURE]),
      { wallClock: () => FIXED_TIME },
    )
    const [{ sceneGraph }] = await composition.loadEnabledMounts()
    const repeated = sceneGraph.entities.filter(({ definitionId }, _, values) =>
      values.filter((candidate) => candidate.definitionId === definitionId).length > 1)
    const [first, second] = repeated
    expect(first.definitionId).toBe(second.definitionId)
    expect(first.id).not.toBe(second.id)

    expect(composition.execute({
      type: 'select',
      entityIds: [first.id, second.id],
    }).accepted).toBe(true)
    expect(composition.execute({ type: 'hide', entityIds: [first.id] }).accepted).toBe(true)
    expect(composition.stateStore.effectiveVisibility(first.id)).toBe(false)
    expect(composition.stateStore.effectiveVisibility(second.id)).toBe(true)
    expect(composition.execute({
      type: 'isolate',
      mountId: 'movement',
      entityIds: [second.id],
    }).accepted).toBe(true)
    expect(composition.execute({
      type: 'transparency',
      entityIds: [second.id],
      opacity: 0.35,
    }).accepted).toBe(true)
    expect(composition.execute({
      type: 'highlight',
      entityIds: [second.id],
      active: true,
    }).accepted).toBe(true)
    const beforeExplode = composition.stateStore.state()
    expect(composition.execute({
      type: 'explode',
      entityIds: [second.id],
      amount: 0.6,
    }).accepted).toBe(true)
    expect(composition.operations.undo()).toMatchObject({ accepted: true })
    expect(composition.stateStore.state()).toEqual(beforeExplode)
    await composition.dispose()
  })

  it('rechaza operaciones sin capacidad o con referencias inválidas antes de mutar estado', async () => {
    const capabilities = educationalVisualCapabilities().map((capability) =>
      capability.id === 'viewport.explode'
        ? { ...capability, status: 'unavailable' as const }
        : capability)
    const composition = new EducationalViewportComposition(
      spec('preflight', 'single', [mount('movement', CONCEPTUAL_MECHANICAL_FIXTURE)]),
      registryFor([CONCEPTUAL_MECHANICAL_FIXTURE]),
      { capabilities, wallClock: () => FIXED_TIME },
    )
    const [{ sceneGraph }] = await composition.loadEnabledMounts()
    const entityId = sceneGraph.entityIds[0]
    const before = composition.stateStore.state()

    expect(composition.execute({
      type: 'explode',
      entityIds: [entityId],
      amount: 0.5,
    })).toMatchObject({
      accepted: false,
      diagnostics: [expect.objectContaining({
        code: 'EV-CAPABILITY-UNAVAILABLE',
        capabilityId: 'viewport.explode',
      })],
    })
    const unknown = visualEntityId(
      'movement',
      CONCEPTUAL_MECHANICAL_FIXTURE.id,
      'pi_missing_123456',
    )
    expect(composition.execute({
      type: 'transparency',
      entityIds: [unknown],
      opacity: 2,
    })).toMatchObject({
      accepted: false,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: 'EV-ENTITY-NOT-MOUNTED' }),
        expect.objectContaining({ code: 'EV-OPACITY-INVALID' }),
      ]),
    })
    expect(composition.execute({
      type: 'clear-isolation',
      mountId: 'missing',
    })).toMatchObject({
      accepted: false,
      diagnostics: [expect.objectContaining({ code: 'EV-MOUNT-NOT-FOUND' })],
    })
    expect(composition.execute({
      type: 'layout',
      layout: 'quad',
    })).toMatchObject({
      accepted: false,
      diagnostics: [expect.objectContaining({ code: 'EV-LAYOUT-MOUNT-COUNT' })],
    })
    expect(composition.stateStore.state()).toEqual(before)
    await composition.dispose()
  })

  it('construye overlays espaciales explícitos con alternativas no animadas y diagnósticos visibles', () => {
    const graph = graphFor(CONCEPTUAL_MECHANICAL_FIXTURE)
    const [first, second] = graph.entities
    const arrow = createSpatialArrow({
      id: 'energy-arrow',
      start: first.bounds!.center,
      end: second.bounds!.center,
      entityIds: [first.id, second.id],
      state: 'active',
      accessibleAlternative: 'La energía pasa del muelle al barrilete.',
    })
    expect(arrow.diagnostics).toEqual([])
    expect(arrow.overlay).toMatchObject({
      kind: 'arrow',
      adaptiveScale: true,
      occlusion: 'fade-when-occluded',
      style: expect.objectContaining({
        pattern: 'solid',
        icon: 'play',
      }),
    })
    expect(arrow.overlay!.arrowHead).toHaveLength(3)

    const rotation = createRotationArc({
      id: 'barrel-turn',
      center: second.bounds!.center,
      axis: [0, 1, 0],
      radius: 0.8,
      direction: 'clockwise',
      conceptualSpeed: 'slow',
      entityIds: [second.id],
      accessibleAlternative: 'El barrilete gira en sentido horario conceptual.',
    })
    expect(rotation.overlay).toMatchObject({
      kind: 'rotation-arc',
      animated: true,
      direction: 'clockwise',
    })
    expect(rotation.overlay!.points).toHaveLength(33)
    expect(applyReducedMotionToOverlay(rotation.overlay!, true))
      .toMatchObject({ animated: false })

    const nodes: EnergyPathNode[] = [first, second, graph.entities[2]].map((entity, index) => ({
      id: `node-${index + 1}`,
      entityId: entity.id,
      label: entity.name,
      point: entity.bounds!.center,
      state: index === 1 ? 'blocked' : 'available',
    }))
    const path = createEnergyPath({
      id: 'mechanical-path',
      nodes,
      activeIndex: 2,
      reducedMotion: true,
    })
    expect(path.overlay).toMatchObject({
      kind: 'energy-path',
      animated: false,
      numbered: true,
    })
    expect(path.overlay!.segments).toEqual(expect.arrayContaining([
      expect.objectContaining({ state: 'blocked' }),
    ]))
    expect(path.overlay!.accessibleAlternative).toContain('1.')

    expect(createSpatialLabel({
      id: 'label',
      point: first.bounds!.center,
      text: first.name,
      namespaceLabel: 'Mecánico conceptual',
      entityId: first.id,
    })).toMatchObject({
      kind: 'label',
      entityId: first.id,
      accessibleAlternative: expect.stringContaining('Mecánico conceptual'),
    })
    expect(createSpatialArrow({
      id: 'invalid-arrow',
      start: [0, 0, 0],
      end: [0, 0, 0],
      accessibleAlternative: 'Flecha inválida.',
    })).toMatchObject({
      overlay: undefined,
      diagnostics: [expect.objectContaining({ code: 'EV-ARROW-ZERO-LENGTH' })],
    })
  })

  it('distingue subsistemas y procedencia sin depender únicamente del color', () => {
    const officialTrain = visualMaterialFor('train', 'official')
    const estimatedTrain = visualMaterialFor('train', 'estimated')
    const estimatedCalendar = visualMaterialFor('calendar', 'estimated')

    expect(officialTrain.color).toBe(estimatedTrain.color)
    expect(officialTrain.outline).not.toBe(estimatedTrain.outline)
    expect(materialDistinguishesWithoutColor(officialTrain, estimatedTrain)).toBe(true)
    expect(materialDistinguishesWithoutColor(estimatedTrain, estimatedCalendar)).toBe(true)
    expect(estimatedCalendar.accessibleLabel).toContain('geometría estimada')
  })

  it('resuelve cámaras por intención y permite pausa, salto, bookmark y reduced motion', () => {
    const graph = graphFor(MIYOTA_2035_TECHNICAL_FIXTURE)
    const intent = {
      kind: 'overview' as const,
      mountIds: ['primary'],
      padding: 1.2,
    }
    expect(resolveEducationalCameraIntent([graph], intent))
      .toEqual(resolveEducationalCameraIntent([graph], intent))

    const camera = new EducationalCameraController()
    const initialPose = camera.pose()
    camera.addBookmark('initial', 'Vista inicial', intent)
    expect(camera.applyIntent([graph], intent, {
      reducedMotion: false,
      transition: 'smooth',
      durationMs: 100,
    })).toEqual([])
    const midpoint = camera.evaluateTransition(50)
    expect(midpoint).not.toEqual(initialPose)
    camera.pause()
    expect(camera.evaluateTransition(75)).toEqual(midpoint)
    camera.resume()
    camera.evaluateTransition(100)
    expect(camera.snapshot().transition).toMatchObject({ state: 'completed' })

    camera.applyIntent([graph], { kind: 'close-up', entityIds: [graph.entityIds[0]] }, {
      reducedMotion: true,
      transition: 'smooth',
      durationMs: 1_000,
    })
    expect(camera.snapshot().transition).toMatchObject({
      kind: 'instant',
      durationMs: 0,
      state: 'completed',
    })
    expect(camera.restoreBookmark('initial')).toBe(true)
    expect(camera.pose()).toEqual(initialPose)
    expect(camera.restoreBookmark('missing')).toBe(false)
  })

  it('restaura de forma conjunta monturas lazy y presentación visual', async () => {
    const composition = new EducationalViewportComposition(
      spec('snapshot', 'split-horizontal', [
        mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE),
        mount('mechanical', CONCEPTUAL_MECHANICAL_FIXTURE),
      ]),
      registryFor([CONCEPTUAL_QUARTZ_FIXTURE, CONCEPTUAL_MECHANICAL_FIXTURE]),
      { wallClock: () => FIXED_TIME },
    )
    const mounted = await composition.loadEnabledMounts()
    const quartzId = mounted.find(({ spec: value }) => value.id === 'quartz')!.sceneGraph.entityIds[0]
    composition.execute({ type: 'select', entityIds: [quartzId] })
    composition.execute({ type: 'hide', entityIds: [quartzId] })
    const snapshot = composition.captureSnapshot()

    composition.unloadMount('quartz')
    expect(composition.mounted().map(({ spec: value }) => value.id)).toEqual(['mechanical'])
    expect(composition.stateStore.hasEntity(quartzId)).toBe(false)
    await composition.restoreSnapshot(snapshot)
    expect(composition.mounted().map(({ spec: value }) => value.id)).toEqual([
      'mechanical',
      'quartz',
    ])
    expect(composition.stateStore.state()).toEqual(snapshot.state)
    expect(composition.captureSnapshot().fixtureFingerprints)
      .toEqual(snapshot.fixtureFingerprints)
    await composition.dispose()
  })

  it('implementa ViewportLearningBridge sin perder el snapshot visual namespaced', async () => {
    const composition = new EducationalViewportComposition(
      spec('bridge', 'single', [mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE)]),
      registryFor([CONCEPTUAL_QUARTZ_FIXTURE]),
      { wallClock: () => FIXED_TIME },
    )
    const [{ sceneGraph }] = await composition.loadEnabledMounts()
    const [first, second] = sceneGraph.entityIds
    const bridge = new EducationalCompositionBridge(composition)
    const initial = await bridge.capturePresentation()

    await bridge.applyOverlay({
      ...structuredClone(EMPTY_LEARNING_OVERLAY),
      selectedEntityIds: [first],
      hiddenEntityIds: [second],
      isolatedEntityIds: [first],
      highlightedEntityIds: [first],
      transparency: { [first]: 0.4 },
      explode: 0.5,
    })
    expect(bridge.entitySupport([first, 'missing'])).toEqual({
      supportedEntityIds: [first],
      unsupportedEntityIds: ['missing'],
    })
    expect(composition.stateStore.state().mounts.quartz).toMatchObject({
      selectedEntityIds: [first],
      hiddenEntityIds: [second],
      isolatedEntityIds: [first],
      highlightedEntityIds: [first],
      transparency: { [first]: 0.4 },
    })
    const changed = await bridge.capturePresentation()
    await bridge.clearOverlay()
    expect(bridge.currentOverlay()).toEqual(EMPTY_LEARNING_OVERLAY)
    await bridge.restorePresentation(changed)
    expect(bridge.currentOverlay().selectedEntityIds).toEqual([first])
    expect(composition.stateStore.state()).toEqual(changed.visualSnapshot.state)
    await bridge.restorePresentation(initial)
    expect(composition.stateStore.state()).toEqual(initial.visualSnapshot.state)
    await expect(bridge.applyOverlay({
      ...structuredClone(EMPTY_LEARNING_OVERLAY),
      selectedEntityIds: ['missing'],
    })).rejects.toThrow(/no montadas/)
    await bridge.dispose()
    await expect(bridge.capturePresentation()).rejects.toThrow(/disposed/)
    await composition.dispose()
  })

  it('informa presupuestos lógicos, reutilización segura y carencias de rendimiento', async () => {
    const composition = new EducationalViewportComposition(
      spec('performance', 'quad', [
        mount('quartz', CONCEPTUAL_QUARTZ_FIXTURE),
        mount('miyota-2035', MIYOTA_2035_TECHNICAL_FIXTURE),
        mount('mechanical', CONCEPTUAL_MECHANICAL_FIXTURE),
        mount('miyota-8215', MIYOTA_8215_TECHNICAL_FIXTURE),
      ]),
      registryFor(TECHNICAL_MOVEMENT_FIXTURES),
      { wallClock: () => FIXED_TIME },
    )
    await composition.loadEnabledMounts()
    const report = composition.performance(undefined, FIXED_TIME)
    const expectedEntities = TECHNICAL_MOVEMENT_FIXTURES
      .reduce((total, fixture) => total + fixture.assembly.instances.length, 0)

    expect(report).toMatchObject({
      withinBudget: true,
      measuredAt: FIXED_TIME,
      measurementKind: 'logical-estimate',
      metrics: {
        mountedFixtures: 4,
        logicalEntities: expectedEntities,
        renderablePrimitives: expectedEntities,
      },
    })
    expect(report.metrics.geometryReuseGroups).toBeGreaterThan(0)
    expect(report.metrics.safeInstanceGroups).toBeGreaterThan(0)

    const constrained = composition.performance({
      ...DEFAULT_VISUAL_PERFORMANCE_BUDGET,
      maxLogicalEntities: 1,
      maxRenderablePrimitives: 1,
      maxEstimatedDrawCalls: 1,
    }, FIXED_TIME)
    expect(constrained.withinBudget).toBe(false)
    expect(constrained.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'EV-PERF-ENTITIES' }),
      expect.objectContaining({ code: 'EV-PERF-PRIMITIVES' }),
      expect.objectContaining({ code: 'EV-PERF-DRAW-CALLS' }),
    ]))
    await composition.dispose()
  })

  it('no muta los fixtures 4B al construir, operar, medir o restaurar', async () => {
    const before = stableFingerprint(TECHNICAL_MOVEMENT_FIXTURES)
    const composition = new EducationalViewportComposition(
      spec('immutability', 'single', [mount('miyota-2035', MIYOTA_2035_TECHNICAL_FIXTURE)]),
      registryFor([MIYOTA_2035_TECHNICAL_FIXTURE]),
      { wallClock: () => FIXED_TIME },
    )
    const [{ sceneGraph }] = await composition.loadEnabledMounts()
    composition.execute({ type: 'select', entityIds: [sceneGraph.entityIds[0]] })
    const snapshot = composition.captureSnapshot()
    composition.execute({ type: 'reset-presentation' })
    await composition.restoreSnapshot(snapshot)
    composition.performance(undefined, FIXED_TIME)
    await composition.dispose()
    expect(stableFingerprint(TECHNICAL_MOVEMENT_FIXTURES)).toBe(before)
  })
})
