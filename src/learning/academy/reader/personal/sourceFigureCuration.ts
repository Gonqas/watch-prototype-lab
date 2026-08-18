import type {
  AcademyReaderSection,
  AcademySectionVisualCuration,
  AcademySourceFigureAsset,
  AcademyVisualCue,
} from '../academyReaderModel'
import { ACADEMY_SOURCE_FIGURE_BY_ID } from './sourceFigures.generated'
import { academySourceSectionWordCount } from './sourcePreservingComposition'
import type { AcademySourcePreservingLessonContext } from './types'

interface FigurePlacement {
  lessonId: string
  assetId: string
  heading: string
  question: string
  application: string
  workedExample: string
  misconception: string
}

type PlacementTemplate = Omit<FigurePlacement, 'lessonId' | 'assetId'>

const forLessons = (
  lessonIds: readonly string[],
  assetId: string,
  template: PlacementTemplate,
): FigurePlacement[] => lessonIds.map((lessonId) => ({ lessonId, assetId, ...template }))

const PLACEMENTS: readonly FigurePlacement[] = [
  ...forLessons([
    'lesson.quartz2035.workstation',
    'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
  ], 'daniels-historical-bench', {
    heading: 'Un banco real como sistema de control',
    question: '¿Qué decisiones del entorno reducen pérdidas, contaminación y posturas inestables?',
    application: 'Divide la imagen en zona de observación, zona de herramientas, contención de piezas y retirada de residuos. La fotografía no impone comprar ese banco: permite reconocer funciones que puedes reproducir a otra escala con una bandeja, buena luz y orden de retorno.',
    workedExample: 'Si una pieza diminuta cae, una superficie despejada y contenida limita el área de búsqueda. Si el banco está cubierto de objetos sin función asignada, la misma caída deja de ser un incidente localizado y se convierte en una búsqueda sin frontera.',
    misconception: 'Un banco costoso no vuelve seguro un proceso desordenado; la seguridad nace de zonas, secuencia y criterios de parada verificables.',
  }),
  ...forLessons([
    'lesson.quartz2035.workstation',
    'lesson.quartz2035.tools',
    'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
  ], 'bulova-grips-bench', {
    heading: 'Postura, apoyos y dirección de la fuerza',
    question: '¿Cómo cambia el control cuando apoyas las manos y alineas la herramienta?',
    application: 'No copies la postura como una coreografía. Observa qué articulaciones quedan apoyadas, dónde está el eje visual y en qué dirección actuaría la herramienta si resbalara. Después traduce esas relaciones a tu altura, visión y mano dominante.',
    workedExample: 'Al girar un tornillo de práctica, una punta alineada y la mano apoyada concentran el movimiento en el giro. Una punta inclinada convierte parte de la fuerza en salida lateral, marca la ranura y puede lanzar la pieza aunque hayas apretado más.',
    misconception: 'Más presión no corrige una herramienta mal ajustada ni una postura sin apoyo.',
  }),
  ...forLessons([
    'lesson.quartz2035.tools',
    'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
  ], 'bulova-tool-family', {
    heading: 'Elegir herramientas por función y geometría',
    question: '¿Qué función cumple cada herramienta y qué daño evita su ajuste correcto?',
    application: 'Clasifica las herramientas por observar, sujetar, girar, apoyar y contener. Para cada una anota superficie de contacto, dirección de carga, ajuste necesario y señal de que debes detenerte.',
    workedExample: 'Dos destornilladores pueden parecer equivalentes. El correcto ocupa la ranura sin tocar sus bordes exteriores; el demasiado estrecho concentra la carga en dos puntos y deja una marca aun cuando el tornillo llegue a girar.',
    misconception: 'Una herramienta pequeña no es automáticamente una herramienta adecuada.',
  }),
  ...forLessons([
    'lesson.quartz2035.tools',
    'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    'lesson.metrology.observe-before-measuring',
    'lesson.metrology.inspection-findings',
    'lesson.encyclopedia.service-tribology.recepcion-y-linea-base',
  ], 'bulova-screw-condition', {
    heading: 'Describir el estado antes de explicar la causa',
    question: '¿Qué diferencias visibles puedes registrar sin convertirlas todavía en un diagnóstico?',
    application: 'Recorre ranura, borde, cara superior y residuo. Escribe observaciones literales —«línea oscura dentro de la ranura», «borde levantado»— y separa después las hipótesis —suciedad, aceite, herramienta inadecuada o golpe—.',
    workedExample: 'Una zona brillante junto a la ranura puede ser una marca de herramienta o un reflejo. Cambiar el ángulo de luz es una prueba discriminante sencilla: si el rasgo se desplaza con el reflejo, todavía no tienes evidencia suficiente de una raya.',
    misconception: 'Reconocer un parecido visual no identifica la sustancia, la causa ni el tratamiento correcto.',
  }),
  ...forLessons([
    'lesson.quartz2035.workstation',
    'lesson.quartz2035.tools',
  ], 'miyota-2035-exploded-train', {
    heading: 'Del banco al movimiento de práctica: MIYOTA 2035',
    question: '¿Qué conjuntos documentados justifican las precauciones de banco y manipulación?',
    application: 'Localiza alimentación, circuito, bobina, estator, rotor y tren. La proximidad de elementos magnéticos, contactos y ruedas explica por qué el área debe estar limpia, por qué no se sopla sobre el movimiento y por qué una herramienta debe apoyarse de forma controlada.',
    workedExample: 'Una fibra visible sobre la platina puede parecer inocua. Si alcanza el tren, cambia de ser un hallazgo superficial a una posible interferencia. La respuesta correcta en esta etapa es registrar y detener, no improvisar un baño o un chorro de aire.',
    misconception: 'El despiece ayuda a localizar riesgos; no convierte la lección inicial en una autorización de desmontaje.',
  }),

  ...forLessons(['lesson.horology.system'], 'toh-watch-exploded', {
    heading: 'El reloj completo por capas',
    question: '¿Dónde termina el movimiento y dónde empiezan indicación, envolvente y uso?',
    application: 'Sigue el apilado desde el movimiento hacia agujas, esfera, cristal, caja y fondo. En cada contacto nombra la interfaz y la función que debe conservar: centrar, apoyar, transmitir, mostrar, proteger o permitir acceso.',
    workedExample: 'Que el movimiento funcione fuera de la caja no demuestra que el reloj completo funcione: una aguja puede rozar el cristal o una tija puede quedar desalineada después del encajado.',
    misconception: 'Un sistema no es la suma de piezas aisladas; son las piezas más sus interfaces y estados.',
  }),
  ...forLessons([
    'lesson.horology.system',
    'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple',
  ], 'toh-mechanical-organs', {
    heading: 'Órganos reales detrás del mapa funcional',
    question: '¿Qué piezas materializan almacenamiento, transmisión, distribución, regulación e indicación?',
    application: 'Relaciona cada color y número con una función, pero permite que una función esté repartida entre varias piezas. Después distingue el flujo de energía hacia delante de la influencia reguladora que vuelve desde el oscilador al escape.',
    workedExample: 'El volante no empuja todo el tren. Su oscilación condiciona cuándo libera el escape; la energía principal sigue procediendo del muelle real a través del tren.',
    misconception: 'Una función no siempre tiene una equivalencia pieza a pieza.',
  }),
  ...forLessons([
    'lesson.horology.mechanical-chain',
    'lesson.horology.functional-equivalence',
    'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple',
  ], 'toh-mechanical-functions', {
    heading: 'Cinco funciones, cinco conjuntos observables',
    question: '¿Cómo se reconoce una función sin confundirla con la forma de una pieza?',
    application: 'Lee de arriba abajo: almacenar, contar y transmitir, distribuir, regular e indicar. Luego pregunta qué entradas y salidas tiene cada conjunto y qué ocurriría si la conexión siguiente quedara bloqueada.',
    workedExample: 'El barrilete puede conservar energía con el tren detenido. Esa situación separa claramente «tener energía almacenada» de «estar entregando movimiento útil».',
    misconception: 'La cadena funcional no implica que todos los órganos giren siempre ni en el mismo sentido.',
  }),
  ...forLessons(['lesson.horology.mechanical-chain'], 'toh-mechanical-energy-path', {
    heading: 'Camino de energía y realimentación mecánica',
    question: '¿Qué avanza hacia las agujas y qué relación temporal vuelve al escape?',
    application: 'Traza primero la energía desde el barrilete hasta el escape. En una segunda pasada sigue la interacción escape–volante. Mantener ambas lecturas separadas evita dibujar al oscilador como si fuera el motor principal.',
    workedExample: 'Si aumenta la fricción del tren, llega menos energía al escape y puede caer la amplitud. La frecuencia propia del oscilador y su amplitud no son el mismo dato, aunque el fallo termine afectando a la marcha.',
    misconception: 'Realimentación reguladora no significa que la energía circule hacia atrás por todo el tren.',
  }),
  ...forLessons([
    'lesson.horology.functional-equivalence',
    'lesson.horology.quartz-chain',
  ], 'toh-quartz-block', {
    heading: 'Cadena funcional de un cuarzo analógico',
    question: '¿Cómo se reparten regulación, conteo y conversión electromecánica?',
    application: 'Compara cada bloque con su equivalente funcional mecánico, no con una pieza de igual forma. El resonador, el circuito divisor, la bobina, el rotor y el tren colaboran para producir una indicación analógica.',
    workedExample: 'El cuarzo aporta una referencia estable, pero no mueve directamente las agujas. El circuito cuenta divisiones, la bobina crea un campo y el rotor transforma ese impulso en giro mecánico.',
    misconception: 'Decir «el cuarzo regula» no convierte al cristal en todo el sistema de control.',
  }),
  ...forLessons([
    'lesson.horology.functional-equivalence',
    'lesson.horology.quartz-chain',
  ], 'toh-quartz-anatomy', {
    heading: 'Anatomía de cuarzo: del bloque a la pieza',
    question: '¿Dónde aparecen físicamente las funciones del diagrama de bloques?',
    application: 'Localiza batería, pistas, circuito, bobina, estator, rotor y ruedas. Observa que la arquitectura rodea la platina y que varias conexiones son eléctricas antes de volver a ser mecánicas.',
    workedExample: 'Una batería correcta no demuestra que exista impulso: contactos, circuito y bobina forman una cadena de evidencia distinta de la inspección del tren.',
    misconception: 'Esta anatomía es representativa; no debe etiquetarse automáticamente como MIYOTA 2035.',
  }),
  ...forLessons(['lesson.encyclopedia.history-language.leer-documentacion'], 'toh-document-dimensioned', {
    heading: 'Qué pregunta puede responder un dibujo técnico',
    question: '¿Cuándo una vista, una cota o una sección tienen autoridad sobre una decisión?',
    application: 'Separa identificación, geometría y procedimiento. Un dibujo acotado puede resolver una dimensión; un despiece puede resolver ubicación y referencia; un manual puede resolver una secuencia. Ninguno hereda automáticamente la autoridad de los otros.',
    workedExample: 'La lista de piezas identifica una rueda, pero no proporciona su altura. El plano puede aportar la altura, pero no demuestra el desgaste de tu unidad. La medición física completa la cadena cuando la decisión depende del objeto real.',
    misconception: 'Que un documento sea oficial no significa que responda cualquier pregunta ni que aplique a cualquier revisión.',
  }),

  ...forLessons([
    'lesson.mechanical.energy',
    'lesson.mechanical.barrel',
    'lesson.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete',
  ], 'toh-barrel-exploded', {
    heading: 'Barrilete: contener, centrar y entregar par',
    question: '¿Qué función cumple tambor, muelle, árbol y tapa durante carga y marcha?',
    application: 'Identifica el anclaje interior y exterior, los apoyos del árbol, la tapa y el dentado. Describe por separado estado del muelle, par transmitido y reserva de marcha: se relacionan, pero no son sinónimos.',
    workedExample: 'Un muelle cargado almacena energía aunque el tren esté bloqueado. Cuando se libera el tren, el barrilete entrega par; la duración resultante depende además de pérdidas, relación y demanda del oscilador.',
    misconception: 'Una ilustración cualitativa del muelle no es una curva medida de par ni una reserva garantizada.',
  }),
  ...forLessons([
    'lesson.mechanical.gear-pair',
    'lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren',
  ], 'toh-pitch-circles', {
    heading: 'Círculos primitivos: la pareja dentada idealizada',
    question: '¿Qué geometría gobierna la relación antes de inspeccionar dientes reales?',
    application: 'Dibuja los círculos primitivos y la línea de centros. Solo después añade dientes, juego y perfil. Esta secuencia separa la relación cinemática ideal de la calidad real del engrane.',
    workedExample: 'Una rueda de 36 dientes movida por un piñón de 12 gira a un tercio de la velocidad del piñón y en sentido opuesto. Compartir eje sería otra relación: igual velocidad angular, no engrane 12/36.',
    misconception: 'El diámetro exterior visible no sustituye al círculo primitivo ni basta para decidir la distancia entre centros.',
  }),
  ...forLessons([
    'lesson.mechanical.train',
    'lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren',
  ], 'toh-intermediate-train', {
    heading: 'Contar un tren eje por eje',
    question: '¿Qué pares engranan y qué ruedas comparten realmente un eje?',
    application: 'Marca cada engrane con una relación y cada unión rígida con igualdad de velocidad angular. Multiplica solo relaciones que forman el camino real y registra el sentido después de cada contacto.',
    workedExample: 'Si A impulsa una rueda intermedia B y B impulsa C, B añade otro cambio de sentido. Cuando solo es intermedia, su número de dientes puede cancelarse en la magnitud total, aunque su geometría siga siendo necesaria para colocar los ejes.',
    misconception: 'Toda rueda dibujada entre entrada y salida no aporta necesariamente un factor independiente a la relación total.',
  }),
  ...forLessons([
    'lesson.mechanical.escapement',
    'lesson.encyclopedia.escapements-chronometry.geometria-del-escape',
  ], 'toh-lever-escapement-anatomy', {
    heading: 'Escape de áncora: contactos y planos',
    question: '¿Dónde ocurren bloqueo, liberación, impulso y seguridad?',
    application: 'Localiza rueda, paletas, áncora, horquilla, rodillo, clavija y dardo. Alterna vista superior y sección para no confundir un solape proyectado con un contacto real.',
    workedExample: 'Durante bloqueo un diente apoya en una cara de paleta. El paso del rodillo mueve la horquilla, libera ese diente y permite un impulso controlado antes de bloquear el siguiente.',
    misconception: 'Reconocer las piezas no demuestra que lock, drop o profundidad sean correctos en un calibre real.',
  }),
  ...forLessons([
    'lesson.encyclopedia.escapements-chronometry.toh-escape-fases',
    'lesson.mechanical.escape-oscillator',
  ], 'toh-lever-escapement-phases', {
    heading: 'Seguir una alternancia del escape',
    question: '¿Qué contacto cambia primero y qué estado debe quedar preparado después?',
    application: 'Elige un diente y síguelo entre fotogramas. Nombra estado inicial, movimiento que libera, superficie que impulsa y condición de seguridad final. Repite desde el lado opuesto sin saltar directamente al nombre de la fase.',
    workedExample: 'La caída no es impulso: es el pequeño recorrido libre entre abandonar una superficie y encontrar el siguiente bloqueo. Confundirlos oculta dónde se pierde control geométrico.',
    misconception: 'Los ángulos de la figura son explicativos y no tolerancias universales de ajuste.',
  }),
  ...forLessons([
    'lesson.mechanical.oscillator',
    'lesson.mechanical.escape-oscillator',
    'lesson.encyclopedia.escapements-chronometry.volante-y-espiral',
  ], 'toh-balance-spring-states', {
    heading: 'Volante y espiral en tres estados',
    question: '¿Qué cambia entre extremo, equilibrio y extremo opuesto?',
    application: 'Compara ángulo del volante y deformación del espiral. Define amplitud como extensión angular y periodo como tiempo de un ciclo completo. Mantén ambas magnitudes separadas al razonar un fallo.',
    workedExample: 'Dos oscilaciones pueden conservar casi el mismo periodo pero tener amplitudes distintas. Menos amplitud señala menos energía en el oscilador; no significa automáticamente que la frecuencia se haya reducido en la misma proporción.',
    misconception: 'Una posición extrema dibujada no es una medición real de amplitud.',
  }),
  ...forLessons([
    'lesson.mechanical.motion-works',
    'lesson.mechanical.keyless',
  ], 'toh-motion-works', {
    heading: 'Minutería y puesta en hora: dos rutas conectadas',
    question: '¿Qué gira durante la marcha normal y qué cambia al corregir desde la corona?',
    application: 'Traza con un color la ruta de marcha hacia las agujas y con otro la ruta manual desde la corona. Marca el punto de acoplamiento y el elemento que permite corregir sin convertir todo el remontuar en tren de marcha.',
    workedExample: 'El cañón de minutos puede recibir el movimiento normal y permitir un deslizamiento controlado al poner en hora. Esa fricción funcional no equivale a un engrane libre ni a una unión totalmente rígida.',
    misconception: 'Tren de rodaje, minutería y remontuar no son tres nombres para el mismo conjunto.',
  }),
  ...forLessons([
    'lesson.mechanical.automatic-calendar',
    'lesson.encyclopedia.complications.automatico-y-reserva',
  ], 'toh-automatic-rotors', {
    heading: 'Masa oscilante no es mecanismo automático completo',
    question: '¿Qué aporta el rotor y qué funciones siguen faltando en la figura?',
    application: 'Compara recorrido limitado y vuelta completa. Después añade mentalmente inversión, reducción, rueda de trinquete y barrilete: son necesarios para convertir movimiento de muñeca en carga útil.',
    workedExample: 'Que el rotor gire demuestra captación de movimiento, pero no prueba que el barrilete cargue. Una avería entre rotor y trinquete conserva el primer fenómeno y pierde el segundo.',
    misconception: 'La reserva de marcha no se deduce de la forma o tamaño aparente del rotor.',
  }),
  ...forLessons([
    'lesson.mechanical.automatic-calendar',
    'lesson.encyclopedia.complications.calendarios',
  ], 'toh-simple-calendar', {
    heading: 'Calendario simple como secuencia de estados',
    question: '¿Cómo se acumula, libera y retiene el cambio de fecha?',
    application: 'Sigue rueda de arrastre, elemento de fecha y resorte de posicionamiento. Describe el estado antes del salto, durante la liberación y después del asentamiento.',
    workedExample: 'El resorte no cuenta los días: posiciona el indicador después de recibir la acción temporizada. Si pierde fuerza, el disco puede quedar entre dos fechas aunque el tren de 24 horas siga girando.',
    misconception: 'Este esquema de fecha simple no demuestra el funcionamiento de un calendario anual o perpetuo.',
  }),

  ...forLessons([
    'lesson.horology.failure-prediction',
    'lesson.encyclopedia.service-tribology.diagnostico-y-control-final',
    'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas',
  ], 'tm-trace-baseline', {
    heading: 'Leer una traza histórica sin diagnosticar por parecido',
    question: '¿Qué rasgos de pendiente, separación y continuidad puedes convertir en datos?',
    application: 'Registra posición, duración y aspecto antes de proponer causa. Estas trazas son históricas: úsalas para aprender el método observación → hipótesis → prueba, no como plantilla de aceptación de un instrumento moderno.',
    workedExample: 'Una pendiente distinta entre posiciones sugiere sensibilidad posicional. La prueba siguiente compara condiciones controladas; no basta con escoger de una lista la causa que más se parece.',
    misconception: 'Una autoridad histórica aporta método y casos, no límites actuales de cronocomparador.',
  }),
  ...forLessons([
    'lesson.horology.failure-prediction',
    'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas',
  ], 'tm-trace-double-line', {
    heading: 'Línea doble: síntoma, hipótesis y prueba',
    question: '¿Qué explicación alternativa sobrevive a una segunda observación independiente?',
    application: 'Describe dos familias de marcas y su separación. Formula al menos dos causas posibles y para cada una una observación que podría refutarla.',
    workedExample: 'Si sospechas dos impulsos acústicos distintos, cambia orientación o punto de captación y observa si la separación permanece. Si desaparece, la evidencia favorece otra explicación; si persiste, todavía necesitas inspección mecánica.',
    misconception: 'El manual enumera posibilidades; no convierte la línea doble en una causa única.',
  }),
  ...forLessons([
    'lesson.encyclopedia.service-tribology.diagnostico-y-control-final',
    'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas',
  ], 'tm-trace-rate-interference', {
    heading: 'Cambio de marcha frente a interferencia irregular',
    question: '¿Qué diferencia visual obliga a elegir pruebas distintas?',
    application: 'Compara una deriva relativamente continua con discontinuidades o ruido. Separa comportamiento sistemático de evento intermitente antes de decidir dónde observar.',
    workedExample: 'Una curva suave que cambia con la posición sugiere una dependencia estable. Un salto irregular que aparece al mover agujas puede orientar la prueba hacia un roce; ninguno de los dos patrones es una reparación.',
    misconception: 'Dos relojes con mala marcha no comparten necesariamente el mismo mecanismo causal.',
  }),
  ...forLessons([
    'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion',
    'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control',
  ], 'daniels-jewel-concentricity', {
    heading: 'Concentricidad: la cara de apoyo también es una referencia',
    question: '¿Cómo se transmite un pequeño error de alineación al asiento de una piedra?',
    application: 'Identifica eje de giro, cara de apoyo y punto de comprobación. Una medición útil declara cuál de esas geometrías actúa como referencia y en qué orientación se toma.',
    workedExample: 'Una piedra puede parecer centrada desde arriba y quedar inclinada por una cara de apoyo fuera de escuadra. Girar y observar variación distingue descentramiento fijo de error aparente por orientación.',
    misconception: 'Que una pieza entre en su alojamiento no demuestra concentricidad, altura ni libertad de giro.',
  }),
  ...forLessons([
    'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes',
    'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control',
  ], 'daniels-oil-sink-geometry', {
    heading: 'Geometría del depósito de aceite',
    question: '¿Qué superficies pretenden contener lubricante y mantenerlo separado del contacto no deseado?',
    application: 'Sigue la sección de la piedra y distingue depósito, domo y zona de contacto. La forma explica una función de retención; no determina por sí sola producto ni cantidad.',
    workedExample: 'Más lubricante no compensa una geometría contaminada o un asiento incorrecto. El exceso puede migrar; la escasez puede dejar el contacto sin película. La decisión exige documentación moderna y observación real.',
    misconception: 'Una figura histórica de geometría no es una tabla de lubricación.',
  }),

  ...forLessons([
    'lesson.miyota8215.identify',
    'lesson.miyota8215.documentation',
  ], 'miyota-8215-parts-list', {
    heading: 'Lista de piezas: autoridad de nombres y referencias',
    question: '¿Qué puede confirmar una lista que no muestra la ubicación de las piezas?',
    application: 'Busca nombre vigente, referencia y cantidad. Después enlaza esa identidad con una vista explosionada separada. Si ambos documentos difieren, registra revisión y no mezcles datos silenciosamente.',
    workedExample: 'La referencia 025-670 puede identificarse en la lista, pero su posición y relación con el tren se verifican en otra figura. Copiar el nombre desde una fuente antigua puede arrastrar una terminología ya corregida.',
    misconception: 'Lista y despiece son autoridades complementarias, no el mismo documento.',
  }),
  ...forLessons([
    'lesson.miyota8215.identify',
    'lesson.miyota8215.documentation',
  ], 'miyota-8215-specification', {
    heading: 'Especificación: dato nominal, condición y límite',
    question: '¿Qué números oficiales describen el calibre y cuáles dependen del montaje completo?',
    application: 'Lee calibre, altura, frecuencia, rubíes, reserva y márgenes con unidad y nota. Conserva la diferencia entre dato nominal de familia y resultado medido en tu unidad.',
    workedExample: 'Los márgenes sobre agujas y bajo movimiento son entradas de diseño. No pueden sumarse para compensar una interferencia en una sola cara: cada margen debe permanecer no negativo por separado.',
    misconception: 'Un valor publicado no demuestra automáticamente el estado ni la compatibilidad física de tu ejemplar.',
  }),
  ...forLessons([
    'lesson.miyota8215.documentation',
    'lesson.miyota8215.architecture',
    'lesson.miyota8215.automatic',
    'lesson.miyota8215.barrel-energy',
    'lesson.miyota8215.train',
    'lesson.miyota8215.escapement-oscillator',
    'lesson.miyota8215.plan-disassembly',
    'lesson.miyota8215.guided-disassembly',
    'lesson.miyota8215.assisted-free-disassembly',
    'lesson.miyota8215.inspection',
    'lesson.miyota8215.assembly-verification',
    'lesson.miyota8215.diagnosis-project',
  ], 'miyota-8215-exploded-train', {
    heading: 'MIYOTA 8215: lado del tren y del automático',
    question: '¿Qué relación espacial puede verificarse y qué procedimiento sigue sin estar autorizado?',
    application: 'Orienta el movimiento por rotor, volante y tija. Localiza automático, barrilete, tren y escape, y usa nombres de la lista vigente. Los marcadores AO muestran puntos y códigos documentados; no indican por sí solos cantidad, técnica o par.',
    workedExample: 'El chart muestra qué piezas se superponen y un orden relativo de capas. Eso ayuda a planificar dependencias, pero no resuelve cómo liberar un muelle cargado, dónde apoyar la herramienta o qué resistencia debería sentirse.',
    misconception: 'Un assembly–disassembly chart aporta estructura y orden relativo; no es una secuencia física completa y segura.',
  }),
  ...forLessons([
    'lesson.miyota8215.documentation',
    'lesson.miyota8215.architecture',
    'lesson.miyota8215.winding-setting',
    'lesson.miyota8215.plan-disassembly',
    'lesson.miyota8215.guided-disassembly',
    'lesson.miyota8215.assisted-free-disassembly',
    'lesson.miyota8215.assembly-verification',
  ], 'miyota-8215-exploded-dial', {
    heading: 'MIYOTA 8215: lado de esfera, remontuar y calendario',
    question: '¿Qué conjuntos quedan ocultos al observar solo el lado de puentes?',
    application: 'Localiza tija, puesta en hora, minutería y calendario. Relaciona cada conjunto con la posición externa de corona sin deducir una variante de esfera que el documento no identifique.',
    workedExample: 'La primera posición de corona produce una función visible de fecha, pero el chart revela que intervienen varias piezas internas. La función externa no identifica por sí sola cuál de ellas explica un fallo.',
    misconception: 'La vista explosionada sitúa piezas; no demuestra holgura, desgaste, lubricación ni ajuste real.',
  }),
  ...forLessons(['lesson.miyota8215.winding-setting'], 'miyota-8215-user-manual', {
    heading: 'Corona y fecha: estados externos autorizados',
    question: '¿Qué acción permite el fabricante en cada posición de corona?',
    application: 'Distingue posición normal, primera y segunda extracción. Conserva la advertencia horaria de cambio de fecha como condición de parada, no como un detalle opcional.',
    workedExample: 'Si el usuario intenta corregir fecha dentro de la franja desaconsejada, la respuesta segura es salir de esa condición y seguir el manual. El despiece interno no anula una advertencia de uso oficial.',
    misconception: 'El manual de usuario describe operación externa, no una intervención de servicio.',
  }),
  ...forLessons(['lesson.miyota8215.winding-setting'], 'miyota-8215-stem-drawing', {
    heading: 'Tija 065-212: eje, rosca y longitud funcional',
    question: '¿Qué parte de la interfaz corona–tubo–tija resuelve el plano del movimiento?',
    application: 'Separa la geometría documentada de la tija de las dimensiones aún pendientes de corona, tubo y caja. Registra rosca, hombros y eje sin convertirlos en una longitud final de montaje.',
    workedExample: 'La rosca puede coincidir y la corona seguir quedando mal situada porque la longitud funcional depende de la caja y del tubo. Compatibilidad de rosca no equivale a compatibilidad del conjunto.',
    misconception: 'Una sola cota de tija no resuelve alineación, recorrido y posición exterior.',
  }),

  ...forLessons([
    'lesson.capstone.design.requirements',
    'lesson.mechanical.final-project',
  ], 'daniels-movement-template', {
    heading: 'De requisitos a ocupación física',
    question: '¿Qué espacios y dependencias deben reservarse antes de definir una solución?',
    application: 'Usa los círculos como ejemplo de reserva espacial: centros, barridos, puentes, indicación y acceso. En tu proyecto los números vendrán de fuentes o mediciones propias, no de esta plantilla histórica.',
    workedExample: 'Dos ruedas caben por diámetro y aun chocan axialmente con un puente. El plano necesita vistas radiales y axiales; una sola planta no cierra el requisito.',
    misconception: 'Una plantilla de diseño es un método para ordenar restricciones, no una geometría reutilizable.',
  }),
  ...forLessons([
    'lesson.capstone.design.acquired-movement',
    'lesson.capstone.design.capstone',
    'lesson.capstone.validation.calibre-transfer',
  ], 'miyota-8215-drawing', {
    heading: 'Plano provisional del movimiento adquirido',
    question: '¿Qué entradas geométricas puedes usar y cómo conservas su estado provisional?',
    application: 'Extrae solo la cota que responda a una pregunta concreta y guarda unidad, vista, revisión y nota de provisionalidad. Mantén separado el valor documental de la medición del ejemplar físico.',
    workedExample: 'El diámetro nominal puede alimentar una comprobación de envolvente. No valida por sí solo el soporte, la posición de tija ni el juego axial; esas interfaces necesitan datos independientes.',
    misconception: 'Oficial no significa definitivo: el propio plano declara que puede cambiar.',
  }),
  ...forLessons([
    'lesson.encyclopedia.cases-water.arquitectura-de-caja',
    'lesson.encyclopedia.cases-water.toh-exterior-interfaces',
  ], 'toh-exterior-exploded', {
    heading: 'Exterior del reloj: capas y funciones',
    question: '¿Qué interfaz centra, cuál apoya, cuál retiene y cuál pretende sellar?',
    application: 'Recorre cristal, bisel, carrura, esfera, movimiento, aro y fondo. Para cada contacto escribe dos caras, dirección de carga y condición de desmontaje.',
    workedExample: 'El aro puede centrar radialmente el movimiento y apoyarlo axialmente. Una cota que resuelve el centrado no demuestra que la altura de tija quede alineada.',
    misconception: 'El diámetro total de la caja no define sus alojamientos interiores.',
  }),
  ...forLessons(['lesson.encyclopedia.cases-water.arquitectura-de-caja'], 'toh-movement-casing', {
    heading: 'Centrar y retener el movimiento',
    question: '¿Qué soluciones separan apoyo axial, centrado radial y retención?',
    application: 'Compara anillo, tornillo y apoyo. Convierte cada dibujo en una lista de interfaces y datos necesarios antes de evaluar un soporte concreto.',
    workedExample: 'Un aro con diámetro interior correcto puede girar dentro de la caja si falta una referencia antigiro. Ese dato es categórico, no una dimensión que deba forzarse en una suma numérica.',
    misconception: 'La ausencia de interferencia no demuestra retención ni orientación.',
  }),
  ...forLessons(['lesson.encyclopedia.cases-water.arquitectura-de-caja'], 'toh-case-architectures', {
    heading: 'Arquitecturas de una, dos y tres piezas',
    question: '¿Cómo cambia el acceso y la ruta de cierre al cambiar la arquitectura?',
    application: 'Dibuja las uniones entre cristal, bisel, carrura y fondo. Cada arquitectura crea dependencias distintas de montaje y mantenimiento.',
    workedExample: 'En una caja de tres piezas, corregir el fondo no resuelve una fuga por el cristal. La validación debe conservar rutas separadas.',
    misconception: 'Más piezas no implica automáticamente más o menos hermeticidad.',
  }),
  ...forLessons([
    'lesson.encyclopedia.cases-water.corona-tubo-y-tija',
  ], 'toh-crowns-seals', {
    heading: 'Corona, tubo y tija como tres interfaces',
    question: '¿Qué dato pertenece a alineación, qué dato a recorrido y cuál a sellado?',
    application: 'Separa eje de tija, longitud funcional, rosca, retención de corona, tubo y junta. No permitas que una compatibilidad de rosca compense una desalineación.',
    workedExample: 'Una tija entra en la corona y aun puede trabajar inclinada respecto al movimiento. La rosca confirma una interfaz; la coaxialidad y la altura confirman otras.',
    misconception: 'La cadena de mando no se resuelve con una sola longitud.',
  }),
  ...forLessons([
    'lesson.encyclopedia.cases-water.toh-exterior-interfaces',
    'lesson.capstone.design.capstone',
  ], 'toh-sealed-case-section', {
    heading: 'Sección axial y rutas independientes',
    question: '¿Qué margen pertenece al frente y cuál a la parte posterior?',
    application: 'Fija una referencia geométrica y calcula por separado espacio sobre agujas, asiento de esfera, apoyo del movimiento y cierre posterior. Cada margen debe superar su propio criterio.',
    workedExample: 'Un margen de +0,2 mm delante no compensa una interferencia de −0,1 mm detrás. Sumarlos daría una falsa apariencia de compatibilidad.',
    misconception: 'Las holguras de interfaces distintas no son una bolsa común de espacio.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera'], 'toh-dials-feet', {
    heading: 'Esfera: asiento, pies, ventana y espacio posterior',
    question: '¿Qué referencias deben permanecer coherentes dentro de una misma variante?',
    application: 'Registra centro, diámetro, apertura visible, pies por radio y ángulo, ventana y espesor. Compara solo documentos de la misma variante 3H o 6H.',
    workedExample: 'Una ventana de fecha puede coincidir radialmente y quedar desplazada angularmente. Ambas condiciones deben verificarse sin mezclar una esfera 33E con una 36E.',
    misconception: 'Una esfera no es compatible solo porque cubra el movimiento.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera'], 'daniels-dial-template', {
    heading: 'Plantilla de esfera como mapa de dependencias',
    question: '¿Cómo se relacionan centro de agujas, indicaciones y zonas ocupadas?',
    application: 'Usa la figura para aprender a dibujar referencias comunes. Sustituye después todas sus geometrías por datos aplicables al proyecto.',
    workedExample: 'Mover una subesfera para resolver el diseño gráfico puede invadir un puente bajo la esfera. La plantilla debe conectar ambas caras, no solo la composición visible.',
    misconception: 'La figura histórica no es un diseño transferible al 8215.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste'], 'toh-hands-tubes', {
    heading: 'Agujas: agujero, tubo, hombro y barrido',
    question: '¿Qué dimensiones y estados componen un ajuste funcional?',
    application: 'Para cada aguja registra diámetro de poste, geometría del tubo, profundidad, altura final, longitud y plano de barrido. Comprueba interferencias en varias posiciones angulares.',
    workedExample: 'Una aguja puede asentarse firmemente y rozar la siguiente durante parte del giro. El diámetro resolvió retención; la altura y la forma siguen abiertas.',
    misconception: 'Ajustar al poste no equivale a funcionar sin interferencia.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste'], 'daniels-hands-clearance', {
    heading: 'Cadena axial de las agujas',
    question: '¿Qué plano sirve de referencia para cada altura?',
    application: 'Dibuja esfera, ruedas de indicación, tubos y planos de agujas. Evita sumar alturas absolutas como si fueran espesores; primero conviértelas a distancias respecto de la misma referencia.',
    workedExample: 'Dos alturas medidas desde caras distintas no pueden restarse sin transformar sus referencias. El número puede parecer correcto y representar una geometría imposible.',
    misconception: 'Una cadena dimensional solo es válida cuando dirección, unidad y referencia son coherentes.',
  }),
  ...forLessons(['lesson.encyclopedia.cases-water.cristales-y-biseles'], 'toh-crystal-seats', {
    heading: 'Cristal y bisel: perfil, asiento y altura',
    question: '¿Qué debe conocerse además del diámetro exterior?',
    application: 'Identifica superficie de apoyo, retención, perfil de borde y espacio interior. Añade después datos de bisel, junta y proveedor antes de afirmar ajuste.',
    workedExample: 'Dos cristales de igual diámetro pueden necesitar asientos distintos por su perfil y espesor. La coincidencia nominal de diámetro no cierra la interfaz.',
    misconception: 'Un precedente histórico de asiento no es una especificación comercial actual.',
  }),
  ...forLessons(['lesson.encyclopedia.cases-water.toh-materiales-exterior'], 'toh-gaskets-cement', {
    heading: 'Juntas y rutas de fuga',
    question: '¿Dónde debe mantenerse continuidad de contacto o material de sellado?',
    application: 'Dibuja rutas separadas por cristal, corona y fondo. Para cada una registra geometría, material previsto, compresión o unión, preparación y ensayo real.',
    workedExample: 'Una junta nueva puede fallar si el alojamiento no centra o la compresión es irregular. Material y geometría forman una sola condición de funcionamiento.',
    misconception: 'La selección de material no acredita hermeticidad sin montaje y ensayo documentados.',
  }),
  ...forLessons([
    'lesson.capstone.design.capstone',
    'lesson.mechanical.final-project',
  ], 'daniels-axial-stack', {
    heading: 'Cadena axial: cotas y márgenes sin compensación falsa',
    question: '¿Qué alturas deben expresarse desde una referencia común?',
    application: 'Convierte cotas absolutas a espesores o posiciones comparables. Calcula por separado cada margen crítico y conserva el origen de cada entrada.',
    workedExample: 'Una altura de poste medida desde platina y una altura de cristal medida desde bisel no forman una resta válida hasta relacionar platina y bisel mediante la caja y el soporte.',
    misconception: 'Una suma que termina en cero no demuestra compatibilidad si oculta una interferencia intermedia.',
  }),
  ...forLessons(['lesson.capstone.validation.calibre-transfer'], 'miyota-8215-specification', {
    heading: 'Transferir el método, no las cifras',
    question: '¿Qué parte del expediente sobrevive al cambiar de calibre?',
    application: 'Conserva preguntas, tipos de documento, referencias, unidades, criterios de conflicto y pruebas. Sustituye todas las cifras y variantes por el paquete oficial del nuevo calibre.',
    workedExample: 'El nuevo movimiento puede compartir diámetro nominal y cambiar altura de tija, postes o soporte. El método detecta esas diferencias precisamente porque no hereda los números del 8215.',
    misconception: 'Parecido dimensional no es equivalencia documental ni física.',
  }),

  ...forLessons([
    'lesson.encyclopedia.service-tribology.diagnostico-y-control-final',
    'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas',
  ], 'tm-trace-irregular-locking', {
    heading: 'Traza irregular: una pista que exige confirmación',
    question: '¿Qué observación independiente necesitarías antes de atribuir la irregularidad al bloqueo del escape?',
    application: 'Describe continuidad, dispersión y diferencias entre las bandas A y B. Conserva después la atribución histórica del pie como hipótesis de la fuente y diseña una comprobación separada del escape; no conviertas el parecido en veredicto.',
    workedExample: 'Una traza rugosa puede orientar la inspección hacia bloqueo, piedra o pasador, pero también puede compartir apariencia con contaminación o captación deficiente. La hipótesis gana fuerza solo si otra observación reproduce el mecanismo propuesto.',
    misconception: 'El título causal de una figura histórica no demuestra que todo patrón visual parecido tenga la misma causa.',
  }),
  ...forLessons(['lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control'], 'daniels-jewel-height', {
    heading: 'Profundidad de una piedra: primero se fija la referencia',
    question: '¿Qué cara actúa como datum y qué elemento limita el recorrido del empujador?',
    application: 'Identifica la cara de la platina, la cara del empujador y el tope de la herramienta. Distingue el ajuste previo mostrado de la comprobación posterior de una piedra ya asentada.',
    workedExample: 'Si el tope se ajusta desde una cara con suciedad o rebaba, el recorrido puede repetirse y aun producir una altura equivocada. Repetibilidad sin una referencia válida no garantiza exactitud.',
    misconception: 'La Fig. 353 no muestra la piedra terminada ni convierte su valor histórico en una tolerancia universal.',
  }),
  ...forLessons(['lesson.encyclopedia.math-physics-metrology.toh-contar-tren'], 'daniels-gear-ratio', {
    heading: 'Mismo cociente, geometría distinta',
    question: '¿Por qué una relación numérica correcta puede corresponder a una pareja que no engrana?',
    application: 'Compara círculos ideales, pareja de 32/8 dientes y ejemplo incorrecto. Calcula 32/8 y después verifica paso, círculos primitivos y distancia entre centros como condiciones independientes.',
    workedExample: 'Dos ruedas pueden conservar 4:1 y fallar porque el paso del diente grande no entra en el hueco del pequeño. El cociente responde velocidad; la geometría responde posibilidad de contacto.',
    misconception: 'Una división correcta no valida módulo, perfil, centro, juego ni calidad real del engrane.',
  }),
  ...forLessons(['lesson.mechanical.gear-pair'], 'daniels-depthing-tool', {
    heading: 'Del centro nominal al engrane comprobado',
    question: '¿Qué añade una herramienta de depthing que no aporta el cociente de dientes?',
    application: 'Observa cómo mantiene paralelos ambos ejes mientras permite variar su separación. Formula criterios observables —giro uniforme, ausencia de agarrotamiento y caída— sin atribuir a la imagen una sensibilidad que no demuestra.',
    workedExample: 'Una distancia calculada puede producir la relación esperada y un contacto demasiado profundo. Probar el engrane separa coherencia cinemática de funcionamiento físico.',
    misconception: 'La herramienta no convierte una apreciación visual en tolerancia ni sustituye la medición de la pareja real.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste'], 'daniels-hands-shaping', {
    heading: 'Conformado de una aguja como cadena de referencias',
    question: '¿Qué operación prepara la referencia necesaria para la siguiente?',
    application: 'Lee los seis estados sin ejecutarlos: orificio central, escalones, tubo, bisel, contorno y curvatura. En cada transición registra qué superficie debe conservarse para no perder centro, espesor o simetría.',
    workedExample: 'Si se termina el contorno antes de estabilizar el centro y las caras, una corrección posterior del tubo puede desplazar la geometría visible. El orden reduce grados de libertad, no sustituye destreza.',
    misconception: 'Una secuencia dibujada no acredita fabricación física, tolerancias ni seguridad de taller.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste'], 'daniels-hand-grip', {
    heading: 'Sujetar el centro y apoyar el vástago',
    question: '¿Cómo se evita que una aguja larga flexe o se marque mientras queda accesible la zona de trabajo?',
    application: 'Localiza el portabrocas manual, el papel o protección de las mordazas y la ranura de apoyo. Dibuja la ruta de la fuerza desde la herramienta hasta ambos apoyos.',
    workedExample: 'Sujetar solo el extremo obliga al vástago a trabajar como palanca. Añadir un apoyo próximo reduce flexión, pero una ranura contaminada todavía puede rayar la superficie.',
    misconception: 'La figura explica relaciones de apoyo; no prescribe fuerza, abrasivo ni una operación segura sin práctica supervisada.',
  }),
  ...forLessons(['lesson.encyclopedia.cases-water.arquitectura-de-caja'], 'daniels-case-sections', {
    heading: 'El perfil interior se fabrica y se galga',
    question: '¿Qué caras del bisel se crean por etapas y desde dónde se comprueba la altura del fondo?',
    application: 'En la Fig. 684 sigue A, B y C como estados de conformado; en la 685 identifica las referencias del galgado axial. Relaciona cada cara con centrar, apoyar o retener sin inferir sellado.',
    workedExample: 'La silueta exterior puede estar terminada y el escalón interior seguir demasiado profundo. Una comprobación axial responde una pregunta diferente de la apariencia exterior.',
    misconception: 'Estas secciones históricas de fabricación no demuestran hermeticidad, tolerancias ni presión admisible.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera'], 'daniels-dial-feet', {
    heading: 'Pies de esfera: posición y método de retención',
    question: '¿Qué cambia entre preparar el pie y retenerlo después contra la platina?',
    application: 'Compara los cuatro dibujos por posición del pie, preparación para soldadura, dirección del tornillo y forma de atraer la esfera hacia su asiento. Mantén fabricación y montaje como decisiones separadas.',
    workedExample: 'Un pie puede estar en la posición angular correcta y deformar la esfera si el tornillo tira lateralmente o si su longitud impide el asiento. Ubicación y retención deben verificarse por separado.',
    misconception: 'Las opciones históricas no recomiendan soldar ni modificar una esfera real sin proceso, material y práctica especializados.',
  }),
  ...forLessons(['lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera'], 'miyota-8215-dial-drawing', {
    heading: '8215-33E: un paquete coherente de referencias',
    question: '¿Qué cotas pertenecen conjuntamente a la variante 33E y no deben mezclarse con 36E?',
    application: 'Lee primero la cabecera CONFIDENTIAL y provisional. Después registra centro, pies DH1/DH2, ventana, orientación 3H/6H/9H/12H y sección usando la misma revisión y unidad.',
    workedExample: 'Tomar la ventana de 33E y los pies de 36E puede producir dos grupos de números individualmente oficiales y una esfera imposible. La identidad de variante acompaña a cada cota.',
    misconception: 'El plano no autoriza redistribución ni demuestra ajuste físico de una esfera adquirida.',
  }),
  ...forLessons(['lesson.capstone.design.acquired-movement'], 'miyota-8215-holder-drawing', {
    heading: 'Aro 500-710: interfaz radial y axial',
    question: '¿Qué superficies del aro centran, apoyan y orientan el movimiento dentro de otra envolvente?',
    application: 'Lee primero la cabecera CONFIDENTIAL y provisional. Separa diámetros interior/exterior, altura, rebajes y referencias angulares; enlaza cada grupo a una función sin sumar holguras de interfaces distintas.',
    workedExample: 'Un diámetro exterior compatible con la caja no demuestra que el movimiento quede a la altura correcta. El aro puede resolver centrado radial y fallar apoyo axial o posición de tija.',
    misconception: 'El plano del aro no autoriza redistribución ni acredita compatibilidad con una caja de proveedor sin sus tolerancias y una prueba física.',
  }),
  ...forLessons([
    'lesson.quartz2035.documentation',
    'lesson.quartz2035.anatomy',
  ], 'miyota-2035-parts', {
    heading: 'MIYOTA 2035: identidad antes de ubicación',
    question: '¿Qué confirma una lista de piezas y qué pregunta necesita todavía el despiece?',
    application: 'Relaciona nombre y referencia de batería, circuito, bobina, estator, rotor y tren. Conserva la lista como autoridad de identidad y usa una vista explosionada separada para ubicación y relación espacial.',
    workedExample: 'La lista identifica el rotor magnetizado 285-202, pero no muestra su posición respecto del estator. Combinar lista y despiece cierra ambas preguntas sin exigir a un documento la función del otro.',
    misconception: 'Una referencia correcta no demuestra estado, ubicación, compatibilidad entre revisiones ni procedimiento de servicio.',
  }),
] as const

const PLACEMENTS_BY_LESSON = new Map<string, FigurePlacement[]>()
const PLACEMENT_BY_SECTION = new Map<string, FigurePlacement>()

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function sectionId(lessonId: string, assetId: string) {
  return `reader.section.${lessonId.replace(/^lesson\./, 'block.')}.014k-fuente-${slug(assetId)}`
}

for (const placement of PLACEMENTS) {
  const entries = PLACEMENTS_BY_LESSON.get(placement.lessonId) ?? []
  if (!entries.some(({ assetId }) => assetId === placement.assetId)) entries.push(placement)
  PLACEMENTS_BY_LESSON.set(placement.lessonId, entries)
  PLACEMENT_BY_SECTION.set(sectionId(placement.lessonId, placement.assetId), placement)
}

function glossaryTerms(markdown: string) {
  return [...new Set([...markdown.matchAll(/\{\{term:([^}]+)\}\}/g)].map((match) => match[1]))]
}

function sourceLocator(asset: AcademySourceFigureAsset) {
  return [asset.source.sourceId, asset.source.page, asset.source.figure, asset.source.locator].filter(Boolean).join(' · ')
}

function markdownFor(placement: FigurePlacement, asset: AcademySourceFigureAsset) {
  return [
    `Esta figura se incorpora para responder una pregunta concreta: **${placement.question}** No está aquí como decoración ni reemplaza el texto; actúa como evidencia visual que debes leer de forma controlada.`,
    '### Lectura guiada',
    `1. **Orienta la fuente.** Identifica vista, escala relativa y elementos que permanecen fijos. ${asset.whatToLookFor}`,
    `2. **Relaciona sin saltar a la causa.** ${placement.application}`,
    `3. **Formula una comprobación.** Explica con tus palabras qué observación de la figura apoya la idea principal y qué dato adicional necesitarías para aplicarla a un reloj real.`,
    '### Caso razonado',
    placement.workedExample,
    '### Límite y error cercano',
    `${placement.misconception} **Límite declarado de la figura:** ${asset.limitation}`,
    '### Antes de continuar',
    `Responde sin mirar el pie: **${placement.question}** Si tu respuesta depende de una medida, una variante o un estado que la figura no contiene, anótalo como dato pendiente en vez de inventarlo.`,
  ].join('\n\n')
}

function pendingCue(lessonId: string, id: string, title: string): AcademyVisualCue {
  return {
    cueId: `reader.cue.${id}`,
    lessonId,
    sectionId: id,
    order: 0,
    purpose: 'locate',
    kind: 'none',
    sourceType: 'none',
    visualDecision: 'essential-inline-image',
    selectorIds: [],
    isolation: [],
    isolationIds: [],
    transparencyById: {},
    labels: [],
    labelDefinitions: [],
    pedagogicalQuestion: title,
    caption: title,
    altText: 'La figura se resuelve mediante la curación de evidencia fuente.',
    fidelity: 'not-applicable',
    limitations: ['La imagen no se activa sin asset local y trazabilidad completa.'],
    expectedObservation: 'Pendiente de enlazar el asset local validado.',
    readingModePolicy: 'inline-essential',
    semanticSpecificity: 'section-specific',
    evidenceOfSpecificity: [],
    reviewStatus: 'codex-assisted',
    implementationStatus: 'unavailable',
    provenance: 'editorial-decision',
    sourceRole: 'none',
    curationStatus: 'available-pending',
  }
}

function figureSection(
  placement: FigurePlacement,
  asset: AcademySourceFigureAsset,
  sources: readonly AcademyReaderSection[],
): AcademyReaderSection {
  const first = sources[0]
  if (!first) throw new Error(`No existe sección fuente para ${placement.lessonId}.`)
  const id = sectionId(placement.lessonId, placement.assetId)
  const markdown = markdownFor(placement, asset)
  return {
    sectionId: id,
    lessonId: placement.lessonId,
    blockId: first.blockId,
    sourceBlockId: first.sourceBlockId,
    sourceBlockIds: [...new Set(sources.flatMap(({ sourceBlockIds, sourceBlockId }) => sourceBlockIds.length ? sourceBlockIds : [sourceBlockId]))],
    sourceBlockVersion: first.sourceBlockVersion,
    order: 0,
    ordinal: 0,
    heading: placement.heading,
    headingLevel: 2,
    title: placement.heading,
    role: 'visual-anatomy',
    markdown,
    wordCount: academySourceSectionWordCount(markdown),
    visualCueIds: [`reader.cue.${id}`],
    glossaryTermIds: glossaryTerms(markdown),
    conceptIds: [...new Set(sources.flatMap(({ conceptIds = [] }) => conceptIds))],
    claimIds: [...new Set(sources.flatMap(({ claimIds = [] }) => claimIds))],
    sourceLocators: [...new Set([...sources.flatMap(({ sourceLocators = [] }) => sourceLocators), sourceLocator(asset)])],
    requiredForStudy: true,
    collapsible: false,
    defaultExpanded: true,
    curationMethod: 'pilot-override',
    curationConfidence: 'high',
    visualCue: pendingCue(placement.lessonId, id, placement.heading),
  }
}

function reorder(sections: readonly AcademyReaderSection[]) {
  return sections.map((section, index) => ({
    ...section,
    order: index + 1,
    ordinal: index + 1,
    visualCue: { ...section.visualCue, order: index + 1 },
  }))
}

/** Añade evidencia visual solo a las lecciones explícitas de etapas 0–5. */
export function applyAcademySourceFigureCuration(context: AcademySourcePreservingLessonContext): AcademyReaderSection[] {
  const placements = PLACEMENTS_BY_LESSON.get(context.lessonId)
  if (!placements?.length || context.currentSections.length === 0) return [...context.currentSections]
  const additions = placements.map((placement) => {
    const asset = ACADEMY_SOURCE_FIGURE_BY_ID.get(placement.assetId)
    if (!asset) throw new Error(`Falta el asset fuente ${placement.assetId} para ${placement.lessonId}.`)
    return figureSection(placement, asset, context.authoredSections.length ? context.authoredSections : context.currentSections)
  })
  const substantive = context.currentSections.filter(({ role }) => !['reference', 'sources', 'limitations'].includes(role))
  const references = context.currentSections.filter((section) => !substantive.includes(section))
  return reorder([...substantive, ...additions, ...references])
}

interface VisualInput {
  lessonId: string
  section: AcademyReaderSection
  contentHash: string
  sectionHash: string
  sourceIds: string[]
}

export function academySourceFigureVisualCuration(input: VisualInput): AcademySectionVisualCuration | undefined {
  const placement = PLACEMENT_BY_SECTION.get(input.section.sectionId)
  if (!placement || placement.lessonId !== input.lessonId) return undefined
  const asset = ACADEMY_SOURCE_FIGURE_BY_ID.get(placement.assetId)
  if (!asset) return undefined
  const calibreSpecific = placement.assetId.startsWith('miyota-')
  return {
    curationId: `curation.0.14k.source-figure.${slug(placement.lessonId)}.${slug(placement.assetId)}`,
    lessonId: input.lessonId,
    sectionId: input.section.sectionId,
    contentHash: input.contentHash,
    sectionHash: input.sectionHash,
    pedagogicalPurpose: `Leer una figura fuente para ${placement.question.toLowerCase()}`,
    pedagogicalQuestion: placement.question,
    essentialConcepts: [placement.heading, asset.whatToLookFor],
    visualDecision: 'essential-inline-image',
    visualDesignId: `visual.source-figure.${placement.assetId}.v1`,
    visualKind: 'image',
    imageAsset: asset,
    selectorIds: [],
    isolationIds: [],
    transparencyById: {},
    labelDefinitions: [],
    expectedObservation: asset.evidence,
    misconceptionAddressed: placement.misconception,
    readingModePolicy: 'inline-essential',
    fidelity: calibreSpecific ? 'calibre-specific' : 'conceptual',
    limitations: [asset.limitation],
    sourceBasis: [asset.source.sourceId],
    curationMethod: 'codex-assisted-personal-curation',
    ownerReviewStatus: 'owner-review-pending',
    technicalReviewStatus: 'not-required',
    technicalStatus: 'source-limited',
    notes: [
      'Recorte revisado visualmente y servido desde un asset local; sin hotlink.',
      'Uso personal: revisar derechos antes de distribuir la aplicación o sus medios.',
    ],
  }
}

export const ACADEMY_SOURCE_FIGURE_PLACEMENTS = PLACEMENTS
