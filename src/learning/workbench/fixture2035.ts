import { MIYOTA_2035_TECHNICAL_FIXTURE } from '../technical/fixtures'
import type {
  TechnicalFunctionalRelation,
  TechnicalMovementFixture,
} from '../technical/reconstruction'
import type {
  DependencyAuthority,
  WorkbenchDependency,
  WorkbenchPart,
  WorkbenchTool,
  WorkbenchZone,
} from './model'

function authority(relation: TechnicalFunctionalRelation): DependencyAuthority {
  if (relation.layer === 'official-nominal' || relation.layer === 'official-part-identity') {
    return 'officially-documented'
  }
  if (relation.layer === 'document-inferred-relation') return 'inferred'
  if (relation.layer === 'educational-simulation') return 'educational'
  return 'unverified'
}

export function createWorkbenchTools(): WorkbenchTool[] {
  return [
    {
      id: 'tool.movement-holder',
      label: 'Soporte de movimiento genérico',
      capabilities: ['hold-movement'],
      limitations: ['No representa una referencia comercial ni una presión física validada.'],
      accessibleOperation: 'Fijar o liberar el movimiento mediante una acción de menú.',
    },
    {
      id: 'tool.screwdriver',
      label: 'Destornillador genérico con comprobación de ajuste',
      capabilities: ['engage-fastener', 'loosen-fastener', 'tighten-fastener'],
      limitations: ['No prescribe anchura de hoja, par ni modelo comercial. El ajuste debe confirmarse.'],
      accessibleOperation: 'Seleccionar tornillo, confirmar ajuste y elegir aflojar o apretar.',
    },
    {
      id: 'tool.tweezers',
      label: 'Pinzas genéricas',
      capabilities: ['pick-part', 'place-part', 'rotate-part'],
      limitations: ['La fuerza y el material no se simulan físicamente.'],
      accessibleOperation: 'Seleccionar pieza y usar Recoger, Colocar o Girar.',
    },
    {
      id: 'tool.loupe',
      label: 'Lupa',
      capabilities: ['inspect'],
      limitations: ['Aumento educativo; no sustituye una inspección óptica de una unidad física.'],
      accessibleOperation: 'Abrir la ficha de inspección de la pieza seleccionada.',
    },
    {
      id: 'tool.blower',
      label: 'Pera de aire',
      capabilities: ['remove-loose-dust'],
      limitations: ['Solo elimina el defecto visual reversible “polvo suelto”.'],
      accessibleOperation: 'Aplicar limpieza visual a la entidad seleccionada.',
    },
    {
      id: 'tool.hand-remover',
      label: 'Palancas de agujas genéricas',
      capabilities: ['remove-hands'],
      limitations: ['No simula presión, protección de esfera ni compatibilidad dimensional.'],
      accessibleOperation: 'Retirar una interfaz de aguja cuando el contrato lo permita.',
    },
    {
      id: 'tool.hand-press',
      label: 'Colocador de agujas genérico',
      capabilities: ['install-hands'],
      limitations: ['No simula altura, paralelismo ni fuerza de colocación.'],
      accessibleOperation: 'Instalar una interfaz de aguja mediante una acción confirmada.',
    },
    {
      id: 'tool.caliper',
      label: 'Calibre genérico',
      capabilities: ['measure-dimension'],
      limitations: ['No crea mediciones oficiales ni valores que no procedan de una unidad física.'],
      accessibleOperation: 'Registrar una medición como pendiente o medida sobre una unidad identificada.',
    },
    {
      id: 'tool.multimeter',
      label: 'Multímetro conceptual',
      capabilities: ['check-electrical-conceptually'],
      limitations: ['No ofrece voltajes, resistencias ni puntos de prueba inventados.'],
      accessibleOperation: 'Registrar qué magnitud sería necesaria y que falta el procedimiento oficial.',
    },
  ]
}

export function createWorkbenchZones(): WorkbenchZone[] {
  return [
    { id: 'zone.movement', label: 'Soporte del movimiento', kind: 'movement', safe: true },
    { id: 'zone.tools', label: 'Herramientas ordenadas', kind: 'tool', safe: true },
    { id: 'zone.tray', label: 'Bandeja numerada', kind: 'tray', safe: true },
    { id: 'zone.inspection', label: 'Inspección e iluminación', kind: 'inspection', safe: true },
    { id: 'zone.documentation', label: 'Notas, fuentes y fotografías simuladas', kind: 'documentation', safe: true },
  ]
}

export function createWorkbenchParts(
  fixture: TechnicalMovementFixture = MIYOTA_2035_TECHNICAL_FIXTURE,
): WorkbenchPart[] {
  const definitionById = new Map(fixture.assembly.definitions.map((definition) => [definition.id, definition]))
  const geometryByInstanceId = new Map(fixture.geometry.map((primitive) => [primitive.entityId, primitive]))
  return fixture.ledger.flatMap((record) => record.instanceIds.map((instanceId, index) => {
    const definition = definitionById.get(record.canonicalId)
    const geometry = geometryByInstanceId.get(instanceId)
    const repeated = record.instanceIds.length > 1
    const context = record.officialReference
      ? `${record.nameEs} ${record.officialReference}`
      : record.nameEs
    const label = repeated ? `${context} · instancia ${index + 1}` : context
    const manipulable = record.entityKind !== 'interface-placeholder'
      && geometry !== undefined
      && geometry.shape !== 'symbolic-marker'
      && (record.reconstructionLevel === 'R2' || geometry.shape === 'screw')
    return {
      instanceId,
      definitionId: record.canonicalId,
      label,
      accessibleLabel: `${label}; subsistema ${record.subsystem}; identidad ${instanceId}`,
      officialReference: record.officialReference,
      subsystem: record.subsystem,
      sourceIds: [...record.sourceIds],
      fastener: definition?.roles.includes('fastener') ?? false,
      interfacePlaceholder: record.entityKind === 'interface-placeholder',
      reconstructionLevel: record.reconstructionLevel,
      reconstructionState: record.modelState,
      fidelity: structuredClone(record.fidelity),
      limitations: [...record.limitations],
      state: manipulable ? 'installed' as const : record.reconstructionLevel === 'R0' ? 'blocked' as const : 'unknown' as const,
      orientation: 'as-installed' as const,
    }
  }))
}

export function createWorkbenchDependencies(
  fixture: TechnicalMovementFixture = MIYOTA_2035_TECHNICAL_FIXTURE,
): WorkbenchDependency[] {
  const dependencies: WorkbenchDependency[] = []
  for (const relation of fixture.relations) {
    if (relation.type === 'remove-before') {
      dependencies.push({
        id: `workbench.disassembly.${relation.id}`,
        phase: 'disassembly',
        kind: 'remove-before',
        beforeInstanceId: relation.fromInstanceId,
        afterInstanceId: relation.toInstanceId,
        authority: authority(relation),
        sourceIds: [...relation.sourceIds],
        confidence: relation.confidence,
        blocking: true,
        limitations: [...relation.limitations],
      })
      dependencies.push({
        id: `workbench.assembly.${relation.id}`,
        phase: 'assembly',
        kind: 'requires-present',
        beforeInstanceId: relation.toInstanceId,
        afterInstanceId: relation.fromInstanceId,
        authority: authority(relation),
        sourceIds: [...relation.sourceIds],
        confidence: relation.confidence,
        blocking: true,
        limitations: [
          'Inversión estructural de una dependencia de desmontaje; no se presenta como secuencia oficial completa.',
          ...relation.limitations,
        ],
      })
    }
    if (['supports', 'covers', 'retains', 'fastened-by'].includes(relation.type)) {
      dependencies.push({
        id: `workbench.${relation.type}.${relation.id}`,
        phase: relation.type === 'fastened-by' ? 'assembly' : 'disassembly',
        kind: relation.type as WorkbenchDependency['kind'],
        beforeInstanceId: relation.fromInstanceId,
        afterInstanceId: relation.toInstanceId,
        authority: authority(relation),
        sourceIds: [...relation.sourceIds],
        confidence: relation.confidence,
        blocking: false,
        limitations: [...relation.limitations],
      })
    }
  }
  return dependencies
}
