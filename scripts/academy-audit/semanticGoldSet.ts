import type {
  AuditConfidence,
  EvidenceLevel,
  ExecutionTier,
  HistoricalStatus,
  LearningArchetype,
  MacroStage,
  ReviewStatus,
  SafetyStatus,
  TrackRole,
} from '../../src/learning/governance/editorialGovernance'

export interface GoldEvidenceExpectation {
  modalities: EvidenceLevel[]
  primaryModality: EvidenceLevel
  physicalCompetenceClaim: boolean
  physicalExecutionRequired: boolean
  measuredOrReviewedResultRequired: boolean
}

export interface SemanticLessonGoldFixture {
  lessonId: string
  macroStageExpected: MacroStage
  trackRoleExpected: TrackRole
  archetypeExpected: LearningArchetype
  evidenceProfileExpected: GoldEvidenceExpectation
  physicalSkillClaimExpected: boolean
  executionTierExpected: ExecutionTier
  safetyExpected: SafetyStatus
  historicalStatusExpected: HistoricalStatus
  prerequisiteIssuesExpected: string[]
  sourceAuthorityExpected: string[]
  reasons: string[]
  confidence: AuditConfidence
  reviewStatus: ReviewStatus
}

export interface SemanticActivityGoldFixture extends Omit<SemanticLessonGoldFixture, 'lessonId'> {
  activityId: string
  lessonId: string
}

interface LessonSeed {
  id: string
  stage: MacroStage
  role: TrackRole
  archetype: LearningArchetype
  modalities: EvidenceLevel[]
  primary?: EvidenceLevel
  physical?: boolean
  physicalExecution?: boolean
  result?: boolean
  tier?: ExecutionTier
  safety?: SafetyStatus
  historical?: HistoricalStatus
  prerequisites?: string[]
  authority?: string[]
  reason: string
}

const lessonSeeds: LessonSeed[] = [
  { id: 'lesson.quartz2035.workstation', stage: '0-prepare-bench-and-control', role: 'core', archetype: 'bench-procedure', modalities: ['K', 'V'], reason: 'Prepara el banco dentro de una experiencia educativa sin certificar ejecución física.' },
  { id: 'lesson.quartz2035.tools', stage: '0-prepare-bench-and-control', role: 'core', archetype: 'visual-anatomy', modalities: ['K', 'V'], reason: 'Reconocimiento funcional de herramientas antes de operar.' },
  { id: 'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad', stage: '0-prepare-bench-and-control', role: 'enrichment', archetype: 'bench-procedure', modalities: ['K', 'V'], safety: 'caution', reason: 'Organiza banco, postura y criterios de seguridad sin ejecutar un procedimiento histórico.' },
  { id: 'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica', stage: '0-prepare-bench-and-control', role: 'enrichment', archetype: 'psychomotor-skill', modalities: ['K', 'P', 'R'], primary: 'P', physical: true, physicalExecution: true, result: true, tier: 'home-bench', safety: 'caution', historical: 'mixed', authority: ['D-bulova-school'], reason: 'Pasaporte psicomotor explícito; la competencia completa necesita ejecución física documentada y revisión.' },
  { id: 'lesson.horology.system', stage: '1-understand-watch-as-system', role: 'core', archetype: 'system-overview', modalities: ['K', 'V'], reason: 'Vista funcional inicial del reloj completo.' },
  { id: 'lesson.horology.mechanical-chain', stage: '1-understand-watch-as-system', role: 'core', archetype: 'mechanism-explanation', modalities: ['K', 'V'], authority: ['A-manufacturer-official', 'B-theory-of-horology'], reason: 'Explica la cadena mecánica mediante orden causal y simulación; no afirma destreza manual.' },
  { id: 'lesson.horology.functional-equivalence', stage: '1-understand-watch-as-system', role: 'core', archetype: 'mechanism-explanation', modalities: ['K', 'V'], reason: 'Compara funciones de cuarzo y mecánico; las menciones de límites no son procedimientos.' },
  { id: 'lesson.encyclopedia.history-language.medir-el-tiempo', stage: '1-understand-watch-as-system', role: 'enrichment', archetype: 'historical-comparison', modalities: ['K', 'V'], historical: 'historical-context', authority: ['G-watchmaker-or-visual-resource'], reason: 'Historia conceptual de referencia, oscilación y conteo; no psicomotricidad.' },
  { id: 'lesson.encyclopedia.history-language.toh-tiempo-escalas', stage: '1-understand-watch-as-system', role: 'enrichment', archetype: 'historical-comparison', modalities: ['K', 'V'], historical: 'historical-context', authority: ['B-theory-of-horology'], reason: 'Lección conceptual e histórica; citar una obra histórica no crea riesgo operativo.' },
  { id: 'lesson.encyclopedia.history-language.toh-cronometro-precision', stage: '1-understand-watch-as-system', role: 'reference-only', archetype: 'mechanism-explanation', modalities: ['K', 'V'], historical: 'historical-context', authority: ['B-theory-of-horology'], reason: 'Referencia conceptual para distinguir reloj, cronómetro, precisión y exactitud; no bloquea el recorrido core.' },
  { id: 'lesson.encyclopedia.history-language.leer-documentacion', stage: '1-understand-watch-as-system', role: 'core', archetype: 'inspection', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Inspecciona procedencia, revisión y aplicabilidad documental.' },
  { id: 'lesson.mechanical.energy', stage: '2-understand-mechanical-systems', role: 'core', archetype: 'mechanism-explanation', modalities: ['K', 'V'], reason: 'Fundamento causal de energía almacenada y movimiento.' },
  { id: 'lesson.mechanical.gear-pair', stage: '2-understand-mechanical-systems', role: 'core', archetype: 'visual-anatomy', modalities: ['K', 'V'], reason: 'Reconoce geometría y contacto de rueda y piñón mediante visualización.' },
  { id: 'lesson.mechanical.escape-oscillator', stage: '2-understand-mechanical-systems', role: 'core', archetype: 'system-overview', modalities: ['K', 'V'], reason: 'Integra escape y oscilador como subsistema antes del detalle de servicio.' },
  { id: 'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', stage: '1-understand-watch-as-system', role: 'core', archetype: 'system-overview', modalities: ['K', 'V'], prerequisites: ['later-detail-before-overview'], authority: ['B-theory-of-horology'], reason: 'La visión general debe introducir la cadena y no exigir minutería ni puesta en hora detalladas.' },
  { id: 'lesson.encyclopedia.math-physics-metrology.toh-contar-tren', stage: '2-understand-mechanical-systems', role: 'core', archetype: 'calculation', modalities: ['K', 'R'], primary: 'R', result: true, authority: ['B-theory-of-horology'], reason: 'Cálculo de relaciones con resultado revisable; no requiere destreza física.' },
  { id: 'lesson.advanced.calendars', stage: '2-understand-mechanical-systems', role: 'specialization', archetype: 'mechanism-explanation', modalities: ['K', 'V'], reason: 'Explica acumulación, salto, retención y corrección; no es psicomotricidad.' },
  { id: 'lesson.advanced.chronograph-control', stage: '2-understand-mechanical-systems', role: 'specialization', archetype: 'visual-anatomy', modalities: ['K', 'V'], reason: 'Compara levas y rueda de pilares mediante estados visibles; no es práctica manual.' },
  { id: 'lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante', stage: '6-repair-adapt-manufacture-components', role: 'historical-case', archetype: 'psychomotor-skill', modalities: ['K', 'P', 'R'], primary: 'P', physical: true, physicalExecution: true, result: true, tier: 'specialist-workshop', safety: 'caution', historical: 'mixed', prerequisites: ['advanced-complication-before-basic-skill'], authority: ['D-bulova-school'], reason: 'Centrado y alabeo son psicomotricidad real; tourbillon y carrusel son prerrequisitos impropios y no bloquean la habilidad básica.' },
  { id: 'lesson.metrology.observe-before-measuring', stage: '3-observe-measure-diagnose', role: 'core', archetype: 'inspection', modalities: ['K', 'V'], reason: 'Ordena observación previa y decisión de medición.' },
  { id: 'lesson.metrology.precision-accuracy-uncertainty', stage: '3-observe-measure-diagnose', role: 'core', archetype: 'measurement', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Metrología con interpretación de resultados e incertidumbre.' },
  { id: 'lesson.metrology.physical-measurement', stage: '3-observe-measure-diagnose', role: 'core', archetype: 'measurement', modalities: ['K', 'P', 'R'], primary: 'R', physical: true, physicalExecution: true, result: true, tier: 'home-bench', safety: 'caution', reason: 'El contrato de observación física admite evidencia P y resultado medido R.' },
  { id: 'lesson.metrology.inspection-findings', stage: '3-observe-measure-diagnose', role: 'core', archetype: 'inspection', modalities: ['K', 'V', 'R'], primary: 'R', result: true, reason: 'Clasifica hallazgos y conserva evidencia revisable.' },
  { id: 'lesson.encyclopedia.quartz-electronics.diagnostico-cuarzo', stage: '3-observe-measure-diagnose', role: 'specialization', archetype: 'diagnosis-case', modalities: ['K', 'V', 'R'], primary: 'R', result: true, reason: 'Diagnóstico causal de cuarzo con hipótesis y prueba discriminante.' },
  { id: 'lesson.encyclopedia.service-tribology.tm-inspeccion-previa', stage: '3-observe-measure-diagnose', role: 'historical-case', archetype: 'inspection', modalities: ['K', 'V', 'R'], primary: 'R', result: true, historical: 'historical-context', authority: ['F-tm-9-1575'], reason: 'El método de inspección es aplicable; los peligros solo se bloquean si existe una operación concreta.' },
  { id: 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas', stage: '3-observe-measure-diagnose', role: 'historical-case', archetype: 'diagnosis-case', modalities: ['K', 'V', 'R'], primary: 'R', result: true, historical: 'historical-context', authority: ['F-tm-9-1575'], reason: 'Caso histórico de diagnóstico por síntomas y comprobación.' },
  { id: 'lesson.quartz2035.anatomy', stage: '4-work-on-real-calibre', role: 'specialization', archetype: 'visual-anatomy', modalities: ['K', 'V'], authority: ['A-manufacturer-official'], reason: 'Anatomía específica del MIYOTA 2035 basada en documentación oficial.' },
  { id: 'lesson.quartz2035.disassembly', stage: '4-work-on-real-calibre', role: 'specialization', archetype: 'calibre-service', modalities: ['K', 'V'], tier: 'simulation', authority: ['A-manufacturer-official'], reason: 'Desmontaje virtual de calibre; no acredita ejecución física.' },
  { id: 'lesson.miyota8215.identify', stage: '4-work-on-real-calibre', role: 'core', archetype: 'visual-anatomy', modalities: ['K', 'V'], authority: ['A-manufacturer-official'], reason: 'Identificación visual de un calibre concreto.' },
  { id: 'lesson.miyota8215.architecture', stage: '4-work-on-real-calibre', role: 'core', archetype: 'system-overview', modalities: ['K', 'V'], authority: ['A-manufacturer-official'], reason: 'Vista de arquitectura del MIYOTA 8215 antes del desmontaje.' },
  { id: 'lesson.miyota8215.guided-disassembly', stage: '4-work-on-real-calibre', role: 'core', archetype: 'calibre-service', modalities: ['K', 'V'], authority: ['A-manufacturer-official'], reason: 'Práctica virtual guiada; P solo sería válida con ejecución física solicitada y documentada.' },
  { id: 'lesson.miyota8215.inspection', stage: '4-work-on-real-calibre', role: 'core', archetype: 'inspection', modalities: ['K', 'V', 'R'], primary: 'R', result: true, authority: ['A-manufacturer-official'], reason: 'Inspección específica con hallazgos revisables.' },
  { id: 'lesson.miyota8215.diagnosis-project', stage: '4-work-on-real-calibre', role: 'core', archetype: 'diagnosis-case', modalities: ['K', 'V', 'R'], primary: 'R', result: true, authority: ['A-manufacturer-official'], reason: 'Cierra el trabajo de calibre mediante diagnóstico documentado.' },
  { id: 'lesson.advanced.service-disassembly', stage: '4-work-on-real-calibre', role: 'specialization', archetype: 'bench-procedure', modalities: ['K', 'V', 'R'], primary: 'V', result: true, tier: 'simulation', reason: 'Planifica y simula desmontaje por dependencias sin afirmar servicio físico.' },
  { id: 'lesson.capstone.design.acquired-movement', stage: '5-build-complete-watch', role: 'core', archetype: 'capstone-project', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Integra un movimiento adquirido mediante dossier de compatibilidad.' },
  { id: 'lesson.capstone.design.external-components', stage: '5-build-complete-watch', role: 'core', archetype: 'design', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Diseña interfaces de caja, esfera, agujas y uso; una mención a fabricación no lo vuelve psicomotor.' },
  { id: 'lesson.capstone.design.capstone', stage: '5-build-complete-watch', role: 'core', archetype: 'capstone-project', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Dossier integral y puerta de prototipo del reloj completo.' },
  { id: 'lesson.encyclopedia.cases-water.arquitectura-de-caja', stage: '5-build-complete-watch', role: 'core', archetype: 'design', modalities: ['K', 'V', 'R'], primary: 'R', result: true, reason: 'Aporta interfaces movimiento-caja a la integración del reloj.' },
  { id: 'lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto', stage: '6-repair-adapt-manufacture-components', role: 'specialization', archetype: 'historical-comparison', modalities: ['K', 'R'], primary: 'R', result: true, historical: 'mixed', reason: 'Compara donante, repuesto rederivado e intervención; no acredita fabricación física.' },
  { id: 'lesson.encyclopedia.micromechanics.ruedas-y-pinones', stage: '6-repair-adapt-manufacture-components', role: 'core', archetype: 'manufacturing', modalities: ['K', 'V', 'R'], primary: 'R', result: true, tier: 'specialist-workshop', safety: 'supervised', authority: ['C-daniels-watchmaking'], reason: 'Fabricación explícita de ruedas y piñones con proceso especializado.' },
  { id: 'lesson.encyclopedia.micromechanics.bulova-torneado-fundamental', stage: '6-repair-adapt-manufacture-components', role: 'enrichment', archetype: 'psychomotor-skill', modalities: ['K', 'P', 'R'], primary: 'P', physical: true, physicalExecution: true, result: true, tier: 'specialist-workshop', safety: 'supervised', historical: 'mixed', authority: ['D-bulova-school'], reason: 'Contrato psicomotor de torno; requiere supervisión y evidencia física real.' },
  { id: 'lesson.capstone.manufacturing.micromechanics', stage: '6-repair-adapt-manufacture-components', role: 'core', archetype: 'manufacturing', modalities: ['K', 'V', 'R'], primary: 'R', result: true, tier: 'specialist-workshop', safety: 'caution', reason: 'El contrato de fabricación es de planificación y revisión, no una afirmación de pieza fabricada.' },
  { id: 'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b', stage: '3-observe-measure-diagnose', role: 'historical-case', archetype: 'diagnosis-case', modalities: ['K', 'V', 'R'], primary: 'R', result: true, historical: 'historical-context', prerequisites: ['modern-design-framework-before-historical-case'], authority: ['F-tm-9-1575', 'H-reference-database'], reason: 'Caso histórico de calibre; arquitectura de producto, presupuesto de error y modelo V son prerrequisitos impropios.' },
  { id: 'lesson.encyclopedia.micromechanics.chicago-escape-dibujo', stage: '7-design-validate-own-watch-or-movement', role: 'historical-case', archetype: 'design', modalities: ['K', 'R'], primary: 'R', result: true, historical: 'historical-context', authority: ['E-chicago-school'], reason: 'Construcción geométrica histórica usada como caso de diseño sujeto a verificación.' },
  { id: 'lesson.advanced.architecture-capstone', stage: '7-design-validate-own-watch-or-movement', role: 'core', archetype: 'capstone-project', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Defensa integral de arquitectura con revisión.' },
  { id: 'lesson.capstone.design.own-movement', stage: '7-design-validate-own-watch-or-movement', role: 'core', archetype: 'design', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Diseño de arquitectura de movimiento propio.' },
  { id: 'lesson.capstone.validation.watchmaker-review', stage: '7-design-validate-own-watch-or-movement', role: 'core', archetype: 'capstone-project', modalities: ['K', 'R'], primary: 'R', result: true, reason: 'Validación independiente por revisión relojera.' },
]

export const SEMANTIC_LESSON_GOLDSET: SemanticLessonGoldFixture[] = lessonSeeds.map((seed) => ({
  lessonId: seed.id,
  macroStageExpected: seed.stage,
  trackRoleExpected: seed.role,
  archetypeExpected: seed.archetype,
  evidenceProfileExpected: {
    modalities: seed.modalities,
    primaryModality: seed.primary ?? seed.modalities.at(-1) ?? 'K',
    physicalCompetenceClaim: seed.physical ?? false,
    physicalExecutionRequired: seed.physicalExecution ?? false,
    measuredOrReviewedResultRequired: seed.result ?? seed.modalities.includes('R'),
  },
  physicalSkillClaimExpected: seed.physical ?? false,
  executionTierExpected: seed.tier ?? 'simulation',
  safetyExpected: seed.safety ?? 'normal',
  historicalStatusExpected: seed.historical ?? 'current',
  prerequisiteIssuesExpected: seed.prerequisites ?? [],
  sourceAuthorityExpected: seed.authority ?? [],
  reasons: [seed.reason],
  confidence: 'high',
  reviewStatus: 'confirmed',
}))

interface ActivitySeed {
  id: string
  lessonId: string
  modalities?: EvidenceLevel[]
  physical?: boolean
  physicalExecution?: boolean
  result?: boolean
  tier?: ExecutionTier
  safety?: SafetyStatus
  reason?: string
}

const activitySeeds: ActivitySeed[] = [
  { id: 'activity.horology.order-mechanical-chain', lessonId: 'lesson.horology.mechanical-chain', modalities: ['K', 'V'] },
  { id: 'activity.horology.identify-escapement-oscillator', lessonId: 'lesson.horology.mechanical-chain', modalities: ['K', 'V'] },
  { id: 'activity.horology.match-functional-equivalents', lessonId: 'lesson.horology.functional-equivalence', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.history-language.medir-el-tiempo', lessonId: 'lesson.encyclopedia.history-language.medir-el-tiempo', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.history-language.toh-tiempo-escalas', lessonId: 'lesson.encyclopedia.history-language.toh-tiempo-escalas', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.history-language.toh-cronometro-precision', lessonId: 'lesson.encyclopedia.history-language.toh-cronometro-precision', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', lessonId: 'lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.math-physics-metrology.toh-contar-tren', lessonId: 'lesson.encyclopedia.math-physics-metrology.toh-contar-tren', modalities: ['K', 'R'], result: true },
  { id: 'activity.advanced.calendars', lessonId: 'lesson.advanced.calendars', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.advanced.chronograph-control', lessonId: 'lesson.advanced.chronograph-control', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.encyclopedia.escapements-chronometry.bulova-centrado-volante', lessonId: 'lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante', modalities: ['K', 'V'], tier: 'specialist-workshop', safety: 'caution', reason: 'La actividad actual es documental/simulada; no se le añade P aunque la competencia curricular completa sí la necesite.' },
  { id: 'activity.encyclopedia.quartz-electronics.diagnostico-cuarzo', lessonId: 'lesson.encyclopedia.quartz-electronics.diagnostico-cuarzo', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.encyclopedia.service-tribology.tm-inspeccion-previa', lessonId: 'lesson.encyclopedia.service-tribology.tm-inspeccion-previa', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.service-tribology.tm-diagnostico-sintomas', lessonId: 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.quartz2035.disassemble-to-tray', lessonId: 'lesson.quartz2035.disassembly', modalities: ['K', 'V'] },
  { id: 'activity.miyota8215.remove-rotor', lessonId: 'lesson.miyota8215.guided-disassembly', modalities: ['K', 'V'] },
  { id: 'activity.miyota8215.manage-fasteners', lessonId: 'lesson.miyota8215.guided-disassembly', modalities: ['K', 'V'] },
  { id: 'activity.miyota8215.guided-disassembly', lessonId: 'lesson.miyota8215.guided-disassembly', modalities: ['K', 'V'], reason: 'Desmontaje real como objeto de aprendizaje, pero la actividad instalada solo ejecuta una reconstrucción virtual.' },
  { id: 'activity.miyota8215.inspect-parts', lessonId: 'lesson.miyota8215.inspection', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.miyota8215.complete-diagnosis', lessonId: 'lesson.miyota8215.diagnosis-project', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.advanced.service-disassembly', lessonId: 'lesson.advanced.service-disassembly', modalities: ['K', 'V', 'R'], result: true },
  { id: 'activity.capstone.design.acquired-movement', lessonId: 'lesson.capstone.design.acquired-movement', modalities: ['K', 'R'], result: true },
  { id: 'activity.capstone.design.external-components', lessonId: 'lesson.capstone.design.external-components', modalities: ['K', 'R'], result: true },
  { id: 'activity.capstone.design.capstone', lessonId: 'lesson.capstone.design.capstone', modalities: ['K', 'R'], result: true },
  { id: 'activity.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto', lessonId: 'lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto', modalities: ['K', 'R'], result: true },
  { id: 'activity.encyclopedia.micromechanics.ruedas-y-pinones', lessonId: 'lesson.encyclopedia.micromechanics.ruedas-y-pinones', modalities: ['K', 'V', 'R'], result: true, tier: 'specialist-workshop', safety: 'supervised' },
  { id: 'activity.encyclopedia.micromechanics.bulova-torneado-fundamental', lessonId: 'lesson.encyclopedia.micromechanics.bulova-torneado-fundamental', modalities: ['K', 'V'], tier: 'specialist-workshop', safety: 'supervised' },
  { id: 'activity.capstone.manufacturing.micromechanics', lessonId: 'lesson.capstone.manufacturing.micromechanics', modalities: ['K', 'V', 'R'], result: true, tier: 'specialist-workshop', safety: 'caution', reason: 'El contrato de fabricación declara process-planning y physicalCompletionClaim=false; por tanto no exige P.' },
  { id: 'activity.encyclopedia.atlas-restoration-design.tm-hamilton-992b', lessonId: 'lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b', modalities: ['K', 'V'] },
  { id: 'activity.encyclopedia.micromechanics.chicago-escape-dibujo', lessonId: 'lesson.encyclopedia.micromechanics.chicago-escape-dibujo', modalities: ['K', 'R'], result: true },
  { id: 'activity.advanced.architecture-capstone', lessonId: 'lesson.advanced.architecture-capstone', modalities: ['K', 'R'], result: true },
  { id: 'activity.capstone.design.own-movement', lessonId: 'lesson.capstone.design.own-movement', modalities: ['K', 'R'], result: true },
  { id: 'activity.capstone.validation.watchmaker-review', lessonId: 'lesson.capstone.validation.watchmaker-review', modalities: ['K', 'R'], result: true },
]

const lessonFixtureById = new Map(SEMANTIC_LESSON_GOLDSET.map((fixture) => [fixture.lessonId, fixture]))

export const SEMANTIC_ACTIVITY_GOLDSET: SemanticActivityGoldFixture[] = activitySeeds.map((seed) => {
  const lesson = lessonFixtureById.get(seed.lessonId)
  if (!lesson) throw new Error(`Fixture de actividad sin fixture de lección: ${seed.id}`)
  const modalities = seed.modalities ?? lesson.evidenceProfileExpected.modalities
  return {
    activityId: seed.id,
    lessonId: seed.lessonId,
    macroStageExpected: lesson.macroStageExpected,
    trackRoleExpected: lesson.trackRoleExpected,
    archetypeExpected: lesson.archetypeExpected,
    evidenceProfileExpected: {
      modalities,
      primaryModality: modalities.at(-1) ?? 'K',
      physicalCompetenceClaim: seed.physical ?? false,
      physicalExecutionRequired: seed.physicalExecution ?? false,
      measuredOrReviewedResultRequired: seed.result ?? modalities.includes('R'),
    },
    physicalSkillClaimExpected: seed.physical ?? false,
    executionTierExpected: seed.tier ?? lesson.executionTierExpected,
    safetyExpected: seed.safety ?? lesson.safetyExpected,
    historicalStatusExpected: lesson.historicalStatusExpected,
    prerequisiteIssuesExpected: lesson.prerequisiteIssuesExpected,
    sourceAuthorityExpected: lesson.sourceAuthorityExpected,
    reasons: [seed.reason ?? `Caso de referencia de ${lesson.archetypeExpected} para ${seed.lessonId}.`],
    confidence: 'high',
    reviewStatus: 'confirmed',
  }
})

export const semanticLessonGoldById = new Map(SEMANTIC_LESSON_GOLDSET.map((fixture) => [fixture.lessonId, fixture]))
export const semanticActivityGoldById = new Map(SEMANTIC_ACTIVITY_GOLDSET.map((fixture) => [fixture.activityId, fixture]))
