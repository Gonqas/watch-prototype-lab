import { academyVisualDefinitions } from '../../academyReaderCuration'

export type AcademyVisualReviewDecision = 'keep' | 'correct' | 'replace' | 'remove' | 'source-needed' | 'photo-needed'

export interface AcademyVisualReviewRecord {
  visualDesignId: string
  decision: AcademyVisualReviewDecision
  reason: string
  mobileReady: true
  colorIndependent: true
  textualAlternative: true
  readingModeRequired: boolean
}

const CORRECTED_VISUALS = new Set([
  'visual.miyota8215.architecture-automatic.v1',
  'visual.miyota8215.disassembly-sequence.v1',
  'visual.miyota8215.disassembly-rotor.v1',
])
const SOURCE_NEEDED_VISUALS = new Set(['visual.miyota8215.disassembly-barrel-bridge.v1'])

export function academyPersonalVisualReviews(): AcademyVisualReviewRecord[] {
  return academyVisualDefinitions().map((definition) => {
    const decision: AcademyVisualReviewDecision = SOURCE_NEEDED_VISUALS.has(definition.visualDesignId)
      ? 'source-needed'
      : CORRECTED_VISUALS.has(definition.visualDesignId) ? 'correct' : 'keep'
    const reason = decision === 'source-needed'
      ? 'La relación estructural puede mostrarse, pero una secuencia de servicio necesita una fuente adicional.'
      : decision === 'correct'
        ? 'Se conserva el diseño y se estrecha su texto para no presentar inferencias del despiece como procedimiento oficial.'
        : 'Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites.'
    return { visualDesignId: definition.visualDesignId, decision, reason, mobileReady: true, colorIndependent: true, textualAlternative: true, readingModeRequired: true }
  })
}


