import type { AcademyStage3SectionSpec } from '../types'
import { ACADEMY_STAGE_3_CATALOG, type AcademyStage3CatalogEntry } from './stage3Catalog'
import { ACADEMY_STAGE_3_FINAL_CHECKPOINT } from './checkpoint'

const blockId = (lessonId: string) => lessonId.replace('lesson.', 'block.')
const id = (lessonId: string, suffix: string) => `reader.section.${blockId(lessonId)}.014i-${suffix}`

const finalCheckpointActions = [
  ['Repasar observación', '#/learning/lesson/lesson.metrology.observe-before-measuring'],
  ['Repasar metrología', '#/learning/lesson/lesson.metrology.units-scale-resolution'],
  ['Repasar diagnóstico', '#/learning/lesson/lesson.horology.failure-prediction'],
  ['Repasar limpieza y tribología', '#/learning/lesson/lesson.encyclopedia.service-tribology.limpieza-e-inspeccion'],
  ['Repasar montaje y aceptación', '#/learning/lesson/lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control'],
  ['Abrir una práctica personal', '#/learning/lesson/lesson.metrology.physical-measurement?section=reader.section.block.metrology.physical-measurement.014i-fuentes-y-limites'],
  ['Continuar al calibre real', '#/learning/my-learning?chapter=chapter.4.1'],
] as const

export const academyStage3SectionId = {
  orientation: (lessonId: string) => id(lessonId, 'orientacion'),
  focus: (lessonId: string) => id(lessonId, 'decision-central'),
  visual: (lessonId: string, visualDesignId: string) => id(lessonId, visualDesignId.replace(/^visual\./, 'visual-').replaceAll('.', '-')),
  example: (lessonId: string) => id(lessonId, 'caso-razonado'),
  checkpoint: (lessonId: string) => id(lessonId, 'comprobacion'),
  sources: (lessonId: string) => id(lessonId, 'fuentes-y-limites'),
  finalCheckpoint: (lessonId: string) => id(lessonId, 'cierre-etapa-3'),
} as const

function section(sectionId: string, title: string, role: AcademyStage3SectionSpec['role'], markdown: string, placement: AcademyStage3SectionSpec['placement'], extra: Partial<AcademyStage3SectionSpec> = {}): AcademyStage3SectionSpec {
  return { sectionId, title, role, markdown, placement, requiredForStudy: !['sources', 'reference', 'limitations'].includes(role), collapsible: ['sources', 'reference', 'limitations'].includes(role), legacySectionAliases: [], ...extra }
}

function sectionsFor(item: AcademyStage3CatalogEntry): readonly AcademyStage3SectionSpec[] {
  const orientation = section(academyStage3SectionId.orientation(item.lessonId), 'La decisión que abre esta lección', 'orientation', `${item.whyNow}\n\n**Resultado observable:** ${item.observableOutcome}`, 'before-source')
  const focusRole = item.editorialArchetype === 'diagnosis' ? 'diagnosis' : item.editorialArchetype === 'historical-case' ? 'comparison' : item.editorialArchetype === 'measurement' || item.editorialArchetype === 'data-comparison' ? 'explanation' : item.editorialArchetype === 'reasoned-service' ? 'procedure' : 'observation'
  const focus = section(academyStage3SectionId.focus(item.lessonId), item.editorialArchetype === 'historical-case' ? 'Principio útil y frontera histórica' : 'Qué debe permanecer separado', focusRole, item.editorialFocus, 'after-first-substantive-source')
  const visuals = item.visualDesignIds.filter((visualDesignId) => visualDesignId.startsWith('visual.stage3.')).map((visualDesignId) => section(academyStage3SectionId.visual(item.lessonId, visualDesignId), 'Mapa para comprobar la decisión', item.editorialArchetype === 'diagnosis' ? 'diagnosis' : item.editorialArchetype === 'data-comparison' ? 'comparison' : 'visual-anatomy', 'Recorre las relaciones del visual y explica qué dato permite avanzar y qué dato sigue abierto. Las etiquetas transmiten la relación sin depender del color.', 'after-first-substantive-source', { visualDesignId }))
  const example = section(academyStage3SectionId.example(item.lessonId), 'Caso breve para razonar', 'worked-example', item.workedExample, 'after-source')
  const checkpoint = section(academyStage3SectionId.checkpoint(item.lessonId), 'Comprobación antes de continuar', 'checkpoint', `${item.checkpointPrompt}\n\nIncluye: ${item.checkpointExpectedElements.join('; ')}. La respuesta digital produce K, V y/o R según la actividad; nunca acredita P sin ejecución física explícita.`, 'after-source')
  const sources = section(academyStage3SectionId.sources(item.lessonId), 'Fuentes, vigencia y límites', 'sources', `${item.sourceScope}\n\nUna fuente histórica conserva contexto y método, pero no autoriza seguridad, química, tolerancias, productos o aceptación actuales.`, 'reference-tail')
  if (item.editorialArchetype === 'historical-case') return [orientation, focus, example, checkpoint, sources]
  if (item.editorialArchetype === 'data-comparison') return [orientation, focus, ...visuals, checkpoint, example, sources]
  if (item.lessonId === 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control') {
    const final = section(academyStage3SectionId.finalCheckpoint(item.lessonId), ACADEMY_STAGE_3_FINAL_CHECKPOINT.title, 'next-connection', `${ACADEMY_STAGE_3_FINAL_CHECKPOINT.questions.map((question) => `- ${question}`).join('\n')}\n\n**Acciones disponibles**\n\n${finalCheckpointActions.map(([label, href]) => `- [${label}](${href})`).join('\n')}\n\n${ACADEMY_STAGE_3_FINAL_CHECKPOINT.evidence}`, 'after-source')
    return [orientation, focus, ...visuals, example, sources, checkpoint, final]
  }
  if (item.editorialArchetype === 'reasoned-service') return [orientation, focus, ...visuals, example, sources, checkpoint]
  if (item.editorialArchetype === 'diagnosis') return [orientation, focus, ...visuals, example, checkpoint, sources]
  return [orientation, ...visuals, focus, example, checkpoint, sources]
}

export const ACADEMY_STAGE_3_SECTIONS: Readonly<Record<string, readonly AcademyStage3SectionSpec[]>> = Object.fromEntries(ACADEMY_STAGE_3_CATALOG.map((item) => [item.lessonId, sectionsFor(item)]))
