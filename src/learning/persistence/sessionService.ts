import type {
  LearningCheckpoint,
  PersistentLearningSession,
  PersistentLearningSessionState,
} from './models'
import { LearningRepositoryError, type LearningRepository } from './repository'

const TRANSITIONS: Record<PersistentLearningSessionState, PersistentLearningSessionState[]> = {
  created: ['preparing', 'cancelled', 'archived'],
  preparing: ['ready', 'failed', 'interrupted', 'cancelled'],
  ready: ['active', 'suspended', 'interrupted', 'cancelled', 'failed'],
  active: ['paused', 'awaiting_interaction', 'suspended', 'interrupted', 'completed', 'cancelled', 'failed'],
  paused: ['active', 'suspended', 'interrupted', 'completed', 'cancelled', 'failed'],
  awaiting_interaction: ['active', 'paused', 'suspended', 'interrupted', 'cancelled', 'failed'],
  suspended: ['recovering', 'archived', 'cancelled'],
  interrupted: ['recovering', 'archived', 'cancelled'],
  recovering: ['ready', 'active', 'paused', 'failed', 'archived', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  failed: ['recovering', 'archived', 'cancelled'],
  archived: [],
}

export interface CreatePersistentSessionInput {
  id?: string
  profileId: string
  packageId: string
  packageVersion: string
  lessonId: string
  activityId: string
  activityVersion: string
  rubricId: string
  rubricVersion: string
  reference: PersistentLearningSession['reference']
  projectFingerprint: `sha256:${string}`
  capabilities: string[]
  runtimeVersion: string
  attempt?: number
  learningMode?: NonNullable<PersistentLearningSession['learningMode']>
  originSessionId?: string
}

export class LearningSessionService {
  private readonly repository: LearningRepository
  private readonly now: () => string
  private readonly idFactory: () => string

  constructor(
    repository: LearningRepository,
    now: () => string = () => new Date().toISOString(),
    idFactory: () => string = () => crypto.randomUUID(),
  ) {
    this.repository = repository
    this.now = now
    this.idFactory = idFactory
  }

  async create(input: CreatePersistentSessionInput): Promise<PersistentLearningSession> {
    const timestamp = this.now()
    const session: PersistentLearningSession = {
      schemaVersion: 1,
      id: input.id ?? `session.${this.idFactory()}`,
      profileId: input.profileId,
      packageId: input.packageId,
      packageVersion: input.packageVersion,
      lessonId: input.lessonId,
      activityId: input.activityId,
      activityVersion: input.activityVersion,
      rubricId: input.rubricId,
      rubricVersion: input.rubricVersion,
      reference: structuredClone(input.reference),
      initialProjectFingerprint: input.projectFingerprint,
      currentProjectFingerprint: input.projectFingerprint,
      initialCapabilities: [...new Set(input.capabilities)].sort(),
      state: 'created',
      startedAt: timestamp,
      attempt: input.attempt ?? 1,
      learningMode: input.learningMode ?? 'authored',
      originSessionId: input.originSessionId,
      runtimeVersion: input.runtimeVersion,
      updatedAt: timestamp,
    }
    await this.repository.putSession(session)
    return session
  }

  async transition(sessionId: string, next: PersistentLearningSessionState, reason?: string): Promise<PersistentLearningSession> {
    return this.repository.transaction(async (transaction) => {
      const session = await this.required(transaction, sessionId)
      if (!TRANSITIONS[session.state].includes(next)) {
        throw new LearningRepositoryError('invalid-transition', `Transición persistente inválida: ${session.state} → ${next}.`)
      }
      if (next === 'completed') await this.assertCompletable(transaction, session)
      const timestamp = this.now()
      const updated: PersistentLearningSession = {
        ...session,
        state: next,
        reason,
        updatedAt: timestamp,
        completedAt: next === 'completed' ? timestamp : session.completedAt,
      }
      await transaction.putSession(updated)
      return updated
    })
  }

  async checkpoint(sessionId: string, checkpoint: LearningCheckpoint): Promise<PersistentLearningSession> {
    return this.repository.transaction(async (transaction) => {
      const session = await this.required(transaction, sessionId)
      if (['completed', 'cancelled', 'archived'].includes(session.state)) {
        throw new LearningRepositoryError('invalid-transition', `No se puede guardar checkpoint en ${session.state}.`)
      }
      if (checkpoint.packageId !== session.packageId || checkpoint.packageVersion !== session.packageVersion) {
        throw new LearningRepositoryError('constraint', 'El checkpoint no coincide con la versión de paquete fijada por la sesión.')
      }
      const updated = {
        ...session,
        checkpoint: structuredClone(checkpoint),
        currentProjectFingerprint: checkpoint.projectFingerprint,
        lastCheckpointAt: checkpoint.createdAt,
        updatedAt: checkpoint.createdAt,
      }
      await transaction.putSession(updated)
      return updated
    })
  }

  async markOpenSessionsInterrupted(reason = 'unexpected-shutdown'): Promise<string[]> {
    const profiles = await this.repository.listProfiles({ limit: 500 }, true)
    const changed: string[] = []
    await this.repository.transaction(async (transaction) => {
      for (const profile of profiles.items) {
        const sessions = await transaction.listSessions(profile.id, { limit: 500 }, true)
        for (const session of sessions.items) {
          if (!['preparing', 'ready', 'active', 'paused', 'awaiting_interaction', 'recovering'].includes(session.state)) continue
          await transaction.putSession({ ...session, state: 'interrupted', reason, updatedAt: this.now() })
          changed.push(session.id)
        }
      }
    })
    return changed
  }

  async restartAsNewAttempt(sessionId: string): Promise<PersistentLearningSession> {
    const source = await this.required(this.repository, sessionId)
    return this.create({
      profileId: source.profileId,
      packageId: source.packageId,
      packageVersion: source.packageVersion,
      lessonId: source.lessonId,
      activityId: source.activityId,
      activityVersion: source.activityVersion,
      rubricId: source.rubricId,
      rubricVersion: source.rubricVersion,
      reference: source.reference,
      projectFingerprint: source.currentProjectFingerprint as `sha256:${string}`,
      capabilities: source.initialCapabilities,
      runtimeVersion: source.runtimeVersion,
      attempt: source.attempt + 1,
      learningMode: source.learningMode,
      originSessionId: source.id,
    })
  }

  resumable(state: PersistentLearningSessionState): boolean {
    return ['ready', 'paused', 'suspended', 'interrupted', 'recovering'].includes(state)
  }

  evaluable(state: PersistentLearningSessionState): boolean {
    return ['completed', 'cancelled', 'failed', 'archived'].includes(state)
  }

  private async assertCompletable(repository: LearningRepository, session: PersistentLearningSession): Promise<void> {
    if (!session.checkpoint?.complete) throw new LearningRepositoryError('constraint', 'La sesión no tiene checkpoint final completo.')
    const events = await repository.listEvents(session.id, { limit: 500 })
    if (!events.items.some(({ type }) => type === 'scene-completed')) {
      throw new LearningRepositoryError('constraint', 'No se ha persistido el evento contractual scene-completed.')
    }
    if (events.items.at(-1)?.sequence !== session.checkpoint.lastPersistedSequence) {
      throw new LearningRepositoryError('constraint', 'El checkpoint final no confirma la última secuencia persistida.')
    }
  }

  private async required(repository: LearningRepository, sessionId: string): Promise<PersistentLearningSession> {
    const session = await repository.getSession(sessionId)
    if (!session) throw new LearningRepositoryError('not-found', `Sesión inexistente: ${sessionId}.`)
    return session
  }
}

export function allowedPersistentSessionTransitions(state: PersistentLearningSessionState): PersistentLearningSessionState[] {
  return [...TRANSITIONS[state]]
}
