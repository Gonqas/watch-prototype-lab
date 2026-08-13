import { LearningPackSchema, type LearningPack } from '../content/learningPack'

const officialSource = {
  id: 'miyota-8215-official-product',
  authority: 'official-miyota' as const,
  usage: 'official-linked' as const,
  resource: {
    kind: 'web-page' as const,
    title: 'MIYOTA Caliber 8215',
    locator: 'https://miyotamovement.com/product/8215/',
  },
  calibre: '8215',
  retrievedAt: '2026-07-15',
  supportedClaim: 'El calibre 8215 se usa únicamente como referencia documental del ejercicio.',
  derivedLayer: 'source' as const,
}

const educationalAssetSource = {
  id: 'fixture-derived-note',
  authority: 'educational-derived' as const,
  usage: 'shareable' as const,
  resource: { kind: 'note' as const, title: 'Nota sintética del fixture contractual' },
  importedAt: '2026-07-22T09:00:00.000Z',
  supportedClaim: 'Activo sintético usado únicamente para validar hashes y manifiestos.',
  derivedLayer: 'educational' as const,
  originalSourceId: officialSource.id,
}

export const minimalLearningPackFixture: LearningPack = LearningPackSchema.parse({
  manifest: {
    format: 'wplab-learning-pack',
    formatVersion: 1,
    packageVersion: '0.0.1',
    id: 'test.contract-pack',
    title: 'Paquete mínimo de prueba contractual',
    distribution: 'integrated',
    authors: [{ name: 'Watch Prototype Lab' }],
    languages: ['es'],
    dependencies: [],
    requiredCapabilities: ['canonical-selectors-v1'],
    movements: [{ manufacturer: 'MIYOTA', calibre: '8215' }],
    assets: [{
      id: 'asset.test-note',
      path: 'assets/9f86d081884c7d659a2feaa0c55ad015.txt',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      bytes: 4,
      mediaType: 'text/plain',
      provenance: educationalAssetSource,
    }],
    entries: {
      blocks: [{ id: 'concept.fastener', path: 'content/blocks/concept.fastener.json' }],
      lessons: [{ id: 'lesson.contract', path: 'content/lessons/lesson.contract.json' }],
      activities: [{ id: 'activity.identify', path: 'content/activities/activity.identify.json' }],
      scenes: [{ id: 'scene.identify', path: 'content/scenes/scene.identify.json' }],
      competencies: [{ id: 'competency.identify', path: 'content/competencies/competency.identify.json' }],
      evidenceTemplates: [{ id: 'evidence.selection', path: 'content/evidence/evidence.selection.json' }],
      rubrics: [{ id: 'rubric.identify', path: 'content/rubrics/rubric.identify.json' }],
      glossary: [{ id: 'term.fastener', path: 'content/glossary/term.fastener.json' }],
    },
    minimumAppVersion: '0.4.1',
    createdAt: '2026-07-22T09:00:00.000Z',
  },
  blocks: [{
    id: 'concept.fastener',
    version: '1.0.0',
    kind: 'concept',
    title: 'Identidad de una fijación',
    bodyMarkdown: 'Dos piezas de la misma definición conservan identidades físicas distintas.',
    claims: [{
      id: 'claim.contract-only',
      claimType: 'source',
      claim: 'La escena es una abstracción contractual y no una geometría del calibre.',
      sourceStatement: 'El fixture no describe despiece interno del movimiento.',
      method: 'Declaración explícita del fixture',
      fidelity: { geometry: 'G0', kinematics: 'K0', physics: 'P0', limitations: ['Sin geometría, movimiento ni física.'] },
      reliability: 'high',
      inputFingerprint: 'fixture:contract-pack:1',
      recordedAt: '2026-07-22T09:00:00.000Z',
      methodVersion: '1.0.0',
      sources: [officialSource],
    }],
  }],
  lessons: [{
    id: 'lesson.contract',
    version: '1.0.0',
    title: 'Lección contractual',
    blockIds: ['concept.fastener'],
    activityIds: ['activity.identify'],
  }],
  activities: [{
    id: 'activity.identify',
    version: '1.0.0',
    title: 'Identificar una pieza por rol',
    sceneIds: ['scene.identify'],
    competencyIds: ['competency.identify'],
    evidenceTemplateIds: ['evidence.selection'],
    rubricId: 'rubric.identify',
    projectReference: { kind: 'template-readonly', templateId: 'fixture-v6-minimal' },
  }],
  scenes: [{
    id: 'scene.identify',
    version: '1.0.0',
    title: 'Selección semántica',
    requiredCapabilities: ['canonical-selectors-v1'],
    state: {
      selected: [], visible: [], hidden: [], isolated: [], explode: 0, speed: 1,
    },
    timeline: [],
    overlays: [{ kind: 'text', id: 'overlay.intro', markdown: 'Selecciona la **fijación** indicada.' }],
    steps: [{
      id: 'step.select',
      instructionMarkdown: 'Selecciona una pieza con el rol `bridge-screw`.',
      questions: [],
      success: [{ condition: 'selected', target: { by: 'role', value: 'bridge-screw' } }],
    }],
    restorePreviousState: true,
  }],
  competencies: [{
    id: 'competency.identify',
    version: '1.0.0',
    title: 'Identificar fijaciones',
    description: 'Distingue instancias de una misma definición.',
    prerequisites: [],
  }],
  evidenceTemplates: [{
    id: 'evidence.selection',
    version: '1.0.0',
    competencyId: 'competency.identify',
    kind: 'answer',
    scoringMethod: 'binary',
  }],
  rubrics: [{
    id: 'rubric.identify',
    version: '1.0.0',
    competencyId: 'competency.identify',
    rules: [{
      id: 'rule.identify.introduced',
      version: '1.0.0',
      targetState: 'introduced',
      acceptedEvidenceKinds: ['answer'],
      minimumEvidence: 1,
      minimumScore: 1,
      minimumDistinctSessions: 1,
      minimumSpanDays: 0,
      explanationTemplate: 'La selección demuestra una introducción al concepto.',
    }],
  }],
  glossary: [{
    id: 'term.fastener',
    version: '1.0.0',
    term: 'Fijación',
    definitionMarkdown: 'Pieza cuya función declarada es sujetar otras piezas.',
    language: 'es',
  }],
})

export function createInvalidLearningPackFixture(): unknown {
  const fixture = structuredClone(minimalLearningPackFixture)
  fixture.manifest.entries.blocks[0].path = '../escape.json'
  fixture.blocks[0].bodyMarkdown = '<script>alert(1)</script>'
  return fixture
}
