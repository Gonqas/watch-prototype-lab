import type { RuntimeEvent, RuntimeEventEmitter } from '../runtime/events'
import type { LearningCheckpoint } from './models'
import { EvidenceProjectionEngine, type EvidenceProjectionScope } from './evidenceEngine'
import { RuntimeEventIngestionService, type RuntimeIngestionResult } from './ingestion'
import { LearningSessionService } from './sessionService'

export interface RuntimePersistenceBinding {
  flush(): Promise<RuntimeIngestionResult[]>
  checkpoint(value: LearningCheckpoint): Promise<void>
  projectEvidence(scope?: EvidenceProjectionScope): Promise<string[]>
  dispose(): Promise<void>
}

export class LearningPersistenceCoordinator {
  private readonly ingestion: RuntimeEventIngestionService
  private readonly evidence: EvidenceProjectionEngine
  private readonly sessions: LearningSessionService

  constructor(
    ingestion: RuntimeEventIngestionService,
    evidence: EvidenceProjectionEngine,
    sessions: LearningSessionService,
  ) {
    this.ingestion = ingestion
    this.evidence = evidence
    this.sessions = sessions
  }

  bind(sessionId: string, emitter: RuntimeEventEmitter): RuntimePersistenceBinding {
    let pending: RuntimeEvent[] = []
    let tail = Promise.resolve<RuntimeIngestionResult[]>([])
    let disposed = false
    const drain = (): Promise<RuntimeIngestionResult[]> => {
      const batch = pending
      pending = []
      if (batch.length === 0) return tail
      tail = tail.then(async (receipts) => [
        ...receipts,
        await this.ingestion.ingest(sessionId, batch),
      ])
      return tail
    }
    const unsubscribe = emitter.subscribe((event) => {
      if (disposed) return
      pending.push(event)
      if (pending.length >= 20 || event.type === 'scene-completed' || event.type === 'runtime-error') {
        void drain()
      }
    })
    return {
      flush: drain,
      checkpoint: async (value) => {
        await drain()
        await this.sessions.checkpoint(sessionId, value)
      },
      projectEvidence: async (scope) => {
        await drain()
        const records = await this.evidence.projectSession(sessionId, scope)
        return records.map(({ id }) => id)
      },
      dispose: async () => {
        disposed = true
        unsubscribe()
        await drain()
      },
    }
  }
}
