export interface AcademyReaderQaCase {
  caseId: string
  state: string
  lessonId?: string
  viewport: '1440x1000' | '1024x768' | '760x900' | '480x900' | '200%-reflow'
  status: 'pass-browser' | 'pass-fixture' | 'fail'
  evidence: string
}

export const ACADEMY_READER_QA_CASES: readonly AcademyReaderQaCase[] = [
  { caseId: 'qa.01', state: 'Lección conceptual corta', lessonId: 'lesson.advanced.calendars', viewport: '1440x1000', status: 'pass-browser', evidence: 'Lector real: 8 secciones, 5.607 caracteres, sin overflow horizontal.' },
  { caseId: 'qa.02', state: 'Lección extensa', lessonId: 'lesson.encyclopedia.cases-water.arquitectura-de-caja', viewport: '1440x1000', status: 'pass-browser', evidence: 'Lector real: 11 secciones, 8.029 caracteres y CTA final visible; sin overflow.' },
  { caseId: 'qa.03', state: 'Diez o más secciones', lessonId: 'lesson.miyota8215.guided-disassembly', viewport: '1024x768', status: 'pass-browser', evidence: 'Lector real: 17 secciones, índice compacto y práctica bloqueada explicada.' },
  { caseId: 'qa.04', state: 'Lección sin visual', lessonId: 'lesson.encyclopedia.history-language.medir-el-tiempo', viewport: '1024x768', status: 'pass-browser', evidence: 'Lector real: 11 secciones, cero figure y ningún rail o placeholder visual vacío.' },
  { caseId: 'qa.05', state: 'Escena 3D', lessonId: 'lesson.miyota8215.architecture', viewport: '1024x768', status: 'pass-browser', evidence: 'Canvas real cargado al activar «Visual e interacción»; texto, caption, fidelidad y límites siguieron visibles.' },
  { caseId: 'qa.06', state: 'Varios cues', lessonId: 'lesson.horology.mechanical-chain', viewport: '1024x768', status: 'pass-browser', evidence: 'Scrollspy real cambió el cue de «Explicación principal» a «Ejemplo» sin abrir actividad evaluada.' },
  { caseId: 'qa.07', state: 'Tabla Markdown', viewport: '1024x768', status: 'pass-fixture', evidence: 'El corpus visible no contiene tabla Markdown authored; fixture AST renderiza table/th/td y listas anidadas. Limitación explícita: no existe estado real que inspeccionar.' },
  { caseId: 'qa.08', state: 'Fórmula no verificada preservada', lessonId: 'lesson.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio', viewport: '1024x768', status: 'pass-fixture', evidence: 'La incidencia OCR sigue vinculada en 0.14A.1; el lector real no creó nodos MathML/KaTeX ni scripts y el fixture conserva la cadena literal.' },
  { caseId: 'qa.09', state: 'Fuentes desplegadas', lessonId: 'lesson.horology.functional-equivalence', viewport: '760x900', status: 'pass-browser', evidence: 'Dos grupos secundarios cerrados por defecto; «Fuentes» abrió desde el índice, quedó aria-current y devolvió foco a Índice.' },
  { caseId: 'qa.10', state: 'Reanudación intermedia', lessonId: 'lesson.horology.mechanical-chain', viewport: '1024x768', status: 'pass-browser', evidence: '«Explicación visual» se guardó, se abandonó la ruta y se restauró en el mismo apartado (scroll 2.056 px).' },
  { caseId: 'qa.11', state: 'Deep link de segmento antiguo', lessonId: 'lesson.horology.mechanical-chain', viewport: '1024x768', status: 'pass-browser', evidence: '?segment=block.horology.mechanical-chain.segment.orient.1 abrió «Propósito» sin error fatal.' },
  { caseId: 'qa.12', state: 'Modo Aprender', lessonId: 'lesson.horology.mechanical-chain', viewport: '1440x1000', status: 'pass-browser', evidence: 'Modo Aprender real con outline, copia y visual sincronizado; sin main anidado ni overflow.' },
  { caseId: 'qa.13', state: 'Modo Lectura', lessonId: 'lesson.horology.mechanical-chain', viewport: '1024x768', status: 'pass-browser', evidence: 'Modo Lectura real eliminó figures y mantuvo contenido, sección activa y finalización.' },
  { caseId: 'qa.14', state: 'Cambio entre modos', lessonId: 'lesson.horology.mechanical-chain', viewport: '480x900', status: 'pass-browser', evidence: 'Cambio Aprender→Lectura conservó «Conocimientos previos» y reancló el apartado tras cambiar la altura del documento.' },
  { caseId: 'qa.15', state: 'Finalización con práctica', lessonId: 'lesson.horology.system', viewport: '1024x768', status: 'pass-browser', evidence: 'Perfil QA temporal: el CTA explícito creó «Lección estudiada» y conservó la relación con la práctica requerida.' },
  { caseId: 'qa.16', state: 'Finalización sin práctica', viewport: '1024x768', status: 'pass-fixture', evidence: 'Las 222 lecciones actuales declaran práctica; el contrato sin requiredActivityIds se valida mediante fixture y consulta academyNextAction. No se inventó un estado visible.' },
  { caseId: 'qa.17', state: 'Práctica bloqueada', lessonId: 'lesson.horology.system', viewport: '480x900', status: 'pass-browser', evidence: 'Estado real: la lección pudo cerrarse, la práctica permaneció bloqueada y se mostró enlace al requisito del capítulo.' },
  { caseId: 'qa.18', state: 'Fallo controlado del modelo', lessonId: 'lesson.miyota8215.architecture', viewport: '1024x768', status: 'pass-fixture', evidence: 'La carga real produjo canvas; el rechazo controlado de createSceneComposition está cubierto por el fallback independiente del texto. No se inyectó un fallo en datos del usuario.' },
  { caseId: 'qa.19', state: 'Perfil histórico en-US con español efectivo', lessonId: 'lesson.horology.system', viewport: '480x900', status: 'pass-fixture', evidence: 'El selector real mantiene English deshabilitado como traducción pendiente; la normalización histórica en-US→es efectivo queda cubierta por compatibilidad sin crear un perfil falso.' },
  { caseId: 'qa.20', state: 'Lección completada previamente', lessonId: 'lesson.horology.system', viewport: '1024x768', status: 'pass-browser', evidence: 'Perfil QA temporal: tras salir y volver, «Lección estudiada» permaneció. El perfil temporal se eliminó luego con su token exacto.' },
  { caseId: 'qa.21', state: 'Lección legacy-inferred', lessonId: 'lesson.horology.system', viewport: '200%-reflow', status: 'pass-fixture', evidence: 'No había perfil legacy-inferred local; la política versionada y el corte exacto se verifican con fixture sin reescribir sesiones.' },
  { caseId: 'qa.22', state: 'Etapa 5 con cobertura parcial', lessonId: 'lesson.encyclopedia.cases-water.arquitectura-de-caja', viewport: '200%-reflow', status: 'pass-browser', evidence: 'Mi ruta mostró cobertura parcial/planificada de etapa 5 a 720×450, equivalente de reflow; overflow horizontal 0.' },
] as const

export const ACADEMY_READER_PERFORMANCE_SNAPSHOT = {
  measuredAt: '2026-08-14',
  method: 'in-app-browser-warm-dev-cache-node-orchestration',
  viewport: '1024x768',
  textReadyMilliseconds: 183,
  interactiveVisualMilliseconds: 1_465,
  canvasesMounted: 1,
  sceneLessonSections: 16,
  heapUsedBytes: null,
  heapTotalBytes: null,
  heapLimitation: 'performance.memory no está disponible en esta sesión; no se inventa una aproximación de heap.',
  productionBundle: {
    readerJavaScriptKb: 189.19,
    readerJavaScriptGzipKb: 57.91,
    readerCssKb: 8.86,
    readerCssGzipKb: 2.12,
    sceneLoaderJavaScriptKb: 1.51,
    sceneLoaderJavaScriptGzipKb: 0.81,
    viewportJavaScriptKb: 26.72,
    viewportJavaScriptGzipKb: 9.03,
    sceneFixturesJavaScriptKb: 35.83,
    sceneFixturesJavaScriptGzipKb: 11.67,
  },
  caveat: 'Cifras orientativas de una ejecución local caliente; no son un benchmark de producción ni una métrica de aprendizaje.',
} as const
