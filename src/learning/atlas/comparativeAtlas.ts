import { z } from 'zod'

const id = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,159}$/)
const localized = z.object({ es: z.string().min(1), en: z.string().min(1) }).strict()

export const ComparativeSourceSchema = z.object({
  id,
  title: z.string().min(1),
  url: z.string().url(),
  authority: z.enum(['manufacturer-official', 'institutional', 'curated-secondary', 'historical-database']),
  scope: z.string().min(1),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict()

export const ArchitectureFamilySchema = z.object({
  id,
  domain: z.enum(['seconds', 'winding', 'construction', 'escapement', 'calendar', 'chronograph']),
  title: localized,
  principle: localized,
  distinguishingRelations: z.array(z.string().min(1)).min(1),
  tradeOffs: z.array(localized).min(1),
  sourceIds: z.array(id).min(1),
}).strict()

export const ComparativeMovementCaseSchema = z.object({
  id,
  manufacturer: z.string().min(1),
  calibre: z.string().min(1),
  title: localized,
  kind: z.enum(['named-calibre', 'reference-pattern', 'archive-research-case']),
  familyIds: z.array(id).min(1),
  officialFacts: z.array(z.string().min(1)).default([]),
  curatedObservations: z.array(z.string().min(1)).default([]),
  unknowns: z.array(z.string().min(1)).min(1),
  sourceIds: z.array(id).min(1),
  evidenceStatus: z.enum(['official', 'official-plus-secondary', 'secondary-discovery', 'historical-reference']),
  modelAvailability: z.enum(['none', 'conceptual', 'structural']),
  modelReference: id.optional(),
  geometryClaim: z.enum(['none', 'envelope', 'structural', 'conceptual']),
  learningUse: localized,
}).strict().superRefine((movement, context) => {
  if (movement.modelAvailability === 'none' && movement.modelReference) {
    context.addIssue({ code: 'custom', path: ['modelReference'], message: 'Un caso sin modelo no puede enlazar una geometría.' })
  }
  if (movement.evidenceStatus === 'official' && movement.curatedObservations.length > 0) {
    context.addIssue({ code: 'custom', path: ['curatedObservations'], message: 'Un caso marcado solo como oficial no puede mezclar observaciones secundarias.' })
  }
})

export type ComparativeSource = z.infer<typeof ComparativeSourceSchema>
export type ArchitectureFamily = z.infer<typeof ArchitectureFamilySchema>
export type ComparativeMovementCase = z.infer<typeof ComparativeMovementCaseSchema>

export const COMPARATIVE_SOURCES: ComparativeSource[] = z.array(ComparativeSourceSchema).parse([
  { id: 'source.eta.6497-2.product', title: 'ETA 6497-2 product page', url: 'https://portal.eta.ch/fr/6497-2-6497-2-3.html', authority: 'manufacturer-official', scope: 'Identidad, funciones y características declaradas del 6497-2.', checkedAt: '2026-08-02' },
  { id: 'source.eta.6497-2.communication', title: 'ETA 6497-2 Technical Communication', url: 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/', authority: 'manufacturer-official', scope: 'Despiece, servicio, seguridad y revisión documental.', checkedAt: '2026-08-02' },
  { id: 'source.eta.2824-2.product', title: 'ETA 2824-2 product page', url: 'https://portal.eta.ch/en/mecaline/2824-2-2824-2-5.html', authority: 'manufacturer-official', scope: 'Segundero central, calendario y carga automática bidireccional.', checkedAt: '2026-08-02' },
  { id: 'source.eta.7750.product', title: 'ETA 7750 product page', url: 'https://portal.eta.ch/en/7750-7750-5.html', authority: 'manufacturer-official', scope: 'Arquitectura funcional del cronógrafo, calendario y automático.', checkedAt: '2026-08-02' },
  { id: 'source.eta.7750.communication', title: 'ETA 7750 Technical Communication', url: 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/2180/', authority: 'manufacturer-official', scope: 'Despiece, secuencia y documentación de servicio del 7750.', checkedAt: '2026-08-02' },
  { id: 'source.seiko.42.technical-guide', title: 'Seiko 4205/4206/4207/4208/4225/4227 Technical Guide', url: 'https://seikoserviceusa.com/uploads/datasheets/4205C_06_07_08_25B_27.pdf', authority: 'manufacturer-official', scope: 'Sistema de palanca mágica, carga bidireccional y ruta de cuerda manual.', checkedAt: '2026-08-02' },
  { id: 'source.seiko.6138a.technical-guide', title: 'Seiko 6138A Technical Guide', url: 'https://seikoserviceusa.com/uploads/datasheets/6138A.pdf', authority: 'manufacturer-official', scope: 'Cronógrafo automático, embrague y calendario.', checkedAt: '2026-08-02' },
  { id: 'source.miyota.8215.official', title: 'MIYOTA 8215 official documentation', url: 'https://miyotamovement.com/product/8215/', authority: 'manufacturer-official', scope: 'Especificación y documentos oficiales enlazados del 8215.', checkedAt: '2026-08-02' },
  { id: 'source.miyota.2035.official', title: 'MIYOTA 2035 official documentation', url: 'https://miyotamovement.com/product/2035/', authority: 'manufacturer-official', scope: 'Especificación y documentos oficiales enlazados del 2035.', checkedAt: '2026-08-02' },
  { id: 'source.external.ranfft', title: 'Ranfft movement archive', url: 'http://www.ranfft.de/cgi-bin/bidfun-db.cgi?10&ranfft&&2uswk', authority: 'historical-database', scope: 'Descubrimiento e identificación comparativa; cada dato debe contrastarse.', checkedAt: '2026-08-02' },
  { id: 'source.external.17jewels', title: '17jewels movement archive', url: 'https://17jewels.info/', authority: 'curated-secondary', scope: 'Fotografías y referencias para búsqueda; no sustituye documentación oficial.', checkedAt: '2026-08-02' },
  { id: 'source.external.watchguy', title: 'The Watch Guy repair archive', url: 'https://watchguy.co.uk/', authority: 'curated-secondary', scope: 'Casos de servicio y fotografías contextualizadas; autoridad secundaria.', checkedAt: '2026-08-02' },
  { id: 'source.external.pocketwatchdatabase', title: 'Pocket Watch Database', url: 'https://pocketwatchdatabase.com/', authority: 'historical-database', scope: 'Identidad y contexto de relojes de bolsillo; exige conservar incertidumbre.', checkedAt: '2026-08-02' },
])

const L = (es: string, en = es) => ({ es, en })

export const ARCHITECTURE_FAMILIES: ArchitectureFamily[] = z.array(ArchitectureFamilySchema).parse([
  { id: 'architecture.seconds.small', domain: 'seconds', title: L('Pequeño segundero', 'Small seconds'), principle: L('La indicación de segundos se toma de un eje desplazado que llega directamente a una subesfera.'), distinguishingRelations: ['fourth-wheel drives small-seconds-hand'], tradeOffs: [L('Lectura mecánica directa y arquitectura clara; condiciona la composición de esfera.')], sourceIds: ['source.eta.6497-2.product'] },
  { id: 'architecture.seconds.central-direct', domain: 'seconds', title: L('Segundero central directo', 'Direct centre seconds'), principle: L('Una rueda situada en el eje central lleva la aguja de segundos sin una transmisión lateral adicional.'), distinguishingRelations: ['central-fourth-wheel drives centre-seconds-hand'], tradeOffs: [L('Cadena compacta, pero obliga a coordinar alturas y ejes concéntricos.')], sourceIds: ['source.eta.7750.product'] },
  { id: 'architecture.seconds.central-indirect', domain: 'seconds', title: L('Segundero central indirecto', 'Indirect centre seconds'), principle: L('Una transmisión adicional lleva los segundos desde una cuarta rueda desplazada al centro.'), distinguishingRelations: ['fourth-wheel meshes-with intermediate-seconds-wheel', 'intermediate-seconds-wheel drives centre-seconds-pinion'], tradeOffs: [L('Permite conservar otra disposición del tren; añade apoyos, juego, rozamiento y necesidades de frenado.')], sourceIds: ['source.external.ranfft', 'source.external.17jewels'] },
  { id: 'architecture.winding.reverser', domain: 'winding', title: L('Automático con inversores', 'Reversing-wheel automatic'), principle: L('Ruedas inversoras rectifican los dos sentidos del rotor para cargar el barrilete.'), distinguishingRelations: ['rotor drives reversing-wheels', 'reversing-wheels drive reduction-wheel', 'reduction-wheel winds barrel-arbor'], tradeOffs: [L('Aprovecha ambos sentidos; exige limpieza, libertad y diagnosis específica de los inversores.')], sourceIds: ['source.eta.2824-2.product'] },
  { id: 'architecture.winding.pawl-lever', domain: 'winding', title: L('Automático por palanca de uñas', 'Pawl-lever automatic'), principle: L('Una palanca transforma el giro alternativo o bidireccional del rotor en avance unidireccional de carga.'), distinguishingRelations: ['rotor-eccentric drives pawl-lever', 'pawl-lever indexes transmission-wheel', 'transmission-wheel winds ratchet-wheel'], tradeOffs: [L('Pocas piezas y acción visible; el estado de uñas, muelles y apoyos domina el diagnóstico.')], sourceIds: ['source.seiko.42.technical-guide', 'source.seiko.6138a.technical-guide'] },
  { id: 'architecture.winding.unidirectional', domain: 'winding', title: L('Automático unidireccional', 'Unidirectional automatic'), principle: L('Solo un sentido del rotor transmite carga; el otro queda libre.'), distinguishingRelations: ['rotor drives winding-train in one direction', 'freewheel releases opposite direction'], tradeOffs: [L('Ruta de carga sencilla; el rendimiento percibido depende del patrón de movimiento y del estado del tren.')], sourceIds: ['source.eta.7750.product', 'source.miyota.8215.official'] },
  { id: 'architecture.construction.separate-bridges', domain: 'construction', title: L('Puentes separados', 'Separate bridges'), principle: L('Los apoyos superiores se reparten entre varios puentes individualizados.'), distinguishingRelations: ['bridge supports wheel-set', 'screws retain bridge-to-mainplate'], tradeOffs: [L('Acceso selectivo y lectura funcional; más interfaces de posicionamiento y orden de montaje.')], sourceIds: ['source.eta.6497-2.communication'] },
  { id: 'architecture.construction.ultra-thin', domain: 'construction', title: L('Arquitectura extraplana', 'Ultra-thin architecture'), principle: L('Reduce altura total integrando funciones, solapando planos o reduciendo espesores y apoyos.'), distinguishingRelations: ['height-budget constrains wheel-stack', 'integrated-component replaces stacked-components'], tradeOffs: [L('Menor espesor; menor margen para rigidez, alturas, servicio y tolerancias acumuladas.')], sourceIds: ['source.external.ranfft', 'source.external.17jewels'] },
  { id: 'architecture.escapement.swiss-lever', domain: 'escapement', title: L('Escape de áncora suizo', 'Swiss lever escapement'), principle: L('La rueda alterna bloqueo y liberación sobre dos paletas y transmite impulso mediante áncora y clavija.'), distinguishingRelations: ['escape-wheel locks-on pallet-stone', 'pallet-fork impulses balance'], tradeOffs: [L('Robusto y ampliamente documentado; el ajuste real exige geometría, seguridad y lubricación no inferibles de una animación.')], sourceIds: ['source.eta.6497-2.communication', 'source.miyota.8215.official'] },
  { id: 'architecture.calendar.simple-date', domain: 'calendar', title: L('Fecha simple', 'Simple date'), principle: L('Una reducción de 24 horas acumula y libera el avance de una posición del disco de fecha.'), distinguishingRelations: ['motion-works drives date-driving-wheel', 'date-finger advances date-ring', 'jumper retains date-ring'], tradeOffs: [L('Lectura y servicio directos; la zona de cambio y la corrección rápida requieren respetar dependencias.')], sourceIds: ['source.eta.2824-2.product', 'source.miyota.8215.official'] },
  { id: 'architecture.chronograph.cam', domain: 'chronograph', title: L('Cronógrafo gobernado por levas', 'Cam-controlled chronograph'), principle: L('Levas y palancas coordinan inicio, parada y puesta a cero.'), distinguishingRelations: ['push-piece actuates operating-lever', 'operating-lever indexes cam', 'cam positions coupling-and-brake'], tradeOffs: [L('Fabricación y servicio racionales; la sensación de pulsadores y la secuencia dependen del perfil y ajuste.')], sourceIds: ['source.eta.7750.product', 'source.eta.7750.communication'] },
  { id: 'architecture.chronograph.column-wheel', domain: 'chronograph', title: L('Cronógrafo con rueda de pilares', 'Column-wheel chronograph'), principle: L('Una rueda almenada indexa estados y gobierna las palancas del cronógrafo.'), distinguishingRelations: ['operating-lever indexes column-wheel', 'columns position control-levers'], tradeOffs: [L('Estados mecánicos legibles y transiciones precisas; componente y ajuste más exigentes.')], sourceIds: ['source.seiko.6138a.technical-guide'] },
  { id: 'architecture.chronograph.horizontal-clutch', domain: 'chronograph', title: L('Acoplamiento horizontal', 'Horizontal clutch'), principle: L('Una rueda de acoplamiento se desplaza lateralmente para engranar el tren horario con el contador.'), distinguishingRelations: ['coupling-wheel translates', 'coupling-wheel meshes-with chronograph-wheel'], tradeOffs: [L('Funcionamiento visible y didáctico; el engrane puede producir salto inicial y exige profundidad correcta.')], sourceIds: ['source.eta.7750.communication'] },
  { id: 'architecture.chronograph.vertical-clutch', domain: 'chronograph', title: L('Embrague vertical', 'Vertical clutch'), principle: L('Superficies coaxiales acoplan por presión axial la marcha base y el cronógrafo.'), distinguishingRelations: ['clutch-surfaces engage-axially', 'clutch drives chronograph-wheel-coaxially'], tradeOffs: [L('Inicio potencialmente suave; inspección y servicio del conjunto de embrague son específicos.')], sourceIds: ['source.seiko.6138a.technical-guide'] },
])

export const COMPARATIVE_MOVEMENT_CASES: ComparativeMovementCase[] = z.array(ComparativeMovementCaseSchema).parse([
  { id: 'case.eta.6497-2', manufacturer: 'ETA', calibre: '6497-2', title: L('ETA 6497-2 · cuerda manual y pequeño segundero'), kind: 'named-calibre', familyIds: ['architecture.seconds.small', 'architecture.construction.separate-bridges', 'architecture.escapement.swiss-lever'], officialFacts: ['Movimiento mecánico de cuerda manual.', 'Pequeño segundero.', 'La comunicación técnica oficial documenta despiece y servicio.'], unknowns: ['La Academia no dispone de un gemelo geométrico instalado de este calibre.'], sourceIds: ['source.eta.6497-2.product', 'source.eta.6497-2.communication'], evidenceStatus: 'official', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Caso base para separar disposición de segundos, puentes y procedimiento documentado.') },
  { id: 'case.eta.2824-2', manufacturer: 'ETA', calibre: '2824-2', title: L('ETA 2824-2 · central, fecha y automático bidireccional'), kind: 'named-calibre', familyIds: ['architecture.seconds.central-direct', 'architecture.winding.reverser', 'architecture.calendar.simple-date', 'architecture.escapement.swiss-lever'], officialFacts: ['Segundero central.', 'Fecha.', 'Carga automática bidireccional declarada por ETA.'], unknowns: ['No se modelan inversores, alturas ni tolerancias de este calibre.'], sourceIds: ['source.eta.2824-2.product'], evidenceStatus: 'official', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Caso de referencia para una arquitectura automática compacta con fecha.') },
  { id: 'case.eta.7750', manufacturer: 'ETA', calibre: '7750', title: L('ETA 7750 · cronógrafo de levas'), kind: 'named-calibre', familyIds: ['architecture.seconds.central-direct', 'architecture.winding.unidirectional', 'architecture.chronograph.cam', 'architecture.chronograph.horizontal-clutch'], officialFacts: ['Cronógrafo gobernado por levas y dos pulsadores.', 'Carga automática unidireccional.', 'Día y fecha.'], unknowns: ['La Academia no valida fuerzas de pulsador, engrane ni ajuste del cronógrafo.'], sourceIds: ['source.eta.7750.product', 'source.eta.7750.communication'], evidenceStatus: 'official', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Caso documental para distinguir control, acoplamiento, indicación y puesta a cero.') },
  { id: 'case.seiko.42-family', manufacturer: 'Seiko', calibre: '42 family', title: L('Seiko 42 · automático por palanca de uñas'), kind: 'named-calibre', familyIds: ['architecture.winding.pawl-lever', 'architecture.calendar.simple-date'], officialFacts: ['La guía oficial describe el sistema pawl lever.', 'El giro bidireccional del rotor se convierte en carga de un solo sentido.', 'Existe una ruta de cuerda manual en las variantes documentadas.'], unknowns: ['Las diferencias entre variantes deben leerse en la guía, no extrapolarse.'], sourceIds: ['source.seiko.42.technical-guide'], evidenceStatus: 'official', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Contraste funcional frente a los inversores y al automático unidireccional.') },
  { id: 'case.seiko.6138a', manufacturer: 'Seiko', calibre: '6138A', title: L('Seiko 6138A · cronógrafo automático'), kind: 'named-calibre', familyIds: ['architecture.winding.pawl-lever', 'architecture.chronograph.column-wheel', 'architecture.chronograph.vertical-clutch', 'architecture.calendar.simple-date'], officialFacts: ['Cronógrafo automático.', 'La guía oficial documenta pawl lever, clutch mechanism y día/fecha.'], unknowns: ['La clase exacta de cada interfaz debe verificarse contra el diagrama y la lista de piezas de la revisión consultada.'], sourceIds: ['source.seiko.6138a.technical-guide'], evidenceStatus: 'official', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Caso de contraste para control y acoplamiento de cronógrafo.') },
  { id: 'case.miyota.8215', manufacturer: 'MIYOTA', calibre: '8215', title: L('MIYOTA 8215 · ensamblaje estructural instalado'), kind: 'named-calibre', familyIds: ['architecture.winding.unidirectional', 'architecture.calendar.simple-date', 'architecture.escapement.swiss-lever'], officialFacts: ['Identidad y especificaciones se conservan desde documentación oficial curada.'], unknowns: ['R2/G2/K2/P0 no equivale a gemelo exacto ni a validación de servicio.'], sourceIds: ['source.miyota.8215.official'], evidenceStatus: 'official', modelAvailability: 'structural', modelReference: 'fixture.miyota.8215.structural', geometryClaim: 'structural', learningUse: L('Ancla visual instalada para comparar subsistemas sin transferir dimensiones a otros calibres.') },
  { id: 'case.miyota.2035', manufacturer: 'MIYOTA', calibre: '2035', title: L('MIYOTA 2035 · contraste cuarzo'), kind: 'named-calibre', familyIds: ['architecture.seconds.central-direct'], officialFacts: ['Movimiento de cuarzo con documentación oficial curada.'], unknowns: ['No es una referencia para arquitecturas mecánicas de carga, escape o cronógrafo.'], sourceIds: ['source.miyota.2035.official'], evidenceStatus: 'official', modelAvailability: 'structural', modelReference: 'fixture.miyota.2035.structural', geometryClaim: 'structural', learningUse: L('Control negativo: una indicación central semejante no implica la misma cadena funcional.') },
  { id: 'case.pattern.indirect-centre-seconds', manufacturer: 'Comparative Atlas', calibre: 'indirect-centre-seconds', title: L('Patrón · segundero central indirecto'), kind: 'reference-pattern', familyIds: ['architecture.seconds.central-indirect'], curatedObservations: ['El patrón se usa para formular preguntas de identificación en archivos secundarios.'], unknowns: ['No declara calibre, número de dientes, muelle de fricción ni geometría concreta.'], sourceIds: ['source.external.ranfft', 'source.external.17jewels'], evidenceStatus: 'secondary-discovery', modelAvailability: 'conceptual', modelReference: 'fixture.conceptual.mechanical-chain', geometryClaim: 'conceptual', learningUse: L('Aprender a reconocer la transmisión adicional sin convertir una foto en medida.') },
  { id: 'case.pattern.ultra-thin', manufacturer: 'Comparative Atlas', calibre: 'ultra-thin-pattern', title: L('Patrón · presupuesto de altura extraplana'), kind: 'reference-pattern', familyIds: ['architecture.construction.ultra-thin'], curatedObservations: ['Las bases históricas ayudan a localizar familias y variantes para buscar documentación primaria.'], unknowns: ['No se afirma una solución universal ni un espesor concreto.'], sourceIds: ['source.external.ranfft', 'source.external.17jewels'], evidenceStatus: 'historical-reference', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Trade study del presupuesto de altura, rigidez, servicio y acumulación de tolerancias.') },
  { id: 'case.archive.service-reading', manufacturer: 'Comparative Atlas', calibre: 'service-record', title: L('Caso de archivo · leer una intervención sin sobregeneralizar'), kind: 'archive-research-case', familyIds: ['architecture.construction.separate-bridges'], curatedObservations: ['Un reportaje de servicio aporta secuencia y observaciones de una unidad, no especificación universal.'], unknowns: ['Estado previo, herramientas, revisión y decisiones pueden no transferirse a otra unidad.'], sourceIds: ['source.external.watchguy'], evidenceStatus: 'secondary-discovery', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Practicar la separación entre observación, inferencia, procedimiento y autoridad.') },
  { id: 'case.archive.pocket-watch-identity', manufacturer: 'Comparative Atlas', calibre: 'pocket-watch-identity', title: L('Caso histórico · identidad de reloj de bolsillo'), kind: 'archive-research-case', familyIds: ['architecture.seconds.small', 'architecture.construction.separate-bridges'], curatedObservations: ['Las marcas, números y registros permiten proponer una identidad con nivel de confianza.'], unknowns: ['Una coincidencia de caja, esfera o número no demuestra por sí sola la identidad del movimiento.'], sourceIds: ['source.external.pocketwatchdatabase'], evidenceStatus: 'historical-reference', modelAvailability: 'none', geometryClaim: 'none', learningUse: L('Construir una ficha de identidad con evidencia positiva, contradicciones y desconocidos.') },
])

export function architectureFamiliesByDomain(domain?: ArchitectureFamily['domain']): ArchitectureFamily[] {
  return domain ? ARCHITECTURE_FAMILIES.filter((family) => family.domain === domain) : [...ARCHITECTURE_FAMILIES]
}

export function comparativeCasesForFamily(familyId: string): ComparativeMovementCase[] {
  return COMPARATIVE_MOVEMENT_CASES.filter((movement) => movement.familyIds.includes(familyId))
}

export function comparativeSource(id: string): ComparativeSource | undefined {
  return COMPARATIVE_SOURCES.find((source) => source.id === id)
}
