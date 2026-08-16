export const ACADEMY_STAGE_3_FINAL_CHECKPOINT = {
  checkpointId: 'checkpoint.academy.stage3-complete', fromStageId: 'stage.3', toStageId: 'stage.4', blocking: false, affectsProgress: false, createsMastery: false,
  title: 'Cierre personal de observación, medición y diagnóstico',
  questions: [
    '¿Puedo describir algo sin diagnosticarlo?', '¿Sé qué registrar antes de intervenir?', '¿Distingo síntoma, hallazgo e hipótesis?',
    '¿Puedo elegir una magnitud adecuada?', '¿Distingo resolución, precisión, exactitud e incertidumbre?', '¿Sé qué hace comparables dos mediciones?',
    '¿Puedo formular dos hipótesis rivales?', '¿Puedo elegir una prueba que las diferencie?', '¿Sé por qué limpiar puede destruir evidencia?',
    '¿Puedo explicar qué dato necesito antes de elegir un lubricante?', '¿Puedo definir un control intermedio?',
    '¿Sé de dónde debe proceder un criterio de aceptación?', '¿Puedo declarar qué sigue sin saberse?',
  ],
  actions: ['repasar observación', 'repasar metrología', 'repasar diagnóstico', 'repasar limpieza y tribología', 'repasar montaje y aceptación', 'abrir una práctica personal', 'continuar al calibre real'],
  evidence: 'Autocomprobación local K/V/R; no altera progreso, mastery, revisión o evidencia física.',
} as const
