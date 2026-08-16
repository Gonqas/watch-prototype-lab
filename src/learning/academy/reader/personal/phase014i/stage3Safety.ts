import { ACADEMY_STAGE_3_CATALOG } from './stage3Catalog'
import { academyStage3SectionId } from './stage3Sections'

export type AcademySourceHistoricalRisk = 'none' | 'historical-hazards-present'
export type AcademyClaimRisk = 'none' | 'requires-applicability-check' | 'historical-only'
export type AcademyProcedureRisk = 'none' | 'operation-blocked-until-modern-source'
export type AcademyLessonOperationalRisk = 'normal' | 'caution' | 'historical-non-actionable'

export interface AcademyStage3SafetyAudit {
  lessonId: string
  sourceHistoricalRisk: AcademySourceHistoricalRisk
  claimRisk: AcademyClaimRisk
  procedureRisk: AcademyProcedureRisk
  lessonOperationalRisk: AcademyLessonOperationalRisk
  actionableOperationPresent: false
  exactFragment: string
  blockId: string
  claimId: string | null
  procedureId: string | null
  sourceIds: readonly string[]
  hazard: string
  indicatedAction: 'none' | 'block-operation' | 'historical-context-only'
  blockingReason: string
  modernAlternative: 'not-required' | 'pending-current-manufacturer-document-and-sds'
}

const historicalIds = new Set(['lesson.encyclopedia.service-tribology.tm-inspeccion-previa', 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b'])
const serviceIds = new Set(['lesson.encyclopedia.service-tribology.limpieza-e-inspeccion', 'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes', 'lesson.advanced.service-clean-lube'])
const sourceIdsByLesson: Readonly<Record<string, readonly string[]>> = {
  'lesson.encyclopedia.service-tribology.tm-inspeccion-previa': ['source.official.tm9-1575.inspection'],
  'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas': ['source.official.tm9-1575.diagnosis'],
  'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b': ['source.official.tm9-1575.hamilton-992b'],
  'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion': ['source.institutional.awci.standards'],
  'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes': ['source.private.daniels.jewelling', 'source.institutional.awci.standards'],
  'lesson.advanced.service-clean-lube': ['source.institutional.awci.standards'],
}
const claimIdByLesson: Readonly<Record<string, string>> = {
  'lesson.encyclopedia.service-tribology.tm-inspeccion-previa': 'claim.014i.stage3.tm-inspection',
  'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas': 'claim.014i.stage3.tm-diagnosis',
  'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b': 'claim.014i.stage3.hamilton-992b-scope',
  'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion': 'claim.014i.stage3.cleaning-before-evidence',
  'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes': 'claim.014i.stage3.tribology-no-prescription',
}

export const ACADEMY_STAGE_3_SAFETY_AUDITS: readonly AcademyStage3SafetyAudit[] = ACADEMY_STAGE_3_CATALOG.map(({ lessonId }) => {
  const historical = historicalIds.has(lessonId)
  const service = serviceIds.has(lessonId)
  return {
    lessonId,
    sourceHistoricalRisk: historical ? 'historical-hazards-present' : 'none',
    claimRisk: historical ? 'historical-only' : service ? 'requires-applicability-check' : 'none',
    procedureRisk: service ? 'operation-blocked-until-modern-source' : 'none',
    lessonOperationalRisk: historical ? 'historical-non-actionable' : service ? 'caution' : 'normal',
    actionableOperationPresent: false,
    exactFragment: historical ? 'El método histórico se conserva como contexto; productos, valores y secuencias de época no se trasladan.' : service ? 'La operación concreta permanece bloqueada hasta disponer de documentación moderna aplicable.' : 'La lección no invita a ejecutar una operación peligrosa.',
    blockId: academyStage3SectionId.sources(lessonId),
    claimId: claimIdByLesson[lessonId] ?? null,
    procedureId: service ? `procedure.014i.stage3.${lessonId.replace('lesson.', '')}.blocked` : null,
    sourceIds: sourceIdsByLesson[lessonId] ?? [],
    hazard: historical ? 'La obra completa contiene riesgos históricos; no contaminan por herencia la lección.' : service ? 'Exposición química o uso de producto no especificado si se ejecutara fuera del alcance.' : 'none',
    indicatedAction: historical ? 'historical-context-only' : service ? 'block-operation' : 'none',
    blockingReason: historical ? 'Fuente histórica sin autoridad moderna operativa.' : service ? 'Faltan producto específico, documento del fabricante y ficha de seguridad actual.' : 'No existe operación que bloquear.',
    modernAlternative: historical || service ? 'pending-current-manufacturer-document-and-sds' : 'not-required',
  }
})

export const ACADEMY_STAGE_3_SAFETY_POLICY = {
  recipesIncluded: false, concentrationsIncluded: false, immersionTimesIncluded: false,
  openBarrelRequired: false, escapementManipulationRequired: false, hairspringManipulationRequired: false,
  digitalActivityProducesPhysicalEvidence: false,
} as const
