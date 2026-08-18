import { BookOpenCheck, LibraryBig, NotebookPen, ShieldCheck } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACADEMY_LEARNER_PATH } from '../../academy/path/academyLearnerPath'
import { ACADEMY_STAGE_0_TO_1_CHECKPOINT, ACADEMY_STAGE_2_FINAL_CHECKPOINT } from '../../academy/reader/academyPersonalCurriculum'
import { academyNextAction } from '../../academy/path/academyNextAction'
import { deriveAcademyPathProgress } from '../../academy/path/academyPathProgress'
import { useAcademyLocalState } from '../../academy/useAcademyLocalState'
import { useLearning } from '../LearningContext'
import { AcademyNextActionCard } from './AcademyNextActionCard'
import { AcademyStageCard } from './AcademyStageCard'
import './academy-path.css'

function PathPage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <div className="academy-page academy-path-page"><header className="academy-page-header"><div><span className="academy-kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></header>{children}</div>
}

export function AcademyPathHomeSurface() {
  const { snapshot } = useLearning()
  const { state } = useAcademyLocalState(snapshot.profile?.id, snapshot.profile?.educationalPreferences.academyStateV1)
  const progress = useMemo(() => deriveAcademyPathProgress(snapshot, state), [snapshot, state])
  const next = useMemo(() => academyNextAction(snapshot, state), [snapshot, state])
  const currentStage = ACADEMY_LEARNER_PATH.stages.find(({ stageId }) => stageId === progress.currentStageId)
  const currentChapter = ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === progress.currentChapterId)
  const lastNote = state?.notes[0]
  return (
    <PathPage eyebrow="TU ACADEMIA" title={`Hola, ${snapshot.profile?.displayName ?? 'perfil local'}`} description="Una ruta principal, una siguiente acción y toda la biblioteca disponible cuando la necesites.">
      <section className="academy-path-position" aria-label="Posición actual">
        <div><span>DÓNDE ESTÁS</span><strong>{currentStage ? `Etapa ${currentStage.order} · ${currentStage.shortTitle}` : 'Recorrido disponible completado'}</strong><small>{currentChapter?.title ?? (progress.curriculumComplete ? 'Currículo completo' : 'Queda cobertura planificada o pendiente de revisión')}</small></div>
        <a href="#/learning/my-learning">Ver las ocho etapas</a>
      </section>
      <AcademyNextActionCard action={next} />
      <section className="academy-path-home-secondary">
        <article><BookOpenCheck size={21} /><div><span>PROGRESO PRINCIPAL</span><strong>{progress.anchorLessonsCompleted}/{progress.anchorLessonsTotal} lecciones esenciales</strong><small>{progress.requiredActivitiesCompleted}/{progress.requiredActivitiesTotal} prácticas requeridas · {progress.stagesCompleted}/{progress.stagesTotal} etapas</small></div></article>
        <article><ShieldCheck size={21} /><div><span>COMPETENCIA DE BANCO</span><strong>{progress.benchEvidenceStatus.status === 'pending' ? 'Evidencia física pendiente' : progress.benchEvidenceStatus.status}</strong><small>Las sesiones virtuales no se cuentan como P.</small></div></article>
        {lastNote ? <article><NotebookPen size={21} /><div><span>ÚLTIMA NOTA</span><strong>{lastNote.title}</strong><small>{lastNote.body.slice(0, 100)}</small></div></article> : <article><LibraryBig size={21} /><div><span>BIBLIOTECA</span><strong>24 rutas conservadas</strong><small>Las especializaciones y los materiales de consulta no alteran tu progreso principal.</small></div></article>}
      </section>
      <a className="academy-path-library-link" href="#/learning/explore"><LibraryBig size={16} /> Explorar toda la biblioteca</a>
    </PathPage>
  )
}

export function AcademyPathSurface() {
  const { snapshot } = useLearning()
  const { state } = useAcademyLocalState(snapshot.profile?.id, snapshot.profile?.educationalPreferences.academyStateV1)
  const progress = useMemo(() => deriveAcademyPathProgress(snapshot, state), [snapshot, state])
  const requestedChapter = snapshot.location.query.chapter
  const requestedStage = snapshot.location.query.stage
  const initialChapter = requestedChapter && ACADEMY_LEARNER_PATH.chapters.some(({ chapterId }) => chapterId === requestedChapter)
    ? requestedChapter
    : progress.currentChapterId ?? ACADEMY_LEARNER_PATH.chapters[0]?.chapterId
  const initialStage = requestedStage && ACADEMY_LEARNER_PATH.stages.some(({ stageId }) => stageId === requestedStage)
    ? requestedStage
    : ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === initialChapter)?.stageId ?? progress.currentStageId
  const [expandedStageId, setExpandedStageId] = useState<string | undefined>(initialStage)
  const [expandedChapterId, setExpandedChapterId] = useState<string | undefined>(initialChapter)
  const linkedChapter = requestedChapter
    ? ACADEMY_LEARNER_PATH.chapters.find(({ chapterId }) => chapterId === requestedChapter)
    : undefined
  const visibleStageId = linkedChapter?.stageId ?? expandedStageId
  const visibleChapterId = linkedChapter?.chapterId ?? expandedChapterId

  useEffect(() => {
    if (!requestedChapter) return
    const frame = requestAnimationFrame(() => document.getElementById(requestedChapter)?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [requestedChapter])

  const chapterProgress = useMemo(() => new Map(progress.chapters.map((item) => [item.chapterId, item])), [progress.chapters])
  return (
    <PathPage eyebrow="MI RUTA" title={ACADEMY_LEARNER_PATH.title} description={ACADEMY_LEARNER_PATH.learnerGoal}>
      <section className="academy-path-summary">
        <div><span>RUTA PRINCIPAL</span><strong>{progress.stagesCompleted} de {progress.stagesTotal} etapas con contenido disponible cerrado</strong><small>{progress.curriculumComplete ? 'Currículo completo.' : `${progress.coveragePendingStageIds.length} etapa(s) conservan cobertura parcial, planificada o pendiente de revisión.`}</small></div>
        <div><span>BANCO</span><strong>{progress.benchEvidenceStatus.status === 'pending' ? 'P pendiente' : progress.benchEvidenceStatus.status}</strong><small>Avance conceptual y evidencia física se muestran por separado.</small></div>
      </section>
      <div className="academy-path-stages">
        {ACADEMY_LEARNER_PATH.stages.map((stage) => (
          <Fragment key={stage.stageId}>
            {stage.stageId === 'stage.1' && (
              <aside className="academy-stage-checkpoint" aria-labelledby="academy-stage-checkpoint-title">
                <div>
                  <span className="academy-kicker">PUNTO DE CONTROL RECOMENDADO</span>
                  <h2 id="academy-stage-checkpoint-title">{ACADEMY_STAGE_0_TO_1_CHECKPOINT.title}</h2>
                  <p>No bloquea tu ruta ni modifica tu progreso. Úsalo para decidir si quieres repasar antes de construir el mapa del reloj.</p>
                  <ul>{ACADEMY_STAGE_0_TO_1_CHECKPOINT.questions.map((question) => <li key={question}>{question}</li>)}</ul>
                </div>
                <nav aria-label="Acciones del punto de control">
                  <a className="academy-button" href="#/learning/my-learning?stage=stage.0">Revisar etapa 0</a>
                  <a className="academy-button is-primary" href="#/learning/my-learning?stage=stage.1&chapter=chapter.1.1">Continuar a etapa 1</a>
                  <a className="academy-button" href="#/learning/notebook">Anotar una duda</a>
                </nav>
              </aside>
            )}
            {stage.stageId === 'stage.3' && (
              <aside className="academy-stage-checkpoint" aria-labelledby="academy-stage-2-checkpoint-title">
                <div>
                  <span className="academy-kicker">CIERRE PERSONAL DE ETAPA 2</span>
                  <h2 id="academy-stage-2-checkpoint-title">{ACADEMY_STAGE_2_FINAL_CHECKPOINT.title}</h2>
                  <p>No bloquea la ruta, no crea mastery y no acredita destreza física. Sirve para comprobar si el mapa mecánico completo ya es utilizable.</p>
                  <ul>{ACADEMY_STAGE_2_FINAL_CHECKPOINT.questions.map((question) => <li key={question}>{question}</li>)}</ul>
                  <p><strong>Acciones disponibles:</strong> {ACADEMY_STAGE_2_FINAL_CHECKPOINT.actions.join(' · ')}.</p>
                </div>
                <nav aria-label="Acciones del cierre de etapa 2">
                  <a className="academy-button" href="#/learning/my-learning?stage=stage.2&chapter=chapter.2.1">Revisar etapa 2</a>
                  <a className="academy-button is-primary" href="#/learning/my-learning?stage=stage.3&chapter=chapter.3.1">Continuar a etapa 3</a>
                  <a className="academy-button" href="#/learning/notebook">Anotar una duda</a>
                </nav>
              </aside>
            )}
            <AcademyStageCard
              stage={stage}
              stageProgress={progress.stages.find(({ stageId }) => stageId === stage.stageId)!}
              chapters={stage.chapterIds.map((chapterId) => ACADEMY_LEARNER_PATH.chapters.find((chapter) => chapter.chapterId === chapterId)!).filter(Boolean)}
              chapterProgress={chapterProgress}
              snapshot={snapshot}
              expanded={visibleStageId === stage.stageId}
              expandedChapterId={visibleStageId === stage.stageId ? visibleChapterId : undefined}
              onToggleStage={() => setExpandedStageId((current) => current === stage.stageId ? undefined : stage.stageId)}
              onToggleChapter={(chapterId) => setExpandedChapterId((current) => current === chapterId ? undefined : chapterId)}
            />
          </Fragment>
        ))}
      </div>
    </PathPage>
  )
}
