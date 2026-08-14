import { Bookmark, BookmarkCheck, CheckCircle2, List, NotebookPen, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { academyLessonMaterial } from '../../academy/academyCatalog'
import { academyLegacyModeForReader, academyReaderModeFromLegacy } from '../../academy/reader/academyReaderCompatibility'
import { buildAcademyReaderDocument, resolveAcademyReaderSection } from '../../academy/reader/academyReaderDocument'
import type { AcademyReaderMode } from '../../academy/reader/academyReaderModel'
import { useAcademyLocalState } from '../../academy/useAcademyLocalState'
import { academyPathLocationForStepLesson } from '../../academy/path/academyLearnerPath'
import { academyLessonCompletionTransition } from '../../academy/path/academyPathLinks'
import { deriveAcademyPathProgress } from '../../academy/path/academyPathProgress'
import { localize } from '../../application/i18n'
import { parseLearningLocation } from '../../application/navigation'
import { useLearning } from '../LearningContext'
import { AcademyPathBreadcrumbs } from '../path/AcademyPathBreadcrumbs'
import { AcademySafeMarkdown } from './AcademySafeMarkdown'
import { AcademyReaderVisual } from './AcademyReaderVisual'
import './academy-reader.css'

const readerRoleLabels: Record<string, string> = {
  orientation: 'orientación', preparation: 'preparación', vocabulary: 'vocabulario', explanation: 'explicación',
  'visual-anatomy': 'anatomía visual', observation: 'observación', 'worked-example': 'ejemplo trabajado',
  comparison: 'comparación', procedure: 'procedimiento', diagnosis: 'diagnóstico', checkpoint: 'punto de control',
  'common-errors': 'errores habituales', safety: 'seguridad', summary: 'resumen', 'next-connection': 'siguiente conexión',
  reference: 'referencia', sources: 'fuentes', limitations: 'límites',
}

function scrollToSection(sectionId: string, offset = 0, behavior: ScrollBehavior = 'smooth') {
  const target = document.getElementById(sectionId)
  if (!target) return
  target.querySelector(':scope > details')?.setAttribute('open', '')
  target.scrollIntoView({ block: 'start', behavior })
  if (offset > 0) window.scrollBy({ top: offset, behavior: 'instant' })
}

export default function AcademyContinuousLessonSurface() {
  const { service, snapshot } = useLearning()
  const descriptor = snapshot.product.lessons.find(({ id }) => id === snapshot.location.id)
  const material = academyLessonMaterial(snapshot.product, descriptor?.id ?? '')
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const curatedLocation = descriptor ? academyPathLocationForStepLesson(descriptor.id) : undefined
  const readerDocument = useMemo(() => descriptor && material
    ? buildAcademyReaderDocument({
        material,
        title: localize(snapshot.profile?.locale, descriptor.title),
        purpose: localize(snapshot.profile?.locale, descriptor.purpose),
        whyNow: curatedLocation?.chapter.whyNow,
        outcome: curatedLocation?.chapter.outcome,
        stageId: curatedLocation?.stage.stageId,
        chapterId: curatedLocation?.chapter.chapterId,
        stepId: curatedLocation?.step.stepId,
        locale: snapshot.profile?.locale,
        requiredActivityIds: curatedLocation?.step.requiredActivityIds ?? descriptor.studyContract?.labActivityIds,
      })
    : undefined, [
      curatedLocation?.chapter,
      curatedLocation?.stage,
      curatedLocation?.step,
      descriptor,
      material,
      snapshot.profile?.locale,
    ])
  const saved = state?.lessonProgress.find(({ lessonId }) => lessonId === descriptor?.id)
  const initial = readerDocument
    ? resolveAcademyReaderSection(
        readerDocument,
        snapshot.location.query.section
          ?? snapshot.location.query.segment
          ?? (saved?.documentVersion === readerDocument.documentVersion ? saved.activeSectionId : undefined)
          ?? saved?.currentSegmentId,
      )
    : { sectionId: '', restoredFromLegacyAlias: false }
  const [active, setActive] = useState({ lessonId: descriptor?.id ?? '', sectionId: initial.sectionId })
  const activeSectionId = active.lessonId === descriptor?.id ? active.sectionId : initial.sectionId
  const [mode, setMode] = useState<AcademyReaderMode>(() => academyReaderModeFromLegacy(
    state?.preferences.lessonMode,
    snapshot.profile?.accessibility.readLabels,
  ))
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [mobileNarrative, setMobileNarrative] = useState(false)
  const [completionBlocked, setCompletionBlocked] = useState(false)
  const outlineDialog = useRef<HTMLDialogElement>(null)
  const outlineButton = useRef<HTMLButtonElement>(null)
  const visited = useRef(new Set<string>())
  const openedLesson = useRef('')
  const lastMetricSection = useRef('')
  const manualSection = useRef<string | undefined>(undefined)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)')
    const update = () => setMobileNarrative(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!readerDocument || openedLesson.current === readerDocument.lessonId) return
    openedLesson.current = readerDocument.lessonId
    visited.current = new Set([
      ...(saved?.visitedSectionIds ?? []),
      ...readerDocument.legacyAliases
        .filter(({ legacySegmentId }) => saved?.completedSegmentIds.includes(legacySegmentId))
        .map(({ sectionId }) => sectionId),
    ])
    actions.recordMetric('reader.open')
    if (snapshot.location.query.segment && !initial.restoredFromLegacyAlias && !readerDocument.sections.some(({ sectionId }) => sectionId === snapshot.location.query.segment)) {
      actions.recordMetric('reader.alias.fallback')
    }
    if (saved?.activeSectionId || initial.restoredFromLegacyAlias) {
      actions.recordMetric('reader.resume')
      actions.recordMetric('reader.return')
    }
    const target = snapshot.location.query.section || snapshot.location.query.segment
      ? initial.sectionId
      : saved?.documentVersion === readerDocument.documentVersion ? saved.scrollAnchor ?? initial.sectionId : initial.sectionId
    const timer = window.setTimeout(() => scrollToSection(target, saved?.scrollOffset ?? 0, 'instant'), 0)
    return () => window.clearTimeout(timer)
  }, [actions, initial.restoredFromLegacyAlias, initial.sectionId, readerDocument, saved?.activeSectionId, saved?.completedSegmentIds, saved?.documentVersion, saved?.scrollAnchor, saved?.scrollOffset, saved?.visitedSectionIds, snapshot.location.query.section, snapshot.location.query.segment])

  useEffect(() => {
    if (!readerDocument) return
    const elements = readerDocument.sections
      .map(({ sectionId }) => document.getElementById(sectionId))
      .filter((item): item is HTMLElement => Boolean(item))
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      const readingLine = window.innerHeight * 0.24
      const visible = entries
        .filter(({ isIntersecting }) => isIntersecting)
        .sort((left, right) => Math.abs(left.boundingClientRect.top - readingLine) - Math.abs(right.boundingClientRect.top - readingLine))[0]
      if (!visible) return
      const sectionId = manualSection.current ?? visible.target.id
      visited.current.add(sectionId)
      setActive({ lessonId: readerDocument.lessonId, sectionId })
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.1, 0.5] })
    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [readerDocument])

  useEffect(() => {
    if (!readerDocument || !activeSectionId) return
    if (lastMetricSection.current !== activeSectionId) {
      lastMetricSection.current = activeSectionId
      actions.recordMetric('reader.section.enter')
      actions.recordMetric('reader.cue.change')
    }
    const timer = window.setTimeout(() => {
      const target = document.getElementById(activeSectionId)
      actions.recordReaderPosition(readerDocument.lessonId, {
        activeSectionId,
        scrollAnchor: activeSectionId,
        scrollOffset: Math.max(0, Math.round(-(target?.getBoundingClientRect().top ?? 0))),
        documentVersion: readerDocument.documentVersion,
        visitedSectionIds: [...visited.current],
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [actions, activeSectionId, readerDocument])

  useEffect(() => {
    if (!readerDocument) return
    let activeSince = document.visibilityState === 'visible' ? Date.now() : 0
    const interval = window.setInterval(() => {
      if (!activeSince || document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - activeSince >= 60_000) {
        actions.recordMetric('reader.active-minute')
        activeSince = now
      }
    }, 15_000)
    const visibility = () => { activeSince = document.visibilityState === 'visible' ? Date.now() : 0 }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [actions, readerDocument])

  if (!descriptor || !material || !readerDocument) {
    return <section className="academy-empty-state"><h2>La lección no está disponible</h2><p>No se ha generado contenido de sustitución.</p></section>
  }

  const title = localize(snapshot.profile?.locale, descriptor.title)
  const bookmark = state?.bookmarks.find(({ context }) => context.lessonId === descriptor.id)
  const activeSection = readerDocument.sections.find(({ sectionId }) => sectionId === activeSectionId) ?? readerDocument.sections[0]
  const completed = Boolean(saved?.completedAt)
  const pathLocation = curatedLocation
  const chapterProgress = pathLocation
    ? deriveAcademyPathProgress(snapshot, state).chapters.find(({ chapterId }) => chapterId === pathLocation.chapter.chapterId)
    : undefined
  const requiredPracticeBlocked = Boolean(
    readerDocument.completion.completionActivityId
    && chapterProgress
    && ['blocked', 'planned'].includes(chapterProgress.state),
  )
  const setReaderMode = (next: AcademyReaderMode) => {
    const sectionToRestore = activeSectionId
    setMode(next)
    actions.setPreferences({ lessonMode: academyLegacyModeForReader(next) })
    actions.recordMetric(`reader.mode.${next}`)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToSection(sectionToRestore, 0, 'instant'))
    })
  }
  const openOutline = () => {
    actions.recordMetric('reader.outline.open')
    outlineDialog.current?.showModal()
  }
  const selectSection = (sectionId: string, mobile = false) => {
    actions.recordMetric('reader.outline.jump')
    manualSection.current = sectionId
    window.setTimeout(() => {
      if (manualSection.current === sectionId) manualSection.current = undefined
    }, 1_200)
    setActive({ lessonId: descriptor.id, sectionId })
    if (mobile) {
      outlineDialog.current?.close()
      window.requestAnimationFrame(() => scrollToSection(sectionId))
    } else {
      scrollToSection(sectionId)
    }
  }
  const createNote = (event: FormEvent) => {
    event.preventDefault()
    if (!noteBody.trim()) return
    actions.createNote({ title, body: noteBody, tags: ['lección'], context: { lessonId: descriptor.id, stepId: activeSectionId } })
    setNoteBody('')
    setNoteOpen(false)
  }
  const finishLesson = () => {
    actions.completeLesson(descriptor.id, activeSectionId, readerDocument.documentVersion)
    actions.recordMetric('reader.explicit-completion')
    if (requiredPracticeBlocked) {
      setCompletionBlocked(true)
      return
    }
    const transition = academyLessonCompletionTransition(snapshot, state, descriptor.id)
    actions.recordMetric(transition.metric)
    if (transition.href.includes('/activity/')) actions.recordMetric('reader.practice.transition')
    service.navigate(parseLearningLocation(new URL(transition.href, window.location.href)))
  }
  const recordReaderInteraction = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest('a,button')
    if (!target) return
    actions.recordMetric('reader.click')
    const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') ?? '' : ''
    if (href.includes('/glossary')) actions.recordMetric('reader.glossary.open')
    if (target.closest('.role-sources, .role-reference')) actions.recordMetric('reader.source.open')
  }

  const outline = (mobile = false) => (
    <nav aria-label="Índice semántico de la lección">
      <ol>{readerDocument.outline.map((item) => (
        <li key={item.sectionId} className={`level-${item.level}`}>
          <button type="button" aria-current={item.sectionId === activeSectionId ? 'location' : undefined} onClick={() => selectSection(item.sectionId, mobile)}>
            <span>{item.title}</span>
          </button>
        </li>
      ))}</ol>
    </nav>
  )

  return (
    <div className={`academy-page academy-continuous-reader mode-${mode}`} onClick={recordReaderInteraction}>
      <a className="academy-reader-skip" href="#academy-reader-document">Saltar al contenido de la lección</a>
      {mode === 'learn' && activeSection?.visualCue.implementationStatus === 'implemented' && <a className="academy-reader-skip is-visual" href="#academy-reader-active-visual">Saltar al visual del apartado</a>}
      <AcademyPathBreadcrumbs lessonId={descriptor.id} />
      <header className="academy-page-header academy-reader-header">
        <div>
          <span className="academy-kicker">LECCIÓN CONTINUA</span><h1>{title}</h1><p>{localize(snapshot.profile?.locale, descriptor.purpose)}</p>
          <div className="academy-reader-header-meta">
            {readerDocument.whyNow && <span><strong>Por qué aparece ahora:</strong> {readerDocument.whyNow}</span>}
            {readerDocument.estimatedDurationMinutes !== undefined && <span><strong>Duración authored:</strong> {readerDocument.estimatedDurationMinutes} min</span>}
            <span><strong>Fiabilidad editorial:</strong> {readerDocument.curation.ownerReviewPending ? 'curación pendiente de revisión propietaria' : 'estructura authored validada'}</span>
          </div>
        </div>
        <div className="academy-page-header__actions">
          <button className="academy-button is-secondary academy-reader-outline-button" ref={outlineButton} type="button" onClick={openOutline}><List size={15} /> Índice</button>
          <button className="academy-button is-secondary" type="button" onClick={() => bookmark
            ? actions.deleteBookmark(bookmark.id)
            : actions.createBookmark({ title, href: `#/learning/lesson/${encodeURIComponent(descriptor.id)}`, context: { lessonId: descriptor.id } })}>
            {bookmark ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}{bookmark ? 'Marcada' : 'Marcar'}
          </button>
          <button className="academy-button is-secondary" type="button" onClick={() => setNoteOpen((value) => !value)}><NotebookPen size={15} /> Nota</button>
        </div>
      </header>

      <div className="academy-reader-mode" role="group" aria-label="Modo del lector">
        <button type="button" aria-pressed={mode === 'learn'} onClick={() => setReaderMode('learn')}>Aprender</button>
        <button type="button" aria-pressed={mode === 'read'} onClick={() => setReaderMode('read')}>Lectura</button>
      </div>

      {noteOpen && <form className="academy-inline-note" onSubmit={createNote}><label htmlFor="academy-reader-note">Nota privada sobre el apartado activo</label><textarea id="academy-reader-note" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} autoFocus /><div><button type="button" onClick={() => setNoteOpen(false)}>Cancelar</button><button type="submit">Guardar</button></div></form>}

      {readerDocument.centralQuestion && <section className="academy-reader-question" aria-labelledby="academy-reader-question-title"><span className="academy-kicker">PREGUNTA CENTRAL</span><h2 id="academy-reader-question-title">{readerDocument.centralQuestion}</h2></section>}

      <div className="academy-reader-layout">
        <aside className="academy-reader-outline">{outline()}</aside>
        <article id="academy-reader-document" className="academy-reader-document" tabIndex={-1}>
          {readerDocument.sections.map((section) => (
            <section id={section.sectionId} className={`academy-reader-section role-${section.role}`} data-source-block={section.sourceBlockId} key={section.sectionId}>
              {section.collapsible ? (
                <details>
                  <summary><span className="academy-kicker">{readerRoleLabels[section.role] ?? section.role.replaceAll('-', ' ')}</span><span className="academy-reader-reference-title">{section.title}</span></summary>
                  <AcademySafeMarkdown markdown={section.markdown} />
                </details>
              ) : (
                <>
                  <span className="academy-kicker">{readerRoleLabels[section.role] ?? section.role.replaceAll('-', ' ')}</span>
                  <h2>{section.title}</h2>
                  <AcademySafeMarkdown markdown={section.markdown} />
                </>
              )}
              {mode === 'learn' && mobileNarrative && section.sectionId === activeSectionId && section.visualCue.implementationStatus === 'implemented' && (
                <div id="academy-reader-active-visual" className="academy-reader-inline-visual">
                  <AcademyReaderVisual cue={section.visualCue} activities={material.activities} reducedMotion={snapshot.profile?.accessibility.reducedMotion ?? false} />
                </div>
              )}
            </section>
          ))}
          <footer className="academy-reader-completion">
            <CheckCircle2 size={24} aria-hidden="true" />
            <div><h2>{completed ? 'Lección estudiada' : 'Cierra la lección cuando hayas terminado'}</h2><p>Desplazarte, permanecer en la página o visitar todos los apartados no registra la finalización.</p></div>
            <button className="academy-button is-primary" type="button" onClick={finishLesson}>
              {readerDocument.completion.completionActivityId ? 'Finalizar y preparar práctica' : 'Marcar lección como estudiada'}
            </button>
            {(requiredPracticeBlocked || completionBlocked) && pathLocation && (
              <p className="academy-reader-completion__blocked" role="status">
                La lección puede cerrarse, pero la práctica requerida sigue bloqueada por los capítulos previos.
                {' '}<a href={`#/learning/my-learning?chapter=${encodeURIComponent(pathLocation.chapter.chapterId)}`}>Revisar requisitos del capítulo</a>.
              </p>
            )}
          </footer>
        </article>
        {mode === 'learn' && !mobileNarrative && activeSection?.visualCue.implementationStatus === 'implemented' && <aside id="academy-reader-active-visual" className="academy-reader-narrative" aria-label="Narrativa visual sincronizada"><AcademyReaderVisual cue={activeSection.visualCue} activities={material.activities} reducedMotion={snapshot.profile?.accessibility.reducedMotion ?? false} /></aside>}
      </div>

      <dialog
        className="academy-reader-outline-dialog"
        ref={outlineDialog}
        onClose={() => outlineButton.current?.focus({ preventScroll: true })}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          outlineDialog.current?.close()
        }}
      >
        <header><h2>Índice de la lección</h2><button type="button" autoFocus aria-label="Cerrar índice" onClick={() => outlineDialog.current?.close()}><X /></button></header>
        {outline(true)}
      </dialog>
    </div>
  )
}
