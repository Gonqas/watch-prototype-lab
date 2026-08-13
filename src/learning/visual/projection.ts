import {
  CanonicalAssemblySchema,
  ProjectEntityIndex,
  validateCanonicalAssembly,
  type CanonicalAssembly,
} from '../canonical'
import { deterministicCanonicalId } from '../identity'
import type { RuntimeDiagnostic } from '../runtime/diagnostics'
import {
  SemanticSelectorResolver,
  type SelectorCardinality,
} from '../runtime/selectors'
import type {
  CompositionSelector,
  CompositionSelectorResolution,
  LoadedEducationalFixtureMount,
  VisualDiagnostic,
  VisualEntityId,
} from './model'
import { visualEntityId } from './model'

function sortedById<Value extends { id: string }>(values: Value[]): Value[] {
  return values.sort((left, right) => left.id.localeCompare(right.id))
}

function assertUnambiguousFixtureMounts(mounted: LoadedEducationalFixtureMount[]): void {
  const mountsByFixture = new Map<string, string[]>()
  mounted.forEach(({ fixture, spec }) => {
    mountsByFixture.set(fixture.id, [...(mountsByFixture.get(fixture.id) ?? []), spec.id])
  })
  const ambiguous = [...mountsByFixture.entries()]
    .filter(([, mountIds]) => mountIds.length > 1)
  if (ambiguous.length === 0) return
  throw new Error(
    `Proyección canónica ambigua: el mismo fixture está montado más de una vez (${ambiguous
      .map(([fixtureId, mountIds]) => `${fixtureId}: ${mountIds.join(', ')}`)
      .join('; ')}).`,
  )
}

export function compositionCanonicalAssembly(
  compositionId: string,
  mounted: LoadedEducationalFixtureMount[],
): CanonicalAssembly {
  const ordered = [...mounted].sort((left, right) => left.spec.id.localeCompare(right.spec.id))
  assertUnambiguousFixtureMounts(ordered)
  const assemblyId = deterministicCanonicalId(
    'assembly',
    'learning-visual-composition-1',
    `${compositionId}:${ordered
      .map(({ fixture, spec }) => `${spec.id}:${fixture.id}@${fixture.version}`)
      .join('|')}`,
  )
  const assembly = CanonicalAssemblySchema.parse({
    schemaVersion: 6,
    id: assemblyId,
    name: `Composición educativa ${compositionId}`,
    source: { kind: 'native-v6' },
    definitions: sortedById(ordered.flatMap(({ fixture }) =>
      structuredClone(fixture.assembly.definitions))),
    instances: sortedById(ordered.flatMap(({ fixture }) =>
      fixture.assembly.instances.map((instance) => ({
        ...structuredClone(instance),
        assemblyId,
      })))),
    interfaces: sortedById(ordered.flatMap(({ fixture }) =>
      fixture.assembly.interfaces.map((connection) => ({
        ...structuredClone(connection),
        assemblyId,
      })))),
    dependencies: sortedById(ordered.flatMap(({ fixture }) =>
      fixture.assembly.dependencies.map((dependency) => ({
        ...structuredClone(dependency),
        assemblyId,
      })))),
    movementReferences: sortedById(ordered.flatMap(({ fixture }) =>
      structuredClone(fixture.assembly.movementReferences))),
  })
  const validation = validateCanonicalAssembly(assembly)
  if (!validation.valid) {
    throw new Error(
      `La proyección canónica de ${compositionId} no es válida: ${validation.issues
        .map(({ message }) => message)
        .join(' ')}`,
    )
  }
  return assembly
}

export function compositionCanonicalIndex(
  compositionId: string,
  mounted: LoadedEducationalFixtureMount[],
): ProjectEntityIndex {
  return new ProjectEntityIndex(compositionCanonicalAssembly(compositionId, mounted))
}

export interface CanonicalVisualProjection {
  canonicalEntityIds: string[]
  visualEntityIds: VisualEntityId[]
  mapped: Record<string, VisualEntityId>
  missingCanonicalEntityIds: string[]
  ambiguousCanonicalEntityIds: Record<string, VisualEntityId[]>
}

export function projectCanonicalInstanceIds(
  mounted: LoadedEducationalFixtureMount[],
  canonicalEntityIds: readonly string[],
): CanonicalVisualProjection {
  const candidates = new Map<string, VisualEntityId[]>()
  mounted.forEach(({ sceneGraph }) => {
    sceneGraph.entities.forEach(({ id, instanceId }) => {
      candidates.set(instanceId, [...(candidates.get(instanceId) ?? []), id])
    })
  })
  const canonical = [...new Set(canonicalEntityIds)].sort()
  const mapped: Record<string, VisualEntityId> = {}
  const missingCanonicalEntityIds: string[] = []
  const ambiguousCanonicalEntityIds: Record<string, VisualEntityId[]> = {}
  canonical.forEach((instanceId) => {
    const visualIds = [...new Set(candidates.get(instanceId) ?? [])].sort() as VisualEntityId[]
    if (visualIds.length === 0) missingCanonicalEntityIds.push(instanceId)
    else if (visualIds.length === 1) mapped[instanceId] = visualIds[0]
    else ambiguousCanonicalEntityIds[instanceId] = visualIds
  })
  return {
    canonicalEntityIds: canonical,
    visualEntityIds: Object.values(mapped).sort() as VisualEntityId[],
    mapped,
    missingCanonicalEntityIds,
    ambiguousCanonicalEntityIds,
  }
}

function cardinalityMatches(count: number, cardinality: SelectorCardinality): boolean {
  if (cardinality === 'zero-or-more') return true
  if (cardinality === 'one-or-more') return count >= 1
  if (cardinality === 'exactly-one') return count === 1
  return count === cardinality.exact
}

function visualDiagnostic(diagnostic: RuntimeDiagnostic, mountId: string): VisualDiagnostic {
  return {
    code: diagnostic.code,
    severity: diagnostic.severity === 'fatal' ? 'error' : diagnostic.severity,
    message: `[${mountId}] ${diagnostic.message}`,
    accessibleMessage: `[${mountId}] ${diagnostic.message}`,
  }
}

export class CompositionEntityProjection {
  private readonly mounted: () => LoadedEducationalFixtureMount[]

  constructor(mounted: () => LoadedEducationalFixtureMount[]) {
    this.mounted = mounted
  }

  resolve(selector: CompositionSelector): CompositionSelectorResolution {
    const diagnostics: VisualDiagnostic[] = []
    const candidates = this.mounted().filter(({ spec, fixture }) =>
      (!selector.mountId || spec.id === selector.mountId)
      && (!selector.fixtureId || fixture.id === selector.fixtureId))
    if (candidates.length === 0) {
      diagnostics.push({
        code: 'EV-SELECTOR-MOUNT-NOT-LOADED',
        severity: 'error',
        message: 'El selector no tiene ninguna montura cargada compatible.',
        accessibleMessage: 'La pieza solicitada no está cargada en la composición actual.',
      })
    }
    const entityIds: VisualEntityId[] = []
    let semanticEntityCount = 0
    candidates.forEach(({ spec, fixture }) => {
      const resolution = new SemanticSelectorResolver(new ProjectEntityIndex(fixture.assembly))
        .resolve(selector.selector, 'zero-or-more')
      semanticEntityCount += selector.selector.by === 'definition'
        ? (resolution.entities.length > 0 ? 1 : 0)
        : resolution.entities.length
      diagnostics.push(...resolution.diagnostics
        .filter(({ code }) => code !== 'LR-SELECTOR-CARDINALITY')
        .map((diagnostic) => visualDiagnostic(diagnostic, spec.id)))
      resolution.entities.forEach((entity) => {
        entity.relatedInstanceIds.forEach((instanceId) => {
          entityIds.push(visualEntityId(spec.id, fixture.id, instanceId))
        })
      })
    })
    const unique = [...new Set(entityIds)].sort() as VisualEntityId[]
    const cardinalitySatisfied = cardinalityMatches(semanticEntityCount, selector.cardinality)
    if (!cardinalitySatisfied) {
      diagnostics.push({
        code: 'EV-SELECTOR-CARDINALITY',
        severity: 'error',
        message: `El selector resolvió ${semanticEntityCount} entidades semánticas y no cumple la cardinalidad declarada.`,
        accessibleMessage: `La selección encontró ${semanticEntityCount} resultados; la actividad necesita otra cantidad.`,
        entityIds: unique,
      })
    }
    return {
      selector: structuredClone(selector),
      entityIds: unique,
      semanticEntityCount,
      cardinalitySatisfied,
      diagnostics,
    }
  }

  canonicalIndexes(): ReadonlyMap<string, ProjectEntityIndex> {
    return new Map(this.mounted().map(({ spec, fixture }) =>
      [spec.id, new ProjectEntityIndex(fixture.assembly)]))
  }
}
