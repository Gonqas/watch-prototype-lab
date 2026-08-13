import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = join(process.cwd(), 'learning-content', 'mechanical-foundations')
const registryPath = join(process.cwd(), 'learning-content', 'source-registry', 'horology-student-resources.v1.json')
// This upgrade is part of the published 4E package.  Keep its records and
// manifest aligned with the package contract instead of reviving the old
// pre-P1 release numbers when the content pipeline is rerun.
const version = '0.5.0'
const checkedAt = '2026-08-02'
const originalSourceId = 'source.horology.original-mechanical-foundations'
const fidelity = {
  geometry: 'G1',
  kinematics: 'K2',
  physics: 'P0',
  limitations: [
    'Geometría pedagógica normalizada; no representa un calibre fabricable.',
    'La coordinación cinemática demuestra relaciones y sentidos, no tolerancias ni rendimiento real.',
    'No modela elasticidad real, pérdidas, lubricación, desgaste, choque ni marcha cronométrica.',
  ],
}

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
const unique = (values) => [...new Set(values)]
const wordCount = (value) => value.replace(/[#*`>|]/g, ' ').trim().split(/\s+/).filter(Boolean).length

const theory = [
  {
    id: 'energy',
    lessonId: 'lesson.mechanical.energy',
    blockId: 'block.mechanical.theory.energy',
    activityIds: ['activity.mechanical.interrupt-energy-chain', 'activity.mechanical.classify-energy-functions'],
    minutes: 28,
    sourceIds: [
      'source.external.ciechanowski-mechanical-watch',
      'source.external.timezone-illustrated-glossary',
      'source.horology.private-book.mainsprings',
    ],
    readiness: [
      'Puedo distinguir energía almacenada, par, velocidad angular y potencia sin usarlos como sinónimos.',
      'Puedo recorrer la cadena desde la cuerda hasta la indicación y decir qué función cumple cada subsistema.',
      'Puedo predecir qué queda activo a cada lado de una interrupción sin depender de que una animación me dé la respuesta.',
    ],
    markdown: `# Teoría fundamental · energía y barrilete

## Antes de empezar

Un reloj mecánico no crea movimiento: administra una cantidad finita de energía. Para entenderlo conviene separar cuatro ideas que suelen mezclarse. **Energía** es la capacidad de producir trabajo; **par** es la tendencia de una fuerza a hacer girar un eje; **velocidad angular** expresa cuánto gira por unidad de tiempo; y **potencia** relaciona la rapidez con la que se entrega energía. Que una rueda gire deprisa no significa que almacene mucha energía, y que el muelle esté muy cargado no significa que el reloj ya esté regulando el tiempo.

El objetivo de esta unidad es construir una cadena causal completa: la corona permite cargar, el sistema de cuerda hace girar el árbol, el muelle almacena energía elástica, el barrilete entrega par al tren, el escape dosifica la liberación, el oscilador establece el ritmo y la minutería convierte una parte del movimiento en indicación. Antes del laboratorio debes ser capaz de contar esta secuencia sin mirar el modelo.

## Vocabulario y fronteras

El **muelle real** es una lámina elástica enrollada. Su extremo interior se vincula al árbol y el exterior al tambor o a una brida, según la arquitectura. El **árbol de barrilete** recibe la cuerda; el **tambor** y su dentado entregan movimiento al tren; la **tapa** cierra el conjunto. La **rueda de rochete** transmite el giro de cuerda al árbol y el **trinquete** impide el retroceso inmediato. Estas funciones deben leerse como relaciones: una pieza cercana al barrilete no participa necesariamente en la carga.

En un movimiento de cuerda manual el extremo exterior puede quedar enganchado de forma estable. En muchos automáticos se emplea una brida deslizante para limitar la carga, pero esa solución no es universal. El laboratorio usa una reserva normalizada entre cero y uno: sirve para observar causa y efecto, no para afirmar julios, newton·milímetros ni horas de reserva de un calibre concreto.

## Teoría: almacenar, entregar y dosificar

En una primera aproximación, un resorte torsional ideal puede describirse con un par proporcional al ángulo, τ = k·θ. La energía acumulada sería E = 1/2·k·θ². Un muelle real de reloj no se comporta como un resorte torsional perfecto: cambia su curvatura a lo largo de muchas espiras, contacta consigo mismo y con el tambor, presenta fricción e histéresis y trabaja dentro de límites materiales. La fórmula ideal es útil para pensar que duplicar la deformación no duplica necesariamente la energía, pero no autoriza a calcular un barrilete fabricable sin geometría, material y condiciones de contacto.

La potencia rotatoria ideal es P = τ·ω. Si el tren transforma velocidad y par, la potencia de salida nunca puede superar la de entrada en un sistema pasivo; en un reloj real será menor por las pérdidas. En un modelo sin pérdidas, una reducción que aumenta la velocidad reduce el par disponible en proporción inversa. Esta conservación ideal permite detectar respuestas imposibles, pero no predice autonomía ni amplitud real.

El barrilete no regula el tiempo. Su función es entregar energía con suficiente continuidad para que el tren y el escape trabajen. El escape tampoco es una fuente: alterna retención, liberación e impulso. El oscilador tampoco mueve por sí solo todo el tren: necesita reposición de energía porque las pérdidas amortiguarían su movimiento. El comportamiento del reloj aparece por cooperación entre subsistemas.

## Lectura causal de una interrupción

Para diagnosticar, divide siempre la cadena en **aguas arriba**, **interfaz** y **aguas abajo**. Si se bloquea la salida del barrilete mientras el muelle conserva carga, aguas arriba existe energía almacenada, la interfaz no transmite rotación y aguas abajo no recibe potencia. Si se retira el bloqueo, una simulación educativa puede reanudar la cadena; en un reloj físico habría que comprobar además libertad, daños y seguridad.

Si el tren gira pero la indicación no cambia, no concluyas que el muelle está descargado: la interrupción puede estar en la rama de minutería. Si el oscilador se mueve un instante y se detiene, tampoco basta para acusar al escape: puede faltar reserva, existir una carga excesiva o haberse interrumpido el impulso. Una observación limita hipótesis; rara vez identifica una causa única.

## Ejemplo resuelto

Supón un estado educativo con carga 0,70. Se bloquea la relación entre barrilete y rueda central y se ordena liberar energía. Predicción: el valor de carga puede seguir representado, pero la rueda central, las etapas posteriores, el escape y la indicación no deben recibir giro. La observación correcta no es «el reloj está roto», sino «la transmisión está interrumpida en esta interfaz declarada; el modelo no demuestra qué ocurriría con tensiones o impactos reales».

Ahora desplaza el bloqueo a la minutería. El tren y el escape pueden seguir activos mientras las agujas quedan sin accionamiento. La diferencia entre ambos casos permite localizar funcionalmente el tramo interrumpido. Este razonamiento es más útil que memorizar colores o posiciones porque se transfiere a arquitecturas distintas.

## Errores habituales

- Llamar «energía» a cualquier giro visible.
- Afirmar que el escape fabrica energía o que el volante impulsa continuamente el tren.
- Confundir reserva normalizada con horas reales.
- Suponer que más carga produce proporcionalmente más amplitud y mejor marcha.
- Convertir una animación reversible en autorización para manipular un muelle físico cargado.

## Comprobación antes del laboratorio

Sin mover el modelo, responde: ¿dónde se almacena la energía?, ¿qué pieza recibe la cuerda?, ¿qué conjunto entrega movimiento al tren?, ¿qué subsistema dosifica la liberación?, ¿qué establece el ritmo?, ¿qué rama produce la indicación? Después formula dos predicciones: una para un bloqueo en la salida del barrilete y otra para un desacoplamiento de la minutería. Solo entonces utiliza el laboratorio para intentar refutarlas.

## Resumen

La cadena correcta no es una lista de piezas, sino una secuencia de transformaciones con interfaces verificables. La teoría ideal conserva energía y relaciona par, velocidad y potencia; el reloj real añade pérdidas, elasticidad no lineal, contacto y tolerancias que este laboratorio P0 no valida.`,
  },
  {
    id: 'train',
    lessonId: 'lesson.mechanical.train',
    blockId: 'block.mechanical.theory.train',
    activityIds: ['activity.mechanical.build-train', 'activity.mechanical.calculate-total-ratio'],
    minutes: 34,
    sourceIds: [
      'source.external.ciechanowski-mechanical-watch',
      'source.external.timezone-illustrated-glossary',
      'source.external.bobinchak-school',
      'source.horology.private-book.wheels-pinions',
    ],
    readiness: [
      'Puedo identificar conductora y conducida y escribir la relación antes de sustituir números.',
      'Puedo multiplicar etapas y determinar el sentido final de un tren compuesto.',
      'Puedo explicar por qué proximidad, solape visual y engrane declarado no son equivalentes.',
    ],
    markdown: `# Teoría fundamental · ruedas, piñones y tren de rodaje

## Antes de empezar

El tren de rodaje transforma una rotación disponible en otras velocidades y pares útiles. No es una hilera de discos: cada móvil suele combinar una rueda de mayor diámetro y un piñón solidario en el mismo eje; la rueda de una etapa engrana con el piñón del móvil siguiente. Esta alternancia permite acumular relaciones grandes en poco espacio. Para leerla hay que seguir interfaces y ejes, no simplemente saltar a la pieza más próxima.

Antes de entrar al laboratorio debes dominar tres operaciones mentales: identificar quién conduce, calcular la relación de una etapa y encadenar etapas sin perder el sentido de giro. También debes distinguir un dato didáctico —por ejemplo, un número de dientes elegido para que el cálculo sea claro— de un conteo documentado de un calibre real.

## Vocabulario estructural

Una **rueda** es el elemento dentado grande de un móvil; un **piñón** suele ser el elemento pequeño de acero. Cuando ambos pertenecen al mismo móvil, giran con la misma velocidad angular porque comparten eje. Cuando la rueda A engrana con el piñón B, forman una interfaz entre dos ejes diferentes. El **móvil central**, la **tercera rueda**, la **cuarta rueda** y la **rueda de escape** son nombres funcionales comunes, pero su posición y su relación exacta varían entre arquitecturas.

Los pivotes apoyan el móvil en cojinetes o rubíes de platina y puente. Un tren solo puede transmitir si su geometría permite contacto dentado y sus apoyos permiten libertad. El laboratorio declara «engranado» o «desengranado» como estado semántico. No calcula perfiles cicloidales, módulo, corrección, juego, penetración ni distancia entre centros real.

## Relación de una etapa

Para un par externo ideal, si la conductora tiene Z₁ dientes y la conducida Z₂, la velocidad de salida cumple ω₂ = −ω₁·Z₁/Z₂. El signo menos indica inversión del sentido. Si una rueda de 80 dientes conduce un piñón de 10, el piñón gira ocho vueltas por cada vuelta de la rueda y lo hace en sentido contrario. Para el par ideal, ignorando pérdidas, τ₂ = −τ₁·Z₂/Z₁: la ganancia de velocidad se paga con una reducción de par.

La palabra «reducción» puede causar confusión porque depende de qué magnitud y convención se cite. Es más seguro escribir siempre: conductora, conducida, dientes de entrada, dientes de salida y magnitud buscada. Después sustituye números. Una cifra aislada como 8:1 no dice por sí sola qué eje gira ocho veces.

En un tren compuesto con varias etapas, la relación de velocidades es el producto de las relaciones de cada engrane. Los dientes de los elementos solidarios en un mismo eje no crean una nueva inversión: solo preparan el siguiente engrane. El sentido final depende del número de engranes externos activos. Dos engranes invierten dos veces y recuperan el sentido inicial; tres producen sentido opuesto.

## Ruedas intermedias y cancelación

Una rueda intermedia simple puede cambiar el sentido y la separación entre ejes sin alterar el módulo de la relación total, porque su número de dientes aparece una vez en numerador y otra en denominador y se cancela. Pero esto solo es cierto para la configuración descrita. Si la rueda intermedia comparte eje con otro piñón de diferente número de dientes, ya forma parte de un tren compuesto y sí modifica la relación.

Esta distinción evita un error frecuente: multiplicar todos los dientes visibles sin reconstruir primero qué elementos comparten eje y cuáles engranan. El grafo funcional debe contener dos tipos de relación diferentes: **solidario con** y **engrana con**. La matemática se deriva del grafo, no al revés.

## Geometría, contacto y límites

Dos círculos que se solapan en pantalla no garantizan engrane. Para una geometría fabricable habría que definir sistema de dentado, paso o módulo, número de dientes, diámetros primitivos, adendo, dedendo, correcciones, espesor, ángulo de presión o geometría cicloidal, distancia entre centros, juego y tolerancias. En relojería, el perfil se optimiza para pequeñas cantidades de dientes y condiciones particulares. El laboratorio K2 coordina sentidos y relaciones declaradas; no valida contacto.

Retirar una etapa debe interrumpir todo lo situado aguas abajo. Si una rueda posterior sigue girando sin una ruta alternativa declarada, la animación es causalmente falsa. Del mismo modo, bloquear una rueda puede detener etapas anteriores en un modelo rígido ideal, pero un reloj físico puede almacenar deformación, deslizar o sufrir daño. El laboratorio no simula esos esfuerzos.

## Ejemplo resuelto

Etapa 1: una rueda de 72 dientes conduce un piñón de 12. La salida gira −72/12 = −6 veces por vuelta de entrada. El piñón comparte eje con una rueda de 60 dientes. Etapa 2: esa rueda conduce un piñón de 10, así que la nueva relación es −60/10 = −6. El producto es (+36): la salida final gira treinta y seis veces por vuelta de la primera rueda y recupera el sentido inicial. En un modelo ideal, el par final sería aproximadamente 1/36 del inicial antes de pérdidas.

Si se desacopla la segunda etapa, la primera pareja conserva su relación, pero la salida final debe quedar a cero. Esta predicción separa cálculo local, relación total y continuidad funcional.

## Errores habituales

- Invertir Z conductora y Z conducida porque se memoriza una fracción sin nombrar ejes.
- Contar como engrane la unión solidaria de rueda y piñón de un mismo móvil.
- Creer que una rueda intermedia siempre cambia la relación o que nunca la cambia.
- Inferir contacto por cercanía visual.
- Atribuir los dientes educativos al MIYOTA 8215 u otro calibre.

## Comprobación antes del laboratorio

Dibuja dos ejes compuestos y marca con una línea continua los elementos solidarios y con una flecha los engranes. Calcula relación, sentido y efecto de retirar la segunda etapa. Explica qué información adicional necesitarías para diseñar dientes reales. Si no puedes separar cinemática ideal de geometría fabricable, vuelve a esta lectura antes de construir el tren virtual.

## Resumen

El tren se entiende como un grafo de ejes solidarios y engranes. La relación total se multiplica, el sentido se deriva del número y tipo de contactos, y toda afirmación geométrica exige datos que la representación G1 no contiene.`,
  },
  {
    id: 'escapement',
    lessonId: 'lesson.mechanical.escapement',
    blockId: 'block.mechanical.theory.escapement',
    activityIds: ['activity.mechanical.order-escapement-phases', 'activity.mechanical.identify-lock-impulse-drop'],
    minutes: 36,
    sourceIds: [
      'source.external.ciechanowski-mechanical-watch',
      'source.external.timezone-illustrated-glossary',
      'source.external.hodinkee-watch101',
      'source.horology.private-book.escapements',
    ],
    readiness: [
      'Puedo ordenar bloqueo, desbloqueo, impulso, caída y nuevo bloqueo en ambos sentidos.',
      'Puedo explicar por qué el escape transmite y dosifica energía, pero no la crea.',
      'Puedo distinguir una secuencia K2 de un ajuste geométrico real del escape.',
    ],
    markdown: `# Teoría fundamental · escape de áncora suizo

## Antes de empezar

El escape conecta dos mundos: el tren intenta girar de forma continua bajo el par del barrilete, mientras el volante oscila alternativamente. El escape convierte esa interacción en avances discretos y devuelve pequeños impulsos al oscilador. Para comprenderlo no basta con ver tres piezas moverse; hay que distinguir qué contacto retiene, qué movimiento desbloquea, dónde se entrega impulso y cuándo aparece la caída libre hasta el siguiente bloqueo.

Esta unidad usa una secuencia discreta y reversible. No enseña a ajustar un escape físico ni declara ángulos de leva, penetración, draw, seguridad, profundidad de bloqueo, recorrido perdido o lubricación. Su propósito es que puedas narrar la causalidad antes de observarla.

## Piezas e interfaces

La **rueda de escape** recibe par del tren. Sus dientes interactúan alternativamente con las paletas de entrada y salida del **áncora**. La horquilla del áncora recibe la clavija o piedra de impulso asociada al volante. El volante y la espiral forman el oscilador; la áncora no fija por sí sola el periodo.

Hay dos interfaces centrales: diente–paleta y horquilla–clavija. En una representación correcta, el estado de una condiciona la otra. Un diente retenido explica por qué la rueda no avanza aunque exista par; el paso de la clavija explica por qué el áncora cambia de lado; la geometría de impulso explica cómo una fracción de energía alcanza al volante. Si las tres piezas giran sin estos eventos, solo hay coreografía, no una explicación mecánica.

## Secuencia causal completa

1. **Bloqueo:** un diente de la rueda descansa sobre la cara de bloqueo de una paleta. El tren aplica par, pero la rueda queda retenida.
2. **Desbloqueo:** al regresar el volante, la clavija entra en la horquilla y desplaza el áncora. La paleta libera el diente retenido.
3. **Impulso:** la rueda avanza bajo el par del tren; el contacto sobre la cara de impulso transmite energía al áncora y, mediante la horquilla, al volante.
4. **Separación:** la clavija abandona la horquilla y el volante continúa su arco libre bajo su inercia y el par de la espiral.
5. **Caída:** la rueda avanza el pequeño intervalo libre hasta que otro diente encuentra la paleta opuesta.
6. **Nuevo bloqueo:** el tren vuelve a quedar retenido mientras el volante completa su alternancia y regresa desde el otro lado.

El siguiente semiperiodo repite la lógica con la paleta opuesta. «Tic» y «tac» no son dos mecanismos diferentes, sino dos mitades alternas del mismo ciclo. La rueda de escape avanza por pasos; el volante continúa oscilando entre impulsos.

## Energía, tiempo y autonomía

El escape no produce el ritmo de manera aislada. El periodo emerge principalmente del oscilador y se perturba por la interacción con el escape, las pérdidas y la geometría. El tren aporta energía a través de la rueda; el escape decide cuándo puede avanzar; el oscilador determina cuándo regresa la clavija a la zona de interacción. Esta retroalimentación es la razón por la que no debe estudiarse cada pieza como una animación independiente.

Durante el arco libre, idealmente el volante está poco perturbado. Durante el impulso recibe energía para compensar pérdidas. Una entrega insuficiente no demuestra por sí sola un defecto de escape: también podría existir baja fuerza, fricción en el tren o pérdida en el oscilador. Una entrega excesiva o una geometría insegura tampoco se modelan aquí.

## Bloqueo, caída y seguridad conceptual

Bloqueo no significa que las piezas estén inmóviles para siempre, sino que una interfaz retiene el tren hasta el evento de desbloqueo. Caída no significa que una pieza se caiga: es el avance libre entre el fin de un contacto y el inicio del siguiente bloqueo. Impulso no significa golpe arbitrario: es una transferencia de energía a través de superficies previstas.

En un escape real existen condiciones de seguridad para evitar liberaciones no deseadas ante perturbaciones. También importan el draw, la profundidad de bloqueo, el recorrido total, el juego de cuernos y dardo, los ángulos y la lubricación. El modelo P0 omite estos valores. Por eso ordenar fases es una competencia conceptual previa, no una licencia para intervenir sobre paletas o pitón.

## Ejemplo resuelto

Estado inicial: paleta de entrada bloquea un diente; el volante regresa desde la amplitud izquierda. Predicción: la clavija entra en la horquilla, desplaza el áncora, libera la paleta de entrada, la rueda avanza y transmite impulso; después cae hasta quedar retenida por la paleta de salida. Si se bloquea la interacción horquilla–clavija, la paleta no recibe la orden de desbloqueo y el tren permanece retenido.

La conclusión permitida es causal: «sin el retorno del oscilador a la interfaz, no se completa el desbloqueo». No se permite concluir una profundidad de bloqueo, una amplitud o una pérdida energética reales porque la escena no contiene esos datos.

## Errores habituales

- Decir que la rueda de escape empuja continuamente el volante.
- Llamar escape al oscilador completo o afirmar que el escape es la fuente de energía.
- Saltar de bloqueo a impulso sin explicar el desbloqueo.
- Confundir caída con retroceso o con una avería.
- Interpretar el tamaño de las paletas de la escena como geometría de ajuste.

## Comprobación antes del laboratorio

Escribe las seis fases sin mirar. Para cada una, nombra pieza activa, interfaz, energía que entra y resultado observable. Después predice qué se detiene si se bloquea: a) una paleta sobre la rueda; b) la horquilla respecto a la clavija; c) el tren antes de la rueda de escape. El laboratorio debe comprobar tus predicciones fase por fase, no sustituirlas.

## Resumen

El escape es una máquina de eventos: retiene, recibe la orden del oscilador, libera, transmite impulso y vuelve a retener. La secuencia K2 es verificable; el ajuste y la física real permanecen fuera del alcance.`,
  },
  {
    id: 'oscillator',
    lessonId: 'lesson.mechanical.oscillator',
    blockId: 'block.mechanical.theory.oscillator',
    activityIds: ['activity.mechanical.configure-oscillator', 'activity.mechanical.distinguish-frequency-amplitude'],
    minutes: 32,
    sourceIds: [
      'source.external.ciechanowski-mechanical-watch',
      'source.external.timezone-illustrated-glossary',
      'source.external.hodinkee-watch101',
      'source.horology.private-book.balance-spring',
    ],
    readiness: [
      'Puedo distinguir frecuencia, periodo, alternancia, amplitud y marcha.',
      'Puedo explicar por separado la inercia del volante y el par restaurador de la espiral.',
      'Puedo convertir hercios en alternancias por hora sin afirmar una marcha real.',
    ],
    markdown: `# Teoría fundamental · volante y espiral

## Antes de empezar

El oscilador establece una escala temporal repetible. El volante aporta inercia rotatoria y la espiral aporta un par restaurador que cambia de sentido al cruzar el equilibrio. Juntos pueden oscilar; ninguno de los dos cumple la función completa por separado. El escape repone energía, pero no debe confundirse con el elemento que define el periodo.

Antes del laboratorio necesitas separar cinco magnitudes: **frecuencia** es el número de ciclos por segundo; **periodo** es el tiempo de un ciclo; **alternancia** es medio ciclo; **amplitud** es el ángulo máximo respecto al equilibrio; y **marcha** es el adelanto o atraso del reloj respecto a una referencia. Cambiar una no equivale automáticamente a cambiar las demás.

## Modelo físico ideal

Para pequeñas oscilaciones y una espiral ideal, el sistema se aproxima mediante I·θ¨ + κ·θ = 0, donde I es el momento de inercia del volante, κ la rigidez torsional equivalente y θ el ángulo. La frecuencia natural es f = 1/(2π)·√(κ/I), y el periodo T = 1/f = 2π·√(I/κ). Aumentar la inercia tiende a aumentar el periodo; aumentar la rigidez tiende a reducirlo.

Esta ecuación es un modelo, no un cálculo completo de una espiral relojera. Una espiral real tiene geometría, masa, terminales, punto de fijación, respiración espacial, posibles excentricidades, magnetismo, temperatura y no linealidades. El volante tiene distribución de masa, pivotes y fricción. El escape perturba el movimiento durante el impulso. La fórmula sirve para comprender dependencias, no para diseñar o regular sin datos.

## Frecuencia, alternancias y periodo

Un oscilador de 2,5 Hz completa 2,5 ciclos por segundo. Cada ciclo contiene dos alternancias, por lo que produce 5 alternancias por segundo y 18 000 alternancias por hora: 2,5·2·3600. Su periodo es 0,4 s y cada alternancia ideal dura 0,2 s. En 4 Hz, el periodo es 0,25 s y se obtienen 28 800 alternancias por hora.

Las expresiones «vibraciones por hora» y «alternancias por hora» se usan a veces de forma ambigua en material divulgativo. El curso declara su convención explícitamente: un ciclo completo contiene dos alternancias. Siempre comprueba qué está contando la fuente.

## Amplitud no es frecuencia

La amplitud indica hasta dónde se aleja el volante del equilibrio. Un reloj puede conservar aproximadamente la misma frecuencia mientras la amplitud disminuye, hasta que las no linealidades y las condiciones del escape afectan de forma apreciable a la marcha. Decir «gira más» puede referirse a mayor amplitud, no a más ciclos por segundo.

En un oscilador amortiguado sin reposición, la energía disminuye y la amplitud decae. El escape entrega impulsos para compensar pérdidas. En régimen estable, la energía aportada por ciclo se equilibra aproximadamente con la perdida. El laboratorio anima amplitud y frecuencia como controles separados para desmontar su confusión; no calcula el equilibrio energético real.

## Longitud activa y regulación

En arquitecturas con raqueta, modificar la longitud activa de la espiral altera su rigidez efectiva y, por tanto, la frecuencia. Una longitud activa menor suele aumentar la rigidez efectiva y acelerar la oscilación; una mayor suele hacer lo contrario. Esta relación cualitativa no autoriza a predecir segundos por día desde un desplazamiento visual. Existen reguladores sin raqueta, espirales libres y soluciones con ajuste de inercia que siguen otra estrategia.

La marcha tampoco se deduce únicamente de la frecuencia nominal. Importan la frecuencia efectiva, el error de referencia, posiciones, amplitud, escape, temperatura, magnetismo y ajuste. La Academia separa la visualización K2 de una medición con cronocomparador y de una validación cronométrica.

## Ejemplo resuelto

Se declara un oscilador educativo a 3 Hz y 240° de amplitud. El periodo ideal es 1/3 s; las alternancias por hora son 3·2·3600 = 21 600. Si la amplitud se reduce a 180° manteniendo el control de frecuencia en 3 Hz, el modelo debe mostrar arcos menores con el mismo número de ciclos. No concluyas que la marcha real permanece idéntica: el laboratorio solo demuestra que frecuencia y amplitud son variables conceptualmente diferentes.

Ahora aumenta simbólicamente la longitud activa. La predicción cualitativa es una frecuencia menor. La escena puede cambiar el ritmo para visualizar esta dependencia, pero la magnitud del cambio no pertenece a una espiral concreta.

## Errores habituales

- Usar amplitud y frecuencia como sinónimos.
- Contar una alternancia como un ciclo completo.
- Afirmar que el volante genera energía.
- Convertir la posición de una raqueta virtual en segundos por día.
- Creer que una frecuencia nominal garantiza precisión.

## Comprobación antes del laboratorio

Calcula periodo y alternancias por hora para 2,5 Hz y 4 Hz. Explica qué ocurre cualitativamente al aumentar I, κ y la longitud activa. Después predice dos animaciones: misma frecuencia con distinta amplitud, y misma amplitud con distinta frecuencia. Si no puedes describir la diferencia sin mirar, todavía no conviene usar el control visual.

## Resumen

El volante almacena energía cinética rotatoria; la espiral proporciona el retorno; el escape compensa pérdidas. La ecuación armónica organiza el razonamiento, mientras la marcha real exige medición, modelo físico y condiciones que P0 no contiene.`,
  },
  {
    id: 'setting',
    lessonId: 'lesson.mechanical.keyless',
    blockId: 'block.mechanical.theory.setting',
    activityIds: ['activity.mechanical.operate-winding-setting', 'activity.mechanical.reconstruct-crown-states'],
    minutes: 30,
    sourceIds: [
      'source.external.ciechanowski-mechanical-watch',
      'source.external.timezone-illustrated-glossary',
      'source.external.hodinkee-watch101',
      'source.horology.private-book.wheels-pinions',
    ],
    readiness: [
      'Puedo distinguir selección axial de la tija y transmisión rotatoria de la corona.',
      'Puedo recorrer por separado la rama de cuerda y la rama de puesta en hora.',
      'Puedo explicar la función de la fricción de minutería sin generalizar una arquitectura concreta.',
    ],
    markdown: `# Teoría fundamental · mecanismo de cuerda y puesta en hora

## Antes de empezar

La corona ofrece dos entradas distintas: puede girar y puede cambiar de posición axial. El mecanismo de puesta en hora —keyless works— convierte esas entradas en estados mutuamente coherentes: dar cuerda, corregir la indicación y, en algunos movimientos, seleccionar calendario o parada. El error habitual es imaginar que tirar de la corona mueve directamente las agujas. En realidad, la tija selecciona una rama y el giro posterior transmite movimiento por una cadena de piezas.

Esta unidad usa una arquitectura conceptual común, no una lista universal. Los nombres, formas, número de posiciones y sentidos de giro varían. Debes aprender roles e interfaces para poder reconocer soluciones diferentes.

## Piezas y dos tipos de movimiento

La **tija** transmite giro desde la corona y también desplazamiento axial. El **piñón corredizo** puede desplazarse para acoplar ramas diferentes. El **piñón de canto** participa en la transmisión de cuerda en muchas arquitecturas. El **tirete** registra la posición de la tija; el **muelle de tirete** estabiliza estados; el **balancín** o yugo gobierna la posición del piñón corredizo. Ruedas intermedias llevan el movimiento a la rueda de corona y al rochete, o a la minutería.

La relación crítica es que selección y transmisión no son lo mismo. Empujar o tirar cambia el estado del mecanismo. Girar produce trabajo solo si el acoplamiento seleccionado es válido. Una tija puede girar visualmente mientras la rama aguas abajo permanece desacoplada.

## Estado de cuerda

En la posición de cuerda, el giro de corona se transmite por tija, piñones y ruedas hasta el rochete unido al árbol del barrilete. El trinquete permite el avance de carga y evita que el árbol deshaga inmediatamente el giro. El sentido efectivo y el conjunto exacto dependen de la arquitectura. El laboratorio muestra una cadena semántica y un estado de carga normalizado; no reproduce dientes, deslizamientos ni fuerzas de una referencia concreta.

Al invertir el giro, algunas arquitecturas desacoplan o permiten un movimiento sin cargar; otras emplean soluciones diferentes. No memorices «horario» como regla universal. Identifica qué interfaz está activa y qué documento describe el movimiento real.

## Estado de puesta en hora

Al extraer la corona, el tirete y el balancín desplazan el piñón corredizo hacia la rama de minutería. El giro de tija alcanza entonces ruedas de puesta en hora y, finalmente, el conjunto de cañón de minutos, rueda de minutería y rueda de horas. La relación típica mantiene doce vueltas de la aguja horaria por cada ciclo de doce horas de la minutera, pero la disposición exacta varía.

Para poder ajustar las agujas sin arrastrar todo el tren y para que después el reloj vuelva a indicarlas durante la marcha, suele existir una unión de fricción, frecuentemente asociada al cañón de minutos. Debe transmitir el movimiento normal y permitir deslizamiento controlado durante el ajuste. Muy poca fricción puede provocar pérdida de indicación; demasiada puede cargar el tren. El laboratorio representa acoplado/desacoplado, no mide fuerza de fricción.

## Estados, dependencias y reversibilidad

Un estado válido combina posición de tija, posición del piñón corredizo, rama activa y relaciones disponibles. No basta cambiar una bandera de interfaz: las piezas vinculadas deben alcanzar un estado compatible. Por eso el modelo conserva una máquina de estados y permite restaurar.

En un calibre con fecha puede existir una posición adicional o un sentido de giro dedicado a corrección rápida. La corrección cerca del cambio de fecha puede estar restringida por el fabricante. Esta unidad no enseña esas ventanas ni autoriza operaciones sobre un movimiento real: se limita a cuerda e indicación conceptual.

## Ejemplo resuelto

Estado inicial: corona en posición de cuerda, rama del barrilete acoplada y rama de minutería desacoplada. Al girar, la predicción es aumento de carga normalizada sin cambio impuesto de hora. Después se extrae la corona: el balancín desplaza el piñón corredizo, se desacopla la rama de cuerda y se acopla la de puesta en hora. Un giro posterior mueve la indicación sin cargar el muelle.

Si se introduce un fallo de acoplamiento del piñón corredizo, la corona y la tija pueden girar pero ninguna salida cambia. La observación localiza una interrupción entre entrada y rama, no demuestra qué pieza física está dañada.

## Errores habituales

- Confundir tirar de la corona con mover directamente las agujas.
- Suponer el mismo número de posiciones y sentidos en todos los calibres.
- Olvidar que la minutería necesita una unión de fricción controlada.
- Tratar una corrección virtual como procedimiento seguro sobre calendario real.
- Diagnosticar por la animación una pieza rota concreta.

## Comprobación antes del laboratorio

Dibuja una tabla con filas «posición de cuerda» y «posición de puesta en hora». Añade entrada axial, entrada rotatoria, rama activa y salida observable. Predice el resultado de desacoplar el piñón corredizo en cada posición. Solo después utiliza los controles de corona y compara la máquina de estados con tu tabla.

## Resumen

El mecanismo selecciona rutas: el desplazamiento axial configura, el giro transmite y una unión de fricción permite ajustar sin destruir la marcha. Comprender estados y relaciones es transferible; memorizar una forma concreta no lo es.`,
  },
  {
    id: 'automatic',
    lessonId: 'lesson.mechanical.automatic-calendar',
    blockId: 'block.mechanical.theory.automatic',
    activityIds: ['activity.mechanical.follow-automatic-energy'],
    minutes: 30,
    sourceIds: [
      'source.external.ciechanowski-mechanical-watch',
      'source.external.animagraffs-mechanical-watch',
      'source.external.hodinkee-watch101',
      'source.horology.private-book.mainsprings',
    ],
    readiness: [
      'Puedo recorrer la energía desde el rotor hasta el árbol del barrilete.',
      'Puedo explicar por qué un sistema inversor o rueda libre rectifica el movimiento.',
      'Puedo distinguir carga unidireccional, bidireccional y brida deslizante sin atribuirlas a todo calibre.',
    ],
    markdown: `# Teoría fundamental · carga automática

## Antes de empezar

Un sistema automático aprovecha el movimiento relativo entre reloj y masa oscilante para volver a cargar el muelle. El rotor no está conectado directamente al muelle: entre ambos existe un tren que transforma velocidad y par, y un mecanismo que selecciona o rectifica sentidos. Comprender esta cadena evita la falsa impresión de que cualquier giro visible del rotor produce necesariamente carga.

El automático se estudia como módulo añadido a una arquitectura mecánica completa. Ocultarlo no debe crear otro movimiento incoherente: el barrilete, tren, escape y oscilador siguen siendo los mismos. El modelo conceptual compara familias de solución, no replica el MIYOTA 8215 ni otra referencia.

## Rotor, soporte y entrada irregular

El **rotor** es una masa excéntrica que gira alrededor de un eje o cojinete. Su movimiento depende de orientación, aceleraciones, rozamiento y geometría. La entrada es alternante e irregular: puede girar en ambos sentidos, detenerse o invertir. El sistema de carga debe transformar esa entrada en rotación útil del árbol del barrilete sin permitir que el muelle haga girar libremente el rotor en sentido inverso.

El soporte del rotor y su libertad son esenciales, pero el laboratorio no calcula rodamientos, choques ni rozamiento. La velocidad animada es educativa. Un rotor que gira mucho en pantalla no demuestra eficiencia ni reserva real.

## Reducción y rectificación

Después del rotor suele existir un tren reductor que cambia velocidad y par. Además, una arquitectura puede cargar en un solo sentido o en ambos. En la **carga unidireccional**, un sentido transmite y el otro queda libre o produce otra respuesta. En la **carga bidireccional**, sistemas inversores o ruedas libres rectifican ambos sentidos de rotor para que la salida útil haga girar el árbol en el sentido de carga.

Una rueda inversora no es magia: contiene relaciones y elementos que acoplan en una dirección y liberan en otra. Otras arquitecturas usan levas, trinquetes, ruedas de pilares u órganos oscilantes. El concepto general es permitir flujo de energía hacia el barrilete y limitar el retorno. La forma concreta requiere documentación de calibre.

## Del automático al barrilete

La salida del módulo llega a la rueda de rochete o a una interfaz equivalente sobre el árbol. El muelle acumula energía igual que durante la cuerda manual, aunque la ruta de entrada sea distinta. En muchos automáticos, una brida deslizante permite que el extremo exterior resbale de forma controlada cuando la carga es suficiente. Esto evita tratar el final de cuerda como un tope rígido sometido indefinidamente al rotor.

La brida deslizante introduce fricción deliberada con el tambor. Su comportamiento depende de construcción, lubricación y estado. El modelo representa un límite normalizado y no simula el deslizamiento físico. Tampoco se debe concluir que todo movimiento automático usa la misma brida o el mismo método de limitación.

## Eficiencia y pérdidas

La energía capturada depende del movimiento de uso, masa y radio del rotor, inercia, rozamientos, relaciones, eficiencia de inversores y estado del barrilete. La potencia instantánea puede ser pequeña e intermitente; la utilidad aparece por acumulación. Una estimación real necesitaría una historia de movimiento y modelos de pérdida. El laboratorio P0 solo indica si existe una ruta causal de carga.

Si el rotor gira y la carga no aumenta, las hipótesis incluyen rama deshabilitada, inversor desacoplado, tren interrumpido o límite de carga. No identifica una pieza dañada. Si la carga manual funciona y la automática no, se reduce el dominio de búsqueda al camino adicional, pero aún se requiere inspección.

## Ejemplo resuelto

Estado inicial: carga 0,40, automático bidireccional habilitado. Un giro horario del rotor atraviesa una rama inversora y aumenta la carga. Al invertir el rotor, la otra condición de rueda libre debe producir el mismo sentido útil en la salida. Si se desacopla el inversor, el rotor sigue moviéndose y el valor de carga no cambia. Esta diferencia demuestra que movimiento de entrada y trabajo útil no son equivalentes.

En una variante unidireccional, un sentido aumenta la carga y el otro queda libre. Ninguna arquitectura es «incorrecta» por definición; se comparan eficiencia, complejidad, respuesta y decisiones de diseño.

## Errores habituales

- Creer que el rotor enrolla directamente el muelle.
- Tomar cualquier giro del rotor como prueba de carga efectiva.
- Suponer que todos los automáticos cargan en ambos sentidos.
- Aplicar una brida deslizante a todo barrilete.
- Convertir una cadena conceptual en diagnóstico del 8215.

## Comprobación antes del laboratorio

Escribe la cadena rotor → soporte → reducción → inversión o rueda libre → rochete/árbol → muelle. Predice tres casos: giro útil, giro libre en unidireccional y módulo inversor desacoplado. Explica qué observación demostraría transmisión y cuál solo demostraría movimiento del rotor.

## Resumen

La carga automática captura una entrada irregular, la transforma, rectifica y la entrega al mismo almacén de energía. El laboratorio demuestra continuidad funcional y alternativas de arquitectura; eficiencia, desgaste y seguridad pertenecen a una validación distinta.`,
  },
]

const manifestPath = join(root, 'manifest.json')
const manifest = await readJson(manifestPath)
const registry = await readJson(registryPath)

for (const source of registry.entries) {
  const path = `sources/${source.id}.json`
  await writeJson(join(root, path), source)
}
manifest.entries.sources = [
  ...manifest.entries.sources.filter(({ id }) => !id.startsWith('source.external.')),
  ...registry.entries.map(({ id }) => ({ id, path: `sources/${id}.json` })),
]

const originalSource = await readJson(join(root, `sources/${originalSourceId}.json`))
const sourceById = new Map([
  ...registry.entries.map((source) => [source.id, source]),
  [originalSourceId, originalSource],
])

for (const spec of theory) {
  const lessonPath = join(root, 'lessons', `${spec.lessonId}.json`)
  const lesson = await readJson(lessonPath)
  const sourceObjects = spec.sourceIds
    .map((id) => sourceById.get(id))
    .filter(Boolean)
  const block = {
    id: spec.blockId,
    version,
    kind: 'explanation',
    title: `Teoría previa · ${spec.id}`,
    bodyMarkdown: spec.markdown,
    claims: [
      {
        id: `claim.mechanical.theory.${spec.id}`,
        claimType: 'source',
        classification: 'original-explanation',
        claim: `La teoría de ${spec.id} sintetiza principios generales y separa explícitamente el modelo educativo de una validación física o de calibre.`,
        sourceStatement: 'Síntesis original contrastada con las fuentes declaradas; sin copiar sus textos ni transferir autoridad de una fuente secundaria.',
        method: 'Síntesis conceptual, derivación ideal y delimitación G/K/P para estudio previo al laboratorio.',
        fidelity,
        reliability: 'medium',
        inputFingerprint: `mechanical-theory:${spec.id}:${version}`,
        recordedAt: `${checkedAt}T00:00:00.000Z`,
        methodVersion: version,
        sources: sourceObjects,
      },
    ],
    pedagogy: {
      role: 'explain',
      conceptIds: lesson.authoring.conceptIds,
      estimatedMinutes: spec.minutes,
      userPaced: true,
    },
  }
  await writeJson(join(root, 'blocks', `${spec.blockId}.json`), block)
  lesson.version = version
  lesson.blockIds = unique([spec.blockId, ...lesson.blockIds.filter((id) => id !== spec.blockId)])
  lesson.authoring.sourceIds = unique([...lesson.authoring.sourceIds, ...spec.sourceIds])
  lesson.authoring.studyContract = {
    sequence: 'theory-first',
    minimumTheoryMinutes: spec.minutes,
    minimumReadingWords: wordCount(spec.markdown),
    requiredSegmentRoles: ['orient', 'pretrain', 'explain', 'worked-example', 'practice'],
    practiceUnlock: 'after-required-reading',
    labActivityIds: spec.activityIds,
    readinessCriteria: spec.readiness.map((value) => ({ es: value, en: value })),
    sourceReviewRequired: true,
    notePrompt: {
      es: 'Antes de abrir el laboratorio, escribe una predicción causal y una limitación del modelo que no debes olvidar.',
      en: 'Before opening the lab, write one causal prediction and one model limitation you must not forget.',
    },
  }
  await writeJson(lessonPath, lesson)
}

manifest.entries.blocks = [
  ...manifest.entries.blocks.filter(({ id }) => !id.startsWith('block.mechanical.theory.')),
  ...theory.map(({ blockId }) => ({ id: blockId, path: `blocks/${blockId}.json` })),
]

const coreRegistryIds = [
  'source.external.ciechanowski-mechanical-watch',
  'source.external.animagraffs-mechanical-watch',
  'source.external.timezone-illustrated-glossary',
  'source.external.hodinkee-watch101',
  'source.external.bobinchak-school',
]
for (const routeEntry of manifest.entries.routes) {
  const path = join(root, routeEntry.path)
  const route = await readJson(path)
  route.version = version
  route.sourceIds = unique([...route.sourceIds, ...coreRegistryIds])
  await writeJson(path, route)
}

for (const collection of Object.keys(manifest.entries)) {
  for (const entry of manifest.entries[collection]) {
    const path = join(root, entry.path)
    const value = await readJson(path)
    if (value && typeof value === 'object' && 'version' in value) {
      value.version = version
      await writeJson(path, value)
    }
  }
}

manifest.packageVersion = version
manifest.editorialStatus = 'in-review'
manifest.minimumAppVersion = '0.10.0'
manifest.createdAt = `${checkedAt}T00:00:00.000Z`
await writeJson(manifestPath, manifest)

console.log(`${manifest.id}@${version}: ${registry.entries.length} fuentes curadas y ${theory.length} bloques teóricos previos al laboratorio.`)
