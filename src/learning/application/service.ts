import type { WatchProject } from '../../vnext/model'
import { isNativeApp } from '../../platform/native'
import { APP_VERSION } from '../../version'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { ProjectEntityIndex } from '../canonical'
import { createStudioEntityPartMap, StudioViewportLearningBridge } from '../integrations/studioViewportBridge'
import type { LearningBinaryStorage } from '../persistence/binaryStorage'
import { LearningBackupManager } from '../persistence/backupManager'
import { LearningPersistenceCoordinator, type RuntimePersistenceBinding } from '../persistence/coordinator'
import { LearningDeletionService, type LearningDeletionPreview } from '../persistence/deletionService'
import {
  AssessmentEngine,
  assessmentConditionForSingleAttempt,
} from '../persistence/assessmentEngine'
import {
  EvidenceProjectionEngine,
} from '../persistence/evidenceEngine'
import { LearningExportService, type PersistentLearningExportSelection } from '../persistence/exportService'
import { fingerprintTechnicalProject, sha256Fingerprint } from '../persistence/fingerprints'
import { RuntimeEventIngestionService } from '../persistence/ingestion'
import { MasteryProjectionEngine } from '../persistence/masteryEngine'
import type {
  InstalledLearningPackage,
  LearningBackupRecord,
  LearningMasteryProjection,
  LearningProfile,
  PersistentAssessment,
  PersistentEvidenceRecord,
  PersistentLearningSession,
} from '../persistence/models'
import { LearningPackageInstallationService } from '../persistence/packageInstallation'
import { LearningProfileService } from '../persistence/profileService'
import { LearningRecoveryService, type LearningRecoveryReport, type RecoveryAction } from '../persistence/recoveryService'
import type { LearningRepository, Page } from '../persistence/repository'
import { LearningSessionService } from '../persistence/sessionService'
import {
  type LearningActivityDescriptor,
  type LearningProductIndex,
} from '../product/demoPackage'
import { academyStudyPlan } from '../academy/academyStudyPlan'
import { academyLocalStore, normalizeAcademyLocalState } from '../academy/academyLocalState'
import { effectiveLessonPrerequisiteConceptIds } from '../academy/path/academyPathPrerequisites'
import {
  academyRoutePrerequisiteStatus,
  academyRouteTree,
  realAcademyRoutes,
} from '../academy/academyCatalog'
import {
  assessmentRuleForActivity,
  findCurrentIntegratedLearningContent,
  findIntegratedLearningContent,
  INTEGRATED_LEARNING_CONTENT,
  INTEGRATED_LEARNING_PRODUCT_INDEX,
  integratedEvidenceRules,
  type IntegratedLearningContent,
} from '../product/integratedContent'
import type { CommandExecutionResult, LearningCommand } from '../runtime/commands'
import { HEADLESS_RUNTIME_CAPABILITIES } from '../runtime/capabilities'
import type { ViewportLearningBridge } from '../runtime/bridge'
import { diagnostic } from '../runtime/diagnostics'
import type { NormalizedAnswerEvaluation } from '../runtime/interactions'
import { LearningPackageLoader, type LearningPackageLoadResult } from '../runtime/packageLoader'
import { LearningRuntime, type LearningRuntimeState } from '../runtime/runtime'
import type { EducationalScene } from '../scenes'
import { EducationalCompositionBridge } from '../visual/bridge'
import type { EducationalViewportComposition } from '../visual/composition'
import type { EducationalSceneGraph, EducationalVisualState } from '../visual/model'
import { createSceneComposition } from '../visual/sceneFixtures'
import { technicalFixture } from '../technical/fixtures'
import {
  VirtualWorkbench,
  type HandlingCommand,
  type WorkbenchSnapshot,
} from '../workbench'
import {
  MechanicalLearningLab,
  type MechanicalLabCommand,
  type MechanicalLabSnapshot,
} from '../mechanical'
import {
  CalibreLearningLab,
  type CalibreLabCommand,
  type CalibreSessionSnapshot,
} from '../calibre'
import { learningHref, LearningNavigationState, type LearningLocation } from './navigation'

const RUNTIME_VERSION = '1.0.0'
const PAGE_SIZE = 40
const AGGREGATE_PAGE_SIZE = 250

async function collectAllPages<T>(
  load: (offset: number, limit: number) => Promise<Page<T>>,
): Promise<Page<T>> {
  const items: T[] = []
  let total: number | undefined
  let offset = 0
  do {
    const page = await load(offset, AGGREGATE_PAGE_SIZE)
    total = page.total
    items.push(...page.items)
    if (page.items.length === 0) break
    offset += page.items.length
  } while (total !== undefined && items.length < total)
  return {
    items,
    offset: 0,
    limit: PAGE_SIZE,
    total: total ?? items.length,
  }
}

export interface LearningFilters {
  search: string
  difficulty: string
  type: string
  movement: string
  family: string
  subsystem: string
  competency: string
  mastery: string
  capability: string
  language: string
  offline: string
  installed: string
  compatible: string
}

export interface LearningNotification {
  id: string
  severity: 'info' | 'warning' | 'error' | 'success'
  origin: 'session' | 'package' | 'backup' | 'assessment' | 'evidence'
  title: string
  detail: string
  href: string
  read: boolean
  createdAt: string
}

export interface LearningPerformanceSample {
  operation: string
  durationMs: number
  itemCount: number
  thresholdMs: number
  exceeded: boolean
  recordedAt: string
}

export interface LearningPreflight {
  activityId: string
  status: 'checking' | 'ready' | 'blocked'
  checks: Array<{
    id: string
    label: string
    status: 'passed' | 'warning' | 'failed'
    detail: string
    actions?: Array<{
      label: string
      href: string
    }>
  }>
  diagnostics: Array<{
    id: string
    message: string
    technical: string
    recovery: string
  }>
}

export interface LearningResultViewModel {
  session: PersistentLearningSession
  evidence: PersistentEvidenceRecord[]
  assessment: PersistentAssessment
  mastery?: LearningMasteryProjection
  previousState: string
  nextRecommendation: LearningRecommendation
}

export interface HumanReviewInput {
  sourceEvidenceId: string
  decision: 'approved' | 'changes-requested' | 'rejected'
  reviewerName: string
  notes: string
  criterionIds?: string[]
}

export interface HumanReviewResult {
  reviewEvidence: PersistentEvidenceRecord
  reviewedEvidence: PersistentEvidenceRecord
  assessment: PersistentAssessment
  mastery?: LearningMasteryProjection
}

export interface LearningRecommendation {
  id: string
  kind: 'recover-session' | 'continue-route' | 'complete-prerequisite' | 'repeat-activity' | 'practice-competency' | 'remediate-misconception' | 'transfer-competency' | 'retention' | 'review-evidence' | 'install-dependency'
  title: string
  reason: string
  rule: string
  priority: number
  evidenceIds: string[]
  href: string
  required: boolean
}

export interface LearningWorkspaceViewModel {
  persistentSessionId: string
  learningMode: 'authored' | 'remediation' | 'demonstration' | 'transfer' | 'retention'
  runtimeState: LearningRuntimeState
  activity: LearningActivityDescriptor
  routeTitle: { es: string; en: string }
  lessonTitle: { es: string; en: string }
  lessonPurpose: { es: string; en: string }
  steps: Array<{
    id: string
    instructionMarkdown: string
    questions: EducationalScene['steps'][number]['questions']
  }>
  answers: Record<string, unknown>
  answerEvaluations: Record<string, NormalizedAnswerEvaluation>
  answerAttempts: Record<string, number>
  completedStepIds: string[]
  stepAttempts: Record<string, number>
  sourceLabels: string[]
  modelReference: string
  unknownData: string[]
  activeStepId?: string
  stepIds: string[]
  timelineMs: number
  durationMs: number
  speed: number
  provisionalEvidenceCount: number
  requestedHints: Array<{
    hintId: string
    level: number
    questionId?: string
    content?: string
  }>
  diagnostics: Array<{ code: string; message: string; technical?: string }>
  accessibleEntities: Array<{ id: string; label: string; selected: boolean }>
  educationalVisual?: {
    graphs: EducationalSceneGraph[]
    state: EducationalVisualState
  }
  workbench?: {
    mode: 'guided' | 'assisted' | 'free'
    prepared: boolean
    energyIsolated: boolean
    selectedToolId?: string
    zones: Array<{ id: string; label: string; kind: string; safe: boolean; warning?: string }>
    tools: Array<{ id: string; label: string; capabilities: string[]; limitations: string[]; selected: boolean }>
    parts: Array<{
      instanceId: string
      label: string
      accessibleLabel: string
      subsystem: string
      state: string
      fastener: boolean
      orientation: string
      trayZoneId?: string
      manipulable: boolean
      selected: boolean
    }>
    trayZones: Array<{ id: string; label: string; order: number; instanceIds: string[] }>
    warnings: string[]
    eventCount: number
    keyboardActions: Array<{ id: string; label: string; keyboardShortcut: string }>
  }
  mechanicalLab?: {
    subsystem: string
    viewMode: string
    energyLevel: number
    blockedEntityIds: string[]
    gearStages: Array<{
      id: string
      driverTeeth: number
      drivenTeeth: number
      engaged: boolean
      centerDistanceState: string
    }>
    totalRatio: number
    finalDirection: number
    supportState: string
    escapementPhase: string
    escapementPaused: boolean
    escapementSpeed: number
    oscillatorFrequencyHz: number
    oscillatorAmplitudeDegrees: number
    oscillatorPaused: boolean
    hairspringActiveLength: number
    motionWorksEngaged: boolean
    indicatedMinutes: number
    crownPosition: string
    automaticEnabled: boolean
    automaticReversal: string
    calendarDay: number
    calendarBlocked: boolean
    activeFaults: Array<{
      kind: string
      symptom: string
      hypothesis: string
      test: string
      allowedConclusion: string
      forbiddenConclusion: string
    }>
    entities: Array<{ id: string; label: string; subsystem: string; blocked: boolean }>
    eventCount: number
    reducedMotion: boolean
    textualRelations: string[]
    textualEnergyGraph: string[]
    escapementPhases: Array<{ index: number; phase: string; description: string }>
    projectDraft: MechanicalLabSnapshot['projectDraft']
  }
  calibreLab?: {
    fixtureId: string
    fixtureVersion: string
    mode: 'guided' | 'assisted' | 'free'
    selectedSubsystemId: string
    selectedInstanceId?: string
    viewMode: CalibreSessionSnapshot['viewMode']
    documentationReviewed: boolean
    disassemblyPlan: string[]
    disassemblyOperationIds: string[]
    activeContextualLab?: NonNullable<CalibreSessionSnapshot['activeContextualLab']>
    cameraBookmark: string
    auditCounts: {
      definitions: number
      instances: number
      ready: number
      usableWithLimitations: number
      documentaryOnly: number
      blocked: number
      unknown: number
    }
    subsystems: Array<{
      id: string
      label: string
      instanceCount: number
      operationCount: number
      limitations: string[]
      selected: boolean
    }>
    authorityCounts: Array<{ authority: string; count: number }>
    officialSourceIds: string[]
    inspectionFindings: CalibreSessionSnapshot['inspectionFindings']
    verifications: CalibreSessionSnapshot['verifications']
    faults: CalibreSessionSnapshot['faults']
    hypotheses: CalibreSessionSnapshot['hypotheses']
    project: CalibreSessionSnapshot['project']
    eventCount: number
    accessibility: ReturnType<CalibreLearningLab['accessibilityModel']>
  }
}

export interface LearningApplicationSnapshot {
  status: 'initializing' | 'ready' | 'error' | 'disposed'
  backend: LearningRepository['backend'] | 'pending'
  location: LearningLocation
  error?: { id: string; message: string; technical: string; recovery: string }
  lastCommandResult?: {
    accepted: boolean
    commandType: LearningCommand['type']
    message: string
    at: string
  }
  profile?: LearningProfile
  profiles: LearningProfile[]
  product: LearningProductIndex
  sessions: Page<PersistentLearningSession>
  evidence: Page<PersistentEvidenceRecord>
  assessments: Page<PersistentAssessment>
  mastery: Page<LearningMasteryProjection>
  packages: Page<InstalledLearningPackage>
  backups: LearningBackupRecord[]
  recovery: Record<string, LearningRecoveryReport>
  notifications: LearningNotification[]
  recommendations: LearningRecommendation[]
  filters: LearningFilters
  preflight?: LearningPreflight
  workspace?: LearningWorkspaceViewModel
  result?: LearningResultViewModel
  selectedSessionEvents: Page<import('../persistence/models').PersistedLearningEvent>
  performance: LearningPerformanceSample[]
  online: boolean
}

const EMPTY_PAGE = <T>(): Page<T> => ({ items: [], offset: 0, limit: PAGE_SIZE, total: 0 })

const INITIAL_FILTERS: LearningFilters = {
  search: '',
  difficulty: '',
  type: '',
  movement: '',
  family: '',
  subsystem: '',
  competency: '',
  mastery: '',
  capability: '',
  language: '',
  offline: '',
  installed: '',
  compatible: '',
}

export interface LearningNavigationPort {
  current(): LearningLocation
  navigate(location: LearningLocation, replace?: boolean): void
  updateQuery(patch: Record<string, string | undefined>, replace?: boolean): void
  subscribe(listener: () => void): () => void
  dispose(): void
}

function initialSnapshot(navigation: LearningNavigationPort): LearningApplicationSnapshot {
  return {
    status: 'initializing',
    backend: 'pending',
    location: navigation.current(),
    profiles: [],
    product: INTEGRATED_LEARNING_PRODUCT_INDEX,
    sessions: EMPTY_PAGE(),
    evidence: EMPTY_PAGE(),
    assessments: EMPTY_PAGE(),
    mastery: EMPTY_PAGE(),
    packages: EMPTY_PAGE(),
    backups: [],
    recovery: {},
    notifications: [],
    recommendations: [],
    filters: { ...INITIAL_FILTERS, ...navigation.current().query },
    selectedSessionEvents: EMPTY_PAGE(),
    performance: [],
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
  }
}

class LearningNotificationCenter {
  build(snapshot: Pick<LearningApplicationSnapshot, 'profile' | 'sessions' | 'packages' | 'backups' | 'assessments' | 'evidence'>): LearningNotification[] {
    if (!snapshot.profile) return []
    const readIds = new Set(
      Array.isArray(snapshot.profile.educationalPreferences.learningNotificationReadIds)
        ? snapshot.profile.educationalPreferences.learningNotificationReadIds.filter((id): id is string => typeof id === 'string')
        : [],
    )
    const notifications: LearningNotification[] = []
    snapshot.sessions.items
      .filter(({ state }) => state === 'interrupted' || state === 'suspended')
      .forEach((session) => notifications.push({
        id: `notification.recovery.${session.id}`,
        severity: 'warning',
        origin: 'session',
        title: 'Sesión pendiente de recuperación',
        detail: `Puedes continuar desde el intento ${session.attempt}.`,
        href: `#/learning/recovery/${encodeURIComponent(session.id)}`,
        read: readIds.has(`notification.recovery.${session.id}`),
        createdAt: session.updatedAt,
      }))
    snapshot.packages.items
      .filter(({ status }) => status === 'failed')
      .forEach((pack) => notifications.push({
        id: `notification.package.${pack.packageId}.${pack.version}`,
        severity: 'error',
        origin: 'package',
        title: 'Contenido incompatible',
        detail: 'Revisa la compatibilidad del contenido instalado antes de usarlo.',
        href: `#/learning/package/${encodeURIComponent(`${pack.packageId}@${pack.version}`)}`,
        read: readIds.has(`notification.package.${pack.packageId}.${pack.version}`),
        createdAt: pack.verifiedAt,
      }))
    snapshot.assessments.items.slice(0, 3).forEach((assessment) => notifications.push({
      id: `notification.assessment.${assessment.id}`,
      severity: assessment.result.passed ? 'success' : 'info',
      origin: 'assessment',
      title: assessment.result.passed ? 'Evaluación terminada' : 'Práctica recomendada',
      detail: assessment.explanation.summary,
      href: `#/learning/assessment/${encodeURIComponent(assessment.id)}`,
      read: readIds.has(`notification.assessment.${assessment.id}`),
      createdAt: assessment.evaluatedAt,
    }))
    snapshot.evidence.items
      .filter(({ status }) => status === 'invalidated')
      .forEach((evidence) => notifications.push({
        id: `notification.evidence.${evidence.id}`,
        severity: 'warning',
        origin: 'evidence',
        title: 'Evidencia invalidada',
        detail: evidence.reason ?? 'Este resultado ya no se usará para calcular tu progreso.',
        href: `#/learning/evidence/${encodeURIComponent(evidence.id)}`,
        read: readIds.has(`notification.evidence.${evidence.id}`),
        createdAt: evidence.createdAt,
      }))
    return notifications
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .filter((item, index, values) => values.findIndex(({ id }) => id === item.id) === index)
  }
}

export class LearningViewModelFactory {
  recommendations(snapshot: LearningApplicationSnapshot): LearningRecommendation[] {
    return academyStudyPlan(snapshot)
  }
}

export class LearningProfileController {
  private readonly service: LearningProfileService
  private readonly repository: LearningRepository

  constructor(
    service: LearningProfileService,
    repository: LearningRepository,
  ) {
    this.service = service
    this.repository = repository
  }

  list(): Promise<Page<LearningProfile>> {
    return this.repository.listProfiles({ limit: 100 }, false)
  }

  create(name: string, locale: string): Promise<LearningProfile> {
    return this.service.createProfile(name, locale)
  }

  update(profileId: string, changes: Parameters<LearningProfileService['update']>[1]): Promise<LearningProfile> {
    return this.service.update(profileId, changes)
  }

  archive(profileId: string): Promise<LearningProfile> {
    return this.service.archive(profileId, true)
  }
}

export class LearningCatalogController {
  readonly product: LearningProductIndex
  private readonly repository: LearningRepository
  private readonly installer: LearningPackageInstallationService

  constructor(
    product: LearningProductIndex,
    repository: LearningRepository,
    installer: LearningPackageInstallationService,
  ) {
    this.product = product
    this.repository = repository
    this.installer = installer
  }

  packages(offset = 0): Promise<Page<InstalledLearningPackage>> {
    return this.repository.listPackages({ offset, limit: PAGE_SIZE })
  }

  install(bytes: Uint8Array): Promise<InstalledLearningPackage> {
    return this.installer.install(bytes, 'local-unsigned')
  }

  async uninstall(packageId: string, version: string): Promise<void> {
    await this.installer.uninstall(packageId, version)
  }
}

export class LearningSessionController {
  readonly service: LearningSessionService
  private readonly repository: LearningRepository

  constructor(
    service: LearningSessionService,
    repository: LearningRepository,
  ) {
    this.service = service
    this.repository = repository
  }

  list(profileId: string, offset = 0): Promise<Page<PersistentLearningSession>> {
    return this.repository.listSessions(profileId, { offset, limit: PAGE_SIZE }, true)
  }

  events(sessionId: string, offset = 0) {
    return this.repository.listEvents(sessionId, { offset, limit: PAGE_SIZE })
  }
}

export class LearningRecoveryController {
  readonly service: LearningRecoveryService

  constructor(service: LearningRecoveryService) {
    this.service = service
  }
}

export class LearningProgressController {
  private readonly repository: LearningRepository
  readonly mastery: MasteryProjectionEngine

  constructor(
    repository: LearningRepository,
    mastery: MasteryProjectionEngine,
  ) {
    this.repository = repository
    this.mastery = mastery
  }

  async pages(profileId: string) {
    return Promise.all([
      collectAllPages((offset, limit) =>
        this.repository.listEvidence(profileId, undefined, { offset, limit })),
      collectAllPages((offset, limit) =>
        this.repository.listAssessments(profileId, undefined, { offset, limit })),
      collectAllPages((offset, limit) =>
        this.repository.listMastery(profileId, { offset, limit })),
    ])
  }
}

export class LearningWorkspaceController {
  runtime?: LearningRuntime
  bridge?: ViewportLearningBridge
  composition?: EducationalViewportComposition
  binding?: RuntimePersistenceBinding
  persistentSessionId?: string
  activity?: LearningActivityDescriptor
  workbench?: VirtualWorkbench
  mechanicalLab?: MechanicalLearningLab
  calibreLab?: CalibreLearningLab
  assessmentMode: 'authored' | 'retention' = 'authored'
  learningMode: 'authored' | 'remediation' | 'demonstration' | 'transfer' | 'retention' = 'authored'
  speed = 1

  async dispose(): Promise<void> {
    await this.binding?.dispose()
    await this.runtime?.dispose()
    await this.bridge?.dispose()
    await this.composition?.dispose()
    this.binding = undefined
    this.runtime = undefined
    this.bridge = undefined
    this.composition = undefined
    this.persistentSessionId = undefined
    this.activity = undefined
    this.workbench = undefined
    this.mechanicalLab = undefined
    this.calibreLab = undefined
    this.assessmentMode = 'authored'
    this.learningMode = 'authored'
  }
}

export class LearningActivityController {
  readonly workspace: LearningWorkspaceController

  constructor(workspace: LearningWorkspaceController) {
    this.workspace = workspace
  }
}

export interface LearningApplicationBackend {
  repository: LearningRepository
  storage: LearningBinaryStorage
  closeStorage: () => Promise<void>
}

export type LearningBackendFactory = () => Promise<LearningApplicationBackend>

export interface LearningApplicationOptions {
  /** Solo para previsualizadores editoriales y pruebas aisladas de laboratorios. */
  curriculumPolicy?: 'enforced' | 'authoring-preview'
}

interface ActivityVisualContext {
  index: ProjectEntityIndex
  bridge: ViewportLearningBridge
  composition?: EducationalViewportComposition
}

async function loadIntegratedContentGraph(
  runtime: LearningRuntime,
  content: IntegratedLearningContent,
  visited = new Set<string>(),
): Promise<LearningPackageLoadResult | undefined> {
  const key = `${content.pack.manifest.id}@${content.pack.manifest.packageVersion}`
  if (visited.has(key)) return undefined
  visited.add(key)
  for (const dependency of content.pack.manifest.dependencies) {
    const resolved = INTEGRATED_LEARNING_CONTENT.find(({ pack }) => pack.manifest.id === dependency.packageId)
    if (!resolved) continue
    const dependencyResult: LearningPackageLoadResult | undefined = await loadIntegratedContentGraph(runtime, resolved, visited)
    if (dependencyResult && !dependencyResult.success) return dependencyResult
  }
  return runtime.loadPackage(content.bytes, content.pack.manifest.distribution)
}

async function createBackend(): Promise<LearningApplicationBackend> {
  if (isNativeApp()) {
    const [{ SqliteLearningRepository }, { NativeLearningBinaryStorage }] = await Promise.all([
      import('../persistence/sqliteRepository'),
      import('../persistence/binaryStorage'),
    ])
    const repository = new SqliteLearningRepository()
    await repository.initialize()
    return { repository, storage: new NativeLearningBinaryStorage(), closeStorage: async () => undefined }
  }
  const [{ IndexedDbLearningRepository }, { IndexedDbLearningBinaryStorage }] = await Promise.all([
    import('../persistence/indexedDbRepository'),
    import('../persistence/binaryStorage'),
  ])
  const repository = new IndexedDbLearningRepository()
  const storage = new IndexedDbLearningBinaryStorage()
  await Promise.all([repository.initialize(), storage.initialize()])
  return { repository, storage, closeStorage: () => storage.close() }
}

export class LearningApplicationService {
  readonly navigation: LearningNavigationPort
  readonly viewModels = new LearningViewModelFactory()
  readonly workspace = new LearningWorkspaceController()
  readonly activity = new LearningActivityController(this.workspace)
  readonly notifications = new LearningNotificationCenter()
  profile?: LearningProfileController
  catalog?: LearningCatalogController
  sessions?: LearningSessionController
  recovery?: LearningRecoveryController
  progress?: LearningProgressController

  private snapshotValue: LearningApplicationSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly project: WatchProject
  private repository?: LearningRepository
  private closeStorage?: () => Promise<void>
  private profileService?: LearningProfileService
  private packageInstaller?: LearningPackageInstallationService
  private backupManager?: LearningBackupManager
  private exportService?: LearningExportService
  private deletionService?: LearningDeletionService
  private evidenceEngine?: EvidenceProjectionEngine
  private assessmentEngine?: AssessmentEngine
  private masteryEngine?: MasteryProjectionEngine
  private sessionService?: LearningSessionService
  private persistenceCoordinator?: LearningPersistenceCoordinator
  private readonly backendFactory: LearningBackendFactory
  private readonly curriculumPolicy: 'enforced' | 'authoring-preview'
  private navigationUnsubscribe?: () => void
  private disposed = false
  private initialization?: Promise<void>

  constructor(
    project: WatchProject,
    navigation: LearningNavigationPort = new LearningNavigationState(),
    backendFactory: LearningBackendFactory = createBackend,
    options: LearningApplicationOptions = {},
  ) {
    this.project = project
    this.navigation = navigation
    this.backendFactory = backendFactory
    this.curriculumPolicy = options.curriculumPolicy ?? 'enforced'
    this.snapshotValue = initialSnapshot(navigation)
    this.navigationUnsubscribe = navigation.subscribe(() => {
      const location = navigation.current()
      this.set({
        location,
        filters: { ...INITIAL_FILTERS, ...location.query },
      })
    })
  }

  snapshot = (): LearningApplicationSnapshot => this.snapshotValue

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  initialize(): Promise<void> {
    this.initialization ??= this.initializeOnce()
    return this.initialization
  }

  private async initializeOnce(): Promise<void> {
    try {
      const started = performance.now()
      const backend = await this.backendFactory()
      this.repository = backend.repository
      this.closeStorage = backend.closeStorage
      this.profileService = new LearningProfileService(backend.repository)
      this.sessionService = new LearningSessionService(backend.repository)
      this.packageInstaller = new LearningPackageInstallationService(
        backend.repository,
        backend.storage,
        new LearningPackageLoader({ applicationVersion: APP_VERSION }),
      )
      this.backupManager = new LearningBackupManager(backend.repository, backend.storage)
      this.exportService = new LearningExportService(backend.repository)
      this.deletionService = new LearningDeletionService(backend.repository)
      this.evidenceEngine = new EvidenceProjectionEngine(backend.repository, integratedEvidenceRules())
      this.assessmentEngine = new AssessmentEngine(backend.repository)
      this.masteryEngine = new MasteryProjectionEngine(backend.repository)
      const ingestion = new RuntimeEventIngestionService(backend.repository)
      this.persistenceCoordinator = new LearningPersistenceCoordinator(ingestion, this.evidenceEngine, this.sessionService)

      this.profile = new LearningProfileController(this.profileService, backend.repository)
      this.catalog = new LearningCatalogController(INTEGRATED_LEARNING_PRODUCT_INDEX, backend.repository, this.packageInstaller)
      this.sessions = new LearningSessionController(this.sessionService, backend.repository)
      this.recovery = new LearningRecoveryController(new LearningRecoveryService(backend.repository))
      this.progress = new LearningProgressController(backend.repository, this.masteryEngine)

      const profile = await this.profileService.ensureDefaultProfile('es-ES')
      for (const content of INTEGRATED_LEARNING_CONTENT) {
        const existingPack = await backend.repository.getPackage(
          content.pack.manifest.id,
          content.pack.manifest.packageVersion,
        )
        if (!existingPack || !['active', 'retained'].includes(existingPack.status)) {
          await this.packageInstaller.install(content.bytes, content.pack.manifest.distribution)
        }
      }
      await this.sessionService.markOpenSessionsInterrupted('application-reopened')
      this.set({ backend: backend.repository.backend, profile })
      this.recordPerformance('initialize', performance.now() - started, 1, 800)
      await this.refresh()
      this.set({ status: 'ready' })
    } catch (error) {
      this.fail('LA-INITIALIZE', 'Aprender no ha podido abrir su almacenamiento local.', error, 'Reintenta el área; el proyecto técnico permanece disponible.')
    }
  }

  async refresh(): Promise<void> {
    const repository = this.requiredRepository()
    const profile = this.snapshotValue.profile
    if (!profile) return
    const started = performance.now()
    const [profiles, sessions, packages, backups, evidence, assessments, mastery] = await Promise.all([
      repository.listProfiles({ limit: 100 }, false),
      collectAllPages((offset, limit) =>
        repository.listSessions(profile.id, { offset, limit }, true)),
      repository.listPackages({ limit: PAGE_SIZE }),
      repository.listBackups(),
      collectAllPages((offset, limit) =>
        repository.listEvidence(profile.id, undefined, { offset, limit })),
      collectAllPages((offset, limit) =>
        repository.listAssessments(profile.id, undefined, { offset, limit })),
      collectAllPages((offset, limit) =>
        repository.listMastery(profile.id, { offset, limit })),
    ])
    const base = {
      profiles: profiles.items,
      sessions,
      packages,
      backups,
      evidence,
      assessments,
      mastery,
    }
    const notifications = this.notifications.build({ profile, ...base })
    const next = { ...this.snapshotValue, ...base, notifications }
    next.recommendations = this.viewModels.recommendations(next)
    this.snapshotValue = next
    this.recordPerformance('refresh-pages', performance.now() - started, (
      sessions.items.length + evidence.items.length + assessments.items.length + mastery.items.length
    ), 250)
    await this.refreshRecoveryReports()
    this.emit()
  }

  navigate(location: LearningLocation, replace = false): void {
    this.navigation.navigate(location, replace)
  }

  setOnline(online: boolean): void {
    if (this.snapshotValue.online !== online) this.set({ online })
  }

  setFilter(name: keyof LearningFilters, value: string): void {
    const filters = { ...this.snapshotValue.filters, [name]: value }
    this.set({ filters })
    this.navigation.updateQuery({ [name]: value || undefined })
  }

  async switchProfile(profileId: string): Promise<void> {
    const repository = this.requiredRepository()
    const next = await repository.getProfile(profileId)
    if (!next || next.deletedAt || next.archived) throw new Error('El perfil seleccionado no está disponible.')
    if (this.workspace.persistentSessionId) await this.saveAndExit('profile-switch')
    this.set({
      profile: next,
      evidence: EMPTY_PAGE(),
      assessments: EMPTY_PAGE(),
      mastery: EMPTY_PAGE(),
      sessions: EMPTY_PAGE(),
      result: undefined,
      workspace: undefined,
    })
    await this.refresh()
  }

  async createProfile(name: string): Promise<void> {
    const created = await this.requiredProfileController().create(name, this.snapshotValue.profile?.locale ?? 'es-ES')
    await this.switchProfile(created.id)
  }

  async updateProfile(changes: Parameters<LearningProfileService['update']>[1]): Promise<void> {
    const profile = this.requiredProfile()
    const updated = await this.requiredProfileController().update(profile.id, changes)
    this.set({ profile: updated })
    await this.refresh()
  }

  async archiveProfile(profileId: string): Promise<void> {
    await this.requiredProfileController().archive(profileId)
    const next = (await this.requiredProfileController().list()).items.find(({ id }) => id !== profileId && !this.snapshotValue.profiles.find((profile) => profile.id === id)?.archived)
    if (next) await this.switchProfile(next.id)
    else {
      const created = await this.requiredProfileController().create('Perfil local', 'es-ES')
      await this.switchProfile(created.id)
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    const profile = this.requiredProfile()
    const current = Array.isArray(profile.educationalPreferences.learningNotificationReadIds)
      ? profile.educationalPreferences.learningNotificationReadIds.filter((value): value is string => typeof value === 'string')
      : []
    await this.updateProfile({
      educationalPreferences: {
        ...profile.educationalPreferences,
        learningNotificationReadIds: [...new Set([...current, id])],
      },
    })
  }

  private async createActivityVisualContext(
    activity: LearningActivityDescriptor,
  ): Promise<ActivityVisualContext> {
    if (activity.fixtureBinding) {
      const composition = await createSceneComposition(
        activity.fixtureBinding,
        this.requiredProfile().accessibility.reducedMotion,
      )
      return {
        index: composition.canonicalIndex(),
        bridge: new EducationalCompositionBridge(composition),
        composition,
      }
    }
    const index = new ProjectEntityIndex(projectV5ToCanonical(this.project))
    return {
      index,
      bridge: new StudioViewportLearningBridge(createStudioEntityPartMap(index)),
    }
  }

  async preflightActivity(activityId: string): Promise<LearningPreflight> {
    const activity = this.activityDescriptor(activityId)
    const checks: LearningPreflight['checks'] = []
    const diagnostics: LearningPreflight['diagnostics'] = []
    const preflight: LearningPreflight = { activityId, status: 'checking', checks, diagnostics }
    this.set({ preflight })
    const installed = await this.requiredRepository().getPackage(activity.packageId, activity.packageVersion)
    checks.push({
      id: 'package',
      label: 'Contenido de la práctica',
      status: installed && ['active', 'retained'].includes(installed.status) ? 'passed' : 'failed',
      detail: installed
        ? ['active', 'retained'].includes(installed.status)
          ? 'El contenido necesario está instalado y disponible.'
          : 'El contenido está instalado, pero necesita revisión antes de usarse.'
        : 'Falta la versión de contenido necesaria para esta práctica.',
      ...(!installed ? { actions: [{ label: 'Revisar contenido instalado', href: '#/learning/content' }] } : {}),
    })
    const content = findIntegratedLearningContent(activity.packageId, activity.packageVersion)
    const missingDependencies = (content?.pack.manifest.dependencies ?? []).filter((dependency) =>
      !this.snapshotValue.packages.items.some(({ packageId }) => packageId === dependency.packageId))
    checks.push({
      id: 'dependencies',
      label: 'Recursos asociados',
      status: missingDependencies.length === 0 ? 'passed' : 'failed',
      detail: missingDependencies.length === 0
        ? 'Todos los recursos asociados están disponibles.'
        : `Faltan ${missingDependencies.length} ${missingDependencies.length === 1 ? 'recurso necesario' : 'recursos necesarios'}.`,
      ...(missingDependencies.length ? { actions: [{ label: 'Revisar recursos necesarios', href: '#/learning/content' }] } : {}),
    })
    const visual = await this.createActivityVisualContext(activity)
    const capabilities = [...HEADLESS_RUNTIME_CAPABILITIES, ...visual.bridge.capabilities()]
    const missingCapabilities = activity.requiredCapabilities.filter((required) =>
      !capabilities.some(({ id, status }) => id === required && (status === 'available' || status === 'limited')))
    checks.push({
      id: 'capabilities',
      label: 'Controles de la práctica',
      status: missingCapabilities.length === 0 ? 'passed' : 'failed',
      detail: missingCapabilities.length === 0
        ? 'El modelo y los controles necesarios están disponibles.'
        : 'Faltan funciones necesarias del modelo o de la actividad.',
      ...(missingCapabilities.length
        ? { actions: [{ label: 'Revisar contenido y compatibilidad', href: '#/learning/content' }] }
        : {}),
    })
    await visual.bridge.dispose()
    await visual.composition?.dispose()
    const prerequisites = this.productPrerequisites(activityId)
    const knownCompetencyIds = new Set(this.snapshotValue.product.activities.flatMap(({ competencyIds }) => competencyIds))
    const blockedPrerequisites = prerequisites.filter((id) => {
      const node = this.snapshotValue.product.knowledgeNodes.find((candidate) => candidate.id === id)
      const competencyIds = knownCompetencyIds.has(id) ? [id] : node?.competencyIds ?? []
      if (competencyIds.length === 0) return true
      return competencyIds.some((competencyId) => !this.snapshotValue.mastery.items.some((item) =>
        item.competencyId === competencyId && ['demonstrated', 'retained'].includes(item.state)))
    })
    checks.push({
      id: 'prerequisites',
      label: 'Conocimientos previos',
      status: prerequisites.length === 0 || blockedPrerequisites.length === 0
        ? 'passed'
        : this.curriculumPolicy === 'authoring-preview' ? 'warning' : 'failed',
      detail: prerequisites.length === 0
        ? 'Actividad inicial sin prerrequisitos. La ruta guiada presenta antes su lección.'
        : blockedPrerequisites.length
          ? `Antes de practicar debes completar ${blockedPrerequisites.length} ${blockedPrerequisites.length === 1 ? 'base indicada' : 'bases indicadas'}. Puedes seguir leyendo la teoría y explorando la ruta sin generar resultados evaluables.`
          : 'Prerrequisitos demostrados.',
      ...(blockedPrerequisites.length
        ? {
            actions: (() => {
              const links = blockedPrerequisites.flatMap((id) => {
              const node = this.snapshotValue.product.knowledgeNodes.find((candidate) => candidate.id === id)
              return node?.bridgeLessonId
                ? [{ label: `Estudiar ${node.title.es}`, href: `#/learning/lesson/${encodeURIComponent(node.bridgeLessonId)}` }]
                : []
              })
              return links.length > 0 ? links : [{ label: 'Abrir mi recorrido', href: '#/learning/my-learning' }]
            })(),
          }
        : {}),
    })
    const containingRoutes = realAcademyRoutes(this.snapshotValue.product).filter((route) =>
      academyRouteTree(this.snapshotValue.product, route.id)?.activityIds.includes(activityId))
    const blockedRoutePrerequisites = containingRoutes.flatMap((route) => {
      const routeStatus = academyRoutePrerequisiteStatus(this.snapshotValue, route.id)
      return routeStatus.missingRouteIds.map((missingRouteId) => ({ routeId: route.id, missingRouteId }))
    })
    checks.push({
      id: 'curriculum-route',
      label: 'Orden del recorrido',
      status: blockedRoutePrerequisites.length === 0
        ? 'passed'
        : this.curriculumPolicy === 'authoring-preview' ? 'warning' : 'failed',
      detail: blockedRoutePrerequisites.length === 0
        ? 'Las rutas previas necesarias están completadas.'
        : `Completa antes ${[...new Set(blockedRoutePrerequisites.map(({ missingRouteId }) => missingRouteId))].length === 1 ? 'la ruta indicada' : 'las rutas indicadas'}. La teoría de esta ruta sigue disponible para consulta.`,
      ...(blockedRoutePrerequisites.length
        ? {
            actions: [...new Set(blockedRoutePrerequisites.map(({ missingRouteId }) => missingRouteId))].map((routeId) => {
              const route = this.snapshotValue.product.routes.find(({ id }) => id === routeId)
              return {
                label: route ? `Abrir ${route.title.es}` : 'Abrir la ruta necesaria',
                href: `#/learning/route/${encodeURIComponent(routeId)}`,
              }
            }),
          }
        : {}),
    })
    const lesson = this.snapshotValue.product.lessons.find(({ activityIds }) => activityIds.includes(activityId))
    const academyStateValue = this.requiredProfile().educationalPreferences.academyStateV1
    const academyState = academyStateValue
      ? normalizeAcademyLocalState(this.requiredProfile().id, academyStateValue, new Date().toISOString())
      : undefined
    const theoryRequired = Boolean(lesson?.studyContract?.sequence === 'theory-first')
    const theoryCompleted = !theoryRequired || Boolean(academyState?.lessonProgress.some((progress) =>
      progress.lessonId === lesson?.id && progress.completedAt))
    checks.push({
      id: 'theory-first',
      label: 'Teoría previa',
      status: theoryCompleted
        ? 'passed'
        : this.curriculumPolicy === 'authoring-preview' ? 'warning' : 'failed',
      detail: theoryCompleted
        ? theoryRequired ? 'La lectura obligatoria de la lección está completada.' : 'La actividad no exige una lectura obligatoria.'
        : lesson
          ? `Termina primero «${lesson.title.es}»; la práctica no sustituye a la explicación.`
          : 'Termina primero la explicación asociada; la práctica no sustituye al estudio.',
      ...(!theoryCompleted && lesson
        ? { actions: [{ label: `Estudiar ${lesson.title.es}`, href: `#/learning/lesson/${encodeURIComponent(lesson.id)}` }] }
        : {}),
    })
    const requestedMode = this.snapshotValue.location.query.mode
    if (requestedMode === 'retention') {
      const retention = activity.competencyIds
        .flatMap((competencyId) => this.snapshotValue.mastery.items.filter((item) => item.competencyId === competencyId))
        .find(({ state: masteryState, nextReviewAt }) => masteryState === 'demonstrated' && Boolean(nextReviewAt))
      const due = Boolean(retention?.nextReviewAt && retention.nextReviewAt <= new Date().toISOString())
      checks.push({
        id: 'retention-window',
        label: 'Momento del repaso',
        status: due ? 'passed' : 'failed',
        detail: due
          ? `Repaso ${retention?.reviewStage ?? 1} de 3 disponible; debe resolverse sin releer la solución.`
          : retention?.nextReviewAt
            ? 'Este repaso todavía no está disponible. Consulta la fecha programada en tu plan de repaso.'
            : 'Primero debes demostrar la competencia; la repetición inmediata no cuenta como retención.',
        ...(!due ? { actions: [{ label: 'Abrir mi plan de repaso', href: '#/learning/review' }] } : {}),
      })
    }
    if (requestedMode === 'demonstration') {
      const competencyMastery = activity.competencyIds.flatMap((competencyId) =>
        this.snapshotValue.mastery.items.filter((item) => item.competencyId === competencyId))
      const practised = competencyMastery.some(({ state: masteryState }) => masteryState === 'practising')
      const explicitlyDemonstrable = activity.pedagogicalContract?.assessmentIntent === 'demonstration'
      const introducedAndExplicit = explicitlyDemonstrable
        && competencyMastery.some(({ state: masteryState }) => masteryState === 'introduced')
      const ready = practised || introducedAndExplicit
      checks.push({
        id: 'demonstration-ready',
        label: 'Preparación para demostrar',
        status: ready ? 'passed' : 'failed',
        detail: ready
          ? 'Ya has trabajado esta competencia. Ahora debes resolverla de forma independiente y sin pistas.'
          : explicitlyDemonstrable
            ? 'Estudia o practica primero esta competencia; la comprobación no sustituye el aprendizaje inicial.'
            : 'Completa primero una práctica guiada. Después podrás demostrar lo aprendido sin ayuda.',
        ...(!ready
          ? { actions: [{ label: lesson ? `Volver a ${lesson.title.es}` : 'Abrir mi recorrido', href: lesson ? `#/learning/lesson/${encodeURIComponent(lesson.id)}` : '#/learning/my-learning' }] }
          : {}),
      })
    }
    if (requestedMode === 'transfer') {
      const demonstrated = activity.competencyIds.some((competencyId) =>
        this.snapshotValue.mastery.items.some((item) =>
          item.competencyId === competencyId && ['demonstrated', 'retained'].includes(item.state)))
      checks.push({
        id: 'transfer-ready',
        label: 'Preparación para otro contexto',
        status: demonstrated ? 'passed' : 'failed',
        detail: demonstrated
          ? 'Existe una demostración previa; este intento se registrará como un contexto de transferencia separado.'
          : 'Primero demuestra la competencia en su contexto de aprendizaje antes de transferirla.',
        ...(!demonstrated ? { actions: [{ label: 'Abrir prácticas pendientes', href: '#/learning/review' }] } : {}),
      })
    }
    checks.push({
      id: 'project',
      label: 'Modelo de estudio',
      status: 'passed',
      detail: activity.fixtureBinding
        ? 'Modelo preparado para esta práctica; tus proyectos técnicos no se modifican.'
        : 'Se utilizará una copia temporal de tu proyecto; el original no se modifica.',
    })
    const status: LearningPreflight['status'] = checks.some(({ status }) => status === 'failed') ? 'blocked' : 'ready'
    if (status === 'blocked') diagnostics.push({
      id: 'LA-PREFLIGHT-BLOCKED',
      message: 'La actividad no puede comenzar con el entorno actual.',
      technical: [
        `activity=${activity.id}`,
        `package=${activity.packageId}@${activity.packageVersion}`,
        `installed=${installed?.status ?? 'missing'}`,
        missingDependencies.length ? `missing-dependencies=${missingDependencies.map(({ packageId }) => packageId).join(',')}` : '',
        missingCapabilities.length ? `missing-capabilities=${missingCapabilities.join(',')}` : '',
        blockedPrerequisites.length ? `blocked-prerequisites=${blockedPrerequisites.join(',')}` : '',
        blockedRoutePrerequisites.length ? `blocked-routes=${blockedRoutePrerequisites.map(({ missingRouteId }) => missingRouteId).join(',')}` : '',
        `failed-checks=${checks.filter(({ status: value }) => value === 'failed').map(({ id }) => id).join(',')}`,
      ].filter(Boolean).join('; '),
      recovery: blockedRoutePrerequisites.length || blockedPrerequisites.length
        ? 'Vuelve a la ruta indicada, completa su demostración y después repite esta comprobación.'
        : 'Revisa la versión instalada o abre la actividad en un entorno con las capacidades requeridas.',
    })
    const result: LearningPreflight = { ...preflight, status }
    this.set({ preflight: result })
    return result
  }

  async launchActivity(activityId: string): Promise<void> {
    const activity = this.activityDescriptor(activityId)
    const requestedMode = this.snapshotValue.location.query.mode
    const learningMode = requestedMode === 'retention'
      || requestedMode === 'demonstration'
      || requestedMode === 'transfer'
      || requestedMode === 'remediation'
      ? requestedMode
      : 'authored'
    const assessmentMode = learningMode === 'retention'
      ? 'retention'
      : 'authored'
    const preflight = await this.preflightActivity(activityId)
    if (preflight.status !== 'ready') return
    await this.workspace.dispose()
    const runtime = new LearningRuntime({ loader: new LearningPackageLoader({ applicationVersion: APP_VERSION }) })
    const content = findIntegratedLearningContent(activity.packageId, activity.packageVersion)
    if (!content) throw new Error(`No existe el binario integrado ${activity.packageId}@${activity.packageVersion}.`)
    const loaded = await loadIntegratedContentGraph(runtime, content)
    if (!loaded) throw new Error(`No se pudo registrar ${content.pack.manifest.id}.`)
    if (!loaded.success) {
      this.set({
        preflight: {
          ...preflight,
          status: 'blocked',
          diagnostics: loaded.diagnostics.map((diagnostic) => ({
            id: diagnostic.code,
            message: diagnostic.message,
            technical: diagnostic.technicalDetail ?? '',
            recovery: diagnostic.suggestedRecovery ?? 'Revisar el paquete.',
          })),
        },
      })
      await runtime.dispose()
      return
    }
    const visual = await this.createActivityVisualContext(activity)
    const compilation = runtime.prepareScene(
      activity.packageId,
      activity.packageVersion,
      activity.sceneId,
      visual.index,
      visual.bridge,
      this.project,
      this.requiredProfile().accessibility.reducedMotion,
    )
    if (!compilation.success) {
      this.set({
        preflight: {
          ...preflight,
          status: 'blocked',
          diagnostics: compilation.diagnostics.map((diagnostic) => ({
            id: diagnostic.code,
            message: diagnostic.message,
            technical: diagnostic.technicalDetail ?? '',
            recovery: diagnostic.suggestedRecovery ?? 'Revisar capacidades o selectores.',
          })),
        },
      })
      await visual.bridge.dispose()
      await visual.composition?.dispose()
      await runtime.dispose()
      return
    }
    const persistent = await this.createPersistentSession(activity, visual.bridge, undefined, learningMode)
    this.workspace.runtime = runtime
    this.workspace.bridge = visual.bridge
    this.workspace.composition = visual.composition
    this.workspace.activity = activity
    this.workspace.assessmentMode = assessmentMode
    this.workspace.learningMode = learningMode
    if (activity.calibreLabContract) {
      this.workspace.calibreLab = new CalibreLearningLab(
        activity.calibreLabContract.modes[0],
        this.requiredProfile().accessibility.reducedMotion,
      )
    }
    if (activity.workbenchContract) {
      this.workspace.workbench = this.workspace.calibreLab?.workbench
        ?? new VirtualWorkbench(
          technicalFixture(activity.workbenchContract.fixtureId),
          activity.workbenchContract.modes[0],
        )
    }
    if (activity.mechanicalLabContract) {
      this.workspace.mechanicalLab = this.workspace.calibreLab?.mechanicalLab
        ?? new MechanicalLearningLab(this.requiredProfile().accessibility.reducedMotion)
    }
    this.workspace.persistentSessionId = persistent.id
    this.workspace.binding = this.requiredCoordinator().bind(persistent.id, runtime.activeSession()!.events)
    await this.requiredSessionService().checkpoint(persistent.id, await this.createCheckpoint(false))
    await this.requiredSessionService().transition(persistent.id, 'active')
    await runtime.activeSession()!.commands.dispatch({ type: 'start-scene' })
    await runtime.activeSession()!.commands.dispatch({ type: 'next-step' })
    await runtime.activeSession()!.flush()
    await this.workspace.binding.flush()
    await this.requiredSessionService().checkpoint(persistent.id, await this.createCheckpoint(false))
    this.updateWorkspaceView()
    this.navigate({ surface: 'workspace', id: activity.id, query: learningMode === 'authored' ? {} : { mode: learningMode } })
    await this.refresh()
  }

  async command(command: LearningCommand): Promise<CommandExecutionResult> {
    const runtimeSession = this.workspace.runtime?.activeSession()
    if (!runtimeSession) throw new Error('No hay una actividad preparada.')
    if (
      command.type === 'show-hint'
      && (this.workspace.learningMode === 'demonstration' || this.workspace.learningMode === 'retention')
    ) {
      const issue = diagnostic({
        code: 'LR-INDEPENDENT-MODE-NO-HINTS',
        category: 'invalid-state',
        message: 'Esta comprobación debe resolverse sin pistas para que la evidencia sea independiente.',
        technicalDetail: JSON.stringify({ commandType: command.type, learningMode: this.workspace.learningMode }),
        source: 'runtime',
        suggestedRecovery: 'Termina el intento sin ayuda o sal y vuelve a la explicación antes de intentarlo de nuevo.',
        blocking: false,
        retrySafe: true,
      })
      const result: CommandExecutionResult = { accepted: false, diagnostics: [issue] }
      this.set({
        lastCommandResult: {
          accepted: false,
          commandType: command.type,
          message: issue.message,
          at: new Date().toISOString(),
        },
      })
      return result
    }
    const result = await runtimeSession.commands.dispatch(command)
    if (!result.accepted) {
      this.set({
        lastCommandResult: {
          accepted: false,
          commandType: command.type,
          message: result.diagnostics[0]?.message ?? 'La acción no está disponible en este momento.',
          at: new Date().toISOString(),
        },
      })
      return result
    }
    this.set({
      lastCommandResult: {
        accepted: true,
        commandType: command.type,
        message: 'Acción realizada.',
        at: new Date().toISOString(),
      },
    })
    if (command.type === 'set-speed') this.workspace.speed = command.speed
    await runtimeSession.flush()
    await this.workspace.binding?.flush()
    this.updateWorkspaceView()
    if (runtimeSession.state() === 'completed') await this.finishActivity()
    return result
  }

  async workbenchCommand(command: HandlingCommand): Promise<void> {
    const workbench = this.workspace.workbench
    const runtimeSession = this.workspace.runtime?.activeSession()
    const activity = this.workspace.activity
    if (!workbench || !runtimeSession || !activity) {
      throw new Error('La actividad no tiene un banco virtual preparado.')
    }
    const result = this.workspace.calibreLab
      ? await this.workspace.calibreLab.workbenchCommand(command)
      : await workbench.dispatch(command)
    runtimeSession.events.emit({
      type: 'workbench-command',
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      sceneId: activity.sceneId,
      commandType: command.type,
      entityIds: result.event.instanceId ? [result.event.instanceId] : [],
      diagnosticCodes: result.event.diagnosticCodes,
      data: {
        ...result.event.evidence,
        accepted: result.accepted,
        mode: result.event.mode,
        workbenchEventType: result.event.type,
        toolId: result.event.toolId ?? null,
        instanceId: result.event.instanceId ?? null,
        partStates: workbench.parts().map(({ instanceId, state, orientation, trayZoneId }) => ({
          instanceId,
          state,
          orientation,
          trayZoneId: trayZoneId ?? null,
        })),
      },
    })
    if (this.workspace.calibreLab) {
      const calibreEvent = this.workspace.calibreLab.events().at(-1)
      runtimeSession.events.emit({
        type: 'calibre-lab-command',
        packageId: activity.packageId,
        packageVersion: activity.packageVersion,
        sceneId: activity.sceneId,
        commandType: `workbench:${command.type}`,
        entityIds: result.event.instanceId ? [result.event.instanceId] : [],
        diagnosticCodes: result.event.diagnosticCodes,
        data: {
          accepted: result.accepted,
          authority: calibreEvent?.authority ?? 'unknown',
          fixtureId: this.workspace.calibreLab.fixtureId,
          calibreEventType: calibreEvent?.type ?? `workbench:${command.type}`,
          instanceId: result.event.instanceId ?? null,
          toolId: result.event.toolId ?? null,
        },
      })
    }
    await runtimeSession.flush()
    await this.workspace.binding?.flush()
    const persistentSessionId = this.workspace.persistentSessionId
    if (
      persistentSessionId
      && result.accepted
      && ['checkpoint-created', 'part-placed-in-tray', 'part-installed'].includes(result.event.type)
    ) {
      await this.requiredSessionService().checkpoint(persistentSessionId, await this.createCheckpoint(false))
    }
    this.updateWorkspaceView()
  }

  async calibreLabCommand(command: CalibreLabCommand): Promise<void> {
    const lab = this.workspace.calibreLab
    const runtimeSession = this.workspace.runtime?.activeSession()
    const activity = this.workspace.activity
    if (!lab || !runtimeSession || !activity) throw new Error('La actividad no tiene un laboratorio de calibre preparado.')
    const result = await lab.dispatch(command)
    const snapshot = lab.snapshot()
    runtimeSession.events.emit({
      type: 'calibre-lab-command',
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      sceneId: activity.sceneId,
      commandType: command.type,
      entityIds: result.event.instanceId ? [result.event.instanceId] : [],
      diagnosticCodes: result.event.diagnosticCodes,
      data: {
        ...result.event.evidence,
        accepted: result.accepted,
        authority: result.event.authority ?? 'unknown',
        selectedSubsystemId: snapshot.selectedSubsystemId,
        selectedInstanceId: snapshot.selectedInstanceId ?? null,
        viewMode: snapshot.viewMode,
        documentationReviewed: snapshot.documentationReviewed,
        activeContextualLab: snapshot.activeContextualLab ?? null,
        activeFaults: snapshot.faults.filter(({ active }) => active).map(({ kind }) => kind),
        verificationIds: snapshot.verifications.map(({ id }) => id),
        hypothesisIds: snapshot.hypotheses.map(({ id }) => id),
        project: {
          passedChecks: snapshot.project.passedChecks,
          pendingChecks: snapshot.project.pendingChecks,
          recognizedLimitations: snapshot.project.recognizedLimitations,
        },
      },
    })
    await runtimeSession.flush()
    await this.workspace.binding?.flush()
    if (this.workspace.persistentSessionId && result.accepted) {
      await this.requiredSessionService().checkpoint(this.workspace.persistentSessionId, await this.createCheckpoint(false))
    }
    this.updateWorkspaceView()
  }

  async mechanicalLabCommand(command: MechanicalLabCommand): Promise<void> {
    const lab = this.workspace.mechanicalLab
    const runtimeSession = this.workspace.runtime?.activeSession()
    const activity = this.workspace.activity
    if (!lab || !runtimeSession || !activity) throw new Error('La actividad no tiene un laboratorio mecánico preparado.')
    const result = await lab.dispatch(command)
    const snapshot = lab.snapshot()
    runtimeSession.events.emit({
      type: 'mechanical-lab-command',
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      sceneId: activity.sceneId,
      commandType: command.type,
      entityIds: 'entityId' in command ? [command.entityId] : [],
      diagnosticCodes: result.event.diagnosticCodes,
      data: {
        ...result.event.evidence,
        accepted: result.accepted,
        commandType: command.type,
        subsystem: snapshot.selectedSubsystem,
        gearStages: snapshot.gearStages.map(({ id, driverTeeth, drivenTeeth, relation, engaged, centerDistanceState }) => ({
          id,
          driverTeeth,
          drivenTeeth,
          relation,
          engaged,
          centerDistanceState,
        })),
        blockedEntityIds: snapshot.blockedEntityIds,
        crownPosition: snapshot.crownPosition,
        activeFaults: snapshot.faults.filter(({ active }) => active).map(({ kind }) => kind),
        projectDraft: {
          enabledSubsystems: snapshot.projectDraft.enabledSubsystems,
          decisions: snapshot.projectDraft.decisions,
          passedChecks: snapshot.projectDraft.passedChecks,
          pendingChecks: snapshot.projectDraft.pendingChecks,
        },
      },
    })
    await runtimeSession.flush()
    await this.workspace.binding?.flush()
    if (this.workspace.persistentSessionId && result.accepted) {
      await this.requiredSessionService().checkpoint(this.workspace.persistentSessionId, await this.createCheckpoint(false))
    }
    this.updateWorkspaceView()
  }

  async saveAndExit(reason = 'user-save-exit'): Promise<void> {
    const id = this.workspace.persistentSessionId
    const runtimeSession = this.workspace.runtime?.activeSession()
    if (!id || !runtimeSession) return
    await this.workspace.binding?.flush()
    await this.requiredSessionService().checkpoint(id, await this.createCheckpoint(false))
    await runtimeSession.commands.dispatch({ type: 'cancel', reason })
    await this.workspace.binding?.flush()
    const current = await this.requiredRepository().getSession(id)
    if (current && ['active', 'paused', 'awaiting_interaction'].includes(current.state)) {
      await this.requiredSessionService().transition(id, 'suspended', reason)
    }
    await this.workspace.dispose()
    this.set({ workspace: undefined })
    this.navigate({ surface: 'session', id, query: {} })
    await this.refresh()
  }

  async cancelActivity(): Promise<void> {
    const id = this.workspace.persistentSessionId
    const runtimeSession = this.workspace.runtime?.activeSession()
    if (!id || !runtimeSession) return
    await runtimeSession.commands.dispatch({ type: 'cancel', reason: 'user-cancelled' })
    await this.workspace.binding?.flush()
    const current = await this.requiredRepository().getSession(id)
    if (current && ['ready', 'active', 'paused', 'awaiting_interaction'].includes(current.state)) {
      await this.requiredSessionService().transition(id, 'cancelled', 'user-cancelled')
    }
    await this.workspace.dispose()
    this.set({ workspace: undefined })
    this.navigate({ surface: 'sessions', query: {} })
    await this.refresh()
  }

  async performRecovery(sessionId: string, action: RecoveryAction): Promise<void> {
    const report = this.snapshotValue.recovery[sessionId] ?? await this.inspectRecovery(sessionId)
    if (!report.allowedActions.includes(action)) throw new Error(`La acción ${action} no está permitida.`)
    if (action === 'archive' || action === 'cancel') {
      await this.requiredSessionService().transition(sessionId, action === 'archive' ? 'archived' : 'cancelled', `recovery-${action}`)
      await this.refresh()
      this.navigate({ surface: 'sessions', query: {} })
      return
    }
    if (action === 'read-only-review') {
      this.navigate({ surface: 'session', id: sessionId, query: { mode: 'read-only' } })
      return
    }
    if (action === 'restart-new-attempt') {
      const source = await this.requiredRepository().getSession(sessionId)
      if (!source) throw new Error('Sesión inexistente.')
      const activity = this.activityDescriptor(source.activityId)
      const visual = await this.createActivityVisualContext(activity)
      let restarted: PersistentLearningSession
      try {
        restarted = await this.createPersistentSession(activity, visual.bridge, source.id, source.learningMode ?? 'authored')
      } finally {
        await visual.bridge.dispose()
        await visual.composition?.dispose()
      }
      try {
        await this.prepareExistingSession(restarted, false)
      } catch (error) {
        await this.failSessionPreparation(restarted.id)
        throw error
      }
      return
    }
    const session = await this.requiredRepository().getSession(sessionId)
    if (!session) throw new Error('Sesión inexistente.')
    await this.requiredSessionService().transition(sessionId, 'recovering', `recovery-${action}`)
    if (action === 'rebase' && session.checkpoint) {
      const fingerprint = await fingerprintTechnicalProject(this.project)
      await this.requiredSessionService().checkpoint(sessionId, {
        ...session.checkpoint,
        projectFingerprint: fingerprint,
        createdAt: new Date().toISOString(),
      })
    }
    try {
      await this.prepareExistingSession((await this.requiredRepository().getSession(sessionId))!, true)
    } catch (error) {
      await this.failSessionPreparation(sessionId)
      throw error
    }
  }

  async loadSessionEvents(sessionId: string, offset = 0): Promise<void> {
    const started = performance.now()
    const page = await this.requiredRepository().listEvents(sessionId, { offset, limit: PAGE_SIZE })
    this.set({ selectedSessionEvents: page })
    this.recordPerformance('events-page', performance.now() - started, page.items.length, 120)
  }

  async loadSessionsPage(offset: number): Promise<void> {
    const started = performance.now()
    const page = await this.requiredRepository().listSessions(
      this.requiredProfile().id,
      { offset: Math.max(0, offset), limit: PAGE_SIZE },
      true,
    )
    this.set({ sessions: page })
    this.recordPerformance('sessions-page', performance.now() - started, page.items.length, 120)
  }

  async loadEvidencePage(offset: number): Promise<void> {
    const started = performance.now()
    const page = await this.requiredRepository().listEvidence(
      this.requiredProfile().id,
      undefined,
      { offset: Math.max(0, offset), limit: PAGE_SIZE },
    )
    this.set({ evidence: page })
    this.recordPerformance('evidence-page', performance.now() - started, page.items.length, 120)
  }

  async loadAssessmentPage(offset: number): Promise<void> {
    const started = performance.now()
    const page = await this.requiredRepository().listAssessments(
      this.requiredProfile().id,
      undefined,
      { offset: Math.max(0, offset), limit: PAGE_SIZE },
    )
    this.set({ assessments: page })
    this.recordPerformance('assessments-page', performance.now() - started, page.items.length, 120)
  }

  async submitHumanReview(input: HumanReviewInput): Promise<HumanReviewResult> {
    const reviewerName = input.reviewerName.trim()
    const notes = input.notes.trim()
    if (reviewerName.length < 2 || reviewerName.length > 120) {
      throw new Error('Identifica a la persona revisora con un nombre de entre 2 y 120 caracteres.')
    }
    if (notes.length < 10 || notes.length > 2_000) {
      throw new Error('La revisión debe justificar la decisión con entre 10 y 2.000 caracteres.')
    }
    const repository = this.requiredRepository()
    const source = await repository.getEvidence(input.sourceEvidenceId)
    if (!source || source.profileId !== this.requiredProfile().id) throw new Error('La evidencia pendiente no existe en este perfil.')
    const reviewedActivity = this.activityDescriptor(source.activityId)
    const independentReviewRequired = Boolean(
      reviewedActivity.manufacturingContract
      || reviewedActivity.personalWatchDesignContract
      || reviewedActivity.validationContract,
    )
    if (
      independentReviewRequired
      && reviewerName.localeCompare(this.requiredProfile().displayName, undefined, { sensitivity: 'base' }) === 0
    ) {
      throw new Error('Esta práctica exige una persona revisora distinta del perfil que realizó la actividad.')
    }
    const evaluation = source.content.evaluation
    if (!evaluation || typeof evaluation !== 'object' || Array.isArray(evaluation)
      || (evaluation as Record<string, unknown>).pendingReview !== true) {
      throw new Error('La evidencia seleccionada no está pendiente de revisión humana.')
    }
    const related = (await repository.listEvidence(source.profileId, source.competencyId, { limit: 500 })).items
    if (related.some(({ status, relatedEvidenceId }) => status !== 'active' && relatedEvidenceId === source.id)) {
      throw new Error('Esta evidencia ya fue revisada o sustituida.')
    }

    const approved = input.decision === 'approved'
    const reviewedAt = new Date().toISOString()
    const criterionIds = [...new Set((input.criterionIds ?? []).map((id) => id.trim()).filter(Boolean))]
    const reviewData = {
      reviewerName,
      decision: input.decision,
      notes,
      criterionIds,
      sourceEvidenceId: source.id,
      evaluation: {
        complete: true,
        correct: approved,
        pendingReview: false,
        satisfiedComponentIds: approved ? criterionIds : [],
        unsatisfiedComponentIds: approved ? [] : criterionIds,
      },
    }
    const reviewBase = {
      schemaVersion: 1 as const,
      profileId: source.profileId,
      sessionId: source.sessionId,
      competencyId: source.competencyId,
      evidenceType: 'human-review' as const,
      sourceEventIds: [...source.sourceEventIds],
      packageId: source.packageId,
      packageVersion: source.packageVersion,
      activityId: source.activityId,
      activityVersion: source.activityVersion,
      extractionRuleId: `${source.extractionRuleId}.human-review`,
      extractionRuleVersion: source.extractionRuleVersion,
      content: reviewData,
      confidence: approved ? 1 : 0.25,
      uncertainty: approved ? undefined : 0.75,
      accessibilityAccommodations: [...source.accessibilityAccommodations],
      observedAt: reviewedAt,
      createdAt: reviewedAt,
      status: 'active' as const,
      relatedEvidenceId: source.id,
      provenance: [
        ...source.provenance,
        { kind: 'human-review' as const, reference: `${reviewerName} · ${reviewedAt}` },
      ],
    }
    const reviewHash = await sha256Fingerprint(reviewBase)
    const reviewEvidence: PersistentEvidenceRecord = {
      ...reviewBase,
      id: `evidence.${reviewHash.slice(7, 31)}`,
      hash: reviewHash,
    }
    const replacementBase = {
      ...source,
      id: undefined,
      hash: undefined,
      content: {
        ...source.content,
        evaluation: reviewData.evaluation,
        humanReview: {
          reviewEvidenceId: reviewEvidence.id,
          reviewerName,
          decision: input.decision,
          notes,
          criterionIds,
        },
      },
      confidence: approved ? Math.max(0.8, source.confidence) : Math.min(0.25, source.confidence),
      uncertainty: approved ? 0 : 0.75,
      observedAt: reviewedAt,
      createdAt: reviewedAt,
      relatedEvidenceId: source.id,
      provenance: [
        ...source.provenance,
        { kind: 'human-review' as const, reference: reviewEvidence.id },
      ],
    }
    const replacementWithoutIdentity = Object.fromEntries(
      Object.entries(replacementBase).filter(([key]) => key !== 'id' && key !== 'hash'),
    ) as unknown as Omit<PersistentEvidenceRecord, 'id' | 'hash'>
    const replacementHash = await sha256Fingerprint(replacementWithoutIdentity)
    const reviewedEvidence: PersistentEvidenceRecord = {
      ...replacementWithoutIdentity,
      id: `evidence.${replacementHash.slice(7, 31)}`,
      hash: replacementHash,
    }
    await repository.transaction(async (transaction) => {
      await transaction.addEvidence(reviewEvidence)
      await transaction.addEvidence(reviewedEvidence)
    })
    await this.requiredEvidenceEngine().supersede(source.id, reviewedEvidence.id, `Revisión humana: ${input.decision}.`)
    const rule = assessmentRuleForActivity(source.packageId, source.packageVersion, source.activityId)
    const assessment = await this.requiredAssessmentEngine().evaluate(source.profileId, rule, 'historical')
    const mastery = (await this.requiredMasteryEngine().rebuild(source.profileId))
      .find(({ competencyId }) => competencyId === source.competencyId)
    await this.refresh()
    return { reviewEvidence, reviewedEvidence, assessment, mastery }
  }

  async importPackage(bytes: Uint8Array): Promise<void> {
    await this.requiredCatalogController().install(bytes)
    await this.refresh()
  }

  async uninstallPackage(packageId: string, version: string): Promise<void> {
    await this.requiredCatalogController().uninstall(packageId, version)
    await this.refresh()
  }

  exportProfile(selection?: Partial<PersistentLearningExportSelection>): Promise<Uint8Array> {
    const profile = this.requiredProfile()
    return this.requiredExportService().exportProfile({
      profileId: profile.id,
      includeEvents: true,
      includeEvidence: true,
      includeAssessments: true,
      includeMastery: true,
      includePackages: false,
      ...selection,
    })
  }

  async createBackup(): Promise<LearningBackupRecord> {
    const backup = await this.requiredBackupManager().create('manual', true)
    await this.refresh()
    return backup
  }

  async restoreBackup(id: string): Promise<void> {
    const backup = this.snapshotValue.backups.find((candidate) => candidate.id === id)
    if (!backup) throw new Error('Backup inexistente.')
    await this.requiredBackupManager().restore(backup)
    await this.refresh()
  }

  previewProfileDeletion(): Promise<LearningDeletionPreview> {
    return this.requiredDeletionService().previewProfile(this.requiredProfile().id)
  }

  async deleteProfile(preview: LearningDeletionPreview, token: string): Promise<void> {
    await this.requiredDeletionService().execute(preview, token)
    if (preview.scope === 'profile' && typeof window !== 'undefined') {
      academyLocalStore().clear(preview.targetId)
    }
    const next = (await this.requiredRepository().listProfiles({ limit: 100 }, false)).items[0]
      ?? await this.requiredProfileService().ensureDefaultProfile('es-ES')
    this.set({ profile: next })
    await this.refresh()
  }

  async copyDiagnostic(): Promise<void> {
    if (!this.snapshotValue.error) return
    await navigator.clipboard.writeText(JSON.stringify(this.snapshotValue.error, null, 2))
  }

  async shutdown(reason = 'area-unmounted'): Promise<void> {
    if (this.disposed) return
    try {
      if (this.workspace.persistentSessionId) await this.saveAndExit(reason)
      await this.workspace.dispose()
      await this.repository?.close()
      await this.closeStorage?.()
    } finally {
      this.disposed = true
      this.navigationUnsubscribe?.()
      this.navigation.dispose()
      this.set({ status: 'disposed' })
    }
  }

  private async createPersistentSession(
    activity: LearningActivityDescriptor,
    bridge: ViewportLearningBridge,
    originSessionId?: string,
    learningMode: NonNullable<PersistentLearningSession['learningMode']> = 'authored',
  ): Promise<PersistentLearningSession> {
    const fingerprint = await fingerprintTechnicalProject(this.project)
    const profile = this.requiredProfile()
    const content = findIntegratedLearningContent(activity.packageId, activity.packageVersion)
    const activityVersion = content?.pack.activities.find(({ id }) => id === activity.id)?.version ?? activity.packageVersion
    const rubricVersion = content?.pack.rubrics.find(({ id }) => id === activity.rubricId)?.version ?? activity.packageVersion
    const previousAttempts = (await this.requiredRepository().listSessions(profile.id, { limit: 500 }, true))
      .items.filter(({ activityId }) => activityId === activity.id)
    const attempt = Math.max(0, ...previousAttempts.map(({ attempt: value }) => value)) + 1
    const capabilities = bridge.capabilities()
      .filter(({ status }) => status === 'available' || status === 'limited')
      .map(({ id }) => id)
    let session = await this.requiredSessionService().create({
      profileId: profile.id,
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      lessonId: activity.lessonId,
      activityId: activity.id,
      activityVersion,
      rubricId: activity.rubricId,
      rubricVersion,
      reference: activity.fixtureBinding
        ? activity.fixtureBinding.kind === 'fixture'
          ? { kind: 'fixture', fixtureId: activity.fixtureBinding.fixtureId }
          : {
            kind: 'composition',
            compositionId: activity.fixtureBinding.compositionId,
            fixtureIds: [...activity.fixtureBinding.fixtureIds],
          }
        : { kind: 'project', projectId: this.project.id },
      projectFingerprint: fingerprint,
      capabilities,
      runtimeVersion: RUNTIME_VERSION,
      attempt,
      learningMode,
      originSessionId,
    })
    session = await this.requiredSessionService().transition(session.id, 'preparing')
    return this.requiredSessionService().transition(session.id, 'ready')
  }

  private async prepareExistingSession(session: PersistentLearningSession, recover: boolean): Promise<void> {
    const activity = this.activityDescriptor(session.activityId)
    await this.workspace.dispose()
    const runtime = new LearningRuntime({ loader: new LearningPackageLoader({ applicationVersion: APP_VERSION }) })
    const content = findIntegratedLearningContent(session.packageId, session.packageVersion)
    if (!content) throw new Error(`No existe el binario integrado ${session.packageId}@${session.packageVersion}.`)
    const loaded = await loadIntegratedContentGraph(runtime, content)
    if (!loaded) throw new Error(`No se pudo registrar ${content.pack.manifest.id}.`)
    if (!loaded.success) throw new Error(loaded.diagnostics.map(({ message }) => message).join(' '))
    const visual = await this.createActivityVisualContext(activity)
    const compilation = runtime.prepareScene(
      session.packageId,
      session.packageVersion,
      activity.sceneId,
      visual.index,
      visual.bridge,
      this.project,
      this.requiredProfile().accessibility.reducedMotion,
    )
    if (!compilation.success) {
      await visual.bridge.dispose()
      await visual.composition?.dispose()
      await runtime.dispose()
      throw new Error(compilation.diagnostics.map(({ message }) => message).join(' '))
    }
    this.workspace.runtime = runtime
    this.workspace.bridge = visual.bridge
    this.workspace.composition = visual.composition
    this.workspace.activity = activity
    this.workspace.learningMode = session.learningMode ?? 'authored'
    this.workspace.assessmentMode = this.workspace.learningMode === 'retention' ? 'retention' : 'authored'
    if (activity.calibreLabContract) {
      this.workspace.calibreLab = new CalibreLearningLab(
        activity.calibreLabContract.modes[0],
        this.requiredProfile().accessibility.reducedMotion,
      )
    }
    if (activity.workbenchContract) {
      this.workspace.workbench = this.workspace.calibreLab?.workbench
        ?? new VirtualWorkbench(
          technicalFixture(activity.workbenchContract.fixtureId),
          activity.workbenchContract.modes[0],
        )
    }
    if (activity.mechanicalLabContract) {
      this.workspace.mechanicalLab = this.workspace.calibreLab?.mechanicalLab
        ?? new MechanicalLearningLab(this.requiredProfile().accessibility.reducedMotion)
    }
    this.workspace.persistentSessionId = session.id
    this.workspace.binding = this.requiredCoordinator().bind(session.id, runtime.activeSession()!.events)
    if (session.state === 'created') {
      await this.requiredSessionService().transition(session.id, 'preparing')
      await this.requiredSessionService().transition(session.id, 'ready')
    } else if (recover && session.state === 'recovering') {
      await this.requiredSessionService().transition(session.id, 'ready')
    }
    await runtime.activeSession()!.commands.dispatch({ type: 'start-scene' })
    const checkpoint = session.checkpoint
    if (checkpoint?.activeStepId) await runtime.activeSession()!.commands.dispatch({ type: 'jump-step', stepId: checkpoint.activeStepId })
    if (checkpoint?.timelinePositionMs) await runtime.activeSession()!.commands.dispatch({ type: 'scrub', timeMs: checkpoint.timelinePositionMs })
    const savedOverlay = checkpoint?.educationalState.overlay
    if (savedOverlay && typeof savedOverlay === 'object' && 'selectedEntityIds' in savedOverlay) {
      const selectedEntityIds = (savedOverlay as { selectedEntityIds?: unknown }).selectedEntityIds
      if (Array.isArray(selectedEntityIds) && typeof selectedEntityIds[0] === 'string') {
        await runtime.activeSession()!.commands.dispatch({ type: 'select-entity', entityId: selectedEntityIds[0] })
      }
    }
    const savedCalibreLab = checkpoint?.educationalState.calibreLab
    if (this.workspace.calibreLab && savedCalibreLab && typeof savedCalibreLab === 'object') {
      this.workspace.calibreLab.restore(savedCalibreLab as CalibreSessionSnapshot)
      if (activity.workbenchContract) this.workspace.workbench = this.workspace.calibreLab.workbench
      if (activity.mechanicalLabContract) this.workspace.mechanicalLab = this.workspace.calibreLab.mechanicalLab
    } else {
      const savedWorkbench = checkpoint?.educationalState.workbench
      if (this.workspace.workbench && savedWorkbench && typeof savedWorkbench === 'object') {
        this.workspace.workbench.restore(savedWorkbench as WorkbenchSnapshot)
      }
      const savedMechanicalLab = checkpoint?.educationalState.mechanicalLab
      if (this.workspace.mechanicalLab && savedMechanicalLab && typeof savedMechanicalLab === 'object') {
        this.workspace.mechanicalLab.restore(savedMechanicalLab as MechanicalLabSnapshot)
      }
    }
    for (const [questionId, answer] of Object.entries(checkpoint?.provisionalAnswers ?? {})) {
      await runtime.activeSession()!.commands.dispatch({ type: 'answer', questionId, answer })
    }
    await runtime.activeSession()!.flush()
    const persisted = await this.requiredRepository().getSession(session.id)
    if (persisted?.state === 'ready' || persisted?.state === 'recovering') {
      await this.requiredSessionService().transition(session.id, 'active', recover ? 'recovered-after-review' : 'new-attempt')
    }
    this.updateWorkspaceView()
    this.navigate({
      surface: 'workspace',
      id: activity.id,
      query: {
        recovered: recover ? '1' : '0',
        ...(this.workspace.learningMode === 'authored' ? {} : { mode: this.workspace.learningMode }),
      },
    })
    await this.refresh()
  }

  private async failSessionPreparation(sessionId: string): Promise<void> {
    await this.workspace.dispose()
    this.set({ workspace: undefined })
    const session = await this.requiredRepository().getSession(sessionId)
    if (session && ['preparing', 'ready', 'active', 'paused', 'awaiting_interaction', 'recovering'].includes(session.state)) {
      await this.requiredSessionService().transition(sessionId, 'failed', 'recovery-preparation-failed')
    }
    await this.refresh()
  }

  private async finishActivity(): Promise<void> {
    const id = this.workspace.persistentSessionId
    const activity = this.workspace.activity
    if (!id || !activity) return
    await this.workspace.binding?.flush()
    await this.requiredSessionService().checkpoint(id, await this.createCheckpoint(true))
    const beforeProjection = this.snapshotValue.mastery.items.find(({ competencyId }) =>
      competencyId === activity.competencyIds[0])
    const before = beforeProjection?.state ?? 'not_started'
    const content = findIntegratedLearningContent(activity.packageId, activity.packageVersion)
    const extractionRuleIds = activity.evidenceTemplateIds.flatMap((templateId) => {
      const extraction = content?.pack.evidenceTemplates.find(({ id }) => id === templateId)?.extraction
      return extraction ? [extraction.id] : []
    })
    if (extractionRuleIds.length === 0) {
      throw new Error(`La actividad ${activity.id} no tiene reglas de extracción de evidencia ejecutables.`)
    }
    await this.workspace.binding?.projectEvidence({
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      activityId: activity.id,
      evidenceTemplateIds: activity.evidenceTemplateIds,
      extractionRuleIds,
    })
    const authoredRule = assessmentRuleForActivity(
      activity.packageId,
      activity.packageVersion,
      activity.id,
    )
    const currentSessionEvidence = {
      op: 'evidence-from-session' as const,
      sessionId: id,
      minimumCount: 1,
    }
    const independentCurrentSession = {
      op: 'session-without-hints' as const,
      sessionId: id,
    }
    const demonstrationAttemptCondition = assessmentConditionForSingleAttempt(authoredRule.condition)
      ?? { op: 'minimum-evidence' as const, count: 1 }
    const retentionStage = beforeProjection?.reviewStage ?? 1
    const retentionIntervals = [1, 7, 21] as const
    const assessmentRule = this.workspace.learningMode === 'retention'
      ? {
        ...authoredRule,
        id: `${authoredRule.id}.retention.${retentionStage}`,
        targetState: 'retained' as const,
        condition: {
          op: 'all' as const,
          conditions: [
            authoredRule.condition,
            currentSessionEvidence,
            independentCurrentSession,
            {
              op: 'independent-later-evidence' as const,
              minimumDays: retentionIntervals[Math.min(3, Math.max(1, retentionStage)) - 1],
              differentSession: true,
            },
          ],
        },
      }
      : this.workspace.learningMode === 'demonstration'
        ? {
          ...authoredRule,
          id: `${authoredRule.id}.adaptive.demonstration`,
          targetState: 'demonstrated' as const,
          condition: {
            op: 'all' as const,
            conditions: [
              {
                op: 'in-session' as const,
                sessionId: id,
                condition: demonstrationAttemptCondition,
              },
              currentSessionEvidence,
              independentCurrentSession,
            ],
          },
        }
      : this.workspace.learningMode === 'transfer'
        ? {
          ...authoredRule,
          id: `${authoredRule.id}.adaptive.transfer`,
          targetState: 'demonstrated' as const,
          condition: {
            op: 'all' as const,
            conditions: [authoredRule.condition, currentSessionEvidence, independentCurrentSession],
          },
        }
      : authoredRule
    const assessment = await this.requiredAssessmentEngine().evaluate(
      this.requiredProfile().id,
      assessmentRule,
      'historical',
    )
    const mastery = (await this.requiredMasteryEngine().rebuild(this.requiredProfile().id))
      .find(({ competencyId }) => competencyId === activity.competencyIds[0])
    const completed = await this.requiredSessionService().transition(id, 'completed')
    const evidence = (await this.requiredRepository().listEvidence(this.requiredProfile().id, activity.competencyIds[0], { limit: PAGE_SIZE }))
      .items.filter(({ sessionId }) => sessionId === id)
    await this.workspace.binding?.dispose()
    this.workspace.binding = undefined
    const recommendation = this.viewModels.recommendations({
      ...this.snapshotValue,
      mastery: { items: mastery ? [mastery] : [], offset: 0, limit: PAGE_SIZE, total: mastery ? 1 : 0 },
      sessions: { items: [completed], offset: 0, limit: PAGE_SIZE, total: 1 },
    })[0]
    this.set({
      result: {
        session: completed,
        evidence,
        assessment,
        mastery,
        previousState: before,
        nextRecommendation: recommendation,
      },
      workspace: undefined,
    })
    await this.workspace.dispose()
    this.navigate({ surface: 'results', id, query: {} })
    await this.refresh()
  }

  private async createCheckpoint(final: boolean) {
    const sessionId = this.workspace.persistentSessionId
    const runtimeSession = this.workspace.runtime?.activeSession()
    const activity = this.workspace.activity
    if (!sessionId || !runtimeSession || !activity) throw new Error('No hay workspace preparado.')
    const events = await this.requiredRepository().listEvents(sessionId, { limit: 500 })
    const overlay = runtimeSession.currentOverlay()
    return {
      schemaVersion: 1 as const,
      packageId: activity.packageId,
      packageVersion: activity.packageVersion,
      sceneId: activity.sceneId,
      activeStepId: overlay.activeStepId,
      timelinePositionMs: runtimeSession.timelineTimeMs(),
      resolvedBarrierIds: [],
      provisionalAnswers: structuredClone(overlay.provisionalAnswers),
      hintIds: events.items
        .filter(({ type }) => type === 'hint-requested')
        .map(({ id, payload }) => {
          const data = payload.data && typeof payload.data === 'object'
            ? payload.data as Record<string, unknown>
            : {}
          return typeof data.hintId === 'string' ? data.hintId : id
        }),
      educationalState: {
        overlay,
        activityCompleted: final,
        ...(this.workspace.calibreLab ? { calibreLab: this.workspace.calibreLab.snapshot() } : {}),
        ...(this.workspace.workbench ? { workbench: this.workspace.workbench.snapshot() } : {}),
        ...(this.workspace.mechanicalLab ? { mechanicalLab: this.workspace.mechanicalLab.snapshot() } : {}),
      },
      lastPersistedSequence: events.items.at(-1)?.sequence ?? -1,
      projectFingerprint: await fingerprintTechnicalProject(this.project),
      capabilities: this.workspace.bridge?.capabilities()
        .filter(({ status }) => status === 'available' || status === 'limited')
        .map(({ id }) => id) ?? [],
      runtimeVersion: RUNTIME_VERSION,
      createdAt: new Date().toISOString(),
      complete: true,
    }
  }

  private async refreshRecoveryReports(): Promise<void> {
    const profile = this.snapshotValue.profile
    const recovery = this.recovery
    if (!profile || !recovery) return
    const interrupted = this.snapshotValue.sessions.items.filter(({ state }) => state === 'interrupted' || state === 'suspended' || state === 'failed')
    const reports = await Promise.all(interrupted.map(async (session) => [
      session.id,
      await this.inspectRecovery(session.id),
    ] as const))
    this.snapshotValue = { ...this.snapshotValue, recovery: Object.fromEntries(reports) }
  }

  private async inspectRecovery(sessionId: string): Promise<LearningRecoveryReport> {
    const session = await this.requiredRepository().getSession(sessionId)
    if (!session) throw new Error('Sesión inexistente.')
    const pack = await this.requiredRepository().getPackage(session.packageId, session.packageVersion)
    const exactContent = findIntegratedLearningContent(session.packageId, session.packageVersion)
    const currentContent = findCurrentIntegratedLearningContent(session.packageId)
    const activity = this.activityDescriptor(session.activityId)
    const visual = await this.createActivityVisualContext(activity)
    const currentCapabilities = visual.bridge.capabilities()
      .filter(({ status }) => status === 'available' || status === 'limited')
      .map(({ id }) => id)
    await visual.bridge.dispose()
    await visual.composition?.dispose()
    return this.requiredRecoveryController().service.inspect(sessionId, {
      packageAvailable: Boolean(pack || currentContent),
      exactPackageVersionAvailable: Boolean(pack && exactContent),
      projectAvailable: session.reference.kind === 'project' ? session.reference.projectId === this.project.id : true,
      currentProjectFingerprint: await fingerprintTechnicalProject(this.project),
      currentCapabilities,
      currentRuntimeVersion: RUNTIME_VERSION,
      migrationsPending: false,
      selectorsReproducible: true,
    })
  }

  private updateWorkspaceView(): void {
    const runtimeSession = this.workspace.runtime?.activeSession()
    const activity = this.workspace.activity
    const persistentSessionId = this.workspace.persistentSessionId
    if (!runtimeSession || !activity || !persistentSessionId) return
    const overlay = runtimeSession.currentOverlay()
    const content = findIntegratedLearningContent(activity.packageId, activity.packageVersion)
    const scene = content?.pack.scenes.find(({ id }) => id === activity.sceneId)
    const packLesson = content?.pack.lessons.find(({ id }) => id === activity.lessonId)
    const productLesson = this.snapshotValue.product.lessons.find(({ id }) => id === activity.lessonId)
    const module = this.snapshotValue.product.modules.find(({ lessonIds }) => lessonIds.includes(activity.lessonId))
    const route = this.snapshotValue.product.routes.find(({ moduleIds }) => module ? moduleIds.includes(module.id) : false)
    const fallbackTitle = { es: activity.title.es, en: activity.title.en }
    const durationMs = Math.max(
      0,
      ...runtimeSession.plan.timeline.map(({ atMs, durationMs }) => atMs + durationMs),
    )
    const progress = runtimeSession.progressSnapshot()
    const workspace: LearningWorkspaceViewModel = {
      persistentSessionId,
      learningMode: this.workspace.learningMode,
      runtimeState: runtimeSession.state(),
      activity,
      routeTitle: route?.title ?? fallbackTitle,
      lessonTitle: productLesson?.title ?? fallbackTitle,
      lessonPurpose: productLesson?.purpose ?? activity.description,
      steps: scene?.steps.map(({ id, instructionMarkdown, questions }) => ({
        id,
        instructionMarkdown,
        questions: structuredClone(questions),
      })) ?? runtimeSession.plan.steps.map(({ id, instructionMarkdown }) => ({
        id,
        instructionMarkdown,
        questions: [],
      })),
      answers: structuredClone(overlay.provisionalAnswers),
      answerEvaluations: structuredClone(progress.answerEvaluations),
      answerAttempts: { ...progress.answerAttempts },
      completedStepIds: [...progress.completedStepIds],
      stepAttempts: { ...progress.stepAttempts },
      sourceLabels: activity.sourceIds.map((sourceId) =>
        content?.pack.sources.find(({ id }) => id === sourceId)?.resource.title ?? sourceId),
      modelReference: packLesson?.authoring?.visualStrategy?.modelReference ?? 'active-project-v5-projection',
      unknownData: [...(packLesson?.authoring?.visualStrategy?.unknownData ?? [])],
      activeStepId: overlay.activeStepId,
      stepIds: runtimeSession.plan.steps.map(({ id }) => id),
      timelineMs: runtimeSession.timelineTimeMs(),
      durationMs,
      speed: this.workspace.speed,
      provisionalEvidenceCount: runtimeSession.events.history()
        .filter(({ type }) => type === 'selection-confirmed' || type === 'scene-completed').length,
      requestedHints: Array.isArray(overlay.temporalState.requestedHints)
        ? overlay.temporalState.requestedHints.flatMap((candidate) => {
          if (!candidate || typeof candidate !== 'object') return []
          const hint = candidate as Record<string, unknown>
          if (typeof hint.hintId !== 'string' || typeof hint.level !== 'number') return []
          return [{
            hintId: hint.hintId,
            level: hint.level,
            questionId: typeof hint.questionId === 'string' ? hint.questionId : undefined,
            content: typeof hint.content === 'string' ? hint.content : undefined,
          }]
        })
        : [],
      diagnostics: this.workspace.runtime?.diagnostics().map(({ code, message, technicalDetail }) => ({
        code,
        message,
        technical: technicalDetail,
      })) ?? [],
      accessibleEntities: runtimeSession.plan.selectorResolutions
        .flatMap(({ entities }) => entities)
        .filter((entity, index, values) => values.findIndex(({ id }) => id === entity.id) === index)
        .map((entity) => ({
          id: entity.id,
          label: entity.label,
          selected: overlay.selectedEntityIds.includes(entity.id),
        })),
      educationalVisual: this.workspace.composition
        ? {
          graphs: this.workspace.composition.mounted().map(({ sceneGraph }) => sceneGraph),
          state: this.workspace.composition.stateStore.state(),
        }
        : undefined,
      calibreLab: this.workspace.calibreLab
        ? (() => {
          const lab = this.workspace.calibreLab
          const state = lab.snapshot()
          const readinessCount = (readiness: string) => lab.audits.filter((audit) => audit.readiness === readiness).length
          const authorityValues = [...new Set(lab.operations.map(({ authority }) => authority))]
          return {
            fixtureId: lab.fixtureId,
            fixtureVersion: lab.fixtureVersion,
            mode: lab.mode(),
            selectedSubsystemId: state.selectedSubsystemId,
            selectedInstanceId: state.selectedInstanceId,
            viewMode: state.viewMode,
            documentationReviewed: state.documentationReviewed,
            disassemblyPlan: [...state.disassemblyPlan],
            disassemblyOperationIds: lab.operations.filter(({ phase }) => phase === 'disassembly').map(({ id }) => id),
            activeContextualLab: state.activeContextualLab,
            cameraBookmark: state.cameraBookmark,
            auditCounts: {
              definitions: new Set(lab.audits.map(({ canonicalId }) => canonicalId)).size,
              instances: lab.audits.length,
              ready: readinessCount('ready'),
              usableWithLimitations: readinessCount('usable-with-limitations'),
              documentaryOnly: readinessCount('documentary-only'),
              blocked: readinessCount('blocked'),
              unknown: readinessCount('unknown'),
            },
            subsystems: lab.subsystems.map(({ id, label, instanceIds, operationIds, limitations }) => ({
              id,
              label,
              instanceCount: instanceIds.length,
              operationCount: operationIds.length,
              limitations: [...limitations],
              selected: state.selectedSubsystemId === id,
            })),
            authorityCounts: authorityValues.map((authority) => ({
              authority,
              count: lab.operations.filter((operation) => operation.authority === authority).length,
            })),
            officialSourceIds: [...new Set(lab.audits.flatMap(({ sourceIds }) => sourceIds))],
            inspectionFindings: structuredClone(state.inspectionFindings),
            verifications: structuredClone(state.verifications),
            faults: structuredClone(state.faults),
            hypotheses: structuredClone(state.hypotheses),
            project: structuredClone(state.project),
            eventCount: state.events.length,
            accessibility: lab.accessibilityModel(),
          }
        })()
        : undefined,
      workbench: this.workspace.workbench
        ? (() => {
          const workbench = this.workspace.workbench
          const accessibility = workbench.accessibilityModel()
          return {
            mode: workbench.mode(),
            prepared: workbench.prepared(),
            energyIsolated: workbench.energyIsolated(),
            selectedToolId: workbench.selectedToolId(),
            zones: workbench.zones.map(({ id, label, kind, safe, warning }) => ({ id, label, kind, safe, warning })),
            tools: workbench.tools.map(({ id, label, capabilities, limitations }) => ({
              id,
              label,
              capabilities: [...capabilities],
              limitations: [...limitations],
              selected: workbench.selectedToolId() === id,
            })),
            parts: workbench.parts().map((part) => ({
              instanceId: part.instanceId,
              label: part.label,
              accessibleLabel: part.accessibleLabel,
              subsystem: part.subsystem,
              state: part.state,
              fastener: part.fastener,
              orientation: part.orientation,
              trayZoneId: part.trayZoneId,
              manipulable: !['blocked', 'unknown'].includes(part.state),
              selected: workbench.selectedInstanceId() === part.instanceId,
            })),
            trayZones: workbench.trayZones().map(({ id, label, order, instanceIds }) => ({ id, label, order, instanceIds })),
            warnings: workbench.warnings(),
            eventCount: workbench.events().length,
            keyboardActions: accessibility.actionMenu.map(({ id, label, keyboardShortcut }) => ({ id, label, keyboardShortcut })),
          }
        })()
        : undefined,
      mechanicalLab: this.workspace.mechanicalLab
        ? (() => {
          const lab = this.workspace.mechanicalLab
          const state = lab.snapshot()
          const ratio = lab.totalGearRatio()
          const accessibility = lab.accessibilityModel()
          return {
            subsystem: state.selectedSubsystem,
            viewMode: state.viewMode,
            energyLevel: state.energyLevel,
            blockedEntityIds: [...state.blockedEntityIds],
            gearStages: state.gearStages.map(({ id, driverTeeth, drivenTeeth, engaged, centerDistanceState }) => ({
              id,
              driverTeeth,
              drivenTeeth,
              engaged,
              centerDistanceState,
            })),
            totalRatio: ratio.totalRatio.value,
            finalDirection: ratio.finalDirection,
            supportState: state.supportState,
            escapementPhase: state.escapementPhase,
            escapementPaused: state.escapementPaused,
            escapementSpeed: state.escapementSpeed,
            oscillatorFrequencyHz: state.oscillatorFrequencyHz,
            oscillatorAmplitudeDegrees: state.oscillatorAmplitudeDegrees,
            oscillatorPaused: state.oscillatorPaused,
            hairspringActiveLength: state.hairspringActiveLength,
            motionWorksEngaged: state.motionWorksEngaged,
            indicatedMinutes: state.indicatedMinutes,
            crownPosition: state.crownPosition,
            automaticEnabled: state.automaticEnabled,
            automaticReversal: state.automaticReversal,
            calendarDay: state.calendarDay,
            calendarBlocked: state.calendarBlocked,
            activeFaults: state.faults.filter(({ active }) => active).map((fault) => ({
              kind: fault.kind,
              symptom: fault.symptom,
              hypothesis: fault.hypothesis,
              test: fault.test,
              allowedConclusion: fault.allowedConclusion,
              forbiddenConclusion: fault.forbiddenConclusion,
            })),
            entities: lab.entities.map(({ id, label, subsystem }) => ({
              id,
              label,
              subsystem,
              blocked: state.blockedEntityIds.includes(id),
            })),
            eventCount: state.events.length,
            reducedMotion: state.reducedMotion,
            textualRelations: accessibility.textualRelations,
            textualEnergyGraph: accessibility.textualEnergyGraph,
            escapementPhases: accessibility.staticEscapementPhases,
            projectDraft: structuredClone(state.projectDraft),
          }
        })()
        : undefined,
    }
    this.set({ workspace })
  }

  private productPrerequisites(activityId: string): string[] {
    const activity = this.snapshotValue.product.activities.find(({ id }) => id === activityId)
    const lesson = this.snapshotValue.product.lessons.find(({ activityIds }) => activityIds.includes(activityId))
    if (!lesson) return []
    const lessonConceptIds = new Set(lesson.conceptIds)
    // Un concepto enseñado en esta misma lección es contenido previo a la
    // práctica, no una competencia que deba haberse demostrado de antemano.
    // Solo las dependencias externas y los conceptos de otras lecciones forman
    // una puerta de dominio persistente.
    const explicitExternal = (activity?.pedagogicalContract?.requiresConceptIds ?? [])
      .filter((id) => !lessonConceptIds.has(id))
    return [
      ...effectiveLessonPrerequisiteConceptIds(lesson.id, lesson.prerequisiteConceptIds),
      ...explicitExternal,
      ...(lesson.externalPrerequisiteCompetencyIds ?? []),
    ].filter((id, index, values) => values.indexOf(id) === index)
  }

  private activityDescriptor(id: string): LearningActivityDescriptor {
    const activity = this.snapshotValue.product.activities.find((candidate) => candidate.id === id)
    if (!activity) throw new Error(`Actividad inexistente: ${id}.`)
    return activity
  }

  private recordPerformance(operation: string, durationMs: number, itemCount: number, thresholdMs: number): void {
    const sample: LearningPerformanceSample = {
      operation,
      durationMs: Math.round(durationMs * 100) / 100,
      itemCount,
      thresholdMs,
      exceeded: durationMs > thresholdMs,
      recordedAt: new Date().toISOString(),
    }
    this.snapshotValue = {
      ...this.snapshotValue,
      performance: [sample, ...this.snapshotValue.performance].slice(0, 30),
    }
    if (import.meta.env.DEV && sample.exceeded) console.warn('[learning:performance]', sample)
  }

  private fail(id: string, message: string, error: unknown, recovery: string): void {
    this.set({
      status: this.snapshotValue.status === 'initializing' ? 'error' : this.snapshotValue.status,
      error: {
        id,
        message,
        technical: error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error),
        recovery,
      },
    })
  }

  private set(patch: Partial<LearningApplicationSnapshot>): void {
    this.snapshotValue = { ...this.snapshotValue, ...patch }
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }

  private requiredRepository(): LearningRepository {
    if (!this.repository) throw new Error('El repositorio de Aprender no está inicializado.')
    return this.repository
  }

  private requiredProfile(): LearningProfile {
    if (!this.snapshotValue.profile) throw new Error('No hay perfil activo.')
    return this.snapshotValue.profile
  }

  private requiredProfileController(): LearningProfileController {
    if (!this.profile) throw new Error('El controlador de perfil no está inicializado.')
    return this.profile
  }

  private requiredCatalogController(): LearningCatalogController {
    if (!this.catalog) throw new Error('El catálogo no está inicializado.')
    return this.catalog
  }

  private requiredRecoveryController(): LearningRecoveryController {
    if (!this.recovery) throw new Error('Recuperación no está inicializada.')
    return this.recovery
  }

  private requiredProfileService(): LearningProfileService {
    if (!this.profileService) throw new Error('El servicio de perfil no está inicializado.')
    return this.profileService
  }

  private requiredSessionService(): LearningSessionService {
    if (!this.sessionService) throw new Error('El servicio de sesión no está inicializado.')
    return this.sessionService
  }

  private requiredCoordinator(): LearningPersistenceCoordinator {
    if (!this.persistenceCoordinator) throw new Error('La coordinación de persistencia no está inicializada.')
    return this.persistenceCoordinator
  }

  private requiredAssessmentEngine(): AssessmentEngine {
    if (!this.assessmentEngine) throw new Error('El evaluador no está inicializado.')
    return this.assessmentEngine
  }

  private requiredEvidenceEngine(): EvidenceProjectionEngine {
    if (!this.evidenceEngine) throw new Error('El proyector de evidencias no está inicializado.')
    return this.evidenceEngine
  }

  private requiredMasteryEngine(): MasteryProjectionEngine {
    if (!this.masteryEngine) throw new Error('El proyector de dominio no está inicializado.')
    return this.masteryEngine
  }

  private requiredExportService(): LearningExportService {
    if (!this.exportService) throw new Error('La exportación no está inicializada.')
    return this.exportService
  }

  private requiredBackupManager(): LearningBackupManager {
    if (!this.backupManager) throw new Error('Los backups no están inicializados.')
    return this.backupManager
  }

  private requiredDeletionService(): LearningDeletionService {
    if (!this.deletionService) throw new Error('El borrado no está inicializado.')
    return this.deletionService
  }
}

export function learningEntryHref(): string {
  const current = parseStoredLearningHref()
  return current || learningHref({ surface: 'home', query: {} })
}

function parseStoredLearningHref(): string | undefined {
  const value = window.sessionStorage.getItem('wplab.learning.last-location')
  return value?.startsWith('#/learning/') ? value : undefined
}
