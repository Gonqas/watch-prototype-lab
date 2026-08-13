import {
  LearningRepositorySnapshotSchema,
  emptyLearningRepositorySnapshot,
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

const STORE_NAMES = [
  'profiles', 'sessions', 'events', 'evidence', 'assessments', 'mastery',
  'packages', 'migrations', 'backups', 'recoveryLog',
] as const

export const LEARNING_INDEXED_DB_VERSION = 2
export const METROLOGY_STORE_NAMES = [
  'physical_specimens', 'physical_components', 'instrument_profiles', 'instrument_verifications',
  'inspection_plans', 'inspection_sessions', 'inspection_observations', 'inspection_findings',
  'image_assets', 'image_derivatives', 'image_calibrations', 'image_annotations',
  'measurement_definitions', 'measurement_series', 'measurement_readings',
  'nominal_measured_comparisons', 'geometry_correction_proposals',
  'object_store_objects', 'object_store_references', 'object_store_import_jobs', 'metrology_reports',
] as const

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
  })
}

export interface IndexedDbLearningRepositoryOptions {
  databaseName?: string
  indexedDB?: IDBFactory
}

export class IndexedDbLearningRepository implements LearningRepository {
  readonly backend = 'indexeddb' as const
  private readonly databaseName: string
  private readonly factory: IDBFactory
  private database?: IDBDatabase
  private transactionTail: Promise<void> = Promise.resolve()

  constructor(options: IndexedDbLearningRepositoryOptions = {}) {
    this.databaseName = options.databaseName ?? 'watch-prototype-lab-learning'
    this.factory = options.indexedDB ?? globalThis.indexedDB
    if (!this.factory) throw new Error('IndexedDB no está disponible en esta superficie.')
  }

  async initialize(): Promise<void> {
    if (this.database) return
    const request = this.factory.open(this.databaseName, LEARNING_INDEXED_DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('meta')) database.createObjectStore('meta', { keyPath: 'key' })
      for (const storeName of STORE_NAMES) {
        if (database.objectStoreNames.contains(storeName)) continue
        if (storeName === 'mastery' || storeName === 'packages') database.createObjectStore(storeName)
        else if (storeName === 'migrations') database.createObjectStore(storeName, { keyPath: 'version' })
        else database.createObjectStore(storeName, { keyPath: 'id' })
      }
      for (const storeName of METROLOGY_STORE_NAMES) {
        if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' })
      }
    }
    this.database = await requestResult(request)
  }

  async close(): Promise<void> {
    this.database?.close()
    this.database = undefined
  }

  async snapshot(): Promise<LearningRepositorySnapshot> {
    const database = this.requiredDatabase()
    const transaction = database.transaction(['meta', ...STORE_NAMES], 'readonly')
    const collections = await Promise.all(STORE_NAMES.map(async (name) =>
      [name, await requestResult(transaction.objectStore(name).getAll())] as const))
    const revisionRow = await requestResult(transaction.objectStore('meta').get('revision')) as { key: string; value: number } | undefined
    await transactionComplete(transaction)
    const snapshot = emptyLearningRepositorySnapshot()
    snapshot.revision = revisionRow?.value ?? 0
    for (const [name, values] of collections) {
      ;(snapshot[name] as unknown[]) = values
    }
    return LearningRepositorySnapshotSchema.parse(snapshot)
  }

  async replaceSnapshot(input: LearningRepositorySnapshot): Promise<void> {
    const snapshot = LearningRepositorySnapshotSchema.parse(structuredClone(input))
    const database = this.requiredDatabase()
    const transaction = database.transaction(['meta', ...STORE_NAMES], 'readwrite')
    transaction.objectStore('meta').put({ key: 'revision', value: snapshot.revision })
    for (const storeName of STORE_NAMES) {
      const store = transaction.objectStore(storeName)
      store.clear()
      for (const value of snapshot[storeName]) {
        if (storeName === 'mastery') {
          const record = value as LearningMasteryProjection
          store.put(record, [record.profileId, record.competencyId])
        } else if (storeName === 'packages') {
          const record = value as InstalledLearningPackage
          store.put(record, [record.packageId, record.version])
        } else {
          store.put(value)
        }
      }
    }
    await transactionComplete(transaction)
  }

  async transaction<T>(work: (repository: LearningRepository) => Promise<T>): Promise<T> {
    let release: () => void = () => undefined
    const previous = this.transactionTail
    this.transactionTail = new Promise<void>((resolve) => { release = resolve })
    await previous
    try {
      const memory = new MemoryLearningRepository(await this.snapshot())
      await memory.initialize()
      const result = await memory.transaction(work)
      await this.replaceSnapshot(await memory.snapshot())
      await memory.close()
      return result
    } finally {
      release()
    }
  }

  async putProfile(value: LearningProfile): Promise<void> { return this.mutate((repo) => repo.putProfile(value)) }
  async getProfile(id: string): Promise<LearningProfile | undefined> { return this.read((repo) => repo.getProfile(id)) }
  async listProfiles(page?: PageRequest, includeDeleted?: boolean): Promise<Page<LearningProfile>> { return this.read((repo) => repo.listProfiles(page, includeDeleted)) }
  async hardDeleteProfile(id: string): Promise<void> { return this.mutate((repo) => repo.hardDeleteProfile(id)) }
  async putSession(value: PersistentLearningSession): Promise<void> { return this.mutate((repo) => repo.putSession(value)) }
  async getSession(id: string): Promise<PersistentLearningSession | undefined> { return this.read((repo) => repo.getSession(id)) }
  async listSessions(profileId: string, page?: PageRequest, includeArchived?: boolean): Promise<Page<PersistentLearningSession>> { return this.read((repo) => repo.listSessions(profileId, page, includeArchived)) }
  async hardDeleteSession(id: string): Promise<void> { return this.mutate((repo) => repo.hardDeleteSession(id)) }
  async appendEvents(values: PersistedLearningEvent[]): Promise<{ inserted: string[]; duplicates: string[] }> { return this.mutate((repo) => repo.appendEvents(values)) }
  async listEvents(sessionId: string, page?: PageRequest): Promise<Page<PersistedLearningEvent>> { return this.read((repo) => repo.listEvents(sessionId, page)) }
  async addEvidence(value: PersistentEvidenceRecord): Promise<void> { return this.mutate((repo) => repo.addEvidence(value)) }
  async getEvidence(id: string): Promise<PersistentEvidenceRecord | undefined> { return this.read((repo) => repo.getEvidence(id)) }
  async listEvidence(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentEvidenceRecord>> { return this.read((repo) => repo.listEvidence(profileId, competencyId, page)) }
  async addAssessment(value: PersistentAssessment): Promise<void> { return this.mutate((repo) => repo.addAssessment(value)) }
  async listAssessments(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentAssessment>> { return this.read((repo) => repo.listAssessments(profileId, competencyId, page)) }
  async putMastery(value: LearningMasteryProjection): Promise<void> { return this.mutate((repo) => repo.putMastery(value)) }
  async getMastery(profileId: string, competencyId: string): Promise<LearningMasteryProjection | undefined> { return this.read((repo) => repo.getMastery(profileId, competencyId)) }
  async listMastery(profileId: string, page?: PageRequest): Promise<Page<LearningMasteryProjection>> { return this.read((repo) => repo.listMastery(profileId, page)) }
  async clearMastery(profileId: string): Promise<void> { return this.mutate((repo) => repo.clearMastery(profileId)) }
  async putPackage(value: InstalledLearningPackage): Promise<void> { return this.mutate((repo) => repo.putPackage(value)) }
  async getPackage(id: string, version: string): Promise<InstalledLearningPackage | undefined> { return this.read((repo) => repo.getPackage(id, version)) }
  async listPackages(page?: PageRequest): Promise<Page<InstalledLearningPackage>> { return this.read((repo) => repo.listPackages(page)) }
  async removePackage(id: string, version: string): Promise<void> { return this.mutate((repo) => repo.removePackage(id, version)) }
  async addMigration(value: LearningMigrationRecord): Promise<void> { return this.mutate((repo) => repo.addMigration(value)) }
  async listMigrations(): Promise<LearningMigrationRecord[]> { return this.read((repo) => repo.listMigrations()) }
  async putBackup(value: LearningBackupRecord): Promise<void> { return this.mutate((repo) => repo.putBackup(value)) }
  async listBackups(): Promise<LearningBackupRecord[]> { return this.read((repo) => repo.listBackups()) }
  async removeBackup(id: string): Promise<void> { return this.mutate((repo) => repo.removeBackup(id)) }
  async addRecoveryLog(value: LearningRecoveryLogRecord): Promise<void> { return this.mutate((repo) => repo.addRecoveryLog(value)) }
  async listRecoveryLog(sessionId?: string): Promise<LearningRecoveryLogRecord[]> { return this.read((repo) => repo.listRecoveryLog(sessionId)) }

  private async read<T>(work: (repository: MemoryLearningRepository) => Promise<T>): Promise<T> {
    const memory = new MemoryLearningRepository(await this.snapshot())
    await memory.initialize()
    try { return await work(memory) } finally { await memory.close() }
  }

  private async mutate<T>(work: (repository: LearningRepository) => Promise<T>): Promise<T> {
    return this.transaction(work)
  }

  private requiredDatabase(): IDBDatabase {
    if (!this.database) throw new Error('IndexedDB learning repository no está inicializado.')
    return this.database
  }
}

export async function deleteIndexedDbLearningDatabase(databaseName: string, factory: IDBFactory = globalThis.indexedDB): Promise<void> {
  await requestResult(factory.deleteDatabase(databaseName))
}
