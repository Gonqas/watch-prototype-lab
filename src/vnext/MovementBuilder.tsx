import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Database,
  Dna,
  PackagePlus,
  Ruler,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import {
  analyzeComponentCompatibility,
  mechanicalComponentLabels,
  mechanicalComponentOrder,
  type MovementComponentPreset,
} from '../core/componentCompatibility'
import type { MechanicalComponentId, WatchPartId } from './model'
import { useStudioStore } from './store'

function componentForPart(part: WatchPartId): MechanicalComponentId | null {
  if (part === 'jewel') return 'jewel-set'
  return mechanicalComponentOrder.includes(part as MechanicalComponentId) ? part as MechanicalComponentId : null
}

function partForComponent(component: MechanicalComponentId): WatchPartId {
  return component === 'jewel-set' ? 'jewel' : component as WatchPartId
}

function stateLabel(state: 'compatible' | 'conditional' | 'incompatible'): string {
  if (state === 'compatible') return 'Compatible'
  if (state === 'conditional') return 'Ajuste necesario'
  return 'No encaja'
}

export function MovementBuilder() {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const savedParts = useStudioStore((state) => state.savedParts)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  const saveSelectedPartToLibrary = useStudioStore((state) => state.saveSelectedPartToLibrary)
  const analyzeSavedComponent = useStudioStore((state) => state.analyzeSavedComponent)
  const applySavedPart = useStudioStore((state) => state.applySavedPart)
  const updateComponentOrigin = useStudioStore((state) => state.updateComponentOrigin)
  const importStepForComponent = useStudioStore((state) => state.importStepForComponent)
  const nativeInfo = useStudioStore((state) => state.nativeInfo)
  const [inspectedDonor, setInspectedDonor] = useState<string | null>(null)
  const [measurementOpen, setMeasurementOpen] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  if (project.movement.kind !== 'mechanical') return null
  const movement = project.movement
  const required = mechanicalComponentOrder.filter((id) => id !== 'rotor' || movement.architecture === 'automatic')
  const assigned = required.filter((id) => movement.componentOrigins[id])
  const donorCount = assigned.filter((id) => movement.componentOrigins[id]?.kind === 'donor').length
  const progress = Math.round((assigned.length / required.length) * 100)
  const component = componentForPart(selectedPart)
  const donors = savedParts.filter(
    (item): item is MovementComponentPreset => item.kind === 'movement-component' && item.componentType === component,
  )
  const reports = donors.map((donor) => ({ donor, report: analyzeComponentCompatibility(project, donor) }))
  const activeReport = reports.find(({ donor }) => donor.id === inspectedDonor)

  if (!component) {
    return (
      <section className="movement-builder movement-builder--overview" aria-label="Constructor de movimiento">
        <header className="movement-builder__header">
          <div className="movement-builder__mark"><Dna size={17} /></div>
          <div><span>Constructor multicalibre</span><strong>{movement.buildMode === 'scratch' ? 'Montaje desde cero' : movement.buildMode === 'hybrid' ? 'Movimiento hibrido' : 'Arquitectura de referencia'}</strong></div>
          <b>{progress}%</b>
        </header>
        <div className="movement-builder__progress"><i style={{ width: `${progress}%` }} /></div>
        <div className="movement-builder__stats">
          <span><strong>{assigned.length}/{required.length}</strong> conjuntos definidos</span>
          <span><strong>{donorCount}</strong> piezas donantes</span>
        </div>
        <div className="movement-builder__map">
          {required.map((id) => {
            const origin = movement.componentOrigins[id]
            return (
              <button type="button" key={id} onClick={() => setSelectedPart(partForComponent(id))}>
                {origin ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
                <span>{mechanicalComponentLabels[id]}</span>
                <small>{origin ? origin.kind === 'donor' ? 'Donante' : 'Diseñada' : 'Pendiente'}</small>
              </button>
            )
          })}
        </div>
        <p className="movement-builder__hint">Selecciona un conjunto para medirlo, guardarlo como donante o probar piezas de otros calibres con validacion de interfaces.</p>
      </section>
    )
  }

  const origin = movement.componentOrigins[component]
  return (
    <section className="movement-builder" aria-label={`Constructor de ${mechanicalComponentLabels[component]}`}>
      <header className="movement-builder__header">
        <div className="movement-builder__mark"><Dna size={17} /></div>
        <div><span>Componente activo</span><strong>{mechanicalComponentLabels[component]}</strong></div>
        {origin ? <CheckCircle2 className="movement-builder__complete" size={18} /> : <CircleDashed size={18} />}
      </header>

      <div className="component-origin">
        <div><Database size={14} /><span>{origin ? origin.kind === 'donor' ? 'Pieza donante asignada' : 'Geometria diseñada' : 'Sin pieza asignada'}</span></div>
        <strong>{origin?.sourceMovement ?? origin?.reference ?? 'Pendiente de seleccionar o medir'}</strong>
        {origin?.notes && <small>{origin.notes}</small>}
      </div>

      <button type="button" className="movement-builder__measure" aria-expanded={measurementOpen} onClick={() => setMeasurementOpen((value) => !value)}>
        <Ruler size={14} />Documentar pieza donante real
      </button>
      {measurementOpen && (
        <div className="measurement-sheet">
          <header><ClipboardCheck size={15} /><span><strong>Ficha de metrologia</strong><small>Vincula las cotas actuales a la pieza fisica medida.</small></span></header>
          <label><span>Fabricante</span><input value={origin?.manufacturer ?? ''} placeholder="ETA, Seiko, calibre sin marca…" onChange={(event) => updateComponentOrigin(component, { kind: 'measured', manufacturer: event.target.value })} /></label>
          <label><span>Calibre / reloj origen</span><input value={origin?.sourceMovement ?? ''} placeholder="Calibre y variante" onChange={(event) => updateComponentOrigin(component, { kind: 'measured', sourceMovement: event.target.value })} /></label>
          <label><span>Referencia de pieza</span><input value={origin?.reference ?? ''} placeholder="Código, lote o posición" onChange={(event) => updateComponentOrigin(component, { kind: 'measured', reference: event.target.value })} /></label>
          <label><span>Confianza metrologica</span><select value={origin?.reliability ?? 'medium'} onChange={(event) => updateComponentOrigin(component, { kind: 'measured', reliability: event.target.value as 'high' | 'medium' | 'low' | 'pending' })}><option value="high">Alta · instrumento calibrado</option><option value="medium">Media · calibre/micrometro</option><option value="low">Baja · medida aproximada</option><option value="pending">Pendiente de medir</option></select></label>
          <label><span>Notas de desmontaje</span><textarea value={origin?.notes ?? ''} placeholder="Orientacion, desgaste, ajustes, fotos o advertencias…" onChange={(event) => updateComponentOrigin(component, { kind: 'measured', notes: event.target.value })} /></label>
          <button
            type="button"
            className="measurement-sheet__import"
            disabled={!nativeInfo}
            title={nativeInfo ? 'Medir envolvente y validar solido con OpenCascade' : 'Disponible en Watch Prototype Lab Desktop'}
            onClick={async () => {
              try {
                const result = await importStepForComponent(component)
                if (result) setImportMessage(`${result.fileName} · ${result.size.map((value) => value.toFixed(2)).join(' × ')} mm`)
              } catch (error) {
                setImportMessage(error instanceof Error ? error.message : String(error))
              }
            }}
          ><Upload size={14} />Importar geometria STEP</button>
          {importMessage && <p className="measurement-sheet__result">{importMessage}</p>}
        </div>
      )}

      <button type="button" className="movement-builder__save" onClick={saveSelectedPartToLibrary}>
        <PackagePlus size={14} />Guardar esta pieza como donante
      </button>

      <div className="donor-bank__heading"><span>Banco compatible</span><b>{donors.length}</b></div>
      {reports.length === 0 ? (
        <div className="donor-bank__empty"><Database size={17} /><span>Guarda este conjunto desde otro proyecto y aparecera aqui con su analisis.</span></div>
      ) : (
        <div className="donor-bank">
          {reports.map(({ donor, report }) => (
            <button
              type="button"
              key={donor.id}
              className={`donor-card donor-card--${report.state} ${inspectedDonor === donor.id ? 'is-active' : ''}`}
              onClick={() => { setInspectedDonor(donor.id); analyzeSavedComponent(donor.id) }}
            >
              <span className="donor-card__score">{report.score}</span>
              <span><strong>{donor.origin.sourceMovement ?? donor.sourceProjectName}</strong><small>{stateLabel(report.state)} · {donor.origin.reliability}</small></span>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      )}

      {activeReport && (
        <div className={`compatibility-report compatibility-report--${activeReport.report.state}`}>
          <header>
            {activeReport.report.state === 'compatible' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
            <span><strong>{stateLabel(activeReport.report.state)}</strong><small>{activeReport.report.score}/100 · {activeReport.report.checksRun} comprobaciones</small></span>
          </header>
          <ul>
            {activeReport.report.issues.slice(0, 4).map((issue) => (
              <li key={issue.id} className={`is-${issue.severity}`}><Check size={12} /><span><strong>{issue.title}</strong><small>{issue.detail}</small></span></li>
            ))}
          </ul>
          <button
            type="button"
            className={activeReport.report.state === 'incompatible' ? 'danger-action' : 'primary-action'}
            onClick={() => applySavedPart(activeReport.donor.id, activeReport.report.state === 'incompatible')}
          >
            {activeReport.report.state === 'incompatible' ? 'Forzar bajo responsabilidad' : 'Asignar al movimiento'}
          </button>
        </div>
      )}
    </section>
  )
}
