import { describe, expect, it } from 'vitest'
import {
  academyEntryCause,
  clearLearningChunkRecovery,
  recoverAcademyEntryHref,
  shouldReloadLearningChunkOnce,
  type KeyValueStorage,
} from './academyEntryRecovery'

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

describe('recuperación de la entrada a Academia', () => {
  it('restaura rutas válidas y sustituye rutas UX incompatibles sin tocar datos educativos', () => {
    expect(recoverAcademyEntryHref('#/learning/lesson/lesson.miyota8215.identify')).toBe(
      '#/learning/lesson/lesson.miyota8215.identify',
    )
    expect(recoverAcademyEntryHref('#/learning/retired-surface')).toBe('#/learning/home')
    expect(recoverAcademyEntryHref('javascript:alert(1)')).toBe('#/learning/home')
    expect(recoverAcademyEntryHref(null)).toBe('#/learning/home')
  })

  it('permite una sola recarga por versión ante un error real de chunk', () => {
    const storage = new MemoryStorage()
    const chunkError = new TypeError('Failed to fetch dynamically imported module')
    expect(shouldReloadLearningChunkOnce(chunkError, '0.5.1', storage)).toBe(true)
    expect(shouldReloadLearningChunkOnce(chunkError, '0.5.1', storage)).toBe(false)
    expect(shouldReloadLearningChunkOnce(chunkError, '0.5.2', storage)).toBe(true)
    clearLearningChunkRecovery('0.5.1', storage)
    expect(shouldReloadLearningChunkOnce(chunkError, '0.5.1', storage)).toBe(true)
  })

  it('no recarga por errores de contenido o CSP y devuelve una causa comprensible', () => {
    const storage = new MemoryStorage()
    const cspError = new EvalError("unsafe-eval violates Content Security Policy")
    expect(shouldReloadLearningChunkOnce(cspError, '0.5.1', storage)).toBe(false)
    expect(academyEntryCause(cspError)).toMatch(/política de seguridad/i)
  })
})
