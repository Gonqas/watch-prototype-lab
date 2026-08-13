import type { MateConstraint, WatchPartId, WatchProject } from '../../vnext/model'
import type { AssemblyInterface, CanonicalAssembly, MovementReference, PartDefinition, PartInstance } from '../canonical'
import { detectV6PersistenceReasons, validateCanonicalAssembly } from '../canonical'
import { deterministicCanonicalId, stableFingerprint } from '../identity'

const COMMON_PARTS: WatchPartId[] = [
  'case', 'back', 'bezel', 'rehaut', 'strap', 'clasp', 'springBar', 'dialGraphics', 'movement', 'dial',
  'hourHand', 'minuteHand', 'secondHand', 'crystal', 'stem', 'crown', 'holder', 'gasket',
]
const MECHANICAL_PARTS: WatchPartId[] = [
  'plate', 'bridge', 'barrel', 'center', 'third', 'fourth', 'escape', 'balance', 'pallet', 'hairspring',
  'mainspring', 'jewel', 'keyless', 'rotor',
]

const PART_CATEGORY: Record<WatchPartId, string> = {
  case: 'case', back: 'back', bezel: 'bezel', rehaut: 'rehaut', strap: 'strap', clasp: 'clasp',
  springBar: 'spring-bar', dialGraphics: 'dial-graphics', movement: 'movement', plate: 'plate', bridge: 'bridge',
  barrel: 'barrel', center: 'center-wheel', third: 'third-wheel', fourth: 'fourth-wheel', escape: 'escape-wheel',
  balance: 'balance', pallet: 'pallet', hairspring: 'hairspring', mainspring: 'mainspring', jewel: 'jewel-set',
  keyless: 'keyless', rotor: 'rotor', dial: 'dial', hourHand: 'hour-hand', minuteHand: 'minute-hand',
  secondHand: 'second-hand', crystal: 'crystal', stem: 'stem', crown: 'crown', holder: 'holder', gasket: 'gasket',
}

const SUBSYSTEM: Partial<Record<WatchPartId, string>> = {
  plate: 'movement-structure', bridge: 'movement-structure', barrel: 'energy-storage', mainspring: 'energy-storage',
  center: 'going-train', third: 'going-train', fourth: 'going-train', escape: 'escapement', pallet: 'escapement',
  balance: 'oscillator', hairspring: 'oscillator', jewel: 'bearings', keyless: 'keyless-works', rotor: 'automatic-winding',
  hourHand: 'indication', minuteHand: 'indication', secondHand: 'indication', dial: 'indication',
}

function legacyToken(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function definitionFor(projectId: string, partId: WatchPartId): PartDefinition {
  return {
    id: deterministicCanonicalId('part-definition', 'v5-projection-1', `${projectId}:part:${partId}`),
    category: PART_CATEGORY[partId],
    classification: 'known',
    name: partId,
    roles: [legacyToken(partId)],
    subsystems: SUBSYSTEM[partId] ? [SUBSYSTEM[partId]] : [],
    tags: ['legacy-v5'],
    provenance: [],
  }
}

function instanceFor(project: WatchProject, assemblyId: CanonicalAssembly['id'], definition: PartDefinition, partId: WatchPartId): PartInstance {
  return {
    id: deterministicCanonicalId('part-instance', 'v5-projection-1', `${project.id}:instance:${partId}`),
    definitionId: definition.id,
    assemblyId,
    state: 'active',
    persistence: 'synthetic-v5',
    revision: 1,
    createdAt: project.createdAt,
    modifiedAt: project.modifiedAt,
    role: legacyToken(partId),
    subsystem: SUBSYSTEM[partId],
    tags: ['legacy-v5'],
  }
}

function movementReference(project: WatchProject): MovementReference | null {
  const movement = project.movement
  const calibre = movement.kind === 'quartz'
    ? movement.presetId.replace('miyota_', '')
    : movement.referenceCalibre
  if (!calibre) return null
  const isMiyota = movement.kind === 'quartz'
    || movement.referenceSources?.some(({ locator }) => locator?.includes('miyotamovement.com')) === true
  return {
    id: deterministicCanonicalId('movement-reference', 'v5-projection-1', `${project.id}:movement:${calibre}`),
    manufacturer: isMiyota ? 'MIYOTA' : 'unknown',
    calibre,
    mechanism: movement.kind,
    classification: isMiyota ? 'known' : 'placeholder',
    facts: { legacyName: movement.name },
    provenance: [],
  }
}

function interfaceFor(
  project: WatchProject,
  assemblyId: CanonicalAssembly['id'],
  mate: MateConstraint,
  instanceIds: Map<WatchPartId, PartInstance['id']>,
): AssemblyInterface | null {
  const source = instanceIds.get(mate.sourcePart)
  const target = instanceIds.get(mate.targetPart)
  if (!source || !target) return null
  return {
    id: deterministicCanonicalId('assembly-interface', 'v5-projection-1', `${project.id}:mate:${mate.id}`),
    assemblyId,
    domain: mate.type === 'gear' ? 'kinematics' : mate.type === 'fixed' ? 'assembly' : 'geometry',
    kind: `legacy-mate:${mate.type}`,
    participants: [
      { instanceId: source, interfaceRole: 'source' },
      { instanceId: target, interfaceRole: 'target' },
    ],
    parameters: {
      enabled: mate.enabled,
      axis: mate.axis,
      ratio: mate.ratio,
    },
    state: mate.enabled ? 'active' : 'inactive',
    persistence: 'synthetic-v5',
    provenance: [],
  }
}

/** Pure read projection. It never mutates or upgrades the v5 project. */
export function projectV5ToCanonical(project: WatchProject): CanonicalAssembly {
  const assemblyId = deterministicCanonicalId('assembly', 'v5-projection-1', project.id)
  const partIds = project.movement.kind === 'mechanical' ? [...COMMON_PARTS, ...MECHANICAL_PARTS] : COMMON_PARTS
  const definitions = partIds.map((partId) => definitionFor(project.id, partId))
  const instances = definitions.map((definition, index) => instanceFor(project, assemblyId, definition, partIds[index]))
  const instanceIds = new Map(partIds.map((partId, index) => [partId, instances[index].id]))
  const interfaces = project.assembly.mates
    .map((mate) => interfaceFor(project, assemblyId, mate, instanceIds))
    .filter((item): item is AssemblyInterface => item !== null)
  const reference = movementReference(project)
  const assembly: CanonicalAssembly = {
    schemaVersion: 6,
    id: assemblyId,
    name: project.name,
    source: {
      kind: 'v5-projection',
      adapterVersion: 'v5-projection-1',
      projectFingerprint: stableFingerprint(project),
    },
    definitions,
    instances,
    interfaces,
    dependencies: [],
    movementReferences: reference ? [reference] : [],
  }
  const validation = validateCanonicalAssembly(assembly)
  if (!validation.valid) throw new Error(validation.issues.map(({ message }) => message).join(' '))
  return assembly
}

/**
 * A v5 projection can round-trip only while no v6-only feature has been added and it still
 * corresponds to the supplied source. The source is cloned, never reconstructed from a lossy projection.
 */
export function roundTripV5Projection(source: WatchProject, projection: CanonicalAssembly): WatchProject {
  if (projection.source.kind !== 'v5-projection') throw new Error('El ensamblaje no procede de una proyección v5.')
  if (projection.source.projectFingerprint !== stableFingerprint(source)) throw new Error('La proyección no corresponde al proyecto v5 suministrado.')
  if (detectV6PersistenceReasons(projection).length > 0) throw new Error('La proyección contiene características que requieren persistencia v6.')
  return structuredClone(source)
}
