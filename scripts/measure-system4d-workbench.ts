import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { MIYOTA_2035_TECHNICAL_FIXTURE } from '../src/learning/technical/fixtures'
import { restoreVirtualWorkbench, VirtualWorkbench } from '../src/learning/workbench'

async function measure<T>(operation: () => T | Promise<T>): Promise<{ durationMs: number; value: T }> {
  const start = performance.now()
  const value = await operation()
  return { durationMs: performance.now() - start, value }
}

const created = await measure(() => new VirtualWorkbench(MIYOTA_2035_TECHNICAL_FIXTURE))
const workbench = created.value
const fastener = workbench.parts().find(({ fastener: value, state }) => value && state === 'installed')
if (!fastener) throw new Error('No existe un tornillo manipulable para la medición.')

const preparation = await measure(async () => {
  await workbench.dispatch({ id: 'perf.prepare', type: 'prepare-workbench' })
  await workbench.dispatch({ id: 'perf.energy', type: 'isolate-energy' })
})
const stepChange = await measure(() => workbench.dispatch({
  id: 'perf.select',
  type: 'select-part',
  instanceId: fastener.instanceId,
}))
const disassembly = await measure(async () => {
  await workbench.dispatch({
    id: 'perf.loosen',
    type: 'loosen-fastener',
    instanceId: fastener.instanceId,
    toolId: 'tool.screwdriver',
    fitConfirmed: true,
  })
  await workbench.dispatch({
    id: 'perf.remove',
    type: 'remove-part',
    instanceId: fastener.instanceId,
    toolId: 'tool.screwdriver',
  })
  await workbench.dispatch({
    id: 'perf.tray',
    type: 'place-in-tray',
    instanceId: fastener.instanceId,
    toolId: 'tool.tweezers',
    trayZoneId: 'tray.zone.1',
  })
})
const serialized = workbench.serialize()
const reopening = await measure(() => restoreVirtualWorkbench(MIYOTA_2035_TECHNICAL_FIXTURE, serialized))
const restoredWorkbench = reopening.value
const beforeRestore = restoredWorkbench.snapshot()
await restoredWorkbench.dispatch({
  id: 'perf.rotate',
  type: 'rotate-part',
  instanceId: fastener.instanceId,
  toolId: 'tool.tweezers',
  orientation: 'top-up',
})
const restoration = await measure(() => restoredWorkbench.restore(beforeRestore))
const partialAssembly = await measure(async () => {
  await restoredWorkbench.dispatch({
    id: 'perf.align',
    type: 'align-part',
    instanceId: fastener.instanceId,
    toolId: 'tool.tweezers',
    orientation: 'as-installed',
  })
  await restoredWorkbench.dispatch({
    id: 'perf.install',
    type: 'tighten-fastener',
    instanceId: fastener.instanceId,
    toolId: 'tool.screwdriver',
    fitConfirmed: true,
  })
  await restoredWorkbench.dispatch({ id: 'perf.verify', type: 'verify-part', instanceId: fastener.instanceId })
})

const result = {
  measuredAt: '2026-07-27',
  environment: 'Node headless; medición contractual del dominio, no GPU',
  fixtureId: MIYOTA_2035_TECHNICAL_FIXTURE.id,
  durationsMs: {
    loadWorkbench: created.durationMs,
    prepareWorkbench: preparation.durationMs,
    changeStepSelection: stepChange.durationMs,
    disassembleOneFastenerToTray: disassembly.durationMs,
    restoreSnapshot: restoration.durationMs,
    reopenCheckpoint: reopening.durationMs,
    reassembleAndVerifyOneFastener: partialAssembly.durationMs,
    completeAssembly: null,
  },
  counts: {
    canonicalInstances: workbench.parts().length,
    manipulableInstances: workbench.parts().filter(({ state }) => !['blocked', 'unknown'].includes(state)).length,
    tools: workbench.tools.length,
    zones: workbench.zones.length,
    trayZones: workbench.trayZones().length,
    dependencyEdges: workbench.disassembly.dependencies().length + workbench.assembly.dependencies().length,
    snapshotBytesUtf8: new TextEncoder().encode(serialized).byteLength,
    sceneObjects: MIYOTA_2035_TECHNICAL_FIXTURE.geometry.length,
    measuredDrawCalls: null,
    measuredGpuMemoryBytes: null,
  },
  limitations: [
    'No se mide montaje completo porque el fixture solo declara una secuencia parcial y no debe fingirse una secuencia de servicio.',
    'Draw calls y memoria GPU requieren instrumentación del renderer en una ejecución gráfica; se declaran no medidos.',
    'Los tiempos son una muestra diagnóstica local, no un presupuesto de rendimiento garantizado.',
  ],
}

const output = resolve('learning-content/quartz-miyota2035/dist')
await mkdir(output, { recursive: true })
await Promise.all([
  writeFile(resolve(output, 'workbench-performance.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8'),
  writeFile(resolve(output, 'workbench-performance.md'), `# Rendimiento del banco virtual

Entorno: ${result.environment}

| Operación | ms |
|---|---:|
${Object.entries(result.durationsMs).map(([key, value]) => `| ${key} | ${value === null ? 'no representable con la secuencia actual' : value.toFixed(3)} |`).join('\n')}

Objetos: ${result.counts.sceneObjects}; identidades: ${result.counts.canonicalInstances}; manipulables: ${result.counts.manipulableInstances}; snapshot: ${result.counts.snapshotBytesUtf8} bytes. Draw calls y memoria GPU: no medidos en el runner headless.

## Limitaciones

${result.limitations.map((value) => `- ${value}`).join('\n')}
`, 'utf8'),
])
console.log(JSON.stringify(result, null, 2))

