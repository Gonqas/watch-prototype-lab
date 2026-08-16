import { ACADEMY_STAGE_4_CATALOG } from './stage4Catalog'
import { academyStage4SectionId } from './stage4Sections'

export const ACADEMY_STAGE_4_SAFETY_AUDITS = ACADEMY_STAGE_4_CATALOG.map(({ lessonId, pathRole }) => ({
  lessonId, sourceHistoricalRisk: 'none' as const, claimRisk: pathRole === 'optional-branch' ? 'requires-applicability-check' as const : 'none' as const,
  procedureRisk: pathRole === 'optional-branch' || lessonId.includes('disassembly') ? 'operation-blocked-until-current-service-source' as const : 'none' as const,
  lessonOperationalRisk: pathRole === 'optional-branch' || lessonId.includes('disassembly') ? 'caution' as const : 'normal' as const,
  actionablePhysicalOperationPresent: false as const, exactFragment: 'La actividad es documental o simulation-only y no invita a ejecutar servicio físico.', blockId: academyStage4SectionId.boundary(lessonId),
  procedureId: pathRole === 'optional-branch' ? 'procedure.014j.stage4.physical-service.blocked' : null, sourceIds: ['source.miyota.8215.parts-list-exploded-view'], hazard: 'Trasladar una dependencia virtual a una operación física sin fuente, preparación ni competencia.',
  indicatedAction: pathRole === 'optional-branch' || lessonId.includes('disassembly') ? 'block-physical-operation' as const : 'none' as const, blockingReason: 'La vista explosionada y el fixture no son manual de servicio.', modernAlternative: 'pending-applicable-manufacturer-service-document' as const,
}))

export const ACADEMY_STAGE_4_SAFETY_POLICY = { recipesIncluded: false, lubricationIncluded: false, torqueIncluded: false, physicalDisassemblyRequired: false, physicalAssemblyRequired: false, escapementManipulationRequired: false, hairspringManipulationRequired: false, digitalActivityProducesPhysicalEvidence: false } as const
