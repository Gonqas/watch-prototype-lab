import { useRef, useState } from 'react'
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  LibraryBig,
  Wrench,
} from 'lucide-react'
import { academyPathLocationForLesson } from '../../academy/path/academyLearnerPath'
import { learningHref, type LearningSurface } from '../../application/navigation'
import { useLearning } from '../LearningContext'
import { AcademyLibraryMenu } from './AcademyLibraryMenu'

const primaryItems = [
  { surface: 'home' as const, label: 'Inicio', icon: Home },
  { surface: 'my-learning' as const, label: 'Mi ruta', icon: BookOpenText },
  { surface: 'workshop' as const, label: 'Taller', icon: Wrench },
]

const librarySurfaces = new Set<LearningSurface>([
  'explore', 'engineering', 'atlas', 'review', 'search', 'notebook', 'glossary', 'sources',
  'progress', 'content', 'profile', 'preferences', 'route', 'module', 'package', 'competency', 'movement',
])

function activePrimary(surface: LearningSurface, item: LearningSurface, id?: string): boolean {
  if (surface === item) return true
  if (item === 'my-learning' && surface === 'lesson' && id && academyPathLocationForLesson(id)) return true
  if (item === 'my-learning' && surface === 'sessions') return true
  if (item === 'workshop' && ['activity', 'workspace', 'session', 'recovery', 'results', 'evidence', 'assessment'].includes(surface)) return true
  return false
}

export function AcademyPrimaryNavigation({
  compact,
  onToggleCompact,
}: {
  compact: boolean
  onToggleCompact: () => void
}) {
  const { snapshot } = useLearning()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const desktopTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLButtonElement>(null)
  const recoverable = snapshot.sessions.items.filter(({ state }) =>
    ['active', 'paused', 'interrupted', 'suspended', 'recovering'].includes(state)).length
  const openLibrary = (trigger: HTMLButtonElement | null) => {
    returnFocusRef.current = trigger
    setLibraryOpen(true)
  }
  const libraryActive = librarySurfaces.has(snapshot.location.surface)

  return (
    <aside className={`academy-navigation ${compact ? 'is-compact' : ''}`} aria-label="Navegación de Academia">
      <div className="academy-navigation__brand">
        <div><GraduationCap size={22} /></div>
        <span><strong>Academia</strong><small>Una ruta, ocho etapas</small></span>
      </div>
      <nav className="academy-primary-links" aria-label="Navegación principal">
        <section className="academy-nav-group">
          <h2>PRINCIPAL</h2>
          {primaryItems.map(({ surface, label, icon: Icon }) => {
            const active = activePrimary(snapshot.location.surface, surface, snapshot.location.id)
            return (
              <a key={surface} href={learningHref({ surface, query: {} })} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined} aria-label={label} title={label}>
                <Icon size={18} /><span>{label}</span>
                {surface === 'my-learning' && recoverable > 0 && <i aria-label={`${recoverable} sesiones recuperables`}>{recoverable}</i>}
              </a>
            )
          })}
        </section>
        <section className="academy-nav-group academy-nav-group--library">
          <h2>SECUNDARIO</h2>
          <button
            ref={desktopTriggerRef}
            type="button"
            className={libraryActive || libraryOpen ? 'is-active' : undefined}
            aria-label="Biblioteca"
            title="Biblioteca"
            aria-expanded={libraryOpen}
            aria-haspopup="dialog"
            onClick={() => libraryOpen ? setLibraryOpen(false) : openLibrary(desktopTriggerRef.current)}
          >
            <LibraryBig size={18} /><span>Biblioteca</span>
          </button>
        </section>
      </nav>
      <div className="academy-navigation__footer">
        <button type="button" onClick={onToggleCompact} aria-label={compact ? 'Ampliar navegación' : 'Compactar navegación'}>
          {compact ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          <span>{compact ? 'Ampliar' : 'Compactar'}</span>
        </button>
      </div>
      <nav className="academy-mobile-navigation" aria-label="Navegación principal móvil">
        {primaryItems.map(({ surface, label, icon: Icon }) => {
          const active = activePrimary(snapshot.location.surface, surface, snapshot.location.id)
          return <a key={surface} href={learningHref({ surface, query: {} })} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined} aria-label={label}><Icon size={19} /><span>{label}</span></a>
        })}
        <button
          ref={mobileTriggerRef}
          type="button"
          className={libraryActive || libraryOpen ? 'is-active' : undefined}
          aria-label="Biblioteca"
          aria-expanded={libraryOpen}
          aria-haspopup="dialog"
          onClick={() => libraryOpen ? setLibraryOpen(false) : openLibrary(mobileTriggerRef.current)}
        >
          <LibraryBig size={19} /><span>Biblioteca</span>
        </button>
      </nav>
      <AcademyLibraryMenu open={libraryOpen} onClose={() => setLibraryOpen(false)} returnFocusRef={returnFocusRef} />
    </aside>
  )
}
