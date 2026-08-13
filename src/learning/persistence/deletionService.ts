import { sha256Fingerprint } from './fingerprints'
import type { LearningRepositorySnapshot } from './models'
import type { LearningRepository } from './repository'

export interface LearningDeletionPreview {
  scope: 'session' | 'profile'
  targetId: string
  counts: Record<string, number>
  retainedPackageVersions: string[]
  protectedBackupIds: string[]
  confirmationToken: string
}

export class LearningDeletionService {
  private readonly repository: LearningRepository

  constructor(repository: LearningRepository) {
    this.repository = repository
  }

  async previewSession(sessionId: string): Promise<LearningDeletionPreview> {
    const snapshot = await this.repository.snapshot()
    const session = snapshot.sessions.find(({ id }) => id === sessionId)
    if (!session) throw new Error(`Sesión inexistente: ${sessionId}.`)
    const eventIds = new Set(snapshot.events.filter(({ sessionId: owner }) => owner === sessionId).map(({ id }) => id))
    const evidenceIds = new Set(snapshot.evidence.filter(({ sessionId: owner }) => owner === sessionId).map(({ id }) => id))
    const counts = {
      sessions: 1,
      events: eventIds.size,
      evidence: evidenceIds.size,
      assessments: snapshot.assessments.filter(({ evidenceIds: ids }) => ids.some((id) => evidenceIds.has(id))).length,
      mastery: snapshot.mastery.filter(({ primaryEvidenceIds }) => primaryEvidenceIds.some((id) => evidenceIds.has(id))).length,
    }
    return this.preview('session', sessionId, counts, [`${session.packageId}@${session.packageVersion}`], snapshot)
  }

  async previewProfile(profileId: string): Promise<LearningDeletionPreview> {
    const snapshot = await this.repository.snapshot()
    const sessions = snapshot.sessions.filter(({ profileId: owner }) => owner === profileId)
    if (!snapshot.profiles.some(({ id }) => id === profileId)) throw new Error(`Perfil inexistente: ${profileId}.`)
    const sessionIds = new Set(sessions.map(({ id }) => id))
    const eventIds = new Set(snapshot.events.filter(({ sessionId }) => sessionIds.has(sessionId)).map(({ id }) => id))
    const evidenceIds = new Set(snapshot.evidence.filter(({ profileId: owner }) => owner === profileId).map(({ id }) => id))
    return this.preview('profile', profileId, {
      profiles: 1,
      sessions: sessions.length,
      events: eventIds.size,
      evidence: evidenceIds.size,
      assessments: snapshot.assessments.filter(({ profileId: owner }) => owner === profileId).length,
      mastery: snapshot.mastery.filter(({ profileId: owner }) => owner === profileId).length,
    }, sessions.map(({ packageId, packageVersion }) => `${packageId}@${packageVersion}`), snapshot)
  }

  async execute(preview: LearningDeletionPreview, confirmationToken: string): Promise<void> {
    if (confirmationToken !== preview.confirmationToken) throw new Error('La confirmación no coincide con la previsualización.')
    const current = preview.scope === 'profile' ? await this.previewProfile(preview.targetId) : await this.previewSession(preview.targetId)
    if (current.confirmationToken !== confirmationToken) throw new Error('Los datos cambiaron desde la previsualización; repita la operación.')
    await this.repository.transaction(async (transaction) => {
      const snapshot = await transaction.snapshot()
      const next = this.remove(snapshot, preview)
      await transaction.replaceSnapshot(next)
    })
  }

  private async preview(
    scope: LearningDeletionPreview['scope'],
    targetId: string,
    counts: Record<string, number>,
    packageVersions: string[],
    snapshot: LearningRepositorySnapshot,
  ): Promise<LearningDeletionPreview> {
    const retainedPackageVersions = [...new Set(packageVersions)].sort()
    const protectedBackupIds = snapshot.backups.filter(({ protected: value }) => value).map(({ id }) => id)
    const basis = { scope, targetId, counts, retainedPackageVersions, protectedBackupIds, revision: snapshot.revision }
    return { ...basis, confirmationToken: await sha256Fingerprint(basis) }
  }

  private remove(snapshot: LearningRepositorySnapshot, preview: LearningDeletionPreview): LearningRepositorySnapshot {
    const next = structuredClone(snapshot)
    const sessionIds = new Set(preview.scope === 'session'
      ? [preview.targetId]
      : next.sessions.filter(({ profileId }) => profileId === preview.targetId).map(({ id }) => id))
    const eventIds = new Set(next.events.filter(({ sessionId }) => sessionIds.has(sessionId)).map(({ id }) => id))
    const evidenceIds = new Set(next.evidence.filter(({ sessionId }) => sessionIds.has(sessionId)).map(({ id }) => id))
    next.events = next.events.filter(({ id }) => !eventIds.has(id))
    next.evidence = next.evidence.filter(({ id }) => !evidenceIds.has(id))
    next.assessments = next.assessments.filter(({ evidenceIds: ids }) => !ids.some((id) => evidenceIds.has(id)))
    next.mastery = next.mastery.filter((record) =>
      preview.scope !== 'profile' ? !record.primaryEvidenceIds.some((id) => evidenceIds.has(id)) : record.profileId !== preview.targetId)
    next.recoveryLog = next.recoveryLog.filter(({ sessionId }) => !sessionId || !sessionIds.has(sessionId))
    next.sessions = next.sessions.filter(({ id }) => !sessionIds.has(id))
    if (preview.scope === 'profile') next.profiles = next.profiles.filter(({ id }) => id !== preview.targetId)
    next.revision += 1
    return next
  }
}
