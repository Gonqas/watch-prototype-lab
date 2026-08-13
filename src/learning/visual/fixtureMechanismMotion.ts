import type {
  TechnicalDataLayer,
  TechnicalFunctionalRelation,
  TechnicalMovementFixture,
} from '../technical/reconstruction'
import type { EducationalVisualEntity } from './model'
import type {
  MechanismDataClass,
  MechanismMotionGraph,
  MechanismMotionNode,
  MechanismMotionRelation,
  MechanismMotionSource,
  MechanismRelationType,
  MechanismValue,
} from './mechanismMotionGraph'

export interface FixtureMechanismBinding {
  graph: MechanismMotionGraph
  defaultSource?: MechanismMotionSource
  energySourceNodeId?: string
}

function dataClassForLayer(layer: TechnicalDataLayer): MechanismDataClass {
  if (layer === 'official-nominal' || layer === 'official-part-identity') return 'official'
  if (layer === 'physical-unit-measurement' || layer === 'physical-unit-observation') return 'measured'
  if (layer === 'educational-simulation') return 'conceptual'
  if (layer === 'visual-reconstruction-estimate' || layer === 'document-inferred-relation') return 'estimated'
  return 'unknown'
}

function entityTokens(entity: EducationalVisualEntity): Set<string> {
  return new Set([
    entity.role,
    entity.category,
    entity.subsystem,
    ...entity.primitives.map(({ visualProfile }) => visualProfile),
  ].filter((value): value is string => Boolean(value)))
}

function motionKind(entity: EducationalVisualEntity): MechanismMotionNode['motion'] {
  const tokens = entityTokens(entity)
  if (tokens.has('pallet-fork')) return 'pallet'
  if (tokens.has('balance') || tokens.has('hairspring') || tokens.has('balance-wheel')) return 'oscillation'
  if (
    entity.primitives.some(({ shape }) => shape === 'wheel')
    || [...tokens].some((token) => [
      'barrel',
      'barrel-cover',
      'stepper-rotor',
      'automatic-winding',
      'rotor',
      'hour-hand',
      'minute-hand',
      'second-hand',
      'indication',
      'motion-works',
    ].includes(token))
  ) return 'rotation'
  return 'static'
}

function value(
  numericValue: number,
  dataClass: MechanismDataClass,
  sourceIds: string[],
  limitation: string,
): MechanismValue {
  return {
    value: numericValue,
    dataClass,
    sourceIds: [...sourceIds],
    limitation,
  }
}

function pitchRadius(entity: EducationalVisualEntity): number | undefined {
  const wheel = entity.primitives.find(({ shape }) => shape === 'wheel')
  return wheel ? Math.abs(wheel.size[0]) / 2 : undefined
}

function projectedDistance(left: EducationalVisualEntity, right: EducationalVisualEntity): number | undefined {
  if (!left.bounds || !right.bounds) return undefined
  return Math.hypot(
    left.bounds.center[0] - right.bounds.center[0],
    left.bounds.center[2] - right.bounds.center[2],
  )
}

function mappedRelationType(
  relation: TechnicalFunctionalRelation,
  fromEntity: EducationalVisualEntity,
  toEntity: EducationalVisualEntity,
): MechanismRelationType | undefined {
  if (relation.type === 'meshes-with') return 'meshes-with'
  if (relation.type === 'locks') return 'locks'
  if (relation.type === 'releases') return 'releases'
  if (relation.type === 'impulses') return 'impulses'
  if (relation.type === 'winds') return 'winds'
  if (relation.type !== 'drives') return undefined
  const distance = projectedDistance(fromEntity, toEntity)
  return distance !== undefined && distance < 0.02 ? 'same-arbor' : 'drives'
}

function mechanismRelation(
  relation: TechnicalFunctionalRelation,
  fromEntity: EducationalVisualEntity,
  toEntity: EducationalVisualEntity,
  conceptualFixture: boolean,
): MechanismMotionRelation | undefined {
  const type = mappedRelationType(relation, fromEntity, toEntity)
  if (!type) return undefined
  const dataClass = dataClassForLayer(relation.layer)
  const fromRadius = pitchRadius(fromEntity)
  const toRadius = pitchRadius(toEntity)
  const distance = projectedDistance(fromEntity, toEntity)
  const expectedDistance = fromRadius !== undefined && toRadius !== undefined
    ? fromRadius + toRadius
    : undefined
  const contact = type === 'meshes-with'
    ? expectedDistance !== undefined && distance !== undefined
      ? Math.abs(distance - expectedDistance) <= expectedDistance * 0.14
        ? conceptualFixture ? 'confirmed' : 'estimated'
        : 'separated'
      : 'unknown'
    : type === 'locks' || type === 'releases' || type === 'impulses'
      ? conceptualFixture ? 'confirmed' : 'estimated'
      : 'not-applicable'
  const result: MechanismMotionRelation = {
    id: relation.id,
    type,
    fromId: fromEntity.id,
    toId: toEntity.id,
    dataClass,
    state: 'engaged',
    contact,
    ...(type === 'meshes-with' ? { mesh: 'external' as const } : {}),
    sourceIds: [...relation.sourceIds],
    limitations: [...relation.limitations],
  }
  if (
    type === 'drives'
    || type === 'winds'
    || type === 'impulses'
  ) {
    if (conceptualFixture || relation.layer === 'educational-simulation') {
      result.ratio = value(
        1,
        'conceptual',
        relation.sourceIds,
        'Acoplamiento visual unitario del modelo educativo; no expresa la relación de un calibre real.',
      )
    } else if (motionKind(fromEntity) !== 'static' && motionKind(toEntity) !== 'static') {
      result.ratio = value(
        fromRadius && toRadius ? fromRadius / toRadius : 1,
        'estimated',
        relation.sourceIds,
        fromRadius && toRadius
          ? 'Relación visual derivada de radios reconstruidos; no equivale a dientes oficiales.'
          : 'Acoplamiento visual unitario por ausencia de una relación oficial publicada; no expresa velocidad nominal.',
      )
    }
  }
  if (
    type === 'meshes-with'
    && fromEntity.primitives.every(({ toothCount }) => toothCount === undefined)
    && toEntity.primitives.every(({ toothCount }) => toothCount === undefined)
    && fromRadius
    && toRadius
  ) {
    result.ratio = value(
      fromRadius / toRadius,
      'estimated',
      relation.sourceIds,
      'Relación visual derivada de radios reconstruidos; no equivale a un conteo de dientes oficial.',
    )
  }
  return result
}

function findRole(entities: EducationalVisualEntity[], roles: string[]): EducationalVisualEntity | undefined {
  return entities.find((entity) => {
    const tokens = entityTokens(entity)
    return roles.some((role) => tokens.has(role))
  })
}

export function buildFixtureMechanismBinding(
  fixture: TechnicalMovementFixture,
  entities: EducationalVisualEntity[],
): FixtureMechanismBinding {
  const visualByInstanceId = new Map<string, EducationalVisualEntity>(
    entities.map((entity) => [entity.instanceId, entity]),
  )
  const ledgerByInstanceId = new Map<string, TechnicalMovementFixture['ledger'][number]>(fixture.ledger.flatMap((record) =>
    record.instanceIds.map((instanceId) => [instanceId, record] as const)))
  const conceptualFixture = fixture.kind === 'conceptual-mechanical' || fixture.kind === 'conceptual-quartz'
  const nodes = entities.map((entity): MechanismMotionNode => {
    const ledger = ledgerByInstanceId.get(entity.instanceId)
    const primitiveToothCount = entity.primitives.find(({ toothCount }) => toothCount)?.toothCount
    const toothDatum = ledger?.toothCount
    const toothCount = primitiveToothCount ?? (
      typeof toothDatum?.value === 'number' ? toothDatum.value : undefined
    )
    const toothClass = toothDatum ? dataClassForLayer(toothDatum.layer) : conceptualFixture ? 'conceptual' : 'estimated'
    return {
      id: entity.id,
      motion: motionKind(entity),
      axis: [0, 1, 0],
      ...(toothCount ? {
        teeth: value(
          toothCount,
          toothClass,
          toothDatum?.sourceIds ?? entity.sourceIds,
          toothDatum?.limitations[0] ?? 'Conteo usado exclusivamente para la representación declarada.',
        ),
      } : {}),
      limitations: [...entity.limitations],
    }
  })
  const relations = fixture.relations.flatMap((relation) => {
    const fromEntity = visualByInstanceId.get(relation.fromInstanceId)
    const toEntity = visualByInstanceId.get(relation.toInstanceId)
    if (!fromEntity || !toEntity) return []
    const mapped = mechanismRelation(relation, fromEntity, toEntity, conceptualFixture)
    return mapped ? [mapped] : []
  })
  const escapeWheel = findRole(entities, ['escape-wheel'])
  const palletFork = findRole(entities, ['pallet-fork'])
  const oscillator = findRole(entities, ['balance', 'balance-wheel'])
  const hairspring = findRole(entities, ['hairspring'])
  const frequencyHz = fixture.calibre === '8215' ? 3 : 2
  const escapement = escapeWheel && palletFork && oscillator
    ? {
        escapeWheelId: escapeWheel.id,
        palletForkId: palletFork.id,
        oscillatorId: oscillator.id,
        ...(hairspring ? { hairspringId: hairspring.id } : {}),
        escapeStepRadians: value(
          Math.PI * 2 / (escapeWheel.primitives.find(({ toothCount }) => toothCount)?.toothCount ?? 15),
          escapeWheel.primitives.some(({ toothCount }) => toothCount) ? 'conceptual' : 'estimated',
          escapeWheel.sourceIds,
          'Paso angular del demostrador; el conteo debe verificarse antes de atribuirlo a un calibre.',
        ),
        frequencyHz: value(
          frequencyHz,
          fixture.calibre === '8215' ? 'official' : 'conceptual',
          fixture.sourceIds,
          fixture.calibre === '8215'
            ? '3 Hz corresponden a las 21.600 alternancias por hora publicadas; no validan la geometría.'
            : 'Frecuencia ralentizada del demostrador educativo.',
        ),
        oscillatorAmplitudeRadians: value(
          Math.PI * 0.62,
          'conceptual',
          fixture.sourceIds,
          'Amplitud visual normalizada; no son grados medidos.',
        ),
        palletAmplitudeRadians: value(
          Math.PI / 20,
          'conceptual',
          fixture.sourceIds,
          'Oscilación visual normalizada; no representa ángulos de paleta.',
        ),
        sourceIds: [...fixture.sourceIds],
        limitations: ['Escape educativo coordinado; no simula fuerzas, fricción, lubricación, pérdidas ni choque.'],
      }
    : undefined
  const graph: MechanismMotionGraph = {
    schemaVersion: 1,
    id: `mechanism.${fixture.id}`,
    version: fixture.version,
    dataClass: conceptualFixture ? 'conceptual' : 'estimated',
    fidelity: fixture.fidelity,
    nodes,
    relations,
    ...(escapement ? { escapement } : {}),
    sourceIds: [...fixture.sourceIds],
    limitations: [
      ...fixture.limitations,
      conceptualFixture
        ? 'Movimiento gobernado por relaciones y conteos educativos declarados.'
        : 'Cuando faltan dientes o centros oficiales se usa, como máximo, una relación visual estimada y trazable.',
    ],
  }
  const sourceEntity = fixture.kind.includes('quartz')
    ? findRole(entities, ['stepper-rotor'])
    : findRole(entities, ['barrel'])
  const energySourceEntity = fixture.kind.includes('quartz')
    ? findRole(entities, ['power-source', 'battery'])
    : findRole(entities, ['mainspring'])
  return {
    graph,
    ...(energySourceEntity ? { energySourceNodeId: energySourceEntity.id } : {}),
    ...(sourceEntity ? {
      defaultSource: {
        nodeId: sourceEntity.id,
        angularVelocityRadiansPerSecond: fixture.kind.includes('quartz') ? 1.7 : 0.004,
      },
    } : {}),
  }
}
