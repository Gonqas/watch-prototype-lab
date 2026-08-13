import { createQuartzProject } from '../../vnext/presets'
import { miyotaMovement } from '../../vnext/miyotaCatalog'
import type { WatchProject } from '../../vnext/model'
import type { CanonicalAssembly } from '../canonical'
import { deterministicCanonicalId } from '../identity'
import type { SourceCitation } from '../sources'

export function createV5ProjectFixture(): WatchProject {
  const project = createQuartzProject('miyota_2035')
  return {
    ...project,
    id: 'fixture-v5-miyota-2035',
    name: 'Fixture v5 MIYOTA 2035',
    createdAt: '2026-07-22T09:00:00.000Z',
    modifiedAt: '2026-07-22T09:00:00.000Z',
  }
}

const observation: SourceCitation = {
  id: 'fixture-observation-plate',
  authority: 'physical-unit-observation',
  usage: 'user-created',
  resource: { kind: 'measurement', title: 'Unidad de prueba abstracta' },
  importedAt: '2026-07-22T09:00:00.000Z',
  supportedClaim: 'La unidad de prueba contiene una platina y dos tornillos equivalentes.',
  derivedLayer: 'observation',
  originalSourceId: 'fixture-physical-unit',
}

export function createMinimalV6Fixture(): CanonicalAssembly {
  const assemblyId = deterministicCanonicalId('assembly', 'fixture-v6-1', 'minimal')
  const plateDefinitionId = deterministicCanonicalId('part-definition', 'fixture-v6-1', 'plate')
  const screwDefinitionId = deterministicCanonicalId('part-definition', 'fixture-v6-1', 'screw-m1')
  const plateId = deterministicCanonicalId('part-instance', 'fixture-v6-1', 'plate-1')
  const screwAId = deterministicCanonicalId('part-instance', 'fixture-v6-1', 'screw-a')
  const screwBId = deterministicCanonicalId('part-instance', 'fixture-v6-1', 'screw-b')
  const common = {
    assemblyId,
    state: 'active' as const,
    persistence: 'canonical' as const,
    revision: 1,
    createdAt: '2026-07-22T09:00:00.000Z',
    modifiedAt: '2026-07-22T09:00:00.000Z',
    tags: ['fixture'],
  }
  return {
    schemaVersion: 6,
    id: assemblyId,
    name: 'Ensamblaje canónico mínimo',
    source: { kind: 'native-v6' },
    definitions: [
      {
        id: plateDefinitionId,
        category: 'plate',
        classification: 'known',
        name: 'Platina abstracta',
        roles: ['structure'],
        subsystems: ['movement-structure'],
        tags: ['fixture'],
        provenance: [observation],
        fidelity: { geometry: 'G1', kinematics: 'K0', physics: 'P0', limitations: ['Sin geometría dimensional.'] },
      },
      {
        id: screwDefinitionId,
        category: 'screw',
        classification: 'known',
        name: 'Tornillo abstracto repetible',
        roles: ['fastener'],
        subsystems: ['movement-structure'],
        tags: ['fixture'],
        provenance: [observation],
      },
    ],
    instances: [
      { ...common, id: plateId, definitionId: plateDefinitionId, role: 'main-plate', subsystem: 'movement-structure' },
      { ...common, id: screwAId, definitionId: screwDefinitionId, role: 'bridge-screw', subsystem: 'movement-structure' },
      { ...common, id: screwBId, definitionId: screwDefinitionId, role: 'bridge-screw', subsystem: 'movement-structure' },
    ],
    interfaces: [{
      id: deterministicCanonicalId('assembly-interface', 'fixture-v6-1', 'screw-a-thread'),
      assemblyId,
      domain: 'assembly',
      kind: 'screw-thread',
      participants: [
        { instanceId: screwAId, interfaceRole: 'screw' },
        { instanceId: plateId, interfaceRole: 'threaded-receiver' },
      ],
      parameters: {},
      state: 'active',
      persistence: 'canonical',
      provenance: [observation],
    }],
    dependencies: [{
      id: deterministicCanonicalId('assembly-dependency', 'fixture-v6-1', 'screw-a-before-plate'),
      assemblyId,
      predecessorId: screwAId,
      successorId: plateId,
      severity: 'required',
      motive: 'Retirar el elemento de fijación antes de levantar la platina.',
      tools: ['screwdriver-unspecified'],
      preconditions: ['assembly-deenergized'],
      risks: ['damage-if-forced'],
      persistence: 'canonical',
    }],
    movementReferences: [],
  }
}

export function createMiyota8215SemanticFixture(): CanonicalAssembly {
  const official = miyotaMovement('8215')
  const assemblyId = deterministicCanonicalId('assembly', 'fixture-miyota-1', '8215-documentary')
  const productSource: SourceCitation = {
    id: 'miyota-8215-official-product',
    authority: 'official-miyota',
    usage: 'official-linked',
    resource: { kind: 'web-page', title: 'MIYOTA Caliber 8215', locator: official.productUrl },
    calibre: official.calibre,
    retrievedAt: official.verifiedAt,
    supportedClaim: 'Referencia documental oficial del calibre MIYOTA 8215.',
    derivedLayer: 'source',
  }
  return {
    schemaVersion: 6,
    id: assemblyId,
    name: 'MIYOTA 8215 · fixture documental',
    source: { kind: 'native-v6' },
    definitions: [],
    instances: [],
    interfaces: [],
    dependencies: [],
    movementReferences: [{
      id: deterministicCanonicalId('movement-reference', 'fixture-miyota-1', '8215'),
      manufacturer: 'MIYOTA',
      calibre: official.calibre,
      mechanism: official.mechanism,
      classification: 'known',
      facts: {
        family: official.family,
        variant: official.calibre,
        functions: official.functions,
        runningTimeHours: official.runningTimeHours,
        frequencyVph: official.frequencyVph,
        jewels: official.jewels,
      },
      provenance: [productSource],
      fidelity: { geometry: 'G0', kinematics: 'K0', physics: 'P0', limitations: ['No contiene despiece, geometría ni relaciones internas.'] },
    }],
  }
}

export function createScratchMultibrandFixture(): CanonicalAssembly {
  const assemblyId = deterministicCanonicalId('assembly', 'fixture-scratch-1', 'generic')
  const definitionId = deterministicCanonicalId('part-definition', 'fixture-scratch-1', 'experimental-carrier')
  return {
    schemaVersion: 6,
    id: assemblyId,
    name: 'Movimiento scratch sin marca',
    source: { kind: 'native-v6' },
    definitions: [{
      id: definitionId,
      category: 'experimental-carrier',
      classification: 'placeholder',
      name: 'Portador diseñado',
      roles: ['structure'],
      subsystems: ['experimental'],
      tags: ['scratch', 'multibrand-proof'],
      provenance: [],
    }],
    instances: [{
      id: deterministicCanonicalId('part-instance', 'fixture-scratch-1', 'carrier-1'),
      definitionId,
      assemblyId,
      state: 'active',
      persistence: 'canonical',
      revision: 1,
      createdAt: '2026-07-22T09:00:00.000Z',
      modifiedAt: '2026-07-22T09:00:00.000Z',
      role: 'main-structure',
      subsystem: 'experimental',
      tags: ['scratch'],
    }],
    interfaces: [],
    dependencies: [],
    movementReferences: [],
  }
}
