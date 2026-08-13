import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { canonicalJson, sha256BytesFingerprint, sha256Fingerprint } from './fingerprints'
import { LearningRepositorySnapshotSchema, type LearningBackupRecord } from './models'
import type { LearningRepository } from './repository'
import type { LearningBinaryStorage } from './binaryStorage'

interface BackupManifest {
  format: 'wplab-learning-backup'
  formatVersion: 1
  backupId: string
  kind: LearningBackupRecord['kind']
  createdAt: string
  snapshotHash: `sha256:${string}`
  includes: string[]
  localPackages: Array<{ hash: `sha256:${string}`; entry: string; bytes: number }>
}

export interface LearningBackupCreateOptions {
  localPackages?: Array<{ hash: `sha256:${string}`; bytes: Uint8Array }>
}

export class LearningBackupManager {
  private readonly repository: LearningRepository
  private readonly storage: LearningBinaryStorage
  private readonly now: () => string
  private readonly idFactory: () => string

  constructor(
    repository: LearningRepository,
    storage: LearningBinaryStorage,
    now: () => string = () => new Date().toISOString(),
    idFactory: () => string = () => crypto.randomUUID(),
  ) {
    this.repository = repository
    this.storage = storage
    this.now = now
    this.idFactory = idFactory
  }

  async create(
    kind: LearningBackupRecord['kind'],
    protectedBackup = false,
    options: LearningBackupCreateOptions = {},
  ): Promise<LearningBackupRecord> {
    const snapshot = await this.repository.snapshot()
    const createdAt = this.now()
    const backupId = `backup.${this.idFactory()}`
    const snapshotHash = await sha256Fingerprint(snapshot)
    const localPackages = await Promise.all((options.localPackages ?? []).map(async ({ hash, bytes }) => {
      if (await sha256BytesFingerprint(bytes) !== hash) throw new Error(`El paquete local ${hash} no supera su verificación.`)
      return {
        hash,
        bytes: bytes.slice(),
        entry: `local-packages/${hash.slice('sha256:'.length)}.wplab-learning-pack`,
      }
    }))
    const manifest: BackupManifest = {
      format: 'wplab-learning-backup',
      formatVersion: 1,
      backupId,
      kind,
      createdAt,
      snapshotHash,
      includes: ['snapshot.json', ...localPackages.map(({ entry }) => entry)],
      localPackages: localPackages.map(({ hash, entry, bytes }) => ({ hash, entry, bytes: bytes.byteLength })),
    }
    const manifestHash = await sha256Fingerprint(manifest)
    const bytes = zipSync({
      'manifest.json': strToU8(canonicalJson(manifest)),
      'snapshot.json': strToU8(canonicalJson(snapshot)),
      ...Object.fromEntries(localPackages.map(({ entry, bytes: packageBytes }) => [entry, packageBytes])),
    }, { level: 6, mtime: new Date('1980-01-01T00:00:00.000Z') })
    const containerHash = await sha256Fingerprint([...bytes])
    await this.storage.stage(containerHash, bytes)
    const storageReference = await this.storage.commit(containerHash)
    const record: LearningBackupRecord = {
      schemaVersion: 1,
      id: backupId,
      kind,
      createdAt,
      storageReference,
      manifestHash,
      databaseHash: snapshotHash,
      verified: true,
      protected: protectedBackup,
      bytes: bytes.byteLength,
    }
    await this.repository.putBackup(record)
    return record
  }

  async verify(record: LearningBackupRecord): Promise<boolean> {
    const bytes = await this.readRecord(record)
    try {
      const files = unzipSync(bytes)
      const manifest = JSON.parse(strFromU8(files['manifest.json'])) as BackupManifest
      const snapshot = JSON.parse(strFromU8(files['snapshot.json'])) as unknown
      LearningRepositorySnapshotSchema.parse(snapshot)
      return await sha256Fingerprint(manifest) === record.manifestHash
        && await sha256Fingerprint(snapshot) === manifest.snapshotHash
        && manifest.snapshotHash === record.databaseHash
        && await Promise.all((manifest.localPackages ?? []).map(async ({ hash, entry, bytes }) =>
          files[entry]?.byteLength === bytes && await sha256BytesFingerprint(files[entry]) === hash))
          .then((results) => results.every(Boolean))
    } catch {
      return false
    }
  }

  async restore(record: LearningBackupRecord): Promise<void> {
    if (!await this.verify(record)) throw new Error(`Backup corrupto o no verificable: ${record.id}.`)
    const files = unzipSync(await this.readRecord(record))
    const manifest = JSON.parse(strFromU8(files['manifest.json'])) as BackupManifest
    const snapshot = LearningRepositorySnapshotSchema.parse(JSON.parse(strFromU8(files['snapshot.json'])))
    const safetyBackup = await this.create('pre-restore', true)
    await this.repository.replaceSnapshot(snapshot)
    for (const localPackage of manifest.localPackages ?? []) {
      await this.storage.stage(localPackage.hash, files[localPackage.entry])
      await this.storage.commit(localPackage.hash)
    }
    await this.repository.putBackup(safetyBackup)
  }

  async list(): Promise<LearningBackupRecord[]> {
    return this.repository.listBackups()
  }

  async remove(id: string): Promise<void> {
    const record = (await this.repository.listBackups()).find((candidate) => candidate.id === id)
    if (!record) return
    await this.repository.removeBackup(id)
    const hash = record.storageReference.includes('sha256/')
      ? `sha256:${record.storageReference.split('sha256/')[1]}`
      : record.storageReference.replace(/^[^:]+:/, '')
    await this.storage.remove(hash)
  }

  async rotate(): Promise<string[]> {
    const records = await this.repository.listBackups()
    const scheduled = records.filter(({ kind, protected: keep }) => !keep && (kind === 'scheduled-daily' || kind === 'scheduled-weekly'))
    const daily = uniqueBuckets(scheduled.filter(({ kind }) => kind === 'scheduled-daily'), ({ createdAt }) => createdAt.slice(0, 10), 7)
    const weekly = uniqueBuckets(scheduled.filter(({ kind }) => kind === 'scheduled-weekly'), ({ createdAt }) => isoWeek(createdAt), 4)
    const keep = new Set([...daily, ...weekly].map(({ id }) => id))
    const removed: string[] = []
    for (const record of scheduled) {
      if (keep.has(record.id)) continue
      await this.remove(record.id)
      removed.push(record.id)
    }
    return removed
  }

  private async readRecord(record: LearningBackupRecord): Promise<Uint8Array> {
    const hash = record.storageReference.includes('sha256/')
      ? `sha256:${record.storageReference.split('sha256/')[1]}`
      : record.storageReference.replace(/^[^:]+:/, '')
    const bytes = await this.storage.read(hash)
    if (!bytes) throw new Error(`No se encuentran los bytes del backup ${record.id}.`)
    return bytes
  }
}

function uniqueBuckets<T>(values: T[], bucket: (value: T) => string, limit: number): T[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = bucket(value)
    if (seen.has(key) || seen.size >= limit) return false
    seen.add(key)
    return true
  })
}

function isoWeek(value: string): string {
  const date = new Date(value)
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - start.getTime()) / 86_400_000) + start.getUTCDay() + 1) / 7)
  return `${date.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`
}
