import { z } from 'zod'
import {
  EducationalFixtureBindingSchema,
  GraduatedHintSchema,
  LocalizedTextSchema,
  SceneStoryboardSchema,
} from './content/authoring'
import { FidelityProfileSchema } from './fidelity'
import { SemanticSelectorSchema, SelectorReferenceSchema } from './runtime/selectors'

export const EntitySelectorSchema = SemanticSelectorSchema
export const SceneSelectorSchema = z.union([SemanticSelectorSchema, SelectorReferenceSchema])

const vec3 = z.tuple([z.number(), z.number(), z.number()])
const selectorList = z.array(SceneSelectorSchema).max(100)

export const SceneQuestionSchema = z.object({
  id: z.string().min(1).max(160),
  promptMarkdown: z.string().min(1).max(10_000),
  responseKind: z.enum([
    'single-choice',
    'multiple-choice',
    'entity-selection',
    'short-text',
    'ordered-list',
    'structured-response',
  ]),
  options: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    labels: z.object({ es: z.string().min(1), en: z.string().min(1) }).strict().optional(),
  }).strict()).max(40).optional(),
  structuredFields: z.array(z.object({
    id: z.string().min(1).max(160),
    label: z.string().min(1).max(500),
    kind: z.enum(['choice', 'entity', 'short-text', 'confidence']),
    required: z.boolean().default(true),
    optionIds: z.array(z.string().min(1)).default([]),
  }).strict()).max(20).optional(),
  hints: z.array(GraduatedHintSchema).max(6).optional(),
  humanReviewRequired: z.boolean().optional(),
  authoring: z.object({
    prompt: LocalizedTextSchema,
    feedback: LocalizedTextSchema.optional(),
  }).strict().optional(),
}).strict().superRefine((question, context) => {
  if (question.responseKind === 'ordered-list' && (question.options?.length ?? 0) < 2) {
    context.addIssue({ code: 'custom', path: ['options'], message: 'Una ordenación necesita al menos dos elementos.' })
  }
  if (question.responseKind === 'structured-response' && (question.structuredFields?.length ?? 0) === 0) {
    context.addIssue({ code: 'custom', path: ['structuredFields'], message: 'Una respuesta estructurada necesita campos declarados.' })
  }
  if (question.responseKind !== 'structured-response' && (question.structuredFields?.length ?? 0) > 0) {
    context.addIssue({ code: 'custom', path: ['structuredFields'], message: 'Los campos estructurados solo pertenecen a structured-response.' })
  }
})

export const SceneCapabilityRequirementSchema = z.union([
  z.string().min(1).max(120),
  z.object({
    id: z.string().min(1).max(120),
    versionRange: z.string().min(1).max(80).default('*'),
    optional: z.boolean().default(false),
    allowLimited: z.boolean().default(false),
  }).strict(),
])

export const SceneStepSchema = z.object({
  id: z.string().min(1),
  instructionMarkdown: z.string().min(1).max(10_000),
  questions: z.array(SceneQuestionSchema).default([]),
  success: z.array(z.discriminatedUnion('condition', [
    z.object({ condition: z.literal('selected'), target: SceneSelectorSchema }).strict(),
    z.object({ condition: z.literal('answer'), questionId: z.string().min(1), expectedOptionIds: z.array(z.string().min(1)).min(1) }).strict(),
    z.object({
      condition: z.literal('structured-answer'),
      questionId: z.string().min(1),
      requiredFieldIds: z.array(z.string().min(1)).min(1),
      pendingHumanReview: z.boolean().default(false),
    }).strict(),
    z.object({ condition: z.literal('step-confirmed') }).strict(),
  ])).default([]),
}).strict()

export const EducationalSpatialAnchorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('point'), point: vec3 }).strict(),
  z.object({
    kind: z.literal('entity'),
    target: SceneSelectorSchema,
    offset: vec3.default([0, 0, 0]),
  }).strict(),
  z.object({
    kind: z.literal('interface'),
    interfaceId: z.string().min(1).max(240),
    participant: z.enum(['source', 'target', 'midpoint']).default('midpoint'),
  }).strict(),
])

const overlayState = z.enum(['hidden', 'available', 'active', 'dimmed', 'blocked', 'incomplete', 'unknown'])

export const EducationalSceneOverlaySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('arrow'),
    id: z.string().min(1),
    target: SceneSelectorSchema.optional(),
    start: EducationalSpatialAnchorSchema.optional(),
    end: EducationalSpatialAnchorSchema.optional(),
    label: z.string().optional(),
    state: overlayState.optional(),
    pattern: z.enum(['solid', 'dashed', 'dotted', 'double']).optional(),
    accessibleLabel: z.string().min(1),
  }).strict().superRefine((arrow, context) => {
    if (!arrow.target && (!arrow.start || !arrow.end)) {
      context.addIssue({ code: 'custom', path: ['start'], message: 'Una flecha necesita target o dos anclajes espaciales.' })
    }
  }),
  z.object({
    kind: z.literal('rotation'),
    id: z.string().min(1),
    target: SceneSelectorSchema,
    axis: vec3,
    direction: z.enum(['clockwise', 'counter-clockwise', 'alternating', 'unknown']),
    conceptualSpeed: z.enum(['stopped', 'slow', 'medium', 'fast', 'unknown']).default('unknown'),
    state: overlayState.optional(),
    label: z.string().optional(),
    accessibleLabel: z.string().min(1),
  }).strict(),
  z.object({
    kind: z.literal('energy-path'),
    id: z.string().min(1),
    targets: z.array(SceneSelectorSchema).min(2).max(40),
    state: overlayState.optional(),
    activeSegment: z.number().int().nonnegative().optional(),
    comparisonGroup: z.string().min(1).max(160).optional(),
    label: z.string().optional(),
    fidelity: FidelityProfileSchema,
    accessibleLabel: z.string().min(1),
    numberedAlternative: z.array(z.string().min(1).max(1_000)).min(2),
  }).strict(),
  z.object({
    kind: z.literal('label'),
    id: z.string().min(1),
    target: SceneSelectorSchema,
    text: z.string().min(1),
    state: overlayState.optional(),
    accessibleLabel: z.string().min(1).optional(),
  }).strict(),
  z.object({
    kind: z.literal('highlight'),
    id: z.string().min(1),
    target: SceneSelectorSchema,
    color: z.string().min(1),
    pattern: z.string().min(1).optional(),
    state: overlayState.optional(),
    accessibleLabel: z.string().min(1).optional(),
  }).strict(),
  z.object({
    kind: z.literal('text'),
    id: z.string().min(1),
    markdown: z.string().min(1).max(10_000),
    state: overlayState.optional(),
    accessibleLabel: z.string().min(1).optional(),
  }).strict(),
])

export const EducationalSceneSchema = z.object({
  id: z.string().min(1).max(160),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(4000).optional(),
  fixtureBinding: EducationalFixtureBindingSchema.optional(),
  accessibility: z.object({
    textualAlternative: z.string().min(1).max(30_000),
    reducedMotionAlternative: z.string().min(1).max(10_000),
    keyboardActions: z.array(z.string().min(1).max(500)).default([]),
    colorIndependentCues: z.array(z.string().min(1).max(500)).default([]),
  }).strict().optional(),
  cameraIntent: z.object({
    intent: z.enum(['overview', 'dial', 'bridges', 'side', 'axial', 'close-up', 'comparison', 'split']),
    target: SceneSelectorSchema.optional(),
    bookmarkId: z.string().min(1).max(160).optional(),
    transition: z.enum(['smooth', 'instant', 'reduced-motion']).default('smooth'),
  }).strict().optional(),
  requiredCapabilities: z.array(SceneCapabilityRequirementSchema).default([]),
  camera: z.object({
    position: vec3,
    target: vec3,
    projection: z.enum(['perspective', 'orthographic']),
    fieldOfView: z.number().positive().max(179).optional(),
  }).strict().optional(),
  state: z.object({
    selected: selectorList.default([]),
    visible: selectorList.default([]),
    hidden: selectorList.default([]),
    isolated: selectorList.default([]),
    transparent: z.array(z.object({ target: SceneSelectorSchema, opacity: z.number().min(0).max(1) }).strict()).default([]),
    highlighted: selectorList.default([]),
    explode: z.number().min(0).max(1).default(0),
    section: z.object({ enabled: z.boolean(), normal: vec3, offset: z.number() }).strict().optional(),
    speed: z.number().positive().max(20).default(1),
  }).strict(),
  timeline: z.array(z.object({
    atMs: z.number().int().nonnegative(),
    operation: z.enum(['show', 'hide', 'select', 'isolate', 'explode', 'rotate', 'translate', 'annotate', 'highlight', 'transparency', 'camera', 'section', 'overlay']),
    targets: selectorList.default([]),
    value: z.union([
      z.number(),
      z.string(),
      vec3,
      z.object({ position: vec3, target: vec3, projection: z.enum(['perspective', 'orthographic']), fieldOfView: z.number().positive().max(179).optional() }).strict(),
      z.object({ enabled: z.boolean(), normal: vec3, offset: z.number() }).strict(),
    ]).optional(),
    durationMs: z.number().int().nonnegative().optional(),
    essential: z.boolean().default(false),
    waitFor: z.enum(['none', 'interaction', 'condition']).default('none'),
  }).strict()).max(500).default([]),
  overlays: z.array(EducationalSceneOverlaySchema).max(100).default([]),
  steps: z.array(SceneStepSchema).max(100).default([]),
  storyboard: SceneStoryboardSchema.optional(),
  restorePreviousState: z.boolean().default(true),
}).strict()

export type EducationalScene = z.infer<typeof EducationalSceneSchema>
