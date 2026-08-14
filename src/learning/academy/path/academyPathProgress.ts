import type { LearningApplicationSnapshot } from '../../application/service'
import { academyActivitySatisfiesProgression } from '../academyCatalog'
import type { AcademyLocalState } from '../academyLocalState'
import {
  ACADEMY_LEARNER_PATH,
  type AcademyLearnerChapter,
  type AcademyLearnerPathDefinition,
} from './academyLearnerPath'

export type AcademyPathLearningState =
  | 'not-started'
  | 'available'
  | 'current'
  | 'studying'
  | 'practising'
  | 'demonstrated'
  | 'consolidated'
  | 'blocked'
  | 'partial-content'
  | 'planned'

export interface AcademyBenchEvidenceStatus {
  required: boolean
  status: 'not-required' | 'pending' | 'documented' | 'reviewed'
  physicalEvidenceIds: string[]
  note: string
}

export interface AcademyChapterProgress {
  chapterId: string
  state: AcademyPathLearningState
  studiedAnchorLessonIds: string[]
  completedRequiredActivityIds: string[]
  startedRequiredActivityIds: string[]
  anchorLessonsCompleted: number
  anchorLessonsTotal: number
  requiredActivitiesCompleted: number
  requiredActivitiesTotal: number
  coreComplete: boolean
  benchEvidenceStatus: AcademyBenchEvidenceStatus
}

export interface AcademyStageProgress {
  stageId: string
  state: AcademyPathLearningState
  completedChapterIds: string[]
  chaptersCompleted: number
  chaptersTotal: number
  coreComplete: boolean
  coverageStatus: AcademyLearnerPathDefinition['stages'][number]['coverageStatus']
}

export interface AcademyOptionalExplorationProgress {
  startedActivityIds: string[]
  completedActivityIds: string[]
  note: string
}

export interface AcademyPathProgress {
  pathId: string
  currentStageId?: string
  currentChapterId?: string
  completedStageIds: string[]
  stagesCompleted: number
  stagesTotal: number
  anchorLessonsCompleted: number
  anchorLessonsTotal: number
  requiredActivitiesCompleted: number
  requiredActivitiesTotal: number
  coreComplete: boolean
  chapters: AcademyChapterProgress[]
  stages: AcademyStageProgress[]
  benchEvidenceStatus: AcademyBenchEvidenceStatus
  optionalExplorationProgress: AcademyOptionalExplorationProgress
}

function lessonStudied(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  lessonId: string,
): boolean {
  if (localState?.lessonProgress.some((item) => item.lessonId === lessonId && Boolean(item.completedAt))) return true
  const activityIds = new Set(
    snapshot.product.lessons.find(({ id }) => id === lessonId)?.activityIds ?? [],
  )
  return snapshot.sessions.items.some(({ activityId, state }) =>
    activityIds.has(activityId) && state === 'completed')
}

function physicalEvidenceForChapter(
  snapshot: LearningApplicationSnapshot,
  chapter: AcademyLearnerChapter,
): AcademyBenchEvidenceStatus {
  if (!chapter.physicalEvidencePolicy.physicalCompetenceClaim) {
    return {
      required: false,
      status: 'not-required',
      physicalEvidenceIds: [],
      note: chapter.physicalEvidencePolicy.note,
    }
  }
  const chapterActivityIds = new Set([...chapter.requiredActivityIds, ...chapter.optionalActivityIds])
  const physical = snapshot.evidence.items.filter((evidence) => {
    if (!chapterActivityIds.has(evidence.activityId) || evidence.status !== 'active') return false
    const content = evidence.content as Record<string, unknown>
    return content.modality === 'P'
      || content.evidenceModality === 'P'
      || content.physicalExecutionDocumented === true
  })
  const reviewed = physical.some((evidence) =>
    evidence.evidenceType === 'human-review'
    || evidence.provenance.some(({ kind }) => kind === 'human-review'))
  return {
    required: true,
    status: physical.length === 0 ? 'pending' : reviewed ? 'reviewed' : 'documented',
    physicalEvidenceIds: physical.map(({ id }) => id),
    note: physical.length === 0
      ? chapter.physicalEvidencePolicy.note
      : reviewed
        ? 'Existe evidencia P documentada y revisada; se mantiene separada del avance conceptual.'
        : 'Existe evidencia P documentada pendiente de revisión humana.',
  }
}

function rawChapterProgress(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  chapter: AcademyLearnerChapter,
): AcademyChapterProgress {
  const studiedAnchorLessonIds = chapter.anchorLessonIds.filter((lessonId) =>
    lessonStudied(snapshot, localState, lessonId))
  const completedRequiredActivityIds = chapter.requiredActivityIds.filter((activityId) => {
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    return Boolean(activity && academyActivitySatisfiesProgression(snapshot, activity))
  })
  const startedRequiredActivityIds = chapter.requiredActivityIds.filter((activityId) =>
    snapshot.sessions.items.some((session) => session.activityId === activityId))
  const coreComplete = studiedAnchorLessonIds.length === chapter.anchorLessonIds.length
    && completedRequiredActivityIds.length === chapter.requiredActivityIds.length
  return {
    chapterId: chapter.chapterId,
    state: coreComplete
      ? 'demonstrated'
      : startedRequiredActivityIds.length > 0
        ? 'practising'
        : studiedAnchorLessonIds.length > 0
          ? 'studying'
          : 'not-started',
    studiedAnchorLessonIds,
    completedRequiredActivityIds,
    startedRequiredActivityIds,
    anchorLessonsCompleted: studiedAnchorLessonIds.length,
    anchorLessonsTotal: chapter.anchorLessonIds.length,
    requiredActivitiesCompleted: completedRequiredActivityIds.length,
    requiredActivitiesTotal: chapter.requiredActivityIds.length,
    coreComplete,
    benchEvidenceStatus: physicalEvidenceForChapter(snapshot, chapter),
  }
}

function optionalProgress(
  snapshot: LearningApplicationSnapshot,
  path: AcademyLearnerPathDefinition,
): AcademyOptionalExplorationProgress {
  const coreActivityIds = new Set(path.chapters.flatMap(({ requiredActivityIds }) => requiredActivityIds))
  const optionalActivityIds = new Set(path.chapters.flatMap(({ optionalActivityIds }) => optionalActivityIds))
  const branchRouteIds = new Set(path.optionalBranches.flatMap(({ routeIds }) => routeIds))
  for (const route of snapshot.product.routes.filter(({ id }) => branchRouteIds.has(id))) {
    for (const moduleId of route.moduleIds) {
      const moduleItem = snapshot.product.modules.find(({ id }) => id === moduleId)
      for (const lessonId of moduleItem?.lessonIds ?? []) {
        const lesson = snapshot.product.lessons.find(({ id }) => id === lessonId)
        for (const activityId of lesson?.activityIds ?? []) if (!coreActivityIds.has(activityId)) optionalActivityIds.add(activityId)
      }
    }
  }
  const startedActivityIds = [...optionalActivityIds].filter((activityId) =>
    snapshot.sessions.items.some((session) => session.activityId === activityId))
  const completedActivityIds = startedActivityIds.filter((activityId) =>
    snapshot.sessions.items.some((session) => session.activityId === activityId && session.state === 'completed'))
  return {
    startedActivityIds,
    completedActivityIds,
    note: 'La exploración opcional se reconoce, pero nunca aumenta el denominador de la ruta principal.',
  }
}

export function deriveAcademyPathProgress(
  snapshot: LearningApplicationSnapshot,
  localState?: AcademyLocalState,
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyPathProgress {
  const chapters = path.chapters.map((chapterItem) => rawChapterProgress(snapshot, localState, chapterItem))
  const chapterById = new Map(chapters.map((item) => [item.chapterId, item]))
  let currentChapterId: string | undefined
  for (const chapterItem of path.chapters) {
    const progress = chapterById.get(chapterItem.chapterId)!
    const prerequisitesComplete = chapterItem.prerequisiteChapterIds.every((id) => chapterById.get(id)?.coreComplete)
    if (!progress.coreComplete && !currentChapterId && prerequisitesComplete) currentChapterId = chapterItem.chapterId
    if (progress.coreComplete) {
      progress.state = progress.benchEvidenceStatus.status === 'reviewed' ? 'consolidated' : 'demonstrated'
    } else if (!prerequisitesComplete) {
      progress.state = chapterItem.coverageStatus === 'planned' ? 'planned' : 'blocked'
    } else if (progress.state === 'not-started') {
      progress.state = currentChapterId === chapterItem.chapterId ? 'current' : 'available'
    }
    if (!progress.coreComplete && chapterItem.coverageStatus === 'partial' && progress.state !== 'blocked') {
      progress.state = ['current', 'available'].includes(progress.state) ? 'partial-content' : progress.state
    }
  }
  const stages: AcademyStageProgress[] = path.stages.map((stageItem) => {
    const stageChapters = stageItem.chapterIds.map((id) => chapterById.get(id)!).filter(Boolean)
    const completedChapterIds = stageChapters.filter(({ coreComplete }) => coreComplete).map(({ chapterId }) => chapterId)
    const coreComplete = completedChapterIds.length === stageChapters.length
    const hasStarted = stageChapters.some(({ state }) => ['studying', 'practising', 'demonstrated', 'consolidated'].includes(state))
    return {
      stageId: stageItem.stageId,
      state: coreComplete ? 'demonstrated' : hasStarted ? 'studying' : 'not-started',
      completedChapterIds,
      chaptersCompleted: completedChapterIds.length,
      chaptersTotal: stageChapters.length,
      coreComplete,
      coverageStatus: stageItem.coverageStatus,
    }
  })
  const currentStageId = stages.find((item) => !item.coreComplete)?.stageId
  for (const stage of stages) {
    if (stage.coreComplete) continue
    const prerequisites = path.stages.find(({ stageId }) => stageId === stage.stageId)?.prerequisiteStageIds ?? []
    const prerequisitesComplete = prerequisites.every((id) => stages.find(({ stageId }) => stageId === id)?.coreComplete)
    stage.state = stage.stageId === currentStageId
      ? 'current'
      : prerequisitesComplete ? 'available' : 'blocked'
  }
  const physicalEvidenceIds = chapters.flatMap(({ benchEvidenceStatus }) => benchEvidenceStatus.physicalEvidenceIds)
  const benchRequired = chapters.some(({ benchEvidenceStatus }) => benchEvidenceStatus.required)
  const allRequiredReviewed = chapters
    .filter(({ benchEvidenceStatus }) => benchEvidenceStatus.required)
    .every(({ benchEvidenceStatus }) => benchEvidenceStatus.status === 'reviewed')
  return {
    pathId: path.pathId,
    currentStageId,
    currentChapterId,
    completedStageIds: stages.filter(({ coreComplete }) => coreComplete).map(({ stageId }) => stageId),
    stagesCompleted: stages.filter(({ coreComplete }) => coreComplete).length,
    stagesTotal: stages.length,
    anchorLessonsCompleted: chapters.reduce((total, item) => total + item.anchorLessonsCompleted, 0),
    anchorLessonsTotal: chapters.reduce((total, item) => total + item.anchorLessonsTotal, 0),
    requiredActivitiesCompleted: chapters.reduce((total, item) => total + item.requiredActivitiesCompleted, 0),
    requiredActivitiesTotal: chapters.reduce((total, item) => total + item.requiredActivitiesTotal, 0),
    coreComplete: stages.every(({ coreComplete }) => coreComplete),
    chapters,
    stages,
    benchEvidenceStatus: {
      required: benchRequired,
      status: !benchRequired ? 'not-required' : physicalEvidenceIds.length === 0 ? 'pending' : allRequiredReviewed ? 'reviewed' : 'documented',
      physicalEvidenceIds,
      note: 'La evidencia de banco se calcula aparte y no se infiere de sesiones virtuales.',
    },
    optionalExplorationProgress: optionalProgress(snapshot, path),
  }
}
