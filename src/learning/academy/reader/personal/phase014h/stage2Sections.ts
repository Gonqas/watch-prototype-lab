import type { AcademyStage2SectionSpec } from '../types'
import { ACADEMY_STAGE_2_CATALOG } from './stage2Catalog'

const suffix = (lessonId: string) => lessonId.replace('lesson.', '').replaceAll('.', '-')

export const ACADEMY_STAGE_2_SECTIONS: Readonly<Record<string, readonly AcademyStage2SectionSpec[]>> = Object.fromEntries(
  ACADEMY_STAGE_2_CATALOG.map((item) => {
    const id = (role: string) => `reader.section.${item.lessonId.replace('lesson.', 'block.')}.014h-${role}`
    const inherited = item.pilotHeritage ? [`reader.section.${item.lessonId.replace('lesson.', 'block.')}.proposito`] : []
    return [item.lessonId, [
      { sectionId: id('orientacion'), title: 'Por qué aparece ahora y resultado observable', role: 'orientation', markdown: `Esta lección aparece después del sistema que proporciona su entrada funcional y antes del mecanismo que recibe su salida.\n\n**Al terminar:** ${item.observableOutcome}${item.pilotHeritage ? '\n\nEsta orientación refina la revisión piloto 0.14E y conserva su pregunta funcional en la cabecera del lector.' : ''}`, legacySectionAliases: inherited },
      { sectionId: id('vocabulario'), title: 'Vocabulario que organiza el mecanismo', role: 'vocabulary', markdown: `${item.vocabulary}${item.chapterId === 'stage-2.2' ? '\n\nUna **rueda** transmite mediante dientes; un **piñón** es una rueda dentada pequeña dentro de una relación; un **árbol** transmite giro o par a lo largo de su cuerpo; un **pivote** es el extremo de apoyo que gira en un cojinete o rubí.' : ''}${item.chapterId === 'stage-2.3' ? '\n\nEl ciclo funcional distingue **bloqueo, desbloqueo, impulso y caída**; cada término describe una condición diferente de contacto o avance.' : ''}${item.chapterId === 'stage-2.4' ? '\n\n**Frecuencia y amplitud** son independientes: la primera cuenta ciclos por unidad de tiempo; la segunda describe el alejamiento respecto al equilibrio.' : ''}`, legacySectionAliases: [] },
      { sectionId: id('modelo-causal'), title: 'Modelo causal paso a paso', role: 'explanation', markdown: item.explanation, legacySectionAliases: [] },
      { sectionId: id('visual'), title: 'Qué mirar en el diagrama', role: 'visual-anatomy', markdown: 'Sigue las flechas, identifica las interfaces y explica qué cambia entre estados. Relaciona el gráfico con la pregunta central mostrada en la cabecera. Su geometría es didáctica: no reproduce escala, fuerza, holgura ni tolerancia de un calibre.', legacySectionAliases: [] },
      { sectionId: id('ejemplo'), title: 'Ejemplo razonado', role: 'worked-example', markdown: item.workedExample, legacySectionAliases: [] },
      { sectionId: id('errores'), title: 'Errores de interpretación y límites de acción', role: 'common-errors', markdown: item.commonErrors, legacySectionAliases: [] },
      { sectionId: id('comprobacion'), title: 'Comprobación personal', role: 'checkpoint', markdown: `Explica con tus palabras la relación central, cambia una condición del modelo y predice el resultado. Señala después una afirmación que el diagrama **no** demuestra. Evidencia K/V/R; no acredita ejecución física.`, legacySectionAliases: [] },
      { sectionId: id('conexion'), title: 'Conexión con el siguiente sistema', role: 'next-connection', markdown: item.nextConnection, legacySectionAliases: [] },
      { sectionId: id('fuentes-limites'), title: 'Fuentes, alcance y preguntas abiertas', role: 'sources', markdown: `${item.sourceScope.replaceAll('source-limited', 'pendiente de fuente')}\n\nNo se trasladan fórmulas, cifras, tolerancias ni procedimientos desde OCR sin verificación visual y aplicabilidad.`, requiredForStudy: false, collapsible: true, legacySectionAliases: [] },
    ] satisfies readonly AcademyStage2SectionSpec[]]
  }),
)

export const ACADEMY_STAGE_2_SECTION_COUNT = Object.values(ACADEMY_STAGE_2_SECTIONS).reduce((sum, sections) => sum + sections.length, 0)
export const ACADEMY_STAGE_2_SECTION_ID_NAMESPACE = `014h-${suffix('lesson.stage2')}`
