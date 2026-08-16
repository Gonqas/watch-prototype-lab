import type { AcademyEvidenceProfile, AcademyStage5ActivityPresentation } from '../types'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'

const resultActivities = new Set(['activity.capstone.design.requirements','activity.capstone.design.acquired-movement','activity.capstone.design.capstone','activity.mechanical.build-final-project','activity.capstone.validation.calibre-transfer'])
function evidence(activityId:string): AcademyEvidenceProfile {
  const result = resultActivities.has(activityId)
  return {modalities:result?['K','V','R']:['K','V'],primaryModality:result?'R':'V',knowledgeExplanationRequired:true,virtualDemonstrationRequired:true,physicalExecutionRequired:false,measuredOrReviewedResultRequired:result,physicalCompetenceClaim:false,reviewerRequired:false,measurableAcceptanceCriteria:['Conserva autoridad, datum, unidad y aplicabilidad.','Propaga unknowns y conflictos.','No convierte modelo o captura en evidencia física.'],evidenceArtifacts:result?['registro local estructurado','dossier revisable','límites']:['estado digital','explicación','unknowns']}
}

export const ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS: readonly AcademyStage5ActivityPresentation[] = ACADEMY_STAGE_5_CATALOG.filter((item):item is typeof item & {requiredActivityId:string} => Boolean(item.requiredActivityId)).map((item) => ({
  activityId:item.requiredActivityId,lessonId:item.lessonId,visibleTitle:`Aplicar · ${item.observableOutcome.replace(/\.$/,'')}`,purpose:item.observableOutcome,
  instructions:['Formula la pregunta de interfaz o requisito.','Registra ambos componentes y la autoridad de cada dato.','Calcula solo con entradas completas y datums compatibles.','Conserva unknowns, conflictos y validación física pendiente.'],
  availableHelp:['Vuelve a la cadena correspondiente.','Consulta la jerarquía de autoridad documental.','Abre el laboratorio sin modificar el progreso.'],
  successCriteria:[...item.checkpointExpectedElements,'La conclusión no afirma montaje, hermeticidad o compatibilidad física.'],feedback:'Revisa el primer punto donde una ausencia, estimación o semejanza visual se presentó como dato aplicable.',
  limitations:['Actividad local y digital.','No ejecuta modificaciones, montaje, presión ni validación física.'],evidenceProfile:evidence(item.requiredActivityId),
}))
export const ACADEMY_STAGE_5_REQUIRED_ACTIVITY_IDS = ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS.map(({activityId}) => activityId)
export function academyStage5ActivityPresentation(activityId:string) { return ACADEMY_STAGE_5_ACTIVITY_PRESENTATIONS.find((item) => item.activityId === activityId) }

