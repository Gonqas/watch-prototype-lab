import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { FOUNDATION_ROUTES } from './horology-corpus/catalog-foundations.mjs'
import { MECHANISM_ROUTES } from './horology-corpus/catalog-mechanisms.mjs'
import { CRAFT_ROUTES } from './horology-corpus/catalog-craft.mjs'
import { ADVANCED_ROUTES } from './horology-corpus/catalog-advanced.mjs'
import {
  CLASSICAL_EXISTING_LAB_OVERRIDES,
  CLASSICAL_EXTENSION_COUNTS,
  CLASSICAL_ROUTE_ADDITIONS_BY_ROUTE,
} from './horology-corpus/classical-extensions.mjs'
import {
  CLASSICAL_CORPUS_SOURCE_COUNTS,
  CLASSICAL_CORPUS_SOURCES,
} from './horology-corpus/classical-sources.mjs'

const root = join(process.cwd(), 'learning-content', 'watchmaking-encyclopedia')
const registryPath = join(process.cwd(), 'learning-content', 'source-registry', 'horology-student-resources.v1.json')
const version = '1.1.0'
const packageId = 'wplab.horology.watchmaking-encyclopedia'
const createdAt = '2026-08-09T00:00:00.000Z'
const labOverrides = new Map(CLASSICAL_EXISTING_LAB_OVERRIDES.map(({ route, slug, lab }) => [`${route}/${slug}`, lab]))
const routes = [...FOUNDATION_ROUTES, ...MECHANISM_ROUTES, ...CRAFT_ROUTES, ...ADVANCED_ROUTES].map((route) => ({
  ...route,
  lessons: [
    ...route.lessons.map((lesson) => ({
      ...lesson,
      lab: lesson.lab ?? labOverrides.get(`${route.key}/${lesson.slug}`),
    })),
    ...(CLASSICAL_ROUTE_ADDITIONS_BY_ROUTE[route.key] ?? []),
  ],
}))

const L = (es, en = es) => ({ es, en })
const unique = (values) => [...new Set(values)]
// Debe coincidir con el cómputo contractual de authoringValidation: la carga
// declarada nunca puede superar las unidades de lectura que valida la app.
const words = (value) => value.trim().split(/\s+/).filter(Boolean).length
const normalizeDifficulty = (value) => value === 'foundation' ? 'introductory' : value === 'mastery' ? 'advanced' : value
const normalizeEntryPolicy = (value) => value === 'open' ? 'start-from-zero' : value === 'diagnostic-optional' ? value : 'prerequisite-required'
const normalizeKnowledgeType = (value) => ['terminology', 'conceptual-causal', 'spatial', 'quantitative', 'procedural', 'diagnostic', 'epistemic'].includes(value)
  ? value
  : 'epistemic'
const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54)
const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const danielsChapters = [
  ['workshop-equipment', 'Workshop and Equipment', '26-48', ['taller', 'máquinas', 'organización']],
  ['hand-tools', 'Hand Tools', '49-72', ['herramientas', 'afilado', 'sujeción']],
  ['finishing-metals', 'Finishing Steel and Brass', '73-90', ['acero', 'latón', 'acabado', 'tratamiento térmico']],
  ['turning', 'Turning', '91-122', ['torneado', 'pivotes', 'concentricidad']],
  ['wheels-pinions', 'Wheels and Pinions', '123-167', ['ruedas', 'piñones', 'dentado']],
  ['small-components', 'Making Small Components', '168-194', ['tornillos', 'muelles', 'componentes pequeños']],
  ['jewelling', 'Jewelling', '195-213', ['rubíes', 'apoyos', 'juegos']],
  ['escapements', 'Escapements', '214-271', ['escapes', 'geometría', 'ajuste']],
  ['mainsprings', 'Mainsprings and Accessories', '272-297', ['muelle real', 'barrilete', 'cuerda']],
  ['movement-design', 'Movement Design', '298-335', ['arquitectura', 'trenes', 'diseño']],
  ['balance-spring', 'The Balance and Spring', '336-370', ['volante', 'espiral', 'cronometría']],
  ['casemaking', 'Casemaking', '371-386', ['caja', 'cristal', 'ajustes']],
  ['engine-turning', 'Engine-Turned Cases and Dials', '387-425', ['guilloché', 'esfera', 'decoración']],
]

function danielsSource([slug, chapter, page, topics]) {
  return {
    id: `source.private.daniels.${slug}`,
    authority: 'private-book-theory',
    usage: 'private-local',
    resource: {
      kind: 'book',
      title: `George Daniels · Watchmaking · ${chapter}`,
      locator: 'reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf',
      sha256: '78cb0b2931e256f42e6f2843c21be86e47762c0e53f755eef04c86c798e348b2',
    },
    authorOrManufacturer: 'George Daniels',
    sourceType: 'private-book',
    chapter,
    page,
    retrievedAt: '2026-08-09',
    privateUse: true,
    authorityTier: 'B',
    sourceClass: 'technical-reference',
    languages: ['en'],
    topics,
    pedagogicalUses: ['theory', 'worked-example', 'visual-reference'],
    availability: 'local',
    checkedAt: '2026-08-09',
    rights: 'user-supplied',
    offlineReady: true,
    validationPolicy: 'Usar para teoría mecánica general y construcción tradicional; revisar seguridad y no transferirlo como autoridad de un calibre real.',
    limitations: [
      'No es documentación MIYOTA, ETA, Seiko ni de otro calibre industrial concreto.',
      'Los procedimientos y sustancias de época requieren contraste con prácticas de seguridad actuales.',
    ],
    supportedClaim: `Teoría y métodos de construcción descritos en el capítulo ${chapter}; toda aplicación concreta conserva su alcance y revisión.`,
    derivedLayer: 'source',
  }
}

const additionalSources = [
  ...danielsChapters.map(danielsSource),
  {
    id: 'source.private.vba-uhrentechnik', authority: 'private-book-theory', usage: 'private-local',
    resource: { kind: 'dataset', title: 'VBA Uhrentechnik · corpus de cálculo relojero', locator: 'reference-library/originals/VBAUhrentechnik.zip', sha256: '67324954824f482958a0bf6e0fcd3598dd3567d0ad010299476192fb103ecf8c' },
    authorOrManufacturer: 'Horological calculation corpus', sourceType: 'private-book', retrievedAt: '2026-08-09', privateUse: true,
    authorityTier: 'B', sourceClass: 'technical-reference', languages: ['de', 'fr'], topics: ['cálculo', 'engranajes', 'espiral', 'tolerancias', 'fiabilidad'],
    pedagogicalUses: ['theory', 'worked-example'], availability: 'local', checkedAt: '2026-08-09', rights: 'user-supplied', offlineReady: true,
    validationPolicy: 'Rederivar, analizar unidades y contrastar cada fórmula antes de ejecutarla o publicarla como cálculo validado.',
    limitations: ['Contiene fórmulas y macros con errores o ambigüedades documentados.', 'Es banco de problemas, no una autoridad automática.'],
    supportedClaim: 'Corpus de problemas y modelos de ingeniería relojera que requieren verificación independiente.', derivedLayer: 'source',
  },
  {
    id: 'source.institutional.wostep.watchmaker', authority: 'technical-training', usage: 'external-linked',
    resource: { kind: 'pdf', title: 'WOSTEP Watchmaker I+II+III programme', locator: 'https://www.wostep.ch/sites/default/files/2025-12/P05-Watchmaker_brochure_en.pdf' },
    authorOrManufacturer: 'Fondation WOSTEP', sourceType: 'course-catalog', retrievedAt: '2026-08-09', authorityTier: 'B', sourceClass: 'institutional-training', languages: ['en'],
    topics: ['currículo', 'micromecánica', 'servicio', 'cronometría', 'fabricación'], pedagogicalUses: ['discovery'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false,
    validationPolicy: 'Usar como mapa de cobertura profesional; no como prueba de competencia ni como procedimiento detallado.',
    limitations: ['El folleto enumera dominios, no desarrolla la teoría ni sustituye formación práctica.'],
    supportedClaim: 'Mapa institucional de dominios que forman parte de una preparación relojera amplia.', derivedLayer: 'source',
  },
  {
    id: 'source.institutional.awci.standards', authority: 'technical-training', usage: 'external-linked',
    resource: { kind: 'pdf', title: 'AWCI Official Standards and Practices for Watchmakers', locator: 'https://www.awci.com/wp-content/uploads/2011/07/AWCI-standards-practicese.pdf' },
    authorOrManufacturer: 'American Watchmakers-Clockmakers Institute', sourceType: 'course-catalog', year: 2011, retrievedAt: '2026-08-09', authorityTier: 'B', sourceClass: 'institutional-training', languages: ['en'],
    topics: ['servicio', 'herramientas', 'cuarzo', 'estanqueidad', 'evaluación'], pedagogicalUses: ['discovery', 'theory'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false,
    validationPolicy: 'Usar como estándar de cobertura y conducta; contrastar procedimientos con fabricante y práctica vigente.',
    limitations: ['Documento de 2011; no representa por sí solo toda actualización posterior.'],
    supportedClaim: 'Distingue conocimiento, destreza y disposiciones y enumera ámbitos de servicio relojero.', derivedLayer: 'source',
  },
  {
    id: 'source.official.bipm.vim', authority: 'official-standards-body', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'BIPM · International Vocabulary of Metrology', locator: 'https://www.bipm.org/en/committees/jc/jcgm/publications' },
    authorOrManufacturer: 'BIPM/JCGM', sourceType: 'official-metrology-guidance', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en', 'fr'],
    topics: ['metrología', 'incertidumbre', 'trazabilidad'], pedagogicalUses: ['terminology', 'theory'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false,
    validationPolicy: 'Aplicar a terminología metrológica general; el método relojero concreto requiere fuentes adicionales.', limitations: ['No especifica procedimientos de servicio relojero.'],
    supportedClaim: 'Vocabulario y conceptos generales de metrología.', derivedLayer: 'source',
  },
  {
    id: 'source.official.nist.uncertainty', authority: 'official-standards-body', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'NIST · Uncertainty of Measurement', locator: 'https://www.nist.gov/pml/nist-technical-note-1297' },
    authorOrManufacturer: 'NIST', sourceType: 'official-metrology-guidance', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'],
    topics: ['incertidumbre', 'medición'], pedagogicalUses: ['theory', 'worked-example'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false,
    validationPolicy: 'Usar para expresar incertidumbre; adaptar cada presupuesto al método y espécimen declarados.', limitations: ['No fija tolerancias relojeras.'],
    supportedClaim: 'Principios de evaluación y expresión de incertidumbre de medida.', derivedLayer: 'source',
  },
  {
    id: 'source.official.miyota.2035', authority: 'official-miyota', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'MIYOTA 2035 · documentación oficial', locator: 'https://miyotamovement.com/product/2035/' }, authorOrManufacturer: 'MIYOTA', sourceType: 'official-miyota-documentation', calibre: '2035', revision: 'Consulta 2026-08-09', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'], topics: ['cuarzo', '2035'], pedagogicalUses: ['theory', 'procedure-contrast'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false, validationPolicy: 'Aplicar solo al 2035 y a la revisión consultada.', limitations: ['No transferir valores a otros calibres.'], supportedClaim: 'Identidad y especificaciones oficiales del calibre MIYOTA 2035.', derivedLayer: 'source',
  },
  {
    id: 'source.official.miyota.8215', authority: 'official-miyota', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'MIYOTA 8215 · documentación oficial', locator: 'https://miyotamovement.com/product/8215/' }, authorOrManufacturer: 'MIYOTA', sourceType: 'official-miyota-documentation', calibre: '8215', revision: 'Consulta 2026-08-09', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'], topics: ['mecánico', '8215'], pedagogicalUses: ['theory', 'procedure-contrast'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false, validationPolicy: 'Aplicar solo al 8215 y a la revisión consultada.', limitations: ['La documentación pública no define toda geometría ni todo procedimiento.'], supportedClaim: 'Identidad y especificaciones oficiales del calibre MIYOTA 8215.', derivedLayer: 'source',
  },
  {
    id: 'source.official.eta.6497', authority: 'manufacturer-primary', usage: 'official-linked',
    resource: { kind: 'pdf', title: 'ETA 6497-2 · Technical Communication', locator: 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/' }, authorOrManufacturer: 'ETA', sourceType: 'manufacturer-technical-documentation', movement: 'ETA 6497-2', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'], topics: ['mecánico', 'servicio', '6497'], pedagogicalUses: ['procedure-contrast', 'calibre-identification'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false, validationPolicy: 'Aplicar a la referencia y revisión citadas.', limitations: ['No generalizar a otros calibres.'], supportedClaim: 'Despiece e información técnica oficial del ETA 6497-2.', derivedLayer: 'source',
  },
  {
    id: 'source.official.eta.2824', authority: 'manufacturer-primary', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'ETA 2824-2 · ficha oficial', locator: 'https://portal.eta.ch/en/mecaline/2824-2-2824-2-5.html' }, authorOrManufacturer: 'ETA', sourceType: 'manufacturer-technical-documentation', movement: 'ETA 2824-2', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'], topics: ['automático', '2824'], pedagogicalUses: ['calibre-identification', 'procedure-contrast'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false, validationPolicy: 'Aplicar a la referencia oficial.', limitations: ['La ficha comercial no sustituye una comunicación técnica.'], supportedClaim: 'Funciones e identidad oficiales del ETA 2824-2.', derivedLayer: 'source',
  },
  {
    id: 'source.official.eta.7750', authority: 'manufacturer-primary', usage: 'official-linked',
    resource: { kind: 'pdf', title: 'ETA 7750 · Technical Communication', locator: 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/2180/' }, authorOrManufacturer: 'ETA', sourceType: 'manufacturer-technical-documentation', movement: 'ETA 7750', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'], topics: ['cronógrafo', '7750'], pedagogicalUses: ['procedure-contrast', 'calibre-identification'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false, validationPolicy: 'Aplicar a la referencia y revisión citadas.', limitations: ['No generalizar la arquitectura a todo cronógrafo.'], supportedClaim: 'Despiece e información técnica oficial del ETA 7750.', derivedLayer: 'source',
  },
  {
    id: 'source.official.seiko.6138', authority: 'manufacturer-primary', usage: 'official-linked',
    resource: { kind: 'pdf', title: 'Seiko 6138A · Technical Guide', locator: 'https://seikoserviceusa.com/uploads/datasheets/6138A.pdf' }, authorOrManufacturer: 'Seiko', sourceType: 'manufacturer-technical-documentation', movement: 'Seiko 6138A', retrievedAt: '2026-08-09', authorityTier: 'A', sourceClass: 'official-primary', languages: ['en'], topics: ['cronógrafo', 'automático'], pedagogicalUses: ['procedure-contrast', 'calibre-identification'], availability: 'online', checkedAt: '2026-08-09', rights: 'link-only', offlineReady: false, validationPolicy: 'Aplicar al 6138A documentado.', limitations: ['Documento histórico; comprobar revisión y condición de la unidad.'], supportedClaim: 'Arquitectura y servicio documentados del Seiko 6138A.', derivedLayer: 'source',
  },
  {
    id: 'source.encyclopedia.original-synthesis', authority: 'original-educational', usage: 'user-created',
    resource: { kind: 'note', title: 'Síntesis educativa original de Watchmaking Academy' }, authorOrManufacturer: 'Watch Prototype Lab', sourceType: 'original-educational-content', retrievedAt: '2026-08-09', authorityTier: 'C', sourceClass: 'educational-explainer', languages: ['es'], topics: ['síntesis', 'pedagogía'], pedagogicalUses: ['theory', 'worked-example'], availability: 'local', checkedAt: '2026-08-09', rights: 'user-supplied', offlineReady: true, validationPolicy: 'No usar como sustituto de fuente primaria; enlaza y explica las fuentes declaradas.', limitations: ['Es explicación educativa original, no documentación de fabricante.'], supportedClaim: 'Organiza el conocimiento verificado sin elevar la autoridad de las fuentes.', derivedLayer: 'educational',
  },
]

const externalRegistry = JSON.parse(await readFile(registryPath, 'utf8'))
const sources = [...additionalSources, ...CLASSICAL_CORPUS_SOURCES, ...externalRegistry.entries]
const sourceById = new Map(sources.map((source) => [source.id, source]))

const EDITORIAL_ARCHETYPES = {
  history: {
    openingHeading: 'Problema y contexto histórico',
    conceptHeading: 'Vocabulario para leer el cambio',
    sequenceHeading: 'Cambio, continuidad y consecuencia',
    quantityHeading: 'Escalas y evidencia comparables',
    caseHeading: 'Comparación histórica guiada',
    failureHeading: 'Anacronismos y atajos que conviene evitar',
    opening: (lesson) => `La pregunta histórica no se responde con una cronología aislada. En **${lesson.title}** hay que reconocer qué problema se intentaba resolver, qué solución estaba disponible y qué limitación seguía abierta.`,
    sequenceBridge: (lesson) => `Lee la secuencia de **${lesson.title}** como una cadena de decisiones y consecuencias. Una etapa posterior no convierte automáticamente en errónea a la anterior: compara función, contexto y evidencia antes de hablar de progreso.`,
    quantityBridge: (lesson) => `Las cifras de épocas, instrumentos o escalas distintas solo se comparan después de normalizar unidad, definición y condiciones. En **${lesson.title}**, una fecha sitúa un documento; no demuestra por sí sola prioridad, difusión ni superioridad técnica.`,
    caseBridge: (lesson) => `Resuelve el caso de **${lesson.title}** separando hecho documentado, interpretación y pregunta aún abierta. La explicación debe mostrar por qué una solución fue razonable en su contexto y qué nueva exigencia impulsó el paso siguiente.`,
    close: (lesson) => `Puedes continuar cuando expliques **${lesson.title}** sin convertir la historia en una lista de inventos y cuando relaciones cada cambio con un problema, una fuente y una consecuencia comprobable.`,
  },
  mechanism: {
    openingHeading: 'Pregunta de funcionamiento',
    conceptHeading: 'Piezas e ideas clave',
    sequenceHeading: 'Cadena de funcionamiento',
    quantityHeading: 'Magnitudes que cambian el resultado',
    caseHeading: 'Mecanismo aplicado a un caso',
    failureHeading: 'Confusiones mecánicas que debes detectar',
    opening: (lesson) => `Para comprender **${lesson.title}**, sigue energía, señal o movimiento desde una entrada hasta una salida observable. Nombrar piezas no basta: cada enlace debe indicar quién actúa, quién recibe el efecto y mediante qué contacto o relación.`,
    sequenceBridge: (lesson) => `Recorre la cadena de **${lesson.title}** hacia delante para predecir una salida y hacia atrás para buscar la primera función ausente. Si dos causas explican el mismo síntoma, conserva ambas hasta encontrar una observación que las separe.`,
    quantityBridge: (lesson) => `En **${lesson.title}**, una magnitud solo sirve cuando conserva unidad, referencia, condiciones y procedencia. Distingue dato nominal, medida, cálculo y estimación antes de usar una cifra para explicar el mecanismo.`,
    caseBridge: (lesson) => `Dibuja primero las relaciones del caso de **${lesson.title}**. Después contrasta cada enlace con la explicación y las fuentes; una animación o una semejanza visual no sustituyen una relación documentada.`,
    close: (lesson) => `Puedes continuar cuando reconstruyas el mecanismo de **${lesson.title}**, predigas qué cambia si se interrumpe un enlace y señales qué parte procede de una fuente y cuál sigue siendo una inferencia.`,
  },
  procedure: {
    openingHeading: 'Resultado buscado y condición segura',
    conceptHeading: 'Vocabulario de banco',
    sequenceHeading: 'Secuencia, controles y puntos de parada',
    quantityHeading: 'Condiciones y criterios de aceptación',
    caseHeading: 'Ejemplo de trabajo razonado',
    failureHeading: 'Errores de proceso y señales de parada',
    opening: (lesson) => `En **${lesson.title}**, el orden importa porque cada paso recibe una pieza y un estado concretos. Antes de actuar define el resultado buscado, la condición segura de entrada y la comprobación que autoriza a continuar.`,
    sequenceBridge: (lesson) => `La secuencia de **${lesson.title}** no es una receta universal. Comprueba en cada transición qué condición debe cumplirse, qué dato procede del documento aplicable y cuándo es obligatorio detenerse o pedir revisión.`,
    quantityBridge: (lesson) => `Toda medida o ajuste de **${lesson.title}** conserva instrumento, unidad, resolución, condiciones y criterio de aceptación. Una cifra histórica o genérica no se traslada a una pieza concreta sin verificar referencia y vigencia.`,
    caseBridge: (lesson) => `En el caso de **${lesson.title}**, explica primero qué observarías antes de tocar la pieza, qué acción mínima realizarías y qué comprobarías después. Si falta una instrucción segura o específica, la decisión correcta es detener el procedimiento.`,
    close: (lesson) => `Puedes continuar cuando describas **${lesson.title}** con estado inicial, pasos, controles, condición de parada y restauración, sin confundir una práctica digital con destreza de banco.`,
  },
  diagnosis: {
    openingHeading: 'Síntoma, observación y pregunta diagnóstica',
    conceptHeading: 'Vocabulario para formular hipótesis',
    sequenceHeading: 'De la observación a la prueba discriminante',
    quantityHeading: 'Medidas, referencias y umbrales',
    caseHeading: 'Caso diagnóstico razonado',
    failureHeading: 'Sesgos y conclusiones prematuras',
    opening: (lesson) => `Diagnosticar **${lesson.title}** significa pasar de una observación a varias hipótesis y elegir una prueba que pueda separarlas. Un síntoma no identifica por sí solo una causa.`,
    sequenceBridge: (lesson) => `En **${lesson.title}**, recorre la secuencia sin saltar de síntoma a avería. Cada transición debe reducir la incertidumbre: si una prueba no puede cambiar la conclusión, no es una prueba diagnóstica útil.`,
    quantityBridge: (lesson) => `Compara las medidas de **${lesson.title}** con una referencia declarada y conserva incertidumbre, condiciones y estado de la unidad. Un valor aislado no confirma una causa si también es compatible con hipótesis rivales.`,
    caseBridge: (lesson) => `Para resolver el caso de **${lesson.title}**, escribe al menos dos hipótesis, predice qué observarías bajo cada una y elige la comprobación menos invasiva que produzca resultados distintos.`,
    close: (lesson) => `Puedes continuar cuando separes síntoma, hipótesis, prueba y conclusión en **${lesson.title}**, y cuando puedas explicar qué resultado te haría cambiar de opinión.`,
  },
  manufacturing: {
    openingHeading: 'Característica que se quiere fabricar',
    conceptHeading: 'Vocabulario de forma, material y acabado',
    sequenceHeading: 'Proceso de fabricación y verificaciones',
    quantityHeading: 'Dimensiones, tolerancias y estado superficial',
    caseHeading: 'Decisión de fabricación razonada',
    failureHeading: 'Defectos, causas probables y prevención',
    opening: (lesson) => `En **${lesson.title}**, la forma final depende de material, referencias de medida, orden de operaciones y acabado. Empieza por definir qué característica debe producirse y cómo se comprobará sin dañarla.`,
    sequenceBridge: (lesson) => `Lee el proceso de **${lesson.title}** como una acumulación controlada de cambios. Cada operación debe conservar referencias suficientes para la siguiente y dejar una comprobación antes de que un error quede oculto.`,
    quantityBridge: (lesson) => `Las dimensiones de **${lesson.title}** no se inventan ni se copian de una imagen. Distingue nominal, tolerancia, sobremedida de proceso, resultado medido e incertidumbre; el acabado también forma parte de la función cuando afecta contacto o ajuste.`,
    caseBridge: (lesson) => `En el caso de **${lesson.title}**, compara al menos dos rutas de proceso y justifica la elegida mediante material, accesibilidad, riesgo, medición y posibilidad de corrección.`,
    close: (lesson) => `Puedes continuar cuando relaciones cada operación de **${lesson.title}** con una característica verificable, una referencia de medida y un riesgo que deba controlarse.`,
  },
  design: {
    openingHeading: 'Decisión de diseño y necesidad',
    conceptHeading: 'Vocabulario para comparar alternativas',
    sequenceHeading: 'De requisitos a una arquitectura comprobable',
    quantityHeading: 'Presupuestos, restricciones y márgenes',
    caseHeading: 'Comparación de alternativas',
    failureHeading: 'Decisiones frágiles y supuestos ocultos',
    opening: (lesson) => `Diseñar **${lesson.title}** exige transformar una necesidad en requisitos, alternativas y pruebas. La primera solución plausible no es todavía una decisión: falta compararla con criterios y límites explícitos.`,
    sequenceBridge: (lesson) => `La secuencia de **${lesson.title}** debe conservar la razón de cada decisión. Si un requisito cambia, vuelve al primer enlace afectado en lugar de retocar únicamente la forma final.`,
    quantityBridge: (lesson) => `En **${lesson.title}**, cada presupuesto —espacio, energía, par, coste, fabricación o servicio— declara entradas, margen y método. Una cifra estimada sirve para explorar, pero no se convierte en requisito validado.`,
    caseBridge: (lesson) => `Resuelve el caso de **${lesson.title}** con una tabla breve: alternativa, beneficio, coste, riesgo, dato que falta y prueba prevista. Conserva también la opción descartada y la razón de descarte.`,
    close: (lesson) => `Puedes continuar cuando justifiques **${lesson.title}** mediante requisitos, alternativas, compromisos y una prueba futura, sin presentar un supuesto como dato confirmado.`,
  },
}

function editorialArchetype(route, lesson) {
  if (lesson.editorialArchetype && EDITORIAL_ARCHETYPES[lesson.editorialArchetype]) return lesson.editorialArchetype
  const diagnosticText = `${lesson.slug} ${lesson.title} ${lesson.question}`.toLocaleLowerCase('es')
  if (/diagn[oó]st|s[ií]ntoma|inspecci[oó]n|prueba|control final|aver[ií]a/.test(diagnosticText)) return 'diagnosis'
  if (route.key === 'history-language') return 'history'
  if (route.key === 'atlas-restoration-design') return 'design'
  if (['micromechanics', 'dials-hands-finishing'].includes(route.key)) return 'manufacturing'
  if (['workshop-tools-materials', 'service-tribology', 'cases-water'].includes(route.key)) return 'procedure'
  if (route.key === 'math-physics-metrology') return 'diagnosis'
  return 'mechanism'
}

function conceptSemanticProfile(route, lesson, concept) {
  const term = `**${concept.term}**`
  const authoredPurpose = concept.why?.trim() ? ` ${concept.why.trim()}` : ''
  const declaredKnowledgeType = concept.knowledgeType ?? lesson.knowledgeType
  if (!declaredKnowledgeType) {
    const archetype = editorialArchetype(route, lesson)
    const profiles = {
      history: {
        application: `Sitúa ${term} como cambio, continuidad o convención dentro del caso histórico y explica qué problema permitió resolver y qué limitación dejó abierta.${authoredPurpose}`,
        check: `Comprueba ${concept.term} con una fuente, un contexto y una consecuencia; una fecha o una semejanza aislada no demuestra prioridad ni equivalencia.`,
      },
      mechanism: {
        application: `Relaciona ${term} con una entrada, una interfaz y una salida observables dentro del mecanismo, y predice qué cambia si ese enlace se interrumpe.${authoredPurpose}`,
        check: `Para comprobar ${concept.term}, identifica la energía, el movimiento o la señal que cruza la interfaz; la proximidad visual no demuestra una relación funcional.`,
      },
      procedure: {
        application: `Vincula ${term} con un estado inicial, una acción controlada, una comprobación y el punto de parada aplicable al procedimiento.${authoredPurpose}`,
        check: `Explicar ${concept.term} exige indicar qué autoriza a continuar y qué obliga a detenerse; una lista de pasos no demuestra un proceso seguro.`,
      },
      diagnosis: {
        application: `Usa ${term} para separar observación, hipótesis y prueba discriminante, y declara qué resultado apoyaría o debilitaría cada explicación.${authoredPurpose}`,
        check: `Una aplicación válida de ${concept.term} debe poder cambiar la conclusión; si todos los resultados confirman lo mismo, la prueba no discrimina.`,
      },
      manufacturing: {
        application: `Relaciona ${term} con una característica que se quiere producir, la operación que la modifica y la verificación que decide si puede continuarse.${authoredPurpose}`,
        check: `Comprueba ${concept.term} mediante una referencia, una medida o un criterio observable; el parecido visual no acredita forma, ajuste ni acabado.`,
      },
      design: {
        application: `Utiliza ${term} para conectar un requisito con una alternativa, un compromiso y una prueba que permita revisar la decisión de diseño.${authoredPurpose}`,
        check: `Justificar ${concept.term} exige conservar la alternativa descartada, el dato que falta y el resultado que obligaría a cambiar la decisión.`,
      },
    }
    return profiles[archetype]
  }

  const knowledgeType = normalizeKnowledgeType(declaredKnowledgeType)
  const definition = concept.definition.toLocaleLowerCase('es')

  if (/(cociente|proporci[oó]n|relaci[oó]n entre|n[uú]mero de dientes|frecuencia|amplitud|tolerancia|incertidumbre|medici[oó]n)/u.test(definition)) {
    return {
      application: `Escribe qué magnitudes compara ${term}, con qué unidad o referencia y qué supuesto relaciona el estado inicial de la secuencia con su resultado final.${authoredPurpose}`,
      check: `Comprueba el resultado cambiando una entrada cada vez; una cifra sin unidad, referencia ni supuesto declarado no explica ${concept.term}.`,
    }
  }
  if (/(secuencia|cadena|recorrido|serie de etapas|orden de)/u.test(definition)) {
    return {
      application: `Reconstruye ${term} desde el estado inicial de la secuencia hasta su resultado final y nombra la interfaz que permite pasar de una etapa a la siguiente.${authoredPurpose}`,
      check: `Si puedes permutar dos etapas sin que cambie tu explicación, todavía no has justificado el orden de ${concept.term}.`,
    }
  }
  if (/(recibe|entrega|transmite|transforma|acciona|impulsa|bloquea|libera|conecta)/u.test(definition)) {
    return {
      application: `Sigue en la secuencia qué recibe ${term}, por qué contacto o unión lo recibe y qué deja disponible para la etapa posterior.${authoredPurpose}`,
      check: `La comprobación debe nombrar entrada, interfaz y salida de ${concept.term}; ver dos piezas próximas no demuestra que intercambien movimiento, fuerza o información.`,
    }
  }
  if (/(superficie|posici[oó]n|distancia|apoyo|cojinete|eje|pivote|contacto|hueco|altura|di[aá]metro|forma)/u.test(definition) || knowledgeType === 'spatial') {
    return {
      application: `Localiza ${term} por la geometría, los apoyos y los contactos que exige su definición, y comprueba dónde interviene en la secuencia completa.${authoredPurpose}`,
      check: `Distingue contacto funcional, apoyo y simple cercanía antes de atribuir a ${concept.term} una relación mecánica.`,
    }
  }
  if (/(s[ií]ntoma|hip[oó]tesis|diagn[oó]st|prueba|indicio|desviaci[oó]n)/u.test(definition) || knowledgeType === 'diagnostic') {
    return {
      application: `Usa ${term} para convertir una observación de la lección en una predicción que pueda confirmarse o refutarse, sin adelantar el diagnóstico.${authoredPurpose}`,
      check: `Una aplicación válida de ${concept.term} debe indicar qué resultado apoyaría la hipótesis y cuál la debilitaría.`,
    }
  }
  if (/(procedimiento|operaci[oó]n|acci[oó]n|m[eé]todo|preparaci[oó]n|retirar|montar|ajustar)/u.test(definition) || knowledgeType === 'procedural') {
    return {
      application: `Vincula ${term} con una condición inicial, una acción controlada, una comprobación y un punto de parada aplicables al caso de la lección.${authoredPurpose}`,
      check: `Explicar ${concept.term} exige decir cuándo no debe continuarse; enumerar pasos sin criterio de aceptación no define un procedimiento seguro.`,
    }
  }
  if (knowledgeType === 'terminology') {
    return {
      application: `Usa ${term} solo cuando la pieza, el estado o la relación observada cumpla la definición; después enlázalo con el caso de «${lesson.title}».${authoredPurpose}`,
      check: `Reconocer la palabra ${concept.term} no basta: señala la evidencia que permite aplicarla y el término vecino con el que podría confundirse.`,
    }
  }
  if (knowledgeType === 'epistemic') {
    return {
      application: `Aplica ${term} para separar en esta lección lo documentado, lo observado, lo inferido y lo que sigue abierto.${authoredPurpose}`,
      check: `Cada uso de ${concept.term} debe conservar fuente, alcance y grado de confianza; una explicación plausible no se convierte por ello en dato oficial.`,
    }
  }
  const fallback = {
    application: `Relaciona ${term} con el paso concreto que une el estado inicial de la secuencia con su resultado final, y explica qué cambia cuando esa relación se interrumpe.${authoredPurpose}`,
    check: `Para comprobar ${concept.term}, identifica una entrada, una interfaz y un resultado observable; una lista de componentes no demuestra causalidad.`,
  }
  if (!knowledgeType) throw new Error(`${route.id}/${lesson.slug}/${concept.term}: falta knowledgeType con semántica segura.`)
  return fallback
}

function semanticDefinitionAnchor(definition) {
  const normalized = definition.trim().replace(/\s+/gu, ' ').replace(/[.!?]+$/u, '')
  const firstClause = normalized.split(/[,;:]/u)[0].trim()
  const clauseWords = firstClause.split(' ')
  return `${clauseWords.slice(0, 16).join(' ')}${clauseWords.length > 16 ? '…' : ''}`
}

function safeConceptRelation(route, lesson, concept) {
  const englishTerm = concept.en?.trim()
  if (!englishTerm) throw new Error(`${route.id}/${lesson.slug}/${concept.term}: falta término inglés para contextualizar el vocabulario.`)
  const englishContext = slugify(englishTerm) === slugify(concept.term)
    ? ''
    : ` En documentación inglesa, contrasta **${concept.term}** con **${englishTerm}**.`
  const context = `En «${lesson.title}», **propiedad que debes comprobar:** ${semanticDefinitionAnchor(concept.definition)}.${englishContext}`
  const relation = concept.relationExplanation?.trim() || conceptSemanticProfile(route, lesson, concept).application
  return `${context} ${relation}`
}

function renderConcepts(route, lesson) {
  return lesson.concepts.map((concept, index) => {
    const profile = conceptSemanticProfile(route, lesson, concept)
    const technicalContrast = concept.technical
      ? `En lenguaje técnico: ${concept.technical}`
      : profile.check
    if (!technicalContrast) throw new Error(`${route.id}/${lesson.slug}/${concept.term}: falta contraste técnico o knowledgeType seguro.`)
    return `### ${index + 1}. ${concept.term}\n\n**Definición:** ${concept.definition}\n\n**Aplicación en esta lección:** ${safeConceptRelation(route, lesson, concept)} ${technicalContrast}`
  }).join('\n\n')
}

function semanticTransition(lesson, archetype, step, nextStep, index) {
  if (lesson.sequenceNotes?.[index]?.trim()) return lesson.sequenceNotes[index].trim()
  if (!nextStep) {
    return `Al llegar a **${step}**, compara el resultado con la pregunta inicial de «${lesson.title}» y anota qué evidencia permite dar la secuencia por completa.`
  }
  const clean = (value) => value.trim().replace(/[.!?]+$/u, '')
  const transition = `**${clean(step).charAt(0).toLocaleUpperCase('es')}${clean(step).slice(1)} → ${clean(nextStep)}.**`
  if (archetype === 'mechanism') {
    const next = nextStep.toLocaleLowerCase('es')
    if (/(pila|muelle|barrilete|energ[ií]|carga|dar cuerda)/u.test(next)) {
      return `${transition} La primera etapa establece la condición desde la que la siguiente puede almacenar o entregar energía. Comprueba qué cambia realmente y evita atribuir energía a una pieza que solo la transmite.`
    }
    if (/(relaci[oó]n|reduce|reducir|multiplica|escala|divide|desmultiplica|aumenta par|transforma velocidad)/u.test(next)) {
      return `${transition} El giro entra en la etapa siguiente con una relación concreta. Declara qué magnitud cambia, qué se conserva aproximadamente y qué pérdidas quedan fuera del cálculo ideal.`
    }
    if (/(mueve|mover|gira|engrana|transmite|transmitir|impulsa|acciona|rota|avanza|alimentar|guiar|entra|sale|progresa|recibe par|indicar horas|contar e indicar)/u.test(next)) {
      return `${transition} El movimiento cruza una interfaz mecánica entre ambas etapas. Identifica el contacto y comprueba el sentido de giro antes de continuar la cadena.`
    }
    if (/(escape|bloque|libera|cuenta|dosifica|paleta|[aá]ncora)/u.test(next)) {
      return `${transition} La segunda etapa puede bloquear, liberar o dosificar el avance gracias al estado recibido. Distingue la energía transferida del ritmo que esta etapa ayuda a establecer.`
    }
    if (/(oscila|volante|espiral|reson|frecuencia|referencia|ritmo)/u.test(next)) {
      return `${transition} La acción transferida debe relacionarse ahora con una referencia repetitiva. Señala qué mantiene la oscilación y qué parte fija o modifica su ritmo.`
    }
    if (/(circuito|control|bobina|estator|rotor paso|señal|pulso|electr)/u.test(next)) {
      return `${transition} La salida de la primera etapa se convierte en una entrada eléctrica o electromecánica. Separa señal, conversión de energía y movimiento resultante.`
    }
    if (/(minuter[ií]|indicaci[oó]|aguja|muestra|lectura|esfera)/u.test(next)) {
      return `${transition} La etapa siguiente transforma el movimiento acumulado en una lectura. Comprueba la relación temporal y cualquier fricción o acoplamiento intermedio antes de atribuir un error a la indicación.`
    }
    if (/(apoyo|puente|platina|rub[ií]|cojinete|pivote|sujeta|retiene)/u.test(next)) {
      return `${transition} Una pieza o conjunto queda en la condición geométrica que la etapa siguiente debe sostener. Verifica apoyo, libertad y alineación; la proximidad visual no basta.`
    }
    if (/(conecta|desconecta|acopla|desacopla|embrague|frena|freno|guardia|desenganche|despeje)/u.test(next)) {
      return `${transition} Cambia la condición que gobierna el acoplamiento. Indica qué superficies quedan unidas, libres o bloqueadas y qué señal permite distinguir cada estado.`
    }
    if (/(lee|detectar|detecta|decidir|decide|seleccionar|selecciona|clasificar|clasifica|comparar|compara|medir|mide|estima|verificar|verifica|comprobar|muestrea|observar|observa|validar|valida|contador|conteo|determina|obtener|identificar|calcular|probar|anotar|supervisar)/u.test(next)) {
      return `${transition} El resultado observable aporta un dato, una posición o un estado que debe interpretarse. Explica qué variable se lee y qué decisión permite tomar.`
    }
    if (/(corregir|corrige|centrar|centra|asentar|asienta|fijar|fija|establecer|establece|modificar|modifica|cambiar|cambia|alterar|altera|ajustar|ajusta|deslizar|desplaza|actualizar|actualiza|aproximar|aproxima|vencer|vence|perturba|añade|difieren|se aplica|conserva estado|estabiliza)/u.test(next)) {
      return `${transition} La segunda etapa actúa sobre una desviación o condición recibida. Declara la dirección del cambio, el resultado esperado y la observación que impediría seguir ajustando.`
    }
    if (/(cae|ca[ií]da|golpea|martillo|disparo|retorna|cero|indexa|salta|saltar|vibrar|repetir|integra|cadencia|alcanza fin|clavija entra)/u.test(next)) {
      return `${transition} El primer evento prepara el instante o recorrido del siguiente. Comprueba qué lo dispara, qué limita su movimiento y cómo se reconoce el final del evento.`
    }
    if (/(captar|entrada|entregar|salida|introducir|convertir|transferir|rectificar|produce|deforma|repone|desestabilizar|formar|contener|cerrar tapa|respirar|invierte movimiento)/u.test(next)) {
      return `${transition} Cambia la forma en que se transporta energía, movimiento o información. Nombra la entrada, la conversión y la salida sin suponer que el proceso es ideal.`
    }
    return `${transition} Examina la interfaz: indica qué cambia al completar la primera etapa y qué observación demuestra que la segunda ya puede comenzar.`
  }
  const frames = {
    history: `${transition} Esta transición crea el contexto que hace posible o necesario el segundo cambio; sin el primero, la etapa siguiente respondería a otro problema histórico.`,
    procedure: `${transition} La primera etapa debe dejar una condición comprobable antes de iniciar la segunda; avanzar sin ella rompe el control del proceso.`,
    diagnosis: `${transition} El primer resultado debe aportar evidencia para decidir el paso siguiente; si no diferencia las hipótesis, continuar carece de fundamento.`,
    manufacturing: `${transition} La característica obtenida o conservada se convierte en entrada verificable de la segunda operación; una desviación no corregida se propaga.`,
    design: `${transition} La primera decisión fija una restricción o dato de entrada para la segunda; cambiarla obliga a reabrir todo lo que dependa de ella.`,
  }
  const transitionText = frames[archetype]
  if (!transitionText) throw new Error(`${lesson.slug}: falta una transición explícita y no existe un arquetipo semántico seguro.`)
  return transitionText
}

function renderSequence(lesson, archetype) {
  return lesson.sequence.map((step, index) => {
    const nextStep = lesson.sequence[index + 1]
    return `${index + 1}. ${semanticTransition(lesson, archetype, step, nextStep, index)}`
  }).join('\n')
}

function renderQuantities(lesson) {
  return lesson.quantities.map((quantity) => `- ${quantity}`).join('\n')
}

function renderFailures(lesson) {
  return lesson.failures.map((failure, index) => `${index + 1}. ${failure}`).join('\n')
}

function practiceInstructions(lesson, archetype) {
  const instructions = {
    history: `Antes de practicar «${lesson.title}», escribe qué problema existía, qué solución apareció y qué limitación permaneció. Después contrasta la cronología con las fuentes y aplica el mismo criterio a otro periodo o instrumento.`,
    mechanism: `Antes de practicar «${lesson.title}», dibuja entrada, relaciones y salida sin mirar la secuencia. Después localiza el primer enlace omitido, corrígelo y predice una interrupción distinta.`,
    procedure: `Antes de practicar «${lesson.title}», anota estado inicial, resultado esperado, controles y condición de parada. Después compara tu plan con la secuencia y transfiérelo solo a un caso cuya documentación sea aplicable.`,
    diagnosis: `Antes de practicar «${lesson.title}», separa observación, dos hipótesis y una prueba discriminante. Después comprueba si el resultado elegido podría cambiar tu conclusión y aplica el método a otro síntoma.`,
    manufacturing: `Antes de practicar «${lesson.title}», define característica, referencia de medida, operación y control. Después compara otra ruta de proceso y explica qué riesgo o dato decide entre ambas.`,
    design: `Antes de practicar «${lesson.title}», convierte la necesidad en requisitos y compara dos alternativas. Después registra el compromiso, el dato pendiente y la prueba que cerraría la decisión.`,
  }
  const instruction = instructions[archetype]
  if (!instruction) throw new Error(`${lesson.slug}: falta instrucción de práctica para ${archetype}.`)
  return `${instruction} La respuesta final separa teoría, dato, observación, cálculo e incertidumbre. La actividad comprueba razonamiento; la destreza manual, la seguridad de banco y la validez física requieren práctica y revisión específicas.`
}

function composeTheory(route, lesson) {
  const archetype = editorialArchetype(route, lesson)
  const editorial = EDITORIAL_ARCHETYPES[archetype]
  const conceptNames = lesson.concepts.map(({ term }) => term).join(', ')
  const sourceNames = lesson.sourceIds.map((id) => sourceById.get(id)?.resource.title ?? id).join('; ')
  const text = `# ${lesson.title}

## ${editorial.openingHeading}

${lesson.question} ${lesson.core}

${editorial.opening(lesson)} Esta lección diferencia explicación general, evidencia disponible y aplicación a una pieza, calibre o proceso particular. Una semejanza visual puede orientar, pero no autoriza una dimensión, lubricante, tolerancia ni orden de intervención. Los límites detallados del material visual se consultan en su ficha técnica.

## ${editorial.conceptHeading}

${renderConcepts(route, lesson)}

## ${editorial.sequenceHeading}

${renderSequence(lesson, archetype)}

${editorial.sequenceBridge(lesson)}

## ${editorial.quantityHeading}

${renderQuantities(lesson)}

${editorial.quantityBridge(lesson)} ${lesson.quantitativeNote ?? `La comparación se hace por sensibilidad: pregunta qué variable domina el resultado, cuál puede controlarse y cuál permanece desconocida. Más decimales no aportan más verdad si el método no puede resolverlos.`}

## ${editorial.caseHeading}

${lesson.caseStudy}

${editorial.caseBridge(lesson)} La respuesta final incluye una afirmación apoyada, una inferencia explícita y un desconocido. Si depende de una operación física no realizada, describe la comprobación pendiente en vez de sustituirla por confianza personal.

## ${editorial.failureHeading}

${renderFailures(lesson)}

El error central de esta unidad se expresa así: **«${lesson.misconception.expression}»**. Es incorrecto porque ${lesson.misconception.correction} La reparación no consiste en memorizar la frase correcta: exige explicar qué observación cambiaría entre el modelo erróneo y el correcto.

## Fuentes y alcance

Fuentes de trabajo para **${lesson.title}**: ${sourceNames}. ${lesson.sourcePolicy ?? `La fuente primaria gobierna identidad, dato o procedimiento de su referencia. Las fuentes secundarias aportan explicación, imágenes y casos; las bases de datos ayudan a descubrir. Si existe contradicción, se conserva y se busca mayor autoridad en lugar de promediar.`}

## Práctica deliberada y transferencia

${lesson.transfer}

${practiceInstructions(lesson, archetype)}

## Comprueba antes de continuar

${editorial.close(lesson)} También debes poder definir ${conceptNames}, justificar qué magnitudes importan, reconocer el error central y señalar qué fuente o prueba faltaría para transferir la conclusión a un reloj físico.`
  if (words(text) < 760) throw new Error(`${route.id}/${lesson.slug} solo contiene ${words(text)} palabras.`)
  return text
}

function readinessCriteria(route, lesson) {
  const conceptNames = lesson.concepts.map(({ term }) => term).join(', ')
  const archetype = editorialArchetype(route, lesson)
  const specific = {
    history: `Relaciono cada cambio de «${lesson.title}» con el problema que intentaba resolver y con una fuente.`,
    mechanism: `Sigo «${lesson.title}» desde ${lesson.sequence[0]} hasta ${lesson.sequence.at(-1)} y explico cada enlace.`,
    procedure: `Describo «${lesson.title}» con condición inicial, controles, punto de parada y comprobación final.`,
    diagnosis: `Separo en «${lesson.title}» observación, hipótesis, prueba discriminante y conclusión.`,
    manufacturing: `Relaciono las operaciones de «${lesson.title}» con características medibles y riesgos de proceso.`,
    design: `Comparo alternativas de «${lesson.title}» mediante requisitos, compromisos y pruebas previstas.`,
  }[archetype]
  return [
    L(`Defino con mis palabras: ${conceptNames}.`),
    L(specific),
    L(`Distingo qué parte de «${lesson.title}» es un dato, una inferencia y una cuestión todavía abierta.`),
    L(`Aplico el criterio a esta variante: ${lesson.transfer}`),
  ]
}

function makeClaim(id, lesson) {
  const embeddedSources = lesson.sourceIds.slice(0, 3).map((sourceId) => {
    const source = sourceById.get(sourceId)
    if (!source) throw new Error(`Fuente no declarada: ${sourceId}`)
    return source
  })
  return {
    id: `claim.encyclopedia.${id}`, claimType: 'source',
    claim: lesson.core, classification: 'original-explanation',
    method: 'Síntesis causal contrastada con las fuentes declaradas y con límites de aplicación explícitos.',
    fidelity: { geometry: 'G0', kinematics: 'K0', physics: 'P0', limitations: ['Explicación textual; no valida geometría, cinemática, materiales, tolerancias ni física de una unidad concreta.'] },
    reliability: embeddedSources.some(({ authorityTier }) => authorityTier === 'A') ? 'high' : 'medium',
    inputFingerprint: `curriculum:${id}@${version}`, recordedAt: createdAt, methodVersion: 'encyclopedia-synthesis@1.0.0',
    sources: embeddedSources, sourceStatement: lesson.sourceStatement ?? `Las fuentes citadas respaldan el vocabulario, el mecanismo o el contexto usados en ${lesson.title}; las inferencias educativas permanecen separadas.`,
  }
}

const records = {
  curricula: [], routes: [], modules: [], concepts: [], misconceptions: [], blocks: [], lessons: [], activities: [], scenes: [], competencies: [], evidenceTemplates: [], rubrics: [], glossary: [], sources, recommendations: [], visualResources: [],
}

for (const route of routes) {
  const moduleIds = []
  const competencyIds = []
  const routeSourceIds = unique(route.lessons.flatMap(({ sourceIds }) => sourceIds))
  let previousLessonConceptIds = []
  let previousCompetencyId

  for (const [lessonIndex, lesson] of route.lessons.entries()) {
    const lessonPrerequisiteConceptIds = [...previousLessonConceptIds]
    const prefix = `encyclopedia.${route.key}.${lesson.slug}`
    const moduleId = `module.${prefix}`
    const lessonId = `lesson.${prefix}`
    const blockId = `block.${prefix}`
    const activityId = `activity.${prefix}`
    const sceneId = `scene.${prefix}`
    const competencyId = `competency.${prefix}`
    const evidenceId = `evidence.${prefix}`
    const rubricId = `rubric.${prefix}`
    const misconceptionId = `misconception.${prefix}`
    const visualResourceId = lesson.lab ? `visual.${prefix}.causal-lab` : undefined
    const conceptIds = lesson.concepts.map(({ term }) => `concept.${prefix}.${slugify(term)}`)
    const markdown = composeTheory(route, lesson)
    const isDemonstration = lessonIndex === route.lessons.length - 1

    if (lesson.lab && visualResourceId) {
      records.visualResources.push({
        id: visualResourceId, version, type: lesson.lab.type,
        purpose: L(`Hacer observable la cadena causal de ${lesson.title} mediante estados reversibles y controles explícitos.`),
        status: 'ready', sourceIds: lesson.sourceIds,
        fidelity: { geometry: 'G1', kinematics: 'K2', physics: 'P0', limitations: ['Modelo conceptual normalizado. Muestra relaciones y sentidos; no valida geometría, fuerzas, lubricación ni rendimiento de un calibre.'] },
        lessonIds: [lessonId], movementIds: ['movement.conceptual.mechanical-chain'], partSelectors: [],
        requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.camera@^1.0.0'],
        dataRequirements: ['Relaciones funcionales del fixture conceptual.', 'Comandos reversibles y restauración.', 'Alternativa textual completa.'],
        priority: 'high', dependencyIds: [], currentModelSupport: 'yes', viewportImpact: 'configuration',
      })
    }

    moduleIds.push(moduleId)
    competencyIds.push(competencyId)
    records.modules.push({ id: moduleId, version, title: L(lesson.title), purpose: L(lesson.question), lessonIds: [lessonId] })
    records.blocks.push({
      id: blockId, version, kind: 'explanation', title: lesson.title, bodyMarkdown: markdown,
      claims: [makeClaim(`${route.key}.${lesson.slug}`, lesson)],
      pedagogy: { role: 'explain', conceptIds, estimatedMinutes: Math.max(12, Math.ceil(words(markdown) / 170)), userPaced: true },
    })

    lesson.concepts.forEach((concept, conceptIndex) => {
      const conceptId = conceptIds[conceptIndex]
      const prerequisiteIds = [...lessonPrerequisiteConceptIds]
      records.concepts.push({
        id: conceptId, version, title: L(concept.term), summary: L(concept.definition), kind: 'concept',
        knowledgeType: normalizeKnowledgeType(concept.knowledgeType ?? lesson.knowledgeType ?? 'conceptual-causal'), prerequisiteIds,
        recommendedPrerequisiteIds: [], relatedIds: [], competencyIds: [competencyId],
        movementIds: lesson.movementIds ?? [], subsystem: lesson.subsystem, routeIds: [route.id], activityIds: [activityId],
        sourceIds: lesson.sourceIds, misconceptionIds: [misconceptionId], bridgeLessonId: lessonId,
        plainLanguage: L(concept.definition),
        technicalLanguage: L(concept.technical ?? `${concept.term} se interpreta mediante la cadena ${lesson.sequence.join(' → ')} y las condiciones declaradas en la unidad.`),
        whyItMatters: L(concept.why ?? `Permite explicar y comprobar ${lesson.question.toLowerCase()}`),
        observableActions: [L(`Definir ${concept.term} sin circularidad.`), L(`Relacionar ${concept.term} con una entrada, una interfaz y una salida.`)],
        transferTargetIds: [], targetEvidenceLevel: isDemonstration ? 'transfer' : 'causal-explanation', availability: prerequisiteIds.length ? 'prerequisite-blocked' : 'available',
      })
      records.glossary.push({
        id: `term.${prefix}.${slugify(concept.term)}`, version, term: concept.term,
        definitionMarkdown: `${concept.definition}\n\n**En esta Academia:** se estudia dentro de «${lesson.title}» y se relaciona con ${lesson.sequence.join(' → ')}.`,
        language: 'es', authoring: { terms: { es: concept.term, en: concept.en ?? concept.term }, synonyms: { es: concept.synonyms ?? [], en: concept.enSynonyms ?? [] }, discouragedTerms: concept.discouraged ?? [], simpleDefinition: L(concept.definition), technicalDefinition: L(concept.technical ?? concept.definition), context: L(`Vocabulario de ${lesson.title}.`), sourceIds: lesson.sourceIds },
      })
    })

    previousLessonConceptIds = [...conceptIds]
    records.misconceptions.push({
      id: misconceptionId, version, title: L(`Error: ${lesson.misconception.expression}`), learnerExpression: L(lesson.misconception.expression),
      diagnosis: L(lesson.misconception.diagnosis ?? `La respuesta omite una interfaz, mezcla clases de evidencia o generaliza fuera del alcance de ${lesson.title}.`),
      correction: L(lesson.misconception.correction), observableSignals: lesson.misconception.signals ?? ['La explicación salta directamente de entrada a resultado.', 'No distingue dato, inferencia y desconocido.'],
      conceptIds, remediationLessonId: lessonId, sourceIds: lesson.sourceIds,
    })

    const tutorContract = {
      scopeConceptIds: conceptIds,
      allowedActions: ['orient', 'ask-socratic-question', 'explain-declared-content', 'point-to-source', 'suggest-remediation', 'summarize-visible-state'],
      forbiddenClaims: [L('No inventar dimensiones, tolerancias, materiales, lubricantes, estados ni procedimientos no respaldados.'), L('No presentar explicación digital como destreza manual, validación física o autoridad de fabricante.')],
      promptStarters: [L(lesson.question), L(`¿Qué relación causal de «${lesson.title}» falta en mi explicación?`), L('¿Qué fuente respalda este dato y cuál es su alcance?')],
      requiresSourceForTechnicalClaims: true, authority: 'coach-not-assessor',
    }
    records.lessons.push({
      id: lessonId, version, title: lesson.title, blockIds: [blockId], activityIds: [activityId],
      authoring: {
        title: L(lesson.title), purpose: L(lesson.question), objectives: [L(`Explicar ${lesson.title} mediante relaciones causales.`), L('Aplicar vocabulario, magnitudes y fuentes sin confundir clases de evidencia.'), L('Resolver un caso y transferir el criterio a una variante.')],
        prerequisiteConceptIds: lessonIndex > 0 ? lessonPrerequisiteConceptIds : [],
        recommendedPrerequisiteConceptIds: [], externalPrerequisites: [], conceptIds, sourceIds: lesson.sourceIds,
        visualResourceIds: visualResourceId ? [visualResourceId] : [],
        visualStrategy: lesson.lab && visualResourceId ? {
          objective: L(`Observar y manipular ${lesson.title} después de estudiar su teoría.`),
          visibleConcept: L(lesson.core), modelReference: 'fixture.conceptual.mechanical-chain',
          movementIds: ['movement.conceptual.mechanical-chain'], involvedSelectors: [],
          initialState: { cameraIntent: `Encuadre del subsistema ${lesson.lab.subsystem} con la cadena funcional visible.`, visible: [], hidden: [], isolated: [], explode: 0 },
          energyFlow: lesson.sequence, rotationDirections: [], labels: lesson.concepts.map(({ term }) => term),
          arrows: lesson.sequence.slice(0, -1).map((step, index) => `${step} → ${lesson.sequence[index + 1]}`),
          animations: lesson.lab.commands,
          timelineIntent: 'Avance manual y scrub para separar estados; la reproducción nunca sustituye la explicación causal.',
          userInteraction: 'Cambiar vista, ejecutar un comando permitido, pausar, inspeccionar y restaurar antes de responder.',
          observableResult: L(`La persona puede relacionar entradas, estados y salida de ${lesson.title} sin atribuir exactitud física al modelo.`),
          successCriterion: L('Reconstruye la secuencia, predice una interrupción y restaura el estado sin ayuda sustantiva.'),
          restoration: L('Restaurar elimina todos los cambios educativos y devuelve el fixture a su estado inicial.'),
          textualAlternative: L(`Lista ordenada y navegable: ${lesson.sequence.join(' → ')}. Cada comando dispone de resultado y límite en texto.`),
          reducedMotionAlternative: L('Los mismos estados se recorren mediante pasos discretos sin reproducción automática.'),
          fidelity: { geometry: 'G1', kinematics: 'K2', physics: 'P0', limitations: ['Representación educativa normalizada; no expresa tolerancias, contacto validado, lubricación ni carga real.'] },
          unknownData: ['Dimensiones y fuerzas de un calibre real.', 'Pérdidas, elasticidad y tribología cuantitativa.'],
          requiredVisualResourceIds: [visualResourceId],
        } : undefined,
        pedagogy: { role: isDemonstration ? 'transfer' : 'conceptual-model', entryCheck: 'self-check', userPacedSegments: true, introducesConceptIds: conceptIds, reinforcesConceptIds: [], bridgeConceptIds: [] },
        studyContract: { sequence: 'theory-first', minimumTheoryMinutes: Math.max(20, Math.ceil(words(markdown) / 170)), minimumReadingWords: words(markdown), requiredSegmentRoles: ['orient', 'pretrain', 'explain', 'worked-example', 'practice', 'close'], practiceUnlock: 'after-required-reading', labActivityIds: [activityId], readinessCriteria: readinessCriteria(route, lesson), sourceReviewRequired: true, notePrompt: L(`Resume «${lesson.title}» en una cadena causal, una magnitud, un error y una pregunta pendiente.`) },
        tutorContract,
      },
    })

    const questionId = `question.${prefix}.explain`
    records.scenes.push({
      id: sceneId, version, title: `Cuaderno: ${lesson.title}`, description: lesson.question,
      fixtureBinding: lesson.lab ? { kind: 'fixture', fixtureId: 'fixture.conceptual.mechanical-chain' } : undefined,
      accessibility: { textualAlternative: `Lectura y respuesta estructurada sobre ${lesson.title}. No requiere modelo 3D ni arrastre.`, reducedMotionAlternative: 'La unidad es textual y no contiene movimiento esencial.', keyboardActions: ['Tab para recorrer campos', 'Escribir la explicación', 'Confirmar para entregar'], colorIndependentCues: ['Cada campo tiene etiqueta y propósito textual'] },
      requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.overlay.labels@^1.0.0'],
      state: { selected: [], visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1 }, timeline: [],
      overlays: [{ kind: 'text', id: `overlay.${prefix}.scope`, markdown: `**Alcance del estudio:** ${lesson.question}\n\n${lesson.lab ? 'El movimiento mostrado ayuda a seguir relaciones y puede restaurarse; no reproduce fuerzas, tolerancias ni lubricación reales.' : 'Esta actividad se resuelve con texto, fuentes y razonamiento; no representa geometría ni movimiento físico.'} Consulta los niveles de fidelidad en la ficha técnica.`, accessibleLabel: `Pregunta y alcance del estudio: ${lesson.question}` }],
      steps: [{ id: `step.${prefix}.answer`, instructionMarkdown: `Explica **${lesson.title}** con mecanismo, evidencia y límite.`, questions: [{ id: questionId, promptMarkdown: lesson.question, responseKind: 'structured-response', structuredFields: [{ id: `field.${prefix}.mechanism`, label: 'Cadena o mecanismo', kind: 'short-text', required: true, optionIds: [] }, { id: `field.${prefix}.evidence`, label: 'Fuente, dato u observación', kind: 'short-text', required: true, optionIds: [] }, { id: `field.${prefix}.limit`, label: 'Límite o desconocido', kind: 'short-text', required: true, optionIds: [] }, { id: `field.${prefix}.confidence`, label: 'Confianza', kind: 'confidence', required: true, optionIds: [] }], hints: [{ id: `hint.${prefix}.orientation`, level: 1, kind: 'orientation', content: L(`Empieza por ${lesson.sequence[0]} y sigue hasta ${lesson.sequence.at(-1)}.`), availableAfterAttempts: 1, countsAsHint: true }, { id: `hint.${prefix}.causal`, level: 2, kind: 'post-attempt-explanation', content: L(lesson.core), availableAfterAttempts: 2, countsAsHint: true }], humanReviewRequired: isDemonstration, authoring: { prompt: L(lesson.question), feedback: L(`La respuesta debe contener la cadena ${lesson.sequence.join(' → ')}, una fuente o evidencia y un límite.`) } }], success: [{ condition: 'structured-answer', questionId, requiredFieldIds: [`field.${prefix}.mechanism`, `field.${prefix}.evidence`, `field.${prefix}.limit`, `field.${prefix}.confidence`], pendingHumanReview: isDemonstration }] }],
      restorePreviousState: true,
    })

    const deliberatePractice = {
      focus: L(`Reconstruir y aplicar ${lesson.title} sin depender de reconocimiento superficial.`),
      workedExample: { scenario: L(lesson.caseStudy), steps: [L(`Identificar la pregunta: ${lesson.question}`), L(`Dibujar la secuencia ${lesson.sequence.join(' → ')}.`), L(`Asignar magnitudes y evidencia: ${lesson.quantities.join('; ')}.`), L('Declarar el límite y probar una hipótesis rival.')], conclusion: L(lesson.transfer) },
      attempts: [{ phase: 'guided', instruction: L(`Completa la cadena con las etapas visibles: ${lesson.sequence.join(' → ')}.`), evidence: L('Cadena explicada con apoyo.') }, { phase: 'faded', instruction: L('Repite ocultando dos etapas y justifica las interfaces.'), evidence: L('Reconstrucción con ayuda reducida.') }, { phase: 'independent', instruction: L(lesson.question), evidence: L('Respuesta estructurada sin pistas.') }, { phase: 'transfer', instruction: L(lesson.transfer), evidence: L('Aplicación a una variante con nuevas fuentes o datos.') }],
      successCriteria: [L('La cadena no omite la interfaz decisiva.'), L('La evidencia corresponde a la afirmación.'), L('El límite y el desconocido están explícitos.'), L('La transferencia no hereda datos del caso inicial.')],
      errorSignals: [L(lesson.misconception.expression), L('La respuesta nombra piezas o pasos sin explicar relaciones.'), L('Una cifra aparece sin unidad, método o fuente.')],
      independentRetry: { required: true, afterHint: true, restoreBeforeRetry: true, variant: L(`Reintentar ${lesson.title} con otra condición inicial o caso de transferencia.`) },
      transferPrompt: L(lesson.transfer),
    }
    records.activities.push({
      id: activityId, version, title: `Explicar y transferir: ${lesson.title}`, sceneIds: [sceneId], competencyIds: [competencyId], evidenceTemplateIds: [evidenceId], rubricId,
      projectReference: lesson.lab
        ? { kind: 'fixture-readonly', fixtureId: 'fixture.conceptual.mechanical-chain' }
        : { kind: 'template-readonly', templateId: 'watchmaking-encyclopedia-notebook' },
      authoring: {
        lessonId, title: L(`Explicar y transferir: ${lesson.title}`), description: L(lesson.question), difficulty: normalizeDifficulty(lesson.difficulty ?? route.difficulty), durationMinutes: lesson.duration ?? 35,
        activityType: lesson.lab ? 'observation-3d' : isDemonstration ? 'explanation' : 'guided-practice',
        movementIds: lesson.lab ? ['movement.conceptual.mechanical-chain'] : (lesson.movementIds ?? []), familyIds: lesson.familyIds ?? [], subsystem: lesson.subsystem,
        requiredCapabilities: ['learning.scene-runtime', 'reduced-motion', ...(lesson.lab ? ['viewport.camera', 'viewport.overlay.labels'] : [])], languages: ['es-ES'], offline: true,
        fidelity: lesson.lab
          ? { geometry: 'G1', kinematics: 'K2', physics: 'P0', limitations: ['Cinemática educativa reversible; no valida geometría, fuerzas, tolerancias, lubricación ni competencia física.'] }
          : { geometry: 'G0', kinematics: 'K0', physics: 'P0', limitations: ['Actividad textual y causal; no valida geometría, física ni destreza manual.'] },
        warnings: { es: ['Contrasta cualquier procedimiento físico con documentación aplicable y condiciones seguras.'], en: ['Contrasta cualquier procedimiento físico con documentación aplicable y condiciones seguras.'] },
        sourceIds: lesson.sourceIds, visualResourceIds: visualResourceId ? [visualResourceId] : [],
        fixtureBinding: lesson.lab ? { kind: 'fixture', fixtureId: 'fixture.conceptual.mechanical-chain' } : undefined,
        mechanicalLabContract: lesson.lab ? {
          fixtureId: 'fixture.conceptual.mechanical-chain', comparisonFixtureId: 'fixture.miyota.8215.structural',
          subsystem: lesson.lab.subsystem, commands: lesson.lab.commands, viewModes: lesson.lab.views,
          normalizedPhysicsOnly: true, textualAlternative: true, reducedMotion: true,
        } : undefined,
        pedagogicalContract: { purpose: isDemonstration ? 'transfer' : 'guided-practice', assessmentIntent: isDemonstration ? 'demonstration' : 'formative', requiresConceptIds: conceptIds, introducesConceptIds: [], demonstratesConceptIds: isDemonstration ? conceptIds : [], practicesConceptIds: conceptIds, assessesConceptIds: conceptIds, evidenceLevel: isDemonstration ? 'transfer' : 'causal-explanation', supportLevel: isDemonstration ? 'independent' : 'guided', remediation: { lessonId, blockId, conceptIds }, physicalBoundary: L('La evidencia acredita razonamiento y documentación dentro de la Academia. La destreza manual y la validez física requieren banco, instrumentos, seguridad y revisión humana.') },
        deliberatePractice, feedbackContract: { correctExplanation: L(`La explicación conserva la cadena ${lesson.sequence.join(' → ')}, su evidencia y límites.`), incorrectDiagnosis: L(`Revisa si omitiste una interfaz o caíste en «${lesson.misconception.expression}».`), causalQuestion: L(lesson.question), nextObservation: L(`Busca evidencia para distinguir ${lesson.failures[0]} de ${lesson.failures[1]}.`), misconceptionIds: [misconceptionId], transferPrompt: L(lesson.transfer), requiresIndependentRetryAfterHint: true },
        tutorContract, pedagogicalPattern: { enabled: true, stages: ['observe', 'predict', 'compare', 'explain', 'relate-to-real-object', 'check-understanding', 'record-evidence'] },
      },
    })

    records.competencies.push({
      id: competencyId, version, title: `Dominar ${lesson.title}`, description: `Explicar, aplicar y transferir ${lesson.title} con fuentes, magnitudes y límites.`, prerequisites: previousCompetencyId ? [previousCompetencyId] : [],
      authoring: { title: L(`Dominar ${lesson.title}`), description: L(`Explicar, aplicar y transferir ${lesson.title} con fuentes, magnitudes y límites.`), movementIds: lesson.movementIds ?? [], subsystem: lesson.subsystem, skillType: isDemonstration || lesson.skillType === 'capstone' ? 'reasoning' : (lesson.skillType ?? 'knowledge'), sourceIds: lesson.sourceIds },
    })
    previousCompetencyId = competencyId
    records.evidenceTemplates.push({
      id: evidenceId, version, competencyId, kind: 'answer', scoringMethod: 'rubric',
      extraction: {
        id: `rule.extract.${prefix}`, version, triggerEventType: 'structured-response-submitted', evidenceType: 'written-response',
        competencyId, packageId, activityIds: [activityId], evidenceTemplateId: evidenceId,
        minimumSessionState: ['active', 'paused', 'completed'], confidence: isDemonstration ? 0.9 : 0.8,
        contentFields: ['sceneId', 'stepId', 'questionId', 'fields', 'sourceIds', 'confidence'],
      },
    })
    records.rubrics.push({
      id: rubricId, version, competencyId,
      rules: [{ id: `rule.${prefix}`, version, targetState: isDemonstration ? 'demonstrated' : 'practising', acceptedEvidenceKinds: ['answer', 'artifact', 'human-review'], minimumEvidence: 1, minimumScore: 0.75, minimumDistinctSessions: 1, minimumSpanDays: 0, explanationTemplate: `Se evalúan mecanismo, evidencia, magnitudes, errores, límites y transferencia de ${lesson.title}.` }],
      assessmentRule: { id: `rule.composite.${prefix}`, version, competencyId, targetState: isDemonstration ? 'demonstrated' : 'practising', condition: { op: 'minimum-evidence', count: 1 } },
    })
    records.recommendations.push({ id: `recommendation.${prefix}.retain`, version, kind: 'retention', title: L(`Repasar ${lesson.title}`), reason: L('Recuperar la cadena sin releer permite comprobar retención y corregir errores activos.'), rule: 'after-demonstration:1d,7d,21d;different-session=true', priority: 420 - lessonIndex, target: { kind: 'competency', id: competencyId }, evidenceTemplateIds: [evidenceId], required: false })
  }

  const lessonIds = route.lessons.map(({ slug }) => `lesson.encyclopedia.${route.key}.${slug}`)
  const activityIds = route.lessons.map(({ slug }) => `activity.encyclopedia.${route.key}.${slug}`)
  records.routes.push({
    id: route.id, version, title: L(route.title), purpose: L(route.purpose), prerequisiteConceptIds: [], moduleIds, competencyIds,
    movementIds: unique(route.lessons.flatMap(({ movementIds = [] }) => movementIds)), difficulty: normalizeDifficulty(route.difficulty), sourceIds: routeSourceIds, visualResourceIds: [], demo: false,
    learningDesign: { model: normalizeEntryPolicy(route.entryPolicy) === 'start-from-zero' ? 'gold-standard' : 'specialization', entryPolicy: normalizeEntryPolicy(route.entryPolicy), completionPolicy: 'evidence', milestones: route.lessons.map((lesson, index) => ({ id: `milestone.encyclopedia.${route.key}.${String(index + 1).padStart(2, '0')}`, order: index + 1, title: L(lesson.title), outcome: L(lesson.question), lessonId: lessonIds[index], activityId: activityIds[index], mode: index === route.lessons.length - 1 ? 'transfer' : 'explanation', evidenceLevel: index === route.lessons.length - 1 ? 'transfer' : 'causal-explanation', optional: false, transferTargetIds: records.concepts.filter(({ routeIds }) => routeIds.includes(route.id)).filter(({ id }) => id.startsWith(`concept.encyclopedia.${route.key}.${lesson.slug}.`)).map(({ id }) => id) })), diagnosticActivityIds: [], demonstrationActivityIds: [activityIds.at(-1)] },
  })
}

records.curricula.push({ id: 'curriculum.encyclopedia.complete-watchmaking', version, title: L('Enciclopedia personal de relojería'), purpose: L('Cubrir desde lenguaje, taller y física hasta servicio, micromecánica, complicaciones y diseño de un movimiento propio.'), routeIds: routes.map(({ id }) => id), languages: ['es-ES'] })

const entryFolders = {
  curricula: 'curriculum', routes: 'routes', modules: 'modules', concepts: 'concepts', misconceptions: 'misconceptions', blocks: 'blocks', lessons: 'lessons', activities: 'activities', scenes: 'scenes', competencies: 'competencies', evidenceTemplates: 'evidence', rubrics: 'rubrics', glossary: 'glossary', sources: 'sources', recommendations: 'recommendations', visualResources: 'visual-resources',
}
const entries = Object.fromEntries(Object.entries(entryFolders).map(([key, folder]) => [key, records[key].map(({ id }) => ({ id, path: `${folder}/${id}.json` }))]))
const manifest = {
  format: 'wplab-learning-pack', formatVersion: 1, schemaId: 'learning-pack-v1', packageVersion: version, id: packageId,
  title: 'Enciclopedia personal completa de relojería · corpus clásico', distribution: 'local-unsigned', editorialStatus: 'approved', authors: [{ name: 'Watch Prototype Lab' }], languages: ['es-ES'],
  dependencies: [{ packageId: 'wplab.horology.functional-map', versionRange: '^0.5.0' }],
  requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.overlay.labels@^1.0.0', 'viewport.camera@^1.0.0'], movements: [], assets: [], entries,
  minimumAppVersion: '0.13.0', createdAt,
}
const pack = { manifest, ...records }

await rm(root, { recursive: true, force: true })
for (const [key, folder] of Object.entries(entryFolders)) {
  for (const record of records[key]) await writeJson(join(root, folder, `${record.id}.json`), record)
}
await writeJson(join(root, 'manifest.json'), manifest)
await writeJson(join(root, 'dist', 'pack.json'), pack)

const theoryWords = records.blocks.reduce((total, block) => total + words(block.bodyMarkdown), 0)
await writeJson(join(root, 'generated', 'summary.json'), {
  packageId, version, routes: records.routes.length, modules: records.modules.length, lessons: records.lessons.length,
  activities: records.activities.length, concepts: records.concepts.length, misconceptions: records.misconceptions.length,
  glossary: records.glossary.length, theoryWords, sources: records.sources.length, visualResources: records.visualResources.length,
  classicalCorpus: { sourceRecords: CLASSICAL_CORPUS_SOURCE_COUNTS, lessonAdditions: CLASSICAL_EXTENSION_COUNTS },
  generatedAt: createdAt,
})

console.log(JSON.stringify({ packageId, version, routes: records.routes.length, lessons: records.lessons.length, activities: records.activities.length, concepts: records.concepts.length, misconceptions: records.misconceptions.length, glossary: records.glossary.length, theoryWords, sources: records.sources.length, visualResources: records.visualResources.length, classicalCorpus: CLASSICAL_EXTENSION_COUNTS }, null, 2))
