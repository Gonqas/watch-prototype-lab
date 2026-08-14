import type { LearningActivityDescriptor } from '../../product/demoPackage'
import { academy3dVisualState } from './academyReader3dStates'
import { academyReaderPayloadHash } from './academyReaderIdentity'
import type {
  AcademyDiagramData,
  AcademyReaderSection,
  AcademyReadingModePolicy,
  AcademySectionVisualCuration,
  AcademyVisualCueKind,
  AcademyVisualDecision,
} from './academyReaderModel'

export const ACADEMY_DEEP_VISUAL_PILOT_IDS = new Set([
  'lesson.horology.system',
  'lesson.horology.mechanical-chain',
  'lesson.horology.functional-equivalence',
  'lesson.mechanical.energy',
  'lesson.mechanical.barrel',
  'lesson.mechanical.gear-pair',
  'lesson.mechanical.train',
  'lesson.mechanical.escapement',
  'lesson.mechanical.oscillator',
  'lesson.metrology.observe-before-measuring',
  'lesson.horology.failure-prediction',
  'lesson.miyota8215.architecture',
  'lesson.miyota8215.guided-disassembly',
  'lesson.miyota8215.inspection',
  'lesson.encyclopedia.cases-water.arquitectura-de-caja',
])

export const ACADEMY_SUPPORTING_VISUAL_PILOT_IDS = new Set([
  'lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste',
])

const GENERIC_SCAFFOLD_LABELS = new Set([
  'entrada', 'función', 'relación', 'límite', 'criterio', 'caso a', 'caso b', 'cambio', 'control', 'resultado', 'salida',
])

export function academyDiagramIsContentSpecific(data: AcademyDiagramData | undefined): boolean {
  if (!data || data.nodes.length < 2) return false
  const labels = [
    ...data.nodes.map(({ label }) => label),
    ...data.edges.flatMap(({ label }) => label ? [label] : []),
    ...(data.phases?.map(({ label }) => label) ?? []),
  ].map((label) => label.trim().toLocaleLowerCase('es-ES'))
  return labels.some((label) => label.length > 2 && !GENERIC_SCAFFOLD_LABELS.has(label))
}

interface VisualDefinition {
  sectionId: string
  visualDecision: AcademyVisualDecision
  visualDesignId: string
  visualKind: AcademyVisualCueKind
  diagramSchemaId?: string
  diagramData?: AcademyDiagramData
  activityId?: string
  visualStateId?: string
  pedagogicalPurpose: string
  pedagogicalQuestion: string
  essentialConcepts: string[]
  expectedObservation: string
  misconceptionAddressed?: string
  readingModePolicy: AcademyReadingModePolicy
  fidelity: 'conceptual' | 'calibre-specific'
  limitations: string[]
  technicalReviewRequired?: boolean
}

const sectionId = (blockId: string, slug: string) => `reader.section.${blockId}.${slug}`
const node = (id: string, label: string, detail?: string, lane?: string) => ({ id, label, ...(detail ? { detail } : {}), ...(lane ? { lane } : {}) })
const edge = (from: string, to: string, label?: string, kind: 'energy' | 'timing' | 'mechanical' | 'decision' | 'comparison' = 'mechanical') => ({ from, to, ...(label ? { label } : {}), direction: 'forward' as const, kind })
const conceptualLimits = ['Diagrama editorial original, no dibujo a escala.', 'No sustituye documentación oficial, tolerancias ni evidencia física.']

function diagram(
  section: string,
  design: string,
  schema: string,
  purpose: string,
  question: string,
  concepts: string[],
  data: AcademyDiagramData,
  observation: string,
  options: Partial<Pick<VisualDefinition, 'visualDecision' | 'visualKind' | 'readingModePolicy' | 'misconceptionAddressed' | 'limitations' | 'technicalReviewRequired'>> = {},
): VisualDefinition {
  return {
    sectionId: section,
    visualDecision: options.visualDecision ?? 'content-specific-diagram',
    visualDesignId: design,
    visualKind: options.visualKind ?? 'diagram',
    diagramSchemaId: schema,
    diagramData: data,
    pedagogicalPurpose: purpose,
    pedagogicalQuestion: question,
    essentialConcepts: concepts,
    expectedObservation: observation,
    misconceptionAddressed: options.misconceptionAddressed,
    readingModePolicy: options.readingModePolicy ?? 'inline-essential',
    fidelity: 'conceptual',
    limitations: options.limitations ?? conceptualLimits,
    technicalReviewRequired: options.technicalReviewRequired,
  }
}

function scene(
  section: string,
  design: string,
  activityId: string,
  visualStateId: string,
  purpose: string,
  question: string,
  concepts: string[],
  readingModePolicy: AcademyReadingModePolicy = 'inline-static-summary',
): VisualDefinition {
  const state = academy3dVisualState(visualStateId)
  if (!state) throw new Error(`Estado 3D no registrado: ${visualStateId}`)
  return {
    sectionId: section,
    visualDecision: 'content-specific-3d',
    visualDesignId: design,
    visualKind: 'scene-3d',
    activityId,
    visualStateId,
    pedagogicalPurpose: purpose,
    pedagogicalQuestion: question,
    essentialConcepts: concepts,
    expectedObservation: state.expectedObservation,
    readingModePolicy,
    fidelity: state.fidelity,
    limitations: state.limitations,
    technicalReviewRequired: state.fidelity === 'calibre-specific',
  }
}

const VISUAL_DEFINITIONS: readonly VisualDefinition[] = [
  diagram(
    sectionId('block.horology.system', 'explicacion-principal'), 'visual.watch-system.functions.v1', 'diagram.system-functional-map.v1',
    'Distinguir las funciones del reloj completo y su relación con el movimiento.', '¿Qué funciones pertenecen al movimiento y cuáles protegen o conectan el reloj completo?',
    ['almacenar energía', 'transmitir', 'regular', 'contar', 'indicar', 'ajustar', 'proteger'],
    { title: 'Funciones de un reloj completo', nodes: [node('store', 'Almacenar energía'), node('transmit', 'Transmitir'), node('regulate', 'Regular'), node('count', 'Contar'), node('indicate', 'Indicar'), node('adjust', 'Ajustar'), node('protect', 'Proteger', 'Caja, cristal, corona y fondo')], edges: [edge('store', 'transmit', 'energía', 'energy'), edge('transmit', 'regulate', 'entrega dosificada', 'energy'), edge('regulate', 'count', 'referencia temporal', 'timing'), edge('count', 'indicate', 'información temporal', 'timing'), edge('adjust', 'count', 'puesta en hora', 'mechanical'), edge('protect', 'store', 'envolvente del reloj')], annotations: ['El movimiento realiza la cadena funcional interna.', 'El reloj completo añade indicación, ajuste y protección.'] },
    'Energía y referencia temporal recorren funciones distintas; caja y cristal no son etapas del tren.',
  ),
  diagram(
    sectionId('block.horology.system', 'explicacion-visual'), 'visual.watch-system.boundary.v1', 'diagram.system-boundary.v1',
    'Situar el límite entre movimiento y reloj completo.', '¿Dónde termina el movimiento y qué interfaces lo conectan con el exterior?',
    ['movimiento', 'esfera y agujas', 'tija y corona', 'caja y cristal'],
    { title: 'Movimiento dentro del reloj completo', nodes: [node('movement', 'Movimiento', 'energía, tren, regulación y conteo'), node('display', 'Esfera y agujas', 'indicación'), node('stem', 'Tija y corona', 'ajuste y cuerda'), node('case', 'Caja, cristal y fondo', 'protección')], edges: [edge('movement', 'display', 'salida de indicación'), edge('stem', 'movement', 'entrada de ajuste'), edge('case', 'movement', 'aloja y protege')] },
    'El movimiento no equivale al reloj completo: necesita interfaces de indicación, ajuste y protección.',
  ),
  diagram(
    sectionId('block.horology.mechanical-chain', 'explicacion-principal'), 'visual.mechanical-chain.energy-time.v1', 'diagram.dual-flow-chain.v1',
    'Seguir por separado el flujo de energía y la producción de información temporal.', '¿Cómo avanza la energía y dónde aparece la referencia temporal?',
    ['barrilete', 'rueda central', 'tercera', 'cuarta', 'escape', 'áncora', 'volante y espiral', 'minutería'],
    { title: 'Cadena mecánica: energía e información temporal', nodes: [node('barrel', 'Barrilete'), node('center', 'Rueda central'), node('third', 'Tercera rueda'), node('fourth', 'Cuarta rueda'), node('escape', 'Rueda de escape'), node('pallet', 'Áncora'), node('balance', 'Volante y espiral'), node('motion', 'Minutería e indicación')], edges: [edge('barrel', 'center', 'energía', 'energy'), edge('center', 'third', 'energía', 'energy'), edge('third', 'fourth', 'energía', 'energy'), edge('fourth', 'escape', 'energía', 'energy'), edge('escape', 'pallet', 'bloqueo e impulso', 'energy'), edge('pallet', 'balance', 'impulso', 'energy'), edge('balance', 'pallet', 'cadencia', 'timing'), edge('fourth', 'motion', 'movimiento contado', 'timing')] },
    'La energía avanza desde el barrilete; la cadencia nace en el oscilador y modula su liberación en el escape.',
  ),
  diagram(
    sectionId('block.horology.mechanical-chain', 'ejemplo'), 'visual.mechanical-chain.interruption.v1', 'diagram.causal-interruption.v1',
    'Predecir qué se conserva y qué desaparece al interrumpir una etapa.', 'Si se bloquea la cuarta rueda, ¿qué elementos quedan aguas arriba y cuáles dejan de recibir energía?',
    ['síntoma aguas arriba', 'bloqueo', 'salida aguas abajo'],
    { title: 'Interrupción en la cuarta rueda', nodes: [node('barrel', 'Barrilete cargado'), node('train', 'Tren hasta tercera'), node('blocked', 'Cuarta rueda bloqueada'), node('escape', 'Escape sin entrega'), node('balance', 'Oscilador sin mantenimiento')], edges: [edge('barrel', 'train', 'energía disponible', 'energy'), edge('train', 'blocked', 'flujo detenido', 'energy'), edge('blocked', 'escape', 'sin transmisión', 'decision'), edge('escape', 'balance', 'sin impulso', 'decision')], acceptanceCriteria: ['Separar causa, punto de interrupción y síntoma.', 'No confundir reserva de energía con marcha efectiva.'] },
    'Un depósito cargado no garantiza marcha si la cadena está interrumpida aguas abajo.',
  ),
  diagram(
    sectionId('block.horology.functional-equivalence', 'explicacion-principal'), 'visual.functional-equivalence.parallel.v1', 'diagram.parallel-architecture.v1',
    'Comparar funciones equivalentes sin afirmar identidad física.', '¿Qué función resuelve cada arquitectura y con qué componente distinto?',
    ['fuente', 'regulador o divisor', 'accionamiento', 'transmisión', 'indicación'],
    { title: 'Mecánico y cuarzo en paralelo', nodes: [node('m-source', 'Muelle real', undefined, 'Mecánico'), node('m-reg', 'Volante + espiral + escape', undefined, 'Mecánico'), node('m-drive', 'Tren de ruedas', undefined, 'Mecánico'), node('m-display', 'Agujas', undefined, 'Mecánico'), node('q-source', 'Pila', undefined, 'Cuarzo'), node('q-reg', 'Resonador + divisor', undefined, 'Cuarzo'), node('q-drive', 'Motor paso a paso', undefined, 'Cuarzo'), node('q-train', 'Tren reductor', undefined, 'Cuarzo'), node('q-display', 'Agujas', undefined, 'Cuarzo')], edges: [edge('m-source', 'm-reg', 'energía regulada', 'energy'), edge('m-reg', 'm-drive', 'cadencia mecánica', 'timing'), edge('m-drive', 'm-display', 'indicación'), edge('q-source', 'q-reg', 'alimentación', 'energy'), edge('q-reg', 'q-drive', 'pulsos', 'timing'), edge('q-drive', 'q-train', 'pasos'), edge('q-train', 'q-display', 'indicación'), edge('m-source', 'q-source', 'misma función; principio distinto', 'comparison'), edge('m-reg', 'q-reg', 'misma función; principio distinto', 'comparison')] },
    'Las cadenas comparten funciones abstractas, no piezas, fenómenos ni procedimientos intercambiables.',
    { visualDecision: 'content-specific-comparison', visualKind: 'comparison', misconceptionAddressed: 'Equivalencia funcional no significa identidad física.' },
  ),
  diagram(
    sectionId('block.horology.functional-equivalence', 'explicacion-visual'), 'visual.functional-equivalence.boundaries.v1', 'diagram.parallel-boundaries.v1',
    'Señalar la frontera electro-mecánica del cuarzo y la regulación mecánica.', '¿En qué punto cambia la naturaleza de la señal en cada arquitectura?',
    ['frontera electro-mecánica', 'escape', 'motor paso a paso'],
    { title: 'Fronteras de transformación', nodes: [node('mechanical-energy', 'Energía mecánica'), node('escapement', 'Escape + oscilador'), node('mechanical-count', 'Movimiento contado'), node('electrical', 'Señal eléctrica dividida'), node('motor', 'Motor paso a paso'), node('quartz-count', 'Movimiento contado')], edges: [edge('mechanical-energy', 'escapement', 'dosificación', 'energy'), edge('escapement', 'mechanical-count', 'cadencia', 'timing'), edge('electrical', 'motor', 'pulso', 'timing'), edge('motor', 'quartz-count', 'conversión electro-mecánica', 'mechanical')] },
    'El cuarzo cruza una frontera electro-mecánica en el motor; el mecánico mantiene la cadena en el dominio mecánico.',
    { visualDecision: 'content-specific-comparison', visualKind: 'comparison' },
  ),
  diagram(
    sectionId('block.mechanical.energy', 'explicacion'), 'visual.mechanical-energy.flow.v1', 'diagram.energy-budget.v1',
    'Relacionar almacenamiento, par útil y pérdidas sin inventar curvas.', '¿Dónde se almacena la energía y por qué no toda llega al escape?',
    ['energía almacenada', 'par', 'pérdidas', 'tren', 'escape'],
    { title: 'Presupuesto cualitativo de energía', nodes: [node('spring', 'Muelle real cargado'), node('barrel', 'Barrilete entrega par'), node('train', 'Tren transmite'), node('losses', 'Pérdidas por fricción'), node('escapement', 'Escape dosifica')], edges: [edge('spring', 'barrel', 'descarga', 'energy'), edge('barrel', 'train', 'par', 'energy'), edge('train', 'escapement', 'energía útil', 'energy'), edge('train', 'losses', 'pérdidas', 'energy')], annotations: ['No se dibuja una curva de par numérica.', 'La energía almacenada, el par y la potencia no son sinónimos.'] },
    'El flujo se reparte entre entrega útil y pérdidas; el diagrama no cuantifica ninguna magnitud.',
  ),
  diagram(
    sectionId('block.mechanical.theory.energy', 'teoria-almacenar-entregar-y-dosificar'), 'visual.mechanical-energy.states.v1', 'diagram.energy-state-sequence.v1',
    'Distinguir carga, reserva y descarga controlada.', '¿Qué cambia entre muelle descargado, cargado y en entrega?',
    ['carga', 'reserva', 'descarga'],
    { title: 'Estados cualitativos del muelle', nodes: [node('unloaded', 'Descargado'), node('loaded', 'Cargado'), node('delivery', 'Entrega al barrilete'), node('regulated', 'Liberación dosificada')], edges: [edge('unloaded', 'loaded', 'cuerda', 'energy'), edge('loaded', 'delivery', 'descarga', 'energy'), edge('delivery', 'regulated', 'tren + escape', 'energy')], phases: [{ id: 'p1', label: 'Carga' }, { id: 'p2', label: 'Reserva' }, { id: 'p3', label: 'Entrega' }] },
    'Cargar aumenta la reserva; el escape no almacena energía, regula su liberación.',
  ),
  diagram(
    sectionId('block.mechanical.barrel', 'explicacion'), 'visual.barrel.anatomy.v1', 'diagram.annotated-assembly.v1',
    'Localizar piezas e interfaces del barrilete.', '¿Qué pieza se une al extremo interior y cuál transmite la entrega al tren?',
    ['muelle real', 'árbol', 'tambor', 'tapa', 'gancho interior', 'gancho exterior'],
    { title: 'Anatomía funcional del barrilete', nodes: [node('arbor', 'Árbol'), node('inner-hook', 'Gancho interior'), node('spring', 'Muelle real'), node('outer-hook', 'Gancho exterior'), node('drum', 'Tambor'), node('cover', 'Tapa')], edges: [edge('arbor', 'inner-hook', 'anclaje'), edge('inner-hook', 'spring'), edge('spring', 'outer-hook'), edge('outer-hook', 'drum', 'entrega'), edge('cover', 'drum', 'cierra el conjunto')] },
    'El muelle une árbol y tambor mediante anclajes distintos; tapa y tambor forman la envolvente.',
  ),
  diagram(
    sectionId('block.mechanical.barrel', 'modelo-causal-ampliado'), 'visual.barrel.winding-discharge.v1', 'diagram.two-state-mechanism.v1',
    'Diferenciar el miembro que gira durante cuerda y durante marcha.', '¿Qué gira al dar cuerda y qué gira al descargar en un barrilete de marcha conceptual?',
    ['árbol durante cuerda', 'tambor durante marcha', 'muelle'],
    { title: 'Cuerda y descarga del barrilete', nodes: [node('wind-arbor', 'Cuerda: gira el árbol', undefined, 'Cuerda'), node('wind-drum', 'Tambor retenido', undefined, 'Cuerda'), node('spring', 'Muelle acumula deformación'), node('run-arbor', 'Árbol retenido', undefined, 'Marcha'), node('run-drum', 'Marcha: gira el tambor', undefined, 'Marcha')], edges: [edge('wind-arbor', 'spring', 'carga', 'energy'), edge('spring', 'run-drum', 'descarga', 'energy'), edge('wind-drum', 'run-arbor', 'miembros de referencia', 'comparison')] },
    'La cuerda y la marcha no se representan como el mismo giro; el modelo sigue siendo conceptual.',
    { visualDecision: 'content-specific-comparison', visualKind: 'comparison' },
  ),
  diagram(
    sectionId('block.mechanical.gear-pair', 'explicacion'), 'visual.gear-pair.ratio.v1', 'diagram.gear-pair-symbolic.v1',
    'Relacionar dientes, sentido, velocidad y par de forma simbólica.', '¿Cómo cambia la salida cuando Z1 conduce a Z2?',
    ['rueda conductora', 'piñón conducido', 'Z1', 'Z2', 'sentidos de giro'],
    { title: 'Pareja de engranajes externa', nodes: [node('driver', 'Conductora · Z1'), node('mesh', 'Engrane externo'), node('driven', 'Conducida · Z2')], edges: [edge('driver', 'mesh', 'giro horario'), edge('mesh', 'driven', 'giro antihorario')], formula: 'n₂ / n₁ = Z₁ / Z₂', annotations: ['Los sentidos son opuestos en un engrane externo.', 'La velocidad cambia inversamente al número de dientes; el par se describe aquí solo de forma cualitativa.'] },
    'Z1 y Z2 definen una relación simbólica; no se asignan números ni eficiencia no respaldados.',
  ),
  diagram(
    sectionId('block.mechanical.gear-pair', 'modelo-causal-ampliado'), 'visual.gear-pair.direction-torque.v1', 'diagram.gear-pair-effects.v1',
    'Separar dirección, velocidad y par como consecuencias distintas.', '¿Qué propiedades invierte el engrane y cuáles dependen de Z1/Z2?',
    ['dirección', 'velocidad', 'par cualitativo'],
    { title: 'Efectos de una pareja', nodes: [node('input', 'Entrada en Z1'), node('direction', 'Dirección opuesta'), node('speed', 'Velocidad según Z1/Z2'), node('torque', 'Par cualitativo inverso a la velocidad')], edges: [edge('input', 'direction'), edge('input', 'speed'), edge('speed', 'torque', 'sin eficiencia numérica')] },
    'Invertir el sentido es inevitable en un engrane externo; la magnitud de la relación requiere Z1 y Z2.',
  ),
  diagram(
    sectionId('block.mechanical.train', 'explicacion'), 'visual.train.real-order.v1', 'diagram.train-order.v1',
    'Reconocer el orden funcional del tren y sus interfaces.', '¿Qué rueda sigue a cuál y por qué la cuarta rueda importa?',
    ['barrilete', 'central', 'tercera', 'cuarta', 'escape', 'minutería'],
    { title: 'Orden del tren de marcha conceptual', nodes: [node('barrel', 'Barrilete'), node('center', 'Rueda central'), node('third', 'Tercera rueda'), node('fourth', 'Cuarta rueda'), node('escape', 'Rueda de escape'), node('motion', 'Minutería')], edges: [edge('barrel', 'center', 'engrane', 'energy'), edge('center', 'third', 'engrane', 'energy'), edge('third', 'fourth', 'engrane', 'energy'), edge('fourth', 'escape', 'engrane', 'energy'), edge('fourth', 'motion', 'salida de indicación', 'timing')] },
    'La cuarta rueda es la última rueda de marcha antes del escape y aporta una interfaz temporal hacia la indicación.',
  ),
  scene(sectionId('block.mechanical.train', 'modelo-causal-ampliado'), 'visual.train.3d-overview.v1', 'activity.mechanical.build-train', 'reader.3d.mechanical-train.overview', 'Aislar el tren conceptual dentro del fixture existente.', '¿Puedes localizar central, tercera, cuarta y escape sin confundir apoyos o indicación?', ['tren', 'aislamiento', 'orden']),
  scene(sectionId('block.mechanical.theory.train', 'ejemplo-resuelto'), 'visual.train.3d-fourth-interface.v1', 'activity.mechanical.build-train', 'reader.3d.mechanical-train.fourth-wheel', 'Examinar la interfaz cuarta rueda–escape.', '¿Qué par concreto transmite la salida del tren al escape?', ['cuarta rueda', 'piñón de escape'], 'inline-static-summary'),
  diagram(
    sectionId('block.mechanical.escapement', 'explicacion'), 'visual.escapement.phases.v1', 'diagram.cycle-phases.v1',
    'Ordenar las fases del escape de áncora suizo conceptual.', '¿Qué fase sigue a bloqueo y dónde se entrega el impulso?',
    ['bloqueo', 'desbloqueo', 'impulso', 'caída', 'reposo', 'seguridad'],
    { title: 'Ciclo conceptual del escape', nodes: [node('wheel', 'Rueda de escape'), node('pallet', 'Áncora'), node('balance', 'Volante')], edges: [edge('wheel', 'pallet', 'bloqueo'), edge('pallet', 'balance', 'impulso'), edge('balance', 'pallet', 'retorno', 'timing')], phases: [{ id: 'lock', label: 'Bloqueo' }, { id: 'unlock', label: 'Desbloqueo' }, { id: 'impulse', label: 'Impulso' }, { id: 'drop', label: 'Caída' }, { id: 'rest', label: 'Reposo' }, { id: 'safety', label: 'Seguridad' }] },
    'Bloqueo, impulso y caída son fases distintas; el esquema no autoriza un ajuste geométrico de calibre.',
    { visualDecision: 'content-specific-sequence', visualKind: 'sequence', technicalReviewRequired: true },
  ),
  diagram(
    sectionId('block.mechanical.theory.escapement', 'piezas-e-interfaces'), 'visual.escapement.interfaces.v1', 'diagram.escapement-interfaces.v1',
    'Distinguir rueda, caras de las paletas, áncora y volante.', '¿Dónde se produce bloqueo y dónde se transmite impulso?',
    ['rueda de escape', 'cara de bloqueo', 'cara de impulso', 'áncora', 'volante'],
    { title: 'Interfaces funcionales del escape', nodes: [node('escape-wheel', 'Rueda de escape'), node('locking-face', 'Cara de bloqueo'), node('impulse-face', 'Cara de impulso'), node('pallet', 'Áncora'), node('balance', 'Volante')], edges: [edge('escape-wheel', 'locking-face', 'bloqueo'), edge('escape-wheel', 'impulse-face', 'deslizamiento de impulso'), edge('impulse-face', 'pallet', 'transmite'), edge('pallet', 'balance', 'impulso')] },
    'Las caras de bloqueo e impulso cumplen funciones distintas aunque pertenezcan a la misma paleta.',
    { technicalReviewRequired: true },
  ),
  diagram(
    sectionId('block.mechanical.oscillator', 'explicacion'), 'visual.oscillator.feedback.v1', 'diagram.oscillator-loop.v1',
    'Relacionar inercia, elasticidad, retorno y pérdidas.', '¿Qué hace volver al volante y qué reduce su amplitud?',
    ['volante', 'espiral', 'eje', 'pivotes', 'amplitud', 'periodo', 'fricción'],
    { title: 'Oscilador volante–espiral', nodes: [node('balance', 'Volante · inercia'), node('hairspring', 'Espiral · retorno elástico'), node('staff', 'Eje y pivotes'), node('friction', 'Fricción · pérdidas'), node('period', 'Periodo'), node('amplitude', 'Amplitud')], edges: [edge('balance', 'hairspring', 'deforma'), edge('hairspring', 'balance', 'restaura'), edge('staff', 'friction', 'contacto'), edge('friction', 'amplitude', 'reduce'), edge('balance', 'period', 'repetición', 'timing')] },
    'La fricción reduce amplitud; no debe confundirse automáticamente con un cambio idéntico de frecuencia.',
  ),
  diagram(
    sectionId('block.mechanical.theory.oscillator', 'longitud-activa-y-regulacion'), 'visual.oscillator.active-length.v1', 'diagram.qualitative-comparison.v1',
    'Mostrar la influencia cualitativa de la longitud activa sin dar una tolerancia.', '¿Qué tendencia produce acortar o alargar la longitud activa de la espiral?',
    ['longitud activa', 'frecuencia', 'periodo'],
    { title: 'Longitud activa y tendencia', nodes: [node('short', 'Longitud activa menor', undefined, 'Comparación'), node('fast', 'Frecuencia tiende a aumentar', undefined, 'Comparación'), node('long', 'Longitud activa mayor', undefined, 'Comparación'), node('slow', 'Frecuencia tiende a disminuir', undefined, 'Comparación')], edges: [edge('short', 'fast', 'tendencia'), edge('long', 'slow', 'tendencia')] },
    'Se representa una tendencia cualitativa, no una cuantificación ni una instrucción de regulación.',
    { visualDecision: 'content-specific-comparison', visualKind: 'comparison' },
  ),
  diagram(
    sectionId('block.metrology.observe-before-measuring', 'explicacion-paso-a-paso'), 'visual.metrology.observe-first.v1', 'diagram.decision-path.v1',
    'Hacer visible la precedencia de observación, pregunta e instrumento.', '¿Qué decisión debe existir antes de elegir un instrumento?',
    ['observar', 'registrar', 'pregunta', 'magnitud', 'instrumento', 'medir', 'comparar'],
    { title: 'Observar antes de medir', nodes: [node('observe', 'Observar estado inicial'), node('record', 'Registrar sin interpretar'), node('question', 'Formular pregunta'), node('magnitude', 'Elegir magnitud'), node('instrument', 'Elegir instrumento'), node('measure', 'Medir'), node('compare', 'Comparar con criterio')], edges: [edge('observe', 'record', undefined, 'decision'), edge('record', 'question', undefined, 'decision'), edge('question', 'magnitude', undefined, 'decision'), edge('magnitude', 'instrument', undefined, 'decision'), edge('instrument', 'measure', undefined, 'decision'), edge('measure', 'compare', undefined, 'decision')] },
    'La medición responde a una pregunta; medir indiscriminadamente no sustituye la inspección inicial.',
  ),
  diagram(
    sectionId('block.horology.failure-prediction', 'explicacion-principal'), 'visual.failure-prediction.hypothesis.v1', 'diagram.diagnostic-loop.v1',
    'Separar síntoma, subsistema, hipótesis, prueba y decisión.', '¿Qué prueba distingue dos hipótesis rivales sin desmontar por inercia?',
    ['síntoma', 'subsistema', 'hipótesis', 'prueba discriminante', 'resultado', 'decisión'],
    { title: 'Cadena de diagnóstico', nodes: [node('symptom', 'Síntoma observado'), node('subsystem', 'Subsistema candidato'), node('hypothesis', 'Hipótesis rival'), node('test', 'Prueba discriminante'), node('result', 'Resultado registrado'), node('decision', 'Decisión revisable')], edges: [edge('symptom', 'subsystem', undefined, 'decision'), edge('subsystem', 'hypothesis', undefined, 'decision'), edge('hypothesis', 'test', undefined, 'decision'), edge('test', 'result', undefined, 'decision'), edge('result', 'decision', undefined, 'decision'), edge('decision', 'hypothesis', 'revisar si no discrimina', 'decision')] },
    'Una hipótesis no se confirma por repetición del síntoma; necesita una prueba que discrimine alternativas.',
  ),
  scene(sectionId('block.miyota8215.architecture', 'explicacion'), 'visual.miyota8215.architecture-overview.v1', 'activity.miyota8215.classify-subsystems', 'reader.3d.miyota8215.overview', 'Situar subsistemas reales dentro de un único fixture 8215.', '¿Dónde están automático, barrilete, tren, escape, regulación y calendario?', ['MIYOTA 8215', 'subsistemas', 'capas']),
  scene(sectionId('block.miyota8215.architecture', 'visual-e-interaccion'), 'visual.miyota8215.architecture-train.v1', 'activity.miyota8215.classify-subsystems', 'reader.3d.miyota8215.train-isolated', 'Aislar el tren sin crear otro calibre.', '¿Qué piezas reconoce el selector de tren del fixture 8215?', ['tren 8215', 'aislamiento']),
  scene(sectionId('block.miyota8215.architecture', 'ejemplo-resuelto'), 'visual.miyota8215.architecture-automatic.v1', 'activity.miyota8215.classify-subsystems', 'reader.3d.miyota8215.automatic-isolated', 'Comparar la vista general con el subsistema automático.', '¿Qué piezas permanecen al aislar la carga automática?', ['rotor', 'automático']),
  diagram(
    sectionId('block.miyota8215.guided-disassembly', 'explicacion'), 'visual.miyota8215.disassembly-sequence.v1', 'diagram.controlled-sequence.v1',
    'Separar estado previo, herramienta, pieza retirada y punto de control.', '¿Qué debe registrarse antes y después de retirar una pieza?',
    ['estado previo', 'herramienta', 'punto de control', 'pieza retirada', 'bandeja'],
    { title: 'Desmontaje guiado y reversible', nodes: [node('before', 'Estado previo registrado'), node('tool', 'Herramienta identificada'), node('checkpoint', 'Punto de control'), node('removed', 'Pieza retirada'), node('tray', 'Ubicación en bandeja'), node('verify', 'Estado posterior verificado')], edges: [edge('before', 'tool', undefined, 'decision'), edge('tool', 'checkpoint', undefined, 'decision'), edge('checkpoint', 'removed', undefined, 'decision'), edge('removed', 'tray', undefined, 'decision'), edge('tray', 'verify', undefined, 'decision')] },
    'El orden conserva trazabilidad; la interacción virtual no demuestra manipulación física.',
    { visualDecision: 'content-specific-sequence', visualKind: 'sequence', technicalReviewRequired: true },
  ),
  scene(sectionId('block.miyota8215.guided-disassembly', 'visual-e-interaccion'), 'visual.miyota8215.disassembly-rotor.v1', 'activity.miyota8215.remove-rotor', 'reader.3d.miyota8215.rotor-checkpoint', 'Mostrar la dependencia entre fijación y masa oscilante.', '¿Qué debe identificarse antes de considerar retirada la masa oscilante?', ['tornillo de rotor', 'masa oscilante', 'orden']),
  scene(sectionId('block.miyota8215.guided-disassembly', 'ejemplo-resuelto'), 'visual.miyota8215.disassembly-barrel-bridge.v1', 'activity.miyota8215.guided-disassembly', 'reader.3d.miyota8215.barrel-bridge-checkpoint', 'Mostrar un segundo punto de control sin acreditar banco.', '¿Cómo se separan fijación, puente y barrilete completo?', ['tornillos', 'puente', 'barrilete']),
  diagram(
    sectionId('block.miyota8215.inspection', 'explicacion'), 'visual.miyota8215.inspection-evidence.v1', 'diagram.inspection-evidence.v1',
    'Separar evidencia visible, incertidumbre, medición y decisión.', '¿Qué puedes concluir al observar y qué exige todavía medición?',
    ['pieza', 'defecto posible', 'evidencia', 'incertidumbre', 'medición', 'decisión'],
    { title: 'Inspección sin sobreinterpretar', nodes: [node('part', 'Pieza o sistema'), node('visible', 'Evidencia visible'), node('possible', 'Defecto posible'), node('uncertainty', 'Incertidumbre explícita'), node('measurement', 'Medición necesaria'), node('decision', 'Decisión')], edges: [edge('part', 'visible', undefined, 'decision'), edge('visible', 'possible', 'sugiere; no prueba', 'decision'), edge('possible', 'uncertainty', undefined, 'decision'), edge('uncertainty', 'measurement', undefined, 'decision'), edge('measurement', 'decision', undefined, 'decision')] },
    'La evidencia visual puede orientar una hipótesis, pero no sustituye una medición cuando el criterio es dimensional.',
    { technicalReviewRequired: true },
  ),
  scene(sectionId('block.miyota8215.inspection', 'visual-e-interaccion'), 'visual.miyota8215.inspection-train.v1', 'activity.miyota8215.inspect-parts', 'reader.3d.miyota8215.inspection-train', 'Localizar el sistema que se inspecciona.', '¿Qué elementos del tren están presentes y qué defectos no puede mostrar el fixture?', ['tren', 'incertidumbre']),
  scene(sectionId('block.miyota8215.inspection', 'ejemplo-resuelto'), 'visual.miyota8215.inspection-support.v1', 'activity.miyota8215.inspect-parts', 'reader.3d.miyota8215.inspection-support', 'Examinar una interfaz de apoyo sin inventar tolerancia.', '¿Qué relación espacial existe entre rueda de centro y su puente?', ['rueda de centro', 'puente', 'apoyo']),
  diagram(
    sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', 'resultado-buscado-y-condicion-segura'), 'visual.case.axial-stack.v1', 'diagram.axial-stack.v1',
    'Situar las interfaces de integración de un reloj completo.', '¿Qué capas y entradas deben ser compatibles antes del montaje final?',
    ['movimiento', 'aro', 'esfera', 'rehaut', 'cristal', 'tija', 'corona', 'tubo', 'fondo', 'juntas'],
    { title: 'Cadena axial e interfaces de caja', nodes: [node('crystal', 'Cristal'), node('rehaut', 'Rehaut'), node('dial', 'Esfera'), node('movement', 'Movimiento'), node('holder', 'Aro portamovimiento'), node('case', 'Carrura'), node('caseback', 'Fondo'), node('stem', 'Tija'), node('tube', 'Tubo'), node('crown', 'Corona'), node('gaskets', 'Juntas')], edges: [edge('crystal', 'rehaut', 'apoyo axial'), edge('rehaut', 'dial', 'separación'), edge('dial', 'movement', 'pies / sujeción'), edge('movement', 'holder', 'centrado'), edge('holder', 'case', 'interfaz radial'), edge('case', 'caseback', 'cierre'), edge('movement', 'stem', 'eje de mando'), edge('stem', 'crown', 'accionamiento'), edge('crown', 'tube', 'guiado y sellado'), edge('gaskets', 'case', 'cadena de sellado')] },
    'La compatibilidad es una cadena de interfaces; el diagrama no asigna diámetros, alturas ni hermeticidad.',
    { technicalReviewRequired: true },
  ),
  diagram(
    sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', '3-linea-de-tija'), 'visual.case.stem-line.v1', 'diagram.interface-chain.v1',
    'Relacionar movimiento, tija, tubo y corona sin asumir cotas.', '¿Qué cuatro interfaces deben compartir eje y libertad de movimiento?',
    ['movimiento', 'tija', 'tubo', 'corona'],
    { title: 'Línea funcional de tija', nodes: [node('movement', 'Movimiento · salida de mando'), node('stem', 'Tija'), node('tube', 'Tubo de caja'), node('crown', 'Corona')], edges: [edge('movement', 'stem', 'acoplamiento'), edge('stem', 'tube', 'paso y guiado'), edge('tube', 'crown', 'guiado y sellado')] },
    'Alineación y libertad deben verificarse con documentación y componentes reales; no se infiere una medida.',
    { technicalReviewRequired: true },
  ),
] as const

const VISUAL_BY_SECTION = new Map(VISUAL_DEFINITIONS.map((definition) => [definition.sectionId, definition]))

export function academySectionVisualCuration(input: {
  lessonId: string
  section: AcademyReaderSection
  contentHash: string
  sectionHash: string
  activities: readonly LearningActivityDescriptor[]
  sourceIds: string[]
}): AcademySectionVisualCuration | undefined {
  const { lessonId, section, contentHash, sectionHash, activities, sourceIds } = input
  const deepPilot = ACADEMY_DEEP_VISUAL_PILOT_IDS.has(lessonId)
  const supportingPilot = ACADEMY_SUPPORTING_VISUAL_PILOT_IDS.has(lessonId)
  if (!deepPilot && !supportingPilot) return undefined
  const definition = VISUAL_BY_SECTION.get(section.sectionId)
  if (definition) {
    const activity = definition.activityId ? activities.find(({ id }) => id === definition.activityId) : undefined
    const visualState = academy3dVisualState(definition.visualStateId)
    const diagramSpecific = definition.diagramData ? academyDiagramIsContentSpecific(definition.diagramData) : false
    return {
      curationId: `curation.0.14d.${lessonId}.${section.sectionId}`,
      lessonId,
      sectionId: section.sectionId,
      contentHash,
      sectionHash,
      pedagogicalPurpose: definition.pedagogicalPurpose,
      pedagogicalQuestion: definition.pedagogicalQuestion,
      essentialConcepts: definition.essentialConcepts,
      visualDecision: definition.visualDecision,
      visualDesignId: definition.visualDesignId,
      visualKind: definition.visualKind,
      diagramSchemaId: definition.diagramSchemaId,
      diagramData: definition.diagramData,
      fixtureBinding: activity?.fixtureBinding,
      activityId: definition.activityId,
      visualStateId: definition.visualStateId,
      cameraPreset: visualState?.camera.presetId,
      selectorIds: visualState?.selectedIds ?? [],
      isolationIds: visualState?.isolatedIds ?? [],
      transparencyById: visualState?.transparency ?? {},
      explodedState: visualState && Object.keys(visualState.explosion).length ? 'registry-defined' : undefined,
      animationState: visualState?.animation,
      labelDefinitions: visualState?.labels ?? definition.diagramData?.nodes.map(({ id, label, detail }) => ({ id: `label.${id}`, label, targetId: id, description: detail })) ?? [],
      expectedObservation: definition.expectedObservation,
      misconceptionAddressed: definition.misconceptionAddressed,
      readingModePolicy: definition.readingModePolicy,
      fidelity: definition.fidelity,
      limitations: [
        ...definition.limitations,
        ...(definition.visualKind === 'scene-3d' && !activity ? ['La actividad exacta no está disponible; se mostrará una alternativa textual.'] : []),
        ...(definition.diagramData && !diagramSpecific ? ['El payload no supera la prueba de especificidad semántica.'] : []),
      ],
      sourceBasis: sourceIds,
      curationMethod: 'codex-assisted-section-curation',
      ownerReviewStatus: 'owner-review-pending',
      technicalReviewStatus: definition.technicalReviewRequired ? 'technical-expert-review-pending' : 'not-required',
      notes: ['Curación específica de 0.14D; no implica aprobación propietaria.'],
    }
  }
  const sourceBlocked = supportingPilot && !['sources', 'checkpoint'].includes(section.role)
  return {
    curationId: `curation.0.14d.${lessonId}.${section.sectionId}`,
    lessonId,
    sectionId: section.sectionId,
    contentHash,
    sectionHash,
    pedagogicalPurpose: sourceBlocked
      ? 'Registrar que el apilamiento axial necesita documentación dimensional fiable.'
      : 'Conservar el apartado sin añadir una imagen decorativa o redundante.',
    pedagogicalQuestion: `¿Necesita «${section.title}» un apoyo visual independiente para conservar su significado?`,
    essentialConcepts: [],
    visualDecision: sourceBlocked ? 'source-review-required' : 'text-sufficient',
    visualKind: 'none',
    selectorIds: [],
    isolationIds: [],
    transparencyById: {},
    labelDefinitions: [],
    expectedObservation: sourceBlocked
      ? 'No se presenta una geometría dimensional sin fuente oficial suficiente.'
      : 'El texto conserva toda la información necesaria del apartado.',
    readingModePolicy: 'omit',
    fidelity: 'not-applicable',
    limitations: sourceBlocked
      ? ['Pendiente de documentación dimensional y revisión relojera; no se inventan alturas ni diámetros.']
      : ['Decisión editorial asistida pendiente de revisión propietaria.'],
    sourceBasis: sourceIds,
    curationMethod: deepPilot || supportingPilot ? 'codex-assisted-section-curation' : 'automated-structural-decision',
    ownerReviewStatus: 'owner-review-pending',
    technicalReviewStatus: sourceBlocked ? 'technical-expert-review-pending' : 'not-required',
    gapReason: sourceBlocked ? 'Documentación insuficiente para una visual dimensional fiable.' : undefined,
    notes: sourceBlocked ? ['Supporting pilot 0.14D: gap explícito, sin placeholder.'] : ['Texto suficiente según función del apartado.'],
  }
}

export function academyVisualDefinitions(): readonly VisualDefinition[] {
  return VISUAL_DEFINITIONS
}

export function academyDiagramPayloadHash(data: AcademyDiagramData | undefined): string | undefined {
  return data ? academyReaderPayloadHash(data) : undefined
}
