import { z } from 'zod'
import { AssessmentRuleVersionSchema, CompetencyDefinitionSchema, EvidenceKindSchema } from '../assessment'
import {
  CompositeAssessmentRuleSchema,
} from '../persistence/assessmentEngine'
import {
  EvidenceExtractionRuleSchema,
} from '../persistence/evidenceEngine'
import { EvidenceClaimSchema } from '../fidelity'
import { EducationalSceneSchema } from '../scenes'
import { SourceCitationSchema } from '../sources'
import {
  ActivityAuthoringMetadataSchema,
  CompetencyAuthoringMetadataSchema,
  ContentLocalizationSchema,
  CurriculumDefinitionSchema,
  GlossaryAuthoringMetadataSchema,
  KnowledgeConceptSchema,
  LearningModuleDefinitionSchema,
  LearningPathDefinitionSchema,
  LessonAuthoringMetadataSchema,
  MisconceptionDefinitionSchema,
  RecommendationDefinitionSchema,
  VisualResourceSchema,
} from './authoring'

const semver = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/)
const contentId = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,159}$/)
const entryRef = z.object({ id: contentId, path: z.string().min(1).max(240) }).strict()

export const LearningPackManifestSchema = z.object({
  format: z.literal('wplab-learning-pack'),
  formatVersion: z.literal(1),
  schemaId: z.literal('learning-pack-v1').default('learning-pack-v1'),
  packageVersion: semver,
  id: contentId,
  title: z.string().min(1).max(240),
  distribution: z.enum(['integrated', 'local-unsigned']),
  editorialStatus: z.enum(['draft', 'in-review', 'approved', 'published-local', 'retired']).default('draft'),
  authors: z.array(z.object({ name: z.string().min(1).max(160), url: z.string().url().optional() }).strict()).min(1),
  languages: z.array(z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)).min(1),
  dependencies: z.array(z.object({ packageId: contentId, versionRange: z.string().min(1).max(80) }).strict()).default([]),
  requiredCapabilities: z.array(z.string().min(1).max(120)).default([]),
  movements: z.array(z.object({ manufacturer: z.string().min(1), calibre: z.string().min(1), referenceId: z.string().optional() }).strict()).default([]),
  assets: z.array(z.object({
    id: contentId,
    path: z.string().min(1).max(240),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    bytes: z.number().int().nonnegative(),
    mediaType: z.string().min(1).max(120),
    required: z.boolean().default(true),
    provenance: SourceCitationSchema,
  }).strict()).default([]),
  entries: z.object({
    curricula: z.array(entryRef).default([]),
    routes: z.array(entryRef).default([]),
    modules: z.array(entryRef).default([]),
    concepts: z.array(entryRef).default([]),
    misconceptions: z.array(entryRef).default([]),
    blocks: z.array(entryRef).default([]),
    lessons: z.array(entryRef).default([]),
    activities: z.array(entryRef).default([]),
    scenes: z.array(entryRef).default([]),
    competencies: z.array(entryRef).default([]),
    evidenceTemplates: z.array(entryRef).default([]),
    rubrics: z.array(entryRef).default([]),
    glossary: z.array(entryRef).default([]),
    sources: z.array(entryRef).default([]),
    recommendations: z.array(entryRef).default([]),
    visualResources: z.array(entryRef).default([]),
  }).strict(),
  minimumAppVersion: semver,
  maximumAppVersion: semver.optional(),
  createdAt: z.string().min(10),
}).strict()
export type LearningPackManifest = z.infer<typeof LearningPackManifestSchema>

export const ContentBlockSchema = z.object({
  id: contentId,
  version: semver,
  kind: z.enum(['concept', 'procedure', 'warning', 'explanation', 'exercise']),
  title: z.string().min(1).max(240),
  bodyMarkdown: z.string().min(1).max(50_000),
  claims: z.array(EvidenceClaimSchema).default([]),
  localization: ContentLocalizationSchema.optional(),
  pedagogy: z.object({
    role: z.enum([
      'activate-prior-knowledge',
      'pretrain',
      'explain',
      'worked-example',
      'guided-observation',
      'summary',
      'remediation',
    ]),
    conceptIds: z.array(contentId).min(1),
    estimatedMinutes: z.number().int().positive().max(120),
    userPaced: z.literal(true),
  }).strict().optional(),
}).strict()

export const LessonSchema = z.object({
  id: contentId,
  version: semver,
  title: z.string().min(1).max(240),
  blockIds: z.array(contentId).min(1),
  activityIds: z.array(contentId).default([]),
  authoring: LessonAuthoringMetadataSchema.optional(),
}).strict()

export const ActivitySchema = z.object({
  id: contentId,
  version: semver,
  title: z.string().min(1).max(240),
  sceneIds: z.array(contentId).min(1),
  competencyIds: z.array(contentId).min(1),
  evidenceTemplateIds: z.array(contentId).min(1),
  rubricId: contentId,
  projectReference: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('project-readonly'), projectId: z.string().min(1), expectedFingerprint: z.string().min(1) }).strict(),
    z.object({ kind: z.literal('template-readonly'), templateId: z.string().min(1) }).strict(),
    z.object({ kind: z.literal('fixture-readonly'), fixtureId: contentId }).strict(),
    z.object({
      kind: z.literal('fixture-composition-readonly'),
      compositionId: contentId,
      fixtureIds: z.array(contentId).min(2).max(8),
    }).strict(),
  ]),
  authoring: ActivityAuthoringMetadataSchema.optional(),
}).strict()

export const EvidenceTemplateSchema = z.object({
  id: contentId,
  version: semver,
  competencyId: contentId,
  kind: EvidenceKindSchema,
  scoringMethod: z.enum(['binary', 'ratio', 'rubric']),
  extraction: EvidenceExtractionRuleSchema.optional(),
}).strict()

export const RubricSchema = z.object({
  id: contentId,
  version: semver,
  competencyId: contentId,
  rules: z.array(AssessmentRuleVersionSchema).min(1),
  assessmentRule: CompositeAssessmentRuleSchema.optional(),
}).strict()

export const GlossaryEntrySchema = z.object({
  id: contentId,
  version: semver,
  term: z.string().min(1).max(160),
  definitionMarkdown: z.string().min(1).max(10_000),
  language: z.string().min(2).max(8),
  authoring: GlossaryAuthoringMetadataSchema.optional(),
}).strict()

export const LearningCompetencySchema = CompetencyDefinitionSchema.extend({
  authoring: CompetencyAuthoringMetadataSchema.optional(),
}).strict()

export const LearningPackSchema = z.object({
  manifest: LearningPackManifestSchema,
  curricula: z.array(CurriculumDefinitionSchema).default([]),
  routes: z.array(LearningPathDefinitionSchema).default([]),
  modules: z.array(LearningModuleDefinitionSchema).default([]),
  concepts: z.array(KnowledgeConceptSchema).default([]),
  misconceptions: z.array(MisconceptionDefinitionSchema).default([]),
  blocks: z.array(ContentBlockSchema),
  lessons: z.array(LessonSchema),
  activities: z.array(ActivitySchema),
  scenes: z.array(EducationalSceneSchema),
  competencies: z.array(LearningCompetencySchema),
  evidenceTemplates: z.array(EvidenceTemplateSchema),
  rubrics: z.array(RubricSchema),
  glossary: z.array(GlossaryEntrySchema),
  sources: z.array(SourceCitationSchema).default([]),
  recommendations: z.array(RecommendationDefinitionSchema).default([]),
  visualResources: z.array(VisualResourceSchema).default([]),
}).strict()
export type LearningPack = z.infer<typeof LearningPackSchema>

export interface LearningPackValidationError {
  code: 'schema' | 'unsafe-path' | 'unsafe-markdown' | 'size-limit' | 'depth-limit' | 'duplicate-id' | 'missing-reference' | 'manifest-mismatch'
  path: string
  message: string
}

export type LearningPackValidationResult =
  | { success: true; pack: LearningPack }
  | { success: false; errors: LearningPackValidationError[] }

export interface LearningPackLimits {
  maximumJsonBytes: number
  maximumDepth: number
}

export const DEFAULT_LEARNING_PACK_LIMITS: LearningPackLimits = {
  // Los paquetes enciclopédicos mantienen cada afirmación y referencia de
  // procedencia en el documento validado. El límite sigue siendo finito, pero
  // permite el corpus clásico completo sin obligarlo a perder granularidad.
  maximumJsonBytes: 32 * 1024 * 1024,
  maximumDepth: 32,
}

export function isSafePackPath(path: string): boolean {
  if (path.length === 0 || path.length > 240 || path.includes('\\') || path.includes('\0')) return false
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path) || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(path)) return false
  const segments = path.split('/')
  return segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

export function isRestrictedMarkdown(markdown: string): boolean {
  return !/<\/?[a-zA-Z!][^>]*>/.test(markdown) && !/javascript\s*:/i.test(markdown)
}

function objectDepth(value: unknown, depth = 0): number {
  if (value === null || typeof value !== 'object') return depth
  const children = Array.isArray(value) ? value : Object.values(value)
  return children.reduce((maximum, child) => Math.max(maximum, objectDepth(child, depth + 1)), depth)
}

function allEntryRefs(manifest: LearningPackManifest) {
  return Object.values(manifest.entries).flat()
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

export function validateLearningPack(
  input: unknown,
  limits: LearningPackLimits = DEFAULT_LEARNING_PACK_LIMITS,
): LearningPackValidationResult {
  const errors: LearningPackValidationError[] = []
  const jsonBytes = new TextEncoder().encode(JSON.stringify(input)).byteLength
  if (jsonBytes > limits.maximumJsonBytes) errors.push({ code: 'size-limit', path: '', message: `El JSON supera ${limits.maximumJsonBytes} bytes.` })
  if (objectDepth(input) > limits.maximumDepth) errors.push({ code: 'depth-limit', path: '', message: `El JSON supera ${limits.maximumDepth} niveles.` })
  const parsed = LearningPackSchema.safeParse(input)
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((issue) => ({ code: 'schema' as const, path: issue.path.join('.'), message: issue.message })))
    return { success: false, errors }
  }
  const pack = parsed.data
  const refs = allEntryRefs(pack.manifest)
  for (const path of [...refs.map(({ path }) => path), ...pack.manifest.assets.map(({ path }) => path)]) {
    if (!isSafePackPath(path)) errors.push({ code: 'unsafe-path', path, message: `Ruta no segura: ${path}` })
  }
  const markdownValues = [
    ...pack.blocks.map(({ id, bodyMarkdown }) => ({ id, value: bodyMarkdown })),
    ...pack.blocks.flatMap(({ id, localization }) => localization?.bodyMarkdown
      ? [
          { id: `${id}:es`, value: localization.bodyMarkdown.es },
          { id: `${id}:en`, value: localization.bodyMarkdown.en },
        ]
      : []),
    ...pack.scenes.flatMap(({ id, overlays, steps }) => [
      ...overlays.filter((overlay) => overlay.kind === 'text').map((overlay) => ({ id, value: overlay.markdown })),
      ...steps.map((step) => ({ id: `${id}:${step.id}`, value: step.instructionMarkdown })),
    ]),
    ...pack.glossary.map(({ id, definitionMarkdown }) => ({ id, value: definitionMarkdown })),
  ]
  for (const markdown of markdownValues) {
    if (!isRestrictedMarkdown(markdown.value)) errors.push({ code: 'unsafe-markdown', path: markdown.id, message: 'Markdown contiene HTML o JavaScript no permitido.' })
  }

  const collections = {
    curricula: pack.curricula,
    routes: pack.routes,
    modules: pack.modules,
    concepts: pack.concepts,
    misconceptions: pack.misconceptions,
    blocks: pack.blocks,
    lessons: pack.lessons,
    activities: pack.activities,
    scenes: pack.scenes,
    competencies: pack.competencies,
    evidenceTemplates: pack.evidenceTemplates,
    rubrics: pack.rubrics,
    glossary: pack.glossary,
    sources: pack.sources,
    recommendations: pack.recommendations,
    visualResources: pack.visualResources,
  }
  const allIds = Object.values(collections).flat().map(({ id }) => id)
  for (const id of duplicateValues(allIds)) errors.push({ code: 'duplicate-id', path: id, message: `ID de contenido duplicado: ${id}` })
  for (const [kind, entries] of Object.entries(collections)) {
    const expected = new Set(entries.map(({ id }) => id))
    const declared = new Set(pack.manifest.entries[kind as keyof typeof pack.manifest.entries].map(({ id }) => id))
    if (expected.size !== declared.size || [...expected].some((id) => !declared.has(id))) {
      errors.push({ code: 'manifest-mismatch', path: `manifest.entries.${kind}`, message: `El manifiesto no coincide con ${kind}.` })
    }
  }
  const ids = new Set(allIds)
  const assetIds = new Set(pack.manifest.assets.map(({ id }) => id))
  const requireId = (owner: string, reference: string) => {
    if (!ids.has(reference)) errors.push({ code: 'missing-reference', path: owner, message: `Referencia ausente: ${reference}` })
  }
  for (const curriculum of pack.curricula) curriculum.routeIds.forEach((id) => requireId(curriculum.id, id))
  for (const route of pack.routes) {
    route.prerequisiteConceptIds.forEach((id) => requireId(route.id, id))
    route.moduleIds.forEach((id) => requireId(route.id, id))
    route.competencyIds.forEach((id) => requireId(route.id, id))
    route.sourceIds.forEach((id) => requireId(route.id, id))
    route.visualResourceIds.forEach((id) => requireId(route.id, id))
    route.learningDesign?.milestones.forEach((milestone) => {
      requireId(route.id, milestone.lessonId)
      if (milestone.activityId) requireId(route.id, milestone.activityId)
      milestone.transferTargetIds.forEach((id) => requireId(route.id, id))
    })
    route.learningDesign?.diagnosticActivityIds.forEach((id) => requireId(route.id, id))
    route.learningDesign?.demonstrationActivityIds.forEach((id) => requireId(route.id, id))
  }
  for (const module of pack.modules) module.lessonIds.forEach((id) => requireId(module.id, id))
  for (const concept of pack.concepts) {
    concept.prerequisiteIds.forEach((id) => requireId(concept.id, id))
    concept.recommendedPrerequisiteIds.forEach((id) => requireId(concept.id, id))
    concept.relatedIds.forEach((id) => requireId(concept.id, id))
    concept.competencyIds.forEach((id) => requireId(concept.id, id))
    concept.routeIds.forEach((id) => requireId(concept.id, id))
    concept.activityIds.forEach((id) => requireId(concept.id, id))
    concept.sourceIds.forEach((id) => requireId(concept.id, id))
    concept.misconceptionIds.forEach((id) => requireId(concept.id, id))
    concept.transferTargetIds.forEach((id) => requireId(concept.id, id))
    if (concept.bridgeLessonId) requireId(concept.id, concept.bridgeLessonId)
  }
  for (const misconception of pack.misconceptions) {
    misconception.conceptIds.forEach((id) => requireId(misconception.id, id))
    misconception.sourceIds.forEach((id) => requireId(misconception.id, id))
    requireId(misconception.id, misconception.remediationLessonId)
  }
  for (const lesson of pack.lessons) {
    lesson.blockIds.forEach((id) => requireId(lesson.id, id))
    lesson.activityIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.prerequisiteConceptIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.conceptIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.sourceIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.visualResourceIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.visualStrategy?.requiredVisualResourceIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.studyContract?.labActivityIds.forEach((id) => requireId(lesson.id, id))
    lesson.authoring?.tutorContract?.scopeConceptIds.forEach((id) => requireId(lesson.id, id))
  }
  for (const activity of pack.activities) {
    activity.sceneIds.forEach((id) => requireId(activity.id, id))
    activity.competencyIds.forEach((id) => requireId(activity.id, id))
    activity.evidenceTemplateIds.forEach((id) => requireId(activity.id, id))
    requireId(activity.id, activity.rubricId)
    if (activity.authoring) {
      requireId(activity.id, activity.authoring.lessonId)
      activity.authoring.sourceIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.visualResourceIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.pedagogicalContract?.requiresConceptIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.pedagogicalContract?.introducesConceptIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.pedagogicalContract?.demonstratesConceptIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.pedagogicalContract?.practicesConceptIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.pedagogicalContract?.assessesConceptIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.feedbackContract?.misconceptionIds.forEach((id) => requireId(activity.id, id))
      activity.authoring.tutorContract?.scopeConceptIds.forEach((id) => requireId(activity.id, id))
    }
  }
  for (const scene of pack.scenes) {
    scene.storyboard?.prerequisites.forEach((id) => requireId(scene.id, id))
    scene.storyboard?.evidenceTemplateIds.forEach((id) => requireId(scene.id, id))
  }
  for (const template of pack.evidenceTemplates) {
    requireId(template.id, template.competencyId)
    if (template.extraction) requireId(template.id, template.extraction.competencyId)
  }
  for (const rubric of pack.rubrics) {
    requireId(rubric.id, rubric.competencyId)
    if (rubric.assessmentRule) requireId(rubric.id, rubric.assessmentRule.competencyId)
  }
  for (const competency of pack.competencies) {
    competency.prerequisites.forEach((id) => requireId(competency.id, id))
    competency.authoring?.sourceIds.forEach((id) => requireId(competency.id, id))
  }
  for (const term of pack.glossary) term.authoring?.sourceIds.forEach((id) => requireId(term.id, id))
  for (const source of pack.sources) if (source.originalSourceId) requireId(source.id, source.originalSourceId)
  for (const recommendation of pack.recommendations) {
    requireId(recommendation.id, recommendation.target.id)
    recommendation.evidenceTemplateIds.forEach((id) => requireId(recommendation.id, id))
  }
  for (const resource of pack.visualResources) {
    resource.lessonIds.forEach((id) => requireId(resource.id, id))
    resource.sourceIds.forEach((id) => requireId(resource.id, id))
    resource.dependencyIds.forEach((id) => requireId(resource.id, id))
    if (resource.assetId && !assetIds.has(resource.assetId)) {
      errors.push({ code: 'missing-reference', path: resource.id, message: `Activo ausente: ${resource.assetId}` })
    }
  }
  return errors.length > 0 ? { success: false, errors } : { success: true, pack }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const digest = await crypto.subtle.digest('SHA-256', source)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
