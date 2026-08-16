export type AcademyPathNodeRole = 'anchor' | 'support' | 'optional-branch' | 'reference' | 'planned'
export type AcademyCoverageStatus = 'complete' | 'partial' | 'planned' | 'source-review-required'
export type AcademyCurationMethod = 'manual-curation' | 'explicit-authoring'
export type AcademyCurationConfidence = 'high'
export type AcademyMasteryCoveragePolicy =
  | 'none'
  | 'per-assessed-step'
  | 'all-required-steps'
  | 'chapter-capstone'
  | 'explicit-competency-set'

export type AcademyStepCompletionPolicy =
  | 'study-only'
  | 'study-and-required-practice'
  | 'study-practice-and-demonstration'

export interface AcademyLearnerStep {
  stepId: string
  chapterId: string
  order: number
  lessonId: string
  requiredActivityIds: string[]
  optionalActivityIds: string[]
  explicitlySharedActivityIds: string[]
  completionPolicy: AcademyStepCompletionPolicy
  curationReason: string
}

export interface AcademyCurationRecord {
  entityId: string
  contentHash: string | 'not-recorded'
  reviewedFields: string[]
  reviewMethod: 'declared-curation' | 'recorded-manual-review' | 'explicit-authoring'
  reviewedAt: string | null
  reviewerKind: 'editorial-system' | 'human-editor' | 'author'
  notes: string
  sourceVersion: string
  confidence: 'high' | 'medium' | 'low'
}

export interface AcademyPathCompletionPolicy {
  anchorLessons: 'all-studied'
  requiredActivities: 'all-satisfied'
  physicalEvidence: 'tracked-separately'
}

export interface AcademyPhysicalEvidencePolicy {
  physicalCompetenceClaim: boolean
  conceptualProgressCanCompleteWithoutPhysicalEvidence: true
  requiredPhysicalModality: 'P' | 'none'
  note: string
}

export interface AcademyAnchorLessonReview {
  lessonId: string
  role: 'anchor'
  titleReviewed: true
  objectiveReviewed: true
  activitiesReviewed: true
  prerequisitesReviewed: true
  sourceRolesReviewed: true
  curationMethod: AcademyCurationMethod
  curationConfidence: AcademyCurationConfidence
  reason: string
}

export interface AcademySupportingLesson {
  lessonId: string
  role: 'support' | 'optional-branch' | 'reference'
  reason: string
}

export interface AcademyLearnerChapter {
  chapterId: string
  stageId: string
  order: number
  title: string
  description: string
  whyNow: string
  outcome: string
  /** Relación canónica lección-práctica desde 0.14B.1. */
  steps: AcademyLearnerStep[]
  /** @deprecated Derivado de steps; no usar para emparejar por índice. */
  anchorLessonIds: string[]
  anchorReviews: AcademyAnchorLessonReview[]
  supportingLessonIds: string[]
  supportingLessons: AcademySupportingLesson[]
  /** @deprecated Derivado de steps; no usar para emparejar por índice. */
  requiredActivityIds: string[]
  optionalActivityIds: string[]
  prerequisiteChapterIds: string[]
  optionalBranchIds: string[]
  plannedContentRefs: string[]
  coverageStatus: AcademyCoverageStatus
  curationMethod: AcademyCurationMethod
  curationConfidence: AcademyCurationConfidence
  curationReason: string
  estimatedDuration?: { minutes: number; basis: 'authored-required-activity-duration' }
  completionPolicy: AcademyPathCompletionPolicy
  physicalEvidencePolicy: AcademyPhysicalEvidencePolicy
  masteryCoveragePolicy: AcademyMasteryCoveragePolicy
  masteryCoverageCompetencyIds: string[]
  masteryCapstoneStepId?: string
}

export interface AcademyLearnerStage {
  stageId: string
  order: number
  title: string
  shortTitle: string
  promise: string
  outcome: string
  rationale: string
  chapterIds: string[]
  prerequisiteStageIds: string[]
  coverageStatus: AcademyCoverageStatus
  optionalBranchIds: string[]
  completionPolicy: AcademyPathCompletionPolicy
}

export interface AcademyOptionalBranch {
  branchId: string
  stageId: string
  title: string
  description: string
  routeIds: string[]
  blocking: false
}

export interface AcademyLearnerPathDefinition {
  pathId: string
  version: string
  title: string
  description: string
  learnerGoal: string
  stageIds: string[]
  defaultLocale: 'es-ES'
  sourceAuditPhase: '0.14A.1'
  curationStatus: 'manually-curated'
  stages: AcademyLearnerStage[]
  chapters: AcademyLearnerChapter[]
  optionalBranches: AcademyOptionalBranch[]
}

const COMPLETION_POLICY: AcademyPathCompletionPolicy = {
  anchorLessons: 'all-studied',
  requiredActivities: 'all-satisfied',
  physicalEvidence: 'tracked-separately',
}

const CONCEPTUAL_POLICY: AcademyPhysicalEvidencePolicy = {
  physicalCompetenceClaim: false,
  conceptualProgressCanCompleteWithoutPhysicalEvidence: true,
  requiredPhysicalModality: 'none',
  note: 'La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.',
}

const BENCH_POLICY: AcademyPhysicalEvidencePolicy = {
  physicalCompetenceClaim: true,
  conceptualProgressCanCompleteWithoutPhysicalEvidence: true,
  requiredPhysicalModality: 'P',
  note: 'La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.',
}

type AnchorInput = readonly [lessonId: string, activityId: string, reason: string]
type SupportInput = readonly [lessonId: string, role: AcademySupportingLesson['role'], reason: string]

const DEMONSTRATION_ACTIVITY_IDS = new Set([
  'activity.horology.order-mechanical-chain',
  'activity.horology.match-functional-equivalents',
  'activity.horology.justify-hypothesis',
  'activity.mechanical.build-final-project',
  'activity.miyota8215.complete-diagnosis',
  'activity.metrology.defender-el-proyecto-final',
  'activity.encyclopedia.service-tribology.tm-diagnostico-sintomas',
])

function chapter(input: Omit<AcademyLearnerChapter,
  'steps' | 'anchorLessonIds' | 'anchorReviews' | 'supportingLessonIds' | 'supportingLessons'
  | 'requiredActivityIds' | 'curationMethod' | 'curationConfidence' | 'completionPolicy'
  | 'physicalEvidencePolicy' | 'masteryCoveragePolicy' | 'masteryCoverageCompetencyIds'
  | 'masteryCapstoneStepId'> & {
    anchors: AnchorInput[]
    support?: SupportInput[]
    physical?: boolean
    masteryCoveragePolicy?: AcademyMasteryCoveragePolicy
    masteryCoverageCompetencyIds?: string[]
    masteryCapstoneStepId?: string
  }): AcademyLearnerChapter {
  const {
    anchors,
    support = [],
    physical = false,
    masteryCoveragePolicy = 'per-assessed-step',
    masteryCoverageCompetencyIds = [],
    masteryCapstoneStepId,
    ...fields
  } = input
  const steps: AcademyLearnerStep[] = anchors.map(([lessonId, activityId, reason], index) => ({
    stepId: `academy.step.${fields.chapterId.slice('chapter.'.length)}.${index + 1}`,
    chapterId: fields.chapterId,
    order: index + 1,
    lessonId,
    requiredActivityIds: activityId ? [activityId] : [],
    optionalActivityIds: [],
    explicitlySharedActivityIds: [],
    completionPolicy: DEMONSTRATION_ACTIVITY_IDS.has(activityId)
      ? 'study-practice-and-demonstration'
      : activityId ? 'study-and-required-practice' : 'study-only',
    curationReason: reason,
  }))
  return {
    ...fields,
    steps,
    anchorLessonIds: steps.map(({ lessonId }) => lessonId),
    anchorReviews: anchors.map(([lessonId, , reason]) => ({
      lessonId,
      role: 'anchor',
      titleReviewed: true,
      objectiveReviewed: true,
      activitiesReviewed: true,
      prerequisitesReviewed: true,
      sourceRolesReviewed: true,
      curationMethod: 'manual-curation',
      curationConfidence: 'high',
      reason,
    })),
    supportingLessonIds: support.map(([lessonId]) => lessonId),
    supportingLessons: support.map(([lessonId, role, reason]) => ({ lessonId, role, reason })),
    requiredActivityIds: steps.flatMap(({ requiredActivityIds }) => requiredActivityIds),
    curationMethod: 'manual-curation',
    curationConfidence: 'high',
    completionPolicy: COMPLETION_POLICY,
    physicalEvidencePolicy: physical ? BENCH_POLICY : CONCEPTUAL_POLICY,
    masteryCoveragePolicy,
    masteryCoverageCompetencyIds,
    ...(masteryCapstoneStepId ? { masteryCapstoneStepId } : {}),
  }
}

export const ACADEMY_STAGE_5_PLANNED_REFS = [
  'stage5-gap.movement-holder',
  'stage5-gap.dial-feet',
  'stage5-gap.dial-diameter',
  'stage5-gap.hand-holes-fit',
  'stage5-gap.hour-wheel-stack',
  'stage5-gap.caseback-clearance',
  'stage5-gap.dynamic-interferences',
  'stage5-gap.final-assembly-verification',
] as const

export interface AcademyPlannedContentMetadata {
  ref: (typeof ACADEMY_STAGE_5_PLANNED_REFS)[number]
  title: string
  summary: string
  stageId: 'stage.5'
  chapterId: string
  status: 'planned' | 'source-review-required' | 'implemented-method'
}

export const ACADEMY_PLANNED_CONTENT: readonly AcademyPlannedContentMetadata[] = [
  { ref: 'stage5-gap.movement-holder', title: 'Aro o soporte del movimiento', summary: 'Método disponible; requiere datos aplicables del movimiento y la caja.', stageId: 'stage.5', chapterId: 'chapter.5.2', status: 'implemented-method' },
  { ref: 'stage5-gap.dial-feet', title: 'Pies de esfera', summary: 'Método disponible; requiere posición y fijación documentadas.', stageId: 'stage.5', chapterId: 'chapter.5.3', status: 'implemented-method' },
  { ref: 'stage5-gap.dial-diameter', title: 'Diámetro y asiento de esfera', summary: 'Método disponible; requiere dimensiones del conjunto elegido.', stageId: 'stage.5', chapterId: 'chapter.5.3', status: 'implemented-method' },
  { ref: 'stage5-gap.hand-holes-fit', title: 'Ajuste de agujas', summary: 'Método disponible; necesita autoridad de ambas interfaces y validación física.', stageId: 'stage.5', chapterId: 'chapter.5.3', status: 'implemented-method' },
  { ref: 'stage5-gap.hour-wheel-stack', title: 'Rueda de horas y apilamiento axial', summary: 'Método disponible; la cadena permanece abierta con cualquier altura unknown.', stageId: 'stage.5', chapterId: 'chapter.5.3', status: 'implemented-method' },
  { ref: 'stage5-gap.caseback-clearance', title: 'Fondo y holgura posterior', summary: 'Método disponible; requiere envolvente posterior y fondo aplicables.', stageId: 'stage.5', chapterId: 'chapter.5.2', status: 'implemented-method' },
  { ref: 'stage5-gap.dynamic-interferences', title: 'Interferencias dinámicas', summary: 'Método disponible; declara estados evaluados y omitidos.', stageId: 'stage.5', chapterId: 'chapter.5.4', status: 'implemented-method' },
  { ref: 'stage5-gap.final-assembly-verification', title: 'Montaje final y verificación', summary: 'Plan reversible disponible; la ejecución física permanece pendiente.', stageId: 'stage.5', chapterId: 'chapter.5.5', status: 'implemented-method' },
]

const chapters: AcademyLearnerChapter[] = [
  chapter({
    chapterId: 'chapter.0.1', stageId: 'stage.0', order: 1,
    title: 'Banco, postura, iluminación y herramientas',
    description: 'Preparar un entorno ordenado y seleccionar herramientas sin comenzar todavía un servicio real.',
    whyNow: 'El control del entorno reduce errores antes de estudiar mecanismos o manipular componentes.',
    outcome: 'Preparar un banco virtual seguro y justificar la herramienta adecuada.',
    anchors: [
      ['lesson.quartz2035.workstation', 'activity.quartz2035.prepare-workbench', 'Su objetivo y sus dos prácticas verifican preparación del banco y detección de condiciones inseguras sin atribuir trabajo físico.'],
      ['lesson.quartz2035.tools', 'activity.quartz2035.select-tools', 'Presenta selección y rechazo de herramientas con una actividad virtual específica y segura.'],
    ],
    support: [['lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad', 'support', 'Amplía postura, orden y seguridad; su cita amplia sigue en revisión editorial.']],
    optionalActivityIds: ['activity.quartz2035.detect-unsafe-conditions', 'activity.quartz2035.reject-wrong-tool'],
    prerequisiteChapterIds: [], optionalBranchIds: ['branch.quartz-initiation'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Entrada de baja carga cognitiva con objetivos observables y prácticas K/V ya implementadas.',
  }),
  chapter({
    chapterId: 'chapter.0.2', stageId: 'stage.0', order: 2,
    title: 'Control, manipulación, limpieza y primeras evidencias',
    description: 'Separar el gesto de banco, su simulación y la evidencia física que todavía no captura la Academia.',
    whyNow: 'La manipulación básica debe preceder a cualquier desmontaje.',
    outcome: 'Explicar una manipulación controlada y reconocer qué faltaría para demostrarla físicamente.',
    anchors: [
      ['lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion', 'activity.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion', 'El objetivo trata observación y manipulación; la actividad existente es K/V y no se confunde con ejecución física.'],
      ['lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'activity.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'Introduce contaminación y limpieza segura antes de intervenir, con límites operativos explícitos.'],
    ],
    support: [['lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica', 'support', 'Pasaporte psicomotor valioso, mantenido como apoyo hasta existir una vía P documentada.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.0.1'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'Se conserva la progresión psicomotriz, separando aprendizaje conceptual de acreditación física.', physical: true,
  }),

  chapter({
    chapterId: 'chapter.1.1', stageId: 'stage.1', order: 1,
    title: 'El reloj como sistema funcional',
    description: 'Ver energía, transmisión, regulación e indicación antes de memorizar piezas.',
    whyNow: 'La visión general debe preceder al detalle.',
    outcome: 'Clasificar una pieza por su función dentro del sistema completo.',
    anchors: [['lesson.horology.system', 'activity.horology.classify-subsystems', 'Lección inicial explícita con mapa funcional y práctica de clasificación; no exige prerrequisitos avanzados.']],
    support: [['lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', 'support', 'Vista sistémica valiosa cuyos tres prerrequisitos impropios se resuelven como no bloqueantes.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.0.2'], optionalBranchIds: ['branch.history-context'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Una única vista funcional evita iniciar con una pared de componentes.',
  }),
  chapter({
    chapterId: 'chapter.1.2', stageId: 'stage.1', order: 2,
    title: 'Cadena mecánica, cadena de cuarzo y equivalencias',
    description: 'Comparar arquitecturas distintas mediante funciones equivalentes.',
    whyNow: 'La comparación refuerza el modelo funcional sin convertir el cuarzo en requisito del itinerario mecánico.',
    outcome: 'Ordenar la cadena mecánica y emparejar equivalencias funcionales.',
    anchors: [
      ['lesson.horology.mechanical-chain', 'activity.horology.order-mechanical-chain', 'Objetivo causal y práctica de ordenación directamente alineados; gold set confirma arquetipo conceptual K/V.'],
      ['lesson.horology.functional-equivalence', 'activity.horology.match-functional-equivalents', 'La transferencia entre cuarzo y mecánico es conceptual y no hereda riesgos históricos ni destreza física.'],
    ],
    support: [['lesson.horology.quartz-chain', 'support', 'Amplía la cadena de cuarzo sin volverla obligatoria para el recorrido mecánico.']],
    optionalActivityIds: ['activity.horology.identify-escapement-oscillator'], prerequisiteChapterIds: ['chapter.1.1'], optionalBranchIds: ['branch.quartz-theory'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Dos anchors de alta confianza comparan sistemas sin imponer una rama de cuarzo.',
  }),
  chapter({
    chapterId: 'chapter.1.3', stageId: 'stage.1', order: 3,
    title: 'Vocabulario, documentación y procedencia',
    description: 'Leer nombres, especificaciones, planos, límites y autoridad de una fuente.',
    whyNow: 'Antes de usar datos técnicos hay que distinguir documentación oficial, teoría, caso y referencia.',
    outcome: 'Localizar una afirmación y justificar qué fuente puede sostenerla.',
    anchors: [['lesson.encyclopedia.history-language.leer-documentacion', 'activity.encyclopedia.history-language.leer-documentacion', 'Su objetivo observable y actividad enseñan lectura documental; se acepta tras revisar su sourceRole y mantener pendiente la precisión de cita.']],
    support: [
      ['lesson.encyclopedia.history-language.medir-el-tiempo', 'optional-branch', 'Contexto histórico no bloqueante.'],
      ['lesson.advanced.atlas-authority', 'reference', 'Consulta avanzada sobre autoridad y procedencia.'],
    ],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.1.2'], optionalBranchIds: ['branch.history-context'], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'El recorrido necesita alfabetización documental, pero no hereda toda la ruta histórica.',
  }),

  chapter({
    chapterId: 'chapter.2.1', stageId: 'stage.2', order: 1,
    title: 'Fuente de energía, muelle real y barrilete',
    description: 'Seguir cómo se almacena y entrega energía mecánica.',
    whyNow: 'La energía es la causa inicial de todos los subsistemas posteriores.',
    outcome: 'Explicar la función del barrilete y predecir una interrupción de energía.',
    anchors: [
      ['lesson.mechanical.energy', 'activity.mechanical.classify-energy-functions', 'El objetivo y la práctica presentan la cadena energética antes de componentes detallados.'],
      ['lesson.mechanical.barrel', 'activity.mechanical.load-unload-barrel', 'La actividad representa carga y descarga de forma virtual, con alcance explícito.'],
      ['lesson.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete', 'activity.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete', 'Aporta curva de par y vocabulario técnico como aplicación inmediata, no como muralla matemática.'],
    ],
    support: [['lesson.encyclopedia.math-physics-metrology.fuerza-par-energia', 'support', 'Matemática justo a tiempo para distinguir par, trabajo, energía y potencia.']],
    optionalActivityIds: ['activity.mechanical.interrupt-energy-chain', 'activity.mechanical.identify-barrel-parts'], prerequisiteChapterIds: ['chapter.1.3'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Secuencia causal desde energía hasta entrega de par, con apoyo cuantitativo contextual.',
  }),
  chapter({
    chapterId: 'chapter.2.2', stageId: 'stage.2', order: 2,
    title: 'Ruedas, piñones, relaciones y tren de rodaje',
    description: 'Comprender engrane, sentido de giro y relación total.',
    whyNow: 'Una vez disponible la energía, hay que seguir su transmisión.',
    outcome: 'Construir un tren virtual y justificar relación y sentido de giro.',
    anchors: [
      ['lesson.mechanical.gear-pair', 'activity.mechanical.predict-pair-direction', 'Presenta el par mínimo antes de construir un tren.'],
      ['lesson.mechanical.train', 'activity.mechanical.build-train', 'Su práctica reconstruye el sistema y comprueba la transmisión.'],
      ['lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren', 'activity.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren', 'Amplía relaciones y arquitectura con actividad visual alineada.'],
    ],
    support: [
      ['lesson.encyclopedia.math-physics-metrology.toh-contar-tren', 'support', 'Cálculo aplicado cuando la relación del tren ya tiene significado.'],
      ['lesson.encyclopedia.mechanical-energy-trains.toh-engranaje-geometria', 'reference', 'Detalle geométrico posterior, sujeto a revisión de locadores.'],
    ],
    optionalActivityIds: ['activity.mechanical.calculate-pair-ratio', 'activity.mechanical.calculate-total-ratio'], prerequisiteChapterIds: ['chapter.2.1'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Va del par de ruedas al tren y aplaza la geometría avanzada.',
  }),
  chapter({
    chapterId: 'chapter.2.3', stageId: 'stage.2', order: 3,
    title: 'Escape y entrega de impulso',
    description: 'Separar bloqueo, impulso, caída y seguridad.',
    whyNow: 'El escape conecta transmisión y oscilador.',
    outcome: 'Ordenar fases y reconocer dónde se entrega o se detiene energía.',
    anchors: [
      ['lesson.mechanical.escapement', 'activity.mechanical.order-escapement-phases', 'Objetivo causal y práctica de secuencia centrados en las fases del escape.'],
      ['lesson.encyclopedia.escapements-chronometry.geometria-del-escape', 'activity.encyclopedia.escapements-chronometry.geometria-del-escape', 'Aporta vocabulario geométrico y seguridad como detalle inmediatamente útil.'],
      ['lesson.encyclopedia.escapements-chronometry.toh-escape-fases', 'activity.encyclopedia.escapements-chronometry.toh-escape-fases', 'Segunda representación conceptual para transferencia; fórmulas y locadores siguen fuera del alcance de 0.14B.'],
    ],
    support: [['lesson.advanced.escapement-compare', 'optional-branch', 'Comparación avanzada de geometrías no transferibles.']],
    optionalActivityIds: ['activity.mechanical.identify-lock-impulse-drop'], prerequisiteChapterIds: ['chapter.2.2'], optionalBranchIds: ['branch.complications'], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'La secuencia base precede a comparación y geometría avanzada.',
  }),
  chapter({
    chapterId: 'chapter.2.4', stageId: 'stage.2', order: 4,
    title: 'Volante, espiral, oscilación y marcha',
    description: 'Relacionar frecuencia, amplitud, realimentación y perturbación.',
    whyNow: 'Después de comprender el escape puede estudiarse el regulador como sistema.',
    outcome: 'Distinguir frecuencia y amplitud y explicar la relación escape-oscilador.',
    anchors: [
      ['lesson.mechanical.oscillator', 'activity.mechanical.distinguish-frequency-amplitude', 'Lección conceptual con actividad que separa magnitudes sin exigir ajuste físico.'],
      ['lesson.mechanical.escape-oscillator', 'activity.mechanical.relate-escape-oscillator', 'Integra ambos subsistemas y produce una explicación causal.'],
      ['lesson.encyclopedia.escapements-chronometry.volante-y-espiral', 'activity.encyclopedia.escapements-chronometry.volante-y-espiral', 'Aporta anatomía y vocabulario técnico antes de regulación avanzada.'],
    ],
    support: [['lesson.encyclopedia.math-physics-metrology.oscilacion-amortiguamiento', 'support', 'Modelo matemático justo cuando resuelve oscilación y amortiguamiento.']],
    optionalActivityIds: ['activity.mechanical.predict-escapement-interruption'], prerequisiteChapterIds: ['chapter.2.3'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Integra escape y regulador antes de introducir perturbaciones y cronocomparación.',
  }),
  chapter({
    chapterId: 'chapter.2.5', stageId: 'stage.2', order: 5,
    title: 'Minutería, cuerda y puesta en hora',
    description: 'Distinguir transmisión de marcha, indicación y mando del usuario.',
    whyNow: 'La indicación y el sistema de puesta en hora se entienden después del tren y el regulador.',
    outcome: 'Reconstruir estados de tija y construir la minutería virtual.',
    anchors: [
      ['lesson.mechanical.motion-works', 'activity.mechanical.build-motion-works', 'Presenta la indicación con práctica de construcción virtual.'],
      ['lesson.mechanical.keyless', 'activity.mechanical.reconstruct-crown-states', 'Se centra en estados de cuerda y puesta en hora con una secuencia observable.'],
    ],
    support: [['lesson.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora', 'support', 'Detalle técnico posterior; deja de contaminar como prerrequisito de la visión general.']],
    optionalActivityIds: ['activity.mechanical.set-indication', 'activity.mechanical.operate-winding-setting'], prerequisiteChapterIds: ['chapter.2.4'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Agrupa dos interfaces funcionales sin anticiparlas como requisitos de la visión general.',
  }),
  chapter({
    chapterId: 'chapter.2.6', stageId: 'stage.2', order: 6,
    title: 'Automático, calendario y ampliaciones funcionales',
    description: 'Añadir captación automática y calendario sobre la arquitectura básica.',
    whyNow: 'Las ampliaciones se entienden mejor después del movimiento mecánico simple.',
    outcome: 'Seguir la carga automática y explicar un cambio de fecha.',
    anchors: [
      ['lesson.mechanical.automatic-calendar', 'activity.mechanical.follow-automatic-energy', 'Integra automático y calendario básico sin convertir complicaciones en requisito.'],
      ['lesson.encyclopedia.complications.automatico-y-reserva', 'activity.encyclopedia.complications.automatico-y-reserva', 'Profundiza en embragues y reserva mediante una actividad visual.'],
      ['lesson.encyclopedia.complications.calendarios', 'activity.encyclopedia.complications.calendarios', 'Ofrece anatomía visual del calendario básico antes de variantes avanzadas.'],
    ],
    support: [
      ['lesson.advanced.calendars', 'optional-branch', 'Mecánica avanzada del calendario.'],
      ['lesson.advanced.chronograph-control', 'optional-branch', 'Control de cronógrafo fuera de la columna vertebral.'],
    ],
    optionalActivityIds: ['activity.mechanical.explain-date-change'], prerequisiteChapterIds: ['chapter.2.5'], optionalBranchIds: ['branch.complications'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Cierra fundamentos con ampliaciones inmediatas y mantiene complicaciones como rama.',
  }),

  chapter({
    chapterId: 'chapter.3.1', stageId: 'stage.3', order: 1,
    title: 'Observar e inspeccionar antes de desmontar',
    description: 'Separar observación, inferencia, historia y línea base.',
    whyNow: 'La inspección precede a la intervención.',
    outcome: 'Registrar una observación sin convertirla prematuramente en diagnóstico.',
    anchors: [
      ['lesson.metrology.observe-before-measuring', 'activity.metrology.preparar-una-inspeccion', 'Objetivo y prácticas separan observación e hipótesis.'],
      ['lesson.metrology.inspection-findings', 'activity.metrology.registrar-hallazgo', 'Estructura un hallazgo y su evidencia R sin atribuir inspección física.'],
      ['lesson.encyclopedia.service-tribology.recepcion-y-linea-base', 'activity.encyclopedia.service-tribology.recepcion-y-linea-base', 'Introduce recepción e historia como línea base previa al servicio.'],
    ],
    support: [['lesson.encyclopedia.service-tribology.tm-inspeccion-previa', 'optional-branch', 'Caso histórico de inspección, no procedimiento prohibido por herencia de fuente.']],
    optionalActivityIds: ['activity.metrology.separar-observacion-e-hipotesis'], prerequisiteChapterIds: ['chapter.2.6'], optionalBranchIds: ['branch.historical-cases'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Tres perspectivas compatibles fijan el hábito de observar antes de intervenir.',
  }),
  chapter({
    chapterId: 'chapter.3.2', stageId: 'stage.3', order: 2,
    title: 'Medir, registrar y comparar',
    description: 'Elegir instrumento, resolución y registro adecuados.',
    whyNow: 'Una hipótesis solo puede comprobarse con observaciones comparables.',
    outcome: 'Elegir una medición y comunicar su límite sin inventar precisión.',
    anchors: [
      ['lesson.metrology.units-scale-resolution', 'activity.metrology.diferenciar-resolucion-y-precision', 'Base cuantitativa explícita con práctica de resolución.'],
      ['lesson.metrology.instruments', 'activity.metrology.seleccionar-instrumento', 'La selección de instrumento resuelve una necesidad concreta.'],
      ['lesson.metrology.physical-measurement', 'activity.metrology.medir-diametro', 'Conecta el registro con una pieza física, pero la actividad actual solo produce K/R y no acredita P.'],
    ],
    support: [
      ['lesson.metrology.precision-accuracy-uncertainty', 'support', 'Profundiza incertidumbre cuando ya existe una tarea de medición.'],
      ['lesson.metrology.compare-data', 'support', 'Comparación posterior de registros.'],
    ],
    optionalActivityIds: ['activity.metrology.detectar-paralaje', 'activity.metrology.medir-distancia-entre-centros'], prerequisiteChapterIds: ['chapter.3.1'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Metrología introducida por necesidad y con frontera física explícita.', physical: true,
  }),
  chapter({
    chapterId: 'chapter.3.3', stageId: 'stage.3', order: 3,
    title: 'Síntoma, hipótesis y prueba diagnóstica',
    description: 'Formular hipótesis y seleccionar una prueba discriminante.',
    whyNow: 'Diagnosticar requiere observación y medición previas.',
    outcome: 'Defender una hipótesis y explicar qué resultado la refutaría.',
    anchors: [
      ['lesson.horology.failure-prediction', 'activity.horology.justify-hypothesis', 'Práctica de hipótesis, predicción y transferencia sobre un sistema conocido.'],
      ['lesson.encyclopedia.service-tribology.diagnostico-y-control-final', 'activity.encyclopedia.service-tribology.diagnostico-y-control-final', 'Alinea diagnóstico causal con control final.'],
      ['lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'activity.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'Caso histórico con prueba discriminante y evidencia K/V/R, sin heredar peligro de la obra completa.'],
    ],
    support: [['lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b', 'optional-branch', 'Caso histórico cuyos tres marcos modernos dejan de ser bloqueantes.']],
    optionalActivityIds: ['activity.horology.predict-interruption'], prerequisiteChapterIds: ['chapter.3.2'], optionalBranchIds: ['branch.historical-cases'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'La hipótesis se practica primero en modelo y después en casos documentales.',
  }),
  chapter({
    chapterId: 'chapter.3.4', stageId: 'stage.3', order: 4,
    title: 'Limpieza, lubricación, servicio y criterios de aceptación',
    description: 'Planificar decisiones de servicio y puntos de control sin convertir fuentes históricas en instrucciones vigentes.',
    whyNow: 'El servicio se plantea después del diagnóstico, no antes.',
    outcome: 'Justificar una decisión de limpieza o lubricación y definir su aceptación.',
    anchors: [
      ['lesson.encyclopedia.service-tribology.limpieza-e-inspeccion', 'activity.encyclopedia.service-tribology.limpieza-e-inspeccion', 'Vincula limpieza con inspección y clasificación de defectos.'],
      ['lesson.encyclopedia.service-tribology.tribologia-y-lubricantes', 'activity.encyclopedia.service-tribology.tribologia-y-lubricantes', 'Introduce lubricación como decisión documentada, no receta histórica.'],
      ['lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'activity.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'Organiza el montaje por funciones y verificaciones parciales.'],
    ],
    support: [['lesson.advanced.service-clean-lube', 'optional-branch', 'Método avanzado de servicio documentado.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.3.3'], optionalBranchIds: ['branch.advanced-service'], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'Separamos criterio moderno de servicio y contexto histórico.',
  }),

  chapter({
    chapterId: 'chapter.4.1', stageId: 'stage.4', order: 1,
    title: 'Identificación, documentación y arquitectura del MIYOTA 8215',
    description: 'Entrar en un calibre concreto desde su identidad y documentación oficial.',
    whyNow: 'El calibre real se estudia después de comprender sus subsistemas.',
    outcome: 'Identificar un 8215, localizar una especificación y reconstruir sus capas.',
    anchors: [
      ['lesson.miyota8215.identify', 'activity.miyota8215.identify-calibre', 'Usa identidad y procedencia antes de interpretar piezas.'],
      ['lesson.miyota8215.documentation', 'activity.miyota8215.locate-specification', 'Practica documentación oficial y sus límites.'],
      ['lesson.miyota8215.architecture', 'activity.miyota8215.classify-subsystems', 'Conecta el sistema funcional con la arquitectura real del calibre.'],
    ],
    support: [], optionalActivityIds: ['activity.miyota8215.classify-provenance', 'activity.miyota8215.detect-document-limit'], prerequisiteChapterIds: ['chapter.3.4'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Tres unidades oficiales y estructurales abren la especialización mecánica real.',
  }),
  chapter({
    chapterId: 'chapter.4.2', stageId: 'stage.4', order: 2,
    title: 'Subsistemas del MIYOTA 8215',
    description: 'Recorrer carga, mando, energía, tren, escape y calendario en el calibre real.',
    whyNow: 'La arquitectura general se vuelve concreta subsistema a subsistema.',
    outcome: 'Relacionar cada subsistema del 8215 con su función y dependencia.',
    anchors: [
      ['lesson.miyota8215.automatic', 'activity.miyota8215.follow-automatic', 'Transfiere la carga automática conceptual al 8215.'],
      ['lesson.miyota8215.winding-setting', 'activity.miyota8215.reconstruct-winding-states', 'Reconstruye estados de cuerda y puesta en hora específicos.'],
      ['lesson.miyota8215.barrel-energy', 'activity.miyota8215.follow-barrel-energy', 'Sigue energía desde el barrilete real.'],
      ['lesson.miyota8215.train', 'activity.miyota8215.identify-train', 'Identifica el tren y permite comprobar una interrupción.'],
      ['lesson.miyota8215.escapement-oscillator', 'activity.miyota8215.follow-escapement', 'Transfiere escape y oscilador al modelo estructural del calibre.'],
    ],
    support: [['lesson.miyota8215.calendar', 'support', 'Sexta unidad del bloque, visible como profundización para respetar el límite de cinco anchors.']],
    optionalActivityIds: ['activity.miyota8215.run-calendar-cycle'], prerequisiteChapterIds: ['chapter.4.1'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Agrupa seis unidades existentes sin presentarlas como seis decisiones equivalentes.',
  }),
  chapter({
    chapterId: 'chapter.4.3', stageId: 'stage.4', order: 3,
    title: 'Desmontaje guiado y reducción de ayuda',
    description: 'Planificar y ejecutar virtualmente una secuencia con ayuda decreciente.',
    whyNow: 'La manipulación y la inspección ya se han trabajado antes del desmontaje.',
    outcome: 'Completar un desmontaje virtual independiente y documentar la secuencia.',
    anchors: [
      ['lesson.miyota8215.plan-disassembly', 'activity.miyota8215.create-disassembly-plan', 'Exige plan antes de acción.'],
      ['lesson.miyota8215.guided-disassembly', 'activity.miyota8215.guided-disassembly', 'Presenta la secuencia con apoyo explícito.'],
      ['lesson.miyota8215.assisted-free-disassembly', 'activity.miyota8215.free-disassembly', 'Reduce ayuda y comprueba transferencia virtual; no se etiqueta como P.'],
    ],
    support: [], optionalActivityIds: ['activity.miyota8215.remove-rotor', 'activity.miyota8215.assisted-disassembly'], prerequisiteChapterIds: ['chapter.4.2'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'La secuencia conserva el andamiaje pedagógico real de las actividades.',
  }),
  chapter({
    chapterId: 'chapter.4.4', stageId: 'stage.4', order: 4,
    title: 'Inspección, montaje y verificaciones',
    description: 'Inspeccionar el estado y montar por capas con comprobaciones parciales.',
    whyNow: 'No se monta sin inspeccionar y no se espera al final para verificar.',
    outcome: 'Registrar un hallazgo y completar un montaje virtual con controles intermedios.',
    anchors: [
      ['lesson.miyota8215.inspection', 'activity.miyota8215.inspect-parts', 'Pide inspección y resultado K/V/R sin afirmar observación física.'],
      ['lesson.miyota8215.assembly-verification', 'activity.miyota8215.partial-verifications', 'Integra montaje y verificación parcial como un solo contrato.'],
    ],
    support: [], optionalActivityIds: ['activity.miyota8215.guided-assembly', 'activity.miyota8215.free-assembly'], prerequisiteChapterIds: ['chapter.4.3'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Respeta inspección antes de intervención y verificación por capas.',
  }),
  chapter({
    chapterId: 'chapter.4.5', stageId: 'stage.4', order: 5,
    title: 'Diagnóstico, transferencia y dossier final',
    description: 'Cerrar el caso con hipótesis, comprobación y límites de transferencia.',
    whyNow: 'El diagnóstico final necesita conocer arquitectura, secuencia e inspección del 8215.',
    outcome: 'Completar y defender un diagnóstico virtual del calibre.',
    anchors: [['lesson.miyota8215.diagnosis-project', 'activity.miyota8215.complete-diagnosis', 'Proyecto final con hipótesis, prueba, mastery-check y transferencia explícita.']],
    support: [['lesson.advanced.service-disassembly', 'optional-branch', 'Método avanzado por dependencias, no memoria.']],
    optionalActivityIds: ['activity.miyota8215.final-project'], prerequisiteChapterIds: ['chapter.4.4'], optionalBranchIds: ['branch.quartz-initiation', 'branch.comparative-atlas'], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Una única puerta final evita que las actividades de diagnóstico compitan entre sí.',
  }),

  chapter({
    chapterId: 'chapter.5.1', stageId: 'stage.5', order: 1,
    title: 'Requisitos y elección del movimiento',
    description: 'Definir el reloj y justificar un movimiento adquirido antes de diseñar el exterior.',
    whyNow: 'Construir un reloj completo es un objetivo autónomo después del servicio de un calibre.',
    outcome: 'Redactar un pliego y seleccionar un movimiento con criterios verificables.',
    anchors: [
      ['lesson.capstone.design.requirements', 'activity.capstone.design.requirements', 'Contrato de pliego y arquitectura con resultado revisable.'],
      ['lesson.capstone.design.acquired-movement', 'activity.capstone.design.acquired-movement', 'Se centra explícitamente en integrar un movimiento adquirido.'],
    ],
    support: [], optionalActivityIds: [], prerequisiteChapterIds: ['chapter.4.5'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'El producto comienza por requisitos y selección, no por fabricar componentes.',
  }),
  chapter({
    chapterId: 'chapter.5.2', stageId: 'stage.5', order: 2,
    title: 'Movimiento, caja, aro, tija y cadena axial',
    description: 'Relacionar encaje, mando y dimensiones exteriores sin fingir cobertura del aro o la holgura posterior.',
    whyNow: 'Las interfaces estructurales condicionan esfera, agujas y cierre.',
    outcome: 'Construir una matriz de compatibilidad parcial movimiento-caja-mando.',
    anchors: [
      ['lesson.encyclopedia.cases-water.arquitectura-de-caja', 'activity.encyclopedia.cases-water.arquitectura-de-caja', 'Objetivo explícito de arquitectura y encaje del movimiento.'],
      ['lesson.encyclopedia.cases-water.corona-tubo-y-tija', 'activity.encyclopedia.cases-water.corona-tubo-y-tija', 'Cubre la cadena de mando y sus interfaces.'],
      ['lesson.encyclopedia.cases-water.toh-exterior-interfaces', 'activity.encyclopedia.cases-water.toh-exterior-interfaces', 'Integra el exterior como cadena de interfaces.'],
    ],
    support: [['lesson.capstone.manufacturing.case', 'support', 'Fabricación de caja posterior; no sustituye integración.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.5.1'], optionalBranchIds: [],
    plannedContentRefs: ['stage5-gap.movement-holder', 'stage5-gap.caseback-clearance'],
    coverageStatus: 'complete', curationReason: 'El método de caja, aro, mando y holgura está implementado; los datos del proyecto siguen separados.',
  }),
  chapter({
    chapterId: 'chapter.5.3', stageId: 'stage.5', order: 3,
    title: 'Esfera, pies, agujas y apilamiento',
    description: 'Relacionar esfera y agujas con las interfaces del movimiento.',
    whyNow: 'La cadena axial solo puede cerrarse después de fijar caja y mando.',
    outcome: 'Definir las interfaces conocidas y marcar como desconocidas las cotas todavía ausentes.',
    anchors: [
      ['lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera', 'activity.encyclopedia.dials-hands-finishing.arquitectura-de-esfera', 'Cubre arquitectura, pies, aberturas e interfaces sin inventar medidas.'],
      ['lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'activity.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'Cubre geometría, tubos, ajuste y alturas de agujas.'],
    ],
    support: [['lesson.capstone.manufacturing.hands', 'support', 'Plan de fabricación posterior, no cobertura de integración completa.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.5.2'], optionalBranchIds: [],
    plannedContentRefs: ['stage5-gap.dial-feet', 'stage5-gap.dial-diameter', 'stage5-gap.hand-holes-fit', 'stage5-gap.hour-wheel-stack'],
    coverageStatus: 'complete', curationReason: 'El método de esfera, pies, agujas y stack está implementado sin inventar ajustes o alturas.',
  }),
  chapter({
    chapterId: 'chapter.5.4', stageId: 'stage.5', order: 4,
    title: 'Cristal, fondo, juntas, hermeticidad e interferencias',
    description: 'Cerrar el volumen exterior y revisar rutas de fuga e interferencias.',
    whyNow: 'El cierre solo puede evaluarse cuando la cadena axial ya está definida.',
    outcome: 'Enumerar interfaces de cierre y distinguir verificación disponible de ensayo pendiente.',
    anchors: [
      ['lesson.encyclopedia.cases-water.cristales-y-biseles', 'activity.encyclopedia.cases-water.cristales-y-biseles', 'Cubre cristal, bisel y tensiones con límites explícitos.'],
      ['lesson.encyclopedia.cases-water.toh-materiales-exterior', 'activity.encyclopedia.cases-water.toh-materiales-exterior', 'Integra materiales, juntas y fijaciones exteriores.'],
    ],
    support: [['lesson.encyclopedia.cases-water.pruebas-de-presion', 'support', 'Ensayo especializado posterior con límites de seguridad.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.5.3'], optionalBranchIds: [],
    plannedContentRefs: ['stage5-gap.dynamic-interferences'], coverageStatus: 'complete',
    curationReason: 'Cristal, juntas, rutas de fuga e interferencias tienen método; los ensayos físicos permanecen pendientes.',
  }),
  chapter({
    chapterId: 'chapter.5.5', stageId: 'stage.5', order: 5,
    title: 'Montaje final, compatibilidad, piezas donantes y validación',
    description: 'Consolidar decisiones en un dossier sin afirmar que el montaje físico ya se realizó.',
    whyNow: 'La validación integra todas las interfaces anteriores.',
    outcome: 'Defender un dossier de compatibilidad y registrar límites y pruebas pendientes.',
    anchors: [
      ['lesson.capstone.design.capstone', 'activity.capstone.design.capstone', 'Puerta de prototipo con dossier y revisión, no acreditación de fabricación.'],
      ['lesson.mechanical.final-project', 'activity.mechanical.build-final-project', 'Integra fallos, hipótesis y límites en un proyecto virtual.'],
      ['lesson.capstone.validation.calibre-transfer', 'activity.capstone.validation.calibre-transfer', 'Comprueba transferencia sin generalizar dimensiones entre calibres.'],
    ],
    support: [['lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto', 'support', 'Introduce donantes y repuestos como contexto, no como montaje completo.']],
    optionalActivityIds: ['activity.mechanical.document-limitations'], prerequisiteChapterIds: ['chapter.5.4'], optionalBranchIds: ['branch.historical-cases'],
    plannedContentRefs: ['stage5-gap.final-assembly-verification'], coverageStatus: 'complete',
    curationReason: 'El dossier, el plan reversible y los checkpoints cierran el método sin afirmar montaje físico.',
  }),

  chapter({
    chapterId: 'chapter.6.1', stageId: 'stage.6', order: 1,
    title: 'Micromecánica, herramientas y preparación',
    description: 'Preparar referencias, sujeción y procesos antes de fabricar.',
    whyNow: 'Fabricar componentes viene después de integrar componentes existentes.',
    outcome: 'Definir datum, sujeción, secuencia e inspección de una pieza.',
    anchors: [
      ['lesson.encyclopedia.micromechanics.trazado-medicion-y-sujecion', 'activity.encyclopedia.micromechanics.trazado-medicion-y-sujecion', 'Objetivo de trazado, referencia y sujeción con nivel specialist-workshop explícito.'],
      ['lesson.encyclopedia.micromechanics.torno-y-trabajo-entre-puntos', 'activity.encyclopedia.micromechanics.torno-y-trabajo-entre-puntos', 'Introduce el torno como operación real de taller especializado, sin fingir ejecución.'],
    ],
    support: [['lesson.encyclopedia.workshop-tools-materials.herramientas-y-afilado', 'support', 'Consulta de herramientas y afilado antes de operaciones concretas.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.5.5'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'Dos anchors separan planificación digital de ejecución especialista y conservan riesgos como restricciones.', physical: true,
  }),
  chapter({
    chapterId: 'chapter.6.2', stageId: 'stage.6', order: 2,
    title: 'Ejes, pivotes, tijas, rubíes y cojinetes',
    description: 'Planificar geometría, procesos y aceptación de componentes pequeños.',
    whyNow: 'Estas piezas exigen control previo de torno, referencias e inspección.',
    outcome: 'Proponer un proceso y criterio de aceptación sin declarar la pieza fabricada.',
    anchors: [
      ['lesson.encyclopedia.micromechanics.ejes-pivotes-y-reparacion', 'activity.encyclopedia.micromechanics.ejes-pivotes-y-reparacion', 'Operaciones reales y nivel especialista revisados; la actividad sigue siendo K/V.'],
      ['lesson.encyclopedia.micromechanics.tornillos-muelles-y-pequenas-piezas', 'activity.encyclopedia.micromechanics.tornillos-muelles-y-pequenas-piezas', 'Amplía procesos de piezas pequeñas con riesgos y aceptación.'],
      ['lesson.encyclopedia.micromechanics.platinas-puentes-y-jewelling', 'activity.encyclopedia.micromechanics.platinas-puentes-y-jewelling', 'Cubre taladro, escariado y rubíes como planificación especialista.'],
    ],
    support: [['lesson.encyclopedia.micromechanics.bulova-tija', 'optional-branch', 'Pasaporte histórico de tija; competencia P queda pendiente.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.6.1'], optionalBranchIds: ['branch.bench-passports'], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'La progresión de taller es válida, pero ninguna simulación acredita fabricación física.', physical: true,
  }),
  chapter({
    chapterId: 'chapter.6.3', stageId: 'stage.6', order: 3,
    title: 'Ruedas, piñones, platinas y puentes',
    description: 'Relacionar geometría funcional, proceso e inspección de componentes estructurales.',
    whyNow: 'Se abordan conjuntos mayores después de adquirir referencias y control de piezas pequeñas.',
    outcome: 'Defender un plan de fabricación y medición para rueda o puente.',
    anchors: [
      ['lesson.encyclopedia.micromechanics.ruedas-y-pinones', 'activity.encyclopedia.micromechanics.ruedas-y-pinones', 'Contrato de fabricación K/V/R y taller especialista revisado.'],
      ['lesson.capstone.manufacturing.plates-bridges', 'activity.capstone.manufacturing.plates-bridges', 'Integra apoyos, rubíes y criterios de aceptación.'],
      ['lesson.capstone.manufacturing.micromechanics', 'activity.capstone.manufacturing.micromechanics', 'Planifica ejes, piñones, tornillos y muelles bajo un contrato común.'],
    ],
    support: [], optionalActivityIds: [], prerequisiteChapterIds: ['chapter.6.2'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'Los anchors tienen contratos de fabricación, nivel de ejecución y resultados revisables.', physical: true,
  }),
  chapter({
    chapterId: 'chapter.6.4', stageId: 'stage.6', order: 4,
    title: 'Repuestos, piezas donantes, cajas, esferas y acabados',
    description: 'Decidir entre conservar, adaptar, sustituir o fabricar y documentar el acabado.',
    whyNow: 'La decisión de intervención necesita dominio previo de interfaces y procesos.',
    outcome: 'Defender una estrategia de repuesto y un plan de acabado seguro.',
    anchors: [
      ['lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto', 'activity.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto', 'Distingue donante, restauración y fabricación sin generalizar un caso.'],
      ['lesson.capstone.manufacturing.case', 'activity.capstone.manufacturing.case', 'Contrato de fabricación de caja con revisión K/V/R.'],
      ['lesson.capstone.manufacturing.dial', 'activity.capstone.manufacturing.dial', 'Contrato de esfera y superficies gráficas.'],
      ['lesson.capstone.manufacturing.hands', 'activity.capstone.manufacturing.hands', 'Contrato de agujas, cañones y holguras.'],
      ['lesson.capstone.manufacturing.decoration', 'activity.capstone.manufacturing.decoration', 'Acabado ligado a función y seguridad, no decoración aislada.'],
    ],
    support: [['lesson.encyclopedia.dials-hands-finishing.pulido-satinado-y-cepillado', 'support', 'Profundización de acabados con riesgos y geometría.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.6.3'], optionalBranchIds: ['branch.historical-cases'], plannedContentRefs: [],
    coverageStatus: 'source-review-required', curationReason: 'Cierra adaptación y fabricación con contratos explícitos y revisión de seguridad.', physical: true,
  }),

  chapter({
    chapterId: 'chapter.7.1', stageId: 'stage.7', order: 1,
    title: 'Requisitos y arquitectura de un movimiento propio',
    description: 'Pasar del movimiento adquirido a una arquitectura propia justificable.',
    whyNow: 'Diseñar un movimiento propio es una etapa avanzada posterior a integración y fabricación.',
    outcome: 'Definir requisitos, subsistemas, interfaces y decisiones de arquitectura.',
    anchors: [
      ['lesson.capstone.design.own-movement', 'activity.capstone.design.own-movement', 'Objetivo explícito de arquitectura propia con evidencia K/R.'],
      ['lesson.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio', 'activity.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio', 'Puente conceptual entre integración y movimiento propio.'],
      ['lesson.advanced.architecture-capstone', 'activity.advanced.architecture-capstone', 'Exige defender una arquitectura completa y sus compromisos.'],
    ],
    support: [], optionalActivityIds: [], prerequisiteChapterIds: ['chapter.6.4'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Tres anchors forman una puerta de diseño sin requerir crear geometría ausente.',
  }),
  chapter({
    chapterId: 'chapter.7.2', stageId: 'stage.7', order: 2,
    title: 'Diseño, tolerancias, fabricación y planificación del prototipo',
    description: 'Relacionar tolerancias, datums, riesgos y verificaciones antes del prototipo.',
    whyNow: 'Una arquitectura necesita presupuestos verificables antes de fabricar.',
    outcome: 'Construir un plan de prototipo con tolerancias, aceptación y riesgos.',
    anchors: [
      ['lesson.encyclopedia.math-physics-metrology.tolerancias-y-fiabilidad', 'activity.encyclopedia.math-physics-metrology.tolerancias-y-fiabilidad', 'Aplica tolerancia, capacidad y FMEA a una necesidad de diseño real.'],
      ['lesson.capstone.manufacturing.dfm-datums', 'activity.capstone.manufacturing.dfm-datums', 'Contrato DFM con datums y verificación; se reutiliza como conocimiento transversal, pero su anchor canónico permanece aquí.'],
    ],
    support: [['lesson.advanced.ultra-thin', 'optional-branch', 'Caso avanzado de presupuesto axial.']],
    optionalActivityIds: [], prerequisiteChapterIds: ['chapter.7.1'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'Las matemáticas reaparecen cuando resuelven decisiones de tolerancia y fabricación.',
  }),
  chapter({
    chapterId: 'chapter.7.3', stageId: 'stage.7', order: 3,
    title: 'Ensayo, iteración, dossier y validación independiente',
    description: 'Cerrar el ciclo con pruebas, hallazgos, iteración y revisión humana.',
    whyNow: 'El diseño no termina hasta contrastar resultados con criterios independientes.',
    outcome: 'Defender un dossier de validación y registrar decisiones de iteración.',
    anchors: [
      ['lesson.metrology.final-project', 'activity.metrology.defender-el-proyecto-final', 'El dossier y su defensa usan K/V/R y no confunden revisión con ejecución física.'],
      ['lesson.capstone.validation.watchmaker-review', 'activity.capstone.validation.watchmaker-review', 'Revisión relojera independiente como cierre explícito del recorrido.'],
    ],
    support: [['lesson.capstone.design.capstone', 'reference', 'Dossier de integración consultable como antecedente, sin duplicarlo en el denominador.']],
    optionalActivityIds: ['activity.metrology.completar-dossier'], prerequisiteChapterIds: ['chapter.7.2'], optionalBranchIds: [], plannedContentRefs: [],
    coverageStatus: 'complete', curationReason: 'La validación exige resultado revisado y decisión humana sin afirmar prototipo físico fabricado.',
  }),
]

const stages: AcademyLearnerStage[] = [
  ['stage.0', 0, 'Preparar el banco y adquirir control', 'Preparar', 'Trabajar con orden y límites claros.', 'Preparar el entorno y distinguir práctica virtual de destreza física.', 'La manipulación básica precede a cualquier desmontaje.', 'complete', ['branch.quartz-initiation']],
  ['stage.1', 1, 'Entender el reloj como sistema', 'Entender el sistema', 'Ver funciones antes que listas de piezas.', 'Explicar la cadena funcional de un reloj y leer su documentación.', 'La visión general precede al detalle.', 'complete', ['branch.history-context', 'branch.quartz-theory']],
  ['stage.2', 2, 'Comprender los sistemas mecánicos', 'Sistemas mecánicos', 'Seguir energía, transmisión, escape, regulación e indicación.', 'Explicar los subsistemas mecánicos y sus dependencias.', 'Las matemáticas aparecen cuando resuelven una necesidad.', 'complete', ['branch.complications']],
  ['stage.3', 3, 'Observar, medir y diagnosticar', 'Medir y diagnosticar', 'Pasar de observación a hipótesis comprobable.', 'Inspeccionar, medir y defender un diagnóstico causal.', 'La inspección precede a la intervención.', 'complete', ['branch.historical-cases', 'branch.advanced-service']],
  ['stage.4', 4, 'Trabajar sobre un calibre real', 'MIYOTA 8215', 'Transferir los fundamentos a un MIYOTA 8215 documentado.', 'Completar estudio, desmontaje, montaje y diagnóstico virtual del 8215.', 'Un calibre real se estudia después de entender sus subsistemas.', 'complete', ['branch.quartz-initiation', 'branch.comparative-atlas']],
  ['stage.5', 5, 'Construir un reloj completo', 'Construir un reloj', 'Integrar un reloj alrededor de un movimiento adquirido.', 'Defender un dossier de compatibilidad con datos, unknowns y validación física separados.', 'Construir un reloj completo es un objetivo autónomo.', 'complete', ['branch.historical-cases']],
  ['stage.6', 6, 'Reparar, adaptar y fabricar componentes', 'Fabricar y adaptar', 'Planificar intervenciones y fabricación sin fingir ejecución física.', 'Defender procesos, riesgos, inspección y aceptación de componentes.', 'Fabricar componentes viene después de integrar componentes existentes.', 'source-review-required', ['branch.bench-passports', 'branch.historical-cases']],
  ['stage.7', 7, 'Diseñar y validar un reloj o movimiento propio', 'Diseñar y validar', 'Convertir requisitos en arquitectura, prototipo y validación.', 'Defender una arquitectura propia y su dossier de validación independiente.', 'Diseñar un movimiento propio es una etapa avanzada.', 'complete', []],
].map(([stageId, order, title, shortTitle, promise, outcome, rationale, coverageStatus, optionalBranchIds], index) => ({
  stageId: stageId as string,
  order: order as number,
  title: title as string,
  shortTitle: shortTitle as string,
  promise: promise as string,
  outcome: outcome as string,
  rationale: rationale as string,
  chapterIds: chapters.filter((item) => item.stageId === stageId).map(({ chapterId }) => chapterId),
  prerequisiteStageIds: index === 0 ? [] : [`stage.${index - 1}`],
  coverageStatus: coverageStatus as AcademyCoverageStatus,
  optionalBranchIds: optionalBranchIds as string[],
  completionPolicy: COMPLETION_POLICY,
}))

const optionalBranches: AcademyOptionalBranch[] = [
  { branchId: 'branch.quartz-initiation', stageId: 'stage.0', title: 'Iniciación en cuarzo MIYOTA 2035', description: 'Especialización práctica no bloqueante.', routeIds: ['route.quartz2035.isa-to-2035'], blocking: false },
  { branchId: 'branch.history-context', stageId: 'stage.1', title: 'Historia y lenguaje relojero', description: 'Contexto cultural e histórico.', routeIds: ['route.encyclopedia.history-language'], blocking: false },
  { branchId: 'branch.quartz-theory', stageId: 'stage.1', title: 'Teoría del cuarzo', description: 'Arquitectura electrónica como comparación.', routeIds: ['route.encyclopedia.quartz-electronics'], blocking: false },
  { branchId: 'branch.complications', stageId: 'stage.2', title: 'Complicaciones', description: 'Ampliaciones mecánicas posteriores a los fundamentos.', routeIds: ['route.encyclopedia.complications', 'route.advanced.architectures-complications'], blocking: false },
  { branchId: 'branch.historical-cases', stageId: 'stage.3', title: 'Casos históricos y restauración', description: 'Casos para transferencia y contexto, no instrucciones modernas automáticas.', routeIds: ['route.encyclopedia.atlas-restoration-design'], blocking: false },
  { branchId: 'branch.advanced-service', stageId: 'stage.3', title: 'Método de servicio avanzado', description: 'Métodos documentales y procedimientos avanzados.', routeIds: ['route.advanced.service-method'], blocking: false },
  { branchId: 'branch.comparative-atlas', stageId: 'stage.4', title: 'Atlas comparativo', description: 'Comparación entre familias y calibres.', routeIds: ['route.advanced.comparative-atlas'], blocking: false },
  { branchId: 'branch.bench-passports', stageId: 'stage.6', title: 'Pasaportes de banco', description: 'Progresión psicomotriz histórica con evidencia P separada.', routeIds: ['route.encyclopedia.workshop-tools-materials'], blocking: false },
]

export const ACADEMY_LEARNER_PATH: AcademyLearnerPathDefinition = {
  pathId: 'academy.path.watchmaker-main',
  version: '0.14B.0',
  title: 'De cero a un reloj o movimiento propio',
  description: 'Una ruta principal curada que conserva el catálogo completo como biblioteca secundaria.',
  learnerGoal: 'Comprender un reloj desde cero, trabajar sobre un movimiento mecánico real, construir un reloj completo alrededor de un movimiento adquirido, aprender a adaptar o fabricar componentes y avanzar hacia el diseño y validación de un movimiento propio.',
  stageIds: stages.map(({ stageId }) => stageId),
  defaultLocale: 'es-ES',
  sourceAuditPhase: '0.14A.1',
  curationStatus: 'manually-curated',
  stages,
  chapters,
  optionalBranches,
}

export type AcademyLearnerChapterLegacy014B = Omit<
  AcademyLearnerChapter,
  'steps' | 'masteryCoveragePolicy' | 'masteryCoverageCompetencyIds' | 'masteryCapstoneStepId'
>

export interface AcademyLearnerPathLegacy014B extends Omit<AcademyLearnerPathDefinition, 'chapters'> {
  chapters: AcademyLearnerChapterLegacy014B[]
}

const ACADEMY_STAGE_5_CHAPTER_OVERRIDES_014B: Record<string, Partial<AcademyLearnerChapter>> = {
  'chapter.5.2': { coverageStatus: 'partial', curationReason: 'Hay base real para caja y mando, pero faltan aro y holgura posterior verificables.' },
  'chapter.5.3': { coverageStatus: 'partial', curationReason: 'Las interfaces existen, pero cuatro datos de compatibilidad siguen sin cobertura completa.' },
  'chapter.5.4': { coverageStatus: 'partial', curationReason: 'Cristal y juntas están cubiertos; fondo, holgura e interferencias requieren blueprint y documentación oficial.' },
  'chapter.5.5': { coverageStatus: 'partial', curationReason: 'El contenido existente permite dossier parcial, pero no cubre orden final ni verificación integral.' },
}

/** Vista de runtime congelada para reproducir auditorías B/B.1 después del cierre metodológico K. */
export function academyLearnerPathRuntimeLegacy014B(
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyLearnerPathDefinition {
  return {
    ...path,
    stages: path.stages.map((stage) => stage.stageId === 'stage.5' ? {
      ...stage,
      outcome: 'Defender un dossier de compatibilidad con cobertura y vacíos explícitos.',
      coverageStatus: 'partial',
    } : stage),
    chapters: path.chapters.map((chapter) => ({ ...chapter, ...ACADEMY_STAGE_5_CHAPTER_OVERRIDES_014B[chapter.chapterId] })),
  }
}

/** Reproduce la forma pública histórica 0.14B sin ocultar propiedades de runtime. */
export function serializeAcademyLearnerPathLegacy014B(
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): AcademyLearnerPathLegacy014B {
  const historicalPath = academyLearnerPathRuntimeLegacy014B(path)
  return {
    ...historicalPath,
    chapters: historicalPath.chapters.map((chapterItem) => {
      const legacyChapter = { ...chapterItem } as Record<string, unknown>
      delete legacyChapter.steps
      delete legacyChapter.masteryCoveragePolicy
      delete legacyChapter.masteryCoverageCompetencyIds
      delete legacyChapter.masteryCapstoneStepId
      return legacyChapter as unknown as AcademyLearnerChapterLegacy014B
    }),
  }
}

export function academyPathChapter(chapterId: string): AcademyLearnerChapter | undefined {
  return ACADEMY_LEARNER_PATH.chapters.find((chapterItem) => chapterItem.chapterId === chapterId)
}

export function academyPathStage(stageId: string): AcademyLearnerStage | undefined {
  return ACADEMY_LEARNER_PATH.stages.find((stageItem) => stageItem.stageId === stageId)
}

export function academyPathLocationForLesson(lessonId: string): {
  stage: AcademyLearnerStage
  chapter: AcademyLearnerChapter
  role: AcademyPathNodeRole
} | undefined {
  const chapterItem = ACADEMY_LEARNER_PATH.chapters.find((candidate) =>
    candidate.anchorLessonIds.includes(lessonId) || candidate.supportingLessonIds.includes(lessonId))
  if (!chapterItem) return undefined
  const stageItem = academyPathStage(chapterItem.stageId)
  if (!stageItem) return undefined
  const support = chapterItem.supportingLessons.find((candidate) => candidate.lessonId === lessonId)
  return { stage: stageItem, chapter: chapterItem, role: support?.role ?? 'anchor' }
}

export function academyPathLocationForStepLesson(
  lessonId: string,
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): { stage: AcademyLearnerStage; chapter: AcademyLearnerChapter; step: AcademyLearnerStep } | undefined {
  for (const chapterItem of path.chapters) {
    const step = chapterItem.steps.find((item) => item.lessonId === lessonId)
    const stage = path.stages.find(({ stageId }) => stageId === chapterItem.stageId)
    if (step && stage) return { stage, chapter: chapterItem, step }
  }
  return undefined
}

export function academyPathLocationForActivity(
  activityId: string,
  path: AcademyLearnerPathDefinition = ACADEMY_LEARNER_PATH,
): { stage: AcademyLearnerStage; chapter: AcademyLearnerChapter; step: AcademyLearnerStep } | undefined {
  for (const chapterItem of path.chapters) {
    const step = chapterItem.steps.find((item) =>
      item.requiredActivityIds.includes(activityId) || item.optionalActivityIds.includes(activityId))
    const stage = path.stages.find(({ stageId }) => stageId === chapterItem.stageId)
    if (step && stage) return { stage, chapter: chapterItem, step }
  }
  return undefined
}

export const ACADEMY_CURATION_RECORDS: readonly AcademyCurationRecord[] = chapters
  .flatMap(({ steps }) => steps.map((step): AcademyCurationRecord => ({
    entityId: step.stepId,
    contentHash: 'not-recorded',
    reviewedFields: ['selection', 'order', 'lesson-activity-relationship'],
    reviewMethod: 'declared-curation',
    reviewedAt: null,
    reviewerKind: 'editorial-system',
    notes: step.curationReason,
    sourceVersion: '0.14B.1',
    confidence: 'high',
  })))
