import { describe, expect, it } from 'vitest'
import { learningHref, parseLearningLocation } from './navigation'

describe('navegación de producto de Aprender', () => {
  it('representa enlaces profundos con IDs neutros y filtros restaurables', () => {
    const href = learningHref({
      surface: 'activity',
      id: 'activity.demo.identify-case',
      query: { difficulty: 'introductory', language: 'es-ES', empty: '' },
    })

    expect(href).toBe('#/learning/activity/activity.demo.identify-case?difficulty=introductory&language=es-ES')
    expect(parseLearningLocation(new URL(`https://watch.local/${href}`))).toEqual({
      surface: 'activity',
      id: 'activity.demo.identify-case',
      query: { difficulty: 'introductory', language: 'es-ES' },
    })
  })

  it('resuelve inicio, rutas desconocidas e IDs codificados de forma segura', () => {
    expect(parseLearningLocation(new URL('https://watch.local/#/learning/home'))).toEqual({
      surface: 'home',
      query: {},
    })
    expect(parseLearningLocation(new URL('https://watch.local/#/learning/unknown'))).toEqual({
      surface: 'not-found',
      id: 'unknown',
      query: {},
    })
    expect(parseLearningLocation(new URL('https://watch.local/#/learning/session/session%3A1'))).toEqual({
      surface: 'session',
      id: 'session:1',
      query: {},
    })
  })

  it('no interpreta rutas ajenas como estado interno de Aprender', () => {
    expect(parseLearningLocation(new URL('https://watch.local/#/assembly'))).toEqual({
      surface: 'home',
      query: {},
    })
  })

  it('permite el perfil activo sin convertir el nombre visible en un ID', () => {
    expect(parseLearningLocation(new URL('https://watch.local/#/learning/profile'))).toEqual({
      surface: 'profile',
      query: {},
    })
  })

  it('mantiene deep links de las nuevas superficies de Academia', () => {
    for (const surface of ['my-learning', 'workshop', 'engineering', 'atlas', 'review', 'search', 'notebook', 'glossary', 'sources', 'onboarding'] as const) {
      expect(parseLearningLocation(new URL(`https://watch.local/#/learning/${surface}`))).toEqual({
        surface,
        query: {},
      })
    }
    expect(parseLearningLocation(new URL('https://watch.local/#/learning/atlas?fixture=fixture.miyota.8215.structural&part=part.anchor'))).toEqual({
      surface: 'atlas',
      query: {
        fixture: 'fixture.miyota.8215.structural',
        part: 'part.anchor',
      },
    })
  })
})
