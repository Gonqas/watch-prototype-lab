import type { AcademyStage0SectionSpec } from '../types'

const section = (
  blockId: string,
  suffix: string,
  title: string,
  role: AcademyStage0SectionSpec['role'],
  markdown: string,
  options: Pick<AcademyStage0SectionSpec, 'requiredForStudy' | 'collapsible'> = {},
): AcademyStage0SectionSpec => ({
  sectionId: `reader.section.${blockId}.014f-${suffix}`,
  title,
  role,
  markdown,
  legacySectionAliases: [],
  ...options,
})

const workstationBlock = 'block.quartz2035.workstation'
export const WORKSTATION_SECTIONS: readonly AcademyStage0SectionSpec[] = [
  section(workstationBlock, 'punto-de-partida', 'Punto de partida', 'orientation',
    'El banco no es solo una mesa: es el sistema que te permite saber **qué has tocado, dónde está cada pieza y en qué estado dejas el trabajo**. Puedes empezar con una superficie estable, limpia y bien iluminada; no necesitas maquinaria ni un mobiliario profesional. La primera decisión técnica consiste en reservar un lugar fijo y evitar que comida, bebidas, mascotas, corrientes de aire o tareas ajenas entren en la zona de trabajo.'),
  section(workstationBlock, 'mapa-del-banco', 'Un mapa sencillo del banco', 'visual-anatomy',
    'Divide la superficie en cuatro zonas reconocibles. La **zona activa** contiene únicamente la pieza que observas y su soporte. La **zona de herramientas** mantiene cada útil fuera de la trayectoria de las manos. La **zona de piezas retiradas** usa bandeja y compartimentos en un orden que puedas reconstruir. La **zona de descarte** recibe fibras, envoltorios y material que no debe volver junto a una pieza limpia. Una bandeja con borde reduce pérdidas; un soporte estable evita que la pieza se desplace mientras la observas.'),
  section(workstationBlock, 'luz-postura-y-aumento', 'Luz, postura y aumento', 'preparation',
    'Coloca la luz de forma que ilumine la zona activa sin producir reflejos que oculten bordes o ranuras. Acerca el trabajo a la vista antes de encorvar la espalda: antebrazos apoyados, hombros relajados y manos con espacio para descansar. El aumento sirve para responder una pregunta concreta; demasiado aumento puede reducir el campo de visión y hacerte perder la relación entre la pieza y su entorno. Si no puedes mantener una postura estable o aparece fatiga, detente y reajusta el puesto.'),
  section(workstationBlock, 'estado-de-la-sesion', 'Documentar, interrumpir y reanudar', 'procedure',
    'Antes de empezar, toma una fotografía propia del estado inicial y anota la orientación de lo que vas a observar. Si interrumpes la sesión: deja de manipular, coloca cada elemento en su compartimento, cubre la bandeja, separa residuos y escribe el último estado confirmado. Al volver, compara la bandeja y la nota con la fotografía antes de continuar. Una sesión recuperable es aquella que otra versión de ti puede comprender sin confiar en la memoria.'),
  section(workstationBlock, 'ejemplo-pausa-segura', 'Ejemplo: una pausa segura', 'worked-example',
    'Estás observando una placa de entrenamiento y llaman a la puerta. La respuesta correcta no es acelerar. Dejas la herramienta en su zona, colocas la placa en el soporte, cuentas los elementos del compartimento abierto, cubres la bandeja y anotas “observación detenida; nada retirado”. Cuando regresas, verificas esa nota y solo entonces reanudas. El objetivo no es la velocidad, sino conservar el estado y evitar una acción hecha con atención dividida.'),
  section(workstationBlock, 'errores-y-parada', 'Errores frecuentes y señales de parada', 'common-errors',
    '- Trabajar directamente sobre una superficie donde una pieza puede rodar o rebotar.\n- Mezclar herramientas, piezas y residuos en la misma zona.\n- Confiar en recordar la orientación sin fotografía o nota.\n- Continuar con mala luz, fatiga, prisa o interrupciones.\n\nDetente si una pieza desaparece de tu campo de visión, si no puedes reconstruir el orden o si necesitas fuerza para mantener estable el trabajo. Primero recupera el control del banco.'),
  section(workstationBlock, 'ideas-y-puente', 'Ideas importantes y siguiente paso', 'summary',
    'Un buen puesto reduce pérdidas, contaminación y decisiones apresuradas. Debe permitirte ver, apoyar las manos, separar elementos y cerrar una sesión de forma reversible. El MIYOTA 2035 podrá aparecer más adelante como caso documentado, pero estas reglas sirven para cualquier observación de micromecánica. El siguiente paso será elegir herramientas por la operación y por la superficie que deben proteger.'),
  section(workstationBlock, 'fuentes-y-limites', 'Detalles técnicos y fuentes', 'sources',
    'Esta explicación combina principios generales de organización del banco con la progresión inicial de herramientas descrita en la formación histórica de Bulova. No fija dimensiones de mesa, intensidad luminosa ni equipo obligatorio. Las recomendaciones deben adaptarse a tu espacio, visión y condiciones de seguridad; no sustituyen una evaluación ergonómica o médica.', { requiredForStudy: false, collapsible: true }),
] as const

const toolsBlock = 'block.quartz2035.tools'
export const TOOLS_SECTIONS: readonly AcademyStage0SectionSpec[] = [
  section(toolsBlock, 'punto-de-partida', 'Punto de partida', 'orientation',
    'Una herramienta adecuada no se elige por su nombre ni por pertenecer a un juego. Se elige después de identificar **la operación, la parte que debe contactar y la superficie que no debe dañarse**. En esta etapa basta con reconocer lupa, pinzas, destornilladores, soporte y recipientes. Todavía no necesitas abrir un movimiento ni comprar un conjunto completo.'),
  section(toolsBlock, 'familias-y-funcion', 'Familias y función', 'explanation',
    '- La **lupa** amplía una zona para observarla; no corrige una iluminación deficiente.\n- Las **pinzas** trasladan o orientan elementos pequeños mediante contacto controlado.\n- El **destornillador** transmite giro cuando su hoja encaja en la ranura.\n- El **soporte** inmoviliza la pieza sin convertir tu mano en mordaza.\n- Los **recipientes** mantienen grupos separados y hacen visible una falta.\n\nCada útil resuelve un problema distinto. Sustituir uno por otro suele aumentar el riesgo de deslizamiento, marcas o pérdida.'),
  section(toolsBlock, 'lupa-eje-visual', 'Lupa: ojo, aumento y pieza', 'visual-anatomy',
    'Sitúa la lupa de manera estable y lleva la pieza al campo de visión, en lugar de perseguirla con la cabeza. Busca una línea cómoda entre ojo, lupa y zona observada. Empieza con un campo amplio para orientarte y aumenta solo cuando el detalle lo exija. Si pierdes el contexto de la pieza, vuelve a menor aumento. El criterio útil es poder describir qué ves y dónde está, no mantener la lupa el mayor tiempo posible.'),
  section(toolsBlock, 'pinzas-contacto', 'Pinzas: sujetar sin expulsar', 'procedure',
    'Observa primero las puntas: deben encontrarse de forma regular y estar libres de rebabas visibles. Sujeta una pieza de práctica por una zona robusta, con la presión mínima que impida que caiga. Mantén las puntas bajas sobre una bandeja y evita comprimir superficies frágiles. Si la pieza sale disparada, las puntas se cruzan o necesitas apretar con fuerza, detente; revisa alineación, limpieza y punto de contacto.'),
  section(toolsBlock, 'destornillador-ajuste', 'Destornillador: ajuste antes de giro', 'procedure',
    'Compara la hoja con la ranura antes de aplicar giro. Una hoja demasiado estrecha concentra el esfuerzo y puede marcar el centro; una demasiado ancha no asienta. La hoja debe entrar de forma estable, sin balancearse sobre los bordes. Practica únicamente con tornillos y una placa de entrenamiento de poco valor. Si la hoja resbala, la ranura cambia de aspecto o necesitas compensar inclinando la mano, detente.'),
  section(toolsBlock, 'ejemplo-eleccion', 'Ejemplo: rechazar una herramienta', 'worked-example',
    'Tienes dos destornilladores. El primero entra en la ranura, pero deja espacio lateral y se inclina; el segundo cubre mejor el ancho y apoya de forma uniforme. Aunque ambos “entren”, solo el segundo ofrece contacto estable. La decisión se toma antes de girar. El mismo razonamiento vale para pinzas: que puedan agarrar una pieza no significa que el punto de contacto sea seguro.'),
  section(toolsBlock, 'errores-y-cuidado', 'Estado, cuidado y errores frecuentes', 'common-errors',
    'Una herramienta dañada cambia el contacto. Revisa puntas dobladas, hojas redondeadas, suciedad y mangos que no permiten control. Guarda cada útil separado para que sus zonas de trabajo no golpeen otras herramientas. No improvises una herramienta cortante ni rectifiques una hoja en esta etapa. Si no puedes evaluar su estado, úsala solo para observación o sustitúyela por una herramienta de práctica segura.'),
  section(toolsBlock, 'ideas-y-puente', 'Ideas importantes y siguiente paso', 'summary',
    'Elegir una herramienta significa relacionar operación, contacto y superficie protegida. La lupa organiza la observación; las pinzas controlan el traslado; el destornillador exige ajuste previo; soporte y recipientes conservan el estado. A continuación ampliarás esta elección al entorno completo: postura, orden, seguridad y capacidad de detenerte.'),
  section(toolsBlock, 'fuentes-y-limites', 'Detalles técnicos y fuentes', 'sources',
    'La progresión de lupa, pinzas y destornillador está respaldada como método pedagógico por la unidad preliminar de Bulova, inspeccionada visualmente en las páginas PDF 5–9. No se trasladan tiempos de entrenamiento, criterios escolares históricos ni operaciones sobre piezas de reloj. Esta lección no prescribe marcas, medidas de hoja ni herramientas de un calibre concreto.', { requiredForStudy: false, collapsible: true }),
] as const

const benchBlock = 'block.encyclopedia.workshop-tools-materials.banco-y-seguridad'
export const BENCH_SAFETY_SECTIONS: readonly AcademyStage0SectionSpec[] = [
  section(benchBlock, 'punto-de-partida', 'Punto de partida', 'orientation',
    'El entorno influye en lo que puedes ver y en cómo decides. Una luz pobre puede ocultar una marca; una postura inestable puede convertir una corrección pequeña en un movimiento brusco; una bandeja desordenada puede hacer imposible saber si falta una pieza. Por eso la seguridad de banco no es una lista aislada: es una forma de mantener el trabajo observable y reversible.'),
  section(benchBlock, 'entorno-controlado', 'El entorno como sistema de control', 'explanation',
    'Comprueba estabilidad de la mesa, iluminación, ventilación normal, ausencia de comida o bebidas y espacio libre para apoyar los antebrazos. Mantén fuera de la zona activa objetos que puedan engancharse, derramarse o atraer polvo. Una superficie clara ayuda a localizar piezas, pero no garantiza limpieza. Define también dónde guardarás herramientas, piezas retiradas, documentación y residuos antes de comenzar.'),
  section(benchBlock, 'postura-y-atencion', 'Postura, atención y fatiga', 'safety',
    'Trabaja con hombros relajados, manos apoyables y la zona activa cerca de la vista. Cambia la altura de la pieza o del asiento antes de doblar cuello y espalda durante periodos largos. La atención también es una condición del entorno: una interrupción, el cansancio o la prisa justifican una pausa. Ninguna actividad inicial exige continuar cuando pierdes estabilidad o concentración.'),
  section(benchBlock, 'control-de-piezas', 'Control de piezas y sesiones', 'procedure',
    'Usa compartimentos consecutivos y conserva una orientación constante. Separa lo que pertenece al trabajo de lo que es residuo. Registra el estado inicial, cada cambio significativo y el punto de parada. Para cerrar, cuenta grupos, cubre la bandeja y deja una nota breve. Para reanudar, verifica fotografía, nota y compartimentos antes de tocar nada.'),
  section(benchBlock, 'decision-segura', 'Decidir cuándo no empezar', 'checkpoint',
    'No empieces si falta luz, una herramienta esencial está dañada, no existe una bandeja que contenga piezas o el tiempo disponible no permite una parada ordenada. Tampoco empieces sobre un reloj valioso para “probar”. Puedes practicar organización, observación y control con tornillos, arandelas o piezas descartadas. Preparar bien y decidir no intervenir son resultados técnicos válidos.'),
  section(benchBlock, 'caso-razonado', 'Caso razonado: el tornillo que falta', 'worked-example',
    'Al terminar una práctica cuentas cinco tornillos y esperabas seis. No abras otro compartimento ni barras la mesa. Inmoviliza el estado, revisa la fotografía inicial, sigue el recorrido entre placa y recipiente y amplía la búsqueda de forma ordenada. Si no aparece, registra la falta. El control del entorno convierte una pérdida confusa en una búsqueda trazable.'),
  section(benchBlock, 'ideas-y-puente', 'Ideas importantes y siguiente paso', 'summary',
    'Un entorno seguro mantiene visibles el estado, los cambios y las dudas. Luz, postura, orden y pausa forman una misma defensa contra errores. La siguiente lección se centrará en observar y manipular: describir antes de interpretar, elegir aumento y tocar solo cuando exista una razón clara.'),
  section(benchBlock, 'fuentes-y-limites', 'Detalles técnicos y fuentes', 'sources',
    'La organización general del taller se apoya en recursos de formación relojera y buenas prácticas institucionales declaradas por el corpus. No se fijan niveles luminosos, dimensiones ergonómicas ni requisitos profesionales. Los procedimientos históricos con sustancias, calor o maquinaria no forman parte de esta etapa.', { requiredForStudy: false, collapsible: true }),
] as const

const observationBlock = 'block.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion'
export const OBSERVATION_SECTIONS: readonly AcademyStage0SectionSpec[] = [
  section(observationBlock, 'punto-de-partida', 'Punto de partida', 'orientation',
    'Observar es describir algo que podría volver a comprobarse. Interpretar es proponer qué significa. Diagnosticar exige además comparar hipótesis con pruebas. En esta lección practicarás la primera separación: mirar con intención, registrar lo visible y manipular lo mínimo necesario para obtener una vista útil.'),
  section(observationBlock, 'observar-interpretar', 'Observación, interpretación y diagnóstico', 'explanation',
    '“Hay una línea brillante junto al borde” es una observación. “La pieza está rayada” ya es una interpretación, porque la línea podría ser reflejo o fibra. “La herramienta causó la raya” es una hipótesis causal. Escribe primero forma, posición, orientación, color aparente y condición de la luz. Después añade interpretaciones en una columna separada y señala qué comprobación podría distinguirlas.'),
  section(observationBlock, 'luz-y-aumento', 'Cambiar una condición cada vez', 'visual-anatomy',
    'Empieza con luz amplia y aumento moderado. Cambia después solo una condición: dirección de la luz, inclinación de la pieza o aumento. Si cambias todas a la vez, no sabrás qué hizo aparecer el detalle. Conserva una referencia de orientación —por ejemplo, “corona a la derecha” o una marca en la bandeja— para comparar vistas sin confundir lados.'),
  section(observationBlock, 'manipulacion-minima', 'Manipulación mínima y apoyo', 'procedure',
    'Decide por qué necesitas tocar la pieza antes de hacerlo. Apóyala en una superficie o soporte estable y elige un punto robusto. Mantén las pinzas bajas sobre la bandeja, evita bordes funcionales y no persigas una pieza que empieza a escapar: retira la presión y deja que caiga dentro de la zona contenida. Una buena manipulación produce una vista mejor sin crear una marca nueva.'),
  section(observationBlock, 'caso-brillo-o-defecto', 'Ejemplo: brillo, fibra o defecto', 'worked-example',
    'Ves una línea clara sobre una superficie. Sin tocar, cambia el ángulo de luz. La línea se desplaza: probablemente era un reflejo. Si permanece, observas con otro aumento; aparece elevada y cambia con una corriente suave de aire ambiente, por lo que podría ser una fibra. Todavía no afirmas daño. El caso enseña a buscar una observación discriminante antes de intervenir.'),
  section(observationBlock, 'errores-y-parada', 'Errores frecuentes y señales de parada', 'common-errors',
    '- Nombrar una causa antes de describir el aspecto.\n- Aumentar hasta perder la orientación general.\n- Girar una pieza sin registrar su posición inicial.\n- Apretar más cuando las pinzas pierden control.\n\nDetente si no puedes distinguir si el cambio procede de la luz o de la pieza, si tu mano tiembla por fatiga o si el punto de apoyo puede deformarse.'),
  section(observationBlock, 'ideas-y-puente', 'Ideas importantes y siguiente paso', 'summary',
    'Primero describe; después interpreta; solo una prueba adecuada permite acercarse a un diagnóstico. Cambia una condición cada vez, conserva orientación y manipula sobre una zona contenida. El siguiente paso seguirá algo que a menudo no se ve al principio: cómo manos, aire, herramientas y recipientes transfieren contaminación.'),
  section(observationBlock, 'fuentes-y-limites', 'Detalles técnicos y fuentes', 'sources',
    'La distinción entre observación, hipótesis y comprobación recoge el enfoque de inspección y diagnóstico del corpus. Las representaciones digitales y los ejemplos escritos no reproducen el aspecto real de desgaste, suciedad o daño. No se establecen aumentos obligatorios ni criterios de aceptación de una pieza concreta.', { requiredForStudy: false, collapsible: true }),
] as const

const contaminationBlock = 'block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza'
export const CONTAMINATION_SECTIONS: readonly AcademyStage0SectionSpec[] = [
  section(contaminationBlock, 'punto-de-partida', 'Punto de partida', 'orientation',
    'Una pieza puede parecer limpia y recibir contaminación en el siguiente contacto. El objetivo inicial no es aprender química: es reconocer rutas de transferencia y cortarlas. Manos, herramientas, banco, recipiente, fibras y aire pueden actuar como origen o como puente. La prevención empieza antes de tocar.'),
  section(contaminationBlock, 'mapa-de-transferencia', 'De la fuente a la pieza', 'visual-anatomy',
    'Imagina una cadena: fuente → mano o herramienta → superficie o recipiente → pieza. Un mismo objeto puede participar en varias rutas. Tocar el teléfono y volver a las pinzas, apoyar una tapa limpia en la mesa o mezclar una herramienta usada con otra preparada son transferencias cruzadas. El mapa visual permite identificar un punto de control antes de que la cadena alcance la pieza.'),
  section(contaminationBlock, 'zonas-y-controles', 'Zonas limpias y puntos de control', 'procedure',
    'Mantén cubiertos recipientes y bandejas cuando no trabajes en ellos. Separa herramientas preparadas de las que necesitan atención. Reduce contactos innecesarios, manipula por zonas robustas y cambia el soporte si deja de estar controlado. Antes de continuar pregunta: ¿qué tocó esta herramienta desde la última comprobación? Si la respuesta no es clara, detente y restablece el estado.'),
  section(contaminationBlock, 'limpieza-sin-recetas', 'Qué significa limpiar en esta etapa', 'safety',
    'Aquí limpiar significa retirar de forma segura una fibra visible de una superficie de práctica, sustituir un papel protector, cubrir un recipiente o apartar una herramienta dudosa. No se recomiendan disolventes, baños, ultrasonidos, abrasivos ni mezclas domésticas. La compatibilidad depende del material, el contaminante y la documentación aplicable; si esos datos faltan, la operación queda pendiente.'),
  section(contaminationBlock, 'caso-huella', 'Ejemplo: una huella que viaja', 'worked-example',
    'Ajustas la bandeja con los dedos y después tomas una pieza de práctica con las mismas pinzas que apoyaste en su borde. Aunque no veas grasa en las puntas, existe una ruta posible de transferencia. La respuesta es inmovilizar el estado, separar la herramienta y registrar el contacto. No diagnosticas un daño ni eliges un producto: recuperas control y evitas ampliar la cadena.'),
  section(contaminationBlock, 'errores-y-parada', 'Errores frecuentes y señales de parada', 'common-errors',
    '- Confundir “no lo veo” con “está limpio”.\n- Limpiar una pieza sin saber de qué material es.\n- Usar la misma superficie para piezas, herramientas y residuos.\n- Soplar directamente o perseguir una fibra con contactos repetidos.\n\nDetente ante material desconocido, contaminación repetida, olor, derrame o necesidad de un producto. Esta etapa no autoriza procedimientos químicos.'),
  section(contaminationBlock, 'ideas-y-puente', 'Ideas importantes y siguiente paso', 'summary',
    'La contaminación se controla cortando rutas: separar, cubrir, reducir contactos, comprobar y registrar. La ausencia de una marca visible no demuestra limpieza. Después practicarás el control de la mano con materiales de poco valor, usando criterios de parada y documentación del resultado.'),
  section(contaminationBlock, 'fuentes-y-limites', 'Detalles técnicos y fuentes', 'sources',
    'El mapa preventivo conserva el visual creado en 0.14E y lo amplía para esta etapa. Las fuentes históricas pueden contener procedimientos y sustancias que no se trasladan. No se indica ningún agente de limpieza ni compatibilidad química; una intervención real requiere una fuente moderna aplicable al material y al riesgo.', { requiredForStudy: false, collapsible: true }),
] as const

const bulovaBlock = 'block.encyclopedia.workshop-tools-materials.bulova-destreza-basica'
export const BULOVA_SKILL_SECTIONS: readonly AcademyStage0SectionSpec[] = [
  section(bulovaBlock, 'punto-de-partida', 'Punto de partida', 'orientation',
    'La formación preliminar de Bulova colocaba la coordinación entre vista, atención y manos antes de tareas más complejas. Conservamos esa idea pedagógica, pero cambiamos el contexto: practicarás con tornillos, arandelas o una placa de entrenamiento de poco valor. No usarás un movimiento funcional ni asumirás que completar una tarjeta demuestra competencia profesional.'),
  section(bulovaBlock, 'coordinacion', 'Coordinar vista, apoyo y movimiento', 'explanation',
    'Antes de mover, localiza el objetivo con un campo visual amplio y apoya las manos. Acerca la herramienta siguiendo una dirección que puedas observar. El movimiento debe terminar en un punto definido; si la pieza desaparece bajo la herramienta, vuelve atrás. La precisión surge de repetir una secuencia controlada, no de apretar, acelerar o contener la respiración.'),
  section(bulovaBlock, 'pinzas-controladas', 'Práctica con pinzas', 'procedure',
    'Coloca varias arandelas o piezas descartadas dentro de una bandeja. Toma una por una desde una zona robusta, trasládala a un recipiente y suéltala cerca del fondo. Observa si las puntas se cruzan, la pieza rota o sale despedida. Si ocurre, reduce presión y revisa el punto de contacto. Registra una repetición limpia solo cuando puedes describir qué hiciste; no la conviertas en una acreditación.'),
  section(bulovaBlock, 'tornillos-entrenamiento', 'Práctica con destornillador', 'procedure',
    'Usa una placa y tornillos destinados a entrenamiento. Compara hoja y ranura, presenta el destornillador alineado y prueba primero la estabilidad sin girar. Realiza un giro corto y vuelve a observar la ranura. Detente ante deslizamiento, rebaba, inclinación o resistencia inesperada. No practiques sobre tornillos de un reloj que quieras conservar.'),
  section(bulovaBlock, 'criterio-personal', 'Cómo revisar tu propio resultado', 'checkpoint',
    'Puedes registrar fotografía inicial y final, número de piezas recuperadas, deslizamientos observados y motivo de cada parada. La evidencia física existe solo si realizas y documentas la práctica real; aun así, es una nota personal, no una certificación. Una actividad digital puede ayudarte a explicar la secuencia o reconocer errores, pero no prueba control de la mano.'),
  section(bulovaBlock, 'errores-y-danos', 'Errores, daños y señales de parada', 'common-errors',
    '- Sujetar una pieza frágil por su zona funcional.\n- Inclinar el destornillador para compensar una hoja inadecuada.\n- Continuar después de un resbalón sin inspeccionar la ranura.\n- Practicar sobre una pieza valiosa por falta de material de entrenamiento.\n\nDetente si aparece una marca nueva, se pierde una pieza, aumenta la fuerza necesaria o no puedes mantener postura y campo visual.'),
  section(bulovaBlock, 'ideas-y-puente', 'Ideas importantes y cierre de etapa', 'summary',
    'El control inicial combina apoyo, visión, presión mínima, alineación y una parada honesta. La repetición solo ayuda si conserva el material y produce observaciones comparables. Con estas seis lecciones ya puedes preparar el banco, elegir herramientas, observar, manipular, controlar contaminación y practicar sin abrir un movimiento valioso.'),
  section(bulovaBlock, 'fuentes-y-limites', 'Detalles técnicos y fuentes', 'sources',
    'La base pedagógica procede de la unidad preliminar de Joseph Bulova School of Watch Making: página PDF 5 (impresa 3) para coordinación y hábitos de banco; página PDF 6 (impresa 4) para los objetivos de lupa, pinzas y destornillador; páginas PDF 7–9 (impresas 5–7) para las ilustraciones de agarre, apoyo y alineación. La comprobación fue visual, no mediante OCR. Se excluyen tiempos escolares, operaciones sobre componentes de reloj y cualquier lectura como norma moderna de seguridad.', { requiredForStudy: false, collapsible: true }),
] as const

export const ACADEMY_STAGE_0_SECTIONS = {
  'lesson.quartz2035.workstation': WORKSTATION_SECTIONS,
  'lesson.quartz2035.tools': TOOLS_SECTIONS,
  'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad': BENCH_SAFETY_SECTIONS,
  'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion': OBSERVATION_SECTIONS,
  'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza': CONTAMINATION_SECTIONS,
  'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica': BULOVA_SKILL_SECTIONS,
} as const
