import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Bookmark,
  BookmarkCheck,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Download,
  DraftingCompass,
  Eye,
  Factory,
  FileCheck2,
  Gauge,
  Layers3,
  ListChecks,
  Microscope,
  NotebookPen,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  Trash2,
  Wrench,
} from 'lucide-react'
import {
  Fragment,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import type { MasteryState } from '../assessment'
import {
  academyMilestoneJourney,
  LEARNING_CYCLE,
} from '../academy/academyPedagogy'
import {
  academyActivityAchievement,
  academyActivitySatisfiesProgression,
  academyFixtureSummaries,
  academyGlossaryEntries,
  academyLessonMaterial,
  academyRouteProgress,
  academyRoutePrerequisiteStatus,
  academyRouteTree,
  buildAcademySearchIndex,
  humanizeLearningId,
  realAcademyRoutes,
  type AcademySearchEntry,
  type AcademySearchKind,
} from '../academy/academyCatalog'
import {
  type AcademyLessonMode,
  type AcademyNoteContext,
} from '../academy/academyLocalState'
import { buildAcademyLearnerModel } from '../academy/academyPersonalization'
import { useAcademyLocalState } from '../academy/useAcademyLocalState'
import AcademyIntegrationLabSurface from './AcademyIntegrationLabSurface'
import { effectiveLessonPrerequisiteConceptIds } from '../academy/path/academyPathPrerequisites'
import { academyPathLocationForStepLesson } from '../academy/path/academyLearnerPath'
import { segmentLessonBlock } from '../academy/lessonSegmentation'
import {
  ARCHITECTURE_FAMILIES,
  COMPARATIVE_MOVEMENT_CASES,
  comparativeSource,
} from '../atlas/comparativeAtlas'
import {
  learningDate,
  learningNumber,
  localize,
  normalizeLearningLocale,
} from '../application/i18n'
import { parseLearningLocation } from '../application/navigation'
import type { LearningActivityDescriptor, LearningProductIndex } from '../product/demoPackage'
import { INTEGRATED_LEARNING_CONTENT } from '../product/integratedContent'
import type { EducationalSceneGraph, EducationalVisualState } from '../visual/model'
import { createSceneComposition } from '../visual/sceneFixtures'
import { useLearning } from './LearningContext'
import { AcademyLibrarySurface } from './library/AcademyLibrarySurface'
import { AcademyReaderMetricsPanel } from './reader/AcademyReaderMetricsPanel'
import { AcademyPathBreadcrumbs } from './path/AcademyPathBreadcrumbs'
import { academyLessonCompletionTransition, academyModuleEntryHref } from '../academy/path/academyPathLinks'
import { AcademyPathHomeSurface, AcademyPathSurface } from './path/AcademyPathSurface'
import {
  friendlyAssessmentSummary,
  friendlyAssessmentIntent,
  friendlyFidelity,
  friendlyDifficulty,
  friendlyEvidenceLevel,
  friendlyLearningTerm,
  friendlyPedagogicalPurpose,
  friendlyReconstructionLevel,
  friendlyRecommendationReason,
} from './learningUiLanguage'
import './academy-surfaces.css'
import './academy-journey.css'

const EngineeringLabSurface = lazy(() => import('./EngineeringLabSurface'))
const MetrologySurface = lazy(() => import('./MetrologySurface'))
const EducationalViewport = lazy(() => import('./EducationalViewport'))
const AcademyContinuousLessonSurface = lazy(() => import('./reader/AcademyContinuousLessonSurface'))
const AcademyEditorialReviewSurface = lazy(() => import('./reader/AcademyEditorialReviewSurface'))
const AcademyUsabilityHarnessSurface = lazy(() => import('./reader/AcademyUsabilityHarnessSurface'))

const masteryLabels: Record<MasteryState, string> = {
  not_started: 'Sin iniciar',
  introduced: 'Presentada',
  practising: 'En práctica',
  demonstrated: 'Demostrada',
  retained: 'Consolidada',
}

function masteryLabel(value: string): string {
  return value in masteryLabels
    ? masteryLabels[value as MasteryState]
    : humanizeLearningId(value)
}

function competencyLabel(competencyId: string, locale?: string): string {
  const competency = INTEGRATED_LEARNING_CONTENT
    .flatMap(({ pack }) => pack.competencies)
    .find(({ id }) => id === competencyId)
  if (competency?.authoring) return localize(locale, competency.authoring.title)
  return competency?.title ?? friendlyLearningTerm(competencyId)
}

function prerequisiteLabel(id: string, product: LearningProductIndex, locale?: string): string {
  const knowledge = product.knowledgeNodes.find((item) => item.id === id)
  if (knowledge) return localize(locale, knowledge.title)
  const module = product.modules.find((item) => item.id === id)
  if (module) return localize(locale, module.title)
  const lesson = product.lessons.find((item) => item.id === id)
  if (lesson) return localize(locale, lesson.title)
  const route = product.routes.find((item) => item.id === id)
  if (route) return localize(locale, route.title)
  if (id.startsWith('competency.')) return competencyLabel(id, locale)
  return friendlyLearningTerm(id)
}

const activityTypeLabels: Record<LearningActivityDescriptor['activityType'], string> = {
  'observation-3d': 'Observación visual',
  prediction: 'Predicción',
  'guided-practice': 'Práctica guiada',
  comparison: 'Comparación',
  explanation: 'Explicación',
}

const searchKindLabels: Record<AcademySearchKind, string> = {
  route: 'Rutas',
  module: 'Módulos',
  lesson: 'Lecciones',
  activity: 'Actividades',
  fixture: 'Modelos',
  part: 'Piezas',
  term: 'Glosario',
  source: 'Fuentes',
  note: 'Notas',
}

function AcademyPage({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="academy-page">
      {breadcrumbs}
      <header className="academy-page-header">
        <div>
          <span className="academy-kicker">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions && <div className="academy-page-header__actions">{actions}</div>}
      </header>
      {children}
    </div>
  )
}

function EmptyState({
  icon: Icon = CircleAlert,
  title,
  detail,
  action,
}: {
  icon?: typeof CircleAlert
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <section className="academy-empty-state">
      <Icon size={30} aria-hidden="true" />
      <div><h2>{title}</h2><p>{detail}</p></div>
      {action}
    </section>
  )
}

function ProgressMeter({ value, maximum, label }: { value: number; maximum: number; label: string }) {
  const percentage = maximum ? Math.round((value / maximum) * 100) : 0
  return (
    <div className="academy-meter">
      <div><span>{label}</span><strong>{value} de {maximum}</strong></div>
      <progress max={Math.max(1, maximum)} value={value} aria-label={`${label}: ${percentage}%`} />
    </div>
  )
}

function MasteryPill({ state }: { state: MasteryState }) {
  const icons: Record<MasteryState, typeof Circle> = {
    not_started: Circle,
    introduced: BookOpen,
    practising: RotateCcw,
    demonstrated: CheckCircle2,
    retained: ShieldCheck,
  }
  const Icon = icons[state]
  return <span className={`academy-mastery is-${state}`}><Icon size={13} />{masteryLabels[state]}</span>
}

function activityHref(activityId: string, mode?: string): string {
  const adaptiveMode = mode === 'demonstration' || mode === 'retention' || mode === 'transfer' || mode === 'remediation'
    ? `?mode=${mode}`
    : ''
  return `#/learning/activity/${encodeURIComponent(activityId)}${adaptiveMode}`
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function activityCardPresentation(
  snapshot: ReturnType<typeof useLearning>['snapshot'],
  activity: LearningActivityDescriptor,
): {
  state: 'not-started' | 'in-progress' | 'completed' | 'demonstrated' | 'transferred' | 'retained'
  label: string
  actionLabel: string
  sessionId?: string
} {
  const relevant = snapshot.sessions.items
    .filter((session) => session.activityId === activity.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  const recoverable = relevant.find(({ state }) => ['active', 'paused', 'suspended', 'interrupted', 'recovering'].includes(state))
  if (recoverable) return { state: 'in-progress', label: 'En curso', actionLabel: 'Continuar intento', sessionId: recoverable.id }
  const achievement = academyActivityAchievement(snapshot, activity)
  if (achievement === 'retained') return { state: achievement, label: 'Consolidada', actionLabel: 'Repasar' }
  if (achievement === 'transferred') return { state: achievement, label: 'Transferida', actionLabel: 'Practicar de nuevo' }
  if (achievement === 'demonstrated') return { state: achievement, label: 'Demostrada', actionLabel: 'Practicar de nuevo' }
  if (achievement === 'completed') return { state: achievement, label: 'Completada', actionLabel: 'Repetir práctica' }
  if (achievement === 'in-progress' && relevant.some(({ state }) => state === 'completed')) {
    return { state: achievement, label: 'Intentada · necesita repaso', actionLabel: 'Revisar práctica' }
  }
  if (achievement === 'in-progress') return { state: achievement, label: 'Iniciada', actionLabel: 'Revisar práctica' }
  return { state: 'not-started', label: 'Sin iniciar', actionLabel: 'Preparar práctica' }
}

type ActivityReadiness = { status: 'ready' | 'blocked'; reason?: string }

function ActivityCard({
  activity,
  compact = false,
  readiness,
}: {
  activity: LearningActivityDescriptor
  compact?: boolean
  readiness?: ActivityReadiness
}) {
  const { snapshot } = useLearning()
  const status = activityCardPresentation(snapshot, activity)
  const fidelity = friendlyFidelity(activity.fidelity)
  const assessment = friendlyAssessmentIntent(activity.pedagogicalContract?.assessmentIntent)
  const actionHref = status.sessionId
    ? `#/learning/recovery/${encodeURIComponent(status.sessionId)}`
    : activityHref(activity.id, snapshot.location.query.mode)
  return (
    <article className={`academy-activity-card ${compact ? 'is-compact' : ''} is-${status.state}`}>
      <header>
        <span>{friendlyPedagogicalPurpose(activity.pedagogicalContract?.purpose)}</span>
        <span><Clock3 size={13} /> {activity.durationMinutes} min</span>
      </header>
      <h3>{localize(snapshot.profile?.locale, activity.title)}</h3>
      <div className="academy-activity-state" data-state={status.state}>
        {status.state === 'not-started' ? <Circle size={14} /> : status.state === 'in-progress' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
        <span>{status.label}</span>
      </div>
      {readiness?.status === 'blocked' && <p className="academy-activity-card__readiness"><CircleAlert size={14} />{readiness.reason ?? 'Necesita una explicación o ruta anterior.'}</p>}
      {!compact && <p>{friendlyRecommendationReason(localize(snapshot.profile?.locale, activity.description))}</p>}
      {!compact && (
        <p className="academy-activity-card__assessment">
          <ShieldCheck size={14} />
          <span><strong>{assessment.label}.</strong> {assessment.detail}</span>
        </p>
      )}
      <div className="academy-tag-row">
        <span>{friendlyLearningTerm(activity.subsystem)}</span>
        {activity.comparativeArchitectureContract && <span>Comparación documentada</span>}
        {activity.serviceProcedureContract && <span>Procedimiento y resultados</span>}
        {activity.manufacturingContract && <span>Plan de fabricación</span>}
        {activity.personalWatchDesignContract && <span>Puerta de diseño</span>}
        {activity.validationContract && <span>Protocolo de validación</span>}
        <span>{activity.offline ? 'Disponible sin conexión' : 'Requiere conexión'}</span>
        <span title={fidelity.summary}>{friendlyEvidenceLevel(activity.pedagogicalContract?.evidenceLevel)}</span>
      </div>
      <footer>
        {status.sessionId && <a href={activityHref(activity.id, snapshot.location.query.mode)}>Ver preparación</a>}
        <a className="academy-activity-card__primary" href={actionHref}>
          {status.sessionId ? <RotateCcw size={15} /> : <Play size={15} />}
          {readiness?.status === 'blocked' ? 'Revisar requisitos' : status.actionLabel}
        </a>
      </footer>
    </article>
  )
}

function LessonModelPreview({ activity, label }: { activity?: LearningActivityDescriptor; label: string }) {
  const { snapshot } = useLearning()
  const reducedMotion = snapshot.profile?.accessibility.reducedMotion ?? false
  const [preview, setPreview] = useState<{ graphs: EducationalSceneGraph[]; state: EducationalVisualState }>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let dispose: (() => Promise<void>) | undefined
    if (!activity?.fixtureBinding) return () => undefined
    void createSceneComposition(activity.fixtureBinding, reducedMotion)
      .then((composition) => {
        dispose = () => composition.dispose()
        if (!active) return composition.dispose()
        setPreview({
          graphs: composition.mounted().map(({ sceneGraph }) => sceneGraph),
          state: composition.captureSnapshot().state,
        })
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
      if (dispose) void dispose()
    }
  }, [activity?.fixtureBinding, reducedMotion])

  if (!activity?.fixtureBinding) return <p className="academy-model-preview__status">Esta lección no declara un modelo 3D. La explicación y su descripción accesible siguen disponibles.</p>
  if (failed) return <p className="academy-model-preview__status" role="status">No se pudo cargar la vista estática. Puedes seguir leyendo y revisar el recurso desde la ficha de práctica.</p>
  if (!preview) return <div className="academy-model-preview__status" role="status"><RotateCcw className="spin" size={17} /> Preparando vista estática…</div>
  return (
    <Suspense fallback={<div className="academy-model-preview__status" role="status">Preparando el visor…</div>}>
      <EducationalViewport
        graphs={preview.graphs}
        state={preview.state}
        ariaLabel={`${label}. Vista estática de estudio; la interacción se habilita en la práctica.`}
        disabled
      />
    </Suspense>
  )
}


function RouteSurface() {
  const { snapshot } = useLearning()
  const tree = academyRouteTree(snapshot.product, snapshot.location.id ?? '')
  if (!tree) return <NotFoundSurface />
  const locale = snapshot.profile?.locale
  const progress = academyRouteProgress(snapshot, tree.route.id)
  const prerequisiteStatus = academyRoutePrerequisiteStatus(snapshot, tree.route.id)
  const missingPrerequisiteRoutes = prerequisiteStatus.missingRouteIds.flatMap((id) => {
    const route = snapshot.product.routes.find((candidate) => candidate.id === id)
    return route ? [{ id, title: localize(snapshot.profile?.locale, route.title) }] : []
  })
  const journey = academyMilestoneJourney(snapshot, tree.route)
  const nextLearningUnit = progress.nextLearningUnit
  const activities = tree.activityIds.flatMap((id) => {
    const activity = snapshot.product.activities.find((item) => item.id === id)
    return activity ? [activity] : []
  })
  const duration = activities.reduce((total, activity) => total + activity.durationMinutes, 0)
  const labs = [
    activities.some(({ workbenchContract }) => workbenchContract) ? 'Mesa virtual' : undefined,
    activities.some(({ mechanicalLabContract }) => mechanicalLabContract) ? 'Laboratorio mecánico' : undefined,
    activities.some(({ calibreLabContract }) => calibreLabContract) ? 'Laboratorio de calibre' : undefined,
  ].filter((value): value is string => Boolean(value))
  const hasComparativeStudies = activities.some(({ comparativeArchitectureContract }) => comparativeArchitectureContract)
  const hasServiceProcedures = activities.some(({ serviceProcedureContract }) => serviceProcedureContract)
  const hasManufacturingPlans = activities.some(({ manufacturingContract }) => manufacturingContract)
  const hasDesignGates = activities.some(({ personalWatchDesignContract }) => personalWatchDesignContract)
  const hasValidationProtocols = activities.some(({ validationContract }) => validationContract)
  const routeResources = hasManufacturingPlans
    ? 'Planos, referencias geométricas, procesos, riesgos, inspecciones y criterios de aceptación'
    : hasDesignGates
      ? 'Pliego, interfaces, alternativas, decisiones, riesgos y planes de verificación'
      : hasValidationProtocols
        ? 'Protocolos, perfiles, tareas, matrices y actas de hallazgos'
        : hasServiceProcedures
          ? 'Procedimientos, fuentes y plantillas de resultados'
    : hasComparativeStudies
      ? 'Casos documentales y modelos existentes cuando están disponibles'
      : tree.route.movementIds.map(friendlyLearningTerm).join(', ')
  const routePractice = hasManufacturingPlans
    ? 'Planificación de procesos y revisión de fabricabilidad sin declarar trabajo físico realizado'
    : hasDesignGates
      ? 'Revisiones de diseño desde movimiento adquirido hasta arquitectura propia'
      : hasValidationProtocols
        ? 'Pruebas independientes de exactitud, uso, transferencia, accesibilidad y retención'
        : hasServiceProcedures
          ? 'Planificación, riesgos, inspección, aceptación y revisión humana'
    : hasComparativeStudies
      ? 'Comparación guiada de hechos, relaciones, compromisos y desconocidos'
      : labs.join(', ') || 'Modelos interactivos y actividades guiadas'
  const routeScope = hasManufacturingPlans
    ? 'La Academia prepara el expediente; taller, seguridad, medición y aceptación se realizan sobre recursos reales.'
    : hasDesignGates
      ? 'Superar una puerta digital no declara el reloj fabricable ni modifica el proyecto técnico.'
      : hasValidationProtocols
        ? 'Los hallazgos críticos bloquean la liberación y la decisión final exige revisión humana.'
        : hasServiceProcedures
          ? 'Un resultado digital no acredita una intervención física.'
    : hasComparativeStudies
      ? 'No se genera geometría ausente ni se transfieren dimensiones entre calibres.'
      : tree.route.fidelity ? friendlyFidelity(tree.route.fidelity).summary : 'Se explica en cada actividad'
  return (
    <AcademyPage
      eyebrow="RUTA FORMATIVA"
      title={localize(locale, tree.route.title)}
      description={friendlyRecommendationReason(localize(locale, tree.route.purpose))}
      actions={prerequisiteStatus.ready && nextLearningUnit ? (
        <a className="academy-button is-primary" href={nextLearningUnit.href}>
          {nextLearningUnit.kind === 'activity'
            ? nextLearningUnit.reason === 'resume' ? 'Retomar práctica' : 'Continuar práctica'
            : 'Empezar por la explicación'}
          <ArrowRight size={16} />
        </a>
      ) : missingPrerequisiteRoutes[0] ? (
        <a className="academy-button is-primary" href={`#/learning/route/${encodeURIComponent(missingPrerequisiteRoutes[0].id)}`}>
          Completar primero: {missingPrerequisiteRoutes[0].title} <ArrowRight size={16} />
        </a>
      ) : undefined}
    >
      <section className="academy-route-overview">
        <div>
          <ProgressMeter value={progress.completedActivities} maximum={progress.totalActivities} label="Prácticas completadas" />
          <div className="academy-stat-row">
            <span><strong>{tree.modules.length}</strong> módulos</span>
            <span><strong>{tree.modules.reduce((sum, item) => sum + item.lessons.length, 0)}</strong> lecciones</span>
            <span><strong>{duration}</strong> min estimados</span>
            {progress.totalDemonstrationActivities > 0 && <span><strong>{progress.completedDemonstrationActivities}/{progress.totalDemonstrationActivities}</strong> demostraciones</span>}
          </div>
          {progress.routeComplete && <p><CheckCircle2 size={16} /> Ruta completada: prácticas y demostraciones requeridas superadas.</p>}
        </div>
        <div className="academy-route-overview__study">
          <span className="academy-kicker">CÓMO SE ESTUDIA</span>
          <h2>Explicación, ejemplo y práctica</h2>
          <p>La ruta presenta la teoría antes de pedirte una respuesta. Puedes detenerte, tomar notas y volver a cualquier lección.</p>
          <details>
            <summary>Recursos, alcance y fuentes</summary>
            <dl>
              <div><dt>Nivel</dt><dd>{friendlyDifficulty(tree.route.difficulty)}</dd></div>
              <div><dt>Recursos</dt><dd>{routeResources}</dd></div>
              <div><dt>Práctica</dt><dd>{routePractice}</dd></div>
              <div><dt>Límites</dt><dd>{routeScope}</dd></div>
              <div><dt>Fuentes</dt><dd>{tree.route.sourceLabels.join(', ') || 'Declaradas en cada lección'}</dd></div>
              <div><dt>Disponibilidad</dt><dd>Local y sin conexión</dd></div>
            </dl>
          </details>
        </div>
      </section>
      <section className="academy-prerequisite-note">
        <BookOpenCheck size={18} />
        <div>
          <strong>{prerequisiteStatus.ready ? 'Ruta disponible' : 'Ruta de estudio bloqueada'}</strong>
          <p>{prerequisiteStatus.ready
            ? tree.route.prerequisiteNodeIds.length
              ? `Ya están cubiertas las rutas anteriores. Dentro de esta ruta se comprobarán también: ${[...new Set(tree.route.prerequisiteNodeIds.map((id) => prerequisiteLabel(id, snapshot.product, locale)))].join(', ')}.`
              : 'Puedes empezar aquí. Cada lección presenta primero la idea y después propone una práctica.'
            : `Puedes consultar la teoría, pero las prácticas no generarán progreso hasta completar: ${missingPrerequisiteRoutes.map(({ title }) => title).join(', ')}.`}</p>
        </div>
      </section>
      {journey.length > 0 && (
        <details className="academy-gold-path academy-gold-path--collapsed">
          <summary>Ver los {journey.length} hitos y cómo se comprueba el progreso</summary>
          <ol>
            {journey.map((milestone) => (
              <li className={`is-${milestone.status}`} key={milestone.id}>
                <div className="academy-gold-path__index">
                  {milestone.status === 'completed' ? <CheckCircle2 size={18} /> : milestone.order}
                </div>
                <div>
                  <span>{milestone.status === 'current' ? 'AHORA' : milestone.status === 'completed' ? 'COMPLETADO' : milestone.status === 'locked' ? 'DESPUÉS' : 'DISPONIBLE'}</span>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.outcome}</p>
                  <small>{friendlyEvidenceLevel(milestone.evidenceLevel)} · {friendlyLearningTerm(milestone.mode)}</small>
                </div>
                {milestone.status !== 'locked'
                  ? <a href={milestone.href}>{milestone.status === 'completed' ? 'Repasar' : milestone.status === 'current' ? 'Continuar' : 'Abrir'} <ChevronRight size={15} /></a>
                  : <span className="academy-gold-path__locked">Se abre al completar la base</span>}
              </li>
            ))}
          </ol>
          <a className="academy-text-link" href="#/learning/map">Abrir el mapa de conocimientos</a>
        </details>
      )}
      <section className="academy-section-heading academy-section-heading--clear">
        <div><span className="academy-kicker">CONTENIDO DE LA RUTA</span><h2>Empieza por la primera lección pendiente</h2></div>
      </section>
      <div className="academy-curriculum">
        {tree.modules.map(({ module, lessons }, moduleIndex) => (
          <section key={module.id} className="academy-module-section">
            <header>
              <span>{String(moduleIndex + 1).padStart(2, '0')}</span>
              <div><span className="academy-kicker">MÓDULO</span><h2>{localize(locale, module.title)}</h2></div>
              <a href={academyModuleEntryHref(module.id, lessons.map(({ id }) => id))}
              >{lessons.length === 1 ? 'Abrir lección' : 'Abrir módulo'}</a>
            </header>
            <div>
              {lessons.map((lesson, lessonIndex) => {
                const statuses = lesson.activities.map((activity) => activityCardPresentation(snapshot, activity))
                const complete = lesson.activities.length > 0
                  && lesson.activities.every((activity) => academyActivitySatisfiesProgression(snapshot, activity))
                const active = statuses.some(({ state }) => state === 'in-progress')
                return (
                  <article className={`academy-lesson-row ${complete ? 'is-complete' : active ? 'is-active' : ''}`} key={lesson.id}>
                    <div className="academy-lesson-row__status">{complete ? <CheckCircle2 size={18} /> : <span>{moduleIndex + 1}.{lessonIndex + 1}</span>}</div>
                    <div><h3>{localize(locale, lesson.title)}</h3><p>{friendlyRecommendationReason(localize(locale, lesson.purpose))}</p><span>{lesson.activities.length} {lesson.activities.length === 1 ? 'práctica' : 'prácticas'}</span></div>
                    <a href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>{complete ? 'Repasar' : active ? 'Continuar' : 'Abrir'} <ChevronRight size={15} /></a>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </AcademyPage>
  )
}

function ModuleSurface() {
  const { snapshot } = useLearning()
  const module = snapshot.product.modules.find(({ id }) => id === snapshot.location.id)
  if (!module) return <NotFoundSurface />
  const route = snapshot.product.routes.find(({ moduleIds }) => moduleIds.includes(module.id))
  const lessons = module.lessonIds.flatMap((id) => {
    const lesson = snapshot.product.lessons.find((item) => item.id === id)
    return lesson ? [lesson] : []
  })
  if (lessons.length === 1) {
    const lesson = lessons[0]
    return (
      <AcademyPage
        eyebrow="ENLACE COMPATIBLE"
        title={localize(snapshot.profile?.locale, lesson.title)}
        description="Este enlace de módulo se conserva para no romper marcadores ni sesiones anteriores. El contenido continúa directamente en la lección."
        breadcrumbs={<AcademyPathBreadcrumbs lessonId={lesson.id} />}
        actions={route && <a className="academy-button is-secondary" href={`#/learning/route/${encodeURIComponent(route.id)}`}><ArrowLeft size={15} /> Volver a la ruta</a>}
      >
        <section className="academy-empty-state">
          <BookOpenCheck size={30} aria-hidden="true" />
          <div><h2>Un único paso, sin pantalla intermedia</h2><p>El ID del módulo sigue siendo válido; la ruta visible abre la lección directamente.</p></div>
          <a className="academy-button is-primary" href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>Abrir lección <ArrowRight size={15} /></a>
        </section>
      </AcademyPage>
    )
  }
  return (
    <AcademyPage
      eyebrow="MÓDULO"
      title={localize(snapshot.profile?.locale, module.title)}
      description={route ? `Parte de ${localize(snapshot.profile?.locale, route.title)}. Avanza en orden o abre una lección concreta.` : 'Agrupación formativa de lecciones.'}
      actions={route && <a className="academy-button is-secondary" href={`#/learning/route/${encodeURIComponent(route.id)}`}><ArrowLeft size={15} /> Volver a la ruta</a>}
    >
      <div className="academy-module-lessons">
        {lessons.map((lesson, index) => (
          <article key={lesson.id}>
            <div className="academy-module-lessons__number">{String(index + 1).padStart(2, '0')}</div>
            <div><span className="academy-kicker">LECCIÓN</span><h2>{localize(snapshot.profile?.locale, lesson.title)}</h2><p>{friendlyRecommendationReason(localize(snapshot.profile?.locale, lesson.purpose))}</p></div>
            <div className="academy-module-lessons__activities">
              {lesson.activityIds.map((id) => {
                const activity = snapshot.product.activities.find((item) => item.id === id)
                return activity ? <span key={id}>{activityTypeLabels[activity.activityType]} · {activity.durationMinutes} min</span> : null
              })}
            </div>
            <a className="academy-button is-primary" href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>Abrir lección <ArrowRight size={15} /></a>
          </article>
        ))}
      </div>
    </AcademyPage>
  )
}

function InlineMarkdown({ text }: { text: string }) {
  const pieces = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\{\{term:[^}]+\}\}|\[[^\]]+\]\((?:https?:\/\/|#\/)[^)]+\))/g)
  return pieces.map((piece, index) => {
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={index}>{piece.slice(2, -2)}</strong>
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={index}>{piece.slice(1, -1)}</code>
    if (piece.startsWith('{{term:')) {
      const id = piece.slice(7, -2)
      return <a key={index} href={`#/learning/glossary?term=${encodeURIComponent(id)}`}>{friendlyLearningTerm(id)}</a>
    }
    const link = piece.match(/^\[([^\]]+)\]\(((?:https?:\/\/|#\/)[^)]+)\)$/)
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>
    return <Fragment key={index}>{piece}</Fragment>
  })
}

export function RestrictedMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*] /.test(lines[index].trim())) {
        items.push(lines[index].trim().slice(2))
        index += 1
      }
      blocks.push(<ul key={`ul-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}><InlineMarkdown text={item} /></li>)}</ul>)
      continue
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\. /.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s*/, ''))
        index += 1
      }
      blocks.push(<ol key={`ol-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}><InlineMarkdown text={item} /></li>)}</ol>)
      continue
    }
    if (line.startsWith('### ')) blocks.push(<h4 key={index}><InlineMarkdown text={line.slice(4)} /></h4>)
    else if (line.startsWith('## ')) blocks.push(<h3 key={index}><InlineMarkdown text={line.slice(3)} /></h3>)
    else if (line.startsWith('# ')) blocks.push(<h2 key={index}><InlineMarkdown text={line.slice(2)} /></h2>)
    else blocks.push(<p key={index}><InlineMarkdown text={line} /></p>)
    index += 1
  }
  return (
    <div className="academy-reading-copy">
      {blocks}
    </div>
  )
}

export function LegacyLessonSurface014B() {
  const { service, snapshot } = useLearning()
  const material = academyLessonMaterial(snapshot.product, snapshot.location.id ?? '')
  const descriptor = snapshot.product.lessons.find(({ id }) => id === snapshot.location.id)
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const [mode, setMode] = useState<AcademyLessonMode>(
    snapshot.profile?.accessibility.readLabels ? 'textual' : state?.preferences.lessonMode ?? 'split',
  )
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [vocabularyDisclosure, setVocabularyDisclosure] = useState<Record<string, boolean>>({})
  const { lessonSegments, referenceSegments } = useMemo(() => {
    const segments = material?.blocks.flatMap((block) => segmentLessonBlock(
      block.id,
      block.localization?.bodyMarkdown
        ? localize(snapshot.profile?.locale, block.localization.bodyMarkdown)
        : block.bodyMarkdown,
    )) ?? []
    return {
      lessonSegments: segments.filter(({ role }) => role !== 'reference'),
      referenceSegments: segments.filter(({ role }) => role === 'reference'),
    }
  }, [material, snapshot.profile?.locale])
  const savedProgress = state?.lessonProgress.find(({ lessonId }) => lessonId === descriptor?.id)
  const requestedSegmentId = snapshot.location.query.segment
  const initialSegmentId = (
    requestedSegmentId && lessonSegments.some(({ id }) => id === requestedSegmentId)
      ? requestedSegmentId
      : savedProgress?.currentSegmentId && lessonSegments.some(({ id }) => id === savedProgress.currentSegmentId)
        ? savedProgress.currentSegmentId
        : lessonSegments[0]?.id
  ) ?? ''
  const [segmentSelection, setSegmentSelection] = useState({
    lessonId: descriptor?.id ?? '',
    segmentId: initialSegmentId,
  })
  const activeSegmentId = (
    segmentSelection.lessonId === descriptor?.id
    && lessonSegments.some(({ id }) => id === segmentSelection.segmentId)
  )
    ? segmentSelection.segmentId
    : initialSegmentId
  if (!descriptor) return <NotFoundSurface />
  const title = localize(snapshot.profile?.locale, descriptor.title)
  const visual = material?.lesson.authoring?.visualStrategy
  const previewActivity = material?.activities.find(({ fixtureBinding }) => Boolean(fixtureBinding))
  const lessonConcepts = descriptor.conceptIds.flatMap((conceptId) => {
    const concept = snapshot.product.knowledgeNodes.find(({ id }) => id === conceptId)
    return concept ? [concept] : []
  })
  const bookmark = state?.bookmarks.find(({ context }) => context.lessonId === descriptor.id)
  const activeSegmentIndex = Math.max(0, lessonSegments.findIndex(({ id }) => id === activeSegmentId))
  const activeSegment = lessonSegments[activeSegmentIndex]
  const completedSegmentIds = new Set(savedProgress?.completedSegmentIds ?? [])
  const studyContract = descriptor.studyContract
  const curatedStep = academyPathLocationForStepLesson(descriptor.id)
  const completionHasPractice = Boolean(curatedStep?.step.requiredActivityIds.length || studyContract?.labActivityIds.length)
  const requiredStudySegments = studyContract
    ? lessonSegments.filter(({ role }) => role !== 'reference' && studyContract.requiredSegmentRoles.includes(role))
    : []
  const completedRequiredSegments = requiredStudySegments.filter(({ id }) => completedSegmentIds.has(id)).length
  const theoryComplete = requiredStudySegments.length === 0
    || requiredStudySegments.every(({ id }) => completedSegmentIds.has(id))
  const canUnlockWithActiveSegment = requiredStudySegments.length === 0
    || requiredStudySegments.every(({ id }) => completedSegmentIds.has(id) || id === activeSegment?.id)
  const practiceLocked = Boolean(studyContract && !theoryComplete)
  const prerequisiteNodes = effectiveLessonPrerequisiteConceptIds(
    descriptor.id,
    descriptor.prerequisiteConceptIds,
  ).flatMap((id) => {
    const node = snapshot.product.knowledgeNodes.find((candidate) => candidate.id === id)
    return node ? [node] : []
  })
  const unmetPrerequisites = prerequisiteNodes.filter((node) =>
    !node.competencyIds.some((competencyId) => snapshot.mastery.items.some(({ competencyId: id, state: mastery }) =>
      id === competencyId && ['demonstrated', 'retained'].includes(mastery))))
  const saveMode = (next: AcademyLessonMode) => {
    setMode(next)
    actions.setPreferences({ lessonMode: next })
    actions.recordMetric(`lesson-mode.${next}`)
  }
  const createNote = (event: FormEvent) => {
    event.preventDefault()
    if (!noteBody.trim()) return
    actions.createNote({ title, body: noteBody, tags: ['lección'], context: { lessonId: descriptor.id } })
    setNoteBody('')
    setNoteOpen(false)
  }
  const moveToSegment = (nextIndex: number) => {
    const next = lessonSegments[nextIndex]
    if (!next || !activeSegment) return
    actions.recordLessonSegment(descriptor.id, next.id, [...completedSegmentIds], false)
    setSegmentSelection({ lessonId: descriptor.id, segmentId: next.id })
  }
  const completeCurrentAndMove = (nextIndex: number) => {
    const next = lessonSegments[nextIndex]
    if (!next || !activeSegment) return
    const completed = [...new Set([...completedSegmentIds, activeSegment.id])]
    actions.recordLessonSegment(descriptor.id, next.id, completed, false)
    setSegmentSelection({ lessonId: descriptor.id, segmentId: next.id })
  }
  const finishLesson = () => {
    if (!activeSegment) return
    const completed = [...new Set([...completedSegmentIds, activeSegment.id])]
    if (studyContract && !canUnlockWithActiveSegment) {
      actions.recordLessonSegment(descriptor.id, activeSegment.id, completed, false)
      actions.recordMetric('theory-first.unlock-blocked')
      return
    }
    actions.recordLessonSegment(descriptor.id, activeSegment.id, completed, true)
    const transition = academyLessonCompletionTransition(snapshot, state, descriptor.id)
    actions.recordMetric(transition.metric)
    service.navigate(parseLearningLocation(new URL(transition.href, window.location.href)))
  }
  return (
    <AcademyPage
      eyebrow="LECCIÓN"
      title={title}
      description={friendlyRecommendationReason(localize(snapshot.profile?.locale, descriptor.purpose))}
      breadcrumbs={<AcademyPathBreadcrumbs lessonId={descriptor.id} />}
      actions={(
        <>
          <button
            className="academy-button is-secondary"
            type="button"
            onClick={() => bookmark
              ? actions.deleteBookmark(bookmark.id)
              : actions.createBookmark({
                title,
                href: `#/learning/lesson/${encodeURIComponent(descriptor.id)}`,
                context: { lessonId: descriptor.id },
              })}
          >{bookmark ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}{bookmark ? 'Marcada' : 'Marcar'}</button>
          <button className="academy-button is-secondary" type="button" onClick={() => setNoteOpen((current) => !current)}><NotebookPen size={15} /> Añadir nota</button>
        </>
      )}
    >
      <div className="academy-lesson-toolbar" role="toolbar" aria-label="Modo de lección">
        {([
          ['reading', BookOpen, 'Teoría'],
          ['visual', Eye, 'Modelo'],
          ['split', SplitSquareHorizontal, 'Teoría + modelo'],
          ['focus', Sparkles, 'Lectura limpia'],
          ['textual', ListChecks, 'Texto accesible'],
        ] as const).map(([id, Icon, label]) => (
          <button
            type="button"
            className={mode === id ? 'is-active' : undefined}
            aria-pressed={mode === id}
            onClick={() => saveMode(id)}
            key={id}
          ><Icon size={15} />{label}</button>
        ))}
      </div>
      {noteOpen && (
        <form className="academy-inline-note" onSubmit={createNote}>
          <label htmlFor="academy-lesson-note">Nota privada sobre esta lección</label>
          <textarea id="academy-lesson-note" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} autoFocus />
          <div><button type="button" onClick={() => setNoteOpen(false)}>Cancelar</button><button type="submit">Guardar en Cuaderno</button></div>
        </form>
      )}
      {!material ? (
        <EmptyState icon={BookOpen} title="La ficha está disponible, pero no hay bloques editoriales cargados" detail="No se ha generado texto de sustitución. Revisa el paquete de contenido asociado." />
      ) : (
        <>
          <section className={`academy-lesson-support ${unmetPrerequisites.length ? 'has-gap' : ''}`} aria-labelledby="academy-lesson-preparation-title">
            <header className="academy-lesson-support__header">
              <span className="academy-kicker">ANTES DE EMPEZAR</span>
              <h2 id="academy-lesson-preparation-title">{unmetPrerequisites.length ? 'Hay bases que conviene estudiar antes de responder' : 'Tu punto de partida está preparado'}</h2>
              <p>La teoría y el modelo de consulta están disponibles desde ahora. Solo la interacción evaluable espera a que completes la preparación.</p>
            </header>
            <details className="academy-learning-cycle academy-learning-cycle--collapsed">
              <summary>Cómo está organizada esta lección</summary>
              <div>
                {LEARNING_CYCLE.map((stage, index) => {
                  const activeLearningIndex = Math.min(2, Math.floor((activeSegmentIndex / Math.max(1, lessonSegments.length - 1)) * 2))
                  const completed = index < activeLearningIndex
                  const active = index === activeLearningIndex
                  return (
                    <div className={completed ? 'is-complete' : active ? 'is-active' : undefined} key={stage.id}>
                      <span>{completed ? <CheckCircle2 size={14} /> : index + 1}</span>
                      <strong>{stage.label}</strong>
                      <small>{stage.description}</small>
                    </div>
                  )
                })}
              </div>
            </details>
          <section className={`academy-lesson-entry ${unmetPrerequisites.length ? 'has-gap' : ''}`}>
            <div>
              <h2>{prerequisiteNodes.length === 0
                ? 'Empieza aquí: no necesitas una explicación anterior'
                : unmetPrerequisites.length === 0
                  ? 'Tienes la base para continuar'
                  : 'Antes de la práctica conviene repasar una idea'}</h2>
              <p>{prerequisiteNodes.length === 0
                ? 'Lee los apartados en orden. La práctica llegará después de la explicación y el ejemplo.'
                : unmetPrerequisites.length === 0
                  ? 'Puedes avanzar directamente por la explicación y el ejemplo.'
                  : `Puedes leer esta lección, pero antes de responder revisa: ${unmetPrerequisites.map((node) => localize(snapshot.profile?.locale, node.title)).join(', ')}.`}</p>
            </div>
            {unmetPrerequisites.length > 0 && (
              <div className="academy-lesson-entry__actions" aria-label="Bases recomendadas">
                {unmetPrerequisites.map((node) => node.bridgeLessonId
                  ? <a className="academy-button is-secondary" href={`#/learning/lesson/${encodeURIComponent(node.bridgeLessonId)}`} key={node.id}>Estudiar {localize(snapshot.profile?.locale, node.title)} <ArrowRight size={15} /></a>
                  : <span key={node.id}>{localize(snapshot.profile?.locale, node.title)} · busca esta base en el mapa</span>)}
              </div>
            )}
          </section>
          {studyContract && (
            <details className={`academy-theory-contract ${theoryComplete ? 'is-complete' : ''}`}>
              <summary>
                <span>{theoryComplete ? 'Lectura completada' : 'Lectura necesaria antes de practicar'}</span>
                <strong>{completedRequiredSegments} de {requiredStudySegments.length} apartados</strong>
              </summary>
              <header>
                <div>
                  <h2>Qué debes comprender</h2>
                  <p>La lectura te prepara para observar el modelo con una pregunta concreta.</p>
                </div>
              </header>
              <div className="academy-theory-contract__facts">
                <span><BookOpenCheck size={17} /><strong>{studyContract.minimumTheoryMinutes} min</strong> de teoría prevista</span>
                <span><ListChecks size={17} /><strong>{studyContract.minimumReadingWords.toLocaleString('es-ES')}</strong> palabras especializadas</span>
                <span><FileCheck2 size={17} /><strong>{studyContract.sourceReviewRequired ? 'Fuentes visibles' : 'Fuentes opcionales'}</strong> y límites declarados</span>
              </div>
              <div className="academy-theory-contract__readiness">
                <h3>Antes de abrir el laboratorio debo poder:</h3>
                {studyContract.readinessCriteria.map((criterion) => (
                  <p key={criterion.es}><CheckCircle2 size={16} />{localize(snapshot.profile?.locale, criterion)}</p>
                ))}
              </div>
              <footer>
                <span>{theoryComplete ? 'Lectura obligatoria completada. El laboratorio está disponible.' : 'Puedes consultar el modelo ahora; completa estos apartados antes de iniciar la interacción y la evaluación.'}</span>
                <a href={`#/learning/sources?lesson=${encodeURIComponent(descriptor.id)}`}>Revisar fuentes <ArrowRight size={14} /></a>
              </footer>
            </details>
          )}
          {lessonConcepts.length > 0 && (
            <details
              className="academy-concept-language"
              open={vocabularyDisclosure[descriptor.id] ?? unmetPrerequisites.length > 0}
              onToggle={(event) => setVocabularyDisclosure((current) => ({
                ...current,
                [descriptor.id]: event.currentTarget.open,
              }))}
            >
              <summary id="academy-lesson-vocabulary-title">
                <span className="academy-kicker">VOCABULARIO ESENCIAL · {lessonConcepts.length} TÉRMINOS</span>
                <strong>La idea sencilla y el término relojero</strong>
              </summary>
              <div>
                {lessonConcepts.map((concept) => (
                  <article key={concept.id}>
                    <h3>{localize(snapshot.profile?.locale, concept.title)}</h3>
                    <p>{localize(snapshot.profile?.locale, concept.plainLanguage ?? concept.summary)}</p>
                    <details>
                      <summary>Lenguaje técnico y criterio observable</summary>
                      <p>{localize(snapshot.profile?.locale, concept.technicalLanguage ?? concept.summary)}</p>
                      {concept.observableActions.map((action) => <p key={action.es}>✓ {localize(snapshot.profile?.locale, action)}</p>)}
                      {concept.whyItMatters && <p><strong>Por qué importa:</strong> {localize(snapshot.profile?.locale, concept.whyItMatters)}</p>}
                    </details>
                  </article>
                ))}
              </div>
            </details>
          )}
          {descriptor.tutorContract && (
            <details className="academy-tutor-contract">
              <summary>Necesito ayuda para orientar la lectura</summary>
              <Sparkles size={21} />
              <div>
                <h2>Preguntas para desbloquearte</h2>
                <p>Estas pistas te devuelven a la idea o fuente adecuada sin resolver la actividad por ti.</p>
                <div>{descriptor.tutorContract.promptStarters.map((prompt) => <span key={prompt.es}>{localize(snapshot.profile?.locale, prompt)}</span>)}</div>
              </div>
            </details>
          )}
          </section>
          <details className="academy-lesson-index">
            <summary>Índice · apartado {activeSegmentIndex + 1} de {lessonSegments.length}: {activeSegment?.title}</summary>
            <nav className="academy-lesson-steps" aria-label="Apartados de la lección">
              {lessonSegments.map((segment, index) => (
                <button
                  type="button"
                  className={index === activeSegmentIndex ? 'is-active' : completedSegmentIds.has(segment.id) ? 'is-complete' : undefined}
                  aria-current={index === activeSegmentIndex ? 'step' : undefined}
                  onClick={() => moveToSegment(index)}
                  key={segment.id}
                >
                  <span>{completedSegmentIds.has(segment.id) ? <CheckCircle2 size={15} /> : index + 1}</span>
                  <strong>{segment.title}</strong>
                </button>
              ))}
            </nav>
          </details>
          <div className={`academy-lesson-player mode-${mode} ratio-${state?.preferences.workspaceRatio ?? '50-50'}`}>
            <article className="academy-lesson-reader">
              {activeSegment ? (
                <section id={activeSegment.id} data-learning-block={activeSegment.blockId}>
                  <span className="academy-kicker">PASO {activeSegmentIndex + 1} DE {lessonSegments.length}</span>
                  <h2>{activeSegment.title}</h2>
                  <RestrictedMarkdown markdown={activeSegment.markdown} />
                  <p className={`academy-segment-study-state ${completedSegmentIds.has(activeSegment.id) ? 'is-complete' : ''}`} role="status">
                    {completedSegmentIds.has(activeSegment.id)
                      ? <><CheckCircle2 size={15} /> Apartado marcado como estudiado.</>
                      : 'Cuando termines, usa «Marcar como estudiado y continuar». Abrir el índice no acredita la lectura.'}
                  </p>
                  <footer className="academy-segment-navigation">
                    <button className="academy-button is-secondary" type="button" disabled={activeSegmentIndex === 0} onClick={() => moveToSegment(activeSegmentIndex - 1)}>
                      <ArrowLeft size={15} /> Anterior
                    </button>
                    {activeSegmentIndex < lessonSegments.length - 1 ? (
                      <button className="academy-button is-primary" type="button" onClick={() => completeCurrentAndMove(activeSegmentIndex + 1)}>
                        Marcar como estudiado y continuar <ArrowRight size={15} />
                      </button>
                    ) : completionHasPractice ? (
                      <button className="academy-button is-primary" type="button" disabled={!canUnlockWithActiveSegment} aria-describedby={!canUnlockWithActiveSegment ? 'academy-practice-lock-reason' : undefined} onClick={finishLesson}>
                        Marcar como estudiado y preparar práctica <ArrowRight size={15} />
                      </button>
                    ) : (
                      <button className="academy-button is-primary" type="button" onClick={finishLesson}>
                        Marcar lección como estudiada <CheckCircle2 size={15} />
                      </button>
                    )}
                  </footer>
                  {practiceLocked && activeSegmentIndex === lessonSegments.length - 1 && !canUnlockWithActiveSegment && (
                    <p className="academy-disabled-reason" id="academy-practice-lock-reason">Aún faltan apartados obligatorios. Puedes usar el índice para volver a ellos; el modelo de consulta sigue disponible.</p>
                  )}
                </section>
              ) : <p>Esta lección no contiene segmentos legibles.</p>}
            </article>
            <aside className="academy-lesson-visual">
              <div className="academy-visual-placeholder">
                <span className="academy-kicker">{activeSegment?.role === 'worked-example' ? 'EJEMPLO GUIADO' : 'LO QUE VAS A OBSERVAR'}</span>
                <h2>{visual ? localize(snapshot.profile?.locale, visual.objective) : 'La lección no declara una escena visual independiente'}</h2>
                <p>{visual ? localize(snapshot.profile?.locale, visual.visibleConcept) : 'La práctica cargará el modelo cuando ya conozcas la idea esencial.'}</p>
                <div className="academy-model-preview">
                  <LessonModelPreview key={previewActivity?.id ?? descriptor.id} activity={previewActivity} label={visual ? localize(snapshot.profile?.locale, visual.objective) : title} />
                </div>
                {previewActivity?.fixtureBinding && <p className="academy-model-preview__boundary"><ShieldCheck size={14} />Vista del modelo, estática y de solo lectura. Explorarla no cuenta como respuesta.</p>}
                {visual && (
                  <details className="academy-visual-scope">
                    <summary>Qué representa y qué no demuestra</summary>
                    <p>{friendlyFidelity(visual.fidelity).summary}</p>
                    <dl>
                      <div><dt>Modelo</dt><dd>{friendlyLearningTerm(visual.modelReference)}</dd></div>
                      <div><dt>Piezas interactivas</dt><dd>{visual.involvedSelectors.length || 'Se muestran en la práctica'}</dd></div>
                    </dl>
                  </details>
                )}
              </div>
              <section>
                <span className="academy-kicker">{activeSegmentIndex === lessonSegments.length - 1 ? 'AHORA SÍ' : 'AÚN NO SE EVALÚA'}</span>
                <h2>{activeSegmentIndex === lessonSegments.length - 1 ? 'Comprueba la idea en el modelo' : 'Avanza a tu ritmo'}</h2>
                <p>{activeSegmentIndex === lessonSegments.length - 1
                  ? 'La práctica llega después de la preparación, el ejemplo y los errores habituales.'
                  : 'En este paso solo construyes la base. Puedes volver atrás, abrir el glosario o tomar una nota.'}</p>
                {activeSegmentIndex === lessonSegments.length - 1 && canUnlockWithActiveSegment && material.activities.length > 0
                  ? material.activities.map((activity) => <ActivityCard key={activity.id} activity={activity} compact />)
                  : null}
                {activeSegmentIndex === lessonSegments.length - 1 && !canUnlockWithActiveSegment && (
                  <p>Completa los tramos marcados de teoría, ejemplo y comprobación antes de abrir el laboratorio.</p>
                )}
              </section>
            </aside>
            <details className="academy-lesson-reference">
              <summary>Fiabilidad y fuentes · alcance, procedencia y descripción accesible</summary>
              <div>
                {referenceSegments.map((segment) => (
                  <section className="academy-lesson-reference__content" id={segment.id} key={segment.id}>
                    <span className="academy-kicker">DOCUMENTACIÓN Y LÍMITES</span>
                    <RestrictedMarkdown markdown={segment.markdown} />
                  </section>
                ))}
                <section><span className="academy-kicker">FUENTES</span><h2>{material.sources.length}</h2><a href={`#/learning/sources?lesson=${encodeURIComponent(descriptor.id)}`}>Consultar fuentes</a></section>
                {material.glossary.length > 0 && (
                  <section><span className="academy-kicker">TÉRMINOS ENLAZADOS</span><h2>{material.glossary.length}</h2><a href="#/learning/glossary">Abrir glosario</a></section>
                )}
                {visual?.textualAlternative && <section><span className="academy-kicker">DESCRIPCIÓN DEL MODELO</span><p>{localize(snapshot.profile?.locale, visual.textualAlternative)}</p></section>}
              </div>
            </details>
          </div>
        </>
      )}
    </AcademyPage>
  )
}

function WorkshopSurface() {
  const { snapshot } = useLearning()
  const { state } = useAcademyLocalState(snapshot.profile?.id)
  const [tool, setTool] = useState(snapshot.location.query.tool ?? '')
  if (snapshot.location.query.integration === '1') return <AcademyIntegrationLabSurface />
  const allActivities = snapshot.product.activities.filter((activity) =>
    !activity.demo
    && (activity.workbenchContract || activity.mechanicalLabContract || activity.calibreLabContract || activity.serviceProcedureContract || activity.manufacturingContract || activity.personalWatchDesignContract || activity.validationContract || activity.packageId === 'wplab.horology.inspection-metrology'))
  const activities = allActivities.filter((activity) =>
    !tool
      || (tool === 'workbench' && activity.workbenchContract)
      || (tool === 'mechanical' && activity.mechanicalLabContract)
      || (tool === 'calibre' && activity.calibreLabContract)
      || (tool === 'service' && activity.serviceProcedureContract)
      || (tool === 'manufacturing' && activity.manufacturingContract)
      || (tool === 'design' && activity.personalWatchDesignContract)
      || (tool === 'validation' && activity.validationContract)
      || (tool === 'metrology' && activity.packageId === 'wplab.horology.inspection-metrology'))
  const readinessFor = (activity: LearningActivityDescriptor): ActivityReadiness => {
    const lesson = snapshot.product.lessons.find(({ id }) => id === activity.lessonId)
    const lessonProgress = state?.lessonProgress.find(({ lessonId }) => lessonId === lesson?.id)
    if (lesson?.studyContract?.sequence === 'theory-first' && !lessonProgress?.completedAt) {
      return { status: 'blocked', reason: `Estudia primero «${localize(snapshot.profile?.locale, lesson.title)}».` }
    }
    const missingConcepts = lesson?.prerequisiteConceptIds.flatMap((id) => {
      const node = snapshot.product.knowledgeNodes.find((candidate) => candidate.id === id)
      if (!node) return []
      const known = node.competencyIds.some((competencyId) => snapshot.mastery.items.some((item) =>
        item.competencyId === competencyId && ['demonstrated', 'retained'].includes(item.state)))
      return known ? [] : [localize(snapshot.profile?.locale, node.title)]
    }) ?? []
    if (missingConcepts.length) return { status: 'blocked', reason: `Base pendiente: ${missingConcepts.join(', ')}.` }
    const route = realAcademyRoutes(snapshot.product).find((candidate) => academyRouteTree(snapshot.product, candidate.id)?.activityIds.includes(activity.id))
    if (route) {
      const routeStatus = academyRoutePrerequisiteStatus(snapshot, route.id)
      if (!routeStatus.ready) return { status: 'blocked', reason: 'Completa primero la ruta anterior indicada en tu recorrido.' }
    }
    return { status: 'ready' }
  }
  const withReadiness = activities.map((activity) => ({ activity, readiness: readinessFor(activity) }))
  const readyActivities = withReadiness.filter(({ readiness }) => readiness.status === 'ready')
  const blockedActivities = withReadiness.filter(({ readiness }) => readiness.status === 'blocked')
  const counts = {
    workbench: snapshot.product.activities.filter(({ demo, workbenchContract }) => !demo && workbenchContract).length,
    mechanical: snapshot.product.activities.filter(({ demo, mechanicalLabContract }) => !demo && mechanicalLabContract).length,
    calibre: snapshot.product.activities.filter(({ demo, calibreLabContract }) => !demo && calibreLabContract).length,
    metrology: snapshot.product.activities.filter(({ demo, packageId }) => !demo && packageId === 'wplab.horology.inspection-metrology').length,
    service: snapshot.product.activities.filter(({ demo, serviceProcedureContract }) => !demo && serviceProcedureContract).length,
    manufacturing: snapshot.product.activities.filter(({ demo, manufacturingContract }) => !demo && manufacturingContract).length,
    design: snapshot.product.activities.filter(({ demo, personalWatchDesignContract }) => !demo && personalWatchDesignContract).length,
    validation: snapshot.product.activities.filter(({ demo, validationContract }) => !demo && validationContract).length,
  }
  return (
    <AcademyPage eyebrow="TALLER" title="Práctica por herramienta" description="Entra por el tipo de trabajo que quieres realizar. Cada práctica conserva su lección, sus fuentes y tu resultado.">
      <section className="academy-section-heading"><div><span className="academy-kicker">PROYECTO PERSONAL · ETAPA 5</span><h2>Laboratorio de integración</h2></div><a className="learning-primary-action" href="#/learning/workshop?integration=1">Abrir proyecto local</a><span>Secundario, sin red, sin mastery y separado del progreso curricular</span></section>
      <div className="academy-tool-chooser" role="group" aria-label="Filtrar herramientas">
        <button type="button" aria-pressed={tool === 'service'} className={tool === 'service' ? 'is-active' : undefined} onClick={() => setTool('service')}><FileCheck2 size={19} /><span><strong>Método de servicio</strong><small>{counts.service} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'manufacturing'} className={tool === 'manufacturing' ? 'is-active' : undefined} onClick={() => setTool('manufacturing')}><Factory size={19} /><span><strong>Fabricación y acabados</strong><small>{counts.manufacturing} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'design'} className={tool === 'design' ? 'is-active' : undefined} onClick={() => setTool('design')}><DraftingCompass size={19} /><span><strong>Diseño propio</strong><small>{counts.design} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'validation'} className={tool === 'validation' ? 'is-active' : undefined} onClick={() => setTool('validation')}><ClipboardCheck size={19} /><span><strong>Validación</strong><small>{counts.validation} prácticas</small></span></button>
        <button type="button" aria-pressed={!tool} className={!tool ? 'is-active' : undefined} onClick={() => setTool('')}><Wrench size={19} /><span><strong>Todas</strong><small>{allActivities.length} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'workbench'} className={tool === 'workbench' ? 'is-active' : undefined} onClick={() => setTool('workbench')}><Boxes size={19} /><span><strong>Mesa virtual</strong><small>{counts.workbench} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'mechanical'} className={tool === 'mechanical' ? 'is-active' : undefined} onClick={() => setTool('mechanical')}><Gauge size={19} /><span><strong>Laboratorio mecánico</strong><small>{counts.mechanical} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'calibre'} className={tool === 'calibre' ? 'is-active' : undefined} onClick={() => setTool('calibre')}><Settings2 size={19} /><span><strong>Laboratorio de calibre</strong><small>{counts.calibre} prácticas</small></span></button>
        <button type="button" aria-pressed={tool === 'metrology'} className={tool === 'metrology' ? 'is-active' : undefined} onClick={() => setTool('metrology')}><Microscope size={19} /><span><strong>Inspección y metrología</strong><small>{counts.metrology} prácticas</small></span></button>
      </div>
      <section className="academy-section-heading"><div><span className="academy-kicker">LISTAS PARA COMPROBAR</span><h2>{readyActivities.length} actividades</h2></div><span>La ficha confirmará recursos y capacidades antes de crear la sesión</span></section>
      <div className="academy-activity-grid">
        {readyActivities.map(({ activity, readiness }) => <ActivityCard key={activity.id} activity={activity} readiness={readiness} />)}
      </div>
      {blockedActivities.length > 0 && (
        <details className="academy-workshop-blocked">
          <summary>{blockedActivities.length} {blockedActivities.length === 1 ? 'práctica necesita' : 'prácticas necesitan'} preparación</summary>
          <p>Puedes consultar sus fichas y modelos. La interacción evaluable se abrirá al completar la base indicada.</p>
          <div className="academy-activity-grid">
            {blockedActivities.map(({ activity, readiness }) => <ActivityCard key={activity.id} activity={activity} readiness={readiness} />)}
          </div>
        </details>
      )}
      {!activities.length && <EmptyState icon={Wrench} title="No hay prácticas para esta herramienta" detail="No se ha creado una actividad artificial para rellenar este estado." />}
    </AcademyPage>
  )
}

function ArchitectureAtlasSurface({ snapshot }: { snapshot: ReturnType<typeof useLearning>['snapshot'] }) {
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState(snapshot.location.query.domain ?? '')
  const families = ARCHITECTURE_FAMILIES.filter((family) => !domain || family.domain === domain)
  const familyId = snapshot.location.query.family ?? families[0]?.id
  const family = ARCHITECTURE_FAMILIES.find(({ id }) => id === familyId) ?? families[0]
  const cases = COMPARATIVE_MOVEMENT_CASES.filter((movement) =>
    (!family || movement.familyIds.includes(family.id))
    && (!query || `${movement.manufacturer} ${movement.calibre} ${movement.title.es}`.toLowerCase().includes(query.toLowerCase())))
  const caseId = snapshot.location.query.case ?? cases[0]?.id
  const selectedCase = COMPARATIVE_MOVEMENT_CASES.find(({ id }) => id === caseId)
  const relatedActivities = selectedCase
    ? snapshot.product.activities.filter((activity) => activity.comparativeArchitectureContract?.caseIds.includes(selectedCase.id)).slice(0, 6)
    : []
  return (
    <AcademyPage eyebrow="ATLAS COMPARATIVO" title="Arquitecturas, casos y autoridad" description="Compara relaciones y compromisos entre calibres reales sin fingir modelos 3D que no están instalados.">
      <div className="academy-view-switch" role="group" aria-label="Vista del Atlas">
        <a href="#/learning/atlas?view=models"><Boxes size={16} /> Modelos y piezas</a>
        <a className="is-active" href="#/learning/atlas?view=architectures"><Layers3 size={16} /> Arquitecturas y calibres</a>
      </div>
      <section className="academy-prerequisite-note"><ShieldCheck size={18} /><div><strong>La autoridad viaja con cada afirmación</strong><p>Oficial, secundario, observación e inferencia se muestran por separado. Un caso documental sin geometría instalada nunca se presenta como gemelo visual.</p></div></section>
      <div className="academy-atlas-domain-filter">
        <label><span>Familia</span><select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="">Todas</option><option value="seconds">Segundos</option><option value="winding">Carga automática</option><option value="construction">Construcción</option><option value="escapement">Escape</option><option value="calendar">Calendario</option><option value="chronograph">Cronógrafo</option></select></label>
      </div>
      <div className="academy-atlas-layout">
        <aside className="academy-atlas-models">
          <h2>Familias arquitectónicas</h2>
          {families.map((item) => (
            <a className={item.id === family?.id ? 'is-active' : undefined} href={`#/learning/atlas?view=architectures${domain ? `&domain=${domain}` : ''}&family=${encodeURIComponent(item.id)}`} key={item.id}>
              <Layers3 size={18} /><span><strong>{localize(snapshot.profile?.locale, item.title)}</strong><small>{friendlyLearningTerm(item.domain)} · {COMPARATIVE_MOVEMENT_CASES.filter((movement) => movement.familyIds.includes(item.id)).length} {COMPARATIVE_MOVEMENT_CASES.filter((movement) => movement.familyIds.includes(item.id)).length === 1 ? 'caso' : 'casos'}</small></span>
            </a>
          ))}
        </aside>
        <div className="academy-atlas-main">
          {family && <section className="academy-atlas-summary"><span className="academy-kicker">{friendlyLearningTerm(family.domain)}</span><h2>{localize(snapshot.profile?.locale, family.title)}</h2><p>{localize(snapshot.profile?.locale, family.principle)}</p><section><h3>Relaciones que la distinguen</h3><ul>{family.distinguishingRelations.map((relation) => <li key={relation}>{friendlyLearningTerm(relation)}</li>)}</ul></section><section><h3>Compromisos</h3><ul>{family.tradeOffs.map((tradeOff) => <li key={tradeOff.es}>{localize(snapshot.profile?.locale, tradeOff)}</li>)}</ul></section></section>}
          <label className="academy-atlas-search"><Search size={16} /><span className="sr-only">Buscar calibre</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar calibre o caso" /><span>{cases.length}</span></label>
          <div className="academy-atlas-parts">
            {cases.map((movement) => (
              <a className={movement.id === selectedCase?.id ? 'is-active' : undefined} href={`#/learning/atlas?view=architectures&family=${encodeURIComponent(family?.id ?? '')}&case=${encodeURIComponent(movement.id)}`} key={movement.id}>
                <span className="academy-reconstruction-level">{movement.modelAvailability === 'structural' ? 'Ensamblaje estructural' : movement.modelAvailability === 'conceptual' ? 'Modelo conceptual' : 'Referencia documental'}</span>
                <span><strong>{movement.manufacturer} {movement.calibre}</strong><small>{localize(snapshot.profile?.locale, movement.title)} · {friendlyLearningTerm(movement.evidenceStatus)}</small></span><ChevronRight size={15} />
              </a>
            ))}
          </div>
        </div>
        <aside className="academy-atlas-detail">
          {selectedCase ? <>
            <span className="academy-kicker">CASO COMPARATIVO</span><h2>{localize(snapshot.profile?.locale, selectedCase.title)}</h2>
            <div className="academy-tag-row"><span>{friendlyLearningTerm(selectedCase.evidenceStatus)}</span><span>{friendlyLearningTerm(selectedCase.modelAvailability)}</span></div>
            <dl><div><dt>Representación</dt><dd>{friendlyLearningTerm(selectedCase.geometryClaim)}</dd></div><div><dt>Fuentes</dt><dd>{selectedCase.sourceIds.length}</dd></div><div><dt>Uso</dt><dd>{localize(snapshot.profile?.locale, selectedCase.learningUse)}</dd></div></dl>
            {selectedCase.officialFacts.length > 0 && <section><h3>Datos oficiales</h3><ul>{selectedCase.officialFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>}
            {selectedCase.curatedObservations.length > 0 && <section><h3>Observaciones secundarias</h3><ul>{selectedCase.curatedObservations.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>}
            <section><h3>Desconocidos y límites</h3><ul>{selectedCase.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul></section>
            <section><h3>Fuentes consultables</h3><ul>{selectedCase.sourceIds.map((sourceId) => { const source = comparativeSource(sourceId); return <li key={sourceId}>{source ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : sourceId}</li> })}</ul></section>
            {relatedActivities.length > 0 && <section><h3>Estudios relacionados</h3><ul>{relatedActivities.map((activity) => <li key={activity.id}><a href={activityHref(activity.id)}>{localize(snapshot.profile?.locale, activity.title)}</a></li>)}</ul></section>}
          </> : <p>Selecciona un caso para revisar datos, desconocidos, fuentes y actividades.</p>}
        </aside>
      </div>
    </AcademyPage>
  )
}

function AtlasSurface() {
  const { snapshot } = useLearning()
  const [query, setQuery] = useState('')
  if (snapshot.location.query.view !== 'models') return <ArchitectureAtlasSurface snapshot={snapshot} />
  const summaries = academyFixtureSummaries()
  const selectedId = snapshot.location.query.fixture ?? summaries[0]?.fixture.id
  const selected = summaries.find(({ fixture }) => fixture.id === selectedId)
  const partId = snapshot.location.query.part
  if (!selected) return <EmptyState title="No hay modelos instalados" detail="El Atlas muestra únicamente modelos realmente disponibles en este equipo." />
  const { fixture } = selected
  const records = fixture.ledger.filter((record) => {
    const haystack = `${record.nameEs} ${record.nameEn} ${record.subsystem} ${record.officialReference ?? ''}`.toLowerCase()
    return !query || haystack.includes(query.toLowerCase())
  })
  const selectedPart = fixture.ledger.find(({ canonicalId }) => canonicalId === partId)
  return (
    <AcademyPage eyebrow="ATLAS" title="Modelos y piezas" description="Explora cada movimiento, localiza sus piezas y consulta qué conocemos con certeza y qué sigue siendo una reconstrucción.">
      <section className="academy-prerequisite-note"><Microscope size={18} /><div><strong>Registro físico separado del modelo de referencia</strong><p>Consulta unidades, piezas físicas, imágenes, medidas y propuestas sin convertirlas en definiciones oficiales.</p><div className="academy-button-row"><a href="#/learning/metrology?tab=specimens">Unidades y piezas</a><a href="#/learning/metrology?tab=inspection">Imágenes</a><a href="#/learning/metrology?tab=measurement">Medidas</a><a href="#/learning/metrology?tab=comparison">Propuestas</a></div></div></section>
      <div className="academy-atlas-layout">
        <aside className="academy-atlas-models">
          <h2>Modelos instalados</h2>
          {summaries.map((summary) => (
            <a className={summary.fixture.id === fixture.id ? 'is-active' : undefined} href={`#/learning/atlas?fixture=${encodeURIComponent(summary.fixture.id)}`} key={summary.fixture.id}>
              <Boxes size={18} />
              <span><strong>{summary.fixture.calibre ? `${summary.fixture.manufacturer ?? ''} ${summary.fixture.calibre}`.trim() : friendlyLearningTerm(summary.fixture.family)}</strong><small>{friendlyReconstructionLevel(summary.fixture.reconstructionLevel)} · {summary.fixture.ledger.length} piezas</small></span>
            </a>
          ))}
        </aside>
        <div className="academy-atlas-main">
          <section className="academy-atlas-summary">
            <div><span className="academy-kicker">{friendlyLearningTerm(fixture.kind)}</span><h2>{fixture.calibre ? `${fixture.manufacturer ?? ''} ${fixture.calibre}` : friendlyLearningTerm(fixture.family)}</h2><p>{fixture.limitations[0] ?? 'Modelo educativo con fuentes y límites declarados.'}</p></div>
            <div className="academy-stat-row">
              <span><strong>{fixture.ledger.length}</strong> piezas catalogadas</span>
              <span><strong>{fixture.relations.length}</strong> relaciones</span>
              <span><strong>{fixture.selectors.length}</strong> grupos interactivos</span>
              <span><strong>{selected.sourceCount}</strong> fuentes</span>
            </div>
            <div className="academy-tag-row">
              <span title="Nivel de detalle del modelo">{friendlyReconstructionLevel(fixture.reconstructionLevel)}</span>
              <span title={friendlyFidelity(fixture.fidelity).summary}>{friendlyFidelity(fixture.fidelity).title}</span>
              <span>{selected.officialParts} identidades oficiales</span>
              <span>{selected.conceptualParts} conceptuales</span>
            </div>
          </section>
          <label className="academy-atlas-search"><Search size={16} /><span className="sr-only">Buscar pieza</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pieza, referencia o subsistema" /><span>{records.length}</span></label>
          <div className="academy-atlas-parts">
            {records.map((record) => (
              <a className={record.canonicalId === partId ? 'is-active' : undefined} href={`#/learning/atlas?fixture=${encodeURIComponent(fixture.id)}&part=${encodeURIComponent(record.canonicalId)}`} key={record.canonicalId}>
                <span className={`academy-reconstruction-level is-${record.reconstructionLevel.toLowerCase()}`} title="Nivel de detalle de esta pieza">{friendlyReconstructionLevel(record.reconstructionLevel)}</span>
                <span><strong>{localize(snapshot.profile?.locale, { es: record.nameEs, en: record.nameEn })}</strong><small>{friendlyLearningTerm(record.subsystem)} · {friendlyLearningTerm(record.modelState)}</small></span>
                <ChevronRight size={15} />
              </a>
            ))}
          </div>
        </div>
        <aside className="academy-atlas-detail">
          {selectedPart ? (
            <>
              <span className="academy-kicker">FICHA DE PIEZA</span>
              <h2>{localize(snapshot.profile?.locale, { es: selectedPart.nameEs, en: selectedPart.nameEn })}</h2>
              <div className="academy-tag-row">
                <span title="Nivel de detalle de esta pieza">{friendlyReconstructionLevel(selectedPart.reconstructionLevel)}</span>
                <span title={friendlyFidelity(selectedPart.fidelity).summary}>{friendlyFidelity(selectedPart.fidelity).title}</span>
              </div>
              <dl>
                <div><dt>Estado</dt><dd>{friendlyLearningTerm(selectedPart.modelState)}</dd></div>
                <div><dt>Grupo funcional</dt><dd>{friendlyLearningTerm(selectedPart.subsystem)}</dd></div>
                <div><dt>Referencia oficial</dt><dd>{selectedPart.officialReference ?? 'No declarada'}</dd></div>
                <div><dt>Geometría oficial</dt><dd>{selectedPart.officialGeometryAvailable ? 'Disponible' : 'No disponible'}</dd></div>
                <div><dt>Dimensiones oficiales</dt><dd>{selectedPart.officialDimensions.length}</dd></div>
                <div><dt>Dimensiones medidas</dt><dd>{selectedPart.measuredDimensions.length}</dd></div>
                <div><dt>Estimaciones</dt><dd>{selectedPart.estimatedDimensions.length}</dd></div>
                <div><dt>Relaciones</dt><dd>{selectedPart.functionalRelationshipIds.length}</dd></div>
                <div><dt>Fuentes</dt><dd>{selectedPart.sourceIds.length ? <a href={`#/learning/sources?source=${encodeURIComponent(selectedPart.sourceIds[0])}`}>{selectedPart.sourceIds.length} referencias</a> : 'Ninguna'}</dd></div>
              </dl>
              {(() => {
                const instanceIds = new Set(selectedPart.instanceIds)
                const relations = fixture.relations.filter(({ fromInstanceId, toInstanceId }) =>
                  instanceIds.has(fromInstanceId) || instanceIds.has(toInstanceId))
                return relations.length > 0 ? (
                  <section>
                    <h3>Relaciones navegables</h3>
                    <ul className="academy-atlas-relations">
                      {relations.map((relation) => {
                        const otherInstanceId = instanceIds.has(relation.fromInstanceId)
                          ? relation.toInstanceId
                          : relation.fromInstanceId
                        const other = fixture.ledger.find(({ instanceIds: ids }) => ids.includes(otherInstanceId))
                        return (
                          <li key={relation.id}>
                            <span>{friendlyLearningTerm(relation.type)}</span>
                            {other
                              ? <a href={`#/learning/atlas?fixture=${encodeURIComponent(fixture.id)}&part=${encodeURIComponent(other.canonicalId)}`}>{localize(snapshot.profile?.locale, { es: other.nameEs, en: other.nameEn })}</a>
                              : <span>{humanizeLearningId(otherInstanceId)}</span>}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ) : null
              })()}
              {(() => {
                const related = snapshot.product.activities.filter((activity) => {
                  const binding = activity.fixtureBinding
                  const includesFixture = binding?.kind === 'fixture'
                    ? binding.fixtureId === fixture.id
                    : binding?.kind === 'composition' && binding.fixtureIds.includes(fixture.id)
                  return includesFixture && activity.subsystem === selectedPart.subsystem
                }).slice(0, 5)
                return related.length ? (
                  <section>
                    <h3>Prácticas relacionadas</h3>
                    <ul>{related.map((activity) => <li key={activity.id}><a href={activityHref(activity.id)}>{localize(snapshot.profile?.locale, activity.title)}</a></li>)}</ul>
                  </section>
                ) : null
              })()}
              {selectedPart.limitations.length > 0 && <section><h3>Limitaciones</h3><ul>{selectedPart.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>}
              {statefulTechnicalId(selectedPart.canonicalId)}
            </>
          ) : (
            <EmptyState icon={Boxes} title="Selecciona una pieza" detail="La ficha separará los datos oficiales, las observaciones, las medidas y las aproximaciones." />
          )}
        </aside>
      </div>
    </AcademyPage>
  )
}

function statefulTechnicalId(id: string) {
  return <details className="academy-technical-detail"><summary>Identificador técnico</summary><code>{id}</code></details>
}

function SearchSurface() {
  const { service, snapshot } = useLearning()
  const { state } = useAcademyLocalState(snapshot.profile?.id)
  const query = snapshot.location.query.q ?? ''
  const kind = snapshot.location.query.kind as AcademySearchKind | undefined
  const [draft, setDraft] = useState(query)
  const entries = useMemo(() => {
    const notebookEntries: AcademySearchEntry[] = [
      ...(state?.bookmarks ?? []).map((bookmark) => ({
        id: bookmark.id,
        kind: 'note' as const,
        title: bookmark.title,
        description: 'Marcador privado',
        keywords: Object.values(bookmark.context).join(' '),
        href: bookmark.href,
        context: 'Cuaderno · marcador',
      })),
      ...(state?.captures ?? []).map((capture) => ({
        id: capture.id,
        kind: 'note' as const,
        title: capture.title,
        description: `Captura privada · ${capture.selectedIds.length} selecciones`,
        keywords: `${capture.fixtureId ?? ''} ${capture.provenance.join(' ')}`,
        href: '#/learning/notebook',
        context: 'Cuaderno · captura',
      })),
    ]
    return [...buildAcademySearchIndex(snapshot, state?.notes ?? []), ...notebookEntries]
  }, [snapshot, state?.bookmarks, state?.captures, state?.notes])
  const normalized = query.toLowerCase().trim()
  const matchedEntries = entries.filter((entry) =>
    !normalized || `${entry.title} ${entry.description} ${entry.keywords} ${entry.context}`.toLowerCase().includes(normalized))
  const results = matchedEntries.filter((entry) => !kind || entry.kind === kind)
  const counts = Object.keys(searchKindLabels).reduce((output, key) => ({
    ...output,
    [key]: matchedEntries.filter(({ kind: itemKind }) => itemKind === key).length,
  }), {} as Record<string, number>)
  return (
    <AcademyPage eyebrow="BÚSQUEDA" title={query ? `Resultados para “${query}”` : 'Buscar en toda la Academia'} description="Lecciones, prácticas, modelos, piezas, términos, fuentes y notas privadas en un índice local.">
      <form className="academy-search-hero" onSubmit={(event) => {
        event.preventDefault()
        service.navigate({ surface: 'search', query: draft.trim() ? { q: draft.trim(), ...(kind ? { kind } : {}) } : {} })
      }}>
        <Search size={21} /><label className="sr-only" htmlFor="academy-search-page">Buscar</label><input id="academy-search-page" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="¿Qué quieres encontrar?" autoFocus /><button type="submit">Buscar</button>
      </form>
      <div className="academy-search-kinds">
        <a className={!kind ? 'is-active' : undefined} href={`#/learning/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}>Todo <span>{matchedEntries.length}</span></a>
        {(Object.keys(searchKindLabels) as AcademySearchKind[]).map((itemKind) => (
          <a className={kind === itemKind ? 'is-active' : undefined} href={`#/learning/search?${new URLSearchParams({ ...(query ? { q: query } : {}), kind: itemKind })}`} key={itemKind}>{searchKindLabels[itemKind]} <span>{counts[itemKind]}</span></a>
        ))}
      </div>
      {results.length ? (
        <div className="academy-search-results">
          {results.slice(0, 120).map((entry) => (
            <a href={entry.href} key={`${entry.kind}:${entry.id}`}>
              <span className="academy-search-results__kind">{searchKindLabels[entry.kind]}</span>
              <div><h2>{entry.title}</h2><p>{entry.description}</p><small>{entry.context}</small></div>
              <ChevronRight size={17} />
            </a>
          ))}
        </div>
      ) : <EmptyState icon={Search} title="No hemos encontrado coincidencias" detail="Prueba con el nombre común de una pieza, un calibre o el título de una lección." />}
    </AcademyPage>
  )
}

function NotebookSurface() {
  const { snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const [editingId, setEditingId] = useState<string>()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const reset = () => { setEditingId(undefined); setTitle(''); setBody(''); setTags('') }
  const edit = (id: string) => {
    const note = state?.notes.find((item) => item.id === id)
    if (!note) return
    setEditingId(id); setTitle(note.title); setBody(note.body); setTags(note.tags.join(', '))
  }
  const save = (event: FormEvent) => {
    event.preventDefault()
    const normalizedTags = tags.split(',').map((item) => item.trim()).filter(Boolean)
    if (editingId) actions.updateNote(editingId, { title, body, tags: normalizedTags })
    else actions.createNote({ title, body, tags: normalizedTags, context: noteContextFromLocation(snapshot.location.surface, snapshot.location.id, snapshot.location.query) })
    reset()
  }
  const exportNotes = () => {
    const payload = JSON.stringify({ format: 'wplab-academy-notes', version: 1, exportedAt: new Date().toISOString(), notes: state?.notes ?? [] }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'watchmaking-academy-notas.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <AcademyPage
      eyebrow="CUADERNO"
      title="Notas privadas y contextuales"
      description="Tus notas permanecen en este perfil y dispositivo. Puedes exportarlas cuando quieras."
      actions={<button className="academy-button is-secondary" type="button" onClick={exportNotes} disabled={!state?.notes.length}><Download size={15} /> Exportar</button>}
    >
      <div className="academy-notebook-layout">
        <form className="academy-note-editor" onSubmit={save}>
          <span className="academy-kicker">{editingId ? 'EDITAR NOTA' : 'NUEVA NOTA'}</span>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título breve" /></label>
          <label>Nota<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Escribe una observación, duda o relación…" required /></label>
          <label>Etiquetas<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="escape, 8215, repasar" /></label>
          <div>{editingId && <button type="button" onClick={reset}>Cancelar</button>}<button type="submit"><Plus size={15} /> {editingId ? 'Guardar cambios' : 'Añadir nota'}</button></div>
        </form>
        <div className="academy-notes-list">
          {state?.bookmarks.length ? (
            <section className="academy-notebook-collection">
              <header><div><span className="academy-kicker">MARCADORES</span><h2>{state.bookmarks.length} guardados</h2></div></header>
              <div>
                {state.bookmarks.map((bookmark) => (
                  <article key={bookmark.id}>
                    <Bookmark size={16} />
                    <a href={bookmark.href}>{bookmark.title}</a>
                    <button type="button" aria-label={`Eliminar marcador ${bookmark.title}`} onClick={() => actions.deleteBookmark(bookmark.id)}><Trash2 size={14} /></button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {state?.captures.length ? (
            <section className="academy-notebook-collection">
              <header><div><span className="academy-kicker">CAPTURAS DEL MODELO</span><h2>{state.captures.length} guardadas</h2></div></header>
              <div className="academy-capture-grid">
                {state.captures.map((capture) => (
                  <article key={capture.id}>
                    {capture.dataUrl ? <img src={capture.dataUrl} alt={`Captura: ${capture.title}`} /> : <div className="academy-capture-placeholder"><Eye size={22} /></div>}
                    <div><strong>{capture.title}</strong><small>{learningDate(snapshot.profile?.locale, capture.createdAt)} · vista guardada</small></div>
                    <button type="button" aria-label={`Eliminar captura ${capture.title}`} onClick={() => actions.deleteCapture(capture.id)}><Trash2 size={14} /></button>
                    <details><summary>Contexto guardado</summary><p><strong>Modelo:</strong> {capture.fixtureId ? friendlyLearningTerm(capture.fixtureId) : 'Proyecto activo'}{capture.fixtureVersion ? ` · revisión ${capture.fixtureVersion}` : ''}</p><p>{capture.selectedIds.length} selecciones · {capture.provenance.length} referencias</p></details>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {state?.notes.length ? <div className="academy-notebook-subheading"><span className="academy-kicker">NOTAS</span><strong>{state.notes.length}</strong></div> : null}
          {state?.notes.map((note) => (
            <article key={note.id}>
              <header><div><h2>{note.title}</h2><span>{learningDate(snapshot.profile?.locale, note.updatedAt)}</span></div><div><button type="button" onClick={() => edit(note.id)}>Editar</button><button type="button" aria-label={`Eliminar ${note.title}`} onClick={() => actions.deleteNote(note.id)}><Trash2 size={15} /></button></div></header>
              <p>{note.body}</p>
              <footer><div>{note.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>{Object.keys(note.context).length > 0 && <small>{Object.values(note.context).map(humanizeLearningId).join(' · ')}</small>}{note.context.lessonId && <a href={`#/learning/lesson/${encodeURIComponent(note.context.lessonId)}${note.context.sectionId ? `?section=${encodeURIComponent(note.context.sectionId)}` : ''}`}>Volver al apartado{note.context.sectionId ? '' : ' de la lección'}</a>}</footer>
            </article>
          ))}
          {!state?.notes.length && !state?.bookmarks.length && !state?.captures.length && <EmptyState icon={NotebookPen} title="Tu cuaderno está vacío" detail="Puedes crear una nota aquí o desde una lección. Nunca se publica ni se sincroniza por defecto." />}
        </div>
      </div>
    </AcademyPage>
  )
}

function noteContextFromLocation(surface: string, id?: string, query: Record<string, string | undefined> = {}): AcademyNoteContext {
  if (surface === 'notebook') return {
    ...(query.specimen ? { specimenId: query.specimen } : {}),
    ...(query.component ? { physicalComponentId: query.component } : {}),
    ...(query.image ? { imageAssetId: query.image } : {}),
    ...(query.instrument ? { instrumentId: query.instrument } : {}),
    ...(query.series ? { measurementSeriesId: query.series } : {}),
    ...(query.finding ? { findingId: query.finding } : {}),
    ...(query.proposal ? { geometryProposalId: query.proposal } : {}),
  }
  if (!id) return {}
  if (surface === 'route') return { routeId: id }
  if (surface === 'module') return { moduleId: id }
  if (surface === 'lesson') return { lessonId: id }
  if (surface === 'activity') return { activityId: id }
  return {}
}

function GlossarySurface() {
  const { snapshot } = useLearning()
  const selectedId = snapshot.location.query.term
  const [query, setQuery] = useState('')
  const entries = useMemo(() => academyGlossaryEntries()
    .sort((a, b) => a.term.localeCompare(b.term)), [])
  const filtered = entries.filter((entry) => `${entry.term} ${entry.definitionMarkdown} ${entry.authoring?.synonyms.es.join(' ') ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const selected = entries.find(({ id }) => id === selectedId)
  return (
    <AcademyPage eyebrow="GLOSARIO" title="Vocabulario relojero" description={`${entries.length} términos explicados con equivalencias y definiciones para consultar mientras estudias.`}>
      <div className="academy-reference-layout">
        <div>
          <label className="academy-atlas-search"><Search size={16} /><span className="sr-only">Buscar término</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar término o sinónimo" /><span>{filtered.length}</span></label>
          <div className="academy-glossary-list">
            {filtered.map((entry) => <a className={selectedId === entry.id ? 'is-active' : undefined} href={`#/learning/glossary?term=${encodeURIComponent(entry.id)}`} key={entry.id}><span><strong>{entry.authoring ? localize(snapshot.profile?.locale, entry.authoring.terms) : entry.term}</strong><small>{entry.language}</small></span><ChevronRight size={15} /></a>)}
          </div>
        </div>
        <aside>
          {selected ? (
            <>
              <span className="academy-kicker">DEFINICIÓN</span>
              <h2>{selected.authoring ? localize(snapshot.profile?.locale, selected.authoring.terms) : selected.term}</h2>
              <RestrictedMarkdown markdown={selected.authoring?.simpleDefinition ? localize(snapshot.profile?.locale, selected.authoring.simpleDefinition) : selected.definitionMarkdown} />
              {selected.authoring && (
                <>
                  {selected.authoring.technicalDefinition && <section><span className="academy-kicker">DEFINICIÓN TÉCNICA</span><p>{localize(snapshot.profile?.locale, selected.authoring.technicalDefinition)}</p></section>}
                  <section><span className="academy-kicker">CONTEXTO</span><p>{localize(snapshot.profile?.locale, selected.authoring.context)}</p></section>
                  <dl>
                    <div><dt>Inglés</dt><dd>{selected.authoring.terms.en}</dd></div>
                    <div><dt>Sinónimos</dt><dd>{(normalizeLearningLocale(snapshot.profile?.locale) === 'en-US' ? selected.authoring.synonyms.en : selected.authoring.synonyms.es).join(', ') || 'Ninguno'}</dd></div>
                    <div><dt>Términos desaconsejados</dt><dd>{selected.authoring.discouragedTerms.join(', ') || 'Ninguno'}</dd></div>
                    <div><dt>Fuentes</dt><dd><a href={`#/learning/sources?term=${encodeURIComponent(selected.id)}`}>{selected.authoring.sourceIds.length} referencias</a></dd></div>
                  </dl>
                </>
              )}
              {statefulTechnicalId(selected.id)}
            </>
          ) : <EmptyState icon={BookOpen} title="Selecciona un término" detail="Verás su definición y equivalencias sin salir de la Academia." />}
        </aside>
      </div>
    </AcademyPage>
  )
}

function SourcesSurface() {
  const { snapshot } = useLearning()
  const [query, setQuery] = useState('')
  const [authorityTier, setAuthorityTier] = useState('')
  const [sourceClass, setSourceClass] = useState('')
  const sources = useMemo(() => {
    const map = new Map<string, {
      key: string
      packageTitle: string
      packageVersion: string
      source: (typeof INTEGRATED_LEARNING_CONTENT)[number]['pack']['sources'][number]
    }>()
    INTEGRATED_LEARNING_CONTENT.forEach(({ pack }) => pack.sources.forEach((source) => {
      const key = `${pack.manifest.id}:${source.id}`
      map.set(key, { key, packageTitle: pack.manifest.title, packageVersion: pack.manifest.packageVersion, source })
    }))
    return [...map.values()]
  }, [])
  const contextualSourceIds = useMemo(() => {
    if (snapshot.location.query.lesson) {
      return new Set(academyLessonMaterial(snapshot.product, snapshot.location.query.lesson)?.sources.map(({ id }) => id) ?? [])
    }
    if (snapshot.location.query.term) {
      const term = academyGlossaryEntries().find(({ id }) => id === snapshot.location.query.term)
      return new Set(term?.authoring?.sourceIds ?? [])
    }
    if (snapshot.location.query.source) return new Set([snapshot.location.query.source])
    return undefined
  }, [snapshot.location.query.lesson, snapshot.location.query.source, snapshot.location.query.term, snapshot.product])
  const filtered = sources.filter(({ source, packageTitle }) =>
    (!contextualSourceIds || contextualSourceIds.has(source.id))
    && (!authorityTier || source.authorityTier === authorityTier)
    && (!sourceClass || source.sourceClass === sourceClass)
    && `${source.resource.title} ${source.supportedClaim} ${source.authority} ${source.calibre ?? ''} ${(source.topics ?? []).join(' ')} ${packageTitle}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <AcademyPage eyebrow="FUENTES" title="De dónde sale la información" description="Consulta libros, manuales y documentos usados en las lecciones. Cada fuente indica para qué sirve, sus límites y cuándo se revisó.">
      <div className="academy-source-filters">
        <label className="academy-atlas-search"><Search size={16} /><span className="sr-only">Buscar fuente</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título, tema, calibre, afirmación o autoridad" /><span>{filtered.length}</span></label>
        <label><span>Nivel</span><select value={authorityTier} onChange={(event) => setAuthorityTier(event.target.value)}><option value="">Todos</option><option value="A">A · Oficial primaria</option><option value="B">B · Formación técnica</option><option value="C">C · Práctica experta</option><option value="D">D · Secundaria</option><option value="E">E · Descubrimiento</option></select></label>
        <label><span>Clase</span><select value={sourceClass} onChange={(event) => setSourceClass(event.target.value)}><option value="">Todas</option><option value="official-primary">Documentación primaria vigente</option><option value="official-historical-primary">Documentación oficial histórica</option><option value="institutional-training">Formación institucional</option><option value="historical-training">Formación histórica de taller</option><option value="technical-reference">Referencia técnica</option><option value="expert-observation">Observación experta</option><option value="educational-explainer">Explicación visual</option><option value="database-index">Base de datos</option><option value="historical-context">Historia</option><option value="commercial-course">Curso externo</option><option value="community-discovery">Descubrimiento</option></select></label>
      </div>
      <div className="academy-source-grid">
        {filtered.map(({ key, source, packageTitle, packageVersion }) => {
          const canOpen = ['official-linked', 'external-linked'].includes(source.usage) && source.resource.locator?.startsWith('http')
          return (
            <article key={key}>
              <header><FileCheck2 size={20} /><div><span>{source.authorityTier ? `Nivel ${source.authorityTier} · ` : ''}{friendlyLearningTerm(source.authority)}</span><strong>{friendlyRecommendationReason(source.resource.title)}</strong></div></header>
              <p>{source.supportedClaim}</p>
              <dl>
                <div><dt>Uso</dt><dd>{friendlyLearningTerm(source.usage)}</dd></div>
                <div><dt>Tipo de dato</dt><dd>{friendlyLearningTerm(source.derivedLayer)}</dd></div>
                {source.sourceClass && <div><dt>Clase</dt><dd>{friendlyLearningTerm(source.sourceClass)}</dd></div>}
                {source.currency && <div><dt>Vigencia</dt><dd>{friendlyLearningTerm(source.currency)}</dd></div>}
                {source.availability && <div><dt>Disponibilidad</dt><dd>{friendlyLearningTerm(source.availability)}</dd></div>}
                {source.calibre && <div><dt>Calibre</dt><dd>{source.calibre}</dd></div>}
                {source.checkedAt && <div><dt>Revisada</dt><dd>{learningDate(snapshot.profile?.locale, source.checkedAt)}</dd></div>}
                {(source.chapter || source.page) && <div><dt>Localizador</dt><dd>{[source.chapter, source.page && `p. ${source.page}`].filter(Boolean).join(' · ')}</dd></div>}
              </dl>
              {source.historicalSafety && (
                <aside className={`academy-source-safety is-${source.historicalSafety.operationalUse}`}>
                  <strong>{friendlyLearningTerm(source.historicalSafety.status)}</strong>
                  <span>{source.historicalSafety.operationalUse === 'blocked' ? 'No ejecutar' : friendlyLearningTerm(source.historicalSafety.operationalUse)}</span>
                  <p>{source.historicalSafety.note}</p>
                  {source.historicalSafety.hazardTopics.length > 0 && <p>Riesgos identificados: {source.historicalSafety.hazardTopics.map(friendlyLearningTerm).join(', ')}.</p>}
                </aside>
              )}
              {(source.topics?.length ?? 0) > 0 && <div className="academy-tag-row">{source.topics?.slice(0, 5).map((topic) => <span key={topic}>{topic}</span>)}</div>}
              {source.validationPolicy && <details><summary>Cómo puede usarse</summary><p>{source.validationPolicy}</p>{(source.limitations ?? []).map((limitation) => <p key={limitation}>Límite: {limitation}</p>)}</details>}
              <footer><span>{packageTitle} · v{packageVersion}</span>{canOpen ? <a href={source.resource.locator} target="_blank" rel="noreferrer">Abrir recurso</a> : <span>{source.privateUse ? 'Solo referencia privada local' : 'Sin enlace externo'}</span>}</footer>
            </article>
          )
        })}
      </div>
      {!filtered.length && <EmptyState icon={FileCheck2} title="No hay fuentes para este contexto" detail="El filtro no oculta una referencia existente: el contenido seleccionado no declara ninguna fuente coincidente." />}
    </AcademyPage>
  )
}

function ProgressSurface() {
  const { snapshot } = useLearning()
  const routes = realAcademyRoutes(snapshot.product)
  const view = snapshot.location.query.view ?? 'route'
  const learnerModel = buildAcademyLearnerModel(snapshot)
  const trendLabels = {
    improving: 'mejora',
    stable: 'estable',
    declining: 'necesita refuerzo',
    'insufficient-data': 'faltan intentos comparables',
  } as const
  const masteryFor = (competencyId: string) => snapshot.mastery.items.find((item) => item.competencyId === competencyId) ?? {
    competencyId,
    state: 'not_started' as const,
    strength: 0,
    primaryEvidenceIds: [] as string[],
    reasons: [] as string[],
  }
  const competencyRow = (item: ReturnType<typeof masteryFor>) => (
    <article key={item.competencyId}>
      <div><h3>{competencyLabel(item.competencyId, snapshot.profile?.locale)}</h3><p>{friendlyRecommendationReason(item.reasons[0] ?? (item.state === 'not_started' ? 'Aún no hay resultados asociados.' : 'Estado calculado a partir de resultados compatibles.'))}</p></div>
      <span>{item.primaryEvidenceIds.length} resultados</span>
      <MasteryPill state={item.state} />
    </article>
  )
  const movements = [...new Set(routes.flatMap(({ movementIds }) => movementIds))]
  const subsystems = [...new Set(snapshot.product.activities.filter(({ demo }) => !demo).map(({ subsystem }) => subsystem))].sort()
  return (
    <AcademyPage eyebrow="PROGRESO" title="Lo que ya sabes hacer" description="No usamos una nota global. Cada avance procede de prácticas completadas y criterios visibles.">
      <section className="academy-stat-cards">
        <article><FileCheck2 size={22} /><span>Resultados válidos</span><strong>{snapshot.evidence.items.filter(({ status }) => status === 'active').length}</strong></article>
        <article><CheckCircle2 size={22} /><span>Demostradas</span><strong>{snapshot.mastery.items.filter(({ state }) => state === 'demonstrated').length}</strong></article>
        <article><ShieldCheck size={22} /><span>Consolidadas</span><strong>{snapshot.mastery.items.filter(({ state }) => state === 'retained').length}</strong></article>
        <article><RotateCcw size={22} /><span>En práctica</span><strong>{snapshot.mastery.items.filter(({ state }) => state === 'practising').length}</strong></article>
      </section>
      <nav className="academy-progress-views" aria-label="Agrupar progreso">
        {[['route', 'Por ruta'], ['competency', 'Por competencia'], ['movement', 'Por movimiento'], ['subsystem', 'Por subsistema'], ['evolution', 'Mi evolución']].map(([id, label]) => <a className={view === id ? 'is-active' : undefined} href={`#/learning/progress?view=${id}`} aria-current={view === id ? 'page' : undefined} key={id}>{label}</a>)}
        <a href="#/learning/history">Historial</a>
      </nav>
      {view === 'evolution' && (
        <div className="academy-longitudinal">
          <section className="academy-longitudinal-summary" aria-labelledby="academy-evolution-summary">
            <header>
              <div><span className="academy-kicker">EVOLUCIÓN</span><h2 id="academy-evolution-summary">Tu aprendizaje a lo largo del tiempo</h2></div>
              <span>Calculado solo con resultados guardados en este perfil</span>
            </header>
            <div>
              <article><strong>{learnerModel.summary.activeDays}</strong><span>días de estudio</span></article>
              <article><strong>{learningNumber(snapshot.profile?.locale, learnerModel.summary.successRate, { style: 'percent', maximumFractionDigits: 0 })}</strong><span>comprobaciones superadas</span></article>
              <article><strong>{learnerModel.summary.independentEvidence}</strong><span>resultados sin pistas</span></article>
              <article><strong>{learnerModel.summary.transferredCompetencies}</strong><span>transferencias demostradas</span></article>
              <article><strong>{learnerModel.summary.dueReviews}</strong><span>repasos vencidos</span></article>
              <article><strong>{learnerModel.summary.activeMisconceptions}</strong><span>ideas por corregir</span></article>
            </div>
            <p className={`academy-longitudinal-trend is-${learnerModel.summary.trend}`}>
              Tendencia reciente: <strong>{learnerModel.summary.trend === 'improving' ? 'mejorando' : learnerModel.summary.trend === 'declining' ? 'necesita refuerzo' : learnerModel.summary.trend === 'stable' ? 'estable' : 'aún faltan intentos comparables'}</strong>. No es una nota ni acredita destreza física.
            </p>
          </section>
          {learnerModel.activeMisconceptions.length > 0 && (
            <section className="academy-misconception-list" aria-labelledby="academy-active-misconceptions">
              <header><div><span className="academy-kicker">PRIMERO CORRIGE</span><h2 id="academy-active-misconceptions">Ideas que siguen interfiriendo</h2></div></header>
              <div>{learnerModel.activeMisconceptions.map((item) => (
                <article key={`${item.id}-${item.evidenceId}`}>
                  <CircleAlert size={20} />
                  <div><h3>{item.title}</h3><p>{item.diagnosis}</p><p><strong>Corrección:</strong> {item.correction}</p></div>
                  <a href={`#/learning/lesson/${encodeURIComponent(item.remediationLessonId)}?mode=remediation&misconception=${encodeURIComponent(item.id)}`}>Estudiar de nuevo</a>
                </article>
              ))}</div>
            </section>
          )}
          <section className="academy-concept-progress" aria-labelledby="academy-concept-progress">
            <header><div><span className="academy-kicker">MODELO DEL APRENDIZ</span><h2 id="academy-concept-progress">Conceptos trabajados</h2></div><span>Intentos, ayuda, retención y transferencia permanecen separados</span></header>
            <div>{learnerModel.concepts
              .filter(({ status, completedAttempts, evidenceIds }) => status !== 'not-started' || completedAttempts > 0 || evidenceIds.length > 0)
              .sort((left, right) => {
                const priority = (item: typeof left) => item.activeMisconceptionIds.length ? 0 : item.trend === 'declining' ? 1 : item.nextReviewAt ? 2 : item.status === 'practising' ? 3 : 4
                return priority(left) - priority(right) || left.title.localeCompare(right.title)
              })
              .map((concept) => (
                <article key={concept.conceptId}>
                  <div className="academy-concept-progress__identity">
                    <h3>{concept.title}</h3>
                    <p>{concept.recommendation}</p>
                    <div className="academy-tag-row">
                      <span>{countLabel(concept.completedAttempts, 'intento', 'intentos')}</span>
                      <span>{countLabel(concept.incorrectAttempts, 'error', 'errores')}</span>
                      <span>{countLabel(concept.hintsUsed, 'pista', 'pistas')}</span>
                      <span>{countLabel(concept.transferEvidenceCount, 'transferencia', 'transferencias')}</span>
                    </div>
                  </div>
                  <div className="academy-concept-progress__signal">
                    <span>Confianza actual</span>
                    <strong>{learningNumber(snapshot.profile?.locale, concept.strength, { style: 'percent', maximumFractionDigits: 0 })}</strong>
                    <small>{concept.nextReviewAt ? `Próximo repaso: ${learningDate(snapshot.profile?.locale, concept.nextReviewAt)}` : `Tendencia: ${trendLabels[concept.trend]}`}</small>
                  </div>
                  <MasteryPill state={concept.status === 'not-started' ? 'not_started' : concept.status} />
                </article>
              ))}
            </div>
            {!learnerModel.concepts.some(({ status, completedAttempts, evidenceIds }) => status !== 'not-started' || completedAttempts > 0 || evidenceIds.length > 0) && (
              <EmptyState icon={Gauge} title="Todavía no hay una evolución que comparar" detail="Completa la primera explicación y su práctica. La Academia separará después intentos, pistas, errores, transferencia y retención." />
            )}
          </section>
        </div>
      )}
      {view === 'route' && routes.map((route) => (
        <section className="academy-progress-route" key={route.id}>
          <header><div><span className="academy-kicker">RUTA</span><h2>{localize(snapshot.profile?.locale, route.title)}</h2></div><a href={`#/learning/route/${encodeURIComponent(route.id)}`}>Abrir ruta</a></header>
          <div>{route.competencyIds.map((id) => competencyRow(masteryFor(id)))}</div>
        </section>
      ))}
      {view === 'competency' && (
        <section className="academy-progress-route">
          <header><div><span className="academy-kicker">COMPETENCIAS</span><h2>Estado individual</h2></div></header>
          <div>{[...new Set(routes.flatMap(({ competencyIds }) => competencyIds))].map((id) => competencyRow(masteryFor(id)))}</div>
        </section>
      )}
      {view === 'movement' && movements.map((movementId) => {
        const competencyIds = [...new Set(snapshot.product.activities.filter(({ demo, movementIds }) => !demo && movementIds.includes(movementId)).flatMap(({ competencyIds }) => competencyIds))]
        return (
          <section className="academy-progress-route" key={movementId}>
            <header><div><span className="academy-kicker">MOVIMIENTO</span><h2>{humanizeLearningId(movementId)}</h2></div><a href={`#/learning/movement/${encodeURIComponent(movementId)}`}>Ver contexto</a></header>
            <div>{competencyIds.map((id) => competencyRow(masteryFor(id)))}</div>
          </section>
        )
      })}
      {view === 'subsystem' && subsystems.map((subsystem) => {
        const competencyIds = [...new Set(snapshot.product.activities.filter(({ demo, subsystem: value }) => !demo && value === subsystem).flatMap(({ competencyIds }) => competencyIds))]
        const demonstrated = competencyIds.map(masteryFor).filter(({ state }) => state === 'demonstrated' || state === 'retained').length
        return (
          <section className="academy-progress-route" key={subsystem}>
            <header><div><span className="academy-kicker">SUBSISTEMA</span><h2>{humanizeLearningId(subsystem)}</h2></div><span>{demonstrated} de {competencyIds.length} demostradas</span></header>
            <div>{competencyIds.map((id) => competencyRow(masteryFor(id)))}</div>
          </section>
        )
      })}
    </AcademyPage>
  )
}

function ReviewSurface() {
  const { service, snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'changes-requested' | 'rejected'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const now = new Date().toISOString()
  const showPostponed = snapshot.location.query.postponed === '1'
  const due = [...snapshot.mastery.items]
    .filter(({ state, retentionCandidateAt }) => state === 'practising' || (retentionCandidateAt && retentionCandidateAt <= new Date().toISOString()))
    .sort((a, b) => (a.retentionCandidateAt ?? '').localeCompare(b.retentionCandidateAt ?? ''))
  const upcoming = [...snapshot.mastery.items]
    .filter(({ retentionCandidateAt }) => retentionCandidateAt && retentionCandidateAt > now)
    .sort((a, b) => (a.retentionCandidateAt ?? '').localeCompare(b.retentionCandidateAt ?? ''))
  const postponedIds = new Set((state?.reviewSnoozes ?? []).filter(({ until }) => until > now).map(({ competencyId }) => competencyId))
  const queue = showPostponed ? due : due.filter(({ competencyId }) => !postponedIds.has(competencyId))
  const reviewMarkerTargets = new Set(snapshot.evidence.items
    .filter(({ status }) => status !== 'active')
    .flatMap(({ relatedEvidenceId }) => relatedEvidenceId ? [relatedEvidenceId] : []))
  const pendingHumanReview = snapshot.evidence.items.filter((evidence) => {
    const evaluation = evidence.content.evaluation
    return evidence.status === 'active'
      && !reviewMarkerTargets.has(evidence.id)
      && Boolean(evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation)
        && (evaluation as Record<string, unknown>).pendingReview === true)
  })
  const selectedEvidence = pendingHumanReview.find(({ id }) => id === selectedEvidenceId)
  const submitReview = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedEvidence) return
    setReviewing(true)
    setReviewError('')
    try {
      await service.submitHumanReview({
        sourceEvidenceId: selectedEvidence.id,
        reviewerName,
        decision: reviewDecision,
        notes: reviewNotes,
      })
      setSelectedEvidenceId('')
      setReviewNotes('')
      setReviewDecision('approved')
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : String(error))
    } finally {
      setReviewing(false)
    }
  }
  return (
    <AcademyPage
      eyebrow="REPASO"
      title="Recupera la idea después de 1, 7 y 21 días"
      description="La cola usa resultados independientes y fechas reales. El tiempo de pantalla y la familiaridad declarada nunca cuentan como retención."
      actions={postponedIds.size > 0 && <a className="academy-button is-secondary" href={`#/learning/review${showPostponed ? '' : '?postponed=1'}`}>{showPostponed ? 'Ocultar pospuestos' : `Ver pospuestos (${postponedIds.size})`}</a>}
    >
      <section className="academy-human-review">
        <header>
          <div><span className="academy-kicker">REVISIÓN HUMANA</span><h2>Respuestas que no deben calificarse solas</h2></div>
          <strong>{pendingHumanReview.length} pendientes</strong>
        </header>
        <p>Una explicación abierta, un dossier o una defensa solo cambia tu dominio cuando una persona identificada revisa la evidencia y justifica su decisión.</p>
        {pendingHumanReview.length > 0 ? (
          <div className="academy-human-review__layout">
            <div className="academy-human-review__queue">
              {pendingHumanReview.map((evidence) => {
                const activity = snapshot.product.activities.find(({ id }) => id === evidence.activityId)
                return (
                  <button
                    type="button"
                    className={selectedEvidenceId === evidence.id ? 'is-active' : undefined}
                    onClick={() => setSelectedEvidenceId(evidence.id)}
                    key={evidence.id}
                  >
                    <span>{activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(evidence.activityId)}</span>
                    <small>{competencyLabel(evidence.competencyId, snapshot.profile?.locale)} · {learningDate(snapshot.profile?.locale, evidence.observedAt)}</small>
                  </button>
                )
              })}
            </div>
            {selectedEvidence ? (
              <form onSubmit={(event) => void submitReview(event)}>
                <label>Persona revisora<input value={reviewerName} minLength={2} maxLength={120} required onChange={(event) => setReviewerName(event.target.value)} /></label>
                <label>Decisión<select value={reviewDecision} onChange={(event) => setReviewDecision(event.target.value as typeof reviewDecision)}><option value="approved">Aprobada</option><option value="changes-requested">Necesita cambios</option><option value="rejected">No aprobada</option></select></label>
                <label>Justificación<textarea value={reviewNotes} minLength={10} maxLength={2000} required rows={6} placeholder="Qué criterios cumple, qué falta y qué evidencia sustenta la decisión." onChange={(event) => setReviewNotes(event.target.value)} /></label>
                <details><summary>Ver respuesta original</summary><pre>{JSON.stringify(selectedEvidence.content, null, 2)}</pre></details>
                {reviewError && <p className="academy-human-review__error" role="alert">{reviewError}</p>}
                <button className="academy-button is-primary" type="submit" disabled={reviewing}>{reviewing ? 'Guardando revisión…' : 'Firmar y guardar revisión'}</button>
              </form>
            ) : <div className="academy-human-review__empty">Selecciona una respuesta para revisar su contenido y registrar una decisión trazable.</div>}
          </div>
        ) : <p className="academy-human-review__empty">No hay respuestas abiertas pendientes. Las nuevas aparecerán aquí después de guardar una práctica que exija revisión.</p>}
      </section>
      {queue.length ? (
        <div className="academy-review-list">
          {queue.map((item) => {
            const activities = snapshot.product.activities.filter(({ competencyIds, demo }) => !demo && competencyIds.includes(item.competencyId))
            const activity = activities[0]
            const alternative = activities[1]
            const snooze = state?.reviewSnoozes.find(({ competencyId }) => competencyId === item.competencyId)
            const needsIndependentDemonstration = item.state === 'practising'
            return (
              <article key={item.competencyId}>
                <div className="academy-review-list__icon"><RotateCcw size={20} /></div>
                <div><span className="academy-kicker">{snooze && snooze.until > now ? 'POSPUESTO' : item.retentionCandidateAt ? `REPASO ${item.reviewStage ?? 1} DE 3` : 'PRÁCTICA EN CURSO'}</span><h2>{competencyLabel(item.competencyId, snapshot.profile?.locale)}</h2><p>{friendlyRecommendationReason(item.reasons.join(' ') || 'Conviene completar una nueva práctica en otro contexto.')}</p>{snooze && snooze.until > now ? <small>Pospuesto hasta {learningDate(snapshot.profile?.locale, snooze.until)}</small> : item.retentionCandidateAt && <small>Programado para {learningDate(snapshot.profile?.locale, item.retentionCandidateAt)} · recuperación independiente</small>}</div>
                <MasteryPill state={item.state} />
                <div className="academy-review-actions">
                  {activity
                    ? <a className="academy-button is-primary" href={`${activityHref(activity.id)}?mode=${needsIndependentDemonstration ? 'demonstration' : 'retention'}`}>{needsIndependentDemonstration ? 'Demostrar sin ayuda' : 'Recuperar sin ayuda'} <ArrowRight size={15} /></a>
                    : <a href="#/learning/explore">Buscar en rutas</a>}
                  {alternative && !needsIndependentDemonstration && <a href={`${activityHref(alternative.id)}?mode=retention`}>Cambiar contexto de repaso</a>}
                  {snooze && snooze.until > now
                    ? <button type="button" onClick={() => actions.clearReviewSnooze(item.competencyId)}>Reactivar</button>
                    : <button type="button" onClick={() => actions.postponeReview(item.competencyId, new Date(Date.now() + 86_400_000).toISOString())}>Posponer 1 día</button>}
                  <details><summary>Por qué se recomienda</summary><p>{friendlyRecommendationReason(item.reasons.join(' ') || `Estado actual: ${masteryLabels[item.state]}. Se necesita otra práctica independiente.`)}</p></details>
                </div>
              </article>
            )
          })}
        </div>
      ) : <EmptyState icon={CheckCircle2} title="No hay repasos pendientes" detail="Cuando una competencia necesite práctica o alcance su fecha de retención aparecerá aquí con el motivo." action={<a className="academy-button is-primary" href="#/learning/explore">Explorar una ruta</a>} />}
      {upcoming.length > 0 && (
        <section className="academy-progress-route">
          <header><div><span className="academy-kicker">PRÓXIMOS REPASOS</span><h2>Calendario de consolidación</h2></div><span>1 · 7 · 21 días</span></header>
          <div>
            {upcoming.map((item) => (
              <article key={item.competencyId}>
                <div><h3>{competencyLabel(item.competencyId, snapshot.profile?.locale)}</h3><p>Recuperación independiente, sin volver a enseñar la respuesta antes del intento.</p></div>
                <span>Repaso {item.reviewStage ?? 1} de 3</span>
                <strong>{learningDate(snapshot.profile?.locale, item.retentionCandidateAt!)}</strong>
              </article>
            ))}
          </div>
        </section>
      )}
    </AcademyPage>
  )
}

function ResultsSurface() {
  const { snapshot } = useLearning()
  const result = snapshot.result
  if (!result) return <EmptyState icon={Clock3} title="El resultado ya no está en memoria" detail="La sesión y sus evidencias siguen persistidas. Ábrelas desde el historial." action={<a className="academy-button is-primary" href="#/learning/history">Abrir historial</a>} />
  const activity = snapshot.product.activities.find(({ id }) => id === result.session.activityId)
  const route = realAcademyRoutes(snapshot.product).find((candidate) =>
    academyRouteTree(snapshot.product, candidate.id)?.activityIds.includes(result.session.activityId))
  const hintIds = [...new Set(result.evidence.flatMap(({ content }) => {
    const value = content.hintIds ?? content.hintEventIds
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }))]
  const accommodations = [...new Set(result.evidence.flatMap(({ accessibilityAccommodations }) => accessibilityAccommodations))]
  const assessmentSummary = friendlyAssessmentSummary(
    result.assessment.explanation.summary,
    result.assessment.result.passed,
  )
  const pendingReviewEvidence = result.assessment.explanation.ignoredEvidence.filter(({ reason }) =>
    reason.toLocaleLowerCase('es').includes('revisión'))
  const causalFeedback = activity?.feedbackContract
  const detectedMisconceptions = causalFeedback?.misconceptionIds.flatMap((id) => {
    const misconception = snapshot.product.misconceptions.find((candidate) => candidate.id === id)
    return misconception ? [misconception] : []
  }) ?? []
  return (
    <AcademyPage eyebrow="RESULTADO" title={result.assessment.result.passed ? 'Práctica completada' : 'Práctica registrada'} description="El modelo se ha restaurado y tu resultado ha quedado guardado en este equipo.">
      <section className={`academy-result-hero ${result.assessment.result.passed ? 'is-passed' : ''}`}>
        {result.assessment.result.passed ? <CheckCircle2 size={34} /> : <CircleAlert size={34} />}
        <div><span className="academy-kicker">{result.assessment.result.passed ? 'OBJETIVO CONSEGUIDO' : 'QUEDAN PUNTOS POR REVISAR'}</span><h2>{activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(result.session.activityId)}</h2><p>{assessmentSummary}</p></div>
      </section>
      {causalFeedback && (
        <section className="academy-causal-feedback">
          <div>
            <span className="academy-kicker">{result.assessment.result.passed ? 'POR QUÉ ENCAJA' : 'QUÉ REVISAR'}</span>
            <h2>{result.assessment.result.passed ? 'Explicación causal' : 'Diagnóstico del intento'}</h2>
            <p>{localize(snapshot.profile?.locale, result.assessment.result.passed
              ? causalFeedback.correctExplanation
              : causalFeedback.incorrectDiagnosis)}</p>
          </div>
          <div>
            <span className="academy-kicker">SIGUIENTE OBSERVACIÓN</span>
            <h2>{localize(snapshot.profile?.locale, causalFeedback.causalQuestion)}</h2>
            <p>{localize(snapshot.profile?.locale, causalFeedback.nextObservation)}</p>
            {causalFeedback.transferPrompt && <p><strong>Transferencia:</strong> {localize(snapshot.profile?.locale, causalFeedback.transferPrompt)}</p>}
          </div>
        </section>
      )}
      {pendingReviewEvidence.length > 0 && (
        <section className="academy-prerequisite-note">
          <NotebookPen size={18} />
          <div>
            <strong>Tu explicación se ha guardado, pero no se ha calificado sola</strong>
            <p>Hay {pendingReviewEvidence.length} respuesta(s) de razonamiento pendientes de revisión explícita. Comprueba que cada una separa observación, relación causal, fuente, límite y confianza. Mientras tanto, la evaluación solo usa acciones deterministas válidas.</p>
          </div>
        </section>
      )}
      {detectedMisconceptions.length > 0 && (
        <section className="academy-misconceptions">
          <header><span className="academy-kicker">ERRORES CONCEPTUALES RELACIONADOS</span><h2>No memorices la opción: corrige el modelo mental</h2></header>
          <div>
            {detectedMisconceptions.map((misconception) => (
              <article key={misconception.id}>
                <h3>{localize(snapshot.profile?.locale, misconception.title)}</h3>
                <p>{localize(snapshot.profile?.locale, misconception.diagnosis)}</p>
                <p><strong>Corrección:</strong> {localize(snapshot.profile?.locale, misconception.correction)}</p>
                <a href={`#/learning/lesson/${encodeURIComponent(misconception.remediationLessonId)}`}>Abrir explicación de refuerzo <ArrowRight size={14} /></a>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="academy-stat-cards">
        <article><FileCheck2 size={22} /><span>Resultados guardados</span><strong>{result.evidence.length}</strong></article>
        <article><Gauge size={22} /><span>Estado anterior</span><strong>{masteryLabel(result.previousState)}</strong></article>
        <article><ShieldCheck size={22} /><span>Estado actual</span><strong>{masteryLabels[result.mastery?.state ?? result.assessment.result.resultingState]}</strong></article>
      </section>
      <section className="academy-result-explanation">
        <div><span className="academy-kicker">QUÉ CAMBIÓ</span><h2>Tu progreso</h2><p>{friendlyRecommendationReason(result.mastery?.reasons.join(' ') || assessmentSummary)}</p><a href={`#/learning/session/${encodeURIComponent(result.session.id)}`}>Ver cómo se calculó</a></div>
        <div><span className="academy-kicker">SIGUIENTE PASO</span><h2>{result.nextRecommendation.title}</h2><p>{friendlyRecommendationReason(result.nextRecommendation.reason)}</p><a href={result.nextRecommendation.href}>Continuar</a></div>
      </section>
      <section className="academy-result-detail-grid">
        <div>
          <span className="academy-kicker">RESULTADOS GUARDADOS</span>
          <h2>{result.evidence.length} {result.evidence.length === 1 ? 'resultado' : 'resultados'} de esta práctica</h2>
          {result.evidence.map((evidence) => (
            <a href={`#/learning/evidence/${encodeURIComponent(evidence.id)}`} key={evidence.id}>
              <span><strong>{friendlyLearningTerm(evidence.evidenceType)}</strong><small>{competencyLabel(evidence.competencyId, snapshot.profile?.locale)}</small></span>
              <span>{learningNumber(snapshot.profile?.locale, evidence.confidence, { style: 'percent' })}</span>
            </a>
          ))}
        </div>
        <div>
          <span className="academy-kicker">RESUMEN</span>
          <h2>Qué has conseguido</h2>
          <dl>
            <div><dt>Criterios satisfechos</dt><dd>{result.assessment.explanation.satisfiedRuleIds.length}</dd></div>
            <div><dt>Criterios pendientes</dt><dd>{result.assessment.explanation.unsatisfiedRuleIds.length}</dd></div>
            <div><dt>Pistas usadas</dt><dd>{hintIds.length}</dd></div>
            <div><dt>Adaptaciones</dt><dd>{accommodations.join(', ') || 'Ninguna'}</dd></div>
            <div><dt>Errores relevantes</dt><dd>{result.session.reason ?? 'Ninguno registrado'}</dd></div>
            {activity && <div><dt>Alcance del modelo</dt><dd>{friendlyFidelity(activity.fidelity).summary}</dd></div>}
          </dl>
          {activity?.fidelity.limitations.length ? <details><summary>Limitaciones del modelo</summary><ul>{activity.fidelity.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details> : null}
        </div>
      </section>
      <div className="academy-button-row">
        <a className="academy-button is-secondary" href={activityHref(result.session.activityId)}><RotateCcw size={15} /> Repetir práctica</a>
        {route && <a className="academy-button is-primary" href={`#/learning/route/${encodeURIComponent(route.id)}`}>Volver a la ruta <ArrowRight size={15} /></a>}
      </div>
    </AcademyPage>
  )
}

function PreferencesSurface() {
  const { service, snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const [diagnosticRevision, setDiagnosticRevision] = useState(0)
  if (!state || !snapshot.profile) return null
  const accessibility = snapshot.profile.accessibility
  const mutationDiagnostics = service.profileMutationDiagnostics()
  const exportMutationDiagnostics = () => {
    const url = URL.createObjectURL(new Blob([service.exportProfileMutationDiagnostics()], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'watchmaking-academy-diagnostico-persistencia.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <AcademyPage eyebrow="PREFERENCIAS" title="Una Academia que se adapta a ti" description="Las preferencias de interfaz son locales. Las adaptaciones de accesibilidad nunca penalizan la evaluación.">
      <div className="academy-preferences-grid">
        <section>
          <span className="academy-kicker">INTERFAZ</span><h2>Presentación</h2>
          <label>Tema<select value={state.preferences.theme} onChange={(event) => actions.setPreferences({ theme: event.target.value as 'system' | 'dark' | 'light' })}><option value="system">Seguir sistema</option><option value="dark">Oscuro</option><option value="light">Claro</option></select></label>
          <label>Densidad<select value={state.preferences.density} onChange={(event) => actions.setPreferences({ density: event.target.value as 'comfortable' | 'compact' })}><option value="comfortable">Cómoda</option><option value="compact">Compacta</option></select></label>
          <label>Vista inicial de las lecciones<select value={state.preferences.lessonMode} onChange={(event) => actions.setPreferences({ lessonMode: event.target.value as AcademyLessonMode })}><option value="reading">Teoría</option><option value="visual">Modelo</option><option value="split">Teoría + modelo</option><option value="focus">Lectura limpia</option><option value="textual">Texto accesible</option></select></label>
          <label>Ancho de lectura<select value={state.preferences.readingWidth} onChange={(event) => actions.setPreferences({ readingWidth: event.target.value as 'narrow' | 'comfortable' | 'wide' })}><option value="narrow">Estrecho</option><option value="comfortable">Cómodo</option><option value="wide">Amplio</option></select></label>
          <label>Interlineado<select value={state.preferences.lineHeight} onChange={(event) => actions.setPreferences({ lineHeight: Number(event.target.value) as 1.5 | 1.7 | 1.9 })}><option value="1.5">Compacto</option><option value="1.7">Cómodo</option><option value="1.9">Amplio</option></select></label>
          <label>Proporción lectura / visual<select value={state.preferences.workspaceRatio} onChange={(event) => actions.setPreferences({ workspaceRatio: event.target.value as '35-65' | '50-50' | '65-35' })}><option value="35-65">35 / 65</option><option value="50-50">50 / 50</option><option value="65-35">65 / 35</option></select></label>
          <label className="academy-check"><input type="checkbox" checked={state.preferences.showTechnicalIds} onChange={(event) => actions.setPreferences({ showTechnicalIds: event.target.checked })} />Mostrar identificadores técnicos en las fichas</label>
          <label className="academy-check"><input type="checkbox" checked={state.preferences.autoplayEducationalMotion} onChange={(event) => actions.setPreferences({ autoplayEducationalMotion: event.target.checked })} />Reproducir automáticamente movimiento educativo</label>
        </section>
        <section>
          <span className="academy-kicker">ACCESIBILIDAD</span><h2>Lectura e interacción</h2>
          <label>Escala de texto<input type="range" min="1" max="2" step="0.05" value={Math.max(1, accessibility.textScale)} onChange={(event) => void service.updateProfile({ accessibility: { ...accessibility, textScale: Number(event.target.value) } })} /><span>{learningNumber(snapshot.profile.locale, Math.max(1, accessibility.textScale), { style: 'percent' })}</span></label>
          <div className="academy-text-scale-presets" role="group" aria-label="Tamaños de texto rápidos">
            {[1, 1.25, 1.5, 2].map((scale) => (
              <button
                type="button"
                className={Math.abs(accessibility.textScale - scale) < 0.01 ? 'is-active' : undefined}
                aria-pressed={Math.abs(accessibility.textScale - scale) < 0.01}
                onClick={() => void service.updateProfile({ accessibility: { ...accessibility, textScale: scale } })}
                key={scale}
              >
                {learningNumber(snapshot.profile?.locale, scale, { style: 'percent' })}
              </button>
            ))}
          </div>
          <label>Contraste<select value={accessibility.contrast} onChange={(event) => void service.updateProfile({ accessibility: { ...accessibility, contrast: event.target.value as typeof accessibility.contrast } })}><option value="system">Seguir sistema</option><option value="normal">Normal</option><option value="high">Alto contraste</option></select></label>
          <label className="academy-check"><input type="checkbox" checked={accessibility.reducedMotion} onChange={(event) => void service.updateProfile({ accessibility: { ...accessibility, reducedMotion: event.target.checked } })} />Reducir movimiento y sustituir animaciones no esenciales</label>
          <label className="academy-check"><input type="checkbox" checked={accessibility.readLabels} onChange={(event) => void service.updateProfile({ accessibility: { ...accessibility, readLabels: event.target.checked } })} />Priorizar etiquetas textuales</label>
        </section>
        <section>
          <span className="academy-kicker">TUS DATOS</span><h2>Guardado en este equipo</h2>
          <p>El perfil, las sesiones, los resultados y las notas permanecen en este dispositivo. No se envían ni sincronizan por sí solos.</p>
          <dl><div><dt>Notas privadas</dt><dd>{state.notes.length}</dd></div><div><dt>Métricas agregadas</dt><dd>{state.metrics.length}</dd></div><div><dt>Estado</dt><dd>{snapshot.online ? 'Con conexión' : 'Sin conexión'}</dd></div></dl>
          <details><summary>Detalles del almacenamiento</summary><p>{snapshot.backend === 'sqlite' ? 'Aplicación de escritorio · base de datos local' : 'Navegador · almacenamiento local'}</p></details>
          <details key={diagnosticRevision}>
            <summary>Diagnóstico técnico de guardado</summary>
            <p>{service.profileMutationPending(snapshot.profile.id)} escritura(s) pendiente(s) · {mutationDiagnostics.length} operación(es) en el registro acotado.</p>
            <p>El diagnóstico usa un hash local del perfil y no incluye el contenido de notas o prácticas.</p>
            <div className="academy-inline-actions">
              <button className="academy-button is-secondary" type="button" onClick={exportMutationDiagnostics} disabled={!mutationDiagnostics.length}><Download size={15} /> Exportar diagnóstico</button>
              <button className="academy-button is-secondary" type="button" onClick={() => { service.clearProfileMutationDiagnostics(); setDiagnosticRevision((value) => value + 1) }} disabled={!mutationDiagnostics.length}><Trash2 size={15} /> Borrar diagnóstico</button>
            </div>
          </details>
          <button className="academy-button is-secondary" type="button" onClick={() => actions.clearMetrics()} disabled={!state.metrics.length}>Borrar datos de uso de la interfaz</button>
          <a href="#/learning/profile">Administrar perfil, copias y eliminación</a>
        </section>
      </div>
      <AcademyReaderMetricsPanel profileId={snapshot.profile.id} />
    </AcademyPage>
  )
}

function OnboardingSurface() {
  const { service, snapshot } = useLearning()
  const { state, actions } = useAcademyLocalState(snapshot.profile?.id)
  const [experience, setExperience] = useState(state?.onboarding.experience ?? 'new')
  const [hasDisassembledMovement, setHasDisassembledMovement] = useState(state?.onboarding.hasDisassembledMovement ?? false)
  const [quartzKnowledge, setQuartzKnowledge] = useState<'none' | 'basic' | 'practical'>(state?.onboarding.quartzKnowledge ?? 'none')
  const [mechanicalKnowledge, setMechanicalKnowledge] = useState<'none' | 'basic' | 'practical'>(state?.onboarding.mechanicalKnowledge ?? 'none')
  const [tools, setTools] = useState<string[]>(state?.onboarding.tools ?? [])
  const [goals, setGoals] = useState<string[]>(state?.onboarding.goals ?? [])
  const [minutes, setMinutes] = useState<15 | 25 | 45 | 60>(state?.onboarding.sessionMinutes ?? 25)
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>(state?.onboarding.accessibilityNeeds ?? [])
  const toggleGoal = (goal: string) => setGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal])
  const toggleValue = (value: string, values: string[], update: (next: string[]) => void) =>
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  const finish = async () => {
    actions.completeOnboarding({
      experience,
      hasDisassembledMovement,
      quartzKnowledge,
      mechanicalKnowledge,
      tools,
      goals,
      sessionMinutes: minutes,
      accessibilityNeeds,
    })
    if (snapshot.profile) {
      await service.updateEducationalPreferences((current) => ({ ...current, academyOnboardingVersion: 1 }))
      await service.updateProfile({
        accessibility: {
          ...snapshot.profile.accessibility,
          reducedMotion: accessibilityNeeds.includes('reduced-motion') || snapshot.profile.accessibility.reducedMotion,
          textScale: accessibilityNeeds.includes('large-text') ? Math.max(1.25, snapshot.profile.accessibility.textScale) : snapshot.profile.accessibility.textScale,
          contrast: accessibilityNeeds.includes('high-contrast') ? 'high' : snapshot.profile.accessibility.contrast,
          interactionMode: accessibilityNeeds.includes('keyboard') ? 'keyboard' : snapshot.profile.accessibility.interactionMode,
        },
      })
    }
    service.navigate({ surface: 'home', query: {} }, true)
  }
  return (
    <AcademyPage eyebrow="BIENVENIDA" title="Configura tu punto de partida" description="Esto solo adapta recomendaciones y presentación. No bloquea rutas ni altera el currículo.">
      <div className="academy-onboarding">
        <section><span>1</span><div><h2>¿Qué experiencia tienes?</h2><div className="academy-choice-grid">{([
          ['new', 'Empiezo desde cero'],
          ['quartz-practice', 'Conozco relojes de cuarzo'],
          ['mechanical-practice', 'He trabajado con mecánicos'],
          ['advanced', 'Tengo experiencia avanzada'],
        ] as const).map(([id, label]) => <button type="button" className={experience === id ? 'is-active' : undefined} aria-pressed={experience === id} onClick={() => setExperience(id)} key={id}>{label}</button>)}</div></div></section>
        <section><span>2</span><div><h2>Experiencia práctica y conocimientos</h2><label className="academy-check"><input type="checkbox" checked={hasDisassembledMovement} onChange={(event) => setHasDisassembledMovement(event.target.checked)} />He desmontado al menos un movimiento</label><div className="academy-onboarding-knowledge"><label>Cuarzo<select value={quartzKnowledge} onChange={(event) => setQuartzKnowledge(event.target.value as typeof quartzKnowledge)}><option value="none">Sin experiencia</option><option value="basic">Conceptos básicos</option><option value="practical">Experiencia práctica</option></select></label><label>Mecánica<select value={mechanicalKnowledge} onChange={(event) => setMechanicalKnowledge(event.target.value as typeof mechanicalKnowledge)}><option value="none">Sin experiencia</option><option value="basic">Conceptos básicos</option><option value="practical">Experiencia práctica</option></select></label></div><h3>Herramientas disponibles</h3><div className="academy-choice-grid is-four">{['Lupa', 'Pinzas', 'Destornilladores', 'Portamovimiento'].map((tool) => <button type="button" className={tools.includes(tool) ? 'is-active' : undefined} aria-pressed={tools.includes(tool)} onClick={() => toggleValue(tool, tools, setTools)} key={tool}>{tool}</button>)}</div></div></section>
        <section><span>3</span><div><h2>¿Qué quieres conseguir?</h2><div className="academy-choice-grid">{['Comprender el funcionamiento', 'Reconocer piezas y relaciones', 'Practicar montaje y diagnóstico', 'Dominar cálculo y metrología', 'Comparar calibres documentados', 'Diseñar mi propio reloj'].map((goal) => <button type="button" className={goals.includes(goal) ? 'is-active' : undefined} aria-pressed={goals.includes(goal)} onClick={() => toggleGoal(goal)} key={goal}>{goal}</button>)}</div></div></section>
        <section><span>4</span><div><h2>Sesión y accesibilidad</h2><div className="academy-choice-grid is-four">{([15, 25, 45, 60] as const).map((value) => <button type="button" className={minutes === value ? 'is-active' : undefined} aria-pressed={minutes === value} onClick={() => setMinutes(value)} key={value}>{value} min</button>)}</div><h3>Necesidades de accesibilidad</h3><div className="academy-choice-grid">{[['reduced-motion', 'Movimiento reducido'], ['large-text', 'Texto ampliado'], ['high-contrast', 'Alto contraste'], ['keyboard', 'Prioridad de teclado']].map(([id, label]) => <button type="button" className={accessibilityNeeds.includes(id) ? 'is-active' : undefined} aria-pressed={accessibilityNeeds.includes(id)} onClick={() => toggleValue(id, accessibilityNeeds, setAccessibilityNeeds)} key={id}>{label}</button>)}</div></div></section>
        <footer><p>Podrás cambiarlo después. Tus elecciones permanecen en este dispositivo.</p><button className="academy-button is-primary" type="button" onClick={() => void finish()}>Entrar en la Academia <ArrowRight size={16} /></button></footer>
      </div>
    </AcademyPage>
  )
}

function NotFoundSurface() {
  return <EmptyState title="Esta vista no existe o el contenido ya no está instalado" detail="No se ha realizado ninguna acción. Vuelve a la Academia para elegir una ruta válida." action={<a className="academy-button is-primary" href="#/learning/home">Volver a Inicio</a>} />
}

export function AcademySurfaces() {
  const { snapshot } = useLearning()
  const surface = snapshot.location.surface
  if (surface === 'home') return <AcademyPathHomeSurface />
  if (surface === 'my-learning') return <AcademyPathSurface />
  if (surface === 'explore') return <AcademyLibrarySurface />
  if (surface === 'route') return <RouteSurface />
  if (surface === 'module') return <ModuleSurface />
  if (surface === 'lesson') return (
    <Suspense fallback={<div className="academy-empty-state" role="status"><p>Preparando el lector continuo…</p></div>}>
      <AcademyContinuousLessonSurface />
    </Suspense>
  )
  if (surface === 'workshop') return <WorkshopSurface />
  if (surface === 'engineering') return <EngineeringLabSurface />
  if (surface === 'metrology') return <MetrologySurface />
  if (surface === 'atlas') return <AtlasSurface />
  if (surface === 'search') return <SearchSurface />
  if (surface === 'notebook') return <NotebookSurface />
  if (surface === 'glossary') return <GlossarySurface />
  if (surface === 'sources') return <SourcesSurface />
  if (surface === 'progress') return <ProgressSurface />
  if (surface === 'review') return <ReviewSurface />
  if (surface === 'results') return <ResultsSurface />
  if (surface === 'preferences') return <PreferencesSurface />
  if (surface === 'editorial-review') return <Suspense fallback={<div className="academy-empty-state" role="status"><p>Preparando la revisión personal…</p></div>}><AcademyEditorialReviewSurface /></Suspense>
  if (surface === 'usability') return <Suspense fallback={<div className="academy-empty-state" role="status"><p>Preparando el recorrido personal…</p></div>}><AcademyUsabilityHarnessSurface /></Suspense>
  if (surface === 'onboarding') return <OnboardingSurface />
  return <NotFoundSurface />
}

export default AcademySurfaces
