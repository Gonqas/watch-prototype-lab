import { CheckCircle2, Download, RotateCcw, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { academyLessonMaterial } from '../../academy/academyCatalog'
import type { AcademyEditorialReview, AcademyEditorialReviewFlag, AcademyEditorialSectionReview } from '../../academy/academyLocalState'
import { buildAcademyReaderDocument } from '../../academy/reader/academyReaderDocument'
import { academyReaderStableHash } from '../../academy/reader/academyReaderIdentity'
import { ACADEMY_READER_PILOT } from '../../academy/reader/academyReaderPilot'
import {
  ACADEMY_EDITORIAL_REVIEW_FLAG_LABELS,
  academyEditorialReviewStatus,
  academyEditorialStatusLabel,
  createAcademyEditorialReviewDraft,
} from '../../academy/reader/academyReaderReview'
import { useAcademyLocalState } from '../../academy/useAcademyLocalState'
import { localize } from '../../application/i18n'
import { useLearning } from '../LearningContext'
import { AcademySafeMarkdown } from './AcademySafeMarkdown'
import { AcademyReaderVisual } from './AcademyReaderVisual'
import './academy-editorial-review.css'

const reviewFlags = Object.keys(ACADEMY_EDITORIAL_REVIEW_FLAG_LABELS) as AcademyEditorialReviewFlag[]

function downloadReview(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function sectionReview(review: AcademyEditorialReview, sectionId: string, sectionHash: string, now: string): AcademyEditorialSectionReview {
  return review.sectionReviews.find((item) => item.sectionId === sectionId) ?? {
    sectionId, sectionHash, flags: [], comment: '', approved: false, reviewedAt: now,
  }
}

export default function AcademyEditorialReviewSurface() {
  const { snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const availablePilots = ACADEMY_READER_PILOT.filter(({ lessonId }) => snapshot.product.lessons.some(({ id }) => id === lessonId))
  const requestedLessonId = snapshot.location.query.lesson
  const [selectedLessonId, setSelectedLessonId] = useState(
    availablePilots.some(({ lessonId }) => lessonId === requestedLessonId) ? requestedLessonId : availablePilots[0]?.lessonId ?? '',
  )
  const descriptor = snapshot.product.lessons.find(({ id }) => id === selectedLessonId)
  const material = academyLessonMaterial(snapshot.product, selectedLessonId)
  const readerDocument = useMemo(() => descriptor && material ? buildAcademyReaderDocument({
    material,
    title: localize(snapshot.profile?.locale, descriptor.title),
    purpose: localize(snapshot.profile?.locale, descriptor.purpose),
    locale: snapshot.profile?.locale,
    requiredActivityIds: descriptor.studyContract?.labActivityIds,
  }) : undefined, [descriptor, material, snapshot.profile?.locale])
  const storedReview = state?.editorialReviews.find(({ lessonId }) => lessonId === selectedLessonId)
  const baseDraft = useMemo(() => readerDocument
    ? storedReview ?? createAcademyEditorialReviewDraft(readerDocument)
    : undefined, [readerDocument, storedReview])
  const [drafts, setDrafts] = useState<Record<string, AcademyEditorialReview>>({})
  const draft = drafts[selectedLessonId] ?? baseDraft
  const [activeSelection, setActiveSelection] = useState({ lessonId: '', sectionId: '' })
  const activeSectionId = activeSelection.lessonId === selectedLessonId
    ? activeSelection.sectionId
    : readerDocument?.sections[0]?.sectionId ?? ''
  const setDraft = (update: AcademyEditorialReview | ((current: AcademyEditorialReview) => AcademyEditorialReview)) => {
    if (!draft) return
    setDrafts((current) => ({
      ...current,
      [selectedLessonId]: typeof update === 'function' ? update(current[selectedLessonId] ?? draft) : update,
    }))
  }

  if (!readerDocument || !draft || !material) return <main className="academy-editorial-review"><p>No hay una lección piloto disponible.</p></main>
  const activeSection = readerDocument.sections.find(({ sectionId }) => sectionId === activeSectionId) ?? readerDocument.sections[0]
  const curation = readerDocument.sectionCurations?.find(({ sectionId }) => sectionId === activeSection.sectionId)
  const activeSectionHash = curation?.sectionHash ?? academyReaderStableHash(activeSection.markdown)
  const activeReview = sectionReview(draft, activeSection.sectionId, activeSectionHash, new Date(0).toISOString())
  const status = academyEditorialReviewStatus(readerDocument, storedReview)
  const updateSection = (patch: Partial<AcademyEditorialSectionReview>) => setDraft((current) => {
    const now = new Date().toISOString()
    const next = { ...activeReview, ...patch, sectionHash: activeSectionHash, reviewedAt: now }
    return { ...current, status: 'draft', ownerReviewedAt: undefined, updatedAt: now, sectionReviews: [
      next, ...current.sectionReviews.filter(({ sectionId }) => sectionId !== activeSection.sectionId),
    ] }
  })
  const persist = (review: AcademyEditorialReview) => {
    actions.saveEditorialReview(review)
    actions.recordReaderEvent({
      sessionId: `editorial.${selectedLessonId}`, eventType: 'section-enter', lessonId: selectedLessonId,
      sectionId: activeSection.sectionId, source: 'editorial-review', metadata: { action: review.status },
    })
  }
  const approveLesson = () => {
    if (!window.confirm('Esta acción declara una revisión explícita del propietario para el hash actual. ¿Continuar?')) return
    const now = new Date().toISOString()
    const approved: AcademyEditorialReview = {
      ...draft,
      status: 'owner-reviewed',
      ownerReviewedAt: now,
      updatedAt: now,
      reviewedFields: ['centralQuestion', 'sections', 'text', 'visuals', 'sources', 'fidelity', 'limitations'],
    }
    setDraft(approved)
    persist(approved)
  }
  const reopen = () => {
    const now = new Date().toISOString()
    const reopened: AcademyEditorialReview = { ...draft, status: 'reopened', ownerReviewedAt: undefined, updatedAt: now }
    setDraft(reopened)
    persist(reopened)
  }

  return (
    <main className="academy-editorial-review">
      <header className="academy-editorial-review__header">
        <div><span>GESTIONAR · REVISIÓN EDITORIAL</span><h1>Validación propietaria del lector</h1><p>Esta superficie no reescribe la teoría ni cambia progreso. Todas las lecciones parten pendientes.</p></div>
        <label>Lección piloto<select value={selectedLessonId} onChange={(event) => setSelectedLessonId(event.target.value)}>{availablePilots.map(({ lessonId }) => {
          const pilotDescriptor = snapshot.product.lessons.find(({ id }) => id === lessonId)
          return <option value={lessonId} key={lessonId}>{pilotDescriptor ? localize(snapshot.profile?.locale, pilotDescriptor.title) : lessonId}</option>
        })}</select></label>
      </header>
      <section className="academy-editorial-review__status" aria-label="Estado de revisión">
        <strong>{academyEditorialStatusLabel(status)}</strong>
        <span>Contenido {readerDocument.contentHash}</span><span>Documento {readerDocument.documentVersion}</span><span>Actualizado {draft.updatedAt}</span>
      </section>
      <section className="academy-editorial-review__question"><span>PREGUNTA CENTRAL</span><h2>{readerDocument.centralQuestion ?? 'Pendiente de formulación editorial.'}</h2></section>
      <div className="academy-editorial-review__layout">
        <nav aria-label="Apartados de la lección"><h2>Apartados</h2>{readerDocument.sections.map((section) => {
          const reviewed = draft.sectionReviews.find(({ sectionId }) => sectionId === section.sectionId)
          return <button type="button" className={section.sectionId === activeSection.sectionId ? 'is-active' : undefined} aria-current={section.sectionId === activeSection.sectionId ? 'true' : undefined} onClick={() => setActiveSelection({ lessonId: selectedLessonId, sectionId: section.sectionId })} key={section.sectionId}><span>{section.ordinal}</span><span>{section.title}</span>{reviewed?.approved && <CheckCircle2 size={15} aria-label="Apartado aprobado" />}</button>
        })}</nav>
        <article className="academy-editorial-review__content">
          <header><span>{activeSection.role}</span><h2>{activeSection.title}</h2><code>{activeSection.sectionId}</code></header>
          <AcademySafeMarkdown markdown={activeSection.markdown} />
          <AcademyReaderVisual cue={activeSection.visualCue} activities={material.activities} reducedMotion={snapshot.profile?.accessibility.reducedMotion ?? false} />
          <dl>
            <div><dt>Decisión</dt><dd>{curation?.visualDecision ?? activeSection.visualCue.visualDecision ?? 'text-sufficient'}</dd></div>
            <div><dt>Fuente</dt><dd>{curation?.sourceBasis.join(', ') || readerDocument.sourceIds.join(', ') || 'Sin fuente visual declarada'}</dd></div>
            <div><dt>Fidelidad</dt><dd>{curation?.fidelity ?? activeSection.visualCue.fidelity}</dd></div>
            <div><dt>Limitaciones</dt><dd>{curation?.limitations.join(' ') || activeSection.visualCue.limitations.join(' ') || 'No declaradas.'}</dd></div>
            <div><dt>Curación</dt><dd>{curation?.curationMethod ?? activeSection.curationMethod}</dd></div>
            <div><dt>Hash del apartado</dt><dd><code>{activeSectionHash}</code></dd></div>
          </dl>
        </article>
        <aside className="academy-editorial-review__form" aria-labelledby="review-section-title">
          <h2 id="review-section-title">Valoración del apartado</h2>
          <div className="academy-editorial-review__flags">{reviewFlags.map((flag) => <label key={flag}><input type="checkbox" checked={activeReview.flags.includes(flag)} onChange={() => updateSection({ flags: activeReview.flags.includes(flag) ? activeReview.flags.filter((item) => item !== flag) : [...activeReview.flags, flag] })} />{ACADEMY_EDITORIAL_REVIEW_FLAG_LABELS[flag]}</label>)}</div>
          <label>Comentario local<textarea value={activeReview.comment} onChange={(event) => updateSection({ comment: event.target.value })} placeholder="Duda, corrección propuesta o motivo…" /></label>
          <button className="academy-button is-secondary" type="button" onClick={() => updateSection({ approved: !activeReview.approved })}>{activeReview.approved ? 'Reabrir apartado' : 'Aprobar apartado'}</button>
        </aside>
      </div>
      <footer className="academy-editorial-review__actions">
        <button className="academy-button is-secondary" type="button" onClick={() => persist(draft)}><Save size={15} /> Guardar borrador</button>
        <button className="academy-button is-primary" type="button" onClick={approveLesson}><CheckCircle2 size={15} /> Aprobar lección</button>
        <button className="academy-button is-secondary" type="button" onClick={reopen}><RotateCcw size={15} /> Reabrir revisión</button>
        <button className="academy-button is-secondary" type="button" onClick={() => downloadReview(`revision-${selectedLessonId}.json`, { format: 'wplab-owner-review', review: draft })}><Download size={15} /> Exportar revisión</button>
        <button className="academy-button is-secondary" type="button" onClick={() => downloadReview(`patch-editorial-${selectedLessonId}.json`, { format: 'wplab-editorial-patch', lessonId: selectedLessonId, baseContentHash: draft.contentHash, sectionReviews: draft.sectionReviews.map(({ sectionId, sectionHash, flags, comment }) => ({ sectionId, sectionHash, flags, comment })) })}><Download size={15} /> Exportar patch</button>
      </footer>
    </main>
  )
}
