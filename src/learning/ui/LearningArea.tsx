import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import type { WatchProject } from '../../vnext/model'
import { clearLearningChunkRecovery, writeUxSession } from '../academy/academyEntryRecovery'
import { LearningApplicationService } from '../application/service'
import { learningHref } from '../application/navigation'
import { learningMessage, normalizeLearningLocale } from '../application/i18n'
import { LearningContext } from './LearningContext'
import './learning.css'

const AcademyShell = lazy(() => import('./AcademyShell').then((module) => ({ default: module.AcademyShell })))

function LearningLoading({ label, onExit }: { label: string; onExit: () => void }) {
  return (
    <div className="academy-loading academy-loading--entry" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={22} />
      <div><strong>{label}</strong><span>Verificando perfil, contenido y almacenamiento local.</span></div>
      <button type="button" onClick={onExit}>Volver a Estudio</button>
    </div>
  )
}

function LearningFatalView({
  service,
  onExit,
  onRetry,
}: {
  service: LearningApplicationService
  onExit: () => void
  onRetry: () => void
}) {
  const snapshot = service.snapshot()
  return (
    <main className="learning-fatal" id="learning-main" tabIndex={-1}>
      <TriangleAlert size={30} />
      <h1>{snapshot.error?.message ?? 'Academia no está disponible'}</h1>
      <p>{snapshot.error?.recovery}</p>
      <p>El proyecto técnico, el progreso, las evidencias, las sesiones y las notas se conservan.</p>
      <div className="learning-inline-actions">
        <button type="button" onClick={onRetry}>Volver a intentar</button>
        <button type="button" onClick={onExit}>Volver a Estudio</button>
        <button type="button" onClick={() => void service.copyDiagnostic()}>Copiar informe</button>
      </div>
      <details>
        <summary>Abrir diagnóstico técnico · {snapshot.error?.id}</summary>
        <pre>{snapshot.error?.technical}</pre>
      </details>
    </main>
  )
}

export function LearningArea({
  project,
  onExit,
  onRetry,
  appVersion,
}: {
  project: WatchProject
  onExit: () => void
  onRetry: () => void
  appVersion: string
}) {
  const [service] = useState(() => new LearningApplicationService(project))
  const shutdownTimer = useRef<number | undefined>(undefined)
  const snapshot = useSyncExternalStore(service.subscribe, service.snapshot, service.snapshot)
  const context = useMemo(() => ({ service, snapshot }), [service, snapshot])

  useEffect(() => {
    if (shutdownTimer.current !== undefined) {
      window.clearTimeout(shutdownTimer.current)
      shutdownTimer.current = undefined
    }
    void service.initialize()
    const updateOnline = () => service.setOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      shutdownTimer.current = window.setTimeout(() => void service.shutdown(), 0)
    }
  }, [service])

  useEffect(() => {
    if (snapshot.location.surface !== 'not-found') {
      writeUxSession('wplab.learning.last-location', learningHref(snapshot.location))
    }
  }, [snapshot.location])

  useEffect(() => {
    if (snapshot.status === 'ready') clearLearningChunkRecovery(appVersion)
  }, [appVersion, snapshot.status])

  useEffect(() => {
    const locale = normalizeLearningLocale(snapshot.profile?.locale)
    window.dispatchEvent(new CustomEvent('wplab-learning-locale', { detail: locale }))
    document.documentElement.lang = locale.startsWith('en') ? 'en' : 'es'
  }, [snapshot.profile?.locale])

  const textScale = Math.max(1, snapshot.profile?.accessibility.textScale ?? 1)
  return (
    <LearningContext.Provider value={context}>
      <section
        className={`learning-area ${snapshot.profile?.accessibility.contrast === 'high' ? 'is-high-contrast' : ''} ${snapshot.profile?.accessibility.reducedMotion ? 'is-reduced-motion' : ''} ${snapshot.profile?.accessibility.readLabels ? 'is-label-priority' : ''} ${textScale >= 1.2 ? 'is-large-text' : ''} ${textScale >= 1.45 ? 'is-very-large-text' : ''}`}
        style={{ '--learning-text-scale': textScale } as CSSProperties}
        data-text-scale={textScale.toFixed(2)}
        aria-label={learningMessage(snapshot.profile?.locale, 'area')}
      >
        <a
          className="learning-skip-link"
          href="#learning-main"
          onClick={(event) => {
            event.preventDefault()
            document.getElementById('learning-main')?.focus()
          }}
        >
          Saltar al contenido de Academia
        </a>
        <div className="learning-live-region" aria-live="polite" aria-atomic="true">
          {snapshot.preflight?.status === 'blocked' ? 'La actividad no puede comenzar.' : ''}
        </div>
        {snapshot.status === 'initializing' && <LearningLoading label="Preparando la Academia" onExit={onExit} />}
        {snapshot.status === 'error' && <LearningFatalView service={service} onExit={onExit} onRetry={onRetry} />}
        {snapshot.status === 'ready' && (
          <Suspense fallback={<LearningLoading label="Preparando la Academia" onExit={onExit} />}>
            <AcademyShell onExit={onExit} />
          </Suspense>
        )}
      </section>
    </LearningContext.Provider>
  )
}
