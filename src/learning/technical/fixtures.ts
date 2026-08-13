import type { PartDefinitionId, PartInstanceId } from '../identity'
import { deterministicCanonicalId } from '../identity'
import { ProjectEntityIndex, type CanonicalAssembly } from '../canonical'
import { SemanticSelectorResolver } from '../runtime/selectors'
import type { SourceCitation } from '../sources'
import {
  BLUEPRINT_SOURCE_ID,
  MIYOTA_2035_SOURCE_IDS,
  MIYOTA_8215_SOURCE_IDS,
  officialSourceCitation,
} from './officialSources'
import {
  FirstModuleTechnicalFixtureSchema,
  TechnicalMovementFixtureSchema,
  type CompiledFirstModuleFixture,
  type FirstModuleTechnicalFixture,
  type FunctionalRelationship,
  type ReconstructionLevel,
  type ReconstructionPartRecord,
  type ReconstructionState,
  type TechnicalDataLayer,
  type TechnicalFixtureCapability,
  type TechnicalFunctionalRelation,
  type TechnicalGeometryPrimitive,
  type TechnicalMovementFixture,
  type TechnicalSelectorContract,
  type TechnicalVisualErrorScenario,
} from './reconstruction'

const FIXTURE_VERSION = '0.1.0'
const REVIEWED_AT = '2026-07-23'

const BLUEPRINT_CITATION: SourceCitation = {
  id: BLUEPRINT_SOURCE_ID,
  authority: 'original-educational',
  usage: 'user-created',
  resource: { kind: 'note', title: 'Sistema 4B · blueprint editorial v0.1' },
  authorOrManufacturer: 'Blueprint editorial entregado por el usuario',
  sourceType: 'original-educational-content',
  importedAt: REVIEWED_AT,
  privateUse: true,
  supportedClaim: 'Define los cuatro fixtures técnicos y su separación entre modelos conceptuales y calibres reales.',
  derivedLayer: 'source',
}

type Shape = TechnicalGeometryPrimitive['shape']
type Vec3 = [number, number, number]

interface PartSeed {
  key: string
  nameEs: string
  nameEn: string
  category: string
  subsystem: string
  roles: string[]
  officialReference?: string
  quantity?: number
  entityKind?: ReconstructionPartRecord['entityKind']
  modelState?: ReconstructionState
  reconstructionLevel?: ReconstructionLevel
  shape?: Shape
  visualProfile?: TechnicalGeometryPrimitive['visualProfile']
  toothCount?: number
  boreRatio?: number
  cutaway?: boolean
  opacity?: number
  position?: Vec3
  size?: Vec3
  sourceIds?: string[]
  limitations?: string[]
}

interface RelationSeed {
  key: string
  type: FunctionalRelationship
  from: string
  to: string
  layer: TechnicalDataLayer
  sourceIds: string[]
  confidence: TechnicalFunctionalRelation['confidence']
  limitations?: string[]
}

interface VisualErrorSeed {
  key: string
  label: string
  affectedPartKeys: string[]
  effect: TechnicalVisualErrorScenario['effect']
  limitations: string[]
}

interface FixtureSeed {
  id: string
  kind: TechnicalMovementFixture['kind']
  manufacturer?: string
  calibre?: string
  family: string
  variant: string
  reconstructionLevel: ReconstructionLevel
  parts: PartSeed[]
  relations: RelationSeed[]
  selectors: TechnicalSelectorContract[]
  sourceIds: string[]
  fidelity: TechnicalMovementFixture['fidelity']
  limitations: string[]
  missingPartRoles?: string[]
  visualErrors?: VisualErrorSeed[]
}

function safeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function makeSelector(id: string, selector: TechnicalSelectorContract['selector'], cardinality: TechnicalSelectorContract['cardinality'], purpose: string): TechnicalSelectorContract {
  return { id, selector, cardinality, purpose }
}

function roleSelectors(prefix: string, roles: string[]): TechnicalSelectorContract[] {
  return roles.map((role) => makeSelector(
    `selector.${prefix}.${role}`,
    { by: 'role', value: role },
    'exactly-one',
    `Resolver el rol semántico ${role}.`,
  ))
}

function groupSelector(prefix: string, subsystem: string, purpose: string): TechnicalSelectorContract {
  return makeSelector(`selector.${prefix}.${subsystem}`, { by: 'subsystem', value: subsystem }, 'one-or-more', purpose)
}

function sourceCitation(sourceId: string, claim: string): SourceCitation {
  return sourceId.startsWith('source.miyota.')
    ? officialSourceCitation(sourceId, claim)
    : { ...BLUEPRINT_CITATION, supportedClaim: claim }
}

function buildFixture(seed: FixtureSeed): TechnicalMovementFixture {
  const namespace = seed.id
  const assemblyId = deterministicCanonicalId('assembly', namespace, 'assembly')
  const movementReferenceId = deterministicCanonicalId('movement-reference', namespace, 'movement-reference')
  const definitionByKey = new Map<string, PartDefinitionId>()
  const instancesByKey = new Map<string, PartInstanceId[]>()
  const definitions: CanonicalAssembly['definitions'] = []
  const instances: CanonicalAssembly['instances'] = []
  const geometry: TechnicalGeometryPrimitive[] = []

  seed.parts.forEach((part, partIndex) => {
    const definitionId = deterministicCanonicalId('part-definition', namespace, part.key)
    const quantity = part.quantity ?? 1
    const sourceIds = part.sourceIds ?? seed.sourceIds
    definitionByKey.set(part.key, definitionId)
    definitions.push({
      id: definitionId,
      category: part.category,
      classification: part.officialReference || part.entityKind === 'conceptual-component' ? 'known' : 'placeholder',
      name: part.nameEs,
      manufacturer: seed.manufacturer,
      reference: part.officialReference,
      roles: part.roles,
      subsystems: [part.subsystem],
      tags: [
        `fixture:${safeToken(seed.id)}`,
        `family:${safeToken(seed.family)}`,
        ...(seed.calibre ? [`calibre:${safeToken(seed.calibre)}`] : []),
      ],
      provenance: sourceIds.map((id) => sourceCitation(id, part.officialReference
        ? `${part.nameEn} (${part.officialReference}) figura en la documentación registrada.`
        : `${part.nameEn} se mantiene como componente conceptual o placeholder explícito.`)),
      fidelity: {
        geometry: !part.reconstructionLevel || part.reconstructionLevel === 'R0' ? 'G0' : part.reconstructionLevel === 'R1' ? 'G1' : seed.fidelity.geometry,
        kinematics: seed.fidelity.kinematics,
        physics: seed.fidelity.physics,
        limitations: part.limitations ?? [],
      },
    })
    const partInstances: PartInstanceId[] = []
    for (let instanceIndex = 0; instanceIndex < quantity; instanceIndex += 1) {
      const instanceId = deterministicCanonicalId('part-instance', namespace, `${part.key}:${instanceIndex + 1}`)
      const geometryId = `geometry.${safeToken(seed.id)}.${part.key}.${instanceIndex + 1}`
      partInstances.push(instanceId)
      instances.push({
        id: instanceId,
        definitionId,
        assemblyId,
        state: 'active',
        persistence: 'canonical',
        revision: 1,
        createdAt: `${REVIEWED_AT}T00:00:00.000Z`,
        modifiedAt: `${REVIEWED_AT}T00:00:00.000Z`,
        role: part.roles[0],
        subsystem: part.subsystem,
        tags: [
          `fixture:${safeToken(seed.id)}`,
          `part:${part.key}`,
          ...(seed.calibre ? [`calibre:${safeToken(seed.calibre)}`] : []),
        ],
        geometryRef: geometryId,
      })
      const defaultPosition: Vec3 = [
        ((partIndex % 7) - 3) * 1.4,
        Math.floor(partIndex / 7) * 0.45 + instanceIndex * 0.12,
        (Math.floor(partIndex / 7) % 3 - 1) * 1.25,
      ]
      geometry.push({
        id: geometryId,
        entityId: instanceId,
        shape: part.shape ?? 'symbolic-marker',
        visualProfile: part.visualProfile,
        toothCount: part.toothCount,
        boreRatio: part.boreRatio,
        cutaway: part.cutaway,
        coordinateSpace: 'normalized-educational',
        position: part.position
          ? [part.position[0] + instanceIndex * 0.18, part.position[1], part.position[2]]
          : defaultPosition,
        size: part.size ?? [0.55, 0.16, 0.55],
        layer: part.entityKind === 'conceptual-component' ? 'educational-simulation' : 'visual-reconstruction-estimate',
        sourceIds,
        color: colorForSubsystem(part.subsystem),
        opacity: part.opacity ?? 1,
        limitations: [
          'Coordenadas y tamaño normalizados; no son dimensiones ni posición nominales.',
          ...(part.limitations ?? []),
        ],
      })
    }
    instancesByKey.set(part.key, partInstances)
  })

  const relations: TechnicalFunctionalRelation[] = seed.relations.flatMap((relation) => {
    const fromIds = instancesByKey.get(relation.from) ?? []
    const toIds = instancesByKey.get(relation.to) ?? []
    if (fromIds.length === 0 || toIds.length === 0) throw new Error(`Relación ${relation.key} con pieza inexistente.`)
    return fromIds.flatMap((fromId, index) => {
      const toId = toIds[Math.min(index, toIds.length - 1)]
      return [{
        id: `relation.${safeToken(seed.id)}.${relation.key}.${index + 1}`,
        type: relation.type,
        fromInstanceId: fromId,
        toInstanceId: toId,
        layer: relation.layer,
        sourceIds: relation.sourceIds,
        confidence: relation.confidence,
        reversible: true,
        limitations: relation.limitations ?? [],
      }]
    })
  })

  const interfaces: CanonicalAssembly['interfaces'] = relations.map((relation) => ({
    id: deterministicCanonicalId('assembly-interface', namespace, relation.id),
    assemblyId,
    domain: relation.type === 'drives' || relation.type === 'meshes-with' || relation.type === 'impulses'
      ? 'kinematics'
      : relation.type === 'winds' ? 'energy' : 'assembly',
    kind: relation.type,
    participants: [
      { instanceId: relation.fromInstanceId, interfaceRole: 'source' },
      { instanceId: relation.toInstanceId, interfaceRole: 'target' },
    ],
    parameters: { technicalRelationId: relation.id, confidence: relation.confidence },
    state: 'active',
    persistence: 'canonical',
    provenance: relation.sourceIds.map((id) => sourceCitation(id, `Relación ${relation.type} del fixture ${seed.id}.`)),
  }))

  const dependencies: CanonicalAssembly['dependencies'] = relations
    .filter(({ type }) => type === 'remove-before')
    .map((relation) => ({
      id: deterministicCanonicalId('assembly-dependency', namespace, relation.id),
      assemblyId,
      predecessorId: relation.fromInstanceId,
      successorId: relation.toInstanceId,
      severity: 'required',
      motive: relation.limitations[0] ?? `Retirar ${relation.fromInstanceId} antes de ${relation.toInstanceId}.`,
      tools: [],
      preconditions: ['assembly-deenergized'],
      risks: ['sequence-not-physically-validated'],
      persistence: 'canonical',
    }))

  const assembly: CanonicalAssembly = {
    schemaVersion: 6,
    id: assemblyId,
    name: seed.calibre
      ? `${seed.manufacturer ?? ''} ${seed.calibre} · ensamblaje técnico ${seed.reconstructionLevel}`.trim()
      : `${seed.family} · modelo técnico conceptual`,
    source: { kind: 'native-v6' },
    definitions,
    instances,
    interfaces,
    dependencies,
    movementReferences: [{
      id: movementReferenceId,
      manufacturer: seed.manufacturer ?? 'Watch Prototype Lab',
      calibre: seed.calibre ?? seed.variant,
      mechanism: seed.kind.includes('quartz') ? 'quartz' : 'mechanical',
      classification: seed.calibre ? 'known' : 'placeholder',
      facts: { family: seed.family, variant: seed.variant, reconstructionLevel: seed.reconstructionLevel },
      provenance: seed.sourceIds.map((id) => sourceCitation(id, `Identidad del fixture ${seed.id}.`)),
      fidelity: seed.fidelity,
    }],
  }

  const relationIdsByInstance = new Map<string, string[]>()
  const interfaceIdsByInstance = new Map<string, CanonicalAssembly['interfaces'][number]['id'][]>()
  relations.forEach((relation, index) => {
    for (const id of [relation.fromInstanceId, relation.toInstanceId]) {
      relationIdsByInstance.set(id, [...(relationIdsByInstance.get(id) ?? []), relation.id])
      interfaceIdsByInstance.set(id, [...(interfaceIdsByInstance.get(id) ?? []), interfaces[index].id])
    }
  })

  const ledger: ReconstructionPartRecord[] = seed.parts.map((part) => {
    const canonicalId = definitionByKey.get(part.key)
    const instanceIds = instancesByKey.get(part.key)
    if (!canonicalId || !instanceIds) throw new Error(`Pieza sin identidad canónica: ${part.key}`)
    const geometryPrimitiveIds = geometry.filter(({ entityId }) => instanceIds.includes(entityId)).map(({ id }) => id)
    const sourceIds = part.sourceIds ?? seed.sourceIds
    return {
      canonicalId,
      instanceIds,
      entityKind: part.entityKind ?? (part.officialReference ? 'official-part' : 'interface-placeholder'),
      manufacturer: seed.manufacturer,
      calibre: seed.calibre,
      family: seed.family,
      variant: seed.variant,
      officialReference: part.officialReference,
      nameEs: part.nameEs,
      nameEn: part.nameEn,
      nameEsClassification: 'editorial-translation',
      subsystem: part.subsystem,
      sourceIds,
      officialGeometryAvailable: false,
      officialDimensions: [],
      measuredDimensions: [],
      estimatedDimensions: [],
      toothCount: part.toothCount
        ? {
            id: `datum.${safeToken(seed.id)}.${part.key}.tooth-count`,
            label: `Dientes educativos de ${part.nameEs}`,
            kind: 'count',
            value: part.toothCount,
            unit: 'count',
            layer: 'educational-simulation',
            sourceIds,
            method: 'Parámetro cinemático del modelo conceptual declarado; no atribuido a un calibre real.',
            limitations: ['Conteo educativo para relaciones y contacto visual; no es un dato nominal MIYOTA.'],
          }
        : undefined,
      interfaceIds: [...new Set(instanceIds.flatMap((id) => interfaceIdsByInstance.get(id) ?? []))],
      functionalRelationshipIds: [...new Set(instanceIds.flatMap((id) => relationIdsByInstance.get(id) ?? []))],
      geometryPrimitiveIds,
      modelState: part.modelState ?? 'documented',
      reconstructionLevel: part.reconstructionLevel ?? 'R0',
      fidelity: {
        geometry: part.reconstructionLevel === 'R0' || !part.reconstructionLevel ? 'G0' : seed.fidelity.geometry,
        kinematics: seed.fidelity.kinematics,
        physics: seed.fidelity.physics,
        limitations: part.limitations ?? [],
      },
      limitations: part.limitations ?? [],
      revision: FIXTURE_VERSION,
      reviewedAt: REVIEWED_AT,
    }
  })

  addOfficialEnvelopeData(seed, ledger)
  const visualErrorScenarios: TechnicalVisualErrorScenario[] = (seed.visualErrors ?? []).map((scenario) => ({
    id: `error.${safeToken(seed.id)}.${scenario.key}`,
    label: scenario.label,
    affectedInstanceIds: scenario.affectedPartKeys.flatMap((key) => instancesByKey.get(key) ?? []),
    effect: scenario.effect,
    layer: 'educational-simulation',
    sourceIds: [BLUEPRINT_SOURCE_ID],
    reversible: true,
    engineeringValidated: false,
    limitations: scenario.limitations,
  }))

  return TechnicalMovementFixtureSchema.parse({
    id: seed.id,
    version: FIXTURE_VERSION,
    kind: seed.kind,
    manufacturer: seed.manufacturer,
    calibre: seed.calibre,
    family: seed.family,
    variant: seed.variant,
    reconstructionLevel: seed.reconstructionLevel,
    assembly,
    ledger,
    geometry,
    relations,
    selectors: seed.selectors,
    capabilities: fixtureCapabilities(),
    visualErrorScenarios,
    missingPartRoles: seed.missingPartRoles ?? [],
    sourceIds: seed.sourceIds,
    fidelity: seed.fidelity,
    limitations: seed.limitations,
  })
}

function addOfficialEnvelopeData(seed: FixtureSeed, ledger: ReconstructionPartRecord[]): void {
  const envelope = ledger.find(({ nameEn }) => nameEn === 'Official movement envelope')
  if (!envelope || !seed.calibre) return
  const dimensions = seed.calibre === '2035'
    ? [
        ['width', 'Anchura nominal', 15.3, MIYOTA_2035_SOURCE_IDS.specification],
        ['length', 'Longitud nominal', 18.5, MIYOTA_2035_SOURCE_IDS.specification],
        ['height', 'Altura nominal', 3.15, MIYOTA_2035_SOURCE_IDS.specification],
      ] as const
    : seed.calibre === '8215'
      ? [
          ['diameter', 'Diámetro nominal', 26, MIYOTA_8215_SOURCE_IDS.specification],
          ['height', 'Altura nominal', 5.67, MIYOTA_8215_SOURCE_IDS.specification],
        ] as const
      : []
  envelope.officialGeometryAvailable = true
  envelope.modelState = 'envelope-only'
  envelope.reconstructionLevel = 'R1'
  envelope.officialDimensions = dimensions.map(([key, label, value, sourceId]) => ({
    id: `datum.${safeToken(seed.id)}.envelope.${key}`,
    label,
    kind: 'dimension',
    value,
    unit: 'mm',
    layer: 'official-nominal',
    sourceIds: [sourceId],
    method: 'Transcripción del documento oficial registrado.',
    limitations: ['Describe la envolvente general; no el contorno ni la geometría interna de una pieza.'],
  }))
}

function colorForSubsystem(subsystem: string): string {
  const colors: Record<string, string> = {
    'power-source': '#c6b25a',
    'electronic-control': '#4aa382',
    motor: '#c36a4a',
    train: '#d6a13d',
    'motion-works': '#cfbf72',
    keyless: '#7992a8',
    indication: '#e8e5d8',
    structure: '#8d989f',
    regulation: '#d77575',
    escapement: '#cb6d86',
    automatic: '#8f76bd',
    calendar: '#5d94bf',
    fasteners: '#aab0b3',
  }
  return colors[subsystem] ?? '#8a9696'
}

function fixtureCapabilities(): TechnicalFixtureCapability[] {
  return [
    ['fixture.entity-selection', 'available', 'Todas las instancias canónicas tienen identidad seleccionable.', []],
    ['fixture.visibility', 'available', 'El overlay puede ocultar o mostrar entidades sin alterar el ensamblaje.', []],
    ['fixture.isolation', 'available', 'Los subsistemas e instancias pueden aislarse semánticamente.', []],
    ['fixture.transparency', 'available', 'El modelo técnico admite opacidad por entidad.', []],
    ['fixture.highlight', 'available', 'El modelo técnico admite resaltado por entidad.', []],
    ['fixture.explode', 'limited', 'Existe orden visual normalizado y dependencias parciales.', ['No es una trayectoria física validada.']],
    ['fixture.labels', 'available', 'Cada entidad tiene nombres ES/EN e identidad estable.', []],
    ['fixture.rotation-directions', 'limited', 'Las relaciones permiten declarar sentido posteriormente.', ['No hay vectores ni animación anclada en el viewport real.']],
    ['fixture.energy-route', 'limited', 'Las relaciones drives/winds/impulses forman rutas consultables.', ['El viewport no dibuja aún flechas espaciales.']],
    ['fixture.visual-errors', 'limited', 'Los errores visuales son estados simbólicos reversibles.', ['No son fallos físicos ni diagnósticos de ingeniería validados.']],
    ['fixture.reversible-state', 'available', 'Las operaciones se aplican como overlay restaurable.', []],
  ].map(([id, status, explanation, limitations]) => ({
    id: id as string,
    status: status as TechnicalFixtureCapability['status'],
    explanation: explanation as string,
    limitations: limitations as string[],
  }))
}

function p(
  key: string,
  nameEs: string,
  nameEn: string,
  category: string,
  subsystem: string,
  roles: string[],
  officialReference?: string,
  options: Partial<PartSeed> = {},
): PartSeed {
  return { key, nameEs, nameEn, category, subsystem, roles, officialReference, ...options }
}

const parts2035: PartSeed[] = [
  p('official-envelope', 'Envolvente oficial del movimiento', 'Official movement envelope', 'movement-envelope', 'structure', ['movement-envelope'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'box', position: [0, 0, 0], size: [6.2, 0.35, 5.2], sourceIds: [MIYOTA_2035_SOURCE_IDS.specification, MIYOTA_2035_SOURCE_IDS.drawing], limitations: ['No representa el contorno detallado de la platina.'] }),
  p('base-structure', 'Estructura base visible', 'Visible base structure', 'plate', 'structure', ['structure', 'main-plate'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [0, 0.1, 0], size: [5.8, 0.18, 4.8], limitations: ['La lista oficial no publica una referencia separada para la estructura base; contorno estimado.'] }),
  p('battery', 'Pila SR626SW', 'Battery SR626SW', 'battery', 'power-source', ['power-source'], 'SR626SW', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-1.7, 0.45, 0.9], size: [1.6, 0.32, 1.6], sourceIds: [MIYOTA_2035_SOURCE_IDS.specification] }),
  p('battery-clamp', 'Abrazadera de pila', 'Battery clamp', 'clamp', 'power-source', ['battery-retainer'], '234-C87', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [-1.7, 0.72, 0.9], size: [1.9, 0.12, 0.5] }),
  p('powercell-connector', 'Muelle conector de pila', 'Power-cell connector spring', 'contact-spring', 'power-source', ['power-contact'], '231-999', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [-0.9, 0.48, 0.4], size: [1.1, 0.1, 0.18] }),
  p('electronic-circuit', 'Unidad de circuito electrónico', 'Electronic circuit unit', 'electronic-circuit', 'electronic-control', ['electronic-control', 'quartz-resonator'], '279-M31', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'box', position: [0.8, 0.5, 1.2], size: [2.2, 0.16, 1.4], limitations: ['El resonador de cuarzo no figura como recambio separado; el selector comparte esta unidad oficial.'] }),
  p('circuit-spacer', 'Separador de circuito', 'Circuit spacer', 'spacer', 'electronic-control', ['circuit-spacer'], '212-B13'),
  p('coil-unit', 'Unidad de bobina', 'Coil unit', 'coil', 'motor', ['coil'], '246-144', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'coil', position: [1.4, 0.62, -0.8], size: [1.4, 0.22, 1.1] }),
  p('stator', 'Estator', 'Stator', 'stator', 'motor', ['stator'], '190-A43', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'ring', position: [0.55, 0.42, -0.7], size: [0.9, 0.18, 0.9] }),
  p('stepper-rotor', 'Rotor magnetizado', 'Rotor (magnetized)', 'rotor', 'motor', ['stepper-rotor'], '285-202', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.55, 0.55, -0.7], size: [0.45, 0.26, 0.45] }),
  p('train-wheel-bridge', 'Puente del tren', 'Train wheel bridge', 'bridge', 'structure', ['train-bridge'], '701-K14', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [0, 1.28, -0.55], size: [3.4, 0.2, 2.1] }),
  p('third-wheel', 'Tercera rueda y piñón', 'Third wheel and pinion', 'wheel-and-pinion', 'train', ['third-wheel'], '017-A14', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-0.1, 0.72, -0.15], size: [0.95, 0.15, 0.95] }),
  p('fourth-wheel', 'Cuarta rueda y piñón', 'Fourth wheel and pinion', 'wheel-and-pinion', 'train', ['fourth-wheel'], '023-155', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-0.8, 0.82, -0.85], size: [0.78, 0.14, 0.78] }),
  p('fifth-wheel', 'Quinta rueda y piñón', 'Fifth wheel and pinion', 'wheel-and-pinion', 'train', ['fifth-wheel'], '084-971', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-1.25, 0.94, -1.35], size: [0.58, 0.12, 0.58] }),
  p('cannon-pinion', 'Cañón de minutos con rueda conductora', 'Cannon pinion with driving wheel', 'cannon-pinion', 'motion-works', ['cannon-pinion'], '028-610', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0, 1.08, 0], size: [0.55, 0.32, 0.55] }),
  p('minute-wheel', 'Rueda de minutería y piñón', 'Minute wheel and pinion', 'wheel-and-pinion', 'motion-works', ['minute-wheel'], '072-760', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.72, 1.1, 0.2], size: [0.72, 0.14, 0.72] }),
  p('hour-wheel', 'Rueda de horas', 'Hour wheel', 'wheel', 'motion-works', ['hour-wheel'], '075-193', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0, 1.35, 0], size: [0.88, 0.14, 0.88] }),
  p('center-wheel-cock', 'Puente de rueda central', 'Center wheel cock', 'cock', 'structure', ['center-wheel-support'], '711-281'),
  p('clutch-wheel', 'Piñón corredizo', 'Clutch wheel', 'clutch-wheel', 'keyless', ['clutch-wheel'], '064-660', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [2.1, 0.52, 0], size: [0.5, 0.18, 0.5] }),
  p('clutch-wheel-guard', 'Protector del piñón corredizo', 'Clutch wheel guard', 'guard', 'keyless', ['clutch-guard'], '212-B17'),
  p('setting-lever', 'Tirete', 'Setting lever', 'lever', 'keyless', ['setting-lever'], '067-146', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [2.25, 0.72, 0.55], size: [1, 0.1, 0.18] }),
  p('setting-stem', 'Tija', 'Setting stem', 'stem', 'keyless', ['keyless', 'stem'], '065-468', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [3.1, 0.56, 0], size: [2.6, 0.14, 0.14] }),
  p('yoke', 'Báscula', 'Yoke', 'yoke', 'keyless', ['yoke'], '071-A14', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [2.05, 0.76, -0.45], size: [0.9, 0.1, 0.18] }),
  p('fourth-wheel-stop', 'Palanca de parada de cuarta rueda', 'Fourth wheel stop lever', 'lever', 'train', ['stop-lever'], '269-413'),
  p('dial-washer', 'Arandela de esfera', 'Dial washer', 'washer', 'structure', ['dial-retainer'], '078-040'),
  p('screw-coil', 'Tornillo de bobina', 'Screw for coil unit', 'screw', 'fasteners', ['fastener'], '922-183', { shape: 'screw' }),
  p('screw-circuit-1', 'Tornillo de circuito 1', 'Screw for electronic circuit unit (1)', 'screw', 'fasteners', ['fastener'], '922-183', { shape: 'screw' }),
  p('screw-circuit-2', 'Tornillo de circuito 2', 'Screw for electronic circuit unit (2)', 'screw', 'fasteners', ['fastener'], '922-154', { shape: 'screw' }),
  p('screw-bridge-1', 'Tornillo de puente de tren 1', 'Screw for train wheel bridge (1)', 'screw', 'fasteners', ['fastener'], '922-154', { shape: 'screw' }),
  p('screw-bridge-2', 'Tornillo de puente de tren 2', 'Screw for train wheel bridge (2)', 'screw', 'fasteners', ['fastener'], '934-440', { shape: 'screw' }),
  p('hour-hand-interface', 'Interfaz de aguja horaria', 'Hour hand interface', 'hand-interface', 'indication', ['indication', 'hour-hand'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', sourceIds: [MIYOTA_2035_SOURCE_IDS.drawing], limitations: ['La aguja no forma parte de la lista de piezas del movimiento.'] }),
  p('minute-hand-interface', 'Interfaz de aguja minutera', 'Minute hand interface', 'hand-interface', 'indication', ['indication', 'minute-hand'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', sourceIds: [MIYOTA_2035_SOURCE_IDS.drawing], limitations: ['La aguja no forma parte de la lista de piezas del movimiento.'] }),
  p('second-hand-interface', 'Interfaz de segundero', 'Second hand interface', 'hand-interface', 'indication', ['indication', 'second-hand'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', sourceIds: [MIYOTA_2035_SOURCE_IDS.drawing], limitations: ['La aguja no forma parte de la lista de piezas del movimiento.'] }),
]

const relations2035: RelationSeed[] = [
  { key: 'battery-circuit', type: 'drives', from: 'battery', to: 'electronic-circuit', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'medium', limitations: ['Relación funcional; no representa una conexión eléctrica dimensional.'] },
  { key: 'battery-clamp-retains', type: 'retains', from: 'battery-clamp', to: 'battery', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'circuit-coil', type: 'drives', from: 'electronic-circuit', to: 'coil-unit', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'coil-rotor', type: 'impulses', from: 'coil-unit', to: 'stepper-rotor', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'stator-rotor', type: 'supports', from: 'stator', to: 'stepper-rotor', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'rotor-third', type: 'drives', from: 'stepper-rotor', to: 'third-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'low', limitations: ['La topología exacta debe confirmarse con el despiece visual; no se declara relación de dientes.'] },
  { key: 'third-fourth', type: 'meshes-with', from: 'third-wheel', to: 'fourth-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'fourth-fifth', type: 'meshes-with', from: 'fourth-wheel', to: 'fifth-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'fifth-cannon', type: 'drives', from: 'fifth-wheel', to: 'cannon-pinion', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'low' },
  { key: 'cannon-minute', type: 'drives', from: 'cannon-pinion', to: 'minute-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'minute-hour', type: 'drives', from: 'minute-wheel', to: 'hour-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'cannon-minute-hand', type: 'drives', from: 'cannon-pinion', to: 'minute-hand-interface', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.drawing], confidence: 'high' },
  { key: 'hour-wheel-hand', type: 'drives', from: 'hour-wheel', to: 'hour-hand-interface', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.drawing], confidence: 'high' },
  { key: 'fourth-second-hand', type: 'drives', from: 'fourth-wheel', to: 'second-hand-interface', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.drawing], confidence: 'medium' },
  { key: 'bridge-covers-train', type: 'covers', from: 'train-wheel-bridge', to: 'third-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'third-pivots-in-bridge', type: 'pivots-in', from: 'third-wheel', to: 'train-wheel-bridge', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'medium', limitations: ['Relación estructural inferida del despiece; no aporta coordenadas ni tolerancias del pivote.'] },
  { key: 'screw-before-bridge-1', type: 'remove-before', from: 'screw-bridge-1', to: 'train-wheel-bridge', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'high', limitations: ['Tornillo identificado por la lista oficial.'] },
  { key: 'screw-before-bridge-2', type: 'remove-before', from: 'screw-bridge-2', to: 'train-wheel-bridge', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'high', limitations: ['Tornillo identificado por la lista oficial.'] },
  { key: 'bridge-before-third', type: 'remove-before', from: 'train-wheel-bridge', to: 'third-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_2035_SOURCE_IDS.parts], confidence: 'medium', limitations: ['Orden parcial derivado del despiece; requiere validación física para servicio.'] },
]

const quartzRoles = ['power-source', 'electronic-control', 'quartz-resonator', 'coil', 'stepper-rotor'] as const

export const MIYOTA_2035_TECHNICAL_FIXTURE = buildFixture({
  id: 'fixture.miyota.2035.structural',
  kind: 'official-calibre-quartz',
  manufacturer: 'MIYOTA',
  calibre: '2035',
  family: 'Standard',
  variant: '2035',
  reconstructionLevel: 'R2',
  parts: parts2035,
  relations: relations2035,
  selectors: [
    ...roleSelectors('miyota.2035', [...quartzRoles]),
    groupSelector('miyota.2035', 'train', 'Resolver el tren documentado del 2035.'),
    groupSelector('miyota.2035', 'keyless', 'Resolver el sistema de puesta en hora.'),
    groupSelector('miyota.2035', 'motion-works', 'Resolver la minutería.'),
    groupSelector('miyota.2035', 'indication', 'Resolver las interfaces de indicación.'),
    makeSelector('selector.miyota.2035.calibre', { by: 'calibre', value: '2035' }, 'exactly-one', 'Resolver la referencia de calibre.'),
    makeSelector('selector.miyota.2035.family', { by: 'family', value: 'Standard' }, 'exactly-one', 'Resolver la familia sin acoplarla al motor de selectores.'),
  ],
  sourceIds: [MIYOTA_2035_SOURCE_IDS.product, MIYOTA_2035_SOURCE_IDS.specification, MIYOTA_2035_SOURCE_IDS.drawing, MIYOTA_2035_SOURCE_IDS.manual, MIYOTA_2035_SOURCE_IDS.parts],
  fidelity: { geometry: 'G2', kinematics: 'K2', physics: 'P0', limitations: ['R2 estructural; tamaños y posiciones internos normalizados/estimados.', 'Sin física eléctrica validada.'] },
  visualErrors: [
    {
      key: 'coil-hidden',
      label: 'Bobina ausente u oculta · estado visual',
      affectedPartKeys: ['coil-unit'],
      effect: 'hidden',
      limitations: ['Solo representa una interrupción visual; no simula corriente, resistencia ni diagnóstico eléctrico.'],
    },
    {
      key: 'stepper-rotor-blocked',
      label: 'Rotor paso a paso bloqueado · estado visual',
      affectedPartKeys: ['stepper-rotor'],
      effect: 'blocked-symbolic',
      limitations: ['Bloqueo simbólico sin par, fricción ni causa física validada.'],
    },
  ],
  limitations: [
    'No es un gemelo exacto ni una reconstrucción R3.',
    'Solo la envolvente y datos generales indicados en el ledger son nominales oficiales.',
    'Las piezas internas usan identidad oficial, pero geometría visual normalizada.',
    'Las opciones de tija larga no forman parte del ensamblaje canónico seleccionado.',
  ],
  missingPartRoles: ['individual-quartz-resonator', 'physically-validated-main-plate', 'measured-internal-geometry'],
})

const conceptualQuartzParts: PartSeed[] = [
  p('source', 'Fuente conceptual', 'Conceptual power source', 'conceptual-source', 'power-source', ['power-source'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-3, 0, 0], size: [1.2, 0.35, 1.2], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('control', 'Control electrónico conceptual', 'Conceptual electronic control', 'conceptual-control', 'electronic-control', ['electronic-control'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'box', position: [-1.8, 0, 0], size: [1.2, 0.3, 0.9], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('resonator', 'Referencia temporal conceptual', 'Conceptual quartz resonator', 'conceptual-resonator', 'electronic-control', ['quartz-resonator'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [-1.8, 0.45, 0], size: [0.7, 0.12, 0.18], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('coil', 'Bobina conceptual', 'Conceptual coil', 'conceptual-coil', 'motor', ['coil'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'coil', position: [-0.5, 0, 0], size: [1, 0.3, 1], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('rotor', 'Rotor paso a paso conceptual', 'Conceptual stepper rotor', 'conceptual-rotor', 'motor', ['stepper-rotor'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.7, 0, 0], size: [0.8, 0.2, 0.8], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('train', 'Tren conceptual', 'Conceptual train', 'conceptual-train', 'train', ['train'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [1.8, 0, 0], size: [1, 0.2, 1], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('keyless', 'Puesta en hora conceptual', 'Conceptual keyless works', 'conceptual-keyless', 'keyless', ['keyless'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [1.8, 0.5, 0], size: [1, 0.15, 0.2], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('motion-works', 'Minutería conceptual', 'Conceptual motion works', 'conceptual-motion-works', 'motion-works', ['motion-works'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [2.8, 0, 0], size: [0.9, 0.2, 0.9], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('indication', 'Indicación conceptual', 'Conceptual indication', 'conceptual-indication', 'indication', ['indication'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [3.7, 0, 0], size: [1.2, 0.12, 0.15], sourceIds: [BLUEPRINT_SOURCE_ID] }),
]

const conceptualQuartzRelations: RelationSeed[] = [
  ['source-control', 'drives', 'source', 'control'],
  ['resonator-control', 'sets', 'resonator', 'control'],
  ['control-coil', 'drives', 'control', 'coil'],
  ['coil-rotor', 'impulses', 'coil', 'rotor'],
  ['rotor-train', 'drives', 'rotor', 'train'],
  ['train-motion', 'drives', 'train', 'motion-works'],
  ['motion-indication', 'drives', 'motion-works', 'indication'],
  ['keyless-motion', 'sets', 'keyless', 'motion-works'],
].map(([key, type, from, to]) => ({
  key,
  type: type as FunctionalRelationship,
  from,
  to,
  layer: 'educational-simulation',
  sourceIds: [BLUEPRINT_SOURCE_ID],
  confidence: 'high',
  limitations: ['Relación conceptual; no afirma topología ni compatibilidad de un calibre real.'],
}))

export const CONCEPTUAL_QUARTZ_FIXTURE = buildFixture({
  id: 'fixture.conceptual.quartz-chain',
  kind: 'conceptual-quartz',
  family: 'Conceptual quartz',
  variant: 'functional-chain-v1',
  reconstructionLevel: 'R2',
  parts: conceptualQuartzParts,
  relations: conceptualQuartzRelations,
  selectors: [
    ...roleSelectors('conceptual.quartz', ['power-source', 'electronic-control', 'quartz-resonator', 'coil', 'stepper-rotor', 'train', 'keyless', 'motion-works', 'indication']),
    makeSelector('selector.conceptual.quartz.family', { by: 'family', value: 'Conceptual quartz' }, 'exactly-one', 'Resolver el modelo conceptual sin asociarlo a un calibre.'),
  ],
  sourceIds: [BLUEPRINT_SOURCE_ID],
  fidelity: { geometry: 'G1', kinematics: 'K2', physics: 'P0', limitations: ['Topología pedagógica clara, sin geometría de calibre ni física eléctrica.'] },
  limitations: ['No representa MIYOTA 2035 ni ISA 8172.', 'Las formas y separaciones son simbólicas.'],
})

const conceptualMechanicalParts: PartSeed[] = [
  p('case', 'Caja conceptual', 'Conceptual case', 'conceptual-case', 'structure', ['case', 'structure'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'ring', position: [0, -0.9, 0], size: [9.5, 0.5, 9.5], sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Envolvente educativa; no representa una caja fabricable.'] }),
  p('dial', 'Esfera conceptual', 'Conceptual dial', 'conceptual-dial', 'indication', ['dial'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'disc', position: [0, 1.1, 0], size: [8.2, 0.12, 8.2], sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Disco educativo sin dimensiones ni grafismo nominales.'] }),
  p('hour-hand', 'Aguja horaria conceptual', 'Conceptual hour hand', 'conceptual-hand', 'indication', ['hour-hand'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', position: [0, 1.35, 0.8], size: [2.5, 0.08, 0.16], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('minute-hand', 'Aguja minutera conceptual', 'Conceptual minute hand', 'conceptual-hand', 'indication', ['minute-hand'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', position: [1.2, 1.48, 0], size: [3.5, 0.07, 0.14], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('mainspring', 'Muelle real conceptual', 'Conceptual mainspring', 'conceptual-mainspring', 'power-source', ['mainspring'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'spiral', position: [-3.2, 0, 0], size: [1.2, 0.2, 1.2], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('barrel', 'Barrilete conceptual', 'Conceptual barrel', 'conceptual-barrel', 'power-source', ['barrel'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-2.5, 0, 0], size: [1.6, 0.35, 1.6], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('train', 'Tren conceptual', 'Conceptual going train', 'conceptual-train', 'train', ['train'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-1, 0, 0], size: [1.3, 0.2, 1.3], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('escape-wheel', 'Rueda de escape conceptual', 'Conceptual escape wheel', 'conceptual-escape-wheel', 'escapement', ['escape-wheel'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.25, 0, 0], size: [0.9, 0.16, 0.9], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('pallet-fork', 'Áncora conceptual', 'Conceptual pallet fork', 'conceptual-pallet', 'escapement', ['pallet-fork'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [1.05, 0, 0], size: [0.9, 0.12, 0.25], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('balance', 'Volante conceptual', 'Conceptual balance', 'conceptual-balance', 'regulation', ['balance'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'ring', position: [2, 0, 0], size: [1.2, 0.18, 1.2], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('hairspring', 'Espiral conceptual', 'Conceptual hairspring', 'conceptual-hairspring', 'regulation', ['hairspring'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'spiral', position: [2, 0.25, 0], size: [0.9, 0.08, 0.9], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('keyless', 'Puesta en hora conceptual', 'Conceptual keyless works', 'conceptual-keyless', 'keyless', ['keyless'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [-0.4, 0.5, 1.2], size: [1.2, 0.15, 0.2], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('motion-works', 'Minutería conceptual', 'Conceptual motion works', 'conceptual-motion-works', 'motion-works', ['motion-works'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.8, 0.5, 1.2], size: [1, 0.16, 1], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('indication', 'Indicación conceptual', 'Conceptual indication', 'conceptual-indication', 'indication', ['indication'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [2, 0.5, 1.2], size: [1.3, 0.12, 0.18], sourceIds: [BLUEPRINT_SOURCE_ID] }),
]

const conceptualMechanicalRelations: RelationSeed[] = [
  ['case-covers-chain', 'covers', 'case', 'train'],
  ['dial-covers-motion', 'covers', 'dial', 'motion-works'],
  ['motion-hour-hand', 'drives', 'motion-works', 'hour-hand'],
  ['motion-minute-hand', 'drives', 'motion-works', 'minute-hand'],
  ['mainspring-part-of-barrel', 'part-of', 'mainspring', 'barrel'],
  ['mainspring-barrel', 'winds', 'mainspring', 'barrel'],
  ['barrel-train', 'drives', 'barrel', 'train'],
  ['train-escape', 'drives', 'train', 'escape-wheel'],
  ['escape-pallet-lock', 'locks', 'pallet-fork', 'escape-wheel'],
  ['pallet-escape-release', 'releases', 'pallet-fork', 'escape-wheel'],
  ['pallet-balance', 'impulses', 'pallet-fork', 'balance'],
  ['hairspring-balance', 'sets', 'hairspring', 'balance'],
  ['train-motion', 'drives', 'train', 'motion-works'],
  ['keyless-motion', 'sets', 'keyless', 'motion-works'],
  ['motion-indication', 'drives', 'motion-works', 'indication'],
].map(([key, type, from, to]) => ({
  key,
  type: type as FunctionalRelationship,
  from,
  to,
  layer: 'educational-simulation',
  sourceIds: [BLUEPRINT_SOURCE_ID],
  confidence: 'high',
  limitations: ['Relación conceptual; no representa la arquitectura de un calibre concreto.'],
}))

// Conservado como referencia de migración de fixtures 0.1.0; V2 es el ensamblaje activo.
void conceptualMechanicalParts
void conceptualMechanicalRelations

const conceptualMechanicalPartsV2: PartSeed[] = [
  p('case', 'Caja conceptual', 'Conceptual case', 'conceptual-case', 'structure', ['case', 'structure'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'ring', position: [-0.4, -0.58, 0], size: [10.2, 0.38, 10.2], sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Envolvente educativa; no representa una caja fabricable.'] }),
  p('main-plate', 'Platina conceptual', 'Conceptual main plate', 'conceptual-plate', 'structure', ['main-plate'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-0.4, -0.34, 0], size: [9.2, 0.14, 6.4], opacity: 0.38, sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Soporte visual normalizado; no representa taladros, rubíes ni contorno de un calibre.'] }),
  p('dial', 'Esfera conceptual', 'Conceptual dial', 'conceptual-dial', 'indication', ['dial'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'disc', position: [-0.4, 1.72, 0], size: [8.6, 0.1, 8.6], opacity: 0.72, sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Disco educativo sin dimensiones ni grafismo nominales.'] }),
  p('hour-hand', 'Aguja horaria conceptual', 'Conceptual hour hand', 'conceptual-hand', 'indication', ['hour-hand'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', position: [-2.22, 1.9, 0.75], size: [2.2, 0.07, 0.14], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('minute-hand', 'Aguja minutera conceptual', 'Conceptual minute hand', 'conceptual-hand', 'indication', ['minute-hand'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', position: [-1.05, 2, 0], size: [3.4, 0.06, 0.12], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('barrel-drum', 'Tambor del barrilete conceptual', 'Conceptual barrel drum', 'conceptual-barrel-drum', 'power-source', ['barrel'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'barrel-drum', toothCount: 80, boreRatio: 0.16, cutaway: true, position: [-3.8, 0, 0], size: [2.8, 0.28, 2.8], sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Dientes, diámetro y corte son educativos; no representan un calibre concreto.'] }),
  p('mainspring', 'Muelle real conceptual', 'Conceptual mainspring', 'conceptual-mainspring', 'power-source', ['mainspring'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'spiral', visualProfile: 'mainspring', position: [-3.8, 0.17, 0], size: [2.2, 0.09, 2.2], sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Espiral educativa dentro del barrilete; no expresa longitud, par ni curva de fuerza.'] }),
  p('barrel-arbor', 'Árbol del barrilete conceptual', 'Conceptual barrel arbor', 'conceptual-barrel-arbor', 'power-source', ['barrel-arbor'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [-3.8, 0.22, 0], size: [0.28, 0.7, 0.28], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('barrel-cover', 'Tapa del barrilete conceptual', 'Conceptual barrel cover', 'conceptual-barrel-cover', 'power-source', ['barrel-cover'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', visualProfile: 'barrel-cover', boreRatio: 0.16, cutaway: true, position: [-3.8, 0.36, 0], size: [2.52, 0.08, 2.52], opacity: 0.42, sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Tapa semitransparente y seccionada para hacer visible el muelle.'] }),
  p('center-pinion', 'Piñón de centro conceptual', 'Conceptual center pinion', 'conceptual-pinion', 'train', ['center-pinion'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'pinion', toothCount: 10, boreRatio: 0.2, position: [-2.225, 0, 0], size: [0.35, 0.18, 0.35], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('center-wheel', 'Rueda de centro conceptual', 'Conceptual center wheel', 'conceptual-wheel', 'train', ['center-wheel', 'train'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'gear', toothCount: 64, boreRatio: 0.12, position: [-2.225, 0.27, 0], size: [2.24, 0.13, 2.24], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('third-pinion', 'Piñón de tercera conceptual', 'Conceptual third pinion', 'conceptual-pinion', 'train', ['third-pinion'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'pinion', toothCount: 8, boreRatio: 0.2, position: [-0.965, 0.27, 0], size: [0.28, 0.18, 0.28], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('third-wheel', 'Tercera rueda conceptual', 'Conceptual third wheel', 'conceptual-wheel', 'train', ['third-wheel'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'gear', toothCount: 60, boreRatio: 0.12, position: [-0.965, 0.54, 0], size: [2.1, 0.13, 2.1], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('fourth-pinion', 'Piñón de cuarta conceptual', 'Conceptual fourth pinion', 'conceptual-pinion', 'train', ['fourth-pinion'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'pinion', toothCount: 10, boreRatio: 0.2, position: [0.26, 0.54, 0], size: [0.35, 0.18, 0.35], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('fourth-wheel', 'Cuarta rueda conceptual', 'Conceptual fourth wheel', 'conceptual-wheel', 'train', ['fourth-wheel'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'gear', toothCount: 60, boreRatio: 0.12, position: [0.26, 0.81, 0], size: [2.1, 0.13, 2.1], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('escape-pinion', 'Piñón de escape conceptual', 'Conceptual escape pinion', 'conceptual-pinion', 'escapement', ['escape-pinion'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'pinion', toothCount: 8, boreRatio: 0.2, position: [1.45, 0.81, 0], size: [0.28, 0.18, 0.28], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('escape-wheel', 'Rueda de escape conceptual', 'Conceptual escape wheel', 'conceptual-escape-wheel', 'escapement', ['escape-wheel'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'escape-wheel', toothCount: 15, boreRatio: 0.18, position: [1.45, 1.08, 0], size: [1.1, 0.11, 1.1], sourceIds: [BLUEPRINT_SOURCE_ID], limitations: ['Perfil de diente y geometría de escape didácticos; no aptos para ingeniería.'] }),
  p('pallet-fork', 'Áncora conceptual', 'Conceptual pallet fork', 'conceptual-pallet', 'escapement', ['pallet-fork'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', visualProfile: 'pallet-fork', position: [2.08, 1.08, 0], size: [1.05, 0.12, 0.5], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('balance', 'Volante conceptual', 'Conceptual balance', 'conceptual-balance', 'regulation', ['balance'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'ring', visualProfile: 'balance-wheel', position: [3.05, 1.08, 0], size: [1.75, 0.16, 1.75], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('hairspring', 'Espiral conceptual', 'Conceptual hairspring', 'conceptual-hairspring', 'regulation', ['hairspring'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'spiral', visualProfile: 'hairspring', position: [3.05, 1.22, 0], size: [1.45, 0.05, 1.45], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('keyless', 'Puesta en hora conceptual', 'Conceptual keyless works', 'conceptual-keyless', 'keyless', ['keyless'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [-1.4, 1.16, 1.55], size: [1.2, 0.15, 0.2], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('motion-works', 'Minutería conceptual', 'Conceptual motion works', 'conceptual-motion-works', 'motion-works', ['motion-works'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', visualProfile: 'gear', toothCount: 36, boreRatio: 0.14, position: [-2.225, 1.16, 1.2], size: [1.05, 0.12, 1.05], sourceIds: [BLUEPRINT_SOURCE_ID] }),
  p('indication', 'Indicador de salida conceptual', 'Conceptual indication output', 'conceptual-indication', 'indication', ['indication'], undefined, { entityKind: 'conceptual-component', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [-2.225, 1.42, 1.2], size: [0.18, 0.8, 0.18], sourceIds: [BLUEPRINT_SOURCE_ID] }),
]

const conceptualMechanicalRelationsV2: RelationSeed[] = [
  ['case-covers-chain', 'covers', 'case', 'center-wheel'],
  ['dial-covers-motion', 'covers', 'dial', 'motion-works'],
  ['motion-hour-hand', 'drives', 'motion-works', 'hour-hand'],
  ['motion-minute-hand', 'drives', 'motion-works', 'minute-hand'],
  ['plate-supports-barrel', 'supports', 'main-plate', 'barrel-drum'],
  ['plate-supports-center', 'supports', 'main-plate', 'center-wheel'],
  ['plate-supports-third', 'supports', 'main-plate', 'third-wheel'],
  ['plate-supports-fourth', 'supports', 'main-plate', 'fourth-wheel'],
  ['plate-supports-escape', 'supports', 'main-plate', 'escape-wheel'],
  ['mainspring-part-of-barrel', 'part-of', 'mainspring', 'barrel-drum'],
  ['cover-part-of-barrel', 'part-of', 'barrel-cover', 'barrel-drum'],
  ['arbor-part-of-barrel', 'part-of', 'barrel-arbor', 'barrel-drum'],
  ['mainspring-winds-arbor', 'winds', 'mainspring', 'barrel-arbor'],
  ['mainspring-drives-barrel', 'drives', 'mainspring', 'barrel-drum'],
  ['barrel-drives-cover', 'drives', 'barrel-drum', 'barrel-cover'],
  ['barrel-center-mesh', 'meshes-with', 'barrel-drum', 'center-pinion'],
  ['center-same-arbor', 'drives', 'center-pinion', 'center-wheel'],
  ['center-third-mesh', 'meshes-with', 'center-wheel', 'third-pinion'],
  ['third-same-arbor', 'drives', 'third-pinion', 'third-wheel'],
  ['third-fourth-mesh', 'meshes-with', 'third-wheel', 'fourth-pinion'],
  ['fourth-same-arbor', 'drives', 'fourth-pinion', 'fourth-wheel'],
  ['fourth-escape-mesh', 'meshes-with', 'fourth-wheel', 'escape-pinion'],
  ['escape-same-arbor', 'drives', 'escape-pinion', 'escape-wheel'],
  ['escape-pallet-lock', 'locks', 'pallet-fork', 'escape-wheel'],
  ['pallet-escape-release', 'releases', 'pallet-fork', 'escape-wheel'],
  ['pallet-balance', 'impulses', 'pallet-fork', 'balance'],
  ['hairspring-balance', 'sets', 'hairspring', 'balance'],
  ['train-motion', 'drives', 'fourth-wheel', 'motion-works'],
  ['keyless-motion', 'sets', 'keyless', 'motion-works'],
  ['motion-indication', 'drives', 'motion-works', 'indication'],
].map(([key, type, from, to]) => ({
  key,
  type: type as FunctionalRelationship,
  from,
  to,
  layer: 'educational-simulation',
  sourceIds: [BLUEPRINT_SOURCE_ID],
  confidence: 'high',
  limitations: ['Relación y conteos conceptuales; no representan la arquitectura ni los dientes de un calibre real.'],
}))

const mechanicalRoles = ['case', 'dial', 'hour-hand', 'minute-hand', 'mainspring', 'barrel', 'escape-wheel', 'pallet-fork', 'balance', 'hairspring', 'keyless', 'motion-works', 'indication'] as const

export const CONCEPTUAL_MECHANICAL_FIXTURE = buildFixture({
  id: 'fixture.conceptual.mechanical-chain',
  kind: 'conceptual-mechanical',
  family: 'Conceptual mechanical',
  variant: 'complete-functional-chain-v1',
  reconstructionLevel: 'R2',
  parts: conceptualMechanicalPartsV2,
  relations: conceptualMechanicalRelationsV2,
  selectors: [
    ...roleSelectors('conceptual.mechanical', [...mechanicalRoles]),
    groupSelector('conceptual.mechanical', 'train', 'Resolver todas las ruedas y piñones del tren conceptual.'),
    makeSelector('selector.conceptual.mechanical.family', { by: 'family', value: 'Conceptual mechanical' }, 'exactly-one', 'Resolver el modelo conceptual mecánico.'),
  ],
  sourceIds: [BLUEPRINT_SOURCE_ID],
  fidelity: { geometry: 'G1', kinematics: 'K2', physics: 'P0', limitations: ['Claridad funcional prioritaria; sin geometría real ni física validada.'] },
  limitations: ['No se etiqueta ni se deriva como MIYOTA 8215.', 'La disposición y los dientes son conceptuales y explícitos; no son dimensiones fabricables.'],
})

const parts8215: PartSeed[] = [
  p('official-envelope', 'Envolvente oficial del movimiento', 'Official movement envelope', 'movement-envelope', 'structure', ['movement-envelope'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'disc', position: [0, 0, 0], size: [6.4, 0.5, 6.4], sourceIds: [MIYOTA_8215_SOURCE_IDS.specification, MIYOTA_8215_SOURCE_IDS.drawing], limitations: ['Cilindro de envolvente, no contorno de platina.'] }),
  p('base-structure', 'Estructura base visible', 'Visible base structure', 'plate', 'structure', ['structure', 'main-plate'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [0, 0.1, 0], size: [6, 0.22, 6], limitations: ['Sin referencia oficial separada en la lista; contorno normalizado.'] }),
  p('balance-cock', 'Puente de volante completo', 'Balance cock complete', 'balance-cock', 'structure', ['balance-support'], '350-005', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [-1.9, 1.8, -1.6], size: [1.8, 0.18, 0.7] }),
  p('balance-assembly', 'Volante con espiral regulada', 'Balance with hairspring regulated', 'balance-assembly', 'regulation', ['balance', 'hairspring'], '039-102', { entityKind: 'official-assembly', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'ring', position: [-2.2, 1.25, -1.8], size: [1.8, 0.2, 1.8], limitations: ['La lista oficial identifica un conjunto; volante y espiral no se presentan como dos recambios independientes.'] }),
  p('barrel-bridge', 'Puente de barrilete', 'Barrel bridge', 'barrel-bridge', 'structure', ['barrel-bridge'], '701-263', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [-1.1, 1.7, 0.6], size: [2.6, 0.22, 1.5] }),
  p('barrel-complete', 'Barrilete completo', 'Barrel complete', 'barrel-assembly', 'power-source', ['barrel', 'mainspring'], '001-870', { entityKind: 'official-assembly', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-1.25, 0.78, 0.65], size: [1.8, 0.42, 1.8], limitations: ['La lista oficial identifica el barrilete completo; el muelle no se modela como recambio separado.'] }),
  p('second-brake-lever', 'Palanca de freno de segundero', 'Brake lever for second hand', 'lever', 'keyless', ['stop-second-lever'], '269-408'),
  p('calendar-corrector-lever', 'Palanca correctora de calendario', 'Calendar corrector lever', 'lever', 'calendar', ['calendar-corrector'], '116-300'),
  p('center-wheel', 'Rueda de centro y piñón', 'Center wheel and pinion', 'wheel-and-pinion', 'train', ['center-wheel'], '012-116', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0, 0.75, 0], size: [1.5, 0.18, 1.5] }),
  p('center-wheel-cock', 'Puente de rueda de centro', 'Center wheel cock', 'structure', 'structure', ['center-wheel-support'], '711-074', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [0, 1.55, 0], size: [1.8, 0.18, 0.75] }),
  p('click', 'Trinquete', 'Click', 'click', 'power-source', ['click'], '060-390'),
  p('click-spring', 'Muelle de trinquete', 'Click spring', 'spring', 'power-source', ['click-spring'], '903-700'),
  p('clutch-wheel', 'Piñón corredizo', 'Clutch wheel', 'clutch-wheel', 'keyless', ['clutch-wheel'], '064-450', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [2.3, 0.65, 0], size: [0.55, 0.16, 0.55] }),
  p('crown-wheel', 'Rueda de corona', 'Crown wheel', 'wheel', 'keyless', ['crown-wheel'], '058-360'),
  p('date-corrector-spring', 'Muelle corrector de fecha', 'Date corrector spring', 'spring', 'calendar', ['date-corrector-spring'], '903-A31'),
  p('date-dial', 'Disco de fecha', 'Date dial', 'date-dial', 'calendar', ['calendar', 'date-dial'], '108-9500', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'ring', position: [0, 2.35, 0], size: [5.4, 0.12, 5.4] }),
  p('date-driving-wheel', 'Rueda conductora de fecha', 'Date dial driving wheel', 'wheel', 'calendar', ['date-driving-wheel'], '103-650', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [1.2, 1.95, 0.4], size: [0.7, 0.14, 0.7] }),
  p('date-dial-guard', 'Protector del disco de fecha', 'Date dial guard', 'guard', 'calendar', ['date-dial-guard'], '176-150', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'ring', position: [0, 2.55, 0], size: [5.6, 0.12, 5.6] }),
  p('date-jumper', 'Saltador de fecha', 'Date jumper', 'jumper', 'calendar', ['date-jumper'], '109-350'),
  p('escape-wheel', 'Rueda de escape y piñón', 'Escape wheel and pinion', 'wheel-and-pinion', 'escapement', ['escape-wheel'], '032-106', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [1.15, 1.05, -1.25], size: [0.9, 0.14, 0.9] }),
  p('fourth-wheel', 'Cuarta rueda y piñón', 'Fourth wheel and pinion', 'wheel-and-pinion', 'train', ['fourth-wheel'], '023-940', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.65, 0.92, -0.55], size: [1, 0.16, 1] }),
  p('sweep-friction-spring', 'Muelle de fricción del piñón de segundero', 'Friction spring for sweep sec pinion', 'spring', 'motion-works', ['sweep-friction-spring'], '903-690'),
  p('hour-wheel', 'Rueda de horas', 'Hour wheel', 'wheel', 'motion-works', ['hour-wheel'], '075-124', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0, 2, 0], size: [1.1, 0.14, 1.1] }),
  p('intermediate-date-wheel', 'Rueda intermedia de fecha', 'Intermediate date wheel', 'wheel', 'calendar', ['intermediate-date-wheel'], '100-170'),
  p('intermediate-wheel', 'Rueda intermedia', 'Intermediate wheel', 'wheel', 'automatic', ['automatic-winding', 'intermediate-wheel'], '087-250', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-0.6, -0.35, 1.6], size: [0.8, 0.16, 0.8] }),
  p('intermediate-wheel-washer', 'Arandela de rueda intermedia', 'Intermediate wheel washer', 'washer', 'automatic', ['intermediate-wheel-washer'], '078-150'),
  p('pallet-fork', 'Áncora enjoyada con eje', 'Jeweled pallet fork and staff', 'pallet-fork', 'escapement', ['pallet-fork'], '035-560', { entityKind: 'official-assembly', reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [1.7, 1.18, -1.75], size: [1, 0.12, 0.28] }),
  p('lower-cap-jewel', 'Contrapiedra inferior montada', 'Lower cap jewel mounted', 'jewel-assembly', 'regulation', ['jewel-support', 'lower-cap-jewel'], '094-040', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-2.2, 0.9, -1.8], size: [0.42, 0.1, 0.42] }),
  p('minute-wheel', 'Rueda de minutería y piñón', 'Minute wheel and pinion', 'wheel-and-pinion', 'motion-works', ['minute-wheel', 'motion-works'], '072-520', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0.75, 1.85, 0.5], size: [0.9, 0.14, 0.9] }),
  p('minute-wheel-guard', 'Protector de rueda de minutería', 'Minute wheel guard', 'guard', 'structure', ['minute-wheel-guard'], '079-600'),
  p('movement-holder', 'Portamovimiento plástico', 'Movement holder (Plastic)', 'movement-holder', 'structure', ['movement-holder'], '500-710'),
  p('oscillating-weight', 'Masa oscilante', 'Oscillating weight', 'rotor', 'automatic', ['automatic-winding', 'rotor'], '119-A76', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [0, -0.55, 0], size: [5.8, 0.28, 3] }),
  p('pallet-cock', 'Puente de áncora', 'Pallet cock', 'pallet-cock', 'structure', ['pallet-support'], '708-095', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'bridge', position: [1.7, 1.6, -1.75], size: [1.2, 0.16, 0.6] }),
  p('pawl-winding-wheel', 'Rueda de carga con trinquete', 'Pawl winding wheel', 'wheel', 'automatic', ['pawl-winding-wheel'], '141-190', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-1.3, -0.25, 1.35], size: [0.85, 0.16, 0.85] }),
  p('ratchet-wheel', 'Rueda de rochete', 'Ratchet wheel', 'wheel', 'power-source', ['ratchet-wheel'], '059-560'),
  p('reduction-wheel', 'Rueda reductora', 'Reduction wheel', 'wheel', 'automatic', ['reduction-wheel'], '088-120', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-1.8, -0.15, 0.75], size: [0.9, 0.16, 0.9] }),
  p('second-brake-connection', 'Palanca de conexión del freno de segundero', 'Second hand brake connection lever', 'lever', 'keyless', ['stop-second-connection'], '273-201'),
  p('setting-lever', 'Tirete', 'Setting lever', 'lever', 'keyless', ['setting-lever'], '067-860', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [2.35, 1.7, 0.6], size: [1, 0.1, 0.2] }),
  p('setting-lever-spring', 'Muelle de tirete', 'Setting lever spring', 'spring', 'keyless', ['setting-lever-spring'], '077-680'),
  p('setting-wheel', 'Rueda de puesta en hora', 'Setting wheel', 'wheel', 'keyless', ['setting-wheel'], '076-430'),
  p('spiral-spring-jewel', 'Muelle espiral con rubí', 'Spiral spring with jewel', 'jewel-spring', 'regulation', ['jewel-support'], '098-090', { quantity: 2, reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'spiral' }),
  p('sweep-second-pinion', 'Piñón de segundero central', 'Sweep second pinion', 'pinion', 'motion-works', ['sweep-second-pinion'], '025-670', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [0, 1.25, 0], size: [0.45, 0.35, 0.45] }),
  p('third-wheel', 'Tercera rueda y piñón', 'Third wheel and pinion', 'wheel-and-pinion', 'train', ['third-wheel'], '017-760', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'wheel', position: [-0.65, 0.82, -0.4], size: [1.1, 0.16, 1.1] }),
  p('upper-cap-jewel', 'Contrapiedra superior montada', 'Upper cap jewel mounted', 'jewel-assembly', 'regulation', ['jewel-support', 'upper-cap-jewel'], '094-010', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'disc', position: [-2.2, 1.55, -1.8], size: [0.42, 0.1, 0.42] }),
  p('wheel-washer', 'Arandela para rueda', 'Washer for wheel', 'washer', 'train', ['wheel-washer'], '078-140'),
  p('winding-stem', 'Tija de remontuar', 'Winding stem', 'stem', 'keyless', ['keyless', 'stem'], '065-212', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [3.2, 1.2, 0], size: [2.7, 0.14, 0.14] }),
  p('yoke', 'Báscula', 'Yoke', 'yoke', 'keyless', ['yoke'], '071-A04', { reconstructionLevel: 'R2', modelState: 'structurally-modelled', shape: 'rod', position: [2.3, 1.6, -0.45], size: [1, 0.1, 0.2] }),
  p('screw-barrel-bridge', 'Tornillo de puente de barrilete/tren', 'Screw for barrel and train wheel bridge', 'screw', 'fasteners', ['fastener'], '924-460', { quantity: 3, shape: 'screw' }),
  p('screw-center-cock', 'Tornillo de puente de rueda de centro', 'Screw for center wheel cock', 'screw', 'fasteners', ['fastener'], '923-600', { quantity: 2, shape: 'screw' }),
  p('screw-date-guard', 'Tornillo de protector de fecha', 'Screw for date dial guard', 'screw', 'fasteners', ['fastener'], '923-630', { quantity: 4, shape: 'screw' }),
  p('screw-rotor', 'Tornillo de masa oscilante', 'Screw for oscillating weight', 'screw', 'fasteners', ['fastener'], '925-490', { shape: 'screw' }),
  p('screw-pallet-cock', 'Tornillo de puente de áncora', 'Screw for pallet bridge', 'screw', 'fasteners', ['fastener'], '923-600', { shape: 'screw' }),
  p('screw-balance-cock', 'Tornillo de puente de volante', 'Screw for balance bridge', 'screw', 'fasteners', ['fastener'], '924-460', { shape: 'screw' }),
  p('hour-hand-interface', 'Interfaz de aguja horaria', 'Hour hand interface', 'hand-interface', 'indication', ['indication', 'hour-hand'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', sourceIds: [MIYOTA_8215_SOURCE_IDS.drawing] }),
  p('minute-hand-interface', 'Interfaz de aguja minutera', 'Minute hand interface', 'hand-interface', 'indication', ['indication', 'minute-hand'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', sourceIds: [MIYOTA_8215_SOURCE_IDS.drawing] }),
  p('second-hand-interface', 'Interfaz de segundero', 'Second hand interface', 'hand-interface', 'indication', ['indication', 'second-hand'], undefined, { entityKind: 'interface-placeholder', reconstructionLevel: 'R1', modelState: 'envelope-only', shape: 'rod', sourceIds: [MIYOTA_8215_SOURCE_IDS.drawing] }),
]

const relations8215: RelationSeed[] = [
  { key: 'barrel-center', type: 'drives', from: 'barrel-complete', to: 'center-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'center-third', type: 'meshes-with', from: 'center-wheel', to: 'third-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'third-fourth', type: 'meshes-with', from: 'third-wheel', to: 'fourth-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'fourth-escape', type: 'meshes-with', from: 'fourth-wheel', to: 'escape-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'escape-pallet-lock', type: 'locks', from: 'pallet-fork', to: 'escape-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium', limitations: ['Relación funcional; geometría de escape no validada.'] },
  { key: 'pallet-escape-release', type: 'releases', from: 'pallet-fork', to: 'escape-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'pallet-balance', type: 'impulses', from: 'pallet-fork', to: 'balance-assembly', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'rotor-pawl', type: 'drives', from: 'oscillating-weight', to: 'pawl-winding-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'low', limitations: ['Ruta automática funcional pendiente de confirmar pieza a pieza.'] },
  { key: 'pawl-reduction', type: 'drives', from: 'pawl-winding-wheel', to: 'reduction-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'low' },
  { key: 'reduction-intermediate', type: 'drives', from: 'reduction-wheel', to: 'intermediate-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'low' },
  { key: 'automatic-barrel', type: 'winds', from: 'intermediate-wheel', to: 'barrel-complete', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'low', limitations: ['Ruta resumida; no se afirma cinemática exacta.'] },
  { key: 'stem-clutch', type: 'sets', from: 'winding-stem', to: 'clutch-wheel', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'medium' },
  { key: 'setting-minute', type: 'sets', from: 'setting-wheel', to: 'minute-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'minute-hour', type: 'drives', from: 'minute-wheel', to: 'hour-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium' },
  { key: 'hour-hand', type: 'drives', from: 'hour-wheel', to: 'hour-hand-interface', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.drawing], confidence: 'high' },
  { key: 'minute-hand', type: 'drives', from: 'minute-wheel', to: 'minute-hand-interface', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.drawing], confidence: 'medium' },
  { key: 'sweep-hand', type: 'drives', from: 'sweep-second-pinion', to: 'second-hand-interface', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.drawing], confidence: 'high' },
  { key: 'date-drive', type: 'drives', from: 'date-driving-wheel', to: 'date-dial', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'date-guard-retains', type: 'retains', from: 'date-dial-guard', to: 'date-dial', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'barrel-bridge-support', type: 'supports', from: 'barrel-bridge', to: 'barrel-complete', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'center-pivots-in-cock', type: 'pivots-in', from: 'center-wheel', to: 'center-wheel-cock', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'pallet-cock-support', type: 'supports', from: 'pallet-cock', to: 'pallet-fork', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'balance-cock-support', type: 'supports', from: 'balance-cock', to: 'balance-assembly', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'rotor-screw-fastens', type: 'fastened-by', from: 'oscillating-weight', to: 'screw-rotor', layer: 'official-part-identity', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high' },
  { key: 'rotor-before-automatic', type: 'remove-before', from: 'screw-rotor', to: 'oscillating-weight', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high', limitations: ['Retirar la fijación antes de la masa oscilante.'] },
  { key: 'barrel-screws-before-bridge', type: 'remove-before', from: 'screw-barrel-bridge', to: 'barrel-bridge', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high', limitations: ['Orden parcial; no sustituye un manual de servicio.'] },
  { key: 'bridge-before-barrel', type: 'remove-before', from: 'barrel-bridge', to: 'barrel-complete', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'medium', limitations: ['Orden deducido del despiece; debe validarse físicamente.'] },
  { key: 'pallet-screw-before-cock', type: 'remove-before', from: 'screw-pallet-cock', to: 'pallet-cock', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high', limitations: ['Orden parcial; no sustituye un manual de servicio.'] },
  { key: 'balance-screw-before-cock', type: 'remove-before', from: 'screw-balance-cock', to: 'balance-cock', layer: 'document-inferred-relation', sourceIds: [MIYOTA_8215_SOURCE_IDS.parts], confidence: 'high', limitations: ['Orden parcial; no sustituye un manual de servicio.'] },
  { key: 'inspect-pivots', type: 'inspect-before', from: 'center-wheel-cock', to: 'center-wheel', layer: 'educational-simulation', sourceIds: [BLUEPRINT_SOURCE_ID], confidence: 'medium', limitations: ['Criterio de inspección, no instrucción física validada.'] },
]

export const MIYOTA_8215_TECHNICAL_FIXTURE = buildFixture({
  id: 'fixture.miyota.8215.structural',
  kind: 'official-calibre-mechanical',
  manufacturer: 'MIYOTA',
  calibre: '8215',
  family: 'Standard Automatic / 82',
  variant: '8215',
  reconstructionLevel: 'R2',
  parts: parts8215,
  relations: relations8215,
  selectors: [
    ...roleSelectors('miyota.8215', ['mainspring', 'barrel', 'escape-wheel', 'pallet-fork', 'balance', 'hairspring']),
    groupSelector('miyota.8215', 'train', 'Resolver las ruedas del tren disponibles.'),
    groupSelector('miyota.8215', 'keyless', 'Resolver cuerda y puesta en hora.'),
    groupSelector('miyota.8215', 'motion-works', 'Resolver la minutería disponible.'),
    makeSelector('selector.miyota.8215.automatic-winding', { by: 'subsystem', value: 'automatic' }, 'one-or-more', 'Resolver el conjunto automático sin crear otro ensamblaje.'),
    groupSelector('miyota.8215', 'calendar', 'Resolver el calendario sin crear otro ensamblaje.'),
    groupSelector('miyota.8215', 'indication', 'Resolver las interfaces de agujas.'),
    makeSelector('selector.miyota.8215.jewels', { by: 'role', value: 'jewel-support' }, 'one-or-more', 'Resolver únicamente apoyos enjoyados identificados en el ledger.'),
    makeSelector('selector.miyota.8215.fasteners', { by: 'role', value: 'fastener' }, 'one-or-more', 'Resolver tornillería oficial modelada.'),
    makeSelector('selector.miyota.8215.calibre', { by: 'calibre', value: '8215' }, 'exactly-one', 'Resolver el calibre.'),
    makeSelector('selector.miyota.8215.family', { by: 'family', value: 'Standard Automatic / 82' }, 'exactly-one', 'Resolver la familia.'),
  ],
  sourceIds: [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification, MIYOTA_8215_SOURCE_IDS.drawing, MIYOTA_8215_SOURCE_IDS.manual, MIYOTA_8215_SOURCE_IDS.parts],
  fidelity: { geometry: 'G2', kinematics: 'K2', physics: 'P0', limitations: ['R2 estructural con geometría interna normalizada.', 'Sin lubricación, desgaste, choque ni tolerancias internas validadas.'] },
  visualErrors: [
    {
      key: 'balance-blocked',
      label: 'Volante bloqueado · estado visual',
      affectedPartKeys: ['balance-assembly'],
      effect: 'blocked-symbolic',
      limitations: ['No representa amplitud, rozamiento, choque ni diagnóstico físico.'],
    },
    {
      key: 'center-cock-misaligned',
      label: 'Puente de rueda de centro desalineado · estado visual',
      affectedPartKeys: ['center-wheel-cock', 'center-wheel'],
      effect: 'misaligned-symbolic',
      limitations: ['Desalineación simbólica; no expresa una tolerancia ni recomienda forzar el puente.'],
    },
    {
      key: 'rotor-before-fastener',
      label: 'Orden incorrecto de retirada del rotor · estado visual',
      affectedPartKeys: ['oscillating-weight', 'screw-rotor'],
      effect: 'wrong-order-symbolic',
      limitations: ['Solo visualiza la dependencia declarada; no sustituye un manual de servicio.'],
    },
  ],
  limitations: [
    'Un único ensamblaje contiene calendario, automático y rotor; las vistas solo cambian el overlay.',
    'No es un gemelo exacto ni una reconstrucción R3.',
    'La geometría interna no procede de medición y no se expresa en milímetros.',
    'Se omiten del ensamblaje activo opciones, alternativas semiacabadas, abrazaderas opcionales y tijas largas.',
    'No se modelan 21 rubíes individuales: solo conjuntos enjoyados identificables en la lista oficial.',
  ],
  missingPartRoles: ['all-21-individual-jewels', 'physically-validated-main-plate', 'complete-tooth-counts', 'measured-internal-geometry'],
})

export const TECHNICAL_MOVEMENT_FIXTURES = [
  CONCEPTUAL_QUARTZ_FIXTURE,
  MIYOTA_2035_TECHNICAL_FIXTURE,
  CONCEPTUAL_MECHANICAL_FIXTURE,
  MIYOTA_8215_TECHNICAL_FIXTURE,
] as const

export function technicalFixture(fixtureId: string): TechnicalMovementFixture {
  const fixture = TECHNICAL_MOVEMENT_FIXTURES.find(({ id }) => id === fixtureId)
  if (!fixture) throw new Error(`Fixture técnico inexistente: ${fixtureId}`)
  return structuredClone(fixture)
}

export const FIRST_MODULE_TECHNICAL_FIXTURE: FirstModuleTechnicalFixture = FirstModuleTechnicalFixtureSchema.parse({
  id: 'fixture.module.horology.functional-map',
  version: FIXTURE_VERSION,
  moduleReference: 'module.horology.functional-map',
  titleReference: 'Cómo funciona un reloj de principio a fin',
  fixtures: TECHNICAL_MOVEMENT_FIXTURES.map((fixture) => ({
    fixtureId: fixture.id,
    fixtureVersion: fixture.version,
    selectorContractIds: fixture.selectors.map(({ id }) => id),
  })),
  requiredOperations: [
    'selection',
    'visibility',
    'isolation',
    'transparency',
    'highlight',
    'explode',
    'timeline',
    'rotation-directions',
    'labels',
    'arrows',
    'energy-route',
    'pause',
    'scrub',
    'reduced-motion',
    'restore',
  ],
  reducedMotion: {
    discreteStates: true,
    staticNumberedArrows: true,
    automaticCameraMotion: false,
    stepwiseScrubbing: true,
  },
  viewportNeeds: [
    { capabilityId: 'viewport.selection', status: 'available', blockingForFullVisual: false, explanation: 'EducationalViewport conserva PartInstanceId y objeto visual namespaced por montura.' },
    { capabilityId: 'viewport.visibility', status: 'available', blockingForFullVisual: false, explanation: 'Visibilidad reversible por instancia v6.' },
    { capabilityId: 'viewport.isolation', status: 'available', blockingForFullVisual: false, explanation: 'Aislamiento independiente por montura y selector semántico.' },
    { capabilityId: 'viewport.transparency', status: 'available', blockingForFullVisual: false, explanation: 'Opacidad por instancia aplicada por el renderer educativo.' },
    { capabilityId: 'viewport.highlight', status: 'available', blockingForFullVisual: false, explanation: 'Resaltado y atenuación con claves no dependientes solo del color.' },
    { capabilityId: 'viewport.explode', status: 'available', blockingForFullVisual: false, explanation: 'Explosionado educativo normalizado; no expresa trayectorias físicas validadas.' },
    { capabilityId: 'timeline.scrub', status: 'available', blockingForFullVisual: false, explanation: 'El runtime soporta timeline absoluto, pausa y scrub.' },
    { capabilityId: 'viewport.overlay.labels', status: 'available', blockingForFullVisual: false, explanation: 'Etiquetas espaciales namespaced y alternativa textual.' },
    { capabilityId: 'viewport.overlay.arrows', status: 'available', blockingForFullVisual: false, explanation: 'Flechas espaciales ancladas a selectores o interfaces.' },
    { capabilityId: 'viewport.rotation-directions', status: 'available', blockingForFullVisual: false, explanation: 'Arcos de giro con eje, sentido y sustitución estática en reduced motion.' },
    { capabilityId: 'viewport.energy-route', status: 'available', blockingForFullVisual: false, explanation: 'Ruta funcional segmentada, estados y lista numerada accesible.' },
    { capabilityId: 'viewport.multi-fixture', status: 'available', blockingForFullVisual: false, explanation: 'Composición efímera de una, dos o cuatro monturas sin crear WatchProject.' },
    { capabilityId: 'reduced-motion', status: 'available', blockingForFullVisual: false, explanation: 'El compilador elimina duraciones no esenciales y el contrato exige estados discretos.' },
    { capabilityId: 'viewport.restore', status: 'available', blockingForFullVisual: false, explanation: 'El bridge captura y restaura el overlay de forma idempotente.' },
  ],
  restorationRequired: true,
})

export function compileFirstModuleTechnicalFixture(): CompiledFirstModuleFixture {
  const selectorResults: CompiledFirstModuleFixture['selectorResults'] = []
  for (const reference of FIRST_MODULE_TECHNICAL_FIXTURE.fixtures) {
    const fixture = technicalFixture(reference.fixtureId)
    const resolver = new SemanticSelectorResolver(new ProjectEntityIndex(fixture.assembly))
    for (const selectorContractId of reference.selectorContractIds) {
      const contract = fixture.selectors.find(({ id }) => id === selectorContractId)
      if (!contract) {
        selectorResults.push({ fixtureId: fixture.id, selectorContractId, count: 0, cardinalitySatisfied: false })
        continue
      }
      const resolution = resolver.resolve(contract.selector, contract.cardinality)
      selectorResults.push({
        fixtureId: fixture.id,
        selectorContractId,
        count: resolution.entities.length,
        cardinalitySatisfied: resolution.cardinalitySatisfied,
      })
    }
  }
  const viewportBlockers = FIRST_MODULE_TECHNICAL_FIXTURE.viewportNeeds
    .filter(({ blockingForFullVisual, status }) => blockingForFullVisual && status !== 'available')
    .map(({ capabilityId }) => capabilityId)
  return {
    fixture: structuredClone(FIRST_MODULE_TECHNICAL_FIXTURE),
    selectorResults,
    viewportBlockers,
    success: selectorResults.every(({ cardinalitySatisfied }) => cardinalitySatisfied),
  }
}
