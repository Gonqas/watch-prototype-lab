import type { LearningApplicationSnapshot } from '../../application/service'
import { academyActivitySatisfiesProgression } from '../academyCatalog'
import type { AcademyLocalState } from '../academyLocalState'
import {
  ACADEMY_LEARNER_PATH,
  type AcademyCoverageStatus,
  type AcademyLearnerChapter,
  type AcademyLearnerPathDefinition,
  type AcademyLearnerStep,
  type AcademyMasteryCoveragePolicy,
} from './academyLearnerPath'
import { ACADEMY_PROGRESS_COMPATIBILITY_POLICY } from './academyPathCompatibility'

export { ACADEMY_LEGACY_STUDY_RECOGNITION_CUTOFF } from './academyPathCompatibility'

export type AcademyStudyRecognition = 'none' | 'explicit' | 'legacy-inferred'
export type AcademyExposureStatus = 'not-started' | 'in-progress' | 'studied'
export type AcademyPracticeStatus = 'not-started' | 'in-progress' | 'satisfied'
export type AcademyMasteryStatus = 'not-assessed' | 'demonstration-due' | 'demonstrated' | 'retention-due' | 'retained'
export type AcademyChapterMasteryStatus = AcademyMasteryStatus | 'partially-demonstrated' | 'partially-retained'
export type AcademyMasteryCoverageStatus = 'none' | 'partial' | 'complete'
export type AcademyPhysicalEvidenceStatus = 'not-required' | 'pending' | 'documented' | 'reviewed'

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
  status: AcademyPhysicalEvidenceStatus
  physicalEvidenceIds: string[]
  note: string
}

export interface AcademyLearnerStepProgress {
  stepId: string
  lessonId: string
  studyRecognition: AcademyStudyRecognition
  exposureStatus: AcademyExposureStatus
  practiceStatus: AcademyPracticeStatus
  masteryStatus: AcademyMasteryStatus
  physicalEvidenceStatus: AcademyPhysicalEvidenceStatus
  completedRequiredActivityIds: string[]
  pendingRequiredActivityIds: string[]
  startedRequiredActivityIds: string[]
  demonstratedCompetencyIds: string[]
  retainedCompetencyIds: string[]
  coreAvailableComplete: boolean
}

export interface AcademyChapterProgress {
  chapterId: string
  /** Compatibilidad 0.14B. Se deriva de las dimensiones siguientes. */
  state: AcademyPathLearningState
  exposureStatus: AcademyExposureStatus
  practiceStatus: AcademyPracticeStatus
  masteryStatus: AcademyChapterMasteryStatus
  masteryCoveragePolicy: AcademyMasteryCoveragePolicy
  masteryCoverageStatus: AcademyMasteryCoverageStatus
  assessedStepIds: string[]
  unassessedStepIds: string[]
  representedCompetencyIds: string[]
  /** Cobertura de evaluación, no cobertura curricular. */
  coverageComplete: boolean
  chapterMasteryClaimAllowed: boolean
  physicalEvidenceStatus: AcademyPhysicalEvidenceStatus
  coverageStatus: AcademyCoverageStatus
  coreAvailableComplete: boolean
  curriculumComplete: boolean
  studyRecognitionByLesson: Record<string, AcademyStudyRecognition>
  completedRequiredActivityIds: string[]
  pendingRequiredActivityIds: string[]
  demonstratedCompetencyIds: string[]
  retainedCompetencyIds: string[]
  steps: AcademyLearnerStepProgress[]
  studiedAnchorLessonIds: string[]
  startedRequiredActivityIds: string[]
  anchorLessonsCompleted: number
  anchorLessonsTotal: number
  requiredActivitiesCompleted: number
  requiredActivitiesTotal: number
  /** @deprecated Alias aditivo de coreAvailableComplete. */
  coreComplete: boolean
  benchEvidenceStatus: AcademyBenchEvidenceStatus
}

export interface AcademyStageProgress {
  stageId: string
  state: AcademyPathLearningState
  completedChapterIds: string[]
  chaptersCompleted: number
  chaptersTotal: number
  coreAvailableComplete: boolean
  curriculumComplete: boolean
  /** @deprecated Alias aditivo de coreAvailableComplete. */
  coreComplete: boolean
  coverageStatus: AcademyCoverageStatus
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
  coreAvailableComplete: boolean
  curriculumComplete: boolean
  coveragePendingStageIds: string[]
  plannedCurriculumItems: number
  /** @deprecated Alias aditivo de coreAvailableComplete. */
  coreComplete: boolean
  chapters: AcademyChapterProgress[]
  stages: AcademyStageProgress[]
  benchEvidenceStatus: AcademyBenchEvidenceStatus
  optionalExplorationProgress: AcademyOptionalExplorationProgress
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export function academyStudyRecognitionForLesson(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  lessonId: string,
): AcademyStudyRecognition {
  if (localState?.lessonProgress.some((item) => item.lessonId === lessonId && Boolean(item.completedAt))) return 'explicit'
  const activityIds = new Set(snapshot.product.lessons.find(({ id }) => id === lessonId)?.activityIds ?? [])
  const historicalCompletion = snapshot.sessions.items.some(({ activityId, state, completedAt, updatedAt }) =>
    activityIds.has(activityId)
    && state === 'completed'
    && (completedAt ?? updatedAt) <= ACADEMY_PROGRESS_COMPATIBILITY_POLICY.legacyCutoff)
  return historicalCompletion ? 'legacy-inferred' : 'none'
}

function exposureForLesson(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  lessonId: string,
  recognition: AcademyStudyRecognition,
): AcademyExposureStatus {
  if (recognition !== 'none') return 'studied'
  const localProgress = localState?.lessonProgress.find((item) => item.lessonId === lessonId)
  const activityIds = new Set(snapshot.product.lessons.find(({ id }) => id === lessonId)?.activityIds ?? [])
  return (localProgress?.completedSegmentIds.length ?? 0) > 0
    || snapshot.sessions.items.some(({ activityId }) => activityIds.has(activityId))
    ? 'in-progress'
    : 'not-started'
}

function physicalEvidence(
  snapshot: LearningApplicationSnapshot,
  activityIds: readonly string[],
  required: boolean,
  note: string,
): AcademyBenchEvidenceStatus {
  if (!required) return { required: false, status: 'not-required', physicalEvidenceIds: [], note }
  const scopedIds = new Set(activityIds)
  const records = snapshot.evidence.items.filter((evidence) => {
    if (!scopedIds.has(evidence.activityId) || evidence.status !== 'active') return false
    const content = evidence.content as Record<string, unknown>
    return content.modality === 'P'
      || content.evidenceModality === 'P'
      || content.physicalExecutionDocumented === true
  })
  const reviewed = records.some((evidence) =>
    evidence.evidenceType === 'human-review'
    || evidence.provenance.some(({ kind }) => kind === 'human-review'))
  return {
    required: true,
    status: records.length === 0 ? 'pending' : reviewed ? 'reviewed' : 'documented',
    physicalEvidenceIds: records.map(({ id }) => id),
    note: records.length === 0
      ? note
      : reviewed
        ? 'Existe evidencia P documentada y revisada; no acredita retención por sí sola.'
        : 'Existe evidencia P documentada pendiente de revisión humana.',
  }
}

function masteryForStep(
  snapshot: LearningApplicationSnapshot,
  step: AcademyLearnerStep,
  exposureStatus: AcademyExposureStatus,
  now: string,
): Pick<AcademyLearnerStepProgress, 'masteryStatus' | 'demonstratedCompetencyIds' | 'retainedCompetencyIds'> {
  const required = step.requiredActivityIds.flatMap((id) => {
    const activity = snapshot.product.activities.find((item) => item.id === id)
    return activity ? [activity] : []
  })
  const demonstrations = required.filter(({ pedagogicalContract }) =>
    pedagogicalContract?.purpose === 'mastery-check'
    || pedagogicalContract?.assessmentIntent === 'demonstration')
  const competencyIds = unique(demonstrations.flatMap(({ competencyIds }) => competencyIds))
  if (competencyIds.length === 0) {
    return { masteryStatus: 'not-assessed', demonstratedCompetencyIds: [], retainedCompetencyIds: [] }
  }
  const projections = competencyIds.flatMap((competencyId) => {
    const projection = snapshot.mastery.items.find((item) => item.competencyId === competencyId)
    return projection ? [projection] : []
  })
  const demonstratedCompetencyIds = competencyIds.filter((competencyId) => projections.some((item) =>
    item.competencyId === competencyId && (item.state === 'demonstrated' || item.state === 'retained')))
  const retainedCompetencyIds = competencyIds.filter((competencyId) => projections.some((item) =>
    item.competencyId === competencyId && item.state === 'retained'))
  if (retainedCompetencyIds.length === competencyIds.length) {
    return { masteryStatus: 'retained', demonstratedCompetencyIds, retainedCompetencyIds }
  }
  if (demonstratedCompetencyIds.length === competencyIds.length) {
    const due = projections.some(({ state, nextReviewAt }) => state === 'demonstrated' && Boolean(nextReviewAt) && nextReviewAt! <= now)
    return { masteryStatus: due ? 'retention-due' : 'demonstrated', demonstratedCompetencyIds, retainedCompetencyIds }
  }
  const nonDemonstrationReady = required
    .filter((activity) => !demonstrations.includes(activity))
    .every((activity) => academyActivitySatisfiesProgression(snapshot, activity))
  return {
    masteryStatus: exposureStatus === 'studied' && nonDemonstrationReady ? 'demonstration-due' : 'not-assessed',
    demonstratedCompetencyIds,
    retainedCompetencyIds,
  }
}

function stepProgress(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  chapter: AcademyLearnerChapter,
  step: AcademyLearnerStep,
  now: string,
): AcademyLearnerStepProgress {
  const studyRecognition = academyStudyRecognitionForLesson(snapshot, localState, step.lessonId)
  const exposureStatus = exposureForLesson(snapshot, localState, step.lessonId, studyRecognition)
  const completedRequiredActivityIds = step.requiredActivityIds.filter((activityId) => {
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    return Boolean(activity && academyActivitySatisfiesProgression(snapshot, activity))
  })
  const pendingRequiredActivityIds = step.requiredActivityIds.filter((id) => !completedRequiredActivityIds.includes(id))
  const startedRequiredActivityIds = step.requiredActivityIds.filter((activityId) =>
    snapshot.sessions.items.some((session) => session.activityId === activityId))
  const practiceActivityIds = step.requiredActivityIds.filter((activityId) => {
    const contract = snapshot.product.activities.find(({ id }) => id === activityId)?.pedagogicalContract
    return contract?.purpose !== 'mastery-check'
      && contract?.assessmentIntent !== 'demonstration'
      && contract?.purpose !== 'retention'
      && contract?.assessmentIntent !== 'retention'
  })
  const pendingPracticeIds = practiceActivityIds.filter((id) => !completedRequiredActivityIds.includes(id))
  const startedPractice = practiceActivityIds.some((id) => startedRequiredActivityIds.includes(id))
  const practiceStatus: AcademyPracticeStatus = pendingPracticeIds.length === 0
    ? 'satisfied'
    : startedPractice ? 'in-progress' : 'not-started'
  const mastery = masteryForStep(snapshot, step, exposureStatus, now)
  const evidence = physicalEvidence(
    snapshot,
    [...step.requiredActivityIds, ...step.optionalActivityIds],
    chapter.physicalEvidencePolicy.physicalCompetenceClaim,
    chapter.physicalEvidencePolicy.note,
  )
  return {
    stepId: step.stepId,
    lessonId: step.lessonId,
    studyRecognition,
    exposureStatus,
    practiceStatus,
    masteryStatus: mastery.masteryStatus,
    physicalEvidenceStatus: evidence.status,
    completedRequiredActivityIds,
    pendingRequiredActivityIds,
    startedRequiredActivityIds,
    demonstratedCompetencyIds: mastery.demonstratedCompetencyIds,
    retainedCompetencyIds: mastery.retainedCompetencyIds,
    coreAvailableComplete: exposureStatus === 'studied' && pendingRequiredActivityIds.length === 0,
  }
}

function aggregateExposure(steps: AcademyLearnerStepProgress[]): AcademyExposureStatus {
  return steps.every(({ exposureStatus }) => exposureStatus === 'studied')
    ? 'studied'
    : steps.some(({ exposureStatus }) => exposureStatus !== 'not-started') ? 'in-progress' : 'not-started'
}

function aggregatePractice(steps: AcademyLearnerStepProgress[]): AcademyPracticeStatus {
  return steps.every(({ practiceStatus }) => practiceStatus === 'satisfied')
    ? 'satisfied'
    : steps.some(({ practiceStatus }) => practiceStatus !== 'not-started') ? 'in-progress' : 'not-started'
}

function aggregateMastery(steps: AcademyLearnerStepProgress[]): AcademyMasteryStatus {
  const assessed = steps.filter(({ masteryStatus }) => masteryStatus !== 'not-assessed')
  if (assessed.length === 0) return 'not-assessed'
  if (assessed.every(({ masteryStatus }) => masteryStatus === 'retained')) return 'retained'
  if (assessed.some(({ masteryStatus }) => masteryStatus === 'retention-due')) return 'retention-due'
  if (assessed.every(({ masteryStatus }) => masteryStatus === 'demonstrated' || masteryStatus === 'retained')) return 'demonstrated'
  if (assessed.some(({ masteryStatus }) => masteryStatus === 'demonstration-due')) return 'demonstration-due'
  return 'not-assessed'
}

interface AcademyMasteryCoverageProjection {
  status: AcademyMasteryCoverageStatus
  assessedStepIds: string[]
  unassessedStepIds: string[]
  representedCompetencyIds: string[]
  complete: boolean
  chapterMasteryClaimAllowed: boolean
}

function assessedCompetenciesForStep(
  snapshot: LearningApplicationSnapshot,
  step: AcademyLearnerStep,
): string[] {
  return unique(step.requiredActivityIds.flatMap((activityId) => {
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    if (!activity) return []
    const contract = activity.pedagogicalContract
    return contract?.purpose === 'mastery-check' || contract?.assessmentIntent === 'demonstration'
      ? activity.competencyIds
      : []
  }))
}

function projectMasteryCoverage(
  snapshot: LearningApplicationSnapshot,
  chapter: AcademyLearnerChapter,
): AcademyMasteryCoverageProjection {
  const competenciesByStep = new Map(chapter.steps.map((step) => [
    step.stepId,
    assessedCompetenciesForStep(snapshot, step),
  ]))
  const assessedStepIds = chapter.steps
    .filter((step) => (competenciesByStep.get(step.stepId)?.length ?? 0) > 0)
    .map(({ stepId }) => stepId)
  const unassessedStepIds = chapter.steps
    .filter(({ stepId }) => !assessedStepIds.includes(stepId))
    .map(({ stepId }) => stepId)
  const representedCompetencyIds = unique([...competenciesByStep.values()].flat())

  if (chapter.masteryCoveragePolicy === 'none') {
    return {
      status: 'none',
      assessedStepIds,
      unassessedStepIds,
      representedCompetencyIds,
      complete: false,
      chapterMasteryClaimAllowed: false,
    }
  }

  const complete = chapter.masteryCoveragePolicy === 'chapter-capstone'
    ? Boolean(chapter.masteryCapstoneStepId && assessedStepIds.includes(chapter.masteryCapstoneStepId))
    : chapter.masteryCoveragePolicy === 'explicit-competency-set'
      ? chapter.masteryCoverageCompetencyIds.length > 0
        && chapter.masteryCoverageCompetencyIds.every((id) => representedCompetencyIds.includes(id))
      : chapter.steps.length > 0 && unassessedStepIds.length === 0

  return {
    status: assessedStepIds.length === 0 ? 'none' : complete ? 'complete' : 'partial',
    assessedStepIds,
    unassessedStepIds,
    representedCompetencyIds,
    complete,
    chapterMasteryClaimAllowed: complete,
  }
}

function masteryWithCoverage(
  masteryStatus: AcademyMasteryStatus,
  coverage: AcademyMasteryCoverageProjection,
): AcademyChapterMasteryStatus {
  if (coverage.status !== 'partial') return masteryStatus
  if (masteryStatus === 'retained') return 'partially-retained'
  if (masteryStatus === 'demonstrated' || masteryStatus === 'retention-due') return 'partially-demonstrated'
  return masteryStatus
}

function legacyState(
  exposureStatus: AcademyExposureStatus,
  practiceStatus: AcademyPracticeStatus,
  masteryStatus: AcademyChapterMasteryStatus,
): AcademyPathLearningState {
  if (masteryStatus === 'retained') return 'consolidated'
  if (masteryStatus === 'demonstrated' || masteryStatus === 'retention-due') return 'demonstrated'
  if (practiceStatus === 'in-progress') return 'practising'
  if (exposureStatus !== 'not-started' || practiceStatus === 'satisfied') return 'studying'
  return 'not-started'
}

function rawChapterProgress(
  snapshot: LearningApplicationSnapshot,
  localState: AcademyLocalState | undefined,
  chapter: AcademyLearnerChapter,
  now: string,
): AcademyChapterProgress {
  const steps = chapter.steps.map((step) => stepProgress(snapshot, localState, chapter, step, now))
  const exposureStatus = aggregateExposure(steps)
  const practiceStatus = aggregatePractice(steps)
  const masteryCoverage = projectMasteryCoverage(snapshot, chapter)
  const masteryStatus = masteryWithCoverage(aggregateMastery(steps), masteryCoverage)
  const benchEvidenceStatus = physicalEvidence(
    snapshot,
    chapter.steps.flatMap(({ requiredActivityIds, optionalActivityIds }) => [...requiredActivityIds, ...optionalActivityIds]),
    chapter.physicalEvidencePolicy.physicalCompetenceClaim,
    chapter.physicalEvidencePolicy.note,
  )
  const completedRequiredActivityIds = steps.flatMap(({ completedRequiredActivityIds: ids }) => ids)
  const pendingRequiredActivityIds = steps.flatMap(({ pendingRequiredActivityIds: ids }) => ids)
  const studiedAnchorLessonIds = steps.filter(({ exposureStatus: status }) => status === 'studied').map(({ lessonId }) => lessonId)
  const coreAvailableComplete = steps.every(({ coreAvailableComplete }) => coreAvailableComplete)
  return {
    chapterId: chapter.chapterId,
    state: legacyState(exposureStatus, practiceStatus, masteryStatus),
    exposureStatus,
    practiceStatus,
    masteryStatus,
    masteryCoveragePolicy: chapter.masteryCoveragePolicy,
    masteryCoverageStatus: masteryCoverage.status,
    assessedStepIds: masteryCoverage.assessedStepIds,
    unassessedStepIds: masteryCoverage.unassessedStepIds,
    representedCompetencyIds: masteryCoverage.representedCompetencyIds,
    coverageComplete: masteryCoverage.complete,
    chapterMasteryClaimAllowed: masteryCoverage.chapterMasteryClaimAllowed,
    physicalEvidenceStatus: benchEvidenceStatus.status,
    coverageStatus: chapter.coverageStatus,
    coreAvailableComplete,
    curriculumComplete: coreAvailableComplete && chapter.coverageStatus === 'complete',
    studyRecognitionByLesson: Object.fromEntries(steps.map(({ lessonId, studyRecognition }) => [lessonId, studyRecognition])),
    completedRequiredActivityIds,
    pendingRequiredActivityIds,
    demonstratedCompetencyIds: unique(steps.flatMap(({ demonstratedCompetencyIds: ids }) => ids)),
    retainedCompetencyIds: unique(steps.flatMap(({ retainedCompetencyIds: ids }) => ids)),
    steps,
    studiedAnchorLessonIds,
    startedRequiredActivityIds: unique(steps.flatMap(({ startedRequiredActivityIds }) => startedRequiredActivityIds)),
    anchorLessonsCompleted: studiedAnchorLessonIds.length,
    anchorLessonsTotal: steps.length,
    requiredActivitiesCompleted: completedRequiredActivityIds.length,
    requiredActivitiesTotal: chapter.steps.reduce((total, step) => total + step.requiredActivityIds.length, 0),
    coreComplete: coreAvailableComplete,
    benchEvidenceStatus,
  }
}

function optionalProgress(
  snapshot: LearningApplicationSnapshot,
  path: AcademyLearnerPathDefinition,
): AcademyOptionalExplorationProgress {
  const coreActivityIds = new Set(path.chapters.flatMap(({ steps }) => steps.flatMap(({ requiredActivityIds }) => requiredActivityIds)))
  const optionalActivityIds = new Set(path.chapters.flatMap(({ steps }) => steps.flatMap(({ optionalActivityIds }) => optionalActivityIds)))
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
  now = new Date().toISOString(),
): AcademyPathProgress {
  const chapters = path.chapters.map((item) => rawChapterProgress(snapshot, localState, item, now))
  const chapterById = new Map(chapters.map((item) => [item.chapterId, item]))
  let currentChapterId: string | undefined
  for (const chapterItem of path.chapters) {
    const progress = chapterById.get(chapterItem.chapterId)!
    const prerequisitesComplete = chapterItem.prerequisiteChapterIds.every((id) => chapterById.get(id)?.coreAvailableComplete)
    if (!progress.coreAvailableComplete && !currentChapterId && prerequisitesComplete) currentChapterId = chapterItem.chapterId
    if (!prerequisitesComplete) progress.state = chapterItem.coverageStatus === 'planned' ? 'planned' : 'blocked'
    else if (progress.state === 'not-started') progress.state = currentChapterId === chapterItem.chapterId ? 'current' : 'available'
    if (progress.coreAvailableComplete && chapterItem.coverageStatus !== 'complete') progress.state = 'partial-content'
    else if (!progress.coreAvailableComplete && chapterItem.coverageStatus === 'partial' && ['current', 'available'].includes(progress.state)) progress.state = 'partial-content'
  }
  const stages: AcademyStageProgress[] = path.stages.map((stageItem) => {
    const stageChapters = stageItem.chapterIds.map((id) => chapterById.get(id)!).filter(Boolean)
    const completedChapterIds = stageChapters.filter(({ coreAvailableComplete }) => coreAvailableComplete).map(({ chapterId }) => chapterId)
    const coreAvailableComplete = completedChapterIds.length === stageChapters.length
    const curriculumComplete = coreAvailableComplete
      && stageItem.coverageStatus === 'complete'
      && stageChapters.every((chapter) => chapter.curriculumComplete)
    const hasStarted = stageChapters.some(({ exposureStatus, practiceStatus }) =>
      exposureStatus !== 'not-started' || practiceStatus !== 'not-started')
    return {
      stageId: stageItem.stageId,
      state: coreAvailableComplete
        ? stageItem.coverageStatus === 'complete' ? 'studying' : 'partial-content'
        : hasStarted ? 'studying' : 'not-started',
      completedChapterIds,
      chaptersCompleted: completedChapterIds.length,
      chaptersTotal: stageChapters.length,
      coreAvailableComplete,
      curriculumComplete,
      coreComplete: coreAvailableComplete,
      coverageStatus: stageItem.coverageStatus,
    }
  })
  const currentStageId = stages.find((item) => !item.coreAvailableComplete)?.stageId
  for (const stage of stages) {
    if (stage.coreAvailableComplete) continue
    const prerequisites = path.stages.find(({ stageId }) => stageId === stage.stageId)?.prerequisiteStageIds ?? []
    const prerequisitesComplete = prerequisites.every((id) => stages.find(({ stageId }) => stageId === id)?.coreAvailableComplete)
    stage.state = stage.stageId === currentStageId ? 'current' : prerequisitesComplete ? 'available' : 'blocked'
  }
  const physicalEvidenceIds = unique(chapters.flatMap(({ benchEvidenceStatus }) => benchEvidenceStatus.physicalEvidenceIds))
  const physicalChapters = chapters.filter(({ benchEvidenceStatus }) => benchEvidenceStatus.required)
  const coveragePendingStageIds = stages.filter(({ coverageStatus }) => coverageStatus !== 'complete').map(({ stageId }) => stageId)
  const coreAvailableComplete = stages.every(({ coreAvailableComplete }) => coreAvailableComplete)
  const curriculumComplete = stages.every(({ curriculumComplete }) => curriculumComplete)
  return {
    pathId: path.pathId,
    currentStageId,
    currentChapterId,
    completedStageIds: stages.filter(({ coreAvailableComplete: complete }) => complete).map(({ stageId }) => stageId),
    stagesCompleted: stages.filter(({ coreAvailableComplete: complete }) => complete).length,
    stagesTotal: stages.length,
    anchorLessonsCompleted: chapters.reduce((total, item) => total + item.anchorLessonsCompleted, 0),
    anchorLessonsTotal: chapters.reduce((total, item) => total + item.anchorLessonsTotal, 0),
    requiredActivitiesCompleted: chapters.reduce((total, item) => total + item.requiredActivitiesCompleted, 0),
    requiredActivitiesTotal: chapters.reduce((total, item) => total + item.requiredActivitiesTotal, 0),
    coreAvailableComplete,
    curriculumComplete,
    coveragePendingStageIds,
    plannedCurriculumItems: new Set(path.chapters
      .filter(({ stageId }) => coveragePendingStageIds.includes(stageId))
      .flatMap(({ plannedContentRefs }) => plannedContentRefs)).size,
    coreComplete: coreAvailableComplete,
    chapters,
    stages,
    benchEvidenceStatus: {
      required: physicalChapters.length > 0,
      status: physicalChapters.length === 0
        ? 'not-required'
        : physicalChapters.every(({ physicalEvidenceStatus }) => physicalEvidenceStatus === 'reviewed')
          ? 'reviewed'
          : physicalChapters.some(({ physicalEvidenceStatus }) => physicalEvidenceStatus === 'documented' || physicalEvidenceStatus === 'reviewed')
            ? 'documented'
            : 'pending',
      physicalEvidenceIds,
      note: 'La evidencia de banco se calcula aparte y nunca se convierte en demostración o retención por sí sola.',
    },
    optionalExplorationProgress: optionalProgress(snapshot, path),
  }
}
