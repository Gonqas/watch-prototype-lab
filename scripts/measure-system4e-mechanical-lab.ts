import { mkdir, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { join } from 'node:path'
import {
  MechanicalLearningLab,
  restoreMechanicalLearningLab,
} from '../src/learning/mechanical'

async function measure<T>(operation: () => T | Promise<T>): Promise<{ durationMs: number; value: T }> {
  const start = performance.now()
  const value = await operation()
  return { durationMs: performance.now() - start, value }
}

const load = await measure(() => new MechanicalLearningLab(true))
const lab = load.value
const wind = await measure(() => lab.dispatch({ id: 'perf-wind', type: 'wind', amount: 0.8 }))
const pair = await measure(() => lab.dispatch({
  id: 'perf-ratio',
  type: 'change-ratio',
  stageId: 'stage.barrel-center',
  driverTeeth: 72,
  drivenTeeth: 12,
}))
const recalculate = await measure(() => lab.totalGearRatio())
const timeline = await measure(async () => {
  for (let index = 0; index < 8; index += 1) {
    await lab.dispatch({ id: `perf-phase-${index}`, type: 'step-escapement' })
  }
})
const serialized = lab.serialize()
const restore = await measure(() => restoreMechanicalLearningLab(serialized))
const reconfigure = await measure(async () => {
  const restored = restore.value
  await restored.dispatch({ id: 'perf-osc', type: 'set-oscillator', frequencyHz: 4, amplitudeDegrees: 220 })
  await restored.dispatch({ id: 'perf-crown', type: 'change-crown-position', position: 'time-setting' })
  await restored.dispatch({ id: 'perf-auto', type: 'enable-automatic', reversal: 'bidirectional' })
  await restored.dispatch({ id: 'perf-date', type: 'advance-calendar', days: 1 })
})

const report = {
  measuredAt: '2026-07-27',
  environment: 'Node headless; dominio mecánico y cálculos, sin renderer GPU',
  durationsMs: {
    loadLab: load.durationMs,
    wind: wind.durationMs,
    changeRatio: pair.durationMs,
    recalculateTrain: recalculate.durationMs,
    eightEscapementPhases: timeline.durationMs,
    restoreSnapshot: restore.durationMs,
    reconfigureFunctions: reconfigure.durationMs,
  },
  counts: {
    entities: lab.entities.length,
    kinematicRelations: lab.kinematicRelations.length,
    energySegments: lab.energyGraph.length,
    gearStages: lab.snapshot().gearStages.length,
    snapshotBytesUtf8: Buffer.byteLength(serialized, 'utf8'),
    materials: null,
    drawCalls: null,
    gpuMemoryBytes: null,
  },
  limitations: [
    'Los tiempos son una muestra diagnóstica, no un presupuesto garantizado.',
    'Materiales, draw calls y memoria GPU requieren instrumentación del renderer y quedan no medidos.',
    'No se mide física, servicio ni montaje de un MIYOTA 8215.',
  ],
}

const output = join(process.cwd(), 'learning-content', 'mechanical-foundations', 'dist')
await mkdir(output, { recursive: true })
await writeFile(join(output, 'mechanical-performance.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
const rows = Object.entries(report.durationsMs).map(([name, value]) => `| ${name} | ${value.toFixed(3)} |`).join('\n')
await writeFile(join(output, 'mechanical-performance.md'), `# Rendimiento del laboratorio mecánico

Entorno: ${report.environment}

| Operación | ms |
|---|---:|
${rows}

Entidades: ${report.counts.entities}; relaciones cinemáticas: ${report.counts.kinematicRelations}; tramos energéticos: ${report.counts.energySegments}; snapshot: ${report.counts.snapshotBytesUtf8} bytes.

Materiales, draw calls y memoria GPU: no medidos en Node headless.

## Limitaciones

${report.limitations.map((item) => `- ${item}`).join('\n')}
`, 'utf8')
console.log(JSON.stringify(report, null, 2))
