import { CheckCircle2, ChevronDown, ChevronRight, Circle, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { LearningApplicationSnapshot } from '../../application/service'
import { localize } from '../../application/i18n'
import { academyPathChapter, type AcademyLearnerChapter, type AcademyLearnerStage } from '../../academy/path/academyLearnerPath'
import type { AcademyChapterProgress, AcademyStageProgress } from '../../academy/path/academyPathProgress'
import { academyChapterHref } from '../../academy/path/academyPathLinks'

const stateLabels: Record<AcademyChapterProgress['state'], string> = {
  'not-started': 'No iniciada',
  available: 'Disponible',
  current: 'Actual',
  studying: 'Estudiando',
  practising: 'Practicando',
  demonstrated: 'Demostrada',
  consolidated: 'Consolidada',
  blocked: 'Bloqueada',
  'partial-content': 'Contenido parcial',
  planned: 'Planificada',
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
  const completedLessons = new Set(progress.studiedAnchorLessonIds)
  const completedActivities = new Set(progress.completedRequiredActivityIds)
  const groups = [
    { role: 'support', title: 'Profundizar' },
    { role: 'optional-branch', title: 'Casos y contexto' },
    { role: 'reference', title: 'Consultar' },
  ] as const
  const blocker = chapter.prerequisiteChapterIds.at(-1)
  const blockerTitle = blocker ? academyPathChapter(blocker)?.title ?? blocker : undefined
  return (
    <article className={`academy-chapter-card is-${progress.state}`} id={chapter.chapterId}>
      <button type="button" className="academy-chapter-card__toggle" onClick={onToggle} aria-expanded={expanded} aria-controls={`${chapter.chapterId}-body`}>
        <span className="academy-chapter-card__state">
          {progress.coreComplete ? <CheckCircle2 size={18} /> : progress.state === 'blocked' ? <LockKeyhole size={18} /> : <Circle size={18} />}
        </span>
        <span><strong>{chapter.title}</strong><small>{stateLabels[progress.state]} · {progress.anchorLessonsCompleted}/{progress.anchorLessonsTotal} anclas · {progress.requiredActivitiesCompleted}/{progress.requiredActivitiesTotal} prácticas</small></span>
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
              <div><strong>{chapter.coverageStatus === 'partial' ? 'Cobertura curricular parcial' : 'Revisión de fuentes pendiente'}</strong><span>{chapter.curationReason}</span></div>
            </aside>
          )}
          {progress.state === 'blocked' && blocker && (
            <p className="academy-path-blocker"><LockKeyhole size={15} /> Antes completa <a href={academyChapterHref(blocker)}>{blockerTitle}</a>. La Biblioteca sigue disponible.</p>
          )}
          <section className="academy-chapter-anchors">
            <h4>Recorrido principal</h4>
            {chapter.anchorLessonIds.map((lessonId, index) => {
              const required = chapter.requiredActivityIds[index]
              return (
                <div key={lessonId}>
                  <span>{completedLessons.has(lessonId) ? <CheckCircle2 size={16} /> : index + 1}</span>
                  <div><strong>{lessonTitle(lessonId)}</strong><small>{required && completedActivities.has(required) ? 'Lección y práctica completadas' : completedLessons.has(lessonId) ? 'Lección estudiada · práctica pendiente' : 'Lección pendiente'}</small></div>
                  <a href={`#/learning/lesson/${encodeURIComponent(lessonId)}`}>{completedLessons.has(lessonId) ? 'Repasar' : 'Abrir'}</a>
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
              <summary>Contenido planificado · {chapter.plannedContentRefs.length}</summary>
              <p>No son lecciones existentes y no cuentan para el progreso. Están documentadas en el blueprint editorial de etapa 5.</p>
            </details>
          )}
          {progress.benchEvidenceStatus.required && (
            <aside className="academy-bench-evidence"><ShieldCheck size={17} /><div><strong>Competencia de banco: {progress.benchEvidenceStatus.status === 'pending' ? 'evidencia P pendiente' : progress.benchEvidenceStatus.status}</strong><span>{progress.benchEvidenceStatus.note}</span></div></aside>
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
  return (
    <section className={`academy-stage-card is-${stageProgress.state}`} id={stage.stageId}>
      <button type="button" className="academy-stage-card__toggle" onClick={onToggleStage} aria-expanded={expanded} aria-controls={`${stage.stageId}-chapters`}>
        <span className="academy-stage-card__number">{stage.order}</span>
        <span><small>ETAPA {stage.order}</small><strong>{stage.title}</strong><em>{stageProgress.chaptersCompleted} de {stageProgress.chaptersTotal} capítulos core</em></span>
        <span className="academy-stage-card__status">{stageProgress.coreComplete ? 'Completada' : stageProgress.state === 'current' ? 'Actual' : stageProgress.state === 'blocked' ? 'Después' : 'Disponible'}</span>
        {expanded ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
      </button>
      {expanded && (
        <div id={`${stage.stageId}-chapters`} className="academy-stage-card__body">
          <p>{stage.promise}</p>
          <div className="academy-stage-outcome"><strong>Al terminar</strong><span>{stage.outcome}</span></div>
          {stage.coverageStatus === 'partial' && <aside className="academy-path-coverage"><CircleAlert size={17} /><div><strong>Cobertura parcial</strong><span>El progreso disponible se muestra separado de los ocho huecos planificados.</span></div></aside>}
          <div className="academy-stage-chapters">
            {chapters.map((chapter) => <ChapterCard key={chapter.chapterId} chapter={chapter} progress={chapterProgress.get(chapter.chapterId)!} snapshot={snapshot} expanded={expandedChapterId === chapter.chapterId} onToggle={() => onToggleChapter(chapter.chapterId)} />)}
          </div>
        </div>
      )}
    </section>
  )
}
