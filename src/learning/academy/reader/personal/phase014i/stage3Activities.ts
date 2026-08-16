import type { AcademyEvidenceProfile, AcademyStage3ActivityPresentation } from '../types'
import { ACADEMY_STAGE_3_CATALOG } from './stage3Catalog'

function evidence(primaryModality: 'K' | 'V' | 'R'): AcademyEvidenceProfile {
  return {
    modalities: ['K', 'V', 'R'], primaryModality,
    knowledgeExplanationRequired: true, virtualDemonstrationRequired: primaryModality === 'V',
    physicalExecutionRequired: false, measuredOrReviewedResultRequired: true,
    physicalCompetenceClaim: false, reviewerRequired: false,
    measurableAcceptanceCriteria: ['Separa observación, inferencia y desconocido.', 'Vincula la decisión con evidencia y límite.', 'No presenta la interacción digital como ejecución física.'],
    evidenceArtifacts: ['respuesta estructurada local', 'explicación revisable', 'límite declarado'],
  }
}

const primaryFor = (lessonId: string): 'K' | 'V' | 'R' => lessonId.includes('physical-measurement') || lessonId.includes('inspection-findings') ? 'R' : lessonId.includes('failure-prediction') || lessonId.includes('diagnostico') ? 'V' : 'K'

export const ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS: readonly AcademyStage3ActivityPresentation[] = ACADEMY_STAGE_3_CATALOG
  .filter((item): item is typeof item & { requiredActivityId: string } => Boolean(item.requiredActivityId))
  .map((item) => ({
    activityId: item.requiredActivityId,
    lessonId: item.lessonId,
    visibleTitle: `Aplicar · ${item.observableOutcome.replace(/\.$/, '')}`,
    purpose: item.observableOutcome,
    instructions: item.editorialArchetype === 'diagnosis'
      ? ['Registra el síntoma sin causa.', 'Formula al menos dos hipótesis rivales.', 'Elige una prueba cuyos resultados cambien su plausibilidad.', 'Actualiza confianza y conserva el dato ausente.']
      : item.editorialArchetype === 'measurement'
        ? ['Define magnitud, unidad y referencia.', 'Justifica instrumento, método y resolución.', 'Registra repetición e incertidumbre sin inventar tolerancia.']
        : item.editorialArchetype === 'reasoned-service'
          ? ['Parte del estado documentado.', 'Declara necesidad, fuente y riesgo.', 'Sitúa control, parada y criterio con autoridad.', 'Mantén bloqueado cualquier dato específico sin fuente.']
          : ['Describe primero lo observable.', 'Separa identificación e inferencia.', 'Registra evidencia, incertidumbre y decisión previa.'],
    availableHelp: ['Vuelve al apartado de decisión central.', 'Separa hecho, inferencia e incógnita.', 'Reduce la respuesta a la primera decisión que una nueva evidencia podría cambiar.'],
    successCriteria: [...item.checkpointExpectedElements, 'La conclusión conserva incertidumbre residual.'],
    feedback: 'Revisa la primera transición donde una observación pasó a causa sin una prueba diferenciadora.',
    limitations: ['La actividad es digital y no produce evidencia P.', 'No acredita inspección, medición o servicio físico.'],
    evidenceProfile: evidence(primaryFor(item.lessonId)),
  }))

export const ACADEMY_STAGE_3_REQUIRED_ACTIVITY_IDS = ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.map(({ activityId }) => activityId)
export function academyStage3ActivityPresentation(activityId: string) { return ACADEMY_STAGE_3_ACTIVITY_PRESENTATIONS.find((item) => item.activityId === activityId) }
