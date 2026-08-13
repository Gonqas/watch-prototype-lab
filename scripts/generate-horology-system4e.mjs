import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = join(process.cwd(), 'learning-content', 'mechanical-foundations')
const base4d = JSON.parse(await readFile(join(process.cwd(), 'learning-content', 'quartz-miyota2035', 'dist', 'pack.json'), 'utf8'))
const base4c = JSON.parse(await readFile(join(process.cwd(), 'learning-content', 'horology-foundations', 'dist', 'pack.json'), 'utf8'))
const version = '0.5.0'
const packageId = 'wplab.horology.mechanical-foundations'
const previousPackageId = 'wplab.horology.functional-map'
const fixtureId = 'fixture.conceptual.mechanical-chain'
const comparisonFixtureId = 'fixture.miyota.8215.structural'
const functionalCompetencyPrerequisites = [
  'competency.horology.identify-functional-subsystems',
  'competency.horology.explain-mechanical-energy-chain',
  'competency.horology.predict-system-interruption',
]
const es = (value) => ({ es: value, en: value })
const fidelity = {
  geometry: 'G1',
  kinematics: 'K2',
  physics: 'P0',
  limitations: [
    'Modelo mecánico conceptual normalizado; no representa un calibre fabricable.',
    'Cálculos cinemáticos ideales y física relativa simplificada; no son validación de ingeniería.',
    'MIYOTA 8215 se muestra únicamente como comparación estructural R2/G2/K2/P0.',
  ],
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
  'timeline.scrub@^1.0.0',
  'reduced-motion@^1.0.0',
  'viewport.restore@^1.0.0',
]
const capabilityIds = capabilities.map((value) => value.split('@')[0])
const originalSourceId = 'source.horology.original-mechanical-foundations'
const bookSourceIds = {
  wheels: 'source.horology.private-book.wheels-pinions',
  jewels: 'source.horology.private-book.jewelling',
  escapement: 'source.horology.private-book.escapements',
  mainspring: 'source.horology.private-book.mainsprings',
  design: 'source.horology.private-book.movement-design',
  oscillator: 'source.horology.private-book.balance-spring',
}

async function json(relative, value) {
  const path = join(root, relative)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const competencies = [
  ['explain-energy-chain', 'Explicar la cadena energética mecánica', 'energy'],
  ['explain-barrel', 'Explicar muelle real y barrilete', 'barrel'],
  ['calculate-simple-ratios', 'Calcular relaciones simples', 'gear-pair'],
  ['determine-rotation-direction', 'Determinar sentidos de giro', 'gear-pair'],
  ['build-functional-train', 'Construir un tren funcional', 'train'],
  ['recognize-supports-clearances', 'Reconocer apoyos y holguras', 'supports'],
  ['order-escapement-phases', 'Ordenar las fases del escape', 'escapement'],
  ['distinguish-frequency-amplitude', 'Distinguir frecuencia y amplitud', 'oscillator'],
  ['explain-escape-oscillator-system', 'Explicar escape y oscilador como sistema', 'integration'],
  ['explain-motion-works', 'Explicar la minutería', 'motion-works'],
  ['explain-keyless', 'Explicar cuerda y puesta en hora', 'keyless'],
  ['explain-automatic-winding', 'Explicar la carga automática', 'automatic'],
  ['explain-basic-calendar', 'Explicar el calendario básico', 'calendar'],
  ['diagnose-conceptual-interruption', 'Diagnosticar una interrupción conceptual', 'diagnosis'],
  ['compare-conceptual-real', 'Comparar un modelo conceptual con un calibre real', 'comparison'],
  ['document-fidelity-limits', 'Documentar límites de fidelidad', 'documentation'],
]

const modules = [
  {
    slug: 'energy',
    title: 'De energía almacenada a movimiento',
    purpose: 'Distinguir energía, movimiento, transmisión, ritmo y pérdida conceptual dentro del reloj.',
    subsystem: 'energy',
    role: 'mainspring',
    sourceIds: [bookSourceIds.mainspring, originalSourceId],
    competencySlugs: ['explain-energy-chain'],
    body: 'La energía almacenada en el muelle no es todavía indicación ni ritmo. Al liberarse, el barrilete entrega rotación al tren; el escape controla la liberación y repone energía al oscilador; la minutería deriva una rama de indicación. Bloquear un tramo muestra qué queda aguas arriba y aguas abajo, sin convertir la energía normalizada en julios o par real.',
    labs: ['wind', 'release', 'block', 'unblock', 'inspect', 'restore'],
    views: ['normal', 'energy-flow', 'schematic', 'textual'],
    activities: [
      ['classify-energy-functions', 'Clasificar energía, transmisión, regulación e indicación', 'explain-energy-chain'],
      ['interrupt-energy-chain', 'Activar, bloquear y restaurar la cadena energética', 'explain-energy-chain'],
    ],
  },
  {
    slug: 'barrel',
    title: 'Muelle real y barrilete',
    purpose: 'Relacionar muelle, árbol, tambor, tapa, carga, descarga y reserva conceptual.',
    subsystem: 'barrel',
    role: 'barrel',
    sourceIds: [bookSourceIds.mainspring, originalSourceId],
    competencySlugs: ['explain-barrel'],
    body: 'El laboratorio separa muelle, árbol, tambor y tapa. La carga cambia una magnitud normalizada; la deformación visual es didáctica y la reserva deriva únicamente de entradas simplificadas. La brida deslizante se presenta como familia conceptual de ciertos automáticos, no como propiedad universal.',
    labs: ['wind', 'release', 'block', 'unblock', 'inspect', 'restore'],
    views: ['section', 'schematic', 'energy-flow', 'textual'],
    activities: [
      ['load-unload-barrel', 'Cargar y descargar un barrilete', 'explain-barrel'],
      ['identify-barrel-parts', 'Identificar partes del barrilete', 'explain-barrel'],
    ],
  },
  {
    slug: 'gear-pair',
    title: 'Ruedas, piñones y engrane',
    purpose: 'Calcular una relación ideal, predecir sentido y diagnosticar un engrane imposible.',
    subsystem: 'gear-pair',
    role: 'train',
    sourceIds: [bookSourceIds.wheels, originalSourceId],
    competencySlugs: ['calculate-simple-ratios', 'determine-rotation-direction'],
    body: 'Para un engrane externo ideal, las vueltas de la conducida por vuelta de la conductora son Z conductora dividido entre Z conducida y el sentido se invierte. Una rueda intermedia cambia el sentido final sin cambiar por sí sola el módulo de la relación total. La distancia entre centros se valida como estado geométrico conceptual, no mediante perfiles reales.',
    labs: ['change-ratio', 'engage', 'disengage', 'add-stage', 'remove-stage', 'restore'],
    views: ['normal', 'schematic', 'kinematics', 'textual'],
    activities: [
      ['predict-pair-direction', 'Predecir el sentido de un par de ruedas', 'determine-rotation-direction'],
      ['calculate-pair-ratio', 'Calcular la relación de un par', 'calculate-simple-ratios'],
      ['detect-impossible-mesh', 'Detectar un engrane imposible', 'calculate-simple-ratios'],
    ],
  },
  {
    slug: 'train',
    title: 'Construir un tren de rodaje',
    purpose: 'Componer etapas, calcular reducción acumulada y observar interrupciones.',
    subsystem: 'train',
    role: 'train',
    sourceIds: [bookSourceIds.wheels, bookSourceIds.design, originalSourceId],
    competencySlugs: ['build-functional-train', 'calculate-simple-ratios', 'determine-rotation-direction'],
    body: 'Cada etapa conserva identidad, dientes educativos, tipo de engrane, dirección y estado. La relación total es el producto exacto de las etapas declaradas. Retirar o desengranar una etapa produce una salida interrumpida; no se atribuyen los conteos de dientes al 8215.',
    labs: ['add-stage', 'remove-stage', 'change-ratio', 'engage', 'disengage', 'block', 'restore'],
    views: ['normal', 'schematic', 'kinematics', 'energy-flow', 'textual'],
    activities: [
      ['build-train', 'Construir un tren', 'build-functional-train'],
      ['calculate-total-ratio', 'Calcular la relación total', 'calculate-simple-ratios'],
      ['interrupt-train', 'Bloquear o retirar una etapa y explicar el resultado', 'build-functional-train'],
    ],
  },
  {
    slug: 'supports',
    title: 'Pivotes, rubíes, puentes y libertad',
    purpose: 'Reconocer apoyos superior e inferior y diferenciar libertad de desalineación.',
    subsystem: 'supports',
    role: 'train',
    sourceIds: [bookSourceIds.jewels, bookSourceIds.design, originalSourceId],
    competencySlugs: ['recognize-supports-clearances'],
    body: 'Una rueda necesita apoyos coherentes en platina y puente. El laboratorio exagera pivote fuera del rubí, exceso axial, ausencia de libertad y roce para hacerlos visibles. Endshake y sideshake se explican cualitativamente; no reciben tolerancias reales.',
    labs: ['align', 'misalign', 'inspect', 'restore'],
    views: ['normal', 'section', 'isolated', 'uncertainty', 'textual'],
    activities: [
      ['identify-pivots-supports', 'Identificar pivotes y apoyos', 'recognize-supports-clearances'],
      ['detect-mis-seated-wheel', 'Detectar una rueda mal asentada', 'recognize-supports-clearances'],
    ],
  },
  {
    slug: 'escapement',
    title: 'El escape de áncora suizo',
    purpose: 'Ordenar bloqueo, desbloqueo, impulso y caída sin formar para un ajuste físico.',
    subsystem: 'escapement',
    role: 'escape-wheel',
    sourceIds: [bookSourceIds.escapement, originalSourceId],
    competencySlugs: ['order-escapement-phases'],
    body: 'Ocho estados discretos representan la alternancia izquierda y derecha: bloqueo, desbloqueo, impulso y caída. El timeline puede pausarse, retroceder y avanzar de fase. Las zonas de contacto son conceptuales; no se inventan ángulos, penetraciones, draw, pérdidas ni lubricación.',
    labs: ['step-escapement', 'scrub-escapement', 'set-escapement-speed', 'pause-escapement', 'block', 'unblock', 'inspect', 'restore'],
    views: ['normal', 'section', 'slow-motion', 'step-by-step', 'kinematics', 'textual'],
    activities: [
      ['order-escapement-phases', 'Ordenar las fases del escape', 'order-escapement-phases'],
      ['identify-lock-impulse-drop', 'Identificar bloqueo, impulso y caída', 'order-escapement-phases'],
    ],
  },
  {
    slug: 'oscillator',
    title: 'Volante y espiral',
    purpose: 'Distinguir frecuencia, periodo y amplitud mediante un modelo normalizado.',
    subsystem: 'oscillator',
    role: 'balance',
    sourceIds: [bookSourceIds.oscillator, originalSourceId],
    competencySlugs: ['distinguish-frequency-amplitude'],
    body: 'La frecuencia fija el periodo ideal T=1/f; las alternancias por hora son f×2×3600. La amplitud cambia de forma independiente en el laboratorio. Modificar la longitud activa es una acción simbólica: no se resuelve la dinámica de una espiral real ni se deduce marcha.',
    labs: ['set-oscillator', 'pause-oscillator', 'set-hairspring-active-length', 'oscillate', 'block', 'unblock', 'inspect', 'restore'],
    views: ['normal', 'slow-motion', 'step-by-step', 'kinematics', 'textual'],
    activities: [
      ['distinguish-frequency-amplitude', 'Diferenciar frecuencia y amplitud', 'distinguish-frequency-amplitude'],
      ['configure-oscillator', 'Configurar frecuencia y amplitud conceptual', 'distinguish-frequency-amplitude'],
    ],
  },
  {
    slug: 'escape-oscillator',
    title: 'Escape y oscilador como sistema',
    purpose: 'Explicar cómo tren, escape y oscilador cooperan sin diagnosticar una causa única.',
    subsystem: 'integration',
    role: 'pallet-fork',
    sourceIds: [bookSourceIds.escapement, bookSourceIds.oscillator, originalSourceId],
    competencySlugs: ['explain-escape-oscillator-system', 'diagnose-conceptual-interruption'],
    body: 'El tren aporta energía; el escape bloquea, libera e impulsa; el oscilador establece el ritmo y recibe reposición energética. Una amplitud baja puede tener múltiples causas. Los casos separan síntoma, hipótesis, prueba y conclusión permitida.',
    labs: ['set-oscillator', 'pause-oscillator', 'set-hairspring-active-length', 'step-escapement', 'scrub-escapement', 'oscillate', 'block', 'unblock', 'introduce-fault', 'inspect', 'restore'],
    views: ['normal', 'energy-flow', 'kinematics', 'step-by-step', 'textual'],
    activities: [
      ['relate-escape-oscillator', 'Relacionar escape y oscilador', 'explain-escape-oscillator-system'],
      ['predict-escapement-interruption', 'Predecir una interrupción del sistema', 'diagnose-conceptual-interruption'],
    ],
  },
  {
    slug: 'motion-works',
    title: 'Minutería e indicación',
    purpose: 'Relacionar tren de marcha, fricción, minutería y agujas.',
    subsystem: 'motion-works',
    role: 'motion-works',
    sourceIds: [bookSourceIds.wheels, originalSourceId],
    competencySlugs: ['explain-motion-works'],
    body: 'El cañón de minutos, la rueda de minutería y la rueda de horas forman una rama de indicación. El modelo usa una relación didáctica de doce horas y permite desacoplar la salida, avanzar tiempo y representar agujas rozando sin fingir alturas reales.',
    labs: ['engage', 'disengage', 'rotate', 'set-time', 'introduce-fault', 'restore'],
    views: ['normal', 'schematic', 'kinematics', 'textual'],
    activities: [
      ['build-motion-works', 'Construir la minutería', 'explain-motion-works'],
      ['set-indication', 'Ajustar una indicación horaria', 'explain-motion-works'],
    ],
  },
  {
    slug: 'keyless',
    title: 'Cuerda y puesta en hora',
    purpose: 'Reconstruir estados de corona sin atribuir una disposición universal.',
    subsystem: 'keyless',
    role: 'keyless',
    sourceIds: [bookSourceIds.design, originalSourceId],
    competencySlugs: ['explain-keyless'],
    body: 'Los estados winding, neutral y time-setting declaran su función y rama activa. Corona, tija, piñón corredizo, tirete y báscula se representan conceptualmente. Una transición inválida produce diagnóstico y no fuerza el modelo.',
    labs: ['change-crown-position', 'rotate', 'engage', 'disengage', 'set-time', 'inspect', 'restore'],
    views: ['normal', 'schematic', 'kinematics', 'textual'],
    activities: [
      ['reconstruct-crown-states', 'Reconstruir estados de la tija', 'explain-keyless'],
      ['operate-winding-setting', 'Distinguir cuerda y puesta en hora', 'explain-keyless'],
    ],
  },
  {
    slug: 'automatic-calendar',
    title: 'Carga automática y calendario básico',
    purpose: 'Seguir ramas conceptuales de automático y calendario sin modelar el 8215 en detalle.',
    subsystem: 'automatic',
    role: 'barrel',
    sourceIds: [bookSourceIds.mainspring, bookSourceIds.design, originalSourceId],
    competencySlugs: ['explain-automatic-winding', 'explain-basic-calendar'],
    body: 'El rotor, la reducción y la reversión se comparan como familias unidireccional y bidireccional. El calendario deriva de la indicación y recorre días 1–31 con arrastre y salto simbólicos. No se prescribe una ventana segura específica ni el mecanismo exacto del 8215.',
    labs: ['enable-automatic', 'disable-automatic', 'advance-calendar', 'introduce-fault', 'inspect', 'restore'],
    views: ['normal', 'schematic', 'energy-flow', 'textual'],
    activities: [
      ['follow-automatic-energy', 'Seguir la carga automática', 'explain-automatic-winding'],
      ['explain-date-change', 'Explicar el cambio de fecha', 'explain-basic-calendar'],
    ],
  },
  {
    slug: 'final-project',
    title: 'Integración y proyecto final',
    purpose: 'Construir, interrumpir, diagnosticar y documentar un movimiento conceptual completo.',
    subsystem: 'integration',
    role: 'indication',
    sourceIds: [bookSourceIds.design, originalSourceId],
    competencySlugs: ['diagnose-conceptual-interruption', 'compare-conceptual-real', 'document-fidelity-limits'],
    body: 'El dossier reúne arquitectura, relaciones, cálculos, fuentes, decisiones, límites de fidelidad, hipótesis y pruebas. La comparación con el MIYOTA 8215 usa únicamente identidades, subsistemas y la estructura documentada; no transfiere dientes, movimiento, tolerancias ni procedimientos de servicio.',
    labs: ['wind', 'add-stage', 'change-ratio', 'set-oscillator', 'set-hairspring-active-length', 'step-escapement', 'scrub-escapement', 'oscillate', 'set-time', 'change-crown-position', 'enable-automatic', 'advance-calendar', 'introduce-fault', 'inspect', 'project-enable-subsystem', 'project-record-decision', 'restore', 'undo'],
    views: ['normal', 'energy-flow', 'kinematics', 'compare-8215', 'provenance', 'uncertainty', 'textual'],
    activities: [
      ['introduce-fault', 'Introducir un fallo', 'diagnose-conceptual-interruption'],
      ['formulate-hypothesis', 'Formular una hipótesis y una prueba', 'diagnose-conceptual-interruption'],
      ['build-final-project', 'Construir el proyecto final', 'document-fidelity-limits'],
      ['compare-with-8215', 'Comparar el conceptual con el 8215', 'compare-conceptual-real'],
      ['document-limitations', 'Documentar limitaciones y pruebas pendientes', 'document-fidelity-limits'],
    ],
  },
]

const privateSources = [
  [bookSourceIds.wheels, 'Wheels and Pinions', 'capítulo 5 · PDF pp. 124–167 verificadas; inicio visual en p. 124', 'Relaciones, ruedas, piñones y trenes como teoría general.'],
  [bookSourceIds.jewels, 'Jewelling', 'capítulo 7 · PDF pp. 195–213 verificadas; inicio visual en p. 195', 'Rubíes y apoyos como teoría general; sin tolerancias trasladadas.'],
  [bookSourceIds.escapement, 'Escapements', 'capítulo 8 · PDF pp. 214–271 verificadas; inicio visual en p. 214', 'Principios de escape; no se copian ángulos o ajustes.'],
  [bookSourceIds.mainspring, 'Mainsprings and Accessories', 'capítulo 9 · PDF pp. 272–297 verificadas; inicio visual en p. 272', 'Muelle real, barrilete y variación de entrega como teoría general.'],
  [bookSourceIds.design, 'Movement Design', 'capítulo 10 · PDF pp. 298–335 verificadas; inicio visual en p. 298', 'Arquitectura y disposición como teoría general.'],
  [bookSourceIds.oscillator, 'The Balance and Spring', 'capítulo 11 · PDF pp. 336–370 verificadas; inicio visual en p. 336', 'Volante, espiral e isocronismo como teoría general.'],
].map(([id, chapter, locator, supportedClaim]) => ({
  id,
  authority: 'private-book-theory',
  usage: 'private-local',
  resource: { kind: 'book', title: `Libro privado de teoría relojera · ${chapter}`, locator },
  sourceType: 'private-book',
  chapter,
  privateUse: true,
  supportedClaim,
  derivedLayer: 'source',
}))
const official8215 = base4c.sources.filter(({ id }) => id.startsWith('source.miyota.8215.')).map((source) => structuredClone(source))
const sources = [
  ...privateSources,
  ...official8215,
  {
    id: originalSourceId,
    authority: 'original-educational',
    usage: 'user-created',
    resource: { kind: 'note', title: 'Sistema 4E · Fundamentos del reloj mecánico' },
    authorOrManufacturer: 'Watch Prototype Lab',
    sourceType: 'original-educational-content',
    importedAt: '2026-07-27',
    privateUse: true,
    supportedClaim: 'Laboratorios, cálculos educativos, explicaciones, actividades y evaluación originales.',
    derivedLayer: 'source',
  },
]

const selectorFor = (role) => ({ selector: { by: 'role', value: role }, cardinality: 'one-or-more' })
const templateScene = base4d.scenes[0]
const templateBlock = base4d.blocks[0]
const templateActivity = base4d.activities[0]
const templateCompetency = base4d.competencies[0]
const templateEvidence = base4d.evidenceTemplates[0]
const templateRubric = base4d.rubrics[0]

const conceptDocs = competencies.map(([slug, title, subsystem], index) => ({
  id: `concept.mechanical.${slug}`,
  version,
  title: es(title),
  summary: es(`${title} mediante relaciones explicadas, cálculos reproducibles y límites visibles en la ficha técnica.`),
  kind: ['gear-pair', 'oscillator'].includes(subsystem) ? 'concept' : 'skill',
  prerequisiteIds: index === 0 ? [] : [`concept.mechanical.${competencies[Math.max(0, index - 1)][0]}`],
  relatedIds: [],
  competencyIds: [`competency.mechanical.${slug}`],
  movementIds: [fixtureId],
  subsystem,
  routeIds: ['route.mechanical.foundations'],
  activityIds: modules.flatMap(({ activities }) => activities.filter(([, , competency]) => competency === slug).map(([activity]) => `activity.mechanical.${activity}`)),
  sourceIds: [originalSourceId],
  availability: index === 0 ? 'available' : 'prerequisite-blocked',
}))

const scenes = modules.map((module, index) => {
  const scene = structuredClone(templateScene)
  scene.id = `scene.mechanical.${module.slug}`
  scene.title = module.title
  scene.description = `${module.purpose} Laboratorio manipulable, reversible y accesible.`
  scene.fixtureBinding = { kind: 'fixture', fixtureId }
  scene.requiredCapabilities = capabilities
  scene.state = { selected: [], visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1 }
  scene.timeline = [
    { atMs: 0, operation: 'highlight', targets: [selectorFor(module.role)], durationMs: 0, essential: false, waitFor: 'interaction' },
    { atMs: 600, operation: 'explode', targets: [], value: ['barrel', 'supports'].includes(module.slug) ? 0.3 : 0.1, durationMs: 300, essential: false, waitFor: 'none' },
  ]
  scene.overlays = [{
    kind: 'text',
    id: `overlay.mechanical.${module.slug}.fidelity`,
    markdown: `${module.title}: modelo conceptual con cálculos ideales; la comparación con el 8215 se mantiene separada. Consulta la ficha técnica para conocer el alcance de geometría, movimiento y física.`,
    accessibleLabel: `${module.title}. Fidelidad y limitaciones disponibles en texto.`,
  }]
  scene.accessibility = {
    textualAlternative: `Lista de entidades, relaciones, entradas, fórmulas, resultados, estados y límites para ${module.title}.`,
    reducedMotionAlternative: 'Estados discretos y fases numeradas con los mismos cálculos y evaluación.',
    keyboardActions: ['Tabular por subsistema, entidad y acción.', 'Activar con Intro o Espacio.', 'Deshacer y restaurar mediante controles nombrados.'],
    colorIndependentCues: ['Texto y estado acompañan cada color.', 'Dirección, bloqueo y confianza se expresan también con palabras.'],
  }
  scene.steps = [{
    id: `step.mechanical.${module.slug}.observe`,
    instructionMarkdown: `Observa ${module.title.toLowerCase()}, formula una predicción y registra el estado inicial.`,
    questions: [{
      id: `question.mechanical.${module.slug}.classification`,
      promptMarkdown: '¿Qué tipo de resultado produce el laboratorio?',
      responseKind: 'single-choice',
      options: [
        { id: `option.mechanical.${module.slug}.educational`, label: 'Cálculo o simulación educativa declarada', labels: es('Cálculo o simulación educativa declarada') },
        { id: `option.mechanical.${module.slug}.engineering`, label: 'Validación de ingeniería del MIYOTA 8215', labels: es('Validación de ingeniería del MIYOTA 8215') },
      ],
      hints: [],
      authoring: {
        prompt: es('¿Qué tipo de resultado produce el laboratorio?'),
        feedback: es('El resultado es educativo y conserva fórmula, entradas, unidades, fidelidad y limitación.'),
      },
    }],
  }, {
    id: `step.mechanical.${module.slug}.execute`,
    instructionMarkdown: 'Ejecuta comandos semánticos, compara el resultado, explica el límite y restaura.',
    questions: [],
  }]
  scene.storyboard = {
    sceneName: es(module.title),
    purpose: es(module.purpose),
    prerequisites: index === 0 ? [] : [`concept.mechanical.${modules[index - 1].competencySlugs[0]}`],
    narrative: es(module.body),
    initialFraming: es('Vista estable del subsistema conceptual; sin movimiento automático obligatorio.'),
    protagonist: selectorFor(module.role),
    secondaryParts: [],
    sequence: [
      {
        id: `story.mechanical.${module.slug}.observe`,
        sceneStepId: `step.mechanical.${module.slug}.observe`,
        narrative: es('Observar y predecir antes de manipular.'),
        timelineIndexes: [0],
        runtimeActions: ['inspect', 'predict'],
        interaction: es('Seleccionar mediante teclado o puntero.'),
        feedback: es('La predicción se conserva antes de mostrar el resultado.'),
      },
      {
        id: `story.mechanical.${module.slug}.execute`,
        sceneStepId: `step.mechanical.${module.slug}.execute`,
        narrative: es('Manipular, calcular, comparar, explicar y restaurar.'),
        timelineIndexes: [1],
        runtimeActions: ['mechanical-lab-command', 'checkpoint', 'restore'],
        interaction: es('Botones y menús semánticos; sin arrastre obligatorio.'),
        feedback: es('El diagnóstico señala entrada, relación o estado inválido sin fingir física.'),
      },
    ],
    ending: es('Estado restaurado y evidencia disponible.'),
    restoration: es('Restaurar grafo, configuración, energía, fallos, vista y selección.'),
    accessibility: es('Orden único, fórmulas legibles y alternativa textual equivalente.'),
    reducedMotion: es('Fases estáticas numeradas y cambios discretos con igual resultado.'),
    evidenceTemplateIds: module.competencySlugs.map((slug) => `evidence.mechanical.${slug}`),
    technicalCriteria: ['Acciones validadas.', 'Cálculos reproducibles.', 'Modelo conceptual y 8215 separados.', 'El proyecto técnico original permanece intacto.'],
    limitations: fidelity.limitations,
  }
  scene.restorePreviousState = true
  return scene
})

const activityDocs = modules.flatMap((module, moduleIndex) => module.activities.map(([slug, title, competencySlug], activityIndex) => {
  const activity = structuredClone(templateActivity)
  activity.id = `activity.mechanical.${slug}`
  activity.version = version
  activity.title = title
  activity.sceneIds = [`scene.mechanical.${module.slug}`]
  activity.competencyIds = [`competency.mechanical.${competencySlug}`]
  activity.evidenceTemplateIds = [`evidence.mechanical.${competencySlug}`]
  activity.rubricId = `rubric.mechanical.${competencySlug}`
  activity.projectReference = { kind: 'fixture-readonly', fixtureId }
  activity.authoring = {
    lessonId: `lesson.mechanical.${module.slug}`,
    title: es(title),
    description: es(`${title} mediante el laboratorio funcional, cálculos declarados, evidencia y restauración.`),
    difficulty: moduleIndex < 3 ? 'introductory' : moduleIndex < 9 ? 'intermediate' : 'advanced',
    durationMinutes: module.slug === 'final-project' ? 30 : 14,
    activityType: activityIndex === 0 ? 'guided-practice' : 'prediction',
    movementIds: [fixtureId, comparisonFixtureId],
    familyIds: ['conceptual-mechanical'],
    subsystem: module.subsystem,
    requiredCapabilities: capabilityIds,
    languages: ['es-ES'],
    offline: true,
    fidelity,
    warnings: {
      es: ['Modelo normalizado: no es física ni servicio de un calibre real.', 'El 8215 solo aporta comparación estructural documentada.'],
      en: [],
    },
    sourceIds: module.sourceIds,
    visualResourceIds: [`visual.mechanical.${module.slug}`],
    fixtureBinding: { kind: 'fixture', fixtureId },
    interactionContract: {
      responseModel: 'single-choice',
      orderedItems: [],
      expectedOrderIds: [],
      structuredFields: [],
      hints: [
        ['orientation', 'Identifica primero entrada, salida y estado.'],
        ['subsystem', 'Aísla el subsistema implicado.'],
        ['functional-property', 'Revisa relación, dirección y bloqueo.'],
        ['comparison', 'Compara el resultado numérico con la alternativa textual.'],
        ['near-answer', 'Distingue magnitud normalizada de dato oficial.'],
        ['post-attempt-explanation', 'Explica después del intento qué puede y qué no puede concluirse.'],
      ].map(([kind, content], hintIndex) => ({
        id: `hint.mechanical.${slug}.${hintIndex + 1}`,
        level: hintIndex + 1,
        kind,
        content: es(content),
        availableAfterAttempts: hintIndex === 5 ? 1 : 0,
        countsAsHint: true,
      })),
      evidencePolicy: {
        eventType: 'mechanical-lab-command',
        recordsAnswerPayload: true,
        deterministicComponents: [],
        requiresHumanReview: module.slug === 'final-project',
        accessibilityAdaptationsCountAsHints: false,
      },
    },
    mechanicalLabContract: {
      fixtureId,
      comparisonFixtureId,
      subsystem: module.subsystem,
      commands: module.labs,
      viewModes: module.views,
      normalizedPhysicsOnly: true,
      textualAlternative: true,
      reducedMotion: true,
    },
    pedagogicalPattern: {
      enabled: true,
      stages: ['observe', 'predict', 'manipulate', 'execute-or-simulate', 'compare', 'explain', 'record-evidence'],
    },
  }
  return activity
}))

const competencyDocs = competencies.map(([slug, title, subsystem], index) => ({
  ...structuredClone(templateCompetency),
  id: `competency.mechanical.${slug}`,
  version,
  title,
  description: `${title} mediante un laboratorio conceptual, evidencia y límites de fidelidad explícitos.`,
  prerequisites: index === 0 ? [] : [`competency.mechanical.${competencies[Math.max(0, index - 1)][0]}`],
  authoring: {
    title: es(title),
    description: es(`${title}; el tiempo y las adaptaciones accesibles no penalizan.`),
    movementIds: [fixtureId, comparisonFixtureId],
    subsystem,
    skillType: ['diagnosis', 'comparison', 'documentation'].includes(subsystem) ? 'diagnosis' : ['energy', 'gear-pair', 'oscillator'].includes(subsystem) ? 'knowledge' : 'procedure',
    sourceIds: [originalSourceId],
  },
}))

const evidenceDocs = competencies.map(([slug], index) => {
  const evidence = structuredClone(templateEvidence)
  evidence.id = `evidence.mechanical.${slug}`
  evidence.version = version
  evidence.competencyId = `competency.mechanical.${slug}`
  evidence.kind = index >= 13 ? 'human-review' : 'procedure'
  evidence.scoringMethod = index >= 13 ? 'rubric' : 'binary'
  evidence.extraction = {
    id: `rule.extract.mechanical.${slug}`,
    version,
    triggerEventType: 'mechanical-lab-command',
    evidenceType: index === 13 ? 'diagnosis' : index >= 14 ? 'explanation' : 'simulation-result',
    competencyId: `competency.mechanical.${slug}`,
    packageId,
    activityIds: activityDocs.filter(({ competencyIds }) => competencyIds.includes(`competency.mechanical.${slug}`)).map(({ id }) => id),
    evidenceTemplateId: `evidence.mechanical.${slug}`,
    minimumSessionState: ['active', 'paused', 'completed'],
    confidence: index >= 13 ? 0.7 : 1,
    contentFields: ['sceneId', 'stepId', 'data', 'commandType', 'subsystem', 'activeFaults', 'projectDraft'],
  }
  return evidence
})

const rubricDocs = competencies.map(([slug, title], index) => {
  const rubric = structuredClone(templateRubric)
  rubric.id = `rubric.mechanical.${slug}`
  rubric.version = version
  rubric.competencyId = `competency.mechanical.${slug}`
  rubric.rules = [{
    id: `rule.mechanical.${slug}.demonstrated`,
    version,
    targetState: 'demonstrated',
    acceptedEvidenceKinds: ['answer', 'procedure', 'observation', 'artifact', 'human-review'],
    minimumEvidence: 1,
    minimumScore: 1,
    minimumDistinctSessions: 1,
    minimumSpanDays: 0,
    explanationTemplate: `${title}: se evalúan relación, justificación, restauración y límites; el tiempo no penaliza.`,
  }]
  rubric.assessmentRule = {
    id: `rule.composite.mechanical.${slug}.demonstrated`,
    version,
    competencyId: `competency.mechanical.${slug}`,
    targetState: 'demonstrated',
    condition: {
      op: 'all',
      conditions: [
        {
          op: 'exists',
          filter: {
            evidenceType: index === 13 ? 'diagnosis' : index >= 14 ? 'explanation' : 'simulation-result',
            status: 'active',
            minimumConfidence: index >= 13 ? 0.7 : 1,
          },
        },
        { op: 'minimum-evidence', count: 1 },
      ],
    },
  }
  return rubric
})

const blocks = modules.map((module, index) => {
  const block = structuredClone(templateBlock)
  block.id = `block.mechanical.${module.slug}`
  block.version = version
  block.title = module.title
  block.kind = 'explanation'
  block.bodyMarkdown = `## Propósito

${module.purpose}

## Objetivos observables

Predecir un resultado, manipular el laboratorio, justificar el cálculo o estado, separar modelo conceptual de calibre real y restaurar la sesión.

## Prerrequisitos

Se reutiliza la cadena funcional estudiada en Fundamentos del reloj mecánico. La ruta del MIYOTA 2035 es recomendable, pero no obligatoria.

## Explicación

${module.body}

## Interacción y actividad

Las acciones disponibles están validadas, pueden deshacerse y dejan un resultado comprobable. La fórmula, sus entradas, las unidades, el redondeo, la clasificación y la limitación acompañan todo resultado numérico.

## Fuentes y alcance de las afirmaciones

El libro privado se usa como teoría general en los capítulos declarados en la ficha de fuentes; no se copia texto. Cada explicación o cálculo del laboratorio indica si es una síntesis educativa o un resultado calculado. Los datos del 8215 solo proceden de documentación MIYOTA y nunca heredan el movimiento del modelo conceptual.

## Vocabulario

Consulta el glosario bilingüe de energía, par, rueda, piñón, apoyo, escape, oscilador, minutería, cuerda y puesta en hora, carga automática, calendario y alcance del modelo.

## Errores habituales y ayuda

Confundir frecuencia con amplitud; invertir la razón de dientes; olvidar un cambio de sentido; tratar un estado visual como tolerancia; o atribuir el modelo al 8215. El diagnóstico identifica la primera entrada o relación inválida.

## Evidencia y rúbrica

Se conservan acción, estado inicial y final, fórmula, resultado, fallos, ayudas, restauración y límites. El proyecto final requiere una revisión explicada. Para considerarlo consolidado se exige otra sesión y al menos siete días.

## Resumen y conexión

${module.purpose} ${index < modules.length - 1 ? `Continúa con “${modules[index + 1].title}”.` : 'El resultado es un dossier conceptual, no un diseño industrial ni una acreditación de servicio.'}`
  block.claims = [{
    id: `claim.mechanical.${module.slug}`,
    claimType: module.slug === 'gear-pair' || module.slug === 'train' || module.slug === 'oscillator' ? 'calculation' : 'source',
    classification: module.slug === 'gear-pair' || module.slug === 'train' || module.slug === 'oscillator' ? 'calculated' : 'original-explanation',
    claim: `${module.title} se representa mediante un modelo conceptual reversible y no como comportamiento exacto del 8215.`,
    ...(module.slug === 'gear-pair' || module.slug === 'train' || module.slug === 'oscillator'
      ? { expression: 'Relaciones educativas declarativas: Z conductora/Z conducida; producto de etapas; T=1/f y A/h=f×2×3600.' }
      : { sourceStatement: 'Teoría privada y explicación educativa original; sin reproducción textual ni datos específicos trasladados.' }),
    method: 'Modelo declarativo y cálculos deterministas del Sistema 4E',
    fidelity,
    reliability: 'medium',
    inputFingerprint: `system4e:${module.slug}:0.1.0`,
    recordedAt: '2026-07-27T13:30:00.000Z',
    methodVersion: version,
    sources: [structuredClone(sources.find(({ id }) => id === originalSourceId))],
  }]
  return block
})

const lessonDocs = modules.map((module, index) => ({
  id: `lesson.mechanical.${module.slug}`,
  version,
  title: module.title,
  blockIds: [`block.mechanical.${module.slug}`],
  activityIds: module.activities.map(([slug]) => `activity.mechanical.${slug}`),
  authoring: {
    title: es(module.title),
    purpose: es(module.purpose),
    objectives: [es('Predecir y manipular una relación mecánica.'), es('Explicar el resultado con fórmula o estado.'), es('Declarar límites y restaurar.')],
    prerequisiteConceptIds: index === 0 ? [] : [`concept.mechanical.${modules[index - 1].competencySlugs[0]}`],
    externalPrerequisites: index === 0 ? [{
      packageId: previousPackageId,
      versionRange: '^0.5.0',
      moduleIds: ['module.horology.functional-map'],
      competencyIds: functionalCompetencyPrerequisites,
      recommendedButOptionalRouteIds: ['route.quartz2035.isa-to-2035'],
    }] : [],
    conceptIds: module.competencySlugs.map((slug) => `concept.mechanical.${slug}`),
    sourceIds: module.sourceIds,
    visualResourceIds: [`visual.mechanical.${module.slug}`],
    visualStrategy: {
      objective: es(module.purpose),
      visibleConcept: es(`Laboratorio ${module.subsystem} con estados, relaciones y resultados declarados.`),
      modelReference: fixtureId,
      movementIds: [fixtureId, comparisonFixtureId],
      involvedSelectors: [selectorFor(module.role)],
      initialState: { cameraIntent: 'Vista estable del subsistema conceptual.', visible: [], hidden: [], isolated: [], explode: 0, transparency: [] },
      energyFlow: ['mainspring', 'barrel', 'train', 'escapement', 'oscillator', 'motion-works', 'indication'],
      rotationDirections: ['Dirección derivada de cada relación externa o interna.'],
      labels: ['entrada', 'salida', 'estado', 'fuente', 'G/K/P', 'limitación'],
      arrows: ['flujo energético y relación cinemática derivados del mismo grafo'],
      animations: ['timeline pausado, scrub y pasos discretos; reduced motion equivalente'],
      timelineIntent: 'Observar, predecir, ejecutar, comparar, explicar, guardar y restaurar.',
      userInteraction: 'Selección y acciones; teclado completo y sin arrastre obligatorio.',
      observableResult: es('El laboratorio produce un estado y un cálculo reproducibles sin alterar el proyecto técnico original.'),
      successCriterion: es('Resultado correcto para las entradas declaradas, explicación de límites y restauración.'),
      restoration: es('Restaurar configuración, bloqueos, fallos, timeline y vista.'),
      textualAlternative: es('Entidades, relaciones, fórmulas, entradas, salidas y fases en orden equivalente.'),
      reducedMotionAlternative: es('Estados discretos y fases numeradas con idéntica evaluación.'),
      fidelity,
      unknownData: ['geometría interna real', 'pérdidas reales', 'par real', 'tolerancias', 'conteos de dientes 8215 no documentados', 'lubricación'],
      requiredVisualResourceIds: [`visual.mechanical.${module.slug}`],
    },
  },
}))

const moduleDocs = modules.map((module) => ({
  id: `module.mechanical.${module.slug}`,
  version,
  title: es(module.title),
  purpose: es(module.purpose),
  lessonIds: [`lesson.mechanical.${module.slug}`],
}))

const visualResources = modules.map((module) => ({
  id: `visual.mechanical.${module.slug}`,
  version,
  type: module.slug === 'escapement' || module.slug === 'oscillator' ? 'kinematic-animation' : module.slug === 'final-project' ? 'overlay-comparison' : module.slug === 'supports' || module.slug === 'barrel' ? 'section-view' : 'conceptual-3d',
  purpose: es(`${module.title}: manipulación y alternativa textual sobre el laboratorio mecánico.`),
  status: 'ready',
  sourceIds: module.sourceIds,
  fidelity,
  lessonIds: [`lesson.mechanical.${module.slug}`],
  movementIds: [fixtureId, ...(module.slug === 'final-project' ? [comparisonFixtureId] : [])],
  partSelectors: [selectorFor(module.role)],
  requiredCapabilities: capabilityIds,
  dataRequirements: ['Modelo conceptual separado del 8215.', 'Cálculos declarativos.', 'Restauración.', 'Reduced motion y alternativa textual.'],
  priority: 'high',
  dependencyIds: [],
  currentModelSupport: 'yes',
  viewportImpact: 'configuration',
}))

const glossaryTerms = [
  ['energy', 'energía', 'energy'], ['force', 'fuerza', 'force'], ['torque', 'par', 'torque'], ['work', 'trabajo', 'work'],
  ['angular-velocity', 'velocidad angular', 'angular velocity'], ['gear-ratio', 'relación de transmisión', 'gear ratio'],
  ['driver-wheel', 'rueda conductora', 'driver wheel'], ['driven-wheel', 'rueda conducida', 'driven wheel'],
  ['arbor', 'árbol', 'arbor'], ['pivot', 'pivote', 'pivot'], ['endshake', 'endshake', 'endshake'],
  ['sideshake', 'sideshake', 'sideshake'], ['barrel', 'barrilete', 'barrel'], ['barrel-arbor', 'árbol del barrilete', 'barrel arbor'],
  ['drum', 'tambor', 'drum'], ['cover', 'tapa', 'cover'], ['slipping-bridle', 'brida deslizante', 'slipping bridle'],
  ['going-train', 'tren de rodaje', 'going train'], ['center-wheel', 'rueda de centro', 'center wheel'],
  ['third-wheel', 'tercera rueda', 'third wheel'], ['fourth-wheel', 'cuarta rueda', 'fourth wheel'],
  ['escape-wheel', 'rueda de escape', 'escape wheel'], ['escapement', 'escape', 'escapement'],
  ['pallet-fork', 'áncora', 'pallet fork'], ['pallet-stone', 'paleta', 'pallet stone'],
  ['locking', 'bloqueo', 'locking'], ['drop', 'caída', 'drop'], ['impulse', 'impulso', 'impulse'],
  ['balance', 'volante', 'balance'], ['hairspring', 'espiral', 'hairspring'], ['frequency', 'frecuencia', 'frequency'],
  ['period', 'periodo', 'period'], ['alternation', 'alternancia', 'alternation'], ['amplitude', 'amplitud', 'amplitude'],
  ['isochronism', 'isocronismo', 'isochronism'], ['beat-error', 'error de compás', 'beat error'],
  ['cannon-pinion', 'cañón de minutos', 'cannon pinion'], ['minute-wheel', 'rueda de minutería', 'minute wheel'],
  ['hour-wheel', 'rueda de horas', 'hour wheel'], ['stem', 'tija', 'stem'], ['sliding-pinion', 'piñón corredizo', 'sliding pinion'],
  ['setting-lever', 'tirete', 'setting lever'], ['yoke', 'báscula', 'yoke'], ['crown-wheel', 'rueda de corona', 'crown wheel'],
  ['automatic-rotor', 'rotor automático', 'automatic rotor'], ['reverser', 'reversor', 'reverser'],
  ['calendar', 'calendario', 'calendar'], ['quick-correction', 'corrección rápida', 'quick correction'],
]
const glossary = glossaryTerms.map(([slug, termEs, termEn]) => ({
  id: `term.mechanical.${slug}`,
  version,
  term: termEs,
  definitionMarkdown: `${termEs}: término del modelo mecánico conceptual con relación y procedencia declaradas.`,
  language: 'es-ES',
  authoring: {
    terms: { es: termEs, en: termEn },
    synonyms: { es: [], en: [] },
    discouragedTerms: [],
    simpleDefinition: es(`${termEs} dentro de un reloj mecánico.`),
    technicalDefinition: es(`${termEs} en un laboratorio conceptual que no atribuye geometría ni física exactas a un calibre.`),
    context: es('Ruta Fundamentos del reloj mecánico.'),
    sourceIds: [originalSourceId],
  },
}))

const recommendations = competencies.map(([slug, title], index) => ({
  id: `recommendation.mechanical.retain-${slug}`,
  version,
  kind: 'retention',
  title: es(`Práctica posterior: ${title.toLowerCase()}`),
  reason: es('Para considerarlo consolidado se exige otra actividad, una nueva sesión, evidencia independiente y al menos siete días.'),
  rule: 'independent-later-evidence-different-activity-session-minimum-7-days@1.0.0',
  priority: 60 + index,
  target: { kind: 'competency', id: `competency.mechanical.${slug}` },
  evidenceTemplateIds: [`evidence.mechanical.${slug}`],
  required: false,
}))

const pack = {
  manifest: {
    format: 'wplab-learning-pack',
    formatVersion: 1,
    schemaId: 'learning-pack-v1',
    packageVersion: version,
    id: packageId,
    title: 'Fundamentos del reloj mecánico',
    distribution: 'local-unsigned',
    editorialStatus: 'in-review',
    authors: [{ name: 'Watch Prototype Lab' }],
    languages: ['es-ES'],
    dependencies: [{ packageId: previousPackageId, versionRange: '^0.5.0' }],
    requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'canonical-selectors-v1@^1.0.0', 'reduced-motion@^1.0.0'],
    movements: [
      { manufacturer: 'Conceptual', calibre: 'mechanical-chain', referenceId: fixtureId },
      { manufacturer: 'MIYOTA', calibre: '8215', referenceId: comparisonFixtureId },
    ],
    assets: [],
    entries: {},
    minimumAppVersion: '0.10.0',
    createdAt: '2026-07-27T13:30:00.000Z',
  },
  curricula: [{
    id: 'curriculum.mechanical-foundations',
    version,
    title: es('Fundamentos mecánicos'),
    purpose: es('Comprender y manipular la cadena mecánica completa antes de estudiar un calibre real.'),
    routeIds: ['route.mechanical.foundations'],
    languages: ['es-ES'],
  }],
  routes: [{
    id: 'route.mechanical.foundations',
    version,
    title: es('Fundamentos del reloj mecánico'),
    purpose: es('Construir una comprensión visual, calculable y diagnosticable de un movimiento mecánico conceptual.'),
    prerequisiteConceptIds: [],
    moduleIds: moduleDocs.map(({ id }) => id),
    competencyIds: competencyDocs.map(({ id }) => id),
    movementIds: [fixtureId, comparisonFixtureId],
    difficulty: 'intermediate',
    sourceIds: sources.map(({ id }) => id),
    visualResourceIds: visualResources.map(({ id }) => id),
    demo: false,
  }],
  modules: moduleDocs,
  concepts: conceptDocs,
  blocks,
  lessons: lessonDocs,
  activities: activityDocs,
  scenes,
  competencies: competencyDocs,
  evidenceTemplates: evidenceDocs,
  rubrics: rubricDocs,
  glossary,
  sources,
  recommendations,
  visualResources,
}

const collections = [
  ['curricula', 'curriculum'], ['routes', 'routes'], ['modules', 'modules'], ['concepts', 'concepts'],
  ['blocks', 'blocks'], ['lessons', 'lessons'], ['activities', 'activities'], ['scenes', 'scenes'],
  ['competencies', 'competencies'], ['evidenceTemplates', 'evidence'], ['rubrics', 'rubrics'],
  ['glossary', 'glossary'], ['sources', 'sources'], ['recommendations', 'recommendations'],
  ['visualResources', 'visual-resources'],
]
for (const [name, folder] of collections) {
  pack.manifest.entries[name] = pack[name].map(({ id }) => ({ id, path: `${folder}/${id}.json` }))
  for (const document of pack[name]) await json(`${folder}/${document.id}.json`, document)
}
await json('manifest.json', pack.manifest)

await mkdir(join(root, 'dist'), { recursive: true })
await writeFile(join(root, 'dist', 'mechanical-lab-report.md'), `# Informe del laboratorio mecánico · Sistema 4E

- Paquete: \`${packageId}@${version}\`
- Ruta: **Fundamentos del reloj mecánico**
- Estado: \`in-review\`, \`local-unsigned\`
- ${modules.length} módulos, ${lessonDocs.length} lecciones, ${activityDocs.length} actividades.
- ${competencyDocs.length} competencias, ${evidenceDocs.length} evidencias, ${rubricDocs.length} rúbricas y ${recommendations.length} prácticas de retención.
- Laboratorio headless independiente de React con comandos semánticos, eventos, undo, snapshot y recuperación.
- 30 entidades conceptuales, 12 relaciones cinemáticas y 9 tramos del grafo energético.
- Cálculos: pareja, tren, dirección, frecuencia, periodo, alternancias/hora, minutería y reserva normalizada.
- Escape: ocho fases discretas con pausa, paso adelante/atrás, scrub, velocidad visual y alternativa textual.
- Modelo principal \`${fixtureId}\` G1/K2/P0; comparación \`${comparisonFixtureId}\` R2/G2/K2/P0 separada.
- Sin dientes, tolerancias, lubricación, física ni servicio específicos del MIYOTA 8215 inventados.
`, 'utf8')

console.log(`Sistema 4E materializado en ${root}`)
console.log(`${modules.length} módulos · ${activityDocs.length} actividades · ${competencyDocs.length} competencias · ${glossary.length} términos`)
