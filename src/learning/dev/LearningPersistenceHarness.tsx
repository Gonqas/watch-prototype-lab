import { useEffect, useState } from 'react'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { encodeLearningPackage, LearningPackageLoader } from '../runtime/packageLoader'
import { isNativeApp } from '../../platform/native'
import { AssessmentEngine, type CompositeAssessmentRule } from '../persistence/assessmentEngine'
import { LearningBackupManager } from '../persistence/backupManager'
import { LearningBackupScheduler, type ScheduledBackupOperations } from '../persistence/backupScheduler'
import {
  IndexedDbLearningBinaryStorage,
  NativeLearningBinaryStorage,
  type LearningBinaryStorage,
} from '../persistence/binaryStorage'
import { LearningDeletionService } from '../persistence/deletionService'
import { EvidenceProjectionEngine } from '../persistence/evidenceEngine'
import { LearningExportService } from '../persistence/exportService'
import { IndexedDbLearningRepository } from '../persistence/indexedDbRepository'
import { RuntimeEventIngestionService } from '../persistence/ingestion'
import { MasteryProjectionEngine } from '../persistence/masteryEngine'
import { LearningMigrationManager } from '../persistence/migrationManager'
import type { LearningRepositorySnapshot, PersistentLearningSession } from '../persistence/models'
import { NativeLearningBackupManager } from '../persistence/nativeBackupManager'
import { LearningPackageInstallationService } from '../persistence/packageInstallation'
import { LearningProfileService } from '../persistence/profileService'
import { LearningRecoveryService, type LearningRecoveryReport } from '../persistence/recoveryService'
import type { LearningRepository } from '../persistence/repository'
import { LearningSessionService } from '../persistence/sessionService'
import { SqliteLearningRepository } from '../persistence/sqliteRepository'
import { fingerprintTechnicalProject } from '../persistence/fingerprints'
import { useStudioStore } from '../../vnext/store'

interface HarnessContext {
  repository: LearningRepository
  storage: LearningBinaryStorage
  backups: ScheduledBackupOperations & {
    restore(recordId: string): Promise<void>
  }
  close(): Promise<void>
}

function download(bytes: Uint8Array, name: string): void {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], {
    type: 'application/vnd.watch-prototype-lab.learning+zip',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function fixturePackage(version: string): Uint8Array {
  const pack = createRuntimeLearningPackFixture()
  pack.manifest.packageVersion = version
  return encodeLearningPackage(pack, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
}

async function openContext(): Promise<HarnessContext> {
  if (isNativeApp()) {
    const repository = new SqliteLearningRepository()
    await repository.initialize()
    const storage = new NativeLearningBinaryStorage()
    const nativeBackups = new NativeLearningBackupManager()
    return {
      repository,
      storage,
      backups: {
        create: (kind, protectedBackup) => nativeBackups.create(kind, protectedBackup),
        list: () => nativeBackups.list(),
        remove: (id) => nativeBackups.remove(id),
        restore: async (id) => { await nativeBackups.restore(id) },
      },
      close: () => repository.close(),
    }
  }
  const repository = new IndexedDbLearningRepository()
  const storage = new IndexedDbLearningBinaryStorage()
  await repository.initialize()
  await storage.initialize()
  const webBackups = new LearningBackupManager(repository, storage)
  await new LearningMigrationManager(repository, { backup: webBackups }).migrate()
  return {
    repository,
    storage,
    backups: {
      create: (kind, protectedBackup) => webBackups.create(kind, protectedBackup),
      list: () => webBackups.list(),
      remove: (id) => webBackups.remove(id),
      restore: async (id) => {
        const record = (await webBackups.list()).find((candidate) => candidate.id === id)
        if (!record) throw new Error(`Backup inexistente: ${id}.`)
        await webBackups.restore(record)
      },
    },
    close: async () => {
      await repository.close()
      await storage.close()
    },
  }
}

const demonstrationRule: CompositeAssessmentRule = {
  id: 'rubric.dev.sequence',
  version: '1.0.0',
  competencyId: 'competency.follow-procedure',
  targetState: 'demonstrated',
  condition: {
    op: 'all',
    conditions: [
      { op: 'minimum-evidence', count: 1 },
      { op: 'exists', filter: { evidenceType: 'sequence', minimumConfidence: 0.8 } },
    ],
  },
}

export default function LearningPersistenceHarness() {
  const project = useStudioStore((state) => state.project)
  const [context, setContext] = useState<HarnessContext>()
  const [snapshot, setSnapshot] = useState<LearningRepositorySnapshot>()
  const [selectedProfileId, setSelectedProfileId] = useState('profile.local-default')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [profileName, setProfileName] = useState('Perfil adicional')
  const [recovery, setRecovery] = useState<LearningRecoveryReport>()
  const [status, setStatus] = useState('Inicializando persistencia…')
  const [error, setError] = useState<string>()

  const refresh = async (active = context) => {
    if (!active) return
    const next = await active.repository.snapshot()
    setSnapshot(next)
    if (!next.profiles.some(({ id }) => id === selectedProfileId)) {
      setSelectedProfileId(next.profiles[0]?.id ?? '')
    }
    if (selectedSessionId && !next.sessions.some(({ id }) => id === selectedSessionId)) {
      setSelectedSessionId('')
    }
  }

  const run = async (label: string, action: (active: HarnessContext) => Promise<void>) => {
    if (!context) return
    setError(undefined)
    try {
      await action(context)
      await refresh(context)
      setStatus(label)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  useEffect(() => {
    let disposed = false
    let opened: HarnessContext | undefined
    void (async () => {
      try {
        opened = await openContext()
        if (disposed) return void opened.close()
        await new LearningProfileService(opened.repository).ensureDefaultProfile()
        await new LearningBackupScheduler(opened.backups).runStartup()
        setContext(opened)
        setSnapshot(await opened.repository.snapshot())
        setStatus(`Backend ${opened.repository.backend} preparado`)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
      }
    })()
    return () => {
      disposed = true
      if (opened) void opened.close()
    }
  }, [])

  const currentSession = snapshot?.sessions.find(({ id }) => id === selectedSessionId)

  const install = async (active: HarnessContext, version: string) => {
    const installer = new LearningPackageInstallationService(
      active.repository,
      active.storage,
      new LearningPackageLoader({ applicationVersion: '0.4.1' }),
    )
    await installer.install(fixturePackage(version), 'integrated')
  }

  const checkpoint = async (
    active: HarnessContext,
    session: PersistentLearningSession,
    complete: boolean,
  ) => {
    const events = await active.repository.listEvents(session.id, { limit: 500 })
    await new LearningSessionService(active.repository).checkpoint(session.id, {
      schemaVersion: 1,
      packageId: session.packageId,
      packageVersion: session.packageVersion,
      sceneId: 'scene.v5-reversible',
      timelinePositionMs: complete ? 10_000 : 1_000,
      resolvedBarrierIds: complete ? ['barrier.final'] : [],
      provisionalAnswers: {},
      hintIds: [],
      educationalState: { fixture: true },
      lastPersistedSequence: events.items.at(-1)?.sequence ?? -1,
      projectFingerprint: session.currentProjectFingerprint,
      capabilities: session.initialCapabilities,
      runtimeVersion: session.runtimeVersion,
      createdAt: new Date().toISOString(),
      complete,
    })
  }

  return (
    <aside
      aria-label="Gestión de persistencia educativa"
      style={{ position: 'fixed', zIndex: 1100, inset: '70px 16px auto auto', width: 430, maxHeight: 'calc(100vh - 100px)', overflow: 'auto', padding: 14, background: '#101719f5', color: '#e8f2f2', border: '1px solid #5b7980', borderRadius: 8, font: '12px/1.45 system-ui' }}
    >
      <strong style={{ display: 'block' }}>Sistema 2 · persistencia real · DEV</strong>
      <span aria-live="polite">{status}</span>
      {error && <p role="alert" style={{ color: '#ff9b9b' }}>{error}</p>}

      <fieldset style={{ marginTop: 10 }}>
        <legend>Perfil</legend>
        <select
          aria-label="Perfil activo"
          value={selectedProfileId}
          onChange={(event) => setSelectedProfileId(event.target.value)}
        >
          {(snapshot?.profiles ?? []).map((profile) => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
        </select>
        <input aria-label="Nombre de perfil nuevo" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
        <button type="button" onClick={() => void run('Perfil creado', async ({ repository }) => {
          const created = await new LearningProfileService(repository).createProfile(profileName)
          setSelectedProfileId(created.id)
        })}>Crear</button>
      </fieldset>

      <fieldset>
        <legend>Sesión fixture</legend>
        <select
          aria-label="Sesión activa"
          value={selectedSessionId}
          onChange={(event) => setSelectedSessionId(event.target.value)}
        >
          <option value="">Selecciona sesión</option>
          {(snapshot?.sessions.filter(({ profileId }) => profileId === selectedProfileId) ?? [])
            .map((session) => <option key={session.id} value={session.id}>{session.id} · {session.state}</option>)}
        </select>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
          <button type="button" onClick={() => void run('Sesión iniciada', async (active) => {
            if (!await active.repository.getPackage('test.contract-pack', '1.0.0')) await install(active, '1.0.0')
            const service = new LearningSessionService(active.repository)
            const created = await service.create({
              profileId: selectedProfileId,
              packageId: 'test.contract-pack',
              packageVersion: '1.0.0',
              lessonId: 'lesson.test',
              activityId: 'activity.test',
              activityVersion: '1.0.0',
              rubricId: demonstrationRule.id,
              rubricVersion: demonstrationRule.version,
              reference: { kind: 'project', projectId: project.id },
              projectFingerprint: await fingerprintTechnicalProject(project),
              capabilities: ['learning.scene-runtime@1.0.0'],
              runtimeVersion: '1.0.0',
            })
            await service.transition(created.id, 'preparing')
            await service.transition(created.id, 'ready')
            await service.transition(created.id, 'active')
            await new RuntimeEventIngestionService(active.repository).ingest(created.id, [{
              eventVersion: 1,
              sequence: 0,
              type: 'scene-started',
              timestamp: new Date().toISOString(),
              sessionId: `runtime.${created.id}`,
              packageId: created.packageId,
              packageVersion: created.packageVersion,
              sceneId: 'scene.v5-reversible',
            }])
            setSelectedSessionId(created.id)
          })}>Iniciar</button>
          <button type="button" disabled={!currentSession} onClick={() => void run('Sesión pausada', async (active) => {
            if (!currentSession) return
            await checkpoint(active, currentSession, false)
            await new LearningSessionService(active.repository).transition(currentSession.id, 'paused')
          })}>Pausar</button>
          <button type="button" disabled={!currentSession} onClick={() => void run('Interrupción simulada', async (active) => {
            if (!currentSession) return
            if (!currentSession.checkpoint) await checkpoint(active, currentSession, false)
            await new LearningSessionService(active.repository).markOpenSessionsInterrupted('dev-forced-close')
          })}>Interrumpir</button>
          <button type="button" disabled={!currentSession} onClick={() => void run('Informe de recuperación generado', async (active) => {
            if (!currentSession) return
            const exactPackage = await active.repository.getPackage(currentSession.packageId, currentSession.packageVersion)
            const report = await new LearningRecoveryService(active.repository).inspect(currentSession.id, {
              packageAvailable: Boolean(exactPackage),
              exactPackageVersionAvailable: Boolean(exactPackage),
              projectAvailable: true,
              currentProjectFingerprint: await fingerprintTechnicalProject(project),
              currentCapabilities: ['learning.scene-runtime@1.0.0'],
              currentRuntimeVersion: '1.0.0',
              migrationsPending: false,
              selectorsReproducible: true,
            })
            setRecovery(report)
            if (report.resumable && ['interrupted', 'suspended', 'failed'].includes(currentSession.state)) {
              const sessions = new LearningSessionService(active.repository)
              await sessions.transition(currentSession.id, 'recovering')
              await sessions.transition(currentSession.id, 'active')
            }
          })}>Recuperar</button>
          <button type="button" disabled={!currentSession} onClick={() => void run('Sesión completada', async (active) => {
            if (!currentSession) return
            const sessions = new LearningSessionService(active.repository)
            let session = await active.repository.getSession(currentSession.id)
            if (!session) return
            if (session.state === 'paused') session = await sessions.transition(session.id, 'active')
            const existing = await active.repository.listEvents(session.id, { limit: 500 })
            const result = await new RuntimeEventIngestionService(active.repository).ingest(session.id, [{
              eventVersion: 1,
              sequence: existing.items.length,
              type: 'scene-completed',
              timestamp: new Date().toISOString(),
              sessionId: `runtime.${session.id}`,
              sceneId: 'scene.v5-reversible',
            }])
            await sessions.checkpoint(session.id, {
              schemaVersion: 1,
              packageId: session.packageId,
              packageVersion: session.packageVersion,
              sceneId: 'scene.v5-reversible',
              timelinePositionMs: 10_000,
              resolvedBarrierIds: ['barrier.final'],
              provisionalAnswers: {},
              hintIds: [],
              educationalState: { fixture: true, completed: true },
              lastPersistedSequence: result.lastPersistentSequence,
              projectFingerprint: session.currentProjectFingerprint,
              capabilities: session.initialCapabilities,
              runtimeVersion: session.runtimeVersion,
              createdAt: new Date().toISOString(),
              complete: true,
            })
            await sessions.transition(session.id, 'completed')
          })}>Completar</button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Evidencia y dominio</legend>
        <button type="button" disabled={!currentSession} onClick={() => void run('Evidencia proyectada', async ({ repository }) => {
          if (currentSession) await new EvidenceProjectionEngine(repository).projectSession(currentSession.id)
        })}>Derivar evidencia</button>
        <button type="button" onClick={() => void run('Evaluación ejecutada', async ({ repository }) => {
          await new AssessmentEngine(repository).evaluate(selectedProfileId, demonstrationRule)
        })}>Evaluar</button>
        <button type="button" onClick={() => void run('Dominio reconstruido', async ({ repository }) => {
          await new MasteryProjectionEngine(repository).rebuild(selectedProfileId)
        })}>Reconstruir dominio</button>
      </fieldset>

      <fieldset>
        <legend>Paquetes, backup y datos</legend>
        <button type="button" onClick={() => void run('Paquete 1.0.0 instalado', (active) => install(active, '1.0.0'))}>Instalar 1.0</button>
        <button type="button" onClick={() => void run('Paquete 1.1.0 instalado', (active) => install(active, '1.1.0'))}>Instalar 1.1</button>
        <button type="button" onClick={() => void run('Backup manual verificado', async ({ backups }) => { await backups.create('manual') })}>Backup</button>
        <button type="button" onClick={() => void run('Backup restaurado con copia de seguridad', async ({ backups }) => {
          const record = (await backups.list()).find(({ kind }) => kind === 'manual')
          if (!record) throw new Error('No existe backup manual.')
          await backups.restore(record.id)
        })}>Restaurar</button>
        <button type="button" onClick={() => void run('Perfil exportado', async ({ repository }) => {
          download(await new LearningExportService(repository).exportProfile({
            profileId: selectedProfileId,
            includeEvents: true,
            includeEvidence: true,
            includeAssessments: true,
            includeMastery: true,
            includePackages: true,
          }), `watchlab-learning-${selectedProfileId}.zip`)
        })}>Exportar perfil</button>
        <button type="button" disabled={!currentSession} onClick={() => void run('Sesión borrada con cascada explícita', async ({ repository }) => {
          if (!currentSession) return
          const deletion = new LearningDeletionService(repository)
          const preview = await deletion.previewSession(currentSession.id)
          if (!window.confirm(`Borrar ${preview.counts.sessions} sesión, ${preview.counts.events} eventos y ${preview.counts.evidence} evidencias?`)) return
          await deletion.execute(preview, preview.confirmationToken)
          setSelectedSessionId('')
        })}>Borrar sesión</button>
      </fieldset>

      {recovery && <details open><summary>Informe de recuperación</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(recovery, null, 2)}</pre></details>}
      <details><summary>Eventos ({snapshot?.events.length ?? 0})</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot?.events ?? [], null, 2)}</pre></details>
      <details><summary>Evidencias ({snapshot?.evidence.length ?? 0})</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot?.evidence ?? [], null, 2)}</pre></details>
      <details><summary>Evaluaciones ({snapshot?.assessments.length ?? 0})</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot?.assessments ?? [], null, 2)}</pre></details>
      <details><summary>Dominio ({snapshot?.mastery.length ?? 0})</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot?.mastery ?? [], null, 2)}</pre></details>
      <details><summary>Paquetes ({snapshot?.packages.length ?? 0})</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot?.packages ?? [], null, 2)}</pre></details>
    </aside>
  )
}

