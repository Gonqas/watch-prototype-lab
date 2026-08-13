export type LearningLocale = 'es-ES' | 'en-US'

const messages = {
  'es-ES': {
    area: 'Aprender',
    home: 'Inicio',
    myLearning: 'Mi aprendizaje',
    explore: 'Explorar',
    workshop: 'Taller',
    engineering: 'Ingeniería',
    metrology: 'Metrología',
    atlas: 'Atlas',
    review: 'Revisar',
    search: 'Buscar',
    notebook: 'Cuaderno',
    glossary: 'Glosario',
    sources: 'Fuentes',
    map: 'Mapa',
    sessions: 'Sesiones',
    progress: 'Progreso',
    history: 'Historial',
    content: 'Contenido',
    profile: 'Perfil',
    preferences: 'Preferencias',
    loading: 'Preparando Aprender',
    backToProject: 'Volver al proyecto técnico',
  },
  'en-US': {
    area: 'Learn',
    home: 'Home',
    myLearning: 'My learning',
    explore: 'Explore',
    workshop: 'Workshop',
    engineering: 'Engineering',
    metrology: 'Metrology',
    atlas: 'Atlas',
    review: 'Review',
    search: 'Search',
    notebook: 'Notebook',
    glossary: 'Glossary',
    sources: 'Sources',
    map: 'Map',
    sessions: 'Sessions',
    progress: 'Progress',
    history: 'History',
    content: 'Content',
    profile: 'Profile',
    preferences: 'Preferences',
    loading: 'Preparing Learn',
    backToProject: 'Return to technical project',
  },
} as const

export type LearningMessageKey = keyof typeof messages['es-ES']

export function normalizeLearningLocale(locale: string | undefined): LearningLocale {
  return locale?.toLowerCase().startsWith('en') ? 'en-US' : 'es-ES'
}

export function learningMessage(locale: string | undefined, key: LearningMessageKey): string {
  const normalized = normalizeLearningLocale(locale)
  const translated = messages[normalized][key]
  if (import.meta.env.DEV && !translated) console.warn(`[learning:i18n] Missing ${key} for ${normalized}.`)
  return translated ?? messages['es-ES'][key]
}

export function localize(
  locale: string | undefined,
  value: { es: string; en?: string },
): string {
  return normalizeLearningLocale(locale) === 'en-US' ? value.en ?? value.es : value.es
}

export function learningDate(locale: string | undefined, value: string): string {
  return new Intl.DateTimeFormat(normalizeLearningLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function learningNumber(locale: string | undefined, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(normalizeLearningLocale(locale), options).format(value)
}
