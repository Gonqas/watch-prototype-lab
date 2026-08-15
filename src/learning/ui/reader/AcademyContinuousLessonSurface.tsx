import { Bookmark, BookmarkCheck, CheckCircle2, List, NotebookPen, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { academyLessonMaterial } from '../../academy/academyCatalog'
import { academyLegacyModeForReader, academyReaderModeFromLegacy } from '../../academy/reader/academyReaderCompatibility'
import { buildAcademyReaderDocument, resolveAcademyReaderSection } from '../../academy/reader/academyReaderDocument'
import type { AcademyReaderMode } from '../../academy/reader/academyReaderModel'
import { academyReaderDocumentVersionMatches } from '../../academy/reader/academyReaderIdentity'
import { academyEditorialReviewStatus, academyEditorialStatusLabel } from '../../academy/reader/academyReaderReview'
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

function viewportClass(): 'desktop' | 'tablet' | 'mobile' | 'reflow' {
  if (window.innerWidth <= 520) return 'mobile'
  if (window.innerWidth <= 820) return 'tablet'
  if (window.devicePixelRatio >= 2 && window.innerWidth <= 900) return 'reflow'
  return 'desktop'
}

function AcademySectionHeading({ level, children }: { level: number; children: string }) {
  if (level >= 4) return <h4>{children}</h4>
  if (level === 3) return <h3>{children}</h3>
  return <h2>{children}</h2>
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
      }, { curationPhase: '0.14E' })
    : undefined, [
      curatedLocation?.chapter,
      curatedLocation?.stage,
      curatedLocation?.step,
      descriptor,
      material,
      snapshot.profile?.locale,
    ])
  const saved = state?.lessonProgress.find(({ lessonId }) => lessonId === descriptor?.id)
  const requestedSection = snapshot.location.query.section ?? snapshot.location.query.segment
  const savedRequest = requestedSection
    ?? saved?.activeSectionId
    ?? saved?.scrollAnchor
    ?? saved?.currentSegmentId
  const initial = readerDocument
    ? resolveAcademyReaderSection(readerDocument, savedRequest)
    : { sectionId: '', restoredFromLegacyAlias: false }
  const readerLocationKey = `${descriptor?.id ?? ''}|${requestedSection ?? ''}`
  const [active, setActive] = useState({ locationKey: readerLocationKey, sectionId: initial.sectionId })
  const activeSectionId = active.locationKey === readerLocationKey ? active.sectionId : initial.sectionId
  const requestedMode = snapshot.location.query.mode === 'read' || snapshot.location.query.mode === 'learn'
    ? snapshot.location.query.mode
    : undefined
  const defaultMode = academyReaderModeFromLegacy(
    state?.preferences.lessonMode,
    snapshot.profile?.accessibility.readLabels,
  )
  const modeLocationKey = `${descriptor?.id ?? ''}|${requestedMode ?? 'preference'}`
  const [modeSelection, setModeSelection] = useState<{ locationKey: string; mode: AcademyReaderMode }>(() => ({
    locationKey: modeLocationKey,
    mode: requestedMode ?? defaultMode,
  }))
  const mode = modeSelection.locationKey === modeLocationKey
    ? modeSelection.mode
    : requestedMode ?? defaultMode
  const modeRef = useRef(mode)
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
  const readerSessionId = useRef(`academy-reader-session.${crypto.randomUUID()}`)
  const exitRecorded = useRef(false)
  const sessionEnded = useRef(false)
  const completedRef = useRef(Boolean(saved?.completedAt))

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    completedRef.current = Boolean(saved?.completedAt)
  }, [saved?.completedAt])

  useEffect(() => {
    if (!readerDocument?.lessonId || !requestedSection) return
    const timer = window.setTimeout(() => scrollToSection(initial.sectionId, 0, 'instant'), 0)
    return () => window.clearTimeout(timer)
  }, [initial.sectionId, readerDocument?.lessonId, requestedSection])

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
    actions.recordReaderEvent({
      sessionId: readerSessionId.current, eventType: 'session-start', lessonId: readerDocument.lessonId,
      sectionId: initial.sectionId, mode, viewportClass: viewportClass(), completed: Boolean(saved?.completedAt), source: 'academy-reader', metadata: {},
    })
    actions.recordReaderEvent({
      sessionId: readerSessionId.current, eventType: 'lesson-open', lessonId: readerDocument.lessonId,
      sectionId: initial.sectionId, mode, viewportClass: viewportClass(), completed: Boolean(saved?.completedAt), source: 'academy-reader', metadata: {},
    })
    if (snapshot.location.query.segment && !initial.restoredFromLegacyAlias && !readerDocument.sections.some(({ sectionId }) => sectionId === snapshot.location.query.segment)) {
      actions.recordMetric('reader.alias.fallback')
    }
    if (saved?.activeSectionId || initial.restoredFromLegacyAlias) {
      actions.recordMetric('reader.resume')
      actions.recordMetric('reader.return')
      actions.recordReaderEvent({
        sessionId: readerSessionId.current, eventType: 'lesson-resume', lessonId: readerDocument.lessonId,
        sectionId: initial.sectionId, mode, viewportClass: viewportClass(), completed: Boolean(saved?.completedAt), source: 'academy-reader',
        metadata: { restoredFromLegacyAlias: initial.restoredFromLegacyAlias },
      })
      if (!saved?.completedAt) actions.recordReaderEvent({
        sessionId: readerSessionId.current, eventType: 'return-after-incomplete', lessonId: readerDocument.lessonId,
        sectionId: initial.sectionId, mode, viewportClass: viewportClass(), completed: false, source: 'academy-reader', metadata: {},
      })
    }
    const target = snapshot.location.query.section || snapshot.location.query.segment
      ? initial.sectionId
      : saved?.scrollAnchor ?? initial.sectionId
    const sameDocument = academyReaderDocumentVersionMatches(readerDocument, saved?.documentVersion)
    const timer = window.setTimeout(() => scrollToSection(target, sameDocument ? saved?.scrollOffset ?? 0 : 0, 'instant'), 0)
    return () => window.clearTimeout(timer)
  }, [actions, initial.restoredFromLegacyAlias, initial.sectionId, mode, readerDocument, saved?.activeSectionId, saved?.completedAt, saved?.completedSegmentIds, saved?.documentVersion, saved?.scrollAnchor, saved?.scrollOffset, saved?.visitedSectionIds, snapshot.location.query.section, snapshot.location.query.segment])

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
      setActive({ locationKey: readerLocationKey, sectionId })
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.1, 0.5] })
    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [readerDocument, readerLocationKey])

  useEffect(() => {
    if (!readerDocument || !activeSectionId) return
    if (lastMetricSection.current !== activeSectionId) {
      const fromSectionId = lastMetricSection.current || undefined
      lastMetricSection.current = activeSectionId
      actions.recordMetric('reader.section.enter')
      actions.recordMetric('reader.cue.change')
      const cueId = readerDocument.sections.find(({ sectionId }) => sectionId === activeSectionId)?.visualCue.cueId
      actions.recordReaderEvent({
        sessionId: readerSessionId.current, eventType: 'section-enter', lessonId: readerDocument.lessonId,
        sectionId: activeSectionId, cueId, mode, viewportClass: viewportClass(), fromSectionId, toSectionId: activeSectionId,
        completed: Boolean(saved?.completedAt), source: 'academy-reader', metadata: {},
      })
      if (cueId) actions.recordReaderEvent({
        sessionId: readerSessionId.current, eventType: 'cue-view', lessonId: readerDocument.lessonId,
        sectionId: activeSectionId, cueId, mode, viewportClass: viewportClass(), completed: Boolean(saved?.completedAt),
        source: 'academy-reader', metadata: {},
      })
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
  }, [actions, activeSectionId, mode, readerDocument, saved?.completedAt])

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

  useEffect(() => {
    if (!readerDocument) return
    const recordExit = (eventType: 'route-leave-incomplete' | 'pagehide-incomplete') => {
      if (completedRef.current || exitRecorded.current) return
      exitRecorded.current = true
      actions.recordMetric('reader.exit-incomplete')
      actions.recordReaderEvent({
        sessionId: readerSessionId.current, eventType, lessonId: readerDocument.lessonId,
        sectionId: lastMetricSection.current || initial.sectionId, mode: modeRef.current, viewportClass: viewportClass(),
        completed: false, source: 'academy-reader', metadata: {},
      })
    }
    const endSession = () => {
      if (sessionEnded.current) return
      sessionEnded.current = true
      actions.recordReaderEvent({
        sessionId: readerSessionId.current, eventType: 'session-end', lessonId: readerDocument.lessonId,
        sectionId: lastMetricSection.current || initial.sectionId, mode: modeRef.current, viewportClass: viewportClass(),
        completed: completedRef.current, source: 'academy-reader', metadata: {},
      })
    }
    const pagehide = () => { recordExit('pagehide-incomplete'); endSession() }
    window.addEventListener('pagehide', pagehide)
    return () => {
      window.removeEventListener('pagehide', pagehide)
      recordExit('route-leave-incomplete')
      endSession()
    }
  }, [actions, initial.sectionId, readerDocument])

  if (!descriptor || !material || !readerDocument) {
    return <section className="academy-empty-state"><h2>La lección no está disponible</h2><p>No se ha generado contenido de sustitución.</p></section>
  }

  const title = localize(snapshot.profile?.locale, descriptor.title)
  const activeSection = readerDocument.sections.find(({ sectionId }) => sectionId === activeSectionId) ?? readerDocument.sections[0]
  const bookmark = state?.bookmarks.find(({ context }) => context.lessonId === descriptor.id && context.sectionId === activeSection?.sectionId)
  const legacyLessonBookmark = state?.bookmarks.find(({ context }) => context.lessonId === descriptor.id && !context.sectionId)
  const storedReview = state?.editorialReviews.find(({ lessonId }) => lessonId === descriptor.id)
  const ownerReviewStatus = academyEditorialReviewStatus(readerDocument, storedReview)
  const editorialLabel = ownerReviewStatus === 'owner-reviewed' || ownerReviewStatus === 'stale-after-content-change'
    ? academyEditorialStatusLabel(ownerReviewStatus)
    : readerDocument.curation.method === 'codex-assisted-editorial-curation'
      ? academyEditorialStatusLabel('codex-assisted-curation')
      : academyEditorialStatusLabel('automated-structural-migration')
  const showVisualRail = mode === 'learn' && !mobileNarrative && activeSection?.visualCue.implementationStatus === 'implemented'
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
    setModeSelection({ locationKey: modeLocationKey, mode: next })
    actions.setPreferences({ lessonMode: academyLegacyModeForReader(next) })
    actions.recordMetric(`reader.mode.${next}`)
    actions.recordReaderEvent({
      sessionId: readerSessionId.current, eventType: 'mode-change', lessonId: descriptor.id,
      sectionId: activeSectionId, cueId: activeSection?.visualCue.cueId, mode: next, viewportClass: viewportClass(),
      completed, source: 'academy-reader', metadata: { previousMode: mode },
    })
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToSection(sectionToRestore, 0, 'instant'))
    })
  }
  const openOutline = () => {
    actions.recordMetric('reader.outline.open')
    actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'outline-open', lessonId: descriptor.id, sectionId: activeSectionId, mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {} })
    outlineDialog.current?.showModal()
  }
  const selectSection = (sectionId: string, mobile = false) => {
    actions.recordMetric('reader.outline.jump')
    actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'outline-jump', lessonId: descriptor.id, sectionId, fromSectionId: activeSectionId, toSectionId: sectionId, mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {} })
    manualSection.current = sectionId
    window.setTimeout(() => {
      if (manualSection.current === sectionId) manualSection.current = undefined
    }, 1_200)
    setActive({ locationKey: readerLocationKey, sectionId })
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
    actions.createNote({ title: `${title} · ${activeSection.title}`, body: noteBody, tags: ['lección'], context: { lessonId: descriptor.id, stepId: readerDocument.stepId, sectionId: activeSectionId, cueId: activeSection.visualCue.cueId } })
    actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'note-created', lessonId: descriptor.id, sectionId: activeSectionId, cueId: activeSection.visualCue.cueId, mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {} })
    setNoteBody('')
    setNoteOpen(false)
  }
  const finishLesson = () => {
    actions.completeLesson(descriptor.id, activeSectionId, readerDocument.documentVersion)
    actions.recordMetric('reader.explicit-completion')
    actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'explicit-completion', lessonId: descriptor.id, sectionId: activeSectionId, cueId: activeSection.visualCue.cueId, mode, viewportClass: viewportClass(), completed: true, source: 'academy-reader', metadata: {} })
    completedRef.current = true
    if (requiredPracticeBlocked) {
      setCompletionBlocked(true)
      return
    }
    const transition = academyLessonCompletionTransition(snapshot, state, descriptor.id)
    actions.recordMetric(transition.metric)
    if (transition.href.includes('/activity/')) actions.recordMetric('reader.practice.transition')
    if (transition.href.includes('/activity/')) actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'practice-transition', lessonId: descriptor.id, sectionId: activeSectionId, mode, viewportClass: viewportClass(), transitionTarget: transition.activityId, completed: true, source: 'academy-reader', metadata: {} })
    service.navigate(parseLearningLocation(new URL(transition.href, window.location.href)))
  }
  const recordReaderInteraction = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest('a,button')
    if (!target) return
    actions.recordMetric('reader.click')
    const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') ?? '' : ''
    if (href.includes('/glossary')) actions.recordMetric('reader.glossary.open')
    if (target.closest('.role-sources, .role-reference')) actions.recordMetric('reader.source.open')
    if (href.includes('/glossary')) actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'glossary-open', lessonId: descriptor.id, sectionId: activeSectionId, mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {} })
    if (target.closest('.role-sources, .role-reference')) actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'source-open', lessonId: descriptor.id, sectionId: activeSectionId, mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {} })
  }
  const recordVisualExpand = (cueId: string, sectionId: string) => actions.recordReaderEvent({
    sessionId: readerSessionId.current, eventType: 'visual-expand', lessonId: descriptor.id, sectionId, cueId,
    mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {},
  })

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
            <span><strong>Estado editorial:</strong> {editorialLabel}</span>
          </div>
        </div>
        <div className="academy-page-header__actions">
          <button className="academy-button is-secondary academy-reader-outline-button" ref={outlineButton} type="button" onClick={openOutline}><List size={15} /> Índice</button>
          <button className="academy-button is-secondary" type="button" onClick={() => bookmark
            ? actions.deleteBookmark(bookmark.id)
            : (() => {
                actions.createBookmark({
                  title: `${title} · ${activeSection.title}`,
                  href: `#/learning/lesson/${encodeURIComponent(descriptor.id)}?section=${encodeURIComponent(activeSection.sectionId)}`,
                  context: { lessonId: descriptor.id, stepId: readerDocument.stepId, sectionId: activeSection.sectionId, cueId: activeSection.visualCue.cueId },
                })
                actions.recordReaderEvent({ sessionId: readerSessionId.current, eventType: 'bookmark-created', lessonId: descriptor.id, sectionId: activeSection.sectionId, cueId: activeSection.visualCue.cueId, mode, viewportClass: viewportClass(), completed, source: 'academy-reader', metadata: {} })
              })()}>
            {bookmark ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}{bookmark ? 'Marcada' : 'Marcar'}
          </button>
          <button className="academy-button is-secondary" type="button" onClick={() => setNoteOpen((value) => !value)}><NotebookPen size={15} /> Nota</button>
        </div>
      </header>
      {legacyLessonBookmark && !bookmark && <p className="academy-reader-legacy-bookmark">Existe un marcador histórico de esta lección. Puedes conservarlo y añadir otro para el apartado actual.</p>}

      <div className="academy-reader-mode" role="group" aria-label="Modo del lector">
        <button type="button" aria-pressed={mode === 'learn'} onClick={() => setReaderMode('learn')}>Aprender</button>
        <button type="button" aria-pressed={mode === 'read'} onClick={() => setReaderMode('read')}>Lectura</button>
      </div>

      {noteOpen && <form className="academy-inline-note" onSubmit={createNote}><label htmlFor="academy-reader-note">Nota privada sobre el apartado activo</label><textarea id="academy-reader-note" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} autoFocus /><div><button type="button" onClick={() => setNoteOpen(false)}>Cancelar</button><button type="submit">Guardar</button></div></form>}

      {readerDocument.centralQuestion && <section className="academy-reader-question" aria-labelledby="academy-reader-question-title"><span className="academy-kicker">PREGUNTA CENTRAL</span><h2 id="academy-reader-question-title">{readerDocument.centralQuestion}</h2></section>}

      <div className={`academy-reader-layout ${showVisualRail ? 'has-visual' : 'no-visual'}`}>
        <aside className="academy-reader-outline">{outline()}</aside>
        <article id="academy-reader-document" className="academy-reader-document" tabIndex={-1}>
          {readerDocument.sections.map((section) => (
            <section id={section.sectionId} className={`academy-reader-section role-${section.role}`} data-source-block={section.sourceBlockId} key={section.sectionId}>
              {section.collapsible ? (
                <details>
                  <summary><span className="academy-kicker">{readerRoleLabels[section.role] ?? section.role.replaceAll('-', ' ')}</span><AcademySectionHeading level={section.headingLevel}>{section.title}</AcademySectionHeading></summary>
                  <AcademySafeMarkdown markdown={section.markdown} />
                </details>
              ) : (
                <>
                  <span className="academy-kicker">{readerRoleLabels[section.role] ?? section.role.replaceAll('-', ' ')}</span>
                  <AcademySectionHeading level={section.headingLevel}>{section.title}</AcademySectionHeading>
                  <AcademySafeMarkdown markdown={section.markdown} />
                </>
              )}
              {mode === 'learn' && mobileNarrative && section.sectionId === activeSectionId && section.visualCue.implementationStatus === 'implemented' && (
                <div id="academy-reader-active-visual" className="academy-reader-inline-visual">
                  <AcademyReaderVisual cue={section.visualCue} activities={material.activities} reducedMotion={snapshot.profile?.accessibility.reducedMotion ?? false} onExpand={() => recordVisualExpand(section.visualCue.cueId, section.sectionId)} />
                </div>
              )}
              {mode === 'read'
                && section.visualCue.implementationStatus === 'implemented'
                && ['inline-essential', 'inline-static-summary'].includes(section.visualCue.readingModePolicy ?? 'omit')
                && (
                  <div className="academy-reader-reading-visual" data-reading-policy={section.visualCue.readingModePolicy}>
                    <AcademyReaderVisual
                      cue={section.visualCue}
                      activities={material.activities}
                      reducedMotion
                      staticOnly={section.visualCue.kind === 'scene-3d' || section.visualCue.readingModePolicy === 'inline-static-summary'}
                      onExpand={() => recordVisualExpand(section.visualCue.cueId, section.sectionId)}
                    />
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
        {showVisualRail && <aside id="academy-reader-active-visual" className="academy-reader-narrative" aria-label="Narrativa visual sincronizada"><AcademyReaderVisual cue={activeSection.visualCue} activities={material.activities} reducedMotion={snapshot.profile?.accessibility.reducedMotion ?? false} onExpand={() => recordVisualExpand(activeSection.visualCue.cueId, activeSection.sectionId)} /></aside>}
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
