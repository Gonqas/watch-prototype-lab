import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = join(process.cwd(), 'learning-content', 'quartz-miyota2035')
const base = JSON.parse(await readFile(join(process.cwd(), 'learning-content', 'horology-foundations', 'dist', 'pack.json'), 'utf8'))
const version = '0.5.0'
const packageId = 'wplab.horology.quartz-miyota2035'
const fixtureId = 'fixture.miyota.2035.structural'
const previousPackageId = 'wplab.horology.functional-map'
const officialIds = [
  'source.miyota.2035.product-page',
  'source.miyota.2035.specification',
  'source.miyota.2035.drawing',
  'source.miyota.2035.instruction-manual',
  'source.miyota.2035.parts-list-exploded-view',
]
const bookWorkshopId = 'source.horology.private-book.workshop-equipment'
const bookToolsId = 'source.horology.private-book.hand-tools'
const originalId = 'source.horology.original-quartz-practical-route'
const es = (value) => ({ es: value })
const fidelity = {
  geometry: 'G2',
  kinematics: 'K2',
  physics: 'P0',
  limitations: [
    'Fixture MIYOTA 2035 R2 con geometría interna normalizada.',
    'Banco semántico reversible; no es un procedimiento de servicio ni una simulación física validada.',
  ],
}
const capabilityVersions = [
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
const capabilityIds = capabilityVersions.map((value) => value.split('@')[0])

async function json(relative, value) {
  const path = join(root, relative)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const modules = [
  {
    slug: 'workstation',
    title: 'El puesto de trabajo',
    purpose: 'Preparar un entorno ordenado antes de observar o manipular.',
    competency: 'prepare-safe-workstation',
    sourceIds: [bookWorkshopId, originalId],
    visual: 'Banco con soporte, herramientas, bandeja, inspección y documentación.',
    body: 'La preparación precede a cualquier desmontaje. Se asignan zonas estables, se comprueba iluminación, se protege el movimiento del polvo y se prepara un registro. La fotografía o nota simulada conserva contexto sin fingir una observación física. Una condición insegura debe corregirse antes de continuar.',
    activities: [
      ['prepare-workbench', 'Preparar el banco', 'guided-practice'],
      ['detect-unsafe-conditions', 'Detectar condiciones inseguras', 'prediction'],
    ],
  },
  {
    slug: 'tools',
    title: 'Herramientas fundamentales',
    purpose: 'Elegir una capacidad semántica adecuada y reconocer sus límites.',
    competency: 'select-basic-tools',
    sourceIds: [bookToolsId, originalId],
    visual: 'Paleta accesible de soporte, destornillador, pinzas, lupa, pera, útiles de agujas, calibre y multímetro conceptual.',
    body: 'Una herramienta se elige por la operación y el riesgo, no por una marca. El destornillador exige confirmar ajuste sin prescribir medida; las pinzas recogen, colocan y orientan; la lupa inspecciona. El calibre y el multímetro no generan valores ficticios: registran que hace falta una medición o un procedimiento.',
    activities: [
      ['select-tools', 'Seleccionar herramientas', 'guided-practice'],
      ['reject-wrong-tool', 'Rechazar una herramienta inadecuada', 'prediction'],
    ],
  },
  {
    slug: 'observe',
    title: 'Observar antes de desmontar',
    purpose: 'Aplicar un protocolo de identificación, observación y registro previo.',
    competency: 'observe-before-disassembly',
    sourceIds: [bookWorkshopId, ...officialIds, originalId],
    visual: 'Vistas estables del 2035 con lupa, etiquetas, procedencia y ficha de observación.',
    body: 'Se observa cara de indicación, cara posterior, lateral, tija, pila, circuito, bobina, cubiertas, tren visible y tornillos. Cada nota se clasifica como visto, documentado, inferido o desconocido. Desmontar solo tiene sentido cuando existe un objetivo y un estado inicial registrado.',
    activities: [
      ['identify-movement-zones', 'Identificar zonas del movimiento', 'observation-3d'],
      ['record-initial-condition', 'Registrar el estado inicial', 'guided-practice'],
    ],
  },
  {
    slug: 'isa-memory',
    title: 'Del recuerdo del ISA 8172 a una observación trazable',
    purpose: 'Separar memoria, observación, fotografía, inferencia y fuente oficial.',
    competency: 'distinguish-observation-inference',
    sourceIds: [originalId],
    visual: 'Mapa personal sin geometría atribuida al ISA 8172 y comparación funcional con el 2035.',
    body: 'El usuario registra qué recuerda de su ISA 8172 sin convertirlo en configuración exacta. La comparación solo relaciona funciones. No afirma compatibilidad, igualdad dimensional, intercambiabilidad ni una misma secuencia de servicio.',
    activities: [
      ['create-isa-confidence-map', 'Crear mapa de confianza ISA 8172', 'guided-practice'],
      ['compare-isa-functionally', 'Comparar ISA 8172 y 2035 por función', 'comparison'],
    ],
  },
  {
    slug: 'documentation',
    title: 'Cómo leer la documentación del MIYOTA 2035',
    purpose: 'Localizar, interpretar y clasificar información oficial sin memorizarla.',
    competency: 'locate-official-data',
    sourceIds: [...officialIds, originalId],
    visual: 'Tabla derivada que enlaza ficha, especificación, plano, manual y despiece.',
    body: 'La ficha identifica el producto; la especificación aporta datos nominales; el plano expresa envolvente e interfaces; la vista explosionada y la lista permiten asociar llamadas y referencias. El lector debe reconocer también lo que un documento no ofrece. Una forma reconstruida nunca se convierte en dimensión oficial.',
    activities: [
      ['read-drawing', 'Leer un plano', 'guided-practice'],
      ['associate-reference-part', 'Asociar referencias y piezas', 'guided-practice'],
    ],
  },
  {
    slug: 'anatomy',
    title: 'Anatomía completa del MIYOTA 2035',
    purpose: 'Organizar las piezas utilizables por subsistema, relación y procedencia.',
    competency: 'identify-2035-subsystems',
    sourceIds: [...officialIds, originalId],
    visual: 'Vista completa, subsistemas, explosionado, transparencia, ruta y vecinos.',
    body: 'El modelo didáctico organiza alimentación, control electrónico, conversión electromecánica, tren, indicación, puesta en hora, estructura y sujeción. Cada pieza conserva nombre, referencia, relaciones y fuente. Sus límites geométricos, de movimiento y de física aparecen en la ficha técnica. Los marcadores documentales permanecen visibles como limitación, no como pieza desmontable.',
    activities: [
      ['classify-subsystems', 'Clasificar subsistemas', 'guided-practice'],
      ['follow-functional-chain', 'Seguir la cadena funcional', 'observation-3d'],
    ],
  },
  {
    slug: 'disassembly',
    title: 'Desmontaje virtual guiado',
    purpose: 'Ejecutar operaciones respaldadas, conservar identidad y crear checkpoints.',
    competency: 'disassemble-virtually',
    sourceIds: [...officialIds, bookToolsId, originalId],
    visual: 'Banco 2035 con herramienta, dependencias, bandeja y registro de orientación.',
    body: 'El entorno de práctica distingue dependencias documentadas, estructurales, educativas, inferidas y no verificadas. Solo bloquea las relaciones explícitas. Preparar, anotar, aislar la energía, elegir herramienta, comprobar dependencias, retirar, colocar, orientar y guardar un punto de control son acciones separadas. La vista explosionada no se presenta como un manual completo.',
    activities: [
      ['order-disassembly-steps', 'Ordenar pasos respaldados', 'guided-practice'],
      ['disassemble-to-tray', 'Elegir pieza, retirar y colocar en bandeja', 'guided-practice'],
    ],
  },
  {
    slug: 'assembly',
    title: 'Montaje virtual y comprobaciones',
    purpose: 'Reconstruir desde bandeja validando soporte, orientación e identidad.',
    competency: 'assemble-virtually',
    sourceIds: [...officialIds, bookToolsId, originalId],
    visual: 'El mismo banco virtual y el mismo modelo del movimiento se usan en los modos guiado, asistido y libre.',
    body: 'El montaje no supone que todo orden inverso sea literal. La pieza debe estar orientada y alineada; un soporte requerido debe estar presente; el tornillo conserva su instancia y se verifica tras instalar. Lo no representable se declara como pendiente de manual, medición o revisión humana.',
    activities: [
      ['assemble-guided', 'Montar en modo guiado', 'guided-practice'],
      ['assemble-assisted-free', 'Montar en modo asistido y libre', 'guided-practice'],
    ],
  },
  {
    slug: 'diagnosis',
    title: 'Comprobación y diagnóstico básico',
    purpose: 'Relacionar síntoma, subsistema, hipótesis, comprobación y límites.',
    competency: 'reason-about-symptom',
    sourceIds: [...officialIds, originalId],
    visual: 'Errores simbólicos reversibles con observación y prueba adicional pendiente.',
    body: 'Los casos incluyen pila ausente, contacto incorrecto, bobina inactiva, rotor o tren bloqueado, rueda ausente, puesta en hora o agujas mal posicionadas, orientación incorrecta y cierre incompleto. Cada caso separa lo observado de lo que no puede concluirse. No se inventan valores eléctricos.',
    activities: [
      ['identify-error-hypothesis', 'Identificar un error y proponer hipótesis', 'prediction'],
      ['choose-check', 'Elegir una comprobación', 'guided-practice'],
    ],
  },
  {
    slug: 'final-project',
    title: 'Proyecto final MIYOTA 2035',
    purpose: 'Completar un dossier trazable que demuestre método y comprensión.',
    competency: 'document-movement',
    sourceIds: [...officialIds, bookWorkshopId, bookToolsId, originalId],
    visual: 'Dossier con fuentes, subsistemas, piezas, desconocidos, bandeja, montaje y diagnóstico.',
    body: 'El dossier integra identificación, fuentes, mapa, lista de piezas, desconocidos, secuencia declarada por autoridad, bandeja, desmontaje, montaje, comprobaciones, diagnóstico, procedencia y fidelidad. El resultado demuestra método inicial; no certifica reparación profesional de una unidad física.',
    activities: [
      ['complete-final-project', 'Completar proyecto final', 'explanation'],
      ['review-final-dossier', 'Revisar trazabilidad del dossier', 'guided-practice'],
    ],
  },
]

const competencyDefs = [
  ['prepare-safe-workstation', 'Preparar un puesto de trabajo seguro', 'workstation'],
  ['select-basic-tools', 'Seleccionar herramientas básicas', 'tools'],
  ['observe-before-disassembly', 'Observar antes de desmontar', 'inspection'],
  ['distinguish-observation-inference', 'Distinguir observación e inferencia', 'provenance'],
  ['locate-official-data', 'Localizar datos oficiales', 'documentation'],
  ['identify-2035-subsystems', 'Identificar subsistemas del 2035', 'anatomy'],
  ['identify-documented-parts', 'Identificar piezas documentadas', 'anatomy'],
  ['disassemble-virtually', 'Desmontar virtualmente de forma ordenada', 'disassembly'],
  ['preserve-identity-orientation', 'Conservar identidad y orientación', 'handling'],
  ['assemble-virtually', 'Montar virtualmente', 'assembly'],
  ['perform-partial-checks', 'Realizar comprobaciones parciales', 'verification'],
  ['reason-about-symptom', 'Razonar sobre un síntoma', 'diagnosis'],
  ['document-movement', 'Documentar un movimiento', 'dossier'],
]

const evidenceDefs = [
  ['preparation', 0], ['safety', 0], ['tool', 1], ['observation', 2], ['provenance', 3],
  ['document-reading', 4], ['identification', 6], ['classification', 5], ['sequence', 7],
  ['manipulation', 7], ['order', 7], ['orientation', 8], ['disassembly', 7],
  ['assembly', 9], ['verification', 10], ['diagnosis', 11], ['explanation', 11], ['final-project', 12],
]
const evidenceTypeBySlug = {
  preparation: 'simulation-result',
  safety: 'decision',
  tool: 'selection',
  observation: 'identification',
  provenance: 'classification',
  'document-reading': 'identification',
  identification: 'identification',
  classification: 'classification',
  sequence: 'sequence',
  manipulation: 'simulation-result',
  order: 'sequence',
  orientation: 'classification',
  disassembly: 'assembly',
  assembly: 'assembly',
  verification: 'simulation-result',
  diagnosis: 'diagnosis',
  explanation: 'explanation',
  'final-project': 'human-review',
}
const moduleIndexByCompetencyIndex = [0, 1, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 9]

const sourceById = new Map(base.sources.map((source) => [source.id, source]))
const sources = officialIds.map((id) => sourceById.get(id))
sources.push(
  {
    id: bookWorkshopId,
    authority: 'private-book-theory',
    usage: 'private-local',
    resource: {
      kind: 'book',
      title: 'Libro privado de teoría relojera · Workshop and Equipment',
      locator: 'archivo local privado · PDF pp. 26–31 verificadas visualmente',
    },
    sourceType: 'private-book',
    chapter: 'Workshop and Equipment',
    privateUse: true,
    supportedClaim: 'Principios generales de puesto, iluminación, documentación y control de piezas; no instrucciones MIYOTA.',
    derivedLayer: 'source',
  },
  {
    id: bookToolsId,
    authority: 'private-book-theory',
    usage: 'private-local',
    resource: {
      kind: 'book',
      title: 'Libro privado de teoría relojera · Hand Tools',
      locator: 'archivo local privado · PDF pp. 53–54 verificadas visualmente',
    },
    sourceType: 'private-book',
    chapter: 'Hand Tools · Tweezers and Screwdrivers',
    privateUse: true,
    supportedClaim: 'Principios generales de pinzas, destornilladores y ajuste de hoja; no medidas ni referencias comerciales.',
    derivedLayer: 'source',
  },
  {
    id: originalId,
    authority: 'original-educational',
    usage: 'user-created',
    resource: { kind: 'note', title: 'Sistema 4D · ruta práctica Del ISA 8172 al MIYOTA 2035' },
    authorOrManufacturer: 'Watch Prototype Lab',
    sourceType: 'original-educational-content',
    importedAt: '2026-07-27',
    privateUse: true,
    supportedClaim: 'Arquitectura del banco, actividades, explicaciones y evaluación originales de la ruta práctica.',
    derivedLayer: 'source',
  },
)

const originalCitation = sources.find(({ id }) => id === originalId)
const officialPartsCitation = sources.find(({ id }) => id.endsWith('parts-list-exploded-view'))
const claim = (module, index) => ({
  id: `claim.quartz2035.${module.slug}`,
  claimType: 'source',
  classification: ['documentation', 'anatomy'].includes(module.slug) ? 'official' : 'original-explanation',
  claim: module.slug === 'documentation'
    ? 'La documentación curada del 2035 separa ficha, especificación, plano, manual y lista de piezas o despiece.'
    : module.slug === 'anatomy'
      ? 'La lista oficial identifica piezas y referencias del MIYOTA 2035, pero no valida por sí sola la geometría reconstruida.'
      : `La práctica “${module.title}” usa acciones semánticas y reversibles sin afirmar física ni servicio validado.`,
  sourceStatement: ['documentation', 'anatomy'].includes(module.slug)
    ? 'La afirmación se limita a la identidad y estructura documental de las fuentes oficiales.'
    : 'Explicación educativa original respaldada por el contrato del banco y sus limitaciones.',
  method: ['documentation', 'anatomy'].includes(module.slug) ? 'Lectura curada de documentación MIYOTA' : 'Diseño educativo original y prueba del runtime',
  fidelity,
  reliability: ['documentation', 'anatomy'].includes(module.slug) ? 'high' : 'medium',
  inputFingerprint: `system4d:${module.slug}:0.1.0`,
  recordedAt: '2026-07-27T10:00:00.000Z',
  methodVersion: version,
  sources: [structuredClone(['documentation', 'anatomy'].includes(module.slug) ? officialPartsCitation : originalCitation)],
})

const curriculumId = 'curriculum.quartz2035'
const benchRouteId = 'route.horology.bench-foundations'
const routeId = 'route.quartz2035.isa-to-2035'
const concepts = competencyDefs.map(([slug, title, subsystem], index) => ({
  id: `concept.quartz2035.${slug}`,
  version,
  title: es(title),
  summary: es(`Concepto práctico: ${title.toLowerCase()}, con procedencia y límites R2/G2/K2/P0 visibles.`),
  kind: index === 3 || index === 4 || index === 11 ? 'concept' : 'skill',
  prerequisiteIds: index === 0 ? [] : [`concept.quartz2035.${competencyDefs[Math.max(0, index - 1)][0]}`],
  relatedIds: [],
  competencyIds: [`competency.quartz2035.${slug}`],
  movementIds: [fixtureId],
  subsystem,
  routeIds: [index < 3 ? benchRouteId : routeId],
  activityIds: modules.flatMap(({ activities }) => activities.map(([activitySlug]) => `activity.quartz2035.${activitySlug}`)),
  sourceIds: [originalId],
  availability: index === 0 ? 'available' : 'prerequisite-blocked',
}))

const sceneTemplate = base.scenes.find(({ id }) => id === 'scene.horology.quartz-chain')
const selectorFor = (moduleIndex) => {
  const selectors = [
    ['role', 'power-source'],
    ['role', 'electronic-control'],
    ['role', 'coil'],
    ['role', 'stepper-rotor'],
    ['subsystem', 'train'],
    ['subsystem', 'train'],
    ['role', 'fastener'],
    ['role', 'indication'],
    ['role', 'power-source'],
    ['role', 'electronic-control'],
  ]
  const [by, value] = selectors[moduleIndex]
  return { selector: { by, value }, cardinality: 'one-or-more' }
}

const scenes = modules.map((module, moduleIndex) => {
  const scene = structuredClone(sceneTemplate)
  scene.id = `scene.quartz2035.${module.slug}`
  scene.title = module.title
  scene.description = `${module.visual} Operaciones reversibles, procedencia visible y alternativa textual.`
  scene.fixtureBinding = { kind: 'fixture', fixtureId }
  scene.requiredCapabilities = capabilityVersions
  scene.state = { selected: [], visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1 }
  scene.timeline = [
    { atMs: 0, operation: 'highlight', targets: [selectorFor(moduleIndex)], durationMs: 0, essential: false, waitFor: 'interaction' },
    { atMs: 700, operation: 'explode', targets: [], value: moduleIndex >= 5 ? 0.35 : 0.1, durationMs: 350, essential: false, waitFor: 'none' },
  ]
  scene.overlays = [{
    kind: 'text',
    id: `overlay.quartz2035.${module.slug}.scope`,
    markdown: `${module.title}: representación educativa reversible. No es un procedimiento físico validado; consulta la ficha técnica para conocer su alcance geométrico, de movimiento y de física.`,
    accessibleLabel: `${module.title}. Alcance educativo y limitaciones disponibles en texto.`,
  }]
  scene.accessibility = {
    textualAlternative: `${module.visual} Las zonas, herramientas, piezas, dependencias, estados y cambios se presentan en el mismo orden que el banco visual. Todas las acciones tienen menú y botón; no se exige arrastre.`,
    reducedMotionAlternative: 'Los cambios se muestran como estados discretos sin movimiento automático y conservan idéntica evaluación.',
    keyboardActions: ['Tabular en orden banco, herramientas, movimiento, bandeja y acciones.', 'Activar con Intro o Espacio.', 'Cancelar o restaurar mediante botones nombrados.'],
    colorIndependentCues: ['Texto, icono, patrón y estado acompañan cada color.', 'Cada instancia tiene un nombre accesible único.'],
  }
  const evidenceForModule = evidenceDefs
    .filter(([, competencyIndex]) => competencyIndex === competencyDefs.findIndex(([slug]) => slug === module.competency))
    .map(([slug]) => `evidence.quartz2035.${slug}`)
  if (evidenceForModule.length === 0) evidenceForModule.push(`evidence.quartz2035.${moduleIndex === 9 ? 'final-project' : 'explanation'}`)
  scene.steps = [
    {
      id: `step.quartz2035.${module.slug}.observe`,
      instructionMarkdown: `Observa y registra el estado inicial de “${module.title}” antes de actuar.`,
      questions: [],
      success: [{ condition: 'step-confirmed' }],
    },
    {
      id: `step.quartz2035.${module.slug}.execute`,
      instructionMarkdown: `Ejecuta la acción semántica, revisa sus límites y confirma la restauración.`,
      questions: [{
        id: `question.quartz2035.${module.slug}.scope`,
        promptMarkdown: '¿Qué afirmación conserva correctamente el alcance?',
        responseKind: 'single-choice',
        options: [
          { id: `option.${module.slug}.educational`, label: 'Operación educativa reversible', labels: { es: 'Operación educativa reversible', en: 'Operación educativa reversible' } },
          { id: `option.${module.slug}.official`, label: 'Secuencia oficial completa', labels: { es: 'Secuencia oficial completa', en: 'Secuencia oficial completa' } },
        ],
        authoring: { prompt: es('¿Qué afirmación conserva correctamente el alcance?'), feedback: es('La acción es educativa y reversible; la autoridad de cada dependencia se muestra por separado.') },
      }],
      success: [{ condition: 'answer', questionId: `question.quartz2035.${module.slug}.scope`, expectedOptionIds: [`option.${module.slug}.educational`] }],
    },
  ]
  scene.storyboard = {
    sceneName: es(module.title),
    purpose: es(module.purpose),
    prerequisites: moduleIndex === 0 ? [] : [`concept.quartz2035.${competencyDefs[Math.max(0, moduleIndex - 1)][0]}`],
    narrative: es('Registrar estado inicial, ejecutar una acción semántica, revisar procedencia y restaurar.'),
    initialFraming: es('Banco estable con pieza, herramienta, bandeja, fuentes y una ficha técnica de alcance accesible.'),
    secondaryParts: [],
    sequence: scene.steps.map((step, index) => ({
      id: `storyboard.${step.id}`,
      sceneStepId: step.id,
      narrative: es(index === 0 ? 'Observar y documentar antes de manipular.' : 'Ejecutar, comprobar y restaurar.'),
      timelineIndexes: [Math.min(index, scene.timeline.length - 1)],
      runtimeActions: index === 0 ? ['inspect', 'record'] : ['workbench-command', 'checkpoint', 'restore'],
      interaction: es('Usar teclado, lista accesible o selección directa.'),
      feedback: es('El feedback nombra herramienta, dependencia, identidad y autoridad de la regla.'),
      hint: es('Las pistas disminuyen según el modo y nunca penalizan una adaptación de accesibilidad.'),
    })),
    ending: es('Guardar evidencia provisional y restaurar el estado inicial o conservar un punto de control explícito.'),
    restoration: es('Restaurar piezas, bandejas, herramientas, orientación, selección y vista de forma idempotente.'),
    accessibility: es('Banco, herramientas y bandeja equivalentes como listas ordenadas y menús de acción.'),
    reducedMotion: es('Estados discretos, sin arrastre ni movimiento automático, con la misma rúbrica.'),
    evidenceTemplateIds: evidenceForModule,
    technicalCriteria: ['Identidad de cada pieza estable.', 'Acción validada y resultado registrado.', 'El proyecto técnico y el modelo de práctica permanecen intactos.'],
    limitations: ['Los niveles de reconstrucción y fidelidad se conservan en la ficha técnica.', 'Sin secuencia completa de servicio, pares, lubricación, tolerancias ni valores eléctricos inventados.'],
  }
  scene.restorePreviousState = true
  return scene
})

const activities = modules.flatMap((module, moduleIndex) => module.activities.map(([slug, title, activityType], activityIndex) => {
  const competencyIndex = competencyDefs.findIndex(([value]) => value === module.competency)
  const evidence = evidenceDefs.filter(([, index]) => index === competencyIndex).map(([value]) => `evidence.quartz2035.${value}`)
  if (evidence.length === 0) evidence.push(`evidence.quartz2035.${moduleIndex === 9 ? 'final-project' : 'explanation'}`)
  const modes = module.slug === 'assembly'
    ? activityIndex === 0 ? ['guided'] : ['assisted', 'free']
    : module.slug === 'disassembly' ? ['guided', 'assisted'] : ['guided']
  return {
    id: `activity.quartz2035.${slug}`,
    version,
    title,
    sceneIds: [`scene.quartz2035.${module.slug}`],
    competencyIds: [`competency.quartz2035.${module.competency}`],
    evidenceTemplateIds: evidence,
    rubricId: `rubric.quartz2035.${module.competency}`,
    projectReference: { kind: 'fixture-readonly', fixtureId },
    authoring: {
      lessonId: `lesson.quartz2035.${module.slug}`,
      title: es(title),
      description: es(`${title} en el banco virtual 2035, con comandos deterministas, evidencia, cancelación y restauración.`),
      difficulty: moduleIndex < 3 ? 'introductory' : moduleIndex < 8 ? 'intermediate' : 'advanced',
      durationMinutes: moduleIndex === 9 ? 35 : 12,
      activityType,
      movementIds: [fixtureId],
      familyIds: ['miyota-quartz-standard'],
      subsystem: module.slug,
      requiredCapabilities: capabilityIds,
      languages: ['es-ES'],
      offline: true,
      fidelity,
      warnings: {
        es: ['Simulación educativa: no es un manual de servicio ni acredita reparación profesional.', 'Toda dependencia inferida o no verificada se muestra como tal.'],
        en: [],
      },
      sourceIds: module.sourceIds,
      visualResourceIds: [`visual.quartz2035.${module.slug}`],
      fixtureBinding: { kind: 'fixture', fixtureId },
      interactionContract: {
        responseModel: 'single-choice',
        orderedItems: [],
        expectedOrderIds: [],
        structuredFields: [],
        hints: [
          ['orientation', 'Revisa primero el objetivo y el estado inicial.'],
          ['subsystem', 'Limita la búsqueda al subsistema y a sus instancias visibles.'],
          ['functional-property', 'Comprueba qué capacidad declara cada herramienta o relación.'],
          ['comparison', 'Compara la acción con la alternativa accesible y su procedencia.'],
          ['near-answer', 'Revisa la dependencia inmediatamente anterior y la identidad en bandeja.'],
          ['post-attempt-explanation', 'Después del intento, separa hecho, inferencia y orden educativo antes de repetir.'],
        ].map(([kind, content], hintIndex) => ({
          id: `hint.quartz2035.${slug}.${hintIndex + 1}`,
          level: hintIndex + 1,
          kind,
          content: es(content),
          availableAfterAttempts: hintIndex === 5 ? 1 : 0,
          countsAsHint: true,
        })),
        evidencePolicy: {
          eventType: moduleIndex >= 6 ? 'scene-completed' : 'answer-submitted',
          recordsAnswerPayload: true,
          deterministicComponents: [],
          requiresHumanReview: moduleIndex === 9,
          accessibilityAdaptationsCountAsHints: false,
        },
      },
      pedagogicalPattern: {
        enabled: true,
        stages: ['observe', 'predict', 'manipulate', 'execute-or-simulate', 'compare', 'explain', 'record-evidence'],
      },
      workbenchContract: {
        fixtureId,
        modes,
        requiredZones: ['zone.movement', 'zone.tools', 'zone.tray', 'zone.inspection', 'zone.documentation'],
        evidenceContext: ['mode', 'assistance', 'hints', 'errors', 'corrections', 'sources', 'initial-state', 'final-state', 'fixture-limitations'],
      },
    },
  }
}))

const competencies = competencyDefs.map(([slug, title, subsystem], index) => ({
  id: `competency.quartz2035.${slug}`,
  version,
  title,
  description: `${title} sobre el modelo didáctico del 2035, conservando seguridad, procedencia, identidad y límites.`,
  prerequisites: index === 0 ? [] : [`competency.quartz2035.${competencyDefs[Math.max(0, index - 1)][0]}`],
  authoring: {
    title: es(title),
    description: es(`${title}; el tiempo no penaliza y una adaptación de accesibilidad no reduce lo aprendido.`),
    movementIds: [fixtureId],
    subsystem,
    skillType: ['provenance', 'documentation'].includes(subsystem) ? 'knowledge' : ['diagnosis', 'dossier'].includes(subsystem) ? 'diagnosis' : 'procedure',
    sourceIds: [originalId],
  },
}))

const evidence = evidenceDefs.map(([slug, competencyIndex]) => {
  const competencyId = `competency.quartz2035.${competencyDefs[competencyIndex][0]}`
  const relatedActivities = activities
    .filter(({ authoring }) => authoring.lessonId === `lesson.quartz2035.${modules[moduleIndexByCompetencyIndex[competencyIndex]].slug}`)
    .map(({ id }) => id)
  return {
    id: `evidence.quartz2035.${slug}`,
    version,
    competencyId,
    kind: ['final-project', 'explanation'].includes(slug) ? 'human-review' : ['disassembly', 'assembly', 'sequence', 'manipulation', 'order', 'orientation'].includes(slug) ? 'procedure' : 'observation',
    scoringMethod: ['final-project', 'explanation'].includes(slug) ? 'rubric' : 'binary',
    extraction: {
      id: `rule.extract.quartz2035.${slug}`,
      version,
      triggerEventType: 'workbench-command',
      evidenceType: evidenceTypeBySlug[slug],
      competencyId,
      packageId,
      activityIds: relatedActivities,
      evidenceTemplateId: `evidence.quartz2035.${slug}`,
      minimumSessionState: ['active', 'paused', 'completed'],
      confidence: ['final-project', 'explanation'].includes(slug) ? 0.7 : 1,
      contentFields: ['sceneId', 'stepId', 'data', 'mode', 'assistance', 'diagnosticCodes'],
    },
  }
})

const rubrics = competencyDefs.map(([slug], index) => {
  const competencyId = `competency.quartz2035.${slug}`
  const accepted = evidence.filter(({ competencyId: value }) => value === competencyId)
  const evidenceType = accepted[0]?.extraction.evidenceType ?? evidence.at(-1).extraction.evidenceType
  return {
    id: `rubric.quartz2035.${slug}`,
    version,
    competencyId,
    rules: [{
      id: `rule.quartz2035.${slug}.demonstrated`,
      version,
      targetState: 'demonstrated',
      acceptedEvidenceKinds: ['answer', 'procedure', 'observation', 'artifact', 'human-review'],
      minimumEvidence: 1,
      minimumScore: 1,
      minimumDistinctSessions: 1,
      minimumSpanDays: 0,
      explanationTemplate: 'Demostración basada en orden, seguridad, identidad, orientación, corrección, fuentes y separación entre hecho e hipótesis; el tiempo no penaliza.',
    }],
    assessmentRule: {
      id: `rule.composite.quartz2035.${slug}.demonstrated`,
      version,
      competencyId,
      targetState: 'demonstrated',
      condition: {
        op: 'all',
        conditions: [
          { op: 'exists', filter: { evidenceType, status: 'active', minimumConfidence: index === 12 ? 0.7 : 1 } },
          { op: 'minimum-evidence', count: 1 },
        ],
      },
    },
  }
})

const recommendations = competencyDefs.map(([slug, title], index) => ({
  id: `recommendation.quartz2035.retain-${slug}`,
  version,
  kind: 'retention',
  title: es(`Práctica posterior: ${title.toLowerCase()}`),
  reason: es('Para considerarlo consolidado se exige otra sesión, un intervalo, evidencia independiente y un contexto distinto; nunca se concede en la sesión de aprendizaje inicial.'),
  rule: 'independent-later-evidence-different-session-minimum-7-days@1.0.0',
  priority: 50 + index,
  target: { kind: 'competency', id: `competency.quartz2035.${slug}` },
  evidenceTemplateIds: evidence.filter((item) => item.competencyId.endsWith(slug)).map(({ id }) => id),
  required: false,
}))

const termSlugs = ['workbench', 'movement-holder', 'parts-tray', 'fastener', 'orientation', 'checkpoint', 'provenance', 'observation', 'inference', 'official-datum', 'main-plate', 'bridge', 'coil', 'stepper-rotor', 'gear-train']
const baseTerms = new Map(base.glossary.map((term) => [term.id.split('.').at(-1), term]))
const glossary = termSlugs.map((slug) => {
  const existing = baseTerms.get(slug)
  if (existing) return { ...structuredClone(existing), authoring: { ...structuredClone(existing.authoring), sourceIds: [originalId] } }
  const labels = {
    workbench: ['banco de trabajo', 'workbench'],
    'movement-holder': ['soporte de movimiento', 'movement holder'],
    'parts-tray': ['bandeja de piezas', 'parts tray'],
    fastener: ['elemento de fijación', 'fastener'],
    orientation: ['orientación', 'orientation'],
    checkpoint: ['punto de control', 'checkpoint'],
    observation: ['observación', 'observation'],
    'official-datum': ['dato oficial', 'official datum'],
  }
  const [termEs, termEn] = labels[slug] ?? [slug, slug]
  return {
    id: `term.quartz2035.${slug}`,
    version,
    term: termEs,
    definitionMarkdown: `${termEs}: término de la ruta práctica cuyo significado se conserva mediante identidad, procedencia y contexto.`,
    language: 'es-ES',
    authoring: {
      terms: { es: termEs, en: termEn },
      synonyms: { es: [], en: [] },
      discouragedTerms: [],
      simpleDefinition: es(`Elemento o concepto denominado ${termEs}.`),
      technicalDefinition: es(`${termEs} dentro del banco virtual 2035, sin atribuir precisión física no validada.`),
      context: es('Ruta Del ISA 8172 al MIYOTA 2035.'),
      sourceIds: [originalId],
    },
  }
})

const visualResources = modules.map((module) => ({
  id: `visual.quartz2035.${module.slug}`,
  version,
  type: module.slug === 'documentation' ? 'visual-table' : module.slug === 'diagnosis' ? 'error-simulation' : module.slug === 'workstation' || module.slug === 'tools' ? 'schematic-2d' : 'real-movement-3d',
  purpose: es(module.visual),
  status: 'ready',
  sourceIds: module.sourceIds,
  fidelity,
  lessonIds: [`lesson.quartz2035.${module.slug}`],
  movementIds: [fixtureId],
  partSelectors: [selectorFor(modules.indexOf(module))],
  requiredCapabilities: capabilityIds,
  dataRequirements: ['Fixture 2035 intacto.', 'Identidad de instancia estable.', 'Alternativa textual y reduced motion.'],
  priority: 'high',
  dependencyIds: [],
  currentModelSupport: 'yes',
  viewportImpact: 'configuration',
}))

const blocks = modules.map((module, index) => ({
  id: `block.quartz2035.${module.slug}`,
  version,
  kind: 'explanation',
  title: module.title,
  bodyMarkdown: `## Propósito

${module.purpose}

## Objetivos

Preparar, observar o ejecutar la operación de forma trazable; distinguir dato oficial, inferencia y simulación; conservar identidad y restaurar el estado.

## Conocimientos previos

Se reutiliza el mapa funcional estudiado en Fundamentos de relojería. Cuando un prerrequisito no está demostrado, la ruta permite explorar pero muestra la dependencia.

## Explicación

${module.body}

## Visual y actividad

${module.visual} La actividad conserva el mismo modelo de referencia en los modos guiado, asistido y libre. Los cambios solo afectan a la sesión de aprendizaje y nunca alteran el proyecto técnico original.

## Fuentes y alcance de las afirmaciones

${module.sourceIds.includes(bookWorkshopId) || module.sourceIds.includes(bookToolsId) ? 'El libro privado respalda principios generales del taller o las herramientas en las páginas verificadas; no se copia texto ni se convierte en instrucción MIYOTA.' : ''} Los datos específicos del 2035 se atribuyen solo a las fuentes MIYOTA curadas. Las reconstrucciones normalizadas y los órdenes inferidos conservan su clasificación.

## Vocabulario

Consulta banco, soporte, bandeja, fijación, orientación, procedencia, observación, inferencia y dato oficial en el glosario bilingüe.

## Errores habituales y ayuda

Confundir una referencia con geometría validada; tratar una vista explosionada como secuencia completa; perder identidad de un tornillo; omitir orientación; o formular una hipótesis como certeza. La ayuda señala el primer requisito incumplido y la fuente aplicable, sin completar automáticamente la tarea.

## Evidencia y rúbrica

Se registran modo, ayudas, pistas, errores, correcciones, fuentes, estado inicial, estado final y limitaciones. El tiempo no penaliza. La evidencia abierta del proyecto final requiere revisión; la consolidación solo puede demostrarse en otra sesión posterior.

## Resumen y conexión

${module.purpose} ${index < modules.length - 1 ? `La siguiente práctica es “${modules[index + 1].title}”.` : 'La ruta termina con una recomendación de retención posterior, no con una acreditación profesional.'}`,
  claims: [claim(module, index)],
}))

const lessons = modules.map((module, index) => ({
  id: `lesson.quartz2035.${module.slug}`,
  version,
  title: module.title,
  blockIds: [`block.quartz2035.${module.slug}`],
  activityIds: module.activities.map(([slug]) => `activity.quartz2035.${slug}`),
  authoring: {
    title: es(module.title),
    purpose: es(module.purpose),
    objectives: [es('Ejecutar la práctica con orden y trazabilidad.'), es('Distinguir hecho, fuente, inferencia y simulación.'), es('Registrar evidencia y restaurar el estado.')],
    prerequisiteConceptIds: index === 0 ? [] : [`concept.quartz2035.${competencyDefs[Math.max(0, index - 1)][0]}`],
    conceptIds: [`concept.quartz2035.${module.competency}`],
    sourceIds: module.sourceIds,
    visualResourceIds: [`visual.quartz2035.${module.slug}`],
    visualStrategy: {
      objective: es(module.purpose),
      visibleConcept: es(module.visual),
      modelReference: fixtureId,
      movementIds: [fixtureId],
      involvedSelectors: [selectorFor(index)],
      initialState: { cameraIntent: 'Vista estable del banco y el 2035.', visible: [], hidden: [], isolated: [], explode: 0, transparency: [] },
      energyFlow: module.slug === 'anatomy' || module.slug === 'diagnosis' ? ['pila', 'control', 'bobina', 'rotor', 'tren', 'indicación'] : [],
      rotationDirections: [],
      labels: ['identidad', 'subsistema', 'fuente', 'G/K/P', 'estado de banco'],
      arrows: ['dependencia con autoridad explícita'],
      animations: ['cambios discretos de estado; sin física arbitraria'],
      timelineIntent: 'Observar, confirmar, ejecutar, guardar checkpoint y restaurar.',
      userInteraction: 'Teclado, selección secuencial, menú de acción o viewport; nunca arrastre obligatorio.',
      observableResult: es('El estado del banco y la evidencia cambian sin alterar el modelo de referencia ni el proyecto técnico original.'),
      successCriterion: es('Acción válida, identidad conservada, fuente o limitación declarada y restauración correcta.'),
      restoration: es('Restaurar herramienta, pieza, orientación, bandeja, vista y paso.'),
      textualAlternative: es('Lista ordenada de zonas, herramientas, piezas, acciones, dependencias y estados.'),
      reducedMotionAlternative: es('Estados discretos con idéntica evaluación.'),
      fidelity,
      unknownData: ['secuencia completa de servicio', 'pares', 'lubricación', 'tolerancias internas', 'valores eléctricos y puntos de prueba'],
      requiredVisualResourceIds: [`visual.quartz2035.${module.slug}`],
    },
  },
}))

const moduleDocs = modules.map((module) => ({
  id: `module.quartz2035.${module.slug}`,
  version,
  title: es(module.title),
  purpose: es(module.purpose),
  lessonIds: [`lesson.quartz2035.${module.slug}`],
}))

const milestoneModeForActivityType = (activityType) => ({
  'guided-practice': 'guided-practice',
  'observation-3d': 'guided-practice',
  prediction: 'worked-example',
  comparison: 'worked-example',
  explanation: 'explanation',
}[activityType] ?? 'guided-practice')

const routeLearningDesign = (routeModules, routeKey, entryPolicy, completionPolicy) => ({
  model: 'specialization',
  entryPolicy,
  completionPolicy,
  milestones: routeModules.map((module, index) => ({
    id: `milestone.${routeKey}.${String(index + 1).padStart(2, '0')}`,
    order: index + 1,
    title: es(module.title),
    outcome: es(module.purpose),
    lessonId: `lesson.quartz2035.${module.slug}`,
    activityId: `activity.quartz2035.${module.activities[0][0]}`,
    mode: milestoneModeForActivityType(module.activities[0][2]),
    evidenceLevel: 'causal-explanation',
    optional: false,
    transferTargetIds: [`concept.quartz2035.${module.competency}`],
  })),
  diagnosticActivityIds: [],
  demonstrationActivityIds: [],
})

const pack = {
  manifest: {
    format: 'wplab-learning-pack',
    formatVersion: 1,
    schemaId: 'learning-pack-v1',
    packageVersion: version,
    id: packageId,
    title: 'Del ISA 8172 al MIYOTA 2035',
    distribution: 'local-unsigned',
    editorialStatus: 'in-review',
    authors: [{ name: 'Watch Prototype Lab' }],
    languages: ['es-ES'],
    dependencies: [{ packageId: previousPackageId, versionRange: '^0.5.0' }],
    requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'canonical-selectors-v1@^1.0.0', 'reduced-motion@^1.0.0'],
    movements: [{ manufacturer: 'MIYOTA', calibre: '2035', referenceId: fixtureId }],
    assets: [],
    entries: {},
    minimumAppVersion: '0.10.0',
    createdAt: '2026-07-27T10:00:00.000Z',
  },
  curricula: [{
    id: curriculumId,
    version,
    title: es('Ruta práctica de cuarzo'),
    purpose: es('Observar, documentar, desmontar, montar, comprobar y razonar sobre un movimiento de cuarzo sencillo.'),
    routeIds: [benchRouteId, routeId],
    languages: ['es-ES'],
  }],
  routes: [
    {
      id: benchRouteId,
      version,
      title: es('Banco, herramientas y observación segura'),
      purpose: es('Preparar el puesto, elegir herramientas por su función y registrar el estado inicial antes de intervenir un movimiento.'),
      prerequisiteConceptIds: [],
      moduleIds: moduleDocs.slice(0, 3).map(({ id }) => id),
      competencyIds: competencies.slice(0, 3).map(({ id }) => id),
      movementIds: [fixtureId],
      difficulty: 'introductory',
      sourceIds: [originalId],
      visualResourceIds: visualResources.slice(0, 3).map(({ id }) => id),
      demo: false,
      learningDesign: routeLearningDesign(modules.slice(0, 3), 'horology.bench-foundations', 'start-from-zero', 'practice'),
    },
    {
      id: routeId,
      version,
      title: es('Del ISA 8172 al MIYOTA 2035'),
      purpose: es('Convertir experiencia previa en un método trazable sobre el banco virtual y el modelo didáctico del MIYOTA 2035.'),
      prerequisiteConceptIds: [],
      moduleIds: moduleDocs.slice(3).map(({ id }) => id),
      competencyIds: competencies.slice(3).map(({ id }) => id),
      movementIds: [fixtureId],
      difficulty: 'intermediate',
      sourceIds: [originalId, ...officialIds],
      visualResourceIds: visualResources.slice(3).map(({ id }) => id),
      demo: false,
      learningDesign: routeLearningDesign(modules.slice(3), 'quartz2035.isa-to-2035', 'diagnostic-optional', 'evidence'),
    },
  ],
  modules: moduleDocs,
  concepts,
  blocks,
  lessons,
  activities,
  scenes,
  competencies,
  evidenceTemplates: evidence,
  rubrics,
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

const report = `# Informe del banco virtual · Sistema 4D

- Paquete: \`${packageId}@${version}\`
- Ruta: **Del ISA 8172 al MIYOTA 2035**
- Estado editorial: \`in-review\`
- 10 módulos, ${lessons.length} lecciones, ${activities.length} actividades, ${competencies.length} competencias, ${evidence.length} evidencias y ${rubrics.length} rúbricas.
- Un único fixture: \`${fixtureId}\`, R2/G2/K2/P0.
- Modos: guiado, asistido y libre sobre el mismo \`VirtualWorkbench\`.
- 5 zonas, 9 herramientas semánticas, 8 zonas de bandeja y 33 identidades canónicas.
- Dependencias de desmontaje y montaje separadas; los órdenes inferidos nunca se rotulan como oficiales.
- Snapshot serializable con piezas, tornillos, orientación, bandeja, herramientas, errores, observaciones y eventos.
- Alternativa de teclado y textual completa; reduced motion conserva la evaluación.

## Bloqueos editoriales

El paquete permanece en revisión humana. No se publicará como completo mientras las dependencias parciales no hayan sido revisadas sobre una unidad física o un manual de servicio suficiente. No contiene pares, lubricación, tolerancias ni valores eléctricos inventados.
`
await mkdir(join(root, 'dist'), { recursive: true })
await writeFile(join(root, 'dist', 'workbench-report.md'), report, 'utf8')
console.log(`Sistema 4D materializado en ${root}`)
console.log(`${modules.length} módulos · ${activities.length} actividades · ${competencies.length} competencias · ${evidence.length} evidencias`)
