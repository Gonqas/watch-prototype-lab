import { describe, expect, it } from 'vitest'
import {
  friendlyAssessmentSummary,
  friendlyFidelity,
  friendlyLearningTerm,
  friendlyRuntimeStatus,
  hasMeaningfulResponse,
  preferredEntityIdForPrompt,
} from './learningUiLanguage'

describe('learning UI language', () => {
  it('hides implementation vocabulary behind learner-friendly names', () => {
    expect(friendlyLearningTerm('motion-works')).toBe('Minutería')
    expect(friendlyLearningTerm('fixture.conceptual.quartz')).toBe('Reloj de cuarzo conceptual')
    expect(friendlyLearningTerm('stepper-rotor')).toBe('Rotor paso a paso')
    expect(friendlyLearningTerm('demonstration')).toBe('Demostración sin ayuda')
  })

  it('explains fidelity without requiring G/K/P knowledge', () => {
    const result = friendlyFidelity({
      geometry: 'G1',
      kinematics: 'K2',
      physics: 'P0',
      limitations: ['No expresa dimensiones oficiales.'],
    })
    expect(result.summary).toContain('forma educativa aproximada')
    expect(result.summary).toContain('movimiento educativo coordinado')
    expect(result.summary).toContain('sin simulación física')
    expect(result.details).toContain('No expresa dimensiones oficiales.')
  })

  it('translates assessment rule syntax into learner-facing feedback', () => {
    expect(friendlyAssessmentSummary('all; exists; minimum 4/1', true)).toContain('todos los pasos')
    expect(friendlyLearningTerm('competency.horology.identify-functional-subsystems'))
      .toBe('Funciones de las piezas del reloj')
  })

  it('turns runtime state into a concrete next action', () => {
    expect(friendlyRuntimeStatus('awaiting-interaction', true)).toMatchObject({
      label: 'Tu turno',
      instruction: 'Elige una respuesta para continuar',
      tone: 'action',
    })
  })

  it('recognises meaningful answer drafts', () => {
    expect(hasMeaningfulResponse('')).toBe(false)
    expect(hasMeaningfulResponse('option.transmission')).toBe(true)
    expect(hasMeaningfulResponse([])).toBe(false)
    expect(hasMeaningfulResponse({ confidence: 0.8 })).toBe(true)
  })

  it('finds the model part that should demonstrate a checked answer', () => {
    expect(preferredEntityIdForPrompt(
      'Selecciona la función que corresponde al tren de ruedas.',
      [
        { id: 'conceptual.case', label: 'Caja conceptual' },
        { id: 'conceptual.train', label: 'Tren conceptual' },
      ],
    )).toBe('conceptual.train')
  })
})
