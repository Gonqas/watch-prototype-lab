import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve('learning-content/horology-foundations')
const version = '0.2.0'

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'))
}

async function writeJson(relativePath, value) {
  await writeFile(resolve(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const conceptDefinitions = [
  {
    id: 'concept.horology.watch-anatomy',
    title: 'Reloj completo y movimiento',
    summary: 'Distinguir el objeto completo de su movimiento, caja, cristal, corona, esfera, agujas y sujeciones.',
    kind: 'concept',
    knowledgeType: 'terminology',
    prerequisiteIds: [],
    relatedIds: ['concept.horology.part-language', 'concept.horology.functional-chain'],
    competencyIds: ['competency.horology.identify-functional-subsystems'],
    activityIds: ['activity.horology.classify-subsystems'],
    targetEvidenceLevel: 'recognition',
    bridgeLessonId: 'lesson.horology.system',
  },
  {
    id: 'concept.horology.part-language',
    title: 'Piezas, apoyos y contactos',
    summary: 'Reconocer rueda, piñón, árbol, pivote, platina, puente, rubí y engrane antes de razonar sobre el movimiento.',
    kind: 'concept',
    knowledgeType: 'spatial',
    prerequisiteIds: ['concept.horology.watch-anatomy'],
    relatedIds: ['concept.horology.functional-chain', 'concept.horology.mechanical-chain'],
    competencyIds: ['competency.horology.identify-functional-subsystems'],
    activityIds: ['activity.horology.classify-subsystems', 'activity.horology.order-mechanical-chain'],
    targetEvidenceLevel: 'recognition',
    bridgeLessonId: 'lesson.horology.system',
  },
  {
    id: 'concept.horology.functional-chain',
    title: 'Funciones del reloj',
    summary: 'Relacionar fuente, control o regulación, transmisión, indicación y estructura sin confundir función con aspecto.',
    kind: 'subsystem',
    knowledgeType: 'conceptual-causal',
    prerequisiteIds: ['concept.horology.watch-anatomy', 'concept.horology.part-language'],
    relatedIds: ['concept.horology.quartz-chain', 'concept.horology.mechanical-chain'],
    competencyIds: ['competency.horology.identify-functional-subsystems'],
    activityIds: ['activity.horology.classify-subsystems', 'activity.horology.select-affected-subsystem'],
    targetEvidenceLevel: 'causal-explanation',
    bridgeLessonId: 'lesson.horology.system',
  },
  {
    id: 'concept.horology.quartz-chain',
    title: 'Cadena funcional de cuarzo',
    summary: 'Seguir pila, control temporal, bobina, rotor paso a paso, tren e indicación como una cadena causal.',
    kind: 'concept',
    knowledgeType: 'conceptual-causal',
    prerequisiteIds: ['concept.horology.functional-chain', 'concept.horology.mechanical-chain'],
    relatedIds: ['concept.horology.mechanical-chain', 'concept.horology.functional-equivalence'],
    competencyIds: ['competency.horology.explain-quartz-energy-chain'],
    activityIds: ['activity.horology.order-quartz-chain', 'activity.horology.identify-time-reference'],
    targetEvidenceLevel: 'causal-explanation',
    bridgeLessonId: 'lesson.horology.quartz-chain',
  },
  {
    id: 'concept.horology.source-confidence',
    title: 'Observación, inferencia y confianza',
    summary: 'Separar lo visto, documentado, inferido, estimado y todavía desconocido.',
    kind: 'skill',
    knowledgeType: 'epistemic',
    prerequisiteIds: ['concept.horology.system-interruption'],
    recommendedPrerequisiteIds: ['concept.horology.quartz-chain'],
    relatedIds: ['concept.horology.system-interruption'],
    competencyIds: ['competency.horology.state-source-confidence'],
    activityIds: ['activity.horology.isa-confidence-map'],
    targetEvidenceLevel: 'causal-explanation',
    bridgeLessonId: 'lesson.horology.isa8172-confidence',
  },
  {
    id: 'concept.horology.mechanical-chain',
    title: 'Cadena funcional mecánica',
    summary: 'Seguir muelle, barrilete, tren, escape, oscilador, minutería e indicación sin atribuirles física no validada.',
    kind: 'concept',
    knowledgeType: 'conceptual-causal',
    prerequisiteIds: ['concept.horology.functional-chain', 'concept.horology.part-language'],
    relatedIds: ['concept.horology.quartz-chain', 'concept.horology.functional-equivalence'],
    competencyIds: ['competency.horology.explain-mechanical-energy-chain'],
    activityIds: ['activity.horology.order-mechanical-chain', 'activity.horology.identify-escapement-oscillator'],
    targetEvidenceLevel: 'causal-explanation',
    bridgeLessonId: 'lesson.horology.mechanical-chain',
  },
  {
    id: 'concept.horology.functional-equivalence',
    title: 'Equivalencia funcional',
    summary: 'Comparar soluciones de cuarzo y mecánicas por la función que cumplen sin afirmar igualdad física.',
    kind: 'concept',
    knowledgeType: 'conceptual-causal',
    prerequisiteIds: ['concept.horology.quartz-chain', 'concept.horology.mechanical-chain'],
    relatedIds: ['concept.horology.system-interruption'],
    competencyIds: ['competency.horology.distinguish-regulation-from-transmission'],
    activityIds: ['activity.horology.match-functional-equivalents'],
    targetEvidenceLevel: 'transfer',
    bridgeLessonId: 'lesson.horology.functional-equivalence',
  },
  {
    id: 'concept.horology.system-interruption',
    title: 'Interrupción, hipótesis y prueba',
    summary: 'Predecir qué deja de ocurrir, proponer una causa y escoger una comprobación sin convertir la hipótesis en diagnóstico.',
    kind: 'skill',
    knowledgeType: 'diagnostic',
    prerequisiteIds: ['concept.horology.functional-equivalence'],
    relatedIds: ['concept.horology.functional-chain'],
    competencyIds: ['competency.horology.predict-system-interruption'],
    activityIds: [
      'activity.horology.predict-interruption',
      'activity.horology.select-affected-subsystem',
      'activity.horology.justify-hypothesis',
    ],
    targetEvidenceLevel: 'transfer',
    bridgeLessonId: 'lesson.horology.failure-prediction',
  },
]

const normalizedConcepts = conceptDefinitions.map((concept) => ({
  id: concept.id,
  version,
  title: { es: concept.title },
  summary: { es: concept.summary },
  kind: concept.kind,
  knowledgeType: concept.knowledgeType,
  prerequisiteIds: concept.prerequisiteIds,
  recommendedPrerequisiteIds: concept.recommendedPrerequisiteIds ?? [],
  relatedIds: concept.relatedIds,
  competencyIds: concept.competencyIds,
  movementIds: [],
  subsystem: 'horology-foundations',
  routeIds: ['route.horology.orientation'],
  activityIds: concept.activityIds,
  sourceIds: ['source.horology.original-functional-map'],
  misconceptionIds: [],
  bridgeLessonId: concept.bridgeLessonId,
  targetEvidenceLevel: concept.targetEvidenceLevel,
  availability: 'available',
}))

const lessons = {
  'lesson.horology.system': {
    role: 'pretraining',
    entryCheck: 'self-check',
    prerequisiteConceptIds: [],
    conceptIds: [
      'concept.horology.watch-anatomy',
      'concept.horology.part-language',
      'concept.horology.functional-chain',
    ],
    introducesConceptIds: [
      'concept.horology.watch-anatomy',
      'concept.horology.part-language',
      'concept.horology.functional-chain',
    ],
    reinforcesConceptIds: [],
  },
  'lesson.horology.quartz-chain': {
    role: 'conceptual-model',
    entryCheck: 'self-check',
    prerequisiteConceptIds: ['concept.horology.functional-chain', 'concept.horology.mechanical-chain'],
    conceptIds: ['concept.horology.quartz-chain'],
    introducesConceptIds: ['concept.horology.quartz-chain'],
    reinforcesConceptIds: ['concept.horology.functional-chain', 'concept.horology.mechanical-chain'],
  },
  'lesson.horology.isa8172-confidence': {
    role: 'guided-practice',
    entryCheck: 'ungraded-diagnostic',
    prerequisiteConceptIds: ['concept.horology.quartz-chain', 'concept.horology.system-interruption'],
    conceptIds: ['concept.horology.source-confidence'],
    introducesConceptIds: ['concept.horology.source-confidence'],
    reinforcesConceptIds: ['concept.horology.quartz-chain', 'concept.horology.system-interruption'],
  },
  'lesson.horology.mechanical-chain': {
    role: 'conceptual-model',
    entryCheck: 'self-check',
    prerequisiteConceptIds: ['concept.horology.functional-chain', 'concept.horology.part-language'],
    conceptIds: ['concept.horology.mechanical-chain'],
    introducesConceptIds: ['concept.horology.mechanical-chain'],
    reinforcesConceptIds: ['concept.horology.functional-chain', 'concept.horology.part-language'],
  },
  'lesson.horology.functional-equivalence': {
    role: 'transfer',
    entryCheck: 'ungraded-diagnostic',
    prerequisiteConceptIds: ['concept.horology.quartz-chain', 'concept.horology.mechanical-chain'],
    conceptIds: ['concept.horology.functional-equivalence'],
    introducesConceptIds: ['concept.horology.functional-equivalence'],
    reinforcesConceptIds: ['concept.horology.quartz-chain', 'concept.horology.mechanical-chain'],
  },
  'lesson.horology.failure-prediction': {
    role: 'transfer',
    entryCheck: 'ungraded-diagnostic',
    prerequisiteConceptIds: [
      'concept.horology.functional-equivalence',
      'concept.horology.functional-chain',
    ],
    conceptIds: ['concept.horology.system-interruption'],
    introducesConceptIds: ['concept.horology.system-interruption'],
    reinforcesConceptIds: [
      'concept.horology.functional-equivalence',
      'concept.horology.functional-chain',
    ],
  },
}

const activityContracts = {
  'activity.horology.classify-subsystems': {
    purpose: 'guided-practice',
    assessmentIntent: 'formative',
    requiresConceptIds: ['concept.horology.watch-anatomy', 'concept.horology.part-language', 'concept.horology.functional-chain'],
    demonstratesConceptIds: ['concept.horology.functional-chain'],
    practicesConceptIds: ['concept.horology.part-language', 'concept.horology.functional-chain'],
    assessesConceptIds: ['concept.horology.functional-chain'],
    evidenceLevel: 'recognition',
    supportLevel: 'guided',
    remediation: ['lesson.horology.system', 'block.horology.system', ['concept.horology.part-language', 'concept.horology.functional-chain']],
  },
  'activity.horology.order-quartz-chain': {
    purpose: 'mastery-check',
    assessmentIntent: 'demonstration',
    requiresConceptIds: ['concept.horology.quartz-chain'],
    demonstratesConceptIds: ['concept.horology.quartz-chain'],
    practicesConceptIds: ['concept.horology.quartz-chain'],
    assessesConceptIds: ['concept.horology.quartz-chain'],
    evidenceLevel: 'independent-simulation',
    supportLevel: 'independent',
    remediation: ['lesson.horology.quartz-chain', 'block.horology.quartz-chain', ['concept.horology.quartz-chain']],
  },
  'activity.horology.identify-time-reference': {
    purpose: 'independent-practice',
    assessmentIntent: 'formative',
    requiresConceptIds: ['concept.horology.quartz-chain'],
    demonstratesConceptIds: ['concept.horology.quartz-chain'],
    practicesConceptIds: ['concept.horology.quartz-chain'],
    assessesConceptIds: ['concept.horology.quartz-chain'],
    evidenceLevel: 'recognition',
    supportLevel: 'faded',
    remediation: ['lesson.horology.quartz-chain', 'block.horology.quartz-chain', ['concept.horology.quartz-chain']],
  },
  'activity.horology.isa-confidence-map': {
    purpose: 'mastery-check',
    assessmentIntent: 'demonstration',
    requiresConceptIds: ['concept.horology.source-confidence'],
    demonstratesConceptIds: ['concept.horology.source-confidence'],
    practicesConceptIds: ['concept.horology.source-confidence'],
    assessesConceptIds: ['concept.horology.source-confidence'],
    evidenceLevel: 'causal-explanation',
    supportLevel: 'independent',
    remediation: ['lesson.horology.isa8172-confidence', 'block.horology.isa8172-confidence', ['concept.horology.source-confidence']],
  },
  'activity.horology.order-mechanical-chain': {
    purpose: 'mastery-check',
    assessmentIntent: 'demonstration',
    requiresConceptIds: ['concept.horology.mechanical-chain'],
    demonstratesConceptIds: ['concept.horology.mechanical-chain'],
    practicesConceptIds: ['concept.horology.mechanical-chain'],
    assessesConceptIds: ['concept.horology.mechanical-chain'],
    evidenceLevel: 'independent-simulation',
    supportLevel: 'independent',
    remediation: ['lesson.horology.mechanical-chain', 'block.horology.mechanical-chain', ['concept.horology.mechanical-chain']],
  },
  'activity.horology.identify-escapement-oscillator': {
    purpose: 'independent-practice',
    assessmentIntent: 'formative',
    requiresConceptIds: ['concept.horology.mechanical-chain'],
    demonstratesConceptIds: ['concept.horology.mechanical-chain'],
    practicesConceptIds: ['concept.horology.mechanical-chain'],
    assessesConceptIds: ['concept.horology.mechanical-chain'],
    evidenceLevel: 'recognition',
    supportLevel: 'faded',
    remediation: ['lesson.horology.mechanical-chain', 'block.horology.mechanical-chain', ['concept.horology.mechanical-chain']],
  },
  'activity.horology.match-functional-equivalents': {
    purpose: 'transfer',
    assessmentIntent: 'demonstration',
    requiresConceptIds: ['concept.horology.quartz-chain', 'concept.horology.mechanical-chain', 'concept.horology.functional-equivalence'],
    demonstratesConceptIds: ['concept.horology.functional-equivalence'],
    practicesConceptIds: ['concept.horology.functional-equivalence'],
    assessesConceptIds: ['concept.horology.functional-equivalence'],
    evidenceLevel: 'transfer',
    supportLevel: 'independent',
    remediation: ['lesson.horology.functional-equivalence', 'block.horology.functional-equivalence', ['concept.horology.functional-equivalence']],
  },
  'activity.horology.predict-interruption': {
    purpose: 'completion-problem',
    assessmentIntent: 'formative',
    requiresConceptIds: ['concept.horology.system-interruption'],
    demonstratesConceptIds: ['concept.horology.system-interruption'],
    practicesConceptIds: ['concept.horology.system-interruption'],
    assessesConceptIds: ['concept.horology.system-interruption'],
    evidenceLevel: 'causal-explanation',
    supportLevel: 'faded',
    remediation: ['lesson.horology.failure-prediction', 'block.horology.failure-prediction', ['concept.horology.system-interruption']],
  },
  'activity.horology.select-affected-subsystem': {
    purpose: 'transfer',
    assessmentIntent: 'demonstration',
    requiresConceptIds: ['concept.horology.functional-chain', 'concept.horology.system-interruption'],
    demonstratesConceptIds: ['concept.horology.functional-chain'],
    practicesConceptIds: ['concept.horology.functional-chain', 'concept.horology.system-interruption'],
    assessesConceptIds: ['concept.horology.functional-chain'],
    evidenceLevel: 'transfer',
    supportLevel: 'independent',
    remediation: ['lesson.horology.system', 'block.horology.system', ['concept.horology.functional-chain']],
  },
  'activity.horology.justify-hypothesis': {
    purpose: 'mastery-check',
    assessmentIntent: 'demonstration',
    requiresConceptIds: ['concept.horology.system-interruption'],
    demonstratesConceptIds: ['concept.horology.system-interruption'],
    practicesConceptIds: ['concept.horology.system-interruption'],
    assessesConceptIds: ['concept.horology.system-interruption'],
    evidenceLevel: 'causal-explanation',
    supportLevel: 'independent',
    remediation: ['lesson.horology.failure-prediction', 'block.horology.failure-prediction', ['concept.horology.system-interruption']],
  },
}

const firstLessonBody = `## Propósito

Construir una primera imagen del reloj sin pedirte vocabulario que todavía no has aprendido. Primero reconocerás el objeto completo, después las piezas y contactos mínimos, y solo entonces sus funciones.

## Conocimientos previos

Ninguno. Basta con saber que un reloj muestra una hora. Si ya has desmontado uno, esa experiencia se usará más adelante como observación, no como una respuesta que debas adivinar ahora.

## Objetivos observables

Al terminar podrás distinguir reloj completo y movimiento; reconocer rueda, piñón, árbol, pivote, platina, puente y rubí; y explicar con palabras sencillas qué significa fuente, control o regulación, transmisión, indicación y estructura.

## Explicación principal

El **reloj completo** es el objeto que llevas o consultas. Incluye caja, cristal, corona, esfera, agujas, elementos de sujeción y el {{term:term.horology.movement}}. El movimiento es el mecanismo interior; no es todo el reloj.

Antes de seguir una cadena necesitas unas pocas palabras. Una **rueda** tiene dientes. Un **piñón** es un engranaje pequeño que suele trabajar con una rueda. Ambos pueden compartir un **árbol**. Sus extremos finos son **pivotes** y giran apoyados en la platina, un puente o un {{term:term.horology.jewel}}. Dos piezas transmiten movimiento cuando existe una interfaz real entre ellas; verlas cerca no demuestra que engranen.

Ahora puedes leer el sistema por funciones. La **fuente** aporta o almacena energía. El **control o la regulación** establece el ritmo. La **transmisión** lleva y adapta el movimiento entre etapas. La **indicación** lo convierte en una lectura mediante las agujas. La **estructura** mantiene cada pieza en la posición necesaria. Estas funciones describen lo que ocurre, no el color ni la forma de una pieza.

## Explicación visual

La referencia empieza ensamblada. La separación de capas es una vista educativa reversible, no la posición de funcionamiento. En cada paso se resalta quién entrega energía, quién la recibe y qué contacto permite el cambio. Las flechas indican una relación funcional; no pretenden ser una trayectoria física.

## Vocabulario

Nombre cotidiano primero y término profesional después: mecanismo interior ({{term:term.horology.movement}}), rueda, {{term:term.horology.pinion}}, árbol ({{term:term.horology.arbor}}), pivote ({{term:term.horology.pivot}}), platina, puente y rubí. **Engranar** significa que los dientes de dos ruedas o piñones contactan de forma que una puede impulsar a la otra.

## Fuentes

La secuencia procede del blueprint editorial aprobado, de la terminología técnica del libro privado y de una síntesis educativa original. El libro se usa como fuente, no se copia. El modelo conceptual no aporta dimensiones oficiales ni valida una física real.

## Ejemplo

Sigue una sola relación. El muelle almacena energía dentro del barrilete. El barrilete impulsa la primera etapa del tren mediante un engrane. El tren la transmite; no la crea. Una platina o un puente pueden permanecer inmóviles y ser esenciales porque conservan los pivotes alineados. Si el apoyo desaparece, la transmisión puede detenerse aunque la fuente siga cargada.

## Errores habituales

Confundir el reloj completo con el movimiento; creer que las ruedas crean energía; asumir que dos piezas cercanas se tocan; interpretar una vista explosionada como posición de trabajo; y pensar que una animación demuestra dimensiones o física validadas.

## Actividad

Primero recorrerás la ruta con ayuda y localizarás el tren entre la fuente y la indicación. Después elegirás su función principal. Esta primera comprobación es formativa: sirve para encontrar una laguna, no para declarar que dominas la relojería.

## Feedback

El feedback mostrará la relación causal: qué recibe la pieza, qué entrega y mediante qué contacto. Si fallas, volverás al segmento exacto que falta antes de intentarlo de nuevo.

## Evidencia

Se conserva la respuesta, si fue correcta, las pistas utilizadas y el contexto visual. Un acierto con ayuda cuenta como práctica; no se presenta como demostración independiente.

## Criterio de éxito

Explicar que el tren transmite movimiento, localizar al menos una relación de entrada y una de salida, y distinguir esa función de almacenar energía o mostrar la hora.

## Resumen

Un reloj completo contiene un movimiento. Sus piezas se entienden por los contactos y apoyos que las relacionan. La cadena funcional recibe energía, establece un ritmo, transmite movimiento y produce una indicación dentro de una estructura.

## Siguiente conexión

La siguiente lección aplicará este mapa a la cadena mecánica: primero verás de dónde sale la energía, cómo se transmite y cómo el escape y el oscilador establecen el ritmo.`

const manifest = await readJson('manifest.json')
manifest.packageVersion = version
manifest.minimumAppVersion = '0.6.0'
manifest.entries.concepts = normalizedConcepts.map(({ id }) => ({
  id,
  path: `concepts/${id}.json`,
}))
await writeJson('manifest.json', manifest)

for (const concept of normalizedConcepts) {
  await writeJson(`concepts/${concept.id}.json`, concept)
}

for (const entry of manifest.entries.lessons) {
  const lesson = await readJson(entry.path)
  const contract = lessons[lesson.id]
  if (!contract) continue
  lesson.version = version
  lesson.authoring.prerequisiteConceptIds = contract.prerequisiteConceptIds
  lesson.authoring.recommendedPrerequisiteConceptIds = []
  lesson.authoring.conceptIds = contract.conceptIds
  lesson.authoring.pedagogy = {
    role: contract.role,
    entryCheck: contract.entryCheck,
    userPacedSegments: true,
    introducesConceptIds: contract.introducesConceptIds,
    reinforcesConceptIds: contract.reinforcesConceptIds,
    bridgeConceptIds: contract.prerequisiteConceptIds,
  }
  await writeJson(entry.path, lesson)
}

for (const entry of manifest.entries.blocks) {
  const block = await readJson(entry.path)
  const lesson = Object.entries(lessons).find(([lessonId]) => {
    const lessonEntry = manifest.entries.lessons.find(({ id }) => id === lessonId)
    return lessonEntry
  })
  const owningLessonEntry = manifest.entries.lessons.find(({ id }) =>
    lessons[id] && id.replace('lesson.', 'block.') === block.id)
  const contract = owningLessonEntry ? lessons[owningLessonEntry.id] : lesson?.[1]
  if (!contract) continue
  block.version = version
  block.pedagogy = {
    role: contract.role === 'pretraining'
      ? 'pretrain'
      : contract.role === 'transfer'
        ? 'worked-example'
        : 'explain',
    conceptIds: contract.conceptIds,
    estimatedMinutes: block.id === 'block.horology.system' ? 18 : 15,
    userPaced: true,
  }
  if (block.id === 'block.horology.system') block.bodyMarkdown = firstLessonBody
  await writeJson(entry.path, block)
}

for (const entry of manifest.entries.activities) {
  const activity = await readJson(entry.path)
  const contract = activityContracts[activity.id]
  if (!contract) continue
  activity.version = version
  activity.authoring.pedagogicalContract = {
    purpose: contract.purpose,
    assessmentIntent: contract.assessmentIntent,
    requiresConceptIds: contract.requiresConceptIds,
    introducesConceptIds: [],
    demonstratesConceptIds: contract.demonstratesConceptIds,
    practicesConceptIds: contract.practicesConceptIds,
    assessesConceptIds: contract.assessesConceptIds,
    evidenceLevel: contract.evidenceLevel,
    supportLevel: contract.supportLevel,
    remediation: {
      lessonId: contract.remediation[0],
      blockId: contract.remediation[1],
      conceptIds: contract.remediation[2],
    },
    physicalBoundary: {
      es: 'La actividad acredita comprensión o ejecución dentro de una simulación educativa. No acredita destreza manual, ajuste físico, lubricación, desgaste ni validación de ingeniería.',
    },
  }
  if (activity.id === 'activity.horology.classify-subsystems') {
    activity.title = 'Comprobar qué hace el tren de ruedas'
    activity.authoring.title.es = 'Comprobar qué hace el tren de ruedas'
    activity.authoring.description.es = 'Recorre primero la relación entre barrilete, tren y minutería; después comprueba tu idea sin convertir este primer acierto en dominio.'
  }
  if (activity.id === 'activity.horology.select-affected-subsystem') {
    activity.competencyIds = ['competency.horology.identify-functional-subsystems']
    activity.evidenceTemplateIds = ['evidence.horology.affected-subsystem']
    activity.rubricId = 'rubric.horology.functional-subsystems'
  }
  await writeJson(entry.path, activity)
}

const affectedEvidence = await readJson('evidence/evidence.horology.affected-subsystem.json')
affectedEvidence.version = version
affectedEvidence.competencyId = 'competency.horology.identify-functional-subsystems'
affectedEvidence.extraction.version = version
affectedEvidence.extraction.competencyId = 'competency.horology.identify-functional-subsystems'
await writeJson('evidence/evidence.horology.affected-subsystem.json', affectedEvidence)

const functionalRubric = await readJson('rubrics/rubric.horology.functional-subsystems.json')
functionalRubric.version = version
functionalRubric.assessmentRule.version = version
functionalRubric.assessmentRule.condition = {
  op: 'all',
  conditions: [
    {
      op: 'count',
      filter: { evidenceType: 'classification', status: 'active', minimumConfidence: 1 },
      compare: 'gte',
      value: 2,
    },
    { op: 'compare', metric: 'distinct-sessions', compare: 'gte', value: 2 },
  ],
}
await writeJson('rubrics/rubric.horology.functional-subsystems.json', functionalRubric)

const regulationRubric = await readJson('rubrics/rubric.horology.regulation-transmission.json')
regulationRubric.version = version
regulationRubric.assessmentRule.version = version
regulationRubric.assessmentRule.condition = {
  op: 'all',
  conditions: [
    {
      op: 'count',
      filter: { evidenceType: 'selection', status: 'active', minimumConfidence: 1 },
      compare: 'gte',
      value: 2,
    },
    {
      op: 'exists',
      filter: { evidenceType: 'explanation', status: 'active', minimumConfidence: 1 },
    },
    { op: 'compare', metric: 'distinct-sessions', compare: 'gte', value: 3 },
  ],
}
await writeJson('rubrics/rubric.horology.regulation-transmission.json', regulationRubric)

const sourceRubric = await readJson('rubrics/rubric.horology.source-confidence.json')
sourceRubric.version = version
sourceRubric.assessmentRule.version = version
sourceRubric.assessmentRule.condition = {
  op: 'all',
  conditions: [
    {
      op: 'exists',
      filter: { evidenceType: 'decision', status: 'active', minimumConfidence: 1 },
    },
    {
      op: 'exists',
      filter: { evidenceType: 'written-response', status: 'active', minimumConfidence: 1 },
    },
    { op: 'compare', metric: 'distinct-sessions', compare: 'gte', value: 2 },
  ],
}
await writeJson('rubrics/rubric.horology.source-confidence.json', sourceRubric)

const scenePrerequisites = {
  'scene.horology.functional-layers': ['concept.horology.functional-chain'],
  'scene.horology.quartz-chain': ['concept.horology.quartz-chain'],
  'scene.horology.isa-confidence': ['concept.horology.source-confidence'],
  'scene.horology.mechanical-chain': ['concept.horology.mechanical-chain'],
  'scene.horology.functional-comparison': ['concept.horology.functional-equivalence'],
  'scene.horology.interruptions': ['concept.horology.system-interruption'],
}
for (const entry of manifest.entries.scenes) {
  const scene = await readJson(entry.path)
  if (scenePrerequisites[scene.id] && scene.storyboard) {
    scene.version = version
    scene.storyboard.prerequisites = scenePrerequisites[scene.id]
    await writeJson(entry.path, scene)
  }
}

console.log(`Migración pedagógica aplicada a ${manifest.id}@${version}.`)
