export type ReconstructionGateLevel = 'R2' | 'R3' | 'R4'

export interface ReconstructionGateEvidence {
  documentedIdentity: boolean
  documentedStructure: boolean
  documentedRelationships: boolean
  approximateEducationalGeometry: boolean
  photographicSourceIds: string[]
  reviewedVisualReconstruction: boolean
  plausibleContours: boolean
  verifiedRelationshipIds: string[]
  declaredUncertaintyIds: string[]
  physicalSpecimenIds: string[]
  controlledImageIds: string[]
  repeatedMeasurementSeriesIds: string[]
  registeredInstrumentIds: string[]
  instrumentVerificationIds: string[]
  versionedCorrectionProposalIds: string[]
  fitCheckEvidenceIds: string[]
  humanReviewer?: string
  explicitScope?: string
}

export interface ReconstructionGateResult {
  level: ReconstructionGateLevel
  passed: boolean
  satisfied: string[]
  missing: string[]
  limitations: string[]
  fidelityUnaffected: true
}

function present(values: readonly string[]): boolean {
  return values.length > 0 && values.every((value) => value.trim().length > 0)
}

export function evaluateReconstructionGate(
  level: ReconstructionGateLevel,
  evidence: ReconstructionGateEvidence,
): ReconstructionGateResult {
  const checks: Array<[string, boolean]> = [
    ['identidad documentada', evidence.documentedIdentity],
    ['estructura documentada', evidence.documentedStructure],
    ['relaciones documentadas', evidence.documentedRelationships],
    ['geometría educativa aproximada declarada', evidence.approximateEducationalGeometry],
  ]
  if (level === 'R3' || level === 'R4') checks.push(
    ['fuentes fotográficas identificadas', present(evidence.photographicSourceIds)],
    ['reconstrucción visual revisada', evidence.reviewedVisualReconstruction],
    ['contornos declarados plausibles', evidence.plausibleContours],
    ['relaciones verificadas', present(evidence.verifiedRelationshipIds)],
    ['incertidumbres declaradas', present(evidence.declaredUncertaintyIds)],
    ['aprobación humana identificada', Boolean(evidence.humanReviewer?.trim())],
  )
  if (level === 'R4') checks.push(
    ['unidad física identificada', present(evidence.physicalSpecimenIds)],
    ['fotografías controladas', present(evidence.controlledImageIds)],
    ['mediciones repetidas', present(evidence.repeatedMeasurementSeriesIds)],
    ['instrumentos registrados', present(evidence.registeredInstrumentIds)],
    ['verificaciones de instrumentos', present(evidence.instrumentVerificationIds)],
    ['correcciones versionadas', present(evidence.versionedCorrectionProposalIds)],
    ['comprobaciones de encaje', present(evidence.fitCheckEvidenceIds)],
    ['alcance explícito', Boolean(evidence.explicitScope?.trim())],
  )
  const satisfied = checks.filter(([, value]) => value).map(([label]) => label)
  const missing = checks.filter(([, value]) => !value).map(([label]) => label)
  return {
    level,
    passed: missing.length === 0,
    satisfied,
    missing,
    limitations: level === 'R4'
      ? [
          'R4 describe una reconstrucción de unidades físicas medidas; no demuestra tolerancias industriales.',
          'R4 no convierte el modelo en gemelo físico completo ni valida automáticamente cinemática o física.',
        ]
      : ['El gate no modifica el fixture, el CAD ni la fidelidad G/K/P.'],
    fidelityUnaffected: true,
  }
}

export function highestReconstructionGate(evidence: ReconstructionGateEvidence): ReconstructionGateResult {
  const r4 = evaluateReconstructionGate('R4', evidence)
  if (r4.passed) return r4
  const r3 = evaluateReconstructionGate('R3', evidence)
  if (r3.passed) return r3
  return evaluateReconstructionGate('R2', evidence)
}
