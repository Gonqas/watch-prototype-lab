import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../technical/fixtures'
import type {
  TechnicalFunctionalRelation,
  TechnicalMovementFixture,
} from '../technical/reconstruction'
import { createWorkbenchParts } from '../workbench'
import type {
  CalibreDependency,
  CalibreInstanceAudit,
  CalibreOperation,
  CalibreOperationAuthority,
  CalibreSubsystem,
} from './model'

export const MIYOTA_8215_FIXTURE_VERSION = MIYOTA_8215_TECHNICAL_FIXTURE.version

function relationAuthority(relation: TechnicalFunctionalRelation): CalibreOperationAuthority {
  if (relation.layer === 'official-part-identity') return 'official-documented-relation'
  if (relation.layer === 'document-inferred-relation') {
    return relation.confidence === 'high' ? 'structural-dependency' : 'inferred-sequence'
  }
  if (relation.layer === 'educational-simulation') return 'simulation-only'
  return 'unknown'
}

function dependencyGraph(relation: TechnicalFunctionalRelation): CalibreDependency['graph'] {
  if (relation.type === 'remove-before') return 'disassembly'
  if (['supports', 'pivots-in', 'covers', 'retains', 'fastened-by', 'meshes-with'].includes(relation.type)) return 'structure'
  return 'function'
}

export function create8215Dependencies(
  fixture: TechnicalMovementFixture = MIYOTA_8215_TECHNICAL_FIXTURE,
): CalibreDependency[] {
  const dependencies: CalibreDependency[] = fixture.relations.map((relation) => ({
    id: `calibre.${dependencyGraph(relation)}.${relation.id}`,
    graph: dependencyGraph(relation),
    kind: relation.type as CalibreDependency['kind'],
    fromInstanceId: relation.fromInstanceId,
    toInstanceId: relation.toInstanceId,
    authority: relationAuthority(relation),
    sourceIds: [...relation.sourceIds],
    confidence: relation.confidence,
    blocking: relation.type === 'remove-before',
    limitations: [...relation.limitations],
  }))

  fixture.relations.filter(({ type }) => type === 'remove-before').forEach((relation) => {
    dependencies.push({
      id: `calibre.assembly.inverse.${relation.id}`,
      graph: 'assembly',
      kind: 'install-before',
      fromInstanceId: relation.toInstanceId,
      toInstanceId: relation.fromInstanceId,
      authority: relationAuthority(relation),
      sourceIds: [...relation.sourceIds],
      confidence: relation.confidence,
      blocking: true,
      limitations: [
        'Inversión estructural para el laboratorio; no se publica como procedimiento oficial de montaje.',
        ...relation.limitations,
      ],
    })
  })
  return dependencies
}

function selectorMatches(
  selector: TechnicalMovementFixture['selectors'][number],
  instanceId: string,
  definition: TechnicalMovementFixture['assembly']['definitions'][number],
  fixture: TechnicalMovementFixture,
): boolean {
  const query = selector.selector as unknown as { by: string; value?: string; id?: string }
  const value = query.value ?? query.id
  if (query.by === 'instance') return value === instanceId
  if (query.by === 'definition') return value === definition.id
  if (query.by === 'role') return value !== undefined && definition.roles.includes(value)
  if (query.by === 'subsystem') return value !== undefined && definition.subsystems.includes(value)
  if (query.by === 'calibre') return fixture.calibre === value
  if (query.by === 'family') return fixture.family === value
  if (query.by === 'variant') return fixture.variant === value
  if (query.by === 'tag') return value !== undefined && definition.tags.includes(value)
  if (query.by === 'part-type') return definition.category === value
  return false
}

function operationTools(_instance: CalibreInstanceAudit, action: CalibreOperation['action']): string[] {
  if (action === 'inspect') return ['tool.loupe']
  if (action === 'loosen-fastener' || action === 'tighten-fastener') return ['tool.screwdriver']
  if (['remove', 'place-in-tray', 'align', 'install'].includes(action)) return ['tool.tweezers']
  return []
}

function operationFor(
  instance: CalibreInstanceAudit,
  action: CalibreOperation['action'],
  phase: CalibreOperation['phase'],
): CalibreOperation {
  const structural = ['remove', 'place-in-tray', 'align', 'install', 'loosen-fastener', 'tighten-fastener'].includes(action)
  const authority: CalibreOperationAuthority = structural ? 'educational-sequence' : 'official-documented-relation'
  const requiredToolIds = operationTools(instance, action)
  return {
    id: `operation.8215.${action}.${instance.instanceId}`,
    phase,
    action,
    instanceId: instance.instanceId,
    subsystem: instance.subsystem,
    authority,
    sourceIds: [...instance.sourceIds],
    requiredToolIds,
    incompatibleToolIds: requiredToolIds.length ? ['tool.multimeter'] : [],
    educationalRisk: structural
      ? 'La representación no simula fuerza, par, presión, tolerancia ni riesgo físico real.'
      : 'La identificación depende de la revisión y fidelidad declaradas.',
    accessibleAlternative: `Seleccionar ${instance.nameEs} por su nombre, referencia, subsistema e identidad de instancia.`,
    dependencyIds: phase === 'disassembly' ? [...instance.removalDependencyIds] : phase === 'assembly' ? [...instance.installationDependencyIds] : [],
    limitations: [...instance.limitations],
    publishedAsOfficial: false,
  }
}

export function create8215Audit(
  fixture: TechnicalMovementFixture = MIYOTA_8215_TECHNICAL_FIXTURE,
): CalibreInstanceAudit[] {
  const definitions = new Map<string, TechnicalMovementFixture['assembly']['definitions'][number]>(
    fixture.assembly.definitions.map((definition) => [definition.id, definition]),
  )
  const geometry = new Map(fixture.geometry.map((primitive) => [primitive.entityId, primitive]))
  const dependencies = create8215Dependencies(fixture)
  return fixture.ledger.flatMap((record) => record.instanceIds.map((instanceId) => {
    const definition = definitions.get(record.canonicalId)
    if (!definition) throw new Error(`Definición ausente para ${record.canonicalId}.`)
    const primitive = geometry.get(instanceId)
    const geometryAvailable = primitive !== undefined && primitive.shape !== 'symbolic-marker'
    const selectors = fixture.selectors.filter((selector) => selectorMatches(selector, instanceId, definition, fixture))
    const outgoing = fixture.relations.filter(({ fromInstanceId }) => fromInstanceId === instanceId)
    const incoming = fixture.relations.filter(({ toInstanceId }) => toInstanceId === instanceId)
    const repeated = record.instanceIds.length > 1
    const readiness = record.reconstructionLevel === 'R0'
      ? 'documentary-only'
      : !geometryAvailable
        ? 'blocked'
        : record.reconstructionLevel === 'R1'
          ? 'usable-with-limitations'
          : 'ready'
    const manipulable = record.reconstructionLevel === 'R2'
      && geometryAvailable
      && record.entityKind !== 'interface-placeholder'
    return {
      canonicalId: record.canonicalId,
      instanceId,
      officialReference: record.officialReference,
      nameEs: record.nameEs,
      nameEn: record.nameEn,
      subsystem: record.subsystem,
      sourceIds: [...record.sourceIds],
      reconstructionLevel: record.reconstructionLevel,
      geometryAvailable,
      geometryShape: primitive?.shape,
      officialDimensions: record.officialDimensions.map(({ id, label, value, unit }) => `${id}: ${label}=${String(value)} ${unit}`),
      estimatedDimensions: record.estimatedDimensions.map(({ id, label, value, unit }) => `${id}: ${label}=${String(value)} ${unit}`),
      unknownDimensions: record.officialDimensions.length || record.measuredDimensions.length
        ? []
        : ['Contorno, espesor, apoyos y tolerancias internas no documentados por pieza.'],
      selectorIds: selectors.map(({ id }) => id),
      cardinality: selectors.map(({ cardinality }) => typeof cardinality === 'string' ? cardinality : `exact:${cardinality.exact}`),
      relationshipIds: [...incoming, ...outgoing].map(({ id }) => id),
      associatedFastenerIds: [...incoming, ...outgoing]
        .filter(({ type }) => type === 'fastened-by')
        .flatMap(({ fromInstanceId, toInstanceId }) => [fromInstanceId, toInstanceId])
        .filter((id) => id !== instanceId),
      coveredInstanceIds: outgoing.filter(({ type }) => type === 'covers').map(({ toInstanceId }) => toInstanceId),
      supportInstanceIds: [...incoming, ...outgoing]
        .filter(({ type }) => type === 'supports' || type === 'pivots-in')
        .flatMap(({ fromInstanceId, toInstanceId }) => [fromInstanceId, toInstanceId])
        .filter((id) => id !== instanceId),
      interfaceIds: [...record.interfaceIds],
      removalDependencyIds: dependencies
        .filter(({ graph, fromInstanceId, toInstanceId }) => graph === 'disassembly' && (fromInstanceId === instanceId || toInstanceId === instanceId))
        .map(({ id }) => id),
      installationDependencyIds: dependencies
        .filter(({ graph, fromInstanceId, toInstanceId }) => graph === 'assembly' && (fromInstanceId === instanceId || toInstanceId === instanceId))
        .map(({ id }) => id),
      orientation: repeated ? `as-installed; identidad repetida ${instanceId}` : 'as-installed',
      visualState: record.modelState,
      fidelity: structuredClone(record.fidelity),
      limitations: [
        ...record.limitations,
        ...(record.reconstructionLevel === 'R0' ? ['Identidad documental sin geometría manipulable completa.'] : []),
      ],
      readiness,
      aptitudes: {
        identify: true,
        select: true,
        isolate: geometryAvailable,
        explode: geometryAvailable,
        remove: manipulable,
        placeInTray: manipulable,
        inspect: geometryAvailable,
        install: manipulable,
        verify: manipulable,
        evaluate: true,
      },
    }
  }))
}

export function create8215Operations(
  audits = create8215Audit(),
): CalibreOperation[] {
  return audits.flatMap((instance) => {
    const operations: CalibreOperation[] = [
      operationFor(instance, 'identify', 'documentation'),
      operationFor(instance, 'select', 'documentation'),
      operationFor(instance, 'review-documentation', 'documentation'),
    ]
    if (instance.aptitudes.isolate) operations.push(operationFor(instance, 'isolate', 'documentation'), operationFor(instance, 'explode', 'documentation'))
    if (instance.aptitudes.inspect) operations.push(operationFor(instance, 'inspect', 'inspection'))
    if (instance.aptitudes.remove) {
      if (instance.subsystem === 'fasteners') operations.push(operationFor(instance, 'loosen-fastener', 'disassembly'))
      operations.push(
        operationFor(instance, 'plan-removal', 'disassembly'),
        operationFor(instance, 'remove', 'disassembly'),
        operationFor(instance, 'place-in-tray', 'disassembly'),
        operationFor(instance, 'align', 'assembly'),
        operationFor(instance, 'install', 'assembly'),
        operationFor(instance, 'verify', 'verification'),
      )
      if (instance.subsystem === 'fasteners') operations.push(operationFor(instance, 'tighten-fastener', 'assembly'))
    }
    return operations
  })
}

const subsystemDefinitions: Array<{
  id: string
  label: string
  fixtureSubsystems: string[]
  roles?: string[]
  function: string
  input: string
  output: string
}> = [
  { id: 'subsystem.8215.structure', label: 'Estructura, platina y puentes', fixtureSubsystems: ['structure'], function: 'Sostener y posicionar los conjuntos.', input: 'Cargas estructurales conceptuales.', output: 'Apoyos y retenciones.' },
  { id: 'subsystem.8215.automatic', label: 'Rotor y carga automática', fixtureSubsystems: ['automatic'], function: 'Transmitir giro del rotor hacia la carga.', input: 'Giro del rotor.', output: 'Ruta hacia el barrilete.' },
  { id: 'subsystem.8215.manual-winding', label: 'Cuerda manual', fixtureSubsystems: ['keyless', 'power-source'], roles: ['crown-wheel', 'clutch-wheel', 'click', 'click-spring', 'ratchet-wheel'], function: 'Recibir la acción de cuerda.', input: 'Corona y tija.', output: 'Carga del barrilete.' },
  { id: 'subsystem.8215.keyless', label: 'Puesta en hora', fixtureSubsystems: ['keyless'], function: 'Seleccionar cuerda, neutro o puesta en hora.', input: 'Posición de tija.', output: 'Ruta seleccionada.' },
  { id: 'subsystem.8215.motion-works', label: 'Minutería e indicación', fixtureSubsystems: ['motion-works', 'indication'], function: 'Transmitir el movimiento a las indicaciones.', input: 'Tren o puesta en hora.', output: 'Horas, minutos y segundos.' },
  { id: 'subsystem.8215.calendar', label: 'Calendario', fixtureSubsystems: ['calendar'], function: 'Arrastrar y corregir la fecha.', input: 'Indicación y corrector.', output: 'Estado de fecha.' },
  { id: 'subsystem.8215.barrel', label: 'Barrilete y energía', fixtureSubsystems: ['power-source'], roles: ['barrel', 'mainspring'], function: 'Almacenar energía mecánica.', input: 'Cuerda manual o automática.', output: 'Par conceptual hacia el tren.' },
  { id: 'subsystem.8215.train', label: 'Tren de rodaje', fixtureSubsystems: ['train'], function: 'Transmitir energía hacia el escape.', input: 'Barrilete.', output: 'Rueda de escape.' },
  { id: 'subsystem.8215.escapement', label: 'Escape', fixtureSubsystems: ['escapement'], function: 'Liberar el tren en pasos y dar impulso.', input: 'Tren.', output: 'Impulso al oscilador.' },
  { id: 'subsystem.8215.regulation', label: 'Volante y espiral', fixtureSubsystems: ['regulation'], function: 'Establecer el ritmo oscilatorio.', input: 'Impulsos del escape.', output: 'Alternancia funcional.' },
  { id: 'subsystem.8215.supports', label: 'Sujeciones, apoyos y rubíes', fixtureSubsystems: ['fasteners', 'regulation', 'structure'], roles: ['fastener', 'jewel-support'], function: 'Retener y apoyar instancias.', input: 'Piezas alineadas.', output: 'Posición estructural.' },
  { id: 'subsystem.8215.external', label: 'Interfaces externas', fixtureSubsystems: ['indication', 'structure', 'keyless'], roles: ['movement-envelope', 'movement-holder', 'stem', 'hand-interface'], function: 'Conectar movimiento, tija, esfera, agujas y caja.', input: 'Interfaces del reloj.', output: 'Integración externa.' },
]

export function create8215Subsystems(
  fixture: TechnicalMovementFixture = MIYOTA_8215_TECHNICAL_FIXTURE,
  audits = create8215Audit(fixture),
  operations = create8215Operations(audits),
): CalibreSubsystem[] {
  const definitions = new Map<string, TechnicalMovementFixture['assembly']['definitions'][number]>(
    fixture.assembly.definitions.map((definition) => [definition.id, definition]),
  )
  return subsystemDefinitions.map((specification) => {
    const matching = audits.filter((audit) => {
      const definition = definitions.get(audit.canonicalId)
      return specification.fixtureSubsystems.includes(audit.subsystem)
        && (!specification.roles || specification.roles.some((role) => definition?.roles.includes(role)))
    })
    const instanceIds = matching.map(({ instanceId }) => instanceId)
    const relationIds = fixture.relations
      .filter(({ fromInstanceId, toInstanceId }) => instanceIds.includes(fromInstanceId) || instanceIds.includes(toInstanceId))
      .map(({ id }) => id)
    return {
      id: specification.id,
      label: specification.label,
      instanceIds,
      relationIds,
      sourceIds: [...new Set(matching.flatMap(({ sourceIds }) => sourceIds))],
      function: specification.function,
      input: specification.input,
      output: specification.output,
      prerequisiteIds: specification.id === 'subsystem.8215.structure' ? [] : ['subsystem.8215.structure'],
      operationIds: operations.filter(({ instanceId }) => instanceId && instanceIds.includes(instanceId)).map(({ id }) => id),
      fidelity: {
        geometry: 'G2',
        kinematics: ['subsystem.8215.train', 'subsystem.8215.escapement', 'subsystem.8215.regulation'].includes(specification.id) ? 'K2' : 'K1',
        physics: 'P0',
        limitations: ['Fixture R2 normalizado; no valida geometría, tolerancias, fuerza, par, lubricación ni funcionamiento físico.'],
      },
      limitations: ['Las relaciones procedentes del despiece no constituyen por sí solas un procedimiento de servicio.'],
    }
  })
}

export function create8215WorkbenchParts() {
  return createWorkbenchParts(MIYOTA_8215_TECHNICAL_FIXTURE)
}
