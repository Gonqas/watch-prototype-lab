export type AcademyRawPrerequisiteStatus = 'required'
export type AcademyEffectivePrerequisiteStatus = 'recommended' | 'later-transfer'

export interface AcademyPrerequisiteResolution {
  lessonId: string
  conceptId: string
  rawStatus: AcademyRawPrerequisiteStatus
  effectiveStatus: AcademyEffectivePrerequisiteStatus
  resolution: 'non-blocking-curricular-override'
  rationale: string
  auditOrigin: '0.14A.1-semantic-audit'
  sourceMigrationPending: true
}

function resolutions(
  lessonId: string,
  conceptIds: string[],
  effectiveStatus: AcademyEffectivePrerequisiteStatus,
  rationale: string,
): AcademyPrerequisiteResolution[] {
  return conceptIds.map((conceptId) => ({
    lessonId,
    conceptId,
    rawStatus: 'required',
    effectiveStatus,
    resolution: 'non-blocking-curricular-override',
    rationale,
    auditOrigin: '0.14A.1-semantic-audit',
    sourceMigrationPending: true,
  }))
}

export const ACADEMY_PREREQUISITE_RESOLUTIONS: readonly AcademyPrerequisiteResolution[] = [
  ...resolutions(
    'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple',
    [
      'concept.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora.canon-de-minutos',
      'concept.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora.rueda-de-minuteria',
      'concept.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora.puesta-en-hora',
    ],
    'recommended',
    'La visión general introduce el movimiento antes de exigir detalles posteriores de minutería y puesta en hora.',
  ),
  ...resolutions(
    'lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante',
    [
      'concept.encyclopedia.escapements-chronometry.toh-tourbillon-carrusel.jaula',
      'concept.encyclopedia.escapements-chronometry.toh-tourbillon-carrusel.periodo-de-rotacion',
      'concept.encyclopedia.escapements-chronometry.toh-tourbillon-carrusel.promedio-posicional',
    ],
    'recommended',
    'El centrado y alabeo básicos no requieren tourbillon, carrusel ni promedio posicional; quedan como ampliación avanzada.',
  ),
  ...resolutions(
    'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b',
    [
      'concept.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio.arquitectura-de-producto',
      'concept.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio.presupuesto-de-error',
      'concept.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio.v-model-de-validacion',
    ],
    'later-transfer',
    'El caso histórico puede estudiarse antes de aplicar deliberadamente marcos modernos de arquitectura, presupuesto de error o modelo V.',
  ),
] as const

const resolutionKey = (lessonId: string, conceptId: string) => `${lessonId}\u0000${conceptId}`
const resolutionsByKey = new Map(
  ACADEMY_PREREQUISITE_RESOLUTIONS.map((item) => [resolutionKey(item.lessonId, item.conceptId), item]),
)

export function academyPrerequisiteResolution(
  lessonId: string,
  conceptId: string,
): AcademyPrerequisiteResolution | undefined {
  return resolutionsByKey.get(resolutionKey(lessonId, conceptId))
}

export function effectiveLessonPrerequisiteConceptIds(
  lessonId: string,
  rawConceptIds: readonly string[],
): string[] {
  return rawConceptIds.filter((conceptId) => !academyPrerequisiteResolution(lessonId, conceptId))
}

export function academyPrerequisiteDebtForLesson(lessonId: string): AcademyPrerequisiteResolution[] {
  return ACADEMY_PREREQUISITE_RESOLUTIONS.filter((item) => item.lessonId === lessonId)
}
