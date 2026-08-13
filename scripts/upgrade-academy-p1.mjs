import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const CONTENT_ROOT = join(process.cwd(), 'learning-content')
const PACKAGE_NAMES = [
  'horology-foundations',
  'quartz-miyota2035',
  'mechanical-foundations',
  'miyota8215',
  'inspection-metrology',
  'advanced-watchmaking',
  'watchmaking-capstone',
]
const PACKAGE_RELEASES = {
  'horology-foundations': '0.5.0',
  'quartz-miyota2035': '0.5.0',
  'mechanical-foundations': '0.5.0',
  miyota8215: '0.5.0',
  'inspection-metrology': '0.2.0',
  'advanced-watchmaking': '1.1.0',
  'watchmaking-capstone': '1.1.0',
}

const PACKAGE_RANGES = {
  'wplab.horology.functional-map': '^0.5.0',
  'wplab.horology.quartz-miyota2035': '^0.5.0',
  'wplab.horology.mechanical-foundations': '^0.5.0',
  'wplab.horology.miyota8215': '^0.5.0',
  'wplab.horology.inspection-metrology': '^0.2.0',
  'wplab.horology.advanced-architecture-service': '^1.1.0',
  'wplab.horology.manufacturing-design-validation': '^1.1.0',
}
const P1_MARKER = '## Estudio en profundidad'
const LEGACY_P1_MARKER = '<!-- academy-p1-depth -->'
const GENERIC_COMPLETENESS_MARKER = '## Modelo mental paso a paso'

function polishStudentCopy(value) {
  return value
    .replace(/dominio retenido/giu, 'consolidación del aprendizaje')
    .replace(/R2\s*\/\s*G2\s*\/\s*K2\s*\/\s*P0/giu, 'ensamblaje estructural con geometría reconstruida y secuencia educativa, sin simulación física')
    .replace(/G1\s*\/\s*K2\s*\/\s*P0/giu, 'geometría conceptual y secuencia educativa, sin simulación física')
    .replace(/G2\s*\/\s*K2\s*\/\s*P0/giu, 'geometría estructural reconstruida y secuencia educativa, sin simulación física')
    .replace(/R2\s*\/\s*K2/giu, 'ensamblaje estructural con secuencia educativa')
    .replace(/G\s*\/\s*K\s*\/\s*P/giu, 'ficha técnica de fidelidad')
    .replace(/\bR0\b/gu, 'nivel de referencia documental')
    .replace(/\bR1\b/gu, 'nivel de envolvente oficial')
    .replace(/\bR2\b/gu, 'nivel de ensamblaje estructural')
    .replace(/\bR3\b/gu, 'nivel de reconstrucción visual')
    .replace(/\bR4\b/gu, 'nivel basado en una unidad física medida')
    .replace(/\bG0\b/gu, 'sin geometría representada')
    .replace(/\bG1\b/gu, 'geometría conceptual')
    .replace(/\bG2\b/gu, 'geometría estructural reconstruida')
    .replace(/\bG3\b/gu, 'geometría contrastada con mediciones')
    .replace(/\bK0\b/gu, 'sin cinemática representada')
    .replace(/\bK1\b/gu, 'direcciones de movimiento educativas')
    .replace(/\bK2\b/gu, 'secuencia cinemática educativa')
    .replace(/\bK3\b/gu, 'cinemática contrastada con mediciones')
    .replace(/\bP0\b/gu, 'sin simulación física')
    .replace(/\bP1\b/gu, 'comportamiento físico cualitativo')
    .replace(/\bP2\b/gu, 'comportamiento físico calibrado')
    .replace(/\bP3\b/gu, 'comportamiento físico contrastado con mediciones')
    .replace(/\b[RGKP]\d\b/gu, 'nivel de fidelidad indicado en la ficha técnica')
    .replace(/\bG,\s*K\s*o\s*P\b/gu, 'cada dimensión de fidelidad')
    .replace(/\bfixtures\b/giu, 'modelos didácticos')
    .replace(/\bfixture\b/giu, 'modelo didáctico')
    .replace(/\bruntime\b/giu, 'entorno de práctica')
    .replace(/\bWatchProject\b/gu, 'proyecto técnico')
    .replace(/\bsnapshots\b/giu, 'estados iniciales guardados')
    .replace(/\bsnapshot\b/giu, 'estado inicial guardado')
    .replace(/\bclaims?\b/giu, 'afirmaciones')
    .replace(/\bretained\b/giu, 'consolidado')
    .replace(/\bledger\b/giu, 'registro técnico')
    .replace(/\bremove-before\b/giu, 'retirar antes de')
    .replace(/\bIDs\b/gu, 'identidades de pieza')
    .replace(/\bID\b/gu, 'identidad de pieza')
    .replace(/\bcheckpoints\b/giu, 'puntos de control')
    .replace(/\bcheckpoint\b/giu, 'punto de control')
    .replace(/\bviewport\b/giu, 'vista del modelo')
    .replace(/\boverlays\b/giu, 'capas informativas')
    .replace(/\boverlay\b/giu, 'capa informativa')
    .replace(/\bconceptual[- ]causal\b/giu, 'relaciones de causa y efecto')
    .replace(/\bhorology[- ]foundations\b/giu, 'fundamentos de relojería')
    .replace(/\bmotion[- ]works\b/giu, 'minutería')
    .replace(/\bpower[- ]source\b/giu, 'fuente de energía')
    .replace(/\belectronic[- ]control\b/giu, 'control electrónico')
    .replace(/\bquartz[- ]resonator\b/giu, 'resonador de cuarzo')
    .replace(/\bstepper[- ]rotor\b/giu, 'rotor paso a paso')
    .replace(/\bautomatic[- ]winding\b/giu, 'carga automática')
    .replace(/\bsystem[- ]overview\b/giu, 'visión del sistema completo')
    .replace(/\bfinal[- ]project\b/giu, 'proyecto final')
    .replace(/\bkeyless\b/giu, 'cuerda y puesta en hora')
}

const LEARNER_FACING_KEYS = new Set([
  'accessibleLabel', 'bodyMarkdown', 'causalQuestion', 'colorIndependentCues', 'content', 'correctExplanation',
  'correction', 'definitionMarkdown', 'description', 'diagnosis', 'errorSignals', 'evidence', 'feedback', 'forbiddenClaims', 'incorrectDiagnosis',
  'instruction', 'instructionMarkdown', 'keyboardActions', 'label', 'labels', 'markdown', 'narrative',
  'learnerExpression', 'nextObservation', 'notePrompt', 'observableActions', 'observableResult', 'observableSignals', 'outcome',
  'physicalBoundary', 'plainLanguage', 'prompt', 'promptMarkdown', 'promptStarters', 'purpose', 'readinessCriteria', 'reason', 'restoration',
  'simpleDefinition', 'successCriteria', 'successCriterion', 'summary', 'technicalDefinition', 'technicalLanguage', 'term', 'textualAlternative',
  'title', 'transferPrompt', 'userInteraction', 'reducedMotionAlternative', 'whyItMatters', 'context',
])

function polishLearnerFacing(value, learnerFacing = false) {
  if (typeof value === 'string') return learnerFacing ? polishStudentCopy(value) : value
  if (Array.isArray(value)) return value.map((item) => polishLearnerFacing(item, learnerFacing))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    polishLearnerFacing(item, learnerFacing || LEARNER_FACING_KEYS.has(key)),
  ]))
}

const text = (es) => ({ es })
const words = (value) => value.replace(/\{\{[^}]+\}\}/g, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0
const normalizeParagraph = (value) => value.replace(/\s+/gu, ' ').trim()

function baseBeforeEditorialDepth(value) {
  return value
    .split(LEGACY_P1_MARKER)[0]
    .split(P1_MARKER)[0]
    .split(GENERIC_COMPLETENESS_MARKER)[0]
    .trim()
}

function repeatedBaseParagraphs(blocks) {
  const owners = new Map()
  for (const { value } of blocks.values()) {
    for (const paragraph of baseBeforeEditorialDepth(value.bodyMarkdown ?? '').split(/\n\s*\n/gu)) {
      const normalized = normalizeParagraph(paragraph)
      if (words(normalized) < 12 || /^#{1,6}\s/u.test(normalized)) continue
      owners.set(normalized, (owners.get(normalized) ?? 0) + 1)
    }
  }
  return new Set([...owners.entries()].filter(([, count]) => count >= 3).map(([paragraph]) => paragraph))
}

function stripRepeatedBoilerplate(markdown, repeatedParagraphs) {
  const protectedHeading = /^##\s+(?:Fuentes?|Fiabilidad|Procedencia|Seguridad|L[ií]mite|Alcance)/iu
  return markdown.split(/(?=^##\s+)/gmu).map((section) => {
    const paragraphs = section.split(/\n\s*\n/gu)
    const heading = paragraphs[0]?.trim() ?? ''
    if (protectedHeading.test(heading)) return section.trim()
    const kept = paragraphs.filter((paragraph, index) => {
      if (index === 0 && /^##\s+/u.test(heading)) return true
      return !repeatedParagraphs.has(normalizeParagraph(paragraph))
    })
    if (/^##\s+/u.test(heading) && kept.length === 1) return ''
    return kept.join('\n\n').trim()
  }).filter(Boolean).join('\n\n').trim()
}

function localizedSpanish(value, fallback = '') {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.es ?? value.en ?? fallback
  return fallback
}

function hasSubstantivePretraining(markdowns) {
  return markdowns.some((markdown) => markdown
    .split(/(?=^##\s+)/gmu)
    .some((section) => {
      const heading = section.match(/^##\s+(.+)$/mu)?.[1] ?? ''
      const body = section.replace(/^##\s+.+$/mu, '').trim()
      return segmentRole(heading) === 'pretrain' && words(body) >= 8
    }))
}

function contextualPretrainingSection(lesson, concepts) {
  const conceptIds = [...new Set([
    ...(lesson.authoring?.prerequisiteConceptIds ?? []),
    ...(lesson.authoring?.recommendedPrerequisiteConceptIds ?? []),
    ...(lesson.authoring?.conceptIds ?? []),
  ])]
  const entries = conceptIds.flatMap((conceptId) => {
    const concept = concepts.get(conceptId)?.value
    if (!concept) return []
    const title = localizedSpanish(concept.title, conceptId)
    const explanation = localizedSpanish(concept.plainLanguage, localizedSpanish(concept.summary))
    return explanation ? [`- **${title}.** ${explanation}`] : []
  }).slice(0, 8)
  const objectiveFallback = (lesson.authoring?.objectives ?? [])
    .map((objective) => localizedSpanish(objective))
    .filter(Boolean)
    .slice(0, 3)
    .map((objective) => `- **Idea que debes reconocer.** ${objective}`)
  const lines = entries.length ? entries : objectiveFallback
  if (!lines.length) throw new Error(`${lesson.id} no ofrece conceptos ni objetivos para construir preentrenamiento contextual.`)
  const lessonTitle = localizedSpanish(lesson.authoring?.title, lesson.title ?? lesson.id)
  return `## Palabras y piezas clave\n\n${lines.join('\n')}\n\nAntes de continuar con **${lessonTitle}**, explica con tus propias palabras cómo se relacionan al menos dos de estas ideas. No necesitas memorizar la lista: vuelve a ella cuando un término aparezca en el ejemplo o en la práctica.`
}

function insertBeforeDepth(markdown, section) {
  const depthIndex = markdown.indexOf(P1_MARKER)
  if (depthIndex < 0) return `${markdown.trim()}\n\n${section}`
  return `${markdown.slice(0, depthIndex).trim()}\n\n${section}\n\n${markdown.slice(depthIndex).trim()}`
}

function personalizePretrainingClose(markdown, lesson) {
  const generic = 'Antes de continuar, explica con tus propias palabras cómo se relacionan al menos dos de estas ideas.'
  if (!markdown.includes(generic)) return markdown
  const lessonTitle = localizedSpanish(lesson.authoring?.title, lesson.title ?? lesson.id)
  return markdown.replace(generic, `Antes de continuar con **${lessonTitle}**, explica con tus propias palabras cómo se relacionan al menos dos de estas ideas.`)
}

function expansion(question, causal, example, practice, check, transfer) {
  return [
    P1_MARKER,
    '',
    `## Pregunta de estudio`,
    '',
    question,
    '',
    '## Modelo causal ampliado',
    '',
    causal,
    '',
    '## Ejemplo resuelto',
    '',
    example,
    '',
    '## Práctica deliberada',
    '',
    practice,
    '',
    '## Comprobación antes del laboratorio',
    '',
    check,
    '',
    '## Transferencia',
    '',
    transfer,
    '',
    '## Contraste y autoexplicación',
    '',
    `Vuelve a la pregunta «${question}» y construye dos casos: uno que satisfaga la relación estudiada y otro que se parezca visualmente pero falle en una interfaz, una dependencia o una fuente. Explica qué observación decide entre ambos antes de mirar el modelo. Después indica qué dato te haría cambiar de conclusión y qué parte seguiría siendo desconocida. Cierra enlazando el razonamiento con esta transferencia: ${transfer}`,
  ].join('\n')
}

const THEORY_EXPANSIONS = {
  'block.mechanical.barrel': expansion(
    '¿Cómo puede el barrilete almacenar energía durante la cuerda y entregarla después sin confundir el recipiente, el muelle y el órgano que recibe el movimiento?',
    'El barrilete se estudia como un conjunto de relaciones. El muelle real almacena energía elástica; el árbol ofrece una interfaz para cargarlo; el tambor y su dentado entregan movimiento al tren. Durante la cuerda cambia el estado relativo entre árbol, muelle y tambor. Durante la marcha, la tendencia del muelle a recuperar una forma menos cargada produce un par sobre la salida. El modelo conceptual muestra esta dirección funcional, no fuerzas ni curvas reales.\n\nConviene separar tres preguntas: dónde está la energía, qué pieza cambia de estado al dar cuerda y por qué interfaz sale el movimiento. Llamar “fuente” al barrilete completo es útil en un mapa funcional, pero una explicación técnica debe decir que la energía está almacenada en el muelle y que el conjunto la contiene y la transmite. El gancho interior, el exterior y las condiciones de deslizamiento dependen de la arquitectura; no deben darse por idénticos en todos los calibres.',
    'Estado inicial: muelle descargado en un barrilete conceptual. Primero se inmoviliza la salida y se gira el árbol en el sentido de carga declarado; aumenta el estado de carga, pero el tren no recibe todavía una rotación sostenida. Después se libera la salida: el tambor impulsa la primera rueda y la carga disminuye. Si se desacopla el engrane de salida, el muelle puede conservar carga mientras la indicación permanece detenida. La conclusión correcta distingue almacenamiento, mando de carga y salida.',
    'Haz tres recorridos. En el primero sigue las etiquetas. En el segundo oculta los nombres y reconstruye entrada, almacenamiento y salida. En el tercero restaura la escena, cambia el punto de interrupción y predice qué estado conservará cada pieza. No cuentes el primer recorrido como dominio: la evidencia independiente es la explicación del tercero sin pista.',
    '- Puedes señalar árbol, muelle, tambor y dentado sin intercambiar sus funciones.\n- Puedes explicar qué cambia al cargar y qué cambia al descargar.\n- Puedes predecir la diferencia entre fuente descargada y transmisión desacoplada.\n- Delimitas que el modelo explica una geometría conceptual y una secuencia educativa, pero no valida par, reserva de marcha ni fricción.',
    'Aplica el mismo mapa a un barrilete real documentado: identifica qué relaciones confirma la documentación y deja como desconocidos el perfil de fuerza, la lubricación, las holguras y el estado de una unidad física.'
  ),
  'block.mechanical.gear-pair': expansion(
    '¿Qué información mínima permite predecir sentido y relación de velocidad de un par de engranes sin confundir tamaño aparente con número de dientes?',
    'En dos engranes exteriores, el contacto de los dientes obliga a que sus periferias recorran desplazamientos compatibles y los sentidos de giro sean opuestos. En un modelo ideal, la velocidad angular de la rueda conducida respecto de la conductora es proporcional a Z conductora dividido entre Z conducida. El cociente utiliza dientes, no diámetros dibujados ni colores. Una rueda intermedia puede invertir otra vez el sentido, pero no cambia por sí sola el módulo de la relación total entre primera y última si solo actúa como intermediaria.\n\nUn engrane exige compatibilidad geométrica: ejes, distancia entre centros, paso y perfil deben permitir contacto. La animación declara una relación cinemática ideal y puede detectar una separación imposible, pero no valida perfil de diente, juego, eficiencia, ruido o resistencia. Por eso el cálculo y la aceptación geométrica se mantienen como conclusiones distintas.',
    'Una conductora de 12 dientes engrana con una conducida de 36. Por cada vuelta de la conductora, la conducida completa 12/36, es decir, un tercio de vuelta, en sentido contrario. Si se intercambian entrada y salida, la relación pasa a tres vueltas de la rueda pequeña por una de la grande. Añadir una intermedia conserva el cociente 12/36 entre extremos, aunque cambia el sentido final por el nuevo número de contactos exteriores.',
    'Primero resuelve el par con los dientes visibles. Después repite con uno de los conteos oculto y dedúcelo a partir de una relación dada. Por último recibe una configuración con distancia incompatible: debes rechazarla antes de calcular. Escribe siempre conductora, conducida, dientes, cociente y sentido; una cifra sin unidades lógicas no basta.',
    '- Identificas entrada y salida antes de usar la fórmula.\n- El cociente queda orientado y no aparece como un número ambiguo.\n- Cada engrane exterior invierte el sentido.\n- Separas cinemática ideal de geometría y física reales.',
    'Transfiere el método a un tren compuesto: marca cada par activo y evita contar dos veces una rueda y un piñón solidarios sobre el mismo árbol.'
  ),
  'block.mechanical.supports': expansion(
    '¿Por qué una rueda correctamente dentada puede no girar si sus pivotes, rubíes y puentes no definen un eje libre y estable?',
    'Una rueda no funciona solo por sus dientes. El árbol termina en pivotes que deben quedar apoyados y alineados entre la platina y el puente o cock correspondiente. Los rubíes ofrecen superficies de apoyo; su presencia no prueba por sí sola que la rueda esté bien asentada. Para girar, el conjunto necesita libertad axial y radial compatible con su función, contactos correctos y ausencia de interferencias.\n\nEn una vista explosionada los apoyos aparecen separados para ser legibles. Esa separación no representa la posición de marcha. Al montar, un pivote puede parecer cercano al orificio y seguir fuera de asiento. Apretar un puente sobre una rueda mal asentada no corrige la relación: puede inmovilizarla o dañar una pieza real. El simulador solo representa estados seguros y simbólicos; no enseña a aplicar presión física.',
    'Se coloca una rueda con el pivote inferior en su apoyo y el superior fuera del rubí del puente. La rueda queda inclinada. El engrane visual puede parecer próximo, pero al cerrar el puente el eje no queda definido. La comprobación correcta no es “el tornillo entra”, sino verificar ambos pivotes, apoyar el puente sin forzar y comprobar libertad en el estado educativo. Restaurar y asentar los dos pivotes elimina el bloqueo simbólico.',
    'Realiza una comparación A/B. En A, ambos pivotes están asentados; en B, uno queda desplazado. Predice antes de activar la comprobación. Luego oculta la vista 3D y repite desde la lista accesible de dependencias. Termina explicando qué observación física adicional necesitarías en un movimiento real.',
    '- Nombras los dos apoyos que definen el eje.\n- No usas la proximidad visual como prueba de asiento.\n- Compruebas libertad antes de aceptar el cierre.\n- No conviertes el estado simbólico en diagnóstico de daño real.',
    'Busca la misma lógica en una rueda apoyada por un puente compartido: explica cómo un único puente puede condicionar varias ruedas y por qué el orden de verificación importa.'
  ),
  'block.mechanical.escape-oscillator': expansion(
    '¿Cómo forman escape y oscilador un bucle de realimentación en el que ninguno cumple por sí solo las funciones de regular, contar y sostener la oscilación?',
    'El tren entrega energía a la rueda de escape. El áncora alterna bloqueo y liberación, y transmite impulsos al volante. El volante y la espiral devuelven una oscilación que gobierna cuándo el áncora puede liberar el siguiente diente. La secuencia une dos direcciones causales: energía desde el tren hacia el oscilador e información temporal desde el oscilador hacia la liberación del tren.\n\nPor eso el escape no crea energía y el volante aislado no puede mantener indefinidamente su amplitud. Frecuencia y amplitud describen aspectos distintos: la primera cuenta ciclos por tiempo; la segunda expresa el arco de oscilación. El modelo ordena fases y direcciones con intención educativa, pero no calcula pérdidas, impulso, fricción ni marcha.',
    'Con el tren cargado se bloquea el áncora: la rueda de escape no avanza aunque exista energía aguas arriba. Al liberar una fase, llega un impulso al volante; su retorno permite la siguiente liberación. Si se interrumpe el impulso pero se conserva una oscilación inicial, una representación física esperaría decaimiento, pero esta simulación educativa solo puede declarar que la cadena de sostenimiento se ha roto.',
    'Sigue un ciclo completo con etiquetas. Repite ordenando tarjetas de bloqueo, desbloqueo, impulso y caída. En el intento independiente, comienza desde una fase elegida al azar y predice las dos siguientes, señalando entrada de energía y condición temporal en cada transición.',
    '- Distingues el flujo de energía de la regulación temporal.\n- Ordenas las fases sin saltar del bloqueo al siguiente bloqueo.\n- No atribuyes energía al áncora ni al volante.\n- Expresas qué secuencia explica el modelo y qué comportamiento físico queda fuera.',
    'Compara este bucle con el control de un cuarzo: encuentra la equivalencia funcional de referencia temporal y explica por qué las piezas y la física no son equivalentes.'
  ),
  'block.mechanical.motion-works': expansion(
    '¿Cómo transforma la minutería una rotación disponible en indicaciones de minutos y horas y, al mismo tiempo, permite poner las agujas en hora?',
    'La minutería toma movimiento de una etapa de salida y establece relaciones para las agujas. La rueda o cañón que porta el minutero, la rueda de minutería y la rueda de horas forman una cadena en la que el horario debe avanzar una vuelta mientras el minutero completa doce. La relación funcional importa más que el nombre aislado de cada pieza.\n\nLa puesta en hora exige una interfaz que pueda mover la indicación sin destruir la cadena de marcha. En muchas arquitecturas se utiliza una unión de fricción en torno al cañón de minutos; la realización exacta debe confirmarse para cada calibre. La fricción suficiente transmite durante la marcha y permite el ajuste cuando actúa el sistema de puesta. El modelo educativo representa estados y relaciones, no el par de fricción ni el ajuste de agujas.',
    'Parte de las 3:00. Si el minutero recorre una vuelta completa, el horario debe pasar a las 4:00. Una configuración que deja ambos ejes a la misma velocidad es incompatible con la indicación de doce horas. Después se activa el estado de puesta: la entrada procede de la corona y la tija, no del barrilete, aunque el resultado visible siga siendo el movimiento de las agujas.',
    'Construye primero la cadena con relaciones ya etiquetadas. En el segundo intento solo se ofrece el objetivo 12:1. En el tercero debes detectar una rueda invertida o una relación incorrecta observando el desacuerdo entre minutos y horas. Finaliza restaurando las agujas y describiendo la ruta activa.',
    '- Relacionas una vuelta del minutero con un doceavo de vuelta del horario.\n- Diferencias la entrada de marcha de la entrada de puesta.\n- Reconoces el papel de una unión de fricción sin asignarle un valor inventado.\n- Compruebas coherencia de indicación tras restaurar.',
    'Transfiere el esquema a un reloj de 24 horas o a una indicación descentrada y determina qué relación o interfaz tendría que cambiar.'
  ),
  'block.mechanical.final-project': expansion(
    '¿Qué evidencia mínima permite defender que has comprendido la cadena mecánica completa y no solo memorizado nombres o una animación?',
    'El proyecto integra fuente, tren, escape, oscilador, minutería, puesta en hora, indicación y estructura. La explicación debe conservar dos hilos: el recorrido de energía y las condiciones que permiten o interrumpen cada transferencia. También debe distinguir el estado de marcha de los estados de cuerda y puesta.\n\nIntegrar no significa añadir todas las piezas a una escena. Significa justificar relaciones: quién impulsa a quién, mediante qué interfaz, qué apoyo hace posible el movimiento, qué resultado es observable y qué afirmación no permite el modelo. La evidencia final combina una construcción independiente, una predicción de fallo, una restauración y una transferencia al 8215 sin suponer geometría idéntica.',
    'Un dossier correcto comienza con una cadena ensamblada y una tabla de interfaces. Introduce después una sola interrupción en un apoyo del tren. Predice que la fuente puede conservar carga mientras la salida y la indicación se detienen; comprueba el estado educativo y restaura. Finalmente localiza en el 8215 los subsistemas equivalentes, marcando qué relación está documentada, cuál es reconstruida y cuál permanece desconocida.',
    'Ensaya por capas. Primero dibuja la cadena sin modelo. Luego reconstrúyela con ayuda visual. Finalmente parte de una escena restaurada, realiza la construcción sin pistas y explica un fallo elegido al azar. La comparación con 8215 se registra aparte para que una equivalencia funcional no se convierta en afirmación geométrica.',
    '- La cadena tiene entrada, relaciones y salida completas.\n- La predicción de fallo distingue causa y síntoma.\n- El estado se restaura sin mutar un proyecto técnico.\n- La transferencia conserva procedencia, límites de fidelidad y desconocidos.',
    'Aplica el dossier a otro movimiento mecánico del Atlas y decide qué partes del modelo son invariantes funcionales y qué partes deben reaprenderse desde documentación propia.'
  ),
  'block.mechanical.energy': expansion(
    '¿Cómo pasa un reloj mecánico de energía almacenada a una indicación regulada, y por qué no basta con decir que «todo gira»?',
    'El recorrido comienza en el muelle real, que almacena energía al cambiar su estado durante la cuerda. El conjunto de barrilete ofrece una salida giratoria al tren. El tren transmite y adapta ese movimiento; no crea energía. En el extremo regulador, el escape alterna retención y liberación, y entrega impulsos al oscilador. La minutería toma una rama del movimiento para producir la indicación. Así aparecen dos recorridos relacionados: el de la energía, desde el muelle hacia las pérdidas, y el de la temporización, desde el oscilador hacia los instantes de liberación.\n\nEnergía, par, potencia y movimiento no son sinónimos. El par describe una acción de giro; la potencia depende también de la rapidez con que se transfiere energía. La animación solo conserva estados y dirección causal. No calcula la energía elástica, el par disponible, las pérdidas ni la autonomía de un reloj real. Por eso una pieza que se mueve en pantalla demuestra una relación educativa, no un balance energético validado.',
    'Imagina el muelle con carga disponible y una interrupción entre barrilete y primera etapa del tren. La fuente conserva su estado, pero el tren, el escape y la indicación quedan aguas abajo sin entrada. Si la interrupción se desplaza entre tren y escape, parte del tren puede seguir recibiendo movimiento mientras se pierde la liberación regulada. Si se conserva la cadena energética pero se rompe la referencia temporal, puede existir tendencia al movimiento sin una marcha controlada. Cada síntoma se explica localizando la primera salida ausente, no atribuyendo toda parada a una fuente agotada.',
    'Dibuja primero la cadena completa con seis funciones: almacenamiento, salida, transmisión, escape, oscilador e indicación. Marca con un color el flujo de energía y con otro la condición temporal. Después recibe tres interrupciones y predice qué subsistemas pueden conservar estado y cuáles dejan de recibir entrada. En el intento independiente explica una parada desde el síntoma hacia atrás, restaura el modelo y comprueba tu predicción sin usar etiquetas.',
    '- Distingues energía almacenada, par, movimiento y ritmo.\n- Sigues una causa a través de interfaces, no por proximidad visual.\n- Localizas el primer resultado ausente ante una interrupción.\n- Declaras que la animación no proporciona energía, pérdidas, par ni autonomía medidos.',
    'Aplica el mapa a un movimiento documentado: conserva las seis funciones, sustituye cada función por las piezas que indique la fuente y deja como desconocida cualquier magnitud que no haya sido calculada o medida.'
  ),
  'block.mechanical.train': expansion(
    '¿Cómo se construye y comprueba un tren compuesto sin perder el sentido de giro, duplicar etapas ni confundir una rueda con su piñón solidario?',
    'Un tren se lee alternando dos clases de relación. En un árbol, una rueda y un piñón pueden ser solidarios y comparten velocidad angular; entre árboles, sus dentados engranan y forman una etapa. La relación total se obtiene componiendo únicamente los pares de engrane activos. Contar como una etapa adicional el paso entre rueda y piñón del mismo árbol introduce un error. Cada engrane exterior invierte el sentido; una unión solidaria no lo hace.\n\nPara una etapa ideal, la razón de velocidades se obtiene de los números de dientes de la conductora y la conducida. En un tren compuesto, los cocientes se multiplican con una orientación declarada. El cálculo no prueba que las ruedas puedan engranar físicamente: módulo, perfil, distancia entre centros, juego, apoyos y libertad deben ser compatibles. La escena educativa usa conteos declarados y relaciones ideales. Esos números no pertenecen a un calibre real salvo que una fuente aplicable los proporcione.',
    'En un tren de dos etapas, la primera rueda conduce un piñón en otro árbol; la rueda solidaria de ese segundo árbol conduce después otro piñón. El ejemplo escribe por separado cada par de engrane, cancela las magnitudes intermedias al multiplicar y comprueba el sentido con el número de contactos exteriores. Si se retira el segundo engrane, la primera pareja aún puede cambiar de estado, pero la salida final queda aislada. Una respuesta que solo ofrece el producto numérico no permite saber si la orientación o el sentido son correctos.',
    'Construye una tabla con columnas para árbol, rueda solidaria, piñón solidario, pieza conductora, pieza conducida y apoyo. Calcula después la relación con los dientes visibles. Repite con un árbol intermedio y comprueba el sentido antes del valor. En el intento independiente recibe una cadena con un salto falso entre piezas próximas: localiza la interfaz que falta, corrige el grafo y predice el efecto de abrir cada etapa.',
    '- Cada cociente nombra entrada y salida.\n- No cuentas como engrane una unión solidaria sobre el mismo árbol.\n- Compruebas sentido y continuidad además del valor.\n- Separas cálculo ideal, compatibilidad geométrica y comportamiento físico.',
    'Transfiere el método a la minutería: identifica qué parte sigue siendo un tren de relaciones y qué requisito adicional impone la indicación de horas y minutos.'
  ),
  'block.mechanical.escapement': expansion(
    '¿Cómo se encadenan bloqueo, desbloqueo, impulso y caída en un escape de áncora sin convertir una secuencia educativa en instrucciones de ajuste?',
    'El escape administra la liberación del tren mediante estados alternos. Durante el bloqueo, un diente de la rueda de escape queda retenido por una superficie del áncora. El movimiento del oscilador permite el desbloqueo; después aparece una fase de impulso que transfiere energía hacia el oscilador, y una caída conduce al siguiente bloqueo. La alternancia repite la gramática funcional en lados opuestos, pero no debe reducirse a una rueda que gira continuamente.\n\nCada nombre describe una relación y un cambio de estado. «Bloqueo» no significa ausencia de energía aguas arriba; significa que la salida está retenida en esa interfaz. «Impulso» no equivale a amplitud medida. «Caída» no autoriza a inferir un ángulo ni una holgura. La vista lenta ayuda a ordenar acontecimientos y contactos declarados, pero no proporciona penetración, seguridad, ángulos, lubricación, rozamiento ni calidad de ajuste. Esas decisiones requieren geometría, medidas, documentación y práctica supervisada.',
    'Parte de un bloqueo estable. El oscilador cambia de posición hasta permitir el desbloqueo; la rueda avanza dentro del estado educativo; se representa el impulso y después la llegada al bloqueo opuesto. Si se elimina el contacto de bloqueo, la secuencia ya no puede esperar a la referencia temporal. Si se elimina el impulso, el modelo puede señalar que el oscilador deja de recibir energía, pero no calcula cómo decae su amplitud. El ejemplo termina separando lo observado de las consecuencias físicas pendientes.',
    'Ordena tarjetas de las cuatro fases y añade en cada una quién entrega energía, quién recibe y qué condición permite avanzar. Repite empezando desde una fase aleatoria para evitar memorizar siempre el mismo inicio. Después compara una secuencia válida con otra que salta del desbloqueo al bloqueo. En el intento independiente explica un ciclo completo sin reproducción automática y señala dos magnitudes que la escena no puede validar.',
    '- Ordenas las fases y justificas cada transición.\n- Distingues retención, liberación e impulso.\n- No conviertes una posición dibujada en un ajuste geométrico.\n- Declaras las mediciones y la revisión física que faltarían.',
    'Compara la misma gramática funcional con otro tipo de escape estudiado en las fuentes: conserva las preguntas sobre retención, liberación e impulso, pero no copies piezas ni geometría.'
  ),
  'block.mechanical.oscillator': expansion(
    '¿Cómo se relacionan frecuencia, periodo y amplitud en el oscilador, y por qué ninguna de esas magnitudes basta por sí sola para afirmar una buena marcha?',
    'El volante y la espiral forman un oscilador. La frecuencia expresa cuántos ciclos se producen por unidad de tiempo; el periodo es el tiempo de un ciclo y, en el modelo ideal, se relaciona mediante T = 1/f. Una alternancia corresponde a medio ciclo, de modo que la conversión a alternancias por hora exige declarar la unidad y multiplicar la frecuencia por dos y por 3600. La amplitud describe la extensión angular del movimiento, no su frecuencia.\n\nEn un reloj real, la marcha depende de la interacción entre oscilador, escape, energía disponible, posición, rozamiento, geometría y ajuste. Una amplitud visual mayor no prueba una frecuencia correcta, y una frecuencia nominal no demuestra estabilidad ni exactitud. Cambiar simbólicamente la longitud activa de la espiral sirve para razonar sobre tendencia, pero no resuelve masa, rigidez, forma de la espiral, punto de sujeción, perturbaciones ni error entre alternancias. La simulación separa variables para aprender; la unidad física vuelve a acoplarlas.',
    'Para una frecuencia educativa declarada, el ejemplo calcula el periodo y las alternancias por hora mostrando todos los pasos y unidades. Después mantiene la frecuencia y cambia solo la amplitud visual: el periodo calculado permanece igual en el modelo, lo que demuestra que son variables distintas. En un tercer estado se modifica la longitud activa de manera simbólica y se registra una tendencia, no una marcha prevista. La conclusión evita atribuir el resultado a un 8215 o a una espiral real.',
    'Resuelve dos conversiones de frecuencia y periodo con unidades completas. Clasifica después frases como «dato», «resultado calculado», «tendencia cualitativa» o «afirmación no disponible». Repite con la animación pausada y estima qué observación necesitarías para medir un ciclo. En el intento independiente compara dos estados con igual frecuencia y distinta amplitud, y explica por qué no puedes elegir el mejor reloj solo con esa escena.',
    '- Calculas periodo y alternancias por hora sin mezclar ciclo y alternancia.\n- Distingues frecuencia, amplitud y marcha.\n- Identificas qué cambio es simbólico.\n- No infieres estabilidad, error diario ni calidad física sin medición.',
    'Transfiere el método a una lectura de cronocomparador documentada: señala qué nuevas magnitudes aparecen, qué condiciones deben registrarse y por qué la interpretación ya no depende solo de la fórmula ideal.'
  ),
  'block.mechanical.keyless': expansion(
    '¿Cómo seleccionan corona, tija y mecanismo de puesta rutas distintas sin asumir que todas las arquitecturas colocan las mismas piezas del mismo modo?',
    'El mecanismo de cuerda y puesta se entiende como una máquina de estados. En posición de cuerda, la acción de la corona y la tija se transmite hacia la ruta que carga el muelle. En una posición de puesta, la selección cambia y la entrada llega a la minutería para mover la indicación. Puede existir un estado intermedio o neutro según la arquitectura. Corona, tija, piñón corredizo, tirete y báscula son piezas frecuentes en el modelo conceptual, pero su forma, posición y cooperación exactas deben confirmarse para cada calibre.\n\nUna transición válida necesita estado inicial, acción, relaciones activas y salida. Decir «girar la corona» es insuficiente porque la misma acción externa puede producir resultados distintos según la posición de la tija. Tampoco debe confundirse selección con transmisión: una pieza puede elegir qué engrane queda activo mientras otras conducen el movimiento. La escena representa cambios discretos y rechaza combinaciones incompatibles; no reproduce tacto, fuerza, elasticidad, desgaste ni seguridad de manipulación.',
    'En el estado de cuerda, la entrada llega a la rama de carga y la minutería no es la salida principal. Tras restaurar, la tija cambia al estado de puesta; ahora la cadena conduce hacia las agujas y no debe describirse como carga del barrilete. Un caso inválido conserva simultáneamente dos relaciones que el modelo declara incompatibles. La corrección no consiste en ocultar una rueda, sino en volver al último estado válido y reconstruir la selección.',
    'Crea una tabla con posición de corona, acción, piezas seleccionadas, salida esperada y relaciones que deben quedar inactivas. Completa primero los estados con etiquetas y después a partir de un resultado observado. En el intento independiente recibe una secuencia mezclada, localiza la primera transición imposible y explica qué relación tendría que cambiar. Usa siempre nombres españoles visibles antes de consultar el término técnico en el glosario.',
    '- Distingues estado, selección, transmisión y salida.\n- Explicas por qué una misma acción externa puede activar otra ruta.\n- No conviertes el esquema conceptual en disposición universal.\n- Señalas qué sensaciones y fuerzas requieren una unidad física.',
    'Compara dos calibres documentados: conserva las funciones de cuerda y puesta, pero crea para cada uno su propio mapa de piezas, posiciones y restricciones.'
  ),
  'block.mechanical.automatic-calendar': expansion(
    '¿Cómo se estudian la carga automática y el calendario como dos ramas funcionales distintas sin convertir el modelo conceptual en un 8215 simplificado?',
    'La carga automática añade una entrada de energía. El rotor responde al movimiento relativo y una transmisión conduce esa entrada hacia el sistema de carga del barrilete. Existen arquitecturas que aprovechan uno o ambos sentidos de giro mediante soluciones distintas; la comparación conceptual clasifica la ruta funcional, pero no asigna eficiencia, reversores ni geometría a un calibre concreto. La cuerda manual puede converger en el mismo objetivo de carga desde otra entrada.\n\nEl calendario, en cambio, deriva movimiento de la rama de indicación. Un elemento conductor inicia el cambio, el disco avanza y un sistema de posicionamiento lo lleva a un nuevo estado legible. La corrección añade otra entrada a esa máquina de estados. La secuencia educativa distingue reposo, entrada en cambio, avance y asentamiento; no publica una ventana horaria segura universal. Cualquier restricción de corrección debe proceder del manual aplicable. Un rotor y un disco de fecha pueden aparecer en la misma vista, pero no pertenecen a la misma cadena causal.',
    'Primero se sigue rotor → transmisión automática → entrada de carga. Al ocultar el rotor solo cambia la vista; el movimiento conceptual no se convierte en una variante manual. Después se restaura y se sigue indicación → conductor de calendario → avance → asentamiento. Una interrupción en automático afecta la entrada de carga, mientras que una interrupción en el posicionamiento del disco afecta la lectura de fecha. El ejemplo compara síntomas sin afirmar fuerzas, eficiencia ni daño real.',
    'Dibuja dos diagramas separados y marca su único contexto común: ambos cooperan dentro del reloj, pero tienen entradas y salidas distintas. Clasifica después diez piezas o funciones entre automático, calendario, ambos por contexto o ninguno. Ordena un ciclo de fecha y una ruta de carga. En el intento independiente recibe un síntoma de cada rama, localiza la primera función ausente y redacta qué documento necesitarías antes de una intervención física.',
    '- Sigues por separado la ruta automática y la del calendario.\n- Diferencias convergencia funcional de identidad de piezas.\n- No inventas eficiencia, geometría ni ventana de corrección.\n- Mantienes el modelo conceptual separado del ensamblaje 8215.',
    'Transfiere ambos mapas al 8215 utilizando solo sus fuentes y relaciones declaradas; anota qué funciones se conservan y qué solución constructiva debe reaprenderse.'
  ),
}

Object.assign(THEORY_EXPANSIONS, {
  'block.quartz2035.workstation': expansion(
    '¿Cómo se organiza un puesto de observación para que cada acción sea trazable, reversible y no mezcle una simulación con una intervención física?',
    'El puesto separa movimiento, herramientas, bandeja, documentación y zona de inspección. Esa separación reduce pérdidas de identidad y obliga a registrar el estado antes de actuar. En una sesión digital la reversibilidad procede del estado inicial guardado; en una unidad física no existe un botón de restauración. Por eso preparar el banco no es decoración: define qué objeto se estudia, con qué autoridad y dónde se conserva cada pieza.\n\nUna condición segura depende del alcance. La práctica puede enseñar selección, secuencia y registro, pero no acredita control electrostático, manipulación de una pila, limpieza o reparación. Los riesgos reales se documentan y se derivan a una práctica supervisada.',
    'Antes de abrir el 2035, se identifica la instancia, se consulta la fuente aplicable y se fotografía o registra el estado inicial. Las herramientas quedan fuera de la zona del movimiento hasta que una operación las necesita. Al retirar una pieza en simulación, su identidad de instancia viaja a una bandeja concreta. Si se cancela, el modelo vuelve al estado inicial guardado; el registro conserva que hubo un intento sin fingir una reparación.',
    'Prepara una vez con todas las etiquetas. Repite con la lista accesible y sin depender del color. En el tercer intento se introduce una incoherencia —herramienta en zona equivocada, bandeja sin identidad o fuente no revisada— y debes detectarla antes de iniciar.',
    '- La instancia y la fuente quedan identificadas.\n- Movimiento, herramienta, bandeja y documento no comparten un estado ambiguo.\n- Sabes qué restaura el software y qué no sería reversible físicamente.\n- Detienes la práctica ante una condición no respaldada.',
    'Usa el mismo protocolo para otro calibre y enumera qué zonas son universales y qué controles dependen del tipo de movimiento.'
  ),
  'block.quartz2035.tools': expansion(
    '¿Cómo se elige una herramienta por la interfaz y la operación que debe realizar, en vez de por parecido o disponibilidad?',
    'Una herramienta correcta debe corresponder a la geometría accesible, la función y el nivel de autoridad de la operación. Seleccionar no equivale a usar: primero se identifica la pieza o sujeción, después se consulta la documentación y finalmente se comprueba que el modelo didáctico autoriza la acción. Una punta que “cabe” visualmente puede ser inadecuada si no corresponde a la interfaz.\n\nEl laboratorio representa herramientas por su función. No simula presión, dureza, deslizamiento, magnetismo, electricidad estática ni daño. La enseñanza válida es la lógica de elección y rechazo, no una promesa de destreza manual.',
    'Se propone actuar sobre una sujeción documentada. La opción A coincide con el rol y la interfaz declarados; la B es mayor pero visualmente cercana; la C pertenece a otra operación. El ejemplo selecciona A, explica la evidencia y deja constancia de que la presión real sigue sin validar. Si la referencia de la pieza no está disponible, ninguna herramienta se acepta por intuición.',
    'Clasifica herramientas por operación. Después recibe operaciones y elige el rol sin ver el icono. Finalmente evalúa un caso incompleto: si falta autoridad o interfaz, la respuesta correcta es detenerse y consultar, no escoger la herramienta más probable.',
    '- Nombras pieza, interfaz y operación antes de la herramienta.\n- Rechazas una opción incompatible aunque parezca próxima.\n- No conviertes selección digital en competencia manual.\n- Registras el motivo de una parada.',
    'Transfiere la regla a herramientas de medición: explica por qué rango, resolución y acceso importan además de la forma.'
  ),
  'block.quartz2035.observe': expansion(
    '¿Qué debe registrarse antes de desmontar para poder distinguir después una condición inicial, un cambio propio y una inferencia?',
    'Observar comienza por identidad, orientación, estado, zonas visibles, sujeciones y anomalías. Una observación describe lo que se ve o lo que un instrumento registra; una inferencia propone una explicación. “El contacto está desplazado” puede ser observación si el estado es visible; “por eso el reloj no funciona” es una hipótesis hasta comprobar la cadena.\n\nLa vista muestra una reconstrucción del ensamblaje estructural. Sirve para localizar subsistemas y relaciones declaradas, pero una apariencia normalizada no documenta el acabado ni el estado de una unidad física. El registro inicial debe conservar esa frontera.',
    'Se abre una instancia con una pieza resaltada. El expediente anota orientación, pieza, estado visual y fuente de la identidad. No escribe “defectuosa”; formula “posición distinta del estado de referencia” y propone una comprobación. Después de una acción reversible, compara exactamente el mismo punto de vista para no confundir un cambio de cámara con un cambio del mecanismo.',
    'Haz una lista sin interpretación. Añade después una columna de hipótesis y otra de prueba. En el intento independiente recibe tres frases mezcladas y clasifícalas como observación, inferencia o desconocido antes de tocar el modelo.',
    '- Conservas identidad y orientación.\n- Separas descripción, hipótesis y conclusión.\n- Comparas estados equivalentes.\n- No atribuyes a la reconstrucción estructural detalles que no contiene.',
    'Aplica el registro a una fotografía real y explica qué información adicional aporta y qué sigue sin poder inferirse.'
  ),
  'block.quartz2035.isa-memory': expansion(
    '¿Cómo se utiliza una experiencia previa con ISA 8172 sin convertir el recuerdo de otro calibre en evidencia sobre el MIYOTA 2035?',
    'El conocimiento previo puede orientar preguntas, nunca sustituir la documentación del objeto actual. Se construye un mapa de confianza con tres capas: recuerdo personal, función posiblemente equivalente y hecho confirmado para 2035. La equivalencia funcional permite comparar fuente, control, motor, tren e indicación; no autoriza copiar referencias, dimensiones, posiciones ni secuencias.\n\nEsta unidad es un puente opcional. Quien no conoce ISA comienza directamente desde la documentación 2035. Quien sí lo conoce debe hacer explícito qué espera encontrar y aceptar que la comprobación puede refutarlo.',
    'El alumno recuerda que otro cuarzo tenía bobina y rotor paso a paso. Escribe esa afirmación como hipótesis funcional. Consulta después el despiece 2035 para confirmar identidades disponibles. Si una posición parece semejante pero no está documentada, queda como reconstrucción estimada. El mapa final no premia acertar de memoria; premia corregir la confianza.',
    'Formula tres predicciones del calibre recordado. Busca una confirmación, una diferencia y un dato ausente. Repite con una persona sin experiencia usando solo el mapa funcional; ambas rutas deben llegar al mismo nivel de autoridad sobre 2035.',
    '- El puente es opcional y no bloquea a principiantes.\n- Cada recuerdo lleva nivel de confianza.\n- Solo la fuente 2035 confirma datos 2035.\n- Una equivalencia de función no implica equivalencia de pieza.',
    'Usa el mismo método al pasar de 2035 a otro cuarzo: conserva el mapa funcional y reinicia las afirmaciones específicas.'
  ),
  'block.quartz2035.documentation': expansion(
    '¿Qué pregunta responde cada documento oficial del 2035 y cómo se evita usar una ficha general como si fuera un plano o un procedimiento?',
    'La página de producto identifica el calibre y resume prestaciones. La especificación fija datos nominales dentro de su revisión. El plano define cotas y referencias gráficas concretas. El manual aporta instrucciones y restricciones dentro de su alcance. El despiece relaciona identidades y posiciones de montaje. Ninguno sustituye automáticamente a los demás.\n\nLeer documentación significa conservar documento, revisión, localizador y la afirmación exacta que respalda. Una proporción tomada de una imagen nunca se registra como cota oficial. Si dos documentos parecen discrepar, se conserva la discrepancia hasta resolver referencia, variante o revisión.',
    'Se pide localizar una dimensión de interfaz. El ejemplo rechaza la fotografía de producto, abre el plano, identifica la vista y la cota, y registra unidad y revisión. Después se solicita el nombre de una pieza: el despiece es la fuente adecuada. El manual solo se usa para una restricción operativa que realmente declara.',
    'Clasifica diez afirmaciones por documento adecuado. Luego extrae un dato con su cita completa. Finalmente recibe una imagen sin escala y debe negarse a convertir una proporción en dimensión.',
    '- Escoges la fuente por la pregunta.\n- Registras revisión y alcance.\n- Distingues identidad, dato nominal, relación deducida y estimación visual.\n- Mantienes desconocido lo que la documentación no resuelve.',
    'Repite el proceso con 8215 y compara qué tipos documentales están disponibles sin asumir que ambos expedientes contienen lo mismo.'
  ),
  'block.quartz2035.anatomy': expansion(
    '¿Cómo se recorre el MIYOTA 2035 desde la pila hasta las agujas sin confundir proximidad visual con conexión funcional?',
    'La cadena conceptual de cuarzo distingue fuente, control y referencia temporal, bobina, rotor paso a paso, tren, minutería e indicación. En el ensamblaje 2035 se vinculan estas funciones con identidades documentadas cuando existen. Los contactos y sujeciones pertenecen también a la explicación porque una cadena eléctrica o mecánica necesita interfaces, no solo componentes nombrados.\n\nEl modelo de ensamblaje individualiza piezas y relaciones estructurales suficientes para seleccionar y aislar. Representa una secuencia educativa coordinada, pero no simula corriente, campo magnético, par, consumo ni marcha real. La cadena debe leerse por entradas y salidas, no como una lista de colores.',
    'Con la pila presente y el tren oculto se sigue primero la ruta eléctrica hasta la bobina. Después se muestra el rotor y se enlaza cada paso eléctrico con un avance mecánico discreto. Al revelar el tren, el movimiento llega a la indicación. Si se oculta la pila, no se concluye que una unidad física está agotada: solo se representa una interrupción educativa de la fuente.',
    'Recorre la cadena con flechas. Repite desde las agujas hacia atrás preguntando de dónde llega cada cambio. En el tercer intento se retira un enlace y debes localizar el primer subsistema aguas abajo que deja de recibir su entrada.',
    '- Nombras la entrada y salida de cada subsistema.\n- Señalas contactos o engranes, no solo proximidades.\n- Diferencias 2035 documentado y cuarzo conceptual.\n- Declaras que la geometría está reconstruida, la secuencia es educativa y la física no se simula.',
    'Compara la cadena con la mecánica conceptual y explica qué funciones son equivalentes y qué medios físicos no lo son.'
  ),
  'block.quartz2035.disassembly': expansion(
    '¿Cómo se construye un orden de desmontaje virtual a partir de sujeciones y dependencias sin presentarlo como procedimiento físico oficial?',
    'El orden educativo procede de relaciones como cubre, retiene, está fijado por y retirar antes de. Antes de cada retirada se identifica la instancia, se comprueba autoridad, se selecciona una herramienta por función y se asigna una bandeja. Una pieza conocida solo por la documentación, o marcada como bloqueada, puede aparecer en la secuencia sin ser manipulable.\n\nEl laboratorio hace reversibles los comandos digitales y conserva errores; una unidad física puede deformarse, perder orientación o sufrir daño. La secuencia sirve para practicar dependencias y trazabilidad, no para certificar servicio.',
    'Una cubierta retiene un subsistema y está fijada por dos elementos identificados. El ejemplo registra la posición, retira primero las fijaciones autorizadas, mueve cada instancia a una bandeja con orientación y solo entonces libera la cubierta. Intentar retirar lo cubierto antes genera un rechazo explicado. Cancelar restaura el estado, pero el registro conserva la decisión.',
    'Ordena una cadena con todas las dependencias visibles. Repite con una relación oculta que debes consultar. En el intento independiente recibe una orden imposible y señala exactamente qué dependencia se viola antes de corregirla.',
    '- Cada paso tiene instancia, autoridad, herramienta y destino.\n- Una dependencia bloqueante se explica junto al control.\n- La bandeja conserva identidad y orientación.\n- No llamas oficial a la secuencia educativa.',
    'Transfiere el método al 8215 y compara la complejidad del grafo sin copiar el orden del 2035.'
  ),
  'block.quartz2035.assembly': expansion(
    '¿Cómo se verifica un montaje virtual por dependencias y comprobaciones parciales, en lugar de invertir ciegamente una lista de desmontaje?',
    'Montar requiere que apoyos, interfaces, orientación y sujeciones estén disponibles en el estado correcto. Invertir una secuencia puede ser una primera hipótesis, pero no basta: algunas comprobaciones deben hacerse antes de cubrir el acceso. El sistema valida dependencias declaradas y permite modos guiado, asistido y libre con retirada progresiva de ayuda.\n\nUna aceptación digital confirma consistencia del modelo declarativo. No mide presión de agujas, contacto eléctrico, par de tornillo ni funcionamiento real. Esas magnitudes quedan fuera de esta simulación.',
    'Se coloca una rueda sobre sus apoyos, se comprueba libertad simbólica y engrane declarado, y solo después se añade la cubierta. Si la cubierta se coloca primero, la siguiente pieza queda inaccesible y el sistema explica la dependencia. Al final se restaura y se repite sin la lista completa.',
    'Completa un montaje guiado. Repite con solo puntos de control. En el intento independiente recibe una bandeja desordenada, reconstruye por identidades y realiza una comprobación parcial antes de cada cierre.',
    '- No montas sobre una dependencia ausente.\n- Verificas antes de ocultar el acceso.\n- Reduces ayuda entre intentos.\n- Separas consistencia digital de funcionamiento físico.',
    'Aplica el patrón a un conjunto mecánico conceptual y decide qué verificaciones siguen siendo funcionales aunque cambie la geometría.'
  ),
  'block.quartz2035.diagnosis': expansion(
    '¿Cómo se pasa de un síntoma a una comprobación discriminante sin sustituir mediciones eléctricas o inspección física por una animación?',
    'Diagnosticar empieza por describir el síntoma y localizar qué funciones podrían producirlo. Después se generan hipótesis rivales, se elige una comprobación que produzca resultados distintos entre ellas y se actualiza la conclusión. Cambiar piezas al azar no es diagnóstico.\n\nEl modelo didáctico puede activar fallos visuales controlados y estados lógicos. No mide tensión, consumo, continuidad, magnetismo ni condición real. Cuando una hipótesis exige esas magnitudes, el resultado correcto es un plan de prueba física, no una certeza digital.',
    'Síntoma: la indicación no avanza. Hipótesis A: fuente interrumpida; B: tren bloqueado. La observación del punto de entrada al tren discrimina: si el rotor recibe pasos y la salida no cambia, B gana apoyo; si no existe entrada, A sigue abierta junto con control y bobina. El ejemplo registra resultados y mantiene las alternativas no descartadas.',
    'Construye dos hipótesis por síntoma. Elige la primera comprobación que más las separe. Repite con un resultado ambiguo y evita cerrarlo como diagnóstico. Termina redactando qué instrumento o inspección real faltaría.',
    '- El síntoma no se confunde con la causa.\n- Comparas al menos dos hipótesis.\n- La prueba elegida puede cambiar la decisión.\n- Los límites eléctricos y físicos quedan explícitos.',
    'Transfiere el árbol de hipótesis a un cuarzo distinto conservando funciones, pero reiniciando valores, referencias y procedimientos.'
  ),
  'block.quartz2035.final-project': expansion(
    '¿Qué debe contener un dossier del 2035 para demostrar método, comprensión funcional y trazabilidad sin fingir una reparación física?',
    'El proyecto integra identificación, documentación, anatomía, desmontaje, montaje y diagnóstico. Cada conclusión enlaza instancia, acción, evidencia, fuente y límite. La estructura debe permitir que otra persona reproduzca la sesión digital y sepa qué no fue comprobado.\n\nLa evidencia final no es el número de pantallas visitadas. Incluye una secuencia independiente, un estado restaurado, una explicación causal, una hipótesis contrastada y una transferencia funcional. Una revisión humana valora la explicación; el software no convierte longitud de texto en competencia.',
    'El dossier comienza con fuente y revisión. Registra después el estado inicial, una secuencia de dependencias, comprobaciones parciales y la restauración del estado guardado. Para un fallo simbólico incluye síntoma, hipótesis rivales, prueba y conclusión limitada. Cierra con una comparación a otro calibre donde separa función común y dato específico.',
    'Ensaya por partes con guía. Construye después el dossier sin copiar el ejemplo y somételo a una lista de control. Por último cambia el fallo o la documentación disponible y repite la decisión crítica sin pistas.',
    '- Cada dato tiene procedencia.\n- Cada operación conserva identidad y estado.\n- La explicación enlaza causa y resultado.\n- El dossier declara lo no medido y lo no validado.',
    'Reutiliza la plantilla del dossier para 8215, pero reconstruye fuentes, dependencias y fronteras propias.'
  ),
})

Object.assign(THEORY_EXPANSIONS, {
  'block.miyota8215.identify': expansion(
    '¿Qué evidencia permite identificar una instancia como MIYOTA 8215 y qué señales solo justifican una hipótesis de familia?',
    'La identificación combina referencia oficial, marcas visibles, documentación aplicable y contexto de la instancia. Una forma parecida o una arquitectura compartida con la familia 82 no bastan. El registro técnico separa fabricante, calibre, familia, variante y unidad física.\n\nEl recurso digital se etiqueta 8215 porque su identidad editorial está vinculada a fuentes curadas; no demuestra que cualquier fotografía semejante sea un 8215. Si falta una marca o la imagen no permite leerla, la identidad permanece provisional.',
    'Se comparan tres registros: uno con referencia legible y fuente aplicable, otro con aspecto compatible pero sin marca, y el modelo educativo. Solo el primero identifica una unidad física; el segundo queda como candidato de familia; el tercero identifica el recurso, no una pieza real en la mesa.',
    'Clasifica evidencia fuerte, indicio y ausencia. Repite con una fotografía parcial. En el intento independiente redacta qué dato pedirías antes de aceptar la identidad.',
    '- No identificas por silueta.\n- Distingues recurso, calibre y unidad física.\n- Conservas variante y revisión.\n- Puedes rechazar una identificación insuficiente.',
    'Aplica el protocolo a otro miembro de la familia 82 y explica qué similitudes no resuelven el calibre exacto.'
  ),
  'block.miyota8215.documentation': expansion(
    '¿Cómo se combinan ficha, especificación, plano, manual y despiece del 8215 sin extender una afirmación más allá del documento que la soporta?',
    'Cada documento tiene autoridad y alcance. La ficha de producto resume identidad y prestaciones; la especificación y el plano fijan datos nominales y de interfaz; el manual declara operaciones o restricciones concretas; el despiece vincula referencias y posiciones. La ausencia de un dato no autoriza a deducirlo de una imagen.\n\nUna afirmación reproducible conserva URL, revisión disponible, fecha de consulta y localizador. Si se usa una copia local, su hash identifica el binario. La explicación educativa se mantiene como capa derivada y no se presenta como texto del fabricante.',
    'Para una cota se consulta el plano, no la foto de catálogo. Para asociar una referencia con una pieza se consulta el despiece. Para una restricción de ajuste se consulta el manual. El ejemplo registra tres filas separadas y deja una cuarta como desconocida porque ningún documento la resuelve.',
    'Responde cinco preguntas eligiendo primero el tipo documental. Extrae después una afirmación y su límite. En el intento independiente detecta una conclusión que mezcla dos revisiones o atribuye al fabricante una reconstrucción.',
    '- Fuente adecuada a la pregunta.\n- Revisión y localizador visibles.\n- Explicación separada del documento original.\n- Desconocidos no rellenados.',
    'Compara el expediente del 8215 con el 2035 y registra diferencias de cobertura, no solo diferencias de mecanismo.'
  ),
  'block.miyota8215.architecture': expansion(
    '¿Cómo se reconstruye el 8215 por capas y subsistemas sin confundir una vista oculta con un modelo alternativo?',
    'El ensamblaje canónico contiene platina, puentes, barrilete, tren, escape, oscilador, cuerda y puesta, minutería, automático, calendario, rotor y sujeciones según el nivel estructural disponible. Ocultar automático, calendario o rotor cambia la vista, no la identidad del movimiento.\n\nLa arquitectura se entiende por relaciones: una pieza pertenece a un subsistema, apoya o cubre otras, engrana, impulsa o retiene, y puede bloquear un acceso. La reconstrucción fija el orden estructural y relaciones educativas; no aporta toda geometría oculta ni una secuencia oficial de servicio.',
    'Se parte del movimiento completo. Primero se oculta rotor y automático para revelar puentes; después calendario para comparar caras. La tabla de estado conserva que todas las piezas siguen en el mismo ensamblaje. Al restaurar, cada identidad de pieza vuelve a su visibilidad original y ninguna variante nueva se crea.',
    'Reconstruye capas con etiquetas. Repite desde una lista de relaciones. En el intento independiente recibe tres vistas parciales y demuestra que pertenecen al mismo ensamblaje mediante identidades y dependencias.',
    '- Distingues vista y variante.\n- Identificas subsistemas por función y relación.\n- Restauras el ensamblaje único.\n- No atribuyes una secuencia profesional a la reconstrucción estructural.',
    'Compara la arquitectura con otro calibre manual y explica qué capas desaparecen o cambian sin alterar el mapa funcional básico.'
  ),
  'block.miyota8215.automatic': expansion(
    '¿Cómo llega el movimiento del rotor al sistema de cuerda y qué puede afirmarse sobre esa cadena sin simular fuerzas o eficiencia?',
    'El rotor capta movimiento relativo de la muñeca y lo transmite por el sistema automático hacia la carga del barrilete. La cadena debe leerse por piezas e interfaces documentadas o reconstruidas con autoridad visible. El hecho de que una rueda gire en una animación no demuestra sentido de carga, rendimiento o deslizamiento reales.\n\nLa cuerda manual y la automática convergen en el estado de carga, pero tienen entradas distintas. El estudio debe mostrar dónde convergen y qué elementos quedan fuera de una vista aislada. La dirección o arquitectura específica solo se afirma cuando la fuente del 8215 la respalda.',
    'Se activa el rotor en el modelo y se sigue un único enlace cada vez hasta el nodo de carga. Después se oculta el rotor sin eliminar el subsistema: la cadena queda incompleta visualmente, no transformada en calibre manual. Al activar cuerda manual, se observa otra entrada hacia el mismo objetivo funcional.',
    'Sigue la ruta con flechas. Repite en sentido inverso desde el barrilete. En el intento independiente compara rotor y corona y marca el primer punto donde sus caminos difieren.',
    '- Separas entrada automática y manual.\n- Nombras las interfaces disponibles.\n- No deduces rendimiento ni fuerza.\n- Mantienes la identidad del ensamblaje al ocultar el rotor.',
    'Transfiere la comparación a una arquitectura automática distinta y conserva función común sin copiar la solución constructiva.'
  ),
  'block.miyota8215.winding-setting': expansion(
    '¿Cómo seleccionan corona y tija rutas distintas para cuerda y puesta en hora, y qué estados deben distinguirse?',
    'La tija actúa como entrada de usuario. Su posición y sentido habilitan relaciones diferentes en el sistema de puesta: una ruta puede transmitir a la cuerda manual y otra a la minutería. No basta con decir “girar la corona”; hay que identificar estado, piezas engranadas y resultado.\n\nEl modelo didáctico representa cambios de estado y dependencias. No valida tacto, fuerza, desgaste ni ajuste. Tampoco debe inferir una posición o función no documentada para una variante.',
    'En el estado de cuerda, girar la entrada cambia el camino hacia el barrilete y la indicación no se usa como salida principal. En el estado de puesta, la cadena llega a la minutería y mueve las agujas. El ejemplo restaura entre ambos para que no se mezclen engranes activos.',
    'Reconstruye los estados con guía. Repite recibiendo solo el resultado deseado. En el intento independiente se presenta una ruta incoherente y debes localizar la primera relación de selección equivocada.',
    '- Nombras posición, entrada, ruta y salida.\n- Distingues cuerda de puesta.\n- Restauras antes de comparar.\n- No atribuyes sensaciones físicas al modelo.',
    'Compara el sistema con el mecánico conceptual y señala qué estado es funcionalmente equivalente y qué piezas son propias del calibre.'
  ),
  'block.miyota8215.calendar': expansion(
    '¿Cómo transforma el calendario una entrada diaria en avance y posicionamiento de fecha sin inventar una ventana universal de corrección?',
    'El calendario recibe movimiento desde la indicación o su tren asociado, acciona el elemento de avance y desplaza el disco. Un saltador y su muelle posicionan la indicación en un estado legible. La corrección utiliza otra entrada hacia el mismo subsistema.\n\nCambio normal y corrección rápida pueden compartir piezas o estados; cualquier restricción horaria debe proceder del manual aplicable. El laboratorio muestra un ciclo discreto de relaciones, no fuerzas, elasticidad ni geometría exacta.',
    'Se parte de fecha asentada. El conductor entra en la zona educativa de cambio, desplaza el disco y el saltador pasa al siguiente asiento. Después se restaura y se intenta corrección en un estado declarado incompatible por el escenario: el sistema bloquea la acción sin convertir esa regla simulada en ventana oficial universal.',
    'Ordena reposo, entrada, avance y asentamiento. Repite desde una fase intermedia. En el intento independiente compara cambio normal y corrección, identificando su punto de convergencia.',
    '- Explicas entrada, avance y posicionamiento.\n- Diferencias ciclo y corrección.\n- Citas cualquier restricción específica.\n- No inventas una ventana horaria.',
    'Transfiere el modelo a un calendario con otra indicación y determina qué estados adicionales serían necesarios.'
  ),
  'block.miyota8215.barrel-energy': expansion(
    '¿Cómo se localiza la fuente de energía del 8215 y se sigue su salida hacia el tren sin atribuir al modelo valores físicos que no contiene?',
    'El muelle almacena energía dentro del conjunto de barrilete. La cuerda manual o automática modifica su estado y el dentado del barrilete entrega movimiento al tren. La arquitectura real se vincula a identidades documentadas; la visualización interna puede ser reconstruida.\n\nEl ensamblaje permite seguir relaciones estructurales y sentidos educativos, pero no aporta reserva de marcha medida, par, curva de entrega, lubricación ni condición de una unidad. Una carga simbólica es un estado del laboratorio.',
    'Se marca la entrada de cuerda, el estado del muelle y el engrane de salida. Con la salida desacoplada, el estado puede quedar cargado sin mover el tren. Al reconectar, la energía se propaga. El ejemplo evita llamar “agotada” a una unidad física: solo describe el estado simulado.',
    'Sigue carga y descarga en rutas separadas. Repite desde el tren hacia la fuente. En el intento independiente diferencia fuente descargada, salida desacoplada y tren bloqueado.',
    '- Localizas almacenamiento y salida.\n- Distingues modos de carga.\n- Predices tres interrupciones distintas.\n- No presentas estados simbólicos como medidas.',
    'Compara con el barrilete conceptual y registra qué relaciones son equivalentes y qué detalles dependen del 8215.'
  ),
  'block.miyota8215.train': expansion(
    '¿Cómo se identifica el tren del 8215 por sus engranes, árboles y apoyos y no por una fila de ruedas próximas?',
    'El tren conecta el barrilete con el escape mediante pares de ruedas y piñones solidarios a árboles. Cada etapa requiere un engrane real y apoyos que definan el eje. La posición aproximada puede derivarse del ensamblaje estructural, mientras que perfiles y tolerancias ocultas permanecen desconocidos.\n\nSeguir el tren exige alternar relaciones: engrana con y comparte árbol con. Saltar una de ellas produce una cadena falsa aunque todas las piezas estén cerca.',
    'Se parte del barrilete y se selecciona el primer engrane. En el mismo árbol, la siguiente salida procede del piñón correspondiente; después se sigue el siguiente contacto. Al ocultar un apoyo, la cadena estructural queda incompleta aunque el dibujo de dientes no cambie.',
    'Recorre con etiquetas. Repite alternando engrane y árbol sin nombres. En el intento independiente recibe un enlace basado solo en proximidad y debe sustituirlo por una relación declarada.',
    '- Cada salto nombra una interfaz.\n- No confundes rueda, piñón y árbol.\n- Incluyes apoyos.\n- Separas la relación estructural de una geometría exacta.',
    'Transfiere la ruta al tren conceptual y explica qué cálculos ideales no deben atribuirse automáticamente al 8215.'
  ),
  'block.miyota8215.escapement-oscillator': expansion(
    '¿Cómo cooperan rueda de escape, áncora, volante y espiral en el 8215 y qué parte de esa cooperación es solo cinemática educativa?',
    'La rueda de escape recibe energía del tren; el áncora alterna bloqueo, liberación e impulso; el volante y la espiral aportan el movimiento oscilante que gobierna la secuencia. La cadena tiene realimentación y no puede entenderse como cuatro piezas girando independientemente.\n\nEl modelo didáctico ordena fases y puede señalar relaciones. No calcula impulso, caída, amplitud, error entre alternancias, fricción ni marcha. La identidad de las piezas puede ser oficial aunque su geometría interna sea reconstruida.',
    'Se pausa en bloqueo, se avanza a liberación e impulso y se observa el retorno del oscilador. Al retirar simbólicamente el enlace de impulso, la cadena no puede sostener el ciclo. El ejemplo registra esa conclusión como relación educativa, no como medida de amplitud.',
    'Ordena fases con guía. Repite empezando en una fase aleatoria. En el intento independiente explica dos flujos: energía hacia el volante y condición temporal hacia la rueda de escape.',
    '- Ordenas las fases.\n- Distingues energía y regulación.\n- No atribuyes física validada a la simulación educativa.\n- Conservas autoridad por pieza y relación.',
    'Compara con el escape conceptual y detecta qué parte es un invariante funcional, no geométrico.'
  ),
  'block.miyota8215.plan-disassembly': expansion(
    '¿Cómo se redacta un plan de desmontaje del modelo 8215 que respete dependencias, autoridad y puntos de inspección sin llamarlo manual de servicio?',
    'El plan se construye desde el grafo de dependencias: retirar antes de, cubrir, retener y fijar con. Antes de retirar se registra instancia, orientación, herramienta, destino y comprobación. Los subsistemas se agrupan para conservar contexto; un orden visual de capas no basta.\n\nLa secuencia disponible es educativa y parcial. Una operación no documentada o una pieza conocida solo por referencia documental queda bloqueada. La práctica digital no cubre descarga física de energía, manipulación, limpieza ni riesgo de daño.',
    'El ejemplo toma el rotor como acceso inicial autorizado en el escenario. Registra su sujeción, asigna bandeja y comprueba qué subsistema queda visible. Antes del siguiente paso revisa si otra cubierta retiene piezas. Una propuesta que salta esa dependencia se rechaza con motivo.',
    'Ordena dependencias con todas visibles. Repite ocultando la lista y justificando cada paso. En el intento independiente incluye puntos de parada y una alternativa si falta autoridad.',
    '- Cada paso tiene prerequisito.\n- Herramienta y bandeja están ligadas a instancia.\n- Hay comprobaciones antes de cubrir o liberar.\n- El plan declara su alcance educativo.',
    'Adapta el método a otro calibre sin reutilizar el orden; solo conserva la gramática de dependencias.'
  ),
  'block.miyota8215.guided-disassembly': expansion(
    '¿Qué debe aprenderse en un desmontaje guiado además de pulsar el siguiente botón?',
    'La guía hace visibles identidad, dependencia, herramienta, orientación, bandeja y resultado. Su función es modelar una decisión completa. Cada paso debe poder explicarse antes de ejecutarse y comprobarse después. La ayuda no cuenta como aprendizaje independiente.\n\nLos errores normales producen un rechazo local y recuperable. Un fallo del alumno no altera el modelo didáctico ni borra evidencia. La reversibilidad es digital; no describe una operación física.',
    'La guía señala una sujeción y pregunta qué retiene. El alumno predice el acceso que se liberará, ejecuta, comprueba y coloca la instancia en bandeja. A continuación la guía oculta una etiqueta para comenzar a retirar soporte.',
    'Primero sigue todos los pasos. Repite con solo dependencias. En el intento independiente reconstruye un tramo corto después de restaurar y explica por qué cada paso precede al siguiente.',
    '- Predices antes de actuar.\n- Explicas la dependencia.\n- Conservas identidad y orientación.\n- Distingues guiado e independiente.',
    'Usa el mismo tramo como ejemplo parcial para enseñar a otra persona y decide qué ayuda retirar primero.'
  ),
  'block.miyota8215.assisted-free-disassembly': expansion(
    '¿Cuándo puede retirarse la guía y qué evidencia demuestra que una secuencia digital fue razonada de forma independiente?',
    'El modo asistido conserva puntos de control pero no entrega el paso. El modo libre exige seleccionar instancia, justificar dependencia y gestionar bandeja. Las pistas usadas quedan registradas y obligan a repetir una variante sin ayuda.\n\nLibre no significa sin restricciones: la autoridad, los bloqueos de piezas solo documentadas, la restauración y la frontera física siguen activos. Un resultado digital correcto demuestra manejo del modelo y razonamiento de procedimiento dentro de ese alcance.',
    'En modo asistido aparece un aviso de dependencia antes de una elección incompatible. En el reintento libre el aviso desaparece; el alumno consulta el grafo, elige otro orden y explica la decisión. La evidencia distingue ambos intentos.',
    'Completa un tramo asistido, repítelo con menos señales y termina con una variante independiente. Si usas pista, restaura y cambia la posición inicial antes del intento acreditable.',
    '- Menos ayuda entre intentos.\n- Decisión explicada antes de ejecutar.\n- Pistas registradas.\n- Ninguna afirmación de destreza física.',
    'Transfiere el criterio a montaje y determina qué dependencias se invierten y cuáles requieren una comprobación nueva.'
  ),
  'block.miyota8215.inspection': expansion(
    '¿Cómo se registra una inspección del modelo y de una unidad física sin confundir defecto simbólico, observación y diagnóstico?',
    'La inspección describe pieza, zona, método, resultado y autoridad. Un defecto simbólico es una condición controlada del modelo didáctico; sirve para practicar detección y razonamiento. Una fotografía real documenta una unidad y un estado. Ninguna de ambas confirma causa sin una prueba.\n\nMedir exige instrumento, calibración, unidad e incertidumbre; si no existen, el hallazgo permanece cualitativo. La inspección digital no puede certificar desgaste, lubricación o acabado.',
    'Se observa una rueda marcada como desplazada en el escenario. El registro dice “estado simbólico fuera de referencia”, no “pivote doblado”. Formula dos causas posibles y propone una verificación visual o metrológica. La conclusión queda abierta hasta obtener evidencia.',
    'Clasifica hallazgos como observación, símbolo o inferencia. Repite con una fotografía. En el intento independiente redacta una ficha que no exceda la autoridad disponible.',
    '- Describes antes de diagnosticar.\n- Identificas unidad y método.\n- No cuantificas sin medición.\n- Propones una prueba discriminante.',
    'Conecta un hallazgo con la ruta de metrología y decide qué instrumento o fotografía sería adecuado.'
  ),
  'block.miyota8215.assembly-verification': expansion(
    '¿Cómo se monta y verifica el modelo 8215 por estados parciales sin aceptar el conjunto solo porque todas las piezas aparecen colocadas?',
    'Cada etapa de montaje satisface apoyos, orientación, engranes, retenciones y acceso. Antes de cerrar con un puente o cubierta se comprueba el subsistema que quedará oculto. La presencia de todas las piezas no demuestra que las relaciones sean correctas.\n\nLas verificaciones del modelo son lógicas y cinemáticas educativas. No sustituyen libertad física, par, lubricación, amplitud, reserva o marcha.',
    'Se monta una etapa del tren, se comprueban ambos apoyos y la relación con la etapa siguiente, y solo después se coloca el puente. Un pivote mal asentado genera un estado rechazado aunque el tornillo pueda aparecer alineado. Tras corregir, se guarda un punto de control.',
    'Monta guiado, repite con puntos de control y finaliza libre sobre una variante. En cada cierre responde qué comprobación dejará de ser accesible.',
    '- Verificas antes de cubrir.\n- Distingues presencia y asiento.\n- Guardas puntos de control explicables.\n- No declaras funcionamiento físico.',
    'Transfiere la lista de comprobaciones a un puente que soporte varias ruedas y prioriza el orden de inspección.'
  ),
  'block.miyota8215.diagnosis-project': expansion(
    '¿Qué dossier permite pasar de un síntoma a una hipótesis contrastada y defender el alcance de un proyecto final sobre 8215?',
    'El diagnóstico enlaza síntoma, subsistemas candidatos, hipótesis rivales, comprobación, resultado y revisión de confianza. El proyecto añade documentación, arquitectura, secuencia, inspección, restauración y transferencia al modelo conceptual.\n\nUna explicación puede quedar pendiente de revisión humana. La evidencia digital acredita razonamiento sobre una reconstrucción estructural y una secuencia educativa, no el servicio de una unidad. Los hallazgos adversos y desconocidos permanecen visibles.',
    'Para una indicación detenida se comparan fuente, tren y escape. Una comprobación localiza hasta dónde llega el cambio educativo; no se reemplaza ninguna pieza. El dossier conserva una hipótesis descartada, una apoyada y una prueba física pendiente. Después compara la misma función en el conceptual.',
    'Construye el árbol con ayuda. Repite cambiando el fallo. En el intento final entrega una secuencia independiente, restaura y presenta la conclusión a revisión sin ocultar incertidumbre.',
    '- Hipótesis rivales.\n- Prueba discriminante.\n- Evidencia y fuente enlazadas.\n- Transferencia y límites explícitos.',
    'Aplica el método a otro calibre del Atlas y explica qué parte del diagnóstico puede transferirse antes de consultar su documentación.'
  ),
})

const DEPTH_NOTES = {
  'block.mechanical.barrel': 'Lee el conjunto en dos diagramas distintos. En el diagrama de estado, registra descargado, parcialmente cargado y cargado sin asignar valores físicos. En el diagrama de potencia, marca entrada de cuerda, almacenamiento y salida. Esta separación evita dibujar una flecha continua que haga parecer que la energía entra y sale simultáneamente por la misma pieza. Comprueba también el contrafactual: si la salida está desacoplada, cambia la transmisión, no la identidad de la fuente.',
  'block.mechanical.gear-pair': 'Verifica el cálculo con una comprobación inversa: multiplica las vueltas de la conducida por sus dientes y compáralas con las vueltas de la conductora por los suyos, manteniendo el signo del sentido por separado. Si el resultado no coincide, has invertido el cociente o la entrada. Esta igualdad es una condición cinemática ideal; no demuestra que los perfiles puedan fabricarse ni que el contacto soporte una carga.',
  'block.mechanical.supports': 'Construye una tabla con cuatro estados: ambos pivotes asentados, solo el inferior, solo el superior y ninguno. Para cada estado predice eje, libertad e interacción con el puente. La comparación entrena a buscar la relación que falta en vez de “arreglar” la pieza visible. En el banco real, cualquier resistencia exige detenerse; el modelo no enseña a forzar ni a enderezar componentes.',
  'block.mechanical.escape-oscillator': 'Anota cada transición como estado anterior, condición de salida, transferencia de energía y estado posterior. Esta tabla obliga a distinguir una posición de una fase: una captura aislada puede parecer igual y pertenecer a momentos causales distintos. Después etiqueta qué observación necesitarías para hablar de marcha real. Sin medición temporal y física, la secuencia sigue siendo una explicación cinemática educativa.',
  'block.mechanical.motion-works': 'Comprueba la coherencia en cuatro puntos de la esfera, no solo al completar una vuelta. Tras quince, treinta, cuarenta y cinco y sesenta minutos, el horario debe haber recorrido fracciones compatibles. El ejercicio detecta relaciones que coinciden por casualidad al inicio o al final. Separa además la alineación visual de las agujas de su ajuste físico sobre los cañones, que no está representado.',
  'block.mechanical.final-project': 'Usa una matriz de cobertura: filas para subsistemas y columnas para entrada, salida, interfaz, apoyo, fuente, límite y evidencia. Una celda vacía señala una laguna real; no se rellena con una frase genérica. El dossier se considera listo para revisión cuando otra persona puede reconstruir el recorrido, reproducir la interrupción y distinguir sin preguntarte qué afirmaciones son conceptuales y cuáles proceden del 8215.',
  'block.mechanical.energy': 'Comprueba la cadena en dos direcciones. Desde el muelle hacia las agujas, pregunta qué entrada recibe y qué salida entrega cada subsistema. Desde una indicación detenida hacia la fuente, busca el primer resultado que todavía está presente y el primero que falta. El recorrido inverso no identifica automáticamente una causa, pero reduce el espacio de hipótesis. Mantén una columna separada para la condición temporal: el oscilador no suministra toda la energía del reloj, pero condiciona cuándo el escape libera la que llega del tren.',
  'block.mechanical.train': 'Antes de multiplicar, dibuja cada árbol como una unidad y cada engrane como una conexión entre árboles. Este esquema evita introducir un cociente ficticio entre la rueda y el piñón solidarios. Verifica la relación total con una vuelta de entrada simbólica y conserva el sentido en una columna distinta del valor absoluto. Si una rueda intermedia solo invierte el sentido, explica por qué no modifica la magnitud final. Finalmente separa tres veredictos: cálculo coherente, geometría potencialmente compatible y mecanismo físicamente validado; solo el primero pertenece a esta práctica.',
  'block.mechanical.escapement': 'Construye para cada fase una ficha con estado anterior, contacto activo, condición de salida, transferencia de energía y estado posterior. La ficha obliga a explicar por qué la rueda permanece retenida y qué cambia cuando se libera. No uses una captura aislada como prueba de fase: posiciones parecidas pueden corresponder a direcciones o contactos distintos. En una unidad real, cualquier valoración de seguridad, caída, penetración o calidad de superficie exige medidas, iluminación adecuada, documentación y competencia práctica; esta unidad solo prepara el vocabulario causal.',
  'block.mechanical.oscillator': 'Escribe siempre la conversión dimensional completa: hercios como ciclos por segundo, periodo en segundos por ciclo y alternancias por hora como medios ciclos acumulados durante 3600 segundos. Esta práctica permite detectar un factor dos o una unidad omitida. Después añade una tabla de afirmaciones disponibles y no disponibles. La fórmula ideal permite convertir frecuencia y periodo; la animación permite comparar estados declarados; ninguna de ambas basta para afirmar marcha, estabilidad, isocronismo, amplitud física o condición de una espiral concreta.',
  'block.mechanical.keyless': 'Para cada estado, registra cinco elementos: posición de la entrada, acción del usuario, relación de selección, cadena activa y resultado observable. Añade también una relación que deba permanecer inactiva; así se detectan estados contradictorios en vez de aceptar cualquier movimiento visible. El mapa funcional puede transferirse a otro calibre, pero las piezas, posiciones, muelles y restricciones no. Si una fuente solo nombra la función y no muestra la interfaz, conserva ese hueco: una transición plausible no se convierte en geometría documentada.',
  'block.mechanical.automatic-calendar': 'Mantén dos hojas separadas. En automático, sigue captación, transmisión y entrega al estado de carga; en calendario, sigue entrada periódica, avance y posicionamiento. Después compara interrupciones que producen síntomas distintos: una entrada automática ausente puede reducir la capacidad de carga sin afectar directamente el orden del calendario; una fecha mal asentada no demuestra un fallo de captación. La comparación enseña a aislar ramas funcionales. Para el 8215 u otro calibre, sustituye cada nodo conceptual por relaciones respaldadas y consulta el manual antes de formular cualquier restricción de corrección.',
  'block.quartz2035.workstation': 'La secuencia de trabajo queda dividida en preparar, observar, decidir, ejecutar, comprobar y restaurar. Cada transición tiene un estado de entrada y una condición de salida. Si el puesto no permite saber dónde estaba una instancia o qué documento autorizó la decisión, la acción no debe comenzar. En uso físico se añadirían protección adecuada, gestión de energía y condiciones ambientales; esta lección solo organiza el razonamiento y la trazabilidad digital.',
  'block.quartz2035.tools': 'Distingue tres niveles de decisión. La función responde qué tarea se pretende; la interfaz responde dónde y cómo contactaría; la autoridad responde si la operación está permitida por el modelo o por una fuente. Una herramienta puede superar dos niveles y fallar el tercero. Registra también la alternativa segura: consultar, cambiar de vista o detenerse. El sistema no debe empujar a elegir una opción cuando la evidencia correcta es insuficiente.',
  'block.quartz2035.observe': 'Usa frases atómicas. Cada fila del registro contiene un objeto, una propiedad visible y un estado; no mezcles varias causas en la misma observación. Después añade hipótesis en una columna separada y asigna una comprobación que podría refutar cada una. Esta disciplina permite volver al estado inicial y saber si una diferencia procede del movimiento, de la cámara o de una interpretación posterior.',
  'block.quartz2035.isa-memory': 'La confianza se actualiza, no se premia. Una predicción inicial alta que una fuente refuta debe terminar con confianza menor y una nota de corrección; eso es mejor aprendizaje que conservar el acierto aparente. El puente también debe permitir “no tengo experiencia previa”. Esa respuesta activa el mapa conceptual de cuarzo y nunca penaliza ni bloquea el recorrido.',
  'block.quartz2035.documentation': 'Construye una tabla de autoridad con columnas para pregunta, documento, localizador, afirmación, revisión y límite. Una misma página puede sostener identidad pero no una cota; una vista explosionada puede sostener una relación de orden sin revelar el contacto oculto. Lee también las notas y símbolos del documento: extraer un número sin condición o unidad puede ser más engañoso que dejarlo desconocido.',
  'block.quartz2035.anatomy': 'Para cada subsistema completa una ficha de cuatro líneas: entrada, transformación, salida e interrupción característica. El control no se reduce a “circuito”; debe incluir la referencia temporal declarada. El motor no se reduce a “bobina”; debe explicar la conversión hacia pasos mecánicos. El tren no se reduce a “ruedas”; debe enlazar el paso del rotor con la cadencia de la indicación dentro del alcance de la secuencia educativa.',
  'block.quartz2035.disassembly': 'Representa el orden como un grafo y no como una numeración fija. Dos pasos independientes pueden intercambiarse si no comparten acceso, sujeción ni riesgo, pero el registro debe conservar el orden realmente ejecutado. Si una pieza queda bloqueada por falta de autoridad, el plan debe rodear o detenerse; nunca se autoriza automáticamente porque la siguiente lección necesite verla.',
  'block.quartz2035.assembly': 'Añade una lista de “comprobar antes de ocultar”. Incluye presencia de la instancia correcta, orientación, apoyo, interfaz y estado de la bandeja. La comprobación se firma en el punto de control anterior a la cubierta. Si se descubre una incoherencia después, se vuelve al último estado válido y se conserva el intento fallido como evidencia de diagnóstico, no se reescribe la historia.',
  'block.quartz2035.diagnosis': 'Separa tres niveles de salida: descartado, apoyado y no resuelto. “Apoyado” no significa confirmado si el modelo didáctico no observa la magnitud decisiva. Para cada prueba escribe antes qué resultado espera cada hipótesis; hacerlo después favorece reinterpretar cualquier resultado como confirmación. La siguiente prueba se elige por la información que aporta, no por lo vistosa que resulte la animación.',
  'block.quartz2035.final-project': 'El índice del dossier debe permitir una auditoría en dos direcciones. Desde una conclusión se llega a evento, estado, fuente y límite. Desde una pieza se encuentran todas las acciones que la afectaron y su destino. Añade una página de discrepancias: datos ausentes, relaciones reconstruidas y comprobaciones físicas pendientes. Reconocer esas lagunas aumenta la calidad del proyecto; ocultarlas lo invalida.',
}

Object.assign(DEPTH_NOTES, {
  'block.miyota8215.identify': 'La ficha de identidad debe distinguir cuatro objetos que a menudo se mezclan: la definición del calibre, la variante comercial, la instancia física y el recurso digital. La definición reúne rasgos oficiales; la variante añade opciones; la instancia tiene marcas, historia y condición propias; el recurso digital es una reconstrucción versionada. Una etiqueta “8215” en pantalla identifica el recurso que se cargó, no autentica una fotografía externa. Registra por separado fabricante, calibre, familia, variante, fuente de identificación, nivel de confianza y rasgo que permitiría refutarla. Si solo se ve la arquitectura general, la conclusión apropiada puede ser “compatible con familia 82”, no “8215 confirmado”.',
  'block.miyota8215.documentation': 'Practica la lectura negativa: pregunta no solo qué dice un documento, sino qué no permite afirmar. Una lista de piezas puede confirmar referencia y pertenencia, pero no el material, la tolerancia ni el estado de una unidad. Un plano de interfaz puede fijar dimensiones exteriores sin describir el tren. Un manual puede declarar una restricción operativa sin ofrecer una secuencia completa de servicio. Al combinar fuentes, conserva el localizador de cada frase y evita crear una autoridad nueva por suma: dos documentos incompletos no convierten una estimación en dato oficial. Si una copia local se usa sin conexión, verifica su hash antes de citarla.',
  'block.miyota8215.architecture': 'Lee cada vista con una pregunta explícita. La cara de esfera ayuda a estudiar minutería, puesta y calendario; la cara de puentes muestra automático, puentes y accesos; una vista lateral aclara capas y apoyos. Ninguna vista aislada contiene toda la arquitectura. Construye un mapa de pertenencia a subsistemas y otro de relaciones de acceso: cubre, retiene y debe retirarse antes de. El primero explica función; el segundo prepara una secuencia. No los confundas: pertenecer a un subsistema no determina por sí solo cuándo se retira una pieza. Al restaurar, comprueba identidad, visibilidad, transparencia, separación de capas y cámara.',
  'block.miyota8215.automatic': 'Divide el análisis en captación, rectificación o transmisión y entrega a la carga, sin imponer que todas las arquitecturas resuelvan igual cada etapa. Para el 8215 solo se seleccionan relaciones respaldadas por la documentación o declaradas como reconstrucción. Anota el sentido que muestra el recurso como estado educativo y no como rendimiento medido. Compara además tres interrupciones: rotor inmóvil, interfaz automática desacoplada y barrilete ya sin aceptar más carga en un escenario conceptual. Pueden producir una ausencia de cambio parecida, pero pertenecen a causas y evidencias diferentes. La práctica debe enseñar a localizarlas, no a medirlas.',
  'block.miyota8215.winding-setting': 'Crea una tabla de estados con posición de corona, acción de entrada, relaciones activas, salida esperada y relaciones que deben permanecer inactivas. Una ruta válida de puesta no debería describirse solo porque las agujas se mueven: debe explicar cómo se selecciona la minutería y por qué la cuerda no es la salida principal de ese estado. Del mismo modo, una ruta de cuerda no se acepta porque una rueda gire cerca del barrilete. El modelo didáctico comprueba dependencias discretas; el tacto de los saltos, el esfuerzo de la corona y la condición de los dientes necesitan observación física.',
  'block.miyota8215.calendar': 'Representa el calendario como una pequeña máquina de estados. Define reposo asentado, entrada en cambio, avance y nuevo asentamiento. La corrección añade una entrada que debe analizarse contra esos estados; no la dibujes como una flecha libre hacia el disco. Si el manual declara restricciones, enlázalas a su referencia y revisión. Si no las declara el material curado, conserva el conflicto como desconocido. Distingue también “el disco se mueve” de “la fecha queda legible y posicionada”: el saltador y su muelle participan en el segundo resultado. La simulación no calcula la energía necesaria para vencer ese posicionamiento.',
  'block.miyota8215.barrel-energy': 'Usa dos recorridos complementarios. El recorrido de carga parte de corona o automático y termina en el estado del muelle. El recorrido de marcha parte del almacenamiento y termina en el primer engrane del tren. Mantenerlos separados ayuda a diagnosticar por qué una entrada puede funcionar mientras la otra no, o por qué existe carga sin salida. El modelo interno del muelle puede estar normalizado; por eso la forma visible de la espiral no es evidencia sobre vueltas, espesor ni curva de par. Las prestaciones nominales se consultan en la ficha o especificación y nunca se derivan de la animación.',
  'block.miyota8215.train': 'Construye una tabla de etapas. Para cada árbol anota rueda solidaria, piñón solidario, pieza que lo impulsa, pieza impulsada y apoyos. Esta tabla detecta saltos falsos que una vista superior puede ocultar. Después recorre el grafo en sentido inverso: si no puedes regresar desde escape hasta barrilete por las mismas interfaces, falta una relación o has confundido dos instancias. Los conteos de dientes y relaciones exactas solo se usan cuando la fuente los proporciona o cuando el ejercicio se declara conceptual; la reconstrucción estructural no autoriza a contarlos desde siluetas normalizadas.',
  'block.miyota8215.escapement-oscillator': 'Prepara dos columnas simultáneas para cada fase. En energía: quién entrega, quién recibe y dónde se produce el impulso. En temporización: qué posición del oscilador permite desbloquear y cuándo vuelve a producirse un bloqueo. Esta doble lectura evita llamar “regulador” a cualquier pieza que se mueve a intervalos. Usa la vista lenta para ordenar, luego los estados discretos para verificar con movimiento reducido. Cualquier afirmación sobre amplitud, frecuencia medida, error entre alternancias o condición de las superficies exige datos que esta escena no genera. La respuesta experta puede ser una lista explícita de mediciones pendientes.',
  'block.miyota8215.plan-disassembly': 'Convierte el grafo en un documento de decisión con columnas para estado previo, objetivo, dependencia satisfecha, herramienta, sujeción, destino, inspección y condición de parada. Un paso sin condición de salida no permite saber si el siguiente es seguro. Un paso sin destino rompe la trazabilidad. Incluye rutas alternativas solo cuando el grafo declare independencia; no las inventes para acortar. Marca también las piezas que el modelo no permite retirar. Esas fronteras no son obstáculos de interfaz: representan ausencia de autoridad o modelo suficiente y deben permanecer visibles en el plan final.',
  'block.miyota8215.guided-disassembly': 'Observa cómo cambia la función de la guía. Al principio nombra objeto y razón. Después conserva la razón y oculta el objeto. Finalmente muestra solo el punto de control. Esta retirada progresiva convierte la demostración en aprendizaje; una animación que siempre revela el siguiente paso solo entrena seguimiento. Después de cada retirada, responde tres preguntas: qué acceso se obtuvo, qué piezas siguen retenidas y qué debe inspeccionarse antes de continuar. El registro de errores debe señalar la dependencia concreta, no limitarse a “acción incorrecta”. El reintento empieza desde un estado restaurado equivalente.',
  'block.miyota8215.assisted-free-disassembly': 'Define antes qué ayudas existen: etiquetas, lista de dependencias, aviso preventivo, pista causal y solución. El modo asistido puede conservar las dos primeras y retrasar el aviso; el libre elimina todas salvo accesibilidad y límites de seguridad. Una adaptación de teclado o texto nunca cuenta como pista. Para considerar independiente el intento, cambia una condición inicial o el tramo solicitado; repetir exactamente la demostración permite memoria motora de interfaz. La revisión valora orden, justificación, gestión de instancias y restauración, y mantiene fuera de alcance la manipulación física.',
  'block.miyota8215.inspection': 'La ficha de inspección empieza por la pregunta y el método. “Buscar desgaste” es demasiado amplio; especifica superficie, iluminación, orientación y criterio descriptivo, pero no inventes un umbral. Una fotografía debe conservar escala si se usa para medir y debe distinguirse de una imagen ilustrativa. Una observación sobre una unidad no se generaliza a todas las unidades 8215. En el modelo didáctico, los defectos se nombran simbólicos y su propósito es producir una cadena causal controlada. Relaciona cada hallazgo con una siguiente acción: aceptar dentro del alcance, documentar, medir, comparar o solicitar revisión.',
  'block.miyota8215.assembly-verification': 'Planifica puntos de control antes de empezar. Tras montar el tren se comprueban apoyos y cadena; antes de cerrar una capa se verifican interfaces que quedarán ocultas; tras añadir calendario o automático se confirma que no se perdió el estado anterior. El punto de control guarda más que una imagen: identidades, bandejas, dependencias, orientación y resultados. Si una verificación falla, vuelve al último estado válido y explica qué cambió. El software puede decidir coherencia declarativa, pero la aceptación física requiere libertad, medidas, lubricación, ajuste y pruebas de marcha fuera del modelo.',
  'block.miyota8215.diagnosis-project': 'Estructura la conclusión en cinco niveles: síntoma observado, frontera funcional afectada, hipótesis, resultado de comprobación y confianza revisada. Añade una tabla de alternativas no descartadas y otra de pruebas pendientes. El proyecto no mejora por elegir una causa única; mejora cuando cada descarte es reproducible y cada incertidumbre está localizada. La transferencia al conceptual sirve para comprobar el razonamiento causal, mientras que la transferencia a otro calibre obliga a reiniciar piezas, datos y fuentes. Una revisión humana evalúa la calidad de la defensa, no certifica automáticamente una intervención física.',
})

const DEPTH_SUPPLEMENTS = {
  'block.quartz2035.isa-memory': 'Trata la experiencia previa como una hipótesis de transferencia. Escribe qué rasgo del ISA recuerdas, qué función crees equivalente en el 2035 y qué documento podría confirmar o negar la equivalencia. Si solo coincide la función, conserva separadas pieza, geometría y procedimiento. Al finalizar, revisa la confianza por la calidad de la evidencia obtenida, no por haber acertado una etiqueta.',
  'block.quartz2035.diagnosis': 'Construye una matriz con una fila por hipótesis y columnas para predicción, observación disponible, resultado y decisión provisional. Una prueba es útil cuando produce resultados distintos entre filas. Si dos hipótesis siguen prediciendo lo mismo, no fuerces un cierre: busca otra frontera funcional o declara que el modelo no observa la magnitud necesaria. El informe debe mostrar también qué prueba no se realizó y por qué.',
  'block.quartz2035.final-project': 'Entrega el dossier a una revisión ciega: otra persona debe poder reconstruir el estado inicial, repetir una decisión y localizar la fuente de cada afirmación sin pedir contexto oral. Comprueba además cobertura por subsistema: energía, control temporal, conversión electromecánica, transmisión e indicación. Una sección extensa no compensa una interfaz ausente; el cierre depende de trazabilidad y límites, no de volumen.',
  'block.miyota8215.train': 'Separa el mapa funcional del mapa físico. El primero puede afirmar que una etapa transmite hacia la siguiente; el segundo necesita identidad de rueda y piñón, eje común, apoyo y contacto respaldado. Para cada salto del recorrido escribe qué fuente o relación lo autoriza. Si falta un apoyo o una interfaz, conserva el hueco y formula la observación que lo resolvería antes de calcular una relación.',
  'block.miyota8215.guided-disassembly': 'La retirada de ayuda debe conservar la explicación causal. En un segundo intento cambia el tramo de partida o presenta primero una dependencia intermedia; así distingues comprensión de recuerdo del orden de botones. Registra qué pista fue necesaria y exige después una justificación sin ella. Si el alumno completa la secuencia pero no puede explicar acceso, retención y comprobación, el resultado sigue siendo práctica guiada.',
  'block.miyota8215.assisted-free-disassembly': 'Compara los intentos por calidad de decisión, no por tiempo. Anota en qué paso apareció cada ayuda, qué dependencia aclaró y si el reintento independiente resolvió una variante. El modo libre no elimina avisos de seguridad, accesibilidad ni restauración; elimina información que revelaría la solución. Una respuesta rápida tras ver la secuencia completa no prueba transferencia a otro tramo ni a otro calibre.',
  'block.miyota8215.inspection': 'Redacta cada observación con objeto, zona, condición de iluminación, orientación y descripción neutral. Después, en otra columna, propone interpretaciones y la medida que las distinguiría. Evita palabras como «bien», «mal» o «gastado» sin criterio observable. Si comparas fotografías, conserva escala, ángulo y estado; una diferencia de imagen puede proceder del encuadre y no de la pieza.',
  'block.miyota8215.assembly-verification': 'Diseña cada punto de control con pregunta, estado esperado, observación, resultado y acción si falla. Antes de cubrir una interfaz, comprueba también que la bandeja no conserva una pieza necesaria y que los tornillos mantienen su identidad. La restauración digital permite repetir la lógica, pero no convierte un montaje físico fallido en reversible. Por eso el plan real necesita condiciones de parada y revisión relojera.',
  'block.miyota8215.diagnosis-project': 'Para cada descarte, incluye una predicción escrita antes de la prueba y el resultado que habría mantenido viva la hipótesis. Esta disciplina impide reinterpretar cualquier observación como confirmación. La conclusión final debe permitir tres salidas: hipótesis apoyada dentro del alcance, alternativas todavía abiertas o diagnóstico bloqueado por falta de evidencia. Solo la primera puede recomendar una comprobación siguiente, nunca una reparación automática.',
}

function knowledgeCheck(question, correct, wrongA, wrongB, rationale, observe, transfer) {
  return { question, correct, wrongA, wrongB, rationale, observe, transfer }
}

const KNOWLEDGE_CHECKS = {
  // Fundamentos mecánicos
  'activity.mechanical.classify-energy-functions': knowledgeCheck('¿Qué función cumple el tren cuando recibe movimiento del barrilete y lo entrega hacia el escape?', 'Transmisión: transporta y adapta el movimiento entre la fuente y la regulación', 'Fuente: crea la energía que utiliza el muelle real', 'Indicación: su función principal es mostrar directamente la hora', 'El tren no crea energía ni muestra por sí solo la hora; enlaza etapas mediante engranes.', 'Sigue un engrane de entrada y otro de salida del tren.', 'Clasifica el tren de otro movimiento por sus relaciones, no por su posición.'),
  'activity.mechanical.interrupt-energy-chain': knowledgeCheck('Si el muelle conserva carga pero se desacopla el tren, ¿qué predicción distingue esa interrupción de una fuente descargada?', 'La indicación se detiene aunque el estado de carga puede permanecer', 'El muelle se descarga instantáneamente porque toda interrupción elimina energía', 'Las agujas continúan porque el tren no participa en la transmisión', 'Una interrupción aguas abajo puede detener la salida sin borrar el estado de la fuente.', 'Compara carga, giro del tren y salida antes y después del desacoplamiento.', 'Predice el efecto de interrumpir ahora el escape en vez del tren.'),
  'activity.mechanical.load-unload-barrel': knowledgeCheck('Durante la descarga del barrilete, ¿dónde estaba almacenada la energía y por qué interfaz sale hacia el tren?', 'En el muelle real; el conjunto la entrega por el dentado del barrilete', 'En los dientes del tren; el barrilete solo cambia el sentido', 'En el puente; los apoyos empujan la primera rueda', 'El muelle almacena energía y el barrilete la transmite; estructura y tren no son la fuente.', 'Aísla muelle, árbol, tambor y primer engrane del tren.', 'Compara carga manual y automática como entradas al mismo almacenamiento.'),
  'activity.mechanical.identify-barrel-parts': knowledgeCheck('¿Qué descripción distingue correctamente árbol, muelle y tambor del barrilete?', 'El árbol interviene en la carga, el muelle almacena energía y el tambor ofrece la salida dentada', 'El tambor regula el tiempo, el árbol indica minutos y el muelle sostiene los puentes', 'Las tres piezas son intercambiables porque forman un único subsistema', 'Un subsistema puede tener una función global y piezas con papeles distintos.', 'Selecciona cada pieza y nombra su entrada o salida.', 'Identifica los mismos papeles en un barrilete documentado sin copiar geometría.'),
  'activity.mechanical.predict-pair-direction': knowledgeCheck('Dos engranes exteriores contactan directamente. Si la conductora gira en sentido horario, ¿qué hará la conducida?', 'Girará en sentido antihorario', 'Girará en el mismo sentido', 'No puede deducirse aunque el engrane esté declarado', 'Cada contacto exterior invierte el sentido en la cinemática ideal.', 'Marca el punto de contacto y sigue el desplazamiento de ambos dientes.', 'Añade una rueda intermedia y vuelve a predecir el sentido final.'),
  'activity.mechanical.calculate-pair-ratio': knowledgeCheck('Una conductora de 12 dientes mueve una conducida de 36. ¿Cuántas vueltas da la conducida por cada vuelta de la conductora?', 'Un tercio de vuelta, en sentido contrario', 'Tres vueltas, en el mismo sentido', 'Treinta y seis vueltas, porque se usa solo el número de la conducida', 'Para un par exterior ideal, n conducida/n conductora = Z conductora/Z conducida.', 'Anota quién conduce, los dos conteos de dientes y el sentido.', 'Invierte entrada y salida y recalcula el cociente.'),
  'activity.mechanical.detect-impossible-mesh': knowledgeCheck('¿Qué señal obliga a rechazar un engrane antes de calcular su relación?', 'La geometría declarada no permite contacto compatible entre los dientes', 'Las ruedas tienen colores distintos', 'La conducida tiene más dientes que la conductora', 'Una relación numérica no valida que ejes, paso y distancia permitan engranar.', 'Comprueba ejes, distancia conceptual y estado de contacto.', 'Busca otra configuración con igual relación numérica pero geometría válida.'),
  'activity.mechanical.build-train': knowledgeCheck('¿Qué cadena describe correctamente una etapa compuesta del tren?', 'Una rueda engrana con un piñón; su árbol comparte giro con otra rueda que continúa la cadena', 'Todas las ruedas próximas transmiten movimiento aunque no engranen', 'Cada puente añade una relación de velocidad entre dos ruedas', 'El tren alterna contactos dentados y elementos solidarios sobre un árbol.', 'Recorre un engrane y después el árbol antes de saltar a la siguiente etapa.', 'Reconstruye el mismo recorrido desde la última etapa hacia la primera.'),
  'activity.mechanical.calculate-total-ratio': knowledgeCheck('¿Cómo se obtiene la relación ideal total de varias etapas engranadas?', 'Multiplicando las relaciones orientadas de cada par activo', 'Sumando todos los dientes visibles sin distinguir entrada y salida', 'Usando solo la primera y la última rueda aunque haya árboles compuestos', 'Cada etapa transforma la velocidad recibida; sus cocientes se multiplican.', 'Escribe una fracción por cada engrane y simplifica al final.', 'Comprueba la relación con una etapa intermedia que solo cambia el sentido.'),
  'activity.mechanical.interrupt-train': knowledgeCheck('Si se retira una etapa intermedia del tren, ¿qué elemento deja primero de recibir movimiento?', 'La primera etapa aguas abajo del engrane interrumpido', 'El muelle real, aunque esté antes de la interrupción', 'Solo las agujas, mientras el resto aguas abajo sigue girando', 'Una cadena se rompe en la interfaz; el efecto se propaga desde allí hacia la salida.', 'Localiza el último nodo que aún recibe entrada y el primero que no.', 'Repite la interrupción en otra etapa y compara el alcance.'),
  'activity.mechanical.identify-pivots-supports': knowledgeCheck('¿Qué relación permite que el árbol de una rueda conserve un eje de giro estable?', 'Sus pivotes quedan asentados en apoyos alineados de platina y puente', 'Los dientes se apoyan sobre el puente durante cada vuelta', 'Un único tornillo atraviesa siempre el centro de la rueda', 'Los apoyos definen el eje; el engrane no sustituye a pivotes y rubíes.', 'Localiza ambos extremos del árbol y sus apoyos.', 'Aplica el criterio a un puente que soporte varias ruedas.'),
  'activity.mechanical.detect-mis-seated-wheel': knowledgeCheck('¿Qué observación distingue una rueda mal asentada de una rueda simplemente parada?', 'Uno de sus pivotes no está alojado y el árbol queda inclinado o sin libertad', 'La rueda no tiene el mismo color que las demás', 'El barrilete está descargado, aunque ambos pivotes estén correctos', 'Una rueda puede estar parada por falta de energía; el mal asiento se diagnostica en sus apoyos.', 'Compara posición de ambos pivotes y libertad antes de cerrar el puente.', 'Propón una comprobación física que el modelo no puede realizar.'),
  'activity.mechanical.order-escapement-phases': knowledgeCheck('¿Qué orden conserva un ciclo simplificado del escape de áncora?', 'Bloqueo → desbloqueo → impulso → caída y nuevo bloqueo', 'Impulso → carga del muelle → indicación → bloqueo', 'Caída → cuerda manual → desbloqueo → calendario', 'El escape alterna retención y liberación coordinadas con el oscilador.', 'Pausa en cada contacto entre rueda de escape y áncora.', 'Empieza desde impulso y ordena las tres fases siguientes.'),
  'activity.mechanical.identify-lock-impulse-drop': knowledgeCheck('¿Qué distingue el impulso del bloqueo en el escape?', 'En el impulso se transfiere energía al oscilador; en el bloqueo se retiene la rueda de escape', 'En el impulso se detiene el tren; en el bloqueo se cargan las agujas', 'Son dos nombres para la misma posición estática', 'Bloquear regula la liberación; impulsar ayuda a sostener la oscilación.', 'Observa qué pieza entrega energía y si la rueda de escape puede avanzar.', 'Clasifica una fase no etiquetada por su contacto y resultado.'),
  'activity.mechanical.distinguish-frequency-amplitude': knowledgeCheck('¿Cuál es la diferencia correcta entre frecuencia y amplitud del volante?', 'Frecuencia cuenta ciclos por tiempo; amplitud describe el arco de oscilación', 'Frecuencia es el tamaño del volante; amplitud es el número de dientes', 'Son dos unidades para la reserva de marcha', 'Cambiar una no equivale automáticamente a cambiar la otra.', 'Compara número de ciclos y arco en dos estados separados.', 'Explica qué medición real sería necesaria para cuantificarlas.'),
  'activity.mechanical.configure-oscillator': knowledgeCheck('¿Qué ajuste conceptual cambia la frecuencia sin usar la amplitud como si fuera la misma magnitud?', 'Modificar el parámetro temporal declarado y comprobar ciclos por intervalo', 'Aumentar solo el tamaño visual del arco y llamarlo más hercios', 'Girar más deprisa todas las ruedas del tren sin observar el oscilador', 'La frecuencia se comprueba contando ciclos; la amplitud se observa como arco.', 'Activa un cambio a la vez y compara la métrica correspondiente.', 'Crea dos estados con igual frecuencia y distinta amplitud.'),
  'activity.mechanical.relate-escape-oscillator': knowledgeCheck('¿Qué relación de doble sentido une escape y oscilador?', 'El escape entrega impulsos; el oscilador gobierna cuándo puede liberarse el siguiente diente', 'El volante almacena toda la energía y el escape solo muestra la hora', 'Ambos giran libremente sin contacto ni realimentación', 'El escape impulsa al oscilador y la temporización de este condiciona el siguiente desbloqueo.', 'Sigue por separado el impulso recibido y la condición temporal del escape.', 'Compara esta realimentación con el control de un cuarzo.'),
  'activity.mechanical.predict-escapement-interruption': knowledgeCheck('Si se interrumpe el impulso entre áncora y volante, ¿qué parte de la cadena deja de sostenerse?', 'El oscilador deja de recibir energía aunque el tren pueda conservar energía aguas arriba', 'El muelle se convierte en indicación y las agujas aceleran', 'La frecuencia queda validada porque la animación ordena la secuencia', 'Romper el impulso separa regulación y suministro sin demostrar el decaimiento físico.', 'Localiza el último contacto de impulso antes de la interrupción.', 'Interrumpe ahora el bloqueo y compara el síntoma educativo.'),
  'activity.mechanical.build-motion-works': knowledgeCheck('¿Qué relación debe conservar una minutería de doce horas?', 'Una vuelta del minutero corresponde a un doceavo de vuelta del horario', 'Minutero y horario completan siempre una vuelta juntos', 'El horario debe girar doce veces por cada vuelta del minutero', 'La minutería reduce el movimiento para producir indicaciones coherentes.', 'Parte de una hora exacta y simula una vuelta del minutero.', 'Adapta la relación a una indicación de 24 horas.'),
  'activity.mechanical.set-indication': knowledgeCheck('¿Qué permite mover las agujas al poner en hora sin redefinir toda la cadena de marcha?', 'Una ruta de puesta actúa sobre la minutería mediante una interfaz de selección y fricción declarada', 'El puente gira con la corona y arrastra todas las ruedas', 'Se descarga siempre el muelle antes de mover una aguja', 'La puesta usa una entrada distinta y una unión que admite ajuste sin perder el enlace normal con la marcha.', 'Compara la ruta activa en marcha y en puesta.', 'Explica qué valor de fricción seguiría necesitando medición real.'),
  'activity.mechanical.reconstruct-crown-states': knowledgeCheck('¿Cómo se distinguen los estados de la corona y la tija?', 'Por la posición y las relaciones que quedan engranadas hacia cuerda o puesta', 'Por el color que adopta la corona en la interfaz', 'Por la velocidad del volante, sin observar el sistema de puesta', 'Cada estado selecciona una ruta funcional distinta.', 'Marca entrada, piezas activas y salida de cada posición.', 'Reconstruye un estado desde el resultado deseado, sin etiquetas.'),
  'activity.mechanical.operate-winding-setting': knowledgeCheck('¿Qué diferencia funcional separa dar cuerda de poner en hora?', 'Dar cuerda cambia el estado de la fuente; poner en hora cambia la indicación mediante la minutería', 'Ambas acciones solo giran las agujas y nunca afectan al barrilete', 'Dar cuerda regula la frecuencia y poner en hora carga el muelle', 'La misma entrada de usuario puede seleccionar cadenas diferentes.', 'Sigue la corona hasta la primera bifurcación de rutas.', 'Compara con el sistema de puesta documentado del 8215.'),
  'activity.mechanical.follow-automatic-energy': knowledgeCheck('¿Qué cadena describe la carga automática de forma funcional?', 'Movimiento del rotor → transmisión automática → cambio del estado de carga del barrilete', 'Rotor → esfera → agujas → muelle espiral', 'Calendario → escape → rotor → puente', 'El rotor es una entrada de energía al sistema de carga, no la fuente temporal ni la indicación.', 'Sigue un enlace cada vez desde el rotor hacia el barrilete.', 'Compara el punto de convergencia con la cuerda manual.'),
  'activity.mechanical.explain-date-change': knowledgeCheck('¿Qué secuencia mínima explica un cambio de fecha?', 'Entrada diaria → avance del disco → asentamiento por el saltador', 'El disco gira libremente todo el día sin posicionamiento', 'El volante empuja directamente cada número de la fecha', 'El calendario transforma una entrada periódica en un salto y un estado estable.', 'Observa conductor, disco y elemento de posicionamiento.', 'Distingue cambio normal y corrección como dos entradas.'),
  'activity.mechanical.introduce-fault': knowledgeCheck('¿Cómo se introduce un fallo útil para aprender sin convertirlo en una avería real?', 'Se altera una relación declarada, se predice el efecto y se conserva el estado inicial restaurable', 'Se cambia varias piezas a la vez hasta que la salida se detiene', 'Se llama desgaste a cualquier color distinto del modelo', 'Un fallo controlado debe aislar una variable y producir una predicción comprobable.', 'Elige una sola interfaz y registra antes el estado base.', 'Aplica otro fallo que produzca un síntoma parecido.'),
  'activity.mechanical.formulate-hypothesis': knowledgeCheck('¿Qué hace que una hipótesis sea comprobable?', 'Predice una observación que podría diferenciarla de otra explicación', 'Repite el síntoma con palabras más técnicas', 'Afirma una causa sin indicar qué resultado la refutaría', 'Una hipótesis útil enlaza causa propuesta, resultado esperado y prueba discriminante.', 'Escribe dos causas rivales y un resultado distinto para cada una.', 'Transfiere el árbol a un síntoma del 8215.'),
  'activity.mechanical.build-final-project': knowledgeCheck('¿Qué evidencia integra realmente el proyecto mecánico final?', 'Cadena independiente, predicción de interrupción, restauración y explicación con límites', 'Una captura del modelo completo sin relaciones ni fuentes', 'La lista de nombres memorizada en el mismo orden del ejemplo', 'Integrar exige construir, explicar, comprobar y delimitar, no solo mostrar piezas.', 'Revisa si cada subsistema tiene entrada, relación y salida.', 'Defiende la misma cadena sobre otro movimiento sin copiar geometría.'),
  'activity.mechanical.compare-with-8215': knowledgeCheck('¿Qué comparación entre el modelo conceptual y el 8215 es válida?', 'Relacionar funciones equivalentes y separar geometría, identidad y autoridad propias', 'Afirmar que toda pieza conceptual tiene idéntica forma y posición en el 8215', 'Usar las proporciones del modelo conceptual como dimensiones del calibre', 'La transferencia funcional no convierte una geometría conceptual en documentación del 8215.', 'Compara una función y cita qué fuente respalda el caso real.', 'Aplica el criterio a otro calibre mecánico del Atlas.'),
  'activity.mechanical.document-limitations': knowledgeCheck('¿Qué limitación debe acompañar a una conclusión obtenida con el modelo mecánico conceptual?', 'Explica relaciones y una secuencia cinemática educativa, pero no valida geometría fabricable ni física real', 'Demuestra automáticamente tolerancias, lubricación y resistencia al choque', 'Sustituye cualquier documento oficial porque el modelo se mueve', 'La ficha técnica de fidelidad limita qué clase de afirmación puede sostener la evidencia.', 'Relaciona cada conclusión con el aspecto que sí representa el modelo.', 'Escribe qué prueba adicional necesitaría una decisión de diseño.'),
}

Object.assign(KNOWLEDGE_CHECKS, {
  // Banco y MIYOTA 2035
  'activity.quartz2035.prepare-workbench': knowledgeCheck('¿Qué preparación conserva mejor la identidad y el estado antes de observar el movimiento?', 'Separar movimiento, herramientas, bandeja y documentación, y registrar la instancia antes de actuar', 'Colocar todas las piezas y herramientas juntas para reducir desplazamientos', 'Empezar a desmontar y reconstruir el estado inicial de memoria al final', 'Un banco preparado reduce ambigüedad y hace reproducible cada cambio.', 'Comprueba instancia, orientación, zonas y estado inicial guardado.', 'Adapta la distribución a un movimiento mecánico sin perder trazabilidad.'),
  'activity.quartz2035.detect-unsafe-conditions': knowledgeCheck('¿Qué condición obliga a detener la práctica antes de una acción?', 'La pieza o la herramienta no tienen identidad, autoridad o destino de bandeja verificables', 'El modelo está ampliado y ocupa más espacio en pantalla', 'La vista utiliza un color distinto al de la lección anterior', 'Una acción sin objeto, herramienta o estado controlado no es recuperable ni explicable.', 'Busca primero la ausencia que impediría restaurar o justificar.', 'Detecta una condición equivalente en una práctica física y explica la diferencia de riesgo.'),
  'activity.quartz2035.select-tools': knowledgeCheck('¿Cuál es el criterio correcto para seleccionar una herramienta?', 'Que su rol y su interfaz correspondan a la pieza y a la operación autorizada', 'Que sea la herramienta visualmente más grande disponible', 'Que se haya usado antes en otro calibre, aunque la interfaz cambie', 'La herramienta se elige por operación e interfaz, no por parecido o costumbre.', 'Nombra pieza, operación e interfaz antes de elegir.', 'Transfiere el criterio a un instrumento de medición.'),
  'activity.quartz2035.reject-wrong-tool': knowledgeCheck('¿Por qué debe rechazarse una herramienta que parece caber pero no coincide con la interfaz declarada?', 'Porque la proximidad visual no garantiza contacto correcto ni una operación autorizada', 'Porque toda herramienta debe tener el mismo color que la pieza', 'Porque una herramienta solo puede utilizarse una vez por sesión', 'Encajar visualmente no prueba compatibilidad ni seguridad.', 'Compara rol, acceso e interfaz, no tamaño aparente.', 'Explica qué comprobación física seguiría pendiente incluso con la herramienta correcta.'),
  'activity.quartz2035.identify-movement-zones': knowledgeCheck('¿Qué organización permite distinguir observación, manipulación, documentación y almacenamiento temporal?', 'Zonas separadas para movimiento, inspección, documentos, herramientas y bandeja', 'Una única zona donde cualquier objeto puede cambiar de función', 'Ocultar la documentación para que no condicione la memoria', 'Las zonas hacen visible el contexto de cada acción y evitan estados ambiguos.', 'Recorre las zonas en el orden de una operación completa.', 'Diseña una distribución equivalente para una mesa más pequeña.'),
  'activity.quartz2035.record-initial-condition': knowledgeCheck('¿Qué registro inicial es una observación y no un diagnóstico prematuro?', '“La instancia y esta pieza aparecen en esta orientación y estado visible”', '“El movimiento está averiado porque no veo girar las agujas”', '“La bobina está defectuosa porque aparece así en la reconstrucción estructural”', 'El estado inicial describe identidad y aspecto; la causa requiere una prueba.', 'Separa lo visible, lo inferido y lo desconocido.', 'Repite con una fotografía real y añade el límite de la imagen.'),
  'activity.quartz2035.create-isa-confidence-map': knowledgeCheck('¿Cómo debe registrarse un recuerdo del ISA 8172 antes de compararlo con 2035?', 'Como hipótesis con confianza y comprobación pendiente en fuentes del 2035', 'Como dato oficial del 2035 porque ambos son de cuarzo', 'Como dimensión aproximada obtenida de la memoria', 'La experiencia previa orienta preguntas, pero no hereda autoridad entre calibres.', 'Etiqueta recuerdo, equivalencia funcional y confirmación por separado.', 'Aplica el mapa al pasar de 2035 a otro cuarzo desconocido.'),
  'activity.quartz2035.compare-isa-functionally': knowledgeCheck('¿Qué comparación entre ISA 8172 y MIYOTA 2035 es válida antes de medir piezas?', 'Comparar funciones y cadenas, manteniendo identidades y geometrías específicas separadas', 'Copiar posiciones y referencias porque ambos tienen pila', 'Usar la escala de una fotografía de ISA para dimensionar el 2035', 'Una equivalencia funcional no prueba una solución constructiva idéntica.', 'Elige una función y cita una fuente para cada calibre.', 'Compara ahora 2035 con el cuarzo conceptual.'),
  'activity.quartz2035.read-drawing': knowledgeCheck('¿Qué procedimiento permite extraer una cota oficial de un plano?', 'Identificar vista, cota, unidad, referencia y revisión, y registrar el localizador', 'Medir en pantalla la proporción del dibujo sin comprobar escala', 'Tomar una dimensión de otro calibre de la misma familia', 'Una cota oficial pertenece a un documento y una revisión concretos.', 'Localiza la vista y copia también unidad y revisión.', 'Busca el mismo tipo de interfaz en el plano 8215 sin trasladar el valor.'),
  'activity.quartz2035.associate-reference-part': knowledgeCheck('¿Qué enlaza de forma fiable una referencia oficial con una pieza del 2035?', 'La identidad del despiece o documento aplicable, conservando la revisión', 'El color de la pieza en la reconstrucción educativa', 'La proximidad a otra pieza con nombre conocido', 'La asociación exige una fuente de identidad; el modelo solo la presenta.', 'Consulta referencia, nombre y posición documental juntos.', 'Detecta una pieza del modelo cuya geometría siga siendo estimada aunque la identidad sea oficial.'),
  'activity.quartz2035.classify-subsystems': knowledgeCheck('En la cadena del 2035, ¿qué subsistema transforma la señal eléctrica en pasos mecánicos?', 'La bobina y el rotor paso a paso dentro de la etapa motriz', 'La pila por sí sola, sin control ni motor', 'La esfera y las agujas como fuente de movimiento', 'El motor paso a paso enlaza el control eléctrico con la transmisión mecánica.', 'Sigue la salida del circuito hasta la primera rueda del tren.', 'Compara esta conversión con la salida del barrilete mecánico.'),
  'activity.quartz2035.follow-functional-chain': knowledgeCheck('¿Qué orden funcional recorre el 2035 desde la fuente hasta la indicación?', 'Pila → control y referencia → bobina y rotor → tren → minutería e indicación', 'Agujas → tren → pila → bobina → control', 'Pila → esfera → puente → calendario → rotor', 'La cadena pasa de energía eléctrica a pasos mecánicos antes de llegar a las agujas.', 'Marca una entrada y una salida en cada etapa.', 'Interrumpe otra etapa y predice el primer efecto aguas abajo.'),
  'activity.quartz2035.order-disassembly-steps': knowledgeCheck('¿Qué regla debe gobernar el orden educativo de desmontaje?', 'Retirar primero las sujeciones o cubiertas que bloquean el acceso según el grafo de dependencias', 'Ordenar solo por tamaño, de la pieza mayor a la menor', 'Invertir el orden alfabético de las referencias', 'Las relaciones “cubre”, “retiene” y “está fijado por” justifican el orden.', 'Señala qué dependencia libera cada paso.', 'Reconstruye el orden de otro subsistema sin copiar la lista.'),
  'activity.quartz2035.disassemble-to-tray': knowledgeCheck('¿Qué información debe acompañar a una pieza retirada en la bandeja?', 'Identidad de instancia, orientación, origen, paso y sujeción asociada', 'Solo su color, porque la posición original queda en la memoria', 'Un nombre genérico aunque existan varias instancias iguales', 'La bandeja forma parte de la trazabilidad y evita intercambiar instancias.', 'Sigue la identidad desde el ensamblaje hasta la celda de bandeja.', 'Gestiona dos tornillos equivalentes sin perder su origen.'),
  'activity.quartz2035.assemble-guided': knowledgeCheck('¿Qué debe comprobarse antes de cubrir una etapa ya montada?', 'Apoyos, orientación, interfaz y libertad simbólica declarada del subsistema', 'Que todas las piezas visibles tengan el mismo brillo', 'Solo que la cubierta pueda seleccionarse', 'Una cubierta puede ocultar un error; la comprobación debe preceder al cierre.', 'Revisa el último estado que quedará inaccesible.', 'Repite el tramo con la guía reducida a puntos de control.'),
  'activity.quartz2035.assemble-assisted-free': knowledgeCheck('¿Qué convierte el segundo montaje en una práctica más independiente?', 'Resolver una variante restaurada con menos señales y justificar cada dependencia', 'Repetir exactamente los clics mientras la solución permanece visible', 'Ocultar el feedback pero conservar una pista con la respuesta', 'La ayuda se retira y el razonamiento se registra; la mera repetición no demuestra independencia.', 'Compara qué apoyos estaban disponibles en cada intento.', 'Transfiere la misma gramática de montaje a otro calibre.'),
  'activity.quartz2035.identify-error-hypothesis': knowledgeCheck('¿Qué diferencia una hipótesis de un diagnóstico cerrado?', 'La hipótesis propone una causa y una predicción que todavía debe comprobarse', 'La hipótesis usa una palabra técnica y por eso ya es cierta', 'El diagnóstico solo repite el síntoma con más detalle', 'Una hipótesis puede ganar o perder apoyo según una prueba discriminante.', 'Escribe dos causas que producirían resultados distintos en un punto de control.', 'Aplica el método a una interrupción del cuarzo conceptual.'),
  'activity.quartz2035.choose-check': knowledgeCheck('¿Qué comprobación es más útil entre dos hipótesis rivales?', 'La que produciría resultados diferentes si una u otra fuese cierta', 'La más rápida aunque ambas hipótesis predigan el mismo resultado', 'La que exige asumir un valor eléctrico no medido', 'Una prueba diagnóstica reduce alternativas; confirmar el síntoma no basta.', 'Anticipa el resultado esperado para cada hipótesis.', 'Diseña la siguiente comprobación si el resultado es ambiguo.'),
  'activity.quartz2035.complete-final-project': knowledgeCheck('¿Qué demuestra el proyecto final del 2035 dentro de su alcance digital?', 'Método trazable, comprensión funcional, secuencia independiente y límites explícitos', 'Reparación profesional de una unidad física', 'Geometría exacta y valores eléctricos validados por la animación', 'La evidencia digital puede demostrar razonamiento sobre el modelo didáctico, no destreza ni física real.', 'Comprueba que cada conclusión enlaza fuente, acción y evidencia.', 'Reutiliza el dossier con 8215 cambiando fuentes y dependencias.'),
  'activity.quartz2035.review-final-dossier': knowledgeCheck('¿Qué hallazgo obliga a devolver un dossier para corrección?', 'Una afirmación técnica sin fuente o una inferencia presentada como dato oficial', 'Una sección que reconoce un desconocido', 'Una limitación de fidelidad escrita de forma explícita', 'La trazabilidad exige que autoridad y alcance coincidan con cada afirmación.', 'Audita una fila de hecho, inferencia y desconocido.', 'Pide a otra persona que reproduzca una conclusión desde sus localizadores.'),
})

Object.assign(KNOWLEDGE_CHECKS, {
  // MIYOTA 8215
  'activity.miyota8215.identify-calibre': knowledgeCheck('¿Qué evidencia permite identificar una unidad como MIYOTA 8215?', 'Referencia o marca verificable enlazada con documentación aplicable a esa instancia', 'Parecido general con cualquier movimiento de la familia 82', 'Posición del rotor en una captura educativa', 'La identidad exige evidencia de referencia; la silueta solo puede sugerir una familia.', 'Localiza marca, referencia, variante y documento.', 'Clasifica una unidad parcial como confirmada, candidata o desconocida.'),
  'activity.miyota8215.classify-provenance': knowledgeCheck('¿Cómo debe clasificarse una posición obtenida del despiece pero no acotada por el fabricante?', 'Relación deducida de documentación, no dimensión oficial', 'Medición física validada', 'Geometría oficial exacta por aparecer en una imagen', 'Identidad, relación deducida y geometría estimada conservan capas de procedencia distintas.', 'Revisa fuente, método y clase de cada dato.', 'Clasifica el mismo dato cuando procede de medir una unidad concreta.'),
  'activity.miyota8215.locate-specification': knowledgeCheck('¿Dónde debe buscarse primero un dato nominal oficial del 8215?', 'En la especificación o plano oficial aplicable, conservando revisión y unidad', 'En una proporción medida sobre la foto de producto', 'En la ficha de otro calibre de la familia', 'Un dato nominal pertenece al documento y referencia que lo publican.', 'Registra localizador, valor, unidad y revisión.', 'Comprueba si el mismo dato existe para 2035 sin copiarlo.'),
  'activity.miyota8215.associate-reference-part': knowledgeCheck('¿Qué asociación entre referencia y pieza es aceptable?', 'La que reproduce el despiece aplicable y conserva la identidad de instancia', 'La que usa el mismo color en el modelo', 'La que elige la pieza más próxima al texto del plano', 'La referencia se apoya en documentación, no en apariencia.', 'Cruza nombre, referencia y posición documental.', 'Detecta una identidad oficial con geometría todavía reconstruida.'),
  'activity.miyota8215.detect-document-limit': knowledgeCheck('Si el documento identifica una pieza pero no publica su geometría oculta, ¿qué debe registrar la ficha técnica?', 'Identidad documentada y geometría desconocida o reconstruida con limitación', 'Geometría oficial completa por pertenecer al calibre', 'Una medición estimada sin marcar su origen', 'La autoridad puede cubrir identidad sin cubrir forma, dimensión o estado.', 'Separa las columnas de identidad, dimensión y modelo.', 'Propón qué documento o medición resolvería el límite.'),
  'activity.miyota8215.classify-subsystems': knowledgeCheck('¿Qué criterio clasifica una pieza dentro de un subsistema del 8215?', 'Su función y sus relaciones de entrada, salida, apoyo o retención', 'El color o la altura en la vista explosionada', 'El orden alfabético de la referencia', 'Los subsistemas se definen por cooperación funcional, no por apariencia.', 'Sigue una relación que entra y otra que sale.', 'Clasifica la misma función en el modelo conceptual.'),
  'activity.miyota8215.reconstruct-layers': knowledgeCheck('¿Qué ocurre al ocultar rotor, calendario o automático en el ensamblaje canónico?', 'Solo cambia la vista; las piezas siguen perteneciendo a la misma variante 8215', 'Se crea un calibre alternativo sin esos subsistemas', 'Se convierte el modelo específico en un movimiento conceptual', 'Las vistas reversibles no multiplican modelos ni cambian identidad.', 'Comprueba las identidades antes, durante y después de restaurar.', 'Reconstruye tres vistas parciales del mismo ensamblaje.'),
  'activity.miyota8215.follow-automatic': knowledgeCheck('¿Qué recorrido funcional sigue la carga automática?', 'Rotor → transmisión automática → entrada de carga del barrilete', 'Rotor → calendario → agujas → escape', 'Barrilete → rotor → corona → esfera', 'El rotor aporta una entrada al sistema de carga; no entrega directamente a la indicación.', 'Sigue cada engrane o interfaz hasta el estado de carga.', 'Compara con la ruta de cuerda manual.'),
  'activity.miyota8215.compare-automatic-conceptual': knowledgeCheck('¿Qué comparación entre automático 8215 y automático conceptual es legítima?', 'Comparar entrada, transmisión y destino funcional, manteniendo geometría e identidad separadas', 'Usar la geometría conceptual como plano del 8215', 'Afirmar idéntica eficiencia porque ambos muestran un rotor', 'La función puede transferirse sin heredar solución constructiva ni física.', 'Alinea las cadenas por función y anota sus fuentes.', 'Compara con otra arquitectura automática del Atlas.'),
  'activity.miyota8215.reconstruct-winding-states': knowledgeCheck('¿Qué define un estado de cuerda o puesta?', 'La posición de la tija y las relaciones que quedan activas hacia una salida concreta', 'La orientación de la cámara', 'El número de piezas ocultas en la vista del modelo', 'El mecanismo de cuerda y puesta selecciona rutas funcionales, no aspectos visuales.', 'Marca entrada, bifurcación y salida en cada estado.', 'Deduce el estado a partir del resultado observado.'),
  'activity.miyota8215.trace-manual-winding': knowledgeCheck('¿Qué resultado confirma funcionalmente la ruta de cuerda manual?', 'La rotación de la corona se transmite hacia el cambio de carga del barrilete', 'La corona mueve solo el disco de fecha', 'El rotor recibe energía desde las agujas', 'La cuerda manual es una entrada distinta que converge en el almacenamiento.', 'Sigue la cadena sin saltar interfaces.', 'Compara dónde converge con el automático.'),
  'activity.miyota8215.explain-calendar': knowledgeCheck('¿Qué relación explica el calendario de fecha sin inventar una ventana de corrección?', 'Una entrada diaria avanza el disco y el saltador lo posiciona; cualquier restricción se cita del manual', 'El volante empuja directamente el disco una vez al día', 'El disco gira libremente y se detiene por su peso', 'El calendario transforma una entrada periódica en avance y asentamiento.', 'Observa conductor, disco y saltador por fases.', 'Compara cambio normal y corrección como entradas diferentes.'),
  'activity.miyota8215.run-calendar-cycle': knowledgeCheck('¿Qué orden describe un ciclo discreto de fecha?', 'Reposo → entrada en cambio → avance → asentamiento', 'Asentamiento → cuerda → escape → rotor', 'Avance continuo sin estado de reposo', 'El ciclo pasa por una transición y recupera un estado estable.', 'Pausa en el momento anterior y posterior al salto.', 'Empieza desde avance y predice el siguiente estado.'),
  'activity.miyota8215.follow-barrel-energy': knowledgeCheck('¿Qué cadena sale del barrilete hacia la marcha?', 'Muelle y conjunto de barrilete → dentado de salida → tren', 'Puente → rotor → calendario', 'Agujas → minutería → muelle', 'La energía almacenada se entrega al tren mediante la salida del barrilete.', 'Localiza almacenamiento, salida y primer receptor.', 'Interrumpe el engrane de salida y predice el estado restante.'),
  'activity.miyota8215.compare-barrel-conceptual': knowledgeCheck('¿Qué conserva la comparación entre barrilete conceptual y 8215?', 'La función de almacenar y entregar energía, no dimensiones ni construcción exacta', 'La forma exacta del muelle conceptual', 'El par y la reserva de marcha del modelo sin simulación física', 'La equivalencia funcional no valida física ni geometría.', 'Separa relaciones compartidas y datos propios.', 'Aplica el criterio a otro calibre mecánico.'),
  'activity.miyota8215.identify-train': knowledgeCheck('¿Cómo se sigue correctamente el tren del 8215?', 'Alternando engrana-con y comparte-árbol desde el barrilete hacia el escape', 'Saltando entre ruedas cercanas aunque no haya interfaz', 'Siguiendo solo el orden vertical de la vista explosionada', 'La cadena real depende de contactos y árboles, no de proximidad.', 'Nombra una interfaz en cada salto.', 'Reconstruye el recorrido desde la última etapa hacia atrás.'),
  'activity.miyota8215.interrupt-train': knowledgeCheck('Al interrumpir un engrane del tren, ¿qué predicción es correcta?', 'La primera etapa aguas abajo deja de recibir movimiento mientras la fuente puede conservar carga', 'Todas las piezas anteriores se eliminan del ensamblaje', 'El calendario sigue recibiendo el mismo movimiento por proximidad', 'El efecto se propaga desde la interfaz rota hacia las salidas dependientes.', 'Localiza el último nodo activo y el primero inactivo.', 'Mueve la interrupción a otra etapa y compara alcance.'),
  'activity.miyota8215.follow-escapement': knowledgeCheck('¿Qué secuencia funcional enlaza tren, escape y oscilador?', 'El tren entrega energía, el escape alterna bloqueo e impulso y el oscilador gobierna la liberación', 'El volante carga directamente el barrilete', 'El áncora mueve las agujas sin pasar por el tren', 'Escape y oscilador forman una realimentación, no una fila de giros independientes.', 'Sigue energía e información temporal por separado.', 'Ordena el ciclo desde una fase aleatoria.'),
  'activity.miyota8215.compare-conceptual-real': knowledgeCheck('¿Qué permite afirmar la comparación del escape conceptual con la reconstrucción estructural del 8215?', 'Que comparten funciones declaradas, con geometría y física propias no equivalentes', 'Que el conceptual reproduce tolerancias del 8215', 'Que una secuencia educativa demuestra amplitud y marcha reales', 'La reconstrucción ayuda a entender relaciones, pero no sustituye medición ni plano completo.', 'Alinea bloqueo, impulso y oscilación en ambos casos.', 'Enumera un dato que debe permanecer específico del 8215.'),
  'activity.miyota8215.prepare-workbench': knowledgeCheck('¿Qué preparación es necesaria antes de planificar el desmontaje 8215?', 'Identificar instancia, fuente, estado, herramientas, bandejas y límites del modelo', 'Ocultar el rotor y comenzar por la pieza más grande', 'Usar el banco preparado para 2035 sin revisar diferencias', 'El banco fija el contexto que hace trazable cada operación.', 'Revisa que todo objeto tenga identidad y destino.', 'Adapta las zonas a una unidad física y añade riesgos no digitales.'),
  'activity.miyota8215.create-disassembly-plan': knowledgeCheck('¿Qué convierte una lista en un plan de desmontaje razonado?', 'Cada paso declara dependencia, herramienta, destino, comprobación y condición de parada', 'Ordenar piezas por color', 'Copiar el orden visual de las capas separadas sin justificarlo', 'Un plan explica por qué el siguiente paso es accesible y autorizado.', 'Señala qué relación “retirar antes de” satisface cada paso.', 'Replanifica cuando una pieza solo está documentada o queda bloqueada.'),
  'activity.miyota8215.remove-rotor': knowledgeCheck('¿Qué debe ocurrir antes de retirar virtualmente el rotor?', 'Confirmar instancia, sujeción, herramienta, orientación, destino y autoridad de la operación', 'Girar el rotor hasta que desaparezca de la cámara', 'Eliminar todo el automático como un único objeto sin identidad', 'Retirar es una transición de estado trazable, no ocultar una pieza visual.', 'Sigue la identidad del rotor y de su sujeción hasta la bandeja.', 'Explica qué riesgo físico no representa la operación digital.'),
  'activity.miyota8215.manage-fasteners': knowledgeCheck('¿Cómo se evita intercambiar sujeciones aparentemente iguales?', 'Conservando identidad de instancia, origen, orden, orientación y celda de bandeja', 'Agrupándolas solo por color o tamaño visual', 'Asignando la misma referencia temporal a todas', 'La identidad de instancia preserva el lugar de cada sujeción.', 'Traza dos tornillos desde origen hasta bandeja y vuelta.', 'Gestiona una sujeción cuya referencia sea conocida pero geometría estimada.'),
  'activity.miyota8215.guided-disassembly': knowledgeCheck('¿Qué debe explicar el alumno en un paso guiado?', 'Qué dependencia se libera, qué cambia y cómo se conserva la pieza retirada', 'Solo qué botón está iluminado', 'Por qué el modelo tiene el color elegido', 'La guía modela una decisión; el alumno debe reconstruir su causalidad.', 'Predice el acceso resultante antes de confirmar.', 'Repite el tramo sin la etiqueta del siguiente paso.'),
  'activity.miyota8215.assisted-disassembly': knowledgeCheck('¿Qué ayuda corresponde a un modo asistido?', 'Puntos de control y avisos de dependencia, sin revelar siempre la siguiente pieza', 'La secuencia completa visible durante todo el intento', 'Una pista near-answer disponible antes de observar', 'El soporte se desvanece para exigir selección y justificación.', 'Compara qué información se retiró desde el modo guiado.', 'Completa una variante restaurada con una sola comprobación.'),
  'activity.miyota8215.free-disassembly': knowledgeCheck('¿Qué evidencia hace independiente un desmontaje digital libre?', 'Secuencia propia válida, decisiones justificadas, bandeja trazable, restauración y ausencia de pistas', 'Repetir de memoria los clics del ejemplo con la solución abierta', 'Terminar rápido aunque se violen dependencias', 'Independencia exige resolver una variante sin ayuda y conservar evidencia.', 'Revisa pistas, errores, dependencias y estado final.', 'Transfiere el plan a otro calibre sin copiar el orden.'),
  'activity.miyota8215.inspect-parts': knowledgeCheck('¿Qué registro de inspección es correcto?', 'Pieza, zona, método, observación, fuente y límite separados de la hipótesis', '“Está mal” sin indicar qué se observó', 'Una dimensión estimada presentada como medición', 'La inspección describe evidencia antes de proponer causa.', 'Completa columnas de observación, inferencia y desconocido.', 'Añade qué instrumento real necesitaría la siguiente comprobación.'),
  'activity.miyota8215.detect-symbolic-defect': knowledgeCheck('¿Qué significa detectar un defecto simbólico en el modelo didáctico?', 'Reconocer una condición educativa controlada y formular su efecto sin llamarla daño físico observado', 'Confirmar desgaste real del calibre', 'Medir automáticamente una tolerancia fuera de especificación', 'El símbolo entrena razonamiento; no documenta una unidad física.', 'Identifica qué regla del escenario define el estado anómalo.', 'Diseña una observación física que podría apoyar una causa real.'),
  'activity.miyota8215.guided-assembly': knowledgeCheck('¿Qué comprobación debe preceder al cierre con un puente?', 'Que pivotes, apoyos, orientación y engranes declarados estén en estado válido', 'Que el puente oculte todas las piezas anteriores', 'Que los tornillos puedan seleccionarse, aunque una rueda esté inclinada', 'El cierre no corrige un mal asiento; oculta el acceso a comprobarlo.', 'Inspecciona ambos apoyos antes de añadir la cubierta.', 'Repite el tramo con menos etiquetas.'),
  'activity.miyota8215.assisted-assembly': knowledgeCheck('¿Qué caracteriza un montaje asistido bien diseñado?', 'Conserva puntos de control, pero deja al alumno decidir el siguiente componente y justificarlo', 'Muestra la solución completa y cuenta cualquier repetición como dominio', 'Desactiva los rechazos de dependencias', 'La ayuda disminuye sin eliminar integridad ni límites.', 'Identifica qué apoyo o acceso se comprobará después.', 'Monta una variante con un punto de control distinto.'),
  'activity.miyota8215.free-assembly': knowledgeCheck('¿Qué debe incluir la evidencia de un montaje digital libre?', 'Orden independiente, verificaciones parciales, gestión de instancias, restauración y explicación de límites', 'Solo una captura del conjunto cerrado', 'Una declaración de funcionamiento físico sin medición', 'El resultado final no basta: importan decisiones, puntos de control y alcance.', 'Audita un punto de control antes de cada cierre.', 'Pide revisión humana de la explicación sin atribuirle destreza manual.'),
  'activity.miyota8215.partial-verifications': knowledgeCheck('¿Por qué se verifican subsistemas antes de completar el montaje?', 'Porque una cubierta posterior puede ocultar un mal apoyo o engrane y dificultar localizar el error', 'Porque toda rueda debe desmontarse después de cada paso', 'Porque el color del modelo cambia al guardar un punto de control', 'Las comprobaciones parciales localizan errores y protegen el acceso.', 'Nombra qué relación quedará oculta tras el siguiente paso.', 'Diseña una verificación equivalente para el calendario.'),
  'activity.miyota8215.identify-affected-subsystem': knowledgeCheck('Ante un síntoma, ¿cómo se identifica primero el subsistema afectado?', 'Siguiendo la cadena funcional hasta el primer resultado ausente, sin confundirlo aún con la causa', 'Eligiendo la pieza más cercana a la aguja detenida', 'Cambiando el barrilete en todos los casos', 'Localizar alcance funcional reduce el espacio de hipótesis, pero no cierra el diagnóstico.', 'Marca la última función presente y la primera ausente.', 'Repite con un síntoma que pueda tener dos causas.'),
  'activity.miyota8215.form-hypothesis': knowledgeCheck('¿Qué estructura debe tener una hipótesis sobre el 8215?', 'Causa propuesta, relación afectada, resultado esperado y condición que podría refutarla', 'Una lista de piezas posibles sin predicción', 'Una certeza basada en la reconstrucción estructural', 'La hipótesis debe poder perder apoyo mediante evidencia.', 'Escribe dos hipótesis rivales para el mismo síntoma.', 'Transfiere la estructura a otro calibre con fuentes propias.'),
  'activity.miyota8215.select-verification': knowledgeCheck('¿Qué verificación debe elegirse primero?', 'La observación o prueba permitida que mejor diferencie las hipótesis con el menor número de supuestos', 'La que confirma de nuevo el síntoma pero no separa causas', 'La que necesita valores físicos que el modelo didáctico no mide y los inventa', 'Una verificación útil cambia el mapa de hipótesis y respeta la autoridad disponible.', 'Anticipa un resultado por cada hipótesis.', 'Planifica una prueba física pendiente cuando el modelo no basta.'),
  'activity.miyota8215.complete-diagnosis': knowledgeCheck('¿Qué hace aceptable un diagnóstico digital final?', 'Conservar síntoma, hipótesis rivales, pruebas, resultados, incertidumbre y límites de la reconstrucción y la simulación', 'Elegir una causa única aunque las pruebas sean ambiguas', 'Presentar el fallo simbólico como desgaste real', 'El diagnóstico se limita a la evidencia y deja abiertas las alternativas no descartadas.', 'Comprueba que cada descarte cite un resultado.', 'Revisa el caso con otro fallo que produzca el mismo síntoma.'),
  'activity.miyota8215.final-project': knowledgeCheck('¿Qué demuestra el proyecto final del 8215?', 'Comprensión y razonamiento independientes sobre el ensamblaje documentado, con restauración, transferencia y revisión', 'Servicio físico profesional y ajuste completo', 'Geometría exacta de todas las piezas internas', 'El proyecto acredita solo la evidencia digital y humana declarada.', 'Audita fuentes, dependencias, evidencias y límites del dossier.', 'Defiende qué cambiaría al pasar a otro miembro de la familia 82.'),
})

function segmentRole(title) {
  const normalized = title.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (/^(fuentes|frontera de fuentes|alcance|limitaciones?|limites?|fidelidad|procedencia|ficha tecnica|datos tecnicos|documentacion y fuentes|referencias)(\b|\s)/.test(normalized)) return 'reference'
  if (/proposito|antes de empezar|conocimientos previos|objetivos|punto de partida|pregunta de (diseno|trabajo|estudio)/.test(normalized)) return 'orient'
  if (/vocabulario|piezas e interfaces|piezas clave|nombres clave|fundamentos minimos/.test(normalized)) return 'pretrain'
  if (/explicacion visual|observa|que veras|lectura del modelo|demostracion/.test(normalized)) return 'observe'
  if (/ejemplo|errores habituales|idea equivocada|caso resuelto|caso trabajado/.test(normalized)) return 'worked-example'
  if (/actividad|practica|feedback|evidencia|criterio de exito|comprobacion|comprueba|transferencia/.test(normalized)) return 'practice'
  if (/resumen|siguiente conexion|para continuar|recuerda|cierre/.test(normalized)) return 'close'
  return 'explain'
}

function lessonRoles(markdowns) {
  const available = new Set(markdowns.flatMap((markdown) =>
    [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => segmentRole(match[1]))))
  if (available.size === 0) available.add('explain')
  const preferred = ['orient', 'pretrain', 'explain', 'worked-example', 'observe', 'practice', 'close']
    .filter((role) => available.has(role))
  if (preferred.length < 2) {
    throw new Error(`La lección no ofrece dos tipos de segmento obligatorios: ${[...available].join(', ')}`)
  }
  return preferred
}

function deliberatePracticeFor(activity, check) {
  const authoring = activity.authoring
  const feedback = authoring.feedbackContract
  if (!feedback) throw new Error(`${activity.id} no tiene feedbackContract para construir P1.`)
  const title = authoring.title.es
  const focus = check?.question ?? feedback.causalQuestion.es
  const observation = check?.observe ?? feedback.nextObservation.es
  const rationale = check?.rationale ?? feedback.correctExplanation.es
  const transfer = check?.transfer ?? feedback.transferPrompt?.es
    ?? `Resuelve una variante de «${title}» en otro estado inicial y explica qué parte del criterio se mantiene.`
  return {
    focus: text(focus),
    workedExample: {
      scenario: text(observation),
      steps: [
        text(`Delimita la entrada, el estado inicial y el resultado que debe explicar «${title}».`),
        text(check
          ? `Contrasta la regla específica del ejemplo: ${rationale}`
          : `Sigue la relación causal declarada en la lección y conserva su fuente o límite.`),
        text('Compara la predicción con el resultado, corrige la primera diferencia y restaura antes de repetir.'),
      ],
      conclusion: text(rationale),
    },
    attempts: [
      {
        phase: 'guided',
        instruction: text(`Resuelve «${title}» con el ejemplo y las etiquetas disponibles; explica cada decisión antes de confirmarla.`),
        evidence: text('Se guarda como práctica con guía, incluidas las pistas y correcciones utilizadas.'),
      },
      {
        phase: 'faded',
        instruction: text(`Restaura el estado y repite «${title}» con solo los puntos de control, sin la solución completa.`),
        evidence: text('Se compara qué apoyo fue necesario y en qué paso dejó de serlo.'),
      },
      {
        phase: 'independent',
        instruction: text(`Resuelve una variante restaurada de «${title}» sin pistas y justifica observación, relación y límite.`),
        evidence: text('Solo este intento puede aportar evidencia independiente; una respuesta pendiente conserva revisión humana.'),
      },
      {
        phase: 'transfer',
        instruction: text(transfer),
        evidence: text('La transferencia se registra separada del caso practicado y no hereda geometría, autoridad ni medidas.'),
      },
    ],
    successCriteria: [
      text(check?.correct ?? `La conclusión responde al objetivo «${title}» con una relación observable.`),
      text('La explicación separa hecho, inferencia, desconocido y límite de la representación.'),
      text('El intento final se completa sin pistas después de restaurar el estado.'),
    ],
    errorSignals: [
      text(check?.wrongA ?? feedback.incorrectDiagnosis.es),
      text(check?.wrongB ?? 'La respuesta describe apariencia o autoridad, pero no la relación que produce el resultado.'),
    ],
    independentRetry: {
      required: true,
      afterHint: true,
      restoreBeforeRetry: true,
      variant: text(transfer),
    },
    transferPrompt: text(transfer),
  }
}

function applyKnowledgeCheck(activity, scene, check) {
  const choice = scene.steps.flatMap(({ questions }) => questions)
    .find(({ responseKind }) => responseKind === 'single-choice')
  if (!choice || choice.options.length < 3) {
    throw new Error(`${scene.id} no contiene la comprobación de tres opciones esperada para ${activity.id}.`)
  }
  choice.promptMarkdown = check.question
  choice.authoring = {
    prompt: text(check.question),
    feedback: text(check.rationale),
  }
  const labels = [check.correct, check.wrongA, check.wrongB]
  choice.options.slice(0, 3).forEach((option, index) => {
    option.label = labels[index]
    option.labels = { es: labels[index], en: labels[index] }
  })
  ensureRecognitionReasoning(scene, activity, check)
  if (scene.storyboard) {
    scene.storyboard.narrative = text(`${check.observe} ${check.rationale}`)
    scene.storyboard.purpose = text(`Resolver «${activity.authoring.title.es}» mediante una decisión específica, explicación propia, restauración y transferencia.`)
  }
  const feedback = activity.authoring.feedbackContract
  activity.authoring.feedbackContract = {
    ...feedback,
    correctExplanation: text(check.rationale),
    incorrectDiagnosis: text(`Revisa la relación específica. «${check.wrongA}» y «${check.wrongB}» no explican el resultado observado.`),
    causalQuestion: text(check.question),
    nextObservation: text(check.observe),
    transferPrompt: text(check.transfer),
    requiresIndependentRetryAfterHint: true,
  }
  const hints = activity.authoring.interactionContract?.hints ?? []
  const hintCopy = [
    `Reformula la pregunta con una entrada y una salida: ${check.question}`,
    check.observe,
    `Aplica la regla de esta unidad sin mirar todavía la opción: ${check.rationale}`,
    `Contrasta tu predicción con el estado restaurado y localiza la primera diferencia comprobable.`,
    check.rationale,
    `Explica por qué descartaste las otras opciones y resuelve después esta transferencia: ${check.transfer}`,
  ]
  hints.forEach((hint, index) => {
    hint.content = text(hintCopy[index] ?? hintCopy.at(-1))
  })
}

const REASONING_FIELDS = [
  { id: 'field.observation', label: 'Qué cambió o qué comprobaste', kind: 'short-text', required: true, optionIds: [] },
  { id: 'field.causal-link', label: 'Qué relación, interfaz o regla explica el resultado', kind: 'short-text', required: true, optionIds: [] },
  { id: 'field.source-limit', label: 'Qué fuente o límite condiciona la conclusión', kind: 'short-text', required: true, optionIds: [] },
  { id: 'field.confidence', label: 'Confianza en la explicación', kind: 'confidence', required: true, optionIds: [] },
]

const RECOGNITION_RESPONSE_KINDS = new Set(['single-choice', 'multiple-choice', 'entity-selection', 'ordered-list'])

function ensureRecognitionReasoning(scene, activity, check) {
  const fallbackRationale = activity.authoring?.feedbackContract?.correctExplanation?.es
    ?? 'La explicación debe relacionar la observación con una regla concreta y declarar el límite de la conclusión.'
  for (const step of scene.steps ?? []) {
    const choice = (step.questions ?? []).find(({ responseKind }) => RECOGNITION_RESPONSE_KINDS.has(responseKind))
    if (!choice) continue
    const rationale = check?.rationale ?? fallbackRationale
    const originalPrompt = check?.question ?? choice.promptMarkdown
    const prompt = `Explica qué observaste, qué regla aplicaste y por qué tu conclusión responde a: ${originalPrompt}`
    let reasoning = (step.questions ?? []).find(({ responseKind }) => responseKind === 'structured-response')
    if (!reasoning) {
      reasoning = {
        id: `${choice.id}.reasoning`,
        promptMarkdown: prompt,
        responseKind: 'structured-response',
        options: [],
        structuredFields: REASONING_FIELDS.map((field) => ({ ...field })),
        hints: [],
        humanReviewRequired: true,
        authoring: {},
      }
      step.questions.push(reasoning)
    }
    reasoning.promptMarkdown = prompt
    reasoning.structuredFields = REASONING_FIELDS.map((field) => ({ ...field }))
    reasoning.humanReviewRequired = true
    reasoning.authoring = {
      prompt: text(prompt),
      feedback: text(`La revisión debe comprobar la relación específica: ${rationale}`),
    }
    step.success ??= []
    if (!step.success.some(({ condition, questionId }) => condition === 'structured-answer' && questionId === reasoning.id)) {
      step.success.push({
        condition: 'structured-answer',
        questionId: reasoning.id,
        requiredFieldIds: REASONING_FIELDS.map(({ id }) => id),
        pendingHumanReview: true,
      })
    }
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

let expandedBlocks = 0
let learnerLessons = 0
let learnerActivities = 0
let specificChecks = 0

for (const packageName of PACKAGE_NAMES) {
  const root = join(CONTENT_ROOT, packageName)
  const manifest = await readJson(join(root, 'manifest.json'))
  const releaseVersion = PACKAGE_RELEASES[packageName]
  manifest.packageVersion = releaseVersion
  manifest.minimumAppVersion = '0.10.0'
  for (const dependency of manifest.dependencies ?? []) {
    if (PACKAGE_RANGES[dependency.packageId]) dependency.versionRange = PACKAGE_RANGES[dependency.packageId]
  }
  const entries = manifest.entries
  const modules = new Map()
  const lessons = new Map()
  const activities = new Map()
  const blocks = new Map()
  const scenes = new Map()
  const concepts = new Map()
  const misconceptions = new Map()
  const glossary = new Map()

  for (const entry of entries.modules ?? []) modules.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.lessons ?? []) lessons.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.activities ?? []) activities.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.blocks ?? []) blocks.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.scenes ?? []) scenes.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.concepts ?? []) concepts.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.misconceptions ?? []) misconceptions.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  for (const entry of entries.glossary ?? []) glossary.set(entry.id, { entry, value: await readJson(join(root, entry.path)) })
  const repeatedParagraphs = repeatedBaseParagraphs(blocks)

  for (const { value: lesson } of lessons.values()) {
    for (const prerequisite of lesson.authoring?.externalPrerequisites ?? []) {
      if (PACKAGE_RANGES[prerequisite.packageId]) prerequisite.versionRange = PACKAGE_RANGES[prerequisite.packageId]
    }
  }

  const learnerLessonIds = new Set()
  for (const routeEntry of entries.routes ?? []) {
    const route = await readJson(join(root, routeEntry.path))
    if (route.demo) continue
    for (const moduleId of route.moduleIds) {
      for (const lessonId of modules.get(moduleId)?.value.lessonIds ?? []) learnerLessonIds.add(lessonId)
    }
  }
  const learnerActivityIds = new Set([...learnerLessonIds].flatMap((lessonId) =>
    lessons.get(lessonId)?.value.activityIds ?? []))

  for (const [blockId, appendix] of Object.entries(THEORY_EXPANSIONS)) {
    const record = blocks.get(blockId)
    if (!record) continue
    const base = stripRepeatedBoilerplate(
      baseBeforeEditorialDepth(record.value.bodyMarkdown),
      repeatedParagraphs,
    )
    const depthNote = DEPTH_NOTES[blockId]
    if (!depthNote) throw new Error(`Falta lectura técnica P1 para ${blockId}.`)
    const supplement = DEPTH_SUPPLEMENTS[blockId]
    record.value.bodyMarkdown = polishStudentCopy(`${base}\n\n${appendix}\n\n## Lectura técnica de relaciones y límites\n\n${depthNote}${supplement ? `\n\n## Profundización aplicada\n\n${supplement}` : ''}`)
    record.value.version = releaseVersion
    expandedBlocks += 1
  }

  const learnerBlockIds = new Set([...learnerLessonIds].flatMap((lessonId) =>
    lessons.get(lessonId)?.value.blockIds ?? []))
  for (const blockId of learnerBlockIds) {
    if (THEORY_EXPANSIONS[blockId]) continue
    const record = blocks.get(blockId)
    if (!record?.value?.bodyMarkdown) continue
    record.value.bodyMarkdown = stripRepeatedBoilerplate(
      baseBeforeEditorialDepth(record.value.bodyMarkdown),
      repeatedParagraphs,
    )
  }

  // Una declaración `pretrain` solo es válida si el estudiante recibe una
  // introducción real a los términos y piezas de esa lección. Los encabezados
  // vacíos se eliminan con el boilerplate; esta pasada recompone una sección
  // específica desde conceptos ya autorados, sin inventar conocimiento.
  for (const lessonId of learnerLessonIds) {
    const lesson = lessons.get(lessonId)?.value
    if (!lesson?.authoring) continue
    const lessonBlocks = lesson.blockIds
      .map((blockId) => blocks.get(blockId)?.value)
      .filter(Boolean)
    for (const block of lessonBlocks) {
      if (block.bodyMarkdown) block.bodyMarkdown = personalizePretrainingClose(block.bodyMarkdown, lesson)
    }
    if (hasSubstantivePretraining(lessonBlocks.map(({ bodyMarkdown }) => bodyMarkdown ?? ''))) continue
    const target = lessonBlocks.find(({ bodyMarkdown }) => bodyMarkdown)
    if (!target) throw new Error(`${lessonId} no contiene un bloque donde insertar palabras clave.`)
    target.bodyMarkdown = insertBeforeDepth(
      target.bodyMarkdown,
      contextualPretrainingSection(lesson, concepts),
    )
  }

  for (const activityId of learnerActivityIds) {
    const record = activities.get(activityId)
    if (!record?.value.authoring) throw new Error(`Falta authoring para ${activityId}.`)
    const activity = record.value
    activity.version = releaseVersion
    const rawCheck = KNOWLEDGE_CHECKS[activityId]
    const check = rawCheck && Object.fromEntries(
      Object.entries(rawCheck).map(([key, value]) => [key, polishStudentCopy(value)]),
    )
    if (check) {
      const sceneId = activity.sceneIds[0]
      const scene = scenes.get(sceneId)?.value
      if (!scene) throw new Error(`Falta la escena ${sceneId} de ${activityId}.`)
      scene.version = releaseVersion
      applyKnowledgeCheck(activity, scene, check)
      specificChecks += 1
    }
    for (const sceneId of activity.sceneIds) {
      const scene = scenes.get(sceneId)?.value
      if (scene) {
        scene.version = releaseVersion
        ensureRecognitionReasoning(scene, activity, check)
      }
    }
    activity.authoring.deliberatePractice = deliberatePracticeFor(activity, check)
    learnerActivities += 1
  }

  for (const lessonId of learnerLessonIds) {
    const lesson = lessons.get(lessonId)?.value
    if (!lesson?.authoring) throw new Error(`Falta authoring para ${lessonId}.`)
    lesson.version = releaseVersion
    const markdowns = lesson.blockIds.map((blockId) => blocks.get(blockId)?.value.bodyMarkdown ?? '')
    const actualWords = words(markdowns.join(' '))
    const previousStudy = lesson.authoring.studyContract
    lesson.authoring.studyContract = {
      ...previousStudy,
      sequence: 'theory-first',
      minimumTheoryMinutes: Math.max(
        20,
        previousStudy?.minimumTheoryMinutes ?? 0,
        Math.min(60, Math.ceil(actualWords / 70)),
      ),
      minimumReadingWords: Math.max(1, actualWords - 5),
      requiredSegmentRoles: lessonRoles(markdowns),
      practiceUnlock: 'after-required-reading',
      labActivityIds: [...lesson.activityIds],
      readinessCriteria: previousStudy?.readinessCriteria ?? [
        ...lesson.authoring.objectives.slice(0, 2),
        text('Explicar la relación principal con una entrada, una interfaz y un resultado observable.'),
        text('Distinguir qué está documentado, qué es educativo y qué permanece desconocido.'),
      ].slice(0, 8),
      sourceReviewRequired: true,
      notePrompt: previousStudy?.notePrompt ?? text(`Antes de practicar «${lesson.authoring.title.es}», resume el modelo causal, resuelve el ejemplo sin copiarlo y anota una duda que requiera fuente o comprobación.`),
    }
    learnerLessons += 1
  }

  for (const record of blocks.values()) record.value = polishLearnerFacing(record.value)
  for (const record of activities.values()) record.value = polishLearnerFacing(record.value)
  for (const record of scenes.values()) record.value = polishLearnerFacing(record.value)
  for (const record of concepts.values()) record.value = polishLearnerFacing(record.value)
  for (const record of misconceptions.values()) record.value = polishLearnerFacing(record.value)
  for (const record of glossary.values()) record.value = polishLearnerFacing(record.value)

  for (const { entry, value } of blocks.values()) await writeJson(join(root, entry.path), value)
  for (const { entry, value } of lessons.values()) await writeJson(join(root, entry.path), value)
  for (const { entry, value } of activities.values()) await writeJson(join(root, entry.path), value)
  for (const { entry, value } of scenes.values()) await writeJson(join(root, entry.path), value)
  for (const { entry, value } of concepts.values()) await writeJson(join(root, entry.path), value)
  for (const { entry, value } of misconceptions.values()) await writeJson(join(root, entry.path), value)
  for (const { entry, value } of glossary.values()) await writeJson(join(root, entry.path), value)
  await writeJson(join(root, 'manifest.json'), manifest)
  const distPack = { manifest }
  for (const [collection, manifestEntries] of Object.entries(manifest.entries)) {
    distPack[collection] = await Promise.all(
      manifestEntries.map(({ path }) => readJson(join(root, path))),
    )
  }
  await writeJson(join(root, 'dist', 'pack.json'), distPack)
}

if (expandedBlocks !== 37) throw new Error(`P1 esperaba profundizar 37 bloques y encontró ${expandedBlocks}.`)
if (learnerLessons !== 87) throw new Error(`P1 esperaba 87 lecciones del estudiante y encontró ${learnerLessons}.`)
if (learnerActivities !== 154) throw new Error(`P1 esperaba 154 actividades del estudiante y encontró ${learnerActivities}.`)
if (specificChecks !== 86 || Object.keys(KNOWLEDGE_CHECKS).length !== 86) {
  throw new Error(`P1 esperaba 86 comprobaciones especializadas y materializó ${specificChecks}/${Object.keys(KNOWLEDGE_CHECKS).length}.`)
}

console.log(`Academia P1: ${expandedBlocks} bloques profundizados, ${learnerLessons} lecciones theory-first, ${learnerActivities} prácticas deliberadas y ${specificChecks} comprobaciones específicas.`)
