import { stableFingerprint } from '../identity'
import type { TechnicalGeometryPrimitive, TechnicalMovementFixture } from '../technical/reconstruction'
import {
  type EducationalFixtureMountSpec,
  type EducationalSceneGraph,
  type EducationalVisualEntity,
  type EducationalVisualPrimitive,
  type Vec3,
  type VisualBounds,
  type VisualDiagnostic,
  type VisualEntityId,
  type VisualProvenanceClass,
  visualEntityId,
} from './model'
import { buildFixtureMechanismBinding } from './fixtureMechanismMotion'

function add(left: Vec3, right: Vec3): Vec3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]
}

function scale(value: Vec3, amount: number): Vec3 {
  return [value[0] * amount, value[1] * amount, value[2] * amount]
}

function rotateX(value: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return [value[0], value[1] * cosine - value[2] * sine, value[1] * sine + value[2] * cosine]
}

function rotateY(value: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return [value[0] * cosine + value[2] * sine, value[1], -value[0] * sine + value[2] * cosine]
}

function rotateZ(value: Vec3, angle: number): Vec3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return [value[0] * cosine - value[1] * sine, value[0] * sine + value[1] * cosine, value[2]]
}

export function applyVisualTransform(value: Vec3, mount: EducationalFixtureMountSpec): Vec3 {
  const scaled = scale(value, mount.transform.scale)
  const rotated = rotateZ(rotateY(rotateX(scaled, mount.transform.rotation[0]), mount.transform.rotation[1]), mount.transform.rotation[2])
  return add(rotated, mount.transform.position)
}

function boundsForPrimitive(position: Vec3, size: Vec3, mountScale: number): VisualBounds {
  const half: Vec3 = [
    Math.abs(size[0] * mountScale) / 2,
    Math.abs(size[1] * mountScale) / 2,
    Math.abs(size[2] * mountScale) / 2,
  ]
  const min: Vec3 = [position[0] - half[0], position[1] - half[1], position[2] - half[2]]
  const max: Vec3 = [position[0] + half[0], position[1] + half[1], position[2] + half[2]]
  return { min, max, center: position, radius: Math.hypot(half[0], half[1], half[2]) }
}

export function mergeVisualBounds(values: VisualBounds[]): VisualBounds | undefined {
  if (values.length === 0) return undefined
  const min: Vec3 = [
    Math.min(...values.map(({ min: value }) => value[0])),
    Math.min(...values.map(({ min: value }) => value[1])),
    Math.min(...values.map(({ min: value }) => value[2])),
  ]
  const max: Vec3 = [
    Math.max(...values.map(({ max: value }) => value[0])),
    Math.max(...values.map(({ max: value }) => value[1])),
    Math.max(...values.map(({ max: value }) => value[2])),
  ]
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  return { min, max, center, radius: Math.hypot(max[0] - center[0], max[1] - center[1], max[2] - center[2]) }
}

function provenanceClass(
  primitive: TechnicalGeometryPrimitive,
  modelState: string | undefined,
): VisualProvenanceClass {
  if (primitive.layer === 'official-nominal') return 'official'
  if (primitive.layer === 'physical-unit-measurement') return 'measured'
  if (primitive.layer === 'educational-simulation') return 'conceptual'
  if (primitive.layer === 'unknown') return 'unknown'
  if (modelState === 'visually-reconstructed') return 'reconstructed'
  return 'estimated'
}

function aggregateProvenance(classes: VisualProvenanceClass[]): VisualProvenanceClass {
  const priority: VisualProvenanceClass[] = ['unknown', 'estimated', 'reconstructed', 'conceptual', 'measured', 'official']
  return priority.find((candidate) => classes.includes(candidate)) ?? 'unknown'
}

function alignEstimatedGearContacts(
  entities: EducationalVisualEntity[],
  fixture: TechnicalMovementFixture,
  diagnostics: VisualDiagnostic[],
): void {
  const byInstanceId = new Map<string, EducationalVisualEntity>(
    entities.map((entity) => [entity.instanceId, entity]),
  )
  for (const relation of fixture.relations) {
    if (relation.type !== 'meshes-with') continue
    if (relation.layer === 'official-nominal' || relation.layer === 'physical-unit-measurement') continue
    const fromEntity = byInstanceId.get(relation.fromInstanceId)
    const toEntity = byInstanceId.get(relation.toInstanceId)
    const fromWheel = fromEntity?.primitives.find(({ shape }) => shape === 'wheel')
    const toWheel = toEntity?.primitives.find(({ shape }) => shape === 'wheel')
    if (!fromEntity || !toEntity || !fromWheel || !toWheel) continue
    const fromRadius = Math.abs(fromWheel.size[0]) / 2
    const toRadius = Math.abs(toWheel.size[0]) / 2
    const expectedDistance = fromRadius + toRadius
    if (expectedDistance <= 0) continue
    const dx = toWheel.position[0] - fromWheel.position[0]
    const dz = toWheel.position[2] - fromWheel.position[2]
    const distance = Math.hypot(dx, dz)
    if (Math.abs(distance - expectedDistance) <= expectedDistance * 0.03) continue
    const directionX = distance > 0.0001 ? dx / distance : 1
    const directionZ = distance > 0.0001 ? dz / distance : 0
    const targetX = fromWheel.position[0] + directionX * expectedDistance
    const targetZ = fromWheel.position[2] + directionZ * expectedDistance
    const offsetX = targetX - toWheel.position[0]
    const offsetZ = targetZ - toWheel.position[2]
    const limitation = 'Centro ajustado únicamente para mostrar contacto educativo entre geometrías estimadas; no es una posición nominal ni medida.'
    toEntity.primitives = toEntity.primitives.map((primitive) => ({
      ...primitive,
      position: [
        primitive.position[0] + offsetX,
        primitive.position[1],
        primitive.position[2] + offsetZ,
      ],
      limitations: [...new Set([...primitive.limitations, limitation])],
    }))
    toEntity.bounds = mergeVisualBounds(toEntity.primitives.map((primitive) =>
      boundsForPrimitive(primitive.position, primitive.size, 1)))
    toEntity.limitations = [...new Set([...toEntity.limitations, limitation])]
    diagnostics.push({
      code: 'EV-GEAR-CONTACT-ALIGNED',
      severity: 'info',
      message: `Se ajustó el contacto visual ${relation.id} sin convertirlo en dato oficial.`,
      accessibleMessage: `${fromEntity.name} y ${toEntity.name} se muestran en contacto educativo estimado.`,
      entityIds: [fromEntity.id, toEntity.id],
    })
  }
}

export function buildEducationalSceneGraph(
  compositionId: string,
  mount: EducationalFixtureMountSpec,
  fixture: TechnicalMovementFixture,
): EducationalSceneGraph {
  const definitions = new Map(fixture.assembly.definitions.map((definition) => [definition.id, definition]))
  const ledgerByInstance = new Map(fixture.ledger.flatMap((record) =>
    record.instanceIds.map((instanceId) => [instanceId, record] as const)))
  const geometryByInstance = new Map<string, TechnicalGeometryPrimitive[]>()
  fixture.geometry.forEach((primitive) => {
    geometryByInstance.set(primitive.entityId, [...(geometryByInstance.get(primitive.entityId) ?? []), primitive])
  })
  const diagnostics: VisualDiagnostic[] = []
  const entities: EducationalVisualEntity[] = fixture.assembly.instances.map((instance) => {
    const id = visualEntityId(mount.id, fixture.id, instance.id)
    const definition = definitions.get(instance.definitionId)
    const ledger = ledgerByInstance.get(instance.id)
    const sourcePrimitives = geometryByInstance.get(instance.id) ?? []
    const primitives: EducationalVisualPrimitive[] = sourcePrimitives.map((primitive) => {
      const position = applyVisualTransform(primitive.position, mount)
      return {
        id: `${id}::${primitive.id}`,
        entityId: id,
        sourcePrimitiveId: primitive.id,
        shape: primitive.shape,
        visualProfile: primitive.visualProfile,
        toothCount: primitive.toothCount,
        boreRatio: primitive.boreRatio,
        cutaway: primitive.cutaway,
        position,
        size: scale(primitive.size, mount.transform.scale),
        coordinateSpace: primitive.coordinateSpace,
        dataLayer: primitive.layer,
        provenanceClass: provenanceClass(primitive, ledger?.modelState),
        sourceIds: [...primitive.sourceIds],
        limitations: [...primitive.limitations],
        colorHint: primitive.color,
        opacityHint: primitive.opacity,
      }
    })
    if (sourcePrimitives.length === 0 && instance.state !== 'deleted') {
      diagnostics.push({
        code: 'EV-GEOMETRY-MISSING',
        severity: 'warning',
        message: `La instancia ${instance.id} no tiene geometría; se conserva como entidad textual explícita.`,
        accessibleMessage: `${definition?.name ?? instance.id}: geometría desconocida, disponible solo en la alternativa textual.`,
        entityIds: [id],
      })
    }
    const bounds = mergeVisualBounds(primitives.map((primitive) =>
      boundsForPrimitive(primitive.position, primitive.size, 1)))
    const sourceIds = [...new Set([
      ...(ledger?.sourceIds ?? []),
      ...primitives.flatMap((primitive) => primitive.sourceIds),
      ...(definition?.provenance.map(({ id: sourceId }) => sourceId) ?? []),
    ])].sort()
    const provenanceClasses = primitives.map(({ provenanceClass: value }) => value)
    return {
      id,
      objectKey: id,
      mountId: mount.id,
      fixtureId: fixture.id,
      fixtureVersion: fixture.version,
      instanceId: instance.id,
      definitionId: instance.definitionId,
      name: definition?.name ?? instance.id,
      category: definition?.category ?? 'unknown',
      role: instance.role,
      subsystem: instance.subsystem,
      instanceState: instance.state,
      renderable: instance.state !== 'deleted' && primitives.length > 0,
      placeholder: primitives.length === 0 || primitives.every(({ shape }) => shape === 'symbolic-marker'),
      primitives,
      bounds,
      sourceIds,
      provenanceClass: aggregateProvenance(provenanceClasses),
      fidelity: ledger?.fidelity ?? definition?.fidelity,
      limitations: [...new Set([...(ledger?.limitations ?? []), ...primitives.flatMap(({ limitations }) => limitations)])],
    }
  })
  const entityIds = entities.map(({ id }) => id)
  if (new Set(entityIds).size !== entityIds.length) {
    diagnostics.push({
      code: 'EV-ENTITY-ID-COLLISION',
      severity: 'error',
      message: `La montura ${mount.id} produjo IDs visuales duplicados.`,
      accessibleMessage: 'No se puede representar la montura porque dos piezas comparten la misma identidad visual.',
    })
  }
  alignEstimatedGearContacts(entities, fixture, diagnostics)
  return {
    compositionId,
    mountId: mount.id,
    fixtureId: fixture.id,
    fixtureVersion: fixture.version,
    assemblyId: fixture.assembly.id,
    transform: structuredClone(mount.transform),
    entities,
    entityIds,
    diagnostics,
    bounds: mergeVisualBounds(entities.flatMap(({ bounds }) => bounds ? [bounds] : [])),
    mechanism: buildFixtureMechanismBinding(fixture, entities),
  }
}

export class LogicalVisualObjectRegistry {
  private readonly entityByObjectKey = new Map<string, EducationalVisualEntity>()
  private readonly objectKeyByEntityId = new Map<VisualEntityId, string>()

  registerGraph(graph: EducationalSceneGraph): void {
    graph.entities.forEach((entity) => {
      if (this.entityByObjectKey.has(entity.objectKey) || this.objectKeyByEntityId.has(entity.id)) {
        throw new Error(`Objeto visual duplicado: ${entity.id}`)
      }
      this.entityByObjectKey.set(entity.objectKey, structuredClone(entity))
      this.objectKeyByEntityId.set(entity.id, entity.objectKey)
    })
  }

  unregisterMount(mountId: string): void {
    for (const [entityId, objectKey] of this.objectKeyByEntityId.entries()) {
      const entity = this.entityByObjectKey.get(objectKey)
      if (entity?.mountId !== mountId) continue
      this.objectKeyByEntityId.delete(entityId)
      this.entityByObjectKey.delete(objectKey)
    }
  }

  objectKey(entityId: VisualEntityId): string | undefined {
    return this.objectKeyByEntityId.get(entityId)
  }

  entityForObjectKey(objectKey: string): EducationalVisualEntity | undefined {
    const entity = this.entityByObjectKey.get(objectKey)
    return entity ? structuredClone(entity) : undefined
  }

  entity(entityId: VisualEntityId): EducationalVisualEntity | undefined {
    const objectKey = this.objectKeyByEntityId.get(entityId)
    return objectKey ? this.entityForObjectKey(objectKey) : undefined
  }

  entityIds(): VisualEntityId[] {
    return [...this.objectKeyByEntityId.keys()].sort()
  }

  size(): number {
    return this.objectKeyByEntityId.size
  }

  fingerprint(): string {
    return stableFingerprint([...this.objectKeyByEntityId.entries()].sort(([left], [right]) => left.localeCompare(right)))
  }
}
