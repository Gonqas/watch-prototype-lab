import type { AcademyEvidenceProfile, AcademyStage4ActivityPresentation } from '../types'
import { ACADEMY_STAGE_4_CATALOG } from './stage4Catalog'

const VIRTUAL_SEQUENCE_IDS = new Set(['activity.miyota8215.guided-disassembly', 'activity.miyota8215.free-disassembly', 'activity.miyota8215.partial-verifications'])
const RESULT_IDS = new Set(['activity.miyota8215.locate-specification', 'activity.miyota8215.complete-diagnosis'])

function evidence(activityId: string): AcademyEvidenceProfile {
  const primaryModality = RESULT_IDS.has(activityId) ? 'R' as const : 'V' as const
  return {
    modalities: primaryModality === 'R' ? ['K', 'V', 'R'] : ['K', 'V'], primaryModality,
    knowledgeExplanationRequired: true, virtualDemonstrationRequired: primaryModality === 'V' || VIRTUAL_SEQUENCE_IDS.has(activityId),
    physicalExecutionRequired: false, measuredOrReviewedResultRequired: primaryModality === 'R', physicalCompetenceClaim: false, reviewerRequired: false,
    measurableAcceptanceCriteria: ['Distingue dato oficial, interpretación del modelo y desconocido.', 'Cita el snapshot o fundamento de cada decisión.', 'Declara que la evidencia digital no acredita ejecución física.'],
    evidenceArtifacts: primaryModality === 'R' ? ['respuesta local estructurada', 'dossier revisable', 'límites declarados'] : ['estado del simulador', 'explicación local', 'límite físico'],
  }
}

function instructionsFor(archetype: string): readonly string[] {
  if (archetype === 'calibre-identification') return ['Observa sin nombrar todavía.', 'Registra rasgos e inscripción.', 'Coteja con documento oficial.', 'Declara variante y límite de la identidad.']
  if (archetype === 'document-reading') return ['Formula la pregunta.', 'Elige documento y localizador.', 'Extrae solo el dato aplicable.', 'Separa lo permitido de lo no demostrado.']
  if (archetype === 'virtual-sequence' || archetype === 'structural-dependency') return ['Declara estado inicial y objetivo.', 'Clasifica fundamento y alcance.', 'Ejecuta o planifica el cambio virtual.', 'Registra checkpoint, deshacer y límite físico.']
  if (archetype === 'symbolic-inspection') return ['Nombra el símbolo como escenario.', 'Describe solo lo observable.', 'Abre hipótesis rivales.', 'Indica la prueba física que faltaría.']
  if (archetype === 'virtual-assembly') return ['Ordena capas por dependencia.', 'Coloca una verificación interna.', 'Distingue verificación estructural, física y aceptación.', 'No prescribas lubricación, fuerza o ajuste.']
  if (archetype === 'traceable-dossier') return ['Registra identidad, documentos y snapshots.', 'Relaciona síntoma, hipótesis, prueba y resultado.', 'Vincula claims y límites.', 'Separa transferencia y dato físico pendiente.']
  return ['Explica la función general.', 'Identifica piezas oficiales.', 'Clasifica relaciones como oficiales, inferidas o conceptuales.', 'Registra entrada, salida y límite documental.']
}

export const ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS: readonly AcademyStage4ActivityPresentation[] = ACADEMY_STAGE_4_CATALOG
  .filter((item): item is typeof item & { requiredActivityId: string } => Boolean(item.requiredActivityId))
  .map((item) => ({
    activityId: item.requiredActivityId, lessonId: item.lessonId,
    visibleTitle: `Aplicar · ${item.observableOutcome.replace(/\.$/, '')}`, purpose: item.observableOutcome,
    instructions: instructionsFor(item.editorialArchetype),
    availableHelp: ['Vuelve a la pregunta central.', 'Consulta la matriz de autoridad documental.', 'Reduce la respuesta a evidencia, interpretación y desconocido.'],
    successCriteria: [...item.checkpointExpectedElements, 'El alcance simulation-only queda explícito cuando corresponde.'],
    feedback: 'Revisa el primer punto donde una identidad, relación o secuencia inferida se presentó como oficial.',
    limitations: ['La actividad es local y digital.', 'No produce evidencia P ni acredita servicio, inspección o diagnóstico físico.'],
    evidenceProfile: evidence(item.requiredActivityId),
  }))

export const ACADEMY_STAGE_4_REQUIRED_ACTIVITY_IDS = ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS.map(({ activityId }) => activityId)
export function academyStage4ActivityPresentation(activityId: string) { return ACADEMY_STAGE_4_ACTIVITY_PRESENTATIONS.find((item) => item.activityId === activityId) }
