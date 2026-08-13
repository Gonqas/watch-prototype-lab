import { LearningPackSchema, type LearningPack } from '../content/learningPack'
import { minimalLearningPackFixture } from './learningPackFixtures'

export function createRuntimeLearningPackFixture(): LearningPack {
  const fixture = structuredClone(minimalLearningPackFixture)
  fixture.manifest.title = 'Paquete contractual de runtime'
  fixture.manifest.packageVersion = '1.0.0'
  fixture.manifest.requiredCapabilities = ['learning.scene-runtime@^1.0.0']
  fixture.manifest.entries.scenes = [
    { id: 'scene.v5-reversible', path: 'content/scenes/scene.v5-reversible.json' },
    { id: 'scene.v6-repeated', path: 'content/scenes/scene.v6-repeated.json' },
    { id: 'scene.miyota-reference', path: 'content/scenes/scene.miyota-reference.json' },
    { id: 'scene.invalid-runtime', path: 'content/scenes/scene.invalid-runtime.json' },
  ]
  fixture.activities[0].sceneIds = fixture.manifest.entries.scenes.map(({ id }) => id)
  fixture.scenes = [
    {
      id: 'scene.v5-reversible',
      version: '1.0.0',
      title: 'Escena contractual A · v5 adaptado',
      description: 'Selecciona y aísla la caja de un proyecto v5 sin modificar el proyecto técnico.',
      requiredCapabilities: ['viewport.selection@^1.0.0', 'viewport.visibility@^1.0.0', 'viewport.isolation@^1.0.0'],
      state: {
        selected: [{ selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }],
        visible: [],
        hidden: [{ selector: { by: 'role', value: 'dial' }, cardinality: 'exactly-one' }],
        isolated: [{ selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }],
        transparent: [], highlighted: [], explode: 0, speed: 1,
      },
      timeline: [{ atMs: 0, operation: 'select', targets: [{ selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }], durationMs: 0, essential: false, waitFor: 'none' }],
      overlays: [{ kind: 'text', id: 'overlay.v5', markdown: 'Proyecto v5 proyectado sin escritura.', accessibleLabel: 'Proyecto v5 proyectado sin escritura.' }],
      steps: [],
      restorePreviousState: true,
    },
    {
      id: 'scene.v6-repeated',
      version: '1.0.0',
      title: 'Escena contractual B · instancias repetidas',
      description: 'Resuelve exactamente dos fijaciones y evalúa un explosionado determinista.',
      requiredCapabilities: ['viewport.selection@^1.0.0', 'viewport.explode@^1.0.0', 'timeline.scrub@^1.0.0'],
      state: {
        selected: [{ selector: { by: 'role', value: 'bridge-screw' }, cardinality: { exact: 2 } }],
        visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1,
      },
      timeline: [
        { atMs: 0, operation: 'explode', targets: [], value: 0, durationMs: 0, essential: false, waitFor: 'none' },
        { atMs: 1_000, operation: 'explode', targets: [], value: 1, durationMs: 1_000, essential: false, waitFor: 'none' },
        { atMs: 2_500, operation: 'explode', targets: [], value: 0.25, durationMs: 500, essential: false, waitFor: 'none' },
      ],
      overlays: [{ kind: 'label', id: 'overlay.screws', target: { selector: { by: 'role', value: 'bridge-screw' }, cardinality: { exact: 2 } }, text: 'Dos instancias, una definición', accessibleLabel: 'Dos tornillos físicos distintos comparten definición.' }],
      steps: [
        { id: 'step.identify', instructionMarkdown: 'Identifica las dos instancias.', questions: [], success: [{ condition: 'selected', target: { selector: { by: 'role', value: 'bridge-screw' }, cardinality: { exact: 2 } } }] },
        { id: 'step.explode', instructionMarkdown: 'Observa el estado explosionado.', questions: [], success: [{ condition: 'step-confirmed' }] },
      ],
      restorePreviousState: true,
    },
    {
      id: 'scene.miyota-reference',
      version: '1.0.0',
      title: 'Escena contractual C · referencia MIYOTA',
      description: 'Asocia el calibre MIYOTA 8215 con su referencia documental sin inventar piezas internas.',
      requiredCapabilities: ['canonical-selectors-v1'],
      state: {
        selected: [{ selector: { by: 'calibre', value: '8215' }, cardinality: 'exactly-one' }],
        visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1,
      },
      timeline: [],
      overlays: [{ kind: 'text', id: 'overlay.miyota', markdown: 'Referencia documental oficial MIYOTA 8215; sin despiece interno.', accessibleLabel: 'Referencia documental oficial MIYOTA 8215 sin despiece interno.' }],
      steps: [],
      restorePreviousState: true,
    },
    {
      id: 'scene.invalid-runtime',
      version: '1.0.0',
      title: 'Escena inválida contractual',
      description: 'Fixture destinado a producir diagnósticos antes de mutar el viewport.',
      requiredCapabilities: ['viewport.nonexistent@^1.0.0'],
      state: {
        selected: [{ selector: { by: 'role', value: 'role-that-does-not-exist' }, cardinality: 'exactly-one' }],
        visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1,
      },
      timeline: [], overlays: [], steps: [], restorePreviousState: true,
    },
  ]
  return LearningPackSchema.parse(fixture)
}

export const RUNTIME_FIXTURE_ASSET = new TextEncoder().encode('test')
