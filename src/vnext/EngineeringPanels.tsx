import { useMemo } from 'react'
import {
  Activity,
  BookOpenCheck,
  Boxes,
  Check,
  CircleStop,
  CircleGauge,
  Download,
  Factory,
  FileBox,
  LoaderCircle,
  Orbit,
  PackageCheck,
  ScanSearch,
  ShieldAlert,
  Sigma,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import type { EngineeringReport, SolverLayer, SolverState } from '../core/engineering'
import { getInteractiveEngineeringReport } from '../core/interactiveReport'
import { MANUFACTURING_PROFILES } from '../core/manufacturing'
import { NumberField, Segmented } from './Controls'
import type { WatchPartId } from './model'
import { useStudioStore } from './store'

const layerMeta: Record<SolverLayer, { icon: typeof Boxes; short: string }> = {
  geometry: { icon: Boxes, short: 'Geometria' },
  assembly: { icon: Wrench, short: 'Montaje' },
  kinematics: { icon: Orbit, short: 'Cinematica' },
  dynamics: { icon: Activity, short: 'Dinamica' },
  tolerances: { icon: Sigma, short: 'Tolerancias' },
  manufacturing: { icon: Factory, short: 'Fabricacion' },
}

const partLabels: Partial<Record<WatchPartId, string>> = {
  case: 'Caja',
  back: 'Fondo',
  movement: 'Movimiento',
  plate: 'Platina',
  bridge: 'Puente',
  barrel: 'Barrilete',
  center: 'Centro',
  third: 'Tercera',
  fourth: 'Cuarta',
  escape: 'Escape',
  balance: 'Volante',
  rotor: 'Rotor',
  dial: 'Dial',
  crystal: 'Cristal',
  holder: 'Holder',
}

function StateMark({ state }: { state: SolverState }) {
  if (state === 'pass') return <Check size={14} />
  if (state === 'fail') return <ShieldAlert size={14} />
  if (state === 'warning' || state === 'pending') return <TriangleAlert size={14} />
  return <span>–</span>
}

export function EngineeringSidebar() {
  const project = useStudioStore((state) => state.project)
  const selected = useStudioStore((state) => state.analysisLayer)
  const setSelected = useStudioStore((state) => state.setAnalysisLayer)
  const cadStatus = useStudioStore((state) => state.cadStatus)
  const runExactAnalysis = useStudioStore((state) => state.runExactAnalysis)
  const report = useMemo(() => getInteractiveEngineeringReport(project), [project])
  return (
    <>
      <div className="sidebar-heading">
        <span>Solvers</span>
        <strong>6 capas</strong>
      </div>
      <div className="solver-layer-list">
        {report.layers.map((layer) => {
          const Icon = layerMeta[layer.layer].icon
          return (
            <button
              key={layer.layer}
              type="button"
              className={selected === layer.layer ? 'is-active' : undefined}
              onClick={() => setSelected(layer.layer)}
            >
              <Icon size={17} />
              <span><strong>{layer.label}</strong><small>{layer.summary}</small></span>
              <i className={`solver-state solver-state--${layer.state}`}><StateMark state={layer.state} /></i>
            </button>
          )
        })}
      </div>
      <div className="sidebar-cad-action">
        <span>OpenCascade</span>
        <button
          type="button"
          className="primary-action"
          disabled={cadStatus === 'running' || cadStatus === 'warming' || cadStatus === 'unavailable'}
          onClick={() => void runExactAnalysis()}
        >
          {cadStatus === 'running' || cadStatus === 'warming' ? <LoaderCircle className="spin" size={15} /> : <ScanSearch size={15} />}
          {cadStatus === 'running' ? 'Calculando' : cadStatus === 'ready' ? 'Revalidar CAD' : 'Validar CAD'}
        </button>
        <small className={`cad-state-text cad-state-text--${cadStatus}`}>
          {cadStatus === 'ready' ? 'Informe vigente' : cadStatus === 'stale' ? 'Cambios sin certificar' : cadStatus === 'unavailable' ? 'Solo en Desktop' : cadStatus === 'error' ? 'Motor no disponible' : cadStatus === 'warming' ? 'Iniciando kernel' : 'Sin ejecutar'}
        </small>
      </div>
    </>
  )
}

function LayerHeader({ report, layer }: { report: EngineeringReport; layer: SolverLayer }) {
  const result = report.layers.find((item) => item.layer === layer)!
  const Icon = layerMeta[layer].icon
  return (
    <header className="engineering-header">
      <div className={`engineering-header__icon engineering-header__icon--${result.state}`}><Icon size={20} /></div>
      <div><span>{result.backend} · confianza {result.confidence}</span><h2>{result.label}</h2><p>{result.summary}</p></div>
    </header>
  )
}

function GeometryLayer({ report }: { report: EngineeringReport }) {
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const cadStatus = useStudioStore((state) => state.cadStatus)
  const cadReport = useStudioStore((state) => state.cadReport)
  const cadError = useStudioStore((state) => state.cadError)
  const findings = [...report.geometry.findings].sort((a, b) => ({ error: 0, warning: 1, info: 2, opportunity: 3 }[a.severity] - { error: 0, warning: 1, info: 2, opportunity: 3 }[b.severity]))
  const exactConflicts = cadReport?.collisions.filter((item) => item.state !== 'clear') ?? []
  const sweepConflicts = cadReport?.sweepCollisions?.filter((item) => item.state !== 'clear') ?? []
  const indeterminateCount = exactConflicts.filter((item) => item.state === 'indeterminate').length
    + sweepConflicts.filter((item) => item.state === 'indeterminate').length
  return (
    <div className="engineering-layer-body">
      <section className="technical-band">
        <div className="technical-band__title"><span>Kernel exacto</span><strong className={`cad-pill cad-pill--${cadStatus}`}>{cadStatus}</strong></div>
        {cadError && <p className="inline-error">{cadError}</p>}
        {cadReport && (
          <div className="technical-summary-grid">
            <div><span>Solidos</span><strong>{cadReport.parts.length}</strong></div>
            <div><span>Invalidos</span><strong>{cadReport.invalidParts.length}</strong></div>
            <div><span>Interferencias</span><strong>{exactConflicts.filter((item) => item.state === 'collision').length + sweepConflicts.filter((item) => item.state === 'collision').length}</strong></div>
            <div><span>Indeterminados</span><strong>{indeterminateCount}</strong></div>
            <div><span>Minimo B-Rep</span><strong>{cadReport.minimumClearanceMm === null ? '–' : `${cadReport.minimumClearanceMm.toFixed(3)} mm`}</strong></div>
          </div>
        )}
        {cadReport && exactConflicts.map((item, index) => (
          <div className={`technical-result technical-result--${item.state}`} key={`${item.first}-${item.second}-${index}`}>
            <span>{item.first} / {item.second}</span>
            <strong>{item.state === 'indeterminate'
              ? 'Sin resolver'
              : item.state === 'collision'
                ? `${(item.intersectionVolumeMm3 ?? 0).toFixed(4)} mm³`
                : `${(item.distanceMm ?? 0).toFixed(3)} mm`}</strong>
          </div>
        ))}
        {cadReport && sweepConflicts.map((item, index) => (
          <div className={`technical-result technical-result--${item.state}`} key={`${item.hand}-${item.obstacle}-${index}`}>
            <span>Barrido 360° · {item.hand} / {item.obstacle}</span><strong>{item.state}</strong>
          </div>
        ))}
        {!cadReport && !cadError && <p className="empty-inline">Ejecuta “Validar CAD” para comprobar sólidos B-Rep y barridos completos.</p>}
      </section>
      <section className="technical-band">
        <div className="technical-band__title"><span>Solver interactivo</span><strong>{findings.length}</strong></div>
        {findings.map((item) => (
          <button
            type="button"
            className={`finding-row finding-row--${item.severity}`}
            key={item.id}
            onClick={() => setSelectedPart(item.culprit ?? item.parts[0])}
          >
            <i />
            <span><strong>{item.title}</strong><small>{item.detail}</small></span>
            {typeof item.clearance === 'number' && <b>{item.clearance >= 0 ? '+' : ''}{item.clearance.toFixed(3)} mm</b>}
          </button>
        ))}
      </section>
    </div>
  )
}

function AssemblyLayer({ report }: { report: EngineeringReport }) {
  return (
    <div className="engineering-layer-body">
      <div className="technical-summary-grid">
        <div><span>Restricciones</span><strong>{report.assembly.constraints.length}</strong></div>
        <div><span>Fallidas</span><strong>{report.assembly.failedConstraints.length}</strong></div>
        <div><span>Sin resolver</span><strong>{report.assembly.unresolvedParts.length}</strong></div>
        <div><span>Error tija</span><strong>{report.assembly.stemAxisError.toFixed(3)} mm</strong></div>
      </div>
      <section className="technical-band">
        <div className="technical-band__title"><span>Mates y apoyos</span><strong>{report.assembly.fullyConstrained ? 'Restringido' : 'Con grados de libertad'}</strong></div>
        {report.assembly.constraints.map((constraint) => (
          <div className={`constraint-row ${constraint.satisfied ? 'is-pass' : 'is-fail'}`} key={constraint.id}>
            <StateMark state={constraint.satisfied ? 'pass' : 'fail'} />
            <span><strong>{constraint.name}</strong><small>{constraint.type} · {constraint.sourcePart} → {constraint.targetPart}</small></span>
            <b>{constraint.residual.toFixed(3)} / {constraint.tolerance.toFixed(3)}</b>
          </div>
        ))}
      </section>
      <section className="technical-band">
        <div className="technical-band__title"><span>Grados de libertad</span><strong>DOF</strong></div>
        {report.assembly.freedoms.map((freedom) => (
          <div className="technical-result" key={freedom.part}><span>{partLabels[freedom.part] ?? freedom.part}</span><strong>{freedom.remaining}</strong></div>
        ))}
      </section>
    </div>
  )
}

function KinematicsLayer({ report }: { report: EngineeringReport }) {
  if (!report.geometry.train) return <p className="empty-inline">El calibre de cuarzo se trata como subsistema comercial encapsulado.</p>
  const train = report.geometry.train
  return (
    <div className="engineering-layer-body">
      <div className="technical-summary-grid">
        <div><span>Frecuencia</span><strong>{Math.round(train.calculatedVph).toLocaleString('es-ES')} vph</strong></div>
        <div><span>Centro / cuarta</span><strong>{train.centerToFourthRatio.toFixed(3)}:1</strong></div>
        <div><span>Reserva</span><strong>{train.powerReserveHours.toFixed(1)} h</strong></div>
        <div><span>Borde mínimo</span><strong>{train.minimumEdgeClearance.toFixed(3)} mm</strong></div>
      </div>
      <section className="technical-band">
        <div className="technical-band__title"><span>Pares de engrane</span><strong>Perfil por par</strong></div>
        {train.pairs.map((pair) => (
          <div className={`gear-pair-row ${Math.abs(pair.distanceError) <= pair.tolerance && (pair.profile === 'cycloidal' || (pair.contactRatio ?? 0) >= 1) ? 'is-pass' : 'is-fail'}`} key={pair.id}>
            <span><strong>{pair.driver} → {pair.driven}</strong><small>Centro {pair.actualDistance.toFixed(3)} mm · nominal {pair.targetDistance.toFixed(3)} mm</small></span>
            <div>
              <b>{pair.profile === 'cycloidal' ? `CIC ${pair.approachBeforeCenterDeg.toFixed(1)}°` : `ε ${(pair.contactRatio ?? 0).toFixed(2)}`}</b>
              <small>{pair.distanceError >= 0 ? '+' : ''}{pair.distanceError.toFixed(3)} mm</small>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function DynamicsLayer({ report }: { report: EngineeringReport }) {
  const metrics = report.dynamics
  const escapement = report.escapement
  const automatic = report.automaticWinding
  if (!metrics) return <p className="empty-inline">La dinámica editable se activa con un movimiento mecánico.</p>
  return (
    <div className="engineering-layer-body">
      <div className="technical-summary-grid">
        <div><span>Oscilador</span><strong>{Math.round(metrics.naturalVph).toLocaleString('es-ES')} vph</strong></div>
        <div><span>Error frecuencia</span><strong>{metrics.frequencyErrorPercent.toFixed(2)}%</strong></div>
        <div><span>Margen energía</span><strong>{metrics.minimumEnergyMargin.toFixed(2)}x</strong></div>
        <div><span>Amplitud final</span><strong>{metrics.predictedEndAmplitudeDeg.toFixed(0)}°</strong></div>
        <div><span>Eficiencia tren</span><strong>{(metrics.trainEfficiency * 100).toFixed(1)}%</strong></div>
        <div><span>Reserva</span><strong>{metrics.powerReserveHours.toFixed(1)} h</strong></div>
      </div>
      {escapement && (
        <section className="technical-band">
          <div className="technical-band__title"><span>Ciclo de escape</span><strong>{escapement.geometrySupport === 'parametric' ? 'Paramétrico' : 'Parcial'}</strong></div>
          <div className="escapement-summary">
            <div><span>Cadencia</span><strong>{escapement.beatsPerSecond.toFixed(2)} Hz</strong></div>
            <div><span>Rueda</span><strong>{escapement.escapeWheelRpm.toFixed(2)} rpm</strong></div>
            <div><span>Avance</span><strong>{escapement.escapeToothAdvanceDeg.toFixed(2)}°</strong></div>
            <div><span>Seguridad</span><strong>{escapement.safetyArcDeg.toFixed(2)}°</strong></div>
          </div>
          <div className="escapement-cycle" aria-label="Fases del ciclo de escape">
            {escapement.phases.map((phase) => (
              <i key={phase.id} className={`escapement-cycle__${phase.id}`} style={{ flexGrow: phase.share }} title={`${phase.label} ${(phase.share * 100).toFixed(1)}%`}><span>{phase.label}</span></i>
            ))}
          </div>
          {escapement.issues.map((issue) => <div className={`technical-message technical-message--${issue.severity}`} key={issue.id}><strong>{issue.title}</strong><p>{issue.detail}</p></div>)}
        </section>
      )}
      {automatic && (
        <section className="technical-band">
          <div className="technical-band__title"><span>Remontuar automatico</span><strong>{automatic.selfSustaining ? 'Autosuficiente' : 'Deficit'}</strong></div>
          <div className="escapement-summary">
            <div><span>Margen de par</span><strong>{automatic.torqueMargin.toFixed(2)}x</strong></div>
            <div><span>Carga activa</span><strong>{automatic.barrelTurnsPerActiveHour.toFixed(2)} v/h</strong></div>
            <div><span>Tiempo a plena carga</span><strong>{automatic.activeHoursToFullWind.toFixed(1)} h</strong></div>
            <div><span>Balance diario</span><strong>{automatic.dailyBalanceTurns >= 0 ? '+' : ''}{automatic.dailyBalanceTurns.toFixed(2)} v</strong></div>
          </div>
          {automatic.issues.map((issue) => <div className={`technical-message technical-message--${issue.severity}`} key={issue.id}><strong>{issue.title}</strong><p>{issue.detail}</p></div>)}
        </section>
      )}
      <section className="technical-band">
        <div className="technical-band__title"><span>Balance energético</span><strong>{metrics.confidence}</strong></div>
        {metrics.issues.length === 0 && <p className="empty-inline">Sin fallos nominales en el modelo dinámico.</p>}
        {metrics.issues.map((issue) => <div className={`technical-message technical-message--${issue.severity}`} key={issue.id}><strong>{issue.title}</strong><p>{issue.detail}</p></div>)}
      </section>
      <section className="technical-band">
        <div className="technical-band__title"><span>Curva del muelle</span><strong>{metrics.torqueCurve.length} puntos</strong></div>
        <div className="torque-chart" aria-label="Curva de par del muelle">
          {metrics.torqueCurve.map((point, index) => {
            const maximum = Math.max(...metrics.torqueCurve.map((item) => item.impulseEnergyMicroJ), 1e-9)
            return <i key={index} style={{ height: `${Math.max(3, point.impulseEnergyMicroJ / maximum * 100)}%` }} title={`${point.barrelTurnsRemaining.toFixed(2)} vueltas · ${point.impulseEnergyMicroJ.toFixed(3)} µJ`} />
          })}
        </div>
      </section>
    </div>
  )
}

function TolerancesLayer({ report }: { report: EngineeringReport }) {
  const project = useStudioStore((state) => state.project)
  const setToleranceMode = useStudioStore((state) => state.setToleranceMode)
  const setMonteCarloSamples = useStudioStore((state) => state.setMonteCarloSamples)
  const resultLabel = project.engineering.toleranceMode === 'monte_carlo'
    ? `${(report.tolerances.yieldProbability * 100).toFixed(1)}%`
    : project.engineering.toleranceMode === 'worst_case'
      ? report.tolerances.worstCasePass ? 'Cumple' : 'Revisar'
      : report.tolerances.nominalPass ? 'Cumple' : 'No cumple'
  const resultTitle = project.engineering.toleranceMode === 'monte_carlo'
    ? 'Rendimiento estadístico estimado'
    : project.engineering.toleranceMode === 'worst_case'
      ? 'Resultado de peor caso'
      : 'Resultado nominal'
  return (
    <div className="engineering-layer-body">
      <Segmented
        label="Método"
        value={project.engineering.toleranceMode}
        options={[{ value: 'nominal', label: 'Nominal' }, { value: 'worst_case', label: 'Peor caso' }, { value: 'monte_carlo', label: 'Monte Carlo' }]}
        onChange={setToleranceMode}
      />
      {project.engineering.toleranceMode === 'monte_carlo' && (
        <NumberField
          label="Muestras"
          dimension={{ value: project.engineering.monteCarloSamples, minus: 0, plus: 0, unit: 'count', quality: 'designed', source: 'Configuración de solver' }}
          min={200}
          max={20000}
          step={100}
          onChange={setMonteCarloSamples}
        />
      )}
      <div className="yield-band">
        <CircleGauge size={22} />
        <div><span>{resultTitle}</span><strong>{resultLabel}</strong></div>
        <small>Peor margen {report.tolerances.worstCaseMinimum.toFixed(3)} mm</small>
      </div>
      <section className="technical-band">
        <div className="technical-band__title"><span>Escenarios y márgenes</span><strong>{report.tolerances.samples} {project.engineering.toleranceMode === 'monte_carlo' ? 'muestras' : 'estados'}</strong></div>
        {report.tolerances.metrics.map((metric) => (
          <div className={`tolerance-row ${metric.failureProbability > 0 ? 'has-failure' : ''}`} key={metric.id}>
            <span><strong>{metric.label}</strong><small>P01 {metric.p01.toFixed(3)} · P50 {metric.p50.toFixed(3)} · P99 {metric.p99.toFixed(3)}</small></span>
            <b>{(metric.failureProbability * 100).toFixed(1)}%</b>
          </div>
        ))}
      </section>
      <section className="technical-band">
        <div className="technical-band__title"><span>Sensibilidad del margen</span><strong>Influencia</strong></div>
        {report.tolerances.contributors.map((item) => (
          <div className="sensitivity-row" key={item.id}>
            <span>{item.label}</span><i><b style={{ width: `${item.influence * 100}%` }} /></i><strong>{item.correlation.toFixed(2)}</strong>
          </div>
        ))}
      </section>
    </div>
  )
}

export function ManufacturingSidebar() {
  const project = useStudioStore((state) => state.project)
  const report = useMemo(() => getInteractiveEngineeringReport(project), [project])
  return (
    <>
      <div className="sidebar-heading"><span>Piezas fabricables</span><strong>{report.manufacturing.printableParts.length}</strong></div>
      <div className="manufacturing-part-list">
        {report.manufacturing.printableParts.map((part) => {
          const blocked = report.manufacturing.blockedParts.includes(part)
          return <div key={part} className={blocked ? 'is-blocked' : 'is-ready'}><FileBox size={16} /><span>{partLabels[part] ?? part}</span>{blocked ? <TriangleAlert size={14} /> : <Check size={14} />}</div>
        })}
      </div>
      <div className="sidebar-reference"><Factory size={15} /><span>{report.manufacturing.profile.name}</span></div>
    </>
  )
}

export function ManufacturingInspector() {
  const project = useStudioStore((state) => state.project)
  const setManufacturingProcess = useStudioStore((state) => state.setManufacturingProcess)
  const setPrinterProfile = useStudioStore((state) => state.setPrinterProfile)
  const exportCad = useStudioStore((state) => state.exportCad)
  const runExactAnalysis = useStudioStore((state) => state.runExactAnalysis)
  const cancelCad = useStudioStore((state) => state.cancelCad)
  const cadStatus = useStudioStore((state) => state.cadStatus)
  const cadArtifacts = useStudioStore((state) => state.cadArtifacts)
  const nativeInfo = useStudioStore((state) => state.nativeInfo)
  const report = useMemo(() => getInteractiveEngineeringReport(project), [project])
  const compatibleProfiles = MANUFACTURING_PROFILES.filter((profile) => project.engineering.manufacturingProcess === 'none' || profile.process === project.engineering.manufacturingProcess)
  return (
    <aside className="studio-inspector manufacturing-inspector">
      <header className="inspector-header"><div><span>Preparación de salida</span><h2>Fabricación</h2></div><i className={`inspector-state ${report.manufacturing.readyForExport ? 'inspector-state--ok' : 'inspector-state--warning'}`}>{report.manufacturing.readyForExport ? 'LISTO' : report.manufacturing.blockedParts.length}</i></header>
      <div className="studio-inspector__body">
        <section className="technical-band technical-band--flush">
          <Segmented
            label="Proceso"
            value={project.engineering.manufacturingProcess}
            options={[{ value: 'none', label: 'Sin definir' }, { value: 'resin', label: 'Resina' }, { value: 'fdm', label: 'FDM' }, { value: 'cnc', label: 'CNC' }, { value: 'laser', label: 'Láser' }]}
            onChange={setManufacturingProcess}
          />
          <label className="select-field"><span>Perfil de máquina</span><select disabled={!report.manufacturing.processDefined} value={project.engineering.printerProfileId ?? ''} onChange={(event) => setPrinterProfile(event.target.value || null)}><option value="">Selecciona primero un proceso</option>{compatibleProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
          <div className="process-spec-grid">
            <div><span>XY</span><strong>{report.manufacturing.profile.xyResolution} mm</strong></div>
            <div><span>Z</span><strong>{report.manufacturing.profile.zResolution} mm</strong></div>
            <div><span>Pared</span><strong>{report.manufacturing.profile.minimumWall} mm</strong></div>
            <div><span>Holgura</span><strong>{report.manufacturing.profile.runningClearance} mm</strong></div>
          </div>
        </section>
        <section className="technical-band technical-band--flush">
          <div className="technical-band__title"><span>Design for manufacturing</span><strong>{report.manufacturing.checks.length}</strong></div>
          {report.manufacturing.checks.map((check) => <div className={`technical-message technical-message--${check.severity}`} key={check.id}><strong>{check.title}</strong><p>{check.detail}</p></div>)}
        </section>
        <section className="export-panel">
          <header><PackageCheck size={18} /><div><strong>Kernel de exportación</strong><span>{nativeInfo ? `${nativeInfo.platform} · OpenCascade` : 'Requiere Watch Prototype Lab Desktop'}</span></div></header>
          <button type="button" className={cadStatus === 'running' ? 'full-action is-cancel' : 'full-action'} disabled={!nativeInfo} onClick={() => void (cadStatus === 'running' ? cancelCad() : runExactAnalysis())}>{cadStatus === 'running' ? <CircleStop size={15} /> : <ScanSearch size={15} />}{cadStatus === 'running' ? 'Cancelar trabajo CAD' : 'Validar sólidos antes de exportar'}</button>
          <div className="export-actions">
            <button type="button" disabled={!nativeInfo || cadStatus === 'running' || !report.manufacturing.readyForExport} onClick={() => void exportCad(['step'])}><Download size={15} /><span>STEP</span></button>
            <button type="button" disabled={!nativeInfo || cadStatus === 'running' || !report.manufacturing.readyForExport} onClick={() => void exportCad(['stl'])}><Download size={15} /><span>STL</span></button>
            <button type="button" disabled={!nativeInfo || cadStatus === 'running' || !report.manufacturing.readyForExport} onClick={() => void exportCad(['3mf'])}><Download size={15} /><span>3MF</span></button>
            <button type="button" disabled={!nativeInfo || cadStatus === 'running' || !report.manufacturing.readyForExport} onClick={() => void exportCad(['glb'])}><Download size={15} /><span>GLB</span></button>
          </div>
          <button type="button" className="primary-action export-all" disabled={!nativeInfo || cadStatus === 'running' || !report.manufacturing.readyForExport} onClick={() => void exportCad(['step', 'stl', '3mf', 'glb'])}><Factory size={15} />Exportar paquete completo</button>
          {!report.manufacturing.processDefined && <p className="export-blocked">Define proceso y perfil para habilitar exportaciones.</p>}
          {cadArtifacts.length > 0 && <p className="export-success">{cadArtifacts.length} archivos generados en la carpeta elegida.</p>}
        </section>
      </div>
    </aside>
  )
}

export function EngineeringInspector() {
  const project = useStudioStore((state) => state.project)
  const layer = useStudioStore((state) => state.analysisLayer)
  const report = useMemo(() => getInteractiveEngineeringReport(project), [project])
  return (
    <aside className="studio-inspector engineering-inspector">
      <LayerHeader report={report} layer={layer} />
      <div className="studio-inspector__body">
        {layer === 'geometry' && <GeometryLayer report={report} />}
        {layer === 'assembly' && <AssemblyLayer report={report} />}
        {layer === 'kinematics' && <KinematicsLayer report={report} />}
        {layer === 'dynamics' && <DynamicsLayer report={report} />}
        {layer === 'tolerances' && <TolerancesLayer report={report} />}
        {layer === 'manufacturing' && <ManufacturingLayer report={report} />}
        <a
          className="engineering-academy-link"
          href={`#/learning/engineering?project=${encodeURIComponent(project.id)}&name=${encodeURIComponent(project.name)}`}
        >
          <BookOpenCheck size={18} />
          <span><strong>Abrir laboratorio de ingeniería</strong><small>Estudiar fórmulas, unidades y límites con un cuaderno separado para este proyecto.</small></span>
        </a>
      </div>
    </aside>
  )
}

function ManufacturingLayer({ report }: { report: EngineeringReport }) {
  return (
    <div className="engineering-layer-body">
      <div className="technical-summary-grid">
        <div><span>Perfil</span><strong>{report.manufacturing.profile.name}</strong></div>
        <div><span>Fabricables</span><strong>{report.manufacturing.printableParts.length}</strong></div>
        <div><span>Bloqueadas</span><strong>{report.manufacturing.blockedParts.length}</strong></div>
        <div><span>CAD exacto</span><strong>{report.manufacturing.exactCadRequired ? 'Requerido' : 'Completo'}</strong></div>
      </div>
      <section className="technical-band">
        {report.manufacturing.checks.map((check) => <div className={`technical-message technical-message--${check.severity}`} key={check.id}><strong>{check.title}</strong><p>{check.detail}</p></div>)}
      </section>
    </div>
  )
}
