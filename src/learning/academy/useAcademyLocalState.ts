import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  ACADEMY_LOCAL_STATE_EVENT,
  academyLocalStore,
  type AcademyBookmark,
  type AcademyCapture,
  type AcademyLocalState,
  type AcademyLocalRecovery,
  type AcademyNote,
  type AcademyOnboarding,
  type AcademyEditorialReview,
  type AcademyPersonalPracticeRecord,
  type AcademyUxPreferences,
} from './academyLocalState'
import type { AcademyReaderEvent, AcademyUsabilitySession } from './reader/academyReaderModel'
import type { WatchIntegrationProject } from './reader/personal/phase014k'

export interface AcademyLocalStateActions {
  setPreferences(patch: Partial<AcademyUxPreferences>): void
  completeOnboarding(input: Omit<AcademyOnboarding, 'completed'>): void
  createNote(input: Pick<AcademyNote, 'title' | 'body' | 'tags' | 'context'>): AcademyNote
  updateNote(noteId: string, patch: Partial<Pick<AcademyNote, 'title' | 'body' | 'tags' | 'context'>>): void
  deleteNote(noteId: string): void
  createBookmark(input: Pick<AcademyBookmark, 'title' | 'href' | 'context'>): AcademyBookmark
  deleteBookmark(bookmarkId: string): void
  createCapture(input: Omit<AcademyCapture, 'id' | 'createdAt'>): AcademyCapture
  deleteCapture(captureId: string): void
  recordLessonSegment(
    lessonId: string,
    segmentId: string,
    completedSegmentIds: string[],
    completed: boolean,
  ): void
  recordReaderPosition(
    lessonId: string,
    input: {
      activeSectionId: string
      scrollAnchor: string
      scrollOffset: number
      documentVersion: string
      visitedSectionIds: string[]
    },
  ): void
  completeLesson(lessonId: string, activeSectionId: string, documentVersion: string): void
  postponeReview(competencyId: string, until: string): void
  clearReviewSnooze(competencyId: string): void
  recordMetric(metricId: string): void
  clearMetrics(): void
  recordReaderEvent(input: Omit<AcademyReaderEvent, 'eventId' | 'timestamp'>): AcademyReaderEvent
  clearReaderEvents(): void
  saveEditorialReview(input: AcademyEditorialReview): AcademyEditorialReview
  savePersonalPractice(input: Pick<AcademyPersonalPracticeRecord, 'personalPracticeId' | 'lessonId' | 'note'>): AcademyPersonalPracticeRecord
  saveIntegrationProject(input: WatchIntegrationProject, expectedRevision?: number): WatchIntegrationProject
  deleteIntegrationProject(projectId: string): void
  setActiveIntegrationProject(projectId: string | undefined): void
  saveUsabilitySession(input: AcademyUsabilitySession): AcademyUsabilitySession
  deleteUsabilitySession(sessionId: string): void
}

export function useAcademyLocalState(profileId: string | undefined, persistedState?: unknown): {
  state: AcademyLocalState | undefined
  actions: AcademyLocalStateActions
  recovery: AcademyLocalRecovery | undefined
} {
  const store = useMemo(() => typeof window === 'undefined' ? undefined : academyLocalStore(), [])
  const devCorruptUxSeeded = useRef(false)
  const [revision, refresh] = useReducer((current: number) => current + 1, 0)
  const state = useMemo(() => {
    void revision
    if (!profileId || !store) return undefined
    return persistedState
      ? store.hydrateFromProfile(profileId, persistedState)
      : store.load(profileId)
  }, [persistedState, profileId, revision, store])

  useEffect(() => {
    if (
      !import.meta.env.DEV
      || !profileId
      || !store
      || devCorruptUxSeeded.current
      || new URLSearchParams(window.location.search).get('academy-corrupt-ux') !== '1'
    ) return
    const current = store.load(profileId)
    window.localStorage.setItem(store.key(profileId), JSON.stringify({
      ...current,
      schemaVersion: 99,
      preferences: { ...current.preferences, theme: 'invalid-dev-fixture' },
    }))
    devCorruptUxSeeded.current = true
    refresh()
  }, [profileId, store])

  const announce = useCallback((next: AcademyLocalState) => {
    window.dispatchEvent(new CustomEvent(ACADEMY_LOCAL_STATE_EVENT, {
      detail: { profileId: next.profileId },
    }))
  }, [])

  useEffect(() => {
    if (!profileId || !store) return
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ profileId?: string }>).detail
      if (!detail?.profileId || detail.profileId === profileId) refresh()
    }
    window.addEventListener(ACADEMY_LOCAL_STATE_EVENT, listener)
    return () => window.removeEventListener(ACADEMY_LOCAL_STATE_EVENT, listener)
  }, [profileId, store])

  const actions = useMemo<AcademyLocalStateActions>(() => ({
    setPreferences(patch) {
      if (profileId && store) announce(store.setPreferences(profileId, patch))
    },
    completeOnboarding(input) {
      if (profileId && store) announce(store.completeOnboarding(profileId, input))
    },
    createNote(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const note = store.createNote(profileId, input)
      announce(store.load(profileId))
      return note
    },
    updateNote(noteId, patch) {
      if (profileId && store) {
        store.updateNote(profileId, noteId, patch)
        announce(store.load(profileId))
      }
    },
    deleteNote(noteId) {
      if (profileId && store) announce(store.deleteNote(profileId, noteId))
    },
    createBookmark(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const bookmark = store.createBookmark(profileId, input)
      announce(store.load(profileId))
      return bookmark
    },
    deleteBookmark(bookmarkId) {
      if (profileId && store) announce(store.deleteBookmark(profileId, bookmarkId))
    },
    createCapture(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const capture = store.createCapture(profileId, input)
      announce(store.load(profileId))
      return capture
    },
    deleteCapture(captureId) {
      if (profileId && store) announce(store.deleteCapture(profileId, captureId))
    },
    recordLessonSegment(lessonId, segmentId, completedSegmentIds, completed) {
      if (profileId && store) {
        announce(store.recordLessonSegment(profileId, lessonId, segmentId, completedSegmentIds, completed))
      }
    },
    recordReaderPosition(lessonId, input) {
      if (profileId && store) announce(store.recordReaderPosition(profileId, lessonId, input))
    },
    completeLesson(lessonId, activeSectionId, documentVersion) {
      if (profileId && store) announce(store.completeLesson(profileId, lessonId, activeSectionId, documentVersion))
    },
    postponeReview(competencyId, until) {
      if (profileId && store) announce(store.postponeReview(profileId, competencyId, until))
    },
    clearReviewSnooze(competencyId) {
      if (profileId && store) announce(store.clearReviewSnooze(profileId, competencyId))
    },
    recordMetric(metricId) {
      if (profileId && store) announce(store.recordMetric(profileId, metricId))
    },
    clearMetrics() {
      if (profileId && store) announce(store.clearMetrics(profileId))
    },
    recordReaderEvent(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const event = store.recordReaderEvent(profileId, input)
      announce(store.load(profileId))
      return event
    },
    clearReaderEvents() {
      if (profileId && store) announce(store.clearReaderEvents(profileId))
    },
    saveEditorialReview(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const review = store.saveEditorialReview(profileId, input)
      announce(store.load(profileId))
      return review
    },
    savePersonalPractice(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const practice = store.savePersonalPractice(profileId, input)
      announce(store.load(profileId))
      return practice
    },
    saveIntegrationProject(input, expectedRevision) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const project = store.saveIntegrationProject(profileId,input,expectedRevision)
      announce(store.load(profileId))
      return project
    },
    deleteIntegrationProject(projectId) {
      if (profileId && store) announce(store.deleteIntegrationProject(profileId,projectId))
    },
    setActiveIntegrationProject(projectId) {
      if (profileId && store) announce(store.setActiveIntegrationProject(profileId,projectId))
    },
    saveUsabilitySession(input) {
      if (!profileId || !store) throw new Error('No hay un perfil local activo.')
      const session = store.saveUsabilitySession(profileId, input)
      announce(store.load(profileId))
      return session
    },
    deleteUsabilitySession(sessionId) {
      if (profileId && store) announce(store.deleteUsabilitySession(profileId, sessionId))
    },
  }), [announce, profileId, store])

  return {
    state,
    actions,
    recovery: profileId && store ? store.recoveryStatus(profileId) : undefined,
  }
}
