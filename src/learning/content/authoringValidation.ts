import type { LearningPack } from './learningPack'
import { validateLearningPack } from './learningPack'
import { inferSceneRequiredCapabilities } from '../runtime/compiler'
import { parseCapabilityRequirement } from '../runtime/capabilities'
import type { AssessmentCondition } from '../persistence/assessmentEngine'

export type AuthoringDiagnosticSeverity = 'error' | 'warning' | 'info'

export interface AuthoringDiagnostic {
  code: string
  severity: AuthoringDiagnosticSeverity
  path: string
  message: string
  recovery: string
}

export interface VisualNeedReportItem {
  resourceId: string
  lessonIds: string[]
  type: LearningPack['visualResources'][number]['type']
  movementIds: string[]
  partSelectors: LearningPack['visualResources'][number]['partSelectors']
  requiredCapabilities: string[]
  dataRequirements: string[]
  status: LearningPack['visualResources'][number]['status']
  priority: LearningPack['visualResources'][number]['priority']
  fidelity: LearningPack['visualResources'][number]['fidelity']
  dependencyIds: string[]
  currentModelSupport: LearningPack['visualResources'][number]['currentModelSupport']
  viewportImpact: LearningPack['visualResources'][number]['viewportImpact']
}

export interface AuthoringValidationReport {
  valid: boolean
  pack?: LearningPack
  diagnostics: AuthoringDiagnostic[]
  visualNeeds: VisualNeedReportItem[]
}

function diagnostic(
  code: string,
  severity: AuthoringDiagnosticSeverity,
  path: string,
  message: string,
  recovery: string,
): AuthoringDiagnostic {
  return { code, severity, path, message, recovery }
}

function referencedTermIds(markdown: string): string[] {
  return [...markdown.matchAll(/\{\{term:([a-z0-9][a-z0-9._:-]{2,159})\}\}/g)].map((match) => match[1])
}

function referencedEvidenceTypes(condition: AssessmentCondition): string[] {
  if (condition.op === 'exists' || condition.op === 'count') {
    return condition.filter.evidenceType ? [condition.filter.evidenceType] : []
  }
  if (condition.op === 'sequence') return condition.evidenceTypes
  if (condition.op === 'all' || condition.op === 'any') {
    return condition.conditions.flatMap(referencedEvidenceTypes)
  }
  if (condition.op === 'weighted') {
    return condition.components.flatMap(({ condition: child }) => referencedEvidenceTypes(child))
  }
  if (condition.op === 'not') return referencedEvidenceTypes(condition.condition)
  return []
}

function requiresRepeatedIndependentEvidence(condition: AssessmentCondition): boolean {
  if (condition.op === 'independent-later-evidence') return condition.differentSession
  if (condition.op === 'compare') {
    return condition.metric === 'distinct-sessions'
      && condition.value >= 2
      && ['eq', 'gte', 'gt'].includes(condition.compare)
  }
  if (condition.op === 'all' || condition.op === 'any') {
    return condition.conditions.some(requiresRepeatedIndependentEvidence)
  }
  if (condition.op === 'weighted') {
    return condition.components.some(({ condition: child }) => requiresRepeatedIndependentEvidence(child))
  }
  if (condition.op === 'not') return requiresRepeatedIndependentEvidence(condition.condition)
  return false
}

function conceptCycles(pack: LearningPack): string[][] {
  const concepts = new Map(pack.concepts.map((concept) => [concept.id, concept]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []
  const cycles: string[][] = []
  const visit = (id: string) => {
    if (visiting.has(id)) {
      const start = stack.indexOf(id)
      cycles.push([...stack.slice(start), id])
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    stack.push(id)
    for (const prerequisiteId of concepts.get(id)?.prerequisiteIds ?? []) {
      if (concepts.has(prerequisiteId)) visit(prerequisiteId)
    }
    stack.pop()
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of concepts.keys()) visit(id)
  return cycles
}

function hasMotion(scene: LearningPack['scenes'][number]): boolean {
  return scene.timeline.some(({ durationMs, operation }) =>
    (durationMs ?? 0) > 0 || ['explode', 'rotate', 'translate', 'camera', 'section', 'transparency'].includes(operation))
}

type FunctionalSemanticDomain = 'energy' | 'transmission' | 'regulation' | 'indication' | 'structure'

const FUNCTIONAL_SEMANTIC_TERMS: Record<FunctionalSemanticDomain, RegExp[]> = {
  energy: [
    /\benerg(?:i|í)a\b/,
    /\bmuelle(?:\s+real)?\b/,
    /\bbarrilete\b/,
    /\bpila\b/,
    /\bbater(?:i|í)a\b/,
    /\bpower[- ]source\b/,
  ],
  transmission: [
    /\btransmisi(?:o|ó)n\b/,
    /\btransmit(?:e|ir|en|ida|ido)\b/,
    /\btren(?:\s+de\s+ruedas)?\b/,
    /\bgoing[- ]train\b/,
    /\bgear[- ]train\b/,
  ],
  regulation: [
    /\bregulaci(?:o|ó)n\b/,
    /\bcontrol\b/,
    /\bvolante\b/,
    /\bbalance\b/,
    /\bescape\b/,
    /\b(?:a|á)ncora\b/,
  ],
  indication: [
    /\bindicaci(?:o|ó)n\b/,
    /\bagujas?\b/,
    /\bminuter(?:i|í)a\b/,
    /\bmotion[- ]works\b/,
    /\bdial\b/,
    /\besfera\b/,
  ],
  structure: [
    /\bestructura\b/,
    /\bcaja\b/,
    /\bcase\b/,
    /\bplatina\b/,
    /\bpuente\b/,
    /\bbridge\b/,
  ],
}

function normalizeSemanticText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Inferencia conservadora para el lint editorial: solo devuelve un dominio
 * cuando el texto apunta de forma inequívoca a una única función. Los textos
 * comparativos que mencionan varias funciones se dejan sin clasificar.
 */
function inferFunctionalSemanticDomain(value: string): FunctionalSemanticDomain | undefined {
  const normalized = normalizeSemanticText(value)
  const matches = (Object.entries(FUNCTIONAL_SEMANTIC_TERMS) as Array<
    [FunctionalSemanticDomain, RegExp[]]
  >).flatMap(([domain, patterns]) => patterns.some((pattern) => pattern.test(normalized)) ? [domain] : [])
  return matches.length === 1 ? matches[0] : undefined
}

function semanticDomainForSubsystem(value: string): FunctionalSemanticDomain | undefined {
  const normalized = normalizeSemanticText(value)
  if (['train', 'transmission', 'going-train', 'gear-train'].includes(normalized)) return 'transmission'
  if (['power-source', 'energy', 'barrel', 'mainspring', 'battery'].includes(normalized)) return 'energy'
  if (['regulation', 'escapement', 'oscillator', 'balance'].includes(normalized)) return 'regulation'
  if (['indication', 'motion-works', 'dial', 'hands'].includes(normalized)) return 'indication'
  if (['case', 'structure', 'plate', 'bridges'].includes(normalized)) return 'structure'
  return undefined
}

function uniqueFunctionalSemanticDomain(values: Array<string | undefined>): FunctionalSemanticDomain | undefined {
  const domains = [...new Set(values.flatMap((value) => {
    if (!value) return []
    const domain = inferFunctionalSemanticDomain(value)
    return domain ? [domain] : []
  }))]
  return domains.length === 1 ? domains[0] : undefined
}

const FUNCTIONAL_MAP_PACKAGE_ID = 'wplab.horology.functional-map'
const FUNCTIONAL_MAP_LESSON_TITLES = [
  'Un reloj no es una colección de ruedas',
  'La cadena mecánica',
  'La cadena del cuarzo',
  'Cuarzo y mecánico: equivalencias funcionales',
  'Predicción de fallos',
  'Lo que ya conoces por el ISA 8172',
] as const
const FUNCTIONAL_MAP_COMPETENCIES = [
  'competency.horology.identify-functional-subsystems',
  'competency.horology.explain-quartz-energy-chain',
  'competency.horology.explain-mechanical-energy-chain',
  'competency.horology.distinguish-regulation-from-transmission',
  'competency.horology.predict-system-interruption',
  'competency.horology.state-source-confidence',
] as const
const REQUIRED_LESSON_SECTION_ROLES = [
  { role: 'Propósito', headings: ['Propósito'] },
  { role: 'Conocimientos previos', headings: ['Conocimientos previos'] },
  { role: 'Objetivos observables', headings: ['Objetivos observables'] },
  { role: 'Explicación principal', headings: ['Explicación principal'] },
  { role: 'Explicación visual', headings: ['Explicación visual'] },
  { role: 'Vocabulario', headings: ['Vocabulario'] },
  { role: 'Fuentes', headings: ['Fuentes'] },
  { role: 'Ejemplo', headings: ['Ejemplo'] },
  { role: 'Errores habituales', headings: ['Errores habituales'] },
  { role: 'Actividad', headings: ['Actividad'] },
  // "Ayuda después de responder" es el rótulo visible y comprensible para
  // principiantes; "Feedback" se conserva como alias de compatibilidad.
  { role: 'Ayuda después de responder', headings: ['Ayuda después de responder', 'Feedback'] },
  { role: 'Evidencia', headings: ['Evidencia'] },
  { role: 'Criterio de éxito', headings: ['Criterio de éxito'] },
  { role: 'Resumen', headings: ['Resumen'] },
  { role: 'Siguiente conexión', headings: ['Siguiente conexión'] },
] as const

const FUNCTIONAL_MAP_AUXILIARY_SCENE_IDS = [
  'scene.horology.functional-layers',
  'scene.horology.mechanical-chain',
  'scene.horology.quartz-chain',
  'scene.horology.functional-comparison',
  'scene.horology.interruptions',
  'scene.horology.isa-confidence',
] as const

function isAbsoluteWebLocator(locator: string | undefined): boolean {
  if (!locator) return false
  try {
    const url = new URL(locator)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function hasIndependentRetentionCondition(condition: unknown): boolean {
  if (!condition || typeof condition !== 'object') return false
  const value = condition as Record<string, unknown>
  if (value.op === 'independent-later-evidence') {
    return typeof value.minimumDays === 'number' && value.minimumDays > 0 && value.differentSession === true
  }
  if (Array.isArray(value.conditions)) return value.conditions.some(hasIndependentRetentionCondition)
  if (Array.isArray(value.components)) {
    return value.components.some((component) =>
      component && typeof component === 'object' && hasIndependentRetentionCondition((component as Record<string, unknown>).condition))
  }
  return hasIndependentRetentionCondition(value.condition)
}

export function buildVisualNeedsReport(pack: LearningPack): VisualNeedReportItem[] {
  return pack.visualResources
    .map((resource) => ({
      resourceId: resource.id,
      lessonIds: [...resource.lessonIds],
      type: resource.type,
      movementIds: [...resource.movementIds],
      partSelectors: structuredClone(resource.partSelectors),
      requiredCapabilities: [...resource.requiredCapabilities],
      dataRequirements: [...resource.dataRequirements],
      status: resource.status,
      priority: resource.priority,
      fidelity: structuredClone(resource.fidelity),
      dependencyIds: [...resource.dependencyIds],
      currentModelSupport: resource.currentModelSupport,
      viewportImpact: resource.viewportImpact,
    }))
    .sort((left, right) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 }
      return rank[left.priority] - rank[right.priority] || left.resourceId.localeCompare(right.resourceId)
    })
}

export function validateAuthoringPack(input: unknown): AuthoringValidationReport {
  const base = validateLearningPack(input)
  if (!base.success) {
    const diagnostics = base.errors.map((error) => diagnostic(
      `AUTHORING-${error.code.toUpperCase()}`,
      'error',
      error.path,
      error.message,
      'Corrige el archivo fuente y vuelve a ejecutar learning:validate.',
    ))
    return { valid: false, diagnostics, visualNeeds: [] }
  }

  const pack = base.pack
  const diagnostics: AuthoringDiagnostic[] = []
  const glossaryIds = new Set(pack.glossary.map(({ id }) => id))
  const sourceById = new Map(pack.sources.map((source) => [source.id, source]))
  const declaredCapabilities = new Set(pack.manifest.requiredCapabilities.map((value) => parseCapabilityRequirement(value).id))
  const lessonIds = new Set(pack.lessons.map(({ id }) => id))
  const conceptIds = new Set(pack.concepts.map(({ id }) => id))
  const misconceptionIds = new Set(pack.misconceptions.map(({ id }) => id))
  const usesAcademyGoldStandard = pack.manifest.id.startsWith('wplab.horology.')
  const moduleByIdForAudience = new Map(pack.modules.map((module) => [module.id, module]))
  const learnerLessonIds = new Set(pack.routes.filter(({ demo }) => !demo).flatMap((route) =>
    route.moduleIds.flatMap((moduleId) => moduleByIdForAudience.get(moduleId)?.lessonIds ?? [])))
  const learnerActivityIds = new Set(pack.lessons.filter(({ id }) => learnerLessonIds.has(id))
    .flatMap(({ activityIds }) => activityIds))

  // La conectividad del grafo es bidireccional aunque los documentos almacenen
  // aristas salientes. Un concepto que recibe una relación real no está aislado
  // solo porque no necesite repetir esa arista en sentido inverso.
  const connectedConceptIds = new Set<string>()
  const knownConceptIds = new Set(pack.concepts.map(({ id }) => id))
  for (const concept of pack.concepts) {
    const targets = [
      ...concept.prerequisiteIds,
      ...concept.recommendedPrerequisiteIds,
      ...concept.relatedIds,
      ...concept.transferTargetIds,
    ].filter((id) => knownConceptIds.has(id))
    if (targets.length > 0) connectedConceptIds.add(concept.id)
    targets.forEach((id) => connectedConceptIds.add(id))
  }

  if (usesAcademyGoldStandard) {
    for (const route of pack.routes.filter(({ demo }) => !demo)) {
      if (!route.learningDesign) diagnostics.push(diagnostic(
        'AUTHORING-LEARNING-DESIGN-MISSING',
        'error',
        route.id,
        'La ruta no declara su secuencia pedagógica, política de entrada y criterio de finalización.',
        'Añade learningDesign con hitos ordenados, evidencia objetivo y puntos de diagnóstico.',
      ))
      if (
        pack.manifest.id === 'wplab.horology.functional-map'
        && (route.learningDesign?.model !== 'gold-standard' || route.learningDesign.milestones.length !== 10)
      ) diagnostics.push(diagnostic(
        'AUTHORING-GOLD-PATH-INCOMPLETE',
        'error',
        route.id,
        'La ruta inicial debe conservar exactamente diez hitos obligatorios y declararse gold-standard.',
        'Restaura el recorrido canónico de orientación antes de publicar el paquete.',
      ))
    }
    for (const concept of pack.concepts) {
      if (
        !concept.plainLanguage
        || !concept.technicalLanguage
        || !concept.whyItMatters
        || concept.observableActions.length === 0
      ) diagnostics.push(diagnostic(
        'AUTHORING-DUAL-LAYER-CONCEPT-INCOMPLETE',
        'error',
        concept.id,
        'El concepto no contiene las dos capas de lenguaje, el motivo de aprendizaje y una acción observable.',
        'Completa plainLanguage, technicalLanguage, whyItMatters y observableActions.',
      ))
      if (concept.technicalLanguage?.es.includes('Se estudia como')) diagnostics.push(diagnostic(
        'AUTHORING-TECHNICAL-LANGUAGE-PLACEHOLDER',
        'error',
        concept.id,
        'La capa técnica repite una plantilla editorial y no define el concepto con precisión.',
        'Describe mecanismo, interfaces, magnitudes, procedimiento o límite epistemológico específico.',
      ))
      if (
        pack.manifest.id !== FUNCTIONAL_MAP_PACKAGE_ID
        && !connectedConceptIds.has(concept.id)
      ) diagnostics.push(diagnostic(
        'AUTHORING-CONCEPT-ISOLATED',
        'error',
        concept.id,
        'El concepto está aislado del grafo de aprendizaje y no puede generar puentes ni transferencia.',
        'Añade una relación de prerrequisito, relación lateral o destino de transferencia real.',
      ))
    }
    for (const lesson of pack.lessons) {
      if (lesson.authoring && !lesson.authoring.tutorContract) diagnostics.push(diagnostic(
        'AUTHORING-TUTOR-CONTRACT-MISSING',
        'error',
        lesson.id,
        'La lección no limita el alcance, autoridad y fuentes del tutor contextual.',
        'Añade tutorContract y mantén el tutor como guía, no como evaluador.',
      ))
      if (learnerLessonIds.has(lesson.id) && !lesson.authoring?.studyContract) diagnostics.push(diagnostic(
        'AUTHORING-THEORY-FIRST-CONTRACT-MISSING',
        'error',
        lesson.id,
        'La lección del recorrido real no declara cuánto estudiar ni qué apartados completar antes de practicar.',
        'Añade studyContract con lectura obligatoria, criterios de preparación y laboratorios enlazados.',
      ))
    }
    for (const activity of pack.activities) {
      if (!activity.authoring) continue
      if (!activity.authoring.feedbackContract) diagnostics.push(diagnostic(
        'AUTHORING-CAUSAL-FEEDBACK-MISSING',
        'error',
        activity.id,
        'La práctica no declara explicación correcta, diagnóstico del error y siguiente observación.',
        'Añade feedbackContract para evitar respuestas binarias sin comprensión.',
      ))
      if (!activity.authoring.tutorContract) diagnostics.push(diagnostic(
        'AUTHORING-TUTOR-CONTRACT-MISSING',
        'error',
        activity.id,
        'La práctica no limita el tutor contextual.',
        'Añade tutorContract con acciones permitidas, prohibiciones y autoridad coach-not-assessor.',
      ))
      if (learnerActivityIds.has(activity.id) && !activity.authoring.deliberatePractice) diagnostics.push(diagnostic(
        'AUTHORING-DELIBERATE-PRACTICE-MISSING',
        'error',
        activity.id,
        'La práctica del estudiante no declara ejemplo, retirada de ayuda, reintento independiente y transferencia.',
        'Añade deliberatePractice y conserva separados el ensayo guiado y la evidencia independiente.',
      ))
    }
    if (pack.manifest.id !== FUNCTIONAL_MAP_PACKAGE_ID) {
      for (const route of pack.routes.filter(({ demo }) => !demo)) {
        if (
          route.learningDesign?.completionPolicy === 'evidence'
          && (route.learningDesign.demonstrationActivityIds.length ?? 0) === 0
        ) diagnostics.push(diagnostic(
          'AUTHORING-SPECIALIZATION-WITHOUT-DEMONSTRATION',
          'error',
          route.id,
          'La especialización no contiene ninguna comprobación independiente de dominio.',
          'Declara al menos una actividad independiente con assessmentIntent demonstration y evidencia suficiente.',
        ))
      }
      for (const lesson of pack.lessons) {
        const words = lesson.blockIds
          .map((id) => pack.blocks.find((block) => block.id === id)?.bodyMarkdown ?? '')
          .join(' ')
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .length
        if (learnerLessonIds.has(lesson.id) && words < 600) diagnostics.push(diagnostic(
          'AUTHORING-LESSON-TOO-THIN',
          'error',
          lesson.id,
          `La explicación contiene ${words} palabras y no basta como preparación autónoma de la práctica.`,
          'Supera 600 palabras de teoría específica con modelo causal, ejemplo resuelto, límites y comprobación sin texto de relleno.',
        ))
        const declaredWords = lesson.authoring?.studyContract?.minimumReadingWords
        if (declaredWords && declaredWords > words) diagnostics.push(diagnostic(
          'AUTHORING-READING-WORDS-OVERSTATED',
          'error',
          lesson.id,
          `El contrato declara ${declaredWords} palabras, pero los bloques contienen ${words}.`,
          'Recalcula minimumReadingWords desde el contenido real; no infles la carga declarada.',
        ))
      }
      const questionPrompts = pack.scenes
        .flatMap(({ steps }) => steps)
        .flatMap(({ questions }) => questions)
        .map((question) => (question.authoring?.prompt.es ?? question.promptMarkdown)
          .trim().toLocaleLowerCase('es'))
      const uniqueQuestionPrompts = new Set(questionPrompts)
      if (questionPrompts.length >= 8 && uniqueQuestionPrompts.size / questionPrompts.length < 0.65) {
        diagnostics.push(diagnostic(
          'AUTHORING-QUESTION-BANK-REPETITIVE',
          'error',
          'scenes',
          `${questionPrompts.length} preguntas se reducen a ${uniqueQuestionPrompts.size} enunciados distintos.`,
          'Crea preguntas específicas de cada objetivo: predicción, secuencia, relación causal, fuente y transferencia.',
        ))
      }
      const feedbackSignatures = pack.activities.map((activity) =>
        activity.authoring?.feedbackContract
          ? [
            activity.authoring.feedbackContract.correctExplanation.es,
            activity.authoring.feedbackContract.incorrectDiagnosis.es,
            activity.authoring.feedbackContract.causalQuestion.es,
            activity.authoring.feedbackContract.nextObservation.es,
          ].join('|').trim().toLocaleLowerCase('es')
          : '')
        .filter(Boolean)
      const mostRepeatedFeedback = Math.max(
        0,
        ...[...new Set(feedbackSignatures)].map((signature) =>
          feedbackSignatures.filter((candidate) => candidate === signature).length),
      )
      if (mostRepeatedFeedback > 3) diagnostics.push(diagnostic(
        'AUTHORING-FEEDBACK-TOO-GENERIC',
        'error',
        'activities',
        `Un mismo contrato de feedback se repite ${mostRepeatedFeedback} veces.`,
        'Diagnostica el error concreto, nombra la relación que debe observarse y formula una transferencia específica.',
      ))
      const genericPracticePrompts = pack.scenes.flatMap(({ id, steps }) => steps.flatMap(({ questions }) =>
        questions.flatMap((question) => {
          const prompt = question.authoring?.prompt.es ?? question.promptMarkdown
          return /Qué criterio permite justificar correctamente|Relacionar una observación verificable con/i.test(prompt)
            ? [`${id}.${question.id}`]
            : []
        })))
      if (genericPracticePrompts.length > 0) diagnostics.push(diagnostic(
        'AUTHORING-PRACTICE-PROMPT-GENERIC',
        'error',
        genericPracticePrompts[0],
        `${genericPracticePrompts.length} preguntas aún evalúan una plantilla de justificación en vez del conocimiento de la unidad.`,
        'Sustituye cada una por una decisión, cálculo, secuencia, relación o diagnóstico propio del objetivo.',
      ))
    }
  }

  for (const cycle of conceptCycles(pack)) diagnostics.push(diagnostic(
    'AUTHORING-CONCEPT-PREREQUISITE-CYCLE',
    'error',
    cycle[0],
    `El grafo de conocimientos contiene un ciclo: ${cycle.join(' → ')}.`,
    'Rompe el ciclo y conserva una dirección de aprendizaje comprobable.',
  ))

  for (const concept of pack.concepts) {
    for (const recommendedId of concept.recommendedPrerequisiteIds) {
      if (!conceptIds.has(recommendedId)) diagnostics.push(diagnostic(
        'AUTHORING-RECOMMENDED-CONCEPT-MISSING',
        'error',
        concept.id,
        `El prerrequisito recomendado ${recommendedId} no existe en el paquete.`,
        'Declara el concepto o retira la referencia recomendada.',
      ))
    }
    if (concept.bridgeLessonId && !lessonIds.has(concept.bridgeLessonId)) diagnostics.push(diagnostic(
      'AUTHORING-CONCEPT-BRIDGE-MISSING',
      'error',
      concept.id,
      `El puente ${concept.bridgeLessonId} no corresponde a una lección existente.`,
      'Vincula una lección breve y recuperable para cubrir la base que falta.',
    ))
    for (const misconceptionId of concept.misconceptionIds) {
      if (!misconceptionIds.has(misconceptionId)) diagnostics.push(diagnostic(
        'AUTHORING-MISCONCEPTION-MISSING',
        'error',
        concept.id,
        `El error conceptual ${misconceptionId} no existe en el paquete.`,
        'Declara el error conceptual o retira la referencia.',
      ))
    }
  }

  for (const lesson of pack.lessons) {
    if (!lesson.authoring?.pedagogy) continue
    const pedagogy = lesson.authoring.pedagogy
    const lessonConceptIds = new Set(lesson.authoring.conceptIds)
    for (const introducedId of pedagogy.introducesConceptIds) {
      if (!lessonConceptIds.has(introducedId)) diagnostics.push(diagnostic(
        'AUTHORING-LESSON-INTRODUCTION-OUTSIDE-SCOPE',
        'error',
        lesson.id,
        `La lección introduce ${introducedId}, pero no lo incluye en conceptIds.`,
        'Alinea el contrato pedagógico con el alcance declarado de la lección.',
      ))
    }
    for (const bridgeId of pedagogy.bridgeConceptIds) {
      if (!conceptIds.has(bridgeId)) diagnostics.push(diagnostic(
        'AUTHORING-LESSON-BRIDGE-CONCEPT-MISSING',
        'error',
        lesson.id,
        `El mini-puente apunta al concepto inexistente ${bridgeId}.`,
        'Crea el concepto base o corrige el puente.',
      ))
    }
  }

  /*
   * Los prerrequisitos se comprueban en el recorrido completo de la ruta.
   * Algunos paquetes agrupan varias lecciones en un módulo y otros utilizan
   * un módulo por lección; reiniciar el conocimiento disponible por módulo
   * producía falsos errores precisamente en esas rutas especializadas.
   */
  const moduleById = new Map(pack.modules.map((module) => [module.id, module]))
  const lessonById = new Map(pack.lessons.map((lesson) => [lesson.id, lesson]))
  for (const route of pack.routes) {
    const introducedBefore = new Set(route.prerequisiteConceptIds)
    for (const moduleId of route.moduleIds) {
      const module = moduleById.get(moduleId)
      if (!module) continue
      for (const lessonId of module.lessonIds) {
        const lesson = lessonById.get(lessonId)
        if (!lesson?.authoring) continue
        for (const prerequisiteId of lesson.authoring.prerequisiteConceptIds) {
          if (conceptIds.has(prerequisiteId) && !introducedBefore.has(prerequisiteId)) diagnostics.push(diagnostic(
            'AUTHORING-LESSON-PREREQUISITE-NOT-TAUGHT',
            'error',
            lesson.id,
            `La lección exige ${prerequisiteId}, pero ninguna lección anterior de la ruta lo introduce.`,
            'Reordena la ruta, añade un puente anterior o declara el concepto como prerrequisito de la ruta.',
          ))
        }
        const introducedHere = lesson.authoring.pedagogy?.introducesConceptIds
          ?? lesson.authoring.conceptIds
        introducedHere.forEach((id) => introducedBefore.add(id))
      }
    }
  }

  for (const block of pack.blocks) {
    const forbiddenBoilerplate = [
      '## Modelo mental paso a paso',
      'Empieza por el estado inicial',
      'La vista ensamblada representa una función',
      '## Antes de practicar',
    ]
    for (const phrase of forbiddenBoilerplate) {
      if (block.bodyMarkdown.includes(phrase)) diagnostics.push(diagnostic(
        'AUTHORING-EDITORIAL-BOILERPLATE',
        'error',
        block.id,
        `El bloque contiene texto genérico repetido: «${phrase}».`,
        'Sustituye la plantilla por teoría, ejemplo y límites específicos de esta lección.',
      ))
    }
    if (block.pedagogy) {
      for (const conceptId of block.pedagogy.conceptIds) {
        if (!conceptIds.has(conceptId)) diagnostics.push(diagnostic(
          'AUTHORING-BLOCK-CONCEPT-MISSING',
          'error',
          block.id,
          `El segmento enseña ${conceptId}, pero ese concepto no existe.`,
          'Declara el concepto atómico o corrige el contrato del bloque.',
        ))
      }
    }
    for (const termId of referencedTermIds([
      block.bodyMarkdown,
      block.localization?.bodyMarkdown?.es ?? '',
      block.localization?.bodyMarkdown?.en ?? '',
    ].join('\n'))) {
      if (!glossaryIds.has(termId)) diagnostics.push(diagnostic(
        'AUTHORING-TERM-MISSING',
        'error',
        block.id,
        `El bloque usa el término ${termId}, pero no existe en el glosario.`,
        'Crea la entrada terminológica o corrige el marcador {{term:id}}.',
      ))
    }
    for (const claim of block.claims) {
      if (claim.classification === 'official' && !claim.sources.some(({ authority }) => authority === 'official-miyota')) {
        diagnostics.push(diagnostic(
          'AUTHORING-OFFICIAL-CLAIM-WITHOUT-OFFICIAL-SOURCE',
          'error',
          `${block.id}.${claim.id}`,
          'La afirmación se declara oficial sin una fuente oficial MIYOTA.',
          'Añade una cita official-miyota o cambia la clasificación de la afirmación.',
        ))
      }
      for (const source of claim.sources) {
        const declared = sourceById.get(source.id)
        if (!declared) diagnostics.push(diagnostic(
          'AUTHORING-CLAIM-SOURCE-NOT-DECLARED',
          'error',
          `${block.id}.${claim.id}`,
          `La fuente embebida ${source.id} no está declarada en pack.sources.`,
          'Declara la fuente en el manifiesto y conserva una única identidad editorial.',
        ))
        else if (JSON.stringify(declared) !== JSON.stringify(source)) diagnostics.push(diagnostic(
          'AUTHORING-CLAIM-SOURCE-DIVERGES',
          'error',
          `${block.id}.${claim.id}`,
          `La copia embebida de ${source.id} no coincide con la fuente curada.`,
          'Copia literalmente la referencia curada o corrige el claim.',
        ))
      }
      if (claim.classification === 'inferred' && claim.claimType !== 'inference') diagnostics.push(diagnostic(
        'AUTHORING-INFERENCE-TYPE-MISMATCH',
        'error',
        `${block.id}.${claim.id}`,
        'Una afirmación inferida debe declarar claimType inference.',
        'Cambia el tipo o la clasificación sin presentar la inferencia como hecho.',
      ))
      if (claim.classification === 'hypothesis' && claim.claimType !== 'hypothesis') diagnostics.push(diagnostic(
        'AUTHORING-HYPOTHESIS-TYPE-MISMATCH',
        'error',
        `${block.id}.${claim.id}`,
        'Una hipótesis debe declarar claimType hypothesis.',
        'Añade una condición de falsación mediante claimType hypothesis.',
      ))
    }
  }

  for (const source of pack.sources) {
    if (source.authority === 'official-miyota') {
      if (!isAbsoluteWebLocator(source.resource.locator)) diagnostics.push(diagnostic(
        'AUTHORING-OFFICIAL-SOURCE-LOCATOR-INVALID',
        'error',
        source.id,
        'La fuente oficial MIYOTA no tiene una URL HTTP(S) válida.',
        'Usa la URL curada del registro oficial de Sistema 4B.',
      ))
      if (!source.revision || !source.retrievedAt || source.sourceType !== 'official-miyota-documentation') diagnostics.push(diagnostic(
        'AUTHORING-OFFICIAL-SOURCE-METADATA-INCOMPLETE',
        'error',
        source.id,
        'La fuente oficial debe declarar tipo, revisión y fecha de consulta.',
        'Completa sourceType, revision y retrievedAt desde el registro curado.',
      ))
    }
  }

  for (const language of pack.manifest.languages) {
    const normalized = language.toLowerCase()
    if (normalized.startsWith('en')) {
      for (const lesson of pack.lessons) {
        if (!lesson.authoring?.title.en || !lesson.authoring.purpose.en) diagnostics.push(diagnostic(
          'AUTHORING-LANGUAGE-CONTENT-MISSING',
          'error',
          lesson.id,
          `El manifiesto declara ${language}, pero la lección no contiene título y propósito en inglés.`,
          'Completa lesson.authoring.title.en y lesson.authoring.purpose.en.',
        ))
      }
      for (const activity of pack.activities) {
        if (!activity.authoring?.title.en || !activity.authoring.description.en) diagnostics.push(diagnostic(
          'AUTHORING-LANGUAGE-CONTENT-MISSING',
          'error',
          activity.id,
          `El manifiesto declara ${language}, pero la actividad no contiene copia inglesa.`,
          'Completa activity.authoring.title.en y activity.authoring.description.en.',
        ))
      }
    }
  }

  for (const scene of pack.scenes) {
    const inferred = inferSceneRequiredCapabilities(scene).map((value) => parseCapabilityRequirement(value).id)
    const sceneDeclared = new Set(scene.requiredCapabilities.map((value) => parseCapabilityRequirement(value).id))
    for (const capability of inferred) {
      if (!sceneDeclared.has(capability) && !declaredCapabilities.has(capability)) diagnostics.push(diagnostic(
        'AUTHORING-CAPABILITY-UNDECLARED',
        'error',
        scene.id,
        `La escena utiliza ${capability}, pero no la declara ni en escena ni en manifiesto.`,
        'Añade la capacidad con un rango de versión explícito.',
      ))
    }
    if (hasMotion(scene)) {
      const lessons = pack.lessons.filter(({ activityIds }) =>
        pack.activities.some((activity) => activityIds.includes(activity.id) && activity.sceneIds.includes(scene.id)))
      for (const lesson of lessons) {
        if (!lesson.authoring?.visualStrategy?.reducedMotionAlternative) diagnostics.push(diagnostic(
          'AUTHORING-REDUCED-MOTION-MISSING',
          'error',
          lesson.id,
          `La escena ${scene.id} contiene movimiento y la lección no declara alternativa reducida.`,
          'Añade lesson.authoring.visualStrategy.reducedMotionAlternative.',
        ))
      }
    }
    if (!scene.description && !scene.storyboard?.accessibility) diagnostics.push(diagnostic(
      'AUTHORING-TEXT-ALTERNATIVE-MISSING',
      'error',
      scene.id,
      'La escena no aporta descripción ni alternativa textual en el storyboard.',
      'Añade scene.description y una explicación accesible en scene.storyboard.accessibility.',
    ))
    if (!scene.restorePreviousState) diagnostics.push(diagnostic(
      'AUTHORING-RESTORATION-DISABLED',
      'error',
      scene.id,
      'La escena desactiva la restauración del estado previo.',
      'Activa restorePreviousState y conserva un storyboard de restauración.',
    ))
    if (scene.storyboard) {
      const stepIds = new Set(scene.steps.map(({ id }) => id))
      scene.storyboard.sequence.forEach((entry) => {
        if (!stepIds.has(entry.sceneStepId)) diagnostics.push(diagnostic(
          'AUTHORING-STORYBOARD-STEP-MISSING',
          'error',
          `${scene.id}.${entry.id}`,
          `El storyboard referencia el paso inexistente ${entry.sceneStepId}.`,
          'Corrige sceneStepId o crea el paso ejecutable.',
        ))
        for (const index of entry.timelineIndexes) {
          if (index >= scene.timeline.length) diagnostics.push(diagnostic(
            'AUTHORING-STORYBOARD-TIMELINE-INDEX',
            'error',
            `${scene.id}.${entry.id}`,
            `El índice de timeline ${index} no existe.`,
            'Usa un índice de acción real o elimina la referencia.',
          ))
        }
      })
    }
    for (const step of scene.steps) {
      const questionById = new Map(step.questions.map((question) => [question.id, question]))
      for (const question of step.questions) {
        const needsOptions = question.responseKind === 'single-choice' || question.responseKind === 'multiple-choice'
        if (needsOptions && (!question.options || question.options.length < 2)) diagnostics.push(diagnostic(
          'AUTHORING-QUESTION-OPTIONS-MISSING',
          'error',
          `${scene.id}.${step.id}.${question.id}`,
          'La pregunta de elección necesita al menos dos opciones.',
          'Añade opciones estables o utiliza otro tipo de respuesta.',
        ))
      }
      for (const condition of step.success) {
        if (condition.condition !== 'answer') continue
        const question = questionById.get(condition.questionId)
        if (!question) diagnostics.push(diagnostic(
          'AUTHORING-SUCCESS-QUESTION-MISSING',
          'error',
          `${scene.id}.${step.id}`,
          `La condición usa la pregunta inexistente ${condition.questionId}.`,
          'Corrige questionId.',
        ))
        else {
          const options = new Set(question.options?.map(({ id }) => id) ?? [])
          if (condition.expectedOptionIds.some((id) => !options.has(id))) diagnostics.push(diagnostic(
            'AUTHORING-SUCCESS-OPTION-MISSING',
            'error',
            `${scene.id}.${step.id}.${question.id}`,
            'La respuesta esperada contiene una opción inexistente.',
            'Corrige expectedOptionIds.',
          ))
        }
      }
    }
  }

  for (const resource of pack.visualResources) {
    if (resource.status === 'planned' || resource.status === 'blocked') diagnostics.push(diagnostic(
      'AUTHORING-VISUAL-RESOURCE-PENDING',
      resource.priority === 'critical' ? 'error' : 'warning',
      resource.id,
      `El recurso visual está ${resource.status}.`,
      'Prodúcelo, desbloquéalo o confirma que no bloquea la publicación.',
    ))
    for (const lessonId of resource.lessonIds) {
      if (!lessonIds.has(lessonId)) diagnostics.push(diagnostic(
        'AUTHORING-VISUAL-LESSON-MISSING',
        'error',
        resource.id,
        `El recurso referencia la lección inexistente ${lessonId}.`,
        'Corrige lessonIds.',
      ))
    }
  }

  for (const activity of pack.activities) {
    if (activity.evidenceTemplateIds.length === 0) diagnostics.push(diagnostic(
      'AUTHORING-ACTIVITY-WITHOUT-EVIDENCE',
      'error',
      activity.id,
      'La actividad no declara evidencia.',
      'Añade al menos una plantilla con regla de extracción.',
    ))
    for (const templateId of activity.evidenceTemplateIds) {
      const template = pack.evidenceTemplates.find(({ id }) => id === templateId)
      if (!template?.extraction) diagnostics.push(diagnostic(
        'AUTHORING-EVIDENCE-RULE-MISSING',
        'error',
        activity.id,
        `La plantilla ${templateId} no tiene regla de extracción ejecutable.`,
        'Completa evidenceTemplate.extraction.',
      ))
    }
    const rubric = pack.rubrics.find(({ id }) => id === activity.rubricId)
    if (!rubric || !activity.competencyIds.includes(rubric.competencyId)) diagnostics.push(diagnostic(
      'AUTHORING-ACTIVITY-RUBRIC-MISMATCH',
      'error',
      activity.id,
      'La rúbrica no corresponde a una competencia de la actividad.',
      'Vincula una rúbrica cuya competencyId sea evaluada por la actividad.',
    ))
    for (const templateId of activity.evidenceTemplateIds) {
      const template = pack.evidenceTemplates.find(({ id }) => id === templateId)
      if (template && !activity.competencyIds.includes(template.competencyId)) diagnostics.push(diagnostic(
        'AUTHORING-ACTIVITY-EVIDENCE-MISMATCH',
        'error',
        activity.id,
        `La evidencia ${template.id} pertenece a otra competencia.`,
        'Vincula evidencia de la competencia primaria de la actividad.',
      ))
    }
    const pedagogical = activity.authoring?.pedagogicalContract
    if (!pedagogical) {
      diagnostics.push(diagnostic(
        'AUTHORING-PEDAGOGICAL-CONTRACT-MISSING',
        pack.routes.some(({ demo }) => !demo) ? 'error' : 'warning',
        activity.id,
        'La actividad no declara qué conocimientos requiere, practica, evalúa ni cómo remedia un fallo.',
        'Añade authoring.pedagogicalContract antes de tratar esta actividad como parte de una ruta guiada.',
      ))
    } else {
      const referencedConceptIds = [
        ...pedagogical.requiresConceptIds,
        ...pedagogical.introducesConceptIds,
        ...pedagogical.demonstratesConceptIds,
        ...pedagogical.practicesConceptIds,
        ...pedagogical.assessesConceptIds,
        ...(pedagogical.remediation?.conceptIds ?? []),
      ]
      for (const conceptId of referencedConceptIds) {
        if (!conceptIds.has(conceptId)) diagnostics.push(diagnostic(
          'AUTHORING-ACTIVITY-CONCEPT-MISSING',
          'error',
          activity.id,
          `El contrato pedagógico referencia ${conceptId}, que no existe.`,
          'Declara el concepto o corrige requires/introduces/demonstrates/practices/assesses.',
        ))
      }
      if (pedagogical.remediation && !lessonIds.has(pedagogical.remediation.lessonId)) diagnostics.push(diagnostic(
        'AUTHORING-ACTIVITY-REMEDIATION-LESSON-MISSING',
        'error',
        activity.id,
        `La remediación apunta a ${pedagogical.remediation.lessonId}, que no existe.`,
        'Vincula una explicación o mini-puente real y conserva el retorno a la actividad.',
      ))
      if (
        pedagogical.remediation?.blockId
        && !pack.blocks.some(({ id }) => id === pedagogical.remediation?.blockId)
      ) diagnostics.push(diagnostic(
        'AUTHORING-ACTIVITY-REMEDIATION-BLOCK-MISSING',
        'error',
        activity.id,
        `La remediación apunta al bloque inexistente ${pedagogical.remediation.blockId}.`,
        'Corrige el bloque de retorno.',
      ))
      const lesson = pack.lessons.find(({ id }) => id === activity.authoring?.lessonId)
      const availableAtActivity = new Set([
        ...(lesson?.authoring?.prerequisiteConceptIds ?? []),
        ...(lesson?.authoring?.conceptIds ?? []),
      ])
      for (const requiredId of pedagogical.requiresConceptIds) {
        if (!availableAtActivity.has(requiredId)) diagnostics.push(diagnostic(
          'AUTHORING-ACTIVITY-REQUIRES-UNAVAILABLE-CONCEPT',
          'error',
          activity.id,
          `La actividad requiere ${requiredId}, pero su lección no lo enseña ni lo declara como prerrequisito.`,
          'Añade el concepto a la lección, crea un puente o corrige el requisito.',
        ))
      }
      if (
        pedagogical.assessmentIntent === 'demonstration'
        && activity.authoring?.interactionContract?.responseModel === 'single-choice'
        && rubric?.assessmentRule
        && !requiresRepeatedIndependentEvidence(rubric.assessmentRule.condition)
      ) diagnostics.push(diagnostic(
        'AUTHORING-SINGLE-CHOICE-CANNOT-DEMONSTRATE-ALONE',
        'error',
        activity.id,
        'Una sola selección correcta puede acreditar reconocimiento, pero no demostrar por sí sola una competencia.',
        'Exige evidencia independiente adicional, explicación causal o transferencia a otro contexto.',
      ))
    }
    const interaction = activity.authoring?.interactionContract
    const hints = interaction?.hints ?? []
    if (hints.length > 0 && hints.at(-1)?.kind !== 'post-attempt-explanation') diagnostics.push(diagnostic(
      'AUTHORING-HINT-FINAL-EXPLANATION-MISSING',
      'error',
      activity.id,
      'La última pista no es una explicación posterior al intento.',
      'Cierra la progresión con post-attempt-explanation disponible tras intentar.',
    ))

    const activityDomain = semanticDomainForSubsystem(activity.authoring?.subsystem ?? '')
    for (const scene of pack.scenes.filter(({ id }) => activity.sceneIds.includes(id))) {
      for (const step of scene.steps) {
        for (const question of step.questions) {
          // Las secuencias y comparaciones pueden abarcar varios dominios por
          // diseño. Este lint comprueba preguntas clasificatorias de intención
          // única, donde sí deben coincidir target, subsistema, pistas y clave.
          if (!['single-choice', 'multiple-choice'].includes(question.responseKind)) continue
          const promptDomain = uniqueFunctionalSemanticDomain([
            question.promptMarkdown,
            question.authoring?.prompt.es,
            question.authoring?.prompt.en,
          ])
          if (promptDomain && activityDomain && promptDomain !== activityDomain) diagnostics.push(diagnostic(
            'AUTHORING-QUESTION-SUBSYSTEM-MISMATCH',
            'error',
            `${activity.id}.${scene.id}.${question.id}`,
            `La pregunta apunta a ${promptDomain}, pero la actividad declara el subsistema ${activity.authoring?.subsystem} (${activityDomain}).`,
            'Alinea el subsistema de la actividad con el objeto que realmente pregunta la escena.',
          ))

          const authoredHints = [...(question.hints ?? []), ...hints]
          for (const hint of authoredHints) {
            const hintDomains = [...new Set([
              inferFunctionalSemanticDomain(hint.content.es ?? ''),
              inferFunctionalSemanticDomain(hint.content.en ?? ''),
            ].filter((domain): domain is FunctionalSemanticDomain => Boolean(domain)))]
            for (const hintDomain of hintDomains) {
              if (promptDomain && promptDomain !== hintDomain) diagnostics.push(diagnostic(
                'AUTHORING-QUESTION-HINT-MISMATCH',
                'error',
                `${activity.id}.${scene.id}.${question.id}.${hint.id}`,
                `La pregunta apunta a ${promptDomain}, pero la pista orienta hacia ${hintDomain}.`,
                'Reescribe la pista para que ayude sobre el mismo objeto y función que la pregunta.',
              ))
            }
          }

          const expectedOptionIds = step.success.flatMap((condition) =>
            condition.condition === 'answer' && condition.questionId === question.id
              ? condition.expectedOptionIds
              : [])
          for (const optionId of expectedOptionIds) {
            const option = question.options?.find(({ id }) => id === optionId)
            const optionDomain = option
              ? uniqueFunctionalSemanticDomain([
                option.label,
                option.labels?.es,
                option.labels?.en,
              ])
              : undefined
            if (promptDomain && optionDomain && promptDomain !== optionDomain) diagnostics.push(diagnostic(
              'AUTHORING-QUESTION-ANSWER-MISMATCH',
              'error',
              `${activity.id}.${scene.id}.${question.id}.${optionId}`,
              `La pregunta apunta a ${promptDomain}, pero la respuesta esperada pertenece a ${optionDomain}.`,
              'Corrige la opción esperada o reformula la pregunta para conservar una única intención evaluativa.',
            ))
          }
        }
      }
    }
  }

  for (const competency of pack.competencies) {
    const hasEvidence = pack.evidenceTemplates.some(({ competencyId, extraction }) =>
      competencyId === competency.id && extraction?.competencyId === competency.id)
    const hasRubric = pack.rubrics.some(({ competencyId, assessmentRule }) =>
      competencyId === competency.id && assessmentRule?.competencyId === competency.id)
    if (!hasEvidence || !hasRubric) diagnostics.push(diagnostic(
      'AUTHORING-COMPETENCY-NOT-EVALUABLE',
      'error',
      competency.id,
      `La competencia carece de ${!hasEvidence ? 'regla de evidencia' : 'rúbrica ejecutable'}.`,
      'Vincula una extracción de evidencia y una assessmentRule a la competencia.',
    ))
  }

  for (const rubric of pack.rubrics) {
    if (rubric.assessmentRule) {
      const producedTypes = new Set<string>(pack.evidenceTemplates
        .filter(({ competencyId, extraction }) =>
          competencyId === rubric.competencyId && extraction?.competencyId === rubric.competencyId)
        .flatMap(({ extraction }) => extraction ? [extraction.evidenceType] : []))
      for (const evidenceType of referencedEvidenceTypes(rubric.assessmentRule.condition)) {
        if (!producedTypes.has(evidenceType)) diagnostics.push(diagnostic(
          'AUTHORING-RUBRIC-EVIDENCE-TYPE-UNREACHABLE',
          'error',
          rubric.id,
          `La rúbrica exige evidencia ${evidenceType}, pero ninguna regla de la competencia puede producirla.`,
          'Alinea assessmentRule con evidenceTemplate.extraction.evidenceType.',
        ))
      }
    }
    if (rubric.assessmentRule?.targetState === 'retained' && !hasIndependentRetentionCondition(rubric.assessmentRule.condition)) {
      diagnostics.push(diagnostic(
        'AUTHORING-RETENTION-NOT-INDEPENDENT',
        'error',
        rubric.id,
        'Una rúbrica retained requiere evidencia posterior, independiente y en otra sesión.',
        'Usa independent-later-evidence con minimumDays > 0 y differentSession true.',
      ))
    }
  }

  if (pack.manifest.id === FUNCTIONAL_MAP_PACKAGE_ID) {
    if (pack.manifest.languages.length !== 1 || pack.manifest.languages[0] !== 'es-ES') diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-LANGUAGE',
      'error',
      'manifest.languages',
      'El primer módulo debe declarar únicamente es-ES.',
      'Usa languages: ["es-ES"]; el inglés queda limitado al glosario.',
    ))
    const module = pack.modules.find(({ id }) => id === 'module.horology.functional-map')
    const orderedLessons = module?.lessonIds.map((id) => pack.lessons.find((lesson) => lesson.id === id)?.title)
    if (
      !module
      || orderedLessons?.length !== FUNCTIONAL_MAP_LESSON_TITLES.length
      || FUNCTIONAL_MAP_LESSON_TITLES.some((title, index) => orderedLessons[index] !== title)
    ) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-LESSON-ORDER',
      'error',
      'module.horology.functional-map',
      'El módulo no contiene exactamente las seis lecciones aprobadas y en su orden normativo.',
      'Restaura títulos, puntuación y orden del blueprint.',
    ))
    const activitySceneIds = pack.activities.flatMap(({ sceneIds }) => sceneIds)
    const uniqueActivitySceneIds = new Set(activitySceneIds)
    const auxiliarySceneIds = pack.scenes
      .map(({ id }) => id)
      .filter((id) => !uniqueActivitySceneIds.has(id))
    const missingAuxiliaryScenes = FUNCTIONAL_MAP_AUXILIARY_SCENE_IDS
      .filter((id) => !auxiliarySceneIds.includes(id))
    if (
      uniqueActivitySceneIds.size !== 10
      || activitySceneIds.length !== 10
      || pack.activities.some(({ sceneIds }) => sceneIds.length !== 1)
    ) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-EVALUATIVE-SCENE-COUNT',
      'error',
      'scenes',
      `Las 10 actividades requieren una escena evaluativa propia; existen ${uniqueActivitySceneIds.size} escenas distintas para ${pack.activities.length} actividades.`,
      'Conserva una escena específica por actividad para que pregunta, pistas, respuesta y explicación evalúen el mismo objetivo.',
    ))
    if (
      auxiliarySceneIds.length !== FUNCTIONAL_MAP_AUXILIARY_SCENE_IDS.length
      || missingAuxiliaryScenes.length > 0
    ) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-AUXILIARY-SCENES',
      'error',
      'scenes',
      `Se requieren las 6 escenas visuales auxiliares; faltan ${missingAuxiliaryScenes.join(', ') || 'ninguna'} y existen ${auxiliarySceneIds.length} auxiliares.`,
      'Conserva las seis escenas visuales A–F además de las diez escenas evaluativas específicas.',
    ))
    if (pack.activities.length !== 10) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-ACTIVITY-COUNT',
      'error',
      'activities',
      `Se requieren las 10 actividades aprobadas y existen ${pack.activities.length}.`,
      'Conserva las diez actividades del Sistema 4C, cada una con su pregunta y escena específicas.',
    ))
    const competencyIds = new Set(pack.competencies.map(({ id }) => id))
    if (
      pack.competencies.length !== FUNCTIONAL_MAP_COMPETENCIES.length
      || FUNCTIONAL_MAP_COMPETENCIES.some((id) => !competencyIds.has(id))
    ) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-COMPETENCIES',
      'error',
      'competencies',
      'Las seis competencias no coinciden con el blueprint.',
      'Usa los seis IDs normativos.',
    ))
    if (pack.glossary.length < 36) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-GLOSSARY',
      'error',
      'glossary',
      `El glosario requiere al menos 36 términos y contiene ${pack.glossary.length}.`,
      'Añade las equivalencias ES/EN y sus definiciones revisadas.',
    ))
    for (const lesson of pack.lessons) {
      const markdown = lesson.blockIds
        .map((id) => pack.blocks.find((block) => block.id === id)?.bodyMarkdown ?? '')
        .join('\n')
      for (const { role, headings } of REQUIRED_LESSON_SECTION_ROLES) {
        if (!headings.some((heading) => markdown.includes(`## ${heading}`))) diagnostics.push(diagnostic(
          'AUTHORING-FUNCTIONAL-MAP-SECTION-MISSING',
          'error',
          lesson.id,
          `Falta la sección editorial con función “${role}”.`,
          `Añade contenido original bajo uno de estos encabezados: ${headings.join(' / ')}.`,
        ))
      }
    }
    for (const competencyId of FUNCTIONAL_MAP_COMPETENCIES) {
      const hasRecommendation = pack.recommendations.some(({ kind, target }) =>
        kind === 'retention' && target.kind === 'competency' && target.id === competencyId)
      if (!hasRecommendation) diagnostics.push(diagnostic(
        'AUTHORING-FUNCTIONAL-MAP-RETENTION-RECOMMENDATION',
        'error',
        competencyId,
        'La competencia no declara recomendación de retención futura.',
        'Añade una recomendación retention en un contexto posterior.',
      ))
    }
    if (pack.rubrics.some(({ assessmentRule }) => assessmentRule?.targetState === 'retained')) diagnostics.push(diagnostic(
      'AUTHORING-FUNCTIONAL-MAP-IMMEDIATE-RETENTION',
      'error',
      'rubrics',
      'El primer módulo no puede conceder retained.',
      'Limita sus reglas ejecutables a demonstrated.',
    ))
  }

  if (pack.manifest.editorialStatus === 'published-local') {
    for (const resource of pack.visualResources) {
      if (resource.status !== 'approved') diagnostics.push(diagnostic(
        'AUTHORING-PUBLISHED-RESOURCE-NOT-APPROVED',
        'error',
        resource.id,
        'Un paquete published-local solo puede usar recursos aprobados.',
        'Mantén el paquete in-review o aprueba el recurso tras la revisión humana.',
      ))
    }
  }

  const visualNeeds = buildVisualNeedsReport(pack)
  return {
    valid: diagnostics.every(({ severity }) => severity !== 'error'),
    pack,
    diagnostics: diagnostics.sort((left, right) =>
      left.severity.localeCompare(right.severity) || left.code.localeCompare(right.code) || left.path.localeCompare(right.path)),
    visualNeeds,
  }
}

export function visualNeedsAsMarkdown(pack: LearningPack): string {
  const rows = buildVisualNeedsReport(pack).map((item) => [
    item.resourceId,
    item.lessonIds.join(', '),
    item.type,
    item.movementIds.join(', ') || '—',
    item.partSelectors.map(({ selector }) => JSON.stringify(selector)).join('; ') || '—',
    item.requiredCapabilities.join(', ') || '—',
    item.dataRequirements.join('; ') || '—',
    item.status,
    item.priority,
    `${item.fidelity.geometry}/${item.fidelity.kinematics}/${item.fidelity.physics}`,
    item.currentModelSupport,
    item.viewportImpact,
    item.dependencyIds.join(', ') || '—',
  ].map((value) => String(value).replaceAll('|', '\\|')).join(' | '))
  return [
    '# Informe de necesidades visuales',
    '',
    `Paquete: \`${pack.manifest.id}@${pack.manifest.packageVersion}\``,
    '',
    '| Recurso | Lecciones | Tipo | Movimiento | Piezas/selectores | Capacidades | Datos necesarios | Estado | Prioridad | Fidelidad | Modelo actual | Viewport | Dependencias |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row} |`),
    '',
  ].join('\n')
}
