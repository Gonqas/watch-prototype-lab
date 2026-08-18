/* eslint-disable @typescript-eslint/no-explicit-any -- Generador editorial: clona y reescribe árboles JSON heterogéneos validados después por LearningPackSchema. */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../src/learning/technical/fixtures'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const baseDir = path.join(root, 'learning-content', 'mechanical-foundations')
const outputDir = path.join(root, 'learning-content', 'miyota8215')
const base = JSON.parse(await readFile(path.join(baseDir, 'dist', 'pack.json'), 'utf8'))
const baseManifest = JSON.parse(await readFile(path.join(baseDir, 'manifest.json'), 'utf8'))
const clone = <T>(value: T): T => structuredClone(value)
const version = '0.5.0'
const packageId = 'wplab.horology.miyota8215'
const routeId = 'route.miyota8215.complete'
const fixtureId = 'fixture.miyota.8215.structural'
const originalSourceId = 'source.horology.original-miyota8215'
const officialSourceIds = [
  'source.miyota.8215.product-page',
  'source.miyota.8215.specification',
  'source.miyota.8215.drawing',
  'source.miyota.8215.instruction-manual',
  'source.miyota.8215.parts-list-exploded-view',
]
const fidelity = {
  geometry: 'G2',
  kinematics: 'K2',
  physics: 'P0',
  limitations: [
    'Ensamblaje estructural R2 con geometría interna normalizada; no es un gemelo exacto.',
    'Las operaciones educativas no constituyen un procedimiento oficial completo de servicio.',
    'No se simulan tolerancias, par, presión, lubricación, desgaste, choque ni marcha física.',
  ],
}

type ActivitySpec = {
  slug: string
  title: string
  competency: string
  type?: 'observation-3d' | 'prediction' | 'guided-practice' | 'comparison' | 'explanation'
}
type ModuleSpec = {
  slug: string
  title: string
  purpose: string
  subsystem: string
  explanation: string
  interactions: string[]
  limitations: string[]
  sourceIds: string[]
  activities: ActivitySpec[]
}

const modules: ModuleSpec[] = [
  {
    slug: 'identify',
    title: 'Identificar el MIYOTA 8215',
    purpose: 'Identificar fabricante, calibre, familia, funciones, caras, rotor, tija, calendario e indicaciones con procedencia visible.',
    subsystem: 'identity',
    explanation: 'La identidad se establece por documentación y rasgos estructurales, no por parecido. La ficha oficial distingue 8215, familia 82, funciones y datos nominales; el modelo didáctico separa dato oficial, observación, reconstrucción y desconocido.',
    interactions: ['vista completa', 'cara de puentes', 'cara de esfera', 'procedencia', 'ficha técnica de fidelidad'],
    limitations: ['La apariencia del modelo estructural no autentica una unidad física.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'identify-calibre', title: 'Identificar el calibre', competency: 'identify-calibre' },
      { slug: 'classify-provenance', title: 'Diferenciar oficial, reconstruido y desconocido', competency: 'distinguish-data-reconstruction' },
    ],
  },
  {
    slug: 'documentation',
    title: 'Leer su documentación',
    purpose: 'Localizar datos, referencias y límites en ficha, especificación, plano, manual, despiece y lista de piezas.',
    subsystem: 'documentation',
    explanation: 'Cada documento responde preguntas distintas. El plano general describe interfaces y envolvente; el despiece relaciona llamadas y referencias; ninguno revela automáticamente geometría oculta, tolerancias o un procedimiento completo.',
    interactions: ['registro de fuentes', 'llamada y pieza', 'dato nominal', 'dato ausente'],
    limitations: ['No se implementa visor PDF; se usan metadatos y enlaces oficiales.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'locate-specification', title: 'Localizar una especificación', competency: 'read-official-documentation' },
      { slug: 'associate-reference-part', title: 'Asociar referencia y pieza', competency: 'read-official-documentation' },
      { slug: 'detect-document-limit', title: 'Detectar lo que el documento no revela', competency: 'distinguish-data-reconstruction' },
    ],
  },
  {
    slug: 'architecture',
    title: 'Arquitectura general',
    purpose: 'Reconstruir el calibre por capas y subsistemas sobre un único ensamblaje canónico.',
    subsystem: 'structure',
    explanation: 'Rotor, automático, puentes, tren, escape, volante, barrilete, minutería, keyless, calendario y platina son vistas reversibles del mismo ensamblaje. Ocultar una capa no crea otra variante.',
    interactions: ['aislamiento', 'explosionado', 'transparencia', 'vista lateral', 'ruta energética'],
    limitations: ['El orden de capas del modelo estructural no certifica una secuencia de servicio.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'classify-subsystems', title: 'Clasificar subsistemas', competency: 'recognize-subsystems' },
      { slug: 'reconstruct-layers', title: 'Reconstruir capas ocultas', competency: 'recognize-subsystems' },
    ],
  },
  {
    slug: 'automatic',
    title: 'Rotor y carga automática',
    purpose: 'Seguir la ruta funcional documentada desde la masa oscilante hacia el barrilete.',
    subsystem: 'automatic',
    explanation: 'La masa oscilante, la rueda de carga con trinquete, la reducción y la rueda intermedia se estudian con sus identidades. La comparación conceptual explica función sin transferir eficiencia, pares o pérdidas al 8215.',
    interactions: ['girar rotor', 'seguir ruta', 'aislar automático', 'bloqueo simbólico', 'comparación conceptual'],
    limitations: ['La ruta interna contiene relaciones inferidas de confianza baja; no se inventan eficiencia ni pérdidas.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'follow-automatic', title: 'Seguir la carga automática', competency: 'explain-automatic' },
      { slug: 'compare-automatic-conceptual', title: 'Comparar automático real y conceptual', competency: 'explain-automatic', type: 'comparison' },
    ],
  },
  {
    slug: 'winding-setting',
    title: 'Cuerda manual y puesta en hora',
    purpose: 'Reconstruir estados y relaciones de tija, cuerda, selección, puesta en hora y minutería.',
    subsystem: 'keyless',
    explanation: 'El árbol de estados separa cuerda, neutro y puesta en hora según las relaciones disponibles. Las piezas oficiales conservan identidad; un comportamiento no respaldado permanece desconocido.',
    interactions: ['posición de tija', 'ruta de cuerda', 'ruta de puesta en hora', 'estado inválido'],
    limitations: ['El estado es educativo y no atribuye fuerzas o enclavamientos no verificados.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'reconstruct-winding-states', title: 'Reconstruir estados de cuerda y puesta en hora', competency: 'explain-winding-setting' },
      { slug: 'trace-manual-winding', title: 'Seguir la cuerda manual', competency: 'explain-winding-setting' },
    ],
  },
  {
    slug: 'calendar',
    title: 'Calendario',
    purpose: 'Explicar piezas, capas, arrastre, corrección y ciclo de fecha sin inventar ventanas horarias.',
    subsystem: 'calendar',
    explanation: 'El disco de fecha, conductor, intermedio, saltador, corrector, muelle y protector se presentan con referencias. El ciclo y el bloqueo son simulaciones discretas sobre relaciones declaradas.',
    interactions: ['ciclo acelerado', 'aislamiento', 'retirada de capas permitidas', 'bloqueo simbólico'],
    limitations: ['No se declara una ventana de corrección segura ni una geometría exacta del salto.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'explain-calendar', title: 'Explicar el calendario', competency: 'explain-calendar' },
      { slug: 'run-calendar-cycle', title: 'Recorrer un ciclo de fecha', competency: 'explain-calendar' },
    ],
  },
  {
    slug: 'barrel-energy',
    title: 'Barrilete y energía',
    purpose: 'Relacionar cuerda manual y automática con barrilete y salida hacia el tren.',
    subsystem: 'power-source',
    explanation: 'El conjunto Barrel complete conserva los roles de barrilete y muelle real sin fingir dos recambios. La energía normalizada permite seguir continuidad, no la curva real de par.',
    interactions: ['ruta corona-barrilete', 'ruta rotor-barrilete', 'salida al tren', 'laboratorio de barrilete'],
    limitations: ['Sin curva real de par, vueltas, eficiencia o estado físico del muelle.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'follow-barrel-energy', title: 'Seguir la energía desde el barrilete', competency: 'explain-energy-chain' },
      { slug: 'compare-barrel-conceptual', title: 'Comparar barrilete real y conceptual', competency: 'explain-energy-chain', type: 'comparison' },
    ],
  },
  {
    slug: 'train',
    title: 'Tren de rodaje',
    purpose: 'Identificar ruedas, piñones, árboles, apoyos, puentes y engranes documentados.',
    subsystem: 'train',
    explanation: 'Rueda de centro, tercera, cuarta y escape se relacionan de forma estructural. Bloquear o retirar una instancia interrumpe la cadena visual; no se asignan conteos de dientes no verificados.',
    interactions: ['aislar', 'sentidos', 'relaciones', 'bloqueo', 'retirada simbólica'],
    limitations: ['Sin conteos de dientes, perfiles, distancias entre centros o libertad física verificadas.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'identify-train', title: 'Identificar el tren', competency: 'identify-train' },
      { slug: 'interrupt-train', title: 'Interrumpir y comprobar el tren', competency: 'verify-partially' },
    ],
  },
  {
    slug: 'escapement-oscillator',
    title: 'Escape, volante y espiral',
    purpose: 'Relacionar las piezas del modelo estructural del 8215 con el laboratorio conceptual de escape y oscilador.',
    subsystem: 'escapement',
    explanation: 'Rueda de escape, áncora, volante con espiral, puentes y apoyos se identifican en el modelo didáctico. El paso a paso procede del modelo conceptual y no se atribuye a la geometría exacta del calibre.',
    interactions: ['paso a paso', 'ralentización', 'bloqueo', 'restauración', 'comparación entre modelo estructural y conceptual'],
    limitations: ['Sin ángulos físicos de escape, amplitud, beat error, marcha o regulación real.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'follow-escapement', title: 'Seguir el escape', competency: 'explain-escapement-oscillator' },
      { slug: 'compare-conceptual-real', title: 'Comparar el escape conceptual y el modelo estructural', competency: 'explain-escapement-oscillator', type: 'comparison' },
    ],
  },
  {
    slug: 'plan-disassembly',
    title: 'Planificar el desmontaje',
    purpose: 'Preparar banco, fuentes, energía, herramientas, bandejas, dependencias y checkpoint antes de retirar.',
    subsystem: 'planning',
    explanation: 'El plan diferencia relación oficial, dependencia estructural, secuencia educativa e inferencia. Solo se habilitan las operaciones respaldadas por el modelo y sus fuentes; el resto queda bloqueado o se estudia únicamente en los documentos.',
    interactions: ['banco', 'herramientas', 'autoridad', 'grafo de desmontaje', 'checkpoint'],
    limitations: ['El plan visual no sustituye un manual oficial de servicio.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'prepare-workbench', title: 'Preparar banco', competency: 'prepare-disassembly' },
      { slug: 'create-disassembly-plan', title: 'Crear plan de desmontaje', competency: 'prepare-disassembly' },
    ],
  },
  {
    slug: 'guided-disassembly',
    title: 'Desmontaje guiado',
    purpose: 'Retirar las instancias permitidas con herramienta, autoridad, identidad, orientación, bandeja y checkpoint.',
    subsystem: 'disassembly',
    explanation: 'Cada acción comprueba herramienta, energía, fijación y dependencia. Las referencias que solo disponen de documentación, o que son simbólicas, permanecen no manipulables. Los tornillos repetidos no pierden su identidad.',
    interactions: ['retirar rotor', 'aflojar fijación', 'bandeja', 'notas', 'deshacer'],
    limitations: ['El recorrido termina donde acaban geometría y dependencias respaldadas.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'remove-rotor', title: 'Retirar rotor', competency: 'virtual-disassembly' },
      { slug: 'manage-fasteners', title: 'Gestionar tornillos', competency: 'preserve-identity-orientation' },
      { slug: 'guided-disassembly', title: 'Completar desmontaje guiado disponible', competency: 'virtual-disassembly' },
    ],
  },
  {
    slug: 'assisted-free-disassembly',
    title: 'Desmontaje asistido y libre',
    purpose: 'Practicar con ayudas graduadas o sin orden visible usando los mismos comandos y dependencias.',
    subsystem: 'disassembly',
    explanation: 'El modo asistido oculta el siguiente objetivo y revela dependencias solo cuando procede. El modo libre conserva documentación, errores reversibles y registro completo para evaluación posterior.',
    interactions: ['modo asistido', 'modo libre', 'pistas', 'errores reversibles', 'evaluación posterior'],
    limitations: ['La libertad de orden no amplía las operaciones respaldadas por el modelo y las fuentes.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'assisted-disassembly', title: 'Completar desmontaje asistido', competency: 'virtual-disassembly' },
      { slug: 'free-disassembly', title: 'Realizar práctica libre', competency: 'virtual-disassembly' },
    ],
  },
  {
    slug: 'inspection',
    title: 'Inspección',
    purpose: 'Observar dientes, pivotes, rubíes, puentes, tornillos, muelles, superficies y orientación.',
    subsystem: 'inspection',
    explanation: 'Los defectos son simbólicos, reversibles y clasificados. Una observación educativa puede reforzar o debilitar una hipótesis, pero no diagnostica una unidad física.',
    interactions: ['lupa', 'pieza sana', 'suciedad', 'diente simbólico', 'pivote fuera', 'roce', 'rubí ausente'],
    limitations: ['Sin tolerancias, metrología, aumento calibrado o certeza física.'],
    sourceIds: [...officialSourceIds, 'source.horology.private-book.jewelling'],
    activities: [
      { slug: 'inspect-parts', title: 'Inspeccionar piezas', competency: 'inspect' },
      { slug: 'detect-symbolic-defect', title: 'Detectar un defecto simbólico', competency: 'inspect' },
    ],
  },
  {
    slug: 'assembly-verification',
    title: 'Montaje y comprobaciones',
    purpose: 'Montar en modos guiado, asistido y libre validando soportes, alineación, orientación e identidad.',
    subsystem: 'assembly',
    explanation: 'Una pieza solo se instala cuando sus dependencias semánticas se cumplen. Las comprobaciones parciales declaran qué verifican y qué no; movimiento visual libre no equivale a funcionamiento físico.',
    interactions: ['alinear', 'instalar', 'apretar', 'verificar', 'restaurar ensamblaje'],
    limitations: ['Sin asiento, fuerza, par, libertad física o tolerancia verificadas.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'guided-assembly', title: 'Montar en modo guiado', competency: 'virtual-assembly' },
      { slug: 'assisted-assembly', title: 'Montar en modo asistido', competency: 'virtual-assembly' },
      { slug: 'free-assembly', title: 'Montar en modo libre', competency: 'virtual-assembly' },
      { slug: 'partial-verifications', title: 'Realizar comprobaciones parciales', competency: 'verify-partially' },
    ],
  },
  {
    slug: 'diagnosis-project',
    title: 'Diagnóstico y proyecto final',
    purpose: 'Convertir síntoma en hipótesis, dato, comprobación, resultado y conclusión permitida; completar el dossier.',
    subsystem: 'diagnosis',
    explanation: 'Quince fallos educativos coordinan estado visual y grafo funcional. La conclusión permanece proporcional a la evidencia y conserva una conclusión prohibida: nunca afirmar una avería física confirmada desde la simulación.',
    interactions: ['síntoma', 'subsistema', 'hipótesis', 'prueba', 'descarte/refuerzo', 'proyecto final'],
    limitations: ['Diagnóstico conceptual; requiere revisión humana y no prescribe reparación.'],
    sourceIds: officialSourceIds,
    activities: [
      { slug: 'identify-affected-subsystem', title: 'Identificar un subsistema afectado', competency: 'form-hypothesis' },
      { slug: 'form-hypothesis', title: 'Formular hipótesis', competency: 'form-hypothesis' },
      { slug: 'select-verification', title: 'Seleccionar comprobación', competency: 'conceptual-diagnosis' },
      { slug: 'complete-diagnosis', title: 'Completar diagnóstico', competency: 'conceptual-diagnosis' },
      { slug: 'final-project', title: 'Completar proyecto final', competency: 'document-calibre' },
    ],
  },
]

const competencySpecs = [
  ['identify-calibre', 'Identificar el MIYOTA 8215', 'knowledge'],
  ['read-official-documentation', 'Leer documentación oficial', 'knowledge'],
  ['distinguish-data-reconstruction', 'Distinguir datos y reconstrucciones', 'knowledge'],
  ['recognize-subsystems', 'Reconocer subsistemas', 'knowledge'],
  ['explain-automatic', 'Explicar la carga automática', 'knowledge'],
  ['explain-winding-setting', 'Explicar cuerda y puesta en hora', 'knowledge'],
  ['explain-calendar', 'Explicar el calendario', 'knowledge'],
  ['explain-energy-chain', 'Explicar la cadena energética', 'knowledge'],
  ['identify-train', 'Identificar el tren', 'knowledge'],
  ['explain-escapement-oscillator', 'Explicar escape y oscilador', 'knowledge'],
  ['prepare-disassembly', 'Preparar un desmontaje', 'procedure'],
  ['preserve-identity-orientation', 'Conservar identidad y orientación', 'procedure'],
  ['virtual-disassembly', 'Desmontar virtualmente', 'procedure'],
  ['inspect', 'Inspeccionar', 'procedure'],
  ['virtual-assembly', 'Montar virtualmente', 'procedure'],
  ['verify-partially', 'Verificar parcialmente', 'procedure'],
  ['form-hypothesis', 'Formular hipótesis', 'reasoning'],
  ['conceptual-diagnosis', 'Diagnosticar conceptualmente', 'reasoning'],
  ['document-calibre', 'Documentar el calibre', 'artifact'],
  ['declare-fidelity-limits', 'Declarar límites de fidelidad', 'knowledge'],
] as const

type ConceptGraphSpec = {
  prerequisiteIds?: string[]
  relatedIds?: string[]
  transferTargetIds?: string[]
}

const conceptId = (slug: string) => `concept.miyota8215.${slug}`

// Grafo semántico del recorrido 8215. Las aristas representan dependencias
// conceptuales, relaciones funcionales o destinos de transferencia reales;
// no dependen de la posición de una competencia dentro de un array.
const conceptGraph: Record<(typeof competencySpecs)[number][0], ConceptGraphSpec> = {
  'identify-calibre': {
    transferTargetIds: [conceptId('distinguish-data-reconstruction'), conceptId('read-official-documentation')],
  },
  'read-official-documentation': {
    prerequisiteIds: [conceptId('identify-calibre')],
    relatedIds: [conceptId('distinguish-data-reconstruction')],
    transferTargetIds: [conceptId('recognize-subsystems')],
  },
  'distinguish-data-reconstruction': {
    prerequisiteIds: [conceptId('identify-calibre')],
    transferTargetIds: [conceptId('declare-fidelity-limits')],
  },
  'recognize-subsystems': {
    prerequisiteIds: [conceptId('read-official-documentation')],
    relatedIds: [conceptId('distinguish-data-reconstruction')],
    transferTargetIds: [
      conceptId('explain-automatic'),
      conceptId('explain-winding-setting'),
      conceptId('explain-calendar'),
      conceptId('explain-energy-chain'),
    ],
  },
  'explain-automatic': {
    prerequisiteIds: [conceptId('recognize-subsystems')],
    relatedIds: [conceptId('explain-energy-chain')],
    transferTargetIds: [conceptId('prepare-disassembly')],
  },
  'explain-winding-setting': {
    prerequisiteIds: [conceptId('recognize-subsystems')],
    relatedIds: [conceptId('explain-automatic')],
    transferTargetIds: [conceptId('explain-calendar'), conceptId('prepare-disassembly')],
  },
  'explain-calendar': {
    prerequisiteIds: [conceptId('recognize-subsystems'), conceptId('explain-winding-setting')],
    relatedIds: [conceptId('explain-automatic')],
    transferTargetIds: [conceptId('prepare-disassembly')],
  },
  'explain-energy-chain': {
    prerequisiteIds: [conceptId('recognize-subsystems')],
    relatedIds: [conceptId('explain-automatic'), conceptId('explain-winding-setting')],
    transferTargetIds: [conceptId('identify-train')],
  },
  'identify-train': {
    prerequisiteIds: [conceptId('explain-energy-chain')],
    relatedIds: [conceptId('recognize-subsystems')],
    transferTargetIds: [conceptId('verify-partially'), conceptId('explain-escapement-oscillator')],
  },
  'explain-escapement-oscillator': {
    prerequisiteIds: [conceptId('identify-train'), conceptId('explain-energy-chain')],
    relatedIds: [conceptId('verify-partially')],
    transferTargetIds: [conceptId('prepare-disassembly')],
  },
  'prepare-disassembly': {
    prerequisiteIds: [conceptId('read-official-documentation'), conceptId('explain-escapement-oscillator')],
    relatedIds: [conceptId('distinguish-data-reconstruction')],
    transferTargetIds: [conceptId('preserve-identity-orientation'), conceptId('virtual-disassembly')],
  },
  'preserve-identity-orientation': {
    prerequisiteIds: [conceptId('prepare-disassembly')],
    relatedIds: [conceptId('read-official-documentation')],
    transferTargetIds: [conceptId('virtual-disassembly')],
  },
  'virtual-disassembly': {
    prerequisiteIds: [conceptId('prepare-disassembly'), conceptId('preserve-identity-orientation')],
    relatedIds: [conceptId('recognize-subsystems')],
    transferTargetIds: [conceptId('inspect')],
  },
  inspect: {
    prerequisiteIds: [conceptId('virtual-disassembly'), conceptId('preserve-identity-orientation')],
    relatedIds: [conceptId('distinguish-data-reconstruction')],
    transferTargetIds: [conceptId('virtual-assembly'), conceptId('form-hypothesis')],
  },
  'virtual-assembly': {
    prerequisiteIds: [conceptId('virtual-disassembly'), conceptId('inspect')],
    relatedIds: [conceptId('verify-partially')],
    transferTargetIds: [conceptId('form-hypothesis')],
  },
  'verify-partially': {
    prerequisiteIds: [conceptId('identify-train')],
    relatedIds: [conceptId('inspect')],
    transferTargetIds: [conceptId('form-hypothesis')],
  },
  'form-hypothesis': {
    prerequisiteIds: [conceptId('inspect'), conceptId('verify-partially')],
    transferTargetIds: [conceptId('conceptual-diagnosis')],
  },
  'conceptual-diagnosis': {
    prerequisiteIds: [conceptId('form-hypothesis'), conceptId('verify-partially')],
    relatedIds: [conceptId('inspect')],
    transferTargetIds: [conceptId('document-calibre')],
  },
  'document-calibre': {
    prerequisiteIds: [conceptId('conceptual-diagnosis'), conceptId('virtual-assembly')],
    relatedIds: [conceptId('read-official-documentation')],
    transferTargetIds: [conceptId('declare-fidelity-limits')],
  },
  'declare-fidelity-limits': {
    prerequisiteIds: [conceptId('document-calibre'), conceptId('distinguish-data-reconstruction')],
    relatedIds: [conceptId('read-official-documentation'), conceptId('conceptual-diagnosis')],
  },
}

const activitySpecs = modules.flatMap((module) => module.activities.map((activity) => ({ ...activity, module })))
const competencyActivities = new Map<string, string[]>()
for (const activity of activitySpecs) {
  const id = `activity.miyota8215.${activity.slug}`
  competencyActivities.set(activity.competency, [...(competencyActivities.get(activity.competency) ?? []), id])
}
// Las competencias de límites y documentación comparten el proyecto final.
competencyActivities.set('declare-fidelity-limits', ['activity.miyota8215.final-project'])

await rm(outputDir, { recursive: true, force: true })
for (const directory of ['curriculum', 'routes', 'modules', 'concepts', 'blocks', 'lessons', 'activities', 'scenes', 'competencies', 'evidence', 'rubrics', 'glossary', 'sources', 'recommendations', 'visual-resources', 'generated', 'dist']) {
  await mkdir(path.join(outputDir, directory), { recursive: true })
}

const writeJson = async (relative: string, value: unknown) => {
  await writeFile(path.join(outputDir, relative), `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const originalSource = clone(base.sources.find((source: any) => source.id === 'source.horology.original-mechanical-foundations'))
originalSource.id = originalSourceId
originalSource.resource.title = 'Sistema 4F · MIYOTA 8215 completo'
originalSource.supportedClaim = 'Arquitectura de laboratorio, explicaciones, actividades, operaciones educativas y evaluación originales del Sistema 4F.'

const sources = [
  ...base.sources.filter((source: any) => officialSourceIds.includes(source.id)),
  ...base.sources.filter((source: any) => source.id.startsWith('source.horology.private-book.')),
  originalSource,
]
for (const source of sources) await writeJson(`sources/${source.id}.json`, source)

const modulesOut: any[] = []
const lessons: any[] = []
const blocks: any[] = []
const activities: any[] = []
const scenes: any[] = []
const concepts: any[] = []
const visualResources: any[] = []

for (const [index, module] of modules.entries()) {
  const moduleId = `module.miyota8215.${module.slug}`
  const lessonId = `lesson.miyota8215.${module.slug}`
  const blockId = `block.miyota8215.${module.slug}`
  const sceneId = `scene.miyota8215.${module.slug}`
  const visualId = `visual.miyota8215.${module.slug}`
  const activityIds = module.activities.map(({ slug }) => `activity.miyota8215.${slug}`)
  const conceptIds = [...new Set(module.activities.map(({ competency }) => `concept.miyota8215.${competency}`))]

  const moduleObject = clone(base.modules[0])
  Object.assign(moduleObject, { id: moduleId, version, title: { es: module.title, en: module.title }, purpose: { es: module.purpose, en: module.purpose }, lessonIds: [lessonId] })
  modulesOut.push(moduleObject)

  const block = clone(base.blocks[0])
  block.id = blockId
  block.version = version
  block.title = module.title
  block.bodyMarkdown = `## Propósito\n\n${module.purpose}\n\n## Objetivos y prerrequisitos\n\nLa práctica exige el mapa funcional y Fundamentos del reloj mecánico. Antes de actuar, identifica la fuente, la pieza concreta, la autoridad de la relación, sus dependencias y sus límites.\n\n## Explicación\n\n${module.explanation}\n\n## Visual e interacción\n\n${module.interactions.map((item) => `- ${item}`).join('\n')}\n\nTodas las acciones pueden deshacerse y utilizarse sin arrastre. La alternativa textual expone árbol, piezas, estados, relaciones, dependencias, tornillos, bandejas, errores y resultados.\n\n## Fuentes, afirmaciones y vocabulario\n\nLas identidades, referencias y datos específicos proceden de documentación MIYOTA. La explicación es contenido educativo original. El libro privado solo aporta teoría general y no se copia. Los nombres en español conservan su equivalencia técnica en inglés y su referencia oficial.\n\n## Actividad, errores y ayuda\n\n${module.activities.map(({ title }) => `- ${title}.`).join('\n')}\n\nUn error no borra el estado ni la identidad: muestra un diagnóstico, conserva las ayudas y permite restaurar. No se premia la velocidad.\n\n## Evidencia y criterios de revisión\n\nSe conservan fuente, pieza concreta, autoridad, herramienta, orientación, bandeja, estado, comprobación, corrección, ayuda y limitación. La revisión combina resultado y razonamiento; para considerarlo consolidado se exige otra sesión, otra actividad y al menos siete días.\n\n## Limitaciones\n\n${module.limitations.map((item) => `- ${item}`).join('\n')}\n- Los niveles de reconstrucción y fidelidad se consultan en la ficha técnica; no certifican servicio profesional ni funcionamiento físico.\n\n## Resumen y siguiente conexión\n\n${module.purpose} ${index < modules.length - 1 ? `Continúa con «${modules[index + 1].title}».` : 'El dossier final queda pendiente de revisión humana.'}`
  block.claims = [{
    ...clone(base.blocks[0].claims[0]),
    id: `claim.miyota8215.${module.slug}`,
    claim: `${module.title} se practica sobre el modelo estructural del 8215 con autoridad y limitaciones visibles.`,
    method: 'Modelo estructural del 8215 y controles educativos del Sistema 4F',
    fidelity: clone(fidelity),
    inputFingerprint: `system4f:${module.slug}:${version}`,
    sources: [clone(originalSource)],
    sourceStatement: 'Documentación MIYOTA para identidad y estructura; explicación educativa original para la secuencia de aprendizaje.',
  }]
  blocks.push(block)

  const lesson = clone(base.lessons[0])
  lesson.id = lessonId
  lesson.version = version
  lesson.title = module.title
  lesson.blockIds = [blockId]
  lesson.activityIds = activityIds
  lesson.authoring = {
    ...lesson.authoring,
    title: { es: module.title, en: module.title },
    purpose: { es: module.purpose, en: module.purpose },
    objectives: [
      { es: `Explicar cómo ${module.purpose.replace(/\.$/, '').replace(/^./, (letter) => letter.toLocaleLowerCase('es'))}.`, en: `Explicar cómo ${module.purpose.replace(/\.$/, '').replace(/^./, (letter) => letter.toLocaleLowerCase('es'))}.` },
      { es: 'Ejecutar una acción reversible cuando el modelo y las fuentes la respalden.', en: 'Ejecutar una acción reversible cuando el modelo y las fuentes la respalden.' },
      { es: 'Distinguir conclusión permitida, desconocido y límite del modelo estructural.', en: 'Distinguir conclusión permitida, desconocido y límite del modelo estructural.' },
    ],
    prerequisiteConceptIds: index ? [`concept.miyota8215.${modules[index - 1].activities[0].competency}`] : [],
    externalPrerequisites: index === 0 ? [
      {
        packageId: 'wplab.horology.functional-map',
        versionRange: '^0.5.0',
        moduleIds: ['module.horology.functional-map'],
        competencyIds: ['competency.horology.identify-functional-subsystems', 'competency.horology.explain-mechanical-energy-chain'],
        recommendedButOptionalRouteIds: ['route.quartz2035.isa-to-2035'],
      },
      {
        packageId: 'wplab.horology.mechanical-foundations',
        versionRange: '^0.5.0',
        moduleIds: ['module.mechanical.final-project'],
        competencyIds: ['competency.mechanical.explain-energy-chain', 'competency.mechanical.document-fidelity-limits'],
        recommendedButOptionalRouteIds: [],
      },
    ] : [],
    conceptIds,
    sourceIds: [...new Set([...module.sourceIds, originalSourceId])],
    visualResourceIds: [visualId],
    visualStrategy: {
      ...lesson.authoring.visualStrategy,
      objective: { es: module.purpose, en: module.purpose },
      visibleConcept: { es: `${module.title} sobre el ensamblaje canónico 8215.`, en: `${module.title} sobre el ensamblaje canónico 8215.` },
      modelReference: fixtureId,
      movementIds: [fixtureId, 'fixture.conceptual.mechanical-chain'],
      involvedSelectors: [{ selector: { by: 'calibre', value: '8215' }, cardinality: 'exactly-one' }],
      initialState: { ...lesson.authoring.visualStrategy.initialState, cameraIntent: 'Vista estable del 8215; sin movimiento automático obligatorio.' },
      energyFlow: module.subsystem === 'automatic' || module.subsystem === 'power-source' || module.subsystem === 'train' ? ['rotor/corona', 'barrel', 'train', 'escapement'] : [],
      rotationDirections: ['Arcos estáticos o pasos discretos; sin cinemática exacta atribuida al 8215.'],
      labels: ['pieza', 'referencia', 'pieza concreta', 'subsistema', 'autoridad', 'fidelidad del modelo', 'limitación'],
      arrows: ['Relaciones derivadas del grafo funcional o estructural, con autoridad visible.'],
      animations: ['Estados discretos, pausa y navegación manual; reduced motion equivalente.'],
      timelineIntent: 'Observar, consultar fuente, predecir, actuar, comprobar, explicar y restaurar.',
      userInteraction: 'Acciones semánticas con teclado; no requiere arrastre.',
      observableResult: { es: 'Estado de calibre, evidencia y limitación reproducibles.', en: 'Estado de calibre, evidencia y limitación reproducibles.' },
      successCriterion: { es: 'Identidad y autoridad correctas, dependencia satisfecha y conclusión limitada.', en: 'Identidad y autoridad correctas, dependencia satisfecha y conclusión limitada.' },
      restoration: { es: 'Restaurar instancia, bandeja, herramienta, cámara, subsistema y checkpoint.', en: 'Restaurar instancia, bandeja, herramienta, cámara, subsistema y checkpoint.' },
      textualAlternative: { es: 'Árbol de subsistemas, lista de instancias, relaciones, dependencias, acciones y resultados.', en: 'Árbol de subsistemas, lista de instancias, relaciones, dependencias, acciones y resultados.' },
      reducedMotionAlternative: { es: 'Estados discretos, giros estáticos, energía numerada y escape por fases.', en: 'Estados discretos, giros estáticos, energía numerada y escape por fases.' },
      fidelity: clone(fidelity),
      unknownData: ['geometría oculta por pieza', 'tolerancias', 'par', 'presión', 'lubricación', 'desgaste', 'secuencia profesional completa'],
      requiredVisualResourceIds: [visualId],
    },
  }
  lessons.push(lesson)

  const scene = clone(base.scenes[0])
  scene.id = sceneId
  scene.version = version
  scene.title = module.title
  scene.description = `${module.purpose} Escena reversible, accesible y con autoridad de operación visible.`
  scene.fixtureBinding = { kind: 'fixture', fixtureId }
  scene.cameraIntent = { intent: index === 1 ? 'overview' : index >= 9 ? 'bridges' : 'comparison', transition: 'smooth' }
  scene.timeline[0].targets = [{ selector: { by: 'calibre', value: '8215' }, cardinality: 'exactly-one' }]
  scene.overlays = [{
    kind: 'text',
    id: `overlay.miyota8215.${module.slug}.fidelity`,
    markdown: `${module.title}: modelo estructural del MIYOTA 8215. Cada operación muestra su autoridad y las referencias solo documentales no pueden manipularse. Consulta los niveles de reconstrucción y fidelidad en la ficha técnica.`,
    accessibleLabel: `${module.title}. Fidelidad, autoridad y limitaciones disponibles en texto.`,
  }]
  scene.steps = [
    {
      ...scene.steps[0],
      id: `step.miyota8215.${module.slug}.observe`,
      instructionMarkdown: `Consulta fuentes, identifica instancias y predice antes de actuar en ${module.title.toLowerCase()}.`,
      questions: [{
        ...scene.steps[0].questions[0],
        id: `question.miyota8215.${module.slug}.authority`,
        promptMarkdown: '¿Qué autoridad tiene esta práctica?',
        options: [
          { id: `option.miyota8215.${module.slug}.educational`, label: 'Relación documentada o secuencia educativa declarada', labels: { es: 'Relación documentada o secuencia educativa declarada', en: 'Relación documentada o secuencia educativa declarada' } },
          { id: `option.miyota8215.${module.slug}.official`, label: 'Procedimiento oficial completo de servicio', labels: { es: 'Procedimiento oficial completo de servicio', en: 'Procedimiento oficial completo de servicio' } },
        ],
        hints: [],
        authoring: {
          prompt: { es: '¿Qué autoridad tiene esta práctica?', en: '¿Qué autoridad tiene esta práctica?' },
          feedback: { es: 'La interfaz distingue relación oficial, dependencia, secuencia educativa, inferencia y simulación.', en: 'La interfaz distingue relación oficial, dependencia, secuencia educativa, inferencia y simulación.' },
        },
      }],
    },
    {
      ...scene.steps[1],
      id: `step.miyota8215.${module.slug}.execute`,
      instructionMarkdown: 'Ejecuta acciones semánticas, registra evidencia, comprueba el resultado y restaura.',
    },
  ]
  scene.storyboard = {
    ...scene.storyboard,
    sceneName: { es: module.title, en: module.title },
    purpose: { es: module.purpose, en: module.purpose },
    prerequisites: index ? [`concept.miyota8215.${modules[index - 1].activities[0].competency}`] : [],
    narrative: { es: module.explanation, en: module.explanation },
    initialFraming: { es: 'Vista estable con fuente y ficha técnica de reconstrucción y fidelidad visibles.', en: 'Vista estable con fuente y ficha técnica de reconstrucción y fidelidad visibles.' },
    protagonist: { selector: { by: 'calibre', value: '8215' }, cardinality: 'exactly-one' },
    secondaryParts: [],
    sequence: [
      {
        ...scene.storyboard.sequence[0],
        id: `story.miyota8215.${module.slug}.observe`,
        sceneStepId: `step.miyota8215.${module.slug}.observe`,
        narrative: { es: 'Consultar, identificar, clasificar autoridad y predecir.', en: 'Consultar, identificar, clasificar autoridad y predecir.' },
        runtimeActions: ['calibre-select', 'documentation-review', 'predict'],
      },
      {
        ...scene.storyboard.sequence[1],
        id: `story.miyota8215.${module.slug}.execute`,
        sceneStepId: `step.miyota8215.${module.slug}.execute`,
        narrative: { es: 'Manipular cuando esté permitido, comprobar, explicar y restaurar.', en: 'Manipular cuando esté permitido, comprobar, explicar y restaurar.' },
        runtimeActions: ['calibre-lab-command', 'workbench-command', 'checkpoint', 'restore'],
      },
    ],
    ending: { es: 'Estado restaurable y evidencia disponible.', en: 'Estado restaurable y evidencia disponible.' },
    restoration: { es: 'Restaurar 63 identidades, tornillos, bandejas, orientación, cámara y subsistema.', en: 'Restaurar 63 identidades, tornillos, bandejas, orientación, cámara y subsistema.' },
    accessibility: { es: 'Árbol y lista ordenados; acciones por teclado y sin arrastre.', en: 'Árbol y lista ordenados; acciones por teclado y sin arrastre.' },
    reducedMotion: { es: 'Estados discretos con idéntica información y evaluación.', en: 'Estados discretos con idéntica información y evaluación.' },
    evidenceTemplateIds: [...new Set(module.activities.map(({ competency }) => `evidence.miyota8215.${competency}`))],
    technicalCriteria: ['Identidad de cada pieza.', 'Autoridad visible.', 'Dependencias clasificadas.', 'El modelo de referencia y el proyecto técnico permanecen intactos.'],
    limitations: [...fidelity.limitations, ...module.limitations],
  }
  scenes.push(scene)

  const visual = clone(base.visualResources[0])
  Object.assign(visual, {
    id: visualId,
    version,
    type: index === 1 ? 'visual-table' : index >= 9 && index <= 11 ? 'disassembly-sequence' : index === 12 ? 'error-simulation' : 'real-movement-3d',
    purpose: { es: `${module.title}: modelo didáctico del 8215, autoridad, manipulación y alternativa textual.`, en: `${module.title}: modelo didáctico del 8215, autoridad, manipulación y alternativa textual.` },
    status: 'ready',
    sourceIds: [...new Set([...module.sourceIds, originalSourceId])],
    fidelity: clone(fidelity),
    lessonIds: [lessonId],
    movementIds: [fixtureId],
    partSelectors: [{ selector: { by: 'calibre', value: '8215' }, cardinality: 'exactly-one' }],
    dataRequirements: ['Registro técnico de 56 piezas sobre 63 referencias.', 'Autoridad de las operaciones.', 'Identidad de cada pieza.', 'Restauración.', 'Movimiento reducido y alternativa textual.'],
    priority: 'high',
    dependencyIds: [],
    currentModelSupport: 'yes',
      viewportImpact: index >= 9 ? 'extension' : 'configuration',
  })
  visualResources.push(visual)

  for (const activitySpec of module.activities) {
    const activity = clone(base.activities[0])
    const activityId = `activity.miyota8215.${activitySpec.slug}`
    const competencyId = `competency.miyota8215.${activitySpec.competency}`
    activity.id = activityId
    activity.version = version
    activity.title = activitySpec.title
    activity.sceneIds = [sceneId]
    activity.competencyIds = [competencyId]
    activity.evidenceTemplateIds = [`evidence.miyota8215.${activitySpec.competency}`]
    activity.rubricId = `rubric.miyota8215.${activitySpec.competency}`
    activity.projectReference = { kind: 'fixture-readonly', fixtureId }
    activity.authoring = {
      ...activity.authoring,
      lessonId,
      title: { es: activitySpec.title, en: activitySpec.title },
      description: { es: `${activitySpec.title} con identidad, autoridad, dependencias, evidencia y restauración.`, en: `${activitySpec.title} con identidad, autoridad, dependencias, evidencia y restauración.` },
      difficulty: index < 3 ? 'introductory' : index < 10 ? 'intermediate' : 'advanced',
      durationMinutes: index < 9 ? 16 : 24,
      activityType: activitySpec.type ?? 'guided-practice',
      movementIds: [fixtureId, 'fixture.conceptual.mechanical-chain'],
      familyIds: ['miyota-82'],
      subsystem: module.subsystem,
      languages: ['es-ES'],
      offline: true,
      fidelity: clone(fidelity),
      warnings: { es: [...fidelity.limitations, ...module.limitations], en: [] },
      sourceIds: [...new Set([...module.sourceIds, originalSourceId])],
      visualResourceIds: [visualId],
      fixtureBinding: { kind: 'fixture', fixtureId },
      interactionContract: {
        ...activity.authoring.interactionContract,
        evidencePolicy: {
          eventType: 'calibre-lab-command',
          recordsAnswerPayload: true,
          deterministicComponents: ['instance-id', 'authority', 'dependency', 'state', 'fixture-version'],
          requiresHumanReview: activitySpec.slug === 'final-project',
          accessibilityAdaptationsCountAsHints: false,
        },
      },
      calibreLabContract: {
        fixtureId,
        modes: index === 10 || index === 13 ? ['guided', 'assisted', 'free'] : index === 11 ? ['assisted', 'free'] : ['guided'],
        subsystemIds: [`subsystem.8215.${module.subsystem === 'power-source' ? 'barrel' : module.subsystem === 'identity' || module.subsystem === 'documentation' || module.subsystem === 'planning' || module.subsystem === 'disassembly' || module.subsystem === 'inspection' || module.subsystem === 'assembly' || module.subsystem === 'diagnosis' ? 'structure' : module.subsystem}`],
        operationPhases: index < 3 ? ['documentation'] : index < 9 ? ['documentation', 'verification'] : index < 12 ? ['documentation', 'disassembly'] : index === 12 ? ['inspection', 'diagnosis'] : index === 13 ? ['assembly', 'verification'] : ['diagnosis', 'verification'],
        authorityVisible: true,
        instanceIdentityRequired: true,
        contextualMechanicalLabs: index === 3 ? ['automatic'] : index === 6 ? ['barrel'] : index === 7 ? ['train'] : index === 8 ? ['escapement', 'oscillator'] : [],
        textualAlternative: true,
        reducedMotion: true,
      },
      pedagogicalPattern: {
        enabled: true,
        stages: ['observe', 'predict', 'manipulate', 'execute-or-simulate', 'compare', 'explain', 'check-understanding', 'record-evidence'],
      },
    }
    if (index >= 9) {
      activity.authoring.workbenchContract = {
        fixtureId,
        modes: activity.authoring.calibreLabContract.modes,
        requiredZones: ['zone.movement', 'zone.tools', 'zone.tray', 'zone.inspection', 'zone.documentation'],
        evidenceContext: ['mode', 'assistance', 'hints', 'errors', 'corrections', 'sources', 'initial-state', 'final-state', 'fixture-limitations'],
      }
    } else {
      delete activity.authoring.workbenchContract
    }
    if ([3, 6, 7, 8].includes(index)) {
      activity.authoring.mechanicalLabContract = {
        fixtureId: 'fixture.conceptual.mechanical-chain',
        comparisonFixtureId: fixtureId,
        subsystem: index === 3 ? 'automatic' : index === 6 ? 'barrel' : index === 7 ? 'train' : 'escapement',
        commands: ['inspect', 'select-subsystem', 'change-view', 'introduce-fault', 'restore'],
        viewModes: ['normal', 'step-by-step', 'compare-8215', 'textual'],
        normalizedPhysicsOnly: true,
        textualAlternative: true,
        reducedMotion: true,
      }
    } else {
      delete activity.authoring.mechanicalLabContract
    }
    activities.push(activity)
  }
}

const competencies: any[] = []
const evidenceTemplates: any[] = []
const rubrics: any[] = []
const recommendations: any[] = []

for (const [slug, title, skillType] of competencySpecs) {
  const competencyId = `competency.miyota8215.${slug}`
  const activityIds = competencyActivities.get(slug) ?? ['activity.miyota8215.final-project']
  const module = activitySpecs.find(({ competency }) => competency === slug)?.module ?? modules.at(-1)!
  const competency = clone(base.competencies[0])
  Object.assign(competency, {
    id: competencyId,
    version,
    title,
    description: `${title} sobre el modelo estructural del MIYOTA 8215 mediante evidencia trazable y límites explícitos.`,
    prerequisites: [],
    authoring: {
      title: { es: title, en: title },
      description: { es: `${title}; el tiempo y las adaptaciones accesibles no penalizan.`, en: `${title}; el tiempo y las adaptaciones accesibles no penalizan.` },
      movementIds: [fixtureId],
      subsystem: module.subsystem,
      skillType: skillType === 'artifact' ? 'procedure' : skillType,
      sourceIds: [...new Set([...module.sourceIds, originalSourceId])],
    },
  })
  competencies.push(competency)

  const evidence = clone(base.evidenceTemplates[0])
  evidence.id = `evidence.miyota8215.${slug}`
  evidence.version = version
  evidence.competencyId = competencyId
  evidence.kind = skillType === 'artifact' ? 'artifact' : skillType === 'reasoning' ? 'observation' : 'procedure'
  evidence.extraction = {
    ...evidence.extraction,
    id: `rule.extract.miyota8215.${slug}`,
    version,
    triggerEventType: 'calibre-lab-command',
    evidenceType: slug === 'document-calibre' ? 'human-review' : 'simulation-result',
    competencyId,
    packageId,
    activityIds,
    evidenceTemplateId: evidence.id,
    minimumSessionState: ['active', 'paused', 'completed'],
    confidence: slug === 'document-calibre' ? 0.7 : 1,
    contentFields: ['sceneId', 'stepId', 'data', 'commandType', 'instanceId', 'authority', 'dependencyIds', 'toolId', 'orientation', 'trayZoneId', 'verification', 'hypothesis', 'limitations'],
  }
  evidenceTemplates.push(evidence)

  const rubric = clone(base.rubrics[0])
  rubric.id = `rubric.miyota8215.${slug}`
  rubric.version = version
  rubric.competencyId = competencyId
  rubric.rules = [{
    ...rubric.rules[0],
    id: `rule.miyota8215.${slug}.demonstrated`,
    version,
    minimumEvidence: 1,
    minimumDistinctSessions: 1,
    minimumSpanDays: 0,
    explanationTemplate: `${title}: se evalúan identidad, autoridad, dependencia, resultado, razonamiento, corrección y límite; el tiempo no penaliza.`,
  }]
  rubric.assessmentRule = {
    ...rubric.assessmentRule,
    id: `rule.composite.miyota8215.${slug}.demonstrated`,
    version,
    competencyId,
    condition: {
      op: 'all',
      conditions: [
        { op: 'exists', filter: { evidenceType: evidence.extraction.evidenceType, status: 'active', minimumConfidence: evidence.extraction.confidence } },
        { op: 'minimum-evidence', count: 1 },
      ],
    },
  }
  rubrics.push(rubric)

  const recommendation = clone(base.recommendations[0])
  Object.assign(recommendation, {
    id: `recommendation.miyota8215.retain-${slug}`,
    version,
    title: { es: `Práctica posterior: ${title.toLowerCase()}`, en: `Práctica posterior: ${title.toLowerCase()}` },
    reason: { es: 'Para considerarlo consolidado se exige otra actividad, otra sesión, evidencia independiente, un contexto diferente y al menos siete días.', en: 'Para considerarlo consolidado se exige otra actividad, otra sesión, evidencia independiente, un contexto diferente y al menos siete días.' },
    rule: 'independent-later-evidence-different-activity-session-context-minimum-7-days@1.0.0',
    target: { kind: 'competency', id: competencyId },
    evidenceTemplateIds: [evidence.id],
    required: false,
  })
  recommendations.push(recommendation)

  const concept = clone(base.concepts[0])
  const graph = conceptGraph[slug]
  Object.assign(concept, {
    id: `concept.miyota8215.${slug}`,
    version,
    title: { es: title, en: title },
    summary: { es: `${title}: ${module.purpose.replace(/^./, (letter) => letter.toLocaleLowerCase('es'))}`, en: `${title}: ${module.purpose.replace(/^./, (letter) => letter.toLocaleLowerCase('es'))}` },
    kind: skillType === 'knowledge' ? 'concept' : 'skill',
    prerequisiteIds: graph.prerequisiteIds ?? [],
    relatedIds: graph.relatedIds ?? [],
    competencyIds: [competencyId],
    movementIds: [fixtureId],
    subsystem: module.subsystem,
    routeIds: [routeId],
    activityIds,
    sourceIds: [...new Set([...module.sourceIds, originalSourceId])],
    transferTargetIds: graph.transferTargetIds ?? [],
    availability: 'available',
  })
  concepts.push(concept)
}

const glossary: any[] = []
for (const record of MIYOTA_8215_TECHNICAL_FIXTURE.ledger) {
  const reference = `${record.officialReference ?? 'interface'}-${record.nameEn}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const id = `term.miyota8215.${reference}`
  const term = clone(base.glossary[0])
  Object.assign(term, {
    id,
    version,
    term: record.nameEs,
    definitionMarkdown: `${record.nameEs}: ${record.nameEn}; ${record.officialReference ? `referencia MIYOTA ${record.officialReference}` : 'interfaz sin referencia de recambio'}; subsistema ${record.subsystem}.`,
    language: 'es-ES',
    authoring: {
      terms: { es: record.nameEs, en: record.nameEn },
      synonyms: { es: [], en: [] },
      discouragedTerms: [],
      simpleDefinition: { es: `${record.nameEs}, pieza o conjunto del subsistema ${record.subsystem}.`, en: `${record.nameEn}, part or assembly in subsystem ${record.subsystem}.` },
      technicalDefinition: {
        es: `${record.nameEn}; ${record.officialReference ? `referencia oficial ${record.officialReference}` : 'sin referencia oficial de recambio'}; nivel ${record.reconstructionLevel}, estado ${record.modelState}.`,
        en: `${record.nameEn}; ${record.officialReference ? `official reference ${record.officialReference}` : 'without official replacement reference'}; level ${record.reconstructionLevel}, state ${record.modelState}.`,
      },
      context: { es: `MIYOTA 8215 · ${record.subsystem}; limitaciones: ${record.limitations.join(' ') || 'modelo estructural normalizado.'}`, en: `MIYOTA 8215 · ${record.subsystem}.` },
      sourceIds: [...record.sourceIds],
    },
  })
  glossary.push(term)
}

const curriculum = clone(base.curricula[0])
Object.assign(curriculum, {
  id: 'curriculum.miyota8215',
  version,
  title: { es: 'Especialización MIYOTA 8215', en: 'Especialización MIYOTA 8215' },
  purpose: { es: 'Comprender, desmontar, montar y diagnosticar virtualmente el MIYOTA 8215 con autoridad y límites explícitos.', en: 'Comprender, desmontar, montar y diagnosticar virtualmente el MIYOTA 8215 con autoridad y límites explícitos.' },
  routeIds: [routeId],
  languages: ['es-ES'],
})

const route = clone(base.routes[0])
Object.assign(route, {
  id: routeId,
  version,
  title: { es: 'MIYOTA 8215: comprender, desmontar, montar y diagnosticar', en: 'MIYOTA 8215: comprender, desmontar, montar y diagnosticar' },
  purpose: { es: 'Especialización práctica, trazable y reversible sobre el ensamblaje canónico del MIYOTA 8215.', en: 'Especialización práctica, trazable y reversible sobre el ensamblaje canónico del MIYOTA 8215.' },
  prerequisiteConceptIds: [],
  moduleIds: modulesOut.map(({ id }) => id),
  competencyIds: competencies.map(({ id }) => id),
  movementIds: [fixtureId],
  difficulty: 'advanced',
  sourceIds: sources.map(({ id }) => id),
  visualResourceIds: visualResources.map(({ id }) => id),
  demo: false,
})
delete route.prerequisiteNodeIds

await writeJson('curriculum/curriculum.miyota8215.json', curriculum)
await writeJson(`routes/${routeId}.json`, route)
for (const item of modulesOut) await writeJson(`modules/${item.id}.json`, item)
for (const item of concepts) await writeJson(`concepts/${item.id}.json`, item)
for (const item of blocks) await writeJson(`blocks/${item.id}.json`, item)
for (const item of lessons) await writeJson(`lessons/${item.id}.json`, item)
for (const item of activities) await writeJson(`activities/${item.id}.json`, item)
for (const item of scenes) await writeJson(`scenes/${item.id}.json`, item)
for (const item of competencies) await writeJson(`competencies/${item.id}.json`, item)
for (const item of evidenceTemplates) await writeJson(`evidence/${item.id}.json`, item)
for (const item of rubrics) await writeJson(`rubrics/${item.id}.json`, item)
for (const item of glossary) await writeJson(`glossary/${item.id}.json`, item)
for (const item of recommendations) await writeJson(`recommendations/${item.id}.json`, item)
for (const item of visualResources) await writeJson(`visual-resources/${item.id}.json`, item)

const entry = (directory: string, item: any) => ({ id: item.id, path: `${directory}/${item.id}.json` })
const manifest = {
  ...clone(baseManifest),
  packageVersion: version,
  id: packageId,
  title: 'MIYOTA 8215: comprender, desmontar, montar y diagnosticar',
  distribution: 'local-unsigned',
  editorialStatus: 'in-review',
  languages: ['es-ES'],
  dependencies: [
    { packageId: 'wplab.horology.functional-map', versionRange: '^0.5.0' },
    { packageId: 'wplab.horology.mechanical-foundations', versionRange: '^0.5.0' },
  ],
  requiredCapabilities: [
    'learning.scene-runtime@^1.0.0',
    'canonical-selectors-v1@^1.0.0',
    'reduced-motion@^1.0.0',
  ],
  movements: [{ manufacturer: 'MIYOTA', calibre: '8215', referenceId: fixtureId }],
  assets: [],
  minimumAppVersion: '0.10.0',
  entries: {
    curricula: [entry('curriculum', curriculum)],
    routes: [entry('routes', route)],
    modules: modulesOut.map((item) => entry('modules', item)),
    concepts: concepts.map((item) => entry('concepts', item)),
    blocks: blocks.map((item) => entry('blocks', item)),
    lessons: lessons.map((item) => entry('lessons', item)),
    activities: activities.map((item) => entry('activities', item)),
    scenes: scenes.map((item) => entry('scenes', item)),
    competencies: competencies.map((item) => entry('competencies', item)),
    evidenceTemplates: evidenceTemplates.map((item) => entry('evidence', item)),
    rubrics: rubrics.map((item) => entry('rubrics', item)),
    glossary: glossary.map((item) => entry('glossary', item)),
    sources: sources.map((item) => entry('sources', item)),
    recommendations: recommendations.map((item) => entry('recommendations', item)),
    visualResources: visualResources.map((item) => entry('visual-resources', item)),
  },
}
await writeJson('manifest.json', manifest)

console.log(JSON.stringify({
  packageId,
  modules: modulesOut.length,
  lessons: lessons.length,
  activities: activities.length,
  competencies: competencies.length,
  evidenceTemplates: evidenceTemplates.length,
  rubrics: rubrics.length,
  glossary: glossary.length,
  sources: sources.length,
  visualResources: visualResources.length,
}, null, 2))
