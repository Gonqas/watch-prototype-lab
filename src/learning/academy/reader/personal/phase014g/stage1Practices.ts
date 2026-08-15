import type { AcademyStage1PersonalPractice } from '../types'

const practice = (input: Omit<AcademyStage1PersonalPractice, 'certificationStatus' | 'affectsProgress' | 'createsMastery' | 'completesLesson'>): AcademyStage1PersonalPractice => ({
  ...input, certificationStatus: 'optional-local-not-certified', affectsProgress: false, createsMastery: false, completesLesson: false,
})

export const ACADEMY_STAGE_1_PERSONAL_PRACTICES: readonly AcademyStage1PersonalPractice[] = [
  practice({
    personalPracticeId: 'personal-practice.stage1.complete-watch-map', lessonIds: ['lesson.horology.system'], title: 'Mapear un reloj cotidiano sin abrirlo',
    objective: 'Distinguir reloj completo, movimiento, indicación, interfaz y protección mediante observación externa.',
    inexpensiveMaterials: ['un reloj propio que no necesite abrirse', 'papel o nota local', 'cámara opcional'],
    preparation: ['No retires fondo, corona, cristal ni componentes.', 'Registra solo lo visible y lo que declara el fabricante.'],
    steps: ['Dibuja las capas.', 'Asigna una función a cada elemento visible.', 'Marca el movimiento como interior no observado.', 'Escribe dos desconocidos.'],
    help: ['Usa entrada, función y resultado.', 'Evita inferir calibre o materiales.'],
    stopSignal: 'La práctica requeriría abrir, forzar o identificar algo no documentado.', possibleDamage: ['rayado o caída si manipulas sin apoyo'],
    observe: ['interfaces visibles', 'indicación', 'elementos de protección'], record: ['mapa propio', 'observaciones e inferencias separadas'],
    personalCriterion: ['No confundes reloj y movimiento.', 'Conservas al menos dos desconocidos.'], suggestedRepetition: 'Una vez con dos relojes de arquitectura visible distinta.',
  }),
  practice({
    personalPracticeId: 'personal-practice.stage1.mechanical-feedback-cards', lessonIds: ['lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', 'lesson.horology.mechanical-chain'], title: 'Reconstruir el bucle con tarjetas',
    objective: 'Explicar la ruta de energía y el retorno escape–oscilador sin una animación.', inexpensiveMaterials: ['cinco tarjetas', 'dos colores de lápiz', 'nota local'],
    preparation: ['Escribe fuente, tren, escape, oscilador e indicación en tarjetas separadas.'],
    steps: ['Ordena la energía.', 'Añade una flecha de impulso.', 'Añade la flecha temporal de retorno.', 'Separa la rama de indicación.', 'Explícalo sin mirar la lección.'],
    help: ['Pregunta qué entrega cada flecha.', 'El escape no es la fuente.'], stopSignal: 'Necesitas atribuir fuerzas, sentidos o valores no declarados.',
    possibleDamage: [], observe: ['si construyes una fila o un bucle', 'dónde sitúas la indicación'], record: ['foto o dibujo del mapa', 'explicación breve'],
    personalCriterion: ['Aparecen las dos direcciones escape–oscilador.', 'La indicación queda como rama.'], suggestedRepetition: 'Dos reconstrucciones separadas por un día.',
  }),
  practice({
    personalPracticeId: 'personal-practice.stage1.quartz-device-map', lessonIds: ['lesson.horology.quartz-chain', 'lesson.horology.functional-equivalence'], title: 'Seguir funciones en un cuarzo accesible',
    objective: 'Relacionar documentación y mapa funcional sin abrir ni medir un movimiento.', inexpensiveMaterials: ['ficha oficial ya registrada', 'papel o nota local'],
    preparation: ['Usa únicamente recursos públicos o ya disponibles en la Academia.', 'No abras el reloj.'],
    steps: ['Localiza energía, referencia, control, motor, tren e indicación.', 'Marca qué afirma la fuente.', 'Señala una equivalencia parcial con el mecánico.', 'Escribe un límite.'],
    help: ['Una imagen de piezas no es una secuencia.', 'Función comparable no significa pieza equivalente.'], stopSignal: 'La conclusión exige una especificación o procedimiento que la fuente no declara.',
    possibleDamage: [], observe: ['tipo de documento', 'funciones distribuidas'], record: ['tabla de afirmaciones y límites'],
    personalCriterion: ['Cada afirmación tiene fuente o queda como desconocida.'], suggestedRepetition: 'Una comparación 2035–mecánico conceptual.',
  }),
  practice({
    personalPracticeId: 'personal-practice.stage1.document-claim-cards', lessonIds: ['lesson.encyclopedia.history-language.leer-documentacion', 'lesson.advanced.atlas-authority'], title: 'Tarjetas de afirmación y autoridad',
    objective: 'Separar dato confirmado, inferencia y desconocido para una pregunta técnica.', inexpensiveMaterials: ['dos documentos ya registrados', 'tres tarjetas o nota local'],
    preparation: ['Formula una pregunta concreta.', 'Anota título, entidad y localizador disponible.'],
    steps: ['Redacta una afirmación.', 'Elige la autoridad por materia.', 'Marca confirmado, inferido o desconocido.', 'Añade aplicabilidad.', 'Escribe qué evidencia la refutaría.'],
    help: ['Divide las frases que contengan dos datos.', 'No uses la primera fuente de una lista por defecto.'], stopSignal: 'No puedes confirmar que el documento corresponda al producto o variante.',
    possibleDamage: [], observe: ['alcance real de cada documento', 'preguntas sin respuesta'], record: ['ficha de procedencia'],
    personalCriterion: ['No conviertes una inferencia en dato.', 'Conservas el hueco documental.'], suggestedRepetition: 'Tres afirmaciones de materias diferentes.',
  }),
  practice({
    personalPracticeId: 'personal-practice.stage1.time-reference-comparison', lessonIds: ['lesson.encyclopedia.history-language.medir-el-tiempo'], title: 'Comparar referencias sin medir precisión',
    objective: 'Aplicar referencia, conteo, escala e indicación a objetos cotidianos.', inexpensiveMaterials: ['reloj mecánico o imagen documentada', 'reloj de cuarzo o imagen documentada', 'temporizador digital', 'nota local'],
    preparation: ['No hagas afirmaciones de precisión.', 'Usa solo observación externa o documentación.'],
    steps: ['Dibuja tres mapas.', 'Marca la referencia declarada o desconocida.', 'Separa conteo e indicación.', 'Añade una fuente de error posible como pregunta, no como diagnóstico.'],
    help: ['La lectura no revela por sí sola la referencia.', 'Resolución y estabilidad no son sinónimos.'], stopSignal: 'La comparación exige abrir, medir o atribuir un valor no documentado.',
    possibleDamage: [], observe: ['qué función permanece', 'qué mecanismo cambia'], record: ['tres mapas y límites'],
    personalCriterion: ['Las funciones se comparan sin afirmar equivalencia física.'], suggestedRepetition: 'Una sesión breve con tres tecnologías.',
  }),
] as const

export function academyStage1PersonalPracticesForLesson(lessonId: string): AcademyStage1PersonalPractice[] {
  return ACADEMY_STAGE_1_PERSONAL_PRACTICES.filter((item) => item.lessonIds.includes(lessonId))
}
