export type AcademyLessonMode = 'reading' | 'visual' | 'split' | 'focus' | 'textual'
export type AcademyReaderMode = 'learn' | 'read'
export type AcademyDensity = 'comfortable' | 'compact'
export type AcademyWorkspaceRatio = '35-65' | '50-50' | '65-35'
export type AcademyTheme = 'system' | 'dark' | 'light'
export type AcademyReadingWidth = 'narrow' | 'comfortable' | 'wide'

export interface AcademyNoteContext {
  routeId?: string
  moduleId?: string
  lessonId?: string
  activityId?: string
  sceneId?: string
  fixtureId?: string
  instanceId?: string
  movementId?: string
  partId?: string
  termId?: string
  sourceId?: string
  evidenceId?: string
  stepId?: string
  specimenId?: string
  physicalComponentId?: string
  imageAssetId?: string
  instrumentId?: string
  measurementSeriesId?: string
  findingId?: string
  geometryProposalId?: string
}

export interface AcademyNote {
  id: string
  title: string
  body: string
  tags: string[]
  context: AcademyNoteContext
  createdAt: string
  updatedAt: string
}

export interface AcademyBookmark {
  id: string
  title: string
  href: string
  context: AcademyNoteContext
  createdAt: string
}

export interface AcademyCapture {
  id: string
  title: string
  dataUrl?: string
  context: AcademyNoteContext
  fixtureId?: string
  fixtureVersion?: string
  camera: string
  selectedIds: string[]
  visualState: Record<string, string | number | boolean>
  provenance: string[]
  createdAt: string
}

export interface AcademyOnboarding {
  completed: boolean
  experience: 'new' | 'quartz-practice' | 'mechanical-practice' | 'advanced'
  hasDisassembledMovement: boolean
  quartzKnowledge: 'none' | 'basic' | 'practical'
  mechanicalKnowledge: 'none' | 'basic' | 'practical'
  tools: string[]
  goals: string[]
  sessionMinutes: 15 | 25 | 45 | 60
  accessibilityNeeds: string[]
}

export interface AcademyUxPreferences {
  clarityModeVersion: 1
  lessonMode: AcademyLessonMode
  density: AcademyDensity
  workspaceRatio: AcademyWorkspaceRatio
  theme: AcademyTheme
  readingWidth: AcademyReadingWidth
  lineHeight: 1.5 | 1.7 | 1.9
  contextPanelOpen: boolean
  showTechnicalIds: boolean
  autoplayEducationalMotion: boolean
}

export interface AcademyLocalMetric {
  id: string
  count: number
  lastRecordedAt: string
}

export interface AcademyReviewSnooze {
  competencyId: string
  until: string
}

export interface AcademyLessonProgress {
  lessonId: string
  currentSegmentId: string
  completedSegmentIds: string[]
  activeSectionId?: string
  scrollAnchor?: string
  scrollOffset?: number
  documentVersion?: string
  visitedSectionIds?: string[]
  completedAt?: string
  updatedAt: string
}

export interface AcademyLocalState {
  schemaVersion: 1
  profileId: string
  onboarding: AcademyOnboarding
  preferences: AcademyUxPreferences
  notes: AcademyNote[]
  bookmarks: AcademyBookmark[]
  captures: AcademyCapture[]
  lessonProgress: AcademyLessonProgress[]
  reviewSnoozes: AcademyReviewSnooze[]
  metrics: AcademyLocalMetric[]
  updatedAt: string
}

export interface AcademyStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface AcademyLocalRecovery {
  recoveredUxState: boolean
  volatile: boolean
  reason?: 'invalid-json' | 'incompatible-ux' | 'storage-unavailable'
}

const STORAGE_PREFIX = 'wplab.academy.local.v1'
const lessonModes: AcademyLessonMode[] = ['reading', 'visual', 'split', 'focus', 'textual']
const densities: AcademyDensity[] = ['comfortable', 'compact']
const ratios: AcademyWorkspaceRatio[] = ['35-65', '50-50', '65-35']
const themes: AcademyTheme[] = ['system', 'dark', 'light']
const readingWidths: AcademyReadingWidth[] = ['narrow', 'comfortable', 'wide']
const lineHeights: AcademyUxPreferences['lineHeight'][] = [1.5, 1.7, 1.9]
const experiences: AcademyOnboarding['experience'][] = ['new', 'quartz-practice', 'mechanical-practice', 'advanced']
const knowledgeLevels: AcademyOnboarding['quartzKnowledge'][] = ['none', 'basic', 'practical']
const sessionMinutes: AcademyOnboarding['sessionMinutes'][] = [15, 25, 45, 60]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringArray(value: unknown, maximum = 24): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maximum)
    .map((item) => item.trim().slice(0, 120))
}

function enumValue<T extends string | number>(value: unknown, values: readonly T[], fallback: T): T {
  return (typeof value === 'string' || typeof value === 'number') && values.includes(value as T)
    ? value as T
    : fallback
}

function hasIncompatibleUxState(value: unknown): boolean {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.preferences)) return true
  const preferences = value.preferences
  return !lessonModes.includes(preferences.lessonMode as AcademyLessonMode)
    || !densities.includes(preferences.density as AcademyDensity)
    || !ratios.includes(preferences.workspaceRatio as AcademyWorkspaceRatio)
    || !themes.includes(preferences.theme as AcademyTheme)
    || !readingWidths.includes(preferences.readingWidth as AcademyReadingWidth)
    || !lineHeights.includes(preferences.lineHeight as AcademyUxPreferences['lineHeight'])
}

export function createDefaultAcademyLocalState(
  profileId: string,
  now: string = new Date().toISOString(),
): AcademyLocalState {
  return {
    schemaVersion: 1,
    profileId,
    onboarding: {
      completed: false,
      experience: 'new',
      hasDisassembledMovement: false,
      quartzKnowledge: 'none',
      mechanicalKnowledge: 'none',
      tools: [],
      goals: [],
      sessionMinutes: 25,
      accessibilityNeeds: [],
    },
    preferences: {
      clarityModeVersion: 1,
      lessonMode: 'reading',
      density: 'comfortable',
      workspaceRatio: '50-50',
      theme: 'system',
      readingWidth: 'comfortable',
      lineHeight: 1.7,
      contextPanelOpen: true,
      showTechnicalIds: false,
      autoplayEducationalMotion: false,
    },
    notes: [],
    bookmarks: [],
    captures: [],
    lessonProgress: [],
    reviewSnoozes: [],
    metrics: [],
    updatedAt: now,
  }
}

function normalizeNote(value: unknown): AcademyNote | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.body !== 'string') return undefined
  const context = isRecord(value.context) ? value.context : {}
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString()
  return {
    id: value.id.slice(0, 160),
    title: typeof value.title === 'string' ? value.title.slice(0, 200) : 'Nota',
    body: value.body.slice(0, 20_000),
    tags: stringArray(value.tags, 20),
    context: Object.fromEntries(
      Object.entries(context)
        .filter(([key, item]) => [
          'routeId', 'moduleId', 'lessonId', 'activityId', 'sceneId', 'fixtureId', 'instanceId',
          'movementId', 'partId', 'termId', 'sourceId', 'evidenceId', 'stepId',
        ].includes(key) && typeof item === 'string')
        .map(([key, item]) => [key, (item as string).slice(0, 200)]),
    ),
    createdAt,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : createdAt,
  }
}

function normalizeBookmark(value: unknown): AcademyBookmark | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.href !== 'string') return undefined
  const context = isRecord(value.context) ? value.context : {}
  return {
    id: value.id.slice(0, 160),
    title: value.title.trim().slice(0, 200) || 'Marcador',
    href: value.href.startsWith('#/learning/') ? value.href.slice(0, 500) : '#/learning/home',
    context: Object.fromEntries(
      Object.entries(context)
        .filter(([key, item]) => [
          'routeId', 'moduleId', 'lessonId', 'activityId', 'sceneId', 'fixtureId', 'instanceId',
          'movementId', 'partId', 'termId', 'sourceId', 'evidenceId', 'stepId',
        ].includes(key) && typeof item === 'string')
        .map(([key, item]) => [key, (item as string).slice(0, 200)]),
    ),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
  }
}

function normalizeCapture(value: unknown): AcademyCapture | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') return undefined
  const context = isRecord(value.context) ? value.context : {}
  const visualState = isRecord(value.visualState)
    ? Object.fromEntries(Object.entries(value.visualState).flatMap(([key, item]) =>
      typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        ? [[key, item] as [string, string | number | boolean]]
        : []).slice(0, 30))
    : {}
  return {
    id: value.id.slice(0, 160),
    title: value.title.trim().slice(0, 200) || 'Captura',
    dataUrl: typeof value.dataUrl === 'string' && /^data:image\/jpeg;base64,/.test(value.dataUrl) && value.dataUrl.length <= 500_000
      ? value.dataUrl
      : undefined,
    context: Object.fromEntries(
      Object.entries(context)
        .filter(([key, item]) => [
          'routeId', 'moduleId', 'lessonId', 'activityId', 'sceneId', 'fixtureId', 'instanceId',
          'movementId', 'partId', 'termId', 'sourceId', 'evidenceId', 'stepId',
        ].includes(key) && typeof item === 'string')
        .map(([key, item]) => [key, (item as string).slice(0, 200)]),
    ),
    fixtureId: typeof value.fixtureId === 'string' ? value.fixtureId.slice(0, 200) : undefined,
    fixtureVersion: typeof value.fixtureVersion === 'string' ? value.fixtureVersion.slice(0, 80) : undefined,
    camera: typeof value.camera === 'string' ? value.camera.slice(0, 120) : 'viewport-current',
    selectedIds: stringArray(value.selectedIds, 80),
    visualState,
    provenance: stringArray(value.provenance, 40),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
  }
}

function normalizeLessonProgress(value: unknown): AcademyLessonProgress | undefined {
  if (!isRecord(value) || typeof value.lessonId !== 'string' || typeof value.currentSegmentId !== 'string') return undefined
  return {
    lessonId: value.lessonId.slice(0, 200),
    currentSegmentId: value.currentSegmentId.slice(0, 240),
    completedSegmentIds: stringArray(value.completedSegmentIds, 80),
    activeSectionId: typeof value.activeSectionId === 'string' ? value.activeSectionId.slice(0, 240) : undefined,
    scrollAnchor: typeof value.scrollAnchor === 'string' ? value.scrollAnchor.slice(0, 240) : undefined,
    scrollOffset: typeof value.scrollOffset === 'number' && Number.isFinite(value.scrollOffset)
      ? Math.max(0, Math.round(value.scrollOffset))
      : undefined,
    documentVersion: typeof value.documentVersion === 'string' ? value.documentVersion.slice(0, 120) : undefined,
    visitedSectionIds: stringArray(value.visitedSectionIds, 240),
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString(),
  }
}

export function normalizeAcademyLocalState(profileId: string, value: unknown, now: string): AcademyLocalState {
  const fallback = createDefaultAcademyLocalState(profileId, now)
  if (!isRecord(value)) return fallback
  const onboarding = isRecord(value.onboarding) ? value.onboarding : {}
  const preferences = isRecord(value.preferences) ? value.preferences : {}
  const notes = Array.isArray(value.notes)
    ? value.notes.map(normalizeNote).filter((note): note is AcademyNote => Boolean(note)).slice(0, 500)
    : []
  const bookmarks = Array.isArray(value.bookmarks)
    ? value.bookmarks.map(normalizeBookmark).filter((item): item is AcademyBookmark => Boolean(item)).slice(0, 300)
    : []
  const captures = Array.isArray(value.captures)
    ? value.captures.map(normalizeCapture).filter((item): item is AcademyCapture => Boolean(item)).slice(0, 64)
    : []
  const lessonProgress = Array.isArray(value.lessonProgress)
    ? value.lessonProgress
      .map(normalizeLessonProgress)
      .filter((item): item is AcademyLessonProgress => Boolean(item))
      .slice(0, 500)
    : []
  const reviewSnoozes = Array.isArray(value.reviewSnoozes)
    ? value.reviewSnoozes.filter(isRecord).flatMap((item) =>
      typeof item.competencyId === 'string' && typeof item.until === 'string'
        ? [{ competencyId: item.competencyId.slice(0, 200), until: item.until }]
        : []).slice(0, 200)
    : []
  const metrics = Array.isArray(value.metrics)
    ? value.metrics.filter(isRecord).flatMap((metric) => {
      if (typeof metric.id !== 'string' || typeof metric.count !== 'number') return []
      return [{
        id: metric.id.slice(0, 160),
        count: Math.max(0, Math.floor(metric.count)),
        lastRecordedAt: typeof metric.lastRecordedAt === 'string' ? metric.lastRecordedAt : now,
      }]
    }).slice(0, 500)
    : []
  return {
    schemaVersion: 1,
    profileId,
    onboarding: {
      completed: onboarding.completed === true,
      experience: enumValue(onboarding.experience, experiences, fallback.onboarding.experience),
      hasDisassembledMovement: onboarding.hasDisassembledMovement === true,
      quartzKnowledge: enumValue(onboarding.quartzKnowledge, knowledgeLevels, fallback.onboarding.quartzKnowledge),
      mechanicalKnowledge: enumValue(onboarding.mechanicalKnowledge, knowledgeLevels, fallback.onboarding.mechanicalKnowledge),
      tools: stringArray(onboarding.tools, 20),
      goals: stringArray(onboarding.goals, 12),
      sessionMinutes: enumValue(onboarding.sessionMinutes, sessionMinutes, fallback.onboarding.sessionMinutes),
      accessibilityNeeds: stringArray(onboarding.accessibilityNeeds, 20),
    },
    preferences: {
      clarityModeVersion: 1,
      lessonMode: preferences.clarityModeVersion === 1
        ? enumValue(preferences.lessonMode, lessonModes, fallback.preferences.lessonMode)
        : 'reading',
      density: enumValue(preferences.density, densities, fallback.preferences.density),
      workspaceRatio: enumValue(preferences.workspaceRatio, ratios, fallback.preferences.workspaceRatio),
      theme: enumValue(preferences.theme, themes, fallback.preferences.theme),
      readingWidth: enumValue(preferences.readingWidth, readingWidths, fallback.preferences.readingWidth),
      lineHeight: enumValue(preferences.lineHeight, lineHeights, fallback.preferences.lineHeight),
      contextPanelOpen: preferences.contextPanelOpen !== false,
      showTechnicalIds: preferences.showTechnicalIds === true,
      autoplayEducationalMotion: preferences.autoplayEducationalMotion === true,
    },
    notes,
    bookmarks,
    captures,
    lessonProgress,
    reviewSnoozes,
    metrics,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

export class AcademyLocalStore {
  private readonly storage: AcademyStorage
  private readonly now: () => string
  private readonly createId: () => string
  private readonly volatileValues = new Map<string, string>()
  private readonly volatileOnly = new Set<string>()
  private readonly recovery = new Map<string, AcademyLocalRecovery>()

  constructor(
    storage: AcademyStorage,
    now: () => string = () => new Date().toISOString(),
    createId: () => string = () => crypto.randomUUID(),
  ) {
    this.storage = storage
    this.now = now
    this.createId = createId
  }

  key(profileId: string): string {
    return `${STORAGE_PREFIX}.${profileId}`
  }

  load(profileId: string): AcademyLocalState {
    const timestamp = this.now()
    const key = this.key(profileId)
    let raw: string | null
    try {
      raw = this.volatileOnly.has(key)
        ? this.volatileValues.get(key) ?? null
        : this.storage.getItem(key)
    } catch {
      raw = this.volatileValues.get(key) ?? null
      this.volatileOnly.add(key)
      this.recovery.set(profileId, {
        recoveredUxState: false,
        volatile: true,
        reason: 'storage-unavailable',
      })
    }
    if (!raw) return createDefaultAcademyLocalState(profileId, timestamp)
    try {
      const parsed = JSON.parse(raw) as unknown
      if (hasIncompatibleUxState(parsed)) {
        this.recovery.set(profileId, {
          recoveredUxState: true,
          volatile: this.volatileOnly.has(key),
          reason: 'incompatible-ux',
        })
      }
      return normalizeAcademyLocalState(profileId, parsed, timestamp)
    } catch {
      this.recovery.set(profileId, {
        recoveredUxState: true,
        volatile: this.volatileOnly.has(key),
        reason: 'invalid-json',
      })
      return createDefaultAcademyLocalState(profileId, timestamp)
    }
  }

  recoveryStatus(profileId: string): AcademyLocalRecovery {
    return this.recovery.get(profileId) ?? {
      recoveredUxState: false,
      volatile: this.volatileOnly.has(this.key(profileId)),
    }
  }

  update(
    profileId: string,
    updater: (state: AcademyLocalState) => AcademyLocalState,
  ): AcademyLocalState {
    const next = normalizeAcademyLocalState(profileId, updater(this.load(profileId)), this.now())
    next.updatedAt = this.now()
    const key = this.key(profileId)
    const serialized = JSON.stringify(next)
    this.volatileValues.set(key, serialized)
    try {
      this.storage.setItem(key, serialized)
      this.volatileOnly.delete(key)
    } catch {
      this.volatileOnly.add(key)
      this.recovery.set(profileId, {
        recoveredUxState: this.recoveryStatus(profileId).recoveredUxState,
        volatile: true,
        reason: 'storage-unavailable',
      })
    }
    return structuredClone(next)
  }

  hydrateFromProfile(profileId: string, value: unknown): AcademyLocalState {
    if (!isRecord(value) || hasIncompatibleUxState(value)) return this.load(profileId)
    const candidate = normalizeAcademyLocalState(profileId, value, this.now())
    const key = this.key(profileId)
    let stored: AcademyLocalState | undefined
    try {
      const raw = this.volatileOnly.has(key)
        ? this.volatileValues.get(key) ?? null
        : this.storage.getItem(key)
      if (raw) stored = normalizeAcademyLocalState(profileId, JSON.parse(raw) as unknown, this.now())
    } catch {
      stored = undefined
    }
    if (
      stored
      && Number.isFinite(Date.parse(stored.updatedAt))
      && Date.parse(stored.updatedAt) > Date.parse(candidate.updatedAt)
    ) return stored
    const serialized = JSON.stringify(candidate)
    this.volatileValues.set(key, serialized)
    try {
      this.storage.setItem(key, serialized)
      this.volatileOnly.delete(key)
    } catch {
      this.volatileOnly.add(key)
      this.recovery.set(profileId, {
        recoveredUxState: false,
        volatile: true,
        reason: 'storage-unavailable',
      })
    }
    return structuredClone(candidate)
  }

  setPreferences(profileId: string, patch: Partial<AcademyUxPreferences>): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      preferences: { ...state.preferences, ...patch },
    }))
  }

  completeOnboarding(profileId: string, input: Omit<AcademyOnboarding, 'completed'>): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      onboarding: { ...input, completed: true },
    }))
  }

  createNote(
    profileId: string,
    input: Pick<AcademyNote, 'title' | 'body' | 'tags' | 'context'>,
  ): AcademyNote {
    const timestamp = this.now()
    const note: AcademyNote = {
      id: `academy-note.${this.createId()}`,
      title: input.title.trim().slice(0, 200) || 'Nota',
      body: input.body.trim().slice(0, 20_000),
      tags: stringArray(input.tags, 20),
      context: structuredClone(input.context),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.update(profileId, (state) => ({ ...state, notes: [note, ...state.notes] }))
    return structuredClone(note)
  }

  updateNote(
    profileId: string,
    noteId: string,
    patch: Partial<Pick<AcademyNote, 'title' | 'body' | 'tags' | 'context'>>,
  ): AcademyNote | undefined {
    let changed: AcademyNote | undefined
    this.update(profileId, (state) => ({
      ...state,
      notes: state.notes.map((note) => {
        if (note.id !== noteId) return note
        changed = {
          ...note,
          ...structuredClone(patch),
          title: (patch.title ?? note.title).trim().slice(0, 200) || 'Nota',
          body: (patch.body ?? note.body).slice(0, 20_000),
          tags: patch.tags ? stringArray(patch.tags, 20) : note.tags,
          updatedAt: this.now(),
        }
        return changed
      }),
    }))
    return changed ? structuredClone(changed) : undefined
  }

  deleteNote(profileId: string, noteId: string): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      notes: state.notes.filter(({ id }) => id !== noteId),
    }))
  }

  createBookmark(
    profileId: string,
    input: Pick<AcademyBookmark, 'title' | 'href' | 'context'>,
  ): AcademyBookmark {
    const bookmark: AcademyBookmark = {
      id: `academy-bookmark.${this.createId()}`,
      title: input.title.trim().slice(0, 200) || 'Marcador',
      href: input.href.startsWith('#/learning/') ? input.href.slice(0, 500) : '#/learning/home',
      context: structuredClone(input.context),
      createdAt: this.now(),
    }
    this.update(profileId, (state) => ({
      ...state,
      bookmarks: [bookmark, ...state.bookmarks.filter(({ href }) => href !== bookmark.href)].slice(0, 300),
    }))
    return structuredClone(bookmark)
  }

  deleteBookmark(profileId: string, bookmarkId: string): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      bookmarks: state.bookmarks.filter(({ id }) => id !== bookmarkId),
    }))
  }

  createCapture(
    profileId: string,
    input: Omit<AcademyCapture, 'id' | 'createdAt'>,
  ): AcademyCapture {
    const capture: AcademyCapture = {
      ...structuredClone(input),
      id: `academy-capture.${this.createId()}`,
      createdAt: this.now(),
    }
    this.update(profileId, (state) => ({
      ...state,
      captures: [capture, ...state.captures].slice(0, 64),
    }))
    return structuredClone(capture)
  }

  deleteCapture(profileId: string, captureId: string): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      captures: state.captures.filter(({ id }) => id !== captureId),
    }))
  }

  recordLessonSegment(
    profileId: string,
    lessonId: string,
    segmentId: string,
    completedSegmentIds: string[],
    completed: boolean,
  ): AcademyLocalState {
    const timestamp = this.now()
    return this.update(profileId, (state) => {
      const normalizedLessonId = lessonId.slice(0, 200)
      const previous = state.lessonProgress.find((item) => item.lessonId === normalizedLessonId)
      const progress: AcademyLessonProgress = {
        lessonId: normalizedLessonId,
        currentSegmentId: segmentId.slice(0, 240),
        completedSegmentIds: stringArray(completedSegmentIds, 80),
        completedAt: previous?.completedAt ?? (completed ? timestamp : undefined),
        updatedAt: timestamp,
      }
      return {
        ...state,
        lessonProgress: [
          progress,
          ...state.lessonProgress.filter((item) => item.lessonId !== progress.lessonId),
        ].slice(0, 500),
      }
    })
  }

  recordReaderPosition(
    profileId: string,
    lessonId: string,
    input: {
      activeSectionId: string
      scrollAnchor: string
      scrollOffset: number
      documentVersion: string
      visitedSectionIds: string[]
    },
  ): AcademyLocalState {
    const timestamp = this.now()
    return this.update(profileId, (state) => {
      const normalizedLessonId = lessonId.slice(0, 200)
      const previous = state.lessonProgress.find((item) => item.lessonId === normalizedLessonId)
      const progress: AcademyLessonProgress = {
        lessonId: normalizedLessonId,
        currentSegmentId: previous?.currentSegmentId ?? input.activeSectionId.slice(0, 240),
        completedSegmentIds: previous?.completedSegmentIds ?? [],
        activeSectionId: input.activeSectionId.slice(0, 240),
        scrollAnchor: input.scrollAnchor.slice(0, 240),
        scrollOffset: Math.max(0, Math.round(input.scrollOffset)),
        documentVersion: input.documentVersion.slice(0, 120),
        visitedSectionIds: stringArray(input.visitedSectionIds, 240),
        completedAt: previous?.completedAt,
        updatedAt: timestamp,
      }
      return {
        ...state,
        lessonProgress: [
          progress,
          ...state.lessonProgress.filter((item) => item.lessonId !== progress.lessonId),
        ].slice(0, 500),
      }
    })
  }

  completeLesson(
    profileId: string,
    lessonId: string,
    activeSectionId: string,
    documentVersion: string,
  ): AcademyLocalState {
    const timestamp = this.now()
    return this.update(profileId, (state) => {
      const normalizedLessonId = lessonId.slice(0, 200)
      const previous = state.lessonProgress.find((item) => item.lessonId === normalizedLessonId)
      const progress: AcademyLessonProgress = {
        lessonId: normalizedLessonId,
        currentSegmentId: previous?.currentSegmentId ?? activeSectionId.slice(0, 240),
        completedSegmentIds: previous?.completedSegmentIds ?? [],
        activeSectionId: activeSectionId.slice(0, 240),
        scrollAnchor: previous?.scrollAnchor ?? activeSectionId.slice(0, 240),
        scrollOffset: previous?.scrollOffset ?? 0,
        documentVersion: documentVersion.slice(0, 120),
        visitedSectionIds: previous?.visitedSectionIds ?? [],
        completedAt: previous?.completedAt ?? timestamp,
        updatedAt: timestamp,
      }
      return {
        ...state,
        lessonProgress: [
          progress,
          ...state.lessonProgress.filter((item) => item.lessonId !== progress.lessonId),
        ].slice(0, 500),
      }
    })
  }

  postponeReview(profileId: string, competencyId: string, until: string): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      reviewSnoozes: [
        { competencyId: competencyId.slice(0, 200), until },
        ...state.reviewSnoozes.filter((item) => item.competencyId !== competencyId),
      ].slice(0, 200),
    }))
  }

  clearReviewSnooze(profileId: string, competencyId: string): AcademyLocalState {
    return this.update(profileId, (state) => ({
      ...state,
      reviewSnoozes: state.reviewSnoozes.filter((item) => item.competencyId !== competencyId),
    }))
  }

  recordMetric(profileId: string, metricId: string): AcademyLocalState {
    const timestamp = this.now()
    return this.update(profileId, (state) => {
      const existing = state.metrics.find(({ id }) => id === metricId)
      const metrics = existing
        ? state.metrics.map((metric) => metric.id === metricId
          ? { ...metric, count: metric.count + 1, lastRecordedAt: timestamp }
          : metric)
        : [{ id: metricId.slice(0, 160), count: 1, lastRecordedAt: timestamp }, ...state.metrics]
      return { ...state, metrics: metrics.slice(0, 500) }
    })
  }

  clearMetrics(profileId: string): AcademyLocalState {
    return this.update(profileId, (state) => ({ ...state, metrics: [] }))
  }

  clear(profileId: string): void {
    const key = this.key(profileId)
    this.volatileValues.delete(key)
    this.volatileOnly.delete(key)
    this.recovery.delete(profileId)
    try {
      this.storage.removeItem(key)
    } catch {
      // The explicit clear has already removed the in-memory copy.
    }
  }
}

let browserStore: AcademyLocalStore | undefined

export function academyLocalStore(): AcademyLocalStore {
  if (browserStore) return browserStore
  try {
    browserStore = new AcademyLocalStore(window.localStorage)
  } catch {
    const values = new Map<string, string>()
    browserStore = new AcademyLocalStore({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
      removeItem: (key) => { values.delete(key) },
    })
  }
  return browserStore
}

export const ACADEMY_LOCAL_STATE_EVENT = 'wplab-academy-local-state'
