import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ProjectEntityIndex } from '../src/learning/canonical'
import { SemanticSelectorResolver } from '../src/learning/runtime/selectors'
import { MIYOTA_2035_TECHNICAL_FIXTURE } from '../src/learning/technical/fixtures'
import { createWorkbenchDependencies, createWorkbenchParts } from '../src/learning/workbench/fixture2035'

const fixture = MIYOTA_2035_TECHNICAL_FIXTURE
const output = resolve('learning-content/quartz-miyota2035/generated')
const index = new ProjectEntityIndex(fixture.assembly)
const resolver = new SemanticSelectorResolver(index)
const dependencies = createWorkbenchDependencies(fixture)
const workbenchParts = new Map(createWorkbenchParts(fixture).map((part) => [part.instanceId, part]))
const geometryByInstance = new Map<string, (typeof fixture.geometry)[number]>(
  fixture.geometry.map((primitive) => [primitive.entityId, primitive]),
)
const definitionIds = new Set(fixture.assembly.definitions.map(({ id }) => id))
const selectorResults = fixture.selectors.map((contract) => ({
  ...contract,
  ids: resolver.resolve(contract.selector, contract.cardinality).entities.map(({ id }) => id),
}))

function statusFor(instanceId: string) {
  const part = workbenchParts.get(instanceId)
  const geometry = geometryByInstance.get(instanceId)
  if (!part) return 'desconocido'
  if (part.state === 'blocked') return part.sourceIds.length ? 'solo documental' : 'bloqueado'
  if (part.state === 'unknown') return geometry?.shape === 'symbolic-marker' ? 'solo documental' : 'utilizable con limitaciones'
  if (part.reconstructionLevel === 'R2' && part.reconstructionState === 'structurally-modelled') return 'listo'
  return 'utilizable con limitaciones'
}

const records = fixture.ledger.flatMap((record) => record.instanceIds.map((instanceId) => {
  const primitive = geometryByInstance.get(instanceId)
  const matchingSelectors = selectorResults.filter(({ ids }) => ids.includes(instanceId))
  const disassembly = dependencies.filter(({ phase, afterInstanceId, beforeInstanceId }) =>
    phase === 'disassembly' && (afterInstanceId === instanceId || beforeInstanceId === instanceId))
  const assembly = dependencies.filter(({ phase, afterInstanceId, beforeInstanceId }) =>
    phase === 'assembly' && (afterInstanceId === instanceId || beforeInstanceId === instanceId))
  const part = workbenchParts.get(instanceId)
  const status = statusFor(instanceId)
  const manipulable = part && !['blocked', 'unknown'].includes(part.state)
  return {
    canonicalId: record.canonicalId,
    instanceId,
    nameEs: record.nameEs,
    nameEn: record.nameEn,
    officialReference: record.officialReference ?? null,
    subsystem: record.subsystem,
    sourceIds: record.sourceIds,
    definitionExists: definitionIds.has(record.canonicalId),
    instanceCount: record.instanceIds.length,
    geometry: primitive
      ? {
          id: primitive.id,
          shape: primitive.shape,
          coordinateSpace: primitive.coordinateSpace,
          layer: primitive.layer,
          size: primitive.size,
        }
      : null,
    transform: primitive ? { position: primitive.position, units: primitive.coordinateSpace } : null,
    interfaces: record.interfaceIds,
    relations: record.functionalRelationshipIds,
    selectors: matchingSelectors.map(({ id, selector, cardinality }) => ({ id, selector, cardinality })),
    layerOrder: primitive?.position[1] ?? null,
    disassemblyDependencies: disassembly,
    assemblyDependencies: assembly,
    reconstruction: {
      level: record.reconstructionLevel,
      state: record.modelState,
    },
    fidelity: record.fidelity,
    limitations: [
      ...record.limitations,
      ...(primitive?.limitations ?? []),
      ...(status === 'solo documental'
        ? ['La identidad documental no demuestra que exista una pieza individual manipulable.']
        : []),
    ],
    aptitude: {
      observe: primitive !== undefined,
      select: true,
      hide: primitive !== undefined,
      explode: primitive !== undefined && primitive.shape !== 'symbolic-marker',
      disassemble: Boolean(manipulable),
      assemble: Boolean(manipulable),
      assess: true,
    },
    status,
  }
}))

const summary = {
  fixtureId: fixture.id,
  fixtureVersion: fixture.version,
  generatedAt: '2026-07-27',
  fidelity: fixture.fidelity,
  reconstructionLevel: fixture.reconstructionLevel,
  totals: {
    ledgerRecords: fixture.ledger.length,
    instances: records.length,
    definitions: fixture.assembly.definitions.length,
    geometries: fixture.geometry.length,
    selectors: fixture.selectors.length,
    relations: fixture.relations.length,
    disassemblyBlockingDependencies: dependencies.filter(({ phase, blocking }) => phase === 'disassembly' && blocking).length,
    assemblyBlockingDependencies: dependencies.filter(({ phase, blocking }) => phase === 'assembly' && blocking).length,
  },
  statusCounts: Object.fromEntries(['listo', 'utilizable con limitaciones', 'solo documental', 'bloqueado', 'desconocido']
    .map((status) => [status, records.filter((record) => record.status === status).length])),
  limitations: [
    ...fixture.limitations,
    'La auditoría no interpreta la vista explosionada como un manual de servicio.',
    'Solo las dependencias explícitas se convierten en bloqueos del runtime.',
  ],
  records,
}

const cell = (value: unknown) => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ')
const markdown = `# Auditoría pieza por pieza · MIYOTA 2035

Fecha: 2026-07-27  
Fixture: \`${fixture.id}@${fixture.version}\`  
Reconstrucción y fidelidad: ${fixture.reconstructionLevel}/${fixture.fidelity.geometry}/${fixture.fidelity.kinematics}/${fixture.fidelity.physics}

Esta auditoría separa identidad documental, geometría utilizable y operación realmente ejecutable. Una referencia oficial no convierte por sí sola un marcador en una pieza manipulable. Las coordenadas internas son reconstrucciones normalizadas, no dimensiones oficiales.

## Resumen

- ${summary.totals.ledgerRecords} registros de ledger y ${summary.totals.instances} instancias canónicas.
- ${summary.totals.geometries} primitivas; las primitivas simbólicas no se consideran aptas para desmontaje.
- ${summary.totals.disassemblyBlockingDependencies} dependencias bloqueantes de desmontaje y ${summary.totals.assemblyBlockingDependencies} de montaje.
- Estados: ${Object.entries(summary.statusCounts).map(([key, value]) => `${key}: ${value}`).join('; ')}.
- No existe una secuencia completa de servicio oficialmente documentada en el fixture.

## Registros

| Instancia | Pieza ES / EN | Ref. | Subsistema | Geometría / transformación | Selectores | Dependencias D/M | Estado | Aptitud O/S/H/E/D/M/Ev | G/K/P | Limitaciones |
|---|---|---|---|---|---|---|---|---|---|---|
${records.map((record) => `| \`${record.instanceId}\` | ${cell(record.nameEs)} / ${cell(record.nameEn)} | ${cell(record.officialReference)} | ${cell(record.subsystem)} | ${cell(record.geometry ? `${record.geometry.shape}; ${record.geometry.coordinateSpace}; pos ${JSON.stringify(record.transform?.position)}` : 'ausente')} | ${cell(record.selectors.map(({ id, cardinality }) => `${id} (${cardinality})`).join(', ') || 'ninguno específico')} | ${record.disassemblyDependencies.length}/${record.assemblyDependencies.length} | **${record.status}** | ${Object.values(record.aptitude).map((value) => value ? 'sí' : 'no').join('/')} | ${record.fidelity.geometry}/${record.fidelity.kinematics}/${record.fidelity.physics} | ${cell(record.limitations.join('; ') || '—')} |`).join('\n')}

## Lectura operativa

- **Listo** significa seleccionable y manipulable en R2, no validado para servicio físico.
- **Utilizable con limitaciones** conserva identidad y una representación visual, pero exige mostrar su limitación.
- **Solo documental** puede observarse o citarse, pero el banco no lo presenta como pieza física desmontable.
- Los órdenes derivados son parciales, reversibles y trazables a sus relaciones; nunca se rotulan como secuencia oficial completa.
`

await mkdir(output, { recursive: true })
await Promise.all([
  writeFile(resolve(output, 'miyota2035-audit.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8'),
  writeFile(resolve(output, 'miyota2035-audit.md'), markdown, 'utf8'),
])
console.log(`Auditoría 2035: ${records.length} instancias en ${output}`)
