import { lazy, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Archive,
  ArrowRight,
  BookMarked,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Circle,
  CircleAlert,
  Download,
  FileCheck2,
  FileClock,
  Filter,
  FolderArchive,
  Gauge,
  HardDrive,
  History,
  Info,
  Languages,
  LoaderCircle,
  PackageCheck,
  PackageMinus,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import type { MasteryState } from '../assessment'
import { contextualTutorGuidance, LEARNING_CYCLE } from '../academy/academyPedagogy'
import { competencyLabel, humanizeLearningId } from '../academy/academyCatalog'
import { academyPersonalActivityPresentation } from '../academy/reader/academyPersonalCurriculum'
import { learningDate, learningNumber, localize } from '../application/i18n'
import type { LearningDeletionPreview } from '../persistence/deletionService'
import type {
  LearningMasteryProjection,
  PersistentAssessment,
  PersistentEvidenceRecord,
  PersistentLearningSession,
} from '../persistence/models'
import type { RecoveryAction } from '../persistence/recoveryService'
import type { LearningActivityDescriptor, LearningRouteDescriptor } from '../product/demoPackage'
import { useLearning } from './LearningContext'
import {
  friendlyAssessmentIntent,
  friendlyDifficulty,
  friendlyEvidenceLevel,
  friendlyFidelity,
  friendlyLearningTerm,
  friendlyPedagogicalPurpose,
  friendlyRecommendationReason,
} from './learningUiLanguage'

const AcademySurfaces = lazy(() => import('./AcademySurfaces'))

function sessionReferenceLabel(session: PersistentLearningSession): string {
  if (session.reference.kind === 'project') return `Proyecto ${friendlyLearningTerm(session.reference.projectId)}`
  if (session.reference.kind === 'template') return `Plantilla ${friendlyLearningTerm(session.reference.templateId)}`
  if (session.reference.kind === 'fixture') return friendlyLearningTerm(session.reference.fixtureId)
  return session.reference.fixtureIds.map(friendlyLearningTerm).join(' y ')
}

function sessionResourceLabel(
  session: PersistentLearningSession,
  activity?: LearningActivityDescriptor,
): string {
  if (activity?.manufacturingContract) return 'Expediente de fabricación'
  if (activity?.personalWatchDesignContract) return 'Dossier de diseño'
  if (activity?.validationContract) return 'Protocolo de validación'
  if (activity?.serviceProcedureContract) return 'Espacio de procedimiento'
  if (activity?.comparativeArchitectureContract) return 'Dossier comparativo'
  return sessionReferenceLabel(session)
}

function sessionStepLabel(
  session: PersistentLearningSession,
  activity?: LearningActivityDescriptor,
): string {
  if (!session.checkpoint?.activeStepId) return 'Sin paso guardado'
  if (activity?.manufacturingContract) return 'Plan de proceso guardado'
  if (activity?.personalWatchDesignContract) return 'Decisión de diseño guardada'
  if (activity?.validationContract) return 'Resultado de protocolo guardado'
  if (activity?.serviceProcedureContract) return 'Respuesta de procedimiento guardada'
  if (activity?.comparativeArchitectureContract) return 'Comparación guardada'
  return friendlyLearningTerm(session.checkpoint.activeStepId)
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="learning-page-header">
      <div>
        <span className="learning-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="learning-page-actions">{actions}</div>}
    </header>
  )
}

function EmptyState({
  icon: Icon = Info,
  title,
  detail,
  action,
}: {
  icon?: typeof Info
  title: string
  detail: string
  action?: React.ReactNode
}) {
  return (
    <section className="learning-state">
      <Icon size={25} />
      <div><h2>{title}</h2><p>{detail}</p></div>
      {action}
    </section>
  )
}

const masteryLabels: Record<MasteryState, string> = {
  not_started: 'No iniciado',
  introduced: 'Introducido',
  practising: 'En práctica',
  demonstrated: 'Demostrado',
  retained: 'Consolidado',
}

function MasteryBadge({ state }: { state: MasteryState }) {
  const icons: Record<MasteryState, typeof Circle> = {
    not_started: Circle,
    introduced: Info,
    practising: RefreshCcw,
    demonstrated: Check,
    retained: ShieldCheck,
  }
  const Icon = icons[state]
  return <span className={`mastery-badge mastery-badge--${state}`}><Icon size={13} />{masteryLabels[state]}</span>
}

const sessionStateLabels: Record<PersistentLearningSession['state'], string> = {
  created: 'Creada',
  preparing: 'Preparando',
  ready: 'Lista',
  active: 'Activa',
  paused: 'En pausa',
  awaiting_interaction: 'Esperando una acción',
  suspended: 'Guardada',
  interrupted: 'Interrumpida',
  recovering: 'Recuperando',
  completed: 'Completada',
  cancelled: 'Cancelada',
  failed: 'Con incidencia',
  archived: 'Archivada',
}

function SessionState({ state }: { state: PersistentLearningSession['state'] }) {
  return <span className={`session-state session-state--${state}`}>{sessionStateLabels[state]}</span>
}

function packageStatusLabel(status: string): string {
  return ({
    staged: 'Preparando',
    active: 'Disponible',
    failed: 'Necesita atención',
    retained: 'Conservado por una sesión',
    removed: 'Retirado',
  } as Record<string, string>)[status] ?? friendlyLearningTerm(status)
}

function packageOriginLabel(origin: string): string {
  return ({
    integrated: 'Incluido con la Academia',
    'local-unsigned': 'Importado en este equipo',
  } as Record<string, string>)[origin] ?? friendlyLearningTerm(origin)
}

function learningDataCategoryLabel(value: string): string {
  return ({
    profiles: 'Perfiles',
    sessions: 'Sesiones',
    events: 'Acciones registradas',
    evidence: 'Resultados guardados',
    assessments: 'Comprobaciones',
    mastery: 'Progreso por competencia',
  } as Record<string, string>)[value] ?? friendlyLearningTerm(value)
}

function backupKindLabel(value: string): string {
  return ({
    'pre-migration': 'Antes de una actualización',
    'pre-restore': 'Antes de una restauración',
    manual: 'Creada manualmente',
    'scheduled-daily': 'Copia diaria',
    'scheduled-weekly': 'Copia semanal',
    'metrology-metadata': 'Datos de metrología',
    'metrology-full': 'Metrología completa',
  } as Record<string, string>)[value] ?? friendlyLearningTerm(value)
}

function EvidenceRow({ evidence }: { evidence: PersistentEvidenceRecord }) {
  const { snapshot } = useLearning()
  return (
    <article className="learning-record">
      <div className="learning-record__marker" aria-hidden="true"><FileCheck2 size={16} /></div>
      <div>
        <div className="learning-record__heading">
          <strong>{friendlyLearningTerm(evidence.evidenceType)}</strong>
          <span>{learningDate(snapshot.profile?.locale, evidence.observedAt)}</span>
        </div>
        <p>{competencyLabel(evidence.competencyId, snapshot.profile?.locale)} · confianza {learningNumber(snapshot.profile?.locale, evidence.confidence, { style: 'percent' })}</p>
        <div className="learning-tag-row">
          <span>{friendlyLearningTerm(evidence.status)}</span>
          <span>{evidence.sourceEventIds.length} {evidence.sourceEventIds.length === 1 ? 'acción registrada' : 'acciones registradas'}</span>
        </div>
        <details>
          <summary>Trazabilidad técnica</summary>
          <dl className="learning-definition-list">
            <div><dt>Contenido</dt><dd><code>{evidence.packageId}@{evidence.packageVersion}</code></dd></div>
            <div><dt>Regla de extracción</dt><dd><code>{evidence.extractionRuleId}@{evidence.extractionRuleVersion}</code></dd></div>
            <div><dt>Evento origen</dt><dd>{evidence.sourceEventIds.join(', ')}</dd></div>
            <div><dt>Ayudas</dt><dd>{Array.isArray(evidence.content.hintEventIds) && evidence.content.hintEventIds.length ? evidence.content.hintEventIds.join(', ') : 'Ninguna registrada'}</dd></div>
            <div><dt>Adaptaciones</dt><dd>{evidence.accessibilityAccommodations.length ? evidence.accessibilityAccommodations.join(', ') : 'No penalizan la evaluación'}</dd></div>
            <div><dt>Hash</dt><dd><code>{evidence.hash}</code></dd></div>
          </dl>
          <pre>{JSON.stringify(evidence.content, null, 2)}</pre>
        </details>
      </div>
      <a href={`#/learning/evidence/${encodeURIComponent(evidence.id)}`}>Abrir</a>
    </article>
  )
}

function AssessmentView({ assessment }: { assessment: PersistentAssessment }) {
  return (
    <article className="learning-assessment">
      <header>
        {assessment.result.passed ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}
        <div>
          <strong>{assessment.result.passed ? 'Objetivo conseguido' : 'Aún no está conseguido'}</strong>
          <span>{assessment.result.passed ? 'El resultado cumple lo que se pedía' : 'Puedes ver qué falta y volver a intentarlo'}</span>
        </div>
        <MasteryBadge state={assessment.result.resultingState} />
      </header>
      <p>{assessment.result.passed
        ? 'Has aportado resultados suficientes y compatibles para demostrar el objetivo de esta actividad.'
        : 'Todavía falta cumplir una o varias condiciones. Revisa los puntos pendientes antes del siguiente intento.'}</p>
      <div className="learning-assessment__columns">
        <div><h3>Qué ya has demostrado</h3><ul>{assessment.explanation.satisfiedRuleIds.length ? assessment.explanation.satisfiedRuleIds.map((id, index) => <li key={id}>{assessmentCriterionLabel(index)}</li>) : <li>Aún no hay una condición completada.</li>}</ul></div>
        <div><h3>Qué falta por demostrar</h3><ul>{assessment.explanation.unsatisfiedRuleIds.length ? assessment.explanation.unsatisfiedRuleIds.map((id, index) => <li key={id}>{assessmentCriterionLabel(index)}</li>) : <li>Nada: todas las condiciones están cumplidas.</li>}</ul></div>
      </div>
      {assessment.explanation.ignoredEvidence.length > 0 && (
        <p>{assessment.explanation.ignoredEvidence.length} {assessment.explanation.ignoredEvidence.length === 1 ? 'resultado no se usó' : 'resultados no se usaron'} en esta comprobación porque no cumplían sus condiciones. El detalle técnico conserva el motivo.</p>
      )}
      <details>
        <summary>Detalle técnico</summary>
        <dl className="learning-definition-list">
          <div><dt>Regla</dt><dd><code>{assessment.ruleId}@{assessment.ruleVersion}</code></dd></div>
          <div><dt>Algoritmo</dt><dd>{assessment.algorithm}@{assessment.algorithmVersion}</dd></div>
          <div><dt>Criterios satisfechos</dt><dd>{assessment.explanation.satisfiedRuleIds.join(', ') || 'Ninguno'}</dd></div>
          <div><dt>Criterios pendientes</dt><dd>{assessment.explanation.unsatisfiedRuleIds.join(', ') || 'Ninguno'}</dd></div>
          <div><dt>Evidencias</dt><dd>{assessment.evidenceIds.join(', ') || 'Ninguna'}</dd></div>
          {assessment.explanation.ignoredEvidence.length > 0 && <div><dt>Resultados no usados</dt><dd>{assessment.explanation.ignoredEvidence.map(({ evidenceId, reason }) => `${evidenceId}: ${reason}`).join('; ')}</dd></div>}
          <div><dt>Hash de entradas</dt><dd><code>{assessment.inputHash}</code></dd></div>
        </dl>
      </details>
    </article>
  )
}

function HomeSurface() {
  const { snapshot } = useLearning()
  const recovery = snapshot.sessions.items.filter(({ state }) => state === 'interrupted' || state === 'suspended')
  const recommendation = snapshot.recommendations[0]
  return (
    <>
      <PageHeader
        eyebrow="INICIO"
        title={`Buen trabajo, ${snapshot.profile?.displayName ?? 'perfil local'}`}
        description="Tu aprendizaje se apoya en prácticas y resultados que puedes revisar; no en un porcentaje global."
        actions={<a className="learning-primary-action" href="#/learning/explore">Explorar todo <ArrowRight size={16} /></a>}
      />
      <div className="learning-home-lead">
        <section className="learning-recommendation">
          <span className="learning-eyebrow">{recommendation?.required ? 'ACCIÓN NECESARIA' : 'SIGUIENTE PASO'}</span>
          <h2>{recommendation?.title ?? 'Explorar el mapa'}</h2>
          <p>{friendlyRecommendationReason(recommendation?.reason ?? 'La Academia ha elegido un siguiente paso a partir de tu recorrido.')}</p>
          <dl>
            <div><dt>Tipo de paso</dt><dd>{recommendation?.required ? 'Necesario para avanzar' : 'Recomendado para continuar'}</dd></div>
            <div><dt>Resultados tenidos en cuenta</dt><dd>{recommendation?.evidenceIds.length || 'Aún no hay resultados previos'}</dd></div>
          </dl>
          {recommendation && <a href={recommendation.href}>{recommendation.required ? 'Resolver' : 'Continuar'} <ArrowRight size={15} /></a>}
        </section>
        <section className="learning-route-status">
          <span className="learning-eyebrow">RUTA ACTIVA</span>
          <h2>Orientación en el reloj activo</h2>
          <p>Ruta demostrativa integrada · 1 módulo · 1 actividad real</p>
          <div className="learning-route-line">
            <span className="is-current"><i />Proyecto único</span>
            <span><i />Identidad semántica</span>
            <span><i />Alcance del modelo explicado</span>
          </div>
          <a href="#/learning/route/route.demo.project-orientation">Ver estructura</a>
        </section>
      </div>
      {recovery.length > 0 && (
        <section className="learning-section">
          <div className="learning-section__heading"><div><span className="learning-eyebrow">RECUPERACIÓN</span><h2>Sesiones que requieren una decisión</h2></div><a href="#/learning/sessions">Ver todas</a></div>
          {recovery.slice(0, 3).map((session) => (
            <article className="learning-session-strip" key={session.id}>
              <FileClock size={19} />
              <div><strong>{localize(snapshot.profile?.locale, snapshot.product.activities.find(({ id }) => id === session.activityId)?.title ?? { es: humanizeLearningId(session.activityId), en: humanizeLearningId(session.activityId) })}</strong><span>{learningDate(snapshot.profile?.locale, session.updatedAt)} · {sessionStepLabel(session, snapshot.product.activities.find(({ id }) => id === session.activityId))}</span></div>
              <SessionState state={session.state} />
              <a href={`#/learning/recovery/${encodeURIComponent(session.id)}`}>Revisar</a>
            </article>
          ))}
        </section>
      )}
      <section className="learning-section">
        <div className="learning-section__heading"><div><span className="learning-eyebrow">COMPETENCIAS</span><h2>En desarrollo</h2></div><a href="#/learning/progress">Abrir progreso</a></div>
        {snapshot.mastery.items.length === 0 ? (
          <EmptyState title="Aún no hay progreso calculado" detail="Completa una práctica para guardar el primer resultado y ver qué conviene estudiar después." action={<a href="#/learning/activity/activity.demo.identify-case">Abrir práctica</a>} />
        ) : snapshot.mastery.items.slice(0, 4).map((item) => <MasteryRow key={item.competencyId} mastery={item} />)}
      </section>
      <section className="learning-section learning-section--split">
        <div>
          <div className="learning-section__heading"><div><span className="learning-eyebrow">RESULTADOS RECIENTES</span><h2>Qué respalda tu progreso</h2></div><a href="#/learning/history">Historial</a></div>
          {snapshot.evidence.items.length ? snapshot.evidence.items.slice(0, 3).map((item) => <EvidenceRow key={item.id} evidence={item} />) : <p className="learning-muted">Todavía no hay resultados. Abrir una pantalla no cuenta como aprendizaje.</p>}
        </div>
        <div>
          <div className="learning-section__heading"><div><span className="learning-eyebrow">CONTENIDO</span><h2>Estado local</h2></div><a href="#/learning/content">Gestionar</a></div>
          {snapshot.packages.items.map((pack) => (
            <div className="learning-package-line" key={`${pack.packageId}@${pack.version}`}>
              <PackageCheck size={17} />
              <div><strong>{String(pack.manifest.title ?? friendlyLearningTerm(pack.packageId))}</strong><span>{packageOriginLabel(pack.origin)}</span></div>
              <span>{packageStatusLabel(pack.status)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="learning-section">
        <div className="learning-section__heading"><div><span className="learning-eyebrow">PRÓXIMOS CONCEPTOS</span><h2>Mapa disponible</h2></div><a href="#/learning/map">Abrir mapa</a></div>
        <div className="learning-upcoming-concepts">
          {snapshot.product.knowledgeNodes.slice(0, 3).map((node) => (
            <a key={node.id} href={`#/learning/competency/${encodeURIComponent(node.competencyIds[0])}`}>
              <strong>{localize(snapshot.profile?.locale, node.title)}</strong>
              <span>{node.prerequisiteIds.length
                ? `Requiere ${node.prerequisiteIds.map((id) => {
                    const prerequisite = snapshot.product.knowledgeNodes.find((candidate) => candidate.id === id)
                    return prerequisite ? localize(snapshot.profile?.locale, prerequisite.title) : humanizeLearningId(id)
                  }).join(', ')}`
                : 'Disponible sin prerrequisitos'}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

function ExploreSurface() {
  const { service, snapshot } = useLearning()
  const locale = snapshot.profile?.locale
  const [order, setOrder] = useState('title')
  const filteredActivities = useMemo(() => snapshot.product.activities.filter((activity) => {
    const search = snapshot.filters.search.toLowerCase()
    if (search && !`${localize(locale, activity.title)} ${localize(locale, activity.description)}`.toLowerCase().includes(search)) return false
    if (snapshot.filters.difficulty && activity.difficulty !== snapshot.filters.difficulty) return false
    if (snapshot.filters.type && activity.activityType !== snapshot.filters.type) return false
    if (snapshot.filters.movement && !activity.movementIds.includes(snapshot.filters.movement)) return false
    if (snapshot.filters.family && !activity.familyIds.includes(snapshot.filters.family)) return false
    if (snapshot.filters.subsystem && activity.subsystem !== snapshot.filters.subsystem) return false
    if (snapshot.filters.competency && !activity.competencyIds.includes(snapshot.filters.competency)) return false
    if (snapshot.filters.language && !activity.languages.includes(snapshot.filters.language)) return false
    if (snapshot.filters.offline === 'yes' && !activity.offline) return false
    if (snapshot.filters.capability && !activity.requiredCapabilities.includes(snapshot.filters.capability)) return false
    if (snapshot.filters.compatible === 'yes' && activity.requiredCapabilities.some((capability) =>
      !['viewport.selection', 'viewport.visibility', 'viewport.isolation', 'timeline.scrub'].includes(capability))) return false
    if (snapshot.filters.mastery) {
      const states = activity.competencyIds.map((competencyId) =>
        snapshot.mastery.items.find((item) => item.competencyId === competencyId)?.state ?? 'not_started')
      if (!states.includes(snapshot.filters.mastery as MasteryState)) return false
    }
    const installed = snapshot.packages.items.some(({ packageId, version, status }) =>
      packageId === activity.packageId && version === activity.packageVersion && ['active', 'retained'].includes(status))
    if (snapshot.filters.installed === 'yes' && !installed) return false
    if (snapshot.filters.installed === 'no' && installed) return false
    return true
  }).sort((left, right) => order === 'duration'
    ? left.durationMinutes - right.durationMinutes
    : localize(locale, left.title).localeCompare(localize(locale, right.title), locale)), [locale, order, snapshot.filters, snapshot.mastery.items, snapshot.packages.items, snapshot.product.activities])
  return (
    <>
      <PageHeader eyebrow="EXPLORAR" title="Contenido local y no lineal" description="Busca por intención, movimiento, competencia o capacidad. Los bloqueos se explican antes de iniciar." />
      <div className="learning-search-row">
        <label><Search size={16} /><span className="sr-only">Buscar</span><input value={snapshot.filters.search} onChange={(event) => service.setFilter('search', event.target.value)} placeholder="Buscar rutas, lecciones o actividades" /></label>
        <Filter size={16} aria-hidden="true" />
        <label>Dificultad<select value={snapshot.filters.difficulty} onChange={(event) => service.setFilter('difficulty', event.target.value)}><option value="">Todas</option><option value="introductory">Inicial</option><option value="intermediate">Intermedia</option><option value="advanced">Avanzada</option></select></label>
        <label>Tipo<select value={snapshot.filters.type} onChange={(event) => service.setFilter('type', event.target.value)}><option value="">Todos</option><option value="observation-3d">Observación 3D</option></select></label>
        <label>Idioma<select value={snapshot.filters.language === 'en-US' ? 'es-ES' : snapshot.filters.language} onChange={(event) => service.setFilter('language', event.target.value)}><option value="">Todos</option><option value="es-ES">Español</option><option value="en-US" disabled>English · traducción pendiente</option></select></label>
        <label>Orden<select value={order} onChange={(event) => setOrder(event.target.value)}><option value="title">Título</option><option value="duration">Duración</option></select></label>
        <details>
          <summary>Más filtros <ChevronDown size={14} /></summary>
          <div className="learning-filter-popover">
            <label>Movimiento<select value={snapshot.filters.movement} onChange={(event) => service.setFilter('movement', event.target.value)}><option value="">Cualquiera</option><option value="movement.active-project">Proyecto activo</option></select></label>
            <label>Familia<select value={snapshot.filters.family} onChange={(event) => service.setFilter('family', event.target.value)}><option value="">Cualquiera</option><option value="family.active-project">Proyecto activo</option></select></label>
            <label>Subsistema<select value={snapshot.filters.subsystem} onChange={(event) => service.setFilter('subsystem', event.target.value)}><option value="">Cualquiera</option><option value="watch-structure">Estructura</option></select></label>
            <label>Competencia<select value={snapshot.filters.competency} onChange={(event) => service.setFilter('competency', event.target.value)}><option value="">Cualquiera</option><option value="competency.identify-components">Identificación</option></select></label>
            <label>Dominio<select value={snapshot.filters.mastery} onChange={(event) => service.setFilter('mastery', event.target.value)}><option value="">Cualquiera</option>{Object.entries(masteryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Capacidad<select value={snapshot.filters.capability} onChange={(event) => service.setFilter('capability', event.target.value)}><option value="">Cualquiera</option><option value="viewport.selection">Selección 3D</option></select></label>
            <label>Uso sin conexión<select value={snapshot.filters.offline} onChange={(event) => service.setFilter('offline', event.target.value)}><option value="">Cualquiera</option><option value="yes">Disponible</option></select></label>
            <label>Instalación<select value={snapshot.filters.installed} onChange={(event) => service.setFilter('installed', event.target.value)}><option value="">Cualquiera</option><option value="yes">Instalado</option><option value="no">No instalado</option></select></label>
            <label>Compatibilidad<select value={snapshot.filters.compatible} onChange={(event) => service.setFilter('compatible', event.target.value)}><option value="">Cualquiera</option><option value="yes">Compatible ahora</option></select></label>
          </div>
        </details>
      </div>
      <section className="learning-catalog">
        <div className="learning-catalog__routes">
          <span className="learning-eyebrow">RUTAS</span>
          {snapshot.product.routes.map((route) => <RouteSummary key={route.id} route={route} />)}
        </div>
        <div className="learning-catalog__activities">
          <div className="learning-section__heading"><div><span className="learning-eyebrow">ACTIVIDADES</span><h2>{filteredActivities.length} resultados</h2></div></div>
          {filteredActivities.map((activity) => {
            const installed = snapshot.packages.items.some(({ packageId, version }) => packageId === activity.packageId && version === activity.packageVersion)
            return (
              <article className="learning-activity-row" key={activity.id}>
                <div className="learning-activity-row__type"><Box size={20} /><span>3D</span></div>
                <div>
                  <h2>{localize(locale, activity.title)}</h2>
                  <p>{friendlyRecommendationReason(localize(locale, activity.description))}</p>
                  <div className="learning-tag-row">
                    <span>{friendlyDifficulty(activity.difficulty)}</span><span>{activity.durationMinutes} min</span><span>{friendlyLearningTerm(activity.subsystem)}</span><span>{friendlyFidelity(activity.fidelity).title}</span><span>{activity.offline ? 'Disponible sin conexión' : 'Necesita conexión'}</span>
                  </div>
                </div>
                <div className="learning-availability">
                  <span className={installed ? 'is-available' : 'is-blocked'}>{installed ? 'Disponible' : 'No instalado'}</span>
                  <a href={`#/learning/activity/${encodeURIComponent(activity.id)}`}>Revisar <ArrowRight size={14} /></a>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}

function RouteSummary({ route }: { route: LearningRouteDescriptor }) {
  const { snapshot } = useLearning()
  return (
    <article className="learning-route-summary">
      <BookMarked size={21} />
      <div><h2>{localize(snapshot.profile?.locale, route.title)}</h2><p>{localize(snapshot.profile?.locale, route.purpose)}</p><span>{route.demo ? 'Ruta de muestra' : friendlyDifficulty(route.difficulty)}</span></div>
      <a href={`#/learning/route/${encodeURIComponent(route.id)}`}>Abrir</a>
    </article>
  )
}

function RouteSurface() {
  const { snapshot } = useLearning()
  const route = snapshot.product.routes.find(({ id }) => id === snapshot.location.id)
  if (!route) return <NotFoundSurface />
  const locale = snapshot.profile?.locale
  const modules = snapshot.product.modules.filter(({ id }) => route.moduleIds.includes(id))
  const firstActivityId = modules
    .flatMap((module) => snapshot.product.lessons.filter(({ id }) => module.lessonIds.includes(id)))
    .flatMap(({ activityIds }) => activityIds)[0]
  const mastery = snapshot.mastery.items.find(({ competencyId }) => route.competencyIds.includes(competencyId))
  return (
    <>
      <PageHeader
        eyebrow={route.demo ? 'RUTA DE MUESTRA' : 'RUTA'}
        title={localize(locale, route.title)}
        description={friendlyRecommendationReason(localize(locale, route.purpose))}
        actions={firstActivityId
          ? <a className="learning-primary-action" href={`#/learning/activity/${encodeURIComponent(firstActivityId)}`}><Play size={16} />Preparar actividad</a>
          : undefined}
      />
      <section className="learning-route-detail">
        <aside>
          <h2>Ficha de ruta</h2>
          <dl className="learning-definition-list">
            <div><dt>Conocimientos previos</dt><dd>{route.prerequisiteNodeIds.length ? route.prerequisiteNodeIds.map(friendlyLearningTerm).join(', ') : 'Ninguno'}</dd></div>
            <div><dt>Qué aprenderás</dt><dd>{route.competencyIds.map((id) => competencyLabel(id, locale)).join(', ')}</dd></div>
            <div><dt>Movimiento</dt><dd>Proyecto técnico activo</dd></div>
            <div><dt>Herramientas visuales</dt><dd>Modelo 3D, selección de piezas y aislamiento</dd></div>
            <div><dt>Alcance del modelo</dt><dd>{route.fidelity ? friendlyFidelity(route.fidelity).title : 'No descrito'}</dd></div>
            <div><dt>Fuentes</dt><dd>{route.sourceLabels.join(', ')}</dd></div>
            <div><dt>Estado personal</dt><dd>{mastery ? <MasteryBadge state={mastery.state} /> : <MasteryBadge state="not_started" />}</dd></div>
          </dl>
        </aside>
        <div className="learning-route-modules">
          {modules.map((module, index) => (
            <section key={module.id}>
              <div className="learning-module-index">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <span className="learning-eyebrow">MÓDULO</span>
                <h2>{localize(locale, module.title)}</h2>
                {snapshot.product.lessons.filter(({ id }) => module.lessonIds.includes(id)).map((lesson) => (
                  <article className="learning-lesson-row" key={lesson.id}>
                    <div><strong>{localize(locale, lesson.title)}</strong><p>{friendlyRecommendationReason(localize(locale, lesson.purpose))}</p></div>
                    <span className="is-available"><Check size={13} /> Disponible</span>
                    <a href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>Abrir lección</a>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  )
}

function ActivitySurface() {
  const { service, snapshot } = useLearning()
  const activity = snapshot.product.activities.find(({ id }) => id === snapshot.location.id)
  if (!activity) return <NotFoundSurface />
  const personalPresentation = academyPersonalActivityPresentation(activity.id)
  const preflight = snapshot.preflight?.activityId === activity.id ? snapshot.preflight : undefined
  const learningMode = snapshot.location.query.mode === 'demonstration' || snapshot.location.query.mode === 'retention' || snapshot.location.query.mode === 'transfer' || snapshot.location.query.mode === 'remediation'
    ? snapshot.location.query.mode
    : 'authored'
  const independentDemonstration = learningMode === 'demonstration'
  const locale = snapshot.profile?.locale
  const fidelity = friendlyFidelity(activity.fidelity)
  const pedagogy = activity.pedagogicalContract
  const deliberatePractice = activity.deliberatePractice
  const assessment = friendlyAssessmentIntent(pedagogy?.assessmentIntent)
  const tutor = contextualTutorGuidance(snapshot, activity)
  const adaptivePracticeSteps = independentDemonstration
    ? [
        { label: 'Recuerda el criterio', instruction: 'Formula con tus palabras qué debe ocurrir y qué observarías si la relación fuera correcta.' },
        { label: 'Resuelve sin ayuda', instruction: 'Completa la práctica sin abrir pistas ni consultar una solución durante el intento.' },
        { label: 'Justifica el resultado', instruction: 'Explica la relación causal y guarda la comprobación que respalda tu respuesta.' },
      ]
    : learningMode === 'retention'
    ? [
        { label: 'Recupera antes de mirar', instruction: 'Explica la idea con tus palabras y deja una predicción sin abrir el ejemplo ni las pistas.' },
        { label: 'Resuelve de forma independiente', instruction: 'Observa el caso, responde y justifica la primera relación causal que sostiene tu decisión.' },
        { label: 'Comprueba después', instruction: 'Solo al terminar, compara el resultado y registra qué parte debes volver a estudiar.' },
      ]
    : learningMode === 'transfer'
      ? [
          { label: 'Separa el contexto nuevo', instruction: 'Identifica qué cambia respecto al caso aprendido y qué datos no puedes trasladar.' },
          { label: 'Aplica el principio sin ayuda', instruction: 'Resuelve el caso nuevo desde la función y las relaciones, sin copiar geometría ni medidas.' },
          { label: 'Delimita la transferencia', instruction: 'Explica qué criterio se conserva, qué debes verificar otra vez y qué evidencia podría refutarte.' },
        ]
      : undefined
  const isComparativeStudy = Boolean(activity.comparativeArchitectureContract)
  const isServiceProcedure = Boolean(activity.serviceProcedureContract)
  const isManufacturingStudy = Boolean(activity.manufacturingContract)
  const isPersonalDesignStudy = Boolean(activity.personalWatchDesignContract)
  const isValidationStudy = Boolean(activity.validationContract)
  const isDocumentStudy = isComparativeStudy || isServiceProcedure || isManufacturingStudy || isPersonalDesignStudy || isValidationStudy
  const lesson = snapshot.product.lessons.find(({ activityIds }) => activityIds.includes(activity.id))
  const requiredKnowledge = pedagogy?.requiresConceptIds.flatMap((id) => {
    const node = snapshot.product.knowledgeNodes.find((candidate) => candidate.id === id)
    return node ? [localize(locale, node.title)] : []
  }) ?? []
  const referenceModels = activity.fixtureBinding
    ? activity.fixtureBinding.kind === 'fixture'
      ? friendlyLearningTerm(activity.fixtureBinding.fixtureId)
      : activity.fixtureBinding.fixtureIds.map(friendlyLearningTerm).join(' y ')
    : 'una copia de solo lectura de tu proyecto'
  const historicalPracticePreparation = isManufacturingStudy
    ? 'Prepararemos un expediente de fabricación con operaciones, material, datums, tolerancias, riesgos, inspecciones y aceptación. No ejecutará ninguna operación física.'
    : isPersonalDesignStudy
      ? 'Prepararemos una puerta de diseño con entradas, interfaces, alternativas, riesgos, entregables y verificación. Tu proyecto técnico no se modificará.'
      : isValidationStudy
        ? 'Prepararemos un protocolo independiente con participantes, tareas, evidencia, criterios y hallazgos que pueden bloquear la liberación.'
        : isServiceProcedure
          ? 'Prepararemos un espacio de procedimiento con secuencia, riesgos, inspecciones y criterios de aceptación. Tu avance se guardará en este equipo.'
    : isComparativeStudy
      ? 'Prepararemos los casos documentales y modelos disponibles para compararlos sin completar con geometría inventada. Tu avance se guardará en este equipo.'
      : activity.fixtureBinding
        ? `Prepararemos ${referenceModels} para que puedas observarlo y responder paso a paso. Tu avance se guardará en este equipo.`
        : 'Prepararemos una copia segura de tu proyecto para la práctica. El original no se modificará y tu avance se guardará en este equipo.'
  const practicePreparation = personalPresentation?.purpose ?? historicalPracticePreparation
  const practiceResourceLabel = isManufacturingStudy
    ? 'Expediente de fabricación'
    : isPersonalDesignStudy
      ? 'Dossier de diseño'
      : isValidationStudy
        ? 'Protocolo de validación'
        : isServiceProcedure
          ? 'Espacio de procedimiento'
    : isComparativeStudy
      ? 'Dossier comparativo'
      : referenceModels
  const practiceResourceScope = isManufacturingStudy
    ? 'Planificación digital; taller, seguridad, medición y aceptación requieren recursos y supervisión reales.'
    : isPersonalDesignStudy
      ? 'Decisión reversible y de solo lectura; no declara fabricabilidad ni libera un diseño.'
      : isValidationStudy
        ? 'La conclusión es humana, limitada por la muestra y bloqueada por cualquier hallazgo crítico.'
        : isServiceProcedure
          ? 'Planificación y evidencia digital; no acredita una intervención física.'
    : isComparativeStudy
      ? 'Documentos y modelos existentes; cada afirmación conserva su autoridad y sus límites.'
      : fidelity.summary
  const practiceInteraction = isManufacturingStudy
    ? 'Cadena de proceso, matriz de control y respuesta estructurada accesible'
    : isPersonalDesignStudy
      ? 'Puerta de decisión, alternativas, riesgos y verificación documentada'
      : isValidationStudy
        ? 'Protocolo, matriz de resultados, hallazgos y decisión de liberación'
        : isServiceProcedure
          ? 'Secuencia accesible, decisiones justificadas y registro de evidencias'
    : isComparativeStudy
      ? 'Casos, fuentes, tablas y respuesta estructurada con teclado o ratón'
      : 'Ratón o teclado, lista accesible y alternativa con movimiento reducido'
  const practiceCycleDescriptions = isManufacturingStudy
    ? [
        'Fija función, revisión, material y estado de entrada.',
        'Relaciona operaciones con datums, riesgos e inspecciones.',
        'Compara al menos dos secuencias y su acumulación de error.',
        'Define criterios de aceptación y condiciones de parada.',
        'Transfiere el plan a otra pieza sin declarar fabricación realizada.',
      ]
    : isPersonalDesignStudy
      ? [
          'Fija pliego, configuración y entradas de la puerta.',
          'Mapea interfaces, restricciones y desconocidos.',
          'Compara alternativas arquitectónicas reales.',
          'Registra decisión, riesgos y planes de verificación.',
          'Defiende qué permitiría avanzar o exigiría reabrir la puerta.',
        ]
      : isValidationStudy
        ? [
            'Fija afirmación, versión, perfiles y criterio antes de probar.',
            'Ejecuta tareas sin ocultar ayudas, fallos o abandonos.',
            'Separa exactitud, uso, transferencia, acceso y retención.',
            'Evalúa evidencia contra criterios y hallazgos adversos.',
            'Decide aceptar, condicionar o bloquear con revisión humana.',
          ]
        : isServiceProcedure
          ? [
        'Revisa el estado inicial, el alcance y los riesgos antes de decidir.',
        'Relaciona cada paso con su dependencia y su fuente.',
        'Construye una secuencia y registra qué inspeccionarías.',
        'Justifica criterios de aceptación sin declarar trabajo físico no realizado.',
        'Aplica el método a otro caso y señala qué necesitaría revisión humana.',
      ]
    : isComparativeStudy
      ? [
          'Lee primero la autoridad, los hechos y los límites de cada caso.',
          'Compara una misma función sin confundir soluciones distintas.',
          'Organiza hechos, inferencias y desconocidos por separado.',
          'Defiende la conclusión con fuentes y nivel de confianza.',
          'Comprueba si la regla sigue siendo válida en otro calibre.',
        ]
      : LEARNING_CYCLE.slice(1, 6).map((stage) => stage.description)
  const friendlyCheck = (check: NonNullable<typeof preflight>['checks'][number]) => {
    const passed = check.status === 'passed'
    const labels: Record<string, string> = {
      package: 'Contenido de la práctica',
      dependencies: 'Recursos necesarios',
      capabilities: isDocumentStudy ? 'Herramientas de la práctica' : 'Modelo interactivo',
      prerequisites: 'Punto de partida',
      project: isDocumentStudy ? 'Espacio de trabajo' : 'Modelo de práctica',
    }
    labels['retention-window'] = 'Fecha del repaso'
    labels['transfer-ready'] = 'Demostración previa'
    labels['demonstration-ready'] = 'Preparación para demostrar'
    labels['curriculum-route'] = 'Orden del recorrido'
    labels['theory-first'] = 'Lectura previa'
    const passedDetails: Record<string, string> = {
      package: 'El contenido instalado es la versión correcta.',
      dependencies: 'Todo lo necesario está disponible.',
      capabilities: isServiceProcedure
        ? 'La secuencia, los controles de riesgo y el registro de evidencias están disponibles.'
        : isComparativeStudy
          ? 'Los casos, las fuentes y la respuesta estructurada están disponibles.'
          : isManufacturingStudy
            ? 'El plan de proceso, sus riesgos, inspecciones y criterios están disponibles.'
            : isPersonalDesignStudy
              ? 'La puerta, sus alternativas, riesgos y planes de verificación están disponibles.'
              : isValidationStudy
                ? 'El protocolo, sus participantes, tareas, criterios y bloqueos están disponibles.'
          : 'La selección, el movimiento y la restauración están disponibles.',
      prerequisites: 'Puedes comenzar desde aquí.',
      project: isDocumentStudy
        ? 'La práctica usa contenido de solo lectura y no modifica tus proyectos técnicos.'
        : `Se usará ${referenceModels} en una copia temporal. Tus proyectos no se modificarán.`,
    }
    passedDetails['retention-window'] = 'La demostración existe y el repaso programado ya está disponible.'
    passedDetails['transfer-ready'] = 'Existe una demostración previa; ahora puedes probar el criterio en otro contexto.'
    passedDetails['demonstration-ready'] = 'Ya has practicado con guía y puedes comprobar lo aprendido sin pistas.'
    passedDetails['curriculum-route'] = 'Las bases de las rutas anteriores están completas.'
    passedDetails['theory-first'] = 'La explicación previa necesaria ya está estudiada.'
    const failedDetails: Record<string, string> = {
      'theory-first': lesson
        ? `Termina primero «${localize(locale, lesson.title)}»; la práctica no sustituye a la explicación.`
        : 'Termina primero la explicación asociada a esta práctica.',
      'curriculum-route': 'Completa primero las rutas anteriores indicadas en tu recorrido recomendado.',
      prerequisites: requiredKnowledge.length
        ? `Demuestra primero: ${requiredKnowledge.join(', ')}.`
        : 'Completa primero los conocimientos indicados por la ruta.',
    }
    return {
      label: labels[check.id] ?? check.label,
      detail: passed ? passedDetails[check.id] ?? 'Preparado.' : check.status === 'warning'
        ? independentDemonstration
          ? 'Revisa primero el requisito indicado; esta comprobación no ofrece pistas durante el intento.'
          : 'Puedes continuar, aunque quizá necesites consultar una pista durante la práctica.'
        : failedDetails[check.id] ?? check.detail,
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="ACTIVIDAD"
        title={personalPresentation?.visibleTitle ?? localize(locale, activity.title)}
        description={personalPresentation?.purpose ?? friendlyRecommendationReason(localize(locale, activity.description))}
      />
      {learningMode !== 'authored' && (
        <section className={`learning-adaptive-mode-banner is-${learningMode}`}>
          {independentDemonstration ? <ShieldCheck size={20} /> : learningMode === 'retention' ? <RotateCcw size={20} /> : learningMode === 'transfer' ? <Sparkles size={20} /> : <BookMarked size={20} />}
          <div>
            <span className="learning-eyebrow">{independentDemonstration ? 'COMPROBACIÓN SIN AYUDA' : learningMode === 'retention' ? 'REPASO PROGRAMADO' : learningMode === 'transfer' ? 'TRANSFERENCIA' : 'REFUERZO'}</span>
            <strong>{independentDemonstration ? 'Demuestra lo aprendido con un intento independiente' : learningMode === 'retention' ? 'Recupera lo aprendido sin releer ni pedir pistas' : learningMode === 'transfer' ? 'Aplica el criterio en un contexto distinto' : 'Corrige primero la relación que falló'}</strong>
            <p>{independentDemonstration
              ? 'La práctica guiada ya terminó. Este intento evalúa tu razonamiento sin pistas; un resultado correcto puede marcar la competencia como demostrada.'
              : learningMode === 'retention'
                ? 'Este intento solo cuenta para consolidar si produce un resultado correcto, actual, independiente y sin ayuda.'
              : learningMode === 'transfer'
                ? 'Este intento no copia medidas ni geometría del caso anterior: comprueba si el razonamiento sigue siendo válido.'
                : 'Vuelve a la explicación necesaria y repite después con una variante; el error anterior se conserva como parte del historial.'}</p>
          </div>
        </section>
      )}
      <section className="learning-activity-preflight">
        <div className="learning-activity-brief">
          <span className="learning-demo-flag">
            {independentDemonstration
              ? 'DEMOSTRACIÓN SIN PISTAS'
              : learningMode === 'retention'
              ? 'RECUPERACIÓN SIN AYUDA'
              : learningMode === 'transfer'
                ? 'TRANSFERENCIA INDEPENDIENTE'
                : learningMode === 'remediation'
                  ? 'REFUERZO GUIADO'
                  : friendlyPedagogicalPurpose(pedagogy?.purpose).toUpperCase()}
          </span>
          <h2>Qué vas a hacer</h2>
          <p>{practicePreparation}</p>
          <div className="learning-practice-summary">
            <span><Clock3 size={16} /><strong>{activity.durationMinutes} min</strong><small>aproximadamente</small></span>
            <span><BookMarked size={16} /><strong>{requiredKnowledge.length ? 'Con base previa' : 'Base incluida'}</strong><small>{requiredKnowledge.length ? 'puedes repasarla' : 'no tendrás que adivinar'}</small></span>
            <span><ShieldCheck size={16} /><strong>{independentDemonstration ? 'Demostración independiente' : learningMode === 'retention' ? 'Comprobación diferida' : learningMode === 'transfer' ? 'Transferencia comprobada' : assessment.label}</strong><small>{independentDemonstration ? 'Sin pistas · cuenta para tu progreso' : learningMode === 'retention' ? 'Tres etapas: 1, 7 y 21 días' : learningMode === 'transfer' ? 'Contexto distinto y sin pistas' : friendlyEvidenceLevel(pedagogy?.evidenceLevel)}</small></span>
          </div>
          {lesson && ['authored', 'remediation', 'demonstration'].includes(learningMode) && (
            <aside className="learning-pedagogy-note" aria-label="Ayuda disponible antes de empezar">
              <BookMarked size={17} />
              <div>
                <strong>{independentDemonstration ? '¿Necesitas repasar? Hazlo antes de crear el intento.' : 'La explicación está disponible antes de empezar.'}</strong>
                <p>{independentDemonstration
                  ? 'Cuando empieces la comprobación ya no se ofrecerán pistas. Volver ahora a la teoría no crea ni consume un intento.'
                  : 'Puedes volver a la teoría, al ejemplo y al vocabulario sin crear una sesión de práctica.'}</p>
                <a href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>{independentDemonstration ? 'Volver a la teoría' : 'Repasar la explicación'}</a>
              </div>
            </aside>
          )}
          <h3 className="learning-practice-cycle-title">Cómo vas a practicar</h3>
          <ol className="learning-practice-cycle" aria-label="Secuencia de práctica deliberada">
            {personalPresentation && learningMode === 'authored'
              ? personalPresentation.instructions.map((instruction, index) => (
                  <li key={instruction}>
                    <span>{index + 1}</span>
                    <div><strong>Paso {index + 1}</strong><small>{instruction}</small></div>
                  </li>
                ))
              : adaptivePracticeSteps
              ? adaptivePracticeSteps.map((step, index) => (
                  <li key={step.label}>
                    <span>{index + 1}</span>
                    <div><strong>{step.label}</strong><small>{step.instruction}</small></div>
                  </li>
                ))
              : deliberatePractice
              ? deliberatePractice.attempts.map((attempt, index) => {
                  const labels = {
                    guided: 'Primer intento con guía',
                    faded: 'Segundo intento con menos ayuda',
                    independent: 'Intento independiente',
                    transfer: 'Aplicación a un caso nuevo',
                  } as const
                  return (
                    <li key={`${attempt.phase}-${index}`}>
                      <span>{index + 1}</span>
                      <div><strong>{labels[attempt.phase]}</strong><small>{localize(locale, attempt.instruction)}</small></div>
                    </li>
                  )
                })
              : LEARNING_CYCLE.slice(1, 6).map((stage, index) => (
                  <li key={stage.id}>
                    <span>{index + 1}</span>
                    <div><strong>{stage.label}</strong><small>{practiceCycleDescriptions[index]}</small></div>
                  </li>
                ))}
          </ol>
          {personalPresentation && (
            <details className="learning-deliberate-practice">
              <summary>Ayuda, criterio y límites de esta práctica</summary>
              <h4>Ayuda disponible</h4>
              <ul>{personalPresentation.availableHelp.map((item) => <li key={item}>{item}</li>)}</ul>
              <h4>El resultado es adecuado cuando</h4>
              <ul>{personalPresentation.successCriteria.map((item) => <li key={item}>{item}</li>)}</ul>
              <p><strong>Al terminar:</strong> {personalPresentation.feedback}</p>
              <p><strong>Qué puedes conservar:</strong> {personalPresentation.evidenceProfile.modalities.map((modality) => ({
                K: 'Puedo explicarlo',
                V: 'Puedo aplicarlo en el laboratorio virtual',
                P: 'Lo he practicado físicamente',
                R: 'He documentado o comprobado el resultado',
              })[modality]).join(' · ')}</p>
              {personalPresentation.limitations.map((item) => <p key={item}><CircleAlert size={15} />{item}</p>)}
            </details>
          )}
          {deliberatePractice && !adaptivePracticeSteps && (
            <details className="learning-deliberate-practice">
              <summary>Ejemplo resuelto y criterio de éxito</summary>
              <p><strong>Situación:</strong> {localize(locale, deliberatePractice.workedExample.scenario)}</p>
              <ol>
                {deliberatePractice.workedExample.steps.map((step, index) => (
                  <li key={index}>{localize(locale, step)}</li>
                ))}
              </ol>
              <p><strong>Conclusión:</strong> {localize(locale, deliberatePractice.workedExample.conclusion)}</p>
              <ul>
                {deliberatePractice.successCriteria.map((criterion, index) => (
                  <li key={index}>{localize(locale, criterion)}</li>
                ))}
              </ul>
            </details>
          )}
          <details className="learning-activity-details">
            <summary>Preparación, recursos y límites</summary>
            <dl className="learning-definition-list">
              <div><dt>Nivel</dt><dd>{friendlyDifficulty(activity.difficulty)}</dd></div>
              <div><dt>Conocimientos necesarios</dt><dd>{requiredKnowledge.join(', ') || 'La propia lección los presenta antes de responder'}</dd></div>
              <div><dt>Recurso</dt><dd>{practiceResourceLabel}</dd></div>
              <div><dt>Alcance</dt><dd>{practiceResourceScope}</dd></div>
              <div><dt>Formas de uso</dt><dd>{practiceInteraction}</dd></div>
            </dl>
          <div className="learning-pedagogy-note">
            <BookMarked size={17} />
            <div>
              <strong>{assessment.label}</strong>
              <p>{assessment.detail}</p>
              {pedagogy?.physicalBoundary && <p>{localize(locale, pedagogy.physicalBoundary)}</p>}
              {pedagogy?.remediation && (
                <a href={`#/learning/lesson/${encodeURIComponent(pedagogy.remediation.lessonId)}`}>
                  Repasar la explicación antes de empezar
                </a>
              )}
            </div>
          </div>
          {activity.comparativeArchitectureContract && (
            <section className="learning-contract-brief">
              <span className="learning-eyebrow">COMPARACIÓN ARQUITECTÓNICA</span>
              <h3>{activity.comparativeArchitectureContract.caseIds.length} casos, una misma pregunta funcional</h3>
              <p>Trabajarás con documentos, tablas, diagramas o modelos que ya existen. No se generará geometría para rellenar los casos ausentes.</p>
              <dl className="learning-definition-list">
                <div><dt>Ejes</dt><dd>{activity.comparativeArchitectureContract.comparisonAxes.map(friendlyLearningTerm).join(', ')}</dd></div>
                <div><dt>Representación</dt><dd>{friendlyLearningTerm(activity.comparativeArchitectureContract.representation)}</dd></div>
                <div><dt>Autoridad</dt><dd>{friendlyLearningTerm(activity.comparativeArchitectureContract.evidenceBoundary)}</dd></div>
                <div><dt>Regla</dt><dd>Separar hecho, inferencia y desconocido; ninguna dimensión sin respaldo.</dd></div>
              </dl>
            </section>
          )}
          {activity.serviceProcedureContract && (
            <section className="learning-contract-brief">
              <span className="learning-eyebrow">PROCEDIMIENTO DE SERVICIO</span>
              <h3>Planificar, controlar riesgos, inspeccionar y aceptar</h3>
              <p>La sesión digital registra tu decisión y su trazabilidad. No declara completada ninguna intervención física.</p>
              <dl className="learning-definition-list">
                <div><dt>Modo</dt><dd>{friendlyLearningTerm(activity.serviceProcedureContract.mode)}</dd></div>
                <div><dt>Secuencia</dt><dd>{activity.serviceProcedureContract.stepIds.length} pasos declarados</dd></div>
                <div><dt>Controles</dt><dd>{activity.serviceProcedureContract.hazardIds.length} riesgos · {activity.serviceProcedureContract.inspectionPointIds.length} inspecciones</dd></div>
                <div><dt>Aceptación</dt><dd>{activity.serviceProcedureContract.acceptanceCriterionIds.length} criterios · revisión humana obligatoria para competencia física</dd></div>
              </dl>
            </section>
          )}
          {activity.manufacturingContract && (
            <section className="learning-contract-brief">
              <span className="learning-eyebrow">FABRICACIÓN Y ACABADOS</span>
              <h3>Planificar antes de mecanizar, terminar o aceptar</h3>
              <p>Este expediente prepara una revisión. No acciona maquinaria ni declara fabricada una pieza.</p>
              <dl className="learning-definition-list">
                <div><dt>Artefactos</dt><dd>{activity.manufacturingContract.artifactKinds.map(friendlyLearningTerm).join(', ')}</dd></div>
                <div><dt>Proceso</dt><dd>{activity.manufacturingContract.operationIds.length} operaciones · {activity.manufacturingContract.datumIds.length} referencias geométricas</dd></div>
                <div><dt>Control</dt><dd>{activity.manufacturingContract.hazardIds.length} riesgos · {activity.manufacturingContract.inspectionPointIds.length} inspecciones</dd></div>
                <div><dt>Aceptación</dt><dd>{activity.manufacturingContract.acceptanceCriterionIds.length} criterios · revisión de plano y proceso obligatoria</dd></div>
              </dl>
            </section>
          )}
          {activity.personalWatchDesignContract && (
            <section className="learning-contract-brief">
              <span className="learning-eyebrow">RUTA DE DISEÑO PROPIO</span>
              <h3>Puerta de {friendlyLearningTerm(activity.personalWatchDesignContract.gate)}</h3>
              <p>La decisión se guarda con alternativas, riesgos y verificación. No modifica el proyecto técnico ni declara fabricabilidad.</p>
              <dl className="learning-definition-list">
                <div><dt>Nivel</dt><dd>{friendlyLearningTerm(activity.personalWatchDesignContract.routeLevel)}</dd></div>
                <div><dt>Interfaces</dt><dd>{activity.personalWatchDesignContract.interfaceIds.length}</dd></div>
                <div><dt>Alternativas</dt><dd>Mínimo {activity.personalWatchDesignContract.alternativesRequired}</dd></div>
                <div><dt>Salida</dt><dd>{activity.personalWatchDesignContract.deliverableIds.length} entregables · revisión humana obligatoria</dd></div>
              </dl>
            </section>
          )}
          {activity.validationContract && (
            <section className="learning-contract-brief">
              <span className="learning-eyebrow">VALIDACIÓN</span>
              <h3>Protocolo independiente con hallazgos bloqueantes</h3>
              <p>Un resultado solo vale para el alcance y la muestra declarados. Un hallazgo crítico impide liberar.</p>
              <dl className="learning-definition-list">
                <div><dt>Dimensiones</dt><dd>{activity.validationContract.dimensions.map(friendlyLearningTerm).join(', ')}</dd></div>
                <div><dt>Participantes</dt><dd>{activity.validationContract.participantProfileIds.length} perfiles</dd></div>
                <div><dt>Tareas</dt><dd>{activity.validationContract.taskIds.length} · {activity.validationContract.evidenceRequirementIds.length} resultados requeridos</dd></div>
                <div><dt>Aceptación</dt><dd>{activity.validationContract.acceptanceCriterionIds.length} criterios · revisión humana obligatoria</dd></div>
              </dl>
            </section>
          )}
          {activity.feedbackContract && (
            <details className="learning-feedback-contract">
              <summary>Cómo recibirás ayuda y comentarios</summary>
              <p><strong>Primero observarás:</strong> {localize(locale, activity.feedbackContract.nextObservation)}</p>
              <p><strong>La pregunta causal será:</strong> {localize(locale, activity.feedbackContract.causalQuestion)}</p>
              <p>{independentDemonstration ? 'Durante esta comprobación no se ofrecen pistas. Después del resultado podrás volver a estudiar o practicar con ayuda.' : 'Si usas una pista, el intento final volverá a ser independiente.'}</p>
            </details>
          )}
          {tutor && (
            <section className="learning-tutor-preview">
              <span className="learning-eyebrow">GUÍA CONTEXTUAL</span>
              <h3>{tutor.title}</h3>
              <p>{tutor.boundary}</p>
              <strong>{tutor.status}</strong>
              <p>{tutor.orientation}</p>
              <div>{tutor.prompts.map((prompt) => <span key={prompt}>{prompt}</span>)}</div>
              {tutor.misconception && (
                <details>
                  <summary>Error habitual que puede ayudarte a detectar</summary>
                  <p><strong>{tutor.misconception.title}.</strong> {tutor.misconception.diagnosis}</p>
                  <a href={tutor.misconception.remediationHref}>Abrir explicación de refuerzo</a>
                </details>
              )}
            </section>
          )}
          <div className="learning-warning-list">
            {localizeWarnings(locale, activity.warnings).map((warning) => <p key={warning}><CircleAlert size={15} />{warning}</p>)}
          </div>
          </details>
        </div>
        <div className="learning-preflight-checks" aria-live="polite">
          <span className="learning-eyebrow">
            {preflight?.status === 'checking'
              ? 'COMPROBANDO LA PRÁCTICA'
              : preflight?.status === 'blocked'
                ? 'PREPARACIÓN NECESARIA'
                : independentDemonstration ? 'LISTO PARA DEMOSTRAR' : 'LISTO PARA EMPEZAR'}
          </span>
          {!preflight && <p>{isServiceProcedure
            ? 'Antes de abrir el procedimiento comprobaremos que la secuencia, los controles y las fuentes necesarias están disponibles. Esta comprobación no crea un intento.'
            : isComparativeStudy
              ? 'Antes de abrir el dossier comprobaremos que los casos, las fuentes y la respuesta estructurada están disponibles. Esta comprobación no crea un intento.'
              : 'Antes de abrir el modelo comprobaremos que el contenido y los controles necesarios están disponibles. Esta comprobación no crea un intento.'}</p>}
          {!preflight && <button className="learning-primary-action" type="button" onClick={() => void service.preflightActivity(activity.id)}><ShieldCheck size={16} />Comprobar y continuar</button>}
          {preflight?.status === 'checking' && (
            <div className="learning-preflight-progress" role="status">
              <LoaderCircle className="spin" size={18} aria-hidden="true" />
              <div><strong>Estamos revisando el contenido y los requisitos</strong><span>No se creará ninguna sesión hasta que todo esté preparado.</span></div>
            </div>
          )}
          {preflight?.status === 'ready' && <button className="learning-primary-action" type="button" onClick={() => void service.launchActivity(activity.id)}><Play size={16} />{independentDemonstration ? 'Empezar comprobación sin ayuda' : 'Empezar práctica'}</button>}
          {preflight?.checks.map((check) => (
            <div key={check.id} className={`learning-check learning-check--${check.status}`}>
              {check.status === 'passed' ? <Check size={15} /> : check.status === 'failed' ? <CircleAlert size={15} /> : <Info size={15} />}
              <div>
                <strong>{friendlyCheck(check).label}</strong>
                <span>{friendlyCheck(check).detail}</span>
                {check.actions && check.actions.length > 0 && (
                  <div className="learning-check__actions">
                    {check.actions.map((action) => <a href={action.href} key={`${check.id}-${action.href}`}>{action.label} <ArrowRight size={13} /></a>)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {preflight?.diagnostics.map((diagnostic) => (
            <details key={diagnostic.id} className="learning-diagnostic">
              <summary>{diagnostic.message}</summary>
              <p>{diagnostic.recovery}</p>
              <code>{diagnostic.id} · {diagnostic.technical}</code>
            </details>
          ))}
          {preflight?.status === 'blocked' && (
            <div className="learning-preflight-recovery">
              <p>La teoría y la ficha siguen disponibles. Resuelve la preparación indicada y vuelve a comprobar; no se ha creado ningún intento.</p>
              <div>
                {lesson && <a href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>Volver a la explicación</a>}
                <button type="button" onClick={() => void service.preflightActivity(activity.id)}><RefreshCcw size={15} />Comprobar de nuevo</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function SessionsSurface() {
  const { service, snapshot } = useLearning()
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const filtered = snapshot.sessions.items.filter((session) =>
    (!search || `${session.activityId} ${session.packageId}`.toLowerCase().includes(search.toLowerCase()))
    && (!state || session.state === state)
    && (!from || session.updatedAt >= new Date(`${from}T00:00:00`).toISOString())
    && (!to || session.updatedAt <= new Date(`${to}T23:59:59`).toISOString()))
  return (
    <>
      <PageHeader eyebrow="SESIONES" title="Intentos y recuperación" description={`${snapshot.sessions.total} sesiones locales, con versiones y contexto fijados.`} />
      <div className="learning-search-row">
        <label><Search size={16} /><span className="sr-only">Buscar sesiones</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Actividad o paquete" /></label>
        <label>Estado<select value={state} onChange={(event) => setState(event.target.value)}><option value="">Todos</option>{(['active', 'paused', 'suspended', 'interrupted', 'completed', 'cancelled', 'failed', 'archived'] as const).map((value) => <option value={value} key={value}>{sessionStateLabels[value]}</option>)}</select></label>
        <label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      </div>
      <section className="learning-session-table" aria-label="Sesiones">
        <header><span>Actividad</span><span>Estado</span><span>Versión</span><span>Fecha</span><span>Intento</span><span>Acción</span></header>
        {filtered.length === 0 ? <EmptyState title="No hay sesiones en este filtro" detail="Inicia una actividad o amplía el filtro." /> : filtered.map((session) => (
          <article key={session.id}>
            <div>
              <strong>
                {(() => {
                  const activity = snapshot.product.activities.find(({ id }) => id === session.activityId)
                  return activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(session.activityId)
                })()}
              </strong>
              <span>{sessionResourceLabel(session, snapshot.product.activities.find(({ id }) => id === session.activityId))}</span>
              <small>{snapshot.evidence.items.filter(({ sessionId }) => sessionId === session.id).length} evidencias en la página actual</small>
            </div>
            <SessionState state={session.state} />
            <span>{String(snapshot.packages.items.find(({ packageId, version }) => packageId === session.packageId && version === session.packageVersion)?.manifest.title ?? 'Contenido instalado')} · versión {session.packageVersion}</span>
            <time dateTime={session.updatedAt}>{learningDate(snapshot.profile?.locale, session.updatedAt)}</time>
            <span>#{session.attempt}</span>
            {['interrupted', 'suspended', 'failed'].includes(session.state)
              ? <a href={`#/learning/recovery/${encodeURIComponent(session.id)}`}>Recuperar</a>
              : <a href={`#/learning/session/${encodeURIComponent(session.id)}`} onClick={() => void service.loadSessionEvents(session.id)}>Abrir</a>}
          </article>
        ))}
      </section>
      <Pagination
        label="Páginas de sesiones"
        offset={snapshot.sessions.offset}
        limit={snapshot.sessions.limit}
        total={snapshot.sessions.total}
        onPage={(offset) => void service.loadSessionsPage(offset)}
      />
    </>
  )
}

function RecoverySurface() {
  const { service, snapshot } = useLearning()
  const [pendingAction, setPendingAction] = useState<RecoveryAction>()
  const [actionError, setActionError] = useState<string>()
  const session = snapshot.sessions.items.find(({ id }) => id === snapshot.location.id)
  const report = session ? snapshot.recovery[session.id] : undefined
  if (!session) return <NotFoundSurface />
  const activity = snapshot.product.activities.find(({ id }) => id === session.activityId)
  const activityTitle = activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(session.activityId)
  const perform = async (action: RecoveryAction) => {
    setPendingAction(action)
    setActionError(undefined)
    try {
      await service.performRecovery(session.id, action)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo completar la acción. La sesión sigue guardada.')
    } finally {
      setPendingAction(undefined)
    }
  }
  return (
    <>
      <PageHeader eyebrow="RECUPERACIÓN" title="Decidir cómo continuar" description={`La actividad nunca se reanuda automáticamente. Revisa primero el punto guardado, el contenido y ${activity?.serviceProcedureContract ? 'el procedimiento' : activity?.comparativeArchitectureContract ? 'los casos' : 'el modelo'}.`} />
      <section className="learning-recovery">
        <div>
          <h2>{activityTitle}</h2>
          <dl className="learning-definition-list">
            <div><dt>Última actividad</dt><dd>{learningDate(snapshot.profile?.locale, session.updatedAt)}</dd></div>
            <div><dt>Último paso</dt><dd>{sessionStepLabel(session, activity)}</dd></div>
            <div><dt>Recurso de referencia</dt><dd>{sessionResourceLabel(session, activity)}</dd></div>
            <div><dt>Compatibilidad</dt><dd>{report?.projectChange === 'unchanged' ? 'Sin cambios; recuperación segura' : humanizeLearningId(report?.projectChange ?? 'Comprobando')}</dd></div>
          </dl>
          <details>
            <summary>Versiones y capacidades fijadas</summary>
            <dl className="learning-definition-list">
              <div><dt>Paquete</dt><dd><code>{session.packageId}@{session.packageVersion}</code></dd></div>
              <div><dt>Capacidades</dt><dd>{session.initialCapabilities.map(humanizeLearningId).join(', ')}</dd></div>
            </dl>
          </details>
        </div>
        <div>
          <span className="learning-eyebrow">COMPROBACIÓN DE RECUPERACIÓN</span>
          {report?.issues.length ? report.issues.map((issue) => (
            <div className={`learning-check learning-check--${issue.severity === 'error' ? 'failed' : 'warning'}`} key={issue.code}>
              <CircleAlert size={15} /><div><strong>{issue.message}</strong><details><summary>Diagnóstico técnico</summary><code>{issue.code}</code></details></div>
            </div>
          )) : <div className="learning-check learning-check--passed"><Check size={15} /><div><strong>Punto de recuperación reproducible</strong><span>Se puede reanudar con el contenido fijado.</span></div></div>}
          {actionError && <div className="learning-check learning-check--failed" role="alert"><CircleAlert size={15} /><div><strong>No se pudo continuar</strong><span>{actionError}</span></div></div>}
          <div className="learning-recovery-actions">
            {report?.allowedActions.map((action) => (
              <button type="button" key={action} disabled={Boolean(pendingAction)} className={action === 'resume' || action === 'resume-with-warning' ? 'learning-primary-action' : undefined} onClick={() => void perform(action)}>
                {pendingAction === action ? 'Preparando…' : recoveryActionLabel(action)}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function ProgressSurface() {
  const { snapshot } = useLearning()
  const [group, setGroup] = useState('competency')
  const [period, setPeriod] = useState('all')
  const groupLabel = ({
    competency: 'competencia',
    route: 'ruta',
    module: 'módulo',
    concept: 'concepto',
    movement: 'movimiento',
    subsystem: 'subsistema',
    skill: 'tipo de habilidad',
  } as Record<string, string>)[group] ?? 'criterio'
  const periodLabel = ({ all: 'todo el historial', '30d': 'los últimos 30 días', '90d': 'los últimos 90 días' } as Record<string, string>)[period] ?? period
  return (
    <>
      <PageHeader eyebrow="PROGRESO" title="Progreso por competencia" description="Cada estado enlaza las prácticas realizadas, los resultados guardados y el siguiente paso. No existe una nota global." actions={<div className="learning-inline-actions"><label>Agrupar<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="competency">Competencia</option><option value="route">Ruta</option><option value="module">Módulo</option><option value="concept">Concepto</option><option value="movement">Movimiento</option><option value="subsystem">Subsistema</option><option value="skill">Tipo de habilidad</option></select></label><label>Periodo<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todo</option><option value="30d">30 días</option><option value="90d">90 días</option></select></label></div>} />
      {group !== 'competency' && <p className="learning-group-context">Vista por <strong>{groupLabel}</strong> para {periodLabel}. Cada competencia se cuenta una sola vez.</p>}
      <div className="learning-progress-legend" aria-label="Estados de dominio">
        {(Object.keys(masteryLabels) as MasteryState[]).map((state) => <MasteryBadge state={state} key={state} />)}
      </div>
      {snapshot.mastery.items.length === 0 ? (
        <EmptyState icon={Gauge} title="Aún no hay progreso calculado" detail="Completa una práctica para empezar a construir tu historial." action={<a href="#/learning/activity/activity.demo.identify-case">Abrir una práctica de prueba</a>} />
      ) : snapshot.mastery.items.map((item) => <MasteryRow key={item.competencyId} mastery={item} expanded />)}
    </>
  )
}

function MasteryRow({ mastery, expanded = false }: { mastery: LearningMasteryProjection; expanded?: boolean }) {
  const { snapshot } = useLearning()
  const evidence = snapshot.evidence.items.filter(({ id }) => mastery.primaryEvidenceIds.includes(id))
  return (
    <article className="learning-mastery-row">
      <div className="learning-mastery-row__state"><MasteryBadge state={mastery.state} /><meter aria-label="Confianza acumulada" min={0} max={1} value={mastery.strength}>{mastery.strength}</meter><span>confianza {learningNumber(snapshot.profile?.locale, mastery.strength, { style: 'percent' })}</span></div>
      <div><h2>{competencyLabel(mastery.competencyId, snapshot.profile?.locale)}</h2><p>{mastery.reasons.map(friendlyRecommendationReason).join(' ')}</p><span>{mastery.latestValidEvidenceAt ? learningDate(snapshot.profile?.locale, mastery.latestValidEvidenceAt) : 'Sin resultados vigentes'}</span></div>
      <div className="learning-mastery-row__next"><strong>Siguiente paso</strong><span>{mastery.state === 'demonstrated' ? 'Recuperar la idea más adelante, sin ayuda' : mastery.state === 'retained' ? 'Aplicarla en un contexto diferente' : 'Completar una comprobación de esta competencia'}</span></div>
      {expanded && (
        <details>
          <summary>Historial de resultados</summary>
          {evidence.length ? evidence.map((record) => <EvidenceRow key={record.id} evidence={record} />) : <p>{mastery.primaryEvidenceIds.length ? `${mastery.primaryEvidenceIds.length} resultados asociados no están cargados en esta vista.` : 'Todavía no hay resultados asociados.'}</p>}
        </details>
      )}
    </article>
  )
}

function HistorySurface() {
  const { service, snapshot } = useLearning()
  const [kind, setKind] = useState('all')
  return (
    <>
      <PageHeader eyebrow="HISTORIAL" title="Cronología de aprendizaje" description="Sesiones y resultados se consultan por páginas para mantener la vista ligera." actions={<label>Mostrar<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">Todo</option><option value="sessions">Sesiones e intentos</option><option value="evidence">Resultados guardados</option><option value="assessment">Comprobaciones</option></select></label>} />
      <section className="learning-timeline-list">
        {(kind === 'all' || kind === 'sessions') && snapshot.sessions.items.map((session) => (
          <article className="learning-record" key={session.id}>
            <div className="learning-record__marker"><FileClock size={16} /></div>
            <div><div className="learning-record__heading"><strong>{localize(snapshot.profile?.locale, snapshot.product.activities.find(({ id }) => id === session.activityId)?.title ?? { es: humanizeLearningId(session.activityId), en: humanizeLearningId(session.activityId) })} · intento {session.attempt}</strong><SessionState state={session.state} /></div><p>{learningDate(snapshot.profile?.locale, session.updatedAt)} · {sessionResourceLabel(session, snapshot.product.activities.find(({ id }) => id === session.activityId))}</p></div>
            <a href={`#/learning/session/${encodeURIComponent(session.id)}`} onClick={() => void service.loadSessionEvents(session.id)}>Ver eventos</a>
          </article>
        ))}
        {(kind === 'all' || kind === 'assessment') && snapshot.assessments.items.map((assessment) => <AssessmentView key={assessment.id} assessment={assessment} />)}
        {(kind === 'all' || kind === 'evidence') && snapshot.evidence.items.map((evidence) => <EvidenceRow key={evidence.id} evidence={evidence} />)}
        {snapshot.evidence.total === 0 && snapshot.assessments.total === 0 && <EmptyState icon={History} title="El historial está vacío" detail="Las prácticas y sus resultados aparecerán aquí cuando se guarden." />}
      </section>
      <div className="learning-history-pagination">
        {(kind === 'all' || kind === 'evidence') && (
          <Pagination
            label="Páginas de resultados"
            offset={snapshot.evidence.offset}
            limit={snapshot.evidence.limit}
            total={snapshot.evidence.total}
            onPage={(offset) => void service.loadEvidencePage(offset)}
          />
        )}
        {(kind === 'all' || kind === 'assessment') && (
          <Pagination
            label="Páginas de comprobaciones"
            offset={snapshot.assessments.offset}
            limit={snapshot.assessments.limit}
            total={snapshot.assessments.total}
            onPage={(offset) => void service.loadAssessmentPage(offset)}
          />
        )}
      </div>
      <details className="learning-performance">
        <summary>Datos técnicos de rendimiento</summary>
        <ul>{snapshot.performance.map((sample) => <li key={`${sample.operation}-${sample.recordedAt}`}>{sample.operation}: {sample.durationMs} ms · {sample.itemCount} elementos · umbral {sample.thresholdMs} ms {sample.exceeded ? '⚠' : '✓'}</li>)}</ul>
      </details>
    </>
  )
}

function ContentSurface() {
  const { service, snapshot } = useLearning()
  const file = useRef<HTMLInputElement>(null)
  return (
    <>
      <PageHeader
        eyebrow="CONTENIDO LOCAL"
        title="Contenido instalado y versiones"
        description="Revisa qué material está disponible en este equipo y qué sesiones lo están usando. Cada importación se comprueba antes de instalarse."
        actions={<><button type="button" onClick={() => file.current?.click()}><Upload size={16} />Importar contenido</button><input ref={file} hidden type="file" accept=".wplab-learning-pack,.zip" onChange={(event) => {
          const selected = event.target.files?.[0]
          if (selected) void selected.arrayBuffer().then((bytes) => service.importPackage(new Uint8Array(bytes)))
          event.target.value = ''
        }} /></>}
      />
      <section className="learning-package-table">
        <header><span>Contenido</span><span>Versión</span><span>Origen</span><span>Estado</span><span>Sesiones que lo usan</span><span>Acción</span></header>
        {snapshot.packages.items.map((pack) => (
          <article key={`${pack.packageId}@${pack.version}`}>
            <div><strong>{String(pack.manifest.title ?? friendlyLearningTerm(pack.packageId))}</strong></div>
            <span>{pack.version}</span>
            <span>{packageOriginLabel(pack.origin)}</span>
            <span><PackageCheck size={14} />{packageStatusLabel(pack.status)} · {learningDate(snapshot.profile?.locale, pack.verifiedAt)}</span>
            <span>{pack.pinnedSessionIds.length} {pack.pinnedSessionIds.length === 1 ? 'sesión' : 'sesiones'}</span>
            <div>
              <a href={`#/learning/package/${encodeURIComponent(`${pack.packageId}@${pack.version}`)}`}>Detalles</a>
              <button type="button" disabled={!pack.removable || pack.origin === 'integrated'} onClick={() => void service.uninstallPackage(pack.packageId, pack.version)} aria-label={!pack.removable ? 'No se puede retirar: hay sesiones que usan esta versión' : pack.origin === 'integrated' ? 'No se puede retirar el contenido incluido con la Academia' : 'Retirar esta versión'} title={!pack.removable ? 'La versión está fijada por sesiones' : pack.origin === 'integrated' ? 'El contenido integrado no se retira' : 'Retirar versión'}><PackageMinus size={15} /></button>
            </div>
            <details><summary>Detalles técnicos</summary><dl className="learning-definition-list"><div><dt>Identificador</dt><dd><code>{pack.packageId}</code></dd></div><div><dt>SHA-256</dt><dd><code>{pack.packageHash}</code></dd></div><div><dt>Capacidades</dt><dd>{Array.isArray(pack.manifest.requiredCapabilities) ? pack.manifest.requiredCapabilities.map(friendlyLearningTerm).join(', ') : 'No declaradas'}</dd></div><div><dt>Idiomas</dt><dd>{Array.isArray(pack.manifest.languages) ? pack.manifest.languages.join(', ') : 'No declarados'}</dd></div><div><dt>Motivo de conservación</dt><dd>{friendlyRecommendationReason(pack.retentionReason ?? 'Se conserva mientras una sesión necesite esta versión.')}</dd></div><div><dt>Dependencias resueltas</dt><dd>{pack.resolvedDependencies.length ? pack.resolvedDependencies.map(({ packageId, version }) => `${packageId}@${version}`).join(', ') : 'Ninguna'}</dd></div></dl></details>
          </article>
        ))}
      </section>
    </>
  )
}

function ProfileSurface({ preferencesOnly = false }: { preferencesOnly?: boolean }) {
  const { service, snapshot } = useLearning()
  const profile = snapshot.profile
  const [name, setName] = useState(profile?.displayName ?? '')
  const [newName, setNewName] = useState('')
  const [deletion, setDeletion] = useState<LearningDeletionPreview>()
  const [token, setToken] = useState('')
  const [exportSelection, setExportSelection] = useState({ events: true, evidence: true, assessments: true, mastery: true })
  const downloadExport = async () => {
    const bytes = await service.exportProfile({
      includeEvents: exportSelection.events,
      includeEvidence: exportSelection.evidence,
      includeAssessments: exportSelection.assessments,
      includeMastery: exportSelection.mastery,
    })
    downloadBytes(bytes, `wplab-learning-${profile?.id}.zip`)
  }
  if (!profile) return null
  return (
    <>
      <PageHeader eyebrow={preferencesOnly ? 'PREFERENCIAS' : 'PERFIL LOCAL'} title={preferencesOnly ? 'Accesibilidad, idioma y aprendizaje' : profile.displayName} description="Los datos permanecen en este dispositivo. No se guardan diagnósticos médicos ni se infieren discapacidades." />
      {snapshot.location.query.panel === 'notifications' && (
        <section className="learning-section" aria-labelledby="learning-notifications-title">
          <div className="learning-section__heading"><div><span className="learning-eyebrow">AVISOS</span><h2 id="learning-notifications-title">Notificaciones y tareas</h2></div></div>
          {snapshot.notifications.length === 0
            ? <EmptyState title="No hay tareas pendientes" detail="Aquí aparecerán las prácticas por recuperar, el contenido que necesita atención y los resultados recientes." />
            : snapshot.notifications.map((notification) => (
              <article className={`learning-notification-row learning-notification-row--${notification.severity}`} key={notification.id}>
                <div><strong>{notification.title}</strong><span>{friendlyLearningTerm(notification.origin)} · {learningDate(profile.locale, notification.createdAt)}</span><p>{friendlyRecommendationReason(notification.detail)}</p></div>
                <a href={notification.href}>Abrir</a>
                {!notification.read && <button type="button" onClick={() => void service.markNotificationRead(notification.id)}>Marcar leída</button>}
              </article>
            ))}
        </section>
      )}
      <section className="learning-profile-grid">
        {!preferencesOnly && (
          <aside>
            <h2>Perfiles</h2>
            <div className="learning-profile-list">
              {snapshot.profiles.filter(({ archived }) => !archived).map((item) => <button type="button" key={item.id} className={item.id === profile.id ? 'is-active' : undefined} onClick={() => void service.switchProfile(item.id)}><CircleUserIcon /><span><strong>{item.displayName}</strong><small>{item.locale} · local</small></span></button>)}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); if (newName.trim()) void service.createProfile(newName.trim()); setNewName('') }}>
              <label>Nuevo perfil<input value={newName} onChange={(event) => setNewName(event.target.value)} /></label>
              <button type="submit"><Plus size={15} />Crear</button>
            </form>
          </aside>
        )}
        <div className="learning-preferences">
          {!preferencesOnly && <section><h2>Identidad local</h2><label>Nombre visible<input value={name} onChange={(event) => setName(event.target.value)} /></label><button type="button" onClick={() => void service.updateProfile({ displayName: name })}>Guardar nombre</button></section>}
          <section>
            <h2>Idioma y presentación</h2>
            <div className="learning-form-grid">
              <label><Languages size={15} />Idioma<select value="es-ES" onChange={(event) => void service.updateProfile({ locale: event.target.value })}><option value="es-ES">Español</option><option value="en-US" disabled>English · traducción pendiente</option></select></label>
              <label>Escala de texto<input type="range" min="0.75" max="2" step="0.05" value={profile.accessibility.textScale} onChange={(event) => void service.updateProfile({ accessibility: { ...profile.accessibility, textScale: Number(event.target.value) } })} /><output>{profile.accessibility.textScale.toFixed(2)}×</output></label>
              <label>Contraste<select value={profile.accessibility.contrast} onChange={(event) => void service.updateProfile({ accessibility: { ...profile.accessibility, contrast: event.target.value as 'system' | 'normal' | 'high' } })}><option value="system">Sistema</option><option value="normal">Normal</option><option value="high">Alto</option></select></label>
              <label>Interacción<select value={profile.accessibility.interactionMode} onChange={(event) => void service.updateProfile({ accessibility: { ...profile.accessibility, interactionMode: event.target.value as typeof profile.accessibility.interactionMode } })}><option value="adaptive">Adaptativa</option><option value="pointer">Puntero</option><option value="keyboard">Teclado</option><option value="touch">Táctil</option></select></label>
            </div>
            <div className="learning-toggle-list">
              <label><input type="checkbox" checked={profile.accessibility.reducedMotion} onChange={(event) => void service.updateProfile({ accessibility: { ...profile.accessibility, reducedMotion: event.target.checked } })} /><span>Movimiento reducido</span><small>Conserva el significado con estados discretos.</small></label>
              <label><input type="checkbox" checked={profile.accessibility.extendedTime} onChange={(event) => void service.updateProfile({ accessibility: { ...profile.accessibility, extendedTime: event.target.checked } })} /><span>Tiempo ampliado</span><small>No se registra como penalización.</small></label>
              <label><input type="checkbox" checked={profile.accessibility.readLabels} onChange={(event) => void service.updateProfile({ accessibility: { ...profile.accessibility, readLabels: event.target.checked } })} /><span>Leer etiquetas</span><small>Expone descripciones persistentes.</small></label>
            </div>
          </section>
          <section>
            <h2>Preferencias de aprendizaje y conservación</h2>
            <div className="learning-form-grid">
              <label>Ritmo<select value={String(profile.educationalPreferences.learningPace ?? 'guided')} onChange={(event) => void service.updateEducationalPreferences((current) => ({ ...current, learningPace: event.target.value }))}><option value="guided">Guiado</option><option value="exploratory">Exploratorio</option></select></label>
              <label>Profundidad preferida<select value={String(profile.educationalPreferences.preferredDepth ?? 'balanced')} onChange={(event) => void service.updateEducationalPreferences((current) => ({ ...current, preferredDepth: event.target.value }))}><option value="balanced">Equilibrada</option><option value="visual">Más visual</option><option value="technical">Más técnica</option></select></label>
              <label>Conservación local<select value={String(profile.educationalPreferences.retentionPolicy ?? 'keep')} onChange={(event) => void service.updateEducationalPreferences((current) => ({ ...current, retentionPolicy: event.target.value }))}><option value="keep">Conservar hasta borrado explícito</option><option value="archive-year">Archivar tras un año</option></select></label>
              <label>Contenido privado en exportación<select value={String(profile.educationalPreferences.privateExportPolicy ?? 'exclude')} onChange={(event) => void service.updateEducationalPreferences((current) => ({ ...current, privateExportPolicy: event.target.value }))}><option value="exclude">Excluir</option><option value="confirm">Preguntar siempre</option></select></label>
            </div>
            <p>Estas preferencias son pedagógicas y de privacidad; no describen condiciones médicas.</p>
          </section>
          {!preferencesOnly && (
            <>
              <section>
                <h2>Privacidad y exportación</h2>
                <p>Selecciona los datos. Nunca se incluyen PDFs privados, cachés ni conversaciones futuras de tutor.</p>
                <div className="learning-toggle-list">
                  {Object.entries(exportSelection).map(([key, checked]) => <label key={key}><input type="checkbox" checked={checked} onChange={(event) => setExportSelection((current) => ({ ...current, [key]: event.target.checked }))} /><span>{learningDataCategoryLabel(key)}</span></label>)}
                </div>
                <button type="button" onClick={() => void downloadExport()}><Download size={15} />Exportar selección</button>
              </section>
              <section>
                <h2>Copias de seguridad</h2>
                <button type="button" onClick={() => void service.createBackup()}><FolderArchive size={15} />Crear copia local</button>
                {snapshot.backups.map((backup) => <div className="learning-backup-line" key={backup.id}><HardDrive size={15} /><span><strong>{backupKindLabel(backup.kind)}</strong><small>{learningDate(profile.locale, backup.createdAt)} · {learningNumber(profile.locale, backup.bytes)} bytes</small></span><button type="button" onClick={() => void service.restoreBackup(backup.id)}>Restaurar</button></div>)}
              </section>
              <section className="learning-danger-zone">
                <h2>Archivo y borrado</h2>
                <p>Archivar es reversible en los datos. El borrado definitivo requiere una previsualización actual y su token exacto.</p>
                <button type="button" onClick={() => void service.archiveProfile(profile.id)}><Archive size={15} />Archivar perfil</button>
                <button type="button" onClick={() => void service.previewProfileDeletion().then(setDeletion)}><Trash2 size={15} />Previsualizar borrado</button>
                {deletion && (
                  <div className="learning-deletion-preview" role="alert">
                    <h3>Consecuencias</h3>
                    <ul>{Object.entries(deletion.counts).map(([key, count]) => <li key={key}>{learningDataCategoryLabel(key)}: {count}</li>)}</ul>
                    <p>{deletion.retainedPackageVersions.length ? `${deletion.retainedPackageVersions.length} versiones de contenido se conservarán para proteger otras sesiones.` : 'No es necesario conservar versiones adicionales de contenido.'}</p>
                    <label>Código de confirmación<input value={token} onChange={(event) => setToken(event.target.value)} placeholder={deletion.confirmationToken} /></label>
                    <button type="button" disabled={token !== deletion.confirmationToken} onClick={() => void service.deleteProfile(deletion, token)}>Completar borrado definitivo</button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </>
  )
}

function SessionDetailSurface() {
  const { service, snapshot } = useLearning()
  const session = snapshot.sessions.items.find(({ id }) => id === snapshot.location.id)
  if (!session) return <NotFoundSurface />
  const activity = snapshot.product.activities.find(({ id }) => id === session.activityId)
  const activityTitle = activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(session.activityId)
  return (
    <>
      <PageHeader
        eyebrow={snapshot.location.query.mode === 'read-only' ? 'REVISIÓN DE SOLO LECTURA' : 'SESIÓN'}
        title={activityTitle}
        description={`Intento ${session.attempt} · actualizado ${learningDate(snapshot.profile?.locale, session.updatedAt)}`}
        actions={<SessionState state={session.state} />}
      />
      <section className="learning-detail-grid">
        <div>
          <h2>Punto de recuperación</h2>
          <dl className="learning-definition-list">
            <div><dt>Recurso de referencia</dt><dd>{sessionResourceLabel(session, activity)}</dd></div>
            <div><dt>Paso guardado</dt><dd>{sessionStepLabel(session, activity)}</dd></div>
            <div><dt>Resultados disponibles</dt><dd>{snapshot.evidence.items.filter(({ sessionId }) => sessionId === session.id).length}</dd></div>
          </dl>
          {['interrupted', 'suspended', 'failed'].includes(session.state) && <a href={`#/learning/recovery/${encodeURIComponent(session.id)}`}>Revisar y recuperar sesión</a>}
          <details>
            <summary>Diagnóstico técnico de la sesión</summary>
            <dl className="learning-definition-list">
              <div><dt>Paquete</dt><dd><code>{session.packageId}@{session.packageVersion}</code></dd></div>
              <div><dt>Fingerprint inicial</dt><dd><code>{session.initialProjectFingerprint}</code></dd></div>
              <div><dt>Versión del motor</dt><dd>{session.runtimeVersion}</dd></div>
              <div><dt>Posición temporal</dt><dd>{session.checkpoint?.timelinePositionMs ?? 0} ms</dd></div>
            </dl>
          </details>
        </div>
        <div>
          <div className="learning-section__heading"><h2>Historial de acciones</h2><button type="button" onClick={() => void service.loadSessionEvents(session.id)}>Cargar historial</button></div>
          {snapshot.selectedSessionEvents.items.map((event) => <div className="learning-event-line" key={event.id}><time>{learningDate(snapshot.profile?.locale, event.timestamp)}</time><strong>{humanizeLearningId(event.type)}</strong><span>#{event.sequence}</span><details><summary>Detalle técnico</summary><pre>{JSON.stringify(event.payload, null, 2)}</pre></details></div>)}
          {snapshot.selectedSessionEvents.items.length === 0 && <p className="learning-muted">El historial detallado se carga bajo demanda para mantener la recuperación inmediata.</p>}
          <Pagination
            label="Páginas de eventos"
            offset={snapshot.selectedSessionEvents.offset}
            limit={snapshot.selectedSessionEvents.limit}
            total={snapshot.selectedSessionEvents.total}
            onPage={(offset) => void service.loadSessionEvents(session.id, offset)}
          />
        </div>
      </section>
    </>
  )
}

function EvidenceDetailSurface() {
  const { snapshot } = useLearning()
  const evidence = snapshot.evidence.items.find(({ id }) => id === snapshot.location.id)
  return evidence ? <><PageHeader eyebrow="RESULTADO GUARDADO" title={friendlyLearningTerm(evidence.evidenceType)} description={competencyLabel(evidence.competencyId, snapshot.profile?.locale)} /><EvidenceRow evidence={evidence} /></> : <NotFoundSurface />
}

function AssessmentDetailSurface() {
  const { snapshot } = useLearning()
  const assessment = snapshot.assessments.items.find(({ id }) => id === snapshot.location.id)
  return assessment ? <><PageHeader eyebrow="COMPROBACIÓN" title="Comprobación del aprendizaje" description="Resultado, criterios y detalle de esta comprobación." /><AssessmentView assessment={assessment} /></> : <NotFoundSurface />
}

function ResultsSurface() {
  const { snapshot } = useLearning()
  const result = snapshot.result
  if (!result) return <EmptyState title="Los resultados no están en memoria" detail="Abre la sesión completada desde Historial para revisar sus evidencias persistidas." action={<a href="#/learning/history">Abrir historial</a>} />
  const hints = [...new Set(result.evidence.flatMap(({ content }) =>
    Array.isArray(content.hintIds)
      ? content.hintIds
      : Array.isArray(content.hintEventIds)
        ? content.hintEventIds
        : []))]
  const activity = snapshot.product.activities.find(({ id }) => id === result.session.activityId)
  const lesson = snapshot.product.lessons.find(({ activityIds }) => activityIds.includes(result.session.activityId))
  const module = snapshot.product.modules.find(({ lessonIds }) => lesson ? lessonIds.includes(lesson.id) : false)
  const route = snapshot.product.routes.find(({ moduleIds }) => module ? moduleIds.includes(module.id) : false)
  const activityHref = `#/learning/activity/${encodeURIComponent(result.session.activityId)}`
  return (
    <>
      <PageHeader eyebrow="RESULTADO" title="Práctica guardada y modelo restaurado" description="Puedes revisar qué has conseguido, qué falta y cuál es el siguiente paso." />
      <section className="learning-results-summary">
        <div><CheckCircle2 size={28} /><span>PRÁCTICA</span><strong>{activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(result.session.activityId)}</strong></div>
        <div><FileCheck2 size={28} /><span>RESULTADOS GUARDADOS</span><strong>{result.evidence.length} {result.evidence.length === 1 ? 'comprobación registrada' : 'comprobaciones registradas'}</strong></div>
        <div><Gauge size={28} /><span>PROGRESO ACTUAL</span><strong><MasteryBadge state={result.mastery?.state ?? result.assessment.result.resultingState} /></strong></div>
      </section>
      <section className="learning-detail-grid">
        <div>
          <h2>Resultados guardados</h2>
          {result.evidence.map((evidence) => <EvidenceRow key={evidence.id} evidence={evidence} />)}
          <dl className="learning-definition-list">
            <div><dt>Pistas utilizadas</dt><dd>{hints.length ? `${hints.length} ${hints.length === 1 ? 'pista' : 'pistas'}` : 'Ninguna'}</dd></div>
            <div><dt>Adaptaciones</dt><dd>{result.evidence.flatMap(({ accessibilityAccommodations }) => accessibilityAccommodations).map(friendlyLearningTerm).join(', ') || 'Ninguna; nunca penalizan'}</dd></div>
            <div><dt>Incidencias relevantes</dt><dd>{result.session.reason ? friendlyLearningTerm(result.session.reason) : 'Ninguna registrada'}</dd></div>
          </dl>
        </div>
        <div>
          <h2>Comprobación</h2>
          <AssessmentView assessment={result.assessment} />
          <h2>Por qué cambió</h2>
          <p>{result.mastery?.reasons.map(friendlyRecommendationReason).join(' ')}</p>
          <p><strong>Siguiente práctica:</strong> {friendlyRecommendationReason(result.nextRecommendation.reason)}</p>
        </div>
      </section>
      <div className="learning-results-actions">
        <a href="#/learning/history">Abrir historial</a>
        <a href={activityHref}><RotateCcw size={15} />Repetir</a>
        {route && <a href={`#/learning/route/${encodeURIComponent(route.id)}`}>Continuar ruta</a>}
        <a className="learning-primary-action" href="#/learning/home">Volver a Inicio</a>
      </div>
    </>
  )
}

function GenericEntitySurface() {
  const { snapshot } = useLearning()
  const { surface, id } = snapshot.location
  if (surface === 'lesson') {
    const lesson = snapshot.product.lessons.find((item) => item.id === id)
    if (lesson) return <><PageHeader eyebrow="LECCIÓN" title={localize(snapshot.profile?.locale, lesson.title)} description={localize(snapshot.profile?.locale, lesson.purpose)} /><section className="learning-section"><h2>Actividad vinculada</h2>{lesson.activityIds.map((activityId) => {
      const activity = snapshot.product.activities.find(({ id }) => id === activityId)
      return <a className="learning-primary-action" key={activityId} href={`#/learning/activity/${encodeURIComponent(activityId)}`}>Abrir {activity ? localize(snapshot.profile?.locale, activity.title) : humanizeLearningId(activityId)}</a>
    })}</section></>
  }
  if (surface === 'module') {
    const module = snapshot.product.modules.find((item) => item.id === id)
    if (module) return <><PageHeader eyebrow="MÓDULO" title={localize(snapshot.profile?.locale, module.title)} description="Agrupación declarativa de lecciones; no obliga a un recorrido lineal." /><section className="learning-section"><h2>Lecciones</h2>{snapshot.product.lessons.filter((lesson) => module.lessonIds.includes(lesson.id)).map((lesson) => <article className="learning-lesson-row" key={lesson.id}><div><strong>{localize(snapshot.profile?.locale, lesson.title)}</strong><p>{localize(snapshot.profile?.locale, lesson.purpose)}</p></div><a href={`#/learning/lesson/${encodeURIComponent(lesson.id)}`}>Abrir</a></article>)}</section></>
  }
  if (surface === 'package') {
    const pack = snapshot.packages.items.find(({ packageId, version }) => `${packageId}@${version}` === id)
    if (pack) return <><PageHeader eyebrow="CONTENIDO LOCAL" title={String(pack.manifest.title ?? friendlyLearningTerm(pack.packageId))} description={`Versión ${pack.version} instalada en este equipo`} /><section className="learning-section"><dl className="learning-definition-list"><div><dt>Estado</dt><dd>{packageStatusLabel(pack.status)}</dd></div><div><dt>Intentos que necesitan esta versión</dt><dd>{pack.pinnedSessionIds.length || 'Ninguno'}</dd></div></dl><details><summary>Datos técnicos del contenido</summary><dl className="learning-definition-list"><div><dt>Identificador</dt><dd><code>{pack.packageId}</code></dd></div><div><dt>Hash</dt><dd><code>{pack.packageHash}</code></dd></div><div><dt>Almacenamiento</dt><dd>{pack.storageReference}</dd></div></dl></details></section></>
  }
  if (surface === 'competency') {
    const mastery = snapshot.mastery.items.find(({ competencyId }) => competencyId === id)
    return <><PageHeader eyebrow="COMPETENCIA" title={id ? competencyLabel(id, snapshot.profile?.locale) : 'Competencia'} description="Evolución calculada a partir de tus resultados válidos; abrir una pantalla no cambia este estado." />{mastery ? <MasteryRow mastery={mastery} expanded /> : <EmptyState title="Aún no hay resultados para esta competencia" detail="No haberla empezado no significa haber fallado." />}</>
  }
  if (surface === 'movement') {
    const routes = snapshot.product.routes.filter(({ movementIds }) => id ? movementIds.includes(id) : false)
    const activities = snapshot.product.activities.filter(({ movementIds }) => id ? movementIds.includes(id) : false)
    if (routes.length || activities.length) return <><PageHeader eyebrow="MOVIMIENTO / CONTEXTO" title={id === 'movement.active-project' ? 'Proyecto técnico activo' : friendlyLearningTerm(id ?? '')} description="La Academia consulta este contexto sin duplicar ni modificar tu proyecto." /><section className="learning-section"><h2>Rutas relacionadas</h2>{routes.map((route) => <RouteSummary key={route.id} route={route} />)}<h2>Actividades relacionadas</h2>{activities.map((activity) => <a key={activity.id} href={`#/learning/activity/${encodeURIComponent(activity.id)}`}>{localize(snapshot.profile?.locale, activity.title)}</a>)}</section></>
  }
  return <NotFoundSurface />
}

function NotFoundSurface() {
  return <EmptyState icon={CircleAlert} title="Esta página no está disponible" detail="No se ha realizado ninguna acción. Vuelve a Inicio para elegir otro destino." action={<a href="#/learning/home">Volver a Inicio</a>} />
}

export function LearningSurfaces() {
  const { snapshot } = useLearning()
  const academySurface = [
    'home',
    'my-learning',
    'explore',
    'route',
    'module',
    'lesson',
    'workshop',
    'engineering',
    'metrology',
    'atlas',
    'search',
    'notebook',
    'glossary',
    'sources',
    'progress',
    'review',
    'results',
    'preferences',
    'editorial-review',
    'usability',
    'onboarding',
  ].includes(snapshot.location.surface)
  if (academySurface && snapshot.location.query.legacy !== '1') return <AcademySurfaces />
  if (snapshot.location.surface === 'home') return <HomeSurface />
  if (snapshot.location.surface === 'explore') return <ExploreSurface />
  if (snapshot.location.surface === 'route') return <RouteSurface />
  if (snapshot.location.surface === 'activity') return <ActivitySurface />
  if (snapshot.location.surface === 'sessions') return <SessionsSurface />
  if (snapshot.location.surface === 'recovery') return <RecoverySurface />
  if (snapshot.location.surface === 'progress') return <ProgressSurface />
  if (snapshot.location.surface === 'history') return <HistorySurface />
  if (snapshot.location.surface === 'content') return <ContentSurface />
  if (snapshot.location.surface === 'profile') return <ProfileSurface />
  if (snapshot.location.surface === 'preferences') return <ProfileSurface preferencesOnly />
  if (snapshot.location.surface === 'session') return <SessionDetailSurface />
  if (snapshot.location.surface === 'evidence') return <EvidenceDetailSurface />
  if (snapshot.location.surface === 'assessment') return <AssessmentDetailSurface />
  if (snapshot.location.surface === 'results') return <ResultsSurface />
  if (['lesson', 'module', 'competency', 'movement', 'package'].includes(snapshot.location.surface)) return <GenericEntitySurface />
  return <NotFoundSurface />
}

function localizeWarnings(locale: string | undefined, values: { es: string[]; en: string[] }): string[] {
  return locale?.toLowerCase().startsWith('en') ? values.en : values.es
}

function recoveryActionLabel(action: string): string {
  return ({
    resume: 'Reanudar',
    'resume-with-warning': 'Reanudar con aviso',
    rebase: 'Rebasar sobre proyecto actual',
    'read-only-review': 'Revisar en solo lectura',
    'restart-new-attempt': 'Reiniciar como nuevo intento',
    archive: 'Archivar',
    cancel: 'Cancelar',
  } as Record<string, string>)[action] ?? action
}

function assessmentCriterionLabel(index: number): string {
  return ['Resultado principal correcto', 'Secuencia realizada correctamente', 'Resultados suficientes para comprobarlo'][index] ?? `Condición de logro ${index + 1}`
}

function Pagination({
  label,
  offset,
  limit,
  total,
  onPage,
}: {
  label: string
  offset: number
  limit: number
  total: number
  onPage: (offset: number) => void
}) {
  if (total <= limit) return <p className="learning-pagination-note">{Math.min(total, limit)} de {total}</p>
  const start = Math.min(total, offset + 1)
  const end = Math.min(total, offset + limit)
  return (
    <nav className="learning-pagination" aria-label={label}>
      <button type="button" disabled={offset === 0} onClick={() => onPage(Math.max(0, offset - limit))}>Anterior</button>
      <span>{start}–{end} de {total}</span>
      <button type="button" disabled={offset + limit >= total} onClick={() => onPage(offset + limit)}>Siguiente</button>
    </nav>
  )
}

function downloadBytes(bytes: Uint8Array, fileName: string): void {
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/zip' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

function CircleUserIcon() {
  return <span className="learning-profile-avatar" aria-hidden="true" />
}
