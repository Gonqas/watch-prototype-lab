import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  CONCEPTUAL_MECHANICAL_FIXTURE,
  MIYOTA_8215_TECHNICAL_FIXTURE,
} from '../src/learning/technical/fixtures'
import {
  MECHANICAL_ENERGY_SEGMENTS,
  MECHANICAL_KINEMATIC_RELATIONS,
  MECHANICAL_LAB_ENTITIES,
  MechanicalLearningLab,
} from '../src/learning/mechanical'

const root = join(process.cwd(), 'learning-content', 'mechanical-foundations', 'generated')
await mkdir(root, { recursive: true })

const moduleSuitability = [
  ['energy', 'parcial', 'El fixture base contiene muelle, barrilete y cadena; el laboratorio añade bloqueo y energía normalizada.'],
  ['barrel', 'parcial', 'El fixture base agrupa el barrilete; el laboratorio separa árbol, tambor, tapa y brida conceptual.'],
  ['gear-pair', 'no representable antes de 4E', 'No existían dientes editables ni cálculo de relación.'],
  ['train', 'parcial', 'Existía un marcador de tren, no etapas editables.'],
  ['supports', 'no representable antes de 4E', 'No había pivotes, rubíes o grados de libertad conceptuales.'],
  ['escapement', 'parcial', 'Existían rueda y áncora, sin ocho fases ni paso a paso.'],
  ['oscillator', 'parcial', 'Existían volante y espiral, sin frecuencia y amplitud independientes.'],
  ['integration', 'parcial', 'La cadena funcional existía como relaciones, no como laboratorio coordinado.'],
  ['motion-works', 'parcial', 'Existía una entidad agrupada sin relación editable ni indicación horaria.'],
  ['keyless', 'parcial', 'Existía una entidad agrupada sin estados de corona.'],
  ['automatic', 'ausente', 'El conceptual base no contenía automático.'],
  ['calendar', 'ausente', 'El conceptual base no contenía calendario.'],
] as const

const entityRows = CONCEPTUAL_MECHANICAL_FIXTURE.ledger.map((record) => ({
  id: record.canonicalId,
  names: { es: record.nameEs, en: record.nameEn },
  instances: record.instanceIds,
  subsystem: record.subsystem,
  geometryPrimitiveIds: record.geometryPrimitiveIds,
  geometry: CONCEPTUAL_MECHANICAL_FIXTURE.geometry.filter(({ id }) => record.geometryPrimitiveIds.includes(id)),
  relations: CONCEPTUAL_MECHANICAL_FIXTURE.relations.filter(({ fromInstanceId, toInstanceId }) =>
    record.instanceIds.includes(fromInstanceId) || record.instanceIds.includes(toInstanceId)),
  selectors: CONCEPTUAL_MECHANICAL_FIXTURE.selectors.filter(({ selector }) =>
    'value' in selector && (record.subsystem === selector.value || record.canonicalId.includes(String(selector.value)))),
  anchors: record.interfaceIds,
  degreesOfFreedom: record.subsystem === 'regulation' ? ['rotation-conceptual', 'oscillation-conceptual'] : record.subsystem === 'train' ? ['rotation-conceptual'] : [],
  reconstructionLevel: record.reconstructionLevel,
  fidelity: record.fidelity,
  sourceIds: record.sourceIds,
  limitations: record.limitations,
  representableOperations: ['select', 'show', 'hide', 'isolate', 'highlight', 'explode', 'restore'],
  nonRepresentableBeforeSystem4e: ['editable-teeth', 'physical-torque', 'measured-clearance', 'validated-service'],
}))

const example8215 = MIYOTA_8215_TECHNICAL_FIXTURE.ledger.map((record) => ({
  id: record.canonicalId,
  nameEs: record.nameEs,
  officialReference: record.officialReference ?? null,
  subsystem: record.subsystem,
  instances: record.instanceIds.length,
  use: ['power-source', 'train', 'escapement', 'regulation', 'motion-works', 'keyless', 'automatic', 'calendar'].includes(record.subsystem)
    ? 'visual-example-only'
    : 'context-only',
  fidelity: record.fidelity,
  limitations: [
    ...record.limitations,
    'No hereda dientes, relaciones calculadas, cinemática o física del modelo conceptual.',
  ],
}))

const lab = new MechanicalLearningLab(true, () => '2026-07-27T13:30:00.000Z')
const audit = {
  schemaVersion: 1,
  generatedAt: '2026-07-27',
  baseline: {
    fixtureId: CONCEPTUAL_MECHANICAL_FIXTURE.id,
    version: CONCEPTUAL_MECHANICAL_FIXTURE.version,
    reconstructionLevel: CONCEPTUAL_MECHANICAL_FIXTURE.reconstructionLevel,
    fidelity: CONCEPTUAL_MECHANICAL_FIXTURE.fidelity,
    definitions: CONCEPTUAL_MECHANICAL_FIXTURE.assembly.definitions.length,
    instances: CONCEPTUAL_MECHANICAL_FIXTURE.assembly.instances.length,
    geometryPrimitives: CONCEPTUAL_MECHANICAL_FIXTURE.geometry.length,
    relations: CONCEPTUAL_MECHANICAL_FIXTURE.relations.length,
    selectors: CONCEPTUAL_MECHANICAL_FIXTURE.selectors.length,
    capabilities: CONCEPTUAL_MECHANICAL_FIXTURE.capabilities,
    limitations: CONCEPTUAL_MECHANICAL_FIXTURE.limitations,
  },
  entities: entityRows,
  moduleSuitability: moduleSuitability.map(([module, baselineStatus, finding]) => ({ module, baselineStatus, finding })),
  laboratoryAddedBySystem4e: {
    entities: MECHANICAL_LAB_ENTITIES.length,
    kinematicRelations: MECHANICAL_KINEMATIC_RELATIONS.length,
    energySegments: MECHANICAL_ENERGY_SEGMENTS.length,
    semanticCommands: lab.accessibilityModel().commands.map(({ type }) => type),
    escapementPhases: lab.accessibilityModel().staticEscapementPhases,
    reducedMotion: lab.accessibilityModel().reducedMotion,
  },
  miyota8215: {
    fixtureId: MIYOTA_8215_TECHNICAL_FIXTURE.id,
    reconstructionLevel: MIYOTA_8215_TECHNICAL_FIXTURE.reconstructionLevel,
    fidelity: MIYOTA_8215_TECHNICAL_FIXTURE.fidelity,
    definitions: MIYOTA_8215_TECHNICAL_FIXTURE.assembly.definitions.length,
    instances: MIYOTA_8215_TECHNICAL_FIXTURE.assembly.instances.length,
    relations: MIYOTA_8215_TECHNICAL_FIXTURE.relations.length,
    selectors: MIYOTA_8215_TECHNICAL_FIXTURE.selectors.length,
    examples: example8215,
    policy: 'Referencia visual y estructural R2; nunca modelo principal ni autoridad cinemática del laboratorio.',
  },
  viewportCompatibility: {
    available: ['selection', 'visibility', 'isolation', 'highlight', 'explode', 'timeline', 'scrub', 'reduced-motion', 'restore', 'multi-fixture'],
    laboratoryOwned: ['editable-gear-stages', 'calculations', 'escapement-phases', 'oscillator-parameters', 'crown-state', 'calendar-state', 'fault-diagnostics'],
    unmeasured: ['gpu-memory', 'draw-calls'],
    notRepresented: ['real-tooth-profiles', 'real-spring-stress', 'real-endshake', 'real-torque', '8215-service-sequence'],
  },
}

await writeFile(join(root, 'mechanical-fixture-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8')

const rows = entityRows.map((row) =>
  `| \`${row.id}\` | ${row.names.es} | ${row.instances.length} | ${row.geometry.length} | ${row.relations.length} | ${row.reconstructionLevel} | ${row.fidelity.geometry}/${row.fidelity.kinematics}/${row.fidelity.physics} | ${row.limitations.join(' ') || 'Sin limitación adicional.'} |`).join('\n')
const suitabilityRows = audit.moduleSuitability.map((row) => `| ${row.module} | ${row.baselineStatus} | ${row.finding} |`).join('\n')
const markdown = `# Auditoría del fixture mecánico conceptual · Sistema 4E

Fecha: 2026-07-27

## Hallazgo ejecutivo

El fixture previo \`${audit.baseline.fixtureId}\` tenía ${audit.baseline.instances} instancias, ${audit.baseline.geometryPrimitives} primitivas, ${audit.baseline.relations} relaciones y ${audit.baseline.selectors} selectores. Era suficiente para una cadena funcional G1/K2/P0, pero no para un laboratorio completo: tren agrupado, barrilete agrupado, escape sin fases, oscilador sin parámetros, y automático/calendario ausentes.

Sistema 4E no eleva artificialmente ese fixture. Añade una capa educativa separada con ${audit.laboratoryAddedBySystem4e.entities} entidades, ${audit.laboratoryAddedBySystem4e.kinematicRelations} relaciones cinemáticas y ${audit.laboratoryAddedBySystem4e.energySegments} tramos energéticos. El modelo sigue siendo conceptual.

## Entidades de partida

| ID | Nombre | Instancias | Geometría | Relaciones | R | G/K/P | Limitaciones |
|---|---|---:|---:|---:|---|---|---|
${rows}

## Aptitud inicial por módulo

| Módulo | Estado previo | Hallazgo |
|---|---|---|
${suitabilityRows}

## MIYOTA 8215 como ejemplo

El fixture \`${audit.miyota8215.fixtureId}\` contiene ${audit.miyota8215.instances} instancias y ${audit.miyota8215.relations} relaciones, en ${audit.miyota8215.reconstructionLevel}/${audit.miyota8215.fidelity.geometry}/${audit.miyota8215.fidelity.kinematics}/${audit.miyota8215.fidelity.physics}. Puede ilustrar subsistemas documentados, pero no recibe dientes, relaciones, movimiento, pérdidas, tolerancias o diagnóstico del conceptual.

## Carencias que permanecen

- perfiles de diente y distancia entre centros físicos;
- tensión y curva de par de un muelle real;
- holguras y apoyos medidos;
- ángulos y contactos validados del escape;
- dinámica de volante y espiral;
- conteos de dientes y cinemática específicos del 8215;
- draw calls y memoria GPU;
- desmontaje, montaje, lubricación y servicio del 8215.
`
await writeFile(join(root, 'mechanical-fixture-audit.md'), markdown, 'utf8')
console.log(`Auditoría mecánica: ${entityRows.length} entidades base y ${MECHANICAL_LAB_ENTITIES.length} entidades de laboratorio.`)
