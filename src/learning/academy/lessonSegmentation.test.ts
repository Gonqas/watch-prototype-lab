import { describe, expect, it } from 'vitest'
import { segmentLessonBlock } from './lessonSegmentation'

describe('segmentación pedagógica de lecciones', () => {
  it('convierte un artículo largo en pasos controlados por la persona', () => {
    const segments = segmentLessonBlock('block.test', [
      '## Propósito',
      '',
      'Saber qué se aprenderá.',
      '',
      '## Conocimientos previos',
      '',
      'Ninguno.',
      '',
      '## Explicación principal',
      '',
      'Una relación causal.',
      '',
      '## Explicación visual',
      '',
      'Un cambio observable.',
      '',
      '## Ejemplo',
      '',
      'Un caso resuelto.',
      '',
      '## Actividad',
      '',
      'Una comprobación.',
      '',
      '## Resumen',
      '',
      'La idea esencial.',
    ].join('\n'))

    expect(segments.map(({ role }) => role)).toEqual([
      'orient',
      'explain',
      'observe',
      'worked-example',
      'practice',
      'close',
    ])
    expect(segments[0].sectionTitles).toEqual(['Propósito', 'Conocimientos previos'])
    expect(segments[3].markdown).toContain('Un caso resuelto.')
  })

  it('conserva un bloque sin encabezados como un único paso', () => {
    expect(segmentLessonBlock('block.plain', 'Una explicación breve.')).toHaveLength(1)
  })

  it('divide un apartado extenso por párrafos sin mezclar de nuevo sus fragmentos', () => {
    const paragraph = Array.from({ length: 120 }, (_, index) => `palabra${index}`).join(' ')
    const segments = segmentLessonBlock(
      'block.long',
      `## Explicación principal\n\n${paragraph}\n\n${paragraph}\n\n${paragraph}`,
    )

    expect(segments).toHaveLength(3)
    expect(segments.every(({ role }) => role === 'explain')).toBe(true)
    expect(segments[1].markdown).toContain('continuación 2')
  })

  it('reconoce la estructura editorial de las lecciones enciclopédicas', () => {
    const segments = segmentLessonBlock('block.encyclopedia', [
      '## Problema que resuelve',
      '',
      'Una pregunta que sitúa la unidad.',
      '',
      '## Vocabulario operativo',
      '',
      'Tres términos definidos en contexto.',
      '',
      '## Cadena causal o secuencia de trabajo',
      '',
      'Una explicación específica.',
      '',
      '## Caso razonado',
      '',
      'Una resolución completa.',
      '',
      '## Fallos y modelos mentales que deben detectarse',
      '',
      'Un error explicado.',
      '',
      '## Práctica deliberada y transferencia',
      '',
      'Una comprobación próxima.',
      '',
      '## Cierre',
      '',
      'La idea que se conserva.',
    ].join('\n'))

    expect(segments.map(({ role }) => role)).toEqual([
      'orient',
      'pretrain',
      'explain',
      'worked-example',
      'practice',
      'close',
    ])
    expect(segments[3].sectionTitles).toEqual([
      'Caso razonado',
      'Fallos y modelos mentales que deben detectarse',
    ])
  })

  it('separa fuentes, alcance y límites de la secuencia didáctica sin perder su texto', () => {
    const segments = segmentLessonBlock('block.reference', [
      '## Explicación principal',
      '',
      'La relación causal que debe estudiarse.',
      '',
      '## Fuentes y alcance',
      '',
      'Fuente primaria y alcance declarado.',
      '',
      '## Limitaciones',
      '',
      'Este modelo no demuestra desgaste real.',
      '',
      '## Resumen',
      '',
      'La idea que se conserva.',
    ].join('\n'))

    expect(segments.map(({ role }) => role)).toEqual(['explain', 'reference', 'close'])
    expect(segments[1].sectionTitles).toEqual(['Fuentes y alcance', 'Limitaciones'])
    expect(segments[1].markdown).toContain('Fuente primaria y alcance declarado.')
    expect(segments[1].markdown).toContain('Este modelo no demuestra desgaste real.')
  })
})
