export interface Academy014eScreenshotSpec {
  fileName: string
  route: string
  viewport: string
  state: string
  expected: string
  limitations: string
}

export const ACADEMY_014E_SCREENSHOTS: readonly Academy014eScreenshotSpec[] = [
  { fileName: '01-inicio-desktop-claro.png', route: '#/learning/home', viewport: '1440×1000', state: 'Inicio · tema claro', expected: 'Siguiente paso y macroetapas visibles en español.', limitations: 'Estado local sin datos personales introducidos para la captura.' },
  { fileName: '02-mi-ruta-desktop.png', route: '#/learning/my-learning', viewport: '1440×1000', state: 'Mi ruta', expected: 'Ocho etapas y progresión personal sin convertir MIYOTA en centro curricular.', limitations: 'Cobertura parcial declarada cuando corresponde.' },
  { fileName: '03-taller-tablet.png', route: '#/learning/workshop', viewport: '1024×768', state: 'Taller', expected: 'Herramientas y accesos de trabajo sin overflow horizontal.', limitations: 'No acredita destreza física.' },
  { fileName: '04-biblioteca-menu.png', route: '#/learning/home', viewport: '1024×768', state: 'Biblioteca abierta', expected: 'Revisión personal y recorrido personal, sin revisores ni participantes externos.', limitations: 'Menú superpuesto sobre Inicio.' },
  { fileName: '05-sistema-aprender.png', route: '#/learning/lesson/lesson.horology.system?mode=learn', viewport: '1440×1000', state: 'Aprender', expected: 'Pregunta central, explicación extensa y visual sincronizado.', limitations: 'Diagrama conceptual, no arquitectura de calibre.' },
  { fileName: '06-cadena-mecanica-lectura.png', route: '#/learning/lesson/lesson.horology.mechanical-chain?mode=read', viewport: '1024×768', state: 'Lectura', expected: 'Flujo continuo con visual esencial integrado y sin rail pegajoso.', limitations: 'La cadena es general; el calibre es solo ejemplo.' },
  { fileName: '07-tren-narrativa-760.png', route: '#/learning/lesson/lesson.mechanical.train?mode=learn', viewport: '760×900', state: 'Aprender · narrativa estrecha', expected: 'Narrativa continua refluida; el visual aparece al activar su apartado.', limitations: 'Modelo 3D conceptual.' },
  { fileName: '08-sistema-movil.png', route: '#/learning/lesson/lesson.horology.system?mode=learn', viewport: '480×900', state: 'Móvil', expected: 'Visual integrado, índice accesible y controles sin overflow.', limitations: 'La altura recorta el resto de la lección, que continúa por scroll.' },
  { fileName: '09-fuentes-8215.png', route: '#/learning/sources?lesson=lesson.miyota8215.architecture', viewport: '1024×768', state: 'Fuentes', expected: 'Documentación oficial distinguida de teoría general.', limitations: 'No se abren ni copian originales privados.' },
  { fileName: '10-revision-personal.png', route: '#/learning/editorial-review?lesson=lesson.horology.system', viewport: '1440×1000', state: 'Revisión personal pendiente', expected: 'Estados técnico y personal separados, flags personales y nota local.', limitations: 'No se inventa una valoración del propietario.' },
  { fileName: '11-desmontaje-8215-limitado.png', route: '#/learning/lesson/lesson.miyota8215.guided-disassembly?mode=learn', viewport: '1440×1000', state: 'Dependencias documentales', expected: 'El despiece no se presenta como secuencia oficial ni genera evidencia P.', limitations: 'Fuente de secuencia de servicio pendiente.' },
  { fileName: '12-caja-integracion.png', route: '#/learning/lesson/lesson.encyclopedia.cases-water.arquitectura-de-caja?mode=learn', viewport: '1024×768', state: 'Integración de reloj completo', expected: 'Interfaces de caja y movimiento sin medidas inventadas.', limitations: 'Compatibilidad concreta requiere documentos y medidas.' },
  { fileName: '13-inicio-tema-oscuro.png', route: '#/learning/home', viewport: '1440×1000', state: 'Inicio · tema oscuro', expected: 'Contraste y jerarquía conservados.', limitations: 'Tema restaurado al terminar QA.' },
  { fileName: '14-reflow-equivalente-200.png', route: '#/learning/lesson/lesson.horology.system?mode=learn', viewport: '720×1000', state: 'Reflow equivalente al 200 %', expected: 'Sin overflow horizontal y con controles refluidos.', limitations: 'Equivalencia por ancho CSS; el zoom del navegador no se automatiza.' },
] as const

export const ACADEMY_014E_QA_CASES = [
  ['1440×1000', 'verified-browser'],
  ['1024×768', 'verified-browser'],
  ['760×900', 'verified-browser'],
  ['480×900', 'verified-browser'],
  ['Reflow equivalente al 200 %', 'verified-browser-equivalent-720-css-px'],
  ['Inicio', 'verified-browser'],
  ['Mi ruta', 'verified-browser'],
  ['Taller', 'verified-browser'],
  ['Biblioteca', 'verified-browser'],
  ['Aprender', 'verified-browser'],
  ['Lectura', 'verified-browser'],
  ['Índice y rail visual', 'verified-browser-index-and-contract-test'],
  ['Visual integrado en móvil', 'verified-browser'],
  ['Fuentes', 'verified-browser'],
  ['Revisión personal', 'verified-browser-personal-pending'],
  ['Nota personal', 'verified-browser-temporary-input-cleared'],
  ['Marcador y reanudación', 'verified-deterministic-test-no-user-data-created'],
  ['Transición a práctica', 'verified-ui-blocked-by-real-prerequisites-and-contract-test'],
  ['Fallback sin WebGL', 'verified-deterministic-test'],
  ['Tema claro y oscuro', 'verified-browser-preference-restored'],
  ['Reduced motion', 'verified-browser-preference-restored-and-state-test'],
  ['Teclado y foco', 'verified-browser'],
  ['Overflow horizontal', 'verified-browser-zero-overflow-all-viewports'],
] as const
