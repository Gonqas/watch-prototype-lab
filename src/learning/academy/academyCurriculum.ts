import type { LearningProductIndex } from '../product/demoPackage'

/**
 * Recorrido canónico de la Academia.
 *
 * Este grafo es deliberadamente independiente de los paquetes editoriales:
 * los paquetes declaran su contenido y este contrato declara cómo se encadena
 * para una persona que quiere llegar desde cero hasta diseñar su propio reloj.
 */
export interface AcademyCurriculumRoute {
  routeId: string
  order: number
  prerequisiteRouteIds: string[]
  strand: 'foundation' | 'quartz' | 'mechanical' | 'engineering' | 'capstone'
  /**
   * `core` forma la columna vertebral que lleva desde cero hasta el proyecto
   * propio. Las especializaciones y ampliaciones siguen teniendo
   * prerrequisitos, pero nunca bloquean el avance de esa columna vertebral.
   */
  role: 'core' | 'specialization' | 'enrichment'
  focus: Array<'understand' | 'parts' | 'service' | 'engineering' | 'compare' | 'design' | 'quartz' | 'history'>
}

export const ACADEMY_CURRICULUM: readonly AcademyCurriculumRoute[] = [
  { routeId: 'route.horology.orientation', order: 10, prerequisiteRouteIds: [], strand: 'foundation', role: 'core', focus: ['understand', 'parts', 'design'] },
  { routeId: 'route.encyclopedia.history-language', order: 20, prerequisiteRouteIds: ['route.horology.orientation'], strand: 'foundation', role: 'enrichment', focus: ['history', 'parts'] },
  { routeId: 'route.horology.bench-foundations', order: 30, prerequisiteRouteIds: ['route.horology.orientation'], strand: 'foundation', role: 'core', focus: ['parts', 'service', 'design'] },
  { routeId: 'route.encyclopedia.workshop-tools-materials', order: 40, prerequisiteRouteIds: ['route.horology.bench-foundations'], strand: 'foundation', role: 'enrichment', focus: ['service', 'engineering'] },
  { routeId: 'route.mechanical.foundations', order: 50, prerequisiteRouteIds: ['route.horology.orientation', 'route.horology.bench-foundations'], strand: 'mechanical', role: 'core', focus: ['understand', 'design'] },
  { routeId: 'route.encyclopedia.math-physics-metrology', order: 60, prerequisiteRouteIds: ['route.mechanical.foundations', 'route.horology.bench-foundations'], strand: 'engineering', role: 'core', focus: ['engineering', 'design'] },
  { routeId: 'route.metrology.physical-digital-bridge', order: 70, prerequisiteRouteIds: ['route.horology.bench-foundations', 'route.encyclopedia.math-physics-metrology'], strand: 'engineering', role: 'core', focus: ['engineering', 'service', 'design'] },
  { routeId: 'route.encyclopedia.quartz-electronics', order: 80, prerequisiteRouteIds: ['route.horology.orientation', 'route.encyclopedia.math-physics-metrology'], strand: 'quartz', role: 'specialization', focus: ['quartz', 'understand'] },
  { routeId: 'route.quartz2035.isa-to-2035', order: 90, prerequisiteRouteIds: ['route.encyclopedia.quartz-electronics', 'route.horology.bench-foundations'], strand: 'quartz', role: 'specialization', focus: ['quartz', 'service'] },
  { routeId: 'route.encyclopedia.mechanical-energy-trains', order: 100, prerequisiteRouteIds: ['route.mechanical.foundations', 'route.encyclopedia.math-physics-metrology'], strand: 'mechanical', role: 'core', focus: ['understand', 'engineering', 'design'] },
  { routeId: 'route.encyclopedia.escapements-chronometry', order: 110, prerequisiteRouteIds: ['route.encyclopedia.mechanical-energy-trains', 'route.metrology.physical-digital-bridge'], strand: 'mechanical', role: 'core', focus: ['understand', 'engineering', 'design'] },
  { routeId: 'route.encyclopedia.service-tribology', order: 120, prerequisiteRouteIds: ['route.encyclopedia.mechanical-energy-trains', 'route.metrology.physical-digital-bridge'], strand: 'engineering', role: 'core', focus: ['service', 'engineering', 'design'] },
  { routeId: 'route.encyclopedia.complications', order: 130, prerequisiteRouteIds: ['route.encyclopedia.escapements-chronometry', 'route.encyclopedia.service-tribology'], strand: 'mechanical', role: 'specialization', focus: ['understand', 'design'] },
  { routeId: 'route.miyota8215.complete', order: 140, prerequisiteRouteIds: ['route.encyclopedia.escapements-chronometry', 'route.encyclopedia.service-tribology'], strand: 'mechanical', role: 'core', focus: ['parts', 'service', 'compare', 'design'] },
  { routeId: 'route.encyclopedia.cases-water', order: 150, prerequisiteRouteIds: ['route.horology.bench-foundations', 'route.metrology.physical-digital-bridge'], strand: 'engineering', role: 'core', focus: ['engineering', 'design'] },
  { routeId: 'route.encyclopedia.micromechanics', order: 160, prerequisiteRouteIds: ['route.encyclopedia.math-physics-metrology', 'route.metrology.physical-digital-bridge'], strand: 'engineering', role: 'core', focus: ['engineering', 'design'] },
  { routeId: 'route.encyclopedia.dials-hands-finishing', order: 170, prerequisiteRouteIds: ['route.encyclopedia.cases-water', 'route.encyclopedia.micromechanics'], strand: 'engineering', role: 'core', focus: ['engineering', 'design'] },
  { routeId: 'route.encyclopedia.atlas-restoration-design', order: 180, prerequisiteRouteIds: ['route.miyota8215.complete', 'route.encyclopedia.dials-hands-finishing'], strand: 'engineering', role: 'specialization', focus: ['parts', 'service', 'compare'] },
  { routeId: 'route.advanced.comparative-atlas', order: 190, prerequisiteRouteIds: ['route.miyota8215.complete'], strand: 'engineering', role: 'specialization', focus: ['compare', 'parts'] },
  { routeId: 'route.advanced.service-method', order: 200, prerequisiteRouteIds: ['route.miyota8215.complete', 'route.encyclopedia.service-tribology', 'route.metrology.physical-digital-bridge'], strand: 'engineering', role: 'specialization', focus: ['service', 'compare'] },
  { routeId: 'route.advanced.architectures-complications', order: 210, prerequisiteRouteIds: ['route.encyclopedia.escapements-chronometry', 'route.miyota8215.complete', 'route.encyclopedia.math-physics-metrology'], strand: 'engineering', role: 'core', focus: ['engineering', 'compare', 'design'] },
  { routeId: 'route.capstone.manufacturing-finishing', order: 220, prerequisiteRouteIds: ['route.encyclopedia.micromechanics', 'route.encyclopedia.dials-hands-finishing', 'route.advanced.architectures-complications'], strand: 'capstone', role: 'core', focus: ['engineering', 'design'] },
  { routeId: 'route.capstone.personal-watch-design', order: 230, prerequisiteRouteIds: ['route.capstone.manufacturing-finishing', 'route.advanced.architectures-complications', 'route.miyota8215.complete'], strand: 'capstone', role: 'core', focus: ['design'] },
  { routeId: 'route.capstone.watch-validation', order: 240, prerequisiteRouteIds: ['route.capstone.personal-watch-design', 'route.metrology.physical-digital-bridge', 'route.miyota8215.complete'], strand: 'capstone', role: 'core', focus: ['design', 'engineering'] },
] as const

const curriculumByRoute = new Map(ACADEMY_CURRICULUM.map((entry) => [entry.routeId, entry]))

export function academyCurriculumRoute(routeId: string): AcademyCurriculumRoute | undefined {
  return curriculumByRoute.get(routeId)
}

export function canonicalAcademyRouteIds(product: LearningProductIndex): string[] {
  const realRouteIds = new Set(product.routes.filter(({ demo }) => !demo).map(({ id }) => id))
  const declared = ACADEMY_CURRICULUM
    .filter(({ routeId }) => realRouteIds.has(routeId))
    .sort((left, right) => left.order - right.order)
    .map(({ routeId }) => routeId)
  const undeclared = product.routes
    .filter(({ demo, id }) => !demo && !curriculumByRoute.has(id))
    .map(({ id }) => id)
    .sort()
  return [...declared, ...undeclared]
}

/** La única columna vertebral obligatoria de la Academia. */
export function coreAcademyRouteIds(product: LearningProductIndex): string[] {
  const realRouteIds = new Set(product.routes.filter(({ demo }) => !demo).map(({ id }) => id))
  return ACADEMY_CURRICULUM
    .filter(({ routeId, role }) => role === 'core' && realRouteIds.has(routeId))
    .sort((left, right) => left.order - right.order)
    .map(({ routeId }) => routeId)
}

export function optionalAcademyRouteIds(product: LearningProductIndex): string[] {
  const realRouteIds = new Set(product.routes.filter(({ demo }) => !demo).map(({ id }) => id))
  return ACADEMY_CURRICULUM
    .filter(({ routeId, role }) => role !== 'core' && realRouteIds.has(routeId))
    .sort((left, right) => left.order - right.order)
    .map(({ routeId }) => routeId)
}

export interface AcademyRoutePrerequisiteStatus {
  routeId: string
  requiredRouteIds: string[]
  missingRouteIds: string[]
  ready: boolean
}

export function academyRoutePrerequisiteStatus(
  routeId: string,
  completedRouteIds: ReadonlySet<string>,
): AcademyRoutePrerequisiteStatus {
  const requiredRouteIds = academyCurriculumRoute(routeId)?.prerequisiteRouteIds ?? []
  const missingRouteIds = requiredRouteIds.filter((id) => !completedRouteIds.has(id))
  return {
    routeId,
    requiredRouteIds: [...requiredRouteIds],
    missingRouteIds,
    ready: missingRouteIds.length === 0,
  }
}
