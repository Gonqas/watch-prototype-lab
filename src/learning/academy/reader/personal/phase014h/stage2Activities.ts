import type { AcademyEvidenceProfile, AcademyStage2ActivityPresentation } from '../types'
import { ACADEMY_STAGE_2_CATALOG } from './stage2Catalog'

const evidence = (primary: 'K' | 'V' = 'V'): AcademyEvidenceProfile => ({
  modalities: ['K', 'V', 'R'], primaryModality: primary,
  knowledgeExplanationRequired: true, virtualDemonstrationRequired: true,
  physicalExecutionRequired: false, measuredOrReviewedResultRequired: true,
  physicalCompetenceClaim: false, reviewerRequired: false,
  measurableAcceptanceCriteria: ['Nombra entrada, relación y resultado.', 'Distingue lo observado de lo inferido.', 'Declara al menos un límite del modelo.'],
  evidenceArtifacts: ['respuesta digital', 'explicación revisable'],
})

export const ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS: readonly AcademyStage2ActivityPresentation[] = ACADEMY_STAGE_2_CATALOG
  .filter((item): item is typeof item & { requiredActivityId: string } => Boolean(item.requiredActivityId))
  .map((item) => ({
    activityId: item.requiredActivityId,
    lessonId: item.lessonId,
    visibleTitle: `Aplicar: ${item.observableOutcome.replace(/\.$/, '')}`,
    purpose: item.observableOutcome,
    instructions: ['Reconstruye la relación con el modelo virtual.', 'Justifica cada enlace con vocabulario de la lección.', 'Registra una limitación y una pregunta que necesitaría otra fuente.'],
    availableHelp: ['Vuelve al diagrama esencial.', 'Separa energía, movimiento y temporización.', 'Compara tu respuesta con el ejemplo razonado.'],
    successCriteria: ['La secuencia conserva causalidad.', 'La respuesta no inventa datos de calibre.', 'La conclusión distingue evidencia de inferencia.'],
    feedback: 'Revisa la primera interfaz donde tu predicción y el modelo divergen; no corrijas al azar.',
    limitations: ['La interacción es K/V/R y no demuestra manipulación física.', 'No autoriza servicio, ajuste ni apertura de componentes.'],
    evidenceProfile: evidence(),
  }))

export function academyStage2ActivityPresentation(activityId: string) {
  return ACADEMY_STAGE_2_ACTIVITY_PRESENTATIONS.find((item) => item.activityId === activityId)
}
