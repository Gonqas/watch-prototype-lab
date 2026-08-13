import { useEffect, useMemo, useState } from 'react'
import { useStudioStore } from '../../vnext/store'
import {
  LearningDevelopmentHarness,
  type DevelopmentBridgeMode,
  type DevelopmentFixtureId,
  type DevelopmentPackageId,
  type LearningHarnessSnapshot,
} from '../runtime/developmentHarness'

declare global {
  interface Window {
    __WPLAB_LEARNING_HARNESS__?: LearningDevelopmentHarness
  }
}

const sceneOptions = [
  'scene.v5-reversible',
  'scene.v6-repeated',
  'scene.miyota-reference',
  'scene.invalid-runtime',
]

export default function LearningRuntimeHarness() {
  const project = useStudioStore((state) => state.project)
  const harness = useMemo(() => new LearningDevelopmentHarness(project), [project])
  const [fixture, setFixture] = useState<DevelopmentFixtureId>('active-v5')
  const [learningPackage, setLearningPackage] = useState<DevelopmentPackageId>('integrated-contract')
  const [scene, setScene] = useState('scene.v5-reversible')
  const [bridge, setBridge] = useState<DevelopmentBridgeMode>('studio')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [snapshot, setSnapshot] = useState<LearningHarnessSnapshot>(() => harness.snapshot())
  const [error, setError] = useState<string | null>(null)
  const refresh = () => setSnapshot(harness.snapshot())
  const run = async (action: () => Promise<void>) => {
    setError(null)
    try { await action() } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)) }
    refresh()
  }

  useEffect(() => {
    window.__WPLAB_LEARNING_HARNESS__ = harness
    return () => {
      if (window.__WPLAB_LEARNING_HARNESS__ === harness) delete window.__WPLAB_LEARNING_HARNESS__
      void harness.dispose()
    }
  }, [harness])

  return (
    <aside
      aria-label="Arnés de desarrollo del runtime educativo"
      style={{ position: 'fixed', zIndex: 1000, inset: '70px 16px auto auto', width: 390, maxHeight: 'calc(100vh - 100px)', overflow: 'auto', padding: 14, background: '#101719ee', color: '#e8f2f2', border: '1px solid #47646a', borderRadius: 8, font: '12px/1.4 system-ui' }}
    >
      <strong style={{ display: 'block', marginBottom: 8 }}>Learning runtime · DEV</strong>
      <label>Fixture <select value={fixture} onChange={(event) => setFixture(event.target.value as DevelopmentFixtureId)}><option value="active-v5">Proyecto activo v5</option><option value="minimal-v6">Ensamblaje v6</option><option value="miyota-8215">MIYOTA documental</option></select></label>{' '}
      <label style={{ display: 'block', marginTop: 6 }}>Paquete <select value={learningPackage} onChange={(event) => setLearningPackage(event.target.value as DevelopmentPackageId)}><option value="integrated-contract">Integrado contractual</option><option value="local-unsigned-contract">Local sin firma</option></select></label>
      <label>Bridge <select value={bridge} onChange={(event) => setBridge(event.target.value as DevelopmentBridgeMode)}><option value="studio">Studio</option><option value="headless">Headless</option></select></label>
      <label style={{ display: 'block', marginTop: 6 }}>Escena <select value={scene} onChange={(event) => setScene(event.target.value)}>{sceneOptions.map((id) => <option key={id}>{id}</option>)}</select></label>
      <label style={{ display: 'block', marginTop: 6 }}><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Movimiento reducido</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
        <button type="button" onClick={() => void run(async () => { await harness.configure(fixture, scene, bridge, learningPackage); await harness.loadAndCompile(reducedMotion) })}>Cargar + compilar</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'start-scene' }))}>Iniciar</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'pause' }))}>Pausa</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'resume' }))}>Reanudar</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'next-step' }))}>Siguiente</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'previous-step' }))}>Anterior</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'scrub', timeMs: 2_000 }))}>Scrub 2 s</button>
        <button type="button" onClick={() => void run(() => harness.command({ type: 'cancel', reason: 'manual-harness' }))}>Cancelar</button>
        <button type="button" onClick={() => void run(() => harness.provokeFailure())}>Provocar fallo</button>
        <button type="button" onClick={refresh}>Actualizar</button>
      </div>
      {error && <p role="alert" style={{ color: '#ff9b9b' }}>{error}</p>}
      <details open><summary>Estado y capacidades</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ state: snapshot.state, capabilities: snapshot.capabilities, overlay: snapshot.overlay }, null, 2)}</pre></details>
      <details><summary>Plan compilado</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot.plan, null, 2)}</pre></details>
      <details><summary>Diagnósticos</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot.diagnostics, null, 2)}</pre></details>
      <details><summary>Eventos</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(snapshot.events, null, 2)}</pre></details>
    </aside>
  )
}
