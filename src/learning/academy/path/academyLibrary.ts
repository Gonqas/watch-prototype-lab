export type AcademyLibraryRouteGroupId = 'main-path' | 'specializations' | 'extensions' | 'historical-cases' | 'reference'

export interface AcademyLibraryRouteGroup {
  groupId: AcademyLibraryRouteGroupId
  title: string
  description: string
  routeIds: string[]
}

export const ACADEMY_LIBRARY_ROUTE_GROUPS: readonly AcademyLibraryRouteGroup[] = [
  {
    groupId: 'main-path',
    title: 'Ruta principal',
    description: 'Rutas fuente que aportan anchors a las ocho etapas. La navegación principal las presenta como capítulos curados.',
    routeIds: [
      'route.horology.orientation',
      'route.horology.bench-foundations',
      'route.mechanical.foundations',
      'route.metrology.physical-digital-bridge',
      'route.encyclopedia.mechanical-energy-trains',
      'route.encyclopedia.escapements-chronometry',
      'route.encyclopedia.service-tribology',
      'route.miyota8215.complete',
      'route.encyclopedia.cases-water',
      'route.encyclopedia.micromechanics',
      'route.encyclopedia.dials-hands-finishing',
      'route.advanced.architectures-complications',
      'route.capstone.manufacturing-finishing',
      'route.capstone.personal-watch-design',
      'route.capstone.watch-validation',
    ],
  },
  {
    groupId: 'specializations',
    title: 'Especializaciones',
    description: 'Ramas voluntarias que nunca bloquean la columna vertebral mecánica.',
    routeIds: [
      'route.encyclopedia.quartz-electronics',
      'route.quartz2035.isa-to-2035',
      'route.encyclopedia.complications',
      'route.advanced.comparative-atlas',
      'route.advanced.service-method',
    ],
  },
  {
    groupId: 'extensions',
    title: 'Ampliaciones',
    description: 'Contexto y herramientas para profundizar sin inflar el progreso principal.',
    routeIds: [
      'route.encyclopedia.history-language',
      'route.encyclopedia.workshop-tools-materials',
    ],
  },
  {
    groupId: 'historical-cases',
    title: 'Casos históricos',
    description: 'Transferencia, restauración y documentación histórica; no se tratan como instrucciones modernas automáticas.',
    routeIds: ['route.encyclopedia.atlas-restoration-design'],
  },
  {
    groupId: 'reference',
    title: 'Consulta',
    description: 'Matemáticas, física y metrología disponibles justo cuando una decisión técnica las necesita.',
    routeIds: ['route.encyclopedia.math-physics-metrology'],
  },
] as const

export const ACADEMY_LIBRARY_DESTINATION_GROUPS = [
  {
    title: 'APRENDER Y PROFUNDIZAR',
    destinations: [
      { surface: 'explore', label: 'Explorar todas las rutas' },
      { surface: 'engineering', label: 'Ingeniería' },
      { surface: 'atlas', label: 'Atlas' },
      { surface: 'review', label: 'Repaso' },
    ],
  },
  {
    title: 'CONSULTAR',
    destinations: [
      { surface: 'search', label: 'Buscar' },
      { surface: 'notebook', label: 'Cuaderno' },
      { surface: 'glossary', label: 'Glosario' },
      { surface: 'sources', label: 'Fuentes' },
    ],
  },
  {
    title: 'GESTIONAR',
    destinations: [
      { surface: 'progress', label: 'Progreso completo' },
      { surface: 'content', label: 'Contenido local' },
      { surface: 'profile', label: 'Perfil local' },
      { surface: 'preferences', label: 'Preferencias' },
    ],
  },
] as const
