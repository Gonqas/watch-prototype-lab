export type EngineeringLabId =
  | 'gear-train'
  | 'oscillator'
  | 'mainspring'
  | 'tolerances'
  | 'capability'
  | 'reliability'

export type LegacyEngineeringLabId = 'metrology' | 'cp-cpk'

export const LEGACY_ENGINEERING_LAB_ALIASES: Readonly<Record<LegacyEngineeringLabId, EngineeringLabId>> = {
  metrology: 'capability',
  'cp-cpk': 'capability',
}

const CURRENT_IDS = new Set<EngineeringLabId>([
  'gear-train',
  'oscillator',
  'mainspring',
  'tolerances',
  'capability',
  'reliability',
])

export function normalizeEngineeringLabId(value: string | null | undefined): EngineeringLabId {
  if (value && CURRENT_IDS.has(value as EngineeringLabId)) return value as EngineeringLabId
  if (value && value in LEGACY_ENGINEERING_LAB_ALIASES) {
    return LEGACY_ENGINEERING_LAB_ALIASES[value as LegacyEngineeringLabId]
  }
  return 'gear-train'
}
