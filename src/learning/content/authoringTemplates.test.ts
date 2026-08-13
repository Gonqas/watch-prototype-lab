import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'
import {
  CurriculumDefinitionSchema,
  KnowledgeConceptSchema,
  LearningModuleDefinitionSchema,
  LearningPathDefinitionSchema,
  RecommendationDefinitionSchema,
  SceneStoryboardSchema,
  VisualResourceSchema,
} from './authoring'
import {
  ActivitySchema,
  ContentBlockSchema,
  EvidenceTemplateSchema,
  GlossaryEntrySchema,
  LearningCompetencySchema,
  LearningPackManifestSchema,
  LessonSchema,
  RubricSchema,
} from './learningPack'
import { EvidenceClaimSchema } from '../fidelity'
import { EducationalSceneSchema, SceneQuestionSchema, SceneStepSchema } from '../scenes'
import { SourceCitationSchema } from '../sources'

const rawTemplates = import.meta.glob('../../../learning-content/templates/minimal/*.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const schemas: Record<string, ZodType> = {
  'activity.json': ActivitySchema,
  'competency.json': LearningCompetencySchema,
  'concept.json': KnowledgeConceptSchema,
  'curriculum.json': CurriculumDefinitionSchema,
  'evidence-rule.json': EvidenceTemplateSchema,
  'exercise.json': ContentBlockSchema,
  'learning-path.json': LearningPathDefinitionSchema,
  'lesson.json': LessonSchema,
  'module.json': LearningModuleDefinitionSchema,
  'package-manifest.json': LearningPackManifestSchema,
  'question.json': SceneQuestionSchema,
  'recommendation.json': RecommendationDefinitionSchema,
  'rubric.json': RubricSchema,
  'scene-step.json': SceneStepSchema,
  'scene.json': EducationalSceneSchema,
  'source-reference.json': SourceCitationSchema,
  'storyboard.json': SceneStoryboardSchema,
  'technical-claim.json': EvidenceClaimSchema,
  'terminology-entry.json': GlossaryEntrySchema,
  'visual-resource.json': VisualResourceSchema,
}

describe('plantillas mínimas de autoría', () => {
  it('mantiene una plantilla exacta y válida para cada contrato documentado', () => {
    const seen = new Set<string>()
    for (const [path, raw] of Object.entries(rawTemplates)) {
      const name = path.split('/').at(-1)!
      const schema = schemas[name]
      expect(schema, `Falta schema de prueba para ${name}`).toBeDefined()
      const parsed = schema.safeParse(JSON.parse(raw) as unknown)
      expect(parsed.success, `${name}: ${parsed.success ? '' : parsed.error.message}`).toBe(true)
      seen.add(name)
    }
    expect([...seen].sort()).toEqual(Object.keys(schemas).sort())
  })
})
