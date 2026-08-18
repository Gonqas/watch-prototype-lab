import type { LearningApplicationSnapshot } from '../../application/service'
import { localize } from '../../application/i18n'
import type { AcademyLocalState } from '../academyLocalState'
import {
  ACADEMY_LEARNER_PATH,
  academyPathChapter,
  academyPathLocationForActivity,
  type AcademyLearnerPathDefinition,
} from './academyLearnerPath'
import { deriveAcademyPathProgress } from './academyPathProgress'

export type AcademyNextActionType =
  | 'read'
  | 'practice'
  | 'demonstrate'
  | 'review'
  | 'retention-content-missing'
  | 'resume'
  | 'chapter'
  | 'available-path-complete'

export interface AcademySecondaryAction {
  title: string
  href: string
  ctaLabel: string
}

export interface AcademyNextAction {
  actionId: string
  precedence: 1 | 2 | 3 | 4 | 5 | 6
  stageId?: string
  stageTitle: string
  chapterId?: string
  chapterTitle: string
  title: string
  reason: string
  type: AcademyNextActionType
  href: string
  ctaLabel: string
  durationMinutes?: number
  remainingCoreItems: number
  plannedCurriculumItems?: number
  coveragePendingStageIds?: string[]
  after: string
  lessonId?: string
  activityId?: string
  sessionId?: string
  competencyId?: string
  secondaryAction?: AcademySecondaryAction
}

const recoverableStates = new Set(['active', 'paused', 'suspended', 'interrupted', 'recovering'])

function remainingItems(
  path: AcademyLearnerPathDefinition,
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  chapterId: string | undefined,
  now: string,
): number {
  if (!chapterId) return 0
  const progress = deriveAcademyPathProgress(snapshot, localState, path, now).chapters.find((item) => item.chapterId === chapterId)
  return progress
    ? progress.steps.filter(({ exposureStatus }) => exposureStatus !== 'studied').length
      + progress.pendingRequiredActivityIds.length
    : 0
}

export function academyNextAction(
  snapshot: LearningApplicationSnapshot,
  localState?: AcademyLocalState,
  now = new Date().toISOString(),
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyNextAction {
  const coreActivityIds = new Set(path.chapters.flatMap(({ steps }) =>
    steps.flatMap(({ requiredActivityIds }) => requiredActivityIds)))
  const recovery = [...snapshot.sessions.items]
    .filter(({ activityId, state }) => coreActivityIds.has(activityId) && recoverableStates.has(state))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  if (recovery) {
    const activity = snapshot.product.activities.find(({ id }) => id === recovery.activityId)
    const location = academyPathLocationForActivity(recovery.activityId, path)
    return {
      actionId: `path-action.recovery.${recovery.id}`,
      precedence: 1,
      stageId: location?.stage.stageId,
      stageTitle: location?.stage.title ?? 'Taller',
      chapterId: location?.chapter.chapterId,
      chapterTitle: location?.chapter.title ?? 'Sesión guardada',
      title: activity ? localize(snapshot.profile?.locale, activity.title) : 'Retomar la práctica guardada',
      reason: 'Existe una sesión principal con un punto de recuperación seguro; se resuelve antes de abrir trabajo nuevo.',
      type: 'resume',
      href: `#/learning/recovery/${encodeURIComponent(recovery.id)}`,
      ctaLabel: 'Retomar sesión',
      durationMinutes: activity?.durationMinutes,
      remainingCoreItems: remainingItems(path, snapshot, localState, location?.chapter.chapterId, now),
      after: 'Al terminar volverás al capítulo activo sin perder el estado guardado.',
      activityId: recovery.activityId,
      sessionId: recovery.id,
    }
  }

  const dueCandidates = snapshot.mastery.items
    .filter(({ state, nextReviewAt }) => state === 'demonstrated' && Boolean(nextReviewAt) && nextReviewAt! <= now)
    .sort((left, right) => (left.nextReviewAt ?? '').localeCompare(right.nextReviewAt ?? ''))
  for (const due of dueCandidates) {
    const activity = snapshot.product.activities.find((candidate) =>
      coreActivityIds.has(candidate.id)
      && candidate.competencyIds.includes(due.competencyId)
      && (candidate.pedagogicalContract?.purpose === 'retention'
        || candidate.pedagogicalContract?.assessmentIntent === 'retention'))
    if (activity) {
      const location = academyPathLocationForActivity(activity.id, path)
      return {
        actionId: `path-action.review.${due.competencyId}`,
        precedence: 2,
        stageId: location?.stage.stageId,
        stageTitle: location?.stage.title ?? 'Repaso',
        chapterId: location?.chapter.chapterId,
        chapterTitle: location?.chapter.title ?? 'Retención pendiente',
        title: localize(snapshot.profile?.locale, activity.title),
        reason: 'La fecha de recuperación espaciada ya ha vencido; repasar ahora protege lo demostrado.',
        type: 'review',
        href: `#/learning/activity/${encodeURIComponent(activity.id)}?mode=retention`,
        ctaLabel: 'Hacer repaso',
        durationMinutes: activity.durationMinutes,
        remainingCoreItems: remainingItems(path, snapshot, localState, location?.chapter.chapterId, now),
        after: 'Después continuarás en el mismo punto de la ruta principal.',
        activityId: activity.id,
        competencyId: due.competencyId,
      }
    }

    const owningStep = path.chapters
      .flatMap((chapter) => chapter.steps.map((step) => ({ chapter, step })))
      .find(({ step }) => step.requiredActivityIds.some((activityId) =>
        snapshot.product.activities.find(({ id }) => id === activityId)?.competencyIds.includes(due.competencyId)))
    if (!owningStep) continue
    const stage = path.stages.find(({ stageId }) => stageId === owningStep.chapter.stageId)
    return {
      actionId: `path-action.retention-content-missing.${due.competencyId}`,
      precedence: 2,
      stageId: stage?.stageId,
      stageTitle: stage?.title ?? 'Repaso',
      chapterId: owningStep.chapter.chapterId,
      chapterTitle: owningStep.chapter.title,
      title: 'Repaso pendiente sin actividad específica',
      reason: 'La competencia tiene retención vencida, pero la ruta no declara una actividad de retención explícita.',
      type: 'retention-content-missing',
      href: `#/learning/lesson/${encodeURIComponent(owningStep.step.lessonId)}`,
      ctaLabel: 'Revisar contenido',
      remainingCoreItems: remainingItems(path, snapshot, localState, owningStep.chapter.chapterId, now),
      after: 'Revisar el contenido no acredita retención; hace falta una actividad específica antes de registrar ese resultado.',
      lessonId: owningStep.step.lessonId,
      competencyId: due.competencyId,
    }
  }

  const pathProgress = deriveAcademyPathProgress(snapshot, localState, path, now)
  const chapter = pathProgress.currentChapterId
    ? path.chapters.find(({ chapterId }) => chapterId === pathProgress.currentChapterId)
    : undefined
  const chapterProgress = chapter
    ? pathProgress.chapters.find(({ chapterId }) => chapterId === chapter.chapterId)
    : undefined
  const stage = chapter ? path.stages.find(({ stageId }) => stageId === chapter.stageId) : undefined
  if (chapter && chapterProgress && stage) {
    const chapterIndex = path.chapters.findIndex(({ chapterId }) => chapterId === chapter.chapterId)
    const previousChapter = chapterIndex > 0 ? pathProgress.chapters[chapterIndex - 1] : undefined
    const chapterIsPristine = chapterProgress.steps.every(({ exposureStatus, startedRequiredActivityIds }) =>
      exposureStatus === 'not-started' && startedRequiredActivityIds.length === 0)
    if (previousChapter?.coreAvailableComplete && chapterIsPristine) {
      return {
        actionId: `path-action.chapter.${chapter.chapterId}`,
        precedence: 5,
        stageId: stage.stageId,
        stageTitle: stage.title,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        title: `Abrir ${chapter.title}`,
        reason: 'El capítulo anterior está cerrado y este es el siguiente bloque de la ruta principal.',
        type: 'chapter',
        href: `#/learning/my-learning?chapter=${encodeURIComponent(chapter.chapterId)}`,
        ctaLabel: 'Abrir capítulo',
        remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId, now),
        after: 'La primera lección ancla aparecerá como siguiente acción.',
      }
    }

    for (const step of chapter.steps) {
      const progress = chapterProgress.steps.find(({ stepId }) => stepId === step.stepId)!
      if (progress.exposureStatus !== 'studied') continue
      const pendingActivityId = progress.pendingRequiredActivityIds[0]
      if (!pendingActivityId) continue
      const activity = snapshot.product.activities.find(({ id }) => id === pendingActivityId)
      if (!activity) continue
      const isDemonstration = activity.pedagogicalContract?.assessmentIntent === 'demonstration'
        || activity.pedagogicalContract?.purpose === 'mastery-check'
      return {
        actionId: `path-action.activity.${pendingActivityId}`,
        precedence: 3,
        stageId: stage.stageId,
        stageTitle: stage.title,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        title: localize(snapshot.profile?.locale, activity.title),
        reason: isDemonstration
          ? 'La explicación y la práctica necesarias ya están disponibles; toca una comprobación independiente.'
          : 'La explicación necesaria ya está estudiada y esta práctica es obligatoria para cerrar el paso.',
        type: isDemonstration ? 'demonstrate' : 'practice',
        href: `#/learning/activity/${encodeURIComponent(activity.id)}${isDemonstration ? '?mode=demonstration' : ''}`,
        ctaLabel: isDemonstration ? 'Demostrar' : progress.practiceStatus === 'in-progress' ? 'Retomar práctica' : 'Practicar',
        durationMinutes: activity.durationMinutes,
        remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId, now),
        after: 'Al completarla se actualizarán práctica, mastery y evidencia física por separado.',
        activityId: activity.id,
        lessonId: step.lessonId,
      }
    }

    const nextStep = chapter.steps.find((step) =>
      chapterProgress.steps.find(({ stepId }) => stepId === step.stepId)?.exposureStatus !== 'studied')
    if (nextStep) {
      const lesson = snapshot.product.lessons.find(({ id }) => id === nextStep.lessonId)
      return {
        actionId: `path-action.lesson.${nextStep.lessonId}`,
        precedence: 4,
        stageId: stage.stageId,
        stageTitle: stage.title,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        title: lesson ? localize(snapshot.profile?.locale, lesson.title) : nextStep.lessonId,
        reason: `Es la siguiente explicación ancla de ${chapter.title}; sus apoyos y ramas opcionales no desplazan este paso.`,
        type: 'read',
        href: `#/learning/lesson/${encodeURIComponent(nextStep.lessonId)}`,
        ctaLabel: 'Abrir lección',
        remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId, now),
        after: nextStep.requiredActivityIds.length > 0
          ? 'Después aparecerá la primera práctica obligatoria pendiente declarada en este paso.'
          : 'Después continuarás con el siguiente paso del capítulo.',
        lessonId: nextStep.lessonId,
      }
    }
  }

  const optional = path.optionalBranches[0]
  const optionalRoute = optional?.routeIds[0]
  return {
    actionId: 'path-action.available-path-complete',
    precedence: 6,
    stageTitle: 'Ruta principal',
    chapterTitle: 'Cobertura curricular',
    title: 'Recorrido disponible completado',
    reason: pathProgress.coveragePendingStageIds.length > 0
      ? 'Quedan contenidos planificados o pendientes de revisión antes de cerrar el currículo completo.'
      : 'No queda ninguna tarea principal disponible pendiente.',
    type: 'available-path-complete',
    href: '#/learning/my-learning',
    ctaLabel: 'Ver cobertura',
    remainingCoreItems: 0,
    plannedCurriculumItems: pathProgress.plannedCurriculumItems,
    coveragePendingStageIds: pathProgress.coveragePendingStageIds,
    after: 'Las ampliaciones de Biblioteca son opcionales y no cambian este estado.',
    secondaryAction: optional
      ? {
          title: optional.title,
          href: optionalRoute ? `#/learning/route/${encodeURIComponent(optionalRoute)}` : '#/learning/explore',
          ctaLabel: 'Explorar ampliación opcional',
        }
      : undefined,
  }
}

export function academyNextActionForChapter(chapterId: string): string {
  const chapter = academyPathChapter(chapterId)
  return chapter?.steps[0]
    ? `#/learning/lesson/${encodeURIComponent(chapter.steps[0].lessonId)}`
    : '#/learning/my-learning'
}
