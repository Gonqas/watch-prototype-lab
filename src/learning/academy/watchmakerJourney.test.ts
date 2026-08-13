import { describe, expect, it } from 'vitest'
import { INTEGRATED_LEARNING_PRODUCT_INDEX } from '../product/integratedContent'
import { coreAcademyRouteIds } from './academyCurriculum'
import {
  WATCHMAKER_JOURNEY,
  WATCHMAKER_JOURNEY_LEGACY_ID_REDIRECTS,
} from './watchmakerJourney'

describe('mapa profesional derivado del currículo', () => {
  it('usa exactamente la columna vertebral canónica, en el mismo orden', () => {
    expect(WATCHMAKER_JOURNEY.map(({ routeId }) => routeId)).toEqual(
      coreAcademyRouteIds(INTEGRATED_LEARNING_PRODUCT_INDEX),
    )
    expect(WATCHMAKER_JOURNEY.map(({ order }) => order)).toEqual(
      WATCHMAKER_JOURNEY.map((_, index) => index + 1),
    )
  })

  it('lleva cada etapa a su ruta real y conserva límites explícitos', () => {
    for (const stage of WATCHMAKER_JOURNEY) {
      expect(stage.href).toBe(`#/learning/route/${stage.routeId}`)
      expect(stage.outcome.length).toBeGreaterThan(30)
      expect(stage.scope.length).toBeGreaterThan(30)
    }
  })

  it('conserva los IDs públicos de las etapas que ya existían', () => {
    const publicIds = new Map(WATCHMAKER_JOURNEY.map(({ routeId, id }) => [routeId, id]))
    const expected = [
      ['route.horology.orientation', 'journey.systems-language'],
      ['route.horology.bench-foundations', 'journey.horology-bench-foundations'],
      ['route.mechanical.foundations', 'journey.mechanical-architecture'],
      ['route.miyota8215.complete', 'journey.reference-calibre'],
      ['route.encyclopedia.math-physics-metrology', 'journey-engineering-science'],
      ['route.metrology.physical-digital-bridge', 'journey-physical-metrology'],
      ['route.advanced.architectures-complications', 'journey-movement-design'],
      ['route.capstone.manufacturing-finishing', 'journey-cad-manufacturing'],
      ['route.capstone.personal-watch-design', 'journey-prototype-validation'],
      ['route.capstone.watch-validation', 'journey-capstone'],
    ] as const
    for (const [routeId, id] of expected) expect(publicIds.get(routeId)).toBe(id)
    expect(publicIds.has('route.encyclopedia.workshop-tools-materials')).toBe(false)
    expect(WATCHMAKER_JOURNEY_LEGACY_ID_REDIRECTS['journey-statistics'])
      .toBe('journey-engineering-science')
  })
})
