import type { LearningApplicationSnapshot } from '../application/service'
import { localize } from '../application/i18n'
import type {
  LearningActivityDescriptor,
  LearningKnowledgeNode,
  LearningRouteDescriptor,
} from '../product/demoPackage'
import type { AcademyLocalState, AcademyOnboarding } from './academyLocalState'
import {
  academyActivityAchievement,
  academyActivitySatisfiesProgression,
  academyRouteTree,
  type AcademyActivityAchievement,
} from './academyCatalog'
import { academyStudyPlan } from './academyStudyPlan'

export const LEARNING_CYCLE = [
  { id: 'prepare', label: 'Preparar', description: 'Recupera la base y conoce el objetivo.' },
  { id: 'observe', label: 'Observar', description: 'Mira primero qué cambia, sin adivinar.' },
  { id: 'explain', label: 'Comprender', description: 'Relaciona causa, transmisión y efecto.' },
  { id: 'practice', label: 'Practicar', description: 'Manipula el modelo con apoyo gradual.' },
  { id: 'demonstrate', label: 'Demostrar', description: 'Resuelve de forma independiente.' },
  { id: 'transfer', label: 'Transferir', description: 'Aplica la idea en otro contexto.' },
  { id: 'retain', label: 'Consolidar', description: 'Recupérala después de 1, 7 y 21 días.' },
] as const

export type ConceptLearningStatus =
  | 'blocked'
  | 'available'
  | 'self-declared'
  | 'introduced'
  | 'practising'
  | 'demonstrated'
  | 'retained'

export interface ConceptKnowledgeProjection {
  status: ConceptLearningStatus
  label: string
  basis: 'prerequisite' | 'none' | 'self-report' | 'evidence'
  explanation: string
  evidenceIds: string[]
}

const masteryRank = {
  not_started: 0,
  introduced: 1,
  practising: 2,
  demonstrated: 3,
  retained: 4,
} as const

function selfReportedFamiliarity(node: LearningKnowledgeNode, onboarding?: AcademyOnboarding): boolean {
  if (!onboarding?.completed) return false
  const searchable = `${node.id} ${node.subsystem} ${node.movementIds.join(' ')}`.toLowerCase()
  if (onboarding.experience === 'advanced') return true
  if (
    onboarding.quartzKnowledge === 'practical'
    && (searchable.includes('quartz') || searchable.includes('2035'))
  ) return true
  if (
    onboarding.mechanicalKnowledge === 'practical'
    && (searchable.includes('mechanical') || searchable.includes('8215'))
  ) return true
  return onboarding.hasDisassembledMovement && node.knowledgeType === 'procedural'
}

export function projectConceptKnowledge(
  snapshot: LearningApplicationSnapshot,
  node: LearningKnowledgeNode,
  onboarding?: AcademyOnboarding,
): ConceptKnowledgeProjection {
  const mastery = node.competencyIds
    .map((competencyId) => snapshot.mastery.items.find((item) => item.competencyId === competencyId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => masteryRank[right.state] - masteryRank[left.state])[0]
  if (mastery && mastery.state !== 'not_started') {
    const labels = {
      introduced: 'Presentado',
      practising: 'En práctica',
      demonstrated: 'Demostrado',
      retained: 'Consolidado',
    } as const
    return {
      status: mastery.state,
      label: labels[mastery.state],
      basis: 'evidence',
      explanation: `Estado calculado con ${mastery.primaryEvidenceIds.length} resultado(s) compatible(s).`,
      evidenceIds: mastery.primaryEvidenceIds,
    }
  }

  const prerequisitePending = node.prerequisiteIds.some((prerequisiteId) => {
    const prerequisite = snapshot.product.knowledgeNodes.find(({ id }) => id === prerequisiteId)
    return prerequisite && !prerequisite.competencyIds.some((competencyId) =>
      snapshot.mastery.items.some((item) =>
        item.competencyId === competencyId
        && (item.state === 'demonstrated' || item.state === 'retained')))
  })
  if (selfReportedFamiliarity(node, onboarding)) {
    return {
      status: 'self-declared',
      label: 'Familiaridad declarada',
      basis: 'self-report',
      explanation: prerequisitePending
        ? 'Procede de tu punto de partida. La ruta mantiene visible la base pendiente y exige evidencia antes de acreditar dominio.'
        : 'Procede de tu punto de partida. No cuenta como dominio hasta producir evidencia.',
      evidenceIds: [],
    }
  }
  if (prerequisitePending) {
    return {
      status: 'blocked',
      label: 'Base pendiente',
      basis: 'prerequisite',
      explanation: 'Puedes consultarlo, pero la ruta recomienda cubrir antes sus prerrequisitos.',
      evidenceIds: [],
    }
  }
  return {
    status: 'available',
    label: 'Disponible',
    basis: 'none',
    explanation: 'Aún no hay evidencia ni hace falta una base anterior.',
    evidenceIds: [],
  }
}

export interface PersonalizedStartingPoint {
  title: string
  reason: string
  href: string
  actionLabel: string
  basis: 'progress' | 'self-report' | 'default'
  caution?: string
}

export function personalizedStartingPoint(
  snapshot: LearningApplicationSnapshot,
  state?: AcademyLocalState,
): PersonalizedStartingPoint {
  const primary = academyStudyPlan(snapshot, state)[0]
  if (primary) {
    return {
      title: primary.title,
      reason: primary.reason,
      href: primary.href,
      actionLabel: primary.basis === 'recovery'
        ? 'Retomar práctica'
        : primary.basis === 'review-due'
          ? 'Hacer repaso'
          : primary.basis === 'demonstration'
            ? 'Demostrar sin ayuda'
          : primary.activityId
            ? 'Continuar recorrido'
            : 'Aprender antes de responder',
      basis: primary.basis === 'recovery' || snapshot.sessions.total > 0
        ? 'progress'
        : primary.basis === 'self-report'
          ? 'self-report'
          : 'default',
      caution: primary.basis === 'self-report'
        ? 'Tus respuestas iniciales adaptan el orden, pero no acreditan dominio ni permiten saltar los fundamentos sin evidencia.'
        : undefined,
    }
  }
  return {
    title: 'Explorar la Academia',
    reason: 'No queda ninguna unidad obligatoria en el plan actual. Puedes revisar, practicar o consultar el atlas.',
    href: '#/learning/explore',
    actionLabel: 'Abrir Academia',
    basis: 'progress',
  }
}

export type MilestoneStatus = 'completed' | 'current' | 'available' | 'locked'

export interface AcademyMilestoneView {
  id: string
  order: number
  title: string
  outcome: string
  lessonId: string
  activityId?: string
  mode: string
  evidenceLevel: NonNullable<LearningRouteDescriptor['learningDesign']>['milestones'][number]['evidenceLevel']
  achievement: AcademyActivityAchievement
  status: MilestoneStatus
  href: string
}

export function academyMilestoneJourney(
  snapshot: LearningApplicationSnapshot,
  route: LearningRouteDescriptor,
): AcademyMilestoneView[] {
  const design = route.learningDesign
  if (!design) return []
  const milestones = [...design.milestones].sort((left, right) => left.order - right.order)
  const satisfies = (activityId?: string) => {
    if (!activityId) return true
    const activity = snapshot.product.activities.find(({ id }) => id === activityId)
    return activity ? academyActivitySatisfiesProgression(snapshot, activity) : false
  }
  const nextRequired = milestones.find((milestone) => !milestone.optional && !satisfies(milestone.activityId))
  return milestones
    .map((milestone) => {
      const activity = milestone.activityId
        ? snapshot.product.activities.find(({ id }) => id === milestone.activityId)
        : undefined
      const achievement = activity
        ? academyActivityAchievement(snapshot, activity)
        : 'not-started'
      const isComplete = activity
        ? academyActivitySatisfiesProgression(snapshot, activity)
        : false
      let status: MilestoneStatus
      if (isComplete) status = 'completed'
      else if (!milestone.optional && milestone.id === nextRequired?.id) status = 'current'
      else {
        const prior = milestones
          .filter(({ order, optional }) => order < milestone.order && !optional)
          .every(({ activityId }) => satisfies(activityId))
        status = prior ? 'available' : 'locked'
      }
      return {
        id: milestone.id,
        order: milestone.order,
        title: localize(snapshot.profile?.locale, milestone.title),
        outcome: localize(snapshot.profile?.locale, milestone.outcome),
        lessonId: milestone.lessonId,
        activityId: milestone.activityId,
        mode: milestone.mode,
        evidenceLevel: milestone.evidenceLevel,
        achievement,
        status,
        href: status === 'current' && milestone.activityId && snapshot.sessions.items.some(
          ({ activityId, state }) => activityId === milestone.activityId && state !== 'completed',
        )
          ? `#/learning/activity/${encodeURIComponent(milestone.activityId)}`
          : `#/learning/lesson/${encodeURIComponent(milestone.lessonId)}`,
      }
    })
}

export interface TutorGuidance {
  title: string
  boundary: string
  phase: 'orient' | 'observe' | 'repair' | 'explain' | 'source-check'
  status: string
  orientation: string
  prompts: string[]
  misconception?: {
    title: string
    diagnosis: string
    correction: string
    remediationHref: string
  }
}

export interface TutorRuntimeContext {
  attempts?: number
  hasIncorrectAnswer?: boolean
  hasPendingReview?: boolean
  hintsUsed?: number
  selectedEntityLabel?: string
  sourceCount?: number
  sourceLabels?: string[]
  unknownData?: string[]
}

export type ContextualTutorAction =
  | 'explain-selection'
  | 'compare'
  | 'ask-question'
  | 'give-hint'
  | 'request-check'
  | 'identify-missing-data'

export interface ContextualTutorResponse {
  action: ContextualTutorAction
  title: string
  answer: string
  followUp: string
  evidenceChips: Array<{
    kind: 'official' | 'documented' | 'educational-simulation' | 'hypothesis' | 'unknown'
    label: string
  }>
  sourceIds: string[]
  boundary: string
}

export function contextualTutorGuidance(
  snapshot: LearningApplicationSnapshot,
  activity?: LearningActivityDescriptor,
  context: TutorRuntimeContext = {},
): TutorGuidance | undefined {
  if (!activity?.tutorContract) return undefined
  const misconceptionId = activity.feedbackContract?.misconceptionIds[0]
  const misconception = snapshot.product.misconceptions.find(({ id }) => id === misconceptionId)
  const attempts = context.attempts ?? 0
  const phase = context.hasIncorrectAnswer
    ? 'repair'
    : context.hasPendingReview
      ? 'explain'
      : context.selectedEntityLabel
        ? 'observe'
        : attempts > 0
          ? 'source-check'
          : 'orient'
  const phaseCopy = {
    orient: {
      status: 'Primero observa; todavía no necesitas acertar',
      orientation: 'Localiza la entrada del sistema, sigue una sola relación y describe el cambio antes de elegir una respuesta.',
    },
    observe: {
      status: `Estás observando: ${context.selectedEntityLabel}`,
      orientation: 'Describe qué recibe, qué entrega y mediante qué contacto, apoyo o engrane se relaciona con el resto.',
    },
    repair: {
      status: 'El intento no encaja todavía; revisa una sola relación',
      orientation: 'No cambies de respuesta al azar. Compara tu predicción con el estado restaurado y busca la primera diferencia comprobable.',
    },
    explain: {
      status: 'Tu razonamiento está registrado, no calificado automáticamente',
      orientation: 'Comprueba que separa observación, explicación causal, fuente y límite. Una respuesta larga no equivale por sí sola a dominio.',
    },
    'source-check': {
      status: 'Ahora justifica lo observado',
      orientation: context.sourceCount
        ? `Hay ${context.sourceCount} fuente(s) declarada(s). Señala cuál respalda la identidad o el dato y qué parte sigue siendo educativa o estimada.`
        : 'No atribuyas autoridad técnica a la animación: declara qué observaste y qué sigue sin documentar.',
    },
  } as const
  const servicePhaseCopy = {
    orient: {
      status: 'Empieza por el estado inicial y los riesgos',
      orientation: 'Identifica la unidad, fija el alcance y comprueba las condiciones que deben cumplirse antes del primer paso.',
    },
    observe: {
      status: `Estás revisando: ${context.selectedEntityLabel}`,
      orientation: 'Relaciona este elemento con el paso, el riesgo, la inspección y la fuente que autorizan la decisión.',
    },
    repair: {
      status: 'La respuesta necesita una revisión concreta',
      orientation: 'Busca la primera condición de entrada, prohibición o evidencia que tu plan no haya cubierto todavía.',
    },
    explain: {
      status: 'Tu plan queda pendiente de revisión, no acredita trabajo físico',
      orientation: 'Comprueba que cada decisión conserva fuente, riesgo, inspección y criterio de aceptación.',
    },
    'source-check': {
      status: 'Comprueba la autoridad antes de continuar',
      orientation: context.sourceCount
        ? `Hay ${context.sourceCount} fuente(s) declarada(s). Indica cuál autoriza cada paso y qué depende de la referencia concreta.`
        : 'Detente donde falte documentación aplicable; una práctica habitual no sustituye el procedimiento de la referencia.',
    },
  } as const
  const comparativePhaseCopy = {
    orient: {
      status: 'Empieza por la autoridad de cada caso',
      orientation: 'Lee qué está documentado, qué es una observación y qué permanece desconocido antes de comparar soluciones.',
    },
    observe: {
      status: `Estás revisando: ${context.selectedEntityLabel}`,
      orientation: 'Describe la función y la relación observada sin transferir geometría, dimensiones ni comportamiento de otro calibre.',
    },
    repair: {
      status: 'Revisa una diferencia verificable entre los casos',
      orientation: 'Separa el hecho citado de tu inferencia y comprueba si ambos casos responden realmente al mismo eje de comparación.',
    },
    explain: {
      status: 'Tu comparación está registrada, no validada por extensión',
      orientation: 'Comprueba que la conclusión incluye fuentes, límites, desconocidos y el nivel de confianza que declaraste.',
    },
    'source-check': {
      status: 'Ahora verifica la procedencia de la comparación',
      orientation: context.sourceCount
        ? `Hay ${context.sourceCount} fuente(s) declarada(s). Distingue las primarias de las referencias de descubrimiento.`
        : 'Sin fuente no conviertas una semejanza visual en una afirmación técnica.',
    },
  } as const
  const capstonePhaseCopy = {
    orient: {
      status: activity.manufacturingContract
        ? 'Empieza por función, revisión, datum y riesgo'
        : activity.personalWatchDesignContract
          ? 'Empieza por el pliego, las interfaces y las alternativas'
          : 'Empieza por la afirmación, la muestra y el criterio de aceptación',
      orientation: activity.manufacturingContract
        ? 'Fija qué debe conservar la pieza y cómo se inspeccionará antes de ordenar operaciones.'
        : activity.personalWatchDesignContract
          ? 'Identifica qué datos están fijados, qué sigue abierto y qué alternativas cambian realmente la arquitectura.'
          : 'Declara qué intentas validar, quién participa, qué tarea ejecuta y qué hallazgo bloquearía la liberación.',
    },
    observe: {
      status: `Estás revisando: ${context.selectedEntityLabel}`,
      orientation: 'Relaciona este elemento con su requisito, evidencia, riesgo, criterio de decisión y límite de autoridad.',
    },
    repair: {
      status: 'La decisión necesita una corrección trazable',
      orientation: 'Localiza la primera afirmación sin fuente, alternativa real, control de riesgo o criterio de aceptación y corrige solo desde ahí.',
    },
    explain: {
      status: 'El expediente está registrado y pendiente de revisión humana',
      orientation: 'Comprueba configuración, alternativas, riesgos abiertos, evidencia, criterios de parada y alcance de la conclusión.',
    },
    'source-check': {
      status: 'Comprueba la autoridad y el alcance antes de concluir',
      orientation: context.sourceCount
        ? `Hay ${context.sourceCount} fuente(s) declarada(s). Enlaza cada afirmación técnica con la fuente aplicable y conserva los desconocidos.`
        : 'Sin fuente o evidencia no cierres la decisión; mantén el campo desconocido y define cómo resolverlo.',
    },
  } as const
  const activePhaseCopy = activity.serviceProcedureContract
    ? servicePhaseCopy[phase]
    : activity.comparativeArchitectureContract
      ? comparativePhaseCopy[phase]
      : activity.manufacturingContract || activity.personalWatchDesignContract || activity.validationContract
        ? capstonePhaseCopy[phase]
      : phaseCopy[phase]
  return {
    title: 'Guía contextual',
    boundary: 'Puede orientar, preguntar y señalar fuentes. No evalúa, no inventa datos y no sustituye tu respuesta.',
    phase,
    status: activePhaseCopy.status,
    orientation: activePhaseCopy.orientation,
    prompts: activity.tutorContract.promptStarters.map((prompt) => localize(snapshot.profile?.locale, prompt)),
    misconception: context.hasIncorrectAnswer && misconception ? {
      title: localize(snapshot.profile?.locale, misconception.title),
      diagnosis: localize(snapshot.profile?.locale, misconception.diagnosis),
      correction: localize(snapshot.profile?.locale, misconception.correction),
      remediationHref: `#/learning/lesson/${encodeURIComponent(misconception.remediationLessonId)}`,
    } : undefined,
  }
}

export function contextualTutorResponse(
  snapshot: LearningApplicationSnapshot,
  activity: LearningActivityDescriptor,
  action: ContextualTutorAction,
  context: TutorRuntimeContext = {},
): ContextualTutorResponse {
  const contract = activity.tutorContract
  const selected = context.selectedEntityLabel ?? 'el elemento que estás estudiando'
  const sourceLabels = context.sourceLabels ?? activity.sourceIds
  const official = activity.sourceIds.some((id) => /miyota|official|manufacturer|drawing|manual/.test(id.toLowerCase()))
  const declared = activity.feedbackContract
  const prompts = contract?.promptStarters.map((prompt) => localize(snapshot.profile?.locale, prompt)) ?? []
  const transfer = activity.deliberatePractice
    ? localize(snapshot.profile?.locale, activity.deliberatePractice.transferPrompt)
    : declared?.transferPrompt
      ? localize(snapshot.profile?.locale, declared.transferPrompt)
      : '¿Qué cambiaría al pasar a otra arquitectura o representación?'
  const unknown = context.unknownData?.[0] ?? activity.fidelity.limitations[0]
    ?? 'No hay datos suficientes para elevar esta observación a validación de ingeniería.'
  const allowed = new Set(contract?.allowedActions ?? [])
  const requires = {
    'explain-selection': 'explain-declared-content',
    compare: 'ask-socratic-question',
    'ask-question': 'ask-socratic-question',
    'give-hint': 'suggest-remediation',
    'request-check': 'summarize-visible-state',
    'identify-missing-data': 'point-to-source',
  } as const
  if (!allowed.has(requires[action])) {
    return {
      action,
      title: 'Acción fuera del contrato de esta actividad',
      answer: 'La guía no tiene autoridad declarada para realizar esta acción aquí. Mantén la observación y consulta la explicación o las fuentes disponibles.',
      followUp: prompts[0] ?? '¿Qué puedes afirmar únicamente desde el estado visible?',
      evidenceChips: [{ kind: 'unknown', label: 'Autoridad no declarada' }],
      sourceIds: [],
      boundary: 'El tutor no amplía sus permisos ni completa información ausente.',
    }
  }
  const responses = {
    'explain-selection': {
      title: `Explicar ${selected}`,
      answer: `Descríbelo por su relación: qué recibe, mediante qué interfaz actúa y qué cambio observable entrega. ${declared ? localize(snapshot.profile?.locale, declared.nextObservation) : 'No deduzcas una función solo por su forma o posición.'}`,
      followUp: declared ? localize(snapshot.profile?.locale, declared.causalQuestion) : prompts[0],
    },
    compare: {
      title: 'Comparar sin trasladar datos',
      answer: `Compara primero la función y después la solución constructiva. Conserva por separado identidad, geometría, medida y autoridad de cada caso. ${transfer}`,
      followUp: '¿Qué relación permanece equivalente y qué dato debes volver a comprobar?',
    },
    'ask-question': {
      title: 'Pregunta socrática',
      answer: prompts[(context.attempts ?? 0) % Math.max(1, prompts.length)] ?? '¿Cuál es la primera relación que debe cumplirse para que aparezca el resultado observado?',
      followUp: 'Responde con entrada, interfaz, cambio, salida y una observación que podría refutarte.',
    },
    'give-hint': (context.attempts ?? 0) < 1 ? {
      title: 'Primero deja una predicción',
      answer: 'Antes de mostrar una pista, señala qué esperas que cambie y cuál sería la primera diferencia observable. La predicción no tiene que ser correcta.',
      followUp: '¿Qué observarías primero?',
    } : {
      title: 'Pista acotada',
      answer: declared
        ? `Vuelve a una sola relación: ${localize(snapshot.profile?.locale, declared.nextObservation)} Después restaura y repite sin ayuda.`
        : 'Aísla la entrada y sigue una sola relación antes de mirar el resultado final.',
      followUp: '¿Qué parte de tu explicación cambia con esta observación?',
    },
    'request-check': {
      title: 'Comprobación antes de concluir',
      answer: activity.deliberatePractice
        ? activity.deliberatePractice.successCriteria.map((criterion) => localize(snapshot.profile?.locale, criterion)).join(' · ')
        : 'Comprueba que la respuesta distingue observación, relación causal, fuente, límite y confianza.',
      followUp: '¿Qué criterio todavía no puedes demostrar con la evidencia actual?',
    },
    'identify-missing-data': {
      title: 'Dato o autoridad que falta',
      answer: unknown,
      followUp: sourceLabels.length
        ? `Consulta ${sourceLabels[0]} y delimita exactamente qué afirmación respalda.`
        : 'Conserva el dato como desconocido y define cómo lo medirías o documentarías.',
    },
  } as const
  const response = responses[action]
  return {
    action,
    title: response.title,
    answer: response.answer,
    followUp: response.followUp ?? 'Formula una explicación comprobable.',
    evidenceChips: [
      ...(official ? [{ kind: 'official' as const, label: 'Fuente oficial declarada' }] : []),
      ...(sourceLabels.length ? [{ kind: 'documented' as const, label: `${sourceLabels.length} fuente(s)` }] : []),
      { kind: 'educational-simulation' as const, label: `${activity.fidelity.geometry}/${activity.fidelity.kinematics}/${activity.fidelity.physics}` },
      ...(action === 'identify-missing-data' ? [{ kind: 'unknown' as const, label: 'Dato no resuelto' }] : []),
    ],
    sourceIds: [...activity.sourceIds],
    boundary: 'Orientación determinista basada en el contenido declarado. No evalúa, no inventa datos y no modifica el proyecto.',
  }
}

export function routeForActivity(
  snapshot: LearningApplicationSnapshot,
  activityId: string,
): LearningRouteDescriptor | undefined {
  return snapshot.product.routes.find((route) => academyRouteTree(snapshot.product, route.id)?.activityIds.includes(activityId))
}
