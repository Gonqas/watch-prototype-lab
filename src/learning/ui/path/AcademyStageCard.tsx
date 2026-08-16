import { CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { LearningApplicationSnapshot } from '../../application/service'
import { localize } from '../../application/i18n'
import {
  ACADEMY_PLANNED_CONTENT,
  academyPathChapter,
  type AcademyLearnerChapter,
  type AcademyLearnerStage,
  type AcademyLearnerStep,
} from '../../academy/path/academyLearnerPath'
import type {
  AcademyChapterProgress,
  AcademyLearnerStepProgress,
  AcademyStageProgress,
} from '../../academy/path/academyPathProgress'
import { academyChapterHref } from '../../academy/path/academyPathLinks'

const exposureLabels = {
  'not-started': 'pendiente',
  'in-progress': 'en curso',
  studied: 'estudiada',
} as const
const practiceLabels = {
  'not-started': 'pendiente',
  'in-progress': 'en curso',
  satisfied: 'satisfecha',
} as const
const masteryLabels = {
  'not-assessed': 'no evaluada',
  'demonstration-due': 'demostración pendiente',
  demonstrated: 'demostrada',
  'retention-due': 'retención pendiente',
  retained: 'retenida',
} as const

function StepAction({
  step,
  progress,
  snapshot,
}: {
  step: AcademyLearnerStep
  progress: AcademyLearnerStepProgress
  snapshot: LearningApplicationSnapshot
}) {
  if (progress.exposureStatus !== 'studied') {
    return <a href={`#/learning/lesson/${encodeURIComponent(step.lessonId)}`}>Abrir lección</a>
  }
  const pendingId = progress.pendingRequiredActivityIds[0]
  if (pendingId) {
    const activity = snapshot.product.activities.find(({ id }) => id === pendingId)
    const session = [...snapshot.sessions.items]
      .filter(({ activityId, state }) => activityId === pendingId && !['completed', 'cancelled', 'failed', 'archived'].includes(state))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
    const demonstration = activity?.pedagogicalContract?.purpose === 'mastery-check'
      || activity?.pedagogicalContract?.assessmentIntent === 'demonstration'
    return (
      <a href={session
        ? `#/learning/recovery/${encodeURIComponent(session.id)}`
        : `#/learning/activity/${encodeURIComponent(pendingId)}${demonstration ? '?mode=demonstration' : ''}`}>
        {session ? 'Retomar práctica' : demonstration ? 'Demostrar' : 'Practicar'}
      </a>
    )
  }
  return <a className="is-secondary" href={`#/learning/lesson/${encodeURIComponent(step.lessonId)}`}>Repasar</a>
}

function ChapterCard({
  chapter,
  progress,
  snapshot,
  expanded,
  onToggle,
}: {
  chapter: AcademyLearnerChapter
  progress: AcademyChapterProgress
  snapshot: LearningApplicationSnapshot
  expanded: boolean
  onToggle: () => void
}) {
  const lessonTitle = (lessonId: string) => {
    const lesson = snapshot.product.lessons.find(({ id }) => id === lessonId)
    return lesson ? localize(snapshot.profile?.locale, lesson.title) : lessonId
  }
  const groups = [
    { role: 'support', title: 'Profundizar' },
    { role: 'optional-branch', title: 'Casos y contexto' },
    { role: 'reference', title: 'Consultar' },
  ] as const
  const blocker = chapter.prerequisiteChapterIds.at(-1)
  const blockerTitle = blocker ? academyPathChapter(blocker)?.title ?? blocker : undefined
  const chapterStatus = progress.masteryCoverageStatus === 'partial' && progress.masteryStatus === 'partially-retained'
    ? 'Evaluaciones disponibles retenidas · cobertura de evaluación parcial'
    : progress.masteryCoverageStatus === 'partial' && progress.masteryStatus === 'partially-demonstrated'
      ? 'Evaluaciones disponibles demostradas · cobertura de evaluación parcial'
      : progress.coreAvailableComplete
    ? progress.coverageStatus === 'complete'
      ? progress.masteryStatus === 'retained' ? 'Contenido disponible retenido' : 'Contenido disponible completado'
      : 'Contenido disponible completado · cobertura curricular parcial'
    : `${progress.anchorLessonsCompleted}/${progress.anchorLessonsTotal} teorías · ${progress.requiredActivitiesCompleted}/${progress.requiredActivitiesTotal} prácticas`
  return (
    <article className={`academy-chapter-card is-${progress.state}`} id={chapter.chapterId}>
      <button type="button" className="academy-chapter-card__toggle" onClick={onToggle} aria-expanded={expanded} aria-controls={`${chapter.chapterId}-body`}>
        <span className="academy-chapter-card__state">
          {progress.coreAvailableComplete ? <CheckCircle2 size={18} /> : progress.state === 'blocked' ? <LockKeyhole size={18} /> : <Circle size={18} />}
        </span>
        <span><strong>{chapter.title}</strong><small>{chapterStatus}</small></span>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {expanded && (
        <div id={`${chapter.chapterId}-body`} className="academy-chapter-card__body">
          <p>{chapter.description}</p>
          <dl>
            <div><dt>Por qué ahora</dt><dd>{chapter.whyNow}</dd></div>
            <div><dt>Resultado</dt><dd>{chapter.outcome}</dd></div>
          </dl>
          {chapter.coverageStatus !== 'complete' && (
            <aside className="academy-path-coverage" role="note">
              <CircleAlert size={17} />
              <div><strong>{progress.coreAvailableComplete ? 'Contenido disponible completado · cobertura curricular parcial' : chapter.coverageStatus === 'partial' ? 'Cobertura curricular parcial' : 'Revisión de fuentes pendiente'}</strong><span>{chapter.curationReason}</span></div>
            </aside>
          )}
          {progress.masteryCoverageStatus === 'partial' && (
            <aside className="academy-path-coverage" role="note">
              <CircleAlert size={17} />
              <div><strong>Cobertura de evaluación parcial</strong><span>Los resultados disponibles representan los pasos evaluados; no acreditan mastery global del capítulo.</span></div>
            </aside>
          )}
          {progress.state === 'blocked' && blocker && (
            <p className="academy-path-blocker"><LockKeyhole size={15} /> Antes completa <a href={academyChapterHref(blocker)}>{blockerTitle}</a>. La Biblioteca sigue disponible.</p>
          )}
          <section className="academy-chapter-anchors">
            <h4>Recorrido principal</h4>
            {chapter.steps.map((step) => {
              const stepProgress = progress.steps.find(({ stepId }) => stepId === step.stepId)!
              return (
                <div className="academy-path-step" key={step.stepId} data-step-id={step.stepId}>
                  <span>{stepProgress.coreAvailableComplete ? <CheckCircle2 size={16} /> : step.order}</span>
                  <div>
                    <strong>{lessonTitle(step.lessonId)}</strong>
                    <small>Teoría: {exposureLabels[stepProgress.exposureStatus]} · Práctica: {practiceLabels[stepProgress.practiceStatus]}</small>
                    {stepProgress.studyRecognition === 'legacy-inferred' && <small className="academy-path-step__legacy">Progreso reconocido de una actividad anterior; puedes revisar la teoría.</small>}
                    {stepProgress.masteryStatus !== 'not-assessed' && <small>Demostración: {masteryLabels[stepProgress.masteryStatus]}</small>}
                    {stepProgress.physicalEvidenceStatus !== 'not-required' && <small>Evidencia física: {stepProgress.physicalEvidenceStatus}</small>}
                  </div>
                  <StepAction step={step} progress={stepProgress} snapshot={snapshot} />
                </div>
              )
            })}
          </section>
          {groups.map(({ role, title }) => {
            const items = chapter.supportingLessons.filter((item) => item.role === role)
            return items.length > 0 ? (
              <details key={role} className="academy-chapter-support">
                <summary>{title} · {items.length}</summary>
                <div>{items.map((item) => <a key={item.lessonId} href={`#/learning/lesson/${encodeURIComponent(item.lessonId)}`}><span>{lessonTitle(item.lessonId)}</span><small>{item.reason}</small></a>)}</div>
              </details>
            ) : null
          })}
          {chapter.plannedContentRefs.length > 0 && (
            <details className="academy-chapter-support is-planned">
              <summary>Métodos de integración vinculados · {chapter.plannedContentRefs.length}</summary>
              <p>Conservan sus refs históricos, no son lecciones y no cuentan para el progreso. El método está disponible; los datos dependen de tu proyecto.</p>
              <div>{chapter.plannedContentRefs.map((ref) => {
                const planned = ACADEMY_PLANNED_CONTENT.find((item) => item.ref === ref)
                return <span key={ref}><strong>{planned?.title ?? ref}</strong><small>{planned?.summary ?? 'Pendiente de definición editorial.'}</small></span>
              })}</div>
            </details>
          )}
          {progress.benchEvidenceStatus.required && (
            <aside className="academy-bench-evidence"><ShieldCheck size={17} /><div><strong>Evidencia física: {progress.benchEvidenceStatus.status}</strong><span>{progress.benchEvidenceStatus.note}</span></div></aside>
          )}
        </div>
      )}
    </article>
  )
}

export function AcademyStageCard({
  stage,
  stageProgress,
  chapters,
  chapterProgress,
  snapshot,
  expanded,
  expandedChapterId,
  onToggleStage,
  onToggleChapter,
}: {
  stage: AcademyLearnerStage
  stageProgress: AcademyStageProgress
  chapters: AcademyLearnerChapter[]
  chapterProgress: Map<string, AcademyChapterProgress>
  snapshot: LearningApplicationSnapshot
  expanded: boolean
  expandedChapterId?: string
  onToggleStage: () => void
  onToggleChapter: (chapterId: string) => void
}) {
  const status = stageProgress.coreAvailableComplete
    ? stageProgress.coverageStatus === 'complete'
      ? 'Contenido disponible completado'
      : 'Disponible completado · cobertura parcial'
    : stageProgress.state === 'current' ? 'Actual' : stageProgress.state === 'blocked' ? 'Después' : 'Disponible'
  return (
    <section className={`academy-stage-card is-${stageProgress.state}`} id={stage.stageId}>
      <button type="button" className="academy-stage-card__toggle" onClick={onToggleStage} aria-expanded={expanded} aria-controls={`${stage.stageId}-chapters`}>
        <span className="academy-stage-card__number">{stage.order}</span>
        <span><small>ETAPA {stage.order}</small><strong>{stage.title}</strong><em>{stageProgress.chaptersCompleted} de {stageProgress.chaptersTotal} capítulos con contenido disponible cerrado</em></span>
        <span className="academy-stage-card__status">{status}</span>
        {expanded ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
      </button>
      {expanded && (
        <div id={`${stage.stageId}-chapters`} className="academy-stage-card__body">
          <p>{stage.promise}</p>
          <div className="academy-stage-outcome"><strong>Al terminar</strong><span>{stage.outcome}</span></div>
          {stage.coverageStatus === 'partial' && <aside className="academy-path-coverage"><CircleAlert size={17} /><div><strong>{stageProgress.coreAvailableComplete ? 'Contenido disponible completado · cobertura curricular parcial' : 'Cobertura parcial'}</strong><span>Los vacíos planificados permanecen fuera del progreso y se nombran dentro de sus capítulos.</span></div></aside>}
          <div className="academy-stage-chapters">
            {chapters.map((chapter) => <ChapterCard key={chapter.chapterId} chapter={chapter} progress={chapterProgress.get(chapter.chapterId)!} snapshot={snapshot} expanded={expandedChapterId === chapter.chapterId} onToggle={() => onToggleChapter(chapter.chapterId)} />)}
          </div>
        </div>
      )}
    </section>
  )
}
