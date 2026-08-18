import { academyReaderStableHash } from '../../academyReaderIdentity'
import type { AcademyDiagramData, AcademyReaderSection, AcademySectionVisualCuration } from '../../academyReaderModel'
import type { AcademySourceLocator, AcademyStage0PhotoBrief, AcademyStage3VisualDesign } from '../types'
import { ACADEMY_STAGE_3_CATALOG } from './stage3Catalog'
import { academyStage3SectionId } from './stage3Sections'

interface Spec {
  visualDesignId: string
  questionId: string
  question: string
  title: string
  lessonIds: readonly string[]
  nodes: readonly [string, string, string][]
  edges: readonly [string, string, string][]
  source: AcademySourceLocator
  limitation: string
}

const vim = (section: string): AcademySourceLocator => ({ sourceId: 'source.metrology.bipm.vim', documentLocator: 'https://www.bipm.org/en/doi/10.59161/jcgm200-2012', section, verificationMethod: 'official-document' })
const educational = (sourceId: string, title: string): AcademySourceLocator => ({ sourceId, documentLocator: title, verificationMethod: 'source-limited' })
const tm = (): AcademySourceLocator => ({ sourceId: 'source.official.tm9-1575.inspection', documentLocator: 'reference-library/originals/TM 9-1575.pdf', page: 'PDF 25–27 · impresas 12–14', section: 'III', verificationMethod: 'visual-pdf-inspection', verifiedAt: '2026-08-18' })

const specs: readonly Spec[] = [
  { visualDesignId: 'visual.stage3.finding-record.v1', questionId: 'q03-finding', question: '¿Cómo se estructura un hallazgo?', title: 'Hallazgo trazable', lessonIds: ['lesson.metrology.inspection-findings'], nodes: [['object','Objeto y zona','localización'],['condition','Condición observada','sin causa'],['evidence','Medio y evidencia','condiciones'],['hypotheses','Hipótesis rivales','abiertas'],['next','Siguiente comprobación','confianza']], edges: [['object','condition','delimita'],['condition','evidence','documenta'],['evidence','hypotheses','permite'],['hypotheses','next','diferencia']], source: vim('§2.3 y vocabulario de medición'), limitation: 'Plantilla educativa; no clasifica automáticamente defectos.' },
  { visualDesignId: 'visual.stage3.historical-boundary.v1', questionId: 'q02-baseline', question: '¿Qué se registra antes de intervenir?', title: 'Método histórico y frontera actual', lessonIds: ['lesson.encyclopedia.service-tribology.tm-inspeccion-previa'], nodes: [['observe','Orden de observación','principio útil'],['record','Registro previo','conserva evidencia'],['historic','Dato de 1945','contexto'],['modern','Fuente actual','obligatoria para operación']], edges: [['observe','record','aplica'],['historic','modern','no se transfiere']], source: tm(), limitation: 'No contiene valores, sustancias ni pasos operativos del manual.' },
  { visualDesignId: 'visual.stage3.measurement-terms.v1', questionId: 'q06-terms', question: '¿Qué diferencia resolución, precisión, exactitud e incertidumbre?', title: 'Cuatro lecturas distintas de un resultado', lessonIds: ['lesson.metrology.units-scale-resolution', 'lesson.metrology.precision-accuracy-uncertainty'], nodes: [['result','Resultado de medición','objeto común'],['resolution','Resolución','incremento mostrado'],['precision','Precisión','proximidad entre repeticiones'],['accuracy','Exactitud','proximidad a una referencia'],['uncertainty','Incertidumbre','duda asociada al resultado']], edges: [['result','resolution','qué detalle muestra'],['result','precision','cómo se agrupan las repeticiones'],['result','accuracy','cómo se relaciona con la referencia'],['result','uncertainty','qué duda acompaña al valor']], source: vim('§§2.13, 2.15, 2.26 y 4.14'), limitation: 'Los cuatro conceptos se comparan en paralelo: ninguno se deduce automáticamente de otro.' },
  { visualDesignId: 'visual.stage3.instrument-choice.v1', questionId: 'q05-instrument', question: '¿Cómo se elige un instrumento?', title: 'De la pregunta al instrumento', lessonIds: ['lesson.metrology.instruments'], nodes: [['question','Magnitud y pregunta','entrada'],['geometry','Rango, acceso y geometría','condición'],['interaction','Fuerza, alineación y riesgo','interfaz'],['instrument','Instrumento y método','decisión'],['record','Unidad, referencia y resolución','registro']], edges: [['question','geometry','delimita'],['geometry','interaction','condiciona'],['interaction','instrument','selecciona'],['instrument','record','produce']], source: vim('§3.1 y capítulo 4'), limitation: 'No recomienda marca, modelo o calibración concreta.' },
  { visualDesignId: 'visual.stage3.repeat-measurement.v1', questionId: 'q08-repeat', question: '¿Por qué se repite una medición?', title: 'Serie, dispersión y duda', lessonIds: ['lesson.metrology.physical-measurement'], nodes: [['method','Método declarado','constante'],['read1','Lectura 1','resultado'],['read2','Lectura 2','resultado'],['read3','Lectura 3','resultado'],['series','Serie registrada','dispersión'],['limit','Incertidumbre y límite','conclusión']], edges: [['method','read1','aplica'],['method','read2','repite'],['method','read3','repite'],['read1','series','integra'],['read2','series','integra'],['read3','series','integra'],['series','limit','informa']], source: vim('§§2.20 y 2.26'), limitation: 'No calcula una incertidumbre ni demuestra exactitud.' },
  { visualDesignId: 'visual.stage3.comparability.v1', questionId: 'q09-compare', question: '¿Cuándo dos medidas son comparables?', title: 'Puertas de comparabilidad', lessonIds: ['lesson.metrology.compare-data'], nodes: [['magnitude','Misma magnitud','puerta 1'],['unit','Unidad compatible','puerta 2'],['datum','Referencia geométrica','datum y método'],['condition','Condición y orientación','puerta 4'],['uncertainty','Redondeo e incertidumbre','puerta 5'],['comparison','Comparación permitida','salida']], edges: [['magnitude','unit','comprueba'],['unit','datum','comprueba'],['datum','condition','comprueba'],['condition','uncertainty','comprueba'],['uncertainty','comparison','habilita']], source: educational('source.metrology.original-course', 'Síntesis educativa original del curso de metrología'), limitation: 'No crea un criterio de aceptación.' },
  { visualDesignId: 'visual.stage3.acceptance-authority.v1', questionId: 'q15-acceptance', question: '¿De dónde procede un criterio de aceptación?', title: 'Autoridad del criterio', lessonIds: ['lesson.encyclopedia.service-tribology.diagnostico-y-control-final', 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control'], nodes: [['manufacturer','Fabricante','aplicabilidad'],['design','Diseño','requisito'],['measurement','Medición propia','resultado'],['educational','Criterio educativo','aprendizaje'],['historic','Comparación histórica','no vigente'],['unknown','Dato pendiente','bloquea afirmación']], edges: [['manufacturer','measurement','se comprueba con'],['design','measurement','se valida con'],['educational','unknown','no sustituye'],['historic','unknown','requiere corroboración']], source: educational('source.institutional.awci.standards', 'AWCI Official Standards and Practices for Watchmakers (2011)'), limitation: 'No contiene valores; el fabricante conserva prioridad para un calibre concreto.' },
]

const diagram = (spec: Spec): AcademyDiagramData => ({
  title: spec.title,
  nodes: spec.nodes.map(([id, label, detail], index) => ({ id, label, detail, emphasis: index === 0 ? 'primary' : id === 'historic' || id === 'unknown' ? 'warning' : 'normal' })),
  edges: spec.edges.map(([from, to, label]) => ({ from, to, label, kind: 'decision' })),
  annotations: ['Orden, etiquetas y patrones conservan el significado sin depender del color.'],
})

const describeRelations = (spec: Spec): string => {
  const labels = new Map(spec.nodes.map(([id, label]) => [id, label]))
  return spec.edges
    .map(([from, to, relation]) => `${labels.get(from) ?? from} se relaciona con ${labels.get(to) ?? to}: ${relation}`)
    .join('. ')
}

export const ACADEMY_STAGE_3_VISUAL_DESIGNS: readonly (AcademyStage3VisualDesign & { questionId: string })[] = specs.map((spec) => {
  const semanticPayload = diagram(spec)
  return {
    visualDesignId: spec.visualDesignId, questionId: spec.questionId, lessonIds: spec.lessonIds,
    sectionIds: spec.lessonIds.map((lessonId) => academyStage3SectionId.visual(lessonId, spec.visualDesignId)),
    pedagogicalQuestion: spec.question, semanticPayload, sourceIds: [spec.source.sourceId], sourceLocators: [spec.source],
    fidelity: 'conceptual', limitations: [spec.limitation], accessibilitySummary: `${spec.title}: ${spec.nodes.map(([, label]) => label).join(', ')}.`,
    longDescription: `${spec.title}. ${describeRelations(spec)}. ${spec.limitation}`,
    implementationStatus: 'implemented', contentHash: academyReaderStableHash([spec.question, spec.title, spec.limitation].join('\n')),
    visualHash: academyReaderStableHash(JSON.stringify(semanticPayload)), colorIndependent: true, reducedMotionSafe: true,
  }
})

export const ACADEMY_STAGE_3_REUSED_VISUALS = [
  'visual.metrology.observe-first.v1', 'visual.failure-prediction.hypothesis.v1', 'visual.intake.baseline-sequence.v1',
  'visual.diagnosis.final-control.v1', 'visual.diagnosis.tm-symptom-tree.v1', 'visual.diagnosis.cleaning-inspection.v1',
  'visual.tribology.contact-function.v1', 'visual.assembly.control-gates.v1', 'visual.assembly.reasoned-example.v1',
] as const

const photo = (subject: string): AcademyStage0PhotoBrief => ({
  photoBriefId: `photo-brief.014i.${subject}`, subject, scale: 'macro con escala visible', angle: 'frontal y rasante', lighting: 'difusa y rasante documentadas', background: 'neutro mate', requiredDetail: 'zona completa y detalle localizado', comparison: 'estado de referencia o segunda condición cuando exista', metadata: ['autoría', 'licencia', 'fecha', 'equipo', 'aumento', 'objeto y zona'], avoidConfusionWith: ['reflejo', 'fibra', 'polvo de la preparación', 'artefacto de compresión'], authorshipAndLicense: 'Fotografía real propia o licenciada; no generar con IA.', status: 'future-real-photo-required',
})
export const ACADEMY_STAGE_3_PHOTO_BRIEFS = ['desgaste','suciedad','exceso-de-lubricante','defecto-de-lubricante','corrosion','rebabas','aranazos','pivotes','joyas','marcas-de-herramienta'].map(photo)

export const ACADEMY_STAGE_3_VISUAL_QUESTION_COVERAGE = [
  'observación-inferencia-hipótesis-diagnóstico', 'línea-base', 'hallazgo', 'magnitud', 'instrumento', 'resolución-precisión-exactitud-incertidumbre',
  'paralaje-alineación', 'repetición', 'comparabilidad', 'hipótesis-rivales', 'prueba-discriminante', 'evidencia-antes-de-limpiar',
  'contacto-movimiento-lubricación', 'controles-de-montaje', 'autoridad-de-aceptación',
] as const

export function academyStage3VisualForSection(sectionId: string) { return ACADEMY_STAGE_3_VISUAL_DESIGNS.find(({ sectionIds }) => sectionIds.includes(sectionId)) }

export function academyStage3SectionVisualCuration(input: { lessonId: string; section: AcademyReaderSection; contentHash: string }): AcademySectionVisualCuration | undefined {
  const design = academyStage3VisualForSection(input.section.sectionId)
  if (!design || !design.lessonIds.includes(input.lessonId)) return undefined
  return {
    curationId: `curation.0.14i.${design.visualDesignId}.${academyReaderStableHash(input.section.sectionId)}`,
    lessonId: input.lessonId, sectionId: input.section.sectionId, contentHash: input.contentHash, sectionHash: academyReaderStableHash(input.section.markdown),
    pedagogicalPurpose: design.semanticPayload.title, pedagogicalQuestion: design.pedagogicalQuestion, essentialConcepts: design.semanticPayload.nodes.map(({ label }) => label),
    visualDecision: 'content-specific-diagram', visualDesignId: design.visualDesignId, visualKind: 'diagram', diagramSchemaId: `diagram.${design.visualDesignId}.semantic`, diagramData: design.semanticPayload,
    selectorIds: [], isolationIds: [], transparencyById: {}, labelDefinitions: design.semanticPayload.nodes.map(({ id, label, detail }) => ({ id, label, description: detail })),
    expectedObservation: design.longDescription, readingModePolicy: 'inline-essential', fidelity: 'conceptual', limitations: [...design.limitations], sourceBasis: [...design.sourceIds],
    curationMethod: 'codex-assisted-personal-curation', ownerReviewStatus: 'owner-review-pending', technicalReviewStatus: 'not-required', technicalStatus: 'source-reviewed',
    notes: ['SVG semántico original, con alternativa textual, color independiente y movimiento reducido seguro.'],
  }
}

export const ACADEMY_STAGE_3_VISUAL_CATALOG_REFERENCES = ACADEMY_STAGE_3_CATALOG.flatMap(({ lessonId, visualDesignIds }) => visualDesignIds.map((visualDesignId) => ({ lessonId, visualDesignId })))
