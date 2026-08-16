import type { AcademySourcePreservingLessonContext } from '../types'

export interface AcademyStage01RemediationRecord {
  lessonId: string
  macroStage: 0 | 1
  historicalPhase: '0.14F' | '0.14G'
  selectedHistoricalSectionIds: readonly string[]
  rationale: string
}

const record = (lessonId: string, macroStage: 0 | 1, historicalPhase: '0.14F' | '0.14G', suffixes: readonly string[], rationale: string): AcademyStage01RemediationRecord => ({
  lessonId, macroStage, historicalPhase, selectedHistoricalSectionIds: suffixes.map((suffix) => `reader.section.${lessonId.replace('lesson.', 'block.')}.${historicalPhase === '0.14F' ? '014f' : '014g'}-${suffix}`), rationale,
})

export const ACADEMY_STAGE_0_1_REMEDIATIONS: readonly AcademyStage01RemediationRecord[] = [
  record('lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad', 0, '0.14F', ['caso-razonado','decision-segura'], 'Recupera la teoría authored y conserva el caso de control de piezas y la decisión de no empezar.'),
  record('lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion', 0, '0.14F', ['luz-y-aumento','caso-brillo-o-defecto'], 'Conserva el visual de cambio de condición y el contraste entre apariencia e interpretación.'),
  record('lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 0, '0.14F', ['mapa-de-transferencia','limpieza-sin-recetas'], 'Conserva el mapa preventivo y el límite explícito que evita recetas.'),
  record('lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica', 0, '0.14F', ['criterio-personal','errores-y-danos'], 'Conserva autoobservación, daños y señales de parada sin certificar destreza.'),
  record('lesson.horology.system', 1, '0.14G', ['capas','caso'], 'Conserva el visual de capas y el caso que distingue reloj completo y movimiento.'),
  record('lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', 1, '0.14G', ['organos','puente'], 'Conserva el mapa funcional y el puente, sin exigir detalles que la visión general introduce.'),
  record('lesson.horology.mechanical-chain', 1, '0.14G', ['mapa','fallo'], 'Conserva el bucle visual y el caso de interrupción junto a la teoría extensa.'),
  record('lesson.horology.quartz-chain', 1, '0.14G', ['mapa','comparacion'], 'Conserva la especialización visual de cuarzo y su comparación limitada.'),
  record('lesson.horology.functional-equivalence', 1, '0.14G', ['matriz','caso'], 'Conserva equivalencias parciales y el límite de transferencia.'),
  record('lesson.encyclopedia.history-language.leer-documentacion', 1, '0.14G', ['tipos','caso'], 'Conserva el visual de autoridad documental y el caso de aplicabilidad.'),
  record('lesson.encyclopedia.history-language.medir-el-tiempo', 1, '0.14G', ['mapa','caso'], 'Conserva el mapa referencia–conteo–escala y la comparación histórica.'),
  record('lesson.advanced.atlas-authority', 1, '0.14G', ['ruta','caso'], 'Conserva la ruta de procedencia y el caso de variante no confirmada.'),
] as const

export const ACADEMY_STAGE_0_1_AUDITED_UNCHANGED = [
  { lessonId: 'lesson.quartz2035.workstation', decision: 'unchanged', reason: 'No se demostró pérdida semántica en la lectura activa.' },
  { lessonId: 'lesson.quartz2035.tools', decision: 'unchanged', reason: 'No se demostró pérdida semántica en la lectura activa.' },
] as const

const byId = new Map(ACADEMY_STAGE_0_1_REMEDIATIONS.map((item) => [item.lessonId, item]))
export function academyStage01Remediation(lessonId: string) { return byId.get(lessonId) }

export function academyStage01RemediationAdditions(context: AcademySourcePreservingLessonContext) {
  const remediation = academyStage01Remediation(context.lessonId)
  if (!remediation) return []
  const previous = new Map(context.previousPhaseSections.map((section) => [section.sectionId, section]))
  const additions = remediation.selectedHistoricalSectionIds.map((sectionId) => previous.get(sectionId))
  const missing = remediation.selectedHistoricalSectionIds.filter((_, index) => !additions[index])
  if (missing.length) throw new Error(`Faltan apartados históricos para remediar ${context.lessonId}: ${missing.join(', ')}`)
  return additions.filter((section): section is NonNullable<typeof section> => Boolean(section)).map((section) => ({ ...section }))
}
