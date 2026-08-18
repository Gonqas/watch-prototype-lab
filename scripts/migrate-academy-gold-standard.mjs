import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const workspace = resolve(import.meta.dirname, '..')
const packRoots = [
  'horology-foundations',
  'quartz-miyota2035',
  'mechanical-foundations',
  'miyota8215',
]

const VERSION = '0.5.0'
const APP_VERSION = '0.10.0'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function localized(es, en) {
  return en ? { es, en } : { es }
}

function loadEntries(root, entries) {
  return entries.map((entry) => ({
    entry,
    path: resolve(root, entry.path),
    value: readJson(resolve(root, entry.path)),
  }))
}

const KNOWLEDGE_TYPE_LABELS = {
  terminology: 'vocabulario técnico contextualizado',
  'conceptual-causal': 'relación entre causas y efectos',
  spatial: 'relaciones espaciales entre piezas',
  quantitative: 'razonamiento con magnitudes y proporciones',
  procedural: 'procedimiento ordenado y verificable',
  diagnostic: 'diagnóstico por observaciones e hipótesis',
  epistemic: 'alcance, procedencia y límites del conocimiento',
}

const SUBSYSTEM_LABELS = {
  train: 'tren de ruedas',
  keyless: 'cuerda y puesta en hora',
  'motion-works': 'minutería',
  'power-source': 'fuente de energía',
  'electronic-control': 'control electrónico',
  'quartz-resonator': 'resonador de cuarzo',
  'stepper-rotor': 'rotor paso a paso',
  escapement: 'escape',
  oscillator: 'oscilador',
  indication: 'indicación',
  calendar: 'calendario',
  automatic: 'carga automática',
  structure: 'estructura y puentes',
  'system-overview': 'sistema relojero completo',
}

function humanSubsystem(value) {
  if (!value) return 'sistema relojero'
  return SUBSYSTEM_LABELS[value] ?? value.replaceAll('-', ' ')
}

function observableActionsFor(concept) {
  const title = concept.title.es.toLocaleLowerCase('es')
  const subsystem = humanSubsystem(concept.subsystem)
  const actions = {
    terminology: [
      `Nombrar ${title} con palabras comunes y con el término técnico correcto.`,
      `Señalarlo en el modelo sin confundirlo con una pieza vecina.`,
    ],
    'conceptual-causal': [
      `Explicar la entrada, la relación y el resultado observable asociados a «${title}» dentro de la cadena funcional.`,
      `Predecir qué cambiaría al interrumpir una interfaz del subsistema ${subsystem}.`,
    ],
    spatial: [
      `Localizar en el modelo los elementos implicados en «${title}» y justificar su posición por sus relaciones funcionales.`,
      `Distinguir contacto, apoyo y simple proximidad en la vista disponible.`,
    ],
    quantitative: [
      `Relacionar una magnitud observable con ${title} sin confundirla con otra.`,
      `Comprobar el sentido o la proporción mediante un ejemplo trazable.`,
    ],
    procedural: [
      `Aplicar «${title}» sin perder identidad, orientación ni capacidad de restaurar el estado inicial.`,
      `Explicar el criterio usado antes de confirmar cada paso.`,
    ],
    diagnostic: [
      `Al trabajar con «${title}», separar síntoma, observación e hipótesis.`,
      `Proponer una comprobación que pueda confirmar o refutar la hipótesis.`,
    ],
    epistemic: [
      `Al estudiar «${title}», distinguir qué información es oficial, medida, deducida, estimada o desconocida.`,
      `Citar la fuente y declarar el límite antes de extraer una conclusión.`,
    ],
  }
  return (actions[concept.knowledgeType] ?? actions['conceptual-causal']).map((es) => localized(es))
}

function whyItMattersFor(concept) {
  const byKind = {
    concept: `Este concepto permite relacionar «${concept.title.es}» con el funcionamiento del reloj completo, en lugar de memorizar piezas aisladas.`,
    skill: `Esta habilidad permite aplicar «${concept.title.es}» de forma documentada, reversible y segura.`,
    subsystem: `Este subsistema permite seguir causas y efectos al estudiar «${concept.title.es}».`,
  }
  return localized(byKind[concept.kind])
}

function tutorContract(scopeConceptIds) {
  return {
    scopeConceptIds: [...new Set(scopeConceptIds)],
    allowedActions: [
      'orient',
      'ask-socratic-question',
      'explain-declared-content',
      'point-to-source',
      'suggest-remediation',
      'summarize-visible-state',
    ],
    forbiddenClaims: [
      localized('No inventar dimensiones, contactos, materiales ni comportamiento físico no declarado.'),
      localized('No presentar una simulación educativa como validación de ingeniería o competencia manual.'),
      localized('No calificar al estudiante ni sustituir la evidencia exigida por la actividad.'),
    ],
    promptStarters: [
      localized('¿Qué estás observando exactamente, sin interpretarlo todavía?'),
      localized('¿Qué pieza entrega movimiento y cuál lo recibe?'),
      localized('¿Qué fuente respalda esa conclusión?'),
      localized('¿Qué cambiaría si esa relación se interrumpiera?'),
    ],
    requiresSourceForTechnicalClaims: true,
    authority: 'coach-not-assessor',
  }
}

function createFeedback(activity, conceptById, misconceptionIds) {
  const contract = activity.authoring.pedagogicalContract ?? {
    assessesConceptIds: [],
    demonstratesConceptIds: [],
    practicesConceptIds: [],
  }
  const targetIds = [
    ...(contract.assessesConceptIds ?? []),
    ...(contract.demonstratesConceptIds ?? []),
    ...(contract.practicesConceptIds ?? []),
  ]
  const target = [
    ...new Set(targetIds.map((id) => conceptById.get(id)?.title.es).filter(Boolean)),
  ].slice(0, 2)
  const targetText = target.length > 0
    ? target.join(' y ').toLocaleLowerCase('es')
    : humanSubsystem(activity.authoring.subsystem)
  return {
    correctExplanation: localized(
      `La respuesta encaja con las relaciones observables de ${targetText}. El acierto cuenta como evidencia de esta actividad, no como dominio automático.`,
    ),
    incorrectDiagnosis: localized(
      `La respuesta no coincide todavía con la cadena causal declarada para ${targetText}. Revisa qué elemento recibe la acción, cuál la transmite y qué resultado observable produce.`,
    ),
    causalQuestion: localized(
      '¿Qué cambio observas antes y después de la acción, y qué relación entre piezas explica ese cambio?',
    ),
    nextObservation: localized(
      'Vuelve al modelo, sigue una sola relación desde su origen hasta su efecto y compárala con la alternativa textual antes de reintentar.',
    ),
    misconceptionIds: [...new Set(misconceptionIds)],
    transferPrompt: localized(
      '¿Cómo reconocerías la misma función en otro reloj aunque las piezas tuvieran otra forma o disposición?',
    ),
    requiresIndependentRetryAfterHint: true,
  }
}

const misconceptionCatalog = {
  'horology-foundations': [
    {
      id: 'misconception.horology.near-means-connected',
      title: 'Estar cerca no significa estar conectado',
      learnerExpression: 'Dos piezas próximas deben tocarse o transmitir movimiento entre sí.',
      diagnosis: 'Se está usando la proximidad visual como sustituto de una interfaz, apoyo o engrane declarado.',
      correction: 'Una relación funcional exige evidencia de contacto, engrane, apoyo o accionamiento; la cercanía por sí sola no la demuestra.',
      signals: ['Clasifica piezas por posición en vez de seguir relaciones.', 'Afirma que dos ruedas engranan sin comprobar sus interfaces.'],
      concepts: ['concept.horology.part-language', 'concept.horology.functional-chain'],
      lesson: 'lesson.horology.system',
    },
    {
      id: 'misconception.horology.train-is-energy-source',
      title: 'El tren transmite; no crea la energía',
      learnerExpression: 'El tren de ruedas es la fuente de energía del reloj.',
      diagnosis: 'Se confunde almacenar energía con transmitir movimiento y par.',
      correction: 'La fuente almacena o entrega energía; el tren la transmite entre etapas con una relación de movimiento.',
      signals: ['Elige energía como función del tren.', 'No distingue barrilete o pila de la transmisión.'],
      concepts: ['concept.horology.functional-chain', 'concept.horology.mechanical-chain'],
      lesson: 'lesson.horology.system',
    },
    {
      id: 'misconception.horology.escapement-creates-energy',
      title: 'El escape dosifica la energía',
      learnerExpression: 'El escape produce la energía que mantiene el reloj en marcha.',
      diagnosis: 'Se confunde regular la liberación de energía con crearla.',
      correction: 'El escape bloquea y libera el tren en impulsos; recibe energía de la fuente a través del tren.',
      signals: ['Sitúa el escape al inicio de la cadena energética.', 'No puede explicar qué impulsa el volante.'],
      concepts: ['concept.horology.mechanical-chain'],
      lesson: 'lesson.horology.mechanical-chain',
    },
    {
      id: 'misconception.horology.quartz-has-no-train',
      title: 'Un reloj de cuarzo también transmite movimiento',
      learnerExpression: 'Como el control es electrónico, el cuarzo no necesita tren de ruedas.',
      diagnosis: 'Se está confundiendo la referencia temporal electrónica con la transmisión mecánica hasta las agujas.',
      correction: 'El circuito controla el paso a paso y el rotor entrega movimiento a un tren que mueve la indicación.',
      signals: ['Salta de circuito a agujas.', 'No sitúa bobina, rotor y tren en orden.'],
      concepts: ['concept.horology.quartz-chain', 'concept.horology.functional-equivalence'],
      lesson: 'lesson.horology.quartz-chain',
    },
    {
      id: 'misconception.horology.simulation-is-physical-proof',
      title: 'La simulación no acredita el objeto físico',
      learnerExpression: 'Si funciona en el modelo, queda demostrado que el reloj real funciona así.',
      diagnosis: 'Se ha borrado el límite entre modelo educativo, dato documental y validación física.',
      correction: 'La simulación sirve para explicar relaciones declaradas; una conclusión física requiere observación, medición y evidencia de la unidad concreta.',
      signals: ['Presenta G/K/P como precisión del calibre.', 'Convierte una animación normalizada en diagnóstico físico.'],
      concepts: ['concept.horology.source-confidence', 'concept.horology.system-interruption'],
      lesson: 'lesson.horology.isa8172-confidence',
    },
  ],
  'quartz-miyota2035': [
    {
      id: 'misconception.quartz2035.image-is-official-dimension',
      title: 'Una proporción visual no es una cota oficial',
      learnerExpression: 'Puedo obtener dimensiones oficiales midiendo la imagen o el modelo reconstruido.',
      diagnosis: 'Se confunde una reconstrucción visual con un dato nominal publicado o medido.',
      correction: 'Las dimensiones oficiales proceden del documento oficial; una estimación visual debe conservar esa clasificación.',
      signals: ['Cita el modelo como plano oficial.', 'Omite la clase de procedencia de una dimensión.'],
      concepts: ['concept.quartz2035.distinguish-observation-inference', 'concept.quartz2035.locate-official-data'],
    },
    {
      id: 'misconception.quartz2035.virtual-equals-manual-skill',
      title: 'La secuencia virtual no acredita destreza manual',
      learnerExpression: 'Completar el montaje virtual demuestra que puedo intervenir el 2035 físico.',
      diagnosis: 'Se confunde comprensión procedural con control de herramienta, fuerza, limpieza y riesgo físico.',
      correction: 'La simulación acredita razonamiento y orden; la competencia manual exige práctica física supervisada y evidencia propia.',
      signals: ['Omite el límite físico en la evidencia.', 'Da por segura una operación por haberla simulado.'],
      concepts: ['concept.quartz2035.disassemble-virtually', 'concept.quartz2035.assemble-virtually'],
    },
    {
      id: 'misconception.quartz2035.symptom-is-diagnosis',
      title: 'Un síntoma no determina una causa única',
      learnerExpression: 'Si el reloj se para, ya sé qué pieza está averiada.',
      diagnosis: 'Se ha saltado la separación entre síntoma, observación, hipótesis y prueba discriminante.',
      correction: 'Un síntoma abre varias hipótesis; la siguiente comprobación debe reducirlas sin afirmar más de lo observado.',
      signals: ['Propone sustituir una pieza antes de comprobar.', 'No formula una prueba que pueda refutar su hipótesis.'],
      concepts: ['concept.quartz2035.observe-before-disassembly', 'concept.quartz2035.reason-about-symptom'],
    },
  ],
  'mechanical-foundations': [
    {
      id: 'misconception.mechanical.near-gears-mesh',
      title: 'Dos ruedas próximas no necesariamente engranan',
      learnerExpression: 'Si dos ruedas se solapan en la vista, forman una pareja de engrane.',
      diagnosis: 'Se infiere el engrane desde una proyección visual sin comprobar plano, distancia entre centros e interfaces.',
      correction: 'El engrane debe estar declarado y ser compatible; la vista puede ocultar diferencias de altura.',
      signals: ['Traza energía por ruedas sin relación meshes-with.', 'Ignora el orden de capas.'],
      concepts: ['concept.mechanical.build-functional-train', 'concept.mechanical.recognize-supports-clearances'],
    },
    {
      id: 'misconception.mechanical.frequency-is-amplitude',
      title: 'Frecuencia y amplitud describen cosas distintas',
      learnerExpression: 'Un volante que oscila con mayor ángulo siempre tiene mayor frecuencia.',
      diagnosis: 'Se confunde el tamaño de la oscilación con el número de ciclos por unidad de tiempo.',
      correction: 'La amplitud describe el ángulo; la frecuencia describe cuántos ciclos ocurren por unidad de tiempo.',
      signals: ['Usa grados para describir frecuencia.', 'Interpreta una oscilación amplia como necesariamente más rápida.'],
      concepts: ['concept.mechanical.distinguish-frequency-amplitude', 'concept.mechanical.explain-escape-oscillator-system'],
    },
    {
      id: 'misconception.mechanical.escapement-is-source',
      title: 'El escape no sustituye al barrilete',
      learnerExpression: 'El escape impulsa todo el tren y por eso es la fuente.',
      diagnosis: 'Se invierte la dirección causal entre almacenamiento, transmisión y regulación.',
      correction: 'El barrilete entrega energía al tren; el escape controla su liberación e impulsa el oscilador.',
      signals: ['Dibuja la ruta energética desde el escape.', 'No distingue regulación de transmisión.'],
      concepts: ['concept.mechanical.explain-barrel', 'concept.mechanical.explain-energy-chain', 'concept.mechanical.order-escapement-phases'],
    },
  ],
  miyota8215: [
    {
      id: 'misconception.miyota8215.r2-is-exact-twin',
      title: 'R2 no es un gemelo exacto del 8215',
      learnerExpression: 'Todo lo que aparece en el ensamblaje tiene dimensiones y comportamiento oficial exactos.',
      diagnosis: 'Se interpreta un ensamblaje estructural como reproducción medida y validada.',
      correction: 'R2 individualiza estructura y relaciones; las estimaciones y límites G/K/P siguen siendo explícitos.',
      signals: ['Usa el modelo como metrología.', 'Omite distinguir dato oficial y reconstrucción.'],
      concepts: ['concept.miyota8215.distinguish-data-reconstruction', 'concept.miyota8215.declare-fidelity-limits'],
    },
    {
      id: 'misconception.miyota8215.hidden-subsystem-is-new-calibre',
      title: 'Ocultar un subsistema no crea otro calibre',
      learnerExpression: 'La vista sin automático o calendario representa una variante real distinta.',
      diagnosis: 'Se confunde una vista educativa reversible con una identidad de producto.',
      correction: 'Las vistas aíslan subsistemas del mismo ensamblaje canónico y no cambian su identidad.',
      signals: ['Nombra una vista como otro calibre.', 'Pierde la identidad al restaurar.'],
      concepts: ['concept.miyota8215.identify-calibre', 'concept.miyota8215.recognize-subsystems'],
    },
    {
      id: 'misconception.miyota8215.symptom-is-cause',
      title: 'El síntoma no basta para diagnosticar',
      learnerExpression: 'Una marcha irregular señala directamente una única pieza culpable.',
      diagnosis: 'Se afirma una causa sin observaciones discriminantes ni una prueba trazable.',
      correction: 'El diagnóstico formula hipótesis, declara incertidumbre y selecciona la siguiente comprobación segura.',
      signals: ['Confunde observación con conclusión.', 'No conserva hipótesis alternativas.'],
      concepts: ['concept.miyota8215.inspect', 'concept.miyota8215.form-hypothesis', 'concept.miyota8215.conceptual-diagnosis'],
    },
  ],
}

const foundationOrder = [
  ['01', 'activity.horology.classify-subsystems', 'Reconocer las funciones del reloj', 'Distinguir fuente, control o regulación, transmisión, indicación y estructura.', 'orientation', 'recognition', false],
  ['05', 'activity.horology.identify-escapement-oscillator', 'Reconocer escape y oscilador', 'Distinguir transmisión, liberación e impulsos en el modelo mecánico.', 'explanation', 'causal-explanation', false],
  ['06', 'activity.horology.order-mechanical-chain', 'Reconstruir la cadena mecánica', 'Ordenar de forma independiente la energía desde el muelle hasta las agujas.', 'independent-practice', 'independent-simulation', false],
  ['02', 'activity.horology.identify-time-reference', 'Seguir la referencia temporal de cuarzo', 'Localizar control electrónico, bobina, rotor paso a paso y transmisión.', 'explanation', 'causal-explanation', false],
  ['03', 'activity.horology.order-quartz-chain', 'Reconstruir la cadena de cuarzo', 'Ordenar de forma independiente la energía y el control hasta la indicación.', 'independent-practice', 'independent-simulation', false],
  ['07', 'activity.horology.match-functional-equivalents', 'Comparar cuarzo y mecánica', 'Relacionar soluciones distintas que cumplen una función equivalente.', 'transfer', 'transfer', false],
  ['08', 'activity.horology.predict-interruption', 'Predecir una interrupción', 'Anticipar qué deja de ocurrir cuando una relación funcional se bloquea.', 'guided-practice', 'causal-explanation', false],
  ['09', 'activity.horology.select-affected-subsystem', 'Localizar el subsistema afectado', 'Vincular un cambio observable con el subsistema que puede explicarlo.', 'independent-practice', 'transfer', false],
  ['10', 'activity.horology.justify-hypothesis', 'Justificar una hipótesis comprobable', 'Cerrar el recorrido con una explicación causal, fuentes y límites.', 'transfer', 'transfer', false],
  ['04', 'activity.horology.isa-confidence-map', 'Profundizar en la confianza documental', 'Separar datos documentados, recuerdos e inferencias cuando necesites evaluar una fuente.', 'transfer', 'transfer', true],
]

function misconceptionValues(packName, conceptById, lessons) {
  const fallbackLesson = lessons[0].value.id
  return (misconceptionCatalog[packName] ?? []).map((definition) => {
    const sourceIds = [...new Set(definition.concepts.flatMap((id) => conceptById.get(id)?.sourceIds ?? []))].slice(0, 3)
    const lesson = definition.lesson
      ?? definition.concepts.map((id) => conceptById.get(id)?.bridgeLessonId).find(Boolean)
      ?? lessons.find(({ value }) => value.authoring?.conceptIds.some((id) => definition.concepts.includes(id)))?.value.id
      ?? fallbackLesson
    return {
      id: definition.id,
      version: VERSION,
      title: localized(definition.title),
      learnerExpression: localized(definition.learnerExpression),
      diagnosis: localized(definition.diagnosis),
      correction: localized(definition.correction),
      observableSignals: definition.signals,
      conceptIds: definition.concepts,
      remediationLessonId: lesson,
      sourceIds,
    }
  })
}

function milestoneMode(activity) {
  const purpose = activity.authoring.pedagogicalContract?.purpose
  const mapping = {
    diagnostic: 'orientation',
    'worked-example': 'worked-example',
    'guided-practice': 'guided-practice',
    'completion-problem': 'guided-practice',
    'independent-practice': 'independent-practice',
    'mastery-check': 'independent-practice',
    transfer: 'transfer',
    retention: 'retention',
  }
  return mapping[purpose] ?? 'guided-practice'
}

function requiresCausalExplanation(activity) {
  const contract = activity.authoring?.pedagogicalContract
  return Boolean(contract && (
    contract.supportLevel === 'independent'
    || ['mastery-check', 'transfer', 'retention'].includes(contract.purpose)
    || ['demonstration', 'retention'].includes(contract.assessmentIntent)
  ))
}

for (const packName of packRoots) {
  const root = resolve(workspace, 'learning-content', packName)
  const manifestPath = resolve(root, 'manifest.json')
  const manifest = readJson(manifestPath)
  manifest.packageVersion = VERSION
  manifest.minimumAppVersion = APP_VERSION
  manifest.dependencies = manifest.dependencies.map((dependency) => ({
    ...dependency,
    versionRange: dependency.packageId.startsWith('wplab.horology.') ? '^0.5.0' : dependency.versionRange,
  }))
  manifest.entries.misconceptions = []

  const concepts = loadEntries(root, manifest.entries.concepts)
  const modules = loadEntries(root, manifest.entries.modules)
  const lessons = loadEntries(root, manifest.entries.lessons)
  const activities = loadEntries(root, manifest.entries.activities)
  const scenes = loadEntries(root, manifest.entries.scenes)
  const routes = loadEntries(root, manifest.entries.routes)
  const conceptById = new Map(concepts.map(({ value }) => [value.id, value]))
  const moduleById = new Map(modules.map(({ value }) => [value.id, value]))
  const lessonById = new Map(lessons.map(({ value }) => [value.id, value]))
  const activityById = new Map(activities.map(({ value }) => [value.id, value]))
  const activityIdsRequiringExplanation = new Set(
    activities.filter(({ value }) => requiresCausalExplanation(value)).map(({ value }) => value.id),
  )
  const misconceptionValuesForPack = misconceptionValues(packName, conceptById, lessons)
  const misconceptionByConcept = new Map()

  for (const misconception of misconceptionValuesForPack) {
    for (const conceptId of misconception.conceptIds) {
      const values = misconceptionByConcept.get(conceptId) ?? []
      values.push(misconception.id)
      misconceptionByConcept.set(conceptId, values)
    }
    const path = `misconceptions/${misconception.id}.json`
    manifest.entries.misconceptions.push({ id: misconception.id, path })
    writeJson(resolve(root, path), misconception)
  }

  for (const item of concepts) {
    const concept = item.value
    concept.version = VERSION
    concept.plainLanguage = concept.plainLanguage ?? concept.summary
    concept.technicalLanguage = concept.technicalLanguage ?? localized(
      `${concept.title.es}. Se estudia como ${concept.kind === 'subsystem' ? 'subsistema' : concept.kind === 'skill' ? 'destreza' : 'concepto'} centrado en ${KNOWLEDGE_TYPE_LABELS[concept.knowledgeType] ?? KNOWLEDGE_TYPE_LABELS['conceptual-causal']}, dentro de ${humanSubsystem(concept.subsystem)}.`,
    )
    concept.whyItMatters = concept.whyItMatters ?? whyItMattersFor(concept)
    concept.observableActions = concept.observableActions?.length > 0
      ? concept.observableActions
      : observableActionsFor(concept)
    concept.transferTargetIds = concept.transferTargetIds?.length > 0
      ? concept.transferTargetIds
      : (concept.relatedIds ?? []).slice(0, 2)
    concept.misconceptionIds = [
      ...new Set([...(concept.misconceptionIds ?? []), ...(misconceptionByConcept.get(concept.id) ?? [])]),
    ]
    writeJson(item.path, concept)
  }

  for (const item of lessons) {
    const lesson = item.value
    lesson.version = VERSION
    if (lesson.authoring) {
      lesson.authoring.externalPrerequisites = (lesson.authoring.externalPrerequisites ?? []).map((prerequisite) => ({
        ...prerequisite,
        versionRange: prerequisite.packageId.startsWith('wplab.horology.')
          ? '^0.5.0'
          : prerequisite.versionRange,
      }))
      lesson.authoring.tutorContract = tutorContract(lesson.authoring.conceptIds)
    }
    writeJson(item.path, lesson)
  }

  const enrichedSceneIds = new Set()
  for (const item of scenes) {
    const scene = item.value
    const sceneUsedByLearningActivity = activities.some(({ value: activity }) => activity.sceneIds.includes(scene.id))
    if (!sceneUsedByLearningActivity) continue
    const recognitionKinds = new Set(['single-choice', 'multiple-choice', 'entity-selection', 'ordered-list'])
    const step = [...scene.steps].reverse().find(({ questions }) =>
      questions.some(({ responseKind }) => recognitionKinds.has(responseKind)))
    if (!step) continue
    const questionId = `question.${scene.id.replace('scene.', '')}.causal-explanation`
    if (!step.questions.some(({ responseKind }) => responseKind === 'structured-response')) {
      step.questions.push({
        id: questionId,
        promptMarkdown: 'Explica con tus palabras qué observaste y qué relación causal justifica tu respuesta.',
        responseKind: 'structured-response',
        options: [],
        structuredFields: [
          {
            id: 'field.observation',
            label: 'Qué observaste antes y después',
            kind: 'short-text',
            required: true,
            optionIds: [],
          },
          {
            id: 'field.causal-link',
            label: 'Qué pieza o subsistema actúa y cuál recibe el efecto',
            kind: 'short-text',
            required: true,
            optionIds: [],
          },
          {
            id: 'field.confidence',
            label: 'Confianza en la explicación',
            kind: 'confidence',
            required: true,
            optionIds: [],
          },
        ],
        hints: [],
        humanReviewRequired: true,
        authoring: {
          prompt: localized('Explica con tus palabras qué observaste y qué relación causal justifica tu respuesta.'),
          feedback: localized('La explicación queda registrada como evidencia razonada. El sistema comprueba que esté completa; una revisión humana puede valorar su calidad.'),
        },
      })
      step.success = step.success ?? []
      step.success.push({
        condition: 'structured-answer',
        questionId,
        requiredFieldIds: ['field.observation', 'field.causal-link', 'field.confidence'],
        pendingHumanReview: true,
      })
    }
    enrichedSceneIds.add(scene.id)
    writeJson(item.path, scene)
  }

  for (const item of activities) {
    const activity = item.value
    activity.version = VERSION
    if (activity.authoring) {
      const conceptScope = [
        ...(activity.authoring.pedagogicalContract?.requiresConceptIds ?? []),
        ...(activity.authoring.pedagogicalContract?.introducesConceptIds ?? []),
        ...(activity.authoring.pedagogicalContract?.demonstratesConceptIds ?? []),
        ...(activity.authoring.pedagogicalContract?.practicesConceptIds ?? []),
        ...(activity.authoring.pedagogicalContract?.assessesConceptIds ?? []),
      ]
      const misconceptionIds = [...new Set(conceptScope.flatMap((id) => misconceptionByConcept.get(id) ?? []))]
      activity.authoring.feedbackContract = createFeedback(activity, conceptById, misconceptionIds)
      activity.authoring.tutorContract = tutorContract(conceptScope)
      if (
        requiresCausalExplanation(activity)
        && activity.sceneIds.some((sceneId) => enrichedSceneIds.has(sceneId))
        && activity.authoring.interactionContract
      ) {
        activity.authoring.interactionContract.responseModel = 'structured-response'
        activity.authoring.interactionContract.orderedItems = []
        activity.authoring.interactionContract.expectedOrderIds = []
        activity.authoring.interactionContract.structuredFields = [
          { id: 'field.observation', label: localized('Qué observaste antes y después'), kind: 'short-text', required: true },
          { id: 'field.causal-link', label: localized('Qué relación explica el cambio'), kind: 'short-text', required: true },
          { id: 'field.confidence', label: localized('Confianza en la explicación'), kind: 'confidence', required: true },
        ]
        activity.authoring.interactionContract.evidencePolicy = {
          ...activity.authoring.interactionContract.evidencePolicy,
          deterministicComponents: ['field.observation', 'field.causal-link', 'field.confidence'],
          requiresHumanReview: true,
        }
      }
    }
    writeJson(item.path, activity)
  }

  for (const item of routes) {
    const route = item.value
    route.version = VERSION
    let milestones
    if (packName === 'horology-foundations') {
      milestones = foundationOrder.map(([stableId, activityId, title, outcome, mode, evidenceLevel, optional], index) => {
        const activity = activityById.get(activityId)
        return {
          // El ID permanece estable para conservar progreso y evidencias aunque
          // cambie la secuencia pedagógica visible.
          id: `milestone.horology.gold.${stableId}`,
          order: index + 1,
          title: localized(title),
          outcome: localized(outcome),
          lessonId: activity.authoring.lessonId,
          activityId,
          mode,
          evidenceLevel,
          optional,
          transferTargetIds: activity.authoring.pedagogicalContract?.assessesConceptIds ?? [],
        }
      })
    } else {
      const routeLessonIds = route.moduleIds.flatMap((moduleId) => moduleById.get(moduleId)?.lessonIds ?? [])
      const routeLessons = routeLessonIds.map((lessonId) => lessonById.get(lessonId)).filter(Boolean)
      milestones = routeLessons.map((lesson, index) => {
        const activity = lesson.activityIds.map((id) => activityById.get(id)).find(Boolean)
        const contract = activity?.authoring?.pedagogicalContract
        return {
          id: `milestone.${route.id.replace('route.', '')}.${String(index + 1).padStart(2, '0')}`,
          order: index + 1,
          title: lesson.authoring?.title ?? localized(lesson.title),
          outcome: lesson.authoring?.purpose ?? localized(lesson.title),
          lessonId: lesson.id,
          activityId: activity?.id,
          mode: activity ? milestoneMode(activity) : 'explanation',
          evidenceLevel: contract?.evidenceLevel ?? 'causal-explanation',
          optional: false,
          transferTargetIds: contract?.assessesConceptIds ?? [],
        }
      })
    }
    const routeLessonIds = new Set(route.moduleIds.flatMap((moduleId) => moduleById.get(moduleId)?.lessonIds ?? []))
    const routeActivities = activities.filter(({ value }) => routeLessonIds.has(value.authoring?.lessonId))
    const diagnosticActivityIds = routeActivities
      .filter(({ value }) => value.authoring?.pedagogicalContract?.purpose === 'diagnostic')
      .map(({ value }) => value.id)
    const demonstrationActivityIds = routeActivities
      .filter(({ value }) => ['demonstration', 'retention'].includes(value.authoring?.pedagogicalContract?.assessmentIntent))
      .map(({ value }) => value.id)
    const isFoundation = packName === 'horology-foundations'
    const isBenchFoundation = route.id === 'route.horology.bench-foundations'
    route.learningDesign = {
      model: isFoundation ? 'gold-standard' : 'specialization',
      entryPolicy: isFoundation || isBenchFoundation ? 'start-from-zero' : 'diagnostic-optional',
      completionPolicy: isBenchFoundation ? 'practice' : 'evidence',
      milestones,
      diagnosticActivityIds,
      demonstrationActivityIds,
    }
    writeJson(item.path, route)
  }

  for (const collectionName of Object.keys(manifest.entries)) {
    if (['misconceptions', 'concepts', 'lessons', 'activities', 'routes'].includes(collectionName)) continue
    for (const item of loadEntries(root, manifest.entries[collectionName])) {
      if (item.value && typeof item.value === 'object' && 'version' in item.value) {
        item.value.version = VERSION
        writeJson(item.path, item.value)
      }
    }
  }

  writeJson(manifestPath, manifest)
  console.log(`${manifest.id}: ${routes.length} ruta(s), ${lessons.length} lecciones, ${activities.length} prácticas y ${misconceptionValuesForPack.length} errores conceptuales migrados.`)
}
