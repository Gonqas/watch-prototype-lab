import {
  InstalledLearningPackageSchema,
  LearningBackupRecordSchema,
  LearningMasteryProjectionSchema,
  LearningMigrationRecordSchema,
  LearningProfileSchema,
  LearningRecoveryLogRecordSchema,
  LearningRepositorySnapshotSchema,
  PersistedLearningEventSchema,
  PersistentAssessmentSchema,
  PersistentEvidenceRecordSchema,
  PersistentLearningSessionSchema,
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
import {
  LearningRepositoryError,
  pageOf,
  type LearningRepository,
  type Page,
  type PageRequest,
} from './repository'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export class MemoryLearningRepository implements LearningRepository {
  readonly backend = 'memory' as const
  private state: LearningRepositorySnapshot
  private initialized = false
  private closed = false
  private transactionTail: Promise<void> = Promise.resolve()
  private transactionDepth = 0

  constructor(snapshot: LearningRepositorySnapshot = emptyLearningRepositorySnapshot()) {
    this.state = LearningRepositorySnapshotSchema.parse(clone(snapshot))
  }

  async initialize(): Promise<void> {
    this.assertOpen()
    this.initialized = true
  }

  async close(): Promise<void> {
    this.closed = true
  }

  async snapshot(): Promise<LearningRepositorySnapshot> {
    this.assertReady()
    return clone(this.state)
  }

  async replaceSnapshot(snapshot: LearningRepositorySnapshot): Promise<void> {
    this.assertReady()
    this.state = LearningRepositorySnapshotSchema.parse(clone(snapshot))
  }

  async transaction<T>(work: (repository: LearningRepository) => Promise<T>): Promise<T> {
    this.assertReady()
    if (this.transactionDepth > 0) return work(this)
    let release: () => void = () => undefined
    const previous = this.transactionTail
    this.transactionTail = new Promise<void>((resolve) => { release = resolve })
    await previous
    const before = clone(this.state)
    this.transactionDepth += 1
    try {
      const result = await work(this)
      this.state.revision += 1
      return result
    } catch (error) {
      this.state = before
      throw error
    } finally {
      this.transactionDepth -= 1
      release()
    }
  }

  async putProfile(input: LearningProfile): Promise<void> {
    this.assertReady()
    const profile = LearningProfileSchema.parse(clone(input))
    const existing = this.state.profiles.find(({ id }) => id === profile.id)
    if (existing && profile.recordVersion <= existing.recordVersion && !sameValue(existing, profile)) {
      throw new LearningRepositoryError('conflict', `La versión ${profile.recordVersion} de ${profile.id} no avanza el registro existente.`)
    }
    this.replaceBy(this.state.profiles, profile, ({ id }) => id === profile.id)
  }

  async getProfile(profileId: string): Promise<LearningProfile | undefined> {
    this.assertReady()
    return clone(this.state.profiles.find(({ id }) => id === profileId))
  }

  async listProfiles(page?: PageRequest, includeDeleted = false): Promise<Page<LearningProfile>> {
    this.assertReady()
    const values = this.state.profiles
      .filter(({ deletedAt }) => includeDeleted || !deletedAt)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
    return clone(pageOf(values, page))
  }

  async hardDeleteProfile(profileId: string): Promise<void> {
    this.assertReady()
    if (this.state.sessions.some(({ profileId: owner }) => owner === profileId)) {
      throw new LearningRepositoryError('constraint', 'El perfil conserva sesiones; se requiere una cascada explícita.')
    }
    this.removeWhere(this.state.profiles, ({ id }) => id === profileId)
  }

  async putSession(input: PersistentLearningSession): Promise<void> {
    this.assertReady()
    const session = PersistentLearningSessionSchema.parse(clone(input))
    if (!this.state.profiles.some(({ id }) => id === session.profileId && !this.deleted(id))) {
      throw new LearningRepositoryError('constraint', `Perfil inexistente para la sesión: ${session.profileId}.`)
    }
    const existing = this.state.sessions.find(({ id }) => id === session.id)
    if (existing && existing.profileId !== session.profileId) throw new LearningRepositoryError('conflict', 'No se puede trasladar una sesión entre perfiles.')
    this.replaceBy(this.state.sessions, session, ({ id }) => id === session.id)
  }

  async getSession(sessionId: string): Promise<PersistentLearningSession | undefined> {
    this.assertReady()
    return clone(this.state.sessions.find(({ id }) => id === sessionId))
  }

  async listSessions(profileId: string, page?: PageRequest, includeArchived = false): Promise<Page<PersistentLearningSession>> {
    this.assertReady()
    const values = this.state.sessions
      .filter((session) => session.profileId === profileId && (includeArchived || session.state !== 'archived'))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id))
    return clone(pageOf(values, page))
  }

  async hardDeleteSession(sessionId: string): Promise<void> {
    this.assertReady()
    const referenced = this.state.events.some(({ sessionId: id }) => id === sessionId)
      || this.state.evidence.some(({ sessionId: id }) => id === sessionId)
    if (referenced) throw new LearningRepositoryError('constraint', 'La sesión conserva eventos o evidencias; se requiere una cascada explícita.')
    this.removeWhere(this.state.sessions, ({ id }) => id === sessionId)
  }

  async appendEvents(inputs: PersistedLearningEvent[]): Promise<{ inserted: string[]; duplicates: string[] }> {
    this.assertReady()
    const inserted: string[] = []
    const duplicates: string[] = []
    for (const input of inputs) {
      const event = PersistedLearningEventSchema.parse(clone(input))
      if (!this.state.sessions.some(({ id }) => id === event.sessionId)) {
        throw new LearningRepositoryError('constraint', `Sesión inexistente para el evento: ${event.sessionId}.`)
      }
      const byKey = this.state.events.find((candidate) =>
        candidate.sessionId === event.sessionId && candidate.idempotencyKey === event.idempotencyKey)
      if (byKey) {
        if (!sameValue(byKey, event)) throw new LearningRepositoryError('conflict', `Colisión de idempotencia: ${event.idempotencyKey}.`)
        duplicates.push(event.id)
        continue
      }
      if (this.state.events.some((candidate) => candidate.sessionId === event.sessionId && candidate.sequence === event.sequence)) {
        throw new LearningRepositoryError('constraint', `Secuencia duplicada ${event.sequence} en ${event.sessionId}.`)
      }
      if (this.state.events.some(({ id }) => id === event.id)) throw new LearningRepositoryError('conflict', `Event ID duplicado: ${event.id}.`)
      this.state.events.push(event)
      inserted.push(event.id)
    }
    return { inserted, duplicates }
  }

  async listEvents(sessionId: string, page?: PageRequest): Promise<Page<PersistedLearningEvent>> {
    this.assertReady()
    const values = this.state.events
      .filter(({ sessionId: owner }) => owner === sessionId)
      .sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
    return clone(pageOf(values, page))
  }

  async addEvidence(input: PersistentEvidenceRecord): Promise<void> {
    this.assertReady()
    const record = PersistentEvidenceRecordSchema.parse(clone(input))
    const existing = this.state.evidence.find(({ id }) => id === record.id)
    if (existing) {
      if (sameValue(existing, record)) return
      throw new LearningRepositoryError('conflict', `La evidencia ${record.id} es inmutable.`)
    }
    if (!this.state.sessions.some(({ id }) => id === record.sessionId)) throw new LearningRepositoryError('constraint', 'La evidencia referencia una sesión inexistente.')
    const events = new Set(this.state.events.filter(({ sessionId }) => sessionId === record.sessionId).map(({ id }) => id))
    if (record.sourceEventIds.some((eventId) => !events.has(eventId))) throw new LearningRepositoryError('constraint', 'La evidencia referencia eventos inexistentes.')
    this.state.evidence.push(record)
  }

  async getEvidence(evidenceId: string): Promise<PersistentEvidenceRecord | undefined> {
    this.assertReady()
    return clone(this.state.evidence.find(({ id }) => id === evidenceId))
  }

  async listEvidence(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentEvidenceRecord>> {
    this.assertReady()
    const values = this.state.evidence
      .filter((record) => record.profileId === profileId && (!competencyId || record.competencyId === competencyId))
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt) || left.id.localeCompare(right.id))
    return clone(pageOf(values, page))
  }

  async addAssessment(input: PersistentAssessment): Promise<void> {
    this.assertReady()
    const record = PersistentAssessmentSchema.parse(clone(input))
    const existing = this.state.assessments.find(({ id }) => id === record.id)
    if (existing) {
      if (sameValue(existing, record)) return
      throw new LearningRepositoryError('conflict', `La evaluación ${record.id} es inmutable.`)
    }
    const evidence = new Set(this.state.evidence.filter(({ profileId }) => profileId === record.profileId).map(({ id }) => id))
    if (record.evidenceIds.some((evidenceId) => !evidence.has(evidenceId))) throw new LearningRepositoryError('constraint', 'La evaluación referencia evidencia inexistente.')
    this.state.assessments.push(record)
  }

  async listAssessments(profileId: string, competencyId?: string, page?: PageRequest): Promise<Page<PersistentAssessment>> {
    this.assertReady()
    const values = this.state.assessments
      .filter((record) => record.profileId === profileId && (!competencyId || record.competencyId === competencyId))
      .sort((left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt) || left.id.localeCompare(right.id))
    return clone(pageOf(values, page))
  }

  async putMastery(input: LearningMasteryProjection): Promise<void> {
    this.assertReady()
    const projection = LearningMasteryProjectionSchema.parse(clone(input))
    this.replaceBy(this.state.mastery, projection, (candidate) =>
      candidate.profileId === projection.profileId && candidate.competencyId === projection.competencyId)
  }

  async getMastery(profileId: string, competencyId: string): Promise<LearningMasteryProjection | undefined> {
    this.assertReady()
    return clone(this.state.mastery.find((record) => record.profileId === profileId && record.competencyId === competencyId))
  }

  async listMastery(profileId: string, page?: PageRequest): Promise<Page<LearningMasteryProjection>> {
    this.assertReady()
    return clone(pageOf(this.state.mastery.filter((record) => record.profileId === profileId)
      .sort((left, right) => left.competencyId.localeCompare(right.competencyId)), page))
  }

  async clearMastery(profileId: string): Promise<void> {
    this.assertReady()
    this.removeWhere(this.state.mastery, ({ profileId: owner }) => owner === profileId)
  }

  async putPackage(input: InstalledLearningPackage): Promise<void> {
    this.assertReady()
    const record = InstalledLearningPackageSchema.parse(clone(input))
    const existing = this.state.packages.find(({ packageId, version }) => packageId === record.packageId && version === record.version)
    if (existing && existing.packageHash !== record.packageHash) throw new LearningRepositoryError('conflict', 'Colisión de ID/versión de paquete.')
    this.replaceBy(this.state.packages, record, ({ packageId, version }) => packageId === record.packageId && version === record.version)
  }

  async getPackage(packageId: string, version: string): Promise<InstalledLearningPackage | undefined> {
    this.assertReady()
    return clone(this.state.packages.find((record) => record.packageId === packageId && record.version === version))
  }

  async listPackages(page?: PageRequest): Promise<Page<InstalledLearningPackage>> {
    this.assertReady()
    const values = [...this.state.packages].sort((left, right) =>
      left.packageId.localeCompare(right.packageId) || right.version.localeCompare(left.version))
    return clone(pageOf(values, page))
  }

  async removePackage(packageId: string, version: string): Promise<void> {
    this.assertReady()
    const record = this.state.packages.find((candidate) => candidate.packageId === packageId && candidate.version === version)
    if (!record) return
    const pins = this.state.sessions.filter((session) => session.packageId === packageId && session.packageVersion === version).map(({ id }) => id)
    if (!record.removable || pins.length > 0) {
      throw new LearningRepositoryError('retained-resource', 'La versión está fijada por sesiones y no puede eliminarse.', false, { sessionIds: pins })
    }
    this.removeWhere(this.state.packages, (candidate) => candidate.packageId === packageId && candidate.version === version)
  }

  async addMigration(input: LearningMigrationRecord): Promise<void> {
    this.assertReady()
    const record = LearningMigrationRecordSchema.parse(clone(input))
    const existing = this.state.migrations.find(({ version }) => version === record.version)
    if (existing && !sameValue(existing, record)) throw new LearningRepositoryError('conflict', 'Versión de migración ya aplicada con otro checksum.')
    if (!existing) this.state.migrations.push(record)
  }

  async listMigrations(): Promise<LearningMigrationRecord[]> {
    this.assertReady()
    return clone([...this.state.migrations].sort((left, right) => left.version - right.version))
  }

  async putBackup(input: LearningBackupRecord): Promise<void> {
    this.assertReady()
    const record = LearningBackupRecordSchema.parse(clone(input))
    this.replaceBy(this.state.backups, record, ({ id }) => id === record.id)
  }

  async listBackups(): Promise<LearningBackupRecord[]> {
    this.assertReady()
    return clone([...this.state.backups].sort((left, right) => right.createdAt.localeCompare(left.createdAt)))
  }

  async removeBackup(backupId: string): Promise<void> {
    this.assertReady()
    const backup = this.state.backups.find(({ id }) => id === backupId)
    if (backup?.protected) throw new LearningRepositoryError('retained-resource', 'El backup está protegido por una recuperación.')
    this.removeWhere(this.state.backups, ({ id }) => id === backupId)
  }

  async addRecoveryLog(input: LearningRecoveryLogRecord): Promise<void> {
    this.assertReady()
    const record = LearningRecoveryLogRecordSchema.parse(clone(input))
    if (this.state.recoveryLog.some(({ id }) => id === record.id)) throw new LearningRepositoryError('conflict', `Recovery log duplicado: ${record.id}.`)
    this.state.recoveryLog.push(record)
  }

  async listRecoveryLog(sessionId?: string): Promise<LearningRecoveryLogRecord[]> {
    this.assertReady()
    return clone(this.state.recoveryLog.filter((record) => !sessionId || record.sessionId === sessionId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)))
  }

  private assertOpen(): void {
    if (this.closed) throw new LearningRepositoryError('storage-unavailable', 'El repositorio está cerrado.')
  }

  private assertReady(): void {
    this.assertOpen()
    if (!this.initialized) throw new LearningRepositoryError('storage-unavailable', 'El repositorio no está inicializado.')
  }

  private deleted(profileId: string): boolean {
    return Boolean(this.state.profiles.find(({ id }) => id === profileId)?.deletedAt)
  }

  private replaceBy<T>(values: T[], value: T, predicate: (candidate: T) => boolean): void {
    const index = values.findIndex(predicate)
    if (index >= 0) values[index] = value
    else values.push(value)
  }

  private removeWhere<T>(values: T[], predicate: (candidate: T) => boolean): void {
    for (let index = values.length - 1; index >= 0; index -= 1) {
      if (predicate(values[index])) values.splice(index, 1)
    }
  }
}
