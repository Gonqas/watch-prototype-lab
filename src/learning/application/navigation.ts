export type LearningSurface =
  | 'home'
  | 'my-learning'
  | 'explore'
  | 'map'
  | 'workshop'
  | 'engineering'
  | 'metrology'
  | 'atlas'
  | 'review'
  | 'search'
  | 'notebook'
  | 'glossary'
  | 'sources'
  | 'onboarding'
  | 'route'
  | 'module'
  | 'lesson'
  | 'activity'
  | 'workspace'
  | 'session'
  | 'recovery'
  | 'evidence'
  | 'assessment'
  | 'competency'
  | 'movement'
  | 'package'
  | 'sessions'
  | 'progress'
  | 'history'
  | 'content'
  | 'profile'
  | 'preferences'
  | 'results'
  | 'not-found'

export interface LearningLocation {
  surface: LearningSurface
  id?: string
  query: Record<string, string>
}

const ID_SURFACES = new Set<LearningSurface>([
  'route', 'module', 'lesson', 'activity', 'session', 'recovery', 'evidence',
  'assessment', 'competency', 'movement', 'package',
])
const SURFACES = new Set<LearningSurface>([
  'home', 'my-learning', 'explore', 'map', 'workshop', 'engineering', 'metrology', 'atlas', 'review',
  'search', 'notebook', 'glossary', 'sources', 'onboarding',
  'route', 'module', 'lesson', 'activity', 'workspace',
  'session', 'recovery', 'evidence', 'assessment', 'competency', 'movement',
  'package', 'sessions', 'progress', 'history', 'content', 'profile',
  'preferences', 'results',
])

export function parseLearningLocation(url: URL = new URL(window.location.href)): LearningLocation {
  const raw = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const [path, queryText = ''] = raw.split('?')
  const segments = path.split('/').filter(Boolean)
  if (segments[0] !== 'learning') return { surface: 'home', query: {} }
  const surface = (segments[1] ?? 'home') as LearningSurface
  if (!SURFACES.has(surface)) return { surface: 'not-found', id: segments[1], query: {} }
  const query = Object.fromEntries(new URLSearchParams(queryText))
  const id = segments[2] ? decodeURIComponent(segments[2]) : undefined
  if (ID_SURFACES.has(surface) && !id) return { surface: 'not-found', id: surface, query }
  return { surface, id, query }
}

export function learningHref(location: LearningLocation): string {
  const id = location.id ? `/${encodeURIComponent(location.id)}` : ''
  const query = new URLSearchParams(
    Object.entries(location.query).filter(([, value]) => value.length > 0),
  ).toString()
  return `#/learning/${location.surface}${id}${query ? `?${query}` : ''}`
}

export class LearningNavigationState {
  private locationValue: LearningLocation
  private readonly listeners = new Set<() => void>()
  private readonly onHistory = () => {
    this.locationValue = parseLearningLocation()
    this.emit()
  }

  constructor(initial = parseLearningLocation()) {
    this.locationValue = initial
    window.addEventListener('hashchange', this.onHistory)
    window.addEventListener('popstate', this.onHistory)
  }

  current(): LearningLocation {
    return structuredClone(this.locationValue)
  }

  navigate(location: LearningLocation, replace = false): void {
    const href = learningHref(location)
    if (replace) history.replaceState({ learning: true }, '', href)
    else history.pushState({ learning: true }, '', href)
    this.locationValue = parseLearningLocation()
    this.emit()
  }

  updateQuery(patch: Record<string, string | undefined>, replace = true): void {
    const query = { ...this.locationValue.query }
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') delete query[key]
      else query[key] = value
    }
    this.navigate({ ...this.locationValue, query }, replace)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    window.removeEventListener('hashchange', this.onHistory)
    window.removeEventListener('popstate', this.onHistory)
    this.listeners.clear()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}
