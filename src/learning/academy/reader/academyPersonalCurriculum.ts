import type {
  AcademyDiagramData,
  AcademyPersonalTechnicalStatus,
  AcademyPilotResultStatus,
  AcademyPilotReviewDecision,
  AcademyReaderSection,
  AcademySectionVisualCuration,
} from './academyReaderModel'
import { academyVisualDefinitions } from './academyReaderCuration'

export interface AcademyPersonalPilotReview {
  lessonId: string
  centralQuestion: string
  whyNow: string
  result: AcademyPilotResultStatus
  technicalStatus: AcademyPersonalTechnicalStatus
  decisions: AcademyPilotReviewDecision[]
  summary: string
  practiceIntent: string
}

interface SectionPatch {
  sectionId: string
  title?: string
  markdown: string
}

const sectionId = (blockId: string, suffix: string) => `reader.section.${blockId}.${suffix}`

export const ACADEMY_PERSONAL_PILOT_REVIEWS: readonly AcademyPersonalPilotReview[] = [
  {
    lessonId: 'lesson.horology.system',
    centralQuestion: '¿Qué funciones debe cumplir un reloj completo antes de que tenga sentido estudiar sus piezas?',
    whyNow: 'Es el punto de entrada: primero se construye un mapa del objeto completo y después se estudian sus mecanismos.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-reviewed',
    decisions: ['edit', 'remove-repetition', 'improve-visual'],
    summary: 'Distingue reloj completo, movimiento, funciones y estructura sin exigir vocabulario previo.',
    practiceIntent: 'Clasificar funciones y justificar relaciones; evidencia K+V, nunca destreza física.',
  },
  {
    lessonId: 'lesson.horology.mechanical-chain',
    centralQuestion: '¿Cómo viajan la energía y la referencia temporal desde el barrilete hasta las agujas?',
    whyNow: 'Aplica el mapa funcional anterior a un reloj mecánico sin convertir un calibre concreto en regla universal.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-reviewed',
    decisions: ['edit', 'qualify-claim', 'improve-visual'],
    summary: 'Separa el flujo de energía de la información temporal y limita el 8215 a ejemplo documentado.',
    practiceIntent: 'Ordenar la cadena, localizar una interrupción y explicar su consecuencia con K+V+R.',
  },
  {
    lessonId: 'lesson.horology.functional-equivalence',
    centralQuestion: '¿Qué problemas resuelven tanto un reloj mecánico como uno de cuarzo, y con qué soluciones distintas?',
    whyNow: 'Permite transferir el mapa funcional sin confundir analogía pedagógica con identidad física.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-reviewed',
    decisions: ['edit', 'qualify-claim', 'improve-visual'],
    summary: 'Conserva equivalencias funcionales y hace explícito dónde termina cada analogía.',
    practiceIntent: 'Emparejar funciones y escribir el límite de cada pareja; evidencia K+V+R.',
  },
  {
    lessonId: 'lesson.horology.failure-prediction',
    centralQuestion: '¿Cómo se pasa de un síntoma a una prueba útil sin confundir hipótesis con diagnóstico?',
    whyNow: 'Usa las cadenas ya conocidas para razonar sobre fallos antes de introducir procedimientos de banco.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-reviewed',
    decisions: ['edit', 'qualify-claim', 'improve-visual'],
    summary: 'Organiza síntoma, hipótesis rival, prueba discriminante, resultado y decisión revisable.',
    practiceIntent: 'Formular dos hipótesis y elegir una prueba que las distinga; evidencia K+V+R.',
  },
  {
    lessonId: 'lesson.mechanical.energy',
    centralQuestion: '¿Cómo puede un reloj almacenar energía y entregarla poco a poco sin crearla?',
    whyNow: 'Abre los fundamentos mecánicos separando energía, par, movimiento, ritmo y pérdidas.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'reorder', 'remove-repetition', 'qualify-claim'],
    summary: 'La introducción breve pasa a orientar la explicación extensa en vez de duplicarla.',
    practiceIntent: 'Reconstruir la cadena, interrumpir una interfaz y documentar qué cambia; K+V+R.',
  },
  {
    lessonId: 'lesson.mechanical.barrel',
    centralQuestion: '¿Cómo cambia el papel del árbol y del tambor entre la cuerda y la marcha?',
    whyNow: 'Concreta dónde se almacena la energía antes de seguirla por el tren.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'remove-repetition', 'qualify-claim'],
    summary: 'Diferencia muelle, árbol, tambor, tapa y ganchos sin convertir el esquema en procedimiento.',
    practiceIntent: 'Identificar piezas y comparar cuerda con descarga en el modelo conceptual; K+V.',
  },
  {
    lessonId: 'lesson.mechanical.gear-pair',
    centralQuestion: '¿Qué determina el sentido y la relación de velocidad entre una rueda conductora y un piñón conducido?',
    whyNow: 'Introduce la relación elemental que luego se encadena en un tren completo.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'remove-repetition', 'qualify-claim'],
    summary: 'Separa relación ideal, sentido, contacto posible y límites geométricos del modelo.',
    practiceIntent: 'Predecir sentido, calcular una relación declarada y detectar un engrane imposible; K+V+R.',
  },
  {
    lessonId: 'lesson.mechanical.train',
    centralQuestion: '¿Cómo se combinan varios pares de engranajes para llevar movimiento hasta el escape y la indicación?',
    whyNow: 'Amplía la pareja de engranajes a una cadena con varias interfaces y posibles interrupciones.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'remove-repetition', 'improve-visual', 'qualify-claim'],
    summary: 'El tren conceptual queda separado de cualquier conteo o geometría del MIYOTA 8215.',
    practiceIntent: 'Construir, calcular y bloquear etapas declaradas; evidencia K+V+R.',
  },
  {
    lessonId: 'lesson.mechanical.escapement',
    centralQuestion: '¿Cómo alterna el escape bloqueo, desbloqueo, impulso y caída para dosificar la energía?',
    whyNow: 'Explica cómo el tren continuo coopera con un oscilador alternativo.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'remove-repetition', 'qualify-claim', 'improve-visual'],
    summary: 'Las fases son conceptuales y no autorizan ajuste, lubricación ni geometría de un calibre.',
    practiceIntent: 'Ordenar fases y distinguir caras de bloqueo e impulso; K+V.',
  },
  {
    lessonId: 'lesson.mechanical.oscillator',
    centralQuestion: '¿Cómo forman el volante y la espiral una referencia periódica sin confundirse con el escape?',
    whyNow: 'Completa la regulación después de entender la entrega dosificada de energía.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'remove-repetition', 'qualify-claim', 'improve-visual'],
    summary: 'Distingue periodo, frecuencia, alternancia y amplitud antes de introducir regulación física.',
    practiceIntent: 'Relacionar magnitudes y explicar tendencias del modelo, no ajustar una espiral real; K+V+R.',
  },
  {
    lessonId: 'lesson.metrology.observe-before-measuring',
    centralQuestion: '¿Qué sabemos de una pieza antes de medirla y qué estamos suponiendo?',
    whyNow: 'Prepara el diagnóstico: una medición útil empieza con una observación y una pregunta explícitas.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-reviewed',
    decisions: ['edit', 'remove-repetition', 'improve-visual'],
    summary: 'Separa descripción, identificación, hipótesis, magnitud, instrumento e incertidumbre.',
    practiceIntent: 'Registrar observaciones neutrales y justificar una medición; K+V+R.',
  },
  {
    lessonId: 'lesson.miyota8215.architecture',
    centralQuestion: '¿Cómo se relacionan los subsistemas documentados del 8215 dentro de un mismo movimiento?',
    whyNow: 'Transfiere principios generales a un calibre real con documentación oficial, sin convertirlo en arquitectura universal.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-reviewed',
    decisions: ['edit', 'qualify-claim', 'improve-visual', 'replace-example'],
    summary: 'El 8215 queda como calibre de referencia, caso trabajado y laboratorio de aplicación.',
    practiceIntent: 'Localizar subsistemas y comparar su función con el modelo general; K+V+R.',
  },
  {
    lessonId: 'lesson.miyota8215.guided-disassembly',
    centralQuestion: '¿Qué dependencias estructurales pueden leerse con seguridad antes de intentar un desmontaje físico?',
    whyNow: 'Aplica identificación y documentación a un caso real, pero separa el despiece de una secuencia oficial de servicio.',
    result: 'needs-source', technicalStatus: 'source-needed',
    decisions: ['edit', 'correct-claim', 'qualify-claim', 'block-by-source', 'improve-visual'],
    summary: 'La actividad digital pasa a leer fijaciones y dependencias; no prescribe una secuencia completa.',
    practiceIntent: 'Reconstruir dependencias documentadas virtualmente; V no produce P.',
  },
  {
    lessonId: 'lesson.miyota8215.inspection',
    centralQuestion: '¿Qué puede observarse en el modelo y qué exigiría una pieza real, aumento o medición?',
    whyNow: 'Después de localizar piezas, enseña a separar evidencia visible, defecto posible e incertidumbre.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'qualify-claim', 'improve-visual'],
    summary: 'Los defectos digitales quedan identificados como símbolos; no prueban desgaste ni tolerancia.',
    practiceIntent: 'Clasificar observación, símbolo e inferencia y proponer la siguiente comprobación; K+V+R.',
  },
  {
    lessonId: 'lesson.encyclopedia.cases-water.arquitectura-de-caja',
    centralQuestion: '¿Qué interfaces deben ser compatibles para convertir un movimiento y una caja en un reloj utilizable?',
    whyNow: 'Introduce la integración de un reloj completo sin reducir compatibilidad a un único diámetro.',
    result: 'ready-but-user-review-pending', technicalStatus: 'source-limited',
    decisions: ['edit', 'qualify-claim', 'improve-visual'],
    summary: 'Distingue cadena axial, línea de tija, retención, cierre y datos todavía desconocidos.',
    practiceIntent: 'Construir un dossier de compatibilidad con datos oficiales, medidas pendientes y pruebas; K+R.',
  },
  {
    lessonId: 'lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste',
    centralQuestion: '¿Qué relaciones geométricas permiten que las agujas permanezcan sujetas, legibles y libres durante todo el giro?',
    whyNow: 'Completa la cadena axial con una interfaz que requiere documentación dimensional y comprobación física.',
    result: 'needs-source', technicalStatus: 'source-needed',
    decisions: ['edit', 'qualify-claim', 'block-by-source'],
    summary: 'Se conserva la explicación geométrica, pero no se inventan diámetros, alturas, interferencias ni métodos de ajuste.',
    practiceIntent: 'Preparar una lista de datos y comprobaciones; cualquier manipulación física es opcional, autodocumentada y no certificada.',
  },
] as const

export const ACADEMY_PERSONAL_PILOT_IDS = new Set(ACADEMY_PERSONAL_PILOT_REVIEWS.map(({ lessonId }) => lessonId))

const SECTION_PATCHES: Readonly<Record<string, readonly SectionPatch[]>> = {
  'lesson.horology.system': [
    { sectionId: sectionId('block.horology.system', 'proposito'), title: 'Pregunta central y punto de partida', markdown: '**Pregunta central:** ¿qué funciones debe cumplir un reloj completo antes de estudiar sus piezas?\n\nNo necesitas vocabulario previo. Primero reconocerás el objeto completo, después las relaciones entre sus partes y, por último, los nombres técnicos imprescindibles.' },
    { sectionId: sectionId('block.horology.system', 'actividad'), markdown: 'Clasifica cada elemento por la función que cumple y justifica una relación de entrada y salida. La actividad comprueba una explicación **K** y su aplicación virtual **V**; no evalúa manipulación física.' },
  ],
  'lesson.horology.mechanical-chain': [
    { sectionId: sectionId('block.horology.mechanical-chain', 'conocimientos-previos'), markdown: 'Basta con distinguir cuatro ideas del mapa anterior: una fuente entrega energía, una transmisión la conduce, un regulador establece el ritmo y una indicación hace visible el resultado. Todavía no necesitas reconocer un calibre.' },
    { sectionId: sectionId('block.horology.mechanical-chain', 'actividad'), markdown: 'Ordena barrilete, tren, escape, áncora, volante y espiral e indicación. Después interrumpe una interfaz y explica qué queda aguas arriba y aguas abajo. Registra una explicación **K**, una aplicación virtual **V** y el razonamiento resultante **R**.' },
  ],
  'lesson.horology.functional-equivalence': [
    { sectionId: sectionId('block.horology.functional-equivalence', 'conocimientos-previos'), markdown: 'Necesitas reconocer el mapa funcional y haber visto, al menos de forma general, una cadena mecánica y otra de cuarzo. Si un término no resulta familiar, usa el diagrama paralelo: la lección introduce la comparación, no exige memorizar piezas.' },
    { sectionId: sectionId('block.horology.functional-equivalence', 'actividad'), markdown: 'Empareja funciones, no piezas. Para cada pareja escribe una semejanza funcional y una diferencia física que impida tratarla como identidad. Evidencia: explicación **K**, aplicación **V** y comparación razonada **R**.' },
  ],
  'lesson.horology.failure-prediction': [
    { sectionId: sectionId('block.horology.failure-prediction', 'proposito'), title: 'Pregunta central y por qué aparece ahora', markdown: '**Pregunta central:** ¿cómo se pasa de un síntoma a una prueba útil sin convertir una sospecha en diagnóstico?\n\nYa conoces las cadenas funcionales. Ahora las usarás para formular hipótesis rivales, buscar un dato que las diferencie y mantener explícita la incertidumbre.' },
    { sectionId: sectionId('block.horology.failure-prediction', 'actividad'), markdown: 'Parte de un síntoma declarado. Formula dos hipótesis compatibles, elige una prueba no destructiva que produzca resultados distintos y explica la decisión para cada resultado. La simulación aporta **V** y el registro revisable aporta **R**; no diagnostica un reloj real.' },
  ],
}

const mechanicalOrientationPatches = (
  blockId: string,
  question: string,
  vocabulary: string,
  bridge: string,
): readonly SectionPatch[] => [
  { sectionId: sectionId(blockId, 'proposito'), title: 'Pregunta central', markdown: question },
  { sectionId: sectionId(blockId, 'palabras-y-piezas-clave'), title: 'Vocabulario para empezar', markdown: vocabulary },
  { sectionId: sectionId(blockId, 'resumen-y-conexion'), title: 'Mapa y puente de la lección', markdown: bridge },
]

Object.assign(SECTION_PATCHES, {
  'lesson.mechanical.energy': mechanicalOrientationPatches(
    'block.mechanical.energy',
    '¿Cómo puede un reloj almacenar energía y entregarla poco a poco sin crearla? Empieza siguiendo una sola transformación: muelle cargado → par en el barrilete → transmisión → liberación dosificada.',
    '**Energía** es capacidad de producir trabajo; **par** es tendencia a girar; **movimiento** es el cambio observable; **ritmo** es la regularidad temporal; **pérdida** es energía que deja de estar disponible para la función buscada.',
    'Primero construirás el flujo completo; después distinguirás par, velocidad y potencia, y finalmente analizarás una interrupción. La siguiente lección abre el barrilete conceptual para localizar dónde se almacena la energía.',
  ),
  'lesson.mechanical.barrel': mechanicalOrientationPatches(
    'block.mechanical.barrel',
    '¿Cómo cambian las funciones del árbol, el muelle y el tambor entre la cuerda y la marcha? El objetivo es comprender el conjunto, no aprender todavía a abrir o lubricar un barrilete.',
    '**Árbol:** recibe la cuerda. **Muelle real:** almacena energía elástica. **Tambor:** contiene el muelle y entrega movimiento por su dentado durante la marcha. **Tapa y ganchos:** cierran y conectan el conjunto; su forma concreta depende del diseño.',
    'Compara dos estados: durante la cuerda gira el árbol respecto al tambor retenido; durante la marcha el árbol queda retenido y el tambor puede entregar movimiento. Después estudiarás cómo ese movimiento pasa a una pareja de engranajes.',
  ),
  'lesson.mechanical.gear-pair': mechanicalOrientationPatches(
    'block.mechanical.gear-pair',
    '¿Qué cambia cuando una rueda conductora de Z1 dientes impulsa un piñón o rueda conducida de Z2 dientes? Separarás sentido, relación ideal y posibilidad geométrica de engrane.',
    '**Conductora:** elemento que entrega movimiento. **Conducida:** elemento que lo recibe. **Z1 y Z2:** números de dientes declarados. **Engrane externo:** contacto que invierte el sentido. La proximidad visual no prueba un engrane válido.',
    'Primero predice el sentido; luego interpreta la relación simbólica y, por último, comprueba si la interfaz declarada es posible. La siguiente lección encadena varias parejas sin atribuir sus dientes a un calibre real.',
  ),
  'lesson.mechanical.train': mechanicalOrientationPatches(
    'block.mechanical.train',
    '¿Cómo se acumulan varias relaciones de engrane para llevar movimiento desde el barrilete hasta el escape y la indicación? Sigue interfaces y ejes, no una simple fila de ruedas.',
    '**Móvil:** rueda y piñón solidarios sobre un eje. **Etapa:** una interfaz conductora–conducida. **Relación total:** producto de las relaciones declaradas. **Cuarta rueda:** etapa vinculada a la indicación de segundos en muchas arquitecturas, no una regla dimensional universal.',
    'Construirás una etapa, después un tren y finalmente una interrupción. El modelo es conceptual: no contiene depthing, módulo de dientes ni conteos oficiales del 8215. A continuación estudiarás cómo el escape dosifica la salida.',
  ),
  'lesson.mechanical.escapement': mechanicalOrientationPatches(
    'block.mechanical.escapement',
    '¿Cómo alterna el escape de áncora suizo bloqueo, desbloqueo, impulso y caída? La secuencia explica una función; no constituye un método de ajuste físico.',
    '**Rueda de escape:** recibe el tren. **Paletas:** ofrecen caras de bloqueo e impulso. **Áncora:** alterna contactos. **Volante:** provoca el desbloqueo y recibe impulso. **Caída:** avance libre limitado después del impulso.',
    'Recorre las fases lentamente, identifica qué contacto actúa y predice qué ocurre si una fase no se completa. Después estudiarás el oscilador que gobierna esta alternancia.',
  ),
  'lesson.mechanical.oscillator': mechanicalOrientationPatches(
    'block.mechanical.oscillator',
    '¿Cómo producen volante y espiral una oscilación repetible, y qué papel distinto cumple el escape? Empieza separando periodo, frecuencia y amplitud.',
    '**Volante:** aporta inercia rotatoria. **Espiral:** proporciona retorno elástico. **Periodo:** duración de un ciclo. **Frecuencia:** ciclos por segundo. **Alternancia:** medio ciclo. **Amplitud:** alejamiento angular del equilibrio.',
    'Primero identifica funciones, después relaciona magnitudes y finalmente interpreta tendencias cualitativas. El modelo no calcula marcha ni sustituye la observación de un órgano regulador real.',
  ),
})

Object.assign(SECTION_PATCHES, {
  'lesson.metrology.observe-before-measuring': [
    { sectionId: sectionId('block.metrology.observe-before-measuring', 'palabras-y-piezas-clave'), title: 'Vocabulario contextual', markdown: '**Observación:** descripción que otra persona podría volver a comprobar. **Identificación:** nombre provisional de la pieza o zona. **Hipótesis:** explicación todavía abierta. **Magnitud:** propiedad que se decide medir. **Incertidumbre:** duda que acompaña al resultado.' },
    { sectionId: sectionId('block.metrology.observe-before-measuring', 'practica-deliberada'), markdown: 'Elige una pieza segura o una imagen propia. Escribe cinco observaciones neutrales, formula dos hipótesis y selecciona una magnitud que permitiría distinguirlas. Registra por qué ese instrumento sería adecuado y qué seguiría sin saberse.' },
  ],
  'lesson.miyota8215.architecture': [
    { sectionId: sectionId('block.miyota8215.architecture', 'proposito'), title: 'Pregunta central y papel del calibre', markdown: '¿Cómo se relacionan los subsistemas documentados del MIYOTA 8215 dentro de un único movimiento? El 8215 actúa como **calibre de referencia y caso trabajado**; no sustituye la arquitectura general de la relojería.' },
    { sectionId: sectionId('block.miyota8215.architecture', 'explicacion'), markdown: 'La documentación oficial permite nombrar y agrupar rotor, sistema automático, barrilete, tren, escape, volante, calendario y puesta en hora. El fixture reúne esas relaciones en un modelo estructural normalizado. Aislar una capa ayuda a localizarla, pero no demuestra medidas, holguras, lubricación ni una secuencia de servicio.' },
    { sectionId: sectionId('block.miyota8215.architecture', 'visual-e-interaccion'), markdown: 'Empieza con el movimiento completo. Aísla después **tren**, **automático** y **calendario**; en cada estado explica qué función general reconoces y qué dato pertenece específicamente al 8215. La transparencia y la explosión son recursos de lectura espacial, no posiciones de funcionamiento.' },
    { sectionId: sectionId('block.miyota8215.architecture', 'ejemplo-resuelto'), markdown: 'El rotor y las ruedas de carga se identifican en la documentación como partes del sistema automático. El caso permite aplicar la idea general “movimiento del usuario → carga del muelle”, pero el fixture no valida la ruta cinemática completa, el sentido de cada engrane ni su rendimiento.' },
    { sectionId: sectionId('block.miyota8215.architecture', 'actividad-errores-y-ayuda'), title: 'Práctica de transferencia', markdown: 'Localiza un subsistema, explica su función general y cita la evidencia oficial que respalda su identidad. Después señala un dato que el despiece no demuestra. La actividad registra **K+V+R**, no destreza física.' },
  ],
  'lesson.miyota8215.guided-disassembly': [
    { sectionId: sectionId('block.miyota8215.guided-disassembly', 'proposito'), title: 'Pregunta central y límite de fuente', markdown: '¿Qué dependencias estructurales pueden leerse antes de tocar un movimiento? La documentación disponible identifica piezas, fijaciones y posición relativa; no se presenta como una secuencia oficial completa de desmontaje.' },
    { sectionId: sectionId('block.miyota8215.guided-disassembly', 'explicacion'), markdown: 'Cada estado digital relaciona una fijación con la pieza o subconjunto que retiene. Puedes predecir qué acceso quedaría libre y registrar orientación o bandeja. No debes inferir del despiece la herramienta exacta, el sentido de giro, el par, la fuerza, la distancia de extracción ni el orden completo.' },
    { sectionId: sectionId('block.miyota8215.guided-disassembly', 'visual-e-interaccion'), markdown: 'Usa las vistas de rotor y puente de barrilete como **mapas de dependencia**. La separación visual es simbólica y reversible. Si una relación no está documentada, queda marcada como pendiente de fuente y no como paso obligatorio.' },
    { sectionId: sectionId('block.miyota8215.guided-disassembly', 'actividad-errores-y-ayuda'), title: 'Práctica digital de dependencias', markdown: 'Identifica fijación, pieza retenida, acceso esperado y dato todavía desconocido. Reconstruye solo las dependencias respaldadas. Esta práctica puede aportar **K**, **V** y **R**; nunca produce **P**.' },
    { sectionId: sectionId('block.miyota8215.guided-disassembly', 'ejemplo-resuelto'), markdown: 'El tornillo del rotor y la masa oscilante aparecen asociados en el despiece. Eso respalda una dependencia estructural. No respalda por sí solo herramienta, sentido, par, técnica de sujeción ni que ese sea siempre el primer paso de servicio.' },
    { sectionId: sectionId('block.miyota8215.guided-disassembly', 'limitaciones'), markdown: '- El despiece identifica piezas y agrupaciones; no certifica una secuencia completa.\n- La explosión del fixture no representa dirección ni distancia real de extracción.\n- No se evalúan fuerza, postura, control de herramienta ni daño físico.\n- Cualquier práctica física necesita documentación aplicable, preparación segura y registro independiente.' },
  ],
  'lesson.miyota8215.inspection': [
    { sectionId: sectionId('block.miyota8215.inspection', 'proposito'), title: 'Pregunta central y alcance', markdown: '¿Qué puede observarse en un modelo estructural y qué exigiría una pieza real, iluminación, aumento o medición? El objetivo es separar evidencia visible, símbolo educativo e inferencia.' },
    { sectionId: sectionId('block.miyota8215.inspection', 'visual-e-interaccion'), markdown: 'Aísla el tren o una interfaz de apoyo para localizar la zona. Los estados de suciedad, diente o pivote son símbolos controlados: sirven para practicar el lenguaje de inspección, no para representar el aspecto real de desgaste o contaminación.' },
    { sectionId: sectionId('block.miyota8215.inspection', 'actividad-errores-y-ayuda'), title: 'Práctica de inspección razonada', markdown: 'Para cada caso registra: objeto, zona, evidencia visible, defecto posible, hipótesis rival, comprobación necesaria y grado de incertidumbre. Un resultado digital aporta **V** y un registro revisable **R**; no demuestra inspección física.' },
    { sectionId: sectionId('block.miyota8215.inspection', 'ejemplo-resuelto'), markdown: 'El modelo resalta una rueda como desplazada. La observación válida es “el escenario marca una posición distinta”. Concluir eje doblado, rubí dañado o holgura incorrecta requeriría una pieza física, comparación, aumento y medición.' },
  ],
  'lesson.encyclopedia.cases-water.arquitectura-de-caja': [
    { sectionId: sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', 'resultado-buscado-y-condicion-segura'), title: 'Pregunta central y vista general', markdown: '¿Qué interfaces deben ser compatibles para convertir movimiento, esfera, agujas y caja en un reloj utilizable? La cadena incluye apoyo radial y axial, línea de tija, altura de indicación, cristal, cierre y juntas. Que el movimiento “quepa” no demuestra retención, libertad, acceso ni hermeticidad.' },
    { sectionId: sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', 'secuencia-controles-y-puntos-de-parada'), title: 'Orden de comprobación, no secuencia universal', markdown: '1. **Identificar datos oficiales:** envolvente del movimiento, salida de tija y dibujos aplicables.\n2. **Separar datos por medir:** esfera, agujas, caja, aro, tubo, corona, cristal y fondo reales.\n3. **Comprobar interfaces:** apoyo, centrado, retención y libertad axial antes de cerrar.\n4. **Detenerse ante interferencia:** una tija forzada, una aguja rozando o un cierre sin apoyo invalida la compatibilidad provisional.\n5. **Validar el prototipo:** documentar qué se ha medido y qué sigue sin probarse.\n\nEste orden organiza el razonamiento; no sustituye el plano ni el procedimiento del conjunto concreto.' },
    { sectionId: sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', 'practica-deliberada-y-transferencia'), markdown: 'Prepara un dossier de compatibilidad para un movimiento y una caja concretos. Separa datos oficiales, medidas propias, hipótesis y pruebas pendientes. No declares hermeticidad ni tolerancia sin el ensayo, instrumento y criterio correspondientes. Evidencia principal: **K+R**.' },
  ],
  'lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste': [
    { sectionId: sectionId('block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'caracteristica-que-se-quiere-fabricar'), title: 'Pregunta central y alcance', markdown: '¿Qué relaciones geométricas permiten que las agujas permanezcan sujetas, legibles y libres durante todo el giro? Se estudian tubo, concentricidad, paralelismo, masa y cadena de alturas. Los valores concretos dependen del movimiento, la esfera, las agujas y el cristal documentados.' },
    { sectionId: sectionId('block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'proceso-de-fabricacion-y-verificaciones'), title: 'Plan de comprobación antes de fabricar o ajustar', markdown: '1. Identificar el movimiento y la variante exactos.\n2. Reunir dibujos oficiales y datos del proveedor de agujas.\n3. Medir esfera, tubos, órganos de indicación y espacio bajo el cristal con método declarado.\n4. Construir la cadena axial y localizar la holgura mínima pendiente de verificar.\n5. Detenerse si falta una cota, el apoyo no es seguro o aparece contacto.\n\nSin esos datos no se prescribe prensado, cierre de tubo ni corrección manual.' },
    { sectionId: sectionId('block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'dimensiones-tolerancias-y-estado-superficial'), markdown: 'Datos que deben proceder de documento o medición: diámetro del órgano de indicación, tubo de la aguja, altura, descentramiento, masa y espacio disponible. Esta lección no aporta valores universales. Una tabla OCR o una familia parecida no sustituye el dibujo de la variante concreta.' },
    { sectionId: sectionId('block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'practica-deliberada-y-transferencia'), markdown: 'Construye una hoja de datos con cuatro columnas: dato oficial, medida propia, método y estado de verificación. Dibuja la cadena de alturas y marca cada interfaz desconocida. La manipulación física, si se realiza fuera de la Academia, es opcional, autodocumentada y no certificada.' },
  ],
})

function countWords(value: string): number {
  return value.replace(/\{\{term:([^}]+)\}\}/g, '$1').replace(/[`#*_|>~-]/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

export function academyPersonalPilotReview(lessonId: string): AcademyPersonalPilotReview | undefined {
  return ACADEMY_PERSONAL_PILOT_REVIEWS.find((review) => review.lessonId === lessonId)
}

export function applyAcademyPersonalSectionPatches(
  lessonId: string,
  sections: readonly AcademyReaderSection[],
): AcademyReaderSection[] {
  const patches = new Map((SECTION_PATCHES[lessonId] ?? []).map((patch) => [patch.sectionId, patch]))
  return sections.map((section) => {
    const patch = patches.get(section.sectionId)
    if (!patch) return section
    const title = patch.title ?? section.title
    return {
      ...section,
      title,
      heading: title,
      markdown: patch.markdown,
      wordCount: countWords(patch.markdown),
      curationMethod: 'pilot-override',
      curationConfidence: 'high',
    }
  })
}

export function academyPersonalPatchedSectionIds(lessonId: string): string[] {
  return (SECTION_PATCHES[lessonId] ?? []).map(({ sectionId: id }) => id)
}

export type AcademyVisualGapPriority = 'critical' | 'high'
export type AcademyVisualGapResult = 'implemented' | 'improved-existing' | 'source-needed' | 'photo-needed' | 'not-required' | 'rejected'

export interface AcademyCriticalHighVisualTarget {
  targetId: string
  priority: AcademyVisualGapPriority
  lessonId: string
  sectionId: string
  title: string
  result: AcademyVisualGapResult
  visualDesignId: string
  diagramSchemaId: string
  pedagogicalQuestion: string
  expectedObservation: string
  limitations: string[]
  data: AcademyDiagramData
}

const node = (id: string, label: string, lane?: string, emphasis?: 'normal' | 'primary' | 'warning') => ({ id, label, lane, emphasis })
const edge = (from: string, to: string, label?: string, kind: 'mechanical' | 'decision' | 'comparison' = 'decision') => ({ from, to, label, kind })

export const ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS: readonly AcademyCriticalHighVisualTarget[] = [
  {
    targetId: 'visual-gap.014e.cleaning-inspection-discriminating-test', priority: 'critical',
    lessonId: 'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion',
    sectionId: sectionId('block.encyclopedia.service-tribology.limpieza-e-inspeccion', 'de-la-observacion-a-la-prueba-discriminante'),
    title: 'De la observación a la prueba discriminante', result: 'implemented',
    visualDesignId: 'visual.diagnosis.cleaning-inspection.v1', diagramSchemaId: 'diagram.hypothesis-test-decision.v1',
    pedagogicalQuestion: '¿Qué prueba separa una huella superficial de un defecto funcional sin destruir evidencia?',
    expectedObservation: 'Una observación admite hipótesis rivales; la prueba se elige porque produciría resultados diferentes.',
    limitations: ['Árbol de razonamiento; no prescribe productos, tiempos, tolerancias ni criterios universales de limpieza.'],
    data: { title: 'Observación, hipótesis y prueba', nodes: [node('observation', 'Huella observada', undefined, 'primary'), node('h1', 'Residuo superficial'), node('h2', 'Daño o desgaste'), node('test', 'Prueba reversible'), node('r1', 'Cambia la huella'), node('r2', 'Permanece la huella'), node('decision', 'Registrar y decidir')], edges: [edge('observation', 'h1', 'hipótesis A'), edge('observation', 'h2', 'hipótesis B'), edge('h1', 'test'), edge('h2', 'test'), edge('test', 'r1', 'resultado A'), edge('test', 'r2', 'resultado B'), edge('r1', 'decision'), edge('r2', 'decision')], annotations: ['Conservar el estado inicial antes de limpiar.', 'Detenerse si la prueba puede borrar evidencia o dañar la pieza.'] },
  },
  {
    targetId: 'visual-gap.014e.assembly-control-points', priority: 'critical',
    lessonId: 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control',
    sectionId: sectionId('block.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Secuencia, controles y puntos de parada', result: 'implemented',
    visualDesignId: 'visual.assembly.control-gates.v1', diagramSchemaId: 'diagram.sequence-control-gates.v1',
    pedagogicalQuestion: '¿Qué debe comprobarse antes de liberar la siguiente función del montaje?',
    expectedObservation: 'Cada etapa termina en un control reversible; un fallo detiene la secuencia antes de acumular daño.',
    limitations: ['Secuencia funcional general, no orden oficial de montaje de un calibre ni criterio dimensional de aceptación.'],
    data: { title: 'Montaje por funciones y puertas de control', nodes: [node('baseline', 'Estado previo registrado'), node('seat', 'Asentar sin forzar'), node('control', 'Comprobar libertad', undefined, 'primary'), node('pass', 'Resultado coherente'), node('stop', 'Roce, tensión o duda', undefined, 'warning'), node('next', 'Liberar siguiente función')], edges: [edge('baseline', 'seat'), edge('seat', 'control'), edge('control', 'pass', 'pasa'), edge('control', 'stop', 'no pasa'), edge('pass', 'next'), edge('stop', 'baseline', 'detener y revisar')], phases: [{ id: 'prepare', label: 'Preparar' }, { id: 'assemble', label: 'Asentar' }, { id: 'check', label: 'Controlar' }, { id: 'release', label: 'Continuar o parar' }] },
  },
  {
    targetId: 'visual-gap.014e.reading-documentation-change', priority: 'high',
    lessonId: 'lesson.encyclopedia.history-language.leer-documentacion',
    sectionId: sectionId('block.encyclopedia.history-language.leer-documentacion', 'cambio-continuidad-y-consecuencia'),
    title: 'Cambio, continuidad y consecuencia', result: 'implemented',
    visualDesignId: 'visual.documentation.revision-consequence.v1', diagramSchemaId: 'diagram.document-revision-comparison.v1',
    pedagogicalQuestion: '¿Cómo se decide si un dato antiguo sigue siendo aplicable a la variante consultada?',
    expectedObservation: 'La coincidencia de nombre no basta: documento, revisión, variante y claim deben conservar trazabilidad.',
    limitations: ['Método de lectura documental; no afirma equivalencia entre revisiones concretas.'],
    data: { title: 'Documento, revisión y alcance', nodes: [node('claim', 'Dato que necesitas', 'question', 'primary'), node('old', 'Documento anterior', 'sources'), node('current', 'Documento vigente', 'sources'), node('same', 'Coincide y aplica', 'outcome'), node('changed', 'Cambió o no consta', 'outcome', 'warning'), node('use', 'Usar con localizador', 'decision'), node('limit', 'Limitar o bloquear', 'decision')], edges: [edge('claim', 'old'), edge('claim', 'current'), edge('old', 'same', 'comparar'), edge('current', 'same', 'comparar'), edge('old', 'changed', 'diferencia'), edge('current', 'changed', 'diferencia'), edge('same', 'use'), edge('changed', 'limit')] },
  },
  {
    targetId: 'visual-gap.014e.final-diagnosis', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.diagnostico-y-control-final',
    sectionId: sectionId('block.encyclopedia.service-tribology.diagnostico-y-control-final', 'de-la-observacion-a-la-prueba-discriminante'),
    title: 'Observación, hipótesis y control final', result: 'implemented',
    visualDesignId: 'visual.diagnosis.final-control.v1', diagramSchemaId: 'diagram.hypothesis-test-decision.v1',
    pedagogicalQuestion: '¿Qué resultado final apoya la causa propuesta y qué resultado obliga a reabrirla?',
    expectedObservation: 'El control final se deriva de la hipótesis y conserva una salida explícita de reabrir el diagnóstico.',
    limitations: ['No define tolerancias, posiciones de medida ni intervalos universales.'],
    data: { title: 'Diagnóstico causal y control final', nodes: [node('symptom', 'Síntoma inicial'), node('hypotheses', 'Hipótesis rivales'), node('test', 'Prueba discriminante', undefined, 'primary'), node('intervention', 'Intervención justificada'), node('final', 'Control final'), node('pass', 'Resultado estable'), node('reopen', 'Resultado incoherente', undefined, 'warning')], edges: [edge('symptom', 'hypotheses'), edge('hypotheses', 'test'), edge('test', 'intervention'), edge('intervention', 'final'), edge('final', 'pass', 'confirma'), edge('final', 'reopen', 'no confirma'), edge('reopen', 'hypotheses', 'reabrir')] },
  },
  {
    targetId: 'visual-gap.014e.assembly-worked-example', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control',
    sectionId: sectionId('block.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'ejemplo-de-trabajo-razonado'),
    title: 'Ejemplo de trabajo razonado', result: 'implemented',
    visualDesignId: 'visual.assembly.reasoned-example.v1', diagramSchemaId: 'diagram.observation-action-stop.v1',
    pedagogicalQuestion: '¿Por qué una pieza que no asienta libremente obliga a detenerse?',
    expectedObservation: 'La resistencia inesperada es información: no se compensa con fuerza, se revisan orientación, apoyo e interferencia.',
    limitations: ['Ejemplo causal general; no identifica una pieza ni una fuerza válida para todos los movimientos.'],
    data: { title: 'Asiento dudoso: decidir antes de forzar', nodes: [node('place', 'Presentar la pieza'), node('observe', 'No asienta libremente', undefined, 'warning'), node('h1', 'Orientación incorrecta'), node('h2', 'Interferencia o apoyo'), node('stop', 'Detener acción', undefined, 'primary'), node('inspect', 'Revisar evidencia'), node('retry', 'Reintentar solo si se resuelve')], edges: [edge('place', 'observe'), edge('observe', 'h1'), edge('observe', 'h2'), edge('h1', 'stop'), edge('h2', 'stop'), edge('stop', 'inspect'), edge('inspect', 'retry', 'condición resuelta')] },
  },
  {
    targetId: 'visual-gap.014e.intake-baseline', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.recepcion-y-linea-base',
    sectionId: sectionId('block.encyclopedia.service-tribology.recepcion-y-linea-base', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Secuencia y puntos de parada de recepción', result: 'implemented',
    visualDesignId: 'visual.intake.baseline-sequence.v1', diagramSchemaId: 'diagram.sequence-stop-points.v1',
    pedagogicalQuestion: '¿Qué debe conservarse antes de una prueba que pueda cambiar el estado recibido?',
    expectedObservation: 'La línea base precede a la intervención y contiene puntos de no prueba cuando existe riesgo de perder evidencia o causar daño.',
    limitations: ['No define un protocolo comercial, químico ni de servicio universal.'],
    data: { title: 'Recepción y línea base', nodes: [node('receive', 'Recibir sin intervenir'), node('history', 'Registrar historia'), node('external', 'Observar estado externo'), node('risk', 'Evaluar si probar cambia el estado', undefined, 'primary'), node('safe', 'Prueba reversible'), node('stop', 'No probar todavía', undefined, 'warning'), node('baseline', 'Guardar línea base')], edges: [edge('receive', 'history'), edge('history', 'external'), edge('external', 'risk'), edge('risk', 'safe', 'riesgo controlado'), edge('risk', 'stop', 'riesgo o duda'), edge('safe', 'baseline'), edge('stop', 'baseline')] },
  },
  {
    targetId: 'visual-gap.014e.tm-symptom-tree', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas',
    sectionId: sectionId('block.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'de-la-observacion-a-la-prueba-discriminante'),
    title: 'Árbol de razonamiento por síntomas', result: 'implemented',
    visualDesignId: 'visual.diagnosis.tm-symptom-tree.v1', diagramSchemaId: 'diagram.competing-hypotheses.v1',
    pedagogicalQuestion: '¿Qué prueba separa dos causas posibles de un mismo síntoma?',
    expectedObservation: 'Un síntoma abre ramas rivales; la siguiente observación se elige por su capacidad de descartar, no por tradición.',
    limitations: ['Patrón diagnóstico inspirado en la fuente histórica; sustancias, tolerancias e intervalos de época no se trasladan.'],
    data: { title: 'Síntoma → hipótesis rivales → prueba', nodes: [node('symptom', 'Síntoma observado', undefined, 'primary'), node('energy', 'Hipótesis: energía'), node('train', 'Hipótesis: transmisión'), node('indication', 'Hipótesis: indicación'), node('test', 'Prueba no destructiva'), node('evidence', 'Resultado registrado'), node('next', 'Siguiente decisión')], edges: [edge('symptom', 'energy'), edge('symptom', 'train'), edge('symptom', 'indication'), edge('energy', 'test'), edge('train', 'test'), edge('indication', 'test'), edge('test', 'evidence'), edge('evidence', 'next')] },
  },
  {
    targetId: 'visual-gap.014e.tribology-contact', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes',
    sectionId: sectionId('block.encyclopedia.service-tribology.tribologia-y-lubricantes', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Contacto, función y contaminación', result: 'implemented',
    visualDesignId: 'visual.tribology.contact-function.v1', diagramSchemaId: 'diagram.contact-lubrication-outcomes.v1',
    pedagogicalQuestion: '¿Por qué el tipo de contacto y la función deben conocerse antes de elegir un lubricante?',
    expectedObservation: 'La decisión parte del contacto documentado; exceso, defecto y contaminación son fallos distintos que no se resuelven con una cantidad universal.',
    limitations: ['No recomienda producto, cantidad ni punto de lubricación para ningún calibre. Requiere documentación moderna aplicable.'],
    data: { title: 'Del contacto a la decisión de lubricación', nodes: [node('contact', 'Tipo de contacto'), node('function', 'Función y régimen'), node('official', 'Documento aplicable', undefined, 'primary'), node('apply', 'Aplicación controlada'), node('deficit', 'Defecto'), node('excess', 'Exceso'), node('contamination', 'Contaminación', undefined, 'warning'), node('verify', 'Verificar y registrar')], edges: [edge('contact', 'function'), edge('function', 'official'), edge('official', 'apply'), edge('apply', 'deficit', 'insuficiente'), edge('apply', 'excess', 'sobrante'), edge('apply', 'contamination', 'migración/arrastre'), edge('deficit', 'verify'), edge('excess', 'verify'), edge('contamination', 'verify')] },
  },
  {
    targetId: 'visual-gap.014e.bench-contamination', priority: 'high',
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    sectionId: sectionId('block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Fuentes y transferencias de contaminación', result: 'implemented',
    visualDesignId: 'visual.bench.contamination-transfer.v1', diagramSchemaId: 'diagram.contamination-transfer-map.v1',
    pedagogicalQuestion: '¿Cómo llega un contaminante desde una fuente hasta una pieza aparentemente limpia?',
    expectedObservation: 'Manos, herramienta, superficie, recipiente y aire forman rutas de transferencia que deben interrumpirse y registrarse.',
    limitations: ['Mapa preventivo general; no prescribe sustancias ni compatibilidad química. Los procedimientos históricos peligrosos permanecen no accionables.'],
    data: { title: 'Cadena de contaminación del banco', nodes: [node('source', 'Fuente de contaminación', undefined, 'warning'), node('hands', 'Manos o guantes'), node('tool', 'Herramienta'), node('surface', 'Superficie o recipiente'), node('part', 'Pieza limpia', undefined, 'primary'), node('control', 'Separar · limpiar · cubrir'), node('check', 'Inspeccionar y registrar')], edges: [edge('source', 'hands', 'transferencia'), edge('source', 'tool', 'transferencia'), edge('source', 'surface', 'transferencia'), edge('hands', 'part', 'contacto'), edge('tool', 'part', 'contacto'), edge('surface', 'part', 'contacto'), edge('control', 'hands'), edge('control', 'tool'), edge('control', 'surface'), edge('part', 'check')] },
  },
] as const

const VISUAL_TARGET_BY_SECTION = new Map(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.map((target) => [target.sectionId, target]))

export function academyPersonalSectionVisualCuration(input: {
  lessonId: string
  section: AcademyReaderSection
  contentHash: string
  sectionHash: string
  sourceIds: string[]
}): AcademySectionVisualCuration | undefined {
  const target = VISUAL_TARGET_BY_SECTION.get(input.section.sectionId)
  if (!target || target.lessonId !== input.lessonId || target.result !== 'implemented') return undefined
  return {
    curationId: `curation.0.14e.${target.targetId}`,
    lessonId: target.lessonId,
    sectionId: target.sectionId,
    contentHash: input.contentHash,
    sectionHash: input.sectionHash,
    pedagogicalPurpose: target.title,
    pedagogicalQuestion: target.pedagogicalQuestion,
    essentialConcepts: target.data.nodes.map(({ label }) => label),
    visualDecision: 'content-specific-diagram',
    visualDesignId: target.visualDesignId,
    visualKind: 'diagram',
    diagramSchemaId: target.diagramSchemaId,
    diagramData: target.data,
    selectorIds: [], isolationIds: [], transparencyById: {}, labelDefinitions: [],
    expectedObservation: target.expectedObservation,
    readingModePolicy: 'inline-essential',
    fidelity: 'conceptual',
    limitations: target.limitations,
    sourceBasis: input.sourceIds,
    curationMethod: 'codex-assisted-personal-curation',
    ownerReviewStatus: 'owner-review-pending',
    technicalReviewStatus: 'not-required',
    technicalStatus: 'source-reviewed',
    notes: [`Gap ${target.priority} 0.14D resuelto en 0.14E con un diagrama causal original.`],
  }
}

export type AcademyVisualReviewDecision = 'keep' | 'correct' | 'replace' | 'remove' | 'source-needed' | 'photo-needed'

export interface AcademyVisualReviewRecord {
  visualDesignId: string
  decision: AcademyVisualReviewDecision
  reason: string
  mobileReady: true
  colorIndependent: true
  textualAlternative: true
  readingModeRequired: boolean
}

const CORRECTED_VISUALS = new Set([
  'visual.miyota8215.architecture-automatic.v1',
  'visual.miyota8215.disassembly-sequence.v1',
  'visual.miyota8215.disassembly-rotor.v1',
])
const SOURCE_NEEDED_VISUALS = new Set(['visual.miyota8215.disassembly-barrel-bridge.v1'])

export function academyPersonalVisualReviews(): AcademyVisualReviewRecord[] {
  return academyVisualDefinitions().map((definition) => {
    const decision: AcademyVisualReviewDecision = SOURCE_NEEDED_VISUALS.has(definition.visualDesignId)
      ? 'source-needed'
      : CORRECTED_VISUALS.has(definition.visualDesignId) ? 'correct' : 'keep'
    const reason = decision === 'source-needed'
      ? 'La relación estructural puede mostrarse, pero una secuencia de servicio necesita una fuente adicional.'
      : decision === 'correct'
        ? 'Se conserva el diseño y se estrecha su texto para no presentar inferencias del despiece como procedimiento oficial.'
        : 'Responde una pregunta concreta, usa vocabulario del texto y declara fidelidad y límites.'
    return { visualDesignId: definition.visualDesignId, decision, reason, mobileReady: true, colorIndependent: true, textualAlternative: true, readingModeRequired: true }
  })
}

export type Academy3dReviewDecision = 'keep' | 'correct' | 'source-needed'
export interface Academy3dReviewRecord { visualStateId: string; decision: Academy3dReviewDecision; reason: string }

export const ACADEMY_PERSONAL_3D_REVIEWS: readonly Academy3dReviewRecord[] = [
  { visualStateId: 'reader.3d.mechanical-train.overview', decision: 'keep', reason: 'Modelo conceptual explícito; no expresa geometría fabricable ni calibre.' },
  { visualStateId: 'reader.3d.mechanical-train.fourth-wheel', decision: 'keep', reason: 'Aísla una interfaz conceptual y conserva la limitación de geometría.' },
  { visualStateId: 'reader.3d.miyota8215.overview', decision: 'keep', reason: 'La documentación oficial respalda identidad y agrupación de piezas, no tolerancias.' },
  { visualStateId: 'reader.3d.miyota8215.train-isolated', decision: 'keep', reason: 'Localiza el tren modelado sin afirmar depthing, desgaste o servicio.' },
  { visualStateId: 'reader.3d.miyota8215.automatic-isolated', decision: 'correct', reason: 'Se elimina toda lectura de ruta cinemática completa no demostrada por el despiece.' },
  { visualStateId: 'reader.3d.miyota8215.rotor-checkpoint', decision: 'correct', reason: 'Se presenta como dependencia entre fijación y pieza, no como primer paso ni dirección de retirada.' },
  { visualStateId: 'reader.3d.miyota8215.barrel-bridge-checkpoint', decision: 'source-needed', reason: 'La agrupación es visible; el orden de desmontaje sigue bloqueado sin manual de servicio.' },
  { visualStateId: 'reader.3d.miyota8215.inspection-train', decision: 'keep', reason: 'La vista localiza un sistema y declara que no demuestra desgaste ni tolerancia.' },
  { visualStateId: 'reader.3d.miyota8215.inspection-support', decision: 'keep', reason: 'La interfaz espacial se muestra sin criterio dimensional de aceptación.' },
] as const

export interface AcademyPersonalClaimReview {
  claimId: string
  lessonId: string
  sectionId: string
  claimType: 'principle' | 'identity' | 'calculation' | 'procedure' | 'diagnosis' | 'compatibility' | 'safety'
  generalOrCalibreSpecific: 'general' | 'calibre-specific'
  primarySourceId: string
  supportingSourceIds: string[]
  page: string | null
  figure: string | null
  table: string | null
  officialDocument: boolean
  verificationStatus: 'verified-primary' | 'verified-secondary' | 'visually-verified' | 'ocr-unverified' | 'inferred' | 'unknown' | 'requires-modern-corroboration'
  scope: string
  limitations: string[]
  decision: 'keep' | 'clarify' | 'narrow' | 'correct' | 'remove' | 'source-needed'
}

const claimReview = (
  claimId: string,
  lessonId: string,
  section: string,
  claimType: AcademyPersonalClaimReview['claimType'],
  generalOrCalibreSpecific: AcademyPersonalClaimReview['generalOrCalibreSpecific'],
  primarySourceId: string,
  decision: AcademyPersonalClaimReview['decision'],
  verificationStatus: AcademyPersonalClaimReview['verificationStatus'],
  scope: string,
  limitations: string[],
  supportingSourceIds: string[] = [],
  officialDocument = false,
): AcademyPersonalClaimReview => ({
  claimId, lessonId, sectionId: section, claimType, generalOrCalibreSpecific, primarySourceId,
  supportingSourceIds, page: null, figure: null, table: null, officialDocument,
  verificationStatus, scope, limitations, decision,
})

export const ACADEMY_PERSONAL_CLAIM_REVIEWS: readonly AcademyPersonalClaimReview[] = [
  claimReview('claim.horology.watch-functional-system', 'lesson.horology.system', sectionId('block.horology.system', 'explicacion-principal'), 'principle', 'general', 'source.horology.original-functional-map', 'keep', 'inferred', 'Mapa funcional educativo de un reloj completo.', ['No es una taxonomía de fabricante ni una geometría universal.']),
  claimReview('claim.miyota.8215.documented-parts', 'lesson.horology.mechanical-chain', sectionId('block.horology.mechanical-chain', 'explicacion-principal'), 'identity', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'narrow', 'verified-primary', 'Identidad y agrupación de componentes visibles en el despiece 8215.', ['El despiece no demuestra la cadena cinemática completa ni orden de servicio.'], ['source.horology.private-book.functional-systems'], true),
  claimReview('claim.horology.functional-equivalence-limited', 'lesson.horology.functional-equivalence', sectionId('block.horology.functional-equivalence', 'explicacion-principal'), 'principle', 'general', 'source.horology.original-functional-map', 'keep', 'inferred', 'Comparación de funciones entre cuarzo y mecánico.', ['Una función análoga no implica identidad física ni compatibilidad.']),
  claimReview('claim.horology.symbolic-interruption', 'lesson.horology.failure-prediction', sectionId('block.horology.failure-prediction', 'explicacion-principal'), 'diagnosis', 'general', 'source.horology.original-functional-map', 'clarify', 'inferred', 'Razonamiento causal dentro de una simulación.', ['La interrupción simbólica no diagnostica una unidad física.']),
  claimReview('claim.mechanical.theory.energy', 'lesson.mechanical.energy', sectionId('block.mechanical.theory.energy', 'teoria-almacenar-entregar-y-dosificar'), 'principle', 'general', 'source.horology.private-book.mainsprings', 'clarify', 'unknown', 'Energía, par y entrega en una arquitectura mecánica general.', ['Falta localizador de página para elevar detalles cuantitativos; el modelo permanece cualitativo.'], ['source.horology.original-mechanical-foundations']),
  claimReview('claim.mechanical.barrel', 'lesson.mechanical.barrel', sectionId('block.mechanical.barrel', 'modelo-causal-ampliado'), 'principle', 'general', 'source.horology.private-book.mainsprings', 'clarify', 'unknown', 'Funciones generales de árbol, muelle y tambor.', ['No prescribe apertura, lubricación, ganchos ni brida de un calibre concreto.']),
  claimReview('claim.mechanical.gear-pair', 'lesson.mechanical.gear-pair', sectionId('block.mechanical.gear-pair', 'explicacion'), 'calculation', 'general', 'source.horology.private-book.wheels-pinions', 'clarify', 'unknown', 'Relación ideal y sentido de un engrane externo declarado.', ['No valida módulo, perfil, depthing, eficiencia ni geometría fabricable.']),
  claimReview('claim.mechanical.theory.train', 'lesson.mechanical.train', sectionId('block.mechanical.theory.train', 'relacion-de-una-etapa'), 'calculation', 'general', 'source.horology.private-book.wheels-pinions', 'clarify', 'unknown', 'Producto de relaciones ideales en un tren declarado.', ['No atribuye conteos ni dimensiones al 8215.'], ['source.horology.private-book.movement-design']),
  claimReview('claim.mechanical.theory.escapement', 'lesson.mechanical.escapement', sectionId('block.mechanical.theory.escapement', 'secuencia-causal-completa'), 'principle', 'general', 'source.horology.private-book.escapements', 'clarify', 'unknown', 'Fases funcionales del escape de áncora suizo.', ['No valida ángulos, draw, penetración, lubricación o ajuste de calibre.']),
  claimReview('claim.mechanical.theory.oscillator', 'lesson.mechanical.oscillator', sectionId('block.mechanical.theory.oscillator', 'frecuencia-alternancias-y-periodo'), 'calculation', 'general', 'source.horology.private-book.balance-spring', 'clarify', 'unknown', 'Definiciones de periodo, frecuencia, alternancia y amplitud.', ['El modelo no calcula marcha real ni regula una espiral física.']),
  claimReview('claim.metrology.observe-before-measuring.014e', 'lesson.metrology.observe-before-measuring', sectionId('block.metrology.observe-before-measuring', 'explicacion-paso-a-paso'), 'diagnosis', 'general', 'source.metrology.bipm.vim', 'keep', 'verified-primary', 'Separación entre observación, pregunta, magnitud, medida e incertidumbre.', ['La elección del instrumento sigue dependiendo de la característica y la decisión.'], ['source.metrology.bipm.gum'], true),
  claimReview('claim.miyota8215.architecture', 'lesson.miyota8215.architecture', sectionId('block.miyota8215.architecture', 'explicacion'), 'identity', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'narrow', 'verified-primary', 'Nombres, presencia, agrupación y posición relativa aproximada de piezas 8215.', ['El fixture no expresa dimensiones, holguras, desgaste, lubricación ni servicio.'], ['source.miyota.8215.product-page'], true),
  claimReview('claim.miyota8215.guided-disassembly', 'lesson.miyota8215.guided-disassembly', sectionId('block.miyota8215.guided-disassembly', 'explicacion'), 'procedure', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'correct', 'verified-primary', 'Dependencias estructurales visibles entre fijaciones y subconjuntos.', ['No existe fuente suficiente para presentar una secuencia completa de desmontaje.'], ['source.miyota.8215.instruction-manual'], true),
  claimReview('claim.miyota8215.inspection', 'lesson.miyota8215.inspection', sectionId('block.miyota8215.inspection', 'explicacion'), 'diagnosis', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'narrow', 'verified-primary', 'Identidad y localización de piezas que pueden convertirse en objeto de inspección.', ['La documentación y el modelo no demuestran desgaste, suciedad real ni tolerancia.'], [], true),
  claimReview('claim.encyclopedia.cases-water.arquitectura-de-caja', 'lesson.encyclopedia.cases-water.arquitectura-de-caja', sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', 'resultado-buscado-y-condicion-segura'), 'compatibility', 'general', 'source.private.daniels.casemaking', 'clarify', 'unknown', 'Interfaces generales de caja y encaje; aplicación concreta mediante documentación de movimiento y medidas propias.', ['El capítulo no es documentación de un calibre; las especificaciones MIYOTA solo se aplican a su variante.'], ['source.official.miyota.2035', 'source.official.miyota.8215']),
  claimReview('claim.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', sectionId('block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'caracteristica-que-se-quiere-fabricar'), 'compatibility', 'general', 'source.private.daniels.small-components', 'source-needed', 'unknown', 'Relaciones geométricas generales de tubos, agujas y cadena axial.', ['Diámetros, alturas, interferencias y método de ajuste requieren documento de variante o medición verificada.'], ['source.official.miyota.2035', 'source.official.miyota.8215']),
  claimReview('claim.encyclopedia.service-tribology.limpieza-e-inspeccion', 'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion', sectionId('block.encyclopedia.service-tribology.limpieza-e-inspeccion', 'de-la-observacion-a-la-prueba-discriminante'), 'diagnosis', 'general', 'source.institutional.awci.standards', 'clarify', 'verified-secondary', 'Separar observación, hipótesis y prueba reversible.', ['El visual no prescribe sustancias ni convierte una huella en diagnóstico.']),
  claimReview('claim.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control', sectionId('block.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'secuencia-controles-y-puntos-de-parada'), 'procedure', 'general', 'source.institutional.awci.standards', 'narrow', 'verified-secondary', 'Patrón funcional de montaje con control y parada.', ['No es una secuencia de montaje del 8215 ni define tolerancias.'], ['source.official.miyota.8215']),
  claimReview('claim.encyclopedia.history-language.leer-documentacion', 'lesson.encyclopedia.history-language.leer-documentacion', sectionId('block.encyclopedia.history-language.leer-documentacion', 'cambio-continuidad-y-consecuencia'), 'identity', 'general', 'source.official.miyota.8215', 'keep', 'verified-primary', 'Método para distinguir documento, revisión, variante y alcance.', ['No presupone equivalencia entre revisiones ni familias.'], ['source.official.miyota.2035'], true),
  claimReview('claim.encyclopedia.service-tribology.diagnostico-y-control-final', 'lesson.encyclopedia.service-tribology.diagnostico-y-control-final', sectionId('block.encyclopedia.service-tribology.diagnostico-y-control-final', 'de-la-observacion-a-la-prueba-discriminante'), 'diagnosis', 'general', 'source.institutional.awci.standards', 'clarify', 'verified-secondary', 'Control final derivado de la hipótesis y del resultado esperado.', ['Los criterios numéricos siguen ligados al calibre y a la fuente aplicable.']),
  claimReview('claim.encyclopedia.service-tribology.recepcion-y-linea-base', 'lesson.encyclopedia.service-tribology.recepcion-y-linea-base', sectionId('block.encyclopedia.service-tribology.recepcion-y-linea-base', 'secuencia-controles-y-puntos-de-parada'), 'procedure', 'general', 'source.institutional.awci.standards', 'keep', 'verified-secondary', 'Registro del estado inicial antes de pruebas que puedan alterarlo.', ['No prescribe un protocolo comercial ni una prueba universal.']),
  claimReview('claim.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas', sectionId('block.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'de-la-observacion-a-la-prueba-discriminante'), 'diagnosis', 'general', 'source.official.tm9-1575.diagnosis', 'narrow', 'requires-modern-corroboration', 'Patrón histórico de síntoma, hipótesis y comprobación.', ['Sustancias, intervalos, tolerancias y procedimientos históricos no se trasladan.'], ['source.private.chicago.35']),
  claimReview('claim.encyclopedia.service-tribology.tribologia-y-lubricantes', 'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes', sectionId('block.encyclopedia.service-tribology.tribologia-y-lubricantes', 'secuencia-controles-y-puntos-de-parada'), 'procedure', 'calibre-specific', 'source.institutional.awci.standards', 'source-needed', 'requires-modern-corroboration', 'Relación general entre contacto, función y decisión de lubricación.', ['Producto, punto y cantidad necesitan documentación moderna del calibre; el 8215 público no los aporta.'], ['source.official.miyota.8215']),
  claimReview('claim.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', sectionId('block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'secuencia-controles-y-puntos-de-parada'), 'safety', 'general', 'source.institutional.awci.standards', 'clarify', 'requires-modern-corroboration', 'Fuentes y rutas de transferencia de contaminación en el banco.', ['No prescribe química; cualquier procedimiento histórico requiere seguridad moderna.'], ['source.private.daniels.workshop-equipment']),
] as const

export interface AcademyPilotFormulaReview {
  formulaId: string
  lessonId: string
  expression: string
  ocrDerived: false
  sourceId: string
  status: 'verified-with-secondary-source'
  limitations: string[]
}

export const ACADEMY_PILOT_FORMULA_REVIEWS: readonly AcademyPilotFormulaReview[] = [
  { formulaId: 'formula.014e.gear-pair-ratio', lessonId: 'lesson.mechanical.gear-pair', expression: 'n₂/n₁ = Z₁/Z₂ para el par ideal declarado', ocrDerived: false, sourceId: 'source.horology.private-book.wheels-pinions', status: 'verified-with-secondary-source', limitations: ['No expresa pérdidas, perfil, depthing ni resistencia.'] },
  { formulaId: 'formula.014e.train-product', lessonId: 'lesson.mechanical.train', expression: 'i_total = producto de las relaciones de etapa declaradas', ocrDerived: false, sourceId: 'source.horology.private-book.wheels-pinions', status: 'verified-with-secondary-source', limitations: ['Solo se aplica a las etapas y signos definidos en el ejercicio.'] },
  { formulaId: 'formula.014e.oscillator-period', lessonId: 'lesson.mechanical.oscillator', expression: 'T = 1/f', ocrDerived: false, sourceId: 'source.horology.private-book.balance-spring', status: 'verified-with-secondary-source', limitations: ['Relación definitoria; no calcula marcha real.'] },
  { formulaId: 'formula.014e.oscillator-alternations', lessonId: 'lesson.mechanical.oscillator', expression: 'alternancias por hora = 2 · f · 3600', ocrDerived: false, sourceId: 'source.horology.private-book.balance-spring', status: 'verified-with-secondary-source', limitations: ['f se expresa en ciclos por segundo; no sustituye la especificación del calibre.'] },
] as const

export const ACADEMY_MIYOTA_REFERENCE_ROLES = [
  'reference-caliber',
  'worked-example',
  'practical-laboratory',
  'transfer-case',
  'official-documentation-example',
] as const

export const ACADEMY_MIYOTA_FORBIDDEN_ROLES = [
  'curriculum-center',
  'exclusive-brand',
  'mandatory-specialization',
  'universal-watch-architecture',
] as const
