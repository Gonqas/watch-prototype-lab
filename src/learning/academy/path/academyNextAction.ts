import type { LearningApplicationSnapshot } from '../../application/service'
import { localize } from '../../application/i18n'
import { academyActivitySatisfiesProgression } from '../academyCatalog'
import type { AcademyLocalState } from '../academyLocalState'
import {
  ACADEMY_LEARNER_PATH,
  academyPathChapter,
  academyPathStage,
  type AcademyLearnerPathDefinition,
} from './academyLearnerPath'
import { deriveAcademyPathProgress } from './academyPathProgress'

export type AcademyNextActionType = 'read' | 'practice' | 'demonstrate' | 'review' | 'resume' | 'chapter' | 'optional'

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
  after: string
  lessonId?: string
  activityId?: string
  sessionId?: string
}

const recoverableStates = new Set(['active', 'paused', 'suspended', 'interrupted', 'recovering'])

function locationForActivity(path: AcademyLearnerPathDefinition, activityId: string) {
  const chapter = path.chapters.find((item) =>
    item.requiredActivityIds.includes(activityId) || item.optionalActivityIds.includes(activityId))
  return chapter ? { chapter, stage: path.stages.find(({ stageId }) => stageId === chapter.stageId)! } : undefined
}

function remainingItems(
  path: AcademyLearnerPathDefinition,
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  chapterId: string | undefined,
): number {
  if (!chapterId) return 0
  const progress = deriveAcademyPathProgress(snapshot, localState, path).chapters.find((item) => item.chapterId === chapterId)
  return progress
    ? (progress.anchorLessonsTotal - progress.anchorLessonsCompleted)
      + (progress.requiredActivitiesTotal - progress.requiredActivitiesCompleted)
    : 0
}

export function academyNextAction(
  snapshot: LearningApplicationSnapshot,
  localState?: AcademyLocalState,
  now = new Date().toISOString(),
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyNextAction {
  const recovery = [...snapshot.sessions.items]
    .filter(({ state }) => recoverableStates.has(state))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  if (recovery) {
    const activity = snapshot.product.activities.find(({ id }) => id === recovery.activityId)
    const location = locationForActivity(path, recovery.activityId)
    return {
      actionId: `path-action.recovery.${recovery.id}`,
      precedence: 1,
      stageId: location?.stage.stageId,
      stageTitle: location?.stage.title ?? 'Taller',
      chapterId: location?.chapter.chapterId,
      chapterTitle: location?.chapter.title ?? 'Sesión guardada',
      title: activity ? localize(snapshot.profile?.locale, activity.title) : 'Retomar la práctica guardada',
      reason: 'Existe una sesión con un punto de recuperación seguro; se resuelve antes de abrir trabajo nuevo.',
      type: 'resume',
      href: `#/learning/recovery/${encodeURIComponent(recovery.id)}`,
      ctaLabel: 'Retomar sesión',
      durationMinutes: activity?.durationMinutes,
      remainingCoreItems: remainingItems(path, snapshot, localState, location?.chapter.chapterId),
      after: 'Al terminar volverás al capítulo activo sin perder el estado guardado.',
      activityId: recovery.activityId,
      sessionId: recovery.id,
    }
  }

  const due = snapshot.mastery.items
    .filter(({ state, nextReviewAt }) =>
      state === 'demonstrated' && Boolean(nextReviewAt) && nextReviewAt! <= now)
    .sort((left, right) => (left.nextReviewAt ?? '').localeCompare(right.nextReviewAt ?? ''))[0]
  if (due) {
    const activity = snapshot.product.activities.find((candidate) =>
      candidate.competencyIds.includes(due.competencyId)
      && (candidate.pedagogicalContract?.purpose === 'retention'
        || candidate.pedagogicalContract?.assessmentIntent === 'retention'))
    const location = activity ? locationForActivity(path, activity.id) : undefined
    return {
      actionId: `path-action.review.${due.competencyId}`,
      precedence: 2,
      stageId: location?.stage.stageId,
      stageTitle: location?.stage.title ?? 'Repaso',
      chapterId: location?.chapter.chapterId,
      chapterTitle: location?.chapter.title ?? 'Retención pendiente',
      title: activity ? localize(snapshot.profile?.locale, activity.title) : 'Repaso de retención pendiente',
      reason: 'La fecha de recuperación espaciada ya ha vencido; repasar ahora protege lo demostrado.',
      type: 'review',
      href: activity ? `#/learning/activity/${encodeURIComponent(activity.id)}?mode=retention` : '#/learning/review',
      ctaLabel: 'Hacer repaso',
      durationMinutes: activity?.durationMinutes,
      remainingCoreItems: remainingItems(path, snapshot, localState, location?.chapter.chapterId),
      after: 'Después continuarás en el mismo punto de la ruta principal.',
      activityId: activity?.id,
    }
  }

  const pathProgress = deriveAcademyPathProgress(snapshot, localState, path)
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
    const chapterIsPristine = chapterProgress.studiedAnchorLessonIds.length === 0
      && chapterProgress.startedRequiredActivityIds.length === 0
    if (previousChapter?.coreComplete && chapterIsPristine) {
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
        remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId),
        after: 'La primera lección ancla aparecerá como siguiente acción.',
      }
    }
    const pendingActivityId = chapter.requiredActivityIds.find((activityId) => {
      const activity = snapshot.product.activities.find(({ id }) => id === activityId)
      if (!activity || academyActivitySatisfiesProgression(snapshot, activity)) return false
      const lessonStudied = chapterProgress.studiedAnchorLessonIds.includes(activity.lessonId)
      const attempted = snapshot.sessions.items.some((session) => session.activityId === activityId)
      return lessonStudied || attempted
    })
    if (pendingActivityId) {
      const activity = snapshot.product.activities.find(({ id }) => id === pendingActivityId)!
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
          ? 'La explicación necesaria ya está estudiada; toca una comprobación independiente.'
          : 'La explicación necesaria ya está estudiada y esta práctica es obligatoria para cerrar el capítulo.',
        type: isDemonstration ? 'demonstrate' : 'practice',
        href: `#/learning/activity/${encodeURIComponent(activity.id)}${isDemonstration ? '?mode=demonstration' : ''}`,
        ctaLabel: isDemonstration ? 'Demostrar' : 'Practicar',
        durationMinutes: activity.durationMinutes,
        remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId),
        after: 'Al completarla se actualizará el capítulo a partir de la sesión y sus resultados existentes.',
        activityId: activity.id,
        lessonId: activity.lessonId,
      }
    }

    const nextLessonId = chapter.anchorLessonIds.find((lessonId) =>
      !chapterProgress.studiedAnchorLessonIds.includes(lessonId))
    if (nextLessonId) {
      const lesson = snapshot.product.lessons.find(({ id }) => id === nextLessonId)
      return {
        actionId: `path-action.lesson.${nextLessonId}`,
        precedence: 4,
        stageId: stage.stageId,
        stageTitle: stage.title,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        title: lesson ? localize(snapshot.profile?.locale, lesson.title) : nextLessonId,
        reason: `Es la siguiente explicación ancla de ${chapter.title}; sus apoyos y ramas opcionales no desplazan este paso.`,
        type: 'read',
        href: `#/learning/lesson/${encodeURIComponent(nextLessonId)}`,
        ctaLabel: 'Abrir lección',
        remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId),
        after: chapter.requiredActivityIds.some((activityId) =>
          snapshot.product.activities.find(({ id }) => id === activityId)?.lessonId === nextLessonId)
          ? 'Después aparecerá la práctica obligatoria asociada.'
          : 'Después continuarás con la siguiente ancla del capítulo.',
        lessonId: nextLessonId,
      }
    }

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
      remainingCoreItems: remainingItems(path, snapshot, localState, chapter.chapterId),
      after: 'La primera lección ancla aparecerá como siguiente acción.',
    }
  }

  const optional = path.optionalBranches[0]
  const optionalRoute = optional?.routeIds[0]
  return {
    actionId: 'path-action.optional-library',
    precedence: 6,
    stageId: optional?.stageId,
    stageTitle: optional ? academyPathStage(optional.stageId)?.title ?? 'Ruta completada' : 'Ruta completada',
    chapterTitle: 'Ampliación opcional',
    title: optional?.title ?? 'Explorar la biblioteca',
    reason: 'No queda ninguna tarea core pendiente; esta ampliación es voluntaria y no cambia el progreso principal.',
    type: 'optional',
    href: optionalRoute ? `#/learning/route/${encodeURIComponent(optionalRoute)}` : '#/learning/explore',
    ctaLabel: 'Explorar ampliación',
    remainingCoreItems: 0,
    after: 'La ruta principal seguirá completa aunque no abras esta ampliación.',
  }
}

export function academyNextActionForChapter(chapterId: string): string {
  const chapter = academyPathChapter(chapterId)
  return chapter?.anchorLessonIds[0]
    ? `#/learning/lesson/${encodeURIComponent(chapter.anchorLessonIds[0])}`
    : '#/learning/my-learning'
}
