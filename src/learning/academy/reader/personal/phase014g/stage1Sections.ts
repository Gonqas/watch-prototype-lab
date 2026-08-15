import type { AcademyStage1SectionSpec } from '../types'

const section = (
  blockId: string,
  suffix: string,
  title: string,
  role: AcademyStage1SectionSpec['role'],
  markdown: string,
  options: Pick<AcademyStage1SectionSpec, 'requiredForStudy' | 'collapsible'> = {},
): AcademyStage1SectionSpec => ({
  sectionId: `reader.section.${blockId}.014g-${suffix}`,
  title,
  role,
  markdown,
  legacySectionAliases: [],
  ...options,
})

const systemBlock = 'block.horology.system'
const SYSTEM_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(systemBlock, 'pregunta', 'El reloj completo, antes que sus piezas', 'orientation',
    'Un reloj terminado no es solo el movimiento. La caja lo protege y establece su relación con la muñeca; esfera y agujas convierten estados internos en una lectura; corona, pulsadores u otras interfaces permiten actuar sobre él. En esta lección usarás funciones para orientarte sin suponer todavía cómo las resuelve cada arquitectura.'),
  section(systemBlock, 'capas', 'Reloj completo y movimiento', 'visual-anatomy',
    'Separa mentalmente cuatro capas: **estructura y protección**, **movimiento**, **indicación** e **interfaz**. El movimiento contiene los órganos que almacenan o reciben energía, mantienen una referencia temporal, controlan la entrega y transmiten movimiento. Las demás capas no son decoración: hacen que ese movimiento pueda conservarse, ajustarse y leerse como reloj.'),
  section(systemBlock, 'funciones', 'Un mapa de funciones', 'explanation',
    'Pregunta qué trabajo cumple un elemento antes de memorizar su nombre. Un reloj necesita una fuente o acumulador de energía, una referencia temporal, un medio de control, una transmisión, una indicación y una estructura que sostenga las relaciones. Una misma pieza puede contribuir a más de una función y una función puede estar distribuida entre varias piezas.'),
  section(systemBlock, 'relaciones', 'Las relaciones producen el sistema', 'explanation',
    'Una rueda inmóvil puede ser esencial si sostiene un eje, limita una posición o conserva la alineación. Del mismo modo, una pieza móvil deja de ser útil si no entrega su resultado a la siguiente interfaz. El inventario de piezas responde «qué hay»; el mapa funcional añade «qué recibe, qué transforma y qué entrega».'),
  section(systemBlock, 'caso', 'Caso: una caja sin movimiento y un movimiento sin caja', 'worked-example',
    'La caja vacía conserva forma de reloj, pero no produce una referencia temporal ni una indicación cambiante. El movimiento fuera de caja puede funcionar, pero carece de protección, fijación e interfaz completa con la persona. Ninguno equivale por sí solo al reloj terminado. La comparación evita usar «reloj» y «movimiento» como sinónimos.'),
  section(systemBlock, 'actividad', 'Cómo clasificar sin adivinar', 'checkpoint',
    'En la actividad, elige una función principal y justifícala mediante entrada, relación y resultado observable. Si un elemento admite varias funciones, declara la principal en este contexto y una contribución secundaria. El objetivo es construir un mapa revisable, no acertar una etiqueta por parecido visual.'),
  section(systemBlock, 'errores', 'Confusiones que conviene detener', 'common-errors',
    '- Confundir movimiento con reloj completo.\n- Llamar transmisión a todo lo que gira.\n- Considerar prescindible una pieza porque no se mueve.\n- Tratar caja, esfera o interfaz como elementos sin función técnica.\n\nCuando no puedas justificar una relación, marca la función como desconocida y vuelve a la fuente adecuada.'),
  section(systemBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'Theory of Horology presenta el movimiento mecánico simple y sus funciones generales en el capítulo 3; la inspección visual usada para esta curación corresponde a las páginas impresas 33 y 38 del PDF de capítulos 1–3. El diagrama es una síntesis conceptual: no representa escala, piezas de un calibre ni compatibilidades.', { requiredForStudy: false, collapsible: true }),
]

const simpleBlock = 'block.encyclopedia.mechanical-energy-trains.toh-movimiento-simple'
const SIMPLE_MOVEMENT_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(simpleBlock, 'pregunta', 'El movimiento como sistema cerrado de relaciones', 'orientation',
    'Antes de estudiar trenes, escape o regulación por separado, necesitas ver por qué cooperan. Un movimiento mecánico simple conserva energía, la transmite, la libera a intervalos y convierte ese comportamiento en indicación. La visión general introduce esas funciones; no debe exigir como prerrequisito detalles que todavía pretende situar.'),
  section(simpleBlock, 'organos', 'Cinco órganos funcionales', 'visual-anatomy',
    'El mapa conceptual reúne acumulador de energía, tren de transmisión y conteo, escape, órgano regulador e indicación. No los leas como una lista lineal. El tren lleva energía hacia el escape, el escape interactúa con el regulador y una rama del movimiento termina en la visualización del tiempo.'),
  section(simpleBlock, 'energia', 'Ruta de energía', 'explanation',
    'La energía almacenada crea una tendencia al movimiento. El tren la comunica y adapta a través de relaciones mecánicas. El escape no es otra fuente: administra la liberación y entrega impulsos que compensan pérdidas del regulador. Esta ruta explica por qué detener un órgano puede cambiar el comportamiento del conjunto.'),
  section(simpleBlock, 'tiempo', 'Bucle de temporización', 'explanation',
    'Escape y regulador se condicionan mutuamente. El escape deja avanzar el tren en pasos; el regulador determina cuándo puede producirse cada liberación y recibe impulsos para mantener su oscilación. Por eso la temporización se representa como un bucle de interacción, no como una flecha que termina sin retorno.'),
  section(simpleBlock, 'indicacion', 'La rama de indicación', 'explanation',
    'La indicación aprovecha el movimiento contado y lo transforma en posiciones legibles. Minutería y puesta en hora son desarrollos posteriores de esta rama, no fundamentos necesarios para comprender la visión general. Aquí basta reconocer que mostrar el tiempo es una salida del sistema y que su arquitectura detallada exige otra lección.'),
  section(simpleBlock, 'caso', 'Caso: el tren quiere avanzar', 'worked-example',
    'Imagina energía disponible y un tren ensamblado, pero sin control temporal. La tendencia al avance existe, aunque el reloj no produciría una indicación regulada. Añadir un escape sin un regulador tampoco completa el modelo. El caso muestra que enumerar componentes no basta: la función aparece en sus relaciones.'),
  section(simpleBlock, 'puente', 'Qué estudiar después', 'next-connection',
    'La cadena mecánica detallará la ruta energética y la interacción escape–oscilador. Más adelante estudiarás relaciones de engranajes, puesta en hora, ajuste y diagnóstico. Esos contenidos amplían este mapa; no se convierten retrospectivamente en requisitos para entenderlo.'),
  section(simpleBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'La síntesis se apoya en Theory of Horology, capítulo 3, páginas impresas 33, 38 y 39 del PDF inspeccionado visualmente. El esquema no afirma fuerzas, rendimientos, frecuencias, tolerancias ni diseño de un calibre. La numeración del archivo dividido se conserva como localizador editorial para evitar confundirla con otro PDF.', { requiredForStudy: false, collapsible: true }),
]

const mechanicalBlock = 'block.horology.mechanical-chain'
const MECHANICAL_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(mechanicalBlock, 'pregunta', 'Tres relaciones, no una sola cadena', 'orientation',
    'La expresión «cadena mecánica» ayuda a ordenar órganos, pero puede ocultar la estructura real. Distingue una ruta de energía, un bucle de temporización entre escape y oscilador y una rama de indicación. Las tres cooperan; ninguna debe presentarse como una fila de piezas que solo empuja hacia delante.'),
  section(mechanicalBlock, 'mapa', 'Mapa causal de la arquitectura mecánica', 'visual-anatomy',
    'La fuente y el barrilete alimentan el tren. El tren llega al escape. Escape, áncora y conjunto volante–espiral forman la interacción que dosifica el avance. Otra relación lleva el movimiento contado a la indicación. El diagrama usa funciones y conexiones; la vista del MIYOTA 8215 sirve solo como ejemplo estructural documentado.'),
  section(mechanicalBlock, 'energia', 'Ruta de energía: fuente, tren y escape', 'explanation',
    'El muelle conserva energía y el barrilete la entrega al tren. Las ruedas transmiten movimiento entre ejes y relaciones. Al final de la ruta, el escape alterna bloqueo, liberación e impulso. Decir que el tren «crea» energía invierte la causalidad: la transmite desde una fuente y sus pérdidas forman parte del sistema real.'),
  section(mechanicalBlock, 'bucle', 'Bucle de temporización: escape y oscilador', 'explanation',
    'El escape permite un avance cuando el regulador alcanza una condición adecuada; a la vez, proporciona impulsos al regulador. El volante y la espiral no son una rueda más del tren, y el escape no actúa como metrónomo independiente. La regularidad observable nace de su interacción y de condiciones físicas que este diagrama no calcula.'),
  section(mechanicalBlock, 'indicacion', 'Rama de indicación y puesta en hora', 'comparison',
    'El tren de marcha transmite la energía controlada; la minutería transforma una salida en relaciones apropiadas para las agujas. La puesta en hora añade una interfaz capaz de cambiar la indicación. Estas funciones se conectan, pero no son idénticas: una lección posterior deberá mostrar sus piezas y estados específicos.'),
  section(mechanicalBlock, 'fallo', 'Caso: el oscilador deja de interactuar', 'worked-example',
    'Si se inmoviliza el oscilador en el modelo conceptual, el escape deja de recibir la temporización que permite su secuencia normal. El tren no debe representarse simplemente como una animación que sigue avanzando. La predicción es cualitativa y educativa; no diagnostica por qué un reloj real se detuvo.'),
  section(mechanicalBlock, 'actividad', 'Ordenar y explicar', 'checkpoint',
    'Ordena los órganos por la ruta energética y, después, añade el retorno de temporización. El criterio no es solo colocar tarjetas: debes explicar qué entrega cada relación y señalar por qué la rama de indicación no sustituye al regulador. La identificación del conjunto escape–oscilador permanece como actividad opcional de apoyo.'),
  section(mechanicalBlock, 'fuentes', 'Fuentes, ejemplo de calibre y límites', 'sources',
    'Theory of Horology, capítulo 6, página PDF 1 / impresa 99, describe la función general del escape; el capítulo 3 sustenta el mapa del movimiento simple. Las páginas y despieces oficiales del MIYOTA 8215 respaldan identidades del ejemplo, no fuerzas, lubricación, tolerancias ni una secuencia de servicio.', { requiredForStudy: false, collapsible: true }),
]

const quartzBlock = 'block.horology.quartz-chain'
const QUARTZ_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(quartzBlock, 'pregunta', 'Una especialización de apoyo', 'orientation',
    'El cuarzo analógico ofrece otra solución al mismo problema general de medir e indicar el tiempo. Esta lección es apoyo y especialización inicial: ayuda a comparar arquitecturas, pero no bloquea el recorrido mecánico. Se estudia por funciones y con el MIYOTA 2035 como ejemplo documentado, sin convertirlo en modelo universal.'),
  section(quartzBlock, 'mapa', 'Mapa funcional del cuarzo analógico', 'visual-anatomy',
    'Distingue cuatro zonas: energía eléctrica, referencia y división temporal, conversión electromecánica y transmisión hacia la indicación. En el 2035, batería, circuito integrado, cristal de cuarzo, bobina, estator, rotor y tren aparecen como identidades documentadas. El mapa no afirma que toda arquitectura de cuarzo las disponga igual.'),
  section(quartzBlock, 'energia', 'Energía y control electrónico', 'explanation',
    'La batería proporciona energía eléctrica. El circuito mantiene la oscilación de la referencia de cuarzo y organiza una señal temporal utilizable. «Electrónico» no significa que las agujas reciban energía sin intermediarios: aún hace falta convertir la señal en movimiento y transmitirlo.'),
  section(quartzBlock, 'referencia', 'Referencia y división temporal', 'explanation',
    'El cuarzo funciona como referencia periódica dentro del circuito. La división transforma esa oscilación en una cadencia adecuada para controlar la etapa siguiente. Esta explicación conserva el principio sin introducir valores numéricos; cualquier frecuencia, tolerancia o consumo concreto requiere su afirmación y localizador verificables.'),
  section(quartzBlock, 'conversion', 'De señal a movimiento', 'explanation',
    'La corriente en la bobina crea un campo magnético en el conjunto de estator y rotor. El motor paso a paso convierte la orden eléctrica en desplazamientos mecánicos. A partir del rotor, el tren transmite el movimiento hacia las agujas. Conversión y transmisión son funciones distintas aunque estén próximas físicamente.'),
  section(quartzBlock, 'comparacion', 'Qué cambia frente a un mecánico', 'comparison',
    'La fuente, la referencia temporal y el modo de dosificar el avance cambian. Un circuito y un cristal no son equivalentes físicos de escape, volante y espiral; solo pueden compararse por ciertas funciones. La parte final vuelve a ser mecánica en un cuarzo analógico: motor, tren e indicación conservan relaciones de movimiento.'),
  section(quartzBlock, 'actividad', 'Seguir la cadena sin atribuir de más', 'checkpoint',
    'Ordena energía, referencia/división, conversión, transmisión e indicación. Explica una interfaz entre dos zonas y nombra un dato que el diagrama no puede probar. Identificar la referencia temporal es una práctica opcional: el resultado digital demuestra comprensión y ejecución virtual, no competencia física sobre un 2035.'),
  section(quartzBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'La arquitectura general se verificó visualmente en Theory of Horology, capítulo 15: PDF 3 / impresa 331 para el conjunto, PDF 11 / impresa 339 para circuito y división, PDF 13 / impresa 341 para el tren y PDF 14 / impresa 342 para motor. El MIYOTA 2035 se limita a su documentación oficial declarada.', { requiredForStudy: false, collapsible: true }),
]

const equivalenceBlock = 'block.horology.functional-equivalence'
const EQUIVALENCE_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(equivalenceBlock, 'pregunta', 'Comparar funciones sin igualar objetos', 'orientation',
    'Dos arquitecturas pueden resolver una necesidad parecida con piezas y principios diferentes. Una equivalencia funcional responde «¿qué papel comparable cumple?»; no demuestra igualdad física, compatibilidad, precisión equivalente ni posibilidad de sustitución. El mapa mecánico es requisito; el mapa de cuarzo permanece como apoyo accesible desde esta comparación.'),
  section(equivalenceBlock, 'matriz', 'Una matriz de equivalencias y límites', 'visual-anatomy',
    'Cada fila comienza por una función: aportar energía, mantener referencia, dosificar el avance, convertir, transmitir o indicar. Las columnas describen cómo participa cada arquitectura y una tercera columna declara el límite. Algunas relaciones son parciales, otras están distribuidas y algunas carecen de equivalente directo útil.'),
  section(equivalenceBlock, 'parcial', 'Equivalencia parcial', 'comparison',
    'La batería y el muelle son comparables como fuentes dentro del sistema, pero almacenan y entregan energía de forma distinta. El cristal de cuarzo y el conjunto volante–espiral participan en la referencia temporal, aunque sus fenómenos físicos y su relación con el control no son intercambiables. La función compartida no borra la diferencia.'),
  section(equivalenceBlock, 'distribuida', 'Función distribuida', 'comparison',
    'En un reloj mecánico, referencia, control e impulso se reparten entre regulador y escape. En un cuarzo analógico, cristal, circuito y motor dividen otras partes del trabajo. Forzar pares uno a uno produce analogías engañosas. Cuando una función pertenece a un conjunto, la matriz debe nombrar el conjunto.'),
  section(equivalenceBlock, 'sin-equivalente', 'Cuando no hay equivalente directo', 'explanation',
    'Una función puede existir solo en una arquitectura o combinarse de forma tan distinta que el emparejamiento deje de ayudar. La respuesta correcta puede ser «sin equivalente directo». Esa negativa es información: protege contra inferencias de compatibilidad, reparación o comportamiento que las fuentes no respaldan.'),
  section(equivalenceBlock, 'caso', 'Caso: el impulso no es una señal', 'worked-example',
    'El impulso mecánico que recibe un regulador y la señal que gobierna un motor paso a paso participan en secuencias temporizadas, pero no son la misma entidad ni actúan sobre el mismo órgano. La comparación válida se mantiene en el nivel funcional; bajar al nivel físico exige describir cada mecanismo por separado.'),
  section(equivalenceBlock, 'actividad', 'Emparejar, justificar y limitar', 'checkpoint',
    'Para cada pareja, indica función común, solución mecánica, solución de cuarzo y límite. Se considera correcta una relación justificada, incluida la decisión de no emparejar. La actividad solicita K, V y un resultado revisable; no solicita desmontar ni medir un movimiento.'),
  section(equivalenceBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'La comparación combina los modelos conceptuales verificados en Theory of Horology con identidades declaradas por la documentación oficial del MIYOTA 2035. La matriz es una síntesis editorial original. No afirma equivalencia física, rendimiento, precisión, dimensiones ni compatibilidad entre componentes.', { requiredForStudy: false, collapsible: true }),
]

const docsBlock = 'block.encyclopedia.history-language.leer-documentacion'
const DOCUMENT_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(docsBlock, 'pregunta', 'Un documento responde una clase de pregunta', 'orientation',
    'Leer documentación técnica consiste en ajustar la afirmación al alcance real del documento. Un nombre comercial, una ficha, un despiece, un manual de servicio y una base de datos no prueban lo mismo. La autoridad depende de la materia, del producto, de la edición y del localizador concreto.'),
  section(docsBlock, 'tipos', 'Qué puede y qué no puede demostrar cada documento', 'visual-anatomy',
    'Una ficha oficial puede confirmar especificaciones que declara. Un despiece ayuda a identificar piezas y relaciones de montaje representadas. Un manual aplicable puede documentar secuencias y criterios de servicio. Una base secundaria facilita descubrimiento y equivalencias preliminares. Ninguno debe utilizarse para responder una pregunta que no trata.'),
  section(docsBlock, 'despiece', 'Un despiece no es una secuencia de servicio', 'comparison',
    'La posición gráfica o la numeración de un despiece no demuestra por sí sola el orden de desmontaje, el método de manipulación, la lubricación ni una tolerancia. Para afirmar una secuencia hacen falta instrucciones aplicables. El dibujo puede inspirar una pregunta o confirmar una identidad, pero no completa el procedimiento.'),
  section(docsBlock, 'afirmacion', 'Procedencia por afirmación', 'explanation',
    'Divide una conclusión extensa en afirmaciones comprobables. Para cada una registra documento, localizador, aplicabilidad y estado de verificación. Si el dato es una inferencia, llámalo inferencia. Si dos fuentes difieren, conserva el conflicto. El orden incidental de una lista nunca decide cuál es la fuente principal.'),
  section(docsBlock, 'jerarquia', 'Autoridad por materia', 'explanation',
    'Para una pieza o secuencia de un calibre, prioriza documentación oficial aplicable. Para teoría general, usa una fuente conceptual. Para identificación histórica o descubrimiento, una base puede orientar la búsqueda. La misma fuente puede ser fuerte en una materia y débil en otra; «oficial» tampoco convierte en universal una afirmación específica.'),
  section(docsBlock, 'caso', 'Caso: identificar no es autorizar', 'worked-example',
    'Una base secundaria y un despiece oficial coinciden en el nombre de una pieza. La coincidencia mejora la identificación, pero no autoriza a concluir qué lubricante usa o en qué orden debe retirarse. Esas son afirmaciones distintas y necesitan localizadores aplicables. El hueco se registra como pendiente, no se rellena por analogía.'),
  section(docsBlock, 'actividad', 'Auditar cinco afirmaciones', 'checkpoint',
    'Elige una ficha oficial y una fuente secundaria ya registrada. Redacta afirmaciones breves, asigna a cada una su fuente y declara qué pregunta queda fuera de alcance. El éxito depende de justificar autoridad y límite, no de acumular enlaces. No abras recursos privados ni introduzcas identificadores internos en la interfaz.'),
  section(docsBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'La lección usa como casos las páginas y documentos oficiales MIYOTA 2035 y 8215 registrados por el proyecto, junto con recursos secundarios para contraste. No se inventan páginas ausentes ni se trata una URL como prueba de contenido no inspeccionado. Las tres dependencias avanzadas de cuarzo del contenido bruto no son requisitos efectivos.', { requiredForStudy: false, collapsible: true }),
]

const measureBlock = 'block.encyclopedia.history-language.medir-el-tiempo'
const MEASURE_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(measureBlock, 'pregunta', 'De un fenómeno repetible a una lectura', 'orientation',
    'Medir tiempo exige escoger una referencia, reconocer repeticiones, contarlas y presentarlas en una escala útil. Esta rama es enriquecimiento histórico y conceptual: amplía el mapa del sistema, pero no bloquea el camino mecánico. No presupone una tecnología concreta ni convierte una comparación histórica en procedimiento.'),
  section(measureBlock, 'mapa', 'Referencia, conteo, escala e indicación', 'visual-anatomy',
    'El mapa separa el fenómeno que se repite, el medio que detecta o cuenta repeticiones, la escala que asigna significado y la visualización. La estabilidad de la referencia y los errores de lectura afectan al resultado. Una indicación legible no demuestra por sí sola que la referencia sea estable.'),
  section(measureBlock, 'referencia', 'La referencia temporal', 'explanation',
    'Una referencia ofrece sucesos o estados repetibles que pueden compararse. Péndulo, volante–espiral y cuarzo pertenecen a historias y mecanismos distintos. Agruparlos bajo «referencia» permite preguntar por regularidad y perturbaciones sin afirmar que compartan física, rendimiento o forma de control.'),
  section(measureBlock, 'conteo', 'Contar y convertir', 'explanation',
    'El sistema debe conservar alguna correspondencia entre repeticiones y unidades mostradas. Esa correspondencia puede construirse mecánica, electrónica o digitalmente. El conteo no es la visualización: puede existir un estado contado antes de representarse mediante agujas, discos o cifras.'),
  section(measureBlock, 'error', 'Estabilidad, resolución y error', 'comparison',
    'La estabilidad describe cuánto conserva la referencia su comportamiento; la resolución, cuánto detalle puede distinguir la indicación; el error, la diferencia respecto de una comparación declarada. Son ideas relacionadas, no sinónimos. Esta lección no fija fórmulas ni valores: prepara las preguntas que más adelante exigirán metrología y fuentes exactas.'),
  section(measureBlock, 'caso', 'Caso: cuatro relojes, un mismo mapa', 'worked-example',
    'Aplica las cuatro funciones a un péndulo, un reloj mecánico, un cuarzo analógico y un cronómetro digital. En todos puedes buscar referencia, conteo, escala e indicación; las piezas y fenómenos cambian. Si una función está distribuida, nombra el conjunto en lugar de forzar una pieza única.'),
  section(measureBlock, 'actividad', 'Comparar sin borrar la historia', 'checkpoint',
    'Dibuja los cuatro mapas y marca qué permanece a nivel funcional. Después añade una diferencia que impida tratar las soluciones como equivalentes físicas. El producto es una explicación K/V revisable; no acredita ajuste, medición instrumental ni destreza de banco.'),
  section(measureBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'La estructura es una síntesis conceptual de fuentes generales ya registradas y del mapa funcional de etapa 1. Se conserva como enrichment y con estado source-limited: no introduce cronologías, cifras de estabilidad, fórmulas ni comparaciones de precisión sin localizador primario.', { requiredForStudy: false, collapsible: true }),
]

const atlasBlock = 'block.advanced.atlas-authority'
const ATLAS_SECTIONS: readonly AcademyStage1SectionSpec[] = [
  section(atlasBlock, 'pregunta', 'Buscar con una pregunta verificable', 'orientation',
    'Un atlas útil no empieza por una lista de movimientos, sino por una pregunta: identificar, fechar, comparar una familia, confirmar una pieza o localizar documentación de servicio. Esta lección funciona como referencia temprana. No requiere completar la ruta avanzada ni presupone competencia de reparación.'),
  section(atlasBlock, 'ruta', 'De la pregunta a la autoridad adecuada', 'visual-anatomy',
    'La ruta de decisión distingue documentación oficial, fuentes históricas, bases de identificación y recursos secundarios. Cada salida conserva procedencia, aplicabilidad y una pregunta que sigue abierta. La interfaz muestra nombres legibles y tipos de fuente; los identificadores internos permanecen en los datos editoriales.'),
  section(atlasBlock, 'primaria', 'Documentación primaria y aplicabilidad', 'explanation',
    'Una comunicación técnica del fabricante puede respaldar los datos que declara para la variante y edición indicadas. Antes de trasladar una cifra o pieza, comprueba calibre, variante, fecha y localizador. Que el documento sea primario no lo convierte en teoría general ni extiende automáticamente su alcance a una familia completa.'),
  section(atlasBlock, 'bases', 'Bases de datos: descubrir y contrastar', 'explanation',
    'Una base puede ayudar a encontrar nombres alternativos, familias, fechas o pistas documentales. Trátala como ruta de descubrimiento y contraste, no como autoridad final de lubricación, tolerancias, compatibilidad o servicio. Cuando dos bases coinciden, la coincidencia sigue necesitando una fuente apropiada para la afirmación técnica.'),
  section(atlasBlock, 'estados', 'Confirmado, inferido y desconocido', 'comparison',
    '«Confirmado» necesita una fuente y un localizador aplicables. «Inferido» describe un razonamiento que puede ser plausible sin estar documentado. «Desconocido» conserva una pregunta que aún no puede cerrarse. Separar los tres estados evita que una búsqueda termine en una certeza artificial.'),
  section(atlasBlock, 'caso', 'Caso: el nombre coincide, la variante no', 'worked-example',
    'Encuentras el mismo nombre de calibre en una base y en un documento oficial, pero la variante del documento no coincide con el objeto estudiado. Puedes registrar una identificación provisional y buscar una comunicación aplicable; no debes copiar dimensiones ni piezas como si la coincidencia nominal resolviera la variante.'),
  section(atlasBlock, 'actividad', 'Construir una ficha de procedencia', 'checkpoint',
    'Formula una pregunta, elige el tipo de fuente adecuado y registra una afirmación confirmada, una inferencia y un desconocido. Añade qué evidencia podría refutar tu decisión. La actividad evalúa razonamiento documental; no certifica identificación física ni autoriza una intervención.'),
  section(atlasBlock, 'fuentes', 'Fuentes y límites', 'sources',
    'El caso editorial usa una comunicación oficial ETA 6497-2 y bases de datos ya declaradas en el corpus. La curación no copia sus contenidos ni muestra IDs internos. Cada recurso conserva su autoridad limitada; las URLs antiguas y alias se resuelven en el registro de fuentes, no en el texto visible.', { requiredForStudy: false, collapsible: true }),
]

export const ACADEMY_STAGE_1_SECTIONS = {
  'lesson.horology.system': SYSTEM_SECTIONS,
  'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple': SIMPLE_MOVEMENT_SECTIONS,
  'lesson.horology.mechanical-chain': MECHANICAL_SECTIONS,
  'lesson.horology.quartz-chain': QUARTZ_SECTIONS,
  'lesson.horology.functional-equivalence': EQUIVALENCE_SECTIONS,
  'lesson.encyclopedia.history-language.leer-documentacion': DOCUMENT_SECTIONS,
  'lesson.encyclopedia.history-language.medir-el-tiempo': MEASURE_SECTIONS,
  'lesson.advanced.atlas-authority': ATLAS_SECTIONS,
} as const
