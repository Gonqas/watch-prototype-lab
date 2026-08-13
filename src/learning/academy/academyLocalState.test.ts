import { describe, expect, it } from 'vitest'
import {
  AcademyLocalStore,
  createDefaultAcademyLocalState,
  type AcademyStorage,
} from './academyLocalState'

class MemoryStorage implements AcademyStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

describe('AcademyLocalStore', () => {
  it('mantiene estado UX local separado por perfil y recupera valores seguros', () => {
    const storage = new MemoryStorage()
    const store = new AcademyLocalStore(storage, () => '2026-07-27T10:00:00.000Z', () => 'note-1')
    expect(store.load('profile.a')).toEqual(createDefaultAcademyLocalState(
      'profile.a',
      '2026-07-27T10:00:00.000Z',
    ))

    store.setPreferences('profile.a', { lessonMode: 'textual', workspaceRatio: '65-35' })
    expect(store.load('profile.a').preferences).toMatchObject({
      lessonMode: 'textual',
      workspaceRatio: '65-35',
    })
    expect(store.load('profile.b').preferences.lessonMode).toBe('reading')
  })

  it('persiste onboarding, cuaderno privado y métricas agregadas sin datos pedagógicos', () => {
    const storage = new MemoryStorage()
    const store = new AcademyLocalStore(storage, () => '2026-07-27T11:00:00.000Z', () => 'note-1')
    store.completeOnboarding('profile.a', {
      experience: 'quartz-practice',
      hasDisassembledMovement: true,
      quartzKnowledge: 'practical',
      mechanicalKnowledge: 'basic',
      tools: ['lupa', 'pinzas'],
      goals: ['Comprender el 2035'],
      sessionMinutes: 25,
      accessibilityNeeds: ['reduced-motion'],
    })
    const note = store.createNote('profile.a', {
      title: 'Cadena funcional',
      body: 'Revisar la relación entre bobina y rotor.',
      tags: ['cuarzo'],
      context: { lessonId: 'lesson.horology.quartz-chain' },
    })
    store.recordMetric('profile.a', 'surface.home.open')
    store.recordMetric('profile.a', 'surface.home.open')
    const bookmark = store.createBookmark('profile.a', {
      title: 'Identificar 8215',
      href: '#/learning/lesson/lesson.miyota8215.identify',
      context: { lessonId: 'lesson.miyota8215.identify' },
    })
    const capture = store.createCapture('profile.a', {
      title: 'Escape en bloqueo',
      context: { activityId: 'activity.mechanical.escapement' },
      fixtureId: 'fixture.conceptual.mechanical-chain',
      camera: 'viewport-current',
      selectedIds: ['part.pallet-fork'],
      visualState: { timelineMs: 2000, reducedMotion: true },
      provenance: ['source.mechanical.educational'],
    })

    const loaded = store.load('profile.a')
    expect(loaded.onboarding.completed).toBe(true)
    expect(loaded.notes[0]).toMatchObject({ id: note.id, tags: ['cuarzo'] })
    expect(loaded.metrics).toContainEqual({
      id: 'surface.home.open',
      count: 2,
      lastRecordedAt: '2026-07-27T11:00:00.000Z',
    })
    expect(loaded.bookmarks[0]).toMatchObject({ id: bookmark.id, href: '#/learning/lesson/lesson.miyota8215.identify' })
    expect(loaded.captures[0]).toMatchObject({ id: capture.id, selectedIds: ['part.pallet-fork'] })
    expect(storage.values.values().next().value).not.toContain('evidence')
  })

  it('normaliza un payload corrupto sin afectar otras claves', () => {
    const storage = new MemoryStorage()
    const store = new AcademyLocalStore(storage, () => '2026-07-27T12:00:00.000Z')
    storage.setItem(store.key('profile.a'), '{"schemaVersion":99,"preferences":{"lessonMode":"unknown"}}')
    storage.setItem('learning-sessions', 'preservar')
    expect(store.load('profile.a').preferences.lessonMode).toBe('reading')
    expect(store.load('profile.a').preferences).toMatchObject({
      theme: 'system',
      readingWidth: 'comfortable',
      autoplayEducationalMotion: false,
    })
    expect(store.recoveryStatus('profile.a')).toMatchObject({
      recoveredUxState: true,
      reason: 'incompatible-ux',
    })
    store.clear('profile.a')
    expect(storage.getItem('learning-sessions')).toBe('preservar')
  })

  it('mantiene una copia volátil si el almacenamiento UX falla sin derribar Academia', () => {
    const values = new Map<string, string>()
    const storage: AcademyStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: () => { throw new DOMException('Quota exceeded', 'QuotaExceededError') },
      removeItem: () => undefined,
    }
    const store = new AcademyLocalStore(storage, () => '2026-07-28T10:00:00.000Z')
    store.setPreferences('profile.a', { theme: 'light' })
    expect(store.load('profile.a').preferences.theme).toBe('light')
    expect(store.recoveryStatus('profile.a')).toMatchObject({
      volatile: true,
      reason: 'storage-unavailable',
    })
  })

  it('hidrata el perfil persistente y conserva la copia local más reciente', () => {
    const storage = new MemoryStorage()
    let now = '2026-07-28T09:00:00.000Z'
    const store = new AcademyLocalStore(storage, () => now)
    const persisted = {
      ...createDefaultAcademyLocalState('profile.a', '2026-07-28T10:00:00.000Z'),
      preferences: {
        ...createDefaultAcademyLocalState('profile.a').preferences,
        lessonMode: 'textual' as const,
      },
    }

    expect(store.hydrateFromProfile('profile.a', persisted).preferences.lessonMode).toBe('textual')
    now = '2026-07-28T11:00:00.000Z'
    store.setPreferences('profile.a', { lessonMode: 'visual' })
    expect(store.hydrateFromProfile('profile.a', persisted).preferences.lessonMode).toBe('visual')
  })

  it('persiste el avance por segmentos y conserva la fecha de finalización al revisarlos', () => {
    const storage = new MemoryStorage()
    let now = '2026-07-28T10:00:00.000Z'
    const store = new AcademyLocalStore(storage, () => now)

    store.recordLessonSegment(
      'profile.a',
      'lesson.horology.system',
      'segment.pretraining',
      ['segment.orientation'],
      false,
    )
    expect(store.load('profile.a').lessonProgress[0]).toMatchObject({
      lessonId: 'lesson.horology.system',
      currentSegmentId: 'segment.pretraining',
      completedSegmentIds: ['segment.orientation'],
      completedAt: undefined,
    })

    now = '2026-07-28T10:05:00.000Z'
    store.recordLessonSegment(
      'profile.a',
      'lesson.horology.system',
      'segment.close',
      ['segment.orientation', 'segment.pretraining', 'segment.close'],
      true,
    )
    expect(store.load('profile.a').lessonProgress[0].completedAt).toBe(now)

    now = '2026-07-28T10:10:00.000Z'
    store.recordLessonSegment(
      'profile.a',
      'lesson.horology.system',
      'segment.pretraining',
      ['segment.orientation', 'segment.pretraining', 'segment.close'],
      false,
    )
    const reloadedStore = new AcademyLocalStore(storage, () => now)
    expect(reloadedStore.load('profile.a').lessonProgress[0]).toMatchObject({
      currentSegmentId: 'segment.pretraining',
      completedSegmentIds: ['segment.orientation', 'segment.pretraining', 'segment.close'],
      completedAt: '2026-07-28T10:05:00.000Z',
      updatedAt: '2026-07-28T10:10:00.000Z',
    })
  })
})
