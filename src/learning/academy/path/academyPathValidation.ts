import type { LearningProductIndex } from '../../product/demoPackage'
import {
  ACADEMY_LEARNER_PATH,
  ACADEMY_STAGE_5_PLANNED_REFS,
  type AcademyLearnerPathDefinition,
} from './academyLearnerPath'

export interface AcademyPathValidationIssue {
  code: string
  entityId: string
  message: string
}

function cycles(
  ids: string[],
  dependencies: (id: string) => string[],
  code: string,
): AcademyPathValidationIssue[] {
  const issues: AcademyPathValidationIssue[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visiting.has(id)) {
      issues.push({ code, entityId: id, message: `Ciclo detectado en ${id}.` })
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    dependencies(id).forEach(visit)
    visiting.delete(id)
    visited.add(id)
  }
  ids.forEach(visit)
  return issues
}

export function validateAcademyLearnerPath(
  product: LearningProductIndex,
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyPathValidationIssue[] {
  const issues: AcademyPathValidationIssue[] = []
  const stageIds = new Set(path.stages.map(({ stageId }) => stageId))
  const chapterIds = new Set(path.chapters.map(({ chapterId }) => chapterId))
  const lessonIds = new Set(product.lessons.map(({ id }) => id))
  const activityIds = new Set(product.activities.map(({ id }) => id))
  const routeIds = new Set(product.routes.map(({ id }) => id))
  if (path.stages.length !== 8) issues.push({ code: 'stage-count', entityId: path.pathId, message: `Se esperaban 8 etapas y hay ${path.stages.length}.` })
  if (path.stageIds.join('|') !== path.stages.map(({ stageId }) => stageId).join('|')) {
    issues.push({ code: 'stage-order', entityId: path.pathId, message: 'stageIds no coincide con el orden de stages.' })
  }
  for (const stage of path.stages) {
    if (stage.chapterIds.length < 2 || stage.chapterIds.length > 6) issues.push({ code: 'chapter-count', entityId: stage.stageId, message: 'Cada etapa debe contener entre 2 y 6 capítulos.' })
    for (const chapterId of stage.chapterIds) {
      const chapter = path.chapters.find((item) => item.chapterId === chapterId)
      if (!chapter) issues.push({ code: 'missing-chapter', entityId: chapterId, message: 'El capítulo declarado no existe.' })
      else if (chapter.stageId !== stage.stageId) issues.push({ code: 'orphan-chapter', entityId: chapterId, message: 'El capítulo pertenece a otra etapa.' })
    }
    for (const prerequisiteId of stage.prerequisiteStageIds) if (!stageIds.has(prerequisiteId)) {
      issues.push({ code: 'missing-stage-prerequisite', entityId: stage.stageId, message: `No existe ${prerequisiteId}.` })
    }
  }
  const seenAnchors = new Set<string>()
  const seenStepIds = new Set<string>()
  const seenRequiredActivities = new Map<string, string>()
  for (const chapter of path.chapters) {
    if (!stageIds.has(chapter.stageId)) issues.push({ code: 'orphan-chapter', entityId: chapter.chapterId, message: 'La etapa del capítulo no existe.' })
    if (chapter.anchorLessonIds.length < 1 || chapter.anchorLessonIds.length > 5) issues.push({ code: 'anchor-count', entityId: chapter.chapterId, message: 'Cada capítulo debe tener entre 1 y 5 anchors.' })
    if (chapter.anchorLessonIds.join('|') !== chapter.anchorReviews.map(({ lessonId }) => lessonId).join('|')) {
      issues.push({ code: 'anchor-review-mismatch', entityId: chapter.chapterId, message: 'Los anchors no coinciden con sus revisiones curadas.' })
    }
    if (chapter.anchorLessonIds.join('|') !== chapter.steps.map(({ lessonId }) => lessonId).join('|')) {
      issues.push({ code: 'step-anchor-mismatch', entityId: chapter.chapterId, message: 'Los campos legacy de anchors no se derivan de steps.' })
    }
    if (chapter.requiredActivityIds.join('|') !== chapter.steps.flatMap(({ requiredActivityIds }) => requiredActivityIds).join('|')) {
      issues.push({ code: 'step-activity-mismatch', entityId: chapter.chapterId, message: 'Los campos legacy de prácticas no se derivan de steps.' })
    }
    for (const step of chapter.steps) {
      if (seenStepIds.has(step.stepId)) issues.push({ code: 'duplicate-step', entityId: step.stepId, message: 'El stepId no es único.' })
      seenStepIds.add(step.stepId)
      if (step.chapterId !== chapter.chapterId) issues.push({ code: 'step-chapter-mismatch', entityId: step.stepId, message: 'El paso declara otro capítulo.' })
      if (!lessonIds.has(step.lessonId)) issues.push({ code: 'missing-step-lesson', entityId: step.lessonId, message: 'La lección del paso no existe.' })
      for (const activityId of [...step.requiredActivityIds, ...step.optionalActivityIds]) {
        const activity = product.activities.find(({ id }) => id === activityId)
        if (!activity) {
          issues.push({ code: 'missing-step-activity', entityId: activityId, message: 'La actividad del paso no existe.' })
          continue
        }
        if (activity.lessonId !== step.lessonId && !step.explicitlySharedActivityIds.includes(activityId)) {
          issues.push({ code: 'implicit-shared-activity', entityId: activityId, message: 'La actividad no pertenece a la lección y no está declarada como compartida.' })
        }
      }
      const requiresDemonstration = step.requiredActivityIds.some((activityId) => {
        const contract = product.activities.find(({ id }) => id === activityId)?.pedagogicalContract
        return contract?.purpose === 'mastery-check' || contract?.assessmentIntent === 'demonstration'
      })
      if (requiresDemonstration && step.completionPolicy !== 'study-practice-and-demonstration') {
        issues.push({ code: 'step-demonstration-policy', entityId: step.stepId, message: 'El paso contiene una demostración sin declararla en completionPolicy.' })
      }
      if (step.requiredActivityIds.length === 0 && step.completionPolicy !== 'study-only') {
        issues.push({ code: 'step-study-only-policy', entityId: step.stepId, message: 'El paso sin prácticas debe usar study-only.' })
      }
      for (const activityId of step.requiredActivityIds) {
        const previousStepId = seenRequiredActivities.get(activityId)
        if (previousStepId && !step.explicitlySharedActivityIds.includes(activityId)) {
          issues.push({ code: 'duplicate-required-activity', entityId: activityId, message: `La actividad ya es obligatoria en ${previousStepId} y no está compartida explícitamente.` })
        }
        seenRequiredActivities.set(activityId, step.stepId)
      }
    }
    for (const lessonId of chapter.anchorLessonIds) {
      if (!lessonIds.has(lessonId)) issues.push({ code: 'missing-anchor-lesson', entityId: lessonId, message: 'La lección anchor no existe.' })
      if (seenAnchors.has(lessonId)) issues.push({ code: 'duplicate-anchor', entityId: lessonId, message: 'La lección aparece como anchor en más de un capítulo.' })
      seenAnchors.add(lessonId)
    }
    for (const lessonId of chapter.supportingLessonIds) if (!lessonIds.has(lessonId)) {
      issues.push({ code: 'missing-support-lesson', entityId: lessonId, message: 'La lección de apoyo no existe.' })
    }
    for (const activityId of [...chapter.requiredActivityIds, ...chapter.optionalActivityIds]) if (!activityIds.has(activityId)) {
      issues.push({ code: 'missing-activity', entityId: activityId, message: 'La actividad declarada no existe.' })
    }
    for (const prerequisiteId of chapter.prerequisiteChapterIds) if (!chapterIds.has(prerequisiteId)) {
      issues.push({ code: 'missing-chapter-prerequisite', entityId: chapter.chapterId, message: `No existe ${prerequisiteId}.` })
    }
  }
  for (const branch of path.optionalBranches) {
    if (branch.blocking) issues.push({ code: 'blocking-optional-branch', entityId: branch.branchId, message: 'Una rama opcional no puede bloquear.' })
    for (const routeId of branch.routeIds) if (!routeIds.has(routeId)) {
      issues.push({ code: 'missing-optional-route', entityId: routeId, message: 'La ruta opcional no existe.' })
    }
  }
  const planned = new Set(path.chapters.flatMap(({ plannedContentRefs }) => plannedContentRefs))
  for (const plannedRef of ACADEMY_STAGE_5_PLANNED_REFS) if (!planned.has(plannedRef)) {
    issues.push({ code: 'missing-stage5-gap', entityId: plannedRef, message: 'El vacío de etapa 5 no está representado.' })
  }
  if (path.stages.find(({ stageId }) => stageId === 'stage.5')?.coverageStatus !== 'partial') {
    issues.push({ code: 'stage5-not-partial', entityId: 'stage.5', message: 'La etapa 5 debe declarar cobertura parcial.' })
  }
  issues.push(...cycles(path.stageIds, (id) => path.stages.find(({ stageId }) => stageId === id)?.prerequisiteStageIds ?? [], 'stage-cycle'))
  issues.push(...cycles([...chapterIds], (id) => path.chapters.find(({ chapterId }) => chapterId === id)?.prerequisiteChapterIds ?? [], 'chapter-cycle'))
  return issues
}
