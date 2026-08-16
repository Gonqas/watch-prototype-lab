export interface Academy014IQaCase {
  screenshotId: string
  fileName: string
  lessonId: string
  mode: 'learn' | 'read'
  viewport: string
  subject: string
  status: 'pending' | 'pass'
  notes: string
}

export const ACADEMY_014I_QA_PERFORMANCE = {
  environment: 'Vite development server; no equivale a producción',
  consoleErrors: 0,
  samples: [
    { operation: 'initialize', durationMs: 844.3, thresholdMs: 800, itemCount: 1 },
    { operation: 'refresh-pages', durationMs: 327.3, thresholdMs: 250, itemCount: 72 },
    { operation: 'refresh-pages', durationMs: 251.7, thresholdMs: 250, itemCount: 72 },
  ],
  nonBlockingWarnings: ['THREE.Clock deprecated', 'WebGL double-precision representation warning', 'learning:performance threshold exceeded'],
} as const

export const ACADEMY_014I_QA_CASES: readonly Academy014IQaCase[] = [
  ['01','01-stage0-remediation.png','lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad','learn','1440x1000','Lección remediada de etapa 0'],
  ['02','02-stage1-remediation.png','lesson.horology.mechanical-chain','read','1440x1000','Lección remediada de etapa 1'],
  ['03','03-stage3-entry.png','lesson.metrology.observe-before-measuring','learn','1440x1000','Entrada a etapa 3'],
  ['04','04-observation-inference.png','lesson.metrology.observe-before-measuring','read','1024x768','Observación frente a inferencia'],
  ['05','05-baseline.png','lesson.encyclopedia.service-tribology.recepcion-y-linea-base','learn','1440x1000','Línea base'],
  ['06','06-finding-record.png','lesson.metrology.inspection-findings','learn','1024x768','Registro de hallazgo'],
  ['07','07-measurement-terms.png','lesson.metrology.units-scale-resolution','learn','1440x1000','Resolución, precisión, exactitud e incertidumbre'],
  ['08','08-instrument-choice.png','lesson.metrology.instruments','learn','1024x768','Selección de instrumento'],
  ['09','09-repeated-measurement.png','lesson.metrology.physical-measurement','learn','1440x1000','Medición repetida'],
  ['10','10-rival-hypotheses.png','lesson.horology.failure-prediction','learn','1440x1000','Hipótesis rivales'],
  ['11','11-discriminating-test.png','lesson.horology.failure-prediction','read','1024x768','Prueba discriminante'],
  ['12','12-diagnosis-final-control.png','lesson.encyclopedia.service-tribology.diagnostico-y-control-final','learn','1440x1000','Diagnóstico y control final'],
  ['13','13-cleaning-inspection.png','lesson.encyclopedia.service-tribology.limpieza-e-inspeccion','learn','1440x1000','Limpieza e inspección'],
  ['14','14-tribology.png','lesson.encyclopedia.service-tribology.tribologia-y-lubricantes','learn','1024x768','Tribología'],
  ['15','15-assembly-controls.png','lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control','learn','1440x1000','Puntos de control'],
  ['16','16-historical-non-actionable.png','lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas','read','1024x768','Fuente histórica no accionable'],
  ['17','17-personal-practice.png','lesson.metrology.physical-measurement','learn','1440x1000','Práctica personal'],
  ['18','18-final-checkpoint.png','lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control','read','1440x1000','Checkpoint final'],
  ['19','19-mobile.png','lesson.metrology.instruments','learn','480x900','Móvil'],
  ['20','20-reflow-200.png','lesson.metrology.units-scale-resolution','read','760x900@200%','Reflow'],
  ['21','21-dark-theme.png','lesson.encyclopedia.service-tribology.tribologia-y-lubricantes','learn','1024x768','Tema oscuro'],
  ['22','22-reduced-motion.png','lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control','learn','1024x768','Movimiento reducido y fallback'],
].map(([screenshotId,fileName,lessonId,mode,viewport,subject]) => ({
  screenshotId,
  fileName,
  lessonId,
  mode: mode as 'learn' | 'read',
  viewport,
  subject,
  status: 'pass' as const,
  notes: screenshotId === '20'
    ? 'Reflow verificado con la preferencia real de texto al 200 %, sin desbordamiento horizontal.'
    : screenshotId === '21'
      ? 'Tema oscuro activado desde Preferencias, comprobado y restaurado a Seguir sistema.'
      : screenshotId === '22'
        ? 'Movimiento reducido activado, visual semántico y alternativa textual comprobados; preferencia restaurada.'
        : 'Comprobación real en el lector local; sin error de consola ni desbordamiento horizontal.',
}))
