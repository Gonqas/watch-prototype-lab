import type { EducationalScene } from '../scenes'
import type { LoadedLearningPackage } from './packageLoader'
import type { LearningOverlayState, LearningOverlayVisual, LearningSpatialAnchor } from './overlay'
import { EMPTY_LEARNING_OVERLAY, normalizeLearningOverlay } from './overlay'
import type { ProjectEntityIndex } from '../canonical'
import type { ViewportEntitySupport } from './bridge'
import { stableFingerprint } from '../identity'
import { CapabilityResolver, parseCapabilityRequirement, type CapabilityResolution } from './capabilities'
import { diagnostic, hasBlockingDiagnostics, type RuntimeDiagnostic } from './diagnostics'
import type { ExecutableQuestion } from './interactions'
import {
  SemanticSelectorResolver,
  type SelectorCardinality,
  type SelectorReference,
  type SemanticSelector,
  type SemanticSelectorResolution,
} from './selectors'

export type CompiledSceneOperation = EducationalScene['timeline'][number]['operation']

export interface CompiledTimelineAction {
  id: string
  atMs: number
  durationMs: number
  operation: CompiledSceneOperation
  entityIds: string[]
  value?: EducationalScene['timeline'][number]['value']
  essential: boolean
  waitFor: 'none' | 'interaction' | 'condition'
}

export interface CompiledSceneStep {
  id: string
  index: number
  instructionMarkdown: string
  questionIds: string[]
  questions: ExecutableQuestion[]
  successCriteria: CompiledStepSuccessCriterion[]
  hintIds: string[]
  selectorResolutions: SemanticSelectorResolution[]
}

export type CompiledStepSuccessCriterion =
  | { id: string; condition: 'selected'; entityIds: string[] }
  | { id: string; condition: 'answer'; questionId: string; expectedOptionIds: string[] }
  | {
    id: string
    condition: 'structured-answer'
    questionId: string
    requiredFieldIds: string[]
    pendingHumanReview: boolean
  }
  | { id: string; condition: 'step-confirmed' }

export interface SceneExecutionPlan {
  planVersion: 1
  id: string
  packageId: string
  packageVersion: string
  packageFingerprint: string
  sceneId: string
  sceneVersion: string
  assemblyId: string
  initialOverlay: LearningOverlayState
  timeline: CompiledTimelineAction[]
  steps: CompiledSceneStep[]
  durationMs: number
  reducedMotion: boolean
  requiresPresentationSnapshot: true
  capabilityResolutions: CapabilityResolution[]
  selectorResolutions: SemanticSelectorResolution[]
  diagnostics: RuntimeDiagnostic[]
  accessibility: {
    description: string
    logicalStepOrder: string[]
    unlimitedTimeByDefault: true
    nonDragCommandsAvailable: true
  }
}

export type SceneCompilationResult =
  | { success: true; plan: SceneExecutionPlan; diagnostics: RuntimeDiagnostic[] }
  | { success: false; diagnostics: RuntimeDiagnostic[] }

export interface SceneCompilerOptions {
  reducedMotion?: boolean
  entitySupport?: (entityIds: readonly string[]) => ViewportEntitySupport
}

type SceneSelector = EducationalScene['state']['selected'][number]

function normalizeSelectorReference(value: SceneSelector, defaultCardinality: SelectorCardinality = 'one-or-more'): SelectorReference {
  if ('cardinality' in value) return value
  return { selector: value as SemanticSelector, cardinality: defaultCardinality }
}

function idsFromResolution(resolution: SemanticSelectorResolution): string[] {
  return [...new Set(resolution.entities.flatMap(({ relatedInstanceIds, id, kind }) =>
    relatedInstanceIds.length > 0 ? relatedInstanceIds : kind === 'part-instance' ? [id] : []))].sort()
}

type DeclarativeCapabilityRequirement = EducationalScene['requiredCapabilities'][number]

export function inferSceneRequiredCapabilities(scene: EducationalScene): DeclarativeCapabilityRequirement[] {
  const required = new Map<string, DeclarativeCapabilityRequirement>()
  const add = (value: DeclarativeCapabilityRequirement) => {
    const id = parseCapabilityRequirement(value).id
    if (!required.has(id)) required.set(id, value)
  }
  scene.requiredCapabilities.forEach(add)
  const requireForSelectors = (values: SceneSelector[]) => { if (values.length > 0) add('canonical-selectors-v1') }
  requireForSelectors(scene.state.selected)
  requireForSelectors(scene.state.visible)
  requireForSelectors(scene.state.hidden)
  requireForSelectors(scene.state.isolated)
  if (scene.state.selected.length > 0) add('viewport.selection')
  if (scene.state.visible.length > 0 || scene.state.hidden.length > 0) add('viewport.visibility')
  if (scene.state.isolated.length > 0) add('viewport.isolation')
  if (scene.state.explode > 0) add('viewport.explode')
  if (scene.state.section?.enabled) add('viewport.section')
  if (scene.camera) {
    add('viewport.camera')
    if (scene.camera.projection === 'orthographic') add('viewport.camera.orthographic')
  }
  if (scene.state.transparent.length > 0) add('viewport.transparency')
  if (scene.state.highlighted.length > 0) add('viewport.highlight')
  for (const overlay of scene.overlays) {
    if (overlay.kind === 'arrow' || overlay.kind === 'rotation' || overlay.kind === 'energy-path') add('viewport.overlay.arrows')
    if (overlay.kind === 'label' || overlay.kind === 'text') add('viewport.overlay.labels')
    if (overlay.kind === 'highlight') add('viewport.highlight')
  }
  const operationCapability: Partial<Record<CompiledSceneOperation, string>> = {
    show: 'viewport.visibility', hide: 'viewport.visibility', select: 'viewport.selection', isolate: 'viewport.isolation',
    explode: 'viewport.explode', highlight: 'viewport.highlight', transparency: 'viewport.transparency',
    camera: 'viewport.camera', section: 'viewport.section', overlay: 'viewport.overlay.labels',
    rotate: 'viewport.entity-transform', translate: 'viewport.entity-transform', annotate: 'viewport.overlay.labels',
  }
  for (const action of scene.timeline) {
    const capability = operationCapability[action.operation]
    if (capability) add(capability)
  }
  add('learning.scene-runtime')
  return [...required.values()].sort((left, right) => parseCapabilityRequirement(left).id.localeCompare(parseCapabilityRequirement(right).id))
}

function defaultDuration(operation: CompiledSceneOperation): number {
  return ['explode', 'rotate', 'translate', 'transparency', 'camera', 'section'].includes(operation) ? 400 : 0
}

export class SceneCompiler {
  compile(
    loadedPackage: LoadedLearningPackage,
    sceneId: string,
    index: ProjectEntityIndex,
    capabilities: CapabilityResolver,
    options: SceneCompilerOptions = {},
  ): SceneCompilationResult {
    const diagnostics: RuntimeDiagnostic[] = []
    const scene = loadedPackage.pack.scenes.find(({ id }) => id === sceneId)
    if (!scene) {
      return { success: false, diagnostics: [diagnostic({
        code: 'LR-SCENE-NOT-FOUND', category: 'content-error', message: `No existe la escena ${sceneId}.`, source: 'compiler',
        packageId: loadedPackage.pack.manifest.id, packageVersion: loadedPackage.pack.manifest.packageVersion, sceneId,
        suggestedRecovery: 'Corregir la referencia de la actividad.', blocking: true, retrySafe: true,
      })] }
    }
    const requirements = [...loadedPackage.pack.manifest.requiredCapabilities, ...inferSceneRequiredCapabilities(scene)]
      .map(parseCapabilityRequirement)
    const capabilityResolutions = capabilities.resolveAll(requirements)
    diagnostics.push(...capabilityResolutions.flatMap(({ diagnostic: issue }) => issue ? [issue] : []))
    const selectorResolver = new SemanticSelectorResolver(index)
    const selectorResolutions: SemanticSelectorResolution[] = []
    const resolveOne = (value: SceneSelector, defaultCardinality: SelectorCardinality = 'one-or-more') => {
      const reference = normalizeSelectorReference(value, defaultCardinality)
      const resolution = selectorResolver.resolve(reference.selector, reference.cardinality)
      selectorResolutions.push(resolution)
      diagnostics.push(...resolution.diagnostics)
      return resolution
    }
    const resolveMany = (values: SceneSelector[]) => [...new Set(values.flatMap((value) => idsFromResolution(resolveOne(value))))].sort()
    const initialOverlay: LearningOverlayState = {
      ...structuredClone(EMPTY_LEARNING_OVERLAY),
      selectedEntityIds: resolveMany(scene.state.selected),
      visibleEntityIds: resolveMany(scene.state.visible),
      hiddenEntityIds: resolveMany(scene.state.hidden),
      isolatedEntityIds: resolveMany(scene.state.isolated),
      highlightedEntityIds: resolveMany(scene.state.highlighted),
      transparency: Object.fromEntries(scene.state.transparent.flatMap(({ target, opacity }) =>
        idsFromResolution(resolveOne(target)).map((id) => [id, opacity]))),
      explode: scene.state.explode,
      section: scene.state.section,
      camera: scene.camera,
      playbackSpeed: scene.state.speed,
      overlays: [],
    }
    const compileAnchor = (
      anchor: Extract<EducationalScene['overlays'][number], { kind: 'arrow' }>['start'],
    ): LearningSpatialAnchor | undefined => {
      if (!anchor) return undefined
      if (anchor.kind === 'point') return { kind: 'point', point: [...anchor.point] }
      if (anchor.kind === 'interface') {
        return { kind: 'interface', interfaceId: anchor.interfaceId, participant: anchor.participant }
      }
      return {
        kind: 'entity',
        entityIds: idsFromResolution(resolveOne(anchor.target)),
        offset: [...anchor.offset],
      }
    }
    const overlays: LearningOverlayVisual[] = scene.overlays.map((overlay) => {
      const entityGroups = overlay.kind === 'energy-path'
        ? overlay.targets.map((target) => idsFromResolution(resolveOne(target)))
        : undefined
      const resolution = overlay.kind === 'text' || overlay.kind === 'energy-path'
        ? null
        : overlay.kind === 'arrow' && !overlay.target
          ? null
          : resolveOne(overlay.target!)
      const start = overlay.kind === 'arrow' ? compileAnchor(overlay.start) : undefined
      const end = overlay.kind === 'arrow' ? compileAnchor(overlay.end) : undefined
      const text = overlay.kind === 'text'
        ? overlay.markdown
        : overlay.kind === 'label'
          ? overlay.text
          : overlay.kind === 'arrow' || overlay.kind === 'rotation' || overlay.kind === 'energy-path'
            ? overlay.label ?? overlay.kind
            : overlay.kind
      if ('accessibleLabel' in overlay && !overlay.accessibleLabel) diagnostics.push(diagnostic({
        code: 'LR-SCENE-OVERLAY-ACCESSIBILITY', category: 'content-error', severity: 'warning',
        message: `El overlay ${overlay.id} no declara accessibleLabel.`, source: 'compiler', sceneId: scene.id,
        suggestedRecovery: 'Añadir una descripción que no dependa del color o la forma.', blocking: false, retrySafe: true,
      }))
      return {
        id: overlay.id,
        kind: overlay.kind,
        entityIds: resolution
          ? idsFromResolution(resolution)
          : [...new Set([
            ...(entityGroups?.flat() ?? []),
            ...(start?.kind === 'entity' ? start.entityIds : []),
            ...(end?.kind === 'entity' ? end.entityIds : []),
          ])].sort(),
        entityGroups,
        text,
        color: 'color' in overlay ? overlay.color : undefined,
        state: overlay.state,
        pattern: 'pattern' in overlay ? overlay.pattern : undefined,
        start,
        end,
        axis: overlay.kind === 'rotation' ? [...overlay.axis] : undefined,
        direction: overlay.kind === 'rotation' ? overlay.direction : undefined,
        conceptualSpeed: overlay.kind === 'rotation' ? overlay.conceptualSpeed : undefined,
        activeSegment: overlay.kind === 'energy-path' ? overlay.activeSegment : undefined,
        comparisonGroup: overlay.kind === 'energy-path' ? overlay.comparisonGroup : undefined,
        fidelity: overlay.kind === 'energy-path' ? structuredClone(overlay.fidelity) : undefined,
        numberedAlternative: overlay.kind === 'energy-path'
          ? [...overlay.numberedAlternative]
          : undefined,
        accessibleLabel: ('accessibleLabel' in overlay && overlay.accessibleLabel) || text,
      }
    })
    initialOverlay.overlays = overlays

    const conflict = initialOverlay.visibleEntityIds.filter((id) => initialOverlay.hiddenEntityIds.includes(id))
    if (conflict.length > 0) diagnostics.push(diagnostic({
      code: 'LR-SCENE-VISIBILITY-CONFLICT', category: 'content-error', message: 'Una entidad aparece a la vez como visible y oculta.',
      technicalDetail: conflict.join(', '), source: 'compiler', sceneId: scene.id,
      suggestedRecovery: 'Eliminar una de las operaciones incompatibles.', blocking: true, retrySafe: true,
    }))

    const reducedMotion = options.reducedMotion ?? false
    const timeline = scene.timeline.map((action, indexInScene): CompiledTimelineAction => {
      const duration = action.durationMs ?? defaultDuration(action.operation)
      return {
        id: `${scene.id}:timeline:${indexInScene}`,
        atMs: action.atMs,
        durationMs: reducedMotion && !action.essential ? 0 : duration,
        operation: action.operation,
        entityIds: resolveMany(action.targets),
        value: action.value,
        essential: action.essential,
        waitFor: action.waitFor,
      }
    }).sort((left, right) => left.atMs - right.atMs || left.id.localeCompare(right.id))
    const steps: CompiledSceneStep[] = scene.steps.map((step, indexInScene) => {
      const resolutions: SemanticSelectorResolution[] = []
      const successCriteria: CompiledStepSuccessCriterion[] = step.success.map((condition, criterionIndex) => {
        const id = `${step.id}:criterion:${criterionIndex}`
        if (condition.condition === 'selected') {
          const resolution = resolveOne(condition.target)
          resolutions.push(resolution)
          return { id, condition: 'selected', entityIds: idsFromResolution(resolution) }
        }
        if (condition.condition === 'answer') {
          const question = step.questions.find(({ id: questionId }) => questionId === condition.questionId)
          if (!question) diagnostics.push(diagnostic({
            code: 'LR-SCENE-SUCCESS-QUESTION-MISSING',
            category: 'content-error',
            message: `El criterio ${id} referencia la pregunta inexistente ${condition.questionId}.`,
            source: 'compiler',
            sceneId: scene.id,
            stepId: step.id,
            suggestedRecovery: 'Corrige questionId antes de publicar la escena.',
            blocking: true,
            retrySafe: true,
          }))
          const optionIds = new Set(question?.options?.map(({ id: optionId }) => optionId) ?? [])
          const missingOptions = condition.expectedOptionIds.filter((optionId) => !optionIds.has(optionId))
          if (missingOptions.length > 0) diagnostics.push(diagnostic({
            code: 'LR-SCENE-SUCCESS-OPTION-MISSING',
            category: 'content-error',
            message: `El criterio ${id} referencia opciones inexistentes.`,
            technicalDetail: missingOptions.join(', '),
            source: 'compiler',
            sceneId: scene.id,
            stepId: step.id,
            suggestedRecovery: 'Corrige expectedOptionIds antes de publicar la escena.',
            blocking: true,
            retrySafe: true,
          }))
          return {
            id,
            condition: 'answer',
            questionId: condition.questionId,
            expectedOptionIds: [...condition.expectedOptionIds],
          }
        }
        if (condition.condition === 'structured-answer') {
          const question = step.questions.find(({ id: questionId }) => questionId === condition.questionId)
          if (!question || question.responseKind !== 'structured-response') diagnostics.push(diagnostic({
            code: 'LR-SCENE-STRUCTURED-QUESTION-MISSING',
            category: 'content-error',
            message: `El criterio ${id} necesita una pregunta structured-response existente.`,
            source: 'compiler',
            sceneId: scene.id,
            stepId: step.id,
            suggestedRecovery: 'Corrige questionId o responseKind antes de publicar la escena.',
            blocking: true,
            retrySafe: true,
          }))
          const fieldIds = new Set(question?.structuredFields?.map(({ id: fieldId }) => fieldId) ?? [])
          const missingFields = condition.requiredFieldIds.filter((fieldId) => !fieldIds.has(fieldId))
          if (missingFields.length > 0) diagnostics.push(diagnostic({
            code: 'LR-SCENE-STRUCTURED-FIELD-MISSING',
            category: 'content-error',
            message: `El criterio ${id} referencia campos estructurados inexistentes.`,
            technicalDetail: missingFields.join(', '),
            source: 'compiler',
            sceneId: scene.id,
            stepId: step.id,
            suggestedRecovery: 'Corrige requiredFieldIds antes de publicar la escena.',
            blocking: true,
            retrySafe: true,
          }))
          return {
            id,
            condition: 'structured-answer',
            questionId: condition.questionId,
            requiredFieldIds: [...condition.requiredFieldIds],
            pendingHumanReview: condition.pendingHumanReview,
          }
        }
        return { id, condition: 'step-confirmed' }
      })
      const questions: ExecutableQuestion[] = step.questions.map((question) => ({
        id: question.id,
        responseKind: question.responseKind,
        optionIds: question.options?.map(({ id }) => id) ?? [],
        structuredFields: question.structuredFields?.map((field) => ({
          id: field.id,
          kind: field.kind,
          required: field.required,
          optionIds: [...field.optionIds],
        })) ?? [],
        hints: [...(question.hints ?? [])]
          .sort((left, right) => left.level - right.level)
          .map((hint) => ({
            id: hint.id,
            level: hint.level,
            kind: hint.kind,
            content: hint.content.es,
            availableAfterAttempts: hint.availableAfterAttempts,
            countsAsHint: hint.countsAsHint,
          })),
        humanReviewRequired: question.humanReviewRequired ?? false,
      }))
      const storyboardHintIds = scene.storyboard?.sequence
        .filter(({ sceneStepId, hint }) => sceneStepId === step.id && hint)
        .map(({ id }) => `${id}:hint`) ?? []
      const hintIds = [...new Set([
        ...questions.flatMap(({ hints }) => hints.map(({ id }) => id)),
        ...storyboardHintIds,
      ])]
      return {
        id: step.id,
        index: indexInScene,
        instructionMarkdown: step.instructionMarkdown,
        questionIds: questions.map(({ id }) => id),
        questions,
        successCriteria,
        hintIds,
        selectorResolutions: resolutions,
      }
    })
    const stepIds = steps.map(({ id }) => id)
    if (new Set(stepIds).size !== stepIds.length) diagnostics.push(diagnostic({
      code: 'LR-SCENE-DUPLICATE-STEP', category: 'content-error', message: 'La escena contiene IDs de paso duplicados.', source: 'compiler',
      sceneId: scene.id, suggestedRecovery: 'Asignar un ID estable y único a cada paso.', blocking: true, retrySafe: true,
    }))
    const referencedEntityIds = [...new Set(selectorResolutions.flatMap(idsFromResolution))].sort()
    const entitySupport = options.entitySupport?.(referencedEntityIds)
    if (entitySupport && entitySupport.unsupportedEntityIds.length > 0) diagnostics.push(diagnostic({
      code: 'LR-BRIDGE-ENTITY-UNSUPPORTED', category: 'bridge-error',
      message: `El viewport no puede representar ${entitySupport.unsupportedEntityIds.length} entidades resueltas por la escena.`,
      technicalDetail: entitySupport.unsupportedEntityIds.join(', '), source: 'compiler', sceneId: scene.id,
      suggestedRecovery: 'Usar un bridge con geometría para esas entidades o declarar una alternativa no visual.',
      blocking: true, retrySafe: true,
    }))
    if (hasBlockingDiagnostics(diagnostics)) return { success: false, diagnostics }
    const durationMs = timeline.reduce((maximum, action) => Math.max(maximum, action.atMs + action.durationMs), 0)
    const identity = {
      package: `${loadedPackage.pack.manifest.id}@${loadedPackage.pack.manifest.packageVersion}`,
      scene: `${scene.id}@${scene.version}`,
      assembly: index.assembly.id,
      reducedMotion,
      initialOverlay,
      timeline,
      steps,
    }
    const plan: SceneExecutionPlan = {
      planVersion: 1,
      id: `scene-plan:${stableFingerprint(identity).slice('fnv1a64:'.length)}`,
      packageId: loadedPackage.pack.manifest.id,
      packageVersion: loadedPackage.pack.manifest.packageVersion,
      packageFingerprint: loadedPackage.packageFingerprint,
      sceneId: scene.id,
      sceneVersion: scene.version,
      assemblyId: index.assembly.id,
      initialOverlay: normalizeLearningOverlay(initialOverlay),
      timeline,
      steps,
      durationMs,
      reducedMotion,
      requiresPresentationSnapshot: true,
      capabilityResolutions,
      selectorResolutions,
      diagnostics,
      accessibility: {
        description: scene.description ?? scene.title,
        logicalStepOrder: steps.map(({ id }) => id),
        unlimitedTimeByDefault: true,
        nonDragCommandsAvailable: true,
      },
    }
    return { success: true, plan, diagnostics }
  }
}
