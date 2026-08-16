import type { AcademyStage5SectionSpec } from '../types'
import { ACADEMY_STAGE_5_CATALOG, type AcademyStage5CatalogEntry } from './stage5Catalog'
import { ACADEMY_STAGE_5_FINAL_CHECKPOINT } from './checkpoint'

const blockId = (lessonId: string) => lessonId.replace('lesson.','block.')
const id = (lessonId: string, suffix: string) => `reader.section.${blockId(lessonId)}.014k-${suffix}`
export const academyStage5SectionId = {
  orientation:(lessonId:string) => id(lessonId,'pregunta-de-integracion'),
  method:(lessonId:string) => id(lessonId,'metodo-verificable'),
  example:(lessonId:string) => id(lessonId,'caso-razonado'),
  checkpoint:(lessonId:string) => id(lessonId,'comprobacion-y-proyecto'),
  final:(lessonId:string) => id(lessonId,'cierre-etapa-5'),
} as const

function section(sectionId:string,title:string,role:AcademyStage5SectionSpec['role'],markdown:string,placement:AcademyStage5SectionSpec['placement'],visualDesignId?:string): AcademyStage5SectionSpec {
  return {sectionId,title,role,markdown,placement,visualDesignId,requiredForStudy:!['sources','reference','limitations'].includes(role),collapsible:['sources','reference','limitations'].includes(role),legacySectionAliases:[]}
}

function methodText(item: AcademyStage5CatalogEntry): string {
  const base = `${item.methodFocus}\n\nTrabaja por este orden: identifica las dos caras de cada interfaz; registra la autoridad y aplicabilidad; expresa cada dimensión desconocida como **unknown**; fija datum, dirección y unidad; ejecuta únicamente el cálculo cuyas entradas estén completas; propaga conflictos y desconocidos; termina con una decisión limitada por la evidencia.`
  if (item.lessonId.includes('arquitectura-de-caja')) return `${base}\n\nEl aro puede centrar, apoyar, retener, impedir giro, alinear la tija, permitir acceso y conservar desmontabilidad. Esas funciones son independientes. Un sobre conceptual solo se vuelve dimensionally-defined cuando todas sus interfaces disponen de cotas aplicables.`
  if (item.lessonId.includes('arquitectura-de-esfera')) return `${base}\n\nRegistra diámetro total, apertura visible, asiento, juego radial, espesor, pies por radio y ángulo, ventana de fecha, índices y espacio posterior. Cortar, soldar o pegar no es una acción de esta etapa.`
  if (item.lessonId.includes('agujas-geometria')) return `${base}\n\nPara cada aguja conserva poste, agujero, tubo, longitud, material, datum de altura y barrido. La cadena queda abierta si falta una sola altura crítica.`
  if (item.lessonId.includes('toh-materiales')) return `${base}\n\nSepara rutas de fuga, diseño de alojamientos, preparación del conjunto, ensayo real y resultado. Sin ensayo documentado, el estado es **not-verified**.`
  if (item.lessonId === 'lesson.mechanical.final-project') return `${base}\n\nCada paso del plan declara dependencia, checkpoint, condición de parada y rollback. 0.14K conserva todos los pasos físicos como planned-only.`
  return base
}

function sectionsFor(item: AcademyStage5CatalogEntry): readonly AcademyStage5SectionSpec[] {
  const primaryVisual = item.visualDesignIds[0]
  const result = [
    section(academyStage5SectionId.orientation(item.lessonId),'La pregunta de integración','orientation',`${item.whyNow}\n\n**Pregunta central:** ${item.centralQuestion}\n\n**Resultado observable:** ${item.observableOutcome}`,'before-source'),
    section(academyStage5SectionId.method(item.lessonId),'Método verificable','explanation',methodText(item),'after-first-substantive-source',primaryVisual),
    section(academyStage5SectionId.example(item.lessonId),'Caso razonado y límite','worked-example',`${item.workedExample}\n\n**Autoridad y límite:** ${item.sourceScope}\n\nLa ausencia de conflicto en el modelo no acredita compatibilidad física; ninguna actividad de esta etapa produce P.`,'after-source',item.visualDesignIds[1]),
    section(academyStage5SectionId.checkpoint(item.lessonId),'Comprobación y vínculo con el proyecto','checkpoint',`Comprueba: ${item.checkpointExpectedElements.join('; ')}. Si un dato falta, registra qué documento o medición lo resolvería.\n\n[Abrir laboratorio personal de integración](#/learning/workshop?integration=1&fromLesson=${encodeURIComponent(item.lessonId)})`,'after-source'),
  ]
  if (item.lessonId === 'lesson.capstone.validation.calibre-transfer') result.push(section(
    academyStage5SectionId.final(item.lessonId),ACADEMY_STAGE_5_FINAL_CHECKPOINT.title,'next-connection',
    `${ACADEMY_STAGE_5_FINAL_CHECKPOINT.questions.map((question) => `- ${question}`).join('\n')}\n\n**Acciones**\n\n${ACADEMY_STAGE_5_FINAL_CHECKPOINT.actions.map(({label,href}) => `- [${label}](${href})`).join('\n')}\n\nCompletar el método abre la etapa 6; no declara un reloj físico montado.`,
    'after-source',
  ))
  return result
}

export const ACADEMY_STAGE_5_SECTIONS: Readonly<Record<string,readonly AcademyStage5SectionSpec[]>> = Object.fromEntries(ACADEMY_STAGE_5_CATALOG.map((item) => [item.lessonId,sectionsFor(item)]))

