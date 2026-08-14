import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { ACADEMY_CURRICULUM } from '../../src/learning/academy/academyCurriculum'
import { segmentLessonBlock } from '../../src/learning/academy/lessonSegmentation'
import {
  AuditIssueSchema,
  type AuditIssue,
  type CurriculumStage,
  type EditorialStatus,
  type EvidenceLevel,
  type ExecutionTier,
  type HistoricalStatus,
  type LearningArchetype,
  type RecommendedAction,
  type SafetyStatus,
  type SourceRecord,
} from '../../src/learning/governance/editorialGovernance'
import type { AcademyCorpus, CorpusActivityContext, CorpusLessonContext } from './corpus'

const execFileAsync = promisify(execFile)

export const DETECTORS = [
  [1, 'empty-markdown-headings', 'Encabezados Markdown vacíos'],
  [2, 'declared-sections-without-content', 'Secciones declaradas sin contenido'],
  [3, 'identical-english-spanish', 'Campos ingleses idénticos al español'],
  [4, 'foreign-lesson-title', 'Título de otra lección dentro del contenido'],
  [5, 'generic-reused-objective', 'Objetivos genéricos reutilizados'],
  [6, 'repeated-paragraph-or-instruction', 'Párrafos o instrucciones repetidos'],
  [7, 'circular-dependency', 'Dependencias circulares'],
  [8, 'higher-level-prerequisite', 'Prerrequisitos de nivel superior'],
  [9, 'recommended-treated-as-required', 'Conceptos recomendados tratados como obligatorios'],
  [10, 'single-lesson-module', 'Módulos con una sola lección'],
  [11, 'redundant-names', 'Nombres redundantes'],
  [12, 'overbroad-citation', 'Citas demasiado amplias'],
  [13, 'numeric-data-without-locator', 'Datos numéricos sin localizador aplicable'],
  [14, 'ocr-formula-unverified', 'Fórmulas OCR sin verificación visual'],
  [15, 'hazardous-historical-procedure', 'Procedimientos históricos peligrosos'],
  [16, 'modern-safety-source-required', 'Procedimientos que necesitan fuente moderna de seguridad'],
  [17, 'physical-skill-digital-only', 'Habilidad física evaluada solo digitalmente'],
  [18, 'inadequate-visual-support', 'Apoyo visual inadecuado para el arquetipo'],
  [19, 'declared-visual-undeveloped', 'Visual declarado sin desarrollar'],
  [20, 'template-conditioned-content', 'Contenido excesivamente condicionado por plantillas'],
  [21, 'automatic-segmentation-break', 'Segmentación automática potencialmente disruptiva'],
  [22, 'calibre-content-general-theory-only', 'Contenido de calibre sustentado solo por teoría general'],
  [23, 'secondary-database-as-official', 'Base secundaria tratada como documentación oficial'],
  [24, 'specialist-work-misclassified-home', 'Trabajo especializado clasificado como doméstico'],
  [25, 'tracked-original-or-extraction', 'Original o extracción rastreado accidentalmente'],
] as const

type DetectorId = (typeof DETECTORS)[number][0]

export interface LessonMatrixRow {
  packageId: string
  packageVersion: string
  routeId: string
  moduleId: string
  lessonId: string
  visibleTitle: string
  currentOrder: number
  routeOrder: number
  moduleOrder: number
  lessonOrder: number
  currentType: string
  proposedCurriculumStage: CurriculumStage
  curriculumCategory: CurriculumStage | null
  currentObservableObjective: string
  objectiveQuality: 'specific-observable' | 'generic' | 'missing-or-unknown'
  currentLearningArchetype: LearningArchetype
  recommendedLearningArchetype: LearningArchetype
  declaredPrimarySource: string | null
  secondarySources: string[]
  currentCitations: string[]
  citationPrecision: 'page-or-figure' | 'chapter-or-section' | 'document' | 'missing'
  requiredConcepts: string[]
  prerequisiteProblems: string[]
  improperHigherDependencies: string[]
  visualCoverage: string
  requiredVisuals: string[]
  currentEvidenceLevel: EvidenceLevel
  recommendedEvidenceLevel: EvidenceLevel
  executionTier: ExecutionTier
  safetyStatus: SafetyStatus
  historicalStatus: HistoricalStatus
  languageProblems: string[]
  editorialProblems: string[]
  editorialStatus: EditorialStatus
  recommendedAction: RecommendedAction
  priority: 'critical' | 'high' | 'medium' | 'low'
  priorityScore: number
  priorityBreakdown: Array<{ reason: string; points: number }>
  reason: string
  manualReviewRequired: boolean
}

export interface ActivityMatrixRow {
  packageId: string
  routeId: string
  moduleId: string
  lessonId: string
  activityId: string
  activityOrder: number
  visibleTitle: string
  practiceType: string
  helpAvailable: string[]
  independentDemonstration: boolean
  transfer: boolean
  retention: boolean
  requestedEvidence: string[]
  impliesPhysicalSkill: boolean
  currentEvidenceLevel: EvidenceLevel
  recommendedEvidenceLevel: EvidenceLevel
  executionTier: ExecutionTier
  risk: SafetyStatus
  objectiveAlignment: 'aligned' | 'partial' | 'unknown'
  recommendedAction: RecommendedAction
  manualReviewRequired: boolean
}

export interface MatrixAnalysis {
  lessons: LessonMatrixRow[]
  activities: ActivityMatrixRow[]
  issues: AuditIssue[]
  issuesByDetector: Array<{
    detectorId: number
    category: string
    title: string
    count: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }>
}

const routePolicy = new Map(ACADEMY_CURRICULUM.map((entry) => [entry.routeId, entry]))
const observableVerb = /^(identificar|explicar|comparar|medir|calcular|diagnosticar|documentar|trazar|montar|desmontar|inspeccionar|seleccionar|justificar|diseñar|validar|clasificar|predecir|reconstruir|evaluar|recognize|identify|explain|compare|measure|calculate|diagnose|document|design|validate)\b/i
const genericObjective = /^(comprender|conocer|aprender|familiarizar|explicar relaciones y estados|relacionar una observaci[oó]n verificable|understand|learn|know)\b/i
const numericUnit = /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|µm|um|nm|hz|vph|a\/h|°|degrees?|n|g|kg|h|ms|s|%|v|a|ohm|ω|bar|atm)\b/i
const formulaPattern = /(?:^|\s)[a-zA-Z]\s*=|=\s*\d|\b(?:cos|sin|tan|ratio|f[oó]rmula|ecuaci[oó]n|m[oó]dulo)\b|[×÷√]/i
const calibrePattern = /\b(?:miyota|eta|seiko|bulova|valjoux|unitas|hamilton|waltham|elgin|calib(?:re|er)\s*[a-z0-9-]+|8215|2035|6497(?:-2)?|2824(?:-2)?|7750|6138a|992b|10ak)\b/i
const dangerousPatterns: Array<[string, RegExp]> = [
  ['cyanide', /cianuro|cyanide/i],
  ['carbon-tetrachloride', /tetracloruro|carbon tetrachloride/i],
  ['strong-acid', /[aá]cido sulf[uú]rico|sulphuric acid|sulfuric acid/i],
  ['radioactive-luminous-material', /radioactiv|radium|luminous paint|pintura luminosa/i],
  ['lead-heavy-metal', /\bplomo\b|\blead\b|mercur/i],
  ['open-flame-heat', /llama|blow ?torch|alcohol lamp|tempering|hardening|calentar|dull red heat/i],
  ['volatile-solvent', /tetracloruro|benzene|naphtha|gasoline|amoniaco concentrado/i],
  ['electroplating', /galvanoplast|electro-?gild|electroplat/i],
]

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim()
}

function lessonBody(context: CorpusLessonContext): string {
  return context.lesson.blockIds.map((blockId) => context.pack.blocks.find(({ id }) => id === blockId)?.bodyMarkdown ?? '').join('\n\n')
}

function localizedIdentical(es: string | undefined, en: string | undefined): boolean {
  return Boolean(es && en && normalizeText(es) === normalizeText(en))
}

function lessonSourceIds(context: CorpusLessonContext): string[] {
  return [...new Set([
    ...(context.lesson.authoring?.sourceIds ?? []),
    ...context.lesson.blockIds.flatMap((blockId) => context.pack.blocks.find(({ id }) => id === blockId)?.claims
      .flatMap(({ sources }) => sources.map(({ id }) => id)) ?? []),
  ])]
}

function lessonCitations(context: CorpusLessonContext): string[] {
  const values = context.lesson.blockIds.flatMap((blockId) => context.pack.blocks.find(({ id }) => id === blockId)?.claims
    .flatMap(({ sources }) => sources.map((source) => {
      const locators = [source.page ? `p.${source.page}` : '', source.figure ? `fig.${source.figure}` : '', source.chapter ?? source.region ?? ''].filter(Boolean)
      return `${source.id}${locators.length ? ` [${locators.join('; ')}]` : ''}`
    })) ?? [])
  return [...new Set(values)].sort()
}

function stageFor(context: CorpusLessonContext): CurriculumStage {
  const routeId = context.route.id
  const text = normalizeText(`${context.lesson.title} ${context.module.title.es}`)
  if (routeId === 'route.miyota8215.complete') return '4-work-on-real-calibre'
  if (routeId === 'route.quartz2035.isa-to-2035') return '4-work-on-real-calibre'
  if (/bench-foundations|workshop-tools-materials/.test(routeId)) return '0-prepare-bench-and-control'
  if (/orientation|history-language/.test(routeId)) return '1-understand-watch-as-system'
  if (/metrology|service-tribology/.test(routeId) || /inspeccion|diagnost|medicion|metrolog/.test(text)) return '3-observe-measure-diagnose'
  if (/architecture-capstone|acquired-movement|external-components/.test(context.lesson.id)) return '5-build-complete-watch'
  if (/mechanical\.foundations|mechanical-energy-trains|escapements-chronometry|complications|quartz-electronics/.test(routeId)) return '2-understand-mechanical-systems'
  if (/reloj completo|complete watch|integracion final|montaje completo/.test(text)) return '5-build-complete-watch'
  if (/micromechanics|manufacturing-finishing|dials-hands-finishing|cases-water|restoration|comparative-atlas|service-method/.test(routeId)) return '6-repair-adapt-manufacture-components'
  if (/personal-watch-design|watch-validation|architectures-complications/.test(routeId)) return '7-design-validate-own-watch-or-movement'
  return '1-understand-watch-as-system'
}

function categoryFor(context: CorpusLessonContext): CurriculumStage | null {
  const policy = routePolicy.get(context.route.id)
  if (policy?.role === 'specialization') return 'specialization'
  if (policy?.role === 'enrichment') return 'enrichment'
  if (/history|historical|historia/.test(normalizeText(`${context.route.id} ${context.lesson.title}`))) return 'historical-case'
  return null
}

function hasContract(context: CorpusLessonContext, key: 'manufacturingContract' | 'personalWatchDesignContract' | 'validationContract' | 'serviceProcedureContract' | 'calibreLabContract'): boolean {
  return context.lesson.activityIds.some((activityId) => Boolean(context.pack.activities.find(({ id }) => id === activityId)?.authoring?.[key]))
}

function inferArchetype(context: CorpusLessonContext): LearningArchetype {
  const text = normalizeText(`${context.lesson.title} ${context.module.title.es} ${context.route.title.es}`)
  if (hasContract(context, 'personalWatchDesignContract')) return 'design'
  if (hasContract(context, 'validationContract')) return 'capstone-project'
  if (hasContract(context, 'manufacturingContract')) return 'manufacturing'
  if (hasContract(context, 'serviceProcedureContract')) return 'calibre-service'
  if (hasContract(context, 'calibreLabContract')) return 'calibre-service'
  if (/diagnost|fault|averia|problemas y soluciones/.test(text)) return 'diagnosis-case'
  if (/inspeccion|inspection/.test(text)) return 'inspection'
  if (/metrolog|medicion|measure|timing|rating|presion/.test(text)) return 'measurement'
  if (/calcul|formula|relacion|tolerancia/.test(text)) return 'calculation'
  if (/historia|histor|comparacion/.test(text)) return 'historical-comparison'
  if (/herramient|banco|workshop|limpieza|montaje|desmontaje|procedim/.test(text)) return 'bench-procedure'
  if (/anatom|piezas|nomenclatura|arquitectura/.test(text)) return 'visual-anatomy'
  if (/diseno|diseñ|layout|proyecto/.test(text)) return 'design'
  if (/sistema|mapa funcional|orientation/.test(text)) return 'system-overview'
  return 'mechanism-explanation'
}

function recommendedArchetype(context: CorpusLessonContext, current: LearningArchetype): LearningArchetype {
  const text = normalizeText(`${context.lesson.title} ${lessonBody(context)}`)
  if (context.route.id === 'route.miyota8215.complete') return /diagnost/.test(text) ? 'diagnosis-case' : 'calibre-service'
  if (/fabricar|mecanizar|torno|lathe|hacer componente|manufactur/.test(text)) return 'manufacturing'
  if (/destreza|control de herramienta|poising|truing|ajuste manual/.test(text)) return 'psychomotor-skill'
  return current
}

const archetypeVisuals: Record<LearningArchetype, string[]> = {
  'system-overview': ['system map with inputs, subsystems, and outputs'],
  'mechanism-explanation': ['causal schematic or state animation'],
  'visual-anatomy': ['annotated anatomy or exploded view'],
  'bench-procedure': ['step sequence with tool, holding point, and stop condition'],
  'psychomotor-skill': ['multi-angle physical demonstration and reviewed result'],
  inspection: ['scaled defect imagery and observation conditions'],
  'diagnosis-case': ['evidence trail, hypothesis table, and decision graph'],
  measurement: ['instrument view, datum, units, and uncertainty'],
  calculation: ['verified equation layout and worked diagram'],
  manufacturing: ['dimensioned drawing, workholding, and operation states'],
  design: ['layout drawing, dependency graph, and validation criteria'],
  'historical-comparison': ['dated side-by-side comparison with current-status labels'],
  'calibre-service': ['official exploded view and calibre-specific sequence'],
  'capstone-project': ['design dossier, measured evidence, and review checkpoints'],
}

function activityEvidence(context: CorpusActivityContext): EvidenceLevel {
  const templates = context.activity.evidenceTemplateIds.map((id) => context.pack.evidenceTemplates.find((template) => template.id === id)).filter((value) => value !== undefined)
  if (templates.some(({ kind }) => kind === 'human-review' || kind === 'artifact')) return 'R'
  const level = context.activity.authoring?.pedagogicalContract?.evidenceLevel
  if (level === 'physical-observation') return 'P'
  if (level === 'guided-simulation' || level === 'independent-simulation') return 'V'
  return 'K'
}

const evidenceRank: Record<EvidenceLevel, number> = { K: 0, V: 1, P: 2, R: 3 }

function lessonEvidence(context: CorpusLessonContext): EvidenceLevel {
  const values = context.lesson.activityIds.map((activityId) => {
    const activity = context.pack.activities.find(({ id }) => id === activityId)
    return activity ? activityEvidence({ ...context, activity, activityOrder: 1 }) : 'K'
  })
  return values.sort((left, right) => evidenceRank[right] - evidenceRank[left])[0] ?? 'K'
}

function recommendedEvidence(archetype: LearningArchetype): EvidenceLevel {
  if (['psychomotor-skill', 'bench-procedure', 'calibre-service'].includes(archetype)) return 'P'
  if (['inspection', 'diagnosis-case', 'measurement', 'calculation', 'manufacturing', 'design', 'capstone-project'].includes(archetype)) return 'R'
  if (['mechanism-explanation', 'visual-anatomy'].includes(archetype)) return 'V'
  return 'K'
}

function impliesPhysical(context: CorpusActivityContext): boolean {
  const authoring = context.activity.authoring
  const competencies = context.activity.competencyIds.map((id) => context.pack.competencies.find((value) => value.id === id)).filter((value) => value !== undefined)
  return Boolean(authoring?.manufacturingContract
    || authoring?.serviceProcedureContract
    || authoring?.calibreLabContract
    || competencies.some(({ authoring: metadata }) => metadata && ['procedure', 'measurement'].includes(metadata.skillType))
    || /montar|desmontar|fabricar|mecanizar|torno|medir|ajustar|pulir|limpiar|jewel|poising|truing/i.test(`${context.activity.title} ${authoring?.title.es ?? ''}`))
}

function executionTierForText(text: string, physical: boolean): ExecutionTier {
  if (!physical) return 'simulation'
  if (/mercur|cyanide|cianuro|radioactiv|galvanoplast|electroplat/i.test(text)) return 'professional-or-outsourced'
  if (/torno|lathe|mecaniz|fresad|drill|taladr|acid|[aá]cido|flame|llama|heat|templad|presi[oó]n/i.test(text)) return 'specialist-workshop'
  return 'home-bench'
}

function activityExecutionTier(context: CorpusActivityContext): ExecutionTier {
  const text = `${context.activity.title} ${context.activity.authoring?.description.es ?? ''} ${(context.activity.authoring?.warnings.es ?? []).join(' ')}`
  return executionTierForText(text, impliesPhysical(context))
}

function lessonExecutionTier(context: CorpusLessonContext): ExecutionTier {
  const tiers = context.lesson.activityIds.map((activityId) => {
    const activity = context.pack.activities.find(({ id }) => id === activityId)
    return activity ? activityExecutionTier({ ...context, activity, activityOrder: 1 }) : 'simulation'
  })
  const rank: Record<ExecutionTier, number> = { simulation: 0, 'home-bench': 1, 'specialist-workshop': 2, 'professional-or-outsourced': 3 }
  return tiers.sort((left, right) => rank[right] - rank[left])[0] ?? 'simulation'
}

function detectedHazards(text: string): string[] {
  return dangerousPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}

function safetyFor(context: CorpusLessonContext, sources: SourceRecord[]): SafetyStatus {
  const hazards = detectedHazards(lessonBody(context))
  const sourceRisks = sources.flatMap(({ knownRisks }) => knownRisks)
  if ([...hazards, ...sourceRisks].some((value) => /cyanide|tetrachloride|radioactive|mercury|lead-heavy|prohibited/i.test(value))) return 'prohibited-in-academy'
  if (sources.some(({ historicalStatus }) => historicalStatus === 'historical-non-actionable') || hazards.length > 0) return 'historical-non-actionable'
  const tier = lessonExecutionTier(context)
  if (tier === 'professional-or-outsourced') return 'supervised'
  if (tier === 'specialist-workshop') return 'caution'
  return 'normal'
}

function historyFor(sources: SourceRecord[]): HistoricalStatus {
  if (sources.some(({ historicalStatus }) => historicalStatus === 'historical-non-actionable')) return 'historical-non-actionable'
  if (sources.some(({ historicalStatus }) => historicalStatus === 'historical-context')) {
    return sources.some(({ historicalStatus }) => historicalStatus === 'current') ? 'mixed' : 'historical-context'
  }
  if (sources.some(({ historicalStatus }) => historicalStatus === 'mixed')) return 'mixed'
  if (sources.some(({ historicalStatus }) => historicalStatus === 'current')) return 'current'
  return 'unknown'
}

function emptyHeadings(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/)
  const empty: string[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/)
    if (!heading) continue
    const level = heading[1].length
    let hasContent = false
    for (let next = index + 1; next < lines.length; next += 1) {
      const nextHeading = lines[next].match(/^(#{1,6})\s+/)
      if (nextHeading && nextHeading[1].length <= level) break
      if (lines[next].trim() && !nextHeading) hasContent = true
    }
    if (!hasContent) empty.push(heading[2])
  }
  return empty
}

function paragraphs(markdown: string): string[] {
  return markdown.split(/\n{2,}/).map((value) => normalizeText(value.replace(/^#{1,6}\s+.+$/gm, ''))).filter((value) => value.length >= 180)
}

function graphCycles(graph: Map<string, string[]>): string[][] {
  const state = new Map<string, 0 | 1 | 2>()
  const stack: string[] = []
  const cycles = new Map<string, string[]>()
  const visit = (node: string) => {
    if (state.get(node) === 2) return
    if (state.get(node) === 1) {
      const index = stack.indexOf(node)
      const cycle = [...stack.slice(index), node]
      const key = [...new Set(cycle)].sort().join('|')
      cycles.set(key, cycle)
      return
    }
    state.set(node, 1)
    stack.push(node)
    for (const next of graph.get(node) ?? []) visit(next)
    stack.pop()
    state.set(node, 2)
  }
  for (const node of graph.keys()) visit(node)
  return [...cycles.values()].sort((left, right) => left.join().localeCompare(right.join()))
}

async function trackedAssetLeaks(repositoryRoot: string): Promise<string[]> {
  const { stdout } = await execFileAsync('git', ['ls-files'], { cwd: repositoryRoot, maxBuffer: 10 * 1024 * 1024 })
  const tracked = stdout.split(/\r?\n/).filter(Boolean)
  const originalNames = new Set([
    'Chicago CD.iso',
    'Horologia_completa_OCR_ligera_100MB.pdf',
    'Joseph Bulova School of Watch Making.pdf',
    'TM 9-1575.pdf',
    'Theory of Horology-20260809T132232Z-1-001.zip',
    'VBAUhrentechnik.zip',
  ])
  const leaks = tracked.filter((path) => path.startsWith('.cache/reference-audit/')
    || (/^(?:public|learning-content)\//.test(path) && /\.(?:pdf|iso|docx?|tiff?|zip)$/i.test(path))
    || (!path.startsWith('reference-library/originals/') && originalNames.has(path.split('/').at(-1) ?? '')))
  const attributes = await readFile(join(repositoryRoot, '.gitattributes'), 'utf8')
  if (!/reference-library\/originals\/\*\*\s+filter=lfs/.test(attributes)) {
    leaks.push('reference-library/originals/** (missing Git LFS protection)')
  }
  return [...new Set(leaks)].sort()
}

function priorityFor(context: CorpusLessonContext, issues: AuditIssue[]): { score: number; breakdown: Array<{ reason: string; points: number }> } {
  const breakdown: Array<{ reason: string; points: number }> = []
  const add = (reason: string, points: number) => breakdown.push({ reason, points })
  const severityPoints = { critical: 25, high: 12, medium: 6, low: 3, info: 1 }
  const issuePoints = issues.reduce((total, issue) => total + severityPoints[issue.severity], 0)
  if (issuePoints) add('incidencias ponderadas', Math.min(60, issuePoints))
  if (context.globalOrder <= 12) add('primeras experiencias del principiante', 20)
  if (/bench-foundations|workshop-tools-materials/.test(context.route.id)) add('banco y herramientas', 18)
  if (/mechanical\.foundations|mechanical-energy-trains|escapements-chronometry/.test(context.route.id)) add('fundamentos mecánicos', 16)
  if (context.route.id === 'route.miyota8215.complete') add('MIYOTA 8215', 18)
  const text = normalizeText(`${context.lesson.title} ${context.module.title.es}`)
  if (/inspeccion/.test(text)) add('inspección', 16)
  if (/diagnost/.test(text)) add('diagnóstico', 15)
  if (/reloj completo|montaje completo|integracion final/.test(text)) add('montaje de un reloj completo', 14)
  if (/donant|donor/.test(text)) add('piezas donantes', 10)
  if (/fabric|mecaniz|turning|torno/.test(text) || /manufacturing/.test(context.route.id)) add('fabricación', 15)
  if (/diseñ|diseno|design/.test(text) || /personal-watch-design/.test(context.route.id)) add('diseño propio', 15)
  breakdown.sort((left, right) => right.points - left.points || left.reason.localeCompare(right.reason))
  return { score: breakdown.reduce((total, item) => total + item.points, 0), breakdown }
}

function actionFor(issues: AuditIssue[], safety: SafetyStatus): RecommendedAction {
  if (safety === 'prohibited-in-academy' || issues.some(({ detectorId }) => [14, 15, 16, 22, 23, 24].includes(detectorId))) return 'manual-review'
  if (issues.some(({ detectorId }) => detectorId === 21)) return 'split'
  if (issues.length === 0) return 'keep'
  return 'edit'
}

function editorialStatusFor(issues: AuditIssue[], safety: SafetyStatus): EditorialStatus {
  if (safety === 'prohibited-in-academy') return 'blocked'
  if (issues.some(({ detectorId }) => [15, 16].includes(detectorId))) return 'needs-safety-review'
  if (issues.some(({ detectorId }) => [12, 13, 14, 22, 23].includes(detectorId))) return 'needs-source-review'
  if (issues.some(({ detectorId }) => [18, 19].includes(detectorId))) return 'needs-visual-review'
  if (issues.length > 0) return 'needs-edit'
  return 'keep'
}

function addIssue(target: AuditIssue[], detectorId: DetectorId, severity: AuditIssue['severity'], entityType: AuditIssue['entityType'], entityId: string, message: string, evidence: string[] = []): void {
  const detector = DETECTORS.find(([id]) => id === detectorId)
  if (!detector) throw new Error(`Detector desconocido: ${detectorId}`)
  const parsed = AuditIssueSchema.parse({
    detectorId,
    category: detector[1],
    severity,
    entityType,
    entityId,
    message,
    evidence,
    manualReviewRequired: true,
  })
  // 0.14A is an immutable baseline. Keep its serialized issue shape while the
  // extended schema supplies defaults to the parallel 0.14A.1 pipeline.
  target.push({
    detectorId: parsed.detectorId,
    category: parsed.category,
    severity: parsed.severity,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    message: parsed.message,
    evidence: parsed.evidence,
    manualReviewRequired: true,
  } as AuditIssue)
}

export async function analyzeMatrices(repositoryRoot: string, corpus: AcademyCorpus, sourceRecords: SourceRecord[]): Promise<MatrixAnalysis> {
  const recordsById = new Map(sourceRecords.map((record) => [record.sourceId, record]))
  const lessonSeeds = corpus.lessons.map((context) => ({
    context,
    body: lessonBody(context),
    sourceIds: lessonSourceIds(context),
    objective: context.lesson.authoring?.objectives[0]?.es ?? context.lesson.authoring?.purpose.es ?? '',
  }))
  const objectiveFrequency = new Map<string, number>()
  const paragraphOwners = new Map<string, Set<string>>()
  for (const seed of lessonSeeds) {
    const objective = normalizeText(seed.objective)
    if (objective) objectiveFrequency.set(objective, (objectiveFrequency.get(objective) ?? 0) + 1)
    for (const paragraph of paragraphs(seed.body)) {
      const owners = paragraphOwners.get(paragraph) ?? new Set<string>()
      owners.add(seed.context.lesson.id)
      paragraphOwners.set(paragraph, owners)
    }
  }
  const lessonTitles = lessonSeeds.map(({ context }) => ({ id: context.lesson.id, normalized: normalizeText(context.lesson.authoring?.title.es ?? context.lesson.title) }))
  const conceptById = new Map(corpus.packs.flatMap(({ pack }) => pack.concepts.map((concept) => [concept.id, concept] as const)))
  const routeOrder = new Map(ACADEMY_CURRICULUM.map(({ routeId, order }) => [routeId, order]))
  const issues: AuditIssue[] = []

  for (const seed of lessonSeeds) {
    const { context, body, sourceIds, objective } = seed
    const lessonId = context.lesson.id
    const empty = emptyHeadings(body)
    if (empty.length) addIssue(issues, 1, 'high', 'lesson', lessonId, 'La lección contiene encabezados sin contenido verificable.', empty.slice(0, 8))

    const segments = context.lesson.blockIds.flatMap((blockId) => segmentLessonBlock(blockId, context.pack.blocks.find(({ id }) => id === blockId)?.bodyMarkdown ?? ''))
    const requiredRoles = context.lesson.authoring?.studyContract?.requiredSegmentRoles ?? []
    const segmentRoles = new Set(segments.map(({ role }) => role))
    const missingRoles = requiredRoles.filter((role) => !segmentRoles.has(role))
    if (missingRoles.length) addIssue(issues, 2, 'high', 'lesson', lessonId, 'El contrato de estudio declara secciones que la segmentación actual no encuentra.', missingRoles)

    const languageProblems: string[] = []
    const metadata = context.lesson.authoring
    if (metadata) {
      if (localizedIdentical(metadata.title.es, metadata.title.en)) languageProblems.push('lesson.title')
      if (localizedIdentical(metadata.purpose.es, metadata.purpose.en)) languageProblems.push('lesson.purpose')
      metadata.objectives.forEach((value, index) => {
        if (localizedIdentical(value.es, value.en)) languageProblems.push(`lesson.objectives[${index}]`)
      })
    }
    for (const activityId of context.lesson.activityIds) {
      const activity = context.pack.activities.find(({ id }) => id === activityId)
      if (localizedIdentical(activity?.authoring?.title.es, activity?.authoring?.title.en)) languageProblems.push(`${activityId}.title`)
      if (localizedIdentical(activity?.authoring?.description.es, activity?.authoring?.description.en)) languageProblems.push(`${activityId}.description`)
    }
    if (languageProblems.length) addIssue(issues, 3, 'medium', 'lesson', lessonId, 'Campos localizados en inglés repiten literalmente el español.', languageProblems.slice(0, 12))

    const normalizedBody = normalizeText(body)
    const foreignTitles = lessonTitles.filter(({ id, normalized }) => id !== lessonId && normalized.length >= 18 && normalizedBody.includes(normalized)).map(({ id }) => id)
    if (foreignTitles.length) addIssue(issues, 4, 'medium', 'lesson', lessonId, 'El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla.', foreignTitles.slice(0, 8))

    const objectiveKey = normalizeText(objective)
    if (!objective || genericObjective.test(objective.trim()) || (objectiveFrequency.get(objectiveKey) ?? 0) >= 3) {
      addIssue(issues, 5, 'high', 'lesson', lessonId, 'El objetivo es genérico, no observable o se reutiliza de forma extensa.', objective ? [`repeticiones=${objectiveFrequency.get(objectiveKey) ?? 1}`] : ['objetivo ausente'])
    }

    const repeatedParagraphs = paragraphs(body).filter((paragraph) => (paragraphOwners.get(paragraph)?.size ?? 0) >= 3)
    if (repeatedParagraphs.length) {
      const hashes = repeatedParagraphs.slice(0, 8).map((paragraph) => `sha256:${createHash('sha256').update(paragraph).digest('hex').slice(0, 16)} owners=${paragraphOwners.get(paragraph)?.size ?? 0}`)
      addIssue(issues, 6, 'medium', 'lesson', lessonId, 'La lección comparte párrafos o instrucciones extensos con otras lecciones.', hashes)
    }

    const required = new Set(context.lesson.authoring?.prerequisiteConceptIds ?? [])
    const recommended = context.lesson.authoring?.recommendedPrerequisiteConceptIds ?? []
    const overlap = recommended.filter((id) => required.has(id))
    if (overlap.length) addIssue(issues, 9, 'high', 'lesson', lessonId, 'Conceptos recomendados aparecen también como obligatorios.', overlap)

    if (context.module.lessonIds.length === 1) addIssue(issues, 10, 'info', 'module', context.module.id, 'El módulo visible contiene una sola lección.', [lessonId])
    const moduleName = normalizeText(context.module.title.es)
    const lessonName = normalizeText(context.lesson.authoring?.title.es ?? context.lesson.title)
    if (moduleName === lessonName || (moduleName.length >= 12 && (moduleName.includes(lessonName) || lessonName.includes(moduleName)))) {
      addIssue(issues, 11, 'low', 'lesson', lessonId, 'Los nombres de módulo y lección son redundantes.', [context.module.title.es, context.lesson.authoring?.title.es ?? context.lesson.title])
    }

    const records = sourceIds.map((id) => recordsById.get(id)).filter((value) => value !== undefined)
    const broad = records.filter(({ citationPrecision }) => citationPrecision !== 'page-or-figure').map(({ sourceId, citationPrecision }) => `${sourceId}:${citationPrecision}`)
    if (broad.length) addIssue(issues, 12, 'medium', 'lesson', lessonId, 'Una o más fuentes se citan a nivel de capítulo, documento o sin localizador.', broad.slice(0, 12))

    const hasNumeric = numericUnit.test(body) || formulaPattern.test(body)
    if (hasNumeric && !records.some(({ citationPrecision }) => citationPrecision === 'page-or-figure')) {
      addIssue(issues, 13, 'high', 'lesson', lessonId, 'Hay datos numéricos o relaciones cuantitativas sin página, figura o tabla aplicable.', ['numeric-or-formula-pattern=true'])
    }
    const ocrFormulaSources = records.filter(({ sourceId, verificationStatus }) => /daniels|horologia|vba-uhrentechnik/.test(sourceId) && verificationStatus !== 'visually-verified')
    if (formulaPattern.test(body) && ocrFormulaSources.length) {
      addIssue(issues, 14, 'critical', 'lesson', lessonId, 'Una fórmula vinculada a material OCR no consta como verificada visualmente.', ocrFormulaSources.map(({ sourceId, verificationStatus }) => `${sourceId}:${verificationStatus}`))
    }

    const hazards = detectedHazards(body)
    const historicalHazards = records.flatMap(({ citationVariants }) => citationVariants.flatMap(({ historicalSafety }) => historicalSafety?.hazardTopics ?? []))
      .filter((value) => /cyanide|tetrachloride|acid|mercur|radioactive|lead|flame|heat|chemical|toxic/i.test(value))
    if (hazards.length || historicalHazards.length) {
      addIssue(issues, 15, 'critical', 'lesson', lessonId, 'La lección o sus fuentes contienen un procedimiento histórico peligroso; no debe convertirse en instrucción accionable.', [...new Set([...hazards, ...historicalHazards])].slice(0, 12))
    }
    const currentSafetyAuthority = records.some(({ editorialFunction, historicalStatus }) => editorialFunction === 'A-manufacturer-official' && historicalStatus === 'current')
      || records.some(({ sourceType, historicalStatus }) => /safety|standard|guidance/.test(sourceType) && historicalStatus === 'current')
    const unreviewedHistoricalSafety = records.some(({ citationVariants }) => citationVariants.some(({ historicalSafety }) => historicalSafety && !historicalSafety.reviewedAgainstModernGuidance))
    if ((hazards.length || historicalHazards.length || unreviewedHistoricalSafety)
      && ['bench-procedure', 'psychomotor-skill', 'manufacturing', 'calibre-service'].includes(recommendedArchetype(context, inferArchetype(context)))
      && !currentSafetyAuthority) {
      addIssue(issues, 16, 'critical', 'lesson', lessonId, 'El procedimiento necesita una fuente moderna de seguridad antes de cualquier uso operativo.', ['current-safety-authority=false'])
    }

    const visualIds = context.lesson.authoring?.visualResourceIds ?? []
    const visuals = visualIds.map((id) => context.pack.visualResources.find((resource) => resource.id === id)).filter((value) => value !== undefined)
    const archetype = recommendedArchetype(context, inferArchetype(context))
    const adequateVisual = visuals.some(({ status, currentModelSupport }) => ['ready', 'approved'].includes(status) && currentModelSupport !== 'no')
    if (archetypeVisuals[archetype].length > 0 && !adequateVisual) {
      addIssue(issues, 18, 'high', 'lesson', lessonId, 'No hay un visual listo o aprobado adecuado al arquetipo recomendado.', archetypeVisuals[archetype])
    }
    const undeveloped = visuals.filter(({ status, currentModelSupport }) => ['planned', 'blocked'].includes(status) || currentModelSupport === 'no').map(({ id, status, currentModelSupport }) => `${id}:${status}/${currentModelSupport}`)
    if (undeveloped.length) addIssue(issues, 19, 'high', 'lesson', lessonId, 'Hay visuales declarados que siguen planificados, bloqueados o sin soporte de modelo.', undeveloped)

    if (repeatedParagraphs.length >= 2 || (objectiveFrequency.get(objectiveKey) ?? 0) >= 4 || /para comprender .* sigue energia senal o movimiento/.test(normalizedBody)) {
      addIssue(issues, 20, 'high', 'lesson', lessonId, 'La densidad de texto reutilizado indica una plantilla que puede dominar la explicación específica.', [`repeatedParagraphs=${repeatedParagraphs.length}`, `objectiveFrequency=${objectiveFrequency.get(objectiveKey) ?? 0}`])
    }
    const continuationSegments = segments.filter(({ sectionTitles }) => sectionTitles.some((title) => /continuaci[oó]n/i.test(title)))
    if (continuationSegments.length) addIssue(issues, 21, 'medium', 'lesson', lessonId, 'La segmentación automática divide una sección larga en continuaciones que requieren revisión de unidad conceptual.', continuationSegments.map(({ id }) => id))

    const calibreFocused = /miyota8215|quartz2035/.test(context.route.id)
      || calibrePattern.test(`${context.lesson.title} ${context.module.title.es}`)
      || recommendedArchetype(context, inferArchetype(context)) === 'calibre-service'
    if (calibreFocused
      && records.length > 0
      && !records.some(({ editorialFunction }) => editorialFunction === 'A-manufacturer-official')) {
      addIssue(issues, 22, 'high', 'lesson', lessonId, 'El contenido menciona un calibre pero no declara documentación oficial de fabricante.', sourceIds.slice(0, 12))
    }
    const primary = records[0]
    if (hasNumeric && primary?.editorialFunction === 'H-reference-database') {
      addIssue(issues, 23, 'critical', 'lesson', lessonId, 'Una base secundaria ocupa la posición de fuente principal para un dato técnico.', [primary.sourceId])
    }

    const tier = lessonExecutionTier(context)
    if (tier === 'home-bench' && /torno|lathe|mecaniz|fresad|[aá]cido|flame|llama|galvanoplast|pressure test|prueba de presion/i.test(body)) {
      addIssue(issues, 24, 'critical', 'lesson', lessonId, 'Una operación inferida como doméstica contiene señales de taller especializado.', ['executionTier=home-bench'])
    }
  }

  const conceptGraph = new Map(corpus.packs.flatMap(({ pack }) => pack.concepts.map(({ id, prerequisiteIds }) => [id, prerequisiteIds] as const)))
  for (const cycle of graphCycles(conceptGraph)) addIssue(issues, 7, 'critical', 'concept', cycle[0], 'El grafo de conceptos contiene una dependencia circular.', cycle)
  const routeGraph = new Map(ACADEMY_CURRICULUM.map(({ routeId, prerequisiteRouteIds }) => [routeId, prerequisiteRouteIds]))
  for (const cycle of graphCycles(routeGraph)) addIssue(issues, 7, 'critical', 'route', cycle[0], 'El grafo curricular contiene una dependencia circular.', cycle)

  for (const { context } of lessonSeeds) {
    const currentOrder = routeOrder.get(context.route.id) ?? Number.MAX_SAFE_INTEGER
    const higher = (context.lesson.authoring?.prerequisiteConceptIds ?? []).flatMap((conceptId) => {
      const concept = conceptById.get(conceptId)
      const higherRoutes = concept?.routeIds.filter((routeId) => (routeOrder.get(routeId) ?? currentOrder) > currentOrder) ?? []
      return higherRoutes.map((routeId) => `${conceptId} -> ${routeId}`)
    })
    if (higher.length) addIssue(issues, 8, 'high', 'lesson', context.lesson.id, 'La lección exige conceptos cuya ruta se sitúa después en el recorrido actual.', higher)
  }

  for (const context of corpus.activities) {
    const current = activityEvidence(context)
    if (impliesPhysical(context) && ['K', 'V'].includes(current)) {
      addIssue(issues, 17, 'critical', 'activity', context.activity.id, 'La actividad afirma o implica una destreza física, pero solo solicita evidencia de conocimiento o simulación.', [`currentEvidence=${current}`])
    }
  }

  const leaks = await trackedAssetLeaks(repositoryRoot)
  for (const leak of leaks) addIssue(issues, 25, 'critical', 'asset', leak, 'Se detectó un original o una extracción fuera de la política de trazabilidad.', [leak])

  issues.sort((left, right) => left.detectorId - right.detectorId || left.entityId.localeCompare(right.entityId) || left.message.localeCompare(right.message))
  const issuesByEntity = new Map<string, AuditIssue[]>()
  for (const issue of issues) {
    const values = issuesByEntity.get(issue.entityId) ?? []
    values.push(issue)
    issuesByEntity.set(issue.entityId, values)
  }

  const activities: ActivityMatrixRow[] = corpus.activities.map((context) => {
    const authoring = context.activity.authoring
    const contract = authoring?.pedagogicalContract
    const current = activityEvidence(context)
    const physical = impliesPhysical(context)
    const archetype = recommendedArchetype(context, inferArchetype(context))
    const requestedEvidence = context.activity.evidenceTemplateIds.map((id) => context.pack.evidenceTemplates.find((value) => value.id === id)).filter((value) => value !== undefined).map(({ id, kind }) => `${id}:${kind}`)
    const lessonConcepts = new Set(context.lesson.authoring?.conceptIds ?? [])
    const activityConcepts = [...new Set([...(contract?.requiresConceptIds ?? []), ...(contract?.practicesConceptIds ?? []), ...(contract?.assessesConceptIds ?? [])])]
    const matching = activityConcepts.filter((id) => lessonConcepts.has(id)).length
    const entityIssues = issuesByEntity.get(context.activity.id) ?? []
    const risk = safetyFor(context, lessonSourceIds(context).map((id) => recordsById.get(id)).filter((value) => value !== undefined))
    return {
      packageId: context.packageId,
      routeId: context.route.id,
      moduleId: context.module.id,
      lessonId: context.lesson.id,
      activityId: context.activity.id,
      activityOrder: context.activityOrder,
      visibleTitle: authoring?.title.es ?? context.activity.title,
      practiceType: `${authoring?.activityType ?? 'unknown'} / ${contract?.purpose ?? 'undeclared'}`,
      helpAvailable: [
        ...((authoring?.interactionContract?.hints.length ?? 0) > 0 ? [`graduated-hints:${authoring?.interactionContract?.hints.length ?? 0}`] : []),
        ...(contract?.supportLevel ? [`support:${contract.supportLevel}`] : []),
        ...(authoring?.deliberatePractice ? ['worked-example', 'graduated-attempts'] : []),
      ],
      independentDemonstration: contract?.assessmentIntent === 'demonstration' && contract.supportLevel === 'independent',
      transfer: contract?.purpose === 'transfer',
      retention: contract?.purpose === 'retention',
      requestedEvidence,
      impliesPhysicalSkill: physical,
      currentEvidenceLevel: current,
      recommendedEvidenceLevel: physical ? (['manufacturing', 'design', 'capstone-project', 'measurement', 'diagnosis-case'].includes(archetype) ? 'R' : 'P') : recommendedEvidence(archetype),
      executionTier: activityExecutionTier(context),
      risk,
      objectiveAlignment: activityConcepts.length === 0 ? 'unknown' : matching === activityConcepts.length ? 'aligned' : matching > 0 ? 'partial' : 'unknown',
      recommendedAction: entityIssues.length ? 'manual-review' : 'keep',
      manualReviewRequired: entityIssues.length > 0 || physical,
    }
  })

  const lessons: LessonMatrixRow[] = lessonSeeds.map(({ context, sourceIds, objective }) => {
    const entityIssues = [
      ...(issuesByEntity.get(context.lesson.id) ?? []),
      ...(issuesByEntity.get(context.module.id) ?? []),
      ...context.lesson.activityIds.flatMap((id) => issuesByEntity.get(id) ?? []),
    ]
    const records = sourceIds.map((id) => recordsById.get(id)).filter((value) => value !== undefined)
    const currentArchetype = inferArchetype(context)
    const recommended = recommendedArchetype(context, currentArchetype)
    const visualIds = context.lesson.authoring?.visualResourceIds ?? []
    const visuals = visualIds.map((id) => context.pack.visualResources.find((value) => value.id === id)).filter((value) => value !== undefined)
    const current = lessonEvidence(context)
    const safety = safetyFor(context, records)
    const priority = priorityFor(context, entityIssues)
    const objectiveKey = normalizeText(objective)
    const objectiveQuality: LessonMatrixRow['objectiveQuality'] = !objective ? 'missing-or-unknown'
      : genericObjective.test(objective.trim()) || (objectiveFrequency.get(objectiveKey) ?? 0) >= 3 || !observableVerb.test(objective.trim()) ? 'generic' : 'specific-observable'
    const languageProblems = entityIssues.filter(({ detectorId }) => detectorId === 3).flatMap(({ evidence }) => evidence)
    const prerequisiteProblems = entityIssues.filter(({ detectorId }) => [7, 8, 9].includes(detectorId)).map(({ message }) => message)
    const improperHigherDependencies = entityIssues.filter(({ detectorId }) => detectorId === 8).flatMap(({ evidence }) => evidence)
    const action = actionFor(entityIssues, safety)
    return {
      packageId: context.packageId,
      packageVersion: context.packageVersion,
      routeId: context.route.id,
      moduleId: context.module.id,
      lessonId: context.lesson.id,
      visibleTitle: context.lesson.authoring?.title.es ?? context.lesson.title,
      currentOrder: context.globalOrder,
      routeOrder: context.routeOrder,
      moduleOrder: context.moduleOrder,
      lessonOrder: context.lessonOrder,
      currentType: `${context.lesson.authoring?.pedagogy?.role ?? 'undeclared'} / ${context.lesson.blockIds.map((id) => context.pack.blocks.find((block) => block.id === id)?.kind ?? 'unknown').join('+')}`,
      proposedCurriculumStage: stageFor(context),
      curriculumCategory: categoryFor(context),
      currentObservableObjective: objective || 'unknown - manual review pending',
      objectiveQuality,
      currentLearningArchetype: currentArchetype,
      recommendedLearningArchetype: recommended,
      declaredPrimarySource: sourceIds[0] ?? null,
      secondarySources: sourceIds.slice(1),
      currentCitations: lessonCitations(context),
      citationPrecision: records.some(({ citationPrecision }) => citationPrecision === 'page-or-figure') ? 'page-or-figure'
        : records.some(({ citationPrecision }) => citationPrecision === 'chapter-or-section') ? 'chapter-or-section'
          : records.some(({ citationPrecision }) => citationPrecision === 'document') ? 'document' : 'missing',
      requiredConcepts: context.lesson.authoring?.prerequisiteConceptIds ?? [],
      prerequisiteProblems,
      improperHigherDependencies,
      visualCoverage: `${visuals.filter(({ status }) => ['ready', 'approved'].includes(status)).length}/${visuals.length} declared visuals ready or approved`,
      requiredVisuals: archetypeVisuals[recommended],
      currentEvidenceLevel: current,
      recommendedEvidenceLevel: recommendedEvidence(recommended),
      executionTier: lessonExecutionTier(context),
      safetyStatus: safety,
      historicalStatus: historyFor(records),
      languageProblems,
      editorialProblems: [...new Set(entityIssues.map(({ category }) => category))],
      editorialStatus: editorialStatusFor(entityIssues, safety),
      recommendedAction: action,
      priority: priority.score >= 80 ? 'critical' : priority.score >= 55 ? 'high' : priority.score >= 30 ? 'medium' : 'low',
      priorityScore: priority.score,
      priorityBreakdown: priority.breakdown,
      reason: entityIssues.length ? entityIssues.slice(0, 4).map(({ message }) => message).join(' ') : 'No automatic audit incident detected; retain pending ordinary editorial review.',
      manualReviewRequired: entityIssues.length > 0 || records.some(({ verificationStatus }) => ['unknown', 'ocr-unverified', 'requires-modern-corroboration'].includes(verificationStatus)),
    }
  })

  const issuesByDetector = DETECTORS.map(([detectorId, category, title]) => {
    const matching = issues.filter((issue) => issue.detectorId === detectorId)
    return {
      detectorId,
      category,
      title,
      count: matching.length,
      critical: matching.filter(({ severity }) => severity === 'critical').length,
      high: matching.filter(({ severity }) => severity === 'high').length,
      medium: matching.filter(({ severity }) => severity === 'medium').length,
      low: matching.filter(({ severity }) => severity === 'low').length,
      info: matching.filter(({ severity }) => severity === 'info').length,
    }
  })
  return { lessons, activities, issues, issuesByDetector }
}
