import { invokeLearningNative } from '../../platform/native'
import {
  LearningRepositorySnapshotSchema,
  type InstalledLearningPackage,
  type LearningBackupRecord,
  type LearningMasteryProjection,
  type LearningMigrationRecord,
  type LearningProfile,
  type LearningRecoveryLogRecord,
  type LearningRepositorySnapshot,
  type PersistedLearningEvent,
  type PersistentAssessment,
  type PersistentEvidenceRecord,
  type PersistentLearningSession,
} from './models'
import { MemoryLearningRepository } from './memoryRepository'
import type { LearningRepository, Page, PageRequest } from './repository'

export interface LearningNativeGateway {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>
}

const defaultGateway: LearningNativeGateway = {
  invoke: invokeLearningNative,
}

export interface NativeLearningDatabaseInfo {
  path: string
  schemaVersion: number
  currentSchemaVersion: number
  integrity: string
  foreignKeys: boolean
}

export class SqliteLearningRepository implements LearningRepository {
  readonly backend = 'sqlite' as const
  private readonly gateway: LearningNativeGateway
  private initialized = false
  private closed = false
  private transactionTail: Promise<void> = Promise.resolve()

  constructor(gateway: LearningNativeGateway = defaultGateway) {
    this.gateway = gateway
  }

  async initialize(): Promise<void> {
    if (this.closed) throw new Error('El repositorio SQLite learning está cerrado.')
    const info = await this.gateway.invoke<NativeLearningDatabaseInfo>('learning_database_info_native')
    if (info.integrity !== 'ok' || !info.foreignKeys) {
      throw new Error(`SQLite learning no es utilizable: integrity=${info.integrity}, foreignKeys=${info.foreignKeys}.`)
    }
    if (info.schemaVersion > info.currentSchemaVersion) {
      throw new Error(`SQLite learning usa una versión futura ${info.schemaVersion}.`)
    }
    this.initialized = true
  }

  async close(): Promise<void> {
    this.closed = true
    this.initialized = false
  }

  async snapshot(): Promise<LearningRepositorySnapshot> {
    this.assertReady()
    const value = await this.gateway.invoke<unknown>('learning_snapshot_native')
    return LearningRepositorySnapshotSchema.parse(value)
  }

  async replaceSnapshot(value: LearningRepositorySnapshot): Promise<void> {
    this.assertReady()
    const snapshot = LearningRepositorySnapshotSchema.parse(structuredClone(value))
    await this.gateway.invoke<void>('learning_replace_snapshot_native', { value: snapshot })
  }

  async transaction<T>(work: (repository: LearningRepository) => Promise<T>): Promise<T> {
    this.assertReady()
    let release: () => void = () => undefined
    const previous = this.transactionTail
    this.transactionTail = new Promise<void>((resolve) => { release = resolve })
    await previous
    const memory = new MemoryLearningRepository(await this.snapshot())
    await memory.initialize()
    try {
      const result = await memory.transaction(work)
      await this.replaceSnapshot(await memory.snapshot())
      return result
    } finally {
      await memory.close()
      release()
    }
  }

  async putProfile(value: LearningProfile): Promise<void> { return this.mutate((repository) => repository.putProfile(value)) }
  async getProfile(id: string): Promise<LearningProfile | undefined> { return this.read((repository) => repository.getProfile(id)) }
  async listProfiles(page?: PageRequest, includeDeleted?: boolean): Promise<Page<LearningProfile>> { return this.read((repository) => repository.listProfiles(page, includeDeleted)) }
  async hardDeleteProfile(id: string): Promise<void> { return this.mutate((repository) => repository.hardDeleteProfile(id)) }
  async putSession(value: PersistentLearningSession): Promise<void> { return this.mutate((repository) => repository.putSession(value)) }
  async getSession(id: string): Promise<PersistentLearningSession | undefined> { return this.read((repository) => repository.getSession(id)) }
  async listSessions(profileId: string, page?: PageRequest, includeArchived?: boolean): Promise<Page<PersistentLearningSession>> { return this.read((repository) => repository.listSessions(profileId, page, includeArchived)) }
  async hardDeleteSession(id: string): Promise<void> { return this.mutate((repository) => repository.hardDeleteSession(id)) }
  async appendEvents(values: PersistedLearningEvent[]): Promise<{ inserted: string[]; duplicates: string[] }> { return this.mutate((repository) => repository.appendEvents(values)) }
  async listEvents(sessionId: string, page?: PageRequest): Promise<Page<PersistedLearningEvent>> { return this.read((repository) => repository.listEvents(sessionId, page)) }
  async addEvidence(value: PersistentEvidenceRecord): Promise<void> { return this.mutate((repository) => repository.addEvidence(value)) }
  async getEvidence(id: string): Promise<PersistentEvidenceRecord | undefined> { return this.read((repository) => repository.getEvidence(id)) }
  async listEvidence(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentEvidenceRecord>> { return this.read((repository) => repository.listEvidence(profileId, competencyId, page)) }
  async addAssessment(value: PersistentAssessment): Promise<void> { return this.mutate((repository) => repository.addAssessment(value)) }
  async listAssessments(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentAssessment>> { return this.read((repository) => repository.listAssessments(profileId, competencyId, page)) }
  async putMastery(value: LearningMasteryProjection): Promise<void> { return this.mutate((repository) => repository.putMastery(value)) }
  async getMastery(profileId: string, competencyId: string): Promise<LearningMasteryProjection | undefined> { return this.read((repository) => repository.getMastery(profileId, competencyId)) }
  async listMastery(profileId: string, page?: PageRequest): Promise<Page<LearningMasteryProjection>> { return this.read((repository) => repository.listMastery(profileId, page)) }
  async clearMastery(profileId: string): Promise<void> { return this.mutate((repository) => repository.clearMastery(profileId)) }
  async putPackage(value: InstalledLearningPackage): Promise<void> { return this.mutate((repository) => repository.putPackage(value)) }
  async getPackage(id: string, version: string): Promise<InstalledLearningPackage | undefined> { return this.read((repository) => repository.getPackage(id, version)) }
  async listPackages(page?: PageRequest): Promise<Page<InstalledLearningPackage>> { return this.read((repository) => repository.listPackages(page)) }
  async removePackage(id: string, version: string): Promise<void> { return this.mutate((repository) => repository.removePackage(id, version)) }
  async addMigration(value: LearningMigrationRecord): Promise<void> { return this.mutate((repository) => repository.addMigration(value)) }
  async listMigrations(): Promise<LearningMigrationRecord[]> { return this.read((repository) => repository.listMigrations()) }
  async putBackup(value: LearningBackupRecord): Promise<void> { return this.mutate((repository) => repository.putBackup(value)) }
  async listBackups(): Promise<LearningBackupRecord[]> { return this.read((repository) => repository.listBackups()) }
  async removeBackup(id: string): Promise<void> { return this.mutate((repository) => repository.removeBackup(id)) }
  async addRecoveryLog(value: LearningRecoveryLogRecord): Promise<void> { return this.mutate((repository) => repository.addRecoveryLog(value)) }
  async listRecoveryLog(sessionId?: string): Promise<LearningRecoveryLogRecord[]> { return this.read((repository) => repository.listRecoveryLog(sessionId)) }

  private async read<T>(work: (repository: MemoryLearningRepository) => Promise<T>): Promise<T> {
    const memory = new MemoryLearningRepository(await this.snapshot())
    await memory.initialize()
    try {
      return await work(memory)
    } finally {
      await memory.close()
    }
  }

  private mutate<T>(work: (repository: LearningRepository) => Promise<T>): Promise<T> {
    return this.transaction(work)
  }

  private assertReady(): void {
    if (this.closed || !this.initialized) throw new Error('El repositorio SQLite learning no está inicializado.')
  }
}

