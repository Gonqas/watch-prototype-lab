import { createHash } from 'node:crypto'
import { ACADEMY_CURRICULUM } from '../../src/learning/academy/academyCurriculum'
import {
  AuditIssueSchema,
  ClaimAuditSchema,
  EvidenceProfileSchema,
  LessonOperationalRiskSchema,
  type AuditConfidence,
  type AuditIssue,
  type ClaimAudit,
  type DetectionMethod,
  type EvidenceLevel,
  type EvidenceProfile,
  type ExecutionTier,
  type HistoricalStatus,
  type LearningArchetype,
  type LessonOperationalRisk,
  type MacroStage,
  type PrerequisiteClassification,
  type RecommendedAction,
  type ReviewStatus,
  type SafetyStatus,
  type SourceRecord,
  type TrackRole,
} from '../../src/learning/governance/editorialGovernance'
import { analyzeMatrices, DETECTORS, type ActivityMatrixRow, type LessonMatrixRow } from './matrices'
import type { AcademyCorpus, CorpusActivityContext, CorpusLessonContext } from './corpus'
import { semanticActivityGoldById, semanticLessonGoldById } from './semanticGoldSet'

export interface ArchetypeClassification {
  value: LearningArchetype
  classificationMethod: DetectionMethod
  classificationConfidence: AuditConfidence
  evidenceUsed: string[]
  overrideApplied: boolean
  alternativeCandidates: LearningArchetype[]
}

export interface ConceptOrigin {
  conceptId: string
  routeId: string | null
  moduleId: string | null
  lessonId: string | null
  globalOrder: number | null
  conceptualRole: 'introduced' | 'reinforced' | 'bridge' | 'declared' | 'catalog-only' | 'unknown'
}

export interface PrerequisiteAuditRecord {
  conceptId: string
  required: boolean
  origin: ConceptOrigin
  classification: PrerequisiteClassification
  method: DetectionMethod
  confidence: AuditConfidence
  proposal: 'keep-required' | 'move-to-recommended' | 'remove-or-replace' | 'manual-review'
  reason: string
}

export interface SourceRoleAudit {
  explicitPrimarySourceId: string | null
  derivedPrimarySourceId: string | null
  supportingSourceIds: string[]
  contextSourceIds: string[]
  visualInspirationSourceIds: string[]
  safetySourceIds: string[]
  identificationDatabaseSourceIds: string[]
  classificationMethod: DetectionMethod
  confidence: AuditConfidence
}

export interface SemanticPriority {
  score: number
  level: 'critical' | 'high' | 'medium' | 'low' | 'no-action' | 'manual-triage'
  confidence: AuditConfidence
  confirmedIssuePoints: number
  heuristicIssuePoints: number
  globalIssuesExcluded: string[]
  rootCauses: string[]
  rationale: string[]
  recommendedNextAction: RecommendedAction
  estimatedCorrectionCost: 'small' | 'medium' | 'large' | 'unknown'
}

export interface SemanticLessonRow extends LessonMatrixRow {
  macroStage: MacroStage
  trackRole: TrackRole
  localeStatus: 'complete' | 'placeholder-duplicated' | 'partial' | 'unknown'
  supportedLocaleActual: 'es' | 'es+en' | 'unknown'
  localeRecommendation: 'none' | 'hide-or-disable-en-until-real-translation'
  archetypeClassification: ArchetypeClassification
  evidenceProfile: EvidenceProfile
  sourceRoles: SourceRoleAudit
  claimAudits: ClaimAudit[]
  prerequisiteAudit: PrerequisiteAuditRecord[]
  operationalRisk: LessonOperationalRisk
  sourceHistoricalRiskIds: string[]
  issueIds: string[]
  globalIssueIds: string[]
  rootCauseIds: string[]
  semanticPriority: SemanticPriority
}

export interface SemanticActivityRow extends ActivityMatrixRow {
  macroStage: MacroStage
  trackRole: TrackRole
  archetype: LearningArchetype
  evidenceProfile: EvidenceProfile
  physicalCompetenceClaim: boolean
  physicalExecutionDeclared: boolean
  operationalRisk: SafetyStatus
  issueIds: string[]
  rootCauseIds: string[]
}

export interface GlobalMigration {
  migrationId: string
  category: string
  affectedEntities: number
  prevalence: number
  localeStatus?: 'placeholder-duplicated'
  supportedLocaleActual?: 'es'
  recommendation: string
  excludedFromIndividualPriority: true
  detectionMethod: DetectionMethod
  confidence: AuditConfidence
  evidence: string[]
}

export interface DetectorSummary {
  detectorId: number
  category: string
  title: string
  countBefore: number
  countAfter: number
  globalAffectedEntities: number
  confirmed: number
  likely: number
  lowConfidence: number
  derived: number
  variationReason: string
}

export interface GoldEvaluation {
  lessonFixtures: number
  activityFixtures: number
  assertions: number
  passed: number
  failed: number
  failures: Array<{ fixtureId: string; field: string; expected: unknown; actual: unknown }>
}

export interface SemanticAnalysis {
  lessons: SemanticLessonRow[]
  activities: SemanticActivityRow[]
  issues: AuditIssue[]
  globalMigrations: GlobalMigration[]
  detectorSummary: DetectorSummary[]
  claims: ClaimAudit[]
  conceptOrigins: ConceptOrigin[]
  goldEvaluation: GoldEvaluation
  falsePositivesEliminated: number
  falseNegativesDiscovered: number
}

const routePolicy = new Map(ACADEMY_CURRICULUM.map((entry) => [entry.routeId, entry]))
const semanticVisualRequirements: Record<LearningArchetype, string[]> = {
  'system-overview': ['functional-system-map'],
  'mechanism-explanation': ['state-or-causal-diagram'],
  'visual-anatomy': ['annotated-anatomy'],
  'bench-procedure': ['procedure-state-sequence'],
  'psychomotor-skill': ['multi-angle-physical-demonstration'],
  inspection: ['defect-comparison-or-inspection-map'],
  'diagnosis-case': ['diagnostic-tree-or-evidence-comparison'],
  measurement: ['instrument-view-and-reading-example'],
  calculation: ['worked-diagram-or-plot'],
  manufacturing: ['operation-plan-and-inspection-state'],
  design: ['interface-or-dependency-drawing'],
  'historical-comparison': ['dated-comparison'],
  'calibre-service': ['calibre-specific-exploded-view-or-state-sequence'],
  'capstone-project': ['project-evidence-map'],
}
const sourceById = (records: SourceRecord[]) => new Map(records.map((record) => [record.sourceId, record]))
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim()
const unique = <T>(values: T[]): T[] => [...new Set(values)]
const issueId = (issue: AuditIssue): string => `issue.${issue.detectorId}.${issue.category}.${issue.entityId}`

function lessonBlocks(context: CorpusLessonContext) {
  return context.lesson.blockIds.map((id) => context.pack.blocks.find((block) => block.id === id)).filter((block) => block !== undefined)
}

function lessonSourceIds(context: CorpusLessonContext): string[] {
  return unique([
    ...(context.lesson.authoring?.sourceIds ?? []),
    ...lessonBlocks(context).flatMap(({ claims }) => claims.flatMap(({ sources }) => sources.map(({ id }) => id))),
  ])
}

function addIssue(
  issues: AuditIssue[],
  values: {
    detectorId: number
    category: string
    severity: AuditIssue['severity']
    entityType: AuditIssue['entityType']
    entityId: string
    message: string
    evidence: string[]
    detectionMethod: DetectionMethod
    confidence: AuditConfidence
    scope: AuditIssue['scope']
    rootCauseId?: string | null
    derivedFromIssueIds?: string[]
    reviewStatus: ReviewStatus
    actionable: boolean
  },
): AuditIssue {
  const issue = AuditIssueSchema.parse({ ...values, rootCauseId: values.rootCauseId ?? null, derivedFromIssueIds: values.derivedFromIssueIds ?? [], manualReviewRequired: true })
  issues.push(issue)
  return issue
}

function classificationInput(context: CorpusLessonContext): string {
  return [
    context.lesson.authoring?.title.es ?? context.lesson.title,
    context.lesson.authoring?.purpose.es ?? '',
    ...(context.lesson.authoring?.objectives.map(({ es }) => es) ?? []),
    context.module.title.es,
  ].join('\n')
}

function candidateArchetypes(text: string): LearningArchetype[] {
  const value = normalize(text)
  const candidates: LearningArchetype[] = []
  if (/inspeccion|observar antes|hallazgo/.test(value)) candidates.push('inspection')
  if (/diagnost|hipotesis|sintoma|fallo/.test(value)) candidates.push('diagnosis-case')
  if (/medir|medicion|metrolog|incertidumbre|calibracion/.test(value)) candidates.push('measurement')
  if (/\b(?:calcular|calculo|ecuacion|factorizacion|analisis dimensional)\b/.test(value)) candidates.push('calculation')
  if (/histori|evolucion|transicion|caso oficial|expediente/.test(value)) candidates.push('historical-comparison')
  if (/anatomia|identificar|reconocer componentes|despiece/.test(value)) candidates.push('visual-anatomy')
  if (/disenar|arquitectura de producto|pliego|dossier/.test(value)) candidates.push('design')
  if (/servicio|desmont|montaje|lubric/.test(value)) candidates.push('calibre-service')
  if (/sistema|cadena completa|vista general|arquitectura general/.test(value)) candidates.push('system-overview')
  if (/mecanismo|funcion|como transforma|energia|escape|oscilador|engran/.test(value)) candidates.push('mechanism-explanation')
  return unique(candidates)
}

export function classifyArchetype(context: CorpusLessonContext): ArchetypeClassification {
  const gold = semanticLessonGoldById.get(context.lesson.id)
  if (gold) return {
    value: gold.archetypeExpected,
    classificationMethod: 'curated-override',
    classificationConfidence: gold.confidence,
    evidenceUsed: [`gold-set:${context.lesson.id}`, ...gold.reasons],
    overrideApplied: true,
    alternativeCandidates: [],
  }

  const activities = context.lesson.activityIds.map((id) => context.pack.activities.find((activity) => activity.id === id)).filter((activity) => activity !== undefined)
  if (activities.some(({ authoring }) => authoring?.manufacturingContract)) return {
    value: 'manufacturing', classificationMethod: 'explicit-metadata', classificationConfidence: 'high', evidenceUsed: ['activity.authoring.manufacturingContract'], overrideApplied: false, alternativeCandidates: [],
  }
  if (activities.some(({ authoring }) => authoring?.personalWatchDesignContract)) return {
    value: 'design', classificationMethod: 'explicit-metadata', classificationConfidence: 'high', evidenceUsed: ['activity.authoring.personalWatchDesignContract'], overrideApplied: false, alternativeCandidates: ['capstone-project'],
  }
  if (activities.some(({ authoring }) => authoring?.validationContract)) return {
    value: 'capstone-project', classificationMethod: 'explicit-metadata', classificationConfidence: 'high', evidenceUsed: ['activity.authoring.validationContract'], overrideApplied: false, alternativeCandidates: ['design'],
  }
  if (activities.some(({ authoring }) => authoring?.serviceProcedureContract)) {
    const text = classificationInput(context)
    const value: LearningArchetype = /inspecci[oó]n/i.test(text) ? 'inspection' : /diagn[oó]st/i.test(text) ? 'diagnosis-case' : 'bench-procedure'
    return { value, classificationMethod: 'explicit-metadata', classificationConfidence: 'high', evidenceUsed: ['activity.authoring.serviceProcedureContract'], overrideApplied: false, alternativeCandidates: ['calibre-service'] }
  }

  const routeId = context.route.id
  const title = normalize(context.lesson.authoring?.title.es ?? context.lesson.title)
  const semantic = (value: LearningArchetype, evidence: string, alternatives: LearningArchetype[] = []): ArchetypeClassification => ({
    value, classificationMethod: 'semantic-rule', classificationConfidence: 'medium', evidenceUsed: [evidence, `title=${context.lesson.authoring?.title.es ?? context.lesson.title}`], overrideApplied: false, alternativeCandidates: alternatives,
  })
  if (routeId.includes('history-language')) return semantic(/documentacion|especificaciones|manuales/.test(title) ? 'inspection' : 'historical-comparison', `route=${routeId}`)
  if (routeId.includes('workshop-tools-materials')) {
    if (/pasaporte|destreza|repeticion/.test(title)) return semantic('psychomotor-skill', `route=${routeId}`, ['bench-procedure'])
    if (/tratamiento|acabado/.test(title)) return semantic('manufacturing', `route=${routeId}`, ['bench-procedure'])
    if (/banco|seguridad|limpieza/.test(title)) return semantic('bench-procedure', `route=${routeId}`)
    return semantic('visual-anatomy', `route=${routeId}`, ['bench-procedure'])
  }
  if (routeId === 'route.mechanical.foundations') return semantic(/proyecto final/.test(title) ? 'capstone-project' : 'mechanism-explanation', `route=${routeId}`)
  if (routeId.includes('math-physics-metrology')) return semantic(/medicion|incertidumbre|trazabilidad|tolerancias|fiabilidad|cronometria/.test(title) ? 'measurement' : 'calculation', `route=${routeId}`)
  if (routeId.includes('physical-digital-bridge')) return semantic(/inspeccionar|observar/.test(title) ? 'inspection' : /proyecto|mejorar.*modelo/.test(title) ? 'capstone-project' : 'measurement', `route=${routeId}`)
  if (routeId.includes('quartz-electronics')) return semantic(/diagnostico/.test(title) ? 'diagnosis-case' : /cadena completa/.test(title) ? 'system-overview' : 'mechanism-explanation', `route=${routeId}`)
  if (routeId.includes('mechanical-energy-trains')) return semantic('mechanism-explanation', `route=${routeId}`, ['system-overview'])
  if (routeId.includes('escapements-chronometry')) return semantic(/pasaporte/.test(title) ? 'psychomotor-skill' : /cronocomparador|prueba/.test(title) ? 'measurement' : 'mechanism-explanation', `route=${routeId}`)
  if (routeId.includes('service-tribology')) return semantic(/diagnostico/.test(title) ? 'diagnosis-case' : /inspeccion|recepcion|linea base/.test(title) ? 'inspection' : 'bench-procedure', `route=${routeId}`)
  if (routeId.includes('complications')) return semantic(/calendario|cronografo|soneria|repeticion/.test(title) ? 'visual-anatomy' : 'mechanism-explanation', `route=${routeId}`)
  if (routeId.includes('cases-water')) return semantic(/prueba|presion|fuga|hermetic/.test(title) ? 'measurement' : 'design', `route=${routeId}`)
  if (routeId.includes('micromechanics')) return semantic(/pasaporte/.test(title) ? 'psychomotor-skill' : /expediente chicago/.test(title) ? 'historical-comparison' : 'manufacturing', `route=${routeId}`)
  if (routeId.includes('dials-hands-finishing')) return semantic(/arquitectura|agujas/.test(title) ? 'design' : 'manufacturing', `route=${routeId}`)
  if (routeId.includes('atlas-restoration-design')) return semantic(/caso oficial|vintage|familias|transferencia/.test(title) ? 'historical-comparison' : /restauracion|donantes|repuesto/.test(title) ? 'diagnosis-case' : 'design', `route=${routeId}`)
  if (routeId.includes('comparative-atlas')) return semantic('visual-anatomy', `route=${routeId}`, ['mechanism-explanation'])
  if (routeId.includes('advanced.service-method')) return semantic(/diagnostico/.test(title) ? 'diagnosis-case' : /estado inicial/.test(title) ? 'inspection' : 'bench-procedure', `route=${routeId}`)
  if (routeId.includes('advanced.architectures-complications')) return semantic(/proyecto/.test(title) ? 'capstone-project' : 'visual-anatomy', `route=${routeId}`, ['mechanism-explanation'])
  if (routeId.includes('quartz2035')) return semantic(/diagnostico/.test(title) ? 'diagnosis-case' : /anatomia|documentacion|recuerdo/.test(title) ? 'visual-anatomy' : 'calibre-service', `route=${routeId}`)
  if (routeId.includes('miyota8215')) return semantic(/diagnostico/.test(title) ? 'diagnosis-case' : /inspeccion/.test(title) ? 'inspection' : /arquitectura|identificar|documentacion/.test(title) ? 'visual-anatomy' : 'calibre-service', `route=${routeId}`)

  const explicitRole = context.lesson.authoring?.pedagogy?.role
  const text = classificationInput(context)
  const candidates = candidateArchetypes(text)
  if (explicitRole === 'orientation') return { value: 'system-overview', classificationMethod: 'explicit-metadata', classificationConfidence: 'high', evidenceUsed: [`pedagogy.role=${explicitRole}`], overrideApplied: false, alternativeCandidates: candidates }
  if (explicitRole === 'worked-example' && candidates.includes('diagnosis-case')) return { value: 'diagnosis-case', classificationMethod: 'explicit-metadata', classificationConfidence: 'medium', evidenceUsed: [`pedagogy.role=${explicitRole}`, context.lesson.authoring?.purpose.es ?? ''], overrideApplied: false, alternativeCandidates: candidates.filter((value) => value !== 'diagnosis-case') }
  if (explicitRole === 'transfer' && /proyecto|dossier|defender|validar/i.test(text)) return { value: 'capstone-project', classificationMethod: 'semantic-rule', classificationConfidence: 'medium', evidenceUsed: [`pedagogy.role=${explicitRole}`, context.lesson.authoring?.purpose.es ?? ''], overrideApplied: false, alternativeCandidates: candidates }

  const blockKinds = lessonBlocks(context).map(({ kind }) => kind)
  if (blockKinds.includes('procedure') && /ejecut|desmont|mont|inspeccion|medir/i.test(text)) {
    const value: LearningArchetype = /inspeccion/i.test(normalize(text)) ? 'inspection' : /medir/i.test(normalize(text)) ? 'measurement' : 'bench-procedure'
    return { value, classificationMethod: 'semantic-rule', classificationConfidence: 'medium', evidenceUsed: [`block.kind=procedure`, context.lesson.authoring?.objectives[0]?.es ?? ''], overrideApplied: false, alternativeCandidates: candidates.filter((candidate) => candidate !== value) }
  }
  if (candidates.length) return { value: candidates[0], classificationMethod: 'heuristic-keyword', classificationConfidence: candidates.length === 1 ? 'medium' : 'low', evidenceUsed: [context.lesson.authoring?.purpose.es ?? context.lesson.title], overrideApplied: false, alternativeCandidates: candidates.slice(1) }
  return { value: 'system-overview', classificationMethod: 'semantic-rule', classificationConfidence: 'low', evidenceUsed: ['sin señal suficiente fuera del cuerpo completo'], overrideApplied: false, alternativeCandidates: [] }
}

function stageAndRole(context: CorpusLessonContext, archetype: LearningArchetype): { macroStage: MacroStage; trackRole: TrackRole; method: DetectionMethod } {
  const gold = semanticLessonGoldById.get(context.lesson.id)
  if (gold) return { macroStage: gold.macroStageExpected, trackRole: gold.trackRoleExpected, method: 'curated-override' }
  const route = routePolicy.get(context.route.id)
  let trackRole: TrackRole = route?.role ?? 'reference-only'
  const text = normalize(classificationInput(context))
  if (/caso oficial|expediente chicago|pasaporte/.test(text)) trackRole = 'historical-case'
  if (context.route.id.includes('history-language')) trackRole = 'enrichment'
  if (context.route.id.includes('quartz') || context.route.id.includes('2035')) trackRole = 'specialization'
  if (context.route.id === 'route.miyota8215.complete') return { macroStage: '4-work-on-real-calibre', trackRole: 'core', method: 'explicit-metadata' }
  if (context.route.id === 'route.quartz2035.isa-to-2035') return { macroStage: '4-work-on-real-calibre', trackRole: 'specialization', method: 'explicit-metadata' }
  if (trackRole === 'historical-case') {
    if (['inspection', 'diagnosis-case', 'measurement'].includes(archetype)) return { macroStage: '3-observe-measure-diagnose', trackRole, method: 'semantic-rule' }
    if (['bench-procedure', 'psychomotor-skill', 'manufacturing', 'design', 'calibre-service'].includes(archetype)) return { macroStage: '6-repair-adapt-manufacture-components', trackRole, method: 'semantic-rule' }
    return { macroStage: '1-understand-watch-as-system', trackRole, method: 'semantic-rule' }
  }
  if (context.route.id.includes('cases-water') && /restauracion|reparacion/.test(text)) return { macroStage: '6-repair-adapt-manufacture-components', trackRole, method: 'semantic-rule' }
  if (['bench-procedure', 'psychomotor-skill'].includes(archetype) && /banco|herramient|postura|lupa|pinza|destornill/.test(text)) return { macroStage: '0-prepare-bench-and-control', trackRole, method: 'semantic-rule' }
  if (['inspection', 'diagnosis-case', 'measurement'].includes(archetype)) return { macroStage: '3-observe-measure-diagnose', trackRole, method: 'semantic-rule' }
  if (archetype === 'calibre-service') return { macroStage: '4-work-on-real-calibre', trackRole, method: 'semantic-rule' }
  if (archetype === 'manufacturing' || archetype === 'psychomotor-skill') return { macroStage: '6-repair-adapt-manufacture-components', trackRole, method: 'semantic-rule' }
  if (archetype === 'design' || archetype === 'capstone-project') return { macroStage: /movimiento propio|arquitectura completa|validacion|revisi[oó]n independiente/.test(text) ? '7-design-validate-own-watch-or-movement' : '5-build-complete-watch', trackRole, method: 'semantic-rule' }
  if (archetype === 'historical-comparison' || archetype === 'system-overview') return { macroStage: '1-understand-watch-as-system', trackRole, method: 'semantic-rule' }
  return { macroStage: '2-understand-mechanical-systems', trackRole, method: 'semantic-rule' }
}

function evidenceProfile(values: {
  modalities: EvidenceLevel[]
  primary?: EvidenceLevel
  physicalCompetence?: boolean
  physicalExecution?: boolean
  result?: boolean
  reviewer?: boolean
  criteria?: string[]
  artifacts?: string[]
  method: DetectionMethod
  confidence: AuditConfidence
}): EvidenceProfile {
  const modalities = unique(values.modalities)
  return EvidenceProfileSchema.parse({
    modalities,
    primaryModality: values.primary ?? modalities.at(-1) ?? 'K',
    knowledgeExplanationRequired: modalities.includes('K'),
    virtualDemonstrationRequired: modalities.includes('V'),
    physicalExecutionRequired: values.physicalExecution ?? modalities.includes('P'),
    measuredOrReviewedResultRequired: values.result ?? modalities.includes('R'),
    physicalCompetenceClaim: values.physicalCompetence ?? false,
    reviewerRequired: values.reviewer ?? modalities.includes('R'),
    measurableAcceptanceCriteria: values.criteria ?? [],
    evidenceArtifacts: values.artifacts ?? [],
    classificationMethod: values.method,
    confidence: values.confidence,
  })
}

function lessonEvidenceProfile(context: CorpusLessonContext, archetype: LearningArchetype): EvidenceProfile {
  const gold = semanticLessonGoldById.get(context.lesson.id)
  if (gold) return evidenceProfile({
    modalities: gold.evidenceProfileExpected.modalities,
    primary: gold.evidenceProfileExpected.primaryModality,
    physicalCompetence: gold.physicalSkillClaimExpected,
    physicalExecution: gold.evidenceProfileExpected.physicalExecutionRequired,
    result: gold.evidenceProfileExpected.measuredOrReviewedResultRequired,
    reviewer: gold.evidenceProfileExpected.measuredOrReviewedResultRequired,
    artifacts: context.lesson.activityIds,
    method: 'curated-override',
    confidence: gold.confidence,
  })
  const modalities: EvidenceLevel[] = ['K']
  if (context.lesson.activityIds.length) modalities.push('V')
  if (['measurement', 'calculation', 'diagnosis-case', 'manufacturing', 'design', 'capstone-project'].includes(archetype)) modalities.push('R')
  const physicalCompetence = archetype === 'psychomotor-skill'
  return evidenceProfile({ modalities, physicalCompetence, artifacts: context.lesson.activityIds, method: 'semantic-rule', confidence: physicalCompetence ? 'medium' : 'high' })
}

function activityEvidenceProfile(context: CorpusActivityContext): EvidenceProfile {
  const gold = semanticActivityGoldById.get(context.activity.id)
  if (gold) return evidenceProfile({
    modalities: gold.evidenceProfileExpected.modalities,
    primary: gold.evidenceProfileExpected.primaryModality,
    physicalCompetence: gold.physicalSkillClaimExpected,
    physicalExecution: gold.evidenceProfileExpected.physicalExecutionRequired,
    result: gold.evidenceProfileExpected.measuredOrReviewedResultRequired,
    reviewer: gold.evidenceProfileExpected.measuredOrReviewedResultRequired,
    artifacts: context.activity.evidenceTemplateIds,
    method: 'curated-override',
    confidence: gold.confidence,
  })
  const authoring = context.activity.authoring
  const contract = authoring?.pedagogicalContract
  const modalities: EvidenceLevel[] = []
  if (contract?.evidenceLevel === 'exposure' || contract?.evidenceLevel === 'recognition' || contract?.evidenceLevel === 'causal-explanation') modalities.push('K')
  if (!modalities.includes('K') && contract) modalities.push('K')
  if (context.activity.sceneIds.length > 0 && contract?.evidenceLevel !== 'physical-observation') modalities.push('V')
  const templateKinds = context.activity.evidenceTemplateIds.map((id) => context.pack.evidenceTemplates.find((template) => template.id === id)?.kind).filter((kind) => kind !== undefined)
  const result = Boolean(authoring?.validationContract || authoring?.personalWatchDesignContract || authoring?.manufacturingContract || templateKinds.some((kind) => ['artifact', 'human-review'].includes(kind)))
  if (result) modalities.push('R')
  // Ningún contrato instalado declara ejecución física completada; physical-observation solo observa una unidad real.
  const physicalExecution = false
  return evidenceProfile({
    modalities: modalities.length ? modalities : ['V'],
    physicalCompetence: false,
    physicalExecution,
    result,
    reviewer: Boolean(authoring?.validationContract || authoring?.personalWatchDesignContract || templateKinds.includes('human-review')),
    artifacts: context.activity.evidenceTemplateIds,
    criteria: [
      ...(authoring?.manufacturingContract?.acceptanceCriterionIds ?? []),
      ...(authoring?.serviceProcedureContract?.acceptanceCriterionIds ?? []),
      ...(authoring?.validationContract?.acceptanceCriterionIds ?? []),
    ],
    method: authoring?.pedagogicalContract ? 'explicit-metadata' : 'structural-rule',
    confidence: authoring?.pedagogicalContract ? 'high' : 'medium',
  })
}

function executionTier(context: CorpusLessonContext, archetype: LearningArchetype): ExecutionTier {
  const gold = semanticLessonGoldById.get(context.lesson.id)
  if (gold) return gold.executionTierExpected
  const activities = context.lesson.activityIds.map((id) => context.pack.activities.find((activity) => activity.id === id)).filter((activity) => activity !== undefined)
  if (activities.some(({ authoring }) => authoring?.manufacturingContract?.supervisedWorkshopRequired)) return 'specialist-workshop'
  if (activities.some(({ authoring }) => authoring?.serviceProcedureContract?.mode === 'physical-observation')) return 'home-bench'
  if (archetype === 'manufacturing' || archetype === 'psychomotor-skill') return 'specialist-workshop'
  return 'simulation'
}

function historicalStatus(context: CorpusLessonContext, records: Map<string, SourceRecord>): HistoricalStatus {
  const gold = semanticLessonGoldById.get(context.lesson.id)
  if (gold) return gold.historicalStatusExpected
  const statuses = lessonSourceIds(context).map((id) => records.get(id)?.historicalStatus).filter((value) => value !== undefined)
  if (statuses.some((value) => value === 'historical-non-actionable')) return statuses.some((value) => value === 'current') ? 'mixed' : 'historical-context'
  if (statuses.some((value) => value === 'historical-context')) return statuses.some((value) => value === 'current') ? 'mixed' : 'historical-context'
  return statuses.every((value) => value === 'current') ? 'current' : 'unknown'
}

function sourceAuthorityRank(record: SourceRecord | undefined, archetype: LearningArchetype): number {
  if (!record) return 100
  const preferred = archetype === 'calibre-service' || archetype === 'visual-anatomy' ? 'A-manufacturer-official'
    : archetype === 'manufacturing' || archetype === 'design' ? 'C-daniels-watchmaking'
      : archetype === 'inspection' || archetype === 'diagnosis-case' ? 'F-tm-9-1575'
        : 'B-theory-of-horology'
  if (record.editorialFunction === preferred) return 0
  if (record.editorialFunction === 'A-manufacturer-official') return 1
  if (record.editorialFunction === 'project-original') return 8
  if (record.editorialFunction === 'H-reference-database') return 9
  return 3
}

function sourceRoles(context: CorpusLessonContext, archetype: LearningArchetype, records: Map<string, SourceRecord>): SourceRoleAudit {
  const ids = lessonSourceIds(context)
  const sorted = [...ids].sort((left, right) => sourceAuthorityRank(records.get(left), archetype) - sourceAuthorityRank(records.get(right), archetype) || left.localeCompare(right))
  const primary = sorted[0] ?? null
  const supporting = sorted.filter((id) => id !== primary && !['G-watchmaker-or-visual-resource', 'H-reference-database'].includes(records.get(id)?.editorialFunction ?? ''))
  const contextIds = sorted.filter((id) => ['D-bulova-school', 'E-chicago-school', 'F-tm-9-1575', 'project-original'].includes(records.get(id)?.editorialFunction ?? ''))
  return {
    explicitPrimarySourceId: null,
    derivedPrimarySourceId: primary,
    supportingSourceIds: supporting,
    contextSourceIds: contextIds,
    visualInspirationSourceIds: sorted.filter((id) => records.get(id)?.editorialFunction === 'G-watchmaker-or-visual-resource'),
    safetySourceIds: sorted.filter((id) => /safety|standard|guidance/i.test(records.get(id)?.sourceType ?? '') && records.get(id)?.historicalStatus === 'current'),
    identificationDatabaseSourceIds: sorted.filter((id) => records.get(id)?.editorialFunction === 'H-reference-database'),
    classificationMethod: 'semantic-rule',
    confidence: primary ? 'medium' : 'low',
  }
}

const numericPattern = /\b\d+(?:[.,]\d+)?(?:\s*(?:mm|cm|µm|um|nm|hz|vph|a\/h|°|n|g|kg|ms|s|%|v|a|ohm|bar|atm|rub[ií]es?|l[ií]neas?))?\b/gi
const formulaPattern = /(?:^|\s)[a-zA-Z]\s*=|=\s*\d|\b(?:cos|sin|tan|ratio|f[oó]rmula|ecuaci[oó]n|m[oó]dulo)\b|[×÷√]/i

function auditClaims(context: CorpusLessonContext, archetype: LearningArchetype, records: Map<string, SourceRecord>): ClaimAudit[] {
  return lessonBlocks(context).flatMap((block) => block.claims.map((claim) => {
    const citations = claim.sources
    const sorted = [...citations].sort((left, right) => sourceAuthorityRank(records.get(left.id), archetype) - sourceAuthorityRank(records.get(right.id), archetype) || left.id.localeCompare(right.id))
    const primaryCitation = sorted[0]
    const primaryRecord = primaryCitation ? records.get(primaryCitation.id) : undefined
    const numericValues = unique(claim.claim.match(numericPattern) ?? [])
    const formulaPresent = claim.claimType === 'calculation' ? formulaPattern.test(claim.expression) || formulaPattern.test(claim.claim) : formulaPattern.test(claim.claim)
    return ClaimAuditSchema.parse({
      claimId: claim.id,
      lessonId: context.lesson.id,
      blockId: block.id,
      claimTextHash: createHash('sha256').update(claim.claim).digest('hex'),
      claimType: claim.claimType,
      numericValues,
      formulaPresent,
      primarySourceId: primaryCitation?.id ?? null,
      supportingSourceIds: sorted.slice(1).filter(({ id }) => !['G-watchmaker-or-visual-resource', 'H-reference-database'].includes(records.get(id)?.editorialFunction ?? '')).map(({ id }) => id),
      contextSourceIds: sorted.filter(({ id }) => ['D-bulova-school', 'E-chicago-school', 'F-tm-9-1575', 'project-original'].includes(records.get(id)?.editorialFunction ?? '')).map(({ id }) => id),
      visualInspirationSourceIds: sorted.filter(({ id }) => records.get(id)?.editorialFunction === 'G-watchmaker-or-visual-resource').map(({ id }) => id),
      safetySourceIds: sorted.filter(({ id }) => /safety|standard|guidance/i.test(records.get(id)?.sourceType ?? '') && records.get(id)?.historicalStatus === 'current').map(({ id }) => id),
      identificationDatabaseSourceIds: sorted.filter(({ id }) => records.get(id)?.editorialFunction === 'H-reference-database').map(({ id }) => id),
      sourceLocator: primaryRecord?.location.locator ?? primaryCitation?.resource.locator ?? null,
      page: primaryCitation?.page ?? null,
      figure: primaryCitation?.figure ?? null,
      table: null,
      manufacturerApplicability: primaryCitation?.calibre ?? primaryCitation?.movement ?? null,
      verificationStatus: primaryRecord?.verificationStatus ?? 'unknown',
      visuallyVerified: primaryRecord?.verificationStatus === 'visually-verified',
      modernCorroboration: primaryRecord?.requiresModernCorroboration ? 'required' : 'not-required',
      unresolvedReason: !primaryCitation ? 'claim-without-source' : primaryRecord ? null : 'source-not-in-registry',
    })
  }))
}

function conceptOrigins(corpus: AcademyCorpus): Map<string, ConceptOrigin> {
  const origins = new Map<string, ConceptOrigin>()
  for (const context of corpus.lessons) {
    const metadata = context.lesson.authoring
    const roles: Array<[string[], ConceptOrigin['conceptualRole']]> = [
      [metadata?.pedagogy?.introducesConceptIds ?? [], 'introduced'],
      [metadata?.pedagogy?.reinforcesConceptIds ?? [], 'reinforced'],
      [metadata?.pedagogy?.bridgeConceptIds ?? [], 'bridge'],
      [metadata?.conceptIds ?? [], 'declared'],
    ]
    for (const [ids, role] of roles) for (const conceptId of ids) {
      const current = origins.get(conceptId)
      if (!current || (role === 'introduced' && current.conceptualRole !== 'introduced')) origins.set(conceptId, {
        conceptId, routeId: context.route.id, moduleId: context.module.id, lessonId: context.lesson.id, globalOrder: context.globalOrder, conceptualRole: role,
      })
    }
  }
  for (const { pack } of corpus.packs) for (const concept of pack.concepts) if (!origins.has(concept.id)) origins.set(concept.id, {
    conceptId: concept.id, routeId: concept.routeIds[0] ?? null, moduleId: null, lessonId: concept.bridgeLessonId ?? null, globalOrder: null, conceptualRole: 'catalog-only',
  })
  return origins
}

const knownImproperPrerequisites: Array<{ lessonId: string; conceptPattern: RegExp; code: string; reason: string }> = [
  {
    lessonId: 'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple',
    conceptPattern: /minuteria-y-puesta-en-hora/,
    code: 'later-detail-before-overview',
    reason: 'Una visión general del movimiento no debe exigir detalles posteriores de minutería y puesta en hora que debe situar primero.',
  },
  {
    lessonId: 'lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante',
    conceptPattern: /toh-tourbillon-carrusel/,
    code: 'advanced-complication-before-basic-skill',
    reason: 'Centrado y alabeo básicos no requieren tourbillon, carrusel ni promedio posicional.',
  },
  {
    lessonId: 'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b',
    conceptPattern: /de-movimiento-adquirido-a-propio\.(?:arquitectura-de-producto|presupuesto-de-error|v-model-de-validacion)/,
    code: 'modern-design-framework-before-historical-case',
    reason: 'El caso histórico no aplica deliberadamente esos marcos modernos de diseño como requisito de entrada.',
  },
]

function auditPrerequisites(context: CorpusLessonContext, origins: Map<string, ConceptOrigin>): PrerequisiteAuditRecord[] {
  const required = context.lesson.authoring?.prerequisiteConceptIds ?? []
  const recommended = context.lesson.authoring?.recommendedPrerequisiteConceptIds ?? []
  return [...required.map((conceptId) => ({ conceptId, required: true })), ...recommended.map((conceptId) => ({ conceptId, required: false }))].map(({ conceptId, required: isRequired }) => {
    const origin = origins.get(conceptId) ?? { conceptId, routeId: null, moduleId: null, lessonId: null, globalOrder: null, conceptualRole: 'unknown' as const }
    const curated = knownImproperPrerequisites.find((entry) => entry.lessonId === context.lesson.id && entry.conceptPattern.test(conceptId))
    if (curated) return { conceptId, required: isRequired, origin, classification: 'improper' as const, method: 'curated-override' as const, confidence: 'high' as const, proposal: 'remove-or-replace' as const, reason: `${curated.code}: ${curated.reason}` }
    if (isRequired && origin.lessonId === context.lesson.id) return { conceptId, required: isRequired, origin, classification: 'improper' as const, method: 'structural-rule' as const, confidence: 'high' as const, proposal: 'remove-or-replace' as const, reason: 'La lección exige como prerrequisito un concepto que ella misma introduce.' }
    if (isRequired && origin.routeId === context.route.id && origin.globalOrder !== null && origin.globalOrder > context.globalOrder) return { conceptId, required: isRequired, origin, classification: 'improper' as const, method: 'semantic-rule' as const, confidence: 'high' as const, proposal: 'move-to-recommended' as const, reason: `El concepto se origina después en la misma ruta (orden ${origin.globalOrder} > ${context.globalOrder}).` }
    const originRole = origin.routeId ? routePolicy.get(origin.routeId)?.role : undefined
    const currentRole = routePolicy.get(context.route.id)?.role
    if (isRequired && currentRole === 'core' && originRole === 'specialization') return { conceptId, required: isRequired, origin, classification: 'advanced-detail' as const, method: 'semantic-rule' as const, confidence: 'medium' as const, proposal: 'move-to-recommended' as const, reason: 'Una especialización avanzada aparece como entrada obligatoria de una lección core.' }
    if (!isRequired) return { conceptId, required: isRequired, origin, classification: 'helpful-context' as const, method: 'explicit-metadata' as const, confidence: 'high' as const, proposal: 'keep-required' as const, reason: 'La autoría ya lo declara recomendación no bloqueante.' }
    if (!origin.lessonId) return { conceptId, required: isRequired, origin, classification: 'unknown' as const, method: 'semantic-rule' as const, confidence: 'low' as const, proposal: 'manual-review' as const, reason: 'No se pudo localizar una lección de origen inequívoca.' }
    return { conceptId, required: isRequired, origin, classification: 'essential-foundation' as const, method: 'structural-rule' as const, confidence: 'medium' as const, proposal: 'keep-required' as const, reason: 'El concepto se origina antes y no presenta una incoherencia semántica conocida.' }
  })
}

const hazardPatterns: Array<[string, RegExp]> = [
  ['cyanide', /cianuro|cyanide/i],
  ['carbon-tetrachloride', /tetracloruro|carbon tetrachloride/i],
  ['strong-acid', /[aá]cido sulf[uú]rico|sulphuric acid|sulfuric acid/i],
  ['radioactive-luminous-material', /radioactiv|radium|pintura luminosa|luminous paint/i],
  ['lead-heavy-metal', /\bplomo\b|\blead\b|mercur/i],
  ['open-flame-heat', /llama|soplete|alcohol lamp|calentar al rojo/i],
  ['volatile-solvent', /benzene|benceno|naphtha|gasolina|amoniaco concentrado/i],
  ['electroplating', /galvanoplast|electroplat/i],
]
const actionPattern = /\b(aplica|mezcla|sumerge|calienta|enciende|opera|vierte|limpia con|usa|utiliza|pulveriza|tornea|suelda)\b/i
const excludedSectionPattern = /fuentes|referencias|alcance|limitaciones|advertencia|hist[oó]ric|transferencia|glosario/i

function actionableParagraphs(context: CorpusLessonContext): Array<{ blockId: string; text: string }> {
  return lessonBlocks(context).flatMap((block) => {
    let excluded = false
    return block.bodyMarkdown.split(/\r?\n/).flatMap((line) => {
      if (/^#{1,6}\s+/.test(line)) {
        excluded = excludedSectionPattern.test(line)
        return []
      }
      const text = line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '').trim()
      return excluded || text.length < 20 ? [] : [{ blockId: block.id, text }]
    })
  })
}

function operationalRisk(context: CorpusLessonContext, records: Map<string, SourceRecord>, issues: AuditIssue[]): LessonOperationalRisk {
  const gold = semanticLessonGoldById.get(context.lesson.id)
  const sourceHistoricalRiskIds = lessonSourceIds(context).filter((id) => (records.get(id)?.knownRisks.length ?? 0) > 0)
  const candidates = actionableParagraphs(context)
  const procedureRisks = candidates.flatMap(({ blockId, text }) => hazardPatterns.flatMap(([hazard, pattern]) => {
    const actionable = actionPattern.test(text) && pattern.test(text) && /(?:primero|despu[eé]s|a continuaci[oó]n|\d+[.)])/i.test(text)
    return actionable ? [{ blockId, text, hazard }] : []
  }))
  for (const risk of procedureRisks) addIssue(issues, {
    detectorId: 15,
    category: 'hazardous-historical-procedure',
    severity: 'critical',
    entityType: 'procedure',
    entityId: `procedure.${context.lesson.id}.${risk.blockId}.${risk.hazard}`,
    message: 'Se detectó una secuencia accionable con un peligro concreto; queda bloqueada hasta revisión moderna.',
    evidence: [`fragment=${risk.text.slice(0, 500)}`, `block=${risk.blockId}`, `source=${lessonSourceIds(context).join(',')}`, `hazard=${risk.hazard}`, 'modernAlternative=pending'],
    detectionMethod: 'semantic-rule', confidence: 'high', scope: 'procedure', reviewStatus: 'confirmed', actionable: true,
  })
  if (procedureRisks.length && !lessonSourceIds(context).some((id) => /safety|niosh|osha|iso\./i.test(id) && records.get(id)?.historicalStatus === 'current')) addIssue(issues, {
    detectorId: 16,
    category: 'modern-safety-source-required',
    severity: 'critical',
    entityType: 'lesson',
    entityId: context.lesson.id,
    message: 'La operación accionable con exposición real necesita una fuente moderna de seguridad.',
    evidence: procedureRisks.map(({ blockId, hazard }) => `${blockId}:${hazard}`),
    detectionMethod: 'derived-from-another-issue', confidence: 'high', scope: 'lesson', rootCauseId: `issue.15.hazardous-historical-procedure.procedure.${context.lesson.id}.${procedureRisks[0].blockId}.${procedureRisks[0].hazard}`, derivedFromIssueIds: [], reviewStatus: 'confirmed', actionable: true,
  })
  const manufacturingPlanning = context.lesson.activityIds.some((id) => context.pack.activities.find((activity) => activity.id === id)?.authoring?.manufacturingContract)
  const status = gold?.safetyExpected ?? (procedureRisks.length ? 'prohibited-in-academy' : manufacturingPlanning ? 'caution' : 'normal')
  return LessonOperationalRiskSchema.parse({
    lessonId: context.lesson.id,
    sourceHistoricalRiskCount: sourceHistoricalRiskIds.length,
    claimRiskCount: 0,
    procedureRiskCount: procedureRisks.length,
    operationalSafetyStatus: status,
    invitesExecution: procedureRisks.length > 0,
    rationale: procedureRisks.length ? 'Existe una operación accionable con peligro concreto.' : sourceHistoricalRiskIds.length ? 'Hay riesgos en las obras citadas, pero no se heredan sin una operación accionable.' : 'No se detectó una operación peligrosa accionable.',
  })
}

function localeStatus(context: CorpusLessonContext): Pick<SemanticLessonRow, 'localeStatus' | 'supportedLocaleActual' | 'localeRecommendation'> {
  const metadata = context.lesson.authoring
  const localized = [metadata?.title, metadata?.purpose, ...(metadata?.objectives ?? [])].filter((value) => value !== undefined)
  const duplicated = localized.some(({ es, en }) => en !== undefined && normalize(es) === normalize(en))
  if (duplicated) return { localeStatus: 'placeholder-duplicated', supportedLocaleActual: 'es', localeRecommendation: 'hide-or-disable-en-until-real-translation' }
  const complete = localized.length > 0 && localized.every(({ en }) => en !== undefined)
  return { localeStatus: complete ? 'complete' : localized.length ? 'partial' : 'unknown', supportedLocaleActual: complete ? 'es+en' : localized.length ? 'es' : 'unknown', localeRecommendation: 'none' }
}

function priorityFor(context: CorpusLessonContext, entityIssues: AuditIssue[], globalIssueIds: string[], downstreamUses: number, visualMissing: boolean): SemanticPriority {
  const nonDerivedRoots = unique(entityIssues.map((issue) => issue.rootCauseId ?? issueId(issue)))
  if (!nonDerivedRoots.length) return {
    score: 0, level: 'no-action', confidence: 'high', confirmedIssuePoints: 0, heuristicIssuePoints: 0, globalIssuesExcluded: globalIssueIds, rootCauses: [], rationale: ['Sin incidencia individual calibrada; las migraciones globales se contabilizan aparte.'], recommendedNextAction: 'keep', estimatedCorrectionCost: 'unknown',
  }
  const confidenceFactor = { high: 1, medium: 0.65, low: 0.3 } as const
  const severityPoints = { critical: 30, high: 16, medium: 8, low: 3, info: 1 } as const
  let confirmedIssuePoints = 0
  let heuristicIssuePoints = 0
  const seen = new Set<string>()
  for (const issue of entityIssues) {
    const root = issue.rootCauseId ?? issueId(issue)
    if (seen.has(root)) continue
    seen.add(root)
    const points = Math.round(severityPoints[issue.severity] * confidenceFactor[issue.confidence])
    if (issue.reviewStatus === 'confirmed' || issue.detectionMethod === 'exact-match' || issue.detectionMethod === 'curated-override') confirmedIssuePoints += points
    else heuristicIssuePoints += points
  }
  const route = routePolicy.get(context.route.id)
  const exposure = route?.role === 'core' ? Math.max(2, 18 - Math.floor(context.globalOrder / 20)) : 2
  const damage = entityIssues.some(({ detectorId }) => [7, 8, 15, 16, 17, 22, 23, 24].includes(detectorId)) ? 12 : 4
  const technicalRisk = entityIssues.some(({ detectorId }) => [15, 16, 23, 24].includes(detectorId)) ? 15 : 0
  const dependencyImportance = Math.min(10, Math.floor(downstreamUses / 3))
  const sourceUncertainty = entityIssues.some(({ reviewStatus }) => reviewStatus === 'needs-source-check') ? 8 : 0
  const visual = visualMissing ? 6 : 0
  const estimatedCorrectionCost: SemanticPriority['estimatedCorrectionCost'] = entityIssues.some(({ detectorId }) => [5, 6, 20, 21].includes(detectorId)) ? 'large'
    : entityIssues.some(({ detectorId }) => [8, 12, 13, 14, 17, 18, 22, 23].includes(detectorId)) ? 'medium' : 'small'
  const costAdjustment = estimatedCorrectionCost === 'small' ? 3 : estimatedCorrectionCost === 'large' ? -3 : 0
  const score = Math.max(0, confirmedIssuePoints + heuristicIssuePoints + exposure + damage + technicalRisk + dependencyImportance + sourceUncertainty + visual + costAdjustment)
  const onlyLowConfidence = entityIssues.every(({ confidence }) => confidence === 'low')
  const level: SemanticPriority['level'] = onlyLowConfidence ? 'manual-triage' : score >= 85 ? 'critical' : score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low'
  const confidence: AuditConfidence = entityIssues.some(({ confidence }) => confidence === 'high') ? 'high' : entityIssues.some(({ confidence }) => confidence === 'medium') ? 'medium' : 'low'
  const next: RecommendedAction = entityIssues.some(({ reviewStatus }) => ['needs-human-judgment', 'needs-source-check'].includes(reviewStatus)) ? 'manual-review' : 'edit'
  return {
    score, level, confidence, confirmedIssuePoints, heuristicIssuePoints, globalIssuesExcluded: globalIssueIds, rootCauses: nonDerivedRoots,
    rationale: [`exposición=${exposure}`, `daño-pedagógico=${damage}`, `riesgo-técnico=${technicalRisk}`, `dependencias=${dependencyImportance}`, `incertidumbre-fuente=${sourceUncertainty}`, `visual=${visual}`, `coste=${estimatedCorrectionCost}`],
    recommendedNextAction: next, estimatedCorrectionCost,
  }
}

function globalMigrations(corpus: AcademyCorpus, baselineLessons: LessonMatrixRow[]): GlobalMigration[] {
  const duplicated = baselineLessons.filter(({ languageProblems }) => languageProblems.length > 0).length
  const oneLessonModules = new Set(corpus.lessons.filter(({ module }) => module.lessonIds.length === 1).map(({ module }) => module.id)).size
  const redundant = baselineLessons.filter(({ editorialProblems }) => editorialProblems.includes('redundant-names')).length
  return [
    {
      migrationId: 'migration.global.locale-placeholder-en', category: 'locale-placeholder-duplicated', affectedEntities: duplicated, prevalence: duplicated / corpus.counts.lessons,
      localeStatus: 'placeholder-duplicated', supportedLocaleActual: 'es', recommendation: 'hide-or-disable-en-until-real-translation', excludedFromIndividualPriority: true, detectionMethod: 'exact-match', confidence: 'high', evidence: [`lessons=${duplicated}/${corpus.counts.lessons}`, 'policy=localization-corpus-migration'],
    },
    {
      migrationId: 'migration.global.single-lesson-modules', category: 'single-lesson-module', affectedEntities: oneLessonModules, prevalence: oneLessonModules / corpus.counts.modules,
      recommendation: 'Review as a structural migration; do not merge or delete modules in 0.14A.1.', excludedFromIndividualPriority: true, detectionMethod: 'structural-rule', confidence: 'high', evidence: [`modules=${oneLessonModules}/${corpus.counts.modules}`],
    },
    {
      migrationId: 'migration.global.redundant-module-lesson-names', category: 'redundant-names', affectedEntities: redundant, prevalence: redundant / corpus.counts.lessons,
      recommendation: 'Resolve naming policy globally after navigation decisions; preserve current IDs and labels now.', excludedFromIndividualPriority: true, detectionMethod: 'exact-match', confidence: 'high', evidence: [`lessons=${redundant}/${corpus.counts.lessons}`],
    },
  ]
}

function evaluateGold(lessons: SemanticLessonRow[], activities: SemanticActivityRow[]): GoldEvaluation {
  const failures: GoldEvaluation['failures'] = []
  let assertions = 0
  const check = (fixtureId: string, field: string, expected: unknown, actual: unknown) => {
    assertions += 1
    if (JSON.stringify(expected) !== JSON.stringify(actual)) failures.push({ fixtureId, field, expected, actual })
  }
  const lessonById = new Map(lessons.map((row) => [row.lessonId, row]))
  for (const fixture of semanticLessonGoldById.values()) {
    const row = lessonById.get(fixture.lessonId)
    check(fixture.lessonId, 'exists', true, Boolean(row))
    if (!row) continue
    check(fixture.lessonId, 'macroStage', fixture.macroStageExpected, row.macroStage)
    check(fixture.lessonId, 'trackRole', fixture.trackRoleExpected, row.trackRole)
    check(fixture.lessonId, 'archetype', fixture.archetypeExpected, row.recommendedLearningArchetype)
    check(fixture.lessonId, 'modalities', fixture.evidenceProfileExpected.modalities, row.evidenceProfile.modalities)
    check(fixture.lessonId, 'physicalSkillClaim', fixture.physicalSkillClaimExpected, row.evidenceProfile.physicalCompetenceClaim)
    check(fixture.lessonId, 'executionTier', fixture.executionTierExpected, row.executionTier)
    check(fixture.lessonId, 'safety', fixture.safetyExpected, row.safetyStatus)
    check(fixture.lessonId, 'historicalStatus', fixture.historicalStatusExpected, row.historicalStatus)
    const prerequisiteCodes = row.prerequisiteAudit.filter(({ classification }) => classification === 'improper').map(({ reason }) => reason.split(':')[0])
    fixture.prerequisiteIssuesExpected.forEach((code) => check(fixture.lessonId, `prerequisite:${code}`, true, prerequisiteCodes.includes(code)))
  }
  const activityById = new Map(activities.map((row) => [row.activityId, row]))
  for (const fixture of semanticActivityGoldById.values()) {
    const row = activityById.get(fixture.activityId)
    check(fixture.activityId, 'exists', true, Boolean(row))
    if (!row) continue
    check(fixture.activityId, 'archetype', fixture.archetypeExpected, row.archetype)
    check(fixture.activityId, 'modalities', fixture.evidenceProfileExpected.modalities, row.evidenceProfile.modalities)
    check(fixture.activityId, 'physicalExecution', fixture.evidenceProfileExpected.physicalExecutionRequired, row.evidenceProfile.physicalExecutionRequired)
    check(fixture.activityId, 'executionTier', fixture.executionTierExpected, row.executionTier)
    check(fixture.activityId, 'safety', fixture.safetyExpected, row.risk)
  }
  return { lessonFixtures: semanticLessonGoldById.size, activityFixtures: semanticActivityGoldById.size, assertions, passed: assertions - failures.length, failed: failures.length, failures }
}

export async function analyzeSemanticAudit(repositoryRoot: string, corpus: AcademyCorpus, sourceRecords: SourceRecord[]): Promise<SemanticAnalysis> {
  const baseline = await analyzeMatrices(repositoryRoot, corpus, sourceRecords)
  const baselineLessonById = new Map(baseline.lessons.map((row) => [row.lessonId, row]))
  const baselineActivityById = new Map(baseline.activities.map((row) => [row.activityId, row]))
  const records = sourceById(sourceRecords)
  const origins = conceptOrigins(corpus)
  const issues: AuditIssue[] = []
  const global = globalMigrations(corpus, baseline.lessons)

  const retainedDetectorIds = new Set([1, 2, 4, 5, 6, 7, 9, 19, 20, 21, 25])
  for (const old of baseline.issues.filter(({ detectorId }) => retainedDetectorIds.has(detectorId))) {
    const method: DetectionMethod = [1, 2, 7, 9, 19, 25].includes(old.detectorId) ? 'structural-rule' : old.detectorId === 4 ? 'exact-match' : 'heuristic-keyword'
    const confidence: AuditConfidence = [1, 2, 7, 9, 19, 25].includes(old.detectorId) ? 'high' : old.detectorId === 4 ? 'medium' : 'low'
    const reviewStatus: ReviewStatus = confidence === 'high' ? 'confirmed' : confidence === 'medium' ? 'likely' : 'needs-human-judgment'
    addIssue(issues, { ...old, detectionMethod: method, confidence, scope: old.entityType === 'route' ? 'route' : old.entityType === 'module' ? 'module' : old.entityType === 'activity' ? 'activity' : 'lesson', reviewStatus, actionable: confidence === 'high' })
  }

  for (const migration of global) {
    const detectorId = migration.category === 'locale-placeholder-duplicated' ? 3 : migration.category === 'single-lesson-module' ? 10 : 11
    addIssue(issues, {
      detectorId, category: migration.category, severity: 'info', entityType: 'global', entityId: migration.migrationId,
      message: migration.recommendation, evidence: migration.evidence, detectionMethod: migration.detectionMethod, confidence: migration.confidence, scope: 'global', reviewStatus: 'confirmed', actionable: false,
    })
  }

  const seeded = corpus.lessons.map((context) => {
    const classification = classifyArchetype(context)
    const stage = stageAndRole(context, classification.value)
    const evidence = lessonEvidenceProfile(context, classification.value)
    const claims = auditClaims(context, classification.value, records)
    const prerequisites = auditPrerequisites(context, origins)
    const roles = sourceRoles(context, classification.value, records)
    const risk = operationalRisk(context, records, issues)
    return { context, classification, stage, evidence, claims, prerequisites, roles, risk }
  })

  for (const seed of seeded) {
    for (const prerequisite of seed.prerequisites.filter(({ classification }) => classification === 'improper')) addIssue(issues, {
      detectorId: 8, category: 'higher-level-prerequisite', severity: 'high', entityType: 'lesson', entityId: seed.context.lesson.id,
      message: 'Prerrequisito semánticamente impropio; se propone revisar sin modificar automáticamente.',
      evidence: [`conceptId=${prerequisite.conceptId}`, `originLesson=${prerequisite.origin.lessonId ?? 'unknown'}`, `originOrder=${prerequisite.origin.globalOrder ?? 'unknown'}`, `reason=${prerequisite.reason}`, `proposal=${prerequisite.proposal}`],
      detectionMethod: prerequisite.method, confidence: prerequisite.confidence, scope: 'lesson', reviewStatus: prerequisite.method === 'curated-override' ? 'confirmed' : 'likely', actionable: true,
    })
    for (const claim of seed.claims) {
      const record = claim.primarySourceId ? records.get(claim.primarySourceId) : undefined
      const missingSpecificLocator = Boolean(claim.primarySourceId && !claim.page && !claim.figure && !claim.table)
      const locatorRoot = missingSpecificLocator ? `issue.12.overbroad-citation.${claim.claimId}` : null
      if (missingSpecificLocator) addIssue(issues, {
        detectorId: 12, category: 'overbroad-citation', severity: 'medium', entityType: 'claim', entityId: claim.claimId,
        message: 'La afirmación concreta solo dispone de localizador de capítulo, documento o recurso completo.',
        evidence: [`lessonId=${claim.lessonId}`, `blockId=${claim.blockId}`, `primarySource=${claim.primarySourceId}`, `claimHash=${claim.claimTextHash}`],
        detectionMethod: 'structural-rule', confidence: 'high', scope: 'claim', reviewStatus: 'needs-source-check', actionable: true,
      })
      if (claim.numericValues.length && !claim.page && !claim.figure && !claim.table) addIssue(issues, {
        detectorId: 13, category: 'numeric-data-without-locator', severity: 'high', entityType: 'claim', entityId: claim.claimId,
        message: 'La afirmación concreta contiene valores numéricos sin página, figura o tabla aplicable.',
        evidence: [`lessonId=${claim.lessonId}`, `blockId=${claim.blockId}`, `values=${claim.numericValues.join('|')}`, `primarySource=${claim.primarySourceId ?? 'unknown'}`],
        detectionMethod: locatorRoot ? 'derived-from-another-issue' : 'structural-rule', confidence: 'high', scope: 'claim', rootCauseId: locatorRoot, reviewStatus: 'needs-source-check', actionable: true,
      })
      const ocrLinked = Boolean(record && ['mixed', 'poor', 'unknown'].includes(record.ocrQuality) && /daniels|horologia|toh|chicago|bulova|tm9/i.test(record.sourceId))
      if (claim.formulaPresent && ocrLinked && !claim.visuallyVerified) addIssue(issues, {
        detectorId: 14, category: 'ocr-formula-unverified', severity: 'critical', entityType: 'claim', entityId: claim.claimId,
        message: 'La fórmula concreta está vinculada a una fuente OCR y carece de verificación visual.',
        evidence: [`lessonId=${claim.lessonId}`, `blockId=${claim.blockId}`, `sourceId=${claim.primarySourceId}`, `claimHash=${claim.claimTextHash}`],
        detectionMethod: 'semantic-rule', confidence: 'high', scope: 'claim', reviewStatus: 'needs-source-check', actionable: true,
      })
      if (claim.primarySourceId && record?.editorialFunction === 'H-reference-database' && ['calculation', 'source'].includes(claim.claimType)) addIssue(issues, {
        detectorId: 23, category: 'secondary-database-as-official', severity: 'high', entityType: 'claim', entityId: claim.claimId,
        message: 'Una base de identificación quedó como autoridad primaria de una afirmación técnica concreta.',
        evidence: [`lessonId=${claim.lessonId}`, `sourceId=${claim.primarySourceId}`, `claimHash=${claim.claimTextHash}`],
        detectionMethod: 'semantic-rule', confidence: 'high', scope: 'claim', reviewStatus: 'needs-source-check', actionable: true,
      })
    }
  }

  const seedByLesson = new Map(seeded.map((seed) => [seed.context.lesson.id, seed]))
  const activities: SemanticActivityRow[] = corpus.activities.map((context) => {
    const baselineRow = baselineActivityById.get(context.activity.id)
    if (!baselineRow) throw new Error(`Actividad ausente del baseline: ${context.activity.id}`)
    const seed = seedByLesson.get(context.lesson.id)
    if (!seed) throw new Error(`Lección ausente del análisis: ${context.lesson.id}`)
    const profile = activityEvidenceProfile(context)
    const gold = semanticActivityGoldById.get(context.activity.id)
    const tier = gold?.executionTierExpected ?? executionTier(context, seed.classification.value)
    const risk = gold?.safetyExpected ?? seed.risk.operationalSafetyStatus
    if (profile.physicalCompetenceClaim && !profile.modalities.includes('P')) addIssue(issues, {
      detectorId: 17, category: 'physical-skill-digital-only', severity: 'critical', entityType: 'activity', entityId: context.activity.id,
      message: 'La actividad afirma competencia física pero no solicita evidencia P de ejecución real documentada.',
      evidence: [`modalities=${profile.modalities.join('+')}`, `physicalBoundary=${context.activity.authoring?.pedagogicalContract?.physicalBoundary.es ?? 'undeclared'}`],
      detectionMethod: 'semantic-rule', confidence: 'high', scope: 'activity', reviewStatus: 'confirmed', actionable: true,
    })
    return {
      ...baselineRow,
      macroStage: seed.stage.macroStage,
      trackRole: seed.stage.trackRole,
      archetype: seed.classification.value,
      evidenceProfile: profile,
      physicalCompetenceClaim: profile.physicalCompetenceClaim,
      physicalExecutionDeclared: profile.physicalExecutionRequired,
      currentEvidenceLevel: baselineRow.currentEvidenceLevel,
      recommendedEvidenceLevel: profile.primaryModality,
      executionTier: tier,
      risk,
      operationalRisk: risk,
      impliesPhysicalSkill: profile.physicalCompetenceClaim,
      issueIds: [],
      rootCauseIds: [],
    }
  })

  // Una competencia psicomotriz curada sin actividad física es una brecha curricular raíz, no una orden de añadir P a la actividad digital.
  for (const seed of seeded.filter(({ evidence }) => evidence.physicalCompetenceClaim && evidence.physicalExecutionRequired)) {
    const hasPhysicalActivity = activities.some(({ lessonId, evidenceProfile: profile }) => lessonId === seed.context.lesson.id && profile.physicalExecutionRequired)
    if (!hasPhysicalActivity) addIssue(issues, {
      detectorId: 17, category: 'physical-skill-digital-only', severity: 'high', entityType: 'lesson', entityId: seed.context.lesson.id,
      message: 'La competencia psicomotriz necesita una futura vía P, pero las actividades actuales permanecen digitales y no deben reclamarla.',
      evidence: [`lessonModalities=${seed.evidence.modalities.join('+')}`, 'physicalActivity=false', 'automaticContentChange=false'],
      detectionMethod: 'curated-override', confidence: 'high', scope: 'lesson', reviewStatus: 'confirmed', actionable: true,
    })
  }

  issues.sort((left, right) => left.detectorId - right.detectorId || left.entityId.localeCompare(right.entityId) || left.message.localeCompare(right.message))
  const lessonByActivity = new Map(corpus.activities.map(({ activity, lesson }) => [activity.id, lesson.id]))
  const lessonByClaim = new Map(seeded.flatMap(({ context, claims }) => claims.map(({ claimId }) => [claimId, context.lesson.id] as const)))
  const lessonForIssue = (issue: AuditIssue): string | null => issue.entityType === 'lesson' ? issue.entityId
    : issue.entityType === 'activity' ? lessonByActivity.get(issue.entityId) ?? null
      : issue.entityType === 'claim' ? lessonByClaim.get(issue.entityId) ?? null
        : issue.entityType === 'procedure' ? issue.entityId.split('.').slice(1, -2).join('.').replace(/^procedure\./, '') : null
  const downstream = new Map<string, number>()
  for (const context of corpus.lessons) for (const conceptId of context.lesson.authoring?.prerequisiteConceptIds ?? []) downstream.set(conceptId, (downstream.get(conceptId) ?? 0) + 1)
  const globalIds = global.map(({ migrationId }) => migrationId)

  const lessons: SemanticLessonRow[] = seeded.map((seed) => {
    const baselineRow = baselineLessonById.get(seed.context.lesson.id)
    if (!baselineRow) throw new Error(`Lección ausente del baseline: ${seed.context.lesson.id}`)
    const entityIssues = issues.filter((issue) => lessonForIssue(issue) === seed.context.lesson.id)
    const readyVisuals = (seed.context.lesson.authoring?.visualResourceIds ?? []).map((id) => seed.context.pack.visualResources.find((resource) => resource.id === id)).filter((resource) => resource && ['ready', 'approved'].includes(resource.status)).length
    const visualRequired = ['visual-anatomy', 'bench-procedure', 'psychomotor-skill', 'inspection', 'measurement', 'manufacturing', 'calibre-service'].includes(seed.classification.value)
    if (visualRequired && readyVisuals === 0) {
      const root = seed.classification.classificationConfidence === 'low' ? `classification.${seed.context.lesson.id}` : null
      const visualIssue = addIssue(issues, {
        detectorId: 18, category: 'inadequate-visual-support', severity: root ? 'medium' : 'high', entityType: 'lesson', entityId: seed.context.lesson.id,
        message: 'El arquetipo calibrado necesita apoyo visual que no consta como listo o aprobado.',
        evidence: [`archetype=${seed.classification.value}`, `classificationMethod=${seed.classification.classificationMethod}`, `readyVisuals=${readyVisuals}`],
        detectionMethod: root ? 'derived-from-another-issue' : 'semantic-rule', confidence: seed.classification.classificationConfidence, scope: 'lesson', rootCauseId: root, reviewStatus: root ? 'needs-human-judgment' : 'likely', actionable: !root,
      })
      entityIssues.push(visualIssue)
    }
    const sourceHistoricalRiskIds = lessonSourceIds(seed.context).filter((id) => (records.get(id)?.knownRisks.length ?? 0) > 0)
    const sourceUncertain = lessonSourceIds(seed.context).some((id) => ['unknown', 'ocr-unverified', 'requires-modern-corroboration'].includes(records.get(id)?.verificationStatus ?? 'unknown'))
    const issueKeys = entityIssues.map(issueId)
    const priority = priorityFor(seed.context, entityIssues, globalIds.filter((id) => id.includes('locale') || id.includes('single') || id.includes('redundant')), unique(seed.context.lesson.authoring?.conceptIds.flatMap((id) => Array(downstream.get(id) ?? 0).fill(id)) ?? []).length, visualRequired && readyVisuals === 0)
    const locale = localeStatus(seed.context)
    return {
      ...baselineRow,
      proposedCurriculumStage: seed.stage.macroStage,
      curriculumCategory: null,
      currentLearningArchetype: baselineRow.recommendedLearningArchetype,
      recommendedLearningArchetype: seed.classification.value,
      declaredPrimarySource: seed.roles.derivedPrimarySourceId,
      secondarySources: unique([...seed.roles.supportingSourceIds, ...seed.roles.contextSourceIds, ...seed.roles.visualInspirationSourceIds, ...seed.roles.identificationDatabaseSourceIds]).filter((id) => id !== seed.roles.derivedPrimarySourceId),
      requiredConcepts: seed.prerequisites.filter(({ required }) => required).map(({ conceptId }) => conceptId),
      prerequisiteProblems: seed.prerequisites.filter(({ classification }) => classification === 'improper').map(({ reason }) => reason),
      improperHigherDependencies: seed.prerequisites.filter(({ classification }) => classification === 'improper').map(({ conceptId }) => conceptId),
      requiredVisuals: semanticVisualRequirements[seed.classification.value],
      currentEvidenceLevel: baselineRow.recommendedEvidenceLevel,
      recommendedEvidenceLevel: seed.evidence.primaryModality,
      executionTier: executionTier(seed.context, seed.classification.value),
      safetyStatus: seed.risk.operationalSafetyStatus,
      historicalStatus: historicalStatus(seed.context, records),
      languageProblems: locale.localeStatus === 'placeholder-duplicated' ? ['global:migration.global.locale-placeholder-en'] : [],
      editorialProblems: unique(entityIssues.map(({ category }) => category)),
      editorialStatus: entityIssues.some(({ reviewStatus }) => reviewStatus === 'needs-source-check') || sourceUncertain ? 'needs-source-review' : entityIssues.length ? 'manual-review' : 'keep',
      recommendedAction: priority.recommendedNextAction,
      priority: priority.level === 'critical' ? 'critical' : priority.level === 'high' ? 'high' : priority.level === 'medium' ? 'medium' : 'low',
      priorityScore: priority.score,
      priorityBreakdown: [
        { reason: 'incidencias confirmadas', points: priority.confirmedIssuePoints },
        { reason: 'incidencias heurísticas', points: priority.heuristicIssuePoints },
      ],
      reason: priority.rationale.join('; '),
      manualReviewRequired: priority.level !== 'no-action' || sourceUncertain,
      macroStage: seed.stage.macroStage,
      trackRole: seed.stage.trackRole,
      ...locale,
      archetypeClassification: seed.classification,
      evidenceProfile: seed.evidence,
      sourceRoles: seed.roles,
      claimAudits: seed.claims,
      prerequisiteAudit: seed.prerequisites,
      operationalRisk: seed.risk,
      sourceHistoricalRiskIds,
      issueIds: issueKeys,
      globalIssueIds: globalIds,
      rootCauseIds: unique(entityIssues.map((issue) => issue.rootCauseId ?? issueId(issue))),
      semanticPriority: priority,
    }
  })

  const finalIssueByEntity = new Map<string, AuditIssue[]>()
  for (const issue of issues) {
    const values = finalIssueByEntity.get(issue.entityId) ?? []
    values.push(issue)
    finalIssueByEntity.set(issue.entityId, values)
  }
  for (const row of activities) {
    const values = finalIssueByEntity.get(row.activityId) ?? []
    row.issueIds = values.map(issueId)
    row.rootCauseIds = unique(values.map((issue) => issue.rootCauseId ?? issueId(issue)))
  }

  const beforeByDetector = new Map(baseline.issuesByDetector.map(({ detectorId, count }) => [detectorId, count]))
  const detectorSummary: DetectorSummary[] = DETECTORS.map(([detectorId, category, title]) => {
    const after = issues.filter((issue) => issue.detectorId === detectorId)
    const migration = global.find((item) => (detectorId === 3 && item.category === 'locale-placeholder-duplicated') || (detectorId === 10 && item.category === 'single-lesson-module') || (detectorId === 11 && item.category === 'redundant-names'))
    return {
      detectorId, category, title, countBefore: beforeByDetector.get(detectorId) ?? 0, countAfter: after.length,
      globalAffectedEntities: migration?.affectedEntities ?? 0,
      confirmed: after.filter(({ reviewStatus }) => reviewStatus === 'confirmed').length,
      likely: after.filter(({ reviewStatus }) => reviewStatus === 'likely').length,
      lowConfidence: after.filter(({ confidence }) => confidence === 'low').length,
      derived: after.filter(({ detectionMethod }) => detectionMethod === 'derived-from-another-issue').length,
      variationReason: migration ? 'Las instancias se agrupan en una migración global y dejan de puntuar por lección.'
        : [8, 13, 14, 15, 16, 17, 18, 22, 23, 24].includes(detectorId) ? 'El detector se recalibró con unidad semántica, contrato, claim o procedimiento.'
          : 'Se conserva la señal baseline con procedencia y confianza explícitas.',
    }
  })
  const calibratedDetectors = new Set([14, 15, 16, 17, 18, 23, 24])
  const falsePositivesEliminated = detectorSummary.filter(({ detectorId }) => calibratedDetectors.has(detectorId)).reduce((sum, value) => sum + Math.max(0, value.countBefore - value.countAfter), 0)
  const falseNegativesDiscovered = issues.filter(({ detectorId, detectionMethod }) => detectorId === 8 && detectionMethod === 'curated-override').length
  const goldEvaluation = evaluateGold(lessons, activities)
  return {
    lessons,
    activities,
    issues: issues.sort((left, right) => left.detectorId - right.detectorId || left.entityId.localeCompare(right.entityId) || left.message.localeCompare(right.message)),
    globalMigrations: global,
    detectorSummary,
    claims: seeded.flatMap(({ claims }) => claims),
    conceptOrigins: [...origins.values()].sort((left, right) => left.conceptId.localeCompare(right.conceptId)),
    goldEvaluation,
    falsePositivesEliminated,
    falseNegativesDiscovered,
  }
}
