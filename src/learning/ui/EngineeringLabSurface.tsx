import {
  Activity,
  Archive,
  Calculator,
  CheckCircle2,
  CircleAlert,
  Cog,
  Download,
  Gauge,
  NotebookPen,
  Ruler,
  Save,
  ShieldAlert,
  Sigma,
  Trash2,
  Waves,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  ENGINEERING_FORMULAS,
  ENGINEERING_SOURCES,
  calculateIdealGearTrain,
  calculateMainspringLinearModel,
  calculateProcessCapability,
  calculateRequiredHairspringStiffness,
  calculateToleranceStack,
  calculateWeibullReliability,
  engineeringSource,
  quantity,
  readEngineeringNotebook,
  removeEngineeringRun,
  saveEngineeringRun,
  unitSymbol,
  type EngineeringCalculationRun,
} from '../../core/horology-engineering'
import { useLearning } from './LearningContext'
import {
  normalizeEngineeringLabId,
  type EngineeringLabId,
} from './engineeringLabIdentity'
import './engineering-lab.css'

type LabId = EngineeringLabId

interface LabDefinition {
  id: LabId
  title: string
  concept: string
  question: string
  icon: typeof Waves
}

const LABS: LabDefinition[] = [
  {
    id: 'gear-train',
    title: 'Tren de ruedas',
    concept: 'Un tren compuesto transforma velocidad y sentido mediante relaciones de dientes encadenadas.',
    question: '¿Qué velocidad y centros nominales produce una combinación de ruedas y piñones?',
    icon: Cog,
  },
  {
    id: 'oscillator',
    title: 'Volante y espiral',
    concept: 'La inercia del volante y la rigidez del espiral forman un oscilador torsional.',
    question: '¿Qué rigidez ideal necesita una inercia dada para alcanzar una cadencia?',
    icon: Waves,
  },
  {
    id: 'mainspring',
    title: 'Muelle real',
    concept: 'Una lámina almacena energía al curvarse; su espesor domina la rigidez por una potencia cúbica.',
    question: '¿Cómo cambian el par y la energía al modificar sección, longitud o vueltas?',
    icon: Activity,
  },
  {
    id: 'tolerances',
    title: 'Cadenas de cotas',
    concept: 'El peor caso suma extremos; RSS describe una combinación estadística bajo hipótesis más fuertes.',
    question: '¿Qué margen necesita un montaje cuando se acumulan varias tolerancias?',
    icon: Ruler,
  },
  {
    id: 'capability',
    title: 'Variación y capacidad de proceso',
    concept: 'Una tolerancia de plano no demuestra que un proceso real sea estable ni capaz.',
    question: '¿Cuánta variación cabe entre los límites y está centrado el proceso?',
    icon: Gauge,
  },
  {
    id: 'reliability',
    title: 'Fiabilidad',
    concept: 'Weibull separa escala de vida y forma del modo de fallo; sus parámetros deben venir de datos.',
    question: '¿Qué probabilidad predice un modelo de vida en un instante concreto?',
    icon: ShieldAlert,
  },
]

function numericValue(value: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error('Completa todos los campos con números válidos.')
  return parsed
}

function safeRun(create: () => EngineeringCalculationRun): { run?: EngineeringCalculationRun; error?: string } {
  try {
    return { run: create() }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se ha podido calcular.' }
  }
}

function LabField({
  label,
  value,
  unit,
  hint,
  onChange,
}: {
  label: string
  value: string
  unit: string
  hint?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="engineering-lab-field">
      <span>{label}</span>
      <div><input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><b>{unit}</b></div>
      {hint && <small>{hint}</small>}
    </label>
  )
}

function LabForm({
  active,
  onRun,
}: {
  active: LabId
  onRun: (run: EngineeringCalculationRun | undefined, error: string | undefined) => void
}) {
  const [values, setValues] = useState({
    inertia: '8.5',
    cadence: '21600',
    springThickness: '0.10',
    springHeight: '1.20',
    springLength: '300',
    springModulus: '190000',
    springTurns: '6',
    toleranceA: '0.010',
    toleranceB: '0.020',
    toleranceC: '0.030',
    lsl: '9.90',
    usl: '10.10',
    mean: '10.02',
    sigma: '0.020',
    samples: '50',
    lifeTime: '1000',
    lifeScale: '5000',
    lifeShape: '1.5',
    inputRpm: '0.25',
    driver1: '80',
    driven1: '10',
    module1: '0.12',
    driver2: '75',
    driven2: '10',
    module2: '0.10',
  })
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }))

  const submit = () => {
    const result = safeRun(() => {
      if (active === 'gear-train') return calculateIdealGearTrain({
        inputSpeed: quantity(numericValue(values.inputRpm), 'rpm', 'designed'),
        stages: [
          {
            driverTeeth: numericValue(values.driver1),
            drivenTeeth: numericValue(values.driven1),
            module: quantity(numericValue(values.module1), 'mm', 'designed'),
            mesh: 'external',
          },
          {
            driverTeeth: numericValue(values.driver2),
            drivenTeeth: numericValue(values.driven2),
            module: quantity(numericValue(values.module2), 'mm', 'designed'),
            mesh: 'external',
          },
        ],
      })
      if (active === 'oscillator') return calculateRequiredHairspringStiffness({
        inertia: quantity(numericValue(values.inertia), 'mg*cm2', 'designed'),
        targetAlternations: quantity(numericValue(values.cadence), 'vph', 'designed'),
      })
      if (active === 'mainspring') return calculateMainspringLinearModel({
        thickness: quantity(numericValue(values.springThickness), 'mm', 'designed'),
        height: quantity(numericValue(values.springHeight), 'mm', 'designed'),
        length: quantity(numericValue(values.springLength), 'mm', 'designed'),
        elasticModulus: quantity(numericValue(values.springModulus), 'N/mm2', 'estimated'),
        turns: quantity(numericValue(values.springTurns), 'count', 'designed'),
      })
      if (active === 'tolerances') return calculateToleranceStack({
        contributors: [
          quantity(numericValue(values.toleranceA), 'mm', 'designed'),
          quantity(numericValue(values.toleranceB), 'mm', 'designed'),
          quantity(numericValue(values.toleranceC), 'mm', 'designed'),
        ],
      })
      if (active === 'capability') return calculateProcessCapability({
        lowerSpecification: quantity(numericValue(values.lsl), 'mm', 'designed'),
        upperSpecification: quantity(numericValue(values.usl), 'mm', 'designed'),
        mean: quantity(numericValue(values.mean), 'mm', 'measured'),
        standardDeviation: quantity(numericValue(values.sigma), 'mm', 'measured'),
        sampleSize: quantity(numericValue(values.samples), 'count', 'measured'),
      })
      return calculateWeibullReliability({
        time: quantity(numericValue(values.lifeTime), 'h', 'designed'),
        scale: quantity(numericValue(values.lifeScale), 'h', 'estimated'),
        shape: quantity(numericValue(values.lifeShape), 'ratio', 'estimated'),
      })
    })
    onRun(result.run, result.error)
  }

  return (
    <div className="engineering-lab-form">
      {active === 'gear-train' && <>
        <LabField label="Velocidad de entrada" unit="rpm" value={values.inputRpm} onChange={set('inputRpm')} hint="Velocidad del primer órgano conductor." />
        <LabField label="Etapa 1 · conductora" unit="dientes" value={values.driver1} onChange={set('driver1')} />
        <LabField label="Etapa 1 · conducida" unit="dientes" value={values.driven1} onChange={set('driven1')} />
        <LabField label="Etapa 1 · módulo" unit="mm" value={values.module1} onChange={set('module1')} />
        <LabField label="Etapa 2 · conductora" unit="dientes" value={values.driver2} onChange={set('driver2')} />
        <LabField label="Etapa 2 · conducida" unit="dientes" value={values.driven2} onChange={set('driven2')} />
        <LabField label="Etapa 2 · módulo" unit="mm" value={values.module2} onChange={set('module2')} hint="Modelo ideal: todavía no valida perfil, contacto, cargas ni fabricabilidad." />
      </>}
      {active === 'oscillator' && <>
        <LabField label="Inercia del volante" unit="mg·cm²" value={values.inertia} onChange={set('inertia')} hint="Dato diseñado o medido; no lo deduzcas solo de una fotografía." />
        <LabField label="Cadencia objetivo" unit="A/h" value={values.cadence} onChange={set('cadence')} hint="18 000, 21 600, 28 800… son opciones de diseño, no niveles de calidad." />
      </>}
      {active === 'mainspring' && <>
        <LabField label="Espesor" unit="mm" value={values.springThickness} onChange={set('springThickness')} />
        <LabField label="Altura" unit="mm" value={values.springHeight} onChange={set('springHeight')} />
        <LabField label="Longitud activa" unit="mm" value={values.springLength} onChange={set('springLength')} />
        <LabField label="Módulo elástico" unit="N/mm²" value={values.springModulus} onChange={set('springModulus')} hint="Valor estimado hasta identificar material y tratamiento." />
        <LabField label="Vueltas de trabajo" unit="vueltas" value={values.springTurns} onChange={set('springTurns')} />
      </>}
      {active === 'tolerances' && <>
        <LabField label="Contribución 1" unit="mm" value={values.toleranceA} onChange={set('toleranceA')} />
        <LabField label="Contribución 2" unit="mm" value={values.toleranceB} onChange={set('toleranceB')} />
        <LabField label="Contribución 3" unit="mm" value={values.toleranceC} onChange={set('toleranceC')} hint="Usa semianchos positivos; la dirección debe resolverse en el modelo de cotas." />
      </>}
      {active === 'capability' && <>
        <LabField label="Límite inferior" unit="mm" value={values.lsl} onChange={set('lsl')} />
        <LabField label="Límite superior" unit="mm" value={values.usl} onChange={set('usl')} />
        <LabField label="Media observada" unit="mm" value={values.mean} onChange={set('mean')} />
        <LabField label="Desviación estándar" unit="mm" value={values.sigma} onChange={set('sigma')} />
        <LabField label="Número de mediciones" unit="n" value={values.samples} onChange={set('samples')} />
      </>}
      {active === 'reliability' && <>
        <LabField label="Tiempo de evaluación" unit="h" value={values.lifeTime} onChange={set('lifeTime')} />
        <LabField label="Vida característica η" unit="h" value={values.lifeScale} onChange={set('lifeScale')} />
        <LabField label="Forma β" unit="—" value={values.lifeShape} onChange={set('lifeShape')} hint="β < 1: fallos tempranos; β = 1: tasa constante; β > 1: tasa creciente. Es interpretación del modelo, no diagnóstico automático." />
      </>}
      <button className="academy-button is-primary" type="button" onClick={submit}><Calculator size={16} /> Calcular y revisar</button>
    </div>
  )
}

const outputLabels: Record<string, string> = {
  stage1CenterDistance: 'Centro nominal · etapa 1',
  stage2CenterDistance: 'Centro nominal · etapa 2',
  totalRatio: 'Relación total',
  outputSpeed: 'Velocidad de salida',
  direction: 'Sentido relativo (+ igual / − opuesto)',
  stiffness: 'Rigidez torsional requerida',
  frequency: 'Frecuencia',
  period: 'Periodo',
  secondMoment: 'Segundo momento de área',
  torsionalStiffness: 'Rigidez inicial',
  torque: 'Par teórico',
  storedEnergy: 'Energía almacenada',
  worstCase: 'Acumulación de peor caso',
  rootSumSquare: 'Acumulación RSS',
  cp: 'Cp',
  cpk: 'Cpk',
  cpu: 'Cpu',
  cpl: 'Cpl',
  reliability: 'Fiabilidad R(t)',
  failureProbability: 'Probabilidad de fallo F(t)',
  cumulativeHazard: 'Riesgo acumulado',
  hazard: 'Tasa de riesgo',
}

function formatOutput(value: EngineeringCalculationRun['outputs'][string]): string {
  const absolute = Math.abs(value.value)
  const formatted = absolute !== 0 && (absolute < 0.001 || absolute >= 1_000_000)
    ? value.value.toExponential(4)
    : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 6 }).format(value.value)
  return `${formatted}${unitSymbol(value.unit) ? ` ${unitSymbol(value.unit)}` : ''}`
}

function ResultPanel({
  run,
  error,
  onSave,
}: {
  run?: EngineeringCalculationRun
  error?: string
  onSave: (run: EngineeringCalculationRun) => void
}) {
  if (error) return <section className="engineering-result is-error"><CircleAlert size={21} /><div><strong>No se puede calcular todavía</strong><p>{error}</p></div></section>
  if (!run) return <section className="engineering-result is-empty"><Sigma size={24} /><div><strong>Prepara una hipótesis</strong><p>Modifica los valores y ejecuta el cálculo. El resultado no se guardará hasta que tú lo decidas.</p></div></section>
  const formula = ENGINEERING_FORMULAS.find(({ id }) => id === run.formulaId)
  return (
    <section className="engineering-result">
      <header>
        <div><span>RESULTADO DEL CÁLCULO</span><h2>{run.title}</h2></div>
        <span className={`engineering-validity is-${run.validity}`}>{run.validity === 'within-domain' ? 'Válido con estos supuestos' : 'Requiere cautela'}</span>
      </header>
      <div className="engineering-output-grid">
        {Object.entries(run.outputs).map(([key, value]) => <div key={key}><span>{outputLabels[key] ?? 'Resultado calculado'}</span><strong>{formatOutput(value)}</strong></div>)}
      </div>
      {run.notices.map((notice) => <div className={`engineering-notice is-${notice.severity}`} key={notice.code}><ShieldAlert size={16} /><span>{notice.message}</span></div>)}
      <details open>
        <summary>Fórmula, hipótesis y límites</summary>
        <code>{formula?.expression}</code>
        <div className="engineering-result-details">
          <div><strong>Cuándo sirve este cálculo</strong><ul>{run.domain.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><strong>Supone</strong><ul>{run.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><strong>No demuestra</strong><ul>{run.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </details>
      <footer>
        <span><CheckCircle2 size={15} /> {run.verification === 'source-reviewed' ? 'Definición contrastada con fuente primaria' : 'Coherencia dimensional comprobada'}</span>
        <button className="academy-button is-primary" type="button" onClick={() => onSave(run)}><Save size={15} /> Guardar en cuaderno</button>
      </footer>
    </section>
  )
}

function StudyPrimer({ lab }: { lab: LabDefinition }) {
  return (
    <section className="engineering-primer">
      <span className="academy-kicker">ANTES DE CALCULAR</span>
      <h2>{lab.concept}</h2>
      <p>{lab.question}</p>
      <ol>
        <li><strong>Predice.</strong> Decide primero qué variable debería crecer o disminuir.</li>
        <li><strong>Calcula.</strong> Indica las unidades y de dónde sale cada dato; revisa las hipótesis.</li>
        <li><strong>Interpreta.</strong> Explica el resultado con palabras y detecta qué dato falta.</li>
        <li><strong>Contrasta.</strong> Guarda la ejecución solo si podrías reconstruirla después.</li>
      </ol>
    </section>
  )
}

function NotebookPanel({
  projectId,
  runs,
  onRemove,
}: {
  projectId: string
  runs: EngineeringCalculationRun[]
  onRemove: (runId: string) => void
}) {
  const download = () => {
    const payload = JSON.stringify({ schemaVersion: 1, projectId, exportedAt: new Date().toISOString(), runs }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `cuaderno-ingenieria-${projectId.replace(/[^a-z0-9.-]+/gi, '-')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <section className="engineering-notebook">
      <header>
        <div><span className="academy-kicker">CUADERNO TÉCNICO</span><h2>{runs.length} ejecuciones guardadas</h2><p>Cuaderno del proyecto local activo. Los datos permanecen en este dispositivo.</p></div>
        <button className="academy-button is-secondary" type="button" onClick={download} disabled={!runs.length}><Download size={15} /> Exportar JSON</button>
      </header>
      {!runs.length && <div className="engineering-notebook-empty"><NotebookPen size={22} /><span>Guarda un cálculo para conservar entradas, versión, fuentes, límites y resultado.</span></div>}
      {runs.map((run) => (
        <article key={run.id}>
          <Archive size={16} />
          <div><strong>{run.title}</strong><span>{new Date(run.createdAt).toLocaleString('es-ES')} · versión del método {run.formulaVersion}</span></div>
          <span>{Object.values(run.outputs).slice(0, 1).map(formatOutput).join('')}</span>
          <button type="button" onClick={() => onRemove(run.id)} aria-label={`Eliminar ${run.title}`}><Trash2 size={15} /></button>
        </article>
      ))}
    </section>
  )
}

function SourceCards({ sourceIds }: { sourceIds: string[] }) {
  return (
    <section className="engineering-sources">
      <span className="academy-kicker">FUENTES Y VERIFICACIÓN</span>
      <div>{sourceIds.map((sourceId) => {
        const source = engineeringSource(sourceId)
        if (!source) return null
        return <article key={source.id}><strong>{source.title}</strong><p>{source.publisherOrAuthor} · {source.locator}</p>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Abrir fuente</a>}</article>
      })}</div>
    </section>
  )
}

export function EngineeringLabSurface() {
  const { snapshot } = useLearning()
  const [active, setActive] = useState<LabId>(() => normalizeEngineeringLabId(snapshot.location.query.station))
  const [result, setResult] = useState<{ run?: EngineeringCalculationRun; error?: string }>({})
  const projectId = snapshot.location.query.project || `academy.${snapshot.profile?.id ?? 'local'}`
  const [notebook, setNotebook] = useState(() => readEngineeringNotebook(projectId))
  const activeLab = LABS.find(({ id }) => id === active) ?? LABS[0]
  const sourceIds = useMemo(() => [...new Set(ENGINEERING_SOURCES.map(({ id }) => id))], [])
  const exploredFormulaIds = useMemo(() => new Set(notebook.runs.map(({ formulaId }) => formulaId)), [notebook.runs])
  const exploredLabs = LABS.filter(({ id }) => {
    const formulaId = ({
      'gear-train': 'horology.gear-train.compound-ideal',
      oscillator: 'horology.oscillator.torsional',
      mainspring: 'horology.mainspring.rectangular-strip',
      tolerances: 'metrology.stack.linear',
      capability: 'metrology.process-capability.normal',
      reliability: 'statistics.weibull.two-parameter',
    } as Record<LabId, string>)[id]
    return exploredFormulaIds.has(formulaId)
  }).length
  const switchLab = (labId: LabId) => {
    setActive(labId)
    setResult({})
  }
  const save = (run: EngineeringCalculationRun) => setNotebook(saveEngineeringRun(projectId, run))
  const remove = (runId: string) => setNotebook(removeEngineeringRun(projectId, runId))

  return (
    <div className="academy-page engineering-lab-page">
      <header className="academy-page-header">
        <div>
          <span className="academy-kicker">LABORATORIO DE INGENIERÍA RELOJERA</span>
          <h1>De comprender un mecanismo a justificar un diseño</h1>
          <p>Calculadoras para aprender física, matemáticas y metrología paso a paso. Cada resultado conserva los datos usados, los supuestos y lo que todavía no permite afirmar.</p>
        </div>
      </header>
      <aside className="engineering-boundary">
        <ShieldAlert size={20} />
        <div><strong>Qué puedes concluir</strong><span>Estos resultados sirven para estudiar y comparar hipótesis. Fabricación, seguridad, estanqueidad, marcha y vida útil necesitan medidas reales y una comprobación física.</span></div>
      </aside>
      <section className="engineering-exploration-progress">
        <div><span className="academy-kicker">TU RECORRIDO POR LOS CÁLCULOS</span><strong>{exploredLabs} de {LABS.length} estaciones estudiadas</strong></div>
        <progress max={LABS.length} value={exploredLabs} aria-label={`${exploredLabs} de ${LABS.length} estaciones documentadas`} />
        <p>Guardar un cálculo conserva tu razonamiento, pero la comprensión se comprueba después con una actividad independiente.</p>
      </section>
      <nav className="engineering-lab-tabs" aria-label="Estaciones del laboratorio">
        {LABS.map(({ id, title, icon: Icon }) => <button type="button" className={active === id ? 'is-active' : undefined} aria-pressed={active === id} onClick={() => switchLab(id)} key={id}><Icon size={17} /><span>{title}</span></button>)}
      </nav>
      <StudyPrimer lab={activeLab} />
      <div className="engineering-workbench">
        <section>
          <span className="academy-kicker">BANCO DE CÁLCULO</span>
          <h2>{activeLab.title}</h2>
          <LabForm active={active} onRun={(run, error) => setResult({ run, error })} />
        </section>
        <ResultPanel run={result.run} error={result.error} onSave={save} />
      </div>
      <NotebookPanel projectId={projectId} runs={notebook.runs} onRemove={remove} />
      <SourceCards sourceIds={sourceIds} />
    </div>
  )
}

export default EngineeringLabSurface
