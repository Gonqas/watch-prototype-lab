import { describe, expect, it } from 'vitest'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { encodeLearningPackage, LearningPackageLoader } from '../runtime/packageLoader'
import { LearningBackupManager } from './backupManager'
import { MemoryLearningBinaryStorage } from './binaryStorage'
import { LearningDeletionService } from './deletionService'
import { LearningExportService } from './exportService'
import { sha256BytesFingerprint } from './fingerprints'
import { MemoryLearningRepository } from './memoryRepository'
import { LearningPackageInstallationService } from './packageInstallation'
import { eventFixture, profileFixture, sessionFixture } from './testFixtures'

async function repository() {
  const repo = new MemoryLearningRepository()
  await repo.initialize()
  return repo
}

function packageBytes(version = '1.0.0', dependencies: Array<{ packageId: string; versionRange: string }> = []) {
  const pack = createRuntimeLearningPackFixture()
  pack.manifest.packageVersion = version
  pack.manifest.dependencies = dependencies
  return encodeLearningPackage(pack, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
}

describe('persistent package, backup, export and deletion operations', () => {
  it('installs two verified package versions atomically and preserves both', async () => {
    const repo = await repository()
    const storage = new MemoryLearningBinaryStorage()
    const installer = new LearningPackageInstallationService(repo, storage, new LearningPackageLoader({ applicationVersion: '0.4.1' }), () => '2026-07-23T09:00:00.000Z')
    await installer.install(packageBytes('1.0.0'), 'integrated')
    await installer.install(packageBytes('1.1.0'), 'integrated')
    expect((await repo.listPackages()).items.map(({ version }) => version).sort()).toEqual(['1.0.0', '1.1.0'])
  })

  it('rolls back staging when a dependency is missing', async () => {
    const repo = await repository()
    const storage = new MemoryLearningBinaryStorage()
    const installer = new LearningPackageInstallationService(repo, storage, new LearningPackageLoader({ applicationVersion: '0.4.1' }))
    await expect(installer.install(packageBytes('1.0.0', [{ packageId: 'missing.pack', versionRange: '^1.0.0' }]), 'integrated')).rejects.toThrow(/Dependencia ausente/)
    expect((await repo.listPackages()).total).toBe(0)
  })

  it('retains a package version pinned by a historical session', async () => {
    const repo = await repository()
    const storage = new MemoryLearningBinaryStorage()
    const installer = new LearningPackageInstallationService(repo, storage, new LearningPackageLoader({ applicationVersion: '0.4.1' }))
    await installer.install(packageBytes(), 'integrated')
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    await installer.refreshPins()
    await expect(installer.uninstall('test.contract-pack', '1.0.0')).rejects.toMatchObject({ code: 'retained-resource' })
  })

  it('creates, verifies and restores a real backup container', async () => {
    const repo = await repository()
    const storage = new MemoryLearningBinaryStorage()
    await repo.putProfile(profileFixture())
    const backups = new LearningBackupManager(repo, storage, () => '2026-07-23T09:00:00.000Z', () => 'fixed')
    const backup = await backups.create('manual')
    expect(await backups.verify(backup)).toBe(true)
    await repo.putProfile(profileFixture('profile.extra'))
    expect((await repo.listProfiles()).total).toBe(2)
    await backups.restore(backup)
    expect((await repo.listProfiles()).items.map(({ id }) => id)).toEqual(['profile.local-default'])
  })

  it('rejects a corrupted backup', async () => {
    const repo = await repository()
    const storage = new MemoryLearningBinaryStorage()
    const backups = new LearningBackupManager(repo, storage, () => '2026-07-23T09:00:00.000Z', () => 'fixed')
    const backup = await backups.create('manual')
    const hash = `sha256:${backup.storageReference.split('sha256/')[1]}`
    await storage.remove(hash)
    await expect(backups.restore(backup)).rejects.toThrow(/bytes/)
  })

  it('optionally protects and restores a non-recoverable local package by hash', async () => {
    const repo = await repository()
    const storage = new MemoryLearningBinaryStorage()
    const backups = new LearningBackupManager(repo, storage, () => '2026-07-23T09:00:00.000Z', () => 'local')
    const bytes = new TextEncoder().encode('paquete privado local')
    const hash = await sha256BytesFingerprint(bytes)
    const backup = await backups.create('manual', false, { localPackages: [{ hash, bytes }] })
    expect(await backups.verify(backup)).toBe(true)
    expect(await storage.read(hash)).toBeUndefined()
    await backups.restore(backup)
    expect(await storage.read(hash)).toEqual(bytes)
  })

  it('round-trips an exported profile and remaps collisions traceably', async () => {
    const source = await repository()
    await source.putProfile(profileFixture())
    await source.putSession(sessionFixture())
    await source.appendEvents([eventFixture(0)])
    const bytes = await new LearningExportService(source, () => '2026-07-23T09:00:00.000Z').exportProfile({
      profileId: 'profile.local-default',
      includeEvents: true,
    })
    const target = await repository()
    await target.putProfile(profileFixture())
    const imported = await new LearningExportService(target, () => '2026-07-23T09:00:00.000Z', () => 'remapped').importProfile(bytes, 'new-profile')
    expect(imported.profileId).toBe('profile.imported.remapped')
    expect((await target.listSessions(imported.profileId)).total).toBe(1)
  })

  it('previews explicit cascade consequences and rejects stale confirmation', async () => {
    const repo = await repository()
    await repo.putProfile(profileFixture())
    await repo.putSession(sessionFixture())
    await repo.appendEvents([eventFixture(0)])
    const deletion = new LearningDeletionService(repo)
    const preview = await deletion.previewSession('session.test')
    expect(preview.counts).toMatchObject({ sessions: 1, events: 1 })
    await expect(deletion.execute(preview, 'wrong')).rejects.toThrow(/confirmación/)
    await deletion.execute(preview, preview.confirmationToken)
    expect((await repo.listSessions('profile.local-default', undefined, true)).total).toBe(0)
  })
})
