export interface Academy014dScreenshotSpec {
  fileName: string
  route: string
  lessonId: string
  section: string
  viewport: string
  state: string
  expected: string
  limitations: string
}

export const ACADEMY_014D_SCREENSHOTS: readonly Academy014dScreenshotSpec[] = [
  { fileName: '01-system-learn-desktop.png', route: '#/learning/lesson/lesson.horology.system?mode=learn', lessonId: 'lesson.horology.system', section: 'Mapa funcional', viewport: '1440×1000', state: 'Aprender', expected: 'Mapa específico de siete funciones, sin nodos genéricos.', limitations: 'Diagrama conceptual no dibujado a escala.' },
  { fileName: '02-mechanical-chain-energy.png', route: '#/learning/lesson/lesson.horology.mechanical-chain?mode=learn', lessonId: 'lesson.horology.mechanical-chain', section: 'Flujo de energía', viewport: '1440×1000', state: 'Aprender', expected: 'Barrilete, tren, escape, áncora y oscilador con flujo diferenciado.', limitations: 'Arquitectura conceptual.' },
  { fileName: '03-mechanical-chain-interruption.png', route: '#/learning/lesson/lesson.horology.mechanical-chain?mode=learn', lessonId: 'lesson.horology.mechanical-chain', section: 'Interrupción', viewport: '1440×1000', state: 'Segundo cue', expected: 'Estado causal distinto del apartado anterior.', limitations: 'No diagnostica un calibre.' },
  { fileName: '04-gear-pair-specific.png', route: '#/learning/lesson/lesson.mechanical.gear-pair?mode=learn', lessonId: 'lesson.mechanical.gear-pair', section: 'Relación simbólica', viewport: '1440×1000', state: 'Aprender', expected: 'Z1, Z2, sentidos opuestos y relación simbólica.', limitations: 'Sin valores numéricos inventados.' },
  { fileName: '05-train-3d-isolated.png', route: '#/learning/lesson/lesson.mechanical.train?mode=learn', lessonId: 'lesson.mechanical.train', section: 'Tren aislado', viewport: '1440×1000', state: '3D específico', expected: 'Tren conceptual seleccionado y aislado.', limitations: 'Geometría conceptual.' },
  { fileName: '06-escapement-phases.png', route: '#/learning/lesson/lesson.mechanical.escapement?mode=learn', lessonId: 'lesson.mechanical.escapement', section: 'Fases', viewport: '1440×1000', state: 'Secuencia', expected: 'Bloqueo, desbloqueo, impulso, caída, reposo y seguridad.', limitations: 'No autoriza ajuste de calibre.' },
  { fileName: '07-oscillator-specific.png', route: '#/learning/lesson/lesson.mechanical.oscillator?mode=learn', lessonId: 'lesson.mechanical.oscillator', section: 'Volante y espiral', viewport: '1440×1000', state: 'Aprender', expected: 'Retorno, periodo, amplitud y fricción relacionados.', limitations: 'Tendencias cualitativas.' },
  { fileName: '08-miyota8215-overview.png', route: '#/learning/lesson/lesson.miyota8215.architecture?mode=learn', lessonId: 'lesson.miyota8215.architecture', section: 'Arquitectura general', viewport: '1440×1000', state: '3D general', expected: 'Fixture 8215 completo con etiquetas de subsistemas.', limitations: 'Fixture estructural normalizado.' },
  { fileName: '09-miyota8215-subsystem.png', route: '#/learning/lesson/lesson.miyota8215.architecture?mode=learn', lessonId: 'lesson.miyota8215.architecture', section: 'Subsistema aislado', viewport: '1440×1000', state: '3D tren aislado', expected: 'Estado de cámara y aislamiento distinto del general.', limitations: 'No expresa tolerancias.' },
  { fileName: '10-miyota8215-disassembly-checkpoint.png', route: '#/learning/lesson/lesson.miyota8215.guided-disassembly?mode=learn', lessonId: 'lesson.miyota8215.guided-disassembly', section: 'Punto de control', viewport: '1024×768', state: 'Rotor', expected: 'Fijación, pieza y explosión simbólica.', limitations: 'No acredita destreza física.' },
  { fileName: '11-case-architecture.png', route: '#/learning/lesson/lesson.encyclopedia.cases-water.arquitectura-de-caja?mode=learn', lessonId: 'lesson.encyclopedia.cases-water.arquitectura-de-caja', section: 'Cadena axial', viewport: '1024×768', state: 'Aprender', expected: 'Movimiento, aro, esfera, cristal, corona, tubo, fondo y juntas.', limitations: 'Sin medidas concretas.' },
  { fileName: '12-read-essential.png', route: '#/learning/lesson/lesson.mechanical.train?mode=read', lessonId: 'lesson.mechanical.train', section: 'Visual esencial inline', viewport: '760×900', state: 'Lectura', expected: 'Visual esencial dentro del flujo y sin rail sticky.', limitations: 'Resumen estático del 3D.' },
  { fileName: '13-no-visual-layout.png', route: '#/learning/lesson/lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste?mode=learn&section=reader.section.block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste.fuentes-y-alcance', lessonId: 'lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', section: 'Fuentes y alcance', viewport: '1024×768', state: 'Texto suficiente', expected: 'Lectura ampliada sin columna vacía.', limitations: 'La ausencia de visual es una decisión estructural curada; otros apartados de esta lección siguen pendientes de fuente.' },
  { fileName: '14-editorial-review.png', route: '#/learning/editorial-review?lesson=lesson.horology.system', lessonId: 'lesson.horology.system', section: 'Revisión editorial', viewport: '1440×1000', state: 'Pendiente', expected: 'Texto, visual, hashes, fuentes, límites y flags; ninguna aprobación automática.', limitations: 'Captura sin guardar una aprobación.' },
  { fileName: '15-mobile-section-resume.png', route: '#/learning/lesson/lesson.horology.system?mode=learn&section=reader.section.block.horology.system.explicacion-visual', lessonId: 'lesson.horology.system', section: 'Explicación visual', viewport: '480×900', state: 'Reanudación desde marcador', expected: 'Layout móvil, visual inline y retorno exacto mediante section.', limitations: 'Marcador temporal eliminado tras QA; la captura no contiene datos personales.' },
] as const

export const ACADEMY_014D_QA_CASES = [
  ['1440×1000', 'verified-browser'], ['1024×768', 'verified-browser'], ['760×900', 'verified-browser'], ['480×900', 'verified-browser'],
  ['Reflow 200 %', 'verified-equivalent-720-css-px; zoom-event-unobservable-in-iab'], ['Tema claro', 'verified-browser-restored'], ['Tema oscuro', 'verified-browser-restored'], ['Reduced motion', 'verified-browser-and-state-test-restored'],
  ['Sin WebGL', 'verified-deterministic-fallback-test'], ['Fallo controlado de fixture', 'verified-deterministic-fallback-test'], ['Lección sin visual', 'verified-browser'],
  ['Visual esencial', 'verified-browser'], ['Varios estados 3D', 'verified-browser-and-nine-state-test'], ['Nota de apartado', 'verified-browser-cleaned'],
  ['Marcador de apartado', 'verified-browser-cleaned'], ['Reanudación', 'verified-browser-exact-section'], ['Revisión editorial', 'verified-browser-owner-pending'],
  ['Exportación de sesión de uso', 'verified-ui-and-payload-test; download-event-unobservable-in-iab'],
] as const
