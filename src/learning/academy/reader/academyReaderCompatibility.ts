import type { AcademyReaderMode } from './academyReaderModel'

export type AcademyLegacyLessonMode = 'reading' | 'visual' | 'split' | 'focus' | 'textual'

export interface AcademyLegacyReaderModeAlias {
  legacyMode: AcademyLegacyLessonMode
  readerMode: AcademyReaderMode
  reason: string
}

export const ACADEMY_LEGACY_READER_MODE_ALIASES: readonly AcademyLegacyReaderModeAlias[] = [
  { legacyMode: 'split', readerMode: 'learn', reason: 'Conserva texto y narrativa visual sincronizada.' },
  { legacyMode: 'visual', readerMode: 'learn', reason: 'El recurso visual queda subordinado al apartado activo.' },
  { legacyMode: 'reading', readerMode: 'read', reason: 'Conserva una lectura continua sin panel visual persistente.' },
  { legacyMode: 'focus', readerMode: 'read', reason: 'La lectura limpia se integra en el modo Leer.' },
  { legacyMode: 'textual', readerMode: 'read', reason: 'El texto completo sigue siendo la alternativa accesible canónica.' },
] as const

export function academyReaderModeFromLegacy(
  mode: AcademyLegacyLessonMode | undefined,
  readLabels = false,
): AcademyReaderMode {
  if (readLabels) return 'read'
  return ACADEMY_LEGACY_READER_MODE_ALIASES.find(({ legacyMode }) => legacyMode === mode)?.readerMode ?? 'learn'
}

export function academyLegacyModeForReader(mode: AcademyReaderMode): AcademyLegacyLessonMode {
  return mode === 'learn' ? 'split' : 'reading'
}
