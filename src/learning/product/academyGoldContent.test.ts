import { describe, expect, it } from 'vitest'
import { validateAuthoringPack } from '../content/authoringValidation'
import { segmentLessonBlock } from '../academy/lessonSegmentation'
import { assessmentRuleForActivity, INTEGRATED_LEARNING_CONTENT } from './integratedContent'

const academyPacks = INTEGRATED_LEARNING_CONTENT
  .map(({ pack }) => pack)
  .filter(({ manifest }) => manifest.id.startsWith('wplab.horology.'))

function learnerLessonIds(pack: (typeof academyPacks)[number]): Set<string> {
  const modules = new Map(pack.modules.map((module) => [module.id, module]))
  return new Set(pack.routes.filter(({ demo }) => !demo).flatMap((route) =>
    route.moduleIds.flatMap((moduleId) => modules.get(moduleId)?.lessonIds ?? [])))
}

function learnerActivityIds(pack: (typeof academyPacks)[number]): Set<string> {
  const lessons = learnerLessonIds(pack)
  return new Set(pack.lessons.filter(({ id }) => lessons.has(id)).flatMap(({ activityIds }) => activityIds))
}

describe('Academia 0.13 · contratos pedagógicos transversales', () => {
  it('validates all eight real content packs with no editorial diagnostics', () => {
    expect(academyPacks).toHaveLength(8)
    for (const pack of academyPacks) {
      expect(validateAuthoringPack(pack).diagnostics, pack.manifest.id).toEqual([])
      if (pack.manifest.id === 'wplab.horology.watchmaking-encyclopedia') {
        expect(pack.manifest.packageVersion).toBe('1.1.0')
        expect(pack.manifest.minimumAppVersion).toBe('0.13.0')
      } else if (pack.manifest.id === 'wplab.horology.manufacturing-design-validation') {
        expect(pack.manifest.packageVersion).toBe('1.1.0')
        expect(pack.manifest.minimumAppVersion).toBe('0.10.0')
      } else if (pack.manifest.id === 'wplab.horology.advanced-architecture-service') {
        expect(pack.manifest.packageVersion).toBe('1.1.0')
        expect(pack.manifest.minimumAppVersion).toBe('0.10.0')
      } else if (pack.manifest.id === 'wplab.horology.inspection-metrology') {
        expect(pack.manifest.packageVersion).toBe('0.2.0')
        expect(pack.manifest.minimumAppVersion).toBe('0.10.0')
      } else {
        expect(pack.manifest.packageVersion).toBe('0.5.0')
        expect(pack.manifest.minimumAppVersion).toBe('0.10.0')
      }
    }
  })

  it('gives every concept two language layers, observables and misconception links', () => {
    const concepts = academyPacks.flatMap(({ concepts }) => concepts)
    expect(concepts).toHaveLength(509)
    expect(concepts.every((concept) =>
      concept.plainLanguage
      && concept.technicalLanguage
      && concept.whyItMatters
      && concept.observableActions.length >= 2)).toBe(true)
    expect(concepts.filter(({ misconceptionIds }) => misconceptionIds.length > 0).length).toBeGreaterThan(20)
  })

  it('gives all 292 practices causal feedback and a bounded tutor', () => {
    const activities = academyPacks.flatMap(({ activities }) => activities)
    expect(activities).toHaveLength(292)
    expect(activities.every(({ authoring }) =>
      authoring?.feedbackContract
      && authoring.tutorContract?.authority === 'coach-not-assessor'
      && authoring.tutorContract.requiresSourceForTechnicalClaims)).toBe(true)
  })

  it('materializa teoría previa y práctica deliberada en las 289 actividades visibles', () => {
    const lessons = academyPacks.flatMap((pack) => {
      const learnerIds = learnerLessonIds(pack)
      return pack.lessons.filter(({ id }) => learnerIds.has(id))
    })
    const activities = academyPacks.flatMap((pack) => {
      const learnerIds = learnerActivityIds(pack)
      return pack.activities.filter(({ id }) => learnerIds.has(id))
    })
    expect(lessons).toHaveLength(222)
    expect(activities).toHaveLength(289)
    expect(lessons.every(({ authoring }) =>
      authoring?.studyContract?.sequence === 'theory-first'
      && authoring.studyContract.practiceUnlock === 'after-required-reading')).toBe(true)
    expect(activities.every(({ authoring }) => {
      const contract = authoring?.deliberatePractice
      const phases = new Set(contract?.attempts.map(({ phase }) => phase))
      return contract?.independentRetry.required
        && contract.independentRetry.afterHint
        && contract.independentRetry.restoreBeforeRetry
        && phases.has('guided')
        && phases.has('faded')
        && phases.has('independent')
        && phases.has('transfer')
    })).toBe(true)
  })

  it('renderiza todos los roles pedagógicos que cada lección declara obligatorios', () => {
    const missingRoles: Array<{ lessonId: string; missing: string[] }> = []
    for (const pack of academyPacks) {
      const learnerIds = learnerLessonIds(pack)
      const blocks = new Map(pack.blocks.map((block) => [block.id, block]))
      for (const lesson of pack.lessons.filter(({ id }) => learnerIds.has(id))) {
        const renderedRoles = new Set(lesson.blockIds.flatMap((blockId) => {
          const block = blocks.get(blockId)
          return block ? segmentLessonBlock(block.id, block.bodyMarkdown).map(({ role }) => role) : []
        }))
        const missing = (lesson.authoring?.studyContract?.requiredSegmentRoles ?? [])
          .filter((role) => !renderedRoles.has(role))
        if (missing.length) missingRoles.push({ lessonId: lesson.id, missing })
      }
    }

    expect(missingRoles).toEqual([])
  })

  it('mantiene al menos 600 palabras específicas por lección real y elimina la pregunta plantilla', () => {
    for (const pack of academyPacks) {
      const learnerIds = learnerLessonIds(pack)
      for (const lesson of pack.lessons.filter(({ id }) => learnerIds.has(id))) {
        const markdown = lesson.blockIds.map((blockId) =>
          pack.blocks.find(({ id }) => id === blockId)?.bodyMarkdown ?? '').join(' ')
        const words = markdown.replace(/\{\{[^}]+\}\}/g, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0
        expect(words, lesson.id).toBeGreaterThanOrEqual(600)
      }
    }
    const prompts = academyPacks.flatMap(({ scenes }) => scenes.flatMap(({ steps }) => steps.flatMap(({ questions }) =>
      questions.map((question) => question.authoring?.prompt.es ?? question.promptMarkdown))))
    expect(prompts.some((prompt) => /Qué criterio permite justificar correctamente|Relacionar una observación verificable con/i.test(prompt))).toBe(false)
  })

  it('pairs every recognition question with a causal explanation in the same step', () => {
    const steps = academyPacks.flatMap(({ scenes }) => scenes.flatMap(({ steps }) => steps))
    const recognitionSteps = steps.filter(({ questions }) =>
      questions.some(({ responseKind }) => responseKind === 'single-choice'))
    expect(recognitionSteps.length).toBeGreaterThan(30)
    expect(recognitionSteps.every(({ questions }) =>
      questions.some(({ responseKind }) => responseKind === 'structured-response'))).toBe(true)
  })

  it('keeps a unique ten-milestone gold path and specialization designs', () => {
    const routes = academyPacks.flatMap(({ routes }) => routes)
    const foundation = routes.find(({ id }) => id === 'route.horology.orientation')
    expect(foundation?.learningDesign).toMatchObject({
      model: 'gold-standard',
      entryPolicy: 'start-from-zero',
      completionPolicy: 'evidence',
    })
    expect(foundation?.learningDesign?.milestones).toHaveLength(10)
    expect(new Set(foundation?.learningDesign?.milestones.map(({ activityId }) => activityId)).size).toBe(10)
    expect(routes.filter(({ id, demo }) => id !== foundation?.id && id !== 'route.horology.bench-foundations' && !demo).every(({ learningDesign }) =>
      learningDesign?.model === 'specialization'
      && ['diagnostic-optional', 'prerequisite-required'].includes(learningDesign.entryPolicy))).toBe(true)
    expect(routes.find(({ id }) => id === 'route.horology.bench-foundations')?.learningDesign).toMatchObject({
      entryPolicy: 'start-from-zero',
      completionPolicy: 'practice',
      demonstrationActivityIds: [],
    })
  })

  it('no conserva colas editoriales repetidas en las lecciones', () => {
    const markdown = academyPacks.flatMap(({ blocks }) => blocks.map(({ bodyMarkdown }) => bodyMarkdown)).join('\n')
    expect(markdown).not.toContain('## Modelo mental paso a paso')
    expect(markdown).not.toContain('Empieza por el estado inicial')
    expect(markdown).not.toContain('La vista ensamblada representa una función')
    expect(markdown).not.toContain('## Antes de practicar')
  })

  it('limita el reconocimiento formativo a práctica y reserva la demostración para transferencia', () => {
    expect(assessmentRuleForActivity(
      'wplab.horology.quartz-miyota2035',
      '0.5.0',
      'activity.quartz2035.prepare-workbench',
    ).targetState).toBe('practising')
    expect(assessmentRuleForActivity(
      'wplab.horology.manufacturing-design-validation',
      '1.1.0',
      'activity.capstone.validation.watchmaker-review',
    )).toMatchObject({ targetState: 'demonstrated', id: expect.stringMatching(/\.transfer$/) })
  })
})
