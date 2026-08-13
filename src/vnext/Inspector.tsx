import { useMemo } from 'react'
import {
  CirclePlus,
  Minus,
  RotateCcw,
  Square,
  Trash2,
} from 'lucide-react'
import { NumberField, Segmented, SourceBadge, Toggle, InspectorSection, ColorSwatches, Metric } from './Controls'
import { EngineeringInspector, ManufacturingInspector } from './EngineeringPanels'
import { ExteriorInspector, PresentationInspector } from './AppearanceInspector'
import { MovementBuilder } from './MovementBuilder'
import { evaluateProject } from './engine'
import { type Dimension, type MechanicalArborId, type WatchPartId } from './model'
import { useStudioStore } from './store'

const partLabels: Record<WatchPartId, string> = {
  case: 'Caja',
  back: 'Fondo',
  bezel: 'Bisel',
  rehaut: 'Rehaut',
  strap: 'Correa o brazalete',
  clasp: 'Cierre',
  springBar: 'Pasadores',
  dialGraphics: 'Indices y grafica',
  movement: 'Movimiento',
  plate: 'Platina',
  bridge: 'Puentes',
  barrel: 'Barrilete',
  center: 'Rueda de centro',
  third: 'Tercera rueda',
  fourth: 'Cuarta rueda',
  escape: 'Escape',
  balance: 'Volante y espiral',
  pallet: 'Ancora',
  hairspring: 'Espiral',
  mainspring: 'Muelle real',
  jewel: 'Rubi',
  keyless: 'Puesta en hora',
  rotor: 'Rotor automatico',
  dial: 'Dial',
  hourHand: 'Aguja horaria',
  minuteHand: 'Aguja minutera',
  secondHand: 'Segundero',
  crystal: 'Cristal',
  stem: 'Tija',
  crown: 'Corona',
  holder: 'Aro de movimiento',
  gasket: 'Junta',
}

function InspectorHeader({ part }: { part: WatchPartId }) {
  const project = useStudioStore((state) => state.project)
  const evaluation = useMemo(() => evaluateProject(project), [project])
  const relevant = evaluation.findings.filter((item) => item.parts.includes(part))
  const state = relevant.some((item) => item.severity === 'error')
    ? 'error'
    : relevant.some((item) => item.severity === 'warning')
      ? 'warning'
      : 'ok'
  return (
    <header className="inspector-header">
      <div>
        <span>Inspector</span>
        <h2>{partLabels[part]}</h2>
      </div>
      <i className={`inspector-state inspector-state--${state}`}>{state === 'ok' ? 'OK' : relevant.length}</i>
    </header>
  )
}

function AssemblyClearances() {
  const project = useStudioStore((state) => state.project)
  const updateAssembly = useStudioStore((state) => state.updateAssembly)
  return (
    <InspectorSection title="Planos de montaje" defaultOpen={false}>
      <NumberField
        label="Movimiento / fondo"
        dimension={project.assembly.movementBackClearance}
        min={-1}
        max={2}
        step={0.01}
        onChange={(value) => updateAssembly('movementBackClearance', value)}
      />
      <NumberField
        label="Movimiento / dial"
        dimension={project.assembly.dialMovementGap}
        min={-1}
        max={2}
        step={0.01}
        onChange={(value) => updateAssembly('dialMovementGap', value)}
      />
      <NumberField
        label="Margen dinamico"
        dimension={project.assembly.runningClearance}
        min={0}
        max={0.5}
        step={0.01}
        onChange={(value) => updateAssembly('runningClearance', value)}
      />
    </InspectorSection>
  )
}

function CaseInspector() {
  const project = useStudioStore((state) => state.project)
  const updateCase = useStudioStore((state) => state.updateCase)
  const setCaseShape = useStudioStore((state) => state.setCaseShape)
  const setCaseMaterial = useStudioStore((state) => state.setCaseMaterial)
  return (
    <>
      <InspectorSection title="Geometria exterior">
        <Segmented
          label="Forma"
          value={project.case.shape}
          options={[
            { value: 'round', label: 'Redonda' },
            { value: 'cushion', label: 'Cushion' },
            { value: 'tonneau', label: 'Tonneau' },
            { value: 'rectangular', label: 'Recta' },
          ]}
          onChange={setCaseShape}
        />
        <Segmented
          label="Material"
          value={project.case.material}
          options={[
            { value: 'steel', label: 'Acero' },
            { value: 'titanium', label: 'Titanio' },
            { value: 'black-pvd', label: 'PVD' },
            { value: 'brass', label: 'Laton' },
          ]}
          onChange={setCaseMaterial}
        />
        <NumberField label="Diametro exterior" dimension={project.case.outerDiameter} min={24} max={55} step={0.1} onChange={(value) => updateCase('outerDiameter', value)} />
        <NumberField label="Altura total" dimension={project.case.totalHeight} min={4} max={24} step={0.05} onChange={(value) => updateCase('totalHeight', value)} />
        <NumberField label="Pared minima" dimension={project.case.wallThickness} min={0.4} max={6} step={0.05} onChange={(value) => updateCase('wallThickness', value)} />
      </InspectorSection>
      <InspectorSection title="Asas y correa" defaultOpen={false}>
        <NumberField label="Ancho entre asas" dimension={project.case.lugSpacing} min={8} max={30} step={0.1} onChange={(value) => updateCase('lugSpacing', value)} />
        <NumberField label="Ancho de asa" dimension={project.case.lugWidth} min={1} max={7} step={0.05} onChange={(value) => updateCase('lugWidth', value)} />
        <NumberField label="Longitud de asa" dimension={project.case.lugLength} min={1} max={12} step={0.1} onChange={(value) => updateCase('lugLength', value)} />
      </InspectorSection>
      <InspectorSection title="Volumen interior">
        <NumberField label="Diametro interior" dimension={project.case.innerDiameter} min={14} max={48} step={0.05} onChange={(value) => updateCase('innerDiameter', value)} />
        <NumberField label="Altura interior util" dimension={project.case.usableInteriorHeight} min={2} max={20} step={0.05} onChange={(value) => updateCase('usableInteriorHeight', value)} />
        <NumberField label="Grosor del fondo" dimension={project.case.backThickness} min={0.3} max={5} step={0.05} onChange={(value) => updateCase('backThickness', value)} />
        <NumberField label="Asiento de dial" dimension={project.case.dialSeatDiameter} min={12} max={46} step={0.05} onChange={(value) => updateCase('dialSeatDiameter', value)} />
        <NumberField label="Asiento de cristal" dimension={project.case.crystalSeatDiameter} min={12} max={50} step={0.05} onChange={(value) => updateCase('crystalSeatDiameter', value)} />
      </InspectorSection>
      <InspectorSection title="Corona y tubo" defaultOpen={false}>
        <NumberField label="Altura eje de tija" dimension={project.case.stemAxisZ} min={0.5} max={12} step={0.01} onChange={(value) => updateCase('stemAxisZ', value)} />
        <NumberField label="Distancia a corona" dimension={project.case.crownDistance} min={8} max={35} step={0.05} onChange={(value) => updateCase('crownDistance', value)} />
        <NumberField label="Diametro corona" dimension={project.case.crownDiameter} min={2} max={12} step={0.05} onChange={(value) => updateCase('crownDiameter', value)} />
        <NumberField label="Diametro tubo" dimension={project.case.crownTubeDiameter} min={0.5} max={5} step={0.01} onChange={(value) => updateCase('crownTubeDiameter', value)} />
      </InspectorSection>
      <SourceBadge dimension={project.case.innerDiameter} />
      <AssemblyClearances />
    </>
  )
}

function CrystalInspector() {
  const project = useStudioStore((state) => state.project)
  const updateCrystal = useStudioStore((state) => state.updateCrystal)
  const setCrystalType = useStudioStore((state) => state.setCrystalType)
  return (
    <>
      <InspectorSection title="Perfil">
        <Segmented
          label="Tipo"
          value={project.crystal.type}
          options={[
            { value: 'flat', label: 'Plano' },
            { value: 'domed', label: 'Domed' },
            { value: 'box', label: 'Box' },
          ]}
          onChange={setCrystalType}
        />
        <NumberField label="Diametro" dimension={project.crystal.diameter} min={12} max={50} step={0.05} onChange={(value) => updateCrystal('diameter', value)} />
        <NumberField label="Grosor" dimension={project.crystal.thickness} min={0.2} max={5} step={0.05} onChange={(value) => updateCrystal('thickness', value)} />
        <NumberField label="Elevacion interior" dimension={project.crystal.innerRise} min={0} max={8} step={0.05} onChange={(value) => updateCrystal('innerRise', value)} />
      </InspectorSection>
      <SourceBadge dimension={project.crystal.thickness} />
    </>
  )
}

function DialInspector() {
  const project = useStudioStore((state) => state.project)
  const updateDial = useStudioStore((state) => state.updateDial)
  const setDialColor = useStudioStore((state) => state.setDialColor)
  const setDialFinish = useStudioStore((state) => state.setDialFinish)
  const setDialRecess = useStudioStore((state) => state.setDialRecess)
  const updateDialRecess = useStudioStore((state) => state.updateDialRecess)
  const setDialTransition = useStudioStore((state) => state.setDialTransition)
  const addRelief = useStudioStore((state) => state.addRelief)
  const updateRelief = useStudioStore((state) => state.updateRelief)
  const removeRelief = useStudioStore((state) => state.removeRelief)
  return (
    <>
      <InspectorSection title="Dial base">
        <ColorSwatches
          label="Color"
          value={project.dial.color}
          colors={['#244b3d', '#173a5a', '#d8d5cb', '#151719', '#7d2536', '#c19b43']}
          onChange={setDialColor}
        />
        <Segmented
          label="Acabado"
          value={project.dial.finish}
          options={[
            { value: 'matte', label: 'Mate' },
            { value: 'sunburst', label: 'Sunburst' },
            { value: 'stone', label: 'Mineral' },
          ]}
          onChange={setDialFinish}
        />
        <NumberField label="Diametro" dimension={project.dial.diameter} min={10} max={48} step={0.05} onChange={(value) => updateDial('diameter', value)} />
        <NumberField label="Grosor" dimension={project.dial.thickness} min={0.1} max={3} step={0.01} onChange={(value) => updateDial('thickness', value)} />
        <NumberField label="Agujero central" dimension={project.dial.centerHole} min={0.2} max={6} step={0.01} onChange={(value) => updateDial('centerHole', value)} />
        <NumberField label="Plano de asiento Z" dimension={project.dial.seatZ} min={0} max={16} step={0.01} onChange={(value) => updateDial('seatZ', value)} />
      </InspectorSection>
      <InspectorSection title="Perfil hundido">
        <Toggle label="Crear centro hundido" checked={project.dial.recess.enabled} onChange={setDialRecess} />
        {project.dial.recess.enabled && (
          <>
            <Segmented
              label="Transicion"
              value={project.dial.recess.transition}
              options={[
                { value: 'step', label: 'Escalon' },
                { value: 'ramp', label: 'Rampa' },
                { value: 'soft-bowl', label: 'Cuenco' },
              ]}
              onChange={setDialTransition}
            />
            <NumberField label="Profundidad" dimension={project.dial.recess.depth} min={0} max={3} step={0.01} onChange={(value) => updateDialRecess('depth', value)} />
            <NumberField label="Radio" dimension={project.dial.recess.radius} min={0.5} max={23} step={0.05} onChange={(value) => updateDialRecess('radius', value)} />
          </>
        )}
      </InspectorSection>
      <InspectorSection
        title="Relieves"
        action={<span className="section-count">{project.dial.reliefs.length}</span>}
      >
        <div className="inline-actions">
          <button type="button" onClick={() => addRelief('circle')}><CirclePlus size={15} />Aplique</button>
          <button type="button" onClick={() => addRelief('index')}><Minus size={15} />Indice</button>
          <button type="button" onClick={() => addRelief('block')}><Square size={14} />Bloque</button>
        </div>
        {project.dial.reliefs.map((relief) => (
          <details className="relief-editor" key={relief.id}>
            <summary>
              <span>{relief.name}</span>
              <button
                type="button"
                aria-label={`Eliminar ${relief.name}`}
                onClick={(event) => { event.preventDefault(); removeRelief(relief.id) }}
              ><Trash2 size={14} /></button>
            </summary>
            <NumberField label={`${relief.name} X`} dimension={relief.x} min={-22} max={22} step={0.05} onChange={(value) => updateRelief(relief.id, 'x', value)} />
            <NumberField label={`${relief.name} Y`} dimension={relief.y} min={-22} max={22} step={0.05} onChange={(value) => updateRelief(relief.id, 'y', value)} />
            <NumberField label={`${relief.name} ancho`} dimension={relief.width} min={0.1} max={12} step={0.05} onChange={(value) => updateRelief(relief.id, 'width', value)} />
            <NumberField label={`${relief.name} largo`} dimension={relief.length} min={0.1} max={18} step={0.05} onChange={(value) => updateRelief(relief.id, 'length', value)} />
            <NumberField label={`${relief.name} altura`} dimension={relief.height} min={0.02} max={4} step={0.01} onChange={(value) => updateRelief(relief.id, 'height', value)} />
          </details>
        ))}
      </InspectorSection>
      <SourceBadge dimension={project.dial.thickness} />
    </>
  )
}

function ratioDimension(value: number): Dimension {
  return { value, minus: 0, plus: 0, unit: 'count', quality: 'measured_by_user', source: 'Curva parametrica' }
}

function HandInspector({ part }: { part: 'hourHand' | 'minuteHand' | 'secondHand' }) {
  const project = useStudioStore((state) => state.project)
  const updateHand = useStudioStore((state) => state.updateHand)
  const updateHandCurve = useStudioStore((state) => state.updateHandCurve)
  const setHandEnabled = useStudioStore((state) => state.setHandEnabled)
  const setHandColor = useStudioStore((state) => state.setHandColor)
  const key = part === 'hourHand' ? 'hour' : part === 'minuteHand' ? 'minute' : 'second'
  const hand = project.hands[key]
  return (
    <>
      <InspectorSection title="Geometria">
        <Toggle label="Aguja activa" checked={hand.enabled} onChange={(enabled) => setHandEnabled(key, enabled)} />
        <ColorSwatches
          label="Color"
          value={hand.color}
          colors={['#e2e5e7', '#151719', '#f0cf35', '#ef4f58', '#2c63ba', '#d29c42']}
          onChange={(color) => setHandColor(key, color)}
        />
        <NumberField label="Longitud desde centro" dimension={hand.length} min={1} max={24} step={0.05} onChange={(value) => updateHand(key, 'length', value)} />
        <NumberField label="Anchura maxima" dimension={hand.width} min={0.1} max={5} step={0.01} onChange={(value) => updateHand(key, 'width', value)} />
        <NumberField label="Grosor de pala" dimension={hand.thickness} min={0.02} max={1} step={0.01} onChange={(value) => updateHand(key, 'thickness', value)} />
        <NumberField label="Altura de montaje" dimension={hand.mountingHeight} min={-1} max={5} step={0.01} onChange={(value) => updateHand(key, 'mountingHeight', value)} />
        <NumberField label="Extension del tubo" dimension={hand.tubeHeight} min={0} max={3} step={0.01} onChange={(value) => updateHand(key, 'tubeHeight', value)} />
        <NumberField label="Diametro de fitting" dimension={hand.holeDiameter} min={0.05} max={3} step={0.001} onChange={(value) => updateHand(key, 'holeDiameter', value)} />
      </InspectorSection>
      <InspectorSection title="Curva tridimensional">
        <NumberField label="Elevacion en base" dimension={hand.curve.base} min={-2} max={4} step={0.01} onChange={(value) => updateHandCurve(key, 'base', value)} />
        <NumberField label="Elevacion media" dimension={hand.curve.middle} min={-2} max={4} step={0.01} onChange={(value) => updateHandCurve(key, 'middle', value)} />
        <NumberField label="Elevacion en punta" dimension={hand.curve.tip} min={-2} max={4} step={0.01} onChange={(value) => updateHandCurve(key, 'tip', value)} />
        <NumberField label="Inicio de curva" dimension={ratioDimension(hand.curve.startRatio)} min={0} max={0.95} step={0.01} onChange={(value) => updateHandCurve(key, 'startRatio', value)} />
        <NumberField label="Fin de curva" dimension={ratioDimension(hand.curve.endRatio)} min={0.05} max={1} step={0.01} onChange={(value) => updateHandCurve(key, 'endRatio', value)} />
      </InspectorSection>
      <SourceBadge dimension={hand.holeDiameter} />
    </>
  )
}

function QuartzMovementInspector() {
  const project = useStudioStore((state) => state.project)
  const updateQuartz = useStudioStore((state) => state.updateQuartz)
  const updateQuartzFit = useStudioStore((state) => state.updateQuartzFit)
  if (project.movement.kind !== 'quartz') return null
  const movement = project.movement
  return (
    <>
      <div className="inspector-callout">
        <strong>{movement.name}</strong>
        <span>{movement.presetId.replace('_', ' ').toUpperCase()}</span>
      </div>
      <InspectorSection title="Envolventes">
        <NumberField label="Ancho comercial" dimension={movement.width} min={8} max={40} step={0.05} onChange={(value) => updateQuartz('width', value)} />
        <NumberField label="Largo comercial" dimension={movement.length} min={8} max={40} step={0.05} onChange={(value) => updateQuartz('length', value)} />
        <NumberField label="Ancho de encaje" dimension={movement.casingWidth} min={8} max={40} step={0.05} onChange={(value) => updateQuartz('casingWidth', value)} />
        <NumberField label="Largo de encaje" dimension={movement.casingLength} min={8} max={40} step={0.05} onChange={(value) => updateQuartz('casingLength', value)} />
        <NumberField label="Espesor" dimension={movement.thickness} min={1} max={12} step={0.01} onChange={(value) => updateQuartz('thickness', value)} />
        <NumberField label="Eje de tija" dimension={movement.stemAxisZ} min={0.2} max={8} step={0.01} onChange={(value) => updateQuartz('stemAxisZ', value)} />
      </InspectorSection>
      <InspectorSection title="Fitting de agujas">
        <NumberField label="Canon horario" dimension={movement.handFit.hour} min={0.1} max={3} step={0.001} onChange={(value) => updateQuartzFit('hour', value)} />
        <NumberField label="Canon minutero" dimension={movement.handFit.minute} min={0.1} max={2} step={0.001} onChange={(value) => updateQuartzFit('minute', value)} />
        <NumberField label="Canon segundero" dimension={movement.handFit.second} min={0.05} max={1} step={0.001} onChange={(value) => updateQuartzFit('second', value)} />
      </InspectorSection>
      <SourceBadge dimension={movement.casingWidth} />
      <AssemblyClearances />
    </>
  )
}

const arborIds: MechanicalArborId[] = ['barrel', 'center', 'third', 'fourth', 'escape']

function ArborInspector({ id }: { id: MechanicalArborId }) {
  const project = useStudioStore((state) => state.project)
  const updateArbor = useStudioStore((state) => state.updateArbor)
  const setArborProfile = useStudioStore((state) => state.setArborProfile)
  const autoPlaceTrain = useStudioStore((state) => state.autoPlaceTrain)
  if (project.movement.kind !== 'mechanical') return null
  const arbor = project.movement.arbors.find((item) => item.id === id)
  const evaluation = evaluateProject(project)
  if (!arbor || !evaluation.train) return null
  const pair = evaluation.train.pairs.find((item) => item.driver === id || item.driven === id)
  const nextArbor = project.movement.arbors[project.movement.arbors.findIndex((item) => item.id === id) + 1]
  return (
    <>
      {pair && (
        <div className="metric-grid metric-grid--three">
          <Metric label="Centro real" value={`${pair.actualDistance.toFixed(3)} mm`} tone={Math.abs(pair.distanceError) <= pair.tolerance ? 'good' : 'bad'} />
          <Metric label="Nominal" value={`${pair.targetDistance.toFixed(3)} mm`} />
          <Metric label="Error" value={`${pair.distanceError >= 0 ? '+' : ''}${pair.distanceError.toFixed(3)}`} tone={Math.abs(pair.distanceError) <= pair.tolerance ? 'good' : 'bad'} />
        </div>
      )}
      <InspectorSection title="Centro y dentado">
        <NumberField label={`${arbor.name} X`} dimension={arbor.x} min={-18} max={18} step={0.01} onChange={(value) => updateArbor(id, 'x', value)} />
        <NumberField label={`${arbor.name} Y`} dimension={arbor.y} min={-18} max={18} step={0.01} onChange={(value) => updateArbor(id, 'y', value)} />
        <NumberField label="Dientes de rueda" dimension={arbor.wheelTeeth} min={6} max={140} step={1} onChange={(value) => updateArbor(id, 'wheelTeeth', value)} />
        {id !== 'barrel' && <NumberField label="Hojas de pinon" dimension={arbor.pinionTeeth} min={4} max={24} step={1} onChange={(value) => updateArbor(id, 'pinionTeeth', value)} />}
        <NumberField label="Modulo al siguiente" dimension={arbor.moduleToNext} min={0.04} max={0.4} step={0.005} onChange={(value) => updateArbor(id, 'moduleToNext', value)} />
        {nextArbor && (
          <Segmented
            label="Perfil al siguiente"
            value={arbor.profileToNext ?? 'cycloidal'}
            options={[{ value: 'cycloidal', label: 'Cicloidal' }, { value: 'involute', label: 'Involuta' }]}
            onChange={(value) => setArborProfile(id, value)}
          />
        )}
        {(arbor.profileToNext ?? 'cycloidal') === 'involute' && arbor.pressureAngle && <NumberField label="Angulo de presion" dimension={arbor.pressureAngle} min={14.5} max={30} step={0.5} onChange={(value) => updateArbor(id, 'pressureAngle', value)} />}
        {(arbor.profileToNext ?? 'cycloidal') === 'involute' && arbor.profileShift && <NumberField label="Correccion de perfil" dimension={arbor.profileShift} min={-0.8} max={1.2} step={0.01} onChange={(value) => updateArbor(id, 'profileShift', value)} />}
        {arbor.backlash && <NumberField label="Backlash objetivo" dimension={arbor.backlash} min={0} max={0.2} step={0.001} onChange={(value) => updateArbor(id, 'backlash', value)} />}
        <button type="button" className="full-action" onClick={autoPlaceTrain}><RotateCcw size={15} />Recalcular centros nominales</button>
      </InspectorSection>
      <InspectorSection title="Elevacion">
        <NumberField label="Plano de rueda Z" dimension={arbor.wheelZ} min={0.2} max={8} step={0.01} onChange={(value) => updateArbor(id, 'wheelZ', value)} />
        <NumberField label="Plano de pinon Z" dimension={arbor.pinionZ} min={0.2} max={8} step={0.01} onChange={(value) => updateArbor(id, 'pinionZ', value)} />
        <NumberField label="Grosor rueda" dimension={arbor.wheelThickness} min={0.05} max={1.2} step={0.01} onChange={(value) => updateArbor(id, 'wheelThickness', value)} />
        <NumberField label="Altura pinon" dimension={arbor.pinionThickness} min={0.05} max={2} step={0.01} onChange={(value) => updateArbor(id, 'pinionThickness', value)} />
        <NumberField label="Diametro pivote" dimension={arbor.pivotDiameter} min={0.04} max={2} step={0.01} onChange={(value) => updateArbor(id, 'pivotDiameter', value)} />
        {arbor.pivotLength && <NumberField label="Longitud de pivote" dimension={arbor.pivotLength} min={0.1} max={4} step={0.01} onChange={(value) => updateArbor(id, 'pivotLength', value)} />}
        {arbor.endshake && <NumberField label="Endshake" dimension={arbor.endshake} min={0} max={0.3} step={0.001} onChange={(value) => updateArbor(id, 'endshake', value)} />}
        {arbor.sideshake && <NumberField label="Sideshake" dimension={arbor.sideshake} min={0} max={0.2} step={0.001} onChange={(value) => updateArbor(id, 'sideshake', value)} />}
      </InspectorSection>
      <InspectorSection title="Pivote y rubi" defaultOpen={false}>
        {arbor.jewelHoleDiameter && <NumberField label="Agujero de rubi" dimension={arbor.jewelHoleDiameter} min={0.04} max={2} step={0.001} onChange={(value) => updateArbor(id, 'jewelHoleDiameter', value)} />}
        {arbor.jewelOuterDiameter && <NumberField label="Diametro exterior rubi" dimension={arbor.jewelOuterDiameter} min={0.3} max={5} step={0.01} onChange={(value) => updateArbor(id, 'jewelOuterDiameter', value)} />}
      </InspectorSection>
      <SourceBadge dimension={arbor.moduleToNext} />
    </>
  )
}

function BalanceInspector() {
  const project = useStudioStore((state) => state.project)
  const updateBalance = useStudioStore((state) => state.updateBalance)
  if (project.movement.kind !== 'mechanical') return null
  const balance = project.movement.balance
  return (
    <InspectorSection title="Oscilador">
      <NumberField label="Centro volante X" dimension={balance.x} min={-18} max={18} step={0.01} onChange={(value) => updateBalance('x', value)} />
      <NumberField label="Centro volante Y" dimension={balance.y} min={-18} max={18} step={0.01} onChange={(value) => updateBalance('y', value)} />
      <NumberField label="Diametro volante" dimension={balance.diameter} min={3} max={20} step={0.05} onChange={(value) => updateBalance('diameter', value)} />
      <NumberField label="Grosor volante" dimension={balance.thickness} min={0.1} max={2} step={0.01} onChange={(value) => updateBalance('thickness', value)} />
      <NumberField label="Plano volante Z" dimension={balance.z} min={0.4} max={8} step={0.01} onChange={(value) => updateBalance('z', value)} />
      <NumberField label="Amplitud objetivo" dimension={balance.targetAmplitude} min={120} max={360} step={1} onChange={(value) => updateBalance('targetAmplitude', value)} />
      {balance.mass && <NumberField label="Masa equivalente" dimension={balance.mass} min={0.0001} max={1} step={0.0001} onChange={(value) => updateBalance('mass', value)} />}
      {balance.inertia && <NumberField label="Inercia" dimension={balance.inertia} min={0.00000000001} max={0.00000001} step={0.00000000001} onChange={(value) => updateBalance('inertia', value)} />}
      {balance.hairspringStiffness && <NumberField label="Rigidez de espiral" dimension={balance.hairspringStiffness} min={0.00000001} max={0.00001} step={0.00000001} onChange={(value) => updateBalance('hairspringStiffness', value)} />}
      {balance.dampingRatio && <NumberField label="Amortiguamiento" dimension={balance.dampingRatio} min={0.001} max={0.1} step={0.001} onChange={(value) => updateBalance('dampingRatio', value)} />}
    </InspectorSection>
  )
}

function MechanicalMovementInspector() {
  const project = useStudioStore((state) => state.project)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const updateMechanical = useStudioStore((state) => state.updateMechanical)
  const setMechanicalArchitecture = useStudioStore((state) => state.setMechanicalArchitecture)
  const setEscapementType = useStudioStore((state) => state.setEscapementType)
  const updateEscapement = useStudioStore((state) => state.updateEscapement)
  const updateMainspring = useStudioStore((state) => state.updateMainspring)
  const updateAutomatic = useStudioStore((state) => state.updateAutomatic)
  const setReverserType = useStudioStore((state) => state.setReverserType)
  const updateMotionWorks = useStudioStore((state) => state.updateMotionWorks)
  if (project.movement.kind !== 'mechanical') return null
  if (arborIds.includes(selectedPart as MechanicalArborId)) return <ArborInspector id={selectedPart as MechanicalArborId} />
  if (selectedPart === 'balance') return <BalanceInspector />
  const movement = project.movement
  const train = evaluateProject(project).train
  return (
    <>
      <MovementBuilder />
      {train && (
        <div className="metric-grid metric-grid--three">
          <Metric label="Frecuencia" value={`${Math.round(train.calculatedVph).toLocaleString('es-ES')} vph`} tone={Math.abs(train.calculatedVph - train.targetVph) < 1 ? 'good' : 'bad'} />
          <Metric label="Segundos" value={`${train.centerToFourthRatio.toFixed(2)}:1`} tone={Math.abs(train.centerToFourthRatio - 60) < 0.01 ? 'good' : 'bad'} />
          <Metric label="Reserva" value={`${train.powerReserveHours.toFixed(1)} h`} tone={train.powerReserveHours >= train.targetPowerReserveHours ? 'good' : 'warning'} />
        </div>
      )}
      <InspectorSection title="Arquitectura">
        <Segmented
          label="Remontuar"
          value={movement.architecture}
          options={[{ value: 'manual', label: 'Manual' }, { value: 'automatic', label: 'Automatico' }]}
          onChange={setMechanicalArchitecture}
        />
        <NumberField label="Diametro platina" dimension={movement.plateDiameter} min={18} max={60} step={0.05} onChange={(value) => updateMechanical('plateDiameter', value)} />
        <NumberField label="Grosor platina" dimension={movement.plateThickness} min={0.3} max={3} step={0.01} onChange={(value) => updateMechanical('plateThickness', value)} />
        <NumberField label="Datum inferior del tren" dimension={movement.trainBaseZ} min={0} max={8} step={0.01} onChange={(value) => updateMechanical('trainBaseZ', value)} />
        <NumberField label="Altura movimiento" dimension={movement.totalHeight} min={2} max={18} step={0.05} onChange={(value) => updateMechanical('totalHeight', value)} />
        <NumberField label="Grosor puentes" dimension={movement.bridgeThickness} min={0.2} max={3} step={0.01} onChange={(value) => updateMechanical('bridgeThickness', value)} />
        <NumberField label="Plano superior puentes" dimension={movement.bridgeTopZ} min={0.5} max={16} step={0.01} onChange={(value) => updateMechanical('bridgeTopZ', value)} />
        <NumberField label="Margen al borde" dimension={movement.edgeClearance} min={0} max={4} step={0.05} onChange={(value) => updateMechanical('edgeClearance', value)} />
        <NumberField label="Altura eje de tija" dimension={movement.stemAxisZ} min={0.3} max={10} step={0.01} onChange={(value) => updateMechanical('stemAxisZ', value)} />
      </InspectorSection>
      {movement.architecture === 'automatic' && movement.automatic && (
        <InspectorSection title="Modulo automatico" defaultOpen={selectedPart === 'rotor'}>
          <Segmented
            label="Carga"
            value={movement.automatic.reverserType}
            options={[{ value: 'bidirectional', label: 'Bidireccional' }, { value: 'unidirectional', label: 'Unidireccional' }]}
            onChange={setReverserType}
          />
          <NumberField label="Diametro rotor" dimension={movement.automatic.rotorDiameter} min={8} max={58} step={0.05} onChange={(value) => updateAutomatic('rotorDiameter', value)} />
          <NumberField label="Grosor rotor" dimension={movement.automatic.rotorThickness} min={0.15} max={3} step={0.01} onChange={(value) => updateAutomatic('rotorThickness', value)} />
          <NumberField label="Plano rotor Z" dimension={movement.automatic.rotorZ} min={-2} max={15} step={0.01} onChange={(value) => updateAutomatic('rotorZ', value)} />
          <NumberField label="Diametro cojinete" dimension={movement.automatic.bearingDiameter} min={0.5} max={10} step={0.01} onChange={(value) => updateAutomatic('bearingDiameter', value)} />
          <NumberField label="Masa rotor (g)" dimension={movement.automatic.rotorMass} min={0.1} max={20} step={0.05} onChange={(value) => updateAutomatic('rotorMass', value)} />
          <NumberField label="Radio centro de masa" dimension={movement.automatic.centerOfMassRadius} min={0.1} max={25} step={0.05} onChange={(value) => updateAutomatic('centerOfMassRadius', value)} />
          <NumberField label="Friccion cojinete (N mm)" dimension={movement.automatic.bearingFrictionTorque} min={0} max={0.2} step={0.001} onChange={(value) => updateAutomatic('bearingFrictionTorque', value)} />
          <NumberField label="Reduccion rotor/barrilete" dimension={movement.automatic.rotorToBarrelRatio} min={5} max={500} step={1} onChange={(value) => updateAutomatic('rotorToBarrelRatio', value)} />
          <NumberField label="Eficiencia de carga" dimension={movement.automatic.windingEfficiency} min={0.05} max={0.95} step={0.01} onChange={(value) => updateAutomatic('windingEfficiency', value)} />
          <NumberField label="Frecuencia de uso (Hz)" dimension={movement.automatic.motionFrequency} min={0.05} max={4} step={0.05} onChange={(value) => updateAutomatic('motionFrequency', value)} />
          <NumberField label="Arco medio de uso" dimension={movement.automatic.motionSweep} min={5} max={350} step={1} onChange={(value) => updateAutomatic('motionSweep', value)} />
          <NumberField label="Actividad diaria" dimension={movement.automatic.activeHoursPerDay} min={0} max={24} step={0.25} onChange={(value) => updateAutomatic('activeHoursPerDay', value)} />
        </InspectorSection>
      )}
      <InspectorSection title="Energia y escape">
        <NumberField label="Vueltas de barrilete" dimension={movement.barrelTurns} min={1} max={20} step={0.1} onChange={(value) => updateMechanical('barrelTurns', value)} />
        <NumberField label="Reserva objetivo" dimension={movement.targetPowerReserve} min={8} max={240} step={1} onChange={(value) => updateMechanical('targetPowerReserve', value)} />
        <Segmented
          label="Escape"
          value={movement.escapement.type}
          options={[
            { value: 'swiss-lever', label: 'Ancora' },
            { value: 'co-axial', label: 'Co-axial' },
            { value: 'detent', label: 'Detent' },
          ]}
          onChange={setEscapementType}
        />
        <NumberField label="Frecuencia objetivo" dimension={movement.escapement.targetVph} min={7200} max={72000} step={100} onChange={(value) => updateEscapement('targetVph', value)} />
        <NumberField label="Angulo de alzamiento" dimension={movement.escapement.liftAngle} min={20} max={80} step={1} onChange={(value) => updateEscapement('liftAngle', value)} />
        {movement.escapement.lock && <NumberField label="Bloqueo" dimension={movement.escapement.lock} min={0} max={20} step={0.1} onChange={(value) => updateEscapement('lock', value)} />}
        {movement.escapement.drop && <NumberField label="Caida" dimension={movement.escapement.drop} min={0} max={20} step={0.1} onChange={(value) => updateEscapement('drop', value)} />}
        {movement.escapement.draw && <NumberField label="Draw" dimension={movement.escapement.draw} min={0} max={20} step={0.1} onChange={(value) => updateEscapement('draw', value)} />}
        {movement.escapement.impulseAngle && <NumberField label="Angulo de impulso" dimension={movement.escapement.impulseAngle} min={5} max={80} step={0.1} onChange={(value) => updateEscapement('impulseAngle', value)} />}
        {movement.escapement.efficiency && <NumberField label="Eficiencia de escape" dimension={movement.escapement.efficiency} min={0.05} max={0.8} step={0.01} onChange={(value) => updateEscapement('efficiency', value)} />}
      </InspectorSection>
      {movement.mainspring && (
        <InspectorSection title="Muelle real" defaultOpen={false}>
          <NumberField label="Espesor de hoja" dimension={movement.mainspring.thickness} min={0.02} max={0.5} step={0.001} onChange={(value) => updateMainspring('thickness', value)} />
          <NumberField label="Altura de hoja" dimension={movement.mainspring.height} min={0.2} max={5} step={0.01} onChange={(value) => updateMainspring('height', value)} />
          <NumberField label="Longitud desarrollada" dimension={movement.mainspring.length} min={20} max={1200} step={1} onChange={(value) => updateMainspring('length', value)} />
          <NumberField label="Modulo elastico" dimension={movement.mainspring.elasticModulus} min={50000} max={250000} step={1000} onChange={(value) => updateMainspring('elasticModulus', value)} />
          <NumberField label="Vueltas utiles" dimension={movement.mainspring.turnsWorking} min={1} max={20} step={0.1} onChange={(value) => updateMainspring('turnsWorking', value)} />
        </InspectorSection>
      )}
      <InspectorSection title="Motion works" defaultOpen={false}>
        <NumberField label="Canon horario" dimension={movement.motionWorks.hourFit} min={0.1} max={4} step={0.01} onChange={(value) => updateMotionWorks('hourFit', value)} />
        <NumberField label="Canon minutero" dimension={movement.motionWorks.minuteFit} min={0.1} max={3} step={0.01} onChange={(value) => updateMotionWorks('minuteFit', value)} />
        <NumberField label="Canon segundero" dimension={movement.motionWorks.secondFit} min={0.05} max={2} step={0.01} onChange={(value) => updateMotionWorks('secondFit', value)} />
      </InspectorSection>
      <SourceBadge dimension={movement.plateDiameter} />
      <AssemblyClearances />
    </>
  )
}

export function StudioInspector() {
  const workspace = useStudioStore((state) => state.workspace)
  const selectedPart = useStudioStore((state) => state.selectedPart)
  const project = useStudioStore((state) => state.project)
  const renderMode = useStudioStore((state) => state.renderMode)
  if (workspace === 'analysis') {
    return <EngineeringInspector />
  }
  if (workspace === 'manufacturing') return <ManufacturingInspector />
  return (
    <aside className="studio-inspector">
      <InspectorHeader part={selectedPart} />
      <div className="studio-inspector__body">
        {renderMode === 'presentation' ? (
          <PresentationInspector part={selectedPart} />
        ) : ['bezel', 'rehaut', 'strap', 'clasp', 'springBar', 'dialGraphics'].includes(selectedPart) ? (
          <ExteriorInspector part={selectedPart} />
        ) : workspace === 'movement' && project.movement.kind === 'mechanical' ? (
          <MechanicalMovementInspector />
        ) : selectedPart === 'case' || selectedPart === 'back' || selectedPart === 'stem' || selectedPart === 'crown' ? (
          <CaseInspector />
        ) : selectedPart === 'crystal' ? (
          <CrystalInspector />
        ) : selectedPart === 'dial' ? (
          <DialInspector />
        ) : selectedPart === 'hourHand' || selectedPart === 'minuteHand' || selectedPart === 'secondHand' ? (
          <HandInspector part={selectedPart} />
        ) : project.movement.kind === 'quartz' ? (
          <QuartzMovementInspector />
        ) : (
          <MechanicalMovementInspector />
        )}
      </div>
    </aside>
  )
}
