import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = '0.5.0'
const packageNames = [
  'horology-foundations',
  'quartz-miyota2035',
  'mechanical-foundations',
  'miyota8215',
]

const demonstrations = new Map([
  ['activity.quartz2035.complete-final-project', 'mastery-check'],
  ['activity.quartz2035.review-final-dossier', 'transfer'],
  ['activity.mechanical.build-final-project', 'mastery-check'],
  ['activity.mechanical.compare-with-8215', 'transfer'],
  ['activity.miyota8215.complete-diagnosis', 'mastery-check'],
  ['activity.miyota8215.final-project', 'transfer'],
])

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function entries(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      path: join(directory, name),
      value: readJson(join(directory, name)),
    }))
}

function localized(es, en = es) {
  return { es, en }
}

function localizedText(value, fallback = '') {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.es ?? value.en ?? fallback
  return fallback
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function withoutPrivateBookReferences(value) {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item !== 'string' || !item.startsWith('source.horology.private-book.'))
      .map(withoutPrivateBookReferences)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, withoutPrivateBookReferences(item)]),
    )
  }
  return value
}

function slug(value) {
  return value.replace(/^activity\./, '').replace(/[^a-zA-Z0-9.-]+/g, '-')
}

const studentSubsystemNames = {
  anatomy: 'anatomía del movimiento',
  assembly: 'montaje',
  automatic: 'carga automática',
  barrel: 'barrilete',
  calendar: 'calendario',
  diagnosis: 'diagnóstico',
  disassembly: 'desmontaje',
  documentation: 'documentación técnica',
  energy: 'cadena de energía',
  escapement: 'escape',
  'final-project': 'proyecto final',
  'gear-pair': 'pareja de engranajes',
  identity: 'identificación del calibre',
  inspection: 'inspección',
  integration: 'integración del movimiento',
  'isa-memory': 'mapa documental del ISA 8172',
  keyless: 'cuerda y puesta en hora',
  mainspring: 'muelle real',
  'motion-works': 'minutería',
  observe: 'observación previa',
  oscillator: 'oscilador',
  planning: 'planificación',
  'power-source': 'fuente de energía',
  regulation: 'regulación',
  structure: 'estructura',
  supports: 'apoyos y puentes',
  tools: 'herramientas',
  train: 'tren de ruedas',
  workstation: 'puesto de trabajo',
}

function studentSubsystemName(value) {
  if (!value) return 'el sistema estudiado'
  return studentSubsystemNames[value] ?? value.replaceAll('-', ' ')
}

function conceptDefinition(concept) {
  const title = concept.title.es
  const plain = concept.plainLanguage?.es ?? concept.summary.es
  const subsystem = studentSubsystemName(concept.subsystem)
  const definitions = {
    terminology: `${title} es el término técnico usado para identificar sin ambigüedad una pieza, interfaz o estado de ${subsystem}. ${plain} Debe vincularse a una entidad o fuente concreta, no solo recordarse como etiqueta.`,
    'conceptual-causal': `${title} describe una relación causal dentro de ${subsystem}: una entrada produce un cambio observable mediante una interfaz declarada. ${plain} La explicación técnica debe nombrar origen, receptor, relación y efecto.`,
    spatial: `Para reconocer «${title}», examina su posición relativa, sus apoyos y sus interfaces dentro de ${subsystem}. ${plain} La proximidad visual no basta: la identificación exige una relación documentada o explícitamente reconstruida.`,
    quantitative: `${title} exige declarar magnitud, unidad, fórmula, entradas y margen de interpretación dentro de ${subsystem}. ${plain} Un valor normalizado o calculado no se presenta como dimensión oficial.`,
    procedural: `${title} es una secuencia reversible sobre ${subsystem} que conserva identidad, orientación, dependencias y estado inicial. ${plain} Cada paso se valida antes de avanzar y deja evidencia de ayudas, errores y restauración.`,
    diagnostic: `${title} separa observación, síntoma, hipótesis y comprobación en ${subsystem}. ${plain} Una hipótesis solo mejora cuando una prueba puede confirmarla o refutarla sin exceder los datos disponibles.`,
    epistemic: `${title} clasifica la autoridad de la información sobre ${subsystem}: oficial, observada, medida, deducida, estimada, educativa o desconocida. ${plain} La conclusión técnica nunca puede tener más autoridad que su fuente.`,
  }
  return localized(definitions[concept.knowledgeType] ?? definitions['conceptual-causal'])
}

function bookBoundary(packageName) {
  if (packageName === 'mechanical-foundations') {
    return 'El libro privado se usa solo como teoría general de construcción relojera mecánica, herramientas, trenes, escape, muelle, volante y diseño. No aporta datos de ningún calibre MIYOTA.'
  }
  if (packageName === 'miyota8215') {
    return 'La teoría mecánica general puede contrastarse con el libro privado, pero toda afirmación específica del 8215 debe proceder de la página de producto, la especificación, el plano, el manual o la lista de piezas oficial de MIYOTA.'
  }
  if (packageName === 'quartz-miyota2035') {
    return 'El libro privado de relojería mecánica no es fuente del MIYOTA 2035. Toda identidad, dimensión y dato del calibre procede exclusivamente de documentación oficial MIYOTA; las reconstrucciones educativas quedan marcadas como tales.'
  }
  return 'El libro privado funciona como apoyo de teoría relojera general. Los datos de calibres concretos conservan fuentes de fabricante independientes.'
}

function lessonEditorialArchetype(packageName, lesson, concepts) {
  const text = `${lesson.id} ${lesson.title} ${localizedText(lesson.authoring?.purpose)}`.toLocaleLowerCase('es')
  const knowledgeTypes = new Set(concepts.map(({ knowledgeType }) => knowledgeType))
  if (/diagn[oó]st|s[ií]ntoma|inspecci[oó]n|fallo|aver[ií]a|comprobaci[oó]n/.test(text) || knowledgeTypes.has('diagnostic')) return 'diagnosis'
  if (/montaje|desmontaje|herramient|banco|prepar|proced|servicio/.test(text) || knowledgeTypes.has('procedural')) return 'procedure'
  if (/fabric|acabado|mecaniz|tolerancia/.test(text)) return 'manufacturing'
  if (/diseñ|proyecto final|arquitectura/.test(text)) return 'design'
  if (/histori|evoluci[oó]n|origen/.test(text)) return 'history'
  if (packageName === 'quartz-miyota2035' || packageName === 'miyota8215') return 'mechanism'
  return 'mechanism'
}

function lessonEditorialFrame(archetype, title, focus) {
  const frames = {
    history: {
      model: `En **${title}**, parte del problema de época, identifica la solución disponible y comprueba qué limitación siguió abierta. El vocabulario —${focus}— sirve para comparar fuentes y consecuencias, no para ordenar inventos en una lista.`,
      example: `Construye una comparación para **${title}**: anota contexto, necesidad, solución, evidencia y límite. Una fecha sitúa un documento, pero no prueba por sí sola prioridad, difusión ni superioridad técnica.`,
      transfer: `Para transferir **${title}** a un reloj propio, conserva qué necesidad sigue vigente y qué parte de la solución depende de materiales, fabricación o contexto históricos.`,
    },
    mechanism: {
      model: `En **${title}**, usa ${focus} para seguir una acción desde la entrada hasta una salida observable. Nombra quién actúa, quién recibe el efecto y qué relación los une; una lista de piezas no explica el funcionamiento.`,
      example: `Formula para **${title}** una predicción del tipo «si cambia esta entrada, espero este efecto porque existe esta relación». Observa un solo cambio, compáralo con la predicción y restaura antes de probar otra hipótesis.`,
      transfer: `Al llevar **${title}** a otro movimiento o a un diseño propio, conserva la función y vuelve a comprobar geometría, contactos y datos; no transfieras una disposición particular por semejanza.`,
    },
    procedure: {
      model: `En **${title}**, relaciona ${focus} con un estado inicial, una acción segura y una comprobación antes de avanzar. El orden visual no sustituye la documentación aplicable ni convierte una práctica digital en una instrucción de banco.`,
      example: `Antes de actuar en **${title}**, escribe qué observarás, qué acción mínima realizarás, qué condición obliga a detenerse y qué resultado autoriza el paso siguiente. Restaura el estado antes de repetir.`,
      transfer: `La transferencia de **${title}** a una unidad física exige identificar referencia, condición de la pieza, herramienta, riesgos y documento vigente. Si falta alguno, conserva la operación como pendiente.`,
    },
    diagnosis: {
      model: `En **${title}**, separa observación, síntoma, hipótesis y prueba. Los términos ${focus} ayudan a formular causas rivales; ninguno convierte por sí solo un síntoma en avería confirmada.`,
      example: `Para **${title}**, escribe dos hipótesis compatibles con lo observado y predice un resultado distinto para cada una. Elige después la comprobación menos invasiva que pueda hacerte cambiar de conclusión.`,
      transfer: `Al transferir **${title}**, conserva el método diagnóstico y sustituye referencias, valores y relaciones por los que correspondan al nuevo calibre o ejemplar.`,
    },
    manufacturing: {
      model: `En **${title}**, vincula ${focus} con una característica que se quiere producir, una referencia de medida y una verificación. Cada operación debe dejar material y referencias suficientes para la siguiente.`,
      example: `Compara para **${title}** dos rutas de proceso mediante material, acceso de herramienta, riesgo, sobremedida, medición y posibilidad de corrección. No deduzcas una dimensión desde una imagen.`,
      transfer: `Para aplicar **${title}** a una pieza propia, convierte la intención en cotas, tolerancias, referencias, plan de proceso y controles; las estimaciones iniciales siguen siéndolo hasta medirse.`,
    },
    design: {
      model: `En **${title}**, convierte ${focus} en requisitos, alternativas y pruebas. Una solución plausible todavía no es una decisión hasta compararla con criterios y límites explícitos.`,
      example: `Prepara para **${title}** una tabla con alternativa, beneficio, coste, riesgo, dato pendiente y prueba prevista. Conserva también la opción descartada y el motivo.`,
      transfer: `El diseño propio reutiliza de **${title}** el criterio de decisión, no una forma concreta. Si cambia un requisito, vuelve al primer enlace afectado y actualiza las pruebas.`,
    },
  }
  return frames[archetype] ?? frames.mechanism
}

const GENERIC_COMPLETENESS_MARKERS = [
  '## Modelo mental paso a paso',
  '## Antes de practicar',
  '## Transferencia hacia un reloj propio',
  '## Frontera de fuentes',
]

function stripGenericCompletenessAppendix(body) {
  const firstMarker = GENERIC_COMPLETENESS_MARKERS
    .map((marker) => body.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0]
  return firstMarker === undefined ? body.trim() : body.slice(0, firstMarker).trim()
}

function hintSet(activity, competencyTitle) {
  const competencyName = localizedText(competencyTitle, activity.authoring.title.es)
  const id = activity.id.replace('activity.', '')
  const title = activity.authoring.title.es
  const subsystem = studentSubsystemName(activity.authoring.subsystem)
  const objective = localizedText(activity.authoring.description, title).replace(/[.!?]+$/, '')
  return [
    ['orientation', `Vuelve al objetivo de «${title}»: ${objective}. Escribe primero qué resultado concreto tendrías que observar.`],
    ['subsystem', `En «${title}», limita la búsqueda a ${subsystem}. Separa las piezas que participan de las que solo están próximas en la vista.`],
    ['functional-property', `Usa el criterio «${competencyName}»: anota quién inicia el cambio, quién recibe el efecto y qué relación permite transmitirlo.`],
    ['comparison', `Restaura «${title}» y compara un solo estado antes y después. Busca la primera diferencia que apoye o contradiga tu predicción.`],
    ['near-answer', `Para «${title}», vuelve a la observación exigida por «${competencyName}». Descarta respuestas basadas solo en parecido, proximidad o autoridad no citada.`],
    ['post-attempt-explanation', `Revisa tu intento en «${title}»: nombra el enlace que faltó, la evidencia que lo corrige y el resultado que te haría cambiar otra vez de conclusión.`],
  ].map(([kind, es], index) => ({
    id: `hint.${id}.${index + 1}`,
    level: index + 1,
    kind,
    content: localized(es),
    availableAfterAttempts: index < 4 ? 1 : 2,
    countsAsHint: true,
  }))
}

function feedbackFor(activity, competencyTitle) {
  const competencyName = localizedText(competencyTitle, activity.authoring.title.es)
  const title = activity.authoring.title.es
  const subsystem = studentSubsystemName(activity.authoring.subsystem)
  return {
    correctExplanation: localized(`En «${title}» has aportado una observación de ${subsystem} que respalda el objetivo «${competencyName}». Ahora repite el mismo criterio sin ayuda y, cuando corresponda, aplícalo a otro caso.`),
    incorrectDiagnosis: localized(`En «${title}» todavía falta justificar el objetivo «${competencyName}». Comprueba si confundiste identidad con función, proximidad con contacto, orden visual con orden de montaje o una inferencia con un dato documentado.`),
    causalQuestion: localized(`En «${title}», ¿qué elemento inicia el cambio, mediante qué relación se transmite y qué resultado observable confirmaría tu explicación?`),
    nextObservation: localized(`Restaura la escena de «${title}», aísla ${subsystem} y compara un único estado antes/después. Anota también la fuente o el límite que permite interpretar el cambio.`),
    misconceptionIds: activity.authoring.feedbackContract?.misconceptionIds ?? [],
    transferPrompt: localized(`¿Cómo aplicarías el criterio de «${title}» a otro movimiento o a una decisión de diseño propio sin suponer que la geometría es idéntica?`),
    requiresIndependentRetryAfterHint: true,
  }
}

function tutorFor(activity, conceptIds) {
  const title = activity.authoring.title.es
  return {
    scopeConceptIds: unique(conceptIds),
    allowedActions: [
      'orient',
      'ask-socratic-question',
      'explain-declared-content',
      'point-to-source',
      'suggest-remediation',
      'summarize-visible-state',
    ],
    forbiddenClaims: [
      localized('No inventar dimensiones, contactos, materiales, tolerancias ni comportamiento físico.'),
      localized('No presentar una simulación educativa como validación de ingeniería o destreza manual.'),
      localized('No calificar al estudiante ni completar por él la evidencia exigida.'),
    ],
    promptStarters: [
      localized(`En «${title}», ¿qué observas sin interpretarlo todavía?`),
      localized('¿Qué elemento inicia el cambio y cuál recibe el efecto?'),
      localized('¿Qué interfaz o dependencia permite esa relación?'),
      localized('¿Qué fuente respalda la conclusión y qué permanece desconocido?'),
    ],
    requiresSourceForTechnicalClaims: true,
    authority: 'coach-not-assessor',
  }
}

function derivedScene(base, activity, competency) {
  const scene = structuredClone(base)
  const sceneId = `scene.practice.${slug(activity.id)}`
  const questionPrefix = `question.practice.${slug(activity.id)}`
  const optionPrefix = `option.practice.${slug(activity.id)}`
  const title = activity.authoring.title.es
  const competencyTitle = localizedText(
    competency?.title ?? competency?.authoring?.title ?? activity.authoring.title,
    title,
  )
  scene.id = sceneId
  scene.version = VERSION
  scene.title = `${title} · práctica específica`
  scene.description = `${activity.authoring.description.es} La pregunta, el feedback y la evidencia pertenecen exclusivamente a este objetivo.`
  const questionStep = [...scene.steps].reverse().find(({ questions }) => questions.length > 0)
    ?? scene.steps.at(-1)
  if (questionStep) {
    questionStep.instructionMarkdown = `Ejecuta «${title}». Antes de confirmar, compara tu predicción, el cambio observable, la relación implicada y la autoridad de la fuente.`
    questionStep.questions = [
      {
        id: `${questionPrefix}.criterion`,
        promptMarkdown: `¿Qué criterio permite justificar correctamente «${title}»?`,
        responseKind: 'single-choice',
        options: [
          {
            id: `${optionPrefix}.evidence`,
            label: `Relacionar una observación verificable con el objetivo «${competencyTitle}» y declarar sus límites`,
            labels: localized(`Relacionar una observación verificable con el objetivo «${competencyTitle}» y declarar sus límites`),
          },
          {
            id: `${optionPrefix}.appearance`,
            label: 'Elegir la pieza que más se parece y asumir que cumple la función',
            labels: localized('Elegir la pieza que más se parece y asumir que cumple la función'),
          },
          {
            id: `${optionPrefix}.authority`,
            label: 'Tratar toda animación o reconstrucción como dato oficial del fabricante',
            labels: localized('Tratar toda animación o reconstrucción como dato oficial del fabricante'),
          },
        ],
        authoring: {
          prompt: localized(`¿Qué criterio permite justificar correctamente «${title}»?`),
          feedback: localized(`La decisión debe usar evidencia y límites de interpretación para justificar el objetivo «${competencyTitle}».`),
        },
      },
      {
        id: `${questionPrefix}.reasoning`,
        promptMarkdown: `Documenta tu razonamiento para «${title}» sin repetir la opción elegida.`,
        responseKind: 'structured-response',
        options: [],
        structuredFields: [
          { id: 'field.observation', label: 'Qué cambió o qué comprobaste', kind: 'short-text', required: true, optionIds: [] },
          { id: 'field.causal-link', label: 'Qué relación, interfaz o regla explica el resultado', kind: 'short-text', required: true, optionIds: [] },
          { id: 'field.source-limit', label: 'Qué fuente o límite condiciona la conclusión', kind: 'short-text', required: true, optionIds: [] },
          { id: 'field.confidence', label: 'Confianza en la explicación', kind: 'confidence', required: true, optionIds: [] },
        ],
        hints: [],
        humanReviewRequired: true,
        authoring: {
          prompt: localized(`Documenta observación, relación y límites para «${title}».`),
          feedback: localized('La respuesta queda como razonamiento propio pendiente de una revisión explícita; no se declara correcta por longitud.'),
        },
      },
    ]
    questionStep.success = [
      {
        condition: 'answer',
        questionId: `${questionPrefix}.criterion`,
        expectedOptionIds: [`${optionPrefix}.evidence`],
      },
      {
        condition: 'structured-answer',
        questionId: `${questionPrefix}.reasoning`,
        requiredFieldIds: ['field.observation', 'field.causal-link', 'field.source-limit', 'field.confidence'],
        pendingHumanReview: true,
      },
    ]
  }
  if (scene.storyboard) {
    scene.storyboard.sceneName = localized(scene.title)
    scene.storyboard.purpose = localized(`Preparar, ejecutar, explicar y transferir «${title}» con procedencia y restauración.`)
  }
  return scene
}

function strengthenRubric(rubric) {
  if (!rubric?.assessmentRule) return
  const unwrapPreviousUpgrade = (condition) => {
    if (
      condition?.op === 'all'
      && condition.conditions?.length === 3
      && condition.conditions[1]?.op === 'minimum-evidence'
      && condition.conditions[1]?.count === 2
      && condition.conditions[2]?.op === 'compare'
      && condition.conditions[2]?.metric === 'average-confidence'
      && condition.conditions[2]?.compare === 'gte'
      && condition.conditions[2]?.value === 0.7
    ) return unwrapPreviousUpgrade(condition.conditions[0])
    return condition
  }
  const original = unwrapPreviousUpgrade(rubric.assessmentRule.condition)
  rubric.assessmentRule.condition = {
    op: 'all',
    conditions: [
      original,
      { op: 'minimum-evidence', count: 2 },
      { op: 'compare', metric: 'average-confidence', compare: 'gte', value: 0.7 },
    ],
  }
}

for (const packageName of packageNames) {
  const packageRoot = join(root, 'learning-content', packageName)
  const manifestPath = join(packageRoot, 'manifest.json')
  const manifest = readJson(manifestPath)
  if (packageName === 'horology-foundations') {
    manifest.entries.scenes = manifest.entries.scenes.filter(({ id }) => !id.startsWith('scene.practice.'))
  }
  const miyotaOfficialOnly = packageName === 'quartz-miyota2035' || packageName === 'miyota8215'
  if (miyotaOfficialOnly) {
    manifest.entries.sources = manifest.entries.sources.filter(
      ({ id }) => !id.startsWith('source.horology.private-book.'),
    )
  }
  const concepts = entries(join(packageRoot, 'concepts'))
  const modules = entries(join(packageRoot, 'modules'))
  const lessons = entries(join(packageRoot, 'lessons'))
  const blocks = entries(join(packageRoot, 'blocks'))
  const activities = entries(join(packageRoot, 'activities'))
  const scenes = entries(join(packageRoot, 'scenes'))
  const rubrics = entries(join(packageRoot, 'rubrics'))
  const conceptById = new Map(concepts.map(({ value }) => [value.id, value]))
  const moduleById = new Map(modules.map(({ value }) => [value.id, value]))
  const competencyById = new Map(
    entries(join(packageRoot, 'competencies')).map(({ value }) => [value.id, value]),
  )
  const lessonById = new Map(lessons.map(({ value }) => [value.id, value]))
  const activityById = new Map(activities.map(({ value }) => [value.id, value]))
  const blockById = new Map(blocks.map(({ value }) => [value.id, value]))
  const sceneById = new Map(scenes.map(({ value }) => [value.id, value]))
  const rubricById = new Map(rubrics.map(({ value }) => [value.id, value]))

  manifest.packageVersion = VERSION
  manifest.minimumAppVersion = '0.10.0'
  for (const dependency of manifest.dependencies) {
    if (dependency.packageId.startsWith('wplab.horology.')) dependency.versionRange = '^0.5.0'
  }

  concepts.forEach((entry) => {
    const concept = entry.value
    concept.version = VERSION
    concept.technicalLanguage = conceptDefinition(concept)
    // Las relaciones conceptuales solo se conservan cuando fueron declaradas
    // explícitamente. El orden de los archivos no expresa una relación semántica.
    concept.relatedIds = unique(concept.relatedIds ?? []).filter((id) => id !== concept.id)
    concept.transferTargetIds = unique(concept.transferTargetIds ?? []).filter((id) => id !== concept.id)
    writeJson(entry.path, concept)
  })

  lessons.forEach((entry) => {
    const lesson = entry.value
    lesson.version = VERSION
    for (const blockId of lesson.blockIds) {
      const block = blockById.get(blockId)
      if (!block) continue
      block.version = VERSION
      block.bodyMarkdown = stripGenericCompletenessAppendix(block.bodyMarkdown)
    }
    if (lesson.authoring) {
      lesson.authoring.externalPrerequisites = (lesson.authoring.externalPrerequisites ?? []).map((item) => ({
        ...item,
        versionRange: item.packageId.startsWith('wplab.horology.') ? '^0.5.0' : item.versionRange,
      }))
    }
    writeJson(entry.path, lesson)
  })

  const generatedScenes = []
  for (const entry of activities) {
    const activity = entry.value
    if (!activity.authoring) continue
    activity.version = VERSION
    const contract = activity.authoring.pedagogicalContract
    const lesson = lessonById.get(activity.authoring.lessonId)
    const competency = competencyById.get(activity.competencyIds[0])
    const targetConceptIds = unique([
      ...(contract?.practicesConceptIds ?? []),
      ...(contract?.assessesConceptIds ?? []),
      ...(contract?.demonstratesConceptIds ?? []),
    ])
    if (contract) {
      contract.requiresConceptIds = unique(lesson?.authoring?.prerequisiteConceptIds ?? [])
      const purpose = demonstrations.get(activity.id)
      if (purpose) {
        contract.purpose = purpose
        contract.assessmentIntent = 'demonstration'
        contract.supportLevel = 'independent'
        contract.evidenceLevel = purpose === 'transfer' ? 'transfer' : 'independent-simulation'
        contract.demonstratesConceptIds = [...targetConceptIds]
        contract.assessesConceptIds = [...targetConceptIds]
        strengthenRubric(rubricById.get(activity.rubricId))
        activity.authoring.interactionContract.responseModel = 'structured-response'
        activity.authoring.interactionContract.orderedItems = []
        activity.authoring.interactionContract.expectedOrderIds = []
        activity.authoring.interactionContract.structuredFields = [
          {
            id: 'field.observation',
            label: localized('Observación verificable'),
            kind: 'short-text',
            required: true,
          },
          {
            id: 'field.causal-link',
            label: localized('Relación o decisión causal'),
            kind: 'short-text',
            required: true,
          },
          {
            id: 'field.source-limit',
            label: localized('Fuente, límite y confianza'),
            kind: 'short-text',
            required: true,
          },
        ]
      }
    }
    const competencyTitle = competency?.title ?? activity.authoring.title.es
    activity.authoring.interactionContract.hints = hintSet(activity, competencyTitle)
    activity.authoring.feedbackContract = feedbackFor(activity, competencyTitle)
    activity.authoring.tutorContract = tutorFor(activity, [
      ...(contract?.requiresConceptIds ?? []),
      ...targetConceptIds,
    ])
    if (packageName === 'horology-foundations') {
      if (activity.id === 'activity.horology.identify-escapement-oscillator') {
        activity.authoring.subsystem = 'regulation'
      }
    } else {
      const baseScene = sceneById.get(activity.sceneIds[0])
        ?? sceneById.get(activity.sceneIds[0].replace('scene.practice.', 'scene.'))
      if (baseScene) {
      const scene = derivedScene(baseScene, activity, competency)
      activity.sceneIds = [scene.id]
      const path = `scenes/${scene.id}.json`
      generatedScenes.push({ id: scene.id, path })
      writeJson(
        join(packageRoot, path),
        miyotaOfficialOnly ? withoutPrivateBookReferences(scene) : scene,
      )
      }
    }
    writeJson(entry.path, activity)
  }

  for (const entry of blocks) writeJson(entry.path, entry.value)
  for (const entry of rubrics) {
    entry.value.version = VERSION
    writeJson(entry.path, entry.value)
  }
  for (const collection of Object.keys(manifest.entries)) {
    for (const item of manifest.entries[collection]) {
      const path = join(packageRoot, item.path)
      if (item.path.endsWith('.json')) {
        let value = readJson(path)
        if (miyotaOfficialOnly) value = withoutPrivateBookReferences(value)
        if (value && typeof value === 'object' && 'version' in value) {
          value.version = VERSION
          writeJson(path, value)
        }
      }
    }
  }
  manifest.entries.scenes = packageName === 'horology-foundations'
    ? manifest.entries.scenes.filter(({ id }) => !id.startsWith('scene.practice.'))
    : [
        ...manifest.entries.scenes.filter(({ id }) => !id.startsWith('scene.practice.')),
        ...generatedScenes,
      ]
  for (const routeEntry of entries(join(packageRoot, 'routes'))) {
    const route = routeEntry.value
    route.version = VERSION
    if (route.learningDesign) {
      const routeLessonIds = new Set(route.moduleIds.flatMap((moduleId) => moduleById.get(moduleId)?.lessonIds ?? []))
      route.learningDesign.demonstrationActivityIds = activities
        .map(({ value }) => value.id)
        .filter((id) => demonstrations.has(id) && routeLessonIds.has(activityById.get(id)?.authoring?.lessonId))
    }
    writeJson(routeEntry.path, route)
  }
  writeJson(manifestPath, manifest)
  const distPack = { manifest }
  for (const [collection, manifestEntries] of Object.entries(manifest.entries)) {
    distPack[collection] = manifestEntries.map(({ path }) => readJson(join(packageRoot, path)))
  }
  writeJson(join(packageRoot, 'dist', 'pack.json'), distPack)
  console.log(`${manifest.id}@${VERSION}: ${lessons.length} lecciones, ${activities.length} prácticas y ${generatedScenes.length} escenas específicas.`)
}
