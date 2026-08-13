import type {
  LearningApplicationSnapshot,
  LearningRecommendation,
} from '../application/service'
import { localize } from '../application/i18n'
import type { LearningActivityDescriptor } from '../product/demoPackage'
import {
  academyNextLearningUnit,
  academyRouteProgress,
  academyRoutePrerequisiteStatus,
  academyRouteTree,
  realAcademyRoutes,
} from './academyCatalog'
import {
  normalizeAcademyLocalState,
  type AcademyLocalState,
  type AcademyOnboarding,
} from './academyLocalState'
import { buildAcademyLearnerModel } from './academyPersonalization'
import {
  academyCurriculumRoute,
  canonicalAcademyRouteIds,
  coreAcademyRouteIds,
} from './academyCurriculum'

export type AcademyPlanBasis =
  | 'recovery'
  | 'review-due'
  | 'remediation'
  | 'misconception'
  | 'demonstration'
  | 'transfer'
  | 'route-progression'
  | 'self-report'
  | 'curriculum'

export interface AcademyStudyPlanStep extends LearningRecommendation {
  basis: AcademyPlanBasis
  routeId?: string
  lessonId?: string
  activityId?: string
}

function stateFromSnapshot(
  snapshot: LearningApplicationSnapshot,
  now: string,
): AcademyLocalState | undefined {
  const profile = snapshot.profile
  const value = profile?.educationalPreferences.academyStateV1
  if (!profile || !value) return undefined
  return normalizeAcademyLocalState(profile.id, value, now)
}

function activitiesForCompetency(
  snapshot: LearningApplicationSnapshot,
  competencyId: string,
): LearningActivityDescriptor[] {
  return snapshot.product.activities.filter(({ competencyIds, demo }) =>
    !demo && competencyIds.includes(competencyId))
}

function activityCanDemonstrate(activity: LearningActivityDescriptor): boolean {
  const contract = activity.pedagogicalContract
  return contract?.assessmentIntent === 'demonstration' || contract?.purpose === 'transfer'
}

function guidedPracticeForCompetency(
  snapshot: LearningApplicationSnapshot,
  competencyId: string,
): LearningActivityDescriptor | undefined {
  const rank = (activity: LearningActivityDescriptor) => {
    const purpose = activity.pedagogicalContract?.purpose
    const intent = activity.pedagogicalContract?.assessmentIntent
    if (intent === 'formative' && purpose === 'guided-practice') return 0
    if (intent === 'formative') return 1
    if (purpose === 'independent-practice') return 2
    if (activityCanDemonstrate(activity)) return 3
    if (intent === 'none') return 5
    return 4
  }
  return activitiesForCompetency(snapshot, competencyId)
    .sort((left, right) => rank(left) - rank(right))[0]
}

function demonstrationForCompetency(
  snapshot: LearningApplicationSnapshot,
  competencyId: string,
): { activity: LearningActivityDescriptor; adaptive: boolean } | undefined {
  const candidates = activitiesForCompetency(snapshot, competencyId)
    .sort((left, right) => {
      const rank = (activity: LearningActivityDescriptor) => {
        if (activity.pedagogicalContract?.purpose === 'mastery-check') return 0
        if (activity.pedagogicalContract?.purpose === 'independent-practice') return 1
        if (activity.pedagogicalContract?.purpose === 'transfer') return 2
        if (activity.pedagogicalContract?.supportLevel === 'independent') return 3
        if (activity.pedagogicalContract?.supportLevel === 'faded') return 4
        return 5
      }
      return rank(left) - rank(right)
    })
  const authored = candidates.find(activityCanDemonstrate)
  if (authored) return { activity: authored, adaptive: false }
  const fallback = candidates[0]
  // El runtime convierte `mode=demonstration` en una evaluación independiente
  // y demostrable, aun cuando el único caso editorial disponible sea formativo.
  // Así una competencia no puede quedar atrapada para siempre en practising.
  return fallback ? { activity: fallback, adaptive: true } : undefined
}

function retentionForCompetency(
  snapshot: LearningApplicationSnapshot,
  competencyId: string,
): LearningActivityDescriptor | undefined {
  return activitiesForCompetency(snapshot, competencyId)
    .sort((left, right) => {
      const rank = (activity: LearningActivityDescriptor) => {
        if (activity.pedagogicalContract?.purpose === 'retention') return 0
        if (activity.pedagogicalContract?.supportLevel === 'independent') return 1
        if (activityCanDemonstrate(activity)) return 2
        return 3
      }
      return rank(left) - rank(right)
    })[0]
}

function transferForCompetency(
  snapshot: LearningApplicationSnapshot,
  competencyId: string,
): LearningActivityDescriptor | undefined {
  return snapshot.product.activities
    .filter(({ competencyIds, demo }) => !demo && competencyIds.includes(competencyId))
    .sort((left, right) => {
      const rank = (activity: LearningActivityDescriptor) =>
        activity.pedagogicalContract?.evidenceLevel === 'transfer'
          ? 0
          : activity.pedagogicalContract?.purpose === 'mastery-check'
            ? 1
            : activity.deliberatePractice?.attempts.some(({ phase }) => phase === 'transfer')
              ? 2
              : 3
      return rank(left) - rank(right)
    })[0]
}

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Convierte preferencias en destinos, nunca en acreditaciones. Los
 * prerrequisitos de estos destinos se siguen resolviendo con evidencia real.
 */
export function academyOnboardingTargetRouteIds(onboarding?: AcademyOnboarding): string[] {
  if (!onboarding?.completed) return []
  const targets: string[] = []
  const add = (routeId: string) => {
    if (!targets.includes(routeId)) targets.push(routeId)
  }
  for (const rawGoal of onboarding.goals) {
    const goal = normalized(rawGoal)
    if (goal.includes('comprender') || goal.includes('funcionamiento')) add('route.mechanical.foundations')
    if (goal.includes('reconocer') || goal.includes('pieza')) add('route.encyclopedia.history-language')
    if (goal.includes('montaje') || goal.includes('diagnost')) add('route.advanced.service-method')
    if (goal.includes('calculo') || goal.includes('metrolog')) add('route.metrology.physical-digital-bridge')
    if (goal.includes('comparar') || goal.includes('calibre')) add('route.advanced.comparative-atlas')
    if (goal.includes('disenar') || goal.includes('propio')) add('route.capstone.personal-watch-design')
  }
  if (onboarding.experience === 'quartz-practice' || onboarding.quartzKnowledge === 'practical') {
    add('route.quartz2035.isa-to-2035')
  }
  if (onboarding.experience === 'mechanical-practice' || onboarding.mechanicalKnowledge === 'practical') {
    add('route.miyota8215.complete')
  }
  if (onboarding.experience === 'advanced') add('route.advanced.architectures-complications')
  return targets
}

function prerequisiteClosure(routeIds: readonly string[]): Set<string> {
  const closure = new Set<string>()
  const visit = (routeId: string) => {
    if (closure.has(routeId)) return
    closure.add(routeId)
    for (const prerequisiteId of academyCurriculumRoute(routeId)?.prerequisiteRouteIds ?? []) visit(prerequisiteId)
  }
  routeIds.forEach(visit)
  return closure
}

function estimatedMinutesForNextUnit(
  snapshot: LearningApplicationSnapshot,
  routeId: string,
): number | undefined {
  const unit = academyNextLearningUnit(snapshot, routeId)
  if (!unit) return undefined
  if (unit.kind === 'activity') {
    return snapshot.product.activities.find(({ id }) => id === unit.activityId)?.durationMinutes
  }
  const lesson = snapshot.product.lessons.find(({ id }) => id === unit.lessonId)
  const durations = (lesson?.activityIds ?? []).flatMap((activityId) => {
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    return activity ? [activity.durationMinutes] : []
  })
  return durations.length > 0 ? Math.min(...durations) : undefined
}

function personalizationScore(
  snapshot: LearningApplicationSnapshot,
  routeId: string,
  canonicalIndex: number,
  onboarding: AcademyOnboarding | undefined,
  targets: ReadonlySet<string>,
  targetClosure: ReadonlySet<string>,
): number {
  let score = 10_000 - canonicalIndex * 100
  if (!onboarding?.completed) return score
  if (targets.has(routeId)) score += 4_000
  else if (targetClosure.has(routeId)) score += 700

  const route = academyCurriculumRoute(routeId)
  const goalText = normalized(onboarding.goals.join(' '))
  const goalFocus = new Set<string>()
  if (/comprender|funcionamiento/.test(goalText)) goalFocus.add('understand')
  if (/reconocer|pieza/.test(goalText)) goalFocus.add('parts')
  if (/montaje|diagnost/.test(goalText)) goalFocus.add('service')
  if (/calculo|metrolog/.test(goalText)) goalFocus.add('engineering')
  if (/comparar|calibre/.test(goalText)) goalFocus.add('compare')
  if (/disenar|propio/.test(goalText)) goalFocus.add('design')
  score += (route?.focus.filter((focus) => goalFocus.has(focus)).length ?? 0) * 180

  const hasPracticalTools = onboarding.tools.length > 0 || onboarding.hasDisassembledMovement
  const physicalRoute = /bench-foundations|workshop-tools-materials|metrology\.physical|service|miyota8215|manufacturing/.test(routeId)
  if (physicalRoute) score += hasPracticalTools ? 260 : -260
  if (!hasPracticalTools && routeId === 'route.mechanical.foundations') score += 320
  if (onboarding.experience === 'quartz-practice' && route?.strand === 'quartz') score += 500
  if (
    (onboarding.experience === 'mechanical-practice' || onboarding.experience === 'advanced')
    && route?.strand === 'mechanical'
  ) score += 260

  const duration = estimatedMinutesForNextUnit(snapshot, routeId)
  if (duration !== undefined) {
    const difference = onboarding.sessionMinutes - duration
    score += difference >= 0
      ? Math.max(0, 100 - difference * 2)
      : Math.max(-220, difference * 12)
  }
  return score
}

function personalizedCurriculumRouteId(
  snapshot: LearningApplicationSnapshot,
  state?: AcademyLocalState,
): string | undefined {
  const orientationId = 'route.horology.orientation'
  if (!academyRouteProgress(snapshot, orientationId).routeComplete) return orientationId

  const onboarding = state?.onboarding
  const targets = academyOnboardingTargetRouteIds(onboarding)
  const targetSet = new Set(targets)
  const targetClosure = prerequisiteClosure(targets)
  const candidateSet = new Set([
    ...coreAcademyRouteIds(snapshot.product),
    ...targetClosure,
  ])
  const canonical = canonicalAcademyRouteIds(snapshot.product)
  return canonical
    .filter((routeId) => candidateSet.has(routeId))
    .filter((routeId) => !academyRouteProgress(snapshot, routeId).routeComplete)
    .filter((routeId) => academyRoutePrerequisiteStatus(snapshot, routeId).ready)
    .map((routeId) => ({
      routeId,
      score: personalizationScore(
        snapshot,
        routeId,
        canonical.indexOf(routeId),
        onboarding,
        targetSet,
        targetClosure,
      ),
    }))
    .sort((left, right) => right.score - left.score || left.routeId.localeCompare(right.routeId))[0]?.routeId
}

function personalizeRouteStep(
  step: AcademyStudyPlanStep,
  routeId: string,
  onboarding?: AcademyOnboarding,
): AcademyStudyPlanStep {
  if (!onboarding?.completed) return step
  const selectedGoal = onboarding.goals[0]
  const tools = onboarding.tools.length > 0
    ? `Tienes ${onboarding.tools.length} herramienta(s) declarada(s); la actividad seguirá marcando qué parte es solo digital.`
    : 'No has declarado herramientas: priorizamos comprensión digital y no suponemos práctica física.'
  return {
    ...step,
    basis: 'self-report',
    rule: 'onboarding-goal-time-tools-with-evidence-gates@1.0.0',
    reason: [
      selectedGoal ? `Tu objetivo «${selectedGoal}» orienta esta recomendación.` : 'Tu punto de partida orienta esta recomendación.',
      `Está ajustada a una sesión de ${onboarding.sessionMinutes} minutos.`,
      tools,
      `La familiaridad declarada no salta los prerrequisitos de ${routeId}; solo evidencia guardada puede hacerlo.`,
    ].join(' '),
  }
}

function routeStep(
  snapshot: LearningApplicationSnapshot,
  routeId: string,
): AcademyStudyPlanStep | undefined {
  const unit = academyNextLearningUnit(snapshot, routeId)
  if (!unit) return undefined
  return {
    id: `recommendation.route.${routeId}.${unit.kind}.${unit.kind === 'activity' ? unit.activityId : unit.lessonId}`,
    kind: 'continue-route',
    title: unit.title,
    reason: unit.kind === 'activity'
      ? unit.reason === 'resume'
        ? 'Retoma el último punto seguro antes de abrir contenido nuevo.'
        : 'Ya has trabajado la explicación necesaria; ahora toca practicar y producir evidencia.'
      : 'Primero estudia esta explicación. La práctica se abrirá después, cuando tengas la base necesaria.',
    rule: 'single-study-plan-route-progression@2.0.0',
    priority: 70,
    evidenceIds: [],
    href: unit.href,
    required: false,
    basis: 'route-progression',
    routeId,
    lessonId: unit.lessonId,
    activityId: unit.kind === 'activity' ? unit.activityId : undefined,
  }
}

function prerequisiteStep(
  snapshot: LearningApplicationSnapshot,
  blockedRouteId: string,
  prerequisiteRouteId: string,
): AcademyStudyPlanStep | undefined {
  const prerequisite = snapshot.product.routes.find(({ id }) => id === prerequisiteRouteId)
  const blocked = snapshot.product.routes.find(({ id }) => id === blockedRouteId)
  if (!prerequisite) return undefined
  return {
    id: `recommendation.prerequisite.${blockedRouteId}.${prerequisiteRouteId}`,
    kind: 'complete-prerequisite',
    title: `Completar antes: ${localize(snapshot.profile?.locale, prerequisite.title)}`,
    reason: blocked
      ? `${localize(snapshot.profile?.locale, blocked.title)} se apoya en esta ruta. Debes completar sus prácticas y su demostración final antes de continuar.`
      : 'Esta base es necesaria antes de continuar el recorrido guiado.',
    rule: 'canonical-curriculum-prerequisite-gate@1.0.0',
    priority: 85,
    evidenceIds: [],
    href: `#/learning/route/${encodeURIComponent(prerequisiteRouteId)}`,
    required: true,
    basis: 'curriculum',
    routeId: prerequisiteRouteId,
  }
}

export function academyStudyPlan(
  snapshot: LearningApplicationSnapshot,
  explicitState?: AcademyLocalState,
  now = new Date().toISOString(),
): AcademyStudyPlanStep[] {
  const state = explicitState ?? stateFromSnapshot(snapshot, now)
  const steps: AcademyStudyPlanStep[] = []
  const interrupted = snapshot.sessions.items
    .filter(({ state: sessionState }) =>
      sessionState === 'interrupted' || sessionState === 'suspended')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  if (interrupted) {
    const activity = snapshot.product.activities.find(({ id }) => id === interrupted.activityId)
    return [{
      id: `recommendation.recover.${interrupted.id}`,
      kind: 'recover-session',
      title: activity
        ? `Retomar: ${localize(snapshot.profile?.locale, activity.title)}`
        : 'Retomar la práctica guardada',
      reason: 'Hay una práctica interrumpida con un punto de recuperación seguro.',
      rule: 'recovery-before-new-attempt@2.0.0',
      priority: 100,
      evidenceIds: [],
      href: `#/learning/recovery/${encodeURIComponent(interrupted.id)}`,
      required: true,
      basis: 'recovery',
      activityId: interrupted.activityId,
    }]
  }

  const learnerModel = buildAcademyLearnerModel(snapshot, now)
  const misconception = learnerModel.activeMisconceptions[0]
  if (misconception) {
    steps.push({
      id: `recommendation.misconception.${misconception.id}.${misconception.evidenceId}`,
      kind: 'remediate-misconception',
      title: `Revisar una idea: ${misconception.title}`,
      reason: `${misconception.diagnosis} Vuelve a la explicación, corrige una sola relación y repite después con otra variante.`,
      rule: 'active-misconception-before-progression@1.0.0',
      priority: 95,
      evidenceIds: [misconception.evidenceId],
      href: `#/learning/lesson/${encodeURIComponent(misconception.remediationLessonId)}?mode=remediation&misconception=${encodeURIComponent(misconception.id)}`,
      required: false,
      basis: 'misconception',
      lessonId: misconception.remediationLessonId,
      activityId: misconception.activityId,
    })
  }

  const snoozes = new Map(state?.reviewSnoozes.map(({ competencyId, until }) =>
    [competencyId, until]) ?? [])
  const reviewDue = snapshot.mastery.items
    .filter(({ state: masteryState, nextReviewAt, competencyId }) =>
      masteryState === 'demonstrated'
      && Boolean(nextReviewAt)
      && nextReviewAt! <= now
      && (snoozes.get(competencyId) ?? '') <= now)
    .sort((left, right) => (left.nextReviewAt ?? '').localeCompare(right.nextReviewAt ?? ''))[0]
  if (reviewDue) {
    const activity = retentionForCompetency(snapshot, reviewDue.competencyId)
    steps.push({
      id: `recommendation.retention.${reviewDue.competencyId}`,
      kind: 'retention',
      title: 'Repaso de recuperación pendiente',
      reason: `Es el repaso ${reviewDue.reviewStage ?? 1} de 3. Recupera la idea sin consultar la solución y comprueba después.`,
      rule: 'spaced-retrieval-due-date@2.0.0',
      priority: 90,
      evidenceIds: reviewDue.primaryEvidenceIds,
      href: activity
        ? `#/learning/activity/${encodeURIComponent(activity.id)}?mode=retention`
        : '#/learning/review',
      required: false,
      basis: 'review-due',
      activityId: activity?.id,
    })
  }

  const learning = snapshot.mastery.items
    .filter(({ state: masteryState }) =>
      masteryState === 'introduced' || masteryState === 'practising')
    .sort((left, right) => {
      const stateDifference = Number(right.state === 'practising') - Number(left.state === 'practising')
      return stateDifference || (right.latestValidEvidenceAt ?? '').localeCompare(left.latestValidEvidenceAt ?? '')
    })[0]
  if (learning) {
    const guided = learning.state === 'introduced'
      ? guidedPracticeForCompetency(snapshot, learning.competencyId)
      : undefined
    const useGuided = guided?.pedagogicalContract?.assessmentIntent === 'formative'
    const challenge = useGuided
      ? undefined
      : demonstrationForCompetency(snapshot, learning.competencyId)
    const activity = guided && useGuided ? guided : challenge?.activity
    if (activity && useGuided) {
      steps.push({
        id: `recommendation.practice.${learning.competencyId}`,
        kind: 'practice-competency',
        title: `Practicar con apoyo: ${localize(snapshot.profile?.locale, activity.title)}`,
        reason: 'La idea ya fue presentada. Haz una práctica formativa y el siguiente intento reducirá la ayuda para poder demostrarla.',
        rule: 'introduced-to-guided-practice-once@1.0.0',
        priority: 78,
        evidenceIds: learning.primaryEvidenceIds,
        href: `#/learning/activity/${encodeURIComponent(activity.id)}`,
        required: false,
        basis: 'remediation',
        activityId: activity.id,
      })
    } else if (activity && challenge) {
      steps.push({
        id: `recommendation.demonstrate.${learning.competencyId}`,
        kind: 'practice-competency',
        title: `Demostrar sin ayuda: ${localize(snapshot.profile?.locale, activity.title)}`,
        reason: challenge.adaptive
          ? 'La práctica guiada ya no puede elevar esta competencia. Se abre una variante independiente, sin pistas, que sí puede producir una demostración.'
          : 'Ya existe práctica suficiente. Resuelve ahora una comprobación independiente para demostrar la competencia.',
        rule: 'practising-must-progress-to-independent-demonstration@1.0.0',
        priority: 82,
        evidenceIds: learning.primaryEvidenceIds,
        href: `#/learning/activity/${encodeURIComponent(activity.id)}?mode=demonstration`,
        required: false,
        basis: 'demonstration',
        activityId: activity.id,
      })
    }
  }


  const transferPending = snapshot.mastery.items
    .filter(({ state: masteryState, transferEvidenceIds }) =>
      masteryState === 'demonstrated' && (transferEvidenceIds?.length ?? 0) === 0)
    .sort((left, right) => (left.latestDemonstratedAt ?? '').localeCompare(right.latestDemonstratedAt ?? ''))[0]
  if (transferPending) {
    const activity = transferForCompetency(snapshot, transferPending.competencyId)
    if (activity) {
      steps.push({
        id: `recommendation.transfer.${transferPending.competencyId}`,
        kind: 'transfer-competency',
        title: `Transferir: ${localize(snapshot.profile?.locale, activity.title)}`,
        reason: 'Ya existe una demostración, pero todavía falta aplicar el criterio en otro contexto sin heredar geometría, medidas ni autoridad.',
        rule: 'demonstration-before-transfer@1.0.0',
        priority: 75,
        evidenceIds: transferPending.primaryEvidenceIds,
        href: `#/learning/activity/${encodeURIComponent(activity.id)}?mode=transfer`,
        required: false,
        basis: 'transfer',
        activityId: activity.id,
      })
    }
  }

  const latestSession = snapshot.sessions.items
    .filter(({ activityId }) => snapshot.product.activities.some(({ id, demo }) =>
      id === activityId && !demo))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
  const activeRoute = latestSession
    ? realAcademyRoutes(snapshot.product).find((route) =>
      academyRouteTree(snapshot.product, route.id)?.activityIds.includes(latestSession.activityId))
    : undefined
  const activeRouteStatus = activeRoute
    ? academyRoutePrerequisiteStatus(snapshot, activeRoute.id)
    : undefined
  const activeRouteStep = activeRoute && activeRouteStatus?.ready
    ? routeStep(snapshot, activeRoute.id)
    : undefined
  if (activeRoute && activeRouteStatus && !activeRouteStatus.ready) {
    const prerequisite = prerequisiteStep(snapshot, activeRoute.id, activeRouteStatus.missingRouteIds[0])
    if (prerequisite) steps.push(prerequisite)
  }
  if (activeRouteStep && activeRoute) {
    steps.push(personalizeRouteStep(activeRouteStep, activeRoute.id, state?.onboarding))
  }

  if (!activeRouteStep && !steps.some(({ kind }) => kind === 'complete-prerequisite')) {
    const routeId = personalizedCurriculumRouteId(snapshot, state)
    const next = routeId ? routeStep(snapshot, routeId) : undefined
    if (routeId && next) {
      const personalized = personalizeRouteStep(next, routeId, state?.onboarding)
      if (!state?.onboarding.completed && snapshot.sessions.total === 0) {
        personalized.basis = 'curriculum'
        personalized.reason = 'Empieza por la base: vocabulario visual, funciones y relaciones causales antes de pedirte una respuesta.'
      }
      steps.push(personalized)
    }
  }

  return steps
    .filter((step, index, values) => values.findIndex(({ href }) => href === step.href) === index)
    .sort((left, right) => right.priority - left.priority)
}
