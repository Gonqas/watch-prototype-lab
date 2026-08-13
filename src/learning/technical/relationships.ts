import type {
  FunctionalRelationship,
  TechnicalFunctionalRelation,
  TechnicalMovementFixture,
} from './reconstruction'

export type RelationshipDirection = 'outgoing' | 'incoming' | 'either'

export interface TechnicalRelationshipQuery {
  instanceId?: string
  type?: FunctionalRelationship
  direction?: RelationshipDirection
  subsystem?: string
  minimumConfidence?: TechnicalFunctionalRelation['confidence']
}

const confidenceRank: Record<TechnicalFunctionalRelation['confidence'], number> = {
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3,
}

export class TechnicalRelationshipIndex {
  private readonly fixture: TechnicalMovementFixture
  private readonly subsystemByInstanceId: ReadonlyMap<string, string | undefined>

  constructor(fixture: TechnicalMovementFixture) {
    this.fixture = structuredClone(fixture)
    this.subsystemByInstanceId = new Map(
      fixture.assembly.instances.map(({ id, subsystem }) => [id, subsystem]),
    )
  }

  list(query: TechnicalRelationshipQuery = {}): TechnicalFunctionalRelation[] {
    const direction = query.direction ?? 'either'
    const minimumRank = confidenceRank[query.minimumConfidence ?? 'unknown']
    return this.fixture.relations.filter((relation) => {
      if (query.type && relation.type !== query.type) return false
      if (confidenceRank[relation.confidence] < minimumRank) return false
      if (query.subsystem) {
        const fromSubsystem = this.subsystemByInstanceId.get(relation.fromInstanceId)
        const toSubsystem = this.subsystemByInstanceId.get(relation.toInstanceId)
        if (fromSubsystem !== query.subsystem && toSubsystem !== query.subsystem) return false
      }
      if (!query.instanceId) return true
      if (direction === 'outgoing') return relation.fromInstanceId === query.instanceId
      if (direction === 'incoming') return relation.toInstanceId === query.instanceId
      return relation.fromInstanceId === query.instanceId || relation.toInstanceId === query.instanceId
    }).map((relation) => structuredClone(relation))
  }

  outgoing(instanceId: string, type?: FunctionalRelationship): TechnicalFunctionalRelation[] {
    return this.list({ instanceId, type, direction: 'outgoing' })
  }

  incoming(instanceId: string, type?: FunctionalRelationship): TechnicalFunctionalRelation[] {
    return this.list({ instanceId, type, direction: 'incoming' })
  }

  removeBefore(instanceId: string): TechnicalFunctionalRelation[] {
    return this.outgoing(instanceId, 'remove-before')
  }

  inspectBefore(instanceId: string): TechnicalFunctionalRelation[] {
    return this.outgoing(instanceId, 'inspect-before')
  }
}
