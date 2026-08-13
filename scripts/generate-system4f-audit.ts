import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CalibreLearningLab } from '../src/learning/calibre'
import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../src/learning/technical/fixtures'

const contentRoot = join(process.cwd(), 'learning-content', 'miyota8215')
const generatedRoot = join(contentRoot, 'generated')
const distRoot = join(contentRoot, 'dist')
await Promise.all([mkdir(generatedRoot, { recursive: true }), mkdir(distRoot, { recursive: true })])

const lab = new CalibreLearningLab('guided', true, () => '2026-07-27T00:00:00.000Z')
const graphReport = ([
  ['disassembly', lab.disassembly],
  ['assembly', lab.assembly],
  ['structure', lab.structure],
  ['function', lab.function],
] as const).map(([kind, graph]) => ({
  kind,
  edgeCount: graph.edges().length,
  blockingEdgeCount: graph.edges().filter(({ blocking }) => blocking).length,
  cycles: graph.diagnoseCycles(),
}))

const audit = {
  schemaVersion: 1,
  generatedAt: '2026-07-27',
  fixture: {
    id: lab.fixtureId,
    version: lab.fixtureVersion,
    fingerprint: lab.fixtureFingerprint,
    reconstructionLevel: MIYOTA_8215_TECHNICAL_FIXTURE.reconstructionLevel,
    fidelity: MIYOTA_8215_TECHNICAL_FIXTURE.fidelity,
    sourceIds: MIYOTA_8215_TECHNICAL_FIXTURE.sourceIds,
    definitions: MIYOTA_8215_TECHNICAL_FIXTURE.assembly.definitions.length,
    instances: MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.length,
    geometryPrimitives: MIYOTA_8215_TECHNICAL_FIXTURE.geometry.length,
    relations: MIYOTA_8215_TECHNICAL_FIXTURE.relations.length,
    selectors: MIYOTA_8215_TECHNICAL_FIXTURE.selectors.length,
  },
  readiness: Object.fromEntries(['ready', 'usable-with-limitations', 'documentary-only', 'blocked', 'unknown']
    .map((readiness) => [readiness, lab.audits.filter((entry) => entry.readiness === readiness).length])),
  instances: lab.audits,
  subsystems: lab.subsystems,
  graphs: graphReport,
  policy: {
    singleAssembly: true,
    officialProcedureClaimed: false,
    operationAuthorityRequired: true,
    conceptualPhysicsSeparated: true,
    physicalDiagnosisClaimed: false,
    unknownDimensionsInvented: false,
  },
}

const operationMatrix = {
  schemaVersion: 1,
  generatedAt: '2026-07-27',
  fixtureId: lab.fixtureId,
  operations: lab.operations,
  dependencies: lab.dependencies,
  counts: {
    operations: lab.operations.length,
    dependencies: lab.dependencies.length,
    byPhase: Object.fromEntries([...new Set(lab.operations.map(({ phase }) => phase))]
      .map((phase) => [phase, lab.operations.filter((operation) => operation.phase === phase).length])),
    byAuthority: Object.fromEntries([...new Set(lab.operations.map(({ authority }) => authority))]
      .map((authority) => [authority, lab.operations.filter((operation) => operation.authority === authority).length])),
    publishedAsOfficial: lab.operations.filter(({ publishedAsOfficial }) => publishedAsOfficial).length,
  },
}

await Promise.all([
  writeFile(join(generatedRoot, 'miyota8215-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8'),
  writeFile(join(generatedRoot, 'miyota8215-operation-matrix.json'), `${JSON.stringify(operationMatrix, null, 2)}\n`, 'utf8'),
])

const instanceRows = lab.audits.map((entry) =>
  `| \`${entry.instanceId}\` | \`${entry.canonicalId}\` | ${entry.officialReference ?? '—'} | ${entry.nameEs} / ${entry.nameEn} | ${entry.subsystem} | ${entry.reconstructionLevel} | ${entry.geometryAvailable ? entry.geometryShape ?? 'sí' : 'no'} | ${entry.readiness} | ${entry.fidelity.geometry}/${entry.fidelity.kinematics}/${entry.fidelity.physics} | ${entry.sourceIds.join(', ') || '—'} | ${entry.removalDependencyIds.length}/${entry.installationDependencyIds.length} | ${entry.limitations.join(' ') || '—'} |`,
).join('\n')
const auditMarkdown = `# Auditoría canónica MIYOTA 8215 · Sistema 4F

Fecha: 2026-07-27

## Resultado

- ensamblaje único: \`${lab.fixtureId}@${lab.fixtureVersion}\`;
- ${audit.fixture.definitions} definiciones, ${audit.fixture.instances} instancias y ${audit.fixture.geometryPrimitives} primitivas;
- disponibilidad: ${Object.entries(audit.readiness).map(([key, value]) => `${key} ${value}`).join('; ')};
- ${lab.dependencies.length} dependencias repartidas en grafos de desmontaje, montaje, estructura y función;
- ninguna operación se publica como procedimiento oficial;
- el diagnóstico y los defectos son simulación educativa reversible P0.

## Grafos separados

| Grafo | Aristas | Bloqueantes | Ciclos |
|---|---:|---:|---:|
${graphReport.map(({ kind, edgeCount, blockingEdgeCount, cycles }) => `| ${kind} | ${edgeCount} | ${blockingEdgeCount} | ${cycles.length} |`).join('\n')}

## Ledger por instancia

| Instancia | Definición | Ref. | Nombre ES / EN | Subsistema | R | Geometría | Aptitud | G/K/P | Fuentes | deps D/M | Limitaciones |
|---|---|---|---|---|---|---|---|---|---|---:|---|
${instanceRows}
`
await writeFile(join(generatedRoot, 'miyota8215-audit.md'), auditMarkdown, 'utf8')

const operationRows = lab.operations.map((operation) =>
  `| \`${operation.id}\` | ${operation.phase} | ${operation.action} | ${operation.instanceId ?? operation.subsystem ?? 'global'} | ${operation.authority} | ${operation.requiredToolIds.join(', ') || '—'} | ${operation.dependencyIds.join(', ') || '—'} | ${operation.sourceIds.join(', ') || '—'} | ${operation.limitations.join(' ') || '—'} |`,
).join('\n')
const operationMarkdown = `# Matriz de operaciones y autoridad · MIYOTA 8215

Ninguna fila de esta matriz constituye un procedimiento oficial de servicio. Cada operación declara su autoridad y sus límites.

| ID | Fase | Acción | Destino | Autoridad | Herramientas | Dependencias | Fuentes | Límites |
|---|---|---|---|---|---|---|---|---|
${operationRows}
`
await Promise.all([
  writeFile(join(generatedRoot, 'miyota8215-operation-matrix.md'), operationMarkdown, 'utf8'),
  writeFile(join(distRoot, 'operation-authority-report.md'), operationMarkdown, 'utf8'),
])

const calibreReport = `# Informe del laboratorio de calibre MIYOTA 8215

## Contrato ejecutable

- fixture estructural R2: \`${lab.fixtureId}\`;
- identidad conservada para ${lab.audits.length} instancias;
- ${lab.subsystems.length} subsistemas semánticos;
- ${lab.operations.length} operaciones con autoridad explícita;
- ${lab.dependencies.length} dependencias en cuatro grafos separados;
- 15 fallos reversibles y 12 tipos de comprobación parcial;
- modos guided, assisted y free;
- persistencia conjunta de banco, laboratorio contextual, inspecciones, fallos, hipótesis, proyecto y eventos;
- alternativa textual completa y reduced motion sin rebajar la evaluación.

## Separación de autoridad

Los datos oficiales, las relaciones documentadas, las dependencias estructurales, las secuencias educativas, las inferencias, las observaciones propias y la simulación permanecen diferenciados. El laboratorio conceptual no transfiere dientes, par, tolerancias o física al 8215.

## Subsistemas

${lab.subsystems.map(({ id, label, instanceIds, operationIds, fidelity, limitations }) =>
  `- **${label}** (\`${id}\`): ${instanceIds.length} instancias; ${operationIds.length} operaciones; ${fidelity.geometry}/${fidelity.kinematics}/${fidelity.physics}. ${limitations.join(' ')}`).join('\n')}

## Límites

- no hay procedimiento oficial de desmontaje o montaje;
- no hay especificaciones de lubricación, par o tolerancias;
- no hay diagnóstico de una unidad física;
- no se infieren dimensiones desde imágenes;
- R0/R1 se mantienen documentales o limitados aunque exista una envolvente visual.
`
await writeFile(join(distRoot, 'calibre-report.md'), calibreReport, 'utf8')

console.log(JSON.stringify({
  definitions: audit.fixture.definitions,
  instances: audit.fixture.instances,
  operations: lab.operations.length,
  dependencies: lab.dependencies.length,
  graphCycles: graphReport.reduce((sum, graph) => sum + graph.cycles.length, 0),
  officialProceduresClaimed: operationMatrix.counts.publishedAsOfficial,
}, null, 2))
