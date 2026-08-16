export interface Academy014JQaCase { fileName: string; viewport: string; lessonId: string; mode: string; subject: string }

export const ACADEMY_014J_QA_CASES: readonly Academy014JQaCase[] = [
  ['01-stage4-entry-1440.png','1440x1000','lesson.miyota8215.identify','light','Entrada a etapa 4'],
  ['02-identification-1440.png','1440x1000','lesson.miyota8215.identify','light','Identificación'],
  ['03-document-authority-1440.png','1440x1000','lesson.miyota8215.documentation','light','Autoridad documental'],
  ['04-snapshot-drift-1440.png','1440x1000','lesson.miyota8215.documentation','light','Comparación de snapshots'],
  ['05-architecture-1440.png','1440x1000','lesson.miyota8215.architecture','light','Arquitectura completa'],
  ['06-automatic-1024.png','1024x768','lesson.miyota8215.automatic','light','Automático'],
  ['07-crown-states-1024.png','1024x768','lesson.miyota8215.winding-setting','light','Estados de corona'],
  ['08-barrel-train-1024.png','1024x768','lesson.miyota8215.barrel-energy','light','Barrilete y tren'],
  ['09-escapement-1024.png','1024x768','lesson.miyota8215.escapement-oscillator','light','Escape-oscilador'],
  ['10-calendar-1024.png','1024x768','lesson.miyota8215.calendar','light','Calendario'],
  ['11-dependency-graph-1024.png','1024x768','lesson.miyota8215.plan-disassembly','light','Grafo de dependencias'],
  ['12-simulation-boundary-1024.png','1024x768','lesson.miyota8215.guided-disassembly','light','Frontera simulación/servicio'],
  ['13-rotor-checkpoint-1024.png','1024x768','lesson.miyota8215.guided-disassembly','light','Rotor checkpoint'],
  ['14-barrel-source-needed-1024.png','1024x768','lesson.miyota8215.guided-disassembly','light','Barrel bridge source-needed'],
  ['15-symbolic-inspection-760.png','760x900','lesson.miyota8215.inspection','light','Inspección simbólica'],
  ['16-virtual-assembly-760.png','760x900','lesson.miyota8215.assembly-verification','light','Montaje virtual'],
  ['17-diagnosis-760.png','760x900','lesson.miyota8215.diagnosis-project','light','Diagnóstico'],
  ['18-dossier-760.png','760x900','lesson.miyota8215.diagnosis-project','light','Dossier'],
  ['19-checkpoint-760.png','760x900','lesson.miyota8215.diagnosis-project','light','Checkpoint'],
  ['20-personal-review-760.png','760x900','lesson.miyota8215.diagnosis-project','light','Revisión personal'],
  ['21-mobile-480.png','480x900','lesson.miyota8215.identify','light','Móvil'],
  ['22-reflow-200-percent-480.png','480x900','lesson.miyota8215.documentation','reflow-200','Reflow'],
  ['23-dark-theme-760.png','760x900','lesson.miyota8215.architecture','dark','Tema oscuro'],
  ['24-no-webgl-fallback-760.png','760x900','lesson.miyota8215.inspection','no-webgl','Fallback sin WebGL'],
].map(([fileName,viewport,lessonId,mode,subject]) => ({ fileName,viewport,lessonId,mode,subject }))

export const ACADEMY_014J_QA_MATRIX = {
  viewports: ['1440x1000','1024x768','760x900','480x900','reflow-equivalent-200%'],
  themes: ['light','dark'], reducedMotion: true, keyboard: true, focusVisible: true, noWebglFallback: true,
  inspectedWithoutHumanClarityClaim: true,
} as const
