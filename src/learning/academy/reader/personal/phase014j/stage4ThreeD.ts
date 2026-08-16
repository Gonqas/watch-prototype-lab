import { ProjectEntityIndex } from '../../../../canonical'
import { SemanticSelectorResolver } from '../../../../runtime/selectors'
import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../../../../technical/fixtures'
import { ACADEMY_3D_VISUAL_STATES } from '../../academyReader3dStates'
import { deriveAcademyTechnicalStatus } from './activeTechnicalStatus'

const CURRENT_NAMES: Readonly<Record<string,string>> = { '025-670': 'Center second pinion', '500-710': 'Casing holder (Plastic)', '903-690': 'Friction spring for center second pinion' }

export const ACADEMY_STAGE_4_PART_MAPPINGS = MIYOTA_8215_TECHNICAL_FIXTURE.ledger.map((record) => ({
  canonicalId: record.canonicalId, instanceIds: record.instanceIds, officialName: record.officialReference ? CURRENT_NAMES[record.officialReference] ?? record.nameEn : null,
  preferredSpanishName: record.nameEs, partReference: record.officialReference ?? null, sourceId: record.officialReference ? 'source.miyota.8215.parts-list-exploded-view' : record.sourceIds[0],
  documentSnapshot: record.officialReference ? 'snapshot.miyota.8215.parts-list.fdafef81' : null, functionalGroup: record.subsystem,
  geometryStatus: record.officialGeometryAvailable ? 'official-dimensions-present' : record.reconstructionLevel === 'R0' ? 'not-modelled' : 'normalized-educational',
  modelMappingStatus: record.officialReference ? 'official-identified' : record.entityKind === 'conceptual-component' ? 'conceptual' : record.entityKind === 'interface-placeholder' ? 'unknown' : 'official-grouped',
  reconstructionLevel: record.reconstructionLevel, limitations: record.limitations,
}))

const resolver = new SemanticSelectorResolver(new ProjectEntityIndex(MIYOTA_8215_TECHNICAL_FIXTURE.assembly))
export const ACADEMY_STAGE_4_SELECTOR_MAPPINGS = MIYOTA_8215_TECHNICAL_FIXTURE.selectors.map((contract) => {
  const resolution = resolver.resolve(contract.selector, contract.cardinality)
  return { selectorId: contract.id, purpose: contract.purpose, entityIds: resolution.entities.map(({ id }) => id), partInstanceIds: [...new Set(resolution.entities.flatMap(({ relatedInstanceIds }) => relatedInstanceIds))], confidence: resolution.confidence, cardinalitySatisfied: resolution.cardinalitySatisfied, diagnostics: resolution.diagnostics.map(({ code, message }) => ({ code, message })) }
})

const decisions: Readonly<Record<string, { decision: 'keep' | 'correct' | 'source-needed'; reason: string; status: 'source-reviewed' | 'source-limited' | 'source-needed' }>> = {
  'reader.3d.miyota8215.overview': { decision: 'keep', reason: 'Localiza un ensamblaje y sus grupos sin afirmar escala o tolerancias.', status: 'source-limited' },
  'reader.3d.miyota8215.train-isolated': { decision: 'keep', reason: 'Aísla piezas modeladas del tren; contactos y geometría permanecen inferidos.', status: 'source-limited' },
  'reader.3d.miyota8215.automatic-isolated': { decision: 'correct', reason: 'La ruta completa, sentidos y eficiencia no se presentan como oficiales.', status: 'source-limited' },
  'reader.3d.miyota8215.rotor-checkpoint': { decision: 'correct', reason: 'Muestra una fijación y dependencia, no herramienta, par, dirección ni primer paso.', status: 'source-limited' },
  'reader.3d.miyota8215.barrel-bridge-checkpoint': { decision: 'source-needed', reason: 'Solo puede mostrar dependencia; el orden físico necesita fuente de servicio.', status: 'source-needed' },
  'reader.3d.miyota8215.inspection-train': { decision: 'keep', reason: 'Localiza el tren sin representar desgaste, suciedad o holguras.', status: 'source-limited' },
  'reader.3d.miyota8215.inspection-support': { decision: 'keep', reason: 'Localiza una interfaz sin declarar que la holgura sea correcta.', status: 'source-limited' },
}

export const ACADEMY_STAGE_4_3D_AUDIT = ACADEMY_3D_VISUAL_STATES.filter(({ visualStateId }) => visualStateId.startsWith('reader.3d.miyota8215.')).map((state) => {
  const audit = decisions[state.visualStateId]
  if (!audit) throw new Error(`Falta auditoría 0.14J para ${state.visualStateId}.`)
  const technicalStatus = deriveAcademyTechnicalStatus({ visualStatuses: [{ evidenceId: `visual-state.${state.visualStateId}`, kind: 'visual', status: audit.status, central: true, explanation: audit.reason }] }).technicalStatus
  return { visualStateId: state.visualStateId, decision: audit.decision, reason: audit.reason, technicalStatus, fidelity: MIYOTA_8215_TECHNICAL_FIXTURE.fidelity, selectedIds: state.selectedIds, isolatedIds: state.isolatedIds, expectedObservation: state.expectedObservation, limitations: [...state.limitations, 'El fixture no representa escala real, holgura correcta, desgaste ni servicio.'], reducedMotionSafe: state.animation === 'paused', fallback: 'La alternativa textual enumera piezas, relación, evidencia y límite sin requerir WebGL.' }
})

export const ACADEMY_STAGE_4_3D_SUMMARY = {
  stateCount: ACADEMY_STAGE_4_3D_AUDIT.length, partMappingCount: ACADEMY_STAGE_4_PART_MAPPINGS.length, selectorMappingCount: ACADEMY_STAGE_4_SELECTOR_MAPPINGS.length,
  officialReferences: ACADEMY_STAGE_4_PART_MAPPINGS.filter(({ partReference }) => partReference).length,
  unknownReferences: ACADEMY_STAGE_4_PART_MAPPINGS.filter(({ partReference }) => !partReference).length,
  sourceNeededStates: ACADEMY_STAGE_4_3D_AUDIT.filter(({ technicalStatus }) => technicalStatus === 'source-needed').map(({ visualStateId }) => visualStateId),
  fidelity: MIYOTA_8215_TECHNICAL_FIXTURE.fidelity,
} as const
