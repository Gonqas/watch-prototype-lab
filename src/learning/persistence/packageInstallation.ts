import { compareSemVer, satisfiesSemVerRange } from '../runtime/semver'
import type { LearningPackageLoader, LearningPackageOrigin } from '../runtime/packageLoader'
import type { InstalledLearningPackage } from './models'
import type { LearningRepository } from './repository'
import type { LearningBinaryStorage } from './binaryStorage'

export class LearningPackageInstallationService {
  private readonly repository: LearningRepository
  private readonly storage: LearningBinaryStorage
  private readonly loader: LearningPackageLoader
  private readonly now: () => string

  constructor(
    repository: LearningRepository,
    storage: LearningBinaryStorage,
    loader: LearningPackageLoader,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.repository = repository
    this.storage = storage
    this.loader = loader
    this.now = now
  }

  async install(bytes: Uint8Array, origin: LearningPackageOrigin): Promise<InstalledLearningPackage> {
    const loaded = await this.loader.loadFromBytes(bytes, origin)
    if (!loaded.success) throw new Error(loaded.diagnostics.map(({ message }) => message).join(' '))
    const hash = loaded.value.packageFingerprint as `sha256:${string}`
    const manifest = loaded.value.pack.manifest
    const alreadyCommitted = Boolean(await this.storage.read(hash))
    await this.storage.stage(hash, bytes)
    try {
      const installed = (await this.repository.listPackages({ limit: 500 })).items.filter(({ status }) => status === 'active' || status === 'retained')
      const resolvedDependencies = manifest.dependencies.map((dependency) => {
        const compatible = installed
          .filter(({ packageId, version }) => packageId === dependency.packageId && satisfiesSemVerRange(version, dependency.versionRange))
          .sort((left, right) => compareSemVer(right.version, left.version))[0]
        if (!compatible) throw new Error(`Dependencia ausente: ${dependency.packageId}@${dependency.versionRange}.`)
        return { packageId: compatible.packageId, version: compatible.version }
      })
      const timestamp = this.now()
      const staged: InstalledLearningPackage = {
        schemaVersion: 1,
        packageId: manifest.id,
        version: manifest.packageVersion,
        origin,
        packageHash: hash,
        manifest: structuredClone(manifest),
        status: 'staged',
        installedAt: timestamp,
        verifiedAt: timestamp,
        storageReference: `staging:${hash}`,
        resolvedDependencies,
        pinnedSessionIds: [],
        removable: true,
      }
      await this.repository.putPackage(staged)
      const storageReference = await this.storage.commit(hash)
      const active = { ...staged, status: 'active' as const, storageReference }
      await this.repository.putPackage(active)
      return active
    } catch (error) {
      await this.storage.rollback(hash)
      if (!alreadyCommitted) await this.storage.remove(hash)
      const failed = await this.repository.getPackage(loaded.value.pack.manifest.id, loaded.value.pack.manifest.packageVersion)
      if (failed?.status === 'staged') await this.repository.removePackage(failed.packageId, failed.version)
      throw error
    }
  }

  async refreshPins(): Promise<InstalledLearningPackage[]> {
    return this.repository.transaction(async (transaction) => {
      const packages = (await transaction.listPackages({ limit: 500 })).items
      const profiles = (await transaction.listProfiles({ limit: 500 }, true)).items
      const sessions = (await Promise.all(profiles.map(({ id }) => transaction.listSessions(id, { limit: 500 }, true))))
        .flatMap(({ items }) => items)
      const updated: InstalledLearningPackage[] = []
      for (const installed of packages) {
        const pins = sessions.filter((session) =>
          session.packageId === installed.packageId && session.packageVersion === installed.version).map(({ id }) => id).sort()
        const record = {
          ...installed,
          pinnedSessionIds: pins,
          removable: pins.length === 0,
          status: pins.length > 0 && installed.status === 'active' ? 'retained' as const : installed.status,
          retentionReason: pins.length > 0 ? `Fijado por ${pins.length} sesiones.` : undefined,
        }
        await transaction.putPackage(record)
        updated.push(record)
      }
      return updated
    })
  }

  async uninstall(packageId: string, version: string): Promise<void> {
    const record = await this.repository.getPackage(packageId, version)
    if (!record) return
    await this.refreshPins()
    await this.repository.removePackage(packageId, version)
    await this.storage.remove(record.packageHash)
  }
}
