import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import {
  Blocks,
  BookOpen,
  Box,
  Camera,
  CheckCircle2,
  CircleStop,
  Eye,
  EyeOff,
  Factory,
  FileArchive,
  FileJson,
  Focus,
  GalleryHorizontal,
  GraduationCap,
  Grid2X2,
  Layers3,
  Library,
  LoaderCircle,
  Maximize2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Redo2,
  Rotate3D,
  Save,
  ScanSearch,
  Scissors,
  Settings2,
  Sparkles,
  TriangleAlert,
  Undo2,
  Upload,
  View,
  Watch,
} from 'lucide-react'
import './App.css'
import { WORKSPACE_NAV_COLUMNS } from './appLayout'
import { getInteractiveEngineeringReport } from './core/interactiveReport'
import {
  academyEntryCause,
  readUxSession,
  recoverAcademyEntryHref,
  shouldReloadLearningChunkOnce,
  writeUxSession,
} from './learning/academy/academyEntryRecovery'
import { StudioInspector } from './vnext/Inspector'
import { StudioLibrary } from './vnext/Library'
import { StudioSidebar } from './vnext/Sidebar'
import { APP_VERSION } from './version'
import type { CameraPreset } from './vnext/StudioViewport'
import type { RenderMode, ViewMode, WatchProject, Workspace } from './vnext/model'
import { useStudioStore } from './vnext/store'

const StudioViewport = lazy(() => import('./vnext/StudioViewport').then((module) => ({ default: module.StudioViewport })))
const LearningRuntimeHarness = import.meta.env.DEV ? lazy(() => import('./learning/dev/LearningRuntimeHarness')) : null
const LearningPersistenceHarness = import.meta.env.DEV ? lazy(() => import('./learning/dev/LearningPersistenceHarness')) : null
const AcademyUxHarness = import.meta.env.DEV ? lazy(() => import('./learning/dev/AcademyUxHarness')) : null
function createLearningArea() {
  return lazy(async () => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('academy-entry-delay') === '1') {
      await new Promise((resolve) => window.setTimeout(resolve, 5_000))
    }
    return import('./learning/ui/LearningArea').then((module) => ({ default: module.LearningArea }))
  })
}

const LearningArea = createLearningArea()

interface LearningEntryBoundaryState {
  error: Error | null
  copied: boolean
  reloadingChunk: boolean
}

class LearningEntryBoundary extends Component<{
  children: ReactNode
  onBack: () => void
  onRetry: () => void
}, LearningEntryBoundaryState> {
  state: LearningEntryBoundaryState = { error: null, copied: false, reloadingChunk: false }
  private reloadTimer: number | undefined

  static getDerivedStateFromError(error: Error): Partial<LearningEntryBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[academy:entry]', error, info)
    if (shouldReloadLearningChunkOnce(error, APP_VERSION)) {
      this.setState({ reloadingChunk: true })
      this.reloadTimer = window.setTimeout(() => window.location.reload(), 1_200)
    }
  }

  componentWillUnmount(): void {
    if (this.reloadTimer !== undefined) window.clearTimeout(this.reloadTimer)
  }

  private retry = () => {
    if (this.reloadTimer !== undefined) window.clearTimeout(this.reloadTimer)
    this.setState({ error: null, copied: false, reloadingChunk: false })
    this.props.onRetry()
  }

  private copyDiagnostic = async () => {
    const error = this.state.error
    if (!error) return
    const detail = [
      `Watch Prototype Lab ${APP_VERSION}`,
      `Ruta: ${window.location.href}`,
      `${error.name}: ${error.message}`,
      error.stack ?? 'Stack no disponible',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(detail)
      this.setState({ copied: true })
    } catch {
      this.setState({ copied: false })
    }
  }

  render() {
    const error = this.state.error
    if (!error) return this.props.children
    return (
      <main className="academy-entry-state academy-entry-state--error" role="alert" id="learning-main">
        <TriangleAlert size={30} />
        <span className="academy-entry-state__eyebrow">ACADEMIA NO DISPONIBLE</span>
        <h1>No hemos podido abrir Watchmaking Academy</h1>
        <p>{academyEntryCause(error)}</p>
        <p>Tu proyecto técnico, progreso, evidencias, sesiones y notas no se han borrado.</p>
        {this.state.reloadingChunk && (
          <p role="status">Se ha detectado una versión de chunk incompatible. Actualizando una sola vez…</p>
        )}
        <div className="academy-entry-state__actions">
          <button type="button" onClick={this.retry}>Volver a intentar</button>
          <button type="button" onClick={this.props.onBack}>Volver a Estudio</button>
          <button type="button" onClick={() => void this.copyDiagnostic()}>
            {this.state.copied ? 'Información copiada' : 'Copiar información del error'}
          </button>
        </div>
        <details>
          <summary>Abrir diagnóstico técnico</summary>
          <code>{error.name}: {error.message}</code>
          {error.stack && <pre>{error.stack}</pre>}
        </details>
      </main>
    )
  }
}

function AcademyEntryLoading({ onBack }: { onBack: () => void }) {
  return (
    <main className="academy-entry-state" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={24} />
      <span className="academy-entry-state__eyebrow">CARGA LOCAL</span>
      <h1>Preparando la Academia</h1>
      <p>Cargando la interfaz y verificando el contenido instalado.</p>
      <button type="button" onClick={onBack}>Volver a Estudio</button>
    </main>
  )
}

function SimulatedAcademyEntryFailure(): never {
  throw new Error('Fallo simulado de entrada a Academia para verificación visual.')
}

function LearningEntryHost({
  project,
  onExit,
}: {
  project: WatchProject
  onExit: () => void
}) {
  const simulateEntryError = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('academy-entry-error') === '1'
  return (
    <LearningEntryBoundary onBack={onExit} onRetry={() => window.location.reload()}>
      {simulateEntryError
        ? <SimulatedAcademyEntryFailure />
        : (
          <Suspense fallback={<AcademyEntryLoading onBack={onExit} />}>
            <LearningArea
              project={project}
              onExit={onExit}
              onRetry={() => window.location.reload()}
              appVersion={APP_VERSION}
            />
          </Suspense>
        )}
    </LearningEntryBoundary>
  )
}

interface ViewportErrorBoundaryState {
  error: Error | null
}

class ViewportErrorBoundary extends Component<{ children: ReactNode }, ViewportErrorBoundaryState> {
  state: ViewportErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ViewportErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('La vista 3D no pudo iniciarse.', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="viewport-error" role="alert">
          <Sparkles size={24} />
          <strong>La vista 3D no pudo iniciarse</strong>
          <span>El proyecto sigue a salvo. Reintenta la carga del entorno visual.</span>
          <button type="button" onClick={() => window.location.reload()}>Reintentar vista</button>
          {import.meta.env.DEV && <code>{this.state.error.message}</code>}
        </div>
      )
    }
    return this.props.children
  }
}

const workspaceItems: Array<{ id: Workspace; label: string; icon: typeof Watch }> = [
  { id: 'assembly', label: 'Montaje', icon: Watch },
  { id: 'parts', label: 'Piezas', icon: Blocks },
  { id: 'movement', label: 'Movimiento', icon: Settings2 },
  { id: 'analysis', label: 'Validacion', icon: ScanSearch },
  { id: 'manufacturing', label: 'Fabricacion', icon: Factory },
  { id: 'library', label: 'Proyectos', icon: Library },
  { id: 'learning', label: 'Aprender', icon: GraduationCap },
]

const viewItems: Array<{ id: ViewMode; label: string; icon: typeof View }> = [
  { id: 'assembled', label: 'Montado', icon: View },
  { id: 'isolate', label: 'Aislar', icon: Focus },
  { id: 'exploded', label: 'Explotado', icon: Layers3 },
  { id: 'section', label: 'Seccion', icon: Scissors },
]

const cameraItems: Array<{ id: CameraPreset; label: string; icon: typeof View }> = [
  { id: 'iso', label: 'Isometrica', icon: Rotate3D },
  { id: 'top', label: 'Superior', icon: Grid2X2 },
  { id: 'front', label: 'Frontal', icon: GalleryHorizontal },
  { id: 'side', label: 'Lateral', icon: Maximize2 },
]

function safeFileName(name: string): string {
  return name.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'watch-project'
}

function triggerDownload(url: string, fileName: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.hidden = true
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function downloadJson(value: unknown, fileName: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  triggerDownload(url, fileName)
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function TopBar() {
  const workspace = useStudioStore((state) => state.workspace)
  const setWorkspace = useStudioStore((state) => state.setWorkspace)
  const project = useStudioStore((state) => state.project)
  const renameProject = useStudioStore((state) => state.renameProject)
  const undo = useStudioStore((state) => state.undo)
  const redo = useStudioStore((state) => state.redo)
  const past = useStudioStore((state) => state.past)
  const future = useStudioStore((state) => state.future)
  const saveToLibrary = useStudioStore((state) => state.saveToLibrary)
  const importProject = useStudioStore((state) => state.importProject)
  const importProjectPackage = useStudioStore((state) => state.importProjectPackage)
  const openProjectPackage = useStudioStore((state) => state.openProjectPackage)
  const saveProjectPackage = useStudioStore((state) => state.saveProjectPackage)
  const nativeInfo = useStudioStore((state) => state.nativeInfo)
  const cadEngine = useStudioStore((state) => state.cadEngine)
  const fileInput = useRef<HTMLInputElement>(null)
  const [learningLocale, setLearningLocale] = useState(() => navigator.language.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES')

  useEffect(() => {
    const onLocale = (event: Event) => {
      const locale = (event as CustomEvent<string>).detail
      if (locale) setLearningLocale(locale)
    }
    window.addEventListener('wplab-learning-locale', onLocale)
    return () => window.removeEventListener('wplab-learning-locale', onLocale)
  }, [])

  const selectWorkspace = (next: Workspace) => {
    if (next === 'learning') {
      const stored = readUxSession('wplab.learning.last-location')
      if (!window.location.hash.startsWith('#/learning/')) {
        window.history.pushState(
          { learning: true },
          '',
          recoverAcademyEntryHref(stored),
        )
      }
    } else if (workspace === 'learning' && window.location.hash.startsWith('#/learning/')) {
      writeUxSession('wplab.learning.last-location', window.location.hash)
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
    }
    if (next !== 'learning') writeUxSession('wplab.studio.last-workspace', next)
    setWorkspace(next)
  }

  const returnToStudio = () => {
    const stored = readUxSession('wplab.studio.last-workspace') as Workspace | null
    const available = workspaceItems.some(({ id }) => id === stored && id !== 'learning')
    selectWorkspace(available && stored ? stored : 'assembly')
  }

  const openProject = async () => {
    if (!nativeInfo) {
      fileInput.current?.click()
      return
    }
    const result = await openProjectPackage()
    if (!result.ok && result.error !== 'Apertura cancelada.') window.alert(result.error)
  }

  const capture = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#watch-lab-canvas')
    if (canvas) triggerDownload(canvas.toDataURL('image/png'), `${safeFileName(project.name)}.png`)
  }

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark"><Watch size={20} /></div>
        <div><strong>Watch Prototype Lab</strong><span>{nativeInfo ? 'Desktop Engineering Studio' : 'Engineering Studio'}</span></div>
      </div>
      {workspace === 'learning' ? (
        <>
          <div className="product-mode-switch" role="group" aria-label="Contexto de producto">
            <button type="button" onClick={returnToStudio}><Watch size={16} /><span>Estudio</span></button>
            <button type="button" className="is-active" aria-current="page"><BookOpen size={16} /><span>Academia</span></button>
          </div>
          <div className="academy-context-title">
            <strong>{learningLocale.toLowerCase().startsWith('en') ? 'Watchmaking Academy' : 'Academia relojera'}</strong>
            <span>{learningLocale.toLowerCase().startsWith('en') ? 'Learn · practise · retain' : 'Aprender · practicar · retener'}</span>
          </div>
        </>
      ) : (
        <>
          <nav
            className="workspace-nav"
            aria-label="Areas de trabajo"
            style={{ '--workspace-nav-columns': WORKSPACE_NAV_COLUMNS } as CSSProperties}
          >
            {workspaceItems.map((item) => {
              const Icon = item.icon
              const label = item.id === 'learning' && learningLocale.toLowerCase().startsWith('en') ? 'Learn' : item.label
              return <button type="button" key={item.id} className={workspace === item.id ? 'is-active' : undefined} aria-current={workspace === item.id ? 'page' : undefined} onClick={() => selectWorkspace(item.id)}><Icon size={17} /><span>{label}</span></button>
            })}
          </nav>
          <div className="project-identity">
            <input aria-label="Nombre del proyecto" value={project.name} onChange={(event) => renameProject(event.target.value)} />
            <span>{project.movement.name} · v{project.schemaVersion}</span>
          </div>
        </>
      )}
      <div className="topbar-actions">
        <span className={`native-indicator ${nativeInfo ? 'is-native' : ''}`} title={cadEngine ? `${cadEngine.kernel} ${cadEngine.openCascadeVersion}` : 'Modo navegador'}><i />{nativeInfo ? 'LOCAL' : 'WEB'}</span>
        <button type="button" title="Deshacer" aria-label="Deshacer" disabled={past.length === 0} onClick={undo}><Undo2 size={17} /></button>
        <button type="button" title="Rehacer" aria-label="Rehacer" disabled={future.length === 0} onClick={redo}><Redo2 size={17} /></button>
        <details className="project-menu">
          <summary aria-label="Menu de proyecto" title="Proyecto"><MoreHorizontal size={18} /></summary>
          <div className="project-menu__popover">
            <button type="button" onClick={() => void saveProjectPackage()}><FileArchive size={16} /><span>Guardar paquete .wplab</span></button>
            <button type="button" onClick={() => void openProject()}><Upload size={16} /><span>Abrir proyecto</span></button>
            <button type="button" onClick={saveToLibrary}><Save size={16} /><span>Guardar en biblioteca</span></button>
            <button type="button" onClick={() => downloadJson(project, `${safeFileName(project.name)}.watch.json`)}><FileJson size={16} /><span>Exportar JSON</span></button>
            <button type="button" onClick={capture}><Camera size={16} /><span>Capturar PNG</span></button>
          </div>
        </details>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept=".wplab,.json,application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            try {
              const result = file.name.toLowerCase().endsWith('.wplab')
                ? importProjectPackage(new Uint8Array(await file.arrayBuffer()))
                : importProject(JSON.parse(await file.text()) as unknown)
              if (!result.ok) window.alert(result.error)
            } catch (error) {
              window.alert(error instanceof Error ? error.message : 'No se ha podido abrir el proyecto.')
            }
            event.target.value = ''
          }}
        />
      </div>
    </header>
  )
}

function StageToolbar({
  cameraPreset,
  setCameraPreset,
  leftOpen,
  rightOpen,
  focusMode,
  onToggleLeft,
  onToggleRight,
  onToggleFocus,
}: {
  cameraPreset: CameraPreset
  setCameraPreset: (preset: CameraPreset) => void
  leftOpen: boolean
  rightOpen: boolean
  focusMode: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
  onToggleFocus: () => void
}) {
  const project = useStudioStore((state) => state.project)
  const workspace = useStudioStore((state) => state.workspace)
  const viewMode = useStudioStore((state) => state.viewMode)
  const setViewMode = useStudioStore((state) => state.setViewMode)
  const renderMode = useStudioStore((state) => state.renderMode)
  const setRenderMode = useStudioStore((state) => state.setRenderMode)
  const simulate = useStudioStore((state) => state.simulate)
  const setSimulate = useStudioStore((state) => state.setSimulate)
  const showDimensions = useStudioStore((state) => state.showDimensions)
  const setShowDimensions = useStudioStore((state) => state.setShowDimensions)
  const cadStatus = useStudioStore((state) => state.cadStatus)
  const nativeInfo = useStudioStore((state) => state.nativeInfo)
  const runExactAnalysis = useStudioStore((state) => state.runExactAnalysis)
  const cancelCad = useStudioStore((state) => state.cancelCad)
  const setMode = (mode: RenderMode) => setRenderMode(mode)
  return (
    <div className="stage-toolbar">
      <div className="stage-toolbar__group stage-toolbar__group--dock">
        <button type="button" className={leftOpen && !focusMode ? 'is-active' : undefined} title={leftOpen ? 'Ocultar piezas' : 'Mostrar piezas'} onClick={onToggleLeft}>{leftOpen && !focusMode ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</button>
        <button type="button" className={rightOpen && !focusMode ? 'is-active' : undefined} title={rightOpen ? 'Ocultar inspector' : 'Mostrar inspector'} onClick={onToggleRight}>{rightOpen && !focusMode ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}</button>
        <button type="button" className={focusMode ? 'is-active' : undefined} title="Lienzo a pantalla completa" onClick={onToggleFocus}><Maximize2 size={16} /></button>
      </div>
      <span className="stage-toolbar__divider" />
      <div className="stage-toolbar__group stage-toolbar__group--views">
        {viewItems.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={viewMode === item.id ? 'is-active' : undefined} aria-pressed={viewMode === item.id} title={item.label} onClick={() => setViewMode(item.id)}><Icon size={16} /><span>{item.label}</span></button> })}
      </div>
      <div className="stage-toolbar__spacer" />
      <div className="stage-toolbar__group stage-toolbar__group--cameras">
        {cameraItems.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} className={cameraPreset === item.id ? 'is-active' : undefined} title={item.label} aria-label={item.label} onClick={() => setCameraPreset(item.id)}><Icon size={16} /></button> })}
      </div>
      <div className="stage-toolbar__group">
        <button type="button" className={renderMode === 'technical' ? 'is-active' : undefined} title="Vista tecnica" onClick={() => setMode('technical')}><Box size={16} /></button>
        <button type="button" className={renderMode === 'beauty' ? 'is-active' : undefined} title="Vista de producto" onClick={() => setMode('beauty')}><Sparkles size={16} /></button>
        <button type="button" className={renderMode === 'presentation' ? 'is-active is-presentation' : undefined} title="Presentacion hiperrealista" onClick={() => setMode('presentation')}><Camera size={16} /></button>
        <button type="button" className={showDimensions ? 'is-active' : undefined} title={showDimensions ? 'Ocultar cotas' : 'Mostrar cotas'} onClick={() => setShowDimensions(!showDimensions)}>{showDimensions ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        {workspace === 'movement' && project.movement.kind === 'mechanical' && <button type="button" className={simulate ? 'is-active is-running' : undefined} title={simulate ? 'Pausar tren' : 'Simular tren'} onClick={() => setSimulate(!simulate)}>{simulate ? <Pause size={16} /> : <Play size={16} />}</button>}
      </div>
      <button
        type="button"
        className={`cad-command cad-command--${cadStatus}`}
        disabled={!nativeInfo || cadStatus === 'warming'}
        title={cadStatus === 'running' ? 'Cancelar trabajo CAD' : nativeInfo ? 'Validacion exacta OpenCascade' : 'Disponible en la aplicacion Desktop'}
        onClick={() => void (cadStatus === 'running' ? cancelCad() : runExactAnalysis())}
      >
        {cadStatus === 'running' ? <CircleStop size={15} /> : cadStatus === 'warming' ? <LoaderCircle className="spin" size={15} /> : <ScanSearch size={15} />}
        <span>{cadStatus === 'ready' ? 'CAD vigente' : cadStatus === 'stale' ? 'CAD obsoleto' : cadStatus === 'running' ? 'Cancelar CAD' : 'Validar CAD'}</span>
      </button>
    </div>
  )
}

function StageContext() {
  const project = useStudioStore((state) => state.project)
  const workspace = useStudioStore((state) => state.workspace)
  const analysisLayer = useStudioStore((state) => state.analysisLayer)
  const report = useMemo(() => getInteractiveEngineeringReport(project), [project])
  const toleranceLabel = project.engineering.toleranceMode === 'monte_carlo'
    ? `${(report.tolerances.yieldProbability * 100).toFixed(1)}%`
    : project.engineering.toleranceMode === 'worst_case'
      ? report.tolerances.worstCasePass ? 'Peor caso OK' : 'Peor caso justo'
      : report.tolerances.nominalPass ? 'Nominal OK' : 'Nominal mal'
  if (workspace === 'movement' && report.geometry.train) {
    return <div className="stage-context"><span>Tren</span><strong>{Math.round(report.geometry.train.calculatedVph).toLocaleString('es-ES')} vph</strong><i /><span>Reserva</span><strong>{report.geometry.train.powerReserveHours.toFixed(1)} h</strong><i /><span>Puente</span><strong>{report.geometry.train.verticalHeadroom.toFixed(2)} mm</strong></div>
  }
  if (workspace === 'manufacturing') {
    return <div className="stage-context"><span>Proceso</span><strong>{report.manufacturing.profile.name}</strong><i /><span>Piezas</span><strong>{report.manufacturing.printableParts.length}</strong><i /><span>Bloqueadas</span><strong>{report.manufacturing.blockedParts.length}</strong></div>
  }
  if (workspace === 'analysis') {
    return <div className="stage-context"><span>Solver</span><strong>{report.layers.find((layer) => layer.layer === analysisLayer)?.label}</strong><i /><span>Tolerancia</span><strong>{toleranceLabel}</strong></div>
  }
  return null
}

function StatusBar() {
  const project = useStudioStore((state) => state.project)
  const cadStatus = useStudioStore((state) => state.cadStatus)
  const nativeInfo = useStudioStore((state) => state.nativeInfo)
  const report = useMemo(() => getInteractiveEngineeringReport(project), [project])
  const toleranceLayer = report.layers.find((layer) => layer.layer === 'tolerances')
  const manufacturingEnabled = project.engineering.manufacturingProcess !== 'none'
  const errors = report.geometry.findings.filter((item) => item.severity === 'error').length
    + report.assembly.failedConstraints.length
    + (report.dynamics?.issues.filter((item) => item.severity === 'error').length ?? 0)
    + (report.escapement?.issues.filter((item) => item.severity === 'error').length ?? 0)
    + (report.automaticWinding?.issues.filter((item) => item.severity === 'error').length ?? 0)
    + (manufacturingEnabled ? report.manufacturing.checks.filter((item) => item.severity === 'error').length : 0)
    + (toleranceLayer?.state === 'fail' ? 1 : 0)
  const warnings = report.geometry.findings.filter((item) => item.severity === 'warning').length
    + report.assembly.unresolvedParts.length
    + (report.dynamics?.issues.filter((item) => item.severity === 'warning').length ?? 0)
    + (report.escapement?.issues.filter((item) => item.severity === 'warning').length ?? 0)
    + (report.automaticWinding?.issues.filter((item) => item.severity === 'warning').length ?? 0)
    + (manufacturingEnabled ? report.manufacturing.checks.filter((item) => item.severity === 'warning').length : 0)
    + (toleranceLayer?.state === 'warning' ? 1 : 0)
  const statusLabel = report.overall === 'fail' ? 'MAL' : report.overall === 'warning' ? 'JUSTO' : report.overall === 'pending' ? 'PARCIAL' : 'OK'
  const toleranceLabel = project.engineering.toleranceMode === 'monte_carlo'
    ? `${(report.tolerances.yieldProbability * 100).toFixed(1)}%`
    : project.engineering.toleranceMode === 'worst_case'
      ? report.tolerances.worstCasePass ? 'Peor caso OK' : 'Revisar peor caso'
      : report.tolerances.nominalPass ? 'Nominal OK' : 'Nominal mal'
  return (
    <footer className="statusbar">
      <div className={`statusbar-state statusbar-state--${statusLabel.toLowerCase()}`}>{statusLabel === 'OK' ? <CheckCircle2 size={15} /> : <ScanSearch size={15} />}<strong>{statusLabel}</strong></div>
      <div><span>Altura</span><strong>{report.geometry.totalHeight.toFixed(2)} mm</strong></div>
      <div><span>Margen minimo</span><strong>{report.geometry.minimumClearance === null ? 'Pendiente' : `${report.geometry.minimumClearance.toFixed(3)} mm`}</strong></div>
      <div><span>Tolerancia</span><strong>{toleranceLabel}</strong></div>
      <div><span>Conflictos</span><strong>{errors}</strong></div>
      <div><span>Avisos</span><strong>{warnings}</strong></div>
      <div className={`statusbar-cad statusbar-cad--${cadStatus}`}><i /><span>CAD</span><strong>{cadStatus === 'ready' ? 'Vigente' : cadStatus === 'stale' ? 'Obsoleto' : cadStatus === 'running' ? 'En curso' : nativeInfo ? 'Pendiente' : 'Solo Desktop'}</strong></div>
      <div className="autosave-indicator"><Save size={13} />Autoguardado</div>
    </footer>
  )
}

function App() {
  const workspace = useStudioStore((state) => state.workspace)
  const setWorkspace = useStudioStore((state) => state.setWorkspace)
  const initializeNative = useStudioStore((state) => state.initializeNative)
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    void initializeNative()
    if (window.location.hash.startsWith('#/learning/')) setWorkspace('learning')
  }, [initializeNative, setWorkspace])

  const exitLearning = () => {
    if (window.location.hash.startsWith('#/learning/')) {
      writeUxSession('wplab.learning.last-location', window.location.hash)
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
    }
    setWorkspace('assembly')
  }

  return (
    <div className={`watch-lab watch-lab--${workspace}`}>
      <TopBar />
      {workspace === 'learning' ? (
        <LearningEntryHost project={useStudioStore.getState().project} onExit={exitLearning} />
      ) : workspace === 'library' ? <StudioLibrary /> : (
        <div className={`studio-workspace ${!leftOpen || focusMode ? 'is-left-closed' : ''} ${!rightOpen || focusMode ? 'is-right-closed' : ''} ${focusMode ? 'is-focus' : ''}`}>
          <StudioSidebar />
          <section className="studio-stage">
            <StageToolbar
              cameraPreset={cameraPreset}
              setCameraPreset={setCameraPreset}
              leftOpen={leftOpen}
              rightOpen={rightOpen}
              focusMode={focusMode}
              onToggleLeft={() => { setFocusMode(false); setLeftOpen((value) => !value) }}
              onToggleRight={() => { setFocusMode(false); setRightOpen((value) => !value) }}
              onToggleFocus={() => setFocusMode((value) => !value)}
            />
            <StageContext />
            <div className="studio-canvas-wrap">
              <ViewportErrorBoundary>
                <Suspense fallback={<div className="viewport-loading"><LoaderCircle className="spin" size={22} /><span>Preparando estudio 3D</span></div>}>
                  <StudioViewport cameraPreset={cameraPreset} />
                </Suspense>
              </ViewportErrorBoundary>
            </div>
          </section>
          <StudioInspector />
        </div>
      )}
      <StatusBar />
      {LearningRuntimeHarness && new URLSearchParams(window.location.search).get('learning-harness') === '1' && (
        <Suspense fallback={null}><LearningRuntimeHarness /></Suspense>
      )}
      {LearningPersistenceHarness && new URLSearchParams(window.location.search).get('learning-system2') === '1' && (
        <Suspense fallback={null}><LearningPersistenceHarness /></Suspense>
      )}
      {AcademyUxHarness && new URLSearchParams(window.location.search).get('academy-harness') === '1' && (
        <Suspense fallback={null}><AcademyUxHarness /></Suspense>
      )}
    </div>
  )
}

export default App
