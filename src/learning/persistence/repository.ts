import type {
  InstalledLearningPackage,
  LearningBackupRecord,
  LearningMasteryProjection,
  LearningMigrationRecord,
  LearningProfile,
  LearningRecoveryLogRecord,
  LearningRepositorySnapshot,
  PersistedLearningEvent,
  PersistentAssessment,
  PersistentEvidenceRecord,
  PersistentLearningSession,
} from './models'

export type LearningRepositoryErrorCode =
  | 'not-found'
  | 'conflict'
  | 'constraint'
  | 'invalid-transition'
  | 'future-version'
  | 'transaction-failed'
  | 'storage-unavailable'
  | 'corrupt-data'
  | 'retained-resource'

export class LearningRepositoryError extends Error {
  readonly code: LearningRepositoryErrorCode
  readonly retryable: boolean
  readonly details?: Record<string, unknown>

  constructor(code: LearningRepositoryErrorCode, message: string, retryable = false, details?: Record<string, unknown>) {
    super(message)
    this.name = 'LearningRepositoryError'
    this.code = code
    this.retryable = retryable
    this.details = details
  }
}

export interface PageRequest {
  offset?: number
  limit?: number
}

export interface Page<T> {
  items: T[]
  offset: number
  limit: number
  total: number
}

export interface LearningProfileRepository {
  putProfile(profile: LearningProfile): Promise<void>
  getProfile(profileId: string): Promise<LearningProfile | undefined>
  listProfiles(page?: PageRequest, includeDeleted?: boolean): Promise<Page<LearningProfile>>
  hardDeleteProfile(profileId: string): Promise<void>
}

export interface LearningSessionRepository {
  putSession(session: PersistentLearningSession): Promise<void>
  getSession(sessionId: string): Promise<PersistentLearningSession | undefined>
  listSessions(profileId: string, page?: PageRequest, includeArchived?: boolean): Promise<Page<PersistentLearningSession>>
  hardDeleteSession(sessionId: string): Promise<void>
}

export interface LearningEventStore {
  appendEvents(events: PersistedLearningEvent[]): Promise<{ inserted: string[]; duplicates: string[] }>
  listEvents(sessionId: string, page?: PageRequest): Promise<Page<PersistedLearningEvent>>
}

export interface LearningEvidenceRepository {
  addEvidence(record: PersistentEvidenceRecord): Promise<void>
  getEvidence(evidenceId: string): Promise<PersistentEvidenceRecord | undefined>
  listEvidence(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentEvidenceRecord>>
}

export interface LearningAssessmentRepository {
  addAssessment(record: PersistentAssessment): Promise<void>
  listAssessments(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentAssessment>>
}

export interface LearningMasteryRepository {
  putMastery(projection: LearningMasteryProjection): Promise<void>
  getMastery(profileId: string, competencyId: string): Promise<LearningMasteryProjection | undefined>
  listMastery(profileId: string, page?: PageRequest): Promise<Page<LearningMasteryProjection>>
  clearMastery(profileId: string): Promise<void>
}

export interface LearningPackageInstallationRepository {
  putPackage(record: InstalledLearningPackage): Promise<void>
  getPackage(packageId: string, version: string): Promise<InstalledLearningPackage | undefined>
  listPackages(page?: PageRequest): Promise<Page<InstalledLearningPackage>>
  removePackage(packageId: string, version: string): Promise<void>
}

export interface LearningOperationalRepository {
  addMigration(record: LearningMigrationRecord): Promise<void>
  listMigrations(): Promise<LearningMigrationRecord[]>
  putBackup(record: LearningBackupRecord): Promise<void>
  listBackups(): Promise<LearningBackupRecord[]>
  removeBackup(backupId: string): Promise<void>
  addRecoveryLog(record: LearningRecoveryLogRecord): Promise<void>
  listRecoveryLog(sessionId?: string): Promise<LearningRecoveryLogRecord[]>
}

export interface LearningTransactionManager {
  transaction<T>(work: (repository: LearningRepository) => Promise<T>): Promise<T>
}

export interface LearningRepository
  extends LearningProfileRepository,
  LearningSessionRepository,
  LearningEventStore,
  LearningEvidenceRepository,
  LearningAssessmentRepository,
  LearningMasteryRepository,
  LearningPackageInstallationRepository,
  LearningOperationalRepository,
  LearningTransactionManager {
  readonly backend: 'memory' | 'indexeddb' | 'sqlite'
  initialize(): Promise<void>
  snapshot(): Promise<LearningRepositorySnapshot>
  replaceSnapshot(snapshot: LearningRepositorySnapshot): Promise<void>
  close(): Promise<void>
}

export function pageOf<T>(values: T[], request: PageRequest = {}): Page<T> {
  const offset = Math.max(0, request.offset ?? 0)
  const limit = Math.min(500, Math.max(1, request.limit ?? 50))
  return { items: values.slice(offset, offset + limit), offset, limit, total: values.length }
}
