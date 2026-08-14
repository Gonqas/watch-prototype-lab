import { useEffect, useRef, type RefObject } from 'react'
import {
  BookOpen,
  Boxes,
  CircleUserRound,
  ClipboardCheck,
  Gauge,
  LibraryBig,
  ListChecks,
  NotebookPen,
  Search,
  Settings2,
  TestTube2,
  Sigma,
  X,
} from 'lucide-react'
import { ACADEMY_LIBRARY_DESTINATION_GROUPS } from '../../academy/path/academyLibrary'
import { learningHref, type LearningSurface } from '../../application/navigation'
import { useLearning } from '../LearningContext'
import './academy-library.css'

const icons: Partial<Record<LearningSurface, typeof Search>> = {
  explore: LibraryBig,
  engineering: Sigma,
  atlas: Boxes,
  review: ListChecks,
  search: Search,
  notebook: NotebookPen,
  glossary: BookOpen,
  sources: LibraryBig,
  progress: Gauge,
  content: LibraryBig,
  profile: CircleUserRound,
  preferences: Settings2,
  'editorial-review': ClipboardCheck,
  usability: TestTube2,
}

export function AcademyLibraryMenu({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}) {
  const { snapshot } = useLearning()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        requestAnimationFrame(() => returnFocusRef.current?.focus())
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
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
  }, [onClose, open, returnFocusRef])

  if (!open) return null
  const closeAndRestore = () => {
    onClose()
    requestAnimationFrame(() => returnFocusRef.current?.focus())
  }
  return (
    <div className="academy-library-layer">
      <button className="academy-library-backdrop" type="button" tabIndex={-1} aria-label="Cerrar Biblioteca" onClick={closeAndRestore} />
      <aside ref={panelRef} className="academy-library-menu" role="dialog" aria-modal="true" aria-labelledby="academy-library-title">
        <header>
          <div><span>BIBLIOTECA</span><h2 id="academy-library-title">Todo el catálogo, cuando lo necesites</h2></div>
          <button ref={closeRef} type="button" onClick={closeAndRestore} aria-label="Cerrar Biblioteca"><X size={18} /></button>
        </header>
        <p>La Biblioteca conserva rutas, herramientas y gestión local sin competir con tu siguiente paso.</p>
        <nav aria-label="Destinos de Biblioteca">
          {ACADEMY_LIBRARY_DESTINATION_GROUPS.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              {group.destinations.map(({ surface, label }) => {
                const typedSurface = surface as LearningSurface
                const Icon = icons[typedSurface] ?? LibraryBig
                const active = snapshot.location.surface === typedSurface
                return (
                  <a
                    key={surface}
                    href={learningHref({ surface: typedSurface, query: {} })}
                    aria-current={active ? 'page' : undefined}
                    className={active ? 'is-active' : undefined}
                    onClick={closeAndRestore}
                  >
                    <Icon size={17} /><span>{label}</span>
                  </a>
                )
              })}
            </section>
          ))}
        </nav>
      </aside>
    </div>
  )
}
