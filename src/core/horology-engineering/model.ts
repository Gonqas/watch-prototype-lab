import type { EngineeringQuantity } from './units'

export type CalculationLevel =
  | 'educational'
  | 'engineering-preview'
  | 'engineering-validated'

export type FormulaVerification =
  | 'dimensionally-checked'
  | 'source-reviewed'
  | 'experimentally-validated'

export type CalculationValidity =
  | 'within-domain'
  | 'caution'
  | 'outside-domain'
  | 'invalid'

export interface EngineeringSource {
  id: string
  title: string
  publisherOrAuthor: string
  url?: string
  locator?: string
  retrievedAt?: string
  contentHash?: string
  role: 'definition' | 'derivation' | 'example' | 'comparison'
}

export interface EngineeringFormula {
  id: string
  version: string
  title: string
  expression: string
  level: CalculationLevel
  verification: FormulaVerification
  domain: string[]
  assumptions: string[]
  limitations: string[]
  sourceIds: string[]
}

export interface CalculationNotice {
  severity: 'info' | 'warning' | 'error'
  code: string
  message: string
}

export interface EngineeringCalculationRun {
  schemaVersion: 1
  id: string
  formulaId: string
  formulaVersion: string
  title: string
  createdAt: string
  level: CalculationLevel
  verification: FormulaVerification
  validity: CalculationValidity
  domain: string[]
  inputs: Record<string, EngineeringQuantity>
  outputs: Record<string, EngineeringQuantity>
  assumptions: string[]
  limitations: string[]
  notices: CalculationNotice[]
  sourceIds: string[]
}

function stableRecord(record: Record<string, EngineeringQuantity>): string {
  return Object.entries(record)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value.value}:${value.unit}:${value.provenance ?? ''}:${value.sourceId ?? ''}`)
    .join('|')
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function createCalculationRun({
  formula,
  inputs,
  outputs,
  validity = 'within-domain',
  notices = [],
  createdAt = new Date().toISOString(),
}: {
  formula: EngineeringFormula
  inputs: Record<string, EngineeringQuantity>
  outputs: Record<string, EngineeringQuantity>
  validity?: CalculationValidity
  notices?: CalculationNotice[]
  createdAt?: string
}): EngineeringCalculationRun {
  const fingerprint = fnv1a([
    formula.id,
    formula.version,
    stableRecord(inputs),
    stableRecord(outputs),
  ].join('|'))
  return {
    schemaVersion: 1,
    id: `engineering-run.${formula.id}.${fingerprint}`,
    formulaId: formula.id,
    formulaVersion: formula.version,
    title: formula.title,
    createdAt,
    level: formula.level,
    verification: formula.verification,
    validity,
    domain: [...formula.domain],
    inputs,
    outputs,
    assumptions: [...formula.assumptions],
    limitations: [...formula.limitations],
    notices,
    sourceIds: [...formula.sourceIds],
  }
}
