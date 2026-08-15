import type { AcademyStage2PersonalPractice } from '../types'

const practice = (personalPracticeId: string, lessonIds: readonly string[], title: string, objective: string, steps: readonly string[], stopSignal: string): AcademyStage2PersonalPractice => ({
  personalPracticeId, lessonIds, title, objective,
  inexpensiveMaterials: ['papel', 'lápiz', 'monedas o discos de cartón', 'teléfono solo para fotografiar tu propio montaje'],
  preparation: ['Trabaja sin movimiento abierto.', 'Retira líquidos, imanes, calor y herramientas cortantes.', 'Decide qué observación registrarás.'],
  steps,
  help: ['Vuelve al diagrama de la lección.', 'Reduce la tarea a entrada, interfaz y salida.', 'Anota “desconocido” si falta evidencia.'],
  stopSignal,
  possibleDamage: ['Daño a un reloj si se usa como material; por eso la práctica excluye movimientos y componentes delicados.'],
  observe: ['sentido', 'secuencia', 'estado', 'limitación del modelo'],
  record: ['una fotografía propia opcional', 'una explicación breve', 'una duda pendiente'],
  personalCriterion: ['La explicación conserva causalidad.', 'No se atribuyen medidas o destreza física.'],
  suggestedRepetition: 'Dos repeticiones separadas; detente si la segunda no añade una observación.',
  certificationStatus: 'optional-local-not-certified', affectsProgress: false, createsMastery: false, completesLesson: false,
})

export const ACADEMY_STAGE_2_PERSONAL_PRACTICES: readonly AcademyStage2PersonalPractice[] = [
  practice('personal.014h.energy-chain-cards', ['lesson.mechanical.energy'], 'Cadena de energía con tarjetas', 'Ordenar fuente, transmisión, escape, oscilador e indicación.', ['Escribe una función por tarjeta.', 'Ordénalas y dibuja el retorno del oscilador.', 'Retira una interfaz y predice el efecto.'], 'Detente si empiezas a describir un procedimiento sobre un reloj.'),
  practice('personal.014h.barrel-paper-states', ['lesson.mechanical.barrel'], 'Estados del barrilete en papel', 'Comparar cuerda y marcha con dos diagramas propios.', ['Dibuja árbol, muelle y tambor.', 'Marca qué queda retenido en cada estado.', 'Escribe lo que el dibujo no demuestra.'], 'No abras ni uses un barrilete real.'),
  practice('personal.014h.gear-direction-coins', ['lesson.mechanical.gear-pair'], 'Sentido con discos', 'Predecir el sentido de dos ruedas externas.', ['Coloca dos discos en contacto.', 'Gira uno lentamente.', 'Explica por qué el modelo no demuestra engrane válido.'], 'Detente si los discos resbalan o requieren fuerza.'),
  practice('personal.014h.train-axis-map', ['lesson.mechanical.train'], 'Mapa de ejes y etapas', 'Separar engranes de piezas solidarias.', ['Dibuja tres ejes.', 'Une rueda y piñón del mismo eje.', 'Marca solo las interfaces que engranan.'], 'No uses piezas de reloj.'),
  practice('personal.014h.escapement-phase-cards', ['lesson.mechanical.escapement'], 'Secuencia del escape', 'Narrar bloqueo, desbloqueo, impulso y caída.', ['Ordena cuatro tarjetas.', 'Asigna órgano activo.', 'Añade una condición de seguridad.'], 'No toques escape, áncora, volante ni espiral.'),
  practice('personal.014h.oscillator-video-observation', ['lesson.mechanical.oscillator'], 'Observar una oscilación cotidiana', 'Separar periodo y amplitud en un objeto seguro.', ['Graba un péndulo de papel propio.', 'Marca extremos y ciclos.', 'Explica por qué no representa un volante real.'], 'Detente ante cualquier montaje inestable.'),
  practice('personal.014h.feedback-arrows', ['lesson.mechanical.escape-oscillator'], 'Dos flechas del regulador', 'Explicar impulso y liberación como relaciones opuestas.', ['Dibuja escape y oscilador.', 'Añade flecha de energía.', 'Añade flecha de temporización.'], 'Detente si conviertes el esquema en ajuste.'),
  practice('personal.014h.motion-works-paper-dials', ['lesson.mechanical.motion-works'], 'Dos indicaciones coordinadas', 'Representar una relación de indicación sin engranajes reales.', ['Dibuja dos escalas.', 'Marca una vuelta de minutos.', 'Indica el avance correspondiente de horas cualitativamente.'], 'No retires agujas ni coronas.'),
  practice('personal.014h.keyless-state-table', ['lesson.mechanical.keyless'], 'Tabla de estados de corona', 'Comparar rutas de cuerda y puesta en hora.', ['Crea columnas de entrada, selección y salida.', 'Completa dos estados.', 'Anota qué depende del calibre.'], 'No fuerces ni pruebes una corona real.'),
  practice('personal.014h.automatic-energy-map', ['lesson.mechanical.automatic-calendar', 'lesson.encyclopedia.complications.automatico-y-reserva'], 'Ruta de carga automática', 'Seguir rotor, transmisión y acumulador.', ['Dibuja la ruta.', 'Marca dónde podría existir inversión.', 'Separa dato general de dato de calibre.'], 'No agites ni abras un reloj para comprobarlo.'),
  practice('personal.014h.calendar-state-wheel', ['lesson.encyclopedia.complications.calendarios'], 'Calendario de estados en papel', 'Convertir avance continuo en estados discretos.', ['Dibuja cuatro fechas consecutivas.', 'Añade arrastre y retención.', 'Explica qué no sabes sobre la zona de cambio.'], 'No pruebes corrección rápida en un reloj.'),
  practice('personal.014h.stage2-causal-chain', ['lesson.mechanical.energy', 'lesson.mechanical.automatic-calendar'], 'Cadena completa de etapa 2', 'Integrar energía, tren, escape, oscilador, mando y calendario.', ['Construye un mapa de seis sistemas.', 'Añade dos ramas no bloqueantes.', 'Marca tres límites de fuente.'], 'Detente si una rama avanzada se vuelve requisito.'),
  practice('personal.014h.source-locator-cards', ['lesson.encyclopedia.mechanical-energy-trains.toh-engranaje-geometria', 'lesson.advanced.calendars'], 'Tarjetas de procedencia', 'Relacionar cada afirmación con fuente, página y aplicabilidad.', ['Escribe una afirmación conceptual.', 'Registra el localizador disponible.', 'Marca desconocido lo no demostrado.'], 'No uses OCR como prueba de cifras o fórmulas.'),
]

export function academyStage2PersonalPracticesForLesson(lessonId: string) { return ACADEMY_STAGE_2_PERSONAL_PRACTICES.filter(({ lessonIds }) => lessonIds.includes(lessonId)) }
