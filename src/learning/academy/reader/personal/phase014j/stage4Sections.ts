import type { AcademyStage4SectionSpec } from '../types'
import { ACADEMY_STAGE_4_CATALOG, type AcademyStage4CatalogEntry } from './stage4Catalog'
import { ACADEMY_STAGE_4_FINAL_CHECKPOINT } from './checkpoint'

const blockId = (lessonId: string) => lessonId.replace('lesson.', 'block.')
const id = (lessonId: string, suffix: string) => `reader.section.${blockId(lessonId)}.014j-${suffix}`

export const academyStage4SectionId = {
  orientation: (lessonId: string) => id(lessonId, 'orientacion'),
  focus: (lessonId: string) => id(lessonId, 'decision-central'),
  evidence: (lessonId: string) => id(lessonId, 'evidencia-y-autoridad'),
  visual: (lessonId: string, visualDesignId: string) => id(lessonId, visualDesignId.replace(/^visual\./,'visual-').replaceAll('.','-')),
  example: (lessonId: string) => id(lessonId, 'caso-razonado'),
  boundary: (lessonId: string) => id(lessonId, 'frontera-documental'),
  checkpoint: (lessonId: string) => id(lessonId, 'comprobacion'),
  final: (lessonId: string) => id(lessonId, 'cierre-etapa-4'),
} as const

function section(sectionId: string, title: string, role: AcademyStage4SectionSpec['role'], markdown: string, placement: AcademyStage4SectionSpec['placement'], extra: Partial<AcademyStage4SectionSpec> = {}): AcademyStage4SectionSpec {
  return { sectionId, title, role, markdown, placement, requiredForStudy: !['sources', 'reference', 'limitations'].includes(role), collapsible: ['sources', 'reference', 'limitations'].includes(role), legacySectionAliases: [], ...extra }
}

const actionRole = (item: AcademyStage4CatalogEntry): AcademyStage4SectionSpec['role'] => item.editorialArchetype === 'calibre-identification' ? 'observation' : item.editorialArchetype === 'document-reading' ? 'reference' : item.editorialArchetype === 'scenario-diagnosis' || item.editorialArchetype === 'traceable-dossier' ? 'diagnosis' : item.editorialArchetype === 'symbolic-inspection' ? 'observation' : item.editorialArchetype === 'virtual-sequence' || item.editorialArchetype === 'virtual-assembly' || item.editorialArchetype === 'structural-dependency' ? 'procedure' : 'explanation'

function sectionsFor(item: AcademyStage4CatalogEntry): readonly AcademyStage4SectionSpec[] {
  const orientation = section(academyStage4SectionId.orientation(item.lessonId), 'La pregunta que guía esta lectura', 'orientation', `${item.whyNow}\n\n**Resultado observable:** ${item.observableOutcome}`, 'before-source')
  const focus = section(academyStage4SectionId.focus(item.lessonId), item.editorialArchetype === 'document-reading' ? 'Elegir autoridad antes de leer' : item.editorialArchetype === 'symbolic-inspection' ? 'Del símbolo a una hipótesis comprobable' : item.editorialArchetype === 'traceable-dossier' ? 'Construir una conclusión trazable' : 'Qué se puede afirmar', actionRole(item), item.editorialFocus, 'after-first-substantive-source')
  const stage4VisualIds = item.visualDesignIds.filter((visualId) => visualId.startsWith('visual.stage4.'))
  const evidence = section(academyStage4SectionId.evidence(item.lessonId), item.editorialArchetype === 'virtual-sequence' ? 'Fundamento y alcance de cada paso' : item.editorialArchetype === 'virtual-assembly' ? 'Cuatro clases de verificación' : 'Evidencia, interpretación y desconocido', 'visual-anatomy', 'Usa los visuales asociados para responder la pregunta central. Cada relación se clasifica como oficial, inferida, conceptual o desconocida. El color nunca sustituye esa etiqueta y la alternativa textual conserva la misma decisión.', 'after-first-substantive-source', { visualDesignId: stage4VisualIds[0] })
  const additionalVisuals = stage4VisualIds.slice(1).map((visualDesignId) => section(academyStage4SectionId.visual(item.lessonId,visualDesignId), 'Comparación documental complementaria', 'comparison', 'Compara ambos snapshots por hash, localizador, terminología, referencia y número de piezas. Un cambio de nombre o maquetación no equivale a una pieza nueva.', 'after-first-substantive-source', { visualDesignId }))
  const example = section(academyStage4SectionId.example(item.lessonId), 'Un caso para comprobar el límite', 'worked-example', item.workedExample, 'after-source')
  const boundary = section(academyStage4SectionId.boundary(item.lessonId), 'Fuente, snapshot y frontera física', 'sources', `${item.sourceScope}\n\nLa lectura y el laboratorio son digitales. Una identidad de pieza, una relación espacial o un cambio de estado del fixture no demuestran herramienta, par, fuerza, lubricación, ajuste, desgaste ni destreza física.`, 'reference-tail')
  const checkpoint = section(academyStage4SectionId.checkpoint(item.lessonId), 'Comprobación antes de continuar', 'checkpoint', `${item.checkpointPrompt}\n\nIncluye: ${item.checkpointExpectedElements.join('; ')}. La respuesta puede producir K, V y/o R; no acredita P.`, 'after-source')
  if (item.lessonId === 'lesson.miyota8215.diagnosis-project') {
    const final = section(academyStage4SectionId.final(item.lessonId), ACADEMY_STAGE_4_FINAL_CHECKPOINT.title, 'next-connection', `${ACADEMY_STAGE_4_FINAL_CHECKPOINT.questions.map((question) => `- ${question}`).join('\n')}\n\n**Acciones disponibles**\n\n${ACADEMY_STAGE_4_FINAL_CHECKPOINT.actions.map(({ label, href }) => `- [${label}](${href})`).join('\n')}\n\n${ACADEMY_STAGE_4_FINAL_CHECKPOINT.evidence}`, 'after-source')
    return [orientation, focus, evidence, ...additionalVisuals, example, checkpoint, boundary, final]
  }
  if (item.editorialArchetype === 'document-reading') return [orientation, evidence, ...additionalVisuals, focus, example, boundary, checkpoint]
  if (item.editorialArchetype === 'virtual-sequence') return [orientation, focus, example, evidence, checkpoint, boundary]
  if (item.editorialArchetype === 'symbolic-inspection') return [orientation, focus, evidence, boundary, example, checkpoint]
  if (item.pathRole === 'optional-branch') return [orientation, focus, boundary, checkpoint]
  return [orientation, focus, evidence, ...additionalVisuals, example, checkpoint, boundary]
}

export const ACADEMY_STAGE_4_SECTIONS: Readonly<Record<string, readonly AcademyStage4SectionSpec[]>> = Object.fromEntries(ACADEMY_STAGE_4_CATALOG.map((item) => [item.lessonId, sectionsFor(item)]))
