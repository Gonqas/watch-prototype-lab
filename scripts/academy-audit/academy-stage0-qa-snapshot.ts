export type Academy014fQaStatus = 'pending' | 'passed' | 'limited'

export interface Academy014fQaCase {
  caseId: string
  viewport: string
  state: string
  status: Academy014fQaStatus
  notes: string
  screenshot?: string
}

export const ACADEMY_014F_QA_CASES: readonly Academy014fQaCase[] = [
  { caseId: 'qa.014f.desktop-workstation', viewport: '1440 × 1000', state: 'Puesto de trabajo · Aprender · tema oscuro · sin visual activo', status: 'passed', notes: 'Pregunta central única, duración estimada, estado editorial legible y primera pantalla proporcionada.', screenshot: '01-workstation-learn-1440x1000.png' },
  { caseId: 'qa.014f.desktop-tools-read', viewport: '1024 × 768', state: 'Herramientas · Lectura · tema oscuro · índice compacto', status: 'passed', notes: 'Lectura conserva la pregunta y los visuales esenciales inline; no aparece “authored”.', screenshot: '02-tools-read-1024x768.png' },
  { caseId: 'qa.014f.tablet-observation', viewport: '760 × 900', state: 'Observación y manipulación · Aprender · compacto', status: 'passed', notes: 'Sin overflow horizontal; pregunta única y práctica personal opcional presente.', screenshot: '03-observation-learn-760x900.png' },
  { caseId: 'qa.014f.mobile-contamination', viewport: '480 × 900', state: 'Contaminación · Aprender · móvil · sin visual activo', status: 'passed', notes: 'Cabecera, modos y pregunta refluyen sin overflow horizontal.', screenshot: '04-contamination-learn-480x900.png' },
  { caseId: 'qa.014f.visual-rail', viewport: '1440 × 1000', state: 'Puesto de trabajo · Aprender · rail visual sincronizado', status: 'passed', notes: 'El mapa del banco sigue al apartado activo y declara pregunta, texto alternativo, fidelidad y límites.', screenshot: '05-bench-map-synchronized-1440x1000.png' },
  { caseId: 'qa.014f.reflow-bulova', viewport: '720 × 1000', state: 'Destreza Bulova · Aprender · visual integrado · reflow equivalente a 200 %', status: 'passed', notes: 'Diagrama inline legible, sin overflow y sin atribuir acreditación física.', screenshot: '06-bulova-tweezers-reflow-720x1000.png' },
  { caseId: 'qa.014f.review-desktop', viewport: '1440 × 1000', state: 'Revisión personal · cola de 22 · escritorio', status: 'passed', notes: 'Primera pantalla compacta; 0 de 22 valoraciones y ninguna revisión simulada.', screenshot: '07-personal-review-1440x1000.png' },
  { caseId: 'qa.014f.review-mobile', viewport: '480 × 900', state: 'Revisión personal · cola de 22 · móvil', status: 'passed', notes: 'Selector, estado y pregunta central refluyen sin overflow horizontal.', screenshot: '08-personal-review-mobile-480x900.png' },
  { caseId: 'qa.014f.reduced-motion', viewport: '1024 × 768', state: 'Herramientas · Aprender · movimiento reducido · visual estático', status: 'passed', notes: 'Preferencia activada y restaurada; el visual esencial permanece como diagrama estático.', screenshot: '09-tools-reduced-motion-1024x768.png' },
  { caseId: 'qa.014f.library-entry', viewport: '1440 × 1000', state: 'Biblioteca → Gestionar → Revisión personal', status: 'passed', notes: 'La revisión continúa como destino secundario y no aparece en Inicio, Mi ruta ni Taller.', screenshot: '10-library-manage-review-entry-1440x1000.png' },
  { caseId: 'qa.014f.home-zero', viewport: '1024 × 768', state: 'Inicio · perfil local limpio · progreso cero', status: 'passed', notes: 'Origen local aislado: 0/83 lecciones ancla y siguiente acción en etapa 0.', screenshot: '11-home-zero-progress-1024x768.png' },
  { caseId: 'qa.014f.route-stage0', viewport: '1024 × 768', state: 'Mi ruta · etapa 0 · progreso cero', status: 'passed', notes: 'La etapa 0 se muestra como actual sin alterar navegación ni progreso.', screenshot: '12-my-route-stage0-1024x768.png' },
  { caseId: 'qa.014f.light-bench', viewport: '1024 × 768', state: 'Banco y seguridad · Aprender · tema claro', status: 'passed', notes: 'Tema claro activado y restaurado; contraste y jerarquía se mantienen.', screenshot: '13-bench-safety-light-1024x768.png' },
  { caseId: 'qa.014f.keyboard-focus', viewport: '1024 × 768', state: 'Puesto de trabajo · foco de teclado', status: 'limited', notes: 'El foco visible sobre controles semánticos se comprobó; el controlador del navegador no reprodujo de forma fiable toda la secuencia Tab/activación.', screenshot: '14-workstation-keyboard-focus-1024x768.png' },
  { caseId: 'qa.014f.empty-note', viewport: '1024 × 768', state: 'Puesto de trabajo · nota personal vacía', status: 'passed', notes: 'Editor contextual inspeccionado y cancelado sin escribir ni guardar datos.', screenshot: '15-workstation-empty-note-1024x768.png' },
  { caseId: 'qa.014f.required-practice', viewport: '1024 × 768', state: 'Organizar un banco recuperable · práctica requerida · overlay personal', status: 'passed', notes: 'Presentación 0.14F visible con K/V/R traducidos y límite físico; no se creó intento.', screenshot: '16-required-practice-overlay-1024x768.png' },
  { caseId: 'qa.014f.six-lessons', viewport: '1024 × 768', state: 'Seis lecciones de etapa 0 · Aprender', status: 'passed', notes: 'Las seis muestran pregunta única, duración estimada, práctica opcional y cero jerga interna detectada.' },
  { caseId: 'qa.014f.six-visuals', viewport: '1440 × 1000', state: 'Seis diseños esenciales · apartados activos', status: 'passed', notes: 'Los seis visualDesignId se renderizaron; el mapa de contaminación conserva el ID reutilizado/versionado.' },
  { caseId: 'qa.014f.reading-visuals', viewport: '1024 × 768', state: 'Herramientas · Lectura · tres visuales esenciales inline', status: 'passed', notes: 'Eje de observación, pinzas y destornillador permanecen con política inline-essential.' },
  { caseId: 'qa.014f.resume-deep-link', viewport: '1024 × 768', state: 'Puesto de trabajo · reanudación de apartado visual', status: 'passed', notes: 'La recarga conservó el deep link y volvió al mismo visual sin completar la lección.' },
  { caseId: 'qa.014f.marker', viewport: '1024 × 768', state: 'Puesto de trabajo · marcador', status: 'limited', notes: 'El control y su contexto se inspeccionaron, pero no se activó para evitar crear un marcador ficticio.' },
  { caseId: 'qa.014f.reviewed-state', viewport: '1440 × 1000', state: 'Revisión personal · estado revisado', status: 'limited', notes: 'La etiqueta y la transición están cubiertas por pruebas de render; no se inventó una revisión personal para fotografiarla.' },
  { caseId: 'qa.014f.stale-state', viewport: '1440 × 1000', state: 'Revisión personal · estado obsoleto', status: 'limited', notes: 'La invalidación por hash está cubierta por pruebas; no se fabricó contenido o revisión obsoleta.' },
  { caseId: 'qa.014f.webgl-fallback', viewport: '1024 × 768', state: 'Fallback sin WebGL', status: 'limited', notes: 'La detección y el fallback honesto pasan prueba automática; el navegador disponible no permite desactivar WebGL sin mutar el entorno.' },
  { caseId: 'qa.014f.runtime-console', viewport: 'varios', state: 'Navegación rápida entre rutas', status: 'limited', notes: 'Se observaron avisos de rendimiento y errores de versión no creciente del perfil al forzar navegaciones consecutivas; no bloquearon la lectura y se registran como riesgo pendiente.' },
] as const

export const ACADEMY_014F_VALIDATION_RESULTS = {
  stage0Audit: 'passed',
  previousAudits: 'passed',
  typescript: 'passed',
  eslint: 'passed',
  vitest: 'passed · 621/621',
  build: 'passed · 1.27 s final en caliente; 7.97 s primera medida',
  verify: 'passed · segunda ejecución; el primer intento agotó un timeout histórico y el caso pasó aislado en 9.72 s',
  diffCheck: 'passed',
  npmAudit: 'passed · 0 vulnerabilidades',
} as const
