const VIM = 'VIM · JCGM 200:2012 (BIPM/JCGM)'
const GUM = 'GUM · JCGM 100:2008 (BIPM/JCGM)'
const NIST = 'NIST/SEMATECH e-Handbook · Measurement Process Characterization'
const ORIGINAL = 'Síntesis educativa original del Sistema 5A'

/**
 * Contenido editorial fuente de Sistema 5A.
 *
 * Las cifras de los ejemplos son datos didácticos declarados, nunca dimensiones
 * oficiales ni tolerancias de un calibre. Las definiciones metrológicas se
 * apoyan en las fuentes declaradas por el paquete; los procedimientos relojeros
 * se mantienen como síntesis educativa y no como calibración o certificación.
 */
export const SYSTEM5A_METROLOGY_LESSONS = {
  'observe-before-measuring': {
    question: '¿Qué sabemos de una pieza antes de acercarle un instrumento, y qué estamos suponiendo sin darnos cuenta?',
    definitions: [
      ['Característica', 'Rasgo que se quiere describir o estudiar: un borde, una superficie, un orificio, una separación o una marca. Todavía no tiene por qué ser una magnitud medible.'],
      ['Observación', 'Registro de algo perceptible bajo condiciones declaradas. “Se ve una línea brillante con luz rasante” es una observación; “está desgastado” ya interpreta una causa o un estado.'],
      ['Identificación', 'Vinculación provisional o documentada entre lo observado y una pieza, cara o región concreta. Exige indicar de dónde procede el nombre o la referencia.'],
      ['Mensurando', 'Magnitud que se pretende medir. Según el VIM, debe definirse con suficiente detalle: “diámetro” sin indicar zona, orientación o condición puede ser una pregunta incompleta.'],
      ['Hipótesis', 'Explicación que podría ser verdadera o falsa y que necesita una comprobación capaz de refutarla. No se registra como hecho.'],
    ],
    explanation: [
      'Observar primero reduce un error muy común: escoger la herramienta a partir de una conclusión prematura. Si una zona parece ovalada por la perspectiva, tomar inmediatamente un calibre no aclara qué diámetro se quería conocer ni qué cara debe servir de referencia. La secuencia correcta es describir, localizar, formular la pregunta y solo entonces decidir si hace falta medir.',
      'Una ficha inicial útil separa cuatro columnas: “veo”, “identifico como”, “podría significar” y “necesito comprobar”. Esta separación conserva la incertidumbre semántica, no solo la numérica. Cambiar la luz, girar la pieza o consultar una vista explosionada puede resolver una identidad sin producir todavía una medida.',
      'El objetivo no es evitar toda interpretación, sino impedir que una interpretación se disfrace de observación. El registro debe permitir que otra persona mire la misma imagen o pieza y distinga qué parte del razonamiento procede de evidencia visible, qué parte procede de una fuente y qué parte sigue abierta.',
    ],
    workedExample: {
      situation: 'En un puente sintético aparece una franja brillante junto a un alojamiento. No hay plano dimensional ni historial de servicio.',
      steps: [
        'Registrar la cara, orientación, aumento e iluminación usados. La primera frase es: “franja brillante curva junto al borde del alojamiento”.',
        'Girar la luz sin mover la pieza. Si la franja cambia o desaparece, anotar el efecto; todavía no se borra la primera observación.',
        'Consultar la documentación disponible para identificar el alojamiento. La identidad de la pieza y la descripción visual quedan en campos distintos.',
        'Proponer dos hipótesis, por ejemplo relieve superficial o reflejo. Para cada una, escribir una comprobación que produciría resultados diferentes.',
        'Decidir si existe una pregunta cuantitativa. Si no se ha definido una magnitud, no se inicia una medición solo para “tener un número”.',
      ],
      conclusion: 'El resultado defendible es una observación localizada con condiciones y preguntas de comprobación. No es todavía un diagnóstico de desgaste ni una dimensión del calibre.',
    },
    errors: [
      'Empezar por el instrumento y adaptar después la pregunta al número obtenido.',
      'Usar el nombre de una pieza como prueba de que su identidad está confirmada.',
      'Escribir “rayado”, “gastado” o “doblado” sin conservar antes la apariencia observable.',
      'Generalizar lo visto en una unidad a todas las piezas de la misma familia.',
    ],
    practice: 'Elige una pieza o imagen de práctica y redacta cinco observaciones sin causas. Después añade una identificación con fuente, una hipótesis y una comprobación que podría refutarla. Solo al final decide si existe un mensurando bien definido.',
    transfer: 'Aplica la misma separación a una esfera, una junta o un tornillo. La apariencia cambia, pero la cadena “observación → identidad → hipótesis → comprobación” debe seguir siendo inspeccionable.',
    sources: [VIM, ORIGINAL],
  },

  'light-magnification-posture': {
    question: '¿Cómo hacemos visible una característica sin confundir un efecto de iluminación, aumento o postura con una propiedad de la pieza?',
    definitions: [
      ['Iluminación incidente', 'Dirección, extensión e intensidad de la luz que llega a la pieza. Una luz rasante resalta relieve; una luz difusa reduce sombras duras, pero ninguna es universalmente “correcta”.'],
      ['Aumento útil', 'Nivel de ampliación que permite reconocer la característica manteniendo campo, orientación y distancia de trabajo suficientes. Más aumento no garantiza más información.'],
      ['Reflejo especular', 'Brillo que depende de la geometría entre fuente, superficie y observador. Puede revelar acabado o esconder un borde.'],
      ['Postura reproducible', 'Posición de manos, ojos, apoyo y pieza que puede repetirse sin tensión ni movimientos que cambien el plano de observación o la fuerza de contacto.'],
    ],
    explanation: [
      'La luz no es un fondo neutro: modifica qué bordes, relieves y contaminantes se distinguen. La iluminación rasante puede mostrar una rebaba diminuta, pero también proyectar una sombra que parece una grieta. La iluminación frontal puede reducir la sombra y, al mismo tiempo, borrar el relieve. Por eso una inspección seria conserva al menos la configuración que produjo cada observación.',
      'El aumento estrecha el campo y suele reducir la profundidad visible. Un principiante puede perder la orientación, observar la cara equivocada o interpretar una zona desenfocada como defecto. La secuencia recomendable empieza con una vista general, aumenta solo hasta resolver la pregunta y vuelve a una vista de contexto antes de registrar la conclusión.',
      'La postura afecta tanto a la observación como a una futura medición: una muñeca sin apoyo cambia el ángulo; una pieza sostenida con presión puede flexionarse; una altura incómoda acelera la fatiga. El método debe priorizar estabilidad y seguridad, no una cifra fija de aumento que el curso no puede justificar para todas las tareas.',
    ],
    workedExample: {
      situation: 'Se quiere observar el hombro de un eje sintético porque una línea oscura aparece en una vista de gran aumento.',
      steps: [
        'Comenzar con una vista general y marcar qué extremo y qué hombro se inspeccionan.',
        'Apoyar manos y portapieza sin tocar la superficie de interés. Registrar el aumento como configuración, no como garantía de exactitud.',
        'Comparar luz difusa y luz lateral manteniendo orientación. Capturar qué rasgos permanecen y cuáles dependen de la iluminación.',
        'Aumentar solo hasta separar borde, depósito y sombra. Si se pierde el contexto, volver a la vista general y localizar de nuevo.',
        'Concluir “línea visible solo con luz lateral” o “relieve visible en ambas configuraciones”; no convertir la diferencia en causa automática.',
      ],
      conclusion: 'Dos configuraciones coherentes aportan más información que una única imagen extrema. El registro explica cómo la apariencia depende del montaje óptico.',
    },
    errors: [
      'Buscar el aumento máximo antes de localizar la pieza y la cara.',
      'Cambiar luz, orientación y enfoque a la vez, de modo que no se sepa qué causó la diferencia.',
      'Confundir una sombra, un reflejo o una zona desenfocada con material ausente.',
      'Trabajar sin apoyo hasta que la fatiga altere la observación o el contacto.',
    ],
    practice: 'Documenta una misma región con vista general y dos iluminaciones. Para cada imagen escribe qué característica gana visibilidad, qué se pierde y qué condición debe repetirse para compararla.',
    transfer: 'Repite el método con una superficie mate y otra pulida, o con una abertura y un relieve. No transfieras la configuración de luz como receta: transfiere la comparación controlada.',
    sources: [NIST, ORIGINAL],
  },

  'units-scale-resolution': {
    question: '¿Qué expresa realmente una lectura y cuántos dígitos podemos conservar sin fabricar información?',
    definitions: [
      ['Magnitud', 'Propiedad que puede expresarse cuantitativamente mediante un número y una referencia. Debe nombrarse antes de elegir la unidad.'],
      ['Unidad de medida', 'Cantidad escalar real definida y adoptada por convenio con la que se comparan magnitudes de la misma naturaleza. El registro debe conservar símbolo y conversión.'],
      ['Indicación', 'Valor proporcionado por un instrumento o sistema de medida. No es automáticamente el valor final atribuido al mensurando.'],
      ['Resolución', 'Menor cambio de la magnitud medida que produce un cambio perceptible en la indicación, bajo las condiciones del sistema. No equivale por sí sola a exactitud ni a incertidumbre.'],
      ['Redondeo', 'Operación explícita para expresar un resultado con una granularidad compatible con los datos y el método; no debe ocultar la lectura original.'],
    ],
    explanation: [
      'Una lectura necesita contexto: magnitud, unidad, instrumento, modo y resolución de indicación. Escribir “1,23” no permite saber si se trata de milímetros, grados, segundos o una escala arbitraria. Añadir decimales calculados después de una conversión tampoco hace que la observación original contenga más información.',
      'La resolución limita lo que puede distinguirse en la indicación, pero otras contribuciones —alineación, fuerza, repetibilidad, referencia o ambiente— pueden dominar el resultado. El VIM separa estos conceptos precisamente para evitar que una pantalla con muchos dígitos parezca una garantía metrológica.',
      'Las conversiones deben conservar el dato de origen y la regla aplicada. Si una imagen se calibra en píxeles por milímetro, la escala solo vale para el plano y configuración documentados. El valor redondeado se presenta junto con el método; nunca se usa el redondeo para forzar una coincidencia con una dimensión esperada.',
    ],
    workedExample: {
      situation: 'Ejemplo didáctico: una referencia de 5,00 mm ocupa 200 píxeles en una imagen planar y una distancia ocupa 92 píxeles. Estas cifras no describen ninguna pieza real.',
      steps: [
        'Calcular la escala declarada: 200 px ÷ 5,00 mm = 40 px/mm para esa imagen y ese plano.',
        'Calcular la distancia: 92 px ÷ 40 px/mm = 2,30 mm.',
        'Conservar coordenadas, longitud en píxeles, referencia, unidad y operación. El resultado 2,300000 mm no tendría más información por mostrar más decimales.',
        'Repetir la selección de puntos para observar cuánto cambia la lectura. Esa variación informa sobre el método, pero no constituye por sí sola un presupuesto GUM completo.',
        'Declarar el límite: el cálculo es 2D y no demuestra profundidad, perpendicularidad ni dimensión oficial.',
      ],
      conclusion: 'La cifra defendible incluye unidad, escala, plano, puntos y redondeo. La resolución de píxel o de pantalla no prueba exactitud global.',
    },
    errors: [
      'Omitir unidades o mezclar milímetros, micrómetros y píxeles sin conversión registrada.',
      'Confundir el último dígito visible con una incertidumbre completa.',
      'Añadir decimales después de calcular para que el resultado parezca más preciso.',
      'Redondear el dato original sin conservarlo o ajustar el valor hacia un nominal esperado.',
    ],
    practice: 'Toma tres lecturas didácticas con unidades explícitas. Anota la indicación original, la resolución disponible, cualquier conversión y el valor expresado. Justifica por qué no muestras más dígitos.',
    transfer: 'Aplica el criterio a una lectura angular, temporal o de marcha. Cambia la unidad, pero conserva la separación entre indicación, resolución, método y resultado expresado.',
    sources: [VIM, GUM, NIST],
  },

  'precision-accuracy-uncertainty': {
    question: '¿Cómo puede una serie ser muy agrupada y, aun así, no justificar que el resultado sea correcto?',
    definitions: [
      ['Precisión de medida', 'Proximidad entre indicaciones o valores obtenidos mediante mediciones repetidas bajo condiciones especificadas. Describe dispersión, no cercanía automática a un valor de referencia.'],
      ['Repetibilidad', 'Precisión bajo un conjunto declarado de condiciones que procura mantener iguales procedimiento, operador, sistema, lugar y un intervalo corto.'],
      ['Exactitud de medida', 'Proximidad entre un valor medido y un valor verdadero del mensurando. Es un concepto cualitativo: no debe usarse como sinónimo de precisión.'],
      ['Error de medida', 'Diferencia entre un valor medido y un valor de referencia; hablar de error exige una referencia definida.'],
      ['Incertidumbre de medida', 'Parámetro no negativo que caracteriza la dispersión de valores atribuidos al mensurando a partir de la información utilizada. No es una disculpa ni una tolerancia.'],
    ],
    explanation: [
      'Una serie muy agrupada muestra poca dispersión bajo sus condiciones, pero puede compartir un sesgo de alineación, cero o método. A la inversa, una serie dispersa puede rodear una referencia sin ser precisa. El VIM mantiene separados precisión, exactitud y error; el NIST ayuda a estudiar la variabilidad del proceso de medición.',
      'La incertidumbre obliga a declarar qué información respalda el resultado: repetición, resolución, referencias, geometría, ambiente y modelo de medición, entre otras posibles contribuciones. El curso enseña a reconocerlas y documentarlas, no afirma que un rango o una desviación aislada constituyan automáticamente una incertidumbre conforme a GUM.',
      'La tolerancia pertenece al requisito de diseño o aceptación. La incertidumbre pertenece al conocimiento incompleto del resultado de medida. Compararlas puede formar parte de una decisión posterior, pero una no se inventa a partir de la otra.',
    ],
    workedExample: {
      situation: 'Datos didácticos: un patrón de referencia declarado como 2,010 mm produce indicaciones 1,998 mm, 2,000 mm y 1,999 mm con el mismo montaje.',
      steps: [
        'Observar que las tres indicaciones están próximas entre sí: la serie parece precisa bajo esas condiciones.',
        'Compararlas con la referencia declarada y detectar una diferencia sistemática aproximada. La agrupación no elimina ese posible sesgo.',
        'Revisar cero, alineación, contacto y estado de la referencia antes de corregir ningún resultado.',
        'Conservar todas las lecturas y condiciones. No declarar exactitud a partir de la dispersión ni llamar “incertidumbre” al rango sin un modelo justificado.',
        'Expresar la conclusión limitada: “serie repetible con diferencia respecto a esta referencia; causa aún no resuelta”.',
      ],
      conclusion: 'Precisión y cercanía a una referencia responden preguntas distintas. Una decisión metrológica necesita ambas y una declaración explícita de incertidumbre.',
    },
    errors: [
      'Decir “exacto” porque varias lecturas coinciden.',
      'Usar “error” sin indicar el valor de referencia y su autoridad.',
      'Llamar incertidumbre al rango de tres lecturas sin declarar modelo ni contribuciones.',
      'Confundir tolerancia de diseño con dispersión o incertidumbre de medida.',
    ],
    practice: 'Clasifica cuatro series sintéticas según lo que sí permiten afirmar sobre dispersión y referencia. Para una de ellas enumera contribuciones de incertidumbre sin asignarles valores inventados.',
    transfer: 'Traslada el razonamiento a una serie de marcha o amplitud: describe condiciones, dispersión y referencia sin suponer que la lectura del equipo es una verdad sin incertidumbre.',
    sources: [VIM, GUM, NIST],
  },

  instruments: {
    question: '¿Qué instrumento responde al mensurando sin dañar, deformar o volver inaccesible la característica?',
    definitions: [
      ['Sistema de medida', 'Conjunto de uno o más instrumentos y otros dispositivos, incluidas referencias y suministros, reunido para obtener valores medidos.'],
      ['Rango de medición', 'Conjunto de valores de magnitudes de la misma naturaleza que el sistema puede medir bajo condiciones definidas y con una incertidumbre instrumental especificada.'],
      ['Geometría de contacto', 'Forma y orientación de las superficies que tocan la pieza. Puede cambiar qué región se promedia o si una pieza flexible se deforma.'],
      ['Accesibilidad', 'Posibilidad real de alcanzar la característica, alinear el sistema y leerlo sin colisiones ni apoyos ambiguos.'],
      ['Método comparativo', 'Procedimiento que obtiene una diferencia respecto a una referencia; no debe confundirse con una lectura directa absoluta.'],
    ],
    explanation: [
      'Elegir instrumento empieza por el mensurando, no por la herramienta disponible. Un diámetro exterior, el espesor de una lámina, una distancia entre centros y una desviación de planitud requieren contactos, referencias y modelos diferentes. La herramienta más resolutiva puede ser inadecuada si no accede, desalinea la pieza o ejerce una fuerza relevante.',
      'La selección debe responder al menos a cinco preguntas: qué magnitud se busca, qué rango se espera sin convertirlo en tolerancia, qué superficies definen la característica, qué riesgo de deformación o daño existe y qué incertidumbre necesita la decisión. Si una fotografía solo responde a una dimensión planar, no se usa para inferir espesor.',
      'También se registra la alternativa descartada y el motivo. Este pequeño gesto convierte la elección en una decisión revisable: otra persona puede detectar que el contacto era demasiado grande, que el rango no cubría la pieza o que faltaba una referencia.',
    ],
    workedExample: {
      situation: 'Se quiere caracterizar una lámina flexible y una placa rígida. No existe una tolerancia oficial declarada para ninguna de las dos.',
      steps: [
        'Definir por separado el mensurando de cada pieza y las caras que lo delimitan.',
        'Para la placa, comprobar acceso, paralelismo de contactos y rango del instrumento candidato.',
        'Para la lámina, identificar el riesgo de que la fuerza y el área de contacto cambien el espesor observado.',
        'Si no se puede caracterizar la fuerza o la deformación, registrar el método como limitado y considerar una alternativa adecuada; no esconder el riesgo detrás de más decimales.',
        'Documentar instrumento elegido, configuración, alternativa descartada y criterio que permitiría reconsiderar la elección.',
      ],
      conclusion: 'Dos piezas visualmente similares pueden exigir sistemas distintos. La compatibilidad entre mensurando, acceso y contacto precede a cualquier lectura.',
    },
    errors: [
      'Escoger siempre el instrumento con más dígitos o mayor aumento.',
      'Ignorar la fuerza de contacto en piezas flexibles o apoyos delicados.',
      'Usar una imagen 2D para responder una pregunta de profundidad o espesor.',
      'No registrar por qué una alternativa se descartó.',
    ],
    practice: 'Para tres características —diámetro exterior, distancia entre centros y espesor flexible— redacta una ficha de selección con mensurando, rango, acceso, contacto, riesgo y alternativa. No asignes tolerancias que la fuente no proporcione.',
    transfer: 'Aplica la ficha a una característica interna o a un conjunto montado. El instrumento puede cambiar; la justificación por mensurando y riesgo debe conservarse.',
    sources: [VIM, GUM, NIST, ORIGINAL],
  },

  'verification-calibration': {
    question: '¿Qué demuestra una comprobación de cero y por qué no debemos llamarla calibración?',
    definitions: [
      ['Comprobación funcional', 'Ensayo operativo limitado —por ejemplo, limpieza, movimiento y retorno a cero— que documenta un estado observado sin establecer una relación metrológica completa.'],
      ['Verificación', 'Aportación de evidencia objetiva de que un elemento satisface requisitos especificados. Debe nombrar los requisitos; no es sinónimo universal de calibración.'],
      ['Calibración', 'Operación que, bajo condiciones especificadas, establece relaciones entre valores aportados por patrones con sus incertidumbres e indicaciones con sus incertidumbres, y usa después esa información para obtener un resultado de medida.'],
      ['Ajuste', 'Conjunto de operaciones realizadas sobre un sistema para que proporcione indicaciones prescritas. Ajustar cambia el sistema; calibrar caracteriza relaciones y no implica necesariamente ajustar.'],
      ['Trazabilidad metrológica', 'Propiedad de un resultado por la que puede relacionarse con una referencia mediante una cadena documentada e ininterrumpida de calibraciones, cada una contribuyendo a la incertidumbre.'],
    ],
    explanation: [
      'Cerrar un instrumento y observar cero responde una pregunta estrecha: qué indica en esa configuración. No caracteriza su comportamiento a lo largo del rango, no establece una cadena de referencias y no proporciona por sí mismo una corrección ni una incertidumbre. Llamarlo calibración borra información esencial.',
      'Una verificación también necesita un requisito explícito. “Parece funcionar” no indica qué condición se evaluó ni con qué evidencia. En una academia personal puede registrarse una comprobación operativa o una comparación con una referencia disponible, pero el sistema no debe presentar ese acto como calibración acreditada.',
      'El historial importa: instrumento, fecha, condición, referencia usada, resultados, decisión y responsable. Si se realiza un ajuste, las observaciones anteriores y posteriores deben quedar separadas. El dato nunca se reescribe para que el instrumento “parezca correcto”.',
    ],
    workedExample: {
      situation: 'Un instrumento limpio vuelve a cero al cerrarse y se compara en dos puntos con referencias identificadas, pero no existe certificado ni incertidumbre declarada para esas referencias.',
      steps: [
        'Registrar la comprobación de cero, condición y modo de cierre.',
        'Registrar por separado cada referencia, indicación y repetición. No tratarlas como valores certificados si su autoridad no está documentada.',
        'Describir el resultado como “comprobación funcional y comparación interna en puntos declarados”.',
        'No calcular una corrección general ni extrapolar el comportamiento entre puntos.',
        'Marcar qué faltaría para hablar de calibración trazable: referencias apropiadas, incertidumbres, procedimiento y cadena documentada.',
      ],
      conclusion: 'La comprobación puede ser útil y honesta sin recibir un nombre que excede su alcance.',
    },
    errors: [
      'Etiquetar “calibrado” tras una puesta a cero.',
      'Usar una referencia sin identidad o estado como si fuera un patrón certificado.',
      'Ajustar primero y borrar las indicaciones que motivaron el ajuste.',
      'Extrapolar una comparación puntual a todo el rango del instrumento.',
    ],
    practice: 'Redacta un registro de comprobación con instrumento, condición, cero, referencias, indicaciones y límites. Clasifica cada acción como comprobación, verificación frente a un requisito, calibración documentada o ajuste.',
    transfer: 'Compara este caso con la calibración de escala de una fotografía. Ambas crean relaciones, pero una escala 2D no convierte la cámara en instrumento calibrado para profundidad ni acredita trazabilidad metrológica.',
    sources: [VIM, GUM, NIST],
  },

  'physical-specimen': {
    question: '¿Cómo evitamos que una medida de “esta pieza” termine atribuida por error a todo un calibre?',
    definitions: [
      ['Espécimen', 'Unidad física concreta elegida para observar o medir. Su identidad y estado forman parte del alcance del resultado.'],
      ['Identificador estable', 'Código persistente que distingue la unidad aunque cambien su nombre visible, ubicación o conjunto de fotografías.'],
      ['Procedencia', 'Historia documentada de cómo llegó el dato, imagen o pieza: propietario, fuente, fecha, transformación y relación con el original.'],
      ['Estado de recepción', 'Condición observable al registrar la unidad antes de limpiar, desmontar o intervenir. No equivale a historial completo.'],
      ['Alcance', 'Límite explícito de la afirmación: esta unidad, esta pieza, esta cara, estas condiciones y esta fecha.'],
    ],
    explanation: [
      'Una medida necesita sujeto. El nombre de un calibre identifica una familia o variante, pero no sustituye la identidad de la unidad física. Dos unidades pueden haber sido reparadas, mezcladas o alteradas; incluso una pieza correcta puede presentar variación o daño. El sistema debe vincular cada lectura al espécimen y componente concretos.',
      'El alta comienza antes de desmontar: identificador, imágenes generales, marcas, estado, origen conocido y desconocidos. Los datos privados se mantienen locales y separados de fuentes publicables. Si una identificación cambia, se versiona la conclusión sin perder el registro anterior.',
      'La jerarquía evita promociones silenciosas: “medido en unidad X” no se convierte en “dimensión oficial del calibre”. Una fuente oficial puede aportar un nominal; una medición aporta evidencia sobre la unidad. Compararlas requiere conservar ambas autoridades.',
    ],
    workedExample: {
      situation: 'Llega un movimiento sin historial de servicio completo. La placa muestra una marca compatible con una familia, pero una rueda podría ser un repuesto.',
      steps: [
        'Crear un identificador local para el movimiento y fotografiarlo antes de intervención.',
        'Registrar marca visible y la fuente usada para proponer calibre o familia, con nivel de confianza.',
        'Crear identificadores de componente ligados al espécimen, no solo nombres genéricos como “tercera rueda”.',
        'Anotar desconocidos: historial, autenticidad de cada repuesto y operaciones anteriores.',
        'Vincular toda medida posterior a espécimen, componente, fecha, método e instrumento.',
      ],
      conclusion: 'El expediente permite estudiar una unidad sin convertirla en patrón universal ni ocultar su historia incompleta.',
    },
    errors: [
      'Usar el calibre como único identificador del objeto físico.',
      'Renombrar una pieza y perder la identificación provisional anterior.',
      'Mezclar fotografías de distintas unidades en un mismo registro sin procedencia.',
      'Publicar o exportar datos privados por estar asociados a una fuente pública.',
    ],
    practice: 'Crea una ficha de espécimen con identidad estable, origen, imágenes de recepción, componentes, desconocidos y alcance. Formula una afirmación válida solo para la unidad y otra que requeriría una fuente oficial.',
    transfer: 'Repite la ficha con dos unidades de una misma referencia. Compara sin fusionar sus mediciones y señala qué observaciones son compartidas y cuáles siguen siendo individuales.',
    sources: [VIM, ORIGINAL],
  },

  'technical-photography': {
    question: '¿Qué debe conservar una fotografía para funcionar como evidencia y no solo como una imagen bonita?',
    definitions: [
      ['Original inmutable', 'Archivo recibido o capturado que se conserva sin recortes, anotaciones ni reescritura. Las mejoras se guardan como derivados.'],
      ['Vista documentada', 'Combinación de cara, orientación, encuadre, escala, iluminación y configuración que permite localizar lo representado.'],
      ['Referencia de escala', 'Objeto o patrón identificado situado de forma adecuada para relacionar píxeles y longitud en un plano declarado. No resuelve por sí solo perspectiva ni profundidad.'],
      ['Metadatos', 'Datos de captura y contexto: fecha, equipo, configuración relevante, operador, espécimen y relación entre original y derivados.'],
      ['Anotación', 'Capa separada que señala regiones o puntos sin modificar el original y conserva autor, versión y coordenadas de referencia.'],
    ],
    explanation: [
      'Una fotografía técnica responde a una pregunta concreta. La vista general prueba contexto y orientación; la vista de detalle muestra una característica; una vista para medida exige además una referencia en el mismo plano y control de perspectiva. Intentar que una sola imagen cumpla todas las funciones suele sacrificar información.',
      'Iluminación y exposición deben preservar el rasgo, no maximizar dramatismo. Las superficies pulidas pueden saturarse y esconder bordes. El enfoque y la profundidad visible deben verificarse sobre la región de interés. Si se apilan imágenes o se corrige distorsión, el proceso se registra como derivación.',
      'El original se conserva porque permite auditar recortes, contraste y anotaciones. Las coordenadas de una medida o hallazgo pertenecen a una versión concreta de imagen; si cambia el derivado, la relación debe seguir siendo reproducible.',
    ],
    workedExample: {
      situation: 'Se documenta la cara superior de un puente para identidad, estado y una posible medida 2D.',
      steps: [
        'Capturar una vista general con identificador de espécimen y orientación fuera de la región crítica.',
        'Situar una referencia identificada en el mismo plano que la superficie a medir, sin tapar bordes.',
        'Alinear la cámara para reducir perspectiva y registrar que la condición es una aproximación, no una prueba de perpendicularidad perfecta.',
        'Capturar una vista de detalle con iluminación que no sature la arista. Conservar original y crear derivados para recorte o anotación.',
        'Vincular cada archivo con fecha, vista, equipo, espécimen y propósito: contexto, inspección o medición.',
      ],
      conclusion: 'La serie fotográfica separa funciones y conserva procedencia. La imagen preparada para medida sigue limitada a su plano y configuración.',
    },
    errors: [
      'Recortar o aumentar contraste sobre el único archivo disponible.',
      'Colocar la escala en otro plano que la característica.',
      'Saturar una superficie brillante hasta borrar el borde que se quería localizar.',
      'Medir sobre una captura sin saber qué versión, orientación o transformación se usó.',
    ],
    practice: 'Diseña una secuencia de cuatro imágenes: recepción, orientación, detalle y medida planar. Para cada una indica pregunta, montaje, iluminación, archivo original y derivados permitidos.',
    transfer: 'Aplica el protocolo a un antes/después de intervención. Mantén condiciones comparables y evita presentar un cambio de iluminación como cambio físico.',
    sources: [NIST, ORIGINAL],
  },

  'image-measurement': {
    question: '¿Cuándo una distancia en píxeles puede convertirse en longitud y cuándo la perspectiva invalida esa conversión?',
    definitions: [
      ['Coordenada de imagen', 'Posición expresada en el sistema de píxeles de una versión concreta del archivo, vinculada a sus transformaciones y dimensiones.'],
      ['Factor de escala 2D', 'Relación entre distancia en píxeles y longitud de una referencia para un plano y una imagen declarados.'],
      ['Calibración de imagen', 'Procedimiento que establece esa relación y sus límites; no implica que la cámara quede calibrada para cualquier distancia, lente o profundidad.'],
      ['Perspectiva', 'Cambio aparente de forma o escala debido a la geometría entre objeto y cámara. Elementos en planos diferentes pueden tener escalas diferentes.'],
      ['Distorsión', 'Desviación geométrica introducida por el sistema óptico o el procesamiento; debe caracterizarse o limitarse cuando afecta la decisión.'],
    ],
    explanation: [
      'Medir en imagen es un modelo geométrico. La operación básica relaciona dos puntos de referencia con una longitud conocida y usa esa escala para otros puntos del mismo plano. La validez depende de que la referencia y la característica compartan plano, de que la perspectiva sea suficientemente controlada y de que la distorsión no domine.',
      'La selección de bordes también aporta variabilidad: un contorno borroso, una sombra o un bisel permite varios puntos plausibles. Repetir la selección registra esa sensibilidad. Mostrar una línea sobre la imagen no convierte la elección en objetiva; deben conservarse coordenadas y criterio de borde.',
      'La incertidumbre de una medida por imagen puede incluir referencia, selección, escala, perspectiva y distorsión. Sistema 5A conserva contribuciones y repeticiones, pero no afirma implementar automáticamente un presupuesto completo conforme a GUM.',
    ],
    workedExample: {
      situation: 'Datos didácticos: una referencia planar de 10,00 mm ocupa 500 px y una separación seleccionada ocupa 125 px.',
      steps: [
        'Verificar que referencia y característica pertenecen al mismo plano documentado.',
        'Calcular la escala: 500 px ÷ 10,00 mm = 50 px/mm.',
        'Calcular la separación: 125 px ÷ 50 px/mm = 2,50 mm para esa selección.',
        'Repetir los dos puntos de borde y conservar cada resultado. Una diferencia entre selecciones no se borra ni se interpreta sola como defecto.',
        'Rechazar la conversión si la referencia está elevada, la pieza inclinada o el derivado ha cambiado de tamaño sin registrar la transformación.',
      ],
      conclusion: 'El cálculo es reproducible porque conserva imagen, plano, referencia, puntos y operación. No demuestra espesor, profundidad ni dimensión oficial.',
    },
    errors: [
      'Usar una escala colocada en un plano diferente.',
      'Medir sobre una captura redimensionada sin conocer la transformación.',
      'Elegir un borde de sombra en una repetición y un borde material en otra.',
      'Inferir profundidad o perpendicularidad desde una sola vista 2D.',
    ],
    practice: 'Calibra una imagen sintética, repite tres veces la selección de una distancia y registra coordenadas, resultados y causas plausibles de variación. Decide si la pregunta sigue siendo estrictamente planar.',
    transfer: 'Usa el mismo protocolo en una distancia entre centros y en un diámetro aparente. Explica por qué cada característica necesita reglas de selección diferentes aunque comparta escala.',
    sources: [GUM, NIST, ORIGINAL],
  },

  'physical-measurement': {
    question: '¿Qué debe permanecer fijo para que varias lecturas describan la misma característica?',
    definitions: [
      ['Datum o referencia geométrica', 'Elemento elegido para situar u orientar una característica. Su uso debe declararse; el curso no supone una jerarquía de datums que no esté documentada.'],
      ['Alineación', 'Relación geométrica entre pieza, contactos y eje de medición. Un desalineamiento puede cambiar la lectura sin que cambie la pieza.'],
      ['Serie de medición', 'Conjunto ordenado de lecturas con método y condiciones comunes, incluyendo repeticiones descartadas y su motivo.'],
      ['Fuerza de contacto', 'Interacción del instrumento con la pieza que puede desplazarla o deformarla. Si no se conoce, se registra como limitación.'],
      ['Valor adoptado', 'Valor elegido mediante una regla declarada a partir de las lecturas. No equivale automáticamente a valor verdadero ni nominal.'],
    ],
    explanation: [
      'Repetir solo ayuda si la pregunta y el montaje permanecen comparables. Medir un diámetro en orientaciones distintas puede revelar ovalidad o simplemente cambiar la alineación. Antes de promediar hay que saber si las lecturas representan repeticiones del mismo mensurando o características distintas.',
      'El procedimiento declara limpieza autorizada, apoyos, datum, orientación, contactos, fuerza disponible, instrumento y condiciones. La pieza se manipula con seguridad y sin forzar el resultado hacia un valor esperado. Cada lectura se registra en el orden obtenido.',
      'La regla de adopción depende del propósito: una media puede resumir repeticiones comparables; máximo y mínimo pueden ser relevantes si se investiga variación geométrica. Sistema 5A no inventa tolerancias ni elige automáticamente la regla.',
    ],
    workedExample: {
      situation: 'Se mide un cilindro sintético en tres orientaciones. Las cifras son didácticas y no pertenecen a un calibre.',
      steps: [
        'Definir si se busca un diámetro medio bajo un montaje repetible o variación con la orientación.',
        'Marcar orientación, apoyar la pieza y alinear contactos de la misma forma en cada lectura.',
        'Conservar 2,002 mm, 2,006 mm y 2,001 mm como serie, junto con resolución y condiciones.',
        'No promediar todavía si la orientación forma parte de la pregunta. Revisar desalineación y repetir en el mismo ángulo antes de atribuir la variación a la pieza.',
        'Adoptar un valor solo después de declarar regla y alcance; sin tolerancia oficial no se emite aceptación o rechazo.',
      ],
      conclusion: 'La serie es evidencia, no una conclusión automática. El mensurando y la regla de adopción deciden cómo se interpreta.',
    },
    errors: [
      'Promediar lecturas que corresponden a orientaciones o datums distintos.',
      'Presionar hasta obtener el número esperado.',
      'Descartar una lectura sin conservarla y justificar el motivo.',
      'Emitir “correcto/incorrecto” sin requisito o tolerancia de fuente.',
    ],
    practice: 'Diseña un procedimiento para diámetro o distancia entre centros. Incluye mensurando, datum, orientación, contacto, repeticiones, regla de adopción y condición que invalidaría la serie.',
    transfer: 'Transfiere el procedimiento a una pieza flexible o a un conjunto montado. Identifica qué nuevas contribuciones aparecen y qué parte del método anterior deja de ser válida.',
    sources: [VIM, GUM, NIST],
  },

  'inspection-findings': {
    question: '¿Cómo registramos una marca, depósito o deformación sin convertirla prematuramente en causa de fallo?',
    definitions: [
      ['Hallazgo', 'Observación localizada que merece seguimiento. Puede incluir apariencia, extensión y condiciones, pero no exige una causa confirmada.'],
      ['Síntoma', 'Manifestación asociada a un comportamiento observado. Puede orientar una investigación, no demostrar por sí sola el mecanismo causal.'],
      ['Hipótesis diagnóstica', 'Explicación provisional que conecta hallazgos y síntomas y debe acompañarse de predicciones o comprobaciones.'],
      ['Criterio de refutación', 'Resultado observable que haría abandonar o reducir la confianza en una hipótesis.'],
      ['Confianza', 'Grado declarado de apoyo de la evidencia disponible. No reemplaza la evidencia ni convierte una opinión en dato oficial.'],
    ],
    explanation: [
      'Un hallazgo debe poder localizarse: espécimen, componente, cara, región, imagen y condiciones. “Sucio” o “dañado” mezcla observación, valoración y causa. Una formulación más útil describe color, forma, relieve, continuidad y respuesta a cambios de luz o enfoque.',
      'El diagnóstico aparece después. Varias causas pueden producir una apariencia similar, y una misma causa puede producir síntomas distintos. La ficha enlaza observaciones, hipótesis, confianza y comprobaciones sin eliminar alternativas.',
      'Las palabras “defecto”, “fuera de tolerancia” o “no conforme” requieren un requisito aplicable. Sin él, el sistema conserva una discrepancia u observación y evita emitir una decisión de aceptación automática.',
    ],
    workedExample: {
      situation: 'En torno a un rubí se observa una zona oscura irregular. No se ha autorizado limpieza ni existe historial completo.',
      steps: [
        'Registrar región, iluminación, aumento e imagen original. Describir forma y color sin llamarla aceite degradado.',
        'Cambiar dirección de luz y enfoque. Anotar qué parte permanece y qué parte parece reflejo.',
        'Crear hipótesis separadas: depósito superficial, sombra geométrica o material bajo el borde.',
        'Para cada hipótesis, proponer una comprobación segura y autorizada. No intervenir solo para confirmar la opción preferida.',
        'Asignar confianza y mantener el hallazgo abierto si la evidencia no discrimina las alternativas.',
      ],
      conclusion: 'La ficha ayuda al diagnóstico precisamente porque no lo adelanta. Conserva alternativas y una ruta de comprobación.',
    },
    errors: [
      'Usar una etiqueta causal como primera observación.',
      'Borrar hipótesis alternativas cuando aparece una explicación plausible.',
      'Declarar no conformidad sin requisito aplicable.',
      'Modificar o limpiar la pieza antes de conservar el estado inicial.',
    ],
    practice: 'Registra tres hallazgos en formato “observación, localización, condiciones, hipótesis, prueba de refutación y confianza”. Al menos uno debe permanecer sin diagnóstico.',
    transfer: 'Aplica la ficha a una marca de herramienta, corrosión aparente o deformación. Cambia el fenómeno, pero conserva la separación entre evidencia y causa.',
    sources: [NIST, ORIGINAL],
  },

  'compare-data': {
    question: '¿Cuándo dos valores responden a la misma pregunta y pueden compararse sin mezclar autoridades?',
    definitions: [
      ['Dato nominal', 'Valor asociado a una especificación o definición. Su autoridad depende de la fuente y revisión; no se obtiene promediando unidades físicas.'],
      ['Dato medido', 'Resultado vinculado a una unidad, mensurando, método, condiciones e incertidumbre. No asciende a nominal por repetirse.'],
      ['Dato estimado o reconstruido', 'Valor inferido a partir de imágenes, proporciones o modelos. Debe conservar método y nivel de confianza.'],
      ['Comparabilidad', 'Compatibilidad suficiente entre mensurando, unidad, datum, condición y método para que la diferencia tenga significado.'],
      ['Tolerancia', 'Intervalo o límite procedente de un requisito de diseño o aceptación. No se deduce de la incertidumbre ni se inventa para cerrar una comparación.'],
    ],
    explanation: [
      'Antes de restar números hay que comparar definiciones. Un diámetro máximo y un diámetro medio, una pieza montada y otra libre, o una distancia 2D y otra medida físicamente pueden llevar la misma unidad y, aun así, no representar el mismo mensurando.',
      'La tabla de comparación conserva columnas separadas para oficial, medido, estimado y desconocido. Cada celda enlaza su fuente. La discrepancia se calcula solo cuando las bases son compatibles, y se interpreta junto con incertidumbre y cualquier tolerancia realmente declarada.',
      'Una diferencia no demuestra cuál dato es erróneo: puede proceder de variante, unidad concreta, método, datum, transformación de imagen o fuente desactualizada. El resultado correcto puede ser “no comparable todavía”.',
    ],
    workedExample: {
      situation: 'Un plano aporta una dimensión nominal N; una fotografía produce una estimación E y una unidad física produce un resultado M con incertidumbre declarada. No hay tolerancia publicada.',
      steps: [
        'Verificar que N, E y M describen las mismas caras, región y condición. Si no, detener la resta.',
        'Registrar autoridad: plano oficial, reconstrucción visual y medición de una unidad concreta.',
        'Comparar M con N solo tras revisar datum, unidad y variante. Conservar la incertidumbre de M.',
        'Usar E como apoyo visual, no como árbitro entre nominal y medido.',
        'Describir cualquier diferencia sin aceptar o rechazar la pieza: falta una tolerancia aplicable.',
      ],
      conclusion: 'La comparación produce una discrepancia con procedencia y límites, no una sentencia automática sobre la pieza o el plano.',
    },
    errors: [
      'Restar valores porque comparten unidad aunque definan regiones distintas.',
      'Tratar una reconstrucción estimada como dimensión oficial.',
      'Confundir incertidumbre de medida con tolerancia de diseño.',
      'Escoger el valor que coincide con la expectativa y descartar los demás.',
    ],
    practice: 'Construye una matriz con cuatro columnas: oficial, medido, estimado y desconocido. Para cada fila declara mensurando, datum, condición, fuente y si la comparación es válida, parcial o bloqueada.',
    transfer: 'Compara dos calibres o dos unidades sin heredar dimensiones. Identifica primero qué conceptos son transferibles y qué datos deben volver a medirse o documentarse.',
    sources: [VIM, GUM, NIST, ORIGINAL],
  },

  'improve-virtual-model': {
    question: '¿Cómo puede una medición mejorar un modelo sin borrar el canon ni convertir una unidad en verdad universal?',
    definitions: [
      ['Propuesta de corrección', 'Cambio candidato que vincula discrepancia, evidencia, parámetro afectado, alcance y prueba de validación. No modifica por sí mismo el modelo aprobado.'],
      ['Variante', 'Representación explícitamente separada para una unidad, revisión o hipótesis. Evita sobrescribir un modelo canónico con datos de alcance menor.'],
      ['Parámetro', 'Valor controlado del modelo cuya procedencia y unidad pueden rastrearse. Cambiarlo requiere conocer qué geometría depende de él.'],
      ['Validación', 'Obtención de evidencia objetiva de que se satisfacen requisitos para un uso previsto. Una mejora visual no valida automáticamente cinemática o física.'],
      ['Reversibilidad', 'Capacidad de volver al estado anterior conservando propuesta, autor, fecha, razón y resultados de comprobación.'],
    ],
    explanation: [
      'El puente físico-digital debe ser aditivo. La medición crea evidencia y una posible propuesta; no escribe directamente sobre CAD, canon o dimensiones oficiales. Esto evita que un error de datum, una pieza sustituida o una unidad atípica contamine todos los proyectos.',
      'Una propuesta mínima incluye parámetro actual, valor candidato, origen, incertidumbre, espécimen, diferencias esperadas y pruebas. Si el cambio solo mejora contorno o apariencia, se limita a fidelidad geométrica. Engranes, holguras y comportamiento requieren validaciones distintas.',
      'La revisión compara antes/después en una rama o variante y conserva el modelo original. Aceptar una corrección exige autoridad apropiada: una medida puede justificar una variante específica; elevar el canon necesita evidencia más amplia y revisión humana.',
    ],
    workedExample: {
      situation: 'Varias mediciones repetidas de una unidad sugieren que la separación de dos alojamientos difiere del modelo visual estimado.',
      steps: [
        'Confirmar que ambos valores usan los mismos centros, datum y condición.',
        'Crear una discrepancia vinculada a lecturas, imágenes, instrumento y espécimen.',
        'Proponer un parámetro nuevo en una variante de esa unidad; no sustituir el valor canónico ni llamarlo oficial.',
        'Recalcular dependencias geométricas y comprobar interferencias visuales. No afirmar engrane o funcionamiento si esas pruebas no existen.',
        'Solicitar revisión y conservar decisión: aceptar variante, pedir evidencia o rechazar con motivo.',
      ],
      conclusion: 'El modelo mejora mediante una propuesta trazable y reversible. El alcance de la evidencia determina el alcance del cambio.',
    },
    errors: [
      'Editar directamente el CAD desde una sola lectura.',
      'Promover una medida de unidad a dimensión oficial del calibre.',
      'Elevar fidelidad cinemática o física porque el contorno se parece más.',
      'Perder el valor anterior, las dependencias o la razón del cambio.',
    ],
    practice: 'Redacta una propuesta con discrepancia, evidencia, parámetro, alcance, dependencias, riesgo, validación y reversión. Decide si corresponde a una variante o si puede siquiera solicitar revisión canónica.',
    transfer: 'Aplica el flujo a un pie de esfera, una posición de tornillo o un contorno de puente. No transfieras el valor: transfiere el contrato de cambio y revisión.',
    sources: [VIM, GUM, ORIGINAL],
  },

  'final-project': {
    question: '¿Qué debe contener un dossier para que otra persona pueda reconstruir el razonamiento sin confiar en nuestra memoria?',
    definitions: [
      ['Dossier trazable', 'Conjunto versionado de preguntas, fuentes, registros, resultados, decisiones y límites enlazados a una unidad concreta.'],
      ['Cadena afirmación–evidencia–límite', 'Estructura que indica qué se afirma, qué registros lo apoyan y dónde deja de ser válida la conclusión.'],
      ['Reproducibilidad documental', 'Capacidad de repetir el procedimiento a partir del dossier, aun cuando el resultado pueda variar por condiciones declaradas.'],
      ['Revisión independiente', 'Lectura o repetición por otra persona que no hereda supuestos privados y puede cuestionar identidad, método y conclusión.'],
      ['Criterio de parada', 'Condición definida antes de seguir interviniendo: evidencia insuficiente, riesgo físico, fuente ausente o resultado no comparable.'],
    ],
    explanation: [
      'El proyecto final no premia acumular cifras. Premia construir una cadena auditable desde la recepción del espécimen hasta una comparación o propuesta. Cada conclusión enlaza observaciones, imágenes originales, instrumento, verificaciones, lecturas, cálculo, incertidumbre y fuentes.',
      'El dossier también conserva decisiones negativas: por qué una imagen no era medible, por qué una lectura se mantuvo como atípica, por qué no existía tolerancia o por qué una propuesta no debía modificar el canon. Estos bloqueos son conocimiento, no fallos de presentación.',
      'La defensa comprueba comprensión y límites. La persona debe explicar el mensurando, distinguir precisión de exactitud, justificar instrumento y datum, separar hallazgo de diagnóstico y proponer una transferencia a otra unidad sin copiar datos. La revisión humana sigue siendo necesaria para cualquier afirmación profesional.',
    ],
    workedExample: {
      situation: 'Dossier didáctico de una rueda perteneciente a un espécimen identificado, con fotografía técnica, una serie física y comparación con una fuente disponible.',
      steps: [
        'Abrir con pregunta, alcance, identidad del espécimen y desconocidos.',
        'Incluir observaciones previas, vistas originales y derivados con procedencia.',
        'Definir mensurando, datum, instrumento, comprobación, lecturas y regla de adopción.',
        'Comparar solo datos compatibles y declarar incertidumbre, ausencia de tolerancia y límites de generalización.',
        'Cerrar con hallazgos, propuesta opcional, criterio de revisión, transferencia y lista de asuntos bloqueados.',
      ],
      conclusion: 'Una persona externa puede seguir la cadena, localizar cada fuente y saber qué no se ha demostrado. Esa transparencia es el producto final.',
    },
    errors: [
      'Presentar únicamente el valor adoptado y ocultar lecturas, descartes o condiciones.',
      'Confundir una interfaz completa con una calibración o validación profesional.',
      'Omitir resultados negativos, datos desconocidos o ausencia de tolerancia.',
      'Defender el proyecto repitiendo conclusiones sin poder enlazarlas a evidencia.',
    ],
    practice: 'Construye el índice del dossier y comprueba que cada afirmación técnica tiene evidencia, autoridad y límite. Añade una página de “lo que todavía no sé” y una lista de decisiones reversibles.',
    transfer: 'Entrega el dossier a una revisión ciega o aplícalo a otra unidad. La transferencia se supera si el método se conserva sin copiar dimensiones, tolerancias ni diagnósticos del primer caso.',
    sources: [VIM, GUM, NIST, ORIGINAL],
  },
}

const SYSTEM5A_DEPTH_STUDIES = {
  'physical-specimen': 'Antes de aceptar cualquier lectura, reconstruye su cadena de identidad en ambos sentidos. Desde el número debe poder llegarse al componente, al espécimen, a la vista o montaje, al instrumento y a la fecha; desde el espécimen debe poder localizarse cada resultado que se le atribuyó. Comprueba además qué ocurrió entre el estado de recepción y la observación: limpieza, desmontaje, sustitución o simple cambio de orientación. Si un eslabón falta, el dato puede conservarse como registro local, pero su alcance queda reducido. Este control evita fusionar piezas visualmente parecidas y permite corregir una identificación sin borrar la historia de decisiones anteriores.',
  'technical-photography': 'Planifica la serie antes de disparar. Asigna a cada fotografía una sola función principal —identidad, orientación, inspección o medición planar— y una condición que obligaría a repetirla. Para comparar dos capturas, conserva cara, orientación, iluminación y transformación; si una condición cambia, descríbela como variable del ensayo. Revisa también paralaje y saturación sobre la región de interés, no solo en el aspecto general. Una imagen nítida puede seguir siendo inválida para medir si la referencia está en otro plano, y una imagen poco vistosa puede ser la mejor evidencia de un borde si mantiene contexto y procedencia.',
  'physical-measurement': 'Define antes de leer qué harás con una serie discrepante. La regla puede exigir repetir el montaje, revisar cero y alineación, conservar una lectura atípica o detenerse; no debe inventarse después de ver qué resultado conviene. Alterna, cuando sea posible, la aproximación al punto para detectar juego o dependencia del contacto y registra el orden de las lecturas. Si desmontar y volver a montar cambia el valor, esa variación pertenece al proceso y no se oculta mediante un promedio. El valor adoptado necesita regla, unidades, trazabilidad al dato original y una explicación de por qué representa la pregunta formulada.',
  'inspection-findings': 'Organiza las hipótesis en una tabla de discriminación. Cada fila contiene una explicación posible; cada columna, una observación o prueba que debería cambiar de forma distinta entre hipótesis. Escribe la predicción antes de mirar el resultado para no convertir cualquier señal en confirmación. Distingue además tres estados: compatible, debilitada y todavía no comprobable. “Compatible” no significa causa demostrada. Si la prueba exigiría tocar, limpiar o desmontar una zona, registra el cambio de estado y el riesgo antes de ejecutarla. El informe final puede terminar con varias hipótesis abiertas si la evidencia disponible no permite separarlas con seguridad.',
  'compare-data': 'Usa un árbol de comparabilidad antes de calcular diferencias. Primero verifica que ambos valores describen la misma característica y el mismo datum; después, que sus unidades, condiciones y transformación permiten la comparación; por último, identifica la autoridad de cada valor. Solo entonces tiene sentido calcular una discrepancia. La ausencia de tolerancia no impide describir la diferencia, pero sí impide convertirla en conformidad o rechazo. Si un dato procede de una reconstrucción visual y otro de una unidad física, la conclusión debe conservar esa asimetría: puede orientar una revisión del modelo, pero no reescribir una dimensión nominal ni generalizar la unidad.',
  'improve-virtual-model': 'Convierte la propuesta en un pequeño experimento versionado. Antes del cambio, captura el estado de referencia y enumera qué resultados deberían variar y cuáles deberían permanecer iguales. Después modifica un parámetro en una rama, vuelve a ejecutar las mismas comprobaciones y compara contra criterios escritos con antelación. Si mejora el contorno pero aparece una interferencia, el resultado no es una mejora global: es evidencia para revisar la hipótesis. Registra también dependencias no verificadas y el procedimiento de reversión. Aceptar una variante de espécimen, corregir una reconstrucción y elevar el modelo canónico son decisiones distintas y requieren autoridades distintas.',
  'final-project': 'Prepara una matriz de auditoría además del índice narrativo. Las filas son las conclusiones; las columnas señalan evidencia primaria, transformación, método, incertidumbre o límite, fuente y decisión siguiente. Una celda vacía obliga a retirar, debilitar o bloquear la afirmación. Después realiza una prueba de reconstrucción: entrega solo el dossier y comprueba si otra persona puede localizar la pieza, repetir un cálculo y explicar por qué una alternativa fue descartada. La defensa no consiste en recordar el texto, sino en navegar esa cadena y reconocer dónde termina. Conserva las preguntas sin resolver como trabajo futuro priorizado, no como notas ocultas al final.',
}

function localized(value) {
  return { es: value }
}

function idPart(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function requiredLesson(slug) {
  const content = SYSTEM5A_METROLOGY_LESSONS[slug]
  if (!content) throw new Error(`Falta contenido metrológico específico para ${slug}.`)
  return content
}

function fieldId(activityId, name) {
  return `field.${idPart(activityId)}.${name}`
}

function choiceOptions(activityId, content) {
  const base = idPart(activityId)
  const values = [
    ['defensible', content.workedExample.conclusion],
    ['error-one', content.errors[0]],
    ['error-two', content.errors[1]],
  ]
  return values.map(([suffix, label]) => ({
    id: `option.${base}.${suffix}`,
    label,
    labels: { es: label, en: label },
  }))
}

function guidedFields(activityId, content, withOptionIds = false) {
  const options = choiceOptions(activityId, content)
  return [
    {
      id: fieldId(activityId, 'decision'),
      label: content.question,
      kind: 'choice',
      required: true,
      ...(withOptionIds ? { optionIds: options.map(({ id }) => id) } : {}),
    },
    {
      id: fieldId(activityId, 'justification'),
      label: 'Justifica qué evidencia y qué límite hacen defendible tu elección.',
      kind: 'short-text',
      required: true,
      ...(withOptionIds ? { optionIds: [] } : {}),
    },
    {
      id: fieldId(activityId, 'confidence'),
      label: 'Confianza en la decisión',
      kind: 'confidence',
      required: true,
      ...(withOptionIds ? { optionIds: [] } : {}),
    },
  ]
}

function independentFields(activityId, withOptionIds = false) {
  return [
    ['observation', 'Observación o resultado transferido', 'short-text'],
    ['method', 'Método y referencia empleados', 'short-text'],
    ['limitation', 'Límite, dato ausente o condición de invalidez', 'short-text'],
    ['confidence', 'Confianza en la conclusión', 'confidence'],
  ].map(([name, label, kind]) => ({
    id: fieldId(activityId, name),
    label,
    kind,
    required: true,
    ...(withOptionIds ? { optionIds: [] } : {}),
  }))
}

function specificHints(activityId, content, independent) {
  const base = idPart(activityId)
  return independent
    ? [
      {
        id: `hint.${base}.1`,
        level: 1,
        kind: 'orientation',
        content: localized(`Vuelve a la pregunta del módulo: ${content.question}`),
        availableAfterAttempts: 0,
        countsAsHint: true,
      },
      {
        id: `hint.${base}.2`,
        level: 2,
        kind: 'comparison',
        content: localized(`Comprueba que transfieres el método, no el dato: ${content.transfer}`),
        availableAfterAttempts: 1,
        countsAsHint: true,
      },
      {
        id: `hint.${base}.3`,
        level: 3,
        kind: 'post-attempt-explanation',
        content: localized(`Una conclusión limitada posible es: ${content.workedExample.conclusion}`),
        availableAfterAttempts: 1,
        countsAsHint: true,
      },
    ]
    : [
      {
        id: `hint.${base}.1`,
        level: 1,
        kind: 'orientation',
        content: localized(`Localiza qué evidencia responde a esta pregunta: ${content.question}`),
        availableAfterAttempts: 0,
        countsAsHint: true,
      },
      {
        id: `hint.${base}.2`,
        level: 2,
        kind: 'comparison',
        content: localized(`Compara la conclusión limitada con este error: ${content.errors[0]}`),
        availableAfterAttempts: 1,
        countsAsHint: true,
      },
      {
        id: `hint.${base}.3`,
        level: 3,
        kind: 'post-attempt-explanation',
        content: localized(`La opción defendible conserva este límite: ${content.workedExample.conclusion}`),
        availableAfterAttempts: 1,
        countsAsHint: true,
      },
    ]
}

/** Crea el contrato de la práctica guiada (par) o independiente (impar). */
export function buildSystem5aInteraction(index, activityId, slug) {
  const content = requiredLesson(slug)
  const independent = index % 2 === 1
  const structuredFields = independent
    ? independentFields(activityId)
    : guidedFields(activityId, content)
  return {
    responseModel: 'structured-response',
    orderedItems: [],
    expectedOrderIds: [],
    structuredFields: structuredFields.map((field) => ({
      ...field,
      label: localized(field.label),
    })),
    hints: specificHints(activityId, content, independent),
    evidencePolicy: {
      eventType: 'answer-submitted',
      recordsAnswerPayload: true,
      deterministicComponents: independent ? [] : [fieldId(activityId, 'decision')],
      requiresHumanReview: true,
      accessibilityAdaptationsCountAsHints: false,
    },
  }
}

/** Crea una pregunta de escena específica y alineada con el contrato anterior. */
export function buildSystem5aSceneQuestion(index, activityId, title, slug) {
  const content = requiredLesson(slug)
  const independent = index % 2 === 1
  const questionId = `question.${idPart(activityId)}`
  if (!independent) {
    const options = choiceOptions(activityId, content)
    const fields = guidedFields(activityId, content, true)
    return {
      question: {
        id: questionId,
        promptMarkdown: `${content.question}\n\nEn «${title}», elige la conclusión que no excede la evidencia del ejemplo y justifica por qué las otras dos opciones fallan.`,
        responseKind: 'structured-response',
        options,
        structuredFields: fields,
        humanReviewRequired: true,
        authoring: {
          prompt: localized(`Decide y justifica: ${content.question}`),
          feedback: localized(`La conclusión defendible conserva evidencia y alcance: ${content.workedExample.conclusion}`),
        },
      },
      success: {
        condition: 'structured-answer',
        questionId,
        requiredFieldIds: fields.map(({ id }) => id),
        pendingHumanReview: true,
      },
    }
  }

  const fields = independentFields(activityId, true)
  return {
    question: {
      id: questionId,
      promptMarkdown: `${content.question}\n\nEn «${title}», resuelve un contexto nuevo: ${content.transfer} Documenta observación o resultado, método, límite y confianza sin copiar el dato del ejemplo.`,
      responseKind: 'structured-response',
      structuredFields: fields,
      humanReviewRequired: true,
      authoring: {
        prompt: localized(`Transfiere el criterio de «${title}» a un contexto nuevo.`),
        feedback: localized(`La transferencia conserva el método y vuelve a declarar sus límites: ${content.transfer}`),
      },
    },
    success: {
      condition: 'structured-answer',
      questionId,
      requiredFieldIds: fields.map(({ id }) => id),
      pendingHumanReview: true,
    },
  }
}

function bulletList(items) {
  return items.map((item) => `- ${item}`).join('\n')
}

function definitionList(definitions) {
  return definitions.map(([term, definition]) => `- **${term}.** ${definition}`).join('\n')
}

function numberedList(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n')
}

export function buildSystem5aLessonBody(slug, title, focus, order) {
  const content = requiredLesson(slug)
  const bridge = order === 0
    ? 'No se presupone experiencia metrológica. Empieza por describir y formular una pregunta antes de medir.'
    : 'Recupera el criterio anterior solo cuando lo necesites; esta lección añade una decisión nueva y no repite el módulo completo.'

  return `# ${title}

## Pregunta guía

${content.question}

${bridge} El objetivo de esta lección es ${focus}.

## Conceptos y definiciones

${definitionList(content.definitions)}

## Explicación paso a paso

${content.explanation.join('\n\n')}

## Ejemplo trabajado concreto

**Situación.** ${content.workedExample.situation}

${numberedList(content.workedExample.steps)}

**Conclusión limitada.** ${content.workedExample.conclusion}

${SYSTEM5A_DEPTH_STUDIES[slug] ? `## Profundización aplicada\n\n${SYSTEM5A_DEPTH_STUDIES[slug]}\n` : ''}

## Errores frecuentes y por qué fallan

${bulletList(content.errors)}

## Práctica deliberada

${content.practice}

La práctica debe conservar la respuesta inicial, cualquier revisión y el motivo del cambio. Una adaptación de accesibilidad no cuenta como pista. Completar la tarea acredita como máximo el nivel definido por su rúbrica; no demuestra retención en la misma sesión.

## Transferencia

${content.transfer}

## Fuentes y límites

${bulletList(content.sources)}

Los conceptos formales se contrastan con las fuentes indicadas. Los ejemplos numéricos son sintéticos y educativos: no son dimensiones, tolerancias ni criterios de aceptación de un fabricante. Watch Prototype Lab no certifica calibraciones, no diagnostica automáticamente y no modifica el CAD o el canon desde esta lección.`
}
