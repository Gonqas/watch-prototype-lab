import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  CloudOff,
  Contrast,
  GraduationCap,
  MonitorSmartphone,
  RotateCcw,
  ShieldAlert,
  TextCursorInput,
  X,
} from 'lucide-react'
import './AcademyUxHarness.css'

type HarnessScenario =
  | 'default'
  | 'new'
  | 'active'
  | 'completed'
  | 'blocked'
  | 'error'
  | 'offline'
  | 'recovered'
  | 'incompatible'
  | 'reduced-motion'
  | 'high-contrast'
  | 'large-text'
  | 'narrow'

interface AcademyHarnessApi {
  open(surface: string, id?: string, query?: Record<string, string>): void
  scenario(value: HarnessScenario): void
  current(): HarnessScenario
}

declare global {
  interface Window {
    __WPLAB_ACADEMY_HARNESS__?: AcademyHarnessApi
  }
}

const journeys = [
  ['Inicio', 'home'],
  ['Mi aprendizaje', 'my-learning'],
  ['Explorar', 'explore'],
  ['Ruta real', 'route', 'route.miyota8215.complete'],
  ['Lección real', 'lesson', 'lesson.miyota8215.identify'],
  ['Taller', 'workshop'],
  ['Atlas', 'atlas'],
  ['Repaso', 'review'],
  ['Progreso', 'progress'],
  ['Buscar áncora', 'search', undefined, 'áncora'],
  ['Cuaderno', 'notebook'],
  ['Preferencias', 'preferences'],
] as const

const scenarioInfo: Array<{
  id: HarnessScenario
  label: string
  detail: string
  icon: typeof GraduationCap
}> = [
  { id: 'new', label: 'Vacío / nuevo', detail: 'Orientación y recomendación inicial', icon: GraduationCap },
  { id: 'active', label: 'Parcial / activo', detail: 'Ruta y sesión en curso', icon: RotateCcw },
  { id: 'completed', label: 'Completado', detail: 'Hito con evidencia', icon: CheckCircle2 },
  { id: 'blocked', label: 'Bloqueado', detail: 'Prerrequisito explicable', icon: ShieldAlert },
  { id: 'error', label: 'Error recuperable', detail: 'Datos conservados y acción', icon: CircleAlert },
  { id: 'offline', label: 'Offline', detail: 'Contenido local disponible', icon: CloudOff },
  { id: 'recovered', label: 'Sesión recuperada', detail: 'Checkpoint y contexto', icon: RotateCcw },
  { id: 'incompatible', label: 'Incompatible', detail: 'Versión y diagnóstico', icon: ShieldAlert },
  { id: 'reduced-motion', label: 'Reduced motion', detail: 'Estados discretos', icon: MonitorSmartphone },
  { id: 'high-contrast', label: 'Alto contraste', detail: 'Contornos y foco reforzados', icon: Contrast },
  { id: 'large-text', label: 'Texto ampliado', detail: 'Escala 150 %', icon: TextCursorInput },
  { id: 'narrow', label: 'Ventana estrecha', detail: 'Composición de 700 px', icon: MonitorSmartphone },
]

function navigate(surface: string, id?: string, query?: Record<string, string>) {
  const path = `#/learning/${surface}${id ? `/${encodeURIComponent(id)}` : ''}`
  const encoded = query ? new URLSearchParams(query).toString() : ''
  window.location.hash = `${path}${encoded ? `?${encoded}` : ''}`
}

export default function AcademyUxHarness() {
  const [open, setOpen] = useState(true)
  const [scenario, setScenario] = useState<HarnessScenario>('default')

  useEffect(() => {
    const api: AcademyHarnessApi = {
      open: navigate,
      scenario: setScenario,
      current: () => scenario,
    }
    window.__WPLAB_ACADEMY_HARNESS__ = api
    document.documentElement.dataset.academyHarnessScenario = scenario
    return () => {
      delete window.__WPLAB_ACADEMY_HARNESS__
      delete document.documentElement.dataset.academyHarnessScenario
    }
  }, [scenario])

  return (
    <aside className={`academy-ux-harness ${open ? 'is-open' : ''}`} aria-label="Galería de desarrollo de Academia">
      <header>
        <div><strong>Academy UX Harness</strong><span>Solo desarrollo · no modifica datos educativos</span></div>
        <button type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Cerrar harness' : 'Abrir harness'}>{open ? <X size={16} /> : <GraduationCap size={16} />}</button>
      </header>
      {open && (
        <div className="academy-ux-harness__body">
          <section>
            <h2>Recorridos reales</h2>
            <div className="academy-ux-harness__journeys">
              {journeys.map(([label, surface, id, query]) => (
                <button type="button" key={label} onClick={() => navigate(surface, id, query ? { q: query } : undefined)}>{label}</button>
              ))}
            </div>
          </section>
          <section>
            <h2>Estados deterministas</h2>
            <div className="academy-ux-harness__states">
              {scenarioInfo.map(({ id, label, detail, icon: Icon }) => (
                <button type="button" className={scenario === id ? 'is-active' : undefined} aria-pressed={scenario === id} onClick={() => setScenario(id)} key={id}>
                  <Icon size={15} /><span><strong>{label}</strong><small>{detail}</small></span>
                </button>
              ))}
            </div>
            <button className="academy-ux-harness__reset" type="button" onClick={() => setScenario('default')}>Restablecer presentación</button>
          </section>
          <section className={`academy-ux-harness__sample is-${scenario}`}>
            <span>PREVISUALIZACIÓN · {scenario === 'default' ? 'NORMAL' : scenario.toUpperCase()}</span>
            <strong>{scenario === 'error' ? 'La vista no ha podido cargarse' : scenario === 'blocked' ? 'Prerrequisito pendiente' : scenario === 'offline' ? 'Disponible sin conexión' : 'Estado educativo visible'}</strong>
            <p>{scenario === 'error' ? 'La sesión y el proyecto permanecen a salvo. Reintenta o abre el diagnóstico.' : 'Texto, icono, forma y acción acompañan siempre al color.'}</p>
          </section>
        </div>
      )}
    </aside>
  )
}
