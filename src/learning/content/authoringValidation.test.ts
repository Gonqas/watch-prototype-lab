import { describe, expect, it } from 'vitest'
import { ProjectEntityIndex } from '../canonical'
import { projectV5ToCanonical } from '../adapters/projectV5'
import { createMechanicalProject } from '../../vnext/presets'
import { createIntegratedAuthoringExamplePack, createIntegratedAuthoringExamplePackageBytes } from '../product/authoringExample'
import { AUTHORING_EXAMPLE_PRODUCT_INDEX } from '../product/authoringExample'
import { createIntegratedHorologyLearningPack } from '../product/horologyContent'
import { LearningPackageLoader } from '../runtime/packageLoader'
import { SceneCompiler } from '../runtime/compiler'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES } from '../runtime/capabilities'
import { memoryBridgeCapabilities } from '../runtime/bridge'
import { ActivityPedagogicalContractSchema } from './authoring'
import { validateAuthoringPack, visualNeedsAsMarkdown } from './authoringValidation'

describe('kit de autoría declarativa', () => {
  it('valida, carga y compila el ejemplo con los contratos reales', async () => {
    const pack = createIntegratedAuthoringExamplePack()
    const report = validateAuthoringPack(pack)
    const loaded = await new LearningPackageLoader({ applicationVersion: '0.4.1' })
      .loadIntegrated(createIntegratedAuthoringExamplePackageBytes())

    expect(report.valid).toBe(true)
    expect(report.diagnostics.filter(({ severity }) => severity === 'error')).toEqual([])
    expect(report.visualNeeds).toHaveLength(2)
    expect(AUTHORING_EXAMPLE_PRODUCT_INDEX.routes[0]?.id).toBe('route.authoring-first-package')
    expect(loaded.success).toBe(true)
    if (!loaded.success) return
    const scene = loaded.value.pack.scenes[0]
    const compiled = new SceneCompiler().compile(
      loaded.value,
      scene.id,
      new ProjectEntityIndex(projectV5ToCanonical(createMechanicalProject())),
      new CapabilityResolver([...HEADLESS_RUNTIME_CAPABILITIES, ...memoryBridgeCapabilities()]),
    )
    expect(compiled.success).toBe(true)
    expect(visualNeedsAsMarkdown(pack)).toContain('visual.authoring.selector-scene')
  })

  it('detecta referencias rotas, términos ausentes y afirmaciones oficiales sin fuente oficial', () => {
    const brokenReference = createIntegratedAuthoringExamplePack()
    brokenReference.lessons[0].blockIds = ['explanation.missing']
    expect(validateAuthoringPack(brokenReference).diagnostics.some(({ code }) =>
      code === 'AUTHORING-MISSING-REFERENCE')).toBe(true)

    const missingTerm = createIntegratedAuthoringExamplePack()
    missingTerm.blocks[0].bodyMarkdown += ' {{term:term.authoring.missing}}'
    expect(validateAuthoringPack(missingTerm).diagnostics.some(({ code }) =>
      code === 'AUTHORING-TERM-MISSING')).toBe(true)

    const unsupportedOfficialClaim = createIntegratedAuthoringExamplePack()
    unsupportedOfficialClaim.blocks[0].claims[0].classification = 'official'
    expect(validateAuthoringPack(unsupportedOfficialClaim).diagnostics.some(({ code }) =>
      code === 'AUTHORING-OFFICIAL-CLAIM-WITHOUT-OFFICIAL-SOURCE')).toBe(true)
  })

  it('rechaza texto editorial genérico repetido', () => {
    const pack = createIntegratedAuthoringExamplePack()
    pack.blocks[0].bodyMarkdown += '\n\n## Modelo mental paso a paso\n\nEmpieza por el estado inicial.'
    expect(validateAuthoringPack(pack).diagnostics).toContainEqual(expect.objectContaining({
      code: 'AUTHORING-EDITORIAL-BOILERPLATE',
      severity: 'error',
      path: pack.blocks[0].id,
    }))
  })

  it('detecta capacidades, reduced motion, evaluación y recursos pendientes', () => {
    const capability = createIntegratedAuthoringExamplePack()
    capability.manifest.requiredCapabilities = capability.manifest.requiredCapabilities.filter((value) => !value.startsWith('viewport.camera@'))
    capability.scenes[0].requiredCapabilities = capability.scenes[0].requiredCapabilities.filter((value) =>
      typeof value !== 'string' || !value.startsWith('viewport.camera@'))
    expect(validateAuthoringPack(capability).diagnostics.some(({ code }) =>
      code === 'AUTHORING-CAPABILITY-UNDECLARED')).toBe(true)

    const motion = createIntegratedAuthoringExamplePack()
    motion.lessons[0].authoring!.visualStrategy = undefined
    expect(validateAuthoringPack(motion).diagnostics.some(({ code }) =>
      code === 'AUTHORING-REDUCED-MOTION-MISSING')).toBe(true)

    const evaluation = createIntegratedAuthoringExamplePack()
    evaluation.rubrics[0].assessmentRule = undefined
    expect(validateAuthoringPack(evaluation).diagnostics.some(({ code }) =>
      code === 'AUTHORING-COMPETENCY-NOT-EVALUABLE')).toBe(true)

    const pending = createIntegratedAuthoringExamplePack()
    pending.visualResources[0].status = 'planned'
    const pendingReport = validateAuthoringPack(pending)
    expect(pendingReport.valid).toBe(true)
    expect(pendingReport.diagnostics.some(({ code, severity }) =>
      code === 'AUTHORING-VISUAL-RESOURCE-PENDING' && severity === 'warning')).toBe(true)
  })

  it('detecta incoherencias semánticas entre pregunta, subsistema, pistas y respuesta', () => {
    const coherent = createIntegratedHorologyLearningPack()
    const coherentCodes = validateAuthoringPack(coherent).diagnostics.map(({ code }) => code)
    expect(coherentCodes).not.toContain('AUTHORING-QUESTION-SUBSYSTEM-MISMATCH')
    expect(coherentCodes).not.toContain('AUTHORING-QUESTION-HINT-MISMATCH')
    expect(coherentCodes).not.toContain('AUTHORING-QUESTION-ANSWER-MISMATCH')

    const wrongSubsystem = createIntegratedHorologyLearningPack()
    const activity = wrongSubsystem.activities.find(({ id }) =>
      id === 'activity.horology.classify-subsystems')!
    activity.authoring!.subsystem = 'case'
    expect(validateAuthoringPack(wrongSubsystem).diagnostics.some(({ code }) =>
      code === 'AUTHORING-QUESTION-SUBSYSTEM-MISMATCH')).toBe(true)

    const wrongHint = createIntegratedHorologyLearningPack()
    const question = wrongHint.scenes
      .find(({ id }) => id === 'scene.horology.activity.classify-subsystems')!
      .steps.flatMap(({ questions }) => questions)
      .find(({ id }) => id === 'question.horology.activity.classify-subsystems')!
    question.hints![0].content.es = 'Busca la caja y la estructura del reloj.'
    expect(validateAuthoringPack(wrongHint).diagnostics.some(({ code }) =>
      code === 'AUTHORING-QUESTION-HINT-MISMATCH')).toBe(true)

    const wrongAnswer = createIntegratedHorologyLearningPack()
    const wrongAnswerScene = wrongAnswer.scenes.find(({ id }) =>
      id === 'scene.horology.activity.classify-subsystems')!
    const answerStep = wrongAnswerScene.steps.find(({ id }) =>
      id === 'step.horology.activity.classify-subsystems.question')!
    const answerCondition = answerStep.success.find(({ condition }) => condition === 'answer')!
    if (answerCondition.condition === 'answer') answerCondition.expectedOptionIds = ['option.indication']
    expect(validateAuthoringPack(wrongAnswer).diagnostics.some(({ code }) =>
      code === 'AUTHORING-QUESTION-ANSWER-MISMATCH')).toBe(true)
  })

  it('rechaza ciclos en el grafo de conocimientos', () => {
    const cyclic = createIntegratedAuthoringExamplePack()
    const concept = cyclic.concepts[0]
    concept.prerequisiteIds = [concept.id]

    const report = validateAuthoringPack(cyclic)

    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: 'AUTHORING-CONCEPT-PREREQUISITE-CYCLE',
      severity: 'error',
      path: concept.id,
    }))
  })

  it('reconoce como conectado un concepto que recibe una relación semántica', () => {
    const pack = createIntegratedAuthoringExamplePack()
    pack.manifest.id = 'wplab.horology.connectivity-test'
    const source = pack.concepts[0]
    const inboundOnly = {
      ...structuredClone(source),
      id: 'concept.authoring.inbound-only',
      prerequisiteIds: [],
      recommendedPrerequisiteIds: [],
      relatedIds: [],
      transferTargetIds: [],
    }
    source.relatedIds = [inboundOnly.id]
    pack.concepts.push(inboundOnly)
    pack.manifest.entries.concepts.push({
      id: inboundOnly.id,
      path: 'content/concepts/inbound-only.json',
    })

    expect(validateAuthoringPack(pack).diagnostics).not.toContainEqual(expect.objectContaining({
      code: 'AUTHORING-CONCEPT-ISOLATED',
      path: inboundOnly.id,
    }))
  })

  it('impide evaluar un concepto al introducirlo y exigir conocimiento no enseñado', () => {
    const invalidContract = ActivityPedagogicalContractSchema.safeParse({
      purpose: 'guided-practice',
      assessmentIntent: 'formative',
      requiresConceptIds: [],
      introducesConceptIds: ['concept.authoring.traceability'],
      demonstratesConceptIds: [],
      practicesConceptIds: ['concept.authoring.traceability'],
      assessesConceptIds: ['concept.authoring.traceability'],
      evidenceLevel: 'recognition',
      supportLevel: 'guided',
      physicalBoundary: {
        es: 'La simulación no certifica una destreza manual.',
        en: 'The simulation does not certify a manual skill.',
      },
    })
    expect(invalidContract.success).toBe(false)
    if (!invalidContract.success) {
      expect(invalidContract.error.issues).toContainEqual(expect.objectContaining({
        path: ['assessesConceptIds'],
      }))
    }

    const assessedBeforeTeaching = createIntegratedAuthoringExamplePack()
    const conceptId = 'concept.authoring.not-yet-taught'
    assessedBeforeTeaching.concepts.push({
      ...structuredClone(assessedBeforeTeaching.concepts[0]),
      id: conceptId,
      title: {
        es: 'Concepto todavía no enseñado',
        en: 'Concept not taught yet',
      },
    })
    assessedBeforeTeaching.manifest.entries.concepts.push({
      id: conceptId,
      path: 'content/concepts/not-yet-taught.json',
    })
    assessedBeforeTeaching.activities[0].authoring!.pedagogicalContract = {
      purpose: 'guided-practice',
      assessmentIntent: 'formative',
      requiresConceptIds: [conceptId],
      introducesConceptIds: [],
      demonstratesConceptIds: [],
      practicesConceptIds: [conceptId],
      assessesConceptIds: [conceptId],
      evidenceLevel: 'recognition',
      supportLevel: 'guided',
      physicalBoundary: {
        es: 'La simulación no certifica una destreza manual.',
        en: 'The simulation does not certify a manual skill.',
      },
    }

    expect(validateAuthoringPack(assessedBeforeTeaching).diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'AUTHORING-ACTIVITY-REQUIRES-UNAVAILABLE-CONCEPT',
        path: assessedBeforeTeaching.activities[0].id,
      }),
    )
  })

  it('no acepta una respuesta única como demostración de dominio sin repetición independiente', () => {
    const pack = createIntegratedAuthoringExamplePack()
    const activity = pack.activities[0]
    const conceptId = pack.concepts[0].id
    activity.authoring!.interactionContract = {
      responseModel: 'single-choice',
      orderedItems: [],
      expectedOrderIds: [],
      structuredFields: [],
      hints: [],
      evidencePolicy: {
        eventType: 'answer-submitted',
        recordsAnswerPayload: true,
        deterministicComponents: [],
        requiresHumanReview: false,
        accessibilityAdaptationsCountAsHints: false,
      },
    }
    activity.authoring!.pedagogicalContract = {
      purpose: 'mastery-check',
      assessmentIntent: 'demonstration',
      requiresConceptIds: [conceptId],
      introducesConceptIds: [],
      demonstratesConceptIds: [conceptId],
      practicesConceptIds: [],
      assessesConceptIds: [conceptId],
      evidenceLevel: 'independent-simulation',
      supportLevel: 'independent',
      physicalBoundary: {
        es: 'La simulación no certifica una destreza manual.',
        en: 'The simulation does not certify a manual skill.',
      },
    }

    expect(validateAuthoringPack(pack).diagnostics).toContainEqual(expect.objectContaining({
      code: 'AUTHORING-SINGLE-CHOICE-CANNOT-DEMONSTRATE-ALONE',
      path: activity.id,
    }))
  })

  it('detecta evidencia exigida por una rúbrica que ninguna regla puede producir', () => {
    const pack = createIntegratedAuthoringExamplePack()
    const rubric = pack.rubrics[0]
    rubric.assessmentRule!.condition = {
      op: 'exists',
      filter: {
        evidenceType: 'written-response',
        status: 'active',
        minimumConfidence: 1,
      },
    }

    expect(validateAuthoringPack(pack).diagnostics).toContainEqual(expect.objectContaining({
      code: 'AUTHORING-RUBRIC-EVIDENCE-TYPE-UNREACHABLE',
      path: rubric.id,
    }))
  })
})
