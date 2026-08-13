import { learningHref, parseLearningLocation } from '../application/navigation'

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const volatileSession = new Map<string, string>()

export function readUxSession(key: string, storage?: KeyValueStorage): string | null {
  try {
    const value = (storage ?? window.sessionStorage).getItem(key)
    if (value !== null) volatileSession.set(key, value)
    return value ?? volatileSession.get(key) ?? null
  } catch {
    return volatileSession.get(key) ?? null
  }
}

export function writeUxSession(key: string, value: string, storage?: KeyValueStorage): boolean {
  volatileSession.set(key, value)
  try {
    (storage ?? window.sessionStorage).setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeUxSession(key: string, storage?: KeyValueStorage): void {
  volatileSession.delete(key)
  try {
    (storage ?? window.sessionStorage).removeItem(key)
  } catch {
    // The in-memory fallback is already clear.
  }
}

export function recoverAcademyEntryHref(stored: string | null): string {
  if (!stored?.startsWith('#/learning/')) return '#/learning/home'
  try {
    const location = parseLearningLocation(new URL(stored, 'https://watchprototype.lab/'))
    return location.surface === 'not-found' ? '#/learning/home' : learningHref(location)
  } catch {
    return '#/learning/home'
  }
}

export function isLearningChunkError(error: Error): boolean {
  return /chunkloaderror|loading chunk|dynamically imported module|failed to fetch dynamically imported|importing a module script failed/i
    .test(`${error.name}: ${error.message}`)
}

export function shouldReloadLearningChunkOnce(
  error: Error,
  version: string,
  storage?: KeyValueStorage,
): boolean {
  if (!isLearningChunkError(error)) return false
  const key = `wplab.academy.chunk-reload.${version}`
  if (readUxSession(key, storage) === 'attempted') return false
  writeUxSession(key, 'attempted', storage)
  return true
}

export function clearLearningChunkRecovery(version: string, storage?: KeyValueStorage): void {
  removeUxSession(`wplab.academy.chunk-reload.${version}`, storage)
}

export function academyEntryCause(error: Error): string {
  if (isLearningChunkError(error)) return 'No se ha podido cargar una parte de la versión instalada.'
  if (error.name === 'EvalError' || /content security policy|unsafe-eval/i.test(error.message)) {
    return 'La política de seguridad bloqueó un componente de Academia.'
  }
  return 'Un componente de Academia ha fallado durante su apertura.'
}
