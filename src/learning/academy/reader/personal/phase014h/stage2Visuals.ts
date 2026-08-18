import { academyReaderStableHash } from '../../academyReaderIdentity'
import type { AcademyDiagramData, AcademyReaderSection, AcademySectionVisualCuration } from '../../academyReaderModel'
import type { AcademySourceLocator, AcademyStage2VisualDesign } from '../types'
import { ACADEMY_STAGE_2_CATALOG } from './stage2Catalog'
import { academyStage2SectionId } from './stage2Sections'

interface VisualSpec {
  visualDesignId: string
  questionGroupId: string
  question: string
  title: string
  nodes: readonly [string, string, string][]
  edges: readonly [string, string, string][]
  source: AcademySourceLocator
  limitation: string
}

const toh = (chapter: 'ch04' | 'ch05' | 'ch06' | 'ch07' | 'ch08' | 'ch09', page: string, figure?: string): AcademySourceLocator => ({
  sourceId: `source.private.toh.${chapter}`,
  documentLocator: `reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ${chapter === 'ch04' || chapter === 'ch05' ? 'ch 4&5' : `ch ${chapter.slice(2)}`}.pdf`,
  page, ...(figure ? { figure } : {}), verificationMethod: 'visual-pdf-inspection', verifiedAt: '2026-08-15',
})

const specs: readonly VisualSpec[] = [
  { visualDesignId: 'visual.mechanical-energy.flow', questionGroupId: 'q01-energy-flow', question: '¿Por dónde circula la energía y dónde se limita su entrega?', title: 'Flujo de energía mecánica', nodes: [['spring','Muelle','almacena'],['barrel','Barrilete','entrega par'],['train','Tren','transmite'],['escape','Escape','dosifica']], edges: [['spring','barrel','descarga'],['barrel','train','par'],['train','escape','avance']], source: toh('ch04','PDF 2 / impresa 46','Fig. 4-4'), limitation: 'Flujo conceptual, sin pérdidas cuantitativas.' },
  { visualDesignId: 'visual.stage2.energy-quantities.v1', questionGroupId: 'q02-energy-quantities', question: '¿Qué diferencia energía, par, potencia y velocidad?', title: 'Magnitudes no intercambiables', nodes: [['energy','Energía','capacidad'],['torque','Par','tendencia de giro'],['power','Potencia','transferencia por tiempo'],['speed','Velocidad','cambio de posición']], edges: [['energy','power','transferida en tiempo'],['torque','speed','variables distintas']], source: toh('ch04','PDF 2 / impresa 46'), limitation: 'No se muestran valores ni una fórmula aplicable.' },
  { visualDesignId: 'visual.barrel.anatomy', questionGroupId: 'q03-barrel-anatomy', question: '¿Dónde están árbol, muelle, tambor y tapa?', title: 'Anatomía funcional del barrilete', nodes: [['cover','Tapa','cierra y apoya'],['arbor','Árbol','recibe cuerda'],['spring','Muelle','almacena'],['drum','Tambor','entrega al tren']], edges: [['arbor','spring','gancho interior'],['spring','drum','gancho exterior'],['cover','drum','cierre']], source: toh('ch04','PDF 2 / impresa 46','Fig. 4-4'), limitation: 'Despiece esquemático; no guía una apertura.' },
  { visualDesignId: 'visual.barrel.winding-discharge', questionGroupId: 'q04-barrel-states', question: '¿Qué gira durante la cuerda y durante la marcha?', title: 'Estados del barrilete', nodes: [['wind','Cuerda','árbol accionado'],['hold-drum','Tambor retenido','estado de carga'],['hold-arbor','Árbol retenido','estado de marcha'],['run','Marcha','tambor entrega']], edges: [['wind','hold-drum','carga'],['hold-arbor','run','descarga']], source: toh('ch04','PDF 2 / impresa 46'), limitation: 'Estados relativos; no representa fuerzas reales.' },
  { visualDesignId: 'visual.stage2.barrel-states.v1', questionGroupId: 'q04-barrel-states', question: '¿Cómo cambia el estado del acumulador entre carga y entrega?', title: 'Carga, reserva y entrega', nodes: [['low','Reserva baja','estado'],['charged','Reserva mayor','estado'],['delivery','Entrega','salida al tren']], edges: [['low','charged','cuerda'],['charged','delivery','marcha']], source: toh('ch04','PDF 2 / impresa 46'), limitation: 'No es una curva de par ni una reserva de calibre.' },
  { visualDesignId: 'visual.gear-pair.ratio', questionGroupId: 'q05-gear-pair', question: '¿Cómo cambian relación y sentido en una pareja?', title: 'Pareja de engrane externa', nodes: [['driver','Conductora Z₁','entrada'],['driven','Conducida Z₂','salida']], edges: [['driver','driven','engrane: invierte sentido']], source: toh('ch05','PDF 9 / impresa 53','Fig. 5-10'), limitation: 'Modelo ideal sin pérdidas ni depthing.' },
  { visualDesignId: 'visual.gear-pair.direction-torque', questionGroupId: 'q05-gear-pair', question: '¿Qué predice la pareja sobre dirección y adaptación?', title: 'Dirección, velocidad y par ideal', nodes: [['input','Entrada','sentido A'],['interface','Contacto','círculos primitivos'],['output','Salida','sentido opuesto']], edges: [['input','interface','conduce'],['interface','output','adapta']], source: toh('ch05','PDF 9 / impresa 53','Fig. 5-10'), limitation: 'No predice eficiencia o resistencia.' },
  { visualDesignId: 'visual.train.real-order', questionGroupId: 'q06-compound-train', question: '¿Cómo se enlazan ruedas y piñones solidarios?', title: 'Tren por ejes e interfaces', nodes: [['axis1','Eje 1','rueda conductora'],['axis2','Eje 2','piñón y rueda solidarios'],['axis3','Eje 3','salida']], edges: [['axis1','axis2','engrane 1'],['axis2','axis3','engrane 2']], source: toh('ch05','PDF 12 / impresa 56','Fig. 5-15'), limitation: 'No reproduce la planta de un calibre.' },
  { visualDesignId: 'visual.train.3d-overview', questionGroupId: 'q06-compound-train', question: '¿Qué añade una vista espacial del tren?', title: 'Vista espacial conceptual del tren', nodes: [['barrel','Barrilete','entrada'],['centres','Ejes sucesivos','interfaces'],['escape','Rueda de escape','salida']], edges: [['barrel','centres','transmite'],['centres','escape','entrega']], source: toh('ch05','PDF 12 / impresa 56'), limitation: 'Se reutiliza el estado 3D conceptual de 0.14E; no es un fixture de calibre.' },
  { visualDesignId: 'visual.stage2.compound-train.v1', questionGroupId: 'q06-compound-train', question: '¿Qué factores forman la relación total?', title: 'Producto de etapas activas', nodes: [['stage1','Etapa 1','Z₁/Z₂'],['shaft','Eje común','misma velocidad'],['stage2','Etapa 2','Z₃/Z₄']], edges: [['stage1','shaft','solidario'],['shaft','stage2','continúa']], source: toh('ch05','PDF 12 / impresa 56','Fig. 5-15'), limitation: 'Solo representa las etapas declaradas.' },
  { visualDesignId: 'visual.stage2.going-vs-motion.v1', questionGroupId: 'q07-going-vs-motion', question: '¿Qué diferencia el tren de rodaje de la minutería?', title: 'Ruta al escape y rama de indicación', nodes: [['source','Barrilete','entrada'],['going','Tren de rodaje','hacia escape'],['motion','Minutería','hacia agujas'],['display','Indicación','salida']], edges: [['source','going','energía'],['going','motion','derivación'],['motion','display','indica']], source: toh('ch05','PDF 18 / impresa 62','Fig. 5-26'), limitation: 'Arquitectura funcional, no disposición universal.' },
  { visualDesignId: 'visual.escapement.interfaces', questionGroupId: 'q08-escapement-anatomy', question: '¿Qué órganos se encuentran en las interfaces del escape?', title: 'Anatomía del escape de áncora', nodes: [['wheel','Rueda de escape','tren'],['pallets','Paletas y áncora','bloqueo e impulso'],['roller','Rodillo y clavija','oscilador']], edges: [['wheel','pallets','contacto'],['pallets','roller','horquilla']], source: toh('ch06','PDF 3 / impresa 101','Figs. 6-6 y 6-7'), limitation: 'No es geometría de ajuste.' },
  { visualDesignId: 'visual.escapement.phases', questionGroupId: 'q09-escapement-cycle', question: '¿Cómo se suceden bloqueo, desbloqueo, impulso y caída?', title: 'Ciclo funcional del escape', nodes: [['lock','Bloqueo','retiene'],['unlock','Desbloqueo','libera'],['impulse','Impulso','transfiere'],['drop','Caída','avanza al bloqueo']], edges: [['lock','unlock','oscilador'],['unlock','impulse','contacto'],['impulse','drop','salida'],['drop','lock','siguiente paleta']], source: toh('ch06','PDF 8 / impresa 106','Tabla 6.3.1'), limitation: 'No importa ángulos ni velocidad real.' },
  { visualDesignId: 'visual.stage2.escapement-safety.v1', questionGroupId: 'q10-escapement-safety', question: '¿Qué evita contactos o liberaciones indebidas?', title: 'Funciones de seguridad del escape', nodes: [['horns','Cuernos','guían interfaz'],['guard','Dardo/seguro','limita desplazamiento'],['roller','Rodillo de seguridad','condición geométrica']], edges: [['guard','roller','controla'],['horns','roller','interfaz']], source: toh('ch06','PDF 3 / impresa 101','Fig. 6-6'), limitation: 'No prescribe holguras o correcciones.' },
  { visualDesignId: 'visual.oscillator.active-length', questionGroupId: 'q11-frequency-amplitude', question: '¿Dónde se sitúan inercia, retorno y longitud activa?', title: 'Volante y espiral', nodes: [['balance','Volante','inercia'],['spring','Espiral','retorno'],['collet','Virola','fijación interior'],['stud','Pitón','fijación exterior']], edges: [['spring','balance','par restaurador'],['collet','spring','une'],['spring','stud','termina']], source: toh('ch07','PDF 5 / impresa 133','Figs. 7-8 a 7-10'), limitation: 'No muestra deformación ni ajuste real.' },
  { visualDesignId: 'visual.stage2.frequency-amplitude.v1', questionGroupId: 'q11-frequency-amplitude', question: '¿Cómo se distinguen frecuencia y amplitud?', title: 'Periodo, frecuencia y amplitud', nodes: [['left','Extremo A','amplitud'],['centre','Equilibrio','máxima velocidad cualitativa'],['right','Extremo B','amplitud'],['cycle','Ciclo','periodo completo']], edges: [['left','centre','media alternancia'],['centre','right','media alternancia'],['right','cycle','retorno']], source: toh('ch07','PDF 5 / impresa 133','Fig. 7-10'), limitation: 'Curva cualitativa, sin marcha medida.' },
  { visualDesignId: 'visual.oscillator.feedback', questionGroupId: 'q12-feedback-loop', question: '¿Cómo se relacionan impulso y liberación?', title: 'Bucle escape–oscilador', nodes: [['escape','Escape','entrega impulso'],['oscillator','Oscilador','marca liberación'],['loss','Pérdidas','reducen amplitud']], edges: [['escape','oscillator','energía'],['oscillator','escape','temporización'],['loss','oscillator','amortigua']], source: toh('ch06','PDF 8 / impresa 106'), limitation: 'No es simulación dinámica.' },
  { visualDesignId: 'visual.stage2.feedback-loop.v1', questionGroupId: 'q12-feedback-loop', question: '¿Por qué el sistema no es una cadena unidireccional?', title: 'Dos direcciones del conjunto regulador', nodes: [['train','Tren','tendencia al avance'],['escape','Escape','dosifica'],['oscillator','Oscilador','referencia']], edges: [['train','escape','energía'],['escape','oscillator','impulso'],['oscillator','escape','liberación']], source: toh('ch06','PDF 8 / impresa 106'), limitation: 'Sin fuerzas ni geometría cuantitativa.' },
  { visualDesignId: 'visual.stage2.keyless-states.v1', questionGroupId: 'q13-keyless-states', question: '¿Qué ruta activa cada posición de corona?', title: 'Estados del sistema sin llave', nodes: [['crown','Corona y tija','entrada'],['select','Selección','posición axial'],['wind','Cuerda','ruta A'],['set','Puesta en hora','ruta B']], edges: [['crown','select','desplaza y gira'],['select','wind','estado cuerda'],['select','set','estado puesta']], source: toh('ch05','PDF 18 / impresa 62','Fig. 5-26'), limitation: 'Estados conceptuales; no operación física.' },
  { visualDesignId: 'visual.stage2.automatic-flow.v1', questionGroupId: 'q14-automatic-flow', question: '¿Cómo llega el movimiento del usuario al muelle?', title: 'Ruta funcional de carga automática', nodes: [['wearer','Movimiento del usuario','entrada'],['rotor','Masa oscilante','captación'],['reduction','Tren reductor','transmite'],['spring','Muelle','almacena']], edges: [['wearer','rotor','mueve'],['rotor','reduction','gira'],['reduction','spring','carga']], source: toh('ch08','PDF 3 / impresa 171','Figs. 8-6 y 8-7'), limitation: 'No universaliza inversión, eficiencia o sentido.' },
  { visualDesignId: 'visual.stage2.calendar-sequence.v1', questionGroupId: 'q15-calendar-sequence', question: '¿Cómo se convierte movimiento continuo en un cambio de fecha?', title: 'Secuencia de calendario simple', nodes: [['hour','Rueda de horas','entrada lenta'],['drive','Arrastre','transmite'],['date','Estrella o disco','salta'],['jumper','Jumper','retiene']], edges: [['hour','drive','reduce'],['drive','date','activa'],['jumper','date','posiciona']], source: toh('ch09','PDF 3 / impresa 191','Fig. 9-5'), limitation: 'No define zona segura ni procedimiento de corrección.' },
  { visualDesignId: 'visual.stage2.control-states.v1', questionGroupId: 'q15-calendar-sequence', question: '¿Cómo se comparan estados discretos de calendario y cronógrafo?', title: 'Control de estados como ampliación', nodes: [['input','Mando o arrastre','entrada'],['state','Estado controlado','transición'],['output','Indicación','resultado']], edges: [['input','state','activa'],['state','output','conserva']], source: toh('ch09','PDF 3 / impresa 191'), limitation: 'La analogía no identifica una arquitectura de cronógrafo.' },
]

const payload = (spec: VisualSpec): AcademyDiagramData => ({
  title: spec.title,
  nodes: spec.nodes.map(([id, label, detail], index) => ({ id, label, detail, emphasis: index === 0 ? 'primary' : 'normal' })),
  edges: spec.edges.map(([from, to, label]) => ({ from, to, label, kind: 'mechanical' })),
  annotations: ['Las etiquetas y relaciones transmiten la información sin depender del color.'],
})

const describeRelations = (spec: VisualSpec): string => {
  const labels = new Map(spec.nodes.map(([id, label]) => [id, label]))
  return spec.edges
    .map(([from, to, relation]) => `${labels.get(from) ?? from} se relaciona con ${labels.get(to) ?? to}: ${relation}`)
    .join('. ')
}

export const ACADEMY_STAGE_2_VISUAL_DESIGNS: readonly (AcademyStage2VisualDesign & { questionGroupId: string })[] = specs.map((spec) => {
  const lessonIds = ACADEMY_STAGE_2_CATALOG.filter(({ visualDesignIds }) => visualDesignIds.includes(spec.visualDesignId)).map(({ lessonId }) => lessonId)
  const sectionIds = lessonIds.map((lessonId) => academyStage2SectionId.visual(lessonId, spec.visualDesignId))
  const semanticPayload = payload(spec)
  return {
    visualDesignId: spec.visualDesignId, questionGroupId: spec.questionGroupId, lessonIds, sectionIds,
    pedagogicalQuestion: spec.question, semanticPayload, sourceIds: [spec.source.sourceId], sourceLocators: [spec.source],
    fidelity: 'conceptual', limitations: [spec.limitation], accessibilitySummary: `${spec.title}: ${spec.nodes.map(([, label]) => label).join(', ')}.`,
    longDescription: `${spec.title}. ${describeRelations(spec)}. ${spec.limitation}`,
    implementationStatus: spec.visualDesignId.startsWith('visual.stage2.') ? 'implemented' : 'reused-and-versioned',
    contentHash: academyReaderStableHash([spec.question, spec.title, spec.limitation].join('\n')),
    visualHash: academyReaderStableHash(JSON.stringify(semanticPayload)), colorIndependent: true, reducedMotionSafe: true,
  }
})

export const ACADEMY_STAGE_2_ESSENTIAL_VISUAL_QUESTION_COUNT = new Set(ACADEMY_STAGE_2_VISUAL_DESIGNS.map(({ questionGroupId }) => questionGroupId)).size

export function academyStage2VisualForSection(sectionId: string) {
  return ACADEMY_STAGE_2_VISUAL_DESIGNS.find(({ sectionIds }) => sectionIds.includes(sectionId))
}

export function academyStage2SectionVisualCuration(input: { lessonId: string; section: AcademyReaderSection; contentHash: string }): AcademySectionVisualCuration | undefined {
  const design = academyStage2VisualForSection(input.section.sectionId)
  if (!design || !design.lessonIds.includes(input.lessonId)) return undefined
  return {
    curationId: `curation.0.14h.${design.visualDesignId}.${academyReaderStableHash(input.section.sectionId)}`,
    lessonId: input.lessonId, sectionId: input.section.sectionId, contentHash: input.contentHash, sectionHash: academyReaderStableHash(input.section.markdown),
    pedagogicalPurpose: design.semanticPayload.title, pedagogicalQuestion: design.pedagogicalQuestion,
    essentialConcepts: design.semanticPayload.nodes.map(({ label }) => label), visualDecision: 'content-specific-diagram', visualDesignId: design.visualDesignId,
    visualKind: 'diagram', diagramSchemaId: `diagram.${design.visualDesignId}.semantic`, diagramData: design.semanticPayload,
    selectorIds: [], isolationIds: [], transparencyById: {}, labelDefinitions: design.semanticPayload.nodes.map(({ id, label, detail }) => ({ id, label, description: detail })),
    expectedObservation: design.longDescription, readingModePolicy: 'inline-essential', fidelity: design.fidelity, limitations: [...design.limitations],
    sourceBasis: [...design.sourceIds], curationMethod: 'codex-assisted-personal-curation', ownerReviewStatus: 'owner-review-pending', technicalReviewStatus: 'not-required', technicalStatus: 'source-reviewed',
    notes: ['SVG semántico original, adaptable a móvil y seguro con movimiento reducido; revisión personal pendiente.'],
  }
}
