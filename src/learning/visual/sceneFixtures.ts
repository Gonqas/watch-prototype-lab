import { ProjectEntityIndex } from '../canonical'
import type { EducationalFixtureBinding } from '../content/authoring'
import { technicalFixture } from '../technical/fixtures'
import { EducationalViewportComposition } from './composition'
import type {
  EducationalFixtureMountSpec,
  LoadedEducationalFixtureMount,
} from './model'
import { compositionCanonicalAssembly } from './projection'
import { buildEducationalSceneGraph } from './sceneGraph'
import { createSistema4BFixtureRegistry } from './registry'

const FIXTURE_VERSION = '0.1.0'

function mountSpec(fixtureId: string, index: number): EducationalFixtureMountSpec {
  return {
    id: `mount.${index + 1}.${fixtureId}`,
    fixtureId,
    fixtureVersion: FIXTURE_VERSION,
    transform: {
      position: [index * 12, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
    },
    enabled: true,
    label: fixtureId,
  }
}

function layoutFor(binding: EducationalFixtureBinding) {
  if (binding.kind === 'fixture') return 'single' as const
  if (binding.layout === 'overlay') return 'overlay' as const
  if (binding.fixtureIds.length === 2) return 'split-horizontal' as const
  return 'quad' as const
}

export async function createSceneComposition(
  binding: EducationalFixtureBinding,
  reducedMotion: boolean,
): Promise<EducationalViewportComposition> {
  const fixtureIds = binding.kind === 'fixture' ? [binding.fixtureId] : binding.fixtureIds
  const compositionId = binding.kind === 'composition'
    ? binding.compositionId
    : `composition.${binding.fixtureId}`
  const mounts = fixtureIds.map(mountSpec)
  // The renderer deliberately supports one, two or four cells. A three-model
  // comparison reserves a disabled fourth cell without loading or duplicating
  // a fixture in the canonical projection.
  if (mounts.length === 3) {
    mounts.push({
      ...mountSpec(fixtureIds[0], 3),
      id: `mount.4.reserved.${fixtureIds[0]}`,
      enabled: false,
      label: 'Celda reservada',
    })
  }
  const composition = new EducationalViewportComposition({
    id: compositionId,
    version: FIXTURE_VERSION,
    layout: layoutFor(binding),
    mounts,
  }, createSistema4BFixtureRegistry(), { reducedMotion })
  await composition.loadEnabledMounts()
  return composition
}

/**
 * Produces the ephemeral canonical projection used to validate and compile a
 * scene. No WatchProject is created, persisted or mutated.
 */
export function sceneFixtureIndex(
  binding: EducationalFixtureBinding | undefined,
  fallback: () => ProjectEntityIndex,
): ProjectEntityIndex {
  if (!binding) return fallback()
  const fixtureIds = binding.kind === 'fixture'
    ? [binding.fixtureId]
    : binding.fixtureIds
  const compositionId = binding.kind === 'composition'
    ? binding.compositionId
    : `composition.${binding.fixtureId}`
  const mounted: LoadedEducationalFixtureMount[] = fixtureIds.map((fixtureId, index) => {
    const fixture = technicalFixture(fixtureId)
    const spec = mountSpec(fixtureId, index)
    return {
      spec,
      fixture,
      sceneGraph: buildEducationalSceneGraph(compositionId, spec, fixture),
      loadedAt: '1970-01-01T00:00:00.000Z',
      loadDurationMs: 0,
    }
  })
  return new ProjectEntityIndex(compositionCanonicalAssembly(compositionId, mounted))
}
