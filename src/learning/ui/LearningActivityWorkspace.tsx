import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleX,
  Eye,
  Gauge,
  HelpCircle,
  ListChecks,
  LoaderCircle,
  Minus,
  Pause,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  Square,
  X,
} from 'lucide-react'
import type { AcademyLessonMode } from '../academy/academyLocalState'
import {
  contextualTutorGuidance,
  contextualTutorResponse,
  type ContextualTutorAction,
} from '../academy/academyPedagogy'
import { readUxSession, writeUxSession } from '../academy/academyEntryRecovery'
import { useAcademyLocalState } from '../academy/useAcademyLocalState'
import { COMPARATIVE_MOVEMENT_CASES } from '../atlas/comparativeAtlas'
import { localize } from '../application/i18n'
import { fundamentalLabForActivity } from '../mechanical/fundamentalLabs'
import {
  MANUFACTURING_HAZARDS,
  MANUFACTURING_INSPECTIONS,
  manufacturingProcessPlan,
} from '../manufacturing/manufacturing'
import { personalWatchDesignStage } from '../design/personalWatchDesign'
import {
  ACCESSIBILITY_CHECKS,
  VALIDATION_PARTICIPANT_PROFILES,
  validationProtocol,
} from '../validation/academyValidation'
import {
  SERVICE_ACCEPTANCE_CRITERIA,
  SERVICE_HAZARDS,
  SERVICE_INSPECTION_POINTS,
  SERVICE_TOOL_CAPABILITIES,
  serviceProcedure,
} from '../service/serviceProcedures'
import { parseVisualEntityId } from '../visual/model'
import { hasEducationalMotion } from '../visual/educationalMotion'
import { AcademySurfaceBoundary } from './AcademySurfaceBoundary'
import { useLearning } from './LearningContext'
import {
  friendlyFidelity,
  friendlyInstruction,
  friendlyLearningTerm,
  friendlyRecommendationReason,
  friendlyRuntimeStatus,
  hasMeaningfulResponse,
  preferredEntityIdForPrompt,
} from './learningUiLanguage'

const StudioViewport = lazy(() => import('../../vnext/StudioViewport').then((module) => ({ default: module.StudioViewport })))
const EducationalViewport = lazy(() => import('./EducationalViewport').then((module) => ({ default: module.EducationalViewport })))

type ContextTab = 'explanation' | 'data' | 'evidence' | 'sources'
const CONTEXT_TABS: ContextTab[] = ['explanation', 'data', 'evidence', 'sources']
type WorkbenchCommandInput = Parameters<ReturnType<typeof useLearning>['service']['workbenchCommand']>[0] extends infer Command
  ? Command extends { id: string } ? Omit<Command, 'id'> : never
  : never
type MechanicalLabCommandInput = Parameters<ReturnType<typeof useLearning>['service']['mechanicalLabCommand']>[0] extends infer Command
  ? Command extends { id: string } ? Omit<Command, 'id'> : never
  : never
type CalibreLabCommandInput = Parameters<ReturnType<typeof useLearning>['service']['calibreLabCommand']>[0] extends infer Command
  ? Command extends { id: string } ? Omit<Command, 'id'> : never
  : never

function friendlyWorkspaceSubsystem(value: string): string {
  if (value === 'supports') return 'Apoyos'
  return friendlyLearningTerm(value)
}

function friendlyCrownPosition(value: string): string {
  if (value === 'winding') return 'Carga manual'
  return friendlyLearningTerm(value)
}

function friendlyProjectCheck(value: string): string {
  const withoutCodes = value
    .replace(/\bR0\b/gi, 'referencia documentada')
    .replace(/\bR1\b/gi, 'forma general')
    .replace(/\bR2\b/gi, 'ensamblaje estructural')
    .replace(/\bR3\b/gi, 'reconstrucción visual')
    .replace(/\bR4\b/gi, 'unidad física medida')
  return /^[\w.-]+$/u.test(withoutCodes) ? friendlyLearningTerm(withoutCodes) : withoutCodes
}

export function LearningActivityWorkspace({ onExit }: { onExit: () => void }) {
  const { service, snapshot } = useLearning()
  const { state: academyState, actions: academyActions } = useAcademyLocalState(snapshot.profile?.id)
  const workspace = snapshot.workspace
  const [tab, setTab] = useState<ContextTab>('explanation')
  const [semanticOpen, setSemanticOpen] = useState(snapshot.profile?.accessibility.readLabels ?? false)
  const [workbenchOpen, setWorkbenchOpen] = useState(true)
  const [mechanicalOpen, setMechanicalOpen] = useState(true)
  const [calibreOpen, setCalibreOpen] = useState(true)
  const [leftOpen, setLeftOpen] = useState(() => readUxSession('wplab.learning.workspace-left-open') !== 'false')
  const [rightOpen, setRightOpen] = useState(() => readUxSession('wplab.learning.workspace-right-open') === 'true')
  const [leftWidth, setLeftWidth] = useState(() => {
    const stored = Number(readUxSession('wplab.learning.workspace-left-width'))
    return Number.isFinite(stored) && stored >= 210 && stored <= 420 ? stored : 250
  })
  const [rightWidth, setRightWidth] = useState(() => {
    const stored = Number(readUxSession('wplab.learning.workspace-right-width'))
    return Number.isFinite(stored) && stored >= 250 && stored <= 480 ? stored : 320
  })
  const [lessonMode, setLessonMode] = useState<AcademyLessonMode>(
    () => snapshot.profile?.accessibility.readLabels
      ? 'textual'
      : academyState?.preferences.lessonMode === 'visual' ? 'visual' : 'split',
  )
  const [captureSaved, setCaptureSaved] = useState(false)
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({})
  const [draftAnswers, setDraftAnswers] = useState<Record<string, unknown>>({})
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string>()
  const [modelMotionActive, setModelMotionActive] = useState(false)
  const [modelMotionFocused, setModelMotionFocused] = useState(false)
  const [advancedControlsOpen, setAdvancedControlsOpen] = useState(false)
  const [tutorAction, setTutorAction] = useState<ContextualTutorAction>()
  const showTechnicalIds = academyState?.preferences.showTechnicalIds ?? false
  const autoplayKeyRef = useRef('')
  const educationalGraphs = workspace?.educationalVisual?.graphs
  useEffect(() => {
    const workspaceGraphs = educationalGraphs ?? []
    const autoplayKey = `${workspace?.persistentSessionId ?? 'none'}:${academyState?.preferences.autoplayEducationalMotion ? 'on' : 'off'}:${snapshot.profile?.accessibility.reducedMotion ? 'reduced' : 'motion'}`
    if (autoplayKeyRef.current === autoplayKey) return
    autoplayKeyRef.current = autoplayKey
    const available = workspaceGraphs.some(({ mechanism }) => Boolean(mechanism?.defaultSource))
      || hasEducationalMotion(workspaceGraphs.flatMap(({ entities }) => entities))
    setModelMotionActive(Boolean(
      academyState?.preferences.autoplayEducationalMotion
      && !snapshot.profile?.accessibility.reducedMotion
      && available,
    ))
  }, [academyState?.preferences.autoplayEducationalMotion, educationalGraphs, snapshot.profile?.accessibility.reducedMotion, workspace?.persistentSessionId])
  if (!workspace) {
    return (
      <main className="learning-workspace-missing" id="learning-main" tabIndex={-1}>
        <CircleAlert size={26} />
        <h1>No hay una actividad preparada</h1>
        <p>La sesión no se ha creado o ya se ha cerrado. El proyecto técnico permanece intacto.</p>
        <a href="#/learning/sessions">Abrir sesiones</a>
      </main>
    )
  }
  const locale = snapshot.profile?.locale
  const activeStep = workspace.steps.find(({ id }) => id === workspace.activeStepId) ?? workspace.steps[0]
  const command = (value: Parameters<typeof service.command>[0]) => void service.command(value)
  const stageAnswer = (questionId: string, answer: unknown) => {
    setCheckedQuestions((current) => ({ ...current, [questionId]: false }))
    setDraftAnswers((current) => ({ ...current, [questionId]: answer }))
  }
  const submitAnswer = async (questionId: string, answer: unknown) => {
    setSubmittingQuestionId(questionId)
    try {
      const result = await service.command({ type: 'answer', questionId, answer })
      if (result.accepted) {
        setCheckedQuestions((current) => ({ ...current, [questionId]: true }))
      }
    } finally {
      setSubmittingQuestionId(undefined)
    }
  }
  const activeStepIndex = Math.max(0, workspace.steps.findIndex(({ id }) => id === activeStep?.id))
  const requestedHintIds = new Set(workspace.requestedHints.map(({ hintId }) => hintId))
  const nextAvailableHint = activeStep?.questions
    .flatMap((question) => (question.hints ?? []).map((hint) => ({ question, hint })))
    .find(({ question, hint }) =>
      !requestedHintIds.has(hint.id)
      && (workspace.answerAttempts[question.id] ?? 0) >= hint.availableAfterAttempts)
  const isComparativeWorkspace = Boolean(workspace.activity.comparativeArchitectureContract)
  const isServiceWorkspace = Boolean(workspace.activity.serviceProcedureContract)
  const isManufacturingWorkspace = Boolean(workspace.activity.manufacturingContract)
  const isPersonalDesignWorkspace = Boolean(workspace.activity.personalWatchDesignContract)
  const isValidationWorkspace = Boolean(workspace.activity.validationContract)
  const isDocumentWorkspace = isComparativeWorkspace || isServiceWorkspace || isManufacturingWorkspace || isPersonalDesignWorkspace || isValidationWorkspace
  const documentModeLabel = isManufacturingWorkspace
    ? 'Proceso'
    : isPersonalDesignWorkspace
      ? 'Puerta'
      : isValidationWorkspace
        ? 'Protocolo'
        : isServiceWorkspace ? 'Procedimiento' : 'Casos'
  const baseRuntimeStatus = friendlyRuntimeStatus(
    workspace.runtimeState,
    Boolean(activeStep?.questions.length),
  )
  const runtimeStatus = isDocumentWorkspace
    ? {
      label: isManufacturingWorkspace
        ? 'Plan de fabricación en curso'
        : isPersonalDesignWorkspace
          ? 'Puerta de diseño en curso'
          : isValidationWorkspace
            ? 'Protocolo de validación en curso'
            : isServiceWorkspace ? 'Procedimiento en curso' : 'Comparación en curso',
      instruction: isManufacturingWorkspace
        ? 'Relaciona función, proceso, riesgo, inspección y aceptación'
        : isPersonalDesignWorkspace
          ? 'Compara alternativas y decide con interfaces, riesgos y verificación'
          : isValidationWorkspace
            ? 'Contrasta los resultados y detente ante cualquier hallazgo crítico'
            : isServiceWorkspace
        ? 'Revisa la secuencia, controla los riesgos y justifica tu decisión'
        : 'Contrasta los casos y separa hechos, inferencias y desconocidos',
      tone: 'neutral' as const,
    }
    : modelMotionActive
    ? {
      label: 'Mecanismo en marcha',
      instruction: 'Sigue la transmisión desde el punto de inicio',
      tone: 'neutral' as const,
    }
    : baseRuntimeStatus
  const fidelity = friendlyFidelity(workspace.activity.fidelity)
  const comparativeCases = workspace.activity.comparativeArchitectureContract?.caseIds
    .flatMap((caseId) => COMPARATIVE_MOVEMENT_CASES.filter(({ id }) => id === caseId)) ?? []
  const activeServiceProcedure = workspace.activity.serviceProcedureContract
    ? serviceProcedure(workspace.activity.serviceProcedureContract.procedureId)
    : undefined
  const activeManufacturingPlan = workspace.activity.manufacturingContract
    ? manufacturingProcessPlan(workspace.activity.manufacturingContract.processPlanId)
    : undefined
  const activeDesignStage = workspace.activity.personalWatchDesignContract
    ? personalWatchDesignStage(workspace.activity.personalWatchDesignContract.designStageId)
    : undefined
  const activeValidationProtocol = workspace.activity.validationContract
    ? validationProtocol(workspace.activity.validationContract.protocolId)
    : undefined
  const fundamentalLab = fundamentalLabForActivity(workspace.activity.id)
  const theoryProgress = fundamentalLab
    ? academyState?.lessonProgress.find(({ lessonId }) => lessonId === fundamentalLab.lessonId)
    : undefined
  const isMetrologyActivity = workspace.activity.packageId === 'wplab.horology.inspection-metrology'
  const feedback = workspace.activity.feedbackContract
  const answerEvaluations = Object.values(workspace.answerEvaluations)
  const tutorContext = {
    attempts: Object.values(workspace.answerAttempts).reduce((sum, attempts) => sum + attempts, 0),
    hasIncorrectAnswer: answerEvaluations.some(({ correct, pendingReview }) => correct === false && !pendingReview),
    hasPendingReview: answerEvaluations.some(({ pendingReview }) => pendingReview),
    hintsUsed: workspace.requestedHints.length,
    selectedEntityLabel: workspace.accessibleEntities.find(({ selected }) => selected)?.label,
    sourceCount: workspace.sourceLabels.length,
    sourceLabels: workspace.sourceLabels,
    unknownData: workspace.unknownData,
  }
  const tutor = contextualTutorGuidance(snapshot, workspace.activity, tutorContext)
  const tutorResponse = tutorAction
    ? contextualTutorResponse(snapshot, workspace.activity, tutorAction, tutorContext)
    : undefined
  const independentDemonstration = workspace.learningMode === 'demonstration'
  const hintsDisabled = workspace.learningMode === 'retention' || independentDemonstration
  const selectTutorAction = (action: ContextualTutorAction) => {
    setTutorAction(action)
    if (action === 'give-hint' && !hintsDisabled && nextAvailableHint) {
      command({ type: 'show-hint', hintId: nextAvailableHint.hint.id })
    }
  }
  const reducedMotion = snapshot.profile?.accessibility.reducedMotion ?? false
  const animatedEntities = workspace.educationalVisual?.graphs.flatMap(({ entities }) => entities) ?? []
  const mechanismGraphs = workspace.educationalVisual?.graphs.filter(({ mechanism }) => mechanism?.defaultSource) ?? []
  const motionAvailable = mechanismGraphs.length > 0 || hasEducationalMotion(animatedEntities)
  const mechanismSource = mechanismGraphs.flatMap((graph) => {
    const sourceId = graph.mechanism?.energySourceNodeId ?? graph.mechanism?.defaultSource?.nodeId
    return sourceId ? graph.entities.filter(({ id }) => id === sourceId) : []
  })[0]
  const mechanismRelationCount = mechanismGraphs.reduce(
    (total, graph) => total + (graph.mechanism?.graph.relations.length ?? 0),
    0,
  )
  const confirmStep = async () => {
    await service.command({ type: 'confirm-selection' })
    await service.command({ type: 'next-step' })
  }
  const workbenchCommand = (value: WorkbenchCommandInput) =>
    void service.workbenchCommand({ id: crypto.randomUUID(), ...value } as Parameters<typeof service.workbenchCommand>[0])
  const mechanicalCommand = (value: MechanicalLabCommandInput) =>
    void service.mechanicalLabCommand({ id: crypto.randomUUID(), ...value } as Parameters<typeof service.mechanicalLabCommand>[0])
  const calibreCommand = (value: CalibreLabCommandInput) =>
    void service.calibreLabCommand({ id: crypto.randomUUID(), ...value } as Parameters<typeof service.calibreLabCommand>[0])
  const selectedWorkbenchPart = workspace.workbench?.parts.find(({ selected }) => selected)
    ?? workspace.workbench?.parts.find(({ manipulable }) => manipulable)
  const hasLab = Boolean(workspace.workbench || workspace.mechanicalLab || workspace.calibreLab)
  const resize = (side: 'left' | 'right', delta: number) => {
    const update = side === 'left' ? setLeftWidth : setRightWidth
    update((current) => {
      const next = Math.min(460, Math.max(210, current + delta))
      writeUxSession(`wplab.learning.workspace-${side}-width`, String(next))
      return next
    })
  }
  const toggle = (side: 'left' | 'right') => {
    const open = side === 'left' ? leftOpen : rightOpen
    const next = !open
    writeUxSession(`wplab.learning.workspace-${side}-open`, String(next))
    if (side === 'left') setLeftOpen(next)
    else setRightOpen(next)
  }
  const selectMode = (mode: AcademyLessonMode) => {
    setLessonMode(mode)
    academyActions.setPreferences({ lessonMode: mode })
    academyActions.recordMetric(`workspace-mode.${mode}`)
    if (mode === 'visual') {
      setLeftOpen(false)
      setRightOpen(false)
    } else if (mode === 'reading' || mode === 'textual') {
      setLeftOpen(true)
      setRightOpen(false)
    } else if (mode === 'focus') {
      setLeftOpen(false)
      setRightOpen(true)
    } else {
      setLeftOpen(true)
      setRightOpen(true)
    }
  }
  const captureViewport = () => {
    const source = document.querySelector<HTMLCanvasElement>('.learning-workspace-stage canvas')
    let dataUrl: string | undefined
    if (source && source.width > 0 && source.height > 0) {
      const width = Math.min(480, source.width)
      const height = Math.max(1, Math.round(width * (source.height / source.width)))
      const target = document.createElement('canvas')
      target.width = width
      target.height = height
      const context = target.getContext('2d')
      if (context) {
        context.drawImage(source, 0, 0, width, height)
        dataUrl = target.toDataURL('image/jpeg', .68)
      }
    }
    const binding = workspace.activity.fixtureBinding
    const fixtureId = binding?.kind === 'fixture'
      ? binding.fixtureId
      : binding?.kind === 'composition'
        ? binding.fixtureIds.join(' + ')
        : undefined
    academyActions.createCapture({
      title: localize(locale, workspace.activity.title),
      dataUrl,
      context: {
        activityId: workspace.activity.id,
        lessonId: workspace.activity.lessonId,
        sceneId: workspace.activity.sceneId,
        fixtureId,
        stepId: workspace.activeStepId,
      },
      fixtureId,
      camera: 'viewport-current',
      selectedIds: workspace.accessibleEntities.filter(({ selected }) => selected).map(({ id }) => id),
      visualState: {
        timelineMs: workspace.timelineMs,
        runtimeState: workspace.runtimeState,
        speed: workspace.speed,
        reducedMotion: snapshot.profile?.accessibility.reducedMotion ?? false,
      },
      provenance: workspace.sourceLabels,
    })
    setCaptureSaved(true)
    window.setTimeout(() => setCaptureSaved(false), 1600)
  }
  return (
    <main
      className={`learning-activity-workspace is-mode-${lessonMode} ${leftOpen ? '' : 'is-left-closed'} ${rightOpen ? '' : 'is-right-closed'}`}
      id="learning-main"
      tabIndex={-1}
      style={{
        '--learning-workspace-left-width': `${leftWidth}px`,
        '--learning-workspace-right-width': `${rightWidth}px`,
      } as CSSProperties}
    >
      <header className="learning-workspace-header">
        <div>
          <span>{workspace.learningMode === 'retention'
            ? 'REPASO DE RETENCIÓN'
            : independentDemonstration
              ? 'DEMOSTRACIÓN SIN AYUDA'
            : workspace.learningMode === 'transfer'
              ? 'TRANSFERENCIA'
              : workspace.learningMode === 'remediation'
                ? 'REFUERZO'
                : workspace.activity.demo ? 'DEMOSTRACIÓN' : 'PRÁCTICA'}</span>
          <h1>{localize(locale, workspace.activity.title)}</h1>
          <p>Paso {activeStepIndex + 1} de {workspace.steps.length} · progreso guardado en este equipo</p>
        </div>
        <div>
          <div className="learning-workspace-mode-controls" role="toolbar" aria-label="Modo de actividad">
            {([
              ['reading', BookOpen, 'Instrucciones'],
              ['visual', Eye, 'Modelo'],
              ['split', SplitSquareHorizontal, 'Instrucciones + modelo'],
              ['focus', Sparkles, 'Ayuda'],
              ['textual', ListChecks, 'Texto accesible'],
            ] as const).map(([mode, Icon, label]) => (
              <button
                type="button"
                className={lessonMode === mode ? 'is-active' : undefined}
                aria-pressed={lessonMode === mode}
                title={mode === 'visual' && isDocumentWorkspace ? documentModeLabel : label}
                onClick={() => selectMode(mode)}
                key={mode}
              ><Icon size={14} /><span>{mode === 'visual' && isDocumentWorkspace ? documentModeLabel : label}</span></button>
            ))}
          </div>
          <div className="learning-workspace-panel-controls" role="group" aria-label="Paneles del workspace">
            <button type="button" onClick={() => toggle('left')} aria-label={leftOpen ? 'Plegar contexto de aprendizaje' : 'Mostrar contexto de aprendizaje'}>{leftOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</button>
            <button type="button" disabled={!leftOpen} onClick={() => resize('left', -20)} aria-label="Reducir panel izquierdo"><Minus size={14} /></button>
            <button type="button" disabled={!leftOpen} onClick={() => resize('left', 20)} aria-label="Aumentar panel izquierdo"><Plus size={14} /></button>
            <button type="button" disabled={!rightOpen} onClick={() => resize('right', -20)} aria-label="Reducir panel derecho"><Minus size={14} /></button>
            <button type="button" disabled={!rightOpen} onClick={() => resize('right', 20)} aria-label="Aumentar panel derecho"><Plus size={14} /></button>
            <button type="button" onClick={() => toggle('right')} aria-label={rightOpen ? 'Plegar panel contextual' : 'Mostrar panel contextual'}>{rightOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}</button>
          </div>
          <span
            className={`session-state session-state--${workspace.runtimeState} is-${runtimeStatus.tone}`}
            title={runtimeStatus.instruction}
          >{runtimeStatus.label}</span>
          <button type="button" onClick={captureViewport}><Camera size={15} />{captureSaved ? 'Registrado' : isDocumentWorkspace ? 'Registrar estado' : 'Capturar'}</button>
          <button type="button" onClick={() => void service.saveAndExit()}><Save size={15} />Guardar y salir</button>
          <button
            type="button"
            onClick={() => void service.saveAndExit('return-project').then(onExit)}
            title="Guardar la sesión y volver al proyecto"
            aria-label="Guardar la sesión y volver al proyecto"
          ><X size={16} /></button>
        </div>
      </header>
      {leftOpen && <aside className="learning-workspace-left" aria-label="Contexto de aprendizaje">
        <details className="learning-workspace-breadcrumb">
          <summary>Ver ubicación en el curso</summary>
          <span>Ruta</span><strong>{localize(locale, workspace.routeTitle)}</strong>
          <span>Lección</span><strong>{localize(locale, workspace.lessonTitle)}</strong>
        </details>
        <section>
          <span className="learning-eyebrow">EN ESTA PRÁCTICA</span>
          <p>{localize(locale, workspace.lessonPurpose)}</p>
        </section>
        {fundamentalLab && (
          <details className={`learning-fundamental-lab-map ${theoryProgress?.completedAt ? 'is-ready' : 'needs-theory'}`}>
            <summary>{theoryProgress?.completedAt ? 'Teoría previa completada' : 'Revisar la teoría previa'}</summary>
            <p><b>Entrada:</b> {fundamentalLab.input}</p>
            <ol>{fundamentalLab.causalStages.map((stage) => <li key={stage}>{stage}</li>)}</ol>
            <p><b>Salida:</b> {fundamentalLab.output}</p>
            <p><b>Prueba de interrupción:</b> al actuar sobre {fundamentalLab.interruption.target}, {fundamentalLab.interruption.expectedEffect}.</p>
            {!theoryProgress?.completedAt && <a href={`#/learning/lesson/${encodeURIComponent(fundamentalLab.lessonId)}`}>Estudiar primero la teoría <ArrowRight size={14} /></a>}
          </details>
        )}
        <section className={`learning-next-action is-${runtimeStatus.tone}`} aria-live="polite">
          <span className="learning-eyebrow">QUÉ HACER AHORA</span>
          <strong>{runtimeStatus.instruction}</strong>
          <span>Paso {activeStepIndex + 1} de {workspace.steps.length}</span>
        </section>
        {isMetrologyActivity && (
          <section className="learning-metrology-launcher">
            <span className="learning-eyebrow">EJECUCIÓN SOBRE TU REGISTRO</span>
            <p>La guía conserva tu trabajo de aprendizaje. La fotografía, calibración y serie real se realizan en la estación local.</p>
            <a href="#/learning/metrology">Abrir estación de metrología <ArrowRight size={14} /></a>
          </section>
        )}
        <section>
          <span className="learning-eyebrow">PASOS</span>
          <ol className="learning-step-list">
            {workspace.steps.map((step, index) => {
              const locked = index > activeStepIndex && !workspace.completedStepIds.includes(step.id)
              const reasonId = `learning-step-${index}-lock`
              return (
                <li
                  className={`${workspace.activeStepId === step.id ? 'is-active' : ''} ${workspace.completedStepIds.includes(step.id) ? 'is-completed' : ''}`}
                  key={step.id}
                >
                  <button
                    type="button"
                    disabled={locked}
                    aria-describedby={locked ? reasonId : undefined}
                    onClick={() => command({ type: 'jump-step', stepId: step.id })}
                  >
                    <span>{workspace.completedStepIds.includes(step.id) ? <Check size={13} /> : index + 1}</span>
                    <div><strong>{friendlyInstruction(step.instructionMarkdown)}</strong>{showTechnicalIds && <small>{step.id}</small>}</div>
                  </button>
                  {locked && <small className="learning-disabled-reason" id={reasonId}>Se abre al completar el paso actual.</small>}
                </li>
              )
            })}
          </ol>
        </section>
        {snapshot.lastCommandResult && !snapshot.lastCommandResult.accepted && (
          <div className="learning-command-notice" role="alert" aria-live="assertive">
            <CircleAlert size={18} />
            <div>
              <strong>No se ha podido realizar esa acción</strong>
              <p>{snapshot.lastCommandResult.message}</p>
            </div>
          </div>
        )}
        {activeStep?.questions.length > 0 && (
          <section className="learning-workspace-questions" aria-label="Preguntas del paso">
            <span className="learning-eyebrow">TU RESPUESTA</span>
            {activeStep.questions.map((question) => {
              const answer = Object.prototype.hasOwnProperty.call(draftAnswers, question.id)
                ? draftAnswers[question.id]
                : workspace.answers[question.id]
              const evaluation = workspace.answerEvaluations[question.id]
              const checked = checkedQuestions[question.id] ?? false
              const answered = hasMeaningfulResponse(answer)
              const canContinue = evaluation?.correct === true
                || (evaluation?.complete === true && evaluation.pendingReview)
              const pendingReview = evaluation?.complete === true && evaluation.pendingReview
              const stepReady = canContinue && activeStep.questions.every((candidate) => {
                if (candidate.id === question.id) return true
                const candidateEvaluation = workspace.answerEvaluations[candidate.id]
                return candidateEvaluation?.correct === true
                  || (candidateEvaluation?.complete === true && candidateEvaluation.pendingReview)
              })
              return (
              <fieldset key={question.id} className={checked ? (canContinue ? 'is-correct' : 'is-incorrect') : undefined}>
                <legend>{question.authoring ? localize(locale, question.authoring.prompt) : question.promptMarkdown}</legend>
                {question.responseKind !== 'ordered-list' && question.options?.map((option) => {
                  const selected = answer === option.id
                    || (Array.isArray(answer) && answer.includes(option.id))
                  return (
                    <button
                      type="button"
                      className={selected ? 'is-selected' : undefined}
                      aria-pressed={selected}
                      key={option.id}
                      onClick={() => {
                        if (question.responseKind === 'multiple-choice') {
                          const values = Array.isArray(answer) ? answer.filter((id): id is string => typeof id === 'string') : []
                          stageAnswer(
                            question.id,
                            selected ? values.filter((id) => id !== option.id) : [...values, option.id],
                          )
                        } else {
                          stageAnswer(question.id, option.id)
                        }
                      }}
                    >
                      <span className="learning-answer-marker" aria-hidden="true">
                        {selected ? <Check size={14} /> : null}
                      </span>
                      {option.labels ? localize(locale, option.labels) : option.label}
                    </button>
                  )
                })}
                {question.responseKind === 'ordered-list' && (() => {
                  const ordered = Array.isArray(answer) && answer.every((id) => typeof id === 'string')
                    ? answer as string[]
                    : question.options?.map(({ id }) => id) ?? []
                  const options = new Map(question.options?.map((option) => [option.id, option]) ?? [])
                  const move = (index: number, direction: -1 | 1) => {
                    const target = index + direction
                    if (target < 0 || target >= ordered.length) return
                    const next = [...ordered]
                    ;[next[index], next[target]] = [next[target], next[index]]
                    stageAnswer(question.id, next)
                  }
                  return (
                    <ol className="learning-ordered-answer">
                      {ordered.map((id, index) => {
                        const option = options.get(id)
                        const optionLabel = option?.labels
                          ? localize(locale, option.labels)
                          : friendlyLearningTerm(option?.label ?? id)
                        return (
                          <li key={id}>
                            <span>{optionLabel}</span>
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${optionLabel}`}>↑</button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === ordered.length - 1} aria-label={`Bajar ${optionLabel}`}>↓</button>
                          </li>
                        )
                      })}
                    </ol>
                  )
                })()}
                {question.responseKind === 'short-text' && (
                  <label>
                    <span>Respuesta</span>
                    <textarea
                      rows={4}
                      value={typeof answer === 'string' ? answer : ''}
                      onChange={(event) => stageAnswer(question.id, event.target.value)}
                    />
                  </label>
                )}
                {question.responseKind === 'entity-selection' && <p>Selecciona una pieza en el modelo o en la lista de piezas.</p>}
                {question.responseKind === 'structured-response' && question.structuredFields?.map((field) => {
                  const current = answer
                  const record = current && typeof current === 'object' && !Array.isArray(current)
                    ? current as Record<string, unknown>
                    : {}
                  const update = (value: unknown) => stageAnswer(
                    question.id,
                    { ...record, [field.id]: value },
                  )
                  const controlId = `structured-${question.id}-${field.id}`
                  const confidence = typeof record[field.id] === 'number' ? Number(record[field.id]) : 0.5
                  return (
                    <label htmlFor={controlId} key={field.id}>
                      <span>{field.label}</span>
                      {field.kind === 'choice'
                        ? (
                          <select id={controlId} value={typeof record[field.id] === 'string' ? String(record[field.id]) : ''} onChange={(event) => update(event.target.value)}>
                            <option value="">Selecciona…</option>
                            {field.optionIds.map((id) => <option key={id} value={id}>{friendlyLearningTerm(id)}</option>)}
                          </select>
                        )
                        : field.kind === 'confidence'
                          ? <span className="learning-confidence-control"><input id={controlId} type="range" min={0} max={1} step={0.1} value={confidence} aria-describedby={`${controlId}-value`} onChange={(event) => update(Number(event.target.value))} /><output id={`${controlId}-value`} htmlFor={controlId}>{Math.round(confidence * 100)} % de confianza</output></span>
                          : <textarea id={controlId} rows={4} value={typeof record[field.id] === 'string' ? String(record[field.id]) : ''} placeholder="Explica qué observas, qué relación propones y qué dato te haría cambiar de conclusión." onChange={(event) => update(event.target.value)} />}
                    </label>
                  )
                })}
                <div className="learning-question-actions">
                  {!checked && (
                    <button
                      type="button"
                      className="learning-primary-action"
                      disabled={!answered || submittingQuestionId === question.id}
                      onClick={() => void submitAnswer(question.id, answer)}
                    ><Check size={15} />{submittingQuestionId === question.id ? 'Comprobando…' : 'Comprobar respuesta'}</button>
                  )}
                  {checked && evaluation && (
                    <div
                      className={`learning-answer-feedback ${canContinue ? 'is-correct' : 'is-incorrect'}`}
                      role="status"
                      aria-live="polite"
                    >
                      {canContinue ? <CheckCircle2 size={19} /> : <CircleX size={19} />}
                      <div>
                        <strong>{pendingReview ? 'Explicación registrada' : canContinue ? 'Correcto' : 'Todavía no'}</strong>
                        <p>
                          {pendingReview
                            ? 'La respuesta está completa y queda guardada como razonamiento propio. No se marca automáticamente como correcta: su calidad necesita revisión o una comprobación posterior.'
                            : canContinue
                            ? feedback
                              ? localize(locale, feedback.correctExplanation)
                              : 'La respuesta encaja con la función declarada. Ahora puedes verla aplicada en el modelo.'
                            : feedback
                              ? localize(locale, feedback.incorrectDiagnosis)
                              : hintsDisabled
                                ? 'Revisa la función que cumple la pieza y vuelve a intentarlo. En esta comprobación no se ofrecen pistas.'
                                : 'Revisa la función que cumple la pieza y elige otra opción. Puedes pedir una pista si la necesitas.'}
                        </p>
                        {feedback && <p><strong>Comprueba:</strong> {localize(locale, feedback.causalQuestion)}</p>}
                      </div>
                    </div>
                  )}
                  {checked && canContinue && (
                    <button
                      type="button"
                      className="learning-primary-action"
                      onClick={() => {
                        setModelMotionFocused(motionAvailable)
                        setModelMotionActive(motionAvailable && !reducedMotion)
                        const prompt = question.authoring
                          ? localize(locale, question.authoring.prompt)
                          : question.promptMarkdown
                        const entityId = preferredEntityIdForPrompt(prompt, workspace.accessibleEntities)
                        void (async () => {
                          if (entityId) await service.command({ type: 'select-entity', entityId })
                          if (stepReady) await service.command({ type: 'next-step' })
                        })()
                      }}
                    >{stepReady ? 'Ver por qué y continuar' : 'Aplicar y completar la explicación'} <ChevronRight size={16} /></button>
                  )}
                  {checked && !canContinue && (
                    <button
                      type="button"
                      onClick={() => setCheckedQuestions((current) => ({ ...current, [question.id]: false }))}
                    >Intentar de nuevo</button>
                  )}
                </div>
              </fieldset>
              )
            })}
            {(workspace.requestedHints ?? []).length > 0 && (() => {
              const hint = workspace.requestedHints.at(-1)!
              return (
                <aside className="learning-hint-callout" role="status" aria-live="polite">
                  <strong>Pista {hint.level} de 6</strong>
                  <p>{hint.content ?? 'La pista se ha registrado; consulta la alternativa textual del paso.'}</p>
                </aside>
              )
            })()}
          </section>
        )}
        {activeStep && activeStep.questions.length === 0 && (
          <section className="learning-step-completion">
            <button
              type="button"
              className="learning-primary-action"
              disabled={workspace.runtimeState === 'running'}
              aria-describedby={workspace.runtimeState === 'running' ? 'learning-running-reason' : undefined}
              onClick={() => void confirmStep()}
            ><CheckCircle2 size={16} />{workspace.runtimeState === 'running' ? 'Observa la demostración…' : 'Continuar al paso siguiente'}</button>
            {workspace.runtimeState === 'running' && <p className="learning-disabled-reason" id="learning-running-reason">Espera a que termine la demostración o ponla en pausa para continuar.</p>}
          </section>
        )}
        {!isDocumentWorkspace && <section>
          <button className="learning-semantic-toggle" type="button" aria-expanded={semanticOpen} onClick={() => setSemanticOpen((value) => !value)}><Eye size={15} />Piezas del modelo</button>
          {semanticOpen && (
            <div className="learning-semantic-tree" aria-label="Lista accesible de piezas del modelo">
              <p>Selecciona una pieza para localizarla en el modelo. También puedes usar esta lista sin interactuar con el 3D.</p>
              <ul>
                {workspace.accessibleEntities.map((entity) => (
                  <li key={entity.id}>
                    <button
                      type="button"
                      className={entity.selected ? 'is-selected' : undefined}
                      aria-pressed={entity.selected}
                      onClick={() => command({ type: 'select-entity', entityId: entity.id })}
                    >
                      <span>{entity.label}</span>
                      {showTechnicalIds && <small>{entity.id}</small>}
                    </button>
                  </li>
                ))}
              </ul>
              <p aria-live="polite">
                {workspace.accessibleEntities.filter(({ selected }) => selected).length}{' '}
                {workspace.accessibleEntities.filter(({ selected }) => selected).length === 1 ? 'pieza seleccionada' : 'piezas seleccionadas'}.
              </p>
            </div>
          )}
        </section>}
      </aside>}
      <section className={`learning-workspace-stage ${hasLab ? 'has-lab' : ''}`} aria-label={isManufacturingWorkspace ? 'Planificador de fabricación' : isPersonalDesignWorkspace ? 'Mesa de diseño propio' : isValidationWorkspace ? 'Mesa de validación' : isServiceWorkspace ? 'Procedimiento de servicio' : isComparativeWorkspace ? 'Mesa comparativa' : 'Modelo de estudio'}>
        <details className="learning-stage-badges">
          <summary>{isManufacturingWorkspace ? 'Plan de fabricación documentado' : isPersonalDesignWorkspace ? 'Puerta de diseño documentada' : isValidationWorkspace ? 'Protocolo de validación documentado' : isServiceWorkspace ? 'Procedimiento digital documentado' : isComparativeWorkspace ? 'Comparación documental' : modelMotionActive ? 'Mecanismo educativo en marcha' : fidelity.title}</summary>
          <p>{isManufacturingWorkspace
            ? 'Prepara proceso, riesgos, inspección y aceptación; no ejecuta ni acredita fabricación física.'
            : isPersonalDesignWorkspace
              ? 'Registra alternativas y decisiones; no modifica el proyecto técnico ni declara fabricabilidad.'
              : isValidationWorkspace
                ? 'Conserva muestra, resultados y hallazgos; la liberación requiere decisión humana.'
                : isServiceWorkspace
            ? 'Planifica y registra decisiones; no acredita manipulación física.'
            : isComparativeWorkspace
              ? 'Compara únicamente datos, relaciones y modelos con procedencia declarada.'
              : fidelity.summary}</p>
          {showTechnicalIds && !isDocumentWorkspace && <code>{workspace.activity.fidelity.geometry}/{workspace.activity.fidelity.kinematics}/{workspace.activity.fidelity.physics}</code>}
        </details>
        {modelMotionActive && !isDocumentWorkspace && (
          <div className="learning-motion-status" role="status" aria-live="polite">
            <span />
            Transmisión coordinada · {workspace.speed}×
          </div>
        )}
        <div className="learning-stage-viewport">
          <AcademySurfaceBoundary
            scope="viewport"
            onReset={() => void service.refresh()}
            onFallback={() => setLessonMode('textual')}
            fallbackLabel="Continuar en modo textual"
          >
            <Suspense fallback={<div className="learning-loading" role="status"><LoaderCircle className="spin" size={22} />Preparando el modelo</div>}>
              {workspace.activity.comparativeArchitectureContract
                ? (
                  <div className="learning-document-board" aria-label="Mesa de comparación arquitectónica">
                    <header><span className="learning-eyebrow">COMPARACIÓN DOCUMENTADA</span><h2>Casos y alcance de los datos</h2><p>Compara relaciones y compromisos. La ausencia de modelo es información explícita, no un hueco que deba rellenarse.</p></header>
                    <div className="learning-document-board__grid">
                      {comparativeCases.map((movement) => <article key={movement.id}><span>{friendlyLearningTerm(movement.evidenceStatus)}</span><h3>{localize(locale, movement.title)}</h3><p>{localize(locale, movement.learningUse)}</p><dl><div><dt>Modelo</dt><dd>{friendlyLearningTerm(movement.modelAvailability)}</dd></div><div><dt>Geometría</dt><dd>{friendlyLearningTerm(movement.geometryClaim)}</dd></div><div><dt>Fuentes</dt><dd>{movement.sourceIds.length}</dd></div></dl><details><summary>Datos y límites</summary>{movement.officialFacts.length > 0 && <ul>{movement.officialFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}<strong>Desconocidos</strong><ul>{movement.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul></details></article>)}
                    </div>
                    <section><h3>Ejes que debes comparar</h3><div className="learning-document-board__chips">{workspace.activity.comparativeArchitectureContract.comparisonAxes.map((axis) => <span key={axis}>{friendlyLearningTerm(axis)}</span>)}</div></section>
                  </div>
                )
                : activeServiceProcedure
                  ? (
                    <div className="learning-document-board" aria-label="Planificador de procedimiento de servicio">
                      <header><span className="learning-eyebrow">PROCEDIMIENTO Y EVIDENCIA</span><h2>{localize(locale, activeServiceProcedure.title)}</h2><p>{localize(locale, activeServiceProcedure.purpose)}</p></header>
                      <ol className="learning-service-sequence">{activeServiceProcedure.steps.map((step) => <li key={step.id}><span>{step.order}</span><div><h3>{localize(locale, step.title)}</h3><p>{step.actions.join(' ')}</p><dl><div><dt>Riesgos</dt><dd>{step.hazardIds.map((hazardId) => SERVICE_HAZARDS.find(({ id }) => id === hazardId)?.title.es ?? friendlyLearningTerm(hazardId)).join(', ')}</dd></div><div><dt>Herramientas</dt><dd>{step.toolCapabilityIds.map((toolId) => SERVICE_TOOL_CAPABILITIES.find(({ id }) => id === toolId)?.title.es ?? friendlyLearningTerm(toolId)).join(', ')}</dd></div><div><dt>Inspección</dt><dd>{step.inspectionPointIds.map((inspectionId) => SERVICE_INSPECTION_POINTS.find(({ id }) => id === inspectionId)?.title.es ?? friendlyLearningTerm(inspectionId)).join(', ')}</dd></div></dl><details><summary>Condiciones y prohibiciones</summary><strong>Antes de entrar</strong><ul>{step.entryConditions.map((item) => <li key={item}>{item}</li>)}</ul><strong>No continuar si</strong><ul>{step.prohibitedActions.map((item) => <li key={item}>{item}</li>)}</ul></details></div></li>)}</ol>
                      <section><h3>Criterios de aceptación</h3><ul>{activeServiceProcedure.acceptanceCriterionIds.map((criterionId) => { const criterion = SERVICE_ACCEPTANCE_CRITERIA.find(({ id }) => id === criterionId); return <li key={criterionId}><strong>{criterion ? localize(locale, criterion.title) : criterionId}:</strong> {criterion?.passWhen.join(' ')}</li> })}</ul><p className="learning-reserved-panel"><ShieldCheck size={15} />{localize(locale, activeServiceProcedure.physicalBoundary)}</p></section>
                    </div>
                  )
                  : activeManufacturingPlan
                    ? (
                      <div className="learning-document-board" aria-label="Planificador de fabricación y acabados">
                        <header><span className="learning-eyebrow">FABRICACIÓN Y ACABADOS</span><h2>{localize(locale, activeManufacturingPlan.title)}</h2><p>{activeManufacturingPlan.purpose}</p></header>
                        <ol className="learning-service-sequence">
                          {activeManufacturingPlan.operations.map((operation, index) => <li key={operation.id}><span>{index + 1}</span><div><h3>{localize(locale, operation.title)}</h3><p>{operation.purpose}</p><dl><div><dt>Entrada</dt><dd>{operation.inputState}</dd></div><div><dt>Salida</dt><dd>{operation.outputState}</dd></div><div><dt>Riesgos</dt><dd>{operation.hazardIds.map((id) => MANUFACTURING_HAZARDS.find((hazard) => hazard.id === id)?.title.es ?? friendlyLearningTerm(id)).join(', ')}</dd></div><div><dt>Inspección</dt><dd>{operation.inspectionIds.map((id) => MANUFACTURING_INSPECTIONS.find((inspection) => inspection.id === id)?.title.es ?? friendlyLearningTerm(id)).join(', ')}</dd></div></dl></div></li>)}
                        </ol>
                        <div className="learning-document-board__grid">
                          <article><span>REFERENCIAS</span><h3>Referencias geométricas (datums)</h3><ul>{activeManufacturingPlan.datums.map((datum) => <li key={datum.id}><strong>{datum.title}:</strong> {datum.controls.join(' ')}</li>)}</ul></article>
                          <article><span>TOLERANCIAS</span><h3>Decisiones verificables</h3><ul>{activeManufacturingPlan.toleranceDecisions.map((decision) => <li key={decision.id}><strong>{decision.requirement}</strong> {decision.verification}</li>)}</ul></article>
                          <article><span>ACEPTACIÓN</span><h3>Condiciones de paso</h3><ul>{activeManufacturingPlan.acceptanceCriteria.map((criterion) => <li key={criterion.id}><strong>{criterion.title}:</strong> {criterion.passWhen.join(' ')}</li>)}</ul></article>
                        </div>
                        <p className="learning-reserved-panel"><ShieldCheck size={15} />{activeManufacturingPlan.physicalBoundary}</p>
                      </div>
                    )
                    : activeDesignStage
                      ? (
                        <div className="learning-document-board" aria-label="Puerta de diseño de reloj propio">
                          <header><span className="learning-eyebrow">RUTA DE DISEÑO PROPIO</span><h2>{localize(locale, activeDesignStage.title)}</h2><p>{activeDesignStage.purpose}</p></header>
                          <div className="learning-document-board__grid">
                            <article><span>ENTRADAS</span><h3>Qué debe estar fijado</h3><ul>{activeDesignStage.inputs.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                            <article><span>INTERFACES</span><h3>Contratos entre sistemas</h3><ul>{activeDesignStage.interfaces.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                            <article><span>RESTRICCIONES</span><h3>Lo que limita la solución</h3><ul>{activeDesignStage.constraints.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                            <article><span>ENTREGABLES</span><h3>Qué debe poder revisarse</h3><ul>{activeDesignStage.deliverables.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                          </div>
                          <section><h3>Preguntas de puerta · mínimo {activeDesignStage.alternativesMinimum} alternativas</h3><ul>{activeDesignStage.gateQuestions.map((question) => <li key={question}>{question}</li>)}</ul><div className="learning-document-board__chips"><span>{friendlyLearningTerm(activeDesignStage.routeLevel)}</span><span>{friendlyLearningTerm(activeDesignStage.gate)}</span><span>Revisión humana</span></div></section>
                          <section><h3>Verificación y parada</h3><ul>{activeDesignStage.verificationPlans.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul><p className="learning-reserved-panel"><ShieldCheck size={15} />Detener si: {activeDesignStage.stopConditions.join(' ')}</p></section>
                        </div>
                      )
                      : activeValidationProtocol
                        ? (
                          <div className="learning-document-board" aria-label="Protocolo de validación">
                            <header><span className="learning-eyebrow">VALIDACIÓN INDEPENDIENTE</span><h2>{localize(locale, activeValidationProtocol.title)}</h2><p>{activeValidationProtocol.purpose}</p></header>
                            <div className="learning-document-board__chips">{activeValidationProtocol.dimensions.map((dimension) => <span key={dimension}>{friendlyLearningTerm(dimension)}</span>)}</div>
                            <div className="learning-document-board__grid">
                              <article><span>PARTICIPANTES</span><h3>Perfiles y límites</h3><ul>{activeValidationProtocol.participantProfileIds.map((id) => { const profile = VALIDATION_PARTICIPANT_PROFILES.find((item) => item.id === id); return <li key={id}><strong>{profile?.title.es ?? id}:</strong> {profile?.roleBoundary}</li> })}</ul></article>
                              <article><span>TAREAS</span><h3>Resultados observables</h3><ul>{activeValidationProtocol.tasks.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                              <article><span>RESULTADOS</span><h3>Qué debe conservarse</h3><ul>{activeValidationProtocol.evidenceRequirements.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                              <article><span>ACEPTACIÓN</span><h3>Reglas de decisión</h3><ul>{activeValidationProtocol.acceptanceCriteria.map((item) => <li key={item.id}><strong>{item.title}:</strong> {item.detail}</li>)}</ul></article>
                            </div>
                            {activeValidationProtocol.accessibilityCheckIds.length > 0 && <section><h3>Comprobaciones de accesibilidad</h3><ul>{activeValidationProtocol.accessibilityCheckIds.map((id) => { const check = ACCESSIBILITY_CHECKS.find((item) => item.id === id); return <li key={id}><strong>{check?.title.es ?? id}:</strong> {check?.observable}</li> })}</ul></section>}
                            {activeValidationProtocol.retentionIntervalsDays.length > 0 && <section><h3>Retención diferida</h3><p>Intentos separados a {activeValidationProtocol.retentionIntervalsDays.join(', ')} días, sin releer inmediatamente antes del intento.</p></section>}
                            <p className="learning-reserved-panel"><CircleAlert size={15} />Bloquean la liberación: {activeValidationProtocol.adverseFindings.join(' ')}</p>
                          </div>
                        )
                  : workspace.educationalVisual
                ? (
                  <EducationalViewport
                    graphs={workspace.educationalVisual.graphs}
                    state={workspace.educationalVisual.state}
                    showProvenance
                    showTechnicalIds={showTechnicalIds}
                    motionActive={modelMotionActive}
                    motionFocus={modelMotionFocused}
                    playbackSpeed={workspace.speed}
                    timelineMs={workspace.timelineMs}
                    ariaLabel={`Composición educativa: ${localize(locale, workspace.activity.title)}`}
                    onSelectEntity={(visualId) => {
                      const canonical = parseVisualEntityId(visualId)?.instanceId
                      if (canonical) command({ type: 'select-entity', entityId: canonical })
                    }}
                  />
                )
                : <StudioViewport cameraPreset="iso" />}
            </Suspense>
          </AcademySurfaceBoundary>
        </div>
        {lessonMode === 'textual' && (
          <section className="learning-stage-textual" aria-label="Alternativa textual completa">
            <span className="learning-eyebrow">REPRESENTACIÓN TEXTUAL</span>
            <h2>{localize(locale, workspace.activity.title)}</h2>
            <p>{friendlyRecommendationReason(localize(locale, workspace.activity.description))}</p>
            <h3>Entidades disponibles</h3>
            <ul>
              {workspace.accessibleEntities.map((entity) => (
                <li key={entity.id}>
                  <button
                    type="button"
                    className={entity.selected ? 'is-selected' : undefined}
                    aria-pressed={entity.selected}
                    onClick={() => command({ type: 'select-entity', entityId: entity.id })}
                  >{entity.label}<span>{entity.selected ? 'Seleccionada' : 'No seleccionada'}</span></button>
                </li>
              ))}
            </ul>
            {workspace.unknownData.length > 0 && <p><strong>Datos desconocidos declarados:</strong> {workspace.unknownData.join('; ')}</p>}
          </section>
        )}
        {workspace.calibreLab && (
          <section className={`mechanical-learning-lab calibre-learning-lab ${calibreOpen ? '' : 'is-collapsed'}`} aria-label="Laboratorio de calibre MIYOTA 8215">
            <header>
              <div>
                <strong>MIYOTA 8215 · laboratorio de calibre · {friendlyLearningTerm(workspace.calibreLab.mode)}</strong>
                <span>
                  {workspace.calibreLab.auditCounts.definitions} tipos de pieza · {workspace.calibreLab.auditCounts.instances} piezas colocadas ·
                  {workspace.calibreLab.eventCount} acciones registradas · fuentes visibles
                </span>
              </div>
              <button type="button" onClick={() => setCalibreOpen((value) => !value)} aria-expanded={calibreOpen}>
                {calibreOpen ? 'Plegar calibre' : 'Abrir calibre'}
              </button>
            </header>
            {calibreOpen && (
              <div className="mechanical-learning-lab__body">
                <section aria-label="Identidad, documentación y vistas">
                  <h2>Identidad y fuentes</h2>
                  <p>
                    Modelo de referencia <strong>{friendlyLearningTerm(workspace.calibreLab.fixtureId)}</strong>{showTechnicalIds && <> · revisión <code>{workspace.calibreLab.fixtureVersion}</code></>}<br />
                    vista <strong>{friendlyLearningTerm(workspace.calibreLab.viewMode)}</strong> · documentación {workspace.calibreLab.documentationReviewed ? 'revisada' : 'pendiente'}
                  </p>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => calibreCommand({ type: 'identify-calibre' })}>Identificar 8215</button>
                    <button
                      type="button"
                      onClick={() => calibreCommand({ type: 'review-documentation', sourceIds: workspace.calibreLab!.officialSourceIds })}
                    >Revisar fuentes oficiales</button>
                    {(['complete', 'automatic', 'dial-side', 'side', 'exploded', 'provenance', 'energy-route', 'textual'] as const).map((viewMode) => (
                      <button
                        type="button"
                        className={workspace.calibreLab?.viewMode === viewMode ? 'is-selected' : undefined}
                        key={viewMode}
                        onClick={() => calibreCommand({ type: 'change-view', viewMode })}
                      >{friendlyLearningTerm(viewMode)}</button>
                    ))}
                  </div>
                  <h2>Estado auditado</h2>
                  <p>
                    listas {workspace.calibreLab.auditCounts.ready} · con límites {workspace.calibreLab.auditCounts.usableWithLimitations} ·
                    documentales {workspace.calibreLab.auditCounts.documentaryOnly} · bloqueadas {workspace.calibreLab.auditCounts.blocked} ·
                    desconocidas {workspace.calibreLab.auditCounts.unknown}
                  </p>
                  <details>
                    <summary>Autoridad de las operaciones</summary>
                    <ul>{workspace.calibreLab.authorityCounts.map(({ authority, count }) => <li key={authority}>{friendlyLearningTerm(authority)}: {count}</li>)}</ul>
                  </details>
                </section>
                <section aria-label="Arquitectura y planificación del calibre">
                  <h2>Subsistemas del calibre</h2>
                  <div className="mechanical-learning-lab__actions">
                    {workspace.calibreLab.subsystems.map((subsystem) => (
                      <button
                        type="button"
                        className={subsystem.selected ? 'is-selected' : undefined}
                        key={subsystem.id}
                        title={`${subsystem.instanceCount} piezas · ${subsystem.operationCount} operaciones · ${subsystem.limitations.join(' ')}`}
                        onClick={() => calibreCommand({ type: 'select-subsystem', subsystemId: subsystem.id })}
                      >{subsystem.label}</button>
                    ))}
                  </div>
                  <h2>Plan reversible</h2>
                  <div className="mechanical-learning-lab__actions">
                    <button
                      type="button"
                      disabled={!workspace.calibreLab.documentationReviewed}
                      onClick={() => calibreCommand({
                        type: 'create-disassembly-plan',
                        operationIds: workspace.calibreLab!.disassemblyOperationIds,
                      })}
                    >Crear plan educativo</button>
                    {(['barrel', 'train', 'escapement', 'oscillator', 'motion-works', 'automatic'] as const).map((lab) => (
                      <button type="button" key={lab} onClick={() => calibreCommand({ type: 'open-contextual-lab', lab })}>{friendlyWorkspaceSubsystem(lab)}</button>
                    ))}
                    <button type="button" onClick={() => calibreCommand({ type: 'close-contextual-lab' })}>Cerrar laboratorio contextual</button>
                  </div>
                  <p>
                    {workspace.calibreLab.disassemblyPlan.length} operaciones planificadas ·
                    laboratorio contextual {workspace.calibreLab.activeContextualLab ? friendlyWorkspaceSubsystem(workspace.calibreLab.activeContextualLab) : 'cerrado'}.
                  </p>
                  <details>
                    <summary>Árbol accesible de piezas e identidades</summary>
                    {workspace.calibreLab.accessibility.subsystemTree.map((subsystem) => (
                      <section key={subsystem.id}>
                        <h2>{subsystem.label}</h2>
                        <ul>{subsystem.instanceRows.map((row) => (
                          <li key={row.instanceId}>
                            <button type="button" onClick={() => calibreCommand({ type: 'select-instance', instanceId: row.instanceId })}>
                              {row.label} · {friendlyLearningTerm(row.state)}
                            </button>
                          </li>
                        ))}</ul>
                      </section>
                    ))}
                  </details>
                </section>
                <section aria-label="Inspección, comprobación y diagnóstico">
                  <h2>Inspección y comprobaciones parciales</h2>
                  <div className="mechanical-learning-lab__actions">
                    {workspace.calibreLab.selectedInstanceId && (
                      <>
                        <button type="button" onClick={() => calibreCommand({ type: 'inspect', instanceId: workspace.calibreLab!.selectedInstanceId! })}>Inspeccionar selección</button>
                        <button type="button" onClick={() => calibreCommand({ type: 'inspect', instanceId: workspace.calibreLab!.selectedInstanceId!, defect: 'damaged-tooth-symbolic' })}>Aplicar defecto simbólico</button>
                      </>
                    )}
                    {(['functional-continuity', 'alignment', 'supports-present', 'part-identity', 'fastener-identity', 'orientation', 'energy-route', 'calendar-state', 'stem-state', 'rotor-presence', 'assembly-restored'] as const).map((kind) => (
                      <button type="button" key={kind} onClick={() => calibreCommand({ type: 'verify', kind })}>{friendlyLearningTerm(kind)}</button>
                    ))}
                  </div>
                  <h2>Diagnóstico limitado</h2>
                  <div className="mechanical-learning-lab__actions">
                    {(['does-not-start', 'train-interrupted', 'escapement-blocked', 'calendar-blocked', 'wrong-fastener', 'pivot-outside-support'] as const).map((fault) => (
                      <button
                        type="button"
                        className={workspace.calibreLab?.faults.find((candidate) => candidate.kind === fault)?.active ? 'is-selected' : undefined}
                        key={fault}
                        onClick={() => calibreCommand({ type: 'introduce-fault', fault })}
                      >{friendlyLearningTerm(fault)}</button>
                    ))}
                    <button type="button" onClick={() => calibreCommand({
                      type: 'form-hypothesis',
                      hypothesis: {
                        symptom: 'La cadena funcional no continúa.',
                        subsystemId: workspace.calibreLab!.selectedSubsystemId,
                        hypothesis: 'Una relación declarada del subsistema puede estar interrumpida.',
                        requiredDatum: 'Comprobación parcial de continuidad.',
                        verificationKind: 'functional-continuity',
                      },
                    })}>Formular hipótesis limitada</button>
                    {workspace.calibreLab.hypotheses.at(-1) && (
                      <button type="button" onClick={() => calibreCommand({
                        type: 'evaluate-hypothesis',
                        hypothesisId: workspace.calibreLab!.hypotheses.at(-1)!.id,
                        result: 'inconclusive',
                        permittedConclusion: 'La simulación orienta la siguiente comprobación, pero no confirma una avería física.',
                      })}>Evaluar como no concluyente</button>
                    )}
                    <button type="button" onClick={() => calibreCommand({
                      type: 'recognize-limit',
                      limitation: 'El modelo educativo no valida tolerancias, lubricación, desgaste, par ni marcha real.',
                    })}>Reconocer el límite del modelo</button>
                  </div>
                  <p>Comprobaciones: {workspace.calibreLab.verifications.length} · hallazgos: {workspace.calibreLab.inspectionFindings.length} · hipótesis: {workspace.calibreLab.hypotheses.length}.</p>
                  <p>Hitos completados: {workspace.calibreLab.project.passedChecks.map(friendlyProjectCheck).join(', ') || 'ninguno todavía'}.</p>
                  <p>Hitos pendientes: {workspace.calibreLab.project.pendingChecks.map(friendlyProjectCheck).join(', ') || 'ninguno'}.</p>
                </section>
              </div>
            )}
          </section>
        )}
        {workspace.workbench && (
          <section className={`virtual-workbench ${workbenchOpen ? '' : 'is-collapsed'}`} aria-label="Banco de trabajo virtual">
            <header>
              <div>
                <strong>Banco virtual · {friendlyLearningTerm(workspace.workbench.mode)}</strong>
                <span>{workspace.workbench.prepared ? 'preparado' : 'sin preparar'} · energía {workspace.workbench.energyIsolated ? 'aislada' : 'no aislada'} · {workspace.workbench.eventCount} acciones registradas</span>
              </div>
              <button type="button" onClick={() => setWorkbenchOpen((value) => !value)} aria-expanded={workbenchOpen}>
                {workbenchOpen ? 'Plegar banco' : 'Abrir banco'}
              </button>
            </header>
            {workbenchOpen && (
              <div className="virtual-workbench__body">
                <section aria-label="Preparación y herramientas">
                  <h2>Preparación</h2>
                  <div className="virtual-workbench__actions">
                    <button type="button" onClick={() => workbenchCommand({ type: 'prepare-workbench' })}>Preparar banco</button>
                    <button type="button" disabled={!workspace.workbench.prepared} onClick={() => workbenchCommand({ type: 'isolate-energy' })}>Aislar energía</button>
                    <button type="button" disabled={!workspace.workbench.prepared} onClick={() => workbenchCommand({ type: 'create-checkpoint', stepId: workspace.activeStepId })}>Guardar punto</button>
                  </div>
                  <h2>Herramientas</h2>
                  <div className="virtual-workbench__tools" role="list">
                    {workspace.workbench.tools.map((tool) => (
                      <button
                        type="button"
                        role="listitem"
                        className={tool.selected ? 'is-selected' : undefined}
                        key={tool.id}
                        title={`${tool.capabilities.map(friendlyLearningTerm).join(', ')} · ${tool.limitations.join(' ')}`}
                        onClick={() => workbenchCommand({ type: 'select-tool', toolId: tool.id })}
                      >{tool.label}</button>
                    ))}
                  </div>
                </section>
                <section aria-label="Piezas del movimiento">
                  <h2>Piezas e identidad</h2>
                  <div className="virtual-workbench__parts" role="listbox" aria-label="Piezas del modelo">
                    {workspace.workbench.parts.map((part) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={part.instanceId === selectedWorkbenchPart?.instanceId}
                        disabled={!part.manipulable}
                        key={part.instanceId}
                        title={part.accessibleLabel}
                        onClick={() => workbenchCommand({ type: 'select-part', instanceId: part.instanceId })}
                      >
                        <strong>{part.label}</strong>
                        <span>{friendlyWorkspaceSubsystem(part.subsystem)} · {friendlyLearningTerm(part.state)} · {friendlyLearningTerm(part.orientation)}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section aria-label="Acciones y bandeja">
                  <h2>Acciones disponibles</h2>
                  {selectedWorkbenchPart
                    ? (
                      <>
                        <p>{selectedWorkbenchPart.label}{showTechnicalIds && <><br /><code>{selectedWorkbenchPart.instanceId}</code></>}</p>
                        <div className="virtual-workbench__actions">
                          <button type="button" onClick={() => workbenchCommand({ type: 'inspect-part', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.loupe' })}>Inspeccionar</button>
                          {selectedWorkbenchPart.fastener && <button type="button" onClick={() => workbenchCommand({ type: 'loosen-fastener', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.screwdriver', fitConfirmed: true })}>Aflojar</button>}
                          <button type="button" onClick={() => workbenchCommand({ type: 'remove-part', instanceId: selectedWorkbenchPart.instanceId, toolId: selectedWorkbenchPart.fastener ? 'tool.screwdriver' : 'tool.tweezers' })}>Retirar</button>
                          <button type="button" onClick={() => workbenchCommand({ type: 'rotate-part', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.tweezers', orientation: 'top-up' })}>Orientar</button>
                          <button type="button" onClick={() => workbenchCommand({ type: 'place-in-tray', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.tweezers', trayZoneId: 'tray.zone.1' })}>Bandeja 1</button>
                          <button type="button" onClick={() => workbenchCommand({ type: 'align-part', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.tweezers', orientation: 'as-installed' })}>Alinear</button>
                          <button
                            type="button"
                            onClick={() => selectedWorkbenchPart.fastener
                              ? workbenchCommand({ type: 'tighten-fastener', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.screwdriver', fitConfirmed: true })
                              : workbenchCommand({ type: 'install-part', instanceId: selectedWorkbenchPart.instanceId, toolId: 'tool.tweezers' })}
                          >Instalar</button>
                          <button type="button" onClick={() => workbenchCommand({ type: 'verify-part', instanceId: selectedWorkbenchPart.instanceId })}>Verificar</button>
                        </div>
                      </>
                    )
                    : <p>No hay una pieza manipulable seleccionada.</p>}
                  <h2>Bandeja accesible</h2>
                  <ol className="virtual-workbench__tray">
                    {workspace.workbench.trayZones.map((zone) => (
                      <li key={zone.id}>
                        <strong>{zone.label}</strong>
                        <span>
                          {zone.instanceIds.length
                            ? zone.instanceIds.map((instanceId) => (
                              workspace.workbench?.parts.find((part) => part.instanceId === instanceId)?.label
                              ?? (showTechnicalIds ? instanceId : 'Pieza registrada')
                            )).join(', ')
                            : 'vacía'}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            )}
          </section>
        )}
        {workspace.mechanicalLab && (
          <section className={`mechanical-learning-lab ${mechanicalOpen ? '' : 'is-collapsed'}`} aria-label="Laboratorio funcional de fundamentos mecánicos">
            <header>
              <div>
                <strong>Laboratorio mecánico · {friendlyWorkspaceSubsystem(workspace.mechanicalLab.subsystem)}</strong>
                <span>
                  energía {(workspace.mechanicalLab.energyLevel * 100).toFixed(0)}% ·
                  relación {workspace.mechanicalLab.totalRatio.toFixed(6)} ·
                  {workspace.mechanicalLab.eventCount} acciones registradas
                </span>
              </div>
              <button type="button" onClick={() => setMechanicalOpen((value) => !value)} aria-expanded={mechanicalOpen}>
                {mechanicalOpen ? 'Plegar laboratorio' : 'Abrir laboratorio'}
              </button>
            </header>
            {mechanicalOpen && (
              <div className="mechanical-learning-lab__body">
                <section aria-label="Subsistemas y energía">
                  <h2>Subsistema</h2>
                  <div className="mechanical-learning-lab__actions">
                    {(['energy', 'barrel', 'gear-pair', 'train', 'supports', 'escapement', 'oscillator', 'motion-works', 'keyless', 'automatic', 'calendar', 'integration'] as const).map((subsystem) => (
                      <button
                        type="button"
                        className={workspace.mechanicalLab?.subsystem === subsystem ? 'is-selected' : undefined}
                        key={subsystem}
                        onClick={() => mechanicalCommand({ type: 'select-subsystem', subsystem })}
                      >{friendlyWorkspaceSubsystem(subsystem)}</button>
                    ))}
                  </div>
                  <h2>Energía normalizada</h2>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'wind', amount: 0.1 })}>Cargar +10%</button>
                    <button type="button" disabled={workspace.mechanicalLab.energyLevel <= 0} onClick={() => mechanicalCommand({ type: 'release', amount: 0.1 })}>Liberar 10%</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'block', entityId: 'mechanical.barrel-drum' })}>Bloquear barrilete</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'unblock', entityId: 'mechanical.barrel-drum' })}>Desbloquear</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'undo' })}>Deshacer</button>
                  </div>
                  <h2>Vistas útiles</h2>
                  <div className="mechanical-learning-lab__actions">
                    {(['normal', 'schematic', 'section', 'energy-flow', 'kinematics', 'step-by-step', 'compare-8215', 'textual'] as const).map((view) => (
                      <button type="button" className={workspace.mechanicalLab?.viewMode === view ? 'is-selected' : undefined} key={view} onClick={() => mechanicalCommand({ type: 'change-view', view })}>{friendlyLearningTerm(view)}</button>
                    ))}
                  </div>
                </section>
                <section aria-label="Tren, escape y oscilador">
                  <h2>Tren editable</h2>
                  <ol className="mechanical-learning-lab__stages">
                    {workspace.mechanicalLab.gearStages.map((stage, index) => (
                      <li key={stage.id}>
                        <strong>Etapa {index + 1}{showTechnicalIds && <> · <code>{stage.id}</code></>}</strong>
                        <span>{stage.driverTeeth} → {stage.drivenTeeth} · {stage.engaged ? 'engranada' : 'interrumpida'} · {friendlyLearningTerm(stage.centerDistanceState)}</span>
                        <button type="button" onClick={() => mechanicalCommand({
                          type: stage.engaged ? 'disengage' : 'engage',
                          target: 'gear-stage',
                          stageId: stage.id,
                        })}>{stage.engaged ? 'Desengranar' : 'Engranar'}</button>
                      </li>
                    ))}
                  </ol>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'change-ratio', stageId: 'stage.barrel-center', driverTeeth: 72, drivenTeeth: 12 })}>Aplicar 72:12</button>
                    <button type="button" onClick={() => mechanicalCommand({
                      type: 'add-stage',
                      stage: {
                        id: `stage.user.${workspace.mechanicalLab?.eventCount ?? 0}`,
                        driverTeeth: 24,
                        drivenTeeth: 48,
                        relation: 'external-mesh',
                        engaged: true,
                        centerDistanceState: 'valid-conceptual',
                      },
                    })}>Añadir etapa 24:48</button>
                  </div>
                  <h2>Apoyos</h2>
                  <p>Estado: <strong>{friendlyLearningTerm(workspace.mechanicalLab.supportState)}</strong></p>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'align', state: 'supported' })}>Apoyo correcto</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'misalign', state: 'pivot-outside-jewel' })}>Pivote fuera</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'misalign', state: 'excess-axial' })}>Exceso axial</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'misalign', state: 'no-freedom' })}>Sin libertad</button>
                  </div>
                  <h2>Escape</h2>
                  <p>Fase: <strong>{friendlyLearningTerm(workspace.mechanicalLab.escapementPhase)}</strong> · {workspace.mechanicalLab.escapementSpeed}× · {workspace.mechanicalLab.escapementPaused ? 'pausado' : 'activo'}</p>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'step-escapement', direction: -1 })}>Fase anterior</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'step-escapement', direction: 1 })}>Fase siguiente</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'scrub-escapement', phaseIndex: 0 })}>Ir a bloqueo izquierdo</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'scrub-escapement', phaseIndex: 6 })}>Ir a impulso derecho</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'set-escapement-speed', multiplier: 0.25 })}>Velocidad 0,25×</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'pause-escapement', paused: true })}>Pausar</button>
                  </div>
                  <h2>Oscilador</h2>
                  <p>{workspace.mechanicalLab.oscillatorFrequencyHz} Hz · amplitud conceptual {workspace.mechanicalLab.oscillatorAmplitudeDegrees}° · longitud activa {workspace.mechanicalLab.hairspringActiveLength.toFixed(2)} · {workspace.mechanicalLab.oscillatorPaused ? 'pausado' : 'activo'}</p>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'set-oscillator', frequencyHz: 4, amplitudeDegrees: 220 })}>4 Hz / 220°</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'set-oscillator', frequencyHz: 4, amplitudeDegrees: 80 })}>Misma frecuencia / 80°</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'set-hairspring-active-length', normalizedLength: 0.75 })}>Acortar longitud activa</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'oscillate', cycles: 1 })}>Oscilar un ciclo</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'pause-oscillator', paused: true })}>Pausar oscilador</button>
                  </div>
                </section>
                <section aria-label="Funciones, fallos y proyecto">
                  <h2>Minutería</h2>
                  <p>{workspace.mechanicalLab.indicatedMinutes} minutos · {workspace.mechanicalLab.motionWorksEngaged ? 'conectada' : 'desconectada'}</p>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'set-time', minutes: workspace.mechanicalLab!.indicatedMinutes + 15 })}>Avanzar 15 min</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: workspace.mechanicalLab!.motionWorksEngaged ? 'disengage' : 'engage', target: 'motion-works' })}>{workspace.mechanicalLab.motionWorksEngaged ? 'Desacoplar' : 'Acoplar'}</button>
                  </div>
                  <h2>Corona</h2>
                  <div className="mechanical-learning-lab__actions">
                    {(['winding', 'neutral', 'time-setting'] as const).map((position) => (
                      <button type="button" className={workspace.mechanicalLab?.crownPosition === position ? 'is-selected' : undefined} key={position} onClick={() => mechanicalCommand({ type: 'change-crown-position', position })}>{friendlyCrownPosition(position)}</button>
                    ))}
                  </div>
                  <h2>Automático y calendario</h2>
                  <div className="mechanical-learning-lab__actions">
                    <button type="button" onClick={() => mechanicalCommand({ type: 'enable-automatic', reversal: 'bidirectional' })}>Automático bidireccional</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'enable-automatic', reversal: 'unidirectional' })}>Automático unidireccional</button>
                    <button type="button" onClick={() => mechanicalCommand({ type: 'disable-automatic' })}>Desconectar automático</button>
                    <button type="button" disabled={workspace.mechanicalLab.calendarBlocked} onClick={() => mechanicalCommand({ type: 'advance-calendar', days: 1 })}>Avanzar fecha ({workspace.mechanicalLab.calendarDay})</button>
                  </div>
                  <h2>Fallos conceptuales reversibles</h2>
                  <div className="mechanical-learning-lab__actions">
                    {(['missing-mesh', 'pivot-outside-jewel', 'escapement-blocked', 'balance-blocked', 'hairspring-rubbing', 'wrong-crown-position', 'calendar-blocked', 'hands-rubbing'] as const).map((fault) => (
                      <button type="button" key={fault} onClick={() => mechanicalCommand({ type: 'introduce-fault', fault })}>{friendlyLearningTerm(fault)}</button>
                    ))}
                  </div>
                  {workspace.mechanicalLab.activeFaults.map((fault) => (
                    <details key={fault.kind}>
                      <summary>{friendlyLearningTerm(fault.kind)} · {fault.symptom}</summary>
                      <p>Hipótesis: {fault.hypothesis}</p>
                      <p>Prueba: {fault.test}</p>
                      <p>Conclusión permitida: {fault.allowedConclusion}</p>
                      <p>Conclusión no permitida: {fault.forbiddenConclusion}</p>
                    </details>
                  ))}
                  <h2>Proyecto conceptual</h2>
                  <div className="mechanical-learning-lab__actions">
                    {(['barrel', 'train', 'escapement', 'oscillator', 'motion-works', 'keyless', 'automatic', 'calendar'] as const).map((subsystem) => (
                      <button
                        type="button"
                        key={`project-${subsystem}`}
                        disabled={workspace.mechanicalLab?.projectDraft.enabledSubsystems.includes(subsystem)}
                        onClick={() => mechanicalCommand({ type: 'project-enable-subsystem', subsystem })}
                      >Añadir {friendlyWorkspaceSubsystem(subsystem)} al proyecto</button>
                    ))}
                    <button type="button" onClick={() => mechanicalCommand({ type: 'project-record-decision', decision: 'Comparación con MIYOTA 8215 limitada a la estructura documentada disponible.' })}>Registrar el límite de la comparación</button>
                  </div>
                  <p>Subsistemas del dossier: {workspace.mechanicalLab.projectDraft.enabledSubsystems.map(friendlyWorkspaceSubsystem).join(', ')}.</p>
                  <p>Comprobaciones superadas: {workspace.mechanicalLab.projectDraft.passedChecks.map(friendlyProjectCheck).join(', ') || 'ninguna todavía'}.</p>
                  <p>Pendientes: {workspace.mechanicalLab.projectDraft.pendingChecks.map(friendlyProjectCheck).join(', ') || 'ninguna'}.</p>
                  <details>
                    <summary>Alternativa textual y fases estáticas</summary>
                    <ol>{workspace.mechanicalLab.escapementPhases.map((phase) => <li key={phase.phase}>{phase.description}</li>)}</ol>
                    <ul>{workspace.mechanicalLab.textualRelations.map((relation) => <li key={relation}>{relation}</li>)}</ul>
                    <ul>{workspace.mechanicalLab.textualEnergyGraph.map((segment) => <li key={segment}>{segment}</li>)}</ul>
                  </details>
                </section>
              </div>
            )}
          </section>
        )}
      </section>
      {rightOpen && <aside className="learning-workspace-right" aria-label="Panel contextual">
        <div role="tablist" aria-label="Información contextual">
          {CONTEXT_TABS.map((id, index) => (
            <button
              id={`learning-context-tab-${id}`}
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`learning-context-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                event.preventDefault()
                const nextIndex = event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? CONTEXT_TABS.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + CONTEXT_TABS.length) % CONTEXT_TABS.length
                const next = CONTEXT_TABS[nextIndex]
                setTab(next)
                requestAnimationFrame(() => document.getElementById(`learning-context-tab-${next}`)?.focus())
              }}
            >
              {id === 'explanation' ? 'Ayuda' : id === 'data' ? (isDocumentWorkspace ? documentModeLabel : 'Modelo') : id === 'evidence' ? 'Progreso' : 'Fuentes'}
            </button>
          ))}
        </div>
        {tab === 'explanation' && (
          <section id="learning-context-panel-explanation" role="tabpanel" aria-labelledby="learning-context-tab-explanation" tabIndex={0}>
            <span className="learning-eyebrow">AYUDA</span>
            <h2>Qué hacer ahora</h2>
            <p className="learning-context-lead">{runtimeStatus.instruction}</p>
            {feedback && (
              <section className="learning-context-coach">
                <span className="learning-eyebrow">FÍJATE EN ESTO</span>
                <p>{localize(locale, feedback.nextObservation)}</p>
                <strong>{localize(locale, feedback.causalQuestion)}</strong>
              </section>
            )}
            <details className="learning-context-more">
              <summary>Explicación y pistas</summary>
              <p>{friendlyRecommendationReason(localize(locale, workspace.activity.description))}</p>
              {mechanismSource && !isDocumentWorkspace && (
                <p>El movimiento comienza en <strong>{mechanismSource.name}</strong>. Las líneas muestran contactos o acoplamientos: al separar uno, las piezas posteriores dejan de recibir movimiento.</p>
              )}
              {tutor && (
                <section className="learning-context-coach">
                  <strong>{tutor.status}</strong>
                  <p>{tutor.orientation}</p>
                  <div className="learning-context-coach__actions" aria-label="Acciones de la guía contextual">
                    {([
                      ['explain-selection', 'Explícame esta pieza'],
                      ['compare', 'Compárala con otro caso'],
                      ['ask-question', 'Hazme una pregunta'],
                      ['give-hint', 'Dame una pista'],
                      ['request-check', 'Pídeme una comprobación'],
                      ['identify-missing-data', '¿Qué dato falta?'],
                    ] as Array<[ContextualTutorAction, string]>).map(([action, label]) => (
                      <button
                        type="button"
                        className={tutorAction === action ? 'is-active' : undefined}
                        aria-pressed={tutorAction === action}
                        onClick={() => selectTutorAction(action)}
                        disabled={action === 'give-hint' && hintsDisabled}
                        key={action}
                      >{label}</button>
                    ))}
                  </div>
                  {hintsDisabled && <p className="learning-disabled-reason">«Dame una pista» está desactivado porque esta {independentDemonstration ? 'demostración comprueba lo aprendido' : 'recuperación comprueba el recuerdo'} de forma independiente.</p>}
                  {tutorResponse && (
                    <article className="learning-context-coach__response" aria-live="polite">
                      <strong>{tutorResponse.title}</strong>
                      <p>{tutorResponse.answer}</p>
                      <p><strong>Ahora responde tú:</strong> {tutorResponse.followUp}</p>
                      <div className="learning-context-coach__evidence">
                        {tutorResponse.evidenceChips.map((chip) => <span data-kind={chip.kind} key={`${chip.kind}-${chip.label}`}>{chip.label}</span>)}
                      </div>
                      {tutorResponse.sourceIds.length > 0 && <small>{showTechnicalIds ? `Fuentes declaradas: ${tutorResponse.sourceIds.join(', ')}` : `${tutorResponse.sourceIds.length} ${tutorResponse.sourceIds.length === 1 ? 'fuente declarada' : 'fuentes declaradas'}; consulta la pestaña Fuentes para ver sus títulos.`}</small>}
                      <small>{tutorResponse.boundary}</small>
                    </article>
                  )}
                  {tutor.misconception && (
                    <details>
                      <summary>{tutor.misconception.title}</summary>
                      <p>{tutor.misconception.diagnosis}</p>
                      <p><strong>Cómo corregirlo:</strong> {tutor.misconception.correction}</p>
                      <a href={tutor.misconception.remediationHref}>Abrir explicación</a>
                    </details>
                  )}
                </section>
              )}
            </details>
            <details className="learning-technical-scope">
              <summary>Fuentes, límites y fidelidad</summary>
              <ul>{fidelity.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              {showTechnicalIds && <code>{workspace.activity.fidelity.geometry}/{workspace.activity.fidelity.kinematics}/{workspace.activity.fidelity.physics}</code>}
            </details>
          </section>
        )}
        {tab === 'data' && (
          <section id="learning-context-panel-data" role="tabpanel" aria-labelledby="learning-context-tab-data" tabIndex={0}>
            <h2>{isManufacturingWorkspace ? 'Contrato de fabricación' : isPersonalDesignWorkspace ? 'Contrato de diseño' : isValidationWorkspace ? 'Contrato de validación' : isServiceWorkspace ? 'Contrato del procedimiento' : isComparativeWorkspace ? 'Contrato de comparación' : 'Sobre este modelo'}</h2>
            {isManufacturingWorkspace && activeManufacturingPlan ? (
              <dl className="learning-definition-list">
                <div><dt>Proceso</dt><dd>{localize(locale, activeManufacturingPlan.title)}</dd></div>
                <div><dt>Operaciones</dt><dd>{activeManufacturingPlan.operations.length}</dd></div>
                <div><dt>Control</dt><dd>{workspace.activity.manufacturingContract?.hazardIds.length} riesgos · {workspace.activity.manufacturingContract?.inspectionPointIds.length} inspecciones</dd></div>
                <div><dt>Límite</dt><dd>{activeManufacturingPlan.physicalBoundary}</dd></div>
              </dl>
            ) : isPersonalDesignWorkspace && activeDesignStage ? (
              <dl className="learning-definition-list">
                <div><dt>Puerta</dt><dd>{friendlyLearningTerm(activeDesignStage.gate)}</dd></div>
                <div><dt>Nivel</dt><dd>{friendlyLearningTerm(activeDesignStage.routeLevel)}</dd></div>
                <div><dt>Alternativas</dt><dd>Mínimo {activeDesignStage.alternativesMinimum}</dd></div>
                <div><dt>Salida</dt><dd>{activeDesignStage.exitCriteria.join(' ')}</dd></div>
              </dl>
            ) : isValidationWorkspace && activeValidationProtocol ? (
              <dl className="learning-definition-list">
                <div><dt>Protocolo</dt><dd>{localize(locale, activeValidationProtocol.title)}</dd></div>
                <div><dt>Dimensiones</dt><dd>{activeValidationProtocol.dimensions.map(friendlyLearningTerm).join(', ')}</dd></div>
                <div><dt>Participantes</dt><dd>{activeValidationProtocol.participantProfileIds.length} perfiles</dd></div>
                <div><dt>Bloqueo</dt><dd>{activeValidationProtocol.adverseFindings.length} hallazgos adversos declarados</dd></div>
              </dl>
            ) : isServiceWorkspace && activeServiceProcedure ? (
              <dl className="learning-definition-list">
                <div><dt>Procedimiento</dt><dd>{localize(locale, activeServiceProcedure.title)}</dd></div>
                <div><dt>Pasos</dt><dd>{activeServiceProcedure.steps.length}</dd></div>
                <div><dt>Aceptación</dt><dd>{activeServiceProcedure.acceptanceCriterionIds.length} criterios declarados</dd></div>
                <div><dt>Límite</dt><dd>{localize(locale, activeServiceProcedure.physicalBoundary)}</dd></div>
              </dl>
            ) : isComparativeWorkspace && workspace.activity.comparativeArchitectureContract ? (
              <dl className="learning-definition-list">
                <div><dt>Casos</dt><dd>{comparativeCases.length}</dd></div>
                <div><dt>Ejes</dt><dd>{workspace.activity.comparativeArchitectureContract.comparisonAxes.map(friendlyLearningTerm).join(', ')}</dd></div>
                <div><dt>Representación</dt><dd>{friendlyLearningTerm(workspace.activity.comparativeArchitectureContract.representation)}</dd></div>
                <div><dt>Autoridad</dt><dd>{friendlyLearningTerm(workspace.activity.comparativeArchitectureContract.evidenceBoundary)}</dd></div>
              </dl>
            ) : (
              <dl className="learning-definition-list">
                <div><dt>Uso</dt><dd>Representación educativa reversible</dd></div>
                <div><dt>Modelo</dt><dd>{friendlyLearningTerm(workspace.modelReference)}</dd></div>
                <div><dt>Parte estudiada</dt><dd>{friendlyLearningTerm(workspace.activity.subsystem)}</dd></div>
                <div><dt>Información pendiente</dt><dd>{workspace.unknownData.join('; ') || 'No hay datos pendientes declarados'}</dd></div>
              </dl>
            )}
            <ul>{(locale?.toLowerCase().startsWith('en') ? workspace.activity.warnings.en : workspace.activity.warnings.es).map((warning) => <li key={warning}>{warning}</li>)}</ul>
            {showTechnicalIds && !isDocumentWorkspace && <code>{workspace.modelReference}</code>}
          </section>
        )}
        {tab === 'evidence' && (
          <section id="learning-context-panel-evidence" role="tabpanel" aria-labelledby="learning-context-tab-evidence" tabIndex={0}>
            <h2>Tu progreso en esta práctica</h2>
            <strong>{workspace.provisionalEvidenceCount}</strong>
            <p>{workspace.provisionalEvidenceCount === 1 ? 'acción confirmada' : 'acciones confirmadas'} hasta ahora.</p>
            <p>Solo se guarda como evidencia lo que confirmas. {isDocumentWorkspace ? 'Consultar casos, fuentes o pasos no te penaliza.' : 'Explorar el modelo libremente no te penaliza.'}</p>
          </section>
        )}
        {tab === 'sources' && (
          <section id="learning-context-panel-sources" role="tabpanel" aria-labelledby="learning-context-tab-sources" tabIndex={0}>
            <h2>Fuentes y procedencia</h2>
            {workspace.sourceLabels.length
              ? <ul>{workspace.sourceLabels.map((source) => <li key={source}>{source}</li>)}</ul>
              : <p>No se han declarado fuentes editoriales para esta actividad.</p>}
            <p>Las referencias se presentan sin almacenar ni abrir necesariamente el documento original.</p>
          </section>
        )}
        {workspace.diagnostics.map((diagnostic) => (
          <details className="learning-diagnostic" key={diagnostic.code}>
            <summary>Ver diagnóstico técnico</summary>
            <p>{diagnostic.message}</p>
            <code>{diagnostic.code} · {diagnostic.technical}</code>
          </details>
        ))}
      </aside>}
      <footer className="learning-activity-dock" aria-label="Controles de actividad">
        <div className="learning-dock-transport" role="group" aria-label={isDocumentWorkspace ? 'Guía del estudio' : 'Demostración del modelo'}>
          {isDocumentWorkspace ? (
            <span className={`learning-dock-guidance is-${runtimeStatus.tone}`}>
              <strong>{runtimeStatus.label}</strong>
              <small>{runtimeStatus.instruction}</small>
            </span>
          ) : <>{reducedMotion ? (
            <button
              type="button"
              disabled={!workspace.durationMs}
              onClick={() => command({ type: 'scrub', timeMs: Math.min(workspace.durationMs, workspace.timelineMs + 900) })}
            ><ArrowRight size={17} />Mostrar siguiente estado</button>
          ) : (
            <button
              type="button"
              className={modelMotionActive ? 'is-playing' : 'is-primary'}
              onClick={() => {
                setModelMotionFocused(true)
                setModelMotionActive((current) => !current)
              }}
              disabled={!motionAvailable}
            >
              {modelMotionActive ? <Pause size={17} /> : <Play size={17} />}
              {modelMotionActive ? 'Pausar mecanismo' : motionAvailable ? 'Poner en marcha' : 'Sin movimiento verificable'}
            </button>
          )}
          <button
            type="button"
            aria-pressed={modelMotionFocused}
            onClick={() => setModelMotionFocused((current) => !current)}
            disabled={mechanismRelationCount === 0}
          >
            <Sparkles size={16} />
            {modelMotionFocused ? 'Ocultar contactos' : 'Mostrar contactos'}
          </button>
          <span className={`learning-dock-guidance is-${runtimeStatus.tone}`}>
            <strong>{runtimeStatus.label}</strong>
            <small>{runtimeStatus.instruction}</small>
          </span>
          </>}
        </div>
        <div className="learning-dock-actions">
          <button type="button" onClick={() => command({ type: 'previous-step' })} disabled={activeStepIndex === 0}><ArrowLeft size={16} />Paso anterior</button>
          <button
            type="button"
            onClick={() => command({ type: 'show-hint', hintId: nextAvailableHint?.hint.id })}
            disabled={!nextAvailableHint || hintsDisabled}
            aria-describedby={!nextAvailableHint || hintsDisabled ? 'learning-hint-reason' : undefined}
          ><HelpCircle size={16} />{independentDemonstration ? 'Demostración sin pistas' : workspace.learningMode === 'retention' ? 'Repaso sin pistas' : nextAvailableHint ? 'Necesito una pista' : 'Pista tras intentarlo'}</button>
          {(!nextAvailableHint || hintsDisabled) && (
            <span className="learning-disabled-reason" id="learning-hint-reason">
              {independentDemonstration
                ? 'Esta comprobación mide lo aprendido en un intento independiente y no permite pistas.'
                : workspace.learningMode === 'retention'
                  ? 'Este repaso mide recuerdo independiente y no permite pistas.'
                : 'Responde y comprueba al menos un intento para desbloquear ayuda gradual.'}
            </span>
          )}
        </div>
        <details
          className="learning-dock-advanced"
          open={advancedControlsOpen}
          onToggle={(event) => setAdvancedControlsOpen(event.currentTarget.open)}
        >
          <summary>{isDocumentWorkspace ? 'Opciones de la práctica' : 'Controles de la demostración'}</summary>
          <div>
            {!isDocumentWorkspace && <><label className="learning-dock-scrubber">
              <span>Recorrido visual</span>
              <input
                type="range"
                min={0}
                max={Math.max(1, workspace.durationMs)}
                step={50}
                value={Math.min(workspace.timelineMs, Math.max(1, workspace.durationMs))}
                onChange={(event) => command({ type: 'scrub', timeMs: Number(event.target.value) })}
              />
            </label>
            <label className="learning-dock-speed">
              <Gauge size={15} />
              <span>Velocidad</span>
              <select value={workspace.speed} onChange={(event) => command({ type: 'set-speed', speed: Number(event.target.value) })}>
                <option value={0.25}>0,25× · muy lenta</option>
                <option value={0.5}>0,5× · lenta</option>
                <option value={1}>1× · normal</option>
                <option value={2}>2× · rápida</option>
              </select>
            </label></>}
            <button
              type="button"
              onClick={() => {
                setModelMotionActive(false)
                setModelMotionFocused(false)
                command({ type: 'restart' })
              }}
            ><RotateCcw size={15} />Reiniciar práctica</button>
            {!isDocumentWorkspace && <button
              type="button"
              onClick={() => {
                setModelMotionActive(false)
                setModelMotionFocused(false)
                command({ type: 'restore-view' })
              }}
            ><ShieldCheck size={15} />Mostrar reloj completo</button>}
            <button type="button" onClick={() => void service.cancelActivity()}><Square size={15} />Salir sin completar</button>
          </div>
        </details>
      </footer>
    </main>
  )
}

export default LearningActivityWorkspace
