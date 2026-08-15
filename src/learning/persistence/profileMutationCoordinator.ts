import type { LearningProfile } from './models'
import { LearningRepositoryError, type LearningRepository } from './repository'

export type ProfileMutationKind =
  | 'profile-create'
  | 'profile-update'
  | 'profile-archive'
  | 'profile-delete'
  | 'accessibility'
  | 'educational-preferences'
  | 'academy-state'
  | 'notification-read'
  | 'recovery'

export type ProfileMutationResult = 'succeeded' | 'failed' | 'conflict-exhausted'

export interface ProfileMutationDiagnostic {
  mutationId: string
  profileHash: string
  mutationKind: ProfileMutationKind
  queuedAt: string
  startedAt: string
  finishedAt: string
  attempts: number
  conflictCount: number
  result: ProfileMutationResult
}

export interface ProfileMutationCoordinatorOptions {
  maxAttempts?: number
  diagnosticLimit?: number
  now?: () => string
  createId?: () => string
}

export type ProfileMutation = (current: Readonly<LearningProfile>) => LearningProfile

function isConflict(error: unknown): boolean {
  return error instanceof LearningRepositoryError && error.code === 'conflict'
}

function stableProfileHash(profileId: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < profileId.length; index += 1) {
    hash ^= profileId.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `local-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

/**
 * Serializes pure profile mutations per profile and reapplies them to the
 * latest repository value. It intentionally keeps no profile snapshots.
 */
export class ProfileMutationCoordinator {
  private readonly repository: LearningRepository
  private readonly maxAttempts: number
  private readonly diagnosticLimit: number
  private readonly now: () => string
  private readonly createId: () => string
  private readonly tails = new Map<string, Promise<unknown>>()
  private readonly pendingCounts = new Map<string, number>()
  private readonly records: ProfileMutationDiagnostic[] = []

  constructor(repository: LearningRepository, options: ProfileMutationCoordinatorOptions = {}) {
    this.repository = repository
    this.maxAttempts = Math.max(1, Math.min(10, options.maxAttempts ?? 3))
    this.diagnosticLimit = Math.max(1, Math.min(1_000, options.diagnosticLimit ?? 200))
    this.now = options.now ?? (() => new Date().toISOString())
    this.createId = options.createId ?? (() => crypto.randomUUID())
  }

  enqueue(profileId: string, mutationKind: ProfileMutationKind, mutation: ProfileMutation): Promise<LearningProfile> {
    const mutationId = `profile-mutation.${this.createId()}`
    const queuedAt = this.now()
    const previous = this.tails.get(profileId) ?? Promise.resolve()
    this.pendingCounts.set(profileId, (this.pendingCounts.get(profileId) ?? 0) + 1)
    const run = previous.catch(() => undefined).then(async () => {
      const startedAt = this.now()
      let conflictCount = 0
      let attempts = 0
      try {
        while (attempts < this.maxAttempts) {
          attempts += 1
          try {
            const updated = await this.repository.transaction(async (transaction) => {
              const current = await transaction.getProfile(profileId)
              if (!current) throw new Error(`Perfil inexistente: ${profileId}.`)
              const candidate = mutation(structuredClone(current))
              const next: LearningProfile = {
                ...structuredClone(candidate),
                id: current.id,
                schemaVersion: 1,
                createdAt: current.createdAt,
                modifiedAt: this.now(),
                recordVersion: current.recordVersion + 1,
              }
              await transaction.putProfile(next)
              return structuredClone(next)
            })
            this.record({
              mutationId, profileHash: stableProfileHash(profileId), mutationKind,
              queuedAt, startedAt, finishedAt: this.now(), attempts, conflictCount, result: 'succeeded',
            })
            return updated
          } catch (error) {
            if (!isConflict(error)) throw error
            conflictCount += 1
            if (attempts >= this.maxAttempts) {
              this.record({
                mutationId, profileHash: stableProfileHash(profileId), mutationKind,
                queuedAt, startedAt, finishedAt: this.now(), attempts, conflictCount, result: 'conflict-exhausted',
              })
              throw new LearningRepositoryError(
                'conflict',
                `No se pudo guardar ${mutationKind} tras ${attempts} intentos. La mutación puede reintentarse.`,
                true,
                { mutationId, attempts, conflictCount },
              )
            }
          }
        }
        throw new Error('La cola de perfil alcanzó un estado imposible.')
      } catch (error) {
        if (!isConflict(error)) {
          this.record({
            mutationId, profileHash: stableProfileHash(profileId), mutationKind,
            queuedAt, startedAt, finishedAt: this.now(), attempts, conflictCount, result: 'failed',
          })
        }
        throw error
      }
    })
    const settled = run.finally(() => {
      const remaining = Math.max(0, (this.pendingCounts.get(profileId) ?? 1) - 1)
      if (remaining === 0) this.pendingCounts.delete(profileId)
      else this.pendingCounts.set(profileId, remaining)
      if (this.tails.get(profileId) === settled) this.tails.delete(profileId)
    })
    this.tails.set(profileId, settled)
    return settled
  }

  async flush(profileId: string): Promise<void> {
    await this.tails.get(profileId)
  }

  async flushAll(): Promise<void> {
    await Promise.all([...this.tails.values()])
  }

  pending(profileId: string): number {
    return this.pendingCounts.get(profileId) ?? 0
  }

  diagnostics(): ProfileMutationDiagnostic[] {
    return structuredClone(this.records)
  }

  exportDiagnostics(): string {
    return JSON.stringify({
      schema: 'wplab-profile-mutation-diagnostics-v1',
      exportedAt: this.now(),
      records: this.diagnostics(),
    }, null, 2)
  }

  clearDiagnostics(): void {
    this.records.splice(0)
  }

  private record(diagnostic: ProfileMutationDiagnostic): void {
    this.records.push(diagnostic)
    if (this.records.length > this.diagnosticLimit) this.records.splice(0, this.records.length - this.diagnosticLimit)
  }
}

const sharedCoordinators = new WeakMap<LearningRepository, ProfileMutationCoordinator>()

export function profileMutationCoordinatorFor(repository: LearningRepository): ProfileMutationCoordinator {
  const existing = sharedCoordinators.get(repository)
  if (existing) return existing
  const coordinator = new ProfileMutationCoordinator(repository)
  sharedCoordinators.set(repository, coordinator)
  return coordinator
}
