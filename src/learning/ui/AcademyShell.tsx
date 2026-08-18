import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type RefObject,
} from 'react'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  LoaderCircle,
  Search,
  TriangleAlert,
} from 'lucide-react'
import { currentAcademyRoute } from '../academy/academyCatalog'
import { ACADEMY_LEARNER_PATH, academyPathLocationForLesson } from '../academy/path/academyLearnerPath'
import { academyNextAction, type AcademyNextAction } from '../academy/path/academyNextAction'
import { deriveAcademyPathProgress, type AcademyPathProgress } from '../academy/path/academyPathProgress'
import { readUxSession, writeUxSession } from '../academy/academyEntryRecovery'
import { useAcademyLocalState } from '../academy/useAcademyLocalState'
import {
  type LearningSurface,
} from '../application/navigation'
import {
  localize,
  learningMessage,
  type LearningMessageKey,
} from '../application/i18n'
import { useLearning } from './LearningContext'
import { AcademySurfaceBoundary } from './AcademySurfaceBoundary'
import { AcademyPrimaryNavigation } from './library/AcademyPrimaryNavigation'
import { friendlyLearningTerm, friendlyRecommendationReason } from './learningUiLanguage'
import './academy.css'

const LearningSurfaces = lazy(() => import('./LearningSurfaces').then((module) => ({ default: module.LearningSurfaces })))
const LearningMapSurface = lazy(() => import('./LearningMapSurface').then((module) => ({ default: module.LearningMapSurface })))
const LearningActivityWorkspace = lazy(() => import('./LearningActivityWorkspace').then((module) => ({ default: module.LearningActivityWorkspace })))

function AcademyContextPanel({
  onClose,
  drawer,
  panelRef,
  closeButtonRef,
  nextAction,
  pathProgress,
}: {
  onClose: () => void
  drawer: boolean
  panelRef: RefObject<HTMLElement | null>
  closeButtonRef: RefObject<HTMLButtonElement | null>
  nextAction: AcademyNextAction
  pathProgress: AcademyPathProgress
}) {
  const { service, snapshot } = useLearning()
  const route = currentAcademyRoute(snapshot)
  const lessonLocation = snapshot.location.surface === 'lesson' && snapshot.location.id
    ? academyPathLocationForLesson(snapshot.location.id)
    : undefined
  const currentStage = ACADEMY_LEARNER_PATH.stages.find(({ stageId }) => stageId === pathProgress.currentStageId)
  const currentChapter = ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === pathProgress.currentChapterId)
  return (
    <aside
      className="academy-context-panel"
      aria-label="Contexto educativo"
      aria-labelledby="academy-context-title"
      aria-modal={drawer || undefined}
      role={drawer ? 'dialog' : undefined}
      ref={panelRef}
    >
      <header>
        <div><span>CONTEXTO</span><strong id="academy-context-title">{route ? 'Ruta en curso' : 'Academia local'}</strong></div>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar contexto"><ChevronRight size={17} /></button>
      </header>
      <section>
        <span className="academy-kicker">POSICIÓN EN LA RUTA</span>
        <h2>{lessonLocation
          ? `Etapa ${lessonLocation.stage.order} · ${lessonLocation.chapter.title}`
          : currentStage ? `Etapa ${currentStage.order} · ${currentStage.shortTitle}` : 'Recorrido disponible completado'}</h2>
        <p>{lessonLocation && snapshot.location.id
          ? `${lessonLocation.stage.title} > ${lessonLocation.chapter.title} > ${localize(snapshot.profile?.locale, snapshot.product.lessons.find(({ id }) => id === snapshot.location.id)?.title ?? { es: snapshot.location.id })}`
          : currentChapter?.title ?? 'Queda cobertura planificada o pendiente de revisión.'}</p>
        <a href={lessonLocation ? `#/learning/my-learning?chapter=${encodeURIComponent(lessonLocation.chapter.chapterId)}` : '#/learning/my-learning'} onClick={drawer ? onClose : undefined}>Ver en Mi ruta</a>
      </section>
      <section data-next-action-id={nextAction.actionId}>
        <span className="academy-kicker">SIGUIENTE ACCIÓN</span>
        <h2>{nextAction.title}</h2>
        <p>{nextAction.reason}</p>
        <a className="academy-inline-action" href={nextAction.href} onClick={drawer ? onClose : undefined}>{nextAction.ctaLabel}</a>
        <details><summary>Por qué es el siguiente paso</summary><p>{nextAction.after}</p></details>
      </section>
      {route && (
        <section>
          <span className="academy-kicker">PROCEDENCIA DEL CATÁLOGO</span>
          <h2>{localize(snapshot.profile?.locale, route.title)}</h2>
          <p>{friendlyRecommendationReason(localize(snapshot.profile?.locale, route.purpose))}</p>
          <a href={`#/learning/route/${encodeURIComponent(route.id)}`} onClick={drawer ? onClose : undefined}>Ver estructura</a>
        </section>
      )}
      {snapshot.recommendations.length > 0 && <section className="academy-context-suggestions"><span className="academy-kicker">SUGERENCIAS DE BIBLIOTECA</span><p>Son consultas opcionales y nunca sustituyen la siguiente acción principal.</p><details><summary>Ver sugerencias</summary>{snapshot.recommendations.slice(0, 3).map((recommendation) => <a href={recommendation.href} key={`${recommendation.href}:${recommendation.title}`} onClick={drawer ? onClose : undefined}>{recommendation.title}</a>)}</details></section>}
      <section>
        <span className="academy-kicker">DISPONIBILIDAD</span>
        <h2>Tu Academia está en este equipo</h2>
        <p>{snapshot.online ? 'Puedes seguir estudiando aunque pierdas la conexión.' : 'Estás sin conexión; el contenido instalado sigue disponible.'}</p>
        <details>
          <summary>Cómo se guarda</summary>
          <p>{snapshot.backend === 'sqlite' ? 'La aplicación de escritorio usa una base de datos local.' : 'El navegador usa almacenamiento local.'}</p>
        </details>
      </section>
      {snapshot.notifications.slice(0, 2).map((notification) => {
        const activity = snapshot.product.activities.find(({ id }) => notification.detail.includes(id))
        const detail = activity
          ? notification.detail.replace(activity.id, localize(snapshot.profile?.locale, activity.title))
          : friendlyRecommendationReason(notification.detail)
        return (
          <section className={`academy-context-notice is-${notification.severity}`} key={notification.id}>
            <span className="academy-kicker">{friendlyLearningTerm(notification.origin)}</span>
            <h2>{notification.title}</h2>
            <p>{detail}</p>
            <div>
              <a href={notification.href} onClick={drawer ? onClose : undefined}>Abrir</a>
              {!notification.read && <button type="button" onClick={() => void service.markNotificationRead(notification.id)}>Marcar leída</button>}
            </div>
          </section>
        )
      })}
    </aside>
  )
}

function AcademyTopbar({
  contextOpen,
  onOpenContext,
  contextTriggerRef,
}: {
  contextOpen: boolean
  onOpenContext: () => void
  contextTriggerRef: RefObject<HTMLButtonElement | null>
}) {
  const { service, snapshot } = useLearning()
  const [query, setQuery] = useState('')
  const unread = snapshot.notifications.filter(({ read }) => !read).length
  const submit = (event: FormEvent) => {
    event.preventDefault()
    service.navigate({ surface: 'search', query: query.trim() ? { q: query.trim() } : {} })
  }
  return (
    <header className="academy-topbar">
      <div className="academy-topbar__location">
        <strong>{learningMessage(snapshot.profile?.locale, surfaceMessage(snapshot.location.surface))}</strong>
      </div>
      <form className="academy-global-search" role="search" onSubmit={submit}>
        <Search size={16} />
        <label className="sr-only" htmlFor="academy-global-search">Buscar en Academia</label>
        <input
          id="academy-global-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar lecciones, piezas, términos o notas"
        />
        <kbd>Enter</kbd>
      </form>
      <div className="academy-topbar__actions">
        <span className={`academy-online-state ${snapshot.online ? 'is-online' : ''}`}>
          <i />{snapshot.online ? 'Local · con conexión' : 'Local · sin conexión'}
        </span>
        {!contextOpen && <button ref={contextTriggerRef} className="academy-context-trigger" type="button" onClick={onOpenContext} aria-label="Abrir ayuda y siguiente paso" title="Ayuda y siguiente paso"><ChevronLeft size={17} /></button>}
        <button type="button" onClick={() => service.navigate({ surface: 'profile', id: snapshot.profile?.id, query: { panel: 'notifications' } })} aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}>
          <Bell size={17} />{unread > 0 && <i>{unread}</i>}
        </button>
        <a href="#/learning/profile" aria-label="Perfil local"><CircleUserRound size={18} /><span>{snapshot.profile?.displayName}</span></a>
      </div>
    </header>
  )
}

function surfaceMessage(surface: LearningSurface): LearningMessageKey {
  const messages: Partial<Record<LearningSurface, LearningMessageKey>> = {
    home: 'home',
    'my-learning': 'myLearning',
    explore: 'explore',
    map: 'map',
    workshop: 'workshop',
    engineering: 'engineering',
    metrology: 'metrology',
    atlas: 'atlas',
    review: 'review',
    search: 'search',
    notebook: 'notebook',
    glossary: 'glossary',
    sources: 'sources',
    sessions: 'sessions',
    progress: 'progress',
    history: 'history',
    content: 'content',
    profile: 'profile',
    preferences: 'preferences',
  }
  return messages[surface] ?? 'area'
}

function AcademyLoading({ label }: { label: string }) {
  return <div className="academy-loading" role="status"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>
}

export function AcademyShell({ onExit }: { onExit: () => void }) {
  const { service, snapshot } = useLearning()
  const persistedAcademyState = snapshot.profile?.educationalPreferences.academyStateV1
  const { state, actions, recovery } = useAcademyLocalState(
    snapshot.profile?.id,
    persistedAcademyState,
  )
  const academyStateRef = useRef(state)
  const [persistenceWarning, setPersistenceWarning] = useState<string>()
  const mainRef = useRef<HTMLElement>(null)
  const contextPanelRef = useRef<HTMLElement>(null)
  const contextCloseRef = useRef<HTMLButtonElement>(null)
  const contextTriggerRef = useRef<HTMLButtonElement>(null)
  const [compact, setCompact] = useState(
    () => readUxSession('wplab.academy.nav-compact') === 'true',
  )
  const [contextOpen, setContextOpen] = useState(
    () => window.innerWidth > 1060
      && readUxSession('wplab.academy.context-open') === 'true',
  )
  const [contextDrawer, setContextDrawer] = useState(() => window.innerWidth <= 1060)
  const density = state?.preferences.density ?? 'comfortable'
  const pathProgress = useMemo(() => deriveAcademyPathProgress(snapshot, state), [snapshot, state])
  const nextAction = useMemo(() => academyNextAction(snapshot, state), [snapshot, state])
  const theme = state?.preferences.theme ?? 'system'
  const readingWidth = state?.preferences.readingWidth ?? 'comfortable'
  const lineHeight = state?.preferences.lineHeight ?? 1.7
  const isWorkspace = snapshot.location.surface === 'workspace'
  const conflictFixture = import.meta.env.DEV && snapshot.location.query['academy-conflict-fixture'] === '1'
  const shellClass = useMemo(
    () => `academy-shell density-${density} theme-${theme} reading-${readingWidth} ${compact ? 'is-nav-compact' : ''} ${contextOpen ? 'has-context' : ''}`,
    [compact, contextOpen, density, readingWidth, theme],
  )
  const closeContext = useCallback(() => {
    writeUxSession('wplab.academy.context-open', 'false')
    actions.setPreferences({ contextPanelOpen: false })
    setContextOpen(false)
    if (contextDrawer) requestAnimationFrame(() => contextTriggerRef.current?.focus())
  }, [actions, contextDrawer])

  const persistedUpdatedAt = persistedAcademyState
    && typeof persistedAcademyState === 'object'
    && !Array.isArray(persistedAcademyState)
    && typeof (persistedAcademyState as Record<string, unknown>).updatedAt === 'string'
    ? String((persistedAcademyState as Record<string, unknown>).updatedAt)
    : undefined

  useEffect(() => {
    academyStateRef.current = state
  }, [state])

  useEffect(() => {
    if (!state || persistedUpdatedAt === state.updatedAt) return
    const timeout = window.setTimeout(() => {
      void service.persistAcademyState(state)
        .then(() => setPersistenceWarning(undefined))
        .catch(() => setPersistenceWarning('No se ha podido completar la copia durable. Tus cambios siguen guardados localmente y puedes reintentar.'))
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [persistedUpdatedAt, service, state])

  useEffect(() => {
    const profileId = snapshot.profile?.id
    if (!profileId) return
    const flushCurrent = () => {
      const current = academyStateRef.current
      if (!current || current.profileId !== profileId) return
      void service.persistAcademyState(current)
        .then(() => service.flushProfileMutations(profileId))
        .catch(() => setPersistenceWarning('La copia durable queda pendiente. El estado inmediato permanece en este dispositivo.'))
    }
    window.addEventListener('pagehide', flushCurrent)
    return () => {
      window.removeEventListener('pagehide', flushCurrent)
      flushCurrent()
    }
  }, [service, snapshot.profile?.id])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    const key = `wplab.academy.scroll.${snapshot.location.surface}.${snapshot.location.id ?? ''}`
    const stored = Number(readUxSession(key))
    requestAnimationFrame(() => {
      main.scrollTop = Number.isFinite(stored) && stored >= 0 && stored <= 10_000_000 ? stored : 0
      main.focus({ preventScroll: true })
    })
    document.title = `${learningMessage(snapshot.profile?.locale, surfaceMessage(snapshot.location.surface))} · Academia · Watch Prototype Lab`
    return () => { writeUxSession(key, String(main.scrollTop)) }
  }, [snapshot.location.id, snapshot.location.surface, snapshot.profile?.locale])

  useEffect(() => {
    actions.recordMetric(`surface.${snapshot.location.surface}.open`)
  }, [actions, snapshot.location.surface])

  useEffect(() => {
    const compactViewport = window.matchMedia('(max-width: 1060px)')
    const updateContextMode = (event: MediaQueryListEvent | MediaQueryList) => {
      setContextDrawer(event.matches)
    }
    updateContextMode(compactViewport)
    compactViewport.addEventListener('change', updateContextMode)
    return () => compactViewport.removeEventListener('change', updateContextMode)
  }, [])

  useEffect(() => {
    if (!contextOpen || !contextDrawer) return
    const panel = contextPanelRef.current
    contextCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeContext()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeContext, contextDrawer, contextOpen])

  if (isWorkspace) {
    return (
      <AcademySurfaceBoundary scope="workspace" onReset={() => service.navigate({ surface: 'home', query: {} }, true)}>
        <Suspense fallback={<AcademyLoading label="Preparando la actividad" />}>
          <LearningActivityWorkspace
            key={`${snapshot.workspace?.persistentSessionId ?? 'none'}:${snapshot.workspace?.activeStepId ?? 'none'}`}
            onExit={onExit}
          />
        </Suspense>
      </AcademySurfaceBoundary>
    )
  }

  return (
    <div className={shellClass}>
      <AcademySurfaceBoundary scope="navigation" onReset={() => void service.refresh()}>
        <AcademyPrimaryNavigation compact={compact} onToggleCompact={() => setCompact((current) => {
          const next = !current
          writeUxSession('wplab.academy.nav-compact', String(next))
          return next
        })} />
      </AcademySurfaceBoundary>
      <div className="academy-content-frame">
        <AcademySurfaceBoundary scope="topbar" onReset={() => void service.refresh()}>
          <AcademyTopbar contextOpen={contextOpen} contextTriggerRef={contextTriggerRef} onOpenContext={() => {
            writeUxSession('wplab.academy.context-open', 'true')
            actions.setPreferences({ contextPanelOpen: true })
            setContextOpen(true)
          }} />
        </AcademySurfaceBoundary>
        {(recovery?.recoveredUxState || recovery?.volatile) && (
          <aside className="academy-recovery-notice" role="status">
            <TriangleAlert size={17} />
            <div>
              <strong>
                {recovery.recoveredUxState
                  ? 'Se han restablecido preferencias visuales incompatibles.'
                  : 'Las preferencias visuales usan memoria temporal.'}
              </strong>
              <span>El progreso, los resultados, las sesiones, las notas y el contenido no se han eliminado.</span>
            </div>
          </aside>
        )}
        {(persistenceWarning || conflictFixture) && (
          <aside className="academy-recovery-notice" role="status" data-qa-fixture={conflictFixture ? 'profile-conflict-recovery' : undefined}>
            <TriangleAlert size={17} />
            <div>
              <strong>{conflictFixture ? 'Escenario de prueba · conflicto de guardado recuperable' : 'La copia durable necesita atención.'}</strong>
              <span>{conflictFixture ? 'Esta vista simula el aviso; no representa una pérdida real ni contiene datos personales.' : persistenceWarning}</span>
            </div>
          </aside>
        )}
        <main
          id="learning-main"
          ref={mainRef}
          className="academy-main"
          style={{ '--academy-reading-line-height': lineHeight } as CSSProperties}
          tabIndex={-1}
        >
          <AcademySurfaceBoundary scope={snapshot.location.surface} onReset={() => void service.refresh()}>
            <Suspense fallback={<AcademyLoading label="Cargando Academia" />}>
              {snapshot.location.surface === 'map' ? <LearningMapSurface /> : <LearningSurfaces />}
            </Suspense>
          </AcademySurfaceBoundary>
        </main>
      </div>
      {contextOpen && (
        <AcademySurfaceBoundary scope="context" onReset={closeContext}>
          <div className={`academy-context-layer ${contextDrawer ? 'is-drawer' : ''}`}>
            {contextDrawer && <button className="academy-context-backdrop" type="button" onClick={closeContext} aria-label="Cerrar ayuda contextual" tabIndex={-1} />}
            <AcademyContextPanel onClose={closeContext} drawer={contextDrawer} panelRef={contextPanelRef} closeButtonRef={contextCloseRef} nextAction={nextAction} pathProgress={pathProgress} />
          </div>
        </AcademySurfaceBoundary>
      )}
    </div>
  )
}

export default AcademyShell
