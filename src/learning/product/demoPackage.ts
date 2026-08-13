import type { LearningPack } from '../content/learningPack'
import type {
  ActivityPedagogicalContract,
  ActivityFeedbackContract,
  ActivityInteractionContract,
  CalibreLabActivityContract,
  ComparativeArchitectureActivityContract,
  DeliberatePracticeContract,
  EducationalFixtureBinding,
  LearningPathDesign,
  LessonStudyContract,
  ManufacturingActivityContract,
  MechanicalLabActivityContract,
  MisconceptionDefinition,
  PersonalWatchDesignActivityContract,
  RecommendationDefinition,
  ServiceProcedureActivityContract,
  TutorContextContract,
  ValidationActivityContract,
  WorkbenchActivityContract,
} from '../content/authoring'
import type { FidelityProfile } from '../fidelity'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import { encodeLearningPackage } from '../runtime/packageLoader'

export type LearningDifficulty = 'introductory' | 'intermediate' | 'advanced'

export interface LearningKnowledgeNode {
  id: string
  title: { es: string; en: string }
  summary: { es: string; en: string }
  kind: 'concept' | 'skill' | 'subsystem'
  knowledgeType: 'terminology' | 'conceptual-causal' | 'spatial' | 'quantitative' | 'procedural' | 'diagnostic' | 'epistemic'
  prerequisiteIds: string[]
  recommendedPrerequisiteIds: string[]
  relatedIds: string[]
  competencyIds: string[]
  movementIds: string[]
  subsystem: string
  routeIds: string[]
  activityIds: string[]
  misconceptionIds: string[]
  bridgeLessonId?: string
  plainLanguage?: { es: string; en: string }
  technicalLanguage?: { es: string; en: string }
  whyItMatters?: { es: string; en: string }
  observableActions: Array<{ es: string; en: string }>
  transferTargetIds: string[]
  targetEvidenceLevel: 'exposure' | 'recognition' | 'causal-explanation' | 'guided-simulation' | 'independent-simulation' | 'physical-observation' | 'transfer'
  availability: 'available' | 'prerequisite-blocked' | 'future'
}

export interface LearningActivityDescriptor {
  id: string
  packageId: string
  packageVersion: string
  lessonId: string
  sceneId: string
  sceneIds: string[]
  rubricId: string
  title: { es: string; en: string }
  description: { es: string; en: string }
  difficulty: LearningDifficulty
  durationMinutes: number
  activityType: 'observation-3d' | 'prediction' | 'guided-practice' | 'comparison' | 'explanation'
  movementIds: string[]
  familyIds: string[]
  subsystem: string
  competencyIds: string[]
  requiredCapabilities: string[]
  languages: string[]
  offline: boolean
  fidelity: FidelityProfile
  warnings: { es: string[]; en: string[] }
  sourceIds: string[]
  visualResourceIds: string[]
  evidenceTemplateIds: string[]
  fixtureBinding?: EducationalFixtureBinding
  interactionContract?: ActivityInteractionContract
  workbenchContract?: WorkbenchActivityContract
  mechanicalLabContract?: MechanicalLabActivityContract
  calibreLabContract?: CalibreLabActivityContract
  comparativeArchitectureContract?: ComparativeArchitectureActivityContract
  serviceProcedureContract?: ServiceProcedureActivityContract
  manufacturingContract?: ManufacturingActivityContract
  personalWatchDesignContract?: PersonalWatchDesignActivityContract
  validationContract?: ValidationActivityContract
  pedagogicalContract?: ActivityPedagogicalContract
  deliberatePractice?: DeliberatePracticeContract
  feedbackContract?: ActivityFeedbackContract
  tutorContract?: TutorContextContract
  demo: boolean
}

export interface LearningLessonDescriptor {
  id: string
  title: { es: string; en: string }
  purpose: { es: string; en: string }
  activityIds: string[]
  conceptIds: string[]
  prerequisiteConceptIds: string[]
  recommendedPrerequisiteConceptIds: string[]
  pedagogy?: NonNullable<LearningPack['lessons'][number]['authoring']>['pedagogy']
  studyContract?: LessonStudyContract
  tutorContract?: TutorContextContract
  externalPrerequisiteCompetencyIds?: string[]
}

export interface LearningModuleDescriptor {
  id: string
  title: { es: string; en: string }
  lessonIds: string[]
}

export interface LearningRouteDescriptor {
  id: string
  title: { es: string; en: string }
  purpose: { es: string; en: string }
  prerequisiteNodeIds: string[]
  moduleIds: string[]
  competencyIds: string[]
  movementIds: string[]
  difficulty: LearningDifficulty
  sourceLabels: string[]
  fidelity?: FidelityProfile
  learningDesign?: LearningPathDesign
  demo: boolean
}

export interface LearningProductIndex {
  schemaVersion: 1
  packageId: string
  packageVersion: string
  routes: LearningRouteDescriptor[]
  modules: LearningModuleDescriptor[]
  lessons: LearningLessonDescriptor[]
  activities: LearningActivityDescriptor[]
  knowledgeNodes: LearningKnowledgeNode[]
  misconceptions: MisconceptionDefinition[]
  recommendations: RecommendationDefinition[]
}

const PACKAGE_ID = 'wplab.demo.learning-foundations'
const PACKAGE_VERSION = '1.0.0'
const ACTIVITY_ID = 'activity.demo.identify-case'
const LESSON_ID = 'lesson.demo.orientation'
const SCENE_ID = 'scene.demo.project-orientation'
const RUBRIC_ID = 'rubric.demo.orientation'
const COMPETENCY_ID = 'competency.identify-components'

export function createIntegratedDemoLearningPack(): LearningPack {
  const pack = createRuntimeLearningPackFixture()
  pack.manifest.id = PACKAGE_ID
  pack.manifest.packageVersion = PACKAGE_VERSION
  pack.manifest.title = 'Demostración contractual · orientación en el proyecto'
  pack.manifest.languages = ['es-ES', 'en-US']
  pack.manifest.movements = []
  pack.manifest.createdAt = '2026-07-23T09:00:00.000Z'
  pack.manifest.entries.blocks = [{ id: 'concept.demo.orientation', path: 'content/blocks/concept.demo.orientation.json' }]
  pack.manifest.entries.lessons = [{ id: LESSON_ID, path: `content/lessons/${LESSON_ID}.json` }]
  pack.manifest.entries.activities = [{ id: ACTIVITY_ID, path: `content/activities/${ACTIVITY_ID}.json` }]
  pack.manifest.entries.scenes = [{ id: SCENE_ID, path: `content/scenes/${SCENE_ID}.json` }]
  pack.manifest.entries.competencies = [{ id: COMPETENCY_ID, path: `content/competencies/${COMPETENCY_ID}.json` }]
  pack.manifest.entries.evidenceTemplates = [
    { id: 'evidence.demo.selection', path: 'content/evidence/evidence.demo.selection.json' },
    { id: 'evidence.demo.sequence', path: 'content/evidence/evidence.demo.sequence.json' },
  ]
  pack.manifest.entries.rubrics = [{ id: RUBRIC_ID, path: `content/rubrics/${RUBRIC_ID}.json` }]
  pack.manifest.entries.glossary = [{ id: 'term.demo.case', path: 'content/glossary/term.demo.case.json' }]
  pack.blocks = [{
    id: 'concept.demo.orientation',
    version: PACKAGE_VERSION,
    kind: 'concept',
    title: 'Orientación en el proyecto técnico',
    bodyMarkdown: 'Esta demostración usa la **caja** del proyecto activo para validar selección semántica, restauración y evidencia.',
    claims: [],
  }]
  pack.lessons = [{
    id: LESSON_ID,
    version: PACKAGE_VERSION,
    title: 'Orientarse sin modificar el reloj',
    blockIds: ['concept.demo.orientation'],
    activityIds: [ACTIVITY_ID],
  }]
  pack.activities = [{
    id: ACTIVITY_ID,
    version: PACKAGE_VERSION,
    title: 'Identificar la caja del proyecto',
    sceneIds: [SCENE_ID],
    competencyIds: [COMPETENCY_ID],
    evidenceTemplateIds: ['evidence.demo.selection', 'evidence.demo.sequence'],
    rubricId: RUBRIC_ID,
    projectReference: { kind: 'template-readonly', templateId: 'active-project-v5-projection' },
  }]
  pack.scenes = [{
    id: SCENE_ID,
    version: PACKAGE_VERSION,
    title: 'Orientación reversible',
    description: 'Aísla visualmente la caja del proyecto v5 activo sin escribir en el proyecto técnico.',
    requiredCapabilities: [
      'viewport.selection@^1.0.0',
      'viewport.visibility@^1.0.0',
      'viewport.isolation@^1.0.0',
      'timeline.scrub@^1.0.0',
    ],
    state: {
      selected: [],
      visible: [],
      hidden: [],
      isolated: [{ selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }],
      transparent: [],
      highlighted: [{ selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }],
      explode: 0,
      speed: 1,
    },
    timeline: [
      {
        atMs: 0,
        operation: 'select',
        targets: [{ selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' }],
        durationMs: 0,
        essential: false,
        waitFor: 'none',
      },
      {
        atMs: 1_500,
        operation: 'explode',
        targets: [],
        value: 0.18,
        durationMs: 800,
        essential: false,
        waitFor: 'none',
      },
    ],
    overlays: [{
      kind: 'text',
      id: 'overlay.demo.scope',
      markdown: 'Demostración contractual: geometría paramétrica del proyecto, movimiento ilustrativo y sin física.',
      accessibleLabel: 'Contenido de demostración con geometría paramétrica, movimiento ilustrativo y sin física.',
    }],
    steps: [
      {
        id: 'step.demo.observe',
        instructionMarkdown: 'Observa la caja aislada y revisa el alcance G2, K1, P0.',
        questions: [],
        success: [{ condition: 'step-confirmed' }],
      },
      {
        id: 'step.demo.confirm',
        instructionMarkdown: 'Confirma la selección semántica de la caja.',
        questions: [],
        success: [{
          condition: 'selected',
          target: { selector: { by: 'role', value: 'case' }, cardinality: 'exactly-one' },
        }],
      },
    ],
    restorePreviousState: true,
  }]
  pack.competencies = [{
    id: COMPETENCY_ID,
    version: PACKAGE_VERSION,
    title: 'Identificar componentes por su función',
    description: 'Reconoce una entidad técnica sin depender de una posición visual fija.',
    prerequisites: [],
  }]
  pack.evidenceTemplates = [{
    id: 'evidence.demo.selection',
    version: PACKAGE_VERSION,
    competencyId: COMPETENCY_ID,
    kind: 'answer',
    scoringMethod: 'binary',
    extraction: {
      id: 'evidence.demo.selection-confirmed',
      version: PACKAGE_VERSION,
      triggerEventType: 'selection-confirmed',
      evidenceType: 'selection',
      competencyId: COMPETENCY_ID,
      confidence: 1,
      contentFields: ['sceneId', 'entityIds'],
    },
  }, {
    id: 'evidence.demo.sequence',
    version: PACKAGE_VERSION,
    competencyId: COMPETENCY_ID,
    kind: 'procedure',
    scoringMethod: 'binary',
    extraction: {
      id: 'evidence.demo.sequence-completed',
      version: PACKAGE_VERSION,
      triggerEventType: 'scene-completed',
      evidenceType: 'sequence',
      competencyId: COMPETENCY_ID,
      minimumSessionState: ['active', 'paused', 'completed'],
      confidence: 0.9,
      contentFields: ['sceneId'],
    },
  }]
  pack.rubrics = [{
    id: RUBRIC_ID,
    version: PACKAGE_VERSION,
    competencyId: COMPETENCY_ID,
    rules: [{
      id: 'rule.demo.orientation',
      version: PACKAGE_VERSION,
      targetState: 'demonstrated',
      acceptedEvidenceKinds: ['answer'],
      minimumEvidence: 1,
      minimumScore: 1,
      minimumDistinctSessions: 1,
      minimumSpanDays: 0,
      explanationTemplate: 'La selección confirmada y la finalización restaurada demuestran orientación básica.',
    }],
    assessmentRule: {
      id: 'rubric.demo.orientation',
      version: PACKAGE_VERSION,
      competencyId: COMPETENCY_ID,
      targetState: 'demonstrated',
      condition: {
        op: 'all',
        conditions: [
          { op: 'exists', filter: { evidenceType: 'sequence', status: 'active', minimumConfidence: 0.8 } },
          { op: 'minimum-evidence', count: 1 },
        ],
      },
    },
  }]
  pack.glossary = [{
    id: 'term.demo.case',
    version: PACKAGE_VERSION,
    term: 'Caja / Case',
    definitionMarkdown: 'Estructura exterior que contiene y protege el conjunto del reloj.',
    language: 'es-ES',
  }]
  return pack
}

export function createIntegratedDemoLearningPackageBytes(): Uint8Array {
  return encodeLearningPackage(
    createIntegratedDemoLearningPack(),
    [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }],
  )
}

export const DEMO_LEARNING_PRODUCT_INDEX: LearningProductIndex = {
  schemaVersion: 1,
  packageId: PACKAGE_ID,
  packageVersion: PACKAGE_VERSION,
  routes: [{
    id: 'route.demo.project-orientation',
    title: { es: 'Orientación en el reloj activo', en: 'Active watch orientation' },
    purpose: {
      es: 'Comprender cómo Aprender referencia el proyecto técnico sin copiarlo ni modificarlo.',
      en: 'Understand how Learn references the technical project without copying or changing it.',
    },
    prerequisiteNodeIds: [],
    moduleIds: ['module.demo.orientation'],
    competencyIds: [COMPETENCY_ID],
    movementIds: ['movement.active-project'],
    difficulty: 'introductory',
    sourceLabels: ['Proyecto técnico activo', 'Contratos S0–S2'],
    demo: true,
  }],
  modules: [{
    id: 'module.demo.orientation',
    title: { es: 'Lectura del proyecto', en: 'Reading the project' },
    lessonIds: [LESSON_ID],
  }],
  lessons: [{
    id: LESSON_ID,
    title: { es: 'Orientarse sin modificar el reloj', en: 'Navigate without changing the watch' },
    purpose: {
      es: 'Usar selección, aislamiento y restauración sobre una proyección v5.',
      en: 'Use selection, isolation and restoration on a v5 projection.',
    },
    activityIds: [ACTIVITY_ID],
    conceptIds: ['concept.demo.project', 'concept.demo.identity'],
    prerequisiteConceptIds: [],
    recommendedPrerequisiteConceptIds: [],
  }],
  activities: [{
    id: ACTIVITY_ID,
    packageId: PACKAGE_ID,
    packageVersion: PACKAGE_VERSION,
    lessonId: LESSON_ID,
    sceneId: SCENE_ID,
    sceneIds: [SCENE_ID],
    rubricId: RUBRIC_ID,
    title: { es: 'Identificar la caja del proyecto', en: 'Identify the project case' },
    description: {
      es: 'Actividad 3D real del runtime que aísla y restaura la caja del proyecto activo.',
      en: 'A real runtime 3D activity that isolates and restores the active project case.',
    },
    difficulty: 'introductory',
    durationMinutes: 4,
    activityType: 'observation-3d',
    movementIds: ['movement.active-project'],
    familyIds: ['family.active-project'],
    subsystem: 'watch-structure',
    competencyIds: [COMPETENCY_ID],
    requiredCapabilities: [
      'viewport.selection',
      'viewport.visibility',
      'viewport.isolation',
      'timeline.scrub',
    ],
    languages: ['es-ES', 'en-US'],
    offline: true,
    fidelity: {
      geometry: 'G2',
      kinematics: 'K1',
      physics: 'P0',
      limitations: [
        'Geometría paramétrica del proyecto activo.',
        'Movimiento ilustrativo sin modelo físico.',
      ],
    },
    warnings: {
      es: [
        'Contenido de demostración; no es un curso definitivo.',
        'No es un manual MIYOTA ni representa piezas internas no documentadas.',
      ],
      en: [
        'Demonstration content; this is not a final course.',
        'This is not a MIYOTA manual and does not represent undocumented internal parts.',
      ],
    },
    sourceIds: [],
    visualResourceIds: [],
    evidenceTemplateIds: ['evidence.demo.selection', 'evidence.demo.sequence'],
    demo: true,
  }],
  knowledgeNodes: [
    {
      id: 'concept.demo.project',
      title: { es: 'Proyecto técnico único', en: 'Single technical project' },
      summary: {
        es: 'Aprender referencia la verdad técnica y conserva su propio overlay reversible.',
        en: 'Learn references the technical truth and keeps a separate reversible overlay.',
      },
      kind: 'concept',
      knowledgeType: 'conceptual-causal',
      prerequisiteIds: [],
      recommendedPrerequisiteIds: [],
      relatedIds: ['concept.demo.identity'],
      competencyIds: [COMPETENCY_ID],
      movementIds: ['movement.active-project'],
      subsystem: 'product-foundations',
      routeIds: ['route.demo.project-orientation'],
      activityIds: [],
      misconceptionIds: [],
      observableActions: [],
      transferTargetIds: [],
      targetEvidenceLevel: 'recognition',
      availability: 'available',
    },
    {
      id: 'concept.demo.identity',
      title: { es: 'Identidad semántica', en: 'Semantic identity' },
      summary: {
        es: 'Las entidades se resuelven por rol y capacidad, no por texto traducido.',
        en: 'Entities resolve by role and capability, not translated labels.',
      },
      kind: 'skill',
      knowledgeType: 'procedural',
      prerequisiteIds: ['concept.demo.project'],
      recommendedPrerequisiteIds: [],
      relatedIds: ['concept.demo.fidelity'],
      competencyIds: [COMPETENCY_ID],
      movementIds: ['movement.active-project'],
      subsystem: 'canonical-model',
      routeIds: ['route.demo.project-orientation'],
      activityIds: [ACTIVITY_ID],
      misconceptionIds: [],
      observableActions: [],
      transferTargetIds: [],
      targetEvidenceLevel: 'guided-simulation',
      availability: 'available',
    },
    {
      id: 'concept.demo.fidelity',
      title: { es: 'Fidelidad G/K/P', en: 'G/K/P fidelity' },
      summary: {
        es: 'Geometría, cinemática y física se comunican en ejes independientes.',
        en: 'Geometry, kinematics and physics are communicated on separate axes.',
      },
      kind: 'concept',
      knowledgeType: 'epistemic',
      prerequisiteIds: ['concept.demo.identity'],
      recommendedPrerequisiteIds: [],
      relatedIds: ['concept.demo.project'],
      competencyIds: [COMPETENCY_ID],
      movementIds: ['movement.active-project'],
      subsystem: 'evidence',
      routeIds: ['route.demo.project-orientation'],
      activityIds: [ACTIVITY_ID],
      misconceptionIds: [],
      observableActions: [],
      transferTargetIds: [],
      targetEvidenceLevel: 'causal-explanation',
      availability: 'available',
    },
  ],
  misconceptions: [],
  recommendations: [],
}

export function createLearningProductIndex(pack: LearningPack): LearningProductIndex {
  const fallback = (value: string) => ({ es: value, en: value })
  return {
    schemaVersion: 1,
    packageId: pack.manifest.id,
    packageVersion: pack.manifest.packageVersion,
    routes: pack.routes.map((route) => {
      const routeLessonIds = pack.modules
        .filter(({ id }) => route.moduleIds.includes(id))
        .flatMap(({ lessonIds }) => lessonIds)
      const routeLessons = pack.lessons.filter(({ id }) => routeLessonIds.includes(id))
      const routeActivityIds = routeLessons.flatMap(({ activityIds }) => activityIds)
      const routeFidelity = pack.activities.find(({ id }) => routeActivityIds.includes(id))?.authoring?.fidelity
      const externalPrerequisites = routeLessons.flatMap(({ authoring }) =>
        authoring?.externalPrerequisites.flatMap(({ moduleIds, competencyIds }) => [...moduleIds, ...competencyIds]) ?? [])
      return {
        id: route.id,
        title: route.title,
        purpose: route.purpose,
        prerequisiteNodeIds: [...new Set([...route.prerequisiteConceptIds, ...externalPrerequisites])],
        moduleIds: route.moduleIds,
        competencyIds: route.competencyIds,
        movementIds: route.movementIds,
        difficulty: route.difficulty,
        sourceLabels: route.sourceIds.map((sourceId) =>
          pack.sources.find(({ id }) => id === sourceId)?.resource.title ?? sourceId),
        fidelity: routeFidelity ? structuredClone(routeFidelity) : undefined,
        learningDesign: route.learningDesign ? structuredClone(route.learningDesign) : undefined,
        demo: route.demo,
      }
    }),
    modules: pack.modules.map((module) => ({
      id: module.id,
      title: module.title,
      lessonIds: module.lessonIds,
    })),
    lessons: pack.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.authoring?.title ?? fallback(lesson.title),
      purpose: lesson.authoring?.purpose ?? fallback(lesson.title),
      activityIds: lesson.activityIds,
      conceptIds: lesson.authoring?.conceptIds ?? [],
      prerequisiteConceptIds: lesson.authoring?.prerequisiteConceptIds ?? [],
      recommendedPrerequisiteConceptIds: lesson.authoring?.recommendedPrerequisiteConceptIds ?? [],
      pedagogy: lesson.authoring?.pedagogy ? structuredClone(lesson.authoring.pedagogy) : undefined,
      studyContract: lesson.authoring?.studyContract
        ? structuredClone(lesson.authoring.studyContract)
        : undefined,
      tutorContract: lesson.authoring?.tutorContract
        ? structuredClone(lesson.authoring.tutorContract)
        : undefined,
      externalPrerequisiteCompetencyIds: lesson.authoring?.externalPrerequisites
        .flatMap(({ competencyIds }) => competencyIds) ?? [],
    })),
    activities: pack.activities.map((activity) => {
      const authoring = activity.authoring
      const sceneId = activity.sceneIds[0]
      const scene = pack.scenes.find(({ id }) => id === sceneId)
      return {
        id: activity.id,
        packageId: pack.manifest.id,
        packageVersion: pack.manifest.packageVersion,
        lessonId: authoring?.lessonId ?? pack.lessons.find(({ activityIds }) => activityIds.includes(activity.id))?.id ?? '',
        sceneId,
        sceneIds: [...activity.sceneIds],
        rubricId: activity.rubricId,
        title: authoring?.title ?? fallback(activity.title),
        description: authoring?.description ?? fallback(activity.title),
        difficulty: authoring?.difficulty ?? 'introductory',
        durationMinutes: authoring?.durationMinutes ?? 5,
        activityType: authoring?.activityType ?? 'observation-3d',
        movementIds: authoring?.movementIds ?? [],
        familyIds: authoring?.familyIds ?? [],
        subsystem: authoring?.subsystem ?? 'unclassified',
        competencyIds: activity.competencyIds,
        requiredCapabilities: authoring?.requiredCapabilities
          ?? scene?.requiredCapabilities.map((capability) => typeof capability === 'string' ? capability.split('@')[0] : capability.id)
          ?? [],
        languages: authoring?.languages ?? pack.manifest.languages,
        offline: authoring?.offline ?? true,
        fidelity: authoring?.fidelity ?? {
          geometry: 'G0',
          kinematics: 'K0',
          physics: 'P0',
          limitations: ['Fidelidad editorial no declarada.'],
        },
        warnings: authoring?.warnings ?? { es: [], en: [] },
        sourceIds: authoring?.sourceIds ?? [],
        visualResourceIds: authoring?.visualResourceIds ?? [],
        evidenceTemplateIds: [...activity.evidenceTemplateIds],
        fixtureBinding: structuredClone(scene?.fixtureBinding ?? authoring?.fixtureBinding),
        interactionContract: authoring?.interactionContract
          ? structuredClone(authoring.interactionContract)
          : undefined,
        workbenchContract: authoring?.workbenchContract
          ? structuredClone(authoring.workbenchContract)
          : undefined,
        mechanicalLabContract: authoring?.mechanicalLabContract
          ? structuredClone(authoring.mechanicalLabContract)
          : undefined,
        calibreLabContract: authoring?.calibreLabContract
          ? structuredClone(authoring.calibreLabContract)
          : undefined,
        comparativeArchitectureContract: authoring?.comparativeArchitectureContract
          ? structuredClone(authoring.comparativeArchitectureContract)
          : undefined,
        serviceProcedureContract: authoring?.serviceProcedureContract
          ? structuredClone(authoring.serviceProcedureContract)
          : undefined,
        manufacturingContract: authoring?.manufacturingContract
          ? structuredClone(authoring.manufacturingContract)
          : undefined,
        personalWatchDesignContract: authoring?.personalWatchDesignContract
          ? structuredClone(authoring.personalWatchDesignContract)
          : undefined,
        validationContract: authoring?.validationContract
          ? structuredClone(authoring.validationContract)
          : undefined,
        pedagogicalContract: authoring?.pedagogicalContract
          ? structuredClone(authoring.pedagogicalContract)
          : undefined,
        deliberatePractice: authoring?.deliberatePractice
          ? structuredClone(authoring.deliberatePractice)
          : undefined,
        feedbackContract: authoring?.feedbackContract
          ? structuredClone(authoring.feedbackContract)
          : undefined,
        tutorContract: authoring?.tutorContract
          ? structuredClone(authoring.tutorContract)
          : undefined,
        demo: pack.routes.some((route) => route.demo && route.moduleIds.some((moduleId) =>
          pack.modules.find(({ id }) => id === moduleId)?.lessonIds.includes(authoring?.lessonId ?? ''))),
      }
    }),
    knowledgeNodes: pack.concepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      summary: concept.summary,
      kind: concept.kind,
      knowledgeType: concept.knowledgeType,
      prerequisiteIds: [...concept.prerequisiteIds],
      recommendedPrerequisiteIds: [...concept.recommendedPrerequisiteIds],
      relatedIds: [...concept.relatedIds],
      competencyIds: [...concept.competencyIds],
      movementIds: [...concept.movementIds],
      subsystem: concept.subsystem,
      routeIds: [...concept.routeIds],
      activityIds: [...concept.activityIds],
      misconceptionIds: [...concept.misconceptionIds],
      bridgeLessonId: concept.bridgeLessonId,
      plainLanguage: concept.plainLanguage ? structuredClone(concept.plainLanguage) : undefined,
      technicalLanguage: concept.technicalLanguage ? structuredClone(concept.technicalLanguage) : undefined,
      whyItMatters: concept.whyItMatters ? structuredClone(concept.whyItMatters) : undefined,
      observableActions: structuredClone(concept.observableActions),
      transferTargetIds: [...concept.transferTargetIds],
      targetEvidenceLevel: concept.targetEvidenceLevel,
      availability: concept.availability,
    })),
    misconceptions: structuredClone(pack.misconceptions),
    recommendations: structuredClone(pack.recommendations),
  }
}

export function mergeLearningProductIndexes(indexes: LearningProductIndex[]): LearningProductIndex {
  const [first] = indexes
  if (!first) throw new Error('Se requiere al menos un índice de producto.')
  return {
    schemaVersion: 1,
    packageId: first.packageId,
    packageVersion: first.packageVersion,
    routes: indexes.flatMap(({ routes }) => routes),
    modules: indexes.flatMap(({ modules }) => modules),
    lessons: indexes.flatMap(({ lessons }) => lessons),
    activities: indexes.flatMap(({ activities }) => activities),
    knowledgeNodes: indexes.flatMap(({ knowledgeNodes }) => knowledgeNodes),
    misconceptions: indexes.flatMap(({ misconceptions }) => misconceptions),
    recommendations: indexes.flatMap(({ recommendations }) => recommendations),
  }
}
