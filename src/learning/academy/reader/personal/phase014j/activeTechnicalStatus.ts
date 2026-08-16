import type { AcademyPersonalTechnicalStatus } from '../../academyReaderModel'
import { ACADEMY_STAGE_3_CATALOG } from '../phase014i/stage3Catalog'

export type AcademyTechnicalEvidenceKind = 'claim' | 'source-requirement' | 'safety' | 'procedure' | 'visual' | 'formula'

export interface AcademyTechnicalStatusEvidence {
  evidenceId: string
  kind: AcademyTechnicalEvidenceKind
  status: AcademyPersonalTechnicalStatus
  central: boolean
  explanation: string
}

export interface AcademyTechnicalStatusInput {
  claims?: readonly AcademyTechnicalStatusEvidence[]
  sourceRequirements?: readonly AcademyTechnicalStatusEvidence[]
  safetyAudits?: readonly AcademyTechnicalStatusEvidence[]
  procedureStatuses?: readonly AcademyTechnicalStatusEvidence[]
  visualStatuses?: readonly AcademyTechnicalStatusEvidence[]
  formulaStatuses?: readonly AcademyTechnicalStatusEvidence[]
}

export interface AcademyDerivedTechnicalStatus {
  technicalStatus: AcademyPersonalTechnicalStatus
  decisiveEvidenceIds: readonly string[]
  evidence: readonly AcademyTechnicalStatusEvidence[]
}

const rank: Readonly<Record<AcademyPersonalTechnicalStatus, number>> = {
  'source-reviewed': 0,
  'source-limited': 1,
  'source-needed': 2,
  'technical-conflict': 3,
}

/** Resolver canónico: el estado procede de evidencias concretas, no del rol curricular ni del orden de sourceIds. */
export function deriveAcademyTechnicalStatus(input: AcademyTechnicalStatusInput): AcademyDerivedTechnicalStatus {
  const evidence = [
    ...(input.claims ?? []),
    ...(input.sourceRequirements ?? []),
    ...(input.safetyAudits ?? []),
    ...(input.procedureStatuses ?? []),
    ...(input.visualStatuses ?? []),
    ...(input.formulaStatuses ?? []),
  ]
  const normalized = evidence.map((item) => item.status === 'source-needed' && !item.central
    ? { ...item, status: 'source-limited' as const }
    : item)
  const technicalStatus = normalized.reduce<AcademyPersonalTechnicalStatus>((worst, item) => rank[item.status] > rank[worst] ? item.status : worst, 'source-reviewed')
  return {
    technicalStatus,
    decisiveEvidenceIds: normalized.filter(({ status }) => rank[status] === rank[technicalStatus]).map(({ evidenceId }) => evidenceId),
    evidence: normalized,
  }
}

const stage3Overrides: Readonly<Record<string, readonly AcademyTechnicalStatusEvidence[]>> = {
  'lesson.horology.failure-prediction': [{ evidenceId: 'claim.014i.stage3.rival-hypotheses', kind: 'claim', status: 'source-limited', central: true, explanation: 'El modelo causal es educativo y no diagnostica una unidad física.' }],
  'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion': [
    { evidenceId: 'claim.014i.stage3.cleaning-before-evidence', kind: 'claim', status: 'source-needed', central: true, explanation: 'La selección de química y proceso actuales no está respaldada.' },
    { evidenceId: 'procedure.014i.stage3.cleaning.blocked', kind: 'procedure', status: 'source-needed', central: true, explanation: 'Toda operación concreta permanece bloqueada hasta una fuente moderna aplicable.' },
  ],
  'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes': [
    { evidenceId: 'claim.014i.stage3.tribology-no-prescription', kind: 'claim', status: 'source-needed', central: true, explanation: 'Producto, punto y cantidad requieren documentación moderna del calibre.' },
    { evidenceId: 'procedure.014i.stage3.lubrication.blocked', kind: 'procedure', status: 'source-needed', central: true, explanation: 'La operación central no puede presentarse como ejecutable.' },
  ],
  'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control': [{ evidenceId: 'claim.014i.stage3.assembly-controls', kind: 'claim', status: 'source-limited', central: true, explanation: 'El patrón general está respaldado, pero no existe secuencia ni criterio de un calibre concreto.' }],
  'lesson.advanced.service-clean-lube': [{ evidenceId: 'procedure.014i.stage3.advanced-clean-lube.blocked', kind: 'procedure', status: 'source-needed', central: true, explanation: 'La operación central necesita fabricante, producto y seguridad actuales.' }],
}

const reviewedEvidence = (lessonId: string): AcademyTechnicalStatusEvidence => ({
  evidenceId: `source-requirement.014j.stage3.${lessonId}`,
  kind: 'source-requirement',
  status: 'source-reviewed',
  central: true,
  explanation: 'El objetivo conceptual o histórico conserva fuente y límites aplicables; no invita a ejecutar una operación bloqueada.',
})

export const ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J = ACADEMY_STAGE_3_CATALOG.map(({ lessonId }) => ({
  lessonId,
  ...deriveAcademyTechnicalStatus({ sourceRequirements: stage3Overrides[lessonId] ?? [reviewedEvidence(lessonId)] }),
}))

export function academyActiveTechnicalStatus014J(lessonId: string): AcademyDerivedTechnicalStatus | undefined {
  return ACADEMY_STAGE_3_ACTIVE_TECHNICAL_STATUS_014J.find((item) => item.lessonId === lessonId)
}
