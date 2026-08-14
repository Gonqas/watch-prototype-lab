export interface AcademyReaderPilotCuration {
  lessonId: string
  centralQuestion: string
  visualPlan: 'system-map' | 'causal-chain' | 'annotated-anatomy' | 'comparison' | 'inspection-path'
  curationMethod: 'codex-assisted' | 'automated'
  ownerReviewPending: true
  rationale: string
}

export const ACADEMY_READER_PILOT: readonly AcademyReaderPilotCuration[] = [
  ['lesson.quartz2035.workstation', '¿Cómo se prepara un puesto de trabajo que reduzca contaminación, pérdidas y errores de manipulación?', 'inspection-path', 'codex-assisted', 'La preparación del banco se entiende mejor como una secuencia observable.'],
  ['lesson.quartz2035.tools', '¿Qué función cumple cada herramienta antes de tocar el calibre?', 'annotated-anatomy', 'codex-assisted', 'Relaciona herramienta, función y límite sin afirmar destreza física.'],
  ['lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion', '¿Cómo cambia la observación cuando varían aumento, iluminación y manipulación?', 'comparison', 'codex-assisted', 'Compara condiciones ópticas sin convertirlas en una evaluación física.'],
  ['lesson.horology.system', '¿Qué funciones debe cumplir cualquier reloj para medir y mostrar el tiempo?', 'system-map', 'codex-assisted', 'Presenta el reloj completo antes de sus detalles.'],
  ['lesson.horology.mechanical-chain', '¿Cómo viajan energía e información por la cadena mecánica?', 'causal-chain', 'codex-assisted', 'La causalidad ordenada es la estructura central de la lección.'],
  ['lesson.horology.functional-equivalence', '¿Qué funciones equivalentes resuelven de forma distinta un reloj mecánico y uno de cuarzo?', 'comparison', 'codex-assisted', 'La comparación debe conservar equivalencias y límites.'],
  ['lesson.mechanical.energy', '¿Dónde se almacena, transmite, dosifica y disipa la energía?', 'causal-chain', 'codex-assisted', 'Hace visible la continuidad energética del sistema.'],
  ['lesson.mechanical.barrel', '¿Cómo convierte el barrilete la reserva del muelle en entrega útil?', 'annotated-anatomy', 'codex-assisted', 'Vincula piezas y función sin introducir un procedimiento de servicio.'],
  ['lesson.mechanical.gear-pair', '¿Cómo determinan dos engranajes sentido, relación y condiciones de contacto?', 'causal-chain', 'codex-assisted', 'La relación geométrica necesita una representación explícita.'],
  ['lesson.mechanical.train', '¿Cómo se encadenan las relaciones del tren hasta el escape?', 'causal-chain', 'codex-assisted', 'Sitúa cada par dentro de un sistema mayor.'],
  ['lesson.mechanical.escapement', '¿Cómo alterna el escape bloqueo, liberación e impulso?', 'causal-chain', 'codex-assisted', 'La secuencia temporal es el núcleo observable.'],
  ['lesson.mechanical.oscillator', '¿Cómo establece el oscilador una referencia periódica?', 'system-map', 'codex-assisted', 'Separa función reguladora de ajuste físico.'],
  ['lesson.mechanical.motion-works', '¿Cómo transforma la minutería el movimiento regulado en indicación horaria?', 'causal-chain', 'codex-assisted', 'Conecta transmisión e indicación.'],
  ['lesson.metrology.observe-before-measuring', '¿Qué debe observarse y registrarse antes de elegir una medición?', 'inspection-path', 'codex-assisted', 'Preserva la precedencia diagnóstica de la observación.'],
  ['lesson.horology.failure-prediction', '¿Qué fallo cabe predecir si se interrumpe cada función del sistema?', 'causal-chain', 'codex-assisted', 'Relaciona causa funcional y síntoma sin inventar diagnóstico.'],
  ['lesson.miyota8215.architecture', '¿Cómo se distribuyen los subsistemas documentados del MIYOTA 8215?', 'annotated-anatomy', 'codex-assisted', 'El calibre exige una lectura específica apoyada en su documentación.'],
  ['lesson.miyota8215.guided-disassembly', '¿Qué orden y puntos de control hacen reversible un desmontaje guiado?', 'inspection-path', 'codex-assisted', 'Explicita secuencia y límites; la destreza física requiere evidencia separada.'],
  ['lesson.miyota8215.inspection', '¿Qué observaciones permiten distinguir estado, defecto e incertidumbre?', 'inspection-path', 'codex-assisted', 'Organiza la inspección sin anticipar conclusiones.'],
  ['lesson.miyota8215.assembly-verification', '¿Qué comprobaciones permiten liberar cada etapa del montaje?', 'inspection-path', 'codex-assisted', 'Sincroniza montaje y verificación sin acreditar banco desde la interfaz.'],
  ['lesson.encyclopedia.cases-water.arquitectura-de-caja', '¿Qué interfaces conectan movimiento, esfera, cristal, corona y fondo?', 'annotated-anatomy', 'codex-assisted', 'Hace visibles las interfaces de integración de caja.'],
  ['lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', '¿Qué relaciones geométricas gobiernan el encaje y la libertad de las agujas?', 'annotated-anatomy', 'codex-assisted', 'Distingue geometría, compatibilidad y ajuste físico.'],
].map(([lessonId, centralQuestion, visualPlan, curationMethod, rationale]) => ({
  lessonId,
  centralQuestion,
  visualPlan,
  curationMethod,
  ownerReviewPending: true,
  rationale,
})) as readonly AcademyReaderPilotCuration[]

export const ACADEMY_READER_PILOT_IDS = new Set(ACADEMY_READER_PILOT.map(({ lessonId }) => lessonId))

export function academyReaderPilotCuration(lessonId: string): AcademyReaderPilotCuration | undefined {
  return ACADEMY_READER_PILOT.find((item) => item.lessonId === lessonId)
}
