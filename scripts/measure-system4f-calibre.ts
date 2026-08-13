import { mkdir, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { join } from 'node:path'
import { CalibreLearningLab, restoreCalibreLearningLab } from '../src/learning/calibre'
import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../src/learning/technical/fixtures'

async function measure<T>(operation: () => T | Promise<T>): Promise<{ durationMs: number; value: T }> {
  const start = performance.now()
  const value = await operation()
  return { durationMs: performance.now() - start, value }
}

const load = await measure(() => new CalibreLearningLab('free', true))
const lab = load.value
const selectSubsystem = await measure(() => lab.dispatch({
  id: 'perf-subsystem',
  type: 'select-subsystem',
  subsystemId: 'subsystem.8215.automatic',
}))
const explodedView = await measure(() => lab.dispatch({ id: 'perf-view', type: 'change-view', viewMode: 'exploded' }))
await lab.dispatch({ id: 'perf-identify', type: 'identify-calibre' })
await lab.dispatch({ id: 'perf-docs', type: 'review-documentation', sourceIds: [...MIYOTA_8215_TECHNICAL_FIXTURE.sourceIds] })
const disassemblyOperationId = lab.operations.find(({ phase, action }) => phase === 'disassembly' && action === 'remove')!.id
const plan = await measure(() => lab.dispatch({ id: 'perf-plan', type: 'create-disassembly-plan', operationIds: [disassemblyOperationId] }))
await lab.workbenchCommand({ id: 'perf-prepare', type: 'prepare-workbench' })
await lab.workbenchCommand({ id: 'perf-energy', type: 'isolate-energy' })
const screw = lab.workbench.parts().find(({ officialReference }) => officialReference === '925-490')!
const removeAndTray = await measure(async () => {
  await lab.workbenchCommand({ id: 'perf-loosen', type: 'loosen-fastener', instanceId: screw.instanceId, toolId: 'tool.screwdriver', fitConfirmed: true })
  await lab.workbenchCommand({ id: 'perf-remove', type: 'remove-part', instanceId: screw.instanceId, toolId: 'tool.screwdriver' })
  await lab.workbenchCommand({ id: 'perf-tray', type: 'place-in-tray', instanceId: screw.instanceId, toolId: 'tool.tweezers', trayZoneId: 'tray.zone.1' })
})
const inspect = await measure(() => lab.dispatch({ id: 'perf-inspect', type: 'inspect', instanceId: screw.instanceId, defect: 'dirt' }))
const verify = await measure(() => lab.dispatch({ id: 'perf-verify', type: 'verify', kind: 'rotor-presence' }))
const contextual = await measure(async () => {
  await lab.dispatch({ id: 'perf-context-open', type: 'open-contextual-lab', lab: 'automatic' })
  await lab.mechanicalLab.dispatch({ id: 'perf-auto', type: 'enable-automatic', reversal: 'unidirectional' })
  await lab.dispatch({ id: 'perf-context-close', type: 'close-contextual-lab' })
})
const serialized = lab.serialize()
const restore = await measure(() => restoreCalibreLearningLab(serialized))

const report = {
  measuredAt: '2026-07-27',
  environment: 'Node headless; dominio semántico del calibre, sin renderer GPU',
  durationsMs: {
    loadCalibreLab: load.durationMs,
    selectSubsystem: selectSubsystem.durationMs,
    changeToExplodedView: explodedView.durationMs,
    createDisassemblyPlan: plan.durationMs,
    removeFastenerAndPlaceInTray: removeAndTray.durationMs,
    inspectInstance: inspect.durationMs,
    partialVerification: verify.durationMs,
    contextualMechanicalRoundTrip: contextual.durationMs,
    restoreSnapshot: restore.durationMs,
  },
  counts: {
    definitions: new Set(lab.audits.map(({ canonicalId }) => canonicalId)).size,
    instances: lab.audits.length,
    operations: lab.operations.length,
    dependencies: lab.dependencies.length,
    subsystems: lab.subsystems.length,
    events: lab.events().length,
    snapshotBytesUtf8: Buffer.byteLength(serialized, 'utf8'),
    geometryPrimitives: MIYOTA_8215_TECHNICAL_FIXTURE.geometry.length,
    materials: null,
    drawCalls: null,
    gpuMemoryBytes: null,
  },
  recoveryChecks: {
    sameFixtureFingerprint: restore.value.fixtureFingerprint === lab.fixtureFingerprint,
    sameInstanceCount: restore.value.snapshot().workbench.parts.length === lab.snapshot().workbench.parts.length,
    sameEventCount: restore.value.events().length === lab.events().length,
    fastenerStillInTray: restore.value.snapshot().workbench.parts
      .find(({ instanceId }) => instanceId === screw.instanceId)?.state === 'placed-in-tray',
  },
  limitations: [
    'Los tiempos son una muestra diagnóstica local, no un presupuesto garantizado.',
    'Materiales, draw calls y memoria GPU requieren instrumentación del renderer y quedan no medidos.',
    'No se mide física, lubricación, desgaste, tolerancias, par, marcha ni diagnóstico de una unidad real.',
  ],
}

const output = join(process.cwd(), 'learning-content', 'miyota8215', 'dist')
await mkdir(output, { recursive: true })
await writeFile(join(output, 'performance.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
const rows = Object.entries(report.durationsMs).map(([name, value]) => `| ${name} | ${value.toFixed(3)} |`).join('\n')
await writeFile(join(output, 'performance.md'), `# Rendimiento del laboratorio MIYOTA 8215

Entorno: ${report.environment}

| Operación | ms |
|---|---:|
${rows}

Definiciones: ${report.counts.definitions}; instancias: ${report.counts.instances}; operaciones: ${report.counts.operations}; dependencias: ${report.counts.dependencies}; snapshot: ${report.counts.snapshotBytesUtf8} bytes.

Materiales, draw calls y memoria GPU: no medidos en Node headless.

## Recuperación

${Object.entries(report.recoveryChecks).map(([key, value]) => `- ${key}: ${value ? 'correcto' : 'fallido'}`).join('\n')}

## Limitaciones

${report.limitations.map((item) => `- ${item}`).join('\n')}
`, 'utf8')
console.log(JSON.stringify(report, null, 2))
