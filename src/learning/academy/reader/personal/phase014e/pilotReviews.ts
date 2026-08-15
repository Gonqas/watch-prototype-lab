import type {
  AcademyPersonalTechnicalStatus,
  AcademyPilotResultStatus,
  AcademyPilotReviewDecision,
} from '../../academyReaderModel'

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


