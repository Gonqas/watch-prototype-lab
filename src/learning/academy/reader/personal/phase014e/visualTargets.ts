import type {
  AcademyDiagramData,
  AcademyReaderSection,
  AcademySectionVisualCuration,
} from '../../academyReaderModel'
import { academyPersonalSectionId as sectionId } from '../helpers'

export type AcademyVisualGapPriority = 'critical' | 'high'
export type AcademyVisualGapResult = 'implemented' | 'improved-existing' | 'source-needed' | 'photo-needed' | 'not-required' | 'rejected'

export interface AcademyCriticalHighVisualTarget {
  targetId: string
  priority: AcademyVisualGapPriority
  lessonId: string
  sectionId: string
  title: string
  result: AcademyVisualGapResult
  visualDesignId: string
  diagramSchemaId: string
  pedagogicalQuestion: string
  expectedObservation: string
  limitations: string[]
  data: AcademyDiagramData
}

const node = (id: string, label: string, lane?: string, emphasis?: 'normal' | 'primary' | 'warning') => ({ id, label, lane, emphasis })
const edge = (from: string, to: string, label?: string, kind: 'mechanical' | 'decision' | 'comparison' = 'decision') => ({ from, to, label, kind })

export const ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS: readonly AcademyCriticalHighVisualTarget[] = [
  {
    targetId: 'visual-gap.014e.cleaning-inspection-discriminating-test', priority: 'critical',
    lessonId: 'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion',
    sectionId: sectionId('block.encyclopedia.service-tribology.limpieza-e-inspeccion', 'de-la-observacion-a-la-prueba-discriminante'),
    title: 'De la observación a la prueba discriminante', result: 'implemented',
    visualDesignId: 'visual.diagnosis.cleaning-inspection.v1', diagramSchemaId: 'diagram.hypothesis-test-decision.v1',
    pedagogicalQuestion: '¿Qué prueba separa una huella superficial de un defecto funcional sin destruir evidencia?',
    expectedObservation: 'Una observación admite hipótesis rivales; la prueba se elige porque produciría resultados diferentes.',
    limitations: ['Árbol de razonamiento; no prescribe productos, tiempos, tolerancias ni criterios universales de limpieza.'],
    data: { title: 'Observación, hipótesis y prueba', nodes: [node('observation', 'Huella observada', undefined, 'primary'), node('h1', 'Residuo superficial'), node('h2', 'Daño o desgaste'), node('test', 'Prueba reversible'), node('r1', 'Cambia la huella'), node('r2', 'Permanece la huella'), node('decision', 'Registrar y decidir')], edges: [edge('observation', 'h1', 'hipótesis A'), edge('observation', 'h2', 'hipótesis B'), edge('h1', 'test'), edge('h2', 'test'), edge('test', 'r1', 'resultado A'), edge('test', 'r2', 'resultado B'), edge('r1', 'decision'), edge('r2', 'decision')], annotations: ['Conservar el estado inicial antes de limpiar.', 'Detenerse si la prueba puede borrar evidencia o dañar la pieza.'] },
  },
  {
    targetId: 'visual-gap.014e.assembly-control-points', priority: 'critical',
    lessonId: 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control',
    sectionId: sectionId('block.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Secuencia, controles y puntos de parada', result: 'implemented',
    visualDesignId: 'visual.assembly.control-gates.v1', diagramSchemaId: 'diagram.sequence-control-gates.v1',
    pedagogicalQuestion: '¿Qué debe comprobarse antes de liberar la siguiente función del montaje?',
    expectedObservation: 'Cada etapa termina en un control reversible; un fallo detiene la secuencia antes de acumular daño.',
    limitations: ['Secuencia funcional general, no orden oficial de montaje de un calibre ni criterio dimensional de aceptación.'],
    data: { title: 'Montaje por funciones y puertas de control', nodes: [node('baseline', 'Estado previo registrado'), node('seat', 'Asentar sin forzar'), node('control', 'Comprobar libertad', undefined, 'primary'), node('pass', 'Resultado coherente'), node('stop', 'Roce, tensión o duda', undefined, 'warning'), node('next', 'Liberar siguiente función')], edges: [edge('baseline', 'seat'), edge('seat', 'control'), edge('control', 'pass', 'pasa'), edge('control', 'stop', 'no pasa'), edge('pass', 'next'), edge('stop', 'baseline', 'detener y revisar')], phases: [{ id: 'prepare', label: 'Preparar' }, { id: 'assemble', label: 'Asentar' }, { id: 'check', label: 'Controlar' }, { id: 'release', label: 'Continuar o parar' }] },
  },
  {
    targetId: 'visual-gap.014e.reading-documentation-change', priority: 'high',
    lessonId: 'lesson.encyclopedia.history-language.leer-documentacion',
    sectionId: sectionId('block.encyclopedia.history-language.leer-documentacion', 'cambio-continuidad-y-consecuencia'),
    title: 'Cambio, continuidad y consecuencia', result: 'implemented',
    visualDesignId: 'visual.documentation.revision-consequence.v1', diagramSchemaId: 'diagram.document-revision-comparison.v1',
    pedagogicalQuestion: '¿Cómo se decide si un dato antiguo sigue siendo aplicable a la variante consultada?',
    expectedObservation: 'La coincidencia de nombre no basta: documento, revisión, variante y claim deben conservar trazabilidad.',
    limitations: ['Método de lectura documental; no afirma equivalencia entre revisiones concretas.'],
    data: { title: 'Documento, revisión y alcance', nodes: [node('claim', 'Dato que necesitas', 'question', 'primary'), node('old', 'Documento anterior', 'sources'), node('current', 'Documento vigente', 'sources'), node('same', 'Coincide y aplica', 'outcome'), node('changed', 'Cambió o no consta', 'outcome', 'warning'), node('use', 'Usar con localizador', 'decision'), node('limit', 'Limitar o bloquear', 'decision')], edges: [edge('claim', 'old'), edge('claim', 'current'), edge('old', 'same', 'comparar'), edge('current', 'same', 'comparar'), edge('old', 'changed', 'diferencia'), edge('current', 'changed', 'diferencia'), edge('same', 'use'), edge('changed', 'limit')] },
  },
  {
    targetId: 'visual-gap.014e.final-diagnosis', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.diagnostico-y-control-final',
    sectionId: sectionId('block.encyclopedia.service-tribology.diagnostico-y-control-final', 'de-la-observacion-a-la-prueba-discriminante'),
    title: 'Observación, hipótesis y control final', result: 'implemented',
    visualDesignId: 'visual.diagnosis.final-control.v1', diagramSchemaId: 'diagram.hypothesis-test-decision.v1',
    pedagogicalQuestion: '¿Qué resultado final apoya la causa propuesta y qué resultado obliga a reabrirla?',
    expectedObservation: 'El control final se deriva de la hipótesis y conserva una salida explícita de reabrir el diagnóstico.',
    limitations: ['No define tolerancias, posiciones de medida ni intervalos universales.'],
    data: { title: 'Diagnóstico causal y control final', nodes: [node('symptom', 'Síntoma inicial'), node('hypotheses', 'Hipótesis rivales'), node('test', 'Prueba discriminante', undefined, 'primary'), node('intervention', 'Intervención justificada'), node('final', 'Control final'), node('pass', 'Resultado estable'), node('reopen', 'Resultado incoherente', undefined, 'warning')], edges: [edge('symptom', 'hypotheses'), edge('hypotheses', 'test'), edge('test', 'intervention'), edge('intervention', 'final'), edge('final', 'pass', 'confirma'), edge('final', 'reopen', 'no confirma'), edge('reopen', 'hypotheses', 'reabrir')] },
  },
  {
    targetId: 'visual-gap.014e.assembly-worked-example', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control',
    sectionId: sectionId('block.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'ejemplo-de-trabajo-razonado'),
    title: 'Ejemplo de trabajo razonado', result: 'implemented',
    visualDesignId: 'visual.assembly.reasoned-example.v1', diagramSchemaId: 'diagram.observation-action-stop.v1',
    pedagogicalQuestion: '¿Por qué una pieza que no asienta libremente obliga a detenerse?',
    expectedObservation: 'La resistencia inesperada es información: no se compensa con fuerza, se revisan orientación, apoyo e interferencia.',
    limitations: ['Ejemplo causal general; no identifica una pieza ni una fuerza válida para todos los movimientos.'],
    data: { title: 'Asiento dudoso: decidir antes de forzar', nodes: [node('place', 'Presentar la pieza'), node('observe', 'No asienta libremente', undefined, 'warning'), node('h1', 'Orientación incorrecta'), node('h2', 'Interferencia o apoyo'), node('stop', 'Detener acción', undefined, 'primary'), node('inspect', 'Revisar evidencia'), node('retry', 'Reintentar solo si se resuelve')], edges: [edge('place', 'observe'), edge('observe', 'h1'), edge('observe', 'h2'), edge('h1', 'stop'), edge('h2', 'stop'), edge('stop', 'inspect'), edge('inspect', 'retry', 'condición resuelta')] },
  },
  {
    targetId: 'visual-gap.014e.intake-baseline', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.recepcion-y-linea-base',
    sectionId: sectionId('block.encyclopedia.service-tribology.recepcion-y-linea-base', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Secuencia y puntos de parada de recepción', result: 'implemented',
    visualDesignId: 'visual.intake.baseline-sequence.v1', diagramSchemaId: 'diagram.sequence-stop-points.v1',
    pedagogicalQuestion: '¿Qué debe conservarse antes de una prueba que pueda cambiar el estado recibido?',
    expectedObservation: 'La línea base precede a la intervención y contiene puntos de no prueba cuando existe riesgo de perder evidencia o causar daño.',
    limitations: ['No define un protocolo comercial, químico ni de servicio universal.'],
    data: { title: 'Recepción y línea base', nodes: [node('receive', 'Recibir sin intervenir'), node('history', 'Registrar historia'), node('external', 'Observar estado externo'), node('risk', 'Evaluar si probar cambia el estado', undefined, 'primary'), node('safe', 'Prueba reversible'), node('stop', 'No probar todavía', undefined, 'warning'), node('baseline', 'Guardar línea base')], edges: [edge('receive', 'history'), edge('history', 'external'), edge('external', 'risk'), edge('risk', 'safe', 'riesgo controlado'), edge('risk', 'stop', 'riesgo o duda'), edge('safe', 'baseline'), edge('stop', 'baseline')] },
  },
  {
    targetId: 'visual-gap.014e.tm-symptom-tree', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas',
    sectionId: sectionId('block.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'de-la-observacion-a-la-prueba-discriminante'),
    title: 'Árbol de razonamiento por síntomas', result: 'implemented',
    visualDesignId: 'visual.diagnosis.tm-symptom-tree.v1', diagramSchemaId: 'diagram.competing-hypotheses.v1',
    pedagogicalQuestion: '¿Qué prueba separa dos causas posibles de un mismo síntoma?',
    expectedObservation: 'Un síntoma abre ramas rivales; la siguiente observación se elige por su capacidad de descartar, no por tradición.',
    limitations: ['Patrón diagnóstico inspirado en la fuente histórica; sustancias, tolerancias e intervalos de época no se trasladan.'],
    data: { title: 'Síntoma → hipótesis rivales → prueba', nodes: [node('symptom', 'Síntoma observado', undefined, 'primary'), node('energy', 'Hipótesis: energía'), node('train', 'Hipótesis: transmisión'), node('indication', 'Hipótesis: indicación'), node('test', 'Prueba no destructiva'), node('evidence', 'Resultado registrado'), node('next', 'Siguiente decisión')], edges: [edge('symptom', 'energy'), edge('symptom', 'train'), edge('symptom', 'indication'), edge('energy', 'test'), edge('train', 'test'), edge('indication', 'test'), edge('test', 'evidence'), edge('evidence', 'next')] },
  },
  {
    targetId: 'visual-gap.014e.tribology-contact', priority: 'high',
    lessonId: 'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes',
    sectionId: sectionId('block.encyclopedia.service-tribology.tribologia-y-lubricantes', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Contacto, función y contaminación', result: 'implemented',
    visualDesignId: 'visual.tribology.contact-function.v1', diagramSchemaId: 'diagram.contact-lubrication-outcomes.v1',
    pedagogicalQuestion: '¿Por qué el tipo de contacto y la función deben conocerse antes de elegir un lubricante?',
    expectedObservation: 'La decisión parte del contacto documentado; exceso, defecto y contaminación son fallos distintos que no se resuelven con una cantidad universal.',
    limitations: ['No recomienda producto, cantidad ni punto de lubricación para ningún calibre. Requiere documentación moderna aplicable.'],
    data: { title: 'Del contacto a la decisión de lubricación', nodes: [node('contact', 'Tipo de contacto'), node('function', 'Función y régimen'), node('official', 'Documento aplicable', undefined, 'primary'), node('apply', 'Aplicación controlada'), node('deficit', 'Defecto'), node('excess', 'Exceso'), node('contamination', 'Contaminación', undefined, 'warning'), node('verify', 'Verificar y registrar')], edges: [edge('contact', 'function'), edge('function', 'official'), edge('official', 'apply'), edge('apply', 'deficit', 'insuficiente'), edge('apply', 'excess', 'sobrante'), edge('apply', 'contamination', 'migración/arrastre'), edge('deficit', 'verify'), edge('excess', 'verify'), edge('contamination', 'verify')] },
  },
  {
    targetId: 'visual-gap.014e.bench-contamination', priority: 'high',
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    sectionId: sectionId('block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'secuencia-controles-y-puntos-de-parada'),
    title: 'Fuentes y transferencias de contaminación', result: 'implemented',
    visualDesignId: 'visual.bench.contamination-transfer.v1', diagramSchemaId: 'diagram.contamination-transfer-map.v1',
    pedagogicalQuestion: '¿Cómo llega un contaminante desde una fuente hasta una pieza aparentemente limpia?',
    expectedObservation: 'Manos, herramienta, superficie, recipiente y aire forman rutas de transferencia que deben interrumpirse y registrarse.',
    limitations: ['Mapa preventivo general; no prescribe sustancias ni compatibilidad química. Los procedimientos históricos peligrosos permanecen no accionables.'],
    data: { title: 'Cadena de contaminación del banco', nodes: [node('source', 'Fuente de contaminación', undefined, 'warning'), node('hands', 'Manos o guantes'), node('tool', 'Herramienta'), node('surface', 'Superficie o recipiente'), node('part', 'Pieza limpia', undefined, 'primary'), node('control', 'Separar · limpiar · cubrir'), node('check', 'Inspeccionar y registrar')], edges: [edge('source', 'hands', 'transferencia'), edge('source', 'tool', 'transferencia'), edge('source', 'surface', 'transferencia'), edge('hands', 'part', 'contacto'), edge('tool', 'part', 'contacto'), edge('surface', 'part', 'contacto'), edge('control', 'hands'), edge('control', 'tool'), edge('control', 'surface'), edge('part', 'check')] },
  },
] as const

const VISUAL_TARGET_BY_SECTION = new Map(ACADEMY_CRITICAL_HIGH_VISUAL_TARGETS.map((target) => [target.sectionId, target]))

export function academyPersonalSectionVisualCuration(input: {
  lessonId: string
  section: AcademyReaderSection
  contentHash: string
  sectionHash: string
  sourceIds: string[]
}): AcademySectionVisualCuration | undefined {
  const target = VISUAL_TARGET_BY_SECTION.get(input.section.sectionId)
  if (!target || target.lessonId !== input.lessonId || target.result !== 'implemented') return undefined
  return {
    curationId: `curation.0.14e.${target.targetId}`,
    lessonId: target.lessonId,
    sectionId: target.sectionId,
    contentHash: input.contentHash,
    sectionHash: input.sectionHash,
    pedagogicalPurpose: target.title,
    pedagogicalQuestion: target.pedagogicalQuestion,
    essentialConcepts: target.data.nodes.map(({ label }) => label),
    visualDecision: 'content-specific-diagram',
    visualDesignId: target.visualDesignId,
    visualKind: 'diagram',
    diagramSchemaId: target.diagramSchemaId,
    diagramData: target.data,
    selectorIds: [], isolationIds: [], transparencyById: {}, labelDefinitions: [],
    expectedObservation: target.expectedObservation,
    readingModePolicy: 'inline-essential',
    fidelity: 'conceptual',
    limitations: target.limitations,
    sourceBasis: input.sourceIds,
    curationMethod: 'codex-assisted-personal-curation',
    ownerReviewStatus: 'owner-review-pending',
    technicalReviewStatus: 'not-required',
    technicalStatus: 'source-reviewed',
    notes: [`Gap ${target.priority} 0.14D resuelto en 0.14E con un diagrama causal original.`],
  }
}


