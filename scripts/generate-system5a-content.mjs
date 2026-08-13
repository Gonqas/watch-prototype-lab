import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildSystem5aInteraction,
  buildSystem5aLessonBody,
  buildSystem5aSceneQuestion,
  SYSTEM5A_METROLOGY_LESSONS,
} from './system5a-metrology-lessons.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = join(ROOT, 'learning-content', 'inspection-metrology')
const VERSION = '0.1.0'
const PACKAGE_ID = 'wplab.horology.inspection-metrology'
const CREATED_AT = '2026-08-02T10:00:00.000Z'

const modules = [
  ['observe-before-measuring', 'Observar antes de medir', 'separar descripción, identificación e interpretación antes de escoger una magnitud'],
  ['light-magnification-posture', 'Luz, aumento y postura', 'hacer visible una característica sin introducir reflejos, sombras o posturas inestables'],
  ['units-scale-resolution', 'Unidades, escala y resolución', 'declarar magnitud, unidad, escala y capacidad de discriminación sin atribuir exactitud'],
  ['precision-accuracy-uncertainty', 'Precisión, exactitud, repetibilidad e incertidumbre', 'distinguir dispersión, sesgo, error, repetibilidad e incertidumbre'],
  ['instruments', 'Instrumentos', 'elegir un instrumento compatible con la característica, el rango y el acceso'],
  ['verification-calibration', 'Verificación y calibración', 'registrar una comprobación funcional sin llamarla calibración acreditada'],
  ['physical-specimen', 'Registrar una unidad física', 'dar identidad estable, alcance y privacidad a una unidad concreta'],
  ['technical-photography', 'Fotografía técnica', 'capturar vistas reproducibles y conservar el original inmutable'],
  ['image-measurement', 'Medir sobre una fotografía', 'calibrar una escala 2D y medir sin inferir profundidad'],
  ['physical-measurement', 'Medir piezas físicas', 'definir datums, orientación, instrumento y repeticiones antes de leer'],
  ['inspection-findings', 'Inspeccionar desgaste y daños', 'clasificar hallazgos sin convertirlos automáticamente en diagnóstico'],
  ['compare-data', 'Comparar datos', 'contrastar nominal, reconstruido y medido con marcos y tolerancias explícitos'],
  ['improve-virtual-model', 'Mejorar un modelo virtual', 'formular una corrección versionada sin alterar canon ni CAD'],
  ['final-project', 'Proyecto final', 'producir un dossier trazable y revisable de una unidad concreta'],
]

const activities = [
  'Preparar una inspección', 'Separar observación e hipótesis',
  'Elegir iluminación', 'Elegir aumento',
  'Diferenciar resolución y precisión', 'Redondear sin inventar información',
  'Repetir medición', 'Declarar incertidumbre',
  'Seleccionar instrumento', 'Detectar paralaje',
  'Verificar cero', 'Interpretar una verificación',
  'Registrar espécimen', 'Contar dientes',
  'Importar fotografía', 'Clasificar fotografía',
  'Calibrar escala', 'Medir distancia',
  'Medir diámetro', 'Medir distancia entre centros',
  'Identificar lectura atípica', 'Registrar hallazgo',
  'Comparar nominal y medido', 'Determinar validez de comparación',
  'Adoptar un valor', 'Crear propuesta',
  'Completar dossier', 'Defender el proyecto final',
]

const competencyTitles = [
  'Planificar una inspección', 'Seleccionar luz y aumento', 'Diferenciar conceptos metrológicos',
  'Seleccionar un instrumento', 'Verificar un instrumento', 'Registrar una unidad física',
  'Documentar fotografías', 'Calibrar una imagen', 'Medir en dos dimensiones',
  'Medir una pieza física', 'Repetir una medición', 'Declarar incertidumbre',
  'Identificar un hallazgo', 'Separar observación e hipótesis', 'Comparar nominal y medido',
  'Interpretar una discrepancia', 'Documentar una pieza', 'Completar un dossier',
]

const sourceIds = ['source.metrology.bipm.vim', 'source.metrology.bipm.gum', 'source.metrology.nist.handbook', 'source.metrology.original-course']
const sources = [
  {
    id: sourceIds[0], authority: 'official-standards-body', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'JCGM 200:2012 · Vocabulario Internacional de Metrología', locator: 'https://www.bipm.org/en/doi/10.59161/jcgm200-2012' },
    authorOrManufacturer: 'JCGM / BIPM', sourceType: 'official-metrology-guidance', revision: 'JCGM 200:2012', retrievedAt: '2026-08-02',
    supportedClaim: 'Vocabulario general para magnitud, medición, precisión, exactitud, calibración, verificación, trazabilidad e incertidumbre.', derivedLayer: 'source',
  },
  {
    id: sourceIds[1], authority: 'official-standards-body', usage: 'official-linked',
    resource: { kind: 'pdf', title: 'JCGM 100:2008 · Guide to the expression of uncertainty in measurement', locator: 'https://www.bipm.org/documents/20126/2071204/JCGM_100_2008_E.pdf' },
    authorOrManufacturer: 'JCGM / BIPM', sourceType: 'official-metrology-guidance', revision: 'JCGM 100:2008', retrievedAt: '2026-08-02',
    supportedClaim: 'Principios generales para evaluar y expresar incertidumbre de medida; el curso no afirma implementar un presupuesto GUM completo.', derivedLayer: 'source',
  },
  {
    id: sourceIds[2], authority: 'official-standards-body', usage: 'official-linked',
    resource: { kind: 'web-page', title: 'NIST/SEMATECH e-Handbook of Statistical Methods · Measurement Process Characterization', locator: 'https://www.itl.nist.gov/div898/handbook/mpc/mpc.htm' },
    authorOrManufacturer: 'NIST', sourceType: 'official-metrology-guidance', revision: 'online handbook', retrievedAt: '2026-08-02',
    supportedClaim: 'Tratamiento educativo de variabilidad, resolución, repetibilidad y caracterización del proceso de medición.', derivedLayer: 'source',
  },
  {
    id: sourceIds[3], authority: 'original-educational', usage: 'shareable',
    resource: { kind: 'note', title: 'Síntesis original del Sistema 5A' }, sourceType: 'original-educational-content',
    supportedClaim: 'Procedimientos, ejemplos sintéticos y límites operativos propios de Watch Prototype Lab.', derivedLayer: 'educational',
  },
]

function localized(value) { return { es: value } }
function idPart(value) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function writeJson(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }
function entry(collection, id) { return { id, path: `${collection}/${id}.json` } }

const tutorContract = (conceptId) => ({
  scopeConceptIds: [conceptId],
  allowedActions: ['orient', 'ask-socratic-question', 'explain-declared-content', 'point-to-source', 'suggest-remediation', 'summarize-visible-state'],
  forbiddenClaims: [localized('No inventar tolerancias, exactitudes, calibraciones, diagnósticos ni datos de fabricante.'), localized('No aprobar propuestas, elevar fidelidad o modificar CAD.')],
  promptStarters: [localized('¿Qué estás observando exactamente?'), localized('¿Qué método y referencia hacen repetible este resultado?'), localized('¿Qué limitación impide generalizarlo?')],
  requiresSourceForTechnicalClaims: true,
  authority: 'coach-not-assessor',
})

function interactionFor(index, activityId) {
  const slug = modules[Math.floor(index / 2)][0]
  return buildSystem5aInteraction(index, activityId, slug)
}

function sceneQuestion(index, activityId, title) {
  const slug = modules[Math.floor(index / 2)][0]
  return buildSystem5aSceneQuestion(index, activityId, title, slug)
}

rmSync(OUTPUT, { recursive: true, force: true })
const entries = Object.fromEntries(['curricula', 'routes', 'modules', 'concepts', 'misconceptions', 'blocks', 'lessons', 'activities', 'scenes', 'competencies', 'evidenceTemplates', 'rubrics', 'glossary', 'sources', 'recommendations', 'visualResources'].map((name) => [name, []]))

const curriculum = { id: 'curriculum.metrology.personal-watchmaking', version: VERSION, title: localized('Metrología aplicada a la relojería personal'), purpose: localized('Aprender a observar, documentar, medir y mejorar modelos sin confundir evidencia de una unidad con verdad industrial.'), routeIds: ['route.metrology.physical-digital-bridge'], languages: ['es-ES'] }
entries.curricula.push(entry('curriculum', curriculum.id)); writeJson(join(OUTPUT, entries.curricula[0].path), curriculum)

const conceptIds = modules.map(([slug]) => `concept.metrology.${slug}`)
const competencyIds = competencyTitles.map((title) => `competency.metrology.${idPart(title)}`)
const moduleIds = modules.map(([slug]) => `module.metrology.${slug}`)
const lessonIds = modules.map(([slug]) => `lesson.metrology.${slug}`)
const activityIds = activities.map((title) => `activity.metrology.${idPart(title)}`)

const route = {
  id: 'route.metrology.physical-digital-bridge', version: VERSION, title: localized('Inspección y metrología relojera'),
  purpose: localized('Construir un dossier reproducible desde la observación inicial hasta una propuesta geométrica revisable.'),
  prerequisiteConceptIds: [], moduleIds, competencyIds, movementIds: [], difficulty: 'intermediate', sourceIds, visualResourceIds: [], demo: false,
  learningDesign: {
    model: 'specialization', entryPolicy: 'diagnostic-optional', completionPolicy: 'evidence',
    milestones: activityIds.map((activityId, index) => ({ id: `milestone.metrology.${String(index + 1).padStart(2, '0')}`, order: index + 1, title: localized(activities[index]), outcome: localized(`Ejecutar ${activities[index].toLowerCase()} con método, alcance, evidencia y límites.`), lessonId: lessonIds[Math.floor(index / 2)], activityId, mode: index === activities.length - 1 ? 'demonstration' : index % 2 === 0 ? 'guided-practice' : 'independent-practice', evidenceLevel: index >= 20 ? 'transfer' : index >= 12 ? 'physical-observation' : 'causal-explanation', optional: false, transferTargetIds: [conceptIds[Math.floor(index / 2)]] })),
    diagnosticActivityIds: [activityIds[0]], demonstrationActivityIds: [activityIds.at(-1)],
  },
}
entries.routes.push(entry('routes', route.id)); writeJson(join(OUTPUT, entries.routes[0].path), route)

for (const [index, [slug, title, focus]] of modules.entries()) {
  if (!SYSTEM5A_METROLOGY_LESSONS[slug]) throw new Error(`Falta catálogo editorial para ${slug}.`)
  const moduleId = moduleIds[index], lessonId = lessonIds[index], conceptId = conceptIds[index]
  const module = { id: moduleId, version: VERSION, title: localized(title), purpose: localized(`Aprender a ${focus}.`), lessonIds: [lessonId] }
  entries.modules.push(entry('modules', moduleId)); writeJson(join(OUTPUT, entries.modules.at(-1).path), module)
  const concept = { id: conceptId, version: VERSION, title: localized(title), summary: localized(`Modelo mental y procedimiento para ${focus}.`), kind: index < 6 ? 'concept' : 'skill', knowledgeType: index < 4 ? 'quantitative' : index < 10 ? 'procedural' : index < 12 ? 'diagnostic' : 'epistemic', prerequisiteIds: index ? [conceptIds[index - 1]] : [], recommendedPrerequisiteIds: [], relatedIds: index > 1 ? [conceptIds[index - 2]] : [], competencyIds: [competencyIds[index % competencyIds.length]], movementIds: [], subsystem: 'metrology', routeIds: [route.id], activityIds: activityIds.slice(index * 2, index * 2 + 2), sourceIds, misconceptionIds: [], plainLanguage: localized(`Aprender a ${focus} sin ocultar lo que no se sabe.`), technicalLanguage: localized(`Contrato metrológico trazable para ${focus}.`), whyItMatters: localized('Permite repetir, revisar y limitar una conclusión sobre una unidad física concreta.'), observableActions: [localized('Define la característica y el marco.'), localized('Registra método, evidencia y limitaciones.')], transferTargetIds: index < modules.length - 1 ? [conceptIds[index + 1]] : [], targetEvidenceLevel: index >= 8 ? 'physical-observation' : 'causal-explanation', availability: 'available' }
  entries.concepts.push(entry('concepts', conceptId)); writeJson(join(OUTPUT, entries.concepts.at(-1).path), concept)
  const blockId = `block.metrology.${slug}`
  const block = { id: blockId, version: VERSION, kind: index % 4 === 0 ? 'worked-example' : 'explanation', title, bodyMarkdown: buildSystem5aLessonBody(slug, title, focus, index), claims: [], pedagogy: { role: index % 4 === 0 ? 'worked-example' : 'explain', conceptIds: [conceptId], estimatedMinutes: 24, userPaced: true } }
  // ContentBlock uses "exercise", not "worked-example", as its storage kind.
  if (block.kind === 'worked-example') block.kind = 'exercise'
  entries.blocks.push(entry('blocks', blockId)); writeJson(join(OUTPUT, entries.blocks.at(-1).path), block)
  const lesson = { id: lessonId, version: VERSION, title, blockIds: [blockId], activityIds: activityIds.slice(index * 2, index * 2 + 2), authoring: { title: localized(title), purpose: localized(`Comprender y aplicar cómo ${focus}.`), objectives: [localized(`Explicar cómo ${focus}.`), localized('Reconocer un resultado inválido o insuficiente.'), localized('Conservar evidencia y alcance.')], prerequisiteConceptIds: index ? [conceptIds[index - 1]] : [], recommendedPrerequisiteConceptIds: [], externalPrerequisites: [], conceptIds: [conceptId], sourceIds, visualResourceIds: [], pedagogy: { role: index === 0 ? 'orientation' : index % 3 === 0 ? 'worked-example' : 'guided-practice', entryCheck: index === 0 ? 'self-check' : 'ungraded-diagnostic', userPacedSegments: true, introducesConceptIds: [conceptId], reinforcesConceptIds: index ? [conceptIds[index - 1]] : [], bridgeConceptIds: [] }, tutorContract: tutorContract(conceptId) } }
  entries.lessons.push(entry('lessons', lessonId)); writeJson(join(OUTPUT, entries.lessons.at(-1).path), lesson)
}

for (const [index, title] of activities.entries()) {
  const activityId = activityIds[index], lessonId = lessonIds[Math.floor(index / 2)], conceptId = conceptIds[Math.floor(index / 2)]
  const competencyId = competencyIds[index % competencyIds.length]
  const sceneId = `scene.metrology.${idPart(title)}`, evidenceId = `evidence.metrology.${idPart(title)}`, rubricId = `rubric.metrology.${idPart(title)}`
  const independent = index % 2 === 1 || index >= 26
  const demonstration = index === activities.length - 1
  const interaction = interactionFor(index, activityId)
  const activity = {
    id: activityId, version: VERSION, title, sceneIds: [sceneId], competencyIds: [competencyId], evidenceTemplateIds: [evidenceId], rubricId,
    projectReference: { kind: 'template-readonly', templateId: 'active-project-v5-projection' },
    authoring: {
      lessonId, title: localized(title), description: localized(`Práctica ${independent ? 'independiente' : 'guiada'} para ${title.toLowerCase()} sobre una unidad o el espécimen sintético, conservando método, evidencia, confianza y límites.`),
      difficulty: index < 8 ? 'introductory' : index < 22 ? 'intermediate' : 'advanced', durationMinutes: index >= 26 ? 35 : 12,
      activityType: ['guided-practice', 'prediction', 'comparison', 'explanation'][index % 4], movementIds: [], familyIds: [], subsystem: 'metrology',
      requiredCapabilities: [], languages: ['es-ES'], offline: true, fidelity: { geometry: 'G0', kinematics: 'K0', physics: 'P0', limitations: ['La práctica registra evidencia; no simula ni certifica comportamiento físico.'] },
      warnings: { es: ['No generalizar una medida de una unidad ni inventar tolerancias.'], en: [] }, sourceIds, visualResourceIds: [], interactionContract: interaction,
      pedagogicalPattern: { enabled: true, stages: ['observe', 'predict', 'execute-or-simulate', 'compare', 'explain', 'record-evidence'] },
      pedagogicalContract: { purpose: demonstration ? 'mastery-check' : independent ? 'independent-practice' : 'guided-practice', assessmentIntent: demonstration ? 'demonstration' : 'formative', requiresConceptIds: [conceptId], introducesConceptIds: [], demonstratesConceptIds: independent ? [conceptId] : [], practicesConceptIds: [conceptId], assessesConceptIds: [conceptId], evidenceLevel: index >= 22 ? 'transfer' : index >= 12 ? 'physical-observation' : 'causal-explanation', supportLevel: demonstration ? 'independent' : independent ? 'faded' : 'guided', remediation: { lessonId, blockId: `block.metrology.${modules[Math.floor(index / 2)][0]}`, conceptIds: [conceptId] }, physicalBoundary: localized('La práctica acredita un método documentado dentro de la Academia. No certifica destreza profesional, calibración ni validez industrial.') },
      feedbackContract: { correctExplanation: localized(`En “${title}” una respuesta sólida conserva característica, referencia, método, evidencia y alcance.`), incorrectDiagnosis: localized(`Revisa si en “${title}” confundiste resolución con exactitud, observación con hipótesis o una unidad con toda una familia.`), causalQuestion: localized(`¿Qué decisión de “${title}” cambia el resultado y cómo podrías comprobarla?`), nextObservation: localized(`Repite “${title}” cambiando una sola condición y documenta el efecto.`), misconceptionIds: [], transferPrompt: localized(`Aplica el criterio de “${title}” a otra pieza sin suponer que comparte geometría o tolerancia.`), requiresIndependentRetryAfterHint: true },
      tutorContract: tutorContract(conceptId),
    },
  }
  entries.activities.push(entry('activities', activityId)); writeJson(join(OUTPUT, entries.activities.at(-1).path), activity)
  const { question, success } = sceneQuestion(index, activityId, title)
  const scene = { id: sceneId, version: VERSION, title, description: `Escena textual y accesible que prepara la operación real “${title}” en la estación de inspección y metrología.`, accessibility: { textualAlternative: `Procedimiento numerado para ${title}. La operación real puede ejecutarse por teclado, coordenadas y tabla en la estación metrológica.`, reducedMotionAlternative: 'No contiene movimiento automático; todos los cambios son discretos y controlados.', keyboardActions: ['Tab para recorrer controles.', 'Intro o Espacio para activar.', 'Coordenadas para sustituir el arrastre.'], colorIndependentCues: ['Texto, icono y estado acompañan cada color.'] }, requiredCapabilities: [], state: { selected: [], visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1 }, timeline: [], overlays: [{ kind: 'text', id: `overlay.${idPart(sceneId)}.boundary`, markdown: 'Abre la estación **Inspección y metrología** para ejecutar la operación sobre el registro local. El original y el proyecto técnico permanecen intactos.', accessibleLabel: 'La operación usa la estación metrológica local y no modifica el proyecto técnico.' }], steps: [{ id: `step.${idPart(sceneId)}.prepare`, instructionMarkdown: `Recupera el criterio del módulo y prepara “${title}”. Identifica unidad, característica, referencia y riesgo de invalidez.`, questions: [], success: [{ condition: 'step-confirmed' }] }, { id: `step.${idPart(sceneId)}.evidence`, instructionMarkdown: `Ejecuta o documenta “${title}” y conserva la evidencia solicitada.`, questions: [question], success: [success] }], restorePreviousState: true }
  entries.scenes.push(entry('scenes', sceneId)); writeJson(join(OUTPUT, entries.scenes.at(-1).path), scene)
  const evidence = { id: evidenceId, version: VERSION, competencyId, kind: index >= 9 ? 'artifact' : 'procedure', scoringMethod: 'rubric', extraction: { id: `rule.extract.${idPart(activityId)}`, version: VERSION, triggerEventType: 'answer-submitted', evidenceType: index >= 12 ? 'measurement' : 'written-response', competencyId, packageId: PACKAGE_ID, activityIds: [activityId], evidenceTemplateId: evidenceId, minimumSessionState: ['active', 'paused', 'completed'], confidence: interaction.responseModel === 'structured-response' ? 0.8 : 1, contentFields: ['sceneId', 'stepId', 'data', 'specimenId', 'componentId', 'imageAssetId', 'regionAnnotationId', 'instrumentId', 'instrumentVerificationId', 'readingIds', 'measurementSeriesId', 'calculation', 'uncertainty', 'findingId', 'confidence', 'comparisonId', 'proposalId', 'hintEventIds', 'adaptations'] } }
  entries.evidenceTemplates.push(entry('evidence', evidenceId)); writeJson(join(OUTPUT, entries.evidenceTemplates.at(-1).path), evidence)
  const condition = demonstration ? { op: 'all', conditions: [{ op: 'minimum-evidence', count: 1 }, { op: 'compare', metric: 'distinct-sessions', compare: 'gte', value: 2 }] } : { op: 'minimum-evidence', count: 1 }
  const rubric = { id: rubricId, version: VERSION, competencyId, rules: [{ id: `rule.${idPart(activityId)}.practice`, version: VERSION, targetState: demonstration ? 'demonstrated' : 'practising', acceptedEvidenceKinds: ['answer', 'procedure', 'observation', 'artifact', 'human-review'], minimumEvidence: 1, minimumScore: 0.7, minimumDistinctSessions: demonstration ? 2 : 1, minimumSpanDays: 0, explanationTemplate: 'Se evalúan método, unidad, repetición, trazabilidad, incertidumbre, interpretación y reconocimiento de invalidez; no solo el número.' }], assessmentRule: { id: `rule.composite.${idPart(activityId)}`, version: VERSION, competencyId, targetState: demonstration ? 'demonstrated' : 'practising', condition } }
  entries.rubrics.push(entry('rubrics', rubricId)); writeJson(join(OUTPUT, entries.rubrics.at(-1).path), rubric)
}

for (const [index, title] of competencyTitles.entries()) {
  const competency = { id: competencyIds[index], version: VERSION, title, description: `${title} con método, trazabilidad, límites y evidencia aplicados a una unidad concreta.`, prerequisites: index ? [competencyIds[index - 1]] : [], authoring: { title: localized(title), description: localized(`${title} sin generalizar resultados ni ocultar incertidumbre.`), movementIds: [], subsystem: 'metrology', skillType: index < 3 ? 'knowledge' : index < 12 ? 'measurement' : index < 16 ? 'reasoning' : 'procedure', sourceIds } }
  entries.competencies.push(entry('competencies', competency.id)); writeJson(join(OUTPUT, entries.competencies.at(-1).path), competency)
  const recommendation = { id: `recommendation.metrology.retain.${idPart(title)}`, version: VERSION, kind: 'retention', title: localized(`Repasar: ${title}`), reason: localized('La retención exige una sesión independiente; el motor programará ventanas de 1, 7 y 21 días.'), rule: 'after-demonstration:1d,7d,21d;different-session=true', priority: 300 - index, target: { kind: 'competency', id: competency.id }, evidenceTemplateIds: [], required: false }
  entries.recommendations.push(entry('recommendations', recommendation.id)); writeJson(join(OUTPUT, entries.recommendations.at(-1).path), recommendation)
}

const glossaryTerms = ['metrología', 'magnitud', 'mensurando', 'unidad', 'resolución', 'exactitud', 'precisión', 'repetibilidad', 'error', 'incertidumbre', 'tolerancia', 'calibración', 'verificación', 'trazabilidad', 'datum', 'paralaje', 'serie', 'hallazgo', 'hipótesis', 'nominal', 'valor adoptado', 'espécimen', 'instrumento', 'evidencia']
for (const term of glossaryTerms) {
  const id = `term.metrology.${idPart(term)}`
  const record = { id, version: VERSION, term, definitionMarkdown: `**${term}** se utiliza en esta ruta con alcance explícito y ligado a una unidad, método o fuente. Consulta el VIM para la definición metrológica formal cuando corresponda.`, language: 'es-ES', authoring: { terms: { es: term, en: term }, synonyms: { es: [], en: [] }, discouragedTerms: [], simpleDefinition: localized(`Concepto necesario para documentar ${term} sin ambigüedad.`), technicalDefinition: localized(`Término usado bajo la autoridad y límites declarados en las fuentes de metrología.`), context: localized('Inspección y metrología relojera personal.'), sourceIds } }
  entries.glossary.push(entry('glossary', id)); writeJson(join(OUTPUT, entries.glossary.at(-1).path), record)
}

for (const source of sources) { entries.sources.push(entry('sources', source.id)); writeJson(join(OUTPUT, entries.sources.at(-1).path), source) }

const manifest = { format: 'wplab-learning-pack', formatVersion: 1, schemaId: 'learning-pack-v1', packageVersion: VERSION, id: PACKAGE_ID, title: 'Inspección y metrología relojera', distribution: 'local-unsigned', editorialStatus: 'in-review', authors: [{ name: 'Watch Prototype Lab' }], languages: ['es-ES'], dependencies: [], requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'viewport.overlay.labels@^1.0.0'], movements: [], assets: [], entries, minimumAppVersion: '0.8.0', createdAt: CREATED_AT }
writeJson(join(OUTPUT, 'manifest.json'), manifest)

console.log(`Generated ${PACKAGE_ID}@${VERSION}: ${modules.length} modules, ${activities.length} activities, ${competencyTitles.length} competencies.`)
