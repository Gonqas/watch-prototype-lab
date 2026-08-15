import { CheckCircle2, Download, RotateCcw, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { academyLessonMaterial } from '../../academy/academyCatalog'
import type { AcademyEditorialReview, AcademyEditorialSectionReview } from '../../academy/academyLocalState'
import {
  ACADEMY_PERSONAL_PILOT_REVIEWS,
  academyPersonalPilotReview,
} from '../../academy/reader/academyPersonalCurriculum'
import { buildAcademyReaderDocument } from '../../academy/reader/academyReaderDocument'
import { academyReaderStableHash } from '../../academy/reader/academyReaderIdentity'
import {
  ACADEMY_PERSONAL_REVIEW_FLAG_LABELS,
  academyPersonalReviewStatus,
  academyPersonalReviewStatusLabel,
  createAcademyEditorialReviewDraft,
} from '../../academy/reader/academyReaderReview'
import type { AcademyPersonalReviewFlag, AcademyPersonalReviewStatus } from '../../academy/reader/academyReaderModel'
import { useAcademyLocalState } from '../../academy/useAcademyLocalState'
import { localize } from '../../application/i18n'
import { useLearning } from '../LearningContext'
import { AcademyReaderVisual } from './AcademyReaderVisual'
import { AcademySafeMarkdown } from './AcademySafeMarkdown'
import './academy-editorial-review.css'

const reviewFlags = Object.keys(ACADEMY_PERSONAL_REVIEW_FLAG_LABELS) as AcademyPersonalReviewFlag[]

const technicalStatusLabels = {
  'source-reviewed': 'Fuentes revisadas para el alcance de esta lección',
  'source-limited': 'Explicación limitada a lo que permiten las fuentes',
  'source-needed': 'Falta una fuente para completar una afirmación o procedimiento',
  'technical-conflict': 'Existe un conflicto técnico pendiente',
} as const

const visualDecisionLabels = {
  'content-specific-diagram': 'Diagrama específico',
  'content-specific-3d': 'Modelo 3D específico',
  'content-specific-comparison': 'Comparación específica',
  'content-specific-sequence': 'Secuencia específica',
  'essential-inline-image': 'Imagen esencial integrada',
  'text-sufficient': 'El texto es suficiente',
  'visual-gap': 'Falta apoyo visual',
  'source-review-required': 'El visual necesita comprobar su fuente',
} as const

const fidelityLabels = {
  conceptual: 'Modelo conceptual: enseña relaciones, no dimensiones reales',
  'calibre-specific': 'Representación vinculada a un calibre documentado',
  'not-applicable': 'No aplica',
} as const

function downloadReview(value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'revision-personal-academia.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

function sectionReview(
  review: AcademyEditorialReview,
  sectionId: string,
  sectionHash: string,
  now: string,
): AcademyEditorialSectionReview {
  return review.sectionReviews.find((item) => item.sectionId === sectionId) ?? {
    sectionId,
    sectionHash,
    flags: [],
    comment: '',
    approved: false,
    reviewedAt: now,
  }
}

export default function AcademyEditorialReviewSurface() {
  const { snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const availablePilots = ACADEMY_PERSONAL_PILOT_REVIEWS.filter(({ lessonId }) => (
    snapshot.product.lessons.some(({ id }) => id === lessonId)
  ))
  const requestedLessonId = snapshot.location.query.lesson
  const [selectedLessonId, setSelectedLessonId] = useState(
    availablePilots.some(({ lessonId }) => lessonId === requestedLessonId)
      ? requestedLessonId
      : availablePilots[0]?.lessonId ?? '',
  )
  const descriptor = snapshot.product.lessons.find(({ id }) => id === selectedLessonId)
  const material = academyLessonMaterial(snapshot.product, selectedLessonId)
  const readerDocument = useMemo(() => descriptor && material ? buildAcademyReaderDocument({
    material,
    title: localize(snapshot.profile?.locale, descriptor.title),
    purpose: localize(snapshot.profile?.locale, descriptor.purpose),
    locale: snapshot.profile?.locale,
    requiredActivityIds: descriptor.studyContract?.labActivityIds,
  }, { curationPhase: '0.14E' }) : undefined, [descriptor, material, snapshot.profile?.locale])
  const storedReview = state?.editorialReviews.find(({ lessonId }) => lessonId === selectedLessonId)
  const baseDraft = useMemo(() => readerDocument
    ? storedReview ?? createAcademyEditorialReviewDraft(readerDocument, undefined, '0.14E')
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

  if (!readerDocument || !draft || !material) {
    return <main className="academy-editorial-review"><p>No hay una lección piloto disponible.</p></main>
  }

  const activeSection = readerDocument.sections.find(({ sectionId }) => sectionId === activeSectionId)
    ?? readerDocument.sections[0]
  const curation = readerDocument.sectionCurations?.find(({ sectionId }) => sectionId === activeSection.sectionId)
  const activeSectionHash = curation?.sectionHash ?? academyReaderStableHash(activeSection.markdown)
  const activeReview = sectionReview(draft, activeSection.sectionId, activeSectionHash, new Date(0).toISOString())
  const personalStatus = academyPersonalReviewStatus(readerDocument, storedReview)
  const pilotReview = academyPersonalPilotReview(selectedLessonId)
  const sourceTitles = [...new Set(material.sources.map((source) => source.resource.title))]

  const updateSection = (patch: Partial<AcademyEditorialSectionReview>) => setDraft((current) => {
    const now = new Date().toISOString()
    const next = { ...activeReview, ...patch, sectionHash: activeSectionHash, reviewedAt: now }
    return {
      ...current,
      status: 'draft',
      personalStatus: 'not-reviewed',
      personalReviewedAt: undefined,
      ownerReviewedAt: undefined,
      updatedAt: now,
      sectionReviews: [
        next,
        ...current.sectionReviews.filter(({ sectionId }) => sectionId !== activeSection.sectionId),
      ],
    }
  })
  const persist = (review: AcademyEditorialReview) => {
    actions.saveEditorialReview(review)
    actions.recordReaderEvent({
      sessionId: `personal-review.${selectedLessonId}`,
      eventType: 'section-enter',
      lessonId: selectedLessonId,
      sectionId: activeSection.sectionId,
      source: 'editorial-review',
      metadata: { action: review.personalStatus ?? 'not-reviewed' },
    })
  }
  const markPersonalStatus = (nextStatus: AcademyPersonalReviewStatus) => {
    const now = new Date().toISOString()
    const next: AcademyEditorialReview = {
      ...draft,
      status: 'draft',
      personalStatus: nextStatus,
      personalReviewedAt: nextStatus === 'not-reviewed' ? undefined : now,
      ownerReviewedAt: undefined,
      version: '0.14E',
      updatedAt: now,
    }
    setDraft(next)
    persist(next)
  }
  const restartForCurrentContent = () => {
    if (!window.confirm('Tu revisión anterior se conservará hasta que guardes la nueva. ¿Preparar una revisión para el contenido actual?')) return
    setDraft(createAcademyEditorialReviewDraft(readerDocument, undefined, '0.14E'))
  }

  return (
    <main className="academy-editorial-review">
      <header className="academy-editorial-review__header">
        <div>
          <span>ACADEMIA · REVISIÓN PERSONAL</span>
          <h1>Comprueba qué entiendes y qué necesita otra explicación</h1>
          <p>Esta pantalla es solo para ti. Tu valoración ayuda a mejorar la claridad, pero no certifica la exactitud técnica ni una destreza física.</p>
        </div>
        <label>Lección
          <select value={selectedLessonId} onChange={(event) => setSelectedLessonId(event.target.value)}>
            {availablePilots.map(({ lessonId }) => {
              const pilotDescriptor = snapshot.product.lessons.find(({ id }) => id === lessonId)
              return <option value={lessonId} key={lessonId}>{pilotDescriptor ? localize(snapshot.profile?.locale, pilotDescriptor.title) : 'Lección no disponible'}</option>
            })}
          </select>
        </label>
      </header>

      <section className="academy-editorial-review__status" aria-label="Estado de revisión">
        <strong>{academyPersonalReviewStatusLabel(personalStatus)}</strong>
        <span>Estado técnico: {technicalStatusLabels[pilotReview?.technicalStatus ?? 'source-needed']}</span>
      </section>

      <section className="academy-editorial-review__question">
        <span>PREGUNTA CENTRAL</span>
        <h2>{readerDocument.centralQuestion ?? 'Esta lección todavía necesita una pregunta central más precisa.'}</h2>
        {readerDocument.whyNow && <p>{readerDocument.whyNow}</p>}
      </section>

      <div className="academy-editorial-review__layout">
        <nav aria-label="Apartados de la lección">
          <h2>Apartados</h2>
          {readerDocument.sections.map((section) => {
            const reviewed = draft.sectionReviews.find(({ sectionId }) => sectionId === section.sectionId)
            return (
              <button
                type="button"
                className={section.sectionId === activeSection.sectionId ? 'is-active' : undefined}
                aria-current={section.sectionId === activeSection.sectionId ? 'true' : undefined}
                onClick={() => setActiveSelection({ lessonId: selectedLessonId, sectionId: section.sectionId })}
                key={section.sectionId}
              >
                <span>{section.ordinal}</span>
                <span>{section.title}</span>
                {reviewed && (reviewed.flags.length > 0 || reviewed.comment) && <CheckCircle2 size={15} aria-label="Apartado valorado" />}
              </button>
            )
          })}
        </nav>

        <article className="academy-editorial-review__content">
          <header><span>APARTADO {activeSection.ordinal}</span><h2>{activeSection.title}</h2></header>
          <AcademySafeMarkdown markdown={activeSection.markdown} />
          <AcademyReaderVisual
            cue={activeSection.visualCue}
            activities={material.activities}
            reducedMotion={snapshot.profile?.accessibility.reducedMotion ?? false}
          />
          <dl>
            <div><dt>Apoyo visual</dt><dd>{visualDecisionLabels[curation?.visualDecision ?? activeSection.visualCue.visualDecision ?? 'text-sufficient']}</dd></div>
            <div><dt>Fuentes de la lección</dt><dd>{sourceTitles.join(', ') || 'No hay una fuente declarada para este material.'}</dd></div>
            <div><dt>Alcance</dt><dd>{fidelityLabels[curation?.fidelity ?? activeSection.visualCue.fidelity]}</dd></div>
            <div><dt>Limitaciones</dt><dd>{curation?.limitations.join(' ') || activeSection.visualCue.limitations.join(' ') || 'No se han declarado limitaciones adicionales.'}</dd></div>
          </dl>
        </article>

        <aside className="academy-editorial-review__form" aria-labelledby="review-section-title">
          <h2 id="review-section-title">¿Cómo te resulta este apartado?</h2>
          <div className="academy-editorial-review__flags">
            {reviewFlags.map((flag) => <label key={flag}>
              <input
                type="checkbox"
                checked={activeReview.flags.includes(flag)}
                onChange={() => updateSection({
                  flags: activeReview.flags.includes(flag)
                    ? activeReview.flags.filter((item) => item !== flag)
                    : [...activeReview.flags, flag],
                })}
              />
              {ACADEMY_PERSONAL_REVIEW_FLAG_LABELS[flag]}
            </label>)}
          </div>
          <label>Nota personal
            <textarea
              value={activeReview.comment}
              onChange={(event) => updateSection({ comment: event.target.value })}
              placeholder="Escribe la duda o el cambio que te ayudaría…"
            />
          </label>
        </aside>
      </div>

      <footer className="academy-editorial-review__actions">
        <button className="academy-button is-secondary" type="button" onClick={() => persist(draft)}><Save size={15} /> Guardar notas</button>
        <button className="academy-button is-primary" type="button" onClick={() => markPersonalStatus('clear')}><CheckCircle2 size={15} /> Me resulta clara</button>
        <button className="academy-button is-secondary" type="button" onClick={() => markPersonalStatus('needs-rework')}>Necesita ajustes</button>
        <button className="academy-button is-secondary" type="button" onClick={() => markPersonalStatus('not-reviewed')}><RotateCcw size={15} /> Revisar más adelante</button>
        {personalStatus === 'stale-after-content-change' && <button className="academy-button is-secondary" type="button" onClick={restartForCurrentContent}>Revisar la versión actual</button>}
        <button className="academy-button is-secondary" type="button" onClick={() => downloadReview({ format: 'wplab-personal-review', review: draft })}><Download size={15} /> Exportar mi revisión</button>
      </footer>
    </main>
  )
}
