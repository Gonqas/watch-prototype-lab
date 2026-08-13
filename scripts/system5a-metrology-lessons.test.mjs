import { describe, expect, it } from 'vitest'
import { ActivityInteractionContractSchema } from '../src/learning/content/authoring.ts'
import { SceneQuestionSchema } from '../src/learning/scenes.ts'
import {
  buildSystem5aInteraction,
  buildSystem5aLessonBody,
  buildSystem5aSceneQuestion,
  SYSTEM5A_METROLOGY_LESSONS,
} from './system5a-metrology-lessons.mjs'

const modules = [
  ['observe-before-measuring', 'Observar antes de medir', ['observación', 'hipótesis', 'mensurando']],
  ['light-magnification-posture', 'Luz, aumento y postura', ['iluminación', 'aumento', 'postura']],
  ['units-scale-resolution', 'Unidades, escala y resolución', ['unidad', 'resolución', 'redondeo']],
  ['precision-accuracy-uncertainty', 'Precisión, exactitud, repetibilidad e incertidumbre', ['precisión', 'exactitud', 'incertidumbre']],
  ['instruments', 'Instrumentos', ['rango', 'contacto', 'accesibilidad']],
  ['verification-calibration', 'Verificación y calibración', ['verificación', 'calibración', 'trazabilidad']],
  ['physical-specimen', 'Registrar una unidad física', ['espécimen', 'procedencia', 'alcance']],
  ['technical-photography', 'Fotografía técnica', ['original inmutable', 'referencia de escala', 'metadatos']],
  ['image-measurement', 'Medir sobre una fotografía', ['píxeles', 'perspectiva', 'distorsión']],
  ['physical-measurement', 'Medir piezas físicas', ['datum', 'alineación', 'serie de medición']],
  ['inspection-findings', 'Inspeccionar desgaste y daños', ['hallazgo', 'hipótesis diagnóstica', 'refutación']],
  ['compare-data', 'Comparar datos', ['nominal', 'comparabilidad', 'tolerancia']],
  ['improve-virtual-model', 'Mejorar un modelo virtual', ['propuesta de corrección', 'variante', 'reversibilidad']],
  ['final-project', 'Proyecto final', ['dossier', 'revisión independiente', 'criterio de parada']],
]

const activities = [
  'Preparar una inspección', 'Separar observación e hipótesis',
  'Elegir iluminación', 'Elegir aumento',
  'Diferenciar resolución y precisión', 'Redondear sin inventar información',
  'Repetir medición', 'Declarar incertidumbre',
  'Seleccionar instrumento', 'Detectar paralaje',
  'Verificar cero', 'Interpretar una verificación',
  'Registrar espécimen', 'Contar dientes',
  'Importar fotografía', 'Clasificar fotografía',
  'Calibrar escala', 'Medir distancia',
  'Medir diámetro', 'Medir distancia entre centros',
  'Identificar lectura atípica', 'Registrar hallazgo',
  'Comparar nominal y medido', 'Determinar validez de comparación',
  'Adoptar un valor', 'Crear propuesta',
  'Completar dossier', 'Defender el proyecto final',
]

function idPart(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

describe('catálogo editorial de metrología del Sistema 5A', () => {
  it('cubre exactamente los catorce módulos sin alterar sus slugs ni su orden', () => {
    expect(Object.keys(SYSTEM5A_METROLOGY_LESSONS)).toEqual(modules.map(([slug]) => slug))
  })

  it('genera teoría densa, específica y beginner-friendly para cada módulo', () => {
    const bodies = modules.map(([slug, title, requiredTerms], order) => {
      const body = buildSystem5aLessonBody(slug, title, 'aplicar el criterio con trazabilidad', order)
      for (const heading of [
        '## Pregunta guía',
        '## Conceptos y definiciones',
        '## Explicación paso a paso',
        '## Ejemplo trabajado concreto',
        '## Errores frecuentes y por qué fallan',
        '## Práctica deliberada',
        '## Transferencia',
        '## Fuentes y límites',
      ]) expect(body).toContain(heading)
      expect(body.length).toBeGreaterThan(3_800)
      for (const term of requiredTerms) expect(body.toLocaleLowerCase('es')).toContain(term)
      expect(body).toMatch(/VIM|GUM|NIST/)
      expect(body).toContain('no son dimensiones, tolerancias ni criterios de aceptación de un fabricante')
      return body
    })

    expect(new Set(bodies).size).toBe(modules.length)
  })

  it('conserva en cada ficha pregunta, definiciones, causalidad, ejemplo, errores, práctica y transferencia', () => {
    for (const content of Object.values(SYSTEM5A_METROLOGY_LESSONS)) {
      expect(content.question.length).toBeGreaterThan(45)
      expect(content.definitions.length).toBeGreaterThanOrEqual(4)
      expect(content.definitions.every(([term, definition]) =>
        term.length > 2 && definition.length > 80)).toBe(true)
      expect(content.explanation).toHaveLength(3)
      expect(content.explanation.every((paragraph) => paragraph.length > 180)).toBe(true)
      expect(content.workedExample.steps).toHaveLength(5)
      expect(content.errors).toHaveLength(4)
      expect(content.practice.length).toBeGreaterThan(100)
      expect(content.transfer.length).toBeGreaterThan(100)
      expect(content.sources.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('falla de forma explícita si el generador solicita un módulo sin contenido', () => {
    expect(() => buildSystem5aLessonBody('missing-module', 'Módulo ausente', 'aprender', 0))
      .toThrow('Falta contenido metrológico específico para missing-module.')
  })

  it('deriva veintiocho prácticas específicas sin alternativas genéricas ni módulo siete', () => {
    const prompts = []
    const guidedAlternatives = []

    for (const [index, title] of activities.entries()) {
      const moduleIndex = Math.floor(index / 2)
      const slug = modules[moduleIndex][0]
      const content = SYSTEM5A_METROLOGY_LESSONS[slug]
      const activityId = `activity.metrology.${idPart(title)}`
      const interaction = buildSystem5aInteraction(index, activityId, slug)
      const { question, success } = buildSystem5aSceneQuestion(index, activityId, title, slug)

      expect(() => ActivityInteractionContractSchema.parse(interaction)).not.toThrow()
      expect(() => SceneQuestionSchema.parse(question)).not.toThrow()
      expect(question.id).toBe(`question.${idPart(activityId)}`)
      expect(success.questionId).toBe(question.id)
      expect(question.responseKind).toBe('structured-response')
      expect(question.promptMarkdown).toContain(content.question)
      prompts.push(question.promptMarkdown)

      if (index % 2 === 0) {
        const labels = question.options.map(({ label }) => label)
        expect(labels).toEqual([
          content.workedExample.conclusion,
          content.errors[0],
          content.errors[1],
        ])
        expect(question.structuredFields.map(({ id }) => id)).toEqual([
          `field.${idPart(activityId)}.decision`,
          `field.${idPart(activityId)}.justification`,
          `field.${idPart(activityId)}.confidence`,
        ])
        guidedAlternatives.push(labels.join('|'))
      } else {
        expect(question.options).toBeUndefined()
        expect(question.promptMarkdown).toContain(content.transfer)
        expect(question.structuredFields.map(({ id }) => id)).toEqual([
          `field.${idPart(activityId)}.observation`,
          `field.${idPart(activityId)}.method`,
          `field.${idPart(activityId)}.limitation`,
          `field.${idPart(activityId)}.confidence`,
        ])
      }
    }

    expect(prompts).toHaveLength(28)
    expect(new Set(prompts).size).toBe(28)
    expect(new Set(guidedAlternatives).size).toBe(14)
    expect(prompts.join('\n')).not.toContain('Método y alcance explícitos')
    expect(prompts.join('\n')).not.toContain('Más decimales')
  })
})
