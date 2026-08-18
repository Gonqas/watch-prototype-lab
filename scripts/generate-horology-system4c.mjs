import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = join(process.cwd(), 'learning-content', 'horology-foundations')
const version = '0.5.0'
const packageId = 'wplab.horology.functional-map'
const originalSource = 'source.horology.original-functional-map'
const bookSource = 'source.horology.private-book.functional-systems'
const source2035 = [
  'source.miyota.2035.product-page',
  'source.miyota.2035.specification',
  'source.miyota.2035.drawing',
  'source.miyota.2035.instruction-manual',
  'source.miyota.2035.parts-list-exploded-view',
]
const source8215 = [
  'source.miyota.8215.product-page',
  'source.miyota.8215.specification',
  'source.miyota.8215.drawing',
  'source.miyota.8215.instruction-manual',
  'source.miyota.8215.parts-list-exploded-view',
]

async function json(relative, value) {
  const path = join(root, relative)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const es = (value) => ({ es: value })
const selector = (by, value, cardinality = 'one-or-more') => ({
  selector: { by, value },
  cardinality,
})
const fixtureTag = (id) => selector('tag', `fixture:${id.replaceAll('.', '-')}`)
const fidelityConceptual = {
  geometry: 'G1',
  kinematics: 'K2',
  physics: 'P0',
  limitations: ['Representación educativa normalizada; no expresa dimensiones ni física validada.'],
}
const fidelityReal = {
  geometry: 'G2',
  kinematics: 'K2',
  physics: 'P0',
  limitations: ['Ensamblaje R2 con geometría interna normalizada.', 'No es un gemelo exacto ni una validación de ingeniería.'],
}
const capabilities = [
  'learning.scene-runtime@^1.0.0',
  'canonical-selectors-v1@^1.0.0',
  'viewport.selection@^1.0.0',
  'viewport.visibility@^1.0.0',
  'viewport.isolation@^1.0.0',
  'viewport.transparency@^1.0.0',
  'viewport.highlight@^1.0.0',
  'viewport.explode@^1.0.0',
  'viewport.camera@^1.0.0',
  'viewport.overlay.labels@^1.0.0',
  'viewport.overlay.arrows@^1.0.0',
  'viewport.energy-route@^1.0.0',
  'timeline.scrub@^1.0.0',
  'reduced-motion@^1.0.0',
  'viewport.restore@^1.0.0',
]

const hintRoleLabels = {
  case: 'la caja y la estructura del reloj',
  'power-source': 'la fuente de energía',
  'electronic-control': 'el control electrónico',
  'quartz-resonator': 'la referencia temporal de cuarzo',
  coil: 'la conversión electromagnética',
  'stepper-rotor': 'el rotor paso a paso',
  train: 'la transmisión por el tren de ruedas',
  mainspring: 'el almacenamiento de energía del muelle real',
  barrel: 'la entrega de energía del barrilete',
  'escape-wheel': 'la liberación controlada del escape',
  'pallet-fork': 'el enlace entre escape y oscilador',
  balance: 'la referencia oscilatoria del volante',
  hairspring: 'la espiral del volante',
  indication: 'la indicación mediante agujas',
}

const hints = (prefix, subject) => {
  const subjectLabel = hintRoleLabels[subject] ?? subject
  return [
    ['orientation', `Empieza por localizar la función general relacionada con ${subjectLabel}.`],
    ['subsystem', `Limita la búsqueda al subsistema al que pertenece ${subjectLabel}.`],
    ['functional-property', `Busca el elemento cuya propiedad funcional explica ${subjectLabel}.`],
    ['comparison', `Compáralo con el elemento que cumple la función equivalente en la otra cadena.`],
    ['near-answer', `La respuesta está en la entidad o etapa inmediatamente asociada a ${subjectLabel}.`],
    ['post-attempt-explanation', `Tras el intento: revisa la ruta numerada y separa fuente, control, conversión, transmisión e indicación.`],
  ].map(([kind, content], index) => ({
    id: `hint.${prefix}.${index + 1}`,
    level: index + 1,
    kind,
    content: es(content),
    availableAfterAttempts: index === 5 ? 1 : 0,
    countsAsHint: true,
  }))
}

const fixtureBindings = {
  conceptualQuartz: { kind: 'fixture', fixtureId: 'fixture.conceptual.quartz-chain' },
  conceptualMechanical: { kind: 'fixture', fixtureId: 'fixture.conceptual.mechanical-chain' },
  quartz: {
    kind: 'composition',
    compositionId: 'composition.horology.quartz-chain',
    fixtureIds: ['fixture.conceptual.quartz-chain', 'fixture.miyota.2035.structural'],
    layout: 'split',
  },
  mechanical: {
    kind: 'composition',
    compositionId: 'composition.horology.mechanical-chain',
    fixtureIds: ['fixture.conceptual.mechanical-chain', 'fixture.miyota.8215.structural'],
    layout: 'split',
  },
  comparison: {
    kind: 'composition',
    compositionId: 'composition.horology.functional-comparison',
    fixtureIds: ['fixture.conceptual.quartz-chain', 'fixture.conceptual.mechanical-chain', 'fixture.miyota.2035.structural'],
    layout: 'grid',
  },
  all: {
    kind: 'composition',
    compositionId: 'composition.horology.interruptions',
    fixtureIds: ['fixture.conceptual.quartz-chain', 'fixture.miyota.2035.structural', 'fixture.conceptual.mechanical-chain', 'fixture.miyota.8215.structural'],
    layout: 'grid',
  },
}

const paths = {
  quartz: ['power-source', 'electronic-control', 'coil', 'stepper-rotor', 'train', 'indication'],
  mechanical: ['mainspring', 'barrel', 'train', 'escape-wheel', 'pallet-fork', 'balance', 'motion-works', 'indication'],
}
const roleLabels = {
  case: 'caja',
  dial: 'esfera',
  'hour-hand': 'aguja horaria',
  mainspring: 'muelle real',
  barrel: 'barrilete',
  balance: 'volante',
  train: 'tren de ruedas',
  indication: 'indicación',
  'power-source': 'fuente de energía',
  'electronic-control': 'control electrónico',
  'quartz-resonator': 'resonador de cuarzo',
  coil: 'bobina',
  'stepper-rotor': 'rotor paso a paso',
  'escape-wheel': 'rueda de escape',
  'pallet-fork': 'áncora',
  'motion-works': 'minutería',
}
const humanizeRole = (role) => roleLabels[role] ?? role.replaceAll('-', ' ')
const humanizeSequence = (roles) => roles.map(humanizeRole).join(' → ')
const pathSelectors = (roles) => roles.map((role) => selector('role', role))
const energyOverlay = (id, roles, label, fidelity = fidelityConceptual) => ({
  kind: 'energy-path',
  id,
  targets: pathSelectors(roles),
  state: 'available',
  label,
  fidelity,
  accessibleLabel: `${label}. Ruta funcional educativa, no simulación física.`,
  numberedAlternative: roles.map((role, index) => `${index + 1}. ${humanizeRole(role)}`),
})
const accessibility = (entities, sequence, change) => ({
  textualAlternative: `Elementos presentes: ${entities}. Relación y secuencia: ${sequence}. El estado inicial está disponible; los cambios se anuncian como ${change}. Se puede seleccionar, avanzar, retroceder, pausar y restaurar sin usar la vista tridimensional.`,
  reducedMotionAlternative: `La misma información se presenta como estados discretos y una lista numerada: ${sequence}. No hay movimiento automático de cámara ni rotación.`,
  keyboardActions: ['Tabular por controles y entidades.', 'Activar con Intro o Espacio.', 'Avanzar y retroceder mediante botones con nombre accesible.', 'Restaurar el estado desde el control Restaurar.'],
  colorIndependentCues: ['Patrón y grosor distinguen estados.', 'Icono y texto acompañan cada color.', 'La ruta tiene numeración explícita.'],
})
const sceneState = () => ({
  selected: [],
  visible: [],
  hidden: [],
  isolated: [],
  transparent: [],
  highlighted: [],
  explode: 0,
  speed: 1,
})
const timeline = (roles) => roles.slice(0, 5).map((role, index) => ({
  atMs: index * 900,
  operation: index === 0 ? 'highlight' : 'overlay',
  targets: [selector('role', role)],
  value: index === 0 ? undefined : `segment:${index}`,
  durationMs: 450,
  essential: false,
  waitFor: index < roles.length - 1 ? 'interaction' : 'none',
})).map((item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)))
const storyboard = (scene, purpose, stepIds, evidenceIds, limitations = []) => ({
  sceneName: es(scene),
  purpose: es(purpose),
  prerequisites: ['concept.horology.functional-chain'],
  narrative: es('Observar, predecir, manipular y explicar antes de registrar evidencia.'),
  initialFraming: es('Encuadre general estable con procedencia y fidelidad disponibles bajo demanda.'),
  secondaryParts: [],
  sequence: stepIds.map((stepId, index) => ({
    id: `storyboard.${stepId}`,
    sceneStepId: stepId,
    narrative: es(index === 0 ? 'Observar la escena y formular una predicción.' : 'Manipular el estado y explicar el resultado.'),
    timelineIndexes: index === 0 ? [0] : [1],
    runtimeActions: index === 0 ? ['highlight', 'pause'] : ['select', 'answer', 'restore'],
    interaction: es('Usar los controles de teclado, la lista accesible o la vista tridimensional.'),
    feedback: es('La corrección distingue la respuesta, su procedencia y las limitaciones del modelo.'),
    hint: es('La pista se ofrece por niveles y se registra como evidencia de proceso.'),
  })),
  ending: es('La escena muestra la evidencia registrada y la regla de evaluación aplicable.'),
  restoration: es('Restaurar la selección, las piezas visibles, las etiquetas, el encuadre y la secuencia a su estado inicial.'),
  accessibility: es('Lista funcional equivalente con entidades, relaciones, estados, cambios y controles completos.'),
  reducedMotion: es('Estados discretos, flechas estáticas numeradas y avance manual con idéntica evaluación.'),
  evidenceTemplateIds: evidenceIds,
  technicalCriteria: ['Selectores resolubles.', 'Restauración idempotente.', 'Procedencia y G/K/P conservados.'],
  limitations,
})

const sceneDefinitions = [
  {
    id: 'scene.horology.functional-layers',
    title: 'Capas funcionales',
    binding: fixtureBindings.conceptualMechanical,
    entities: 'estructura, fuente, regulación, transmisión e indicación del modelo conceptual',
    roles: ['case', 'dial', 'hour-hand', 'mainspring', 'balance', 'train', 'indication'],
    hintSubject: 'tren',
    evidence: ['evidence.horology.subsystem-classification'],
    question: {
      id: 'question.horology.classify',
      prompt: 'Selecciona la función que corresponde al tren de ruedas.',
      kind: 'single-choice',
      options: [['option.energy', 'Energía'], ['option.transmission', 'Transmisión'], ['option.indication', 'Indicación']],
      expected: ['option.transmission'],
    },
  },
  {
    id: 'scene.horology.quartz-chain',
    title: 'Cadena del cuarzo',
    binding: fixtureBindings.quartz,
    entities: 'cuarzo conceptual y MIYOTA 2035, presentados por separado',
    roles: paths.quartz,
    hintSubject: 'cadena de cuarzo desde la fuente hasta la indicación',
    evidence: ['evidence.horology.quartz-sequence', 'evidence.horology.component-selection', 'evidence.horology.hint-use'],
    question: {
      id: 'question.horology.quartz-order',
      prompt: 'Ordena la cadena desde la fuente hasta la indicación.',
      kind: 'ordered-list',
      options: [...paths.quartz].reverse().map((role) => [`item.quartz.${role}`, role]),
      expected: paths.quartz.map((role) => `item.quartz.${role}`),
    },
  },
  {
    id: 'scene.horology.isa-confidence',
    title: 'Mapa de confianza ISA 8172',
    binding: fixtureBindings.conceptualQuartz,
    entities: 'representación abstracta funcional; no existe un modelo atribuido al ISA 8172',
    roles: ['power-source', 'electronic-control', 'coil', 'train'],
    hintSubject: 'autoridad de la afirmación y su fuente',
    evidence: ['evidence.horology.source-consultation', 'evidence.horology.confidence-declaration'],
    question: {
      id: 'question.horology.confidence',
      prompt: 'Clasifica la afirmación según su autoridad.',
      kind: 'single-choice',
      options: [['option.observed', 'Visto directamente'], ['option.inferred', 'Inferido por función'], ['option.official', 'Documentado oficialmente'], ['option.unknown', 'Desconocido']],
      expected: ['option.inferred'],
    },
  },
  {
    id: 'scene.horology.mechanical-chain',
    title: 'Cadena mecánica',
    binding: fixtureBindings.mechanical,
    entities: 'mecánico conceptual y MIYOTA 8215, presentados por separado',
    roles: paths.mechanical,
    hintSubject: 'cadena mecánica desde el muelle real hasta la indicación',
    evidence: ['evidence.horology.mechanical-sequence', 'evidence.horology.component-selection'],
    question: {
      id: 'question.horology.mechanical-order',
      prompt: 'Ordena la cadena funcional mecánica.',
      kind: 'ordered-list',
      options: [...paths.mechanical].reverse().map((role) => [`item.mechanical.${role}`, role]),
      expected: paths.mechanical.map((role) => `item.mechanical.${role}`),
    },
  },
  {
    id: 'scene.horology.functional-comparison',
    title: 'Comparación funcional',
    binding: fixtureBindings.comparison,
    entities: 'cuarzo conceptual, mecánico conceptual y MIYOTA 2035',
    roles: ['power-source', 'mainspring', 'quartz-resonator', 'balance', 'train', 'indication'],
    hintSubject: 'referencia temporal en las cadenas de cuarzo y mecánica',
    evidence: ['evidence.horology.functional-comparison'],
    question: {
      id: 'question.horology.equivalence',
      prompt: '¿Qué pareja cumple la función de referencia temporal?',
      kind: 'single-choice',
      options: [['option.reference', 'Resonador/circuito y volante/espiral'], ['option.train', 'Tren y tren'], ['option.indication', 'Agujas y agujas']],
      expected: ['option.reference'],
    },
  },
  {
    id: 'scene.horology.interruptions',
    title: 'Interrupciones y diagnóstico',
    binding: fixtureBindings.all,
    entities: 'los cuatro modelos del módulo, sin mezclar sus ensamblajes',
    roles: ['power-source', 'coil', 'stepper-rotor', 'train', 'mainspring', 'escape-wheel', 'balance', 'indication'],
    hintSubject: 'síntoma, subsistema y comprobación propuesta',
    evidence: ['evidence.horology.interruption-prediction', 'evidence.horology.affected-subsystem', 'evidence.horology.structured-justification'],
    question: {
      id: 'question.horology.hypothesis',
      prompt: 'Formula una hipótesis sin convertirla en conclusión.',
      kind: 'structured-response',
      structuredFields: [
        { id: 'field.symptom', label: 'Síntoma', kind: 'short-text', required: true, optionIds: [] },
        { id: 'field.subsystem', label: 'Subsistema', kind: 'choice', required: true, optionIds: ['energy', 'control', 'transmission', 'indication'] },
        { id: 'field.hypothesis', label: 'Hipótesis', kind: 'short-text', required: true, optionIds: [] },
        { id: 'field.missing-data', label: 'Dato que falta', kind: 'short-text', required: true, optionIds: [] },
        { id: 'field.check', label: 'Comprobación no destructiva', kind: 'short-text', required: true, optionIds: [] },
        { id: 'field.confidence', label: 'Confianza', kind: 'confidence', required: true, optionIds: [] },
      ],
      expectedFields: ['field.symptom', 'field.subsystem', 'field.hypothesis', 'field.missing-data', 'field.check', 'field.confidence'],
    },
  },
]

const canonicalScenes = new Map()
const causalExplanationFields = [
  { id: 'field.observation', label: 'Qué observaste o qué orden comprobaste', kind: 'short-text', required: true, optionIds: [] },
  { id: 'field.causal-link', label: 'Qué relación o regla explica la respuesta', kind: 'short-text', required: true, optionIds: [] },
  { id: 'field.source-limit', label: 'Qué fuente o límite condiciona la conclusión', kind: 'short-text', required: true, optionIds: [] },
  { id: 'field.confidence', label: 'Confianza en la explicación', kind: 'confidence', required: true, optionIds: [] },
]
for (const definition of sceneDefinitions) {
  const stepQuestion = `step.${definition.id}.question`
  const stepManipulate = `step.${definition.id}.manipulate`
  const q = definition.question
  const question = {
    id: q.id,
    promptMarkdown: q.prompt,
    responseKind: q.kind,
    ...(q.options ? { options: q.options.map(([id, label]) => ({ id, label: humanizeRole(label), labels: { es: humanizeRole(label), en: humanizeRole(label) } })) } : {}),
    ...(q.structuredFields ? { structuredFields: q.structuredFields, humanReviewRequired: true } : {}),
    hints: hints(definition.id.replace('scene.', ''), definition.hintSubject),
    authoring: { prompt: es(q.prompt), feedback: es('La respuesta se contrasta con la función, la procedencia y las limitaciones declaradas.') },
  }
  const success = q.kind === 'structured-response'
    ? [{ condition: 'structured-answer', questionId: q.id, requiredFieldIds: q.expectedFields, pendingHumanReview: true }]
    : [{ condition: 'answer', questionId: q.id, expectedOptionIds: q.expected }]
  const explanationQuestion = q.kind === 'structured-response' ? undefined : {
    id: `${q.id}.reasoning`,
    promptMarkdown: `Explica qué observaste, qué relación o regla aplicaste y qué límite tiene tu respuesta a: ${q.prompt}`,
    responseKind: 'structured-response',
    options: [],
    structuredFields: causalExplanationFields.map((field) => ({ ...field })),
    hints: [],
    humanReviewRequired: true,
    authoring: {
      prompt: es(`Explica qué observaste, qué relación o regla aplicaste y qué límite tiene tu respuesta a: ${q.prompt}`),
      feedback: es('La explicación debe enlazar la observación con la función o secuencia y declarar qué no demuestra el modelo.'),
    },
  }
  if (explanationQuestion) success.push({
    condition: 'structured-answer',
    questionId: explanationQuestion.id,
    requiredFieldIds: causalExplanationFields.map(({ id }) => id),
    pendingHumanReview: true,
  })
  const overlays = [
    energyOverlay(`overlay.${definition.id}.path`, definition.roles, `Ruta ${definition.title}`, definition.binding === fixtureBindings.conceptualMechanical ? fidelityConceptual : fidelityReal),
    {
      kind: 'rotation',
      id: `overlay.${definition.id}.rotation`,
      target: selector('role', definition.roles[Math.min(2, definition.roles.length - 1)]),
      axis: [0, 1, 0],
      direction: 'clockwise',
      conceptualSpeed: 'slow',
      state: 'available',
      label: 'Sentido conceptual',
      accessibleLabel: 'Arco de giro conceptual. En el modo de movimiento reducido se sustituye por una flecha estática.',
    },
    {
      kind: 'arrow',
      id: `overlay.${definition.id}.arrow`,
      start: { kind: 'entity', target: selector('role', definition.roles[0]), offset: [0, 0.2, 0] },
      end: { kind: 'entity', target: selector('role', definition.roles[1]), offset: [0, 0.2, 0] },
      label: 'Relación funcional',
      state: 'available',
      pattern: 'dashed',
      accessibleLabel: `Flecha funcional desde ${humanizeRole(definition.roles[0])} hacia ${humanizeRole(definition.roles[1])}; no expresa una trayectoria física.`,
    },
  ]
  const sceneDocument = {
    id: definition.id,
    version,
    title: definition.title,
    description: `${definition.title}. Escena reversible con alternativa textual funcional.`,
    fixtureBinding: definition.binding,
    accessibility: accessibility(definition.entities, humanizeSequence(definition.roles), 'selección, bloqueo, avance de ruta y restauración'),
    cameraIntent: { intent: definition.binding.kind === 'composition' ? 'comparison' : 'overview', transition: 'smooth' },
    requiredCapabilities: capabilities,
    camera: { position: [6, 5, 7], target: [0, 0, 0], projection: 'perspective', fieldOfView: 42 },
    state: sceneState(),
    timeline: timeline(definition.roles),
    overlays,
    steps: [
      { id: stepQuestion, instructionMarkdown: q.prompt, questions: [question, ...(explanationQuestion ? [explanationQuestion] : [])], success },
      { id: stepManipulate, instructionMarkdown: 'Manipula o recorre la lista equivalente y confirma el resultado antes de restaurar.', questions: [], success: [{ condition: 'step-confirmed' }] },
    ],
    storyboard: storyboard(definition.title, `Ejecutar ${definition.title.toLowerCase()} de forma visual, accesible y evaluable.`, [stepQuestion, stepManipulate], definition.evidence, definition.id.includes('isa') ? ['No se atribuye geometría ni compatibilidad al ISA 8172.'] : []),
    restorePreviousState: true,
  }
  canonicalScenes.set(definition.id, sceneDocument)
  await json(`scenes/${definition.id}.json`, sceneDocument)
}

const competencies = [
  ['identify-functional-subsystems', 'Identificar subsistemas funcionales', 'Clasificar energía, regulación o control, transmisión, indicación y estructura.', 'observation', 'system'],
  ['explain-quartz-energy-chain', 'Explicar la cadena de cuarzo', 'Ordenar y explicar la cadena funcional del cuarzo sin confundir control y transmisión.', 'reasoning', 'quartz'],
  ['explain-mechanical-energy-chain', 'Explicar la cadena mecánica', 'Ordenar y explicar la cadena mecánica y el acoplamiento escape-oscilador.', 'reasoning', 'mechanical'],
  ['distinguish-regulation-from-transmission', 'Distinguir regulación y transmisión', 'Diferenciar la referencia temporal o regulación del transporte de energía y movimiento.', 'reasoning', 'regulation'],
  ['predict-system-interruption', 'Predecir una interrupción', 'Predecir efectos observables y proponer comprobaciones no destructivas sin afirmar averías.', 'diagnosis', 'diagnosis'],
  ['state-source-confidence', 'Distinguir fuente, observación e inferencia', 'Declarar la autoridad y confianza de una afirmación técnica.', 'knowledge', 'provenance'],
]
for (const [slug, title, description, skillType, subsystem] of competencies) {
  await json(`competencies/competency.horology.${slug}.json`, {
    id: `competency.horology.${slug}`,
    version,
    title,
    description,
    prerequisites: [],
    authoring: {
      title: es(title),
      description: es(description),
      movementIds: ['fixture.conceptual.quartz-chain', 'fixture.conceptual.mechanical-chain', 'fixture.miyota.2035.structural', 'fixture.miyota.8215.structural'],
      subsystem,
      skillType,
      sourceIds: [originalSource, bookSource],
    },
  })
}

const evidence = [
  ['subsystem-classification', 'identify-functional-subsystems', 'classification', 'answer-submitted', 'answer'],
  ['quartz-sequence', 'explain-quartz-energy-chain', 'sequence', 'answer-submitted', 'procedure'],
  ['mechanical-sequence', 'explain-mechanical-energy-chain', 'sequence', 'answer-submitted', 'procedure'],
  ['component-selection', 'distinguish-regulation-from-transmission', 'selection', 'selection-confirmed', 'answer'],
  ['functional-comparison', 'distinguish-regulation-from-transmission', 'explanation', 'answer-submitted', 'answer'],
  ['interruption-prediction', 'predict-system-interruption', 'diagnosis', 'answer-submitted', 'answer'],
  ['affected-subsystem', 'predict-system-interruption', 'classification', 'answer-submitted', 'answer'],
  ['structured-justification', 'predict-system-interruption', 'human-review', 'answer-submitted', 'human-review'],
  ['hint-use', 'explain-quartz-energy-chain', 'decision', 'hint-requested', 'observation'],
  ['source-consultation', 'state-source-confidence', 'decision', 'answer-submitted', 'observation'],
  ['confidence-declaration', 'state-source-confidence', 'written-response', 'answer-submitted', 'answer'],
]
const activityByEvidence = {
  'subsystem-classification': ['activity.horology.classify-subsystems'],
  'quartz-sequence': ['activity.horology.order-quartz-chain'],
  'mechanical-sequence': ['activity.horology.order-mechanical-chain'],
  'component-selection': ['activity.horology.identify-time-reference', 'activity.horology.identify-escapement-oscillator'],
  'functional-comparison': ['activity.horology.match-functional-equivalents'],
  'interruption-prediction': ['activity.horology.predict-interruption'],
  'affected-subsystem': ['activity.horology.select-affected-subsystem'],
  'structured-justification': ['activity.horology.justify-hypothesis'],
  'hint-use': ['activity.horology.order-quartz-chain', 'activity.horology.order-mechanical-chain'],
  'source-consultation': ['activity.horology.isa-confidence-map'],
  'confidence-declaration': ['activity.horology.isa-confidence-map'],
}
for (const [slug, competency, evidenceType, triggerEventType, kind] of evidence) {
  const id = `evidence.horology.${slug}`
  await json(`evidence/${id}.json`, {
    id,
    version,
    competencyId: `competency.horology.${competency}`,
    kind,
    scoringMethod: kind === 'human-review' ? 'rubric' : 'binary',
    extraction: {
      id: `rule.extract.horology.${slug}`,
      version,
      triggerEventType,
      evidenceType,
      competencyId: `competency.horology.${competency}`,
      packageId,
      activityIds: activityByEvidence[slug],
      evidenceTemplateId: id,
      minimumSessionState: ['active', 'paused', 'completed'],
      confidence: kind === 'human-review' ? 0.35 : 1,
      contentFields: triggerEventType === 'selection-confirmed' ? ['sceneId', 'entityIds'] : ['sceneId', 'stepId', 'data'],
    },
  })
}

const rubricDefinitions = [
  ['functional-subsystems', 'identify-functional-subsystems', 'classification'],
  ['quartz-chain', 'explain-quartz-energy-chain', 'sequence'],
  ['mechanical-chain', 'explain-mechanical-energy-chain', 'sequence'],
  ['regulation-transmission', 'distinguish-regulation-from-transmission', 'selection'],
  ['interruption', 'predict-system-interruption', 'diagnosis'],
  ['source-confidence', 'state-source-confidence', 'written-response'],
]
for (const [slug, competency, evidenceType] of rubricDefinitions) {
  const competencyId = `competency.horology.${competency}`
  await json(`rubrics/rubric.horology.${slug}.json`, {
    id: `rubric.horology.${slug}`,
    version,
    competencyId,
    rules: [{
      id: `rule.horology.${slug}.demonstrated`,
      version,
      targetState: 'demonstrated',
      acceptedEvidenceKinds: ['answer', 'procedure', 'observation', 'artifact', 'human-review'],
      minimumEvidence: 1,
      minimumScore: 1,
      minimumDistinctSessions: 1,
      minimumSpanDays: 0,
      explanationTemplate: 'La evidencia correcta y completa demuestra la competencia en este módulo; el uso de pistas queda visible.',
    }],
    assessmentRule: {
      id: `rule.composite.horology.${slug}.demonstrated`,
      version,
      competencyId,
      targetState: 'demonstrated',
      condition: {
        op: 'all',
        conditions: [
          { op: 'exists', filter: { evidenceType, status: 'active', minimumConfidence: evidenceType === 'diagnosis' ? 0.75 : 1 } },
          { op: 'minimum-evidence', count: 1 },
        ],
      },
    },
  })
}

const activities = [
  ['classify-subsystems', 'Clasificar subsistemas', 'lesson.horology.system', 'scene.horology.functional-layers', 'identify-functional-subsystems', 'functional-subsystems', ['subsystem-classification'], 'single-choice', fixtureBindings.conceptualMechanical],
  ['order-quartz-chain', 'Ordenar la cadena de cuarzo', 'lesson.horology.quartz-chain', 'scene.horology.quartz-chain', 'explain-quartz-energy-chain', 'quartz-chain', ['quartz-sequence', 'hint-use'], 'ordered-list', fixtureBindings.quartz],
  ['identify-time-reference', 'Identificar la referencia temporal', 'lesson.horology.quartz-chain', 'scene.horology.quartz-chain', 'distinguish-regulation-from-transmission', 'regulation-transmission', ['component-selection'], 'entity-selection', fixtureBindings.quartz],
  ['isa-confidence-map', 'Crear un mapa de confianza del ISA 8172', 'lesson.horology.isa8172-confidence', 'scene.horology.isa-confidence', 'state-source-confidence', 'source-confidence', ['source-consultation', 'confidence-declaration'], 'single-choice', fixtureBindings.conceptualQuartz],
  ['order-mechanical-chain', 'Ordenar la cadena mecánica', 'lesson.horology.mechanical-chain', 'scene.horology.mechanical-chain', 'explain-mechanical-energy-chain', 'mechanical-chain', ['mechanical-sequence'], 'ordered-list', fixtureBindings.mechanical],
  ['identify-escapement-oscillator', 'Identificar escape, volante y espiral', 'lesson.horology.mechanical-chain', 'scene.horology.mechanical-chain', 'distinguish-regulation-from-transmission', 'regulation-transmission', ['component-selection'], 'entity-selection', fixtureBindings.mechanical],
  ['match-functional-equivalents', 'Emparejar equivalencias funcionales', 'lesson.horology.functional-equivalence', 'scene.horology.functional-comparison', 'distinguish-regulation-from-transmission', 'regulation-transmission', ['functional-comparison'], 'single-choice', fixtureBindings.comparison],
  ['predict-interruption', 'Predecir una interrupción', 'lesson.horology.failure-prediction', 'scene.horology.interruptions', 'predict-system-interruption', 'interruption', ['interruption-prediction'], 'single-choice', fixtureBindings.all],
  ['select-affected-subsystem', 'Seleccionar el subsistema afectado', 'lesson.horology.failure-prediction', 'scene.horology.interruptions', 'predict-system-interruption', 'interruption', ['affected-subsystem'], 'multiple-choice', fixtureBindings.all],
  ['justify-hypothesis', 'Justificar una hipótesis', 'lesson.horology.failure-prediction', 'scene.horology.interruptions', 'predict-system-interruption', 'interruption', ['structured-justification'], 'structured-response', fixtureBindings.all],
]

const activityCheckSpecs = {
  'classify-subsystems': {
    prompt: 'Clasifica el tren de ruedas: selecciona la función que le corresponde.',
    options: [['option.energy', 'Energía'], ['option.transmission', 'Transmisión'], ['option.indication', 'Indicación']],
    expected: ['option.transmission'],
    focus: 'el tren de ruedas y lo que recibe y entrega',
    rationale: 'El tren de ruedas transmite movimiento entre etapas; no crea la energía ni constituye por sí solo la indicación.',
  },
  'order-quartz-chain': {
    prompt: 'Ordena la cadena de cuarzo desde la fuente de energía hasta la indicación.',
    options: [...paths.quartz].reverse().map((role) => [`item.quartz.${role}`, humanizeRole(role)]),
    expected: paths.quartz.map((role) => `item.quartz.${role}`),
    focus: 'la salida de cada etapa y la entrada de la siguiente',
    rationale: 'La fuente alimenta el control; el control excita la bobina, el rotor produce pasos y el tren los lleva a la indicación.',
  },
  'identify-time-reference': {
    prompt: 'Selecciona el resonador de cuarzo que proporciona la referencia temporal; después explica por qué no pertenece al tren de ruedas.',
    selectedTarget: selector('role', 'quartz-resonator'),
    focus: 'el resonador de cuarzo y el control electrónico',
    rationale: 'El resonador aporta una referencia periódica al control; el tren transmite los pasos mecánicos posteriores.',
  },
  'isa-confidence-map': {
    prompt: 'Para completar el mapa de confianza del ISA 8172: la posición de una pieza se deduce de una vista documental sin cota oficial. ¿Qué autoridad tiene esa afirmación?',
    options: [['option.observed', 'Observada en una unidad física'], ['option.inferred', 'Deducida de la documentación'], ['option.official', 'Dimensión oficial'], ['option.unknown', 'Desconocida por completo']],
    expected: ['option.inferred'],
    focus: 'la diferencia entre dato oficial, observación e inferencia',
    rationale: 'Una vista puede permitir deducir identidad o relación, pero no convierte una proporción gráfica en cota oficial.',
  },
  'order-mechanical-chain': {
    prompt: 'Ordena la cadena mecánica desde el muelle real hasta la indicación.',
    options: [...paths.mechanical].reverse().map((role) => [`item.mechanical.${role}`, humanizeRole(role)]),
    expected: paths.mechanical.map((role) => `item.mechanical.${role}`),
    focus: 'la energía almacenada, su transmisión y su liberación regulada',
    rationale: 'El muelle entrega energía mediante el barrilete y el tren; escape y oscilador regulan la liberación antes de que la minutería mueva la indicación.',
  },
  'identify-escapement-oscillator': {
    prompt: 'Selecciona el volante; después localiza su espiral, el áncora y la rueda de escape para explicar cómo cooperan escape y oscilador.',
    selectedTarget: selector('role', 'balance'),
    focus: 'volante, espiral, áncora y rueda de escape',
    rationale: 'El volante y la espiral forman el oscilador; la rueda de escape y el áncora bloquean, liberan e impulsan de forma coordinada.',
  },
  'match-functional-equivalents': {
    prompt: 'Empareja las equivalencias funcionales: ¿qué pareja cumple la función de referencia temporal en las cadenas de cuarzo y mecánica?',
    options: [['option.reference', 'Resonador y circuito / volante y espiral'], ['option.train', 'Tren / tren'], ['option.indication', 'Agujas / agujas']],
    expected: ['option.reference'],
    focus: 'la función compartida, no la forma de las piezas',
    rationale: 'Ambas soluciones aportan referencia temporal, pero usan piezas y principios físicos diferentes.',
  },
  'predict-interruption': {
    prompt: 'Si el tren queda bloqueado mientras la fuente conserva energía, ¿qué resultado debes predecir primero?',
    options: [['option.output-stops', 'La indicación deja de avanzar'], ['option.energy-vanishes', 'La fuente desaparece de inmediato'], ['option.output-continues', 'Las agujas continúan sin transmisión']],
    expected: ['option.output-stops'],
    focus: 'la primera función interrumpida y sus efectos aguas abajo',
    rationale: 'Un bloqueo del tren corta la transmisión: la salida se detiene aunque pueda quedar energía almacenada aguas arriba.',
  },
  'select-affected-subsystem': {
    prompt: 'La fuente de energía y la referencia temporal funcionan. El tren de ruedas no impulsa la minutería ni las agujas. ¿Qué dos subsistemas debes revisar primero?',
    options: [['option.transmission', 'Transmisión'], ['option.indication', 'Indicación'], ['option.energy', 'Fuente de energía'], ['option.reference', 'Referencia temporal']],
    expected: ['option.transmission', 'option.indication'],
    focus: 'transmisión e indicación, sin reabrir funciones ya comprobadas',
    rationale: 'Con fuente y referencia ya comprobadas, la investigación comienza donde el movimiento deja de transmitirse y termina en la indicación.',
  },
  'justify-hypothesis': {
    prompt: 'Justifica una hipótesis para una indicación detenida: separa síntoma, subsistema, causa propuesta, dato que falta, comprobación y confianza.',
    structuredFields: sceneDefinitions.find(({ id }) => id === 'scene.horology.interruptions').question.structuredFields,
    expectedFields: sceneDefinitions.find(({ id }) => id === 'scene.horology.interruptions').question.expectedFields,
    focus: 'una causa que pueda perder apoyo ante una comprobación',
    rationale: 'Una hipótesis no es una conclusión: debe predecir un resultado, admitir refutación y declarar los datos que faltan.',
  },
}

const activitySceneEntries = []
const activitySubsystems = {
  'classify-subsystems': 'train',
  'identify-time-reference': 'regulation',
  'identify-escapement-oscillator': 'regulation',
  'match-functional-equivalents': 'regulation',
  'predict-interruption': 'diagnosis',
  'select-affected-subsystem': 'diagnosis',
  'justify-hypothesis': 'diagnosis',
}
for (const [slug, title, lessonId, sceneId, competency, rubric, evidenceSlugs, responseModel, binding] of activities) {
  const evidenceIds = evidenceSlugs.map((value) => `evidence.horology.${value}`)
  const scene = sceneDefinitions.find(({ id }) => id === sceneId)
  const orderedRoles = responseModel === 'ordered-list' ? scene.roles : []
  const structuredFields = responseModel === 'structured-response'
    ? scene.question.structuredFields.map(({ id, label, kind, required }) => ({ id, label: es(label), kind, required }))
    : []
  const derivedSceneId = `scene.horology.activity.${slug}`
  const activityDocument = {
    id: `activity.horology.${slug}`,
    version,
    title,
    sceneIds: [derivedSceneId],
    competencyIds: [`competency.horology.${competency}`],
    evidenceTemplateIds: evidenceIds,
    rubricId: `rubric.horology.${rubric}`,
    projectReference: binding.kind === 'fixture'
      ? { kind: 'fixture-readonly', fixtureId: binding.fixtureId }
      : { kind: 'fixture-composition-readonly', compositionId: binding.compositionId, fixtureIds: binding.fixtureIds },
    authoring: {
      lessonId,
      title: es(title),
      description: es(`${title} sobre modelos técnicos de solo lectura, con restauración y evidencia explicable.`),
      difficulty: slug.includes('justify') || slug.includes('predict') ? 'intermediate' : 'introductory',
      durationMinutes: slug.includes('justify') ? 12 : 8,
      activityType: responseModel === 'structured-response' ? 'explanation' : responseModel === 'single-choice' ? 'prediction' : 'guided-practice',
      movementIds: binding.kind === 'fixture' ? [binding.fixtureId] : binding.fixtureIds,
      familyIds: [],
      subsystem: activitySubsystems[slug] ?? scene.roles[0],
      requiredCapabilities: capabilities.map((value) => value.split('@')[0]),
      languages: ['es-ES'],
      offline: true,
      fidelity: binding === fixtureBindings.conceptualMechanical || binding === fixtureBindings.conceptualQuartz ? fidelityConceptual : fidelityReal,
      warnings: {
        es: ['Simulación educativa: no constituye diagnóstico físico ni validación de ingeniería.'],
        en: [],
      },
      sourceIds: [...new Set([originalSource, bookSource, ...(binding === fixtureBindings.quartz ? source2035 : []), ...(binding === fixtureBindings.mechanical || binding === fixtureBindings.all ? source8215 : [])])],
      visualResourceIds: [],
      fixtureBinding: binding,
      interactionContract: {
        responseModel,
        orderedItems: orderedRoles.map((role) => ({ id: `item.${slug}.${role}`, label: es(humanizeRole(role)) })),
        expectedOrderIds: orderedRoles.map((role) => `item.${slug}.${role}`),
        structuredFields,
        hints: hints(`activity.horology.${slug}`, title.toLowerCase()),
        evidencePolicy: {
          eventType: responseModel === 'entity-selection' ? 'selection-confirmed' : 'answer-submitted',
          recordsAnswerPayload: true,
          deterministicComponents: responseModel === 'structured-response' ? structuredFields.map(({ id }) => id) : [],
          requiresHumanReview: responseModel === 'structured-response',
          accessibilityAdaptationsCountAsHints: false,
        },
      },
      pedagogicalPattern: {
        enabled: true,
        stages: ['observe', 'predict', 'manipulate', 'compare', 'explain', 'check-understanding', 'record-evidence'],
      },
    },
  }
  await json(`activities/activity.horology.${slug}.json`, activityDocument)

  const check = activityCheckSpecs[slug]
  if (!check) throw new Error(`Falta comprobación específica para activity.horology.${slug}.`)
  const derivedScene = structuredClone(canonicalScenes.get(sceneId))
  const questionId = `question.horology.activity.${slug}`
  const question = {
    id: questionId,
    promptMarkdown: check.prompt,
    responseKind: responseModel,
    ...(check.options ? {
      options: check.options.map(([id, label]) => ({ id, label, labels: { es: label, en: label } })),
    } : {}),
    ...(check.structuredFields ? {
      structuredFields: check.structuredFields,
      humanReviewRequired: true,
    } : {}),
    hints: [
      {
        id: `hint.horology.activity.${slug}.1`,
        level: 1,
        kind: 'orientation',
        content: es(`Vuelve a la pregunta de «${title}» y separa primero lo que ya está comprobado de lo que debes decidir.`),
        availableAfterAttempts: 1,
        countsAsHint: true,
      },
      {
        id: `hint.horology.activity.${slug}.2`,
        level: 2,
        kind: 'subsystem',
        content: es(`Centra la observación en ${check.focus}; no elijas por color, tamaño o proximidad.`),
        availableAfterAttempts: 1,
        countsAsHint: true,
      },
      {
        id: `hint.horology.activity.${slug}.3`,
        level: 3,
        kind: 'post-attempt-explanation',
        content: es(check.rationale),
        availableAfterAttempts: 2,
        countsAsHint: true,
      },
    ],
    authoring: {
      prompt: es(check.prompt),
      feedback: es(check.rationale),
    },
  }
  const success = responseModel === 'entity-selection'
    ? [{ condition: 'selected', target: check.selectedTarget }]
    : responseModel === 'structured-response'
      ? [{ condition: 'structured-answer', questionId, requiredFieldIds: check.expectedFields, pendingHumanReview: true }]
      : [{ condition: 'answer', questionId, expectedOptionIds: check.expected }]
  const questionStepId = `step.horology.activity.${slug}.question`
  const manipulateStepId = `step.horology.activity.${slug}.explore`
  derivedScene.id = derivedSceneId
  derivedScene.title = title
  derivedScene.description = `${title}. Comprobación específica, reversible y accesible.`
  derivedScene.steps[0] = {
    id: questionStepId,
    instructionMarkdown: check.prompt,
    questions: [question],
    success,
  }
  derivedScene.steps[1] = {
    ...derivedScene.steps[1],
    id: manipulateStepId,
    instructionMarkdown: `Explora solo las piezas necesarias para «${title}», explica el resultado y restaura el estado antes de continuar.`,
  }
  derivedScene.storyboard.sceneName = es(title)
  derivedScene.storyboard.purpose = es(`Comprobar ${title.toLocaleLowerCase('es')} mediante una pregunta propia, observación y explicación.`)
  derivedScene.storyboard.narrative = es(check.rationale)
  derivedScene.storyboard.sequence[0].id = `storyboard.${questionStepId}`
  derivedScene.storyboard.sequence[0].sceneStepId = questionStepId
  derivedScene.storyboard.sequence[1].id = `storyboard.${manipulateStepId}`
  derivedScene.storyboard.sequence[1].sceneStepId = manipulateStepId
  derivedScene.storyboard.evidenceTemplateIds = evidenceIds
  await json(`scenes/${derivedSceneId}.json`, derivedScene)
  activitySceneEntries.push({ id: derivedSceneId, path: `scenes/${derivedSceneId}.json` })
}

const glossary = [
  ['movement', 'movimiento', 'movement'], ['calibre', 'calibre', 'calibre'], ['main-plate', 'platina', 'main plate'],
  ['bridge', 'puente', 'bridge'], ['battery', 'pila', 'battery / cell'], ['integrated-circuit', 'circuito integrado', 'integrated circuit'],
  ['quartz-resonator', 'resonador de cuarzo', 'quartz resonator'], ['coil', 'bobina', 'coil'], ['stepper-rotor', 'rotor paso a paso', 'stepper rotor'],
  ['gear-train', 'tren de ruedas', 'gear train'], ['wheel', 'rueda', 'wheel'], ['pinion', 'piñón', 'pinion'],
  ['arbor', 'árbol', 'arbor'], ['pivot', 'pivote', 'pivot'], ['jewel', 'rubí', 'jewel'],
  ['mainspring', 'muelle real', 'mainspring'], ['barrel', 'barrilete', 'barrel'], ['escape-wheel', 'rueda de escape', 'escape wheel'],
  ['pallet-fork', 'áncora', 'pallet fork'], ['balance-wheel', 'volante', 'balance wheel'], ['balance-spring', 'espiral', 'balance spring'],
  ['escapement', 'escape', 'escapement'], ['oscillation', 'oscilación', 'oscillation'], ['frequency', 'frecuencia', 'frequency'],
  ['amplitude', 'amplitud', 'amplitude'], ['motion-works', 'minutería', 'motion works'], ['stem', 'tija', 'stem'],
  ['time-setting', 'puesta en hora', 'time-setting mechanism'], ['indication', 'indicación', 'indication'], ['transmission', 'transmisión', 'transmission'],
  ['regulation', 'regulación', 'regulation'], ['provenance', 'procedencia', 'provenance'], ['nominal-value', 'dato nominal', 'nominal value'],
  ['measurement', 'medición', 'measurement'], ['inference', 'inferencia', 'inference'], ['hypothesis', 'hipótesis', 'hypothesis'],
]
for (const [slug, termEs, termEn] of glossary) {
  await json(`glossary/term.horology.${slug}.json`, {
    id: `term.horology.${slug}`,
    version,
    term: termEs,
    definitionMarkdown: `${termEs}: término usado en el módulo según su función y contexto; su alcance técnico se conserva separado de las simplificaciones educativas.`,
    language: 'es-ES',
    authoring: {
      terms: { es: termEs, en: termEn },
      synonyms: { es: [], en: [] },
      discouragedTerms: slug === 'balance-spring' ? ['hairspring traducido de forma inconsistente'] : [],
      simpleDefinition: es(`Elemento o concepto relojero denominado ${termEs}.`),
      technicalDefinition: es(`Definición funcional de ${termEs}; debe interpretarse con la procedencia y fidelidad del recurso donde aparece.`),
      context: es(`Se utiliza en “Cómo funciona un reloj de principio a fin”. La equivalencia inglesa preferida es “${termEn}”.`),
      sourceIds: [bookSource, originalSource],
    },
  })
}

const sourceDocuments = [
  ['2035', 'product-page', 'web-page', 'MIYOTA 2035 · página oficial', 'https://miyotamovement.com/product/2035/'],
  ['2035', 'specification', 'pdf', 'MIYOTA 2035 · especificación oficial', 'https://miyotamovement.com/uploads/product/product_pgSIG6yWb0akqcUhDf.pdf'],
  ['2035', 'drawing', 'pdf', 'MIYOTA 2035 · plano oficial', 'https://miyotamovement.com/uploads/product/product_4tdsbpNVQi1WcE5lUw.pdf'],
  ['2035', 'instruction-manual', 'pdf', 'MIYOTA 2035 · manual de instrucciones', 'https://miyotamovement.com/uploads/product/product_cKAJDxu3CLoa18GHXO.pdf'],
  ['2035', 'parts-list-exploded-view', 'pdf', 'MIYOTA 2035 · lista de piezas y vista explosionada', 'https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf'],
  ['8215', 'product-page', 'web-page', 'MIYOTA 8215 · página oficial', 'https://miyotamovement.com/product/8215/'],
  ['8215', 'specification', 'pdf', 'MIYOTA 8215 · especificación oficial', 'https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf'],
  ['8215', 'drawing', 'pdf', 'MIYOTA 8215 · plano oficial', 'https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf'],
  ['8215', 'instruction-manual', 'pdf', 'MIYOTA 8215 · manual de instrucciones', 'https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf'],
  ['8215', 'parts-list-exploded-view', 'pdf', 'MIYOTA 8215 · lista de piezas y vista explosionada', 'https://miyotamovement.com/uploads/product/product_x2MOZCosd7iH59wu0K.pdf'],
]
for (const [calibre, type, kind, title, locator] of sourceDocuments) {
  const id = `source.miyota.${calibre}.${type}`
  await json(`sources/${id}.json`, {
    id,
    authority: 'official-miyota',
    usage: 'official-linked',
    resource: { kind, title, locator },
    authorOrManufacturer: 'MIYOTA',
    sourceType: 'official-miyota-documentation',
    calibre,
    movement: `MIYOTA ${calibre}`,
    revision: 'Sin identificador de revisión publicado; URL vigente consultada el 2026-07-23.',
    retrievedAt: '2026-07-23',
    privateUse: false,
    supportedClaim: `Identidad, datos nominales o estructura documental oficial del MIYOTA ${calibre}; el alcance depende del documento citado.`,
    derivedLayer: 'source',
  })
}
await json('sources/source.horology.private-book.functional-systems.json', {
  id: bookSource,
  authority: 'private-book-theory',
  usage: 'private-local',
  resource: { kind: 'book', title: 'Libro privado de teoría relojera · sistemas funcionales' },
  sourceType: 'private-book',
  chapter: 'Sistemas funcionales y principios de funcionamiento',
  privateUse: true,
  supportedClaim: 'Marco teórico general usado a nivel de capítulo; no se copia texto ni se inventa paginación.',
  derivedLayer: 'source',
})
await json('sources/source.horology.original-functional-map.json', {
  id: originalSource,
  authority: 'original-educational',
  usage: 'user-created',
  resource: { kind: 'note', title: 'Blueprint editorial · primer módulo funcional' },
  authorOrManufacturer: 'Watch Prototype Lab',
  sourceType: 'original-educational-content',
  importedAt: '2026-07-23',
  privateUse: true,
  supportedClaim: 'Estructura pedagógica, escenas, actividades y explicaciones originales del primer módulo.',
  derivedLayer: 'source',
})

const curatedSources = new Map()
for (const relative of [
  ...sourceDocuments.map(([calibre, type]) => `sources/source.miyota.${calibre}.${type}.json`),
  'sources/source.horology.private-book.functional-systems.json',
  'sources/source.horology.original-functional-map.json',
]) {
  const source = JSON.parse(await readFile(join(root, relative), 'utf8'))
  curatedSources.set(source.id, source)
}
const embeddedSourceAliases = new Map([
  ['source.miyota.2035.parts', 'source.miyota.2035.parts-list-exploded-view'],
  ['source.miyota.8215.parts', 'source.miyota.8215.parts-list-exploded-view'],
])
function polishFoundationBody(blockId, body) {
  const shared = body
    .replaceAll('Reduced motion', 'La opción de movimiento reducido')
    .replaceAll('reduced motion', 'movimiento reducido')
    .replaceAll('namespace', 'identidad técnica')
    .replaceAll('G/K/P', 'límites de fidelidad')
    .replaceAll('## Feedback', '## Ayuda después de responder')
    .replaceAll('El feedback', 'La ayuda')
    .replaceAll('blueprint editorial', 'plan editorial')
    .replaceAll('de forma determinista', 'de forma comprobable automáticamente')
    .replaceAll('componentes deterministas', 'componentes verificables')
  const replacements = {
    'block.horology.system': [
      ['La siguiente lección aplicará este mapa a una cadena de cuarzo y presentará cada componente antes de pedirte que ordenes el recorrido.', 'La siguiente lección aplicará este mapa a la cadena mecánica. Presentará muelle real, barrilete, tren, escape, volante y espiral antes de pedirte que ordenes el recorrido.'],
    ],
    'block.horology.mechanical-chain': [
      ['Este módulo no calcula ni valida esos valores en el fixture. Su física permanece P0.', 'Este módulo no calcula ni valida esos valores en el modelo didáctico. La ficha técnica aclara que no simula la física de una unidad real.'],
      ['El modelo mecánico conceptual usa proporciones claras y declara G1/K2/P0. El MIYOTA 8215 aparece como ensamblaje estructural R2.', 'El modelo mecánico conceptual usa proporciones claras y publica sus límites en la ficha técnica. El MIYOTA 8215 aparece como un ensamblaje estructural separado.'],
      ['La siguiente lección compara esta solución con el cuarzo por funciones, delimitando dónde la analogía ayuda y dónde falla.', 'La siguiente lección presenta la cadena de cuarzo desde la pila hasta las agujas. Después podrás comparar ambas soluciones por función sin confundir sus piezas.'],
    ],
    'block.horology.quartz-chain': [
      ['Por ello la ruta se declara como educativa y P0.', 'Por ello la ruta se declara educativa y no simula la física de una unidad real.'],
      ['Que el fixture R2 permita seleccionar una pieza no convierte su geometría reconstruida en geometría oficial completa.', 'Que el modelo estructural permita seleccionar una pieza no convierte su geometría reconstruida en geometría oficial completa.'],
      ['La próxima lección utiliza la experiencia con el ISA 8172 para separar lo visto, lo recordado, lo inferido y lo documentado.', 'La siguiente lección compara la cadena de cuarzo con la mecánica por funciones y muestra dónde la analogía ayuda y dónde deja de ser válida. El mapa del ISA 8172 queda como profundización opcional para trabajar la confianza de las fuentes.'],
    ],
    'block.horology.isa8172-confidence': [
      ['Con esta disciplina de fuentes, la siguiente lección aborda la cadena mecánica y distingue claramente identidad documentada de animación conceptual.', 'Esta profundización opcional termina con una regla práctica: separar siempre experiencia, documentación e inferencia. Después puedes volver a la comparación funcional o al diagnóstico de interrupciones sin convertir un recuerdo en un dato oficial.'],
    ],
    'block.horology.functional-equivalence': [
      ['Cada pareja comparte símbolo funcional, pero mantiene namespace, procedencia y G/K/P propios.', 'Cada pareja comparte un símbolo funcional, pero conserva su identidad técnica, procedencia y límites de fidelidad propios.'],
    ],
    'block.horology.failure-prediction': [
      ['Cada caso conserva P0 y se restaura.', 'Cada caso evita simular una física no validada y puede restaurarse.'],
    ],
  }
  return (replacements[blockId] ?? []).reduce((result, [before, after]) => result.replace(before, after), shared)
}
for (const blockId of [
  'block.horology.system',
  'block.horology.quartz-chain',
  'block.horology.isa8172-confidence',
  'block.horology.mechanical-chain',
  'block.horology.functional-equivalence',
  'block.horology.failure-prediction',
]) {
  const path = join(root, 'blocks', `${blockId}.json`)
  const block = JSON.parse(await readFile(path, 'utf8'))
  block.bodyMarkdown = polishFoundationBody(blockId, block.bodyMarkdown)
  block.claims = block.claims.map((claim) => ({
    ...claim,
    sources: claim.sources.map((source) => {
      const id = embeddedSourceAliases.get(source.id) ?? source.id
      return curatedSources.get(id) ?? source
    }),
  }))
  await writeFile(path, `${JSON.stringify(block, null, 2)}\n`, 'utf8')
}

const lessonIds = [
  'lesson.horology.system',
  'lesson.horology.mechanical-chain',
  'lesson.horology.quartz-chain',
  'lesson.horology.functional-equivalence',
  'lesson.horology.failure-prediction',
  'lesson.horology.isa8172-confidence',
]
const visualResources = [
  ['complete-watch-layers', 'conceptual-3d', ['lesson.horology.system'], 'fixture.conceptual.mechanical-chain', 'yes'],
  ['quartz-energy-flow', 'energy-flow-diagram', ['lesson.horology.quartz-chain'], 'fixture.conceptual.quartz-chain', 'yes'],
  ['miyota2035-structural', 'real-movement-3d', ['lesson.horology.quartz-chain', 'lesson.horology.isa8172-confidence'], 'fixture.miyota.2035.structural', 'yes'],
  ['isa8172-memory-map', 'schematic-2d', ['lesson.horology.isa8172-confidence'], 'fixture.conceptual.quartz-chain', 'yes'],
  ['mechanical-energy-flow', 'energy-flow-diagram', ['lesson.horology.mechanical-chain'], 'fixture.conceptual.mechanical-chain', 'yes'],
  ['swiss-lever-slow-motion', 'kinematic-animation', ['lesson.horology.mechanical-chain'], 'fixture.miyota.8215.structural', 'yes'],
  ['quartz-mechanical-overlay', 'overlay-comparison', ['lesson.horology.functional-equivalence'], 'fixture.conceptual.quartz-chain', 'yes'],
  ['failure-simulation', 'error-simulation', ['lesson.horology.failure-prediction'], 'fixture.miyota.8215.structural', 'yes'],
  ['functional-text-alternative', 'accessible-text-alternative', lessonIds, 'fixture.conceptual.quartz-chain', 'yes'],
]
for (const [slug, type, lessons, movement, support] of visualResources) {
  await json(`visual-resources/visual.horology.${slug}.json`, {
    id: `visual.horology.${slug}`,
    version,
    type,
    purpose: es(`Soportar ${slug.replaceAll('-', ' ')} con selectores, procedencia y alternativa accesible.`),
    status: support === 'yes' ? 'ready' : 'planned',
    sourceIds: [originalSource, ...(movement.includes('2035') ? source2035 : []), ...(movement.includes('8215') ? source8215 : [])],
    fidelity: movement.includes('miyota') ? fidelityReal : fidelityConceptual,
    lessonIds: lessons,
    movementIds: [movement],
    partSelectors: [],
    requiredCapabilities: capabilities.map((value) => value.split('@')[0]),
    dataRequirements: ['Modelo técnico 4B intacto.', 'Identidad de cada pieza estable.', 'Alternativa textual funcional.'],
    priority: support === 'yes' ? 'high' : 'medium',
    dependencyIds: [],
    currentModelSupport: support,
    viewportImpact: support === 'yes' ? 'configuration' : 'extension',
  })
}

for (const [slug, competency] of competencies.map(([slug]) => [slug, `competency.horology.${slug}`])) {
  const evidenceId = evidence.find(([, evidenceCompetency]) => evidenceCompetency === slug)?.[0]
  await json(`recommendations/recommendation.horology.retain-${slug}.json`, {
    id: `recommendation.horology.retain-${slug}`,
    version,
    kind: 'retention',
    title: es(`Comprobar retención: ${slug.replaceAll('-', ' ')}`),
    reason: es('Una demostración inicial no basta para considerarlo consolidado. Se necesita evidencia independiente posterior, en otra sesión y sobre un contexto distinto.'),
    rule: 'independent-later-evidence-different-session@1.0.0',
    priority: 60,
    target: { kind: 'competency', id: competency },
    evidenceTemplateIds: evidenceId ? [`evidence.horology.${evidenceId}`] : [],
    required: false,
  })
}

const normalizedReferences = new Map([
  ['source.miyota.2035.product', 'source.miyota.2035.product-page'],
  ['source.miyota.2035.parts', 'source.miyota.2035.parts-list-exploded-view'],
  ['source.miyota.8215.product', 'source.miyota.8215.product-page'],
  ['source.miyota.8215.parts', 'source.miyota.8215.parts-list-exploded-view'],
  ['fixture.miyota-2035', 'fixture.miyota.2035.structural'],
  ['fixture.miyota-8215', 'fixture.miyota.8215.structural'],
  ['fixture.quartz-conceptual', 'fixture.conceptual.quartz-chain'],
  ['fixture.mechanical-conceptual', 'fixture.conceptual.mechanical-chain'],
])
function normalizeReferences(value) {
  if (typeof value === 'string') return normalizedReferences.get(value) ?? value
  if (Array.isArray(value)) return value.map(normalizeReferences)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeReferences(item)]))
  }
  return value
}
for (const relative of [
  'routes/route.horology.orientation.json',
  'modules/module.horology.functional-map.json',
  ...lessonIds.map((id) => `lessons/${id}.json`),
]) {
  const path = join(root, relative)
  const document = normalizeReferences(JSON.parse(await readFile(path, 'utf8')))
  if (document.id === 'module.horology.functional-map') {
    // La lección documental del ISA se conserva con su ID histórico, pero es
    // una profundización opcional. El recorrido inicial construye primero el
    // reloj completo, la cadena mecánica y la cadena de cuarzo.
    document.lessonIds = [...lessonIds]
  }
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
}

const manifestPath = join(root, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
manifest.packageVersion = version
manifest.minimumAppVersion = '0.10.0'
manifest.title = 'Cómo funciona un reloj de principio a fin'
manifest.entries.lessons = lessonIds.map((id) => ({ id, path: `lessons/${id}.json` }))
manifest.movements = [
  { manufacturer: 'MIYOTA', calibre: '2035', referenceId: 'fixture.miyota.2035.structural' },
  { manufacturer: 'MIYOTA', calibre: '8215', referenceId: 'fixture.miyota.8215.structural' },
]
manifest.entries.evidenceTemplates = evidence.map(([slug]) => ({
  id: `evidence.horology.${slug}`,
  path: `evidence/evidence.horology.${slug}.json`,
}))
manifest.entries.scenes = [
  ...manifest.entries.scenes.filter(({ id }) => !id.startsWith('scene.horology.activity.')),
  ...activitySceneEntries,
]
manifest.entries.sources = [
  ...sourceDocuments.map(([calibre, type]) => ({
    id: `source.miyota.${calibre}.${type}`,
    path: `sources/source.miyota.${calibre}.${type}.json`,
  })),
  { id: bookSource, path: 'sources/source.horology.private-book.functional-systems.json' },
  { id: originalSource, path: 'sources/source.horology.original-functional-map.json' },
]
manifest.entries.recommendations = competencies.map(([slug]) => ({
  id: `recommendation.horology.retain-${slug}`,
  path: `recommendations/recommendation.horology.retain-${slug}.json`,
}))
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(`Sistema 4C materializado en ${root}`)
console.log('16 escenas · 10 actividades · 10 comprobaciones específicas · 6 competencias · 11 evidencias · 6 rúbricas · 36 términos')
