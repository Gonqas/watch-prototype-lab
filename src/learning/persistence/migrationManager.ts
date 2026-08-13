import { sha256Fingerprint } from './fingerprints'
import type { LearningRepository } from './repository'

export const CURRENT_LEARNING_DATA_VERSION = 1

export interface LearningMigration {
  version: number
  name: string
  source: string
  apply(repository: LearningRepository): Promise<void>
}

export interface PreMigrationBackup {
  create(kind: 'pre-migration', protectedBackup: boolean): Promise<unknown>
}

const INITIAL_LOGICAL_MIGRATION: LearningMigration = {
  version: 1,
  name: 'initial-learning-data-contract',
  source: 'learning-data-contract/v1:profiles,sessions,events,evidence,assessments,mastery,packages,backups,recovery',
  apply: async () => undefined,
}

export class LearningMigrationManager {
  private readonly repository: LearningRepository
  private readonly backup?: PreMigrationBackup
  private readonly migrations: LearningMigration[]
  private readonly now: () => string
  private readonly monotonicNow: () => number

  constructor(
    repository: LearningRepository,
    options: {
      backup?: PreMigrationBackup
      migrations?: LearningMigration[]
      now?: () => string
      monotonicNow?: () => number
    } = {},
  ) {
    this.repository = repository
    this.backup = options.backup
    this.migrations = [...(options.migrations ?? [INITIAL_LOGICAL_MIGRATION])]
      .sort((left, right) => left.version - right.version)
    this.now = options.now ?? (() => new Date().toISOString())
    this.monotonicNow = options.monotonicNow ?? (() => performance.now())
    assertMigrationChain(this.migrations)
  }

  async migrate(): Promise<number[]> {
    const applied = await this.repository.listMigrations()
    const latest = Math.max(0, ...applied.map(({ version }) => version))
    const supported = this.migrations.at(-1)?.version ?? 0
    if (latest > supported) {
      throw new Error(`Los datos usan la versión futura ${latest}; este runtime admite ${supported}.`)
    }
    const pending = this.migrations.filter(({ version }) => version > latest)
    if (pending.length === 0) return []
    const snapshot = await this.repository.snapshot()
    const containsUserData = snapshot.profiles.length > 0
      || snapshot.sessions.length > 0
      || snapshot.events.length > 0
      || snapshot.evidence.length > 0
      || snapshot.packages.length > 0
    if (containsUserData) {
      if (!this.backup) throw new Error('Una migración con datos requiere backup previo verificable.')
      await this.backup.create('pre-migration', true)
    }
    const completed: number[] = []
    for (const migration of pending) {
      const started = this.monotonicNow()
      const checksum = await sha256Fingerprint(migration.source)
      await this.repository.transaction(async (transaction) => {
        await migration.apply(transaction)
        await transaction.addMigration({
          version: migration.version,
          name: migration.name,
          checksum,
          appliedAt: this.now(),
          durationMs: Math.max(0, this.monotonicNow() - started),
        })
      })
      completed.push(migration.version)
    }
    return completed
  }
}

function assertMigrationChain(migrations: LearningMigration[]): void {
  migrations.forEach((migration, index) => {
    const expected = index + 1
    if (migration.version !== expected) {
      throw new Error(`Cadena de migraciones inválida: se esperaba ${expected} y se recibió ${migration.version}.`)
    }
    if (!migration.name.trim() || !migration.source.trim()) {
      throw new Error(`La migración ${migration.version} carece de nombre o fuente canónica.`)
    }
  })
}

