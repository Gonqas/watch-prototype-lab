import { z } from 'zod'
import { FidelityProfileSchema } from '../fidelity'
import { SemanticSelectorSchema, SelectorReferenceSchema } from '../runtime/selectors'

const semver = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/)
const contentId = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,159}$/)
const localizedValue = (maximum: number) => z.object({
  es: z.string().min(1).max(maximum),
  en: z.string().min(1).max(maximum).optional(),
}).strict().transform(({ es, en }) => ({ es, en: en ?? es }))

export const LocalizedTextSchema = localizedValue(4_000)
export const LocalizedShortTextSchema = localizedValue(240)
export const LocalizedMarkdownSchema = localizedValue(50_000)

const learningEvidenceLevels = [
  'exposure',
  'recognition',
  'causal-explanation',
  'guided-simulation',
  'independent-simulation',
  'physical-observation',
  'transfer',
] as const

export const LearningMilestoneSchema = z.object({
  id: contentId,
  order: z.number().int().positive().max(200),
  title: LocalizedShortTextSchema,
  outcome: LocalizedTextSchema,
  lessonId: contentId,
  activityId: contentId.optional(),
  mode: z.enum([
    'orientation',
    'explanation',
    'worked-example',
    'guided-practice',
    'independent-practice',
    'demonstration',
    'transfer',
    'retention',
  ]),
  evidenceLevel: z.enum(learningEvidenceLevels),
  optional: z.boolean().default(false),
  transferTargetIds: z.array(contentId).default([]),
}).strict()

export const LearningPathDesignSchema = z.object({
  model: z.enum(['gold-standard', 'specialization']),
  entryPolicy: z.enum(['start-from-zero', 'diagnostic-optional', 'prerequisite-required']),
  completionPolicy: z.enum(['visit', 'practice', 'evidence']),
  milestones: z.array(LearningMilestoneSchema).min(1).max(200),
  diagnosticActivityIds: z.array(contentId).default([]),
  demonstrationActivityIds: z.array(contentId).default([]),
}).strict().superRefine((design, context) => {
  const orders = design.milestones.map(({ order }) => order)
  if (new Set(orders).size !== orders.length) {
    context.addIssue({
      code: 'custom',
      path: ['milestones'],
      message: 'Los hitos de una ruta no pueden compartir orden.',
    })
  }
})

export const CurriculumDefinitionSchema = z.object({
  id: contentId,
  version: semver,
  title: LocalizedShortTextSchema,
  purpose: LocalizedTextSchema,
  routeIds: z.array(contentId).min(1),
  languages: z.array(z.string().min(2).max(8)).min(1),
}).strict()

export const LearningPathDefinitionSchema = z.object({
  id: contentId,
  version: semver,
  title: LocalizedShortTextSchema,
  purpose: LocalizedTextSchema,
  prerequisiteConceptIds: z.array(contentId).default([]),
  moduleIds: z.array(contentId).min(1),
  competencyIds: z.array(contentId).min(1),
  movementIds: z.array(contentId).default([]),
  difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
  sourceIds: z.array(contentId).default([]),
  visualResourceIds: z.array(contentId).default([]),
  learningDesign: LearningPathDesignSchema.optional(),
  demo: z.boolean().default(false),
}).strict()

export const LearningModuleDefinitionSchema = z.object({
  id: contentId,
  version: semver,
  title: LocalizedShortTextSchema,
  purpose: LocalizedTextSchema,
  lessonIds: z.array(contentId).min(1),
}).strict()

export const KnowledgeTypeSchema = z.enum([
  'terminology',
  'conceptual-causal',
  'spatial',
  'quantitative',
  'procedural',
  'diagnostic',
  'epistemic',
])

export const LearningEvidenceLevelSchema = z.enum(learningEvidenceLevels)

export const KnowledgeConceptSchema = z.object({
  id: contentId,
  version: semver,
  title: LocalizedShortTextSchema,
  summary: LocalizedTextSchema,
  kind: z.enum(['concept', 'skill', 'subsystem']),
  knowledgeType: KnowledgeTypeSchema.default('conceptual-causal'),
  prerequisiteIds: z.array(contentId).default([]),
  recommendedPrerequisiteIds: z.array(contentId).default([]),
  relatedIds: z.array(contentId).default([]),
  competencyIds: z.array(contentId).default([]),
  movementIds: z.array(contentId).default([]),
  subsystem: z.string().min(1).max(160),
  routeIds: z.array(contentId).default([]),
  activityIds: z.array(contentId).default([]),
  sourceIds: z.array(contentId).default([]),
  misconceptionIds: z.array(contentId).default([]),
  bridgeLessonId: contentId.optional(),
  plainLanguage: LocalizedTextSchema.optional(),
  technicalLanguage: LocalizedTextSchema.optional(),
  whyItMatters: LocalizedTextSchema.optional(),
  observableActions: z.array(LocalizedShortTextSchema).default([]),
  transferTargetIds: z.array(contentId).default([]),
  targetEvidenceLevel: LearningEvidenceLevelSchema.default('causal-explanation'),
  availability: z.enum(['available', 'prerequisite-blocked', 'future']).default('available'),
}).strict()

export const MisconceptionDefinitionSchema = z.object({
  id: contentId,
  version: semver,
  title: LocalizedShortTextSchema,
  learnerExpression: LocalizedTextSchema,
  diagnosis: LocalizedTextSchema,
  correction: LocalizedTextSchema,
  observableSignals: z.array(z.string().min(1).max(500)).min(1),
  conceptIds: z.array(contentId).min(1),
  remediationLessonId: contentId,
  sourceIds: z.array(contentId).default([]),
}).strict()

export const LessonVisualStrategySchema = z.object({
  objective: LocalizedTextSchema,
  visibleConcept: LocalizedTextSchema,
  modelReference: z.string().min(1).max(240),
  movementIds: z.array(contentId).default([]),
  involvedSelectors: z.array(SelectorReferenceSchema).default([]),
  initialState: z.object({
    cameraIntent: z.string().min(1).max(1_000),
    visible: z.array(SelectorReferenceSchema).default([]),
    hidden: z.array(SelectorReferenceSchema).default([]),
    isolated: z.array(SelectorReferenceSchema).default([]),
    explode: z.number().min(0).max(1).default(0),
    section: z.string().min(1).max(1_000).optional(),
    transparency: z.array(z.object({
      target: SelectorReferenceSchema,
      opacity: z.number().min(0).max(1),
    }).strict()).default([]),
  }).strict(),
  energyFlow: z.array(z.string().min(1).max(500)).default([]),
  rotationDirections: z.array(z.string().min(1).max(500)).default([]),
  labels: z.array(z.string().min(1).max(500)).default([]),
  arrows: z.array(z.string().min(1).max(500)).default([]),
  animations: z.array(z.string().min(1).max(1_000)).default([]),
  timelineIntent: z.string().min(1).max(4_000),
  userInteraction: z.string().min(1).max(4_000),
  predictionQuestionId: contentId.optional(),
  observableResult: LocalizedTextSchema,
  successCriterion: LocalizedTextSchema,
  restoration: LocalizedTextSchema,
  textualAlternative: LocalizedTextSchema,
  reducedMotionAlternative: LocalizedTextSchema,
  fidelity: FidelityProfileSchema,
  unknownData: z.array(z.string().min(1).max(1_000)).default([]),
  requiredVisualResourceIds: z.array(contentId).default([]),
}).strict()

export const EducationalFixtureBindingSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fixture'),
    fixtureId: contentId,
  }).strict(),
  z.object({
    kind: z.literal('composition'),
    compositionId: contentId,
    fixtureIds: z.array(contentId).min(2).max(8),
    layout: z.enum(['single', 'split', 'overlay', 'grid']),
  }).strict(),
])

export const GraduatedHintSchema = z.object({
  id: contentId,
  level: z.number().int().min(1).max(6),
  kind: z.enum([
    'orientation',
    'subsystem',
    'functional-property',
    'comparison',
    'near-answer',
    'post-attempt-explanation',
  ]),
  content: LocalizedTextSchema,
  availableAfterAttempts: z.number().int().nonnegative(),
  countsAsHint: z.boolean().default(true),
}).strict()

export const OrderedInteractionItemSchema = z.object({
  id: contentId,
  label: LocalizedShortTextSchema,
}).strict()

export const ActivityInteractionContractSchema = z.object({
  responseModel: z.enum([
    'single-choice',
    'multiple-choice',
    'entity-selection',
    'short-text',
    'ordered-list',
    'structured-response',
  ]),
  orderedItems: z.array(OrderedInteractionItemSchema).default([]),
  expectedOrderIds: z.array(contentId).default([]),
  structuredFields: z.array(z.object({
    id: contentId,
    label: LocalizedShortTextSchema,
    kind: z.enum(['choice', 'entity', 'short-text', 'confidence']),
    required: z.boolean().default(true),
  }).strict()).default([]),
  hints: z.array(GraduatedHintSchema).max(6).default([]),
  evidencePolicy: z.object({
    eventType: z.string().min(1).max(120),
    recordsAnswerPayload: z.boolean(),
    deterministicComponents: z.array(contentId).default([]),
    requiresHumanReview: z.boolean().default(false),
    accessibilityAdaptationsCountAsHints: z.literal(false),
  }).strict(),
}).strict().superRefine((contract, context) => {
  if (contract.responseModel === 'ordered-list') {
    const itemIds = contract.orderedItems.map(({ id }) => id)
    if (itemIds.length < 2) {
      context.addIssue({ code: 'custom', path: ['orderedItems'], message: 'Una ordenación requiere al menos dos elementos.' })
    }
    if (
      contract.expectedOrderIds.length !== itemIds.length
      || new Set(contract.expectedOrderIds).size !== itemIds.length
      || itemIds.some((id) => !contract.expectedOrderIds.includes(id))
    ) {
      context.addIssue({ code: 'custom', path: ['expectedOrderIds'], message: 'El orden esperado debe ser una permutación exacta de los elementos.' })
    }
  } else if (contract.orderedItems.length > 0 || contract.expectedOrderIds.length > 0) {
    context.addIssue({ code: 'custom', path: ['orderedItems'], message: 'Solo ordered-list puede declarar elementos ordenables.' })
  }
  const levels = contract.hints.map(({ level }) => level)
  if (new Set(levels).size !== levels.length) {
    context.addIssue({ code: 'custom', path: ['hints'], message: 'Los niveles de pista no pueden repetirse.' })
  }
  const orderedLevels = [...levels].sort((left, right) => left - right)
  if (orderedLevels.some((level, index) => level !== index + 1)) {
    context.addIssue({ code: 'custom', path: ['hints'], message: 'Las pistas deben formar una secuencia contigua desde el nivel 1.' })
  }
  const explanation = contract.hints.find(({ kind }) => kind === 'post-attempt-explanation')
  if (explanation && explanation.availableAfterAttempts < 1) {
    context.addIssue({ code: 'custom', path: ['hints'], message: 'La explicación posterior requiere al menos un intento.' })
  }
  for (const hint of contract.hints) {
    if (
      ['functional-property', 'comparison'].includes(hint.kind)
      && hint.availableAfterAttempts < 1
    ) {
      context.addIssue({
        code: 'custom',
        path: ['hints'],
        message: `La pista ${hint.kind} solo puede aparecer después de un intento.`,
      })
    }
    if (hint.kind === 'near-answer' && hint.availableAfterAttempts < 2) {
      context.addIssue({
        code: 'custom',
        path: ['hints'],
        message: 'Una pista cercana a la respuesta requiere al menos dos intentos.',
      })
    }
  }
  const orderedHints = [...contract.hints].sort((left, right) => left.level - right.level)
  if (orderedHints.some((hint, index) =>
    index > 0 && hint.availableAfterAttempts < orderedHints[index - 1].availableAfterAttempts)) {
    context.addIssue({
      code: 'custom',
      path: ['hints'],
      message: 'La ayuda debe desbloquearse de forma progresiva, sin reducir intentos en niveles posteriores.',
    })
  }
})

export const WorkbenchActivityContractSchema = z.object({
  fixtureId: contentId,
  modes: z.array(z.enum(['guided', 'assisted', 'free'])).min(1),
  requiredZones: z.array(contentId).min(1),
  evidenceContext: z.array(z.enum([
    'mode',
    'assistance',
    'hints',
    'errors',
    'corrections',
    'sources',
    'initial-state',
    'final-state',
    'fixture-limitations',
  ])).min(1),
}).strict()

export type WorkbenchActivityContract = z.infer<typeof WorkbenchActivityContractSchema>

export const MechanicalLabActivityContractSchema = z.object({
  fixtureId: z.literal('fixture.conceptual.mechanical-chain'),
  comparisonFixtureId: z.literal('fixture.miyota.8215.structural'),
  subsystem: z.enum([
    'energy',
    'barrel',
    'gear-pair',
    'train',
    'supports',
    'escapement',
    'oscillator',
    'motion-works',
    'keyless',
    'automatic',
    'calendar',
    'integration',
  ]),
  commands: z.array(z.enum([
    'wind',
    'release',
    'block',
    'unblock',
    'engage',
    'disengage',
    'rotate',
    'oscillate',
    'change-ratio',
    'add-stage',
    'remove-stage',
    'align',
    'misalign',
    'set-time',
    'change-crown-position',
    'enable-automatic',
    'disable-automatic',
    'advance-calendar',
    'introduce-fault',
    'inspect',
    'select-subsystem',
    'change-view',
    'set-oscillator',
    'step-escapement',
    'scrub-escapement',
    'set-escapement-speed',
    'pause-escapement',
    'pause-oscillator',
    'set-hairspring-active-length',
    'project-enable-subsystem',
    'project-record-decision',
    'restore',
    'undo',
  ])).min(1),
  viewModes: z.array(z.enum([
    'normal',
    'schematic',
    'section',
    'exploded',
    'isolated',
    'slow-motion',
    'step-by-step',
    'energy-flow',
    'kinematics',
    'provenance',
    'uncertainty',
    'compare-8215',
    'textual',
  ])).min(1),
  normalizedPhysicsOnly: z.literal(true),
  textualAlternative: z.literal(true),
  reducedMotion: z.literal(true),
}).strict()

export type MechanicalLabActivityContract = z.infer<typeof MechanicalLabActivityContractSchema>

export const CalibreLabActivityContractSchema = z.object({
  fixtureId: z.literal('fixture.miyota.8215.structural'),
  modes: z.array(z.enum(['guided', 'assisted', 'free'])).min(1),
  subsystemIds: z.array(contentId).min(1),
  operationPhases: z.array(z.enum(['documentation', 'disassembly', 'assembly', 'inspection', 'verification', 'diagnosis'])).min(1),
  authorityVisible: z.literal(true),
  instanceIdentityRequired: z.literal(true),
  contextualMechanicalLabs: z.array(z.enum(['barrel', 'train', 'escapement', 'oscillator', 'motion-works', 'automatic'])).default([]),
  textualAlternative: z.literal(true),
  reducedMotion: z.literal(true),
}).strict()

export type CalibreLabActivityContract = z.infer<typeof CalibreLabActivityContractSchema>

export const ComparativeArchitectureActivityContractSchema = z.object({
  caseIds: z.array(contentId).min(2).max(12),
  comparisonAxes: z.array(z.enum([
    'identity-and-provenance',
    'seconds-layout',
    'winding-system',
    'bridge-layout',
    'escapement',
    'calendar',
    'chronograph-control',
    'chronograph-coupling',
    'thinness-strategy',
    'serviceability',
    'trade-offs',
  ])).min(1),
  representation: z.enum(['document-table', 'causal-diagram', 'existing-fixture', 'split-evidence']),
  evidenceBoundary: z.enum(['official-only', 'official-and-curated-secondary', 'historical-reference']),
  exactGeometryRequired: z.boolean(),
  learnerMustSeparateFactInferenceUnknown: z.literal(true),
  unsupportedDimensionsForbidden: z.literal(true),
  textualAlternative: z.literal(true),
}).strict().superRefine((contract, context) => {
  if (contract.representation !== 'existing-fixture' && contract.exactGeometryRequired) {
    context.addIssue({
      code: 'custom',
      path: ['exactGeometryRequired'],
      message: 'Una comparación documental no puede exigir geometría exacta que no está instalada.',
    })
  }
})

export type ComparativeArchitectureActivityContract = z.infer<typeof ComparativeArchitectureActivityContractSchema>

export const ServiceProcedureActivityContractSchema = z.object({
  procedureId: contentId,
  mode: z.enum(['planning', 'simulated-guided', 'physical-observation']),
  stepIds: z.array(contentId).min(1),
  toolCapabilityIds: z.array(contentId).min(1),
  hazardIds: z.array(contentId).min(1),
  inspectionPointIds: z.array(contentId).min(1),
  acceptanceCriterionIds: z.array(contentId).min(1),
  evidenceRequirementIds: z.array(contentId).min(1),
  requiresRestore: z.boolean(),
  physicalCompletionClaim: z.literal(false),
  humanReviewForPhysicalCompetence: z.literal(true),
  authorityVisible: z.literal(true),
  textualAlternative: z.literal(true),
}).strict().superRefine((contract, context) => {
  if (contract.mode === 'physical-observation' && contract.requiresRestore) {
    context.addIssue({
      code: 'custom',
      path: ['requiresRestore'],
      message: 'Restaurar estado es una garantía digital; no debe prometer reversibilidad de una intervención física.',
    })
  }
})

export type ServiceProcedureActivityContract = z.infer<typeof ServiceProcedureActivityContractSchema>

export const ManufacturingActivityContractSchema = z.object({
  processPlanId: contentId,
  artifactKinds: z.array(z.enum([
    'case',
    'dial',
    'hands',
    'mainplate',
    'bridge',
    'micromechanical-part',
    'decorated-surface',
  ])).min(1),
  mode: z.enum(['process-planning', 'simulated-review', 'physical-observation']),
  operationIds: z.array(contentId).min(1),
  materialDecisionIds: z.array(contentId).min(1),
  datumIds: z.array(contentId).min(1),
  toleranceDecisionIds: z.array(contentId).min(1),
  hazardIds: z.array(contentId).min(1),
  inspectionPointIds: z.array(contentId).min(1),
  acceptanceCriterionIds: z.array(contentId).min(1),
  sourceIds: z.array(contentId).min(1),
  physicalCompletionClaim: z.literal(false),
  supervisedWorkshopRequired: z.literal(true),
  drawingAndProcessRevisionRequired: z.literal(true),
  authorityVisible: z.literal(true),
  textualAlternative: z.literal(true),
}).strict().superRefine((contract, context) => {
  if (contract.mode === 'physical-observation' && contract.operationIds.length > 1) {
    context.addIssue({
      code: 'custom',
      path: ['operationIds'],
      message: 'Una observación física registra lo observado; no puede declarar ejecutada una cadena de operaciones.',
    })
  }
})

export type ManufacturingActivityContract = z.infer<typeof ManufacturingActivityContractSchema>

export const PersonalWatchDesignActivityContractSchema = z.object({
  designStageId: contentId,
  routeLevel: z.enum(['acquired-movement-watch', 'controlled-architecture-modification', 'own-movement']),
  gate: z.enum(['requirements', 'concept', 'architecture', 'detail', 'prototype-plan', 'release']),
  inputIds: z.array(contentId).min(1),
  interfaceIds: z.array(contentId).min(1),
  constraintIds: z.array(contentId).min(1),
  deliverableIds: z.array(contentId).min(1),
  verificationPlanIds: z.array(contentId).min(1),
  decisionRecordRequired: z.literal(true),
  alternativesRequired: z.number().int().min(2).max(12),
  unresolvedRiskRegisterRequired: z.literal(true),
  mutatesTechnicalProject: z.literal(false),
  humanDesignReviewRequired: z.literal(true),
  manufacturingReadinessClaim: z.literal(false),
  textualAlternative: z.literal(true),
}).strict().superRefine((contract, context) => {
  if (contract.routeLevel === 'acquired-movement-watch' && contract.gate === 'release') {
    context.addIssue({
      code: 'custom',
      path: ['gate'],
      message: 'Integrar un movimiento adquirido no libera por sí solo un reloj ni acredita fabricación.',
    })
  }
})

export type PersonalWatchDesignActivityContract = z.infer<typeof PersonalWatchDesignActivityContractSchema>

export const ValidationActivityContractSchema = z.object({
  protocolId: contentId,
  dimensions: z.array(z.enum([
    'watchmaker-review',
    'beginner-usability',
    'calibre-transfer',
    'accessibility',
    'deferred-retention',
  ])).min(1),
  participantProfileIds: z.array(contentId).min(1),
  taskIds: z.array(contentId).min(1),
  transferCaseIds: z.array(contentId).default([]),
  accessibilityCheckIds: z.array(contentId).default([]),
  retentionIntervalsDays: z.array(z.number().int().positive().max(365)).default([]),
  evidenceRequirementIds: z.array(contentId).min(1),
  acceptanceCriterionIds: z.array(contentId).min(1),
  independentAttemptRequired: z.literal(true),
  adverseFindingBlocksRelease: z.literal(true),
  humanReviewRequired: z.literal(true),
  automaticCompetenceClaim: z.literal(false),
  textualAlternative: z.literal(true),
}).strict().superRefine((contract, context) => {
  if (contract.dimensions.includes('calibre-transfer') && contract.transferCaseIds.length < 2) {
    context.addIssue({
      code: 'custom',
      path: ['transferCaseIds'],
      message: 'La transferencia entre calibres exige al menos dos casos distintos.',
    })
  }
  if (contract.dimensions.includes('accessibility') && contract.accessibilityCheckIds.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['accessibilityCheckIds'],
      message: 'Una validación de accesibilidad debe declarar comprobaciones observables.',
    })
  }
  if (contract.dimensions.includes('deferred-retention')) {
    const intervals = [...contract.retentionIntervalsDays].sort((left, right) => left - right)
    if (intervals.length < 2 || intervals.some((value, index) => index > 0 && value === intervals[index - 1])) {
      context.addIssue({
        code: 'custom',
        path: ['retentionIntervalsDays'],
        message: 'La retención diferida exige al menos dos intervalos distintos.',
      })
    }
  }
})

export type ValidationActivityContract = z.infer<typeof ValidationActivityContractSchema>

export const ExternalLearningPrerequisiteSchema = z.object({
  packageId: z.string().min(1).max(200),
  versionRange: z.string().min(1).max(80),
  moduleIds: z.array(contentId).min(1),
  competencyIds: z.array(contentId).min(1),
  recommendedButOptionalRouteIds: z.array(contentId).default([]),
}).strict()

export const TutorContextContractSchema = z.object({
  scopeConceptIds: z.array(contentId).default([]),
  allowedActions: z.array(z.enum([
    'orient',
    'ask-socratic-question',
    'explain-declared-content',
    'point-to-source',
    'suggest-remediation',
    'summarize-visible-state',
  ])).min(1),
  forbiddenClaims: z.array(LocalizedTextSchema).min(1),
  promptStarters: z.array(LocalizedShortTextSchema).min(1).max(8),
  requiresSourceForTechnicalClaims: z.literal(true),
  authority: z.literal('coach-not-assessor'),
}).strict()

export const ActivityFeedbackContractSchema = z.object({
  correctExplanation: LocalizedTextSchema,
  incorrectDiagnosis: LocalizedTextSchema,
  causalQuestion: LocalizedTextSchema,
  nextObservation: LocalizedTextSchema,
  misconceptionIds: z.array(contentId).default([]),
  transferPrompt: LocalizedTextSchema.optional(),
  requiresIndependentRetryAfterHint: z.boolean().default(true),
}).strict()

export const DeliberatePracticeContractSchema = z.object({
  focus: LocalizedTextSchema,
  workedExample: z.object({
    scenario: LocalizedTextSchema,
    steps: z.array(LocalizedTextSchema).min(3).max(8),
    conclusion: LocalizedTextSchema,
  }).strict(),
  attempts: z.array(z.object({
    phase: z.enum(['guided', 'faded', 'independent', 'transfer']),
    instruction: LocalizedTextSchema,
    evidence: LocalizedTextSchema,
  }).strict()).min(3).max(8),
  successCriteria: z.array(LocalizedShortTextSchema).min(2).max(8),
  errorSignals: z.array(LocalizedTextSchema).min(1).max(8),
  independentRetry: z.object({
    required: z.literal(true),
    afterHint: z.literal(true),
    restoreBeforeRetry: z.literal(true),
    variant: LocalizedTextSchema,
  }).strict(),
  transferPrompt: LocalizedTextSchema,
}).strict().superRefine((contract, context) => {
  const phases = new Set(contract.attempts.map(({ phase }) => phase))
  if (!phases.has('guided') || !phases.has('independent')) {
    context.addIssue({
      code: 'custom',
      path: ['attempts'],
      message: 'La práctica deliberada debe retirar la ayuda desde guided hasta independent.',
    })
  }
})

export type DeliberatePracticeContract = z.infer<typeof DeliberatePracticeContractSchema>

export const LessonStudyContractSchema = z.object({
  sequence: z.literal('theory-first'),
  minimumTheoryMinutes: z.number().int().positive().max(240),
  minimumReadingWords: z.number().int().positive().max(20_000),
  requiredSegmentRoles: z.array(z.enum([
    'orient',
    'pretrain',
    'explain',
    'worked-example',
    'observe',
    'practice',
    'close',
  ])).min(2),
  practiceUnlock: z.literal('after-required-reading'),
  labActivityIds: z.array(contentId).min(1),
  readinessCriteria: z.array(LocalizedShortTextSchema).min(3).max(12),
  sourceReviewRequired: z.boolean().default(true),
  notePrompt: LocalizedTextSchema.optional(),
}).strict().superRefine((contract, context) => {
  if (new Set(contract.requiredSegmentRoles).size !== contract.requiredSegmentRoles.length) {
    context.addIssue({
      code: 'custom',
      path: ['requiredSegmentRoles'],
      message: 'Los tipos de segmento obligatorios no pueden repetirse.',
    })
  }
})

export type LessonStudyContract = z.infer<typeof LessonStudyContractSchema>

export const LessonAuthoringMetadataSchema = z.object({
  title: LocalizedShortTextSchema,
  purpose: LocalizedTextSchema,
  objectives: z.array(LocalizedTextSchema).min(1),
  prerequisiteConceptIds: z.array(contentId).default([]),
  recommendedPrerequisiteConceptIds: z.array(contentId).default([]),
  externalPrerequisites: z.array(ExternalLearningPrerequisiteSchema).default([]),
  conceptIds: z.array(contentId).min(1),
  sourceIds: z.array(contentId).default([]),
  visualResourceIds: z.array(contentId).default([]),
  visualStrategy: LessonVisualStrategySchema.optional(),
  pedagogy: z.object({
    role: z.enum([
      'orientation',
      'pretraining',
      'conceptual-model',
      'worked-example',
      'guided-practice',
      'independent-practice',
      'transfer',
      'remediation',
    ]),
    entryCheck: z.enum(['none', 'self-check', 'ungraded-diagnostic']),
    userPacedSegments: z.literal(true),
    introducesConceptIds: z.array(contentId).default([]),
    reinforcesConceptIds: z.array(contentId).default([]),
    bridgeConceptIds: z.array(contentId).default([]),
  }).strict().optional(),
  studyContract: LessonStudyContractSchema.optional(),
  tutorContract: TutorContextContractSchema.optional(),
}).strict()

export const pedagogicalCycleValues = [
  'observe',
  'predict',
  'manipulate',
  'execute-or-simulate',
  'compare',
  'explain',
  'relate-to-real-object',
  'check-understanding',
  'record-evidence',
] as const

export const ActivityPedagogicalContractSchema = z.object({
  purpose: z.enum([
    'diagnostic',
    'worked-example',
    'guided-practice',
    'completion-problem',
    'independent-practice',
    'mastery-check',
    'transfer',
    'retention',
  ]),
  assessmentIntent: z.enum(['none', 'formative', 'demonstration', 'retention']),
  requiresConceptIds: z.array(contentId).default([]),
  introducesConceptIds: z.array(contentId).default([]),
  demonstratesConceptIds: z.array(contentId).default([]),
  practicesConceptIds: z.array(contentId).default([]),
  assessesConceptIds: z.array(contentId).default([]),
  evidenceLevel: LearningEvidenceLevelSchema,
  supportLevel: z.enum(['full', 'guided', 'faded', 'independent']),
  remediation: z.object({
    lessonId: contentId,
    blockId: contentId.optional(),
    conceptIds: z.array(contentId).min(1),
  }).strict().optional(),
  physicalBoundary: LocalizedTextSchema,
}).strict().superRefine((contract, context) => {
  const introduced = new Set(contract.introducesConceptIds)
  const assessedIntroductions = contract.assessesConceptIds.filter((id) => introduced.has(id))
  if (assessedIntroductions.length > 0 && contract.assessmentIntent !== 'none') {
    context.addIssue({
      code: 'custom',
      path: ['assessesConceptIds'],
      message: `Una actividad no puede introducir y evaluar a la vez: ${assessedIntroductions.join(', ')}.`,
    })
  }
  if (
    ['mastery-check', 'transfer', 'retention'].includes(contract.purpose)
    && contract.supportLevel !== 'independent'
  ) {
    context.addIssue({
      code: 'custom',
      path: ['supportLevel'],
      message: 'Una comprobación de dominio, transferencia o retención debe ser independiente.',
    })
  }
  if (contract.assessmentIntent === 'none' && contract.assessesConceptIds.length > 0) {
    context.addIssue({
      code: 'custom',
      path: ['assessesConceptIds'],
      message: 'Una actividad sin evaluación no puede declarar conceptos evaluados.',
    })
  }
})

export const ActivityAuthoringMetadataSchema = z.object({
  lessonId: contentId,
  title: LocalizedShortTextSchema,
  description: LocalizedTextSchema,
  difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
  durationMinutes: z.number().int().positive().max(1_440),
  activityType: z.enum(['observation-3d', 'prediction', 'guided-practice', 'comparison', 'explanation']),
  movementIds: z.array(contentId).default([]),
  familyIds: z.array(contentId).default([]),
  subsystem: z.string().min(1).max(160),
  requiredCapabilities: z.array(z.string().min(1).max(120)).default([]),
  languages: z.array(z.string().min(2).max(8)).min(1),
  offline: z.boolean(),
  fidelity: FidelityProfileSchema,
  warnings: z.object({
    es: z.array(z.string().min(1).max(1_000)).default([]),
    en: z.array(z.string().min(1).max(1_000)).default([]),
  }).strict(),
  sourceIds: z.array(contentId).default([]),
  visualResourceIds: z.array(contentId).default([]),
  fixtureBinding: EducationalFixtureBindingSchema.optional(),
  interactionContract: ActivityInteractionContractSchema.optional(),
  workbenchContract: WorkbenchActivityContractSchema.optional(),
  mechanicalLabContract: MechanicalLabActivityContractSchema.optional(),
  calibreLabContract: CalibreLabActivityContractSchema.optional(),
  comparativeArchitectureContract: ComparativeArchitectureActivityContractSchema.optional(),
  serviceProcedureContract: ServiceProcedureActivityContractSchema.optional(),
  manufacturingContract: ManufacturingActivityContractSchema.optional(),
  personalWatchDesignContract: PersonalWatchDesignActivityContractSchema.optional(),
  validationContract: ValidationActivityContractSchema.optional(),
  pedagogicalContract: ActivityPedagogicalContractSchema.optional(),
  deliberatePractice: DeliberatePracticeContractSchema.optional(),
  feedbackContract: ActivityFeedbackContractSchema.optional(),
  tutorContract: TutorContextContractSchema.optional(),
  pedagogicalPattern: z.object({
    enabled: z.boolean(),
    stages: z.array(z.enum(pedagogicalCycleValues)).min(1),
  }).strict().optional(),
}).strict()

export const SceneStoryboardSchema = z.object({
  sceneName: LocalizedShortTextSchema,
  purpose: LocalizedTextSchema,
  prerequisites: z.array(contentId).default([]),
  narrative: LocalizedMarkdownSchema,
  initialFraming: LocalizedTextSchema,
  protagonist: SelectorReferenceSchema.optional(),
  secondaryParts: z.array(SelectorReferenceSchema).default([]),
  sequence: z.array(z.object({
    id: contentId,
    sceneStepId: contentId,
    narrative: LocalizedTextSchema,
    timelineIndexes: z.array(z.number().int().nonnegative()).default([]),
    runtimeActions: z.array(z.string().min(1).max(500)).default([]),
    interaction: LocalizedTextSchema,
    feedback: LocalizedTextSchema,
    expectedError: LocalizedTextSchema.optional(),
    hint: LocalizedTextSchema.optional(),
  }).strict()).min(1),
  ending: LocalizedTextSchema,
  restoration: LocalizedTextSchema,
  accessibility: LocalizedTextSchema,
  reducedMotion: LocalizedTextSchema,
  evidenceTemplateIds: z.array(contentId).min(1),
  technicalCriteria: z.array(z.string().min(1).max(1_000)).default([]),
  limitations: z.array(z.string().min(1).max(1_000)).default([]),
}).strict()

export const VisualResourceSchema = z.object({
  id: contentId,
  version: semver,
  type: z.enum([
    'real-movement-3d',
    'conceptual-3d',
    'kinematic-animation',
    'exploded-view',
    'section-view',
    'schematic-2d',
    'energy-flow-diagram',
    'overlay-comparison',
    'visual-table',
    'original-photo',
    'original-illustration',
    'highlighted-part',
    'disassembly-sequence',
    'error-simulation',
    'virtual-instrument',
    'accessible-text-alternative',
  ]),
  purpose: LocalizedTextSchema,
  status: z.enum(['planned', 'blocked', 'ready', 'approved']),
  sourceIds: z.array(contentId).default([]),
  fidelity: FidelityProfileSchema,
  lessonIds: z.array(contentId).min(1),
  movementIds: z.array(contentId).default([]),
  partSelectors: z.array(SelectorReferenceSchema).default([]),
  requiredCapabilities: z.array(z.string().min(1).max(120)).default([]),
  dataRequirements: z.array(z.string().min(1).max(1_000)).default([]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dependencyIds: z.array(contentId).default([]),
  currentModelSupport: z.enum(['yes', 'partial', 'no']),
  viewportImpact: z.enum(['none', 'configuration', 'extension', 'new-capability']),
  assetId: contentId.optional(),
}).strict()

export const RecommendationDefinitionSchema = z.object({
  id: contentId,
  version: semver,
  kind: z.enum([
    'continue-route',
    'complete-prerequisite',
    'repeat-activity',
    'practice-competency',
    'retention',
    'review-evidence',
    'recover-session',
    'install-dependency',
  ]),
  title: LocalizedShortTextSchema,
  reason: LocalizedTextSchema,
  rule: z.string().min(1).max(500),
  priority: z.number().int().min(0).max(1_000),
  target: z.object({
    kind: z.enum(['route', 'activity', 'competency', 'evidence', 'session', 'package']),
    id: contentId,
  }).strict(),
  evidenceTemplateIds: z.array(contentId).default([]),
  required: z.boolean(),
}).strict()

export const ContentLocalizationSchema = z.object({
  title: LocalizedShortTextSchema,
  bodyMarkdown: LocalizedMarkdownSchema.optional(),
}).strict()

export const CompetencyAuthoringMetadataSchema = z.object({
  title: LocalizedShortTextSchema,
  description: LocalizedTextSchema,
  movementIds: z.array(contentId).default([]),
  subsystem: z.string().min(1).max(160),
  skillType: z.enum(['knowledge', 'observation', 'procedure', 'reasoning', 'measurement', 'diagnosis']),
  sourceIds: z.array(contentId).default([]),
}).strict()

export const GlossaryAuthoringMetadataSchema = z.object({
  terms: z.object({
    es: z.string().min(1).max(160),
    en: z.string().min(1).max(160),
  }).strict(),
  synonyms: z.object({
    es: z.array(z.string().min(1).max(160)).default([]),
    en: z.array(z.string().min(1).max(160)).default([]),
  }).strict(),
  discouragedTerms: z.array(z.string().min(1).max(160)).default([]),
  simpleDefinition: LocalizedTextSchema.optional(),
  technicalDefinition: LocalizedTextSchema.optional(),
  context: LocalizedTextSchema,
  sourceIds: z.array(contentId).default([]),
}).strict()

export const selectorForAuthoringExamples = SemanticSelectorSchema

export type CurriculumDefinition = z.infer<typeof CurriculumDefinitionSchema>
export type LearningPathDefinition = z.infer<typeof LearningPathDefinitionSchema>
export type LearningPathDesign = z.infer<typeof LearningPathDesignSchema>
export type LearningMilestone = z.infer<typeof LearningMilestoneSchema>
export type LearningModuleDefinition = z.infer<typeof LearningModuleDefinitionSchema>
export type KnowledgeConcept = z.infer<typeof KnowledgeConceptSchema>
export type MisconceptionDefinition = z.infer<typeof MisconceptionDefinitionSchema>
export type KnowledgeType = z.infer<typeof KnowledgeTypeSchema>
export type LearningEvidenceLevel = z.infer<typeof LearningEvidenceLevelSchema>
export type EducationalFixtureBinding = z.infer<typeof EducationalFixtureBindingSchema>
export type GraduatedHint = z.infer<typeof GraduatedHintSchema>
export type ActivityInteractionContract = z.infer<typeof ActivityInteractionContractSchema>
export type ActivityPedagogicalContract = z.infer<typeof ActivityPedagogicalContractSchema>
export type ActivityFeedbackContract = z.infer<typeof ActivityFeedbackContractSchema>
export type TutorContextContract = z.infer<typeof TutorContextContractSchema>
export type VisualResource = z.infer<typeof VisualResourceSchema>
export type RecommendationDefinition = z.infer<typeof RecommendationDefinitionSchema>
