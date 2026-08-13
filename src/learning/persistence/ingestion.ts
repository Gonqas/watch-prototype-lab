import type { RuntimeEvent, RuntimeEventType } from '../runtime/events'
import { sha256Fingerprint } from './fingerprints'
import type { PersistedLearningEvent, PersistentLearningSession } from './models'
import { LearningRepositoryError, type LearningRepository } from './repository'

export const PERSISTED_RUNTIME_EVENT_TYPES = new Set<RuntimeEventType>([
  'scene-started',
  'step-shown',
  'step-blocked',
  'step-completed',
  'entity-selected',
  'selection-confirmed',
  'hint-requested',
  'answer-submitted',
  'barrier-resolved',
  'scene-completed',
  'scene-cancelled',
  'restoration-completed',
  'workbench-command',
  'mechanical-lab-command',
  'calibre-lab-command',
  'runtime-error',
])

export interface RuntimeIngestionResult {
  persistedEventIds: string[]
  duplicateEventIds: string[]
  ephemeralSequences: number[]
  checkpointRequested: boolean
  lastPersistentSequence: number
}

export class RuntimeEventIngestionService {
  private readonly repository: LearningRepository
  private readonly now: () => string

  constructor(repository: LearningRepository, now: () => string = () => new Date().toISOString()) {
    this.repository = repository
    this.now = now
  }

  async ingest(sessionId: string, runtimeEvents: RuntimeEvent[]): Promise<RuntimeIngestionResult> {
    const ordered = [...runtimeEvents].sort((left, right) => left.sequence - right.sequence)
    const ephemeralSequences = ordered.filter(({ type }) => !PERSISTED_RUNTIME_EVENT_TYPES.has(type)).map(({ sequence }) => sequence)
    const persistible = ordered.filter(({ type }) => PERSISTED_RUNTIME_EVENT_TYPES.has(type))
    return this.repository.transaction(async (transaction) => {
      const session = await transaction.getSession(sessionId)
      if (!session) throw new LearningRepositoryError('not-found', `Sesión inexistente: ${sessionId}.`)
      this.validateState(session, persistible)
      const existing = await transaction.listEvents(sessionId, { limit: 500 })
      let sequence = existing.items.at(-1)?.sequence ?? -1
      const records: PersistedLearningEvent[] = []
      for (const event of persistible) {
        const idempotencyKey = `${event.sessionId}:${event.eventVersion}:${event.sequence}`
        const alreadyPersisted = existing.items.find((candidate) => candidate.idempotencyKey === idempotencyKey)
        if (alreadyPersisted) {
          records.push(alreadyPersisted)
          continue
        }
        const eventId = `event.${(await sha256Fingerprint({ sessionId, idempotencyKey })).slice(7, 31)}`
        sequence += 1
        records.push({
          schemaVersion: 1,
          id: eventId,
          sessionId,
          sequence,
          timestamp: event.timestamp,
          runtimeEventVersion: event.eventVersion,
          type: event.type,
          origin: 'runtime',
          actor: 'learner',
          payload: this.payload(event),
          idempotencyKey,
          persistedAt: this.now(),
          compatibility: event.eventVersion === 1 ? 'supported' : 'future-preserved',
        })
      }
      const result = await transaction.appendEvents(records)
      return {
        persistedEventIds: result.inserted,
        duplicateEventIds: result.duplicates,
        ephemeralSequences,
        checkpointRequested: persistible.some(({ type }) =>
          ['step-shown', 'step-blocked', 'step-completed', 'answer-submitted', 'barrier-resolved', 'scene-completed', 'workbench-command', 'mechanical-lab-command', 'calibre-lab-command'].includes(type)),
        lastPersistentSequence: records.at(-1)?.sequence ?? existing.items.at(-1)?.sequence ?? -1,
      }
    })
  }

  private validateState(session: PersistentLearningSession, events: RuntimeEvent[]): void {
    const permitted = ['ready', 'active', 'paused', 'awaiting_interaction', 'recovering']
    if (!permitted.includes(session.state)) {
      throw new LearningRepositoryError('invalid-transition', `La sesión ${session.state} no admite eventos del runtime.`)
    }
    if (events.some(({ sessionId }) => sessionId.length === 0)) throw new LearningRepositoryError('constraint', 'Runtime event sin session ID.')
    for (let index = 1; index < events.length; index += 1) {
      if (events[index].sequence <= events[index - 1].sequence) throw new LearningRepositoryError('constraint', 'Secuencia runtime no monótona.')
    }
  }

  private payload(event: RuntimeEvent): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...event }
    for (const field of ['eventVersion', 'sequence', 'timestamp', 'sessionId', 'type']) delete payload[field]
    return structuredClone(payload)
  }
}
