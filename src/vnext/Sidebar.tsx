import { useMemo } from 'react'
import {
  Aperture,
  Battery,
  CircleDot,
  Disc3,
  Gauge,
  Gem,
  Grid2X2,
  Layers3,
  MoveRight,
  PackageOpen,
  Settings2,
  ShieldCheck,
  Watch,
} from 'lucide-react'
import { evaluateProject } from './engine'
import { EngineeringSidebar, ManufacturingSidebar } from './EngineeringPanels'
import type { FindingSeverity, WatchPartId } from './model'
import { useStudioStore } from './store'

const assemblyParts: Array<{
  id: WatchPartId
  label: string
  group: string
  icon: typeof Watch
}> = [
  { id: 'case', label: 'Caja', group: 'Estructura', icon: Watch },
  { id: 'back', label: 'Fondo', group: 'Estructura', icon: Disc3 },
  { id: 'bezel', label: 'Bisel', group: 'Estructura', icon: CircleDot },
  { id: 'rehaut', label: 'Rehaut', group: 'Interfaz', icon: Disc3 },
  { id: 'movement', label: 'Movimiento', group: 'Mecanica', icon: Settings2 },
  { id: 'dial', label: 'Dial', group: 'Interfaz', icon: Aperture },
  { id: 'dialGraphics', label: 'Indices y grafica', group: 'Interfaz', icon: Grid2X2 },
  { id: 'hourHand', label: 'Horaria', group: 'Agujas', icon: Gauge },
  { id: 'minuteHand', label: 'Minutera', group: 'Agujas', icon: Gauge },
  { id: 'secondHand', label: 'Segundero', group: 'Agujas', icon: Gauge },
  { id: 'crystal', label: 'Cristal', group: 'Cierre', icon: Gem },
  { id: 'stem', label: 'Tija', group: 'Remontuar', icon: MoveRight },
  { id: 'crown', label: 'Corona', group: 'Remontuar', icon: CircleDot },
  { id: 'strap', label: 'Correa / brazalete', group: 'Exterior', icon: Layers3 },
  { id: 'clasp', label: 'Cierre', group: 'Exterior', icon: ShieldCheck },
]

const movementParts: Array<{ id: WatchPartId; label: string; icon: typeof Watch }> = [
  { id: 'plate', label: 'Platina', icon: Disc3 },
  { id: 'barrel', label: 'Barrilete', icon: Battery },
  { id: 'center', label: 'Centro', icon: Settings2 },
  { id: 'third', label: 'Tercera', icon: Settings2 },
  { id: 'fourth', label: 'Cuarta / segundos', icon: Settings2 },
  { id: 'escape', label: 'Escape', icon: Settings2 },
  { id: 'pallet', label: 'Ancora', icon: MoveRight },
  { id: 'balance', label: 'Volante y espiral', icon: Aperture },
  { id: 'mainspring', label: 'Muelle real', icon: Battery },
  { id: 'jewel', label: 'Rubies y pivotes', icon: Gem },
  { id: 'keyless', label: 'Remontuar', icon: CircleDot },
  { id: 'bridge', label: 'Puentes', icon: Layers3 },
]

function severityForPart(
  part: WatchPartId,
  findings: ReturnType<typeof evaluateProject>['findings'],
): FindingSeverity | 'ok' {
  if (findings.some((item) => item.parts.includes(part) && item.severity === 'error')) return 'error'
  if (findings.some((item) => item.parts.includes(part) && item.severity === 'warning')) return 'warning'
  if (findings.some((item) => item.parts.includes(part) && item.severity === 'opportunity')) return 'opportunity'
  if (findings.some((item) => item.parts.includes(part) && item.reliability === 'pending')) return 'info'
  return 'ok'
}

function PartButton({
  id,
  label,
  icon: Icon,
  severity,
}: {
  id: WatchPartId
  label: string
  icon: typeof Watch
  severity: FindingSeverity | 'ok'
}) {
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const setSelectedPart = useStudioStore((state) => state.setSelectedPart)
  return (
    <button
      type="button"
      className={`part-row ${selectedPart === id ? 'is-active' : ''}`}
      onClick={() => setSelectedPart(id)}
    >
      <Icon size={17} strokeWidth={1.8} />
      <span>{label}</span>
      <i className={`part-status part-status--${severity}`} aria-label={severity} />
    </button>
  )
}

function AssemblyParts() {
  const project = useStudioStore((state) => state.project)
  const evaluation = useMemo(() => evaluateProject(project), [project])
  const groups = [...new Set(assemblyParts.map((part) => part.group))]
  return (
    <>
      <div className="sidebar-heading">
        <span>Componentes</span>
        <strong>{assemblyParts.length}</strong>
      </div>
      <div className="part-tree">
        {groups.map((group) => (
          <section key={group}>
            <h3>{group}</h3>
            {assemblyParts
              .filter((part) => part.group === group)
              .filter((part) => part.id !== 'secondHand' || project.hands.second.enabled)
              .map((part) => (
                <PartButton
                  key={part.id}
                  {...part}
                  severity={severityForPart(part.id, evaluation.findings)}
                />
              ))}
          </section>
        ))}
      </div>
    </>
  )
}

function MovementParts() {
  const project = useStudioStore((state) => state.project)
  const evaluation = useMemo(() => evaluateProject(project), [project])
  const replaceWithMechanical = useStudioStore((state) => state.replaceWithMechanical)
  if (project.movement.kind === 'quartz') {
    return (
      <div className="empty-workspace">
        <PackageOpen size={28} />
        <strong>{project.movement.name}</strong>
        <span>Cuarzo integrado</span>
        <button type="button" className="primary-action" onClick={replaceWithMechanical}>
          Crear movimiento mecanico
        </button>
      </div>
    )
  }
  const visibleMovementParts = project.movement.architecture === 'automatic'
    ? [...movementParts, { id: 'rotor' as const, label: 'Rotor automatico', icon: Disc3 }]
    : movementParts
  return (
    <>
      <div className="movement-build-summary">
        <span>{project.movement.buildMode === 'scratch' ? 'DESDE CERO' : project.movement.buildMode === 'hybrid' ? 'HIBRIDO' : 'REFERENCIA'}</span>
        <strong>{Object.keys(project.movement.componentOrigins).length} conjuntos definidos</strong>
      </div>
      <div className="sidebar-heading">
        <span>Arquitectura</span>
        <strong>{visibleMovementParts.length + 1}</strong>
      </div>
      <div className="part-tree part-tree--movement">
        <section>
          <h3>Movimiento</h3>
          <PartButton
            id="movement"
            label={project.movement.name}
            icon={Watch}
            severity={severityForPart('movement', evaluation.findings)}
          />
          {visibleMovementParts.map((part) => (
            <PartButton
              key={part.id}
              {...part}
              severity={severityForPart(part.id, evaluation.findings)}
            />
          ))}
        </section>
      </div>
      <div className="sidebar-reference">
        <ShieldCheck size={15} />
        <span>Daniels · tren y plantilla</span>
      </div>
    </>
  )
}

export function StudioSidebar() {
  const workspace = useStudioStore((state) => state.workspace)
  return (
    <aside className={`studio-sidebar studio-sidebar--${workspace}`}>
      {(workspace === 'assembly' || workspace === 'parts') && <AssemblyParts />}
      {workspace === 'movement' && <MovementParts />}
      {workspace === 'analysis' && <EngineeringSidebar />}
      {workspace === 'manufacturing' && <ManufacturingSidebar />}
    </aside>
  )
}
