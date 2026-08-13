import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { canonicalJson, sha256Fingerprint } from './fingerprints'
import { LearningRepositorySnapshotSchema, emptyLearningRepositorySnapshot, type LearningRepositorySnapshot } from './models'
import type { LearningRepository } from './repository'

interface LearningExportManifest {
  format: 'wplab-learning-profile-export'
  formatVersion: 1
  createdAt: string
  profileId: string
  dataHash: `sha256:${string}`
  includes: string[]
  warnings: string[]
}

export interface PersistentLearningExportSelection {
  profileId: string
  sessionIds?: string[]
  includeEvents?: boolean
  includeEvidence?: boolean
  includeAssessments?: boolean
  includeMastery?: boolean
  includePackages?: boolean
  includeOwnedAssets?: boolean
}

export interface LearningImportResult {
  profileId: string
  remappedIds: Record<string, string>
  inserted: Record<string, number>
  duplicates: number
}

export class LearningExportService {
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

  async exportProfile(selection: PersistentLearningExportSelection): Promise<Uint8Array> {
    const source = await this.repository.snapshot()
    const profile = source.profiles.find(({ id }) => id === selection.profileId)
    if (!profile) throw new Error(`Perfil inexistente: ${selection.profileId}.`)
    const selectedSessionIds = new Set(selection.sessionIds ?? source.sessions.filter(({ profileId }) => profileId === profile.id).map(({ id }) => id))
    const data = emptyLearningRepositorySnapshot()
    data.profiles = [profile]
    data.sessions = source.sessions.filter(({ profileId, id }) => profileId === profile.id && selectedSessionIds.has(id))
    data.events = selection.includeEvents === false ? [] : source.events.filter(({ sessionId }) => selectedSessionIds.has(sessionId))
    data.evidence = selection.includeEvidence === false ? [] : source.evidence.filter(({ profileId, sessionId }) => profileId === profile.id && selectedSessionIds.has(sessionId))
    const evidenceIds = new Set(data.evidence.map(({ id }) => id))
    data.assessments = selection.includeAssessments === false ? [] : source.assessments.filter(({ profileId }) => profileId === profile.id)
    data.mastery = selection.includeMastery === false ? [] : source.mastery.filter(({ profileId }) => profileId === profile.id)
    const packageKeys = new Set(data.sessions.map(({ packageId, packageVersion }) => `${packageId}@${packageVersion}`))
    data.packages = selection.includePackages ? source.packages.filter(({ packageId, version }) => packageKeys.has(`${packageId}@${version}`)) : []
    data.recoveryLog = source.recoveryLog.filter(({ sessionId }) => !sessionId || selectedSessionIds.has(sessionId))
    data.assessments = data.assessments.filter(({ evidenceIds: ids }) => ids.every((id) => evidenceIds.has(id)))
    const dataHash = await sha256Fingerprint(data)
    const warnings = [
      'La exportación contiene historial educativo local.',
      ...(selection.includeOwnedAssets ? ['Los activos propios requieren revisión de privacidad y licencia.'] : []),
      'No se incluyen documentos privados, cachés ni conversaciones de tutor.',
    ]
    const manifest: LearningExportManifest = {
      format: 'wplab-learning-profile-export',
      formatVersion: 1,
      createdAt: this.now(),
      profileId: profile.id,
      dataHash,
      includes: ['learning-data.json'],
      warnings,
    }
    return zipSync({
      'manifest.json': strToU8(canonicalJson(manifest)),
      'learning-data.json': strToU8(canonicalJson(data)),
    }, { level: 6, mtime: new Date('1980-01-01T00:00:00.000Z') })
  }

  async importProfile(bytes: Uint8Array, mode: 'merge' | 'new-profile'): Promise<LearningImportResult> {
    const files = unzipSync(bytes)
    if (!files['manifest.json'] || !files['learning-data.json']) throw new Error('Exportación incompleta.')
    const manifest = JSON.parse(strFromU8(files['manifest.json'])) as LearningExportManifest
    if (manifest.format !== 'wplab-learning-profile-export' || manifest.formatVersion !== 1) throw new Error('Versión de exportación no soportada.')
    const data = LearningRepositorySnapshotSchema.parse(JSON.parse(strFromU8(files['learning-data.json'])))
    if (await sha256Fingerprint(data) !== manifest.dataHash) throw new Error('Hash de exportación incorrecto.')
    const current = await this.repository.snapshot()
    const remappedIds: Record<string, string> = {}
    const sourceProfile = data.profiles[0]
    if (!sourceProfile) throw new Error('La exportación no contiene perfil.')
    let profileId = sourceProfile.id
    if (mode === 'new-profile') {
      profileId = `profile.imported.${this.idFactory()}`
      remappedIds[sourceProfile.id] = profileId
    }
    let duplicates = current.profiles.some(({ id }) => id === profileId) ? 1 : 0
    const duplicateSessionIds = new Set<string>()
    const sessionIds = new Map<string, string>()
    for (const session of data.sessions) {
      const existing = current.sessions.find(({ id }) => id === session.id)
      const exact = mode === 'merge' && existing && canonicalJson(existing) === canonicalJson(session)
      const collision = Boolean(existing) && !exact
      const mapped = collision ? `session.imported.${this.idFactory()}` : session.id
      sessionIds.set(session.id, mapped)
      if (collision) remappedIds[session.id] = mapped
      if (exact) duplicateSessionIds.add(session.id)
    }
    const duplicateEventIds = new Set<string>()
    const eventIds = new Map<string, string>()
    for (const event of data.events) {
      const candidate = { ...event, sessionId: sessionIds.get(event.sessionId)! }
      const existing = current.events.find(({ id }) => id === event.id)
      const exact = mode === 'merge' && existing && canonicalJson(existing) === canonicalJson(candidate)
      const collision = Boolean(existing) && !exact
      const mapped = collision ? `event.imported.${this.idFactory()}` : event.id
      eventIds.set(event.id, mapped)
      if (collision) remappedIds[event.id] = mapped
      if (exact) duplicateEventIds.add(event.id)
    }
    const duplicateEvidenceIds = new Set<string>()
    const evidenceIds = new Map<string, string>()
    for (const evidence of data.evidence) {
      const existing = current.evidence.find(({ id }) => id === evidence.id)
      const exact = mode === 'merge' && existing && existing.hash === evidence.hash
      const collision = Boolean(existing) && !exact
      const mapped = collision ? `evidence.imported.${this.idFactory()}` : evidence.id
      evidenceIds.set(evidence.id, mapped)
      if (collision) remappedIds[evidence.id] = mapped
      if (exact) duplicateEvidenceIds.add(evidence.id)
    }
    const mappedEvidence = await Promise.all(data.evidence.map(async (record) => {
      const mapped = {
        ...record,
        id: evidenceIds.get(record.id)!,
        profileId,
        sessionId: sessionIds.get(record.sessionId)!,
        sourceEventIds: record.sourceEventIds.map((id) => eventIds.get(id) ?? id),
        relatedEvidenceId: record.relatedEvidenceId ? evidenceIds.get(record.relatedEvidenceId) ?? record.relatedEvidenceId : undefined,
      }
      const changed = mapped.id !== record.id
        || mapped.profileId !== record.profileId
        || mapped.sessionId !== record.sessionId
        || canonicalJson(mapped.sourceEventIds) !== canonicalJson(record.sourceEventIds)
      if (!changed) return mapped
      const withoutHash = {
        ...mapped,
        content: {
          ...mapped.content,
          importTrace: { originalEvidenceId: record.id, originalHash: record.hash },
        },
        hash: undefined,
      }
      return { ...withoutHash, hash: await sha256Fingerprint(withoutHash) }
    }))
    const duplicateAssessmentIds = new Set<string>()
    const mappedAssessments = await Promise.all(data.assessments.map(async (record) => {
      const mappedInputEvidenceIds = record.evidenceIds.map((id) => evidenceIds.get(id) ?? id)
      const existing = current.assessments.find(({ id }) => id === record.id)
      const exact = mode === 'merge' && existing
        && existing.inputHash === record.inputHash
        && canonicalJson(existing.evidenceIds) === canonicalJson(mappedInputEvidenceIds)
      if (exact) duplicateAssessmentIds.add(record.id)
      const id = existing && !exact ? `assessment.imported.${this.idFactory()}` : record.id
      if (id !== record.id) remappedIds[record.id] = id
      const changed = profileId !== record.profileId
        || id !== record.id
        || canonicalJson(mappedInputEvidenceIds) !== canonicalJson(record.evidenceIds)
      return {
        ...record,
        id,
        profileId,
        evidenceIds: mappedInputEvidenceIds,
        inputHash: changed
          ? await sha256Fingerprint({
            importedOriginalInputHash: record.inputHash,
            profileId,
            evidenceIds: mappedInputEvidenceIds,
            ruleId: record.ruleId,
            ruleVersion: record.ruleVersion,
          })
          : record.inputHash,
        recommendations: changed
          ? [...record.recommendations, `Importación trazada desde ${record.inputHash}.`]
          : record.recommendations,
      }
    }))
    const incoming: LearningRepositorySnapshot = {
      ...data,
      profiles: [{ ...sourceProfile, id: profileId, displayName: mode === 'new-profile' ? `${sourceProfile.displayName} (importado)` : sourceProfile.displayName }],
      sessions: data.sessions
        .filter(({ id }) => !duplicateSessionIds.has(id))
        .map((session) => ({ ...session, id: sessionIds.get(session.id)!, profileId, originSessionId: session.originSessionId ? sessionIds.get(session.originSessionId) ?? session.originSessionId : undefined })),
      events: data.events
        .filter(({ id }) => !duplicateEventIds.has(id))
        .map((event) => ({ ...event, id: eventIds.get(event.id)!, sessionId: sessionIds.get(event.sessionId)!, causalEventId: event.causalEventId ? eventIds.get(event.causalEventId) ?? event.causalEventId : undefined })),
      evidence: mappedEvidence.filter((record) => !duplicateEvidenceIds.has(record.id)),
      assessments: mappedAssessments.filter((record) => !duplicateAssessmentIds.has(record.id)),
      mastery: data.mastery.map((record) => ({ ...record, profileId, primaryEvidenceIds: record.primaryEvidenceIds.map((id) => evidenceIds.get(id) ?? id), retentionEvidenceIds: record.retentionEvidenceIds.map((id) => evidenceIds.get(id) ?? id) })),
      recoveryLog: data.recoveryLog.map((record) => ({ ...record, id: current.recoveryLog.some(({ id }) => id === record.id) ? `recovery.imported.${this.idFactory()}` : record.id, sessionId: record.sessionId ? sessionIds.get(record.sessionId) ?? record.sessionId : undefined })),
    }
    duplicates += duplicateSessionIds.size + duplicateEventIds.size + duplicateEvidenceIds.size + duplicateAssessmentIds.size
    await this.repository.transaction(async (transaction) => {
      const existingProfile = await transaction.getProfile(profileId)
      if (!existingProfile) await transaction.putProfile(incoming.profiles[0])
      for (const session of incoming.sessions) await transaction.putSession(session)
      const eventResult = await transaction.appendEvents(incoming.events)
      duplicates += eventResult.duplicates.length
      for (const record of incoming.evidence) await transaction.addEvidence(record)
      for (const record of incoming.assessments) await transaction.addAssessment(record)
      for (const record of incoming.mastery) await transaction.putMastery(record)
      for (const record of incoming.packages) await transaction.putPackage(record)
      for (const record of incoming.recoveryLog) await transaction.addRecoveryLog(record)
      await transaction.addRecoveryLog({
        schemaVersion: 1,
        id: `recovery.import.${this.idFactory()}`,
        action: 'import-profile',
        outcome: 'completed',
        details: { sourceProfileId: sourceProfile.id, targetProfileId: profileId, mode, remappedIds },
        createdAt: this.now(),
      })
    })
    return {
      profileId,
      remappedIds,
      duplicates,
      inserted: {
        profiles: current.profiles.some(({ id }) => id === profileId) ? 0 : incoming.profiles.length,
        sessions: incoming.sessions.length,
        events: incoming.events.length,
        evidence: incoming.evidence.length,
        assessments: incoming.assessments.length,
        mastery: incoming.mastery.length,
      },
    }
  }
}
