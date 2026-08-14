import type { LearningApplicationSnapshot } from '../../application/service'
import { academyActivitySatisfiesProgression } from '../academyCatalog'
import { createDefaultAcademyLocalState, type AcademyLocalState } from '../academyLocalState'
import {
  ACADEMY_LEARNER_PATH,
  academyPathLocationForStepLesson,
  type AcademyLearnerPathDefinition,
} from './academyLearnerPath'
import { academyNextAction } from './academyNextAction'
import { deriveAcademyPathProgress } from './academyPathProgress'

export function academyModuleEntryHref(moduleId: string, lessonIds: readonly string[]): string {
  return lessonIds.length === 1
    ? `#/learning/lesson/${encodeURIComponent(lessonIds[0])}`
    : `#/learning/module/${encodeURIComponent(moduleId)}`
}

export function academyChapterHref(chapterId: string): string {
  return `#/learning/my-learning?chapter=${encodeURIComponent(chapterId)}`
}

export type AcademyLessonCompletionMetric =
  | 'lesson-complete-to-required-activity'
  | 'lesson-complete-to-next-action'
  | 'lesson-complete-outside-main-path'

export interface AcademyLessonCompletionTransition {
  href: string
  metric: AcademyLessonCompletionMetric
  activityId?: string
  actionId?: string
}

function withExplicitStudy(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  lessonId: string,
  now: string,
): AcademyLocalState {
  const state = localState ?? createDefaultAcademyLocalState(snapshot.profile?.id ?? 'academy-profile', now)
  const previous = state.lessonProgress.find((item) => item.lessonId === lessonId)
  return {
    ...state,
    lessonProgress: [
      {
        lessonId,
        currentSegmentId: previous?.currentSegmentId ?? '',
        completedSegmentIds: previous?.completedSegmentIds ?? [],
        completedAt: previous?.completedAt ?? now,
        updatedAt: now,
      },
      ...state.lessonProgress.filter((item) => item.lessonId !== lessonId),
    ],
  }
}

export function academyLessonCompletionTransition(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  lessonId: string,
  now = new Date().toISOString(),
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyLessonCompletionTransition {
  const nextState = withExplicitStudy(snapshot, localState, lessonId, now)
  const location = academyPathLocationForStepLesson(lessonId, path)
  if (location) {
    const progress = deriveAcademyPathProgress(snapshot, nextState, path, now)
    const chapterProgress = progress.chapters.find(({ chapterId }) => chapterId === location.chapter.chapterId)
    const unlocked = chapterProgress?.state !== 'blocked' && chapterProgress?.state !== 'planned'
    const activityId = unlocked
      ? location.step.requiredActivityIds.find((id) => {
          const activity = snapshot.product.activities.find((item) => item.id === id)
          return Boolean(activity && !academyActivitySatisfiesProgression(snapshot, activity))
        })
      : undefined
    if (activityId) {
      const activity = snapshot.product.activities.find(({ id }) => id === activityId)
      const demonstration = activity?.pedagogicalContract?.purpose === 'mastery-check'
        || activity?.pedagogicalContract?.assessmentIntent === 'demonstration'
      return {
        href: `#/learning/activity/${encodeURIComponent(activityId)}${demonstration ? '?mode=demonstration' : ''}`,
        metric: 'lesson-complete-to-required-activity',
        activityId,
      }
    }
    const next = academyNextAction(snapshot, nextState, now, path)
    return { href: next.href, metric: 'lesson-complete-to-next-action', actionId: next.actionId }
  }

  const lesson = snapshot.product.lessons.find(({ id }) => id === lessonId)
  const contractedActivityId = lesson?.studyContract?.labActivityIds.find((activityId) => {
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    return activity?.lessonId === lessonId && !academyActivitySatisfiesProgression(snapshot, activity)
  })
  if (contractedActivityId) {
    return {
      href: `#/learning/activity/${encodeURIComponent(contractedActivityId)}`,
      metric: 'lesson-complete-outside-main-path',
      activityId: contractedActivityId,
    }
  }
  const route = snapshot.product.routes.find((candidate) => candidate.moduleIds.some((moduleId) =>
    snapshot.product.modules.find(({ id }) => id === moduleId)?.lessonIds.includes(lessonId)))
  return {
    href: route ? `#/learning/route/${encodeURIComponent(route.id)}` : '#/learning/explore',
    metric: 'lesson-complete-outside-main-path',
  }
}
