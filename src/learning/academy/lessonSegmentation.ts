export type LessonSegmentRole =
  | 'orient'
  | 'pretrain'
  | 'explain'
  | 'observe'
  | 'worked-example'
  | 'practice'
  | 'close'
  | 'reference'

export interface AcademyLessonSegment {
  id: string
  blockId: string
  role: LessonSegmentRole
  title: string
  markdown: string
  sectionTitles: string[]
}

interface MarkdownSection {
  title: string
  markdown: string
}

const MAXIMUM_SEGMENT_WORDS = 210

const roleLabels: Record<LessonSegmentRole, string> = {
  orient: 'Antes de empezar',
  pretrain: 'Palabras y piezas clave',
  explain: 'Idea central',
  observe: 'Mira qué cambia',
  'worked-example': 'Ejemplo resuelto',
  practice: 'Comprueba tu idea',
  close: 'Qué debes recordar',
  reference: 'Fiabilidad y fuentes',
}

function normalizeHeading(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim()
}

function roleForHeading(title: string): LessonSegmentRole {
  const normalized = normalizeHeading(title)
  if (/^(fuentes|frontera de fuentes|alcance|limitaciones?|limites?|fidelidad|procedencia|ficha tecnica|datos tecnicos|documentacion y fuentes|referencias)(\b|\s)/.test(normalized)) return 'reference'
  if (/proposito|antes de empezar|conocimientos previos|objetivos observables|objetivos|punto de partida|problema (que resuelve|y contexto)|que vas a (entender|aprender)|pregunta de (diseno|trabajo|estudio|funcionamiento)|resultado buscado|sintoma, observacion|caracteristica que se quiere fabricar|decision de diseno y necesidad/.test(normalized)) return 'orient'
  if (/vocabulario|terminos clave|piezas e interfaces|piezas (clave|e ideas clave)|antes de observar|nombres clave|fundamentos minimos/.test(normalized)) return 'pretrain'
  if (/explicacion visual|observa|que veras|lectura del modelo|demostracion|imagen anotada|modelo anotado/.test(normalized)) return 'observe'
  if (/ejemplo|errores habituales|fallos y modelos mentales|idea equivocada|caso razonado|caso resuelto|caso trabajado|comparacion (historica guiada|de alternativas)|mecanismo aplicado a un caso|anacronismos|confusiones mecanicas|errores de proceso|sesgos y conclusiones|decision de fabricacion razonada|defectos, causas|decisiones fragiles/.test(normalized)) return 'worked-example'
  // El cierre se resuelve antes que la práctica porque «Comprueba antes de
  // continuar» contiene también un verbo de comprobación.
  if (/resumen|siguiente conexion|antes de continuar|para continuar|recuerda|cierre|que debes recordar/.test(normalized)) return 'close'
  if (/actividad|practica|feedback|correccion y ayuda|evidencia|criterio de exito|comprobacion|comprueba|ejercicio de transferencia|transferencia/.test(normalized)) return 'practice'
  return 'explain'
}

function markdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split(/\r?\n/)
  const sections: MarkdownSection[] = []
  let title = 'Introducción'
  let body: string[] = []
  const flush = () => {
    const content = body.join('\n').trim()
    if (content) sections.push({
      title,
      markdown: title === 'Introducción' ? content : `## ${title}\n\n${content}`,
    })
    body = []
  }
  for (const line of lines) {
    if (line.startsWith('## ')) {
      flush()
      title = line.slice(3).trim()
    } else {
      body.push(line)
    }
  }
  flush()
  return sections
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function splitLongSection(section: MarkdownSection): MarkdownSection[] {
  if (wordCount(section.markdown) <= MAXIMUM_SEGMENT_WORDS) return [section]
  const body = section.markdown.replace(/^## [^\n]+\n+/, '')
  const paragraphs = body.split(/\n{2,}/).map((value) => value.trim()).filter(Boolean)
  if (paragraphs.length < 2) return [section]
  const chunks: string[][] = []
  for (const paragraph of paragraphs) {
    const current = chunks.at(-1)
    if (!current || (wordCount(current.join('\n\n')) + wordCount(paragraph)) > MAXIMUM_SEGMENT_WORDS) {
      chunks.push([paragraph])
    } else {
      current.push(paragraph)
    }
  }
  return chunks.map((paragraphChunk, index) => {
    const title = index === 0 ? section.title : `${section.title} — continuación ${index + 1}`
    return {
      title,
      markdown: `## ${title}\n\n${paragraphChunk.join('\n\n')}`,
    }
  })
}

export function segmentLessonBlock(
  blockId: string,
  markdown: string,
): AcademyLessonSegment[] {
  const sections = markdownSections(markdown).flatMap(splitLongSection)
  if (sections.length === 0) return []
  const grouped: Array<{ role: LessonSegmentRole; sections: MarkdownSection[] }> = []
  for (const section of sections) {
    const role = section.title === 'Introducción' ? 'orient' : roleForHeading(section.title)
    const current = grouped.at(-1)
    const combinedWords = (current?.sections.reduce((total, value) => total + wordCount(value.markdown), 0) ?? 0)
      + wordCount(section.markdown)
    if (current?.role === role && combinedWords <= MAXIMUM_SEGMENT_WORDS) current.sections.push(section)
    else grouped.push({ role, sections: [section] })
  }
  const roleCounts = new Map<LessonSegmentRole, number>()
  return grouped.map(({ role, sections: values }) => {
    const occurrence = (roleCounts.get(role) ?? 0) + 1
    roleCounts.set(role, occurrence)
    return {
      id: `${blockId}.segment.${role}.${occurrence}`,
      blockId,
      role,
      title: occurrence === 1 ? roleLabels[role] : `${roleLabels[role]} · ${occurrence}`,
      markdown: values.map(({ markdown: value }) => value).join('\n\n'),
      sectionTitles: values.map(({ title: value }) => value),
    }
  })
}
