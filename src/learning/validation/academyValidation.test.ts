import { describe, expect, it } from 'vitest'
import {
  ACCESSIBILITY_CHECKS,
  VALIDATION_PARTICIPANT_PROFILES,
  VALIDATION_PROTOCOLS,
  AccessibilityCheckSchema,
  ValidationParticipantProfileSchema,
  ValidationProtocolSchema,
  validateValidationCatalog,
} from './academyValidation'

describe('academy validation system', () => {
  it('defines valid participants, accessibility checks and protocols', () => {
    expect(ValidationParticipantProfileSchema.array().parse(VALIDATION_PARTICIPANT_PROFILES)).toHaveLength(4)
    expect(AccessibilityCheckSchema.array().parse(ACCESSIBILITY_CHECKS)).toHaveLength(5)
    expect(ValidationProtocolSchema.array().parse(VALIDATION_PROTOCOLS)).toHaveLength(5)
    expect(validateValidationCatalog()).toEqual([])
  })

  it('requires independent transfer cases and genuinely deferred attempts', () => {
    const transfer = VALIDATION_PROTOCOLS.filter(({ dimensions }) => dimensions.includes('calibre-transfer'))
    const retention = VALIDATION_PROTOCOLS.filter(({ dimensions }) => dimensions.includes('deferred-retention'))
    expect(transfer.every(({ transferCases }) => transferCases.length >= 2)).toBe(true)
    expect(retention.every(({ retentionIntervalsDays }) => new Set(retentionIntervalsDays).size >= 2)).toBe(true)
  })

  it('treats adverse findings as release blockers rather than cosmetic notes', () => {
    expect(VALIDATION_PROTOCOLS.every(({ adverseFindings, acceptanceCriteria, independenceRules }) =>
      adverseFindings.length > 0 && acceptanceCriteria.length > 0 && independenceRules.length > 0)).toBe(true)
  })
})
