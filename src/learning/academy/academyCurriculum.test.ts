import { describe, expect, it } from 'vitest'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../product/integratedContent'
import {
  ACADEMY_CURRICULUM,
  academyRoutePrerequisiteStatus,
  canonicalAcademyRouteIds,
  coreAcademyRouteIds,
  optionalAcademyRouteIds,
} from './academyCurriculum'

describe('grafo curricular canónico de la Academia', () => {
  it('ordena desde orientación hasta la defensa del reloj propio', () => {
    expect(canonicalAcademyRouteIds(INTEGRATED_LEARNING_PRODUCT_INDEX)).toEqual([
      'route.horology.orientation',
      'route.encyclopedia.history-language',
      'route.horology.bench-foundations',
      'route.encyclopedia.workshop-tools-materials',
      'route.mechanical.foundations',
      'route.encyclopedia.math-physics-metrology',
      'route.metrology.physical-digital-bridge',
      'route.encyclopedia.quartz-electronics',
      'route.quartz2035.isa-to-2035',
      'route.encyclopedia.mechanical-energy-trains',
      'route.encyclopedia.escapements-chronometry',
      'route.encyclopedia.service-tribology',
      'route.encyclopedia.complications',
      'route.miyota8215.complete',
      'route.encyclopedia.cases-water',
      'route.encyclopedia.micromechanics',
      'route.encyclopedia.dials-hands-finishing',
      'route.encyclopedia.atlas-restoration-design',
      'route.advanced.comparative-atlas',
      'route.advanced.service-method',
      'route.advanced.architectures-complications',
      'route.capstone.manufacturing-finishing',
      'route.capstone.personal-watch-design',
      'route.capstone.watch-validation',
    ])
  })

  it('separa una columna vertebral única de ampliaciones que no la bloquean', () => {
    const core = coreAcademyRouteIds(INTEGRATED_LEARNING_PRODUCT_INDEX)
    const optional = optionalAcademyRouteIds(INTEGRATED_LEARNING_PRODUCT_INDEX)

    expect(core[0]).toBe('route.horology.orientation')
    expect(core.at(-1)).toBe('route.capstone.watch-validation')
    expect(optional).toEqual([
      'route.encyclopedia.history-language',
      'route.encyclopedia.workshop-tools-materials',
      'route.encyclopedia.quartz-electronics',
      'route.quartz2035.isa-to-2035',
      'route.encyclopedia.complications',
      'route.encyclopedia.atlas-restoration-design',
      'route.advanced.comparative-atlas',
      'route.advanced.service-method',
    ])
    const coreSet = new Set(core)
    for (const route of ACADEMY_CURRICULUM.filter(({ role }) => role === 'core')) {
      expect(route.prerequisiteRouteIds.every((routeId) => coreSet.has(routeId))).toBe(true)
    }
  })

  it('hace de orientación la única entrada disponible sin evidencia previa', () => {
    const ready = ACADEMY_CURRICULUM
      .filter(({ routeId }) => academyRoutePrerequisiteStatus(routeId, new Set()).ready)
      .map(({ routeId }) => routeId)
    expect(ready).toEqual(['route.horology.orientation'])
  })

  it('usa la base de banco para el avance técnico sin convertir la enciclopedia de taller en bloqueo', () => {
    const byId = new Map(ACADEMY_CURRICULUM.map((route) => [route.routeId, route]))

    expect(byId.get('route.horology.bench-foundations')).toMatchObject({
      role: 'core',
      prerequisiteRouteIds: ['route.horology.orientation'],
    })
    expect(byId.get('route.encyclopedia.workshop-tools-materials')).toMatchObject({
      role: 'enrichment',
      prerequisiteRouteIds: ['route.horology.bench-foundations'],
    })
    expect(byId.get('route.mechanical.foundations')?.prerequisiteRouteIds)
      .toContain('route.horology.bench-foundations')
    expect(byId.get('route.encyclopedia.math-physics-metrology')?.prerequisiteRouteIds)
      .toContain('route.horology.bench-foundations')
    expect(byId.get('route.metrology.physical-digital-bridge')?.prerequisiteRouteIds)
      .toContain('route.horology.bench-foundations')
    expect(byId.get('route.quartz2035.isa-to-2035')?.prerequisiteRouteIds)
      .toContain('route.horology.bench-foundations')
    expect(byId.get('route.encyclopedia.cases-water')?.prerequisiteRouteIds)
      .toContain('route.horology.bench-foundations')
  })

  it('es acíclico y todas las dependencias preceden a su ruta', () => {
    const order = new Map(ACADEMY_CURRICULUM.map(({ routeId }, index) => [routeId, index]))
    for (const route of ACADEMY_CURRICULUM) {
      for (const prerequisiteId of route.prerequisiteRouteIds) {
        expect(order.has(prerequisiteId)).toBe(true)
        expect(order.get(prerequisiteId)).toBeLessThan(order.get(route.routeId)!)
      }
    }
  })

  it('informa qué ruta concreta falta antes de desbloquear una especialización', () => {
    const completed = new Set(['route.horology.orientation', 'route.horology.bench-foundations'])
    expect(academyRoutePrerequisiteStatus('route.miyota8215.complete', completed)).toEqual({
      routeId: 'route.miyota8215.complete',
      requiredRouteIds: ['route.encyclopedia.escapements-chronometry', 'route.encyclopedia.service-tribology'],
      missingRouteIds: ['route.encyclopedia.escapements-chronometry', 'route.encyclopedia.service-tribology'],
      ready: false,
    })
  })
})
