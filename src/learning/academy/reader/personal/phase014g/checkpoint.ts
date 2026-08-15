export const ACADEMY_STAGE_0_TO_1_CHECKPOINT = {
  checkpointId: 'checkpoint.academy.stage0-to-stage1.014g',
  title: 'Antes de estudiar el reloj como sistema',
  status: 'recommended-non-blocking',
  questions: [
    '¿Puedes preparar y cerrar una sesión de banco sin perder su estado?',
    '¿Puedes elegir una herramienta por su contacto y reconocer cuándo detenerte?',
    '¿Puedes separar observación, interpretación y diagnóstico?',
  ],
  actions: [
    { actionId: 'review-stage0', label: 'Revisar etapa 0', intent: 'review-stage' },
    { actionId: 'continue-stage1', label: 'Continuar a etapa 1', intent: 'continue' },
    { actionId: 'record-question', label: 'Anotar una duda', intent: 'record-note' },
  ],
  blocking: false,
  affectsProgress: false,
} as const
