import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = join(process.cwd(), 'learning-content', 'advanced-watchmaking')
const version = '1.0.0'
const packageId = 'wplab.horology.advanced-architecture-service'
const createdAt = '2026-08-02T00:00:00.000Z'
const fixtureId = 'fixture.conceptual.mechanical-chain'
const L = (es, en = es) => ({ es, en })
const unique = (values) => [...new Set(values)]
const words = (value) => value.replace(/[#*`>|]/g, ' ').trim().split(/\s+/).filter(Boolean).length
const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const sources = [
  ['source.eta.6497-2.product', 'manufacturer-primary', 'official-linked', 'web-page', 'ETA 6497-2 product page', 'https://portal.eta.ch/fr/6497-2-6497-2-3.html', 'ETA', 'official-primary', 'Identidad, funciones y características declaradas del ETA 6497-2.'],
  ['source.eta.6497-2.communication', 'manufacturer-primary', 'official-linked', 'pdf', 'ETA 6497-2 Technical Communication', 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/', 'ETA', 'official-primary', 'Despiece, seguridad, secuencia y documentación técnica oficial del 6497-2.'],
  ['source.eta.2824-2.product', 'manufacturer-primary', 'official-linked', 'web-page', 'ETA 2824-2 product page', 'https://portal.eta.ch/en/mecaline/2824-2-2824-2-5.html', 'ETA', 'official-primary', 'Funciones declaradas: segundos centrales, fecha y automático bidireccional.'],
  ['source.eta.7750.product', 'manufacturer-primary', 'official-linked', 'web-page', 'ETA 7750 product page', 'https://portal.eta.ch/en/7750-7750-5.html', 'ETA', 'official-primary', 'Funciones declaradas del cronógrafo 7750, calendario y automático.'],
  ['source.eta.7750.communication', 'manufacturer-primary', 'official-linked', 'pdf', 'ETA 7750 Technical Communication', 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/2080/', 'ETA', 'official-primary', 'Comunicación técnica oficial del ETA 7750, verificada visualmente como documento de 44 páginas.'],
  ['source.seiko.42.technical-guide', 'manufacturer-primary', 'official-linked', 'pdf', 'Seiko 42 family Technical Guide', 'https://seikoserviceusa.com/uploads/datasheets/4205C_06_07_08_25B_27.pdf', 'Seiko', 'official-primary', 'Sistema pawl lever, carga bidireccional y ruta de cuerda manual documentados.'],
  ['source.seiko.6138a.technical-guide', 'manufacturer-primary', 'official-linked', 'pdf', 'Seiko 6138A Technical Guide', 'https://seikoserviceusa.com/uploads/datasheets/6138A.pdf', 'Seiko', 'official-primary', 'Cronógrafo automático, embrague, palanca de uñas y calendario documentados.'],
  ['source.miyota.8215.official', 'official-miyota', 'official-linked', 'web-page', 'MIYOTA 8215 official documentation', 'https://miyotamovement.com/product/8215/', 'MIYOTA', 'official-primary', 'Identidad y documentación oficial disponible del MIYOTA 8215.', '8215'],
  ['source.miyota.2035.official', 'official-miyota', 'official-linked', 'web-page', 'MIYOTA 2035 official documentation', 'https://miyotamovement.com/product/2035/', 'MIYOTA', 'official-primary', 'Identidad y documentación oficial disponible del MIYOTA 2035.', '2035'],
  ['source.external.ranfft', 'reference-database', 'external-linked', 'dataset', 'Ranfft Watches and Movements', 'http://www.ranfft.de/cgi-bin/bidfun-db.cgi?10&ranfft&&2uswk', 'Roland Ranfft', 'database-index', 'Archivo secundario para descubrimiento e identificación; todo dato requiere contraste.'],
  ['source.external.17jewels', 'educational-secondary', 'external-linked', 'web-page', '17jewels movement archive', 'https://17jewels.info/', '17jewels', 'database-index', 'Fotografías y fichas secundarias para localizar familias y documentación.'],
  ['source.external.watchguy', 'expert-practice', 'external-linked', 'web-page', 'The Watch Guy repair archive', 'https://watchguy.co.uk/', 'The Watch Guy', 'expert-observation', 'Casos fotográficos de servicio; observaciones de unidades, no especificaciones universales.'],
  ['source.external.pocketwatchdatabase', 'reference-database', 'external-linked', 'dataset', 'Pocket Watch Database', 'https://pocketwatchdatabase.com/', 'Pocket Watch Database', 'database-index', 'Registros históricos para identidad contextual con incertidumbre explícita.'],
].map(([id, authority, usage, kind, title, locator, authorOrManufacturer, sourceClass, supportedClaim, calibre]) => ({
  id, authority, usage, resource: { kind, title, locator }, authorOrManufacturer,
  sourceType: sourceClass === 'official-primary' ? (authority === 'official-miyota' ? 'official-miyota-documentation' : 'manufacturer-technical-documentation') : sourceClass === 'database-index' ? 'reference-database' : 'expert-technical-article',
  ...(calibre ? { calibre, revision: 'Página oficial vigente; revisión documental consultada el 2026-08-02.' } : {}), retrievedAt: '2026-08-02', authorityTier: sourceClass === 'official-primary' ? 'A' : sourceClass === 'expert-observation' ? 'C' : 'D', sourceClass,
  languages: ['en'], topics: ['arquitectura', 'identidad', 'procedimiento'], pedagogicalUses: sourceClass === 'official-primary' ? ['theory', 'procedure-contrast'] : ['discovery', 'calibre-identification'],
  availability: 'online', checkedAt: '2026-08-02', rights: 'link-only', offlineReady: false,
  validationPolicy: sourceClass === 'official-primary' ? 'Aplicar solo a la referencia y revisión citadas.' : 'Usar para descubrimiento y contraste; no elevar a dato oficial sin fuente primaria.',
  limitations: sourceClass === 'official-primary' ? ['La documentación de una referencia no se transfiere automáticamente a otra.'] : ['La autoridad es secundaria y puede estar incompleta.'],
  supportedClaim, derivedLayer: 'source',
}))

const routeDefinitions = {
  atlas: { id: 'route.advanced.comparative-atlas', title: 'Atlas comparativo de movimientos', purpose: 'Aprender a comparar familias, calibres y fuentes sin confundir identidad, arquitectura, aspecto ni autoridad.', difficulty: 'intermediate' },
  service: { id: 'route.advanced.service-method', title: 'Método de servicio y evidencia', purpose: 'Preparar, secuenciar, inspeccionar y documentar una intervención con riesgos, criterios y evidencia física separados.', difficulty: 'advanced' },
  architecture: { id: 'route.advanced.architectures-complications', title: 'Arquitecturas y complicaciones', purpose: 'Razonar sobre segundos, automáticos, escapes, extraplano, calendarios y cronógrafos como sistemas de relaciones y compromisos.', difficulty: 'advanced' },
}

const topics = [
  {
    slug: 'atlas-authority', route: 'atlas', title: 'Leer un movimiento con autoridad y procedencia', subsystem: 'epistemology', duration: 42,
    sourceIds: ['source.eta.6497-2.communication', 'source.external.ranfft', 'source.external.17jewels', 'source.external.watchguy', 'source.external.pocketwatchdatabase'],
    caseIds: ['case.eta.6497-2', 'case.archive.service-reading', 'case.archive.pocket-watch-identity'], axes: ['identity-and-provenance', 'trade-offs'], representation: 'document-table',
    question: '¿Qué puedo afirmar, qué solo puedo inferir y qué sigue siendo desconocido?',
    mechanism: `Una ficha técnica, una lista de piezas, una fotografía de servicio y una base histórica no responden a la misma pregunta. La fuente oficial puede fijar identidad, función, denominación y procedimiento para una revisión concreta; una fotografía puede demostrar el aspecto de una unidad en un instante; una base secundaria puede orientar la búsqueda; una medición describe el ejemplar medido bajo condiciones declaradas. El trabajo experto comienza clasificando cada afirmación antes de combinarla con otras.`,
    comparison: `El Atlas usa una matriz de cinco columnas: afirmación, tipo de evidencia, autoridad, alcance y desconocidos. Que dos puentes se parezcan no identifica un calibre. Que un número coincida no garantiza variante o revisión. Que un reportaje muestre una secuencia correcta para su unidad no convierte esa secuencia en manual del fabricante. Cuando dos fuentes discrepan, no se promedia: se conserva la contradicción, se busca una fuente de mayor autoridad y se reduce la confianza.`,
    worked: `Caso resuelto: una foto muestra pequeño segundero y puentes separados; Ranfft sugiere una familia; una comunicación ETA confirma la referencia 6497-2. La foto apoya aspecto y estado de esa unidad, la base apoya descubrimiento y el PDF fija identidad de piezas y procedimiento. Ninguna de las tres, por sí sola, demuestra las dimensiones de una pieza no acotada.`,
    mistakes: ['Usar el nombre del archivo como prueba de identidad.', 'Copiar una cifra secundaria sin registrar revisión.', 'Convertir proporciones fotográficas en milímetros.', 'Ocultar una contradicción para completar la ficha.'],
  },
  {
    slug: 'seconds-layout', route: 'atlas', title: 'Pequeño segundero, central directo e indirecto', subsystem: 'seconds', duration: 48,
    sourceIds: ['source.eta.6497-2.product', 'source.eta.2824-2.product', 'source.eta.7750.product', 'source.external.ranfft'],
    caseIds: ['case.eta.6497-2', 'case.eta.2824-2', 'case.pattern.indirect-centre-seconds'], axes: ['seconds-layout', 'trade-offs'], representation: 'causal-diagram',
    question: '¿Qué ruta mecánica lleva una vuelta por minuto hasta la aguja de segundos?',
    mechanism: `La posición de la aguja no revela por sí sola la arquitectura. En un pequeño segundero, una rueda del tren lleva su eje hasta una subesfera desplazada. En un central directo, el móvil que gira una vez por minuto ocupa o comparte el eje central. En un central indirecto, una transmisión adicional toma el movimiento desde una rueda desplazada y lo lleva al centro. Este último camino puede necesitar un elemento de fricción para controlar juego o temblor, pero su forma concreta depende del calibre.`,
    comparison: `Compara siempre relaciones y alturas: quién conduce, qué piezas comparten eje, dónde aparece un engrane adicional, qué apoyo superior e inferior necesita cada móvil y qué ocupa el centro. El pequeño segundero libera el centro pero condiciona la esfera; el directo reduce etapas pero exige una pila coaxial; el indirecto flexibiliza el tren pero introduce juego, rozamiento y componentes adicionales. No hay una solución superior sin pliego.`,
    worked: `Compara ETA 6497-2 y ETA 2824-2 desde sus funciones oficiales. El primero sirve como caso de pequeño segundero; el segundo declara segundos centrales. El ejercicio no pide memorizar siluetas: pide dibujar una ruta funcional y enumerar qué información falta para decidir si el central es directo o indirecto en cualquier otro calibre.`,
    mistakes: ['Suponer que toda aguja central es conducida directamente.', 'Confundir eje coaxial con pieza única.', 'Afirmar una rueda de fricción sin verla o documentarla.', 'Evaluar arquitectura solo por estética de esfera.'],
  },
  {
    slug: 'winding-systems', route: 'atlas', title: 'Inversores, palanca de uñas y carga unidireccional', subsystem: 'automatic-winding', duration: 52,
    sourceIds: ['source.eta.2824-2.product', 'source.eta.7750.product', 'source.seiko.42.technical-guide', 'source.seiko.6138a.technical-guide', 'source.miyota.8215.official'],
    caseIds: ['case.eta.2824-2', 'case.eta.7750', 'case.seiko.42-family', 'case.miyota.8215'], axes: ['winding-system', 'serviceability', 'trade-offs'], representation: 'causal-diagram',
    question: '¿Cómo se rectifica el movimiento variable del rotor para cargar el muelle en un sentido útil?',
    mechanism: `El rotor no se conecta sin más al árbol del barrilete. La ruta necesita reducción, rectificación, protección frente al retroceso y un límite de carga. Un sistema de inversores emplea embragues dentro de ruedas que transmiten según el sentido; una palanca de uñas indexa una rueda mediante movimientos alternos; un sistema unidireccional carga en un sentido y libera en el opuesto. Son soluciones funcionalmente comparables, pero sus superficies críticas y modos de fallo no coinciden.`,
    comparison: `La comparación debe seguir rotor, primer elemento conducido, rectificador, reducción, rueda de rochete y barrilete. También debe preguntar qué ocurre al invertir el rotor y cómo se desacopla la cuerda manual. Los inversores pueden perder eficacia por contaminación o libertad incorrecta; una palanca depende de uñas, muelles y geometría de indexado; un unidireccional puede producir una sensación de giro libre sin que eso sea por sí solo avería.`,
    worked: `ETA declara bidireccional el 2824-2 y unidireccional el 7750. La guía Seiko 42 describe cómo la palanca convierte ambos sentidos del rotor en avance de carga. El ejercicio construye tres diagramas con las mismas entradas y salidas, y después propone una prueba que distinga bloqueo del rotor, fallo de rectificación y tren de reducción interrumpido.`,
    mistakes: ['Llamar inversor a cualquier rueda del automático.', 'Juzgar eficiencia desde una animación sin par ni pérdidas.', 'Transferir lubricación entre sistemas.', 'Confundir giro libre previsto con fallo.'],
  },
  {
    slug: 'construction-trade-study', route: 'atlas', title: 'Puentes, platinas y presupuesto de altura', subsystem: 'construction', duration: 50,
    sourceIds: ['source.eta.6497-2.communication', 'source.eta.2824-2.product', 'source.external.ranfft', 'source.external.17jewels', 'source.miyota.8215.official'],
    caseIds: ['case.eta.6497-2', 'case.pattern.ultra-thin', 'case.miyota.8215'], axes: ['bridge-layout', 'thinness-strategy', 'serviceability', 'trade-offs'], representation: 'document-table',
    question: '¿Cómo cambia el diseño cuando rigidez, altura, acceso y montaje compiten?',
    mechanism: `Platina y puentes forman el sistema de referencia que posiciona los móviles. Un gran puente puede relacionar varios apoyos con una sola pieza, mientras que puentes separados permiten acceso selectivo. Reducir altura no consiste solo en adelgazar: puede exigir ruedas superpuestas de otra forma, barriletes suspendidos, componentes integrados, menos niveles o compromisos en rigidez y reparabilidad. Cada decisión cambia cadenas de tolerancias y orden de montaje.`,
    comparison: `Un trade study distingue al menos altura, diámetro, rigidez, número de piezas, mecanizado, acceso, regulación, riesgo de deformación y estrategia de montaje. El Atlas no asigna puntuaciones universales. Un puente separado puede ser mejor para una intervención concreta y peor para mantener alineación tras impactos. Una solución extraplana puede satisfacer la caja y aumentar la sensibilidad a flexión o suciedad.`,
    worked: `El alumno compara el gran formato y los puentes documentados del 6497-2 con el ensamblaje estructural 8215 y con un patrón extraplano sin calibre asignado. Debe justificar qué observaciones son reales, qué conclusiones son de arquitectura y qué necesitaría medir para convertir el estudio en diseño fabricable.`,
    mistakes: ['Usar cantidad de puentes como medida de calidad.', 'Suponer que más fino significa menos piezas.', 'Ignorar alturas de cañones, agujas y calendario.', 'Confundir envolvente con arquitectura interna.'],
  },
  {
    slug: 'service-baseline', route: 'service', title: 'Estado inicial, alcance y seguridad', subsystem: 'service', duration: 55,
    sourceIds: ['source.eta.6497-2.communication', 'source.external.watchguy'], procedureId: 'procedure.service.baseline-and-authority',
    stepIds: ['step.service.baseline.identify', 'step.service.baseline.scope', 'step.service.baseline.energy'], toolIds: ['tool.capability.document', 'tool.capability.inspect', 'tool.capability.hold'], hazardIds: ['hazard.stored-energy', 'hazard.mixed-parts', 'hazard.false-acceptance'], inspectionIds: ['inspection.identity-baseline', 'inspection.energy-state'], acceptanceIds: ['acceptance.service.traceable', 'acceptance.service.safe-sequence'], evidenceIds: ['evidence.service.baseline', 'evidence.service.observation', 'evidence.service.sequence'],
    question: '¿Qué debe quedar fijado antes de que una herramienta toque el movimiento?',
    mechanism: `Un servicio comienza con un estado inicial, no con el primer tornillo. Se asigna una identidad provisional, se registran contradicciones, se define el alcance, se fotografían caras y marcas, se comprueba qué funciones pueden observarse y se determina la autoridad del procedimiento. La energía almacenada recibe un tratamiento específico: muelle, automático, tren y elementos precargados pueden liberar movimiento de forma no prevista.`,
    comparison: `La preparación separa tres capas: lo que declara el propietario, lo que se observa y lo que se infiere. También separa objetivos y no objetivos. “Revisión completa” no es un alcance operativo; hay que enumerar cuerda, puesta en hora, marcha, calendario, cronógrafo, estanqueidad u otras funciones, y decidir qué criterios de aceptación existen. Si no existe procedimiento aplicable para descargar energía, la condición correcta es parar.`,
    worked: `Con una unidad identificada provisionalmente como 6497-2, se contrastan marcas y disposición con la documentación oficial. Se registra si la corona transmite, si el volante se mueve y qué defectos son visibles, sin diagnosticar. Después se construye una lista de parada: identidad contradictoria, energía no controlable, pieza crítica ausente o documentación no aplicable.`,
    mistakes: ['Abrir primero y fotografiar después.', 'Tratar calibre propuesto como identidad confirmada.', 'Confundir no funciona con muelle descargado.', 'Aceptar una tarea sin criterios ni exclusiones.'],
  },
  {
    slug: 'service-disassembly', route: 'service', title: 'Desmontar por dependencias, no por memoria', subsystem: 'service', duration: 60,
    sourceIds: ['source.eta.6497-2.communication', 'source.eta.7750.communication', 'source.external.watchguy'], procedureId: 'procedure.service.dependency-led-disassembly',
    stepIds: ['step.service.disassembly.map', 'step.service.disassembly.release', 'step.service.disassembly.store'], toolIds: ['tool.capability.document', 'tool.capability.drive-screw', 'tool.capability.handle-parts'], hazardIds: ['hazard.pivot-damage', 'hazard.part-launch', 'hazard.mixed-parts'], inspectionIds: ['inspection.dependency-release', 'inspection.part-condition'], acceptanceIds: ['acceptance.service.traceable', 'acceptance.service.safe-sequence'], evidenceIds: ['evidence.service.part-map', 'evidence.service.sequence'],
    question: '¿Qué dependencia obliga a retirar una pieza antes que otra?',
    mechanism: `El orden de desmontaje es un grafo de dependencias. Un puente puede estar retenido por tornillos y, además, contener pivotes, muelles o palancas bajo carga. Quitar los tornillos no garantiza que pueda levantarse. Antes de elevar se comprueba qué interfaces siguen activas, si los móviles están libres y si existe una dirección de liberación documentada. La resistencia inesperada es una observación y una condición de parada, no una invitación a hacer palanca.`,
    comparison: `Una lista lineal es útil para ejecutar, pero el grafo explica por qué. En un cronógrafo, varias palancas comparten control y precarga; en un movimiento simple, el puente de rodaje reúne varios pivotes. El mismo verbo “retirar puente” implica riesgos distintos. El mapa de piezas conserva unidad, cara, paso, contenedor y orientación; no mezcla piezas parecidas de dos movimientos.`,
    worked: `Para un puente de tren, el plan enumera tornillos, móviles soportados, posibles muelles vecinos y estado de energía. Tras aflojar, se comprueba libertad de cada pivote y se eleva paralelo. Si una esquina sube y otra no, se detiene, se documenta y se revisa el grafo. El tornillo nunca se usa para prensar un pivote durante el montaje inverso.`,
    mistakes: ['Memorizar orden sin saber dependencias.', 'Levantar por una esquina.', 'Mezclar tornillos porque parecen iguales.', 'Interpretar la reversibilidad digital como reversibilidad física.'],
  },
  {
    slug: 'service-clean-lube', route: 'service', title: 'Limpieza y lubricación como decisiones documentadas', subsystem: 'service', duration: 62,
    sourceIds: ['source.eta.6497-2.communication', 'source.eta.7750.communication'], procedureId: 'procedure.service.cleaning-lubrication-plan',
    stepIds: ['step.service.cleaning.classify', 'step.service.cleaning.verify', 'step.service.lubrication.map'], toolIds: ['tool.capability.clean-plan', 'tool.capability.lubricate-plan', 'tool.capability.inspect'], hazardIds: ['hazard.chemical-material', 'hazard.false-acceptance'], inspectionIds: ['inspection.part-condition', 'inspection.cleanliness'], acceptanceIds: ['acceptance.service.visual-condition', 'acceptance.service.report-complete'], evidenceIds: ['evidence.service.observation', 'evidence.service.part-map'],
    question: '¿Qué material, superficie, producto, cantidad y fuente justifican cada proceso?',
    mechanism: `Limpiar no significa someter todo al mismo baño. Materiales, adhesivos, lacas, espirales, piedras pegadas, esferas y componentes electrónicos pueden exigir exclusión o procesos distintos. Lubricar tampoco significa poner aceite donde hay movimiento: cada punto necesita producto, cantidad, método y finalidad. Exceso, ausencia, migración y contaminación cambian el contacto. Sin documentación aplicable, la Academia enseña a marcar el dato como bloqueado.`,
    comparison: `La matriz de limpieza cruza pieza, material, contaminante, proceso permitido, exclusiones, secado e inspección posterior. El mapa de lubricación cruza interfaz, producto, cantidad, aplicador, momento de montaje y fuente. Una tabla de otro calibre puede servir para aprender estructura documental, nunca para prescribir. Incluso dentro de una familia pueden cambiar revisión, material o instrucción.`,
    worked: `El alumno recibe una lista mixta: rueda, puente, espiral, áncora con paletas, esfera y junta. No elige un líquido; primero clasifica qué información falta y qué componentes se segregan. Después crea un mapa de lubricación vacío con campos obligatorios y bloquea todo punto sin fuente. Esta disciplina es más valiosa que memorizar una receta.`,
    mistakes: ['Usar ultrasonidos como solución universal.', 'Lubricar antes de inspeccionar limpieza.', 'Copiar aceite y cantidad de una familia parecida.', 'Ocultar un punto sin fuente rellenándolo por intuición.'],
  },
  {
    slug: 'service-assembly', route: 'service', title: 'Montaje incremental y verificación por capas', subsystem: 'service', duration: 60,
    sourceIds: ['source.eta.6497-2.communication', 'source.eta.7750.communication'], procedureId: 'procedure.service.assembly-and-verification',
    stepIds: ['step.service.assembly.supports', 'step.service.assembly.incremental', 'step.service.assembly.final'], toolIds: ['tool.capability.hold', 'tool.capability.handle-parts', 'tool.capability.inspect', 'tool.capability.measure'], hazardIds: ['hazard.pivot-damage', 'hazard.false-acceptance'], inspectionIds: ['inspection.freedom-endshake', 'inspection.final-function'], acceptanceIds: ['acceptance.service.measured-with-limit', 'acceptance.service.function-verified'], evidenceIds: ['evidence.service.sequence', 'evidence.service.measurement', 'evidence.service.human-review'],
    question: '¿Qué debe comprobarse antes de ocultar un subconjunto bajo el siguiente?',
    mechanism: `Montar en orden inverso solo funciona si el desmontaje era completo y las dependencias son simétricas; muchas verificaciones aparecen entre pasos. Los pivotes deben entrar en sus apoyos sin usar tornillos como prensa. Tras asentar un puente se comprueba libertad y apoyo antes de añadir escape, automático o calendario. La verificación incremental reduce el espacio de causas: si el tren era libre antes del siguiente conjunto y deja de serlo después, la búsqueda tiene una frontera.`,
    comparison: `Sensación, observación y medición no son intercambiables. “Gira libre” puede ser un control cualitativo; un juego axial necesita método y límite; la marcha necesita condiciones e instrumento. Ninguna cifra se acepta por parecer habitual. Cuando no hay límite aplicable, se registra la medida sin declarar conformidad. La matriz final enumera cada función, configuración, entrada, salida, repetición y criterio.`,
    worked: `Se monta un tren conceptual en tres capas. Después de cada puente se registra libertad. Al añadir minutería aparece resistencia: como el estado anterior estaba documentado, la investigación comienza en las interfaces nuevas, no reabre todo el movimiento. El informe final conserva que la simulación demuestra estrategia de aislamiento, no tacto ni alineación real.`,
    mistakes: ['Apretar para hacer entrar un pivote.', 'Montar todo antes de probar.', 'Aceptar una sola observación breve.', 'Comparar una medida con un límite de otra referencia.'],
  },
  {
    slug: 'service-diagnosis', route: 'service', title: 'Diagnóstico causal e informe defendible', subsystem: 'diagnosis', duration: 58,
    sourceIds: ['source.eta.6497-2.communication', 'source.external.watchguy'], procedureId: 'procedure.service.diagnosis-and-report',
    stepIds: ['step.service.diagnosis.symptom', 'step.service.diagnosis.discriminate', 'step.service.diagnosis.report'], toolIds: ['tool.capability.document', 'tool.capability.inspect', 'tool.capability.measure'], hazardIds: ['hazard.false-acceptance', 'hazard.pivot-damage'], inspectionIds: ['inspection.final-function', 'inspection.part-condition'], acceptanceIds: ['acceptance.service.visual-condition', 'acceptance.service.report-complete'], evidenceIds: ['evidence.service.observation', 'evidence.service.measurement', 'evidence.service.human-review'],
    question: '¿Qué prueba produciría resultados distintos si cada hipótesis fuera cierta?',
    mechanism: `Diagnosticar no es nombrar la primera causa compatible. Se define un síntoma con estado, entrada, salida y repetibilidad; se divide la cadena en aguas arriba, interfaz y aguas abajo; se generan varias hipótesis; y se elige una prueba discriminante, preferiblemente no invasiva. Una buena prueba no solo confirma: tiene resultados previstos para cada hipótesis y puede refutarlas.`,
    comparison: `Si un reloj se detiene, baja reserva, tren sucio, escape bloqueado, amplitud insuficiente o roce de agujas pueden ser compatibles con una observación superficial. La prueba debe localizar una frontera funcional. El informe conserva evidencia positiva, evidencia contradictoria, incertidumbre y alternativas no probadas. “No se encontró otro fallo” no equivale a “no existe otro fallo”.`,
    worked: `Síntoma: la indicación se detiene mientras el oscilador conceptual continúa. Hipótesis A: minutería desacoplada; B: agujas rozando. Una prueba observa si el cañón recibe giro con agujas ocultas en la simulación. Los resultados esperados son distintos. En el mundo físico harían falta observaciones y manipulaciones seguras adicionales; el laboratorio no las certifica.`,
    mistakes: ['Convertir síntoma en causa.', 'Desmontar antes de formular pruebas.', 'Buscar solo evidencia confirmatoria.', 'Cerrar el informe sin desconocidos ni condiciones.'],
  },
  {
    slug: 'escapement-compare', route: 'architecture', title: 'Escapes: funciones comunes y geometrías no transferibles', subsystem: 'escapement', duration: 58,
    sourceIds: ['source.eta.6497-2.communication', 'source.miyota.8215.official', 'source.external.ranfft'],
    caseIds: ['case.eta.6497-2', 'case.miyota.8215'], axes: ['escapement', 'serviceability', 'trade-offs'], representation: 'existing-fixture',
    question: '¿Qué relaciones hacen que un conjunto sea escape y qué depende de su geometría concreta?',
    mechanism: `Todo escape realiza una forma de retención, liberación y transferencia de energía, pero no todos usan áncora suiza ni separan las fases igual. En el áncora suizo, rueda, paletas, horquilla y clavija crean bloqueo, desbloqueo, impulso y caída. Un escape de cilindro, de clavijas, de detente o coaxial organiza contactos de otra manera. La función común permite comparar; la geometría impide copiar ajustes.`,
    comparison: `La tabla compara fuente de energía, elemento retenido, órgano que libera, ruta de impulso, seguridad, necesidad de lubricación y sensibilidad a perturbaciones. El modelo instalado solo coordina un áncora conceptual K2 y un 8215 estructural. No contiene ángulos, penetración, draw, recorrido perdido ni elasticidad. Por tanto puede demostrar secuencia y vocabulario, nunca ajuste.`,
    worked: `Se recorre un ciclo conceptual y se marca en cada fase qué pieza actúa y qué interfaz cambia. Después se lee la comunicación oficial del 6497-2 para identificar piezas homólogas sin transferir su forma al 8215. El resultado final incluye una lista de afirmaciones permitidas y otra de datos imprescindibles para una validación geométrica.`,
    mistakes: ['Llamar escape al volante completo.', 'Suponer impulso continuo.', 'Copiar ángulos entre calibres.', 'Presentar una secuencia K2 como ajuste de servicio.'],
  },
  {
    slug: 'ultra-thin', route: 'architecture', title: 'Arquitectura extraplana y presupuesto axial', subsystem: 'construction', duration: 56,
    sourceIds: ['source.eta.2824-2.product', 'source.external.ranfft', 'source.external.17jewels'],
    caseIds: ['case.pattern.ultra-thin', 'case.eta.2824-2'], axes: ['thinness-strategy', 'bridge-layout', 'serviceability', 'trade-offs'], representation: 'causal-diagram',
    question: '¿Qué funciones compiten por altura y qué consecuencias produce cada integración?',
    mechanism: `El espesor total es la suma de niveles funcionales y márgenes: platina, barrilete, tren, escape, automático, minutería, calendario, esfera, agujas y holguras. Reducirlo exige eliminar niveles, integrar componentes, desplazar funciones o reducir espesores. Cada técnica afecta rigidez, apoyo, reserva, par, fabricación, montaje y servicio. Un número de milímetros sin presupuesto funcional no explica la arquitectura.`,
    comparison: `El ejercicio usa un presupuesto cualitativo, no dimensiones inventadas. Para cada función se marca plano, solapamiento permitido, interfaz, tolerancia acumulada, acceso y riesgo. Integrar barrilete en platina puede ahorrar altura y cambiar su apoyo; un micro-rotor puede liberar la cara completa y competir lateralmente; un rotor periférico cambia diámetro y guiado. Estos patrones se estudian sin atribuirlos a un calibre no documentado.`,
    worked: `Partiendo de una arquitectura central con automático y fecha, el alumno debe reducir un nivel sin eliminar funciones. Propone tres estrategias, registra qué piezas cambiarían y define qué cálculos, materiales y prototipos harían falta. Gana la propuesta mejor justificada, no la que dibuja el reloj más fino.`,
    mistakes: ['Reducir todos los espesores por el mismo porcentaje.', 'Ignorar flexión y tolerancias.', 'Olvidar agujas, esfera y caja.', 'Llamar fabricable a un diagrama cualitativo.'],
  },
  {
    slug: 'calendars', route: 'architecture', title: 'Calendarios como acumulación, salto, retención y corrección', subsystem: 'calendar', duration: 60,
    sourceIds: ['source.eta.2824-2.product', 'source.eta.7750.product', 'source.miyota.8215.official'],
    caseIds: ['case.eta.2824-2', 'case.eta.7750', 'case.miyota.8215'], axes: ['calendar', 'serviceability', 'trade-offs'], representation: 'causal-diagram',
    question: '¿Cómo transforma el calendario una rotación diaria en un salto controlado y corregible?',
    mechanism: `Un calendario simple deriva una vuelta diaria desde la minutería, acumula o transmite movimiento, avanza un disco y usa un saltador para posicionarlo. La corrección rápida introduce otra ruta hacia el mismo indicador. Calendarios de día, fecha, anual o perpetuo añaden contadores y lógica mecánica para ciclos distintos. El concepto clave es una máquina de estados con entradas que no siempre pueden activarse simultáneamente.`,
    comparison: `Cambio arrastrado, semi-instantáneo o instantáneo difieren en cómo almacenan y liberan energía. Una ventana de cambio puede crear una zona en la que la corrección rápida interfiera con el arrastre; la zona exacta pertenece al manual del calibre. El calendario anual distingue meses de 30 y 31 días; el perpetuo incorpora reglas adicionales. Cada capa aumenta estados, piezas, energía requerida y dificultad de puesta.`,
    worked: `Se modela una fecha simple con cuatro estados: reposo, entrada en zona de cambio, salto y asentamiento. Luego se añade corrección rápida como segunda entrada y se identifican conflictos. Finalmente se bosqueja qué memoria mecánica necesita un anual sin dibujar piezas. El alumno debe citar qué casos oficiales declaran fecha o día/fecha.`,
    mistakes: ['Tratar fecha como rueda que gira continuamente.', 'Inventar una zona prohibida universal.', 'Confundir calendario anual con perpetuo.', 'Ignorar energía y posicionamiento del saltador.'],
  },
  {
    slug: 'chronograph-control', route: 'architecture', title: 'Control de cronógrafo: levas y rueda de pilares', subsystem: 'chronograph', duration: 64,
    sourceIds: ['source.eta.7750.product', 'source.eta.7750.communication', 'source.seiko.6138a.technical-guide'],
    caseIds: ['case.eta.7750', 'case.seiko.6138a'], axes: ['chronograph-control', 'serviceability', 'trade-offs'], representation: 'causal-diagram',
    question: '¿Qué componente conserva el estado y coordina acoplamiento, freno y puesta a cero?',
    mechanism: `Un cronógrafo añade una máquina de estados a la marcha base. El pulsador no mueve directamente todas las funciones: una palanca de mando indexa una leva o rueda de pilares, y su posición gobierna acoplamiento, freno y martillos. Inicio exige acoplar y liberar freno; parada mantiene el contador y aplica freno; cero desacopla cuando corresponde y deja caer martillos sobre corazones. Las interdependencias impiden estudiar cada palanca aislada.`,
    comparison: `Una leva usa superficies perfiladas para definir estados; una rueda de pilares usa columnas y huecos que elevan o dejan caer palancas. Ambas pueden implementar la misma lógica funcional con geometría y tacto diferentes. La comparación cubre número de estados, secuencia de pulsador, tolerancia al ajuste, fabricación, acceso y diagnóstico. No deduce calidad de una etiqueta comercial.`,
    worked: `ETA declara el 7750 como cronógrafo de levas y su comunicación permite seguir palancas. La guía 6138A aporta un segundo caso oficial. El alumno construye una tabla estado–acoplamiento–freno–martillo y valida que nunca se ordene poner a cero con el contador engranado de forma incompatible.`,
    mistakes: ['Confundir control con acoplamiento.', 'Suponer que rueda de pilares siempre implica embrague vertical.', 'Evaluar tacto sin fuerzas ni geometría.', 'Omitir la puesta a cero de contadores secundarios.'],
  },
  {
    slug: 'chronograph-coupling', route: 'architecture', title: 'Acoplamiento horizontal y embrague vertical', subsystem: 'chronograph', duration: 62,
    sourceIds: ['source.eta.7750.communication', 'source.seiko.6138a.technical-guide'],
    caseIds: ['case.eta.7750', 'case.seiko.6138a'], axes: ['chronograph-coupling', 'serviceability', 'trade-offs'], representation: 'causal-diagram',
    question: '¿Cómo entra y sale la potencia del contador y qué síntomas dependen de esa interfaz?',
    mechanism: `El control decide cuándo; el acoplamiento decide cómo llega el movimiento. En el horizontal, una rueda se desplaza lateralmente hasta engranar con la rueda de cronógrafo. En el vertical, superficies coaxiales se presionan axialmente para transmitir por fricción. El primero hace visible el contacto dentado; el segundo integra el contador sobre el eje de acoplamiento. Ninguno puede reducirse a una animación de encendido.`,
    comparison: `Se comparan salto inicial, arrastre, pérdidas, desgaste, regulación de profundidad, inspección, desmontaje y comportamiento al permanecer activado. Un horizontal puede saltar si los dientes entran en una fase desfavorable; un vertical puede arrastrar o patinar según superficies y fuerza. Son hipótesis de arquitectura, no diagnósticos automáticos.`,
    worked: `Para dos casos oficiales, el alumno dibuja rutas desde la marcha base al contador y define tres pruebas documentales: observar la pieza que se desplaza, identificar superficies de contacto y localizar el freno. Después formula síntomas compatibles con cada arquitectura y se obliga a proponer pruebas antes de asignar causa.`,
    mistakes: ['Llamar embrague al sistema de control.', 'Inferir vertical u horizontal por el nombre del calibre.', 'Afirmar ausencia de salto sin medición.', 'Copiar lubricación entre interfaces.'],
  },
  {
    slug: 'architecture-capstone', route: 'architecture', title: 'Proyecto: defender una arquitectura completa', subsystem: 'architecture', duration: 90,
    sourceIds: ['source.eta.6497-2.product', 'source.eta.2824-2.product', 'source.eta.7750.product', 'source.seiko.42.technical-guide', 'source.seiko.6138a.technical-guide', 'source.miyota.8215.official'],
    caseIds: ['case.eta.6497-2', 'case.eta.2824-2', 'case.eta.7750', 'case.seiko.6138a', 'case.miyota.8215'], axes: ['seconds-layout', 'winding-system', 'bridge-layout', 'escapement', 'calendar', 'chronograph-control', 'chronograph-coupling', 'thinness-strategy', 'serviceability', 'trade-offs'], representation: 'document-table',
    question: '¿Qué arquitectura satisface el pliego y qué tendría que validarse antes de fabricar?',
    mechanism: `Diseñar un reloj desde cero comienza convirtiendo deseos en requisitos verificables: indicaciones, reserva, frecuencia, cuerda, calendario, cronógrafo, diámetro, altura, robustez, servicio, coste y capacidad de fabricación. Cada arquitectura consume presupuesto y crea interfaces. Elegir segundos centrales puede afectar tren y altura; añadir automático afecta diámetro o espesor; un calendario crea estados y zonas de cambio; un cronógrafo multiplica control, acoplamiento y puesta a cero.`,
    comparison: `La matriz de decisión no oculta incertidumbre bajo una suma. Cada criterio tiene unidad o escala, prioridad, evidencia y umbral. Una alternativa que incumple un requisito obligatorio queda descartada aunque puntúe bien en otras dimensiones. Los casos del Atlas aportan soluciones existentes y vocabulario, no piezas para copiar. La recomendación debe declarar dependencias, riesgos, datos faltantes y plan de validación.`,
    worked: `Pliego: cuerda manual, pequeño segundero, sin fecha, servicio accesible y altura moderada. El 6497-2 es un caso de referencia, no la respuesta automática. Se generan al menos tres arquitecturas, se comparan sus rutas y apoyos, se elige una y se define qué cálculos siguen: tren, par, muelle, oscilador, escape, geometría, tolerancias, materiales y prototipos.`,
    mistakes: ['Elegir calibre antes de fijar requisitos.', 'Sumar puntuaciones sin umbrales.', 'Presentar el Atlas como una biblioteca de geometría exacta lista para fabricar.', 'Llamar validado a un concepto que todavía no representa geometría, movimiento ni física.'],
  },
]

function theoryMarkdown(topic) {
  const principalRisk = topic.mistakes[0]
  const comparisonPrompt = topic.comparison.split(/(?<=[.!?])\s+/u)[0]
  return `# ${topic.title}

## Pregunta de diseño

${topic.question} Antes de abrir la práctica, escribe una respuesta provisional y anota qué parte procede de conocimiento previo, qué parte necesita una fuente y qué parte no sabes todavía. La finalidad no es acertar por intuición, sino construir una explicación que pueda ser revisada.

## Modelo causal

${topic.mechanism}

En **${topic.title}**, la unidad de análisis es la relación: quién actúa, sobre qué interfaz, qué estado cambia y qué resultado puede observarse. Para responder «${topic.question}», convierte cada nombre del modelo causal en uno de esos enlaces. Si la documentación no fija una dimensión, material o contacto relevante para este problema, consérvalo como desconocido en vez de heredarlo de una silueta o familia parecida.

## Comparación y compromisos

${topic.comparison}

Al comparar alternativas para **${topic.title}**, prueba cuatro fronteras contra el caso: función común no implica geometría idéntica; una fotografía documenta una unidad y un estado; la simulación explica relaciones sin validar fuerzas, tolerancias, lubricación o desgaste; y un dato oficial solo gobierna su referencia y revisión. La comparación concreta comienza aquí: ${comparisonPrompt}

## Ejemplo razonado

${topic.worked}

Cierra el ejemplo de **${topic.title}** con tres filas: **confirmado**, **inferencia provisional** y **desconocido**. En la primera enlaza la afirmación a una de las ${topic.sourceIds.length} fuentes declaradas; en la segunda escribe premisa y refutación; en la tercera define la observación, documento o medición que falta. Esta tabla debe responder a la pregunta de diseño, no limitarse a repetir el vocabulario.

## Método de estudio

1. Escribe el vocabulario imprescindible para explicar **${topic.title}** y dibuja su cadena sin mirar el ejemplo.
2. Ordena las ${topic.sourceIds.length} fuentes declaradas por la autoridad que tienen para esta pregunta concreta.
3. Extrae una afirmación sobre el mecanismo y otra sobre el compromiso comparado; conserva sus límites.
4. Reconstruye entradas, interfaces, estados y salidas antes de observar la apariencia del caso.
5. Formula una predicción que permita detectar este riesgo: **${principalRisk}**
6. Ejecuta la actividad, registra la evidencia que cambió tu respuesta inicial y explica por qué.
7. Transfiere el criterio de **${topic.title}** a un calibre, arquitectura o situación no usados en el ejemplo.

## Errores que debes detectar

${topic.mistakes.map((item) => `- ${item}`).join('\n')}
- En **${topic.title}**, confundir una representación disponible con geometría, fuerzas o tolerancias validadas.
- Presentar la respuesta digital a «${topic.question}» como acreditación de una habilidad manual.

## Comprobación antes de la práctica

Antes de practicar **${topic.title}**, responde provisionalmente «${topic.question}» con una entrada, dos relaciones y un resultado. Elige entre las fuentes declaradas cuál respalda cada enlace, escribe una afirmación que esta unidad no permite y define la evidencia que te haría cambiar de opinión. Si tu respuesta todavía cae en «${principalRisk}», vuelve al modelo causal y corrige ese enlace antes de abrir la actividad.

## Cierre

La unidad **${topic.title}** se cierra cuando puedes reconstruir la respuesta, contrastarla con las fuentes y defender sus límites en un caso distinto. La práctica evalúa ese razonamiento documental o simulado; no demuestra destreza física ni convierte la alternativa elegida en un diseño fabricable.`
}

const routeFor = (key) => routeDefinitions[key].id
const records = {
  curricula: [], routes: [], modules: [], concepts: [], misconceptions: [], blocks: [], lessons: [], activities: [], scenes: [], competencies: [], evidenceTemplates: [], rubrics: [], glossary: [], sources, recommendations: [], visualResources: [],
}

for (const topic of topics) {
  const activityId = `activity.advanced.${topic.slug}`
  const lessonId = `lesson.advanced.${topic.slug}`
  const moduleId = `module.advanced.${topic.slug}`
  const conceptId = `concept.advanced.${topic.slug}`
  const competencyId = `competency.advanced.${topic.slug}`
  const evidenceId = `evidence.advanced.${topic.slug}`
  const reviewEvidenceId = `evidence.advanced.${topic.slug}.human-review`
  const rubricId = `rubric.advanced.${topic.slug}`
  const sceneId = `scene.advanced.${topic.slug}`
  const blockId = `block.advanced.${topic.slug}`
  const markdown = theoryMarkdown(topic)
  records.blocks.push({ id: blockId, version, kind: 'explanation', title: `Teoría · ${topic.title}`, bodyMarkdown: markdown, claims: [], localization: { title: L(`Teoría · ${topic.title}`), bodyMarkdown: L(markdown) }, pedagogy: { role: 'explain', conceptIds: [conceptId], estimatedMinutes: Math.min(120, Math.max(20, Math.ceil(words(markdown) / 180))), userPaced: true } })
  records.concepts.push({ id: conceptId, version, title: L(topic.title), summary: L(topic.question), kind: topic.route === 'service' ? 'skill' : 'concept', knowledgeType: topic.route === 'service' ? 'procedural' : 'conceptual-causal', prerequisiteIds: [], recommendedPrerequisiteIds: [], relatedIds: [], competencyIds: [competencyId], movementIds: [], subsystem: topic.subsystem, routeIds: [routeFor(topic.route)], activityIds: [activityId], sourceIds: topic.sourceIds, misconceptionIds: [], plainLanguage: L(topic.question), technicalLanguage: L(topic.mechanism), whyItMatters: L('Permite tomar decisiones de arquitectura o servicio sin confundir documentación, simulación y realidad física.'), observableActions: [L('Separa hecho, inferencia y desconocido.'), L('Compara relaciones y compromisos.'), L('Declara fuentes, riesgos y límites.')], transferTargetIds: [], targetEvidenceLevel: 'transfer', availability: 'available' })
  records.competencies.push({ id: competencyId, version, title: topic.title, description: `Defender ${topic.title.toLowerCase()} con relaciones, fuentes, evidencia, riesgos y límites explícitos.`, prerequisites: [], authoring: { title: L(topic.title), description: L(`Defender una decisión sobre ${topic.title.toLowerCase()} sin certeza artificial.`), movementIds: [], subsystem: topic.subsystem, skillType: topic.route === 'service' ? 'procedure' : 'reasoning', sourceIds: topic.sourceIds } })
  records.evidenceTemplates.push({ id: evidenceId, version, competencyId, kind: 'answer', scoringMethod: 'rubric', extraction: { id: `rule.extract.advanced.${topic.slug}`, version, triggerEventType: 'advanced-response-submitted', evidenceType: 'written-response', competencyId, packageId, activityIds: [activityId], evidenceTemplateId: evidenceId, minimumSessionState: ['active', 'paused', 'completed'], confidence: 0.8, contentFields: ['sceneId', 'stepId', 'data', 'caseIds', 'procedureId', 'sourceIds', 'unknowns'] } })
  records.evidenceTemplates.push({ id: reviewEvidenceId, version, competencyId, kind: 'human-review', scoringMethod: 'rubric', extraction: { id: `rule.extract.advanced.${topic.slug}.human-review`, version, triggerEventType: 'advanced-human-review-completed', evidenceType: 'human-review', competencyId, packageId, activityIds: [activityId], evidenceTemplateId: reviewEvidenceId, minimumSessionState: ['active', 'paused', 'completed'], confidence: 1, contentFields: ['sceneId', 'reviewerId', 'criteria', 'result', 'notes'] } })
  records.rubrics.push({ id: rubricId, version, competencyId, rules: [{ id: `rule.advanced.${topic.slug}.demonstrated`, version, targetState: 'demonstrated', acceptedEvidenceKinds: ['human-review'], minimumEvidence: 1, minimumScore: 0.8, minimumDistinctSessions: 1, minimumSpanDays: 0, explanationTemplate: `${topic.title}: una revisión humana confirma causalidad, procedencia, comparación, límites y transferencia.` }], assessmentRule: { id: `rule.composite.advanced.${topic.slug}`, version, competencyId, targetState: 'demonstrated', condition: { op: 'all', conditions: [{ op: 'exists', filter: { evidenceType: 'human-review', status: 'active', minimumConfidence: 0.8 } }, { op: 'minimum-evidence', count: 1 }] } } })
  const structuredFields = [
    { id: 'field.claims', label: 'Hechos respaldados y sus fuentes', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.reasoning', label: 'Relaciones, comparación y decisión', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.unknowns', label: 'Desconocidos, riesgos y plan de verificación', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.confidence', label: 'Confianza y qué la cambiaría', kind: 'confidence', required: true, optionIds: [] },
  ]
  records.scenes.push({ id: sceneId, version, title: `${topic.title} · estudio aplicado`, description: `Actividad documental y causal posterior a la teoría. No presenta geometría ausente ni competencia física.`, fixtureBinding: { kind: 'fixture', fixtureId }, accessibility: { textualAlternative: 'La actividad completa se expresa como pregunta, fuentes, tabla causal y respuesta estructurada; no depende del color ni del movimiento.', reducedMotionAlternative: 'No existe animación esencial. Los estados y relaciones se presentan en texto.', keyboardActions: ['Recorrer campos con Tab.', 'Guardar respuesta con el control nombrado.'], colorIndependentCues: ['Autoridad, estado y resultado se expresan con texto.'] }, cameraIntent: { intent: 'comparison', transition: 'reduced-motion' }, requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.camera@^1.0.0', 'viewport.overlay.labels@^1.0.0'], camera: { position: [6, 5, 7], target: [0, 0, 0], projection: 'perspective', fieldOfView: 42 }, state: { selected: [], visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1 }, timeline: [], overlays: [{ kind: 'text', id: `overlay.advanced.${topic.slug}.boundary`, markdown: 'Comparación documental y simulación educativa. Sin geometría exacta, física validada ni acreditación manual.', accessibleLabel: 'Límite de autoridad de la actividad.' }], steps: [{ id: `step.advanced.${topic.slug}.respond`, instructionMarkdown: `${topic.question} Construye una respuesta defendible después de estudiar la teoría y las fuentes.`, questions: [{ id: `question.advanced.${topic.slug}.response`, promptMarkdown: `Resuelve **${topic.title}** separando hechos, razonamiento, desconocidos y confianza.`, responseKind: 'structured-response', options: [], structuredFields, hints: [], humanReviewRequired: true, authoring: { prompt: L(topic.question), feedback: L('La respuesta se conserva como evidencia pendiente de revisión humana; la longitud no equivale a corrección.') } }], success: [{ condition: 'structured-answer', questionId: `question.advanced.${topic.slug}.response`, requiredFieldIds: structuredFields.map(({ id }) => id), pendingHumanReview: true }] }], restorePreviousState: true })
  const authoring = {
    lessonId, title: L(topic.title), description: L(`Estudio aplicado: ${topic.question}`), difficulty: topic.route === 'atlas' ? 'intermediate' : 'advanced', durationMinutes: topic.duration, activityType: topic.route === 'service' ? 'guided-practice' : 'comparison', movementIds: [], familyIds: topic.caseIds ?? [], subsystem: topic.subsystem, requiredCapabilities: ['learning.scene-runtime', 'reduced-motion'], languages: ['es-ES'], offline: true,
    fidelity: { geometry: 'G0', kinematics: topic.representation === 'existing-fixture' ? 'K2' : 'K0', physics: 'P0', limitations: ['Los casos sin fixture se estudian mediante documentos, tablas y diagramas.', 'No se inventan dimensiones ni geometría.', 'La actividad digital no acredita destreza física ni validación de ingeniería.'] }, warnings: { es: ['Comprueba la referencia y revisión antes de transferir un dato.', 'Toda competencia física requiere evidencia y revisión humanas.'], en: [] }, sourceIds: topic.sourceIds, visualResourceIds: [], fixtureBinding: { kind: 'fixture', fixtureId },
    interactionContract: { responseModel: 'structured-response', orderedItems: [], expectedOrderIds: [], structuredFields: structuredFields.map(({ id, label, kind, required }) => ({ id, label: L(label), kind, required })), hints: [], evidencePolicy: { eventType: 'advanced-response-submitted', recordsAnswerPayload: true, deterministicComponents: [], requiresHumanReview: true, accessibilityAdaptationsCountAsHints: false } },
    pedagogicalContract: { purpose: topic.slug === 'architecture-capstone' ? 'transfer' : 'guided-practice', assessmentIntent: 'formative', requiresConceptIds: [conceptId], introducesConceptIds: [], demonstratesConceptIds: [], practicesConceptIds: [conceptId], assessesConceptIds: [conceptId], evidenceLevel: topic.slug === 'architecture-capstone' ? 'transfer' : 'causal-explanation', supportLevel: topic.slug === 'architecture-capstone' ? 'independent' : 'guided', remediation: { lessonId, blockId, conceptIds: [conceptId] }, physicalBoundary: L('Evalúa razonamiento documental o simulado. No demuestra manipulación, ajuste, limpieza, lubricación ni servicio físico.') },
    feedbackContract: { correctExplanation: L('La decisión conserva relaciones, procedencia, compromisos y límites.'), incorrectDiagnosis: L('Revisa si confundiste apariencia con arquitectura, una inferencia con un dato o una simulación con evidencia física.'), causalQuestion: L(topic.question), nextObservation: L('Busca la primera afirmación sin fuente o la primera relación no demostrada.'), misconceptionIds: [], transferPrompt: L('Aplica el mismo criterio a un calibre o pliego no usado en el ejemplo.'), requiresIndependentRetryAfterHint: true },
    tutorContract: { scopeConceptIds: [conceptId], allowedActions: ['orient', 'ask-socratic-question', 'explain-declared-content', 'point-to-source', 'suggest-remediation', 'summarize-visible-state'], forbiddenClaims: [L('No inventar dimensiones, materiales, contactos o procedimientos.'), L('No presentar una actividad digital como competencia física.'), L('No sustituir la revisión humana exigida.')], promptStarters: [L('¿Qué fuente respalda esa afirmación?'), L('¿Qué relación cambia entre los casos?'), L('¿Qué sigue siendo desconocido?')], requiresSourceForTechnicalClaims: true, authority: 'coach-not-assessor' },
    pedagogicalPattern: { enabled: true, stages: ['observe', 'predict', 'compare', 'explain', 'relate-to-real-object', 'record-evidence'] },
  }
  if (topic.route === 'service') {
    authoring.serviceProcedureContract = { procedureId: topic.procedureId, mode: 'planning', stepIds: topic.stepIds, toolCapabilityIds: topic.toolIds, hazardIds: topic.hazardIds, inspectionPointIds: topic.inspectionIds, acceptanceCriterionIds: topic.acceptanceIds, evidenceRequirementIds: topic.evidenceIds, requiresRestore: true, physicalCompletionClaim: false, humanReviewForPhysicalCompetence: true, authorityVisible: true, textualAlternative: true }
  } else {
    authoring.comparativeArchitectureContract = { caseIds: topic.caseIds, comparisonAxes: topic.axes, representation: topic.representation, evidenceBoundary: topic.sourceIds.some((id) => id.startsWith('source.external')) ? 'official-and-curated-secondary' : 'official-only', exactGeometryRequired: false, learnerMustSeparateFactInferenceUnknown: true, unsupportedDimensionsForbidden: true, textualAlternative: true }
  }
  records.activities.push({ id: activityId, version, title: topic.title, sceneIds: [sceneId], competencyIds: [competencyId], evidenceTemplateIds: [evidenceId, reviewEvidenceId], rubricId, projectReference: { kind: 'fixture-readonly', fixtureId }, authoring })
  records.lessons.push({ id: lessonId, version, title: topic.title, blockIds: [blockId], activityIds: [activityId], authoring: { title: L(topic.title), purpose: L(topic.question), objectives: [L('Explicar relaciones y estados antes de usar ejemplos.'), L('Comparar al menos dos alternativas con procedencia.'), L('Defender una decisión y declarar desconocidos.')], prerequisiteConceptIds: [], recommendedPrerequisiteConceptIds: [], externalPrerequisites: [{ packageId: 'wplab.horology.mechanical-foundations', versionRange: '^0.4.1', moduleIds: ['module.mechanical.train'], competencyIds: ['competency.mechanical.build-functional-train'], recommendedButOptionalRouteIds: ['route.mechanical.foundations'] }], conceptIds: [conceptId], sourceIds: topic.sourceIds, visualResourceIds: [], pedagogy: { role: topic.slug === 'architecture-capstone' ? 'transfer' : 'conceptual-model', entryCheck: 'self-check', userPacedSegments: true, introducesConceptIds: [conceptId], reinforcesConceptIds: [], bridgeConceptIds: [] }, studyContract: { sequence: 'theory-first', minimumTheoryMinutes: Math.max(20, Math.ceil(words(markdown) / 180)), minimumReadingWords: words(markdown), requiredSegmentRoles: ['orient', 'pretrain', 'explain', 'worked-example', 'practice', 'close'], practiceUnlock: 'after-required-reading', labActivityIds: [activityId], readinessCriteria: [L('Puedo explicar la cadena causal sin mirar una animación.'), L('Puedo separar fuente primaria, secundaria, inferencia y desconocido.'), L('Puedo comparar compromisos y proponer evidencia que refute mi decisión.')], sourceReviewRequired: true, notePrompt: L('Anota una afirmación confirmada, una inferencia y un desconocido antes de practicar.') }, tutorContract: authoring.tutorContract } })
  records.modules.push({ id: moduleId, version, title: L(topic.title), purpose: L(topic.question), lessonIds: [lessonId] })
}

for (const key of Object.keys(routeDefinitions)) {
  const routeConcepts = topics.filter(({ route }) => route === key).map(({ slug }) => `concept.advanced.${slug}`)
  routeConcepts.forEach((conceptId, index) => {
    const concept = records.concepts.find(({ id }) => id === conceptId)
    if (!concept) return
    concept.prerequisiteIds = index > 0 ? [routeConcepts[index - 1]] : []
    concept.relatedIds = [routeConcepts[index - 1], routeConcepts[index + 1]].filter(Boolean)
    concept.transferTargetIds = index < routeConcepts.length - 1 ? [routeConcepts[index + 1]] : [routeConcepts[0]]
  })
}

for (const [key, definition] of Object.entries(routeDefinitions)) {
  const routeTopics = topics.filter(({ route }) => route === key)
  const routeConceptIds = routeTopics.map(({ slug }) => `concept.advanced.${slug}`)
  const routeActivityIds = routeTopics.map(({ slug }) => `activity.advanced.${slug}`)
  const routeLessonIds = routeTopics.map(({ slug }) => `lesson.advanced.${slug}`)
  records.routes.push({ id: definition.id, version, title: L(definition.title), purpose: L(definition.purpose), prerequisiteConceptIds: [], moduleIds: routeTopics.map(({ slug }) => `module.advanced.${slug}`), competencyIds: routeTopics.map(({ slug }) => `competency.advanced.${slug}`), movementIds: key === 'architecture' ? [fixtureId] : [], difficulty: definition.difficulty, sourceIds: unique(routeTopics.flatMap(({ sourceIds }) => sourceIds)), visualResourceIds: [], demo: false, learningDesign: { model: 'specialization', entryPolicy: 'prerequisite-required', completionPolicy: 'evidence', milestones: routeTopics.map((topic, index) => ({ id: `milestone.advanced.${key}.${String(index + 1).padStart(2, '0')}`, order: index + 1, title: L(topic.title), outcome: L(topic.question), lessonId: routeLessonIds[index], activityId: routeActivityIds[index], mode: topic.slug === 'architecture-capstone' ? 'transfer' : 'guided-practice', evidenceLevel: topic.slug === 'architecture-capstone' ? 'transfer' : 'causal-explanation', optional: false, transferTargetIds: [routeConceptIds[index]] })), diagnosticActivityIds: [], demonstrationActivityIds: routeActivityIds } })
}

records.curricula.push({ id: 'curriculum.advanced.personal-watchmaking', version, title: L('Arquitectura, servicio y complicaciones'), purpose: L('Conectar comparación documental, método de servicio y decisiones de arquitectura hacia el diseño de relojes propios.'), routeIds: Object.values(routeDefinitions).map(({ id }) => id), languages: ['es-ES'] })

const entryFolders = { curricula: 'curriculum', routes: 'routes', modules: 'modules', concepts: 'concepts', misconceptions: 'misconceptions', blocks: 'blocks', lessons: 'lessons', activities: 'activities', scenes: 'scenes', competencies: 'competencies', evidenceTemplates: 'evidence', rubrics: 'rubrics', glossary: 'glossary', sources: 'sources', recommendations: 'recommendations', visualResources: 'visual-resources' }
const entries = Object.fromEntries(Object.entries(entryFolders).map(([key, folder]) => [key, records[key].map(({ id }) => ({ id, path: `${folder}/${id}.json` }))]))
const manifest = { format: 'wplab-learning-pack', formatVersion: 1, schemaId: 'learning-pack-v1', packageVersion: version, id: packageId, title: 'Atlas, servicio, arquitecturas y complicaciones', distribution: 'local-unsigned', editorialStatus: 'approved', authors: [{ name: 'Watch Prototype Lab' }], languages: ['es-ES'], dependencies: [{ packageId: 'wplab.horology.mechanical-foundations', versionRange: '^0.4.1' }, { packageId: 'wplab.horology.inspection-metrology', versionRange: '^0.1.0' }], requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.camera@^1.0.0', 'viewport.overlay.labels@^1.0.0'], movements: [{ manufacturer: 'Conceptual', calibre: 'mechanical-chain', referenceId: fixtureId }, { manufacturer: 'MIYOTA', calibre: '8215', referenceId: 'fixture.miyota.8215.structural' }, { manufacturer: 'MIYOTA', calibre: '2035', referenceId: 'fixture.miyota.2035.structural' }], assets: [], entries, minimumAppVersion: '0.8.0', createdAt }
const pack = { manifest, ...records }

await rm(root, { recursive: true, force: true })
for (const [key, folder] of Object.entries(entryFolders)) {
  for (const record of records[key]) await writeJson(join(root, folder, `${record.id}.json`), record)
}
await writeJson(join(root, 'manifest.json'), manifest)
await writeJson(join(root, 'dist', 'pack.json'), pack)
await writeJson(join(root, 'generated', 'summary.json'), {
  packageId, version, routes: records.routes.length, modules: records.modules.length, lessons: records.lessons.length,
  activities: records.activities.length, theoryWords: records.blocks.reduce((sum, block) => sum + words(block.bodyMarkdown), 0),
  sources: records.sources.length, generatedAt: createdAt,
})

console.log(JSON.stringify({ packageId, version, routes: records.routes.length, lessons: records.lessons.length, activities: records.activities.length, theoryWords: records.blocks.reduce((sum, block) => sum + words(block.bodyMarkdown), 0), sources: records.sources.length }, null, 2))
