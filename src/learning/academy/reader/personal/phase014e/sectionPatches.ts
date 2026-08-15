import type { AcademyReaderSection } from '../../academyReaderModel'
import { ACADEMY_PERSONAL_PILOT_REVIEWS } from './pilotReviews'
import type { AcademyPersonalPilotReview } from './pilotReviews'
import { academyPersonalSectionId as sectionId } from '../helpers'
import type { AcademyPersonalSectionPatch as SectionPatch } from '../helpers'

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


