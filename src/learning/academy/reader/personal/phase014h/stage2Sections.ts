import type { AcademyStage2SectionSpec } from '../types'
import { ACADEMY_STAGE_2_CATALOG, type AcademyStage2CatalogEntry } from './stage2Catalog'

const blockId = (lessonId: string) => lessonId.replace('lesson.', 'block.')
const id = (lessonId: string, role: string) => `reader.section.${blockId(lessonId)}.014h-${role}`
const visualSlug = (visualDesignId: string) => visualDesignId.replace(/^visual\./, '').replaceAll('.', '-')

export const academyStage2SectionId = {
  orientation: (lessonId: string) => id(lessonId, 'orientacion'),
  vocabulary: (lessonId: string) => id(lessonId, 'vocabulario'),
  visual: (lessonId: string, visualDesignId: string) => id(lessonId, `explicacion-${visualSlug(visualDesignId)}`),
  example: (lessonId: string) => id(lessonId, 'caso'),
  errors: (lessonId: string) => id(lessonId, 'limites-de-interpretacion'),
  checkpoint: (lessonId: string) => id(lessonId, 'comprobacion-especifica'),
  connection: (lessonId: string) => id(lessonId, 'puente-siguiente'),
  sources: (lessonId: string) => id(lessonId, 'fuentes-y-alcance'),
} as const

export function academyStage2PrimaryVisualSectionId(lessonId: string): string {
  const designId = ACADEMY_STAGE_2_CATALOG.find((item) => item.lessonId === lessonId)?.visualDesignIds[0]
  return designId ? academyStage2SectionId.visual(lessonId, designId) : academyStage2SectionId.orientation(lessonId)
}

interface VisualCopy { title: string; instruction: string }
export const ACADEMY_STAGE_2_VISUAL_COPY: Readonly<Record<string, VisualCopy>> = {
  'visual.mechanical-energy.flow': { title: 'Del muelle al escape: una cadena con pérdidas', instruction: 'Recorre un único camino desde el muelle hasta el escape y nombra en cada enlace si se almacena, transmite o dosifica energía.' },
  'visual.stage2.energy-quantities.v1': { title: 'Cuatro magnitudes que no son intercambiables', instruction: 'Compara qué pregunta responde cada nodo; una flecha no afirma que conocer una magnitud permita calcular las demás.' },
  'visual.barrel.anatomy': { title: 'Dónde actúa cada pieza del barrilete', instruction: 'Localiza árbol, muelle, tambor y tapa antes de comparar sus papeles durante carga y marcha.' },
  'visual.barrel.winding-discharge': { title: 'Qué queda retenido en cuerda y en marcha', instruction: 'Compara ambos estados y señala qué elemento recibe la entrada y cuál entrega la salida.' },
  'visual.stage2.barrel-states.v1': { title: 'Reserva y entrega como estados distintos', instruction: 'Sigue el cambio entre reserva baja, carga y entrega sin interpretar el gráfico como una curva medida.' },
  'visual.gear-pair.ratio': { title: 'Círculos primitivos, dientes y sentido', instruction: 'Identifica conductora y conducida y justifica el sentido opuesto antes de interpretar la relación ideal.' },
  'visual.gear-pair.direction-torque': { title: 'Lo que la pareja adapta y lo que no demuestra', instruction: 'Separa la predicción ideal de dirección y velocidad de las pérdidas y resistencias que el esquema no contiene.' },
  'visual.train.real-order': { title: 'Ejes, móviles e interfaces del tren', instruction: 'Distingue los contactos dentados de las ruedas y piñones que giran solidarios sobre un mismo eje.' },
  'visual.train.3d-overview': { title: 'La profundidad espacial del tren conceptual', instruction: 'Usa la vista espacial para seguir niveles y ejes; no la leas como planta ni como cota de un calibre.' },
  'visual.stage2.compound-train.v1': { title: 'Qué etapas entran en la relación total', instruction: 'Marca únicamente las interfaces activas y conserva el papel geométrico del eje intermedio aunque un término se cancele.' },
  'visual.stage2.going-vs-motion.v1': { title: 'Ruta al escape y rama hacia las agujas', instruction: 'Sigue por separado la transmisión regulada y la derivación de indicación; explica por qué cumplen funciones diferentes.' },
  'visual.escapement.interfaces': { title: 'Tres interfaces del escape de áncora', instruction: 'Localiza rueda, paletas y rodillo, y asigna a cada contacto una función sin inferir una corrección física.' },
  'visual.escapement.phases': { title: 'Un ciclo: bloqueo, desbloqueo, impulso y caída', instruction: 'Sigue una sola cara de paleta durante el ciclo y anota qué elemento inicia cada transición.' },
  'visual.stage2.escapement-safety.v1': { title: 'Cómo se representan las funciones de seguridad', instruction: 'Relaciona cuernos, seguro y rodillo con el contacto que pretenden evitar; el esquema no fija holguras.' },
  'visual.oscillator.active-length': { title: 'Inercia, retorno y fijaciones del oscilador', instruction: 'Localiza volante, espiral, virola y pitón y separa sus funciones de cualquier ajuste de marcha.' },
  'visual.stage2.frequency-amplitude.v1': { title: 'Periodo y amplitud en un ciclo cualitativo', instruction: 'Compara extremos y paso por el equilibrio para distinguir amplitud, media alternancia y ciclo completo.' },
  'visual.oscillator.feedback': { title: 'Impulso, pérdidas y referencia temporal', instruction: 'Lee las flechas en ambas direcciones: el escape repone energía y el oscilador condiciona la liberación.' },
  'visual.stage2.feedback-loop.v1': { title: 'Por qué la regulación forma un bucle', instruction: 'Explica una vuelta completa tren–escape–oscilador–escape sin convertir el escape en creador de frecuencia.' },
  'visual.stage2.keyless-states.v1': { title: 'Una entrada, dos rutas seleccionadas', instruction: 'Compara la posición de mando que conduce a cuerda con la que conduce a puesta en hora.' },
  'visual.stage2.automatic-flow.v1': { title: 'Del movimiento del usuario al muelle', instruction: 'Sigue masa oscilante y reducción hasta el acumulador y marca eficiencia, sentido y reserva como datos no demostrados.' },
  'visual.stage2.calendar-sequence.v1': { title: 'Del arrastre lento al salto de fecha', instruction: 'Localiza qué elemento acumula el movimiento, cuál produce el avance y cuál estabiliza la nueva fecha.' },
  'visual.stage2.control-states.v1': { title: 'Mando, estado retenido e indicación', instruction: 'Compara la forma de conservar un estado sin trasladar al cronógrafo la arquitectura de un calendario.' },
}

const baseSection = (
  sectionId: string,
  title: string,
  role: AcademyStage2SectionSpec['role'],
  markdown: string,
  placement: AcademyStage2SectionSpec['placement'],
  extra: Partial<AcademyStage2SectionSpec> = {},
): AcademyStage2SectionSpec => ({ sectionId, title, role, markdown, placement, legacySectionAliases: [], ...extra })

function sectionsFor(item: AcademyStage2CatalogEntry): readonly AcademyStage2SectionSpec[] {
  const orientation = baseSection(academyStage2SectionId.orientation(item.lessonId), `Antes de entrar en ${item.topicLabel}`, 'orientation', `${item.whyNow}\n\n**Resultado observable:** ${item.observableOutcome}`, 'before-source', { legacySectionAliases: item.pilotHeritage ? [`reader.section.${blockId(item.lessonId)}.proposito`] : [] })
  const vocabulary = baseSection(academyStage2SectionId.vocabulary(item.lessonId), `Palabras para leer ${item.topicLabel}`, 'vocabulary', item.vocabulary, 'before-source')
  const visuals = item.visualDesignIds.map((visualDesignId, index) => {
    const copy = ACADEMY_STAGE_2_VISUAL_COPY[visualDesignId]
    if (!copy) throw new Error(`Falta texto visual específico para ${visualDesignId}.`)
    return baseSection(academyStage2SectionId.visual(item.lessonId, visualDesignId), copy.title, item.editorialArchetype === 'comparison' ? 'comparison' : item.editorialArchetype === 'state-system' ? 'explanation' : 'visual-anatomy', `${index === 0 ? `${item.explanation}\n\n` : ''}${copy.instruction}`, 'after-first-substantive-source', { visualDesignId })
  })
  const example = baseSection(academyStage2SectionId.example(item.lessonId), `Caso para razonar ${item.topicLabel}`, 'worked-example', item.workedExample, 'after-source')
  const errors = baseSection(academyStage2SectionId.errors(item.lessonId), `Dónde se rompe la interpretación de ${item.topicLabel}`, 'common-errors', item.commonErrors, 'after-source')
  const checkpoint = baseSection(academyStage2SectionId.checkpoint(item.lessonId), `Comprueba si puedes explicar ${item.topicLabel}`, 'checkpoint', `${item.checkpointPrompt}\n\n**Tu respuesta debe incluir:** ${item.checkpointExpectedElements.join('; ')}.\n\n**Fallo que debes evitar:** ${item.checkpointCommonFailure}\n\nEsta comprobación produce evidencia K/V/R cuando existe actividad virtual; no acredita ejecución física.`, 'after-source')
  const connection = baseSection(academyStage2SectionId.connection(item.lessonId), 'El siguiente paso', 'next-connection', item.nextConnection, 'after-source')
  const sources = baseSection(academyStage2SectionId.sources(item.lessonId), 'Fuentes, alcance y cuestiones abiertas', 'sources', `${item.sourceScope.replaceAll('source-limited', 'pendiente de una fuente específica')}\n\nNo se trasladan fórmulas, cifras, tolerancias ni procedimientos desde OCR sin verificación visual y aplicabilidad.`, 'reference-tail', { requiredForStudy: false, collapsible: true })

  switch (item.editorialArchetype) {
    case 'calculation': return [orientation, vocabulary, ...visuals, example, checkpoint, errors, connection, sources]
    case 'visual-anatomy': return [orientation, ...visuals, vocabulary, example, errors, checkpoint, connection, sources]
    case 'comparison': return [orientation, vocabulary, ...visuals, example, errors, checkpoint, connection, sources]
    case 'state-system': return [orientation, vocabulary, ...visuals, errors, example, checkpoint, connection, sources]
    case 'advanced-reference': return [orientation, ...visuals, example, checkpoint, sources]
    case 'mechanism': return [orientation, vocabulary, ...visuals, example, errors, checkpoint, connection, sources]
  }
}

export const ACADEMY_STAGE_2_SECTIONS: Readonly<Record<string, readonly AcademyStage2SectionSpec[]>> = Object.fromEntries(ACADEMY_STAGE_2_CATALOG.map((item) => [item.lessonId, sectionsFor(item)]))

/** Snapshot reproducible de la presentación corta anterior al addendum; solo se usa para el antes/después. */
export const ACADEMY_STAGE_2_LEGACY_SUMMARY_SECTIONS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  ACADEMY_STAGE_2_CATALOG.map((item) => [item.lessonId, [
    `Esta lección aparece después del sistema que proporciona su entrada funcional y antes del mecanismo que recibe su salida. ${item.observableOutcome}`,
    item.vocabulary,
    item.explanation,
    'Sigue las flechas, identifica las interfaces y explica qué cambia entre estados. Relaciona el gráfico con la pregunta central mostrada en la cabecera. Su geometría es didáctica: no reproduce escala, fuerza, holgura ni tolerancia de un calibre.',
    item.workedExample,
    item.commonErrors,
    'Explica con tus palabras la relación central, cambia una condición del modelo y predice el resultado. Señala después una afirmación que el diagrama no demuestra. Evidencia K/V/R; no acredita ejecución física.',
    item.nextConnection,
    `${item.sourceScope} No se trasladan fórmulas, cifras, tolerancias ni procedimientos desde OCR sin verificación visual y aplicabilidad.`,
  ]]),
)

export const ACADEMY_STAGE_2_SECTION_COUNT = Object.values(ACADEMY_STAGE_2_SECTIONS).reduce((sum, sections) => sum + sections.length, 0)
export const ACADEMY_STAGE_2_SECTION_ID_NAMESPACE = 'reader.section.block.stage2.014h-editorial'
